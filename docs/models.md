# Models

Models represent your data and business logic in JavaCake. They follow the Active Record pattern, making database operations intuitive and straightforward.

## Table of Contents

- [Creating Models](#creating-models)
- [Basic CRUD Operations](#basic-crud-operations)
- [Query Builder](#query-builder)
- [Associations](#associations)
- [Validation](#validation)
- [Callbacks](#callbacks)
- [Advanced Features](#advanced-features)

## Creating Models

### Basic Model

Create a model by extending `AppModel`:

```javascript
// src/models/Post.js
const AppModel = require('./AppModel');

class Post extends AppModel {
  static tableName = 'posts';  // Optional: auto-detected from class name
  static primaryKey = 'id';     // Optional: defaults to 'id'
  static timestamps = true;     // Optional: defaults to true
}

module.exports = Post;
```

### Naming Conventions

| Model Class | File Name | Table Name |
|------------|-----------|------------|
| `Post` | `Post.js` | `posts` |
| `User` | `User.js` | `users` |
| `BlogPost` | `BlogPost.js` | `blog_posts` |
| `UserProfile` | `UserProfile.js` | `user_profiles` |

**Rules:**
- Model class: Singular PascalCase
- File name: Same as class name
- Table name: Plural snake_case (auto-detected)

### Table Structure Conventions

```sql
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,     -- Primary key (required)
  title VARCHAR(255) NOT NULL,
  content TEXT,
  user_id INT,                           -- Foreign key (singular_id)
  published BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,    -- Auto-managed
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Basic CRUD Operations

### Create (Insert)

```javascript
// Save new record
const post = await Post.save({
  title: 'My First Post',
  content: 'Hello World!',
  user_id: 1,
  published: true
});

console.log(post.id);  // Auto-generated ID
```

### Read (Find)

```javascript
// Find by ID
const post = await Post.findById(1);

// Find with conditions
const posts = await Post.find({ published: true });

// Find all
const allPosts = await Post.findAll();

// Find with options
const posts = await Post.findAll({
  where: { published: true },
  order: ['created_at', 'DESC'],
  limit: 10,
  offset: 0
});

// Find first match
const firstPost = await Post.query()
  .where({ published: true })
  .orderBy('created_at', 'DESC')
  .first();
```

### Update

```javascript
// Update by ID
const updated = await Post.update(1, {
  title: 'Updated Title',
  content: 'Updated content'
});

// Update via save (with ID)
const post = await Post.findById(1);
post.title = 'New Title';
await Post.save(post);
```

### Delete

```javascript
// Delete by ID
await Post.delete(1);

// Delete with conditions
await Post.deleteAll({ published: false });
```

### Check Existence

```javascript
// Check if exists
const exists = await Post.exists({ id: 1 });

// Count records
const count = await Post.count({ published: true });
```

## Query Builder

The query builder provides a fluent interface for complex queries.

### Basic Queries

```javascript
// Select specific fields
const posts = await Post.query()
  .select(['id', 'title', 'created_at'])
  .all();

// Where conditions
const posts = await Post.query()
  .where({ published: true, user_id: 1 })
  .all();

// Multiple where conditions
const posts = await Post.query()
  .where({ published: true })
  .where({ user_id: 1 })
  .all();

// Where with IN
const posts = await Post.query()
  .where({ id: [1, 2, 3, 4, 5] })
  .all();
```

### Sorting and Limiting

```javascript
// Order by
const posts = await Post.query()
  .orderBy('created_at', 'DESC')
  .all();

// Multiple order by
const posts = await Post.query()
  .orderBy('published', 'DESC')
  .orderBy('created_at', 'DESC')
  .all();

// Limit and offset (pagination)
const posts = await Post.query()
  .limit(10)
  .offset(20)
  .all();
```

### Joins

```javascript
// Join with another table
const posts = await Post.query()
  .join('users', 'posts.user_id = users.id')
  .select(['posts.*', 'users.name as author_name'])
  .all();

// Left join
const posts = await Post.query()
  .leftJoin('comments', 'posts.id = comments.post_id')
  .all();
```

### Aggregate Functions

```javascript
// Count
const count = await Post.query()
  .where({ published: true })
  .count();

// Sum
const total = await Post.query()
  .sum('views');

// Average
const avgViews = await Post.query()
  .avg('views');

// Max/Min
const maxViews = await Post.query().max('views');
const minViews = await Post.query().min('views');
```

### Group By

```javascript
const postsByUser = await Post.query()
  .select(['user_id', 'COUNT(*) as post_count'])
  .groupBy('user_id')
  .all();
```

### Complex Queries

```javascript
// Combine multiple conditions
const posts = await Post.query()
  .where({ published: true })
  .where("created_at > ?", [new Date('2024-01-01')])
  .orderBy('views', 'DESC')
  .limit(10)
  .all();

// Get first result
const latestPost = await Post.query()
  .orderBy('created_at', 'DESC')
  .first();
```

## Associations

Define relationships between models.

### Types of Associations

#### hasMany

One-to-many relationship (one post has many comments).

```javascript
// src/models/Post.js
class Post extends AppModel {
  static associations() {
    this.hasMany('Comment');
  }
}

// Usage
const post = await Post.findById(1);
const comments = await Comment.find({ post_id: post.id });

// Or with eager loading
const posts = await Post.findAll({
  include: ['Comment']
});
// posts[0].comments will contain the comments array
```

#### belongsTo

Many-to-one relationship (comment belongs to a post).

```javascript
// src/models/Comment.js
class Comment extends AppModel {
  static associations() {
    this.belongsTo('Post');
    this.belongsTo('User');
  }
}

// Usage with eager loading
const comments = await Comment.findAll({
  include: ['Post', 'User']
});
// comments[0].post and comments[0].user will be populated
```

#### hasOne

One-to-one relationship (user has one profile).

```javascript
// src/models/User.js
class User extends AppModel {
  static associations() {
    this.hasOne('Profile');
  }
}

// Usage
const users = await User.findAll({
  include: ['Profile']
});
// users[0].profile will contain the profile object
```

#### belongsToMany

Many-to-many relationship (post has many tags, tag has many posts).

```javascript
// src/models/Post.js
class Post extends AppModel {
  static associations() {
    this.belongsToMany('Tag', {
      through: 'posts_tags',  // Join table
      foreignKey: 'post_id',
      otherKey: 'tag_id'
    });
  }
}

// src/models/Tag.js
class Tag extends AppModel {
  static associations() {
    this.belongsToMany('Post', {
      through: 'posts_tags',
      foreignKey: 'tag_id',
      otherKey: 'post_id'
    });
  }
}

// Join table structure
CREATE TABLE posts_tags (
  post_id INT,
  tag_id INT,
  PRIMARY KEY (post_id, tag_id)
);
```

### Eager Loading

Load associated data in a single query:

```javascript
// Load post with user and comments
const post = await Post.findById(1, {
  include: ['User', 'Comment']
});

console.log(post.user.name);        // User data
console.log(post.comments.length);   // Comments array

// Multiple associations
const posts = await Post.findAll({
  where: { published: true },
  include: ['User', 'Comment', 'Tag'],
  order: ['created_at', 'DESC']
});
```

### Custom Foreign Keys

```javascript
class Post extends AppModel {
  static associations() {
    // Custom foreign key name
    this.belongsTo('User', {
      foreignKey: 'author_id'  // Instead of user_id
    });

    this.hasMany('Comment', {
      foreignKey: 'post_id'
    });
  }
}
```

## Validation

Add validation to your models:

```javascript
class Post extends AppModel {
  static validate(data) {
    const errors = [];

    // Required fields
    if (!data.title || data.title.trim() === '') {
      errors.push('Title is required');
    }

    if (!data.content || data.content.trim() === '') {
      errors.push('Content is required');
    }

    // Length validation
    if (data.title && data.title.length < 5) {
      errors.push('Title must be at least 5 characters');
    }

    if (data.title && data.title.length > 255) {
      errors.push('Title must not exceed 255 characters');
    }

    // Custom validation
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

// Usage in controller
const validation = Post.validate(postData);
if (!validation.valid) {
  this.flash(validation.errors.join(', '), 'error');
  return;
}
```

## Callbacks

Execute code at specific points in the model lifecycle.

### Available Callbacks

```javascript
class Post extends AppModel {
  /**
   * Before save (create or update)
   */
  static async _beforeSave(data) {
    // Sanitize data
    data.title = data.title.trim();
    data.content = data.content.trim();

    // Set default values
    if (!data.published) {
      data.published = false;
    }

    return data;
  }

  /**
   * After save
   */
  static async _afterSave(record) {
    console.log(`Post ${record.id} saved`);
    // Send notification, update cache, etc.
  }

  /**
   * After find
   */
  static async _afterFind(records) {
    // Transform data
    records.forEach(record => {
      record.short_title = record.title.substring(0, 50);
    });

    return records;
  }

  /**
   * Before delete
   */
  static async _beforeDelete(id) {
    // Delete associated records
    await Comment.deleteAll({ post_id: id });
  }

  /**
   * After delete
   */
  static async _afterDelete(id) {
    console.log(`Post ${id} deleted`);
  }
}
```

### Callback Order

**Create:**
1. `beforeSave()`
2. Database INSERT
3. `afterSave()`

**Update:**
1. `beforeSave()`
2. Database UPDATE
3. `afterSave()`

**Find:**
1. Database SELECT
2. `afterFind()`

**Delete:**
1. `beforeDelete()`
2. Database DELETE
3. `afterDelete()`

## Advanced Features

### Custom Methods

Add custom methods to your models:

```javascript
class Post extends AppModel {
  /**
   * Find published posts
   */
  static async findPublished() {
    return await this.find({ published: true });
  }

  /**
   * Find by author
   */
  static async findByAuthor(userId) {
    return await this.find({ user_id: userId });
  }

  /**
   * Publish a post
   */
  static async publish(id) {
    return await this.update(id, {
      published: true,
      published_at: new Date()
    });
  }

  /**
   * Get post excerpt
   */
  static getExcerpt(content, length = 200) {
    if (content.length <= length) {
      return content;
    }
    return content.substring(0, length) + '...';
  }
}

// Usage
const published = await Post.findPublished();
const userPosts = await Post.findByAuthor(1);
await Post.publish(postId);
const excerpt = Post.getExcerpt(post.content);
```

### Scopes

Define reusable query scopes:

```javascript
class Post extends AppModel {
  static published() {
    return this.query().where({ published: true });
  }

  static recent() {
    return this.query().orderBy('created_at', 'DESC');
  }

  static popular() {
    return this.query().orderBy('views', 'DESC');
  }
}

// Usage - chain scopes
const posts = await Post.published().recent().limit(10).all();
const popular = await Post.published().popular().limit(5).all();
```

### Computed Properties

```javascript
class User extends AppModel {
  static async _afterFind(records) {
    records.forEach(user => {
      // Full name
      user.full_name = `${user.first_name} ${user.last_name}`;

      // Initials
      user.initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();

      // Age from birthdate
      if (user.birth_date) {
        const today = new Date();
        const birthDate = new Date(user.birth_date);
        user.age = today.getFullYear() - birthDate.getFullYear();
      }
    });

    return records;
  }
}

// Usage
const user = await User.findById(1);
console.log(user.full_name);   // "John Doe"
console.log(user.initials);    // "JD"
console.log(user.age);         // 30
```

### Soft Deletes

Implement soft deletes (mark as deleted instead of removing):

```javascript
class Post extends AppModel {
  static timestamps = true;

  static async softDelete(id) {
    return await this.update(id, {
      deleted_at: new Date()
    });
  }

  static async restore(id) {
    return await this.update(id, {
      deleted_at: null
    });
  }

  static async findActive() {
    return await this.query()
      .where('deleted_at IS NULL')
      .all();
  }
}

// Usage
await Post.softDelete(1);        // Mark as deleted
await Post.restore(1);           // Restore
const active = await Post.findActive();  // Get non-deleted posts
```

## Best Practices

1. **Keep business logic in models**: Controllers should be thin
2. **Use validation**: Always validate data before saving
3. **Define associations**: Makes queries easier and more efficient
4. **Use callbacks wisely**: Don't put too much logic in callbacks
5. **Create custom methods**: For complex or repeated queries
6. **Follow naming conventions**: Enables auto-loading and associations
7. **Use transactions**: For operations that must succeed together
8. **Index your database**: Add indexes to foreign keys and frequently queried columns

## Common Patterns

### Slugs for URLs

```javascript
class Post extends AppModel {
  static async _beforeSave(data) {
    if (data.title && !data.slug) {
      data.slug = this.generateSlug(data.title);
    }
    return data;
  }

  static generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  static async findBySlug(slug) {
    const posts = await this.find({ slug });
    return posts.length > 0 ? posts[0] : null;
  }
}
```

### Status Management

```javascript
class Post extends AppModel {
  static STATUS_DRAFT = 'draft';
  static STATUS_PUBLISHED = 'published';
  static STATUS_ARCHIVED = 'archived';

  static async findByStatus(status) {
    return await this.find({ status });
  }

  static async publish(id) {
    return await this.update(id, {
      status: this.STATUS_PUBLISHED,
      published_at: new Date()
    });
  }
}
```

## Next Steps

- Learn about [Controllers](./controllers.md)
- Understand [Views](./views.md)
- Explore [Database Operations](./database.md)
- Master [Associations](./associations.md)
