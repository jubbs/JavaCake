const Controller = require('../core/Controller');

/**
 * AppController - Base controller for all application controllers
 * Extend this class in your controllers to add application-wide controller functionality
 */
class AppController extends Controller {
  constructor(req, res) {
    super(req, res);

    // Set default layout
    this.layout = 'default';

    // Make current user available to all actions
    this.currentUser = this.currentUser();
  }

  /**
   * Application-wide beforeFilter
   * Override in child classes to add custom logic
   * Don't forget to call super.beforeFilter() if you override
   */
  async beforeFilter() {
    // Add any application-wide beforeFilter logic here
    // For example: logging, analytics, setting global view variables

    // Make current user available in all views
    if (this.currentUser) {
      this.set('currentUser', this.currentUser);
    }
  }

  /**
   * Application-wide afterFilter
   * Override in child classes to add custom logic
   * Don't forget to call super.afterFilter() if you override
   */
  async afterFilter() {
    // Add any application-wide afterFilter logic here
  }

  /**
   * Helper method to check if user is logged in
   * Redirects to login page if not authenticated
   */
  requireLogin() {
    if (!this.currentUser) {
      this.flash('Please log in to continue', 'warning');
      this.redirect('/users/login');
      return false;
    }
    return true;
  }

  /**
   * Helper method to check if user is admin
   * Redirects to home if not admin
   */
  requireAdmin() {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      this.flash('Access denied: Admin privileges required', 'error');
      this.redirect('/');
      return false;
    }
    return true;
  }

  /**
   * Helper method to paginate results
   * @param {Array} items - Items to paginate
   * @param {number} page - Current page number
   * @param {number} perPage - Items per page
   * @returns {Object} Pagination data
   */
  paginateResults(items, page = 1, perPage = 10) {
    const total = items.length;
    const totalPages = Math.ceil(total / perPage);
    const offset = (page - 1) * perPage;
    const paginatedItems = items.slice(offset, offset + perPage);

    return {
      items: paginatedItems,
      currentPage: page,
      totalPages,
      perPage,
      total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }
}

module.exports = AppController;
