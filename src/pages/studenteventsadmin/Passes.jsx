import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  MenuItem,
  TextField,
  Paper,
} from '@mui/material';
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
              ? `${eventMatch.roomNo ? `Room No: ${eventMatch.roomNo}, ` : ''}${eventMatch.building.name || eventMatch.building} - ${eventMatch.floor.name || eventMatch.floor}`
              : eventMatch.venueType === 'Outdoor' && eventMatch.ground
                ? `${eventMatch.roomNo ? `Room No: ${eventMatch.roomNo}, ` : ''}${eventMatch.ground.name || eventMatch.ground}`
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

        {/* Filters Bar */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 3,
            borderRadius: '16px',
            background: 'var(--bg-paper)',
            borderColor: 'var(--border-color)',
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            alignItems: 'center',
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
              gap: 3,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
            }}
            className="no-print"
          >
            {filteredParticipants.map((participant) => (
              <Card
                key={participant.id}
                sx={{
                  position: 'relative',
                  borderRadius: '20px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  overflow: 'hidden',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
                  },
                  border: '1px solid rgba(0,0,0,0.05)',
                  backgroundColor: '#ffffff'
                }}
              >
                {/* Top Accent Bar */}
                <Box sx={{ height: '6px', width: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />

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
                          bottom: -2,
                          right: -2,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          bgcolor: participant.attended ? '#10b981' : '#f59e0b',
                          border: '3px solid #fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title={participant.attended ? 'Verified' : 'Pending Verification'}
                      >
                        {participant.attended && <i className="bi bi-check" style={{ color: '#fff', fontSize: '14px', lineHeight: 1 }} />}
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
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={participant.college}>
                          {participant.college || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      mt: 'auto',
                      p: 2,
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', letterSpacing: '0.8px', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                          Event
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.2, fontSize: '0.95rem' }}>
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
            <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 4 }}>
              No passes found. Adjust filters to see results.
            </Typography>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default Passes;
