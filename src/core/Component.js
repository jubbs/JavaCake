class Component {
  constructor(controller) {
    this.controller = controller;
    this.req = controller.req;
    this.res = controller.res;
  }

  /**
   * Initialize component
   * Override in child classes
   */
  initialize() {
    // Override in child classes
  }

  /**
   * Startup hook - called after initialization
   * Override in child classes
   */
  startup() {
    // Override in child classes
  }

  /**
   * Get session data
   * @param {string} key - Session key
   * @returns {any} Session value
   */
  session(key) {
    if (!this.req.session) {
      return null;
    }
    return this.req.session[key];
  }

  /**
   * Set session data
   * @param {string} key - Session key
   * @param {any} value - Session value
   */
  setSession(key, value) {
    if (this.req.session) {
      this.req.session[key] = value;
    }
  }

  /**
   * Delete session data
   * @param {string} key - Session key
   */
  deleteSession(key) {
    if (this.req.session) {
      delete this.req.session[key];
    }
  }

  /**
   * Redirect helper
   * @param {string} url - URL to redirect to
   * @param {number} status - HTTP status code
   */
  redirect(url, status = 302) {
    this.controller.redirect(url, status);
  }

  /**
   * Flash message helper
   * @param {string} message - Message text
   * @param {string} type - Message type
   */
  flash(message, type = 'info') {
    this.controller.flash(message, type);
  }
}

module.exports = Component;
