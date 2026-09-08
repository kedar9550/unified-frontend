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

export default function RndPhdScholarDataEntry() {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  const [targetFacultyEmpId, setTargetFacultyEmpId] = useState("");
  const [targetFacultyName, setTargetFacultyName] = useState("");
  const [isTargetFacultyValid, setIsTargetFacultyValid] = useState(false);
  const [verifyingFaculty, setVerifyingFaculty] = useState(false);
  const [targetFacultyDetails, setTargetFacultyDetails] = useState(null);

  const [form, setForm] = useState({
    scholarName: "", rollNo: "", researchTopic: "", guideType: "Main Guide",
    university: "", registrationYear: "", status: "Ongoing", awardYear: "", applyIncentive: "No"
  });
  const [files, setFiles] = useState({ proofDoc: null });
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
    if (!form.scholarName || !form.researchTopic || !form.guideType) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => fd.append(k, form[k]));

      fd.append("academicYear", selectedYear);
      fd.append("isDirectEntry", "true");
      fd.append("targetFacultyEmpId", targetFacultyEmpId);

      if (files.proofDoc) fd.append("proofDoc", files.proofDoc);

      await API.post("/api/research/phd-scholar", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Ph.D. Scholar record added directly for faculty!");
      setForm({
        scholarName: "", rollNo: "", researchTopic: "", guideType: "Main Guide",
        university: "", registrationYear: "", status: "Ongoing", awardYear: "", applyIncentive: "No"
      });
      setFiles({ proofDoc: null });
      setTargetFacultyEmpId("");
      setIsTargetFacultyValid(false);
      setTargetFacultyDetails(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit Ph.D. scholar record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Ph.D. Scholar Data Entry (R&D Direct Entry)"
        subtitle="Add Ph.D. scholar records directly on behalf of faculty members"
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

      <FormCard title="2. Scholar Details">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel>Academic Year</FieldLabel>
            <Select fullWidth size="small" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {academicYears.map(y => <MenuItem key={y._id} value={y._id}>{y.yearRange}</MenuItem>)}
            </Select>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Scholar Name</FieldLabel>
            <TextField fullWidth size="small" value={form.scholarName} onChange={set("scholarName")} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel>Roll No / Registration ID</FieldLabel>
            <TextField fullWidth size="small" value={form.rollNo} onChange={set("rollNo")} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Research Topic</FieldLabel>
            <TextField fullWidth size="small" value={form.researchTopic} onChange={set("researchTopic")} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Guide Type</FieldLabel>
            <Select fullWidth size="small" value={form.guideType} onChange={set("guideType")}>
              <MenuItem value="Main Guide">Main Guide</MenuItem>
              <MenuItem value="Co-Guide">Co-Guide</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Status</FieldLabel>
            <Select fullWidth size="small" value={form.status} onChange={set("status")}>
              <MenuItem value="Ongoing">Ongoing</MenuItem>
              <MenuItem value="Submitted">Submitted</MenuItem>
              <MenuItem value="Awarded">Awarded</MenuItem>
            </Select>
          </Grid>
        </Grid>
      </FormCard>

      <FormCard title="3. Attachments" icon={<AttachFile sx={{ color: "var(--color-primary)" }} />}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <FieldLabel required>Registration / Proof Document</FieldLabel>
            <FileField onChange={(e) => setFiles(p => ({ ...p, proofDoc: e.target.files[0] }))} />
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
