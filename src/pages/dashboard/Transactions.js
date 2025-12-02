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
  ArrowUpDown
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
  const [kycComplete] = useState(true);
  
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [walletBalances, setWalletBalances] = useState(null);
  const [isLoadingWalletBalances, setIsLoadingWalletBalances] = useState(true);
  const [userFullName, setUserFullName] = useState('Sarah Chen');
  const [userInitials, setUserInitials] = useState('SC');
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
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
      'XRP': 'XPR wallet',
      'USDT': 'Tether USD',
      'USDC': 'USD Coin'
    };
    return mapping[currency] || currency;
  };

  // Helper function to get currency badge text
  const getCurrencyBadge = (currency) => {
    const mapping = {
      'XRP': 'XPR',
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

  return (
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
                               (item.label === 'Transactions' && location.pathname === '/transactions');
              const handleNavClick = () => {
                if (item.label === 'Dashboard') {
                  navigate('/dashboard');
                } else if (item.label === 'My Escrow') {
                  navigate('/my-escrow');
                } else if (item.label === 'Transactions') {
                  navigate('/transactions');
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
                        : (dashboardData?.balance?.usd !== undefined && dashboardData?.balance?.usd !== null 
                            ? `$${Number(dashboardData.balance.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                            : '$0.00'))
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
                  onClick={() => setShowFundWalletModal(true)}
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
            <div className="wallet-overview-card">
              <div className="wallet-overview-header">
                <div className="wallet-overview-icon">XPR</div>
                <h3 className="wallet-overview-name">XPR wallet</h3>
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
                        : (walletBalances?.xrp !== undefined && walletBalances?.xrp !== null
                            ? `$${Number(walletBalances.xrp * 0.5430).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
                <div className="wallet-overview-icon">USDT</div>
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
                <div className="wallet-overview-icon">USDC</div>
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

          {/* Two Column Layout */}
          <div className="transactions-middle">
            {/* Left Column */}
            <div className="transactions-left-column">
              {/* My Details Section */}
              <div className="transactions-section-card">
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
              <div className="transactions-section-card">
                <div className="section-indicator"></div>
                <div className="section-content">
                  <h3 className="section-title">Beneficiaries</h3>
                  <div className="beneficiaries-container">
                    <div className="beneficiaries-avatars">
                      {beneficiaries.slice(0, 4).map((beneficiary) => (
                        <div key={beneficiary.id} className="beneficiary-avatar">
                          {beneficiary.initials || beneficiary.name?.substring(0, 2).toUpperCase() || '??'}
                        </div>
                      ))}
                    </div>
                    <button type="button" className="send-beneficiary-btn">
                      <ArrowRight size={18} />
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
            </div>

            {/* Right Column */}
            <div className="transactions-right-column">
              {/* Transaction History Section */}
              <div className="transactions-section-card">
                <div className="section-indicator"></div>
                <div className="section-content">
                  <div className="transaction-history-header">
                    <h3 className="section-title">Transaction history</h3>
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
                      <div className="swap-currency-badge">{getCurrencyBadge(swapForm.fromCurrency)}</div>
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
                      <div className="swap-currency-badge">{getCurrencyBadge(swapForm.toCurrency)}</div>
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
    </div>
  );
};

export default Transactions;


