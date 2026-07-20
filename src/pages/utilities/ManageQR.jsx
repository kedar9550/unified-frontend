import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, IconButton, Chip, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogActions, Button, Select, MenuItem, FormControl, TextField
} from '@mui/material';
import { Delete, Lock, LockOpen, Warning, DeleteForever, Download } from '@mui/icons-material';
import CustomQRCode from '../../components/CustomQRCode';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import axios from '../../api/axios';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

const ManageQR = () => {
    const [links, setLinks] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ open: false, type: '', id: null });

    // QR Customization State
    const [selectedQr, setSelectedQr] = useState(null);
    const [qrColorStyle, setQrColorStyle] = useState('bw');
    const [qrBgColor, setQrBgColor] = useState('white');
    const [color1, setColor1] = useState('#b58635');
    const [color2, setColor2] = useState('#0a1b2a');
    const [openDownloadModal, setOpenDownloadModal] = useState(false);
    const qrRef = useRef();

    const fetchLinks = async () => {
        try {
            const res = await axios.get('/api/utilities/admin/all');
            const qrUrls = res.data.data.filter(item => item.type === 'qr');
            setLinks(qrUrls);
        } catch (error) {
            toast.error('Failed to fetch QR codes');
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

    const handleDelete = async () => {
        try {
            if (deleteModal.type === 'hard') {
                await axios.delete(`/api/utilities/admin/${deleteModal.id}/hard-delete`);
                toast.success('Deleted successfully');
            }
            setDeleteModal({ open: false, type: '', id: null });
            fetchLinks();
        } catch (error) {
            toast.error(`Failed to delete`);
        }
    };

    const openDownload = (link) => {
        setSelectedQr(link);
        setQrColorStyle('bw');
        setQrBgColor('white');
        setColor1('#b58635');
        setColor2('#0a1b2a');
        setOpenDownloadModal(true);
    };

    const handleDownload = () => {
        if (qrRef.current) {
            qrRef.current.download(`QRCode_${selectedQr.shortCode}`, 'png');
            setOpenDownloadModal(false);
            toast.success('QR Code downloaded successfully');
        }
    };

    return (
        <Box>
            <PageHeader title="Manage QR Codes" subtitle="Admin panel to manage all generated QR codes" />

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, mt: 3, px: 3 }}>
                <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>
                    All QR Codes
                </Typography>
            </Box>

            <Box sx={{ px: 3, pb: 3 }}>
                <DataTable 
                    columns={["Creator", "Original URL", "QR Code", "Clicks", "Status", "Actions"]}
                    alignments={["left", "left", "center", "center", "center", "right"]}
                    nonSortableColumns={[2, 5]}
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
                            display: (
                                <Box sx={{ width: 64, height: 64, backgroundColor: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', margin: '0 auto' }}>
                                    <CustomQRCode 
                                        data={`${window.location.origin}/go/${link.shortCode}`} 
                                        size={60} 
                                        colorType="solid"
                                        solidColor="#0b5299"
                                    />
                                </Box>
                            )
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
                                    <Tooltip title="Download QR">
                                        <IconButton onClick={() => openDownload(link)} size="small" sx={{ color: '#d06c38' }}>
                                            <Download fontSize="small" />
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
                        Are you sure you want to permanently delete this QR code? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteModal({ open: false, type: '', id: null })}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Confirm</Button>
                </DialogActions>
            </Dialog>

            {/* Download Modal */}
            <Dialog open={openDownloadModal} onClose={() => setOpenDownloadModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, color: '#1a202c', pb: 1 }}>
                    Customize QR Code
                    <IconButton onClick={() => setOpenDownloadModal(false)} size="small">
                        <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>&times;</Typography>
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                            <Box sx={{ p: 3, backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {selectedQr && (
                                    <CustomQRCode 
                                        ref={qrRef}
                                        data={`${window.location.origin}/go/${selectedQr.shortCode}`} 
                                        size={280}
                                        colorType={qrColorStyle}
                                        solidColor={color1}
                                        gradientColors={[color1, color2]}
                                        backgroundColor={qrBgColor}
                                    />
                                )}
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="body2" color="textSecondary" mb={1}>Color Style</Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={qrColorStyle}
                                    onChange={(e) => setQrColorStyle(e.target.value)}
                                    sx={{ borderRadius: '8px' }}
                                >
                                    <MenuItem value="bw">Black & White</MenuItem>
                                    <MenuItem value="solid">Solid Color</MenuItem>
                                    <MenuItem value="gradient">Gradient (Combination)</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Box>
                            <Typography variant="body2" color="textSecondary" mb={1}>Background</Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={qrBgColor}
                                    onChange={(e) => setQrBgColor(e.target.value)}
                                    sx={{ borderRadius: '8px' }}
                                >
                                    <MenuItem value="white">White</MenuItem>
                                    <MenuItem value="transparent">Transparent</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {qrColorStyle !== 'bw' && (
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" color="textSecondary" mb={1}>
                                        {qrColorStyle === 'solid' ? 'Color' : 'Color 1'}
                                    </Typography>
                                    <TextField 
                                        type="color" 
                                        value={color1} 
                                        onChange={(e) => setColor1(e.target.value)}
                                        fullWidth
                                        size="small"
                                        sx={{ '& input': { p: 0, height: '36px', cursor: 'pointer' } }}
                                    />
                                </Box>
                                {qrColorStyle === 'gradient' && (
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" color="textSecondary" mb={1}>Color 2</Typography>
                                        <TextField 
                                            type="color" 
                                            value={color2} 
                                            onChange={(e) => setColor2(e.target.value)}
                                            fullWidth
                                            size="small"
                                            sx={{ '& input': { p: 0, height: '36px', cursor: 'pointer' } }}
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}
                        
                        <Button 
                            onClick={handleDownload} 
                            variant="contained" 
                            fullWidth
                            startIcon={<Download />}
                            sx={{ backgroundColor: '#0D233B', color: 'white', '&:hover': { backgroundColor: '#1a365d' }, py: 1.5, borderRadius: '8px', fontWeight: 600, textTransform: 'none' }}
                        >
                            Download QR Code
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default ManageQR;
