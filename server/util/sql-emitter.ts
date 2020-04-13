import {WhereFilter, OrderByField} from '../../common/api/sql-types';

/**
 * Simple helper functions that let us build SQL strings from clause object trees
 */

// TODO: add kind to every AST node, so we can just write a node visitor that compiles to sql
// otherwise the type unions will get pretty crazy
export const enum ClauseKind {
  Expr = `expr`,
  SelectAs = `selectAs`,
}

export type FromTableClause =
  | string
  | {
      table: string;

      // table alias e.g t1, t2 (useful in sub-queries)
      as: string;
    };

export interface SelectClause {
  /** table to select from */
  from?: FromTableClause;

  /** columns to show */
  columns?: Array<string | SelectAsClause | ExprClause>;

  /** filters to apply */
  where?: WhereFilter[];

  /* group by fields */
  groupBy?: string[];

  /** how to sort */
  orderBy?: OrderByField[];

  /** number of results to limit */
  limit?: number;

  /** show results from X offset, used with limit to paginate results */
  offset?: number;
}

export interface SelectAsClause {
  kind: ClauseKind.SelectAs;

  /** sub select expression */
  select: SelectClause;

  /** label the sub-select as a virtual column */
  as: string;
}

export interface ExprClause {
  kind: ClauseKind.Expr;

  expr: string; // TODO expand to expr sub AST

  as?: string;
}

/** escape strings so we don't conflict with sql keywords */
export function escapeStr(str: string): string {
  return `\`${str}\``;
}

/** escape x.y into `x`.`y` e.g information_schema.tables */
export function escapeMemberAccessStr(str: string): string {
  if (typeof str !== `string`) {
    throw new Error(`escapeMemberAccessStr expects a string, ${str} given`);
  }
  return str
    .split(`.`)
    .map(escapeStr)
    .join(`.`);
}

function selectAs(clause: SelectAsClause): string {
  return `(${select(clause.select, {singleLine: true})}) AS ${escapeStr(clause.as)}`;
}

export function select(clause: SelectClause, {singleLine = false} = {}): string {
  const segments = [];

  if (clause.columns) {
    const fieldsSql = clause.columns
      // column can be a simple string or a sub 'select .. as ..' expression
      .map((col) => {
        if (typeof col === `string`) {
          return escapeMemberAccessStr(col);
        } else if (col.kind === ClauseKind.Expr) {
          return col.as ? `${col.expr} AS ${escapeStr(col.as)}` : col.expr;
        } else if (col.kind === ClauseKind.SelectAs) {
          return selectAs(col);
        } else {
          throw new Error(`Invalid select.column:${col}`);
        }
      })
      .join(`, `);
    segments.push(`SELECT ${fieldsSql}`);
  } else {
    segments.push(`SELECT *`);
  }

  // support both "FROM `table`" and  "FROM `table` table_alias"
  if (clause.from) {
    if (typeof clause.from === `string`) {
      segments.push(`FROM ${escapeMemberAccessStr(clause.from)}`);
    } else {
      segments.push(`FROM ${escapeMemberAccessStr(clause.from.table)} ${escapeStr(clause.from.as)}`);
    }
  }

  if (clause.where?.length > 0) {
    const whereSql = clause.where
      .map((whereClause) => [escapeMemberAccessStr(whereClause.field), whereClause.op, whereClause.value].join(` `))
      .join(` AND `);
    segments.push(`WHERE ${whereSql}`);
  }

  if (clause.groupBy?.length > 0) {
    const groupBySql = clause.groupBy.map((field) => escapeMemberAccessStr(field)).join(`, `);
    segments.push(`GROUP BY ${groupBySql}`);
  }

  if (clause.orderBy?.length > 0) {
    const orderBySql = clause.orderBy
      .map((orderByField) => `${escapeStr(orderByField.field)} ${orderByField.order}`)
      .join(`, `);
    segments.push(`ORDER BY ${orderBySql}`);
  }

  if (clause.limit) {
    segments.push(`LIMIT ${clause.limit}`);
  }

  const sql = segments.join(singleLine ? ` ` : `\n`);
  console.error(sql + `\n`);
  return sql;
}
