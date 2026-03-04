/**
 * FormHelper - Helper for generating HTML forms
 */
class FormHelper {
  /**
   * Generate an input field
   * @param {string} name - Field name
   * @param {Object} options - Field options
   * @returns {string} HTML input element
   */
  static input(name, options = {}) {
    const type = options.type || 'text';
    const value = options.value || '';
    const placeholder = options.placeholder || '';
    const className = options.class || '';
    const id = options.id || name;
    const required = options.required ? 'required' : '';
    const disabled = options.disabled ? 'disabled' : '';
    const readonly = options.readonly ? 'readonly' : '';

    const attributes = Object.entries(options)
      .filter(([key]) => !['type', 'value', 'placeholder', 'class', 'id', 'required', 'disabled', 'readonly'].includes(key))
      .map(([key, val]) => `${key}="${val}"`)
      .join(' ');

    return `<input type="${type}" name="${name}" id="${id}" value="${value}" placeholder="${placeholder}" class="${className}" ${required} ${disabled} ${readonly} ${attributes}>`;
  }

  /**
   * Generate a textarea
   * @param {string} name - Field name
   * @param {Object} options - Field options
   * @returns {string} HTML textarea element
   */
  static textarea(name, options = {}) {
    const value = options.value || '';
    const placeholder = options.placeholder || '';
    const className = options.class || '';
    const id = options.id || name;
    const rows = options.rows || 5;
    const cols = options.cols || 50;
    const required = options.required ? 'required' : '';
    const disabled = options.disabled ? 'disabled' : '';

    return `<textarea name="${name}" id="${id}" rows="${rows}" cols="${cols}" placeholder="${placeholder}" class="${className}" ${required} ${disabled}>${value}</textarea>`;
  }

  /**
   * Generate a select dropdown
   * @param {string} name - Field name
   * @param {Array} optionsArray - Array of options [{value, label}]
   * @param {Object} options - Field options
   * @returns {string} HTML select element
   */
  static select(name, optionsArray, options = {}) {
    const selected = options.selected || '';
    const className = options.class || '';
    const id = options.id || name;
    const required = options.required ? 'required' : '';
    const disabled = options.disabled ? 'disabled' : '';

    const optionsHtml = optionsArray.map(opt => {
      const value = typeof opt === 'object' ? opt.value : opt;
      const label = typeof opt === 'object' ? opt.label : opt;
      const isSelected = value == selected ? 'selected' : '';
      return `<option value="${value}" ${isSelected}>${label}</option>`;
    }).join('');

    return `<select name="${name}" id="${id}" class="${className}" ${required} ${disabled}>${optionsHtml}</select>`;
  }

  /**
   * Generate a checkbox
   * @param {string} name - Field name
   * @param {Object} options - Field options
   * @returns {string} HTML checkbox element
   */
  static checkbox(name, options = {}) {
    const value = options.value || '1';
    const checked = options.checked ? 'checked' : '';
    const className = options.class || '';
    const id = options.id || name;
    const label = options.label || '';
    const disabled = options.disabled ? 'disabled' : '';

    const checkbox = `<input type="checkbox" name="${name}" id="${id}" value="${value}" class="${className}" ${checked} ${disabled}>`;

    if (label) {
      return `<label>${checkbox} ${label}</label>`;
    }

    return checkbox;
  }

  /**
   * Generate a radio button
   * @param {string} name - Field name
   * @param {string} value - Radio value
   * @param {Object} options - Field options
   * @returns {string} HTML radio element
   */
  static radio(name, value, options = {}) {
    const checked = options.checked ? 'checked' : '';
    const className = options.class || '';
    const id = options.id || `${name}_${value}`;
    const label = options.label || '';
    const disabled = options.disabled ? 'disabled' : '';

    const radio = `<input type="radio" name="${name}" id="${id}" value="${value}" class="${className}" ${checked} ${disabled}>`;

    if (label) {
      return `<label>${radio} ${label}</label>`;
    }

    return radio;
  }

  /**
   * Generate a submit button
   * @param {string} label - Button label
   * @param {Object} options - Button options
   * @returns {string} HTML submit button
   */
  static submit(label = 'Submit', options = {}) {
    const className = options.class || 'btn btn-primary';
    const id = options.id || 'submit-btn';
    const disabled = options.disabled ? 'disabled' : '';

    return `<button type="submit" id="${id}" class="${className}" ${disabled}>${label}</button>`;
  }

  /**
   * Generate a button
   * @param {string} label - Button label
   * @param {Object} options - Button options
   * @returns {string} HTML button
   */
  static button(label, options = {}) {
    const type = options.type || 'button';
    const className = options.class || 'btn';
    const id = options.id || '';
    const disabled = options.disabled ? 'disabled' : '';
    const onclick = options.onclick || '';

    return `<button type="${type}" id="${id}" class="${className}" onclick="${onclick}" ${disabled}>${label}</button>`;
  }

  /**
   * Generate a hidden input
   * @param {string} name - Field name
   * @param {string} value - Field value
   * @returns {string} HTML hidden input
   */
  static hidden(name, value) {
    return `<input type="hidden" name="${name}" value="${value}">`;
  }

  /**
   * Generate a file input
   * @param {string} name - Field name
   * @param {Object} options - Field options
   * @returns {string} HTML file input
   */
  static file(name, options = {}) {
    const className = options.class || '';
    const id = options.id || name;
    const accept = options.accept || '';
    const multiple = options.multiple ? 'multiple' : '';
    const required = options.required ? 'required' : '';

    return `<input type="file" name="${name}" id="${id}" class="${className}" accept="${accept}" ${multiple} ${required}>`;
  }

  /**
   * Generate a form opening tag
   * @param {string} action - Form action URL
   * @param {Object} options - Form options
   * @returns {string} HTML form opening tag
   */
  static create(action, options = {}) {
    const method = options.method || 'POST';
    const className = options.class || '';
    const id = options.id || '';
    const enctype = options.enctype || '';

    return `<form action="${action}" method="${method}" class="${className}" id="${id}" enctype="${enctype}">`;
  }

  /**
   * Generate a form closing tag
   * @returns {string} HTML form closing tag
   */
  static end() {
    return '</form>';
  }

  /**
   * Generate a label
   * @param {string} forInput - Input name/id
   * @param {string} text - Label text
   * @param {Object} options - Label options
   * @returns {string} HTML label
   */
  static label(forInput, text, options = {}) {
    const className = options.class || '';
    const id = options.id || '';

    return `<label for="${forInput}" class="${className}" id="${id}">${text}</label>`;
  }
}

module.exports = FormHelper;
