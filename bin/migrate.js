#!/usr/bin/env node

const path = require('path');
const Migration = require('../src/core/Migration');

let dbConfig;
try {
  dbConfig = require('../config/database');
} catch (e) {
  console.error('Error: Could not load config/database.js');
  console.error(e.message);
  process.exit(1);
}

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
      console.log('  up [count]      Run pending migrations (optionally limit count)');
      console.log('  down [count]    Rollback migrations (optionally limit count)');
      console.log('  create <name>   Create a new migration file');
      console.log('  reset           Rollback all migrations');
      return;
  }
}

run().catch(err => {
  console.error('Migration error:', err.message);
  process.exit(1);
});
