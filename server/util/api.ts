import {Request, Response} from 'express-serve-static-core';

export function apiResponse<T>(handler: (req: Request) => T | Promise<T>) {
  return async function(req: Request, res: Response) {
    try {
      const data = await handler(req);
      res.send({status: `ok`, data});
    } catch (err) {
      console.error(`api error`, err);
      res.status(err.status || 500).send({status: `error`, message: err.message, data: err.stack.split(`\n`)});
    }
  };
}
