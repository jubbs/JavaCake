/**
 * Custom routes configuration
 * Define custom routes here that override convention-based routing
 *
 * Example:
 * router.addRoute('/about', { controller: 'Pages', action: 'about' });
 * router.addRoute('/blog/:id', { controller: 'Posts', action: 'view' });
 */

module.exports = (router) => {
  // Default route - home page
  router.addRoute('/', { controller: 'Pages', action: 'home' });

  // Add your custom routes here
  // router.addRoute('/about', { controller: 'Pages', action: 'about' });
  // router.addRoute('/contact', { controller: 'Pages', action: 'contact' });

  // Convention-based routing handles everything else automatically
  // /controller/action/param1/param2
};
