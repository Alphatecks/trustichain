import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Layers,
  Users,
  CheckCircle,
  ChevronDown,
  Plus,
  Calendar,
  MoreVertical,
  TrendingUp,
  X,
  CreditCard,
  FileText,
  ArrowRight,
  ArrowLeft,
  Download,
  Clock,
  Coins
} from 'lucide-react';
import MyEscrowLayout from './MyEscrowLayout';
import { getApiUrl } from '../../utils/config';
import toast from 'react-hot-toast';
import './MyEscrow.css';

const MyEscrow = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedMonth] = useState('This month');
  const [showCreateEscrowModal, setShowCreateEscrowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEscrowType, setSelectedEscrowType] = useState('Freelancing');
  const [formData, setFormData] = useState({
    payerWallet: '',
    payerEmail: '',
    payerName: '',
    payerPhone: '',
    counterpartyWallet: '',
    counterpartyEmail: '',
    counterpartyName: '',
    counterpartyPhone: ''
  });

  const [termsData, setTermsData] = useState({
    releaseType: 'Manual Release',
    expectedCompletionDate: '',
    expectedReleaseDate: '',
    disputeResolutionPeriod: '',
    totalAmount: '',
    releaseConditions: '',
    milestoneDetails: '',
    milestoneAmount: '',
    milestones: []
  });

  const categories = ['All', 'Freelance', 'Product purchase', 'Real estate', 'Custom'];
  
  const [totalEscrowedAmount, setTotalEscrowedAmount] = useState(null);
  const [lockedAmount, setLockedAmount] = useState(null);
  const [activeEscrowCount, setActiveEscrowCount] = useState(null);
  const [totalEscrowCount, setTotalEscrowCount] = useState(null);
  const [completedEscrowCount, setCompletedEscrowCount] = useState(null);
  const [isLoadingEscrowMetrics, setIsLoadingEscrowMetrics] = useState(true);
  const [isLoadingCompletedEscrow, setIsLoadingCompletedEscrow] = useState(true);
  
  // Table state
  const [escrows, setEscrows] = useState([]);
  const [isLoadingEscrows, setIsLoadingEscrows] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [industries, setIndustries] = useState([]);
  const [isLoadingIndustries, setIsLoadingIndustries] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEscrowsCount, setTotalEscrowsCount] = useState(0);
  const limit = 20;
  const [openActionMenu, setOpenActionMenu] = useState(null); // Track which escrow's menu is open

  // Fetch escrow metrics from API
  useEffect(() => {
    const fetchEscrowMetrics = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found for escrow metrics');
          setIsLoadingEscrowMetrics(false);
          return;
        }

        const apiUrl = getApiUrl('api/escrow/list?limit=1000&offset=0');
        console.log('Fetching escrows for metrics from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Escrows metrics API response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('Escrows metrics API response data:', result);

          if (result?.success && result?.data) {
            // Check for totalEscrowed in API response
            if (result.data.totalEscrowed !== undefined && result.data.totalEscrowed !== null) {
              setTotalEscrowedAmount(result.data.totalEscrowed);
            } else if (result.data.totalEscrowedAmount !== undefined && result.data.totalEscrowedAmount !== null) {
              setTotalEscrowedAmount(result.data.totalEscrowedAmount);
            } else if (Array.isArray(result.data.escrows) && result.data.escrows.length > 0) {
              // Calculate total from escrows array
              const total = result.data.escrows.reduce((sum, escrow) => {
                const amount = escrow.amount?.usd || 
                              escrow.amount?.USD || 
                              escrow.amount?.xrp || 
                              escrow.amount?.XRP ||
                              escrow.totalAmount || 
                              escrow.usdAmount || 
                              (typeof escrow.amount === 'number' ? escrow.amount : null) ||
                              0;
                return sum + (typeof amount === 'number' ? amount : parseFloat(amount) || 0);
              }, 0);
              setTotalEscrowedAmount(total);
            } else {
              setTotalEscrowedAmount(0);
            }

            // Calculate active escrow count and locked amount (escrows with status 'pending' or 'active')
            if (Array.isArray(result.data.escrows) && result.data.escrows.length > 0) {
              // Count total escrows
              setTotalEscrowCount(result.data.escrows.length);
              
              // Filter and count active escrows (pending, active, pending release)
              const activeEscrows = result.data.escrows.filter(escrow => {
                const status = (escrow.status || '').toLowerCase();
                return status === 'pending' || status === 'active' || status === 'pending release';
              });
              
              setActiveEscrowCount(activeEscrows.length);
              
              // Calculate locked amount from active escrows
              const locked = activeEscrows.reduce((sum, escrow) => {
                const amount = escrow.amount?.usd || 
                              escrow.amount?.USD || 
                              escrow.amount?.xrp || 
                              escrow.amount?.XRP ||
                              escrow.totalAmount || 
                              escrow.usdAmount || 
                              (typeof escrow.amount === 'number' ? escrow.amount : null) ||
                              0;
                return sum + (typeof amount === 'number' ? amount : parseFloat(amount) || 0);
              }, 0);
              setLockedAmount(locked);
            } else {
              setActiveEscrowCount(0);
              setTotalEscrowCount(0);
              setLockedAmount(0);
            }
          } else {
            console.warn('Unexpected escrows response shape. Expected success and data.', result);
            setTotalEscrowedAmount(0);
            setLockedAmount(0);
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error('Escrows metrics API error response:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          setTotalEscrowedAmount(0);
          setLockedAmount(0);
        }
      } catch (error) {
        console.error('Error fetching escrow metrics:', error);
        setTotalEscrowedAmount(0);
        setLockedAmount(0);
      } finally {
        setIsLoadingEscrowMetrics(false);
      }
    };

    fetchEscrowMetrics();
  }, []);

  // Fetch completed escrow count from API
  useEffect(() => {
    const fetchCompletedEscrow = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found for completed escrow');
          setIsLoadingCompletedEscrow(false);
          return;
        }

        const apiUrl = getApiUrl('api/escrow/completed/month');
        console.log('Fetching completed escrow from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Completed escrow API response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('Completed escrow API response data:', result);

          if (result?.success && result?.data) {
            // Check if the response has a count field or an array of completed escrows
            if (result.data.count !== undefined && result.data.count !== null) {
              setCompletedEscrowCount(result.data.count);
            } else if (Array.isArray(result.data)) {
              setCompletedEscrowCount(result.data.length);
            } else if (Array.isArray(result.data.completedEscrows)) {
              setCompletedEscrowCount(result.data.completedEscrows.length);
            } else if (Array.isArray(result.data.escrows)) {
              setCompletedEscrowCount(result.data.escrows.length);
            } else {
              console.warn('Unexpected completed escrow response structure:', result);
              setCompletedEscrowCount(0);
            }
          } else {
            console.warn('Unexpected completed escrow response shape. Expected success and data.', result);
            setCompletedEscrowCount(0);
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error('Completed escrow API error response:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          setCompletedEscrowCount(0);
        }
      } catch (error) {
        console.error('Error fetching completed escrow:', error);
        setCompletedEscrowCount(0);
      } finally {
        setIsLoadingCompletedEscrow(false);
      }
    };

    fetchCompletedEscrow();
  }, []);

  // Map category to transactionType
  const getTransactionType = (category) => {
    const mapping = {
      'All': null,
      'Freelance': 'freelance',
      'Product purchase': 'product_purchase',
      'Real estate': 'real_estate',
      'Custom': 'custom'
    };
    return mapping[category] || null;
  };

  // Fetch industries based on transaction type
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return;
        }

        const transactionType = getTransactionType(activeCategory);
        if (!transactionType) {
          setIndustries([]);
          return;
        }

        setIsLoadingIndustries(true);
        const apiUrl = getApiUrl(`api/escrow/industries?transactionType=${transactionType}`);
        console.log('Fetching industries from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Industries API response data:', result);

          if (result?.success && result?.data) {
            // Handle different response structures
            if (Array.isArray(result.data)) {
              setIndustries(result.data);
            } else if (Array.isArray(result.data.industries)) {
              setIndustries(result.data.industries);
            } else {
              setIndustries([]);
            }
          } else {
            setIndustries([]);
          }
        } else {
          console.error('Industries API error:', response.status);
          setIndustries([]);
        }
      } catch (error) {
        console.error('Error fetching industries:', error);
        setIndustries([]);
      } finally {
        setIsLoadingIndustries(false);
      }
    };

    fetchIndustries();
    setSelectedIndustry(null); // Reset industry when category changes
  }, [activeCategory]);

  // Fetch filtered escrow list
  useEffect(() => {
    const fetchEscrows = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoadingEscrows(false);
          return;
        }

        setIsLoadingEscrows(true);
        const transactionType = getTransactionType(activeCategory);
        const offset = (currentPage - 1) * limit;
        
        // Build query parameters
        const params = new URLSearchParams();
        if (transactionType) {
          params.append('transactionType', transactionType);
        }
        if (selectedIndustry) {
          params.append('industry', selectedIndustry);
        }
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());

        const apiUrl = getApiUrl(`api/escrow/list?${params.toString()}`);
        console.log('Fetching escrows from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Escrows list API response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('Escrows list API response data:', result);

          if (result?.success && result?.data) {
            // Handle different response structures
            if (Array.isArray(result.data.escrows)) {
              setEscrows(result.data.escrows);
              // Calculate total pages from total count
              const total = result.data.total || result.data.count || result.data.escrows.length;
              setTotalEscrowsCount(total);
              setTotalPages(Math.ceil(total / limit));
            } else if (Array.isArray(result.data)) {
              setEscrows(result.data);
              setTotalEscrowsCount(result.data.length);
              setTotalPages(Math.ceil(result.data.length / limit));
            } else {
              setEscrows([]);
              setTotalEscrowsCount(0);
              setTotalPages(1);
            }
          } else {
            setEscrows([]);
            setTotalEscrowsCount(0);
            setTotalPages(1);
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error('Escrows list API error response:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          setEscrows([]);
          setTotalEscrowsCount(0);
          setTotalPages(1);
        }
      } catch (error) {
        console.error('Error fetching escrows:', error);
        setEscrows([]);
        setTotalEscrowsCount(0);
        setTotalPages(1);
      } finally {
        setIsLoadingEscrows(false);
      }
    };

    fetchEscrows();
  }, [activeCategory, selectedIndustry, currentPage, limit]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, selectedIndustry]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showIndustryDropdown && !event.target.closest('.industry-dropdown')) {
        setShowIndustryDropdown(false);
      }
      if (openActionMenu && !event.target.closest('.escrow-action')) {
        setOpenActionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIndustryDropdown, openActionMenu]);

  // Handle release escrow
  const handleReleaseEscrow = async (escrowId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const apiUrl = getApiUrl(`api/escrow/${escrowId}/release`);
      console.log('Releasing escrow:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: '' }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.success) {
          toast.success('Escrow released successfully');
          // Refresh escrow list
          const fetchEscrows = async () => {
            const transactionType = getTransactionType(activeCategory);
            const offset = (currentPage - 1) * limit;
            const params = new URLSearchParams();
            if (transactionType) params.append('transactionType', transactionType);
            if (selectedIndustry) params.append('industry', selectedIndustry);
            params.append('limit', limit.toString());
            params.append('offset', offset.toString());
            const url = getApiUrl(`api/escrow/list?${params.toString()}`);
            const res = await fetch(url, {
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (res.ok) {
              const data = await res.json();
              if (data?.success && data?.data) {
                if (Array.isArray(data.data.escrows)) {
                  setEscrows(data.data.escrows);
                  const total = data.data.total || data.data.count || data.data.escrows.length;
                  setTotalEscrowsCount(total);
                  setTotalPages(Math.ceil(total / limit));
                }
              }
            }
          };
          fetchEscrows();
        } else {
          toast.error(result?.message || 'Failed to release escrow');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        toast.error(errorData?.message || 'Failed to release escrow');
      }
    } catch (error) {
      console.error('Error releasing escrow:', error);
      toast.error('An error occurred while releasing escrow');
    }
  };

  // Handle cancel escrow
  const handleCancelEscrow = async (escrowId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const apiUrl = getApiUrl(`api/escrow/${escrowId}/cancel`);
      console.log('Cancelling escrow:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: '' }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.success) {
          toast.success('Escrow cancelled successfully');
          // Refresh escrow list
          const fetchEscrows = async () => {
            const transactionType = getTransactionType(activeCategory);
            const offset = (currentPage - 1) * limit;
            const params = new URLSearchParams();
            if (transactionType) params.append('transactionType', transactionType);
            if (selectedIndustry) params.append('industry', selectedIndustry);
            params.append('limit', limit.toString());
            params.append('offset', offset.toString());
            const url = getApiUrl(`api/escrow/list?${params.toString()}`);
            const res = await fetch(url, {
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (res.ok) {
              const data = await res.json();
              if (data?.success && data?.data) {
                if (Array.isArray(data.data.escrows)) {
                  setEscrows(data.data.escrows);
                  const total = data.data.total || data.data.count || data.data.escrows.length;
                  setTotalEscrowsCount(total);
                  setTotalPages(Math.ceil(total / limit));
                }
              }
            }
          };
          fetchEscrows();
        } else {
          toast.error(result?.message || 'Failed to cancel escrow');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        toast.error(errorData?.message || 'Failed to cancel escrow');
      }
    } catch (error) {
      console.error('Error cancelling escrow:', error);
      toast.error('An error occurred while cancelling escrow');
    }
  };

  // Helper function to refresh escrow list
  const refreshEscrowList = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const transactionType = getTransactionType(activeCategory);
      const offset = (currentPage - 1) * limit;
      const params = new URLSearchParams();
      if (transactionType) params.append('transactionType', transactionType);
      if (selectedIndustry) params.append('industry', selectedIndustry);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const apiUrl = getApiUrl(`api/escrow/list?${params.toString()}`);
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.success && result?.data) {
          if (Array.isArray(result.data.escrows)) {
            setEscrows(result.data.escrows);
            const total = result.data.total || result.data.count || result.data.escrows.length;
            setTotalEscrowsCount(total);
            setTotalPages(Math.ceil(total / limit));
          } else if (Array.isArray(result.data)) {
            setEscrows(result.data);
            setTotalEscrowsCount(result.data.length);
            setTotalPages(Math.ceil(result.data.length / limit));
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing escrow list:', error);
    }
  };

  return (
    <MyEscrowLayout>
      <div className="my-escrow-page">
      {/* Header Section */}
      <div className="escrow-header">
        <div className="escrow-breadcrumb">
          <span className="breadcrumb-item">General</span>
          <span className="breadcrumb-divider">›</span>
          <span className="breadcrumb-item active">My Escrow</span>
        </div>
        <div className="escrow-header-actions">
          <div className="escrow-month-dropdown">
            <span>{selectedMonth}</span>
            <ChevronDown size={16} />
          </div>
          <button type="button" className="create-escrow-btn" onClick={() => setShowCreateEscrowModal(true)}>
            <Plus size={18} />
            Create Escrow
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="escrow-metrics">
        <div className="escrow-metric-card">
          <div className="metric-header-row">
            <div className="metric-icon metric-icon-small">
              <DollarSign size={12} />
            </div>
            <h3 className="metric-label metric-label-small metric-label-blue">Total Escrowed Amount</h3>
          </div>
          <div className="metric-content">
            <div className="metric-value">
              {isLoadingEscrowMetrics 
                ? 'Loading...' 
                : `$${totalEscrowedAmount !== null && totalEscrowedAmount !== undefined
                    ? totalEscrowedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '0.00'}`}
            </div>
            <div className="metric-subtitle">
              ${lockedAmount !== null && lockedAmount !== undefined
                ? lockedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '0.00'} locked
            </div>
          </div>
          <div className="metric-trend positive">
            <TrendingUp size={14} />
            <span>+3.1%</span>
          </div>
        </div>

        <div className="escrow-metric-card">
          <div className="metric-header-row">
            <div className="metric-icon metric-icon-small">
              <Layers size={12} />
            </div>
            <h3 className="metric-label metric-label-small metric-label-blue">Total Escrow</h3>
          </div>
          <div className="metric-content">
            <div className="metric-value">
              {isLoadingEscrowMetrics 
                ? 'Loading...' 
                : (totalEscrowCount !== null && totalEscrowCount !== undefined ? totalEscrowCount : 0)}
            </div>
            <div className="metric-subtitle">This month</div>
          </div>
          <div className="metric-trend positive">
            <TrendingUp size={14} />
            <span>+3.1%</span>
          </div>
        </div>

        <div className="escrow-metric-card">
          <div className="metric-header-row">
            <div className="metric-icon metric-icon-small">
              <Users size={12} />
            </div>
            <h3 className="metric-label metric-label-small metric-label-blue">Active Escrow</h3>
          </div>
          <div className="metric-content">
            <div className="metric-value">
              {isLoadingEscrowMetrics 
                ? 'Loading...' 
                : (activeEscrowCount !== null && activeEscrowCount !== undefined ? activeEscrowCount : 0)}
            </div>
            <div className="metric-subtitle">This month</div>
          </div>
        </div>

        <div className="escrow-metric-card">
          <div className="metric-header-row">
            <div className="metric-icon metric-icon-small">
              <CheckCircle size={12} />
            </div>
            <h3 className="metric-label metric-label-small metric-label-blue">Completed Escrow</h3>
          </div>
          <div className="metric-content">
            <div className="metric-value">
              {isLoadingCompletedEscrow 
                ? 'Loading...' 
                : (completedEscrowCount !== null && completedEscrowCount !== undefined ? completedEscrowCount : 0)}
            </div>
            <div className="metric-subtitle">This month</div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="escrow-filters">
        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`category-filter-btn ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="secondary-filters">
          <div 
            className="industry-dropdown" 
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
          >
            <span>{selectedIndustry || 'All industries'}</span>
            <ChevronDown size={16} />
            {showIndustryDropdown && (
              <div 
                className="industry-dropdown-menu"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'var(--card-bg, #fff)',
                  border: '1px solid var(--border-color, #e0e0e0)',
                  borderRadius: '8px',
                  marginTop: '4px',
                  zIndex: 1000,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color, #e0e0e0)'
                  }}
                  onClick={() => {
                    setSelectedIndustry(null);
                    setShowIndustryDropdown(false);
                  }}
                >
                  All industries
                </div>
                {isLoadingIndustries ? (
                  <div style={{ padding: '8px 12px', textAlign: 'center' }}>Loading...</div>
                ) : industries.length > 0 ? (
                  industries.map((industry, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: idx < industries.length - 1 ? '1px solid var(--border-color, #e0e0e0)' : 'none'
                      }}
                      onClick={() => {
                        setSelectedIndustry(industry);
                        setShowIndustryDropdown(false);
                      }}
                    >
                      {industry}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-muted, #666)' }}>
                    No industries available
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="date-filter">
            <span>November</span>
            <Calendar size={16} />
          </div>
        </div>
      </div>

      {/* Escrow Table */}
      <div className="escrow-table-container">
        <table className="escrow-data-table">
          <thead>
            <tr>
              <th>Escrow ID</th>
              <th>Parties</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingEscrows && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  Loading escrows...
                </td>
              </tr>
            )}
            {!isLoadingEscrows && escrows.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  No escrows found
                </td>
              </tr>
            )}
            {!isLoadingEscrows && escrows.length > 0 && escrows.map((escrow, index) => {
              // Format escrow ID
              const escrowId = escrow.id || escrow.xrplEscrowId || '';
              const formattedId = escrowId ? `#${escrowId.substring(0, 8).toUpperCase()}` : '#ESC-N/A';
              
              // Get parties
              const counterpartyName = escrow.counterpartyName || escrow.counterparty?.name || 'Unknown';
              const userFullName = escrow.userName || escrow.user?.name || 'You';
              
              // Format amounts
              const xrpAmount = escrow.amount?.xrp 
                ? Number(escrow.amount.xrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
                : '0.00';
              const usdAmount = escrow.amount?.usd 
                ? Number(escrow.amount.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '0.00';
              
              // Get status
              const status = escrow.status || 'Unknown';
              const statusLower = status.toLowerCase();
              
              // Calculate progress (from milestones or default)
              const progress = escrow.progress || escrow.milestoneProgress || 0;
              
              // Format created date
              const createdDate = escrow.createdAt || escrow.created || '';
              const formattedDate = createdDate 
                ? new Date(createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : 'N/A';
              
              // Determine action button text and availability
              const canRelease = statusLower === 'pending' || statusLower === 'active' || statusLower === 'pending release';
              const actionText = canRelease ? 'Release' : statusLower === 'completed' ? 'Completed' : 'View';
              
              return (
                <tr key={escrow.id || escrow.xrplEscrowId || index}>
                  <td className="escrow-id">{formattedId}</td>
                  <td className="escrow-parties" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <span className="party-from" style={{ color: 'var(--blue-600)', fontWeight: 500 }}>{counterpartyName}</span>
                    <span className="party-arrow" style={{ color: 'var(--text-muted)' }}>›</span>
                    <span className="party-to" style={{ color: 'var(--blue-600)', fontWeight: 500 }}>{userFullName}</span>
                  </td>
                  <td className="escrow-amount">
                    <span className="amount-single-line">
                      <span className="amount-crypto">{xrpAmount} XRP</span>
                      <span className="amount-separator"> </span>
                      <span className="amount-usd">≈ ${usdAmount}</span>
                    </span>
                  </td>
                  <td>
                    <button type="button" className={`status-btn ${statusLower}`}>
                      {status}
                    </button>
                  </td>
                  <td className="escrow-progress">
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="progress-text">{progress}%</span>
                  </td>
                  <td className="escrow-created">{formattedDate}</td>
                  <td className="escrow-action" style={{ position: 'relative' }}>
                    {canRelease && (
                      <button 
                        type="button" 
                        className="release-btn"
                        onClick={() => handleReleaseEscrow(escrowId)}
                      >
                        {actionText}
                      </button>
                    )}
                    <button 
                      type="button" 
                      className="action-menu-btn"
                      onClick={() => setOpenActionMenu(openActionMenu === escrowId ? null : escrowId)}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {openActionMenu === escrowId && (
                      <div 
                        className="action-menu-dropdown"
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          backgroundColor: 'var(--card-bg, #fff)',
                          border: '1px solid var(--border-color, #e0e0e0)',
                          borderRadius: '8px',
                          marginTop: '4px',
                          zIndex: 1000,
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          minWidth: '120px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border-color, #e0e0e0)'
                          }}
                          onClick={() => {
                            handleCancelEscrow(escrowId);
                            setOpenActionMenu(null);
                          }}
                        >
                          Cancel
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-controls" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '20px',
          padding: '20px 0'
        }}>
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--border-color, #e0e0e0)',
              borderRadius: '6px',
              backgroundColor: currentPage === 1 ? 'var(--bg-muted, #f5f5f5)' : 'var(--card-bg, #fff)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              color: currentPage === 1 ? 'var(--text-muted, #999)' : 'var(--text-primary, #333)'
            }}
          >
            Previous
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--border-color, #e0e0e0)',
                  borderRadius: '6px',
                  backgroundColor: currentPage === pageNum ? 'var(--blue-600, #2563eb)' : 'var(--card-bg, #fff)',
                  color: currentPage === pageNum ? '#fff' : 'var(--text-primary, #333)',
                  cursor: 'pointer',
                  minWidth: '40px'
                }}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--border-color, #e0e0e0)',
              borderRadius: '6px',
              backgroundColor: currentPage === totalPages ? 'var(--bg-muted, #f5f5f5)' : 'var(--card-bg, #fff)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              color: currentPage === totalPages ? 'var(--text-muted, #999)' : 'var(--text-primary, #333)'
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Create Escrow Modal */}
      {showCreateEscrowModal && (
        <div className="create-escrow-modal-overlay" onClick={() => setShowCreateEscrowModal(false)}>
          <div className="create-escrow-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header - NO border-bottom */}
            <div className="create-escrow-modal-header">
              <h2>Create Escrow</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowCreateEscrowModal(false)}>
                <X size={24} />
              </button>
            </div>

            {/* Step Indicator with vertical divider */}
            <div className="create-escrow-steps">
              <div className={`step-indicator ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
                <div className="step-icon">
                  {currentStep > 1 ? <CheckCircle size={20} /> : <CreditCard size={20} />}
                </div>
                <div className="step-content">
                  <span className="step-number">Step 1/3</span>
                  <span className="step-title">Type/ Counterparty</span>
                </div>
              </div>
              <div className="step-divider"></div>
              <div className={`step-indicator ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
                <div className="step-icon">
                  {currentStep > 2 ? <CheckCircle size={20} /> : <FileText size={20} />}
                </div>
                <div className="step-content">
                  <span className="step-number">Step 2/3</span>
                  <span className="step-title">Terms</span>
                </div>
              </div>
              <div className="step-divider"></div>
              <div className={`step-indicator ${currentStep === 3 ? 'active' : ''}`}>
                <div className="step-icon">
                  <CheckCircle size={20} />
                </div>
                <div className="step-content">
                  <span className="step-number">Step 3/3</span>
                  <span className="step-title">Confirmation</span>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="create-escrow-modal-content">
              {currentStep === 1 && (
                <>
                  {/* Escrow Type Section - Horizontal buttons */}
                  <div className="escrow-form-section">
                    <h3 className="section-title">Escrow Type</h3>
                    <div className="escrow-type-buttons">
                      <button
                        type="button"
                        className={`escrow-type-btn ${selectedEscrowType === 'Freelancing' ? 'active' : ''}`}
                        onClick={() => setSelectedEscrowType('Freelancing')}
                      >
                        {selectedEscrowType === 'Freelancing' && <CheckCircle size={18} />}
                        {selectedEscrowType !== 'Freelancing' && <Plus size={18} />}
                        Freelancing
                      </button>
                      <button
                        type="button"
                        className={`escrow-type-btn ${selectedEscrowType === 'Real Estate' ? 'active' : ''}`}
                        onClick={() => setSelectedEscrowType('Real Estate')}
                      >
                        {selectedEscrowType === 'Real Estate' ? <CheckCircle size={18} /> : <Plus size={18} />}
                        Real Estate
                      </button>
                      <button
                        type="button"
                        className={`escrow-type-btn ${selectedEscrowType === 'Product purchase' ? 'active' : ''}`}
                        onClick={() => setSelectedEscrowType('Product purchase')}
                      >
                        {selectedEscrowType === 'Product purchase' ? <CheckCircle size={18} /> : <Plus size={18} />}
                        Product purchase
                      </button>
                      <button
                        type="button"
                        className={`escrow-type-btn ${selectedEscrowType === 'Custom' ? 'active' : ''}`}
                        onClick={() => setSelectedEscrowType('Custom')}
                      >
                        {selectedEscrowType === 'Custom' ? <CheckCircle size={18} /> : <Plus size={18} />}
                        Custom
                      </button>
                    </div>
                  </div>

                  {/* Escrow Counterparty Section */}
                  <div className="escrow-form-section">
                    <h3 className="section-title">Escrow Counterparty</h3>
                    <div className="counterparty-form-grid">
                      {/* Left Column - Payer's Information */}
                      <div className="form-column">
                        <div className="form-group">
                          <label>Payers (You) XRP Wallet Address <span className="required">*</span></label>
                          <input
                            type="text"
                            placeholder="••••••••••••••••"
                            value={formData.payerWallet}
                            onChange={(e) => setFormData({ ...formData, payerWallet: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Your Email</label>
                          <input
                            type="email"
                            placeholder="Enter your Email"
                            value={formData.payerEmail}
                            onChange={(e) => setFormData({ ...formData, payerEmail: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Counterparty XRP Wallet Address <span className="required">*</span></label>
                          <input
                            type="text"
                            placeholder="••••••••••••••••"
                            value={formData.counterpartyWallet}
                            onChange={(e) => setFormData({ ...formData, counterpartyWallet: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Email</label>
                          <input
                            type="email"
                            placeholder="Enter your Email"
                            value={formData.counterpartyEmail}
                            onChange={(e) => setFormData({ ...formData, counterpartyEmail: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Right Column - Names and Phone Numbers */}
                      <div className="form-column">
                        <div className="form-group">
                          <label>Your Name</label>
                          <input
                            type="text"
                            placeholder="Enter your name"
                            value={formData.payerName}
                            onChange={(e) => setFormData({ ...formData, payerName: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Your Phone Number</label>
                          <input
                            type="tel"
                            placeholder="Enter your Number"
                            value={formData.payerPhone}
                            onChange={(e) => setFormData({ ...formData, payerPhone: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Name</label>
                          <input
                            type="text"
                            placeholder="Enter your name"
                            value={formData.counterpartyName}
                            onChange={(e) => setFormData({ ...formData, counterpartyName: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Phone Number</label>
                          <input
                            type="tel"
                            placeholder="Enter your Number"
                            value={formData.counterpartyPhone}
                            onChange={(e) => setFormData({ ...formData, counterpartyPhone: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  {/* Escrow Terms Section */}
                  <div className="escrow-form-section">
                    <h3 className="section-title">Escrow Terms</h3>
                    
                    {/* Release Type Buttons */}
                    <div className="release-type-buttons">
                      <button
                        type="button"
                        className={`release-type-btn ${termsData.releaseType === 'Manual Release' ? 'active' : ''}`}
                        onClick={() => setTermsData({ ...termsData, releaseType: 'Manual Release' })}
                      >
                        <Download size={18} />
                        Manual Release
                      </button>
                      <button
                        type="button"
                        className={`release-type-btn ${termsData.releaseType === 'Time based' ? 'active' : ''}`}
                        onClick={() => setTermsData({ ...termsData, releaseType: 'Time based' })}
                      >
                        <Clock size={18} />
                        Time based
                      </button>
                      <button
                        type="button"
                        className={`release-type-btn ${termsData.releaseType === 'Milestones' ? 'active' : ''}`}
                        onClick={() => setTermsData({ ...termsData, releaseType: 'Milestones' })}
                      >
                        <Coins size={18} />
                        Milestones
                      </button>
                    </div>

                    {/* Form Fields - Manual Release */}
                    {termsData.releaseType === 'Manual Release' && (
                      <div className="terms-form-grid">
                        <div className="form-group">
                          <label>Expected Completion Date</label>
                          <div className="date-input-wrapper">
                            <input
                              type="text"
                              placeholder="Add Date"
                              value={termsData.expectedCompletionDate}
                              onChange={(e) => setTermsData({ ...termsData, expectedCompletionDate: e.target.value })}
                            />
                            <Calendar size={18} className="input-icon" />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Dispute Resolution Period</label>
                          <div className="select-input-wrapper">
                            <select
                              value={termsData.disputeResolutionPeriod}
                              onChange={(e) => setTermsData({ ...termsData, disputeResolutionPeriod: e.target.value })}
                            >
                              <option value="">Select</option>
                              <option value="7">7 days</option>
                              <option value="14">14 days</option>
                              <option value="30">30 days</option>
                            </select>
                            <ChevronDown size={16} className="input-icon" />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Total Amount</label>
                          <input
                            type="text"
                            placeholder="Enter amount"
                            value={termsData.totalAmount}
                            onChange={(e) => setTermsData({ ...termsData, totalAmount: e.target.value })}
                          />
                        </div>

                        <div className="form-group form-group-full">
                          <label>Release Conditions</label>
                          <textarea
                            placeholder="Enter details"
                            value={termsData.releaseConditions}
                            onChange={(e) => setTermsData({ ...termsData, releaseConditions: e.target.value })}
                            rows={4}
                          ></textarea>
                        </div>
                      </div>
                    )}

                    {/* Form Fields - Time based */}
                    {termsData.releaseType === 'Time based' && (
                      <div className="terms-form-grid">
                        <div className="form-group">
                          <label>Expected Completion Date</label>
                          <div className="date-input-wrapper">
                            <input
                              type="text"
                              placeholder="Add Date"
                              value={termsData.expectedCompletionDate}
                              onChange={(e) => setTermsData({ ...termsData, expectedCompletionDate: e.target.value })}
                            />
                            <Calendar size={18} className="input-icon" />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Dispute Resolution Period</label>
                          <div className="select-input-wrapper">
                            <select
                              value={termsData.disputeResolutionPeriod}
                              onChange={(e) => setTermsData({ ...termsData, disputeResolutionPeriod: e.target.value })}
                            >
                              <option value="">Select</option>
                              <option value="7">7 days</option>
                              <option value="14">14 days</option>
                              <option value="30">30 days</option>
                            </select>
                            <ChevronDown size={16} className="input-icon" />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Expected Release Date</label>
                          <div className="date-input-wrapper">
                            <input
                              type="text"
                              placeholder="Add Date"
                              value={termsData.expectedReleaseDate}
                              onChange={(e) => setTermsData({ ...termsData, expectedReleaseDate: e.target.value })}
                            />
                            <Calendar size={18} className="input-icon" />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Total Amount</label>
                          <input
                            type="text"
                            placeholder="Add amount"
                            value={termsData.totalAmount}
                            onChange={(e) => setTermsData({ ...termsData, totalAmount: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label>Release Conditions</label>
                          <textarea
                            placeholder="Enter details"
                            value={termsData.releaseConditions}
                            onChange={(e) => setTermsData({ ...termsData, releaseConditions: e.target.value })}
                            rows={4}
                          ></textarea>
                        </div>
                      </div>
                    )}

                    {/* Form Fields - Milestones */}
                    {termsData.releaseType === 'Milestones' && (
                      <div className="terms-form-grid">
                        <div className="form-group">
                          <label>Total Amount</label>
                          <input
                            type="text"
                            placeholder="Enter amount"
                            value={termsData.totalAmount}
                            onChange={(e) => setTermsData({ ...termsData, totalAmount: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label>Milestone amount</label>
                          <input
                            type="text"
                            placeholder="Enter amount"
                            value={termsData.milestoneAmount}
                            onChange={(e) => setTermsData({ ...termsData, milestoneAmount: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label>Milestone details</label>
                          <div className="date-input-wrapper">
                            <input
                              type="text"
                              placeholder="Add Date"
                              value={termsData.milestoneDetails}
                              onChange={(e) => setTermsData({ ...termsData, milestoneDetails: e.target.value })}
                            />
                            <Calendar size={18} className="input-icon" />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Dispute Resolution Period</label>
                          <div className="select-input-wrapper">
                            <select
                              value={termsData.disputeResolutionPeriod}
                              onChange={(e) => setTermsData({ ...termsData, disputeResolutionPeriod: e.target.value })}
                            >
                              <option value="">select</option>
                              <option value="7">7 days</option>
                              <option value="14">14 days</option>
                              <option value="30">30 days</option>
                            </select>
                            <ChevronDown size={16} className="input-icon" />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Expected Completion Date</label>
                          <div className="date-input-wrapper">
                            <input
                              type="text"
                              placeholder="Add Date"
                              value={termsData.expectedCompletionDate}
                              onChange={(e) => setTermsData({ ...termsData, expectedCompletionDate: e.target.value })}
                            />
                            <Calendar size={18} className="input-icon" />
                          </div>
                        </div>

                        <div className="form-group">
                          <button
                            type="button"
                            className="add-milestone-btn"
                            onClick={() => {
                              if (termsData.milestoneDetails && termsData.milestoneAmount) {
                                const newMilestone = {
                                  details: termsData.milestoneDetails,
                                  amount: termsData.milestoneAmount
                                };
                                setTermsData({
                                  ...termsData,
                                  milestones: [...termsData.milestones, newMilestone],
                                  milestoneDetails: '',
                                  milestoneAmount: ''
                                });
                              }
                            }}
                          >
                            <Plus size={18} />
                            <span>Add milestone</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  {/* Confirmation Step */}
                  <div className="confirmation-step">
                    {/* Escrow Type & Terms Summary */}
                    <div className="confirmation-summary-section">
                      <div className="confirmation-type-section">
                        <h3 className="confirmation-section-title">Escrow Type</h3>
                        <button className="confirmation-type-btn active" type="button">
                          {selectedEscrowType}
                        </button>
                      </div>

                      <div className="confirmation-type-section">
                        <h3 className="confirmation-section-title">Escrow Terms</h3>
                        <button className="confirmation-type-btn active" type="button">
                          {termsData.releaseType === 'Time based' && <Clock size={18} />}
                          {termsData.releaseType === 'Milestones' && <Coins size={18} />}
                          {termsData.releaseType === 'Manual Release' && <Download size={18} />}
                          <span>{termsData.releaseType}</span>
                        </button>
                      </div>
                    </div>

                    {/* Escrow Counterparty Section */}
                    <div className="confirmation-details-section">
                      <h3 className="confirmation-section-title">Escrow Counterparty</h3>
                      <div className="confirmation-field-group">
                        <label className="confirmation-label">
                          Counterparty XRP Wallet Address <span className="required">*</span>
                        </label>
                        <div className="confirmation-masked-input">
                          {formData.counterpartyXRPWallet ? formData.counterpartyXRPWallet.replace(/./g, '•') : '••••••••••••••'}
                        </div>
                      </div>
                      <div className="confirmation-info-grid">
                        <div className="confirmation-info-item">
                          <span className="confirmation-info-label">Name</span>
                          <span className="confirmation-info-value">{formData.counterpartyName}</span>
                        </div>
                        <div className="confirmation-info-item">
                          <span className="confirmation-info-label">Email</span>
                          <span className="confirmation-info-value">{formData.counterpartyEmail}</span>
                        </div>
                        <div className="confirmation-info-item">
                          <span className="confirmation-info-label">Phone Number</span>
                          <span className="confirmation-info-value">{formData.counterpartyPhone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Escrow Details Section */}
                    <div className="confirmation-details-section">
                      <h3 className="confirmation-section-title">Escrow Details</h3>
                      <div className="confirmation-details-list">
                        <div className="confirmation-detail-item">
                          <span className="confirmation-detail-label">Expected Completion Date</span>
                          <span className="confirmation-detail-value">
                            {termsData.expectedCompletionDate}
                            {termsData.expectedCompletionDate && <Calendar size={16} />}
                          </span>
                        </div>
                        <div className="confirmation-detail-item">
                          <span className="confirmation-detail-label">Dispute Resolution Period</span>
                          <span className="confirmation-detail-value">
                            {termsData.disputeResolutionPeriod ? `${termsData.disputeResolutionPeriod} days` : ''}
                          </span>
                        </div>
                        <div className="confirmation-details-row">
                          <div className="confirmation-detail-item">
                            <span className="confirmation-detail-label">Amount</span>
                            <span className="confirmation-detail-value">
                              {termsData.totalAmount ? `${termsData.totalAmount} XRP ($0.25 USD)` : ''}
                            </span>
                          </div>
                          <div className="confirmation-detail-item">
                            <span className="confirmation-detail-label">Escrow Fee</span>
                            <span className="confirmation-detail-value">
                              {termsData.totalAmount ? `0.5 XRP ($0.25 USD)` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="confirmation-detail-item">
                          <span className="confirmation-detail-label">Total Payment</span>
                          <span className="confirmation-detail-value">
                            {termsData.totalAmount ? `0.5 XRP ($0.25 USD)` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {currentStep === 1 && (
              <div className="create-escrow-modal-footer">
                <button
                  type="button"
                  className="submit-next-btn"
                  onClick={() => setCurrentStep(2)}
                >
                  <div className="submit-btn-icon-circle">
                    <ArrowRight size={16} />
                  </div>
                  <span>Submit and Next</span>
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="create-escrow-modal-footer">
                <button
                  type="button"
                  className="previous-btn"
                  onClick={() => setCurrentStep(1)}
                >
                  <div className="previous-btn-icon-circle">
                    <ArrowLeft size={16} />
                  </div>
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="submit-next-btn"
                  onClick={() => setCurrentStep(3)}
                >
                  <div className="submit-btn-icon-circle">
                    <ArrowRight size={16} />
                  </div>
                  <span>Submit and Next</span>
                </button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="create-escrow-modal-footer">
                <button
                  type="button"
                  className="confirm-btn"
                  onClick={() => {
                    alert('Escrow Created!');
                    setShowCreateEscrowModal(false);
                  }}
                >
                  <CheckCircle size={18} />
                  <span>Confirm</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </MyEscrowLayout>
  );
};

export default MyEscrow;

