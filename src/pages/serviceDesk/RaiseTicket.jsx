import React, { useState, useEffect } from 'react';
import Loader from "../../components/common/Loader";
import {
    Box, Typography, TextField, Button, MenuItem, Select, FormControl,
    InputLabel, Paper, Chip, Grid, FormHelperText
} from '@mui/material';
import { UploadFile, Close as CloseIcon, Send as SendIcon, Apartment as ApartmentIcon, Hotel as HotelIcon } from '@mui/icons-material';
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
        subcategory: '',
        customSubcategory: '',
        title: '',
        description: '',
        priority: '',
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
        const { name, value } = e.target;
        if (name === 'service') {
            setFormData(prev => ({
                ...prev,
                service: value,
                subcategory: '',
                customSubcategory: '',
                block: ''
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
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
        if (!formData.service || !formData.subcategory || !formData.description || !formData.priority) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.subcategory === 'Others' && !formData.customSubcategory.trim()) {
            toast.error('Please specify your issue details for "Others"');
            return;
        }

        if (requiresBlock && !formData.block) {
            toast.error('Please select the Block/Location for this service');
            return;
        }

        const effectiveTitle = formData.subcategory === 'Others'
            ? formData.customSubcategory.trim()
            : formData.subcategory;

        const data = new FormData();
        data.append('service', formData.service);
        if (formData.block) {
            data.append('block', formData.block);
        }
        data.append('subcategory', formData.subcategory);
        if (formData.customSubcategory) {
            data.append('customSubcategory', formData.customSubcategory.trim());
        }
        data.append('title', effectiveTitle);
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
                    subcategory: '',
                    customSubcategory: '',
                    title: '',
                    description: '',
                    priority: '',
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
                                                    {s.name}
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
                                            renderValue={(selected) => {
                                                const b = blocks.find(x => x._id === selected);
                                                if (!b) return '';
                                                if (b.blockType === 'HOSTEL') {
                                                    const tag = b.genderTag === 'GIRLS' ? 'Girls Hostel' : 'Boys Hostel';
                                                    return `${b.blockName} (${tag}) (${b.blockCode})`;
                                                }
                                                return `${b.blockName} (${b.blockCode})`;
                                            }}
                                        >
                                            {(() => {
                                                const filteredBlocks = blocks.filter(b => {
                                                    if (!selectedService) return true;
                                                    if (selectedService.applicableBlockType === 'HOSTEL') return b.blockType === 'HOSTEL';
                                                    if (selectedService.applicableBlockType === 'ACADEMIC') return (b.blockType || 'ACADEMIC') === 'ACADEMIC';
                                                    return true;
                                                });
                                                if (filteredBlocks.length === 0) {
                                                    return <MenuItem value="" disabled>No active {selectedService?.applicableBlockType === 'HOSTEL' ? 'hostel' : 'academic'} blocks found</MenuItem>;
                                                }
                                                return filteredBlocks.map(b => (
                                                    <MenuItem key={b._id} value={b._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            {b.blockType === 'HOSTEL' ? (
                                                                <HotelIcon fontSize="small" sx={{ color: b.genderTag === 'GIRLS' ? '#db2777' : '#0284c7' }} />
                                                            ) : (
                                                                <ApartmentIcon fontSize="small" sx={{ color: '#2563eb' }} />
                                                            )}
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                {b.blockName} ({b.blockCode})
                                                            </Typography>
                                                        </Box>
                                                        {b.blockType === 'HOSTEL' ? (
                                                            <Chip
                                                                label={b.genderTag === 'GIRLS' ? 'Girls Hostel' : 'Boys Hostel'}
                                                                size="small"
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: 600,
                                                                    bgcolor: b.genderTag === 'GIRLS' ? 'rgba(219, 39, 119, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                                                                    color: b.genderTag === 'GIRLS' ? '#db2777' : '#0284c7',
                                                                }}
                                                            />
                                                        ) : (
                                                            <Chip
                                                                label="Academic"
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                                                            />
                                                        )}
                                                    </MenuItem>
                                                ));
                                            })()}
                                        </Select>
                                        <FormHelperText>
                                            {selectedService?.applicableBlockType === 'HOSTEL'
                                                ? "Select your hostel block location"
                                                : selectedService?.applicableBlockType === 'ACADEMIC'
                                                    ? "Select your academic building location"
                                                    : "Select your campus building or hostel location"}
                                        </FormHelperText>
                                    </FormControl>
                                )}

                                <FormControl fullWidth required>
                                    <InputLabel>Priority</InputLabel>
                                    <Select
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                        label="Priority"
                                    >
                                        <MenuItem value="" disabled>
                                            <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Select Priority</Typography>
                                        </MenuItem>
                                        <MenuItem value="CRITICAL">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                <Typography sx={{ fontWeight: 600, color: '#dc2626' }}>Critical</Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>(2 Hours SLA)</Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="HIGH">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                <Typography sx={{ fontWeight: 600, color: '#ea580c' }}>High</Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>(4 Hours SLA)</Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="MEDIUM">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                <Typography sx={{ fontWeight: 600, color: '#2563eb' }}>Medium</Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>(24 Hours SLA)</Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="LOW">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                <Typography sx={{ fontWeight: 600, color: '#475569' }}>Low</Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>(72 Hours SLA)</Typography>
                                            </Box>
                                        </MenuItem>
                                    </Select>
                                    <FormHelperText>Expected resolution window based on priority.</FormHelperText>
                                </FormControl>
                            </Box>

                            {/* Subcategory Selection */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: formData.subcategory === 'Others' ? { xs: '1fr', md: '1fr 1fr' } : '1fr', gap: { xs: 2.5, sm: 3 } }}>
                                <FormControl fullWidth required disabled={!formData.service}>
                                    <InputLabel>Subcategory (Issue Type)</InputLabel>
                                    <Select
                                        name="subcategory"
                                        value={formData.subcategory}
                                        onChange={handleChange}
                                        label="Subcategory (Issue Type)"
                                    >
                                        <MenuItem value="" disabled>
                                            <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                                {!formData.service ? 'First select a service category' : 'Select Subcategory'}
                                            </Typography>
                                        </MenuItem>
                                        {(selectedService?.subcategories || []).map((sc, i) => (
                                            <MenuItem key={i} value={sc}>
                                                {sc}
                                            </MenuItem>
                                        ))}
                                        <MenuItem value="Others" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                            Others (Specify issue below)
                                        </MenuItem>
                                    </Select>
                                    <FormHelperText>
                                        {!formData.service ? 'Choose a service category first' : 'Select the specific problem type or choose Others'}
                                    </FormHelperText>
                                </FormControl>

                                {formData.subcategory === 'Others' && (
                                    <TextField
                                        label="Specify Issue Details"
                                        name="customSubcategory"
                                        value={formData.customSubcategory}
                                        onChange={handleChange}
                                        required
                                        fullWidth
                                        placeholder="e.g. Switchboard sparking / Custom issue"
                                        helperText="Please provide a brief title/summary of your specific issue"
                                    />
                                )}
                            </Box>

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
