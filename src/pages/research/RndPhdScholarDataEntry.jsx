import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Box, TextField, MenuItem, Select, Typography, Button
} from "@mui/material";
import { toast } from "sonner";
import { Search, AttachFile } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/design-system/PageContainer";
import {
  FormCard, Grid2, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import { labelStyle } from "../../components/faculty/publicationConstants";
import API from "../../api/axios";

const SCHOLAR_STATUSES = ["Pursuing", "Awarded"];
const SCHOLAR_TYPES = ["Full-Time", "Part-Time"];

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
    rollNumber: "",
    studentName: "",
    course: "Ph.D.",
    branch: "",
    scholarStatus: "Pursuing",
    admissionOrAwardDate: "",
    scholarType: "Full-Time",
    universitySelect: "Aditya University",
    universityText: "",
    applyIncentive: "No"
  });

  const [files, setFiles] = useState({ document: null });
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
          setTargetFacultyDetails(null);
        }
      } else {
        toast.error("Faculty not found with given Employee ID");
        setIsTargetFacultyValid(false);
        setTargetFacultyDetails(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to verify faculty");
      setIsTargetFacultyValid(false);
      setTargetFacultyDetails(null);
    } finally {
      setVerifyingFaculty(false);
    }
  };

  const handleSubmit = async () => {
    if (!targetFacultyEmpId || !isTargetFacultyValid) {
      toast.error("Please verify a valid Target Faculty Employee ID first");
      return;
    }
    if (!form.studentName || !form.rollNumber || !form.admissionOrAwardDate) {
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

      if (files.document) fd.append("document", files.document);

      await API.post("/api/research/phd-scholar", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Ph.D. Scholar record added directly for faculty!");
      setForm({
        rollNumber: "", studentName: "", course: "Ph.D.", branch: "", scholarStatus: "Pursuing",
        admissionOrAwardDate: "", scholarType: "Full-Time", universitySelect: "Aditya University", universityText: "", applyIncentive: "No"
      });
      setFiles({ document: null });
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
        subtitle="Add Ph.D. scholar records directly on behalf of faculty members with immediate approval"
      />

      {/* Target Faculty Section */}
      <FormCard title="Target Faculty Identification">
        <Grid2>
          <Box>
            <Typography sx={{ ...labelStyle, mb: 0.5 }}>TARGET FACULTY EMPLOYEE ID : <span style={{ color: 'red' }}>*</span></Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Enter Employee ID (e.g., ADITYA123)"
                value={targetFacultyEmpId}
                onChange={(e) => {
                  setTargetFacultyEmpId(e.target.value);
                  setIsTargetFacultyValid(false);
                  setTargetFacultyName("");
                  setTargetFacultyDetails(null);
                }}
              />
              <Button
                variant="contained"
                onClick={handleVerifyFaculty}
                disabled={verifyingFaculty || !targetFacultyEmpId}
                startIcon={<Search />}
                sx={{ background: "var(--gradient-primary)", color: "#fff", textTransform: "none", fontWeight: 700, px: 3, whiteSpace: "nowrap" }}
              >
                {verifyingFaculty ? "Verifying..." : "Verify"}
              </Button>
            </Box>
          </Box>
          <Box>
            <Typography sx={{ ...labelStyle, mb: 0.5 }}>VERIFIED FACULTY NAME :</Typography>
            <TextField
              size="small"
              fullWidth
              disabled
              value={targetFacultyName}
              placeholder="Verified faculty name will appear here"
              sx={{ background: "rgba(0,0,0,0.02)" }}
            />
          </Box>
        </Grid2>
        {isTargetFacultyValid && targetFacultyDetails && (
          <Box sx={{ mt: 2, p: 2, background: "rgba(16, 185, 129, 0.08)", border: "1px solid #10b981", borderRadius: "10px" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#065f46" }}>
              ✓ Verified: {targetFacultyDetails.name} ({targetFacultyDetails.designation || "Faculty"} - {targetFacultyDetails.department || "Dept"})
            </Typography>
          </Box>
        )}
      </FormCard>

      {/* Scholar Details */}
      <FormCard title="Ph.D. Scholar Details">
        <Grid2>
          <Box>
            <Typography sx={labelStyle}>Academic Year :</Typography>
            <Select fullWidth size="small" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {academicYears.map(y => <MenuItem key={y._id} value={y._id}>{y.yearRange || y.year}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography sx={labelStyle}>University :</Typography>
            <Select fullWidth size="small" value={form.universitySelect} onChange={set("universitySelect")}>
              <MenuItem value="Aditya University">Aditya University</MenuItem>
              <MenuItem value="Other">Other University</MenuItem>
            </Select>
          </Box>
          {form.universitySelect === "Other" && (
            <Box>
              <Typography sx={labelStyle}>Specify University Name :</Typography>
              <TextField fullWidth size="small" value={form.universityText} onChange={set("universityText")} placeholder="University Name" />
            </Box>
          )}
          <Box>
            <Typography sx={labelStyle}>Scholar Roll No / Reg ID : <span style={{ color: 'red' }}>*</span></Typography>
            <TextField fullWidth size="small" value={form.rollNumber} onChange={set("rollNumber")} placeholder="e.g. 21PHD001" />
          </Box>
          <Box>
            <Typography sx={labelStyle}>Scholar Name : <span style={{ color: 'red' }}>*</span></Typography>
            <TextField fullWidth size="small" value={form.studentName} onChange={set("studentName")} placeholder="Full Name of the Scholar" />
          </Box>
          <Box>
            <Typography sx={labelStyle}>Course / Program :</Typography>
            <TextField fullWidth size="small" value={form.course} onChange={set("course")} placeholder="e.g. Ph.D." />
          </Box>
          <Box>
            <Typography sx={labelStyle}>Branch / Specialization :</Typography>
            <TextField fullWidth size="small" value={form.branch} onChange={set("branch")} placeholder="e.g. Computer Science" />
          </Box>
          <Box>
            <Typography sx={labelStyle}>Scholar Type :</Typography>
            <Select fullWidth size="small" value={form.scholarType} onChange={set("scholarType")}>
              {SCHOLAR_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography sx={labelStyle}>Scholar Status :</Typography>
            <Select fullWidth size="small" value={form.scholarStatus} onChange={set("scholarStatus")}>
              {SCHOLAR_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography sx={labelStyle}>Admission / Award Date : <span style={{ color: 'red' }}>*</span></Typography>
            <TextField fullWidth type="date" size="small" value={form.admissionOrAwardDate} onChange={set("admissionOrAwardDate")} slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
        </Grid2>
      </FormCard>

      {/* Attachments Section */}
      <FormCard title="Attachments & Options" icon={<AttachFile sx={{ color: "var(--color-primary)" }} />}>
        <Grid2>
          <FileField label="Supporting Document / Registration Copy:" onChange={(e) => setFiles(p => ({ ...p, document: e.target.files[0] }))} />
          <Box>
            <Typography sx={labelStyle}>Apply for Incentive?</Typography>
            <Select size="small" fullWidth value={form.applyIncentive} onChange={set("applyIncentive")}>
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
          </Box>
        </Grid2>
      </FormCard>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <SubmitBtn onClick={handleSubmit} disabled={loading || !isTargetFacultyValid}>
          {loading ? "Submitting..." : "Submit Ph.D. Scholar Record Directly"}
        </SubmitBtn>
      </Box>
    </PageContainer>
  );
}
