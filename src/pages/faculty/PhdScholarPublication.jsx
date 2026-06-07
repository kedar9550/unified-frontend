import { useState, useEffect } from "react";
import { Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Grid, Card, Chip, Divider, CircularProgress, TablePagination, Tooltip } from "@mui/material";
import { toast } from "sonner";
import { AddCircle, Delete, Close, Description, Download, AttachFile, Groups, WorkspacePremium, CheckCircle, Visibility } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn,
  labelStyle
} from "../../components/faculty/PublicationFormFields";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

const SCHOLAR_STATUSES = ["Pursuing", "Awarded"];

export default function PhdScholarPublication() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("list"); // 'list', 'select-year', 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [publicationsList, setPublicationsList] = useState([]);
  const [selectedPubDetails, setSelectedPubDetails] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Form state
  const [rollNumberInput, setRollNumberInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [studentsList, setStudentsList] = useState([]);

  const [form, setForm] = useState({
    rollNumber: "",
    studentName: "",
    course: "",
    branch: "",
    scholarStatus: "",
    admissionOrAwardDate: "",
    scholarType: "",
    universitySelect: "Aditya University",
    universityText: ""
  });
  
  const [files, setFiles] = useState({ document: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/api/research/phd-scholar").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => console.log("Failed to fetch Ph.D. scholars", err));

    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => console.log("Failed to fetch academic years", err));
  }, [viewMode]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setFile = (k) => (e) => setFiles((p) => ({ ...p, [k]: e.target.files[0] }));

  // Dynamic eCap Student verification handler
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
        setForm(prev => ({
          ...prev,
          rollNumber: rollNo,
          studentName: student.studentName,
          course: student.course,
          branch: student.branch || "N/A"
        }));
        setIsVerified(true);
        toast.success(`Scholar ${rollNo} verified successfully!`);
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || "Verification failed. Student not found or not a Ph.D. Scholar.";
      toast.error(errMsg);
      setForm(prev => ({
        ...prev,
        rollNumber: "",
        studentName: "",
        course: "",
        branch: ""
      }));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddStudentToList = () => {
    const finalUniversity = form.universitySelect === "Aditya University" 
      ? "Aditya University" 
      : form.universityText.trim();

    if (!finalUniversity) {
      toast.error("Please specify the University.");
      return;
    }

    if (form.universitySelect === "Aditya University") {
      if (!isVerified || !form.rollNumber) {
        toast.error("Please verify a valid scholar roll number first.");
        return;
      }
    } else {
      if (!form.rollNumber.trim()) {
        toast.error("Please enter the student Roll Number/ID.");
        return;
      }
      if (!form.studentName.trim()) {
        toast.error("Please enter the student Name.");
        return;
      }
      if (!form.course.trim()) {
        toast.error("Please enter the course name.");
        return;
      }
    }

    if (!form.scholarType) {
      toast.error("Please select the scholar type (Full-Time / Part-Time).");
      return;
    }
    if (!form.scholarStatus) {
      toast.error("Please select the scholar status.");
      return;
    }
    if (!form.admissionOrAwardDate) {
      toast.error("Please specify the Admission/Award Date.");
      return;
    }
    if (!files.document) {
      toast.error("At least one supporting document/proof is mandatory.");
      return;
    }

    // Future date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selDate = new Date(form.admissionOrAwardDate);
    selDate.setHours(0, 0, 0, 0);
    if (selDate > today) {
      toast.error("Admission or Award date cannot be in the future");
      return;
    }

    // Add to studentsList
    const newStudent = {
      rollNumber: form.rollNumber,
      studentName: form.studentName,
      course: form.course,
      branch: form.branch || "N/A",
      scholarStatus: form.scholarStatus,
      scholarType: form.scholarType,
      university: finalUniversity,
      admissionOrAwardDate: form.admissionOrAwardDate,
      document: files.document,
      documentName: files.document.name
    };

    setStudentsList(prev => [...prev, newStudent]);
    toast.success(`Student ${form.studentName} added to the list!`);

    // Reset verification and form fields so they can add another student
    setForm({
      rollNumber: "",
      studentName: "",
      course: "",
      branch: "",
      scholarStatus: "",
      admissionOrAwardDate: "",
      scholarType: "",
      universitySelect: "Aditya University",
      universityText: ""
    });
    setRollNumberInput("");
    setFiles({ document: null });
    setIsVerified(false);
  };

  const handleSubmit = async () => {
    let finalStudents = [...studentsList];
    
    const finalUniversity = form.universitySelect === "Aditya University" 
      ? "Aditya University" 
      : form.universityText.trim();

    const currentFilled = 
      form.rollNumber && 
      form.studentName && 
      form.course && 
      form.scholarType &&
      form.scholarStatus && 
      form.admissionOrAwardDate && 
      files.document &&
      finalUniversity &&
      (form.universitySelect === "Other" || isVerified);

    if (currentFilled) {
      finalStudents.push({
        rollNumber: form.rollNumber,
        studentName: form.studentName,
        course: form.course,
        branch: form.branch || "N/A",
        scholarStatus: form.scholarStatus,
        scholarType: form.scholarType,
        university: finalUniversity,
        admissionOrAwardDate: form.admissionOrAwardDate,
        document: files.document
      });
    }

    if (finalStudents.length === 0) {
      toast.error("Please fill, verify and add at least one student record first.");
      return;
    }

    setLoading(true);
    try {
      for (const student of finalStudents) {
        const fd = new FormData();
        fd.append("rollNumber", student.rollNumber);
        fd.append("studentName", student.studentName);
        fd.append("course", student.course);
        fd.append("branch", student.branch || "N/A");
        fd.append("scholarStatus", student.scholarStatus);
        fd.append("scholarType", student.scholarType);
        fd.append("university", student.university);
        fd.append("admissionOrAwardDate", student.admissionOrAwardDate);
        fd.append("document", student.document);
        fd.append("academicYear", selectedYear);

        await API.post("/api/research/phd-scholar", fd, { headers: { "Content-Type": "multipart/form-data" } });
      }

      toast.success(`Successfully submitted appraisal for ${finalStudents.length} scholar(s)!`);
      
      // Reset state
      setForm({ rollNumber: "", studentName: "", course: "", branch: "", scholarStatus: "", admissionOrAwardDate: "", scholarType: "", universitySelect: "Aditya University", universityText: "" });
      setRollNumberInput("");
      setFiles({ document: null });
      setStudentsList([]);
      setIsVerified(false);
      setSelectedYear("");
      setViewMode("list");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Appraisal submission failed");
    } finally {
      setLoading(false);
    }
  };

  const renderList = () => (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>My Guided Ph.D. Scholars</Typography>
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
          Add Student
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
            No Scholar Submissions
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
            You haven't submitted any Ph.D. Scholar guiding details yet. Click the "Add Ph.D. Scholar" button to submit your first entry.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
          <Table>
            <TableHead sx={{ background: "var(--gradient-primary)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Scholar Roll No</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Student Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Course</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Branch</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Appraisal Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Academic Year</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Approval Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2, textAlign: "center" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {publicationsList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((pub, i) => (
                <TableRow key={pub._id || i} sx={{ "&:hover": { background: "var(--bg-accent-1)" }, transition: "background 0.15s" }}>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 600, py: 2 }}>{pub.rollNumber || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>{pub.studentName || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.course || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.branch || "—"}</TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Chip 
                      label={pub.scholarStatus} 
                      size="small" 
                      sx={{ 
                        fontWeight: 800, 
                        bgcolor: pub.scholarStatus === "Awarded" ? "rgba(16, 185, 129, 0.1)" : "rgba(59, 130, 246, 0.1)",
                        color: pub.scholarStatus === "Awarded" ? "#10B981" : "#3B82F6",
                        borderRadius: "6px"
                      }} 
                    />
                  </TableCell>
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
                      {pub.status || "Pending at HOD"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2, textAlign: "center" }}>
                    <Tooltip title="View Details" arrow>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedPubDetails(pub)}
                        sx={{
                          color: "var(--color-primary)",
                          border: "1px solid var(--color-primary)",
                          borderRadius: "8px",
                          p: "5px",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            background: "var(--bg-accent-1)",
                            transform: "scale(1.1)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                          }
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={publicationsList.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{
              borderTop: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
              ".MuiTablePagination-select": { color: "var(--text-primary)" },
              ".MuiTablePagination-selectIcon": { color: "var(--text-secondary)" },
              ".MuiIconButton-root": { color: "var(--text-secondary)" },
              ".MuiIconButton-root.Mui-disabled": { opacity: 0.3 }
            }}
          />
        </TableContainer>
      )}
    </Box>
  );

  const renderSelectYear = () => (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 5 }}>
      <FormCard title="Select Academic Year">
        <Typography sx={{ mb: 2, color: "var(--text-secondary)", fontWeight: 500 }}>Please select the academic year for this scholar appraisal submission:</Typography>
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
            onClick={() => {
              setViewMode("list");
              setStudentsList([]);
            }}
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
    <FormCard title="Ph.D. Scholar Appraisal Entry">
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 0.8, borderRadius: "8px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
        <Button size="small" variant="text" onClick={() => setViewMode("select-year")} sx={{ fontWeight: 700, textTransform: "none", color: "var(--color-primary)" }}>Change Year</Button>
      </Box>

      <FacultyInfoRow />

      <SubLabel text="University & Scholar Type Details" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>University : *</Typography>
          <Select size="small" fullWidth value={form.universitySelect} onChange={set("universitySelect")}>
            <MenuItem value="Aditya University">Aditya University</MenuItem>
            <MenuItem value="Other">Other University</MenuItem>
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
      </Grid2>

      {form.universitySelect === "Other" && (
        <Box sx={{ mt: 2, mb: 1 }}>
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
                startIcon={isVerifying ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                sx={{
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  borderRadius: "10px",
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
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>STUDENT NAME</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{form.studentName}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>COURSE / PROGRAM</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{form.course}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>BRANCH</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{form.branch || "N/A"}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </>
      ) : (
        <>
          <SubLabel text="Student Details (Manual Entry)" />
          <Box sx={{ background: "var(--bg-panel)", p: 3, borderRadius: "16px", border: "1px solid var(--border-color)", mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography sx={labelStyle}>Scholar Roll Number / ID *</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.rollNumber}
                  onChange={set("rollNumber")}
                  placeholder="e.g. Scholar ID or Roll Number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={labelStyle}>Student Name *</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.studentName}
                  onChange={set("studentName")}
                  placeholder="Enter student name"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={labelStyle}>Course / Program *</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.course}
                  onChange={set("course")}
                  placeholder="e.g. Ph.D. in Computer Science"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={labelStyle}>Branch</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.branch}
                  onChange={set("branch")}
                  placeholder="e.g. CSE"
                />
              </Grid>
            </Grid>
          </Box>
        </>
      )}

      {(form.universitySelect === "Other" || isVerified) && (
        <>
          <SubLabel text="Appraisal Information:" />
          <Grid2>
            <Box>
              <Typography sx={labelStyle}>Scholar Appraisal Status : *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.scholarStatus} onChange={set("scholarStatus")}>
                <MenuItem value="" disabled>--Select--</MenuItem>
                {SCHOLAR_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </Box>
            <Box>
              <Typography sx={labelStyle}>Admission / Award Date : *</Typography>
              <TextField 
                size="small" 
                fullWidth 
                type="date" 
                value={form.admissionOrAwardDate} 
                onChange={set("admissionOrAwardDate")} 
                InputLabelProps={{ shrink: true }} 
                inputProps={{ max: new Date().toISOString().split("T")[0] }} 
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
          
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleAddStudentToList}
              startIcon={<AddCircle />}
              sx={{
                background: "var(--gradient-primary)",
                borderRadius: "10px",
                px: 3,
                fontWeight: 700,
                textTransform: "none",
                "&:hover": { opacity: 0.9 }
              }}
            >
              Add Student
            </Button>
          </Box>
        </>
      )}

      {studentsList.length > 0 && (
        <Box sx={{ mt: 4, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--color-primary)", mb: 2 }}>
            Added Students ({studentsList.length}):
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-panel)", border: "1px solid var(--border-color)" }}>
            <Table size="small">
              <TableHead sx={{ background: "rgba(0,0,0,0.02)" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Roll No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Program</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Document</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentsList.map((stud, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ fontWeight: 600 }}>{stud.rollNumber}</TableCell>
                    <TableCell>
                      {stud.studentName}
                      <Typography variant="caption" sx={{ color: "var(--text-secondary)", display: "block" }}>
                        {stud.university} ({stud.scholarType === 'Part-Time' ? 'PT' : 'FT'})
                      </Typography>
                    </TableCell>
                    <TableCell>{stud.course} - {stud.branch}</TableCell>
                    <TableCell>
                      <Chip label={stud.scholarStatus} size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>{new Date(stud.admissionOrAwardDate).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell sx={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {stud.documentName}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setStudentsList(prev => prev.filter((_, i) => i !== idx));
                          toast.success("Student removed from list.");
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

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
        {(studentsList.length > 0 || isVerified) && <SubmitBtn onClick={handleSubmit} loading={loading} />}
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

  const renderDetailFile = (title, filepath, folder = "phdScholars") => {
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

    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch (e) {
        return dateStr;
      }
    };

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
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Ph.D. Scholar Appraisal Details</Typography>
          </Box>
          <IconButton onClick={handleCloseDetails} sx={{ color: "#fff" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 1 }}>{data.studentName}</Typography>
          <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 3, fontWeight: 600 }}>Scholar Roll Number: {data.rollNumber}</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Academic Year" value={data.academicYear?.year || "N/A"} /></Grid>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Program Name" value={data.course} /></Grid>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Branch" value={data.branch || "—"} /></Grid>
            <Grid item xs={12} sm={3}>
              <LabelValueDetails 
                label="Appraisal Status" 
                chip={
                  <Chip 
                    label={data.scholarStatus} 
                    size="small" 
                    sx={{ 
                      bgcolor: data.scholarStatus === "Awarded" ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)", 
                      color: data.scholarStatus === "Awarded" ? "#10B981" : "#3B82F6", 
                      fontWeight: 800, 
                      borderRadius: "6px" 
                    }} 
                  />
                } 
              />
            </Grid>

            <Grid item xs={12} sm={6}><LabelValueDetails label="University" value={data.university || "Aditya University"} /></Grid>
            <Grid item xs={12} sm={6}><LabelValueDetails label="Scholar Type" value={data.scholarType || "Full-Time"} /></Grid>
            <Grid item xs={12} sm={6}><LabelValueDetails label="Admission / Award Date" value={formatDate(data.admissionOrAwardDate)} /></Grid>
            <Grid item xs={12} sm={6}>
              <LabelValueDetails 
                label="Approval Workflow Status" 
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

          {/* Attached Files previews */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 2 }}>
              <AttachFile sx={{ color: "var(--color-primary)" }} />
              <Typography sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Attached Supporting Document</Typography>
            </Box>
            <Box>
              {renderDetailFile(
                data.scholarStatus === "Awarded" ? "Award Proceedings / Degree Award Letter" : "Admission Letter / Joining Report", 
                data.document
              )}
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
        title="Guided Ph.D. Scholars" 
        subtitle="Manage and submit details of your guided scholars for annual appraisal cycles" 
        breadcrumbs={["Home", "Research", "Guided Ph.D. Scholars"]}
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
