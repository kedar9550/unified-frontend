import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
import {
  Box, TextField, MenuItem, Select, Typography, Button,
  Radio, RadioGroup, FormControlLabel, Chip
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
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

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
  const [doiFetchedFields, setDoiFetchedFields] = useState({});

  const emptyForm = {
    doi: "",
    title: "",
    conferenceName: "",
    location: "", presentationMode: "", conferenceType: "",
    indexing: "",
    month: "",
    year: "",
    publisher: "",
    issnIsbn: "",
    applyIncentive: "No",
    applyingSeedGrant: "",
    isStudentsInvolved: "No",
    totalAuthors: 1,
    userAuthorPosition: 1,
    otherAuthors: [],
    appraisalEligible: "",
    approvedAmount: "",
    sdgs: ""
  };

  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState({ firstPage: null, certificate: null, completeDocument: null, flightTicket: null });

  const [scanningSdg, setScanningSdg] = useState(false);
  const [scannedSdgResults, setScannedSdgResults] = useState(null);
  const [sdgMap, setSdgMap] = useState({});
  const [sdgList, setSdgList] = useState([]);

  useEffect(() => {
    API.get("/api/sdgs").then(res => {
      if (res.data?.success) {
        setSdgList(res.data.data);
        const map = {};
        res.data.data.forEach(sdg => {
          const title = sdg.sdgTitle.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          map[sdg.sdgNumber] = `${sdg.sdgNumber}: ${title}`;
        });
        setSdgMap(map);
      }
    }).catch(err => console.error("Failed to fetch SDGs", err));
  }, []);

  const getSdgName = (sdgCode) => {
    const cleanCode = (sdgCode || "").trim();
    if (sdgMap[cleanCode]) return sdgMap[cleanCode];
    if (cleanCode.startsWith("SDG-")) return cleanCode;
    const key = `SDG-${cleanCode}`;
    return sdgMap[key] || cleanCode;
  };

  const hasPgStudent = form.otherAuthors?.some(ca => ca.CoAuthorType === 'student' && ca.studentQualification === 'PG');
  const isOtherConferenceType = form.conferenceType === 'Other';
  const disableIncentive = hasPgStudent || isOtherConferenceType;

  let estimatedAmountStr = "";
  let estimatedAmountNum = 0;
  if (form.applyIncentive === "Yes" && !disableIncentive) {
    if (form.location === "Abroad") {
      estimatedAmountStr = "The research committee will decide accordingly";
      estimatedAmountNum = 0;
    } else {
      const finalAmount = form.applyingSeedGrant === "Yes" ? 4000 : 8000;
      estimatedAmountStr = `₹${finalAmount.toLocaleString('en-IN')}`;
      estimatedAmountNum = finalAmount;
    }
  }

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
      let newForm = { ...p, [k]: val };
      if (k === "doi") {
        newForm = { ...emptyForm, doi: val };
        setDoiFetched(false);
        setDoiFetchedFields({});
      }
      if (k === "isStudentsInvolved") {
        if (val === "Yes") {
          if (parseInt(newForm.totalAuthors) < 2 || isNaN(parseInt(newForm.totalAuthors))) {
            newForm.totalAuthors = 2;
          }
        }
        if (val === "No") {
          newForm.otherAuthors = newForm.otherAuthors.map(a => ({
            ...a,
            CoAuthorType: "faculty",
            studentId: "",
            authorName: a.CoAuthorType === "student" ? "" : a.authorName,
            empId: a.CoAuthorType === "student" ? "" : a.empId
          }));
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
        scopusIndexed: "Yes"
      }));

      setDoiFetched(true);
      setDoiFetchedFields({
        title: Boolean(data.title),
        publisher: Boolean(data.publisher),
        issnIsbn: Boolean(data.issnIsbn),
        conferenceName: Boolean(data.conferenceName),
        year: Boolean(data.year),
        month: Boolean(data.month),
        scopusIndexed: true
      });
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
      
      // If previous value was "No" and new is "Yes", increment by 1
      if (prev.isStudentsInvolved === "No" && val === "Yes") {
        if (parseInt(newForm.totalAuthors) == 1) {
          newForm.totalAuthors = parseInt(newForm.totalAuthors) + 1;
        }
      } 
      // If previous value was "Yes" and new is "No", decrement by 1
      else if (prev.isStudentsInvolved === "Yes" && val === "No") {
        if (parseInt(newForm.totalAuthors) == 2) {
          newForm.totalAuthors = parseInt(newForm.totalAuthors) - 1;
        }
      }

      if (val === "No") {
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

  const validateFile = (file, k) => {
    if (!file) return true;
    if (file.type !== 'application/pdf') {
      toast.error("Only PDF files are allowed");
      return false;
    }
    const isCompleteDoc = k === 'completeDocument';
    const maxSize = isCompleteDoc ? 5 * 1024 * 1024 : 200 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size exceeds ${isCompleteDoc ? "5MB" : "200KB"} limit`);
      return false;
    }
    return true;
  };

  const handleCompleteDocumentChange = async (e) => {
    const file = e.target.files[0];
    const k = "completeDocument";
    if (!file) {
      setFiles(p => ({ ...p, [k]: null }));
      setForm(p => ({ ...p, sdgs: "" }));
      setScannedSdgResults(null);
      return;
    }

    if (!validateFile(file, k)) {
      e.target.value = null;
      return;
    }

    setFiles(p => ({ ...p, [k]: file }));

    // Dynamic scan client-side for SDGs
    setScanningSdg(true);
    setScannedSdgResults(null);
    try {
      let sdgData = {};
      const res = await API.get("/api/sdgs");
      if (res.data && res.data.success) {
        res.data.data.forEach(item => {
          sdgData[item.sdgNumber] = {
            title: item.sdgTitle,
            keywords: item.keywords
          };
        });
      }

      if (Object.keys(sdgData).length === 0) {
        toast.info("SDG keywords are loading. Dynamic scanning skipped.");
        setScanningSdg(false);
        return;
      }

      let text = "";
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map(item => item.str).join(" ") + " ";
        }
        text = fullText;
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      }

      const normalizeText = (t) => {
        return t.toLowerCase()
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/[^a-z0-9'\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      text = normalizeText(text);

      const matchedList = [];
      Object.entries(sdgData).forEach(([number, data]) => {
        let matchCount = 0;
        data.keywords.forEach(keyword => {
          const kw = normalizeText(keyword);
          if (kw.length > 2) {
            const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedKw}\\b`, "gi");
            const matches = text.match(regex);
            if (matches) {
              matchCount += matches.length;
            }
          }
        });
        if (matchCount > 0) {
          matchedList.push(number);
        }
      });

      const matchedStr = matchedList.join(", ");
      setForm(p => ({ ...p, sdgs: matchedStr }));
      setScannedSdgResults(matchedList);
      toast.success(`SDG keyword scanning completed! Matched: ${matchedList.length > 0 ? matchedStr : "None"}`);
    } catch (err) {
      console.error("SDG scan error:", err);
      toast.error("Failed to dynamically scan SDG keywords, but file was attached");
    } finally {
      setScanningSdg(false);
    }
  };

  const setFile = (k) => (e) => {
    if (k === "completeDocument") {
      handleCompleteDocumentChange(e);
      return;
    }
    const file = e.target.files[0];
    if (file && validateFile(file, k)) setFiles(p => ({ ...p, [k]: file }));
    else e.target.value = null;
  };

  const handleSubmit = async () => {
    if (!isTargetFacultyValid || !targetFacultyEmpId) {
      toast.error("Please verify target faculty Employee ID first!");
      return;
    }

    if (!form.title.trim() || !form.conferenceName.trim() || !form.location || !form.conferenceType || !form.scopusIndexed || !form.year || !form.month) {
      toast.error("Please fill in all required fields marked with *");
      return;
    }

    if (!form.appraisalEligible) {
      toast.error("Please select Appraisal Eligible status");
      return;
    }

    // applyIncentive is always "No" — no validation needed for approved amount

    if (!files.firstPage || !files.certificate || !files.completeDocument) {
      toast.error("Please attach all required documents (First Page, Certificate, Complete Document)");
      return;
    }
    if (form.location === "Abroad" && form.presentationMode === "Offline" && !files.flightTicket) {
      toast.error("Please attach the flight ticket bill for abroad offline conference");
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
        "doi", "title", "conferenceName", "location", "presentationMode", "conferenceType", "scopusIndexed",
        "publisher", "issnIsbn", "applyIncentive", "applyingSeedGrant",
        "totalAuthors", "userAuthorPosition", "isStudentsInvolved",
        "appraisalEligible", "approvedAmount"
      ];
      fields.forEach(k => {
        fd.append(k, form[k] ?? "");
      });

      fd.append("estimatedIncentiveAmount", estimatedAmountNum);
      fd.append("month", form.month);
      fd.append("year", form.year);
      fd.append("coAuthors", JSON.stringify(coAuthorsList));
      fd.append("academicYear", selectedYear);
      fd.append("college", targetFacultyDetails?.college || user?.college || "");
      fd.append("panNumber", targetFacultyDetails?.panNumber || user?.panNumber || "");
      fd.append("isDirectEntry", "true");
      fd.append("targetFacultyEmpId", targetFacultyEmpId);
      fd.append("sdgs", form.sdgs || "");

      if (files.firstPage) fd.append("firstPage", files.firstPage);
      if (files.certificate) fd.append("certificate", files.certificate);
      if (files.completeDocument) fd.append("completeDocument", files.completeDocument);
      if (files.flightTicket) fd.append("flightTicket", files.flightTicket);

      await API.post("/api/research/conference", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Conference record added directly for faculty!");

      setForm(emptyForm);
      setFiles({ firstPage: null, certificate: null, completeDocument: null, flightTicket: null });
      setScannedSdgResults(null);
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
                placeholder="Enter Employee ID"
                value={targetFacultyEmpId}
                onChange={(e) => {
                  setTargetFacultyEmpId(e.target.value);
                  setIsTargetFacultyValid(false);
                  setTargetFacultyName("");
                  setTargetFacultyDetails(null);
                  setForm(emptyForm);
                  setFiles({ firstPage: null, certificate: null, completeDocument: null, flightTicket: null });
                  setDoiFetched(false);
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
              <TextField size="small" fullWidth multiline rows={2} value={form.title} onChange={set("title")} placeholder="Auto-filled from DOI" disabled={true} sx={disabledField} />
            </Box>

            {/* Conference Name */}
            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
              <Typography sx={labelStyle}>Name of the Conference : *</Typography>
              <TextField size="small" fullWidth value={form.conferenceName} onChange={set("conferenceName")} placeholder="Auto-filled from DOI" disabled={true} sx={disabledField} />
            </Box>

            {/* Publisher */}
            <Box>
              <Typography sx={labelStyle}>Publisher : *</Typography>
              <TextField size="small" fullWidth value={form.publisher} onChange={set("publisher")} placeholder="Auto-filled from DOI" disabled={true} sx={disabledField} />
            </Box>

            {/* ISSN/ISBN */}
            <Box>
              <Typography sx={labelStyle}>ISSN / ISBN Number :</Typography>
              <TextField size="small" fullWidth value={form.issnIsbn} onChange={(e) => {
                const val = e.target.value;
                if (/^[0-9X-]*$/i.test(val)) setForm(p => ({ ...p, issnIsbn: val }));
              }} placeholder="e.g. 1234-5678" disabled={doiFetched && Boolean(doiFetchedFields.issnIsbn)} sx={(doiFetched && Boolean(doiFetchedFields.issnIsbn)) ? disabledField : {}} />
            </Box>

            {/* Scope */}
            <Box>
              <Typography sx={labelStyle}>Conference Location : *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.location} onChange={(e) => {
                 set("location")(e);
                 if (e.target.value !== "Abroad") {
                    setForm(p => ({ ...p, location: e.target.value, presentationMode: "" }));
                    setFiles(p => ({ ...p, flightTicket: null }));
                 }
              }}>
                <MenuItem value="">Select Location</MenuItem>
                <MenuItem value="India">India</MenuItem>
                <MenuItem value="Abroad">Abroad</MenuItem>
              </Select>
            </Box>
            {form.location === "Abroad" && (
              <Box>
                <Typography sx={labelStyle}>Presentation Mode : *</Typography>
                <Select size="small" fullWidth displayEmpty value={form.presentationMode || ""} onChange={(e) => {
                   set("presentationMode")(e);
                   if (e.target.value !== "Offline") {
                      setFiles(p => ({ ...p, flightTicket: null }));
                   }
                }}>
                  <MenuItem value="" disabled>Select Mode</MenuItem>
                  <MenuItem value="Online">Online</MenuItem>
                  <MenuItem value="Offline">Offline</MenuItem>
                </Select>
              </Box>
            )}

            <Box>
              <Typography sx={labelStyle}>Conference Type / Host Institute : *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.conferenceType} onChange={(e) => {
                 set("conferenceType")(e);
                 if (e.target.value === "Other") {
                    setForm(p => ({ ...p, applyIncentive: "No" }));
                 }
              }}>
                <MenuItem value="">Select Type</MenuItem>
                <MenuItem value="IEEE">IEEE</MenuItem>
                <MenuItem value="IIT">IIT</MenuItem>
                <MenuItem value="IISc">IISc</MenuItem>
                <MenuItem value="NIT">NIT</MenuItem>
                <MenuItem value="IIM">IIM</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </Box>

            {/* Scopus Indexed */}
            <Box>
              <Typography sx={labelStyle}>Scopus Indexed : *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.scopusIndexed} onChange={set("scopusIndexed")} disabled={true} sx={disabledField}>
                <MenuItem value="" disabled>Auto-filled from DOI</MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
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
              }} disabled={true} sx={disabledField}>
                <MenuItem value="" disabled>Auto-filled from DOI</MenuItem>
                {(form.year && !YEARS.includes(String(form.year))
                  ? [...YEARS, String(form.year)].sort((a, b) => Number(b) - Number(a))
                  : YEARS
                ).map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </Box>
            <Box>
              <Typography sx={labelStyle}>Month : *</Typography>
              <Select size="small" fullWidth displayEmpty value={form.month} onChange={set("month")} disabled={true} sx={disabledField}>
                <MenuItem value="" disabled>Auto-filled from DOI</MenuItem>
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
                            <Box sx={{ flex: 1.5, minWidth: { xs: "100%", sm: "160px" } }}>
                              <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>STUDENT NAME</Typography>
                              <TextField
                                size="small"
                                fullWidth
                                value={ca.authorName}
                                onChange={(e) => handleCoAuthorChange(ca.authorPosition, "authorName", e.target.value)}
                                placeholder="Full Name"
                              />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "110px" } }}>
                              <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>QUALIFICATION</Typography>
                              <Select
                                size="small"
                                fullWidth
                                displayEmpty
                                value={ca.studentQualification || ""}
                                onChange={(e) => handleCoAuthorChange(ca.authorPosition, "studentQualification", e.target.value)}
                              >
                                <MenuItem value="" disabled>Select</MenuItem>
                                <MenuItem value="UG">UG</MenuItem>
                                <MenuItem value="PG">PG</MenuItem>
                                <MenuItem value="Ph.D">Ph.D</MenuItem>
                              </Select>
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
              <Typography sx={labelStyle}>Apply Incentive? : *</Typography>
              <Select size="small" fullWidth displayEmpty value={disableIncentive ? "No" : (form.applyIncentive || "No")} onChange={set("applyIncentive")} disabled={disableIncentive} sx={disableIncentive ? disabledField : {}}>
                <MenuItem value="No">No</MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
              </Select>
              {hasPgStudent && (
                <Typography variant="caption" sx={{ color: "#ef4444", fontWeight: 600, mt: 0.5, display: "block" }}>
                  * Incentive is not applicable for publications with PG student co-authors.
                </Typography>
              )}
            </Box>
            {form.applyIncentive === "Yes" && !disableIncentive && (
              <Box>
                <Typography sx={labelStyle}>Approved Incentive Amount (₹) : *</Typography>
                <TextField size="small" fullWidth type="number" value={form.approvedAmount} onChange={set("approvedAmount")} />
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
          
          {estimatedAmountStr && (
            <Box sx={{
              p: 2,
              mt: 2,
              borderRadius: "8px",
              bgcolor: "rgba(16, 185, 129, 0.05)",
              border: "1px dashed rgba(16, 185, 129, 0.4)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <Typography sx={{ fontWeight: 600, color: "var(--text-primary)" }}>
                Estimated Incentive Amount:
              </Typography>
              <Typography sx={{ fontWeight: 700, color: "#10b981", fontSize: "1.05rem" }}>
                {estimatedAmountStr}
              </Typography>
            </Box>
          )}

          {/* ── Attachments ── */}
          <SubLabel text="Upload Required Documents:" />
          <NoteBox />
          <Grid2 sx={{ mt: 2 }}>
            <FileField
              label="Published Paper - 1st Page in conference * :"
              name="firstPage"
              onChange={setFile("firstPage")}
            />
            <FileField
              label="Certificate of Presentation * :"
              name="certificate"
              onChange={setFile("certificate")}
            />
            <Box>
              <FileField
                label="Complete Document * :"
                name="completeDocument"
                onChange={setFile("completeDocument")}
              />
              {scanningSdg && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1, p: 1.5, borderRadius: '8px', bgcolor: 'rgba(25, 118, 210, 0.05)', border: '1px solid rgba(25, 118, 210, 0.2)' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--color-primary)' }}>Scanning complete document for SDG keywords...</Typography>
                </Box>
              )}
              {!scanningSdg && form.sdgs && (
                <Box sx={{ mt: 1.5, p: 2, borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-accent-1)' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', display: 'block', mb: 1 }}>Matched SDGs from Scanning:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {form.sdgs.split(', ').map((sdg, idx) => (
                      <Chip key={idx} label={getSdgName(sdg)} size="small" sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', fontWeight: 800 }} />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
            {form.location === "Abroad" && form.presentationMode === "Offline" && (
              <FileField
                label="Upload flight ticket bill * :"
                name="flightTicket"
                onChange={setFile("flightTicket")}
              />
            )}
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
        title="Conference Data Entry (R&D Direct Entry)"
        subtitle="Directly submit approved conference records on behalf of faculty members"
      />
      {renderForm()}
    </PageContainer>
  );
}
