import {SelectQuery} from './sql-types';

export type SelectFromTableParams = SelectQuery;
export type SelectFromTableResult = Array<{[column: string]: any}>;

export interface CountForeignReferencesParams {
  /** source table */
  tableName: string;
  /** primary column/key */
  columnName: string;
  /** value of primary key */
  rowId: string;
}

export type CountForeignReferencesResult = {[tableName: string]: number};
