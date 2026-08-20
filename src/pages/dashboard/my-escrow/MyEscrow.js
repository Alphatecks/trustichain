import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowRight,
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
  FileCheck,
  PiggyBank,
} from 'lucide-react';
import MyEscrowLayout from './MyEscrowLayout';
import { getApiUrl } from '../../../utils/config';
import { getProfileAvatarUrl } from '../../../utils/profileAvatar';
import { persistTrustitagFromProfileResponse } from '../../../utils/trustitag';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../../utils/notificationsApi';
import { handleLogout } from '../../../utils/logout';
import {
  DashboardMetricValuesSkeleton,
  DashboardEscrowTableSkeleton,
  EscrowHistoryCardsSkeleton,
  DashboardSkeletonBlock,
  NotificationListSkeleton,
} from '../../../components/DashboardSkeletons';
import CreateEscrowForm from '../../../components/CreateEscrowForm';
import HeaderProfileVerifyBadge from '../../../components/HeaderProfileVerifyBadge';
import PersonalSuiteMobileHeader from '../../../components/PersonalSuiteMobileHeader';
import CancelReasonModal from '../../../components/CancelReasonModal';
import EscrowDetailModalBody from '../../../components/EscrowDetailModal/EscrowDetailModalBody';
import { useSession } from '../../../context/SessionContext';
import { useDisplayCurrency } from '../../../context/DisplayCurrencyContext';
import { useTrustiscore, formatTrustiscoreBadgeText } from '../../../context/TrustiscoreContext';
import { useSidebarNavBadges } from '../../../hooks/useSidebarNavBadges';
import toast from 'react-hot-toast';
import logo from '../../../assets/images/icons/logo.png';
import NotificationListItems from '../../../components/NotificationListItems/NotificationListItems';
import { PersonalSidebarWalletNav } from '../../../components/PersonalSidebarWallet';
import '../dashboard/Dashboard.css';
import './MyEscrow.css';
import {
  getEscrowDisplayStatus,
  isEscrowCompleted,
} from '../../../utils/escrowDisplayStatus';

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: null },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: null },
  { label: 'Savings', icon: PiggyBank, badge: null },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta' },
  { label: 'P2P trading', icon: Repeat, badge: 'Beta' }
];

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { label: 'Payroll', icon: DollarSign, badge: null },
  { label: 'Supplier Contract', icon: Building2, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta' },
  { label: 'Transaction', icon: Repeat, badge: null }
];

const developersNav = [
  { label: 'Api Keys', icon: Code, badge: null },
  { label: 'Sand box enviroment', icon: Box, badge: null },
  { label: 'Web hook', icon: Link, badge: null }
];

const supportNav = [{ label: 'Settings', icon: Settings }];

const formatTimeAgo = (isoString) => {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  const time = date.getTime();
  if (!Number.isFinite(time)) return 'N/A';
  const diffMs = Date.now() - time;
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getFirstNameOnly = (name, fallback = 'Unknown') => {
  const str = typeof name === 'string' ? name.trim() : '';
  if (!str) return fallback;
  return str.split(/\s+/)[0] || fallback;
};

const MyEscrow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const { formatFromUsd } = useDisplayCurrency();
  const { score: trustiscoreScore, isLoading: isTrustiscoreLoading } = useTrustiscore();
  const trustiscoreBadgeText = formatTrustiscoreBadgeText(trustiscoreScore, isTrustiscoreLoading);
  const getNavBadge = useSidebarNavBadges();
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedMonth] = useState('This month');
  const [showCreateEscrowModal, setShowCreateEscrowModal] = useState(false);
  const [escrowDataVersion, setEscrowDataVersion] = useState(0);

  const categories = ['All', 'Freelance', 'Product purchase', 'Real estate', 'Custom'];
  
  const [totalEscrowedAmount, setTotalEscrowedAmount] = useState(null);
  const [lockedAmount, setLockedAmount] = useState(null);
  const [activeEscrowCount, setActiveEscrowCount] = useState(null);
  const [totalEscrowCount, setTotalEscrowCount] = useState(null);
  const [completedEscrowCount, setCompletedEscrowCount] = useState(null);
  const [isLoadingEscrowMetrics, setIsLoadingEscrowMetrics] = useState(true);
  const [isLoadingCompletedEscrow, setIsLoadingCompletedEscrow] = useState(true);
  const [timerUpdate, setTimerUpdate] = useState(0); // Force re-render for countdown
  
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
  const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);
  const [escrowToCancel, setEscrowToCancel] = useState(null);
  const [showEscrowDetailModal, setShowEscrowDetailModal] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState(null);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdEscrowData, setCreatedEscrowData] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(null); // XRP to USD rate
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [, setNotificationsTotal] = useState(0);
  const [, setNotificationsUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [expandedNotificationId, setExpandedNotificationId] = useState(null);
  
  // User profile state for mobile header
  const [userFullName, setUserFullName] = useState('Sarah Chen');
  const [userInitials, setUserInitials] = useState('SC');
  const [userRole, setUserRole] = useState('Freelancer');
  const [userAvatar, setUserAvatar] = useState(null);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
  const [accountType, setAccountType] = useState('Personal');

  const notificationsApiFilter = useMemo(() => (notificationFilter === 'Unread' ? 'unread' : 'all'), [notificationFilter]);

  useEffect(() => {
    if (!showNotificationModal) setExpandedNotificationId(null);
  }, [showNotificationModal]);

  useEffect(() => {
    let cancelled = false;

    const fetchNotifications = async () => {
      if (!showNotificationModal) return;
      if (isSessionExpired) {
        setNotifications([]);
        setNotificationsTotal(0);
        setNotificationsUnreadCount(0);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setNotifications([]);
        setNotificationsTotal(0);
        setNotificationsUnreadCount(0);
        return;
      }

      setIsLoadingNotifications(true);
      try {
        const data = await getNotifications({ token, filter: notificationsApiFilter, page: 1, pageSize: 10 });
        if (cancelled) return;
        setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
        setNotificationsTotal(Number(data?.total) || 0);
        setNotificationsUnreadCount(Number(data?.unreadCount) || 0);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        if (!cancelled) {
          setNotifications([]);
          setNotificationsTotal(0);
          setNotificationsUnreadCount(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingNotifications(false);
        }
      }
    };

    fetchNotifications();
    return () => {
      cancelled = true;
    };
  }, [showNotificationModal, isSessionExpired, notificationsApiFilter]);

  const handleMarkNotificationRead = async (notificationId) => {
    if (!notificationId) return;
    if (isSessionExpired) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await markNotificationRead({ token, id: notificationId });
      setNotifications((prev) => {
        if (!Array.isArray(prev)) return prev;
        if (notificationsApiFilter === 'unread') {
          return prev.filter((n) => n?.id !== notificationId);
        }
        return prev.map((n) => (n?.id === notificationId ? { ...n, isRead: true } : n));
      });
      setNotificationsUnreadCount((prev) => Math.max(0, (Number(prev) || 0) - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (isSessionExpired) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await markAllNotificationsRead({ token });
      setNotifications((prev) => {
        if (!Array.isArray(prev)) return prev;
        if (notificationsApiFilter === 'unread') return [];
        return prev.map((n) => ({ ...n, isRead: true }));
      });
      setNotificationsUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

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
              const activeEscrows = result.data.escrows.filter((escrow) => {
                if (isEscrowCompleted(escrow)) return false;
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
  }, [isSessionExpired, escrowDataVersion]);

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
        setUserAvatar(null);
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
            persistTrustitagFromProfileResponse(result);
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
            setUserAvatar(getProfileAvatarUrl(data));
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
  }, [activeCategory, selectedIndustry, currentPage, limit, isSessionExpired, escrowDataVersion]);

  // Update timers every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerUpdate(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
  const handleCancelEscrow = async (escrowId, reason = '') => {
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
        body: JSON.stringify({ reason: reason || 'Escrow cancelled by user' }),
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
          <PersonalSuiteMobileHeader
            variant="personal"
            personalVerificationComplete
            userAvatar={userAvatar}
            userInitials={userInitials}
            userFullName={userFullName}
            onOpenNotifications={() => setShowNotificationModal(true)}
            onToggleMobileMenu={() => setIsMobileMenuOpen((o) => !o)}
          />

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
                                   (item.label === 'Savings' && location.pathname === '/savings') ||
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
                      } else if (item.label === 'Savings') {
                        navigate('/savings');
                      } else if (item.label === 'Trusticard') {
                        navigate('/trusticard');
                      }
                    };
                    const navBadge = getNavBadge(item);
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className={`mobile-sidebar-nav-item ${isActive ? 'active' : ''}`}
                        onClick={handleNavClick}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                        {navBadge != null && navBadge !== '' ? (
                          <span className="mobile-sidebar-badge">{navBadge}</span>
                        ) : null}
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

              {accountType !== 'Business Suite' && (
                <PersonalSidebarWalletNav
                  variant="mobile"
                  onBeforeViewWallet={() => setIsMobileMenuOpen(false)}
                />
              )}

              <div className="mobile-sidebar-section">
                <p className="mobile-sidebar-section-label">Support</p>
                <nav className="mobile-sidebar-nav">
                  {supportNav.map((item) => {
                    const Icon = item.icon;
                    const handleSupportNavClick = () => {
                      setIsMobileMenuOpen(false);
                      if (item.label === 'Settings') {
                        navigate('/settings');
                      }
                    };
                    return (
                      <button 
                        key={item.label} 
                        type="button" 
                        className="mobile-sidebar-nav-item"
                        onClick={handleSupportNavClick}
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
                  <span className="mobile-sidebar-trustiscore-badge">{trustiscoreBadgeText}</span>
                </div>

                <button 
                  type="button" 
                  className="mobile-sidebar-logout"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
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
            {isLoadingEscrowMetrics ? (
              <DashboardMetricValuesSkeleton wideSubvalue />
            ) : (
              <>
            <div className="metric-value">
              {formatFromUsd(totalEscrowedAmount ?? 0)}
            </div>
            <div className="metric-subtitle-row">
              <div className="metric-subtitle">
                {formatFromUsd(lockedAmount ?? 0)} locked
              </div>
              <div className="metric-trend positive">
                <TrendingUp size={14} />
                <span>+3.1%</span>
              </div>
            </div>
              </>
            )}
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
            {isLoadingEscrowMetrics ? (
              <DashboardMetricValuesSkeleton />
            ) : (
              <>
            <div className="metric-value">
              {totalEscrowCount !== null && totalEscrowCount !== undefined ? totalEscrowCount : 0}
            </div>
            <div className="metric-subtitle-row">
              <div className="metric-subtitle">This month</div>
              <div className="metric-trend positive">
                <TrendingUp size={14} />
                <span>+3.1%</span>
              </div>
            </div>
              </>
            )}
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
            {isLoadingEscrowMetrics ? (
              <DashboardMetricValuesSkeleton withSubvalue={false} />
            ) : (
              <>
            <div className="metric-value">
              {activeEscrowCount !== null && activeEscrowCount !== undefined ? activeEscrowCount : 0}
            </div>
            <div className="metric-subtitle-row">
              <div className="metric-subtitle">This month</div>
            </div>
              </>
            )}
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
            {isLoadingCompletedEscrow ? (
              <DashboardMetricValuesSkeleton withSubvalue={false} />
            ) : (
              <>
            <div className="metric-value">
              {completedEscrowCount !== null && completedEscrowCount !== undefined ? completedEscrowCount : 0}
            </div>
            <div className="metric-subtitle-row">
              <div className="metric-subtitle">This month</div>
            </div>
              </>
            )}
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
                  <div style={{ padding: '8px 12px' }}><DashboardSkeletonBlock className="dashboard-skeleton-industry-option" /></div>
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
        {isLoadingEscrows ? (
          <EscrowHistoryCardsSkeleton count={4} />
        ) : escrows.length === 0 ? (
          <div className="escrow-history-card" style={{ textAlign: 'center', padding: '2rem' }}>
            No escrows found
          </div>
        ) : (
        escrows.map((escrow, index) => {
          // Use id from API response (UUID), fallback to escrowId or xrplEscrowId
          const escrowId = escrow.id || escrow.escrowId || escrow.xrplEscrowId || '';
          const formattedId = escrowId || '#ESC-N/A';
          
          // Get parties (first name only in list)
          const counterpartyName = getFirstNameOnly(
            escrow.counterparty?.firstName ||
              escrow.counterpartyName ||
              escrow.counterparty?.name,
            'Unknown'
          );
          const initiatorName = getFirstNameOnly(
            escrow.user?.firstName ||
              escrow.initiatorName ||
              escrow.userName ||
              escrow.user?.name,
            'You'
          );
          const initiatorAvatar = escrow.initiatorAvatarUrl || escrow.initiatorAvatar || escrow.user?.avatar || null;
          const counterpartyAvatar = escrow.counterpartyAvatarUrl || escrow.counterpartyAvatar || escrow.counterparty?.avatar || null;
          
          // Format amounts
          const xrpAmount = escrow.amount?.xrp 
            ? Number(escrow.amount.xrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
            : '0.00';
          const usdAmount = escrow.amount?.usd 
            ? Number(escrow.amount.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '0.00';
          
          const displayStatus = getEscrowDisplayStatus(escrow);
          
          return (
            <div
              key={escrow.id || escrow.xrplEscrowId || index}
              className="escrow-history-card"
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedEscrow(escrow);
                setShowEscrowDetailModal(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedEscrow(escrow);
                  setShowEscrowDetailModal(true);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="escrow-card-top">
                <div className="escrow-card-id">{formattedId}</div>
                <div className="escrow-card-value">
                  {xrpAmount} XRP ≈ ${usdAmount}
                </div>
              </div>
              <div className="escrow-card-bottom">
                <div className="escrow-card-parties">
                  <span className="escrow-party-with-avatar">
                    {counterpartyAvatar
                      ? <img src={counterpartyAvatar} alt="" className="escrow-party-avatar" />
                      : <span className="escrow-party-avatar escrow-party-avatar--initials">{(counterpartyName || '?').charAt(0).toUpperCase()}</span>}
                    <span className="escrow-card-party-from">{counterpartyName}</span>
                  </span>
                  <span className="escrow-card-party-arrow">→</span>
                  <span className="escrow-party-with-avatar">
                    {initiatorAvatar
                      ? <img src={initiatorAvatar} alt="" className="escrow-party-avatar" />
                      : <span className="escrow-party-avatar escrow-party-avatar--initials">{(initiatorName || '?').charAt(0).toUpperCase()}</span>}
                    <span className="escrow-card-party-to">{initiatorName}</span>
                  </span>
                </div>
                <button type="button" className={`escrow-card-status ${displayStatus.className}`}>
                  {displayStatus.label}
                </button>
              </div>
            </div>
          );
        })
        )}
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
            {isLoadingEscrows ? (
              <tr>
                <td colSpan="7">
                  <DashboardEscrowTableSkeleton rows={5} columns={7} />
                </td>
              </tr>
            ) : null}
            {!isLoadingEscrows && escrows.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  No escrows found
                </td>
              </tr>
            )}
            {!isLoadingEscrows && escrows.length > 0 && escrows.map((escrow, index) => {
              // Use id from API response (UUID), fallback to escrowId or xrplEscrowId
              const escrowId = escrow.id || escrow.escrowId || escrow.xrplEscrowId || '';
              const formattedId = escrowId || '#ESC-N/A';
              
              // Get parties (first name only in list)
              const counterpartyName = getFirstNameOnly(
                escrow.counterparty?.firstName ||
                  escrow.counterpartyName ||
                  escrow.counterparty?.name,
                'Unknown'
              );
              const initiatorName = getFirstNameOnly(
                escrow.user?.firstName ||
                  escrow.initiatorName ||
                  escrow.userName ||
                  escrow.user?.name,
                'You'
              );
              const initiatorAvatar = escrow.initiatorAvatarUrl || escrow.initiatorAvatar || escrow.user?.avatar || null;
              const counterpartyAvatar = escrow.counterpartyAvatarUrl || escrow.counterpartyAvatar || escrow.counterparty?.avatar || null;
              
              // Format amounts
              const xrpAmount = escrow.amount?.xrp 
                ? Number(escrow.amount.xrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
                : '0.00';
              const usdAmount = escrow.amount?.usd 
                ? Number(escrow.amount.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '0.00';
              
              const displayStatus = getEscrowDisplayStatus(escrow);
              const statusLower = (escrow.status || 'Unknown').toLowerCase();
              const isCompletedStatus = displayStatus.isCompleted;
              
              // Completed escrows should always show full completion progress.
              const rawProgress = Number(escrow.progress ?? escrow.milestoneProgress ?? 0);
              const progress = isCompletedStatus
                ? 100
                : Math.min(100, Math.max(0, Number.isFinite(rawProgress) ? rawProgress : 0));
              
              // Format created date
              const createdDate = escrow.createdAt || escrow.created || '';
              const formattedDate = createdDate 
                ? new Date(createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : 'N/A';
              
              // Calculate time since escrow creation for 40-second delay
              const createdTimestamp = createdDate ? new Date(createdDate).getTime() : null;
              const currentTime = Date.now();
              const timeSinceCreation = createdTimestamp ? (currentTime - createdTimestamp) / 1000 : null; // in seconds
              const RELEASE_DELAY_SECONDS = 40;
              const timeRemaining = timeSinceCreation !== null ? Math.max(0, RELEASE_DELAY_SECONDS - timeSinceCreation) : 0;
              const canReleaseNow = timeRemaining === 0;
              
              // Determine action button text and availability
              const hasXrplEscrowId = !!(escrow.xrplEscrowId || escrow.xrpl_escrow_id);
              const canRelease =
                hasXrplEscrowId &&
                (statusLower === 'active' || statusLower === 'pending release') &&
                canReleaseNow;
              const actionText = canRelease
                ? 'Release'
                : isCompletedStatus
                ? 'Completed'
                : hasXrplEscrowId && (statusLower === 'active' || statusLower === 'pending release') && timeRemaining > 0
                ? `Release (${Math.ceil(timeRemaining)}s)`
                : 'View';
              
              return (
                <tr
                  key={escrow.id || escrow.xrplEscrowId || index}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedEscrow(escrow);
                    setShowEscrowDetailModal(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedEscrow(escrow);
                      setShowEscrowDetailModal(true);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="escrow-id">{formattedId}</td>
                  <td className="escrow-parties" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <span className="escrow-party-with-avatar">
                      {counterpartyAvatar
                        ? <img src={counterpartyAvatar} alt="" className="escrow-party-avatar" />
                        : <span className="escrow-party-avatar escrow-party-avatar--initials">{(counterpartyName || '?').charAt(0).toUpperCase()}</span>}
                      <span className="party-from" style={{ color: 'var(--blue-600)', fontWeight: 500 }}>{counterpartyName}</span>
                    </span>
                    <span className="party-arrow" style={{ color: 'var(--text-muted)' }}>›</span>
                    <span className="escrow-party-with-avatar">
                      {initiatorAvatar
                        ? <img src={initiatorAvatar} alt="" className="escrow-party-avatar" />
                        : <span className="escrow-party-avatar escrow-party-avatar--initials">{(initiatorName || '?').charAt(0).toUpperCase()}</span>}
                      <span className="party-to" style={{ color: 'var(--blue-600)', fontWeight: 500 }}>{initiatorName}</span>
                    </span>
                  </td>
                  <td className="escrow-amount">
                    <span className="amount-single-line">
                      <span className="amount-crypto">{xrpAmount} XRP</span>
                      <span className="amount-separator"> </span>
                      <span className="amount-usd">≈ ${usdAmount}</span>
                    </span>
                  </td>
                  <td>
                    <button type="button" className={`status-btn ${displayStatus.className}`}>
                      {displayStatus.label}
                    </button>
                  </td>
                  <td className="escrow-progress">
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="progress-text">{progress}%</span>
                  </td>
                  <td className="escrow-created">{formattedDate}</td>
                  <td className="escrow-action" style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                    {hasXrplEscrowId && (statusLower === 'active' || statusLower === 'pending release') && (
                      <>
                        <button 
                          type="button" 
                          className="release-btn"
                          onClick={() => canReleaseNow && handleReleaseEscrow(escrowId)}
                          disabled={!canReleaseNow}
                          style={{
                            opacity: canReleaseNow ? 1 : 0.6,
                            cursor: canReleaseNow ? 'pointer' : 'not-allowed'
                          }}
                        >
                          {actionText}
                        </button>
                        <button 
                          type="button" 
                          className="cancel-btn"
                          onClick={() => {
                            setEscrowToCancel(escrowId);
                            setShowCancelReasonModal(true);
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {!isCompletedStatus && (
                      <>
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
                                setOpenActionMenu(null);
                                setEscrowToCancel(escrowId);
                                setShowCancelReasonModal(true);
                              }}
                            >
                              Cancel
                            </div>
                          </div>
                        )}
                      </>
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
                  if (escrowId && createdEscrowData) {
                    setSelectedEscrow({
                      id: escrowId,
                      escrowId,
                      xrpHash: createdEscrowData?.xrpHash,
                      xrpHashes: createdEscrowData?.xrpHashes,
                      xrplEscrowId: createdEscrowData?.xrplEscrowId,
                      counterpartyName: createdEscrowData?.counterpartyName || createdEscrowData?.counterparty?.name || 'Unknown',
                      initiatorName: createdEscrowData?.initiatorName || createdEscrowData?.userName || createdEscrowData?.user?.name || 'You',
                      counterpartyAvatarUrl: createdEscrowData?.counterpartyAvatarUrl || createdEscrowData?.counterpartyAvatar || createdEscrowData?.counterparty?.avatar || null,
                      initiatorAvatarUrl: createdEscrowData?.initiatorAvatarUrl || createdEscrowData?.initiatorAvatar || createdEscrowData?.user?.avatar || null,
                      amount: createdEscrowData?.amount || { xrp: 0, usd: 0 },
                      status: createdEscrowData?.status || 'active',
                      progress: createdEscrowData?.progress ?? 0,
                      createdAt: createdEscrowData?.createdAt || createdEscrowData?.created
                    });
                    setShowEscrowDetailModal(true);
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
                  {isLoadingEscrowMetrics ? (
                    <DashboardMetricValuesSkeleton wideSubvalue />
                  ) : (
                    <>
                  <div className="metric-value">
                    {formatFromUsd(totalEscrowedAmount ?? 0)}
                  </div>
                  <div className="metric-subtitle">
                    {formatFromUsd(lockedAmount ?? 0)} locked
                  </div>
                    </>
                  )}
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
                  {isLoadingEscrowMetrics ? (
                    <DashboardMetricValuesSkeleton />
                  ) : (
                    <>
                  <div className="metric-value">
                    {totalEscrowCount !== null && totalEscrowCount !== undefined ? totalEscrowCount : 0}
                  </div>
                  <div className="metric-subtitle">This month</div>
                    </>
                  )}
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
                  {isLoadingEscrowMetrics ? (
                    <DashboardMetricValuesSkeleton withSubvalue={false} />
                  ) : (
                    <>
                  <div className="metric-value">
                    {activeEscrowCount !== null && activeEscrowCount !== undefined ? activeEscrowCount : 0}
                  </div>
                  <div className="metric-subtitle">This month</div>
                    </>
                  )}
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
                  {isLoadingCompletedEscrow ? (
                    <DashboardMetricValuesSkeleton withSubvalue={false} />
                  ) : (
                    <>
                  <div className="metric-value">
                    {completedEscrowCount !== null && completedEscrowCount !== undefined ? completedEscrowCount : 0}
                  </div>
                  <div className="metric-subtitle">This month</div>
                    </>
                  )}
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
                        <div style={{ padding: '8px 12px' }}><DashboardSkeletonBlock className="dashboard-skeleton-industry-option" /></div>
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
                  {isLoadingEscrows ? (
                    <tr>
                      <td colSpan="7">
                        <DashboardEscrowTableSkeleton rows={5} columns={7} />
                      </td>
                    </tr>
                  ) : null}
                  {!isLoadingEscrows && escrows.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                        No escrows found
                      </td>
                    </tr>
                  )}
                  {!isLoadingEscrows && escrows.length > 0 && escrows.map((escrow, index) => {
                    // Use id from API response (UUID), fallback to escrowId or xrplEscrowId
                    const escrowId = escrow.id || escrow.escrowId || escrow.xrplEscrowId || '';
                    const formattedId = escrowId || '#ESC-N/A';
                    
                    // Get parties (first name only in list)
                    const counterpartyName = getFirstNameOnly(
                      escrow.counterparty?.firstName ||
                        escrow.counterpartyName ||
                        escrow.counterparty?.name,
                      'Unknown'
                    );
                    const initiatorName = getFirstNameOnly(
                      escrow.user?.firstName ||
                        escrow.initiatorName ||
                        escrow.userName ||
                        escrow.user?.name,
                      'You'
                    );
                    const initiatorAvatar = escrow.initiatorAvatarUrl || escrow.initiatorAvatar || escrow.user?.avatar || null;
                    const counterpartyAvatar = escrow.counterpartyAvatarUrl || escrow.counterpartyAvatar || escrow.counterparty?.avatar || null;
                    
                    // Format amounts
                    const xrpAmount = escrow.amount?.xrp 
                      ? Number(escrow.amount.xrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
                      : '0.00';
                    const usdAmount = escrow.amount?.usd 
                      ? Number(escrow.amount.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : '0.00';
                    
                    const displayStatus = getEscrowDisplayStatus(escrow);
                    const statusLower = (escrow.status || 'Unknown').toLowerCase();
                    const isCompletedStatus = displayStatus.isCompleted;
                    
                    // Completed escrows should always show full completion progress.
                    const rawProgress = Number(escrow.progress ?? escrow.milestoneProgress ?? 0);
                    const progress = isCompletedStatus
                      ? 100
                      : Math.min(100, Math.max(0, Number.isFinite(rawProgress) ? rawProgress : 0));
                    
                    // Format created date
                    const createdDate = escrow.createdAt || escrow.created || '';
                    const formattedDate = createdDate 
                      ? new Date(createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : 'N/A';
                    
                    // Calculate time since escrow creation for 40-second delay
                    const createdTimestamp = createdDate ? new Date(createdDate).getTime() : null;
                    const currentTime = Date.now();
                    const timeSinceCreation = createdTimestamp ? (currentTime - createdTimestamp) / 1000 : null; // in seconds
                    const RELEASE_DELAY_SECONDS = 40;
                    const timeRemaining = timeSinceCreation !== null ? Math.max(0, RELEASE_DELAY_SECONDS - timeSinceCreation) : 0;
                    const canReleaseNow = timeRemaining === 0;
                    
                    // Determine action button text and availability
                    const hasXrplEscrowId = !!(escrow.xrplEscrowId || escrow.xrpl_escrow_id);
                    const canRelease = hasXrplEscrowId &&
                      (statusLower === 'active' || statusLower === 'pending release') &&
                      canReleaseNow;
                    const actionText = canRelease 
                      ? 'Release' 
                      : isCompletedStatus
                      ? 'Completed' 
                      : hasXrplEscrowId && (statusLower === 'active' || statusLower === 'pending release') && timeRemaining > 0
                      ? `Release (${Math.ceil(timeRemaining)}s)`
                      : 'View';
                    
                    return (
                      <tr
                        key={escrow.id || escrow.xrplEscrowId || index}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedEscrow(escrow);
                          setShowEscrowDetailModal(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedEscrow(escrow);
                            setShowEscrowDetailModal(true);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="escrow-id">{formattedId}</td>
                        <td className="escrow-parties" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                          <span className="escrow-party-with-avatar">
                            {counterpartyAvatar
                              ? <img src={counterpartyAvatar} alt="" className="escrow-party-avatar" />
                              : <span className="escrow-party-avatar escrow-party-avatar--initials">{(counterpartyName || '?').charAt(0).toUpperCase()}</span>}
                            <span className="party-from" style={{ color: 'var(--blue-600)', fontWeight: 500 }}>{counterpartyName}</span>
                          </span>
                          <span className="party-arrow" style={{ color: 'var(--text-muted)' }}>›</span>
                          <span className="escrow-party-with-avatar">
                            {initiatorAvatar
                              ? <img src={initiatorAvatar} alt="" className="escrow-party-avatar" />
                              : <span className="escrow-party-avatar escrow-party-avatar--initials">{(initiatorName || '?').charAt(0).toUpperCase()}</span>}
                            <span className="party-to" style={{ color: 'var(--blue-600)', fontWeight: 500 }}>{initiatorName}</span>
                          </span>
                        </td>
                        <td className="escrow-amount">
                          <span className="amount-single-line">
                            <span className="amount-crypto">{xrpAmount} XRP</span>
                            <span className="amount-separator"> </span>
                            <span className="amount-usd">≈ ${usdAmount}</span>
                          </span>
                        </td>
                        <td>
                          <button type="button" className={`status-btn ${displayStatus.className}`}>
                            {displayStatus.label}
                          </button>
                        </td>
                        <td className="escrow-progress">
                          <div className="progress-bar-wrapper">
                            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                          </div>
                          <span className="progress-text">{progress}%</span>
                        </td>
                        <td className="escrow-created">{formattedDate}</td>
                        <td className="escrow-action" style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                          {hasXrplEscrowId && (statusLower === 'active' || statusLower === 'pending release') && (
                            <>
                              <button 
                                type="button" 
                                className="release-btn"
                                onClick={() => canReleaseNow && handleReleaseEscrow(escrowId)}
                                disabled={!canReleaseNow}
                                style={{
                                  opacity: canReleaseNow ? 1 : 0.6,
                                  cursor: canReleaseNow ? 'pointer' : 'not-allowed'
                                }}
                              >
                                {actionText}
                              </button>
                              <button 
                                type="button" 
                                className="cancel-btn"
                                onClick={() => {
                                  setEscrowToCancel(escrowId);
                                  setShowCancelReasonModal(true);
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {!isCompletedStatus && (
                            <>
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
                                      setOpenActionMenu(null);
                                      setEscrowToCancel(escrowId);
                                      setShowCancelReasonModal(true);
                                    }}
                                  >
                                    Cancel
                                  </div>
                                </div>
                              )}
                            </>
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
      <CreateEscrowForm
        isOpen={showCreateEscrowModal}
        onCancel={() => setShowCreateEscrowModal(false)}
        onSuccess={(createdEscrow) => {
          const amt = createdEscrow?.amount;
          setCreatedEscrowData({
            ...createdEscrow,
            amount: amt ?? '',
            amountUsd:
              createdEscrow?.amountUsd ??
              (exchangeRate && amt != null && String(amt).trim() !== ''
                ? (parseFloat(String(amt)) * exchangeRate).toFixed(2)
                : undefined),
          });
          setShowSuccessModal(true);
          setEscrowDataVersion((v) => v + 1);
        }}
      />

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
                  if (escrowId && createdEscrowData) {
                    setSelectedEscrow({
                      id: escrowId,
                      escrowId,
                      xrpHash: createdEscrowData?.xrpHash,
                      xrpHashes: createdEscrowData?.xrpHashes,
                      xrplEscrowId: createdEscrowData?.xrplEscrowId,
                      counterpartyName: createdEscrowData?.counterpartyName || createdEscrowData?.counterparty?.name || 'Unknown',
                      initiatorName: createdEscrowData?.initiatorName || createdEscrowData?.userName || createdEscrowData?.user?.name || 'You',
                      counterpartyAvatarUrl: createdEscrowData?.counterpartyAvatarUrl || createdEscrowData?.counterpartyAvatar || createdEscrowData?.counterparty?.avatar || null,
                      initiatorAvatarUrl: createdEscrowData?.initiatorAvatarUrl || createdEscrowData?.initiatorAvatar || createdEscrowData?.user?.avatar || null,
                      amount: createdEscrowData?.amount || { xrp: 0, usd: 0 },
                      status: createdEscrowData?.status || 'active',
                      progress: createdEscrowData?.progress ?? 0,
                      createdAt: createdEscrowData?.createdAt || createdEscrowData?.created
                    });
                    setShowEscrowDetailModal(true);
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
              <button
                type="button"
                className="notification-filter-icon"
                onClick={handleMarkAllNotificationsRead}
                disabled={isLoadingNotifications}
              >
                <Filter size={18} />
              </button>
            </div>

            <div className="notification-list">
              {isLoadingNotifications ? (
                <NotificationListSkeleton count={6} />
              ) : (
                <NotificationListItems
                  notifications={notifications}
                  expandedNotificationId={expandedNotificationId}
                  onToggleExpand={(nid) => setExpandedNotificationId((p) => (p === nid ? null : nid))}
                  onMarkRead={handleMarkNotificationRead}
                  formatTimeAgo={formatTimeAgo}
                  onBeforeCtaNavigate={() => setShowNotificationModal(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Reason Modal */}
      <CancelReasonModal
        isOpen={showCancelReasonModal}
        onClose={() => {
          setShowCancelReasonModal(false);
          setEscrowToCancel(null);
        }}
        onConfirm={async (reason) => {
          if (escrowToCancel) {
            await handleCancelEscrow(escrowToCancel, reason);
            setShowCancelReasonModal(false);
            setEscrowToCancel(null);
            setShowEscrowDetailModal(false);
            setSelectedEscrow(null);
          }
        }}
      />

      {/* Escrow Detail Modal */}
      {showEscrowDetailModal && selectedEscrow && (
        <div
          className="create-escrow-modal-overlay escrow-detail-modal-overlay"
          onClick={() => {
            setShowEscrowDetailModal(false);
            setSelectedEscrow(null);
          }}
        >
          <div
            className="create-escrow-modal escrow-detail-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="escrow-detail-modal-title"
          >
            <div className="create-escrow-modal-header escrow-detail-modal-header">
              <div className="modal-header-leading">
                <span className="modal-header-accent-bar" aria-hidden />
                <h2 id="escrow-detail-modal-title" className="escrow-detail-modal-title">
                  Escrow Details
                </h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setShowEscrowDetailModal(false);
                  setSelectedEscrow(null);
                }}
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
            <div className="create-escrow-modal-content escrow-detail-modal-content">
              <EscrowDetailModalBody
                escrow={selectedEscrow}
                exchangeRate={exchangeRate}
                onDispute={() => {
                  navigate('/dispute');
                              setShowEscrowDetailModal(false);
                              setSelectedEscrow(null);
                }}
                onReleaseEscrow={(id) => {
                  handleReleaseEscrow(id);
                            setShowEscrowDetailModal(false);
                  setSelectedEscrow(null);
                }}
                onRequestCancelEscrow={(id) => {
                  setShowEscrowDetailModal(false);
                  setEscrowToCancel(id);
                            setShowCancelReasonModal(true);
                            setSelectedEscrow(null);
                          }}
              />
            </div>
          </div>
        </div>
      )}
    </MyEscrowLayout>
  );
};

export default MyEscrow;

