import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import TwoFactor from './pages/auth/TwoFactor';
import Otp from './pages/auth/Otp';
import OAuthCallback from './pages/auth/OAuthCallback';
import Dashboard from './pages/dashboard/dashboard/Dashboard';
import MyEscrow from './pages/dashboard/my-escrow/MyEscrow';
import Transactions from './pages/dashboard/transactions/Transactions';
import Savings from './pages/dashboard/savings/Savings';
import Dispute from './pages/dashboard/dispute/Dispute';
import DisputeDetail from './pages/dashboard/dispute/DisputeDetail';
import TrustiCard from './pages/dashboard/trusticard/TrustiCard';
import Payroll from './pages/dashboard/business-suite/Payroll';
import PayrollDetail from './pages/dashboard/business-suite/PayrollDetail';
import SupplierContractPage from './pages/dashboard/business-suite/SupplierContractPage';
import APIKeys from './pages/dashboard/business-suite/APIKeys';
import SandboxEnvironment from './pages/dashboard/business-suite/SandboxEnvironment';
import Webhook from './pages/dashboard/business-suite/Webhook';
import Settings from './pages/dashboard/settings/Settings';
import useAutoLogout from './hooks/useAutoLogout';
import './App.css';

function AppContent() {
  const location = useLocation();
  
  // Enable auto-logout after 3600 seconds (1 hour) of inactivity
  useAutoLogout(3600000);
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);
  
  // Hide navbar on auth pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password' || location.pathname === '/two-factor' || location.pathname === '/otp' || location.pathname === '/auth/google/callback' || location.pathname === '/dashboard' || location.pathname === '/my-escrow' || location.pathname === '/transactions' || location.pathname === '/savings' || location.pathname === '/dispute' || location.pathname.startsWith('/dispute/') || location.pathname === '/trusticard' || location.pathname === '/payroll' || location.pathname.startsWith('/payroll/') || location.pathname === '/supplier-contract' || location.pathname === '/api-keys' || location.pathname === '/sandbox-environment' || location.pathname === '/webhook' || location.pathname === '/settings';
  // Use LandingNavbar for landing pages, Navbar for app pages
  const isLandingPage = location.pathname === '/' || location.pathname === '/features' || location.pathname === '/pricing' || location.pathname === '/waitlist' || location.pathname === '/learn-more';
  const NavbarComponent = isLandingPage ? LandingNavbar : Navbar;

  return (
    <div className="App">
      {!isAuthPage && <NavbarComponent />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/learn-more" element={<LearnMore />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/two-factor" element={<TwoFactor />} />
          <Route path="/otp" element={<Otp />} />
          <Route path="/auth/google/callback" element={<OAuthCallback />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-escrow" element={<MyEscrow />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="/dispute" element={<Dispute />} />
          <Route path="/dispute/:id" element={<DisputeDetail />} />
          <Route path="/trusticard" element={<TrustiCard />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/payroll/:payrollId" element={<PayrollDetail />} />
          <Route path="/supplier-contract" element={<SupplierContractPage />} />
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
