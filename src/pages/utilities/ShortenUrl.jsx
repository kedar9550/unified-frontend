import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, InputAdornment, Tooltip, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { Add, ContentCopy, OpenInNew, Link as LinkIcon, Block, CheckCircle, Delete } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import axios from '../../api/axios';
import { toast } from 'sonner';

const ShortenUrl = () => {
    const [links, setLinks] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [longUrl, setLongUrl] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [linkType, setLinkType] = useState('random');
    const [customSlug, setCustomSlug] = useState('');

    const fetchLinks = async () => {
        try {
            const res = await axios.get('/api/utilities/my-links');
            // Filter only short urls
            const shortUrls = res.data.data.filter(item => item.type === 'short_url');
            setLinks(shortUrls);
        } catch (error) {
            toast.error('Failed to fetch links');
        }
    };

    useEffect(() => {
        fetchLinks();
    }, []);

    const handleCreate = async () => {
        if (!longUrl) {
            toast.error('Destination URL is required');
            return;
        }
        if (linkType === 'custom') {
            if (!customSlug) {
                toast.error('Custom alias is required');
                return;
            }
            if (!/^[a-zA-Z0-9-]+$/.test(customSlug)) {
                toast.error('Custom link can only contain letters, numbers, and hyphens');
                return;
            }
        }

        try {
            await axios.post('/api/utilities/shorten-url', {
                longUrl,
                expiresAt: expiresAt || null,
                ...(linkType === 'custom' && { customSlug })
            });
            toast.success('Short link created successfully');
            setOpenModal(false);
            setLongUrl('');
            setExpiresAt('');
            setLinkType('random');
            setCustomSlug('');
            fetchLinks();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create short link');
        }
    };

    const handleCopy = (shortCode) => {
        const url = `${window.location.origin}/r/${shortCode}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await axios.put(`/api/utilities/${id}/status`);
            toast.success(`Short URL ${currentStatus ? 'deactivated' : 'activated'} successfully`);
            fetchLinks();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this Short URL?')) return;
        try {
            await axios.delete(`/api/utilities/${id}/soft-delete`);
            toast.success('Short URL deleted successfully');
            fetchLinks();
        } catch (error) {
            toast.error('Failed to delete Short URL');
        }
    };



    return (
        <Box>
            <PageHeader title="Short URLs" subtitle="Create and manage your shortened URLs" />
            
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, mt: 3, px: 3 }}>
                <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>
                    My Short URLs
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenModal(true)}
                    sx={{ background: "var(--gradient-primary)", px: 3, fontWeight: 700, textTransform: "none", "&:hover": { opacity: 0.9, transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }, transition: "all 0.2s ease" }}
                >
                    Create New
                </Button>
            </Box>

            <Box sx={{ px: 3, pb: 3 }}>
                <DataTable 
                    columns={["S.No", "Original URL", "Short Link", "Clicks", "Status", "Actions"]}
                    alignments={["center", "left", "left", "center", "center", "right"]}
                    nonSortableColumns={[0, 5]}
                    rows={links.map((link, index) => [
                        { value: index + 1, display: index + 1 },
                        {
                            value: link.longUrl,
                            display: (
                                <Box sx={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {link.longUrl}
                                </Box>
                            )
                        },
                        {
                            value: link.shortCode,
                            display: (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="#0b5299" sx={{ fontWeight: 600 }}>{link.shortCode}</Typography>
                                </Box>
                            )
                        },
                        { value: link.clicks, display: link.clicks },
                        {
                            value: link.isActive ? 'Active' : 'Inactive',
                            display: link.isActive ? (
                                <Typography sx={{ backgroundColor: '#e6f4ea', color: '#1e8e3e', fontSize: '0.75rem', fontWeight: 600, px: 1.5, py: 0.5, borderRadius: '4px', display: 'inline-block' }}>Active</Typography>
                            ) : (
                                <Typography sx={{ backgroundColor: '#fce8e6', color: '#d93025', fontSize: '0.75rem', fontWeight: 600, px: 1.5, py: 0.5, borderRadius: '4px', display: 'inline-block' }}>Inactive</Typography>
                            )
                        },
                        {
                            value: '',
                            display: (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Tooltip title="Copy Link">
                                        <IconButton onClick={() => handleCopy(link.shortCode)} size="small" color="primary">
                                            <ContentCopy fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Open Link">
                                        <IconButton 
                                            component="a" 
                                            href={`${window.location.origin}/r/${link.shortCode}`}
                                            target="_blank"
                                            size="small" 
                                            color="secondary"
                                        >
                                            <OpenInNew fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={link.isActive ? 'Deactivate' : 'Activate'}>
                                        <IconButton onClick={() => handleToggleStatus(link._id, link.isActive)} size="small" sx={{ color: link.isActive ? '#eab308' : '#10b981' }}>
                                            {link.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton onClick={() => handleDelete(link._id)} size="small" sx={{ color: '#ef4444' }}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            )
                        }
                    ])}
                />
            </Box>

            {/* Create Modal */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1, color: '#0D233B', fontWeight: 'bold' }}>
                    <LinkIcon sx={{ color: '#0b5299' }} /> Create New Short Link
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box>
                            <Typography variant="body2" color="textSecondary" mb={0.5}>Destination URL</Typography>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="https://example.com/very-long-url"
                                value={longUrl}
                                onChange={(e) => setLongUrl(e.target.value)}
                                size="small"
                            />
                        </Box>

                        <Box>
                            <Typography variant="body2" color="textSecondary" mb={1}>Link Generation Method</Typography>
                            <ToggleButtonGroup
                                color="primary"
                                value={linkType}
                                exclusive
                                onChange={(e, newType) => {
                                    if (newType) setLinkType(newType);
                                }}
                                fullWidth
                                size="small"
                            >
                                <ToggleButton value="random" sx={{ textTransform: 'none', fontWeight: 600 }}>Random Link</ToggleButton>
                                <ToggleButton value="custom" sx={{ textTransform: 'none', fontWeight: 600 }}>Custom Alias</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        {linkType === 'custom' && (
                            <Box>
                                <Typography variant="body2" color="textSecondary" mb={0.5}>Custom Alias</Typography>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="e.g. my-custom-event"
                                    value={customSlug}
                                    onChange={(e) => setCustomSlug(e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">{window.location.host}/r/</InputAdornment>,
                                    }}
                                />
                            </Box>
                        )}
                        <Box>
                            <Typography variant="body2" color="textSecondary" mb={0.5}>Expiration Date (Optional)</Typography>
                            <TextField
                                fullWidth
                                type="date"
                                inputProps={{ min: new Date().toLocaleDateString('en-CA') }}
                                slotProps={{ htmlInput: { min: new Date().toLocaleDateString('en-CA') } }}
                                variant="outlined"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                size="small"
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setOpenModal(false)} variant="text" sx={{ color: '#0D233B', fontWeight: 'bold' }}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} variant="contained" sx={{ backgroundColor: '#d06c38', '&:hover': { backgroundColor: '#b35a2e' }, fontWeight: 'bold', px: 4 }}>
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ShortenUrl;
