import {
  ClickHouseError as ClickHouseErrorOriginal,
  ClickHouseClient,
} from '@clickhouse/client';
import { ClickHouseError } from './errors/ClickHouseError';
import { ClickHouseSlowQueryError } from './errors/ClickHouseSlowQueryError';
import { SlowQueryLogger } from './utils';
import { SqlType } from './types';

type RequestExecutionMethod =
  | typeof Request.prototype.query
  | typeof Request.prototype.insert;

async function wrapError<T>(callback: () => Promise<T>) {
  try {
    return await callback();
  } catch (_error: unknown) {
    let error = _error;
    if (_error instanceof ClickHouseErrorOriginal) {
      error = new ClickHouseError(_error.message);
    }
    if (error instanceof Error) Error.captureStackTrace(error, wrapError);
    throw error;
  }
}

async function logSlowQuery<T>(
  callback: () => Promise<T>,
  calledMethod: RequestExecutionMethod,
  { maxExecutionTime, logger }: SlowQueryLogger,
) {
  const error = new ClickHouseSlowQueryError();
  Error.captureStackTrace(error, calledMethod);
  const startTime = Date.now();
  try {
    return await callback();
  } finally {
    const executionTime = Date.now() - startTime;
    if (executionTime > maxExecutionTime) {
      logger(error, executionTime);
    }
  }
}

export class Request {
  private slowQueryLogger?: SlowQueryLogger;

  private parameters: {
    name: string;
    value: unknown;
    type: SqlType;
  }[] = [];

  constructor(private pool: ClickHouseClient) {}

  public setSlowQueryLogger(slowQueryLogger: SlowQueryLogger) {
    this.slowQueryLogger = slowQueryLogger;
    return this;
  }

  public getSlowQueryLogger() {
    return this.slowQueryLogger;
  }

  public setSlowQueryMaxExecutionTime(
    maxExecutionTime: SlowQueryLogger['maxExecutionTime'],
  ) {
    const slowQueryLogger = this.getSlowQueryLogger();
    if (!slowQueryLogger) {
      throw new ClickHouseError('No ClickHouse slow query logger');
    }
    return this.setSlowQueryLogger({
      ...slowQueryLogger,
      maxExecutionTime,
    });
  }

  private executeMethod<T>(
    callback: () => Promise<T>,
    calledMethod: RequestExecutionMethod,
  ) {
    const { slowQueryLogger } = this;
    if (slowQueryLogger) {
      return wrapError(() =>
        logSlowQuery(callback, calledMethod, slowQueryLogger),
      );
    }
    return wrapError(callback);
  }

  private prepareQueryParameters(query: string) {
    let queryWithParameters = query;
    const queryParameters: Record<string, unknown> = {};

    for (const { name, type, value } of this.parameters) {
      const regex = new RegExp(`(?<!\\w)@${name}(?!\\w)`, 'g');
      queryWithParameters = queryWithParameters.replace(
        regex,
        `{${name}: ${type()}}`,
      );
      queryParameters[name] = value;
    }

    return {
      queryWithParameters,
      queryParameters,
    };
  }

  public query<Entity>(command: string): Promise<Entity[]> {
    return this.executeMethod(async () => {
      const { queryWithParameters, queryParameters } =
        this.prepareQueryParameters(command);

      const response = await this.pool.query({
        query: queryWithParameters,
        format: 'JSONCompactEachRowWithNamesAndTypes',
        query_params: queryParameters,
        clickhouse_settings: {
          date_time_input_format: 'best_effort',
          date_time_output_format: 'iso',
        },
      });
      const data = await response.json();
      if (data.length < 3) {
        return [];
      }
      const [fields, types, ...rows] = data as [
        fields: string[],
        types: string[],
        ...rows: unknown[][],
      ];
      return rows.map(row => {
        const entity: Record<string, unknown> = {};
        for (const [index, field] of fields.entries()) {
          const type = types[index];
          let value = row[index];
          if (type.includes('DateTime') && typeof value === 'string') {
            value = new Date(value);
          }
          entity[field] = value;
        }
        return entity as Entity;
      });
    }, Request.prototype.query);
  }

  public command(command: string): Promise<void> {
    return this.executeMethod(async () => {
      const { queryWithParameters, queryParameters } =
        this.prepareQueryParameters(command);

      await this.pool.command({
        query: queryWithParameters,
        query_params: queryParameters,
        clickhouse_settings: {
          date_time_input_format: 'best_effort',
        },
      });
    }, Request.prototype.command);
  }

  public input(name: string, type: SqlType, value: unknown) {
    this.parameters.push({ name, value, type: type });
    return this;
  }

  public parametrizeInClause(
    name: string,
    type: SqlType,
    values: unknown[],
  ): string {
    return values
      .map((value, index) => {
        const parameter = `${name}${index}`;
        this.input(parameter, type, value);
        return `@${parameter}`;
      })
      .join(',');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async insert<Entity extends Record<string, any>>(
    table: string,
    data: Entity[],
  ) {
    const columns = Object.keys(data[0]);
    if (columns.length > 0) {
      await this.pool.insert({
        table,
        format: 'JSONEachRow',
        values: data,
        // to trigger the default values logic for the rest of the columns
        columns: columns as [string, ...string[]],
        clickhouse_settings: {
          date_time_input_format: 'best_effort',
        },
      });
    }
  }
}
