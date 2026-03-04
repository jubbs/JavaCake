# Routing

JavaCake uses convention-based routing, meaning URLs automatically map to controllers and actions without explicit configuration.

## Table of Contents

- [Convention-based Routing](#convention-based-routing)
- [URL Structure](#url-structure)
- [Custom Routes](#custom-routes)
- [Route Parameters](#route-parameters)
- [Generating URLs](#generating-urls)
- [Best Practices](#best-practices)

## Convention-based Routing

JavaCake automatically routes URLs to controllers and actions based on naming conventions. No route configuration needed for standard patterns!

### How It Works

```
URL Pattern: /controller/action/param1/param2
             ↓           ↓       ↓      ↓
Maps to:     Controller  Action  Parameters
```

### Examples

| URL | Controller | Action | Parameters |
|-----|-----------|--------|------------|
| `/posts` | PostsController | index() | - |
| `/posts/index` | PostsController | index() | - |
| `/posts/view/123` | PostsController | view() | [123] |
| `/posts/edit/123` | PostsController | edit() | [123] |
| `/users/profile` | UsersController | profile() | - |
| `/blog-posts/view/5` | BlogPostsController | view() | [5] |

### Default Routes

```
/                    → PagesController.home()
/posts               → PostsController.index()
/users               → UsersController.index()
```

## URL Structure

### Basic Structure

```
/controller/action
```

Examples:
- `/posts/index` - List all posts
- `/posts/add` - Show form to add post
- `/users/login` - Show login form

### With Parameters

```
/controller/action/param1/param2/param3
```

Examples:
- `/posts/view/123` - View post with ID 123
- `/posts/edit/123` - Edit post with ID 123
- `/users/view/456` - View user with ID 456
- `/posts/archive/2024/03` - Archive for March 2024

### Action Parameters

Parameters are passed to the action method:

```javascript
// URL: /posts/view/123
class PostsController extends AppController {
  async view(id) {
    console.log(id);  // "123"
    const post = await Post.findById(id);
  }
}

// URL: /posts/compare/123/456
async compare(id1, id2) {
  console.log(id1);  // "123"
  console.log(id2);  // "456"
}

// URL: /archive/2024/03/15
async archive(year, month, day) {
  console.log(year, month, day);  // "2024", "03", "15"
}
```

## Custom Routes

While convention-based routing handles most cases, you can define custom routes in `config/routes.js`.

### Defining Custom Routes

```javascript
// config/routes.js
module.exports = (router) => {
  // Home page
  router.addRoute('/', {
    controller: 'Pages',
    action: 'home'
  });

  // About page
  router.addRoute('/about', {
    controller: 'Pages',
    action: 'about'
  });

  // Blog homepage
  router.addRoute('/blog', {
    controller: 'Posts',
    action: 'index'
  });

  // Convention-based routing handles everything else
};
```

### Route with Parameters

```javascript
// Named parameters
router.addRoute('/blog/:slug', {
  controller: 'Posts',
  action: 'viewBySlug'
});

// Access in controller
async viewBySlug() {
  const slug = this.req.params.slug;
  const post = await Post.findBySlug(slug);
}

// Multiple parameters
router.addRoute('/users/:userId/posts/:postId', {
  controller: 'Posts',
  action: 'userPost'
});

async userPost() {
  const userId = this.req.params.userId;
  const postId = this.req.params.postId;
}
```

### RESTful Routes

```javascript
// RESTful API routes
router.addRoute('/api/posts', {
  controller: 'Api/Posts',
  action: 'index'
});

router.addRoute('/api/posts/:id', {
  controller: 'Api/Posts',
  action: 'show'
});
```

### Route Priority

Custom routes are checked before convention-based routes:

```javascript
// Custom route takes precedence
router.addRoute('/posts/featured', {
  controller: 'Posts',
  action: 'featured'
});

// This would normally match /posts/view/:id
// But /posts/featured matches the custom route first
```

## Route Parameters

### URL Parameters

Parameters from the URL path:

```javascript
// URL: /posts/view/123
async view(id) {
  console.log(id);  // "123"
}
```

### Query Parameters

Parameters from the query string (?key=value):

```javascript
// URL: /posts?page=2&limit=10
async index() {
  const page = this.req.query.page;     // "2"
  const limit = this.req.query.limit;   // "10"
  const search = this.req.query.search; // undefined (if not provided)
}

// With defaults
async index() {
  const page = parseInt(this.req.query.page) || 1;
  const limit = parseInt(this.req.query.limit) || 10;
}
```

### POST Data

Data from form submissions:

```javascript
// POST /posts/add
async add() {
  if (this.isPost()) {
    const title = this.req.body.title;
    const content = this.req.body.content;

    // Or get all data
    const postData = this.req.body;
  }
}
```

### Helper Method

Use `param()` to check multiple sources:

```javascript
// Checks body, query, and params
const id = this.param('id', null);
const page = this.param('page', 1);
```

## Generating URLs

### In Controllers

```javascript
// Redirect to URL
this.redirect('/posts');
this.redirect(`/posts/view/${postId}`);
this.redirect('/users/login');

// Using router URL helper
const url = this.router.url('Posts', 'view', [postId]);
this.redirect(url);
```

### In Views

```html
<!-- Manual URLs -->
<a href="/posts">All Posts</a>
<a href="/posts/view/<%= post.id %>">View Post</a>
<a href="/users/profile">My Profile</a>

<!-- Using HtmlHelper -->
<%- HtmlHelper.link('View', `/posts/view/${post.id}`) %>

<!-- Dynamic URLs -->
<% posts.forEach(post => { %>
  <a href="/posts/view/<%= post.id %>"><%= post.title %></a>
<% }); %>

<!-- With query parameters -->
<a href="/posts?page=<%= currentPage + 1 %>">Next Page</a>
```

### URL Best Practices

```javascript
// ✅ Good: Use template literals
this.redirect(`/posts/view/${postId}`);

// ✅ Good: URL encoding for user input
const encodedQuery = encodeURIComponent(searchQuery);
this.redirect(`/posts/search?q=${encodedQuery}`);

// ❌ Bad: Manual concatenation
this.redirect('/posts/view/' + postId);

// ❌ Bad: Not encoding user input
this.redirect('/search?q=' + userInput);  // Potential security issue
```

## Common Routing Patterns

### RESTful Routes

```javascript
// List all (GET /posts)
async index() { }

// Show one (GET /posts/view/123)
async view(id) { }

// Create form (GET /posts/add)
// Create action (POST /posts/add)
async add() {
  if (this.isPost()) {
    // Handle creation
  }
  // Show form
}

// Edit form (GET /posts/edit/123)
// Update action (POST /posts/edit/123)
async edit(id) {
  if (this.isPost()) {
    // Handle update
  }
  // Show form
}

// Delete (POST /posts/delete/123)
async delete(id) { }
```

### Nested Resources

```javascript
// User's posts
// URL: /users/123/posts
class UsersController extends AppController {
  async posts(userId) {
    const posts = await Post.find({ user_id: userId });
    this.set('posts', posts);
  }
}

// Or use custom route
router.addRoute('/users/:userId/posts', {
  controller: 'Posts',
  action: 'byUser'
});
```

### Pagination

```javascript
// URL: /posts?page=2
async index() {
  const page = parseInt(this.req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const posts = await Post.findAll({
    limit,
    offset,
    order: ['created_at', 'DESC']
  });

  this.set('posts', posts);
  this.set('page', page);
}
```

### Search and Filters

```javascript
// URL: /posts?search=javascript&category=tech&sort=date
async index() {
  const search = this.req.query.search;
  const category = this.req.query.category;
  const sort = this.req.query.sort || 'date';

  let query = Post.query();

  if (search) {
    query = query.where('title LIKE ? OR content LIKE ?',
      [`%${search}%`, `%${search}%`]);
  }

  if (category) {
    query = query.where({ category_id: category });
  }

  const posts = await query
    .orderBy(sort === 'title' ? 'title' : 'created_at', 'DESC')
    .all();

  this.set('posts', posts);
}
```

### API Routes

```javascript
// config/routes.js
router.addRoute('/api/posts', {
  controller: 'Api/Posts',
  action: 'index'
});

// src/controllers/Api/PostsController.js
class PostsController extends AppController {
  async beforeFilter() {
    await super.beforeFilter();
    // Disable auto-render for API
    this.disableAutoRender();
  }

  async index() {
    const posts = await Post.findAll();
    this.json({ posts });
  }

  async show(id) {
    const post = await Post.findById(id);
    if (post) {
      this.json({ post });
    } else {
      this.json({ error: 'Not found' }, 404);
    }
  }
}
```

## Best Practices

### 1. Follow Conventions

```javascript
// ✅ Good: Standard conventions
/posts          → PostsController.index()
/posts/view/123 → PostsController.view(123)
/posts/add      → PostsController.add()
/posts/edit/123 → PostsController.edit(123)

// ❌ Bad: Non-standard patterns
/showPosts      → Should be /posts
/viewPost/123   → Should be /posts/view/123
```

### 2. Use Semantic URLs

```javascript
// ✅ Good: Descriptive URLs
/posts/archive/2024
/users/profile
/admin/settings

// ❌ Bad: Unclear URLs
/posts/p1
/users/u
/admin/s
```

### 3. Plural Controller Names

```javascript
// ✅ Good: Plural names
PostsController    → /posts
UsersController    → /users
CommentsController → /comments

// ❌ Bad: Singular names
PostController     → /post (confusing)
UserController     → /user (confusing)
```

### 4. Keep URLs Clean

```javascript
// ✅ Good: Clean URLs
/posts/view/123
/users/profile

// ❌ Bad: Messy URLs
/posts.php?action=view&id=123
/user.do?cmd=profile
```

### 5. Use Custom Routes Sparingly

```javascript
// ✅ Good: Custom routes for special cases
router.addRoute('/', { controller: 'Pages', action: 'home' });
router.addRoute('/about', { controller: 'Pages', action: 'about' });

// ❌ Bad: Custom routes for everything
// Let convention-based routing handle standard patterns
router.addRoute('/posts/index', { ... });  // Unnecessary
router.addRoute('/posts/view/:id', { ... });  // Convention handles this
```

### 6. Validate Parameters

```javascript
async view(id) {
  // ✅ Good: Validate parameter
  const postId = parseInt(id);
  if (isNaN(postId)) {
    this.flash('Invalid post ID', 'error');
    this.redirect('/posts');
    return;
  }

  const post = await Post.findById(postId);
  if (!post) {
    this.flash('Post not found', 'error');
    this.redirect('/posts');
    return;
  }

  this.set('post', post);
}
```

## URL Examples

### Blog Application

```
/                           → Home page
/posts                      → List all posts
/posts/view/123             → View post 123
/posts/add                  → Create new post
/posts/edit/123             → Edit post 123
/posts/delete/123           → Delete post 123
/posts/category/tech        → Posts in tech category
/posts/archive/2024         → Posts from 2024
/posts/archive/2024/03      → Posts from March 2024
/posts/search?q=javascript  → Search posts
```

### E-commerce Application

```
/                           → Home page
/products                   → List all products
/products/view/123          → Product details
/products/category/electronics → Products in category
/cart                       → Shopping cart
/cart/add/123               → Add product to cart
/checkout                   → Checkout page
/orders                     → Order history
/orders/view/456            → Order details
```

### Admin Panel

```
/admin                      → Admin dashboard
/admin/users                → Manage users
/admin/users/edit/123       → Edit user
/admin/posts                → Manage posts
/admin/posts/approve/456    → Approve post
/admin/settings             → Admin settings
```

## Testing Routes

### Manual Testing

```bash
# Test home page
curl http://localhost:3000/

# Test list posts
curl http://localhost:3000/posts

# Test view post
curl http://localhost:3000/posts/view/1

# Test with query parameters
curl "http://localhost:3000/posts?page=2&limit=5"
```

### In Browser

Visit URLs directly:
- http://localhost:3000/posts
- http://localhost:3000/posts/view/1
- http://localhost:3000/users/login

## Next Steps

- Learn about [Controllers](./controllers.md)
- Explore [URL Generation](./url-generation.md)
- Understand [RESTful APIs](./rest-api.md)
- Master [Middleware](./middleware.md)
