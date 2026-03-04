# Configuration

JavaCake uses configuration files located in the `config/` directory to manage application settings.

## Table of Contents

- [Configuration Files](#configuration-files)
- [Application Configuration](#application-configuration)
- [Database Configuration](#database-configuration)
- [Session Configuration](#session-configuration)
- [Custom Routes](#custom-routes)
- [Environment Variables](#environment-variables)
- [Best Practices](#best-practices)

## Configuration Files

```
config/
├── app.js          # Application settings
├── database.js     # Database connection
├── routes.js       # Custom route definitions
└── session.js      # Session configuration (optional)
```

## Application Configuration

### config/app.js

Main application settings:

```javascript
module.exports = {
  // Application name
  name: 'My JavaCake Application',

  // Debug mode (shows detailed errors)
  debug: true,  // Set to false in production

  // Server port
  port: 3000,

  // Session configuration
  session: {
    secret: 'change-this-to-a-random-string-in-production',
    cookie: {
      maxAge: 3600000,  // 1 hour in milliseconds
      httpOnly: true,    // Prevent JavaScript access
      secure: false      // Set to true in production with HTTPS
    }
  },

  // View configuration
  views: {
    defaultLayout: 'default'
  }
};
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | String | 'JavaCake Application' | Application name |
| `debug` | Boolean | true | Enable debug mode |
| `port` | Number | 3000 | HTTP server port |
| `session.secret` | String | (required) | Session encryption secret |
| `session.cookie.maxAge` | Number | 3600000 | Session lifetime (ms) |
| `session.cookie.httpOnly` | Boolean | true | Prevent JavaScript access |
| `session.cookie.secure` | Boolean | false | HTTPS only |
| `views.defaultLayout` | String | 'default' | Default layout name |

### Using Configuration in Code

```javascript
// In Application.js or controllers
const config = require('../config/app');

console.log(config.name);   // Application name
console.log(config.debug);  // Debug mode
console.log(config.port);   // Server port

// Or from Application instance
const appName = this.getConfig('name');
const isDebug = this.getConfig('debug');
```

## Database Configuration

### config/database.js

Database connection settings:

```javascript
module.exports = {
  // Database host
  host: 'localhost',

  // Database port
  port: 3306,  // Optional, defaults to 3306

  // Database user
  user: 'root',

  // Database password
  password: 'your_password',

  // Database name
  database: 'javacake_db',

  // Connection pool settings
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,

  // Connection timeout
  connectTimeout: 10000,  // 10 seconds

  // Character set
  charset: 'utf8mb4'
};
```

### Database Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `host` | String | 'localhost' | MySQL server host |
| `port` | Number | 3306 | MySQL server port |
| `user` | String | 'root' | Database username |
| `password` | String | '' | Database password |
| `database` | String | (required) | Database name |
| `connectionLimit` | Number | 10 | Max connections in pool |
| `waitForConnections` | Boolean | true | Wait for available connection |
| `queueLimit` | Number | 0 | Max queued requests (0 = unlimited) |
| `connectTimeout` | Number | 10000 | Connection timeout (ms) |
| `charset` | String | 'utf8mb4' | Character set |

### Multiple Database Configurations

```javascript
// config/database.js
module.exports = {
  development: {
    host: 'localhost',
    user: 'dev_user',
    password: 'dev_password',
    database: 'javacake_dev'
  },

  production: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 20
  },

  test: {
    host: 'localhost',
    user: 'test_user',
    password: 'test_password',
    database: 'javacake_test'
  }
};

// Use specific configuration
const env = process.env.NODE_ENV || 'development';
const dbConfig = require('./database')[env];
```

## Session Configuration

### Basic Session Setup

Sessions are configured in `config/app.js`:

```javascript
session: {
  // Secret key for signing session ID
  secret: 'your-secret-key',

  // Cookie options
  cookie: {
    // Session lifetime (milliseconds)
    maxAge: 3600000,  // 1 hour

    // Prevent JavaScript access to cookie
    httpOnly: true,

    // HTTPS only (production)
    secure: false,

    // CSRF protection
    sameSite: 'strict'
  },

  // Resave session even if not modified
  resave: false,

  // Save uninitialized sessions
  saveUninitialized: false
}
```

### Session Duration Examples

```javascript
// 30 minutes
maxAge: 30 * 60 * 1000

// 1 hour
maxAge: 60 * 60 * 1000

// 24 hours (1 day)
maxAge: 24 * 60 * 60 * 1000

// 7 days
maxAge: 7 * 24 * 60 * 60 * 1000

// 30 days
maxAge: 30 * 24 * 60 * 60 * 1000
```

### Session Storage

By default, sessions are stored in memory. For production, use a persistent store:

```javascript
// File-based session store
const session = require('express-session');
const FileStore = require('session-file-store')(session);

session: {
  secret: 'your-secret',
  store: new FileStore({
    path: './tmp/sessions',
    ttl: 3600
  }),
  cookie: { maxAge: 3600000 }
}
```

## Custom Routes

### config/routes.js

Define custom routes that override convention-based routing:

```javascript
module.exports = (router) => {
  // Home page
  router.addRoute('/', {
    controller: 'Pages',
    action: 'home'
  });

  // Static pages
  router.addRoute('/about', {
    controller: 'Pages',
    action: 'about'
  });

  router.addRoute('/contact', {
    controller: 'Pages',
    action: 'contact'
  });

  // Custom blog route
  router.addRoute('/blog', {
    controller: 'Posts',
    action: 'index'
  });

  // Post by slug
  router.addRoute('/blog/:slug', {
    controller: 'Posts',
    action: 'viewBySlug'
  });

  // API routes
  router.addRoute('/api/posts', {
    controller: 'Api/Posts',
    action: 'index'
  });

  // Convention-based routing handles everything else
};
```

### Route Configuration

Custom routes are checked before convention-based routes. If no custom route matches, the framework falls back to automatic routing.

## Environment Variables

### Using .env Files

Create a `.env` file in your project root:

```bash
# .env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=javacake_db

# Session
SESSION_SECRET=your-random-secret-key

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

### Loading Environment Variables

Install dotenv:

```bash
npm install dotenv
```

Load in your application:

```javascript
// At the top of webroot/index.js
require('dotenv').config();

// Now use in config files
// config/database.js
module.exports = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'javacake_db'
};

// config/app.js
module.exports = {
  port: parseInt(process.env.PORT) || 3000,
  debug: process.env.NODE_ENV !== 'production',
  session: {
    secret: process.env.SESSION_SECRET || 'change-this',
    cookie: {
      secure: process.env.NODE_ENV === 'production'
    }
  }
};
```

### .gitignore

Always add `.env` to `.gitignore`:

```
# .gitignore
.env
.env.local
.env.*.local
```

## Best Practices

### 1. Never Commit Secrets

```bash
# ❌ Bad: Committed secret
# config/app.js
session: {
  secret: 'my-secret-key-123'
}

# ✅ Good: Use environment variables
# config/app.js
session: {
  secret: process.env.SESSION_SECRET
}

# .env (not committed)
SESSION_SECRET=randomly-generated-secret-key
```

### 2. Different Configs for Environments

```javascript
// config/app.js
const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  debug: isDev,
  session: {
    secret: process.env.SESSION_SECRET,
    cookie: {
      secure: !isDev,  // HTTPS in production
      httpOnly: true,
      sameSite: 'strict'
    }
  }
};
```

### 3. Validate Required Config

```javascript
// webroot/index.js
const requiredEnvVars = [
  'SESSION_SECRET',
  'DB_NAME',
  'DB_USER'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});
```

### 4. Use Strong Secrets

```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Use in .env
SESSION_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### 5. Document Configuration

Create a `.env.example` file:

```bash
# .env.example
# Copy this to .env and fill in your values

NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database

# Session Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=your_session_secret

# Email Configuration (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

## Configuration Examples

### Development Configuration

```javascript
// config/app.js
module.exports = {
  name: 'My App (Dev)',
  debug: true,
  port: 3000,
  session: {
    secret: 'dev-secret',
    cookie: {
      maxAge: 86400000,  // 24 hours
      secure: false,
      httpOnly: true
    }
  }
};

// config/database.js
module.exports = {
  host: 'localhost',
  user: 'dev_user',
  password: 'dev_pass',
  database: 'myapp_dev',
  connectionLimit: 5
};
```

### Production Configuration

```javascript
// config/app.js
module.exports = {
  name: process.env.APP_NAME,
  debug: false,
  port: parseInt(process.env.PORT) || 8080,
  session: {
    secret: process.env.SESSION_SECRET,
    cookie: {
      maxAge: 3600000,  // 1 hour
      secure: true,  // HTTPS only
      httpOnly: true,
      sameSite: 'strict'
    }
  }
};

// config/database.js
module.exports = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 20,
  ssl: {
    rejectUnauthorized: true
  }
};
```

### Test Configuration

```javascript
// config/app.js
module.exports = {
  name: 'My App (Test)',
  debug: false,
  port: 3001,
  session: {
    secret: 'test-secret',
    cookie: {
      maxAge: 3600000
    }
  }
};

// config/database.js
module.exports = {
  host: 'localhost',
  user: 'test_user',
  password: 'test_pass',
  database: 'myapp_test',
  connectionLimit: 5
};
```

## Accessing Configuration

### In Controllers

```javascript
class MyController extends AppController {
  async index() {
    // Via application instance
    const appName = this.app.getConfig('name');
    const isDebug = this.app.getConfig('debug');

    // Via direct require
    const config = require('../../config/app');
    console.log(config.port);
  }
}
```

### In Models

```javascript
class MyModel extends AppModel {
  static someMethod() {
    const config = require('../../config/app');

    if (config.debug) {
      console.log('Debug mode enabled');
    }
  }
}
```

### In Views

Configuration is not automatically passed to views. Pass it explicitly:

```javascript
// In controller
this.set('appName', config.name);

// In view
<h1><%= appName %></h1>
```

## Next Steps

- Learn about [Environment Setup](./environment-setup.md)
- Explore [Deployment](./deployment.md)
- Understand [Security Configuration](./security.md)
- Master [Performance Tuning](./performance.md)
