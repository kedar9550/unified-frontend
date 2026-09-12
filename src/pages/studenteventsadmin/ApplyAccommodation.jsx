import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton,
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
  Male as MaleIcon,
  Female as FemaleIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Payment as PaymentIcon,
  LocalAtm as CashIcon,
  UploadFile as UploadFileIcon,
  CloudUpload as CloudUploadIcon,
  Verified as VerifiedIcon,
  Close as CloseIcon,
  WarningAmber as WarningAmberIcon,
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
const RATE_PER_DAY = 200;

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

const loadRazorpaySDK = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
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

  // Filters (Schools and Events removed - Team ID filter only)
  const [teamIdFilter, setTeamIdFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  // Apply Accommodation Dialog State
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [selectedDays, setSelectedDays] = useState(1);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Revoke confirmation dialog state
  const [revokeDialog, setRevokeDialog] = useState({ open: false, participant: null });

  // Bulk Verify Payment Dialog State
  const [bulkVerifyDialogOpen, setBulkVerifyDialogOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [parsedBulkRows, setParsedBulkRows] = useState([]);
  const [verifyingBulk, setVerifyingBulk] = useState(false);
  const [bulkVerifyResults, setBulkVerifyResults] = useState(null);
  const fileInputRef = useRef(null);

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

  // Extract all participants who have accommodation = 'YES' or accommodationPayment.paid === true
  const accommodatedParticipants = useMemo(() => {
    const list = [];
    payments.forEach((payment) => {
      const parts = Array.isArray(payment.participants) ? payment.participants : [];
      parts.forEach((p, idx) => {
        const isAcc = (p.accommodation || '').toUpperCase() === 'YES' || p.accommodationPayment?.paid === true;
        if (isAcc) {
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

  const accommodatedMaleCount = useMemo(() => {
    return accommodatedParticipants.filter((p) => p.normalizedGender === 'MALE').length;
  }, [accommodatedParticipants]);

  const accommodatedFemaleCount = useMemo(() => {
    return accommodatedParticipants.filter((p) => p.normalizedGender === 'FEMALE').length;
  }, [accommodatedParticipants]);

  // Extract unique Team IDs
  const teamIdOptions = useMemo(() => {
    const set = new Set();
    otherCollegeParticipants.forEach((p) => {
      if (p.teamId && p.teamId !== '-') {
        set.add(p.teamId);
      }
    });
    return Array.from(set).sort();
  }, [otherCollegeParticipants]);

  const handleResetFilters = () => {
    setTeamIdFilter('ALL');
    setGenderFilter('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
  };

  // Filter participants by teamId, gender, status, search
  const filteredParticipants = useMemo(() => {
    return otherCollegeParticipants.filter((p) => {
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
        return (
          name.includes(q) ||
          roll.includes(q) ||
          college.includes(q) ||
          mobile.includes(q) ||
          email.includes(q) ||
          team.includes(q)
        );
      }

      return true;
    });
  }, [otherCollegeParticipants, teamIdFilter, genderFilter, statusFilter, searchQuery]);

  // Check limits
  const isLimitReachedFor = (participant) => {
    if (quotaStats.total >= OVERALL_LIMIT) return { reached: true, reason: 'Overall Limit (150) Reached' };
    if (participant.normalizedGender === 'MALE' && quotaStats.male >= MALE_LIMIT) {
      return { reached: true, reason: 'Male Limit (100) Reached' };
    }
    if (participant.normalizedGender === 'FEMALE' && quotaStats.female >= FEMALE_LIMIT) {
      return { reached: true, reason: 'Female Limit (50) Reached' };
    }
    return { reached: false, reason: '' };
  };

  // Open apply dialog
  const handleOpenApplyDialog = (participant) => {
    const limitCheck = isLimitReachedFor(participant);
    if (limitCheck.reached) {
      toast.error(limitCheck.reason);
      return;
    }
    setSelectedParticipant(participant);
    setSelectedDays(1);
    setPaymentDialogOpen(true);
  };

  // Process Online Razorpay Payment
  const handlePayOnlineRazorpay = async () => {
    if (!selectedParticipant) return;
    setProcessingPayment(true);

    const totalAmountRupees = selectedDays * RATE_PER_DAY;
    const amountInPaise = totalAmountRupees * 100;

    try {
      const isLoaded = await loadRazorpaySDK();
      if (!isLoaded) {
        toast.error('Failed to load Razorpay payment SDK. Please check your internet connection.');
        setProcessingPayment(false);
        return;
      }

      // 1. Create order on backend
      const orderRes = await API.post('/api/razorpay/accommodation/create-order', {
        amount: amountInPaise,
        receipt: `acc_${selectedParticipant.roll || selectedParticipant.teamId}_${Date.now()}`.substring(0, 40),
      });

      const orderData = orderRes.data;
      if (!orderData?.orderId) {
        throw new Error('Failed to create Razorpay accommodation order');
      }

      // 2. Open Razorpay modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_live_Kmh34Xa4jArEXT',
        amount: amountInPaise,
        currency: 'INR',
        name: 'Eventveda Accommodation',
        description: `Accommodation Fee for ${selectedDays} Day(s)`,
        order_id: orderData.orderId,
        prefill: {
          name: selectedParticipant.name || '',
          email: selectedParticipant.email || '',
          contact: selectedParticipant.mobile || '',
        },
        theme: {
          color: '#2563eb',
        },
        handler: async function (response) {
          try {
            // 3. Save accommodation status and payment raw data to backend
            const saveRes = await API.put('/api/razorpay/accommodation/apply', {
              teamId: selectedParticipant.teamId,
              roll: selectedParticipant.roll,
              rollnumber: selectedParticipant.roll,
              email: selectedParticipant.email,
              registrationId: selectedParticipant.paymentId,
              participantBarcode: selectedParticipant.barcode,
              participantIndex: selectedParticipant.participantIndex,
              days: selectedDays,
              dayscount: selectedDays,
              daysCount: selectedDays,
              amount: totalAmountRupees,
              payment: response,
              accommodation: 'Yes',
              paymentMethod: 'RAZORPAY',
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              rawPaymentData: response,
            });

            if (saveRes.data?.ok) {
              toast.success(
                `Payment of ₹${totalAmountRupees} successful! Accommodation allocated for ${selectedParticipant.name || 'Student'}`
              );

              // Update in-memory state
              setPayments((prev) =>
                prev.map((reg) => {
                  if (reg._id === selectedParticipant.paymentId) {
                    const updatedParts = reg.participants.map((p) => {
                      if (
                        (p.roll && String(p.roll).trim() === String(selectedParticipant.roll).trim()) ||
                        (p.barcode && p.barcode === selectedParticipant.barcode)
                      ) {
                        return {
                          ...p,
                          accommodation: 'Yes',
                          days: selectedDays,
                          dayscount: selectedDays,
                          daysCount: selectedDays,
                          payment: response,
                          accommodationPayment: {
                            paid: true,
                            amount: totalAmountRupees,
                            days: selectedDays,
                            dayscount: selectedDays,
                            daysCount: selectedDays,
                            payment: response,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            paidAt: new Date(),
                            rawPaymentData: response,
                          },
                        };
                      }
                      return p;
                    });
                    return { ...reg, participants: updatedParts };
                  }
                  return reg;
                })
              );

              setPaymentDialogOpen(false);
              await fetchQuotaStats();
            }
          } catch (saveErr) {
            console.error('Error saving accommodation payment:', saveErr);
            toast.error(saveErr.response?.data?.error || 'Payment succeeded but failed to update status');
          } finally {
            setProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        toast.error(`Payment failed: ${resp.error?.description || 'Gateway error'}`);
        setProcessingPayment(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Payment initiation error:', err);
      toast.error(err.response?.data?.error || 'Failed to initiate accommodation payment');
      setProcessingPayment(false);
    }
  };

  // Process Direct Cash / Manual Payment
  const handlePayCashManual = async () => {
    if (!selectedParticipant) return;
    setProcessingPayment(true);

    const totalAmountRupees = selectedDays * RATE_PER_DAY;
    const manualPaymentData = {
      paymentMethod: 'CASH',
      days: selectedDays,
      dayscount: selectedDays,
      daysCount: selectedDays,
      amount: totalAmountRupees,
      collectedAt: new Date(),
      teamId: selectedParticipant.teamId,
      roll: selectedParticipant.roll,
      rollnumber: selectedParticipant.roll,
    };

    try {
      const res = await API.put('/api/razorpay/accommodation/apply', {
        teamId: selectedParticipant.teamId,
        roll: selectedParticipant.roll,
        rollnumber: selectedParticipant.roll,
        email: selectedParticipant.email,
        registrationId: selectedParticipant.paymentId,
        participantBarcode: selectedParticipant.barcode,
        participantIndex: selectedParticipant.participantIndex,
        days: selectedDays,
        dayscount: selectedDays,
        daysCount: selectedDays,
        amount: totalAmountRupees,
        payment: manualPaymentData,
        accommodation: 'Yes',
        paymentMethod: 'CASH',
        razorpayOrderId: `MANUAL_ORDER_${Date.now()}`,
        razorpayPaymentId: `CASH_${Date.now()}`,
        rawPaymentData: manualPaymentData,
      });

      if (res.data?.ok) {
        toast.success(
          `Cash payment of ₹${totalAmountRupees} recorded! Accommodation allocated for ${selectedParticipant.name || 'Student'}`
        );

        // Update in-memory state
        setPayments((prev) =>
          prev.map((reg) => {
            if (reg._id === selectedParticipant.paymentId) {
              const updatedParts = reg.participants.map((p) => {
                if (
                  (p.roll && String(p.roll).trim() === String(selectedParticipant.roll).trim()) ||
                  (p.barcode && p.barcode === selectedParticipant.barcode)
                ) {
                  return {
                    ...p,
                    accommodation: 'Yes',
                    days: selectedDays,
                    dayscount: selectedDays,
                    daysCount: selectedDays,
                    payment: manualPaymentData,
                    accommodationPayment: {
                      paid: true,
                      amount: totalAmountRupees,
                      days: selectedDays,
                      dayscount: selectedDays,
                      daysCount: selectedDays,
                      payment: manualPaymentData,
                      razorpayPaymentId: `CASH_${Date.now()}`,
                      paidAt: new Date(),
                      rawPaymentData: manualPaymentData,
                    },
                  };
                }
                return p;
              });
              return { ...reg, participants: updatedParts };
            }
            return reg;
          })
        );

        setPaymentDialogOpen(false);
        await fetchQuotaStats();
      }
    } catch (err) {
      console.error('Manual payment error:', err);
      toast.error(err.response?.data?.error || 'Failed to record accommodation payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Revoke accommodation
  const handleRevokeAccommodation = async (participant) => {
    try {
      const res = await API.put('/api/razorpay/accommodation/apply', {
        teamId: participant.teamId,
        roll: participant.roll,
        rollnumber: participant.roll,
        email: participant.email,
        registrationId: participant.paymentId,
        participantBarcode: participant.barcode,
        participantIndex: participant.participantIndex,
        accommodation: 'No',
      });

      if (res.data?.ok) {
        toast.success(`Accommodation revoked for ${participant.name || 'Student'}`);

        setPayments((prev) =>
          prev.map((reg) => {
            if (reg._id === participant.paymentId) {
              const updatedParts = reg.participants.map((p) => {
                if (
                  (p.roll && String(p.roll).trim() === String(participant.roll).trim()) ||
                  (p.barcode && p.barcode === participant.barcode)
                ) {
                  return {
                    ...p,
                    accommodation: 'No',
                    accommodationPayment: { ...(p.accommodationPayment || {}), paid: false },
                  };
                }
                return p;
              });
              return { ...reg, participants: updatedParts };
            }
            return reg;
          })
        );

        await fetchQuotaStats();
      }
    } catch (err) {
      console.error('Error revoking accommodation:', err);
      toast.error(err.response?.data?.error || 'Failed to revoke accommodation');
    }
  };

  // Download Sample Excel Template for bulk payment verification
  const handleDownloadSampleTemplate = () => {
    const sampleHeaders = ['id', 'email'];
    const sampleRows = [
      ['pay_TalWW12AIChRKF', 'bethapudikoushik@gmail.com'],
      ['pay_TalY4p2ojyGU8n', 'mukotamitadiwa@gmail.com'],
      ['pay_TalZU7pUZSCg7R', 'foyataessling@gmail.com'],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([sampleHeaders, ...sampleRows]);
    ws['!cols'] = [{ wch: 28 }, { wch: 35 }];

    for (let c = 0; c < sampleHeaders.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
          fill: { fgColor: { rgb: '4F46E5' } },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'VerifyPayments');
    XLSX.writeFile(wb, 'Bulk_Accommodation_Payments_Sample.xlsx');
    toast.success('Sample Excel template downloaded!');
  };

  // Handle Excel file selection and client-side parsing
  const handleExcelFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBulkFile(file);
    setBulkVerifyResults(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length === 0) {
          toast.error('The uploaded Excel file is empty.');
          setParsedBulkRows([]);
          return;
        }

        // Header detection
        let idColIdx = -1;
        let emailColIdx = -1;
        let startRowIdx = 1;

        const headerRow = rawRows[0] || [];
        headerRow.forEach((cell, idx) => {
          const val = String(cell || '').trim().toLowerCase().replace(/[\s_-]/g, '');
          if (['id', 'paymentid', 'razorpaypaymentid', 'payment', 'razorpayid', 'paymentreference'].includes(val)) {
            idColIdx = idx;
          } else if (['email', 'emailid', 'studentemail', 'mail', 'participantemail'].includes(val)) {
            emailColIdx = idx;
          }
        });

        // Fallback substring checks
        if (idColIdx === -1 || emailColIdx === -1) {
          headerRow.forEach((cell, idx) => {
            const val = String(cell || '').trim().toLowerCase();
            if (idColIdx === -1 && (val.includes('id') || val.startsWith('pay_'))) {
              idColIdx = idx;
            }
            if (emailColIdx === -1 && (val.includes('email') || val.includes('@'))) {
              emailColIdx = idx;
            }
          });
        }

        // Default fallbacks: column 0 = id, column 1 = email
        if (idColIdx === -1) idColIdx = 0;
        if (emailColIdx === -1) emailColIdx = 1;

        // If row 0 contains data (e.g. cell starts with pay_ or contains @)
        const cell0 = String(headerRow[idColIdx] || '').trim();
        const cell1 = String(headerRow[emailColIdx] || '').trim();
        if (cell0.startsWith('pay_') || cell1.includes('@')) {
          startRowIdx = 0;
        }

        const parsed = [];
        for (let r = startRowIdx; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row) continue;
          const idVal = String(row[idColIdx] || '').trim();
          const emailVal = String(row[emailColIdx] || '').trim();

          if (!idVal && !emailVal) continue;

          parsed.push({
            rowNum: r + 1,
            id: idVal,
            email: emailVal,
          });
        }

        if (parsed.length === 0) {
          toast.warning('No valid rows found in the uploaded file.');
          setParsedBulkRows([]);
          return;
        }

        setParsedBulkRows(parsed);
        toast.success(`Loaded ${parsed.length} rows from Excel file.`);
      } catch (err) {
        console.error('Excel parse error:', err);
        toast.error('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Preview rows mapped against loaded accommodation data
  const bulkRowsPreview = useMemo(() => {
    if (!parsedBulkRows.length) return [];

    const accMap = new Map();
    const allMap = new Map();

    payments.forEach((reg) => {
      (reg.participants || []).forEach((p, idx) => {
        const email = String(p.email || '').trim().toLowerCase();
        if (!email) return;

        const isAcc = (p.accommodation || '').trim().toUpperCase() === 'YES' || p.accommodationPayment?.paid === true;
        const participantInfo = {
          ...p,
          teamId: reg.teamId || '-',
          eventName: reg.eventName || '-',
          regId: reg._id,
          participantIndex: idx,
          isAcc,
          hasExistingPaymentId: !!(p.accommodationPayment?.razorpayPaymentId || p.payment?.razorpay_payment_id),
          existingPaymentId: p.accommodationPayment?.razorpayPaymentId || p.payment?.razorpay_payment_id || null,
          existingAmount: p.accommodationPayment?.amount,
          existingDays: p.accommodationPayment?.days,
        };

        allMap.set(email, participantInfo);
        if (isAcc) {
          accMap.set(email, participantInfo);
        }
      });
    });

    return parsedBulkRows.map((row) => {
      const emailKey = (row.email || '').trim().toLowerCase();
      const accMatch = accMap.get(emailKey);
      const anyMatch = allMap.get(emailKey);

      let matchStatus = 'NOT_FOUND';
      let matchLabel = 'Not Found';
      let matchColor = 'error';

      if (accMatch) {
        if (!accMatch.hasExistingPaymentId) {
          matchStatus = 'READY_MISSING';
          matchLabel = 'Matched (Missing Payment Data)';
          matchColor = 'warning';
        } else {
          matchStatus = 'READY_UPDATE';
          matchLabel = 'Matched (Has Existing Payment)';
          matchColor = 'info';
        }
      } else if (anyMatch) {
        matchStatus = 'NOT_ACCOMMODATED';
        matchLabel = 'Found (Accommodation is NO)';
        matchColor = 'secondary';
      }

      return {
        ...row,
        matched: !!accMatch,
        participant: accMatch || anyMatch || null,
        matchStatus,
        matchLabel,
        matchColor,
      };
    });
  }, [parsedBulkRows, payments]);

  // Execute bulk verification call to backend
  const handleExecuteBulkVerify = async () => {
    if (parsedBulkRows.length === 0) {
      toast.error('No rows to verify.');
      return;
    }

    setVerifyingBulk(true);
    try {
      const items = parsedBulkRows.map((r) => ({ id: r.id, email: r.email }));
      const res = await API.post('/api/razorpay/accommodation/bulk-verify-payments', { items });

      if (res.data?.ok) {
        toast.success(res.data.message || `Verified and updated ${res.data.summary?.updatedCount || 0} participants!`);
        setBulkVerifyResults(res.data);
        await fetchData();
      } else {
        toast.error(res.data?.error || 'Bulk verification failed');
      }
    } catch (err) {
      console.error('Bulk verification error:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to bulk verify accommodation payments');
    } finally {
      setVerifyingBulk(false);
    }
  };

  // Download Accommodation Data Excel (Flat sheet with only Accommodated = YES participants)
  const handleExportAccommodationExcel = (targetGender = 'ALL') => {
    let list = accommodatedParticipants;
    if (targetGender === 'MALE') {
      list = accommodatedParticipants.filter((p) => p.normalizedGender === 'MALE');
    } else if (targetGender === 'FEMALE') {
      list = accommodatedParticipants.filter((p) => p.normalizedGender === 'FEMALE');
    }

    if (list.length === 0) {
      toast.warning(`No accommodated ${targetGender === 'ALL' ? '' : targetGender.toLowerCase()} participants found to download.`);
      return;
    }
    setExporting(true);
    try {
      const headers = [
        'S.No',
        'Participant Name',
        'Roll Number / ID',
        'Gender',
        'Hostel Assigned',
        'College Name',
        'Branch / Department',
        'Year',
        'Mobile Number',
        'Email Address',
        'Team ID',
        'Event Name',
        'School / Domain',
        'Accommodation Status',
        'Days Booked',
        'Rate / Day',
        'Total Amount',
        'Payment Mode',
        'Payment / Order ID',
        'Allocation / Payment Date',
        'Barcode / QR Code',
        'Hostel Checked-in Status',
      ];

      const colWidths = [
        { wch: 6 },
        { wch: 26 },
        { wch: 18 },
        { wch: 10 },
        { wch: 16 },
        { wch: 32 },
        { wch: 22 },
        { wch: 8 },
        { wch: 16 },
        { wch: 28 },
        { wch: 16 },
        { wch: 24 },
        { wch: 22 },
        { wch: 16 },
        { wch: 14 },
        { wch: 12 },
        { wch: 14 },
        { wch: 18 },
        { wch: 28 },
        { wch: 22 },
        { wch: 16 },
        { wch: 18 },
      ];

      const rows = list.map((p, idx) => {
        const days =
          p.accommodationPayment?.days ||
          p.accommodationPayment?.dayscount ||
          p.accommodationPayment?.daysCount ||
          p.days ||
          p.dayscount ||
          p.daysCount ||
          1;

        const amount = p.accommodationPayment?.amount || days * RATE_PER_DAY;

        let paymentMode = 'DIRECT / CASH';
        if (p.accommodationPayment?.paymentMethod) {
          paymentMode = p.accommodationPayment.paymentMethod.toUpperCase();
        } else if (p.accommodationPayment?.razorpayPaymentId) {
          paymentMode = p.accommodationPayment.razorpayPaymentId.startsWith('CASH') ? 'CASH' : 'ONLINE (RAZORPAY)';
        } else if (p.payment?.razorpay_payment_id) {
          paymentMode = 'ONLINE (RAZORPAY)';
        }

        const paymentId =
          p.accommodationPayment?.razorpayPaymentId ||
          p.accommodationPayment?.razorpayOrderId ||
          p.accommodationPayment?.payment?.razorpay_payment_id ||
          p.payment?.razorpay_payment_id ||
          '-';

        let dateStr = '-';
        const dateVal = p.accommodationPayment?.paidAt || p.accommodationPayment?.appliedAt || p.updatedAt || p.createdAt;
        if (dateVal) {
          try {
            dateStr = new Date(dateVal).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
          } catch {
            dateStr = String(dateVal);
          }
        }

        const hostelType = p.normalizedGender === 'FEMALE' ? 'Girls Hostel' : 'Boys Hostel';
        const checkedInStatus = p.accommodationCheckedIn ? 'Checked In' : 'Not Checked In';

        return [
          idx + 1,
          p.name || '-',
          p.roll || p.rollnumber || '-',
          p.normalizedGender === 'FEMALE' ? 'Girl' : 'Male',
          hostelType,
          p.collegeDisplay || '-',
          p.branch || p.department || '-',
          p.year || '-',
          p.mobile || '-',
          p.email || '-',
          p.teamId || '-',
          p.eventName || '-',
          p.schoolName || p.schoolCategory || '-',
          'YES',
          `${days} Day${days > 1 ? 's' : ''}`,
          `₹${RATE_PER_DAY}`,
          `₹${amount}`,
          paymentMode,
          paymentId,
          dateStr,
          p.barcode || '-',
          checkedInStatus,
        ];
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws['!cols'] = colWidths;

      for (let c = 0; c < headers.length; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
            fill: { fgColor: { rgb: '1E3A8A' } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: {
              top: { style: 'thin', color: { rgb: '94A3B8' } },
              bottom: { style: 'medium', color: { rgb: '0F172A' } },
              left: { style: 'thin', color: { rgb: '94A3B8' } },
              right: { style: 'thin', color: { rgb: '94A3B8' } },
            },
          };
        }
      }

      for (let r = 1; r <= rows.length; r++) {
        for (let c = 0; c < headers.length; c++) {
          const cellRef = XLSX.utils.encode_cell({ r, c });
          if (ws[cellRef]) {
            const isCenterCol = [0, 2, 3, 4, 7, 8, 10, 13, 14, 15, 16, 17, 19, 20, 21].includes(c);
            ws[cellRef].s = {
              font: { sz: 10, color: { rgb: '0F172A' } },
              alignment: {
                horizontal: isCenterCol ? 'center' : 'left',
                vertical: 'center',
              },
              border: {
                top: { style: 'thin', color: { rgb: 'E2E8F0' } },
                bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
                left: { style: 'thin', color: { rgb: 'E2E8F0' } },
                right: { style: 'thin', color: { rgb: 'E2E8F0' } },
              },
            };
          }
        }
      }

      const sheetTitle = targetGender === 'MALE' ? 'Boys Accommodation' : targetGender === 'FEMALE' ? 'Girls Accommodation' : 'Accommodation Data';
      XLSX.utils.book_append_sheet(wb, ws, sheetTitle);
      const prefix = targetGender === 'MALE' ? 'Boys_' : targetGender === 'FEMALE' ? 'Girls_' : '';
      XLSX.writeFile(wb, `Accommodation_Data_${prefix}${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`Accommodation data (${list.length} students) downloaded successfully!`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export accommodation data');
    } finally {
      setExporting(false);
    }
  };

  // Export filtered table records
  const handleExportFilteredExcel = () => {
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
        'Mobile',
        'Email',
        'Team ID',
        'Accommodation Status',
        'Days Booked',
        'Amount Paid',
      ];

      const colWidths = [
        { wch: 6 },
        { wch: 26 },
        { wch: 18 },
        { wch: 10 },
        { wch: 30 },
        { wch: 20 },
        { wch: 16 },
        { wch: 28 },
        { wch: 16 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
      ];

      const rows = filteredParticipants.map((p, idx) => {
        const isAcc = (p.accommodation || '').toUpperCase() === 'YES';
        const days =
          p.accommodationPayment?.days ||
          p.accommodationPayment?.dayscount ||
          p.days ||
          p.dayscount ||
          (isAcc ? 1 : '-');
        const amount = p.accommodationPayment?.amount
          ? `₹${p.accommodationPayment.amount}`
          : isAcc
          ? `₹${Number(days) * RATE_PER_DAY}`
          : '-';

        return [
          idx + 1,
          p.name || '-',
          p.roll || '-',
          p.normalizedGender === 'FEMALE' ? 'Girl' : 'Male',
          p.collegeDisplay || '-',
          p.branch || '-',
          p.mobile || '-',
          p.email || '-',
          p.teamId || '-',
          isAcc ? 'YES' : 'NO',
          typeof days === 'number' ? `${days} Day(s)` : days,
          amount,
        ];
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws['!cols'] = colWidths;

      for (let c = 0; c < headers.length; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
            fill: { fgColor: { rgb: '334155' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Filtered List');
      XLSX.writeFile(wb, `Participants_Filter_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Filtered participants list exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export list');
    } finally {
      setExporting(false);
    }
  };

  // Columns definition
  const columns = [
    'S.No',
    'Participant Name & Roll',
    'Gender',
    'College Name',
    'Team ID',
    'Contact Info',
    'Accommodation Status',
    'Action',
  ];

  const tableRows = useMemo(() => {
    return filteredParticipants.map((p, index) => {
      const isAccommodated = (p.accommodation || '').toUpperCase() === 'YES';
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
                  {p.branch}
                </Typography>
              )}
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
            <Box>
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
              {(p.accommodationPayment?.days || p.days) ? (
                <Typography variant="caption" display="block" sx={{ color: '#059669', fontWeight: 700, mt: 0.25 }}>
                  {p.accommodationPayment?.days || p.days} Day(s) • ₹{p.accommodationPayment?.amount || (p.accommodationPayment?.days || p.days) * RATE_PER_DAY}
                </Typography>
              ) : null}
              {p.accommodationPayment?.razorpayPaymentId && (
                <Typography variant="caption" display="block" sx={{ color: '#64748b', fontSize: '0.68rem', fontFamily: 'monospace' }}>
                  {p.accommodationPayment.razorpayPaymentId}
                </Typography>
              )}
            </Box>
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
                onClick={() => setRevokeDialog({ open: true, participant: p })}
                sx={{ textTransform: 'none', fontSize: '0.75rem', p: 0.5, minWidth: 0 }}
              >
                Revoke
              </Button>
            </Stack>
          ) : (
            <Tooltip title={limitCheck.reached ? limitCheck.reason : 'Click to select days and pay accommodation'}>
              <span>
                <Button
                  size="small"
                  variant="contained"
                  disabled={limitCheck.reached}
                  onClick={() => handleOpenApplyDialog(p)}
                  startIcon={<HotelIcon sx={{ fontSize: 16 }} />}
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
                  {limitCheck.reached ? 'Limit Full' : 'Apply Accommodation'}
                </Button>
              </span>
            </Tooltip>
          ),
        },
      ];
    });
  }, [filteredParticipants, quotaStats]);

  const malePercent = Math.min(100, Math.round((quotaStats.male / MALE_LIMIT) * 100));
  const femalePercent = Math.min(100, Math.round((quotaStats.female / FEMALE_LIMIT) * 100));
  const totalPercent = Math.min(100, Math.round((quotaStats.total / OVERALL_LIMIT) * 100));

  const totalPayable = selectedDays * RATE_PER_DAY;

  return (
    <PageContainer sx={{ px: { xs: 1.5, md: 3 }, py: { xs: 2, md: 3 }, pt: { xs: 3, md: 4 } }}>
      {/* Header */}
      <PageHeader
        title="Apply Accommodation"
        subtitle="Manage and allocate accommodation exclusively for paid participants from other colleges"
        icon={<HotelIcon sx={{ color: '#2563eb' }} />}
        action={
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
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
              onClick={() => {
                setBulkVerifyDialogOpen(true);
                setBulkVerifyResults(null);
              }}
              startIcon={<UploadFileIcon />}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 800,
                px: 2,
                py: 0.8,
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                },
              }}
            >
              Bulk Verify Payments (Excel)
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleExportFilteredExcel}
              disabled={exporting || filteredParticipants.length === 0}
              startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#cbd5e1',
                color: '#334155',
                '&:hover': {
                  borderColor: '#94a3b8',
                  backgroundColor: '#f8fafc',
                },
              }}
            >
              Export Filtered List
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => handleExportAccommodationExcel('ALL')}
              disabled={exporting || accommodatedParticipants.length === 0}
              startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 800,
                px: 2,
                py: 0.8,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                },
              }}
            >
              {exporting ? 'Downloading...' : `Download Accommodation Data (${accommodatedParticipants.length})`}
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
            <Button
              size="small"
              variant="text"
              startIcon={<DownloadIcon sx={{ fontSize: 13 }} />}
              onClick={() => handleExportAccommodationExcel('MALE')}
              disabled={accommodatedMaleCount === 0}
              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', p: 0, mt: 0.5, color: '#1e40af' }}
            >
              Download Boys Excel ({accommodatedMaleCount})
            </Button>
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
                Female Accommodation
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
              {femalePercent}% allocated (Limit: {FEMALE_LIMIT} female)
            </Typography>
            <Button
              size="small"
              variant="text"
              startIcon={<DownloadIcon sx={{ fontSize: 13 }} />}
              onClick={() => handleExportAccommodationExcel('FEMALE')}
              disabled={accommodatedFemaleCount === 0}
              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', p: 0, mt: 0.5, color: '#9d174d' }}
            >
              Download Girls Excel ({accommodatedFemaleCount})
            </Button>
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
            <Button
              size="small"
              variant="text"
              startIcon={<DownloadIcon sx={{ fontSize: 13 }} />}
              onClick={() => handleExportAccommodationExcel('ALL')}
              disabled={accommodatedParticipants.length === 0}
              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', p: 0, mt: 0.5, color: '#065f46' }}
            >
              Download All Accommodated ({accommodatedParticipants.length})
            </Button>
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
                label="Paid Only"
                size="small"
                sx={{ fontWeight: 700, fontSize: '0.72rem', backgroundColor: '#f1f5f9' }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
              {otherCollegeParticipants.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
              Paid participants eligible for accommodation from other colleges.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filter Toolbar (Schools & Events removed - Team ID filter only) */}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <FilterAltIcon sx={{ fontSize: 20, color: '#2563eb' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Filter by Team ID
            </Typography>
            <Chip
              label={`${filteredParticipants.length} of ${otherCollegeParticipants.length} Shown`}
              size="small"
              sx={{ fontWeight: 700, backgroundColor: '#eff6ff', color: '#1d4ed8' }}
            />
            {/* Quick Filter Badges */}
            <Chip
              label={`Accommodated: ${accommodatedParticipants.length}`}
              size="small"
              color={statusFilter === 'YES' && genderFilter === 'ALL' ? 'success' : 'default'}
              variant={statusFilter === 'YES' && genderFilter === 'ALL' ? 'filled' : 'outlined'}
              onClick={() => {
                setStatusFilter(statusFilter === 'YES' && genderFilter === 'ALL' ? 'ALL' : 'YES');
                setGenderFilter('ALL');
              }}
              sx={{ fontWeight: 700, cursor: 'pointer' }}
            />
            <Chip
              label={`Boys: ${accommodatedMaleCount}`}
              size="small"
              color={statusFilter === 'YES' && genderFilter === 'MALE' ? 'primary' : 'default'}
              variant={statusFilter === 'YES' && genderFilter === 'MALE' ? 'filled' : 'outlined'}
              onClick={() => {
                setStatusFilter('YES');
                setGenderFilter(genderFilter === 'MALE' ? 'ALL' : 'MALE');
              }}
              sx={{ fontWeight: 700, cursor: 'pointer' }}
            />
            <Chip
              label={`Girls: ${accommodatedFemaleCount}`}
              size="small"
              color={statusFilter === 'YES' && genderFilter === 'FEMALE' ? 'secondary' : 'default'}
              variant={statusFilter === 'YES' && genderFilter === 'FEMALE' ? 'filled' : 'outlined'}
              onClick={() => {
                setStatusFilter('YES');
                setGenderFilter(genderFilter === 'FEMALE' ? 'ALL' : 'FEMALE');
              }}
              sx={{ fontWeight: 700, cursor: 'pointer' }}
            />
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {(teamIdFilter !== 'ALL' || genderFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
              <Button
                size="small"
                variant="text"
                color="error"
                onClick={handleResetFilters}
                startIcon={<FilterAltOffIcon sx={{ fontSize: 16 }} />}
                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}
              >
                Reset
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setBulkVerifyDialogOpen(true);
                setBulkVerifyResults(null);
              }}
              startIcon={<UploadFileIcon sx={{ fontSize: 16 }} />}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                borderColor: '#6366f1',
                color: '#4f46e5',
                backgroundColor: '#ffffff',
                '&:hover': {
                  borderColor: '#4338ca',
                  backgroundColor: '#eef2ff',
                },
              }}
            >
              Bulk Verify Payments (Excel)
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => handleExportAccommodationExcel('ALL')}
              disabled={exporting || accommodatedParticipants.length === 0}
              startIcon={exporting ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon sx={{ fontSize: 16 }} />}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '0.82rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                },
              }}
            >
              {exporting ? 'Downloading...' : `Download Accommodation Excel (${accommodatedParticipants.length})`}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleExportFilteredExcel}
              disabled={exporting || filteredParticipants.length === 0}
              startIcon={<DownloadIcon sx={{ fontSize: 15 }} />}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.78rem',
                borderColor: '#cbd5e1',
                color: '#334155',
                bgcolor: '#ffffff',
                '&:hover': {
                  borderColor: '#94a3b8',
                  backgroundColor: '#f8fafc',
                },
              }}
            >
              Export Filtered ({filteredParticipants.length})
            </Button>
          </Stack>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          {/* Team ID Dropdown Filter (Exclusive primary dropdown) */}
          <TextField
            select
            size="small"
            label="Filter Team ID"
            value={teamIdFilter}
            onChange={(e) => setTeamIdFilter(e.target.value)}
            sx={{ minWidth: 260, flex: 1.5 }}
          >
            <MenuItem value="ALL">All Teams ({teamIdOptions.length} Teams)</MenuItem>
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
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="ALL">All Genders</MenuItem>
            <MenuItem value="MALE">Male</MenuItem>
            <MenuItem value="FEMALE">Female</MenuItem>
          </TextField>

          {/* Accommodation Status Dropdown */}
          <TextField
            select
            size="small"
            label="Accommodation Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 180 }}
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

      {/* Accommodation Quick Action & Export Bar directly above table */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
          border: '1.5px solid #6ee7b7',
          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              backgroundColor: '#059669',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(5, 150, 105, 0.3)',
            }}
          >
            <HotelIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#064e3b', lineHeight: 1.2 }}>
              Accommodation Data ({accommodatedParticipants.length} Allocated)
            </Typography>
            <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600 }}>
              Boys: <strong>{accommodatedMaleCount}</strong> | Girls: <strong>{accommodatedFemaleCount}</strong> | Total Capacity: <strong>{quotaStats.total} / {OVERALL_LIMIT}</strong>
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
          <Button
            variant="contained"
            size="medium"
            onClick={() => {
              setBulkVerifyDialogOpen(true);
              setBulkVerifyResults(null);
            }}
            startIcon={<UploadFileIcon />}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '0.85rem',
              px: 2.2,
              py: 0.9,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
              },
            }}
          >
            Bulk Verify Missing Payments (Excel)
          </Button>
          <Button
            variant="contained"
            size="medium"
            onClick={() => handleExportAccommodationExcel('ALL')}
            disabled={exporting || accommodatedParticipants.length === 0}
            startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '0.85rem',
              px: 2.5,
              py: 0.9,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              },
            }}
          >
            {exporting ? 'Downloading...' : `Download Accommodation Excel (${accommodatedParticipants.length})`}
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleExportAccommodationExcel('MALE')}
            disabled={exporting || accommodatedMaleCount === 0}
            startIcon={<DownloadIcon sx={{ fontSize: 15 }} />}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
              borderColor: '#059669',
              color: '#065f46',
              backgroundColor: '#ffffff',
              '&:hover': {
                backgroundColor: '#f0fdf4',
                borderColor: '#047857',
              },
            }}
          >
            Boys Excel ({accommodatedMaleCount})
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleExportAccommodationExcel('FEMALE')}
            disabled={exporting || accommodatedFemaleCount === 0}
            startIcon={<DownloadIcon sx={{ fontSize: 15 }} />}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
              borderColor: '#059669',
              color: '#065f46',
              backgroundColor: '#ffffff',
              '&:hover': {
                backgroundColor: '#f0fdf4',
                borderColor: '#047857',
              },
            }}
          >
            Girls Excel ({accommodatedFemaleCount})
          </Button>
        </Stack>
      </Paper>

      {/* Main Participants Data Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </Box>
      ) : filteredParticipants.length === 0 ? (
        <EmptyState
          title="No Participants Found"
          description="No eligible other college paid participants match your selected filter."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={tableRows}
          nonSortableColumns={[0, 7]}
          alignments={['center', 'left', 'center', 'left', 'center', 'left', 'center', 'center']}
          defaultRowsPerPage={20}
        />
      )}

      {/* Accommodation Payment Popup Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => !processingPayment && setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '20px', p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#1e3a8a', pb: 1 }}>
          Apply Accommodation & Payment
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5 }}>
          {selectedParticipant && (
            <Box>
              {/* Participant Summary Card */}
              <Box
                sx={{
                  p: 2,
                  mb: 2.5,
                  borderRadius: '12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                  {selectedParticipant.name || 'Student Name'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', mb: 0.5 }}>
                  Roll No: <strong>{selectedParticipant.roll || '-'}</strong> | Team ID: <strong>{selectedParticipant.teamId}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569' }}>
                  College: <strong>{selectedParticipant.collegeDisplay}</strong>
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    icon={
                      selectedParticipant.normalizedGender === 'FEMALE' ? (
                        <FemaleIcon sx={{ fontSize: '14px !important', color: '#db2777 !important' }} />
                      ) : (
                        <MaleIcon sx={{ fontSize: '14px !important', color: '#2563eb !important' }} />
                      )
                    }
                    label={selectedParticipant.normalizedGender === 'FEMALE' ? 'Girl' : 'Male'}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      backgroundColor:
                        selectedParticipant.normalizedGender === 'FEMALE'
                          ? 'rgba(236, 72, 153, 0.12)'
                          : 'rgba(59, 130, 246, 0.12)',
                      color: selectedParticipant.normalizedGender === 'FEMALE' ? '#be185d' : '#1d4ed8',
                    }}
                  />
                </Box>
              </Box>

              {/* Days Selection Dropdown */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                Select Accommodation Duration:
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                label="Number of Days"
                value={selectedDays}
                onChange={(e) => setSelectedDays(Number(e.target.value))}
                sx={{ mb: 2.5 }}
              >
                <MenuItem value={1}>1 Day (₹{RATE_PER_DAY} per head)</MenuItem>
                <MenuItem value={2}>2 Days (₹{RATE_PER_DAY * 2} per head)</MenuItem>
              </TextField>

              {/* Amount Breakdown Card */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  border: '1px solid #86efac',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#166534', fontWeight: 600 }}>
                    Rate per head / day:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#166534', fontWeight: 700 }}>
                    ₹{RATE_PER_DAY}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#166534', fontWeight: 600 }}>
                    Selected Duration:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#166534', fontWeight: 700 }}>
                    {selectedDays} Day{selectedDays > 1 ? 's' : ''}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1, borderColor: '#86efac' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ color: '#14532d', fontWeight: 800 }}>
                    Total Payable Amount:
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#15803d', fontWeight: 900 }}>
                    ₹{totalPayable}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1, flexWrap: 'wrap' }}>
          <Button
            onClick={() => setPaymentDialogOpen(false)}
            variant="outlined"
            disabled={processingPayment}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>

          {/* Cash / Manual Payment Button */}
          <Button
            variant="outlined"
            color="success"
            disabled={processingPayment}
            onClick={handlePayCashManual}
            startIcon={processingPayment ? <CircularProgress size={16} color="inherit" /> : <CashIcon />}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              borderColor: '#10b981',
              color: '#059669',
              '&:hover': {
                borderColor: '#059669',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
              },
            }}
          >
            Cash / Direct Pay (₹{totalPayable})
          </Button>

          {/* Online Razorpay Payment Button */}
          <Button
            variant="contained"
            disabled={processingPayment}
            onClick={handlePayOnlineRazorpay}
            startIcon={processingPayment ? <CircularProgress size={16} color="inherit" /> : <PaymentIcon />}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 800,
              px: 2.5,
              py: 1,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
              },
            }}
          >
            {processingPayment ? 'Processing...' : `Pay Online with Razorpay (₹${totalPayable})`}
          </Button>
        </DialogActions>
      </Dialog>

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
            This will mark accommodation as unpaid and free up one quota slot.
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
              if (p) handleRevokeAccommodation(p);
            }}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            Yes, Revoke
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Verify Accommodation Payments Dialog */}
      <Dialog
        open={bulkVerifyDialogOpen}
        onClose={() => {
          if (!verifyingBulk) {
            setBulkVerifyDialogOpen(false);
          }
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
            color: '#ffffff',
            py: 2,
            px: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <UploadFileIcon sx={{ fontSize: 28, color: '#e0e7ff' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                Bulk Verify Accommodation Payments
              </Typography>
              <Typography variant="caption" sx={{ color: '#c7d2fe', fontWeight: 500 }}>
                Upload Excel file to link Razorpay payment records to accommodated participants
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => setBulkVerifyDialogOpen(false)}
            disabled={verifyingBulk}
            sx={{ color: '#e0e7ff', '&:hover': { color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)' } }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, backgroundColor: '#f8fafc' }}>
          {/* Instructions Box */}
          <Alert
            severity="info"
            sx={{
              mb: 2.5,
              borderRadius: '12px',
              border: '1px solid #bfdbfe',
              backgroundColor: '#eff6ff',
              '& .MuiAlert-message': { width: '100%' },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e3a8a', mb: 0.5 }}>
                  Excel Format Requirements:
                </Typography>
                <Typography variant="caption" sx={{ color: '#1e40af', display: 'block' }}>
                  • <strong>Column A (id)</strong>: Razorpay Payment ID (e.g. <code>pay_TalWW12AIChRKF</code>)
                </Typography>
                <Typography variant="caption" sx={{ color: '#1e40af', display: 'block' }}>
                  • <strong>Column B (email)</strong>: Participant Email (e.g. <code>student@gmail.com</code>)
                </Typography>
                <Typography variant="caption" sx={{ color: '#4338ca', fontWeight: 600, display: 'block', mt: 0.5 }}>
                  Matches participants where <strong>Accommodation is "Yes"</strong> and email matches, then verifies & stores the full payment object.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={handleDownloadSampleTemplate}
                startIcon={<DownloadIcon sx={{ fontSize: 15 }} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  borderColor: '#3b82f6',
                  color: '#1d4ed8',
                  backgroundColor: '#ffffff',
                  '&:hover': {
                    borderColor: '#1d4ed8',
                    backgroundColor: '#dbeafe',
                  },
                }}
              >
                Sample Template
              </Button>
            </Box>
          </Alert>

          {/* Upload Area */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx, .xls, .csv"
            onChange={handleExcelFileUpload}
            style={{ display: 'none' }}
          />

          <Paper
            elevation={0}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              p: 3,
              mb: 2.5,
              borderRadius: '14px',
              border: '2px dashed #818cf8',
              backgroundColor: bulkFile ? '#eef2ff' : '#ffffff',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#4f46e5',
                backgroundColor: '#eef2ff',
              },
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 44, color: '#6366f1', mb: 1 }} />
            {bulkFile ? (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#312e81' }}>
                  {bulkFile.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#4338ca', fontWeight: 600, display: 'block', mt: 0.5 }}>
                  {parsedBulkRows.length} valid rows loaded from file. Click here to change file.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155' }}>
                  Click to Browse or Drag & Drop Excel File here
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Supports .xlsx, .xls, or .csv files with <strong>id</strong> and <strong>email</strong> columns
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Verification Progress Indicator */}
          {verifyingBulk && (
            <Box sx={{ mb: 2.5, p: 2, borderRadius: '12px', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <CircularProgress size={20} color="primary" />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#3730a3' }}>
                  Verifying payments with Razorpay and updating database...
                </Typography>
              </Box>
              <LinearProgress sx={{ borderRadius: 2, height: 6 }} />
              <Typography variant="caption" sx={{ color: '#4338ca', mt: 0.5, display: 'block' }}>
                Please wait while payment IDs are verified against gateway and raw data is stored.
              </Typography>
            </Box>
          )}

          {/* Results Summary Card (After Verification) */}
          {bulkVerifyResults && (
            <Box
              sx={{
                mb: 2.5,
                p: 2,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                border: '1.5px solid #6ee7b7',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <CheckCircleIcon sx={{ color: '#059669', fontSize: 24 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#064e3b' }}>
                  Verification Completed Successfully!
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <Chip
                  label={`Total Processed: ${bulkVerifyResults.summary?.totalProcessed || 0}`}
                  size="small"
                  sx={{ fontWeight: 700, backgroundColor: '#ffffff', color: '#065f46' }}
                />
                <Chip
                  label={`Updated & Stored: ${bulkVerifyResults.summary?.updatedCount || 0}`}
                  size="small"
                  color="success"
                  sx={{ fontWeight: 800 }}
                />
                {bulkVerifyResults.summary?.notFoundCount > 0 && (
                  <Chip
                    label={`Not Found / Not Marked Yes: ${bulkVerifyResults.summary.notFoundCount}`}
                    size="small"
                    color="warning"
                    sx={{ fontWeight: 700 }}
                  />
                )}
                {bulkVerifyResults.summary?.failedGatewayCount > 0 && (
                  <Chip
                    label={`Gateway Warnings: ${bulkVerifyResults.summary.failedGatewayCount}`}
                    size="small"
                    color="error"
                    sx={{ fontWeight: 700 }}
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Pre-Verification Summary Counters */}
          {parsedBulkRows.length > 0 && !bulkVerifyResults && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, alignItems: 'center' }}>
              <Chip
                label={`Total Rows in File: ${parsedBulkRows.length}`}
                size="small"
                sx={{ fontWeight: 700, backgroundColor: '#f1f5f9', color: '#334155' }}
              />
              <Chip
                label={`Matched (Acc: YES): ${bulkRowsPreview.filter((r) => r.matched).length}`}
                size="small"
                color="success"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={`Missing Payment Info: ${bulkRowsPreview.filter((r) => r.matchStatus === 'READY_MISSING').length}`}
                size="small"
                color="warning"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={`Unmatched / Acc: NO: ${bulkRowsPreview.filter((r) => !r.matched).length}`}
                size="small"
                color="error"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            </Box>
          )}

          {/* Table Preview of Loaded Rows */}
          {parsedBulkRows.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
              }}
            >
              <TableContainer sx={{ maxHeight: 320 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 800, backgroundColor: '#f1f5f9', color: '#1e293b' } }}>
                      <TableCell width={50}>#</TableCell>
                      <TableCell>Payment ID (Excel)</TableCell>
                      <TableCell>Email (Excel)</TableCell>
                      <TableCell>Matched Participant</TableCell>
                      <TableCell>Team ID</TableCell>
                      <TableCell align="center">{bulkVerifyResults ? 'Verification Status' : 'Match Status'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bulkVerifyResults ? (
                      bulkVerifyResults.results.map((res, idx) => (
                        <TableRow key={idx} hover sx={{ backgroundColor: res.status === 'SUCCESS' ? '#f0fdf4' : '#fff' }}>
                          <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>{res.row || idx + 1}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', color: '#1e293b' }}>
                            {res.paymentId}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', color: '#334155' }}>{res.email}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
                              {res.participantName || '-'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {res.roll || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#4338ca' }}>
                            {res.teamId || '-'}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                res.status === 'SUCCESS'
                                  ? `UPDATED (₹${res.amount}, ${res.days}d)`
                                  : res.status
                              }
                              size="small"
                              color={res.status === 'SUCCESS' ? 'success' : res.status === 'NOT_ACCOMMODATED' ? 'warning' : 'error'}
                              sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                            />
                            {res.message && (
                              <Typography variant="caption" display="block" sx={{ color: '#64748b', fontSize: '0.68rem', mt: 0.25 }}>
                                {res.message}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      bulkRowsPreview.map((row, idx) => (
                        <TableRow key={idx} hover sx={{ backgroundColor: row.matched ? '#fdfefe' : '#fff5f5' }}>
                          <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>{row.rowNum || idx + 1}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', color: '#1e293b' }}>
                            {row.id}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', color: '#334155' }}>{row.email}</TableCell>
                          <TableCell>
                            {row.participant ? (
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
                                  {row.participant.name || 'Unknown'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  {row.participant.roll || 'No Roll'} • {row.participant.collegeDisplay || 'Other College'}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                No match found
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#4338ca' }}>
                            {row.participant?.teamId || '-'}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={row.matchLabel}
                              size="small"
                              color={row.matchColor}
                              sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, backgroundColor: '#f1f5f9', gap: 1 }}>
          <Button
            onClick={() => setBulkVerifyDialogOpen(false)}
            variant="outlined"
            disabled={verifyingBulk}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            {bulkVerifyResults ? 'Close' : 'Cancel'}
          </Button>

          {parsedBulkRows.length > 0 && !bulkVerifyResults && (
            <Button
              variant="contained"
              disabled={verifyingBulk || parsedBulkRows.length === 0}
              onClick={handleExecuteBulkVerify}
              startIcon={verifyingBulk ? <CircularProgress size={16} color="inherit" /> : <VerifiedIcon />}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 800,
                px: 2.5,
                background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338ca 0%, #312e81 100%)',
                },
              }}
            >
              {verifyingBulk
                ? 'Verifying Payments...'
                : `Verify & Store Payments (${parsedBulkRows.length} Rows)`}
            </Button>
          )}

          {bulkVerifyResults && (
            <Button
              variant="contained"
              onClick={() => {
                setBulkFile(null);
                setParsedBulkRows([]);
                setBulkVerifyResults(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              startIcon={<UploadFileIcon />}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              }}
            >
              Verify Another File
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ApplyAccommodation;
