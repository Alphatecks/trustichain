import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Repeat,
  Briefcase,
  Headphones,
  Settings,
  Search,
  Bell,
  ArrowRight,
  KeyRound,
  QrCode,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Plus,
  DollarSign,
  Building2,
  Users,
  FileCheck,
  FileText,
  Code,
  Box,
  Link,
  HelpCircle,
  LogOut,
  X,
  Filter,
  AlertTriangle,
  CheckCircle,
  Package,
  Menu,
  Wallet,
  ChevronRight
} from 'lucide-react';
import './Dashboard.css';
import logo from '../../assets/images/icons/logo.png';
import logoWhite from '../../assets/images/logo/logo_white.png';
import mockIllustration from '../../assets/images/illustrations/mock.png';
import uploadIllustration from '../../assets/images/illustrations/upload.png';
import chainsIllustration from '../../assets/images/illustrations/chain.png';
import cardIllustration from '../../assets/images/illustrations/card.png';
import verifyBadge from '../../assets/images/icons/verify.png';
import { getApiUrl } from '../../utils/config';
import { useSession } from '../../context/SessionContext';
import LoadingIndicator from '../../components/LoadingIndicator';
import CreateEscrowForm from '../../components/CreateEscrowForm';
import BusinessSuiteLoader from '../../components/BusinessSuiteLoader';

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: 23 },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: 23 },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'P2P trading', icon: Repeat, badge: null }
];

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true, badge: null },
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

const steps = [
  { label: 'Proof of identity', detail: 'Proof of identity' },
  { label: 'Document upload', detail: 'Document upload' },
  { label: 'Connect Wallet', detail: 'Connect Wallet' }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [kycComplete, setKycComplete] = useState(() => {
    // Check localStorage first, default to true if KYC was previously completed
    const stored = localStorage.getItem('kycComplete');
    return stored ? JSON.parse(stored) : true;
  });
  const [businessKycComplete, setBusinessKycComplete] = useState(() => {
    const stored = localStorage.getItem('businessKycComplete');
    return stored ? JSON.parse(stored) : false;
  });
  const [showBalance, setShowBalance] = useState(true);
  const [accountType, setAccountType] = useState('Personal');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('All');
  const [isSwitchingAccountType, setIsSwitchingAccountType] = useState(false);
  const [switchMessage, setSwitchMessage] = useState('');
  const [kycForm, setKycForm] = useState({
    firstName: '',
    lastName: '',
    nationality: '',
    passport: '',
    dob: ''
  });

  const [documents, setDocuments] = useState({
    front: null,
    back: null,
    selfie: null
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [portfolioPoints, setPortfolioPoints] = useState(null);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [walletBalances, setWalletBalances] = useState(null);
  const [isLoadingWalletBalances, setIsLoadingWalletBalances] = useState(true);
  const [escrows, setEscrows] = useState([]);
  const [isLoadingEscrows, setIsLoadingEscrows] = useState(true);
  const [totalEscrowedAmount, setTotalEscrowedAmount] = useState(null);
  const [isLoadingTotalEscrowed, setIsLoadingTotalEscrowed] = useState(true);
  const [userFullName, setUserFullName] = useState('Sarah Chen');
  const [userInitials, setUserInitials] = useState('SC');
  const [userRole, setUserRole] = useState('Freelancer');
  const [userAvatar, setUserAvatar] = useState(null);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
  const [walletAddress, setWalletAddress] = useState('');
  const [hasWallet, setHasWallet] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCreateEscrowModal, setShowCreateEscrowModal] = useState(false);
  const [showFundWalletModal, setShowFundWalletModal] = useState(false);
  const [fundWalletForm, setFundWalletForm] = useState({
    amount: '',
    currency: 'XRP'
  });
  const [isFundingWallet, setIsFundingWallet] = useState(false);
  const [fundingStep, setFundingStep] = useState('idle'); // 'idle', 'preparing', 'signing', 'completing'
  const [transactionData, setTransactionData] = useState(null); // { transactionId, transactionBlob }
  const [showWithdrawWalletModal, setShowWithdrawWalletModal] = useState(false);
  const [withdrawWalletForm, setWithdrawWalletForm] = useState({
    amount: '',
    currency: 'USD',
    destinationAddress: ''
  });
  const [isWithdrawingWallet, setIsWithdrawingWallet] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper function to extract balance from different API response structures
  const getBalanceValue = (data, currency = 'usd') => {
    if (!data) {
      console.log('getBalanceValue: No data provided');
      return null;
    }
    
    const currencyKey = currency.toLowerCase();
    const currencyUpper = currency.toUpperCase();
    
    // Try different possible structures
    let value = null;
    
    // Structure 1: data.balance.usd or data.balance.xrp
    if (data.balance && typeof data.balance === 'object') {
      value = data.balance[currencyKey] || data.balance[currencyUpper] || null;
      if (value !== null) {
        console.log(`getBalanceValue: Found in data.balance.${currencyKey}:`, value);
        return Number(value);
      }
    }
    
    // Structure 2: data.totalBalance or data.balanceData
    const balanceObj = data.totalBalance || data.balanceData || data.balances || {};
    if (balanceObj && typeof balanceObj === 'object') {
      value = balanceObj[currencyKey] || balanceObj[currencyUpper] || 
              balanceObj[`total${currencyUpper}`] || 
              balanceObj[`${currencyKey}Balance`] ||
              balanceObj[`${currencyKey}Amount`] ||
              null;
      if (value !== null) {
        console.log(`getBalanceValue: Found in balance object:`, value);
        return Number(value);
      }
    }
    
    // Structure 3: Direct properties like data.totalUSD, data.balanceUSD
    value = data[`total${currencyUpper}`] || 
            data[`balance${currencyUpper}`] ||
            data[`${currencyKey}Balance`] ||
            data[`${currencyKey}Amount`] ||
            null;
    
    if (value !== null) {
      console.log(`getBalanceValue: Found as direct property:`, value);
      return Number(value);
    }
    
    console.log(`getBalanceValue: Could not find ${currencyKey} balance in data:`, data);
    return null;
  };

  // Helper function to get exchange rate between two currencies
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

  const fetchDashboardSummary = async () => {
    try {
      // If session is expired, use fallback data
      if (isSessionExpired) {
        console.log('Session expired, using fallback dashboard data');
        setDashboardData({
          balance: { usd: 125000.00, xrp: 250000.00 },
          activeEscrows: { count: 12, lockedAmount: 45000.00 },
          trustiscore: { score: 850, level: 'Gold' }
        });
        setIsLoadingDashboard(false);
        return;
      }

      const token = localStorage.getItem('token');
      console.log('Dashboard useEffect - Token exists:', !!token);
      console.log('Dashboard useEffect - kycComplete:', kycComplete);
      
      if (!token) {
        console.warn('No token found in localStorage');
        setIsLoadingDashboard(false);
        return;
      }

      const apiUrl = getApiUrl('api/dashboard/summary');
      console.log('Fetching dashboard summary from:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Dashboard API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Dashboard API response data:', result);
        
        if (result.success && result.data) {
          console.log('Setting dashboard data:', result.data);
          console.log('Balance data:', result.data.balance);
          
          // Normalize balance data structure
          const normalizedData = { ...result.data };
          
          // Ensure balance structure exists and is properly formatted
          if (!normalizedData.balance) {
            normalizedData.balance = {};
          }
          
          // Extract balance values using helper function (handles multiple structures)
          const usdValue = getBalanceValue(result.data, 'usd');
          const xrpValue = getBalanceValue(result.data, 'xrp');
          
          // Set balance values if found
          if (usdValue !== null) {
            normalizedData.balance.usd = usdValue;
            console.log('USD Balance extracted:', usdValue);
          } else {
            console.warn('USD Balance not found in API response');
          }
          
          if (xrpValue !== null) {
            normalizedData.balance.xrp = xrpValue;
            console.log('XRP Balance extracted:', xrpValue);
          } else {
            console.warn('XRP Balance not found in API response');
          }
          
          setDashboardData(normalizedData);
          console.log('Dashboard data state updated with normalized balance:', normalizedData.balance);
        } else {
          console.warn('API response missing success or data. Full response:', result);
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Dashboard API error response:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  useEffect(() => {
    // Always fetch when component mounts, not just when kycComplete is true
    fetchDashboardSummary();
  }, [kycComplete, isSessionExpired]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      // If session is expired, use fallback data
      if (isSessionExpired) {
        console.log('Session expired, using fallback user profile');
        setUserFullName('Sarah Chen');
        setUserInitials('SC');
        setUserRole('Freelancer');
        setUserAvatar(null);
        setIsLoadingUserProfile(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found for user profile');
          setIsLoadingUserProfile(false);
          return;
        }

        const apiUrl = getApiUrl('api/user/profile');
        console.log('Fetching user profile from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('User profile API response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('User profile API response data:', result);

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

            // Extract initials from firstName and lastName
            const firstName = data.firstName || '';
            const lastName = data.lastName || '';
            let initials = 'SC'; // default fallback
            
            if (firstName && lastName) {
              initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
            } else if (fullName && typeof fullName === 'string') {
              // Fallback: extract from fullName if firstName/lastName not available
              const nameParts = fullName.trim().split(/\s+/);
              if (nameParts.length >= 2) {
                initials = `${nameParts[0].charAt(0).toUpperCase()}${nameParts[nameParts.length - 1].charAt(0).toUpperCase()}`;
              } else if (nameParts.length === 1) {
                initials = nameParts[0].charAt(0).toUpperCase();
              }
            }
            
            setUserInitials(initials);

            // Extract user role from profile data
            const role = data.role || data.userType || data.accountType || 'Freelancer';
            setUserRole(role);

            // Extract user avatar/image from profile data
            const avatar = data.avatar || data.profilePicture || data.image || data.photo || null;
            setUserAvatar(avatar);
          } else {
            console.warn('Unexpected user profile response shape. Expected success and data.', result);
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error('User profile API error response:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoadingUserProfile(false);
      }
    };

    fetchUserProfile();
  }, [isSessionExpired]);

  const handleCreateWallet = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You need to be logged in to create a wallet.');
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

      if (!response.ok) {
        toast.error('Failed to create wallet. Please try again.');
        return;
      }

      const result = await response.json();

      if (result?.success) {
        const xrplAddress = result?.data?.xrplAddress;
        if (xrplAddress) {
          setWalletAddress(xrplAddress);
          setHasWallet(true);
          toast.success('Wallet creation was successful');
        } else {
          toast.error('Wallet was created but address is missing in the response.');
        }
      } else {
        const message = result?.message || 'Failed to create wallet. Please try again.';
        toast.error(message);
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast.error('An error occurred while creating the wallet. Please try again.');
    }
  };

  // Determine if wallet already exists based on initial walletAddress (if server pre-fills it)
  useEffect(() => {
    if (walletAddress && typeof walletAddress === 'string' && walletAddress.trim().length > 0) {
      setHasWallet(true);
    }
  }, [walletAddress]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found for exchange rates');
          setIsLoadingRates(false);
          return;
        }

        const apiUrl = getApiUrl('api/exchange/rates');
        console.log('Fetching exchange rates from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Exchange rates API response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('Exchange rates API response data:', result);

          // Expected shape:
          // { success: true, data: { rates: [ { currency, rate, change, changePercent }, ... ], lastUpdated } }
          console.log('Full API result:', JSON.stringify(result, null, 2));
          console.log('result.success:', result?.success);
          console.log('result.data:', result?.data);
          console.log('result.data.rates:', result?.data?.rates);
          console.log('Is array?', Array.isArray(result?.data?.rates));
          
          if (result?.success && Array.isArray(result?.data?.rates) && result.data.rates.length > 0) {
            console.log('Setting exchange rates:', result.data.rates);
            setExchangeRates(result.data.rates);
          } else {
            console.warn('Unexpected exchange rates response shape. Expected data.rates as an array.', result);
            console.warn('Setting exchange rates to empty array');
            setExchangeRates([]);
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error('Exchange rates API error response:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          setExchangeRates([]);
        }
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
        setExchangeRates([]);
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchExchangeRates();
  }, []);

  useEffect(() => {
    const fetchPortfolioPerformance = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found for portfolio performance');
          setIsLoadingPortfolio(false);
          return;
        }

        const apiUrl = getApiUrl('api/portfolio/performance?timeframe=daily');
        console.log('Fetching portfolio performance from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Portfolio performance API response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('Portfolio performance API response data:', result);

          // Expected shape:
          // { success: true, data: { points: [ { label, value }, ... ], ... } }
          if (result?.success && Array.isArray(result?.data?.points)) {
            setPortfolioPoints(result.data.points);
          } else {
            console.warn('Unexpected portfolio performance response shape. Expected data.points as array.', result);
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error('Portfolio performance API error response:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
        }
      } catch (error) {
        console.error('Error fetching portfolio performance:', error);
      } finally {
        setIsLoadingPortfolio(false);
      }
    };

    fetchPortfolioPerformance();
  }, []);

  useEffect(() => {
    const fetchWalletBalances = async () => {
      try {
        // If session is expired, don't fetch
        if (isSessionExpired) {
          console.log('Session expired, skipping wallet balances fetch');
          setIsLoadingWalletBalances(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found for wallet balances');
          setIsLoadingWalletBalances(false);
          return;
        }

        const apiUrl = getApiUrl('api/wallet/balance');
        console.log('Fetching wallet balances from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Wallet balances API response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('Wallet balances API response data:', result);

          // If backend includes an XRPL address, treat wallet as already created
          const existingAddress = result?.data?.xrplAddress;
          if (
            existingAddress &&
            typeof existingAddress === 'string' &&
            existingAddress.trim().length > 0
          ) {
            setWalletAddress(prev => prev || existingAddress);
            setHasWallet(true);
          }

          // Handle different possible response structures
          let balances = null;
          
          // Structure 1: { success: true, data: { balance: { xrp, usdt, usdc } } }
          if (result?.success && result?.data?.balance) {
            balances = result.data.balance;
            console.log('Found balances in result.data.balance:', balances);
          }
          // Structure 2: { success: true, data: { xrp, usdt, usdc } }
          else if (result?.success && result?.data) {
            const data = result.data;
            if (data.xrp !== undefined || data.usdt !== undefined || data.usdc !== undefined) {
              balances = {
                xrp: data.xrp || data.XRP || 0,
                usdt: data.usdt || data.USDT || 0,
                usdc: data.usdc || data.USDC || 0
              };
              console.log('Found balances in result.data:', balances);
            }
          }
          // Structure 3: { success: true, data: { wallets: [...] } }
          else if (result?.success && Array.isArray(result?.data?.wallets)) {
            balances = {};
            result.data.wallets.forEach(wallet => {
              const currency = (wallet.currency || wallet.code || '').toLowerCase();
              const balance = wallet.balance || wallet.amount || 0;
              if (currency === 'xrp') balances.xrp = Number(balance);
              if (currency === 'usdt') balances.usdt = Number(balance);
              if (currency === 'usdc') balances.usdc = Number(balance);
            });
            console.log('Found balances from wallets array:', balances);
          }
          // Structure 4: Direct balance object
          else if (result?.balance) {
            balances = result.balance;
            console.log('Found balances in result.balance:', balances);
          }

          if (balances) {
            // Normalize the balance values
            const normalizedBalances = {
              xrp: balances.xrp !== undefined && balances.xrp !== null ? Number(balances.xrp) : 0,
              usdt: balances.usdt !== undefined && balances.usdt !== null ? Number(balances.usdt) : 0,
              usdc: balances.usdc !== undefined && balances.usdc !== null ? Number(balances.usdc) : 0
            };
            console.log('Setting normalized wallet balances:', normalizedBalances);
            setWalletBalances(normalizedBalances);
          } else {
            console.warn('Could not extract wallet balances from API response:', result);
            setWalletBalances({ xrp: 0, usdt: 0, usdc: 0 });
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error('Wallet balances API error response:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          setWalletBalances({ xrp: 0, usdt: 0, usdc: 0 });
        }
      } catch (error) {
        console.error('Error fetching wallet balances:', error);
        setWalletBalances({ xrp: 0, usdt: 0, usdc: 0 });
      } finally {
        setIsLoadingWalletBalances(false);
      }
    };

    fetchWalletBalances();
  }, [isSessionExpired]);

  useEffect(() => {
    const fetchEscrows = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found for escrows');
          setIsLoadingEscrows(false);
          setIsLoadingTotalEscrowed(false);
          return;
        }

        // Fetch escrows to calculate total escrowed amount
        // Try to get all escrows or use a summary endpoint if available
        const apiUrl = getApiUrl('api/escrow/list?limit=1000&offset=0');
        console.log('Fetching escrows for total calculation from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Escrows API response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('Escrows API response data:', result);
          console.log('Escrows API response structure:', {
            hasSuccess: !!result?.success,
            hasData: !!result?.data,
            escrowsArray: Array.isArray(result?.data?.escrows),
            escrowsLength: result?.data?.escrows?.length,
            totalEscrowed: result?.data?.totalEscrowed,
            totalEscrowedAmount: result?.data?.totalEscrowedAmount
          });

          // Expected shape:
          // { success: true, data: { escrows: [ ... ], totalEscrowed, total } }
          if (result?.success && result?.data) {
            // Set escrows list
            if (Array.isArray(result.data.escrows)) {
              setEscrows(result.data.escrows);
              console.log('Set escrows array, length:', result.data.escrows.length);
            }

            // Extract total escrowed amount from API response
            // Check for totalEscrowed, totalEscrowedAmount, or calculate from escrows
            let calculatedTotal = null;
            
            if (result.data.totalEscrowed !== undefined && result.data.totalEscrowed !== null) {
              calculatedTotal = result.data.totalEscrowed;
              console.log('Using totalEscrowed from API:', calculatedTotal);
            } else if (result.data.totalEscrowedAmount !== undefined && result.data.totalEscrowedAmount !== null) {
              calculatedTotal = result.data.totalEscrowedAmount;
              console.log('Using totalEscrowedAmount from API:', calculatedTotal);
            } else if (Array.isArray(result.data.escrows) && result.data.escrows.length > 0) {
              // Calculate total from escrows array if totalEscrowed is not provided
              // Escrow amount structure: escrow.amount.usd or escrow.amount.xrp
              console.log('Calculating total from escrows array, count:', result.data.escrows.length);
              calculatedTotal = result.data.escrows.reduce((sum, escrow, index) => {
                // Try to get USD amount first, then XRP, then other possible fields
                const amount = escrow.amount?.usd || 
                              escrow.amount?.USD || 
                              escrow.amount?.xrp || 
                              escrow.amount?.XRP ||
                              escrow.totalAmount || 
                              escrow.usdAmount || 
                              (typeof escrow.amount === 'number' ? escrow.amount : null) ||
                              0;
                const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
                if (index < 3) {
                  console.log(`Escrow ${index}:`, {
                    escrow,
                    amount,
                    numAmount,
                    runningSum: sum + numAmount
                  });
                }
                return sum + numAmount;
              }, 0);
              console.log('Calculated total escrowed amount:', calculatedTotal);
            } else {
              console.log('No escrows found, setting total to 0');
              calculatedTotal = 0;
            }
            
            if (calculatedTotal !== null) {
              setTotalEscrowedAmount(calculatedTotal);
              console.log('Set totalEscrowedAmount state to:', calculatedTotal);
            }
          } else {
            console.warn('Unexpected escrows response shape. Expected success and data.', result);
            setTotalEscrowedAmount(0);
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error('Escrows API error response:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          setTotalEscrowedAmount(0);
        }
      } catch (error) {
        console.error('Error fetching escrows:', error);
        setTotalEscrowedAmount(0);
      } finally {
        setIsLoadingEscrows(false);
        setIsLoadingTotalEscrowed(false);
      }
    };

    fetchEscrows();
  }, [isSessionExpired]);

  const handleFundWallet = async (e) => {
    e.preventDefault();
    console.log('handleFundWallet submitted with form:', fundWalletForm);
    console.log('Selected wallet type from dropdown:', fundWalletForm.currency);
    console.log('Amount:', fundWalletForm.amount);
    
    if (!fundWalletForm.amount || parseFloat(fundWalletForm.amount) <= 0) {
      console.warn('Invalid fund amount:', fundWalletForm.amount);
      toast.error('Please enter a valid amount');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No auth token found while funding wallet');
      toast.error('Please login to fund your wallet');
      return;
    }

    // Get the selected currency/wallet type
    const selectedCurrency = fundWalletForm.currency || 'XRP';
    console.log('Using currency/wallet type for API call:', selectedCurrency);

    setIsFundingWallet(true);
    setFundingStep('preparing');
    
    try {
      // Step 1: Prepare transaction - Call /api/wallet/fund
      const apiUrl = getApiUrl('api/wallet/fund');
      const requestBody = {
        amount: parseFloat(fundWalletForm.amount),
        currency: selectedCurrency
      };
      
      console.log('Step 1: Calling fund wallet API to prepare transaction:', apiUrl);
      console.log('Request body being sent:', requestBody);
      console.log('Currency value in request:', requestBody.currency);

      toast.loading('Preparing transaction...', { id: 'fund-wallet' });

      const prepareResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Fund wallet API response status:', prepareResponse.status);

      const prepareResult = await prepareResponse.json().catch(() => ({}));
      console.log('Fund wallet API response body:', prepareResult);
      console.log('Fund wallet API response data:', prepareResult.data);
      console.log('Transaction ID:', prepareResult.data?.transactionId);
      console.log('Transaction Blob:', prepareResult.data?.transactionBlob);

      if (!prepareResponse.ok || !prepareResult.success) {
        toast.error(prepareResult.message || 'Failed to prepare transaction. Please try again.', { id: 'fund-wallet' });
        setIsFundingWallet(false);
        setFundingStep('idle');
        return;
      }

      // Store transaction data
      const transactionId = prepareResult.data?.transactionId;
      const xummUrl = prepareResult.data?.xummUrl;
      // Check for transaction object/blob for browser wallet flow
      const transactionObject = prepareResult.data?.transaction 
        || prepareResult.data?.transactionBlob 
        || prepareResult.data?.txBlob 
        || prepareResult.data?.blob;

      // Check if transaction was already processed (has xrplTxHash)
      if (prepareResult.data?.xrplTxHash) {
        console.log('Transaction already processed by backend, skipping wallet signing step');
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
        console.error('Missing transactionId in response:', prepareResult);
        toast.error('Backend response missing transaction ID.', { id: 'fund-wallet' });
        setIsFundingWallet(false);
        setFundingStep('idle');
        return;
      }

      setTransactionData({ transactionId, transactionObject, xummUrl });
      setFundingStep('signing');

      // Step 2: Determine which flow to use based on xummUrl presence
      if (xummUrl) {
        // Xaman flow (mobile app)
        console.log('Using Xaman flow - xummUrl provided:', xummUrl);
        toast.loading('Please sign the transaction in your Xaman wallet...', { id: 'fund-wallet' });
        
        // Open XUMM URL for user to sign
        window.open(xummUrl, '_blank');

        // Poll backend for transaction status
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
              console.log('Transaction status check:', statusResult);
              
              if (statusResult.data?.signed) {
                // Backend automatically submits to XRPL when signed
                // No need to call /api/wallet/fund/complete
                clearInterval(pollInterval);
                
                console.log('Transaction signed and automatically submitted by backend');
                
                // Show success and refresh
                toast.success('Wallet funded successfully!', { id: 'fund-wallet' });
                setShowFundWalletModal(false);
                setFundWalletForm({ amount: '', currency: 'XRP' });
                setTransactionData(null);
                setFundingStep('idle');
                setIsFundingWallet(false);
                // Refresh dashboard data
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
        }, 2000); // Poll every 2 seconds
        
        // Store interval to clear it if user cancels
        setTransactionData({ transactionId, transactionObject, xummUrl, pollInterval });
        
        // Cleanup interval after 5 minutes (timeout)
        setTimeout(() => {
          clearInterval(pollInterval);
          if (fundingStep === 'signing') {
            toast.error('Transaction signing timed out.', { id: 'fund-wallet' });
            setIsFundingWallet(false);
            setFundingStep('idle');
            setTransactionData(null);
          }
        }, 5 * 60 * 1000); // 5 minutes timeout
        
      } else {
        // Browser wallet flow (Crossmark/MetaMask)
        console.log('Using browser wallet flow - no xummUrl, signing with browser wallet');
        
        if (!transactionObject) {
          console.error('Missing transaction object for browser wallet flow:', prepareResult);
          toast.error('Backend response missing transaction data for browser wallet signing.', { id: 'fund-wallet' });
          setIsFundingWallet(false);
          setFundingStep('idle');
          setTransactionData(null);
          return;
        }
        
        toast.loading('Please sign the transaction in your browser wallet...', { id: 'fund-wallet' });
        
        try {
          // Parse transaction object if it's a JSON string
          let txToSign = transactionObject;
          if (typeof transactionObject === 'string') {
            try {
              txToSign = JSON.parse(transactionObject);
            } catch (e) {
              console.warn('Could not parse transaction object as JSON:', e);
            }
          }
          
          console.log('Transaction to sign:', txToSign);
          console.log('Transaction to sign (stringified):', JSON.stringify(txToSign, null, 2));
          
          // Validate transaction object structure
          if (!txToSign || (typeof txToSign !== 'object' && typeof txToSign !== 'string')) {
            console.error('Invalid transaction object:', txToSign);
            throw new Error('Invalid transaction object received from backend. Please try again.');
          }
          
          // Check for Crossmark (XRPL browser wallet)
          if (window.crossmark) {
            console.log('Crossmark wallet detected');
            console.log('Crossmark API structure:', window.crossmark);
            console.log('Crossmark api object:', window.crossmark.api);
            console.log('Crossmark methods:', window.crossmark.methods);
            console.log('Crossmark session:', window.crossmark.session);
            console.log('Transaction to sign:', txToSign);
            console.log('Transaction type:', typeof txToSign);
            console.log('Transaction keys:', txToSign && typeof txToSign === 'object' ? Object.keys(txToSign) : 'N/A');
            
            // Validate XRPL transaction structure if it's an object
            if (typeof txToSign === 'object' && txToSign !== null) {
              const requiredFields = ['TransactionType'];
              const missingFields = requiredFields.filter(field => !(field in txToSign));
              if (missingFields.length > 0) {
                console.warn('Transaction may be missing required fields:', missingFields);
                console.warn('Transaction object:', txToSign);
              }
            }
            
            // Check if Crossmark is connected
            let isConnected = window.crossmark?.session?.address || window.crossmark?.api?.connected || false;
            console.log('Crossmark connected:', isConnected);
            console.log('Crossmark session address:', window.crossmark?.session?.address);
            console.log('Crossmark api connected:', window.crossmark?.api?.connected);
            
            // If not connected, we need to connect first - this will trigger the popup
            if (!isConnected) {
              console.log('Crossmark wallet is not connected. Attempting to connect...');
              
              // Try different connection methods
              try {
                if (window.crossmark?.session?.signIn && typeof window.crossmark.session.signIn === 'function') {
                  console.log('Using session.signIn to connect...');
                  await window.crossmark.session.signIn();
                  console.log('Crossmark sign-in completed');
                  
                  // Wait a moment for connection to establish
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  // Check connection again
                  isConnected = window.crossmark?.session?.address || window.crossmark?.api?.connected || false;
                  console.log('Crossmark connected after signIn:', isConnected);
                } else if (window.crossmark?.async?.signInAndWait && typeof window.crossmark.async.signInAndWait === 'function') {
                  console.log('Using async.signInAndWait to connect...');
                  await window.crossmark.async.signInAndWait();
                  console.log('Crossmark signInAndWait completed');
                  
                  // Wait a moment for connection to establish
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  // Check connection again with retry
                  let retryCount = 0;
                  const maxRetries = 5;
                  while (retryCount < maxRetries && !isConnected) {
                    isConnected = window.crossmark?.session?.address || window.crossmark?.api?.connected || false;
                    if (!isConnected) {
                      await new Promise(resolve => setTimeout(resolve, 500));
                      retryCount++;
                    }
                  }
                  console.log('Crossmark connected after signInAndWait:', isConnected, `(retries: ${retryCount})`);
                } else if (window.crossmark?.methods?.signIn && typeof window.crossmark.methods.signIn === 'function') {
                  console.log('Using methods.signIn to connect...');
                  await window.crossmark.methods.signIn();
                  console.log('Crossmark methods.signIn completed');
                  
                  // Wait a moment for connection to establish
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  // Check connection again with retry
                  let retryCount = 0;
                  const maxRetries = 5;
                  while (retryCount < maxRetries && !isConnected) {
                    isConnected = window.crossmark?.session?.address || window.crossmark?.api?.connected || false;
                    if (!isConnected) {
                      await new Promise(resolve => setTimeout(resolve, 500));
                      retryCount++;
                    }
                  }
                  console.log('Crossmark connected after methods.signIn:', isConnected, `(retries: ${retryCount})`);
                }
              } catch (connectError) {
                console.error('Error connecting Crossmark:', connectError);
                throw new Error('Failed to connect Crossmark wallet. Please make sure the extension is installed and unlocked, then try again.');
              }
              
              // If still not connected after attempting to connect, throw an error
              if (!isConnected) {
                console.error('Crossmark wallet is still not connected after connection attempt');
                console.error('Session state:', {
                  address: window.crossmark?.session?.address,
                  apiConnected: window.crossmark?.api?.connected,
                  session: window.crossmark?.session
                });
                throw new Error('Crossmark wallet is not connected. Please connect your wallet in the Crossmark extension and try again.');
              }
            }
            
            console.log('Crossmark is connected, proceeding with transaction signing...');
            toast.loading('Requesting transaction signature from Crossmark...', { id: 'fund-wallet' });
            
            try {
              let signedTx;
              
              // Crossmark's recommended approach: use api.request with method 'sign'
              // This is the standard way to trigger the popup
              if (window.crossmark.api && typeof window.crossmark.api.request === 'function') {
                console.log('Using Crossmark api.request method...');
                toast.loading('Waiting for you to approve the transaction in Crossmark...', { id: 'fund-wallet' });
                // Request-based API - this should trigger the popup
                signedTx = await window.crossmark.api.request({
                  method: 'sign',
                  params: {
                    transaction: txToSign
                  }
                });
                console.log('Crossmark request completed, response:', signedTx);
              } else if (window.crossmark.api && typeof window.crossmark.api.sign === 'function') {
                console.log('Using Crossmark api.sign method...');
                // Direct sign method
                signedTx = await window.crossmark.api.sign(txToSign);
                console.log('Crossmark sign completed, response:', signedTx);
              } else if (window.crossmark.api && typeof window.crossmark.api.signTransaction === 'function') {
                console.log('Using Crossmark api.signTransaction method...');
                // signTransaction method
                signedTx = await window.crossmark.api.signTransaction(txToSign);
                console.log('Crossmark signTransaction completed, response:', signedTx);
              } else if (window.crossmark.methods && typeof window.crossmark.methods.sign === 'function') {
                console.log('Using Crossmark methods.sign...');
                // Methods-based API
                signedTx = await window.crossmark.methods.sign(txToSign);
                console.log('Crossmark methods.sign completed, response:', signedTx);
              } else if (window.crossmark.async && typeof window.crossmark.async.sign === 'function') {
                console.log('Using Crossmark async.sign...');
                // Async API
                signedTx = await window.crossmark.async.sign(txToSign);
                console.log('Crossmark async.sign completed, response:', signedTx);
              } else {
                // Try to find any sign-related method
                const api = window.crossmark.api || window.crossmark;
                const availableMethods = Object.keys(api || {}).filter(key => 
                  typeof api[key] === 'function' && key.toLowerCase().includes('sign')
                );
                
                if (availableMethods.length > 0) {
                  console.log('Found sign methods:', availableMethods);
                  console.log('Using method:', availableMethods[0]);
                  signedTx = await api[availableMethods[0]](txToSign);
                  console.log('Method call completed, response:', signedTx);
                } else {
                  console.error('Available API methods:', Object.keys(api || {}));
                  throw new Error('No sign method found. Available API methods: ' + Object.keys(api || {}).join(', '));
                }
              }
              
              console.log('Transaction signed with Crossmark:', signedTx);
              console.log('Full Crossmark response:', JSON.stringify(signedTx, null, 2));
              console.log('Crossmark response type:', typeof signedTx);
              console.log('Crossmark response keys:', signedTx ? Object.keys(signedTx) : 'null/undefined');
              
              // Check if the response is a UUID (request ID) - Crossmark sometimes returns request IDs that need to be awaited
              const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              let actualResponse = signedTx;
              
              // If the response is a UUID string, it's a request ID - we need to await the actual response
              if (typeof signedTx === 'string' && uuidPattern.test(signedTx)) {
                console.log('Received UUID request ID from Crossmark, awaiting actual response...');
                console.log('Request ID:', signedTx);
                
                const requestId = signedTx;
                const REQUEST_TIMEOUT = 120000; // 2 minutes timeout
                let responseReceived = false;
                
                toast.loading('Transaction approved, processing response...', { id: 'fund-wallet' });
                
                // Strategy 1: Try awaitRequest with timeout
                if (window.crossmark?.api?.awaitRequest && typeof window.crossmark.api.awaitRequest === 'function') {
                  console.log('Strategy 1: Using awaitRequest with timeout...');
                  try {
                    const timeoutPromise = new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Request timeout: No response received within 2 minutes')), REQUEST_TIMEOUT)
                    );
                    
                    actualResponse = await Promise.race([
                      window.crossmark.api.awaitRequest(requestId),
                      timeoutPromise
                    ]);
                    
                    console.log('Received response from awaitRequest:', actualResponse);
                    console.log('Response type:', typeof actualResponse);
                    console.log('Response keys:', actualResponse ? Object.keys(actualResponse) : null);
                    responseReceived = true;
                  } catch (awaitError) {
                    console.warn('awaitRequest failed or timed out:', awaitError);
                    // Continue to fallback strategies
                  }
                }
                
                // Strategy 2: Use event listeners if awaitRequest didn't work
                if (!responseReceived && window.crossmark?.api) {
                  console.log('Strategy 2: Trying event listener approach...');
                  try {
                    const eventPromise = new Promise((resolve, reject) => {
                      let handler;
                      const timeout = setTimeout(() => {
                        if (handler && window.crossmark?.api?.off) {
                          window.crossmark.api.off('response', handler);
                        }
                        reject(new Error('Event listener timeout: No response event received within 2 minutes'));
                      }, REQUEST_TIMEOUT);
                      
                      handler = (event) => {
                        console.log('Received response event:', event);
                        // Check if this event is for our request
                        if (event.uuid === requestId || event.requestId === requestId || event.id === requestId) {
                          clearTimeout(timeout);
                          if (window.crossmark?.api?.off) {
                            window.crossmark.api.off('response', handler);
                          }
                          resolve(event);
                        }
                      };
                      
                      // Try different event names
                      if (window.crossmark.api.on) {
                        window.crossmark.api.on('response', handler);
                      } else if (window.crossmark.api.addEventListener) {
                        window.crossmark.api.addEventListener('response', handler);
                      } else if (window.crossmark.on) {
                        window.crossmark.on('response', handler);
                      }
                    });
                    
                    actualResponse = await eventPromise;
                    console.log('Received response from event listener:', actualResponse);
                    responseReceived = true;
                  } catch (eventError) {
                    console.warn('Event listener approach failed:', eventError);
                    // Continue to next strategy
                  }
                }
                
                // Strategy 3: Poll the active Map for response
                if (!responseReceived && window.crossmark?.api?.active && window.crossmark.api.active instanceof Map) {
                  console.log('Strategy 3: Polling active Map for response...');
                  try {
                    const pollPromise = new Promise((resolve, reject) => {
                      let pollCount = 0;
                      const maxPolls = REQUEST_TIMEOUT / 1000; // Poll every second for 2 minutes
                      
                      const pollInterval = setInterval(() => {
                        pollCount++;
                        const activeRequest = window.crossmark.api.active.get(requestId);
                        
                        console.log(`Polling attempt ${pollCount}/${maxPolls}, active request:`, activeRequest);
                        
                        if (activeRequest) {
                          // Check if response is available
                          if (activeRequest.response) {
                            clearInterval(pollInterval);
                            console.log('Found response in active request:', activeRequest.response);
                            resolve(activeRequest.response);
                            return;
                          }
                          
                          // Check if there's a promise we can await
                          if (activeRequest.promise && typeof activeRequest.promise.then === 'function') {
                            clearInterval(pollInterval);
                            console.log('Found promise in active request, awaiting...');
                            activeRequest.promise
                              .then(resolve)
                              .catch(reject);
                            return;
                          }
                          
                          // Check for other response properties
                          if (activeRequest.result) {
                            clearInterval(pollInterval);
                            console.log('Found result in active request:', activeRequest.result);
                            resolve(activeRequest.result);
                            return;
                          }
                        }
                        
                        // Timeout after max polls
                        if (pollCount >= maxPolls) {
                          clearInterval(pollInterval);
                          reject(new Error('Polling timeout: No response found in active Map after 2 minutes'));
                        }
                      }, 1000); // Poll every second
                    });
                    
                    actualResponse = await pollPromise;
                    console.log('Received response from polling:', actualResponse);
                    responseReceived = true;
                  } catch (pollError) {
                    console.warn('Polling approach failed:', pollError);
                    // All strategies failed
                  }
                }
                
                // If all strategies failed, throw error
                if (!responseReceived || (typeof actualResponse === 'string' && uuidPattern.test(actualResponse))) {
                  console.error('All strategies failed to get response. Request ID:', requestId);
                  console.error('Active Map contents:', window.crossmark?.api?.active ? Array.from(window.crossmark.api.active.entries()) : 'N/A');
                  toast.error('Transaction request timed out. Please check if you approved the transaction in Crossmark and try again.', { id: 'fund-wallet' });
                  throw new Error('Failed to receive transaction response from Crossmark. The transaction may have been cancelled or the request timed out. Please try again.');
                }
                
                // Success - update toast message
                toast.loading('Transaction signed successfully, submitting to network...', { id: 'fund-wallet' });
              }
              
              // Extract signed transaction blob from response
              // Crossmark typically returns the blob in various formats
              let signedTxBlob = null;
              
              // Helper function to recursively search for blob-like strings in an object
              const findBlobInObject = (obj, depth = 0, maxDepth = 5) => {
                if (depth > maxDepth || !obj || typeof obj !== 'object') return null;
                
                // Check if current object has blob-like properties
                const blobKeys = ['signedTransaction', 'txBlob', 'blob', 'tx', 'transaction', 'hex', 'txHex', 'signedTx'];
                for (const key of blobKeys) {
                  if (obj[key] && typeof obj[key] === 'string' && obj[key].length > 0) {
                    return obj[key];
                  }
                }
                
                // Recursively search nested objects
                for (const key in obj) {
                  if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
                    const found = findBlobInObject(obj[key], depth + 1, maxDepth);
                    if (found) return found;
                  }
                }
                
                return null;
              };
              
              // If it's already a string (hex blob), use it directly (but not if it's a UUID)
              if (typeof actualResponse === 'string' && actualResponse.length > 0 && !uuidPattern.test(actualResponse)) {
                signedTxBlob = actualResponse;
                console.log('Found blob as direct string response');
              } 
              // Check for common response structures - expanded list
              else if (actualResponse?.signedTransaction) {
                signedTxBlob = actualResponse.signedTransaction;
                console.log('Found blob in actualResponse.signedTransaction');
              } else if (actualResponse?.txBlob) {
                signedTxBlob = actualResponse.txBlob;
                console.log('Found blob in actualResponse.txBlob');
              } else if (actualResponse?.blob) {
                signedTxBlob = actualResponse.blob;
                console.log('Found blob in actualResponse.blob');
              } else if (actualResponse?.tx) {
                signedTxBlob = actualResponse.tx;
                console.log('Found blob in actualResponse.tx');
              } else if (actualResponse?.transaction) {
                signedTxBlob = actualResponse.transaction;
                console.log('Found blob in actualResponse.transaction');
              } else if (actualResponse?.hex) {
                signedTxBlob = actualResponse.hex;
                console.log('Found blob in actualResponse.hex');
              } else if (actualResponse?.txHex) {
                signedTxBlob = actualResponse.txHex;
                console.log('Found blob in actualResponse.txHex');
              } else if (actualResponse?.result) {
                // If result is a string, use it; if it's an object, check its properties
                if (typeof actualResponse.result === 'string' && !uuidPattern.test(actualResponse.result)) {
                  signedTxBlob = actualResponse.result;
                  console.log('Found blob in actualResponse.result (string)');
                } else if (actualResponse.result?.signedTransaction) {
                  signedTxBlob = actualResponse.result.signedTransaction;
                  console.log('Found blob in actualResponse.result.signedTransaction');
                } else if (actualResponse.result?.txBlob) {
                  signedTxBlob = actualResponse.result.txBlob;
                  console.log('Found blob in actualResponse.result.txBlob');
                } else if (actualResponse.result?.blob) {
                  signedTxBlob = actualResponse.result.blob;
                  console.log('Found blob in actualResponse.result.blob');
                } else if (actualResponse.result?.tx) {
                  signedTxBlob = actualResponse.result.tx;
                  console.log('Found blob in actualResponse.result.tx');
                } else if (actualResponse.result?.hex) {
                  signedTxBlob = actualResponse.result.hex;
                  console.log('Found blob in actualResponse.result.hex');
                }
              } else if (actualResponse?.response) {
                // Check nested response structures
                if (actualResponse.response?.signedTransaction) {
                  signedTxBlob = actualResponse.response.signedTransaction;
                  console.log('Found blob in actualResponse.response.signedTransaction');
                } else if (actualResponse.response?.txBlob) {
                  signedTxBlob = actualResponse.response.txBlob;
                  console.log('Found blob in actualResponse.response.txBlob');
                } else if (actualResponse.response?.blob) {
                  signedTxBlob = actualResponse.response.blob;
                  console.log('Found blob in actualResponse.response.blob');
                } else if (actualResponse.response?.data) {
                  if (actualResponse.response.data?.signedTransaction) {
                    signedTxBlob = actualResponse.response.data.signedTransaction;
                    console.log('Found blob in actualResponse.response.data.signedTransaction');
                  } else if (actualResponse.response.data?.txBlob) {
                    signedTxBlob = actualResponse.response.data.txBlob;
                    console.log('Found blob in actualResponse.response.data.txBlob');
                  } else if (actualResponse.response.data?.blob) {
                    signedTxBlob = actualResponse.response.data.blob;
                    console.log('Found blob in actualResponse.response.data.blob');
                  } else if (actualResponse.response.data?.hex) {
                    signedTxBlob = actualResponse.response.data.hex;
                    console.log('Found blob in actualResponse.response.data.hex');
                  }
                } else if (actualResponse.response?.payload) {
                  if (typeof actualResponse.response.payload === 'string' && !uuidPattern.test(actualResponse.response.payload)) {
                    signedTxBlob = actualResponse.response.payload;
                    console.log('Found blob in actualResponse.response.payload (string)');
                  } else if (actualResponse.response.payload?.signedTransaction) {
                    signedTxBlob = actualResponse.response.payload.signedTransaction;
                    console.log('Found blob in actualResponse.response.payload.signedTransaction');
                  } else if (actualResponse.response.payload?.txBlob) {
                    signedTxBlob = actualResponse.response.payload.txBlob;
                    console.log('Found blob in actualResponse.response.payload.txBlob');
                  }
                } else if (actualResponse.response?.result) {
                  if (actualResponse.response.result?.signedTransaction) {
                    signedTxBlob = actualResponse.response.result.signedTransaction;
                    console.log('Found blob in actualResponse.response.result.signedTransaction');
                  } else if (actualResponse.response.result?.txBlob) {
                    signedTxBlob = actualResponse.response.result.txBlob;
                    console.log('Found blob in actualResponse.response.result.txBlob');
                  } else if (typeof actualResponse.response.result === 'string' && !uuidPattern.test(actualResponse.response.result)) {
                    signedTxBlob = actualResponse.response.result;
                    console.log('Found blob in actualResponse.response.result (string)');
                  }
                }
              } else if (actualResponse?.data) {
                if (actualResponse.data?.signedTransaction) {
                  signedTxBlob = actualResponse.data.signedTransaction;
                  console.log('Found blob in actualResponse.data.signedTransaction');
                } else if (actualResponse.data?.txBlob) {
                  signedTxBlob = actualResponse.data.txBlob;
                  console.log('Found blob in actualResponse.data.txBlob');
                } else if (actualResponse.data?.blob) {
                  signedTxBlob = actualResponse.data.blob;
                  console.log('Found blob in actualResponse.data.blob');
                } else if (actualResponse.data?.hex) {
                  signedTxBlob = actualResponse.data.hex;
                  console.log('Found blob in actualResponse.data.hex');
                }
              } else if (actualResponse?.payload) {
                if (typeof actualResponse.payload === 'string' && !uuidPattern.test(actualResponse.payload)) {
                  signedTxBlob = actualResponse.payload;
                  console.log('Found blob in actualResponse.payload (string)');
                } else if (actualResponse.payload?.signedTransaction) {
                  signedTxBlob = actualResponse.payload.signedTransaction;
                  console.log('Found blob in actualResponse.payload.signedTransaction');
                } else if (actualResponse.payload?.txBlob) {
                  signedTxBlob = actualResponse.payload.txBlob;
                  console.log('Found blob in actualResponse.payload.txBlob');
                }
              }
              
              // If still not found, try recursive search
              if (!signedTxBlob && actualResponse && typeof actualResponse === 'object') {
                console.log('Attempting recursive search for blob in response object...');
                signedTxBlob = findBlobInObject(actualResponse);
                if (signedTxBlob) {
                  console.log('Found blob via recursive search');
                }
              }
              
              // Validate that we have a proper transaction blob (hex string, not a UUID)
              if (!signedTxBlob || typeof signedTxBlob !== 'string') {
                console.error('Invalid signed transaction blob extracted:', signedTxBlob);
                console.error('Full response structure for debugging:', {
                  originalResponse: signedTx,
                  actualResponse: actualResponse,
                  type: typeof actualResponse,
                  keys: actualResponse ? Object.keys(actualResponse) : null,
                  stringified: JSON.stringify(actualResponse, null, 2)
                });
                throw new Error('Failed to extract signed transaction blob from wallet response. Please check the console for the full response structure and try again.');
              }
              
              // Ensure it's not a UUID (UUIDs have a specific format with dashes)
              if (uuidPattern.test(signedTxBlob)) {
                console.error('Extracted value appears to be a UUID, not a transaction blob:', signedTxBlob);
                console.error('Full response structure for debugging:', {
                  originalResponse: signedTx,
                  actualResponse: actualResponse,
                  type: typeof actualResponse,
                  keys: actualResponse ? Object.keys(actualResponse) : null,
                  stringified: JSON.stringify(actualResponse, null, 2)
                });
                throw new Error(`Invalid transaction blob format: received UUID "${signedTxBlob}" instead of transaction blob. The response structure may be different for this transaction type. Please check the console for the full response and try again.`);
              }
              
              // Validate blob format: should be a hex string (alphanumeric, typically 100+ characters)
              // XRPL transaction blobs are typically hex-encoded and much longer than UUIDs
              const hexPattern = /^[0-9a-f]+$/i;
              if (!hexPattern.test(signedTxBlob)) {
                console.warn('Transaction blob does not match hex pattern. Blob preview:', signedTxBlob.substring(0, 100));
              }
              
              // Check minimum length (XRPL blobs are typically 100+ characters)
              if (signedTxBlob.length < 50) {
                console.warn('Transaction blob seems unusually short:', signedTxBlob.length, 'characters');
              }
              
              console.log('Extracted signed transaction blob (length:', signedTxBlob.length, '):', signedTxBlob.substring(0, 50) + '...');
              
              // Submit signed transaction to backend
              await submitSignedTransaction(transactionId, signedTxBlob, token);
            } catch (crossmarkError) {
              console.error('Crossmark signing error:', crossmarkError);
              console.error('Crossmark error details:', {
                name: crossmarkError?.name,
                message: crossmarkError?.message,
                code: crossmarkError?.code,
                stack: crossmarkError?.stack
              });
              console.error('Crossmark object:', window.crossmark);
              console.error('Crossmark api:', window.crossmark.api);
              console.error('Transaction that failed:', txToSign);
              
              // Provide more specific error messages
              let errorMessage = crossmarkError.message || 'Unknown error';
              
              if (crossmarkError.message?.includes('rejected') || crossmarkError.message?.includes('denied') || crossmarkError.message?.includes('cancel')) {
                errorMessage = 'Transaction signing was cancelled or rejected. Please try again.';
              } else if (crossmarkError.message?.includes('popup') || crossmarkError.message?.includes('blocked')) {
                errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
              } else if (crossmarkError.message?.includes('not connected') || crossmarkError.message?.includes('connect')) {
                errorMessage = 'Crossmark wallet is not connected. Please connect your wallet and try again.';
              } else if (crossmarkError.message?.includes('invalid') || crossmarkError.message?.includes('format')) {
                errorMessage = 'Invalid transaction format. Please check the transaction data and try again.';
              }
              
              toast.error(`Failed to sign with Crossmark wallet: ${errorMessage}`, { id: 'fund-wallet' });
              setIsFundingWallet(false);
              setFundingStep('idle');
              setTransactionData(null);
            }
          } 
          // Check for MetaMask or other Web3 wallets (for XRPL if supported)
          else if (window.ethereum) {
            console.log('MetaMask/Web3 wallet detected, attempting XRPL signing');
            try {
              // MetaMask uses xrpl_signTransaction method for XRPL transactions
              const signedTx = await window.ethereum.request({
                method: 'xrpl_signTransaction',
                params: [txToSign]
              });
              
              console.log('Transaction signed with MetaMask:', signedTx);
              console.log('Full MetaMask response:', JSON.stringify(signedTx, null, 2));
              
              // Extract signed transaction blob from response
              // MetaMask XRPL signing typically returns the blob in various formats
              let signedTxBlob = null;
              
              // If it's already a string (hex blob), use it directly
              if (typeof signedTx === 'string' && signedTx.length > 0) {
                signedTxBlob = signedTx;
              } 
              // Check for common response structures
              else if (signedTx?.signedTransaction) {
                signedTxBlob = signedTx.signedTransaction;
              } else if (signedTx?.txBlob) {
                signedTxBlob = signedTx.txBlob;
              } else if (signedTx?.result) {
                // If result is a string, use it; if it's an object, check its properties
                if (typeof signedTx.result === 'string') {
                  signedTxBlob = signedTx.result;
                } else if (signedTx.result?.signedTransaction) {
                  signedTxBlob = signedTx.result.signedTransaction;
                } else if (signedTx.result?.txBlob) {
                  signedTxBlob = signedTx.result.txBlob;
                }
              } else if (signedTx?.blob) {
                signedTxBlob = signedTx.blob;
              } else if (signedTx?.response?.signedTransaction) {
                signedTxBlob = signedTx.response.signedTransaction;
              } else if (signedTx?.data?.signedTransaction) {
                signedTxBlob = signedTx.data.signedTransaction;
              }
              
              // Validate that we have a proper transaction blob (hex string, not a UUID)
              if (!signedTxBlob || typeof signedTxBlob !== 'string') {
                console.error('Invalid signed transaction blob extracted:', signedTxBlob);
                throw new Error('Failed to extract signed transaction blob from wallet response. Please try again.');
              }
              
              // Ensure it's not a UUID (UUIDs have a specific format with dashes)
              if (signedTxBlob.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                console.error('Extracted value appears to be a UUID, not a transaction blob:', signedTxBlob);
                throw new Error('Invalid transaction blob format. Please try signing again.');
              }
              
              console.log('Extracted signed transaction blob (length:', signedTxBlob.length, '):', signedTxBlob.substring(0, 50) + '...');
              
              // Submit signed transaction to backend
              await submitSignedTransaction(transactionId, signedTxBlob, token);
            } catch (metamaskError) {
              console.error('MetaMask signing error:', metamaskError);
              // If MetaMask doesn't support XRPL, suggest Crossmark
              if (metamaskError.code === -32601 || metamaskError.message?.includes('not supported')) {
                toast.error('MetaMask does not support XRPL transactions. Please install Crossmark wallet extension.', { id: 'fund-wallet' });
              } else {
                toast.error(`Failed to sign with MetaMask: ${metamaskError.message || 'Unknown error'}. Please try again.`, { id: 'fund-wallet' });
              }
              setIsFundingWallet(false);
              setFundingStep('idle');
              setTransactionData(null);
            }
          } else {
            toast.error('No XRPL wallet detected. Please install Crossmark wallet extension or use MetaMask with XRPL support.', { id: 'fund-wallet' });
            setIsFundingWallet(false);
            setFundingStep('idle');
            setTransactionData(null);
          }
        } catch (browserWalletError) {
          console.error('Error with browser wallet flow:', browserWalletError);
          toast.error('Failed to sign transaction with browser wallet. Please try again.', { id: 'fund-wallet' });
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

  // Helper function to submit signed transaction for browser wallet flow
  const submitSignedTransaction = async (transactionId, signedTxBlob, token) => {
    try {
      setFundingStep('completing');
      toast.loading('Submitting signed transaction...', { id: 'fund-wallet' });
      
      // Validate inputs
      if (!transactionId || typeof transactionId !== 'string') {
        console.error('Invalid transaction ID:', transactionId, 'Type:', typeof transactionId);
        throw new Error('Invalid transaction ID. Please try the transaction again.');
      }
      
      if (!signedTxBlob || typeof signedTxBlob !== 'string') {
        console.error('Invalid signedTxBlob:', signedTxBlob, 'Type:', typeof signedTxBlob);
        throw new Error('Invalid signed transaction blob. The wallet response may be in an unexpected format. Please try signing again.');
      }
      
      // Ensure we're not accidentally sending the transaction ID as the blob
      if (signedTxBlob === transactionId) {
        console.error('ERROR: signedTxBlob is the same as transactionId! This should not happen.');
        console.error('Transaction ID:', transactionId);
        console.error('Signed TX Blob:', signedTxBlob);
        throw new Error('Invalid transaction blob: received transaction ID instead of signed blob. Please try signing again.');
      }
      
      // Validate blob format (should be a hex string, not a UUID)
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidPattern.test(signedTxBlob)) {
        console.error('ERROR: signedTxBlob appears to be a UUID:', signedTxBlob);
        console.error('This suggests the wallet response structure may be different than expected.');
        throw new Error(`Invalid transaction blob format: received UUID "${signedTxBlob}" instead of transaction blob. The wallet may have returned a request ID instead of the signed transaction. Please check the console for details and try signing again.`);
      }
      
      // Validate blob format: should be a hex string (alphanumeric)
      // XRPL transaction blobs are typically hex-encoded and much longer than UUIDs
      const hexPattern = /^[0-9a-f]+$/i;
      if (!hexPattern.test(signedTxBlob)) {
        console.warn('Warning: Transaction blob does not match expected hex pattern.');
        console.warn('Blob preview (first 100 chars):', signedTxBlob.substring(0, 100));
        console.warn('Blob length:', signedTxBlob.length);
        // Don't throw here - some blobs might have different encoding, let backend validate
      }
      
      // Transaction blobs are typically hex strings (even length, alphanumeric)
      // They should be longer than a UUID (typically 100+ characters)
      if (signedTxBlob.length < 50) {
        console.warn('Warning: signedTxBlob seems unusually short:', signedTxBlob.length, 'characters');
        console.warn('Expected length for XRPL transaction blobs is typically 100+ characters');
        // Don't throw here - let backend validate, but log the warning
      }
      
      // Additional validation: check if blob looks reasonable (not empty, not just whitespace)
      const trimmedBlob = signedTxBlob.trim();
      if (trimmedBlob.length === 0) {
        console.error('ERROR: Transaction blob is empty or only whitespace');
        throw new Error('Invalid transaction blob: received empty blob. Please try signing again.');
      }
      
      const submitUrl = getApiUrl('api/wallet/fund/submit');
      const requestBody = {
        transactionId: transactionId,
        signedTxBlob: signedTxBlob
      };
      
      console.log('Submitting signed transaction to:', submitUrl);
      console.log('Transaction ID:', transactionId);
      console.log('Signed TX Blob (first 100 chars):', signedTxBlob.substring(0, 100));
      console.log('Signed TX Blob length:', signedTxBlob.length);
      console.log('Request body (without blob):', { transactionId, signedTxBlobLength: signedTxBlob.length });
      
      const submitResponse = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Submit transaction response status:', submitResponse.status);
      
      const submitResult = await submitResponse.json().catch(() => ({}));
      console.log('Submit transaction response body:', submitResult);
      
      if (submitResponse.ok && submitResult.success) {
        toast.success('Wallet funded successfully!', { id: 'fund-wallet' });
        setShowFundWalletModal(false);
        setFundWalletForm({ amount: '', currency: 'XRP' });
        setTransactionData(null);
        setFundingStep('idle');
        setIsFundingWallet(false);
        await fetchDashboardSummary();
      } else {
        const errorMessage = submitResult.message || submitResult.error || 'Failed to submit transaction';
        console.error('Transaction submission failed:', {
          status: submitResponse.status,
          statusText: submitResponse.statusText,
          response: submitResult
        });
        toast.error(`${errorMessage}. Please try again.`, { id: 'fund-wallet' });
        setFundingStep('idle');
        setIsFundingWallet(false);
      }
    } catch (submitError) {
      console.error('Error submitting signed transaction:', submitError);
      console.error('Error details:', {
        name: submitError?.name,
        message: submitError?.message,
        stack: submitError?.stack
      });
      
      // Provide more specific error messages based on error type
      let errorMessage = 'An error occurred while submitting the transaction.';
      if (submitError?.message) {
        errorMessage = submitError.message;
      } else if (submitError?.name === 'TypeError' && submitError?.message?.includes('fetch')) {
        errorMessage = 'Network error: Could not connect to the server. Please check your internet connection and try again.';
      } else if (submitError?.name === 'SyntaxError') {
        errorMessage = 'Invalid response from server. Please try again.';
      }
      
      toast.error(`${errorMessage} Please try again.`, { id: 'fund-wallet' });
      setFundingStep('idle');
      setIsFundingWallet(false);
    }
  };

  const handleWithdrawWallet = async (e) => {
    e.preventDefault();
    console.log('handleWithdrawWallet submitted with form:', withdrawWalletForm);

    if (!withdrawWalletForm.amount || parseFloat(withdrawWalletForm.amount) <= 0) {
      console.warn('Invalid withdraw amount:', withdrawWalletForm.amount);
      toast.error('Please enter a valid amount');
      return;
    }

    if (!withdrawWalletForm.destinationAddress || withdrawWalletForm.destinationAddress.trim().length < 10) {
      console.warn('Invalid destination address:', withdrawWalletForm.destinationAddress);
      toast.error('Please enter a valid destination address');
      return;
    }

    setIsWithdrawingWallet(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No auth token found while withdrawing wallet');
        toast.error('Please login to withdraw from your wallet');
        setIsWithdrawingWallet(false);
        return;
      }

      const apiUrl = getApiUrl('api/wallet/withdraw');
      console.log('Calling withdraw wallet API:', apiUrl, {
        amount: withdrawWalletForm.amount,
        currency: withdrawWalletForm.currency,
        destinationAddress: withdrawWalletForm.destinationAddress,
      });

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

      console.log('Withdraw wallet API response status:', response.status);

      const result = await response.json().catch(() => ({}));
      console.log('Withdraw wallet API response body:', result);

      if (response.ok && result.success) {
        toast.success('Withdrawal request submitted successfully!');
        setShowWithdrawWalletModal(false);
        setWithdrawWalletForm({
          amount: '',
          currency: 'USD',
          destinationAddress: ''
        });
        // Refresh dashboard data
        await fetchDashboardSummary();
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

  const activeIllustration = useMemo(() => {
    if (currentStep === 1) return uploadIllustration;
    if (currentStep === 2) return chainsIllustration;
    return mockIllustration;
  }, [currentStep]);

  const isKycCompleteForAccount =
    accountType === 'Business Suite' ? businessKycComplete : kycComplete;

  const formattedToday = useMemo(() => {
    const now = new Date();
    const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
    const day = now.getDate();
    const month = now.toLocaleDateString(undefined, { month: 'long' });
    return `${weekday}, ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} ${month}`;
  }, []);

  const handleInputChange = (field, value) => {
    setKycForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field, file) => {
    setDocuments((prev) => ({ ...prev, [field]: file || null }));
  };

  const advanceStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleSubmitAndNext = (event) => {
    event.preventDefault();
    if (currentStep === 2) {
      if (accountType === 'Business Suite') {
        setBusinessKycComplete(true);
        localStorage.setItem('businessKycComplete', 'true');
      } else {
        setKycComplete(true);
        localStorage.setItem('kycComplete', 'true');
      }
    } else {
      advanceStep();
    }
  };

  const stepStatus = (index) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'upcoming';
  };

  const renderDashboardView = () => {
    console.log('renderDashboardView - dashboardData:', dashboardData);
    console.log('renderDashboardView - isLoadingDashboard:', isLoadingDashboard);
    
    return (
      <>
        {/* Mobile Dashboard */}
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
                  {(() => {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/a00a5740-ea9a-4e7a-a021-4868da9e4ca2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.js:1947',message:'User profile loading check',data:{isLoadingUserProfile},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                    // #endregion
                    return isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userFullName;
                  })()}
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
                <button
                  type="button"
                  className="account-chip-mobile"
                  onClick={() => {
                    if (accountType === 'Business Suite') {
                      setSwitchMessage('switching to personal');
                      setIsSwitchingAccountType(true);
                      setTimeout(() => {
                        setAccountType('Personal');
                        setIsSwitchingAccountType(false);
                        setSwitchMessage('');
                      }, 2000);
                    } else {
                      setSwitchMessage('switching to business suite');
                      setIsSwitchingAccountType(true);
                      setTimeout(() => {
                        setAccountType('Business Suite');
                        setIsSwitchingAccountType(false);
                        setSwitchMessage('');
                      }, 2000);
                    }
                  }}
                >
                  <div className="account-chip-text">
                    <span className="account-label">Account</span>
                    <span className="account-type">
                      {accountType === 'Business Suite' ? 'Business Suite' : 'Personal'}
                    </span>
                  </div>
                  <span className="account-chip-icon">
                    <ChevronRight size={14} />
                  </span>
                </button>
              </div>

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

              <div className="mobile-sidebar-section">
                <p className="mobile-sidebar-section-label">Wallet</p>
                <nav className="mobile-sidebar-nav">
                  <button
                    type="button"
                    className="mobile-sidebar-nav-item"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (hasWallet) {
                        setShowWalletModal(true);
                      } else {
                        handleCreateWallet();
                      }
                    }}
                  >
                    <span>{hasWallet ? 'View wallet' : 'Create wallet'}</span>
                  </button>
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
                  <span className="mobile-sidebar-trustiscore-badge">
                    {dashboardData?.trustiscore?.score !== undefined 
                      ? dashboardData.trustiscore.score 
                      : (isLoadingDashboard ? '...' : '97')}
                  </span>
                </div>

                <button 
                  type="button" 
                  className="mobile-sidebar-logout"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    // Add logout logic here
                  }}
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Total Balance Card */}
          <div className="mobile-total-balance-card">
            <div className="mobile-balance-header">
              <div className="mobile-balance-title">
                <Wallet size={18} />
                <span>Total Balance</span>
              </div>
              <button type="button" onClick={() => setShowBalance(!showBalance)} className="mobile-eye-toggle">
                {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <div className="mobile-balance-amount">
              {showBalance 
                ? (isLoadingDashboard 
                    ? <LoadingIndicator size="sm" />
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
                        const usdBalance = getBalanceValue(dashboardData, 'usd');
                        if (usdBalance !== null && usdBalance !== undefined) {
                          return `$${Number(usdBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                        return '$0.00';
                      })())
                : '••••••'}
            </div>
            <div className="mobile-balance-xrp">
              ≈ {(() => {
                  const xrpBalance = getBalanceValue(dashboardData, 'xrp');
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/a00a5740-ea9a-4e7a-a021-4868da9e4ca2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.js:2183',message:'Checking isLoadingDashboard for XRP balance',data:{isLoadingDashboard},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                  // #endregion
                  if (isLoadingDashboard) {
                    return <LoadingIndicator size="sm" />;
                  }
                  if (xrpBalance !== null && xrpBalance !== undefined) {
                    return Number(xrpBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  }
                  return '0.00';
                })()} XRP
            </div>
            <div className="mobile-balance-actions">
              <button 
                type="button" 
                className="mobile-fund-btn"
                onClick={() => setShowFundWalletModal(true)}
              >
                <Plus size={16} />
                Fund Wallet
              </button>
              <button 
                type="button" 
                className="mobile-withdraw-btn"
                onClick={() => setShowWithdrawWalletModal(true)}
              >
                <Plus size={16} />
                Withdraw
              </button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="mobile-metrics-cards">
            <div className="mobile-metric-card">
              <div className="mobile-metric-header">
                <FileCheck size={16} />
                <span>Active Escrow</span>
              </div>
              <div className="mobile-metric-value">
                {dashboardData?.activeEscrows?.count !== undefined 
                  ? dashboardData.activeEscrows.count 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 23)}
              </div>
              <div className="mobile-metric-subvalue">
                ${dashboardData?.activeEscrows?.lockedAmount !== undefined 
                    ? dashboardData.activeEscrows.lockedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                    : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : '156,789')} locked
              </div>
            <button
              type="button"
              className="mobile-metric-btn"
              onClick={() => setShowCreateEscrowModal(true)}
            >
                <Plus size={14} />
                Create Escrow
              </button>
            </div>
            <div className="mobile-metric-card">
              <div className="mobile-metric-header">
                <ShieldCheck size={16} />
                <span>Trustiscore</span>
              </div>
              <div className="mobile-metric-value">
                {dashboardData?.trustiscore?.score !== undefined 
                  ? dashboardData.trustiscore.score 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 70)}
                <span className="mobile-metric-suffix">/100</span>
              </div>
              <div className="mobile-metric-subvalue">
                {dashboardData?.trustiscore?.level !== undefined 
                  ? dashboardData.trustiscore.level 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 'Platinum')}
              </div>
              <button type="button" className="mobile-metric-btn">
                View Level
              </button>
            </div>
          </div>

          {/* Portfolio Section */}
          <div className="mobile-portfolio-section">
            <div className="mobile-section-header">
              <div className="mobile-section-indicator"></div>
              <h3 className="mobile-section-title">Portfolio</h3>
              <div className="mobile-section-dropdown">
                <span>Monthly</span>
                <ChevronDown size={14} />
              </div>
            </div>
            <div className="mobile-chart-container">
              <div className="mobile-chart-y-axis">
                {[0, 10, 20, 30, 40, 50].map((val) => (
                  <span key={val}>{val}k</span>
                ))}
              </div>
              <div className="mobile-bar-chart">
                {isLoadingPortfolio && (
                  <span className="mobile-rate-currency"><LoadingIndicator size="sm" /></span>
                )}

                {!isLoadingPortfolio && portfolioPoints && portfolioPoints.length > 0 && (() => {
                  const maxValue =
                    portfolioPoints.reduce(
                      (max, p) => Math.max(max, Number(p.value ?? 0)),
                      0
                    ) || 1;

                  return portfolioPoints.map((point, index) => {
                    const value = Number(point.value ?? 0);
                    const height = Math.max(5, (value / maxValue) * 100);
                    const label = point.label ?? '';
                    const isLastBar = index === portfolioPoints.length - 1;

                    return (
                      <div key={`${label}-${index}`} className="mobile-bar-wrapper">
                        <div
                          className={`mobile-bar ${isLastBar ? 'mobile-bar-last' : ''}`}
                          style={{ height: `${height}%` }}
                        />
                        <span className="mobile-bar-label">{label}</span>
                      </div>
                    );
                  });
                })()}

                {!isLoadingPortfolio && (!portfolioPoints || portfolioPoints.length === 0) && (
                  <span className="mobile-rate-currency">No portfolio data</span>
                )}
              </div>
            </div>
          </div>

          {/* Live Exchange Rate Section */}
          <div className="mobile-exchange-rate-section">
            <div className="mobile-section-header">
              <div className="mobile-section-indicator"></div>
              <h3 className="mobile-section-title">Live Exchange Rate</h3>
            </div>
            <div className="mobile-rate-list">
              {isLoadingRates && (
                <div className="mobile-rate-item">
                  <div className="mobile-rate-info">
                    <span className="mobile-rate-currency"><LoadingIndicator size="sm" /></span>
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
                  <div className="mobile-rate-item" key={`${code}-${index}`}>
                    <div className="mobile-rate-flag">
                      <img src={`https://flagcdn.com/w40/${flagCode}.png`} alt={code} />
                    </div>
                    <div className="mobile-rate-info">
                      <span className="mobile-rate-currency">{code}</span>
                    </div>
                    <div className="mobile-rate-value-change">
                      <span className="mobile-rate-value">
                        {symbol}{Number(rate.rate ?? rate.value ?? 0).toFixed(4)}
                      </span>
                      <div className={`mobile-rate-change ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
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
                <div className="mobile-rate-item">
                  <div className="mobile-rate-info">
                    <span className="mobile-rate-currency">No exchange rates available</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Wallet Balance Section */}
          <div className="mobile-wallet-balance-section">
            <div className="mobile-section-header">
              <div className="mobile-section-indicator"></div>
              <h3 className="mobile-section-title">Wallet Balance</h3>
            </div>
            <div className="mobile-wallet-list">
              <div className="mobile-wallet-item">
                <div className="mobile-wallet-icon-group">
                  <div className="mobile-wallet-icon">
                    <img 
                      src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                      alt="XRP" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  </div>
                  <div className="mobile-wallet-icon-info">
                    <span className="mobile-wallet-name">XRP</span>
                    <span className="mobile-wallet-crypto">
                      {showBalance 
                        ? (isLoadingWalletBalances 
                            ? <LoadingIndicator size="sm" />
                            : (walletBalances?.xrp !== undefined && walletBalances?.xrp !== null && walletBalances.xrp > 0
                                ? `${Number(walletBalances.xrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XRP`
                                : '0.00 XRP'))
                        : '••••••'}
                    </span>
                  </div>
                </div>
                <div className="mobile-wallet-value-change">
                  <span className="mobile-wallet-amount">
                    {showBalance 
                      ? (() => {
                          if (walletBalances?.xrp && exchangeRates) {
                            const xrpRate = exchangeRates.find(r => (r.currency || r.code || '').toUpperCase() === 'USD');
                            if (xrpRate && xrpRate.rate) {
                              const usdValue = Number(walletBalances.xrp) * Number(xrpRate.rate);
                              return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            }
                          }
                          if (dashboardData?.balance?.usd !== undefined && dashboardData?.balance?.usd !== null) {
                            return `$${Number(dashboardData.balance.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          }
                          return isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : '$0.00';
                        })()
                      : '••••••'}
                  </span>
                  <div className="mobile-wallet-change positive">
                    <TrendingUp size={14} />
                    <span>+2.4%</span>
                  </div>
                </div>
              </div>
              <div className="mobile-wallet-item">
                <div className="mobile-wallet-icon-group">
                  <div className="mobile-wallet-icon usdt-icon">
                    <img 
                      src="https://assets.coingecko.com/coins/images/325/small/Tether-logo.png" 
                      alt="USDT" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  </div>
                  <div className="mobile-wallet-icon-info">
                    <span className="mobile-wallet-name">Tether USD</span>
                    <span className="mobile-wallet-crypto">
                      {showBalance 
                        ? (isLoadingWalletBalances 
                            ? <LoadingIndicator size="sm" />
                            : (walletBalances?.usdt !== undefined && walletBalances?.usdt !== null && walletBalances.usdt > 0
                                ? `${Number(walletBalances.usdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                                : '0.00 USDT'))
                        : '••••••'}
                    </span>
                  </div>
                </div>
                <div className="mobile-wallet-value-change">
                    <span className="mobile-wallet-amount">
                      {showBalance 
                        ? (isLoadingWalletBalances 
                            ? <LoadingIndicator size="sm" />
                            : (walletBalances?.usdt !== undefined && walletBalances?.usdt !== null && walletBalances.usdt > 0
                                ? `$${Number(walletBalances.usdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : '$0.00'))
                        : '••••••'}
                    </span>
                  <div className="mobile-wallet-change neutral">
                    <span>0.0%</span>
                  </div>
                </div>
              </div>
              <div className="mobile-wallet-item">
                <div className="mobile-wallet-icon-group">
                  <div className="mobile-wallet-icon usdc-icon">
                    <img 
                      src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389" 
                      alt="USDC" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  </div>
                  <div className="mobile-wallet-icon-info">
                    <span className="mobile-wallet-name">USD Coin</span>
                    <span className="mobile-wallet-crypto">
                      {showBalance 
                        ? (isLoadingWalletBalances 
                            ? <LoadingIndicator size="sm" />
                            : (walletBalances?.usdc !== undefined && walletBalances?.usdc !== null && walletBalances.usdc > 0
                                ? `${Number(walletBalances.usdc).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
                                : '0.00 USDC'))
                        : '••••••'}
                    </span>
                  </div>
                </div>
                <div className="mobile-wallet-value-change">
                  <span className="mobile-wallet-amount">
                    {showBalance 
                      ? (walletBalances?.usdc !== undefined && walletBalances?.usdc !== null
                          ? `$${Number(walletBalances.usdc).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : (isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : '$8,750.00'))
                      : '••••••'}
                  </span>
                  <div className="mobile-wallet-change positive">
                    <TrendingUp size={14} />
                    <span>+0.1%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Escrow Section */}
          <div className="mobile-escrow-section">
            <div className="mobile-section-header">
              <div className="mobile-section-indicator"></div>
              <h3 className="mobile-section-title">Live Escrow</h3>
            </div>
            <div className="mobile-escrow-list">
              {isLoadingEscrows ? (
                <div className="mobile-escrow-item">
                  <div className="mobile-escrow-loading"><LoadingIndicator size="md" /></div>
                </div>
              ) : escrows && escrows.length > 0 ? (
                escrows.slice(0, 3).map((escrow, index) => {
                  const escrowId = escrow.id || escrow.escrowId || escrow._id || `#ESC-2024-${String(index + 1).padStart(3, '0')}`;
                  const payerName = escrow.payerName || escrow.payer?.name || escrow.senderName || 'John Depp';
                  const payerAvatar = escrow.payerAvatar || escrow.payer?.avatar || null;
                  const payerInitials = payerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  const counterpartyName = escrow.counterpartyName || escrow.counterparty?.name || escrow.receiverName || 'Sarah Wilson';
                  const counterpartyAvatar = escrow.counterpartyAvatar || escrow.counterparty?.avatar || null;
                  const counterpartyInitials = counterpartyName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  
                  // Get amount - try XRP first, then USD
                  const xrpAmount = escrow.amount?.xrp || escrow.amount?.XRP || escrow.xrpAmount || null;
                  const usdAmount = escrow.amount?.usd || escrow.amount?.USD || escrow.usdAmount || escrow.totalAmount || null;
                  
                  // Calculate USD equivalent if we have XRP amount and exchange rate
                  let displayXrp = xrpAmount;
                  let displayUsd = usdAmount;
                  if (xrpAmount && exchangeRates && exchangeRates.length > 0) {
                    const xrpRate = exchangeRates.find(r => (r.currency || r.code || '').toUpperCase() === 'XRP');
                    if (xrpRate && xrpRate.rate && !displayUsd) {
                      displayUsd = Number(xrpAmount) * Number(xrpRate.rate);
                    }
                  }
                  
                  const status = escrow.status || escrow.escrowStatus || 'pending';
                  const statusText = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
                  // Normalize status for CSS class (handle spaces, underscores, etc.)
                  const statusClass = status.toLowerCase().replace(/[\s_]/g, '_');
                  
                  return (
                    <div key={escrowId || index} className="mobile-escrow-item">
                      <div className="mobile-escrow-id">{escrowId}</div>
                      <div className="mobile-escrow-parties">
                        <div className="mobile-escrow-party">
                          {payerAvatar ? (
                            <img src={payerAvatar} alt={payerName} className="mobile-escrow-avatar" />
                          ) : (
                            <div className="mobile-escrow-avatar-initials">{payerInitials}</div>
                          )}
                          <span className="mobile-escrow-party-name">{payerName}</span>
                        </div>
                        <ArrowRight size={16} className="mobile-escrow-arrow" />
                        <div className="mobile-escrow-party">
                          {counterpartyAvatar ? (
                            <img src={counterpartyAvatar} alt={counterpartyName} className="mobile-escrow-avatar" />
                          ) : (
                            <div className="mobile-escrow-avatar-initials">{counterpartyInitials}</div>
                          )}
                          <span className="mobile-escrow-party-name">{counterpartyName}</span>
                        </div>
                      </div>
                      <div className="mobile-escrow-amounts">
                        <div className="mobile-escrow-xrp">
                          {displayXrp ? `${Number(displayXrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XRP` : '0.00 XRP'}
                        </div>
                        {displayUsd && (
                          <div className="mobile-escrow-usd">
                            ≈ ${Number(displayUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      </div>
                      <button className={`mobile-escrow-status ${statusClass}`}>
                        {statusText}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="mobile-escrow-item">
                  <div className="mobile-escrow-empty">No active escrows</div>
                </div>
              )}
            </div>
          </div>

          {/* Trusticard Section */}
          <div className="mobile-trusticard-section">
            <div className="mobile-section-header">
              <div className="mobile-section-indicator"></div>
              <h3 className="mobile-section-title">Trusticard</h3>
            </div>
            <div className="mobile-trusticard">
              <div className="mobile-card-header-info">
                <div className="mobile-card-logo">
                  <img src={logoWhite} alt="TrustiChain" className="mobile-card-logo-img" />
                  <span>TrustiChain</span>
                </div>
                <div className="mobile-card-type">Premium Debit</div>
              </div>
              <div className="mobile-card-number">7834 **** **** 6453</div>
              <div className="mobile-card-holder">
                <span className="mobile-card-holder-label">Card holder</span>
                <span className="mobile-card-holder-name">
                  {isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userFullName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Dashboard */}
        <div className="dashboard-content">
        {/* Breadcrumb */}
        <div className="card-breadcrumb">
          <span className="breadcrumb-root">General</span>
          <span className="breadcrumb-divider">›</span>
          <span className="breadcrumb-current">Dashboard</span>
        </div>
        {/* Summary Cards */}
        <div className="dashboard-summary-cards">
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
                      ? <LoadingIndicator size="sm" />
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
                ≈ {dashboardData?.balance?.xrp !== undefined && dashboardData?.balance?.xrp !== null 
                    ? Number(dashboardData.balance.xrp).toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 }) 
                    : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : '0.000000')} XRP
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
                onClick={() => setShowWithdrawWalletModal(true)}
              >
                + Withdraw
              </button>
            </div>
          </div>

          <div className="summary-card active-escrow-card">
            <div className="summary-card-header">
              <ShieldCheck size={16} />
              <h3>Active Escrow</h3>
            </div>
            <div className="summary-card-value-row">
              <div className="summary-card-value">
                {dashboardData?.activeEscrows?.count !== undefined 
                  ? dashboardData.activeEscrows.count 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 23)}
              </div>
              <div className="summary-card-subvalue">
                ${dashboardData?.activeEscrows?.lockedAmount !== undefined 
                    ? dashboardData.activeEscrows.lockedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                    : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : '156,789')} locked
              </div>
            </div>
            <button
              type="button"
              className="summary-card-btn primary"
              onClick={() => setShowCreateEscrowModal(true)}
            >
              + Create Escrow
            </button>
          </div>

          <div className="summary-card trustiscore-card">
            <div className="summary-card-header">
              <ShieldCheck size={16} />
              <h3>Trustiscore</h3>
            </div>
            <div className="summary-card-value-row">
              <div className="summary-card-value">
                {dashboardData?.trustiscore?.score !== undefined 
                  ? dashboardData.trustiscore.score 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 70)}
                <span className="summary-card-value-suffix">/100</span>
              </div>
              <div className="summary-card-subvalue">
                {dashboardData?.trustiscore?.level !== undefined 
                  ? dashboardData.trustiscore.level 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 'Platinum')}
              </div>
            </div>
            <button type="button" className="summary-card-btn secondary">View Level</button>
          </div>

          <div className="summary-card total-escrowed-card">
            <div className="summary-card-header">
              <CreditCard size={16} />
              <h3>Total Escrowed</h3>
            </div>
            <div className="summary-card-value-row">
              <div className="summary-card-value">
                ${totalEscrowedAmount !== null && totalEscrowedAmount !== undefined
                    ? totalEscrowedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                    : (isLoadingTotalEscrowed ? <LoadingIndicator size="sm" /> : '0.00')}
              </div>
            </div>
            <button type="button" className="summary-card-btn secondary">View Escrow</button>
          </div>
        </div>

        {/* Middle Section */}
        <div className="dashboard-middle">
          <div className="dashboard-left-column">
          {/* Portfolio Chart */}
          <div className="dashboard-chart-card">
            <div className="chart-header">
              <h3>Portfolio</h3>
              <div className="chart-dropdown">
                <span>Monthly</span>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="chart-container">
              <div className="chart-y-axis">
                {[0, 10, 20, 30, 40, 50].map((val) => (
                  <span key={val}>{val}k</span>
                ))}
              </div>
              <div className="bar-chart">
                {isLoadingPortfolio && (
                  <span className="rate-currency"><LoadingIndicator size="md" /></span>
                )}

                {!isLoadingPortfolio && portfolioPoints && portfolioPoints.length > 0 && (() => {
                  const maxValue =
                    portfolioPoints.reduce(
                      (max, p) => Math.max(max, Number(p.value ?? 0)),
                      0
                    ) || 1;

                  return portfolioPoints.map((point, index) => {
                    const value = Number(point.value ?? 0);
                    const height = Math.max(5, (value / maxValue) * 100);
                    const label = point.label ?? '';

                    return (
                      <div key={`${label}-${index}`} className="bar-wrapper">
                        <div
                          className={`bar ${index === portfolioPoints.length - 1 ? 'bar-purple' : ''}`}
                          style={{ height: `${height}%` }}
                        />
                        <span className="bar-label">{label}</span>
                      </div>
                    );
                  });
                })()}

                {!isLoadingPortfolio && (!portfolioPoints || portfolioPoints.length === 0) && (
                  <span className="rate-currency">No portfolio data</span>
                )}
              </div>
            </div>
          </div>

            {/* Live Escrow Table */}
            <div className="escrow-table-card">
              <div className="table-header">
                <h3>Live Escrow</h3>
                <a href="#" className="view-link">View Escrow</a>
              </div>
              <div className="table-wrapper">
                <table className="escrow-table">
                  <thead>
                    <tr>
                      <th># Escrow ID <ChevronDown size={14} /></th>
                      <th>Parties <ChevronDown size={14} /></th>
                      <th>Amount <ChevronDown size={14} /></th>
                      <th>Status <ChevronDown size={14} /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingEscrows && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                          <LoadingIndicator size="md" />
                        </td>
                      </tr>
                    )}
                    {!isLoadingEscrows && escrows.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                          No escrows found
                        </td>
                      </tr>
                    )}
                    {!isLoadingEscrows && escrows.length > 0 && escrows.map((escrow) => {
                      // Format escrow ID (use short version or format)
                      const escrowId = escrow.id ? `#${escrow.id.substring(0, 8).toUpperCase()}` : '#ESC-N/A';
                      
                      // Get counterparty name
                      const counterpartyName = escrow.counterpartyName || 'Unknown';
                      
                      // Generate initials for avatar
                      const getInitials = (name) => {
                        if (!name) return '??';
                        const parts = name.trim().split(/\s+/);
                        if (parts.length >= 2) {
                          return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
                        }
                        return name.substring(0, 2).toUpperCase();
                      };
                      
                      // Format amounts
                      const xrpAmount = escrow.amount?.xrp 
                        ? Number(escrow.amount.xrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
                        : '0.00';
                      const usdAmount = escrow.amount?.usd 
                        ? Number(escrow.amount.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '0.00';
                      
                      // Map status to badge class and label
                      const getStatusBadge = (status) => {
                        const statusLower = (status || '').toLowerCase();
                        if (statusLower === 'active') {
                          return { class: 'pending', label: 'Active' };
                        } else if (statusLower === 'pending' || statusLower === 'pending release') {
                          return { class: 'pending', label: 'Pending release' };
                        } else if (statusLower === 'review' || statusLower === 'under review') {
                          return { class: 'review', label: 'Under Review' };
                        } else if (statusLower === 'completed' || statusLower === 'complete') {
                          return { class: 'completed', label: 'Completed' };
                        } else {
                          return { class: 'pending', label: status || 'Unknown' };
                        }
                      };
                      
                      const statusBadge = getStatusBadge(escrow.status);
                      
                      return (
                        <tr key={escrow.id || escrow.xrplEscrowId}>
                          <td>{escrowId}</td>
                          <td>
                            <div className="party-info">
                              <div className="party-main">
                                <div className="party-avatar">{getInitials(counterpartyName)}</div>
                                <span>{counterpartyName}</span>
                              </div>
                              <div className="party-subtitle">
                                <ArrowRight size={14} />
                                <span>{userFullName || 'You'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>{xrpAmount} XRP</div>
                            <div className="amount-usd">≈ ${usdAmount}</div>
                          </td>
                          <td>
                            <span className={`status-badge ${statusBadge.class}`}>
                              {statusBadge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Exchange Rate & Wallet Balance */}
          <div className="dashboard-right-cards">
            <div className="exchange-rate-card">
              <h3>Live Exchange Rate</h3>
              <div className="rate-list">
                {isLoadingRates && (
                  <div className="rate-item">
                    <div className="rate-info">
                      <span className="rate-currency"><LoadingIndicator size="sm" /></span>
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

            <div className="wallet-balance-card">
              <h3>Wallet Balance</h3>
              <div className="wallet-list">
                <div className="wallet-item">
                  <div className="wallet-icon-group">
                    <div className="wallet-icon">
                      <img 
                        src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                        alt="XRP" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    </div>
                    <div className="wallet-icon-info">
                    <span className="wallet-name">XRP</span>
                      <span className="wallet-crypto">
                        {showBalance 
                          ? (walletBalances?.xrp !== undefined && walletBalances?.xrp !== null
                              ? `${Number(walletBalances.xrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP`
                              : (isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : '0.00 XRP'))
                          : '••••••'}
                      </span>
                    </div>
                  </div>
                  <div className="wallet-value-change">
                    <span className="wallet-amount">
                      {showBalance 
                        ? (() => {
                            // Calculate USD value for XRP using exchange rate if available
                            if (walletBalances?.xrp && exchangeRates) {
                              const xrpRate = exchangeRates.find(r => (r.currency || r.code || '').toUpperCase() === 'USD');
                              if (xrpRate && xrpRate.rate) {
                                const usdValue = Number(walletBalances.xrp) * Number(xrpRate.rate);
                                return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                              }
                            }
                            // Fallback to dashboard total USD if available
                            if (dashboardData?.balance?.usd !== undefined && dashboardData?.balance?.usd !== null) {
                              return `$${Number(dashboardData.balance.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            }
                            return isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : '$0.00';
                          })()
                        : '••••••'}
                    </span>
                  <div className="wallet-change positive">
                    <TrendingUp size={14} />
                    <span>+2.4%</span>
                    </div>
                  </div>
                </div>
                <div className="wallet-item">
                  <div className="wallet-icon-group">
                    <div className="wallet-icon usdt-icon">
                      <img 
                        src="https://assets.coingecko.com/coins/images/325/small/Tether-logo.png" 
                        alt="USDT" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    </div>
                    <div className="wallet-icon-info">
                    <span className="wallet-name">Tether USD</span>
                      <span className="wallet-crypto">
                        {showBalance 
                          ? (walletBalances?.usdt !== undefined && walletBalances?.usdt !== null
                              ? `${Number(walletBalances.usdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                              : (isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : '0.00 USDT'))
                          : '••••••'}
                      </span>
                    </div>
                  </div>
                  <div className="wallet-value-change">
                    <span className="wallet-amount">
                      {showBalance 
                        ? (walletBalances?.usdt !== undefined && walletBalances?.usdt !== null
                            ? `$${Number(walletBalances.usdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : (isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : '$0.00'))
                        : '••••••'}
                    </span>
                  <div className="wallet-change neutral">
                    <span>0.0%</span>
                    </div>
                  </div>
                </div>
                <div className="wallet-item">
                  <div className="wallet-icon-group">
                    <div className="wallet-icon usdc-icon">
                      <img 
                        src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389" 
                        alt="USDC" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    </div>
                    <div className="wallet-icon-info">
                    <span className="wallet-name">USD Coin</span>
                      <span className="wallet-crypto">
                        {showBalance 
                          ? (walletBalances?.usdc !== undefined && walletBalances?.usdc !== null
                              ? `${Number(walletBalances.usdc).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
                              : (isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : '0.00 USDC'))
                          : '••••••'}
                      </span>
                    </div>
                  </div>
                  <div className="wallet-value-change">
                    <span className="wallet-amount">
                      {showBalance 
                        ? (walletBalances?.usdc !== undefined && walletBalances?.usdc !== null
                            ? `$${Number(walletBalances.usdc).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : (isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : '$0.00'))
                        : '••••••'}
                    </span>
                  <div className="wallet-change positive">
                    <TrendingUp size={14} />
                    <span>+0.1%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trusticard */}
          <div className="trusticard-card">
            <h3>Trusticard</h3>
            <div className="virtual-card">
              <div className="card-header-info">
                <div className="card-logo">
                  <img src={logoWhite} alt="TrustiChain" className="card-logo-img" />
                  <span>TrustiChain</span>
                </div>
                <div className="card-type">Premium Debit</div>
              </div>
                <div className="card-number">7834 **** **** 6453</div>
                <div className="card-holder">
                  <span className="card-holder-label">Card holder</span>
                  <span>Sarah Chen</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="dashboard-bottom">
        </div>
      </div>
      </>
    );
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <>
          <div className="upload-grid">
            <div className="upload-sections">
              <div className="upload-card">
                <h3>NID/Passport Front Side</h3>
                <label className="upload-drop" htmlFor="front-upload">
                  <input
                    id="front-upload"
                    type="file"
                    onChange={(e) => handleFileChange('front', e.target.files[0])}
                  />
                  <p>Choose a file or drag & drop it here</p>
                  <button type="button">Browse file</button>
                  <span>{documents.front ? documents.front.name : 'No file chosen'}</span>
                </label>
              </div>
              <div className="upload-card">
                <h3>NID/Passport Back Side</h3>
                <label className="upload-drop" htmlFor="back-upload">
                  <input
                    id="back-upload"
                    type="file"
                    onChange={(e) => handleFileChange('back', e.target.files[0])}
                  />
                  <p>Choose a file or drag & drop it here</p>
                  <button type="button">Browse file</button>
                  <span>{documents.back ? documents.back.name : 'No file chosen'}</span>
                </label>
              </div>
              <div className="selfie-header">
                <span className="selfie-title">Take a selfie</span>
                <span className="selfie-subtitle">Hold your ID next to your face</span>
              </div>
              <div className="upload-card selfie-card">
                <label className="selfie-action" htmlFor="selfie-upload">
                  <input
                    id="selfie-upload"
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(e) => handleFileChange('selfie', e.target.files[0])}
                  />
                  <span className="selfie-label">Take a selfie</span>
                  <button type="button">Take Photo</button>
                  <span className="selfie-file">
                    {documents.selfie ? documents.selfie.name : 'No selfie uploaded'}
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div className="upload-actions">
            <button type="button" className="primary-btn" onClick={advanceStep}>
              <span className="btn-arrow">
                <ArrowRight size={16} />
              </span>
              <span>Submit and Next</span>
            </button>
          </div>
        </>
      );
    }

    if (currentStep === 2) {
      return (
        <>
          <form className="wallet-form" onSubmit={handleSubmitAndNext}>
            <div className="wallet-address-section">
              <h3 className="wallet-address-label">XRP Wallet Address</h3>
              <div className="wallet-input-wrapper">
                <input
                  type="text"
                  placeholder="Enter your wallet address"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="wallet-address-input"
                />
                <button type="button" className="wallet-qr-btn" aria-label="Scan QR code">
                  <QrCode size={20} />
                </button>
              </div>
            </div>

            <div className="wallet-connections">
              <div className="wallet-connection-item">
                <div className="wallet-connection-header">
                  <span className="wallet-connection-name">XUMM</span>
                </div>
                <button type="button" className="wallet-connect-btn">
                  Connect to XUMM
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="wallet-connection-item">
                <div className="wallet-connection-header">
                  <span className="wallet-connection-name">Metamask</span>
                </div>
                <button type="button" className="wallet-connect-btn">
                  Connect to Metamask
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="wallet-form-actions">
              <button type="submit" className="primary-btn">
                <span className="btn-arrow">
                  <ArrowRight size={16} />
                </span>
                <span>Submit for verification</span>
              </button>
            </div>
          </form>
        </>
      );
    }

    return (
      <>
        <form className="kyc-form" onSubmit={handleSubmitAndNext}>
          <label>
            <span>First name</span>
            <input
              type="text"
              placeholder="Enter your first name"
              value={kycForm.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
            />
          </label>
          <label>
            <span>Last name</span>
            <input
              type="text"
              placeholder="Enter your last name"
              value={kycForm.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
            />
          </label>
          <label>
            <span>Nationality</span>
            <div className="select-field">
              <select
                value={kycForm.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
              >
                <option value="">Please select</option>
                <option value="usa">United States</option>
                <option value="canada">Canada</option>
                <option value="uk">United Kingdom</option>
              </select>
            </div>
          </label>
          <label>
            <span>NID/Passport Number</span>
            <input
              type="text"
              placeholder="Enter your NID/Passport number"
              value={kycForm.passport}
              onChange={(e) => handleInputChange('passport', e.target.value)}
            />
          </label>
          <label>
            <span>Date of Birth</span>
            <input
              type="date"
              placeholder="Enter Date of Birth"
              value={kycForm.dob}
              onChange={(e) => handleInputChange('dob', e.target.value)}
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="primary-btn">
              <span className="btn-arrow">
                <ArrowRight size={16} />
              </span>
              <span className="btn-text">Submit and Next</span>
            </button>
          </div>
        </form>
      </>
    );
  };

  return (
    <div className="dashboard">
      {isSwitchingAccountType && <BusinessSuiteLoader message={switchMessage} />}
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
            <span className="trustiscore-badge">
              {dashboardData?.trustiscore?.score !== undefined 
                ? dashboardData.trustiscore.score 
                : (isLoadingDashboard ? '...' : '97')}
            </span>
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
            {isKycCompleteForAccount ? (
              <>
                <div className="account-type-buttons">
                  <button 
                    type="button" 
                    className={`account-type-btn ${accountType === 'Personal' ? 'active' : ''}`}
                    onClick={() => {
                      if (accountType === 'Business Suite') {
                        setSwitchMessage('switching to personal');
                        setIsSwitchingAccountType(true);
                        setTimeout(() => {
                          setAccountType('Personal');
                          setIsSwitchingAccountType(false);
                          setSwitchMessage('');
                        }, 2000);
                      } else {
                        setAccountType('Personal');
                      }
                    }}
                  >
                    Personal
                  </button>
                  <button 
                    type="button" 
                    className={`account-type-btn ${accountType === 'Business Suite' ? 'active' : ''}`}
                    onClick={() => {
                      if (accountType !== 'Business Suite') {
                        setSwitchMessage('switching to business suite');
                        setIsSwitchingAccountType(true);
                        setTimeout(() => {
                          setAccountType('Business Suite');
                          setIsSwitchingAccountType(false);
                          setSwitchMessage('');
                        }, 2000);
                      }
                    }}
                  >
                    Business Suite
                  </button>
                </div>
                <button 
                  type="button" 
                  className="create-wallet-btn"
                  onClick={() => {
                    if (hasWallet) {
                      setShowWalletModal(true);
                    } else {
                      handleCreateWallet();
                    }
                  }}
                >
                  {hasWallet ? 'View Wallet' : 'Create Wallet'}
                </button>
              </>
            ) : (
            <button type="button" className="kyc-status">
              <KeyRound size={16} />
              <span>KYC</span>
              <span>Unverified</span>
            </button>
            )}
            <button type="button" className="header-bell" onClick={() => setShowNotificationModal(true)}>
              <Bell size={18} />
            </button>
            <div className="header-user">
              <div className="user-avatar">{userInitials}</div>
              <div className="user-info">
                <span className="user-name">
                  {isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userFullName}
                  <img src={verifyBadge} alt="Verified" className="user-verified-icon" />
                </span>
                <small>Freelancer</small>
              </div>
            </div>
          </div>
        </header>

        {isKycCompleteForAccount ? (
          renderDashboardView()
        ) : (
          <section className="dashboard-card">
            <div className="kyc-mobile-header-only">
              <div className="kyc-mobile-indicator"></div>
              <h1 className="kyc-mobile-title-only">KYC Verification</h1>
            </div>
            <div className="card-header kyc-header-desktop">
              <div className="card-breadcrumb">
                <span className="breadcrumb-root">KYC verification Form</span>
                <span className="breadcrumb-divider">›</span>
                <span className="breadcrumb-current">{steps[currentStep].detail}</span>
              </div>
            </div>

            <div className="stepper">
              {steps.map((step, index) => (
                <div key={step.label} className={`step ${stepStatus(index)}`}>
                  <div className="step-node" aria-hidden="true" />
                  <p className="step-title">{step.detail}</p>
                  {index < steps.length - 1 && (
                    <div className={`step-connector ${stepStatus(index + 1)}`} />
                  )}
                </div>
              ))}
            </div>

            <div className={`card-content ${currentStep === 1 ? 'single-column' : ''}`}>
              <div className="card-left">
                {currentStep === 0 && <h2 className="kyc-section-title-mobile">Proof of identity</h2>}
                {renderStepContent()}
              </div>

              {currentStep !== 1 && (
                <div className="card-illustration">
                  <img src={activeIllustration} alt="Document illustration" />
                  {currentStep === 2 && (
                    <div className="card-overlay">
                      <img src={cardIllustration} alt="Card illustration" className="card-image" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
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

      {/* Create Escrow Modal (Dashboard-scoped, reusing shared form) */}
      <CreateEscrowForm
        isOpen={showCreateEscrowModal}
        onCancel={() => setShowCreateEscrowModal(false)}
        onSuccess={() => {
          // After creating an escrow, refresh high-level dashboard summary.
          fetchDashboardSummary();
        }}
      />

      {/* Fund Wallet Modal */}
      {showFundWalletModal && (
        <div className="notification-modal-overlay" onClick={() => setShowFundWalletModal(false)}>
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
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    console.log('Dropdown changed - selected wallet type:', selectedValue);
                    setFundWalletForm(prev => {
                      console.log('Previous form state:', prev);
                      const updated = { ...prev, currency: selectedValue };
                      console.log('Updated form state:', updated);
                      return updated;
                    });
                  }}
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

      {/* Wallet Modal */}
      {showWalletModal && hasWallet && walletAddress && (
        <div className="wallet-modal-overlay" onClick={() => setShowWalletModal(false)}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-header">
              <h2>Your Wallet</h2>
              <button
                type="button"
                className="wallet-modal-close-btn"
                onClick={() => setShowWalletModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="wallet-modal-body">
              <p className="wallet-modal-label">XRPL Address</p>
              <div className="wallet-modal-address-row">
                <div className="wallet-modal-address-box">
                  {walletAddress}
                </div>
                <button
                  type="button"
                  className="wallet-modal-copy-btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(walletAddress);
                      toast.success('Wallet address copied');
                    } catch (err) {
                      console.error('Failed to copy wallet address:', err);
                      toast.error('Failed to copy wallet address');
                    }
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Wallet Modal */}
      {showWithdrawWalletModal && (
        <div className="notification-modal-overlay" onClick={() => setShowWithdrawWalletModal(false)}>
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
    </div>
  );
};

export default Dashboard;

