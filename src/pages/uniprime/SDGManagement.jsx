import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Tooltip,
  Grid,
  Collapse,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { toast } from "sonner";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AutoFixHigh as AutoFixHighIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import API from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";

// SDG Asset Imports
import sdg1 from '../../assets/sdg-en-01.png';
import sdg2 from '../../assets/sdg-en-02.png';
import sdg3 from '../../assets/sdg-en-03.png';
import sdg4 from '../../assets/sdg-en-04.png';
import sdg5 from '../../assets/sdg-en-05.png';
import sdg6 from '../../assets/sdg-en-06.png';
import sdg7 from '../../assets/sdg-en-07.png';
import sdg8 from '../../assets/sdg-en-08.png';
import sdg9 from '../../assets/sdg-en-09.png';
import sdg10 from '../../assets/sdg-en-10.png';
import sdg11 from '../../assets/sdg-en-11.png';
import sdg12 from '../../assets/sdg-en-12.png';
import sdg13 from '../../assets/sdg-en-13.png';
import sdg14 from '../../assets/sdg-en-14.png';
import sdg15 from '../../assets/sdg-en-15.png';
import sdg16 from '../../assets/sdg-en-16.png';
import sdg17 from '../../assets/sdg-en-17.png';

const SDG_IMAGE_MAP = {
  "SDG-1": sdg1, "SDG-2": sdg2, "SDG-3": sdg3, "SDG-4": sdg4,
  "SDG-5": sdg5, "SDG-6": sdg6, "SDG-7": sdg7, "SDG-8": sdg8,
  "SDG-9": sdg9, "SDG-10": sdg10, "SDG-11": sdg11, "SDG-12": sdg12,
  "SDG-13": sdg13, "SDG-14": sdg14, "SDG-15": sdg15, "SDG-16": sdg16,
  "SDG-17": sdg17
};

const SDG_COLOR_MAP = {
  "SDG-1": "#E1222D", "SDG-2": "#D4A21D", "SDG-3": "#2F953F", "SDG-4": "#C42734",
  "SDG-5": "#E63D29", "SDG-6": "#22ACD9", "SDG-7": "#FAB805", "SDG-8": "#96273B",
  "SDG-9": "#EC6926", "SDG-10": "#DD1D7B", "SDG-11": "#F59D21", "SDG-12": "#D28E22",
  "SDG-13": "#4F7A3D", "SDG-14": "#177CBC", "SDG-15": "#43A73D", "SDG-16": "#1D5388",
  "SDG-17": "#2D3B66"
};

const SDGManagement = () => {
  const [sdgs, setSdgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleToggleExpand = (id) => {
    if (!isMobile) return;
    setExpandedId(expandedId === id ? null : id);
  };

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [currentSdg, setCurrentSdg] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    sdgNumber: "",
    sdgTitle: "",
    keywords: "",
  });

  useEffect(() => {
    fetchSdgs();
  }, []);

  const fetchSdgs = async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/sdgs");
      if (res.data && res.data.success) {
        setSdgs(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to fetch SDGs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (sdg = null) => {
    if (sdg) {
      setIsEdit(true);
      setCurrentSdg(sdg);
      setFormData({
        sdgNumber: sdg.sdgNumber,
        sdgTitle: sdg.sdgTitle,
        keywords: sdg.keywords.join(", "),
      });
    } else {
      setIsEdit(false);
      setFormData({
        sdgNumber: "",
        sdgTitle: "",
        keywords: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentSdg(null);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        keywords: formData.keywords.split(",").map((k) => k.trim()).filter((k) => k !== ""),
      };

      if (isEdit) {
        await API.put(`/api/sdgs/${currentSdg._id}`, payload);
        toast.success("SDG updated successfully");
      } else {
        await API.post("/api/sdgs", payload);
        toast.success("SDG created successfully");
      }
      fetchSdgs();
      handleCloseDialog();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save SDG");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this SDG?")) {
      try {
        await API.delete(`/api/sdgs/${id}`);
        toast.success("SDG deleted successfully");
        fetchSdgs();
      } catch (err) {
        toast.error("Failed to delete SDG");
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="SDG Keywords Management"
        subtitle="Manage Sustainable Development Goals and their associated keywords for document analysis."
        breadcrumbs={["Home", "Academics", "SDG Management"]}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: "10px",
              px: 3,
              background: 'var(--gradient-primary)',
              color: '#fff',
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: '0 4px 12px var(--color-primary-alpha)',
              '&:hover': {
                background: 'var(--gradient-primary)',
                filter: 'brightness(1.1)',
                boxShadow: '0 8px 20px var(--color-primary-alpha)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Add New SDG
          </Button>
        }
      />


      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {sdgs.sort((a, b) => {
            const numA = parseInt(a.sdgNumber.split('-')[1]) || 0;
            const numB = parseInt(b.sdgNumber.split('-')[1]) || 0;
            return numA - numB;
          }).map((sdg) => {
            const brandColor = SDG_COLOR_MAP[sdg.sdgNumber] || 'var(--color-primary)';
            const imageUrl = SDG_IMAGE_MAP[sdg.sdgNumber];
            const isExpanded = expandedId === sdg._id;

            return (
              <Box
                key={sdg._id}
                onClick={() => isMobile && handleToggleExpand(sdg._id)}
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  background: 'var(--bg-glass)',
                  borderRadius: '20px',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  cursor: isMobile ? 'pointer' : 'default',
                  '&:hover': {
                    boxShadow: 'var(--shadow-premium)',
                    borderColor: brandColor,
                    transform: isMobile ? 'translateY(-2px)' : 'none'
                  }
                }}
              >
                {/* Left Color Section */}
                <Box sx={{
                  width: { xs: '100%', md: 200 },
                  minHeight: { xs: 60, md: 'auto' },
                  background: brandColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  p: 2,
                  position: 'relative',
                  transition: 'all 0.3s ease'
                }}>
                  <Box
                    component="img"
                    src={imageUrl}
                    alt={sdg.sdgTitle}
                    sx={{
                      width: '100%',
                      height: '100%',
                      maxHeight: { xs: 80, md: '100%' },
                      objectFit: 'contain',
                      filter: 'none'
                    }}
                  />
                </Box>

                {/* Content Section */}
                <Box sx={{ flexGrow: 1, p: 3, position: 'relative' }}>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: isExpanded ? 2 : 0,
                    position: 'relative',
                    transition: 'margin 0.3s ease'
                  }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                        {sdg.sdgNumber}
                      </Typography>
                      <Typography variant="subtitle1" sx={{
                        fontWeight: 700,
                        color: brandColor,
                        mt: 0,
                        textTransform: 'uppercase',
                        fontSize: '0.9rem',
                        letterSpacing: '0.5px'
                      }}>
                        {sdg.sdgTitle}
                      </Typography>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{
                      display: 'flex',
                      gap: 1,
                      position: { xs: 'static', md: 'absolute' },
                      top: 0,
                      right: 0
                    }}>
                      <Tooltip title="Edit SDG">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(sdg);
                          }}
                          sx={{
                            color: 'var(--color-primary)',
                            background: 'var(--bg-accent-4)',
                            '&:hover': { background: 'var(--bg-panel)' }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete SDG">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(sdg._id);
                          }}
                          sx={{
                            color: '#ef4444',
                            background: 'rgba(239, 68, 68, 0.1)',
                            '&:hover': { background: 'rgba(239, 68, 68, 0.2)' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Collapse in={!isMobile || isExpanded} timeout="auto" unmountOnExit={isMobile}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pt: 1 }}>
                      {sdg.keywords.map((kw, i) => (
                        <Chip
                          key={i}
                          label={kw}
                          size="small"
                          sx={{
                            background: 'var(--bg-accent-4)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            '&:hover': {
                              background: 'var(--bg-accent-1)',
                              color: 'var(--text-primary)',
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Collapse>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '24px',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-premium)',
              backgroundImage: 'none'
            }
          }
        }}
      >
        <DialogTitle sx={{
          fontWeight: 800,
          color: isEdit ? (SDG_COLOR_MAP[formData.sdgNumber] || 'var(--text-primary)') : 'var(--text-primary)',
          borderBottom: `2px solid ${isEdit ? (SDG_COLOR_MAP[formData.sdgNumber] || 'var(--border-color)') : 'var(--border-color)'}`,
          pb: 2
        }}>
          {isEdit ? `Edit ${formData.sdgNumber} Keywords` : "Add New SDG"}
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'var(--border-color)' }}>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 4 }}>
              <TextField
                fullWidth
                label="SDG Number"
                name="sdgNumber"
                placeholder="e.g., SDG-1"
                value={formData.sdgNumber}
                onChange={handleFormChange}
                variant="outlined"
              />
            </Grid>
            <Grid size={{ xs: 8 }}>
              <TextField
                fullWidth
                label="SDG Title"
                name="sdgTitle"
                placeholder="e.g., NO POVERTY"
                value={formData.sdgTitle}
                onChange={handleFormChange}
                variant="outlined"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Keywords (Comma separated)"
                name="keywords"
                placeholder="Poverty, Hunger, Basic services..."
                value={formData.keywords}
                onChange={handleFormChange}
                variant="outlined"
                helperText="Enter keywords separated by commas. Each keyword will be used for document analysis."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!formData.sdgNumber || !formData.sdgTitle || !formData.keywords}
            sx={{
              background: 'var(--gradient-primary)',
              color: '#fff',
              borderRadius: '10px',
              px: 4,
              py: 1,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: isEdit ? `0 4px 12px ${SDG_COLOR_MAP[formData.sdgNumber]}40` : '0 4px 12px var(--color-primary-alpha)',
              '&:hover': {
                background: isEdit ? (SDG_COLOR_MAP[formData.sdgNumber] || 'var(--gradient-primary)') : 'var(--gradient-primary)',
                filter: 'brightness(1.1)',
                boxShadow: isEdit ? `0 8px 20px ${SDG_COLOR_MAP[formData.sdgNumber]}60` : '0 8px 20px var(--color-primary-alpha)',
                transform: 'translateY(-1px)'
              },
              '&.Mui-disabled': {
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-secondary)',
                boxShadow: 'none'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {isEdit ? "Update SDG" : "Create SDG"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SDGManagement;
