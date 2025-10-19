import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Web3Provider } from './context/Web3Context';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateEscrow from './pages/CreateEscrow';
import MyEscrows from './pages/MyEscrows';
import EscrowDetails from './pages/EscrowDetails';
import './App.css';

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
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
      </Router>
    </Web3Provider>
  );
}

export default App;
