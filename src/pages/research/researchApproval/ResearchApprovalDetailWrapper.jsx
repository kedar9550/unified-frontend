import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

// Detail Components
import TextBookApprovalDetail from './TextBookApprovalDetail';
import BookChapterApprovalDetail from './BookChapterApprovalDetail';
import JournalApprovalDetail from './JournalApprovalDetail';
import PatentApprovalDetail from './PatentApprovalDetail';
import FundedProjectApprovalDetail from './FundedProjectApprovalDetail';
import ConsultancyApprovalDetail from './ConsultancyApprovalDetail';

const ResearchApprovalDetailWrapper = ({ role }) => {
    const { type, id } = useParams();
    const navigate = useNavigate();

    const isHOD = !role || role === 'HOD';
    const isDean = role === 'RESEARCH_DEAN';
    const isCoordinator = role === 'RESEARCH_COORDINATOR';

    const goBack = () => {
        const backPath = isHOD ? '/hod/research-approvals' : 
                        isDean ? '/research-dean/approvals' : 
                        '/research-coordinator/approvals';
        navigate(backPath);
    };

    const renderDetailComponent = () => {
        switch (type.toLowerCase()) {
            case 'textbook':
                return <TextBookApprovalDetail id={id} onBack={goBack} role={role} />;
            case 'bookchapter':
                return <BookChapterApprovalDetail id={id} onBack={goBack} role={role} />;
            case 'journal':
                return <JournalApprovalDetail id={id} onBack={goBack} role={role} />;
            case 'patent':
                return <PatentApprovalDetail id={id} onBack={goBack} role={role} />;
            case 'fundedproject':
                return <FundedProjectApprovalDetail id={id} onBack={goBack} role={role} />;
            case 'consultancy':
                return <ConsultancyApprovalDetail id={id} onBack={goBack} role={role} />;
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

export default ResearchApprovalDetailWrapper;
