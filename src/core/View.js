const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

class View {
  constructor(viewsPath) {
    this.viewsPath = viewsPath || path.join(__dirname, '../../src/views');
    this.layoutsPath = path.join(this.viewsPath, 'layouts');
    this.cache = {};
  }

  /**
   * Render a view with layout
   * @param {string} view - View path (e.g., 'users/index')
   * @param {Object} data - Data to pass to view
   * @param {string|null} layout - Layout name or null for no layout
   * @returns {Promise<string>} Rendered HTML
   */
  async render(view, data = {}, layout = 'default') {
    try {
      // Render the view content
      const viewHtml = await this._renderView(view, data);

      // If no layout, return view content
      if (layout === null || layout === false) {
        return viewHtml;
      }

      // Render with layout
      const layoutData = { ...data, content: viewHtml };
      return await this._renderLayout(layout, layoutData);
    } catch (error) {
      console.error('Error rendering view:', error);
      throw error;
    }
  }

  /**
   * Render a view file
   * @param {string} view - View path
   * @param {Object} data - View data
   * @returns {Promise<string>} Rendered HTML
   */
  async _renderView(view, data) {
    const viewPath = this._resolveViewPath(view);

    if (!fs.existsSync(viewPath)) {
      throw new Error(`View not found: ${view} (${viewPath})`);
    }

    try {
      const html = await ejs.renderFile(viewPath, data, {
        cache: true,
        filename: viewPath
      });
      return html;
    } catch (error) {
      console.error(`Error rendering view ${view}:`, error);
      throw error;
    }
  }

  /**
   * Render a layout file
   * @param {string} layout - Layout name
   * @param {Object} data - Layout data (includes content)
   * @returns {Promise<string>} Rendered HTML
   */
  async _renderLayout(layout, data) {
    const layoutPath = path.join(this.layoutsPath, `${layout}.ejs`);

    if (!fs.existsSync(layoutPath)) {
      // If layout doesn't exist, return content without layout
      console.warn(`Layout not found: ${layout}, rendering without layout`);
      return data.content;
    }

    try {
      const html = await ejs.renderFile(layoutPath, data, {
        cache: true,
        filename: layoutPath
      });
      return html;
    } catch (error) {
      console.error(`Error rendering layout ${layout}:`, error);
      throw error;
    }
  }

  /**
   * Render a partial
   * @param {string} partial - Partial path
   * @param {Object} data - Partial data
   * @returns {Promise<string>} Rendered HTML
   */
  async renderPartial(partial, data = {}) {
    // Partials start with underscore
    if (!partial.includes('/')) {
      partial = `_${partial}`;
    } else {
      const parts = partial.split('/');
      const fileName = parts.pop();
      parts.push(`_${fileName}`);
      partial = parts.join('/');
    }

    return await this._renderView(partial, data);
  }

  /**
   * Resolve view path from view name
   * @param {string} view - View name (e.g., 'users/index')
   * @returns {string} Full view path
   */
  _resolveViewPath(view) {
    // Remove .ejs extension if provided
    view = view.replace(/\.ejs$/, '');

    // Try with .ejs extension
    let viewPath = path.join(this.viewsPath, `${view}.ejs`);

    if (fs.existsSync(viewPath)) {
      return viewPath;
    }

    // Try without extension (in case it's already included)
    viewPath = path.join(this.viewsPath, view);

    if (fs.existsSync(viewPath)) {
      return viewPath;
    }

    // Return the attempted path for error message
    return path.join(this.viewsPath, `${view}.ejs`);
  }

  /**
   * Check if a view exists
   * @param {string} view - View path
   * @returns {boolean} True if view exists
   */
  viewExists(view) {
    const viewPath = this._resolveViewPath(view);
    return fs.existsSync(viewPath);
  }

  /**
   * Check if a layout exists
   * @param {string} layout - Layout name
   * @returns {boolean} True if layout exists
   */
  layoutExists(layout) {
    const layoutPath = path.join(this.layoutsPath, `${layout}.ejs`);
    return fs.existsSync(layoutPath);
  }

  /**
   * Clear view cache
   */
  clearCache() {
    this.cache = {};
    // Clear EJS cache
    ejs.clearCache();
  }

  /**
   * Set views path
   * @param {string} viewsPath - Path to views directory
   */
  setViewsPath(viewsPath) {
    this.viewsPath = viewsPath;
    this.layoutsPath = path.join(viewsPath, 'layouts');
  }

  /**
   * Get views path
   * @returns {string} Views path
   */
  getViewsPath() {
    return this.viewsPath;
  }

  /**
   * Render element (reusable view component)
   * @param {string} element - Element name
   * @param {Object} data - Element data
   * @returns {Promise<string>} Rendered HTML
   */
  async renderElement(element, data = {}) {
    const elementPath = `elements/${element}`;
    return await this._renderView(elementPath, data);
  }

  /**
   * Helper method to include another view
   * @param {string} view - View to include
   * @param {Object} data - Data for the view
   * @returns {Promise<string>} Rendered HTML
   */
  async include(view, data = {}) {
    return await this._renderView(view, data);
  }
}

module.exports = View;
