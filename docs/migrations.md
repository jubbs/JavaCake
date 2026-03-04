# Migrations

Migrations provide a structured way to manage database schema changes over time. JavaCake integrates [db-migrate](https://db-migrate.readthedocs.io/) to handle creating, running, and rolling back migrations using your existing `config/database.js` configuration.

## Table of Contents

- [Setup](#setup)
- [Creating Migrations](#creating-migrations)
- [Running Migrations](#running-migrations)
- [Rolling Back Migrations](#rolling-back-migrations)
- [Writing Migration Files](#writing-migration-files)
- [Programmatic API](#programmatic-api)
- [Using Migrations in an External App](#using-migrations-in-an-external-app)
- [Best Practices](#best-practices)

## Setup

### Dependencies

Install `db-migrate` and `db-migrate-mysql` in your project:

```bash
npm install db-migrate db-migrate-mysql --save
```

### Directory Structure

Migrations live in the `db/migrations/` directory at the root of your project:

```
my-app/
├── bin/
│   └── migrate.js        # CLI entry point
├── config/
│   └── database.js       # DB config (single source of truth)
├── db/
│   └── migrations/       # Migration files go here
│       ├── 20260101120000-create-users-table.js
│       └── 20260102090000-add-email-to-users.js
└── ...
```

### npm Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "migrate": "node bin/migrate.js up",
    "migrate:up": "node bin/migrate.js up",
    "migrate:down": "node bin/migrate.js down",
    "migrate:create": "node bin/migrate.js create",
    "migrate:reset": "node bin/migrate.js reset"
  }
}
```

### CLI Entry Point

Create `bin/migrate.js` in your project root:

```javascript
#!/usr/bin/env node

const path = require('path');
const Migration = require('../src/core/Migration');
const dbConfig = require('../config/database');

const migration = new Migration({
  config: dbConfig,
  migrationsDir: path.join(__dirname, '..', 'db', 'migrations')
});

const command = process.argv[2];
const arg = process.argv[3];

async function run() {
  switch (command) {
    case 'up':
      await migration.up(arg ? parseInt(arg, 10) : undefined);
      break;
    case 'down':
      await migration.down(arg ? parseInt(arg, 10) : undefined);
      break;
    case 'create':
      if (!arg) {
        console.error('Usage: node bin/migrate.js create <migration_name>');
        process.exit(1);
      }
      await migration.create(arg);
      break;
    case 'reset':
      await migration.reset();
      break;
    default:
      console.log('Usage: node bin/migrate.js <command> [args]');
      console.log('');
      console.log('Commands:');
      console.log('  up [count]      Run pending migrations');
      console.log('  down [count]    Rollback migrations');
      console.log('  create <name>   Create a new migration file');
      console.log('  reset           Rollback all migrations');
      return;
  }
}

run().catch(err => {
  console.error('Migration error:', err.message);
  process.exit(1);
});
```

## Creating Migrations

Generate a new migration file:

```bash
npm run migrate:create -- create_users_table
```

This creates a timestamped file in `db/migrations/`:

```
db/migrations/20260305120000-create-users-table.js
```

The generated file contains a skeleton with `up` and `down` functions that you fill in.

## Running Migrations

### Run All Pending Migrations

```bash
npm run migrate
# or
npm run migrate:up
```

### Run a Specific Number of Migrations

```bash
node bin/migrate.js up 2    # Run the next 2 pending migrations
```

### Check Which Migrations Have Run

db-migrate tracks completed migrations in a `migrations` table in your database. This table is created automatically the first time you run a migration.

## Rolling Back Migrations

### Roll Back the Last Migration

```bash
npm run migrate:down
```

### Roll Back a Specific Number of Migrations

```bash
node bin/migrate.js down 3    # Roll back the last 3 migrations
```

### Roll Back All Migrations

```bash
npm run migrate:reset
```

## Writing Migration Files

### Creating a Table

```javascript
exports.up = function(db) {
  return db.createTable('users', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    username: { type: 'string', length: 100, notNull: true, unique: true },
    email: { type: 'string', length: 255, notNull: true, unique: true },
    password: { type: 'string', length: 255, notNull: true },
    created: { type: 'datetime', defaultValue: new String('CURRENT_TIMESTAMP') },
    modified: { type: 'datetime', defaultValue: new String('CURRENT_TIMESTAMP') }
  });
};

exports.down = function(db) {
  return db.dropTable('users');
};
```

### Adding a Column

```javascript
exports.up = function(db) {
  return db.addColumn('users', 'avatar_url', {
    type: 'string',
    length: 500
  });
};

exports.down = function(db) {
  return db.removeColumn('users', 'avatar_url');
};
```

### Removing a Column

```javascript
exports.up = function(db) {
  return db.removeColumn('users', 'legacy_field');
};

exports.down = function(db) {
  return db.addColumn('users', 'legacy_field', {
    type: 'string',
    length: 255
  });
};
```

### Renaming a Column

```javascript
exports.up = function(db) {
  return db.renameColumn('users', 'name', 'full_name');
};

exports.down = function(db) {
  return db.renameColumn('users', 'full_name', 'name');
};
```

### Changing a Column Type

```javascript
exports.up = function(db) {
  return db.changeColumn('users', 'bio', {
    type: 'text'
  });
};

exports.down = function(db) {
  return db.changeColumn('users', 'bio', {
    type: 'string',
    length: 255
  });
};
```

### Adding an Index

```javascript
exports.up = function(db) {
  return db.addIndex('posts', 'idx_posts_user_id', ['user_id']);
};

exports.down = function(db) {
  return db.removeIndex('posts', 'idx_posts_user_id');
};
```

### Adding a Unique Index

```javascript
exports.up = function(db) {
  return db.addIndex('users', 'idx_users_email', ['email'], true);
};

exports.down = function(db) {
  return db.removeIndex('users', 'idx_users_email');
};
```

### Adding a Foreign Key

```javascript
exports.up = function(db) {
  return db.addForeignKey('posts', 'users', 'fk_posts_user_id', {
    'user_id': 'id'
  }, {
    onDelete: 'CASCADE',
    onUpdate: 'RESTRICT'
  });
};

exports.down = function(db) {
  return db.removeForeignKey('posts', 'fk_posts_user_id');
};
```

### Running Raw SQL

For complex operations that go beyond the built-in API:

```javascript
exports.up = function(db) {
  return db.runSql(
    `ALTER TABLE posts ADD FULLTEXT INDEX idx_posts_fulltext (title, content)`
  );
};

exports.down = function(db) {
  return db.runSql(
    `ALTER TABLE posts DROP INDEX idx_posts_fulltext`
  );
};
```

### Multiple Operations

Chain multiple operations using promises:

```javascript
exports.up = function(db) {
  return db.createTable('comments', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    post_id: { type: 'int', notNull: true },
    user_id: { type: 'int', notNull: true },
    body: { type: 'text', notNull: true },
    created: { type: 'datetime', defaultValue: new String('CURRENT_TIMESTAMP') }
  })
  .then(() => db.addIndex('comments', 'idx_comments_post_id', ['post_id']))
  .then(() => db.addIndex('comments', 'idx_comments_user_id', ['user_id']));
};

exports.down = function(db) {
  return db.dropTable('comments');
};
```

### Column Types

Common db-migrate column types and their MySQL equivalents:

| db-migrate type | MySQL type |
|----------------|------------|
| `int` | `INT` |
| `smallint` | `SMALLINT` |
| `bigint` | `BIGINT` |
| `real` / `decimal` | `DECIMAL` |
| `string` | `VARCHAR` (use `length` option) |
| `text` | `TEXT` |
| `blob` | `BLOB` |
| `boolean` | `TINYINT(1)` |
| `date` | `DATE` |
| `datetime` | `DATETIME` |
| `timestamp` | `TIMESTAMP` |

### Column Options

| Option | Description |
|--------|-------------|
| `type` | Column data type (required) |
| `length` | Length for string types |
| `primaryKey` | Mark as primary key |
| `autoIncrement` | Auto-increment (integers only) |
| `notNull` | Disallow NULL values |
| `unique` | Add a unique constraint |
| `defaultValue` | Default value for the column |
| `unsigned` | Unsigned integer |

## Programmatic API

The `Migration` class in `src/core/Migration.js` can be used programmatically:

```javascript
const Migration = require('./src/core/Migration');
const dbConfig = require('./config/database');

const migration = new Migration({
  config: dbConfig,
  migrationsDir: '/absolute/path/to/db/migrations'
});

// Run all pending migrations
await migration.up();

// Run N migrations
await migration.up(2);

// Roll back the last migration
await migration.down();

// Roll back N migrations
await migration.down(3);

// Roll back all migrations
await migration.reset();

// Create a new migration file
await migration.create('add_posts_table');
```

The `Migration` class reads database credentials from the config object you pass in (the same format as `config/database.js`), so there's no need for a separate `database.json` file.

## Using Migrations in an External App

If your app uses JavaCake as a submodule (e.g. in a `framework/` directory), require `Migration` from the framework path:

```javascript
// bin/migrate.js in your app
const path = require('path');
const Migration = require('../framework/src/core/Migration');
const dbConfig = require('../config/database');

const migration = new Migration({
  config: dbConfig,
  migrationsDir: path.join(__dirname, '..', 'db', 'migrations')
});
```

Each app maintains its own `db/migrations/` directory and runs migrations against its own database configuration.

## Best Practices

1. **Always write a `down` function**: Every `up` operation should have a corresponding `down` that reverses it. This ensures you can safely roll back any migration.

2. **One concern per migration**: Each migration file should handle a single logical change (one table, one column addition, etc.). This makes rollbacks precise and predictable.

3. **Use descriptive names**: Name migrations after what they do:
   - `create_users_table`
   - `add_avatar_to_users`
   - `create_posts_tags_join_table`
   - `add_index_on_posts_user_id`

4. **Never edit a migration that has already run**: If a migration has been applied (in any environment), create a new migration to make further changes. Editing an existing migration won't re-run it.

5. **Follow JavaCake conventions**: Use plural snake_case table names, `id` as primary key, `{model}_id` for foreign keys, and `created`/`modified` for timestamps.

6. **Test both directions**: After writing a migration, run `up` then `down` then `up` again to make sure both directions work.

7. **Keep migrations in version control**: Migration files should be committed to your repository so every developer and environment runs the same schema changes.

## Next Steps

- Learn about [Models](./models.md) to interact with your tables
- Read the [Configuration](./configuration.md) guide for database setup
- Explore [Controllers](./controllers.md) to build on top of your schema
