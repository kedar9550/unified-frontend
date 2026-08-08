import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import axios from '../../api/axios';
import { toast } from 'sonner';

const SendMail = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSend = async () => {
        if (!email) {
            setError('Please enter an email address');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setError(null);
        setSuccess(false);
        setLoading(true);

        try {
            const response = await axios.post('/api/events/send-invoice', { email });
            if (response.data.success) {
                setSuccess(true);
                toast.success('Invoice sent successfully!');
                setEmail('');
            } else {
                setError(response.data.message || 'Failed to send invoice');
                toast.error(response.data.message || 'Failed to send invoice');
            }
        } catch (err) {
            const errMessage = err.response?.data?.message || 'Failed to send invoice email';
            setError(errMessage);
            toast.error(errMessage);
            console.error('Error sending mail:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SendIcon /> Send Event Invoice
                </Typography>
                
                <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                    Enter an email address below to send the test invoice template. The invoice will be sent via the system's email service.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 3 }}>Invoice sent successfully to the provided email address.</Alert>}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        fullWidth
                        label="Email Address"
                        variant="outlined"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError(null);
                            setSuccess(false);
                        }}
                        placeholder="e.g., student@example.com"
                        type="email"
                        disabled={loading}
                    />

                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleSend}
                        disabled={loading || !email}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        sx={{ py: 1.5, fontSize: '1.1rem' }}
                    >
                        {loading ? 'Sending...' : 'Send Invoice'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default SendMail;
