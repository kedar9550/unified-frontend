import React, { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, Button, MenuItem, Select, FormControl,
    InputLabel, Paper, CircularProgress, Chip
} from '@mui/material';
import { UploadFile, Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import API from '../../api/axios';
import { toast } from 'sonner';
import RichTextEditor from '../../components/common/RichTextEditor';


const RaiseTicket = () => {
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        service: '',
        title: '',
        description: '',
        priority: 'MEDIUM',
    });
    const [attachments, setAttachments] = useState([]);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await API.get('/api/service-desk/services');
                if (res.data.success) {
                    setServices(res.data.data);
                }
            } catch (error) {
                toast.error('Failed to load services');
            } finally {
                setLoadingServices(false);
            }
        };
        fetchServices();
    }, []);

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

        const data = new FormData();
        data.append('service', formData.service);
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
        <Box>
            <PageHeader title="Raise a Ticket" subtitle="Submit a new request to the Service Desk" />
            
            <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
                <Paper sx={{ p: 4, borderRadius: '16px', background: 'var(--bg-panel)', boxShadow: 'var(--shadow-premium)' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            
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
                                            <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>

                            <TextField
                                label="Title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                fullWidth
                                placeholder="Brief summary of your request"
                            />

                            <Box sx={{ mb: 6 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                                    Description *
                                </Typography>
                                <RichTextEditor 
                                    placeholder="Detailed explanation of the issue or request..."
                                    value={formData.description} 
                                    onChange={(value) => setFormData(prev => ({ ...prev, description: value }))} 
                                />
                            </Box>

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

                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                                    Attachments
                                </Typography>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<UploadFile />}
                                    sx={{ mb: 2 }}
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
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Button
                                    onClick={handleSubmit}
                                    variant="contained"
                                    disabled={submitting}
                                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                    sx={{ 
                                        px: 4, 
                                        py: 1.5, 
                                        background: "var(--gradient-primary)",
                                        textTransform: "none",
                                        fontWeight: 600,
                                        borderRadius: '8px'
                                    }}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                                </Button>
                            </Box>

                        </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default RaiseTicket;
