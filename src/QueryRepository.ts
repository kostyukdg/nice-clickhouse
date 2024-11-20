import { ClickHouseClient } from '@clickhouse/client';
import { getPool, getSlowQueryLogger, SlowQueryLogger } from './utils';
import { ClickHouseError } from './errors/ClickHouseError';
import { Request } from './Request';

export class QueryRepository {
  private pool: ClickHouseClient = getPool();

  /**
   * Max execution time for all slow queries in the instance
   * @protected
   */
  protected slowQueryMaxExecutionTime?: SlowQueryLogger['maxExecutionTime'];

  public getRequest(
    slowQueryMaxExecutionTime?: SlowQueryLogger['maxExecutionTime'],
  ): Request {
    const request = new Request(this.pool);
    const slowQueryLogger = getSlowQueryLogger();
    if (slowQueryLogger) {
      request.setSlowQueryLogger({
        ...slowQueryLogger,
        maxExecutionTime:
          slowQueryMaxExecutionTime ??
          this.slowQueryMaxExecutionTime ??
          slowQueryLogger.maxExecutionTime,
      });
    } else if (
      !slowQueryLogger &&
      (slowQueryMaxExecutionTime !== undefined ||
        this.slowQueryMaxExecutionTime !== undefined)
    ) {
      throw new ClickHouseError('No ClickHouse slow query logger');
    }
    return request;
  }
}
