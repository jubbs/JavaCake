const database = require('./Database');
const QueryBuilder = require('./QueryBuilder');

class Model {
  static tableName = null;
  static primaryKey = 'id';
  static timestamps = true;
  static _associations = {};
  static _callbacks = {
    beforeSave: [],
    afterSave: [],
    beforeDelete: [],
    afterDelete: [],
    afterFind: []
  };

  /**
   * Get table name from class name if not explicitly set
   * @returns {string} Table name
   */
  static getTableName() {
    if (this.tableName) {
      return this.tableName;
    }

    // Convert class name to plural snake_case
    // e.g., UserProfile -> user_profiles
    const className = this.name;
    const snakeCase = className
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .substring(1);

    // Simple pluralization
    if (snakeCase.endsWith('s')) {
      return snakeCase + 'es';
    } else if (snakeCase.endsWith('y')) {
      return snakeCase.slice(0, -1) + 'ies';
    } else {
      return snakeCase + 's';
    }
  }

  /**
   * Create a new query builder instance
   * @returns {QueryBuilder} Query builder instance
   */
  static query() {
    return new QueryBuilder(this);
  }

  /**
   * Find records by conditions
   * @param {Object} conditions - Where conditions
   * @returns {Promise<Array>} Matching records
   */
  static async find(conditions = {}) {
    const tableName = this.getTableName();

    if (Object.keys(conditions).length === 0) {
      return await this.findAll();
    }

    const query = this.query().where(conditions);
    const rows = await query.all();

    return await this._afterFind(rows);
  }

  /**
   * Find a single record by ID
   * @param {number} id - Record ID
   * @returns {Promise<Object|null>} Record or null
   */
  static async findById(id) {
    const tableName = this.getTableName();
    const sql = `SELECT * FROM ${tableName} WHERE ${this.primaryKey} = ? LIMIT 1`;
    const row = await database.queryOne(sql, [id]);

    if (row) {
      const rows = await this._afterFind([row]);
      return rows[0];
    }

    return null;
  }

  /**
   * Find all records with options
   * @param {Object} options - Query options
   * @returns {Promise<Array>} All matching records
   */
  static async findAll(options = {}) {
    const tableName = this.getTableName();
    let query = this.query();

    // Handle where conditions
    if (options.where) {
      query = query.where(options.where);
    }

    // Handle order
    if (options.order) {
      if (Array.isArray(options.order)) {
        query = query.orderBy(options.order[0], options.order[1] || 'ASC');
      } else if (typeof options.order === 'string') {
        query = query.orderBy(options.order);
      }
    }

    // Handle limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    // Handle offset
    if (options.offset) {
      query = query.offset(options.offset);
    }

    // Handle select fields
    if (options.select) {
      query = query.select(options.select);
    }

    const rows = await query.all();

    // Handle associations (include)
    if (options.include && rows.length > 0) {
      return await this._loadAssociations(rows, options.include);
    }

    return await this._afterFind(rows);
  }

  /**
   * Save a record (insert or update)
   * @param {Object} data - Record data
   * @returns {Promise<Object>} Saved record
   */
  static async save(data) {
    const tableName = this.getTableName();

    // Run beforeSave callbacks
    data = await this._beforeSave(data);

    // Add timestamps
    if (this.timestamps) {
      const now = new Date();
      if (!data[this.primaryKey]) {
        data.created_at = now;
      }
      data.updated_at = now;
    }

    try {
      if (data[this.primaryKey]) {
        // Update existing record
        const id = data[this.primaryKey];
        const updateData = { ...data };
        delete updateData[this.primaryKey];

        await database.update(tableName, updateData, { [this.primaryKey]: id });
        const record = await this.findById(id);

        // Run afterSave callbacks
        await this._afterSave(record);

        return record;
      } else {
        // Insert new record
        const insertData = { ...data };
        delete insertData[this.primaryKey];

        const insertId = await database.insert(tableName, insertData);
        const record = await this.findById(insertId);

        // Run afterSave callbacks
        await this._afterSave(record);

        return record;
      }
    } catch (error) {
      console.error('Error saving record:', error.message);
      throw error;
    }
  }

  /**
   * Update a record by ID
   * @param {number} id - Record ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated record
   */
  static async update(id, data) {
    const tableName = this.getTableName();

    // Add updated_at timestamp
    if (this.timestamps) {
      data.updated_at = new Date();
    }

    await database.update(tableName, data, { [this.primaryKey]: id });
    return await this.findById(id);
  }

  /**
   * Delete a record by ID
   * @param {number} id - Record ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    const tableName = this.getTableName();

    // Run beforeDelete callbacks
    await this._beforeDelete(id);

    const affectedRows = await database.delete(tableName, { [this.primaryKey]: id });

    // Run afterDelete callbacks
    await this._afterDelete(id);

    return affectedRows > 0;
  }

  /**
   * Delete all records matching conditions
   * @param {Object} conditions - Where conditions
   * @returns {Promise<number>} Number of deleted records
   */
  static async deleteAll(conditions) {
    const tableName = this.getTableName();
    return await database.delete(tableName, conditions);
  }

  /**
   * Count records
   * @param {Object} conditions - Where conditions
   * @returns {Promise<number>} Count
   */
  static async count(conditions = {}) {
    const query = this.query();

    if (Object.keys(conditions).length > 0) {
      query.where(conditions);
    }

    return await query.count();
  }

  /**
   * Check if a record exists
   * @param {Object} conditions - Where conditions
   * @returns {Promise<boolean>} True if exists
   */
  static async exists(conditions) {
    const count = await this.count(conditions);
    return count > 0;
  }

  /**
   * Define a hasMany association
   * @param {string} modelName - Related model name
   * @param {Object} options - Association options
   */
  static hasMany(modelName, options = {}) {
    this._associations[modelName] = {
      type: 'hasMany',
      foreignKey: options.foreignKey || `${this.name.toLowerCase()}_id`,
      ...options
    };
  }

  /**
   * Define a belongsTo association
   * @param {string} modelName - Related model name
   * @param {Object} options - Association options
   */
  static belongsTo(modelName, options = {}) {
    this._associations[modelName] = {
      type: 'belongsTo',
      foreignKey: options.foreignKey || `${modelName.toLowerCase()}_id`,
      ...options
    };
  }

  /**
   * Define a hasOne association
   * @param {string} modelName - Related model name
   * @param {Object} options - Association options
   */
  static hasOne(modelName, options = {}) {
    this._associations[modelName] = {
      type: 'hasOne',
      foreignKey: options.foreignKey || `${this.name.toLowerCase()}_id`,
      ...options
    };
  }

  /**
   * Define a belongsToMany association
   * @param {string} modelName - Related model name
   * @param {Object} options - Association options
   */
  static belongsToMany(modelName, options = {}) {
    if (!options.through) {
      throw new Error('belongsToMany requires a "through" option');
    }

    this._associations[modelName] = {
      type: 'belongsToMany',
      through: options.through,
      foreignKey: options.foreignKey || `${this.name.toLowerCase()}_id`,
      otherKey: options.otherKey || `${modelName.toLowerCase()}_id`,
      ...options
    };
  }

  /**
   * Load associations for records
   * @param {Array} records - Records to load associations for
   * @param {Array} include - Association names to include
   * @returns {Promise<Array>} Records with associations loaded
   */
  static async _loadAssociations(records, include) {
    if (!Array.isArray(include)) {
      include = [include];
    }

    for (const assocName of include) {
      const assoc = this._associations[assocName];

      if (!assoc) {
        console.warn(`Association ${assocName} not found on ${this.name}`);
        continue;
      }

      // Load the related model
      const RelatedModel = require(`../../models/${assocName}`);

      if (assoc.type === 'belongsTo') {
        // Load parent records
        const ids = records.map(r => r[assoc.foreignKey]).filter(id => id);
        if (ids.length > 0) {
          const related = await RelatedModel.find({ [RelatedModel.primaryKey]: ids });
          const relatedMap = {};
          related.forEach(r => relatedMap[r[RelatedModel.primaryKey]] = r);

          records.forEach(record => {
            record[assocName.toLowerCase()] = relatedMap[record[assoc.foreignKey]] || null;
          });
        }
      } else if (assoc.type === 'hasMany') {
        // Load child records
        const ids = records.map(r => r[this.primaryKey]);
        const related = await RelatedModel.find({ [assoc.foreignKey]: ids });

        // Group by foreign key
        const relatedMap = {};
        related.forEach(r => {
          const fk = r[assoc.foreignKey];
          if (!relatedMap[fk]) relatedMap[fk] = [];
          relatedMap[fk].push(r);
        });

        records.forEach(record => {
          const pluralName = assocName.toLowerCase() + 's';
          record[pluralName] = relatedMap[record[this.primaryKey]] || [];
        });
      } else if (assoc.type === 'hasOne') {
        // Load single related record
        const ids = records.map(r => r[this.primaryKey]);
        const related = await RelatedModel.find({ [assoc.foreignKey]: ids });
        const relatedMap = {};
        related.forEach(r => relatedMap[r[assoc.foreignKey]] = r);

        records.forEach(record => {
          record[assocName.toLowerCase()] = relatedMap[record[this.primaryKey]] || null;
        });
      }
    }

    return records;
  }

  /**
   * Register a beforeSave callback
   * @param {Function} callback - Callback function
   */
  static beforeSave(callback) {
    this._callbacks.beforeSave.push(callback);
  }

  /**
   * Register an afterSave callback
   * @param {Function} callback - Callback function
   */
  static afterSave(callback) {
    this._callbacks.afterSave.push(callback);
  }

  /**
   * Register an afterFind callback
   * @param {Function} callback - Callback function
   */
  static afterFind(callback) {
    this._callbacks.afterFind.push(callback);
  }

  /**
   * Register a beforeDelete callback
   * @param {Function} callback - Callback function
   */
  static beforeDelete(callback) {
    this._callbacks.beforeDelete.push(callback);
  }

  /**
   * Register an afterDelete callback
   * @param {Function} callback - Callback function
   */
  static afterDelete(callback) {
    this._callbacks.afterDelete.push(callback);
  }

  /**
   * Run beforeSave callbacks
   * @param {Object} data - Data being saved
   * @returns {Promise<Object>} Modified data
   */
  static async _beforeSave(data) {
    for (const callback of this._callbacks.beforeSave) {
      data = await callback(data);
    }
    return data;
  }

  /**
   * Run afterSave callbacks
   * @param {Object} record - Saved record
   */
  static async _afterSave(record) {
    for (const callback of this._callbacks.afterSave) {
      await callback(record);
    }
  }

  /**
   * Run afterFind callbacks
   * @param {Array} records - Found records
   * @returns {Promise<Array>} Modified records
   */
  static async _afterFind(records) {
    for (const callback of this._callbacks.afterFind) {
      records = await callback(records);
    }
    return records;
  }

  /**
   * Run beforeDelete callbacks
   * @param {number} id - Record ID being deleted
   */
  static async _beforeDelete(id) {
    for (const callback of this._callbacks.beforeDelete) {
      await callback(id);
    }
  }

  /**
   * Run afterDelete callbacks
   * @param {number} id - Deleted record ID
   */
  static async _afterDelete(id) {
    for (const callback of this._callbacks.afterDelete) {
      await callback(id);
    }
  }

  /**
   * Define associations for this model
   * Override in child classes
   */
  static associations() {
    // Override in child classes
  }
}

module.exports = Model;
