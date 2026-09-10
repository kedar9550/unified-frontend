import { useState, useEffect } from "react";
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

export default function RndTextbookDataEntry() {
  const { user } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  // Target Faculty Verification State
  const [targetFacultyEmpId, setTargetFacultyEmpId] = useState("");
  const [targetFacultyName, setTargetFacultyName] = useState("");
  const [isTargetFacultyValid, setIsTargetFacultyValid] = useState(false);
  const [verifyingFaculty, setVerifyingFaculty] = useState(false);
  const [targetFacultyDetails, setTargetFacultyDetails] = useState(null);

  const emptyForm = {
    title: "",
    publisher: "",
    isbn: "",
    edition: "",
    month: "",
    year: "",
    scope: "",
    applyIncentive: "",
    applyingSeedGrant: "",
    isStudentsInvolved: "No",
    totalAuthors: 1,
    userAuthorPosition: 1,
    otherAuthors: []
  };

  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState({ coverPage: null, indexPage: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/api/academic-years")
      .then(res => {
        const years = res.data?.years || res.data?.data || [];
        setAcademicYears(years);
        const activeYear = years.find(y => y.isActive);
        if (activeYear) setSelectedYear(activeYear._id);
        else if (years.length > 0) setSelectedYear(years[0]._id);
      })
      .catch(() => { });
  }, []);

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm(p => {
      const newForm = { ...p, [k]: val };
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
    if (!targetFacultyEmpId || !isTargetFacultyValid) {
      toast.error("Please verify a valid Target Faculty Employee ID first");
      return;
    }
    if (!form.title.trim() || !form.publisher.trim() || !form.isbn.trim() || !form.month || !form.year) {
      toast.error("Please fill in all required fields marked with *");
      return;
    }
    if (!files.coverPage) {
      toast.error("Please attach the Cover Page document");
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
        "title", "publisher", "isbn", "edition", "scope",
        "applyIncentive", "applyingSeedGrant", "totalAuthors", "userAuthorPosition", "isStudentsInvolved"
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

      if (files.coverPage) fd.append("coverPage", files.coverPage);
      if (files.indexPage) fd.append("indexPage", files.indexPage);

      await API.post("/api/research/textbook", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Textbook publication record added directly for faculty!");
      setForm(emptyForm);
      setFiles({ coverPage: null, indexPage: null });
      setTargetFacultyEmpId("");
      setTargetFacultyName("");
      setIsTargetFacultyValid(false);
      setTargetFacultyDetails(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit textbook publication");
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
          <FormCard title="Academic Year Selection">
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography sx={{ ...labelStyle, mb: 0 }}>Academic Year :</Typography>
              <Select
                size="small"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                sx={{ minWidth: 150, background: "var(--bg-panel)" }}
              >
                {academicYears.map(y => (
                  <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
                ))}
              </Select>
            </Box>
            <Box sx={{ mt: 2 }}>
              <FacultyInfoRow faculty={targetFacultyDetails} />
            </Box>
          </FormCard>

          {/* ── Textbook Details ── */}
          <SubLabel text="Details of the Textbook:" />
          <Grid2 sx={{ mt: 1 }}>
            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
              <Typography sx={labelStyle}>Title of the Textbook : *</Typography>
              <TextField size="small" fullWidth multiline rows={2} value={form.title} onChange={set("title")} placeholder="Enter textbook title" />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Publisher : *</Typography>
              <TextField size="small" fullWidth value={form.publisher} onChange={set("publisher")} placeholder="e.g. McGraw Hill, Pearson" />
            </Box>
            <Box>
              <Typography sx={labelStyle}>ISBN Number : *</Typography>
              <TextField size="small" fullWidth value={form.isbn} onChange={set("isbn")} placeholder="e.g. 978-3-16-148410-0" />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Edition :</Typography>
              <TextField size="small" fullWidth value={form.edition} onChange={set("edition")} placeholder="e.g. 1st Edition" />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Scope :</Typography>
              <Select size="small" fullWidth displayEmpty value={form.scope} onChange={set("scope")}>
                <MenuItem value="">Select Scope</MenuItem>
                <MenuItem value="National">National</MenuItem>
                <MenuItem value="International">International</MenuItem>
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
          </Grid2>

          {/* ── Attachments ── */}
          <SubLabel text="Upload Required Documents:" />
          <FormCard title="File Attachments (PDF or Images, Max 500KB each)">
            <Grid2>
              <Box>
                <Typography sx={labelStyle}>Cover Page Document : *</Typography>
                <FileField onChange={setFile("coverPage")} label="Attach Cover Page Document" file={files.coverPage} />
              </Box>
              <Box>
                <Typography sx={labelStyle}>Index / Contents Page Document :</Typography>
                <FileField onChange={setFile("indexPage")} label="Attach Index / Contents Page" file={files.indexPage} />
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
        title="Textbook Data Entry (R&D Direct Entry)"
        subtitle="Directly submit approved textbook publication records on behalf of faculty members"
      />
      {renderForm()}
    </PageContainer>
  );
}
