import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Tooltip, MenuItem, Select, FormControl, InputLabel, Chip
} from '@mui/material';
import { Add, QrCode as QrCodeIcon, Download, Delete, Block, CheckCircle } from '@mui/icons-material';
import axios from '../../api/axios';
import { toast } from 'sonner';
import CustomQRCode from '../../components/CustomQRCode';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import LogoDarkTheme from '../../assets/Logo_Dark_theme.svg';

const GenerateQR = () => {
    const [links, setLinks] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [longUrl, setLongUrl] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    
    // QR Customization State
    const [selectedQr, setSelectedQr] = useState(null); // For downloading
    const [qrColorStyle, setQrColorStyle] = useState('bw');
    const [qrBgColor, setQrBgColor] = useState('white');
    const [qrLogoStyle, setQrLogoStyle] = useState('default');
    const [color1, setColor1] = useState('#b58635');
    const [color2, setColor2] = useState('#0a1b2a');
    const [openDownloadModal, setOpenDownloadModal] = useState(false);
    const qrRef = useRef();

    const fetchLinks = async () => {
        try {
            const res = await axios.get('/api/utilities/my-links');
            const qrUrls = res.data.data.filter(item => item.type === 'qr');
            setLinks(qrUrls);
        } catch (error) {
            toast.error('Failed to fetch QR codes');
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
            await axios.post('/api/utilities/generate-qr', {
                longUrl,
                expiresAt: expiresAt || null
            });
            toast.success('QR Code generated successfully');
            setOpenModal(false);
            setLongUrl('');
            setExpiresAt('');
            fetchLinks();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate QR Code');
        }
    };

    const openDownload = (link) => {
        setSelectedQr(link);
        setQrColorStyle('bw'); // reset to default
        setQrBgColor('white');
        setColor1('#b58635');
        setColor2('#0a1b2a');
        setOpenDownloadModal(true);
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await axios.put(`/api/utilities/${id}/status`);
            toast.success(`QR Code ${currentStatus ? 'deactivated' : 'activated'} successfully`);
            fetchLinks();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this QR Code?')) return;
        try {
            await axios.delete(`/api/utilities/${id}/soft-delete`);
            toast.success('QR Code deleted successfully');
            fetchLinks();
        } catch (error) {
            toast.error('Failed to delete QR Code');
        }
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
            <PageHeader title="QR Codes" subtitle="Create and manage your QR codes" />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 3, px: 3 }}>
                <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>
                    My QR Codes
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
                    columns={["S.No", "QR CODE", "DESTINATION", "SCANS", "STATUS", "ACTIONS"]}
                    alignments={["center", "center", "left", "center", "center", "right"]}
                    nonSortableColumns={[0, 1, 5]}
                    rows={links.map((link, index) => [
                        { value: index + 1, display: index + 1 },
                        {
                            value: '',
                            display: (
                                <Box sx={{ width: 56, height: 56, p: '4px', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', pointerEvents: 'none', margin: '0 auto' }}>
                                    <CustomQRCode 
                                        data={`${window.location.origin}/go/${link.shortCode}`} 
                                        size={48} 
                                        colorType="solid"
                                        solidColor="#0b5299"
                                    />
                                </Box>
                            )
                        },
                        {
                            value: link.longUrl,
                            display: (
                                <Box sx={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {link.longUrl}
                                </Box>
                            )
                        },
                        { value: link.clicks, display: link.clicks },
                        {
                            value: link.isActive ? 'Active' : 'Inactive',
                            display: link.isActive ? (
                                <Chip label="Active" color="success" size="small" sx={{ fontWeight: 600 }} />
                            ) : (
                                <Chip label="Inactive" color="warning" size="small" sx={{ fontWeight: 600 }} />
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
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1, color: 'var(--text-primary)', fontWeight: 'bold' }}>
                    <QrCodeIcon sx={{ color: 'var(--color-blue)' }} /> Create New QR Code
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
                    <Button onClick={() => setOpenModal(false)} variant="text" sx={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} variant="contained" sx={{ background: 'var(--gradient-primary)', fontWeight: 'bold', px: 4, textTransform: 'none' }}>
                        Create
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Download Modal */}
            <Dialog open={openDownloadModal} onClose={() => setOpenDownloadModal(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1, maxWidth: { xs: '420px', md: '720px' } } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, color: 'var(--text-primary)', pb: 1 }}>
                    Customize QR Code
                    <IconButton onClick={() => setOpenDownloadModal(false)} size="small">
                        <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>&times;</Typography>
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: { xs: 'center', md: 'stretch' } }}>
                        {/* Left Column: QR Code Preview */}
                        <Box sx={{ flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Box sx={{ p: 2.5, backgroundColor: qrBgColor === 'black' ? '#000000' : (qrBgColor === 'transparent' ? 'transparent' : 'white'), borderRadius: '16px', border: qrBgColor === 'transparent' ? '1px dashed #64748b' : '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.3s' }}>
                                {selectedQr && (
                                    <CustomQRCode 
                                        ref={qrRef}
                                        data={`${window.location.origin}/go/${selectedQr.shortCode}`} 
                                        size={260}
                                        colorType={qrColorStyle}
                                        solidColor={color1}
                                        gradientColors={[color1, color2]}
                                        backgroundColor={qrBgColor}
                                        logoStyle={qrLogoStyle}
                                    />
                                )}
                            </Box>
                        </Box>

                        {/* Right Column: Customization Controls */}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
                            <Box>
                                <Typography variant="body2" color="textSecondary" mb={0.5}>Color Style</Typography>
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
                                <Typography variant="body2" color="textSecondary" mb={0.5}>Background</Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={qrBgColor}
                                        onChange={(e) => setQrBgColor(e.target.value)}
                                        sx={{ borderRadius: '8px' }}
                                    >
                                        <MenuItem value="white">White</MenuItem>
                                        <MenuItem value="black">Black</MenuItem>
                                        <MenuItem value="transparent">Transparent</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box>
                                <Typography variant="body2" color="textSecondary" mb={0.5}>Logo Style</Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={qrLogoStyle}
                                        onChange={(e) => setQrLogoStyle(e.target.value)}
                                        sx={{ borderRadius: '8px' }}
                                    >
                                        <MenuItem value="default">Gold</MenuItem>
                                        <MenuItem value="logo_png">Theme</MenuItem>
                                        <MenuItem value="circle_white">White</MenuItem>
                                        <MenuItem value="circle_black">Black</MenuItem>
                                        <MenuItem value="none">No logo</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {qrColorStyle !== 'bw' && (
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" color="textSecondary" mb={0.5}>
                                            {qrColorStyle === 'solid' ? 'Color' : 'Color 1'}
                                        </Typography>
                                        <TextField 
                                            type="color" 
                                            value={color1} 
                                            onChange={(e) => {
                                                const newColor = e.target.value;
                                                setColor1(newColor);
                                                if (newColor === '#ffffff' && qrBgColor === 'white') {
                                                    setQrBgColor('black');
                                                }
                                            }}
                                            fullWidth
                                            size="small"
                                            sx={{ '& input': { p: 0, height: '36px', cursor: 'pointer' } }}
                                        />
                                    </Box>
                                    {qrColorStyle === 'gradient' && (
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="textSecondary" mb={0.5}>Color 2</Typography>
                                            <TextField 
                                                type="color" 
                                                value={color2} 
                                                onChange={(e) => {
                                                    const newColor = e.target.value;
                                                    setColor2(newColor);
                                                    if (newColor === '#ffffff' && qrBgColor === 'white') {
                                                        setQrBgColor('black');
                                                    }
                                                }}
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
                                sx={{ background: 'var(--gradient-primary)', color: 'white', py: 1.2, mt: 0.5, borderRadius: '8px', fontWeight: 600, textTransform: 'none' }}
                            >
                                Download QR Code
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default GenerateQR;
