import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  Zap, 
  HelpCircle,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  TrendingUp,
  Eye,
  FileText,
  Settings,
  Receipt
} from 'lucide-react';
import './Dashboard.css';
import logoWhite from '../../assets/images/logo/logo_white.png';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('24H');
  const [activeEscrowFilter, setActiveEscrowFilter] = useState('All Status');

  // Mock data
  const metrics = [
    {
      id: 1,
      icon: Wallet,
      iconBg: 'linear-gradient(135deg, #4E91FF 0%, #0066ff 100%)',
      value: '$24,567.89',
      subtitle: '≈ 45,234 XRP',
      change: '+12.5%',
      changeType: 'up'
    },
    {
      id: 2,
      icon: Users,
      iconBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      value: '23',
      subtitle: '$156,789 locked',
      change: '+8',
      changeType: 'up'
    },
    {
      id: 3,
      icon: Zap,
      iconBg: 'linear-gradient(135deg, #8B5CF6 0%, #6d28d9 100%)',
      value: '4.2s',
      subtitle: 'XRP Ledger speed',
      change: '-2.1s',
      changeType: 'down'
    },
    {
      id: 4,
      icon: HelpCircle,
      iconBg: 'linear-gradient(135deg, #F59E0B 0%, #d97706 100%)',
      value: '92/100',
      subtitle: 'Excellent rating',
      change: '+5',
      changeType: 'up'
    }
  ];

  const walletBalances = [
    {
      id: 1,
      name: 'XRP',
      code: 'XRP',
      balance: '45,234.56 XRP',
      value: '$24,567.89',
      change: '+2.4%',
      changeType: 'up',
      iconBg: '#0066ff',
      iconUrl: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/xrp.png'
    },
    {
      id: 2,
      name: 'Tether USD',
      code: 'USDT',
      balance: '12,500.00 USDT',
      value: '$12,500.00',
      change: '0.0%',
      changeType: 'neutral',
      iconBg: '#26a17b',
      iconUrl: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/usdt.png'
    },
    {
      id: 3,
      name: 'USD Coin',
      code: 'USDC',
      balance: '8,750.00 USDC',
      value: '$8,750.00',
      change: '+0.1%',
      changeType: 'up',
      iconBg: '#2775ca',
      iconUrl: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/usdc.png'
    }
  ];

  const escrows = [
    {
      id: 1,
      escrowId: '#ESC-2024-001',
      created: 'Created 2 days ago',
      buyer: 'John Smith',
      seller: 'Sarah Wilson',
      amount: '5,000 XRP',
      amountUsd: '≈ $2,715.00',
      status: 'pending',
      statusText: 'Pending Release',
      progress: 75,
      progressText: '75% Complete'
    },
    {
      id: 2,
      escrowId: '#ESC-2024-003',
      created: 'Created 1 week ago',
      buyer: 'Alex Chen',
      seller: 'Lisa Johnson',
      amount: '1,200 XRP',
      amountUsd: '≈ $651.60',
      status: 'completed',
      statusText: 'Completed',
      progress: 100,
      progressText: 'Released'
    },
    {
      id: 3,
      escrowId: '#ESC-2024-004',
      created: 'Created 3 days ago',
      buyer: 'Michael Brown',
      seller: 'Emma Davis',
      amount: '3,000 XRP',
      amountUsd: '≈ $1,629.00',
      status: 'completed',
      statusText: 'Completed',
      progress: 100,
      progressText: 'Released'
    }
  ];

  // Mock chart data
  const chartData = [
    { time: '00:00', value: 22000 },
    { time: '04:00', value: 22500 },
    { time: '08:00', value: 23000 },
    { time: '12:00', value: 23500 },
    { time: '16:00', value: 24500 },
    { time: '20:00', value: 24000 },
    { time: '24:00', value: 24500 }
  ];

  const maxValue = Math.max(...chartData.map(d => d.value));
  const minValue = Math.min(...chartData.map(d => d.value));

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <img src={logoWhite} alt="TrustiChain" className="sidebar-logo" />
          <div className="sidebar-brand">
            <h2 className="sidebar-brand-name">TrustiChain</h2>
            <p className="sidebar-brand-tagline">XRP Ledger Escrow</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="sidebar-nav-item active">
            <LayoutDashboard className="sidebar-nav-icon" size={20} />
            <span>Dashboard</span>
          </Link>
          <div className="sidebar-nav-item" style={{ cursor: 'not-allowed', opacity: 0.5 }}>
            <Receipt className="sidebar-nav-icon" size={20} />
            <span>Transactions</span>
          </div>
          <div className="sidebar-nav-item" style={{ cursor: 'not-allowed', opacity: 0.5 }}>
            <Settings className="sidebar-nav-icon" size={20} />
            <span>Settings</span>
          </div>
        </nav>

        <div className="sidebar-trust-score">
          <div className="trust-score-header">
            <span className="trust-score-label">Trust Score</span>
            <span className="trust-score-value">92/100</span>
          </div>
          <div className="trust-score-bar">
            <div className="trust-score-fill" style={{ width: '92%' }}></div>
          </div>
          <p className="trust-score-text">Excellent reputation</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="header-title">Welcome Back!</h1>
            <p className="header-subtitle">Manage your escrows, wallets, and analytics</p>
          </div>
          <div className="header-right">
            <div className="header-search">
              <Search size={20} className="search-icon" />
              <input type="text" placeholder="Search transactions..." className="search-input" />
            </div>
            <button className="header-notification">
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>
            <div className="header-create-btn" style={{ cursor: 'not-allowed', opacity: 0.5 }}>
              <Plus size={20} />
              Create Escrow
            </div>
          </div>
        </header>

        {/* Key Metrics */}
        <section className="metrics-section">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.id} className="metric-card">
                <div className="metric-header">
                  <div className="metric-icon" style={{ background: metric.iconBg }}>
                    <Icon size={24} />
                  </div>
                  <div className={`metric-change ${metric.changeType}`}>
                    {metric.changeType === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {metric.change}
                  </div>
                </div>
                <div className="metric-value">{metric.value}</div>
                <div className="metric-subtitle">{metric.subtitle}</div>
              </div>
            );
          })}
        </section>

        {/* Portfolio Overview & Wallet Balances */}
        <div className="portfolio-wallet-grid">
          {/* Portfolio Overview */}
          <section className="portfolio-section">
            <div className="section-header">
              <h2 className="section-title">Portfolio Overview</h2>
              <div className="timeframe-tabs">
                <button 
                  className={`timeframe-tab ${activeTab === '24H' ? 'active' : ''}`}
                  onClick={() => setActiveTab('24H')}
                >
                  24H
                </button>
                <button 
                  className={`timeframe-tab ${activeTab === '7D' ? 'active' : ''}`}
                  onClick={() => setActiveTab('7D')}
                >
                  7D
                </button>
                <button 
                  className={`timeframe-tab ${activeTab === '30D' ? 'active' : ''}`}
                  onClick={() => setActiveTab('30D')}
                >
                  30D
                </button>
              </div>
            </div>
            <div className="chart-container">
              <div className="chart-y-axis">
                <span>30k</span>
                <span>20k</span>
                <span>10k</span>
              </div>
              <div className="chart-content">
                <svg className="chart-svg" viewBox="0 0 400 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#4E91FF" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#4E91FF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M 0,${120 - ((chartData[0].value - minValue) / (maxValue - minValue)) * 120} ${chartData.map((point, i) => `L ${(i * 400) / 6},${120 - ((point.value - minValue) / (maxValue - minValue)) * 120}`).join(' ')} L 400,120 L 0,120 Z`}
                    fill="url(#chartGradient)"
                    className="chart-area"
                  />
                  <path
                    d={`M 0,${120 - ((chartData[0].value - minValue) / (maxValue - minValue)) * 120} ${chartData.map((point, i) => `L ${(i * 400) / 6},${120 - ((point.value - minValue) / (maxValue - minValue)) * 120}`).join(' ')}`}
                    stroke="#4E91FF"
                    strokeWidth="2"
                    fill="none"
                    className="chart-line"
                  />
                </svg>
                <div className="chart-x-axis">
                  {chartData.map((point, i) => (
                    <span key={i}>{point.time}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Wallet Balances */}
          <section className="wallet-section">
            <h2 className="section-title">Wallet Balances</h2>
            <div className="wallet-list">
              {walletBalances.map((wallet) => (
                <div key={wallet.id} className="wallet-item">
                  <div className="wallet-icon-large" style={{ backgroundColor: wallet.iconBg }}>
                    <img src={wallet.iconUrl} alt={wallet.code} className="wallet-icon-img" />
                  </div>
                  <div className="wallet-info">
                    <div className="wallet-name">{wallet.name}</div>
                    <div className="wallet-balance">{wallet.balance}</div>
                  </div>
                  <div className="wallet-value">
                    <div className="wallet-amount">{wallet.value}</div>
                    {wallet.changeType !== 'neutral' && (
                      <div className={`wallet-change ${wallet.changeType}`}>
                        {wallet.change}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="wallet-actions">
              <button className="wallet-btn wallet-btn-primary">
                Add Funds
              </button>
              <button className="wallet-btn wallet-btn-secondary">
                <Send size={16} />
                Send
              </button>
            </div>
          </section>
        </div>

        {/* Active Escrows */}
        <section className="escrows-section">
          <div className="section-header">
            <h2 className="section-title">Active Escrows</h2>
            <div className="escrows-controls">
              <div className="filter-dropdown">
                <button className="filter-btn">
                  {activeEscrowFilter}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="new-escrow-btn" style={{ cursor: 'not-allowed', opacity: 0.5 }}>
                <Plus size={16} />
                New Escrow
              </div>
            </div>
          </div>
          <div className="escrows-table-container">
            <table className="escrows-table">
              <thead>
                <tr>
                  <th>ESCROW ID</th>
                  <th>PARTIES</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>PROGRESS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {escrows.map((escrow) => (
                  <tr key={escrow.id}>
                    <td>
                      <div className="escrow-id-cell">
                        <div className="escrow-id">{escrow.escrowId}</div>
                        <div className="escrow-created">{escrow.created}</div>
                      </div>
                    </td>
                    <td>
                      <div className="escrow-parties">
                        <div className="party-avatar"></div>
                        <div className="party-names">
                          {escrow.buyer} → {escrow.seller}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="escrow-amount">
                        <div className="amount-crypto">{escrow.amount}</div>
                        <div className="amount-usd">{escrow.amountUsd}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${escrow.status}`}>
                        {escrow.statusText}
                      </span>
                    </td>
                    <td>
                      <div className="progress-cell">
                        {escrow.status === 'completed' ? (
                          <span className="progress-complete">{escrow.progressText}</span>
                        ) : (
                          <div className="progress-bar-container">
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${escrow.progress}%` }}></div>
                            </div>
                            <span className="progress-text">{escrow.progressText}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="actions-cell">
                        {escrow.status === 'pending' && (
                          <>
                            <button className="action-btn action-success">Release</button>
                            <button className="action-btn action-view">View</button>
                          </>
                        )}
                        {escrow.status === 'completed' && (
                          <>
                            <button className="action-btn action-view">
                              <FileText size={16} />
                              Receipt
                            </button>
                            <button className="action-btn action-view">
                              <Eye size={16} />
                              Review
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;

