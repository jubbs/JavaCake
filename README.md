# JavaCake

A CakePHP-inspired MVC framework for Node.js with convention over configuration, MySQL ORM with associations, EJS templating, and built-in authentication.

## Features

- **Convention over Configuration**: Auto-routing, automatic model/controller loading, standard directory structure
- **Active Record ORM**: Easy database operations with associations (hasMany, belongsTo, hasOne, belongsToMany)
- **MySQL Support**: Built-in MySQL connection pooling and query builder
- **EJS Templating**: Server-side rendering with layouts and partials
- **Authentication**: Built-in user authentication with bcrypt password hashing
- **MVC Architecture**: Clean separation of concerns with Models, Views, and Controllers
- **Query Builder**: Fluent interface for building complex SQL queries
- **View Helpers**: Common view utilities (Form, HTML, Auth helpers)

## Installation

```bash
npm install
```

## Configuration

### Database Configuration

Edit `config/database.js`:

```javascript
module.exports = {
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'your_database',
  connectionLimit: 10
};
```

### Application Configuration

Edit `config/app.js`:

```javascript
module.exports = {
  name: 'My JavaCake App',
  debug: true,
  port: 3000,
  session: {
    secret: 'your-secret-key-change-this',
    cookie: { maxAge: 3600000 }
  },
  views: {
    defaultLayout: 'default'
  }
};
```

## Quick Start

### 1. Create a Model

`src/models/Post.js`:

```javascript
const Model = require('../core/Model');

class Post extends Model {
  static tableName = 'posts';

  static associations() {
    this.belongsTo('User');
    this.hasMany('Comment');
  }
}

module.exports = Post;
```

### 2. Create a Controller

`src/controllers/PostsController.js`:

```javascript
const Controller = require('../core/Controller');
const Post = require('../models/Post');

class PostsController extends Controller {
  async index() {
    const posts = await Post.findAll({
      include: ['User'],
      order: ['created_at', 'DESC']
    });
    this.set('posts', posts);
    // Auto-renders src/views/posts/index.ejs
  }

  async view(id) {
    const post = await Post.findById(id);
    if (!post) {
      return this.redirect('/posts');
    }
    this.set('post', post);
  }
}

module.exports = PostsController;
```

### 3. Create a View

`src/views/posts/index.ejs`:

```html
<h1>All Posts</h1>

<% posts.forEach(post => { %>
  <div class="post">
    <h2><a href="/posts/view/<%= post.id %>"><%= post.title %></a></h2>
    <p>By <%= post.user.name %> on <%= post.created_at %></p>
    <p><%= post.excerpt %></p>
  </div>
<% }); %>
```

### 4. Start the Server

```bash
npm start
```

Visit `http://localhost:3000/posts` to see your posts.

## Convention-based Routing

JavaCake automatically routes URLs to controllers and actions:

- `/posts` → `PostsController.index()`
- `/posts/view/123` → `PostsController.view(123)`
- `/users/profile` → `UsersController.profile()`
- `/` → `PagesController.home()` (default route)

## Naming Conventions

### Controllers
- **File**: `PostsController.js` (PascalCase + Controller suffix)
- **Class**: `PostsController`
- **URL**: `/posts/...`

### Models
- **File**: `Post.js` (PascalCase singular)
- **Class**: `Post`
- **Table**: `posts` (plural snake_case)

### Views
- **Path**: `src/views/posts/view.ejs` (snake_case)
- **Controller**: `PostsController`
- **Action**: `view`

### Database
- **Primary Key**: `id` (auto-increment)
- **Foreign Keys**: `{model}_id` (e.g., `user_id`, `post_id`)
- **Join Tables**: `{model1}_{model2}` (alphabetical, e.g., `posts_tags`)
- **Timestamps**: `created_at`, `updated_at`

## Model Operations

### Find Records

```javascript
// Find by ID
const user = await User.findById(1);

// Find with conditions
const users = await User.find({ status: 'active' });

// Find all with options
const posts = await Post.findAll({
  where: { published: true },
  order: ['created_at', 'DESC'],
  limit: 10,
  include: ['User', 'Comment']
});

// Query builder
const posts = await Post.query()
  .where({ status: 'published' })
  .orderBy('created_at', 'DESC')
  .limit(10)
  .all();
```

### Save Records

```javascript
// Create new record
const post = await Post.save({
  title: 'Hello World',
  content: 'This is my first post',
  user_id: 1
});

// Update existing record
await Post.update(1, {
  title: 'Updated Title'
});
```

### Delete Records

```javascript
await Post.delete(1);
```

## Model Associations

### Define Associations

```javascript
class Post extends Model {
  static associations() {
    this.belongsTo('User');
    this.hasMany('Comment');
    this.belongsToMany('Tag', { through: 'posts_tags' });
  }
}

class User extends Model {
  static associations() {
    this.hasMany('Post');
    this.hasOne('Profile');
  }
}
```

### Eager Loading

```javascript
// Load posts with their users and comments
const posts = await Post.findAll({
  include: ['User', 'Comment']
});

// Access related data
posts.forEach(post => {
  console.log(post.user.name);
  console.log(post.comments.length);
});
```

## Controller Features

### Lifecycle Hooks

```javascript
class PostsController extends Controller {
  async beforeFilter() {
    // Run before any action
    this.loadComponent('Auth');
  }

  async afterFilter() {
    // Run after any action
  }
}
```

### Flash Messages

```javascript
async create() {
  const post = await Post.save(this.req.body);
  this.flash('Post created successfully!', 'success');
  this.redirect('/posts');
}
```

### Components

```javascript
async beforeFilter() {
  this.loadComponent('Auth');
}

async add() {
  if (!this.Auth.isLoggedIn()) {
    return this.redirect('/users/login');
  }
  // ... action logic
}
```

## Authentication

### Setup

The framework includes built-in authentication via `AuthComponent`.

### Login

```javascript
class UsersController extends Controller {
  async beforeFilter() {
    this.loadComponent('Auth');
  }

  async login() {
    if (this.req.method === 'POST') {
      const { email, password } = this.req.body;
      const user = await this.Auth.login(email, password);

      if (user) {
        this.flash('Welcome back!', 'success');
        return this.redirect('/');
      } else {
        this.flash('Invalid credentials', 'error');
      }
    }
  }

  async logout() {
    this.Auth.logout();
    this.redirect('/');
  }
}
```

### Protecting Routes

```javascript
async beforeFilter() {
  this.loadComponent('Auth');

  // Require authentication for all actions except login/register
  const publicActions = ['login', 'register'];
  if (!publicActions.includes(this.action)) {
    if (!this.Auth.isLoggedIn()) {
      return this.redirect('/users/login');
    }
  }
}
```

## View Helpers

### Form Helper

```javascript
<%= FormHelper.input('title', { type: 'text', class: 'form-control' }) %>
<%= FormHelper.textarea('content', { rows: 5 }) %>
<%= FormHelper.submit('Save Post', { class: 'btn btn-primary' }) %>
```

### HTML Helper

```javascript
<%= HtmlHelper.link('Home', '/', { class: 'nav-link' }) %>
<%= HtmlHelper.image('/img/logo.png', { alt: 'Logo' }) %>
<%= HtmlHelper.css('/css/style.css') %>
<%= HtmlHelper.script('/js/app.js') %>
```

### Auth Helper

```javascript
<% if (AuthHelper.isLoggedIn()) { %>
  <p>Welcome, <%= AuthHelper.user('name') %>!</p>
  <a href="/users/logout">Logout</a>
<% } else { %>
  <a href="/users/login">Login</a>
<% } %>
```

## Custom Routes

Add custom routes in `config/routes.js`:

```javascript
module.exports = (router) => {
  // Custom routes
  router.addRoute('/', { controller: 'Pages', action: 'home' });
  router.addRoute('/about', { controller: 'Pages', action: 'about' });
  router.addRoute('/admin/dashboard', { controller: 'Admin', action: 'dashboard' });

  // Convention-based routing handles everything else
};
```

## Directory Structure

```
javacake/
├── config/              # Configuration files
├── src/
│   ├── core/           # Framework core classes
│   ├── controllers/    # Application controllers
│   ├── models/         # Application models
│   ├── views/          # EJS templates
│   ├── components/     # Controller components
│   └── helpers/        # View helpers
├── webroot/            # Public files (CSS, JS, images)
├── tmp/                # Temporary files (cache, sessions)
└── tests/              # Test files
```

## Development

### Run with Auto-reload

```bash
npm run dev
```

### Run Tests

```bash
npm test
```

## License

MIT

## Credits

Inspired by CakePHP - the rapid development framework for PHP.
