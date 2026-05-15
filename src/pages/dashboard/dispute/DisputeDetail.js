import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Repeat,
  Briefcase,
  FileCheck,
  Settings,
  HelpCircle,
  Search,
  Bell,
  LogOut,
  ArrowRight,
  ArrowLeft,
  FileText,
  Briefcase as BriefcaseIcon,
  Image as ImageIcon,
  Clock,
  MessageSquare,
  Mail,
  Plus,
  Send,
  CheckCircle2,
  Info,
  ToggleLeft,
  ToggleRight,
  Upload,
  X,
  Menu,
  PiggyBank
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './DisputeDetail.css';
import logo from '../../../assets/images/icons/logo.png';
import cloudDownloadIcon from '../../../assets/images/icons/cloud-download.png';
import { useSession } from '../../../context/SessionContext';
import { useTrustiscore, formatTrustiscoreBadgeText } from '../../../context/TrustiscoreContext';
import { useSidebarNavBadges } from '../../../hooks/useSidebarNavBadges';
import { getApiUrl } from '../../../utils/config';
import { getProfileAvatarUrl } from '../../../utils/profileAvatar';
import { getDisputeDetail } from '../../../utils/disputesApi';
import { handleLogout } from '../../../utils/logout';
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

const toNumberOrNull = (value) => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : null;
};

const formatUsdAmount = (value) => {
  const num = toNumberOrNull(value);
  if (num === null) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(num);
};

const titleCaseStatus = (status) => {
  if (!status || typeof status !== 'string') return '—';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const getInitials = (fullName) => {
  if (!fullName || typeof fullName !== 'string') return '—';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0).toUpperCase()}${parts[parts.length - 1].charAt(0).toUpperCase()}`;
};

const DisputeDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { isSessionExpired } = useSession();
  const { score: trustiscoreScore, isLoading: isTrustiscoreLoading } = useTrustiscore();
  const trustiscoreBadgeText = formatTrustiscoreBadgeText(trustiscoreScore, isTrustiscoreLoading);
  const getNavBadge = useSidebarNavBadges();
  const [accountType, setAccountType] = useState('Personal');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [userFullName, setUserFullName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [userAvatar, setUserAvatar] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mediatorEnabled, setMediatorEnabled] = useState(true);
  const [message, setMessage] = useState('');
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);
  const [disputeDetail, setDisputeDetail] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(true);
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceType, setEvidenceType] = useState('original_agreement');
  const [activityStatus, setActivityStatus] = useState(null);
  const [isTrackingActivity, setIsTrackingActivity] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(true);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);
  const [verdict, setVerdict] = useState(null);
  const [isLoadingVerdict, setIsLoadingVerdict] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [mediatorDetails, setMediatorDetails] = useState(null);
  const [isLoadingMediator, setIsLoadingMediator] = useState(true);

  const formattedToday = useMemo(() => {
    const now = new Date();
    const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
    const day = now.getDate();
    const month = now.toLocaleDateString(undefined, { month: 'long' });
    return `${weekday}, ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} ${month}`;
  }, []);

  // Map evidence type to icon
  const getEvidenceIcon = (evidenceType) => {
    const iconMap = {
      'original_agreement': FileText,
      'final_deliverable': BriefcaseIcon,
      'reference_images': ImageIcon,
      'work_progress': Clock,
      'chat_screenshots': MessageSquare,
      'email_communications': Mail,
      'other': FileText
    };
    return iconMap[evidenceType] || FileText;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Format file type for display
  const formatFileType = (fileType, fileName) => {
    if (fileType) {
      if (fileType.startsWith('image/')) {
        return 'Image';
      } else if (fileType === 'application/pdf') {
        return 'PDF';
      } else if (fileType.includes('word') || fileType.includes('document')) {
        return 'Document';
      }
    }
    // Fallback to file extension
    if (fileName) {
      const ext = fileName.split('.').pop()?.toUpperCase();
      return ext || 'File';
    }
    return 'File';
  };



  // File upload utility for evidence
  const uploadEvidenceFile = async (file, disputeId, title, description, evidenceType) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    if (!disputeId) {
      throw new Error('Dispute ID is required');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || 'Untitled Evidence');
    formData.append('description', description || '');
    formData.append('evidenceType', evidenceType || 'original_agreement');

    try {
      const response = await fetch(getApiUrl(`api/disputes/${disputeId}/evidence/upload-and-add`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      console.log('Evidence Upload API Response:', result);
      console.log('Evidence Upload Response Data:', result?.data);
      console.log('Evidence Upload Response Status:', response.status, response.statusText);

      if (!response.ok || !result.success) {
        console.error('Evidence Upload Failed:', result);
        throw new Error(result.message || result.error || 'Failed to upload file');
      }

      console.log('Evidence Upload Success:', {
        fileUrl: result.data?.fileUrl || result.data?.url || result.fileUrl,
        fileName: result.data?.fileName || file.name,
        fileType: result.data?.fileType || file.type,
        fileSize: result.data?.fileSize || file.size
      });

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

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAddEvidence = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    if (!evidenceTitle.trim()) {
      alert('Please enter a title for the evidence');
      return;
    }

    setIsUploadingEvidence(true);
    try {
      console.log('Starting evidence upload for file:', selectedFile.name, selectedFile.type, selectedFile.size);
      console.log('Using dispute ID:', id);
      console.log('Evidence details:', { title: evidenceTitle, description: evidenceDescription, evidenceType });
      const uploadedFile = await uploadEvidenceFile(selectedFile, id, evidenceTitle, evidenceDescription, evidenceType);
      console.log('Evidence upload completed successfully:', uploadedFile);
      alert('Evidence uploaded successfully');
      setSelectedFile(null);
      setEvidenceTitle('');
      setEvidenceDescription('');
      setEvidenceType('original_agreement');
      setShowAddEvidenceModal(false);
      // Refresh evidence list
      const token = localStorage.getItem('token');
      if (token && id) {
        const response = await fetch(getApiUrl(`api/disputes/${id}/evidence`), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const result = await response.json();
          if (result?.success && Array.isArray(result?.data?.evidence)) {
            const mappedEvidence = result.data.evidence.map((evidence) => ({
              id: evidence.id,
              icon: getEvidenceIcon(evidence.evidenceType),
              title: evidence.title || 'Untitled Evidence',
              description: evidence.description || '',
              type: `${formatFileType(evidence.fileType, evidence.fileName)} • ${formatFileSize(evidence.fileSize)}`,
              verified: evidence.verified || false,
              fileUrl: evidence.fileUrl,
              fileName: evidence.fileName,
              fileType: evidence.fileType,
              fileSize: evidence.fileSize,
              uploadedAt: evidence.uploadedAt,
            }));
            setEvidenceItems(mappedEvidence);
          }
        }
      }
    } catch (error) {
      console.error('Error uploading evidence:', error);
      alert(error.message || 'Failed to upload evidence');
    } finally {
      setIsUploadingEvidence(false);
    }
  };

  const disputeCaseIdNoHash = useMemo(() => {
    const raw = disputeDetail?.caseId || id;
    return raw ? String(raw).replace(/^#/, '') : '';
  }, [disputeDetail?.caseId, id]);

  const initiatorName = disputeDetail?.initiatorName || '';
  const respondentName = disputeDetail?.respondentName || '';
  const initiatorInitials = useMemo(() => getInitials(initiatorName), [initiatorName]);
  const respondentInitials = useMemo(() => getInitials(respondentName), [respondentName]);
  const disputeClaimsText = disputeDetail?.description || disputeDetail?.reason || '';
  const disputeStatusText = disputeDetail?.status ? titleCaseStatus(disputeDetail.status) : '';
  const disputeAmountText = disputeDetail?.amount?.usd !== undefined ? formatUsdAmount(disputeDetail.amount.usd) : '';

  useEffect(() => {
    let cancelled = false;

    const fetchDispute = async () => {
      if (!id) return;
      if (isSessionExpired) return;
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const data = await getDisputeDetail({ token, id });
        if (!cancelled) {
          setDisputeDetail(data);
        }
      } catch (error) {
        console.error('Error fetching dispute detail:', error);
      }
    };

    fetchDispute();
    return () => {
      cancelled = true;
    };
  }, [id, isSessionExpired]);

  // Fetch evidence for the dispute
  useEffect(() => {
    let cancelled = false;

    const fetchEvidence = async () => {
      if (!id) {
        setIsLoadingEvidence(false);
        return;
      }
      if (isSessionExpired) {
        setEvidenceItems([]);
        setIsLoadingEvidence(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setEvidenceItems([]);
        setIsLoadingEvidence(false);
        return;
      }

      setIsLoadingEvidence(true);
      try {
        const response = await fetch(getApiUrl(`api/disputes/${id}/evidence`), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (cancelled) return;

        if (response.ok) {
          const result = await response.json();
          console.log('Evidence API Response:', result);
          console.log('Evidence Data:', result?.data);
          console.log('Evidence Array:', result?.data?.evidence);
          if (result?.success && Array.isArray(result?.data?.evidence)) {
            // Map API response to UI format
            const mappedEvidence = result.data.evidence.map((evidence) => ({
              id: evidence.id,
              icon: getEvidenceIcon(evidence.evidenceType),
              title: evidence.title || 'Untitled Evidence',
              description: evidence.description || '',
              type: `${formatFileType(evidence.fileType, evidence.fileName)} • ${formatFileSize(evidence.fileSize)}`,
              verified: evidence.verified || false,
              fileUrl: evidence.fileUrl,
              fileName: evidence.fileName,
              fileType: evidence.fileType,
              fileSize: evidence.fileSize,
              uploadedAt: evidence.uploadedAt,
            }));
            setEvidenceItems(mappedEvidence);
          } else {
            setEvidenceItems([]);
          }
        } else {
          console.error('Error fetching evidence:', response.status, response.statusText);
          setEvidenceItems([]);
        }
      } catch (error) {
        console.error('Error fetching evidence:', error);
        if (!cancelled) {
          setEvidenceItems([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingEvidence(false);
        }
      }
    };

    fetchEvidence();
    return () => {
      cancelled = true;
    };
  }, [id, isSessionExpired]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (isSessionExpired) {
          setUserAvatar(null);
          setIsLoadingUserProfile(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          setUserAvatar(null);
          setIsLoadingUserProfile(false);
          return;
        }

        const response = await fetch(getApiUrl('api/user/profile'), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (response.ok) {
          const payload = await response.json().catch(() => null);
          const profile = payload?.data || payload?.user || payload?.data?.user;
          if (profile) {
            const fullName =
              profile.fullName ||
              [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
              profile.name ||
              '';

            setUserFullName(fullName);
            setUserInitials(getInitials(fullName));
            setUserAvatar(getProfileAvatarUrl(profile));
            setUserRole(profile.role || profile.userRole || '');
          }
        }
        setIsLoadingUserProfile(false);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setIsLoadingUserProfile(false);
      }
    };

    fetchUserProfile();
  }, [isSessionExpired]);

  // Fetch messages from API
  const fetchMessages = async () => {
    if (!id) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(getApiUrl(`api/disputes/${id}/messages`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Messages API Response (Full):', result);
        console.log('Messages API Response (JSON):', JSON.stringify(result, null, 2));
        
        // Handle different possible response structures
        const messagesData = result?.data?.messages || result?.data || result?.messages || [];
        console.log('Extracted Messages Data:', messagesData);
        console.log('Is Messages Array?', Array.isArray(messagesData));
        console.log('Messages Count:', Array.isArray(messagesData) ? messagesData.length : 0);
        
        if (Array.isArray(messagesData) && messagesData.length > 0) {
          console.log('First Message Item:', messagesData[0]);
          console.log('First Message Keys:', Object.keys(messagesData[0]));
        }
        
        // Map messages to expected format
        const mappedMessages = Array.isArray(messagesData) ? messagesData.map((msg) => {
          // Handle different possible message structures
          const sender = msg.sender || msg.senderName || msg.userRole || msg.role || msg.userType || 'Unknown';
          const text = msg.messageText || msg.text || msg.message || msg.content || '';
          const timestamp = msg.createdAt || msg.timestamp || msg.sentAt || new Date().toISOString();
          
          console.log('Mapping Message:', { msg, sender, text, timestamp });
          
          return {
            id: msg.id || msg._id || Date.now() + Math.random(),
            sender,
            text,
            timestamp,
            ...msg // Include all original message data
          };
        }) : [];
        
        console.log('Mapped Messages:', mappedMessages);
        setChatMessages(mappedMessages);
      } else {
        console.error('Failed to get messages:', response.status, response.statusText);
        const errorText = await response.text().catch(() => '');
        console.error('Error Response Body:', errorText);
        setChatMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setChatMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Send message via API
  const handleSendMessage = async () => {
    if (!message.trim() || isSendingMessage) return;
    if (!id) {
      alert('Dispute ID is required');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Authentication required');
      return;
    }

    const messageText = message.trim();
    setIsSendingMessage(true);

    try {
      console.log('Sending message:', messageText);
      const response = await fetch(getApiUrl(`api/disputes/${id}/messages`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageText,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Send Message API Response:', result);
        
        // Clear input
      setMessage('');
        
        // Refresh messages to get the latest including the one we just sent
        await fetchMessages();
      } else {
        const errorText = await response.text().catch(() => '');
        console.error('Failed to send message:', response.status, response.statusText, errorText);
        try {
          const errorData = JSON.parse(errorText);
          alert(errorData.message || 'Failed to send message');
        } catch (e) {
          alert('Failed to send message');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Track activity (heartbeat)
  const trackActivity = async () => {
    if (!id) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(getApiUrl(`api/disputes/${id}/activity`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Activity tracked successfully:', result);
      } else {
        console.error('Failed to track activity:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  };

  // Get activity status
  const getActivityStatus = async () => {
    if (!id) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(getApiUrl(`api/disputes/${id}/activity`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Activity status:', result);
        setActivityStatus(result?.data || result);
      } else {
        console.error('Failed to get activity status:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error getting activity status:', error);
    }
  };

  // Fetch assessments when component mounts
  useEffect(() => {
    let cancelled = false;

    const loadAssessments = async () => {
      if (!id) {
        setIsLoadingAssessments(false);
        return;
      }
      if (isSessionExpired) {
        setIsLoadingAssessments(false);
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoadingAssessments(false);
        return;
      }

      setIsLoadingAssessments(true);
      try {
        const response = await fetch(getApiUrl(`api/disputes/${id}/assessments`), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (cancelled) return;

        if (response.ok) {
          const result = await response.json();
          console.log('Assessments API Response (Full):', result);
          console.log('Assessments API Response (JSON):', JSON.stringify(result, null, 2));
          
          // Handle different possible response structures
          const assessmentsData = result?.data?.assessments || result?.data || result?.assessments || [];
          console.log('Extracted Assessments Data:', assessmentsData);
          console.log('Is Assessments Array?', Array.isArray(assessmentsData));
          console.log('Assessments Count:', Array.isArray(assessmentsData) ? assessmentsData.length : 0);
          
          if (Array.isArray(assessmentsData) && assessmentsData.length > 0) {
            console.log('First Assessment Item:', assessmentsData[0]);
            console.log('First Assessment Keys:', Object.keys(assessmentsData[0]));
          }
          
          setAssessments(Array.isArray(assessmentsData) ? assessmentsData : []);
        } else {
          console.error('Failed to get assessments:', response.status, response.statusText);
          const errorText = await response.text().catch(() => '');
          console.error('Error Response Body:', errorText);
          setAssessments([]);
        }
      } catch (error) {
        console.error('Error fetching assessments:', error);
        if (!cancelled) {
          setAssessments([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAssessments(false);
        }
      }
    };

    loadAssessments();
    return () => {
      cancelled = true;
    };
  }, [id, isSessionExpired]);

  // Fetch timeline events when component mounts
  useEffect(() => {
    let cancelled = false;

    const loadTimeline = async () => {
      if (!id) {
        setIsLoadingTimeline(false);
        return;
      }
      if (isSessionExpired) {
        setIsLoadingTimeline(false);
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoadingTimeline(false);
        return;
      }

      setIsLoadingTimeline(true);
      try {
        const response = await fetch(getApiUrl(`api/disputes/${id}/timeline`), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (cancelled) return;

        if (response.ok) {
          const result = await response.json();
          console.log('Timeline API Response (Full):', result);
          console.log('Timeline API Response (JSON):', JSON.stringify(result, null, 2));
          
          // Handle different possible response structures
          const timelineData = result?.data?.timeline || result?.data?.events || result?.data || result?.timeline || result?.events || [];
          console.log('Extracted Timeline Data:', timelineData);
          console.log('Is Timeline Array?', Array.isArray(timelineData));
          console.log('Timeline Events Count:', Array.isArray(timelineData) ? timelineData.length : 0);
          
          if (Array.isArray(timelineData) && timelineData.length > 0) {
            console.log('First Timeline Event:', timelineData[0]);
            console.log('First Timeline Event Keys:', Object.keys(timelineData[0]));
          }
          
          // Map timeline data to expected format
          const mappedTimeline = Array.isArray(timelineData) ? timelineData.map((event, index) => {
            // Handle different possible event structures
            const label = event.label || event.title || event.description || event.event || event.name || `Event ${index + 1}`;
            const date = event.date || event.createdAt || event.timestamp || event.time || '';
            
            // Format date if it's a timestamp
            let formattedDate = date;
            if (date && (typeof date === 'string' || date instanceof Date)) {
              try {
                const dateObj = new Date(date);
                if (!isNaN(dateObj.getTime())) {
                  // Format as: "8 Sept 2025 — 5:42 PM"
                  const day = dateObj.getDate();
                  const month = dateObj.toLocaleDateString(undefined, { month: 'short' });
                  const year = dateObj.getFullYear();
                  const time = dateObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
                  formattedDate = `${day} ${month} ${year} — ${time}`;
                }
              } catch (e) {
                console.warn('Error formatting date:', e);
              }
            }
            
            console.log(`Timeline Event ${index + 1}:`, { event, label, date, formattedDate });
            
            return {
              label,
              date: formattedDate,
              ...event // Include all original event data
            };
          }) : [];
          
          console.log('Mapped Timeline Events:', mappedTimeline);
          setTimelineEvents(mappedTimeline);
        } else {
          console.error('Failed to get timeline:', response.status, response.statusText);
          const errorText = await response.text().catch(() => '');
          console.error('Error Response Body:', errorText);
          setTimelineEvents([]);
        }
      } catch (error) {
        console.error('Error fetching timeline:', error);
        if (!cancelled) {
          setTimelineEvents([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTimeline(false);
        }
      }
    };

    loadTimeline();
    return () => {
      cancelled = true;
    };
  }, [id, isSessionExpired]);

  // Fetch verdict status when component mounts
  useEffect(() => {
    let cancelled = false;

    const loadVerdict = async () => {
      if (!id) {
        setIsLoadingVerdict(false);
        return;
      }
      if (isSessionExpired) {
        setIsLoadingVerdict(false);
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoadingVerdict(false);
        return;
      }

      setIsLoadingVerdict(true);
      try {
        const response = await fetch(getApiUrl(`api/disputes/${id}/verdict`), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (cancelled) return;

        if (response.ok) {
          const result = await response.json();
          console.log('Verdict API Response (Full):', result);
          console.log('Verdict API Response (JSON):', JSON.stringify(result, null, 2));
          
          // Extract data from response structure - API returns { success: true, data: {...} }
          const verdictData = result?.data || result;
          console.log('Extracted Verdict Data:', verdictData);
          console.log('Verdict Keys:', verdictData ? Object.keys(verdictData) : []);
          console.log('Verdict Data Type:', typeof verdictData);
          console.log('Is Verdict Data Object?', verdictData && typeof verdictData === 'object');
          
          if (verdictData) {
            console.log('Verdict Status (verdictStatus):', verdictData.verdictStatus);
            console.log('Verdict Status (status):', verdictData.status);
            console.log('All Verdict Properties:', Object.entries(verdictData));
            console.log('Mediator User ID:', verdictData.mediatorUserId);
            console.log('Mediator Name:', verdictData.mediatorName);
            console.log('Decision Deadline:', verdictData.decisionDeadline);
            console.log('Hours Remaining:', verdictData.hoursRemaining);
            console.log('Is Overdue:', verdictData.isOverdue);
          }
          
          // Ensure we're setting the verdict state correctly
          if (verdictData && typeof verdictData === 'object') {
            setVerdict(verdictData);
            console.log('Verdict state set with:', verdictData);
          } else {
            console.warn('Verdict data is not a valid object:', verdictData);
            setVerdict(null);
          }
        } else {
          console.error('Failed to get verdict:', response.status, response.statusText);
          const errorText = await response.text().catch(() => '');
          console.error('Error Response Body:', errorText);
          setVerdict(null);
        }
      } catch (error) {
        console.error('Error fetching verdict:', error);
        if (!cancelled) {
          setVerdict(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingVerdict(false);
        }
      }
    };

    loadVerdict();
    return () => {
      cancelled = true;
    };
  }, [id, isSessionExpired]);

  // Debug: Log verdict state changes
  useEffect(() => {
    console.log('Verdict State Changed:', {
      verdict,
      verdictStatus: verdict?.verdictStatus,
      isLoadingVerdict,
      hasVerdict: !!verdict
    });
  }, [verdict, isLoadingVerdict]);

  // Fetch mediator details when component mounts
  useEffect(() => {
    let cancelled = false;

    const loadMediator = async () => {
      if (!id) {
        setIsLoadingMediator(false);
        return;
      }
      if (isSessionExpired) {
        setIsLoadingMediator(false);
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoadingMediator(false);
        return;
      }

      setIsLoadingMediator(true);
      try {
        const response = await fetch(getApiUrl(`api/disputes/${id}/mediator`), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (cancelled) return;

        if (response.ok) {
          const result = await response.json();
          console.log('Mediator API Response (Full):', result);
          console.log('Mediator API Response (JSON):', JSON.stringify(result, null, 2));
          
          // Extract mediator data from response
          const mediatorData = result?.data || result;
          console.log('Extracted Mediator Data:', mediatorData);
          console.log('Mediator Keys:', mediatorData ? Object.keys(mediatorData) : []);
          
          if (mediatorData) {
            console.log('Mediator Name:', mediatorData.name || mediatorData.mediatorName || mediatorData.fullName);
            console.log('Mediator Status:', mediatorData.status || mediatorData.mediatorStatus);
            console.log('Mediator User ID:', mediatorData.userId || mediatorData.mediatorUserId);
          }
          
          setMediatorDetails(mediatorData);
        } else {
          console.error('Failed to get mediator:', response.status, response.statusText);
          const errorText = await response.text().catch(() => '');
          console.error('Error Response Body:', errorText);
          setMediatorDetails(null);
        }
      } catch (error) {
        console.error('Error fetching mediator:', error);
        if (!cancelled) {
          setMediatorDetails(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMediator(false);
        }
      }
    };

    loadMediator();
    return () => {
      cancelled = true;
    };
  }, [id, isSessionExpired]);

  // Fetch messages when component mounts and set up realtime polling
  useEffect(() => {
    let cancelled = false;

    const loadMessages = async () => {
      if (!id) {
        setIsLoadingMessages(false);
        return;
      }
      if (isSessionExpired) {
        setIsLoadingMessages(false);
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoadingMessages(false);
        return;
      }

      setIsLoadingMessages(true);
      await fetchMessages();
      if (cancelled) return;
    };

    // Initial load
    loadMessages();

    // Set up realtime polling - fetch messages every 5 seconds
    const messagesInterval = setInterval(() => {
      if (!cancelled) {
        fetchMessages();
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(messagesInterval);
    };
  }, [id, isSessionExpired]);

  // Assign mediator function
  const assignMediator = async (mediatorUserId, decisionDeadlineHours = 24) => {
    if (!id) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(getApiUrl(`api/disputes/${id}/verdict/assign-mediator`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediatorUserId,
          decisionDeadlineHours,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Assign Mediator API Response:', result);
        // Refresh verdict status after assignment
        const verdictResponse = await fetch(getApiUrl(`api/disputes/${id}/verdict`), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (verdictResponse.ok) {
          const verdictResult = await verdictResponse.json();
          setVerdict(verdictResult?.data || verdictResult);
        }
        return result;
      } else {
        const errorText = await response.text().catch(() => '');
        console.error('Failed to assign mediator:', response.status, response.statusText, errorText);
        throw new Error('Failed to assign mediator');
      }
    } catch (error) {
      console.error('Error assigning mediator:', error);
      throw error;
    }
  };

  // Set up activity tracking when component mounts
  useEffect(() => {
    if (!id || isSessionExpired) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    // Initial activity tracking
    trackActivity();
    getActivityStatus();

    // Set up periodic heartbeat (every 30 seconds)
    const heartbeatInterval = setInterval(() => {
      trackActivity();
    }, 30000);

    // Set up periodic status check (every 60 seconds)
    const statusInterval = setInterval(() => {
      getActivityStatus();
    }, 60000);

    setIsTrackingActivity(true);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(statusInterval);
      setIsTrackingActivity(false);
    };
  }, [id, isSessionExpired]);

  return (
    <>
      {/* Mobile Header */}
      <PersonalSuiteMobileHeader
        variant="personal"
        className="transactions-mobile-header"
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
              {sidebarNav.map((item) => {
                const Icon = item.icon;
                const isActive = (item.label === 'Dashboard' && location.pathname === '/dashboard') ||
                                 (item.label === 'My Escrow' && location.pathname === '/my-escrow') ||
                                 (item.label === 'Transactions' && location.pathname === '/transactions') ||
                                 (item.label === 'Dispute' && location.pathname.startsWith('/dispute')) ||
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
              const isActive =
                (item.label === 'Dashboard' && location.pathname === '/dashboard') ||
                (item.label === 'My Escrow' && location.pathname === '/my-escrow') ||
                (item.label === 'Transactions' && location.pathname === '/transactions') ||
                (item.label === 'Dispute' && location.pathname.startsWith('/dispute')) ||
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
            <>
              <div className="header-trustiscore-box" role="status" aria-label={`TrustiScore ${trustiscoreBadgeText}`}>
                <span className="header-trustiscore-label">TrustiScore</span>
                <span className="header-trustiscore-value">{trustiscoreBadgeText}</span>
              </div>
              <div className="account-type-display">
                <span className="account-type-label">{accountType}</span>
              </div>
            </>
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
                <HeaderProfileVerifyBadge />
              </div>
            </div>
          </div>
        </header>

        <div className="dispute-detail-content">
          {/* Breadcrumb */}
          <div className="card-breadcrumb">
            <span className="breadcrumb-root">General</span>
            <span className="breadcrumb-divider">›</span>
            <span className="breadcrumb-link" onClick={() => navigate('/dispute')}>Dispute</span>
            <span className="breadcrumb-divider">›</span>
            <span className="breadcrumb-current">#{disputeCaseIdNoHash}</span>
          </div>

          {/* Party Overview Cards */}
          <div className="dispute-overview-cards">
            {/* Party 1 - Buyer */}
            <div className="dispute-party-card buyer-card">
              <div className="buyer-card-top">
                <div className="party-avatar">{initiatorInitials}</div>
                <div className="party-info">
                  <div className="party-header-row">
                    <div className="party-name-section">
                      <h3 className="party-name">{initiatorName}</h3>
                      <p className="party-role">Buyer ( me )</p>
                    </div>
                    <span className="party-badge">Party 1</span>
                  </div>
                </div>
              </div>
              <div className="buyer-card-claims">
                <h4 className="party-claims-heading">Claims</h4>
                <p className="party-claims-text">{disputeClaimsText}</p>
              </div>
            </div>

            {/* Party 2 - Seller */}
            <div className="dispute-party-card seller-card">
              <div className="seller-card-top">
                <div className="party-avatar-wrapper">
                  <div className="party-avatar">{respondentInitials}</div>
                </div>
                <div className="party-info">
                  <div className="party-header-row">
                    <div className="party-name-section">
                      <div className="party-name-with-check">
                        <h3 className="party-name">{respondentName}</h3>
                        <CheckCircle2 size={16} className="party-check-icon" />
                      </div>
                      <p className="party-role">Seller</p>
                    </div>
                    <span className="party-badge">Party 2</span>
                  </div>
                </div>
              </div>
              <div className="seller-card-claims">
                <h4 className="party-claims-heading">Claims</h4>
                <p className="party-claims-text">{disputeClaimsText}</p>
              </div>
            </div>

            {/* Details Card */}
            <div className="dispute-details-card">
              <div className="details-content-row">
                {/* Details Section */}
                <div className="details-section">
                  <div className="details-header">
                    <div className="details-indicator"></div>
                    <h4 className="details-title">Details</h4>
                  </div>
                  <div className="details-content">
                    <div className="detail-item">
                      <span className="detail-label">Status</span>
                      <span className="detail-value status-in-progress">{disputeStatusText}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Case ID</span>
                      <span className="detail-value">#{disputeCaseIdNoHash}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Amount</span>
                      <span className="detail-value">{disputeAmountText}</span>
                    </div>
                  </div>
                </div>

                {/* Mediator Section */}
                <div className="mediator-section">
                  <div className="mediator-header-section">
                    <div className="mediator-indicator"></div>
                    <h4 className="mediator-title">Mediator</h4>
                  </div>
                  <div className="mediator-content">
                    <div className="mediator-toggle-row">
                      <span className="mediator-toggle-label">Mediator</span>
                      <button 
                        type="button" 
                        className="mediator-toggle"
                        onClick={() => setMediatorEnabled(!mediatorEnabled)}
                      >
                        {mediatorEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                    </div>
                    {mediatorEnabled && (
                      <>
                        <h5 className="mediator-details-heading">Mediator Details</h5>
                        {isLoadingMediator ? (
                          <div style={{ padding: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Loading mediator details...
                          </div>
                        ) : mediatorDetails ? (
                          <>
                        <div className="mediator-info-row">
                          <span className="mediator-info-label">Name</span>
                              <span className="mediator-info-value">
                                {mediatorDetails.name || mediatorDetails.mediatorName || mediatorDetails.fullName || ''}
                              </span>
                        </div>
                        <div className="mediator-info-row">
                          <span className="mediator-info-label">Status</span>
                          <span className="mediator-info-value">
                                <span className={`status-dot ${(mediatorDetails.status || mediatorDetails.mediatorStatus || '').toLowerCase() === 'active' ? 'active' : ''}`}></span>
                                {mediatorDetails.status || mediatorDetails.mediatorStatus || 'Unknown'}
                          </span>
                        </div>
                            {mediatorDetails.email && (
                              <div className="mediator-info-row">
                                <span className="mediator-info-label">Email</span>
                                <span className="mediator-info-value">{mediatorDetails.email}</span>
                              </div>
                            )}
                            {mediatorDetails.userId && (
                              <div className="mediator-info-row">
                                <span className="mediator-info-label">User ID</span>
                                <span className="mediator-info-value">{mediatorDetails.userId}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ padding: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No mediator assigned yet.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="dispute-main-content">
            {/* Left Column */}
            <div className="dispute-left-column">
              {/* Evidence Section */}
              <div className="dispute-section">
                <div className="section-header">
                  <div className="section-indicator"></div>
                  <h2 className="section-title">Evidence and documentation</h2>
                  <button 
                    type="button" 
                    className="add-evidence-btn"
                    onClick={() => setShowAddEvidenceModal(true)}
                  >
                    <Plus size={16} />
                    Add New Evidence
                  </button>
                </div>
                {isLoadingEvidence ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading evidence...
                  </div>
                ) : evidenceItems.length > 0 ? (
                  <div className="evidence-grid">
                    {evidenceItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.id} className="evidence-card">
                          <div className="evidence-icon">
                            <Icon size={20} />
                          </div>
                          <div className="evidence-content">
                            <h4 className="evidence-title">{item.title}</h4>
                            {item.description && (
                              <p className="evidence-description">{item.description}</p>
                            )}
                            <div className="evidence-footer">
                              <span className="evidence-type">{item.type}</span>
                              {item.verified && (
                                <span className="evidence-verified">
                                  <CheckCircle2 size={14} />
                                  Verified
                                </span>
                              )}
                            </div>
                            {item.fileUrl && (
                              <a
                                href={item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  marginTop: '0.5rem',
                                  fontSize: '0.85rem',
                                  color: 'var(--blue-600)',
                                  textDecoration: 'none',
                                  display: 'inline-block'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                View file →
                              </a>
                            )}
                          </div>
                          {item.fileUrl && (
                            <div className="evidence-cloud-icon">
                              <a
                                href={item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <img src={cloudDownloadIcon} alt="Download" />
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No evidence submitted yet.
                  </div>
                )}
                <div className="evidence-info-message">
                  <Info size={16} />
                  <p>All submitted evidence has been verified and is currently under review by the assigned mediator. Additional documentation may be requested if needed.</p>
                </div>
              </div>

              {/* Preliminary Assessment */}
              <div className="dispute-section">
                <div className="section-header">
                  <div className="section-indicator"></div>
                  <h2 className="section-title">Preliminary Assessment</h2>
                  {isTrackingActivity && (
                    <span className="activity-indicator" title="Activity tracking active">
                      <Clock size={14} />
                    </span>
                  )}
                </div>
                {activityStatus && (
                  <div className="activity-status-info">
                    <Info size={14} />
                    <span>
                      {activityStatus.lastActivityAt 
                        ? `Last activity: ${new Date(activityStatus.lastActivityAt).toLocaleString()}`
                        : 'Activity tracking active'}
                    </span>
                  </div>
                )}
                {isLoadingAssessments ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading assessments...
                  </div>
                ) : assessments.length > 0 ? (
                  <>
                <h3 className="assessment-subtitle">Key Findings</h3>
                <ul className="assessment-list">
                      {assessments.map((assessment, index) => {
                        // Handle different possible response structures
                        const finding = assessment.finding || assessment.text || assessment.description || assessment.content || assessment;
                        const findingText = typeof finding === 'string' ? finding : JSON.stringify(finding);
                        
                        // Log each assessment item being rendered
                        console.log(`Key Finding ${index + 1}:`, {
                          assessment,
                          finding,
                          findingText,
                          allKeys: Object.keys(assessment)
                        });
                        
                        return (
                          <li key={assessment.id || assessment._id || index}>
                            {findingText}
                          </li>
                        );
                      })}
                </ul>
                  </>
                ) : (
                  <>
                    <h3 className="assessment-subtitle">Key Findings</h3>
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No assessments available yet.
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="dispute-right-column">
              {/* Timeline */}
              <div className="dispute-section">
                <div className="section-header">
                  <div className="section-indicator"></div>
                  <h2 className="section-title">Timeline</h2>
                </div>
                {isLoadingTimeline ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading timeline...
                  </div>
                ) : timelineEvents.length > 0 ? (
                <div className="timeline-container">
                    {timelineEvents.map((event, index) => {
                      // Log each timeline event being rendered
                      console.log(`Timeline Event ${index + 1}:`, {
                        event,
                        label: event.label,
                        date: event.date
                      });
                      
                      return (
                        <div key={event.id || event._id || index} className="timeline-item">
                      <div className="timeline-stopper"></div>
                      <div className="timeline-content">
                            <p className="timeline-date">{event.date || '—'}</p>
                            <p className="timeline-label">{event.label || '—'}</p>
                      </div>
                    </div>
                      );
                    })}
                </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No timeline events available yet.
                  </div>
                )}
              </div>

              {/* Final Verdict */}
              <div className="dispute-section">
                <div className="section-header">
                  <div className="section-indicator"></div>
                  <h2 className="section-title">Final Verdict</h2>
                </div>
                {isLoadingVerdict ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading verdict status...
                  </div>
                ) : verdict ? (
                  <>
                    {(() => {
                      // Use verdictStatus from API response - only use if it exists
                      const verdictStatus = verdict.verdictStatus;
                      
                      console.log('Verdict Status Check:', {
                        verdictStatus,
                        hasVerdictStatus: !!verdictStatus,
                        verdictObject: verdict
                      });
                      
                      // If no verdictStatus from API, don't show any button
                      if (!verdictStatus) {
                        console.log('No verdictStatus in API response');
                        return (
                          <>
                            <p className="verdict-message">No verdict status available yet.</p>
                          </>
                        );
                      }
                      
                      const statusLower = verdictStatus.toLowerCase();
                      let buttonClass = '';
                      let buttonText = '';
                      
                      // Check for approved status first
                      if (statusLower === 'approved' || statusLower === 'accepted' || statusLower.includes('approved')) {
                        buttonClass = 'verdict-button approved';
                        buttonText = 'Approved';
                      } 
                      // Check for rejected status
                      else if (statusLower === 'rejected' || statusLower === 'denied' || statusLower.includes('rejected')) {
                        buttonClass = 'verdict-button rejected';
                        buttonText = 'Rejected';
                      } 
                      // Check for pending status - ONLY if API explicitly returns it
                      else if (statusLower === 'decision_pending' || statusLower === 'pending' || statusLower.includes('pending')) {
                        buttonClass = 'verdict-button pending';
                        buttonText = 'Decision Pending';
                      } 
                      // For any other status, display it as-is
                      else {
                        buttonClass = 'verdict-button pending';
                        buttonText = verdictStatus.charAt(0).toUpperCase() + verdictStatus.slice(1).replace(/_/g, ' ');
                      }
                      
                      console.log('Verdict Button Result:', {
                        buttonClass,
                        buttonText,
                        finalStatus: statusLower,
                        verdictStatus
                      });
                      
                      // Build message based on API response data
                      let message = 'The mediator is currently reviewing all evidence.';
                      if (verdict.hoursRemaining !== undefined && verdict.hoursRemaining > 0) {
                        message = `The mediator is currently reviewing all evidence and will provide a decision within ${verdict.hoursRemaining} hour${verdict.hoursRemaining !== 1 ? 's' : ''}.`;
                      } else if (verdict.isOverdue) {
                        message = 'The decision deadline has passed. The mediator should provide a decision soon.';
                      } else if (!statusLower.includes('pending')) {
                        message = 'The mediator has provided a decision on this dispute.';
                      }
                      
                      // Format deadline date
                      let deadlineText = '';
                      if (verdict.decisionDeadline) {
                        try {
                          const deadlineDate = new Date(verdict.decisionDeadline);
                          deadlineText = deadlineDate.toLocaleString();
                        } catch (e) {
                          console.warn('Error formatting deadline:', e);
                        }
                      }
                      
                      // Log verdict data being rendered
                      console.log('Rendering Verdict:', {
                        verdict,
                        verdictStatus,
                        buttonClass,
                        buttonText,
                        message,
                        mediatorName: verdict.mediatorName,
                        hoursRemaining: verdict.hoursRemaining,
                        isOverdue: verdict.isOverdue,
                        decisionDeadline: verdict.decisionDeadline
                      });
                      
                      // Only render button if we have a valid verdictStatus
                      if (!buttonClass || !buttonText) {
                        return (
                          <>
                            <p className="verdict-message">No verdict status available.</p>
                          </>
                        );
                      }
                      
                      return (
                        <>
                          <button type="button" className={buttonClass}>
                            {buttonText}
                          </button>
                          <p className="verdict-message">{message}</p>
                          {verdict.mediatorName && (
                            <p className="verdict-message" style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>
                              Mediator: {verdict.mediatorName}
                            </p>
                          )}
                          {deadlineText && (
                            <p className="verdict-message" style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>
                              Deadline: {deadlineText}
                            </p>
                          )}
                          {verdict.hoursRemaining !== undefined && (
                            <p className="verdict-message" style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>
                              {verdict.isOverdue ? '⚠️ Overdue' : `${verdict.hoursRemaining} hour${verdict.hoursRemaining !== 1 ? 's' : ''} remaining`}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <>
                <button type="button" className="verdict-button pending">
                  Decision Pending
                </button>
                    <p className="verdict-message">No verdict information available yet.</p>
                  </>
                )}
              </div>

              {/* Dispute Chat */}
              <div className="dispute-section">
                <div className="section-header">
                  <div className="section-indicator"></div>
                  <h2 className="section-title">Dispute Chat #{disputeCaseIdNoHash}</h2>
                </div>
                {isLoadingMessages ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading messages...
                        </div>
                ) : (
                  <>
                    <div className="chat-containers-wrapper">
                      {/* Group messages by sender type */}
                      {(() => {
                        // Group messages by sender
                        const groupedMessages = {};
                        chatMessages.forEach((msg) => {
                          const senderKey = msg.sender || 'Other';
                          if (!groupedMessages[senderKey]) {
                            groupedMessages[senderKey] = [];
                          }
                          groupedMessages[senderKey].push(msg);
                        });

                        // Render each sender's messages
                        return Object.entries(groupedMessages).map(([sender, messages]) => {
                          const isMediator = sender.toLowerCase().includes('mediator');
                          const isSeller = sender.toLowerCase().includes('seller') || sender.toLowerCase().includes('respondent');
                          const containerClass = isMediator ? 'mediator-chat' : isSeller ? 'seller-chat' : 'other-chat';
                          const messageClass = isMediator ? 'mediator' : isSeller ? 'seller' : 'other';

                          return (
                            <div key={sender} className={`chat-container ${containerClass}`}>
                              <h3 className="chat-section-title">{sender}</h3>
                              {messages.map((msg) => {
                                console.log('Rendering Message:', { msg, sender, text: msg.text });
                                return (
                                  <div key={msg.id} className={`chat-message ${messageClass}`}>
                          <span className="chat-sender">{msg.sender}:</span>
                          <p className="chat-text">{msg.text}</p>
                                    {msg.timestamp && (
                                      <span className="chat-timestamp" style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem', display: 'block' }}>
                                        {new Date(msg.timestamp).toLocaleString()}
                                      </span>
                                    )}
                        </div>
                                );
                              })}
                  </div>
                          );
                        });
                      })()}
                </div>
                <div className="chat-input-container">
                  <input
                    type="text"
                    className="chat-input"
                    placeholder="Add message."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage && handleSendMessage()}
                        disabled={isSendingMessage}
                      />
                      <button 
                        type="button" 
                        className="chat-send-btn" 
                        onClick={handleSendMessage}
                        disabled={isSendingMessage || !message.trim()}
                        style={{ opacity: (isSendingMessage || !message.trim()) ? 0.5 : 1, cursor: (isSendingMessage || !message.trim()) ? 'not-allowed' : 'pointer' }}
                      >
                        {isSendingMessage ? <LoadingIndicator size="sm" /> : <Send size={18} />}
                  </button>
                </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Evidence Modal */}
      {showAddEvidenceModal && (
        <div className="modal-overlay" onClick={() => setShowAddEvidenceModal(false)}>
          <div className="add-evidence-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Evidence</h2>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowAddEvidenceModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              <div style={{ marginBottom: '1rem' }}>
                <label className="evidence-upload-label">Title <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g., Original Agreement"
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    fontFamily: 'Satoshi, Inter, sans-serif'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="evidence-upload-label">Description</label>
                <textarea
                  placeholder="e.g., Detailed requirements and specifications"
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    fontFamily: 'Satoshi, Inter, sans-serif',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="evidence-upload-label">Evidence Type</label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    fontFamily: 'Satoshi, Inter, sans-serif',
                    background: 'white'
                  }}
                >
                  <option value="original_agreement">Original Agreement</option>
                  <option value="final_deliverable">Final Deliverable</option>
                  <option value="reference_images">Reference Images</option>
                  <option value="work_progress">Work Progress</option>
                  <option value="chat_screenshots">Chat Screenshots</option>
                  <option value="email_communications">Email Communications</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <label className="evidence-upload-label">File <span style={{ color: 'red' }}>*</span></label>
              <input
                type="file"
                id="evidence-file-input"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept="image/*,application/pdf,.doc,.docx"
              />
              <div 
                className={`evidence-upload-area ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('evidence-file-input')?.click()}
              >
                <Upload size={32} className="upload-icon" />
                {selectedFile ? (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0.5rem 0', fontWeight: 500, color: 'var(--text-dark)' }}>
                      {selectedFile.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <p className="upload-placeholder">Drop or click to select file...</p>
                )}
              </div>
              {selectedFile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-dark)',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Remove file
                </button>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="modal-cancel-btn"
                onClick={() => {
                  setShowAddEvidenceModal(false);
                  setSelectedFile(null);
                  setEvidenceTitle('');
                  setEvidenceDescription('');
                  setEvidenceType('original_agreement');
                }}
                disabled={isUploadingEvidence}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="modal-add-btn"
                onClick={handleAddEvidence}
                disabled={!selectedFile || !evidenceTitle.trim() || isUploadingEvidence}
                style={{
                  opacity: (!selectedFile || !evidenceTitle.trim() || isUploadingEvidence) ? 0.6 : 1,
                  cursor: (!selectedFile || !evidenceTitle.trim() || isUploadingEvidence) ? 'not-allowed' : 'pointer'
                }}
              >
                {isUploadingEvidence ? 'Uploading...' : 'Add now'}
              </button>
            </div>
          </div>
        </div>
      )}

      <NotificationCenterModal
        open={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        titleId="dispute-detail-notifications-title"
      />
    </div>
    </>
  );
};

export default DisputeDetail;
