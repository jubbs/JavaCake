const path = require('path');
const DBMigrate = require('db-migrate');

class Migration {
  /**
   * Create a Migration instance.
   * @param {Object} options
   * @param {Object} options.config - Database config object (from config/database.js)
   * @param {string} options.migrationsDir - Absolute path to the migrations directory
   */
  constructor(options = {}) {
    this.config = options.config || {};
    this.migrationsDir = options.migrationsDir || path.join(process.cwd(), 'db', 'migrations');
  }

  /**
   * Build the db-migrate config object from the app's database config.
   */
  _buildConfig() {
    return {
      driver: 'mysql',
      host: this.config.host || 'localhost',
      user: this.config.user || 'root',
      password: this.config.password || '',
      database: this.config.database || '',
      port: this.config.port || 3306,
      multipleStatements: true
    };
  }

  /**
   * Create a db-migrate instance with the correct config.
   * Temporarily cleans process.argv to prevent rc from leaking CLI args
   * into db-migrate's internal argv._ array.
   */
  _getInstance(options = {}) {
    const dbmConfig = this._buildConfig();

    const instanceOptions = {
      config: {
        dev: dbmConfig
      },
      env: 'dev',
      cmdOptions: {
        'migrations-dir': this.migrationsDir,
        _: [],
        ...options
      }
    };

    // db-migrate's rc dependency reads process.argv, which pollutes
    // the internal argv._ with our CLI positional args. Temporarily
    // strip them so only the programmatic API controls the args.
    const originalArgv = process.argv;
    process.argv = originalArgv.slice(0, 2);
    try {
      return DBMigrate.getInstance(true, instanceOptions);
    } finally {
      process.argv = originalArgv;
    }
  }

  /**
   * Run all pending migrations.
   */
  async up(count) {
    const instance = this._getInstance();
    if (count) {
      return instance.up(count);
    }
    return instance.up();
  }

  /**
   * Rollback the last migration (or N migrations).
   */
  async down(count) {
    const instance = this._getInstance();
    if (count) {
      return instance.down(count);
    }
    return instance.down();
  }

  /**
   * Create a new migration file.
   * @param {string} name - The name of the migration
   */
  async create(name) {
    if (!name) {
      throw new Error('Migration name is required. Usage: migrate create <name>');
    }
    const instance = this._getInstance();
    return instance.create(name);
  }

  /**
   * Reset all migrations (rollback everything).
   */
  async reset() {
    const instance = this._getInstance();
    return instance.reset();
  }
}

module.exports = Migration;
