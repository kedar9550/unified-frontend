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
  Alert,
  CircularProgress,
  Tooltip,
  Grid,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AutoFixHigh as AutoFixHighIcon,
} from "@mui/icons-material";
import API from "../../api/axios";

const SDGManagement = () => {
  const [sdgs, setSdgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
      setError("Failed to fetch SDGs");
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
        setSuccess("SDG updated successfully");
      } else {
        await API.post("/api/sdgs", payload);
        setSuccess("SDG created successfully");
      }
      fetchSdgs();
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save SDG");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this SDG?")) {
      try {
        await API.delete(`/api/sdgs/${id}`);
        setSuccess("SDG deleted successfully");
        fetchSdgs();
      } catch (err) {
        setError("Failed to delete SDG");
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            SDG Keywords Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage Sustainable Development Goals and their associated keywords for document analysis.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: "10px", px: 3 }}
        >
          Add New SDG
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: "15px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
          <Table>
            <TableHead sx={{ bgcolor: "var(--bg-panel)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: "120px" }}>SDG #</TableCell>
                <TableCell sx={{ fontWeight: 700, width: "250px" }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Keywords</TableCell>
                <TableCell sx={{ fontWeight: 700, width: "120px", textAlign: "right" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sdgs.map((sdg) => (
                <TableRow key={sdg._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{sdg.sdgNumber}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{sdg.sdgTitle}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {sdg.keywords.map((kw, i) => (
                        <Chip
                          key={i}
                          label={kw}
                          size="small"
                          sx={{
                            fontSize: "0.7rem",
                            bgcolor: "rgba(0,0,0,0.05)",
                            borderRadius: "4px"
                          }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <Tooltip title="Edit">
                        <IconButton color="primary" onClick={() => handleOpenDialog(sdg)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => handleDelete(sdg._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isEdit ? "Edit SDG Keywords" : "Add New SDG"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={4}>
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
            <Grid item xs={8}>
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
            <Grid item xs={12}>
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
          >
            {isEdit ? "Update SDG" : "Create SDG"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SDGManagement;
