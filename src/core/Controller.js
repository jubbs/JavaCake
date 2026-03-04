const View = require('./View');
const loader = require('./Loader');

class Controller {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.viewVars = {};
    this.components = {};
    this.autoRender = true;
    this.layout = 'default';
    this.controllerName = '';
    this.action = '';
    this.params = [];
  }

  /**
   * Lifecycle hook - runs before action
   * Override in child classes
   * @returns {Promise<boolean|void>} Return false to stop execution
   */
  async beforeFilter() {
    // Override in child classes
  }

  /**
   * Lifecycle hook - runs after action
   * Override in child classes
   */
  async afterFilter() {
    // Override in child classes
  }

  /**
   * Set a variable to pass to the view
   * @param {string|Object} key - Variable name or object of variables
   * @param {any} value - Variable value
   */
  set(key, value) {
    if (typeof key === 'object') {
      Object.assign(this.viewVars, key);
    } else {
      this.viewVars[key] = value;
    }
  }

  /**
   * Render a view
   * @param {string} view - View path (optional, defaults to controller/action)
   * @param {Object} data - Additional data to pass to view
   */
  async render(view = null, data = {}) {
    if (this.res.headersSent) {
      return;
    }

    try {
      // Merge view vars with additional data
      const viewData = { ...this.viewVars, ...data };

      // Add request and session data to view
      viewData.req = this.req;
      viewData.session = this.req.session || {};
      viewData.flash = this._getFlashMessages();

      // Load helpers
      viewData.FormHelper = this._loadHelper('Form');
      viewData.HtmlHelper = this._loadHelper('Html');
      viewData.AuthHelper = this._loadHelper('Auth');

      // Determine view path
      if (!view) {
        // Auto-detect view from controller/action
        const controllerName = this.controllerName.replace('Controller', '').toLowerCase();
        const actionName = this._snakeCase(this.action);
        view = `${controllerName}/${actionName}`;
      }

      // Render view with layout
      const viewRenderer = new View();
      const html = await viewRenderer.render(view, viewData, this.layout);

      this.res.send(html);
    } catch (error) {
      console.error('Error rendering view:', error);
      this.res.status(500).send(`<h1>Error rendering view</h1><pre>${error.message}</pre>`);
    }
  }

  /**
   * Redirect to a URL
   * @param {string} url - URL to redirect to
   * @param {number} status - HTTP status code (default 302)
   */
  redirect(url, status = 302) {
    if (this.res.headersSent) {
      return;
    }

    this.autoRender = false;
    this.res.redirect(status, url);
  }

  /**
   * Send JSON response
   * @param {Object} data - Data to send
   * @param {number} status - HTTP status code
   */
  json(data, status = 200) {
    if (this.res.headersSent) {
      return;
    }

    this.autoRender = false;
    this.res.status(status).json(data);
  }

  /**
   * Set flash message
   * @param {string} message - Message text
   * @param {string} type - Message type (success, error, warning, info)
   */
  flash(message, type = 'info') {
    if (!this.req.session) {
      console.warn('Session not initialized. Flash messages require session support.');
      return;
    }

    if (!this.req.session.flash) {
      this.req.session.flash = [];
    }

    this.req.session.flash.push({ message, type });
  }

  /**
   * Get and clear flash messages
   * @returns {Array} Flash messages
   */
  _getFlashMessages() {
    if (!this.req.session || !this.req.session.flash) {
      return [];
    }

    const messages = this.req.session.flash;
    this.req.session.flash = [];
    return messages;
  }

  /**
   * Load a component
   * @param {string} name - Component name
   * @returns {Object} Component instance
   */
  loadComponent(name) {
    if (this.components[name]) {
      return this.components[name];
    }

    const ComponentClass = loader.loadComponent(name);

    if (!ComponentClass) {
      throw new Error(`Component ${name} not found`);
    }

    const component = new ComponentClass(this);

    // Initialize component
    if (typeof component.initialize === 'function') {
      component.initialize();
    }

    // Store component
    this.components[name] = component;
    this[name] = component;

    return component;
  }

  /**
   * Load a helper
   * @param {string} name - Helper name
   * @returns {Object} Helper module
   */
  _loadHelper(name) {
    try {
      return loader.loadHelper(name);
    } catch (error) {
      console.warn(`Helper ${name} not found:`, error.message);
      return {};
    }
  }

  /**
   * Disable auto-rendering
   */
  disableAutoRender() {
    this.autoRender = false;
  }

  /**
   * Set layout
   * @param {string|null} layout - Layout name or null for no layout
   */
  setLayout(layout) {
    this.layout = layout;
  }

  /**
   * Check if request is POST
   * @returns {boolean} True if POST request
   */
  isPost() {
    return this.req.method === 'POST';
  }

  /**
   * Check if request is GET
   * @returns {boolean} True if GET request
   */
  isGet() {
    return this.req.method === 'GET';
  }

  /**
   * Check if request is AJAX
   * @returns {boolean} True if AJAX request
   */
  isAjax() {
    return this.req.xhr || this.req.headers['x-requested-with'] === 'XMLHttpRequest';
  }

  /**
   * Get request parameter
   * @param {string} key - Parameter key
   * @param {any} defaultValue - Default value if not found
   * @returns {any} Parameter value
   */
  param(key, defaultValue = null) {
    return this.req.body[key] || this.req.query[key] || this.req.params[key] || defaultValue;
  }

  /**
   * Get all request data
   * @returns {Object} Request data
   */
  data() {
    return {
      ...this.req.query,
      ...this.req.body,
      ...this.req.params
    };
  }

  /**
   * Set HTTP status code
   * @param {number} code - Status code
   */
  status(code) {
    this.res.status(code);
  }

  /**
   * Send text response
   * @param {string} text - Text to send
   * @param {number} status - HTTP status code
   */
  text(text, status = 200) {
    if (this.res.headersSent) {
      return;
    }

    this.autoRender = false;
    this.res.status(status).send(text);
  }

  /**
   * Load a model
   * @param {string} name - Model name
   * @returns {Class} Model class
   */
  loadModel(name) {
    return loader.loadModel(name);
  }

  /**
   * Convert string to snake_case
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
   * Handle errors gracefully
   * @param {Error} error - Error object
   * @param {string} message - Custom error message
   */
  handleError(error, message = 'An error occurred') {
    console.error('Controller error:', error);

    if (this.isAjax()) {
      this.json({ error: message, details: error.message }, 500);
    } else {
      this.set('error', error);
      this.set('message', message);
      this.render('errors/500');
    }
  }

  /**
   * Require authentication (helper method)
   * @returns {boolean} True if authenticated
   */
  requireAuth() {
    if (!this.Auth || !this.Auth.isLoggedIn()) {
      this.flash('You must be logged in to access this page', 'error');
      this.redirect('/users/login');
      return false;
    }
    return true;
  }

  /**
   * Get current user from session
   * @returns {Object|null} Current user or null
   */
  currentUser() {
    if (this.Auth) {
      return this.Auth.user();
    }

    if (this.req.session && this.req.session.user) {
      return this.req.session.user;
    }

    return null;
  }

  /**
   * Paginate data
   * @param {Array} data - Data to paginate
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {Object} Paginated data and info
   */
  paginate(data, page = 1, limit = 10) {
    const total = data.length;
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedData = data.slice(offset, offset + limit);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    };
  }
}

module.exports = Controller;
