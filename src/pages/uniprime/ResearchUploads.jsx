import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress
} from "@mui/material";
import { CloudUpload, Download } from "@mui/icons-material";
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
        toast.error(res.data.message || `Failed to upload ${categoryId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `An error occurred while uploading ${categoryId}`);
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
    </Box>
  );
};

export default ResearchUploads;
