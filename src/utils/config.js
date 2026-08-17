// API Configuration — set REACT_APP_API_BASE_URL (e.g. http://localhost:3000) for local backend
const trimTrailingSlash = (url) => (typeof url === 'string' ? url.replace(/\/$/, '') : url);
export const API_BASE_URL =
  trimTrailingSlash(process.env.REACT_APP_API_BASE_URL) || 'https://trustichain-backend.onrender.com';

// WalletConnect Cloud project ID — https://cloud.reown.com
// Override with REACT_APP_WALLETCONNECT_PROJECT_ID for production.
export const WALLETCONNECT_PROJECT_ID = String(
  process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'c4f79cc821944d9680842e34466bfbd9',
).trim();

// Helper function to get full API endpoint
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Stripe publishable key — required for Google Pay / Apple Pay wallet funding
export const STRIPE_PUBLISHABLE_KEY = String(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '',
).trim();

