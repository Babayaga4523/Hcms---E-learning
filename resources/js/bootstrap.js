import axios from 'axios';

// Configure axios defaults
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;
// Ensure axios will read XSRF cookie and set X-XSRF-TOKEN header automatically
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

// Make axios available globally
window.axios = axios;

// Export for module imports
export default axios;
