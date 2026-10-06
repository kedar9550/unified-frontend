import React, { useState, useEffect } from 'react';
import Loader from "../../components/common/Loader";
import {
    Box, Button, Paper, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, Chip,
    Tooltip, Typography, FormControl, InputLabel, Select, MenuItem,
    RadioGroup, FormControlLabel, Radio, FormLabel, Tabs, Tab
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Apartment as ApartmentIcon,
    Hotel as HotelIcon,
    Close as CloseIcon,
    ToggleOn as ToggleOnIcon,
    ToggleOff as ToggleOffIcon,
    Male as MaleIcon,
    Female as FemaleIcon
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { PageContainer } from '../../components/common/design-system';
import DataTable from '../../components/data/DataTable';
import API from '../../api/axios';
import { toast } from 'sonner';

const ManageBlocks = () => {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');

    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentBlockId, setCurrentBlockId] = useState(null);
    const [formData, setFormData] = useState({
        blockName: '',
        blockCode: '',
        blockType: 'ACADEMIC',
        genderTag: 'BOYS',
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
                blockType: block.blockType || 'ACADEMIC',
                genderTag: block.genderTag || 'BOYS',
                description: block.description || '',
                status: block.status || 'ACTIVE'
            });
        } else {
            setEditMode(false);
            setCurrentBlockId(null);
            setFormData({
                blockName: '',
                blockCode: '',
                blockType: activeTab === 'BOYS_HOSTEL' || activeTab === 'GIRLS_HOSTEL' || activeTab === 'HOSTEL' ? 'HOSTEL' : 'ACADEMIC',
                genderTag: activeTab === 'GIRLS_HOSTEL' ? 'GIRLS' : 'BOYS',
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
            blockType: 'ACADEMIC',
            genderTag: 'BOYS',
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
            const payload = {
                ...formData,
                blockType: formData.blockType,
                genderTag: formData.blockType === 'HOSTEL' ? formData.genderTag : 'NONE'
            };

            if (editMode) {
                const res = await API.put(`/api/service-desk/blocks/${currentBlockId}`, payload);
                if (res.data.success) {
                    toast.success('Block updated successfully');
                    fetchBlocks();
                    handleClose();
                }
            } else {
                const res = await API.post('/api/service-desk/blocks', payload);
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

    const filteredBlocks = blocks.filter(b => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'ACADEMIC') return (b.blockType || 'ACADEMIC') === 'ACADEMIC';
        if (activeTab === 'BOYS_HOSTEL') return b.blockType === 'HOSTEL' && b.genderTag === 'BOYS';
        if (activeTab === 'GIRLS_HOSTEL') return b.blockType === 'HOSTEL' && b.genderTag === 'GIRLS';
        return true;
    });

    const academicCount = blocks.filter(b => (b.blockType || 'ACADEMIC') === 'ACADEMIC').length;
    const boysHostelCount = blocks.filter(b => b.blockType === 'HOSTEL' && b.genderTag === 'BOYS').length;
    const girlsHostelCount = blocks.filter(b => b.blockType === 'HOSTEL' && b.genderTag === 'GIRLS').length;

    return (
        <PageContainer>
            <PageHeader
                title="Manage Blocks & Hostels"
                subtitle="Configure campus academic buildings and hostel blocks with boys/girls allocation for ticket routing."
                action={
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpen()}
                        sx={{
                            background: 'var(--gradient-primary)',
                            borderRadius: '10px',
                            textTransform: 'none',
                            px: 3,
                            fontWeight: 600,
                            boxShadow: 'none',
                            '&:hover': { boxShadow: 'none' }
                        }}
                    >
                        Add Block / Hostel
                    </Button>
                }
            />

            <Paper sx={{ mb: 3, borderRadius: '12px', bgcolor: 'var(--bg-panel)', border: '1px solid var(--border-color)', p: 0.5 }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, val) => setActiveTab(val)}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label={`All Blocks (${blocks.length})`} value="ALL" sx={{ fontWeight: 600, textTransform: 'none' }} />
                    <Tab label={`Academic Buildings (${academicCount})`} value="ACADEMIC" sx={{ fontWeight: 600, textTransform: 'none' }} />
                    <Tab label={`Boys Hostels (${boysHostelCount})`} value="BOYS_HOSTEL" sx={{ fontWeight: 600, textTransform: 'none' }} />
                    <Tab label={`Girls Hostels (${girlsHostelCount})`} value="GIRLS_HOSTEL" sx={{ fontWeight: 600, textTransform: 'none' }} />
                </Tabs>
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <Loader />
                </Box>
            ) : filteredBlocks.length === 0 ? (
                <Box sx={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    py: 8, px: 3, background: "var(--bg-panel)", borderRadius: "16px",
                    border: "1px dashed var(--border-color)", boxShadow: "var(--shadow-premium)", textAlign: "center"
                }}>
                    <Typography variant="h6" sx={{ color: "var(--text-secondary)", fontWeight: 600, mb: 1 }}>
                        No Blocks Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
                        {activeTab === 'ALL'
                            ? "Create your first campus academic or hostel block to get started."
                            : `No blocks found in ${activeTab.replace('_', ' ')} category.`}
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => handleOpen()}
                        sx={{ background: "var(--gradient-primary)", textTransform: 'none', borderRadius: '8px' }}
                    >
                        Add Block / Hostel
                    </Button>
                </Box>
            ) : (
                <DataTable
                    showViewModeSwitcher={true}
                    columns={["Block Name", "Category & Type", "Block Code", "Status", "Actions"]}
                    alignments={["left", "left", "center", "center", "center"]}
                    nonSortableColumns={[4]}
                    rows={filteredBlocks.map(block => [
                        {
                            value: block.blockName,
                            display: (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                                    <Box sx={{
                                        p: 0.8,
                                        borderRadius: 1.5,
                                        backgroundColor: block.blockType === 'HOSTEL'
                                            ? (block.genderTag === 'GIRLS' ? 'rgba(219, 39, 119, 0.1)' : 'rgba(2, 132, 199, 0.1)')
                                            : 'rgba(59, 130, 246, 0.1)',
                                        color: block.blockType === 'HOSTEL'
                                            ? (block.genderTag === 'GIRLS' ? '#db2777' : '#0284c7')
                                            : '#2563eb',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {block.blockType === 'HOSTEL' ? <HotelIcon fontSize="small" /> : <ApartmentIcon fontSize="small" />}
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {block.blockName}
                                        </Typography>
                                        {block.description && (
                                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                                {block.description}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            )
                        },
                        {
                            value: block.blockType === 'HOSTEL' ? `Hostel - ${block.genderTag}` : 'Academic',
                            display: (
                                block.blockType === 'HOSTEL' ? (
                                    <Chip
                                        icon={block.genderTag === 'GIRLS' ? <FemaleIcon sx={{ fontSize: '1rem !important' }} /> : <MaleIcon sx={{ fontSize: '1rem !important' }} />}
                                        label={block.genderTag === 'GIRLS' ? 'Girls Hostel' : 'Boys Hostel'}
                                        size="small"
                                        sx={{
                                            fontWeight: 600,
                                            borderRadius: '6px',
                                            bgcolor: block.genderTag === 'GIRLS' ? 'rgba(219, 39, 119, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                                            color: block.genderTag === 'GIRLS' ? '#db2777' : '#0284c7',
                                            border: `1px solid ${block.genderTag === 'GIRLS' ? 'rgba(219, 39, 119, 0.3)' : 'rgba(2, 132, 199, 0.3)'}`
                                        }}
                                    />
                                ) : (
                                    <Chip
                                        icon={<ApartmentIcon sx={{ fontSize: '0.9rem !important' }} />}
                                        label="Academic Building"
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        sx={{ fontWeight: 600, borderRadius: '6px' }}
                                    />
                                )
                            )
                        },
                        {
                            value: block.blockCode,
                            display: (
                                <Chip
                                    label={block.blockCode}
                                    size="small"
                                    sx={{
                                        fontWeight: 700,
                                        borderRadius: '6px'
                                    }}
                                />
                            )
                        },
                        {
                            value: block.status || 'ACTIVE',
                            display: (
                                <Chip
                                    label={block.status || 'ACTIVE'}
                                    size="small"
                                    color={block.status === 'ACTIVE' ? "success" : "default"}
                                    sx={{
                                        fontWeight: 600,
                                        borderRadius: '6px'
                                    }}
                                />
                            )
                        },
                        {
                            value: '',
                            display: (
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                    <Tooltip title="Edit Block">
                                        <IconButton size="small" color="primary" onClick={() => handleOpen(block)} sx={{ background: 'var(--bg-glass)' }}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={block.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                                        <IconButton
                                            size="small"
                                            color={block.status === 'ACTIVE' ? "error" : "success"}
                                            onClick={() => handleToggleStatus(block._id)}
                                            sx={{ background: 'var(--bg-glass)' }}
                                        >
                                            {block.status === 'ACTIVE' ? <ToggleOnIcon fontSize="small" /> : <ToggleOffIcon fontSize="small" />}
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            )
                        }
                    ])}
                />
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
                        
                        {/* Block Type Selection */}
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <FormControl component="fieldset">
                                <FormLabel component="legend" sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b', mb: 0.5 }}>
                                    Block Category
                                </FormLabel>
                                <RadioGroup
                                    row
                                    name="blockType"
                                    value={formData.blockType}
                                    onChange={(e) => setFormData({ ...formData, blockType: e.target.value })}
                                >
                                    <FormControlLabel value="ACADEMIC" control={<Radio size="small" />} label="Academic Building" />
                                    <FormControlLabel value="HOSTEL" control={<Radio size="small" />} label="Hostel Block" />
                                </RadioGroup>
                            </FormControl>

                            {/* If Hostel, show Boys vs Girls selection */}
                            {formData.blockType === 'HOSTEL' && (
                                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed var(--border-color)' }}>
                                    <FormControl component="fieldset">
                                        <FormLabel component="legend" sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b', mb: 0.5 }}>
                                            Hostel Allocation Tag
                                        </FormLabel>
                                        <RadioGroup
                                            row
                                            name="genderTag"
                                            value={formData.genderTag}
                                            onChange={(e) => setFormData({ ...formData, genderTag: e.target.value })}
                                        >
                                            <FormControlLabel
                                                value="BOYS"
                                                control={<Radio size="small" sx={{ color: '#0284c7', '&.Mui-checked': { color: '#0284c7' } }} />}
                                                label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#0284c7' }}>Boys Hostel</Typography>}
                                            />
                                            <FormControlLabel
                                                value="GIRLS"
                                                control={<Radio size="small" sx={{ color: '#db2777', '&.Mui-checked': { color: '#db2777' } }} />}
                                                label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#db2777' }}>Girls Hostel</Typography>}
                                            />
                                        </RadioGroup>
                                    </FormControl>
                                </Box>
                            )}
                        </Paper>

                        <TextField
                            label={formData.blockType === 'HOSTEL' ? "Hostel Block Name" : "Block Name"}
                            name="blockName"
                            value={formData.blockName}
                            onChange={handleChange}
                            fullWidth
                            required
                            placeholder={formData.blockType === 'HOSTEL' ? "e.g. Kaveri Block, Ganga, Block-1" : "e.g. Ramanujan Bhavan, Cotton Bhavan"}
                            size="small"
                        />
                        <TextField
                            label="Block Code"
                            name="blockCode"
                            value={formData.blockCode}
                            onChange={handleChange}
                            fullWidth
                            required
                            placeholder={formData.blockType === 'HOSTEL' ? (formData.genderTag === 'GIRLS' ? "e.g. GH-KAV, GH-B1" : "e.g. BH-KAV, BH-B1") : "e.g. RB, CB, BGB"}
                            size="small"
                            helperText="Must be unique. For hostels, prefix with BH- (Boys) or GH- (Girls) if names are identical."
                            inputProps={{ style: { textTransform: 'uppercase' } }}
                        />
                        <TextField
                            label="Description (Optional)"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Brief details about the block, floors or rooms"
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
