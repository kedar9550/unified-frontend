import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Chip,
  Paper,
  MenuItem,
  TextField,
  Tooltip,
  LinearProgress,
  Card,
  CardContent,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Hotel as HotelIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterAlt as FilterAltIcon,
  FilterAltOff as FilterAltOffIcon,
  School as SchoolIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx-js-style';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import { PageContainer, EmptyState } from '../../components/common/design-system';
import API from '../../api/axios';
import { toast } from 'sonner';

const MALE_LIMIT = 100;
const FEMALE_LIMIT = 50;
const OVERALL_LIMIT = 150;

const isOtherCollege = (college) => {
  if (!college) return false;
  const lower = college.toLowerCase().trim();
  if (lower === 'other college') return true;
  return !['aditya university', 'acet', 'acoe', 'aditya college of engineering', 'aditya college of engineering & technology'].includes(lower);
};

const normalizeGender = (gender) => {
  if (!gender) return 'MALE';
  const g = String(gender).trim().toLowerCase();
  if (g.startsWith('f') || g.includes('girl') || g.includes('woman')) {
    return 'FEMALE';
  }
  return 'MALE';
};

const ApplyAccommodation = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quotaStats, setQuotaStats] = useState({
    male: 0,
    female: 0,
    total: 0,
    limits: { male: MALE_LIMIT, female: FEMALE_LIMIT, total: OVERALL_LIMIT },
  });
  const [applyingParticipantId, setApplyingParticipantId] = useState(null);

  // Filters
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [teamIdFilter, setTeamIdFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  // Revoke confirmation dialog state
  const [revokeDialog, setRevokeDialog] = useState({ open: false, participant: null });

  // Fetch quota stats from backend
  const fetchQuotaStats = useCallback(async () => {
    try {
      const res = await API.get('/api/razorpay/accommodation/stats');
      if (res.data?.ok) {
        setQuotaStats({
          male: res.data.male ?? 0,
          female: res.data.female ?? 0,
          total: res.data.total ?? 0,
          limits: res.data.limits || { male: MALE_LIMIT, female: FEMALE_LIMIT, total: OVERALL_LIMIT },
        });
      }
    } catch (err) {
      console.error('Failed to fetch accommodation quota stats:', err);
    }
  }, []);

  // Fetch all registrations & events
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, paymentsRes] = await Promise.all([
        API.get('/api/events').catch(() => ({ data: { events: [] } })),
        API.get('/api/razorpay/registrations').catch(() => ({ data: { payments: [] } })),
      ]);

      const events = eventsRes.data?.events || [];

      let fetchedPayments = paymentsRes.data?.payments || [];
      // Only PAID registrations
      fetchedPayments = fetchedPayments.filter(
        (p) => (p.paymentStatus || '').toUpperCase() === 'PAID' || p.verified === true
      );

      // Map event meta information
      fetchedPayments = fetchedPayments.map((p) => {
        const eventMatch = events.find((e) => e.eventName === (p.eventName || p.category));
        return {
          ...p,
          schoolCategory: eventMatch?.category?.name || eventMatch?.category || p.category || 'General',
          resolvedSchool: eventMatch?.eventSchool?.name || eventMatch?.category?.name || p.category || 'General',
        };
      });

      setPayments(fetchedPayments);
      await fetchQuotaStats();
    } catch (error) {
      console.error('Error loading accommodation data:', error);
      toast.error('Failed to load participants for accommodation');
    } finally {
      setLoading(false);
    }
  }, [fetchQuotaStats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Extract all eligible participants (Other College only)
  const otherCollegeParticipants = useMemo(() => {
    const list = [];
    payments.forEach((payment) => {
      const parts = Array.isArray(payment.participants) ? payment.participants : [];
      parts.forEach((p, idx) => {
        if (isOtherCollege(p.college)) {
          const normGen = normalizeGender(p.gender);
          list.push({
            ...p,
            participantIndex: idx,
            paymentId: payment._id,
            teamId: payment.teamId || '-',
            eventName: payment.eventName || '-',
            schoolName: payment.resolvedSchool || payment.schoolCategory || '-',
            schoolCategory: payment.schoolCategory || '-',
            normalizedGender: normGen,
            collegeDisplay: p.college === 'Other College' && p.otherCollege ? p.otherCollege : (p.college || 'Other College'),
            uniqueKey: `${payment._id}_${p.barcode || p.roll || idx}`,
          });
        }
      });
    });
    return list;
  }, [payments]);

  // Extract dropdown options based on other college participants
  const schoolOptions = useMemo(() => {
    const set = new Set();
    otherCollegeParticipants.forEach((p) => {
      if (p.schoolName && p.schoolName !== '-') set.add(p.schoolName);
    });
    return Array.from(set).sort();
  }, [otherCollegeParticipants]);

  const eventOptions = useMemo(() => {
    const set = new Set();
    otherCollegeParticipants.forEach((p) => {
      if (schoolFilter === 'ALL' || p.schoolName === schoolFilter) {
        if (p.eventName && p.eventName !== '-') set.add(p.eventName);
      }
    });
    return Array.from(set).sort();
  }, [otherCollegeParticipants, schoolFilter]);

  const teamIdOptions = useMemo(() => {
    const set = new Set();
    otherCollegeParticipants.forEach((p) => {
      const matchSchool = schoolFilter === 'ALL' || p.schoolName === schoolFilter;
      const matchEvent = eventFilter === 'ALL' || p.eventName === eventFilter;
      if (matchSchool && matchEvent && p.teamId && p.teamId !== '-') {
        set.add(p.teamId);
      }
    });
    return Array.from(set).sort();
  }, [otherCollegeParticipants, schoolFilter, eventFilter]);

  // Reset dependent filters when parent dropdown changes
  const handleSchoolChange = (val) => {
    setSchoolFilter(val);
    setEventFilter('ALL');
    setTeamIdFilter('ALL');
  };

  const handleEventChange = (val) => {
    setEventFilter(val);
    setTeamIdFilter('ALL');
  };

  const handleResetFilters = () => {
    setSchoolFilter('ALL');
    setEventFilter('ALL');
    setTeamIdFilter('ALL');
    setGenderFilter('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
  };

  // Filter participants
  const filteredParticipants = useMemo(() => {
    return otherCollegeParticipants.filter((p) => {
      if (schoolFilter !== 'ALL' && p.schoolName !== schoolFilter) return false;
      if (eventFilter !== 'ALL' && p.eventName !== eventFilter) return false;
      if (teamIdFilter !== 'ALL' && p.teamId !== teamIdFilter) return false;
      if (genderFilter !== 'ALL' && p.normalizedGender !== genderFilter) return false;

      const isAccommodated = (p.accommodation || '').toUpperCase() === 'YES';
      if (statusFilter === 'YES' && !isAccommodated) return false;
      if (statusFilter === 'NO' && isAccommodated) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (p.name || '').toLowerCase();
        const roll = (p.roll || '').toLowerCase();
        const college = (p.collegeDisplay || '').toLowerCase();
        const mobile = (p.mobile || '').toLowerCase();
        const email = (p.email || '').toLowerCase();
        const team = (p.teamId || '').toLowerCase();
        const event = (p.eventName || '').toLowerCase();
        return (
          name.includes(q) ||
          roll.includes(q) ||
          college.includes(q) ||
          mobile.includes(q) ||
          email.includes(q) ||
          team.includes(q) ||
          event.includes(q)
        );
      }

      return true;
    });
  }, [otherCollegeParticipants, schoolFilter, eventFilter, teamIdFilter, genderFilter, statusFilter, searchQuery]);

  // Apply or Revoke accommodation
  const handleToggleAccommodation = async (participant, newStatus) => {
    const isYes = newStatus === 'YES';

    // Client-side limit checks when applying
    if (isYes) {
      if (quotaStats.total >= OVERALL_LIMIT) {
        toast.error(`Overall accommodation limit of ${OVERALL_LIMIT} has been reached! Cannot allocate more.`);
        return;
      }
      if (participant.normalizedGender === 'MALE' && quotaStats.male >= MALE_LIMIT) {
        toast.error(`Male accommodation limit of ${MALE_LIMIT} has been reached!`);
        return;
      }
      if (participant.normalizedGender === 'FEMALE' && quotaStats.female >= FEMALE_LIMIT) {
        toast.error(`Girl accommodation limit of ${FEMALE_LIMIT} has been reached!`);
        return;
      }
    }

    setApplyingParticipantId(participant.uniqueKey);
    try {
      const res = await API.put('/api/razorpay/accommodation/apply', {
        registrationId: participant.paymentId,
        participantBarcode: participant.barcode,
        roll: participant.roll,
        accommodation: newStatus,
      });

      if (res.data?.ok) {
        toast.success(
          isYes
            ? `Accommodation APPROVED for ${participant.name || 'Student'} (${participant.normalizedGender === 'FEMALE' ? 'Girl' : 'Male'})`
            : `Accommodation revoked for ${participant.name || 'Student'}`
        );

        // Update in-memory state immediately
        setPayments((prev) =>
          prev.map((reg) => {
            if (reg._id === participant.paymentId) {
              const updatedParticipants = reg.participants.map((p) => {
                if ((p.barcode && p.barcode === participant.barcode) || (p.roll && p.roll === participant.roll)) {
                  return { ...p, accommodation: newStatus };
                }
                return p;
              });
              return { ...reg, participants: updatedParticipants };
            }
            return reg;
          })
        );

        // Refresh quota stats
        await fetchQuotaStats();
      }
    } catch (err) {
      console.error('Error applying accommodation:', err);
      toast.error(err.response?.data?.error || 'Failed to update accommodation status');
    } finally {
      setApplyingParticipantId(null);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredParticipants.length === 0) {
      toast.warning('No data to export');
      return;
    }
    setExporting(true);
    try {
      const headers = [
        'S.No',
        'Participant Name',
        'Roll Number',
        'Gender',
        'College Name',
        'Branch',
        'Year',
        'Mobile',
        'Email',
        'Team ID',
        'School Name',
        'Event Name',
        'Accommodation Status',
      ];

      const rows = filteredParticipants.map((p, idx) => [
        idx + 1,
        p.name || '-',
        p.roll || '-',
        p.normalizedGender === 'FEMALE' ? 'Girl / Female' : 'Male',
        p.collegeDisplay || '-',
        p.branch || '-',
        p.year || '-',
        p.mobile || '-',
        p.email || '-',
        p.teamId || '-',
        p.schoolName || '-',
        p.eventName || '-',
        (p.accommodation || '').toUpperCase() === 'YES' ? 'YES' : 'NO',
      ]);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Other College Accommodation');
      XLSX.writeFile(wb, `Other_College_Accommodation_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Accommodation list exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export accommodation list');
    } finally {
      setExporting(false);
    }
  };

  // Check if button should be disabled for a participant
  const isLimitReachedFor = (participant) => {
    if (quotaStats.total >= OVERALL_LIMIT) return { reached: true, reason: 'Overall Limit (150) Reached' };
    if (participant.normalizedGender === 'MALE' && quotaStats.male >= MALE_LIMIT) {
      return { reached: true, reason: 'Male Limit (100) Reached' };
    }
    if (participant.normalizedGender === 'FEMALE' && quotaStats.female >= FEMALE_LIMIT) {
      return { reached: true, reason: 'Girl Limit (50) Reached' };
    }
    return { reached: false, reason: '' };
  };

  // Table columns definition
  const columns = [
    'S.No',
    'Participant Name & Roll',
    'Gender',
    'College Name',
    'School & Event',
    'Team ID',
    'Contact Info',
    'Accommodation Status',
    'Action',
  ];

  const tableRows = useMemo(() => {
    return filteredParticipants.map((p, index) => {
      const isAccommodated = (p.accommodation || '').toUpperCase() === 'YES';
      const isApplying = applyingParticipantId === p.uniqueKey;
      const limitCheck = isLimitReachedFor(p);

      return [
        index + 1,
        {
          value: p.name || '-',
          display: (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {p.name || '-'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                {p.roll || 'No Roll No'}
              </Typography>
            </Box>
          ),
        },
        {
          value: p.normalizedGender,
          display: (
            <Chip
              icon={
                p.normalizedGender === 'FEMALE' ? (
                  <FemaleIcon sx={{ fontSize: '15px !important', color: '#db2777 !important' }} />
                ) : (
                  <MaleIcon sx={{ fontSize: '15px !important', color: '#2563eb !important' }} />
                )
              }
              label={p.normalizedGender === 'FEMALE' ? 'Girl' : 'Male'}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                backgroundColor: p.normalizedGender === 'FEMALE' ? 'rgba(236, 72, 153, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                color: p.normalizedGender === 'FEMALE' ? '#be185d' : '#1d4ed8',
                border: `1px solid ${p.normalizedGender === 'FEMALE' ? 'rgba(236, 72, 153, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
              }}
            />
          ),
        },
        {
          value: p.collegeDisplay,
          display: (
            <Box>
              <Chip
                label={p.collegeDisplay}
                size="small"
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  maxWidth: 220,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: '#0f766e',
                  borderColor: '#99f6e4',
                  backgroundColor: '#f0fdfa',
                }}
              />
              {p.branch && (
                <Typography variant="caption" display="block" sx={{ color: '#64748b', mt: 0.5 }}>
                  {p.branch} {p.year ? `(${p.year})` : ''}
                </Typography>
              )}
            </Box>
          ),
        },
        {
          value: `${p.schoolName} ${p.eventName}`,
          display: (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                {p.eventName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {p.schoolName}
              </Typography>
            </Box>
          ),
        },
        {
          value: p.teamId,
          display: (
            <Chip
              label={p.teamId}
              size="small"
              sx={{
                fontWeight: 700,
                color: '#4338ca',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}
            />
          ),
        },
        {
          value: `${p.mobile || ''} ${p.email || ''}`,
          display: (
            <Box>
              {p.mobile && (
                <Typography variant="caption" display="flex" alignItems="center" gap={0.5} sx={{ color: '#334155' }}>
                  <PhoneIcon sx={{ fontSize: 13, color: '#64748b' }} /> {p.mobile}
                </Typography>
              )}
              {p.email && (
                <Typography variant="caption" display="flex" alignItems="center" gap={0.5} sx={{ color: '#64748b' }}>
                  <EmailIcon sx={{ fontSize: 13, color: '#94a3b8' }} /> {p.email}
                </Typography>
              )}
            </Box>
          ),
        },
        {
          value: isAccommodated ? 'YES' : 'NO',
          display: isAccommodated ? (
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#15803d !important' }} />}
              label="YES"
              size="small"
              sx={{
                fontWeight: 800,
                color: '#15803d',
                backgroundColor: 'rgba(34, 197, 94, 0.14)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            />
          ) : (
            <Chip
              icon={<CancelIcon sx={{ fontSize: '14px !important', color: '#94a3b8 !important' }} />}
              label="NO"
              size="small"
              sx={{
                fontWeight: 700,
                color: '#64748b',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
              }}
            />
          ),
        },
        {
          value: isAccommodated ? 'APPLIED' : 'NOT_APPLIED',
          display: isAccommodated ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label="Accommodated"
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: '0.72rem' }}
              />
              <Button
                size="small"
                variant="text"
                color="error"
                disabled={isApplying}
                onClick={() => setRevokeDialog({ open: true, participant: p })}
                sx={{ textTransform: 'none', fontSize: '0.75rem', p: 0.5, minWidth: 0 }}
              >
                Revoke
              </Button>
            </Stack>
          ) : (
            <Tooltip title={limitCheck.reached ? limitCheck.reason : 'Allocate accommodation to this participant'}>
              <span>
                <Button
                  size="small"
                  variant="contained"
                  disabled={limitCheck.reached || isApplying}
                  onClick={() => handleToggleAccommodation(p, 'YES')}
                  startIcon={
                    isApplying ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <HotelIcon sx={{ fontSize: 16 }} />
                    )
                  }
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    py: 0.5,
                    px: 1.5,
                    background: limitCheck.reached
                      ? '#cbd5e1'
                      : p.normalizedGender === 'FEMALE'
                        ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
                        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    boxShadow: limitCheck.reached ? 'none' : '0 2px 8px rgba(37, 99, 235, 0.25)',
                    '&:hover': {
                      background:
                        p.normalizedGender === 'FEMALE'
                          ? 'linear-gradient(135deg, #db2777 0%, #be185d 100%)'
                          : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    },
                  }}
                >
                  {isApplying ? 'Applying...' : limitCheck.reached ? 'Limit Full' : 'Apply Accommodation'}
                </Button>
              </span>
            </Tooltip>
          ),
        },
      ];
    });
  }, [filteredParticipants, applyingParticipantId, quotaStats]);

  const malePercent = Math.min(100, Math.round((quotaStats.male / MALE_LIMIT) * 100));
  const femalePercent = Math.min(100, Math.round((quotaStats.female / FEMALE_LIMIT) * 100));
  const totalPercent = Math.min(100, Math.round((quotaStats.total / OVERALL_LIMIT) * 100));

  return (
    <PageContainer sx={{ px: { xs: 1.5, md: 3 }, py: { xs: 2, md: 3 } }}>
      {/* Header */}
      <PageHeader
        title="Apply Accommodation"
        subtitle="Manage and allocate accommodation exclusively for paid participants from other colleges"
        icon={<HotelIcon sx={{ color: '#2563eb' }} />}
        actions={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              onClick={fetchData}
              disabled={loading}
              startIcon={<RefreshIcon />}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              size="small"
              color="success"
              onClick={handleExportExcel}
              disabled={exporting || filteredParticipants.length === 0}
              startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              }}
            >
              {exporting ? 'Exporting...' : 'Export Excel'}
            </Button>
          </Stack>
        }
      />

      {/* Quota Progress Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {/* Male Quota Card */}
        <Card
          elevation={0}
          sx={{
            borderRadius: '16px',
            border: '1px solid #bfdbfe',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.08)',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e40af' }}>
                Male Accommodation
              </Typography>
              <Chip
                icon={<MaleIcon sx={{ fontSize: '14px !important', color: '#1e40af !important' }} />}
                label={quotaStats.male >= MALE_LIMIT ? 'FULL' : `${MALE_LIMIT - quotaStats.male} left`}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  backgroundColor: quotaStats.male >= MALE_LIMIT ? '#fee2e2' : '#dbeafe',
                  color: quotaStats.male >= MALE_LIMIT ? '#dc2626' : '#1e40af',
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e3a8a', mb: 1 }}>
              {quotaStats.male}{' '}
              <Typography component="span" variant="body1" sx={{ color: '#64748b', fontWeight: 600 }}>
                / {MALE_LIMIT}
              </Typography>
            </Typography>
            <LinearProgress
              variant="determinate"
              value={malePercent}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#bfdbfe',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor: quotaStats.male >= MALE_LIMIT ? '#ef4444' : '#2563eb',
                },
              }}
            />
            <Typography variant="caption" sx={{ color: '#475569', mt: 0.5, display: 'block', fontWeight: 600 }}>
              {malePercent}% allocated (Limit: {MALE_LIMIT} boys)
            </Typography>
          </CardContent>
        </Card>

        {/* Girl Quota Card */}
        <Card
          elevation={0}
          sx={{
            borderRadius: '16px',
            border: '1px solid #fbcfe8',
            background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
            boxShadow: '0 4px 14px rgba(236, 72, 153, 0.08)',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#9d174d' }}>
                Girl Accommodation
              </Typography>
              <Chip
                icon={<FemaleIcon sx={{ fontSize: '14px !important', color: '#9d174d !important' }} />}
                label={quotaStats.female >= FEMALE_LIMIT ? 'FULL' : `${FEMALE_LIMIT - quotaStats.female} left`}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  backgroundColor: quotaStats.female >= FEMALE_LIMIT ? '#fee2e2' : '#fce7f3',
                  color: quotaStats.female >= FEMALE_LIMIT ? '#dc2626' : '#9d174d',
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#831843', mb: 1 }}>
              {quotaStats.female}{' '}
              <Typography component="span" variant="body1" sx={{ color: '#64748b', fontWeight: 600 }}>
                / {FEMALE_LIMIT}
              </Typography>
            </Typography>
            <LinearProgress
              variant="determinate"
              value={femalePercent}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#fbcfe8',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor: quotaStats.female >= FEMALE_LIMIT ? '#ef4444' : '#db2777',
                },
              }}
            />
            <Typography variant="caption" sx={{ color: '#475569', mt: 0.5, display: 'block', fontWeight: 600 }}>
              {femalePercent}% allocated (Limit: {FEMALE_LIMIT} girls)
            </Typography>
          </CardContent>
        </Card>

        {/* Overall Limit Card */}
        <Card
          elevation={0}
          sx={{
            borderRadius: '16px',
            border: '1px solid #a7f3d0',
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#065f46' }}>
                Total Capacity
              </Typography>
              <Chip
                label={quotaStats.total >= OVERALL_LIMIT ? 'FULL' : `${OVERALL_LIMIT - quotaStats.total} left`}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  backgroundColor: quotaStats.total >= OVERALL_LIMIT ? '#fee2e2' : '#d1fae5',
                  color: quotaStats.total >= OVERALL_LIMIT ? '#dc2626' : '#065f46',
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#064e3b', mb: 1 }}>
              {quotaStats.total}{' '}
              <Typography component="span" variant="body1" sx={{ color: '#64748b', fontWeight: 600 }}>
                / {OVERALL_LIMIT}
              </Typography>
            </Typography>
            <LinearProgress
              variant="determinate"
              value={totalPercent}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#a7f3d0',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor: quotaStats.total >= OVERALL_LIMIT ? '#ef4444' : '#059669',
                },
              }}
            />
            <Typography variant="caption" sx={{ color: '#475569', mt: 0.5, display: 'block', fontWeight: 600 }}>
              {totalPercent}% filled (Max 150 overall)
            </Typography>
          </CardContent>
        </Card>

        {/* Other College Pool Card */}
        <Card
          elevation={0}
          sx={{
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#334155' }}>
                Other College Pool
              </Typography>
              <Chip
                icon={<SchoolIcon sx={{ fontSize: '13px !important' }} />}
                label="Paid Only"
                size="small"
                sx={{ fontWeight: 700, fontSize: '0.72rem', backgroundColor: '#f1f5f9' }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
              {otherCollegeParticipants.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
              Paid participants eligible for accommodation from non-Aditya campuses.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filter Toolbar */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 3,
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterAltIcon sx={{ fontSize: 20, color: '#2563eb' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Filter Participants
            </Typography>
            <Chip
              label={`${filteredParticipants.length} of ${otherCollegeParticipants.length} Shown`}
              size="small"
              sx={{ fontWeight: 700, backgroundColor: '#eff6ff', color: '#1d4ed8' }}
            />
          </Box>

          {(schoolFilter !== 'ALL' ||
            eventFilter !== 'ALL' ||
            teamIdFilter !== 'ALL' ||
            genderFilter !== 'ALL' ||
            statusFilter !== 'ALL' ||
            searchQuery) && (
              <Button
                size="small"
                variant="text"
                color="error"
                onClick={handleResetFilters}
                startIcon={<FilterAltOffIcon sx={{ fontSize: 16 }} />}
                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}
              >
                Reset Filters
              </Button>
            )}
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          {/* School Dropdown */}
          <TextField
            select
            size="small"
            label="School"
            value={schoolFilter}
            onChange={(e) => handleSchoolChange(e.target.value)}
            sx={{ minWidth: 200, flex: 1 }}
          >
            <MenuItem value="ALL">All Schools</MenuItem>
            {schoolOptions.map((sch) => (
              <MenuItem key={sch} value={sch}>
                {sch}
              </MenuItem>
            ))}
          </TextField>

          {/* Events Dropdown */}
          <TextField
            select
            size="small"
            label="Event"
            value={eventFilter}
            onChange={(e) => handleEventChange(e.target.value)}
            sx={{ minWidth: 220, flex: 1.2 }}
          >
            <MenuItem value="ALL">All Events</MenuItem>
            {eventOptions.map((ev) => (
              <MenuItem key={ev} value={ev}>
                {ev}
              </MenuItem>
            ))}
          </TextField>

          {/* Team ID Dropdown */}
          <TextField
            select
            size="small"
            label="Team ID"
            value={teamIdFilter}
            onChange={(e) => setTeamIdFilter(e.target.value)}
            sx={{ minWidth: 160, flex: 0.8 }}
          >
            <MenuItem value="ALL">All Teams</MenuItem>
            {teamIdOptions.map((tid) => (
              <MenuItem key={tid} value={tid}>
                {tid}
              </MenuItem>
            ))}
          </TextField>

          {/* Gender Dropdown */}
          <TextField
            select
            size="small"
            label="Gender"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="ALL">All Genders</MenuItem>
            <MenuItem value="MALE">Male</MenuItem>
            <MenuItem value="FEMALE">Girl / Female</MenuItem>
          </TextField>

          {/* Accommodation Status Dropdown */}
          <TextField
            select
            size="small"
            label="Accommodation"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="ALL">All Status</MenuItem>
            <MenuItem value="YES">Accommodated (YES)</MenuItem>
            <MenuItem value="NO">Not Accommodated (NO)</MenuItem>
          </TextField>
        </Box>

        {/* Search Field */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search by participant name, roll number, college name, team ID, mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Paper>

      {/* Main Participants Data Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </Box>
      ) : filteredParticipants.length === 0 ? (
        <EmptyState
          title="No Participants Found"
          description="No eligible other college paid participants match your selected filters."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={tableRows}
          nonSortableColumns={[0, 8]}
          alignments={['center', 'left', 'center', 'left', 'left', 'center', 'left', 'center', 'center']}
          defaultRowsPerPage={20}
        />
      )}

      {/* Revoke Confirmation Dialog */}
      <Dialog
        open={revokeDialog.open}
        onClose={() => setRevokeDialog({ open: false, participant: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#dc2626' }}>Revoke Accommodation?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#334155' }}>
            Are you sure you want to change the accommodation status of{' '}
            <strong>{revokeDialog.participant?.name || 'this participant'}</strong> back to <strong>"NO"</strong>?
            This will free up one slot in the accommodation quota.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setRevokeDialog({ open: false, participant: null })}
            variant="outlined"
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              const p = revokeDialog.participant;
              setRevokeDialog({ open: false, participant: null });
              if (p) handleToggleAccommodation(p, 'No');
            }}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            Yes, Revoke
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ApplyAccommodation;
