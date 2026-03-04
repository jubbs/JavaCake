module.exports = {
  // Application name
  name: 'JavaCake Application',

  // Debug mode - set to false in production
  debug: true,

  // Server port
  port: 3000,

  // Session configuration
  session: {
    secret: 'change-this-secret-key-in-production',
    cookie: {
      maxAge: 3600000, // 1 hour in milliseconds
      httpOnly: true,
      secure: false // Set to true if using HTTPS
    }
  },

  // View configuration
  views: {
    defaultLayout: 'default'
  }
};
