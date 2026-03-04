/**
 * AuthHelper - Helper for authentication in views
 * Note: This helper needs to be passed session data from the controller
 */
class AuthHelper {
  /**
   * Check if user is logged in
   * @param {Object} session - Session object from request
   * @returns {boolean} True if logged in
   */
  static isLoggedIn(session) {
    if (!session) return false;
    return session.Auth && session.Auth.id ? true : false;
  }

  /**
   * Get current user data
   * @param {Object} session - Session object from request
   * @param {string} field - Specific field to get (optional)
   * @returns {Object|any|null} User object, field value, or null
   */
  static user(session, field = null) {
    if (!session || !session.Auth) {
      return null;
    }

    const user = session.Auth;

    if (field) {
      return user[field] || null;
    }

    return user;
  }

  /**
   * Get user's name
   * @param {Object} session - Session object from request
   * @returns {string} User's name or 'Guest'
   */
  static userName(session) {
    if (!session || !session.Auth) {
      return 'Guest';
    }
    return session.Auth.name || 'User';
  }

  /**
   * Get user's email
   * @param {Object} session - Session object from request
   * @returns {string|null} User's email or null
   */
  static userEmail(session) {
    if (!session || !session.Auth) {
      return null;
    }
    return session.Auth.email || null;
  }

  /**
   * Get user's ID
   * @param {Object} session - Session object from request
   * @returns {number|null} User's ID or null
   */
  static userId(session) {
    if (!session || !session.Auth) {
      return null;
    }
    return session.Auth.id || null;
  }

  /**
   * Check if user has a specific role
   * @param {Object} session - Session object from request
   * @param {string} role - Role to check
   * @returns {boolean} True if user has role
   */
  static hasRole(session, role) {
    if (!session || !session.Auth) {
      return false;
    }

    const user = session.Auth;

    if (user.role) {
      if (Array.isArray(user.role)) {
        return user.role.includes(role);
      }
      return user.role === role;
    }

    return false;
  }

  /**
   * Check if user is admin
   * @param {Object} session - Session object from request
   * @returns {boolean} True if user is admin
   */
  static isAdmin(session) {
    return this.hasRole(session, 'admin');
  }

  /**
   * Check if user has permission
   * @param {Object} session - Session object from request
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  static hasPermission(session, permission) {
    if (!session || !session.Auth) {
      return false;
    }

    const user = session.Auth;

    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }

    return false;
  }

  /**
   * Generate login link
   * @param {string} text - Link text
   * @param {Object} options - Link options
   * @returns {string} HTML login link
   */
  static loginLink(text = 'Login', options = {}) {
    const className = options.class || '';
    const id = options.id || '';

    return `<a href="/users/login" class="${className}" id="${id}">${text}</a>`;
  }

  /**
   * Generate logout link
   * @param {string} text - Link text
   * @param {Object} options - Link options
   * @returns {string} HTML logout link
   */
  static logoutLink(text = 'Logout', options = {}) {
    const className = options.class || '';
    const id = options.id || '';

    return `<a href="/users/logout" class="${className}" id="${id}">${text}</a>`;
  }

  /**
   * Generate register link
   * @param {string} text - Link text
   * @param {Object} options - Link options
   * @returns {string} HTML register link
   */
  static registerLink(text = 'Register', options = {}) {
    const className = options.class || '';
    const id = options.id || '';

    return `<a href="/users/register" class="${className}" id="${id}">${text}</a>`;
  }

  /**
   * Generate profile link
   * @param {string} text - Link text
   * @param {Object} options - Link options
   * @returns {string} HTML profile link
   */
  static profileLink(text = 'Profile', options = {}) {
    const className = options.class || '';
    const id = options.id || '';

    return `<a href="/users/profile" class="${className}" id="${id}">${text}</a>`;
  }

  /**
   * Generate user menu (login/logout based on auth status)
   * @param {Object} session - Session object from request
   * @param {Object} options - Menu options
   * @returns {string} HTML user menu
   */
  static userMenu(session, options = {}) {
    const className = options.class || 'user-menu';

    if (this.isLoggedIn(session)) {
      const userName = this.userName(session);
      return `
        <div class="${className}">
          <span>Welcome, ${userName}!</span>
          ${this.profileLink('Profile', { class: 'menu-link' })}
          ${this.logoutLink('Logout', { class: 'menu-link' })}
        </div>
      `;
    } else {
      return `
        <div class="${className}">
          ${this.loginLink('Login', { class: 'menu-link' })}
          ${this.registerLink('Register', { class: 'menu-link' })}
        </div>
      `;
    }
  }

  /**
   * Check if current user owns the resource
   * @param {Object} session - Session object from request
   * @param {number} ownerId - ID of resource owner
   * @returns {boolean} True if current user is the owner
   */
  static isOwner(session, ownerId) {
    if (!session || !session.Auth) {
      return false;
    }

    return session.Auth.id === ownerId;
  }

  /**
   * Check if current user owns resource or is admin
   * @param {Object} session - Session object from request
   * @param {number} ownerId - ID of resource owner
   * @returns {boolean} True if current user is owner or admin
   */
  static canManage(session, ownerId) {
    return this.isOwner(session, ownerId) || this.isAdmin(session);
  }

  /**
   * Get user avatar/initials
   * @param {Object} session - Session object from request
   * @param {Object} options - Avatar options
   * @returns {string} HTML for user avatar or initials
   */
  static userAvatar(session, options = {}) {
    const className = options.class || 'user-avatar';
    const size = options.size || 40;

    if (!session || !session.Auth) {
      return `<div class="${className}" style="width: ${size}px; height: ${size}px;">?</div>`;
    }

    const user = session.Auth;

    // If user has avatar URL
    if (user.avatar) {
      return `<img src="${user.avatar}" alt="${user.name}" class="${className}" style="width: ${size}px; height: ${size}px;">`;
    }

    // Generate initials
    const initials = user.name
      ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
      : '?';

    return `<div class="${className}" style="width: ${size}px; height: ${size}px; display: inline-flex; align-items: center; justify-content: center; background: #007bff; color: white; border-radius: 50%; font-weight: bold;">${initials}</div>`;
  }
}

module.exports = AuthHelper;
