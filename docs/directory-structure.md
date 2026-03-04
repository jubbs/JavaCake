# Directory Structure

Understanding the JavaCake directory structure is essential for working efficiently with the framework.

## Overview

```
javacake/
├── config/              # Configuration files
├── src/                 # Source code
│   ├── core/           # Framework core (don't modify)
│   ├── controllers/    # Application controllers
│   ├── models/         # Application models
│   ├── views/          # EJS templates
│   ├── components/     # Controller components
│   └── helpers/        # View helpers
├── webroot/            # Public files (accessible via HTTP)
├── tmp/                # Temporary files
├── tests/              # Test files
├── docs/               # Documentation
├── node_modules/       # Dependencies (auto-generated)
├── package.json        # npm configuration
└── .gitignore          # Git ignore rules
```

## Detailed Structure

### config/

Configuration files for your application.

```
config/
├── app.js          # Application configuration
├── database.js     # Database connection settings
├── routes.js       # Custom route definitions
└── session.js      # Session configuration (optional)
```

**When to modify:**
- Change application settings (port, debug mode)
- Update database credentials
- Add custom routes
- Configure session options

### src/

The heart of your application. All your application code lives here.

#### src/core/

**⚠️ WARNING: Do not modify files in this directory unless you're extending the framework itself.**

```
src/core/
├── Application.js   # Application bootstrap
├── Controller.js    # Base controller class
├── Model.js         # Base model class (Active Record)
├── Router.js        # Convention-based router
├── View.js          # View renderer (EJS)
├── Component.js     # Base component class
├── Loader.js        # Auto-loader for controllers/models
├── Database.js      # Database connection manager
├── QueryBuilder.js  # Fluent SQL query builder
└── Association.js   # Model associations handler
```

These are the framework's core classes. Your application extends these, but you should not modify them directly.

#### src/controllers/

Your application controllers go here.

```
src/controllers/
├── AppController.js        # Base for all your controllers
├── PagesController.js      # Static pages
├── UsersController.js      # User authentication
└── YourController.js       # Your custom controllers
```

**Naming convention:** `[Name]Controller.js`
- Must end with `Controller`
- PascalCase
- Extends `AppController`

**Example:**
```javascript
// src/controllers/PostsController.js
const AppController = require('./AppController');

class PostsController extends AppController {
  async index() {
    // Your code
  }
}

module.exports = PostsController;
```

#### src/models/

Your application models go here.

```
src/models/
├── AppModel.js      # Base for all your models
├── User.js          # User model
└── YourModel.js     # Your custom models
```

**Naming convention:** `[Name].js`
- Singular PascalCase
- Extends `AppModel`
- Maps to table `[names]` (plural snake_case)

**Example:**
```javascript
// src/models/Post.js → table: posts
const AppModel = require('./AppModel');

class Post extends AppModel {
  static tableName = 'posts';
}

module.exports = Post;
```

#### src/views/

EJS templates for rendering HTML.

```
src/views/
├── layouts/            # Layout templates
│   └── default.ejs    # Default layout
├── errors/            # Error pages
│   ├── 404.ejs
│   └── 500.ejs
├── users/             # User views
│   ├── login.ejs
│   ├── register.ejs
│   └── profile.ejs
├── posts/             # Example: Post views
│   ├── index.ejs
│   ├── view.ejs
│   └── add.ejs
└── elements/          # Reusable view elements (optional)
```

**Naming convention:**
- Directory: lowercase controller name (without "Controller")
- File: snake_case action name + `.ejs`

**Mapping:**
- `PostsController.index()` → `src/views/posts/index.ejs`
- `UsersController.viewProfile()` → `src/views/users/view_profile.ejs`

#### src/components/

Reusable controller logic (components).

```
src/components/
├── AuthComponent.js    # Authentication (built-in)
└── YourComponent.js    # Your custom components
```

**Example:**
```javascript
// src/components/PaginationComponent.js
const Component = require('../core/Component');

class PaginationComponent extends Component {
  paginate(data, page, perPage) {
    // Pagination logic
  }
}

module.exports = PaginationComponent;
```

#### src/helpers/

View helpers for generating HTML.

```
src/helpers/
├── FormHelper.js    # Form elements (built-in)
├── HtmlHelper.js    # HTML elements (built-in)
├── AuthHelper.js    # Auth utilities (built-in)
└── YourHelper.js    # Your custom helpers
```

**Example:**
```javascript
// src/helpers/DateHelper.js
class DateHelper {
  static formatDate(date) {
    return new Date(date).toLocaleDateString();
  }
}

module.exports = DateHelper;
```

### webroot/

Public files accessible via HTTP. This is your document root.

```
webroot/
├── index.js        # Application entry point
├── css/           # Stylesheets
│   └── style.css
├── js/            # JavaScript files
│   └── app.js
├── img/           # Images
└── favicon.ico    # Favicon (optional)
```

**Important:**
- Only files in this directory are accessible via HTTP
- Other directories (src/, config/, etc.) are NOT accessible for security
- Static files are automatically served by Express

**URL Mapping:**
- `/css/style.css` → `webroot/css/style.css`
- `/js/app.js` → `webroot/js/app.js`
- `/img/logo.png` → `webroot/img/logo.png`

### tmp/

Temporary files (sessions, cache, logs).

```
tmp/
├── cache/          # Cache files
├── sessions/       # Session files
└── logs/           # Log files (optional)
```

**Note:** This directory should be writable. Add to `.gitignore`.

### tests/

Test files for your application.

```
tests/
├── controllers/
├── models/
└── core/
```

**Example:**
```javascript
// tests/models/Post.test.js
const Post = require('../../src/models/Post');

describe('Post Model', () => {
  test('should create a post', async () => {
    // Your test
  });
});
```

## File Naming Conventions Summary

| Type | Convention | Example | Maps To |
|------|-----------|---------|---------|
| Controller | `[Name]Controller.js` | `PostsController.js` | URL: `/posts` |
| Model | `[Name].js` | `Post.js` | Table: `posts` |
| View | `[action].ejs` | `index.ejs` | Action: `index()` |
| Component | `[Name]Component.js` | `AuthComponent.js` | Load: `Auth` |
| Helper | `[Name]Helper.js` | `FormHelper.js` | Use: `FormHelper` |

## Adding New Files

### Creating a New Controller

1. Create file: `src/controllers/ProductsController.js`
2. Auto-accessible at: `/products`
3. No route configuration needed!

```javascript
const AppController = require('./AppController');

class ProductsController extends AppController {
  async index() {
    // Accessible at: /products
  }

  async view(id) {
    // Accessible at: /products/view/123
  }
}

module.exports = ProductsController;
```

### Creating a New Model

1. Create file: `src/models/Product.js`
2. Create table: `products`
3. Auto-loaded when used!

```javascript
const AppModel = require('./AppModel');

class Product extends AppModel {
  static tableName = 'products';
}

module.exports = Product;
```

### Creating a New View

1. Create file: `src/views/products/index.ejs`
2. Auto-rendered by `ProductsController.index()`

```html
<h1>Products</h1>
<ul>
  <% products.forEach(product => { %>
    <li><%= product.name %></li>
  <% }); %>
</ul>
```

## Best Practices

1. **Don't modify core files**: Extend them instead
2. **Follow naming conventions**: Enables auto-loading
3. **One class per file**: Keeps code organized
4. **Use AppController/AppModel**: For application-wide functionality
5. **Keep views in correct directories**: Follows MVC pattern

## Security Considerations

- **Never put sensitive files in webroot/**: They'll be publicly accessible
- **Add tmp/ to .gitignore**: Temporary files shouldn't be versioned
- **Protect config files**: Keep them outside webroot
- **Use environment variables**: For production credentials

## What Files Can I Delete?

Safe to delete (examples):
- `src/controllers/PagesController.js` (if you don't need it)
- `src/views/pages/` (if you don't need it)
- Example controllers and views you don't use

**Never delete:**
- Anything in `src/core/`
- `src/controllers/AppController.js`
- `src/models/AppModel.js`
- Framework configuration files

## Next Steps

- Learn about [Routing](./routing.md)
- Understand [Controllers](./controllers.md)
- Explore [Models](./models.md)
- Master [Views](./views.md)
