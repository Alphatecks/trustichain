import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Calendar,
  Menu,
  Plus,
  CheckCircle,
  FileText,
  Download,
  Clock,
  Coins,
  Upload,
  PiggyBank
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import '../my-escrow/MyEscrow.css';
import './Dispute.css';
import './DisputeDetail.css';
import logo from '../../../assets/images/icons/logo.png';
import { getApiUrl } from '../../../utils/config';
import { getProfileAvatarUrl } from '../../../utils/profileAvatar';
import { persistTrustitagFromProfileResponse } from '../../../utils/trustitag';
import { getDisputeSummary, getDisputes } from '../../../utils/disputesApi';
import { handleLogout } from '../../../utils/logout';
import { useSession } from '../../../context/SessionContext';
import { useTrustiscore, formatTrustiscoreBadgeText } from '../../../context/TrustiscoreContext';
import { useSidebarNavBadges } from '../../../hooks/useSidebarNavBadges';
import LoadingIndicator from '../../../components/LoadingIndicator';
import HeaderProfileVerifyBadge from '../../../components/HeaderProfileVerifyBadge';
import PersonalSuiteMobileHeader from '../../../components/PersonalSuiteMobileHeader';
import NotificationCenterModal from '../../../components/NotificationCenterModal/NotificationCenterModal';

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: null },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: null },
  { label: 'Savings', icon: PiggyBank, badge: null },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta' },
  { label: 'P2P trading', icon: Repeat, badge: 'Beta' }
];

const supportNav = [{ label: 'Settings', icon: Settings }];

const MONTH_LABEL_TO_NUMBER = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12
};

const MONTH_OPTIONS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

// Get current month name
const getCurrentMonth = () => {
  const now = new Date();
  return MONTH_OPTIONS[now.getMonth()];
};
const toNumberOrNull = (value) => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : null;
};

const formatPercent = (value) => {
  const num = toNumberOrNull(value);
  if (num === null) return 'N/A';
  const sign = num > 0 ? '+' : '';
  return `${sign}${num}%`;
};

const formatXrpAmount = (value) => {
  const num = toNumberOrNull(value);
  if (num === null) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(num);
};

const formatUsdAmount = (value) => {
  const num = toNumberOrNull(value);
  if (num === null) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(num);
};

const formatDurationSeconds = (seconds) => {
  const num = toNumberOrNull(seconds);
  if (num === null) return 'N/A';
  const abs = Math.abs(num);
  const days = abs / 86400;
  if (days >= 1) return `${Number(days.toFixed(1))} days`;
  const hours = abs / 3600;
  if (hours >= 1) return `${Number(hours.toFixed(1))} hrs`;
  const minutes = abs / 60;
  if (minutes >= 1) return `${Number(minutes.toFixed(1))} mins`;
  return `${Number(abs.toFixed(1))} Sec`;
};

/** Overview card: large figure + smaller unit (e.g. 3.2 Sec) */
const formatAvgResolutionParts = (seconds) => {
  const num = toNumberOrNull(seconds);
  if (num === null) return { main: 'N/A', unit: null };
  const abs = Math.abs(num);
  if (abs >= 86400) return { main: String(Number((abs / 86400).toFixed(1))), unit: 'days' };
  if (abs >= 3600) return { main: String(Number((abs / 3600).toFixed(1))), unit: 'hrs' };
  if (abs >= 60) return { main: String(Number((abs / 60).toFixed(1))), unit: 'mins' };
  return { main: String(Number(abs.toFixed(1))), unit: 'Sec' };
};

const titleCaseStatus = (status) => {
  if (!status || typeof status !== 'string') return '—';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const monthLabelToYYYYMM = (monthLabel) => {
  if (!monthLabel || typeof monthLabel !== 'string') return undefined;
  const monthNumber = MONTH_LABEL_TO_NUMBER[monthLabel.trim().toLowerCase()];
  if (!monthNumber) return undefined;
  const year = new Date().getFullYear();
  return `${year}-${String(monthNumber).padStart(2, '0')}`;
};

const Dispute = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const { score: trustiscoreScore, isLoading: isTrustiscoreLoading } = useTrustiscore();
  const trustiscoreBadgeText = formatTrustiscoreBadgeText(trustiscoreScore, isTrustiscoreLoading);
  const getNavBadge = useSidebarNavBadges();
  const [accountType, setAccountType] = useState('Personal');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [kycComplete] = useState(true);
  const [userFullName, setUserFullName] = useState('Sarah Chen');
  const [userInitials, setUserInitials] = useState('SC');
  const [userAvatar, setUserAvatar] = useState(null);
  const [userRole, setUserRole] = useState('Personal Account');
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(12);
  const [itemsPerPage] = useState(10);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isMobileMonthDropdownOpen, setIsMobileMonthDropdownOpen] = useState(false);
  const monthDropdownRef = useRef(null);
  const mobileMonthDropdownRef = useRef(null);

  const [summaryMetrics, setSummaryMetrics] = useState({
    totalDisputes: null,
    activeDisputes: null,
    resolvedDisputes: null,
    avgResolutionTimeSeconds: null,
    totalChangePercent: null,
    activeChangePercent: null,
    resolvedChangePercent: null,
    avgResolutionTimeChangePercent: null
  });

  const [disputeData, setDisputeData] = useState([]);

  const monthParam = useMemo(() => monthLabelToYYYYMM(selectedMonth), [selectedMonth]);
  const statusParam = useMemo(() => {
    const normalized = (selectedFilter || '').trim().toLowerCase();
    if (!normalized || normalized === 'all') return 'all';
    if (['pending', 'active', 'resolved', 'cancelled'].includes(normalized)) return normalized;
    return 'all';
  }, [selectedFilter]);

  const avgResolutionParts = useMemo(
    () => formatAvgResolutionParts(summaryMetrics.avgResolutionTimeSeconds),
    [summaryMetrics.avgResolutionTimeSeconds],
  );

  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    setCurrentPage(1);
    setIsMonthDropdownOpen(false);
    setIsMobileMonthDropdownOpen(false);
  };

  const toggleMonthDropdown = () => {
    setIsMonthDropdownOpen((prev) => !prev);
  };

  const toggleMobileMonthDropdown = () => {
    setIsMobileMonthDropdownOpen((prev) => !prev);
  };

  const [formattedToday, setFormattedToday] = useState('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target)) {
        setIsMonthDropdownOpen(false);
      }
      if (mobileMonthDropdownRef.current && !mobileMonthDropdownRef.current.contains(event.target)) {
        setIsMobileMonthDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsMonthDropdownOpen(false);
        setIsMobileMonthDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Dispute creation modal state
  const [showCreateDisputeModal, setShowCreateDisputeModal] = useState(false);
  const [disputeCurrentStep, setDisputeCurrentStep] = useState(1);
  const [selectedDisputeType, setSelectedDisputeType] = useState('Freelancing');
  const [disputeFormData, setDisputeFormData] = useState({
    escrowId: '',
    payerWallet: '',
    payerEmail: '',
    payerName: '',
    payerPhone: '',
    counterpartyWallet: '',
    counterpartyEmail: '',
    counterpartyName: '',
    counterpartyPhone: ''
  });

  const [disputeTermsData, setDisputeTermsData] = useState({
    disputeCategory: 'Quality Issue',
    disputeReason: '',
    disputeDescription: '',
    amountInDispute: '',
    currency: 'XRP',
    disputeResolutionPeriod: '',
    evidenceDescription: '',
    expectedResolutionDate: ''
  });

  const [evidenceImages, setEvidenceImages] = useState([]);
  const [isCreatingDispute, setIsCreatingDispute] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [payerEmailValidation, setPayerEmailValidation] = useState({ isValid: null, message: '', isValidating: false });
  const [counterpartyEmailValidation, setCounterpartyEmailValidation] = useState({ isValid: null, message: '', isValidating: false });
  const [validationTimeouts, setValidationTimeouts] = useState({ payer: null, counterparty: null });
  const [isFetchingEscrowParties, setIsFetchingEscrowParties] = useState(false);
  const escrowPartiesDebounceRef = useRef(null);

  // Fetch escrow parties by escrow ID and fill form (payer + counterparty)
  const fetchEscrowParties = async (escrowId) => {
    const id = typeof escrowId === 'string' ? escrowId.trim() : '';
    if (!id) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to fetch escrow details');
      return;
    }

    setIsFetchingEscrowParties(true);
    try {
      const response = await fetch(getApiUrl(`api/escrow/${encodeURIComponent(id)}/parties`), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('Escrow parties API response:', result);

      if (!response.ok || !result?.success) {
        toast.error(result?.message || 'Could not load escrow details');
        return;
      }

      const { payer, counterparty } = result.data || {};
      setDisputeFormData((prev) => ({
        ...prev,
        escrowId: prev.escrowId,
        payerWallet: payer?.walletAddress ?? prev.payerWallet,
        payerName: payer?.name ?? prev.payerName,
        payerEmail: payer?.email ?? prev.payerEmail,
        payerPhone: payer?.phoneNumber ?? prev.payerPhone,
        counterpartyWallet: counterparty?.xrpWalletAddress ?? prev.counterpartyWallet,
        counterpartyName: counterparty?.name ?? prev.counterpartyName,
        counterpartyEmail: counterparty?.email ?? prev.counterpartyEmail,
        counterpartyPhone: counterparty?.phoneNumber ?? prev.counterpartyPhone,
      }));
      toast.success('Escrow details filled');
    } catch (error) {
      console.error('Fetch escrow parties error:', error);
      toast.error('Failed to load escrow details');
    } finally {
      setIsFetchingEscrowParties(false);
    }
  };

  // Debounced fetch: when escrow ID is being entered, fetch parties after a short pause (no need to finish typing)
  const ESCROW_PARTIES_DEBOUNCE_MS = 600;
  useEffect(() => {
    const id = (disputeFormData.escrowId || '').trim();
    if (!id) return;

    if (escrowPartiesDebounceRef.current) {
      clearTimeout(escrowPartiesDebounceRef.current);
      escrowPartiesDebounceRef.current = null;
    }

    escrowPartiesDebounceRef.current = setTimeout(() => {
      escrowPartiesDebounceRef.current = null;
      fetchEscrowParties(id);
    }, ESCROW_PARTIES_DEBOUNCE_MS);

    return () => {
      if (escrowPartiesDebounceRef.current) {
        clearTimeout(escrowPartiesDebounceRef.current);
        escrowPartiesDebounceRef.current = null;
      }
    };
  }, [disputeFormData.escrowId]);

  // Validate payer email in real-time
  const validatePayerEmail = async (email) => {
    if (!email || email.trim() === '') {
      setPayerEmailValidation({ isValid: null, message: '', isValidating: false });
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setPayerEmailValidation({ isValid: false, message: 'Invalid email format', isValidating: false });
      return;
    }

    setPayerEmailValidation({ isValid: null, message: 'Validating...', isValidating: true });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPayerEmailValidation({ isValid: null, message: '', isValidating: false });
        return;
      }

      const response = await fetch(getApiUrl('api/escrow/validate-payer-email'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payerEmail: email }),
      });

      const result = await response.json();

      if (response.ok && result?.success) {
        setPayerEmailValidation({ isValid: true, message: result?.message || 'Email is valid', isValidating: false });
      } else {
        setPayerEmailValidation({ isValid: false, message: result?.message || 'Email validation failed', isValidating: false });
      }
    } catch (error) {
      setPayerEmailValidation({ isValid: false, message: 'Validation error', isValidating: false });
    }
  };

  // Validate counterparty email in real-time
  const validateCounterpartyEmail = async (email) => {
    if (!email || email.trim() === '') {
      setCounterpartyEmailValidation({ isValid: null, message: '', isValidating: false });
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setCounterpartyEmailValidation({ isValid: false, message: 'Invalid email format', isValidating: false });
      return;
    }

    setCounterpartyEmailValidation({ isValid: null, message: 'Validating...', isValidating: true });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCounterpartyEmailValidation({ isValid: null, message: '', isValidating: false });
        return;
      }

      const response = await fetch(getApiUrl('api/escrow/validate-counterparty-email'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ counterpartyEmail: email }),
      });

      const result = await response.json();

      if (response.ok && result?.success) {
        setCounterpartyEmailValidation({ isValid: true, message: result?.message || 'Email is valid', isValidating: false });
      } else {
        setCounterpartyEmailValidation({ isValid: false, message: result?.message || 'Email validation failed', isValidating: false });
      }
    } catch (error) {
      setCounterpartyEmailValidation({ isValid: false, message: 'Validation error', isValidating: false });
    }
  };

  const handleEvidenceUpload = (files) => {
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    
    if (fileArray.length > 0) {
      const newFiles = fileArray.map(file => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        name: file.name,
        type: file.type
      }));
      setEvidenceImages([...evidenceImages, ...newFiles]);
    }
  };

  const handleFileInputChange = (e) => {
    handleEvidenceUpload(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleEvidenceUpload(files);
    }
  };

  const removeEvidenceImage = (index) => {
    const newImages = evidenceImages.filter((_, i) => i !== index);
    // Revoke object URLs to prevent memory leaks
    if (evidenceImages[index]?.preview) {
      URL.revokeObjectURL(evidenceImages[index].preview);
    }
    setEvidenceImages(newImages);
  };

  // Field mapping functions for API
  const mapDisputeCategory = (uiValue) => {
    const mapping = {
      'Freelancing': 'freelancing',
      'Real Estate': 'real_estate',
      'Product purchase': 'product_purchase',
      'Custom': 'custom'
    };
    return mapping[uiValue] || 'custom';
  };

  const mapDisputeReasonType = (uiValue) => {
    const mapping = {
      'Quality Issue': 'quality_issue',
      'Delivery Delay': 'delivery_delay',
      'Payment Dispute': 'payment_dispute'
    };
    return mapping[uiValue] || 'quality_issue';
  };

  const formatResolutionPeriod = (value) => {
    if (!value) return undefined;
    return `${value} days`;
  };

  // File upload utility
  const uploadEvidenceFile = async (file) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(getApiUrl('api/disputes/evidence/upload'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Failed to upload file');
      }

      // Return the file data in the format expected by the API
      return {
        fileUrl: result.data?.fileUrl || result.data?.url || result.fileUrl,
        fileName: result.data?.fileName || file.name,
        fileType: result.data?.fileType || file.type,
        fileSize: result.data?.fileSize || file.size
      };
    } catch (error) {
      console.error('Error uploading evidence file:', error);
      throw error;
    }
  };

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

  // Cleanup evidence image URLs when modal closes
  useEffect(() => {
    return () => {
      // Cleanup on unmount or when modal closes
      evidenceImages.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, [evidenceImages]);

  // Validation functions
  const validateStep1 = () => {
    if (!disputeFormData.escrowId || disputeFormData.escrowId.trim() === '') {
      toast.error('Escrow ID is required');
      return false;
    }
    if (!disputeFormData.payerWallet || disputeFormData.payerWallet.trim() === '') {
      toast.error('Payer XRP Wallet Address is required');
      return false;
    }
    if (!disputeFormData.counterpartyWallet || disputeFormData.counterpartyWallet.trim() === '') {
      toast.error('Counterparty XRP Wallet Address is required');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!disputeTermsData.disputeReason || disputeTermsData.disputeReason.trim() === '') {
      toast.error('Dispute Reason is required');
      return false;
    }
    if (!disputeTermsData.amountInDispute || parseFloat(disputeTermsData.amountInDispute) <= 0) {
      toast.error('Amount in Dispute must be greater than 0');
      return false;
    }
    if (!disputeTermsData.disputeDescription || disputeTermsData.disputeDescription.trim() === '') {
      toast.error('Dispute Description is required');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    // Final validation - check all required fields
    if (!validateStep1() || !validateStep2()) {
      return false;
    }
    return true;
  };


  // Reset form when modal closes
  useEffect(() => {
    if (!showCreateDisputeModal) {
      setDisputeCurrentStep(1);
      setSelectedDisputeType('Freelancing');
      setDisputeFormData({
        escrowId: '',
        payerWallet: '',
        payerEmail: '',
        payerName: '',
        payerPhone: '',
        counterpartyWallet: '',
        counterpartyEmail: '',
        counterpartyName: '',
        counterpartyPhone: ''
      });
      setDisputeTermsData({
        disputeCategory: 'Quality Issue',
        disputeReason: '',
        disputeDescription: '',
        amountInDispute: '',
        currency: 'XRP',
        disputeResolutionPeriod: '',
        evidenceDescription: '',
        expectedResolutionDate: ''
      });
      // Cleanup evidence images
      setEvidenceImages(prevImages => {
        prevImages.forEach(image => {
          URL.revokeObjectURL(image.preview);
        });
        return [];
      });
    }
  }, [showCreateDisputeModal]);

  // Clear email validation when modal closes
  useEffect(() => {
    if (!showCreateDisputeModal) {
      setPayerEmailValidation({ isValid: null, message: '', isValidating: false });
      setCounterpartyEmailValidation({ isValid: null, message: '', isValidating: false });
      // Clear any pending timeouts
      if (validationTimeouts.payer) clearTimeout(validationTimeouts.payer);
      if (validationTimeouts.counterparty) clearTimeout(validationTimeouts.counterparty);
      setValidationTimeouts({ payer: null, counterparty: null });
    }
  }, [showCreateDisputeModal]);

  const totalPages = 78;

  // KPI fallback (unauthenticated / session expired)
  useEffect(() => {
    if (isSessionExpired) {
      setSummaryMetrics({
        totalDisputes: null,
        activeDisputes: null,
        resolvedDisputes: null,
        avgResolutionTimeSeconds: null,
        totalChangePercent: null,
        activeChangePercent: null,
        resolvedChangePercent: null,
        avgResolutionTimeChangePercent: null
      });
    }
  }, [isSessionExpired]);

  // Dispute list fallback (unauthenticated / session expired)
  useEffect(() => {
    if (isSessionExpired) {
      setDisputeData([]);
    }
  }, [isSessionExpired]);

  // Fetch dispute summary (top cards)
  useEffect(() => {
    let cancelled = false;

    const fetchSummary = async () => {
      if (isSessionExpired) return;
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const data = await getDisputeSummary({ token, month: monthParam });
        const metrics = data?.metrics;
        if (!cancelled && metrics) {
          setSummaryMetrics((prev) => ({ ...prev, ...metrics }));
        }
      } catch (error) {
        console.error('Error fetching dispute summary:', error);
      }
    };

    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, [isSessionExpired, monthParam]);

  // Fetch disputes list (table)
  useEffect(() => {
    let cancelled = false;

    const fetchList = async () => {
      if (isSessionExpired) return;
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const data = await getDisputes({
          token,
          status: statusParam,
          month: monthParam,
          page: currentPage,
          pageSize: itemsPerPage
        });

        const disputes = Array.isArray(data?.disputes) ? data.disputes : [];
        const mapped = disputes.map((d) => ({
          id: (d?.caseId || '').replace(/^#/, '') || '—',
          apiId: d?.id,
          parties: {
            from: d?.initiatorName || '—',
            to: d?.respondentName || '—'
          },
          amount: {
            xrp: formatXrpAmount(d?.amount?.xrp),
            usd: formatUsdAmount(d?.amount?.usd)
          },
          status: titleCaseStatus(d?.status),
          reason: d?.reason || '—',
          duration: formatDurationSeconds(d?.durationSeconds)
        }));

        if (!cancelled) {
          setDisputeData(mapped);
        }
      } catch (error) {
        console.error('Error fetching disputes list:', error);
        if (!cancelled) {
          setDisputeData([]);
        }
      }
    };

    fetchList();
    return () => {
      cancelled = true;
    };
  }, [isSessionExpired, monthParam, statusParam, currentPage, itemsPerPage]);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isSessionExpired) {
        setUserFullName('Sarah Chen');
        setUserInitials('SC');
        setUserRole('Personal Account');
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
            const role = data.role || data.userRole || 'Personal Account';
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

  return (
    <>
      {/* Mobile Header */}
      <PersonalSuiteMobileHeader
        variant="personal"
        className="transactions-mobile-header"
        personalVerificationComplete={kycComplete}
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
              {sidebarNav.map((item) => {
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
          <p className="sidebar-section-label">Main Menu</p>
          <nav className="sidebar-nav">
            {sidebarNav.map((item) => {
              const Icon = item.icon;
              const isActive = (item.label === 'Dashboard' && location.pathname === '/dashboard') ||
                               (item.label === 'My Escrow' && location.pathname === '/my-escrow') ||
                               (item.label === 'Transactions' && location.pathname === '/transactions') ||
                               (item.label === 'Dispute' && location.pathname === '/dispute') ||
                               (item.label === 'Savings' && location.pathname === '/savings') ||
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
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick()}
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
              <>
                <div className="header-trustiscore-box" role="status" aria-label={`TrustiScore ${trustiscoreBadgeText}`}>
                  <span className="header-trustiscore-label">TrustiScore</span>
                  <span className="header-trustiscore-value">{trustiscoreBadgeText}</span>
                </div>
                <div className="account-type-display">
                  <span className="account-type-label">{accountType}</span>
                </div>
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
              <div className="user-avatar">
                {userAvatar ? (
                  <img src={userAvatar} alt={userFullName} className="user-avatar-img" />
                ) : (
                  userInitials
                )}
                <HeaderProfileVerifyBadge show={kycComplete} />
              </div>
            </div>
          </div>
        </header>

        <div className="dispute-content">
          {/* Breadcrumb */}
          <div className="card-breadcrumb">
            <span className="breadcrumb-root">General</span>
            <span className="breadcrumb-divider">›</span>
            <span className="breadcrumb-current">Dashboard</span>
          </div>

          {/* Header Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <button type="button" className="create-escrow-btn" onClick={() => setShowCreateDisputeModal(true)}>
              <Plus size={18} />
              Create Dispute
            </button>
          </div>

          {/* Summary Cards */}
          <div className="dispute-summary-cards">
            <div className="dispute-summary-card">
              <div className="dispute-card-indicator"></div>
              <div className="dispute-card-content">
                <div className="dispute-card-title-row">
                  <span className="dispute-card-title">Total Dispute</span>
                  <div className="dispute-card-change-badge positive">
                    <TrendingUp size={12} />
                    <span>{formatPercent(summaryMetrics.totalChangePercent)}</span>
                  </div>
                </div>
                <div className="dispute-card-value">{summaryMetrics.totalDisputes ?? 'N/A'}</div>
                <div className="dispute-card-dropdown">
                  <span>This Monthly</span>
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            <div className="dispute-summary-card">
              <div className="dispute-card-indicator"></div>
              <div className="dispute-card-content">
                <div className="dispute-card-title-row">
                  <span className="dispute-card-title">Active Dispute</span>
                  <div className="dispute-card-change-badge positive">
                    <TrendingUp size={12} />
                    <span>{formatPercent(summaryMetrics.activeChangePercent)}</span>
                  </div>
                </div>
                <div className="dispute-card-value">{summaryMetrics.activeDisputes ?? 'N/A'}</div>
                <div className="dispute-card-dropdown">
                  <span>This Monthly</span>
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            <div className="dispute-summary-card">
              <div className="dispute-card-indicator"></div>
              <div className="dispute-card-content">
                <div className="dispute-card-title-row">
                  <span className="dispute-card-title">Resolved Dispute</span>
                  <div className="dispute-card-change-badge positive">
                    <TrendingUp size={12} />
                    <span>{formatPercent(summaryMetrics.resolvedChangePercent)}</span>
                  </div>
                </div>
                <div className="dispute-card-value">{summaryMetrics.resolvedDisputes ?? 'N/A'}</div>
                <div className="dispute-card-dropdown">
                  <span>This Monthly</span>
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            <div className="dispute-summary-card">
              <div className="dispute-card-indicator"></div>
              <div className="dispute-card-content">
                <div className="dispute-card-title-row">
                  <span className="dispute-card-title">Avg Resolution Time</span>
                </div>
                <div
                  className={`dispute-card-value${avgResolutionParts.unit ? ' dispute-card-value--split' : ''}`}
                >
                  <span className="dispute-card-value-main">{avgResolutionParts.main}</span>
                  {avgResolutionParts.unit ? (
                    <span className="dispute-card-value-unit">{avgResolutionParts.unit}</span>
                  ) : null}
                </div>
                <div className="dispute-card-dropdown">
                  <span>This Monthly</span>
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="dispute-filters">
            <div className="dispute-filter-dropdown">
              <span>{selectedFilter}</span>
              <ChevronDown size={16} />
            </div>
            <div className="dispute-month-filter-wrapper" ref={monthDropdownRef}>
              <button
                type="button"
                className={`dispute-month-filter ${isMonthDropdownOpen ? 'open' : ''}`}
                onClick={toggleMonthDropdown}
                aria-haspopup="listbox"
                aria-expanded={isMonthDropdownOpen}
              >
                <Calendar size={16} />
                <span>{selectedMonth}</span>
                <ChevronDown size={14} className={`month-filter-chevron ${isMonthDropdownOpen ? 'rotated' : ''}`} />
              </button>
              {isMonthDropdownOpen && (
                <div className="dispute-month-dropdown" role="listbox">
                  {MONTH_OPTIONS.map((month) => (
                    <button
                      key={month}
                      type="button"
                      className={`dispute-month-dropdown-item ${selectedMonth === month ? 'active' : ''}`}
                      onClick={() => handleMonthSelect(month)}
                      role="option"
                      aria-selected={selectedMonth === month}
                    >
                      <span>{month}</span>
                      {selectedMonth === month && <CheckCircle size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dispute History Section - Mobile */}
          <div className="mobile-dispute-history-section">
            <div className="mobile-dispute-history-header">
              <div className="mobile-dispute-history-title-wrapper">
                <div className="mobile-section-indicator"></div>
                <h3 className="mobile-dispute-history-title">Dispute History</h3>
              </div>
              <div className="mobile-dispute-history-actions">
                <button type="button" className="mobile-dispute-history-icon-btn">
                  <ChevronDown size={18} />
                </button>
                <div className="mobile-month-filter-wrapper" ref={mobileMonthDropdownRef}>
                  <button 
                    type="button" 
                    className={`mobile-dispute-history-icon-btn ${isMobileMonthDropdownOpen ? 'active' : ''}`}
                    onClick={toggleMobileMonthDropdown}
                    aria-haspopup="listbox"
                    aria-expanded={isMobileMonthDropdownOpen}
                  >
                    <Calendar size={18} />
                  </button>
                  {isMobileMonthDropdownOpen && (
                    <div className="mobile-dispute-month-dropdown" role="listbox">
                      {MONTH_OPTIONS.map((month) => (
                        <button
                          key={month}
                          type="button"
                          className={`mobile-dispute-month-dropdown-item ${selectedMonth === month ? 'active' : ''}`}
                          onClick={() => handleMonthSelect(month)}
                          role="option"
                          aria-selected={selectedMonth === month}
                        >
                          <span>{month}</span>
                          {selectedMonth === month && <CheckCircle size={14} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mobile-dispute-history-cards">
              {Array.isArray(disputeData) && disputeData.length > 0 ? (
                disputeData.map((dispute, index) => (
                  <div 
                    key={index} 
                    className="mobile-dispute-history-card"
                    onClick={() => navigate(`/dispute/${dispute.apiId || dispute.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="mobile-dispute-history-row">
                      <div className="mobile-dispute-history-parties">
                        <span className="mobile-dispute-party-from">{dispute.parties.from}</span>
                        <ArrowRight size={14} className="mobile-dispute-party-arrow" />
                        <span className="mobile-dispute-party-to">{dispute.parties.to}</span>
                      </div>
                      <div className="mobile-dispute-history-amount">
                        {dispute.amount.xrp} XRP ≈ {dispute.amount.usd}
                      </div>
                    </div>
                    <div className="mobile-dispute-history-row">
                      <div className="mobile-dispute-history-reason">{dispute.reason}</div>
                      <span className={`mobile-dispute-status mobile-dispute-status-${dispute.status.toLowerCase()}`}>
                        {dispute.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  N/A
                </div>
              )}
            </div>
          </div>

          {/* Dispute Table - Desktop */}
          <div className="dispute-table-wrapper">
            {/* Header Row */}
            <div className="dispute-table-header">
              <div className="dispute-table-cell">Case ID</div>
              <div className="dispute-table-cell">Parties</div>
              <div className="dispute-table-cell">Amount</div>
              <div className="dispute-table-cell">Status</div>
              <div className="dispute-table-cell">Reason</div>
              <div className="dispute-table-cell">Duration</div>
            </div>
            {/* Data Rows */}
            {Array.isArray(disputeData) && disputeData.length > 0 ? (
              disputeData.map((dispute, index) => (
                <div key={index} className="dispute-table-row">
                  <div className="dispute-table-cell dispute-case-id">#{dispute.id}</div>
                  <div className="dispute-table-cell dispute-parties">
                    <span className="party-link">{dispute.parties.from}</span>
                    <ArrowRight size={14} className="party-arrow" />
                    <span>{dispute.parties.to}</span>
                  </div>
                  <div className="dispute-table-cell dispute-amount">
                    <div className="amount-primary">{dispute.amount.xrp} XRP</div>
                    <div className="amount-secondary">≈ {dispute.amount.usd}</div>
                  </div>
                  <div className="dispute-table-cell">
                    <span className="dispute-status pending">{dispute.status}</span>
                  </div>
                  <div className="dispute-table-cell dispute-reason">{dispute.reason}</div>
                  <div className="dispute-table-cell dispute-duration">
                    <span>{dispute.duration}</span>
                    <button 
                      type="button" 
                      className="dispute-action-btn"
                      onClick={() => navigate(`/dispute/${dispute.apiId || dispute.id}`)}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                N/A
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="dispute-pagination">
            <button 
              type="button" 
              className="pagination-nav-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 10))}
              disabled={currentPage <= 1}
            >
              <ArrowLeft size={16} />
              <span>Prev 10</span>
            </button>
            <div className="pagination-pages">
              <button 
                type="button" 
                className={`pagination-page-btn ${currentPage === 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(1)}
              >
                1
              </button>
              <span className="pagination-ellipsis">...</span>
              {Array.from({ length: 10 }, (_, i) => i + 11).map(page => (
                <button
                  key={page}
                  type="button"
                  className={`pagination-page-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <span className="pagination-ellipsis">...</span>
              <button 
                type="button" 
                className={`pagination-page-btn ${currentPage === totalPages ? 'active' : ''}`}
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </button>
            </div>
            <button 
              type="button" 
              className="pagination-nav-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 10))}
              disabled={currentPage >= totalPages}
            >
              <span>Next 10</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </main>
    </div>

      {/* Create Dispute Modal */}
      {showCreateDisputeModal && (
        <div className="create-escrow-modal-overlay" onClick={() => setShowCreateDisputeModal(false)}>
          <div className="create-escrow-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header - Mobile with back icon */}
            <div className="create-escrow-modal-header">
              <div className="modal-header-back-icon"></div>
              <h2>Create Dispute</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowCreateDisputeModal(false)}>
                <X size={24} />
              </button>
            </div>

            {/* Step Indicator - Mobile Card Style */}
            <div className="create-escrow-steps-mobile">
              {disputeCurrentStep === 1 && (
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
              {disputeCurrentStep === 2 && (
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
              {disputeCurrentStep === 3 && (
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
              <div className={`step-indicator ${disputeCurrentStep === 1 ? 'active' : disputeCurrentStep > 1 ? 'completed' : ''}`}>
                <div className="step-icon">
                  {disputeCurrentStep > 1 ? <CheckCircle size={20} /> : <CreditCard size={20} />}
                </div>
                <div className="step-content">
                  <span className="step-number">Step 1/3</span>
                  <span className="step-title">Type/ Counterparty</span>
                </div>
              </div>
              <div className="step-divider"></div>
              <div className={`step-indicator ${disputeCurrentStep === 2 ? 'active' : disputeCurrentStep > 2 ? 'completed' : ''}`}>
                <div className="step-icon">
                  {disputeCurrentStep > 2 ? <CheckCircle size={20} /> : <FileText size={20} />}
                </div>
                <div className="step-content">
                  <span className="step-number">Step 2/3</span>
                  <span className="step-title">Terms</span>
                </div>
              </div>
              <div className="step-divider"></div>
              <div className={`step-indicator ${disputeCurrentStep === 3 ? 'active' : ''}`}>
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
              {disputeCurrentStep === 1 && (
                <>
                  {/* Dispute Type Section - Horizontal buttons */}
                  <div className="escrow-form-section">
                    <h3 className="section-title">Dispute Type</h3>
                    <div className="escrow-type-buttons">
                      <button
                        type="button"
                        className={`escrow-type-btn ${selectedDisputeType === 'Freelancing' ? 'active' : ''}`}
                        onClick={() => setSelectedDisputeType('Freelancing')}
                      >
                        {selectedDisputeType === 'Freelancing' && <CheckCircle size={18} />}
                        {selectedDisputeType !== 'Freelancing' && <Plus size={18} />}
                        Freelancing
                      </button>
                      <button
                        type="button"
                        className={`escrow-type-btn ${selectedDisputeType === 'Real Estate' ? 'active' : ''}`}
                        onClick={() => setSelectedDisputeType('Real Estate')}
                      >
                        {selectedDisputeType === 'Real Estate' ? <CheckCircle size={18} /> : <Plus size={18} />}
                        Real Estate
                      </button>
                      <button
                        type="button"
                        className={`escrow-type-btn ${selectedDisputeType === 'Product purchase' ? 'active' : ''}`}
                        onClick={() => setSelectedDisputeType('Product purchase')}
                      >
                        {selectedDisputeType === 'Product purchase' ? <CheckCircle size={18} /> : <Plus size={18} />}
                        Product purchase
                      </button>
                      <button
                        type="button"
                        className={`escrow-type-btn ${selectedDisputeType === 'Custom' ? 'active' : ''}`}
                        onClick={() => setSelectedDisputeType('Custom')}
                      >
                        {selectedDisputeType === 'Custom' ? <CheckCircle size={18} /> : <Plus size={18} />}
                        Custom
                      </button>
                    </div>
                  </div>

                  {/* Escrow ID Section */}
                  <div className="escrow-form-section">
                    <h3 className="section-title">Escrow ID</h3>
                    <div className="form-group">
                      <label>Escrow ID <span className="required">*</span></label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Enter or paste escrow ID"
                          value={disputeFormData.escrowId}
                          onChange={(e) => setDisputeFormData({ ...disputeFormData, escrowId: e.target.value })}
                        />
                        {isFetchingEscrowParties && (
                          <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#6b7280' }}>
                            Loading…
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        Details auto-fill as you enter the escrow ID (after a short pause).
                      </p>
                    </div>
                  </div>

                  {/* Dispute Counterparty Section */}
                  <div className="escrow-form-section">
                    <h3 className="section-title">Dispute Counterparty</h3>
                    <div className="counterparty-form-grid">
                      {/* Left Column - Payer's Information */}
                      <div className="form-column">
                        <div className="form-group">
                          <label>Payers (You) XRP Wallet Address <span className="required">*</span></label>
                          <input
                            type="text"
                            placeholder="••••••••••••••••"
                            value={disputeFormData.payerWallet}
                            onChange={(e) => setDisputeFormData({ ...disputeFormData, payerWallet: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Your Email</label>
                          <input
                            type="email"
                            placeholder="Enter your Email"
                            value={disputeFormData.payerEmail}
                            onChange={(e) => {
                              const email = e.target.value;
                              setDisputeFormData({ ...disputeFormData, payerEmail: email });
                              
                              // Clear previous timeout
                              if (validationTimeouts.payer) {
                                clearTimeout(validationTimeouts.payer);
                              }
                              
                              // Debounce validation (500ms delay)
                              const timeout = setTimeout(() => {
                                validatePayerEmail(email);
                              }, 500);
                              
                              setValidationTimeouts(prev => ({ ...prev, payer: timeout }));
                            }}
                            style={{
                              borderColor: payerEmailValidation.isValid === true ? '#10b981' : 
                                         payerEmailValidation.isValid === false ? '#ef4444' : undefined
                            }}
                          />
                          {payerEmailValidation.message && (
                            <div style={{
                              fontSize: '0.75rem',
                              marginTop: '0.25rem',
                              color: payerEmailValidation.isValid === true ? '#10b981' : 
                                     payerEmailValidation.isValid === false ? '#ef4444' : '#6b7280'
                            }}>
                              {payerEmailValidation.message}
                            </div>
                          )}
                        </div>
                        <div className="form-group">
                          <label>Counterparty XRP Wallet Address <span className="required">*</span></label>
                          <input
                            type="text"
                            placeholder="••••••••••••••••"
                            value={disputeFormData.counterpartyWallet}
                            onChange={(e) => setDisputeFormData({ ...disputeFormData, counterpartyWallet: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Counterparty Email</label>
                          <input
                            type="email"
                            placeholder="Enter counterparty Email"
                            value={disputeFormData.counterpartyEmail}
                            onChange={(e) => {
                              const email = e.target.value;
                              setDisputeFormData({ ...disputeFormData, counterpartyEmail: email });
                              
                              // Clear previous timeout
                              if (validationTimeouts.counterparty) {
                                clearTimeout(validationTimeouts.counterparty);
                              }
                              
                              // Debounce validation (500ms delay)
                              const timeout = setTimeout(() => {
                                validateCounterpartyEmail(email);
                              }, 500);
                              
                              setValidationTimeouts(prev => ({ ...prev, counterparty: timeout }));
                            }}
                            style={{
                              borderColor: counterpartyEmailValidation.isValid === true ? '#10b981' : 
                                         counterpartyEmailValidation.isValid === false ? '#ef4444' : undefined
                            }}
                          />
                          {counterpartyEmailValidation.message && (
                            <div style={{
                              fontSize: '0.75rem',
                              marginTop: '0.25rem',
                              color: counterpartyEmailValidation.isValid === true ? '#10b981' : 
                                     counterpartyEmailValidation.isValid === false ? '#ef4444' : '#6b7280'
                            }}>
                              {counterpartyEmailValidation.message}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Column - Names and Phone Numbers */}
                      <div className="form-column">
                        <div className="form-group">
                          <label>Your Name</label>
                          <input
                            type="text"
                            placeholder="Enter your name"
                            value={disputeFormData.payerName}
                            onChange={(e) => setDisputeFormData({ ...disputeFormData, payerName: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Your Phone Number</label>
                          <input
                            type="tel"
                            placeholder="Enter your Number"
                            value={disputeFormData.payerPhone}
                            onChange={(e) => setDisputeFormData({ ...disputeFormData, payerPhone: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Name</label>
                          <input
                            type="text"
                            placeholder="Enter your name"
                            value={disputeFormData.counterpartyName}
                            onChange={(e) => setDisputeFormData({ ...disputeFormData, counterpartyName: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Phone Number</label>
                          <input
                            type="tel"
                            placeholder="Enter your Number"
                            value={disputeFormData.counterpartyPhone}
                            onChange={(e) => setDisputeFormData({ ...disputeFormData, counterpartyPhone: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {disputeCurrentStep === 2 && (
                <>
                  {/* Dispute Details Section */}
                  <div className="escrow-form-section">
                    <h3 className="section-title">Dispute Details</h3>
                    
                    {/* Dispute Category Buttons */}
                    <div className="release-type-buttons">
                      <button
                        type="button"
                        className={`release-type-btn ${disputeTermsData.disputeCategory === 'Quality Issue' ? 'active' : ''}`}
                        onClick={() => setDisputeTermsData({ ...disputeTermsData, disputeCategory: 'Quality Issue' })}
                      >
                        <FileCheck size={18} />
                        Quality Issue
                      </button>
                      <button
                        type="button"
                        className={`release-type-btn ${disputeTermsData.disputeCategory === 'Delivery Delay' ? 'active' : ''}`}
                        onClick={() => setDisputeTermsData({ ...disputeTermsData, disputeCategory: 'Delivery Delay' })}
                      >
                        <Clock size={18} />
                        Delivery Delay
                      </button>
                      <button
                        type="button"
                        className={`release-type-btn ${disputeTermsData.disputeCategory === 'Payment Dispute' ? 'active' : ''}`}
                        onClick={() => setDisputeTermsData({ ...disputeTermsData, disputeCategory: 'Payment Dispute' })}
                      >
                        <DollarSign size={18} />
                        Payment Dispute
                      </button>
                    </div>

                    {/* Dispute Form Fields */}
                    <div className="terms-form-grid">
                      <div className="form-group">
                        <label>Dispute Reason <span className="required">*</span></label>
                        <input
                          type="text"
                          placeholder="Enter dispute reason"
                          value={disputeTermsData.disputeReason}
                          onChange={(e) => setDisputeTermsData({ ...disputeTermsData, disputeReason: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Amount in Dispute <span className="required">*</span></label>
                        <input
                          type="text"
                          placeholder="Enter amount"
                          value={disputeTermsData.amountInDispute}
                          onChange={(e) => setDisputeTermsData({ ...disputeTermsData, amountInDispute: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Dispute Resolution Period</label>
                        <div className="select-input-wrapper">
                          <select
                            value={disputeTermsData.disputeResolutionPeriod}
                            onChange={(e) => setDisputeTermsData({ ...disputeTermsData, disputeResolutionPeriod: e.target.value })}
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
                        <label>Expected Resolution Date</label>
                        <div className="date-input-wrapper">
                          <input
                            type="text"
                            placeholder="Add Date"
                            value={disputeTermsData.expectedResolutionDate}
                            onChange={(e) => setDisputeTermsData({ ...disputeTermsData, expectedResolutionDate: e.target.value })}
                          />
                          <Calendar size={18} className="input-icon" />
                        </div>
                      </div>

                      <div className="form-group form-group-full">
                        <label>Dispute Description <span className="required">*</span></label>
                        <textarea
                          placeholder="Describe the dispute in detail"
                          value={disputeTermsData.disputeDescription}
                          onChange={(e) => setDisputeTermsData({ ...disputeTermsData, disputeDescription: e.target.value })}
                          rows={4}
                        ></textarea>
                      </div>

                      <div className="form-group form-group-full">
                        <label>Evidence/Supporting Documents</label>
                        <div 
                          className={`evidence-upload-area ${isDragging ? 'dragging' : ''}`}
                          onClick={() => document.getElementById('evidence-upload-input').click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <Upload size={32} className="upload-icon" />
                          <p className="upload-placeholder">Drop or import your files here...</p>
                          <input
                            type="file"
                            id="evidence-upload-input"
                            accept="*/*"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleFileInputChange}
                          />
                        </div>
                        {evidenceImages.length > 0 && (
                          <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {evidenceImages.map((image, index) => (
                              <div key={index} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50, #f9fafb)' }}>
                                {image.preview ? (
                                  <img 
                                    src={image.preview} 
                                    alt={image.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div style={{ padding: '0.5rem', textAlign: 'center' }}>
                                    <FileText size={24} color="var(--text-muted, #666)" />
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #666)', marginTop: '0.25rem', wordBreak: 'break-word' }}>
                                      {image.name.length > 15 ? image.name.substring(0, 12) + '...' : image.name}
                                    </div>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeEvidenceImage(index);
                                  }}
                                  style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    background: 'rgba(0, 0, 0, 0.6)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'white'
                                  }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {disputeCurrentStep === 3 && (
                <>
                  {/* Dispute Type and Category Section - Side by Side */}
                  <div className="escrow-form-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Dispute Type Section */}
                    <div>
                      <h3 className="section-title">Dispute Type</h3>
                      <div className="escrow-type-buttons">
                        <button
                          type="button"
                          className="escrow-type-btn active"
                          disabled
                        >
                          <CheckCircle size={18} />
                          {selectedDisputeType}
                        </button>
                      </div>
                    </div>

                    {/* Dispute Category Section */}
                    <div>
                      <h3 className="section-title">Dispute Category</h3>
                      <div className="release-type-buttons">
                        <button
                          type="button"
                          className="release-type-btn active"
                          disabled
                        >
                        {disputeTermsData.disputeCategory === 'Quality Issue' && <FileCheck size={18} />}
                        {disputeTermsData.disputeCategory === 'Delivery Delay' && <Clock size={18} />}
                        {disputeTermsData.disputeCategory === 'Payment Dispute' && <DollarSign size={18} />}
                        {disputeTermsData.disputeCategory}
                      </button>
                    </div>
                  </div>
                </div>

                  {/* Dispute Counterparty Section */}
                  <div className="escrow-form-section" style={{ marginTop: 0 }}>
                    <h3 className="section-title">Dispute Counterparty</h3>
                    <div className="counterparty-form-grid">
                      {/* Left Column - Counterparty Information */}
                      <div className="form-column">
                        <div className="form-group">
                          <label>Counterparty XRP Wallet Address <span className="required">*</span></label>
                          <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                            {disputeFormData.counterpartyWallet || '—'}
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Email</label>
                          <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                            {disputeFormData.counterpartyEmail || '—'}
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Names and Phone Numbers */}
                      <div className="form-column">
                        <div className="form-group">
                          <label>Name</label>
                          <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                            {disputeFormData.counterpartyName || '—'}
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Phone Number</label>
                          <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                            {disputeFormData.counterpartyPhone || '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dispute Details Section */}
                  <div className="escrow-form-section">
                    <h3 className="section-title">Dispute Details</h3>
                    <div className="terms-form-grid">
                      <div className="form-group">
                        <label>Dispute Reason</label>
                        <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                          {disputeTermsData.disputeReason || '—'}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Amount in Dispute</label>
                        <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                          {disputeTermsData.amountInDispute ? `${disputeTermsData.amountInDispute} XRP` : '—'}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Dispute Resolution Period</label>
                        <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                          {disputeTermsData.disputeResolutionPeriod ? `${disputeTermsData.disputeResolutionPeriod} days` : '—'}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Expected Resolution Date</label>
                        <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                          {disputeTermsData.expectedResolutionDate || '—'}
                        </div>
                      </div>

                      <div className="form-group form-group-full">
                        <label>Dispute Description</label>
                        <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                          {disputeTermsData.disputeDescription || '—'}
                        </div>
                      </div>

                      <div className="form-group form-group-full">
                        <label>Evidence/Supporting Documents</label>
                        {evidenceImages.length > 0 ? (
                          <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {evidenceImages.map((image, index) => (
                              <div key={index} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50, #f9fafb)' }}>
                                {image.preview ? (
                                  <img 
                                    src={image.preview} 
                                    alt={image.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div style={{ padding: '0.5rem', textAlign: 'center' }}>
                                    <FileText size={20} color="var(--text-muted, #666)" />
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted, #666)', marginTop: '0.25rem', wordBreak: 'break-word' }}>
                                      {image.name.length > 12 ? image.name.substring(0, 10) + '...' : image.name}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                            No files uploaded
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {disputeCurrentStep === 1 && (
              <div className="create-escrow-modal-footer">
                <button
                  type="button"
                  className="submit-next-btn"
                  onClick={() => {
                    if (validateStep1()) {
                      setDisputeCurrentStep(2);
                    }
                  }}
                >
                  <div className="submit-btn-icon-circle">
                    <ArrowRight size={16} />
                  </div>
                  <span>Submit and Next</span>
                </button>
              </div>
            )}

            {disputeCurrentStep === 2 && (
              <div className="create-escrow-modal-footer">
                <button
                  type="button"
                  className="previous-btn"
                  onClick={() => setDisputeCurrentStep(1)}
                >
                  <div className="previous-btn-icon-circle">
                    <ArrowLeft size={16} />
                  </div>
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="submit-next-btn"
                  onClick={() => {
                    if (validateStep2()) {
                      setDisputeCurrentStep(3);
                    }
                  }}
                >
                  <div className="submit-btn-icon-circle">
                    <ArrowRight size={16} />
                  </div>
                  <span>Submit and Next</span>
                </button>
              </div>
            )}

            {disputeCurrentStep === 3 && (
              <div className="create-escrow-modal-footer">
                <button
                  type="button"
                  className="previous-btn"
                  onClick={() => setDisputeCurrentStep(2)}
                >
                  <div className="previous-btn-icon-circle">
                    <ArrowLeft size={16} />
                  </div>
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="submit-next-btn"
                  onClick={async () => {
                    console.log('Create dispute button clicked');
                    
                    if (!validateStep3()) {
                      console.log('Step 3 validation failed');
                      return;
                    }

                    console.log('Starting dispute creation process');
                    setIsCreatingDispute(true);
                    const token = localStorage.getItem('token');

                    if (!token) {
                      toast.error('Please login to create a dispute');
                      setIsCreatingDispute(false);
                      return;
                    }

                    try {
                      // Upload all evidence files first
                      const evidenceArray = [];
                      if (evidenceImages.length > 0) {
                        toast.loading('Uploading evidence files...', { id: 'upload-evidence' });
                        for (const image of evidenceImages) {
                          try {
                            const uploadedFile = await uploadEvidenceFile(image.file);
                            evidenceArray.push(uploadedFile);
                          } catch (error) {
                            console.error('Error uploading file:', error);
                            toast.error(`Failed to upload ${image.name}: ${error.message}`, { id: 'upload-evidence' });
                            setIsCreatingDispute(false);
                            return;
                          }
                        }
                        toast.success('Evidence files uploaded successfully', { id: 'upload-evidence' });
                      }

                      // Format expected resolution date if provided
                      let formattedExpectedDate = undefined;
                      if (disputeTermsData.expectedResolutionDate && disputeTermsData.expectedResolutionDate.trim() !== '') {
                        try {
                          // Try to parse the date - handles various formats
                          const date = new Date(disputeTermsData.expectedResolutionDate);
                          if (!isNaN(date.getTime())) {
                            // Convert to ISO 8601 format
                            formattedExpectedDate = date.toISOString();
                          } else {
                            console.warn('Invalid date format, skipping expectedResolutionDate');
                          }
                        } catch (error) {
                          console.warn('Error parsing date, skipping expectedResolutionDate:', error);
                        }
                      }

                      // Build API request body
                      const requestBody = {
                        escrowId: disputeFormData.escrowId.trim(),
                        disputeCategory: mapDisputeCategory(selectedDisputeType),
                        disputeReasonType: mapDisputeReasonType(disputeTermsData.disputeCategory),
                        payerXrpWalletAddress: disputeFormData.payerWallet.trim(),
                        payerName: disputeFormData.payerName?.trim() || undefined,
                        payerEmail: disputeFormData.payerEmail?.trim() || undefined,
                        payerPhone: disputeFormData.payerPhone?.trim() || undefined,
                        respondentXrpWalletAddress: disputeFormData.counterpartyWallet.trim(),
                        respondentName: disputeFormData.counterpartyName?.trim() || undefined,
                        respondentEmail: disputeFormData.counterpartyEmail?.trim() || undefined,
                        respondentPhone: disputeFormData.counterpartyPhone?.trim() || undefined,
                        disputeReason: disputeTermsData.disputeReason.trim(),
                        amount: parseFloat(disputeTermsData.amountInDispute),
                        currency: disputeTermsData.currency || 'XRP',
                        resolutionPeriod: formatResolutionPeriod(disputeTermsData.disputeResolutionPeriod),
                        expectedResolutionDate: formattedExpectedDate,
                        description: disputeTermsData.disputeDescription.trim(),
                        evidence: evidenceArray.length > 0 ? evidenceArray : undefined
                      };

                      // Remove undefined fields
                      Object.keys(requestBody).forEach(key => {
                        if (requestBody[key] === undefined) {
                          delete requestBody[key];
                        }
                      });

                      toast.loading('Creating dispute...', { id: 'create-dispute' });

                      console.log('Creating dispute with request body:', requestBody);
                      console.log('API URL:', getApiUrl('api/disputes'));

                      // Make API call
                      const response = await fetch(getApiUrl('api/disputes'), {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                      });

                      console.log('API Response status:', response.status);
                      const result = await response.json();
                      console.log('API Response body:', result);

                      if (!response.ok || !result.success) {
                        const errorMessage = result.message || result.error || 'Failed to create dispute';
                        
                        // Handle specific error cases
                        if (response.status === 400) {
                          if (errorMessage.includes('wallet not found') || errorMessage.includes('Wallet not found')) {
                            toast.error('Respondent wallet not found. The respondent must have a registered wallet.', { id: 'create-dispute' });
                          } else if (errorMessage.includes('access') || errorMessage.includes('Access denied')) {
                            toast.error('You do not have access to this escrow', { id: 'create-dispute' });
                          } else if (errorMessage.includes('required') || errorMessage.includes('Required')) {
                            toast.error(errorMessage, { id: 'create-dispute' });
                          } else {
                            toast.error(errorMessage, { id: 'create-dispute' });
                          }
                        } else if (response.status === 401) {
                          toast.error('Authentication required. Please login again.', { id: 'create-dispute' });
                          // Optionally redirect to login
                        } else {
                          toast.error(errorMessage, { id: 'create-dispute' });
                        }
                        
                        setIsCreatingDispute(false);
                        return;
                      }

                      // Success
                      console.log('Create dispute response:', result);
                      toast.success('Dispute created successfully', { id: 'create-dispute' });
                      
                      // Close modal and reset form
                      setShowCreateDisputeModal(false);
                      
                      // Navigate to dispute detail if caseId is returned
                      if (result.data?.disputeId || result.data?.caseId) {
                        const disputeId = result.data.disputeId || result.data.caseId;
                        setTimeout(() => {
                          navigate(`/dispute/${disputeId}`);
                        }, 500);
                      } else {
                        // Refresh disputes list
                        window.location.reload();
                      }
                    } catch (error) {
                      console.error('Error creating dispute:', error);
                      toast.error(error.message || 'An error occurred while creating the dispute. Please try again.', { id: 'create-dispute' });
                      setIsCreatingDispute(false);
                    }
                  }}
                  disabled={isCreatingDispute}
                >
                  <div className="submit-btn-icon-circle">
                    {isCreatingDispute ? (
                      <div className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}></div>
                    ) : (
                      <CheckCircle size={16} />
                    )}
                  </div>
                  <span>{isCreatingDispute ? 'Creating...' : 'Confirm'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <NotificationCenterModal
        open={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        titleId="dispute-notifications-title"
      />
    </>
  );
};

export default Dispute;
