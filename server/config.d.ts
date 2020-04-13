import {DbConfiguration} from '../common/api/db-schema';

export interface ServeConfig {
  port: number;
  hostname: string;
}

export interface ServerConfig {
  serve: ServeConfig;
  db: DbConfiguration;
}
