import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Web3Provider } from './context/Web3Context';
import { ThemeProvider } from './context/ThemeContext';
import LandingNavbar from './components/LandingNavbar';
import Navbar from './components/Navbar';
import Home from './pages/home/Home';
import Features from './pages/features/Features';
import Pricing from './pages/pricing/Pricing';
import Waitlist from './pages/waitlist/Waitlist';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import TwoFactor from './pages/auth/TwoFactor';
import Otp from './pages/auth/Otp';
import Dashboard from './pages/dashboard/Dashboard';
import './App.css';

function AppContent() {
  const location = useLocation();
  
  // Hide navbar on auth pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password' || location.pathname === '/two-factor' || location.pathname === '/otp' || location.pathname === '/dashboard';
  // Use LandingNavbar for landing pages, Navbar for app pages
  const isLandingPage = location.pathname === '/' || location.pathname === '/features' || location.pathname === '/pricing' || location.pathname === '/waitlist';
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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/two-factor" element={<TwoFactor />} />
          <Route path="/otp" element={<Otp />} />
          <Route path="/dashboard" element={<Dashboard />} />
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
        <Router>
          <AppContent />
        </Router>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;
