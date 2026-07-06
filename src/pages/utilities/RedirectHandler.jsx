import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import { Box, Typography } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

const RedirectHandler = () => {
    const { shortCode } = useParams();
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUrl = async () => {
            try {
                // Request JSON so backend returns the URL instead of doing a 302 redirect
                const response = await axios.get(`/api/utilities/r/${shortCode}`, {
                    headers: { 'Accept': 'application/json' }
                });
                
                if (response.data?.success && response.data?.longUrl) {
                    window.location.replace(response.data.longUrl);
                } else {
                    setError('Invalid or expired link');
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Invalid, inactive or expired link');
            }
        };
        
        if (shortCode) {
            fetchUrl();
        }
    }, [shortCode]);

    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', backgroundColor: '#f8fafc', p: 3, textAlign: 'center' }}>
                <ErrorOutline sx={{ fontSize: 64, color: '#ef4444', mb: 2 }} />
                <Typography variant="h5" sx={{ color: '#0f172a', fontWeight: 'bold', mb: 1 }}>
                    Link Unavailable
                </Typography>
                <Typography sx={{ color: '#64748b', maxWidth: '400px' }}>
                    {error}. The link you are trying to access might have been deleted, deactivated, or expired.
                </Typography>
            </Box>
        );
    }

    return <Loader fullScreen />;
};

export default RedirectHandler;
