import React, { useState, useEffect } from 'react';
import {
    Box, Typography, IconButton, Chip, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogActions, Button
} from '@mui/material';
import { Delete, Lock, LockOpen, Warning, DeleteForever, ContentCopy, OpenInNew } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import axios from '../../api/axios';
import { toast } from 'sonner';

const ManageShortenUrl = () => {
    const [links, setLinks] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ open: false, type: '', id: null });

    const fetchLinks = async () => {
        try {
            const res = await axios.get('/api/utilities/admin/all');
            const shortUrls = res.data.data.filter(item => item.type === 'short_url');
            setLinks(shortUrls);
        } catch (error) {
            toast.error('Failed to fetch links');
        }
    };

    useEffect(() => {
        fetchLinks();
    }, []);

    const handleToggleStatus = async (id) => {
        try {
            await axios.put(`/api/utilities/admin/${id}/status`);
            toast.success('Status updated');
            fetchLinks();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleCopy = (shortCode) => {
        const url = `${window.location.origin}/r/${shortCode}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
    };

    const handleDelete = async () => {
        try {
            if (deleteModal.type === 'hard') {
                await axios.delete(`/api/utilities/admin/${deleteModal.id}/hard-delete`);
                toast.success('Deleted successfully');
            }
            setDeleteModal({ open: false, type: '', id: null });
            fetchLinks();
        } catch (error) {
            toast.error(`Failed to ${deleteModal.type} delete`);
        }
    };

    return (
        <Box>
            <PageHeader title="Manage Short URLs" subtitle="Admin panel to manage all shortened URLs" />

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, mt: 3, px: 3 }}>
                <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>
                    All Short URLs
                </Typography>
            </Box>
            <Box sx={{ px: 3, pb: 3 }}>
                <DataTable 
                    columns={["Creator", "Original URL", "Short Link", "Clicks", "Status", "Actions"]}
                    alignments={["left", "left", "left", "center", "center", "right"]}
                    nonSortableColumns={[5]}
                    rows={links.map(link => [
                        {
                            value: link.userId?.name || 'Unknown',
                            display: (
                                <Box>
                                    <Typography variant="body2" fontWeight="bold" sx={{ color: "var(--text-primary)" }}>
                                        {link.userId?.name || 'Unknown'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", display: "block" }}>
                                        {link.userId?.designation || ''} | ID: {link.userId?.institutionId || link.userId?.employeeId || 'N/A'}
                                    </Typography>
                                </Box>
                            )
                        },
                        {
                            value: link.longUrl,
                            display: (
                                <Box sx={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {link.longUrl}
                                </Box>
                            )
                        },
                        {
                            value: link.shortCode,
                            display: <Typography variant="body2" color="#0b5299" sx={{ fontWeight: 600 }}>{link.shortCode}</Typography>
                        },
                        {
                            value: link.clicks,
                            display: link.clicks
                        },
                        {
                            value: link.isDeleted ? 'Deleted' : link.isActive ? 'Active' : 'Inactive',
                            display: link.isDeleted ? (
                                <Chip label="Deleted" color="error" size="small" />
                            ) : link.isActive ? (
                                <Chip label="Active" color="success" size="small" />
                            ) : (
                                <Chip label="Inactive" color="warning" size="small" />
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
                                    {!link.isDeleted && (
                                        <Tooltip title={link.isActive ? "Deactivate" : "Activate"}>
                                            <IconButton onClick={() => handleToggleStatus(link._id)} size="small" color={link.isActive ? "warning" : "success"}>
                                                {link.isActive ? <Lock fontSize="small" /> : <LockOpen fontSize="small" />}
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    <Tooltip title="Delete">
                                        <IconButton onClick={() => setDeleteModal({ open: true, type: 'hard', id: link._id })} size="small" sx={{ color: '#d32f2f' }}>
                                            <DeleteForever fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            )
                        }
                    ])}
                />
            </Box>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteModal.open} onClose={() => setDeleteModal({ open: false, type: '', id: null })}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f' }}>
                    <Warning /> Confirm Delete
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to permanently delete this URL? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteModal({ open: false, type: '', id: null })}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Confirm</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ManageShortenUrl;
