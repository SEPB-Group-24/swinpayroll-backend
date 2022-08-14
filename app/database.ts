import knex from 'knex';

import { database as databaseConfig } from './config';

type Where = Record<string, unknown>;

type NeverValues = { [K in 'id' | 'create_date' | 'update_date']?: never };

type Data = Record<string, unknown> & NeverValues;

const [host, port] = databaseConfig.host.split(':');
const parsedPort = parseInt(port ?? '3306', 10);

class Database {
  knex = knex({
    client: 'mysql2',
    connection: {
      host,
      user: databaseConfig.username,
      password: databaseConfig.password,
      database: databaseConfig.name,
      port: parsedPort
    }
  });
}

export default new Database();
