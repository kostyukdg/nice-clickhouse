# Nice ClickHouse

A convenient wrapper for working with ClickHouse in Node.js, providing a typed API for executing queries, commands, and inserting data.

## Features

- 🚀 Typed queries with TypeScript support
- 🔄 Parameterized queries for safe execution
- ⏱️ Slow query tracking
- 🛡️ Enhanced error handling
- 📊 Convenient API for data insertion

## Installation

```bash
npm install nice-clickhouse
```

or

```bash
yarn add nice-clickhouse
```

## Basic Usage

```typescript
import { createClient } from '@clickhouse/client';
import { Request } from 'nice-clickhouse';

// Create ClickHouse client
const clickhouse = createClient({
  host: 'http://localhost:8123',
  username: 'default',
  password: '',
});

// Create Request instance
const request = new Request(clickhouse);

// Execute query with parameters
const users = await request
  .input('name', () => 'String', 'John')
  .input('age', () => 'UInt8', 25)
  .query<User>('SELECT * FROM users WHERE name = @name AND age > @age');

// Execute command
await request
  .input('tableName', () => 'String', 'users')
  .command('CREATE TABLE IF NOT EXISTS @tableName (id UInt32, name String) ENGINE = MergeTree() ORDER BY id');

// Insert data
await request.insert('users', [
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane' },
]);
```

## Documentation

Detailed documentation is available in the [DOCUMENTATION.md](./DOCUMENTATION.md) file.

## License

MIT 