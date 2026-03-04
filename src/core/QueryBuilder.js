const database = require('./Database');

class QueryBuilder {
  constructor(model) {
    this.model = model;
    this.tableName = model.tableName;
    this._select = ['*'];
    this._where = [];
    this._joins = [];
    this._orderBy = [];
    this._groupBy = [];
    this._limit = null;
    this._offset = null;
    this._params = [];
  }

  /**
   * Specify fields to select
   * @param {string|Array} fields - Fields to select
   * @returns {QueryBuilder} This instance for chaining
   */
  select(fields) {
    if (Array.isArray(fields)) {
      this._select = fields;
    } else if (typeof fields === 'string') {
      this._select = [fields];
    }
    return this;
  }

  /**
   * Add WHERE conditions
   * @param {Object|string} conditions - Conditions object or SQL string
   * @param {Array} params - Parameters for SQL string
   * @returns {QueryBuilder} This instance for chaining
   */
  where(conditions, params = []) {
    if (typeof conditions === 'string') {
      this._where.push(conditions);
      this._params.push(...params);
    } else if (typeof conditions === 'object') {
      Object.entries(conditions).forEach(([key, value]) => {
        if (value === null) {
          this._where.push(`${key} IS NULL`);
        } else if (Array.isArray(value)) {
          const placeholders = value.map(() => '?').join(', ');
          this._where.push(`${key} IN (${placeholders})`);
          this._params.push(...value);
        } else {
          this._where.push(`${key} = ?`);
          this._params.push(value);
        }
      });
    }
    return this;
  }

  /**
   * Add JOIN clause
   * @param {string} table - Table to join
   * @param {string} condition - Join condition
   * @param {string} type - Join type (INNER, LEFT, RIGHT)
   * @returns {QueryBuilder} This instance for chaining
   */
  join(table, condition, type = 'INNER') {
    this._joins.push({ table, condition, type: type.toUpperCase() });
    return this;
  }

  /**
   * Add LEFT JOIN
   * @param {string} table - Table to join
   * @param {string} condition - Join condition
   * @returns {QueryBuilder} This instance for chaining
   */
  leftJoin(table, condition) {
    return this.join(table, condition, 'LEFT');
  }

  /**
   * Add RIGHT JOIN
   * @param {string} table - Table to join
   * @param {string} condition - Join condition
   * @returns {QueryBuilder} This instance for chaining
   */
  rightJoin(table, condition) {
    return this.join(table, condition, 'RIGHT');
  }

  /**
   * Add ORDER BY clause
   * @param {string} field - Field to order by
   * @param {string} direction - ASC or DESC
   * @returns {QueryBuilder} This instance for chaining
   */
  orderBy(field, direction = 'ASC') {
    this._orderBy.push(`${field} ${direction.toUpperCase()}`);
    return this;
  }

  /**
   * Add GROUP BY clause
   * @param {string} field - Field to group by
   * @returns {QueryBuilder} This instance for chaining
   */
  groupBy(field) {
    this._groupBy.push(field);
    return this;
  }

  /**
   * Set LIMIT
   * @param {number} limit - Maximum number of rows
   * @returns {QueryBuilder} This instance for chaining
   */
  limit(limit) {
    this._limit = limit;
    return this;
  }

  /**
   * Set OFFSET
   * @param {number} offset - Number of rows to skip
   * @returns {QueryBuilder} This instance for chaining
   */
  offset(offset) {
    this._offset = offset;
    return this;
  }

  /**
   * Build the SQL query
   * @returns {Object} SQL query and parameters
   */
  build() {
    let sql = `SELECT ${this._select.join(', ')} FROM ${this.tableName}`;

    // Add JOINs
    if (this._joins.length > 0) {
      this._joins.forEach(join => {
        sql += ` ${join.type} JOIN ${join.table} ON ${join.condition}`;
      });
    }

    // Add WHERE
    if (this._where.length > 0) {
      sql += ` WHERE ${this._where.join(' AND ')}`;
    }

    // Add GROUP BY
    if (this._groupBy.length > 0) {
      sql += ` GROUP BY ${this._groupBy.join(', ')}`;
    }

    // Add ORDER BY
    if (this._orderBy.length > 0) {
      sql += ` ORDER BY ${this._orderBy.join(', ')}`;
    }

    // Add LIMIT
    if (this._limit !== null) {
      sql += ` LIMIT ${this._limit}`;
    }

    // Add OFFSET
    if (this._offset !== null) {
      sql += ` OFFSET ${this._offset}`;
    }

    return { sql, params: this._params };
  }

  /**
   * Execute the query and return all rows
   * @returns {Promise<Array>} Query results
   */
  async all() {
    const { sql, params } = this.build();
    return await database.query(sql, params);
  }

  /**
   * Execute the query and return first row
   * @returns {Promise<Object|null>} First row or null
   */
  async first() {
    this._limit = 1;
    const { sql, params } = this.build();
    const rows = await database.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Execute the query and return count
   * @returns {Promise<number>} Count of matching rows
   */
  async count() {
    // Store original select and replace with COUNT(*)
    const originalSelect = this._select;
    this._select = ['COUNT(*) as count'];

    const { sql, params } = this.build();
    const result = await database.query(sql, params);

    // Restore original select
    this._select = originalSelect;

    return result[0].count;
  }

  /**
   * Execute the query directly
   * @returns {Promise<Array>} Query results
   */
  async execute() {
    return await this.all();
  }

  /**
   * Add aggregate function
   * @param {string} func - Aggregate function (SUM, AVG, MAX, MIN)
   * @param {string} field - Field to aggregate
   * @returns {Promise<number>} Aggregate result
   */
  async aggregate(func, field) {
    const originalSelect = this._select;
    this._select = [`${func.toUpperCase()}(${field}) as result`];

    const { sql, params } = this.build();
    const result = await database.query(sql, params);

    this._select = originalSelect;

    return result[0].result || 0;
  }

  /**
   * Get sum of a field
   * @param {string} field - Field to sum
   * @returns {Promise<number>} Sum result
   */
  async sum(field) {
    return await this.aggregate('SUM', field);
  }

  /**
   * Get average of a field
   * @param {string} field - Field to average
   * @returns {Promise<number>} Average result
   */
  async avg(field) {
    return await this.aggregate('AVG', field);
  }

  /**
   * Get maximum value of a field
   * @param {string} field - Field to get max from
   * @returns {Promise<number>} Maximum value
   */
  async max(field) {
    return await this.aggregate('MAX', field);
  }

  /**
   * Get minimum value of a field
   * @param {string} field - Field to get min from
   * @returns {Promise<number>} Minimum value
   */
  async min(field) {
    return await this.aggregate('MIN', field);
  }

  /**
   * Clone the query builder
   * @returns {QueryBuilder} New instance with same settings
   */
  clone() {
    const cloned = new QueryBuilder(this.model);
    cloned._select = [...this._select];
    cloned._where = [...this._where];
    cloned._joins = [...this._joins];
    cloned._orderBy = [...this._orderBy];
    cloned._groupBy = [...this._groupBy];
    cloned._limit = this._limit;
    cloned._offset = this._offset;
    cloned._params = [...this._params];
    return cloned;
  }
}

module.exports = QueryBuilder;
