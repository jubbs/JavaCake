const Loader = require('./Loader');

class Router {
  constructor() {
    this.routes = [];
    this.defaultController = 'Pages';
    this.defaultAction = 'index';
  }

  /**
   * Add a custom route
   * @param {string} pattern - URL pattern
   * @param {Object} target - Controller and action target
   */
  addRoute(pattern, target) {
    this.routes.push({
      pattern: this._patternToRegex(pattern),
      originalPattern: pattern,
      controller: target.controller,
      action: target.action || 'index'
    });
  }

  /**
   * Convert URL pattern to regex
   * @param {string} pattern - URL pattern
   * @returns {RegExp} Regular expression
   */
  _patternToRegex(pattern) {
    // Exact match for simple patterns
    if (!pattern.includes(':')) {
      return new RegExp(`^${pattern}$`);
    }

    // Convert :param to named capture groups
    const regex = pattern.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '(?<$1>[^/]+)');
    return new RegExp(`^${regex}$`);
  }

  /**
   * Parse URL into controller, action, and params
   * @param {string} url - Request URL
   * @returns {Object} Parsed route information
   */
  parseUrl(url) {
    // Remove query string
    const path = url.split('?')[0];

    // Remove leading and trailing slashes
    const cleanPath = path.replace(/^\/+|\/+$/g, '');

    // Check custom routes first
    for (const route of this.routes) {
      const match = cleanPath.match(route.pattern);
      if (match) {
        return {
          controller: route.controller,
          action: route.action,
          params: match.groups || {},
          isCustomRoute: true
        };
      }
    }

    // Convention-based routing: /controller/action/param1/param2/...
    if (cleanPath === '') {
      // Root path - default to Pages/home
      return {
        controller: this.defaultController,
        action: 'home',
        params: []
      };
    }

    const segments = cleanPath.split('/');
    const controller = this._capitalize(segments[0] || this.defaultController);
    const action = segments[1] || this.defaultAction;
    const params = segments.slice(2);

    return {
      controller,
      action: this._camelCase(action),
      params
    };
  }

  /**
   * Resolve controller from name
   * @param {string} controllerName - Controller name
   * @returns {Class|null} Controller class
   */
  resolveController(controllerName) {
    // Ensure controller name ends with 'Controller'
    if (!controllerName.endsWith('Controller')) {
      controllerName = `${controllerName}Controller`;
    }

    return Loader.getInstance().loadController(controllerName);
  }

  /**
   * Check if action exists on controller
   * @param {Object} controllerInstance - Controller instance
   * @param {string} actionName - Action name
   * @returns {boolean} True if action exists
   */
  actionExists(controllerInstance, actionName) {
    return typeof controllerInstance[actionName] === 'function';
  }

  /**
   * Get Express middleware for routing
   * @returns {Function} Express middleware
   */
  middleware() {
    return async (req, res, next) => {
      try {
        // Parse the URL
        const route = this.parseUrl(req.path);

        // Try to load the controller
        const ControllerClass = this.resolveController(route.controller);

        if (!ControllerClass) {
          // Controller not found, try default error handling
          return this._handleNotFound(req, res, next);
        }

        // Create controller instance
        const controller = new ControllerClass(req, res);

        // Store route info in controller
        controller.controllerName = route.controller;
        controller.action = route.action;
        controller.params = route.params;

        // Check if action exists
        if (!this.actionExists(controller, route.action)) {
          console.warn(`Action ${route.action} not found on ${route.controller}Controller`);
          return this._handleNotFound(req, res, next);
        }

        // Execute beforeFilter if it exists
        if (typeof controller.beforeFilter === 'function') {
          const beforeResult = await controller.beforeFilter();
          // If beforeFilter returns false or redirects, stop execution
          if (beforeResult === false || res.headersSent) {
            return;
          }
        }

        // Execute the action
        const actionResult = await controller[route.action](...route.params);

        // If action returned false or already sent response, stop execution
        if (actionResult === false || res.headersSent) {
          return;
        }

        // Auto-render view if not already rendered
        if (!res.headersSent && typeof controller.autoRender !== 'undefined' && controller.autoRender !== false) {
          await controller.render();
        }

        // Execute afterFilter if it exists
        if (typeof controller.afterFilter === 'function') {
          await controller.afterFilter();
        }

      } catch (error) {
        console.error('Router error:', error);
        next(error);
      }
    };
  }

  /**
   * Handle 404 Not Found
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   */
  _handleNotFound(req, res, next) {
    // Try to load ErrorsController or send basic 404
    try {
      const ErrorsController = this.resolveController('Errors');
      if (ErrorsController) {
        const controller = new ErrorsController(req, res);
        controller.notFound();
      } else {
        res.status(404).send('<h1>404 - Page Not Found</h1>');
      }
    } catch (error) {
      res.status(404).send('<h1>404 - Page Not Found</h1>');
    }
  }

  /**
   * Generate URL from controller and action
   * @param {string} controller - Controller name
   * @param {string} action - Action name
   * @param {Array} params - URL parameters
   * @returns {string} Generated URL
   */
  url(controller, action = 'index', params = []) {
    let url = `/${this._kebabCase(controller)}`;

    if (action !== 'index') {
      url += `/${this._kebabCase(action)}`;
    }

    if (params.length > 0) {
      url += `/${params.join('/')}`;
    }

    return url;
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
   * Convert to camelCase
   * @param {string} str - String to convert
   * @returns {string} camelCase string
   */
  _camelCase(str) {
    return str
      .split(/[-_]/)
      .map((word, index) => {
        if (index === 0) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
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

  /**
   * Set default controller
   * @param {string} controller - Default controller name
   */
  setDefaultController(controller) {
    this.defaultController = controller;
  }

  /**
   * Set default action
   * @param {string} action - Default action name
   */
  setDefaultAction(action) {
    this.defaultAction = action;
  }

  /**
   * Get all registered routes
   * @returns {Array} Array of routes
   */
  getRoutes() {
    return this.routes.map(route => ({
      pattern: route.originalPattern,
      controller: route.controller,
      action: route.action
    }));
  }
}

module.exports = Router;
