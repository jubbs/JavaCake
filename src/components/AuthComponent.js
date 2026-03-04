const Component = require('../core/Component');
const bcrypt = require('bcrypt');

class AuthComponent extends Component {
  constructor(controller) {
    super(controller);
    this.userModel = null;
    this.sessionKey = 'Auth';
    this.saltRounds = 10;
  }

  /**
   * Initialize component
   */
  initialize() {
    // Load User model by default
    try {
      const loader = require('../core/Loader');
      this.userModel = loader.loadModel('User');
    } catch (error) {
      console.warn('User model not found. Authentication may not work properly.');
    }
  }

  /**
   * Authenticate user with email/username and password
   * @param {string} identifier - Email or username
   * @param {string} password - Plain text password
   * @returns {Promise<Object|null>} User object or null
   */
  async login(identifier, password) {
    if (!this.userModel) {
      throw new Error('User model not loaded');
    }

    try {
      // Find user by email or username
      const users = await this.userModel.find({
        email: identifier
      });

      if (users.length === 0) {
        // Try finding by username if email fails
        const usersByUsername = await this.userModel.find({
          username: identifier
        });

        if (usersByUsername.length === 0) {
          return null;
        }

        const user = usersByUsername[0];
        return await this._verifyAndLogin(user, password);
      }

      const user = users[0];
      return await this._verifyAndLogin(user, password);

    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  /**
   * Verify password and login user
   * @param {Object} user - User object
   * @param {string} password - Plain text password
   * @returns {Promise<Object|null>} User object or null
   */
  async _verifyAndLogin(user, password) {
    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return null;
    }

    // Remove password from user object
    const safeUser = { ...user };
    delete safeUser.password;

    // Store user in session
    this.setSession(this.sessionKey, safeUser);

    return safeUser;
  }

  /**
   * Logout current user
   */
  logout() {
    this.deleteSession(this.sessionKey);

    // Destroy entire session
    if (this.req.session) {
      this.req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
        }
      });
    }
  }

  /**
   * Get current user from session
   * @param {string} field - Specific field to get (optional)
   * @returns {Object|any|null} User object, field value, or null
   */
  user(field = null) {
    const user = this.session(this.sessionKey);

    if (!user) {
      return null;
    }

    if (field) {
      return user[field] || null;
    }

    return user;
  }

  /**
   * Check if user is logged in
   * @returns {boolean} True if logged in
   */
  isLoggedIn() {
    return this.user() !== null;
  }

  /**
   * Require authentication - redirect if not logged in
   * @param {string} redirectUrl - URL to redirect to if not logged in
   * @returns {boolean} True if authenticated
   */
  requireAuth(redirectUrl = '/users/login') {
    if (!this.isLoggedIn()) {
      this.flash('You must be logged in to access this page', 'error');
      this.redirect(redirectUrl);
      return false;
    }
    return true;
  }

  /**
   * Check if current user has permission
   * @param {string} permission - Permission name
   * @returns {boolean} True if user has permission
   */
  hasPermission(permission) {
    const user = this.user();

    if (!user) {
      return false;
    }

    // Check if user has permission (you can customize this logic)
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }

    return false;
  }

  /**
   * Check if current user has role
   * @param {string} role - Role name
   * @returns {boolean} True if user has role
   */
  hasRole(role) {
    const user = this.user();

    if (!user) {
      return false;
    }

    if (user.role) {
      if (Array.isArray(user.role)) {
        return user.role.includes(role);
      }
      return user.role === role;
    }

    return false;
  }

  /**
   * Check if current user is admin
   * @returns {boolean} True if admin
   */
  isAdmin() {
    return this.hasRole('admin');
  }

  /**
   * Hash a password
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify a password against a hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Register a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object|null>} Created user or null
   */
  async register(userData) {
    if (!this.userModel) {
      throw new Error('User model not loaded');
    }

    try {
      // Hash password
      if (userData.password) {
        userData.password = await this.hashPassword(userData.password);
      }

      // Create user
      const user = await this.userModel.save(userData);

      // Auto-login after registration
      if (user) {
        const safeUser = { ...user };
        delete safeUser.password;
        this.setSession(this.sessionKey, safeUser);
      }

      return user;
    } catch (error) {
      console.error('Registration error:', error);
      return null;
    }
  }

  /**
   * Update current user's data
   * @param {Object} userData - User data to update
   * @returns {Promise<Object|null>} Updated user or null
   */
  async updateUser(userData) {
    const currentUser = this.user();

    if (!currentUser) {
      return null;
    }

    try {
      // Hash password if being updated
      if (userData.password) {
        userData.password = await this.hashPassword(userData.password);
      }

      // Update user
      const updatedUser = await this.userModel.update(currentUser.id, userData);

      // Update session
      if (updatedUser) {
        const safeUser = { ...updatedUser };
        delete safeUser.password;
        this.setSession(this.sessionKey, safeUser);
      }

      return updatedUser;
    } catch (error) {
      console.error('Update user error:', error);
      return null;
    }
  }

  /**
   * Allow access only to specific roles
   * @param {string|Array} roles - Role(s) to allow
   * @param {string} redirectUrl - URL to redirect if access denied
   * @returns {boolean} True if access granted
   */
  allowRole(roles, redirectUrl = '/') {
    if (!Array.isArray(roles)) {
      roles = [roles];
    }

    if (!this.isLoggedIn()) {
      this.flash('You must be logged in', 'error');
      this.redirect('/users/login');
      return false;
    }

    const hasAccess = roles.some(role => this.hasRole(role));

    if (!hasAccess) {
      this.flash('You do not have permission to access this page', 'error');
      this.redirect(redirectUrl);
      return false;
    }

    return true;
  }

  /**
   * Allow access only to the owner or admin
   * @param {number} ownerId - ID of the resource owner
   * @param {string} redirectUrl - URL to redirect if access denied
   * @returns {boolean} True if access granted
   */
  allowOwnerOrAdmin(ownerId, redirectUrl = '/') {
    const user = this.user();

    if (!user) {
      this.flash('You must be logged in', 'error');
      this.redirect('/users/login');
      return false;
    }

    if (user.id === ownerId || this.isAdmin()) {
      return true;
    }

    this.flash('You do not have permission to access this resource', 'error');
    this.redirect(redirectUrl);
    return false;
  }
}

module.exports = AuthComponent;
