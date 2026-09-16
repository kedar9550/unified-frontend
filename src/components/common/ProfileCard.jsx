import React from 'react';
import { Box, Card, Typography, Avatar, IconButton, Button, Divider, Chip, Grid } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import PhoneIcon from '@mui/icons-material/Phone';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const ProfileCard = ({
    name = "Dr. Maganti Venkatesh",
    role = "School Coordinator",
    employeeId = "4891",
    phone = "9059735168",
    photoUrl,
    avatarComponent,
    labels = [],
    onActionClick,
    onOptionsClick
}) => {
    return (
        <Card
            elevation={0}
            sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '24px',
                p: 3,
                position: 'relative',
                boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'var(--border-color)',
                bgcolor: 'var(--bg-paper)'
            }}
        >

            {/* Avatar Section */}
            <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', mt: -1, mb: 2 }}>
                <Box sx={{
                    p: '3px',
                    borderRadius: '50%',
                    background: 'var(--gradient-primary)',
                    boxShadow: '0 8px 24px rgba(1, 60, 110, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {avatarComponent || (
                        <Avatar
                            src={photoUrl}
                            alt={name}
                            sx={{
                                width: 110,
                                height: 110,
                                border: '2px solid #fff',
                                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)'
                            }}
                        />
                    )}
                </Box>
            </Box>

            {/* Profile Info */}
            <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'var(--text-primary)', mb: 0.5, fontSize: '1.3rem', textTransform: 'capitalize' }}>
                    {name?.toLowerCase()}
                </Typography>
                <Chip
                    label={role}
                    size="small"
                    sx={{
                        background: 'var(--gradient-primary)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        letterSpacing: 0.5,
                        borderRadius: '6px',
                        mb: 1.5,
                        height: 'auto',
                        py: 0.5,
                        px: 1
                    }}
                />
            </Box>

            {/* Details Box */}
            <Box sx={{
                position: 'relative',
                zIndex: 1,
                bgcolor: 'var(--bg-panel)',
                border: '1px solid',
                borderColor: 'var(--border-color)',
                borderRadius: '16px',
                p: 2,
                px: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3
            }}>
                {/* Left Side: Employee ID */}
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <PersonOutlinedIcon sx={{ color: '#ffffff', fontSize: '1.4rem' }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: 0.5 }}>
                            Employee ID
                        </Typography>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {employeeId}
                        </Typography>
                    </Box>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: 'var(--border-color)' }} />

                {/* Right Side: Phone Number */}
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, pl: 1 }}>
                    <Box sx={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <PhoneIcon sx={{ color: '#ffffff', fontSize: '1.3rem' }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: 0.5 }}>
                            Phone Number
                        </Typography>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {phone}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Labels / Tags */}
            {labels && labels.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 'auto' }}>
                    {labels.map((l, i) => (
                        <Chip
                            key={i}
                            label={l?.toLowerCase()}
                            size="small"
                            sx={{
                                fontWeight: 800,
                                bgcolor: 'var(--bg-panel)',
                                color: 'var(--gradient-primary)',
                                borderRadius: '100px',
                                px: 0.5,
                                py: 0.5,
                                height: 'auto',
                                maxWidth: '100%',
                                textTransform: 'capitalize',
                                '& .MuiChip-label': {
                                    display: 'block',
                                    whiteSpace: 'normal',
                                    textAlign: 'center'
                                }
                            }}
                        />
                    ))}
                </Box>
            )}

            </Card>
    );
};

export default ProfileCard;
