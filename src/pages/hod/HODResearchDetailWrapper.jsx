import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Detail Components
import TextBookDetailPage from './TextBookDetailPage';
// import JournalDetailPage from './JournalDetailPage';
// ... other detail components

const HODResearchDetailWrapper = () => {
    const { type, id } = useParams();
    const navigate = useNavigate();

    const goBack = () => {
        navigate('/hod/research-approvals'); // Adjust this route if needed
    };

    const renderDetailComponent = () => {
        switch (type.toLowerCase()) {
            case 'textbook':
                return <TextBookDetailPage id={id} onBack={goBack} />;
            case 'journal':
                return (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h5" color="textSecondary">Journal Details Coming Soon</Typography>
                    </Box>
                );
            // Add other cases here
            default:
                return (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h5" color="textSecondary">Details view not implemented for {type}</Typography>
                    </Box>
                );
        }
    };

    return (
        <Box sx={{ width: '100%', p: { xs: 1.5, sm: 2, md: 3 } }}>
            {renderDetailComponent()}
        </Box>
    );
};

export default HODResearchDetailWrapper;
