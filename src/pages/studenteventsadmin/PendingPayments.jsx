import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  MenuItem,
  InputAdornment,
  Tooltip,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import {
  ReceiptLong as ReceiptIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Group as GroupIcon,
  Event as EventIcon,
  PeopleAlt as PeopleAltIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  PersonAdd as PersonAddIcon,
  HourglassEmpty as HourglassEmptyIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  FilterAlt as FilterAltIcon,
  FilterAltOff as FilterAltOffIcon,
  Payment as PaymentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx-js-style';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/data/DataTable';
import { PageContainer, EmptyState } from '../../components/common/design-system';
import API from '../../api/axios';
import { fetchEventDepartments } from '../../api/eventDepartmentApi';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const collegeOptions = [
  'Aditya University',
  'ACET',
  'ACOE',
  'Other College'
];

const yearOptions = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  'Alumni / Other'
];

const PendingPayments = () => {
  const navigate = useNavigate();
  const { activeRole, user } = useAuth();

  // Data states
  const [payments, setPayments] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [allSchools, setAllSchools] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [branchMap, setBranchMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [verifyingAll, setVerifyingAll] = useState(false);

  // Filter states
  const [filterTeamId, setFilterTeamId] = useState('');
  const [filterSchoolName, setFilterSchoolName] = useState('');
  const [filterEventName, setFilterEventName] = useState('');

  // Dialog states
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [departmentsDialogOpen, setDepartmentsDialogOpen] = useState(false);
  const [departmentsToView, setDepartmentsToView] = useState([]);

  // Participant edit/add dialog
  const [addParticipantDialogOpen, setAddParticipantDialogOpen] = useState(false);
  const [selectedPaymentForAdd, setSelectedPaymentForAdd] = useState(null);
  const [participantFormData, setParticipantFormData] = useState([]);
  const [addParticipantLoading, setAddParticipantLoading] = useState(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, schoolsRes, paymentsRes, deptsRes] = await Promise.all([
        API.get('/api/events').catch(() => ({ data: { events: [] } })),
        API.get('/api/event-schools').catch(() => ({ data: { eventSchools: [] } })),
        API.get('/api/razorpay/registrations').catch(() => ({ data: { payments: [] } })),
        fetchEventDepartments().catch(() => ({ data: { departments: [] } }))
      ]);

      const events = eventsRes.data?.events || [];
      const schools = schoolsRes.data?.eventSchools || schoolsRes.data?.schools || schoolsRes.data || [];
      const depts = deptsRes.data?.departments || [];
      let fetchedPayments = paymentsRes.data?.payments || [];

      // Filter only pending payments
      fetchedPayments = fetchedPayments.filter(p => {
        const isPaid = (p.paymentStatus || (p.verified ? 'PAID' : 'PENDING')).toUpperCase() === 'PAID';
        return !isPaid;
      });

      // Role based filtering if applicable
      if (activeRole === 'FACULTY_COORDINATOR' && user) {
        const userEvents = events.filter(e => {
          const coords = e.facultyCoordinators || (e.facultyCoordinator ? [e.facultyCoordinator] : []);
          return coords.some(c =>
            c.employeeId === user.institutionId ||
            c.employeeId === user.employeeId ||
            c.employeeId === user.employeeCode
          );
        });
        const allowedEventNames = userEvents.map(e => e.eventName);
        fetchedPayments = fetchedPayments.filter(p => allowedEventNames.includes(p.eventName || p.category));
      }

      setAllEvents(events);
      setAllSchools(Array.isArray(schools) ? schools : []);
      setAllDepartments(depts);
      setPayments(fetchedPayments);

      // Lazily resolve missing branches for Aditya students
      const missingRolls = new Set();
      fetchedPayments.forEach(pay => {
        if (Array.isArray(pay.participants)) {
          pay.participants.forEach(p => {
            if (!p.branch && p.roll && p.roll.length > 5 && (!p.college || p.college.toLowerCase().includes('aditya'))) {
              missingRolls.add(p.roll.toUpperCase());
            }
          });
        }
      });

      if (missingRolls.size > 0) {
        Array.from(missingRolls).forEach(async (roll) => {
          try {
            const res = await API.get(`/api/razorpay/registrations/branch/${roll}`);
            const data = res.data;
            let branch = null;
            const studentObj = Array.isArray(data) && data.length > 0 ? data[0] : (data?.value && Array.isArray(data.value) && data.value.length > 0 ? data.value[0] : (data && typeof data === 'object' ? data : null));
            if (studentObj) {
              branch = studentObj.branch || studentObj.branch_name || studentObj.branchName || studentObj.BRANCH;
            }
            if (branch) {
              setBranchMap(prev => ({ ...prev, [roll]: String(branch).trim() }));
            }
          } catch (err) {
            // Silently ignore
          }
        });
      }
    } catch (error) {
      console.error('Error fetching pending payments data:', error);
      toast.error('Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  }, [activeRole, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle verify gateway
  const handleVerifyGateway = async (id) => {
    try {
      const res = await API.get(`/api/razorpay/registrations/verify-gateway/${id}`);
      if (res.data.status === 'PAID') {
        toast.success(res.data.message || 'Payment verified and marked as PAID');
        fetchData();
      } else {
        toast.warning(res.data.message || 'Payment is not completed on gateway');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gateway verification failed');
    }
  };

  // Handle batch verify all pending via gateway
  const handleVerifyAllGateway = async () => {
    if (verifyingAll) return;
    setVerifyingAll(true);
    try {
      const res = await API.post('/api/razorpay/registrations/verify-all-gateway?limit=100');
      const summary = res.data?.summary;
      if (summary) {
        if (summary.verifiedToPaid > 0) {
          toast.success(`Verification complete: ${summary.verifiedToPaid} payment(s) verified and updated to PAID!`);
        } else {
          toast.info(`Checked ${summary.totalFound} pending order(s). No new captured payments found.`);
        }
        fetchData();
      } else {
        toast.info(res.data?.message || 'Gateway check completed');
      }
    } catch (err) {
      console.error('Error verifying all gateway:', err);
      toast.error(err.response?.data?.error || 'Failed to verify pending payments from gateway');
    } finally {
      setVerifyingAll(false);
    }
  };

  // Handle manual approve
  const handleManualApprove = async (id) => {
    try {
      const res = await API.put(`/api/razorpay/registrations/manual-approve/${id}`);
      if (res.data.ok) {
        toast.success(res.data.message || 'Payment manually approved');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Manual approval failed');
    }
  };

  // Handle delete
  const handleDeletePayment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pending registration? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await API.delete(`/api/razorpay/registrations/${id}`);
      if (res.data.ok) {
        toast.success(res.data.message || 'Registration deleted successfully');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete registration');
    }
  };

  // Open participant dialog
  const handleOpenAddParticipant = (payment) => {
    setSelectedPaymentForAdd(payment);
    const size = payment.teamSize || 1;
    const existing = payment.participants || [];

    const initialData = Array.from({ length: size }, (_, i) => {
      if (existing[i]) {
        return { ...existing[i] };
      }
      return {
        roll: '',
        name: '',
        college: 'Aditya University',
        gender: '',
        mobile: '',
        email: '',
        year: '',
        department: '',
        branch: '',
        location: ''
      };
    });

    setParticipantFormData(initialData);
    setAddParticipantDialogOpen(true);
  };

  const handleParticipantChange = (index, field, value) => {
    const updated = [...participantFormData];
    updated[index][field] = value;
    setParticipantFormData(updated);
  };

  const handleSaveParticipants = async () => {
    for (let i = 0; i < participantFormData.length; i++) {
      const p = participantFormData[i];
      if (!p.name || !p.roll || !p.mobile || !p.email) {
        toast.error(`Please fill required fields (Name, Roll, Mobile, Email) for Participant ${i + 1}`);
        return;
      }
    }

    setAddParticipantLoading(true);
    try {
      const res = await API.put(`/api/razorpay/registrations/${selectedPaymentForAdd._id}/participants`, {
        participants: participantFormData,
        eventName: selectedPaymentForAdd.eventName,
        category: selectedPaymentForAdd.category
      });
      if (res.data.ok) {
        toast.success(res.data.message || 'Participants updated successfully');
        setAddParticipantDialogOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update participants');
    } finally {
      setAddParticipantLoading(false);
    }
  };

  const handleOpenInvoice = (payment) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  // Distinct school options
  const schoolOptions = useMemo(() => {
    const list = new Set();
    allSchools.forEach(s => {
      const name = s.name || s.schoolName;
      if (name) list.add(name);
    });
    // Also add any school names found in registrations
    payments.forEach(p => {
      const relatedEvent = allEvents.find(e => e._id === p.eventId);
      const scName = relatedEvent?.school?.name || relatedEvent?.eventSchool?.name || p.category || p.schoolId;
      if (scName && scName !== '-') list.add(scName);
    });
    return Array.from(list).sort();
  }, [allSchools, payments, allEvents]);

  // Filtered event options based on selected school
  const eventOptions = useMemo(() => {
    let evs = allEvents;
    if (filterSchoolName) {
      evs = evs.filter(e => {
        const scName = e.school?.name || e.eventSchool?.name || e.category || '';
        return scName.toLowerCase() === filterSchoolName.toLowerCase();
      });
    }
    const names = new Set(evs.map(e => e.eventName).filter(Boolean));
    payments.forEach(p => {
      if (!filterSchoolName || (p.category && p.category.toLowerCase() === filterSchoolName.toLowerCase())) {
        if (p.eventName) names.add(p.eventName);
      }
    });
    return Array.from(names).sort();
  }, [allEvents, filterSchoolName, payments]);

  // Apply filters to payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      // Team ID Filter
      if (filterTeamId.trim()) {
        const q = filterTeamId.trim().toLowerCase();
        const tid = (p.teamId || '').toLowerCase();
        const pid = (p.razorpayPaymentId || '').toLowerCase();
        const oid = (p.razorpayOrderId || '').toLowerCase();
        if (!tid.includes(q) && !pid.includes(q) && !oid.includes(q)) {
          return false;
        }
      }

      // School Name Filter
      if (filterSchoolName) {
        const relatedEvent = allEvents.find(e => e._id === p.eventId);
        const schoolName = (relatedEvent?.school?.name || relatedEvent?.eventSchool?.name || p.category || p.schoolId || '').toLowerCase();
        if (schoolName !== filterSchoolName.toLowerCase()) {
          return false;
        }
      }

      // Event Name Filter
      if (filterEventName) {
        const evName = (p.eventName || '').toLowerCase();
        if (evName !== filterEventName.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [payments, filterTeamId, filterSchoolName, filterEventName, allEvents]);

  const handleResetFilters = () => {
    setFilterTeamId('');
    setFilterSchoolName('');
    setFilterEventName('');
  };

  // Lookup map for department names and alternative names / branch codes
  const deptLookupMap = useMemo(() => {
    const map = {};
    allDepartments.forEach(d => {
      if (d && d.name) {
        const canonical = d.name.trim();
        map[canonical.toUpperCase()] = canonical;
        if (d.alternativeNames) {
          d.alternativeNames.split(',').forEach(alt => {
            const cleanAlt = alt.trim().toUpperCase();
            if (cleanAlt) {
              map[cleanAlt] = canonical;
            }
          });
        }
      }
    });
    return map;
  }, [allDepartments]);

  const resolveStudentDepartment = useCallback((p) => {
    if (!p) return '';
    const rawDept = String(p.department || '').trim();
    if (rawDept && deptLookupMap[rawDept.toUpperCase()]) {
      return deptLookupMap[rawDept.toUpperCase()];
    }
    if (rawDept) return rawDept;

    const rawBranch = String(p.branch || branchMap[p.roll?.toUpperCase()] || '').trim();
    if (rawBranch && deptLookupMap[rawBranch.toUpperCase()]) {
      return deptLookupMap[rawBranch.toUpperCase()];
    }
    return rawBranch || '';
  }, [deptLookupMap, branchMap]);

  // Total participants count across filtered payments
  const totalFilteredParticipantsCount = useMemo(() => {
    return filteredPayments.reduce((acc, p) => {
      const pCount = Array.isArray(p.participants) && p.participants.length > 0
        ? p.participants.length
        : (p.teamSize || 1);
      return acc + pCount;
    }, 0);
  }, [filteredPayments]);

  // Excel Export Handler with individual participant rows
  const handleExportExcel = () => {
    if (filteredPayments.length === 0) {
      toast.error('No pending payments data to export.');
      return;
    }

    setExporting(true);
    try {
      const headers = [
        'S.No',
        'Team ID',
        'Participant Name',
        'Roll Number',
        'Member Role',
        'School Name',
        'Event Name',
        'Event Department(s)',
        'Amount (INR)',
        'Payment Status',
        'Team Size',
        'College',
        'Branch',
        'Student Department',
        'Year',
        'Gender',
        'Mobile',
        'Email',
        'Razorpay Order ID',
        'Registration Date'
      ];

      const colWidths = [
        { wch: 6 },  // S.No
        { wch: 18 }, // Team ID
        { wch: 26 }, // Participant Name
        { wch: 16 }, // Roll Number
        { wch: 15 }, // Member Role
        { wch: 22 }, // School Name
        { wch: 28 }, // Event Name
        { wch: 26 }, // Event Department(s)
        { wch: 14 }, // Amount (INR)
        { wch: 16 }, // Payment Status
        { wch: 12 }, // Team Size
        { wch: 26 }, // College
        { wch: 18 }, // Branch
        { wch: 22 }, // Student Department
        { wch: 12 }, // Year
        { wch: 12 }, // Gender
        { wch: 16 }, // Mobile
        { wch: 28 }, // Email
        { wch: 24 }, // Razorpay Order ID
        { wch: 22 }  // Registration Date
      ];

      const applySheetStyles = (ws, headerColsCount) => {
        ws['!cols'] = colWidths;
        for (let c = 0; c < headerColsCount; c++) {
          const cellRef = XLSX.utils.encode_cell({ r: 0, c });
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
              fill: { fgColor: { rgb: '1E3A8A' } },
              alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
              border: {
                top: { style: 'thin', color: { rgb: 'CBD5E1' } },
                bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
                left: { style: 'thin', color: { rgb: 'CBD5E1' } },
                right: { style: 'thin', color: { rgb: 'CBD5E1' } }
              }
            };
          }
        }
      };

      // Flatten filtered payments with participant details
      const participantRows = [];
      let sNo = 1;

      filteredPayments.forEach((payment) => {
        const amountValue = payment.amountRupees ?? payment.amount;
        const relatedEvent = allEvents.find(e => e._id === payment.eventId);
        const schoolCategory = relatedEvent?.school?.name || relatedEvent?.eventSchool?.name || payment.category || payment.schoolId || '-';
        let eventDepartmentStr = '-';
        if (relatedEvent && relatedEvent.department && relatedEvent.department.length > 0) {
          eventDepartmentStr = relatedEvent.department.map(d => d.name).join(', ');
        }
        const rawDate = payment.createdAt || payment.paidAt;
        const formattedDate = formatDate(rawDate);
        const teamId = payment.teamId || 'PENDING';
        const orderId = payment.razorpayOrderId || '-';
        const eventName = payment.eventName || relatedEvent?.eventName || '-';
        const paymentStatus = payment.paymentStatus || (payment.verified ? 'PAID' : 'PENDING');
        const teamSize = payment.teamSize || (payment.participants?.length || 1);

        const parts = Array.isArray(payment.participants) && payment.participants.length > 0
          ? payment.participants
          : null;

        if (parts && parts.length > 0) {
          parts.forEach((p, idx) => {
            const collegeName = p.college === 'Other College' && p.otherCollege ? p.otherCollege : (p.college || '-');
            const studentDept = resolveStudentDepartment(p);
            const computedBranch = p.branch || branchMap[p.roll?.toUpperCase()] || '-';
            const memberRole = teamSize > 1 ? (idx === 0 ? 'Team Lead' : `Member ${idx + 1}`) : 'Solo / Lead';

            participantRows.push({
              row: [
                sNo++,
                teamId,
                p.name || '-',
                p.roll || '-',
                memberRole,
                schoolCategory,
                eventName,
                eventDepartmentStr,
                amountValue != null ? Number(amountValue) : 0,
                paymentStatus,
                teamSize,
                collegeName,
                computedBranch,
                studentDept || '-',
                p.year || '-',
                p.gender || '-',
                p.mobile || '-',
                p.email || '-',
                orderId,
                formattedDate
              ],
              deptKey: studentDept || 'Other Dept'
            });
          });
        } else {
          // Payment without participant details entered yet
          participantRows.push({
            row: [
              sNo++,
              teamId,
              '-',
              '-',
              '-',
              schoolCategory,
              eventName,
              eventDepartmentStr,
              amountValue != null ? Number(amountValue) : 0,
              paymentStatus,
              teamSize,
              '-',
              '-',
              '-',
              '-',
              '-',
              '-',
              '-',
              orderId,
              formattedDate
            ],
            deptKey: 'Other Dept'
          });
        }
      });

      const workbook = XLSX.utils.book_new();

      // Master sheet: "All Pending Registrations"
      const allRows = [headers, ...participantRows.map(item => item.row)];
      const allWs = XLSX.utils.aoa_to_sheet(allRows);
      applySheetStyles(allWs, headers.length);
      XLSX.utils.book_append_sheet(workbook, allWs, 'All Pending Registrations');

      // Department-wise individual sheets if multiple departments
      const deptMap = {};
      participantRows.forEach((item) => {
        const dKey = item.deptKey || 'Other Dept';
        if (!deptMap[dKey]) deptMap[dKey] = [];
        deptMap[dKey].push(item.row);
      });

      const sortedDeptKeys = Object.keys(deptMap).sort((a, b) => a.localeCompare(b));
      if (sortedDeptKeys.length > 1) {
        const usedSheetNames = new Set(['all pending registrations']);
        sortedDeptKeys.forEach((deptKey) => {
          const deptRows = [headers, ...deptMap[deptKey]];
          const deptWs = XLSX.utils.aoa_to_sheet(deptRows);
          applySheetStyles(deptWs, headers.length);

          let cleanName = deptKey.replace(/[\\/?*:[\]]/g, '').trim().substring(0, 31) || 'Dept';
          let uniqueName = cleanName;
          let counter = 1;
          while (usedSheetNames.has(uniqueName.toLowerCase())) {
            uniqueName = `${cleanName.substring(0, 27)}_${counter}`;
            counter++;
          }
          usedSheetNames.add(uniqueName.toLowerCase());
          XLSX.utils.book_append_sheet(workbook, deptWs, uniqueName);
        });
      }

      // Generate context-rich filename based on active filters
      let filterSuffix = '';
      if (filterEventName) {
        filterSuffix = `_${filterEventName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      } else if (filterSchoolName) {
        filterSuffix = `_${filterSchoolName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `VEDA_Pending_Payments${filterSuffix}_${dateStr}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success(`Exported ${participantRows.length} participant row(s) across ${filteredPayments.length} pending registration(s) to Excel!`);
    } catch (err) {
      console.error('Error exporting pending payments to Excel:', err);
      toast.error('Failed to export Excel file.');
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    'S.No',
    'Team ID',
    'Date & Time',
    'School Name',
    'Event Name',
    'Department(s)',
    'Amount',
    'Status',
    'Team Size',
    'Actions'
  ];

  const rows = filteredPayments.map((payment, index) => {
    const amountValue = payment.amountRupees ?? payment.amount;
    const relatedEvent = allEvents.find(e => e._id === payment.eventId);
    const schoolCategory = relatedEvent?.school?.name || relatedEvent?.eventSchool?.name || payment.category || payment.schoolId || '-';

    let departmentNode = '-';
    if (relatedEvent && relatedEvent.department && relatedEvent.department.length > 0) {
      if (relatedEvent.department.length > 1) {
        departmentNode = {
          value: 'All Departments',
          display: (
            <span
              style={{ color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}
              onClick={() => {
                setDepartmentsToView(relatedEvent.department);
                setDepartmentsDialogOpen(true);
              }}
            >
              All Departments
            </span>
          )
        };
      } else {
        departmentNode = relatedEvent.department[0].name;
      }
    }

    const rawDate = payment.createdAt || payment.paidAt;
    const dateObj = rawDate ? new Date(rawDate) : null;
    const isValidDate = dateObj && !isNaN(dateObj.getTime());
    const isoDate = isValidDate ? dateObj.toISOString() : '';
    const formattedDate = isValidDate ? formatDate(rawDate) : '-';

    return [
      index + 1,
      {
        value: payment.teamId || 'Pending',
        display: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: payment.teamId ? 'primary.main' : 'text.secondary' }}>
              {payment.teamId || 'Pending'}
            </Typography>
            <Tooltip title="View / Edit Participants">
              <IconButton size="small" onClick={() => handleOpenAddParticipant(payment)} color="primary">
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )
      },
      {
        value: isoDate ? `${isoDate} ${formattedDate}` : '-',
        display: (
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'nowrap',
              fontSize: '0.8rem',
              color: 'text.secondary',
              fontWeight: 600,
            }}
          >
            {formattedDate}
          </Typography>
        ),
      },
      schoolCategory,
      payment.eventName || '-',
      departmentNode,
      amountValue != null ? `₹ ${Number(amountValue).toLocaleString('en-IN')}` : '-',
      {
        value: 'PENDING',
        display: (
          <Chip
            icon={<HourglassEmptyIcon sx={{ fontSize: 14 }} />}
            label="PENDING"
            color="warning"
            size="small"
            sx={{ fontWeight: 700, borderRadius: '8px', px: 0.5 }}
          />
        ),
      },
      {
        value: payment.teamSize || 1,
        display: (
          <Chip
            icon={<GroupIcon sx={{ fontSize: 14 }} />}
            label={`${payment.teamSize || 1} Participant${(payment.teamSize || 1) > 1 ? 's' : ''}`}
            variant="outlined"
            size="small"
            onClick={() => handleOpenInvoice(payment)}
            sx={{ cursor: 'pointer', fontWeight: 600 }}
          />
        ),
      },
      {
        value: 'Actions',
        display: (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: '140px' }}>
            <Button
              variant="contained"
              size="small"
              color="info"
              onClick={() => handleVerifyGateway(payment._id)}
              startIcon={<RefreshIcon sx={{ fontSize: 14 }} />}
              sx={{ borderRadius: '16px', textTransform: 'none', fontSize: '11px', px: 1.5, py: 0.4 }}
            >
              Verify Gateway
            </Button>
            <Button
              variant="contained"
              size="small"
              color="success"
              onClick={() => handleManualApprove(payment._id)}
              startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
              sx={{ borderRadius: '16px', textTransform: 'none', fontSize: '11px', px: 1.5, py: 0.4 }}
            >
              Manual Approve
            </Button>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleOpenInvoice(payment)}
                startIcon={<ViewIcon sx={{ fontSize: 14 }} />}
                sx={{ borderRadius: '16px', textTransform: 'none', fontSize: '11px', px: 1, py: 0.3, flex: 1 }}
              >
                Details
              </Button>
              {['STUDENT EVENT ADMIN', 'STUDENT_EVENT_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(activeRole) && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeletePayment(payment._id)}
                  sx={{ border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', p: 0.4 }}
                  title="Delete Registration"
                >
                  <DeleteIcon sx={{ fontSize: 15 }} />
                </IconButton>
              )}
            </Box>
          </Box>
        )
      }
    ];
  });

  const totalPendingAmount = useMemo(() => {
    return filteredPayments.reduce((acc, p) => acc + (Number(p.amountRupees ?? p.amount) || 0), 0);
  }, [filteredPayments]);

  return (
    <PageContainer sx={{ px: { xs: 1, md: 2 }, py: { xs: 1, md: 2 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: '18px',
          border: '1px solid #dfe7f2',
          background: 'linear-gradient(180deg, #f8fafc 0%, #f2f6fb 100%)',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <FilterAltIcon sx={{ fontSize: 20, color: '#3b4d8b' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '0.01em' }}>
              Filter Pending Registrations
            </Typography>
            <Chip
              label={`${filteredPayments.length} of ${payments.length} Pending`}
              size="small"
              sx={{
                fontWeight: 800,
                color: '#b45309',
                background: 'rgba(251, 146, 60, 0.14)',
                border: '1px solid rgba(251, 146, 60, 0.25)',
              }}
            />
            <Chip
              icon={<PeopleAltIcon sx={{ fontSize: '14px !important', color: '#0369a1 !important' }} />}
              label={`${totalFilteredParticipantsCount} Participant${totalFilteredParticipantsCount !== 1 ? 's' : ''}`}
              size="small"
              sx={{
                fontWeight: 800,
                color: '#0369a1',
                background: 'rgba(14, 165, 233, 0.12)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
              }}
            />
            {/* {totalPendingAmount > 0 && (
              <Chip
                label={`Total: ₹ ${totalPendingAmount.toLocaleString('en-IN')}`}
                size="small"
                sx={{
                  fontWeight: 800,
                  color: '#475569',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                }}
              />
            )} */}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {(filterTeamId || filterSchoolName || filterEventName) && (
              <Button
                size="small"
                variant="text"
                color="error"
                onClick={handleResetFilters}
                startIcon={<FilterAltOffIcon sx={{ fontSize: 16 }} />}
                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem' }}
              >
                Clear Filters
              </Button>
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={handleVerifyAllGateway}
              disabled={verifyingAll || payments.length === 0}
              startIcon={verifyingAll ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                px: 2,
                py: 0.75,
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                },
                '&.Mui-disabled': {
                  background: '#e2e8f0',
                  color: '#94a3b8'
                }
              }}
            >
              {verifyingAll ? 'Verifying Gateway...' : 'Verify All via Gateway'}
            </Button>

            <Button
              variant="contained"
              color="success"
              onClick={handleExportExcel}
              disabled={exporting || filteredPayments.length === 0}
              startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                px: 2,
                py: 0.75,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                },
                '&.Mui-disabled': {
                  background: '#e2e8f0',
                  color: '#94a3b8'
                }
              }}
            >
              {exporting ? 'Exporting...' : 'Download Excel'}
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Filter by Team ID / Order ID"
              placeholder="e.g. VD26-XXXX or order_xxx"
              value={filterTeamId}
              onChange={(e) => setFilterTeamId(e.target.value)}
              sx={{ width: '100%' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: '12px', background: '#fff', height: '42px' }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              select
              size="small"
              label="Filter by School Name"
              value={filterSchoolName}
              onChange={(e) => {
                setFilterSchoolName(e.target.value);
                setFilterEventName('');
              }}
              sx={{ width: '100%' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SchoolIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: '12px', background: '#fff', height: '42px' }
              }}
            >
              <MenuItem value=""><em>All Schools</em></MenuItem>
              {schoolOptions.map((school) => (
                <MenuItem key={school} value={school}>{school}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              select
              size="small"
              label="Filter by Event Name"
              value={filterEventName}
              onChange={(e) => setFilterEventName(e.target.value)}
              sx={{ width: '100%' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EventIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: '12px', background: '#fff', height: '42px' }
              }}
            >
              <MenuItem value=""><em>All Events</em></MenuItem>
              {eventOptions.map((eventName) => (
                <MenuItem key={eventName} value={eventName}>{eventName}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          <CircularProgress size={32} />
        </Box>
      ) : payments.length === 0 ? (
        <EmptyState
          title="No Pending Registrations"
          description="All registrations have been verified and marked as Paid."
          action={
            <Button
              variant="contained"
              onClick={() => navigate('/Eventveda/payments')}
              startIcon={<PaymentIcon />}
              sx={{ borderRadius: '12px', textTransform: 'none', px: 2.5 }}
            >
              View Payments List
            </Button>
          }
        />
      ) : (
        <Box sx={{ mt: 0.5 }}>
          <DataTable
            columns={columns}
            rows={rows}
            defaultRowsPerPage={10}
          />
        </Box>
      )}

      {/* DETAILS / INVOICE DIALOG */}
      {selectedPayment && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            },
          }}
        >
          <DialogTitle
            sx={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              py: 2.5,
              px: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HourglassEmptyIcon sx={{ color: '#fff' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: '#fff' }}>
                  ADITYA UNIVERSITY
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', letterSpacing: '0.5px' }}>
                  PENDING REGISTRATION DETAILS
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={<HourglassEmptyIcon sx={{ color: '#fff !important', fontSize: 14 }} />}
                label={selectedPayment.paymentStatus || 'PENDING'}
                sx={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: '8px',
                }}
              />
              <IconButton
                onClick={handlePrintInvoice}
                sx={{ color: '#fff', '&:hover': { background: 'rgba(255,255,255,0.1)' } }}
                title="Print Details"
              >
                <PrintIcon />
              </IconButton>
              <IconButton
                onClick={() => setDialogOpen(false)}
                sx={{ color: '#fff', '&:hover': { background: 'rgba(255,255,255,0.1)' } }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent dividers sx={{ p: { xs: 2.5, sm: 4 }, background: '#ffffff' }}>
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', background: '#f8fafc' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.68rem' }}>
                    Team ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace', wordBreak: 'break-all', mt: 0.5, color: '#d97706' }}>
                    {selectedPayment.teamId || 'PENDING'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', background: '#f8fafc' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.68rem' }}>
                    Razorpay Order ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace', wordBreak: 'break-all', mt: 0.5 }}>
                    {selectedPayment.razorpayOrderId || '-'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', background: '#f8fafc' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.68rem' }}>
                    Payment ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace', wordBreak: 'break-all', mt: 0.5 }}>
                    {selectedPayment.razorpayPaymentId || '-'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', background: '#f8fafc' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.68rem' }}>
                    Initiated At
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {formatDate(selectedPayment.createdAt)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Event Summary Card */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%)',
                borderColor: 'rgba(245, 158, 11, 0.2)',
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 7 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <EventIcon color="warning" fontSize="small" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {selectedPayment.eventName || selectedPayment.category || 'Event Registration'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    School / Category: <strong>{selectedPayment.category || selectedPayment.schoolId || 'General'}</strong>
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                    Expected Amount
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#d97706' }}>
                    ₹ {Number(selectedPayment.amountRupees ?? selectedPayment.amount ?? 0).toLocaleString('en-IN')}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Participants Table */}
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleAltIcon fontSize="small" color="primary" />
              Registered Participants ({selectedPayment.participants?.length || 0})
            </Typography>

            <Paper variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Roll Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Mobile</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>College</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Year & Branch</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPayment.participants && selectedPayment.participants.length > 0 ? (
                    selectedPayment.participants.map((p, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{p.name || '-'}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{p.roll || '-'}</TableCell>
                        <TableCell>{p.mobile || '-'}</TableCell>
                        <TableCell>{p.email || '-'}</TableCell>
                        <TableCell>{p.college || '-'}</TableCell>
                        <TableCell>{[p.year, p.branch].filter(Boolean).join(' - ') || '-'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No participant details recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="info"
                onClick={() => {
                  setDialogOpen(false);
                  handleVerifyGateway(selectedPayment._id);
                }}
                startIcon={<RefreshIcon />}
                sx={{ borderRadius: '10px', textTransform: 'none' }}
              >
                Verify Gateway
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  setDialogOpen(false);
                  handleManualApprove(selectedPayment._id);
                }}
                startIcon={<CheckCircleIcon />}
                sx={{ borderRadius: '10px', textTransform: 'none' }}
              >
                Manual Approve
              </Button>
            </Box>
            <Button
              variant="outlined"
              onClick={() => setDialogOpen(false)}
              sx={{ borderRadius: '10px', textTransform: 'none' }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* EDIT / ADD PARTICIPANTS DIALOG */}
      {selectedPaymentForAdd && (
        <Dialog
          open={addParticipantDialogOpen}
          onClose={() => setAddParticipantDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: '16px' } }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Manage Participant Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Event: {selectedPaymentForAdd.eventName || selectedPaymentForAdd.category} (Team Size: {selectedPaymentForAdd.teamSize || 1})
              </Typography>
            </Box>
            <IconButton onClick={() => setAddParticipantDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ maxHeight: '70vh', p: 3 }}>
            <Stack spacing={3}>
              {participantFormData.map((p, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2.5, borderRadius: '12px', bgcolor: '#fafafa' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                    Participant {index + 1} {index === 0 && '(Team Lead)'}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Full Name *"
                        value={p.name}
                        onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Roll Number *"
                        value={p.roll}
                        onChange={(e) => handleParticipantChange(index, 'roll', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Mobile Number *"
                        value={p.mobile}
                        onChange={(e) => handleParticipantChange(index, 'mobile', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Email Address *"
                        type="email"
                        value={p.email}
                        onChange={(e) => handleParticipantChange(index, 'email', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        select
                        size="small"
                        label="College"
                        value={p.college || 'Aditya University'}
                        onChange={(e) => handleParticipantChange(index, 'college', e.target.value)}
                      >
                        {collegeOptions.map((c) => (
                          <MenuItem key={c} value={c}>
                            {c}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        select
                        size="small"
                        label="Year"
                        value={p.year || ''}
                        onChange={(e) => handleParticipantChange(index, 'year', e.target.value)}
                      >
                        <MenuItem value="">Select Year</MenuItem>
                        {yearOptions.map((y) => (
                          <MenuItem key={y} value={y}>
                            {y}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Branch"
                        value={p.branch || ''}
                        onChange={(e) => handleParticipantChange(index, 'branch', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        select
                        size="small"
                        label="Gender"
                        value={p.gender || ''}
                        onChange={(e) => handleParticipantChange(index, 'gender', e.target.value)}
                      >
                        <MenuItem value="">Select Gender</MenuItem>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2, px: 3 }}>
            <Button onClick={() => setAddParticipantDialogOpen(false)} disabled={addParticipantLoading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveParticipants}
              disabled={addParticipantLoading}
              sx={{ borderRadius: '8px', px: 3 }}
            >
              {addParticipantLoading ? <CircularProgress size={20} /> : 'Save Participants'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* DEPARTMENTS DIALOG */}
      <Dialog
        open={departmentsDialogOpen}
        onClose={() => setDepartmentsDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Eligible Departments
          </Typography>
          <IconButton onClick={() => setDepartmentsDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            {departmentsToView.map((dept, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#f8fafc' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {dept.name || dept}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepartmentsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default PendingPayments;
