import { useState, useEffect } from "react";
import { Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from "@mui/material";
import { toast } from "sonner";
import { AddCircle, Delete } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn,
  labelStyle, MONTHS, YEARS
} from "../../components/faculty/PublicationFormFields";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

const PATENT_STATUSES = ["Filed", "Published", "Granted", "Abandoned"];

export default function PatentPublication() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("list"); // 'list', 'select-year', 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [publicationsList, setPublicationsList] = useState([]);

  const [form, setForm] = useState({
    title: "", applicantName: "", area: "", filingNo: "", dateOfFiling: "",
    status: "", coInventors: [], month: "", year: "",
    applyIncentive: ""
  });
  const [files, setFiles] = useState({ eFilingReceipt: null, form1: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/api/research/patent").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => console.log("Failed to fetch patents", err));

    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => console.log("Failed to fetch academic years", err));
  }, [viewMode]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setFile = (k) => (e) => setFiles((p) => ({ ...p, [k]: e.target.files[0] }));

  const handleAddCoInventor = () => {
    setForm(p => ({ ...p, coInventors: [...p.coInventors, { name: "", affiliation: "" }] }));
  };

  const handleRemoveCoInventor = (index) => {
    setForm(p => ({ ...p, coInventors: p.coInventors.filter((_, i) => i !== index) }));
  };

  const handleUpdateCoInventor = (index, field, value) => {
    const updated = [...form.coInventors];
    updated[index][field] = value;
    setForm(p => ({ ...p, coInventors: updated }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.filingNo) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "coInventors") {
          fd.append(k, JSON.stringify(v));
        } else {
          fd.append(k, v);
        }
      });
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });
      fd.append("academicYear", selectedYear);
      fd.append("college", user?.college || "");
      fd.append("panNumber", user?.panNumber || "");

      await API.post("/api/research/patent", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Patent submitted successfully!");
      setForm({ title: "", applicantName: "", area: "", filingNo: "", dateOfFiling: "", status: "", coInventors: [], month: "", year: "", applyIncentive: "" });
      setFiles({ eFilingReceipt: null, form1: null });
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
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>My Patent Publications</Typography>
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
          Apply New
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
        <Table>
          <TableHead sx={{ background: "var(--gradient-primary)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Area</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Filing No</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(!publicationsList || publicationsList.length === 0) ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No previous publications found. Click "Apply New" to submit one.
                </TableCell>
              </TableRow>
            ) : (
              publicationsList.map((pub, i) => (
                <TableRow key={pub._id || i}>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>{pub.title || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.area || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.filingNo || "N/A"}</TableCell>
                  <TableCell sx={{ py: 2 }}><Typography variant="body2" sx={{ color: "#10b981", fontWeight: 700, background: "rgba(16, 185, 129, 0.1)", px: 1.5, py: 0.5, borderRadius: "6px", display: "inline-block" }}>Submitted</Typography></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderSelectYear = () => (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 5 }}>
      <FormCard title="Select Academic Year">
        <Typography sx={{ mb: 2, color: "var(--text-secondary)", fontWeight: 500 }}>Please select the academic year for this publication submission:</Typography>
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
    <FormCard title="Patent Submission">
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 0.8, borderRadius: "8px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
        <Button size="small" variant="text" onClick={() => setViewMode("select-year")} sx={{ fontWeight: 700, textTransform: "none", color: "var(--color-primary)" }}>Change Year</Button>
      </Box>

      <FacultyInfoRow />

      <SubLabel text="Details of the Patent:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Title of the Patent :</Typography>
          <TextField size="small" fullWidth multiline rows={2} value={form.title} onChange={set("title")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Name of the Applicant in Patent:</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applicantName} onChange={set("applicantName")}>
            <MenuItem value="">--Select--</MenuItem>
            <MenuItem value={user?.name}>{user?.name}</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Area of Patent :</Typography>
          <TextField size="small" fullWidth value={form.area} onChange={set("area")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Patent Filing No :</Typography>
          <TextField size="small" fullWidth value={form.filingNo} onChange={set("filingNo")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Date of filing :</Typography>
          <TextField size="small" fullWidth type="date" value={form.dateOfFiling} onChange={set("dateOfFiling")} InputLabelProps={{ shrink: true }} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Status of Patent Application :</Typography>
          <Select size="small" fullWidth displayEmpty value={form.status} onChange={set("status")}>
            <MenuItem value="">--Select--</MenuItem>
            {PATENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </Box>
        <Box sx={{ gridColumn: { sm: "1 / -1" }, mt: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography sx={labelStyle}>Name & affiliation of Co-Inventors :</Typography>
            <Button startIcon={<AddCircle />} onClick={handleAddCoInventor} sx={{ textTransform: "none", fontWeight: 700, color: "var(--color-primary)" }}>Add Co-Inventor</Button>
          </Box>
          {form.coInventors.map((co, idx) => (
            <Box key={idx} sx={{ display: "flex", gap: 2, mb: 2, p: 2, background: "var(--bg-accent-1)", borderRadius: "12px", alignItems: "center" }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", mb: 0.5 }}>CO-INVENTOR NAME</Typography>
                <TextField size="small" fullWidth placeholder="Name" value={co.name} onChange={(e) => handleUpdateCoInventor(idx, "name", e.target.value)} />
              </Box>
              <Box sx={{ flex: 2 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", mb: 0.5 }}>AFFILIATION</Typography>
                <TextField size="small" fullWidth placeholder="College / Organization" value={co.affiliation} onChange={(e) => handleUpdateCoInventor(idx, "affiliation", e.target.value)} />
              </Box>
              <IconButton onClick={() => handleRemoveCoInventor(idx)} sx={{ mt: 2, color: "var(--text-secondary)" }}><Delete /></IconButton>
            </Box>
          ))}
        </Box>
      </Grid2>

      <Grid2 sx={{ mt: 2 }}>
        <Box>
          <Typography sx={labelStyle}>Month :</Typography>
          <Select size="small" fullWidth displayEmpty value={form.month} onChange={set("month")}>
            <MenuItem value="">--Select--</MenuItem>
            {MONTHS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Year :</Typography>
          <TextField size="small" fullWidth value={form.year} onChange={set("year")} placeholder="YYY" inputProps={{ maxLength: 4 }} />
        </Box>
      </Grid2>

      <NoteBox />

      <Grid2 sx={{ mt: 1 }}>
        <FileField label="e-Filing Receipt:" name="eFilingReceipt" onChange={setFile("eFilingReceipt")} />
        <FileField label="Form -1" name="form1" onChange={setFile("form1")} />
        <Box sx={{ mt: 1 }}>
          <Typography sx={labelStyle}>Whether you want to apply for incentive?</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyIncentive} onChange={set("applyIncentive")}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
        {form.applyIncentive === "Yes" && (
          <Box sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>Expected Amount:</Typography>
            <TextField size="small" value="1500" disabled sx={{ "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#10b981", fontWeight: 800, background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px" } }} />
          </Box>
        )}
      </Grid2>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4 }}>
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

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 } }}>
      <PageHeader title="Patent" subtitle="Manage and submit your patent application details" breadcrumbs={["Home", "Publications", "Patent"]} />

      {viewMode === "list" && renderList()}
      {viewMode === "select-year" && renderSelectYear()}
      {viewMode === "form" && renderForm()}

    </Box>
  );
}
