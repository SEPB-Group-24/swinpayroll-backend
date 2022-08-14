import { AddressInfo } from 'net';

import busboy from 'connect-busboy';
import cors from 'cors';
import express from 'express';

import authManager from './auth-manager';
import { httpPort } from './config';
import { TableName } from './enums';
import database from './database';
import Logger from './logger';
import { User } from './models';

class HttpServer {
  private apiV1Router = express.Router();
  private app = express();
  private logger = new Logger('http-server');
  private requestId = 0;

  constructor() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(authManager.initialise());
    this.app.use(busboy());
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
  }
}

export default new HttpServer();
