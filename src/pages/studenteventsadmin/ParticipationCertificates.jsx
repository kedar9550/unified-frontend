import React, { useState, useEffect, useCallback } from 'react';
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
  Switch,
  FormControlLabel,
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
  EmojiEvents as EmojiEventsIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { PageContainer, EmptyState } from '../../components/common/design-system';
import ActionButton from '../../components/common/ActionButton';
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import StatCardGrid from '../../components/common/StatCardGrid';
import { QRCodeSVG } from 'qrcode.react';
import adityaLogo from '../../assets/logo.png';
import cornerFlourishTL from '../../assets/reference_corner_flourish_tl.png';
import cornerFlourishTR from '../../assets/reference_corner_flourish_tr.png';
import cornerFlourishBL from '../../assets/reference_corner_flourish_bl.png';
import cornerFlourishBR from '../../assets/reference_corner_flourish_br.png';

// Ornate Victorian Corner Flourish (Matching Reference Certificate Design)
const CertificateCornerFlourish = ({ position = 'top-left' }) => {
  let style = {
    position: 'absolute',
    width: '11cqh',
    height: '11cqh',
    pointerEvents: 'none',
    zIndex: 4,
    objectFit: 'contain',
    display: 'block',
  };

  if (position === 'top-right') {
    style.top = '2.5cqh';
    style.right = '2.5cqh';
    style.transform = 'scale(-1, -1)';
  } else if (position === 'bottom-left') {
    style.bottom = '2.5cqh';
    style.left = '2.5cqh';
  } else if (position === 'bottom-right') {
    style.bottom = '2.5cqh';
    style.right = '2.5cqh';
    style.transform = 'scaleX(-1)';
  } else {
    style.top = '2.5cqh';
    style.left = '2.5cqh';
    style.transform = 'scaleY(-1)';
  }

  return (
    <Box
      component="img"
      src="/corner_design.png"
      alt="Certificate corner flourish"
      sx={style}
    />
  );
};

// 5 Accreditation Badges: NIRF, NAAC A++, NBA TIER 1, THE, QS I-GAUGE
const AccreditationBadges = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.8cqh' }}>
    {/* NIRF */}
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: '0.4cqh',
      border: '0.12cqh solid #94a3b8', borderRadius: '0.3cqh', px: '0.6cqh', py: '0.2cqh', background: '#fff'
    }}>
      <Typography sx={{ fontWeight: 900, fontSize: '1.1cqh', color: '#154487', letterSpacing: '-0.3px', lineHeight: 1 }}>nirf</Typography>
      <Box sx={{ borderLeft: '0.1cqh solid #cbd5e1', pl: '0.4cqh' }}>
        <Typography sx={{ fontSize: '0.6cqh', fontWeight: 700, color: '#475569', lineHeight: 1 }}>Rank Band</Typography>
        <Typography sx={{ fontSize: '0.68cqh', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>101-200</Typography>
      </Box>
    </Box>

    {/* NAAC A++ */}
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      border: '0.12cqh solid #f59e0b', borderRadius: '0.3cqh', px: '0.6cqh', py: '0.2cqh', background: '#fffbeb'
    }}>
      <Typography sx={{ fontSize: '0.55cqh', fontWeight: 700, color: '#b45309', letterSpacing: '0.3px', lineHeight: 1 }}>ACCREDITED BY</Typography>
      <Typography sx={{ fontSize: '0.95cqh', fontWeight: 900, color: '#154487', lineHeight: 1, mt: '0.1cqh' }}>
        NAAC <span style={{ color: '#d97706' }}>A++</span> <span style={{ fontSize: '0.6cqh' }}>GRADE</span>
      </Typography>
    </Box>

    {/* NBA TIER 1 */}
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: '0.4cqh',
      border: '0.12cqh solid #0284c7', borderRadius: '0.3cqh', px: '0.6cqh', py: '0.2cqh', background: '#f0f9ff'
    }}>
      <Typography sx={{ fontWeight: 900, fontSize: '1.1cqh', color: '#0369a1', lineHeight: 1 }}>NBA</Typography>
      <Box sx={{ bgcolor: '#0284c7', color: '#fff', px: '0.4cqh', py: '0.15cqh', borderRadius: '0.2cqh' }}>
        <Typography sx={{ fontSize: '0.68cqh', fontWeight: 800, lineHeight: 1 }}>TIER 1</Typography>
        <Typography sx={{ fontSize: '0.55cqh', fontWeight: 600, lineHeight: 1 }}>ACCREDITED</Typography>
      </Box>
    </Box>

    {/* THE */}
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: '0.4cqh',
      border: '0.12cqh solid #e2e8f0', borderRadius: '0.3cqh', px: '0.6cqh', py: '0.2cqh', background: '#fff'
    }}>
      <Box sx={{ bgcolor: '#e11d48', color: '#fff', px: '0.3cqh', py: '0.1cqh', fontWeight: 900, fontSize: '0.85cqh', lineHeight: 1, borderRadius: '0.15cqh' }}>
        THE
      </Box>
      <Box>
        <Typography sx={{ fontSize: '0.55cqh', fontWeight: 700, color: '#334155', lineHeight: 1 }}>TIMES HIGHER</Typography>
        <Typography sx={{ fontSize: '0.55cqh', fontWeight: 700, color: '#334155', lineHeight: 1 }}>EDUCATION</Typography>
        <Typography sx={{ fontSize: '0.5cqh', fontWeight: 600, color: '#64748b', lineHeight: 1 }}>IMPACT RANKINGS</Typography>
      </Box>
    </Box>

    {/* QS I-GAUGE */}
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: '0.4cqh',
      border: '0.12cqh solid #1e3a8a', borderRadius: '0.3cqh', px: '0.6cqh', py: '0.2cqh', background: '#1e3a8a'
    }}>
      <Typography sx={{ fontSize: '0.85cqh', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>QS</Typography>
      <Box sx={{ borderLeft: '0.1cqh solid rgba(255,255,255,0.3)', pl: '0.3cqh' }}>
        <Typography sx={{ fontSize: '0.6cqh', fontWeight: 800, color: '#fff', lineHeight: 1 }}>I-GAUGE</Typography>
        <Typography sx={{ fontSize: '0.55cqh', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.5px', lineHeight: 1 }}>DIAMOND</Typography>
      </Box>
    </Box>
  </Box>
);

// VEDA Student Symposium Logo
const VedaSymposiumLogo = () => (
  <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-end', position: 'relative', lineHeight: 0.9 }}>
      <Typography
        sx={{
          fontFamily: '"Montserrat", "Arial Black", sans-serif',
          fontWeight: 900,
          fontSize: '4.8cqh',
          color: '#133b70',
          letterSpacing: '1.5px',
          lineHeight: 0.9,
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <span>V</span>
        <span>E</span>
        <span>D</span>
        <span style={{ position: 'relative', display: 'inline-block' }}>
          {/* Stylized Leaping Figures above 'A' */}
          <svg
            viewBox="0 0 50 40"
            width="3.2cqh"
            height="2.6cqh"
            style={{
              position: 'absolute',
              top: '-2.1cqh',
              left: '50%',
              transform: 'translateX(-50%)',
              overflow: 'visible',
            }}
          >
            {/* Orange figure */}
            <circle cx="18" cy="8" r="4.5" fill="#ea580c" />
            <path d="M12,28 C14,18 22,16 26,14 C20,18 18,24 16,30 Z" fill="#ea580c" />
            <path d="M10,16 C14,12 19,15 24,12" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Cyan figure */}
            <circle cx="34" cy="6" r="4" fill="#06b6d4" />
            <path d="M28,26 C30,17 38,15 42,13 C36,17 34,23 32,28 Z" fill="#06b6d4" />
            <path d="M25,14 C30,10 36,13 42,10" stroke="#06b6d4" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </svg>
          A
        </span>
      </Typography>
    </Box>

    {/* Ribbon Banner */}
    <Box
      sx={{
        background: 'linear-gradient(90deg, #ea580c, #f97316)',
        color: '#ffffff',
        px: '1.4cqh',
        py: '0.28cqh',
        mt: '0.35cqh',
        borderRadius: '0.2cqh',
        boxShadow: '0 2px 4px rgba(234, 88, 12, 0.25)',
        position: 'relative',
        clipPath: 'polygon(0 0, 100% 0, 96% 100%, 4% 100%)',
      }}
    >
      <Typography
        sx={{
          fontFamily: '"Montserrat", sans-serif',
          fontWeight: 700,
          fontSize: '1.15cqh',
          letterSpacing: '0.8px',
          color: '#ffffff',
          textTransform: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Student Symposium
      </Typography>
    </Box>
  </Box>
);

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const CAMPUS_PHOTO_BASES = [
  'https://info.aec.edu.in/aus/employeephotos',
  'https://info.aec.edu.in/aec/employeephotos',
  'https://info.aec.edu.in/acet/employeephotos',
  'https://info.aec.edu.in/acoe/employeephotos',
];

function CoordinatorPhoto({ employeeCode, fallbackSrc, sx }) {
  const [imgSrc, setImgSrc] = useState(
    employeeCode ? `${CAMPUS_PHOTO_BASES[0]}/${employeeCode}.jpg` : fallbackSrc
  );
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    setImgSrc(employeeCode ? `${CAMPUS_PHOTO_BASES[0]}/${employeeCode}.jpg` : fallbackSrc);
    setErrorCount(0);
  }, [employeeCode, fallbackSrc]);

  const handleError = () => {
    const nextIndex = errorCount + 1;
    if (nextIndex < CAMPUS_PHOTO_BASES.length) {
      setImgSrc(`${CAMPUS_PHOTO_BASES[nextIndex]}/${employeeCode}.jpg`);
      setErrorCount(nextIndex);
    } else {
      setImgSrc(fallbackSrc);
    }
  };

  // Route through proxy to avoid CORS when generating PDF via html2canvas
  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9025';
  const proxySrc = imgSrc.startsWith('http') ? `${API_URL}/api/proxy/image?url=${encodeURIComponent(imgSrc)}` : imgSrc;

  return <Box component="img" src={proxySrc} crossOrigin="anonymous" onError={handleError} sx={sx} />;
}

const ParticipationCertificates = () => {
  const navigate = useNavigate();
  const { activeRole, user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [departmentsDialogOpen, setDepartmentsDialogOpen] = useState(false);
  const [departmentsToView, setDepartmentsToView] = useState([]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch events so we can map coordinator photos
      const eventsRes = await API.get('/api/events');
      const allEvents = eventsRes.data?.events || [];
      setEvents(allEvents);

      let allowedEventNames = null;
      if (activeRole === 'FACULTY_COORDINATOR' && user) {
        const userEvents = allEvents.filter(e => {
          const coords = e.facultyCoordinators || (e.facultyCoordinator ? [e.facultyCoordinator] : []);
          return coords.some(c =>
            c.employeeId === user.institutionId ||
            c.employeeId === user.employeeId ||
            c.employeeId === user.employeeCode
          );
        });
        allowedEventNames = userEvents.map(e => e.eventName);
      }

      const response = await API.get('/api/razorpay/registrations', {
        params: { paymentStatus: 'PAID' }
      });
      let fetchedPayments = response.data?.payments || [];

      // Filter only PAID registrations for participation certificates
      fetchedPayments = fetchedPayments.filter(p => {
        const status = (p.paymentStatus || p.payment || '').toString().trim().toUpperCase();
        return status === 'PAID';
      });

      if (allowedEventNames) {
        fetchedPayments = fetchedPayments.filter(p => allowedEventNames.includes(p.eventName || p.category));
      }

      // Filter out any teams that have won a prize
      fetchedPayments = fetchedPayments.filter(p => !p.isFirstWinner && !p.isSecondWinner && !p.isThirdWinner);

      setPayments(fetchedPayments);
    } catch (error) {
      console.error('Error fetching event payments:', error);
      toast.error('Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  }, [user, activeRole]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const stats = {
    teamCount: payments.length,
    participantCount: payments.reduce((acc, curr) => acc + (curr.teamSize || 1), 0),
  };

  const columns = [
    'S.No',
    'Participant Name',
    'Roll Number',
    'College & Dept',
    'School Name',
    'Event Name',
    'Department(s)',
    'Team ID',
    'Contact Info',
    'Action'
  ];

  const handleDownloadCSV = () => {
    if (payments.length === 0) {
      toast.error('No data to download');
      return;
    }

    const headers = [
      'S.No', 'School Name', 'Event Name', 'Event Department(s)', 'Team ID', 'Team Size',
      'Participant Name', 'Gender', 'Roll Number', 'College', 'Student Department', 'Student Year', 'Mobile', 'Email'
    ];
    const csvRows = [headers.join(',')];
    let sNo = 1;

    payments.forEach((payment) => {
      const schoolCategory = payment.category || payment.schoolId || '-';
      const relatedEvent = events.find(e => e._id === payment.eventId);
      let eventDepartmentStr = '-';
      if (relatedEvent && relatedEvent.department && relatedEvent.department.length > 0) {
        eventDepartmentStr = relatedEvent.department.map(d => d.name).join(', ');
      }

      const teamId = payment.teamId || payment.receipt || '-';

      const teamBaseInfo = [
        `"${schoolCategory}"`,
        `"${payment.eventName || '-'}"`,
        `"${eventDepartmentStr}"`,
        `"${teamId}"`,
        payment.teamSize || 1
      ];

      if (payment.participants && payment.participants.length > 0) {
        let teamSerial = sNo++;
        payment.participants.forEach((p, idx) => {
          const rowTeamInfo = idx === 0 ? teamBaseInfo : ['', '', '', '', ''];
          const rowSNo = idx === 0 ? teamSerial : '';
          const row = [
            rowSNo,
            ...rowTeamInfo,
            `"${p.name || '-'}"`,
            `"${p.gender || '-'}"`,
            `"${p.roll || '-'}"`,
            `"${p.college === 'Other College' && p.otherCollege ? p.otherCollege : (p.college || '-')}"`,
            `"${p.department || '-'}"`,
            `"${p.year || '-'}"`,
            `"${p.mobile || '-'}"`,
            `"${p.email || '-'}"`
          ];
          csvRows.push(row.join(','));
        });
      } else {
        const row = [
          sNo++,
          ...teamBaseInfo,
          '-', '-', '-', '-', '-', '-', '-', '-'
        ];
        csvRows.push(row.join(','));
      }
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Participation_Certificates_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenCertificate = (participant, payment) => {
    setSelectedCertificate({ participant, payment });
    setDialogOpen(true);
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      toast.info('Generating PDF, please wait...', { duration: 3000 });

      const element = document.querySelector('.certificate-box');
      if (!element) return;

      const width = element.offsetWidth;
      const height = element.offsetHeight;

      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;

      const canvas = await html2canvas(element, {
        scale: 4, // 4x ultra-high resolution scale for razor-sharp rendering
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0
      });

      const imgData = canvas.toDataURL('image/png');
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF || jsPDFModule;

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [width, height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, width, height, undefined, 'FAST');
      pdf.save(`Certificate_${selectedCertificate?.participant?.name?.replace(/\s+/g, '_') || 'Participant'}.pdf`);
      toast.success('Downloaded successfully!');
    } catch (error) {
      console.error('PDF Error:', error);
      toast.error('Failed to generate PDF. Check console.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Winner status change logic removed since participants are non-winners

  let globalIndex = 1;
  const rows = payments.flatMap((payment) => {
    const schoolCategory = payment.category || payment.schoolId || '-';
    const relatedEvent = events.find(e => e._id === payment.eventId);
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

    if (!payment.participants || payment.participants.length === 0) return [];

    return payment.participants.map((p) => {
      return [
        globalIndex++,
        {
          value: p.name || '-',
          display: (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name || '-'}</Typography>
              {p.gender && <Typography variant="caption" color="text.secondary">Gender: {p.gender}</Typography>}
            </Box>
          )
        },
        p.roll || '-',
        {
          value: p.college || '-',
          display: (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {p.college === 'Other College' && p.otherCollege ? p.otherCollege : (p.college || '-')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {p.department ? `Dept: ${p.department}` : ''}{p.year ? ` | Yr: ${p.year}` : ''}
              </Typography>
            </Box>
          )
        },
        schoolCategory,
        payment.eventName || '-',
        departmentNode,
        payment.teamId || payment.receipt || '-',
        {
          value: p.mobile || p.email || '-',
          display: (
            <Box>
              {p.mobile && <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>Ph: {p.mobile}</Typography>}
              {p.email && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{p.email}</Typography>}
            </Box>
          )
        },
        {
          value: 'View',
          display: (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ViewIcon />}
              onClick={() => handleOpenCertificate(p, payment)}
              sx={{ borderRadius: '8px', textTransform: 'none' }}
            >
              View
            </Button>
          )
        }
      ];
    });
  });

  return (
    <PageContainer>
      <PageHeader
        title="Participation Certificates"
        subtitle="View participation certificates for student events"
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              onClick={handleDownloadCSV}
              startIcon={<DownloadIcon />}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                px: 2.5,
                py: 0.8,
                fontWeight: 700,
                background: 'var(--gradient-primary)',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(59, 130, 246, 0.5)',
                },
              }}
            >
              Export CSV
            </Button>
            <ActionButton
              onClick={fetchPayments}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </ActionButton>
          </Box>
        }
      />

      <StatCardGrid columns={2} sx={{ mb: 3 }}>
        <StatCard
          title="Total Teams"
          value={stats.teamCount}
          color="#3b82f6"
          icon={<GroupIcon />}
        />
        <StatCard
          title="Total Participants"
          value={stats.participantCount}
          color="#8b5cf6"
          icon={<PeopleAltIcon />}
        />
      </StatCardGrid>

      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {payments.length === 0 ? (
            <EmptyState
              title="No payment registrations found"
              description="Payment data will appear here once registrations are created or verified."
            />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              nonSortableColumns={[0, 7, 8]}
              alignments={['center', 'left', 'left', 'left', 'left', 'left', 'left', 'left', 'center']}
            />
          )}
        </Box>
      )}

      {/* Certificate Popup Dialog */}
      {selectedCertificate && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="xl"
          PaperProps={{
            id: 'invoice-print-container',
            sx: {
              borderRadius: '0px !important',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              m: 2,
              width: 'fit-content',
              maxWidth: 'fit-content',
              overflow: 'hidden'
            },
          }}
        >
          {(() => {
            const currentEvent = events.find(e => e.eventName === selectedCertificate.payment.eventName || e._id === selectedCertificate.payment.eventId);
            const facultyEmpId = currentEvent?.facultyCoordinator?.employeeId || currentEvent?.facultyCoordinators?.[0]?.employeeId;
            const eventEmpId = currentEvent?.group?.coordinator?.employeeId || currentEvent?.conveners?.[0]?.employeeId;

            return (
              <DialogContent sx={{ p: 0, position: 'relative', background: '#fff', borderRadius: '0px !important' }}>

                {/* Floating Action Buttons (Not included in PDF) */}
                <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 100, display: 'flex', gap: 1 }}>
                  <IconButton
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    title="Download PDF"
                    sx={{
                      background: 'rgba(255,255,255,0.95)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      '&:hover': { background: '#fff', transform: 'scale(1.05)' },
                      transition: 'all 0.2s'
                    }}
                  >
                    {isDownloading ? <CircularProgress size={20} /> : <DownloadIcon color="primary" />}
                  </IconButton>
                  <IconButton
                    onClick={() => setDialogOpen(false)}
                    title="Close"
                    sx={{
                      background: 'rgba(255,255,255,0.95)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      '&:hover': { background: '#fff', transform: 'scale(1.05)' },
                      transition: 'all 0.2s'
                    }}
                  >
                    <CloseIcon color="error" />
                  </IconButton>
                </Box>

                <style>
                  {`
                @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Dancing+Script:wght@500;600;700&family=Great+Vibes&family=Montserrat:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,400;1,600&display=swap');
                
                #invoice-print-container,
                #invoice-print-container *,
                .certificate-box,
                .certificate-box * {
                  color-scheme: light !important;
                }

                @media print {
                  @page { size: A4 landscape; margin: 0; }
                  html, body { margin: 0 !important; padding: 0 !important; overflow: hidden !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                  #invoice-print-container { box-shadow: none !important; margin: 0 !important; width: 100vw !important; height: 100vh !important; max-width: 100vw !important; max-height: 100vh !important; overflow: hidden !important; border-radius: 0 !important; }
                  .certificate-box { min-height: 100vh !important; height: 100vh !important; overflow: hidden !important; box-sizing: border-box !important; }
                  .no-print { display: none !important; }
                }
              `}
                </style>

                {(() => {
                  const rawBarcode = (
                    selectedCertificate.participant.barcode ||
                    selectedCertificate.payment.receipt ||
                    selectedCertificate.payment.teamId ||
                    `VD26-${selectedCertificate.participant.roll || 'PART'}`
                  ).toString().toUpperCase().replace(/[^A-Z0-9-]/g, '');
                  const barcodeValue = rawBarcode.length > 0 ? rawBarcode : 'VD26-CERT';

                  return (
                    <Box className="certificate-box" sx={{
                      height: { xs: '65vh', md: '78vh' },
                      maxWidth: '95vw',
                      aspectRatio: '3508 / 2480',
                      containerType: 'size',
                      background: '#ffffff',
                      position: 'relative',
                      p: 0,
                      borderRadius: '0px !important',
                      display: 'flex',
                      flexDirection: 'column',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      fontFamily: '"Montserrat", "Segoe UI", Arial, sans-serif'
                    }}>

                      {/* Outer Royal Blue Thick Frame */}
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        border: '2.5cqh solid #154487',
                        borderRadius: '0px !important',
                        zIndex: 2,
                        pointerEvents: 'none'
                      }} />

                      {/* 4 Ornate Victorian Filigree Corner Flourishes */}
                      <CertificateCornerFlourish position="top-left" />
                      <CertificateCornerFlourish position="top-right" />
                      <CertificateCornerFlourish position="bottom-left" />
                      <CertificateCornerFlourish position="bottom-right" />

                      {/* Certificate Main Inner Content Container */}
                      <Box sx={{
                        position: 'relative',
                        zIndex: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        pt: '1cqh',
                        px: '5cqh',
                        pb: '3.5cqh',
                        boxSizing: 'border-box'
                      }}>

                        {/* Top Header: Aditya University Long Logo with Ranking */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: '8px', mb: '2.5cqh' }}>
                          <Box
                            component="img"
                            src="/longlogowith ranking.png"
                            sx={{ height: '20cqh', maxWidth: '95%', objectFit: 'contain' }}
                            alt="Aditya University Logo"
                          />
                        </Box>

                        {/* VEDA Student Symposium Logo & Certificate Title */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3.5cqh', mb: '5cqh' }}>
                          <Box
                            component="img"
                            src="/veda_2026.png"
                            sx={{ height: '14cqh', objectFit: 'contain' }}
                            alt="VEDA Logo"
                          />
                          <Typography sx={{
                            fontFamily: '"Dulcelin", "Alex Brush", "Great Vibes", cursive',
                            fontSize: '6.1cqh',
                            color: '#154487',
                            whiteSpace: 'nowrap',
                            lineHeight: 1,
                            letterSpacing: '0.5px'
                          }}>
                            Certificate of Participation
                          </Typography>
                        </Box>

                        {/* Certificate Body Paragraphs */}
                        <Box sx={{ px: '3cqh', textAlign: 'left', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          {/* Line 1: Certify that Mr./Ms. [Participant Name] on dotted line */}
                          <Box sx={{ display: 'flex', alignItems: 'baseline', width: '100%', mb: '2.5cqh' }}>
                            <Typography sx={{ fontSize: '2.25cqh', color: '#154487', fontWeight: 500, whiteSpace: 'nowrap', mr: 1.5 }}>
                              This is to certify that Mr./Ms.
                            </Typography>
                            <Box sx={{
                              flex: 1,
                              position: 'relative',
                              borderBottom: '0.2cqh dotted #154487',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'baseline',
                              pb: '0.3cqh'
                            }}>
                              <Typography sx={{
                                fontFamily: '"Stem", sans-serif',
                                fontWeight: 800,
                                fontSize: '2.8cqh',
                                color: '#E75A24',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                lineHeight: 1
                              }}>
                                {selectedCertificate.participant.name || 'Participant Name'}
                                {selectedCertificate.participant.roll ? ` (${selectedCertificate.participant.roll})` : ''}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Line 2: has actively participated [Event Name] on dotted line, VEDA-2K26 organized by */}
                          <Box sx={{ display: 'flex', alignItems: 'baseline', width: '100%', mb: '2.5cqh' }}>
                            <Typography sx={{ fontSize: '2.25cqh', color: '#154487', fontWeight: 500, whiteSpace: 'nowrap', mr: 1.5 }}>
                              has actively participated
                            </Typography>
                            <Box sx={{
                              flex: 1,
                              position: 'relative',
                              borderBottom: '0.2cqh dotted #154487',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'baseline',
                              pb: '0.3cqh',
                              mr: 1.5
                            }}>
                              <Typography sx={{
                                fontFamily: '"Stem", sans-serif',
                                fontWeight: 800,
                                fontSize: '2.3cqh',
                                color: '#E75A24',
                                letterSpacing: '0.5px',
                                lineHeight: 1,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '44cqw'
                              }}>
                                {selectedCertificate.payment.eventName || 'Technical Competition'}
                              </Typography>
                            </Box>
                            <Typography sx={{ fontSize: '2.25cqh', whiteSpace: 'nowrap' }}>
                              <span style={{ color: '#E75A24', fontWeight: 500 }}>VEDA-2K26</span> <span style={{ color: '#154487', fontWeight: 500 }}>organized by</span>
                            </Typography>
                          </Box>

                          {/* Line 3: Aditya University, held on 11th and 12th September 2026 */}
                          <Box sx={{ textAlign: 'center', mb: '2.2cqh' }}>
                            <Typography sx={{ fontSize: '2.25cqh', color: '#154487', fontWeight: 500 }}>
                              Aditya University, held on <span style={{ fontWeight: 700 }}>11<sup>th</sup> and 12<sup>th</sup> September 2026</span>.
                            </Typography>
                          </Box>

                          {/* Lines 4-5: Appreciation italic cursive message */}
                          <Box sx={{ textAlign: 'center', px: 0, mb: '4cqh' }}>
                            <Typography sx={{
                              fontFamily: '"Dulcelin", "Alex Brush", "Dancing Script", cursive',
                              fontSize: '2.68cqh',
                              color: '#154487',
                              lineHeight: 1.5,
                              letterSpacing: '0.3px'
                            }}>
                              The participant has demonstrated enthusiasm, dedication, and a sincere interest in contributing to the success of the event. Their
                              involvement and cooperation are highly appreciated.
                            </Typography>
                          </Box>
                        </Box>

                        {/* Signatures & Barcode Verification Row */}
                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-end',
                          px: '7cqh',
                          mb: '6.5cqh',
                          zIndex: 10,
                          position: 'relative'
                        }}>
                          {/* Left: Convener */}
                          <Box sx={{ textAlign: 'center', width: '22cqh' }}>
                            <Typography sx={{ color: '#E75A24', fontWeight: 800, fontSize: '2.2cqh', letterSpacing: '0.2px', lineHeight: 1.2 }}>
                              Dr. D. Kishore
                            </Typography>
                            <Typography sx={{ color: '#154487', fontWeight: 600, fontSize: '1.7cqh', mt: '0.3cqh', lineHeight: 1.2 }}>
                              Convener
                            </Typography>
                          </Box>

                          {/* Center: Verification QR Code */}
                          <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justify: 'center',
                            textAlign: 'center',
                          }}>
                            <Box sx={{
                              background: '#fff',
                              p: '0.8cqh',
                              borderRadius: '0.4cqh',
                              border: '0.12cqh solid #cbd5e1',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                            }}>
                              <QRCodeSVG
                                value={`${window.location.origin}/verify/certificate/${selectedCertificate.payment.receipt || selectedCertificate.payment.teamId}/${selectedCertificate.participant.roll}`}
                                size={56}
                                level="H"
                                fgColor="#154487"
                                bgColor="#ffffff"
                              />
                              <Typography sx={{
                                fontSize: '1.05cqh',
                                fontWeight: 800,
                                fontFamily: 'monospace',
                                letterSpacing: '1px',
                                color: '#154487',
                                mt: '0.4cqh'
                              }}>
                                {barcodeValue}
                              </Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.85cqh', fontWeight: 700, color: '#64748b', mt: '0.35cqh', letterSpacing: '0.4px' }}>
                              VERIFIED PARTICIPATION CERTIFICATE
                            </Typography>
                          </Box>

                          {/* Right: Registrar */}
                          <Box sx={{ textAlign: 'center', width: '22cqh' }}>
                            <Typography sx={{ color: '#E75A24', fontWeight: 800, fontSize: '2.2cqh', letterSpacing: '0.2px', lineHeight: 1.2 }}>
                              Dr. G. Suresh
                            </Typography>
                            <Typography sx={{ color: '#154487', fontWeight: 600, fontSize: '1.7cqh', mt: '0.3cqh', lineHeight: 1.2 }}>
                              Registrar
                            </Typography>
                          </Box>
                        </Box>

                        {/* Bottom Royal Blue Address Bar */}
                        <Box sx={{
                          background: '#154487',
                          color: '#ffffff',
                          py: '0.80cqh',
                          textAlign: 'center',
                          position: 'absolute',
                          bottom: '3cqh',
                          left: '25cqh',
                          right: '25cqh',
                          zIndex: 10,
                          borderRadius: 0
                        }}>
                          <Typography sx={{
                            fontFamily: '"Stem", "Arial", sans-serif',
                            fontSize: '2cqh',
                            fontWeight: 200,
                            letterSpacing: '0.5px',
                            color: '#ffffff',
                            lineHeight: 1.2
                          }}>
                            Aditya Nagar, ADB Road, Surampalem - 533 437, Kakinada Dist., Andhra Pradesh.
                          </Typography>
                        </Box>

                      </Box>
                    </Box>
                  );
                })()}
              </DialogContent>
            );
          })()}
        </Dialog>
      )}

      <Dialog open={departmentsDialogOpen} onClose={() => setDepartmentsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>All Departments</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1 }}>
            {departmentsToView.map((d, i) => (
              <Chip key={i} label={d?.name || d} sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#1e40af' }} />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepartmentsDialogOpen(false)} variant="contained" sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ParticipationCertificates;
