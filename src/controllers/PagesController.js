const AppController = require('./AppController');

class PagesController extends AppController {
  /**
   * Home page
   */
  async home() {
    this.set('title', 'Welcome to JavaCake');
  }

  /**
   * About page
   */
  async about() {
    this.set('title', 'About JavaCake');
  }

  /**
   * Contact page
   */
  async contact() {
    if (this.isPost()) {
      const { name, email, message } = this.req.body;

      // Basic validation
      if (!name || !email || !message) {
        this.flash('Please fill in all fields', 'error');
        return;
      }

      // Here you would typically send an email or save to database
      this.flash('Thank you for your message! We will get back to you soon.', 'success');
      this.redirect('/');
      return;
    }

    this.set('title', 'Contact Us');
  }

  /**
   * Features page
   */
  async features() {
    this.set('title', 'Features');

    const features = [
      {
        title: 'Convention over Configuration',
        description: 'Auto-routing, automatic model/controller loading, standard directory structure'
      },
      {
        title: 'Active Record ORM',
        description: 'Easy database operations with associations (hasMany, belongsTo, hasOne, belongsToMany)'
      },
      {
        title: 'MySQL Support',
        description: 'Built-in MySQL connection pooling and query builder'
      },
      {
        title: 'EJS Templating',
        description: 'Server-side rendering with layouts and partials'
      },
      {
        title: 'Authentication',
        description: 'Built-in user authentication with bcrypt password hashing'
      },
      {
        title: 'MVC Architecture',
        description: 'Clean separation of concerns with Models, Views, and Controllers'
      }
    ];

    this.set('features', features);
  }
}

module.exports = PagesController;
