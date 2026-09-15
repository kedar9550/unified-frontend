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
  FacultyInfoRow, FormCard, Grid2, SubLabel, FileField, SubmitBtn, NoteBox
} from "../../components/faculty/PublicationFormFields";
import {
  labelStyle, disabledField, MONTHS, YEARS
} from "../../components/faculty/publicationConstants";
import API from "../../api/axios";

export default function RndBookChapterDataEntry() {
  const { user } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  // Target Faculty Identification State
  const [targetFacultyEmpId, setTargetFacultyEmpId] = useState("");
  const [targetFacultyName, setTargetFacultyName] = useState("");
  const [isTargetFacultyValid, setIsTargetFacultyValid] = useState(false);
  const [verifyingFaculty, setVerifyingFaculty] = useState(false);
  const [targetFacultyDetails, setTargetFacultyDetails] = useState(null);

  const emptyForm = {
    doi: "",
    chapterTitle: "",
    textBookName: "",
    publisher: "",
    isbnNumber: "",
    month: "",
    year: "",
    indexing: "",
    scope: "",
    applyIncentive: "",
    applyingSeedGrant: "",
    isStudentsInvolved: "No",
    totalAuthors: 1,
    userAuthorPosition: 1,
    otherAuthors: [],
    appraisalEligible: "",
    approvedAmount: ""
  };

  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState({ authorAffiliation: null });
  const [loading, setLoading] = useState(false);
  const [doiFetching, setDoiFetching] = useState(false);
  const [doiFetched, setDoiFetched] = useState(null);
  const [isbnFetching, setIsbnFetching] = useState(false);
  const [scopusIndexed, setScopusIndexed] = useState(false);
  const ELSEVIER_API_KEY = import.meta.env.VITE_ELSEVIER_API_KEY;

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

  const parseDateStr = (str) => {
    if (!str) return { year: "", month: "" };
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const shortNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let year = "", month = "";
    const yMatch = str.match(/\b(19|20)\d{2}\b/);
    if (yMatch) year = yMatch[0];
    for (let i = 0; i < 12; i++) {
      if (str.toLowerCase().includes(monthNames[i].toLowerCase()) ||
        str.toLowerCase().includes(shortNames[i].toLowerCase())) {
        month = monthNames[i]; break;
      }
    }
    if (!month) {
      const iso = str.match(/\d{4}-(\d{2})/);
      if (iso) month = monthNames[parseInt(iso[1], 10) - 1] || "";
    }
    return { year, month };
  };

  const fetchDOIData = async () => {
    const cleanDoi = form.doi.trim().replace(/^https?:\/\/doi\.org\//i, "");
    if (!cleanDoi) { toast.error("Please enter a DOI"); return; }
    setDoiFetching(true);
    setDoiFetched(null);
    setScopusIndexed(false);
    try {
      const scopusRes = await fetch(
        `https://api.elsevier.com/content/search/scopus?query=DOI(${encodeURIComponent(cleanDoi)})`,
        { headers: { "X-ELS-APIKey": ELSEVIER_API_KEY, Accept: "application/json" } }
      );
      if (!scopusRes.ok) {
        if (scopusRes.status === 401) toast.error("Scopus API key unauthorized. Please contact admin.");
        else if (scopusRes.status === 429) toast.error("Scopus API rate limit exceeded. Try again later.");
        else toast.error(`Scopus API error (HTTP ${scopusRes.status}). Please fill manually.`);
        setDoiFetched(false);
        return;
      }
      const scopusJson = await scopusRes.json();
      const entry = scopusJson?.["search-results"]?.entry?.[0];

      if (!entry || entry.error || (!entry["dc:title"] && !entry["prism:publicationName"])) {
        toast.warning("This DOI was not found in Scopus. Please fill details manually.");
        setScopusIndexed(false);
        setDoiFetched(false);
        return;
      }

      const chapterTitle = entry["dc:title"] || "";
      const publisher = entry["prism:publisher"] || entry["dc:publisher"] || "";
      const dateRaw = entry["prism:coverDisplayDate"] || entry["prism:coverDate"] || "";
      const { year, month } = parseDateStr(dateRaw);

      toast.success("Chapter found in Scopus! Details fetched successfully.");
      setDoiFetched(true);
      setScopusIndexed(true);

      setForm(prev => ({
        ...prev,
        chapterTitle: chapterTitle || prev.chapterTitle,
        publisher: publisher || prev.publisher,
        year: year || prev.year,
        month: month || prev.month,
      }));
    } catch (err) {
      toast.error("Network error connecting to Scopus. Please fill the fields manually.");
      setDoiFetched(false);
    } finally {
      setDoiFetching(false);
    }
  };

  const fetchISBNData = async () => {
    const isbn = form.isbnNumber.trim().replace(/-/g, "");
    if (!isbn) { toast.error("Please enter an ISBN"); return; }
    if (isbn.length !== 10 && isbn.length !== 13) {
      toast.error("ISBN must be 10 or 13 digits"); return;
    }
    setIsbnFetching(true);
    try {
      // Try Open Library first
      const olRes = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
      );
      if (olRes.ok) {
        const olJson = await olRes.json();
        const bookData = olJson[`ISBN:${isbn}`];
        if (bookData && bookData.title) {
          setForm(prev => ({ ...prev, textBookName: bookData.title }));
          toast.success(`Book title fetched: "${bookData.title}"`);
          return;
        }
      }
      // Fallback: Google Books API
      const gbRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
      );
      if (gbRes.ok) {
        const gbJson = await gbRes.json();
        const item = gbJson?.items?.[0];
        const title = item?.volumeInfo?.title;
        if (title) {
          setForm(prev => ({ ...prev, textBookName: title }));
          toast.success(`Book title fetched: "${title}"`);
          return;
        }
      }
      toast.warning("Book title not found for this ISBN. Please enter it manually.");
    } catch (err) {
      toast.error("Error fetching book title. Please enter it manually.");
    } finally {
      setIsbnFetching(false);
    }
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
        if (value === "faculty") {
          newA.studentId = "";
          if (a.CoAuthorType === "student") {
            newA.authorName = "";
            newA.empId = "";
          }
        } else if (value === "student") {
          newA.empId = "";
          newA.affiliationType = "Aditya University";
          newA.affiliationName = "Aditya University";
          if (a.CoAuthorType === "faculty") {
            newA.authorName = "";
          }
        }
      }

      if (field === "affiliationType") {
        if (value === "Aditya University") {
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
    });
    setForm(p => ({ ...p, otherAuthors: updated }));

    if (field === "empId" && value.length >= 3) {
      const author = updated.find(a => a.authorPosition === pos);
      if (author?.affiliationType === "Aditya University" && author?.CoAuthorType !== "student") fetchCoAuthorName(pos, value);
    }
  };

  const handleStudentsInvolvedChange = (e) => {
    const val = e.target.value;
    setForm((prev) => {
      let newForm = { ...prev, isStudentsInvolved: val };
      if (val === "Yes") {
        newForm.applyIncentive = "No";
      } else {
        newForm.applyIncentive = "";
        if (newForm.otherAuthors) {
          newForm.otherAuthors = newForm.otherAuthors.map(author => {
            const newAuthor = { ...author };
            delete newAuthor.CoAuthorType;
            delete newAuthor.studentId;
            if (author.CoAuthorType === "student" && newAuthor.affiliationType === "Aditya University") {
              newAuthor.affiliationType = "";
              newAuthor.affiliationName = "";
            }
            return newAuthor;
          });
        }
      }
      return newForm;
    });
  };

  const validateFile = (file) => {
    if (!file) return true;
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) { toast.error("Only PDF, JPG, and PNG files are allowed"); return false; }
    if (file.size > 5 * 1024 * 1024) { toast.error("File size exceeds 5MB limit"); return false; }
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
    if (!form.chapterTitle.trim() || !form.textBookName.trim() || !form.publisher.trim() || !form.isbnNumber.trim() || !form.month || !form.year) {
      toast.error("Please fill in all required fields marked with *");
      return;
    }
    if (form.applyIncentive === "Yes" && (!form.approvedAmount || Number(form.approvedAmount) <= 0)) {
      toast.error("Please enter a valid Approved Incentive Amount");
      return;
    }
    if (!form.appraisalEligible) {
      toast.error("Please select Appraisal Eligible status");
      return;
    }
    if (!files.authorAffiliation) {
      toast.error("Please attach the Author Affiliation Page");
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
        "doi", "chapterTitle", "textBookName", "publisher", "isbnNumber", "scope",
        "totalAuthors", "userAuthorPosition", "isStudentsInvolved",
        "applyIncentive", "applyingSeedGrant", "appraisalEligible", "approvedAmount"
      ];
      fields.forEach(k => {
        fd.append(k, form[k] ?? "");
      });

      fd.append("month", form.month);
      fd.append("year", form.year);
      fd.append("yearOfPublication", form.year);
      fd.append("publicationScope", form.scope || "National");
      fd.append("coAuthors", JSON.stringify(coAuthorsList));
      fd.append("academicYear", selectedYear);
      fd.append("college", targetFacultyDetails?.college || user?.college || "");
      fd.append("panNumber", targetFacultyDetails?.panNumber || user?.panNumber || "");
      fd.append("isDirectEntry", "true");
      fd.append("targetFacultyEmpId", targetFacultyEmpId);
      fd.append("scopusIndexed", scopusIndexed ? "Yes" : "No");

      if (files.authorAffiliation) fd.append("authorAffiliation", files.authorAffiliation);

      await API.post("/api/research/book-chapter", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Book Chapter record added directly for faculty!");
      setForm(emptyForm);
      setFiles({ authorAffiliation: null });
      setScopusIndexed(false);
      setDoiFetched(false);
      setTargetFacultyEmpId("");
      setTargetFacultyName("");
      setIsTargetFacultyValid(false);
      setTargetFacultyDetails(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit book chapter publication");
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
                placeholder="Enter Employee ID"
                value={targetFacultyEmpId}
                onChange={(e) => {
                  setTargetFacultyEmpId(e.target.value);
                  setIsTargetFacultyValid(false);
                  setTargetFacultyName("");
                  setTargetFacultyDetails(null);
                  setForm(emptyForm);
                  setFiles({ authorAffiliation: null });
                  setDoiFetched(null);
                  setScopusIndexed(false);
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

          {/* ── Book Chapter Details ── */}
          <SubLabel text="Details of the Book Chapter:" />
          <Grid2 sx={{ mt: 1 }}>
            <Box sx={{ gridColumn: { sm: "1 / -1" }, mb: 2.5, p: 2.5, borderRadius: "12px", border: "2px solid var(--color-primary)", background: "var(--bg-accent-1)", boxShadow: "0 2px 12px rgba(var(--color-primary-rgb,99,102,241),0.08)" }}>
              <Typography sx={{ ...labelStyle, mb: 1 }}>DOI (Digital Object Identifier) : * <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10, opacity: 0.7 }}>— Enter DOI to verify Scopus indexing &amp; auto-fill details</span></Typography>
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  size="small"
                  fullWidth
                  value={form.doi}
                  onChange={set("doi")}
                  placeholder="e.g. 10.1007/978-3-031-12345-6_10"
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
                  sx={{ minWidth: 120, height: "40px", background: "var(--gradient-primary)", textTransform: "none", fontWeight: 700, flexShrink: 0, "&:hover": { opacity: 0.9 }, "&.Mui-disabled": { opacity: 0.5 }, width: { xs: '100%', sm: 'auto' } }}
                >
                  {doiFetching ? "Fetching..." : "Fetch Details"}
                </Button>
              </Box>
              {scopusIndexed && (
                <Typography sx={{ mt: 1, fontSize: 11, color: "#10b981", fontWeight: 700 }}>✓ Found in Scopus — Scopus Indexed</Typography>
              )}
              {doiFetched === false && (
                <Typography sx={{ mt: 1, fontSize: 11, color: "#ef4444", fontWeight: 700 }}>✗ Not found in Scopus or Invalid DOI</Typography>
              )}
            </Box>

            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
              <Typography sx={labelStyle}>Title of the Chapter : *</Typography>
              <TextField size="small" fullWidth multiline rows={2} value={form.chapterTitle} onChange={set("chapterTitle")} placeholder="Enter chapter title" />
            </Box>

            {/* ISBN + Book Title fetch */}
            <Box>
              <Typography sx={labelStyle}>ISBN Number : *</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="e.g. 9780590353427"
                  value={form.isbnNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9-]*$/.test(val)) setForm(p => ({ ...p, isbnNumber: val }));
                  }}
                  slotProps={{ htmlInput: { inputMode: "numeric" } }}
                />
                <Button
                  variant="outlined"
                  onClick={fetchISBNData}
                  disabled={isbnFetching || !form.isbnNumber.trim()}
                  sx={{ minWidth: 90, height: "40px", textTransform: "none", fontWeight: 700, flexShrink: 0, borderColor: "var(--color-primary)", color: "var(--color-primary)", "&:hover": { background: "var(--bg-accent-1)" }, "&.Mui-disabled": { opacity: 0.5 } }}
                >
                  {isbnFetching ? "Fetching..." : "Fetch Title"}
                </Button>
              </Box>
            </Box>

            <Box>
              <Typography sx={labelStyle}>Title of the Book : *</Typography>
              <TextField size="small" fullWidth value={form.textBookName} onChange={set("textBookName")} placeholder="Auto-filled from ISBN or enter manually" />
            </Box>

            <Box>
              <Typography sx={labelStyle}>Publication Scope : *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.scope} onChange={set("scope")}>
                <MenuItem value="" disabled>Select Scope</MenuItem>
                <MenuItem value="National">National</MenuItem>
                <MenuItem value="International">International</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography sx={labelStyle}>Name of the Publisher : *</Typography>
              <TextField size="small" fullWidth value={form.publisher} onChange={set("publisher")} placeholder="e.g. Elsevier, Springer" />
            </Box>
          </Grid2>

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
                <RadioGroup row value={form.isStudentsInvolved || "No"} onChange={handleStudentsInvolvedChange}>
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
                <Typography sx={{ ...labelStyle, mb: 1 }}>Name &amp; Affiliation of Co-Author(s) :</Typography>
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

          <NoteBox />

          {/* ── Attachments & Options ── */}
          <Box sx={{ p: 2, borderRadius: "12px", border: "1px solid var(--border-color)", background: "var(--bg-panel)", mt: 3 }}>
            <Grid2>
              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 1, fontSize: "0.85rem", textTransform: "uppercase" }}>ATTACH PAGE DISPLAYING AUTHOR AFFILIATION AND CHAPTER TITLE *</Typography>
                <FileField onChange={setFile("authorAffiliation")} label="No file chosen" file={files.authorAffiliation} />
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 1, fontSize: "0.85rem", textTransform: "uppercase" }}>Applying as a Seed Grant Work? *</Typography>
                <Select size="small" fullWidth displayEmpty value={form.applyingSeedGrant} onChange={set("applyingSeedGrant")}>
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 1, fontSize: "0.85rem", textTransform: "uppercase" }}>Apply Incentive? *</Typography>
                <Select size="small" fullWidth displayEmpty value={form.applyIncentive} onChange={set("applyIncentive")} disabled={form.isStudentsInvolved === "Yes"}>
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </Box>

              {form.applyIncentive === "Yes" && (
                <Box>
                  <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 1, fontSize: "0.85rem", textTransform: "uppercase" }}>Incentive Amount :</Typography>
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    placeholder="Enter approved amount"
                    value={form.approvedAmount}
                    onChange={set("approvedAmount")}
                  />
                </Box>
              )}

              <Box>
                <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 1, fontSize: "0.85rem", textTransform: "uppercase" }}>Article Eligibility for Appraisal : *</Typography>
                <Select size="small" fullWidth displayEmpty value={form.appraisalEligible} onChange={set("appraisalEligible")}>
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </Box>
            </Grid2>
          </Box>

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
        title="Book Chapter Data Entry (R&D Direct Entry)"
        subtitle="Directly submit approved book chapter records on behalf of faculty members"
      />
      {renderForm()}
    </PageContainer>
  );
}
