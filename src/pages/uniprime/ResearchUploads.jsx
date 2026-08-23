import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton
} from "@mui/material";
import { CloudUpload, Download, Close } from "@mui/icons-material";
import { toast } from "sonner";
import axios from "../../api/axios";

const uploadCategories = [
  { id: "bookchapters", title: "Book Chapters", template: "bookchapters.csv" },
  { id: "conferences", title: "Conferences", template: "conferences.csv" },
  { id: "journals", title: "Journals", template: "journals.csv" },
  { id: "novelproducts", title: "Novel Products", template: "novelproducts.csv" },
  { id: "patents", title: "Patents", template: "patents.csv" },
  { id: "phdscholars", title: "PhD Scholars", template: "phdscholars.csv" },
  { id: "projects_consultancy", title: "Projects & Consultancy", template: "projects_consultancy.csv" },
  { id: "textbooks", title: "Textbooks", template: "textbooks.csv" }
];

const ResearchUploads = () => {
  const [uploading, setUploading] = useState({}); // Track uploading state per category
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportCategory, setReportCategory] = useState("");

  const handleDownload = (templateName) => {
    const link = document.createElement("a");
    link.href = `/templates/${templateName}`;
    link.setAttribute("download", templateName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = async (e, categoryId) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a valid CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading((prev) => ({ ...prev, [categoryId]: true }));
    
    try {
      const res = await axios.post(`/api/research-uploads/${categoryId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      
      if (res.data.success) {
        toast.success(res.data.message || `${categoryId} data uploaded successfully!`);
      } else {
        if (res.data.results && (res.data.results.skips > 0 || res.data.results.errs > 0)) {
          setReportCategory(categoryId);
          setReportData(res.data.results);
          setReportModalOpen(true);
        } else {
          const errorMessage = res.data.message || `Failed to upload ${categoryId}`;
          if (errorMessage.includes("Details:")) {
            const [mainMsg, details] = errorMessage.split("Details:");
            toast.error(mainMsg.trim(), {
              description: details.trim(),
              duration: 8000,
            });
          } else {
            toast.error(errorMessage, { duration: 5000 });
          }
        }
      }
    } catch (err) {
      if (err.response?.data?.results && (err.response.data.results.skips > 0 || err.response.data.results.errs > 0)) {
        setReportCategory(categoryId);
        setReportData(err.response.data.results);
        setReportModalOpen(true);
      } else {
        const errorMessage = err.response?.data?.message || `An error occurred while uploading ${categoryId}`;
        if (errorMessage.includes("Details:")) {
          const [mainMsg, details] = errorMessage.split("Details:");
          toast.error(mainMsg.trim(), {
            description: details.trim(),
            duration: 8000,
          });
        } else {
          toast.error(errorMessage, { duration: 5000 });
        }
      }
    } finally {
      setUploading((prev) => ({ ...prev, [categoryId]: false }));
      // Reset input value to allow uploading same file again
      e.target.value = null;
    }
  };

  return (
    <Box sx={{ p: 4, mt: "20px" }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: "var(--text-primary)" }}>
        Research Data Uploads
      </Typography>
      <Typography variant="body1" sx={{ color: "text.secondary", mb: 4 }}>
        Download the specific template, fill in the data, and upload the CSV to batch import records.
      </Typography>

      <Grid container spacing={3}>
        {uploadCategories.map((cat) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={cat.id}>
            <Card sx={{ 
              height: "100%", 
              background: "var(--bg-panel)", 
              borderRadius: "16px",
              boxShadow: "var(--shadow-premium)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}>
              <CardContent sx={{ flexGrow: 1, textAlign: "center", py: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: "var(--text-primary)" }}>
                  {cat.title}
                </Typography>
                
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => handleDownload(cat.template)}
                    sx={{ width: "100%", textTransform: "none", borderRadius: "8px", py: 1 }}
                  >
                    Template
                  </Button>
                  
                  <input
                    accept=".csv"
                    style={{ display: "none" }}
                    id={`upload-${cat.id}`}
                    type="file"
                    onChange={(e) => handleFileChange(e, cat.id)}
                  />
                  <label htmlFor={`upload-${cat.id}`} style={{ width: "100%" }}>
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={uploading[cat.id] ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                      disabled={uploading[cat.id]}
                      sx={{ 
                        width: "100%", 
                        textTransform: "none", 
                        borderRadius: "8px",
                        py: 1,
                        bgcolor: "var(--primary-color)",
                        '&:hover': { bgcolor: "var(--primary-hover)" }
                      }}
                    >
                      {uploading[cat.id] ? "Uploading..." : "Upload CSV"}
                    </Button>
                  </label>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Upload Report Dialog */}
      <Dialog 
        open={reportModalOpen} 
        onClose={() => setReportModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "var(--bg-panel)", color: "var(--text-primary)" }}>
          <Typography variant="h6" fontWeight="bold">
            Upload Report: {reportCategory.toUpperCase()}
          </Typography>
          <IconButton onClick={() => setReportModalOpen(false)} sx={{ color: "var(--text-secondary)" }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "var(--bg-paper)", color: "var(--text-primary)" }}>
          {reportData && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Summary Cards */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 3 }}>
                  <Card sx={{ bgcolor: "var(--bg-panel)", textAlign: "center", p: 2, border: "1px solid var(--border-color)" }}>
                    <Typography variant="body2" color="text.secondary">Total Rows</Typography>
                    <Typography variant="h5" fontWeight="bold">{reportData.totalRows || 0}</Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Card sx={{ bgcolor: "var(--bg-panel)", textAlign: "center", p: 2, border: "1px solid var(--border-color)" }}>
                    <Typography variant="body2" color="success.main">Success</Typography>
                    <Typography variant="h5" fontWeight="bold" color="success.main">{reportData.successCount || 0}</Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Card sx={{ bgcolor: "var(--bg-panel)", textAlign: "center", p: 2, border: "1px solid var(--border-color)" }}>
                    <Typography variant="body2" color="warning.main">Skipped</Typography>
                    <Typography variant="h5" fontWeight="bold" color="warning.main">{reportData.skips || 0}</Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Card sx={{ bgcolor: "var(--bg-panel)", textAlign: "center", p: 2, border: "1px solid var(--border-color)" }}>
                    <Typography variant="body2" color="error.main">Failed</Typography>
                    <Typography variant="h5" fontWeight="bold" color="error.main">{reportData.errs || 0}</Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Error Table */}
              {(reportData.skipDetails?.length > 0 || reportData.errorDetails?.length > 0) && (
                <TableContainer component={Paper} sx={{ bgcolor: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "none" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "rgba(0,0,0,0.05)" }}>
                        <TableCell sx={{ fontWeight: "bold", width: "100px" }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: "bold", width: "100px" }}>Row No.</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.errorDetails?.map((err, idx) => (
                        <TableRow key={`err-${idx}`}>
                          <TableCell>
                            <Chip label="Error" color="error" size="small" />
                          </TableCell>
                          <TableCell>{err.row}</TableCell>
                          <TableCell>{err.reason}</TableCell>
                        </TableRow>
                      ))}
                      {reportData.skipDetails?.map((skip, idx) => (
                        <TableRow key={`skip-${idx}`}>
                          <TableCell>
                            <Chip label="Skipped" color="warning" size="small" />
                          </TableCell>
                          <TableCell>{skip.row}</TableCell>
                          <TableCell>{skip.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: "var(--bg-panel)", p: 2 }}>
          <Button onClick={() => setReportModalOpen(false)} variant="contained" sx={{ bgcolor: "var(--primary-color)" }}>
            Close Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResearchUploads;
