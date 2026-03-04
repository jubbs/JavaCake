/**
 * JavaCake Framework - Frontend JavaScript
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('JavaCake Framework loaded');

  // Auto-hide flash messages after 5 seconds
  const flashMessages = document.querySelectorAll('.alert');
  if (flashMessages.length > 0) {
    flashMessages.forEach(function(message) {
      setTimeout(function() {
        message.style.transition = 'opacity 0.5s';
        message.style.opacity = '0';
        setTimeout(function() {
          message.remove();
        }, 500);
      }, 5000);
    });
  }

  // Add confirm dialog for delete actions
  const deleteLinks = document.querySelectorAll('a[href*="/delete/"], a[data-confirm]');
  deleteLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      const message = this.getAttribute('data-confirm') || 'Are you sure you want to delete this?';
      if (!confirm(message)) {
        e.preventDefault();
      }
    });
  });

  // Form validation helper
  const forms = document.querySelectorAll('form[data-validate]');
  forms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      const requiredFields = form.querySelectorAll('[required]');
      let isValid = true;

      requiredFields.forEach(function(field) {
        if (!field.value.trim()) {
          isValid = false;
          field.classList.add('error');

          // Remove error class on input
          field.addEventListener('input', function() {
            this.classList.remove('error');
          });
        }
      });

      if (!isValid) {
        e.preventDefault();
        alert('Please fill in all required fields');
      }
    });
  });

  // Mobile menu toggle (if needed)
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
  }
});

// Helper function for AJAX requests
function ajax(url, options = {}) {
  const defaults = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  };

  const config = { ...defaults, ...options };

  return fetch(url, config)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .catch(error => {
      console.error('AJAX error:', error);
      throw error;
    });
}

// Export ajax helper
window.ajax = ajax;
