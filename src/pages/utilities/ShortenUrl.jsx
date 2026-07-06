import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, InputAdornment, Tooltip
} from '@mui/material';
import { Add, ContentCopy, OpenInNew, Link as LinkIcon, Block, CheckCircle, Delete } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import axios from '../../api/axios';
import { toast } from 'sonner';

const ShortenUrl = () => {
    const [links, setLinks] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [longUrl, setLongUrl] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

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
        try {
            await axios.post('/api/utilities/shorten-url', {
                longUrl,
                expiresAt: expiresAt || null
            });
            toast.success('Short link created successfully');
            setOpenModal(false);
            setLongUrl('');
            setExpiresAt('');
            fetchLinks();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create short link');
        }
    };

    const handleCopy = (shortCode) => {
        const url = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000'}/api/utilities/r/${shortCode}`;
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

    const filteredLinks = links.filter(link => 
        link.longUrl.toLowerCase().includes(searchQuery.toLowerCase()) || 
        link.shortCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                    <TextField
                        placeholder="Search URL or Short code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        size="small"
                        sx={{ width: '300px', background: 'var(--bg-panel)', borderRadius: 1 }}
                    />
                </Box>
                {filteredLinks.length === 0 ? (
                    <Box sx={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        py: 8, px: 3, background: "var(--bg-panel)", borderRadius: "16px",
                        border: "1px dashed var(--border-color)", boxShadow: "var(--shadow-premium)", textAlign: "center"
                    }}>
                        <Typography variant="h6" sx={{ color: "var(--text-secondary)", fontWeight: 600, mb: 1 }}>
                            No Short URLs Found
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
                            You haven't created any short URLs matching your criteria.
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead sx={{ background: "var(--gradient-primary)" }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2, width: 60 }}>S.No</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Original URL</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Short Link</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Clicks</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2, textAlign: 'right' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredLinks.map((link, index) => (
                                    <TableRow key={link._id} sx={{ "&:hover": { background: "var(--bg-accent-1)" }, transition: "background 0.15s" }}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell sx={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {link.longUrl}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="#0b5299" sx={{ fontWeight: 600 }}>{link.shortCode}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{link.clicks}</TableCell>
                                        <TableCell>
                                            {link.isActive ? (
                                                <Typography sx={{ backgroundColor: '#e6f4ea', color: '#1e8e3e', fontSize: '0.75rem', fontWeight: 600, px: 1.5, py: 0.5, borderRadius: '4px', display: 'inline-block' }}>Active</Typography>
                                            ) : (
                                                <Typography sx={{ backgroundColor: '#fce8e6', color: '#d93025', fontSize: '0.75rem', fontWeight: 600, px: 1.5, py: 0.5, borderRadius: '4px', display: 'inline-block' }}>Inactive</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Copy Link">
                                                <IconButton onClick={() => handleCopy(link.shortCode)} size="small" color="primary">
                                                    <ContentCopy fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Open Link">
                                                <IconButton 
                                                    component="a" 
                                                    href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000'}/api/utilities/r/${link.shortCode}`}
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
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
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
                            <Typography variant="body2" color="textSecondary" mb={0.5}>Expiration Date (Optional)</Typography>
                            <TextField
                                fullWidth
                                type="date"
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
