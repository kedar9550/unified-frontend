import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Tooltip, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { Add, QrCode as QrCodeIcon, Download, Delete, Block, CheckCircle } from '@mui/icons-material';
import axios from '../../api/axios';
import { toast } from 'sonner';
import CustomQRCode from '../../components/CustomQRCode';
import PageHeader from '../../components/common/PageHeader';
import LogoDarkTheme from '../../assets/Logo_Dark_theme.svg';

const GenerateQR = () => {
    const [links, setLinks] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [longUrl, setLongUrl] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    // QR Customization State
    const [selectedQr, setSelectedQr] = useState(null); // For downloading
    const [qrColorStyle, setQrColorStyle] = useState('bw');
    const [qrBgColor, setQrBgColor] = useState('white');
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

    const filteredLinks = links.filter(link => 
        link.longUrl.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                    <TextField
                        placeholder="Search Destination URL..."
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
                            No QR Codes Found
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
                            You haven't generated any QR codes matching your criteria.
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead sx={{ background: "var(--gradient-primary)" }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2, width: 60 }}>S.No</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>QR CODE</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>DESTINATION</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>SCANS</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>STATUS</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2, textAlign: 'right' }}>ACTIONS</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredLinks.map((link, index) => (
                                    <TableRow key={link._id} sx={{ "&:hover": { background: "var(--bg-accent-1)" }, transition: "background 0.15s" }}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>
                                            <Box sx={{ width: 64, height: 64, backgroundColor: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                                <CustomQRCode 
                                                    data={`${window.location.origin}/r/${link.shortCode}`} 
                                                    size={60} 
                                                    colorType="solid"
                                                    solidColor="#0b5299"
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {link.longUrl}
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
                    <QrCodeIcon sx={{ color: '#0b5299' }} /> Create New QR Code
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
                                        data={`${window.location.origin}/r/${selectedQr.shortCode}`} 
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

export default GenerateQR;
