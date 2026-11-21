const PRODUCTION_API_BASE_URL = 'https://lms-project-p4gv.onrender.com';
const DEVELOPMENT_API_BASE_URL = PRODUCTION_API_BASE_URL;

// For a local Android emulator backend, use http://10.0.2.2:<port>.
export const API_BASE_URL = __DEV__
  ? DEVELOPMENT_API_BASE_URL
  : PRODUCTION_API_BASE_URL;