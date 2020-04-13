import mysql from 'mysql2';

import {camelCaseObj} from '../../common/util/string';
import {DbSchema, DbTable, DbTableColumn, DbColumnRefRow, DbConfiguration} from '../../common/api/db-schema';
import {select, SelectAsClause, escapeMemberAccessStr, ClauseKind, ExprClause} from '../util/sql-emitter';
import {CountForeignReferencesParams, SelectFromTableParams} from '../../common/api/api-types';

// static db reference to db related globals
const db = {
  conn: null as any, // connection
  conf: null as DbConfiguration,
  schema: null as DbSchema,
};

export function connectToDb(dbConf: DbConfiguration): typeof db {
  db.conf = dbConf;
  db.conn = mysql
    .createPool({
      host: db.conf.host || `localhost`,
      user: db.conf.user,
      password: db.conf.password,
      database: db.conf.database,
    })
    .promise();

  return db;
}

interface TableRow {
  tableName: string;
  tableRows: number;
  dataLength: number;
  indexLength: number;
}

interface TableColumnRow {
  tableName: string;
  columnName: string;
  ordinalPosition: number;
  columnType: string;
  columnKey: string;
  columnDefault: string;
  isNullable: boolean;
  extra: string;
}

export async function getDbSchema(): Promise<DbSchema> {
  const dbConf = db.conf;
  // we don't individually await since we want to query from db in parallel

  const tablesSql = select({
    from: `information_schema.tables`,
    columns: [`table_name`, `table_rows`, `data_length`, `index_length`],
    where: [
      {field: `table_schema`, op: `=`, value: `?`},
      {field: `table_type`, op: `=`, value: `'BASE TABLE'`},
    ],
  });
  const tablesPromise = db.conn.execute(tablesSql, [db.conf.database]);

  const columnsSql = select({
    from: `information_schema.columns`,
    columns: [
      `table_name`,
      `column_name`,
      `ordinal_position`,
      `column_type`,
      `column_key`,
      `column_default`,
      `is_nullable`,
      `extra`,
    ],
    where: [{field: `table_schema`, op: `=`, value: `?`}],
  });
  const columnsPromise = db.conn.execute(columnsSql, [db.conf.database]);

  const refsSql = select({
    from: `information_schema.key_column_usage`,
    columns: [`table_name`, `column_name`, `referenced_table_name`, `referenced_column_name`],
    where: [{field: `referenced_table_schema`, op: `=`, value: `?`}],
  });
  const refsPromise = db.conn.execute(refsSql, [db.conf.database]);

  // create empty schema
  const dbTables: {[tableName: string]: DbTable} = {};
  const dbSchema: DbSchema = {
    dbType: db.conf.dbType,
    name: db.conf.database,
    tables: dbTables,
  };

  // add tables
  const tableRows: TableRow[] = (await tablesPromise)[0].map(camelCaseObj);
  for (const tableRow of tableRows) {
    const {tableName, tableRows, dataLength, indexLength} = tableRow;
    dbTables[tableName] = {
      tableName,
      columns: {},
      nameColumnName: dbConf.tableLabelColumns?.[tableName] || ``,
      meta: {
        numRows: tableRows,
        numDataBytes: dataLength,
        numIndexBytes: indexLength,
        numTotalBytes: dataLength + indexLength,
      },
    };
  }

  // add columns to tables
  const columnRows: TableColumnRow[] = (await columnsPromise)[0].map(camelCaseObj);
  const dbColumns: DbTableColumn[] = columnRows.map((obj: any) => {
    // sql returns "TRUE" / "FALSE" string, convert to boolean
    obj.isNullable = obj.isNullable === `YES` ? true : false;
    return obj;
  });

  for (const dbColumn of dbColumns) {
    const tableName = dbColumn.tableName;
    const dbTable = dbSchema.tables[tableName];
    if (!dbTable) {
      continue; // could be a view, skip it
    }

    const tableColumns = dbTable.columns;
    tableColumns[dbColumn.columnName] = dbColumn;

    if (dbColumn.columnKey === `PRI`) {
      if (!dbTable.primaryColumnName) {
        dbTable.primaryColumnName = dbColumn.columnName;
      } else {
        // multiple primary keys, convert to composite primary key as an array
        if (!Array.isArray(dbTable.primaryColumnName)) {
          dbTable.primaryColumnName = [dbTable.primaryColumnName];
        }
        dbTable.primaryColumnName.push(dbColumn.columnName);
      }
    }

    // heuristic: if we see 'name'|'title'|'description' column, we use it as the nameColumn
    // we use this to automatically label foreign_key ids with readable human names
    if (/(name|title|label)$/i.test(dbColumn.columnName) && !dbTable.nameColumnName) {
      dbTable.nameColumnName = dbColumn.columnName;
    }
  }

  // map table column references
  const refRows: DbColumnRefRow[] = (await refsPromise)[0].map(camelCaseObj);
  for (const refRow of refRows) {
    const srcTable = dbTables[refRow.tableName];
    if (!srcTable) {
      continue; // skip reference mapping for views
    }

    const srcColumn = srcTable.columns[refRow.columnName];
    const referencedTable = dbTables[refRow.referencedTableName];

    srcColumn.refersTo = {
      srcColumnName: refRow.columnName,
      destTableName: refRow.referencedTableName,
      destColumnName: refRow.referencedColumnName,
    };

    referencedTable.referencedBy = referencedTable.referencedBy || [];
    referencedTable.referencedBy.push({
      srcColumnName: refRow.referencedColumnName,
      destTableName: refRow.tableName,
      destColumnName: refRow.columnName,
    });
  }

  // get accurate count of tables since innodb can return very inaccurate results
  // only do it if the estimated row count <10k, otherwise it takes a really long time for large tables
  const accurateRowCountLimit = 10_000;
  const tableRowCountSql = select({
    columns: tableRows
      .filter((table) => table.tableRows < accurateRowCountLimit)
      .map((table) => ({
        kind: ClauseKind.SelectAs,
        select: {
          from: table.tableName,
          columns: [{kind: ClauseKind.Expr, expr: `count(*)`}],
        },
        as: table.tableName,
      })),
  });

  console.info(tableRowCountSql);
  const tableRowCountResults = await db.conn.execute(tableRowCountSql);
  const tableRowCounts = tableRowCountResults[0][0];
  for (const [tableName, rowCount] of Object.entries(tableRowCounts)) {
    dbTables[tableName].meta.numRows = rowCount as number;
  }

  // add to db so its cached for other api calls
  db.schema = dbSchema;
  return dbSchema;
}

export async function selectFromTable(selectQuery: SelectFromTableParams): Promise<any> {
  const tableName = selectQuery.from;
  const dbSchema = db.schema || (await getDbSchema());
  const dbTable = dbSchema.tables[tableName];

  if (!dbTable) {
    throw new Error(`Invalid tableName: '${tableName}'`);
  }

  const tableColumns = dbTable.columns;
  const queryAggregate = selectQuery.aggregate;
  let groupByFields: string[];

  let selectColumns: Array<string | SelectAsClause | ExprClause> = [];
  if (queryAggregate) {
    selectColumns = [];
    const {math, on, groupBy} = queryAggregate;
    selectColumns.push({kind: ClauseKind.Expr, expr: `${math}(${on || `*`})`, as: `${math}${on ? `_${on}` : ``}`});
    if (queryAggregate.groupBy) {
      selectColumns = [...groupBy, ...selectColumns];
      groupByFields = groupBy;
    }
  } else if (selectQuery.select?.length > 0) {
    selectColumns = selectQuery.select;
  } else {
    selectColumns = Object.keys(tableColumns).sort(
      (a, b) => tableColumns[a].ordinalPosition - tableColumns[b].ordinalPosition,
    );
  }

  const columnRefs = Object.values(tableColumns)
    .filter((col) => selectColumns.includes(col.columnName) && col.refersTo)
    .map((col) => col.refersTo);

  // add foreign key references as sub selects so we get human readable id labels
  let subTableIdx = 0;
  for (const colRef of columnRefs) {
    const destTable = dbSchema.tables[colRef.destTableName];
    if (destTable.nameColumnName) {
      subTableIdx++;
      const subTableName = `t${subTableIdx}`;
      selectColumns.push({
        kind: ClauseKind.SelectAs,
        select: {
          from: {table: colRef.destTableName, as: subTableName},
          columns: [`${subTableName}.${destTable.nameColumnName}`],
          where: [
            {
              field: `${subTableName}.${colRef.destColumnName}`,
              op: `=`,
              value: escapeMemberAccessStr(`${tableName}.${colRef.srcColumnName}`),
            },
          ],
        },
        as: `$label$${colRef.srcColumnName}`,
      });
    }
  }

  const params: string[] = [];
  const whereClause = (selectQuery.where || []).map(({field, op, value}) => {
    // TODO: more sql checking, since this comes from UI
    // parametrize where values
    if (value !== undefined) {
      if (op === `like` && !value.includes(`%`)) {
        value = `%${value}%`;
      }
      params.push(value);
    }

    // TODO: handle this more elegantly
    if (op === `is null` || op === `is not null`) {
      return {field, op};
    } else {
      return {field, op, value: `?`};
    }
  });

  const sql = select({
    from: tableName,
    columns: selectColumns,
    where: whereClause,
    groupBy: groupByFields,
    orderBy: selectQuery.orderBy,
    limit: selectQuery.limit || 300,
  });

  // TODO: mysql columnTypes are defined here
  // https://dev.mysql.com/doc/dev/mysql-server/latest/field__types_8h.html#a69e798807026a0f7e12b1d6c72374854
  // work on function that retuns column types
  const [rows] = await db.conn.execute(sql, params);
  return rows;
}

export async function countForeignReferences({tableName, rowId}: CountForeignReferencesParams): Promise<any> {
  const dbSchema = db.schema || (await getDbSchema());
  const dbTable = dbSchema.tables[tableName];
  if (!dbTable) {
    throw new Error(`Invalid tableName: '${tableName}'`);
  }

  const referencedBy = dbTable.referencedBy;

  if (referencedBy) {
    const sql = select({
      columns: referencedBy.map((ref) => ({
        kind: ClauseKind.SelectAs,
        select: {
          from: ref.destTableName,
          columns: [{kind: ClauseKind.Expr, expr: `count(*)`}],
          where: [{field: ref.destColumnName, op: `=`, value: `?`}],
        },
        as: `${ref.destTableName}.${ref.destColumnName}`,
      })),
    });

    const [rows] = await db.conn.execute(sql, new Array(referencedBy.length).fill(rowId));
    return rows[0];
  } else {
    return {};
  }
}
