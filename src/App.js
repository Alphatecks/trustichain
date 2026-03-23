import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Web3Provider } from './context/Web3Context';
import { ThemeProvider } from './context/ThemeContext';
import { SessionProvider } from './context/SessionContext';
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
import TrustiCard from './pages/dashboard/trusticard/TrustiCard';
import Savings from './pages/dashboard/savings/Savings';
import Payroll from './pages/dashboard/business-suite/Payroll';
import PayrollDetail from './pages/dashboard/business-suite/PayrollDetail';
import APIKeys from './pages/dashboard/business-suite/APIKeys';
import SandboxEnvironment from './pages/dashboard/business-suite/SandboxEnvironment';
import Webhook from './pages/dashboard/business-suite/Webhook';
import Settings from './pages/dashboard/settings/Settings';
import useAutoLogout from './hooks/useAutoLogout';
import BusinessEmailGate from './components/BusinessEmailGate';
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
    const fallbackPaths = ['/', '/dashboard', '/login', '/signup', '/auth/callback'];
    if (!fallbackPaths.includes(path)) return;
    navigate(`/auth/google/callback${location.search}${location.hash || ''}`, { replace: true });
  }, [path, location.search, location.hash, navigate]);

  // Enable auto-logout after 3600 seconds (1 hour) of inactivity
  useAutoLogout(3600000);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

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
    path === '/supplier-contract' ||
    path === '/api-keys' ||
    path === '/sandbox-environment' ||
    path === '/webhook' ||
    path === '/settings';
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
          <Route path="/supplier-contract" element={<Dashboard />} />
          <Route path="/api-keys" element={<APIKeys />} />
          <Route path="/sandbox-environment" element={<SandboxEnvironment />} />
          <Route path="/webhook" element={<Webhook />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
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
            <AppContent />
          </Router>
        </SessionProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;
