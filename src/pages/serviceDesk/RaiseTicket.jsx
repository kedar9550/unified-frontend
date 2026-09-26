import React, { useState, useEffect } from 'react';
import Loader from "../../components/common/Loader";
import {
    Box, Typography, TextField, Button, MenuItem, Select, FormControl,
    InputLabel, Paper, Chip, Grid, FormHelperText
} from '@mui/material';
import { UploadFile, Close as CloseIcon, Send as SendIcon, Apartment as ApartmentIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { PageContainer } from '../../components/common/design-system';
import API from '../../api/axios';
import { toast } from 'sonner';
import RichTextEditor from '../../components/common/RichTextEditor';

const RaiseTicket = () => {
    const [services, setServices] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [loadingBlocks, setLoadingBlocks] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        service: '',
        block: '',
        title: '',
        description: '',
        priority: 'MEDIUM',
    });
    const [attachments, setAttachments] = useState([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [svcRes, blkRes] = await Promise.all([
                    API.get('/api/service-desk/services'),
                    API.get('/api/service-desk/blocks?activeOnly=true')
                ]);
                if (svcRes.data.success) {
                    setServices(svcRes.data.data);
                }
                if (blkRes.data.success) {
                    setBlocks(blkRes.data.data);
                }
            } catch (error) {
                toast.error('Failed to load initial form data');
            } finally {
                setLoadingServices(false);
            }
        };
        fetchInitialData();
    }, []);

    const selectedService = services.find(s => s._id === formData.service);
    const requiresBlock = selectedService && selectedService.isGlobalService === false;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setAttachments((prev) => [...prev, ...newFiles]);
        }
    };

    const removeFile = (indexToRemove) => {
        setAttachments(attachments.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.service || !formData.title || !formData.description) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (requiresBlock && !formData.block) {
            toast.error('Please select the Block/Location for this service');
            return;
        }

        const data = new FormData();
        data.append('service', formData.service);
        if (formData.block) {
            data.append('block', formData.block);
        }
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('priority', formData.priority);
        
        attachments.forEach(file => {
            data.append('attachments', file);
        });

        try {
            setSubmitting(true);
            const res = await API.post('/api/service-desk/tickets', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (res.data.success) {
                toast.success('Ticket raised successfully');
                // Reset form
                setFormData({
                    service: '',
                    block: '',
                    title: '',
                    description: '',
                    priority: 'MEDIUM',
                });
                setAttachments([]);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to raise ticket');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageContainer>
            <PageHeader title="Raise a Ticket" subtitle="Submit a new request to the Service Desk" />
            
            <Box>
                <Paper sx={{ p: { xs: 2.5, sm: 3, md: 4 }, mb: { xs: 2.5, md: 0 }, borderRadius: '16px', background: 'var(--bg-panel)', boxShadow: 'var(--shadow-premium)', border: '1px solid var(--border-color)' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2.5, sm: 3 } }}>
                            
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: requiresBlock ? { xs: '1fr', md: '1fr 1fr 1fr' } : { xs: '1fr', md: '1fr 1fr' },
                                gap: { xs: 2.5, sm: 3 },
                                width: '100%'
                            }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Service Category</InputLabel>
                                    <Select
                                        name="service"
                                        value={formData.service}
                                        onChange={handleChange}
                                        label="Service Category"
                                        disabled={loadingServices}
                                    >
                                        {loadingServices ? (
                                            <MenuItem value="" disabled>Loading services...</MenuItem>
                                        ) : services.length === 0 ? (
                                            <MenuItem value="" disabled>No services available</MenuItem>
                                        ) : (
                                            services.map(s => (
                                                <MenuItem key={s._id} value={s._id}>
                                                    {s.name} {!s.isGlobalService ? '(Block Specific)' : ''}
                                                </MenuItem>
                                            ))
                                        )}
                                    </Select>
                                </FormControl>

                                {/* Conditional Block Selection for Non-Global Services */}
                                {requiresBlock && (
                                    <FormControl fullWidth required>
                                        <InputLabel>Block / Building</InputLabel>
                                        <Select
                                            name="block"
                                            value={formData.block}
                                            onChange={handleChange}
                                            label="Block / Building"
                                        >
                                            {blocks.length === 0 ? (
                                                <MenuItem value="" disabled>No active blocks found</MenuItem>
                                            ) : (
                                                blocks.map(b => (
                                                    <MenuItem key={b._id} value={b._id}>
                                                        {b.blockName} ({b.blockCode})
                                                    </MenuItem>
                                                ))
                                            )}
                                        </Select>
                                        <FormHelperText>This service is block-managed. Select your building.</FormHelperText>
                                    </FormControl>
                                )}

                                <FormControl fullWidth>
                                    <InputLabel>Priority (Optional)</InputLabel>
                                    <Select
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                        label="Priority (Optional)"
                                    >
                                        <MenuItem value="LOW">Low</MenuItem>
                                        <MenuItem value="MEDIUM">Medium</MenuItem>
                                        <MenuItem value="HIGH">High</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            <TextField
                                label="Title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                fullWidth
                                placeholder="Brief summary of your request"
                            />

                            <Box sx={{ mb: { xs: 2, sm: 6 } }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                                    Description *
                                </Typography>
                                <RichTextEditor 
                                    placeholder="Detailed explanation of the issue or request..."
                                    value={formData.description} 
                                    onChange={(value) => setFormData(prev => ({ ...prev, description: value }))} 
                                />
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', sm: 'flex-start' }, textAlign: { xs: 'center', sm: 'left' } }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                                    Attachments
                                </Typography>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<UploadFile />}
                                    sx={{ mb: 2, borderRadius: '20px' }}
                                >
                                    Select Files
                                    <input
                                        type="file"
                                        multiple
                                        hidden
                                        onChange={handleFileChange}
                                    />
                                </Button>

                                {attachments.length > 0 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 1 }}>
                                        {attachments.map((file, index) => (
                                            <Chip
                                                key={index}
                                                label={file.name}
                                                onDelete={() => removeFile(index)}
                                                deleteIcon={<CloseIcon />}
                                                variant="outlined"
                                            />
                                        ))}
                                    </Box>
                                )}
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 1, sm: 2 } }}>
                                <Button
                                    onClick={handleSubmit}
                                    variant="contained"
                                    disabled={submitting}
                                    startIcon={submitting ? <Loader size={20} color="inherit" /> : <SendIcon />}
                                    sx={{ 
                                        width: { xs: '100%', sm: 'auto' },
                                        px: 4, 
                                        py: 1.5, 
                                        background: "var(--gradient-primary)",
                                        color: '#fff',
                                        textTransform: "none",
                                        fontWeight: 600,
                                        borderRadius: '8px',
                                        boxShadow: 'none',
                                        '&:hover': {
                                            boxShadow: 'none'
                                        }
                                    }}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                                </Button>
                            </Box>

                        </Box>
                </Paper>
            </Box>
        </PageContainer>
    );
};

export default RaiseTicket;
