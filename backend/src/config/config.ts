import dotenv from 'dotenv';
import { Options } from 'sequelize';

dotenv.config();

interface SequelizeConfigOptions extends Options {
  use_env_variable?: string;
}

const baseConfig: SequelizeConfigOptions = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'production' ? false : (query: string) => console.log(query),
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
};

const config = {
  development: baseConfig,
  production: baseConfig,
};

export default config;
