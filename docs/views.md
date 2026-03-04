# Views

Views are responsible for presenting data to the user. JavaCake uses EJS (Embedded JavaScript) as its templating engine.

## Table of Contents

- [Creating Views](#creating-views)
- [EJS Basics](#ejs-basics)
- [Layouts](#layouts)
- [Accessing Data](#accessing-data)
- [Helpers](#helpers)
- [Partials](#partials)
- [Best Practices](#best-practices)

## Creating Views

### File Structure

Views follow a strict naming convention:

```
src/views/
├── layouts/
│   └── default.ejs         # Default layout
├── [controller]/
│   └── [action].ejs        # View for specific action
```

### Naming Convention

| Controller | Action | View Path |
|-----------|--------|-----------|
| `PostsController` | `index()` | `src/views/posts/index.ejs` |
| `PostsController` | `view()` | `src/views/posts/view.ejs` |
| `PostsController` | `viewProfile()` | `src/views/posts/view_profile.ejs` |
| `UsersController` | `login()` | `src/views/users/login.ejs` |

**Rules:**
- Directory: Lowercase controller name (without "Controller")
- File: snake_case action name + `.ejs`

### Creating a Basic View

```html
<!-- src/views/posts/index.ejs -->
<div class="posts-container">
  <h1>All Posts</h1>

  <% posts.forEach(post => { %>
    <div class="post-card">
      <h2><%= post.title %></h2>
      <p><%= post.content %></p>
      <a href="/posts/view/<%= post.id %>">Read More</a>
    </div>
  <% }); %>
</div>
```

## EJS Basics

EJS allows you to embed JavaScript in your HTML.

### Output Tags

```html
<!-- Output (escaped HTML) -->
<%= variable %>
<%= user.name %>
<%= 5 + 5 %>

<!-- Output (unescaped HTML) - use with caution! -->
<%- htmlContent %>
<%- HtmlHelper.link('Home', '/') %>

<!-- JavaScript code (no output) -->
<% if (condition) { %>
  <p>Condition is true</p>
<% } %>
```

### Variables

```html
<!-- Simple variables -->
<h1><%= title %></h1>
<p><%= content %></p>

<!-- Object properties -->
<p>Name: <%= user.name %></p>
<p>Email: <%= user.email %></p>

<!-- Array access -->
<p>First post: <%= posts[0].title %></p>
```

### Conditionals

```html
<!-- If statement -->
<% if (user.isAdmin) { %>
  <a href="/admin">Admin Panel</a>
<% } %>

<!-- If-else -->
<% if (posts.length > 0) { %>
  <p>Found <%= posts.length %> posts</p>
<% } else { %>
  <p>No posts found</p>
<% } %>

<!-- If-else if-else -->
<% if (user.role === 'admin') { %>
  <p>Administrator</p>
<% } else if (user.role === 'editor') { %>
  <p>Editor</p>
<% } else { %>
  <p>Regular User</p>
<% } %>

<!-- Ternary operator -->
<p class="<%= isActive ? 'active' : 'inactive' %>">Status</p>
```

### Loops

```html
<!-- forEach loop -->
<ul>
  <% posts.forEach(post => { %>
    <li><%= post.title %></li>
  <% }); %>
</ul>

<!-- for loop -->
<% for (let i = 0; i < posts.length; i++) { %>
  <p><%= i + 1 %>. <%= posts[i].title %></p>
<% } %>

<!-- for...of loop -->
<% for (const post of posts) { %>
  <div class="post">
    <h2><%= post.title %></h2>
  </div>
<% } %>

<!-- With index -->
<% posts.forEach((post, index) => { %>
  <p><%= index + 1 %>. <%= post.title %></p>
<% }); %>
```

### Functions

```html
<!-- Define function -->
<% function formatDate(date) {
  return new Date(date).toLocaleDateString();
} %>

<!-- Use function -->
<p>Posted on: <%= formatDate(post.created_at) %></p>

<!-- Arrow function -->
<% const truncate = (str, length) => {
  return str.length > length ? str.substring(0, length) + '...' : str;
}; %>

<p><%= truncate(post.content, 100) %></p>
```

## Layouts

Layouts wrap your views with common HTML structure.

### Default Layout

```html
<!-- src/views/layouts/default.ejs -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= typeof title !== 'undefined' ? title : 'JavaCake' %></title>
  <%- HtmlHelper.css('/css/style') %>
</head>
<body>
  <!-- Navigation -->
  <nav class="navbar">
    <a href="/">Home</a>
    <% if (AuthHelper.isLoggedIn(session)) { %>
      <a href="/users/profile">Profile</a>
      <a href="/users/logout">Logout</a>
    <% } else { %>
      <a href="/users/login">Login</a>
      <a href="/users/register">Register</a>
    <% } %>
  </nav>

  <!-- Flash messages -->
  <% if (flash && flash.length > 0) { %>
    <% flash.forEach(message => { %>
      <div class="alert alert-<%= message.type %>">
        <%= message.message %>
      </div>
    <% }); %>
  <% } %>

  <!-- Main content -->
  <main>
    <%- content %>
  </main>

  <!-- Footer -->
  <footer>
    <p>&copy; 2024 My Application</p>
  </footer>

  <%- HtmlHelper.script('/js/app') %>
</body>
</html>
```

### Using Layouts

```javascript
// In controller - use default layout
async index() {
  this.set('posts', posts);
  // Uses layouts/default.ejs automatically
}

// Use custom layout
async index() {
  this.layout = 'admin';  // Uses layouts/admin.ejs
  this.set('posts', posts);
}

// No layout
async ajax() {
  this.layout = null;  // No layout
  this.set('data', data);
}

// In AppController to set for all actions
constructor(req, res) {
  super(req, res);
  this.layout = 'custom';
}
```

### Multiple Layouts

```html
<!-- src/views/layouts/admin.ejs -->
<!DOCTYPE html>
<html>
<head>
  <title>Admin - <%= title %></title>
  <%- HtmlHelper.css('/css/admin') %>
</head>
<body class="admin-layout">
  <aside class="sidebar">
    <!-- Admin sidebar -->
  </aside>
  <main class="admin-content">
    <%- content %>
  </main>
</body>
</html>

<!-- src/views/layouts/simple.ejs -->
<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
</head>
<body>
  <%- content %>
</body>
</html>
```

## Accessing Data

### From Controller

```javascript
// In controller
async index() {
  this.set('title', 'All Posts');
  this.set('posts', posts);
  this.set('count', posts.length);
  this.set('user', currentUser);
}

// In view
<h1><%= title %></h1>
<p>Total: <%= count %></p>
<p>Logged in as: <%= user.name %></p>
```

### Checking if Variable Exists

```html
<!-- Check if defined -->
<% if (typeof title !== 'undefined') { %>
  <h1><%= title %></h1>
<% } %>

<!-- With default value -->
<h1><%= typeof title !== 'undefined' ? title : 'Default Title' %></h1>

<!-- Using optional chaining (if available) -->
<p><%= user?.name ?? 'Guest' %></p>
```

### Built-in Variables

These are automatically available in views:

```html
<!-- Request object -->
<p>Path: <%= req.path %></p>
<p>Method: <%= req.method %></p>

<!-- Session object -->
<% if (session.user_id) { %>
  <p>User ID: <%= session.user_id %></p>
<% } %>

<!-- Flash messages -->
<% flash.forEach(message => { %>
  <div><%= message.message %></div>
<% }); %>
```

## Helpers

Helpers are functions available in views for common tasks.

### FormHelper

```html
<!-- Create form -->
<%- FormHelper.create('/posts/add', { class: 'post-form' }) %>

<!-- Text input -->
<%- FormHelper.input('title', {
  type: 'text',
  placeholder: 'Enter title',
  class: 'form-control',
  required: true
}) %>

<!-- Textarea -->
<%- FormHelper.textarea('content', {
  rows: 10,
  class: 'form-control'
}) %>

<!-- Select dropdown -->
<%- FormHelper.select('category', [
  { value: '1', label: 'Technology' },
  { value: '2', label: 'Sports' },
  { value: '3', label: 'News' }
], { selected: post.category_id }) %>

<!-- Checkbox -->
<%- FormHelper.checkbox('published', {
  label: 'Publish immediately',
  checked: post.published
}) %>

<!-- Radio button -->
<%- FormHelper.radio('status', 'draft', {
  label: 'Draft',
  checked: post.status === 'draft'
}) %>
<%- FormHelper.radio('status', 'published', {
  label: 'Published',
  checked: post.status === 'published'
}) %>

<!-- Submit button -->
<%- FormHelper.submit('Create Post', { class: 'btn btn-primary' }) %>

<!-- Close form -->
<%- FormHelper.end() %>
```

### HtmlHelper

```html
<!-- Links -->
<%- HtmlHelper.link('Home', '/', { class: 'nav-link' }) %>
<%- HtmlHelper.link('View Post', `/posts/view/${post.id}`) %>

<!-- Images -->
<%- HtmlHelper.image('/img/logo.png', { alt: 'Logo', width: '200' }) %>

<!-- CSS -->
<%- HtmlHelper.css('/css/style') %>
<%- HtmlHelper.css('custom') %>  <!-- Adds /css/ prefix and .css extension -->

<!-- JavaScript -->
<%- HtmlHelper.script('/js/app') %>
<%- HtmlHelper.script('custom') %>  <!-- Adds /js/ prefix and .js extension -->

<!-- Lists -->
<%- HtmlHelper.ul(['Item 1', 'Item 2', 'Item 3'], { class: 'menu' }) %>

<!-- Headings -->
<%- HtmlHelper.heading('Welcome', 1, { class: 'title' }) %>

<!-- Escape HTML -->
<%= HtmlHelper.escape(userInput) %>
```

### AuthHelper

```html
<!-- Check if logged in -->
<% if (AuthHelper.isLoggedIn(session)) { %>
  <p>Welcome back!</p>
<% } %>

<!-- Get user data -->
<p>Hello, <%= AuthHelper.userName(session) %>!</p>
<p>Email: <%= AuthHelper.userEmail(session) %></p>

<!-- Check role -->
<% if (AuthHelper.isAdmin(session)) { %>
  <a href="/admin">Admin Panel</a>
<% } %>

<% if (AuthHelper.hasRole(session, 'editor')) { %>
  <a href="/editor">Editor Tools</a>
<% } %>

<!-- Auth links -->
<%- AuthHelper.loginLink('Sign In', { class: 'btn' }) %>
<%- AuthHelper.logoutLink('Sign Out', { class: 'btn' }) %>
<%- AuthHelper.registerLink('Create Account') %>
<%- AuthHelper.profileLink('My Profile') %>

<!-- User menu -->
<%- AuthHelper.userMenu(session, { class: 'user-menu' }) %>

<!-- Check ownership -->
<% if (AuthHelper.isOwner(session, post.user_id)) { %>
  <a href="/posts/edit/<%= post.id %>">Edit</a>
<% } %>

<% if (AuthHelper.canManage(session, post.user_id)) { %>
  <!-- Owner or admin can manage -->
  <a href="/posts/delete/<%= post.id %>">Delete</a>
<% } %>
```

## Partials

Partials are reusable view fragments.

### Creating Partials

```html
<!-- src/views/posts/_post_card.ejs -->
<!-- Note: Partial files start with underscore -->
<div class="post-card">
  <h2><%= post.title %></h2>
  <p><%= post.excerpt %></p>
  <a href="/posts/view/<%= post.id %>">Read More</a>
</div>
```

### Using Partials

```html
<!-- Include partial -->
<% posts.forEach(post => { %>
  <%- include('_post_card', { post: post }) %>
<% }); %>

<!-- Or with full path -->
<%- include('../posts/_post_card', { post: post }) %>
```

### Common Partials

```html
<!-- src/views/layouts/_header.ejs -->
<header class="site-header">
  <nav>
    <a href="/">Home</a>
    <a href="/posts">Blog</a>
    <a href="/about">About</a>
  </nav>
</header>

<!-- src/views/layouts/_footer.ejs -->
<footer class="site-footer">
  <p>&copy; 2024 My Site. All rights reserved.</p>
</footer>

<!-- Use in layout -->
<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
</head>
<body>
  <%- include('_header') %>
  <main>
    <%- content %>
  </main>
  <%- include('_footer') %>
</body>
</html>
```

## Best Practices

### 1. Keep Views Simple

```html
<!-- ❌ Bad: Complex logic in view -->
<%
  const filteredPosts = posts.filter(p => p.published)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);
%>

<!-- ✅ Good: Logic in controller -->
<!-- Controller does filtering, sorting, limiting -->
<% posts.forEach(post => { %>
  <div><%= post.title %></div>
<% }); %>
```

### 2. Use Helpers for HTML

```html
<!-- ❌ Bad: Manual HTML -->
<a href="/posts/view/<%= post.id %>" class="btn btn-primary">View</a>

<!-- ✅ Good: Using helper -->
<%- HtmlHelper.link('View', `/posts/view/${post.id}`, { class: 'btn btn-primary' }) %>
```

### 3. Always Escape User Input

```html
<!-- ❌ Bad: Unescaped (XSS vulnerability) -->
<%- userComment %>

<!-- ✅ Good: Escaped -->
<%= userComment %>

<!-- ✅ Good: Only unescape trusted content -->
<%- HtmlHelper.link('Home', '/') %>  <!-- Helper output is safe -->
```

### 4. Check for Undefined Variables

```html
<!-- ❌ Bad: May throw error -->
<h1><%= title %></h1>

<!-- ✅ Good: Check first -->
<h1><%= typeof title !== 'undefined' ? title : 'Default' %></h1>

<!-- ✅ Better: Default in controller -->
<!-- Controller: this.set('title', post.title || 'Untitled'); -->
<h1><%= title %></h1>
```

### 5. Use Partials for Reusability

```html
<!-- ❌ Bad: Duplicated code -->
<!-- In index.ejs -->
<div class="post-card">
  <h2><%= post.title %></h2>
  <p><%= post.content %></p>
</div>

<!-- In search.ejs -->
<div class="post-card">
  <h2><%= post.title %></h2>
  <p><%= post.content %></p>
</div>

<!-- ✅ Good: Use partial -->
<!-- Create _post_card.ejs partial -->
<!-- In both views: -->
<%- include('_post_card', { post: post }) %>
```

### 6. Keep Consistent Indentation

```html
<!-- ✅ Good: Consistent indentation -->
<div class="container">
  <% if (posts.length > 0) { %>
    <ul>
      <% posts.forEach(post => { %>
        <li>
          <h2><%= post.title %></h2>
          <p><%= post.content %></p>
        </li>
      <% }); %>
    </ul>
  <% } %>
</div>
```

## Common Patterns

### Pagination

```html
<div class="pagination">
  <% if (pagination.hasPrev) { %>
    <a href="?page=<%= pagination.page - 1 %>">Previous</a>
  <% } %>

  <% for (let i = 1; i <= pagination.pages; i++) { %>
    <% if (i === pagination.page) { %>
      <span class="active"><%= i %></span>
    <% } else { %>
      <a href="?page=<%= i %>"><%= i %></a>
    <% } %>
  <% } %>

  <% if (pagination.hasNext) { %>
    <a href="?page=<%= pagination.page + 1 %>">Next</a>
  <% } %>
</div>
```

### Empty State

```html
<% if (posts.length > 0) { %>
  <% posts.forEach(post => { %>
    <div class="post"><%= post.title %></div>
  <% }); %>
<% } else { %>
  <div class="empty-state">
    <p>No posts yet.</p>
    <a href="/posts/add" class="btn btn-primary">Create First Post</a>
  </div>
<% } %>
```

### Loading States

```html
<% if (typeof posts === 'undefined') { %>
  <div class="loading">Loading...</div>
<% } else if (posts.length === 0) { %>
  <div class="empty">No posts found</div>
<% } else { %>
  <% posts.forEach(post => { %>
    <div><%= post.title %></div>
  <% }); %>
<% } %>
```

### Conditional Classes

```html
<!-- Using ternary -->
<div class="post <%= post.published ? 'published' : 'draft' %>">

<!-- Multiple conditions -->
<button class="btn <%= isAdmin ? 'btn-admin' : 'btn-user' %> <%= isActive ? 'active' : '' %>">

<!-- Using array join -->
<%
  const classes = ['post'];
  if (post.published) classes.push('published');
  if (post.featured) classes.push('featured');
%>
<div class="<%= classes.join(' ') %>">
```

## Next Steps

- Learn about [Helpers](./helpers.md)
- Explore [Layouts and Themes](./layouts.md)
- Master [Forms](./forms.md)
- Understand [Assets](./assets.md)
