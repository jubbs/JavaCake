const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const database = require('./Database');
const Router = require('./Router');

class Application {
  constructor(options = {}) {
    this.config = options.config || {};
    this.dbConfig = options.database || {};
    this.customRoutes = options.routes || null;
    this.app = null;
    this.router = null;
    this.server = null;
  }

  /**
   * Initialize the application
   * @returns {Promise<void>}
   */
  async initialize() {
    console.log('Initializing JavaCake application...');

    // Create Express app
    this.app = express();

    // Connect to database
    await this.connectDatabase();

    // Setup middleware
    this.setupMiddleware();

    // Setup router
    this.setupRouter();

    // Setup error handling
    this.setupErrorHandling();

    console.log('JavaCake application initialized successfully');
  }

  /**
   * Connect to database
   * @returns {Promise<void>}
   */
  async connectDatabase() {
    if (!this.dbConfig.database) {
      console.warn('No database configuration provided. Skipping database connection.');
      return;
    }

    try {
      await database.initialize(this.dbConfig);
    } catch (error) {
      console.error('Failed to connect to database:', error.message);
      if (this.config.debug) {
        throw error;
      }
    }
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Body parser middleware
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    // Cookie parser
    this.app.use(cookieParser());

    // Session middleware
    if (this.config.session) {
      const sessionConfig = {
        secret: this.config.session.secret || 'javacake-secret-change-this',
        resave: false,
        saveUninitialized: false,
        cookie: this.config.session.cookie || { maxAge: 3600000 }
      };

      this.app.use(session(sessionConfig));
    }

    // Static files
    const webrootPath = path.join(__dirname, '../../webroot');
    this.app.use(express.static(webrootPath));

    // Set EJS as view engine (for error pages)
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, '../../src/views'));

    // Debug mode logging
    if (this.config.debug) {
      this.app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
      });
    }
  }

  /**
   * Setup router
   */
  setupRouter() {
    this.router = new Router();

    // Add custom routes if provided
    if (this.customRoutes && typeof this.customRoutes === 'function') {
      this.customRoutes(this.router);
    }

    // Use router middleware
    this.app.use(this.router.middleware());
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res, next) => {
      res.status(404);

      if (req.accepts('html')) {
        const errorView = path.join(__dirname, '../../src/views/errors/404.ejs');
        try {
          res.render(errorView, { url: req.url });
        } catch (error) {
          res.send('<h1>404 - Page Not Found</h1>');
        }
      } else if (req.accepts('json')) {
        res.json({ error: 'Not found' });
      } else {
        res.type('txt').send('Not found');
      }
    });

    // 500 error handler
    this.app.use((err, req, res, next) => {
      console.error('Application error:', err);

      res.status(err.status || 500);

      if (this.config.debug) {
        // Show detailed error in debug mode
        if (req.accepts('html')) {
          res.send(`
            <h1>Error: ${err.message}</h1>
            <pre>${err.stack}</pre>
          `);
        } else if (req.accepts('json')) {
          res.json({
            error: err.message,
            stack: err.stack
          });
        } else {
          res.type('txt').send(err.message);
        }
      } else {
        // Show generic error in production
        if (req.accepts('html')) {
          const errorView = path.join(__dirname, '../../src/views/errors/500.ejs');
          try {
            res.render(errorView, { error: err });
          } catch (error) {
            res.send('<h1>500 - Internal Server Error</h1>');
          }
        } else if (req.accepts('json')) {
          res.json({ error: 'Internal server error' });
        } else {
          res.type('txt').send('Internal server error');
        }
      }
    });
  }

  /**
   * Start the server
   * @param {number} port - Port number
   * @returns {Promise<void>}
   */
  start(port = 3000) {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(port, () => {
          console.log(`
╔════════════════════════════════════════════╗
║           JavaCake Framework               ║
║    CakePHP-inspired MVC for Node.js        ║
╚════════════════════════════════════════════╝

Server running on: http://localhost:${port}
Environment: ${this.config.debug ? 'Development' : 'Production'}
Database: ${this.dbConfig.database || 'Not configured'}

Press CTRL+C to stop
          `);
          resolve();
        });

        this.server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use`);
          } else {
            console.error('Server error:', error);
          }
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the server
   * @returns {Promise<void>}
   */
  async stop() {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close(async (error) => {
        if (error) {
          reject(error);
          return;
        }

        // Close database connection
        await database.close();

        console.log('Server stopped');
        resolve();
      });
    });
  }

  /**
   * Get Express app instance
   * @returns {Object} Express app
   */
  getApp() {
    return this.app;
  }

  /**
   * Get router instance
   * @returns {Router} Router instance
   */
  getRouter() {
    return this.router;
  }

  /**
   * Get database instance
   * @returns {Database} Database instance
   */
  getDatabase() {
    return database;
  }

  /**
   * Add middleware
   * @param {Function} middleware - Express middleware function
   */
  use(middleware) {
    if (this.app) {
      this.app.use(middleware);
    } else {
      throw new Error('Application not initialized. Call initialize() first.');
    }
  }

  /**
   * Set configuration value
   * @param {string} key - Configuration key
   * @param {any} value - Configuration value
   */
  setConfig(key, value) {
    this.config[key] = value;
  }

  /**
   * Get configuration value
   * @param {string} key - Configuration key
   * @param {any} defaultValue - Default value if key not found
   * @returns {any} Configuration value
   */
  getConfig(key, defaultValue = null) {
    return this.config[key] || defaultValue;
  }
}

module.exports = Application;
