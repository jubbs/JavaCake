const path = require('path');
const fs = require('fs');

class Loader {
  constructor() {
    this.cache = {
      controllers: {},
      models: {},
      components: {},
      helpers: {}
    };
    this.basePath = path.join(__dirname, '../..');
  }

  /**
   * Load a controller by name
   * @param {string} name - Controller name (without Controller suffix)
   * @returns {Class} Controller class
   */
  loadController(name) {
    const controllerName = name.endsWith('Controller') ? name : `${name}Controller`;

    // Check cache
    if (this.cache.controllers[controllerName]) {
      return this.cache.controllers[controllerName];
    }

    try {
      // Try different naming conventions
      const possiblePaths = [
        path.join(this.basePath, 'src', 'controllers', `${controllerName}.js`),
        path.join(this.basePath, 'src', 'controllers', `${name}Controller.js`),
        path.join(this.basePath, 'src', 'controllers', `${this._capitalize(name)}Controller.js`)
      ];

      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          const Controller = require(filePath);
          this.cache.controllers[controllerName] = Controller;
          return Controller;
        }
      }

      throw new Error(`Controller not found: ${controllerName}`);
    } catch (error) {
      console.error(`Error loading controller ${controllerName}:`, error.message);
      return null;
    }
  }

  /**
   * Load a model by name
   * @param {string} name - Model name
   * @returns {Class} Model class
   */
  loadModel(name) {
    // Check cache
    if (this.cache.models[name]) {
      return this.cache.models[name];
    }

    try {
      // Try different naming conventions
      const possiblePaths = [
        path.join(this.basePath, 'src', 'models', `${name}.js`),
        path.join(this.basePath, 'src', 'models', `${this._capitalize(name)}.js`),
        path.join(this.basePath, 'src', 'models', `${this._pascalCase(name)}.js`)
      ];

      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          const Model = require(filePath);
          this.cache.models[name] = Model;

          // Initialize associations if defined
          if (typeof Model.associations === 'function') {
            Model.associations();
          }

          return Model;
        }
      }

      throw new Error(`Model not found: ${name}`);
    } catch (error) {
      console.error(`Error loading model ${name}:`, error.message);
      return null;
    }
  }

  /**
   * Load a component by name
   * @param {string} name - Component name (without Component suffix)
   * @returns {Class} Component class
   */
  loadComponent(name) {
    const componentName = name.endsWith('Component') ? name : `${name}Component`;

    // Check cache
    if (this.cache.components[componentName]) {
      return this.cache.components[componentName];
    }

    try {
      const possiblePaths = [
        path.join(this.basePath, 'src', 'components', `${componentName}.js`),
        path.join(this.basePath, 'src', 'components', `${name}Component.js`),
        path.join(this.basePath, 'src', 'components', `${this._capitalize(name)}Component.js`)
      ];

      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          const Component = require(filePath);
          this.cache.components[componentName] = Component;
          return Component;
        }
      }

      throw new Error(`Component not found: ${componentName}`);
    } catch (error) {
      console.error(`Error loading component ${componentName}:`, error.message);
      return null;
    }
  }

  /**
   * Load a helper by name
   * @param {string} name - Helper name (without Helper suffix)
   * @returns {Object} Helper module
   */
  loadHelper(name) {
    const helperName = name.endsWith('Helper') ? name : `${name}Helper`;

    // Check cache
    if (this.cache.helpers[helperName]) {
      return this.cache.helpers[helperName];
    }

    try {
      const possiblePaths = [
        path.join(this.basePath, 'src', 'helpers', `${helperName}.js`),
        path.join(this.basePath, 'src', 'helpers', `${name}Helper.js`),
        path.join(this.basePath, 'src', 'helpers', `${this._capitalize(name)}Helper.js`)
      ];

      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          const Helper = require(filePath);
          this.cache.helpers[helperName] = Helper;
          return Helper;
        }
      }

      throw new Error(`Helper not found: ${helperName}`);
    } catch (error) {
      console.error(`Error loading helper ${helperName}:`, error.message);
      return null;
    }
  }

  /**
   * Check if a controller exists
   * @param {string} name - Controller name
   * @returns {boolean} True if exists
   */
  controllerExists(name) {
    const controllerName = name.endsWith('Controller') ? name : `${name}Controller`;

    if (this.cache.controllers[controllerName]) {
      return true;
    }

    const possiblePaths = [
      path.join(this.basePath, 'src', 'controllers', `${controllerName}.js`),
      path.join(this.basePath, 'src', 'controllers', `${name}Controller.js`),
      path.join(this.basePath, 'src', 'controllers', `${this._capitalize(name)}Controller.js`)
    ];

    return possiblePaths.some(filePath => fs.existsSync(filePath));
  }

  /**
   * Check if a model exists
   * @param {string} name - Model name
   * @returns {boolean} True if exists
   */
  modelExists(name) {
    if (this.cache.models[name]) {
      return true;
    }

    const possiblePaths = [
      path.join(this.basePath, 'src', 'models', `${name}.js`),
      path.join(this.basePath, 'src', 'models', `${this._capitalize(name)}.js`),
      path.join(this.basePath, 'src', 'models', `${this._pascalCase(name)}.js`)
    ];

    return possiblePaths.some(filePath => fs.existsSync(filePath));
  }

  /**
   * Clear the cache
   * @param {string} type - Cache type to clear (controllers, models, components, helpers, or 'all')
   */
  clearCache(type = 'all') {
    if (type === 'all') {
      this.cache = {
        controllers: {},
        models: {},
        components: {},
        helpers: {}
      };
    } else if (this.cache[type]) {
      this.cache[type] = {};
    }
  }

  /**
   * Get all cached items
   * @returns {Object} Cache object
   */
  getCache() {
    return this.cache;
  }

  /**
   * Capitalize first letter
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Convert to PascalCase
   * @param {string} str - String to convert
   * @returns {string} PascalCase string
   */
  _pascalCase(str) {
    return str
      .split(/[-_]/)
      .map(word => this._capitalize(word))
      .join('');
  }

  /**
   * Convert to snake_case
   * @param {string} str - String to convert
   * @returns {string} snake_case string
   */
  _snakeCase(str) {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  /**
   * Convert to kebab-case
   * @param {string} str - String to convert
   * @returns {string} kebab-case string
   */
  _kebabCase(str) {
    return str
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
  }
}

// Singleton instance
const loader = new Loader();

module.exports = loader;
