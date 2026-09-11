import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
import {
  Box, TextField, MenuItem, Select, Typography, Button,
  Radio, RadioGroup, FormControlLabel
} from "@mui/material";
import { toast } from "sonner";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/design-system/PageContainer";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import {
  labelStyle, disabledField, MONTHS, YEARS
} from "../../components/faculty/publicationConstants";
import API from "../../api/axios";

export default function RndConferenceDataEntry() {
  const { user } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  // Target Faculty Identification
  const [targetFacultyEmpId, setTargetFacultyEmpId] = useState("");
  const [targetFacultyName, setTargetFacultyName] = useState("");
  const [isTargetFacultyValid, setIsTargetFacultyValid] = useState(false);
  const [verifyingFaculty, setVerifyingFaculty] = useState(false);
  const [targetFacultyDetails, setTargetFacultyDetails] = useState(null);

  // DOI fetch state
  const [doiFetching, setDoiFetching] = useState(false);
  const [doiFetched, setDoiFetched] = useState(false);

  const emptyForm = {
    doi: "",
    title: "",
    conferenceName: "",
    scope: "",
    indexing: "",
    month: "",
    year: "",
    publisher: "",
    issnIsbn: "",
    applyIncentive: "",
    applyingSeedGrant: "",
    isStudentsInvolved: "No",
    totalAuthors: 1,
    userAuthorPosition: 1,
    otherAuthors: [],
    appraisalEligible: "Yes",
    approvedAmount: ""
  };

  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState({ certificate: null, proceedings: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/api/academic-years")
      .then(res => {
        const years = res.data?.years || res.data?.data || [];
        setAcademicYears(years);
        const activeYear = years.find(y => y.isActive);
        if (activeYear) {
          setSelectedYear(activeYear._id);
        } else if (years.length > 0) {
          setSelectedYear(years[0]._id);
        }
      })
      .catch(() => { });
  }, []);

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm(p => {
      const newForm = { ...p, [k]: val };
      if (k === "doi") {
        newForm.title = "";
        newForm.publisher = "";
        newForm.conferenceName = "";
        newForm.issnIsbn = "";
        newForm.year = "";
        newForm.month = "";
        newForm.indexing = "";
        setDoiFetched(false);
      }
      if (k === "isStudentsInvolved") {
        if (val === "No") {
          newForm.otherAuthors = newForm.otherAuthors.map(a => ({
            ...a,
            CoAuthorType: "faculty",
            studentId: "",
            authorName: a.CoAuthorType === "student" ? "" : a.authorName,
            empId: a.CoAuthorType === "student" ? "" : a.empId
          }));
          newForm.applyIncentive = "";
        } else if (val === "Yes") {
          newForm.applyIncentive = "No";
        }
      }
      return newForm;
    });
  };

  const getAvailableMonths = () => {
    const selectedYearVal = parseInt(form.year);
    const currentYear = new Date().getFullYear();
    if (selectedYearVal === currentYear) {
      const currentMonthIndex = new Date().getMonth();
      return MONTHS.filter((_, idx) => idx <= currentMonthIndex);
    }
    return MONTHS;
  };

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
      toast.error(err?.response?.data?.message || "Faculty not found");
      setIsTargetFacultyValid(false);
      setTargetFacultyName("Not Found");
      setTargetFacultyDetails(null);
    } finally {
      setVerifyingFaculty(false);
    }
  };

  const fetchDOIData = async () => {
    if (!form.doi.trim()) { toast.warning("Please enter a DOI first"); return; }
    setDoiFetching(true);
    startLoading();
    try {
      const res = await API.post("/api/research/conference/validate-doi", { doi: form.doi.trim() });
      const data = res.data?.data;

      if (!data) {
        throw new Error("No metadata returned for this DOI");
      }

      setForm(prev => ({
        ...prev,
        title: data.title || prev.title,
        publisher: data.publisher || prev.publisher,
        conferenceName: data.conferenceName || prev.conferenceName,
        issnIsbn: data.issnIsbn || prev.issnIsbn,
        year: data.year || prev.year,
        month: data.month || prev.month,
        indexing: "Scopus Indexed"
      }));

      setDoiFetched(true);
      toast.success("Conference paper details fetched successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to fetch DOI details");
    } finally {
      setDoiFetching(false);
      stopLoading();
    }
  };

  // Co-author dynamic handler
  useEffect(() => {
    let total = parseInt(form.totalAuthors) || 1;
    let pos = parseInt(form.userAuthorPosition) || 1;
    if (pos > total) {
      setForm(p => ({ ...p, userAuthorPosition: total }));
      return;
    }
    if (total === 1) {
      setForm(p => ({ ...p, otherAuthors: [] }));
      return;
    }
    const newOthers = [];
    for (let i = 1; i <= total; i++) {
      if (i !== pos) {
        const existing = form.otherAuthors.find(a => a.authorPosition === i);
        newOthers.push(existing || {
          authorPosition: i,
          CoAuthorType: "faculty",
          studentId: "",
          affiliationType: "",
          empId: "",
          authorName: "",
          affiliationName: "",
        });
      }
    }
    setForm(p => ({ ...p, otherAuthors: newOthers }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.totalAuthors, form.userAuthorPosition]);

  const fetchCoAuthorName = async (pos, empId) => {
    try {
      const res = await API.get(`/api/employees/staff/${empId}`);
      if (res.data?.success) {
        const name = res.data.data?.employeename || res.data.data?.EmployeeName || "";
        setForm(prev => ({
          ...prev,
          otherAuthors: prev.otherAuthors.map(a =>
            a.authorPosition === pos ? { ...a, authorName: name, affiliationName: "Aditya University" } : a
          ),
        }));
      }
    } catch (_) { }
  };

  const handleCoAuthorChange = (pos, field, value) => {
    const updated = form.otherAuthors.map(a => {
      if (a.authorPosition !== pos) return a;
      const newA = { ...a, [field]: value };

      if (field === "CoAuthorType") {
        if (value === "student") {
          newA.empId = "";
          newA.affiliationType = "Aditya University";
          newA.affiliationName = "Aditya University";
          newA.authorName = "";
        } else {
          newA.studentId = "";
          newA.authorName = "";
        }
      }

      if (field === "affiliationType") {
        if (value === "Aditya University") {
          newA.affiliationName = "Aditya University";
          newA.authorName = "";
          newA.empId = "";
        } else {
          newA.affiliationName = "";
          newA.empId = "";
          newA.authorName = "";
        }
      }
      return newA;
    });
    setForm(p => ({ ...p, otherAuthors: updated }));

    if (field === "empId" && value.length >= 3) {
      const author = updated.find(a => a.authorPosition === pos);
      if (author?.affiliationType === "Aditya University") fetchCoAuthorName(pos, value);
    }
  };

  const validateFile = (file) => {
    if (!file) return true;
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) { toast.error("Only PDF, JPG, and PNG files are allowed"); return false; }
    if (file.size > 500 * 1024) { toast.error("File size exceeds 500KB limit"); return false; }
    return true;
  };

  const setFile = (k) => (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) setFiles(p => ({ ...p, [k]: file }));
    else e.target.value = null;
  };

  const handleSubmit = async () => {
    if (!isTargetFacultyValid || !targetFacultyEmpId) {
      toast.error("Please verify target faculty Employee ID first!");
      return;
    }

    if (!form.title.trim() || !form.conferenceName.trim() || !form.scope || !form.indexing || !form.year || !form.month) {
      toast.error("Please fill in all required fields marked with *");
      return;
    }

    if (!form.appraisalEligible) {
      toast.error("Please select Appraisal Eligible status");
      return;
    }

    if (form.applyIncentive === "Yes" && (!form.approvedAmount || Number(form.approvedAmount) <= 0)) {
      toast.error("Please enter a valid Approved Incentive Amount");
      return;
    }

    if (!files.certificate || !files.proceedings) {
      toast.error("Please attach all required documents (Certificate & Proceedings)");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();

      const coAuthorsList = form.otherAuthors.map(a => ({
        name: a.authorName || "",
        affiliation: a.affiliationType === "Aditya University" ? "Aditya University" : (a.affiliationName || ""),
        employeeId: (a.affiliationType === "Aditya University" && a.CoAuthorType !== "student") ? a.empId : null,
        studentId: (a.affiliationType === "Aditya University" && a.CoAuthorType === "student") ? a.studentId : null,
        CoAuthorType: form.isStudentsInvolved === "Yes" ? (a.CoAuthorType || "faculty") : "faculty",
        authorPosition: a.authorPosition
      })).filter(ca => ca.name && ca.affiliation);

      const fields = [
        "doi", "title", "conferenceName", "scope", "indexing",
        "publisher", "issnIsbn", "applyIncentive", "applyingSeedGrant",
        "totalAuthors", "userAuthorPosition", "isStudentsInvolved",
        "appraisalEligible", "approvedAmount"
      ];
      fields.forEach(k => {
        fd.append(k, form[k] ?? "");
      });

      fd.append("month", form.month);
      fd.append("year", form.year);
      fd.append("coAuthors", JSON.stringify(coAuthorsList));
      fd.append("academicYear", selectedYear);
      fd.append("college", targetFacultyDetails?.college || user?.college || "");
      fd.append("panNumber", targetFacultyDetails?.panNumber || user?.panNumber || "");
      fd.append("isDirectEntry", "true");
      fd.append("targetFacultyEmpId", targetFacultyEmpId);

      if (files.certificate) fd.append("certificate", files.certificate);
      if (files.proceedings) fd.append("proceedings", files.proceedings);

      await API.post("/api/research/conference", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Conference record added directly for faculty!");

      setForm(emptyForm);
      setFiles({ certificate: null, proceedings: null });
      setTargetFacultyEmpId("");
      setTargetFacultyName("");
      setIsTargetFacultyValid(false);
      setTargetFacultyDetails(null);
      setDoiFetched(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit conference publication");
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

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

      {isTargetFacultyValid && (
        <>
          <FormCard title="1. Digital Object Identifier (DOI) Verification">
            {/* Academic Year Selection */}
            <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
              <Typography sx={{ ...labelStyle, mb: 0 }}>Academic Year :</Typography>
              <Select
                size="small"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                sx={{ minWidth: 150, background: "var(--bg-panel)" }}
                disabled={false}
              >
                {academicYears.map(y => (
                  <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
                ))}
              </Select>
            </Box>

            <FacultyInfoRow faculty={targetFacultyDetails} />

            {/* ── DOI Section ── */}
            <Box sx={{ mb: 2.5, p: 2.5, borderRadius: "12px", border: "2px solid var(--color-primary)", background: "var(--bg-accent-1)", boxShadow: "0 2px 12px rgba(var(--color-primary-rgb,99,102,241),0.08)" }}>
              <Typography sx={{ ...labelStyle, color: "var(--color-primary)", mb: 1 }}>
                DOI (Digital Object Identifier) :
                <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10, opacity: 0.7 }}> — Enter DOI to auto-fill details (optional)</span>
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "flex-start" } }}>
                <TextField
                  size="small"
                  fullWidth
                  value={form.doi}
                  onChange={set("doi")}
                  placeholder="e.g. 10.1109/ICCR55977.2022.9995935"
                  onKeyDown={(e) => { if (e.key === "Enter") fetchDOIData(); }}
                  slotProps={{
                    input: {
                      sx: { background: "var(--bg-panel)" },
                      endAdornment: doiFetched ? (
                        <Box component="span" sx={{ display: "flex", alignItems: "center", color: "#10b981", fontSize: 18, mr: 0.5 }}>✓</Box>
                      ) : null
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={fetchDOIData}
                  disabled={doiFetching || !form.doi.trim()}
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    minWidth: 110,
                    height: "40px",
                    background: "var(--gradient-primary)",
                    textTransform: "none",
                    fontWeight: 700,
                    flexShrink: 0,
                    "&:hover": { opacity: 0.9 },
                    "&.Mui-disabled": { opacity: 0.5 }
                  }}
                >
                  {doiFetching ? "Fetching..." : "Fetch Details"}
                </Button>
              </Box>
              {doiFetched && (
                <Typography sx={{ mt: 1, fontSize: 11, color: "#10b981", fontWeight: 700 }}>
                  ✓ Details auto-filled from Scopus/Crossref. Review and complete any remaining fields below.
                </Typography>
              )}
            </Box>
          </FormCard>

          {/* ── Conference Paper Details ── */}
          <SubLabel text="Details of the Conference Paper:" />

          <Grid2 sx={{ mt: 1 }}>
            {/* Title */}
            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
              <Typography sx={labelStyle}>Title of the Research Paper : *</Typography>
              <TextField size="small" fullWidth multiline rows={2} value={form.title} onChange={set("title")} placeholder="Enter or auto-fill from DOI" />
            </Box>

            {/* Conference Name */}
            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
              <Typography sx={labelStyle}>Name of the Conference : *</Typography>
              <TextField size="small" fullWidth value={form.conferenceName} onChange={set("conferenceName")} placeholder="Enter or auto-fill from DOI" />
            </Box>

            {/* Publisher */}
            <Box>
              <Typography sx={labelStyle}>Publisher : *</Typography>
              <TextField size="small" fullWidth value={form.publisher} onChange={set("publisher")} placeholder="e.g. IEEE, Springer" />
            </Box>

            {/* ISSN/ISBN */}
            <Box>
              <Typography sx={labelStyle}>ISSN / ISBN Number :</Typography>
              <TextField size="small" fullWidth value={form.issnIsbn} onChange={(e) => {
                const val = e.target.value;
                if (/^[0-9X-]*$/i.test(val)) setForm(p => ({ ...p, issnIsbn: val }));
              }} placeholder="e.g. 1234-5678" />
            </Box>

            {/* Scope */}
            <Box>
              <Typography sx={labelStyle}>Conference Scope : *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.scope} onChange={set("scope")}>
                <MenuItem value="">Select Scope</MenuItem>
                <MenuItem value="National">National</MenuItem>
                <MenuItem value="International">International</MenuItem>
              </Select>
            </Box>

            {/* Indexing */}
            <Box>
              <Typography sx={labelStyle}>Indexing : *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.indexing} onChange={set("indexing")}>
                <MenuItem value="">Select Indexing</MenuItem>
                <MenuItem value="Scopus Indexed">Scopus Indexed</MenuItem>
                <MenuItem value="Not Scopus Indexed">Not Scopus Indexed</MenuItem>
              </Select>
            </Box>
          </Grid2>

          {/* ── Publication Date ── */}
          <SubLabel text="Date of the Publication:" />
          <Grid2>
            <Box>
              <Typography sx={labelStyle}>Year : *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.year} onChange={(e) => {
                setForm(p => ({ ...p, year: e.target.value, month: "" }));
              }}>
                <MenuItem value="">Select Year</MenuItem>
                {(form.year && !YEARS.includes(String(form.year))
                  ? [...YEARS, String(form.year)].sort((a, b) => Number(b) - Number(a))
                  : YEARS
                ).map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </Box>
            <Box>
              <Typography sx={labelStyle}>Month : *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.month} onChange={set("month")} disabled={!form.year}>
                <MenuItem value="">Select Month</MenuItem>
                {getAvailableMonths().map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </Box>
          </Grid2>

          {/* ── Author Details ── */}
          <Box sx={{ mt: 3, p: 2, borderRadius: "12px", border: "1px solid var(--border-color)", background: "var(--bg-panel)" }}>
            <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 2 }}>Author Details</Typography>
            <Grid2>
              <Box sx={{ gridColumn: { sm: "1 / -1" }, mb: 1, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Typography sx={{ ...labelStyle, mb: 0 }}>Are students involved in this work as co-authors? *</Typography>
                <RadioGroup row value={form.isStudentsInvolved || "No"} onChange={set("isStudentsInvolved")}>
                  <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Yes</Typography>} />
                  <FormControlLabel value="No" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>No</Typography>} />
                </RadioGroup>
              </Box>
              <Box>
                <Typography sx={labelStyle}>Total Number of Authors :</Typography>
                <TextField size="small" fullWidth type="number" value={form.totalAuthors} onChange={set("totalAuthors")} slotProps={{ htmlInput: { min: 1 } }} />
              </Box>
              {parseInt(form.totalAuthors) > 1 && (
                <Box>
                  <Typography sx={labelStyle}>Applicant Author Position :</Typography>
                  <Select size="small" fullWidth value={form.userAuthorPosition} onChange={set("userAuthorPosition")}>
                    {Array.from({ length: parseInt(form.totalAuthors) || 1 }, (_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
                    ))}
                  </Select>
                </Box>
              )}
            </Grid2>

            {parseInt(form.totalAuthors) > 1 && (
              <Box sx={{ mt: 3 }}>
                <Typography sx={{ ...labelStyle, mb: 1 }}>Name & Affiliation of Co-Author(s) :</Typography>
                {form.otherAuthors.map((ca) => (
                  <Box
                    key={ca.authorPosition}
                    sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2, p: 2, borderRadius: "12px", border: "1px dashed var(--border-color)", background: "var(--bg-accent-1)" }}
                  >
                    <Box sx={{ display: "flex", gap: 2, flexWrap: { xs: "wrap", sm: "nowrap" }, alignItems: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: "30px", height: "30px", background: "var(--color-primary)", color: "#fff", borderRadius: "50%", fontWeight: 700, fontSize: 14 }}>
                        {ca.authorPosition}
                      </Box>

                      {form.isStudentsInvolved === "Yes" && (
                        <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "130px" } }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-AUTHOR TYPE</Typography>
                          <Select
                            size="small"
                            fullWidth
                            displayEmpty
                            value={ca.CoAuthorType || "faculty"}
                            onChange={(e) => handleCoAuthorChange(ca.authorPosition, "CoAuthorType", e.target.value)}
                          >
                            <MenuItem value="faculty">Faculty</MenuItem>
                            <MenuItem value="student">Student</MenuItem>
                          </Select>
                        </Box>
                      )}

                      <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "150px" } }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION TYPE</Typography>
                        <Select
                          size="small"
                          fullWidth
                          displayEmpty
                          value={ca.CoAuthorType === "student" ? "Aditya University" : ca.affiliationType}
                          onChange={(e) => handleCoAuthorChange(ca.authorPosition, "affiliationType", e.target.value)}
                        >
                          <MenuItem value="" disabled>Select Affiliation</MenuItem>
                          <MenuItem value="Aditya University">Aditya University</MenuItem>
                          {ca.CoAuthorType !== "student" && (
                            <MenuItem value="Others">Others</MenuItem>
                          )}
                        </Select>
                      </Box>

                      {ca.affiliationType === "Aditya University" ? (
                        ca.CoAuthorType === "student" ? (
                          <>
                            <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "120px" } }}>
                              <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>STUDENT ROLL NO</Typography>
                              <TextField
                                size="small"
                                fullWidth
                                value={ca.studentId || ""}
                                onChange={(e) => handleCoAuthorChange(ca.authorPosition, "studentId", e.target.value)}
                                placeholder="e.g. 21A91A0501"
                              />
                            </Box>
                            <Box sx={{ flex: 2, minWidth: { xs: "100%", sm: "200px" } }}>
                              <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>STUDENT NAME</Typography>
                              <TextField
                                size="small"
                                fullWidth
                                value={ca.authorName}
                                onChange={(e) => handleCoAuthorChange(ca.authorPosition, "authorName", e.target.value)}
                                placeholder="Full Name"
                              />
                            </Box>
                          </>
                        ) : (
                          <>
                            <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "120px" } }}>
                              <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>EMPLOYEE ID</Typography>
                              <TextField
                                size="small"
                                fullWidth
                                value={ca.empId}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (/^\d*$/.test(val)) handleCoAuthorChange(ca.authorPosition, "empId", val);
                                }}
                                placeholder="e.g. 5741"
                              />
                            </Box>
                            <Box sx={{ flex: 2, minWidth: { xs: "100%", sm: "200px" } }}>
                              <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-AUTHOR NAME</Typography>
                              <TextField
                                size="small"
                                fullWidth
                                value={ca.authorName}
                                disabled
                                placeholder="Fetched from eCap"
                                sx={{ background: "rgba(0,0,0,0.02)" }}
                              />
                            </Box>
                          </>
                        )
                      ) : (
                        <>
                          <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "180px" } }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-AUTHOR NAME</Typography>
                            <TextField
                              size="small"
                              fullWidth
                              value={ca.authorName}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!/\d/.test(val)) handleCoAuthorChange(ca.authorPosition, "authorName", val);
                              }}
                              placeholder="Full Name"
                            />
                          </Box>
                          <Box sx={{ flex: 2, minWidth: { xs: "100%", sm: "200px" } }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION</Typography>
                            <TextField
                              size="small"
                              fullWidth
                              value={ca.affiliationName}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!/\d/.test(val)) handleCoAuthorChange(ca.authorPosition, "affiliationName", val);
                              }}
                              placeholder="College / Organization"
                            />
                          </Box>
                        </>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* ── Incentive & Funding Options ── */}
          <SubLabel text="Incentive & Funding Options:" />
          <Grid2>
            <Box>
              <Typography sx={labelStyle}>Applying Seed Grant Work? : *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.applyingSeedGrant} onChange={set("applyingSeedGrant")}>
                <MenuItem value="">Select Option</MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </Select>
            </Box>
            <Box>
              <Typography sx={labelStyle}>Apply For Incentive? : *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.applyIncentive} onChange={set("applyIncentive")} disabled={form.isStudentsInvolved === "Yes"} sx={form.isStudentsInvolved === "Yes" ? disabledField : {}}>
                <MenuItem value="">Select Option</MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </Select>
            </Box>
            <Box>
              <Typography sx={labelStyle}>Appraisal Eligible? : *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.appraisalEligible} onChange={set("appraisalEligible")}>
                <MenuItem value="">Select Option</MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </Select>
            </Box>
            {form.applyIncentive === "Yes" && (
              <Box>
                <Typography sx={labelStyle}>Approved Incentive Amount (₹) : *</Typography>
                <TextField
                  size="small"
                  fullWidth
                  type="number"
                  placeholder="Enter Approved Incentive Amount"
                  value={form.approvedAmount}
                  onChange={set("approvedAmount")}
                />
              </Box>
            )}
          </Grid2>

          {/* ── Attachments ── */}
          <SubLabel text="Upload Required Documents:" />
          <FormCard title="File Attachments (PDF or Images, Max 500KB each)">
            <Grid2>
              <Box>
                <Typography sx={labelStyle}>Certificate of Presentation : *</Typography>
                <FileField onChange={setFile("certificate")} label="Attach Presentation Certificate" file={files.certificate} />
              </Box>
              <Box>
                <Typography sx={labelStyle}>Conference Proceedings Page : *</Typography>
                <FileField onChange={setFile("proceedings")} label="Attach Proceedings Page" file={files.proceedings} />
              </Box>
            </Grid2>
          </FormCard>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <SubmitBtn onClick={handleSubmit} disabled={loading || !isTargetFacultyValid}>
              {loading ? "Submitting Record..." : "Submit Record Directly"}
            </SubmitBtn>
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <PageContainer>
      <PageHeader
        title="Conference Data Entry (R&D Direct Entry)"
        subtitle="Directly submit approved conference records on behalf of faculty members"
      />
      {renderForm()}
    </PageContainer>
  );
}
