import {
  createClient,
  ClickHouseClient,
  ClickHouseClientConfigOptions,
} from '@clickhouse/client';
import { Request } from './Request';
import { ClickHouseSlowQueryError } from './errors/ClickHouseSlowQueryError';
import { QueryRepository } from './QueryRepository';
import { ClickHouseError } from './errors/ClickHouseError';

export interface SlowQueryLogger {
  maxExecutionTime: number;
  logger: (
    error: ClickHouseSlowQueryError,
    executionTime: number,
  ) => Promise<void> | void;
}

export interface Config extends ClickHouseClientConfigOptions {
  slowQueryLogger?: SlowQueryLogger;
}

let client: ClickHouseClient | undefined;
let slowQueryLogger: SlowQueryLogger | undefined;

export async function connectToClickHouse(connectionConfig: Config) {
  let config = connectionConfig;
  if (connectionConfig.slowQueryLogger) {
    slowQueryLogger = connectionConfig.slowQueryLogger;
    config = { ...config, slowQueryLogger: undefined };
  }
  client = createClient(config);

  const pong = await client.ping();
  if (!pong.success) {
    throw pong.error;
  }
}

export function getPool() {
  if (client === undefined)
    throw new ClickHouseError('No ClickHouse connection');
  return client;
}

export async function closeClickHouseConnection() {
  if (client === undefined)
    throw new ClickHouseError('No ClickHouse connection');
  await client.close();
}

export function getRepository<T extends QueryRepository>(
  Repository: new () => T,
): T {
  return new Repository();
}

export function getSlowQueryLogger() {
  return slowQueryLogger;
}

export function getRequest(slowQueryMaxExecutionTime?: number) {
  const request = new Request(getPool());
  if (slowQueryMaxExecutionTime) {
    if (!slowQueryLogger) {
      throw new ClickHouseSlowQueryError('No ClickHouse slow query logger');
    }
    request.setSlowQueryLogger({
      ...slowQueryLogger,
      maxExecutionTime: slowQueryMaxExecutionTime,
    });
  }
  return request;
}
