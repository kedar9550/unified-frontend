import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { Card, CardContent, Chip } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
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
          venue: eventMatch ? eventMatch.venue : null
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
    <Box sx={{ p: 3 }}>
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
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadPdf}
                disabled={loading || filteredParticipants.length === 0}
              >
                Download PDF
              </Button>
            </Box>
          }
        />

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <TextField
            label="Search Participants"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 300, bgcolor: 'background.paper' }}
          />

          <TextField
            select
            label="Filter by Event"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 200, bgcolor: 'background.paper' }}
          >
            <MenuItem value="ALL">All Events</MenuItem>
            {uniqueEvents.map((event) => (
              <MenuItem key={event} value={event}>
                {event}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      {/* Content Area */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" p={4} className="no-print">
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
              <Card key={participant.id} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5, p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                      {participant.name}
                    </Typography>
                    <Chip 
                      label={participant.attended ? 'Verified' : 'Not Verified'} 
                      color={participant.attended ? 'success' : 'default'}
                      variant={participant.attended ? 'filled' : 'outlined'}
                      size="small" 
                      sx={{ fontWeight: 600, fontSize: '0.7rem', height: '24px' }} 
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {participant.roll || 'N/A'} • {participant.college || 'N/A'}
                  </Typography>
                  <Box sx={{ mt: 'auto', p: 1.5, bgcolor: 'rgba(59, 130, 246, 0.08)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#3b82f6', letterSpacing: '0.5px' }}>
                      EVENT
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--text-primary)', mt: 0.5 }}>
                      {participant.eventName}
                    </Typography>
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
                            <Box sx={{ position: 'absolute', bottom: '-15px', left: 0, right: 0, borderBottom: '1.5px dashed #94a3b8', zIndex: 0 }} />
                          )}
                          {/* Horizontal Cut Mark (Scissor) */}
                          {Math.floor(index / 2) < 3 && (
                            <Box sx={{ position: 'absolute', bottom: '-15px', left: '50%', transform: 'translate(-50%, 50%)', color: '#94a3b8', fontSize: '14px', backgroundColor: '#fff', px: 1, zIndex: 1, lineHeight: 1 }}>
                              ✂
                            </Box>
                          )}
                          {/* Vertical Cut Mark (Scissor) */}
                          {index % 2 === 0 && (
                            <Box sx={{ position: 'absolute', right: '-8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px', backgroundColor: '#fff', py: 1, zIndex: 1 }}>
                              ✂
                            </Box>
                          )}

                          <Box
                            sx={{
                              width: '315px',
                              height: '205px', // Scaled space wrapper
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Box
                              sx={{
                                transform: 'scale(0.45)',
                                transformOrigin: 'center center',
                                width: '700px',
                                height: '450px',
                              }}
                            >
                              <EventPassCard participant={participant} />
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
    </Box>
  );
};

export default Passes;
