const Application = require('../src/core/Application');
const appConfig = require('../config/app');
const dbConfig = require('../config/database');
const routes = require('../config/routes');

// Create application instance
const app = new Application({
  config: appConfig,
  database: dbConfig,
  routes: routes
});

// Initialize and start the application
app.initialize()
  .then(() => {
    return app.start(appConfig.port);
  })
  .catch(error => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await app.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  await app.stop();
  process.exit(0);
});

module.exports = app;
