import dotenv from 'dotenv';
import { Options } from 'sequelize';

dotenv.config();

interface SequelizeConfigOptions extends Options {
  use_env_variable?: string;
  url?: string;
}

const baseConfig: SequelizeConfigOptions = {
  username: process.env.DB_USER || process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD) : '',
  database: process.env.DB_NAME || process.env.DB_DATABASE || process.env.DB_DBNAME || 'fieldflow_db',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'production' ? false : (query: string) => console.log(query),
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false,
  },
};

if (process.env.DATABASE_URL) {
  baseConfig.url = process.env.DATABASE_URL;
  baseConfig.use_env_variable = 'DATABASE_URL';
}

const config = {
  development: baseConfig,
  production: baseConfig,
};

export default config;

