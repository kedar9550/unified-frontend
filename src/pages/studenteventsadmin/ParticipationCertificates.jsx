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
  IconButton,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Close as CloseIcon,
  Group as GroupIcon,
  PeopleAlt as PeopleAltIcon,
  Refresh as RefreshIcon,
  FileDownload as DownloadIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
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

const AutoFitParticipantName = ({ name, roll }) => {
  const containerRef = React.useRef(null);
  const textRef = React.useRef(null);

  React.useEffect(() => {
    if (!containerRef.current || !textRef.current) return;

    const calculateSize = () => {
      const container = containerRef.current;
      const text = textRef.current;
      
      const containerWidth = container.clientWidth;
      let currentSize = 2.8;
      
      text.style.fontSize = `${currentSize}cqh`;
      
      let textWidth = text.scrollWidth;

      while (textWidth > containerWidth && currentSize > 2.0) {
        currentSize -= 0.1;
        currentSize = Math.round(currentSize * 10) / 10;
        text.style.fontSize = `${currentSize}cqh`;
        textWidth = text.scrollWidth;
      }
      
      if (currentSize < 2.0) {
        text.style.fontSize = '2.0cqh';
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      calculateSize();
    });

    resizeObserver.observe(containerRef.current);
    
    // Initial calculation
    calculateSize();

    return () => resizeObserver.disconnect();
  }, [name, roll]);

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        position: 'relative',
        borderBottom: '0.2cqh dotted #154487',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'baseline',
        pb: '0.3cqh',
        minWidth: 0
      }}
    >
      <Typography
        ref={textRef}
        sx={{
          fontFamily: '"Stem", sans-serif',
          fontWeight: 800,
          fontSize: '2.8cqh',
          color: '#E75A24',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          lineHeight: 1,
          whiteSpace: 'nowrap'
        }}
      >
        {name || 'Participant Name'}
        {roll && (
          <span style={{ fontSize: '2.0cqh', fontWeight: 700, marginLeft: '0.4cqh' }}>
            ({roll})
          </span>
        )}
      </Typography>
    </Box>
  );
};

const ParticipationCertificates = () => {
  const { activeRole, user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

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

      // Helper to check attended status
      const isParticipantAttended = (part) => {
        if (!part) return false;
        if (part.attended === true || part.attended === 1) return true;
        if (typeof part.attended === 'string') {
          const s = part.attended.trim().toLowerCase();
          return s === 'true' || s === 'yes' || s === '1' || s === 'present';
        }
        return false;
      };

      // Filter each payment to only include participants who attended
      fetchedPayments = fetchedPayments
        .map(payment => ({
          ...payment,
          participants: (payment.participants || []).filter(isParticipantAttended)
        }))
        .filter(payment => payment.participants.length > 0);

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
    participantCount: payments.reduce((acc, curr) => acc + (curr.participants?.length || 0), 0),
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
        payment.participants?.length || payment.teamSize || 1
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

  const generateCertificatePdf = async () => {
    const element = document.querySelector('.certificate-box');
    if (!element) return null;

    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default || html2canvasModule;

    const canvas = await html2canvas(element, {
      scale: 4, // 4x ultra-high resolution scale for razor-sharp rendering
      useCORS: true,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF || jsPDFModule;

    // Standard ISO 216 A4 landscape page: 297mm x 210mm
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 297;
    const pageHeight = 210;

    // Safe print margins ensuring all 4 borders print completely on any physical printer without getting clipped
    const marginY = 6; // 6mm top and bottom margin (well within standard printer hardware printable area)
    const certHeight = pageHeight - (marginY * 2); // 198mm
    const certWidth = certHeight * (canvas.width / canvas.height); // maintains exact certificate aspect ratio
    const marginX = (pageWidth - certWidth) / 2; // perfectly centered horizontally (~8.46mm)

    pdf.addImage(imgData, 'PNG', marginX, marginY, certWidth, certHeight, undefined, 'FAST');
    return pdf;
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      toast.info('Generating A4 PDF, please wait...', { duration: 3000 });

      const pdf = await generateCertificatePdf();
      if (!pdf) {
        toast.error('Certificate element not found');
        return;
      }

      pdf.save(`Certificate_${selectedCertificate?.participant?.name?.replace(/\s+/g, '_') || 'Participant'}.pdf`);
      toast.success('A4 Certificate downloaded successfully!');
    } catch (error) {
      console.error('PDF Error:', error);
      toast.error('Failed to generate PDF. Check console.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintCertificate = async () => {
    try {
      setIsPrinting(true);
      toast.info('Preparing certificate for printing...', { duration: 2500 });

      const pdf = await generateCertificatePdf();
      if (!pdf) {
        toast.error('Certificate element not found');
        return;
      }

      pdf.autoPrint();
      const blobUrl = pdf.output('bloburl');
      const printWindow = window.open(blobUrl, '_blank');
      if (!printWindow) {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.src = blobUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        };
      }
    } catch (error) {
      console.error('Print Error:', error);
      toast.error('Failed to prepare print document.');
    } finally {
      setIsPrinting(false);
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
          <DialogContent sx={{ p: 0, position: 'relative', background: '#fff', borderRadius: '0px !important' }}>

            {/* Floating Action Buttons (Not included in print/PDF) */}
            <Box className="no-print" sx={{ position: 'absolute', top: 16, right: 16, zIndex: 100, display: 'flex', gap: 1 }}>
              <IconButton
                onClick={handlePrintCertificate}
                disabled={isPrinting || isDownloading}
                title="Print Certificate (A4)"
                sx={{
                  background: 'rgba(255,255,255,0.95)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&:hover': { background: '#fff', transform: 'scale(1.05)' },
                  transition: 'all 0.2s'
                }}
              >
                {isPrinting ? <CircularProgress size={20} /> : <PrintIcon color="primary" />}
              </IconButton>
              <IconButton
                onClick={handleDownloadPDF}
                disabled={isPrinting || isDownloading}
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
                  @page {
                    size: A4 landscape;
                    margin: 6mm 8.5mm;
                  }
                  html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #ffffff !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .no-print,
                  .MuiBackdrop-root,
                  header,
                  nav,
                  aside,
                  button {
                    display: none !important;
                  }
                  .MuiDialog-root {
                    position: static !important;
                    display: block !important;
                  }
                  .MuiDialog-container {
                    display: block !important;
                    position: static !important;
                    padding: 0 !important;
                  }
                  .MuiPaper-root {
                    box-shadow: none !important;
                    margin: 0 !important;
                    max-width: 100% !important;
                    width: 100% !important;
                    background: transparent !important;
                  }
                  .certificate-box {
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 100% !important;
                    max-height: 100% !important;
                    margin: 0 auto !important;
                    box-shadow: none !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                  }
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
                    boxSizing: 'border-box',
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
                        <AutoFitParticipantName 
                          name={selectedCertificate.participant.name} 
                          roll={selectedCertificate.participant.roll} 
                        />
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
                            fontSize: '2.1cqh',
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
                      <Box sx={{ textAlign: 'center', width: '22cqh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box
                          component="img"
                          src="/dr_kishore_signature.png?v=2"
                          alt="Dr. D. Kishore Digital Signature"
                          sx={{
                            height: '3.8cqh',
                            maxWidth: '16cqh',
                            objectFit: 'contain',
                            mb: '0.4cqh'
                          }}
                        />
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
                      <Box sx={{ textAlign: 'center', width: '22cqh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box
                          component="img"
                          src="/dr_suresh_signature.png?v=2"
                          alt="Dr. G. Suresh Digital Signature"
                          sx={{
                            height: '9.5cqh',
                            maxWidth: '20cqh',
                            objectFit: 'contain',
                            mb: '0.4cqh'
                          }}
                        />
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
