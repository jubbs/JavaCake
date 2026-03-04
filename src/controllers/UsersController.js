const AppController = require('./AppController');
const User = require('../models/User');

class UsersController extends AppController {
  /**
   * Before filter - load Auth component for all actions
   */
  async beforeFilter() {
    await super.beforeFilter();

    // Load Auth component
    this.loadComponent('Auth');

    // Don't require authentication for login and register
    const publicActions = ['login', 'register'];
    if (!publicActions.includes(this.action)) {
      if (!this.Auth.isLoggedIn()) {
        this.flash('Please log in to continue', 'warning');
        this.redirect('/users/login');
        return false;
      }
    }

    // If already logged in, redirect away from login/register
    if (publicActions.includes(this.action) && this.Auth.isLoggedIn()) {
      this.redirect('/');
      return false;
    }
  }

  /**
   * Login action
   */
  async login() {
    if (this.isPost()) {
      const { email, password } = this.req.body;

      // Validate input
      if (!email || !password) {
        this.flash('Please provide email and password', 'error');
        return;
      }

      // Attempt login
      const user = await this.Auth.login(email, password);

      if (user) {
        this.flash(`Welcome back, ${user.name}!`, 'success');
        this.redirect('/');
        return;
      } else {
        this.flash('Invalid email or password', 'error');
      }
    }

    // Render login form
    this.set('title', 'Login');
  }

  /**
   * Register action
   */
  async register() {
    if (this.isPost()) {
      const userData = {
        name: this.req.body.name,
        email: this.req.body.email,
        username: this.req.body.username,
        password: this.req.body.password
      };

      // Validate user data
      const validation = User.validate(userData);
      if (!validation.valid) {
        this.set('errors', validation.errors);
        this.set('userData', userData);
        this.flash(validation.errors.join(', '), 'error');
        return;
      }

      // Check if email already exists
      if (await User.emailExists(userData.email)) {
        this.flash('Email already in use', 'error');
        this.set('userData', userData);
        return;
      }

      // Check if username already exists
      if (await User.usernameExists(userData.username)) {
        this.flash('Username already taken', 'error');
        this.set('userData', userData);
        return;
      }

      // Register user
      const user = await this.Auth.register(userData);

      if (user) {
        this.flash('Registration successful! Welcome to JavaCake!', 'success');
        this.redirect('/');
        return;
      } else {
        this.flash('Registration failed. Please try again.', 'error');
      }
    }

    // Render registration form
    this.set('title', 'Register');
    this.set('userData', {});
  }

  /**
   * Logout action
   */
  async logout() {
    this.Auth.logout();
    this.flash('You have been logged out', 'info');
    this.redirect('/');
  }

  /**
   * User profile action
   */
  async profile() {
    const user = this.Auth.user();

    if (!user) {
      this.redirect('/users/login');
      return;
    }

    // Get full user data
    const fullUser = await User.findById(user.id);
    this.set('user', User.safeUser(fullUser));
    this.set('title', 'My Profile');
  }

  /**
   * Edit profile action
   */
  async edit() {
    const currentUser = this.Auth.user();

    if (!currentUser) {
      this.redirect('/users/login');
      return;
    }

    if (this.isPost()) {
      const updateData = {
        name: this.req.body.name,
        email: this.req.body.email,
        username: this.req.body.username
      };

      // Only update password if provided
      if (this.req.body.password && this.req.body.password.trim() !== '') {
        updateData.password = this.req.body.password;
      }

      // Validate
      const validation = User.validate(updateData);
      if (!validation.valid) {
        this.set('errors', validation.errors);
        this.flash(validation.errors.join(', '), 'error');
        return;
      }

      // Check if email changed and already exists
      if (updateData.email !== currentUser.email) {
        if (await User.emailExists(updateData.email)) {
          this.flash('Email already in use', 'error');
          return;
        }
      }

      // Check if username changed and already exists
      if (updateData.username !== currentUser.username) {
        if (await User.usernameExists(updateData.username)) {
          this.flash('Username already taken', 'error');
          return;
        }
      }

      // Update user
      const updatedUser = await this.Auth.updateUser(updateData);

      if (updatedUser) {
        this.flash('Profile updated successfully', 'success');
        this.redirect('/users/profile');
        return;
      } else {
        this.flash('Failed to update profile', 'error');
      }
    }

    // Get user data for form
    const user = await User.findById(currentUser.id);
    this.set('user', User.safeUser(user));
    this.set('title', 'Edit Profile');
  }

  /**
   * List all users (admin only)
   */
  async index() {
    // Check if admin
    if (!this.Auth.isAdmin()) {
      this.flash('Access denied', 'error');
      this.redirect('/');
      return;
    }

    const users = await User.findAll({
      order: ['created_at', 'DESC']
    });

    // Remove passwords
    const safeUsers = users.map(user => User.safeUser(user));

    this.set('users', safeUsers);
    this.set('title', 'All Users');
  }

  /**
   * View user profile (public or admin)
   */
  async view(id) {
    const user = await User.findById(id);

    if (!user) {
      this.flash('User not found', 'error');
      this.redirect('/');
      return;
    }

    // Check if user can view this profile
    const currentUser = this.Auth.user();
    if (!currentUser || (currentUser.id !== parseInt(id) && !this.Auth.isAdmin())) {
      this.flash('Access denied', 'error');
      this.redirect('/');
      return;
    }

    this.set('user', User.safeUser(user));
    this.set('title', `${user.name}'s Profile`);
  }

  /**
   * Delete user (admin only)
   */
  async delete(id) {
    // Check if admin
    if (!this.Auth.isAdmin()) {
      this.flash('Access denied', 'error');
      this.redirect('/');
      return;
    }

    const currentUser = this.Auth.user();

    // Don't allow deleting self
    if (currentUser.id === parseInt(id)) {
      this.flash('You cannot delete your own account', 'error');
      this.redirect('/users');
      return;
    }

    const deleted = await User.delete(id);

    if (deleted) {
      this.flash('User deleted successfully', 'success');
    } else {
      this.flash('Failed to delete user', 'error');
    }

    this.redirect('/users');
  }
}

module.exports = UsersController;
