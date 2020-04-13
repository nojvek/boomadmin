export const enum DbType {
  mysql = `mysql`,
  postgresql = `postgresql`,
}

export interface DbConfiguration {
  dbType: DbType;
  host: string;
  user: string;
  password: string;
  database: string;
  /** label columns for tables, if not name|title|label */
  tableLabelColumns: {[tableName: string]: string};
}

export interface DbSchema {
  dbType: DbType;
  /** name of the database / project */
  name: string;
  tables: {[name: string]: DbTable};
}

export interface DbTable {
  tableName: string;

  columns: {[name: string]: DbTableColumn};

  /** primary key - string[] for composite keys */
  primaryColumnName?: string | string[];

  meta: {
    /** estimated number of rows */
    numRows?: number;
    numDataBytes?: number;
    numIndexBytes?: number;
    numTotalBytes?: number;
  };

  // auto mapped keys ----

  /** column that a human readable name to the row, mostly a column with 'name' or 'title' in the column name */
  nameColumnName?: string;

  /** reverse foreign key mapping */
  referencedBy?: DbForeignKeyRef[];
}

export interface DbTableColumn {
  columnName: string;

  ordinalPosition: number;

  columnType: string;

  columnKey: string;

  columnDefault: string;

  isNullable: boolean;

  /** e.g auto_increment */
  extra: string;

  // auto mapped keys ----

  /** table which the column belongs to */
  tableName: string;

  /** automatic foreign key mapping */
  refersTo?: DbForeignKeyRef;
}

export interface DbForeignKeyRef {
  /** source column name that belongs to the current table */
  srcColumnName: string;
  /** destination table name */
  destTableName: string;
  /** destination column name */
  destColumnName: string;
}

export interface DbColumnRefRow {
  columnName: string;
  tableName: string;
  referencedColumnName: string;
  referencedTableName: string;
}
