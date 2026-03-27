// API Configuration — set REACT_APP_API_BASE_URL (e.g. http://localhost:3000) for local backend
const trimTrailingSlash = (url) => (typeof url === 'string' ? url.replace(/\/$/, '') : url);
export const API_BASE_URL =
  trimTrailingSlash(process.env.REACT_APP_API_BASE_URL) || 'https://trustichain-backend.onrender.com';

// Helper function to get full API endpoint
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

