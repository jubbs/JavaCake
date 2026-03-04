# Authentication

JavaCake includes a built-in authentication system with bcrypt password hashing, session management, and role-based authorization.

## Table of Contents

- [Setup](#setup)
- [User Model](#user-model)
- [AuthComponent](#authcomponent)
- [Login and Registration](#login-and-registration)
- [Protecting Routes](#protecting-routes)
- [Authorization](#authorization)
- [Best Practices](#best-practices)

## Setup

### Database Table

Create a users table:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Session Configuration

Sessions are configured in `config/app.js`:

```javascript
module.exports = {
  session: {
    secret: 'change-this-to-a-random-string',  // IMPORTANT!
    cookie: {
      maxAge: 3600000,  // 1 hour in milliseconds
      httpOnly: true,    // Prevents JavaScript access
      secure: false      // Set to true in production with HTTPS
    }
  }
};
```

## User Model

The User model handles password hashing automatically:

```javascript
// src/models/User.js
const AppModel = require('./AppModel');
const bcrypt = require('bcrypt');

class User extends AppModel {
  static tableName = 'users';

  /**
   * Hash password before saving
   */
  static async _beforeSave(data) {
    // Hash password if it's being set and not already hashed
    if (data.password && !data.password.startsWith('$2b$')) {
      const saltRounds = 10;
      data.password = await bcrypt.hash(data.password, saltRounds);
    }
    return data;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const users = await this.find({ email });
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Remove password from results
   */
  static safeUser(user) {
    if (!user) return null;
    const safeUser = { ...user };
    delete safeUser.password;
    return safeUser;
  }

  /**
   * Validation
   */
  static validate(data) {
    const errors = [];

    if (!data.name) {
      errors.push('Name is required');
    }

    if (!data.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }

    if (!data.username) {
      errors.push('Username is required');
    } else if (data.username.length < 3) {
      errors.push('Username must be at least 3 characters');
    }

    if (data.password !== undefined && data.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = User;
```

## AuthComponent

The AuthComponent handles authentication logic.

### Loading AuthComponent

```javascript
class PostsController extends AppController {
  async beforeFilter() {
    await super.beforeFilter();

    // Load Auth component
    this.loadComponent('Auth');

    // Now available as this.Auth
  }
}
```

### Authentication Methods

#### Login

```javascript
async login() {
  if (this.isPost()) {
    const { email, password } = this.req.body;

    // Attempt login
    const user = await this.Auth.login(email, password);

    if (user) {
      this.flash('Welcome back!', 'success');
      this.redirect('/');
    } else {
      this.flash('Invalid email or password', 'error');
    }
  }
}
```

#### Logout

```javascript
async logout() {
  this.Auth.logout();
  this.flash('You have been logged out', 'info');
  this.redirect('/');
}
```

#### Register

```javascript
async register() {
  if (this.isPost()) {
    const userData = {
      name: this.req.body.name,
      email: this.req.body.email,
      username: this.req.body.username,
      password: this.req.body.password
    };

    // Validate
    const validation = User.validate(userData);
    if (!validation.valid) {
      this.flash(validation.errors.join(', '), 'error');
      return;
    }

    // Check if email exists
    if (await User.emailExists(userData.email)) {
      this.flash('Email already in use', 'error');
      return;
    }

    // Register (auto-login after)
    const user = await this.Auth.register(userData);

    if (user) {
      this.flash('Registration successful!', 'success');
      this.redirect('/');
    } else {
      this.flash('Registration failed', 'error');
    }
  }
}
```

#### Get Current User

```javascript
// Get entire user object
const user = this.Auth.user();

// Get specific field
const userId = this.Auth.user('id');
const userName = this.Auth.user('name');
const userEmail = this.Auth.user('email');

// Check if logged in
if (this.Auth.isLoggedIn()) {
  // User is authenticated
}
```

## Login and Registration

### UsersController

```javascript
// src/controllers/UsersController.js
const AppController = require('./AppController');
const User = require('../models/User');

class UsersController extends AppController {
  async beforeFilter() {
    await super.beforeFilter();
    this.loadComponent('Auth');

    // Public actions (don't require auth)
    const publicActions = ['login', 'register'];

    if (!publicActions.includes(this.action)) {
      // Require authentication
      if (!this.Auth.isLoggedIn()) {
        this.flash('Please log in', 'error');
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

  async login() {
    if (this.isPost()) {
      const { email, password } = this.req.body;

      if (!email || !password) {
        this.flash('Please provide email and password', 'error');
        return;
      }

      const user = await this.Auth.login(email, password);

      if (user) {
        this.flash(`Welcome back, ${user.name}!`, 'success');
        this.redirect('/');
        return;
      } else {
        this.flash('Invalid credentials', 'error');
      }
    }

    this.set('title', 'Login');
  }

  async register() {
    if (this.isPost()) {
      const userData = {
        name: this.req.body.name,
        email: this.req.body.email,
        username: this.req.body.username,
        password: this.req.body.password
      };

      const validation = User.validate(userData);
      if (!validation.valid) {
        this.flash(validation.errors.join(', '), 'error');
        this.set('userData', userData);
        return;
      }

      if (await User.emailExists(userData.email)) {
        this.flash('Email already in use', 'error');
        this.set('userData', userData);
        return;
      }

      const user = await this.Auth.register(userData);

      if (user) {
        this.flash('Welcome to JavaCake!', 'success');
        this.redirect('/');
        return;
      }
    }

    this.set('title', 'Register');
    this.set('userData', {});
  }

  async logout() {
    this.Auth.logout();
    this.flash('Logged out successfully', 'info');
    this.redirect('/');
  }

  async profile() {
    const user = this.Auth.user();
    const fullUser = await User.findById(user.id);

    this.set('user', User.safeUser(fullUser));
    this.set('title', 'My Profile');
  }
}

module.exports = UsersController;
```

### Login View

```html
<!-- src/views/users/login.ejs -->
<div class="auth-container">
  <h1>Login</h1>

  <%- FormHelper.create('/users/login', { class: 'auth-form' }) %>
    <div class="form-group">
      <%- FormHelper.label('email', 'Email') %>
      <%- FormHelper.input('email', {
        type: 'email',
        placeholder: 'Enter your email',
        required: true,
        class: 'form-control'
      }) %>
    </div>

    <div class="form-group">
      <%- FormHelper.label('password', 'Password') %>
      <%- FormHelper.input('password', {
        type: 'password',
        placeholder: 'Enter your password',
        required: true,
        class: 'form-control'
      }) %>
    </div>

    <div class="form-group">
      <%- FormHelper.submit('Login', { class: 'btn btn-primary' }) %>
    </div>
  <%- FormHelper.end() %>

  <p>
    Don't have an account?
    <%- HtmlHelper.link('Register here', '/users/register') %>
  </p>
</div>
```

### Registration View

```html
<!-- src/views/users/register.ejs -->
<div class="auth-container">
  <h1>Register</h1>

  <%- FormHelper.create('/users/register', { class: 'auth-form' }) %>
    <div class="form-group">
      <%- FormHelper.label('name', 'Full Name') %>
      <%- FormHelper.input('name', {
        type: 'text',
        required: true,
        class: 'form-control',
        value: userData.name || ''
      }) %>
    </div>

    <div class="form-group">
      <%- FormHelper.label('username', 'Username') %>
      <%- FormHelper.input('username', {
        type: 'text',
        required: true,
        class: 'form-control',
        value: userData.username || ''
      }) %>
    </div>

    <div class="form-group">
      <%- FormHelper.label('email', 'Email') %>
      <%- FormHelper.input('email', {
        type: 'email',
        required: true,
        class: 'form-control',
        value: userData.email || ''
      }) %>
    </div>

    <div class="form-group">
      <%- FormHelper.label('password', 'Password') %>
      <%- FormHelper.input('password', {
        type: 'password',
        required: true,
        class: 'form-control'
      }) %>
      <small>Minimum 6 characters</small>
    </div>

    <div class="form-group">
      <%- FormHelper.submit('Register', { class: 'btn btn-primary' }) %>
    </div>
  <%- FormHelper.end() %>

  <p>
    Already have an account?
    <%- HtmlHelper.link('Login here', '/users/login') %>
  </p>
</div>
```

## Protecting Routes

### Require Authentication

```javascript
class PostsController extends AppController {
  async beforeFilter() {
    await super.beforeFilter();
    this.loadComponent('Auth');

    // Public actions
    const publicActions = ['index', 'view'];

    // Require auth for all other actions
    if (!publicActions.includes(this.action)) {
      if (!this.Auth.requireAuth('/users/login')) {
        return false;  // Stops execution
      }
    }
  }
}
```

### Require Authentication for All Actions

```javascript
async beforeFilter() {
  await super.beforeFilter();
  this.loadComponent('Auth');

  // Require authentication for ALL actions
  if (!this.Auth.requireAuth('/users/login')) {
    return false;
  }
}
```

### Protect Specific Actions

```javascript
async delete(id) {
  // Require authentication for this action only
  if (!this.Auth.requireAuth('/users/login')) {
    return;
  }

  await Post.delete(id);
  this.redirect('/posts');
}
```

## Authorization

### Role-based Authorization

```javascript
async admin() {
  // Only admins can access
  if (!this.Auth.isAdmin()) {
    this.flash('Access denied', 'error');
    this.redirect('/');
    return;
  }

  // Admin-only logic
}

// Or using allowRole
async editor() {
  if (!this.Auth.allowRole(['admin', 'editor'])) {
    return;  // Redirected away
  }

  // Editor logic
}
```

### Owner-based Authorization

```javascript
async edit(id) {
  const post = await Post.findById(id);

  if (!post) {
    this.flash('Post not found', 'error');
    this.redirect('/posts');
    return;
  }

  // Only owner or admin can edit
  if (!this.Auth.allowOwnerOrAdmin(post.user_id)) {
    return;  // Redirected away
  }

  // Edit logic
}
```

### Custom Authorization

```javascript
async publish(id) {
  const post = await Post.findById(id);

  // Custom authorization logic
  const user = this.Auth.user();
  const canPublish = user.role === 'admin' ||
                     user.role === 'editor' ||
                     post.user_id === user.id;

  if (!canPublish) {
    this.flash('You cannot publish this post', 'error');
    this.redirect('/posts');
    return;
  }

  // Publish logic
}
```

### Permission-based Authorization

```javascript
// Add permissions field to users table
// permissions: JSON array of permission strings

async beforeFilter() {
  await super.beforeFilter();
  this.loadComponent('Auth');

  if (this.action === 'delete') {
    if (!this.Auth.hasPermission('delete_posts')) {
      this.flash('Access denied', 'error');
      this.redirect('/');
      return false;
    }
  }
}
```

## Using Auth in Views

### Check if Logged In

```html
<% if (AuthHelper.isLoggedIn(session)) { %>
  <p>Welcome, <%= AuthHelper.userName(session) %>!</p>
  <%- AuthHelper.logoutLink('Logout') %>
<% } else { %>
  <%- AuthHelper.loginLink('Login') %>
  <%- AuthHelper.registerLink('Register') %>
<% } %>
```

### Show Based on Role

```html
<% if (AuthHelper.isAdmin(session)) { %>
  <a href="/admin">Admin Panel</a>
<% } %>

<% if (AuthHelper.hasRole(session, 'editor')) { %>
  <a href="/editor">Editor Tools</a>
<% } %>
```

### Show for Owner

```html
<% if (AuthHelper.isOwner(session, post.user_id)) { %>
  <a href="/posts/edit/<%= post.id %>">Edit</a>
<% } %>

<% if (AuthHelper.canManage(session, post.user_id)) { %>
  <a href="/posts/delete/<%= post.id %>">Delete</a>
<% } %>
```

## Best Practices

### 1. Never Store Plain Passwords

```javascript
// ✅ Good: Hash automatically with beforeSave
class User extends AppModel {
  static async _beforeSave(data) {
    if (data.password && !data.password.startsWith('$2b$')) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return data;
  }
}

// ❌ Bad: Storing plain password
await User.save({
  email: 'user@example.com',
  password: 'plaintext'  // Never do this!
});
```

### 2. Always Remove Password from Responses

```javascript
// ✅ Good: Remove password
const user = await User.findById(id);
this.set('user', User.safeUser(user));

// Or
const { password, ...safeUser } = user;
this.set('user', safeUser);

// ❌ Bad: Sending password to view
this.set('user', user);  // Includes hashed password
```

### 3. Use Strong Session Secrets

```javascript
// ✅ Good: Random, long secret
session: {
  secret: 'kj8sd9f7gsd8f7g6sd5f4g3sd2f1gsd0f9g8h7j6k5l4m3n2'
}

// ❌ Bad: Weak or default secret
session: {
  secret: 'secret'  // Too simple!
}
```

### 4. Validate Input

```javascript
// ✅ Good: Validate before processing
async login() {
  const { email, password } = this.req.body;

  if (!email || !password) {
    this.flash('Email and password required', 'error');
    return;
  }

  const user = await this.Auth.login(email, password);
}

// ❌ Bad: No validation
async login() {
  const user = await this.Auth.login(
    this.req.body.email,
    this.req.body.password
  );
}
```

### 5. Use HTTPS in Production

```javascript
// config/app.js
session: {
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // HTTPS only
    httpOnly: true,  // No JavaScript access
    sameSite: 'strict'  // CSRF protection
  }
}
```

### 6. Implement Rate Limiting

```javascript
// Prevent brute force attacks
const loginAttempts = {};

async login() {
  const ip = this.req.ip;

  if (loginAttempts[ip] && loginAttempts[ip] > 5) {
    this.flash('Too many attempts. Try again later.', 'error');
    return;
  }

  const user = await this.Auth.login(email, password);

  if (!user) {
    loginAttempts[ip] = (loginAttempts[ip] || 0) + 1;
  } else {
    delete loginAttempts[ip];
  }
}
```

## Common Patterns

### Remember Me Functionality

```javascript
// Add remember_token to users table

async login() {
  if (this.isPost()) {
    const { email, password, remember } = this.req.body;
    const user = await this.Auth.login(email, password);

    if (user && remember) {
      // Extend session
      this.req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;  // 30 days
    }
  }
}
```

### Password Reset

```javascript
// Add reset_token and reset_expires to users table

async forgotPassword() {
  if (this.isPost()) {
    const email = this.req.body.email;
    const user = await User.findByEmail(email);

    if (user) {
      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex');

      await User.update(user.id, {
        reset_token: token,
        reset_expires: new Date(Date.now() + 3600000)  // 1 hour
      });

      // Send email with reset link
      // await sendResetEmail(email, token);
    }

    this.flash('If email exists, reset link sent', 'info');
    this.redirect('/');
  }
}

async resetPassword(token) {
  const user = await User.query()
    .where({ reset_token: token })
    .where('reset_expires > NOW()')
    .first();

  if (!user) {
    this.flash('Invalid or expired token', 'error');
    this.redirect('/users/forgot-password');
    return;
  }

  if (this.isPost()) {
    await User.update(user.id, {
      password: this.req.body.password,
      reset_token: null,
      reset_expires: null
    });

    this.flash('Password reset successful', 'success');
    this.redirect('/users/login');
    return;
  }

  this.set('token', token);
}
```

## Next Steps

- Learn about [Sessions](./sessions.md)
- Explore [Security Best Practices](./security.md)
- Understand [User Management](./user-management.md)
- Master [Permissions and ACL](./permissions.md)
