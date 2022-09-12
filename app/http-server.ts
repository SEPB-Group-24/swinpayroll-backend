import fs from 'fs';
import { AddressInfo } from 'net';

import cors from 'cors';
import express, { Request, Response } from 'express';
import multer from 'multer';

import authManager from './auth-manager';
import { httpPort } from './config';
import { UPLOADS_DIR } from './constants';
import crypto from './crypto';
import { Role, TableName } from './enums';
import database from './database';
import inputValidator from './input-validator';
import Logger from './logger';
import { UserCreate, UserStore } from './models';
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
      const user = req.user as UserStore;
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
        const user = await database.knex<UserStore>(TableName.USERS)
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

    // Insurance Companies
    this.apiV1Router.get('/insurance_companies', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getAllRecords(TableName.INSURANCE_COMPANIES));
    this.apiV1Router.get('/insurance_companies/:id', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getOneRecord(TableName.INSURANCE_COMPANIES));
    this.apiV1Router.post('/insurance_companies', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.INSURANCE_COMPANIES), createRecord(TableName.INSURANCE_COMPANIES));
    this.apiV1Router.put('/insurance_companies/:id', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.INSURANCE_COMPANIES), updateRecord(TableName.INSURANCE_COMPANIES));
    this.apiV1Router.delete('/insurance_companies/:id', authManager.assertRoles(Role.LEVEL_1), deleteRecord(TableName.INSURANCE_COMPANIES));

    // Insurance Policies
    this.apiV1Router.get('/insurance_policies', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getAllRecords(TableName.INSURANCE_POLICIES));
    this.apiV1Router.get('/insurance_policies/:id', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getOneRecord(TableName.INSURANCE_POLICIES));
    this.apiV1Router.post('/insurance_policies', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.INSURANCE_POLICIES), createRecord(TableName.INSURANCE_POLICIES));
    this.apiV1Router.put('/insurance_policies/:id', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.INSURANCE_POLICIES), updateRecord(TableName.INSURANCE_POLICIES));
    this.apiV1Router.delete('/insurance_policies/:id', authManager.assertRoles(Role.LEVEL_1), deleteRecord(TableName.INSURANCE_POLICIES));

    // Positions
    this.apiV1Router.get('/positions', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getAllRecords(TableName.POSITIONS));
    this.apiV1Router.get('/positions/:id', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getOneRecord(TableName.POSITIONS));
    this.apiV1Router.post('/positions', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.POSITIONS), createRecord(TableName.POSITIONS));
    this.apiV1Router.put('/positions/:id', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.POSITIONS), updateRecord(TableName.POSITIONS));
    this.apiV1Router.delete('/positions/:id', authManager.assertRoles(Role.LEVEL_1), deleteRecord(TableName.POSITIONS));

    // Projects
    this.apiV1Router.get('/projects', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getAllRecords(TableName.PROJECTS));
    this.apiV1Router.get('/projects/:id', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getOneRecord(TableName.PROJECTS));
    this.apiV1Router.post('/projects', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.PROJECTS), createRecord(TableName.PROJECTS));
    this.apiV1Router.put('/projects/:id', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.PROJECTS), updateRecord(TableName.PROJECTS));
    this.apiV1Router.delete('/projects/:id', authManager.assertRoles(Role.LEVEL_1), deleteRecord(TableName.PROJECTS));

    // Subcontracts
    this.apiV1Router.get('/subcontracts', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getAllRecords(TableName.SUBCONTRACTS));
    this.apiV1Router.get('/subcontracts/:id', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getOneRecord(TableName.SUBCONTRACTS));
    this.apiV1Router.post('/subcontracts', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.SUBCONTRACTS), createRecord(TableName.SUBCONTRACTS));
    this.apiV1Router.put('/subcontracts/:id', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.SUBCONTRACTS), updateRecord(TableName.SUBCONTRACTS));
    this.apiV1Router.delete('/subcontracts/:id', authManager.assertRoles(Role.LEVEL_1), deleteRecord(TableName.SUBCONTRACTS));

    // Users
    const transformCallback = async (user: UserCreate) => {
      const { password, password_confirmation, ...rest } = user;
      if (!password) {
        return user;
      }

      return {
        ...rest,
        password_hash: crypto.hashPassword(password)
      };
    };
    this.apiV1Router.get('/users', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getAllRecords(TableName.USERS));
    this.apiV1Router.get('/users/:id', authManager.assertRoles(Role.LEVEL_1, Role.LEVEL_2), getOneRecord(TableName.USERS));
    this.apiV1Router.post('/users', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.USERS), createRecord(TableName.USERS, true, transformCallback));
    this.apiV1Router.put('/users/:id', authManager.assertRoles(Role.LEVEL_1), inputValidator.validateModel(TableName.USERS), updateRecord(TableName.USERS, true, transformCallback));
    this.apiV1Router.delete('/users/:id', authManager.assertRoles(Role.LEVEL_1), deleteRecord(TableName.USERS));
  }
}

export default new HttpServer();
