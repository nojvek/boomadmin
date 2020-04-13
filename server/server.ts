/* eslint-env node */

import fs from 'fs';
import rison from 'rison';
import express, {Router} from 'express';
import serverTiming from 'server-timing';
import {SelectFromTableParams} from '../common/api/api-types';
import {ServerConfig} from './config';
import {apiResponse} from './util/api';
import {connectToDb, getDbSchema, selectFromTable, countForeignReferences} from './api/query';

// setup express as server
const app = express();
app.use(serverTiming({precision: 2}));

// load dbConf
const rootDir = `${__dirname}/..`;
const conf: ServerConfig = JSON.parse(fs.readFileSync(`${rootDir}/config.json`, `utf-8`));
const dbConf = conf.db;
const {port, hostname} = conf.serve;

// start server and connect to db
app.listen(port, hostname, () => console.info(`listening on ${hostname}:${port}`));
connectToDb(dbConf);

// serve frontend assets
app.use(`/`, express.static(`${rootDir}/dist`));

// api router
const apiRouter = Router();
app.use(`/api`, apiRouter);

apiRouter
  .get(
    `/_dbSchema`,
    apiResponse((_req) => getDbSchema()),
  )
  .get(
    `/select`,
    apiResponse((req) => {
      const queryStr = req.url.substr(req.url.indexOf(`?`) + 1);
      const query: SelectFromTableParams = rison.decode(decodeURI(queryStr));
      console.info(`/select`, query);
      return selectFromTable(query);
    }),
  )
  .get(
    `/refCount/:tableName/:columnName::rowId`,
    apiResponse((req) => {
      const {tableName, columnName, rowId} = req.params;
      return countForeignReferences({tableName, columnName, rowId});
    }),
  );
