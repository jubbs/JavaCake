const AppModel = require('./AppModel');
const bcrypt = require('bcrypt');

class User extends AppModel {
  static tableName = 'users';
  static primaryKey = 'id';
  static timestamps = true;

  /**
   * Define associations
   */
  static associations() {
    // Example associations - uncomment and modify as needed
    // this.hasMany('Post');
    // this.hasMany('Comment');
  }

  /**
   * Hash password before saving
   */
  static async _beforeSave(data) {
    // Hash password if it's being set and not already hashed
    if (data.password && !data.password.startsWith('$2b$')) {
      const saltRounds = 10;
      data.password = await bcrypt.hash(data.password, saltRounds);
    }

    return await super._beforeSave(data);
  }

  /**
   * Remove password from results after finding
   */
  static async _afterFind(records) {
    // Note: We keep password in results for authentication
    // It should be removed in controllers when sending to views
    return await super._afterFind(records);
  }

  /**
   * Verify password for a user
   * @param {string} plainPassword - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} True if password matches
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    const users = await this.find({ email });
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByUsername(username) {
    const users = await this.find({ username });
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} True if email exists
   */
  static async emailExists(email) {
    return await this.exists({ email });
  }

  /**
   * Check if username exists
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} True if username exists
   */
  static async usernameExists(username) {
    return await this.exists({ username });
  }

  /**
   * Create a safe user object (without password)
   * @param {Object} user - User object
   * @returns {Object} Safe user object
   */
  static safeUser(user) {
    if (!user) return null;

    const safeUser = { ...user };
    delete safeUser.password;
    return safeUser;
  }

  /**
   * Validate user data
   * @param {Object} data - User data to validate
   * @returns {Object} Validation result {valid: boolean, errors: Array}
   */
  static validate(data) {
    const errors = [];

    // Email validation
    if (!data.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }

    // Username validation
    if (!data.username) {
      errors.push('Username is required');
    } else if (data.username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    // Password validation (for new users)
    if (data.password !== undefined) {
      if (!data.password) {
        errors.push('Password is required');
      } else if (data.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
      }
    }

    // Name validation
    if (!data.name) {
      errors.push('Name is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = User;
