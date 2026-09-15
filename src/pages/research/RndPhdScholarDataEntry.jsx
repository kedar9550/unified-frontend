import Loader from "../../components/common/Loader";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Box, TextField, MenuItem, Select, Typography, Button, Stack, Chip
} from "@mui/material";
import { toast } from "sonner";
import { Search, CheckCircle } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/design-system/PageContainer";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import { labelStyle, disabledField } from "../../components/faculty/publicationConstants";
import API from "../../api/axios";

const SCHOLAR_STATUSES = ["Pursuing", "Awarded"];

export default function RndPhdScholarDataEntry() {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  // Target Faculty Identification
  const [targetFacultyEmpId, setTargetFacultyEmpId] = useState("");
  const [targetFacultyName, setTargetFacultyName] = useState("");
  const [isTargetFacultyValid, setIsTargetFacultyValid] = useState(false);
  const [verifyingFaculty, setVerifyingFaculty] = useState(false);
  const [targetFacultyDetails, setTargetFacultyDetails] = useState(null);

  // Student ECAP Verification
  const [rollNumberInput, setRollNumberInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const initialFormState = {
    rollNumber: "",
    studentName: "",
    course: "Ph.D.",
    branch: "",
    scholarStatus: "",
    admissionOrAwardDate: "",
    scholarType: "",
    type: "",
    universitySelect: "Aditya University",
    universityText: ""
  };

  const [form, setForm] = useState(initialFormState);
  const [files, setFiles] = useState({ document: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/api/academic-years").then(res => {
      const years = res.data?.years || res.data?.data || [];
      setAcademicYears(years);
      const activeYear = years.find(y => y.isActive || y.active);
      if (activeYear) setSelectedYear(activeYear._id);
      else if (years.length > 0) setSelectedYear(years[0]._id);
    }).catch(err => console.log("Failed to fetch academic years", err));
  }, []);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const setFile = (k) => (e) => setFiles(p => ({ ...p, [k]: e.target.files[0] }));

  // ── Faculty Verification ──
  const verifyFaculty = async () => {
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
          setTargetFacultyName("Inactive Faculty");
          setIsTargetFacultyValid(false);
          setTargetFacultyDetails(null);
          toast.error("This faculty member is inactive and cannot be selected.");
        }
      } else {
        setTargetFacultyName("Not Found");
        setIsTargetFacultyValid(false);
        setTargetFacultyDetails(null);
        toast.error("Faculty not found. Ensure the exact Employee ID is entered.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Faculty not found";
      toast.error(msg);
      setIsTargetFacultyValid(false);
      setTargetFacultyName("Not Found");
      setTargetFacultyDetails(null);
    } finally {
      setVerifyingFaculty(false);
    }
  };

  // ── Student Roll Number ECAP Verification ──
  const handleVerifyRollNumber = async () => {
    const rollNo = rollNumberInput.trim().toUpperCase();
    if (!rollNo) {
      toast.error("Please enter a student roll number");
      return;
    }

    setIsVerifying(true);
    setIsVerified(false);
    try {
      const res = await API.get(`/api/research/phd-scholar/validate/${rollNo}`);
      if (res.data?.success) {
        const student = res.data.data;
        if (!student || !student.studentName) {
          throw new Error("Scholar details not found");
        }
        setForm(prev => ({
          ...prev,
          rollNumber: rollNo,
          studentName: student.studentName,
          course: student.course,
          branch: student.branch || "N/A"
        }));
        setIsVerified(true);
        toast.success(`Scholar ${rollNo} verified successfully!`);
      } else {
        throw new Error(res.data?.message || "Verification failed");
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || "Verification failed. Student not found or not a Ph.D. Scholar.";
      toast.error(errMsg);
      setForm(prev => ({
        ...prev,
        rollNumber: "",
        studentName: "",
        course: "Ph.D.",
        branch: ""
      }));
    } finally {
      setIsVerifying(false);
    }
  };

  // ── University Change Handler ──
  const handleUniversityChange = (e) => {
    const val = e.target.value;
    setForm(prev => ({
      ...prev,
      universitySelect: val,
      universityText: val === "Other" ? prev.universityText : "",
      rollNumber: "",
      studentName: "",
      course: "Ph.D.",
      branch: ""
    }));
    setRollNumberInput("");
    setIsVerified(false);
  };

  const handleSubmit = async () => {
    if (!targetFacultyEmpId || !isTargetFacultyValid) {
      toast.error("Please enter and verify a valid Target Faculty Employee ID");
      return;
    }
    if (!form.type) {
      toast.error("Please select Guide or Co-Guide");
      return;
    }
    if (!form.scholarType) {
      toast.error("Please select Scholar Type (Full-Time / Part-Time)");
      return;
    }
    if (!form.scholarStatus) {
      toast.error("Please select Scholar Status");
      return;
    }
    if (!form.studentName || !form.rollNumber) {
      toast.error("Please fill student details (Roll Number and Name are required)");
      return;
    }
    if (!form.admissionOrAwardDate) {
      toast.error("Please select the date");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      // Scholar details
      fd.append("rollNumber", form.rollNumber.trim().toUpperCase());
      fd.append("studentName", form.studentName.trim());
      fd.append("course", form.course || "Ph.D.");
      fd.append("branch", form.branch || "N/A");
      fd.append("scholarStatus", form.scholarStatus);
      fd.append("scholarType", form.scholarType);
      fd.append("type", form.type);
      fd.append("admissionOrAwardDate", form.admissionOrAwardDate);
      fd.append("university", form.universitySelect === "Other" ? form.universityText : form.universitySelect);

      fd.append("academicYear", selectedYear);
      fd.append("isDirectEntry", "true");
      fd.append("targetFacultyEmpId", targetFacultyEmpId);

      if (files.document) fd.append("document", files.document);

      await API.post("/api/research/phd-scholar", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Ph.D. Scholar record added directly for faculty!");

      // Reset form
      setForm(initialFormState);
      setFiles({ document: null });
      setRollNumberInput("");
      setIsVerified(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit Ph.D. scholar record");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setForm(initialFormState);
    setFiles({ document: null });
    setRollNumberInput("");
    setIsVerified(false);
    setTargetFacultyEmpId("");
    setTargetFacultyName("");
    setIsTargetFacultyValid(false);
    setTargetFacultyDetails(null);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Ph.D. Scholar Data Entry (R&D Direct Entry)"
        subtitle="Add Ph.D. scholar records directly on behalf of faculty members with immediate approval"
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        {/* ── Target Faculty Section ── */}
        <FormCard title="Target Faculty Identification">
          <Grid2>
            <Box>
              <Typography sx={{ ...labelStyle, mb: 0.5 }}>TARGET FACULTY EMPLOYEE ID : <span style={{ color: 'red' }}>*</span></Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Enter Employee ID"
                  value={targetFacultyEmpId}
                  onChange={(e) => {
                    setTargetFacultyEmpId(e.target.value);
                    setIsTargetFacultyValid(false);
                    setTargetFacultyName("");
                    setTargetFacultyDetails(null);
                    setForm(initialFormState);
                    setFiles({ document: null });
                    setRollNumberInput("");
                    setIsVerified(false);
                  }}
                />
                <Button
                  variant="contained"
                  onClick={verifyFaculty}
                  disabled={verifyingFaculty || !targetFacultyEmpId}
                  sx={{ whiteSpace: 'nowrap', textTransform: 'none' }}
                >
                  {verifyingFaculty ? "Verifying..." : "Verify"}
                </Button>
              </Box>
              {targetFacultyName && (
                <Typography variant="caption" color={isTargetFacultyValid ? "success.main" : "error.main"} sx={{ mt: 1, display: 'block' }}>
                  {isTargetFacultyValid ? `✓ Validated: ${targetFacultyName}` : `✗ ${targetFacultyName}`}
                </Typography>
              )}
            </Box>
          </Grid2>
        </FormCard>

        {/* ── Scholar Form (shown only after faculty is verified) ── */}
        {isTargetFacultyValid && (
          <>
            <FormCard title="Ph.D. Scholar Entry">
              {/* Academic Year */}
              <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
                <Typography sx={{ ...labelStyle, mb: 0 }}>Academic Year :</Typography>
                <Select
                  size="small"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  sx={{ minWidth: 150, background: "var(--bg-panel)" }}
                >
                  {academicYears.map(y => (
                    <MenuItem key={y._id} value={y._id}>{y.year || y.yearRange}</MenuItem>
                  ))}
                </Select>
              </Box>

              <FacultyInfoRow faculty={targetFacultyDetails} />

              {/* ── University & Supervision Details ── */}
              <SubLabel text="University & Supervision Details" />
              <Grid2>
                <Box>
                  <Typography sx={labelStyle}>University : *</Typography>
                  <Select size="small" fullWidth value={form.universitySelect} onChange={handleUniversityChange}>
                    <MenuItem value="Aditya University">Aditya University</MenuItem>
                    <MenuItem value="Other">Other University</MenuItem>
                  </Select>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Guide / Co-Guide : *</Typography>
                  <Select size="small" fullWidth displayEmpty value={form.type} onChange={set("type")}>
                    <MenuItem value="" disabled>--Select--</MenuItem>
                    <MenuItem value="guide">Guide</MenuItem>
                    <MenuItem value="co-guide">Co-Guide</MenuItem>
                  </Select>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Scholar Type : *</Typography>
                  <Select size="small" fullWidth displayEmpty value={form.scholarType} onChange={set("scholarType")}>
                    <MenuItem value="" disabled>--Select--</MenuItem>
                    <MenuItem value="Full-Time">Full-Time (FT)</MenuItem>
                    <MenuItem value="Part-Time">Part-Time (PT)</MenuItem>
                  </Select>
                </Box>
                {form.universitySelect === "Other" && (
                  <Box>
                    <Typography sx={labelStyle}>Specify University Name : *</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Enter university name"
                      value={form.universityText}
                      onChange={set("universityText")}
                    />
                  </Box>
                )}
              </Grid2>

              {/* ── Student Verification (Aditya University → ECAP API) ── */}
              {form.universitySelect === "Aditya University" ? (
                <>
                  <SubLabel text="Student Verification (ECAP API)" />
                  <Box sx={{ background: "var(--bg-panel)", p: 3, borderRadius: "16px", border: "1px solid var(--border-color)", mb: 3 }}>
                    <Typography sx={{ ...labelStyle, color: "var(--color-primary)" }}>Student Roll Number *</Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 1, mb: 2, maxWidth: 500 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={rollNumberInput}
                        onChange={(e) => setRollNumberInput(e.target.value)}
                        disabled={isVerifying || loading}
                        placeholder="e.g. 21A91A0501"
                      />
                      <Button
                        variant="contained"
                        onClick={handleVerifyRollNumber}
                        disabled={isVerifying || !rollNumberInput.trim() || loading}
                        startIcon={isVerifying ? <Loader size={16} color="inherit" /> : <CheckCircle />}
                        sx={{
                          background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                          px: 3,
                          fontWeight: 700,
                          textTransform: "none",
                          color: "#fff"
                        }}
                      >
                        Verify
                      </Button>
                    </Stack>

                    {isVerified && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "12px" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#10B981", display: "flex", alignItems: "center", gap: 1 }}>
                          <CheckCircle fontSize="small" /> Scholar Details Validated Successfully
                        </Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2, mt: 1 }}>
                          <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>STUDENT NAME</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{form.studentName}</Typography>
                          </Box>
                          <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>COURSE / PROGRAM</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{form.course || "Ph.D."}</Typography>
                          </Box>
                          <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>BRANCH / SPECIALIZATION</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{form.branch || "N/A"}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </>
              ) : (
                <>
                  {/* ── Manual Entry for Other University ── */}
                  <SubLabel text="Student Details (Manual Entry)" />
                  <Box sx={{ background: "var(--bg-panel)", p: 3, borderRadius: "16px", border: "1px solid var(--border-color)", mb: 3 }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2 }}>
                      <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                        <Typography sx={labelStyle}>Scholar Roll Number / ID *</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={form.rollNumber}
                          onChange={set("rollNumber")}
                          placeholder="e.g. Scholar ID or Roll Number"
                        />
                      </Box>
                      <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                        <Typography sx={labelStyle}>Student Name *</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={form.studentName}
                          onChange={set("studentName")}
                          placeholder="Enter student name"
                        />
                      </Box>
                      <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                        <Typography sx={labelStyle}>Course / Program *</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          disabled
                          value={form.course || "Ph.D."}
                          sx={disabledField}
                        />
                      </Box>
                      <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                        <Typography sx={labelStyle}>Branch / Specialization</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={form.branch}
                          onChange={set("branch")}
                          placeholder="e.g. CSE / Specialization"
                        />
                      </Box>
                    </Box>
                  </Box>
                </>
              )}

              {/* ── Scholar Status & Date (shown after student is verified or manual entry) ── */}
              {(form.universitySelect === "Other" || isVerified) && (
                <>
                  <SubLabel text="Scholar Status & Admission Details:" />
                  <Grid2>
                    <Box>
                      <Typography sx={labelStyle}>Scholar Status : *</Typography>
                      <Select size="small" fullWidth displayEmpty value={form.scholarStatus} onChange={set("scholarStatus")}>
                        <MenuItem value="" disabled>--Select--</MenuItem>
                        {SCHOLAR_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </Box>
                    <Box>
                      <Typography sx={labelStyle}>{form.scholarStatus === "Awarded" ? "Award Date" : form.scholarStatus === "Pursuing" ? "Admission Date" : "Admission / Award Date"} : *</Typography>
                      <TextField
                        size="small"
                        fullWidth
                        type="date"
                        value={form.admissionOrAwardDate}
                        onChange={set("admissionOrAwardDate")}
                        slotProps={{
                          inputLabel: { shrink: true },
                          htmlInput: { max: new Date().toISOString().split("T")[0] }
                        }}
                      />
                    </Box>
                  </Grid2>

                  <NoteBox />

                  <Box sx={{ mt: 3, maxWidth: 500 }}>
                    <FileField
                      label={
                        form.scholarStatus === "Awarded"
                          ? "Award Proceedings / Degree Award Letter : *"
                          : "PhD Admission Letter / Joining Report : *"
                      }
                      name="document"
                      onChange={setFile("document")}
                    />
                  </Box>
                </>
              )}

              {/* ── Submit / Cancel ── */}
              <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 5 }}>
                <Button
                  variant="outlined"
                  onClick={resetAll}
                  sx={{
                    px: 4,
                    height: "44px",
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
                <SubmitBtn onClick={handleSubmit} disabled={loading}>
                  {loading ? "Submitting..." : "Submit Ph.D. Scholar Record Directly"}
                </SubmitBtn>
              </Box>
            </FormCard>
          </>
        )}
      </Box>
    </PageContainer>
  );
}
