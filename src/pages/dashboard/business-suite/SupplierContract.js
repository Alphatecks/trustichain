import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Briefcase,
  Settings,
  Search,
  Bell,
  ArrowRight,
  Eye,
  EyeOff,
  ChevronDown,
  Plus,
  DollarSign,
  Building2,
  Users,
  FileCheck,
  Code,
  Box,
  Link,
  HelpCircle,
  LogOut,
  X,
  Menu,
  Wallet,
  ChevronRight,
  FileText,
  ArrowDown,
  ArrowRight as ArrowRightIcon,
  Filter,
  ShoppingCart,
  Package,
  Monitor,
  Info,
  Calendar,
  Check,
  Upload,
  AlertCircle,
  Activity,
  Repeat,
  Copy
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './SupplierContract.css';
import logo from '../../../assets/images/icons/logo.png';
import LoadingIndicator from '../../../components/LoadingIndicator';
import HeaderProfileVerifyBadge from '../../../components/HeaderProfileVerifyBadge';
import HeaderProfileAvatarNav from '../../../components/HeaderProfileAvatarNav';
import { getApiUrl } from '../../../utils/config';
import toast from 'react-hot-toast';
import { handleLogout } from '../../../utils/logout';
import FundSupplyAccountModal from '../../../components/FundSupplyAccountModal';
import { useTrustiscore, formatTrustiscoreBadgeText } from '../../../context/TrustiscoreContext';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s) => typeof s === 'string' && UUID_REGEX.test(s.trim());

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, badge: null },
  { label: 'Payroll', icon: DollarSign, badge: null },
  { label: 'Supplier Contract', icon: Building2, badge: null },
  { label: 'Invoice', icon: FileText, badge: null },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta' }
];

const developersNav = [
  { label: 'Api Keys', icon: Code, badge: null },
  { label: 'Sand box enviroment', icon: Box, badge: null },
  { label: 'Web hook', icon: Link, badge: null }
];

const supportNav = [
  { label: 'Settings', icon: Settings },
  { label: 'Security', icon: ShieldCheck }
];

const SupplierIdPanel = ({ supplierId, isLoading }) => {
  const displayId = supplierId?.trim() || '—';

  const handleCopy = async () => {
    if (!supplierId?.trim()) return;
    try {
      await navigator.clipboard.writeText(supplierId.trim());
      toast.success('Supplier ID copied');
    } catch {
      toast.error('Could not copy Supplier ID');
    }
  };

  return (
    <div className="supplier-id-panel">
      <div className="supplier-id-panel-head">
        <span className="supplier-id-accent" aria-hidden />
        <h4 className="supplier-id-title">Supplier ID</h4>
      </div>
      <div className="supplier-id-field">
        <span className="supplier-id-value">
          {isLoading ? <LoadingIndicator size="sm" /> : displayId}
        </span>
        <button
          type="button"
          className="supplier-id-copy-btn"
          onClick={handleCopy}
          disabled={!supplierId?.trim() || isLoading}
          aria-label="Copy Supplier ID"
        >
          <Copy size={18} />
        </button>
      </div>
    </div>
  );
};

const SupplierContract = ({
  dashboardData,
  isLoadingDashboard,
  exchangeRates,
  isLoadingRates,
  walletBalances,
  isLoadingWalletBalances,
  userFullName,
  userInitials,
  userRole,
  userAvatar,
  isLoadingUserProfile,
  showBalance,
  setShowBalance,
  showNotificationModal,
  setShowNotificationModal,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  hasWallet,
  isLoadingWalletAddress = false,
  setShowWalletModal,
  handleCreateWallet,
  setShowFundWalletModal,
  setShowFundSupplyAccountModal,
  setShowWithdrawWalletModal,
  setShowWithdrawModal,
  setShowCreateNewSupplierModal,
  accountType,
  setAccountType,
  setIsSwitchingAccountType,
  setSwitchMessage,
  businessKycComplete,
  businessCompanyName,
  businessCompanyLogoUrl,
  businessSupplierId = '',
  isLoadingBusinessKyc,
  navigate,
  location,
  getBalanceValue,
  getExchangeRate,
  totalEscrowedAmount,
  isLoadingTotalEscrowed,
  supplyContractOverview = null,
  isLoadingSupplyContractOverview = false,
  supplierDetails = [],
  isLoadingSupplierDetails = false,
  supplyContractsForSupplier = [],
  isLoadingSupplyContractsForSupplier = false,
  supplyContractsForContractor = [],
  isLoadingSupplyContractsForContractor = false,
  supplierTransactions = [],
  isLoadingSupplierTransactions = false,
  supplierTransactionsPagination = {},
  onTransactionPageChange,
  transactionHistoryMonth = '',
  onTransactionMonthChange,
  transactionHistoryStatus = '',
  onTransactionStatusChange,
  onRefetchSupplyContractsForSupplier,
  onRefetchSupplyContractsForContractor
}) => {
  const { score: trustiscoreScore, isLoading: isTrustiscoreLoading } = useTrustiscore();
  const trustiscoreBadgeText = formatTrustiscoreBadgeText(trustiscoreScore, isTrustiscoreLoading);
  const [transactionFilter, setTransactionFilter] = useState(transactionHistoryStatus ? 'Successful' : 'All');
  const [showViewSupplyStatusModal, setShowViewSupplyStatusModal] = useState(false);
  const [releasingContractId, setReleasingContractId] = useState(null);
  const [monthlyFilter, setMonthlyFilter] = useState('Monthly');
  const { page: transactionPage = 1, totalPages: transactionTotalPages = 0 } = supplierTransactionsPagination;
  const [fundSupplyAmount, setFundSupplyAmount] = useState('');
  const [showFundSupplyAccountModalMobile, setShowFundSupplyAccountModalMobile] = useState(false);
  const [showWithdrawSupplyAccountModalMobile, setShowWithdrawSupplyAccountModalMobile] = useState(false);
  const [withdrawSupplyAmount, setWithdrawSupplyAmount] = useState('');
  const [withdrawWalletType, setWithdrawWalletType] = useState('USD wallet');
  const [showCreateNewSupplierModalMobile, setShowCreateNewSupplierModalMobile] = useState(false);
  const [newSupplierStep, setNewSupplierStep] = useState(1);
  const [showSupplierDetailsModalMobile, setShowSupplierDetailsModalMobile] = useState(false);
  const [supplierDetailModalSource, setSupplierDetailModalSource] = useState(null); // 'supplier-details' | 'escrowed-to-you'
  const [selectedSupplierDetail, setSelectedSupplierDetail] = useState(null);
  const [selectedEscrowId, setSelectedEscrowId] = useState(null); // escrow UUID when opening from "Supply contracts escrowed to you"
  const [escrowedToMeDetail, setEscrowedToMeDetail] = useState(null); // GET supply-contracts/escrowed-to-me/:id response data
  const [escrowedToMeDetailLoading, setEscrowedToMeDetailLoading] = useState(false);
  const [escrowedToMeDetailError, setEscrowedToMeDetailError] = useState(null);
  const [createdByMeDetail, setCreatedByMeDetail] = useState(null); // GET supply-contracts/created-by-me/:id response data
  const [createdByMeDetailLoading, setCreatedByMeDetailLoading] = useState(false);
  const [createdByMeDetailError, setCreatedByMeDetailError] = useState(null);
  const [contractEvidenceFiles, setContractEvidenceFiles] = useState([]);
  const [supplierDetailUploadedFiles, setSupplierDetailUploadedFiles] = useState([]); // uploads in supplier-details modal
  const [isUploadingSupplierDocs, setIsUploadingSupplierDocs] = useState(false);
  const [proofOfCompletionFiles, setProofOfCompletionFiles] = useState([]); // { name, url }[] for escrowed-to-you modal
  const [isUploadingProofOfCompletion, setIsUploadingProofOfCompletion] = useState(false);
  const [contractFundsReleased, setContractFundsReleased] = useState(false);
  const [isMarkingDelivered, setIsMarkingDelivered] = useState(false);
  const [isRequestingBuyerConfirmation, setIsRequestingBuyerConfirmation] = useState(false);
  const [showViewSupplyContractModal, setShowViewSupplyContractModal] = useState(false);
  const supplierDetailsSectionRef = useRef(null);
  const escrowUploadInputRef = useRef(null);
  const [newSupplierForm, setNewSupplierForm] = useState({
    supplierName: '',
    dueDate: '',
    amount: '',
    accountType: 'bank',
    walletType: '',
    walletAddress: '',
    currency: '',
    bankName: '',
    accountNumber: ''
  });

  const transactions = useMemo(() => {
    return supplierTransactions.map((t) => {
      const amountXrp = Number(t.amountXrp ?? 0);
      const amountUsd = Number(t.amountUsd ?? 0);
      const amountStr = `+${amountXrp} XRP ($${amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)`;
      let dateStr = '—';
      if (t.createdAt) {
        try {
          const d = new Date(t.createdAt);
          dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (_) {}
      }
      return {
        id: t.id,
        transactionId: t.transactionId ?? t.id ?? '—',
        supplierName: t.supplierName ?? '—',
        type: t.type ?? 'Received',
        amount: amountStr,
        amountXrp,
        amountUsd,
        status: t.status ?? '—',
        date: dateStr,
      };
    });
  }, [supplierTransactions]);

  /** Delivered = delivery marked or status indicates released/completed. Uses API deliveryMarkedAt and status. */
  const isSupplyDelivered = (item) => {
    if (item?.deliveryMarkedAt != null && item.deliveryMarkedAt !== '') return true;
    const s = (item?.status || item?.deliveryStatus || '').toLowerCase();
    return ['released', 'completed', 'delivered', 'funds_released'].includes(s);
  };

  // Fetch supply contract detail when modal is opened from "Supply contracts escrowed to you" list (backend may expect UUID; prefer escrowId from list)
  useEffect(() => {
    if (!showSupplierDetailsModalMobile || supplierDetailModalSource !== 'escrowed-to-you' || !selectedEscrowId) {
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setEscrowedToMeDetailError('Please sign in');
      setEscrowedToMeDetailLoading(false);
      return;
    }
    let cancelled = false;
    setEscrowedToMeDetailLoading(true);
    setEscrowedToMeDetailError(null);
    setEscrowedToMeDetail(null);
    fetch(getApiUrl(`api/business-suite/supply-contracts/escrowed-to-me/${selectedEscrowId}`), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(async (res) => {
        const result = await res.json().catch(() => ({}));
        return { res, result };
      })
      .then(({ res, result }) => {
        console.log('Supply contract detail API response', { status: res?.status, ok: res?.ok, result });
        if (cancelled) return;
        if (res.ok && result?.success && result?.data) {
          setEscrowedToMeDetail(result.data);
          setEscrowedToMeDetailError(null);
        } else {
          setEscrowedToMeDetail(null);
          setEscrowedToMeDetailError(result?.message || (res?.status === 404 ? 'Contract not found' : 'Failed to load contract'));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setEscrowedToMeDetail(null);
          setEscrowedToMeDetailError(err?.message || 'Failed to load contract');
        }
      })
      .finally(() => {
        if (!cancelled) setEscrowedToMeDetailLoading(false);
      });
    return () => { cancelled = true; };
  }, [showSupplierDetailsModalMobile, supplierDetailModalSource, selectedEscrowId]);

  // Fetch contractor (created-by-me) supply contract detail when modal is opened from supplier details list (prefer escrowId/UUID to avoid backend "invalid input syntax for type uuid")
  useEffect(() => {
    if (!showSupplierDetailsModalMobile || supplierDetailModalSource !== 'supplier-details' || !selectedSupplierDetail?.id) {
      return;
    }
    const contractOrEscrowId = selectedSupplierDetail.escrowId || selectedSupplierDetail.id;
    const token = localStorage.getItem('token');
    if (!token) {
      setCreatedByMeDetailError('Please sign in');
      setCreatedByMeDetailLoading(false);
      return;
    }
    let cancelled = false;
    setCreatedByMeDetailLoading(true);
    setCreatedByMeDetailError(null);
    setCreatedByMeDetail(null);
    fetch(getApiUrl(`api/business-suite/supply-contracts/created-by-me/${contractOrEscrowId}`), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(async (res) => {
        const result = await res.json().catch(() => ({}));
        return { res, result };
      })
      .then(({ res, result }) => {
        if (cancelled) return;
        if (res.ok && result?.success && result?.data) {
          setCreatedByMeDetail(result.data);
          setCreatedByMeDetailError(null);
        } else {
          setCreatedByMeDetail(null);
          setCreatedByMeDetailError(result?.message || (res?.status === 404 ? 'Contract not found' : 'Failed to load contract'));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setCreatedByMeDetail(null);
          setCreatedByMeDetailError(err?.message || 'Failed to load contract');
        }
      })
      .finally(() => {
        if (!cancelled) setCreatedByMeDetailLoading(false);
      });
    return () => { cancelled = true; };
  }, [showSupplierDetailsModalMobile, supplierDetailModalSource, selectedSupplierDetail?.id]);

  /** Upload a file and return its URL (uses disputes evidence upload endpoint). */
  const uploadFileToGetUrl = async (file) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Please sign in');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(getApiUrl('api/disputes/evidence/upload'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result?.success) throw new Error(result?.message || result?.error || 'Upload failed');
    return result?.data?.fileUrl || result?.data?.url || result?.fileUrl || '';
  };

  /** PATCH supply contract documents (created-by-me) with an array of document URLs. */
  const patchSupplyContractDocuments = async (contractId, contractDocumentUrls) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Please sign in');
    const res = await fetch(getApiUrl(`api/business-suite/supply-contracts/created-by-me/${contractId}/documents`), {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractDocumentUrls }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result?.success) throw new Error(result?.message || result?.error || 'Failed to save documents');
    return result;
  };

  const handleUploadDocumentsForSupplier = async (files, isSupplierDetailsModal) => {
    const contractId = supplierDetailModalSource === 'escrowed-to-you'
      ? (escrowedToMeDetail?.escrowId || (isUuid(selectedEscrowId) ? selectedEscrowId : null))
      : (createdByMeDetail?.escrowId || createdByMeDetail?.contractId || selectedSupplierDetail?.escrowId || selectedSupplierDetail?.id);
    if (!contractId) {
      toast.error('Contract not found');
      return;
    }
    if (!files?.length) return;
    setIsUploadingSupplierDocs(true);
    try {
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFileToGetUrl(files[i]);
        if (url) urls.push(url);
      }
      if (urls.length === 0) {
        toast.error('No files could be uploaded');
        return;
      }
      await patchSupplyContractDocuments(contractId, urls);
      const names = Array.from(files).map((f) => f.name);
      if (isSupplierDetailsModal) {
        setSupplierDetailUploadedFiles((prev) => [...prev, ...names]);
      } else {
        setContractEvidenceFiles((prev) => [...prev, ...names]);
      }
      toast.success('Documents uploaded successfully');
    } catch (e) {
      toast.error(e?.message || 'Upload failed');
    } finally {
      setIsUploadingSupplierDocs(false);
    }
  };

  /** Upload proof of contract completion (escrowed-to-me detail modal). Uses POST multipart; open docs via signed-url to avoid Bucket not found. Backend expects UUID. */
  const handleUploadProofOfCompletion = async (files) => {
    const escrowId = escrowedToMeDetail?.escrowId || (isUuid(selectedEscrowId) ? selectedEscrowId : null);
    if (!escrowId || !files?.length) return;
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in');
      return;
    }
    setIsUploadingProofOfCompletion(true);
    try {
      const uploaded = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('document', files[i]);
        const res = await fetch(getApiUrl(`api/business-suite/supply-contracts/escrowed-to-me/${escrowId}/documents/upload-completion`), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const result = await res.json().catch(() => ({}));
        if (res.ok && result?.success && result?.data?.fileUrl) {
          uploaded.push({ name: files[i].name, url: result.data.fileUrl });
        } else {
          toast.error(result?.message || result?.error || `Failed to upload ${files[i].name}`);
        }
      }
      if (uploaded.length > 0) {
        setProofOfCompletionFiles((prev) => [...prev, ...uploaded]);
        toast.success(uploaded.length === 1 ? 'Proof of completion uploaded' : `${uploaded.length} documents uploaded`);
      }
    } catch (e) {
      toast.error(e?.message || 'Upload failed');
    } finally {
      setIsUploadingProofOfCompletion(false);
    }
  };

  /** Open a stored document URL via signed-url API to avoid 404 Bucket not found. */
  const openDocumentWithSignedUrl = async (storedUrl) => {
    if (!storedUrl || typeof storedUrl !== 'string') return;
    const trimmed = storedUrl.trim();
    if (!trimmed) return;
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in');
      return;
    }
    const tryUrl = async (urlParam) => {
      console.log('Signed URL API request – url param:', urlParam);
      const res = await fetch(
        getApiUrl(`api/business-suite/supply-contracts/documents/signed-url?url=${encodeURIComponent(urlParam)}`),
        { method: 'GET', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      return res.json().catch(() => ({}));
    };
    try {
      let result = await tryUrl(trimmed);
      if (result?.success && result?.data?.signedUrl) {
        window.open(result.data.signedUrl);
        return;
      }
      const msg = result?.message || result?.error || '';
      const invalidUrl = /invalid.*document.*url/i.test(msg);
      if (invalidUrl && /^https?:\/\//i.test(trimmed)) {
        const pathAfterPublic = /\/object\/public\/(.+)$/i.exec(trimmed)?.[1];
        const storagePath = pathAfterPublic || (() => { try { return new URL(trimmed).pathname.replace(/^\//, ''); } catch { return null; } })();
        if (storagePath) {
          result = await tryUrl(storagePath);
          if (result?.success && result?.data?.signedUrl) {
            window.open(result.data.signedUrl);
            return;
          }
        }
      }
      toast.error(result?.message || result?.error || 'Could not open document');
    } catch (e) {
      toast.error(e?.message || 'Could not open document');
    }
  };

  const handleReleaseSupplyContract = async (item) => {
    const escrowId = item.escrowId || item.contractId || item.id;
    if (!escrowId) {
      toast.error('Escrow ID missing');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in');
      return;
    }
    setReleasingContractId(escrowId);
    try {
      const res = await fetch(getApiUrl(`api/business-suite/supply-contracts/escrowed-to-me/${escrowId}/release`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: '' }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result?.success) {
        toast.error(result?.message || result?.error || 'Release failed');
        return;
      }
      toast.success('Funds released successfully');
      setShowViewSupplyStatusModal(false);
      if (typeof onRefetchSupplyContractsForContractor === 'function') {
        onRefetchSupplyContractsForContractor();
      }
    } catch (e) {
      toast.error(e?.message || 'Release failed');
    } finally {
      setReleasingContractId(null);
    }
  };

  /** Refetch escrowed-to-me detail (e.g. after mark-delivered / request-buyer-confirmation). */
  const refetchEscrowedToMeDetail = async () => {
    if (!selectedEscrowId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(getApiUrl(`api/business-suite/supply-contracts/escrowed-to-me/${selectedEscrowId}`), {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result?.success && result?.data) {
        setEscrowedToMeDetail(result.data);
      }
    } catch (_) {}
  };

  const handleMarkDelivered = async () => {
    const id = escrowedToMeDetail?.escrowId || (isUuid(selectedEscrowId) ? selectedEscrowId : null);
    if (!id) {
      toast.error('Contract not found');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in');
      return;
    }
    setIsMarkingDelivered(true);
    try {
      const res = await fetch(getApiUrl(`api/business-suite/supply-contracts/escrowed-to-me/${id}/mark-delivered`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result?.success) {
        toast.success(result?.message || 'Contract marked as delivered');
        await refetchEscrowedToMeDetail();
      } else {
        toast.error(result?.message || result?.error || 'Failed to mark as delivered');
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to mark as delivered');
    } finally {
      setIsMarkingDelivered(false);
    }
  };

  const handleRequestBuyerConfirmation = async () => {
    const id = escrowedToMeDetail?.escrowId || (isUuid(selectedEscrowId) ? selectedEscrowId : null);
    if (!id) {
      toast.error('Contract not found');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in');
      return;
    }
    setIsRequestingBuyerConfirmation(true);
    try {
      const res = await fetch(getApiUrl(`api/business-suite/supply-contracts/escrowed-to-me/${id}/request-buyer-confirmation`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result?.success) {
        toast.success(result?.message || 'Buyer confirmation requested');
        await refetchEscrowedToMeDetail();
      } else {
        toast.error(result?.message || result?.error || 'Failed to request buyer confirmation');
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to request buyer confirmation');
    } finally {
      setIsRequestingBuyerConfirmation(false);
    }
  };

  return (
    <>
      {/* Mobile Dashboard */}
      <div className="mobile-dashboard">
        {/* Mobile Header */}
        <div className="mobile-dashboard-header">
          <div className="mobile-header-left">
            <HeaderProfileAvatarNav variant="mobile">
              {accountType === 'Business Suite' ? (
                businessCompanyLogoUrl ? (
                  <img src={businessCompanyLogoUrl} alt={businessCompanyName || 'Business'} />
                ) : isLoadingBusinessKyc ? (
                  <LoadingIndicator size="sm" />
                ) : (
                  businessCompanyName ? businessCompanyName.charAt(0).toUpperCase() : '—'
                )
              ) : userAvatar ? (
                <img src={userAvatar} alt={userFullName} />
              ) : (
                userInitials
              )}
              <HeaderProfileVerifyBadge show={accountType === 'Business Suite' ? businessKycComplete : true} mobile />
            </HeaderProfileAvatarNav>
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
                  setSwitchMessage('switching to personal');
                  setIsSwitchingAccountType(true);
                  setTimeout(() => {
                    setAccountType('Personal');
                    setIsSwitchingAccountType(false);
                    setSwitchMessage('');
                  }, 2000);
                }}
              >
                <div className="account-chip-text">
                  <span className="account-label">Account</span>
                  <span className="account-type">Business Suite</span>
                </div>
                <span className="account-chip-icon">
                  <ChevronRight size={14} />
                </span>
              </button>
            </div>

            <div className="mobile-sidebar-section">
              <p className="mobile-sidebar-section-label">Business Suite</p>
              <nav className="mobile-sidebar-nav">
                {businessSuiteNav.map((item) => {
                  const Icon = item.icon;
                  const isDisabled = !businessKycComplete;
                  const isActive = (item.label === 'Dashboard' && location.pathname === '/dashboard') ||
                                   (item.label === 'Payroll' && location.pathname === '/payroll') ||
                                   (item.label === 'Supplier Contract' && location.pathname === '/supplier-contract') ||
                                   (item.label === 'Invoice' && location.pathname === '/invoice') ||
                                   (item.label === 'Transactions' && location.pathname === '/transactions') ||
                                   (item.label === 'Dispute' && (location.pathname === '/business-dispute' || location.pathname.startsWith('/business-dispute/')));
                  const handleNavClick = () => {
                    if (isDisabled) return;
                    setIsMobileMenuOpen(false);
                    if (item.label === 'Dashboard') {
                      navigate('/dashboard', { state: { accountType: 'Business Suite' } });
                    } else if (item.label === 'Payroll') {
                      navigate('/payroll');
                    } else if (item.label === 'Supplier Contract') {
                      navigate('/supplier-contract');
                    } else if (item.label === 'Invoice') {
                      navigate('/invoice');
                    } else if (item.label === 'Transactions') {
                      navigate('/transactions', { state: { accountType: 'Business Suite' } });
                    } else if (item.label === 'Dispute') {
                      navigate('/business-dispute');
                    } else if (item.label === 'Compliance') {
                      toast('Compliance workspace coming soon');
                    }
                  };
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`mobile-sidebar-nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                      onClick={handleNavClick}
                      disabled={isDisabled}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                      {item.badge && <span className="mobile-sidebar-badge">{item.badge}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="mobile-sidebar-section">
              <p className="mobile-sidebar-section-label">Developers Tool</p>
              <nav className="mobile-sidebar-nav">
                {developersNav.map((item) => {
                  const Icon = item.icon;
                  const isDisabled = !businessKycComplete;
                  return (
                    <button 
                      key={item.label} 
                      type="button" 
                      className={`mobile-sidebar-nav-item ${isDisabled ? 'disabled' : ''}`}
                      onClick={() => {
                        if (!isDisabled) setIsMobileMenuOpen(false);
                      }}
                      disabled={isDisabled}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
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

            <div className="mobile-sidebar-section">
              <p className="mobile-sidebar-section-label">Wallet</p>
              <nav className="mobile-sidebar-nav">
                <button
                  type="button"
                  className="mobile-sidebar-nav-item"
                  onClick={() => {
                    if (isLoadingWalletAddress) return;
                    setIsMobileMenuOpen(false);
                    if (hasWallet) {
                      setShowWalletModal(true);
                    } else {
                      handleCreateWallet();
                    }
                  }}
                  disabled={isLoadingWalletAddress}
                >
                  <span>{isLoadingWalletAddress ? 'Loading...' : hasWallet ? 'View wallet' : 'Create wallet'}</span>
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
                <span className="mobile-sidebar-trustiscore-label">Active Supplier</span>
                <span className="mobile-sidebar-trustiscore-badge">
                  {trustiscoreBadgeText}
                </span>
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

        {/* Mobile Supplier Contract Content */}
        <div className="supplier-contract-mobile-content">
          {/* Total Supply Amount Card - Mobile */}
          <div className="total-supply-stack-mobile">
          <div className="supplier-total-supply-card-mobile">
            <div className="supplier-total-supply-header-mobile">
              <div className="supplier-total-supply-header-left-mobile">
                <div className="supplier-total-supply-icon-mobile">
                  <Wallet size={18} />
                </div>
                <h3 className="supplier-total-supply-title-mobile">Business suite Balance</h3>
              </div>
              <button 
                type="button" 
                className="supplier-total-supply-eye-mobile"
                onClick={() => setShowBalance(!showBalance)}
              >
                {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <div className="supplier-total-supply-amount-mobile">
              {showBalance 
                ? (isLoadingDashboard 
                    ? <LoadingIndicator size="sm" />
                    : (() => {
                        if (dashboardData?.balance?.xrp !== undefined && dashboardData?.balance?.xrp !== null && exchangeRates && exchangeRates.length > 0) {
                          const xrpToUsdRate = getExchangeRate('XRP', 'USD');
                          if (xrpToUsdRate) {
                            const usdValue = Number(dashboardData.balance.xrp) * Number(xrpToUsdRate);
                            return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          }
                        }
                        const usdBalance = getBalanceValue(dashboardData, 'usd');
                        if (usdBalance !== null && usdBalance !== undefined) {
                          return `$${Number(usdBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                        return isLoadingDashboard ? null : '$0.00';
                      })())
                : '••••••'}
            </div>
            <div className="supplier-total-supply-xrp-mobile">
              ≈ {dashboardData?.balance?.xrp !== undefined && dashboardData?.balance?.xrp !== null 
                  ? Number(dashboardData.balance.xrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : '0.00')} XRP
            </div>
            <div className="supplier-total-supply-actions-mobile">
              <button 
                type="button" 
                className="supplier-fund-wallet-btn-mobile"
                onClick={() => setShowFundSupplyAccountModalMobile(true)}
              >
                <Plus size={16} />
                <span>Fund Wallet</span>
              </button>
              <button
                type="button"
                className="supplier-withdraw-btn-mobile"
                onClick={() => {
                  if (typeof onRefetchSupplyContractsForContractor === 'function') onRefetchSupplyContractsForContractor();
                  setShowViewSupplyStatusModal(true);
                }}
              >
                <Activity size={16} />
                <span>View Supply status</span>
              </button>
            </div>
          </div>
          <SupplierIdPanel supplierId={businessSupplierId} isLoading={isLoadingBusinessKyc} />
          </div>

          {/* Supplier Cards - Horizontally Scrollable */}
          <div className="supplier-cards-scrollable-mobile">
            {/* Total Supplier Card - Mobile */}
            <div className="supplier-total-supplier-card-mobile">
              <div className="supplier-card-header-mobile">
                <div className="supplier-card-icon-mobile">
                  <Users size={20} />
                </div>
                <h3 className="supplier-card-title-mobile">Total supplier contracts</h3>
              </div>
              <div className="supplier-card-value-mobile">
                {supplyContractOverview?.totalSupplier !== undefined
                  ? supplyContractOverview.totalSupplier
                  : (isLoadingSupplyContractOverview ? <LoadingIndicator size="sm" /> : (dashboardData?.activeEscrows?.count !== undefined ? dashboardData.activeEscrows.count : 23))}
              </div>
              <div className="supplier-card-secondary-mobile">
                ${supplyContractOverview?.lockedUsd !== undefined
                  ? Number(supplyContractOverview.lockedUsd).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                  : (isLoadingSupplyContractOverview ? <LoadingIndicator size="sm" /> : (dashboardData?.activeEscrows?.lockedAmount !== undefined ? dashboardData.activeEscrows.lockedAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '156,789'))} locked
              </div>
              <button
                type="button"
                className="supplier-create-btn-mobile"
                onClick={() => setShowCreateNewSupplierModalMobile(true)}
              >
                <Plus size={16} />
                <span>Create Supplier Escrow</span>
              </button>
            </div>

            {/* Pending Supplier Card - Mobile */}
            <div className="supplier-pending-supplier-card-mobile">
              <div className="supplier-card-header-mobile">
                <div className="supplier-card-icon-mobile">
                  <Monitor size={20} />
                </div>
                <h3 className="supplier-card-title-mobile">Pending supplier</h3>
              </div>
              <div className="supplier-card-value-mobile">
                {supplyContractOverview?.pendingCount !== undefined
                  ? supplyContractOverview.pendingCount
                  : (isLoadingSupplyContractOverview ? <LoadingIndicator size="sm" /> : (dashboardData?.trustiscore?.score !== undefined ? dashboardData.trustiscore.score : 70))}
                {supplyContractOverview?.pendingTotal !== undefined ? <span className="supplier-card-ratio-mobile">/{supplyContractOverview.pendingTotal}</span> : <span className="supplier-card-ratio-mobile">/100</span>}
              </div>
              <div className="supplier-card-label-mobile">
                {supplyContractOverview?.tier !== undefined && supplyContractOverview.tier !== null && supplyContractOverview.tier !== ''
                  ? supplyContractOverview.tier
                  : (isLoadingSupplyContractOverview ? <LoadingIndicator size="sm" /> : (dashboardData?.trustiscore?.level !== undefined ? dashboardData.trustiscore.level : 'Platinum'))}
              </div>
            </div>

            {/* Total Supplier Amount Card - Mobile */}
            <div className="supplier-total-supplier-amount-card-mobile">
              <div className="supplier-card-header-mobile">
                <div className="supplier-card-icon-mobile">
                  <FileText size={20} />
                </div>
                <h3 className="supplier-card-title-mobile">Total Supplier Amount</h3>
              </div>
              <div className="supplier-card-value-mobile">
                ${supplyContractOverview?.totalSupplierAmount !== undefined
                  ? Number(supplyContractOverview.totalSupplierAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : (totalEscrowedAmount !== null && totalEscrowedAmount !== undefined
                    ? totalEscrowedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : (isLoadingSupplyContractOverview || isLoadingTotalEscrowed ? <LoadingIndicator size="sm" /> : '45,280'))}
              </div>
            </div>
          </div>

          {/* Upcoming Supply Section - Mobile */}
          <div className="upcoming-supply-section-mobile">
            <div className="upcoming-supply-header-mobile">
              <div className="upcoming-supply-title-wrapper-mobile">
                <div className="upcoming-supply-blue-accent-mobile"></div>
                <h2 className="upcoming-supply-title-mobile">Upcoming Supply</h2>
              </div>
              <button className="upcoming-supply-see-all-mobile">See All</button>
            </div>

            <div className="upcoming-supply-grid-mobile">
              {isLoadingSupplierDetails ? (
                <div className="upcoming-supply-loading-mobile" style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center' }}>
                  <LoadingIndicator size="sm" />
                  <span style={{ marginLeft: '0.5rem' }}>Loading suppliers…</span>
                </div>
              ) : supplierDetails.length === 0 ? (
                <div className="upcoming-supply-empty-mobile" style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No supplier details yet
                </div>
              ) : (
                supplierDetails.map((supplier, index) => (
                <div
                  key={index}
                  className="upcoming-supply-card-mobile"
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedSupplierDetail(supplier);
                    setShowSupplierDetailsModalMobile(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedSupplierDetail(supplier);
                      setShowSupplierDetailsModalMobile(true);
                    }
                  }}
                >
                  <div className="upcoming-supply-progress-circle-mobile">
                    <svg className="upcoming-supply-progress-ring-mobile" width="60" height="60">
                      <circle
                        className="upcoming-supply-progress-ring-background-mobile"
                        cx="30"
                        cy="30"
                        r="25"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="4"
                      />
                      <circle
                        className="upcoming-supply-progress-ring-progress-mobile"
                        cx="30"
                        cy="30"
                        r="25"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 25}`}
                        strokeDashoffset={`${2 * Math.PI * 25 * (1 - supplier.progress / 100)}`}
                        transform="rotate(-90 30 30)"
                      />
                    </svg>
                    <span className="upcoming-supply-progress-text-mobile">{supplier.progress}%</span>
                  </div>
                  <div className="upcoming-supply-id-mobile">
                    {supplier.supplierBusinessName || supplier.supplierName || supplier.contractName || `#${supplier.id}`}
                  </div>
                  {supplier.dueDate && (
                    <div className="upcoming-supply-due-date-mobile">Due date: {supplier.dueDate}</div>
                  )}
                  {supplier.percentage && (
                    <div className="upcoming-supply-percentage-mobile">{supplier.percentage}</div>
                  )}
                  <div className="upcoming-supply-amount-section-mobile">
                    <div className="upcoming-supply-amount-label-mobile">Amount</div>
                    <div className="upcoming-supply-amount-value-mobile">{supplier.amount}</div>
                  </div>
                </div>
              ))
              )}
            </div>
          </div>

          {/* Transaction History Section - Mobile */}
          <div className="supplier-transaction-history-section-mobile">
            <div className="supplier-transaction-history-header-mobile">
              <div className="supplier-transaction-history-title-wrapper-mobile">
                <div className="supplier-transaction-history-blue-accent-mobile"></div>
                <h2 className="supplier-transaction-history-title-mobile">Supplier transaction history</h2>
              </div>
              <button className="supplier-transaction-history-arrow-mobile">
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="supplier-transaction-history-list-mobile">
              {isLoadingSupplierTransactions ? (
                <div className="supplier-transaction-loading-mobile">
                  <LoadingIndicator size="sm" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="supplier-transaction-empty-mobile">No transactions yet</div>
              ) : (
                transactions.slice(0, 4).map((transaction) => (
                  <div key={transaction.id} className="supplier-transaction-item-mobile">
                    <div className="supplier-transaction-icon-mobile">
                      <ArrowDown size={16} />
                    </div>
                    <div className="supplier-transaction-content-mobile">
                      <div className="supplier-transaction-type-mobile">{transaction.type}</div>
                      <div className="supplier-transaction-description-mobile">
                        You received {transaction.amountXrp} XRP, worth ${transaction.amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD.
                      </div>
                    </div>
                    <div className="supplier-transaction-right-mobile">
                      <div className="supplier-transaction-status-mobile">{transaction.status}</div>
                      <div className="supplier-transaction-date-mobile">{transaction.date}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Fund Supply Account Modal - Mobile */}
          {showFundSupplyAccountModalMobile && (
            <div className="fund-supply-account-modal-mobile">
              <div className="fund-supply-account-header-mobile">
                <div className="fund-supply-account-title-wrapper-mobile">
                  <div className="fund-supply-account-blue-accent-mobile"></div>
                  <h2 className="fund-supply-account-title-mobile">Fund supply account</h2>
                </div>
                <button
                  className="fund-supply-account-close-mobile"
                  onClick={() => setShowFundSupplyAccountModalMobile(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="fund-supply-account-content-mobile">
                <div className="fund-supply-account-amount-section-mobile">
                  <div className="fund-supply-account-amount-header-mobile">
                    <label className="fund-supply-account-amount-label-mobile">Amount</label>
                    <div className="fund-supply-account-currency-selector-mobile">
                      <img
                        src="https://cryptologos.cc/logos/xrp-xrp-logo.png"
                        alt="XRP"
                        className="fund-supply-account-currency-logo-mobile"
                      />
                      <span className="fund-supply-account-currency-text-mobile">XRP wallet</span>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  <input
                    type="text"
                    className="fund-supply-account-amount-input-mobile"
                    value={`$${fundSupplyAmount}`}
                    onChange={(e) => {
                      const value = e.target.value.replace('$', '').replace(/,/g, '');
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setFundSupplyAmount(value);
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value.replace('$', '').replace(/,/g, '');
                      if (value) {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          setFundSupplyAmount(numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                        }
                      }
                    }}
                    placeholder="$0.00"
                  />
                  <div className="fund-supply-account-balance-mobile">
                    Balance: {dashboardData?.balance?.usd != null
                      ? `$${Number(dashboardData.balance.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : (isLoadingDashboard ? '...' : '$0.00')}
                  </div>
                </div>

                <button className="fund-supply-account-button-mobile">
                  Fund
                </button>

                <div className="fund-supply-account-info-mobile">
                  <Info size={16} />
                  <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
                </div>
              </div>
            </div>
          )}

          {/* Withdraw Supply Account Modal - Mobile */}
          {showWithdrawSupplyAccountModalMobile && (
            <div className="withdraw-supply-account-modal-mobile">
              <div className="withdraw-supply-account-header-mobile">
                <div className="withdraw-supply-account-title-wrapper-mobile">
                  <div className="withdraw-supply-account-blue-accent-mobile"></div>
                  <h2 className="withdraw-supply-account-title-mobile">Withdraw</h2>
                </div>
                <button
                  className="withdraw-supply-account-close-mobile"
                  onClick={() => setShowWithdrawSupplyAccountModalMobile(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="withdraw-supply-account-content-mobile">
                <div className="withdraw-supply-account-amount-section-mobile">
                  <div className="withdraw-supply-account-amount-header-mobile">
                    <label className="withdraw-supply-account-amount-label-mobile">Amount</label>
                    <div className="withdraw-supply-account-currency-selector-mobile">
                      <img
                        src="https://cryptologos.cc/logos/xrp-xrp-logo.png"
                        alt="XRP"
                        className="withdraw-supply-account-currency-logo-mobile"
                      />
                      <span className="withdraw-supply-account-currency-text-mobile">XRP wallet</span>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  <input
                    type="text"
                    className="withdraw-supply-account-amount-input-mobile"
                    value={`$${withdrawSupplyAmount}`}
                    onChange={(e) => {
                      const value = e.target.value.replace('$', '').replace(/,/g, '');
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setWithdrawSupplyAmount(value);
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value.replace('$', '').replace(/,/g, '');
                      if (value) {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          setWithdrawSupplyAmount(numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                        }
                      }
                    }}
                    placeholder="$0.00"
                  />
                  <div className="withdraw-supply-account-balance-mobile">
                    Balance: {dashboardData?.balance?.usd != null
                      ? `$${Number(dashboardData.balance.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : (isLoadingDashboard ? '...' : '$0.00')}
                  </div>
                </div>

                <div className="withdraw-supply-account-wallet-type-section-mobile">
                  <label className="withdraw-supply-account-wallet-type-label-mobile">Wallet Type</label>
                  <div className="withdraw-supply-account-wallet-type-selector-mobile">
                    <span className="withdraw-supply-account-wallet-type-text-mobile">{withdrawWalletType}</span>
                    <ChevronDown size={16} />
                  </div>
                </div>

                <button className="withdraw-supply-account-button-mobile">
                  Withdraw
                </button>

                <div className="withdraw-supply-account-info-mobile">
                  <Info size={16} />
                  <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
                </div>
              </div>
            </div>
          )}

          {/* Create New Supplier Modal - Mobile */}
          {showCreateNewSupplierModalMobile && (
            <div className="create-new-supplier-modal-mobile">
              <div className="create-new-supplier-header-mobile">
                <div className="create-new-supplier-title-wrapper-mobile">
                  <div className="create-new-supplier-blue-accent-mobile"></div>
                  <h2 className="create-new-supplier-title-mobile">Create Supplier Escrow</h2>
                </div>
                <button
                  className="create-new-supplier-close-mobile"
                  onClick={() => {
                    setShowCreateNewSupplierModalMobile(false);
                    setNewSupplierStep(1);
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="create-new-supplier-content-mobile">
                {newSupplierStep === 1 && (
                  <>
                    <div className="create-new-supplier-field-mobile">
                      <label className="create-new-supplier-label-mobile">Supplier Name</label>
                      <input
                        type="text"
                        className="create-new-supplier-input-mobile"
                        placeholder="Enter name"
                        value={newSupplierForm.supplierName}
                        onChange={(e) => setNewSupplierForm({...newSupplierForm, supplierName: e.target.value})}
                      />
                    </div>

                    <div className="create-new-supplier-field-mobile">
                      <label className="create-new-supplier-label-mobile">Due Date</label>
                      <div className="create-new-supplier-input-wrapper-mobile">
                        <input
                          type="text"
                          className="create-new-supplier-input-mobile"
                          placeholder="00/00/00"
                          value={newSupplierForm.dueDate}
                          onChange={(e) => setNewSupplierForm({...newSupplierForm, dueDate: e.target.value})}
                        />
                        <Calendar size={18} className="create-new-supplier-input-icon-mobile" />
                      </div>
                    </div>

                    <div className="create-new-supplier-amount-section-mobile">
                      <label className="create-new-supplier-label-mobile">Amount</label>
                      <input
                        type="text"
                        className="create-new-supplier-amount-input-mobile"
                        value={`$${newSupplierForm.amount}`}
                        onChange={(e) => {
                          const value = e.target.value.replace('$', '').replace(/,/g, '');
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            setNewSupplierForm({...newSupplierForm, amount: value});
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.replace('$', '').replace(/,/g, '');
                          if (value) {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                              setNewSupplierForm({...newSupplierForm, amount: numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })});
                            }
                          }
                        }}
                        placeholder="$0.00"
                      />
                      <div className="create-new-supplier-balance-mobile">
                        Balance: {dashboardData?.balance?.usd != null
                          ? `$${Number(dashboardData.balance.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : (isLoadingDashboard ? '...' : '$0.00')}
                      </div>
                    </div>

                    <button 
                      className="create-new-supplier-button-mobile"
                      onClick={() => setNewSupplierStep(2)}
                    >
                      Next
                    </button>

                    <div className="create-new-supplier-info-mobile">
                      <Info size={16} />
                      <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
                    </div>
                  </>
                )}

                {newSupplierStep === 2 && (
                  <>
                    <div className="create-new-supplier-field-mobile">
                      <label className="create-new-supplier-account-type-label-mobile">Account Type</label>
                      <div className="create-new-supplier-account-type-buttons-mobile">
                        <button
                          type="button"
                          className={`create-new-supplier-account-type-btn-mobile ${newSupplierForm.accountType === 'bank' ? 'active' : ''}`}
                          onClick={() => setNewSupplierForm({...newSupplierForm, accountType: 'bank'})}
                        >
                          <Building2 size={18} />
                          <span>Bank Transfer</span>
                        </button>
                        <button
                          type="button"
                          className={`create-new-supplier-account-type-btn-mobile ${newSupplierForm.accountType === 'wallet' ? 'active' : ''}`}
                          onClick={() => setNewSupplierForm({...newSupplierForm, accountType: 'wallet'})}
                        >
                          <Wallet size={18} />
                          <span>Wallet Transfer</span>
                        </button>
                      </div>
                    </div>

                    {newSupplierForm.accountType === 'bank' ? (
                      <>
                        <div className="create-new-supplier-field-mobile">
                          <label className="create-new-supplier-label-mobile">Currency</label>
                          <div className="create-new-supplier-input-wrapper-mobile">
                            <input
                              type="text"
                              className="create-new-supplier-input-mobile"
                              placeholder="Select"
                              value={newSupplierForm.currency}
                              onChange={(e) => setNewSupplierForm({...newSupplierForm, currency: e.target.value})}
                            />
                            <ChevronDown size={18} className="create-new-supplier-input-icon-mobile" />
                          </div>
                        </div>

                        <div className="create-new-supplier-field-mobile">
                          <label className="create-new-supplier-label-mobile">Bank Name</label>
                          <div className="create-new-supplier-input-wrapper-mobile">
                            <input
                              type="text"
                              className="create-new-supplier-input-mobile"
                              placeholder="Select"
                              value={newSupplierForm.bankName}
                              onChange={(e) => setNewSupplierForm({...newSupplierForm, bankName: e.target.value})}
                            />
                            <ChevronDown size={18} className="create-new-supplier-input-icon-mobile" />
                          </div>
                        </div>

                        <div className="create-new-supplier-field-mobile">
                          <label className="create-new-supplier-label-mobile">Account Number</label>
                          <input
                            type="text"
                            className="create-new-supplier-input-mobile"
                            placeholder="Enter account name"
                            value={newSupplierForm.accountNumber}
                            onChange={(e) => setNewSupplierForm({...newSupplierForm, accountNumber: e.target.value})}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="create-new-supplier-field-mobile">
                          <label className="create-new-supplier-label-mobile">Wallet Type</label>
                          <div className="create-new-supplier-input-wrapper-mobile">
                            <input
                              type="text"
                              className="create-new-supplier-input-mobile"
                              placeholder="Select"
                              value={newSupplierForm.walletType}
                              onChange={(e) => setNewSupplierForm({...newSupplierForm, walletType: e.target.value})}
                            />
                            <ChevronDown size={18} className="create-new-supplier-input-icon-mobile" />
                          </div>
                        </div>

                        <div className="create-new-supplier-field-mobile">
                          <label className="create-new-supplier-label-mobile">Supplier Address</label>
                          <div className="create-new-supplier-input-wrapper-mobile">
                            <input
                              type="text"
                              className="create-new-supplier-input-mobile"
                              placeholder="Enter Supplier Address"
                              value={newSupplierForm.walletAddress}
                              onChange={(e) => setNewSupplierForm({...newSupplierForm, walletAddress: e.target.value})}
                            />
                            <ChevronDown size={18} className="create-new-supplier-input-icon-mobile" />
                          </div>
                        </div>
                      </>
                    )}

                    <button 
                      className="create-new-supplier-button-mobile"
                      onClick={() => {
                        setShowCreateNewSupplierModalMobile(false);
                        setNewSupplierStep(1);
                      }}
                    >
                      Done
                    </button>

                    <div className="create-new-supplier-info-mobile">
                      <Info size={16} />
                      <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Desktop Dashboard */}
      <div className="dashboard-content">
        {/* Breadcrumb */}
        <div className="card-breadcrumb">
          <span className="breadcrumb-root">Business Suite</span>
          <span className="breadcrumb-divider">›</span>
          <span className="breadcrumb-current">Supplier Contract</span>
        </div>

        {/* Summary Cards */}
        <div className="dashboard-summary-cards">
          {/* Total Supply Amount Card */}
          <div className="total-supply-stack">
          <div className="summary-card total-supply-amount-card">
            <div className="total-supply-header">
              <div className="total-supply-header-left">
                <div className="total-supply-icon-circle">
                  <Wallet size={16} />
                </div>
                <h3>Business suite Balance</h3>
              </div>
              <button 
                type="button" 
                className="total-supply-eye-toggle"
                onClick={() => setShowBalance(!showBalance)}
              >
                <div className="total-supply-icon-circle">
                  <Eye size={16} />
                </div>
              </button>
            </div>
            <div className="total-supply-amount-row">
              <div className="total-supply-main-amount">
                {showBalance 
                  ? (isLoadingDashboard 
                      ? <LoadingIndicator size="sm" />
                      : (() => {
                          if (dashboardData?.balance?.xrp !== undefined && dashboardData?.balance?.xrp !== null && exchangeRates && exchangeRates.length > 0) {
                            const xrpToUsdRate = getExchangeRate('XRP', 'USD');
                            if (xrpToUsdRate) {
                              const usdValue = Number(dashboardData.balance.xrp) * Number(xrpToUsdRate);
                              return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            }
                          }
                          const usdBalance = getBalanceValue(dashboardData, 'usd');
                          if (usdBalance !== null && usdBalance !== undefined) {
                            return `$${Number(usdBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          }
                          return isLoadingDashboard ? null : '$0.00';
                        })())
                  : '••••••'}
              </div>
              <div className="total-supply-xrp-amount">
                ≈ {dashboardData?.balance?.xrp !== undefined && dashboardData?.balance?.xrp !== null 
                    ? Number(dashboardData.balance.xrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                    : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : '0.00')} XRP
              </div>
            </div>
            <div className="total-supply-actions">
              <button
                type="button"
                className="total-supply-btn fund-btn"
                onClick={() => {
                  if (typeof onRefetchSupplyContractsForSupplier === 'function') onRefetchSupplyContractsForSupplier();
                  setShowViewSupplyContractModal(true);
                }}
              >
                <Eye size={16} />
                View New Supply Contract
              </button>
              <button
                type="button"
                className="total-supply-btn withdraw-btn"
                onClick={() => {
                if (typeof onRefetchSupplyContractsForContractor === 'function') onRefetchSupplyContractsForContractor();
                setShowViewSupplyStatusModal(true);
              }}
              >
                <Activity size={16} />
                <span>View Supply status</span>
              </button>
            </div>
          </div>
          <SupplierIdPanel supplierId={businessSupplierId} isLoading={isLoadingBusinessKyc} />
          </div>

          {/* Total Supplier Card */}
          <div className="summary-card total-supplier-card overview-card">
            <div className="overview-card-icon">
              <Users />
            </div>
            <h3 className="overview-card-title">Total supplier contracts</h3>
            <div className="overview-card-metrics">
              <span className="overview-card-main-value">
                {supplyContractOverview?.totalSupplier !== undefined
                  ? supplyContractOverview.totalSupplier
                  : (isLoadingSupplyContractOverview ? <LoadingIndicator size="sm" /> : (dashboardData?.activeEscrows?.count !== undefined ? dashboardData.activeEscrows.count : 23))}
              </span>
              <span className="overview-card-secondary-value">
                ${supplyContractOverview?.lockedUsd !== undefined
                  ? Number(supplyContractOverview.lockedUsd).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                  : (isLoadingSupplyContractOverview ? <LoadingIndicator size="sm" /> : (dashboardData?.activeEscrows?.lockedAmount !== undefined ? dashboardData.activeEscrows.lockedAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '156,789'))} locked
              </span>
            </div>
            <button
              type="button"
              className="overview-card-button"
              onClick={() => setShowCreateNewSupplierModal(true)}
            >
              <Plus size={16} />
              Create Supplier Escrow
            </button>
          </div>

          {/* Pending Supplier Card */}
          <div className="summary-card pending-supplier-card overview-card">
            <div className="overview-card-icon">
              <ShoppingCart />
            </div>
            <h3 className="overview-card-title">Pending supplier</h3>
            <div className="overview-card-metrics">
              <span className="overview-card-main-value">
                {supplyContractOverview?.pendingCount !== undefined
                  ? supplyContractOverview.pendingCount
                  : (isLoadingSupplyContractOverview ? <LoadingIndicator size="sm" /> : (dashboardData?.trustiscore?.score !== undefined ? dashboardData.trustiscore.score : 70))}
                {supplyContractOverview?.pendingTotal !== undefined ? <span className="overview-card-ratio">/{supplyContractOverview.pendingTotal}</span> : <span className="overview-card-ratio">/100</span>}
              </span>
            </div>
            <div className="overview-card-label">
              {supplyContractOverview?.tier !== undefined && supplyContractOverview.tier !== null && supplyContractOverview.tier !== ''
                ? supplyContractOverview.tier
                : (isLoadingSupplyContractOverview ? <LoadingIndicator size="sm" /> : (dashboardData?.trustiscore?.level !== undefined ? dashboardData.trustiscore.level : 'Platinum'))}
            </div>
          </div>

          {/* Total Supplier Amount Card */}
          <div className="summary-card total-supplier-amount-card overview-card">
            <div className="overview-card-icon">
              <FileText />
            </div>
            <h3 className="overview-card-title">Total Supplier Amount</h3>
            <div className="overview-card-metrics">
              <span className="overview-card-main-value">
                ${supplyContractOverview?.totalSupplierAmount !== undefined
                  ? Number(supplyContractOverview.totalSupplierAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : (totalEscrowedAmount !== null && totalEscrowedAmount !== undefined
                    ? totalEscrowedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : (isLoadingSupplyContractOverview || isLoadingTotalEscrowed ? <LoadingIndicator size="sm" /> : '45,280'))}
              </span>
            </div>
          </div>
        </div>

        {/* Middle Section */}
        <div className="dashboard-middle supplier-contract-middle">
          {/* Supplier Details Section – contracts escrowed to this business (Business A) by buyers (e.g. Business B) */}
          <div id="supplier-details-section" className="supplier-details-section" ref={supplierDetailsSectionRef}>
            <div className="section-header">
              <div className="section-indicator"></div>
              <h3>Supplier Contract details</h3>
            </div>
            <div className="supplier-details-grid">
              {isLoadingSupplierDetails ? (
                <div className="supplier-details-loading" style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center' }}>
                  <LoadingIndicator size="sm" />
                  <span style={{ marginLeft: '0.5rem' }}>Loading suppliers…</span>
                </div>
              ) : supplierDetails.length === 0 ? (
                <div className="supplier-details-empty" style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No supplier details yet
                </div>
              ) : (
                supplierDetails.map((supplier, index) => (
                <div
                  key={index}
                  className="supplier-detail-card"
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSupplierDetailModalSource('supplier-details');
                    setSelectedSupplierDetail(supplier);
                    setShowSupplierDetailsModalMobile(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSupplierDetailModalSource('supplier-details');
                      setSelectedSupplierDetail(supplier);
                      setShowSupplierDetailsModalMobile(true);
                    }
                  }}
                >
                  <div className="supplier-card-top">
                    <div className="supplier-progress-circle">
                      <svg className="progress-ring" width="60" height="60">
                        <circle
                          className="progress-ring-background"
                          cx="30"
                          cy="30"
                          r="25"
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="4"
                        />
                        <circle
                          className="progress-ring-progress"
                          cx="30"
                          cy="30"
                          r="25"
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="4"
                          strokeDasharray={`${2 * Math.PI * 25}`}
                          strokeDashoffset={`${2 * Math.PI * 25 * (1 - supplier.progress / 100)}`}
                          transform="rotate(-90 30 30)"
                        />
                      </svg>
                      <span className="progress-text">{supplier.progress}%</span>
                    </div>
                    <div className="supplier-card-info">
                      <div className="supplier-id">
                        {supplier.supplierBusinessName || supplier.supplierName || supplier.contractName || `#${supplier.id}`}
                      </div>
                      {supplier.dueDate && (
                        <div className="supplier-due-date">Due date: {supplier.dueDate}</div>
                      )}
                      {supplier.percentage && (
                        <div className="supplier-percentage">{supplier.percentage}</div>
                      )}
                    </div>
                  </div>
                  <div className="supplier-amount-section">
                    <div className="supplier-amount-label">Amount</div>
                    <div className="supplier-amount">{supplier.amount}</div>
                  </div>
                </div>
              ))
              )}
            </div>
          </div>

          {/* Transaction History Section */}
          <div className="transaction-history-section">
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-indicator"></div>
                <h3>Supplier transaction history</h3>
              </div>
              <div className="transaction-filters">
                <div className="filter-dropdown">
                  <span>Filter</span>
                  <ChevronDown size={14} />
                </div>
                <div className="filter-dropdown">
                  <span>{monthlyFilter}</span>
                  <ChevronDown size={14} />
                </div>
                <button className="filter-icon-btn">
                  <Filter size={16} />
                </button>
              </div>
            </div>
            <div className="transaction-table-container">
              <table className="transaction-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Transaction ID</th>
                    <th>Supplier Name</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingSupplierTransactions ? (
                    <tr>
                      <td colSpan={7} className="transaction-loading-cell">
                        <LoadingIndicator size="sm" />
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="transaction-empty-cell">No transactions yet</td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          <input type="checkbox" />
                        </td>
                        <td>{transaction.transactionId}</td>
                        <td>{transaction.supplierName}</td>
                        <td>{transaction.amount}</td>
                        <td>
                          <span className={`status-badge ${(transaction.status || '').toLowerCase()}`}>{transaction.status}</span>
                        </td>
                        <td>{transaction.date}</td>
                        <td>
                          <button type="button" className="transaction-view-btn">
                            <ArrowRightIcon size={16} />
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
                disabled={transactionPage <= 1}
                onClick={() => onTransactionPageChange?.(transactionPage - 1)}
              >
                ← Prev
              </button>
              <div className="pagination-numbers">
                <span className="pagination-info">
                  Page {transactionPage} of {transactionTotalPages || 1}
                </span>
              </div>
              <button
                type="button"
                className="pagination-btn"
                disabled={transactionPage >= transactionTotalPages}
                onClick={() => onTransactionPageChange?.(transactionPage + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Escrow Contract Details modal - shown when a supplier card View is clicked */}
      {showSupplierDetailsModalMobile && selectedSupplierDetail && (
        <div
          className="supplier-details-modal-overlay"
          onClick={() => {
            setShowSupplierDetailsModalMobile(false);
            setSupplierDetailModalSource(null);
            setSelectedSupplierDetail(null);
            setSelectedEscrowId(null);
            setEscrowedToMeDetail(null);
            setEscrowedToMeDetailError(null);
            setCreatedByMeDetail(null);
            setCreatedByMeDetailError(null);
            setContractEvidenceFiles([]);
            setSupplierDetailUploadedFiles([]);
            setProofOfCompletionFiles([]);
            setContractFundsReleased(false);
          }}
          role="presentation"
        >
          <div
            className="supplier-details-modal-mobile escrow-contract-details-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="supplier-details-modal-title"
          >
            <div className="supplier-details-header-mobile">
              <div className="supplier-details-title-wrapper-mobile">
                <div className="supplier-details-blue-accent-mobile"></div>
                <h2 id="supplier-details-modal-title" className="supplier-details-title-mobile">Escrow contract</h2>
              </div>
              <button
                type="button"
                className="supplier-details-close-mobile"
                onClick={() => {
                  setShowSupplierDetailsModalMobile(false);
                  setSupplierDetailModalSource(null);
                  setSelectedSupplierDetail(null);
                  setSelectedEscrowId(null);
                  setEscrowedToMeDetail(null);
                  setEscrowedToMeDetailError(null);
                  setCreatedByMeDetail(null);
                  setCreatedByMeDetailError(null);
                  setContractEvidenceFiles([]);
                  setSupplierDetailUploadedFiles([]);
                  setProofOfCompletionFiles([]);
                  setContractFundsReleased(false);
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="supplier-details-content-mobile escrow-contract-content">
              {/* Escrowed-to-you: loading / error from API */}
              {supplierDetailModalSource === 'escrowed-to-you' && (
                <>
                  {escrowedToMeDetailLoading && (
                    <div className="escrow-contract-detail-loading">
                      <LoadingIndicator size="md" />
                      <span>Loading contract details…</span>
                    </div>
                  )}
                  {!escrowedToMeDetailLoading && escrowedToMeDetailError && (
                    <div className="escrow-contract-detail-error">
                      <p>{escrowedToMeDetailError}</p>
                    </div>
                  )}
                </>
              )}
              {/* Supplier-details (created-by-me): loading / error from API */}
              {supplierDetailModalSource === 'supplier-details' && (
                <>
                  {createdByMeDetailLoading && (
                    <div className="escrow-contract-detail-loading">
                      <LoadingIndicator size="md" />
                      <span>Loading contract details…</span>
                    </div>
                  )}
                  {!createdByMeDetailLoading && createdByMeDetailError && (
                    <div className="escrow-contract-detail-error">
                      <p>{createdByMeDetailError}</p>
                    </div>
                  )}
                </>
              )}

              {!(supplierDetailModalSource === 'escrowed-to-you' && (escrowedToMeDetailLoading || escrowedToMeDetailError)) && !(supplierDetailModalSource === 'supplier-details' && (createdByMeDetailLoading || createdByMeDetailError || !createdByMeDetail)) && (
                <>
              {/* Contract Header */}
              <div className="escrow-contract-header">
                <div className="escrow-contract-header-row">
                  <span className="escrow-contract-label">Contract</span>
                  <span className="escrow-contract-value">
                    {supplierDetailModalSource === 'escrowed-to-you' && escrowedToMeDetail
                      ? (escrowedToMeDetail.contractId ?? `#${escrowedToMeDetail.escrowId}`)
                      : (createdByMeDetail?.contractId ?? `#${createdByMeDetail?.escrowId}` ?? selectedSupplierDetail?.contractName ?? `#${selectedSupplierDetail?.id}`)}
                  </span>
                </div>
                <div className="escrow-contract-header-row">
                  <span className="escrow-contract-label">{supplierDetailModalSource === 'supplier-details' ? 'Supplier' : 'Buyer'}</span>
                  <span className="escrow-contract-value">
                    {supplierDetailModalSource === 'escrowed-to-you' && escrowedToMeDetail
                      ? (escrowedToMeDetail.buyer ?? '—')
                      : (createdByMeDetail?.supplierName ?? selectedSupplierDetail?.buyer ?? '—')}
                  </span>
                </div>
                <div className="escrow-contract-header-row">
                  <span className="escrow-contract-label">Amount</span>
                  <span className="escrow-contract-value">
                    {supplierDetailModalSource === 'escrowed-to-you' && escrowedToMeDetail
                      ? (escrowedToMeDetail.amountUsd != null ? `$${Number(escrowedToMeDetail.amountUsd).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—')
                      : (createdByMeDetail?.amountUsd != null ? `$${Number(createdByMeDetail.amountUsd).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : (selectedSupplierDetail?.amount ?? '—'))}
                  </span>
                </div>
                <div className="escrow-contract-header-row">
                  <span className="escrow-contract-label">Currency</span>
                  <span className="escrow-contract-value">
                    {supplierDetailModalSource === 'escrowed-to-you' && escrowedToMeDetail
                      ? (escrowedToMeDetail.currency ?? 'USDT')
                      : (createdByMeDetail?.currency ?? selectedSupplierDetail?.currency ?? 'USDT')}
                  </span>
                </div>
                <div className="escrow-contract-header-row">
                  <span className="escrow-contract-label">Status</span>
                  <span className="escrow-contract-value">
                    {supplierDetailModalSource === 'escrowed-to-you' && escrowedToMeDetail
                      ? (escrowedToMeDetail.timeline?.paymentRelease ? 'Funds Released' : (escrowedToMeDetail.status ?? 'Funds Locked in Escrow'))
                      : (createdByMeDetail?.timeline?.paymentRelease ? 'Funds Released' : (createdByMeDetail?.status ?? selectedSupplierDetail?.escrowStatus ?? 'Funds Locked in Escrow'))}
                  </span>
                </div>
                <div className="escrow-funds-verified">
                  <span className="escrow-funds-verified-dot" aria-hidden="true"></span>
                  {supplierDetailModalSource === 'escrowed-to-you' && escrowedToMeDetail
                    ? (escrowedToMeDetail.timeline?.paymentRelease ? 'Funds Released' : (escrowedToMeDetail.fundsVerifiedInEscrow ? 'Funds Verified in Escrow' : 'Funds Verified in Escrow'))
                    : (createdByMeDetail?.timeline?.paymentRelease ? 'Funds Released' : (createdByMeDetail?.fundsVerifiedInEscrow ? 'Funds Verified in Escrow' : 'Funds Verified in Escrow'))}
                </div>
              </div>

              {/* Contract Timeline */}
              <div className="escrow-contract-section">
                <h3 className="escrow-contract-section-title">Contract timeline</h3>
                <div className="escrow-timeline">
                  {(() => {
                    const t = supplierDetailModalSource === 'escrowed-to-you' ? escrowedToMeDetail?.timeline : createdByMeDetail?.timeline;
                    const released = t?.paymentRelease ?? (supplierDetailModalSource !== 'escrowed-to-you' && contractFundsReleased);
                    return (
                      <>
                        <div className={`escrow-timeline-step ${(t?.escrowCreated ?? true) ? 'completed' : ''}`}>
                          {(t?.escrowCreated ?? true) ? <Check size={16} /> : null}
                          <span>Escrow Created</span>
                        </div>
                        <div className={`escrow-timeline-step ${(t?.fundsDeposited ?? true) ? 'completed' : ''}`}>
                          {(t?.fundsDeposited ?? true) ? <Check size={16} /> : null}
                          <span>Funds Deposited</span>
                        </div>
                        <div className={`escrow-timeline-step ${(t?.contractAccepted ?? true) ? 'completed' : ''}`}>
                          {(t?.contractAccepted ?? true) ? <Check size={16} /> : null}
                          <span>Contract Accepted</span>
                        </div>
                        <div className={`escrow-timeline-step ${released ? 'completed' : (t ? 'current' : (contractFundsReleased ? 'completed' : 'current'))}`}>
                          {released ? <Check size={16} /> : null}
                          <span>Awaiting Delivery</span>
                        </div>
                        <div className={`escrow-timeline-step ${released ? 'completed' : ''}`}>
                          {released ? <Check size={16} /> : null}
                          <span>Payment Release</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Contract Terms */}
              <div className="escrow-contract-section">
                <h3 className="escrow-contract-section-title">Contract terms</h3>
                <div className="escrow-contract-terms">
                  <div className="escrow-contract-row">
                    <span className="escrow-contract-label">Delivery deadline</span>
                    <span className="escrow-contract-value">
                      {(supplierDetailModalSource === 'escrowed-to-you' ? escrowedToMeDetail?.deliveryDeadline : createdByMeDetail?.deliveryDeadline)
                        ? (() => {
                            try {
                              const raw = supplierDetailModalSource === 'escrowed-to-you' ? escrowedToMeDetail?.deliveryDeadline : createdByMeDetail?.deliveryDeadline;
                              const d = new Date(raw);
                              return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                            } catch (_) { return supplierDetailModalSource === 'escrowed-to-you' ? escrowedToMeDetail?.deliveryDeadline : createdByMeDetail?.deliveryDeadline; }
                          })()
                        : (selectedSupplierDetail?.dueDate ?? '—')}
                    </span>
                  </div>
                  <div className="escrow-contract-row">
                    <span className="escrow-contract-label">Release condition</span>
                    <span className="escrow-contract-value">
                      {(supplierDetailModalSource === 'escrowed-to-you' ? escrowedToMeDetail : createdByMeDetail)?.releaseCondition ?? 'Buyer confirmation'}
                    </span>
                  </div>
                  <div className="escrow-contract-row">
                    <span className="escrow-contract-label">Escrow type</span>
                    <span className="escrow-contract-value">
                      {(supplierDetailModalSource === 'escrowed-to-you' ? escrowedToMeDetail : createdByMeDetail)?.escrowType ?? 'Full payment'}
                    </span>
                  </div>
                  <div className="escrow-contract-row">
                    <span className="escrow-contract-label">Dispute window</span>
                    <span className="escrow-contract-value">
                      {(supplierDetailModalSource === 'escrowed-to-you' ? escrowedToMeDetail : createdByMeDetail)?.disputeWindow ?? '7 days'}
                    </span>
                  </div>
                  {((supplierDetailModalSource === 'escrowed-to-you' && escrowedToMeDetail?.contractTitle) || (supplierDetailModalSource === 'supplier-details' && createdByMeDetail?.contractTitle)) && (
                    <div className="escrow-contract-row">
                      <span className="escrow-contract-label">Contract title</span>
                      <span className="escrow-contract-value">{supplierDetailModalSource === 'escrowed-to-you' ? escrowedToMeDetail?.contractTitle : createdByMeDetail?.contractTitle}</span>
                    </div>
                  )}
                  {((supplierDetailModalSource === 'escrowed-to-you' && escrowedToMeDetail?.deliveryMethod) || (supplierDetailModalSource === 'supplier-details' && createdByMeDetail?.deliveryMethod)) && (
                    <div className="escrow-contract-row">
                      <span className="escrow-contract-label">Delivery method</span>
                      <span className="escrow-contract-value">{supplierDetailModalSource === 'escrowed-to-you' ? escrowedToMeDetail?.deliveryMethod : createdByMeDetail?.deliveryMethod}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Evidence / Documents – different per modal source */}
              <div className="escrow-contract-section">
                <h3 className="escrow-contract-section-title">Evidence / documents</h3>
                {supplierDetailModalSource === 'supplier-details' ? (
                  <>
                    {/* Contract documents (created-by-me API) */}
                    {(createdByMeDetail?.contractDocumentUrls?.length > 0) && (
                      <div className="escrow-contract-subsection">
                        <h4 className="escrow-contract-subsection-title">Contract documents</h4>
                        <ul className="escrow-evidence-list">
                          {createdByMeDetail.contractDocumentUrls.map((urlOrDoc, i) => {
                            const url = typeof urlOrDoc === 'string' ? urlOrDoc : (urlOrDoc?.fileUrl ?? urlOrDoc?.url);
                            const name = url ? (url.split('/').pop() || `Document ${i + 1}`) : `Document ${i + 1}`;
                            return url ? (
                              <li key={i}>
                                <button type="button" className="escrow-evidence-link escrow-evidence-link-btn" onClick={() => openDocumentWithSignedUrl(url)}>{name}</button>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      </div>
                    )}
                    {/* Proof of completion / supplier evidence (created-by-me API: proofOfCompletionDocumentUrls; open via signed-url) */}
                    <div className="escrow-contract-subsection">
                      <h4 className="escrow-contract-subsection-title">Evidence sent by supplier</h4>
                      <p className="escrow-evidence-hint">Proof of completion (e.g. shipping receipts, delivery confirmations).</p>
                      {(createdByMeDetail?.proofOfCompletionDocumentUrls?.length > 0 || (selectedSupplierDetail?.evidence?.length > 0 && !createdByMeDetail)) ? (
                        <ul className="escrow-evidence-list">
                          {(createdByMeDetail?.proofOfCompletionDocumentUrls || selectedSupplierDetail?.evidence || []).map((doc, i) => {
                            const url = typeof doc === 'string' ? doc : (doc?.fileUrl ?? doc?.url);
                            const name = typeof doc === 'string' ? (url ? (url.split('/').pop() || `Document ${i + 1}`) : doc) : (doc?.fileName ?? doc?.name ?? doc?.title ?? `Document ${i + 1}`);
                            return (
                              <li key={i}>
                                {url ? (
                                  <button type="button" className="escrow-evidence-link escrow-evidence-link-btn" onClick={() => openDocumentWithSignedUrl(url)}>{name}</button>
                                ) : (
                                  name
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="escrow-evidence-empty">No evidence submitted by supplier yet.</p>
                      )}
                    </div>
                    <div className="escrow-contract-subsection">
                      <h4 className="escrow-contract-subsection-title">Upload documents for supplier</h4>
                      <button
                        type="button"
                        className="escrow-upload-docs-btn"
                        disabled={isUploadingSupplierDocs}
                        onClick={() => document.getElementById('supplier-detail-upload-input')?.click()}
                      >
                        <Upload size={18} />
                        {isUploadingSupplierDocs ? 'Uploading…' : 'Upload documents for supplier'}
                      </button>
                      <input
                        id="supplier-detail-upload-input"
                        type="file"
                        className="escrow-upload-input"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files?.length) {
                            handleUploadDocumentsForSupplier(Array.from(files), true);
                          }
                          e.target.value = '';
                        }}
                      />
                      {supplierDetailUploadedFiles.length > 0 && (
                        <ul className="escrow-evidence-list">
                          {supplierDetailUploadedFiles.map((name, i) => (
                            <li key={i}>{name}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Documents sent by contractor (read-only) – from API or list item */}
                    <div className="escrow-contract-subsection">
                      <h4 className="escrow-contract-subsection-title">Documents sent by contractor</h4>
                      {(() => {
                        const docs = (supplierDetailModalSource === 'escrowed-to-you' && escrowedToMeDetail?.documentsFromContractor) || selectedSupplierDetail.contractorDocuments || [];
                        const list = Array.isArray(docs) ? docs : [];
                        if (list.length === 0) {
                          return <p className="escrow-evidence-empty">No documents from contractor yet.</p>;
                        }
                        return (
                          <ul className="escrow-evidence-list">
                            {list.map((doc, i) => {
                              const url = typeof doc === 'string' ? doc : (doc?.fileUrl ?? doc?.url);
                              const name = typeof doc === 'string'
                                ? (url ? (url.split('/').pop() || `Document ${i + 1}`) : doc)
                                : (doc?.fileName ?? doc?.name ?? doc?.title ?? `Document ${i + 1}`);
                              return (
                                <li key={i}>
                                  {url ? (
                                    <button type="button" className="escrow-evidence-link escrow-evidence-link-btn" onClick={() => openDocumentWithSignedUrl(url)}>{name}</button>
                                  ) : (
                                    name
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        );
                      })()}
                    </div>
                    {/* Proof of contract completion – upload by supplier (escrowed-to-you only) */}
                    <div className="escrow-contract-subsection">
                      <h4 className="escrow-contract-subsection-title">Proof of contract completion</h4>
                      <p className="escrow-evidence-hint">Upload evidence that the contract has been completed (e.g. delivery confirmation, signed handover, completion certificate).</p>
                      <button
                        type="button"
                        className="escrow-upload-docs-btn"
                        disabled={isUploadingProofOfCompletion}
                        onClick={() => document.getElementById('proof-of-completion-upload-input')?.click()}
                      >
                        <Upload size={18} />
                        {isUploadingProofOfCompletion ? 'Uploading…' : 'Upload proof of completion'}
                      </button>
                      <input
                        id="proof-of-completion-upload-input"
                        type="file"
                        className="escrow-upload-input"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files?.length) handleUploadProofOfCompletion(Array.from(files));
                          e.target.value = '';
                        }}
                      />
                      {(escrowedToMeDetail?.proofOfCompletionDocuments?.length > 0 || proofOfCompletionFiles.length > 0) ? (
                        <ul className="escrow-evidence-list">
                          {(escrowedToMeDetail?.proofOfCompletionDocuments || []).map((doc, i) => {
                            const url = typeof doc === 'string' ? doc : (doc?.fileUrl ?? doc?.url);
                            const name = typeof doc === 'string' ? (url ? (url.split('/').pop() || `Document ${i + 1}`) : doc) : (doc?.fileName ?? doc?.name ?? doc?.title ?? `Document ${i + 1}`);
                            return (
                              <li key={`api-${i}`}>
                                {url ? (
                                  <button type="button" className="escrow-evidence-link escrow-evidence-link-btn" onClick={() => openDocumentWithSignedUrl(url)}>{name}</button>
                                ) : (
                                  name
                                )}
                              </li>
                            );
                          })}
                          {proofOfCompletionFiles.map((item, i) => (
                            <li key={`uploaded-${i}`}>
                              <button type="button" className="escrow-evidence-link escrow-evidence-link-btn" onClick={() => openDocumentWithSignedUrl(item.url)}>{item.name}</button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="escrow-evidence-empty">No proof of completion uploaded yet.</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons – supplier-details: only Raise Dispute; escrowed-to-you: Mark Delivered, Request buyer confirmation, Raise Dispute */}
              <div className="escrow-contract-actions">
                {(supplierDetailModalSource === 'escrowed-to-you' && escrowedToMeDetail?.timeline?.paymentRelease) || (supplierDetailModalSource === 'supplier-details' && createdByMeDetail?.timeline?.paymentRelease) || (supplierDetailModalSource !== 'escrowed-to-you' && contractFundsReleased) ? (
                  <div className="escrow-funds-released-badge">Funds Released</div>
                ) : supplierDetailModalSource === 'supplier-details' ? (
                  <button type="button" className="escrow-action-btn escrow-action-outline">
                    <AlertCircle size={18} />
                    Raise Dispute
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="escrow-action-btn escrow-action-primary"
                      disabled={isMarkingDelivered || isRequestingBuyerConfirmation}
                      onClick={handleMarkDelivered}
                    >
                      {isMarkingDelivered ? <LoadingIndicator size="sm" /> : <Package size={18} />}
                      {isMarkingDelivered ? 'Marking…' : 'Mark Delivered'}
                    </button>
                    <button
                      type="button"
                      className="escrow-action-btn escrow-action-secondary"
                      disabled={isMarkingDelivered || isRequestingBuyerConfirmation}
                      onClick={handleRequestBuyerConfirmation}
                    >
                      {isRequestingBuyerConfirmation ? <LoadingIndicator size="sm" /> : null}
                      {isRequestingBuyerConfirmation ? 'Requesting…' : 'Request Buyer Confirmation'}
                    </button>
                    <button type="button" className="escrow-action-btn escrow-action-outline">
                      <AlertCircle size={18} />
                      Raise Dispute
                    </button>
                  </>
                )}
              </div>

              </>)}

              <div className="supplier-details-actions-mobile">
                <button
                  type="button"
                  className="supplier-details-done-btn-mobile"
                  onClick={() => {
                    setShowSupplierDetailsModalMobile(false);
                    setSupplierDetailModalSource(null);
                    setSelectedSupplierDetail(null);
                    setSelectedEscrowId(null);
                    setEscrowedToMeDetail(null);
                    setEscrowedToMeDetailError(null);
                    setCreatedByMeDetail(null);
                    setCreatedByMeDetailError(null);
                    setContractEvidenceFiles([]);
                    setSupplierDetailUploadedFiles([]);
                    setProofOfCompletionFiles([]);
                    setContractFundsReleased(false);
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Supply Status modal – delivered / pending and release */}
      {showViewSupplyStatusModal && (
        <div
          className="supplier-details-modal-overlay"
          role="presentation"
          onClick={() => setShowViewSupplyStatusModal(false)}
        >
          <div
            className="supplier-details-modal-mobile view-supply-status-modal"
            role="dialog"
            aria-labelledby="view-supply-status-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="supplier-details-header-mobile">
              <div className="supplier-details-title-wrapper-mobile">
                <div className="supplier-details-blue-accent-mobile" />
                <h2 id="view-supply-status-modal-title" className="supplier-details-title-mobile">
                  Supply status
                </h2>
              </div>
              <button
                type="button"
                className="supplier-details-close-mobile"
                aria-label="Close"
                onClick={() => setShowViewSupplyStatusModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="view-supply-status-modal-content">
              {isLoadingSupplyContractsForContractor ? (
                <div className="view-supply-status-loading">
                  <LoadingIndicator size="sm" />
                  <span>Loading…</span>
                </div>
              ) : supplyContractsForContractor.length === 0 ? (
                <div className="view-supply-status-empty">
                  No supply contracts. Third-party supply will appear here as delivered or pending.
                </div>
              ) : (
                <ul className="view-supply-status-list">
                  {supplyContractsForContractor.map((item, index) => {
                    const id = item.escrowId || item.contractId || item.id || `item-${index}`;
                    const isReleased = item.canRelease === false || (item.canRelease !== true && isSupplyDelivered(item));
                    const amountUsd = Number(item.amountUsd ?? 0);
                    const amountStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amountUsd);
                    let dateStr = '—';
                    if (item.createdAt) {
                      try {
                        const d = new Date(item.createdAt);
                        dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                      } catch (_) {}
                    }
                    let expectedReleaseStr = '';
                    if (item.expectedReleaseDate) {
                      try {
                        const d = new Date(item.expectedReleaseDate);
                        expectedReleaseStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                      } catch (_) {}
                    }
                    const statusLabel = item.statusDisplay != null && item.statusDisplay !== '' ? item.statusDisplay : (isReleased ? 'Released' : 'Pending');
                    const canRelease = item.canRelease === true || (item.canRelease !== false && !isReleased);
                    const isReleasing = releasingContractId === id;
                    return (
                      <li key={id} className="view-supply-status-item">
                        <div className="view-supply-status-item-main">
                          <span className="view-supply-status-item-id">{item.contractId || item.escrowId || id}</span>
                          <span className="view-supply-status-item-meta">
                            {dateStr} · {amountStr}
                            {expectedReleaseStr ? ` · Expected release ${expectedReleaseStr}` : ''}
                          </span>
                          <span className={`view-supply-status-badge ${isReleased ? 'delivered' : 'pending'}`}>
                            {statusLabel}
                          </span>
                        </div>
                        {isReleased ? (
                          <span className="view-supply-status-released-label">Released</span>
                        ) : (
                          <button
                            type="button"
                            className="view-supply-status-release-btn"
                            onClick={() => handleReleaseSupplyContract(item)}
                            disabled={isReleasing || !canRelease}
                          >
                            {isReleasing ? <LoadingIndicator size="sm" /> : 'Release'}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View New Supply Contract modal – contracts escrowed to this business (Business A) by buyers (e.g. Business B) */}
      {showViewSupplyContractModal && (
        <div
          className="supplier-details-modal-overlay"
          role="presentation"
          onClick={() => setShowViewSupplyContractModal(false)}
        >
          <div
            className="supplier-details-modal-mobile view-supply-contract-modal"
            role="dialog"
            aria-labelledby="view-supply-contract-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="supplier-details-header-mobile">
              <div className="supplier-details-title-wrapper-mobile">
                <div className="supplier-details-blue-accent-mobile" />
                <h2 id="view-supply-contract-modal-title" className="supplier-details-title-mobile">
                  Supply contracts escrowed to you
                </h2>
              </div>
              <button
                type="button"
                className="supplier-details-close-mobile"
                aria-label="Close"
                onClick={() => setShowViewSupplyContractModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="view-supply-contract-modal-content">
              {isLoadingSupplyContractsForSupplier ? (
                <div className="view-supply-contract-loading">
                  <LoadingIndicator size="sm" />
                  <span>Loading contracts…</span>
                </div>
              ) : supplyContractsForSupplier.length === 0 ? (
                <div className="view-supply-contract-empty">
                  No supply contracts escrowed to you yet.
                </div>
              ) : (
                <ul className="view-supply-contract-list">
                  {supplyContractsForSupplier.map((item, index) => {
                    const id = item.escrowId || item.contractId || `item-${index}`;
                    const amountUsd = Number(item.amountUsd ?? 0);
                    const amountStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amountUsd);
                    let dateStr = '—';
                    if (item.createdAt) {
                      try {
                        const d = new Date(item.createdAt);
                        dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                      } catch (_) {}
                    }
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          className="view-supply-contract-item"
                          onClick={() => {
                            const escrowId = item.escrowId || item.contractId;
                            setSupplierDetailModalSource('escrowed-to-you');
                            setSelectedEscrowId(escrowId);
                            setSelectedSupplierDetail({ id: escrowId }); // minimal so modal opens; content from API
                            setShowViewSupplyContractModal(false);
                            setShowSupplierDetailsModalMobile(true);
                          }}
                        >
                          <div className="view-supply-contract-item-main">
                            <span className="view-supply-contract-item-id">{item.contractId || item.escrowId}</span>
                            <span className="view-supply-contract-item-name">{item.contractId || 'Contract'}</span>
                            <span className="view-supply-contract-item-due">{dateStr}</span>
                            {(item.statusDisplay || item.status) && (
                              <span className="view-supply-contract-item-status">{item.statusDisplay || item.status}</span>
                            )}
                          </div>
                          <div className="view-supply-contract-item-amount">{amountStr}</div>
                          <ChevronRight size={18} className="view-supply-contract-item-arrow" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupplierContract;
