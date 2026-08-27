import dotenv from 'dotenv';
import { Options } from 'sequelize';

dotenv.config();

interface SequelizeConfigOptions extends Options {
  use_env_variable?: string;
}

const baseConfig: SequelizeConfigOptions = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || process.env.DB_DBNAME,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'production' ? false : (query: string) => console.log(query),
  dialectOptions: {
    ssl: false,
  },
};

const config = {
  development: baseConfig,
  production: baseConfig,
};

export default config;
