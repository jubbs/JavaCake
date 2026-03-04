const mysql = require('mysql2/promise');

class Database {
  constructor() {
    this.pool = null;
    this.config = null;
  }

  /**
   * Initialize database connection pool
   * @param {Object} config - Database configuration
   */
  async initialize(config) {
    if (this.pool) {
      console.log('Database already initialized');
      return;
    }

    this.config = config;

    try {
      this.pool = mysql.createPool({
        host: config.host || 'localhost',
        user: config.user || 'root',
        password: config.password || '',
        database: config.database,
        connectionLimit: config.connectionLimit || 10,
        waitForConnections: true,
        queueLimit: 0
      });

      // Test connection
      const connection = await this.pool.getConnection();
      console.log(`Database connected successfully to ${config.database}`);
      connection.release();
    } catch (error) {
      console.error('Failed to connect to database:', error.message);
      throw error;
    }
  }

  /**
   * Execute a query with parameters
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Query results
   */
  async query(sql, params = []) {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('Database query error:', error.message);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  /**
   * Execute multiple queries in a transaction
   * @param {Function} callback - Async function that receives connection
   * @returns {Promise<any>} Transaction result
   */
  async transaction(callback) {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      console.error('Transaction error:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get a single row
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object|null>} Single row or null
   */
  async queryOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Insert a record and return insert ID
   * @param {string} table - Table name
   * @param {Object} data - Data to insert
   * @returns {Promise<number>} Insert ID
   */
  async insert(table, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');

    const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = await this.query(sql, values);

    return result.insertId;
  }

  /**
   * Update records
   * @param {string} table - Table name
   * @param {Object} data - Data to update
   * @param {Object} where - Where conditions
   * @returns {Promise<number>} Number of affected rows
   */
  async update(table, data, where) {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    const params = [...Object.values(data), ...Object.values(where)];

    const result = await this.query(sql, params);
    return result.affectedRows;
  }

  /**
   * Delete records
   * @param {string} table - Table name
   * @param {Object} where - Where conditions
   * @returns {Promise<number>} Number of affected rows
   */
  async delete(table, where) {
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    const params = Object.values(where);

    const result = await this.query(sql, params);
    return result.affectedRows;
  }

  /**
   * Close database connection pool
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Database connection closed');
    }
  }

  /**
   * Get the connection pool
   * @returns {Object} MySQL connection pool
   */
  getPool() {
    return this.pool;
  }
}

// Singleton instance
const database = new Database();

module.exports = database;
