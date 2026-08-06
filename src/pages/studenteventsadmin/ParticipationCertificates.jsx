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
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

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
    'Main Group / Category',
    'Event Name',
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
      'S.No', 'Main Group / Category', 'Event Name', 'Team ID', 'Team Size',
      'Participant Name', 'Gender', 'Roll Number', 'College', 'Department', 'Year', 'Mobile', 'Email', 'Accommodation'
    ];
    const csvRows = [headers.join(',')];
    let sNo = 1;

    payments.forEach((payment) => {
      const schoolCategory = payment.category && payment.schoolId
        ? `${payment.schoolId.toUpperCase()} / ${payment.category}`
        : (payment.category || payment.schoolId || '-');
      const teamId = payment.teamId || payment.receipt || '-';
      
      const teamBaseInfo = [
        `"${schoolCategory}"`,
        `"${payment.eventName || '-'}"`,
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
            `"${p.email || '-'}"`,
            `"${p.accommodation || '-'}"`
          ];
          csvRows.push(row.join(','));
        });
      } else {
        const row = [
          sNo++,
          ...teamBaseInfo,
          '-', '-', '-', '-', '-', '-', '-', '-', '-'
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
    const schoolCategory = payment.category && payment.schoolId
      ? `${payment.schoolId.toUpperCase()} / ${payment.category}`
      : (payment.category || payment.schoolId || '-');

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
    <Box sx={{ p: { xs: 2, md: 3, lg: 4 } }}>
      <PageHeader
        title="Participation Certificates"
        subtitle="View participation certificates for student events"
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={handleDownloadCSV}
              startIcon={<DownloadIcon />}
              sx={{ borderRadius: '12px', textTransform: 'none', px: 2.5, py: 1 }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              onClick={fetchPayments}
              startIcon={<RefreshIcon />}
              sx={{ borderRadius: '12px', textTransform: 'none', px: 2.5, py: 1 }}
            >
              Refresh
            </Button>
          </Box>
        }
      />

      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { label: 'Total Teams', value: stats.teamCount, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: <GroupIcon /> },
            { label: 'Total Participants', value: stats.participantCount, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', icon: <PeopleAltIcon /> },
          ].map((stat, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2.5, 
                  borderRadius: '20px', 
                  border: '1px solid',
                  borderColor: 'var(--border-color)',
                  background: `linear-gradient(135deg, var(--bg-panel, #ffffff) 0%, ${stat.bg} 100%)`,
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2.5,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: '14px', 
                    background: stat.bg, 
                    color: stat.color, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${stat.bg}`
                  }}
                >
                  {React.cloneElement(stat.icon, { sx: { fontSize: 26 } })}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 0.5, letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {stat.value}
                  </Typography>
                </Box>
                
                {/* Background watermark icon */}
                <Box sx={{ position: 'absolute', right: -10, bottom: -15, opacity: 0.05, color: stat.color, transform: 'scale(2.5)' }}>
                  {React.cloneElement(stat.icon)}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
        <Box sx={{ mt: 2 }}>
          {payments.length === 0 ? (
            <Box sx={{ p: 4, borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-panel)', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                No payment registrations found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Payment data will appear here once registrations are created or verified.
              </Typography>
            </Box>
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
      </Box>

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
            const eventEmpId = currentEvent?.group?.eventCoordinator?.employeeId || currentEvent?.conveners?.[0]?.employeeId;

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
              height: { xs: '60vh', md: '70vh' }, // Fits comfortably in the dialog viewport
              aspectRatio: '1.414',
              containerType: 'size',
              background: '#fdfbf7', // slight off-white paper color
              position: 'relative',
              p: '4cqh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              border: '3cqh solid #0a192f', // Dark blue outer border
              outline: '0.6cqh solid #b8860b', // Gold inner border
              outlineOffset: '-4cqh',
              boxShadow: 'inset 0 0 0 1.2cqh #b8860b', // Inner gold border
            }}>
              
              {/* Decorative Corners (simulated with CSS) */}
              <Box sx={{ position: 'absolute', top: '2.5cqh', left: '2.5cqh', width: '6cqh', height: '6cqh', borderTop: '0.5cqh solid #b8860b', borderLeft: '0.5cqh solid #b8860b' }}></Box>
              <Box sx={{ position: 'absolute', top: '2.5cqh', right: '2.5cqh', width: '6cqh', height: '6cqh', borderTop: '0.5cqh solid #b8860b', borderRight: '0.5cqh solid #b8860b' }}></Box>
              <Box sx={{ position: 'absolute', bottom: '2.5cqh', left: '2.5cqh', width: '6cqh', height: '6cqh', borderBottom: '0.5cqh solid #b8860b', borderLeft: '0.5cqh solid #b8860b' }}></Box>
              <Box sx={{ position: 'absolute', bottom: '2.5cqh', right: '2.5cqh', width: '6cqh', height: '6cqh', borderBottom: '0.5cqh solid #b8860b', borderRight: '0.5cqh solid #b8860b' }}></Box>

              <Box sx={{ mt: '2cqh', pb: '3cqh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                
                {/* Logo area */}
                <Box sx={{ mb: '1cqh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src="/src/assets/logo.png" style={{ height: '9cqh', objectFit: 'contain' }} alt="Logo" onError={(e) => e.target.style.display = 'none'} />
                </Box>
                
                <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 900, fontSize: '6cqh', color: '#0a192f', letterSpacing: '2px', lineHeight: 1 }}>
                  ADITYA UNIVERSITY
                </Typography>
                <Typography sx={{ fontFamily: 'sans-serif', fontSize: '2cqh', color: '#444', mb: '1cqh', mt: '0.8cqh' }}>
                  (Established Under the Aditya University Act)
                </Typography>
                
                <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 900, fontSize: '8cqh', color: '#0a192f', letterSpacing: '4px', mb: '1.5cqh' }}>
                  VEDA 2026
                </Typography>
                
                {/* Banner */}
                <Box sx={{ background: '#0a192f', color: '#fff', py: '1.2cqh', px: '8cqh', mb: '3cqh', position: 'relative', border: '0.3cqh solid #b8860b' }}>
                  <Typography sx={{ fontFamily: 'sans-serif', fontWeight: 700, fontSize: '2.5cqh', letterSpacing: '2px' }}>
                    CERTIFICATE OF PARTICIPATION
                  </Typography>
                  {/* Banner Ribbons */}
                  <Box sx={{ position: 'absolute', top: '50%', left: '-2.5cqh', transform: 'translateY(-50%)', borderTop: '2.5cqh solid transparent', borderBottom: '2.5cqh solid transparent', borderRight: '2.5cqh solid #0a192f', zIndex: -1 }}></Box>
                  <Box sx={{ position: 'absolute', top: '50%', right: '-2.5cqh', transform: 'translateY(-50%)', borderTop: '2.5cqh solid transparent', borderBottom: '2.5cqh solid transparent', borderLeft: '2.5cqh solid #0a192f', zIndex: -1 }}></Box>
                </Box>

                <Typography sx={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '2.5cqh', color: '#333', mb: '1cqh' }}>
                  This Certificate is Proudly Presented to
                </Typography>

                {/* Participant Name */}
                <Typography sx={{ fontFamily: '"Great Vibes", cursive', fontSize: '13cqh', color: '#b8860b', lineHeight: 1.1, mb: '1.5cqh' }}>
                  {selectedCertificate.participant.name || 'Participant Name'}
                </Typography>

                {/* Paragraph */}
                <Box sx={{ maxWidth: '85%', mb: '2cqh' }}>
                  <Typography sx={{ fontFamily: 'sans-serif', fontSize: '2.4cqh', color: '#333', lineHeight: 1.6 }}>
                    for actively participating in <strong>{selectedCertificate.payment.eventName || '-'}</strong> organized by <strong>Aditya University</strong>. <br/>
                    Your enthusiastic participation, dedication and valuable contribution have made the event a grand success. <br/>
                    We appreciate your commitment and wish you all the best for your future endeavors.
                  </Typography>
                </Box>

                {/* Footer Details: Date, Venue, Signatures */}
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pl: '24cqh', pr: '6cqh', mt: '3cqh' }}>

                  {/* Date & Venue (Center-Left) */}
                  <Box sx={{ display: 'flex', gap: '4cqh', mb: '1.5cqh' }}>
                     <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.8cqh', color: '#333' }}>
                          15 September 2026
                        </Typography>
                        <Typography sx={{ fontSize: '1.4cqh', color: '#666' }}>Date</Typography>
                     </Box>
                     <Box sx={{ borderLeft: '0.2cqh solid #ccc' }}></Box>
                     <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.8cqh', color: '#333' }}>
                          Aditya University
                        </Typography>
                        <Typography sx={{ fontSize: '1.4cqh', color: '#666' }}>Venue</Typography>
                     </Box>
                  </Box>

                  {/* Right Side: Signatures */}
                  <Box sx={{ display: 'flex', gap: '4cqh', mb: '1cqh' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ height: '7cqh', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', mb: '0.5cqh' }}>
                        <CoordinatorPhoto 
                          employeeCode={eventEmpId} 
                          fallbackSrc="https://info.aec.edu.in/adityacentral/staffPhotos/default.jpg" 
                          sx={{ maxHeight: '100%', objectFit: 'contain' }} 
                        />
                      </Box>
                      <Box sx={{ borderTop: '0.2cqh solid #333', width: '20cqh', pt: '0.5cqh' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.6cqh' }}>Event Coordinator</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ height: '7cqh', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', mb: '0.5cqh' }}>
                        <CoordinatorPhoto 
                          employeeCode={facultyEmpId} 
                          fallbackSrc="https://info.aec.edu.in/adityacentral/staffPhotos/default.jpg" 
                          sx={{ maxHeight: '100%', objectFit: 'contain' }} 
                        />
                      </Box>
                      <Box sx={{ borderTop: '0.2cqh solid #333', width: '20cqh', pt: '0.5cqh' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.6cqh' }}>Faculty Coordinator</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ height: '7cqh', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', mb: '0.5cqh' }}></Box>
                      <Box sx={{ borderTop: '0.2cqh solid #333', width: '20cqh', pt: '0.5cqh' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.6cqh' }}>Dean / Principal</Typography>
                      </Box>
                    </Box>
                  </Box>

                </Box>

                {/* ID Badge at top left */}
                <Box sx={{ position: 'absolute', top: '3cqh', left: '4cqh', zIndex: 10 }}>
                  <Typography sx={{ color: '#333', fontSize: '1.8cqh', fontWeight: 700, letterSpacing: '1px', borderBottom: '1px solid #b8860b', pb: '0.2cqh' }}>
                    Certificate ID: VEDA2026-P-{selectedCertificate.payment.receipt || '000001'}
                  </Typography>
                </Box>

                {/* QR Code at bottom left */}
                <Box sx={{ position: 'absolute', bottom: '3cqh', left: '4cqh', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
                  <Box sx={{ width: '12cqh', height: '12cqh', border: '0.3cqh solid #333', p: '0.8cqh', mb: '0.5cqh', background: '#fff' }}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/verify/certificate/${selectedCertificate.payment.receipt}/${selectedCertificate.participant.roll || 'team'}`)}`} 
                      alt="QR" 
                      style={{width: '100%', height: '100%'}}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#333', fontSize: '1.6cqh' }}>Scan to Verify</Typography>
                </Box>

              </Box>
            </Box>
            </DialogContent>
            );
          })()}
        </Dialog>
      )}

    </Box>
  );
};

export default ParticipationCertificates;
