import { NextFunction, Request, Response } from 'express';
import { v4 } from 'uuid';

import database from './database';
import { TableName } from './enums';
import { singularise } from './util';

export const createRecord = <T>(tableName: TableName, doRespond = true) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = v4();
      await database.knex<T>(tableName)
        .insert({
          id,
          ...req.body[singularise(tableName)]
        });
      if (doRespond) {
        res.sendStatus(204);
      } else {
        res.locals.id = id;
        next();
      }
    } catch (error) {
      req.logger.error('error while creating record', {
        tableName,
        error
      });
      res.sendStatus(500);
    }
  };
}

export const deleteRecord = (tableName: TableName, doRespond = true) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const numResults = await database.knex(tableName)
        .del()
        .where('id', req.params.id);
      if (numResults === 0) {
        res.sendStatus(404);
        return;
      }
      if (doRespond) {
        res.sendStatus(204);
      } else {
        next();
      }
    } catch (error) {
      req.logger.error('error while deleting record', {
        tableName,
        error
      });
      res.sendStatus(500);
    }
  };
}

export const getOneRecord = <T>(tableName: TableName) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await database.knex<T>(tableName)
        .where('id', req.params.id)
        .first();
      if (!record) {
        res.sendStatus(404);
        return;
      }

      res.json({
        [singularise(tableName)]: record
      });
      next();
    } catch (error) {
      req.logger.error('error while getting record', {
        tableName,
        error
      });
      res.sendStatus(500);
    }
  };
};

export const getAllRecords = <T>(tableName: TableName) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const records = await database.knex<T>(tableName);
      res.json({
        [tableName]: records
      });
      next();
    } catch (error) {
      req.logger.error('error while getting all records', {
        tableName,
        error
      });
      res.sendStatus(500);
    }
  };
};

export const updateRecord = <T>(tableName: TableName, doRespond = true) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const numResults = await database.knex<T>(tableName)
        .where('id', req.params.id)
        .update(req.body[singularise(tableName)]);
      if (numResults === 0) {
        res.sendStatus(404);
        return;
      }
      if (doRespond) {
        res.sendStatus(204);
      } else {
        next();
      }
    } catch (error) {
      req.logger.error('error while updating record', {
        tableName,
        error
      });
      res.sendStatus(500);
    }
  };
}
