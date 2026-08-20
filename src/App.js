import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Web3Provider } from './context/Web3Context';
import { ThemeProvider } from './context/ThemeContext';
import { SessionProvider } from './context/SessionContext';
import { EscrowMetricsProvider } from './context/EscrowMetricsContext';
import { DisputeMetricsProvider } from './context/DisputeMetricsContext';
import { TrustiscoreProvider } from './context/TrustiscoreContext';
import { DisplayCurrencyProvider } from './context/DisplayCurrencyContext';
import LandingNavbar from './components/LandingNavbar';
import Navbar from './components/Navbar';
import Home from './pages/home/Home';
import Features from './pages/features/Features';
import Pricing from './pages/pricing/Pricing';
import Waitlist from './pages/waitlist/Waitlist';
import LearnMore from './pages/learn/LearnMore';
import PrivacyPolicy from './pages/privacy/PrivacyPolicy';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import TwoFactor from './pages/auth/TwoFactor';
import Otp from './pages/auth/Otp';
import OAuthCallback from './pages/auth/OAuthCallback';
import Dashboard from './pages/dashboard/dashboard/Dashboard';
import MyEscrow from './pages/dashboard/my-escrow/MyEscrow';
import Transactions from './pages/dashboard/transactions/Transactions';
import Dispute from './pages/dashboard/dispute/Dispute';
import DisputeDetail from './pages/dashboard/dispute/DisputeDetail';
import BusinessSuiteDispute from './pages/dashboard/business-suite/BusinessSuiteDispute';
import BusinessSuiteDisputeDetail from './pages/dashboard/business-suite/BusinessSuiteDisputeDetail';
import Savings from './pages/dashboard/savings/Savings';
import TrustiCard from './pages/dashboard/trusticard/TrustiCard';
import Payroll from './pages/dashboard/business-suite/Payroll';
import PayrollDetail from './pages/dashboard/business-suite/PayrollDetail';
import APIKeys from './pages/dashboard/business-suite/APIKeys';
import SandboxEnvironment from './pages/dashboard/business-suite/SandboxEnvironment';
import Webhook from './pages/dashboard/business-suite/Webhook';
import Invoice from './pages/dashboard/business-suite/Invoice';
import Settings from './pages/dashboard/settings/Settings';
import Profile from './pages/dashboard/profile/Profile';
import useAutoLogout from './hooks/useAutoLogout';
import BusinessEmailGate from './components/BusinessEmailGate';
import trustiChainLogoIcon from './assets/images/icons/logo.png';
import './App.css';

/** Strip trailing slashes for stable route checks (e.g. /dashboard/ vs /dashboard). */
function normalizePathname(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = normalizePathname(location.pathname);

  // If Google redirects to the wrong URL (e.g. /dashboard?code=...), send the code to the real handler.
  useEffect(() => {
    if (path === '/auth/google/callback') return;
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (!code || code.length < 10) return;
    // Do not rewrite /auth/callback here: Google issues the code for an exact redirect_uri;
    // rewriting would break token exchange (invalid JWT on profile).
    const fallbackPaths = ['/', '/dashboard', '/login', '/signup'];
    if (!fallbackPaths.includes(path)) return;
    navigate(`/auth/google/callback${location.search}${location.hash || ''}`, { replace: true });
  }, [path, location.search, location.hash, navigate]);

  // Enable auto-logout after 3600 seconds (1 hour) of inactivity
  useAutoLogout(3600000);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  // Keep browser tab icon aligned with TrustiChain branding.
  useEffect(() => {
    const ensureLink = (rel, type) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      if (type) link.setAttribute('type', type);
      link.setAttribute('href', trustiChainLogoIcon);
    };

    ensureLink('icon', 'image/png');
    ensureLink('apple-touch-icon', 'image/png');
  }, []);

  // Hide navbar on auth pages
  const isAuthPage =
    path === '/login' ||
    path === '/signup' ||
    path === '/forgot-password' ||
    path === '/two-factor' ||
    path === '/otp' ||
    path === '/auth/google/callback' ||
    path === '/auth/callback' ||
    path === '/dashboard' ||
    path === '/my-escrow' ||
    path === '/transactions' ||
    path === '/savings' ||
    path === '/dispute' ||
    location.pathname.startsWith('/dispute/') ||
    path === '/business-dispute' ||
    location.pathname.startsWith('/business-dispute/') ||
    path === '/trusticard' ||
    path === '/payroll' ||
    location.pathname.startsWith('/payroll/') ||
    path === '/invoice' ||
    path === '/supplier-contract' ||
    path === '/api-keys' ||
    path === '/sandbox-environment' ||
    path === '/webhook' ||
    path === '/settings' ||
    path === '/profile';
  // Use LandingNavbar for landing pages, Navbar for app pages
  const isLandingPage =
    path === '/' ||
    path === '/features' ||
    path === '/pricing' ||
    path === '/waitlist' ||
    path === '/learn-more' ||
    path === '/privacy-policy';
  const NavbarComponent = isLandingPage ? LandingNavbar : Navbar;

  return (
    <div className="App">
      {!isAuthPage && <NavbarComponent />}
      <BusinessEmailGate />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/learn-more" element={<LearnMore />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/two-factor" element={<TwoFactor />} />
          <Route path="/otp" element={<Otp />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/auth/google/callback" element={<OAuthCallback />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-escrow" element={<MyEscrow />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="/dispute" element={<Dispute />} />
          <Route path="/dispute/:id" element={<DisputeDetail />} />
          <Route path="/business-dispute" element={<BusinessSuiteDispute />} />
          <Route path="/business-dispute/:id" element={<BusinessSuiteDisputeDetail />} />
          <Route path="/trusticard" element={<TrustiCard />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/payroll/:payrollId" element={<PayrollDetail />} />
          <Route path="/invoice" element={<Invoice />} />
          <Route path="/supplier-contract" element={<Dashboard />} />
          <Route path="/api-keys" element={<APIKeys />} />
          <Route path="/sandbox-environment" element={<SandboxEnvironment />} />
          <Route path="/webhook" element={<Webhook />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      <Toaster
        position="top-right"
        containerClassName="trusti-toaster"
        containerStyle={{
          top: 'max(12px, env(safe-area-inset-top))',
          right: 'max(12px, env(safe-area-inset-right))',
          left: 'max(12px, env(safe-area-inset-left))',
          bottom: 'max(12px, env(safe-area-inset-bottom))',
        }}
        gutter={10}
        toastOptions={{
          duration: 4000,
          className: 'trusti-toast',
          style: {
            fontFamily: "'Satoshi', 'Inter', system-ui, -apple-system, sans-serif",
            fontSize: '0.9375rem',
            fontWeight: 500,
            lineHeight: 1.45,
            color: '#0f172a',
            background: '#ffffff',
            borderRadius: '14px',
            padding: '14px 18px',
            boxShadow:
              '0 12px 40px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.06)',
            border: '1px solid rgba(226, 232, 240, 0.95)',
            borderLeftWidth: '4px',
            borderLeftColor: '#cbd5e1',
            maxWidth: 'min(420px, calc(100vw - 24px))',
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: '#15803d',
              secondary: '#ecfdf5',
            },
            style: {
              background: 'linear-gradient(145deg, #f0fdf4 0%, #ffffff 52%, #ffffff 100%)',
              borderColor: 'rgba(187, 247, 208, 0.85)',
              borderLeftColor: '#22c55e',
              color: '#14532d',
            },
          },
          error: {
            duration: 5200,
            iconTheme: {
              primary: '#dc2626',
              secondary: '#fef2f2',
            },
            style: {
              background: 'linear-gradient(145deg, #fef2f2 0%, #ffffff 48%, #ffffff 100%)',
              borderColor: 'rgba(252, 165, 165, 0.55)',
              borderLeftColor: '#ef4444',
              color: '#7f1d1d',
            },
          },
          loading: {
            iconTheme: {
              primary: '#0066ff',
              secondary: '#e0f2fe',
            },
            style: {
              background: 'linear-gradient(145deg, #eff6ff 0%, #ffffff 52%, #ffffff 100%)',
              borderColor: 'rgba(147, 197, 253, 0.65)',
              borderLeftColor: '#0066ff',
              color: '#1e3a5f',
            },
          },
          blank: {
            style: {
              background: 'linear-gradient(145deg, #f8fafc 0%, #ffffff 55%, #ffffff 100%)',
              borderColor: 'rgba(203, 213, 225, 0.85)',
              borderLeftColor: '#64748b',
              color: '#334155',
            },
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Web3Provider>
        <SessionProvider>
          <Router>
            <EscrowMetricsProvider>
              <DisputeMetricsProvider>
                <TrustiscoreProvider>
                  <DisplayCurrencyProvider>
                    <AppContent />
                  </DisplayCurrencyProvider>
                </TrustiscoreProvider>
              </DisputeMetricsProvider>
            </EscrowMetricsProvider>
          </Router>
        </SessionProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;
