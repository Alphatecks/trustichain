import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect, useId } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  Plus,
  ArrowDown,
  ChevronDown,
  Filter,
  X,
  KeyRound,
  Menu,
  DollarSign,
  Building2,
  FileCheck,
  Code,
  Box,
  Link as LinkIcon,
  PiggyBank,
  FileText,
  Trash2,
  List,
  Snowflake,
  ArrowDownToLine,
  ChevronRight,
  Info,
  Copy,
  Calendar,
  Check,
  Crosshair,
  Wallet,
  Award,
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './TrustiCard.css';
import logo from '../../../assets/images/icons/logo.png';
import { useSession } from '../../../context/SessionContext';
import { useTrustiscore, formatTrustiscoreBadgeText } from '../../../context/TrustiscoreContext';
import { useSidebarNavBadges } from '../../../hooks/useSidebarNavBadges';
import {
  DashboardEscrowTableSkeleton,
  TrustiCardDetailsSkeleton,
  TrustiCardMyCardsSkeleton,
  TrustiCardTxMobileSkeleton,
} from '../../../components/DashboardSkeletons';
import HeaderProfileVerifyBadge from '../../../components/HeaderProfileVerifyBadge';
import HeaderProfileAvatarNav from '../../../components/HeaderProfileAvatarNav';
import PersonalSuiteMobileHeader from '../../../components/PersonalSuiteMobileHeader';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../../utils/config';
import { getProfileAvatarUrl } from '../../../utils/profileAvatar';
import { persistTrustitagFromProfileResponse } from '../../../utils/trustitag';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../../utils/notificationsApi';
import NotificationListItems from '../../../components/NotificationListItems/NotificationListItems';
import { handleLogout } from '../../../utils/logout';
import { usePersonalSidebarWallet } from '../../../hooks/usePersonalSidebarWallet';
import SidebarWalletSection from '../../../components/SidebarWalletNav';
import PersonalWalletAddressesModal from '../../../components/PersonalWalletAddressesModal';
import {
  emptyCustodialWalletBalances,
  parseCustodialWalletBalances,
  readStoredDashboardAccountType,
} from '../../../utils/custodialWalletBalances';

/** Format PAN for Card Info (group digits; leave masked strings as-is). */
function formatPanForDisplay(pan) {
  if (pan == null || pan === '') return '—';
  const raw = String(pan).trim();
  if (raw.includes('*')) return raw.replace(/\s+/g, ' ').trim();
  const digitsOnly = raw.replace(/\s+/g, '');
  if (/^\d{12,19}$/.test(digitsOnly)) return digitsOnly.replace(/(\d{4})(?=.)/g, '$1 ').trim();
  return raw;
}

const TRUSTICARD_CARD_INFO_ADDRESS_FIELDS = [
  { key: 'streetAddress', label: 'Street address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State / region' },
  { key: 'country', label: 'Country' },
  { key: 'postalCode', label: 'Postal code' },
];

/** Flip to `false` when Cardyfie APIs are wired; until then the My Cards UI uses static data only. */
const TRUSTICARD_USE_MOCK = false;

const TRUSTICARD_HAS_CREATED_CARD_KEY = 'trusticard_has_created_card';
const TRUSTICARD_CUSTOMER_ULID_KEY = 'trusticard_customer_ulid';

function getStoredCustomerUlid() {
  if (typeof window === 'undefined') return '';
  return String(localStorage.getItem(TRUSTICARD_CUSTOMER_ULID_KEY) || '').trim();
}

function setStoredCustomerUlid(ulid) {
  if (typeof window === 'undefined' || !ulid) return;
  localStorage.setItem(TRUSTICARD_CUSTOMER_ULID_KEY, String(ulid).trim());
}

function extractCustomerUlid(result) {
  return (
    result?.customer?.ulid
    ?? result?.data?.customer?.ulid
    ?? result?.data?.ulid
    ?? null
  );
}

function normalizeCardyfieCard(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const statusRaw = String(raw.status ?? '').trim();
  const statusLower = statusRaw.toLowerCase();
  const status = statusRaw === 'ENABLED' ? 'active' : statusLower || 'active';
  return {
    ...raw,
    card_balance: Number(raw.card_balance ?? raw.balance ?? 0) || 0,
    card_currency_code: raw.card_currency_code ?? raw.card_currency ?? 'USD',
    status,
  };
}

function extractIssuedCard(result) {
  if (!result || typeof result !== 'object') return null;
  const raw =
    result.card
    ?? result.data?.card
    ?? (result.data && typeof result.data === 'object' && (result.data.ulid || result.data.card_ulid) ? result.data : null);
  if (!raw || typeof raw !== 'object') return null;
  const ulid = raw.ulid ?? raw.card_ulid;
  if (!ulid) return null;
  return normalizeCardyfieCard({ ...raw, ulid: String(ulid) });
}

function extractCardUlid(result) {
  const issued = extractIssuedCard(result);
  if (issued?.ulid) return issued.ulid;
  return result?.card_ulid ?? result?.data?.card_ulid ?? null;
}

function mapWizardIdType(uiLabel) {
  const label = String(uiLabel || '').trim().toLowerCase();
  if (label === 'passport') return 'passport';
  if (label === 'bvn') return 'bvn';
  return 'nid';
}

function splitFullName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: '', last_name: '' };
  if (parts.length === 1) return { first_name: parts[0], last_name: parts[0] };
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(' '),
  };
}

const MOCK_TRUSTICARD_CARDS = [
  {
    ulid: 'mock-platinum',
    card_name: 'Platinum Card',
    card_balance: 24567.89,
    card_currency_code: 'USD',
    masked_pan: '**** **** **** 5434',
    card_provider: 'mastercard',
    status: 'active',
  },
  {
    ulid: 'mock-business',
    card_name: 'Business Card',
    card_balance: 8420.5,
    card_currency_code: 'USD',
    masked_pan: '**** **** **** 8821',
    card_provider: 'mastercard',
    status: 'active',
  },
  {
    ulid: 'mock-travel',
    card_name: 'Travel Card',
    card_balance: 3100,
    card_currency_code: 'USD',
    masked_pan: '**** **** **** 2291',
    card_provider: 'visa',
    status: 'active',
  },
];

/** Static preview shown on the Create Card onboarding modal. */
const CREATE_CARD_PREVIEW = {
  card_name: 'Platinum Card',
  card_balance: 24567.89,
  card_currency_code: 'USD',
  masked_pan: '**** **** **** 0000',
  card_provider: 'mastercard',
};

/** Source wallets for Add funds modal; deposit POST still sends numeric amount (same as legacy field). */
/** Demo transaction rows when tx API returns empty (mock preview only). */
const TRUSTICARD_FUND_SOURCE_WALLETS = [
  { id: 'rlusd', label: 'RLUSD wallet', symbol: 'RLUSD', balanceTicker: 'RLUSD' },
  { id: 'xrp', label: 'XRP wallet', symbol: 'XRP', balanceTicker: 'XRP' },
];

/** Destination display for Withdraw modal (UI only; API posts amount only today). */
const TRUSTICARD_WITHDRAW_DEST_WALLETS = [
  { id: 'usd', label: 'USD wallet' },
  { id: 'xrpl', label: 'XRPL wallet' },
];

/** Matches reference UI: ~24 000 RLUSD → $24 567.89 */
const TRUSTICARD_RLUSD_TO_USD = 24567.89 / 24000;

/** Simple Icons-derived marks (Ripple blob / XRP), vector-only icons for Add funds wallets */
const TI_FUND_SI_XRP_MARK_PATH =
  'M5.52 2.955A3.521 3.521 0 001.996 6.48v2.558A2.12 2.12 0 010 11.157l.03.562-.03.561a2.12 2.12 0 011.996 2.121v2.948a3.69 3.69 0 003.68 3.696v-1.123a2.56 2.56 0 01-2.557-2.558v-2.963a3.239 3.239 0 00-1.42-2.682 3.26 3.26 0 001.42-2.682V6.48A2.412 2.412 0 015.52 4.078h.437V2.955zm12.538 0v1.123h.437a2.39 2.39 0 012.386 2.401v2.558a3.26 3.26 0 001.42 2.682 3.239 3.239 0 00-1.42 2.682v2.963a2.56 2.56 0 01-2.557 2.558v1.123a3.69 3.69 0 003.68-3.696V14.4A2.12 2.12 0 0124 12.281l-.03-.562.03-.561a2.12 2.12 0 01-1.996-2.12V6.478a3.518 3.518 0 00-3.509-3.524zM6.253 7.478l3.478 3.259a3.393 3.393 0 004.553 0l3.478-3.26h-1.669l-2.65 2.464a2.133 2.133 0 01-2.886 0L7.922 7.478zm5.606 4.884a3.36 3.36 0 00-2.128.886l-3.493 3.274h1.668l2.667-2.495a2.133 2.133 0 012.885 0l2.65 2.495h1.67l-3.494-3.274a3.36 3.36 0 00-2.425-.886z';

const TI_FUND_SI_RIPPLE_BLOB_PATH =
  'M20.55 14.65c-.846-.486-1.805-.632-2.752-.666-.79-.023-1.974-.541-1.974-1.985 0-1.072.868-1.94 1.985-1.985.947-.034 1.906-.18 2.752-.666A5.018 5.018 0 0022.4 2.502 5.04 5.04 0 0015.53.674a4.993 4.993 0 00-2.504 4.343c0 .97.35 1.861.79 2.696.372.699.553 1.996-.71 2.73-.948.54-2.132.202-2.719-.745-.496-.801-1.094-1.545-1.94-2.03C6.045 6.28 2.977 7.104 1.6 9.495A5.018 5.018 0 003.44 16.34a5.025 5.025 0 005.008 0c.846-.485 1.444-1.23 1.94-2.03.406-.654 1.433-1.489 2.718-.744.948.541 1.241 1.737.711 2.73-.44.823-.79 1.725-.79 2.695A5.011 5.011 0 0018.034 24a5.011 5.011 0 005.008-5.008 4.982 4.982 0 00-2.492-4.343z';

const MOCK_TRUSTICARD_TRANSACTIONS_DISPLAY = Array.from({ length: 85 }, (_, i) => {
  const isRecv = i % 2 === 0;
  const statuses = ['Successful', 'Pending', 'Failed'];
  const status = statuses[i % 3];
  const day = String((i % 27) + 1).padStart(2, '0');
  const month = String((i % 12) + 1).padStart(2, '0');
  const statusTone = status === 'Failed' ? 'failed' : status === 'Pending' ? 'pending' : 'successful';
  const recvAmt = `${50 + (i % 40)} XRP`;
  const recvUsd = `$${(25 + (i % 50)).toFixed(2)} USD`;
  const sentAmt = `${((i % 5) + 1) / 10} ETH`;
  const sentUsd = `$${900 + (i % 100)} USD`;
  const subtitle = isRecv
    ? `You received ${recvAmt}, worth ${recvUsd}.`
    : `You sent ${sentAmt}, worth ${sentUsd}.`;
  return {
    id: `F4E5D6${String(i).padStart(4, '0')}C3B2A1`,
    type: isRecv ? 'Received' : 'Sent',
    typeLabel: isRecv ? 'Received' : 'Sent',
    amount: isRecv ? `+${recvAmt}` : `-${sentAmt}`,
    usd: isRecv ? `(${recvUsd})` : `(${sentUsd})`,
    subtitle,
    status,
    statusTone,
    date: `2024-${month}-${day}`,
  };
});

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: null },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: null },
  { label: 'Savings', icon: PiggyBank, badge: null },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta' },
  { label: 'P2P trading', icon: Repeat, badge: 'Beta' },
];

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { label: 'Payroll', icon: DollarSign, badge: null },
  { label: 'Supplier Contract', icon: Building2, badge: null },
  { label: 'Invoice', icon: FileText, badge: null },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta' },
];

const developersNav = [
  { label: 'Api Keys', icon: Code, badge: null },
  { label: 'Sand box enviroment', icon: Box, badge: null },
  { label: 'Web hook', icon: LinkIcon, badge: null },
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

function truncateId(id) {
  const s = String(id || '');
  if (s.length <= 14) return s;
  return `${s.slice(0, 6)}…${s.slice(-6)}`;
}

/** Shortest signed offset on a ring; `centerFloat` may be fractional while dragging. */
function circularFractionalOffset(index, centerFloat, n) {
  if (n <= 1) return 0;
  let d = index - centerFloat;
  const half = n / 2;
  while (d > half) d -= n;
  while (d < -half) d += n;
  return d;
}

function readCarouselStepPx(viewportEl) {
  if (!viewportEl || typeof window === 'undefined') return 336;
  const cs = getComputedStyle(viewportEl);
  const gap = parseFloat(cs.getPropertyValue('--tc-carousel-gap')) || 4;
  const slideEl = viewportEl.querySelector('.tc-v2-carousel-slide');
  const measured = slideEl?.getBoundingClientRect().width ?? 0;
  if (measured > 1) return measured + gap;
  const parsed = parseFloat(cs.getPropertyValue('--tc-carousel-slot'));
  const slot = Number.isFinite(parsed) && parsed > 0 ? parsed : 320;
  return slot + gap;
}

function MastercardMark({ size = 36 }) {
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 48 30" aria-hidden className="tc-v2-brand-logo">
      <circle cx="19" cy="15" r="10" fill="#EB001B" opacity={0.95} />
      <circle cx="29" cy="15" r="10" fill="#F79E1B" opacity={0.95} />
      <path
        d="M24 8.5a9.8 9.8 0 010 13 9.8 9.8 0 000-13z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function VisaMark({ size = 36, light }) {
  return (
    <span
      className="tc-v2-brand-logo"
      style={{
        fontSize: size * 0.55,
        fontWeight: 800,
        fontStyle: 'italic',
        letterSpacing: '-0.04em',
        color: light ? 'rgba(255,255,255,0.95)' : '#1e3a8a',
      }}
    >
      VISA
    </span>
  );
}

/** Wallet / token avatar for XRPL-linked sources in Add funds (no hosted assets). `variant`: `rlusd` | `xrp` */
function TrusticardFundWalletLogo({ variant, size = 28, className = '' }) {
  const suffix = useId().replace(/\W/g, '');
  const clipId = `tfwl-${suffix}`;
  const bg = variant === 'rlusd' ? '#00B388' : '#23292f';
  const pathD = variant === 'rlusd' ? TI_FUND_SI_RIPPLE_BLOB_PATH : TI_FUND_SI_XRP_MARK_PATH;

  const cls = `trusticard-fund-wallet-logo ${className}`.trim();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      focusable={false}
      className={cls || undefined}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="12" cy="12" r="12" />
        </clipPath>
      </defs>
      <circle cx="12" cy="12" r="12" fill={bg} />
      <path d={pathD} fill="#FFFFFF" clipPath={`url(#${clipId})`} />
    </svg>
  );
}

const TrustiCard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const { score: trustiscoreScore, isLoading: isTrustiscoreLoading, openTrustiscoreModal } = useTrustiscore();
  const trustiscoreBadgeText = formatTrustiscoreBadgeText(trustiscoreScore, isTrustiscoreLoading);
  const getNavBadge = useSidebarNavBadges();
  const {
    walletAddress: sidebarWalletAddress,
    rlusdWalletAddress: sidebarRlusdWalletAddress,
    walletAddressRows: sidebarWalletAddressRows,
    walletBalanceRaw: sidebarWalletBalanceRaw,
    showWalletModal: showSidebarWalletModal,
    setShowWalletModal: setShowSidebarWalletModal,
    isLoadingWalletAddress: isLoadingSidebarWallet,
    isProvisioningWallets: isProvisioningSidebarWallets,
    handleViewWalletClick: handleSidebarViewWallet,
    handleCreateInitialWallet: handleSidebarCreateInitialWallet,
    handleProvisionOtherWalletAddresses: handleSidebarProvisionOtherAddresses,
  } = usePersonalSidebarWallet({ isSessionExpired });

  const [accountType] = useState('Personal');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [showCreateCardKycModal, setShowCreateCardKycModal] = useState(false);
  const [showCreateCardIdentityModal, setShowCreateCardIdentityModal] = useState(false);
  const [showCreateCardAddressModal, setShowCreateCardAddressModal] = useState(false);
  const [showCreateCardSuccessModal, setShowCreateCardSuccessModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [isSubmittingAddCard, setIsSubmittingAddCard] = useState(false);
  const [hasCompletedFirstCardCreation, setHasCompletedFirstCardCreation] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(TRUSTICARD_HAS_CREATED_CARD_KEY) === '1';
  });
  const [addCardForm, setAddCardForm] = useState({
    customer_ulid: '',
    card_name: '',
    card_type: 'standard',
    card_provider: 'mastercard',
  });
  const [createCardVerificationMode, setCreateCardVerificationMode] = useState('id');
  const [createCardCountry, setCreateCardCountry] = useState('Nigeria');
  const [createCardCountryMenuOpen, setCreateCardCountryMenuOpen] = useState(false);
  const [createCardIdType, setCreateCardIdType] = useState('NIN');
  const [createCardIdNumber, setCreateCardIdNumber] = useState('');
  const [createCardBasicName, setCreateCardBasicName] = useState('');
  const [createCardBasicDateOfBirth, setCreateCardBasicDateOfBirth] = useState('');
  const [createCardBasicGender, setCreateCardBasicGender] = useState('');
  const [createCardHouseNumber, setCreateCardHouseNumber] = useState('');
  const [createCardAddressLine1, setCreateCardAddressLine1] = useState('');
  const [createCardCity, setCreateCardCity] = useState('');
  const [createCardZipCode, setCreateCardZipCode] = useState('');
  const [createCardIdFrontFile, setCreateCardIdFrontFile] = useState(null);
  const [createCardIdBackFile, setCreateCardIdBackFile] = useState(null);
  const [createCardUserImageFile, setCreateCardUserImageFile] = useState(null);
  const [isSubmittingCreateCard, setIsSubmittingCreateCard] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [showIssueCardModal, setShowIssueCardModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFreezeConfirmModal, setShowFreezeConfirmModal] = useState(false);
  const [showDeleteCardModal, setShowDeleteCardModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [statementStartDate, setStatementStartDate] = useState('');
  const [statementEndDate, setStatementEndDate] = useState('');
  const [statementFormat, setStatementFormat] = useState('pdf');
  const [isSubmittingCreateCustomer, setIsSubmittingCreateCustomer] = useState(false);
  const [isSubmittingIssueCard, setIsSubmittingIssueCard] = useState(false);
  const [issueCardForm, setIssueCardForm] = useState({
    customer_ulid: '',
    card_name: '',
    card_currency: 'USD',
    card_type: 'platinum',
    card_provider: 'mastercard',
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
    house_number: '',
    address_line_1: '',
    city: '',
    zip_code: '',
    country: '',
    state: '',
    reference_id: '',
    meta_user_id: '',
  });

  const [fundAmount, setFundAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDestWalletId, setWithdrawDestWalletId] = useState('usd');
  const [withdrawWalletDropdownOpen, setWithdrawWalletDropdownOpen] = useState(false);
  const withdrawWalletDropdownRef = useRef(null);
  const [fundSourceWalletId, setFundSourceWalletId] = useState('rlusd');
  const [fundWalletDropdownOpen, setFundWalletDropdownOpen] = useState(false);
  const fundWalletDropdownRef = useRef(null);
  const [custodialWalletBalances, setCustodialWalletBalances] = useState(() => emptyCustodialWalletBalances());
  const [custodialWalletBalancesLoading, setCustodialWalletBalancesLoading] = useState(false);
  const [addressForm, setAddressForm] = useState({
    streetAddress: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });

  const [kycComplete] = useState(true);
  const [userFullName, setUserFullName] = useState('Sarah Chen');
  const [userInitials, setUserInitials] = useState('SC');
  const [userAvatar, setUserAvatar] = useState(null);
  const [, setUserRole] = useState('User');
  const [, setIsLoadingUserProfile] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [freezeCard, setFreezeCard] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState('All');
  const [transactionPeriod, setTransactionPeriod] = useState('Monthly');
  const [txTablePage, setTxTablePage] = useState(1);
  const [currentCardIndex, setCurrentCardIndex] = useState(() => {
    if (!TRUSTICARD_USE_MOCK) return 0;
    const idx = MOCK_TRUSTICARD_CARDS.findIndex((c) => c.ulid === 'mock-business');
    return idx >= 0 ? idx : 0;
  });
  const [cardsList, setCardsList] = useState(() => (TRUSTICARD_USE_MOCK ? MOCK_TRUSTICARD_CARDS : []));
  const [cardsPage, setCardsPage] = useState(1);
  const [isLoadingCards, setIsLoadingCards] = useState(() => !TRUSTICARD_USE_MOCK);
  const [cardTransactions, setCardTransactions] = useState([]);
  const [isLoadingCardTransactions, setIsLoadingCardTransactions] = useState(() => !TRUSTICARD_USE_MOCK);
  const [selectedCardDetails, setSelectedCardDetails] = useState(null);
  const [isLoadingCardDetails, setIsLoadingCardDetails] = useState(() => !TRUSTICARD_USE_MOCK);
  const [showSensitiveCardInfo, setShowSensitiveCardInfo] = useState(false);
  const [cardDetailsModalTab, setCardDetailsModalTab] = useState('info');
  const [notificationFilter, setNotificationFilter] = useState('All');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isFreezing, setIsFreezing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [, setNotificationsTotal] = useState(0);
  const [, setNotificationsUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [expandedNotificationId, setExpandedNotificationId] = useState(null);
  const [formattedToday, setFormattedToday] = useState('');
  const carouselViewportRef = useRef(null);
  const [carouselTrackTx, setCarouselTrackTx] = useState(0);
  const [carouselDragOffset, setCarouselDragOffset] = useState(0);
  const [carouselIsDragging, setCarouselIsDragging] = useState(false);
  const carouselDragOffsetRef = useRef(0);
  const nCardsRef = useRef(0);
  const carouselPointerRef = useRef({
    pointerId: null,
    startX: 0,
    lastX: 0,
    lastT: 0,
    vx: 0,
    dragCommitted: false,
  });
  const [txFilterMenuOpen, setTxFilterMenuOpen] = useState(false);
  const txFilterAnchorRef = useRef(null);

  const notificationsApiFilter = useMemo(() => (notificationFilter === 'Unread' ? 'unread' : 'all'), [notificationFilter]);

  useEffect(() => {
    if (!showNotificationModal) setExpandedNotificationId(null);
  }, [showNotificationModal]);

  useEffect(() => {
    if (!txFilterMenuOpen) return undefined;
    const close = (e) => {
      if (!txFilterAnchorRef.current?.contains(e.target)) setTxFilterMenuOpen(false);
    };
    document.addEventListener('pointerdown', close, true);
    return () => document.removeEventListener('pointerdown', close, true);
  }, [txFilterMenuOpen]);

  useEffect(() => {
    if (!showFundModal) setFundWalletDropdownOpen(false);
  }, [showFundModal]);

  useEffect(() => {
    if (!showWithdrawModal) setWithdrawWalletDropdownOpen(false);
  }, [showWithdrawModal]);

  useEffect(() => {
    if (showDetailsModal) {
      setCardDetailsModalTab('info');
    }
  }, [showDetailsModal]);

  useEffect(() => {
    if (showStatementModal) {
      setStatementStartDate('');
      setStatementEndDate('');
      setStatementFormat('pdf');
    }
  }, [showStatementModal]);

  useEffect(() => {
    if (!withdrawWalletDropdownOpen) return undefined;
    const close = (e) => {
      if (!withdrawWalletDropdownRef.current?.contains(e.target)) setWithdrawWalletDropdownOpen(false);
    };
    document.addEventListener('pointerdown', close, true);
    return () => document.removeEventListener('pointerdown', close, true);
  }, [withdrawWalletDropdownOpen]);

  useEffect(() => {
    if (!fundWalletDropdownOpen) return undefined;
    const close = (e) => {
      if (!fundWalletDropdownRef.current?.contains(e.target)) setFundWalletDropdownOpen(false);
    };
    document.addEventListener('pointerdown', close, true);
    return () => document.removeEventListener('pointerdown', close, true);
  }, [fundWalletDropdownOpen]);

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
      } catch (e) {
        if (!cancelled) {
          setNotifications([]);
          setNotificationsTotal(0);
          setNotificationsUnreadCount(0);
        }
      } finally {
        if (!cancelled) setIsLoadingNotifications(false);
      }
    };
    fetchNotifications();
    return () => { cancelled = true; };
  }, [showNotificationModal, isSessionExpired, notificationsApiFilter]);

  const handleMarkNotificationRead = async (notificationId) => {
    if (!notificationId || isSessionExpired) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await markNotificationRead({ token, id: notificationId });
      setNotifications((prev) => {
        if (!Array.isArray(prev)) return prev;
        if (notificationsApiFilter === 'unread') return prev.filter((n) => n?.id !== notificationId);
        return prev.map((n) => (n?.id === notificationId ? { ...n, isRead: true } : n));
      });
      setNotificationsUnreadCount((prev) => Math.max(0, (Number(prev) || 0) - 1));
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
      const day = now.getDate();
      const month = now.toLocaleDateString(undefined, { month: 'long' });
      setFormattedToday(`${weekday}, ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} ${month}`);
    };
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  const transactions = useMemo(() => {
    const mapped = cardTransactions.map((tx) => {
      const amount = Number(tx.enter_amount) || 0;
      const currency = tx.card_currency || 'USD';
      const isCredit = (tx.amount_type || '').toUpperCase() === 'CREDIT';
      const sign = isCredit ? '+' : '-';
      const absAmount = Math.abs(amount);
      const amountStr = `${sign}${absAmount} ${currency}`;
      const dateStr = tx.created_at
        ? new Date(tx.created_at).toISOString().slice(0, 10)
        : '—';
      const typeLabel = (tx.trx_type || '').replace(/-/g, ' ') || (isCredit ? 'Received' : 'Sent');
      const displayType = isCredit ? 'Received' : 'Sent';
      const raw = String(tx.status || '').toUpperCase();
      let statusLabel = 'Pending';
      let statusTone = 'pending';
      if (raw === 'SUCCESS' || raw === 'SUCCESSFUL') {
        statusLabel = 'Successful';
        statusTone = 'successful';
      } else if (raw === 'FAILED' || raw === 'FAIL') {
        statusLabel = 'Failed';
        statusTone = 'failed';
      } else if (raw === 'PENDING') {
        statusLabel = 'Pending';
        statusTone = 'pending';
      } else if (tx.status) {
        statusLabel = tx.status;
        const ls = String(statusLabel).toLowerCase();
        if (/fail/.test(ls)) statusTone = 'failed';
        else if (/success|complete/.test(ls)) statusTone = 'successful';
        else if (/pend|process|wait/.test(ls)) statusTone = 'pending';
        else statusTone = 'neutral';
      }

      const usdPart =
        currency === 'USD'
          ? `($${absAmount.toFixed(2)} USD)`
          : `(≈ $${absAmount.toFixed(2)} USD)`;
      const usdInner = usdPart.replace(/^\(/, '').replace(/\)$/, '');
      const subtitle =
        displayType === 'Received'
          ? `You received ${absAmount} ${currency}, worth ${usdInner}.`
          : `You sent ${absAmount} ${currency}, worth ${usdInner}.`;

      return {
        id: tx.trx_id || tx.ulid || '—',
        type: displayType,
        typeLabel,
        amount: amountStr,
        usd: usdPart,
        subtitle,
        status: statusLabel,
        statusTone,
        date: dateStr,
      };
    });
    if (mapped.length > 0) return mapped;
    if (TRUSTICARD_USE_MOCK) return MOCK_TRUSTICARD_TRANSACTIONS_DISPLAY;
    return [];
  }, [cardTransactions]);

  const filteredTransactions = useMemo(() => {
    if (transactionFilter === 'All') return transactions;
    return transactions.filter((t) => t.type === transactionFilter);
  }, [transactions, transactionFilter]);

  const txPageSize = 10;
  const totalTxPages = Math.max(1, Math.ceil(filteredTransactions.length / txPageSize));

  useEffect(() => {
    setTxTablePage((p) => Math.min(p, totalTxPages));
  }, [totalTxPages]);

  useEffect(() => {
    setTxTablePage(1);
  }, [transactionFilter]);

  const paginatedTransactions = useMemo(() => {
    const start = (txTablePage - 1) * txPageSize;
    return filteredTransactions.slice(start, start + txPageSize);
  }, [filteredTransactions, txTablePage]);

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
        const response = await fetch(getApiUrl('api/user/profile'), {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const result = await response.json();
          if (result?.success && result?.data) {
            persistTrustitagFromProfileResponse(result);
            const data = result.data;
            const fullName = data.fullName || [data.firstName, data.lastName].filter(Boolean).join(' ') || data.name || 'Sarah Chen';
            setUserFullName(fullName);
            let initials = 'SC';
            const firstName = data.firstName || '';
            const lastName = data.lastName || '';
            if (firstName && lastName) {
              initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
            } else if (fullName && typeof fullName === 'string') {
              const parts = fullName.trim().split(/\s+/);
              if (parts.length >= 2) {
                initials = `${parts[0].charAt(0).toUpperCase()}${parts[parts.length - 1].charAt(0).toUpperCase()}`;
              } else if (parts.length === 1) initials = parts[0].charAt(0).toUpperCase();
            }
            setUserInitials(initials);
            setUserRole(data.role || data.userRole || 'User');
            setUserAvatar(getProfileAvatarUrl(data));
            setUserEmail(String(data.email || data.userEmail || '').trim());
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingUserProfile(false);
      }
    };
    fetchUserProfile();
  }, [isSessionExpired]);

  const fetchCards = useCallback(async (page = 1) => {
    if (TRUSTICARD_USE_MOCK) {
      setCardsList(MOCK_TRUSTICARD_CARDS);
      setCardsPage(1);
      setIsLoadingCards(false);
      return MOCK_TRUSTICARD_CARDS;
    }
    const token = localStorage.getItem('token');
    if (!token || isSessionExpired) {
      setCardsList([]);
      setIsLoadingCards(false);
      return [];
    }
    setIsLoadingCards(true);
    try {
      const response = await fetch(getApiUrl(`api/cardyfie/cards?page=${page}`), {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok && result?.success && result?.cards) {
        const { data = [], current_page } = result.cards;
        const list = Array.isArray(data) ? data.map(normalizeCardyfieCard) : [];
        setCardsList(list);
        setCardsPage(current_page ?? page);
        return list;
      }
      setCardsList([]);
      return [];
    } catch (e) {
      console.error(e);
      setCardsList([]);
      return [];
    } finally {
      setIsLoadingCards(false);
    }
  }, [isSessionExpired]);

  useEffect(() => { fetchCards(1); }, [fetchCards]);

  useEffect(() => {
    if (TRUSTICARD_USE_MOCK || hasCompletedFirstCardCreation) return;
    if (cardsList.length > 0) {
      setHasCompletedFirstCardCreation(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(TRUSTICARD_HAS_CREATED_CARD_KEY, '1');
      }
    }
  }, [cardsList.length, hasCompletedFirstCardCreation]);

  useEffect(() => {
    if (cardsList.length > 0 && currentCardIndex >= cardsList.length) {
      setCurrentCardIndex(Math.max(0, cardsList.length - 1));
    }
  }, [cardsList.length, currentCardIndex]);

  const fetchCardTransactions = useCallback(async (cardUlid = '') => {
    if (TRUSTICARD_USE_MOCK) {
      setCardTransactions([]);
      setIsLoadingCardTransactions(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token || isSessionExpired) {
      setCardTransactions([]);
      setIsLoadingCardTransactions(false);
      return;
    }
    setIsLoadingCardTransactions(true);
    try {
      const qs = cardUlid ? `?card_ulid=${encodeURIComponent(cardUlid)}` : '';
      const response = await fetch(getApiUrl(`api/cardyfie/card/transactions${qs}`), {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok && result?.success && Array.isArray(result?.transactions)) {
        setCardTransactions(result.transactions);
      } else {
        setCardTransactions([]);
      }
    } catch (e) {
      console.error(e);
      setCardTransactions([]);
    } finally {
      setIsLoadingCardTransactions(false);
    }
  }, [isSessionExpired]);

  const fetchCardDetails = useCallback(async (cardUlid) => {
    if (!cardUlid) {
      setSelectedCardDetails(null);
      return;
    }
    if (TRUSTICARD_USE_MOCK) {
      const c = MOCK_TRUSTICARD_CARDS.find((x) => x.ulid === cardUlid);
      setSelectedCardDetails(
        c
          ? {
              ...c,
              masked_pan: c.masked_pan,
              real_pan: null,
              card_exp_time: '12/28',
              status: 'Active',
            }
          : null,
      );
      setIsLoadingCardDetails(false);
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
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok && result?.success && result?.card) {
        setSelectedCardDetails(normalizeCardyfieCard(result.card));
      } else {
        setSelectedCardDetails(null);
      }
    } catch (e) {
      console.error(e);
      setSelectedCardDetails(null);
    } finally {
      setIsLoadingCardDetails(false);
    }
  }, [isSessionExpired]);

  const presentCardInfoAfterCreate = useCallback(async (preferredUlid, issueResult) => {
    setShowCreateCardModal(false);
    setShowCreateCardKycModal(false);
    setShowCreateCardIdentityModal(false);
    setShowCreateCardAddressModal(false);
    setShowCreateCardSuccessModal(false);
    setShowAddCardModal(false);
    setCardDetailsModalTab('info');
    setShowSensitiveCardInfo(false);

    const issuedCard = extractIssuedCard(issueResult);
    const resolvedUlid = preferredUlid || issuedCard?.ulid || null;

    if (issuedCard?.ulid) {
      setCardsList((prev) => {
        const existingIdx = prev.findIndex((card) => card?.ulid === issuedCard.ulid);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = { ...next[existingIdx], ...issuedCard };
          return next;
        }
        return [...prev, issuedCard];
      });
      setSelectedCardDetails(issuedCard);
    }

    const list = await fetchCards(1);
    let idx = 0;
    const matchUlid = resolvedUlid || list?.[list.length - 1]?.ulid || issuedCard?.ulid || null;

    if (matchUlid && Array.isArray(list) && list.length > 0) {
      const found = list.findIndex((card) => card?.ulid === matchUlid);
      idx = found >= 0 ? found : Math.max(0, list.length - 1);
    } else if (Array.isArray(list) && list.length > 0) {
      idx = list.length - 1;
    } else if (issuedCard?.ulid) {
      setCardsList((prev) => (prev.some((card) => card?.ulid === issuedCard.ulid) ? prev : [issuedCard]));
      idx = 0;
    }

    setCurrentCardIndex(idx);
    const ulid = matchUlid || list?.[idx]?.ulid || issuedCard?.ulid || null;
    setShowDetailsModal(true);
    if (ulid) {
      await fetchCardDetails(ulid);
    }
  }, [fetchCards, fetchCardDetails]);

  const activeCard = cardsList[currentCardIndex] ?? null;

  const cardInfoDisplayCard = useMemo(() => {
    if (activeCard) return activeCard;
    if (selectedCardDetails?.ulid) return normalizeCardyfieCard(selectedCardDetails);
    return null;
  }, [activeCard, selectedCardDetails]);

  const activeFundWallet = useMemo(
    () =>
      TRUSTICARD_FUND_SOURCE_WALLETS.find((w) => w.id === fundSourceWalletId) || TRUSTICARD_FUND_SOURCE_WALLETS[0],
    [fundSourceWalletId],
  );

  const parsedFundAmount = useMemo(() => {
    const raw = String(fundAmount ?? '').replace(/,/g, '').trim();
    if (!raw) return null;
    const n = Number.parseFloat(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [fundAmount]);

  const formattedUsdEquivalent = useMemo(() => {
    if (parsedFundAmount == null) return '0.00';
    const usd =
      activeFundWallet.id === 'rlusd' ? parsedFundAmount * TRUSTICARD_RLUSD_TO_USD : parsedFundAmount;
    return usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [parsedFundAmount, activeFundWallet.id]);

  const formattedCustodialFundBalance = useMemo(() => {
    const raw = activeFundWallet.id === 'rlusd' ? custodialWalletBalances.RLUSD : custodialWalletBalances.XRP;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  }, [activeFundWallet.id, custodialWalletBalances]);

  const canShowCustodialWalletBalance =
    typeof window !== 'undefined' &&
    !!localStorage.getItem('token') &&
    !isSessionExpired;

  const handleFundAmountChange = useCallback((e) => {
    let v = e.target.value.replace(/,/g, '');
    v = v.replace(/[^\d.]/g, '');
    const parts = v.split('.');
    const merged = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : v;
    setFundAmount(merged);
  }, []);

  const activeWithdrawDestWallet = useMemo(
    () =>
      TRUSTICARD_WITHDRAW_DEST_WALLETS.find((w) => w.id === withdrawDestWalletId) || TRUSTICARD_WITHDRAW_DEST_WALLETS[0],
    [withdrawDestWalletId],
  );

  const parsedWithdrawAmount = useMemo(() => {
    const raw = String(withdrawAmount ?? '').replace(/[$,]/g, '').trim();
    if (!raw) return null;
    const n = Number.parseFloat(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [withdrawAmount]);

  const formattedCardWithdrawBalance = useMemo(() => {
    const n = Number(activeCard?.card_balance);
    if (!Number.isFinite(n)) return null;
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [activeCard?.card_balance]);

  const handleWithdrawAmountChange = useCallback((e) => {
    let v = e.target.value.replace(/[$,]/g, '');
    v = v.replace(/[^\d.]/g, '');
    const parts = v.split('.');
    const merged = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : v;
    setWithdrawAmount(merged);
  }, []);

  const refreshCustodialWalletBalances = useCallback(async () => {
    if (isSessionExpired) {
      setCustodialWalletBalances(emptyCustodialWalletBalances());
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setCustodialWalletBalances(emptyCustodialWalletBalances());
      return;
    }
    setCustodialWalletBalancesLoading(true);
    try {
      const accountKind = readStoredDashboardAccountType();
      const apiUrl =
        accountKind === 'Business Suite'
          ? getApiUrl('api/business-suite/wallet/balance')
          : getApiUrl('api/wallet/balance');
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        setCustodialWalletBalances(emptyCustodialWalletBalances());
        return;
      }
      const result = await response.json().catch(() => ({}));
      setCustodialWalletBalances(parseCustodialWalletBalances(result));
    } catch (e) {
      console.error(e);
      setCustodialWalletBalances(emptyCustodialWalletBalances());
    } finally {
      setCustodialWalletBalancesLoading(false);
    }
  }, [isSessionExpired]);

  useEffect(() => {
    refreshCustodialWalletBalances();
  }, [refreshCustodialWalletBalances]);

  useEffect(() => {
    if (showFundModal) refreshCustodialWalletBalances();
  }, [showFundModal, refreshCustodialWalletBalances]);

  useEffect(() => {
    const ulid = activeCard?.ulid;
    if (ulid) {
      fetchCardDetails(ulid);
      fetchCardTransactions(ulid);
    } else {
      setSelectedCardDetails(null);
      fetchCardTransactions('');
    }
  }, [activeCard?.ulid, fetchCardDetails, fetchCardTransactions]);

  useEffect(() => {
    if (TRUSTICARD_USE_MOCK) return;
    const st = (selectedCardDetails?.status || activeCard?.status || '').toLowerCase();
    setFreezeCard(st.includes('freeze') || st === 'frozen' || st === 'disabled');
  }, [selectedCardDetails?.status, activeCard?.status]);

  useEffect(() => {
    if (!showFreezeConfirmModal) return;
    if (!activeCard?.ulid || freezeCard) setShowFreezeConfirmModal(false);
  }, [showFreezeConfirmModal, activeCard?.ulid, freezeCard]);

  useEffect(() => {
    if (!showDeleteCardModal) return;
    if (!activeCard?.ulid) setShowDeleteCardModal(false);
  }, [showDeleteCardModal, activeCard?.ulid]);

  const copyCardDetailValue = useCallback(async (value, label) => {
    const t = String(value ?? '').trim();
    if (!t || t === '—') {
      toast.error('Nothing to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(t);
      toast.success(`${label} copied`);
    } catch (_) {
      toast.error('Copy failed');
    }
  }, []);

  const depositToCard = async (amountInput) => {
    if (TRUSTICARD_USE_MOCK) {
      toast('Funding will be available when cards are connected to your account.');
      return;
    }
    const cardUlid = activeCard?.ulid;
    if (!cardUlid) {
      toast.error('No card selected');
      return;
    }
    const parsed = parseFloat(String(amountInput ?? '').replace(/,/g, ''), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    const usdAmount =
      activeFundWallet.id === 'rlusd' ? parsed * TRUSTICARD_RLUSD_TO_USD : parsed;
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to continue');
      return;
    }
    setIsDepositing(true);
    try {
      const response = await fetch(getApiUrl(`api/cardyfie/card/${encodeURIComponent(cardUlid)}/deposit`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: usdAmount }),
      });
      const result = await response.json();
      if (response.ok && result?.success) {
        if (result?.card) {
          const normalized = normalizeCardyfieCard(result.card);
          setCardsList((prev) => prev.map((c) => (c?.ulid === normalized?.ulid ? { ...c, ...normalized } : c)));
        }
        toast.success(result?.trx_id ? `Deposit successful. Ref: ${result.trx_id}` : 'Deposit successful');
        setShowFundModal(false);
        setFundAmount('');
        refreshCustodialWalletBalances();
        fetchCards(cardsPage);
        fetchCardDetails(cardUlid);
      } else {
        toast.error(result?.message || 'Deposit failed');
      }
    } catch (e) {
      console.error(e);
      toast.error('Deposit failed');
    } finally {
      setIsDepositing(false);
    }
  };

  const withdrawFromCard = async (amountInput) => {
    if (TRUSTICARD_USE_MOCK) {
      toast('Withdrawals will be available when cards are connected to your account.');
      return;
    }
    const cardUlid = activeCard?.ulid;
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
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const result = await response.json();
      if (response.ok && result?.success) {
        toast.success('Withdrawal successful');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        fetchCards(cardsPage);
        fetchCardDetails(cardUlid);
        fetchCardTransactions(cardUlid);
      } else {
        toast.error(result?.message || 'Withdrawal failed');
      }
    } catch (e) {
      console.error(e);
      toast.error('Withdrawal failed');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const setCardFrozen = useCallback(
    async (nextFrozen) => {
      if (TRUSTICARD_USE_MOCK) {
        setFreezeCard(nextFrozen);
        toast(nextFrozen ? 'Card frozen (preview)' : 'Card unfrozen (preview)');
        return true;
      }
      const cardUlid = activeCard?.ulid;
      if (!cardUlid) {
        toast.error('No card selected');
        return false;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please sign in to continue');
        return false;
      }
      setIsFreezing(true);
      try {
        const endpoint = nextFrozen ? 'freeze' : 'unfreeze';
        const response = await fetch(getApiUrl(`api/cardyfie/card/${encodeURIComponent(cardUlid)}/${endpoint}`), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        const result = await response.json();
        if (response.ok && result?.success) {
          setFreezeCard(nextFrozen);
          fetchCardDetails(cardUlid);
          toast.success(nextFrozen ? 'Card frozen' : 'Card unfrozen');
          return true;
        }
        toast.error(result?.message || 'Request failed');
        return false;
      } catch (e) {
        console.error(e);
        toast.error('Request failed');
        return false;
      } finally {
        setIsFreezing(false);
      }
    },
    [activeCard?.ulid, fetchCardDetails],
  );

  const handleFreezeToggle = async () => {
    await setCardFrozen(!freezeCard);
  };

  const handleConfirmFreezeFromModal = async () => {
    if (freezeCard) return;
    const ok = await setCardFrozen(true);
    if (ok) setShowFreezeConfirmModal(false);
  };

  const handleStatementDownload = () => {
    const start = statementStartDate.trim();
    const end = statementEndDate.trim();
    if (!start || !end) {
      toast.error('Enter a start date and an end date');
      return;
    }
    if (TRUSTICARD_USE_MOCK) {
      toast.success(`Statement preview: ${start} → ${end} as .${statementFormat} (export API not connected).`);
    } else {
      toast.success('Preparing your statement…');
    }
    setShowStatementModal(false);
  };

  const handleConfirmDeleteCard = () => {
    const ulid = activeCard?.ulid;
    if (!ulid) return;
    setShowDeleteCardModal(false);

    if (TRUSTICARD_USE_MOCK) {
      const removeIndex = cardsList.findIndex((c) => c.ulid === ulid);
      const nextList = cardsList.filter((c) => c.ulid !== ulid);
      let newIdx = currentCardIndex;
      if (nextList.length === 0) {
        newIdx = 0;
      } else if (removeIndex !== -1) {
        if (currentCardIndex === removeIndex) {
          newIdx = Math.min(removeIndex, nextList.length - 1);
        } else if (currentCardIndex > removeIndex) {
          newIdx = currentCardIndex - 1;
        }
        newIdx = Math.max(0, Math.min(newIdx, nextList.length - 1));
      }
      setCardsList(nextList);
      setCurrentCardIndex(newIdx);
      toast.success('Card removed (preview)');
      return;
    }
    toast('Delete card API coming soon');
  };

  const handleIssueCardSubmit = async (e) => {
    e.preventDefault();
    if (TRUSTICARD_USE_MOCK) {
      toast('Issue card will be available when the API is connected.');
      return;
    }
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
        card_provider: (card_provider || 'mastercard').trim(),
      };
      if (reference_id?.trim()) body.reference_id = reference_id.trim();
      if (meta_user_id?.trim()) body.meta = { user_id: meta_user_id.trim() };

      const response = await fetch(getApiUrl('api/cardyfie/card/issue'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (response.ok && result?.success) {
        toast.success(result?.message || 'Card issued');
        setShowIssueCardModal(false);
        setIssueCardForm({
          customer_ulid: '',
          card_name: '',
          card_currency: 'USD',
          card_type: 'platinum',
          card_provider: 'mastercard',
          reference_id: '',
          meta_user_id: '',
        });
        fetchCards(cardsPage);
      } else {
        toast.error(result?.message || result?.error || 'Failed to issue card');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to issue card');
    } finally {
      setIsSubmittingIssueCard(false);
    }
  };

  const handleCreateCustomerSubmit = async (e) => {
    e.preventDefault();
    if (TRUSTICARD_USE_MOCK) {
      toast('Create customer will be available when the API is connected.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in');
      return;
    }
    const { first_name, last_name, email, date_of_birth, id_type, id_number, house_number, address_line_1, city, zip_code, country, state, reference_id, meta_user_id } = createCustomerForm;
    if (!first_name?.trim() || !last_name?.trim() || !email?.trim()) {
      toast.error('First name, last name and email are required');
      return;
    }
    setIsSubmittingCreateCustomer(true);
    try {
      const formData = new FormData();
      formData.append('first_name', first_name.trim());
      formData.append('last_name', last_name.trim());
      formData.append('email', email.trim());
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

      const response = await fetch(getApiUrl('api/cardyfie/customer'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();
      if (response.ok && result?.success) {
        const ulid = extractCustomerUlid(result);
        if (ulid) setStoredCustomerUlid(ulid);
        toast.success(result?.message || 'Customer created');
        setShowCreateCustomerModal(false);
        fetchCards(1);
        setCreateCustomerForm({
          first_name: '',
          last_name: '',
          email: '',
          date_of_birth: '',
          id_type: 'passport',
          id_number: '',
          house_number: '',
          address_line_1: '',
          city: '',
          zip_code: '',
          country: '',
          state: '',
          reference_id: '',
          meta_user_id: '',
        });
      } else {
        toast.error(result?.message || result?.error || 'Failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to create customer');
    } finally {
      setIsSubmittingCreateCustomer(false);
    }
  };

  const nCards = cardsList.length;
  nCardsRef.current = nCards;

  const markFirstCardCreationComplete = useCallback(() => {
    setHasCompletedFirstCardCreation(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TRUSTICARD_HAS_CREATED_CARD_KEY, '1');
    }
  }, []);

  const issueCardyfie = useCallback(async (token, { customerUlid, cardName, cardProvider = 'visa' }) => {
    const response = await fetch(getApiUrl('api/cardyfie/card/issue'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_ulid: customerUlid,
        card_name: cardName,
        card_currency: 'USD',
        card_provider: cardProvider,
        card_type: 'universal',
      }),
    });
    const result = await response.json();
    if (!response.ok || !result?.success) {
      throw new Error(result?.message || result?.error || 'Failed to issue card');
    }
    return result;
  }, []);

  const issueCardForExistingCustomer = useCallback(async () => {
    const customerUlid = getStoredCustomerUlid();
    if (!customerUlid) {
      toast.error('Complete card setup first');
      return false;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to create a card');
      return false;
    }
    setIsSubmittingCreateCard(true);
    try {
      const cardName = createCardBasicName.trim() || userFullName.trim() || 'My TrustiCard';
      const issueResult = await issueCardyfie(token, { customerUlid, cardName, cardProvider: 'visa' });
      markFirstCardCreationComplete();
      toast.success('TrustiCard created');
      await presentCardInfoAfterCreate(extractCardUlid(issueResult), issueResult);
      return true;
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to create card');
      return false;
    } finally {
      setIsSubmittingCreateCard(false);
    }
  }, [createCardBasicName, userFullName, issueCardyfie, markFirstCardCreationComplete, presentCardInfoAfterCreate]);

  const submitCreateCardFlow = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to create a card');
      return;
    }

    let customerUlid = getStoredCustomerUlid();

    if (!customerUlid) {
      const { first_name, last_name } = splitFullName(createCardBasicName);
      const email = userEmail.trim();
      if (!first_name || !email) {
        toast.error('Name and profile email are required');
        return;
      }
      if (!createCardBasicDateOfBirth.trim()) {
        toast.error('Date of birth is required');
        return;
      }
      if (!createCardIdNumber.trim()) {
        toast.error('ID number is required');
        return;
      }
      if (!createCardHouseNumber.trim() || !createCardAddressLine1.trim() || !createCardCity.trim() || !createCardZipCode.trim()) {
        toast.error('Complete all address fields');
        return;
      }
      if (!createCardIdFrontFile || !createCardUserImageFile) {
        toast.error('ID front image and selfie are required');
        return;
      }

      setIsSubmittingCreateCard(true);
      try {
        const formData = new FormData();
        formData.append('first_name', first_name);
        formData.append('last_name', last_name || first_name);
        formData.append('email', email);
        formData.append('date_of_birth', createCardBasicDateOfBirth.trim());
        formData.append('id_type', mapWizardIdType(createCardIdType));
        formData.append('id_number', createCardIdNumber.trim());
        formData.append('house_number', createCardHouseNumber.trim());
        formData.append('address_line_1', createCardAddressLine1.trim());
        formData.append('city', createCardCity.trim());
        formData.append('zip_code', createCardZipCode.trim());
        formData.append('country', createCardCountry.trim());
        formData.append('id_front_image', createCardIdFrontFile);
        formData.append('user_image', createCardUserImageFile);
        if (createCardIdBackFile) formData.append('id_back_image', createCardIdBackFile);

        const customerRes = await fetch(getApiUrl('api/cardyfie/customer'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const customerResult = await customerRes.json();
        if (!customerRes.ok || !customerResult?.success) {
          toast.error(customerResult?.message || customerResult?.error || 'KYC submission failed');
          return;
        }
        customerUlid = extractCustomerUlid(customerResult);
        if (!customerUlid) {
          toast.error('Customer created but ULID was not returned');
          return;
        }
        setStoredCustomerUlid(customerUlid);
      } catch (err) {
        console.error(err);
        toast.error('KYC submission failed');
        return;
      } finally {
        setIsSubmittingCreateCard(false);
      }
    }

    setIsSubmittingCreateCard(true);
    try {
      const cardName = createCardBasicName.trim() || userFullName.trim() || 'My TrustiCard';
      const issueResult = await issueCardyfie(token, { customerUlid, cardName, cardProvider: 'visa' });
      markFirstCardCreationComplete();
      toast.success('TrustiCard created');
      await presentCardInfoAfterCreate(extractCardUlid(issueResult), issueResult);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to issue card');
    } finally {
      setIsSubmittingCreateCard(false);
    }
  }, [
    createCardBasicName,
    createCardBasicDateOfBirth,
    createCardIdNumber,
    createCardIdType,
    createCardCountry,
    createCardHouseNumber,
    createCardAddressLine1,
    createCardCity,
    createCardZipCode,
    createCardIdFrontFile,
    createCardIdBackFile,
    createCardUserImageFile,
    userEmail,
    userFullName,
    issueCardyfie,
    markFirstCardCreationComplete,
    presentCardInfoAfterCreate,
  ]);

  const handleIdentityStepNext = useCallback(() => {
    if (!createCardIdFrontFile) {
      toast.error('Upload the front of your ID');
      return;
    }
    if (!createCardUserImageFile) {
      toast.error('Upload a selfie');
      return;
    }
    if (!createCardIdNumber.trim()) {
      toast.error('Enter your ID number');
      return;
    }
    setShowCreateCardIdentityModal(false);
    setShowCreateCardAddressModal(true);
  }, [createCardIdFrontFile, createCardUserImageFile, createCardIdNumber]);

  const handleOpenAddCardFlow = useCallback(() => {
    if (hasCompletedFirstCardCreation && cardsList.length > 0) {
      setShowAddCardModal(true);
    } else {
      setShowCreateCardModal(true);
    }
  }, [hasCompletedFirstCardCreation, cardsList.length]);

  const handleAddCardSubmit = async (e) => {
    e.preventDefault();
    const { card_name, card_provider } = addCardForm;
    const customer_ulid = getStoredCustomerUlid();
    if (!customer_ulid) {
      toast.error('Complete card setup first');
      return;
    }
    if (!card_name?.trim()) {
      toast.error('Card name is required');
      return;
    }
    if (TRUSTICARD_USE_MOCK) {
      const newCard = {
        ulid: `mock-${Date.now()}`,
        card_name: card_name.trim(),
        card_balance: 0,
        card_currency_code: 'USD',
        masked_pan: '**** **** **** 0000',
        card_provider: card_provider || 'mastercard',
        status: 'active',
      };
      setCardsList((prev) => {
        const next = [...prev, newCard];
        setCurrentCardIndex(next.length - 1);
        return next;
      });
      markFirstCardCreationComplete();
      setAddCardForm({
        customer_ulid: '',
        card_name: '',
        card_type: 'standard',
        card_provider: 'mastercard',
      });
      toast.success('Card added (preview)');
      setShowAddCardModal(false);
      setCardDetailsModalTab('info');
      setShowSensitiveCardInfo(false);
      setSelectedCardDetails({
        ...newCard,
        card_exp_time: '12/28',
        status: 'active',
      });
      setShowDetailsModal(true);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to add a card');
      return;
    }
    setIsSubmittingAddCard(true);
    try {
      const body = {
        customer_ulid,
        card_name: card_name.trim(),
        card_currency: 'USD',
        card_type: 'universal',
        card_provider: (card_provider || 'visa').trim(),
      };
      const response = await fetch(getApiUrl('api/cardyfie/card/issue'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (response.ok && result?.success) {
        toast.success(result?.message || 'Card added');
        markFirstCardCreationComplete();
        setAddCardForm({
          customer_ulid: '',
          card_name: '',
          card_type: 'standard',
          card_provider: 'mastercard',
        });
        await presentCardInfoAfterCreate(extractCardUlid(result), result);
      } else {
        toast.error(result?.message || result?.error || 'Failed to add card');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to add card');
    } finally {
      setIsSubmittingAddCard(false);
    }
  };

  const updateCarouselTrack = useCallback(() => {
    const el = carouselViewportRef.current;
    if (!el || nCards < 1) {
      setCarouselTrackTx(0);
      return;
    }
    const cs = getComputedStyle(el);
    const gap = parseFloat(cs.getPropertyValue('--tc-carousel-gap')) || 4;
    const slideEl = el.querySelector('.tc-v2-carousel-slide');
    const measured = slideEl?.getBoundingClientRect().width ?? 0;
    const parsedSlot = parseFloat(cs.getPropertyValue('--tc-carousel-slot'));
    const slot =
      measured > 1 ? measured : Number.isFinite(parsedSlot) && parsedSlot > 0 ? parsedSlot : 320;
    const vw = el.clientWidth;
    const step = slot + gap;
    const centerActive = currentCardIndex * step + slot / 2;
    setCarouselTrackTx(vw / 2 - centerActive);
  }, [currentCardIndex, nCards]);

  useLayoutEffect(() => {
    updateCarouselTrack();
  }, [updateCarouselTrack]);

  useEffect(() => {
    const el = carouselViewportRef.current;
    if (!el) return undefined;
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateCarouselTrack);
      return () => window.removeEventListener('resize', updateCarouselTrack);
    }
    const ro = new ResizeObserver(() => updateCarouselTrack());
    ro.observe(el);
    window.addEventListener('resize', updateCarouselTrack);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateCarouselTrack);
    };
  }, [updateCarouselTrack]);

  const handleCarouselPointerDown = useCallback((e) => {
    if (nCards <= 1) return;
    if (!e.isPrimary) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    carouselPointerRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      lastX: e.clientX,
      lastT: now,
      vx: 0,
      dragCommitted: false,
    };
    carouselDragOffsetRef.current = 0;
    setCarouselDragOffset(0);
  }, [nCards]);

  const handleCarouselPointerMove = useCallback((e) => {
    const pr = carouselPointerRef.current;
    if (pr.pointerId == null || e.pointerId !== pr.pointerId) return;
    const rawDx = e.clientX - pr.startX;

    if (!pr.dragCommitted) {
      if (Math.abs(rawDx) < 12) return;
      pr.dragCommitted = true;
      setCarouselIsDragging(true);
      try {
        carouselViewportRef.current?.setPointerCapture(e.pointerId);
      } catch (_) {
        /* ignore */
      }
    }

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const dt = Math.max(now - pr.lastT, 1);
    const stepX = e.clientX - pr.lastX;
    pr.vx = (stepX / dt) * 1000;
    pr.lastX = e.clientX;
    pr.lastT = now;

    carouselDragOffsetRef.current = rawDx;
    setCarouselDragOffset(rawDx);
  }, []);

  const finishCarouselDrag = useCallback((e) => {
    const pr = carouselPointerRef.current;
    if (pr.pointerId == null || e.pointerId !== pr.pointerId) return;

    try {
      carouselViewportRef.current?.releasePointerCapture(e.pointerId);
    } catch (_) {
      /* ignore */
    }

    const wasDrag = pr.dragCommitted;
    const dx = carouselDragOffsetRef.current;
    const vx = pr.vx;
    pr.pointerId = null;
    pr.dragCommitted = false;

    setCarouselIsDragging(false);
    carouselDragOffsetRef.current = 0;
    setCarouselDragOffset(0);

    if (!wasDrag) return;

    const THRESHOLD = 48;
    const FLICK = 450;
    let delta = 0;
    if (dx < -THRESHOLD || vx < -FLICK) delta = 1;
    else if (dx > THRESHOLD || vx > FLICK) delta = -1;

    if (delta === 0) return;

    setCurrentCardIndex((i) => {
      const n = nCardsRef.current;
      if (n < 2) return i;
      return (i + delta + n) % n;
    });
  }, []);

  const advanceCarousel = useCallback(() => {
    setCurrentCardIndex((i) => {
      const n = nCardsRef.current;
      if (n < 2) return i;
      return (i + 1 + n) % n;
    });
  }, []);

  const renderCardFace = (card, variant, options = {}) => {
    const { createPreview = false } = options;
    const isActive = variant === 'active';
    const balance = Number(card?.card_balance) || 0;
    const currency = card?.card_currency_code || 'USD';
    const balanceStr = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(balance);
    const name = card?.card_name || 'Card';
    const pan = card?.masked_pan || '**** **** **** ****';
    const prov = String(card?.card_provider || 'mastercard').toLowerCase();

    return (
      <div
        className={`tc-v2-card-face ${isActive ? 'tc-v2-card-face--active' : 'tc-v2-card-face--muted'}${createPreview ? ' tc-v2-card-face--create-preview' : ''}`}
      >
        <div className="tc-v2-card-face-top">
          <span className="tc-v2-card-face-name">{name}</span>
        </div>
        <div className="tc-v2-card-face-balance-wrap">
          <div className="tc-v2-card-face-balance">{balanceStr}</div>
        </div>
        <div className="tc-v2-card-face-bottom">
          <div className="tc-v2-card-number-block">
            <span className="tc-v2-card-number-label">Card Number</span>
            <span className="tc-v2-card-number-value">{pan}</span>
          </div>
          {prov === 'visa' ? <VisaMark light={isActive} size={48} /> : <MastercardMark size={48} />}
        </div>
      </div>
    );
  };

  const txPaginationItems = useMemo(() => {
    const total = totalTxPages;
    const cur = txTablePage;
    if (total <= 1) return [];
    const set = new Set([1, total]);
    for (let p = cur - 2; p <= cur + 2; p++) {
      if (p >= 1 && p <= total) set.add(p);
    }
    const sorted = [...set].sort((a, b) => a - b);
    const out = [];
    let prev = 0;
    sorted.forEach((p) => {
      if (prev && p - prev > 1) out.push({ type: 'ellipsis', key: `gap-${prev}-${p}` });
      out.push({ type: 'page', num: p, key: `p-${p}` });
      prev = p;
    });
    return out;
  }, [txTablePage, totalTxPages]);

  const carouselDragStepPx = readCarouselStepPx(carouselViewportRef.current);
  const carouselFractionalCenter =
    nCards > 0 && carouselDragStepPx > 0 ? currentCardIndex - carouselDragOffset / carouselDragStepPx : currentCardIndex;

  return (
    <>
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

      {isMobileMenuOpen && (
        <div className="mobile-sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} role="presentation" />
      )}

      <div className={`mobile-sidebar-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-header">
          <div className="mobile-sidebar-branding">
            <img src={logo} alt="TrustiChain" className="mobile-sidebar-logo" />
            <div className="mobile-sidebar-branding-text">
              <span className="mobile-sidebar-title">TrustiChain</span>
              <span className="mobile-sidebar-tagline">Secure escrow platform</span>
            </div>
          </div>
          <button type="button" className="mobile-sidebar-close" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="mobile-sidebar-content">
          <div className="mobile-sidebar-section">
            <p className="mobile-sidebar-section-label">{accountType === 'Business Suite' ? 'Business Suite' : 'General'}</p>
            <nav className="mobile-sidebar-nav">
              {(accountType === 'Business Suite' ? businessSuiteNav : sidebarNav).map((item) => {
                const Icon = item.icon;
                const isActive =
                  accountType === 'Business Suite'
                    ? (item.label === 'Dashboard' && location.pathname === '/dashboard') ||
                      (item.label === 'Payroll' && (location.pathname === '/payroll' || location.pathname.startsWith('/payroll/'))) ||
                      (item.label === 'Supplier Contract' && location.pathname === '/supplier-contract') ||
                      (item.label === 'Invoice' && location.pathname === '/invoice') ||
                      (item.label === 'Transactions' && location.pathname === '/transactions') ||
                      (item.label === 'Dispute' && (location.pathname === '/business-dispute' || location.pathname.startsWith('/business-dispute/')))
                    : (item.label === 'Dashboard' && location.pathname === '/dashboard') ||
                      (item.label === 'My Escrow' && location.pathname === '/my-escrow') ||
                      (item.label === 'Transactions' && location.pathname === '/transactions') ||
                      (item.label === 'Dispute' && location.pathname === '/dispute') ||
                      (item.label === 'Savings' && location.pathname === '/savings') ||
                      (item.label === 'Trusticard' && location.pathname === '/trusticard');
                const handleNavClick = () => {
                  setIsMobileMenuOpen(false);
                  if (accountType === 'Business Suite') {
                    if (item.label === 'Dashboard') navigate('/dashboard', { state: { accountType: 'Business Suite' } });
                    else if (item.label === 'Payroll') navigate('/payroll');
                    else if (item.label === 'Supplier Contract') navigate('/supplier-contract');
                    else if (item.label === 'Invoice') navigate('/invoice');
                    else if (item.label === 'Transactions') navigate('/transactions', { state: { accountType: 'Business Suite' } });
                    else if (item.label === 'Dispute') navigate('/business-dispute');
                    else if (item.label === 'Compliance') toast('Compliance workspace coming soon');
                    return;
                  }
                  if (item.label === 'Dashboard') navigate('/dashboard');
                  else if (item.label === 'My Escrow') navigate('/my-escrow');
                  else if (item.label === 'Transactions') navigate('/transactions');
                  else if (item.label === 'Dispute') navigate('/dispute');
                  else if (item.label === 'Savings') navigate('/savings');
                  else if (item.label === 'Trusticard') navigate('/trusticard');
                  else if (item.label === 'Compliance') toast('Coming soon');
                  else if (item.label === 'P2P trading') toast('Coming soon');
                };
                const navBadge = getNavBadge(item);
                return (
                  <button key={item.label} type="button" className={`mobile-sidebar-nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {navBadge != null && navBadge !== '' ? <span className="mobile-sidebar-badge">{navBadge}</span> : null}
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
                    <button key={item.label} type="button" className="mobile-sidebar-nav-item" onClick={() => setIsMobileMenuOpen(false)}>
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
          <SidebarWalletSection
            variant="mobile"
            isLoading={isLoadingSidebarWallet}
            onViewWallet={() => {
              setIsMobileMenuOpen(false);
              handleSidebarViewWallet();
            }}
          />
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
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (item.label === 'Settings') navigate('/settings');
                    }}
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
              <button type="button" className="mobile-sidebar-help-cta">Contact us</button>
            </div>
            <div className="mobile-sidebar-trustiscore">
              <span className="mobile-sidebar-trustiscore-label">Trustiscore</span>
              <span className="mobile-sidebar-trustiscore-badge">{trustiscoreBadgeText}</span>
            </div>
            <button type="button" className="mobile-sidebar-logout" onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard dashboard--trusticard">
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
                  Trusticard: '/trusticard',
              };
              const targetPath = routeByLabel[item.label];
              const isActive = (() => {
                if (!targetPath) return false;
                  if (targetPath === '/dispute') return location.pathname === '/dispute' || location.pathname.startsWith('/dispute/');
                return location.pathname === targetPath;
              })();
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (targetPath) navigate(targetPath);
                      else toast('Coming soon');
                    }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                    {getNavBadge(item) != null && getNavBadge(item) !== '' ? <span className="sidebar-badge">{getNavBadge(item)}</span> : null}
                </button>
              );
            })}
          </nav>
        </div>
        <SidebarWalletSection
          isLoading={isLoadingSidebarWallet}
          onViewWallet={handleSidebarViewWallet}
        />
        <div className="sidebar-section">
          <p className="sidebar-section-label">Support</p>
          <nav className="sidebar-nav">
            {supportNav.map((item) => {
              const Icon = item.icon;
              return (
                  <button key={item.label} type="button" className="sidebar-nav-item" onClick={() => navigate('/settings')}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="sidebar-bottom-section">
          <div className="sidebar-help-card">
              <div className="help-icon-large"><HelpCircle size={24} /></div>
            <h3>Help Center</h3>
            <p>Having trouble in Trustichain? Please contact us</p>
              <button type="button" className="help-cta">Contact us</button>
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

        <main className="dashboard-main dashboard-main--trusticard-v2">
          <div className="trusticard-v2-column">
        <header className="dashboard-header">
          <div className="header-info">
            <p className="header-date">{formattedToday}</p>
            <h1>Welcome Back !</h1>
          </div>
          <div className="header-search-group">
            <label className="header-search">
                <input type="search" placeholder="Search" />
            </label>
              <span className="search-divider" aria-hidden />
              <button type="button" className="search-icon-btn" aria-label="Search"><Search size={18} /></button>
          </div>
          <div className="header-actions">
            {kycComplete ? (
              <>
                  <button
                    type="button"
                    className="header-trustiscore-box"
                    role="status"
                    aria-label={`TrustiScore ${trustiscoreBadgeText}`}
                    onClick={openTrustiscoreModal}
                  >
                    <span className="header-trustiscore-label">TrustiScore</span>
                    <span className="header-trustiscore-value">{trustiscoreBadgeText}</span>
                  </button>
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
              <button type="button" className="header-bell" onClick={() => setShowNotificationModal(true)} aria-label="Notifications">
              <Bell size={18} />
            </button>
              <button type="button" className="header-bell tc-v2-header-menu-btn" aria-label="Menu" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu size={18} />
              </button>
            <div className="header-user">
              <HeaderProfileAvatarNav>
                  {userAvatar ? <img src={userAvatar} alt="" className="user-avatar-img" /> : userInitials}
                <HeaderProfileVerifyBadge show={kycComplete} />
              </HeaderProfileAvatarNav>
            </div>
          </div>
        </header>

            <div className="trusticard-content tc-v2">
            <p className="tc-v2-breadcrumb tc-v2-breadcrumb--hide-mobile">
              <Link to="/dashboard">General</Link>
              <span className="tc-v2-breadcrumb-sep">&gt;</span>
              <span>Dashboard</span>
            </p>

            <section className="tc-v2-my-cards" aria-labelledby="tc-my-cards-title">
              <div className="tc-v2-section-head">
                <div className="tc-v2-section-title-row">
                  <span className="tc-v2-accent-bar" aria-hidden />
                  <h2 id="tc-my-cards-title" className="tc-v2-section-title">My Cards</h2>
              </div>
                <button type="button" className="tc-v2-add-card-link" onClick={handleOpenAddCardFlow}>
                  + Add card
                </button>
            </div>

              {isLoadingCards ? (
                <TrustiCardMyCardsSkeleton />
              ) : nCards === 0 ? (
                <div className="tc-v2-empty-cards">
                  <p>No cards yet. Create your first TrustiCard to get started.</p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <button type="button" className="trusticard-btn-primary" onClick={handleOpenAddCardFlow}>Create card</button>
                </div>
              </div>
                      ) : (
                        <>
                  <div className="tc-v2-cards-layout">
                    <div className="tc-v2-card-list-column">
                      <p className="tc-v2-card-list-label">My Card List</p>
                      <div className="tc-v2-card-list" role="listbox" aria-label="Cards">
                        {cardsList.map((c, i) => (
                          <button
                            key={c.ulid || i}
                            type="button"
                            className={`tc-v2-card-list-item ${i === currentCardIndex ? 'active' : ''}`}
                            onClick={() => setCurrentCardIndex(i)}
                            role="option"
                            aria-selected={i === currentCardIndex}
                          >
                            {c.card_name || `Card ${i + 1}`}
                          </button>
                        ))}
                    </div>
                </div>

                    <div>
                      <div
                        className={`tc-v2-carousel-viewport${nCards > 1 ? ' tc-v2-carousel-viewport--draggable' : ''}${carouselIsDragging ? ' tc-v2-carousel-viewport--dragging' : ''}`}
                        ref={carouselViewportRef}
                        onPointerDown={handleCarouselPointerDown}
                        onPointerMove={handleCarouselPointerMove}
                        onPointerUp={finishCarouselDrag}
                        onPointerCancel={finishCarouselDrag}
                      >
                        <div
                          className={`tc-v2-carousel-track${carouselIsDragging ? ' tc-v2-carousel-track--dragging' : ''}`}
                          style={{ transform: `translateX(${carouselTrackTx + carouselDragOffset}px)` }}
                        >
                          {cardsList.map((c, i) => {
                            const offsetFloat = circularFractionalOffset(i, carouselFractionalCenter, nCards);
                            const clampVisual = Math.max(-2, Math.min(2, offsetFloat));
                            const rotateY = clampVisual * 22;
                            const absOff = Math.abs(offsetFloat);
                            const scale = 1 - Math.min(absOff, 1) * (1 - 0.88);
                            let origin = 'center center';
                            if (offsetFloat < -0.02) origin = 'left center';
                            if (offsetFloat > 0.02) origin = 'right center';
                            const opacity = 1 - Math.min(absOff, 1) * (1 - 0.55);
                            const filter = absOff > 0.06 ? 'grayscale(0.35)' : 'none';
                            const isCenterSlide = absOff < 0.48;
                            const isActiveFace = absOff < 0.42;
                            return (
                              <div
                                key={c.ulid || i}
                                className={`tc-v2-carousel-slide ${isCenterSlide ? 'tc-v2-carousel-slide--center' : 'tc-v2-carousel-slide--side'}`}
                              >
                                <div
                                  className="tc-v2-carousel-slide-inner"
                                  data-active={isActiveFace ? 'true' : undefined}
                                  style={{
                                    transform: `perspective(1100px) rotateY(${rotateY}deg) scale(${scale})`,
                                    transformOrigin: origin,
                                    opacity,
                                    filter,
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="tc-v2-carousel-card-btn"
                                    onClick={() => {
                                      if (!isActiveFace) setCurrentCardIndex(i);
                                    }}
                                    aria-current={isActiveFace ? 'true' : undefined}
                                  >
                                    {renderCardFace(c, isActiveFace ? 'active' : 'peek')}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {nCards > 1 ? (
                          <button
                            type="button"
                            className="tc-v2-carousel-next-edge"
                            aria-label="Next card"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={advanceCarousel}
                          >
                            <ChevronRight size={22} strokeWidth={2.5} aria-hidden />
                          </button>
                        ) : null}
                        {nCards > 1 ? (
                          <button
                            type="button"
                            className="tc-v2-delete-floating tc-v2-delete-floating--static"
                            aria-label="Remove card"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => {
                              if (activeCard?.ulid) setShowDeleteCardModal(true);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : null}
                      </div>

                      <div className="tc-v2-quick-actions">
                        <button type="button" className="tc-v2-qaction" onClick={() => setShowFundModal(true)}>
                          <span className="tc-v2-qaction-ring"><Plus size={22} /></span>
                          Add
                  </button>
                        <button type="button" className="tc-v2-qaction" onClick={() => setShowWithdrawModal(true)} disabled={!activeCard?.ulid}>
                          <span className="tc-v2-qaction-ring"><ArrowDownToLine size={22} /></span>
                          Withdraw
                  </button>
                        <button type="button" className="tc-v2-qaction" onClick={() => { setShowDetailsModal(true); setShowSensitiveCardInfo(false); }} disabled={!activeCard?.ulid}>
                          <span className="tc-v2-qaction-ring"><List size={22} /></span>
                          Details
                          </button>
                        <button
                          type="button"
                          className="tc-v2-qaction"
                          onClick={() => {
                            if (freezeCard) handleFreezeToggle();
                            else setShowFreezeConfirmModal(true);
                          }}
                          disabled={isFreezing || !activeCard?.ulid}
                        >
                          <span className="tc-v2-qaction-ring"><Snowflake size={22} /></span>
                          {freezeCard ? 'Unfreeze' : 'Freeze'}
                        </button>
                        <button
                          type="button"
                          className="tc-v2-qaction tc-v2-qaction--danger"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => {
                            if (activeCard?.ulid) setShowDeleteCardModal(true);
                          }}
                          disabled={!activeCard?.ulid}
                        >
                          <span className="tc-v2-qaction-ring tc-v2-qaction-ring--danger">
                            <Trash2 size={22} />
                          </span>
                          Delete
                        </button>
                  </div>
                    </div>
                  </div>
                </>
              )}
            </section>

            <section className="tc-v2-tx-section" aria-labelledby="tc-tx-title">
              <div className="tc-v2-tx-head">
                <div className="tc-v2-section-title-row">
                  <span className="tc-v2-accent-bar" aria-hidden />
                  <h2 id="tc-tx-title" className="tc-v2-section-title tc-v2-tx-title">
                    Transaction History
                  </h2>
                </div>
                <div className="tc-v2-tx-toolbar-row">
                  <button type="button" className="tc-v2-tx-pill-btn" onClick={() => setShowStatementModal(true)}>
                    Statement
                  </button>
                  <div className="tc-v2-tx-select-shell tc-v2-tx-toolbar-desktop-only">
                    <select
                      className="tc-v2-tx-select"
                      value={transactionPeriod}
                      onChange={(e) => setTransactionPeriod(e.target.value)}
                      aria-label="Period"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                    <ChevronDown size={16} className="tc-v2-tx-select-chevron" aria-hidden />
                  </div>
                  <div className="tc-v2-tx-filter-anchor" ref={txFilterAnchorRef}>
                    <button
                      type="button"
                      className={`tc-v2-tx-filter-square tc-v2-tx-toolbar-desktop-only ${txFilterMenuOpen ? 'is-open' : ''}`}
                      aria-label="Filter transactions"
                      aria-expanded={txFilterMenuOpen}
                      onClick={() => setTxFilterMenuOpen((o) => !o)}
                    >
                      <Filter size={18} />
                    </button>
                    <button
                      type="button"
                      className={`tc-v2-tx-filter-mobile-circle tc-v2-tx-toolbar-mobile-only ${txFilterMenuOpen ? 'is-open' : ''}`}
                      aria-label="Filter transactions"
                      aria-expanded={txFilterMenuOpen}
                      onClick={() => setTxFilterMenuOpen((o) => !o)}
                    >
                      <ChevronRight size={22} strokeWidth={2.5} aria-hidden />
                    </button>
                    {txFilterMenuOpen ? (
                      <div className="tc-v2-tx-filter-popover" role="menu">
                        {[
                          { value: 'All', label: 'All transactions' },
                          { value: 'Received', label: 'Received' },
                          { value: 'Sent', label: 'Sent' },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            role="menuitem"
                            className={`tc-v2-tx-filter-option ${transactionFilter === opt.value ? 'active' : ''}`}
                            onClick={() => {
                              setTransactionFilter(opt.value);
                              setTxFilterMenuOpen(false);
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="tc-v2-tx-table-wrap tc-v2-tx-desktop-only">
                <table className="tc-v2-table--tx-ref">
                  <thead>
                    <tr>
                      <th className="tc-v2-th-check">
                        <span className="sr-only">Select</span>
                      </th>
                      <th>Transaction</th>
                      <th>Transaction ID</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingCardTransactions ? (
                      <tr>
                        <td colSpan={6}>
                          <DashboardEscrowTableSkeleton rows={5} columns={6} />
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="tc-v2-tx-empty-cell">
                          No transactions for this card
                        </td>
                      </tr>
                    ) : (
                      paginatedTransactions.map((tx) => (
                        <tr key={`${tx.id}-${tx.date}`}>
                          <td className="tc-v2-td-check">
                            <input type="checkbox" className="tc-v2-tx-checkbox" aria-label={`Select ${tx.id}`} />
                          </td>
                          <td>
                            <div className="tc-v2-tx-cell-ref">
                              <div className="tc-v2-tx-icon-ref" aria-hidden>
                                <ArrowDown size={15} strokeWidth={2.5} />
                              </div>
                              <div className="tc-v2-tx-type-stack">
                                <span className="tc-v2-tx-type-label">{tx.type}</span>
                                {tx.typeLabel && tx.typeLabel !== tx.type ? (
                                  <span className="tc-v2-tx-type-meta">{tx.typeLabel}</span>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="tc-v2-tx-id-ref">{truncateId(tx.id)}</span>
                          </td>
                          <td>
                            <span className="tc-v2-amount-ref">{tx.amount}</span>
                            <span className="tc-v2-amount-usd-ref">{tx.usd}</span>
                          </td>
                          <td>
                            <span className={`tc-v2-status-ref tc-v2-status-ref--${tx.statusTone || 'neutral'}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="tc-v2-td-date">{tx.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="tc-v2-tx-mobile-only">
                {isLoadingCardTransactions ? (
                  <ul className="tc-v2-tx-mobile-list" aria-label="Transaction history">
                    <TrustiCardTxMobileSkeleton count={4} />
                  </ul>
                ) : filteredTransactions.length === 0 ? (
                  <p className="tc-v2-tx-mobile-empty">No transactions for this card</p>
                ) : (
                  <ul className="tc-v2-tx-mobile-list" aria-label="Transaction history">
                    {filteredTransactions.map((tx) => (
                      <li key={`${tx.id}-${tx.date}-m`} className="tc-v2-tx-mobile-row">
                        <div className="tc-v2-tx-mobile-icon" aria-hidden>
                          <ArrowDown size={15} strokeWidth={2.5} />
                        </div>
                        <div className="tc-v2-tx-mobile-copy">
                          <span className="tc-v2-tx-mobile-type">{tx.type}</span>
                          <span className="tc-v2-tx-mobile-sub">{tx.subtitle || `${tx.amount} ${tx.usd}`}</span>
                        </div>
                        <div className="tc-v2-tx-mobile-aside">
                          <span className={`tc-v2-status-ref tc-v2-status-ref--${tx.statusTone || 'neutral'}`}>{tx.status}</span>
                          <span className="tc-v2-tx-mobile-date">{tx.date}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {filteredTransactions.length > txPageSize ? (
                <div className="tc-v2-pagination-ref tc-v2-tx-desktop-only">
                  <button
                    type="button"
                    className="tc-v2-page-nav tc-v2-page-nav--prev"
                    disabled={txTablePage <= 1}
                    onClick={() => setTxTablePage((p) => Math.max(1, p - 1))}
                  >
                    Prev {txPageSize}
                  </button>
                  <div className="tc-v2-page-nums-ref">
                    {txPaginationItems.map((item) =>
                      item.type === 'ellipsis' ? (
                        <span key={item.key} className="tc-v2-page-ellipsis" aria-hidden>
                          ...
                        </span>
                      ) : (
                        <button
                          key={item.key}
                          type="button"
                          className={`tc-v2-page-num-ref ${item.num === txTablePage ? 'is-active' : ''}`}
                          onClick={() => setTxTablePage(item.num)}
                        >
                          {item.num}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    type="button"
                    className="tc-v2-page-nav tc-v2-page-nav--next"
                    disabled={txTablePage >= totalTxPages}
                    onClick={() => setTxTablePage((p) => Math.min(totalTxPages, p + 1))}
                  >
                    Next {txPageSize}
                  </button>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </main>
            </div>

      {/* Create Card — onboarding sheet from + Add card */}
      {showCreateCardModal && (
        <div
          className="trusticard-modal-overlay trusticard-modal-overlay--create-card-fullbleed"
          onClick={() => setShowCreateCardModal(false)}
          role="presentation"
        >
          <div className="trusticard-modal-panel trusticard-create-card-modal" onClick={(e) => e.stopPropagation()}>
            <div className="trusticard-modal-head trusticard-add-funds-head">
              <div className="trusticard-add-funds-title-row">
                <span className="trusticard-add-funds-accent" aria-hidden />
                <h2>Create Card</h2>
              </div>
              <button type="button" className="trusticard-modal-close" onClick={() => setShowCreateCardModal(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="trusticard-modal-body trusticard-create-card-body">
              <div className="trusticard-create-card-preview">
                {renderCardFace(CREATE_CARD_PREVIEW, 'active', { createPreview: true })}
              </div>

              <ul className="trusticard-create-card-benefits" aria-label="Card benefits">
                <li className="trusticard-create-card-benefit">
                  <span className="trusticard-create-card-benefit-icon" aria-hidden>
                    <ShieldCheck size={22} strokeWidth={2} />
                  </span>
                  <div className="trusticard-create-card-benefit-text">
                    <p className="trusticard-create-card-benefit-title">3D secure transactions</p>
                    <p className="trusticard-create-card-benefit-sub">Shop confidently with extra payment protection.</p>
                  </div>
                </li>
                <li className="trusticard-create-card-benefit">
                  <span className="trusticard-create-card-benefit-icon" aria-hidden>
                    <Wallet size={22} strokeWidth={2} />
                  </span>
                  <div className="trusticard-create-card-benefit-text">
                    <p className="trusticard-create-card-benefit-title">Spend directly from your balance</p>
                    <p className="trusticard-create-card-benefit-sub">Seamlessly spend from your balances.</p>
                  </div>
                </li>
                <li className="trusticard-create-card-benefit">
                  <span className="trusticard-create-card-benefit-icon" aria-hidden>
                    <Award size={22} strokeWidth={2} />
                  </span>
                  <div className="trusticard-create-card-benefit-text">
                    <p className="trusticard-create-card-benefit-title">Enjoy Reward and exclusive deals</p>
                    <p className="trusticard-create-card-benefit-sub">
                      Get special offers and perks that give you more value every time you spend.
                    </p>
                  </div>
                </li>
              </ul>

              <button
                type="button"
                className="trusticard-create-card-submit trusticard-btn-primary"
                disabled={isSubmittingCreateCard}
                onClick={async () => {
                  const existingUlid = getStoredCustomerUlid();
                  if (existingUlid && !TRUSTICARD_USE_MOCK) {
                    setShowCreateCardModal(false);
                    const ok = await issueCardForExistingCustomer();
                    if (!ok) setShowCreateCardModal(true);
                    return;
                  }
                  setShowCreateCardModal(false);
                  setShowCreateCardKycModal(true);
                }}
              >
                {isSubmittingCreateCard ? '…' : 'Create Card'}
              </button>

              <p className="trusticard-add-funds-footnote trusticard-create-card-footnote">
                <Info size={15} className="trusticard-add-funds-footnote-icon" aria-hidden strokeWidth={2.5} />
                Your funds will be added to your account within seconds or refunded if there&apos;s an issue.
              </p>
            </div>
          </div>
        </div>
      )}

      {showCreateCardKycModal && (
        <div
          className="trusticard-modal-overlay trusticard-modal-overlay--create-card-fullbleed"
          onClick={() => setShowCreateCardKycModal(false)}
          role="presentation"
        >
          <div
            className="trusticard-modal-panel trusticard-create-card-kyc-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="trusticard-create-card-kyc-title"
          >
            <div className="trusticard-modal-head trusticard-add-funds-head">
              <div className="trusticard-add-funds-title-row">
                <span className="trusticard-add-funds-accent" aria-hidden />
                <h2 id="trusticard-create-card-kyc-title">Create Card</h2>
              </div>
              <button
                type="button"
                className="trusticard-modal-close"
                onClick={() => setShowCreateCardKycModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="trusticard-modal-body trusticard-create-card-kyc-body">
              <div className="trusticard-create-card-kyc-card">
                <h3 className="trusticard-create-card-kyc-heading">Update account information</h3>

                <div className="trusticard-create-card-kyc-list" aria-label="KYC checklist">
                  <div className="trusticard-create-card-kyc-item">
                    <span className="trusticard-create-card-kyc-icon" aria-hidden>
                      <CreditCard size={18} strokeWidth={2} />
                    </span>
                    <span className="trusticard-create-card-kyc-copy">
                      <strong>Basic information</strong>
                      <small>Name, Gender and date of birth</small>
                    </span>
                  </div>

                  <div className="trusticard-create-card-kyc-item">
                    <span className="trusticard-create-card-kyc-icon" aria-hidden>
                      <Crosshair size={18} strokeWidth={2} />
                    </span>
                    <span className="trusticard-create-card-kyc-copy">
                      <strong>Address information</strong>
                      <small>Your address and proof of address</small>
                    </span>
                  </div>

                  <div className="trusticard-create-card-kyc-item">
                    <span className="trusticard-create-card-kyc-icon" aria-hidden>
                      <FileCheck size={18} strokeWidth={2} />
                    </span>
                    <span className="trusticard-create-card-kyc-copy">
                      <strong>Identity verification</strong>
                      <small>Your ID document and identity information</small>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="trusticard-create-card-kyc-submit trusticard-btn-primary"
                  disabled={isSubmittingCreateCard}
                  onClick={async () => {
                    const existingUlid = getStoredCustomerUlid();
                    if (existingUlid && !TRUSTICARD_USE_MOCK) {
                      setShowCreateCardKycModal(false);
                      const ok = await issueCardForExistingCustomer();
                      if (!ok) setShowCreateCardKycModal(true);
                      return;
                    }
                    setShowCreateCardKycModal(false);
                    setShowCreateCardIdentityModal(true);
                  }}
                >
                  {isSubmittingCreateCard ? '…' : 'Update KYC'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateCardIdentityModal && (
        <div
          className="trusticard-modal-overlay trusticard-modal-overlay--create-card-fullbleed"
          onClick={() => setShowCreateCardIdentityModal(false)}
          role="presentation"
        >
          <div
            className="trusticard-modal-panel trusticard-create-card-identity-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="trusticard-create-card-identity-title"
          >
            <div className="trusticard-modal-head trusticard-add-funds-head">
              <div className="trusticard-add-funds-title-row">
                <span className="trusticard-add-funds-accent" aria-hidden />
                <h2 id="trusticard-create-card-identity-title">Create Card</h2>
              </div>
              <button
                type="button"
                className="trusticard-modal-close"
                onClick={() => setShowCreateCardIdentityModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="trusticard-modal-body trusticard-create-card-identity-body">
              <h3 className="trusticard-create-card-identity-heading">Identify Verification</h3>

              <div className="trusticard-create-card-identity-mode-row" role="radiogroup" aria-label="Verification mode">
                <button
                  type="button"
                  className={`trusticard-create-card-identity-mode ${createCardVerificationMode === 'id' ? 'is-active' : ''}`}
                  onClick={() => setCreateCardVerificationMode('id')}
                  aria-pressed={createCardVerificationMode === 'id'}
                >
                  <span className="trusticard-create-card-identity-ring" aria-hidden />
                  ID Verification
                </button>
                <button
                  type="button"
                  className={`trusticard-create-card-identity-mode ${createCardVerificationMode === 'selfie' ? 'is-active' : ''}`}
                  onClick={() => setCreateCardVerificationMode('selfie')}
                  aria-pressed={createCardVerificationMode === 'selfie'}
                >
                  <span className="trusticard-create-card-identity-ring" aria-hidden />
                  Selfie
                </button>
              </div>

              <label className="trusticard-create-card-identity-label" htmlFor="trusticard-create-card-country">Country</label>
              <div className={`trusticard-create-card-country-wrap ${createCardCountryMenuOpen ? 'is-open' : ''}`}>
                <span className="trusticard-create-card-country-dot" aria-hidden />
                <button
                  id="trusticard-create-card-country"
                  type="button"
                  className="trusticard-create-card-country-trigger"
                  onClick={() => setCreateCardCountryMenuOpen((v) => !v)}
                  aria-expanded={createCardCountryMenuOpen}
                  aria-haspopup="listbox"
                >
                  <span className="trusticard-create-card-country-value">{createCardCountry}</span>
                  <ChevronDown size={18} className="trusticard-create-card-country-chevron" aria-hidden />
                </button>
                {createCardCountryMenuOpen ? (
                  <div className="trusticard-create-card-country-menu" role="listbox" aria-label="Country">
                    {['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Rwanda', 'Uganda'].map((country) => (
                      <button
                        key={country}
                        type="button"
                        role="option"
                        aria-selected={createCardCountry === country}
                        className={`trusticard-create-card-country-option ${createCardCountry === country ? 'is-active' : ''}`}
                        onClick={() => {
                          setCreateCardCountry(country);
                          setCreateCardCountryMenuOpen(false);
                        }}
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <label className="trusticard-create-card-identity-label">NIN</label>
              <div className="trusticard-create-card-id-tabs" role="tablist" aria-label="Identity type">
                {['NIN', 'Drivers Licences', 'Voter Card', 'Passport'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`trusticard-create-card-id-tab ${createCardIdType === opt ? 'is-active' : ''}`}
                    onClick={() => setCreateCardIdType(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <label className="trusticard-create-card-identity-label" htmlFor="trusticard-create-card-id-number">NIN</label>
              <input
                id="trusticard-create-card-id-number"
                type="text"
                className="trusticard-create-card-id-input"
                placeholder="Enter"
                value={createCardIdNumber}
                onChange={(e) => setCreateCardIdNumber(e.target.value)}
              />

              <label className="trusticard-create-card-identity-label">ID front</label>
              <label className="trusticard-create-card-proof-upload" htmlFor="trusticard-create-card-id-front">
                <span className={`trusticard-create-card-proof-name ${createCardIdFrontFile ? 'has-file' : ''}`}>
                  {createCardIdFrontFile?.name || 'Choose a file'}
                </span>
                <span className="trusticard-create-card-proof-action">Browse</span>
                <input
                  id="trusticard-create-card-id-front"
                  type="file"
                  accept="image/*"
                  className="trusticard-create-card-proof-input"
                  onChange={(e) => setCreateCardIdFrontFile(e.target.files?.[0] || null)}
                />
              </label>

              <label className="trusticard-create-card-identity-label">ID back (optional)</label>
              <label className="trusticard-create-card-proof-upload" htmlFor="trusticard-create-card-id-back">
                <span className={`trusticard-create-card-proof-name ${createCardIdBackFile ? 'has-file' : ''}`}>
                  {createCardIdBackFile?.name || 'Choose a file'}
                </span>
                <span className="trusticard-create-card-proof-action">Browse</span>
                <input
                  id="trusticard-create-card-id-back"
                  type="file"
                  accept="image/*"
                  className="trusticard-create-card-proof-input"
                  onChange={(e) => setCreateCardIdBackFile(e.target.files?.[0] || null)}
                />
              </label>

              <label className="trusticard-create-card-identity-label">Selfie</label>
              <label className="trusticard-create-card-proof-upload" htmlFor="trusticard-create-card-user-image">
                <span className={`trusticard-create-card-proof-name ${createCardUserImageFile ? 'has-file' : ''}`}>
                  {createCardUserImageFile?.name || 'Choose a file'}
                </span>
                <span className="trusticard-create-card-proof-action">Browse</span>
                <input
                  id="trusticard-create-card-user-image"
                  type="file"
                  accept="image/*"
                  className="trusticard-create-card-proof-input"
                  onChange={(e) => setCreateCardUserImageFile(e.target.files?.[0] || null)}
                />
              </label>

              <button
                type="button"
                className="trusticard-create-card-identity-submit trusticard-btn-primary"
                onClick={handleIdentityStepNext}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateCardAddressModal && (
        <div
          className="trusticard-modal-overlay trusticard-modal-overlay--create-card-fullbleed"
          onClick={() => setShowCreateCardAddressModal(false)}
          role="presentation"
        >
          <div
            className="trusticard-modal-panel trusticard-create-card-address-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="trusticard-create-card-address-title"
          >
            <div className="trusticard-modal-head trusticard-add-funds-head">
              <div className="trusticard-add-funds-title-row">
                <span className="trusticard-add-funds-accent" aria-hidden />
                <h2 id="trusticard-create-card-address-title">Create Card</h2>
              </div>
              <button
                type="button"
                className="trusticard-modal-close"
                onClick={() => setShowCreateCardAddressModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="trusticard-modal-body trusticard-create-card-address-body">
              <h3 className="trusticard-create-card-address-heading">Basic Information</h3>

              <label className="trusticard-create-card-address-label" htmlFor="trusticard-create-card-basic-name">Name</label>
              <input
                id="trusticard-create-card-basic-name"
                type="text"
                className="trusticard-create-card-address-input"
                placeholder="Add"
                value={createCardBasicName}
                onChange={(e) => setCreateCardBasicName(e.target.value)}
              />

              <label className="trusticard-create-card-address-label" htmlFor="trusticard-create-card-basic-dob">Date of birth</label>
              <div className="trusticard-create-card-basic-dob-wrap">
                <input
                  id="trusticard-create-card-basic-dob"
                  type="text"
                  className="trusticard-create-card-address-input trusticard-create-card-basic-dob-input"
                  placeholder="Select"
                  value={createCardBasicDateOfBirth}
                  onChange={(e) => setCreateCardBasicDateOfBirth(e.target.value)}
                />
                <Calendar size={18} className="trusticard-create-card-basic-dob-icon" aria-hidden />
              </div>

              <label className="trusticard-create-card-address-label" htmlFor="trusticard-create-card-basic-gender">Gender</label>
              <div className="trusticard-create-card-basic-gender-wrap">
                <select
                  id="trusticard-create-card-basic-gender"
                  className="trusticard-create-card-address-input trusticard-create-card-basic-gender-select"
                  value={createCardBasicGender}
                  onChange={(e) => setCreateCardBasicGender(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <ChevronDown size={18} className="trusticard-create-card-basic-gender-chevron" aria-hidden />
              </div>

              <label className="trusticard-create-card-address-label" htmlFor="trusticard-create-card-house-number">House number</label>
              <input
                id="trusticard-create-card-house-number"
                type="text"
                className="trusticard-create-card-address-input"
                placeholder="Add"
                value={createCardHouseNumber}
                onChange={(e) => setCreateCardHouseNumber(e.target.value)}
              />

              <label className="trusticard-create-card-address-label" htmlFor="trusticard-create-card-address-line">Address line</label>
              <input
                id="trusticard-create-card-address-line"
                type="text"
                className="trusticard-create-card-address-input"
                placeholder="Add"
                value={createCardAddressLine1}
                onChange={(e) => setCreateCardAddressLine1(e.target.value)}
              />

              <label className="trusticard-create-card-address-label" htmlFor="trusticard-create-card-city">City</label>
              <input
                id="trusticard-create-card-city"
                type="text"
                className="trusticard-create-card-address-input"
                placeholder="Add"
                value={createCardCity}
                onChange={(e) => setCreateCardCity(e.target.value)}
              />

              <label className="trusticard-create-card-address-label" htmlFor="trusticard-create-card-zip">Zip code</label>
              <input
                id="trusticard-create-card-zip"
                type="text"
                className="trusticard-create-card-address-input"
                placeholder="Add"
                value={createCardZipCode}
                onChange={(e) => setCreateCardZipCode(e.target.value)}
              />

              <button
                type="button"
                className="trusticard-create-card-address-submit trusticard-btn-primary"
                disabled={isSubmittingCreateCard}
                onClick={() => submitCreateCardFlow()}
              >
                {isSubmittingCreateCard ? '…' : 'Update KYC'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateCardSuccessModal && (
        <div
          className="trusticard-create-card-success-overlay"
          onClick={() => {
            markFirstCardCreationComplete();
            void presentCardInfoAfterCreate(activeCard?.ulid);
          }}
          role="presentation"
        >
          <div
            className="trusticard-create-card-success-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="trusticard-create-card-success-title"
          >
            <button
              type="button"
              className="trusticard-create-card-success-close"
              onClick={() => {
                markFirstCardCreationComplete();
                void presentCardInfoAfterCreate(activeCard?.ulid);
              }}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="trusticard-create-card-success-icon" aria-hidden>
              <Check size={42} strokeWidth={3.5} />
            </div>

            <h3 id="trusticard-create-card-success-title" className="trusticard-create-card-success-title">
              Trusticard Created
            </h3>
            <p className="trusticard-create-card-success-copy">
              You have successfully created a Trusticard
            </p>

            <button
              type="button"
              className="trusticard-create-card-success-submit trusticard-btn-primary"
              onClick={() => {
                markFirstCardCreationComplete();
                void presentCardInfoAfterCreate(activeCard?.ulid);
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Add Card — shown after first card has been created */}
      {showAddCardModal && (
        <div
          className="trusticard-modal-overlay trusticard-modal-overlay--create-card-fullbleed"
          onClick={() => !isSubmittingAddCard && setShowAddCardModal(false)}
          role="presentation"
        >
          <div
            className="trusticard-modal-panel trusticard-add-card-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="trusticard-add-card-title"
          >
            <div className="trusticard-modal-head trusticard-add-funds-head">
              <div className="trusticard-add-funds-title-row">
                <span className="trusticard-add-funds-accent" aria-hidden />
                <h2 id="trusticard-add-card-title">Add Card</h2>
              </div>
              <button
                type="button"
                className="trusticard-modal-close"
                disabled={isSubmittingAddCard}
                onClick={() => setShowAddCardModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form className="trusticard-modal-body trusticard-add-card-body" onSubmit={handleAddCardSubmit}>
              <label className="trusticard-create-card-address-label" htmlFor="trusticard-add-card-name">
                Card Name
              </label>
              <input
                id="trusticard-add-card-name"
                type="text"
                className="trusticard-create-card-address-input trusticard-add-card-input"
                placeholder="Add"
                value={addCardForm.card_name}
                onChange={(e) => setAddCardForm({ ...addCardForm, card_name: e.target.value })}
                required
              />

              <label className="trusticard-create-card-address-label" htmlFor="trusticard-add-card-type">
                Type
              </label>
              <div className="trusticard-create-card-basic-gender-wrap">
                <select
                  id="trusticard-add-card-type"
                  className="trusticard-create-card-address-input trusticard-create-card-basic-gender-select trusticard-add-card-select"
                  value={addCardForm.card_type}
                  onChange={(e) => setAddCardForm({ ...addCardForm, card_type: e.target.value })}
                >
                  <option value="standard">Standard</option>
                  <option value="platinum">Platinum</option>
                  <option value="gold">Gold</option>
                </select>
                <ChevronDown size={18} className="trusticard-create-card-basic-gender-chevron" aria-hidden />
              </div>

              <label className="trusticard-create-card-address-label" htmlFor="trusticard-add-card-provider">
                Provider
              </label>
              <div className="trusticard-create-card-basic-gender-wrap">
                <select
                  id="trusticard-add-card-provider"
                  className="trusticard-create-card-address-input trusticard-create-card-basic-gender-select trusticard-add-card-select"
                  value={addCardForm.card_provider}
                  onChange={(e) => setAddCardForm({ ...addCardForm, card_provider: e.target.value })}
                >
                  <option value="mastercard">Mastercard</option>
                  <option value="visa">Visa</option>
                </select>
                <ChevronDown size={18} className="trusticard-create-card-basic-gender-chevron" aria-hidden />
              </div>

              <button
                type="submit"
                className="trusticard-create-card-address-submit trusticard-btn-primary"
                disabled={isSubmittingAddCard}
              >
                {isSubmittingAddCard ? '…' : 'Add Card'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add funds */}
      {showFundModal && (
        <div
          className="trusticard-modal-overlay trusticard-modal-overlay--add-funds-fullbleed"
          onClick={() => setShowFundModal(false)}
          role="presentation"
        >
          <div className="trusticard-modal-panel trusticard-add-funds-modal" onClick={(e) => e.stopPropagation()}>
            <div className="trusticard-modal-head trusticard-add-funds-head">
              <div className="trusticard-add-funds-title-row">
                <span className="trusticard-add-funds-accent" aria-hidden />
                <h2>Add funds</h2>
              </div>
              <button type="button" className="trusticard-modal-close" onClick={() => setShowFundModal(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="trusticard-modal-body trusticard-add-funds-body">
              <div className="trusticard-add-funds-amount-shell">
                <div className="trusticard-add-funds-row-top">
                  <span className="trusticard-add-funds-lbl-soft">Amount</span>
                  <div className="trusticard-add-funds-wallet-wrap" ref={fundWalletDropdownRef}>
                    <button
                      type="button"
                      className="trusticard-add-funds-wallet-trigger"
                      onClick={() => setFundWalletDropdownOpen((v) => !v)}
                      aria-expanded={fundWalletDropdownOpen}
                      aria-haspopup="listbox"
                      aria-label={activeFundWallet.label}
                    >
                      <TrusticardFundWalletLogo variant={activeFundWallet.id} size={30} />
                      <ChevronDown size={16} className="trusticard-add-funds-chevron" aria-hidden strokeWidth={2.5} />
                    </button>
                    {fundWalletDropdownOpen ? (
                      <ul className="trusticard-add-funds-wallet-menu" role="listbox">
                        {TRUSTICARD_FUND_SOURCE_WALLETS.map((w) => (
                          <li key={w.id} role="option" aria-selected={w.id === fundSourceWalletId}>
                            <button
                              type="button"
                              className="trusticard-add-funds-wallet-option"
                              onClick={() => {
                                setFundSourceWalletId(w.id);
                                setFundWalletDropdownOpen(false);
                              }}
                            >
                              <TrusticardFundWalletLogo variant={w.id} size={24} />
                              {w.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>

                <label className="trusticard-add-funds-big-row" htmlFor="trusticard-fund-amount-input">
                  <span className="sr-only">Amount in {activeFundWallet.symbol}</span>
                  <input
                    id="trusticard-fund-amount-input"
                    className="trusticard-add-funds-big-input"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0"
                    value={fundAmount}
                    onChange={handleFundAmountChange}
                  />
                  <span className="trusticard-add-funds-big-suffix">{activeFundWallet.symbol}</span>
                </label>

                <p className="trusticard-add-funds-balance">
                  Balance:{' '}
                  {!canShowCustodialWalletBalance ? (
                    '—'
                  ) : custodialWalletBalancesLoading ? (
                    <span className="trusticard-add-funds-balance-pending">Loading…</span>
                  ) : formattedCustodialFundBalance != null ? (
                    <>
                      {formattedCustodialFundBalance} {activeFundWallet.balanceTicker}
                    </>
                  ) : (
                    '—'
                  )}
                </p>
              </div>

              <div className="trusticard-add-funds-convert">
                <p className="trusticard-add-funds-convert-label">Amount in USD</p>
                <p className="trusticard-add-funds-convert-value">${formattedUsdEquivalent}</p>
              </div>

              <button
                type="button"
                className="trusticard-add-funds-submit trusticard-btn-primary"
                disabled={isDepositing || parsedFundAmount == null || !activeCard?.ulid}
                onClick={() => depositToCard(fundAmount)}
              >
                {isDepositing ? '…' : 'Add'}
              </button>

              <p className="trusticard-add-funds-footnote">
                <Info size={15} className="trusticard-add-funds-footnote-icon" aria-hidden strokeWidth={2.5} />
                Your funds will be added to your account within seconds or refunded if there&apos;s an issue.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw modal — matches reference sheet layout */}
      {showWithdrawModal && (
        <div
          className="trusticard-modal-overlay trusticard-modal-overlay--withdraw-fullbleed"
          onClick={() => setShowWithdrawModal(false)}
          role="presentation"
        >
          <div className="trusticard-modal-panel trusticard-withdraw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="trusticard-modal-head trusticard-add-funds-head">
              <div className="trusticard-add-funds-title-row">
                <span className="trusticard-add-funds-accent" aria-hidden />
                <h2>Withdraw</h2>
              </div>
              <button type="button" className="trusticard-modal-close" onClick={() => setShowWithdrawModal(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="trusticard-modal-body trusticard-add-funds-body">
              <div className="trusticard-add-funds-amount-shell trusticard-withdraw-amount-shell">
                <div className="trusticard-withdraw-amount-top">
                  <span className="trusticard-add-funds-lbl-soft">Amount</span>
                </div>

                <label className="trusticard-withdraw-amount-row" htmlFor="trusticard-withdraw-amount-input">
                  <span className="sr-only">Withdrawal amount in USD</span>
                  <span className="trusticard-withdraw-dollar" aria-hidden>
                    $
                  </span>
                  <input
                    id="trusticard-withdraw-amount-input"
                    className="trusticard-withdraw-amount-input"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={handleWithdrawAmountChange}
                  />
                </label>

                <p className="trusticard-add-funds-balance">
                  Balance: {formattedCardWithdrawBalance ?? '—'}
                </p>
              </div>

              <div className="trusticard-withdraw-wallet-block">
                <p className="trusticard-withdraw-wallet-name-label">Wallet name</p>
                <div className="trusticard-withdraw-wallet-wrap" ref={withdrawWalletDropdownRef}>
                  <button
                    type="button"
                    className="trusticard-withdraw-wallet-trigger"
                    onClick={() => setWithdrawWalletDropdownOpen((v) => !v)}
                    aria-expanded={withdrawWalletDropdownOpen}
                    aria-haspopup="listbox"
                    aria-label={activeWithdrawDestWallet.label}
                  >
                    <span className="trusticard-withdraw-wallet-trigger-label">{activeWithdrawDestWallet.label}</span>
                    <ChevronDown size={18} className="trusticard-withdraw-wallet-chevron" aria-hidden strokeWidth={2.25} />
                  </button>
                  {withdrawWalletDropdownOpen ? (
                    <ul className="trusticard-withdraw-wallet-menu" role="listbox">
                      {TRUSTICARD_WITHDRAW_DEST_WALLETS.map((w) => (
                        <li key={w.id} role="option" aria-selected={w.id === withdrawDestWalletId}>
                          <button
                            type="button"
                            className="trusticard-withdraw-wallet-option"
                            onClick={() => {
                              setWithdrawDestWalletId(w.id);
                              setWithdrawWalletDropdownOpen(false);
                            }}
                          >
                            {w.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                className="trusticard-add-funds-submit trusticard-btn-primary"
                disabled={isWithdrawing || parsedWithdrawAmount == null || !activeCard?.ulid}
                onClick={() => withdrawFromCard(withdrawAmount)}
              >
                {isWithdrawing ? '…' : 'Withdraw'}
              </button>

              <p className="trusticard-add-funds-footnote">
                <Info size={15} className="trusticard-add-funds-footnote-icon" aria-hidden strokeWidth={2.5} />
                Your withdrawal will reach the selected wallet within seconds, or it will be reversed if there&apos;s an
                issue.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Address modal */}
      {showAddressModal && (
        <div className="trusticard-modal-overlay" onClick={() => setShowAddressModal(false)} role="presentation">
          <div className="trusticard-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="trusticard-modal-head">
              <h2>Card address</h2>
              <button type="button" className="trusticard-modal-close" onClick={() => setShowAddressModal(false)}><X size={20} /></button>
            </div>
            <div className="trusticard-modal-body">
              {['streetAddress', 'city', 'state', 'country', 'postalCode'].map((key) => (
                <div key={key} className="trusticard-field">
                  <label>{key}</label>
                  <input type="text" value={addressForm[key]} onChange={(e) => setAddressForm({ ...addressForm, [key]: e.target.value })} />
              </div>
              ))}
              <div className="trusticard-modal-actions">
                <button type="button" className="trusticard-btn-primary" onClick={() => setShowAddressModal(false)}>Save</button>
              </div>
              </div>
              </div>
              </div>
      )}

      {/* Card Statement modal */}
      {showStatementModal && (
        <div
          className="trusticard-modal-overlay trusticard-modal-overlay--statement-fullbleed"
          onClick={() => setShowStatementModal(false)}
          role="presentation"
        >
          <div
            className="trusticard-modal-panel trusticard-statement-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="trusticard-statement-title"
          >
            <div className="trusticard-modal-head trusticard-card-info-head trusticard-statement-modal-head">
              <div className="trusticard-card-info-title-row">
                <span className="trusticard-card-info-accent" aria-hidden />
                <h2 id="trusticard-statement-title">Card Statement</h2>
              </div>
              <button type="button" className="trusticard-modal-close" aria-label="Close" onClick={() => setShowStatementModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="trusticard-modal-body trusticard-statement-body">
              <div className="trusticard-statement-fields">
                <label className="trusticard-statement-field">
                  <span className="trusticard-statement-label">Start Date</span>
                  <div className="trusticard-statement-input-wrap">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="00/00/00"
                      value={statementStartDate}
                      onChange={(e) => setStatementStartDate(e.target.value)}
                      className="trusticard-statement-input"
                      aria-label="Start date"
                    />
                    <Calendar size={18} className="trusticard-statement-input-icon" aria-hidden strokeWidth={2} />
                  </div>
                </label>
                <label className="trusticard-statement-field">
                  <span className="trusticard-statement-label">End Date</span>
                  <div className="trusticard-statement-input-wrap">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="00/00/00"
                      value={statementEndDate}
                      onChange={(e) => setStatementEndDate(e.target.value)}
                      className="trusticard-statement-input"
                      aria-label="End date"
                    />
                    <Calendar size={18} className="trusticard-statement-input-icon" aria-hidden strokeWidth={2} />
                  </div>
                </label>
              </div>

              <fieldset className="trusticard-statement-format-fieldset">
                <legend className="trusticard-statement-label">Format Type</legend>
                <div className="trusticard-statement-format-row" role="radiogroup" aria-label="Statement format">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={statementFormat === 'csv'}
                    className={`trusticard-statement-format-option${statementFormat === 'csv' ? ' is-selected' : ''}`}
                    onClick={() => setStatementFormat('csv')}
                  >
                    <span className="trusticard-statement-radio" aria-hidden data-checked={statementFormat === 'csv'} />
                    <span>.csv</span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={statementFormat === 'pdf'}
                    className={`trusticard-statement-format-option${statementFormat === 'pdf' ? ' is-selected' : ''}`}
                    onClick={() => setStatementFormat('pdf')}
                  >
                    <span className="trusticard-statement-radio" aria-hidden data-checked={statementFormat === 'pdf'} />
                    <span>.pdf</span>
                  </button>
                </div>
              </fieldset>

              <div className="trusticard-statement-divider" aria-hidden>
                <span className="trusticard-statement-divider-line" />
                <Crosshair size={18} strokeWidth={2} className="trusticard-statement-divider-mark" aria-hidden />
                <span className="trusticard-statement-divider-line" />
              </div>

              <div className="trusticard-statement-footer">
                <button type="button" className="trusticard-statement-btn trusticard-statement-btn--cancel" onClick={() => setShowStatementModal(false)}>
                  Cancel
                </button>
                <button type="button" className="trusticard-statement-btn trusticard-statement-btn--download" onClick={handleStatementDownload}>
                  Download statement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete card — danger confirm (matches Delete card UI reference) */}
      {showDeleteCardModal && activeCard && (
        <div
          className="trusticard-delete-card-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trusticard-delete-card-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDeleteCardModal(false);
          }}
        >
          <div className="trusticard-delete-card-shell">
            <div className="trusticard-delete-card-card" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="trusticard-delete-card-close"
                onClick={() => setShowDeleteCardModal(false)}
                aria-label="Close"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
              <div className="trusticard-delete-card-header" aria-hidden />
              <div className="trusticard-delete-card-body">
                <div className="trusticard-delete-card-hero" aria-hidden>
                  <div className="trusticard-delete-card-hero-inner">
                    <Trash2 size={44} strokeWidth={2} aria-hidden />
                  </div>
                </div>
                <h2 id="trusticard-delete-card-title" className="trusticard-delete-card-title">
                  Are you sure you want to Delete card?
                </h2>
                <p className="trusticard-delete-card-lead">
                  This will permanently remove your card. This action cannot be undone.
                </p>
                <div className="trusticard-delete-card-actions">
                  <button type="button" className="trusticard-delete-card-btn trusticard-delete-card-btn--danger" onClick={handleConfirmDeleteCard}>
                    Delete Card
                  </button>
                  <button type="button" className="trusticard-delete-card-btn trusticard-delete-card-btn--muted" onClick={() => setShowDeleteCardModal(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Freeze card — Trustitag welcome–style confirm */}
      {showFreezeConfirmModal && activeCard && !freezeCard && (
        <div
          className="trusticard-freeze-confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trusticard-freeze-confirm-title"
          onClick={(e) => {
            if (isFreezing) return;
            if (e.target === e.currentTarget) setShowFreezeConfirmModal(false);
          }}
        >
          <div className="trusticard-freeze-confirm-shell">
            <div className="trusticard-freeze-confirm-card" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="trusticard-freeze-confirm-close"
                onClick={() => !isFreezing && setShowFreezeConfirmModal(false)}
                aria-label="Close"
                disabled={isFreezing}
              >
                <X size={20} strokeWidth={1.75} />
              </button>
              <div className="trusticard-freeze-confirm-header" aria-hidden />
              <div className="trusticard-freeze-confirm-body">
                <div className="trusticard-freeze-confirm-hero" aria-hidden>
                  <div className="trusticard-freeze-confirm-hero-inner">
                    <Snowflake size={48} strokeWidth={2} aria-hidden />
                  </div>
                </div>
                <h2 id="trusticard-freeze-confirm-title" className="trusticard-freeze-confirm-title">
                  Are you sure you want to freeze card?
                </h2>
                <p className="trusticard-freeze-confirm-lead">
                  This will block all new transactions. You can unfreeze your card at any time.
                </p>
                <div className="trusticard-freeze-confirm-actions">
                  <button
                    type="button"
                    className="trusticard-freeze-confirm-btn trusticard-freeze-confirm-btn--primary"
                    disabled={isFreezing}
                    onClick={() => handleConfirmFreezeFromModal()}
                  >
                    {isFreezing ? '…' : 'Freeze Card'}
                  </button>
                  <button
                    type="button"
                    className="trusticard-freeze-confirm-btn trusticard-freeze-confirm-btn--secondary"
                    disabled={isFreezing}
                    onClick={() => setShowFreezeConfirmModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details modal — Card Info (reference UI with Card Info | Address tabs) */}
      {showDetailsModal && (cardInfoDisplayCard || isLoadingCardDetails) && (
        <div className="trusticard-modal-overlay trusticard-modal-overlay--card-info-fullbleed" onClick={() => setShowDetailsModal(false)} role="presentation">
          <div className="trusticard-modal-panel trusticard-card-info-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="trusticard-card-info-title">
            <div className="trusticard-modal-head trusticard-card-info-head">
              <div className="trusticard-card-info-title-row">
                <span className="trusticard-card-info-accent" aria-hidden />
                <h2 id="trusticard-card-info-title">Card Info</h2>
              </div>
              <button type="button" className="trusticard-modal-close" onClick={() => setShowDetailsModal(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <div className="trusticard-card-info-sheet">
              <div className="trusticard-card-info-tabs" role="tablist" aria-label="Card details sections">
                <button
                  type="button"
                  role="tab"
                  id="trusticard-card-info-tab-info"
                  aria-selected={cardDetailsModalTab === 'info'}
                  className="trusticard-card-info-tab"
                  data-active={cardDetailsModalTab === 'info'}
                  onClick={() => setCardDetailsModalTab('info')}
                >
                  Card Info
                </button>
                <button
                  type="button"
                  role="tab"
                  id="trusticard-card-info-tab-address"
                  aria-selected={cardDetailsModalTab === 'address'}
                  className="trusticard-card-info-tab"
                  data-active={cardDetailsModalTab === 'address'}
                  onClick={() => setCardDetailsModalTab('address')}
                >
                  Address
                </button>
              </div>
              {isLoadingCardDetails ? (
                <TrustiCardDetailsSkeleton fieldCount={4} />
              ) : cardDetailsModalTab === 'info' ? (
                <div className="trusticard-card-info-panel" role="tabpanel" aria-labelledby="trusticard-card-info-tab-info">
                  {(selectedCardDetails?.real_pan || selectedCardDetails?.cvv) ? (
                    <div className="trusticard-card-info-sensitive-bar">
                      <button
                        type="button"
                        className="trusticard-card-info-reveal"
                        onClick={() => setShowSensitiveCardInfo((v) => !v)}
                      >
                        {showSensitiveCardInfo ? 'Hide sensitive details' : 'Show sensitive details'}
                      </button>
                    </div>
                  ) : null}
                  <div className="trusticard-card-info-field">
                    <span className="trusticard-card-info-label">Card name</span>
                    <div className="trusticard-card-info-value-row">
                      <span className="trusticard-card-info-value">{cardInfoDisplayCard?.card_name || selectedCardDetails?.card_name || '—'}</span>
                    </div>
                  </div>
                  <div className="trusticard-card-info-field">
                    <span className="trusticard-card-info-label">Card number</span>
                    <div className="trusticard-card-info-value-row">
                      <span className="trusticard-card-info-value">
                        {formatPanForDisplay(
                          showSensitiveCardInfo && selectedCardDetails?.real_pan
                            ? selectedCardDetails.real_pan
                            : (selectedCardDetails?.masked_pan || cardInfoDisplayCard?.masked_pan),
                        )}
                      </span>
                      <button
                        type="button"
                        className="trusticard-card-info-copy"
                        aria-label="Copy card number"
                        onClick={() => {
                          const source =
                            showSensitiveCardInfo && selectedCardDetails?.real_pan
                              ? selectedCardDetails.real_pan
                              : (selectedCardDetails?.masked_pan || cardInfoDisplayCard?.masked_pan);
                          const toCopy = String(source ?? '').replace(/\s/g, '');
                          copyCardDetailValue(toCopy, 'Card number');
                        }}
                      >
                        <Copy size={18} strokeWidth={2.25} />
                      </button>
                    </div>
                  </div>
                  <div className="trusticard-card-info-field">
                    <span className="trusticard-card-info-label">CVV</span>
                    <div className="trusticard-card-info-value-row">
                      <span className="trusticard-card-info-value">
                        {showSensitiveCardInfo && selectedCardDetails?.cvv ? String(selectedCardDetails.cvv) : '•••'}
                      </span>
                      <button
                        type="button"
                        className="trusticard-card-info-copy"
                        aria-label="Copy CVV"
                        onClick={() => {
                          if (!showSensitiveCardInfo || !selectedCardDetails?.cvv) {
                            toast.error('Show sensitive details to copy CVV');
                            return;
                          }
                          copyCardDetailValue(selectedCardDetails.cvv, 'CVV');
                        }}
                      >
                        <Copy size={18} strokeWidth={2.25} />
                      </button>
                    </div>
                  </div>
                  <div className="trusticard-card-info-field">
                    <span className="trusticard-card-info-label">Expiration date</span>
                    <div className="trusticard-card-info-value-row">
                      <span className="trusticard-card-info-value">{selectedCardDetails?.card_exp_time || cardInfoDisplayCard?.card_exp_time || '—'}</span>
                      <button
                        type="button"
                        className="trusticard-card-info-copy"
                        aria-label="Copy expiration date"
                        onClick={() => copyCardDetailValue(selectedCardDetails?.card_exp_time || cardInfoDisplayCard?.card_exp_time || '', 'Expiration date')}
                      >
                        <Copy size={18} strokeWidth={2.25} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="trusticard-card-info-panel" role="tabpanel" aria-labelledby="trusticard-card-info-tab-address">
                  {(() => {
                    const freeform = typeof selectedCardDetails?.address === 'string' ? selectedCardDetails.address.trim() : '';
                    const hasStructured = TRUSTICARD_CARD_INFO_ADDRESS_FIELDS.some((f) => String(addressForm[f.key] || '').trim());
                    if (freeform && !hasStructured) {
                      return (
                        <>
                          <div className="trusticard-card-info-field">
                            <span className="trusticard-card-info-label">Billing address</span>
                            <div className="trusticard-card-info-value-row">
                              <span className="trusticard-card-info-value">{freeform}</span>
                              <button
                                type="button"
                                className="trusticard-card-info-copy"
                                aria-label="Copy address"
                                onClick={() => copyCardDetailValue(freeform, 'Address')}
                              >
                                <Copy size={18} strokeWidth={2.25} />
                              </button>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="trusticard-card-info-edit-address"
                            onClick={() => {
                              setShowDetailsModal(false);
                              setShowAddressModal(true);
                            }}
                          >
                            Edit address
                          </button>
                        </>
                      );
                    }
                    return (
                      <>
                        {TRUSTICARD_CARD_INFO_ADDRESS_FIELDS.map(({ key, label }) => {
                          const v = String(addressForm[key] || '').trim() || '—';
                          return (
                            <div key={key} className="trusticard-card-info-field">
                              <span className="trusticard-card-info-label">{label}</span>
                              <div className="trusticard-card-info-value-row">
                                <span className="trusticard-card-info-value">{v}</span>
                                {v !== '—' ? (
                                  <button
                                    type="button"
                                    className="trusticard-card-info-copy"
                                    aria-label={`Copy ${label}`}
                                    onClick={() => copyCardDetailValue(addressForm[key], label)}
                                  >
                                    <Copy size={18} strokeWidth={2.25} />
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                        <button
                          type="button"
                          className="trusticard-card-info-edit-address"
                          onClick={() => {
                            setShowDetailsModal(false);
                            setShowAddressModal(true);
                          }}
                        >
                          Edit address
                        </button>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Issue card */}
      {showIssueCardModal && (
        <div className="trusticard-modal-overlay" onClick={() => !isSubmittingIssueCard && setShowIssueCardModal(false)} role="presentation">
          <div className="trusticard-modal-panel trusticard-modal-panel--wide" onClick={(e) => e.stopPropagation()}>
            <div className="trusticard-modal-head">
              <h2>Issue card</h2>
              <button type="button" className="trusticard-modal-close" disabled={isSubmittingIssueCard} onClick={() => setShowIssueCardModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleIssueCardSubmit} className="trusticard-modal-body">
              <div className="trusticard-field">
                <label>Customer ULID *</label>
                <input value={issueCardForm.customer_ulid} onChange={(e) => setIssueCardForm({ ...issueCardForm, customer_ulid: e.target.value })} required />
                  </div>
              <div className="trusticard-field">
                <label>Card name *</label>
                <input value={issueCardForm.card_name} onChange={(e) => setIssueCardForm({ ...issueCardForm, card_name: e.target.value })} required />
                  </div>
              <div className="trusticard-field">
                <label>Currency</label>
                <select value={issueCardForm.card_currency} onChange={(e) => setIssueCardForm({ ...issueCardForm, card_currency: e.target.value })}>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
              <div className="trusticard-field">
                <label>Type</label>
                <select value={issueCardForm.card_type} onChange={(e) => setIssueCardForm({ ...issueCardForm, card_type: e.target.value })}>
                      <option value="platinum">Platinum</option>
                      <option value="gold">Gold</option>
                      <option value="standard">Standard</option>
                    </select>
                  </div>
              <div className="trusticard-field">
                <label>Provider</label>
                <select value={issueCardForm.card_provider} onChange={(e) => setIssueCardForm({ ...issueCardForm, card_provider: e.target.value })}>
                      <option value="mastercard">Mastercard</option>
                  <option value="visa">Visa</option>
                    </select>
                  </div>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Need a customer?{' '}
                <button type="button" style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setShowIssueCardModal(false); setShowCreateCustomerModal(true); }}>
                  Create customer
                </button>
              </p>
              <div className="trusticard-modal-actions">
                <button type="button" className="trusticard-btn-ghost" onClick={() => setShowIssueCardModal(false)}>Cancel</button>
                <button type="submit" className="trusticard-btn-primary" disabled={isSubmittingIssueCard}>{isSubmittingIssueCard ? '…' : 'Issue'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateCustomerModal && (
        <div className="trusticard-modal-overlay" onClick={() => !isSubmittingCreateCustomer && setShowCreateCustomerModal(false)} role="presentation">
          <div className="trusticard-modal-panel trusticard-modal-panel--wide" onClick={(e) => e.stopPropagation()}>
            <div className="trusticard-modal-head">
              <h2>Create customer</h2>
              <button type="button" className="trusticard-modal-close" disabled={isSubmittingCreateCustomer} onClick={() => setShowCreateCustomerModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateCustomerSubmit} className="trusticard-modal-body">
              <div className="trusticard-field"><label>First name *</label><input value={createCustomerForm.first_name} onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, first_name: e.target.value })} required /></div>
              <div className="trusticard-field"><label>Last name *</label><input value={createCustomerForm.last_name} onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, last_name: e.target.value })} required /></div>
              <div className="trusticard-field"><label>Email *</label><input type="email" value={createCustomerForm.email} onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, email: e.target.value })} required /></div>
              <div className="trusticard-field"><label>Date of birth</label><input type="date" value={createCustomerForm.date_of_birth} onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, date_of_birth: e.target.value })} /></div>
              <div className="trusticard-field"><label>Address line 1</label><input value={createCustomerForm.address_line_1} onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, address_line_1: e.target.value })} /></div>
              <div className="trusticard-field"><label>City</label><input value={createCustomerForm.city} onChange={(e) => setCreateCustomerForm({ ...createCustomerForm, city: e.target.value })} /></div>
              <div className="trusticard-modal-actions">
                <button type="button" className="trusticard-btn-ghost" onClick={() => setShowCreateCustomerModal(false)}>Cancel</button>
                <button type="submit" className="trusticard-btn-primary" disabled={isSubmittingCreateCustomer}>{isSubmittingCreateCustomer ? '…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNotificationModal && (
        <div className="notification-modal-overlay" onClick={() => setShowNotificationModal(false)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <div className="notification-header-content">
                <div className="notification-header-accent" />
                <h2>Notification</h2>
              </div>
              <button type="button" className="notification-close-btn" onClick={() => setShowNotificationModal(false)}><X size={20} /></button>
            </div>
            <div className="notification-filter-bar">
              <div className="notification-filter-buttons">
                <button type="button" className={`notification-filter-btn ${notificationFilter === 'All' ? 'active' : ''}`} onClick={() => setNotificationFilter('All')}>All</button>
                <button type="button" className={`notification-filter-btn ${notificationFilter === 'Unread' ? 'active' : ''}`} onClick={() => setNotificationFilter('Unread')}>Unread</button>
              </div>
              <button type="button" className="notification-filter-icon" onClick={handleMarkAllNotificationsRead} disabled={isLoadingNotifications}><Filter size={18} /></button>
            </div>
            <div className="notification-list">
              <NotificationListItems
                notifications={notifications}
                expandedNotificationId={expandedNotificationId}
                onToggleExpand={(nid) => setExpandedNotificationId((p) => (p === nid ? null : nid))}
                onMarkRead={handleMarkNotificationRead}
                formatTimeAgo={formatTimeAgo}
                onBeforeCtaNavigate={() => setShowNotificationModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      <PersonalWalletAddressesModal
        isOpen={showSidebarWalletModal}
        onClose={() => setShowSidebarWalletModal(false)}
        walletAddress={sidebarWalletAddress}
        walletBalanceRaw={sidebarWalletBalanceRaw}
        isLoadingWalletAddress={isLoadingSidebarWallet}
        isProvisioningWallets={isProvisioningSidebarWallets}
        onCreateInitialWallet={async () => {
          const ok = await handleSidebarCreateInitialWallet();
          if (ok) setShowSidebarWalletModal(true);
        }}
        onProvisionOtherAddresses={handleSidebarProvisionOtherAddresses}
      />
    </>
  );
};

export default TrustiCard;
