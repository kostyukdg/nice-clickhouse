# Nice ClickHouse Documentation

## Request Class

The `Request` class provides a convenient interface for interacting with ClickHouse, including executing queries, commands, and inserting data.

### Constructor

```typescript
constructor(private pool: ClickHouseClient)
```

Creates a new instance of the `Request` class.

**Parameters:**
- `pool`: An instance of `ClickHouseClient` from the `@clickhouse/client` package

**Example:**
```typescript
import { createClient } from '@clickhouse/client';
import { Request } from 'nice-clickhouse';

const clickhouse = createClient({
  host: 'http://localhost:8123',
  username: 'default',
  password: '',
});

const request = new Request(clickhouse);
```

### Methods

#### input

```typescript
input(name: string, type: SqlType, value: unknown): Request
```

Adds a parameter for use in a query.

**Parameters:**
- `name`: Parameter name (without the @ symbol)
- `type`: Function returning an SQL type (e.g., `() => 'String'`)
- `value`: Parameter value

**Returns:** The current `Request` instance for method chaining

**Example:**
```typescript
request
  .input('name', () => 'String', 'John')
  .input('age', () => 'UInt8', 25);
```

#### query

```typescript
query<Entity>(command: string): Promise<Entity[]>
```

Executes an SQL query and returns the results as an array of objects.

**Parameters:**
- `command`: SQL query with parameters in the format `@paramName`

**Returns:** Promise with an array of objects of type `Entity`

**Example:**
```typescript
interface User {
  id: number;
  name: string;
  created_at: Date;
}

const users = await request
  .input('name', () => 'String', 'John')
  .query<User>('SELECT * FROM users WHERE name = @name');
```

#### command

```typescript
command(command: string): Promise<void>
```

Executes an SQL command without returning results (DDL, INSERT, etc.).

**Parameters:**
- `command`: SQL command with parameters in the format `@paramName`

**Returns:** Promise with no value

**Example:**
```typescript
await request
  .input('tableName', () => 'String', 'users')
  .command('CREATE TABLE IF NOT EXISTS @tableName (id UInt32, name String) ENGINE = MergeTree() ORDER BY id');
```

#### insert

```typescript
insert<Entity extends Record<string, any>>(table: string, data: Entity[]): Promise<void>
```

Inserts an array of objects into the specified table.

**Parameters:**
- `table`: Table name
- `data`: Array of objects to insert

**Returns:** Promise with no value

**Example:**
```typescript
await request.insert('users', [
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane' },
]);
```

#### parametrizeInClause

```typescript
parametrizeInClause(name: string, type: SqlType, values: unknown[]): string
```

Creates a parameterized part for an IN condition in an SQL query.

**Parameters:**
- `name`: Base parameter name
- `type`: Function returning an SQL type
- `values`: Array of values for the IN condition

**Returns:** String with parameters for use in an IN condition

**Example:**
```typescript
const ids = [1, 2, 3];
const query = `SELECT * FROM users WHERE id IN (${request.parametrizeInClause('id', () => 'UInt32', ids)})`;
// Result: SELECT * FROM users WHERE id IN (@id0,@id1,@id2)
const users = await request.query<User>(query);
```

#### setSlowQueryLogger

```typescript
setSlowQueryLogger(slowQueryLogger: SlowQueryLogger): Request
```

Sets a logger for tracking slow queries.

**Parameters:**
- `slowQueryLogger`: Object with slow query logging settings

**Returns:** The current `Request` instance for method chaining

**Example:**
```typescript
request.setSlowQueryLogger({
  maxExecutionTime: 1000, // in milliseconds
  logger: (error, executionTime) => {
    console.warn(`Slow query: ${executionTime}ms`, error);
  }
});
```

#### getSlowQueryLogger

```typescript
getSlowQueryLogger(): SlowQueryLogger | undefined
```

Returns the current slow query logger.

**Returns:** `SlowQueryLogger` object or `undefined`

#### setSlowQueryMaxExecutionTime

```typescript
setSlowQueryMaxExecutionTime(maxExecutionTime: number): Request
```

Sets the maximum execution time for determining slow queries.

**Parameters:**
- `maxExecutionTime`: Maximum execution time in milliseconds

**Returns:** The current `Request` instance for method chaining

**Example:**
```typescript
request.setSlowQueryMaxExecutionTime(500); // 500 ms
```

## Data Types

### SlowQueryLogger

```typescript
interface SlowQueryLogger {
  maxExecutionTime: number;
  logger: (error: ClickHouseSlowQueryError, executionTime: number) => void;
}
```

### SqlType

```typescript
type SqlType = () => string;
```

Function that returns a string with an SQL type for ClickHouse.

## Error Handling

The library provides enhanced error handling with the following classes:

- `ClickHouseError`: Base class for ClickHouse errors
- `ClickHouseSlowQueryError`: Error for slow queries

## Usage Examples

### Basic Query with Parameters

```typescript
const users = await request
  .input('name', () => 'String', 'John')
  .input('age', () => 'UInt8', 25)
  .query<User>('SELECT * FROM users WHERE name = @name AND age > @age');
```

### Working with Dates

```typescript
const startDate = new Date('2023-01-01');
const endDate = new Date('2023-12-31');

const stats = await request
  .input('start', () => 'DateTime', startDate)
  .input('end', () => 'DateTime', endDate)
  .query<Stat>('SELECT * FROM stats WHERE created_at BETWEEN @start AND @end');
```

### Using IN with an Array of Values

```typescript
const userIds = [1, 2, 3, 4, 5];
const inClause = request.parametrizeInClause('userId', () => 'UInt32', userIds);

const users = await request.query<User>(`SELECT * FROM users WHERE id IN (${inClause})`);
```

### Tracking Slow Queries

```typescript
request.setSlowQueryLogger({
  maxExecutionTime: 1000, // 1 second
  logger: (error, executionTime) => {
    console.warn(`Slow query (${executionTime}ms):`, error);
    // Can be sent to a monitoring system
  }
});

// Execute query with time tracking
const result = await request.query('SELECT * FROM huge_table');
``` 