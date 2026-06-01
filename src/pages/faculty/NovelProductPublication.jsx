import { useState, useEffect } from "react";
import { Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Grid, Card, Chip, Divider } from "@mui/material";
import { toast } from "sonner";
import { AddCircle, Delete, Close, Description, Download, AttachFile, Groups, WorkspacePremium } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn,
  labelStyle
} from "../../components/faculty/PublicationFormFields";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

const CATEGORIES = ["Developed", "Implemented"];

export default function NovelProductPublication() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("list"); // 'list', 'select-year', 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [publicationsList, setPublicationsList] = useState([]);
  const [selectedPubDetails, setSelectedPubDetails] = useState(null);

  const [form, setForm] = useState({
    productName: "",
    description: "",
    category: "",
    organizationName: "",
    remarks: ""
  });
  
  const [files, setFiles] = useState({ document: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/api/research/novel-product").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => console.log("Failed to fetch novel products", err));

    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => console.log("Failed to fetch academic years", err));
  }, [viewMode]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setFile = (k) => (e) => setFiles((p) => ({ ...p, [k]: e.target.files[0] }));

  const handleSubmit = async () => {
    if (!form.productName || !form.description || !form.category) {
      toast.error("Please fill all mandatory fields");
      return;
    }
    if (form.category === "Implemented" && (!form.organizationName || !form.organizationName.trim())) {
      toast.error("Organization Name is mandatory when Category is Implemented");
      return;
    }
    if (!files.document) {
      toast.error("At least one supporting document/proof is mandatory");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("productName", form.productName);
      fd.append("description", form.description);
      fd.append("category", form.category);
      if (form.category === "Implemented") {
        fd.append("organizationName", form.organizationName);
      }
      fd.append("remarks", form.remarks);
      fd.append("document", files.document);
      fd.append("academicYear", selectedYear);

      await API.post("/api/research/novel-product", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Novel Product/Technology submitted successfully!");
      
      // Reset form
      setForm({ productName: "", description: "", category: "", organizationName: "", remarks: "" });
      setFiles({ document: null });
      setSelectedYear("");
      setViewMode("list");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const renderList = () => (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>My Novel Products / Technology</Typography>
        <Button
          variant="contained"
          onClick={() => setViewMode("select-year")}
          sx={{
            background: "var(--gradient-primary)",
            borderRadius: "12px",
            px: 3,
            fontWeight: 700,
            textTransform: "none",
            "&:hover": {
              opacity: 0.9,
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            },
            transition: "all 0.2s ease"
          }}
        >
          Add Product / Tech
        </Button>
      </Box>
      {(!publicationsList || publicationsList.length === 0) ? (
        <Box sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 8,
          px: 3,
          background: "var(--bg-panel)",
          borderRadius: "16px",
          border: "1px dashed var(--border-color)",
          boxShadow: "var(--shadow-premium)",
          textAlign: "center"
        }}>
          <Typography variant="h6" sx={{ color: "var(--text-secondary)", fontWeight: 600, mb: 1 }}>
            No Product Submissions
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
            You haven't submitted any novel product details yet. Click the "Add Product / Tech" button to submit your first entry.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
          <Table>
            <TableHead sx={{ background: "var(--gradient-primary)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Product Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Organization Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Academic Year</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Approval Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {publicationsList.map((pub, i) => (
                <TableRow key={pub._id || i}>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 600, py: 2 }}>{pub.productName || "N/A"}</TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Chip 
                      label={pub.category} 
                      size="small" 
                      sx={{ 
                        fontWeight: 800, 
                        bgcolor: pub.category === "Developed" ? "rgba(139, 92, 246, 0.1)" : "rgba(245, 158, 11, 0.1)",
                        color: pub.category === "Developed" ? "#8B5CF6" : "#D97706",
                        borderRadius: "6px"
                      }} 
                    />
                  </TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.organizationName || "—"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.academicYear?.year || "N/A"}</TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: pub.status?.includes('Rejected') ? "#ef4444" : pub.status === 'Approved' ? "#10b981" : "#e8a000",
                        fontWeight: 700,
                        background: pub.status?.includes('Rejected') ? "rgba(239, 68, 68, 0.1)" : pub.status === 'Approved' ? "rgba(16, 185, 129, 0.1)" : "rgba(232, 160, 0, 0.1)",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "6px",
                        display: "inline-block"
                      }}
                    >
                      {pub.status || "Pending"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setSelectedPubDetails(pub)}
                      sx={{
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: 700,
                        borderColor: "var(--color-primary)",
                        color: "var(--color-primary)",
                        "&:hover": {
                          background: "var(--bg-accent-1)",
                          borderColor: "var(--color-primary)"
                        }
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );

  const renderSelectYear = () => (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 5 }}>
      <FormCard title="Select Academic Year">
        <Typography sx={{ mb: 2, color: "var(--text-secondary)", fontWeight: 500 }}>Please select the academic year for this entry:</Typography>
        <Select
          fullWidth
          size="small"
          displayEmpty
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          <MenuItem value="" disabled>Select Academic Year</MenuItem>
          {academicYears.map(y => (
            <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
          ))}
        </Select>
        <Box sx={{ display: "flex", gap: 2, mt: 4, justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            onClick={() => setViewMode("list")}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              color: "var(--text-primary)",
              borderColor: "var(--border-color)",
              "&:hover": {
                borderColor: "var(--color-primary)",
                background: "rgba(0,0,0,0.02)"
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!selectedYear}
            onClick={() => setViewMode("form")}
            sx={{
              background: "var(--gradient-primary)",
              borderRadius: "12px",
              px: 4,
              fontWeight: 700,
              textTransform: "none",
              "&:hover": {
                opacity: 0.9,
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              },
              "&.Mui-disabled": {
                background: "var(--bg-panel)",
                color: "var(--text-secondary)",
                opacity: 0.5
              },
              transition: "all 0.2s ease"
            }}
          >
            Proceed
          </Button>
        </Box>
      </FormCard>
    </Box>
  );

  const renderForm = () => (
    <FormCard title="Product / Technology Submission">
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 0.8, borderRadius: "8px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
        <Button size="small" variant="text" onClick={() => setViewMode("select-year")} sx={{ fontWeight: 700, textTransform: "none", color: "var(--color-primary)" }}>Change Year</Button>
      </Box>

      <FacultyInfoRow />

      <SubLabel text="Product / Technology Details:" />
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Typography sx={labelStyle}>Product / Technology Name : *</Typography>
          <TextField size="small" fullWidth value={form.productName} onChange={set("productName")} placeholder="e.g. Smart IoT Agri-Device" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography sx={labelStyle}>Category : *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.category} onChange={set("category")}>
            <MenuItem value="" disabled>--Select Category--</MenuItem>
            {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </Grid>

        {form.category === "Implemented" && (
          <Grid item xs={12}>
            <Typography sx={labelStyle}>Organization Name (where Implemented) : *</Typography>
            <TextField size="small" fullWidth value={form.organizationName} onChange={set("organizationName")} placeholder="Name of company or community center" />
          </Grid>
        )}

        <Grid item xs={12}>
          <Typography sx={labelStyle}>Description of Novel Product / Technology : *</Typography>
          <TextField size="small" fullWidth multiline rows={6} value={form.description} onChange={set("description")} placeholder="Provide detailed specifications, utility, and outcomes of the product..." />
        </Grid>

        <Grid item xs={12}>
          <Typography sx={labelStyle}>Additional remarks (Optional) :</Typography>
          <TextField size="small" fullWidth multiline rows={2} value={form.remarks} onChange={set("remarks")} placeholder="Optional details..." />
        </Grid>
      </Grid>

      <NoteBox />

      <Box sx={{ mt: 3, maxWidth: 500 }}>
        <FileField label="Product Documentation / Technical Report / Implementation Proof : *" name="document" onChange={setFile("document")} />
      </Box>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 5 }}>
        <Button
          variant="outlined"
          onClick={() => setViewMode("list")}
          sx={{
            px: 4,
            height: "44px",
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 600,
            color: "var(--text-primary)",
            borderColor: "var(--border-color)",
            "&:hover": {
              borderColor: "#ef4444",
              color: "#ef4444",
              background: "rgba(239, 68, 68, 0.05)"
            },
            transition: "all 0.3s ease"
          }}
        >
          Cancel
        </Button>
        <SubmitBtn onClick={handleSubmit} loading={loading} />
      </Box>
    </FormCard>
  );

  const handleCloseDetails = () => setSelectedPubDetails(null);

  const LabelValueDetails = ({ label, value, chip, horizontal = false }) => (
    <Box sx={{
      p: horizontal ? "10px 16px" : 1.5,
      borderRadius: "10px",
      background: horizontal ? "transparent" : "rgba(255,255,255,0.02)",
      display: "flex",
      flexDirection: horizontal ? "row" : "column",
      alignItems: horizontal ? "center" : "flex-start",
      justifyContent: horizontal ? "flex-start" : "center",
      gap: horizontal ? 2 : 0.5,
      borderBottom: horizontal ? "1px solid var(--border-color)" : "1px solid transparent",
      "&:last-child": { borderBottom: "none" },
    }}>
      <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800, fontSize: "0.65rem", mb: horizontal ? 0 : 0.5 }}>{label}</Typography>
      <Box sx={{ flex: horizontal ? 1 : "none" }}>
        {chip ? chip : <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.85rem" }}>{value || "-"}</Typography>}
      </Box>
    </Box>
  );

  const renderDetailFile = (title, filepath, folder = "novelProducts") => {
    if (!filepath) return null;
    const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
    let normalizedPath = filepath.replace(/\\/g, '/');
    if (!normalizedPath.startsWith('http') && !normalizedPath.includes('uploads/')) {
      normalizedPath = `/uploads/${folder}/${normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath}`;
    }
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    const fileUrl = normalizedPath.startsWith('http') ? normalizedPath : `${backendURL}${cleanPath}`;
    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(normalizedPath);

    return (
      <Box sx={{ flex: "1 1 200px", maxWidth: 300 }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.7rem", textTransform: "uppercase", display: "block", mb: 1 }}>{title}</Typography>
        <Box sx={{
          height: 120, display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid var(--border-color)", background: "var(--bg-panel)", borderRadius: "8px",
          overflow: "hidden", cursor: "pointer", transition: "all 0.2s ease",
          "&:hover": { borderColor: "var(--color-primary)", transform: "translateY(-2px)" }
        }} onClick={() => window.open(fileUrl, '_blank')}>
          {isImage ? <img src={fileUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Box sx={{ textAlign: "center" }}><Description sx={{ fontSize: 24, color: "var(--text-secondary)", mb: 0.5 }} /><Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, display: "block" }}>PDF PROOF</Typography></Box>}
        </Box>
      </Box>
    );
  };

  const renderDetailsDialog = () => {
    if (!selectedPubDetails) return null;
    const data = selectedPubDetails;
    const statusColor = (() => {
      const s = data.status || "";
      if (/Pending/i.test(s)) return "#ff9800";
      if (/Approved/i.test(s)) return "#4caf50";
      if (/Rejected/i.test(s)) return "#f44336";
      return "#666";
    })();

    return (
      <Dialog 
        open={!!selectedPubDetails} 
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            background: "var(--bg-glass)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)",
          }
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--gradient-primary)", color: "#fff", py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <WorkspacePremium sx={{ color: "#fff" }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Product / Technology Details</Typography>
          </Box>
          <IconButton onClick={handleCloseDetails} sx={{ color: "#fff" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 1 }}>{data.productName}</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Academic Year" value={data.academicYear?.year || "N/A"} /></Grid>
            <Grid item xs={12} sm={3}>
              <LabelValueDetails 
                label="Category" 
                chip={
                  <Chip 
                    label={data.category} 
                    size="small" 
                    sx={{ 
                      bgcolor: data.category === "Developed" ? "rgba(139, 92, 246, 0.15)" : "rgba(245, 158, 11, 0.15)", 
                      color: data.category === "Developed" ? "#8B5CF6" : "#D97706", 
                      fontWeight: 800, 
                      borderRadius: "6px" 
                    }} 
                  />
                } 
              />
            </Grid>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Organization Name" value={data.organizationName || "—"} /></Grid>
            <Grid item xs={12} sm={3}>
              <LabelValueDetails 
                label="Approval Status" 
                chip={
                  <Chip 
                    label={data.status} 
                    size="small" 
                    sx={{ 
                      bgcolor: `${statusColor}15`, 
                      color: statusColor, 
                      fontWeight: 800, 
                      border: `1px solid ${statusColor}44`,
                      borderRadius: "6px" 
                    }} 
                  />
                } 
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "var(--color-primary)", textTransform: "uppercase", fontSize: "0.75rem", mb: 1 }}>Description / Highlights</Typography>
            <Typography variant="body2" sx={{ color: "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{data.description}</Typography>
          </Box>

          {data.remarks && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "var(--color-primary)", textTransform: "uppercase", fontSize: "0.75rem", mb: 1 }}>Additional Remarks</Typography>
              <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>{data.remarks}</Typography>
            </Box>
          )}

          {/* Attached Files previews */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 2 }}>
              <AttachFile sx={{ color: "var(--color-primary)" }} />
              <Typography sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Attached Supporting Document</Typography>
            </Box>
            <Box>
              {renderDetailFile("Documentation / Implementation Proof", data.document)}
            </Box>
          </Box>

          {/* Remarks/Comments if available */}
          {(data.hodComment || data.rndComment) && (
            <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 2 }}>
              {data.hodComment && (
                <Box sx={{ p: 2, bgcolor: "rgba(255, 193, 7, 0.05)", borderRadius: "10px", border: "1px solid rgba(255, 193, 7, 0.2)" }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: "#ff9800", textTransform: "uppercase" }}>HOD Remarks</Typography>
                  <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5, color: "var(--text-secondary)" }}>"{data.hodComment}"</Typography>
                </Box>
              )}
              {data.rndComment && (
                <Box sx={{ p: 2, bgcolor: "rgba(76, 175, 80, 0.05)", borderRadius: "10px", border: "1px solid rgba(76, 175, 80, 0.2)" }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: "#4caf50", textTransform: "uppercase" }}>R&D Remarks</Typography>
                  <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5, color: "var(--text-secondary)" }}>"{data.rndComment}"</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid var(--border-color)" }}>
          <Button onClick={handleCloseDetails} sx={{ color: "var(--text-primary)", fontWeight: 700 }}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader 
        title="Novel Products / Technology (Developed or Implemented)" 
        subtitle="Manage and submit details of novel products, software, or technologies you developed or implemented" 
        breadcrumbs={["Home", "Research", "Novel Products"]}
      />
      <Box sx={{ mt: 3 }}>
        {viewMode === "list" && renderList()}
        {viewMode === "select-year" && renderSelectYear()}
        {viewMode === "form" && renderForm()}
      </Box>
      {renderDetailsDialog()}
    </Box>
  );
}
