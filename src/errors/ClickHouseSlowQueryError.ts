import { ClickHouseError } from './ClickHouseError';

export class ClickHouseSlowQueryError extends ClickHouseError {
  constructor(message = 'Slow query') {
    super(message);
  }
}
