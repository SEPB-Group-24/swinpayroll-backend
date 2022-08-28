import fs from 'fs';
import { AddressInfo } from 'net';

import cors from 'cors';
import express, { Request, Response } from 'express';
import multer from 'multer';

import authManager from './auth-manager';
import { httpPort } from './config';
import { UPLOADS_DIR } from './constants';
import { Role, TableName } from './enums';
import database from './database';
import inputValidator from './input-validator';
import Logger from './logger';
import { User } from './models';
import { createRecord, deleteRecord, getAllRecords, getOneRecord, updateRecord } from './resources';

const upload = multer();

class HttpServer {
  private apiV1Router = express.Router();
  private app = express();
  private logger = new Logger('http-server');
  private requestId = 0;

  constructor() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(authManager.initialise());
    this.app.use((req, res, next) => {
      req.logger = Logger.wrapWithMetadata(this.logger, {
        requestId: ++this.requestId
      });
      req.logger.debug('request', {
        method: req.method,
        url: req.url
      });
      next();
    });
    this.app.use('/api/v1', this.apiV1Router);

    this.defineRoutes();
    const server = this.app.listen(httpPort, () => {
      this.logger.info('listening', {
        port: (server.address() as AddressInfo).port
      });
    });
  }

  private defineRoutes() {
    // Auth
    this.apiV1Router.post('/auth/log_in', authManager.authenticate(), (req, res) => {
      const user = req.user as User;
      res.json(authManager.signUserObject(user));

      req.logger.info('logged in user', {
        user
      });
    });
    this.apiV1Router.get('/auth/verify', async (req, res) => {
      const { token } = req.query;
      if (typeof token !== 'string') {
        res.sendStatus(400);
        return;
      }
      const decoded = await authManager.decodeUserToken(token);
      if (!decoded) {
        req.logger.warn('refused to verify user due to unknown token decoding error');
        res.sendStatus(401);
        return;
      }

      try {
        const user = await database.knex<User>(TableName.USERS)
          .where('id', decoded.id)
          .first();
        if (user && authManager.tokenIsValid(decoded)) {
          res.json(authManager.signUserObject(user));
        } else {
          req.logger.warn('refused to verify user, token is invalid', {
            iat: decoded.iat
          });
          res.sendStatus(401);
        }
      } catch (err) {
        req.logger.error('error while verifying user', {
          err
        });
        res.sendStatus(500);
      }
    });

    // Employees
    this.apiV1Router.get('/employees', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getAllRecords(TableName.EMPLOYEES));
    this.apiV1Router.get('/employees/:id', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getOneRecord(TableName.EMPLOYEES));
    this.apiV1Router.get('/employees/:id/photo',  authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), (req, res) => {
      res.sendFile(`${UPLOADS_DIR}/employee_photos/${req.params.id}`, (error) => {
        if (error) {
          res.sendStatus(404);
        }
      });
    });

    const employeeUploadFields = upload.fields([
      {
        maxCount: 1,
        name: 'cv'
      },
      {
        maxCount: 1,
        name: 'photo'
      }
    ]);
    const employeeFileStructure = [
      ['cv', 'application/pdf'],
      ['photo', 'image/']
    ];
    const handleEmployeeUploads = async (req: Request, res: Response) => {
      try {
        await Promise.all(Object.entries(req.files ?? {}).map(([name, [file]]) => {
          return fs.promises.writeFile(`${UPLOADS_DIR}/employee_${name}s/${req.params.id ?? res.locals.id}`, file.buffer);
        }));
        res.sendStatus(204);
      } catch (error) {
        req.logger.error('error while handling employee uploads', {
          error
        });
        res.sendStatus(500);
      }
    };
    this.apiV1Router.post('/employees', authManager.assertRoles(Role.LEVEL_1), employeeUploadFields, inputValidator.validateModel(TableName.EMPLOYEES), (req, res, next) => {
      const files = req.files as Record<string, Express.Multer.File[]>;
      for (const [name, mimeStart] of employeeFileStructure) {
        const file = files[name]?.[0];
        if (!file?.mimetype.startsWith(mimeStart)) {
          res.sendStatus(400);
          return;
        }
      }

      next();
    }, createRecord(TableName.EMPLOYEES, false), handleEmployeeUploads);
    this.apiV1Router.put('/employees/:id', authManager.assertRoles(Role.LEVEL_1), employeeUploadFields, inputValidator.validateModel(TableName.EMPLOYEES), (req, res, next) => {
      const files = req.files as Record<string, Express.Multer.File[]>;
      for (const [name, mimeStart] of employeeFileStructure) {
        const file = files[name]?.[0];
        if (file && !file.mimetype.startsWith(mimeStart)) {
          res.sendStatus(400);
          return;
        }
      }

      next();
    }, updateRecord(TableName.EMPLOYEES, false), handleEmployeeUploads);
    this.apiV1Router.delete('/employees/:id', authManager.assertRoles(Role.LEVEL_1), deleteRecord(TableName.EMPLOYEES));

    // Positions
    this.apiV1Router.get('/positions', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getAllRecords(TableName.POSITIONS));
    this.apiV1Router.get('/positions/:id', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getOneRecord(TableName.POSITIONS));
    // TODO POST and PUT
    this.apiV1Router.delete('/positions/:id', authManager.assertRoles(Role.LEVEL_1), deleteRecord(TableName.POSITIONS));

    // Projects
    this.apiV1Router.get('/projects', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getAllRecords(TableName.PROJECTS));
    this.apiV1Router.get('/projects/:id', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getOneRecord(TableName.PROJECTS));
    // TODO POST and PUT
    this.apiV1Router.delete('/projects/:id', authManager.assertRoles(Role.LEVEL_1), deleteRecord(TableName.PROJECTS));
  }
}

export default new HttpServer();
