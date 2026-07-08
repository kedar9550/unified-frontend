import Loader from "../../components/common/Loader";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
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
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
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
  const [expandedId, setExpandedId] = useState(null);

  const [editingSdgId, setEditingSdgId] = useState(null);
  const [openAddKeywordDialog, setOpenAddKeywordDialog] = useState(false);
  const [activeSdgForAdd, setActiveSdgForAdd] = useState(null);
  const [newKeywordInput, setNewKeywordInput] = useState("");

  const [openEditKeywordDialog, setOpenEditKeywordDialog] = useState(false);
  const [activeSdgForEditKw, setActiveSdgForEditKw] = useState(null);
  const [oldKeywordValue, setOldKeywordValue] = useState("");
  const [editKeywordInput, setEditKeywordInput] = useState("");

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
      const res = await API.get("/api/sdgs");
      if (res.data && res.data.success) {
        setSdgs(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to fetch SDGs");
      console.error(err);
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

  const handleDeleteKeyword = async (sdg, keywordToDelete) => {
    try {
      const updatedKeywords = sdg.keywords.filter(kw => kw !== keywordToDelete);
      const payload = {
        sdgNumber: sdg.sdgNumber,
        sdgTitle: sdg.sdgTitle,
        keywords: updatedKeywords
      };
      await API.put(`/api/sdgs/${sdg._id}`, payload);
      toast.success(`"${keywordToDelete}" deleted successfully`);
      fetchSdgs();
    } catch (err) {
      toast.error("Failed to delete keyword");
      console.error(err);
    }
  };

  const handleOpenAddKeyword = (sdg) => {
    setActiveSdgForAdd(sdg);
    setNewKeywordInput("");
    setOpenAddKeywordDialog(true);
  };

  const handleCloseAddKeyword = () => {
    setOpenAddKeywordDialog(false);
    setActiveSdgForAdd(null);
    setNewKeywordInput("");
  };

  const handleAddKeywordSubmit = async () => {
    if (!newKeywordInput.trim()) return;
    try {
      const trimmed = newKeywordInput.trim();
      if (activeSdgForAdd.keywords.includes(trimmed)) {
        toast.error("Keyword already exists in this SDG");
        return;
      }
      const updatedKeywords = [...activeSdgForAdd.keywords, trimmed];
      const payload = {
        sdgNumber: activeSdgForAdd.sdgNumber,
        sdgTitle: activeSdgForAdd.sdgTitle,
        keywords: updatedKeywords
      };
      await API.put(`/api/sdgs/${activeSdgForAdd._id}`, payload);
      toast.success(`"${trimmed}" added successfully`);
      fetchSdgs();
      handleCloseAddKeyword();
    } catch (err) {
      toast.error("Failed to add keyword");
      console.error(err);
    }
  };

  const handleOpenEditKeyword = (sdg, keywordToEdit) => {
    setActiveSdgForEditKw(sdg);
    setOldKeywordValue(keywordToEdit);
    setEditKeywordInput(keywordToEdit);
    setOpenEditKeywordDialog(true);
  };

  const handleCloseEditKeyword = () => {
    setOpenEditKeywordDialog(false);
    setActiveSdgForEditKw(null);
    setOldKeywordValue("");
    setEditKeywordInput("");
  };

  const handleEditKeywordSubmit = async () => {
    if (!editKeywordInput.trim()) return;
    try {
      const trimmed = editKeywordInput.trim();
      if (trimmed === oldKeywordValue) {
        handleCloseEditKeyword();
        return;
      }

      if (activeSdgForEditKw.keywords.includes(trimmed) && trimmed !== oldKeywordValue) {
        toast.error("Keyword already exists in this SDG");
        return;
      }

      const updatedKeywords = activeSdgForEditKw.keywords.map(kw =>
        kw === oldKeywordValue ? trimmed : kw
      );

      const payload = {
        sdgNumber: activeSdgForEditKw.sdgNumber,
        sdgTitle: activeSdgForEditKw.sdgTitle,
        keywords: updatedKeywords
      };

      await API.put(`/api/sdgs/${activeSdgForEditKw._id}`, payload);
      toast.success("Keyword updated successfully");
      fetchSdgs();
      handleCloseEditKeyword();
    } catch (err) {
      toast.error("Failed to update keyword");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this SDG?")) {
      try {
        await API.delete(`/api/sdgs/${id}`);
        toast.success("SDG deleted successfully");
        fetchSdgs();
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete SDG");
      }
    }
  };

  return (
    <Box>
      <PageHeader
        title="SDG Keywords Management"
        subtitle="Manage Sustainable Development Goals and their associated keywords for document analysis." />

      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, mb: 3, mt: 1 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            width: { xs: '100%', sm: 'auto' },
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
      </Box>


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
                  },
                  '&::after': {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "120px",
                    height: "120px",
                    background: `radial-gradient(circle at top right, ${brandColor}25, transparent 70%)`,
                    zIndex: 0,
                    pointerEvents: 'none'
                  }
                }}
              >
                {/* Left Color Section */}
                <Box sx={{
                  width: { xs: '100%', md: 200 },
                  height: { xs: 120, md: 'auto' },
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
                      height: '100%',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      filter: 'none'
                    }}
                  />
                </Box>

                {/* Content Section */}
                <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, position: 'relative' }}>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: isExpanded ? 2 : 0,
                    position: 'relative',
                    transition: 'margin 0.3s ease'
                  }}>
                    <Box sx={{ flex: 1, pr: 2 }}>
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
                      display: "flex",
                      gap: 1,
                      position: { xs: "static", md: "absolute" },
                      top: 0,
                      right: 0,
                      zIndex: 2,
                      alignItems: 'center'
                    }}>
                      {/* Manage Keywords Inline Toggle */}
                      <Tooltip title={editingSdgId === sdg._id ? "Done Managing Keywords" : "Manage Keywords"}>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            if (editingSdgId === sdg._id) {
                              setEditingSdgId(null);
                            } else {
                              setEditingSdgId(sdg._id);
                            }
                          }}
                          sx={{
                            color: editingSdgId === sdg._id ? "#22c55e" : "var(--color-primary)",
                            background: editingSdgId === sdg._id ? "rgba(34, 197, 94, 0.1)" : "var(--bg-accent-4)",
                            "&:hover": {
                              background: editingSdgId === sdg._id ? "rgba(34, 197, 94, 0.2)" : "var(--bg-panel)"
                            }
                          }}
                        >
                          {editingSdgId === sdg._id ? <CheckIcon fontSize="small" /> : <SettingsIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>

                      {/* Edit SDG Details */}
                      <Tooltip title="Edit SDG Details">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(sdg);
                          }}
                          sx={{
                            color: "var(--text-secondary)",
                            background: "var(--bg-accent-4)",
                            "&:hover": {
                              color: "var(--color-primary)",
                              background: "var(--bg-panel)"
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {/* Delete SDG */}
                      <Tooltip title="Delete SDG">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(sdg._id);
                          }}
                          sx={{
                            color: "var(--text-secondary)",
                            background: "var(--bg-accent-4)",
                            "&:hover": {
                              color: "#ef4444",
                              background: "rgba(239, 68, 68, 0.1)"
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {/* Mobile Expand Indicator */}
                      {isMobile && (
                        <IconButton
                          sx={{
                            color: "var(--text-secondary)",
                            background: "var(--bg-accent-4)",
                            pointerEvents: 'none'
                          }}
                        >
                          {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  <Collapse in={!isMobile || isExpanded} timeout="auto" unmountOnExit={isMobile}>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, pt: 1 }}>
                      {sdg.keywords.map((kw, i) => {
                        const isEditingThisCard = editingSdgId === sdg._id;
                        return (
                          <Chip
                            key={i}
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <span>{kw}</span>
                                {isEditingThisCard && (
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditKeyword(sdg, kw);
                                    }}
                                    sx={{
                                      p: 0,
                                      ml: 0.5,
                                      color: 'var(--text-secondary)',
                                      '&:hover': {
                                        color: brandColor,
                                        transform: 'scale(1.15)'
                                      },
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    <EditIcon sx={{ fontSize: '0.75rem' }} />
                                  </IconButton>
                                )}
                              </Box>
                            }
                            size="small"
                            onDelete={isEditingThisCard ? (e) => {
                              e.stopPropagation();
                              handleDeleteKeyword(sdg, kw);
                            } : undefined}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            sx={{
                              background: isEditingThisCard ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-accent-4)',
                              color: isEditingThisCard ? 'var(--text-primary)' : 'var(--text-secondary)',
                              border: `1px solid ${isEditingThisCard ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-color)'}`,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              transition: 'all 0.2s ease',
                              '& .MuiChip-deleteIcon': {
                                color: '#ef4444',
                                '&:hover': {
                                  color: '#dc2626',
                                }
                              },
                              '&:hover': {
                                background: isEditingThisCard ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-accent-1)',
                                color: 'var(--text-primary)',
                              }
                            }}
                          />
                        );
                      })}
                      {editingSdgId === sdg._id && (
                        <Chip
                          icon={<AddIcon size="small" style={{ color: 'var(--color-primary)' }} />}
                          label="Add"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddKeyword(sdg);
                          }}
                          sx={{
                            background: 'var(--color-primary-alpha)',
                            color: 'var(--color-primary)',
                            border: '1px dashed var(--color-primary)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            '&:hover': {
                              background: 'var(--color-primary)',
                              color: '#fff',
                              '& .MuiChip-icon': {
                                color: '#fff !important'
                              }
                            }
                          }}
                        />
                      )}
                    </Box>
                  </Collapse>
                </Box>
              </Box>
            );
          })}
        </Box>

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
            <Grid size={{ xs: 12, sm: 4 }}>
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
            <Grid size={{ xs: 12, sm: 8 }}>
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
                background: 'rgba(0, 0, 0, 0.08)',
                'body.dark-mode &': {
                  background: 'rgba(255, 255, 255, 0.05)',
                },
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

      {/* Add Keyword Dialog */}
      <Dialog
        open={openAddKeywordDialog}
        onClose={handleCloseAddKeyword}
        maxWidth="xs"
        fullWidth
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
          fontWeight: 850,
          color: activeSdgForAdd ? (SDG_COLOR_MAP[activeSdgForAdd.sdgNumber] || 'var(--text-primary)') : 'var(--text-primary)',
          borderBottom: `2px solid ${activeSdgForAdd ? (SDG_COLOR_MAP[activeSdgForAdd.sdgNumber] || 'var(--border-color)') : 'var(--border-color)'}`,
          pb: 2
        }}>
          Add Keyword to {activeSdgForAdd?.sdgNumber}
        </DialogTitle>
        <DialogContent sx={{ py: 3, mt: 1 }}>
          <TextField
            fullWidth
            autoFocus
            label="New Keyword"
            placeholder="e.g., Sustainability"
            value={newKeywordInput}
            onChange={(e) => setNewKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newKeywordInput.trim()) {
                e.preventDefault();
                handleAddKeywordSubmit();
              }
            }}
            variant="outlined"
            helperText="Enter a keyword and press Enter or click Add."
            sx={{ mt: 1.5 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3, borderTop: '1px solid var(--border-color)' }}>
          <Button 
            onClick={handleCloseAddKeyword} 
            startIcon={<CancelIcon />} 
            color="inherit"
            sx={{
              borderRadius: '10px',
              transition: 'all 0.3s ease',
              '&:hover': {
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.08)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddKeywordSubmit}
            variant="contained"
            startIcon={<AddIcon />}
            disabled={!newKeywordInput.trim()}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              zIndex: 1,
              background: 'var(--gradient-primary)',
              color: '#fff',
              borderRadius: '10px',
              px: 3,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: activeSdgForAdd ? `0 4px 12px ${SDG_COLOR_MAP[activeSdgForAdd.sdgNumber]}40` : '0 4px 12px var(--color-primary-alpha)',
              transition: 'all 0.3s ease',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #15803d 50%, #22c55e 0%, #15803d 50%)',
                opacity: 0,
                zIndex: -1,
                transition: 'opacity 0.4s ease',
              },
              '&:hover': {
                filter: 'brightness(1.1)',
                boxShadow: '0 8px 20px rgba(34, 197, 94, 0.4)',
                transform: 'translateY(-1px)',
                '&::after': {
                  opacity: 1,
                }
              },
              '&.Mui-disabled': {
                background: 'rgba(0, 0, 0, 0.08)',
                'body.dark-mode &': {
                  background: 'rgba(255, 255, 255, 0.05)',
                },
                color: 'var(--text-secondary)',
                boxShadow: 'none',
                '&::after': {
                  display: 'none'
                }
              }
            }}
          >
            Add Keyword
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Keyword Dialog */}
      <Dialog
        open={openEditKeywordDialog}
        onClose={handleCloseEditKeyword}
        maxWidth="xs"
        fullWidth
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
          fontWeight: 850,
          color: activeSdgForEditKw ? (SDG_COLOR_MAP[activeSdgForEditKw.sdgNumber] || 'var(--text-primary)') : 'var(--text-primary)',
          borderBottom: `2px solid ${activeSdgForEditKw ? (SDG_COLOR_MAP[activeSdgForEditKw.sdgNumber] || 'var(--border-color)') : 'var(--border-color)'}`,
          pb: 2
        }}>
          Edit Keyword in {activeSdgForEditKw?.sdgNumber}
        </DialogTitle>
        <DialogContent sx={{ py: 3, mt: 1 }}>
          <TextField
            fullWidth
            autoFocus
            label="Keyword"
            placeholder="e.g., Sustainability"
            value={editKeywordInput}
            onChange={(e) => setEditKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && editKeywordInput.trim()) {
                e.preventDefault();
                handleEditKeywordSubmit();
              }
            }}
            variant="outlined"
            helperText="Modify the keyword and press Enter or click Save."
            sx={{ mt: 1.5 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3, borderTop: '1px solid var(--border-color)' }}>
          <Button 
            onClick={handleCloseEditKeyword} 
            startIcon={<CancelIcon />} 
            color="inherit"
            sx={{
              borderRadius: '10px',
              transition: 'all 0.3s ease',
              '&:hover': {
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.08)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditKeywordSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!editKeywordInput.trim()}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              zIndex: 1,
              background: 'var(--gradient-primary)',
              color: '#fff',
              borderRadius: '10px',
              px: 3,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: activeSdgForEditKw ? `0 4px 12px ${SDG_COLOR_MAP[activeSdgForEditKw.sdgNumber]}40` : '0 4px 12px var(--color-primary-alpha)',
              transition: 'all 0.3s ease',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
                opacity: 0,
                zIndex: -1,
                transition: 'opacity 0.4s ease',
              },
              '&:hover': {
                filter: 'brightness(1.1)',
                boxShadow: '0 8px 20px rgba(34, 197, 94, 0.4)',
                transform: 'translateY(-1px)',
                '&::after': {
                  opacity: 1,
                }
              },
              '&.Mui-disabled': {
                background: 'rgba(0, 0, 0, 0.08)',
                'body.dark-mode &': {
                  background: 'rgba(255, 255, 255, 0.05)',
                },
                color: 'var(--text-secondary)',
                boxShadow: 'none',
                '&::after': {
                  display: 'none'
                }
              }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SDGManagement;
