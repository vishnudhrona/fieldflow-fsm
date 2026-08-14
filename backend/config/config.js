require('dotenv').config();

const baseConfig = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'production' ? false : console.log,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
};

module.exports = {
  development: baseConfig,
  production: baseConfig,
};
