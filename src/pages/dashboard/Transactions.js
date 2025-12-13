import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Repeat,
  Briefcase,
  Settings,
  HelpCircle,
  Search,
  Bell,
  KeyRound,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  LogOut,
  Filter,
  Wallet,
  Building2,
  Users,
  FileCheck,
  Code,
  Box,
  Link,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  DollarSign,
  X,
  Info,
  ArrowUpDown,
  ExternalLink,
  Copy,
  QrCode,
  Menu,
  AlertTriangle,
  CheckCircle,
  Package,
  Trophy,
  ShoppingBag,
  Home
} from 'lucide-react';
import './Dashboard.css';
import './Transactions.css';
import logo from '../../assets/images/icons/logo.png';
import verifyBadge from '../../assets/images/icons/verify.png';
import { getApiUrl } from '../../utils/config';
import { useSession } from '../../context/SessionContext';

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: 23 },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: 23 },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'P2P trading', icon: Repeat, badge: null }
];

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, badge: null },
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

const Transactions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const [showBalance, setShowBalance] = useState(true);
  const [accountType, setAccountType] = useState('Personal');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('All');
  const [kycComplete] = useState(true);
  
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [walletBalances, setWalletBalances] = useState(null);
  const [isLoadingWalletBalances, setIsLoadingWalletBalances] = useState(true);
  const [userFullName, setUserFullName] = useState('Sarah Chen');
  const [userInitials, setUserInitials] = useState('SC');
  const [userRole, setUserRole] = useState('Freelancer');
  const [userAvatar, setUserAvatar] = useState(null);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(true);
  const [linkedAccounts, setLinkedAccounts] = useState(null);
  const [isLoadingLinkedAccounts, setIsLoadingLinkedAccounts] = useState(true);
  const [transactionFilter, setTransactionFilter] = useState('All');
  const [monthlyFilter, setMonthlyFilter] = useState('Monthly');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showFundWalletModal, setShowFundWalletModal] = useState(false);
  const [fundWalletForm, setFundWalletForm] = useState({
    amount: '',
    currency: 'XRP'
  });
  const [isFundingWallet, setIsFundingWallet] = useState(false);
  const [fundingStep, setFundingStep] = useState('idle');
  const [transactionData, setTransactionData] = useState(null);
  const [showWithdrawWalletModal, setShowWithdrawWalletModal] = useState(false);
  const [withdrawWalletForm, setWithdrawWalletForm] = useState({
    amount: '',
    currency: 'USD',
    destinationAddress: ''
  });
  const [isWithdrawingWallet, setIsWithdrawingWallet] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapForm, setSwapForm] = useState({
    fromCurrency: 'XRP',
    toCurrency: 'USDT',
    fromAmount: '',
    toAmount: ''
  });
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSendPage, setShowSendPage] = useState(false);
  const [showTransactionSummaryModal, setShowTransactionSummaryModal] = useState(false);
  const [showFundWalletTransferModal, setShowFundWalletTransferModal] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [showSavingsPage, setShowSavingsPage] = useState(false);
  const [showSavingsSummary, setShowSavingsSummary] = useState(false);
  const [showDesktopSavingsDashboard, setShowDesktopSavingsDashboard] = useState(false);
  const [savingsAmount, setSavingsAmount] = useState('');
  const [showFundWalletPage, setShowFundWalletPage] = useState(false);
  const [showFundWalletSummary, setShowFundWalletSummary] = useState(false);
  const [fundWalletNetwork, setFundWalletNetwork] = useState('');
  const [fundWalletAmount, setFundWalletAmount] = useState('');
  const [sendForm, setSendForm] = useState({
    fromWallet: 'XRP',
    fromAmount: '24,567.89',
    toCurrency: 'EUR',
    toAmount: '24,567.89',
    fullName: '',
    phoneNumber: '',
    walletAddress: '',
    reason: ''
  });

  const formattedToday = useMemo(() => {
    const now = new Date();
    const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
    const day = now.getDate();
    const month = now.toLocaleDateString(undefined, { month: 'long' });
    return `${weekday}, ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} ${month}`;
  }, []);

  // Fetch dashboard summary for total balance
  useEffect(() => {
    const fetchDashboardSummary = async () => {
      try {
        if (isSessionExpired) {
          setIsLoadingDashboard(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoadingDashboard(false);
          return;
        }

        const apiUrl = getApiUrl('api/dashboard/summary');
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
            setDashboardData(result.data);
          } else {
            setDashboardData(null);
          }
        } else {
          setDashboardData(null);
        }
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        setDashboardData(null);
      } finally {
        setIsLoadingDashboard(false);
      }
    };

    fetchDashboardSummary();
  }, [isSessionExpired]);

  // Fetch user profile
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
            const fullName = data.fullName || [data.firstName, data.lastName].filter(Boolean).join(' ') || data.name || 'Sarah Chen';
            setUserFullName(fullName);

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
            
            // Set user role if available
            const role = data.role || data.userRole || 'Freelancer';
            setUserRole(role);
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

  // Fetch exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoadingRates(false);
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
          if (result?.success && Array.isArray(result?.data?.rates)) {
            setExchangeRates(result.data.rates);
          }
        }
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchExchangeRates();
  }, []);

  // Fetch wallet balances
  useEffect(() => {
    const fetchWalletBalances = async () => {
      try {
        if (isSessionExpired) {
          setIsLoadingWalletBalances(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoadingWalletBalances(false);
          return;
        }

        const apiUrl = getApiUrl('api/wallet/balance');
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result?.success && result?.data?.balance) {
            setWalletBalances(result.data.balance);
          } else {
            setWalletBalances(null);
          }
        } else {
          setWalletBalances(null);
        }
      } catch (error) {
        console.error('Error fetching wallet balances:', error);
        setWalletBalances(null);
      } finally {
        setIsLoadingWalletBalances(false);
      }
    };

    fetchWalletBalances();
  }, [isSessionExpired]);

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        if (isSessionExpired) {
          // Mock transaction data
          setTransactions([
            {
              id: 'F4E5D6C1B2A3',
              type: 'Received',
              amount: { xrp: 50, usd: 25.00 },
              status: 'Successful',
              date: '2024-07-04'
            }
          ]);
          setIsLoadingTransactions(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoadingTransactions(false);
          return;
        }

        // Try different possible endpoints
        const endpoints = ['api/transactions', 'api/transactions/list', 'api/wallet/transactions'];
        let transactionsData = [];

        for (const endpoint of endpoints) {
          try {
            const apiUrl = getApiUrl(endpoint);
            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const result = await response.json();
              if (result?.success) {
                if (Array.isArray(result.data)) {
                  transactionsData = result.data;
                } else if (Array.isArray(result.data?.transactions)) {
                  transactionsData = result.data.transactions;
                }
                break;
              }
            }
          } catch (error) {
            console.error(`Error fetching from ${endpoint}:`, error);
          }
        }

        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    fetchTransactions();
  }, [isSessionExpired]);

  // Fetch beneficiaries
  useEffect(() => {
    const fetchBeneficiaries = async () => {
      try {
        if (isSessionExpired) {
          setBeneficiaries([
            { id: 1, name: 'John Doe', initials: 'JD' },
            { id: 2, name: 'Jane Smith', initials: 'JS' },
            { id: 3, name: 'Bob Wilson', initials: 'BW' },
            { id: 4, name: 'Alice Brown', initials: 'AB' }
          ]);
          setIsLoadingBeneficiaries(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoadingBeneficiaries(false);
          return;
        }

        const apiUrl = getApiUrl('api/user/beneficiaries');
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result?.success) {
            if (Array.isArray(result.data)) {
              setBeneficiaries(result.data);
            } else if (Array.isArray(result.data?.beneficiaries)) {
              setBeneficiaries(result.data.beneficiaries);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching beneficiaries:', error);
        // Use mock data on error
        setBeneficiaries([
          { id: 1, name: 'John Doe', initials: 'JD' },
          { id: 2, name: 'Jane Smith', initials: 'JS' },
          { id: 3, name: 'Bob Wilson', initials: 'BW' },
          { id: 4, name: 'Alice Brown', initials: 'AB' }
        ]);
      } finally {
        setIsLoadingBeneficiaries(false);
      }
    };

    fetchBeneficiaries();
  }, [isSessionExpired]);

  // Fetch linked accounts
  useEffect(() => {
    const fetchLinkedAccounts = async () => {
      try {
        if (isSessionExpired) {
          setLinkedAccounts({
            bankAccount: '9832547364',
            web3Wallet: 'XUMM (Connected)'
          });
          setIsLoadingLinkedAccounts(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoadingLinkedAccounts(false);
          return;
        }

        const apiUrl = getApiUrl('api/user/linked-accounts');
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
            setLinkedAccounts(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching linked accounts:', error);
        // Use mock data on error
        setLinkedAccounts({
          bankAccount: '9832547364',
          web3Wallet: 'XUMM (Connected)'
        });
      } finally {
        setIsLoadingLinkedAccounts(false);
      }
    };

    fetchLinkedAccounts();
  }, [isSessionExpired]);

  // Format transaction ID
  const formatTransactionId = (id) => {
    if (!id) return 'N/A';
    if (id.length <= 12) return id;
    return `${id.substring(0, 6)}...${id.substring(id.length - 6)}`;
  };

  // Format date to YYYY-MM-DD
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
          return dateString.split('T')[0].split(' ')[0];
        }
        return dateString;
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      // If parsing fails, try to extract YYYY-MM-DD from the string
      const match = dateString.match(/(\d{4}-\d{2}-\d{2})/);
      return match ? match[1] : dateString;
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return transactions.slice(startIndex, endIndex);
  }, [transactions, currentPage, itemsPerPage]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [transactionFilter, monthlyFilter]);

  // Function to refresh dashboard data
  const fetchDashboardSummary = async () => {
    try {
      if (isSessionExpired) {
        setIsLoadingDashboard(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoadingDashboard(false);
        return;
      }

      const apiUrl = getApiUrl('api/dashboard/summary');
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
          setDashboardData(result.data);
        } else {
          setDashboardData(null);
        }
      } else {
        setDashboardData(null);
      }
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      setDashboardData(null);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  // Helper function to submit signed transaction for browser wallet flow
  const submitSignedTransaction = async (transactionId, signedTxBlob, token) => {
    try {
      setFundingStep('completing');
      toast.loading('Submitting signed transaction...', { id: 'fund-wallet' });
      
      if (!transactionId || typeof transactionId !== 'string') {
        throw new Error('Invalid transaction ID. Please try the transaction again.');
      }
      
      if (!signedTxBlob || typeof signedTxBlob !== 'string') {
        throw new Error('Invalid signed transaction blob. Please try signing again.');
      }
      
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidPattern.test(signedTxBlob)) {
        throw new Error('Invalid transaction blob format. Please try signing again.');
      }
      
      const submitUrl = getApiUrl('api/wallet/fund/submit');
      const submitResponse = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transactionId,
          signedTxBlob: signedTxBlob
        }),
      });
      
      const submitResult = await submitResponse.json().catch(() => ({}));
      
      if (submitResponse.ok && submitResult.success) {
        toast.success('Wallet funded successfully!', { id: 'fund-wallet' });
        setShowFundWalletModal(false);
        setFundWalletForm({ amount: '', currency: 'XRP' });
        setTransactionData(null);
        setFundingStep('idle');
        setIsFundingWallet(false);
        await fetchDashboardSummary();
        // Also refresh wallet balances
        const walletApiUrl = getApiUrl('api/wallet/balance');
        const walletResponse = await fetch(walletApiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (walletResponse.ok) {
          const walletResult = await walletResponse.json();
          if (walletResult?.success && walletResult?.data?.balance) {
            setWalletBalances(walletResult.data.balance);
          }
        }
      } else {
        const errorMessage = submitResult.message || submitResult.error || 'Failed to submit transaction';
        toast.error(`${errorMessage}. Please try again.`, { id: 'fund-wallet' });
        setFundingStep('idle');
        setIsFundingWallet(false);
      }
    } catch (submitError) {
      console.error('Error submitting signed transaction:', submitError);
      toast.error('An error occurred while submitting the transaction. Please try again.', { id: 'fund-wallet' });
      setFundingStep('idle');
      setIsFundingWallet(false);
    }
  };

  const handleFundWallet = async (e) => {
    e.preventDefault();
    
    if (!fundWalletForm.amount || parseFloat(fundWalletForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to fund your wallet');
      return;
    }

    const selectedCurrency = fundWalletForm.currency || 'XRP';
    setIsFundingWallet(true);
    setFundingStep('preparing');
    
    try {
      const apiUrl = getApiUrl('api/wallet/fund');
      toast.loading('Preparing transaction...', { id: 'fund-wallet' });

      const prepareResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(fundWalletForm.amount),
          currency: selectedCurrency
        }),
      });

      const prepareResult = await prepareResponse.json().catch(() => ({}));

      if (!prepareResponse.ok || !prepareResult.success) {
        toast.error(prepareResult.message || 'Failed to prepare transaction. Please try again.', { id: 'fund-wallet' });
        setIsFundingWallet(false);
        setFundingStep('idle');
        return;
      }

      const transactionId = prepareResult.data?.transactionId;
      const xummUrl = prepareResult.data?.xummUrl;
      const transactionObject = prepareResult.data?.transaction 
        || prepareResult.data?.transactionBlob 
        || prepareResult.data?.txBlob 
        || prepareResult.data?.blob;

      if (prepareResult.data?.xrplTxHash) {
        toast.success('Wallet funded successfully!', { id: 'fund-wallet' });
        setShowFundWalletModal(false);
        setFundWalletForm({ amount: '', currency: 'XRP' });
        setTransactionData(null);
        setFundingStep('idle');
        setIsFundingWallet(false);
        await fetchDashboardSummary();
        return;
      }

      if (!transactionId) {
        toast.error('Backend response missing transaction ID.', { id: 'fund-wallet' });
        setIsFundingWallet(false);
        setFundingStep('idle');
        return;
      }

      setTransactionData({ transactionId, transactionObject, xummUrl });
      setFundingStep('signing');

      if (xummUrl) {
        toast.loading('Please sign the transaction in your Xaman wallet...', { id: 'fund-wallet' });
        window.open(xummUrl, '_blank');

        const pollInterval = setInterval(async () => {
          try {
            const statusUrl = getApiUrl(`api/wallet/fund/status?transactionId=${transactionId}`);
            const statusResponse = await fetch(statusUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (statusResponse.ok) {
              const statusResult = await statusResponse.json();
              
              if (statusResult.data?.signed) {
                clearInterval(pollInterval);
                toast.success('Wallet funded successfully!', { id: 'fund-wallet' });
                setShowFundWalletModal(false);
                setFundWalletForm({ amount: '', currency: 'XRP' });
                setTransactionData(null);
                setFundingStep('idle');
                setIsFundingWallet(false);
                await fetchDashboardSummary();
              } else if (statusResult.data?.cancelled || statusResult.data?.expired) {
                clearInterval(pollInterval);
                toast.error('Transaction was cancelled or expired.', { id: 'fund-wallet' });
                setIsFundingWallet(false);
                setFundingStep('idle');
                setTransactionData(null);
              }
            }
          } catch (pollError) {
            console.error('Error polling transaction status:', pollError);
          }
        }, 2000);
        
        setTransactionData({ transactionId, transactionObject, xummUrl, pollInterval });
        
        setTimeout(() => {
          clearInterval(pollInterval);
          if (fundingStep === 'signing') {
            toast.error('Transaction signing timed out.', { id: 'fund-wallet' });
            setIsFundingWallet(false);
            setFundingStep('idle');
            setTransactionData(null);
          }
        }, 5 * 60 * 1000);
        
      } else {
        if (!transactionObject) {
          toast.error('Backend response missing transaction data for browser wallet signing.', { id: 'fund-wallet' });
          setIsFundingWallet(false);
          setFundingStep('idle');
          setTransactionData(null);
          return;
        }
        
        toast.loading('Please sign the transaction in your browser wallet...', { id: 'fund-wallet' });
        
        try {
          let txToSign = transactionObject;
          if (typeof transactionObject === 'string') {
            try {
              txToSign = JSON.parse(transactionObject);
            } catch (e) {
              console.warn('Could not parse transaction object as JSON:', e);
            }
          }
          
          if (window.crossmark) {
            let isConnected = window.crossmark?.session?.address || window.crossmark?.api?.connected || false;
            
            if (!isConnected) {
              try {
                if (window.crossmark?.session?.signIn) {
                  await window.crossmark.session.signIn();
                  await new Promise(resolve => setTimeout(resolve, 500));
                  isConnected = window.crossmark?.session?.address || window.crossmark?.api?.connected || false;
                } else if (window.crossmark?.async?.signInAndWait) {
                  await window.crossmark.async.signInAndWait();
                  await new Promise(resolve => setTimeout(resolve, 500));
                  isConnected = window.crossmark?.session?.address || window.crossmark?.api?.connected || false;
                }
              } catch (connectError) {
                throw new Error('Failed to connect Crossmark wallet. Please make sure the extension is installed and unlocked.');
              }
            }
            
            if (!isConnected) {
              throw new Error('Crossmark wallet is not connected. Please connect your wallet and try again.');
            }
            
            toast.loading('Requesting transaction signature from Crossmark...', { id: 'fund-wallet' });
            
            let signedTx;
            if (window.crossmark.api && typeof window.crossmark.api.request === 'function') {
              signedTx = await window.crossmark.api.request({
                method: 'sign',
                params: { transaction: txToSign }
              });
            } else if (window.crossmark.api && typeof window.crossmark.api.sign === 'function') {
              signedTx = await window.crossmark.api.sign(txToSign);
            } else if (window.crossmark.api && typeof window.crossmark.api.signTransaction === 'function') {
              signedTx = await window.crossmark.api.signTransaction(txToSign);
            } else {
              throw new Error('No sign method found in Crossmark API');
            }
            
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            let actualResponse = signedTx;
            
            if (typeof signedTx === 'string' && uuidPattern.test(signedTx)) {
              if (window.crossmark?.api?.awaitRequest) {
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Request timeout')), 120000)
                );
                actualResponse = await Promise.race([
                  window.crossmark.api.awaitRequest(signedTx),
                  timeoutPromise
                ]);
              }
            }
            
            let signedTxBlob = null;
            if (typeof actualResponse === 'string' && !uuidPattern.test(actualResponse)) {
              signedTxBlob = actualResponse;
            } else if (actualResponse?.signedTransaction) {
              signedTxBlob = actualResponse.signedTransaction;
            } else if (actualResponse?.txBlob) {
              signedTxBlob = actualResponse.txBlob;
            } else if (actualResponse?.blob) {
              signedTxBlob = actualResponse.blob;
            } else if (actualResponse?.result) {
              signedTxBlob = typeof actualResponse.result === 'string' ? actualResponse.result : actualResponse.result?.signedTransaction || actualResponse.result?.txBlob;
            }
            
            if (!signedTxBlob || typeof signedTxBlob !== 'string') {
              throw new Error('Failed to extract signed transaction blob from wallet response.');
            }
            
            await submitSignedTransaction(transactionId, signedTxBlob, token);
          } else if (window.ethereum) {
            const signedTx = await window.ethereum.request({
              method: 'xrpl_signTransaction',
              params: [txToSign]
            });
            
            let signedTxBlob = null;
            if (typeof signedTx === 'string') {
              signedTxBlob = signedTx;
            } else if (signedTx?.signedTransaction) {
              signedTxBlob = signedTx.signedTransaction;
            } else if (signedTx?.txBlob) {
              signedTxBlob = signedTx.txBlob;
            } else if (signedTx?.result) {
              signedTxBlob = typeof signedTx.result === 'string' ? signedTx.result : signedTx.result?.signedTransaction;
            }
            
            if (!signedTxBlob) {
              throw new Error('Failed to extract signed transaction blob.');
            }
            
            await submitSignedTransaction(transactionId, signedTxBlob, token);
          } else {
            toast.error('No XRPL wallet detected. Please install Crossmark wallet extension.', { id: 'fund-wallet' });
            setIsFundingWallet(false);
            setFundingStep('idle');
            setTransactionData(null);
          }
        } catch (browserWalletError) {
          console.error('Error with browser wallet flow:', browserWalletError);
          toast.error(`Failed to sign transaction: ${browserWalletError.message || 'Unknown error'}. Please try again.`, { id: 'fund-wallet' });
          setIsFundingWallet(false);
          setFundingStep('idle');
          setTransactionData(null);
        }
      }

    } catch (error) {
      console.error('Error funding wallet:', error);
      toast.error('An error occurred while funding your wallet. Please try again.', { id: 'fund-wallet' });
      setIsFundingWallet(false);
      setFundingStep('idle');
      setTransactionData(null);
    }
  };

  const handleWithdrawWallet = async (e) => {
    e.preventDefault();

    if (!withdrawWalletForm.amount || parseFloat(withdrawWalletForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!withdrawWalletForm.destinationAddress || withdrawWalletForm.destinationAddress.trim().length < 10) {
      toast.error('Please enter a valid destination address');
      return;
    }

    setIsWithdrawingWallet(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to withdraw from your wallet');
        setIsWithdrawingWallet(false);
        return;
      }

      const apiUrl = getApiUrl('api/wallet/withdraw');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawWalletForm.amount),
          currency: withdrawWalletForm.currency,
          destinationAddress: withdrawWalletForm.destinationAddress.trim(),
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success) {
        toast.success('Withdrawal request submitted successfully!');
        setShowWithdrawWalletModal(false);
        setWithdrawWalletForm({
          amount: '',
          currency: 'USD',
          destinationAddress: ''
        });
        await fetchDashboardSummary();
        // Also refresh wallet balances
        const walletApiUrl = getApiUrl('api/wallet/balance');
        const walletResponse = await fetch(walletApiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (walletResponse.ok) {
          const walletResult = await walletResponse.json();
          if (walletResult?.success && walletResult?.data?.balance) {
            setWalletBalances(walletResult.data.balance);
          }
        }
      } else {
        toast.error(result.message || 'Failed to withdraw from wallet. Please try again.');
      }
    } catch (error) {
      console.error('Error withdrawing from wallet:', error);
      toast.error('An error occurred while processing your withdrawal. Please try again.');
    } finally {
      setIsWithdrawingWallet(false);
    }
  };

  // Helper function to get currency display name
  const getCurrencyDisplayName = (currency) => {
    const mapping = {
      'XRP': 'XRP wallet',
      'USDT': 'Tether USD',
      'USDC': 'USD Coin'
    };
    return mapping[currency] || currency;
  };

  // Helper function to get currency badge text
  const getCurrencyBadge = (currency) => {
    const mapping = {
      'XRP': 'XRP',
      'USDT': 'USDT',
      'USDC': 'USDC'
    };
    return mapping[currency] || currency;
  };

  // Helper function to get balance for a currency
  const getCurrencyBalance = (currency) => {
    if (!walletBalances) return 0;
    const currencyKey = currency.toLowerCase();
    return walletBalances[currencyKey] || 0;
  };

  // Helper function to get exchange rate
  const getExchangeRate = (fromCurrency, toCurrency) => {
    if (!exchangeRates || !Array.isArray(exchangeRates)) return null;
    if (fromCurrency === toCurrency) return 1;
    
    // Try to find direct rate
    const directRate = exchangeRates.find(rate => 
      rate.from === fromCurrency && rate.to === toCurrency
    );
    if (directRate) return directRate.rate;

    // Try reverse rate
    const reverseRate = exchangeRates.find(rate => 
      rate.from === toCurrency && rate.to === fromCurrency
    );
    if (reverseRate) return 1 / reverseRate.rate;

    // Fallback: try to find via USD if available
    if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
      const fromToUsd = exchangeRates.find(rate => 
        rate.from === fromCurrency && rate.to === 'USD'
      );
      const usdToTo = exchangeRates.find(rate => 
        rate.from === 'USD' && rate.to === toCurrency
      );
      if (fromToUsd && usdToTo) {
        return fromToUsd.rate * usdToTo.rate;
      }
    }

    return null;
  };

  // Calculate toAmount based on fromAmount and exchange rate
  const calculateToAmount = (fromAmount, fromCurrency, toCurrency) => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return '';
    const rate = getExchangeRate(fromCurrency, toCurrency);
    if (!rate) return '';
    const calculated = parseFloat(fromAmount) * rate;
    return calculated.toFixed(6);
  };

  const handleSwapCurrencyChange = (field, value) => {
    setSwapForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // If currencies are the same, prevent it
      if (field === 'fromCurrency' && value === updated.toCurrency) {
        return prev;
      }
      if (field === 'toCurrency' && value === updated.fromCurrency) {
        return prev;
      }

      // Recalculate toAmount if fromAmount exists
      if (updated.fromAmount && updated.fromAmount !== '') {
        updated.toAmount = calculateToAmount(updated.fromAmount, updated.fromCurrency, updated.toCurrency);
      } else {
        updated.toAmount = '';
      }

      return updated;
    });
  };

  const handleSwapAmountChange = (field, value) => {
    setSwapForm(prev => {
      const updated = { ...prev, [field]: value };
      
      if (field === 'fromAmount') {
        updated.toAmount = calculateToAmount(value, updated.fromCurrency, updated.toCurrency);
      } else if (field === 'toAmount') {
        // Calculate fromAmount based on toAmount (reverse calculation)
        const rate = getExchangeRate(updated.toCurrency, updated.fromCurrency);
        if (rate && value && parseFloat(value) > 0) {
          updated.fromAmount = (parseFloat(value) * rate).toFixed(6);
        } else {
          updated.fromAmount = '';
        }
      }

      return updated;
    });
  };

  const handleSwapCurrencies = () => {
    setSwapForm(prev => {
      const newFromCurrency = prev.toCurrency;
      const newToCurrency = prev.fromCurrency;
      const newFromAmount = prev.toAmount;
      const newToAmount = prev.fromAmount;

      return {
        fromCurrency: newFromCurrency,
        toCurrency: newToCurrency,
        fromAmount: newFromAmount,
        toAmount: newToAmount
      };
    });
  };

  const handlePreviewSwap = async (e) => {
    e.preventDefault();

    // Validation
    if (!swapForm.fromAmount || parseFloat(swapForm.fromAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (swapForm.fromCurrency === swapForm.toCurrency) {
      toast.error('Please select different currencies');
      return;
    }

    const balance = getCurrencyBalance(swapForm.fromCurrency);
    if (parseFloat(swapForm.fromAmount) > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSwapping(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to perform swap');
        setIsSwapping(false);
        return;
      }

      const apiUrl = getApiUrl('api/wallet/swap');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromCurrency: swapForm.fromCurrency,
          toCurrency: swapForm.toCurrency,
          amount: parseFloat(swapForm.fromAmount),
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success) {
        toast.success('Swap completed successfully!');
        setShowSwapModal(false);
        setSwapForm({
          fromCurrency: 'XRP',
          toCurrency: 'USDT',
          fromAmount: '',
          toAmount: ''
        });
        await fetchDashboardSummary();
        // Also refresh wallet balances
        const walletApiUrl = getApiUrl('api/wallet/balance');
        const walletResponse = await fetch(walletApiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (walletResponse.ok) {
          const walletResult = await walletResponse.json();
          if (walletResult?.success && walletResult?.data?.balance) {
            setWalletBalances(walletResult.data.balance);
          }
        }
      } else {
        toast.error(result.message || 'Failed to complete swap. Please try again.');
      }
    } catch (error) {
      console.error('Error performing swap:', error);
      toast.error('An error occurred while processing your swap. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  // Add body class to hide navbar on transactions page (backup)
  useEffect(() => {
    document.body.classList.add('transactions-page-active');
    return () => {
      document.body.classList.remove('transactions-page-active');
    };
  }, []);

  // Cleanup poll interval when modal closes or component unmounts
  useEffect(() => {
    return () => {
      if (transactionData?.pollInterval) {
        clearInterval(transactionData.pollInterval);
      }
    };
  }, [transactionData]);

  // Render mobile savings summary page
  if (showSavingsSummary) {
    const xrpAmount = parseFloat(savingsAmount) || 0;
    let exchangeRate = 0.5430;
    let usdValue = xrpAmount * exchangeRate;
    
    if (exchangeRates && exchangeRates.length > 0) {
      const xrpToUsdRate = getExchangeRate('XRP', 'USD');
      if (xrpToUsdRate) {
        exchangeRate = Number(xrpToUsdRate);
        usdValue = xrpAmount * exchangeRate;
      }
    }

    const networkFee = 0.00001;
    const serviceFeePercent = 0.46;
    const serviceFeeUsd = usdValue * (serviceFeePercent / 100);
    const recipientGets = usdValue - serviceFeeUsd;

    return (
      <div className="mobile-savings-summary-page">
        <div className="mobile-savings-summary-header">
          <div className="mobile-savings-summary-title-wrapper">
            <div className="mobile-section-indicator"></div>
            <h2>Transaction Summary</h2>
          </div>
          <button 
            type="button" 
            className="mobile-savings-close-btn"
            onClick={() => setShowSavingsSummary(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mobile-savings-summary-content">
          {/* Transaction Details */}
          <div className="mobile-savings-summary-section">
            <div className="mobile-savings-summary-item">
              <span className="mobile-savings-summary-label">Send Amount</span>
              <span className="mobile-savings-summary-value">{xrpAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP</span>
            </div>
            <div className="mobile-savings-summary-item">
              <span className="mobile-savings-summary-label">Exchange Rate</span>
              <span className="mobile-savings-summary-value">1 XRP = ${exchangeRate.toFixed(4)}</span>
            </div>
            <div className="mobile-savings-summary-item">
              <span className="mobile-savings-summary-label">Network Fee</span>
              <span className="mobile-savings-summary-value">{networkFee} XRP</span>
            </div>
            <div className="mobile-savings-summary-item mobile-savings-summary-divider">
              <span className="mobile-savings-summary-label">Service Fee</span>
              <span className="mobile-savings-summary-value">${serviceFeeUsd.toFixed(2)} ({serviceFeePercent}%)</span>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="mobile-savings-summary-section">
            <div className="mobile-savings-summary-item">
              <span className="mobile-savings-summary-label">
                <span className="mobile-savings-summary-bold">Recipient Gets</span>
              </span>
              <span className="mobile-savings-summary-value mobile-savings-summary-bold">${recipientGets.toFixed(2)} USD</span>
            </div>
            <div className="mobile-savings-summary-item">
              <span className="mobile-savings-summary-label">Estimated Arrival</span>
              <span className="mobile-savings-summary-value">3-5 seconds</span>
            </div>
          </div>

          {/* Transfer Button */}
          <div className="mobile-savings-summary-actions">
            <button 
              type="button" 
              className="mobile-savings-summary-transfer-btn"
              onClick={() => {
                // Handle final transfer logic
                setShowSavingsSummary(false);
                setShowSavingsPage(false);
                toast.success('Transfer completed successfully');
              }}
            >
              Transfer
            </button>
          </div>

          {/* Information Message */}
          <div className="mobile-savings-summary-info-message">
            <div className="mobile-savings-summary-info-icon">
              <Info size={16} />
            </div>
            <span>Recipient will receive at least {recipientGets.toFixed(0)} USDT (${recipientGets.toFixed(0)}) or the transaction will be refunded</span>
          </div>
        </div>
      </div>
    );
  }

  // Render mobile fund wallet summary page
  if (showFundWalletSummary) {
    // Calculate transaction details
    const xrpAmount = parseFloat(fundWalletAmount) || 0;
    let exchangeRate = 0.5430;
    let usdValue = xrpAmount * exchangeRate;
    
    if (exchangeRates && exchangeRates.length > 0) {
      const xrpToUsdRate = getExchangeRate('XRP', 'USD');
      if (xrpToUsdRate) {
        exchangeRate = Number(xrpToUsdRate);
        usdValue = xrpAmount * exchangeRate;
      }
    }
    
    const networkFee = 0.00001;
    const serviceFeePercent = 0.46;
    const serviceFeeUsd = usdValue * (serviceFeePercent / 100);
    const recipientGets = usdValue - serviceFeeUsd;

    return (
      <div className="mobile-fund-wallet-summary-page">
        <div className="mobile-fund-wallet-summary-header">
          <div className="mobile-fund-wallet-summary-title-wrapper">
            <div className="mobile-section-indicator"></div>
            <h2>Transaction Summary</h2>
          </div>
          <button 
            type="button" 
            className="mobile-fund-wallet-close-btn"
            onClick={() => setShowFundWalletSummary(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mobile-fund-wallet-summary-content">
          {/* Transaction Details */}
          <div className="mobile-fund-wallet-summary-section">
            <div className="mobile-fund-wallet-summary-item">
              <span className="mobile-fund-wallet-summary-label">Send Amount</span>
              <span className="mobile-fund-wallet-summary-value">{xrpAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP</span>
            </div>
            <div className="mobile-fund-wallet-summary-item">
              <span className="mobile-fund-wallet-summary-label">Exchange Rate</span>
              <span className="mobile-fund-wallet-summary-value">1 XRP = ${exchangeRate.toFixed(4)}</span>
            </div>
            <div className="mobile-fund-wallet-summary-item">
              <span className="mobile-fund-wallet-summary-label">Network Fee</span>
              <span className="mobile-fund-wallet-summary-value">{networkFee} XRP</span>
            </div>
            <div className="mobile-fund-wallet-summary-item mobile-fund-wallet-summary-divider">
              <span className="mobile-fund-wallet-summary-label">Service Fee</span>
              <span className="mobile-fund-wallet-summary-value">${serviceFeeUsd.toFixed(2)} ({serviceFeePercent}%)</span>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="mobile-fund-wallet-summary-section">
            <div className="mobile-fund-wallet-summary-item">
              <span className="mobile-fund-wallet-summary-label">
                <span className="mobile-fund-wallet-summary-bold">Recipient Gets</span>
              </span>
              <span className="mobile-fund-wallet-summary-value mobile-fund-wallet-summary-bold">${recipientGets.toFixed(2)} USD</span>
            </div>
            <div className="mobile-fund-wallet-summary-item">
              <span className="mobile-fund-wallet-summary-label">Estimated Arrival</span>
              <span className="mobile-fund-wallet-summary-value">3-5 seconds</span>
            </div>
          </div>

          {/* Transfer Button */}
          <div className="mobile-fund-wallet-summary-actions">
            <button 
              type="button" 
              className="mobile-fund-wallet-summary-transfer-btn"
              onClick={() => {
                // Handle final transfer logic
                setShowFundWalletSummary(false);
                setShowFundWalletPage(false);
                toast.success('Transfer completed successfully');
              }}
            >
              Transfer
            </button>
          </div>

          {/* Information Message */}
          <div className="mobile-fund-wallet-summary-info-message">
            <div className="mobile-fund-wallet-summary-info-icon">
              <Info size={16} />
            </div>
            <span>Recipient will receive at least {recipientGets.toFixed(0)} USDT (${recipientGets.toFixed(0)}) or the transaction will be refunded</span>
          </div>
        </div>
      </div>
    );
  }

  // Render mobile send full page
  if (showSendPage) {
    return (
      <div className="mobile-send-full-page">
        <div className="mobile-send-page-header">
          <div className="mobile-send-page-title-wrapper">
            <div className="mobile-section-indicator"></div>
            <h2>Send</h2>
          </div>
          <button 
            type="button" 
            className="mobile-send-close-btn"
            onClick={() => setShowSendPage(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mobile-send-page-content">
          {/* From Section */}
          <div className="mobile-send-from-section">
            <label className="mobile-send-section-label">From</label>
            <div className="mobile-send-wallet-selector">
              <div className="mobile-send-currency-badge">
                <img 
                  src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                  alt="XRP" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              </div>
              <span className="mobile-send-wallet-text">XRP wallet</span>
              <ChevronDown size={16} />
            </div>
            <div className="mobile-send-amount-display">$24,567.89</div>
            <div className="mobile-send-balance-text">Balance: 24,567.89 USDT</div>
          </div>

          {/* Swap Icon */}
          <div className="mobile-send-swap-icon-wrapper">
            <button type="button" className="mobile-send-swap-btn">
              <ArrowUpDown size={20} />
            </button>
          </div>

          {/* To Section */}
          <div className="mobile-send-to-section">
            <label className="mobile-send-section-label">To</label>
            <div className="mobile-send-wallet-selector">
              <div className="mobile-send-currency-flag">
                <span>🇪🇺</span>
              </div>
              <span className="mobile-send-wallet-text">EUR</span>
              <ChevronDown size={16} />
            </div>
            <div className="mobile-send-amount-display">$24,567.89</div>
            <div className="mobile-send-balance-text">Balance: 24,567.89 USDT</div>
          </div>

          {/* Recipient Details */}
          <div className="mobile-send-recipient-section">
            <div className="mobile-send-form-group">
              <label className="mobile-send-form-label">Full Name</label>
              <input
                type="text"
                className="mobile-send-form-input"
                placeholder="Enter your name"
                value={sendForm.fullName}
                onChange={(e) => setSendForm(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>

            <div className="mobile-send-form-group">
              <label className="mobile-send-form-label">Phone Number</label>
              <input
                type="text"
                className="mobile-send-form-input"
                placeholder="(+44)"
                value={sendForm.phoneNumber}
                onChange={(e) => setSendForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
              />
            </div>

            <div className="mobile-send-form-group">
              <label className="mobile-send-form-label">Wallet Address or Bank Account</label>
              <input
                type="text"
                className="mobile-send-form-input"
                placeholder="Enter Wallet Address or Bank Account"
                value={sendForm.walletAddress}
                onChange={(e) => setSendForm(prev => ({ ...prev, walletAddress: e.target.value }))}
              />
            </div>

            <div className="mobile-send-form-group">
              <label className="mobile-send-form-label">Reason for transfer (optional)</label>
              <input
                type="text"
                className="mobile-send-form-input"
                placeholder="Enter description"
                value={sendForm.reason}
                onChange={(e) => setSendForm(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>

          {/* Confirm Swap Button */}
          <div className="mobile-send-actions">
            <button 
              type="button" 
              className="mobile-send-confirm-btn"
              onClick={() => {
                // Handle confirm swap logic
                setShowSendPage(false);
                toast.success('Swap confirmed successfully');
              }}
            >
              Confirm Swap
            </button>
          </div>

          {/* Information Message */}
          <div className="mobile-send-info-message">
            <div className="mobile-send-info-icon">
              <Info size={16} />
            </div>
            <span>You'll receive at least 24,567 USDT ($24,567) or the transaction will be refunded</span>
          </div>
        </div>
      </div>
    );
  }

  // Render mobile fund wallet full page
  if (showFundWalletPage) {
    return (
      <div className="mobile-fund-wallet-full-page">
        <div className="mobile-fund-wallet-page-header">
          <div className="mobile-fund-wallet-page-title-wrapper">
            <div className="mobile-section-indicator"></div>
            <h2>Fund Wallet</h2>
          </div>
          <button 
            type="button" 
            className="mobile-fund-wallet-close-btn"
            onClick={() => setShowFundWalletPage(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mobile-fund-wallet-page-content">
          {/* Currency Selection */}
          <div className="mobile-fund-wallet-currency-section">
            <label className="mobile-fund-wallet-section-label">Currency</label>
            <div className="mobile-fund-wallet-currency-selector">
              <div className="mobile-fund-wallet-currency-icon">
                <img 
                  src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                  alt="XRP" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              </div>
              <span className="mobile-fund-wallet-currency-text">XRP wallet</span>
              <ChevronDown size={16} />
            </div>
          </div>

          {/* Amount Input */}
          <div className="mobile-fund-wallet-amount-section">
            <label className="mobile-fund-wallet-section-label">Amount</label>
            <div className="mobile-fund-wallet-amount-input-wrapper">
              <input
                type="text"
                className="mobile-fund-wallet-amount-input"
                placeholder="0"
                value={fundWalletAmount}
                onChange={(e) => {
                  // Only allow numbers and decimal point
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  setFundWalletAmount(value);
                }}
              />
              <span className="mobile-fund-wallet-amount-suffix">XRP</span>
            </div>
          </div>

          {/* Network Input */}
          <div className="mobile-fund-wallet-network-section">
            <label className="mobile-fund-wallet-section-label">Network</label>
            <input
              type="text"
              className="mobile-fund-wallet-network-input"
              placeholder="Enter your name"
              value={fundWalletNetwork}
              onChange={(e) => setFundWalletNetwork(e.target.value)}
            />
          </div>

          {/* Recipient Wallet Details */}
          <div className="mobile-fund-wallet-recipient-section">
            <label className="mobile-fund-wallet-section-label">Network</label>
            <div className="mobile-fund-wallet-address-wrapper">
              <div className="mobile-fund-wallet-qr-code">
                <QrCode size={80} />
              </div>
              <div className="mobile-fund-wallet-address-content">
                <div className="mobile-fund-wallet-address-text">
                  rEb8TK3gBgk5auZkwc6sHnw<br />
                  rGVJH8DuaLh
                </div>
                <button 
                  type="button"
                  className="mobile-fund-wallet-copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText('rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh');
                    toast.success('Address copied to clipboard');
                  }}
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Preview Transfer Button */}
          <div className="mobile-fund-wallet-actions">
            <button 
              type="button" 
              className="mobile-fund-wallet-preview-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Preview Transfer clicked, setting showFundWalletSummary to true');
                setShowFundWalletSummary(true);
              }}
            >
              Preview Transfer
            </button>
          </div>

          {/* Information Message */}
          <div className="mobile-fund-wallet-info-message">
            <div className="mobile-fund-wallet-info-icon">
              <Info size={16} />
            </div>
            <span>Recipient gets the funds immediately—or a full refund applies.</span>
          </div>
        </div>
      </div>
    );
  }

  // Render desktop savings dashboard
  if (showDesktopSavingsDashboard) {
    // Get current date
    const currentDate = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[currentDate.getDay()];
    const day = currentDate.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[currentDate.getMonth()];
    const formattedDate = `${dayName}, ${day}${suffix} ${monthName}`;

    // Mock data for savings dashboard
    const savingsAllocation = [
      { name: 'My Goals', amount: 16000, percentage: 65, color: '#2F74FF' },
      { name: 'House Rent', amount: 16000, percentage: 65, color: '#10b981' },
      { name: 'Expenses', amount: 16000, percentage: 65, color: '#9333ea' },
      { name: 'Set up', amount: 16000, percentage: 65, color: '#f59e0b' }
    ];

    const savingsWallets = [
      { name: 'My goals', percentage: '65%', saved: '$16,000', icon: Trophy, color: '#2F74FF' },
      { name: 'Utility', percentage: '15%', saved: '$4,000', icon: Home, color: '#10b981' },
      { name: 'Expenses', percentage: '15%', saved: '$4,000', icon: ShoppingBag, color: '#9333ea' },
      { name: 'Others', percentage: '15%', saved: '$4,000', icon: Package, color: '#f59e0b' }
    ];

    const cashflowData = [
      { month: 'Jan', saved: 40, withdrawn: 15 },
      { month: 'Feb', saved: 50, withdrawn: 20 },
      { month: 'Mar', saved: 80, withdrawn: 25 },
      { month: 'Apr', saved: 45, withdrawn: 18 },
      { month: 'May', saved: 55, withdrawn: 22 },
      { month: 'Jun', saved: 60, withdrawn: 20 }
    ];

    const savingHistory = [
      { id: 'F4E5D6...C1B2A3', amount: '$1,200', status: 'Successful', date: '2024-07-04', type: 'Received' },
      { id: 'F4E5D6...C1B2A3', amount: '$1,200', status: 'Successful', date: '2024-07-04', type: 'Received' },
      { id: 'F4E5D6...C1B2A3', amount: '$1,200', status: 'Successful', date: '2024-07-04', type: 'Received' },
      { id: 'F4E5D6...C1B2A3', amount: '$1,200', status: 'Successful', date: '2024-07-04', type: 'Received' },
      { id: 'F4E5D6...C1B2A3', amount: '$1,200', status: 'Successful', date: '2024-07-04', type: 'Received' }
    ];

    return (
      <div className="desktop-savings-dashboard">
        {/* Header */}
        <div className="desktop-savings-header">
          <div className="desktop-savings-header-left">
            <span className="desktop-savings-date">{formattedDate}</span>
          </div>
          <div className="desktop-savings-header-center">
            <div className="desktop-savings-search">
              <Search size={18} />
              <input type="text" placeholder="Search" />
            </div>
          </div>
          <div className="desktop-savings-header-right">
            <div className="desktop-savings-nav-tabs">
              <button 
                type="button" 
                className={`desktop-savings-nav-tab ${accountType === 'Personal' ? 'active' : ''}`}
                onClick={() => setAccountType('Personal')}
              >
                Personal
              </button>
              <button 
                type="button" 
                className={`desktop-savings-nav-tab ${accountType === 'Business Suite' ? 'active' : ''}`}
                onClick={() => setAccountType('Business Suite')}
              >
                Business suite
              </button>
            </div>
            <button 
              type="button" 
              className="desktop-savings-notification-btn"
              onClick={() => setShowNotificationModal(true)}
            >
              <Bell size={20} />
            </button>
            <div className="desktop-savings-user-profile">
              <div className="desktop-savings-user-avatar">
                {userAvatar ? (
                  <img src={userAvatar} alt={userFullName} />
                ) : (
                  userInitials
                )}
              </div>
              <div className="desktop-savings-user-info">
                <span className="desktop-savings-user-name">
                  {userFullName}
                  <img src={verifyBadge} alt="Verified" className="desktop-savings-verified-icon" />
                </span>
                <span className="desktop-savings-user-role">{userRole}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="desktop-savings-breadcrumb">
          <button 
            type="button"
            className="desktop-savings-back-btn"
            onClick={() => setShowDesktopSavingsDashboard(false)}
          >
            <ArrowLeft size={16} />
          </button>
          <span>General</span>
          <span className="desktop-savings-breadcrumb-separator">/</span>
          <span>Dashboard</span>
        </div>

        {/* Main Content */}
        <div className="desktop-savings-content">
          {/* Left Panel */}
          <div className="desktop-savings-left-panel">
            {/* Savings Allocation */}
            <div className="desktop-savings-section-card">
              <div className="desktop-savings-section-indicator"></div>
              <div className="desktop-savings-section-content">
                <h3 className="desktop-savings-section-title">Savings Allocation</h3>
                <p className="desktop-savings-section-subtitle">Total amount you have in your savings.</p>
                <div className="desktop-savings-total-amount">$24,567.89</div>
                <div className="desktop-savings-growth">
                  <TrendingUp size={14} />
                  <span>+3.1% This Month</span>
                </div>
                <div className="desktop-savings-allocation-bar">
                  {savingsAllocation.map((item, index) => (
                    <div 
                      key={index}
                      className="desktop-savings-allocation-segment"
                      style={{ 
                        width: `${item.percentage}%`, 
                        backgroundColor: item.color 
                      }}
                    />
                  ))}
                </div>
                <div className="desktop-savings-allocation-breakdown">
                  {savingsAllocation.map((item, index) => (
                    <div key={index} className="desktop-savings-allocation-item">
                      <div className="desktop-savings-allocation-item-header">
                        <div 
                          className="desktop-savings-allocation-dot"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="desktop-savings-allocation-name">{item.name}</span>
                      </div>
                      <div className="desktop-savings-allocation-item-details">
                        <span className="desktop-savings-allocation-amount">${item.amount.toLocaleString()}.00</span>
                        <span 
                          className="desktop-savings-allocation-percentage"
                          style={{ backgroundColor: `${item.color}20`, color: item.color }}
                        >
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Savings Wallet */}
            <div className="desktop-savings-section-card">
              <div className="desktop-savings-section-indicator"></div>
              <div className="desktop-savings-section-content">
                <div className="desktop-savings-wallet-header">
                  <h3 className="desktop-savings-section-title">Savings wallet</h3>
                  <button 
                    type="button" 
                    className="desktop-savings-add-wallet-btn"
                    onClick={() => setShowSavingsModal(true)}
                  >
                    + Add wallet
                  </button>
                </div>
                <div className="desktop-savings-wallet-grid">
                  {savingsWallets.map((wallet, index) => {
                    const Icon = wallet.icon;
                    return (
                      <div key={index} className="desktop-savings-wallet-card">
                        <div 
                          className="desktop-savings-wallet-icon"
                          style={{ backgroundColor: `${wallet.color}20` }}
                        >
                          <Icon size={20} style={{ color: wallet.color }} />
                        </div>
                        <div className="desktop-savings-wallet-name">{wallet.name}</div>
                        <div className="desktop-savings-wallet-percentage">{wallet.percentage}</div>
                        <div className="desktop-savings-wallet-saved">Saved: {wallet.saved}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="desktop-savings-actions-bottom">
                  <button 
                    type="button" 
                    className="desktop-savings-add-money-btn"
                    onClick={() => setShowSavingsModal(true)}
                  >
                    + Add money
                  </button>
                  <button 
                    type="button" 
                    className="desktop-savings-withdraw-btn"
                    onClick={() => setShowWithdrawWalletModal(true)}
                  >
                    <ArrowDown size={16} />
                    <Wallet size={16} />
                    Withdraw
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="desktop-savings-right-panel">
            {/* Cashflow */}
            <div className="desktop-savings-section-card">
              <div className="desktop-savings-section-indicator"></div>
              <div className="desktop-savings-section-content">
                <div className="desktop-savings-cashflow-header">
                  <h3 className="desktop-savings-section-title">Cashflow</h3>
                  <select className="desktop-savings-timeframe-select">
                    <option>Monthly</option>
                    <option>Weekly</option>
                    <option>Yearly</option>
                  </select>
                </div>
                <div className="desktop-savings-cashflow-legend">
                  <div className="desktop-savings-legend-item">
                    <div className="desktop-savings-legend-color" style={{ backgroundColor: '#2F74FF' }}></div>
                    <span>Amount Saved</span>
                  </div>
                  <div className="desktop-savings-legend-item">
                    <div className="desktop-savings-legend-color" style={{ backgroundColor: '#93c5fd' }}></div>
                    <span>Amount Withdrawn</span>
                  </div>
                </div>
                <div className="desktop-savings-cashflow-chart">
                  <div className="desktop-savings-chart-bars">
                    {cashflowData.map((data, index) => (
                      <div key={index} className="desktop-savings-chart-bar-group">
                        <div className="desktop-savings-chart-bar-wrapper">
                          <div 
                            className="desktop-savings-chart-bar saved"
                            style={{ height: `${data.saved}%` }}
                            title={`$${data.saved * 1000}`}
                          ></div>
                          <div 
                            className="desktop-savings-chart-bar withdrawn"
                            style={{ height: `${data.withdrawn}%` }}
                            title={`$${data.withdrawn * 1000}`}
                          ></div>
                        </div>
                        <div className="desktop-savings-chart-label">{data.month}</div>
                      </div>
                    ))}
                  </div>
                  <div className="desktop-savings-chart-y-axis">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Saving History */}
            <div className="desktop-savings-section-card">
              <div className="desktop-savings-section-indicator"></div>
              <div className="desktop-savings-section-content">
                <div className="desktop-savings-history-header">
                  <h3 className="desktop-savings-section-title">Saving history</h3>
                  <div className="desktop-savings-history-filters">
                    <select className="desktop-savings-filter-select">
                      <option>Filter</option>
                      <option>All</option>
                      <option>Received</option>
                      <option>Sent</option>
                    </select>
                    <select className="desktop-savings-filter-select">
                      <option>Monthly</option>
                      <option>Weekly</option>
                      <option>Yearly</option>
                    </select>
                    <button type="button" className="desktop-savings-filter-icon-btn">
                      <Filter size={18} />
                    </button>
                  </div>
                </div>
                <div className="desktop-savings-history-table-wrapper">
                  <table className="desktop-savings-history-table">
                    <thead>
                      <tr>
                        <th>
                          <input type="checkbox" />
                        </th>
                        <th>Transaction ID</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {savingHistory.map((transaction, index) => (
                        <tr key={index}>
                          <td>
                            <input type="checkbox" />
                          </td>
                          <td>
                            <div className="desktop-savings-transaction-type">
                              <ArrowDown size={14} />
                              <span>{transaction.type}</span>
                            </div>
                            <div className="desktop-savings-transaction-id">{transaction.id}</div>
                          </td>
                          <td className="desktop-savings-transaction-amount">{transaction.amount}</td>
                          <td>
                            <span className="desktop-savings-status-badge successful">{transaction.status}</span>
                          </td>
                          <td className="desktop-savings-transaction-date">{transaction.date}</td>
                          <td>
                            <button type="button" className="desktop-savings-transaction-arrow">
                              <ArrowRight size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="desktop-savings-pagination">
                  <button type="button" className="desktop-savings-pagination-btn">← Prev 10</button>
                  <div className="desktop-savings-pagination-pages">
                    <button type="button" className="desktop-savings-pagination-page">1</button>
                    <span className="desktop-savings-pagination-ellipsis">...</span>
                    <button type="button" className="desktop-savings-pagination-page">11</button>
                    <button type="button" className="desktop-savings-pagination-page active">12</button>
                    <button type="button" className="desktop-savings-pagination-page">13</button>
                    <button type="button" className="desktop-savings-pagination-page">14</button>
                    <button type="button" className="desktop-savings-pagination-page">15</button>
                    <button type="button" className="desktop-savings-pagination-page">16</button>
                    <button type="button" className="desktop-savings-pagination-page">17</button>
                    <button type="button" className="desktop-savings-pagination-page">18</button>
                  </div>
                  <button type="button" className="desktop-savings-pagination-btn">Next 10 →</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render mobile savings full page
  if (showSavingsPage) {
    return (
      <div className="mobile-savings-full-page">
        <div className="mobile-savings-page-header">
          <div className="mobile-savings-page-title-wrapper">
            <div className="mobile-section-indicator"></div>
            <h2>Fund Savings</h2>
          </div>
          <button 
            type="button" 
            className="mobile-savings-close-btn"
            onClick={() => setShowSavingsPage(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mobile-savings-page-content">
          {/* Amount Section */}
          <div className="mobile-savings-amount-section">
            <div className="mobile-savings-amount-header">
              <label className="mobile-savings-section-label">Amount</label>
              <div className="mobile-savings-wallet-selector-pill">
                <div className="mobile-savings-wallet-pill-badge">
                  <img 
                    src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                    alt="XRP" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                </div>
                <span className="mobile-savings-wallet-pill-text">XRP wallet</span>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="mobile-savings-amount-input-wrapper">
              <input
                type="text"
                className="mobile-savings-amount-input"
                placeholder="0"
                value={savingsAmount}
                onChange={(e) => {
                  // Only allow numbers and decimal point
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  setSavingsAmount(value);
                }}
              />
              <span className="mobile-savings-amount-suffix">XRP</span>
            </div>
            <div className="mobile-savings-amount-display">
              {(() => {
                if (!savingsAmount || savingsAmount === '0' || savingsAmount === '') {
                  return '$0.00';
                }
                // Calculate USD value from XRP using exchange rate
                const xrpAmount = parseFloat(savingsAmount) || 0;
                if (exchangeRates && exchangeRates.length > 0) {
                  const xrpToUsdRate = getExchangeRate('XRP', 'USD');
                  if (xrpToUsdRate) {
                    const usdValue = xrpAmount * Number(xrpToUsdRate);
                    return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  }
                }
                // Fallback calculation (approximate rate)
                const usdValue = xrpAmount * 0.5430;
                return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              })()}
            </div>
            <div className="mobile-savings-balance-text">Balance: 24,567.89 XRP</div>
          </div>

          {/* Saving Accounts Section */}
          <div className="mobile-savings-accounts-section">
            <label className="mobile-savings-section-label">Saving accounts</label>
            <div className="mobile-savings-account-link">
              <span className="mobile-savings-account-link-text">My Goals</span>
              <ChevronDown size={16} />
            </div>
          </div>

          {/* Transfer Button */}
          <div className="mobile-savings-actions">
            <button 
              type="button" 
              className="mobile-savings-transfer-btn"
              onClick={() => {
                setShowSavingsSummary(true);
              }}
            >
              Transfer
            </button>
          </div>

          {/* Information Message */}
          <div className="mobile-savings-info-message">
            <div className="mobile-savings-info-icon">
              <Info size={16} />
            </div>
            <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Header - Only visible on mobile */}
      <div className="mobile-dashboard-header transactions-mobile-header">
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
              {isLoadingUserProfile ? 'Loading...' : userFullName}
              <img src={verifyBadge} alt="Verified" className="mobile-user-verified-icon" />
            </span>
            <span className="mobile-user-role">
              {isLoadingUserProfile ? 'Loading...' : userRole}
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
              <span className="mobile-sidebar-trustiscore-badge">97</span>
            </div>

            <button type="button" className="mobile-sidebar-logout">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard transactions-page">
        <aside className="dashboard-sidebar">
        <div className="sidebar-branding">
          <img src={logo} alt="TrustiChain" className="sidebar-logo" />
          <div className="sidebar-branding-text">
            <span className="sidebar-title">TrustiChain</span>
            <span className="sidebar-tagline">Secure escrow platform</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-section-label">{accountType === 'Business Suite' ? 'Business Suite' : 'General'}</p>
          <nav className="sidebar-nav">
            {(accountType === 'Business Suite' ? businessSuiteNav : sidebarNav).map((item) => {
              const Icon = item.icon;
              const isActive = (item.label === 'Dashboard' && location.pathname === '/dashboard') ||
                               (item.label === 'My Escrow' && location.pathname === '/my-escrow') ||
                               (item.label === 'Transactions' && location.pathname === '/transactions') ||
                               (item.label === 'Dispute' && location.pathname === '/dispute') ||
                               (item.label === 'Trusticard' && location.pathname === '/trusticard');
              const handleNavClick = () => {
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
                } else if (item.label === 'Dispute') {
                  navigate('/dispute');
                }
              };
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {accountType === 'Business Suite' && (
          <div className="sidebar-section">
            <p className="sidebar-section-label">Developers Tool</p>
            <nav className="sidebar-nav">
              {developersNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} type="button" className="sidebar-nav-item">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        <div className="sidebar-section">
          <p className="sidebar-section-label">Support</p>
          <nav className="sidebar-nav">
            {supportNav.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} type="button" className="sidebar-nav-item">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-bottom-section">
          <div className="sidebar-help-card">
            <div className="help-icon-large">
              <HelpCircle size={24} />
            </div>
            <h3>Help Center</h3>
            <p>Having trouble in Trustichain? Please contact us</p>
            <button type="button" className="help-cta">
              Contact us
            </button>
          </div>

          <div className="sidebar-trustiscore">
            <span className="trustiscore-label">Trustiscore</span>
            <span className="trustiscore-badge">97</span>
          </div>

          <button type="button" className="sidebar-logout">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-info">
            <p className="header-date">{formattedToday}</p>
            <h1>Welcome Back !</h1>
          </div>

          <div className="header-search-group">
            <label className="header-search">
              <input type="text" placeholder="Search" />
            </label>
            <span className="search-divider" aria-hidden="true" />
            <button type="button" className="search-icon-btn">
              <Search size={18} />
            </button>
          </div>

          <div className="header-actions">
            <div className="account-type-buttons">
              <button 
                type="button" 
                className={`account-type-btn ${accountType === 'Personal' ? 'active' : ''}`}
                onClick={() => setAccountType('Personal')}
              >
                Personal
              </button>
              <button 
                type="button" 
                className={`account-type-btn ${accountType === 'Business Suite' ? 'active' : ''}`}
                onClick={() => setAccountType('Business Suite')}
              >
                Business Suite
              </button>
            </div>
            <button type="button" className="header-bell" onClick={() => setShowNotificationModal(true)}>
              <Bell size={18} />
            </button>
            <div className="header-user">
              <div className="user-avatar">{userInitials}</div>
              <div className="user-info">
                <span className="user-name">
                  {isLoadingUserProfile ? 'Loading...' : userFullName}
                  <img src={verifyBadge} alt="Verified" className="user-verified-icon" />
                </span>
                <small>Freelancer</small>
              </div>
            </div>
          </div>
        </header>

        <div className="transactions-content">
          {/* Breadcrumb */}
          <div className="card-breadcrumb">
            <span className="breadcrumb-root">General</span>
            <span className="breadcrumb-divider">›</span>
            <span className="breadcrumb-current">Transactions</span>
          </div>

          {/* Summary Cards Row - Like Dashboard */}
          <div className="dashboard-summary-cards">
            {/* Total Balance Card */}
            <div className="summary-card total-balance-card">
              <div className="summary-card-header">
                <h3>Total Balance</h3>
                <button type="button" onClick={() => setShowBalance(!showBalance)} className="eye-toggle">
                  {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              <div className="summary-card-value-row">
                <div className="summary-card-value">
                  {showBalance 
                    ? (isLoadingDashboard 
                        ? 'Loading...' 
                        : (() => {
                            // Calculate USD value from XRP using exchange rate from API
                            if (dashboardData?.balance?.xrp !== undefined && dashboardData?.balance?.xrp !== null && exchangeRates && exchangeRates.length > 0) {
                              // Try to find XRP to USD rate
                              const xrpToUsdRate = getExchangeRate('XRP', 'USD');
                              if (xrpToUsdRate) {
                                const usdValue = Number(dashboardData.balance.xrp) * Number(xrpToUsdRate);
                                return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                              }
                              // Fallback: try to find USD rate from exchange rates array
                              const usdRate = exchangeRates.find(r => 
                                (r.from === 'XRP' && r.to === 'USD') || 
                                (r.currency === 'USD' || r.code === 'USD')
                              );
                              if (usdRate && usdRate.rate) {
                                const usdValue = Number(dashboardData.balance.xrp) * Number(usdRate.rate);
                                return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                              }
                            }
                            // Fallback to dashboard USD if available
                            if (dashboardData?.balance?.usd !== undefined && dashboardData?.balance?.usd !== null) {
                              return `$${Number(dashboardData.balance.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            }
                            return '$0.00';
                          })())
                    : '••••••'}
                </div>
                <div className="summary-card-subvalue">
                  ≈ {isLoadingDashboard 
                      ? 'Loading...' 
                      : (dashboardData?.balance?.xrp !== undefined && dashboardData?.balance?.xrp !== null 
                          ? Number(dashboardData.balance.xrp).toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 }) 
                          : '0.000000')} XRP
                </div>
              </div>
              <div className="summary-card-actions">
                <button 
                  type="button" 
                  className="summary-card-btn primary"
                  onClick={() => {
                    // On mobile, show full page; on desktop, show modal
                    if (window.innerWidth <= 768) {
                      setShowFundWalletPage(true);
                    } else {
                      setShowFundWalletModal(true);
                    }
                  }}
                >
                  + Fund Wallet
                </button>
                <button 
                  type="button" 
                  className="summary-card-btn secondary"
                  onClick={() => setShowSwapModal(true)}
                >
                  <Repeat size={16} />
                  Swap
                </button>
                <button 
                  type="button" 
                  className="summary-card-btn secondary"
                  onClick={() => setShowWithdrawWalletModal(true)}
                >
                  + Withdraw
                </button>
              </div>
            </div>

            {/* Wallet Summary Cards */}
            <div className="wallet-cards-grid">
              <div className="wallet-overview-card">
                <div className="wallet-overview-header">
                  <div className="wallet-overview-icon">
                    <img 
                      src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                      alt="XRP" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <h3 className="wallet-overview-name">XRP wallet</h3>
                </div>
                <div className="wallet-overview-content">
                  <div className="wallet-overview-primary">
                    {showBalance 
                      ? (isLoadingWalletBalances 
                          ? 'Loading...' 
                          : (walletBalances?.xrp !== undefined && walletBalances?.xrp !== null
                              ? `${Number(walletBalances.xrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP`
                              : '0.00 XRP'))
                      : '••••••'}
                  </div>
                  <div className="wallet-overview-secondary">
                    {showBalance 
                      ? (isLoadingWalletBalances 
                          ? 'Loading...' 
                          : (() => {
                              // Calculate USD value from XRP using exchange rate from API
                              if (walletBalances?.xrp !== undefined && walletBalances?.xrp !== null && exchangeRates && exchangeRates.length > 0) {
                                // Try to find XRP to USD rate
                                const xrpToUsdRate = getExchangeRate('XRP', 'USD');
                                if (xrpToUsdRate) {
                                  const usdValue = Number(walletBalances.xrp) * Number(xrpToUsdRate);
                                  return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                }
                                // Fallback: try to find USD rate from exchange rates array
                                const usdRate = exchangeRates.find(r => 
                                  (r.from === 'XRP' && r.to === 'USD') || 
                                  (r.currency === 'USD' || r.code === 'USD')
                                );
                                if (usdRate && usdRate.rate) {
                                  const usdValue = Number(walletBalances.xrp) * Number(usdRate.rate);
                                  return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                }
                              }
                              return '$0.00';
                            })())
                      : '••••••'}
                  </div>
                </div>
                <div className="wallet-overview-trend">
                  <TrendingUp size={14} />
                  <span>+2.4%</span>
                </div>
              </div>

              <div className="wallet-overview-card">
                <div className="wallet-overview-header">
                  <div className="wallet-overview-icon usdt-icon">
                    <img 
                      src="https://assets.coingecko.com/coins/images/325/small/Tether-logo.png" 
                      alt="USDT" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  </div>
                  <h3 className="wallet-overview-name">Tether USD</h3>
                </div>
                <div className="wallet-overview-content">
                  <div className="wallet-overview-primary">
                    {showBalance 
                      ? (isLoadingWalletBalances 
                          ? 'Loading...' 
                          : (walletBalances?.usdt !== undefined && walletBalances?.usdt !== null
                              ? `${Number(walletBalances.usdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                              : '0.00 USDT'))
                      : '••••••'}
                  </div>
                  <div className="wallet-overview-secondary">
                    {showBalance 
                      ? (isLoadingWalletBalances 
                          ? 'Loading...' 
                          : (walletBalances?.usdt !== undefined && walletBalances?.usdt !== null
                              ? `$${Number(walletBalances.usdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : '$0.00'))
                      : '••••••'}
                  </div>
                </div>
                <div className="wallet-overview-trend">
                  <TrendingUp size={14} />
                  <span>+2.4%</span>
                </div>
              </div>

              <div className="wallet-overview-card">
                <div className="wallet-overview-header">
                  <div className="wallet-overview-icon">
                    <img 
                      src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389" 
                      alt="USDC" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  </div>
                  <h3 className="wallet-overview-name">USD Coin</h3>
                </div>
                <div className="wallet-overview-content">
                  <div className="wallet-overview-primary">
                    {showBalance 
                      ? (isLoadingWalletBalances 
                          ? 'Loading...' 
                          : (walletBalances?.usdc !== undefined && walletBalances?.usdc !== null
                              ? `${Number(walletBalances.usdc).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
                              : '0.00 USDC'))
                      : '••••••'}
                  </div>
                  <div className="wallet-overview-secondary">
                    {showBalance 
                      ? (isLoadingWalletBalances 
                          ? 'Loading...' 
                          : (walletBalances?.usdc !== undefined && walletBalances?.usdc !== null
                              ? `$${Number(walletBalances.usdc).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : '$0.00'))
                      : '••••••'}
                  </div>
                </div>
                <div className="wallet-overview-trend">
                  <TrendingUp size={14} />
                  <span>+2.4%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="transactions-middle">
            {/* Left Column */}
            <div className="transactions-left-column">
              {/* My Details Section */}
              <div className="transactions-section-card my-details-section">
                <div className="section-indicator"></div>
                <div className="section-content">
                  <h3 className="section-title">My Details</h3>
                  <div className="details-list">
                    <div className="detail-item">
                      <div className="detail-icon">
                        <Building2 size={18} />
                      </div>
                      <div className="detail-info detail-info-horizontal">
                        <span className="detail-label">Linked bank account</span>
                        <span className="detail-value">{linkedAccounts?.bankAccount || '9832547364'}</span>
                      </div>
                    </div>
                    <div className="detail-divider"></div>
                    <div className="detail-item">
                      <div className="detail-icon">
                        <Wallet size={18} />
                      </div>
                      <div className="detail-info detail-info-horizontal">
                        <span className="detail-label">Linked Web3 Wallet</span>
                        <span className="detail-value">{linkedAccounts?.web3Wallet || 'XUMM (Connected)'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Beneficiaries Section */}
              <div className="transactions-section-card beneficiaries-card">
                <div className="section-content">
                  <div className="beneficiaries-title-wrapper">
                    <div className="beneficiaries-indicator"></div>
                    <h3 className="section-title">Beneficiaries</h3>
                  </div>
                  <div className="beneficiaries-container">
                    <div className="beneficiaries-avatars">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="beneficiary-placeholder"></div>
                      ))}
                    </div>
                    <button 
                      type="button" 
                      className="send-beneficiary-btn" 
                      onClick={() => {
                        // On mobile, show full page; on desktop, show modal
                        if (window.innerWidth <= 768) {
                          setShowSendPage(true);
                        } else {
                          setShowSendModal(true);
                        }
                      }}
                    >
                      <ExternalLink size={18} />
                      Send
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Exchange Rate Section */}
              <div className="transactions-section-card">
                <div className="section-indicator"></div>
                <div className="section-content">
                  <h3 className="section-title">Live Exchange Rate</h3>
                  <div className="rate-list">
                    {isLoadingRates && (
                      <div className="rate-item">
                        <div className="rate-info">
                          <span className="rate-currency">Loading rates...</span>
                        </div>
                      </div>
                    )}

                    {!isLoadingRates && Array.isArray(exchangeRates) && exchangeRates.length > 0 && exchangeRates.map((rate, index) => {
                      const code = (rate.currency || rate.code || '').toUpperCase();
                      const change = Number(rate.changePercent ?? rate.change ?? 0);
                      const isPositive = change > 0;
                      const isNegative = change < 0;
                      const flagCode =
                        code === 'USD' ? 'us' :
                        code === 'EUR' ? 'eu' :
                        code === 'GBP' ? 'gb' :
                        code === 'JPY' ? 'jp' :
                        code === 'NGN' ? 'ng' :
                        code === 'CAD' ? 'ca' :
                        code === 'AUD' ? 'au' :
                        code === 'CNY' ? 'cn' :
                        'us';

                      const symbol =
                        code === 'USD' ? '$' :
                        code === 'EUR' ? '€' :
                        code === 'GBP' ? '£' :
                        code === 'JPY' ? '¥' :
                        '';

                      return (
                        <div className="rate-item" key={`${code}-${index}`}>
                          <div className="rate-flag">
                            <img src={`https://flagcdn.com/w40/${flagCode}.png`} alt={code} />
                          </div>
                          <div className="rate-info">
                            <span className="rate-currency">{code}</span>
                          </div>
                          <div className="rate-value-change">
                            <span className="rate-value">
                              {symbol}{Number(rate.rate ?? rate.value ?? 0).toFixed(4)}
                            </span>
                            <div className={`rate-change ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
                              {isPositive && <TrendingUp size={14} />}
                              {isNegative && <TrendingDown size={14} />}
                              <span>
                                {change === 0 ? '0.0%' : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {!isLoadingRates && (!Array.isArray(exchangeRates) || exchangeRates.length === 0) && (
                      <div className="rate-item">
                        <div className="rate-info">
                          <span className="rate-currency">No exchange rates available</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* My Goals and My Savings Container - Mobile Only */}
              <div className="mobile-goals-savings-container">
                {/* My Goals Section */}
                <div className="mobile-goals-card">
                  <div className="mobile-goals-header">
                    <div className="mobile-section-indicator"></div>
                    <h3 className="mobile-section-title">My Goals</h3>
                  </div>
                  <div className="mobile-goals-content">
                    <div className="mobile-goals-progress">50% Complete</div>
                    <div className="mobile-goals-amount">$75,000</div>
                    <div className="mobile-goals-target">$150,000</div>
                  </div>
                </div>

                {/* My Savings Section */}
                <div className="mobile-savings-card">
                  <div className="mobile-savings-header">
                    <div className="mobile-savings-title-wrapper">
                      <div className="mobile-section-indicator"></div>
                      <h3 className="mobile-section-title">My Savings</h3>
                    </div>
                    <ArrowRight 
                      size={16} 
                      className="mobile-savings-arrow" 
                      onClick={() => setShowSavingsPage(true)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                  <div className="mobile-savings-content">
                    <div className="mobile-savings-badge">
                      <TrendingUp size={12} />
                      <span>+2.4%</span>
                    </div>
                    <div className="mobile-savings-amount">$12,500.00</div>
                    <div className="mobile-savings-wallets">4 savings wallets</div>
                  </div>
                </div>
              </div>

              {/* My Goals and My Savings - Desktop Only */}
              <div className="desktop-goals-savings-container">
                {/* My Goals Section */}
                <div className="desktop-goals-card">
                  <div className="desktop-goals-header">
                    <div className="desktop-section-indicator"></div>
                    <h3 className="desktop-section-title">My Goals</h3>
                  </div>
                  <div className="desktop-goals-content">
                    <div className="desktop-goals-progress">50% Complete</div>
                    <div className="desktop-goals-amount">$75,000</div>
                    <div className="desktop-goals-target">$150,000</div>
                  </div>
                </div>

                {/* My Savings Section */}
                <div className="desktop-savings-card" onClick={() => setShowDesktopSavingsDashboard(true)} style={{ cursor: 'pointer' }}>
                  <div className="desktop-savings-header">
                    <div className="desktop-savings-title-wrapper">
                      <div className="desktop-section-indicator"></div>
                      <h3 className="desktop-section-title">My Savings</h3>
                    </div>
                  </div>
                  <div className="desktop-savings-content">
                    <div className="desktop-savings-badge">
                      <TrendingUp size={14} />
                      <span>+2.4%</span>
                    </div>
                    <div className="desktop-savings-amount">$12,500.00</div>
                    <div className="desktop-savings-wallets">4 savings wallets</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="transactions-right-column">
              {/* Transaction History Section */}
              <div className="transactions-section-card">
                <div className="section-indicator"></div>
                <div className="section-content">
                  <div className="transaction-history-header">
                    <div className="transaction-history-title-wrapper">
                      <h3 className="section-title">Transaction history</h3>
                      <ArrowRight size={20} className="transaction-history-arrow" />
                    </div>
                    <div className="transaction-filters">
                      <select 
                        className="filter-select"
                        value={transactionFilter}
                        onChange={(e) => setTransactionFilter(e.target.value)}
                      >
                        <option value="All">Filter</option>
                        <option value="Received">Received</option>
                        <option value="Sent">Sent</option>
                        <option value="All">All</option>
                      </select>
                      <select 
                        className="filter-select"
                        value={monthlyFilter}
                        onChange={(e) => setMonthlyFilter(e.target.value)}
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="This month">This month</option>
                        <option value="Last month">Last month</option>
                      </select>
                      <button type="button" className="filter-icon-btn">
                        <Filter size={18} />
                      </button>
                    </div>
                  </div>
                  {/* Mobile Transaction Cards */}
                  <div className="mobile-transaction-cards">
                    {isLoadingTransactions && (
                      <div className="mobile-transaction-card">
                        <div className="mobile-transaction-content">
                          <span>Loading transactions...</span>
                        </div>
                      </div>
                    )}
                    {!isLoadingTransactions && transactions.length === 0 && (
                      <div className="mobile-transaction-card">
                        <div className="mobile-transaction-content">
                          <span>No transactions found</span>
                        </div>
                      </div>
                    )}
                    {!isLoadingTransactions && transactions.length > 0 && paginatedTransactions.length > 0 && paginatedTransactions.map((transaction, index) => {
                      const globalIndex = (currentPage - 1) * itemsPerPage + index;
                      const transactionId = formatTransactionId(transaction.id || transaction.transactionId || `TXN-${globalIndex}`);
                      const type = transaction.type || transaction.transactionType || 'Received';
                      const amountXrp = transaction.amount?.xrp || transaction.amountXrp || transaction.amount || 0;
                      const amountUsd = transaction.amount?.usd || transaction.amountUsd || (amountXrp * 0.5);
                      const status = transaction.status || 'Successful';
                      const date = transaction.date || transaction.createdAt || '2024-07-04';
                      const isReceived = type.toLowerCase().includes('received') || type.toLowerCase() === 'credit';

                      return (
                        <div key={transaction.id || globalIndex} className="mobile-transaction-card">
                          <div className="mobile-transaction-left">
                            <div className={`mobile-transaction-icon ${isReceived ? 'received' : 'sent'}`}>
                              {isReceived ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                            </div>
                            <div className="mobile-transaction-type">{type}</div>
                          </div>
                          <div className="mobile-transaction-center">
                            <div className="mobile-transaction-details">
                              {isReceived ? 'You received' : 'You sent'} {Number(amountXrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP, worth ${Number(amountUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD.
                            </div>
                          </div>
                          <div className="mobile-transaction-right">
                            <div className={`mobile-transaction-status ${status.toLowerCase() === 'successful' || status.toLowerCase() === 'completed' ? 'successful' : 'pending'}`}>
                              {status}
                            </div>
                            <div className="mobile-transaction-date">{formatDate(date)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="transaction-table-wrapper">
                    <table className="transaction-table">
                      <thead>
                        <tr>
                          <th>
                            <input type="checkbox" />
                          </th>
                          <th>Transaction ID</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingTransactions && (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                              Loading transactions...
                            </td>
                          </tr>
                        )}
                        {!isLoadingTransactions && transactions.length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                              No transactions found
                            </td>
                          </tr>
                        )}
                        {!isLoadingTransactions && transactions.length > 0 && paginatedTransactions.length > 0 && paginatedTransactions.map((transaction, index) => {
                          const globalIndex = (currentPage - 1) * itemsPerPage + index;
                          const transactionId = formatTransactionId(transaction.id || transaction.transactionId || `TXN-${globalIndex}`);
                          const type = transaction.type || transaction.transactionType || 'Received';
                          const amountXrp = transaction.amount?.xrp || transaction.amountXrp || transaction.amount || 0;
                          const amountUsd = transaction.amount?.usd || transaction.amountUsd || (amountXrp * 0.5);
                          const status = transaction.status || 'Successful';
                          const date = transaction.date || transaction.createdAt || '2024-07-04';
                          const isReceived = type.toLowerCase().includes('received') || type.toLowerCase() === 'credit';

                          return (
                            <tr key={transaction.id || globalIndex}>
                              <td>
                                <input type="checkbox" />
                              </td>
                              <td>
                                <div className="transaction-id-with-type">
                                  <div className="transaction-type-indicator">
                                    {isReceived ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                                    <span>{type}</span>
                                  </div>
                                  <div className="transaction-id-cell">{transactionId}</div>
                                </div>
                              </td>
                              <td>
                                <div className="transaction-amount-cell">
                                  <span className={isReceived ? 'amount-positive' : 'amount-negative'}>
                                    {isReceived ? '+' : '-'}{Number(amountXrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP
                                  </span>
                                  <span className="amount-usd">(${Number(amountUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)</span>
                                </div>
                              </td>
                              <td>
                                <span className={`status-badge ${status.toLowerCase() === 'successful' || status.toLowerCase() === 'completed' ? 'successful' : 'pending'}`}>
                                  {status}
                                </span>
                              </td>
                              <td>
                                <div className="transaction-date-cell">{formatDate(date)}</div>
                              </td>
                              <td>
                                <div className="transaction-direction-icon">
                                  {globalIndex % 2 === 0 ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {!isLoadingTransactions && transactions.length > 0 && (
                    <div className="transaction-pagination">
                      <div className="pagination-info">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, transactions.length)} of {transactions.length} transactions
                      </div>
                      <div className="pagination-controls">
                        <button
                          type="button"
                          className="pagination-btn"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ArrowLeft size={16} />
                          Previous
                        </button>
                        <div className="pagination-pages">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={page}
                                  type="button"
                                  className={`pagination-page-btn ${currentPage === page ? 'active' : ''}`}
                                  onClick={() => setCurrentPage(page)}
                                >
                                  {page}
                                </button>
                              );
                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                              return <span key={page} className="pagination-ellipsis">...</span>;
                            }
                            return null;
                          })}
                        </div>
                        <button
                          type="button"
                          className="pagination-btn"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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

      {/* Fund Wallet Modal */}
      {showFundWalletModal && (
        <div className="notification-modal-overlay" onClick={() => {
          if (!isFundingWallet || fundingStep === 'idle') {
            setShowFundWalletModal(false);
            setFundWalletForm({ amount: '', currency: 'XRP' });
            setTransactionData(null);
            setFundingStep('idle');
            setIsFundingWallet(false);
          }
        }}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <div className="notification-header-content">
                <div className="notification-header-accent"></div>
                <h2>Fund Wallet</h2>
              </div>
              <button 
                type="button" 
                className="notification-close-btn" 
                onClick={() => {
                  setShowFundWalletModal(false);
                  setFundWalletForm({ amount: '', currency: 'XRP' });
                  setTransactionData(null);
                  setFundingStep('idle');
                  setIsFundingWallet(false);
                }}
                disabled={isFundingWallet && fundingStep !== 'idle'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Progress Indicator */}
            {isFundingWallet && fundingStep !== 'idle' && (
              <div className="fund-wallet-progress" style={{ padding: '15px 20px', borderBottom: '1px solid #e0e0e0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: fundingStep === 'preparing' ? '#4f46e5' : fundingStep === 'signing' ? '#4f46e5' : fundingStep === 'completing' ? '#4f46e5' : '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {fundingStep === 'preparing' ? '1' : fundingStep === 'signing' ? '2' : fundingStep === 'completing' ? '3' : ''}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    {fundingStep === 'preparing' && 'Preparing transaction...'}
                    {fundingStep === 'signing' && (
                      transactionData?.xummUrl 
                        ? 'Please sign in your Xaman wallet...' 
                        : 'Please sign in your browser wallet (Crossmark)...'
                    )}
                    {fundingStep === 'completing' && 'Completing transaction...'}
                  </span>
                </div>
                {fundingStep === 'signing' && (
                  <div style={{ fontSize: '12px', color: '#666', marginLeft: '30px' }}>
                    {transactionData?.xummUrl 
                      ? 'A window should open to your Xaman wallet. Please sign the transaction there.'
                      : 'Please approve the transaction in your Crossmark wallet extension popup.'
                    }
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleFundWallet} className="fund-wallet-form">
              <div className="form-group">
                <label htmlFor="fund-amount">Amount</label>
                <input
                  id="fund-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Enter amount"
                  value={fundWalletForm.amount}
                  onChange={(e) => setFundWalletForm(prev => ({ ...prev, amount: e.target.value }))}
                  required
                  disabled={isFundingWallet}
                />
              </div>

              <div className="form-group">
                <label htmlFor="fund-currency">Wallets</label>
                <select
                  id="fund-currency"
                  value={fundWalletForm.currency}
                  onChange={(e) => setFundWalletForm(prev => ({ ...prev, currency: e.target.value }))}
                  disabled={isFundingWallet}
                >
                  <option value="XRP">XRP</option>
                  <option value="USDT">USDT</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>

              <div className="fund-wallet-actions">
                <button
                  type="button"
                  className="fund-wallet-btn cancel"
                  onClick={() => {
                    setShowFundWalletModal(false);
                    setFundWalletForm({ amount: '', currency: 'XRP' });
                    setTransactionData(null);
                    setFundingStep('idle');
                    setIsFundingWallet(false);
                  }}
                  disabled={isFundingWallet && fundingStep !== 'idle'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fund-wallet-btn primary"
                  disabled={isFundingWallet}
                >
                  {fundingStep === 'preparing' && 'Preparing...'}
                  {fundingStep === 'signing' && 'Waiting for signature...'}
                  {fundingStep === 'completing' && 'Completing...'}
                  {!isFundingWallet && 'Fund Wallet'}
                  {isFundingWallet && fundingStep === 'idle' && 'Processing...'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Wallet Modal */}
      {showWithdrawWalletModal && (
        <div className="notification-modal-overlay" onClick={() => {
          if (!isWithdrawingWallet) {
            setShowWithdrawWalletModal(false);
            setWithdrawWalletForm({
              amount: '',
              currency: 'USD',
              destinationAddress: ''
            });
          }
        }}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <div className="notification-header-content">
                <div className="notification-header-accent"></div>
                <h2>Withdraw</h2>
              </div>
              <button 
                type="button" 
                className="notification-close-btn" 
                onClick={() => {
                  setShowWithdrawWalletModal(false);
                  setWithdrawWalletForm({
                    amount: '',
                    currency: 'USD',
                    destinationAddress: ''
                  });
                }}
                disabled={isWithdrawingWallet}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleWithdrawWallet} className="fund-wallet-form">
              <div className="form-group">
                <label htmlFor="withdraw-amount">Amount</label>
                <input
                  id="withdraw-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Enter amount"
                  value={withdrawWalletForm.amount}
                  onChange={(e) => setWithdrawWalletForm(prev => ({ ...prev, amount: e.target.value }))}
                  required
                  disabled={isWithdrawingWallet}
                />
              </div>

              <div className="form-group">
                <label htmlFor="withdraw-currency">Currency</label>
                <select
                  id="withdraw-currency"
                  value={withdrawWalletForm.currency}
                  onChange={(e) => setWithdrawWalletForm(prev => ({ ...prev, currency: e.target.value }))}
                  disabled={isWithdrawingWallet}
                >
                  <option value="USD">USD</option>
                  <option value="XRP">XRP</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="withdraw-destination">Destination Address</label>
                <input
                  id="withdraw-destination"
                  type="text"
                  placeholder="Enter destination wallet address"
                  value={withdrawWalletForm.destinationAddress}
                  onChange={(e) => setWithdrawWalletForm(prev => ({ ...prev, destinationAddress: e.target.value }))}
                  required
                  disabled={isWithdrawingWallet}
                />
              </div>

              <div className="fund-wallet-actions">
                <button
                  type="button"
                  className="fund-wallet-btn cancel"
                  onClick={() => {
                    setShowWithdrawWalletModal(false);
                    setWithdrawWalletForm({
                      amount: '',
                      currency: 'USD',
                      destinationAddress: ''
                    });
                  }}
                  disabled={isWithdrawingWallet}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fund-wallet-btn primary"
                  disabled={isWithdrawingWallet}
                >
                  {isWithdrawingWallet ? 'Processing...' : 'Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Swap Modal */}
      {showSwapModal && (
        <div className="notification-modal-overlay" onClick={() => {
          if (!isSwapping) {
            setShowSwapModal(false);
            setSwapForm({
              fromCurrency: 'XRP',
              toCurrency: 'USDT',
              fromAmount: '',
              toAmount: ''
            });
          }
        }}>
          <div className="notification-modal swap-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <div className="notification-header-content">
                <div className="notification-header-accent"></div>
                <h2>Swap</h2>
              </div>
              <button 
                type="button" 
                className="notification-close-btn" 
                onClick={() => {
                  setShowSwapModal(false);
                  setSwapForm({
                    fromCurrency: 'XRP',
                    toCurrency: 'USDT',
                    fromAmount: '',
                    toAmount: ''
                  });
                }}
                disabled={isSwapping}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePreviewSwap} className="swap-form">
              <div className="swap-container">
                {/* From Section */}
                <div className="swap-section">
                  <div className="swap-section-header">
                    <label className="swap-section-label">From</label>
                    <div className="swap-currency-selector-wrapper">
                    <select
                      id="swap-from-currency"
                      className="swap-currency-select"
                      value={swapForm.fromCurrency}
                      onChange={(e) => handleSwapCurrencyChange('fromCurrency', e.target.value)}
                      disabled={isSwapping}
                    >
                      <option value="XRP">XRP</option>
                      <option value="USDT">USDT</option>
                      <option value="USDC">USDC</option>
                    </select>
                    <div className="swap-currency-selector">
                      <div className={`swap-currency-badge ${swapForm.fromCurrency === 'USDT' ? 'usdt-badge' : ''}`}>
                        {swapForm.fromCurrency === 'XRP' ? (
                          <img 
                            src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                            alt="XRP" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : swapForm.fromCurrency === 'USDT' ? (
                          <img 
                            src="https://assets.coingecko.com/coins/images/325/small/Tether-logo.png" 
                            alt="USDT" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : swapForm.fromCurrency === 'USDC' ? (
                          <img 
                            src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389" 
                            alt="USDC" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : (
                          getCurrencyBadge(swapForm.fromCurrency)
                        )}
                      </div>
                      <span className="swap-currency-name">{getCurrencyDisplayName(swapForm.fromCurrency)}</span>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  </div>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    className="swap-amount-input"
                    placeholder="0.00"
                    value={swapForm.fromAmount}
                    onChange={(e) => handleSwapAmountChange('fromAmount', e.target.value)}
                    disabled={isSwapping}
                  />
                  <div className="swap-balance-text">
                    Balance: {isLoadingWalletBalances ? 'Loading...' : `${Number(getCurrencyBalance(swapForm.fromCurrency)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${swapForm.fromCurrency}`}
                  </div>
                </div>

                {/* Swap Icon Button */}
                <button
                  type="button"
                  className="swap-icon-button"
                  onClick={handleSwapCurrencies}
                  disabled={isSwapping}
                >
                  <ArrowUpDown size={20} />
                </button>

                {/* To Section */}
                <div className="swap-section">
                  <div className="swap-section-header">
                    <label className="swap-section-label">To</label>
                    <div className="swap-currency-selector-wrapper">
                    <select
                      id="swap-to-currency"
                      className="swap-currency-select"
                      value={swapForm.toCurrency}
                      onChange={(e) => handleSwapCurrencyChange('toCurrency', e.target.value)}
                      disabled={isSwapping}
                    >
                      <option value="XRP">XRP</option>
                      <option value="USDT">USDT</option>
                      <option value="USDC">USDC</option>
                    </select>
                    <div className="swap-currency-selector">
                      <div className={`swap-currency-badge ${swapForm.toCurrency === 'USDT' ? 'usdt-badge' : ''}`}>
                        {swapForm.toCurrency === 'XRP' ? (
                          <img 
                            src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                            alt="XRP" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : swapForm.toCurrency === 'USDT' ? (
                          <img 
                            src="https://assets.coingecko.com/coins/images/325/small/Tether-logo.png" 
                            alt="USDT" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : swapForm.toCurrency === 'USDC' ? (
                          <img 
                            src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389" 
                            alt="USDC" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : (
                          getCurrencyBadge(swapForm.toCurrency)
                        )}
                      </div>
                      <span className="swap-currency-name">{getCurrencyDisplayName(swapForm.toCurrency)}</span>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  </div>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    className="swap-amount-input"
                    placeholder="0.00"
                    value={swapForm.toAmount}
                    onChange={(e) => handleSwapAmountChange('toAmount', e.target.value)}
                    disabled={isSwapping}
                  />
                  <div className="swap-balance-text">
                    Balance: {isLoadingWalletBalances ? 'Loading...' : `${Number(getCurrencyBalance(swapForm.toCurrency)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${swapForm.toCurrency}`}
                  </div>
                </div>
              </div>

              {/* Exchange Rate */}
              {(() => {
                const rate = getExchangeRate(swapForm.fromCurrency, swapForm.toCurrency);
                if (rate) {
                  return (
                    <div className="swap-exchange-rate">
                      <Info size={14} />
                      <span>1{getCurrencyBadge(swapForm.fromCurrency)} = {rate.toFixed(6)} {getCurrencyBadge(swapForm.toCurrency)}</span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Preview Swap Button */}
              <div className="swap-actions">
                <button
                  type="submit"
                  className="swap-preview-btn"
                  disabled={isSwapping || !swapForm.fromAmount || parseFloat(swapForm.fromAmount) <= 0}
                >
                  {isSwapping ? 'Processing...' : 'Preview Swap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {showSendModal && (
        <div className="notification-modal-overlay" onClick={() => setShowSendModal(false)}>
          <div className="notification-modal send-modal" onClick={(e) => e.stopPropagation()}>
            <div className="send-modal-header">
              <h2>Send</h2>
              <button 
                type="button" 
                className="notification-close-btn" 
                onClick={() => setShowSendModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="send-modal-content">
              {/* Transfer Details Section */}
              <div className="send-transfer-section">
                <div className="send-from-section">
                  <label className="send-section-label">From</label>
                  <div className="send-wallet-selector">
                    <div className="send-currency-badge">
                      <img 
                        src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                        alt="XRP" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    </div>
                    <span className="send-wallet-text">XRP wallet</span>
                    <ChevronDown size={16} />
                  </div>
                  <div className="send-amount-display">$24,567.89</div>
                  <div className="send-balance-text">Balance: 24,567.89 USDT</div>
                </div>

                <div className="send-transfer-arrow">
                  <button type="button" className="send-arrow-btn">
                    <ArrowRight size={20} />
                  </button>
                </div>

                <div className="send-to-section">
                  <label className="send-section-label">To</label>
                  <div className="send-wallet-selector">
                    <div className="send-currency-flag">
                      <img src="https://flagcdn.com/w40/gb.png" alt="EUR" />
                    </div>
                    <span className="send-wallet-text">EUR</span>
                    <ChevronDown size={16} />
                  </div>
                  <div className="send-amount-display">$24,567.89</div>
                  <div className="send-exchange-rate">1 XRP = $0.5430 USD</div>
                </div>
              </div>

              {/* Recipient Information Section */}
              <div className="send-recipient-section">
                <h3 className="send-recipient-title">Recipient Information</h3>
                
                <div className="send-form-row">
                  <div className="send-form-group">
                    <label htmlFor="send-full-name">Full Name</label>
                    <input
                      id="send-full-name"
                      type="text"
                      placeholder="Enter your name"
                      value={sendForm.fullName}
                      onChange={(e) => setSendForm(prev => ({ ...prev, fullName: e.target.value }))}
                    />
                  </div>

                  <div className="send-form-group">
                    <label htmlFor="send-phone">Phone Number</label>
                    <input
                      id="send-phone"
                      type="tel"
                      placeholder="(+44)"
                      value={sendForm.phoneNumber}
                      onChange={(e) => setSendForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="send-form-group">
                  <label htmlFor="send-wallet-address">Wallet Address or Bank Account</label>
                  <input
                    id="send-wallet-address"
                    type="text"
                    placeholder="Enter Wallet Address or Bank Account"
                    value={sendForm.walletAddress}
                    onChange={(e) => setSendForm(prev => ({ ...prev, walletAddress: e.target.value }))}
                  />
                </div>

                <div className="send-form-group">
                  <label htmlFor="send-reason">Reason for transfer (optional)</label>
                  <input
                    id="send-reason"
                    type="text"
                    placeholder="Enter discription"
                    value={sendForm.reason}
                    onChange={(e) => setSendForm(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              </div>

              {/* Bottom Section */}
              <div className="send-bottom-section">
                <div className="send-info-message">
                  <div className="send-info-icon">
                    <Info size={16} />
                  </div>
                  <span>You'll receive at least 24,567 USDT ($24,567) or the transaction will be refunded</span>
                </div>
                <button 
                  type="button" 
                  className="send-preview-btn"
                  onClick={() => {
                    setShowSendModal(false);
                    setShowTransactionSummaryModal(true);
                  }}
                >
                  Preview Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Summary Modal */}
      {showTransactionSummaryModal && (
        <div className="notification-modal-overlay" onClick={() => setShowTransactionSummaryModal(false)}>
          <div className="notification-modal transaction-summary-modal" onClick={(e) => e.stopPropagation()}>
            <div className="transaction-summary-header">
              <h2>Transaction Summary</h2>
              <button 
                type="button" 
                className="notification-close-btn" 
                onClick={() => setShowTransactionSummaryModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="transaction-summary-content">
              <div className="transaction-details-list">
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">Send Amount:</span>
                  <span className="transaction-detail-value">1,000 XRP</span>
                </div>
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">Exchange Rate:</span>
                  <span className="transaction-detail-value">1 XRP = $0.5430</span>
                </div>
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">Network Fee:</span>
                  <span className="transaction-detail-value">0.00001 XRP</span>
                </div>
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">Service Fee:</span>
                  <span className="transaction-detail-value">$2.50 (0.46%)</span>
                </div>
              </div>

              <div className="transaction-divider"></div>

              <div className="transaction-recipient-details">
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label recipient-label">Recipient Gets:</span>
                  <span className="transaction-detail-value">$540.50 USD</span>
                </div>
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">Estimated Arrival:</span>
                  <span className="transaction-detail-value">3-5 seconds</span>
                </div>
              </div>

              <div className="transaction-summary-actions">
                <button 
                  type="button" 
                  className="transaction-transfer-btn"
                  onClick={() => {
                    setShowTransactionSummaryModal(false);
                    setShowFundWalletTransferModal(true);
                  }}
                >
                  Transfer
                </button>
              </div>

              <div className="transaction-summary-disclaimer">
                <div className="transaction-info-icon">
                  <Info size={16} />
                </div>
                <span>Recipient will receive at least 24,567 USDT ($24,567) or the transaction will be refunded</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fund Wallet Transfer Modal */}
      {showFundWalletTransferModal && (
        <div className="notification-modal-overlay" onClick={() => setShowFundWalletTransferModal(false)}>
          <div className="notification-modal fund-wallet-transfer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fund-wallet-transfer-modal-header">
              <h2>Fund wallet</h2>
              <button 
                type="button" 
                className="notification-close-btn" 
                onClick={() => setShowFundWalletTransferModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="fund-wallet-transfer-modal-content">
              {/* Currency Section */}
              <div className="fund-wallet-transfer-form-group">
                <label className="fund-wallet-transfer-label">Currency</label>
                <div className="fund-wallet-transfer-selector">
                  <div className="fund-wallet-transfer-currency-badge">
                    <img 
                      src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                      alt="XRP" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  </div>
                  <span className="fund-wallet-transfer-selector-text">XRP wallet</span>
                  <ChevronDown size={16} />
                </div>
              </div>

              {/* Network Input Section */}
              <div className="fund-wallet-transfer-form-group">
                <label className="fund-wallet-transfer-label">Network</label>
                <input
                  type="text"
                  className="fund-wallet-transfer-input"
                  placeholder="Enter your name"
                />
              </div>

              {/* Network QR Code & Address Section */}
              <div className="fund-wallet-transfer-form-group">
                <label className="fund-wallet-transfer-label">Network</label>
                <div className="fund-wallet-transfer-address-section">
                  <div className="fund-wallet-transfer-qr-code">
                    <QrCode size={120} />
                  </div>
                  <div className="fund-wallet-transfer-address-content">
                    <div className="fund-wallet-transfer-address-text">
                      <span>rEb8TK3gBgk5auZkwc6sHnw</span>
                      <span>rGVJH8DuaLh</span>
                    </div>
                    <button 
                      type="button" 
                      className="fund-wallet-transfer-copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText('rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh');
                        toast.success('Address copied to clipboard');
                      }}
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Transfer Button */}
              <div className="fund-wallet-transfer-actions">
                <button 
                  type="button" 
                  className="fund-wallet-transfer-preview-btn"
                  onClick={() => {
                    setShowFundWalletTransferModal(false);
                    setShowSavingsModal(true);
                  }}
                >
                  Preview Transfer
                </button>
              </div>

              {/* Information Text */}
              <div className="fund-wallet-transfer-info-message">
                <div className="fund-wallet-transfer-info-icon">
                  <Info size={16} />
                </div>
                <span>Recipient gets the funds immediately—or a full refund applies.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Savings Modal - Hidden on mobile when full page is shown */}
      {showSavingsModal && !showSavingsPage && (
        <div className="notification-modal-overlay" onClick={() => setShowSavingsModal(false)}>
          <div className="notification-modal savings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="savings-modal-header">
              <div className="savings-modal-title-wrapper">
                <div className="savings-modal-indicator"></div>
                <h2>Savings</h2>
              </div>
              <button 
                type="button" 
                className="notification-close-btn" 
                onClick={() => setShowSavingsModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="savings-modal-content">
              {/* Mobile Card-Based Layout */}
              <div className="mobile-savings-cards">
                {/* Amount Card */}
                <div className="mobile-savings-amount-card">
                  <div className="mobile-savings-card-left">
                    <div className="mobile-savings-card-icon">
                      <Wallet size={16} />
                    </div>
                    <div className="mobile-savings-card-type">Amount</div>
                  </div>
                  <div className="mobile-savings-card-center">
                    <div className="mobile-savings-card-details">
                      <div className="savings-wallet-selector mobile-savings-wallet-selector">
                        <div className="savings-currency-badge">
                          <img 
                            src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                            alt="XRP" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        </div>
                        <span className="savings-wallet-text">XRP wallet</span>
                      </div>
                      <div className="savings-amount-display mobile-savings-amount">$24,567.89</div>
                      <div className="savings-balance-text">Balance: 24,567.89 XRP</div>
                    </div>
                  </div>
                  <div className="mobile-savings-card-right">
                    <div className="mobile-savings-card-status">Active</div>
                  </div>
                </div>

                {/* Savings Account Card */}
                <div className="mobile-savings-account-card">
                  <div className="mobile-savings-card-left">
                    <div className="mobile-savings-card-icon">
                      <Package size={16} />
                    </div>
                    <div className="mobile-savings-card-type">Account</div>
                  </div>
                  <div className="mobile-savings-card-center">
                    <div className="mobile-savings-card-details">
                      <div className="savings-account-selector mobile-savings-account-selector">
                        <span className="savings-account-text">My Goals</span>
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="mobile-savings-card-right">
                    <div className="mobile-savings-card-status">Selected</div>
                  </div>
                </div>
              </div>

              {/* Transfer Button */}
              <div className="savings-actions">
                <button 
                  type="button" 
                  className="savings-transfer-btn"
                  onClick={() => {
                    // Handle transfer logic
                    setShowSavingsModal(false);
                  }}
                >
                  Transfer
                </button>
              </div>

              {/* Information Message */}
              <div className="savings-info-message">
                <div className="savings-info-icon">
                  <Info size={16} />
                </div>
                <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default Transactions;


