import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Box, TextField, MenuItem, Select, Typography, Button,
  Radio, RadioGroup, FormControlLabel, Autocomplete
} from "@mui/material";
import { toast } from "sonner";
import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/design-system/PageContainer";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, FileField, SubmitBtn, NoteBox
} from "../../components/faculty/PublicationFormFields";
import {
  labelStyle, disabledField, MONTHS, YEARS
} from "../../components/faculty/publicationConstants";
import API from "../../api/axios";

export default function RndTextbookDataEntry() {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  // Target Faculty Verification State
  const [targetFacultyEmpId, setTargetFacultyEmpId] = useState("");
  const [targetFacultyName, setTargetFacultyName] = useState("");
  const [isTargetFacultyValid, setIsTargetFacultyValid] = useState(false);
  const [verifyingFaculty, setVerifyingFaculty] = useState(false);
  const [targetFacultyDetails, setTargetFacultyDetails] = useState(null);

  // Additional data sources
  const [editions, setEditions] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [isbnFetching, setIsbnFetching] = useState(false);
  const [isbnFetched, setIsbnFetched] = useState(false);
  const [isbnFetchedFields, setIsbnFetchedFields] = useState({ title: false, publisher: false });

  const emptyForm = {
    title: "",
    publisher: "",
    customPublisher: "",
    isbn: "",
    edition: "",
    cost: "",
    currencySymbol: "₹",
    month: "",
    year: "",
    scope: "National",
    applyIncentive: "",
    applyingSeedGrant: "No",
    isStudentsInvolved: "No",
    totalAuthors: 1,
    userAuthorPosition: 1,
    otherAuthors: [],
    appraisalEligible: "",
    approvedAmount: ""
  };

  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState({ coverPage: null, authorAffiliation: null, index: null });
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

    API.get("/api/research/textbook/editions")
      .then(res => setEditions(res.data?.data || []))
      .catch(() => { });

    API.get("/api/publishers")
      .then(res => setPublishers(res.data?.data || []))
      .catch(() => { });
  }, []);

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm(p => {
      const newForm = { ...p, [k]: val };
      if (k === "isbn") {
        newForm.title = "";
        newForm.publisher = "";
        newForm.month = "";
        newForm.year = "";
        setIsbnFetched(false);
        setIsbnFetchedFields({ title: false, publisher: false });
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

  const handleNumericChange = (key, allowDecimal = true) => (e) => {
    const val = e.target.value;
    const regex = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/;
    if (regex.test(val)) {
      setForm(p => ({ ...p, [key]: val }));
    }
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

  const fetchISBNData = async () => {
    if (!form.isbn) {
      toast.warning("Please enter an ISBN first");
      return;
    }
    setIsbnFetching(true);
    try {
      const res = await API.get(`/api/research/textbook/isbn/${form.isbn}`);
      if (res.data?.success) {
        const data = res.data.data;
        if (!data || !data.title) {
          throw new Error("ISBN details not found. Please fill fields manually");
        }
        let newMonth = form.month;
        let newYear = form.year;

        if (data.yearOfPublication) {
          const str = String(data.yearOfPublication);
          const yearMatch = str.match(/\b(19|20)\d{2}\b/);
          if (yearMatch) newYear = yearMatch[0];

          const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          for (let i = 0; i < 12; i++) {
            if (str.toLowerCase().includes(months[i].toLowerCase()) || str.toLowerCase().includes(shortMonths[i].toLowerCase())) {
              newMonth = months[i];
              break;
            }
          }
        }

        setForm(p => ({
          ...p,
          title: data.title || p.title,
          publisher: data.publisher || p.publisher,
          month: newMonth,
          year: newYear
        }));
        setIsbnFetched(true);
        setIsbnFetchedFields({
          title: !!data.title,
          publisher: !!data.publisher
        });
        toast.success("Book details fetched successfully!");
      } else {
        throw new Error(res.data?.message || "ISBN details not found. Please fill fields manually");
      }
    } catch (err) {
      const isbnClean = form.isbn.trim().replace(/-/g, "");
      try {
        const gbRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbnClean}`);
        if (gbRes.ok) {
          const gbJson = await gbRes.json();
          const item = gbJson?.items?.[0]?.volumeInfo;
          if (item?.title) {
            let newMonth = form.month;
            let newYear = form.year;
            if (item.publishedDate) {
              const yearMatch = item.publishedDate.match(/\b(19|20)\d{2}\b/);
              if (yearMatch) newYear = yearMatch[0];
            }
            const publisherName = item.publishers?.[0] || item.publisher || "";
            setForm(p => ({
              ...p,
              title: item.title || p.title,
              publisher: publisherName || p.publisher,
              year: newYear,
              month: newMonth
            }));
            setIsbnFetched(true);
            setIsbnFetchedFields({
              title: !!item.title,
              publisher: !!publisherName
            });
            toast.success("Book details fetched successfully from Google Books!");
            return;
          }
        }
      } catch (e) { }
      toast.error(err?.response?.data?.message || err.message || "Failed to fetch ISBN details");
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
    if (!form.title.trim() || !form.publisher.trim() || !form.isbn.trim() || !form.month || !form.year) {
      toast.error("Please fill in all required fields marked with *");
      return;
    }
    if (!form.applyIncentive) {
      toast.error("Please select whether you want to apply for incentive");
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
    if (!files.coverPage || !files.authorAffiliation || !files.index) {
      toast.error("Please attach all required documents (Cover Page, Author Affiliation, Index)");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();

      // standard fields
      fd.append("title", form.title);
      fd.append("publisher", form.publisher === "Others" ? form.customPublisher : form.publisher);
      fd.append("isbn", form.isbn);
      fd.append("edition", form.edition);
      fd.append("cost", form.cost || "");
      fd.append("month", form.month);
      fd.append("year", form.year);
      fd.append("yearOfPublication", form.year);
      fd.append("publicationScope", form.scope || "National");
      fd.append("scope", form.scope || "National");
      fd.append("currencySymbol", form.currencySymbol || "₹");

      // Incentive & Appraisal
      fd.append("isStudentsInvolved", form.isStudentsInvolved || "No");
      fd.append("applyingSeedGrant", form.applyingSeedGrant || "No");
      fd.append("applyIncentive", form.applyIncentive);
      fd.append("approvedAmount", form.applyIncentive === "Yes" ? form.approvedAmount : "");
      fd.append("appraisalEligible", form.appraisalEligible || "Yes");

      // Authors
      fd.append("totalAuthors", form.totalAuthors);
      fd.append("userAuthorPosition", form.userAuthorPosition);

      const allAuthors = [];
      const total = parseInt(form.totalAuthors) || 1;
      const userPos = parseInt(form.userAuthorPosition) || 1;

      for (let i = 1; i <= total; i++) {
        if (i === userPos) {
          allAuthors.push({
            authorPosition: i,
            authorName: targetFacultyDetails?.name || targetFacultyName,
            affiliationType: "Aditya University",
            employeeId: targetFacultyEmpId,
            affiliationName: "Aditya University"
          });
        } else {
          const coAuth = form.otherAuthors.find(a => a.authorPosition === i);
          if (coAuth) {
            allAuthors.push({
              authorPosition: coAuth.authorPosition,
              authorName: coAuth.authorName,
              affiliationType: coAuth.affiliationType,
              employeeId: coAuth.affiliationType === "Aditya University" ? coAuth.empId : null,
              studentId: coAuth.affiliationType === "Aditya University" && coAuth.CoAuthorType === "student" ? coAuth.studentId : null,
              CoAuthorType: form.isStudentsInvolved === "Yes" ? (coAuth.CoAuthorType || "faculty") : "faculty",
              affiliationName: coAuth.affiliationType === "Aditya University" ? "Aditya University" : coAuth.affiliationName
            });
          }
        }
      }
      fd.append("authors", JSON.stringify(allAuthors));

      fd.append("academicYear", selectedYear);
      fd.append("college", targetFacultyDetails?.college || user?.college || "");
      fd.append("panNumber", targetFacultyDetails?.panNumber || user?.panNumber || "");
      fd.append("isDirectEntry", "true");
      fd.append("targetFacultyEmpId", targetFacultyEmpId);

      // Mandatory files matching backend expected names
      if (files.coverPage) fd.append("coverPage", files.coverPage);
      if (files.authorAffiliation) fd.append("authorAffiliation", files.authorAffiliation);
      if (files.index) fd.append("index", files.index);

      await API.post("/api/research/textbook", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Textbook publication record added directly for faculty!");
      setForm(emptyForm);
      setFiles({ coverPage: null, authorAffiliation: null, index: null });
      setIsbnFetched(false);
      setIsbnFetchedFields({ title: false, publisher: false });
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
                placeholder="Enter Employee ID"
                value={targetFacultyEmpId}
                onChange={(e) => {
                  setTargetFacultyEmpId(e.target.value);
                  setIsTargetFacultyValid(false);
                  setTargetFacultyName("");
                  setTargetFacultyDetails(null);
                  setForm(emptyForm);
                  setFiles({ coverPage: null, authorAffiliation: null, index: null });
                  setIsbnFetched(false);
                  setIsbnFetchedFields({ title: false, publisher: false });
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
          <SubLabel text="Details of the Text Book:" />
          <Grid2 sx={{ mt: 1 }}>
            <Box>
              <Typography sx={labelStyle}>Publication Scope :</Typography>
              <Select
                fullWidth
                size="small"
                value={form.scope || "National"}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm(prev => ({
                    ...prev,
                    publisher: val,
                    scope: val,
                    customPublisher: "",
                    currencySymbol: val === "National" ? "₹" : "$"
                  }));
                }}
              >
                <MenuItem value="National">National</MenuItem>
                <MenuItem value="International">International</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography sx={labelStyle}>ISBN NO : *</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  value={form.isbn}
                  onChange={set("isbn")}
                  placeholder="Enter ISBN to auto-fetch"
                />
                <Button
                  variant="contained"
                  onClick={fetchISBNData}
                  disabled={!form.isbn || isbnFetching}
                  sx={{ minWidth: "100px", textTransform: "none", background: "var(--color-primary)" }}
                >
                  {isbnFetching ? <Loader size={20} color="inherit" /> : "Fetch"}
                </Button>
              </Box>
            </Box>

            <Box>
              <Typography sx={labelStyle}>Title of the Text Book : *</Typography>
              <TextField
                size="small"
                fullWidth
                value={form.title}
                onChange={set("title")}
                placeholder="Enter textbook title"
                disabled={isbnFetchedFields.title}
                sx={isbnFetchedFields.title ? disabledField : {}}
              />
            </Box>

            <Box>
              <Typography sx={labelStyle}>Name of the Publisher : *</Typography>
              <Autocomplete
                options={[...publishers.filter(p => p.type === form.scope), { name: "Others", type: form.scope }]}
                getOptionLabel={(option) => typeof option === "string" ? option : option.name}
                isOptionEqualToValue={(option, value) => option.name === value?.name}
                value={publishers.find(p => p.name === form.publisher) || (form.publisher === "Others" ? { name: "Others", type: form.scope } : (form.publisher ? { name: form.publisher, type: form.scope || "Unknown" } : null))}
                onChange={(e, newValue) => {
                  const val = newValue ? (typeof newValue === "string" ? newValue : newValue.name) : "";
                  setForm(p => ({ ...p, publisher: val }));
                }}
                freeSolo
                onInputChange={(e, newInputValue) => {
                  if (e?.type === "change") {
                    setForm(p => ({ ...p, publisher: newInputValue }));
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Select or search publisher"
                    disabled={isbnFetchedFields.publisher}
                    sx={isbnFetchedFields.publisher ? disabledField : {}}
                  />
                )}
              />
              {form.publisher === "Others" && (
                <TextField
                  size="small"
                  fullWidth
                  sx={{ mt: 1.5 }}
                  placeholder="Enter Publisher Name"
                  value={form.customPublisher}
                  onChange={(e) => setForm(p => ({ ...p, customPublisher: e.target.value }))}
                />
              )}
            </Box>

            <Box>
              <Typography sx={labelStyle}>Edition :</Typography>
              <Autocomplete
                freeSolo
                options={editions.map(e => typeof e === "string" ? e : e.name)}
                value={form.edition}
                onChange={(e, newValue) => setForm(p => ({ ...p, edition: newValue || "" }))}
                onInputChange={(e, newInputValue) => setForm(p => ({ ...p, edition: newInputValue }))}
                renderInput={(params) => <TextField {...params} size="small" placeholder="Select or type Edition (e.g. 1st Edition)" />}
              />
            </Box>

            <Box>
              <Typography sx={labelStyle}>Cost:</Typography>
              <Box sx={{
                display: "flex",
                alignItems: "center",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                height: "40px",
                background: "var(--bg-glass)",
                transition: "all 0.2s ease",
                "&:focus-within": { borderColor: "var(--color-primary)", boxShadow: "0 0 0 1px var(--color-primary)" }
              }}>
                <Box sx={{
                  display: "flex",
                  alignItems: "center",
                  px: 2,
                  borderRight: "1px solid var(--border-color)",
                  height: "100%",
                  background: "var(--bg-accent-1)",
                  borderTopLeftRadius: "8px",
                  borderBottomLeftRadius: "8px"
                }}>
                  <Typography sx={{ color: "var(--color-primary)", fontWeight: 500, fontSize: 16 }}>
                    {form.currencySymbol}
                  </Typography>
                </Box>
                <input
                  value={form.cost}
                  onChange={handleNumericChange("cost")}
                  placeholder="0.00"
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    padding: "0 16px",
                    background: "transparent",
                    fontSize: "14px",
                    color: "var(--text-primary)",
                    fontWeight: 500,
                    width: "100%"
                  }}
                />
                <Box sx={{ display: "flex", alignItems: "center", pr: 0.5 }}>
                  <Box sx={{ display: "flex", border: "1px solid var(--border-color)", borderRadius: "6px", overflow: "hidden", background: "var(--bg-panel)" }}>
                    <Box
                      onClick={() => setForm(p => ({ ...p, currencySymbol: "₹" }))}
                      sx={{
                        px: 1.5, py: 0.5, cursor: "pointer",
                        background: form.currencySymbol === "₹" ? "var(--color-primary)" : "transparent",
                        color: form.currencySymbol === "₹" ? "#fff" : "var(--text-secondary)",
                        fontWeight: 500, fontSize: 16, transition: "all 0.2s ease",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                      ₹
                    </Box>
                    <Box
                      onClick={() => setForm(p => ({ ...p, currencySymbol: "$" }))}
                      sx={{
                        px: 1.5, py: 0.5, cursor: "pointer",
                        background: form.currencySymbol === "$" ? "var(--color-primary)" : "transparent",
                        color: form.currencySymbol === "$" ? "#fff" : "var(--text-secondary)",
                        fontWeight: 500, fontSize: 16, transition: "all 0.2s ease",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                      $
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid2>

          {/* ── Publication Date ── */}
          <SubLabel text="Date of the Publication:" />
          <Grid2>
            <Box>
              <Typography sx={labelStyle}>Year: *</Typography>
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
              <Typography sx={labelStyle}>Month: *</Typography>
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

          {/* ── Incentive & Appraisal Options ── */}
          <SubLabel text="Incentive & Appraisal Options:" />
          <Grid2>
            <Box>
              <Typography sx={labelStyle}>Applying Seed Grant Work? : *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.applyingSeedGrant} onChange={set("applyingSeedGrant")}>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </Select>
            </Box>
            <Box>
              <Typography sx={labelStyle}>Apply Incentive? : *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.applyIncentive} onChange={set("applyIncentive")} disabled={form.isStudentsInvolved === "Yes"} sx={form.isStudentsInvolved === "Yes" ? disabledField : {}}>
                <MenuItem value="" disabled>Select Option</MenuItem>
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
                  placeholder="Enter approved incentive amount"
                  value={form.approvedAmount}
                  onChange={set("approvedAmount")}
                />
              </Box>
            )}
            <Box>
              <Typography sx={labelStyle}>Article Eligibility for Appraisal : *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.appraisalEligible} onChange={set("appraisalEligible")}>
                <MenuItem value="" disabled>Select Option</MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </Select>
            </Box>
          </Grid2>

          {/* ── Attachments ── */}
          <SubLabel text="Upload Required Documents:" />
          <NoteBox />
          <Grid2 sx={{ mt: 2 }}>
            <FileField
              label="Attach CoverPage *"
              name="coverPage"
              onChange={setFile("coverPage")}
              file={files.coverPage}
            />
            <FileField
              label="Attach Page displaying author affiliation *"
              name="authorAffiliation"
              onChange={setFile("authorAffiliation")}
              file={files.authorAffiliation}
            />
            <FileField
              label="Attach Index *"
              name="index"
              onChange={setFile("index")}
              file={files.index}
            />
          </Grid2>

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
