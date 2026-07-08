import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, Typography, Box, Rating, IconButton,
    RadioGroup, FormControlLabel, Radio, TextField
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import API from '../../api/axios';
import { toast } from 'sonner';

const GlobalFeedbackPrompt = () => {
    const [pendingTickets, setPendingTickets] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [feedback, setFeedback] = useState({
        rating: 0,
        satisfaction: '',
        comments: ''
    });

    useEffect(() => {
        fetchPendingFeedback();
    }, []);

    const fetchPendingFeedback = async () => {
        try {
            const res = await API.get('/api/service-desk/tickets/feedback/pending');
            if (res.data.success && res.data.data.length > 0) {
                setPendingTickets(res.data.data);
                setIsOpen(true);
            }
        } catch (error) {
            console.error('Failed to fetch pending feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleSubmit = async () => {
        const ticket = pendingTickets[currentIndex];
        if (!ticket) return;

        if (!feedback.rating || !feedback.satisfaction) {
            toast.error('Please provide a rating and satisfaction level');
            return;
        }

        try {
            setSubmitting(true);
            const res = await API.post(`/api/service-desk/tickets/${ticket._id}/feedback`, feedback);
            if (res.data.success) {
                toast.success('Feedback submitted successfully!');
                
                // Reset form
                setFeedback({ rating: 0, satisfaction: '', comments: '' });
                
                // Move to next ticket or close
                if (currentIndex < pendingTickets.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                } else {
                    setIsOpen(false);
                    setPendingTickets([]);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !isOpen || pendingTickets.length === 0) return null;

    const ticket = pendingTickets[currentIndex];

    return (
        <Dialog 
            open={isOpen} 
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    p: 1
                }
            }}
        >
            <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'var(--color-primary)', mb: 1 }}>
                        Share Your Feedback
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                        Ticket: <strong>{ticket.ticketNumber}</strong> - {ticket.title}
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    
                    {/* Rating Section */}
                    <Box>
                        <Typography sx={{ fontWeight: 600, mb: 1, color: 'var(--text-primary)' }}>
                            1. How would you rate your overall experience?
                        </Typography>
                        <Rating 
                            name="feedback-rating" 
                            value={feedback.rating} 
                            onChange={(e, newValue) => setFeedback({ ...feedback, rating: newValue })}
                            size="large"
                        />
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                            Click on a star to rate
                        </Typography>
                    </Box>

                    {/* Satisfaction Section */}
                    <Box>
                        <Typography sx={{ fontWeight: 600, mb: 2, color: 'var(--text-primary)' }}>
                            2. How satisfied are you with our service?
                        </Typography>
                        <RadioGroup 
                            value={feedback.satisfaction}
                            onChange={(e) => setFeedback({ ...feedback, satisfaction: e.target.value })}
                            sx={{ gap: 1.5 }}
                        >
                            {['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'].map(level => (
                                <Box 
                                    key={level}
                                    sx={{
                                        border: '1px solid',
                                        borderColor: feedback.satisfaction === level ? 'primary.main' : 'divider',
                                        borderRadius: '8px',
                                        px: 2,
                                        py: 0.5,
                                        transition: 'all 0.2s ease',
                                        bgcolor: feedback.satisfaction === level ? 'primary.50' : 'transparent',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: 'var(--bg-dashboard)'
                                        }
                                    }}
                                >
                                    <FormControlLabel 
                                        value={level} 
                                        control={<Radio size="small" />} 
                                        label={level}
                                        sx={{ width: '100%', m: 0 }}
                                    />
                                </Box>
                            ))}
                        </RadioGroup>
                    </Box>

                    {/* Comments Section */}
                    <Box>
                        <Typography sx={{ fontWeight: 600, mb: 1, color: 'var(--text-primary)' }}>
                            3. Additional Comments
                        </Typography>
                        <TextField 
                            fullWidth
                            multiline
                            rows={4}
                            placeholder="Write your comments here..."
                            value={feedback.comments}
                            onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px'
                                }
                            }}
                        />
                    </Box>
                </Box>
            </DialogContent>
            
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button 
                    variant="contained" 
                    fullWidth
                    onClick={handleSubmit}
                    disabled={submitting}
                    sx={{ 
                        py: 1.5, 
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 600
                    }}
                >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GlobalFeedbackPrompt;
