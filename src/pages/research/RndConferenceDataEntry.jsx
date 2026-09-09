import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Box, TextField, MenuItem, Select, Typography, Button, Paper, Grid, Card, Divider, Radio, RadioGroup, FormControlLabel
} from "@mui/material";
import { toast } from "sonner";
import { Search, AttachFile, Groups, School, Person } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/design-system/PageContainer";
import {
  FacultyInfoRow, FormCard, Grid2, FieldLabel, NoteBox, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import {
  labelStyle, disabledField, MONTHS, YEARS
} from "../../components/faculty/publicationConstants";
import API from "../../api/axios";

export default function RndConferenceDataEntry() {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  // Target Faculty Verification State
  const [targetFacultyEmpId, setTargetFacultyEmpId] = useState("");
  const [targetFacultyName, setTargetFacultyName] = useState("");
  const [isTargetFacultyValid, setIsTargetFacultyValid] = useState(false);
  const [verifyingFaculty, setVerifyingFaculty] = useState(false);
  const [targetFacultyDetails, setTargetFacultyDetails] = useState(null);

  const [form, setForm] = useState({
    doi: "",
    title: "", conferenceName: "", scope: "", indexing: "",
    presentationType: "", month: "", year: "",
    publisher: "", issnIsbn: "",
    applyIncentive: "", applyingSeedGrant: "",
    isStudentsInvolved: "No",
    totalAuthors: 1, userAuthorPosition: 1, otherAuthors: []
  });
  const [files, setFiles] = useState({ certificate: null, proceedings: null });
  const [loading, setLoading] = useState(false);
  const [doiFetching, setDoiFetching] = useState(false);
  const [doiFetched, setDoiFetched] = useState(false);

  useEffect(() => {
    API.get("/api/academic-years").then(res => {
      const years = res.data?.years || res.data?.data || [];
      setAcademicYears(years);
      const activeYear = years.find(y => y.isActive);
      if (activeYear) setSelectedYear(activeYear._id);
      else if (years.length > 0) setSelectedYear(years[0]._id);
    }).catch(err => console.log("Failed to fetch academic years", err));
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

  const fetchDOIData = async () => {
    if (!form.doi.trim()) return;
    setDoiFetching(true);
    try {
      const res = await API.get(`/api/research/conference/fetch-doi?doi=${encodeURIComponent(form.doi.trim())}`);
      const data = res.data?.data || res.data;
      setForm(prev => ({
        ...prev,
        title: data.title || prev.title,
        publisher: data.publisher || prev.publisher,
        conferenceName: data.conferenceName || prev.conferenceName,
        issnIsbn: data.issnIsbn || prev.issnIsbn,
        year: data.year || prev.year,
        month: data.month || prev.month,
        indexing: data.indexing || prev.indexing
      }));
      setDoiFetched(true);
      toast.success("DOI details fetched!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch DOI details");
    } finally {
      setDoiFetching(false);
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
  }, [form.totalAuthors, form.userAuthorPosition]);

  const handleCoAuthorChange = (pos, field, val) => {
    setForm(p => ({
      ...p,
      otherAuthors: p.otherAuthors.map(a => {
        if (a.authorPosition !== pos) return a;
        const newA = { ...a, [field]: val };
        if (field === "CoAuthorType") {
          if (val === "faculty") {
            newA.studentId = "";
            if (a.CoAuthorType === "student") {
              newA.authorName = "";
              newA.empId = "";
            }
          } else if (val === "student") {
            newA.empId = "";
            newA.affiliationType = "Aditya University";
            newA.affiliationName = "Aditya University";
            if (a.CoAuthorType === "faculty") {
              newA.authorName = "";
            }
          }
        }
        if (field === "affiliationType") {
          if (val === "Aditya University") {
            newA.affiliationName = "Aditya University";
            newA.authorName = "";
            newA.empId = "";
            newA.studentId = "";
          } else {
            newA.affiliationName = "";
            newA.empId = "";
            newA.authorName = "";
            newA.studentId = "";
          }
        }
        return newA;
      })
    }));
  };

  const handleSubmit = async () => {
    if (!isTargetFacultyValid || !targetFacultyEmpId) {
      toast.error("Please verify target faculty Employee ID first!");
      return;
    }

    if (!form.title || !form.conferenceName || !form.scope || !form.indexing || !form.presentationType) {
      toast.error("Please fill in all mandatory fields.");
      return;
    }

    if (!files.certificate || !files.proceedings) {
      toast.error("Please attach all required documents (Certificate & Proceedings)");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => {
        if (k === "otherAuthors") {
          const coAuthorsList = form.otherAuthors.map(a => ({
            name: a.authorName || "",
            affiliation: a.affiliationType === "Aditya University" ? "Aditya University" : (a.affiliationName || ""),
            employeeId: (a.affiliationType === "Aditya University" && a.CoAuthorType !== "student") ? a.empId : null,
            studentId: (a.affiliationType === "Aditya University" && a.CoAuthorType === "student") ? a.studentId : null,
            CoAuthorType: form.isStudentsInvolved === "Yes" ? (a.CoAuthorType || "faculty") : "faculty",
            authorPosition: a.authorPosition
          })).filter(ca => ca.name && ca.affiliation);
          fd.append("coAuthors", JSON.stringify(coAuthorsList));
        } else {
          fd.append(k, form[k]);
        }
      });

      fd.append("academicYear", selectedYear);
      fd.append("isDirectEntry", "true");
      fd.append("targetFacultyEmpId", targetFacultyEmpId);

      if (files.certificate) fd.append("certificate", files.certificate);
      if (files.proceedings) fd.append("proceedings", files.proceedings);

      await API.post("/api/research/conference", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Conference record added directly for faculty!");
      setForm({
        doi: "", title: "", conferenceName: "", scope: "", indexing: "",
        presentationType: "", month: "", year: "", publisher: "", issnIsbn: "",
        applyIncentive: "", applyingSeedGrant: "", isStudentsInvolved: "No", totalAuthors: 1, userAuthorPosition: 1, otherAuthors: []
      });
      setFiles({ certificate: null, proceedings: null });
      setTargetFacultyEmpId("");
      setTargetFacultyName("");
      setIsTargetFacultyValid(false);
      setTargetFacultyDetails(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit conference publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Conference Data Entry (R&D Direct Entry)"
        subtitle="Add conference publication records directly on behalf of faculty members"
      />

      {/* Target Faculty Verification Card */}
      <FormCard title="1. Target Faculty Identification" icon={<Person sx={{ color: "var(--color-primary)" }} />}>
        <Grid container spacing={2.5} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Target Faculty Employee ID</FieldLabel>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. 10024"
              value={targetFacultyEmpId}
              onChange={(e) => {
                setTargetFacultyEmpId(e.target.value);
                setIsTargetFacultyValid(false);
                setTargetFacultyName("");
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
                <Typography variant="caption" sx={{ color: "#047857" }}>
                  College: {targetFacultyDetails.college || "-"} | PAN: {targetFacultyDetails.panNumber || "-"}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </FormCard>

      {/* Conference Publication Form */}
      <FormCard title="2. Conference Details" icon={<School sx={{ color: "var(--color-primary)" }} />}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel>Academic Year</FieldLabel>
            <Select
              fullWidth
              size="small"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {academicYears.map(y => (
                <MenuItem key={y._id} value={y._id}>{y.yearRange} {y.isActive ? "(Active)" : ""}</MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel>DOI (Optional)</FieldLabel>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField fullWidth size="small" value={form.doi} onChange={set("doi")} placeholder="10.xxxx/xxxxx" />
              <Button variant="outlined" onClick={fetchDOIData} disabled={doiFetching || !form.doi} sx={{ minWidth: "80px" }}>
                {doiFetching ? "Fetching" : "Fetch"}
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Paper Title</FieldLabel>
            <TextField fullWidth size="small" value={form.title} onChange={set("title")} />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Conference Name</FieldLabel>
            <TextField fullWidth size="small" value={form.conferenceName} onChange={set("conferenceName")} />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Conference Scope</FieldLabel>
            <Select fullWidth size="small" value={form.scope} onChange={set("scope")}>
              <MenuItem value="National">National</MenuItem>
              <MenuItem value="International">International</MenuItem>
            </Select>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Indexing</FieldLabel>
            <Select fullWidth size="small" value={form.indexing} onChange={set("indexing")}>
              <MenuItem value="Scopus Indexed">Scopus Indexed</MenuItem>
              <MenuItem value="Not Scopus Indexed">Not Scopus Indexed</MenuItem>
            </Select>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Presentation Type</FieldLabel>
            <Select fullWidth size="small" value={form.presentationType} onChange={set("presentationType")}>
              <MenuItem value="Oral">Oral</MenuItem>
              <MenuItem value="Poster">Poster</MenuItem>
              <MenuItem value="Keynote">Keynote</MenuItem>
            </Select>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Month</FieldLabel>
            <Select fullWidth size="small" value={form.month} onChange={set("month")}>
              {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Year</FieldLabel>
            <Select fullWidth size="small" value={form.year} onChange={set("year")}>
              {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel>Publisher</FieldLabel>
            <TextField fullWidth size="small" value={form.publisher} onChange={set("publisher")} />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel>ISSN/ISBN</FieldLabel>
            <TextField fullWidth size="small" value={form.issnIsbn} onChange={set("issnIsbn")} />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Apply Incentive?</FieldLabel>
            <Select fullWidth size="small" value={form.applyIncentive} onChange={set("applyIncentive")} disabled={form.isStudentsInvolved === "Yes"} sx={form.isStudentsInvolved === "Yes" ? disabledField : {}}>
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Seed Grant Work?</FieldLabel>
            <Select fullWidth size="small" value={form.applyingSeedGrant} onChange={set("applyingSeedGrant")}>
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
          </Grid>
        </Grid>

        {/* Dynamic Author Details Block */}
        <Box sx={{ mt: 3, p: 2, borderRadius: "12px", border: "1px solid var(--border-color)", background: "var(--bg-panel)" }}>
          <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 2 }}>Author Details</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sx={{ mb: 1, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <FieldLabel required sx={{ mb: 0 }}>Are students involved in this work as co-authors?</FieldLabel>
              <RadioGroup row value={form.isStudentsInvolved || "No"} onChange={set("isStudentsInvolved")}>
                <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Yes</Typography>} />
                <FormControlLabel value="No" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>No</Typography>} />
              </RadioGroup>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FieldLabel>Total Number of Authors</FieldLabel>
              <TextField size="small" fullWidth type="number" value={form.totalAuthors} onChange={set("totalAuthors")} slotProps={{ htmlInput: { min: 1 } }} />
            </Grid>
            {parseInt(form.totalAuthors) > 1 && (
              <Grid item xs={12} sm={6}>
                <FieldLabel>Applicant Author Position</FieldLabel>
                <Select size="small" fullWidth value={form.userAuthorPosition} onChange={set("userAuthorPosition")}>
                  {Array.from({ length: parseInt(form.totalAuthors) || 1 }, (_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
                  ))}
                </Select>
              </Grid>
            )}
          </Grid>

          {parseInt(form.totalAuthors) > 1 && (
            <Box sx={{ mt: 2 }}>
              <FieldLabel sx={{ mb: 1 }}>Name & Affiliation of Co-Author(s)</FieldLabel>
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
      </FormCard>

      {/* Attachments */}
      <FormCard title="3. Attachments" icon={<AttachFile sx={{ color: "var(--color-primary)" }} />}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <FieldLabel required>Certificate of Presentation (PDF/Image, max 500KB)</FieldLabel>
            <FileField onChange={(e) => setFiles(p => ({ ...p, certificate: e.target.files[0] }))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FieldLabel required>Conference Proceedings Page (PDF/Image, max 500KB)</FieldLabel>
            <FileField onChange={(e) => setFiles(p => ({ ...p, proceedings: e.target.files[0] }))} />
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
