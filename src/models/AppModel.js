const Model = require('../core/Model');

/**
 * AppModel - Base model for all application models
 * Extend this class in your models to add application-wide model functionality
 */
class AppModel extends Model {
  /**
   * Define associations for this model
   * Override in child classes
   */
  static associations() {
    // Override in child classes to define associations
    // Example:
    // this.hasMany('Comment');
    // this.belongsTo('User');
  }

  /**
   * Application-wide beforeSave callback
   * Override in child classes to add custom logic
   */
  static async _beforeSave(data) {
    // Add any application-wide beforeSave logic here
    // For example: data sanitization, default values, etc.

    // Call parent beforeSave
    return await super._beforeSave(data);
  }

  /**
   * Application-wide afterFind callback
   * Override in child classes to add custom logic
   */
  static async _afterFind(records) {
    // Add any application-wide afterFind logic here
    // For example: data transformation, computed fields, etc.

    // Call parent afterFind
    return await super._afterFind(records);
  }
}

module.exports = AppModel;
