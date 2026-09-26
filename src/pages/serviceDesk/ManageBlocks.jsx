import React, { useState, useEffect } from 'react';
import Loader from "../../components/common/Loader";
import {
    Box, Button, Paper, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, Chip,
    Tooltip, Typography, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Apartment as ApartmentIcon, Close as CloseIcon, ToggleOn as ToggleOnIcon, ToggleOff as ToggleOffIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { PageContainer } from '../../components/common/design-system';
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';

const ManageBlocks = () => {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);

    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentBlockId, setCurrentBlockId] = useState(null);
    const [formData, setFormData] = useState({
        blockName: '',
        blockCode: '',
        description: '',
        status: 'ACTIVE'
    });
    const [saving, setSaving] = useState(false);

    const fetchBlocks = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/service-desk/blocks');
            if (res.data.success) {
                setBlocks(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to load blocks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlocks();
    }, []);

    const handleOpen = (block = null) => {
        if (block) {
            setEditMode(true);
            setCurrentBlockId(block._id);
            setFormData({
                blockName: block.blockName,
                blockCode: block.blockCode,
                description: block.description || '',
                status: block.status || 'ACTIVE'
            });
        } else {
            setEditMode(false);
            setCurrentBlockId(null);
            setFormData({
                blockName: '',
                blockCode: '',
                description: '',
                status: 'ACTIVE'
            });
        }
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
        setFormData({
            blockName: '',
            blockCode: '',
            description: '',
            status: 'ACTIVE'
        });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!formData.blockName || !formData.blockCode) {
            toast.error('Block Name and Block Code are required');
            return;
        }

        try {
            setSaving(true);
            if (editMode) {
                const res = await API.put(`/api/service-desk/blocks/${currentBlockId}`, formData);
                if (res.data.success) {
                    toast.success('Block updated successfully');
                    fetchBlocks();
                    handleClose();
                }
            } else {
                const res = await API.post('/api/service-desk/blocks', formData);
                if (res.data.success) {
                    toast.success('Block created successfully');
                    fetchBlocks();
                    handleClose();
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const res = await API.delete(`/api/service-desk/blocks/${id}`);
            if (res.data.success) {
                toast.success(res.data.message || 'Status updated');
                fetchBlocks();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const columns = [
        {
            field: 'blockName',
            headerName: 'BLOCK NAME',
            flex: 1.5,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                    <Box sx={{
                        p: 0.8,
                        borderRadius: 1.5,
                        backgroundColor: 'primary.50',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <ApartmentIcon fontSize="small" />
                    </Box>
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {params.row.blockName}
                        </Typography>
                        {params.row.description && (
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                                {params.row.description}
                            </Typography>
                        )}
                    </Box>
                </Box>
            )
        },
        {
            field: 'blockCode',
            headerName: 'BLOCK CODE',
            flex: 1,
            renderCell: (params) => (
                <Chip
                    label={params.row.blockCode}
                    size="small"
                    sx={{
                        fontWeight: 700,
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        borderRadius: '6px'
                    }}
                />
            )
        },
        {
            field: 'status',
            headerName: 'STATUS',
            flex: 0.8,
            renderCell: (params) => {
                const isActive = params.row.status === 'ACTIVE';
                return (
                    <Chip
                        label={params.row.status}
                        size="small"
                        color={isActive ? "success" : "default"}
                        sx={{
                            fontWeight: 600,
                            borderRadius: '6px'
                        }}
                    />
                );
            }
        },
        {
            field: 'actions',
            headerName: 'ACTIONS',
            flex: 0.8,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Edit Block">
                        <IconButton size="small" color="primary" onClick={() => handleOpen(params.row)}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={params.row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                        <IconButton
                            size="small"
                            color={params.row.status === 'ACTIVE' ? "error" : "success"}
                            onClick={() => handleToggleStatus(params.row._id)}
                        >
                            {params.row.status === 'ACTIVE' ? <ToggleOnIcon fontSize="small" /> : <ToggleOffIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    return (
        <PageContainer>
            <PageHeader
                title="Manage Blocks"
                subtitle="Create, organize, and manage campus blocks/buildings for localized Service Desk ticketing."
            >
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                    sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        px: 3,
                        fontWeight: 600,
                        boxShadow: 'none',
                        '&:hover': { boxShadow: 'none' }
                    }}
                >
                    Add Block
                </Button>
            </PageHeader>

            {loading ? (
                <Loader />
            ) : (
                <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                    <DataTable
                        rows={blocks.map(b => ({ ...b, id: b._id }))}
                        columns={columns}
                        emptyMessage="No blocks added yet."
                    />
                </Paper>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {editMode ? 'Edit Block' : 'Add New Block'}
                    </Typography>
                    <IconButton onClick={handleClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField
                            label="Block Name"
                            name="blockName"
                            value={formData.blockName}
                            onChange={handleChange}
                            fullWidth
                            required
                            placeholder="e.g. Ramanujan Bhavan, Cotton Bhavan"
                            size="small"
                        />
                        <TextField
                            label="Block Code"
                            name="blockCode"
                            value={formData.blockCode}
                            onChange={handleChange}
                            fullWidth
                            required
                            placeholder="e.g. RB, CB"
                            size="small"
                            inputProps={{ style: { textTransform: 'uppercase' } }}
                        />
                        <TextField
                            label="Description (Optional)"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Brief details about the block or facilities"
                            size="small"
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                name="status"
                                value={formData.status}
                                label="Status"
                                onChange={handleChange}
                            >
                                <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                                <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose} color="inherit" sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={saving}
                        sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
                    >
                        {saving ? 'Saving...' : editMode ? 'Update Block' : 'Create Block'}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageContainer>
    );
};

export default ManageBlocks;
