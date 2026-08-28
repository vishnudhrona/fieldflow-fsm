import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';

const ENV_KEYS = [
  'DATABASE_URL',
  'DB_USER',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
  'DB_DATABASE',
  'DB_DBNAME',
  'DB_HOST',
  'DB_PORT',
  'DB_SSL',
  'NODE_ENV',
] as const;

const originalEnvironment = new Map(
  ENV_KEYS.map((key) => [key, process.env[key]])
);

const typeScriptConfigPath = require.resolve('../src/config/config');
const sequelizeCliConfigPath = require.resolve('../config/config');

type DatabaseConfig = {
  username?: string;
  password?: string;
  database?: string;
  host?: string;
  port?: number;
  dialect?: string;
  logging?: false | ((query: string) => void);
  dialectOptions?: { ssl?: false | { require: boolean; rejectUnauthorized: boolean } };
  url?: string;
  use_env_variable?: string;
};

function restoreEnvironment() {
  for (const [key, value] of originalEnvironment) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function clearConfigModules() {
  delete require.cache[typeScriptConfigPath];
  delete require.cache[sequelizeCliConfigPath];
}

function snapshot(config: DatabaseConfig) {
  return {
    username: config.username,
    password: config.password,
    database: config.database,
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging === false ? false : typeof config.logging,
    ssl: config.dialectOptions?.ssl,
    url: config.url,
    useEnvVariable: config.use_env_variable,
  };
}

function loadConfigs(overrides: Partial<Record<(typeof ENV_KEYS)[number], string>> = {}) {
  for (const key of ENV_KEYS) {
    // Empty values prevent the repository's local .env from affecting these tests.
    process.env[key] = '';
  }
  Object.assign(process.env, overrides);
  clearConfigModules();

  const runtimeConfig = require(typeScriptConfigPath).default.development as DatabaseConfig;
  const cliConfig = require(sequelizeCliConfigPath).development as DatabaseConfig;

  assert.deepStrictEqual(
    snapshot(runtimeConfig),
    snapshot(cliConfig),
    'The application and Sequelize CLI must resolve database settings identically'
  );

  return runtimeConfig;
}

afterEach(() => {
  restoreEnvironment();
  clearConfigModules();
});

describe('database configuration', () => {
  it('uses clone-and-run defaults when database variables are omitted', () => {
    const config = loadConfigs();

    assert.deepStrictEqual(snapshot(config), {
      username: 'postgres',
      password: '',
      database: 'fieldflow_db',
      host: 'localhost',
      port: 5432,
      dialect: 'postgres',
      logging: 'function',
      ssl: false,
      url: undefined,
      useEnvVariable: undefined,
    });
  });

  it('prefers the documented individual connection variables', () => {
    const config = loadConfigs({
      DB_USER: 'fieldflow_user',
      DB_USERNAME: 'legacy_user',
      DB_PASSWORD: 'fieldflow_password',
      DB_NAME: 'fieldflow_custom',
      DB_DATABASE: 'legacy_database',
      DB_DBNAME: 'oldest_database',
      DB_HOST: 'postgres.internal',
      DB_PORT: '6543',
      DB_SSL: 'true',
      NODE_ENV: 'production',
    });

    assert.deepStrictEqual(snapshot(config), {
      username: 'fieldflow_user',
      password: 'fieldflow_password',
      database: 'fieldflow_custom',
      host: 'postgres.internal',
      port: 6543,
      dialect: 'postgres',
      logging: false,
      ssl: { require: true, rejectUnauthorized: false },
      url: undefined,
      useEnvVariable: undefined,
    });
  });

  it('retains support for legacy username and database variable names', () => {
    const databaseAliases = ['DB_DATABASE', 'DB_DBNAME'] as const;

    for (const databaseAlias of databaseAliases) {
      const config = loadConfigs({
        DB_USERNAME: 'legacy_user',
        [databaseAlias]: 'legacy_database',
      });

      assert.strictEqual(config.username, 'legacy_user');
      assert.strictEqual(config.database, 'legacy_database');
    }
  });

  it('enables SSL only for the explicit lowercase true value', () => {
    for (const value of ['false', 'TRUE', '1']) {
      const config = loadConfigs({ DB_SSL: value });
      assert.strictEqual(config.dialectOptions?.ssl, false, `DB_SSL=${value} must not enable SSL`);
    }
  });

  it('exposes DATABASE_URL metadata without discarding safe defaults', () => {
    const databaseUrl = 'postgresql://url_user:url_password@db.example.test:5432/url_database';
    const config = loadConfigs({ DATABASE_URL: databaseUrl });

    assert.strictEqual(config.url, databaseUrl);
    assert.strictEqual(config.use_env_variable, 'DATABASE_URL');
    assert.strictEqual(config.username, 'postgres');
    assert.strictEqual(config.database, 'fieldflow_db');
  });
});
