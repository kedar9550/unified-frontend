import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Box, TextField, MenuItem, Select, Typography, Button, Grid
} from "@mui/material";
import { toast } from "sonner";
import { Search, AttachFile, Person } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/design-system/PageContainer";
import {
  FormCard, FieldLabel, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import API from "../../api/axios";

export default function RndPatentDataEntry() {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  const [targetFacultyEmpId, setTargetFacultyEmpId] = useState("");
  const [targetFacultyName, setTargetFacultyName] = useState("");
  const [isTargetFacultyValid, setIsTargetFacultyValid] = useState(false);
  const [verifyingFaculty, setVerifyingFaculty] = useState(false);
  const [targetFacultyDetails, setTargetFacultyDetails] = useState(null);

  const [form, setForm] = useState({
    title: "", patentNumber: "", country: "India", patentStatus: "Filed",
    filingDate: "", publicationDate: "", grantDate: "", applicantName: "",
    commercialized: "No", earnings: "", applyIncentive: "",
    totalInventors: 1, userInventorPosition: 1, otherInventors: []
  });
  const [files, setFiles] = useState({ patentProof: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/api/academic-years").then(res => {
      const years = res.data?.years || res.data?.data || [];
      setAcademicYears(years);
      const activeYear = years.find(y => y.isActive);
      if (activeYear) setSelectedYear(activeYear._id);
      else if (years.length > 0) setSelectedYear(years[0]._id);
    }).catch(err => console.log("Failed to fetch academic years", err));
  }, []);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleVerifyFaculty = async () => {
    if (!targetFacultyEmpId.trim()) {
      toast.error("Please enter Employee ID");
      return;
    }
    setVerifyingFaculty(true);
    try {
      const res = await API.get(`/api/employees/by-empid/${targetFacultyEmpId.trim()}`);
      if (res.data?.success && res.data?.data) {
        const emp = res.data.data;
        if (emp.isActive) {
          setTargetFacultyName(emp.name);
          setIsTargetFacultyValid(true);
          setTargetFacultyDetails(emp);
          toast.success(`Faculty Verified: ${emp.name}`);
        } else {
          toast.error("Faculty record found but is inactive.");
          setIsTargetFacultyValid(false);
        }
      } else {
        toast.error("Faculty not found with given Employee ID");
        setIsTargetFacultyValid(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to verify faculty");
      setIsTargetFacultyValid(false);
    } finally {
      setVerifyingFaculty(false);
    }
  };

  const handleSubmit = async () => {
    if (!targetFacultyEmpId || !isTargetFacultyValid) {
      toast.error("Please verify a valid Target Faculty Employee ID first");
      return;
    }
    if (!form.title || !form.patentNumber || !form.country || !form.patentStatus) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => {
        if (k === "otherInventors") {
          fd.append(k, JSON.stringify(form[k]));
        } else {
          fd.append(k, form[k]);
        }
      });

      fd.append("academicYear", selectedYear);
      fd.append("isDirectEntry", "true");
      fd.append("targetFacultyEmpId", targetFacultyEmpId);

      if (files.patentProof) fd.append("patentProof", files.patentProof);

      await API.post("/api/research/patent", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Patent record added directly for faculty!");
      setForm({
        title: "", patentNumber: "", country: "India", patentStatus: "Filed",
        filingDate: "", publicationDate: "", grantDate: "", applicantName: "",
        commercialized: "No", earnings: "", applyIncentive: "",
        totalInventors: 1, userInventorPosition: 1, otherInventors: []
      });
      setFiles({ patentProof: null });
      setTargetFacultyEmpId("");
      setIsTargetFacultyValid(false);
      setTargetFacultyDetails(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit patent publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Patent Data Entry (R&D Direct Entry)"
        subtitle="Add patent records directly on behalf of faculty members"
      />

      <FormCard title="1. Target Faculty Identification">
        <Grid container spacing={2.5} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Target Faculty Employee ID</FieldLabel>
            <TextField
              fullWidth size="small" placeholder="e.g. 10024"
              value={targetFacultyEmpId}
              onChange={(e) => {
                setTargetFacultyEmpId(e.target.value);
                setIsTargetFacultyValid(false);
                setTargetFacultyDetails(null);
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ mt: 2.5 }}>
            <Button
              variant="contained"
              onClick={handleVerifyFaculty}
              disabled={verifyingFaculty || !targetFacultyEmpId}
              startIcon={<Search />}
              sx={{ background: "var(--gradient-primary)", color: "#fff", textTransform: "none", fontWeight: 700 }}
            >
              {verifyingFaculty ? "Verifying..." : "Verify Faculty"}
            </Button>
          </Grid>
          {isTargetFacultyValid && targetFacultyDetails && (
            <Grid item xs={12}>
              <Box sx={{ p: 2, background: "rgba(16, 185, 129, 0.08)", border: "1px solid #10b981", borderRadius: "10px" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#065f46" }}>
                  ✓ Verified: {targetFacultyDetails.name} ({targetFacultyDetails.designation || "Faculty"} - {targetFacultyDetails.department || "Dept"})
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </FormCard>

      <FormCard title="2. Patent Details">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel>Academic Year</FieldLabel>
            <Select fullWidth size="small" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {academicYears.map(y => <MenuItem key={y._id} value={y._id}>{y.yearRange}</MenuItem>)}
            </Select>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Patent Title</FieldLabel>
            <TextField fullWidth size="small" value={form.title} onChange={set("title")} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Patent Application / Registration Number</FieldLabel>
            <TextField fullWidth size="small" value={form.patentNumber} onChange={set("patentNumber")} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Country</FieldLabel>
            <TextField fullWidth size="small" value={form.country} onChange={set("country")} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Patent Status</FieldLabel>
            <Select fullWidth size="small" value={form.patentStatus} onChange={set("patentStatus")}>
              <MenuItem value="Filed">Filed</MenuItem>
              <MenuItem value="Published">Published</MenuItem>
              <MenuItem value="Granted">Granted</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel>Filing Date</FieldLabel>
            <TextField fullWidth type="date" size="small" InputLabelProps={{ shrink: true }} value={form.filingDate} onChange={set("filingDate")} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel>Publication Date</FieldLabel>
            <TextField fullWidth type="date" size="small" InputLabelProps={{ shrink: true }} value={form.publicationDate} onChange={set("publicationDate")} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel>Grant Date</FieldLabel>
            <TextField fullWidth type="date" size="small" InputLabelProps={{ shrink: true }} value={form.grantDate} onChange={set("grantDate")} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel>Applicant Name</FieldLabel>
            <TextField fullWidth size="small" value={form.applicantName} onChange={set("applicantName")} />
          </Grid>
        </Grid>
      </FormCard>

      <FormCard title="3. Attachments" icon={<AttachFile sx={{ color: "var(--color-primary)" }} />}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <FieldLabel required>Patent Proof Document</FieldLabel>
            <FileField onChange={(e) => setFiles(p => ({ ...p, patentProof: e.target.files[0] }))} />
          </Grid>
        </Grid>
      </FormCard>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <SubmitBtn onClick={handleSubmit} disabled={loading || !isTargetFacultyValid}>
          {loading ? "Submitting..." : "Submit Record Directly"}
        </SubmitBtn>
      </Box>
    </PageContainer>
  );
}
