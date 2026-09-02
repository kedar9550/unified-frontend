import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  MenuItem,
  TextField,
  Paper,
  alpha,
} from '@mui/material';
import { keyframes } from '@mui/system';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
`;

const pulseWarning = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
  100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
`;
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { Card, CardContent, Chip, Avatar } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import { PageContainer } from '../../components/common/design-system';
import ActionButton from '../../components/common/ActionButton';
import API from '../../api/axios';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import EventPassCard from '../../components/EventPass/EventPassCard';
import html2pdf from 'html2pdf.js';

const Passes = () => {
  const { activeRole, user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('ALL');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const eventsRes = await API.get('/api/events');
      const allEvents = eventsRes.data?.events || [];

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

      fetchedPayments = fetchedPayments.map(p => {
        const eventMatch = allEvents.find(e => e.eventName === (p.eventName || p.category));
        return {
          ...p,
          venue: eventMatch ? (
            eventMatch.venueType === 'Indoor' && eventMatch.building && eventMatch.floor
              ? `${eventMatch.building.name || eventMatch.building}-${eventMatch.floor.name || eventMatch.floor}${eventMatch.roomNo ? `, Room No: ${eventMatch.roomNo}` : ''
              }`
              : eventMatch.venueType === 'Outdoor' && eventMatch.ground
                ? `${eventMatch.ground.name || eventMatch.ground}${eventMatch.roomNo ? `, Room No: ${eventMatch.roomNo}` : ''}`
                : eventMatch.venue
          ) : null
        };
      });

      setPayments(fetchedPayments);
    } catch (error) {
      console.error('Error fetching event participants:', error);
      toast.error(error.response?.data?.message || 'Failed to load participants');
    } finally {
      setLoading(false);
    }
  }, [activeRole, user]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Flatten all participants across payment registrations
  const allParticipants = useMemo(() => {
    const list = [];
    payments.forEach((payment) => {
      if (Array.isArray(payment.participants)) {
        payment.participants.forEach((participant, pIdx) => {
          list.push({
            ...participant,
            id: `${payment._id || payment.receipt}-${pIdx}`,
            paymentId: payment._id,
            receipt: payment.receipt,
            teamId: payment.teamId,
            eventName: payment.eventName || payment.category || 'Event',
            category: payment.category,
            schoolId: payment.schoolId,
            razorpayPaymentId: payment.razorpayPaymentId,
            razorpayOrderId: payment.razorpayOrderId,
            amount: payment.amountRupees ?? payment.amount,
            paidAt: payment.createdAt || payment.paidAt,
            venue: payment.venue,
          });
        });
      }
    });
    return list;
  }, [payments]);

  // Extract unique events for filter dropdown
  const uniqueEvents = useMemo(() => {
    const eventsSet = new Set();
    allParticipants.forEach((p) => {
      if (p.eventName) eventsSet.add(p.eventName);
    });
    return Array.from(eventsSet);
  }, [allParticipants]);

  // Apply filters
  const filteredParticipants = useMemo(() => {
    return allParticipants.filter((p) => {
      // Event filter
      if (eventFilter !== 'ALL' && p.eventName !== eventFilter) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = (p.name || '').toLowerCase();
        const roll = (p.roll || '').toLowerCase();
        const email = (p.email || '').toLowerCase();
        const mobile = (p.mobile || '').toLowerCase();
        const college = (p.college || '').toLowerCase();
        const eventName = (p.eventName || '').toLowerCase();
        const receipt = (p.receipt || '').toLowerCase();

        return (
          name.includes(query) ||
          roll.includes(query) ||
          email.includes(query) ||
          mobile.includes(query) ||
          college.includes(query) ||
          eventName.includes(query) ||
          receipt.includes(query)
        );
      }

      return true;
    });
  }, [allParticipants, eventFilter, searchQuery]);

  const handleDownloadPdf = () => {
    if (filteredParticipants.length === 0) {
      toast.error('No passes to download.');
      return;
    }

    const element = document.getElementById('pdf-passes-container');
    element.style.display = 'block';

    const opt = {
      margin: 0,
      filename: 'Eventveda_Passes.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'css', before: '.html2pdf__page-break' }
    };

    toast.promise(
      html2pdf().set(opt).from(element).save().then(() => {
        element.style.display = 'none';
      }),
      {
        loading: 'Generating PDF... Please wait.',
        success: 'PDF downloaded successfully!',
        error: 'Failed to generate PDF.',
      }
    );
  };

  return (
    <PageContainer>
      <Box className="no-print">
        <PageHeader
          title="Bulk Passes"
          subtitle={`Total Passes: ${filteredParticipants.length}`}
          action={
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchPayments}
                disabled={loading}
              >
                Refresh
              </Button>
              <ActionButton
                startIcon={<DownloadIcon />}
                onClick={handleDownloadPdf}
                disabled={loading || filteredParticipants.length === 0}
              >
                Download PDF
              </ActionButton>
            </Box>
          }
        />

        {/* Glassmorphic Filters Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 4,
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            gap: 2.5,
            flexWrap: 'wrap',
            alignItems: 'center',
            animation: `${fadeUp} 0.5s ease-out forwards`,
          }}
        >
          <TextField
            label="Search Participants"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: '100%', sm: 260 }, flex: { sm: 1 } }}
          />

          <TextField
            select
            label="Filter by Event"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            size="small"
            sx={{ width: { xs: '100%', sm: 200 } }}
          >
            <MenuItem value="ALL">All Events</MenuItem>
            {uniqueEvents.map((event) => (
              <MenuItem key={event} value={event}>
                {event}
              </MenuItem>
            ))}
          </TextField>
        </Paper>
      </Box>

      {/* Content Area */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }} className="no-print">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Screen Container (Not for PDF) */}
          <Box
            sx={{
              display: 'grid',
              gap: 3.5,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
            }}
            className="no-print"
          >
            {filteredParticipants.map((participant, index) => (
              <Card
                key={participant.id}
                sx={{
                  position: 'relative',
                  borderRadius: '24px',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  overflow: 'hidden',
                  background: '#ffffff',
                  border: '1px solid rgba(0,0,0,0.03)',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  animation: `${fadeUp} 0.6s ease-out forwards`,
                  animationDelay: `${index * 0.05}s`,
                  opacity: 0,
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                    borderColor: 'rgba(59, 130, 246, 0.2)',
                  },
                }}
              >
                {/* Premium Gradient Accent */}
                <Box sx={{ height: '6px', width: '100%', background: 'linear-gradient(90deg, #2563eb, #7c3aed, #db2777)', backgroundSize: '200% auto', animation: 'gradientShift 3s ease infinite' }} />
                
                <style>
                  {`
                    @keyframes gradientShift {
                      0% { background-position: 0% 50%; }
                      50% { background-position: 100% 50%; }
                      100% { background-position: 0% 50%; }
                    }
                  `}
                </style>

                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2, p: 3, pt: 3 }}>
                  <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={`${import.meta.env.VITE_BACKEND_URL || "http://localhost:9000"}/api/proxy/student-photo/${participant.roll}`}
                        alt={participant.name}
                        sx={{
                          width: 64,
                          height: 64,
                          border: '3px solid #fff',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                          bgcolor: 'primary.main',
                          color: '#fff',
                          fontWeight: 'bold'
                        }}
                      >
                        {participant.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: -4,
                          right: -4,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          bgcolor: participant.attended ? '#10b981' : '#f59e0b',
                          border: '3px solid #fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          animation: participant.attended ? `${pulse} 2s infinite` : `${pulseWarning} 2s infinite`,
                          boxShadow: participant.attended ? '0 0 10px rgba(16,185,129,0.5)' : '0 0 10px rgba(245,158,11,0.5)'
                        }}
                        title={participant.attended ? 'Verified' : 'Pending Verification'}
                      >
                        {participant.attended && <i className="bi bi-check" style={{ color: '#fff', fontSize: '15px', lineHeight: 1, fontWeight: 'bold' }} />}
                      </Box>
                    </Box>

                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2, color: '#1e293b', wordBreak: 'break-word', letterSpacing: '-0.01em' }}>
                        {participant.name}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>
                          {participant.roll || 'N/A'}
                        </Typography>
                        <Box sx={{ width: '4px', height: '4px', borderRadius: '50%', bgcolor: '#cbd5e1' }} />
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={participant.college === 'Other College' && participant.otherCollege ? participant.otherCollege : participant.college}>
                          {participant.college === 'Other College' && participant.otherCollege ? participant.otherCollege : (participant.college || 'N/A')}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      mt: 'auto',
                      p: 2.5,
                      borderRadius: '16px',
                      background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Decorative element */}
                    <Box sx={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))', filter: 'blur(10px)' }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#3b82f6', letterSpacing: '1px', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                          Event Registered
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5, fontSize: '0.95rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {participant.eventName}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Hidden PDF Container */}
          {(() => {
            const pages = [];
            for (let i = 0; i < filteredParticipants.length; i += 8) {
              pages.push(filteredParticipants.slice(i, i + 8));
            }

            return (
              <Box
                id="pdf-passes-container"
                sx={{
                  display: 'none',
                  backgroundColor: '#fff',
                }}
              >
                {pages.map((page, pageIndex) => (
                  <React.Fragment key={`page-${pageIndex}`}>
                    {pageIndex > 0 && <div className="html2pdf__page-break" style={{ height: 0 }}></div>}
                    <Box
                      sx={{
                        width: '210mm',
                        height: '295mm', // Slightly under 297mm to prevent double page breaks
                        boxSizing: 'border-box',
                        padding: '10mm 5mm', // Padding around the page
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignContent: 'flex-start',
                      }}
                    >
                      {page.map((participant, index) => (
                        <Box
                          key={`pdf-${participant.id}`}
                          sx={{
                            width: '50%',
                            height: '68.75mm', // (295 - 20 padding) / 4 rows
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            boxSizing: 'border-box',
                            borderBottom: 'none',
                            borderRight: index % 2 === 0 ? '1.5px dashed #94a3b8' : 'none',
                          }}
                        >
                          {/* Horizontal Cut Line */}
                          {Math.floor(index / 2) < 3 && (
                            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderBottom: '1.5px dashed #94a3b8', zIndex: 0 }} />
                          )}

                          <Box
                            sx={{
                              width: '367px',
                              height: '240px',
                              position: 'relative',
                            }}
                          >
                            <Box
                              sx={{
                                transform: 'scale(0.5)',
                                transformOrigin: 'top left',
                                width: '734px',
                                height: '480px',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                              }}
                            >
                              <EventPassCard participant={participant} isPdf={true} />
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </React.Fragment>
                ))}
              </Box>
            );
          })()}

          {filteredParticipants.length === 0 && !loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, animation: `${fadeUp} 0.5s ease-out forwards` }}>
              <Box sx={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <i className="bi bi-search" style={{ fontSize: '32px', color: '#3b82f6' }}></i>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                No passes found
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', textAlign: 'center', maxWidth: 400 }}>
                We couldn't find any passes matching your current search or filters. Try adjusting your criteria.
              </Typography>
            </Box>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default Passes;
