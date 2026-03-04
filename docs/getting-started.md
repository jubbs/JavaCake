# Getting Started with JavaCake

This guide will help you get up and running with JavaCake in minutes.

## Prerequisites

Before you begin, ensure you have:

- Node.js (version 14 or higher)
- npm or yarn
- MySQL (version 5.7 or higher)
- A code editor (VS Code, Sublime Text, etc.)

## Installation

### 1. Clone or Download JavaCake

```bash
git clone https://github.com/yourusername/javacake.git
cd javacake
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Database

Create a MySQL database for your application:

```sql
CREATE DATABASE javacake_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Create the users table (required for authentication):

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

### 4. Configure Database Connection

Edit `config/database.js`:

```javascript
module.exports = {
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'javacake_db',
  connectionLimit: 10
};
```

### 5. Configure Application

Edit `config/app.js`:

```javascript
module.exports = {
  name: 'My JavaCake App',
  debug: true,  // Set to false in production
  port: 3000,
  session: {
    secret: 'change-this-to-a-random-string',  // IMPORTANT: Change this!
    cookie: {
      maxAge: 3600000  // 1 hour
    }
  }
};
```

### 6. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Visit http://localhost:3000 to see your application!

## Your First Application

Let's create a simple blog application to understand how JavaCake works.

### Step 1: Create the Posts Table

```sql
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Step 2: Create the Post Model

Create `src/models/Post.js`:

```javascript
const AppModel = require('./AppModel');

class Post extends AppModel {
  static tableName = 'posts';

  /**
   * Define associations
   */
  static associations() {
    this.belongsTo('User');
  }

  /**
   * Validation
   */
  static validate(data) {
    const errors = [];

    if (!data.title || data.title.trim() === '') {
      errors.push('Title is required');
    }

    if (!data.content || data.content.trim() === '') {
      errors.push('Content is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = Post;
```

### Step 3: Create the Posts Controller

Create `src/controllers/PostsController.js`:

```javascript
const AppController = require('./AppController');
const Post = require('../models/Post');

class PostsController extends AppController {
  /**
   * Before filter - require authentication
   */
  async beforeFilter() {
    await super.beforeFilter();
    this.loadComponent('Auth');

    // Public actions
    const publicActions = ['index', 'view'];

    if (!publicActions.includes(this.action)) {
      if (!this.Auth.isLoggedIn()) {
        this.flash('Please log in to continue', 'error');
        this.redirect('/users/login');
        return false;
      }
    }
  }

  /**
   * List all posts
   */
  async index() {
    const posts = await Post.findAll({
      where: { published: true },
      include: ['User'],
      order: ['created_at', 'DESC']
    });

    this.set('posts', posts);
    this.set('title', 'All Posts');
  }

  /**
   * View a single post
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

  /**
   * Create a new post
   */
  async add() {
    if (this.isPost()) {
      const postData = {
        title: this.req.body.title,
        content: this.req.body.content,
        published: this.req.body.published === 'on',
        user_id: this.Auth.user('id')
      };

      // Validate
      const validation = Post.validate(postData);
      if (!validation.valid) {
        this.flash(validation.errors.join(', '), 'error');
        this.set('postData', postData);
        return;
      }

      // Save
      const post = await Post.save(postData);

      if (post) {
        this.flash('Post created successfully!', 'success');
        this.redirect(`/posts/view/${post.id}`);
        return;
      } else {
        this.flash('Failed to create post', 'error');
      }
    }

    this.set('title', 'Create Post');
    this.set('postData', {});
  }

  /**
   * Edit a post
   */
  async edit(id) {
    const post = await Post.findById(id);

    if (!post) {
      this.flash('Post not found', 'error');
      this.redirect('/posts');
      return;
    }

    // Check if user owns the post
    if (post.user_id !== this.Auth.user('id') && !this.Auth.isAdmin()) {
      this.flash('Access denied', 'error');
      this.redirect('/posts');
      return;
    }

    if (this.isPost()) {
      const updateData = {
        title: this.req.body.title,
        content: this.req.body.content,
        published: this.req.body.published === 'on'
      };

      // Validate
      const validation = Post.validate(updateData);
      if (!validation.valid) {
        this.flash(validation.errors.join(', '), 'error');
        this.set('post', { ...post, ...updateData });
        return;
      }

      // Update
      const updatedPost = await Post.update(id, updateData);

      if (updatedPost) {
        this.flash('Post updated successfully!', 'success');
        this.redirect(`/posts/view/${id}`);
        return;
      } else {
        this.flash('Failed to update post', 'error');
      }
    }

    this.set('post', post);
    this.set('title', 'Edit Post');
  }

  /**
   * Delete a post
   */
  async delete(id) {
    const post = await Post.findById(id);

    if (!post) {
      this.flash('Post not found', 'error');
      this.redirect('/posts');
      return;
    }

    // Check if user owns the post
    if (post.user_id !== this.Auth.user('id') && !this.Auth.isAdmin()) {
      this.flash('Access denied', 'error');
      this.redirect('/posts');
      return;
    }

    const deleted = await Post.delete(id);

    if (deleted) {
      this.flash('Post deleted successfully', 'success');
    } else {
      this.flash('Failed to delete post', 'error');
    }

    this.redirect('/posts');
  }
}

module.exports = PostsController;
```

### Step 4: Create Views

Create `src/views/posts/index.ejs`:

```html
<div class="posts-container">
  <div class="posts-header">
    <h1>All Posts</h1>
    <% if (typeof session !== 'undefined' && AuthHelper.isLoggedIn(session)) { %>
      <%- HtmlHelper.link('Create Post', '/posts/add', { class: 'btn btn-primary' }) %>
    <% } %>
  </div>

  <div class="posts-list">
    <% if (posts.length === 0) { %>
      <p class="no-posts">No posts yet. Be the first to create one!</p>
    <% } else { %>
      <% posts.forEach(post => { %>
        <div class="post-card">
          <h2>
            <%- HtmlHelper.link(post.title, `/posts/view/${post.id}`) %>
          </h2>
          <p class="post-meta">
            By <%= post.user.name %> on <%= new Date(post.created_at).toLocaleDateString() %>
          </p>
          <p class="post-excerpt">
            <%= post.content.substring(0, 200) %>...
          </p>
          <%- HtmlHelper.link('Read More', `/posts/view/${post.id}`, { class: 'btn btn-secondary' }) %>
        </div>
      <% }); %>
    <% } %>
  </div>
</div>
```

Create `src/views/posts/view.ejs`:

```html
<div class="post-view">
  <article class="post">
    <h1><%= post.title %></h1>
    <p class="post-meta">
      By <%= post.user.name %> on <%= new Date(post.created_at).toLocaleDateString() %>
    </p>
    <div class="post-content">
      <%= post.content %>
    </div>
  </article>

  <% if (typeof session !== 'undefined' && AuthHelper.isLoggedIn(session)) { %>
    <% if (AuthHelper.userId(session) === post.user_id || AuthHelper.isAdmin(session)) { %>
      <div class="post-actions">
        <%- HtmlHelper.link('Edit', `/posts/edit/${post.id}`, { class: 'btn btn-primary' }) %>
        <%- HtmlHelper.link('Delete', `/posts/delete/${post.id}`, {
          class: 'btn btn-danger',
          'data-confirm': 'Are you sure you want to delete this post?'
        }) %>
      </div>
    <% } %>
  <% } %>

  <%- HtmlHelper.link('← Back to Posts', '/posts', { class: 'back-link' }) %>
</div>
```

Create `src/views/posts/add.ejs`:

```html
<div class="form-container">
  <h1>Create New Post</h1>

  <%- FormHelper.create('/posts/add', { class: 'post-form' }) %>
    <div class="form-group">
      <%- FormHelper.label('title', 'Title') %>
      <%- FormHelper.input('title', {
        type: 'text',
        placeholder: 'Enter post title',
        class: 'form-control',
        required: true,
        value: typeof postData !== 'undefined' ? postData.title : ''
      }) %>
    </div>

    <div class="form-group">
      <%- FormHelper.label('content', 'Content') %>
      <%- FormHelper.textarea('content', {
        placeholder: 'Write your post content...',
        class: 'form-control',
        rows: 10,
        required: true,
        value: typeof postData !== 'undefined' ? postData.content : ''
      }) %>
    </div>

    <div class="form-group">
      <%- FormHelper.checkbox('published', {
        label: 'Publish immediately',
        checked: typeof postData !== 'undefined' ? postData.published : false
      }) %>
    </div>

    <div class="form-group">
      <%- FormHelper.submit('Create Post', { class: 'btn btn-primary' }) %>
      <%- HtmlHelper.link('Cancel', '/posts', { class: 'btn btn-secondary' }) %>
    </div>
  <%- FormHelper.end() %>
</div>
```

### Step 5: Test Your Application

1. Start the server: `npm run dev`
2. Register a user at http://localhost:3000/users/register
3. Create a post at http://localhost:3000/posts/add
4. View all posts at http://localhost:3000/posts

## Understanding the Flow

When you visit `/posts/add`:

1. **Router** parses the URL and identifies `PostsController` and `add` action
2. **Loader** automatically loads the PostsController
3. **Controller** runs `beforeFilter()` to check authentication
4. **Controller** executes `add()` action
5. **View** renders `src/views/posts/add.ejs` with the default layout
6. **Response** is sent to the browser

## Next Steps

Now that you have a basic understanding:

- Learn about [Models](./models.md) and database operations
- Explore [Controllers](./controllers.md) and their features
- Understand [Views](./views.md) and templating
- Read about [Routing](./routing.md) conventions
- Set up [Authentication](./authentication.md) in your app

## Common Issues

### Port Already in Use

If you see "Port 3000 is already in use":

```bash
# Change the port in config/app.js
port: 3001
```

### Database Connection Failed

Check your database credentials in `config/database.js` and ensure MySQL is running:

```bash
# Check if MySQL is running
mysql -u root -p
```

### Module Not Found

Make sure all dependencies are installed:

```bash
npm install
```

## Development Tips

1. **Use nodemon for development**: It's already configured with `npm run dev`
2. **Enable debug mode**: Set `debug: true` in `config/app.js` for detailed error messages
3. **Use the helpers**: FormHelper, HtmlHelper, and AuthHelper save time
4. **Follow conventions**: Stick to naming conventions for automatic loading

## Production Deployment

Before deploying to production:

1. Set `debug: false` in `config/app.js`
2. Change session secret to a random string
3. Use environment variables for sensitive data
4. Set up proper MySQL user with limited permissions
5. Use a process manager like PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start webroot/index.js --name javacake

# View logs
pm2 logs javacake
```

Congratulations! You've built your first JavaCake application. Continue to the next sections to learn more advanced features.
