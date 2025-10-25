import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Web3Provider } from './context/Web3Context';
import LandingNavbar from './components/LandingNavbar';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Waitlist from './pages/Waitlist';
import CreateEscrow from './pages/CreateEscrow';
import MyEscrows from './pages/MyEscrows';
import EscrowDetails from './pages/EscrowDetails';
import './App.css';

function AppContent() {
  const location = useLocation();
  
  // Use LandingNavbar for landing pages, Navbar for app pages
  const isLandingPage = location.pathname === '/' || location.pathname === '/features' || location.pathname === '/pricing' || location.pathname === '/waitlist';
  const NavbarComponent = isLandingPage ? LandingNavbar : Navbar;

  return (
    <div className="App">
      <NavbarComponent />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/create" element={<CreateEscrow />} />
          <Route path="/my-escrows" element={<MyEscrows />} />
          <Route path="/escrow/:id" element={<EscrowDetails />} />
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
    <Web3Provider>
      <Router>
        <AppContent />
      </Router>
    </Web3Provider>
  );
}

export default App;
