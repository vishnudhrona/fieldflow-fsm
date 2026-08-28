import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';
import path from 'node:path';

const backendRoot = path.resolve(__dirname, '..');
const RESULT_PREFIX = '__FIELD_FLOW_TEST_RESULT__';

const ISOLATED_DATABASE_ENV = {
  DATABASE_URL: '',
  DB_USER: '',
  DB_USERNAME: '',
  DB_PASSWORD: '',
  DB_NAME: '',
  DB_DATABASE: '',
  DB_DBNAME: '',
  DB_HOST: '',
  DB_PORT: '',
  DB_SSL: '',
  PORT: '',
  DOTENV_CONFIG_QUIET: 'true',
};

function runBackendProbe<T>(source: string, environment: Record<string, string> = {}): T {
  const result = spawnSync(process.execPath, ['-r', 'ts-node/register', '-e', source], {
    cwd: backendRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...ISOLATED_DATABASE_ENV,
      NODE_ENV: 'test',
      ...environment,
    },
    timeout: 15_000,
  });

  assert.strictEqual(
    result.status,
    0,
    `Backend probe failed.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );

  const resultLine = result.stdout
    .split(/\r?\n/)
    .find((line) => line.startsWith(RESULT_PREFIX));
  assert.ok(resultLine, `Backend probe did not emit a result.\nstdout:\n${result.stdout}`);

  return JSON.parse(resultLine.slice(RESULT_PREFIX.length)) as T;
}

describe('database connection initialization', () => {
  it('constructs Sequelize from DATABASE_URL when one is provided', () => {
    const result = runBackendProbe<{
      database: string;
      username: string;
      host: string;
      port: string;
      dialect: string;
      ssl: unknown;
    }>(
      `
        const { sequelize } = require('./src/models');
        process.stdout.write('${RESULT_PREFIX}' + JSON.stringify({
          database: sequelize.config.database,
          username: sequelize.config.username,
          host: sequelize.config.host,
          port: sequelize.config.port,
          dialect: sequelize.getDialect(),
          ssl: sequelize.options.dialectOptions.ssl,
        }) + '\\n');
        process.exit(0);
      `,
      {
        DATABASE_URL: 'postgresql://url_user:url_password@db.example.test:6543/url_database',
        DB_USER: 'ignored_user',
        DB_NAME: 'ignored_database',
        DB_HOST: 'ignored.example.test',
        DB_PORT: '9999',
        DB_SSL: 'true',
      }
    );

    assert.deepStrictEqual(result, {
      database: 'url_database',
      username: 'url_user',
      host: 'db.example.test',
      port: '6543',
      dialect: 'postgres',
      ssl: { require: true, rejectUnauthorized: false },
    });
  });

  it('constructs Sequelize from individual settings when DATABASE_URL is absent', () => {
    const result = runBackendProbe<{
      database: string;
      username: string;
      password: string;
      host: string;
      port: number;
      dialect: string;
    }>(
      `
        const { sequelize } = require('./src/models');
        process.stdout.write('${RESULT_PREFIX}' + JSON.stringify({
          database: sequelize.config.database,
          username: sequelize.config.username,
          password: sequelize.config.password,
          host: sequelize.config.host,
          port: sequelize.config.port,
          dialect: sequelize.getDialect(),
        }) + '\\n');
        process.exit(0);
      `,
      {
        DB_USER: 'individual_user',
        DB_PASSWORD: 'individual_password',
        DB_NAME: 'individual_database',
        DB_HOST: 'localhost',
        DB_PORT: '7654',
      }
    );

    assert.deepStrictEqual(result, {
      database: 'individual_database',
      username: 'individual_user',
      password: 'individual_password',
      host: 'localhost',
      port: 7654,
      dialect: 'postgres',
    });
  });
});

describe('backend health setup', () => {
  it('uses port 8080 by default and serves every documented health alias', () => {
    const result = runBackendProbe<{
      configuredPort: number;
      authenticateCalls: number;
      healthyResponses: Array<{ path: string; status: number; body: Record<string, unknown> }>;
      unhealthyResponse: { status: number; body: Record<string, unknown> };
      unknownStatus: number;
    }>(`
      const express = require('express');
      const models = require('./src/models');

      let configuredPort;
      let authenticateCalls = 0;
      let failHealthCheck = false;
      const originalListen = express.application.listen;

      models.sequelize.authenticate = async () => {
        authenticateCalls += 1;
        if (failHealthCheck) throw new Error('database unavailable');
      };
      models.sequelize.close = async () => {};
      express.application.listen = function (port) {
        configuredPort = port;
        return { close(callback) { callback(); } };
      };

      const app = require('./src/index').default;

      setImmediate(() => {
        express.application.listen = originalListen;
        const server = originalListen.call(app, 0, '127.0.0.1', async () => {
          try {
            const address = server.address();
            const origin = 'http://127.0.0.1:' + address.port;
            const paths = ['/health', '/api/health', '/api/health/ready'];
            const healthyResponses = [];

            for (const path of paths) {
              const response = await fetch(origin + path);
              healthyResponses.push({ path, status: response.status, body: await response.json() });
            }

            failHealthCheck = true;
            const unhealthy = await fetch(origin + '/health');
            const unhealthyBody = await unhealthy.json();
            const unknown = await fetch(origin + '/api/health/not-ready');

            server.close(() => {
              process.stdout.write('${RESULT_PREFIX}' + JSON.stringify({
                configuredPort,
                authenticateCalls,
                healthyResponses,
                unhealthyResponse: { status: unhealthy.status, body: unhealthyBody },
                unknownStatus: unknown.status,
              }) + '\\n');
              process.exit(0);
            });
          } catch (error) {
            console.error(error);
            process.exit(1);
          }
        });
      });
    `);

    assert.strictEqual(result.configuredPort, 8080);
    assert.strictEqual(result.healthyResponses.length, 3);
    for (const response of result.healthyResponses) {
      assert.strictEqual(response.status, 200, `${response.path} should be healthy`);
      assert.strictEqual(response.body.status, 'ok');
      assert.strictEqual(response.body.database, 'connected');
      assert.match(String(response.body.timestamp), /^\d{4}-\d{2}-\d{2}T/);
    }
    assert.strictEqual(result.unhealthyResponse.status, 503);
    assert.deepStrictEqual(result.unhealthyResponse.body, {
      status: 'error',
      message: 'Database connection lost',
      error: 'database unavailable',
    });
    assert.strictEqual(result.unknownStatus, 404);
    assert.strictEqual(result.authenticateCalls, 5);
  });
});
