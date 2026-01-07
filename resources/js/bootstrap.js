import axios from 'axios';

// Configure axios defaults
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;

// Get CSRF token from meta tag
const token = document.querySelector('meta[name="csrf-token"]')?.content;
if (token) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
}

// Make axios available globally
window.axios = axios;

// Export for module imports
export default axios;
