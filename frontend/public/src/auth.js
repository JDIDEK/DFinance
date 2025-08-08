// Basic authentication module for handling login and registration
// Stores JWT token in localStorage and attaches it to fetch requests

document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://localhost:3001';

  // Patch fetch to include Authorization header when token exists
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = options.headers || {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return originalFetch(url, { ...options, headers });
  };

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('token', data.token);
          alert('Login successful');
        } else {
          alert(data.error || 'Login failed');
        }
      } catch (err) {
        console.error('Login error:', err);
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('register-username').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('token', data.token);
          alert('Registration successful');
        } else {
          alert(data.error || 'Registration failed');
        }
      } catch (err) {
        console.error('Registration error:', err);
      }
    });
  }
});

