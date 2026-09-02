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

      const response = await API.get('/api/razorpay/registrations');
      let fetchedPayments = response.data?.payments || [];

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
      
      // Dynamically import to avoid any Vite CJS/ESM strictness issues
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;
      
      const element = document.querySelector('.certificate-box');
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      
      const opt = {
        margin:       0,
        filename:     `Certificate_${selectedCertificate?.participant?.name?.replace(/\s+/g, '_') || 'Participant'}.pdf`,
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { 
          scale: 3, // higher scale for crisp output
          useCORS: true, 
          allowTaint: true,
          windowWidth: window.innerWidth, // Use real window dimensions to ensure cqh resolves correctly
          windowHeight: window.innerHeight
        },
        // Match the PDF format directly to the element's dimensions so there's absolutely no whitespace
        jsPDF:        { unit: 'px', format: [width, height], orientation: 'landscape' }
      };
      
      await html2pdf().set(opt).from(element).save();
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
              borderRadius: '0px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              m: 2,
              width: 'fit-content',
              maxWidth: 'fit-content'
            },
          }}
        >
          {(() => {
            const currentEvent = events.find(e => e.eventName === selectedCertificate.payment.eventName || e._id === selectedCertificate.payment.eventId);
            const facultyEmpId = currentEvent?.facultyCoordinator?.employeeId || currentEvent?.facultyCoordinators?.[0]?.employeeId;
            const eventEmpId = currentEvent?.group?.coordinator?.employeeId || currentEvent?.conveners?.[0]?.employeeId;

            return (
              <DialogContent sx={{ p: 0, position: 'relative', background: '#fff' }}>
            
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
                @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&display=swap');
                
                @media print {
                  @page { size: A4 landscape; margin: 0; }
                  html, body { margin: 0 !important; padding: 0 !important; overflow: hidden !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                  #invoice-print-container { box-shadow: none !important; margin: 0 !important; width: 100vw !important; height: 100vh !important; max-width: 100vw !important; max-height: 100vh !important; overflow: hidden !important; border-radius: 0 !important; }
                  .certificate-box { min-height: 100vh !important; height: 100vh !important; overflow: hidden !important; box-sizing: border-box !important; }
                  .no-print { display: none !important; }
                }
              `}
            </style>
            
            <Box className="certificate-box" sx={{
              height: { xs: '60vh', md: '70vh' },
              aspectRatio: '1.414',
              containerType: 'size',
              background: '#fff',
              position: 'relative',
              p: '4cqh',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              overflow: 'hidden',
              fontFamily: 'sans-serif'
            }}>
              
              {/* Corner Accents */}
              {/* Top Left (Blue) */}
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '15cqh', height: '15cqh', background: '#1c3d9a', clipPath: 'polygon(0 0, 100% 0, 0 100%)', zIndex: 0 }} />
              {/* Top Right (Orange) */}
              <Box sx={{ position: 'absolute', top: 0, right: 0, width: '15cqh', height: '15cqh', background: '#ea580c', clipPath: 'polygon(0 0, 100% 0, 100% 100%)', zIndex: 0 }} />
              {/* Bottom Left (Orange) */}
              <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: '15cqh', height: '15cqh', background: '#ea580c', clipPath: 'polygon(0 100%, 0 0, 100% 100%)', zIndex: 0 }} />
              {/* Bottom Right (Blue) */}
              <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: '15cqh', height: '15cqh', background: '#1c3d9a', clipPath: 'polygon(100% 100%, 100% 0, 0 100%)', zIndex: 0 }} />

              {/* Inner Border (Thin Dark Blue) */}
              <Box sx={{ 
                position: 'absolute', top: '2.5cqh', left: '2.5cqh', right: '2.5cqh', bottom: '2.5cqh', 
                border: '0.2cqh solid #1c3d9a', zIndex: 1 
              }}>
                 {/* Decorative Corner Flairs on Inner Border */}
                 <Box sx={{ position: 'absolute', top: '-1cqh', left: '-1cqh', width: '2cqh', height: '2cqh', border: '0.2cqh solid #1c3d9a', borderRadius: '50%', background: '#fff' }} />
                 <Box sx={{ position: 'absolute', top: '-1cqh', right: '-1cqh', width: '2cqh', height: '2cqh', border: '0.2cqh solid #1c3d9a', borderRadius: '50%', background: '#fff' }} />
                 <Box sx={{ position: 'absolute', bottom: '-1cqh', left: '-1cqh', width: '2cqh', height: '2cqh', border: '0.2cqh solid #1c3d9a', borderRadius: '50%', background: '#fff' }} />
                 <Box sx={{ position: 'absolute', bottom: '-1cqh', right: '-1cqh', width: '2cqh', height: '2cqh', border: '0.2cqh solid #1c3d9a', borderRadius: '50%', background: '#fff' }} />
              </Box>

              <Box sx={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', pt: '1.5cqh', px: '3cqh' }}>
                
                {/* Header: Logos */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: '1.5cqh', gap: '1cqh' }}>
                   {/* Fallback mock accreditation logos as simple text blocks since actual images aren't present */}
                   <Box sx={{ fontSize: '1.2cqh', fontWeight: 'bold', color: '#1c3d9a', border: '1px solid #1c3d9a', px: '0.5cqh' }}>nirf</Box>
                   <Box sx={{ fontSize: '1.2cqh', fontWeight: 'bold', color: '#1c3d9a', border: '1px solid #1c3d9a', px: '0.5cqh' }}>NAAC A+</Box>
                   <Box sx={{ fontSize: '1.2cqh', fontWeight: 'bold', color: '#1c3d9a', border: '1px solid #1c3d9a', px: '0.5cqh' }}>NBA</Box>
                </Box>

                {/* Header: Aditya University */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: '2cqh', gap: '2cqh' }}>
                  <img src="/src/assets/logo.png" style={{ height: '7cqh', objectFit: 'contain' }} alt="Logo" onError={(e) => e.target.style.display = 'none'} />
                  <Typography sx={{ fontFamily: '"Arial", sans-serif', fontWeight: 900, fontSize: '6cqh', color: '#ea580c', letterSpacing: '2px' }}>
                    ADITYA <span style={{ color: '#1c3d9a' }}>UNIVERSITY</span>
                  </Typography>
                </Box>

                {/* VEDA Logo & Certificate Title */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3cqh', mb: '5cqh' }}>
                  <Box sx={{ 
                    width: '10cqh', height: '10cqh', borderRadius: '50%', background: '#1c3d9a', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' 
                  }}>
                     <Typography sx={{ fontSize: '1.8cqh', fontWeight: 'bold' }}>2K26</Typography>
                     <Typography sx={{ fontSize: '3cqh', fontWeight: 900, borderTop: '0.2cqh solid #fff', borderBottom: '0.2cqh solid #fff', lineHeight: 1 }}>VEDA</Typography>
                     <Typography sx={{ fontSize: '1cqh', mt: '0.2cqh' }}>A SYMPOSIUM</Typography>
                  </Box>
                  <Typography sx={{ fontFamily: '"Great Vibes", cursive', fontSize: '7cqh', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    Certificate of Participation
                  </Typography>
                </Box>

                {/* Body Content */}
                <Box sx={{ px: '5cqh', textAlign: 'left', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                   {/* Line 1 */}
                   <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '2cqh', mb: '2.5cqh' }}>
                      <Typography sx={{ fontSize: '2.4cqh', color: '#4b5563', whiteSpace: 'nowrap' }}>This is to certify that Mr./Ms.</Typography>
                      <Box sx={{ flex: 1, borderBottom: '0.1cqh solid #d1d5db', textAlign: 'center', pb: '0.5cqh' }}>
                         <Typography sx={{ fontFamily: '"Great Vibes", cursive', fontSize: '4cqh', color: '#1f2937', lineHeight: 0.8 }}>
                           {selectedCertificate.participant.name || 'Participant Name'}
                         </Typography>
                      </Box>
                   </Box>

                   {/* Line 2 */}
                   <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '2cqh', mb: '3.5cqh' }}>
                      <Typography sx={{ fontSize: '2.4cqh', color: '#4b5563', whiteSpace: 'nowrap' }}>of</Typography>
                      <Box sx={{ width: '20cqh', borderBottom: '0.1cqh solid #d1d5db', textAlign: 'center', pb: '0.5cqh' }}>
                         <Typography sx={{ fontFamily: '"Great Vibes", cursive', fontSize: '3.2cqh', color: '#1f2937', lineHeight: 0.8, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                           {selectedCertificate.participant.college === 'Other College' && selectedCertificate.participant.otherCollege ? selectedCertificate.participant.otherCollege : (selectedCertificate.participant.college || '-')}
                         </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '2.4cqh', color: '#4b5563', whiteSpace: 'nowrap' }}>department of</Typography>
                      <Box sx={{ width: '20cqh', borderBottom: '0.1cqh solid #d1d5db', textAlign: 'center', pb: '0.5cqh' }}>
                         <Typography sx={{ fontFamily: '"Great Vibes", cursive', fontSize: '3.2cqh', color: '#1f2937', lineHeight: 0.8 }}>
                           {selectedCertificate.participant.branch || '-'}
                         </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '2.4cqh', color: '#4b5563', whiteSpace: 'nowrap' }}>has</Typography>
                      <Box sx={{ flex: 1, borderBottom: '0.1cqh solid #d1d5db', textAlign: 'center', pb: '0.5cqh' }}>
                         <Typography sx={{ fontFamily: '"Great Vibes", cursive', fontSize: '3.2cqh', color: '#1f2937', lineHeight: 0.8, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                           {selectedCertificate.payment.eventName || '-'}
                         </Typography>
                      </Box>
                   </Box>

                   {/* Line 3, 4, 5 */}
                   <Typography sx={{ fontSize: '2.4cqh', color: '#6b7280', lineHeight: 1.8, mb: '1cqh' }}>
                      event of <span style={{ color: '#ea580c' }}>VEDA 2K26</span>, A National Level Student Symposium held on 11th & 12th September, 2026, <br/>
                      on the occasion of <span style={{ color: '#ea580c' }}>Engineers's Day</span>.
                   </Typography>
                   <Typography sx={{ fontSize: '2.4cqh', color: '#6b7280' }}>
                      We appreciate your enthusiasm and valuable contribution to making the event a success.
                   </Typography>
                </Box>

                {/* Footer Signatures & QR */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', px: '8cqh', mb: '4cqh' }}>
                   
                   {/* QR Code in Bottom Left */}
                   <Box sx={{ textAlign: 'center', zIndex: 10 }}>
                     <Box sx={{ width: '9cqh', height: '9cqh', border: '0.2cqh solid #cbd5e1', p: '0.5cqh', background: '#fff' }}>
                       <img 
                         src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/verify/certificate/${selectedCertificate.payment.receipt}/${selectedCertificate.participant.roll || 'team'}`)}`} 
                         alt="Verify QR" 
                         style={{ width: '100%', height: '100%' }} 
                       />
                     </Box>
                     <Typography sx={{ fontSize: '1.1cqh', fontWeight: 700, mt: '0.5cqh', color: '#374151' }}>Scan to Verify</Typography>
                   </Box>

                   {/* Left Signature */}
                   <Box sx={{ textAlign: 'center', width: '25cqh', position: 'relative' }}>
                      <Box sx={{ height: '6cqh', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', mb: '0.5cqh' }}>
                          <Typography sx={{ fontFamily: '"Great Vibes", cursive', fontSize: '4cqh', color: '#1c3d9a' }}>D. V. Sesha Reddy</Typography>
                      </Box>
                      <Typography sx={{ color: '#dc2626', fontWeight: 600, fontSize: '1.6cqh' }}>Dr. D. V. Sesha Reddy</Typography>
                      <Typography sx={{ color: '#4b5563', fontSize: '1.4cqh' }}>Vice - Chancellor</Typography>
                   </Box>

                   {/* Right Signature */}
                   <Box sx={{ textAlign: 'center', width: '25cqh', position: 'relative' }}>
                      <Box sx={{ height: '6cqh', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', mb: '0.5cqh' }}>
                          <Typography sx={{ fontFamily: '"Great Vibes", cursive', fontSize: '4cqh', color: '#60a5fa' }}>A. Ramesh</Typography>
                      </Box>
                      <Typography sx={{ color: '#dc2626', fontWeight: 600, fontSize: '1.6cqh' }}>Dr. A. Ramesh</Typography>
                      <Typography sx={{ color: '#4b5563', fontSize: '1.4cqh' }}>Pro Vice-Chancellor (Academics)</Typography>
                   </Box>
                </Box>

                {/* Orange Address Bar */}
                <Box sx={{ 
                  background: '#ea580c', color: '#fff', py: '1cqh', textAlign: 'center', 
                  position: 'absolute', bottom: '2cqh', left: '15cqh', right: '15cqh', zIndex: 10 
                }}>
                   <Typography sx={{ fontSize: '1.6cqh', letterSpacing: '0.5px' }}>
                     Aditya Nagar, ADB Road, Surampalem, 533 437, Kakinada Dist., Andhra Pradesh
                   </Typography>
                </Box>

              </Box>
            </Box>
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
