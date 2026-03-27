import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  LogOut,
  ArrowRight,
  Plus,
  RefreshCw,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Filter,
  X,
  CreditCard as CreditCardIcon,
  Wallet,
  Eye,
  EyeOff,
  KeyRound,
  Info,
  Menu,
  DollarSign,
  Users,
  Building2,
  FileCheck,
  Code,
  Box,
  Link,
  PiggyBank,
  CheckCircle,
  Package,
  AlertTriangle
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './TrustiCard.css';
import logo from '../../../assets/images/icons/logo.png';
import verifyBadge from '../../../assets/images/icons/verify.png';
import { useSession } from '../../../context/SessionContext';
import { useTrustiscore, formatTrustiscoreBadgeText } from '../../../context/TrustiscoreContext';
import { useSidebarNavBadges } from '../../../hooks/useSidebarNavBadges';
import LoadingIndicator from '../../../components/LoadingIndicator';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../../utils/config';
import { getProfileAvatarUrl } from '../../../utils/profileAvatar';
import { persistTrustitagFromProfileResponse } from '../../../utils/trustitag';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../../utils/notificationsApi';
import { handleLogout } from '../../../utils/logout';

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: null },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: null },
  { label: 'Savings', icon: PiggyBank, badge: null },
  { label: 'Trusticard', icon: Briefcase, badge: 'Beta' },
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

const getNotificationIconConfig = (type) => {
  if (type === 'wallet_deposit') {
    return { Icon: CheckCircle, className: 'notification-status-icon success' };
  }
  if (type === 'escrow_completed') {
    return { Icon: Package, className: 'notification-status-icon package' };
  }
  return { Icon: AlertTriangle, className: 'notification-status-icon warning' };
};

const TrustiCard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const { score: trustiscoreScore, isLoading: isTrustiscoreLoading } = useTrustiscore();
  const trustiscoreBadgeText = formatTrustiscoreBadgeText(trustiscoreScore, isTrustiscoreLoading);
  const getNavBadge = useSidebarNavBadges();
  const [accountType, setAccountType] = useState('Personal');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [isSubmittingCreateCustomer, setIsSubmittingCreateCustomer] = useState(false);
  const [showIssueCardModal, setShowIssueCardModal] = useState(false);
  const [isSubmittingIssueCard, setIsSubmittingIssueCard] = useState(false);
  const [issueCardForm, setIssueCardForm] = useState({
    customer_ulid: '',
    card_name: '',
    card_currency: 'USD',
    card_type: 'platinum',
    card_provider: 'visa',
    reference_id: '',
    meta_user_id: '',
  });
  const [createCustomerForm, setCreateCustomerForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    date_of_birth: '',
    id_type: 'passport',
    id_number: '',
    id_front_image: null,
    user_image: null,
    id_back_image: null,
    house_number: '',
    address_line_1: '',
    city: '',
    zip_code: '',
    country: '',
    state: '',
    reference_id: '',
    meta_user_id: ''
  });
  const [fundAmount, setFundAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('XRP wallet');
  const [selectedWithdrawWallet, setSelectedWithdrawWallet] = useState('USD wallet');
  const [addressForm, setAddressForm] = useState({
    streetAddress: '',
    city: '',
    state: '',
    country: '',
    postalCode: ''
  });
  const [kycComplete] = useState(true);
  const [userFullName, setUserFullName] = useState('Sarah Chen');
  const [userInitials, setUserInitials] = useState('SC');
  const [userAvatar, setUserAvatar] = useState(null);
  const [userRole, setUserRole] = useState('User');
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [freezeCard, setFreezeCard] = useState(false);
  const [cashflowPeriod, setCashflowPeriod] = useState('Monthly');
  const [transactionFilter, setTransactionFilter] = useState('Filter');
  const [transactionPeriod, setTransactionPeriod] = useState('Monthly');
  const [currentPage, setCurrentPage] = useState(12);
  const [message, setMessage] = useState('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardsList, setCardsList] = useState([]);
  const [cardsPage, setCardsPage] = useState(1);
  const [cardsTotal, setCardsTotal] = useState(0);
  const [cardsLastPage, setCardsLastPage] = useState(1);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [cardTransactions, setCardTransactions] = useState([]);
  const [isLoadingCardTransactions, setIsLoadingCardTransactions] = useState(true);
  const [selectedCardDetails, setSelectedCardDetails] = useState(null);
  const [isLoadingCardDetails, setIsLoadingCardDetails] = useState(false);
  const [showSensitiveCardInfo, setShowSensitiveCardInfo] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('All');
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [showMobileAddressPage, setShowMobileAddressPage] = useState(false);
  const [showMobileWithdrawPage, setShowMobileWithdrawPage] = useState(false);
  const [showMobileFundPage, setShowMobileFundPage] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isFreezing, setIsFreezing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [notifications, setNotifications] = useState([]);
  const [, setNotificationsTotal] = useState(0);
  const [, setNotificationsUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const notificationsApiFilter = useMemo(() => (notificationFilter === 'Unread' ? 'unread' : 'all'), [notificationFilter]);

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formattedToday, setFormattedToday] = useState('');

  // Real-time date formatting - updates every minute
  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
      const day = now.getDate();
      const month = now.toLocaleDateString(undefined, { month: 'long' });
      const formatted = `${weekday}, ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} ${month}`;
      setFormattedToday(formatted);
    };

    // Update immediately
    updateDate();

    // Update every minute to keep it real-time
    const interval = setInterval(updateDate, 60000);

    return () => clearInterval(interval);
  }, []);

  // Map API card transactions to UI shape
  const transactions = useMemo(() => {
    return cardTransactions.map((tx) => {
      const amount = Number(tx.enter_amount) || 0;
      const currency = tx.card_currency || 'USD';
      const isCredit = (tx.amount_type || '').toUpperCase() === 'CREDIT';
      const sign = isCredit ? '+' : '-';
      const absAmount = Math.abs(amount);
      const amountStr = `${sign}${absAmount.toFixed(2)} ${currency}`;
      const dateStr = tx.created_at
        ? new Date(tx.created_at).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })
        : '—';
      const typeLabel = (tx.trx_type || '').replace(/-/g, ' ');
      const displayType = isCredit ? 'Received' : 'Sent';
      return {
        id: tx.trx_id || tx.ulid || '—',
        type: displayType,
        typeLabel,
        amount: amountStr,
        usd: currency === 'USD' ? `$${absAmount.toFixed(2)} USD` : `${absAmount.toFixed(2)} ${currency}`,
        status: (tx.status || '—') === 'SUCCESS' ? 'Successful' : (tx.status || '—'),
        date: dateStr,
        checked: false,
      };
    });
  }, [cardTransactions]);

  // Mock cashflow data
  const cashflowData = [
    { month: 'Jan', received: 75, spent: 55 },
    { month: 'Feb', received: 48, spent: 38 },
    { month: 'Mar', received: 61, spent: 21 },
    { month: 'Apr', received: 34, spent: 22 },
    { month: 'May', received: 83, spent: 55 },
    { month: 'Jun', received: 74, spent: 49 },
  ];

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isSessionExpired) {
        setUserFullName('Sarah Chen');
        setUserInitials('SC');
        setUserRole('User');
        setUserAvatar(null);
        setIsLoadingUserProfile(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setUserAvatar(null);
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
            const role = data.role || data.userRole || 'User';
            setUserRole(role);
            
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

  const fetchCards = async (page = 1) => {
    const token = localStorage.getItem('token');
    if (!token || isSessionExpired) {
      setCardsList([]);
      setIsLoadingCards(false);
      return;
    }
    setIsLoadingCards(true);
    try {
      const response = await fetch(getApiUrl(`api/cardyfie/cards?page=${page}`), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (response.ok && result?.success && result?.cards) {
        const { data = [], current_page, last_page, total } = result.cards;
        setCardsList(Array.isArray(data) ? data : []);
        setCardsPage(current_page ?? page);
        setCardsLastPage(last_page ?? 1);
        setCardsTotal(total ?? 0);
      } else {
        setCardsList([]);
      }
    } catch (err) {
      console.error('Fetch cards error:', err);
      setCardsList([]);
    } finally {
      setIsLoadingCards(false);
    }
  };

  useEffect(() => {
    fetchCards(1);
  }, [isSessionExpired]);

  useEffect(() => {
    if (cardsList.length > 0 && currentCardIndex >= cardsList.length) {
      setCurrentCardIndex(Math.max(0, cardsList.length - 1));
    }
  }, [cardsList.length, currentCardIndex]);

  const fetchCardTransactions = async (cardUlid = '', trxId = '') => {
    const token = localStorage.getItem('token');
    if (!token || isSessionExpired) {
      setCardTransactions([]);
      setIsLoadingCardTransactions(false);
      return;
    }
    setIsLoadingCardTransactions(true);
    try {
      const params = new URLSearchParams();
      if (cardUlid) params.set('card_ulid', cardUlid);
      if (trxId) params.set('trx_id', trxId);
      const qs = params.toString();
      const url = getApiUrl(`api/cardyfie/card/transactions${qs ? `?${qs}` : ''}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (response.ok && result?.success && Array.isArray(result?.transactions)) {
        setCardTransactions(result.transactions);
      } else {
        setCardTransactions([]);
      }
    } catch (err) {
      console.error('Fetch card transactions error:', err);
      setCardTransactions([]);
    } finally {
      setIsLoadingCardTransactions(false);
    }
  };

  useEffect(() => {
    fetchCardTransactions();
  }, [isSessionExpired]);

  const fetchCardDetails = async (cardUlid) => {
    if (!cardUlid) {
      setSelectedCardDetails(null);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token || isSessionExpired) {
      setSelectedCardDetails(null);
      return;
    }
    setIsLoadingCardDetails(true);
    try {
      const response = await fetch(getApiUrl(`api/cardyfie/card/${encodeURIComponent(cardUlid)}`), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (response.ok && result?.success && result?.card) {
        setSelectedCardDetails(result.card);
      } else {
        setSelectedCardDetails(null);
      }
    } catch (err) {
      console.error('Fetch card details error:', err);
      setSelectedCardDetails(null);
    } finally {
      setIsLoadingCardDetails(false);
    }
  };

  const detailCardUlid = isMobile && showCardDetails
    ? cardsList[currentCardIndex]?.ulid
    : cardsList[0]?.ulid;

  useEffect(() => {
    if (detailCardUlid) {
      fetchCardDetails(detailCardUlid);
    } else {
      setSelectedCardDetails(null);
    }
  }, [detailCardUlid]);

  const depositToCard = async (amountInput) => {
    const card = cardsList[currentCardIndex];
    const cardUlid = card?.ulid;
    if (!cardUlid) {
      toast.error('No card selected');
      return;
    }
    const amount = parseFloat(String(amountInput ?? '').replace(/,/g, ''), 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to continue');
      return;
    }
    setIsDepositing(true);
    try {
      const response = await fetch(getApiUrl(`api/cardyfie/card/${encodeURIComponent(cardUlid)}/deposit`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });
      const result = await response.json();
      if (response.ok && result?.success) {
        if (result?.card) {
          setSelectedCardDetails((prev) => (prev?.ulid === result.card?.ulid ? result.card : prev));
          setCardsList((prev) =>
            prev.map((c) => (c?.ulid === result.card?.ulid ? { ...c, ...result.card, card_balance: result.card?.card_balance } : c))
          );
        }
        toast.success(result?.trx_id ? `Deposit successful. Ref: ${result.trx_id}` : 'Deposit successful');
        setShowFundModal(false);
        setShowMobileFundPage(false);
        setFundAmount('');
      } else {
        toast.error(result?.message || 'Deposit failed');
      }
    } catch (err) {
      console.error('Deposit error:', err);
      toast.error('Deposit failed');
    } finally {
      setIsDepositing(false);
    }
  };

  const withdrawFromCard = async (amountInput) => {
    const card = cardsList[currentCardIndex];
    const cardUlid = card?.ulid;
    if (!cardUlid) {
      toast.error('No card selected');
      return;
    }
    const amount = parseFloat(String(amountInput ?? '').replace(/\$/g, '').replace(/,/g, ''), 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to continue');
      return;
    }
    setIsWithdrawing(true);
    try {
      const response = await fetch(getApiUrl(`api/cardyfie/card/${encodeURIComponent(cardUlid)}/withdraw`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });
      const result = await response.json();
      if (response.ok && result?.success) {
        toast.success('Withdrawal successful');
        setShowWithdrawModal(false);
        setShowMobileWithdrawPage(false);
        setWithdrawAmount('');
        if (detailCardUlid) fetchCardDetails(detailCardUlid);
        setCardsList((prev) => prev.map((c) => (c?.ulid === cardUlid ? { ...c, card_balance: undefined } : c)));
        fetchCards(cardsPage);
      } else {
        toast.error(result?.message || 'Withdrawal failed');
      }
    } catch (err) {
      console.error('Withdraw error:', err);
      toast.error('Withdrawal failed');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleFreezeToggle = async () => {
    const card = cardsList[currentCardIndex];
    const cardUlid = card?.ulid;
    if (!cardUlid) {
      toast.error('No card selected');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to continue');
      return;
    }
    const willFreeze = !freezeCard;
    setIsFreezing(true);
    try {
      const endpoint = willFreeze ? 'freeze' : 'unfreeze';
      const response = await fetch(getApiUrl(`api/cardyfie/card/${encodeURIComponent(cardUlid)}/${endpoint}`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (response.ok && result?.success) {
        setFreezeCard(willFreeze);
        if (detailCardUlid) fetchCardDetails(detailCardUlid);
        toast.success(willFreeze ? 'Card frozen' : 'Card unfrozen');
      } else {
        toast.error(result?.message || (willFreeze ? 'Failed to freeze card' : 'Failed to unfreeze card'));
      }
    } catch (err) {
      console.error('Freeze/unfreeze error:', err);
      toast.error(willFreeze ? 'Failed to freeze card' : 'Failed to unfreeze card');
    } finally {
      setIsFreezing(false);
    }
  };

  const handleIssueCardSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to issue a card');
      return;
    }
    const { customer_ulid, card_name, card_currency, card_type, card_provider, reference_id, meta_user_id } = issueCardForm;
    if (!customer_ulid?.trim() || !card_name?.trim()) {
      toast.error('Customer ULID and card name are required');
      return;
    }
    setIsSubmittingIssueCard(true);
    try {
      const body = {
        customer_ulid: customer_ulid.trim(),
        card_name: card_name.trim(),
        card_currency: (card_currency || 'USD').trim(),
        card_type: (card_type || 'platinum').trim(),
        card_provider: (card_provider || 'visa').trim(),
      };
      if (reference_id?.trim()) body.reference_id = reference_id.trim();
      if (meta_user_id?.trim()) body.meta = { user_id: meta_user_id.trim() };

      const response = await fetch(getApiUrl('api/cardyfie/card/issue'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (response.ok && result?.success) {
        toast.success(result?.message || 'Card issued successfully');
        setShowIssueCardModal(false);
        setIssueCardForm({
          customer_ulid: '',
          card_name: '',
          card_currency: 'USD',
          card_type: 'platinum',
          card_provider: 'visa',
          reference_id: '',
          meta_user_id: '',
        });
        fetchCards(cardsPage);
      } else {
        toast.error(result?.message || result?.error || 'Failed to issue card');
      }
    } catch (err) {
      console.error('Issue card error:', err);
      toast.error('Failed to issue card');
    } finally {
      setIsSubmittingIssueCard(false);
    }
  };

  const handleCreateCustomerSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to create a customer');
      return;
    }
    const { first_name, last_name, email, date_of_birth, id_type, id_number, id_front_image, user_image, id_back_image, house_number, address_line_1, city, zip_code, country, state, reference_id, meta_user_id } = createCustomerForm;
    if (!first_name?.trim() || !last_name?.trim() || !email?.trim()) {
      toast.error('First name, last name and email are required');
      return;
    }
    setIsSubmittingCreateCustomer(true);
    try {
      const formData = new FormData();
      formData.append('first_name', (first_name || '').trim());
      formData.append('last_name', (last_name || '').trim());
      formData.append('email', (email || '').trim());
      if (date_of_birth?.trim()) formData.append('date_of_birth', date_of_birth.trim());
      formData.append('id_type', (id_type || 'passport').trim());
      if (id_number?.trim()) formData.append('id_number', id_number.trim());
      if (house_number?.trim()) formData.append('house_number', house_number.trim());
      if (address_line_1?.trim()) formData.append('address_line_1', address_line_1.trim());
      if (city?.trim()) formData.append('city', city.trim());
      if (zip_code?.trim()) formData.append('zip_code', zip_code.trim());
      if (country?.trim()) formData.append('country', country.trim());
      if (state?.trim()) formData.append('state', state.trim());
      if (reference_id?.trim()) formData.append('reference_id', reference_id.trim());
      if (meta_user_id?.trim()) formData.append('meta[user_id]', meta_user_id.trim());
      if (id_front_image instanceof File) formData.append('id_front_image', id_front_image);
      if (user_image instanceof File) formData.append('user_image', user_image);
      if (id_back_image instanceof File) formData.append('id_back_image', id_back_image);

      const response = await fetch(getApiUrl('api/cardyfie/customer'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const result = await response.json();
      if (response.ok && result?.success) {
        toast.success(result?.message || 'Customer created successfully');
        setShowCreateCustomerModal(false);
        fetchCards(1);
        fetchCardTransactions();
        setCreateCustomerForm({
          first_name: '',
          last_name: '',
          email: '',
          date_of_birth: '',
          id_type: 'passport',
          id_number: '',
          id_front_image: null,
          user_image: null,
          id_back_image: null,
          house_number: '',
          address_line_1: '',
          city: '',
          zip_code: '',
          country: '',
          state: '',
          reference_id: '',
          meta_user_id: ''
        });
      } else {
        toast.error(result?.message || result?.error || 'Failed to create customer');
      }
    } catch (err) {
      console.error('Create customer error:', err);
      toast.error('Failed to create customer');
    } finally {
      setIsSubmittingCreateCustomer(false);
    }
  };

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
                    return;
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

      <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-branding">
          <img src={logo} alt="TrustiChain" className="sidebar-logo" />
          <div className="sidebar-branding-text">
            <span className="sidebar-title">TrustiChain</span>
            <span className="sidebar-tagline">Secure escrow platform</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-section-label">General</p>
          <nav className="sidebar-nav">
            {sidebarNav.map((item) => {
              const Icon = item.icon;

              const routeByLabel = {
                Dashboard: '/dashboard',
                'My Escrow': '/my-escrow',
                Transactions: '/transactions',
                Dispute: '/dispute',
                Savings: '/savings',
                Trusticard: null,
              };

              const targetPath = routeByLabel[item.label];

              const isActive = (() => {
                if (!targetPath) return false;
                if (targetPath === '/dispute') {
                  return location.pathname === '/dispute' || location.pathname.startsWith('/dispute/');
                }
                return location.pathname === targetPath;
              })();

              const handleNavClick = () => {
                if (!targetPath) return;
                navigate(targetPath);
              };
              const navBadge = getNavBadge(item);
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {navBadge != null && navBadge !== '' ? (
                    <span className="sidebar-badge">{navBadge}</span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

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
            <span className="trustiscore-badge">{trustiscoreBadgeText}</span>
          </div>

          <button type="button" className="sidebar-logout" onClick={handleLogout}>
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
            {kycComplete ? (
              <div className="account-type-display">
                <span className="account-type-label">{accountType}</span>
              </div>
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
              <div className="user-avatar">
                {userAvatar ? (
                  <img src={userAvatar} alt={userFullName} className="user-avatar-img" />
                ) : (
                  userInitials
                )}
              </div>
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

        <div className="trusticard-content">
          {/* Mobile My Cards Section */}
          {!showCardDetails && (
          <div className="mobile-my-cards-section">
            <div className="mobile-my-cards-header">
              <div className="mobile-my-cards-title-wrapper">
                <div className="mobile-section-indicator"></div>
                <h2 className="mobile-my-cards-title">My Cards</h2>
              </div>
              <div className="mobile-cards-header-actions">
                <button type="button" className="mobile-add-card-btn mobile-apply-card-btn" onClick={() => setShowCreateCustomerModal(true)}>
                  <span>Apply for card</span>
                </button>
                <button type="button" className="mobile-add-card-btn" onClick={() => setShowIssueCardModal(true)}>
                  <Plus size={16} />
                  <span>Create card</span>
                </button>
              </div>
            </div>
            <div className="mobile-card-display">
              {isLoadingCards ? (
                <div className="mobile-card-loading">
                  <LoadingIndicator size="md" />
                </div>
              ) : cardsList.length === 0 ? (
                <div className="mobile-card-empty" onClick={() => setShowCreateCustomerModal(true)} style={{ cursor: 'pointer' }}>
                  <CreditCardIcon size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                  <span>No cards yet</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Tap to add a card</span>
                </div>
              ) : (() => {
                const card = cardsList[currentCardIndex] || cardsList[0];
                const balance = Number(card?.card_balance) || 0;
                const currency = card?.card_currency_code || 'USD';
                const balanceStr = new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(balance);
                const isFirst = currentCardIndex === 0;
                return (
                  <div
                    className={isFirst ? 'mobile-card-blue' : 'mobile-card-white'}
                    onClick={() => setShowCardDetails(true)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="mobile-card-top">
                      <span className="mobile-card-type-label">{card?.card_name || 'Card'}</span>
                      <div className="mobile-card-debit-action">
                        <span className="mobile-card-debit-text">{card?.card_type === 'universal' ? 'Universal' : 'Debit'}</span>
                        <div className="mobile-card-debit-arrow">
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </div>
                    <div className="mobile-card-balance">{balanceStr}</div>
                    <div className="mobile-card-bottom">
                      <div className="mobile-card-bottom-item">
                        <span className="mobile-card-bottom-label">Card number</span>
                        <span className="mobile-card-bottom-value">{card?.masked_pan || '**** **** **** ****'}</span>
                      </div>
                      <div className="mobile-card-bottom-item">
                        <span className="mobile-card-bottom-label">Exp</span>
                        <span className="mobile-card-bottom-value">{card?.card_exp_time || '—'}</span>
                      </div>
                      <div className="mobile-card-bottom-item">
                        <span className="mobile-card-bottom-label">Status</span>
                        <span className="mobile-card-bottom-value">{card?.status || '—'}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            {!isLoadingCards && cardsList.length > 1 && (
              <div className="mobile-card-pagination">
                {cardsList.map((_, i) => (
                  <div
                    key={i}
                    className={`mobile-card-dot ${currentCardIndex === i ? 'active' : ''}`}
                    onClick={() => setCurrentCardIndex(i)}
                  />
                ))}
              </div>
            )}
          </div>
          )}

          {/* Mobile Cashflow Section */}
          {!showCardDetails && (
          <div className="mobile-cashflow-section">
            <div className="mobile-section-header">
              <div className="mobile-section-indicator"></div>
              <h2 className="mobile-section-title">Cashflow</h2>
              <div className="mobile-period-selector">
                <select 
                  value={cashflowPeriod} 
                  onChange={(e) => setCashflowPeriod(e.target.value)}
                  className="mobile-period-select"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="mobile-cashflow-legend">
              <div className="mobile-legend-item">
                <div className="mobile-legend-color received"></div>
                <span>Amount received</span>
              </div>
              <div className="mobile-legend-item">
                <div className="mobile-legend-color spent"></div>
                <span>Amount Spent</span>
              </div>
            </div>
            <div className="mobile-cashflow-chart-container">
              <div className="mobile-chart-y-axis">
                <span className="mobile-y-axis-label">100%</span>
                <span className="mobile-y-axis-label">80%</span>
                <span className="mobile-y-axis-label">60%</span>
                <span className="mobile-y-axis-label">40%</span>
                <span className="mobile-y-axis-label">20%</span>
                <span className="mobile-y-axis-label">0%</span>
              </div>
              <div className="mobile-cashflow-chart">
                <div className="mobile-chart-bars-container">
                  {cashflowData.map((item, index) => (
                    <div key={index} className="mobile-chart-month">
                      <div className="mobile-chart-bars">
                        <div 
                          className="mobile-chart-bar received" 
                          style={{ height: `${item.received}%` }}
                        ></div>
                        <div 
                          className="mobile-chart-bar spent" 
                          style={{ height: `${item.spent}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mobile-chart-labels-row">
                  {cashflowData.map((item, index) => (
                    <div key={index} className="mobile-chart-label-wrapper">
                      <span className="mobile-chart-label">{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Mobile Transaction History Section */}
          {!showCardDetails && (
          <div className="mobile-transaction-history-section">
            <div className="mobile-section-header">
              <div className="mobile-section-indicator"></div>
              <h2 className="mobile-section-title">Transaction History</h2>
              <button type="button" className="mobile-transaction-arrow">
                <ArrowRight size={20} />
              </button>
            </div>
            <div className="mobile-transaction-list">
              {isLoadingCardTransactions ? (
                <div className="mobile-transaction-loading">
                  <LoadingIndicator size="md" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="mobile-transaction-empty">No card transactions yet</div>
              ) : (
                transactions.map((tx, index) => {
                  const xrpAmount = tx.amount.replace('+', '').replace('-', '');
                  return (
                    <div key={index} className="mobile-transaction-item">
                      <div className={`mobile-transaction-icon ${tx.type.toLowerCase()}`}>
                        {tx.type === 'Received' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                      </div>
                      <div className="mobile-transaction-content">
                        <div className="mobile-transaction-type">{tx.typeLabel || tx.type}</div>
                        <div className="mobile-transaction-description">
                          {tx.type === 'Received' ? 'You received' : 'You sent'} {xrpAmount}, worth {tx.usd}.
                        </div>
                        <div className="mobile-transaction-footer">
                          <span className={`mobile-transaction-status ${(tx.status || '').toLowerCase()}`}>
                            {tx.status}
                          </span>
                          <span className="mobile-transaction-date">{tx.date}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          )}

          {/* Mobile Card Details Page */}
          {showCardDetails && isMobile && (
            <div className="mobile-card-details-page">
              <div className="mobile-card-details-header">
                <div className="mobile-card-details-title-wrapper">
                  <div className="mobile-section-indicator"></div>
                  <h2 className="mobile-card-details-title">Card Details</h2>
                </div>
                <button
                  type="button"
                  className="mobile-card-details-close"
                  onClick={() => {
                    setShowCardDetails(false);
                    setSelectedCardDetails(null);
                    setShowSensitiveCardInfo(false);
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mobile-card-details-content">
                {/* Platinum Card Section */}
                <div className="mobile-card-details-card-section">
                  <div className="mobile-card-details-section-header">
                    <div className="mobile-section-indicator"></div>
                    <h3 className="mobile-card-details-section-title">{selectedCardDetails?.card_name || cardsList[currentCardIndex]?.card_name || 'Card'}</h3>
                  </div>
                  <div className="mobile-card-details-card-display">
                    <div className="mobile-card-blue">
                      <div className="mobile-card-top">
                        <span className="mobile-card-type-label">{selectedCardDetails?.card_name || cardsList[currentCardIndex]?.card_name || 'Card'}</span>
                        <div className="mobile-card-debit-action">
                          <span className="mobile-card-debit-text">{selectedCardDetails?.card_type === 'universal' ? 'Universal' : 'Debit'}</span>
                          <div className="mobile-card-debit-arrow">
                            <ArrowRight size={16} />
                          </div>
                        </div>
                      </div>
                      <div className="mobile-card-balance">
                        {isLoadingCardDetails ? (
                          <LoadingIndicator size="sm" />
                        ) : (
                          new Intl.NumberFormat(undefined, {
                            style: 'currency',
                            currency: selectedCardDetails?.card_currency_code || cardsList[currentCardIndex]?.card_currency_code || 'USD',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(Number(selectedCardDetails?.card_balance ?? cardsList[currentCardIndex]?.card_balance) || 0)
                        )}
                      </div>
                      <div className="mobile-card-bottom">
                        <div className="mobile-card-bottom-item">
                          <span className="mobile-card-bottom-label">Card number</span>
                          <span className="mobile-card-bottom-value">{selectedCardDetails?.masked_pan || cardsList[currentCardIndex]?.masked_pan || '**** **** **** ****'}</span>
                        </div>
                        <div className="mobile-card-bottom-item">
                          <span className="mobile-card-bottom-label">Exp</span>
                          <span className="mobile-card-bottom-value">{selectedCardDetails?.card_exp_time || cardsList[currentCardIndex]?.card_exp_time || '—'}</span>
                        </div>
                        <div className="mobile-card-bottom-item">
                          <span className="mobile-card-bottom-label">Status</span>
                          <span className="mobile-card-bottom-value">{selectedCardDetails?.status || cardsList[currentCardIndex]?.status || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mobile-card-details-actions">
                  <button 
                    type="button" 
                    className="mobile-card-action-btn"
                    onClick={() => {
                      setShowCardDetails(false);
                      setShowMobileFundPage(true);
                    }}
                  >
                    <Plus size={16} />
                    <span>Top Up</span>
                  </button>
                  <div className="mobile-card-action-divider"></div>
                  <button 
                    type="button" 
                    className="mobile-card-action-btn"
                    onClick={() => {
                      setShowCardDetails(false);
                      setShowMobileAddressPage(true);
                    }}
                  >
                    <CreditCardIcon size={16} />
                    <span>Address</span>
                  </button>
                </div>

                {/* Card Numbers Section - full PAN & CVV from API */}
                <div className="mobile-card-details-info-section">
                  <div className="mobile-card-info-item full-width">
                    <span className="mobile-card-info-label">Card number</span>
                    <div className="mobile-card-info-value">
                      {isLoadingCardDetails ? (
                        <LoadingIndicator size="sm" />
                      ) : (
                        <>
                          <span>{showSensitiveCardInfo && selectedCardDetails?.real_pan ? selectedCardDetails.real_pan : (selectedCardDetails?.masked_pan || '**** **** **** ****')}</span>
                          <button
                            type="button"
                            className="mobile-card-eye-btn"
                            onClick={() => setShowSensitiveCardInfo((v) => !v)}
                            aria-label={showSensitiveCardInfo ? 'Hide number' : 'Show number'}
                          >
                            {showSensitiveCardInfo ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mobile-card-info-row">
                    <div className="mobile-card-info-item">
                      <span className="mobile-card-info-label">Exp Date</span>
                      <span className="mobile-card-info-value">{selectedCardDetails?.card_exp_time || '—'}</span>
                    </div>
                    <div className="mobile-card-info-item">
                      <span className="mobile-card-info-label">CVV</span>
                      <div className="mobile-card-info-value">
                        {showSensitiveCardInfo && selectedCardDetails?.cvv ? selectedCardDetails.cvv : '***'}
                      </div>
                    </div>
                    <div className="mobile-card-info-item">
                      <span className="mobile-card-info-label">Status</span>
                      <button type="button" className={`mobile-card-status-badge ${(selectedCardDetails?.status || '').toLowerCase() === 'enabled' ? 'active' : ''}`}>
                        {selectedCardDetails?.status || '—'}
                      </button>
                    </div>
                  </div>
                  {selectedCardDetails?.address ? (
                    <div className="mobile-card-info-item full-width" style={{ marginTop: '0.75rem' }}>
                      <span className="mobile-card-info-label">Address</span>
                      <span className="mobile-card-info-value">{selectedCardDetails.address}</span>
                    </div>
                  ) : null}
                </div>

                {/* Spending Limits */}
                <div className="mobile-card-details-spending-limits">
                  <div className="mobile-card-details-section-header">
                    <div className="mobile-section-indicator"></div>
                    <h3 className="mobile-card-details-section-title">Spending limits</h3>
                  </div>
                  <div className="mobile-spending-limits-bar">
                    <div className="mobile-spending-limits-progress" style={{ width: '60%' }}></div>
                  </div>
                  <div className="mobile-spending-limits-text">$6,000 of $10,000</div>
                </div>

                {/* Freeze Card */}
                <div className="mobile-card-details-freeze">
                  <span className="mobile-freeze-card-label">Freeze Card</span>
                  <button 
                    type="button" 
                    className={`mobile-freeze-toggle ${freezeCard ? 'active' : ''}`}
                    disabled={isFreezing || !cardsList[currentCardIndex]?.ulid}
                    onClick={handleFreezeToggle}
                    title={isFreezing ? 'Updating…' : undefined}
                  >
                    <div className={`mobile-freeze-toggle-slider ${freezeCard ? 'active' : ''}`}></div>
                  </button>
                </div>

                {/* Transaction History */}
                <div className="mobile-card-details-transaction-history">
                  <div className="mobile-card-details-section-header">
                    <div className="mobile-section-indicator"></div>
                    <h3 className="mobile-card-details-section-title">Transaction History</h3>
                    <button type="button" className="mobile-transaction-history-arrow">
                      <ArrowRight size={20} />
                    </button>
                  </div>
                  <div className="mobile-card-details-transaction-list">
                    {isLoadingCardTransactions ? (
                      <div className="mobile-transaction-loading">
                        <LoadingIndicator size="md" />
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="mobile-transaction-empty">No card transactions yet</div>
                    ) : (
                      transactions.map((tx, index) => {
                        const xrpAmount = tx.amount.replace('+', '').replace('-', '');
                        return (
                          <div key={index} className="mobile-card-details-transaction-item">
                            <div className={`mobile-transaction-icon ${tx.type.toLowerCase()}`}>
                              {tx.type === 'Received' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                            </div>
                            <div className="mobile-transaction-content">
                              <div className="mobile-transaction-type">{tx.typeLabel || tx.type}</div>
                              <div className="mobile-transaction-description">
                                {tx.type === 'Received' ? 'You received' : 'You sent'} {xrpAmount}, worth {tx.usd}.
                              </div>
                              <div className="mobile-transaction-footer">
                                <span className={`mobile-transaction-status ${(tx.status || '').toLowerCase()}`}>
                                  {tx.status}
                                </span>
                                <span className="mobile-transaction-date">{tx.date}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Card Address Page */}
          {showMobileAddressPage && isMobile && (
            <div className="mobile-card-address-page">
              <div className="mobile-card-address-header">
                <div className="mobile-card-address-title-wrapper">
                  <div className="mobile-section-indicator"></div>
                  <h2 className="mobile-card-address-title">Card Address</h2>
                </div>
                <button 
                  type="button" 
                  className="mobile-card-address-close"
                  onClick={() => setShowMobileAddressPage(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mobile-card-address-content">
                <div className="mobile-address-form">
                  <div className="mobile-address-field">
                    <label className="mobile-address-label">Street Address</label>
                    <input 
                      type="text" 
                      className="mobile-address-input"
                      placeholder="Enter your name"
                      value={addressForm.streetAddress}
                      onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                    />
                  </div>

                  <div className="mobile-address-field">
                    <label className="mobile-address-label">City</label>
                    <input 
                      type="text" 
                      className="mobile-address-input"
                      placeholder="Enter your name"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    />
                  </div>

                  <div className="mobile-address-field">
                    <label className="mobile-address-label">State</label>
                    <input 
                      type="text" 
                      className="mobile-address-input"
                      placeholder="Enter your name"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    />
                  </div>

                  <div className="mobile-address-field">
                    <label className="mobile-address-label">Country</label>
                    <input 
                      type="text" 
                      className="mobile-address-input"
                      placeholder="Enter your name"
                      value={addressForm.country}
                      onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    />
                  </div>

                  <div className="mobile-address-field">
                    <label className="mobile-address-label">Postal code</label>
                    <input 
                      type="text" 
                      className="mobile-address-input"
                      placeholder="Enter your name"
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Fund Trusticard Page */}
          {showMobileFundPage && isMobile && (
            <div className="mobile-fund-trusticard-page">
              <div className="mobile-fund-header">
                <div className="mobile-fund-title-wrapper">
                  <div className="mobile-section-indicator"></div>
                  <h2 className="mobile-fund-title">Fund Trusticard</h2>
                </div>
                <button 
                  type="button" 
                  className="mobile-fund-close"
                  onClick={() => setShowMobileFundPage(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mobile-fund-content">
                <div className="mobile-fund-amount-card">
                  {/* Amount Section */}
                  <div className="mobile-fund-amount-section">
                    <div className="mobile-fund-amount-header">
                      <label className="mobile-fund-amount-label">Amount</label>
                      <div className="mobile-fund-wallet-pill">
                        <div className="mobile-fund-wallet-pill-badge">
                          <img 
                            src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                            alt="XRP" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        </div>
                        <span className="mobile-fund-wallet-pill-text">{selectedWallet}</span>
                        <ChevronDown size={16} />
                      </div>
                    </div>
                    <input 
                      type="text" 
                      className="mobile-fund-amount-input"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      placeholder="0"
                    />
                    <div className="mobile-fund-balance">Balance: 0 XPR</div>
                  </div>

                  {/* Amount in USD Section */}
                  <div className="mobile-fund-usd-section">
                    <label className="mobile-fund-usd-label">Amount in USD</label>
                    <div className="mobile-fund-usd-value">$0</div>
                  </div>
                </div>

                {/* Fund Card Button */}
                <button 
                  type="button" 
                  className="mobile-fund-card-btn"
                  disabled={isDepositing || !cardsList[currentCardIndex]?.ulid}
                  onClick={() => depositToCard(fundAmount)}
                >
                  {isDepositing ? <LoadingIndicator size="sm" /> : 'Fund Card'}
                </button>

                {/* Information Message */}
                <div className="mobile-fund-info-message">
                  <div className="mobile-fund-info-icon">
                    <Info size={18} />
                  </div>
                  <span className="mobile-fund-info-text">
                    Your funds will be added to your account within seconds or refunded if there's an issue.
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="trusticard-layout">
            {/* Left Column - My Cards */}
            <div className="trusticard-left-column">
              <div className="my-cards-section">
                <div className="section-header">
                  <div className="section-indicator"></div>
                  <h2 className="section-title">My Cards</h2>
                  <div className="cards-header-actions">
                    <button type="button" className="add-card-btn apply-card-btn" onClick={() => setShowCreateCustomerModal(true)}>
                      Apply for card
                    </button>
                    <button type="button" className="add-card-btn" onClick={() => setShowIssueCardModal(true)}>
                      <Plus size={16} />
                      Create card
                    </button>
                  </div>
                </div>
                <div className="cards-stack">
                  {isLoadingCards ? (
                    <div className="cards-stack-loading">
                      <LoadingIndicator size="md" />
                    </div>
                  ) : cardsList.length === 0 ? (
                    <div className="cards-stack-empty" onClick={() => setShowCreateCustomerModal(true)} style={{ cursor: 'pointer' }}>
                      <CreditCardIcon size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
                      <span>No cards yet</span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Click to add a card</span>
                    </div>
                  ) : (
                    cardsList.map((card, index) => {
                      const balance = Number(card?.card_balance) || 0;
                      const currency = card?.card_currency_code || 'USD';
                      const balanceStr = new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(balance);
                      return (
                        <div key={card?.ulid || card?.id || index} className={`platinum-card ${index === 0 ? 'blue-card' : 'secondary-card'}`}>
                          <div className="platinum-card-header">
                            <span className="platinum-card-label">{card?.card_name || 'Card'}</span>
                            <span className="platinum-card-type">{card?.card_type === 'universal' ? 'Universal' : card?.card_provider || 'Debit'}</span>
                          </div>
                          <div className="platinum-card-balance">{balanceStr}</div>
                          <div className="platinum-card-details">
                            <div className="platinum-card-detail-item">
                              <span className="platinum-card-detail-label">Card number</span>
                              <span className="platinum-card-detail-value">{card?.masked_pan || '**** **** **** ****'}</span>
                            </div>
                            <div className="platinum-card-detail-item">
                              <span className="platinum-card-detail-label">Exp</span>
                              <span className="platinum-card-detail-value">{card?.card_exp_time || '—'}</span>
                            </div>
                            <div className="platinum-card-detail-item">
                              <span className="platinum-card-detail-label">Status</span>
                              <span className="platinum-card-detail-value">{card?.status || '—'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Card Details, Cashflow, Transaction History */}
            <div className="trusticard-right-column">
              {/* Card Details and Cashflow Row */}
              <div className="card-details-cashflow-row">
                {/* Card Details Section */}
                <div className="card-details-section">
                <div className="card-actions">
                  <button 
                    type="button" 
                    className="card-action-btn" 
                    onClick={() => {
                      if (isMobile) {
                        setShowMobileFundPage(true);
                      } else {
                        setShowFundModal(true);
                      }
                    }}
                  >
                    <Plus size={14} />
                    Top Up
                  </button>
                  <button type="button" className="card-action-btn" onClick={() => setShowAddressModal(true)}>
                    <CreditCardIcon size={14} />
                    Address
                  </button>
                </div>
                <div className="card-info-grid">
                  <div className="card-info-item card-numbers-full">
                    <span className="card-info-label">Card number</span>
                    <div className="card-info-value">
                      {isLoadingCardDetails ? (
                        <LoadingIndicator size="sm" />
                      ) : (
                        <>
                          <span>{showSensitiveCardInfo && selectedCardDetails?.real_pan ? selectedCardDetails.real_pan : (selectedCardDetails?.masked_pan || cardsList[0]?.masked_pan || '**** **** **** ****')}</span>
                          <button
                            type="button"
                            className="card-detail-eye-btn"
                            onClick={() => setShowSensitiveCardInfo((v) => !v)}
                            aria-label={showSensitiveCardInfo ? 'Hide number' : 'Show number'}
                          >
                            {showSensitiveCardInfo ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="card-info-row">
                    <div className="card-info-item">
                      <span className="card-info-label">Exp Date</span>
                      <span className="card-info-value">{selectedCardDetails?.card_exp_time || cardsList[0]?.card_exp_time || '—'}</span>
                    </div>
                    <div className="card-info-item">
                      <span className="card-info-label">CVV</span>
                      <span className="card-info-value">{showSensitiveCardInfo && selectedCardDetails?.cvv ? selectedCardDetails.cvv : '***'}</span>
                    </div>
                    <div className="card-info-item status-item">
                      <span className="card-info-label">Status</span>
                      <button type="button" className={`status-badge ${(selectedCardDetails?.status || cardsList[0]?.status || '').toLowerCase() === 'enabled' ? 'active' : ''}`}>
                        {selectedCardDetails?.status || cardsList[0]?.status || '—'}
                      </button>
                    </div>
                  </div>
                  {selectedCardDetails?.address ? (
                    <div className="card-info-item card-address-full" style={{ marginTop: '0.5rem' }}>
                      <span className="card-info-label">Address</span>
                      <span className="card-info-value">{selectedCardDetails.address}</span>
                    </div>
                  ) : null}
                </div>
                <div className="spending-limits">
                  <div className="spending-limits-header">
                    <span className="spending-limits-label">Spending limits</span>
                  </div>
                  <div className="spending-limits-bar">
                    <div className="spending-limits-progress" style={{ width: '60%' }}></div>
                  </div>
                  <div className="spending-limits-text">$6,000 of $10,000</div>
                </div>
                <div className="freeze-card-toggle">
                  <span className="freeze-card-label">Freeze Card</span>
                  <button 
                    type="button" 
                    className={`freeze-toggle ${freezeCard ? 'active' : ''}`}
                    disabled={isFreezing || !cardsList[currentCardIndex]?.ulid}
                    onClick={handleFreezeToggle}
                    title={isFreezing ? 'Updating…' : undefined}
                  >
                    <div className={`freeze-toggle-slider ${freezeCard ? 'active' : ''}`}></div>
                  </button>
                </div>
              </div>

              {/* Cashflow Section */}
              <div className="cashflow-section">
                <div className="section-header">
                  <div className="section-indicator"></div>
                  <h2 className="section-title">Cashflow</h2>
                  <div className="period-selector">
                    <select 
                      value={cashflowPeriod} 
                      onChange={(e) => setCashflowPeriod(e.target.value)}
                      className="period-select"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </div>
                <div className="cashflow-legend">
                  <div className="legend-item">
                    <div className="legend-color received"></div>
                    <span>Amount received</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color spent"></div>
                    <span>Amount Spent</span>
                  </div>
                </div>
                <div className="cashflow-chart-container">
                  <div className="chart-y-axis">
                    <span className="y-axis-label">100%</span>
                    <span className="y-axis-label">80%</span>
                    <span className="y-axis-label">60%</span>
                    <span className="y-axis-label">40%</span>
                    <span className="y-axis-label">20%</span>
                    <span className="y-axis-label">0%</span>
                  </div>
                  <div className="cashflow-chart">
                    {/* Bars only */}
                    <div className="chart-bars-container">
                      {cashflowData.map((item, index) => (
                        <div key={index} className="chart-month">
                          <div className="chart-bars">
                            <div 
                              className="chart-bar received" 
                              style={{ height: `${item.received}%` }}
                            ></div>
                            <div 
                              className="chart-bar spent" 
                              style={{ height: `${item.spent}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Labels row below */}
                    <div className="chart-labels-row">
                      {cashflowData.map((item, index) => (
                        <div key={index} className="chart-label-wrapper">
                          <span className="chart-label">{item.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              </div>

              {/* Transaction History Section */}
              <div className="transaction-history-section">
                <div className="section-header">
                  <div className="section-indicator"></div>
                  <h2 className="section-title">Transaction history</h2>
                  <div className="transaction-filters">
                    <div className="filter-selector">
                      <select 
                        value={transactionFilter} 
                        onChange={(e) => setTransactionFilter(e.target.value)}
                        className="filter-select"
                      >
                        <option value="Filter">Filter</option>
                        <option value="All">All</option>
                        <option value="Received">Received</option>
                        <option value="Sent">Sent</option>
                      </select>
                      <ChevronDown size={16} />
                    </div>
                    <div className="period-selector">
                      <select 
                        value={transactionPeriod} 
                        onChange={(e) => setTransactionPeriod(e.target.value)}
                        className="period-select"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                      <ChevronDown size={16} />
                    </div>
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
                        <th>Type</th>
                        <th>Transaction ID</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingCardTransactions ? (
                        <tr>
                          <td colSpan={7} className="transaction-table-loading">
                            <LoadingIndicator size="md" />
                          </td>
                        </tr>
                      ) : transactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="transaction-table-empty">No card transactions yet</td>
                        </tr>
                      ) : (
                        transactions.map((tx, index) => (
                          <tr key={index}>
                            <td>
                              <input
                                type="checkbox"
                                checked={tx.checked}
                                onChange={() => {}}
                              />
                            </td>
                            <td>
                              <div className="transaction-type-cell">
                                <div className={`transaction-type-icon ${tx.type.toLowerCase()}`}>
                                  {tx.type === 'Received' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                                </div>
                                <span>{tx.typeLabel || tx.type}</span>
                              </div>
                            </td>
                            <td>
                              <div className="transaction-id">{tx.id}</div>
                            </td>
                            <td>
                              <div className="transaction-amount">
                                <span className="amount-value">{tx.amount}</span>
                                <span className="amount-usd">({tx.usd})</span>
                              </div>
                            </td>
                            <td>
                              <span className={`status-badge ${(tx.status || '').toLowerCase()}`}>{tx.status}</span>
                            </td>
                            <td>{tx.date}</td>
                            <td>
                              <button type="button" className="transaction-detail-btn">
                                <ArrowRight size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="transaction-pagination">
                  <button 
                    type="button" 
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    ← Prev 10
                  </button>
                  <div className="pagination-numbers">
                    <button 
                      type="button" 
                      className={`pagination-number ${currentPage === 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(1)}
                    >
                      1
                    </button>
                    <span className="pagination-ellipsis">...</span>
                    {[11, 12, 13, 14, 15, 16, 17, 18].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`pagination-number ${currentPage === num ? 'active' : ''}`}
                        onClick={() => setCurrentPage(num)}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <button 
                    type="button" 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next 10 →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fund Trusticard Modal */}
      {/* Fund Modal - Desktop Only */}
      {showFundModal && !isMobile && (
        <div className="modal-overlay" onClick={() => setShowFundModal(false)}>
          <div className="fund-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fund-modal-header">
              <h2 className="fund-modal-title">Fund Trusticard</h2>
              <button 
                type="button" 
                className="fund-modal-close"
                onClick={() => setShowFundModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="fund-modal-content">
              {/* Amount Section (XRP) */}
              <div className="fund-amount-section">
                <div className="fund-amount-header">
                  <label className="fund-amount-label">Amount</label>
                  <div className="fund-wallet-selector">
                    <div className="wallet-icon">
                      <img 
                        src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                        alt="XRP" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    </div>
                    <span>{selectedWallet}</span>
                    <ChevronDown size={16} />
                  </div>
                </div>
                <div className="fund-amount-input-wrapper">
                  <input 
                    type="text" 
                    className="fund-amount-input"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                  />
                  <span className="fund-amount-currency">XRP</span>
                </div>
                <div className="fund-balance">Balance: 0 XRP</div>
              </div>

              {/* Amount in USD Section */}
              <div className="fund-usd-section">
                <label className="fund-usd-label">Amount in USD</label>
                <div className="fund-usd-input-wrapper">
                  <input 
                    type="text" 
                    className="fund-usd-input"
                    value="$0"
                    readOnly
                  />
                </div>
              </div>

              {/* Fund Card Button */}
              <button 
                type="button" 
                className="fund-card-btn"
                disabled={isDepositing || !cardsList[currentCardIndex]?.ulid}
                onClick={() => depositToCard(fundAmount)}
              >
                {isDepositing ? <LoadingIndicator size="sm" /> : 'Fund Card'}
              </button>

              {/* Info Message */}
              <div className="fund-info-message">
                <Info size={16} />
                <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Address Modal */}
      {showAddressModal && (
        <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="address-modal" onClick={(e) => e.stopPropagation()}>
            <div className="address-modal-header">
              <h2 className="address-modal-title">Card Address</h2>
              <button 
                type="button" 
                className="address-modal-close"
                onClick={() => setShowAddressModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="address-modal-content">
              <div className="address-form-field">
                <label className="address-field-label">Street Address</label>
                <input 
                  type="text" 
                  className="address-input"
                  placeholder="Enter your name"
                  value={addressForm.streetAddress}
                  onChange={(e) => setAddressForm({...addressForm, streetAddress: e.target.value})}
                />
              </div>

              <div className="address-form-field">
                <label className="address-field-label">City</label>
                <input 
                  type="text" 
                  className="address-input"
                  placeholder="Enter your name"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                />
              </div>

              <div className="address-form-field">
                <label className="address-field-label">State</label>
                <input 
                  type="text" 
                  className="address-input"
                  placeholder="Enter your name"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                />
              </div>

              <div className="address-form-field">
                <label className="address-field-label">Country</label>
                <input 
                  type="text" 
                  className="address-input"
                  placeholder="Enter your name"
                  value={addressForm.country}
                  onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                />
              </div>

              <div className="address-form-field">
                <label className="address-field-label">Postal code</label>
                <input 
                  type="text" 
                  className="address-input"
                  placeholder="Enter your name"
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})}
                />
              </div>

              <button 
                type="button" 
                className="update-address-btn"
                onClick={() => {
                  // Handle update address logic here
                  setShowAddressModal(false);
                }}
              >
                Update address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue card modal - Create card */}
      {showIssueCardModal && (
        <div className="modal-overlay create-customer-modal-overlay" onClick={() => !isSubmittingIssueCard && setShowIssueCardModal(false)}>
          <div className="address-modal create-customer-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="address-modal-header create-customer-modal-header">
              <div className="modal-header-back-icon" aria-hidden />
              <h2 className="address-modal-title">Issue card</h2>
              <button
                type="button"
                className="address-modal-close modal-close-btn"
                onClick={() => !isSubmittingIssueCard && setShowIssueCardModal(false)}
                disabled={isSubmittingIssueCard}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleIssueCardSubmit}>
              <div className="create-customer-modal-content">
                <div className="create-customer-form-grid">
                  <div className="address-form-field" style={{ gridColumn: '1 / -1' }}>
                    <label className="address-field-label">Customer ULID <span className="required-asterisk">*</span></label>
                    <input
                      type="text"
                      className="address-input"
                      placeholder="e.g. 01K44CWWXSAAHPSCQK8TP4W7D0"
                      value={issueCardForm.customer_ulid}
                      onChange={(e) => setIssueCardForm({ ...issueCardForm, customer_ulid: e.target.value })}
                      required
                    />
                  </div>
                  <div className="address-form-field">
                    <label className="address-field-label">Card name <span className="required-asterisk">*</span></label>
                    <input
                      type="text"
                      className="address-input"
                      placeholder="e.g. John Doe"
                      value={issueCardForm.card_name}
                      onChange={(e) => setIssueCardForm({ ...issueCardForm, card_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="address-form-field">
                    <label className="address-field-label">Currency</label>
                    <select
                      className="address-input"
                      value={issueCardForm.card_currency}
                      onChange={(e) => setIssueCardForm({ ...issueCardForm, card_currency: e.target.value })}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div className="address-form-field">
                    <label className="address-field-label">Card type</label>
                    <select
                      className="address-input"
                      value={issueCardForm.card_type}
                      onChange={(e) => setIssueCardForm({ ...issueCardForm, card_type: e.target.value })}
                    >
                      <option value="platinum">Platinum</option>
                      <option value="gold">Gold</option>
                      <option value="standard">Standard</option>
                    </select>
                  </div>
                  <div className="address-form-field">
                    <label className="address-field-label">Card provider</label>
                    <select
                      className="address-input"
                      value={issueCardForm.card_provider}
                      onChange={(e) => setIssueCardForm({ ...issueCardForm, card_provider: e.target.value })}
                    >
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                    </select>
                  </div>
                  <div className="address-form-field" style={{ gridColumn: '1 / -1' }}>
                    <label className="address-field-label">Reference ID</label>
                    <input
                      type="text"
                      className="address-input"
                      placeholder="e.g. ref-card-1"
                      value={issueCardForm.reference_id}
                      onChange={(e) => setIssueCardForm({ ...issueCardForm, reference_id: e.target.value })}
                    />
                  </div>
                  <div className="address-form-field" style={{ gridColumn: '1 / -1' }}>
                    <label className="address-field-label">Meta user ID</label>
                    <input
                      type="text"
                      className="address-input"
                      placeholder="e.g. your-user-uuid"
                      value={issueCardForm.meta_user_id}
                      onChange={(e) => setIssueCardForm({ ...issueCardForm, meta_user_id: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="create-customer-modal-footer">
                <button type="button" className="create-customer-cancel-btn" onClick={() => setShowIssueCardModal(false)} disabled={isSubmittingIssueCard}>
                  Cancel
                </button>
                <button type="submit" className="create-customer-submit-btn" disabled={isSubmittingIssueCard}>
                  {isSubmittingIssueCard ? <LoadingIndicator size="sm" /> : 'Issue card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Customer (Cardyfie) Modal - Apply for card; full-screen on mobile like create escrow */}
      {showCreateCustomerModal && (
        <div className="modal-overlay create-customer-modal-overlay" onClick={() => !isSubmittingCreateCustomer && setShowCreateCustomerModal(false)}>
          <div className="address-modal create-customer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="address-modal-header create-customer-modal-header">
              <div className="modal-header-back-icon" aria-hidden />
              <h2 className="address-modal-title">Create customer</h2>
              <button
                type="button"
                className="address-modal-close modal-close-btn"
                onClick={() => !isSubmittingCreateCustomer && setShowCreateCustomerModal(false)}
                disabled={isSubmittingCreateCustomer}
              >
                <X size={24} />
              </button>
            </div>
            {/* Mobile step indicator - single step like create escrow mobile */}
            <div className="create-customer-steps-mobile">
              <div className="step-indicator-mobile active">
                <div className="step-icon-mobile">
                  <CreditCardIcon size={20} />
                </div>
                <div className="step-content-mobile">
                  <span className="step-number-mobile">Create card</span>
                  <span className="step-title-mobile">Create customer</span>
                </div>
              </div>
            </div>
            <form onSubmit={handleCreateCustomerSubmit}>
              <div className="create-customer-modal-content">
                <div className="create-customer-form-grid">
                  <div className="create-customer-form-column">
                    <div className="address-form-field">
                      <label className="address-field-label">First name <span className="required-asterisk">*</span></label>
                      <input
                        type="text"
                        className="address-input"
                        placeholder="e.g. John"
                        value={createCustomerForm.first_name}
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="address-form-field">
                      <label className="address-field-label">Email <span className="required-asterisk">*</span></label>
                      <input
                        type="email"
                        className="address-input"
                        placeholder="e.g. john@example.com"
                        value={createCustomerForm.email}
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="address-form-field">
                      <label className="address-field-label">ID type</label>
                      <select
                        className="address-input"
                        value={createCustomerForm.id_type}
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, id_type: e.target.value })}
                      >
                        <option value="passport">Passport</option>
                        <option value="driving_licence">Driving licence</option>
                        <option value="national_id">National ID</option>
                      </select>
                    </div>
                    <div className="address-form-field">
                      <label className="address-field-label">ID front image</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="address-input create-customer-file-input"
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, id_front_image: e.target.files?.[0] ?? null })}
                      />
                      {createCustomerForm.id_front_image && (
                        <span className="create-customer-file-name">{createCustomerForm.id_front_image.name}</span>
                      )}
                    </div>
                    <div className="address-form-field">
                      <label className="address-field-label">House number</label>
                      <input
                        type="text"
                        className="address-input"
                        placeholder="e.g. 221B"
                        value={createCustomerForm.house_number}
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, house_number: e.target.value })}
                      />
                    </div>
                    <div className="address-form-field">
                      <label className="address-field-label">City</label>
                      <input
                        type="text"
                        className="address-input"
                        placeholder="e.g. London"
                        value={createCustomerForm.city}
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, city: e.target.value })}
                      />
                    </div>
                    <div className="address-form-field">
                      <label className="address-field-label">Country</label>
                      <input
                        type="text"
                        className="address-input"
                        placeholder="e.g. UK"
                        value={createCustomerForm.country}
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, country: e.target.value })}
                      />
                    </div>
                    <div className="address-form-field">
                      <label className="address-field-label">Reference ID</label>
                      <input
                        type="text"
                        className="address-input"
                        placeholder="e.g. ref-1124"
                        value={createCustomerForm.reference_id}
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, reference_id: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="create-customer-form-column">
                    <div className="address-form-field">
                      <label className="address-field-label">Last name <span className="required-asterisk">*</span></label>
                      <input
                        type="text"
                        className="address-input"
                        placeholder="e.g. Doe"
                        value={createCustomerForm.last_name}
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, last_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="address-form-field">
                      <label className="address-field-label">Date of birth</label>
                      <input
                        type="text"
                        className="address-input"
                        placeholder="e.g. 10/12/1990"
                        value={createCustomerForm.date_of_birth}
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, date_of_birth: e.target.value })}
                      />
                    </div>
                    <div className="address-form-field">
                      <label className="address-field-label">ID number</label>
                      <input
                        type="text"
                        className="address-input"
                        placeholder="e.g. GBR123456789"
                        value={createCustomerForm.id_number}
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, id_number: e.target.value })}
                      />
                    </div>
                    <div className="address-form-field">
                      <label className="address-field-label">User photo (selfie)</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="address-input create-customer-file-input"
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, user_image: e.target.files?.[0] ?? null })}
                      />
                      {createCustomerForm.user_image && (
                        <span className="create-customer-file-name">{createCustomerForm.user_image.name}</span>
                      )}
                    </div>
                    <div className="address-form-field">
                      <label className="address-field-label">ID back image</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="address-input create-customer-file-input"
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, id_back_image: e.target.files?.[0] ?? null })}
                      />
                      {createCustomerForm.id_back_image && (
                        <span className="create-customer-file-name">{createCustomerForm.id_back_image.name}</span>
                      )}
                    </div>
                    <div className="address-form-field">
                      <label className="address-field-label">Address line 1</label>
                      <input
                        type="text"
                        className="address-input"
                        placeholder="e.g. Baker Street"
                        value={createCustomerForm.address_line_1}
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, address_line_1: e.target.value })}
                      />
                    </div>
                    <div className="address-form-field">
                      <label className="address-field-label">Zip code</label>
                      <input
                        type="text"
                        className="address-input"
                        placeholder="e.g. NW1 6XE"
                        value={createCustomerForm.zip_code}
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, zip_code: e.target.value })}
                      />
                    </div>
                    <div className="address-form-field">
                      <label className="address-field-label">State</label>
                      <input
                        type="text"
                        className="address-input"
                        placeholder="e.g. England"
                        value={createCustomerForm.state}
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, state: e.target.value })}
                      />
                    </div>
                    <div className="address-form-field">
                      <label className="address-field-label">Meta user ID (optional)</label>
                      <input
                        type="text"
                        className="address-input"
                        placeholder="e.g. your-user-uuid"
                        value={createCustomerForm.meta_user_id}
                        onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, meta_user_id: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="create-customer-modal-footer">
                <button
                  type="submit"
                  className="update-address-btn"
                  disabled={isSubmittingCreateCustomer}
                >
                  {isSubmittingCreateCustomer ? 'Creating…' : 'Create customer'}
                </button>
              </div>
            </form>
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
              {Array.isArray(notifications) && notifications.length > 0 ? (
                notifications.map((n) => {
                  const isUnread = !n?.isRead;
                  const { Icon, className } = getNotificationIconConfig(n?.type);
                  const message = n?.message || n?.title || 'N/A';
                  return (
                    <div
                      key={n?.id}
                      className={`notification-item ${isUnread ? 'unread' : ''}`}
                      onClick={() => {
                        if (isUnread) handleMarkNotificationRead(n?.id);
                      }}
                    >
                      <div className="notification-bell-icon">
                        <Bell size={16} />
                        {isUnread && <span className="notification-bell-dot"></span>}
                      </div>
                      <div className="notification-content">
                        <div className="notification-message-wrapper">
                          <Icon size={18} className={className} />
                          <p className="notification-message">{message}</p>
                        </div>
                        <span className="notification-time">{formatTimeAgo(n?.createdAt)}</span>
                      </div>
                      {isUnread && <div className="notification-unread-dot"></div>}
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  N/A
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default TrustiCard;
