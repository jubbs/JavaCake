/**
 * HtmlHelper - Helper for generating HTML elements
 */
class HtmlHelper {
  /**
   * Generate a link
   * @param {string} text - Link text
   * @param {string} url - Link URL
   * @param {Object} options - Link options
   * @returns {string} HTML anchor element
   */
  static link(text, url, options = {}) {
    const className = options.class || '';
    const id = options.id || '';
    const title = options.title || '';
    const target = options.target || '';
    const rel = options.rel || '';

    const attributes = Object.entries(options)
      .filter(([key]) => !['class', 'id', 'title', 'target', 'rel'].includes(key))
      .map(([key, val]) => `${key}="${val}"`)
      .join(' ');

    return `<a href="${url}" class="${className}" id="${id}" title="${title}" target="${target}" rel="${rel}" ${attributes}>${text}</a>`;
  }

  /**
   * Generate an image tag
   * @param {string} src - Image source URL
   * @param {Object} options - Image options
   * @returns {string} HTML image element
   */
  static image(src, options = {}) {
    const alt = options.alt || '';
    const className = options.class || '';
    const id = options.id || '';
    const width = options.width || '';
    const height = options.height || '';
    const title = options.title || '';

    return `<img src="${src}" alt="${alt}" class="${className}" id="${id}" width="${width}" height="${height}" title="${title}">`;
  }

  /**
   * Generate a CSS link tag
   * @param {string} href - CSS file URL
   * @param {Object} options - Link options
   * @returns {string} HTML link element
   */
  static css(href, options = {}) {
    const media = options.media || 'all';
    const id = options.id || '';

    // Add .css extension if not present
    if (!href.endsWith('.css')) {
      href = `${href}.css`;
    }

    // Add /css/ prefix if not absolute and not already prefixed
    if (!href.startsWith('http') && !href.startsWith('/css/')) {
      href = `/css/${href}`;
    }

    return `<link rel="stylesheet" type="text/css" href="${href}" media="${media}" id="${id}">`;
  }

  /**
   * Generate a script tag
   * @param {string} src - Script source URL
   * @param {Object} options - Script options
   * @returns {string} HTML script element
   */
  static script(src, options = {}) {
    const type = options.type || 'text/javascript';
    const id = options.id || '';
    const async = options.async ? 'async' : '';
    const defer = options.defer ? 'defer' : '';

    // Add .js extension if not present
    if (!src.endsWith('.js')) {
      src = `${src}.js`;
    }

    // Add /js/ prefix if not absolute and not already prefixed
    if (!src.startsWith('http') && !src.startsWith('/js/')) {
      src = `/js/${src}`;
    }

    return `<script type="${type}" src="${src}" id="${id}" ${async} ${defer}></script>`;
  }

  /**
   * Generate an inline script tag
   * @param {string} content - Script content
   * @returns {string} HTML script element with inline content
   */
  static scriptBlock(content) {
    return `<script type="text/javascript">${content}</script>`;
  }

  /**
   * Generate a div element
   * @param {string} content - Div content
   * @param {Object} options - Div options
   * @returns {string} HTML div element
   */
  static div(content, options = {}) {
    const className = options.class || '';
    const id = options.id || '';

    return `<div class="${className}" id="${id}">${content}</div>`;
  }

  /**
   * Generate a paragraph
   * @param {string} content - Paragraph content
   * @param {Object} options - Paragraph options
   * @returns {string} HTML paragraph element
   */
  static para(content, options = {}) {
    const className = options.class || '';
    const id = options.id || '';

    return `<p class="${className}" id="${id}">${content}</p>`;
  }

  /**
   * Generate a heading
   * @param {string} content - Heading content
   * @param {number} level - Heading level (1-6)
   * @param {Object} options - Heading options
   * @returns {string} HTML heading element
   */
  static heading(content, level = 1, options = {}) {
    const className = options.class || '';
    const id = options.id || '';
    level = Math.max(1, Math.min(6, level)); // Ensure level is between 1 and 6

    return `<h${level} class="${className}" id="${id}">${content}</h${level}>`;
  }

  /**
   * Generate an unordered list
   * @param {Array} items - List items
   * @param {Object} options - List options
   * @returns {string} HTML ul element
   */
  static ul(items, options = {}) {
    const className = options.class || '';
    const id = options.id || '';
    const itemClass = options.itemClass || '';

    const itemsHtml = items.map(item => {
      return `<li class="${itemClass}">${item}</li>`;
    }).join('');

    return `<ul class="${className}" id="${id}">${itemsHtml}</ul>`;
  }

  /**
   * Generate an ordered list
   * @param {Array} items - List items
   * @param {Object} options - List options
   * @returns {string} HTML ol element
   */
  static ol(items, options = {}) {
    const className = options.class || '';
    const id = options.id || '';
    const itemClass = options.itemClass || '';

    const itemsHtml = items.map(item => {
      return `<li class="${itemClass}">${item}</li>`;
    }).join('');

    return `<ol class="${className}" id="${id}">${itemsHtml}</ol>`;
  }

  /**
   * Generate a table
   * @param {Array} headers - Table headers
   * @param {Array} rows - Table rows (array of arrays)
   * @param {Object} options - Table options
   * @returns {string} HTML table element
   */
  static table(headers, rows, options = {}) {
    const className = options.class || '';
    const id = options.id || '';

    const headersHtml = headers.map(header => `<th>${header}</th>`).join('');
    const rowsHtml = rows.map(row => {
      const cells = row.map(cell => `<td>${cell}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `
      <table class="${className}" id="${id}">
        <thead><tr>${headersHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  static escape(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Generate a span element
   * @param {string} content - Span content
   * @param {Object} options - Span options
   * @returns {string} HTML span element
   */
  static span(content, options = {}) {
    const className = options.class || '';
    const id = options.id || '';

    return `<span class="${className}" id="${id}">${content}</span>`;
  }

  /**
   * Generate a tag/badge element
   * @param {string} content - Tag content
   * @param {string} type - Tag type (info, success, warning, danger)
   * @param {Object} options - Tag options
   * @returns {string} HTML span element styled as tag
   */
  static tag(content, type = 'info', options = {}) {
    const className = options.class || `tag tag-${type}`;
    const id = options.id || '';

    return `<span class="${className}" id="${id}">${content}</span>`;
  }

  /**
   * Generate breadcrumbs
   * @param {Array} links - Array of {text, url} objects
   * @param {Object} options - Breadcrumb options
   * @returns {string} HTML breadcrumb navigation
   */
  static breadcrumbs(links, options = {}) {
    const className = options.class || 'breadcrumbs';
    const separator = options.separator || '&gt;';

    const items = links.map((link, index) => {
      if (index === links.length - 1) {
        return `<span class="active">${link.text}</span>`;
      }
      return `<a href="${link.url}">${link.text}</a>`;
    }).join(` ${separator} `);

    return `<nav class="${className}">${items}</nav>`;
  }
}

module.exports = HtmlHelper;
