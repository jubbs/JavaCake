# Controllers

Controllers handle incoming requests, interact with models, and render views. They are the "C" in MVC.

## Table of Contents

- [Creating Controllers](#creating-controllers)
- [Actions](#actions)
- [Request Handling](#request-handling)
- [Response Methods](#response-methods)
- [Lifecycle Hooks](#lifecycle-hooks)
- [Components](#components)
- [Flash Messages](#flash-messages)
- [Best Practices](#best-practices)

## Creating Controllers

### Basic Controller

Create a controller by extending `AppController`:

```javascript
// src/controllers/PostsController.js
const AppController = require('./AppController');
const Post = require('../models/Post');

class PostsController extends AppController {
  /**
   * List all posts
   * URL: /posts or /posts/index
   */
  async index() {
    const posts = await Post.findAll({
      order: ['created_at', 'DESC']
    });

    this.set('posts', posts);
    this.set('title', 'All Posts');
  }

  /**
   * View a single post
   * URL: /posts/view/123
   */
  async view(id) {
    const post = await Post.findById(id);

    if (!post) {
      this.flash('Post not found', 'error');
      this.redirect('/posts');
      return;
    }

    this.set('post', post);
    this.set('title', post.title);
  }
}

module.exports = PostsController;
```

### Naming Conventions

| Controller | File Name | URL |
|-----------|-----------|-----|
| `PostsController` | `PostsController.js` | `/posts` |
| `UsersController` | `UsersController.js` | `/users` |
| `BlogPostsController` | `BlogPostsController.js` | `/blog-posts` |

**Rules:**
- Class name: PascalCase + "Controller" suffix
- File name: Same as class name
- URL: Lowercase with hyphens

## Actions

Actions are public methods in your controller that respond to requests.

### Defining Actions

```javascript
class PostsController extends AppController {
  // GET /posts
  async index() {
    // List posts
  }

  // GET /posts/view/123
  async view(id) {
    // View single post
  }

  // GET /posts/add (show form)
  // POST /posts/add (handle form submission)
  async add() {
    if (this.isPost()) {
      // Handle form submission
    }
    // Show form
  }

  // GET /posts/edit/123 (show form)
  // POST /posts/edit/123 (handle form submission)
  async edit(id) {
    if (this.isPost()) {
      // Handle form submission
    }
    // Show form
  }

  // POST /posts/delete/123
  async delete(id) {
    // Delete post
  }
}
```

### Action Parameters

Actions receive URL parameters as arguments:

```javascript
// URL: /posts/view/123
async view(id) {
  console.log(id);  // "123"
}

// URL: /posts/compare/123/456
async compare(id1, id2) {
  console.log(id1);  // "123"
  console.log(id2);  // "456"
}

// URL: /posts/archive/2024/03
async archive(year, month) {
  console.log(year);   // "2024"
  console.log(month);  // "03"
}
```

### Default Action

If no action is specified in the URL, `index()` is called by default:

```
/posts        →  PostsController.index()
/posts/index  →  PostsController.index()
/users        →  UsersController.index()
```

## Request Handling

### Request Object

Access the Express request object:

```javascript
async add() {
  // HTTP method
  const method = this.req.method;  // "GET" or "POST"

  // URL and path
  const url = this.req.url;        // "/posts/add"
  const path = this.req.path;      // "/posts/add"

  // Query parameters (?key=value)
  const page = this.req.query.page;  // "/posts?page=2"

  // POST data
  const title = this.req.body.title;
  const content = this.req.body.content;

  // Route parameters
  const id = this.req.params.id;

  // Headers
  const userAgent = this.req.headers['user-agent'];

  // Session
  const userId = this.req.session.user_id;
}
```

### Helper Methods

```javascript
// Check HTTP method
if (this.isPost()) {
  // Handle POST request
}

if (this.isGet()) {
  // Handle GET request
}

// Check if AJAX request
if (this.isAjax()) {
  // Return JSON for AJAX
  this.json({ success: true });
} else {
  // Render HTML
  this.render();
}

// Get parameter (checks body, query, and params)
const title = this.param('title', 'Default Title');

// Get all request data
const data = this.data();
// Returns: { ...query, ...body, ...params }
```

### File Uploads

```javascript
// In your form
// <input type="file" name="image">

async upload() {
  if (this.isPost()) {
    const file = this.req.files.image;  // Requires multer middleware
    // Handle file upload
  }
}
```

## Response Methods

### Rendering Views

```javascript
// Auto-render matching view
async index() {
  this.set('posts', posts);
  // Automatically renders src/views/posts/index.ejs
}

// Render specific view
async custom() {
  this.render('posts/custom_view');
}

// Render with custom data
async show() {
  this.render('posts/show', {
    customVar: 'value'
  });
}

// Render without layout
async ajax() {
  this.setLayout(null);
  this.render('posts/ajax_content');
}

// Disable auto-render
async api() {
  this.disableAutoRender();
  this.json({ data: 'value' });
}
```

### Setting View Variables

```javascript
// Set single variable
this.set('title', 'My Page Title');
this.set('posts', posts);

// Set multiple variables
this.set({
  title: 'My Page',
  posts: posts,
  count: posts.length
});

// Variables are available in views
// <%= title %>
// <% posts.forEach(...) %>
```

### Redirects

```javascript
// Redirect to URL
this.redirect('/posts');

// Redirect with status code
this.redirect('/posts', 301);  // Permanent redirect

// Redirect to specific action
this.redirect('/posts/view/123');

// Redirect back
this.redirect(this.req.get('referer') || '/');
```

### JSON Responses

```javascript
// Return JSON
async api() {
  const posts = await Post.findAll();
  this.json({ posts });
}

// JSON with status code
async apiError() {
  this.json({ error: 'Not found' }, 404);
}

// Success/error pattern
async apiCreate() {
  if (this.isPost()) {
    const post = await Post.save(this.req.body);

    if (post) {
      this.json({ success: true, post });
    } else {
      this.json({ success: false, error: 'Failed to create' }, 400);
    }
  }
}
```

### Text Responses

```javascript
// Send plain text
this.text('Hello World');

// With status code
this.text('Not Found', 404);
```

### Status Codes

```javascript
// Set status code
this.status(404);
this.render('errors/404');

// Common status codes
this.status(200);  // OK
this.status(201);  // Created
this.status(400);  // Bad Request
this.status(401);  // Unauthorized
this.status(403);  // Forbidden
this.status(404);  // Not Found
this.status(500);  // Internal Server Error
```

## Lifecycle Hooks

Hooks allow you to run code before/after actions.

### beforeFilter

Runs before every action:

```javascript
class PostsController extends AppController {
  async beforeFilter() {
    // Call parent beforeFilter
    await super.beforeFilter();

    // Load Auth component for all actions
    this.loadComponent('Auth');

    // Require authentication for all actions except index and view
    const publicActions = ['index', 'view'];
    if (!publicActions.includes(this.action)) {
      if (!this.Auth.isLoggedIn()) {
        this.flash('Please log in', 'error');
        this.redirect('/users/login');
        return false;  // Stop execution
      }
    }

    // Set common variables
    this.set('currentUser', this.Auth.user());
  }

  async add() {
    // beforeFilter runs first
    // Then this action runs (only if user is logged in)
  }
}
```

### afterFilter

Runs after action (before render):

```javascript
async afterFilter() {
  // Call parent afterFilter
  await super.afterFilter();

  // Log activity
  console.log(`Action ${this.action} completed`);

  // Add analytics
  this.set('analytics', {
    page: this.req.path,
    timestamp: new Date()
  });
}
```

### Execution Order

```
1. beforeFilter()
   ↓
2. action() (e.g., index())
   ↓
3. afterFilter()
   ↓
4. render() (if not disabled)
```

### Stopping Execution

Return `false` from `beforeFilter` to stop execution:

```javascript
async beforeFilter() {
  if (!this.Auth.isLoggedIn()) {
    this.redirect('/users/login');
    return false;  // Stops here, action won't run
  }
}
```

## Components

Components are reusable chunks of controller logic.

### Loading Components

```javascript
async beforeFilter() {
  // Load Auth component
  this.loadComponent('Auth');

  // Now you can use this.Auth
  if (this.Auth.isLoggedIn()) {
    // ...
  }
}
```

### Using Components

```javascript
class PostsController extends AppController {
  async beforeFilter() {
    await super.beforeFilter();
    this.loadComponent('Auth');
  }

  async add() {
    if (this.isPost()) {
      const postData = {
        title: this.req.body.title,
        content: this.req.body.content,
        user_id: this.Auth.user('id')  // Using Auth component
      };

      await Post.save(postData);
      this.redirect('/posts');
    }
  }

  async delete(id) {
    // Check if user can delete
    const post = await Post.findById(id);

    if (!this.Auth.allowOwnerOrAdmin(post.user_id)) {
      // Auth component handles redirect
      return;
    }

    await Post.delete(id);
    this.redirect('/posts');
  }
}
```

### Built-in Components

#### AuthComponent

```javascript
this.loadComponent('Auth');

// Login
const user = await this.Auth.login(email, password);

// Logout
this.Auth.logout();

// Get current user
const user = this.Auth.user();
const userId = this.Auth.user('id');
const userName = this.Auth.user('name');

// Check if logged in
if (this.Auth.isLoggedIn()) { }

// Check role
if (this.Auth.hasRole('admin')) { }
if (this.Auth.isAdmin()) { }

// Require authentication
if (!this.Auth.requireAuth('/users/login')) {
  return;  // Redirected to login
}

// Check permission
if (this.Auth.hasPermission('edit_posts')) { }

// Allow only specific roles
if (!this.Auth.allowRole(['admin', 'editor'])) {
  return;  // Redirected away
}

// Allow owner or admin
if (!this.Auth.allowOwnerOrAdmin(post.user_id)) {
  return;  // Redirected away
}
```

### Creating Custom Components

```javascript
// src/components/PaginationComponent.js
const Component = require('../core/Component');

class PaginationComponent extends Component {
  initialize() {
    this.perPage = 10;
  }

  paginate(data, page = 1) {
    const total = data.length;
    const pages = Math.ceil(total / this.perPage);
    const offset = (page - 1) * this.perPage;

    return {
      data: data.slice(offset, offset + this.perPage),
      pagination: {
        page,
        pages,
        total,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    };
  }
}

module.exports = PaginationComponent;

// Usage in controller
async index() {
  this.loadComponent('Pagination');

  const allPosts = await Post.findAll();
  const page = parseInt(this.req.query.page) || 1;

  const result = this.Pagination.paginate(allPosts, page);

  this.set('posts', result.data);
  this.set('pagination', result.pagination);
}
```

## Flash Messages

Temporary messages stored in session.

### Setting Flash Messages

```javascript
// Success message
this.flash('Post created successfully!', 'success');

// Error message
this.flash('Failed to create post', 'error');

// Warning message
this.flash('Please verify your email', 'warning');

// Info message
this.flash('Your session will expire in 5 minutes', 'info');

// Multiple messages
this.flash('First message', 'success');
this.flash('Second message', 'info');
```

### Flash Message Types

- `success` - Green background
- `error` - Red background
- `warning` - Yellow background
- `info` - Blue background

### Displaying Flash Messages

Flash messages are automatically available in views:

```html
<!-- In your layout or view -->
<% if (flash && flash.length > 0) { %>
  <% flash.forEach(message => { %>
    <div class="alert alert-<%= message.type %>">
      <%= message.message %>
    </div>
  <% }); %>
<% } %>
```

### Flash Message Flow

```javascript
// In controller
async create() {
  const post = await Post.save(this.req.body);

  if (post) {
    this.flash('Post created!', 'success');
    this.redirect('/posts');  // Messages stored in session
  }
}

// After redirect, in the next page render
// Flash messages are retrieved and cleared automatically
```

## Best Practices

### 1. Keep Controllers Thin

Put business logic in models:

```javascript
// ❌ Bad: Business logic in controller
async publish(id) {
  const post = await Post.findById(id);
  post.published = true;
  post.published_at = new Date();
  await Post.save(post);
}

// ✅ Good: Business logic in model
async publish(id) {
  await Post.publish(id);  // Model method handles logic
}
```

### 2. Use beforeFilter for Common Logic

```javascript
// ❌ Bad: Repeating auth check in every action
async add() {
  if (!this.Auth.isLoggedIn()) {
    this.redirect('/users/login');
    return;
  }
  // ...
}

async edit() {
  if (!this.Auth.isLoggedIn()) {
    this.redirect('/users/login');
    return;
  }
  // ...
}

// ✅ Good: Auth check in beforeFilter
async beforeFilter() {
  await super.beforeFilter();
  this.loadComponent('Auth');

  const publicActions = ['index', 'view'];
  if (!publicActions.includes(this.action) && !this.Auth.isLoggedIn()) {
    this.redirect('/users/login');
    return false;
  }
}
```

### 3. Handle Errors Gracefully

```javascript
async view(id) {
  try {
    const post = await Post.findById(id);

    if (!post) {
      this.flash('Post not found', 'error');
      this.redirect('/posts');
      return;
    }

    this.set('post', post);
  } catch (error) {
    console.error('Error loading post:', error);
    this.flash('An error occurred', 'error');
    this.redirect('/posts');
  }
}
```

### 4. Validate Input

```javascript
async create() {
  if (this.isPost()) {
    const postData = this.req.body;

    // Validate
    const validation = Post.validate(postData);
    if (!validation.valid) {
      this.flash(validation.errors.join(', '), 'error');
      this.set('postData', postData);  // Repopulate form
      return;
    }

    // Save
    await Post.save(postData);
    this.redirect('/posts');
  }
}
```

### 5. Use Meaningful Action Names

```javascript
// ✅ Good action names
async index()          // List all
async view(id)         // View one
async add()            // Create new
async edit(id)         // Update existing
async delete(id)       // Delete
async search()         // Search
async archive()        // Archive
async publish(id)      // Change status

// ❌ Bad action names
async doStuff()
async page1()
async temp()
```

### 6. Separate GET and POST Logic

```javascript
async add() {
  if (this.isPost()) {
    // Handle form submission
    const post = await Post.save(this.req.body);
    this.redirect(`/posts/view/${post.id}`);
    return;  // Important: stop execution
  }

  // Show form (GET)
  this.set('title', 'Create Post');
}
```

## Common Patterns

### CRUD Actions

```javascript
class PostsController extends AppController {
  // CREATE
  async add() {
    if (this.isPost()) {
      const post = await Post.save(this.req.body);
      this.flash('Created!', 'success');
      this.redirect(`/posts/view/${post.id}`);
      return;
    }
    this.set('post', {});
  }

  // READ (list)
  async index() {
    const posts = await Post.findAll();
    this.set('posts', posts);
  }

  // READ (single)
  async view(id) {
    const post = await Post.findById(id);
    this.set('post', post);
  }

  // UPDATE
  async edit(id) {
    const post = await Post.findById(id);

    if (this.isPost()) {
      await Post.update(id, this.req.body);
      this.flash('Updated!', 'success');
      this.redirect(`/posts/view/${id}`);
      return;
    }

    this.set('post', post);
  }

  // DELETE
  async delete(id) {
    await Post.delete(id);
    this.flash('Deleted!', 'success');
    this.redirect('/posts');
  }
}
```

## Next Steps

- Learn about [Views](./views.md)
- Explore [Models](./models.md)
- Understand [Routing](./routing.md)
- Master [Authentication](./authentication.md)
