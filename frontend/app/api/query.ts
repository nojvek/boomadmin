import {apiClient} from '../util/api-client';
import {DbSchema} from 'common/api/db-schema';
import {jsonUrlDecode, jsonUrlEncode} from 'common/util/json-url';
import {
  CountForeignReferencesResult,
  CountForeignReferencesParams,
  SelectFromTableParams,
  SelectFromTableResult,
} from 'common/api/api-types';

const apiUrl = `/api`;

export async function getDbSchema(): Promise<DbSchema> {
  return await apiClient.get(`${apiUrl}/_dbSchema`);
}

export async function selectFromTable(query: SelectFromTableParams): Promise<SelectFromTableResult> {
  return await apiClient.post(`${apiUrl}/select`, query);
}

export async function countForeignReferences({
  tableName,
  columnName,
  rowId,
}: CountForeignReferencesParams): Promise<CountForeignReferencesResult> {
  return await apiClient.get(`${apiUrl}/refCount/${tableName}/${columnName}:${rowId}`);
}
