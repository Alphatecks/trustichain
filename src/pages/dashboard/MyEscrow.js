import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Coins,
  Menu,
  Bell,
  LayoutDashboard,
  ShieldCheck,
  Repeat,
  Briefcase,
  Filter,
  AlertTriangle,
  Package,
  Settings,
  HelpCircle,
  Code,
  Box,
  Link,
  LogOut,
  Building2,
  FileCheck
} from 'lucide-react';
import MyEscrowLayout from './MyEscrowLayout';
import { getApiUrl } from '../../utils/config';
import LoadingIndicator from '../../components/LoadingIndicator';
import { useSession } from '../../context/SessionContext';
import toast from 'react-hot-toast';
import logo from '../../assets/images/icons/logo.png';
import verifyBadge from '../../assets/images/icons/verify.png';
import './Dashboard.css';
import './MyEscrow.css';

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: 23 },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: 23 },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'P2P trading', icon: Repeat, badge: null }
];

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { label: 'Payroll', icon: DollarSign, badge: null },
  { label: 'Supplier Contract', icon: Building2, badge: null },
  { label: 'Transaction', icon: Repeat, badge: null },
  { label: 'Teams', icon: Users, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: null }
];

const developersNav = [
  { label: 'Api Keys', icon: Code, badge: null },
  { label: 'Sand box enviroment', icon: Box, badge: null },
  { label: 'Web hook', icon: Link, badge: null }
];

const supportNav = [
  { label: 'Settings', icon: Settings },
  { label: 'Security', icon: ShieldCheck },
  { label: 'Help', icon: HelpCircle }
];

const MyEscrow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
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
    escrowFee: '',
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

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdEscrowData, setCreatedEscrowData] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(null); // XRP to USD rate
  const [isCreatingEscrow, setIsCreatingEscrow] = useState(false);
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('All');
  
  // User profile state for mobile header
  const [userFullName, setUserFullName] = useState('Sarah Chen');
  const [userInitials, setUserInitials] = useState('SC');
  const [userRole, setUserRole] = useState('Freelancer');
  const [userAvatar, setUserAvatar] = useState(null);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
  const [accountType, setAccountType] = useState('Personal');

  // Fetch escrow metrics from API
  useEffect(() => {
    const fetchEscrowMetrics = async () => {
      // If session is expired, use fallback data
      if (isSessionExpired) {
        console.log('Session expired, using fallback escrow metrics');
        setTotalEscrowedAmount(125000.00);
        setLockedAmount(45000.00);
        setActiveEscrowCount(12);
        setTotalEscrowCount(25);
        setIsLoadingEscrowMetrics(false);
        return;
      }

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
  }, [isSessionExpired]);

  // Fetch completed escrow count from API
  useEffect(() => {
    const fetchCompletedEscrow = async () => {
      // If session is expired, use fallback data
      if (isSessionExpired) {
        console.log('Session expired, using fallback completed escrow count');
        setCompletedEscrowCount(8);
        setIsLoadingCompletedEscrow(false);
        return;
      }

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
  }, [isSessionExpired]);

  // Fetch user profile for mobile header
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isSessionExpired) {
        setUserFullName('Sarah Chen');
        setUserInitials('SC');
        setUserRole('Freelancer');
        setIsLoadingUserProfile(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoadingUserProfile(false);
          return;
        }

        const apiUrl = getApiUrl('api/user/profile');
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result?.success && result?.data) {
            const data = result.data;
            const fullName =
              data.fullName ||
              [data.firstName, data.lastName].filter(Boolean).join(' ') ||
              data.name ||
              userFullName;

            if (fullName && typeof fullName === 'string') {
              setUserFullName(fullName);
            }

            const firstName = data.firstName || '';
            const lastName = data.lastName || '';
            let initials = 'SC';
            
            if (firstName && lastName) {
              initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
            } else if (fullName && typeof fullName === 'string') {
              const nameParts = fullName.trim().split(/\s+/);
              if (nameParts.length >= 2) {
                initials = `${nameParts[0].charAt(0).toUpperCase()}${nameParts[nameParts.length - 1].charAt(0).toUpperCase()}`;
              } else if (nameParts.length === 1) {
                initials = nameParts[0].charAt(0).toUpperCase();
              }
            }
            
            setUserInitials(initials);
            setUserRole(data.role || 'Freelancer');
            if (data.avatar) setUserAvatar(data.avatar);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoadingUserProfile(false);
      }
    };

    fetchUserProfile();
  }, [isSessionExpired]);

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

  // Fetch exchange rate for XRP to USD conversion
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return;
        }

        const apiUrl = getApiUrl('api/exchange/rates');
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result?.success && result?.data?.rates) {
            // Find XRP to USD rate
            const xrpRate = result.data.rates.find(rate => 
              (rate.from === 'XRP' && rate.to === 'USD') || 
              (rate.fromCurrency === 'XRP' && rate.toCurrency === 'USD')
            );
            if (xrpRate) {
              setExchangeRate(xrpRate.rate || xrpRate.exchangeRate || 1);
            } else {
              // Fallback to 1 if not found
              setExchangeRate(1);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        // Fallback to 1 if error
        setExchangeRate(1);
      }
    };

    fetchExchangeRate();
  }, []);

  // Fetch industries based on transaction type
  useEffect(() => {
    const fetchIndustries = async () => {
      // If session is expired, use fallback data
      if (isSessionExpired) {
        console.log('Session expired, using fallback industries');
        setIndustries([]);
        setIsLoadingIndustries(false);
        return;
      }

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
      // If session is expired, use fallback data
      if (isSessionExpired) {
        console.log('Session expired, using fallback escrows list');
        setEscrows([]);
        setTotalEscrowsCount(0);
        setTotalPages(1);
        setIsLoadingEscrows(false);
        return;
      }

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
  }, [activeCategory, selectedIndustry, currentPage, limit, isSessionExpired]);

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

  // Map escrow type to industry for API
  const getEscrowTypeMapping = (escrowType) => {
    const mapping = {
      'Freelancing': 'Technology',
      'Real Estate': 'Real Estate',
      'Real estate': 'Real Estate',
      'Product purchase': 'Retail',
      'Custom': 'Other'
    };
    return mapping[escrowType] || 'Other';
  };

  // Helper function to format date to ISO format
  const formatDateToISO = (dateString) => {
    if (!dateString || dateString.trim() === '') return null;
    
    try {
      // Try to parse the date string
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return null;
      }
      // Return ISO format
      return date.toISOString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  };

  // Helper function to format dispute resolution period
  const formatDisputePeriod = (value) => {
    if (!value || value.trim() === '') return null;
    return `${value} days`;
  };

  // Map escrow type to transaction type for API
  const mapEscrowTypeToTransactionType = (escrowType) => {
    const mapping = {
      'Freelancing': 'freelance',
      'Real Estate': 'real_estate',
      'Real estate': 'real_estate',
      'Product purchase': 'product_purchase',
      'Custom': 'custom'
    };
    return mapping[escrowType] || 'custom';
  };

  // Handle create escrow
  const handleCreateEscrow = async () => {
    try {
      setIsCreatingEscrow(true);
      
      // Validate required fields
      if (!formData.payerWallet || !formData.counterpartyWallet) {
        toast.error('Please fill in all required fields');
        setIsCreatingEscrow(false);
        return;
      }

      if (!termsData.totalAmount) {
        toast.error('Please enter the total amount');
        setIsCreatingEscrow(false);
        return;
      }

      // Validate milestones if release type is Milestones
      if (termsData.releaseType === 'Milestones' && (!termsData.milestones || termsData.milestones.length === 0)) {
        toast.error('Please add at least one milestone');
        setIsCreatingEscrow(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        setIsCreatingEscrow(false);
        return;
      }

      // Map escrow type to transaction type and industry
      const transactionType = mapEscrowTypeToTransactionType(selectedEscrowType);
      const industry = getEscrowTypeMapping(selectedEscrowType);

      // Format dates
      const expectedCompletionDateISO = formatDateToISO(termsData.expectedCompletionDate);
      const expectedReleaseDateISO = formatDateToISO(termsData.expectedReleaseDate);

      // Format dispute resolution period
      const disputeResolutionPeriodFormatted = formatDisputePeriod(termsData.disputeResolutionPeriod);

      // Determine description - use milestoneDetails, releaseConditions, or fallback
      const description = termsData.milestoneDetails || 
                         termsData.releaseConditions || 
                         `Escrow for ${selectedEscrowType}`;

      // Build base payload with common fields
      const payload = {
        payerXrpWalletAddress: formData.payerWallet,
        counterpartyXrpWalletAddress: formData.counterpartyWallet,
        amount: parseFloat(termsData.totalAmount),
        currency: 'XRP',
        transactionType: transactionType,
        industry: industry,
        description: description,
        payerEmail: formData.payerEmail || '',
        payerName: formData.payerName || '',
        counterpartyEmail: formData.counterpartyEmail || '',
        counterpartyName: formData.counterpartyName || '',
        releaseType: termsData.releaseType,
        totalAmount: parseFloat(termsData.totalAmount)
      };

      // Add date fields if provided
      if (expectedCompletionDateISO) {
        payload.expectedCompletionDate = expectedCompletionDateISO;
      }

      if (disputeResolutionPeriodFormatted) {
        payload.disputeResolutionPeriod = disputeResolutionPeriodFormatted;
      }

      // Add release type specific fields
      if (termsData.releaseType === 'Time based') {
        if (expectedReleaseDateISO) {
          payload.expectedReleaseDate = expectedReleaseDateISO;
        }
        if (termsData.releaseConditions) {
          payload.releaseConditions = termsData.releaseConditions;
        }
      } else if (termsData.releaseType === 'Manual Release') {
        if (termsData.releaseConditions) {
          payload.releaseConditions = termsData.releaseConditions;
        }
      } else if (termsData.releaseType === 'Milestones') {
        // Format milestones array
        if (termsData.milestones && termsData.milestones.length > 0) {
          payload.milestones = termsData.milestones.map(milestone => ({
            milestoneDetails: milestone.details,
            milestoneAmount: parseFloat(milestone.amount)
          }));
        }
      }

      // Make API call
      const apiUrl = getApiUrl('api/escrow/create');
      console.log('Creating escrow:', apiUrl);
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('API Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('API Response data:', result);
        
        if (result?.success) {
          // Store the created escrow data with amount info
          setCreatedEscrowData({
            ...result.data,
            amount: termsData.totalAmount,
            amountUsd: exchangeRate ? (parseFloat(termsData.totalAmount) * exchangeRate).toFixed(2) : (parseFloat(termsData.totalAmount) * 1).toFixed(2)
          });
          
          // Show success modal
          setShowSuccessModal(true);
          // Close the create escrow modal
          setShowCreateEscrowModal(false);
          // Reset form
          setCurrentStep(1);
          setFormData({
            payerWallet: '',
            payerEmail: '',
            payerName: '',
            payerPhone: '',
            counterpartyWallet: '',
            counterpartyEmail: '',
            counterpartyName: '',
            counterpartyPhone: ''
          });
          setTermsData({
            releaseType: 'Manual Release',
            expectedCompletionDate: '',
            expectedReleaseDate: '',
            disputeResolutionPeriod: '',
            totalAmount: '',
            escrowFee: '',
            releaseConditions: '',
            milestoneDetails: '',
            milestoneAmount: '',
            milestones: []
          });
          
          toast.success('Escrow created successfully!');
        } else {
          toast.error(result?.message || 'Failed to create escrow');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error response:', errorData);
        console.error('Response status:', response.status);
        toast.error(errorData?.message || errorData?.error || 'Failed to create escrow');
      }
    } catch (error) {
      console.error('Error creating escrow:', error);
      toast.error('An error occurred while creating escrow');
    } finally {
      setIsCreatingEscrow(false);
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
      <>
        {/* Mobile View - Only visible on mobile */}
        <div className="mobile-dashboard">
          {/* Mobile Header */}
          <div className="mobile-dashboard-header">
            <div className="mobile-header-left">
              <div className="mobile-user-avatar">
                {userAvatar ? (
                  <img src={userAvatar} alt={userFullName} />
                ) : (
                  userInitials
                )}
              </div>
            <div className="mobile-user-info">
              <span className="mobile-user-name">
                {isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userFullName}
                <img src={verifyBadge} alt="Verified" className="mobile-user-verified-icon" />
              </span>
              <span className="mobile-user-role">
                {isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userRole}
              </span>
            </div>
            </div>
            <div className="mobile-header-right">
              <button type="button" className="mobile-header-bell" onClick={() => setShowNotificationModal(true)}>
                <Bell size={20} />
              </button>
              <button 
                type="button" 
                className="mobile-header-menu"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu size={20} />
              </button>
            </div>
          </div>

          {/* Mobile Sidebar Overlay */}
          {isMobileMenuOpen && (
            <div 
              className="mobile-sidebar-overlay"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Mobile Sidebar Drawer */}
          <div className={`mobile-sidebar-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="mobile-sidebar-header">
              <div className="mobile-sidebar-branding">
                <img src={logo} alt="TrustiChain" className="mobile-sidebar-logo" />
                <div className="mobile-sidebar-branding-text">
                  <span className="mobile-sidebar-title">TrustiChain</span>
                  <span className="mobile-sidebar-tagline">Secure escrow platform</span>
                </div>
              </div>
              <button 
                type="button" 
                className="mobile-sidebar-close"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mobile-sidebar-content">
              <div className="mobile-sidebar-section">
                <p className="mobile-sidebar-section-label">
                  {accountType === 'Business Suite' ? 'Business Suite' : 'General'}
                </p>
                <nav className="mobile-sidebar-nav">
                  {(accountType === 'Business Suite' ? businessSuiteNav : sidebarNav).map((item) => {
                    const Icon = item.icon;
                    const isActive = (item.label === 'Dashboard' && location.pathname === '/dashboard') ||
                                   (item.label === 'My Escrow' && location.pathname === '/my-escrow') ||
                                   (item.label === 'Transactions' && location.pathname === '/transactions') ||
                                   (item.label === 'Dispute' && location.pathname === '/dispute') ||
                                   (item.label === 'Trusticard' && location.pathname === '/trusticard');
                    const handleNavClick = () => {
                      setIsMobileMenuOpen(false);
                      if (item.label === 'Dashboard') {
                        navigate('/dashboard');
                      } else if (item.label === 'My Escrow') {
                        navigate('/my-escrow');
                      } else if (item.label === 'Transactions') {
                        navigate('/transactions');
                      } else if (item.label === 'Dispute') {
                        navigate('/dispute');
                      } else if (item.label === 'Trusticard') {
                        navigate('/trusticard');
                      }
                    };
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className={`mobile-sidebar-nav-item ${isActive ? 'active' : ''}`}
                        onClick={handleNavClick}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                        {item.badge && <span className="mobile-sidebar-badge">{item.badge}</span>}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {accountType === 'Business Suite' && (
                <div className="mobile-sidebar-section">
                  <p className="mobile-sidebar-section-label">Developers Tool</p>
                  <nav className="mobile-sidebar-nav">
                    {developersNav.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button 
                          key={item.label} 
                          type="button" 
                          className="mobile-sidebar-nav-item"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              )}

              <div className="mobile-sidebar-section">
                <p className="mobile-sidebar-section-label">Support</p>
                <nav className="mobile-sidebar-nav">
                  {supportNav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button 
                        key={item.label} 
                        type="button" 
                        className="mobile-sidebar-nav-item"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="mobile-sidebar-bottom">
                <div className="mobile-sidebar-help-card">
                  <div className="mobile-sidebar-help-icon">
                    <HelpCircle size={24} />
                  </div>
                  <h3>Help Center</h3>
                  <p>Having trouble in Trustichain? Please contact us</p>
                  <button type="button" className="mobile-sidebar-help-cta">
                    Contact us
                  </button>
                </div>

                <div className="mobile-sidebar-trustiscore">
                  <span className="mobile-sidebar-trustiscore-label">Trustiscore</span>
                  <span className="mobile-sidebar-trustiscore-badge">850</span>
                </div>

                <button 
                  type="button" 
                  className="mobile-sidebar-logout"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    localStorage.removeItem('token');
                    navigate('/');
                  }}
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Escrow Content - Same content as desktop but styled for mobile */}
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
                ? <LoadingIndicator size="sm" />
                : `$${totalEscrowedAmount !== null && totalEscrowedAmount !== undefined
                    ? totalEscrowedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '0.00'}`}
            </div>
            <div className="metric-subtitle-row">
              <div className="metric-subtitle">
                ${lockedAmount !== null && lockedAmount !== undefined
                  ? lockedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '0.00'} locked
              </div>
              <div className="metric-trend positive">
                <TrendingUp size={14} />
                <span>+3.1%</span>
              </div>
            </div>
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
                ? <LoadingIndicator size="sm" />
                : (totalEscrowCount !== null && totalEscrowCount !== undefined ? totalEscrowCount : 0)}
            </div>
            <div className="metric-subtitle-row">
              <div className="metric-subtitle">This month</div>
              <div className="metric-trend positive">
                <TrendingUp size={14} />
                <span>+3.1%</span>
              </div>
            </div>
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
                ? <LoadingIndicator size="sm" />
                : (activeEscrowCount !== null && activeEscrowCount !== undefined ? activeEscrowCount : 0)}
            </div>
            <div className="metric-subtitle-row">
              <div className="metric-subtitle">This month</div>
            </div>
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
                ? <LoadingIndicator size="sm" />
                : (completedEscrowCount !== null && completedEscrowCount !== undefined ? completedEscrowCount : 0)}
            </div>
            <div className="metric-subtitle-row">
              <div className="metric-subtitle">This month</div>
            </div>
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
                  <div style={{ padding: '8px 12px', textAlign: 'center' }}><LoadingIndicator size="sm" /></div>
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

      {/* Escrow History Header - Mobile */}
      <div className="escrow-history-header">
        <div className="escrow-history-title-wrapper">
          <div className="escrow-history-accent"></div>
          <h3 className="escrow-history-title">Escrow History</h3>
        </div>
        <div className="escrow-history-controls">
          <button type="button" className="escrow-history-control-btn">
            <ChevronDown size={18} />
          </button>
          <button type="button" className="escrow-history-control-btn">
            <Calendar size={18} />
          </button>
        </div>
      </div>

      {/* Escrow History Card List - Mobile */}
      <div className="escrow-history-list">
        {isLoadingEscrows && (
          <div className="escrow-history-card" style={{ textAlign: 'center', padding: '2rem' }}>
            <LoadingIndicator size="md" />
          </div>
        )}
        {!isLoadingEscrows && escrows.length === 0 && (
          <div className="escrow-history-card" style={{ textAlign: 'center', padding: '2rem' }}>
            No escrows found
          </div>
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
          
          return (
            <div key={escrow.id || escrow.xrplEscrowId || index} className="escrow-history-card">
              <div className="escrow-card-top">
                <div className="escrow-card-id">{formattedId}</div>
                <div className="escrow-card-value">
                  {xrpAmount} XRP ≈ ${usdAmount}
                </div>
              </div>
              <div className="escrow-card-bottom">
                <div className="escrow-card-parties">
                  <span className="escrow-card-party-from">{counterpartyName}</span>
                  <span className="escrow-card-party-arrow">→</span>
                  <span className="escrow-card-party-to">{userFullName}</span>
                </div>
                <button type="button" className={`escrow-card-status ${statusLower}`}>
                  {status}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Escrow Table - Desktop */}
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
                  <LoadingIndicator size="md" />
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
              const hasXrplEscrowId = !!(escrow.xrplEscrowId || escrow.xrpl_escrow_id);
              const canRelease =
                hasXrplEscrowId &&
                (statusLower === 'active' || statusLower === 'pending release');
              const actionText = canRelease
                ? 'Release'
                : statusLower === 'completed'
                ? 'Completed'
                : 'View';
              
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
            {/* Modal Header - Mobile with back icon */}
            <div className="create-escrow-modal-header">
              <div className="modal-header-back-icon"></div>
              <h2>Create Escrow</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowCreateEscrowModal(false)}>
                <X size={24} />
              </button>
            </div>

            {/* Step Indicator - Mobile Card Style */}
            <div className="create-escrow-steps-mobile">
              {currentStep === 1 && (
                <div className="step-indicator-mobile active">
                  <div className="step-icon-mobile">
                    <CreditCard size={20} />
                  </div>
                  <div className="step-content-mobile">
                    <span className="step-number-mobile">Step 1/3</span>
                    <span className="step-title-mobile">Type/ Counterparty</span>
                  </div>
                </div>
              )}
              {currentStep === 2 && (
                <div className="step-indicator-mobile active">
                  <div className="step-icon-mobile">
                    <FileText size={20} />
                  </div>
                  <div className="step-content-mobile">
                    <span className="step-number-mobile">Step 2/3</span>
                    <span className="step-title-mobile">Terms</span>
                  </div>
                </div>
              )}
              {currentStep === 3 && (
                <div className="step-indicator-mobile active">
                  <div className="step-icon-mobile">
                    <CheckCircle size={20} />
                  </div>
                  <div className="step-content-mobile">
                    <span className="step-number-mobile">Step 3/3</span>
                    <span className="step-title-mobile">Confirmation</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step Indicator - Desktop with vertical divider */}
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
                    <h3 className="section-title">Escrow Terms</h3>
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
                          <input
                            type="text"
                            placeholder="Enter milestone details"
                            value={termsData.milestoneDetails}
                            onChange={(e) => setTermsData({ ...termsData, milestoneDetails: e.target.value })}
                          />
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
                  {/* Escrow Type and Terms Section - Side by Side */}
                  <div className="escrow-form-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Escrow Type Section */}
                    <div>
                      <h3 className="section-title">Escrow Type</h3>
                      <div className="escrow-type-buttons">
                        <button
                          type="button"
                          className="escrow-type-btn active"
                          disabled
                        >
                          <CheckCircle size={18} />
                          {selectedEscrowType}
                        </button>
                      </div>
                    </div>

                    {/* Escrow Terms Section */}
                    <div>
                      <h3 className="section-title">Escrow Terms</h3>
                      <div className="release-type-buttons">
                        <button
                          type="button"
                          className="release-type-btn active"
                          disabled
                        >
                        {termsData.releaseType === 'Time based' && <Clock size={18} />}
                        {termsData.releaseType === 'Milestones' && <Coins size={18} />}
                        {termsData.releaseType === 'Manual Release' && <Download size={18} />}
                        {termsData.releaseType}
                      </button>
                    </div>
                  </div>
                </div>

                  {/* Escrow Counterparty Section */}
                  <div className="escrow-form-section" style={{ marginTop: 0 }}>
                    <h3 className="section-title">Escrow Counterparty</h3>
                    <div className="counterparty-form-grid">
                      {/* Left Column - Counterparty Information */}
                      <div className="form-column">
                        <div className="form-group">
                          <label>Counterparty XRP Wallet Address <span className="required">*</span></label>
                          <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                            {formData.counterpartyWallet || '—'}
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Email</label>
                          <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                            {formData.counterpartyEmail || '—'}
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Names and Phone Numbers */}
                      <div className="form-column">
                        <div className="form-group">
                          <label>Name</label>
                          <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                            {formData.counterpartyName || '—'}
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Phone Number</label>
                          <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                            {formData.counterpartyPhone || '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Escrow Details Section */}
                  <div className="escrow-form-section">
                    <h3 className="section-title">Escrow Details</h3>
                    <div className="terms-form-grid">
                      <div className="form-group">
                        <label>Expected Completion Date</label>
                        <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                          {termsData.expectedCompletionDate || '—'}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Dispute Resolution Period</label>
                        <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                          {termsData.disputeResolutionPeriod ? `${termsData.disputeResolutionPeriod} days` : '—'}
                        </div>
                      </div>

                      <div className="form-group">
                        <label style={{ fontWeight: 'bold', color: '#0066FF' }}>Escrow Fee</label>
                        <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                          {termsData.totalAmount 
                            ? `${(parseFloat(termsData.totalAmount) * 0.05).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XRP`
                            : '—'}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Total Payment</label>
                        <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                          {termsData.totalAmount ? `${termsData.totalAmount} XRP` : '—'}
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
                  className="previous-btn"
                  onClick={() => setCurrentStep(2)}
                >
                  <div className="previous-btn-icon-circle">
                    <ArrowLeft size={16} />
                  </div>
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="submit-next-btn"
                  onClick={handleCreateEscrow}
                  disabled={isCreatingEscrow}
                >
                  <div className="submit-btn-icon-circle">
                    {isCreatingEscrow ? (
                      <div className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}></div>
                    ) : (
                      <CheckCircle size={16} />
                    )}
                  </div>
                  <span>{isCreatingEscrow ? 'Creating...' : 'Confirm'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Success Modal */}
      {showSuccessModal && (
        <div className="payment-success-modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="payment-success-modal" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              type="button"
              className="payment-success-close-btn"
              onClick={() => setShowSuccessModal(false)}
            >
              <X size={20} />
            </button>

            {/* Success Icon */}
            <div className="payment-success-icon">
              <CheckCircle size={48} />
            </div>

            {/* Heading */}
            <h2 className="payment-success-heading">Payment Successful</h2>

            {/* Sub-text */}
            <p className="payment-success-subtext">
              You have successfully locked
            </p>
            <p className="payment-success-amount">
              {createdEscrowData?.amount || '0'}XRP
              ({createdEscrowData?.amountUsd || (exchangeRate && createdEscrowData?.amount 
                ? (parseFloat(createdEscrowData.amount) * exchangeRate).toFixed(2)
                : '0')}USD)
            </p>

            {/* Status and Transaction ID Section */}
            <div className="payment-status-section">
              <div className="payment-status-column">
                <div className="payment-status-label">Status</div>
                <div className="payment-status-value">
                  <CheckCircle size={16} />
                  <span>Completed</span>
                </div>
              </div>
              <div className="payment-status-divider"></div>
              <div className="payment-status-column">
                <div className="payment-status-label">Transaction ID</div>
                <div className="payment-transaction-id">
                  #{createdEscrowData?.id || createdEscrowData?.transactionId || createdEscrowData?.escrowId || 'N/A'}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="payment-success-buttons">
              <button
                type="button"
                className="payment-details-btn"
                onClick={() => {
                  const escrowId = createdEscrowData?.id || createdEscrowData?.transactionId || createdEscrowData?.escrowId;
                  if (escrowId) {
                    navigate(`/escrow/${escrowId}`);
                  }
                  setShowSuccessModal(false);
                }}
              >
                View Receipt
              </button>
              <button
                type="button"
                className="payment-done-btn"
                onClick={() => {
                  setShowSuccessModal(false);
                  // Refresh escrow list
                  window.location.reload();
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
          </div>
        </div>

        {/* Desktop View - Only visible on desktop */}
        <div className="dashboard-content">
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
                      ? <LoadingIndicator size="sm" />
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
                      ? <LoadingIndicator size="sm" />
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
                      ? <LoadingIndicator size="sm" />
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
                      ? <LoadingIndicator size="sm" />
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
                        <div style={{ padding: '8px 12px', textAlign: 'center' }}><LoadingIndicator size="sm" /></div>
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
                        <LoadingIndicator size="md" />
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
          </div>
        </div>
      </>

      {/* Modals - Outside both containers so they work on mobile and desktop */}
      {/* Create Escrow Modal */}
      {showCreateEscrowModal && (
        <div className="create-escrow-modal-overlay" onClick={() => setShowCreateEscrowModal(false)}>
          <div className="create-escrow-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header - Mobile with back icon */}
            <div className="create-escrow-modal-header">
              <div className="modal-header-back-icon"></div>
              <h2>Create Escrow</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowCreateEscrowModal(false)}>
                <X size={24} />
              </button>
            </div>

            {/* Step Indicator - Mobile Card Style */}
            <div className="create-escrow-steps-mobile">
              {currentStep === 1 && (
                <div className="step-indicator-mobile active">
                  <div className="step-icon-mobile">
                    <CreditCard size={20} />
                  </div>
                  <div className="step-content-mobile">
                    <span className="step-number-mobile">Step 1/3</span>
                    <span className="step-title-mobile">Type/ Counterparty</span>
                  </div>
                </div>
              )}
              {currentStep === 2 && (
                <div className="step-indicator-mobile active">
                  <div className="step-icon-mobile">
                    <FileText size={20} />
                  </div>
                  <div className="step-content-mobile">
                    <span className="step-number-mobile">Step 2/3</span>
                    <span className="step-title-mobile">Terms</span>
                  </div>
                </div>
              )}
              {currentStep === 3 && (
                <div className="step-indicator-mobile active">
                  <div className="step-icon-mobile">
                    <CheckCircle size={20} />
                  </div>
                  <div className="step-content-mobile">
                    <span className="step-number-mobile">Step 3/3</span>
                    <span className="step-title-mobile">Confirmation</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step Indicator - Desktop with vertical divider */}
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
                    <h3 className="section-title">Escrow Terms</h3>
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
                          <input
                            type="text"
                            placeholder="Enter milestone details"
                            value={termsData.milestoneDetails}
                            onChange={(e) => setTermsData({ ...termsData, milestoneDetails: e.target.value })}
                          />
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
                  {/* Escrow Type and Terms Section - Side by Side */}
                  <div className="escrow-form-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Escrow Type Section */}
                    <div>
                      <h3 className="section-title">Escrow Type</h3>
                      <div className="escrow-type-buttons">
                        <button
                          type="button"
                          className="escrow-type-btn active"
                          disabled
                        >
                          <CheckCircle size={18} />
                          {selectedEscrowType}
                        </button>
                      </div>
                    </div>

                    {/* Escrow Terms Section */}
                    <div>
                      <h3 className="section-title">Escrow Terms</h3>
                      <div className="release-type-buttons">
                        <button
                          type="button"
                          className="release-type-btn active"
                          disabled
                        >
                        {termsData.releaseType === 'Time based' && <Clock size={18} />}
                        {termsData.releaseType === 'Milestones' && <Coins size={18} />}
                        {termsData.releaseType === 'Manual Release' && <Download size={18} />}
                        {termsData.releaseType}
                      </button>
                    </div>
                  </div>
                </div>

                  {/* Escrow Counterparty Section */}
                  <div className="escrow-form-section" style={{ marginTop: 0 }}>
                    <h3 className="section-title">Escrow Counterparty</h3>
                    <div className="counterparty-form-grid">
                      {/* Left Column - Counterparty Information */}
                      <div className="form-column">
                        <div className="form-group">
                          <label>Counterparty XRP Wallet Address <span className="required">*</span></label>
                          <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                            {formData.counterpartyWallet || '—'}
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Email</label>
                          <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                            {formData.counterpartyEmail || '—'}
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Names and Phone Numbers */}
                      <div className="form-column">
                        <div className="form-group">
                          <label>Name</label>
                          <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                            {formData.counterpartyName || '—'}
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Phone Number</label>
                          <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                            {formData.counterpartyPhone || '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Escrow Details Section */}
                  <div className="escrow-form-section">
                    <h3 className="section-title">Escrow Details</h3>
                    <div className="terms-form-grid">
                      <div className="form-group">
                        <label>Expected Completion Date</label>
                        <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                          {termsData.expectedCompletionDate || '—'}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Dispute Resolution Period</label>
                        <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                          {termsData.disputeResolutionPeriod ? `${termsData.disputeResolutionPeriod} days` : '—'}
                        </div>
                      </div>

                      <div className="form-group">
                        <label style={{ fontWeight: 'bold', color: '#0066FF' }}>Escrow Fee</label>
                        <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                          {termsData.totalAmount 
                            ? `${(parseFloat(termsData.totalAmount) * 0.05).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XRP`
                            : '—'}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Total Payment</label>
                        <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                          {termsData.totalAmount ? `${termsData.totalAmount} XRP` : '—'}
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
                  className="previous-btn"
                  onClick={() => setCurrentStep(2)}
                >
                  <div className="previous-btn-icon-circle">
                    <ArrowLeft size={16} />
                  </div>
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="submit-next-btn"
                  onClick={handleCreateEscrow}
                  disabled={isCreatingEscrow}
                >
                  <div className="submit-btn-icon-circle">
                    {isCreatingEscrow ? (
                      <div className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}></div>
                    ) : (
                      <CheckCircle size={16} />
                    )}
                  </div>
                  <span>{isCreatingEscrow ? 'Creating...' : 'Confirm'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Success Modal */}
      {showSuccessModal && (
        <div className="payment-success-modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="payment-success-modal" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              type="button"
              className="payment-success-close-btn"
              onClick={() => setShowSuccessModal(false)}
            >
              <X size={20} />
            </button>

            {/* Success Icon */}
            <div className="payment-success-icon">
              <CheckCircle size={48} />
            </div>

            {/* Heading */}
            <h2 className="payment-success-heading">Payment Successful</h2>

            {/* Sub-text */}
            <p className="payment-success-subtext">
              You have successfully locked
            </p>
            <p className="payment-success-amount">
              {createdEscrowData?.amount || '0'}XRP
              ({createdEscrowData?.amountUsd || (exchangeRate && createdEscrowData?.amount 
                ? (parseFloat(createdEscrowData.amount) * exchangeRate).toFixed(2)
                : '0')}USD)
            </p>

            {/* Status and Transaction ID Section */}
            <div className="payment-status-section">
              <div className="payment-status-column">
                <div className="payment-status-label">Status</div>
                <div className="payment-status-value">
                  <CheckCircle size={16} />
                  <span>Completed</span>
                </div>
              </div>
              <div className="payment-status-divider"></div>
              <div className="payment-status-column">
                <div className="payment-status-label">Transaction ID</div>
                <div className="payment-transaction-id">
                  #{createdEscrowData?.id || createdEscrowData?.transactionId || createdEscrowData?.escrowId || 'N/A'}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="payment-success-buttons">
              <button
                type="button"
                className="payment-details-btn"
                onClick={() => {
                  const escrowId = createdEscrowData?.id || createdEscrowData?.transactionId || createdEscrowData?.escrowId;
                  if (escrowId) {
                    navigate(`/escrow/${escrowId}`);
                  }
                  setShowSuccessModal(false);
                }}
              >
                View Receipt
              </button>
              <button
                type="button"
                className="payment-done-btn"
                onClick={() => {
                  setShowSuccessModal(false);
                  // Refresh escrow list
                  window.location.reload();
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="notification-modal-overlay" onClick={() => setShowNotificationModal(false)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <div className="notification-header-content">
                <div className="notification-header-accent"></div>
                <h2>Notification</h2>
              </div>
              <button type="button" className="notification-close-btn" onClick={() => setShowNotificationModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="notification-filter-bar">
              <div className="notification-filter-buttons">
                <button
                  type="button"
                  className={`notification-filter-btn ${notificationFilter === 'All' ? 'active' : ''}`}
                  onClick={() => setNotificationFilter('All')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`notification-filter-btn ${notificationFilter === 'Unread' ? 'active' : ''}`}
                  onClick={() => setNotificationFilter('Unread')}
                >
                  Unread
                </button>
              </div>
              <button type="button" className="notification-filter-icon">
                <Filter size={18} />
              </button>
            </div>

            <div className="notification-list">
              <div className="notification-item unread">
                <div className="notification-bell-icon">
                  <Bell size={16} />
                  <span className="notification-bell-dot"></span>
                </div>
                <div className="notification-content">
                  <div className="notification-message-wrapper">
                    <AlertTriangle size={18} className="notification-status-icon warning" />
                    <p className="notification-message">Low stock for "Premium Sofa" (only 3K available, 5K required)</p>
                  </div>
                  <span className="notification-time">2m ago</span>
                </div>
                <div className="notification-unread-dot"></div>
              </div>

              <div className="notification-item">
                <div className="notification-bell-icon">
                  <Bell size={16} />
                </div>
                <div className="notification-content">
                  <div className="notification-message-wrapper">
                    <CheckCircle size={18} className="notification-status-icon success" />
                    <p className="notification-message">Stock updated for "Sneakers" — now 8K available</p>
                  </div>
                  <span className="notification-time">2m ago</span>
                </div>
              </div>

              <div className="notification-item">
                <div className="notification-bell-icon">
                  <Bell size={16} />
                </div>
                <div className="notification-content">
                  <div className="notification-message-wrapper">
                    <Package size={18} className="notification-status-icon package" />
                    <p className="notification-message">15K products shipped this month</p>
                  </div>
                  <span className="notification-time">2m ago</span>
                </div>
              </div>

              <div className="notification-item">
                <div className="notification-bell-icon">
                  <Bell size={16} />
                </div>
                <div className="notification-content">
                  <div className="notification-message-wrapper">
                    <Package size={18} className="notification-status-icon package" />
                    <p className="notification-message">15K products shipped this month</p>
                  </div>
                  <span className="notification-time">2m ago</span>
                </div>
              </div>

              <div className="notification-item">
                <div className="notification-bell-icon">
                  <Bell size={16} />
                </div>
                <div className="notification-content">
                  <div className="notification-message-wrapper">
                    <Package size={18} className="notification-status-icon package" />
                    <p className="notification-message">15K products shipped this month</p>
                  </div>
                  <span className="notification-time">2m ago</span>
                </div>
              </div>

              <div className="notification-item">
                <div className="notification-bell-icon">
                  <Bell size={16} />
                </div>
                <div className="notification-content">
                  <div className="notification-message-wrapper">
                    <Package size={18} className="notification-status-icon package" />
                    <p className="notification-message">15K products shipped this month</p>
                  </div>
                  <span className="notification-time">2m ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </MyEscrowLayout>
  );
};

export default MyEscrow;

