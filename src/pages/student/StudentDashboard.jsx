import React, { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogTitle, DialogContent, IconButton, Typography, Card, CardContent } from '@mui/material';
import { Badge as BadgeIcon, Close as CloseIcon, Visibility as ViewIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import EventPassCard from '../../components/EventPass/EventPassCard';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [passDialogOpen, setPassDialogOpen] = useState(false);
  const [selectedPassParticipant, setSelectedPassParticipant] = useState(null);
  const [passesListDialogOpen, setPassesListDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyPasses();
    }
  }, [user]);

  const fetchMyPasses = async () => {
    setLoading(true);
    try {
      const roll = user?.rollNo || user?.roll || user?.username || '';
      const email = user?.email || '';
      
      const [eventsRes, response] = await Promise.all([
        API.get('/api/events').catch(() => ({ data: { events: [] } })),
        API.get(`/api/razorpay/registrations?roll=${roll}&email=${email}`)
      ]);

      const allEvents = eventsRes.data?.events || [];
      let fetchedPayments = response.data?.payments || [];

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
          ) : null,
          eventGroup: eventMatch?.group?.name || eventMatch?.group || '-',
          eventCategory: eventMatch?.category?.name || eventMatch?.category || p.category || '-'
        };
      });

      setPayments(fetchedPayments);
    } catch (error) {
      console.error('Error fetching passes:', error);
      toast.error('Failed to load your event passes');
    } finally {
      setLoading(false);
    }
  };

  // Flatten all participants across payment registrations that match the current student
  const myParticipants = React.useMemo(() => {
    const list = [];
    const userRoll = (user?.rollNo || user?.roll || user?.username || '').toLowerCase();
    const userEmail = (user?.email || '').toLowerCase();
    
    payments.forEach((payment) => {
      if (Array.isArray(payment.participants)) {
        payment.participants.forEach((participant, pIdx) => {
          const pRoll = (participant.roll || '').toLowerCase();
          const pEmail = (participant.email || '').toLowerCase();
          
          if ((userRoll && pRoll === userRoll) || (userEmail && pEmail === userEmail)) {
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
              eventGroup: payment.eventGroup || '-',
              eventCategory: payment.eventCategory || '-',
              teamId: payment.teamId,
            });
          }
        });
      }
    });
    return list;
  }, [payments, user]);

  const handleOpenPass = (participant) => {
    setSelectedPassParticipant(participant);
    setPassDialogOpen(true);
    setPassesListDialogOpen(false);
  };

  const handleViewPassesClick = () => {
    if (myParticipants.length === 1) {
      handleOpenPass(myParticipants[0]);
    } else {
      setPassesListDialogOpen(true);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3, lg: 4 } }}>
      <PageHeader 
        title="Student Portal" 
        subtitle="Welcome to your academic dashboard." 
        showLogo={false} 
        showBack={false}
      />

      <Box sx={{ mt: 4 }}>
        {loading ? (
          <CircularProgress size={24} />
        ) : myParticipants.length > 0 ? (
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<BadgeIcon />}
            onClick={handleViewPassesClick}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, py: 1, px: 3, boxShadow: 'none' }}
          >
            View My Event {myParticipants.length > 1 ? 'Passes' : 'Pass'}
          </Button>
        ) : (
          <Typography color="text.secondary">You have not registered for any events yet.</Typography>
        )}
      </Box>

      {/* Passes List Modal (if multiple) */}
      <Dialog
        open={passesListDialogOpen}
        onClose={() => setPassesListDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', py: 2, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BadgeIcon sx={{ color: '#38bdf8' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>My Event Passes</Typography>
          </Box>
          <IconButton onClick={() => setPassesListDialogOpen(false)} sx={{ color: '#cbd5e1', '&:hover': { color: '#fff' } }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, background: '#f8fafc' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {myParticipants.map((p) => (
              <Card key={p.id} variant="outlined" sx={{ borderRadius: '12px' }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{p.eventName}</Typography>
                    <Typography variant="body2" color="text.secondary">Receipt: {p.receipt}</Typography>
                  </Box>
                  <Button variant="outlined" size="small" startIcon={<ViewIcon />} onClick={() => handleOpenPass(p)} sx={{ borderRadius: '8px' }}>
                    View Pass
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Pass Preview Modal */}
      {selectedPassParticipant && (
        <Dialog
          open={passDialogOpen}
          onClose={() => setPassDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}
        >
          <DialogTitle sx={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', py: 2, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BadgeIcon sx={{ color: '#38bdf8' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>Event Pass</Typography>
            </Box>
            <IconButton onClick={() => setPassDialogOpen(false)} sx={{ color: '#cbd5e1', '&:hover': { color: '#fff' } }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 4, background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <EventPassCard participant={selectedPassParticipant} />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default StudentDashboard;
