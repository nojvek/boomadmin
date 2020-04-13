/**
 * Utility functions to map location.href and location.hash to hash state object and vice versa
 */

import rison from 'rison';
import {SelectQuery} from 'common/api/sql-types';

export const SchemaTable = `$schema`;

export interface UrlState {
  selectQuery: SelectQuery;
}

export function parseUrlState(url: string): UrlState {
  const hash = /#(.*)$/.exec(url)?.[1];
  if (hash) {
    const selectQuery: SelectQuery = rison.decode(decodeURI(hash));
    return {selectQuery};
  }

  return {selectQuery: null};
}

export interface MakeHrefParams {
  tableName?: string;
  columnName?: string;
  value?: string;
  selectQuery?: SelectQuery;
}

/**
 * returns href string that can be passed as <a href/> or location.href in rison form
 */
export function makeHref(params: MakeHrefParams): string {
  const {tableName, value, columnName} = params;
  let selectQuery = params.selectQuery;
  if (!selectQuery) {
    selectQuery = {from: tableName};
    if (columnName && value) {
      selectQuery.where = [{field: columnName, op: `=`, value}];
    }
  }

  return `#${encodeURI(rison.encode(selectQuery))}`;
}

/**
 * updates location.hash, only call this if navigation can't be done via a(href) method
 */
export function setLocationHash({selectQuery}: UrlState) {
  const newHash = makeHref({selectQuery});
  // don't set the hash again, if selectQuery is the same
  if (newHash !== location.hash) {
    location.hash = newHash;
  }
}
