import Loader from "../../components/common/Loader";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

import {
  Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress
} from "@mui/material";
import { toast } from "sonner";
import { Search } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn,
  labelStyle, disabledField, MONTHS, YEARS
} from "../../components/faculty/PublicationFormFields";
import API from "../../api/axios";

// ─── Constants ───────────────────────────────────────────────────────────────
const JOURNAL_TYPES = ["SCI", "SCIE", "ESCI", "WoS", "SCOPUS"];
const QUARTILE_OPTIONS = ["Q1", "Q2", "Q3", "Q4", "N/A"];
const INCENTIVE_OPTIONS = ["National", "International"];

// ─── Scopus / Elsevier API keys ───────────────────────────────────────────────
const ELSEVIER_API_KEY = "0436d4fe788649172354545ceca9e650";

// ─── DOI Fetch Helper ─────────────────────────────────────────────────────────
async function fetchJournalDataByDOI(doi) {
  const headers = {
    "X-ELS-APIKey": ELSEVIER_API_KEY,
    Accept: "application/json",
  };

  // 1. Abstract / article metadata
  const abstractRes = await fetch(
    `https://api.elsevier.com/content/abstract/doi/${encodeURIComponent(doi)}`,
    { method: "GET", headers }
  );
  if (!abstractRes.ok) throw new Error("DOI not found in Scopus. Please fill fields manually.");
  const abstractJson = await abstractRes.json();
  const coredata = abstractJson?.["abstracts-retrieval-response"]?.coredata || {};

  const title = coredata["dc:title"] || "";
  const journalName = coredata["prism:publicationName"] || "";
  const vol = coredata["prism:volume"] || "";
  const issue = coredata["prism:issueIdentifier"] || "";
  const pageRange = coredata["prism:pageRange"] || "";
  const coverDisplayDate = coredata["prism:coverDisplayDate"] || "";
  const issn = (coredata["prism:issn"] || coredata["prism:eIssn"] || "").replace(/-/g, "");

  // Parse month/year from coverDisplayDate e.g. "January 2024" or "2024-01-15"
  let month = "";
  let year = "";
  if (coverDisplayDate) {
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const shortMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const yearMatch = coverDisplayDate.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) year = yearMatch[0];
    for (let i = 0; i < 12; i++) {
      if (
        coverDisplayDate.toLowerCase().includes(monthNames[i].toLowerCase()) ||
        coverDisplayDate.toLowerCase().includes(shortMonths[i].toLowerCase())
      ) {
        month = monthNames[i];
        break;
      }
    }
    // ISO date fallback: 2024-01-15
    if (!month) {
      const isoMatch = coverDisplayDate.match(/\d{4}-(\d{2})/);
      if (isoMatch) month = monthNames[parseInt(isoMatch[1], 10) - 1] || "";
    }
  }

  // 2. Serial / journal metrics (H-Index, impact factor, quartile) via ISSN
  let hIndex = "";
  let impactFactor = "";
  let quartile = "";
  let journalType = "";

  if (issn) {
    try {
      const serialRes = await fetch(
        `https://api.elsevier.com/content/serial/title/issn/${issn}`,
        { method: "GET", headers }
      );
      if (serialRes.ok) {
        const serialJson = await serialRes.json();
        const entry = serialJson?.["serial-metadata-response"]?.entry?.[0] || {};
        hIndex = entry["H-index"] || entry["SNIPList"]?.SNIP?.[0]?.["$"] || "";
        // Impact Factor from SJRList or CiteScoreYearInfoList
        const sjr = entry["SJRList"]?.SJR?.[0]?.["$"];
        impactFactor = sjr || "";

        // Quartile from source-normalized metrics
        const ranks = entry["SubjectList"]?.Subject || [];
        if (Array.isArray(ranks) && ranks.length > 0) {
          quartile = ranks[0]["$"] || "";
        }

        // Journal type — check subject areas for SCI/SCIE/ESCI/WoS/SCOPUS flags
        const coverageList = entry["coverageList"]?.coverage || [];
        const types = new Set();
        coverageList.forEach(c => {
          const name = (c["@type"] || "").toUpperCase();
          if (name.includes("SCIE")) types.add("SCIE");
          else if (name.includes("ESCI")) types.add("ESCI");
          else if (name.includes("SCI")) types.add("SCI");
          if (name.includes("WOS") || name.includes("WEB OF SCIENCE")) types.add("WoS");
        });
        // Scopus coverage always present if we got here
        types.add("SCOPUS");
        journalType = [...types].join(", ");
      }
    } catch (_) { /* ignore serial fetch errors */ }
  }

  return { title, journalName, vol, issue, pageRange, month, year, hIndex, impactFactor, quartile, journalType, issn };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function JournalPublication() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'select-year' | 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [publicationsList, setPublicationsList] = useState([]);

  // DOI fetch state
  const [doiFetching, setDoiFetching] = useState(false);
  const [doiFetched, setDoiFetched] = useState(false);
  const [doiFetchedFields, setDoiFetchedFields] = useState({});

  const emptyForm = {
    doi: "",
    paperTitle: "",
    journalName: "",
    journalQuartile: "",
    journalType: "",
    vol: "",
    issue: "",
    pageNos: "",
    hIndex: "",
    impactFactor: "",
    agecRefCount: "",
    referencingNos: "",
    month: "",
    year: "",
    applyIncentive: "",
    incentiveApplied: "",
    // Author details
    totalAuthors: 1,
    userAuthorPosition: 1,
    otherAuthors: [],
  };

  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState({ publishedPaper: null, referencePages: null });
  const [loading, setLoading] = useState(false);

  // ── Dynamic co-author list (mirrors TextbookPublication logic) ──────────────
  useEffect(() => {
    const total = parseInt(form.totalAuthors) || 1;
    const pos = parseInt(form.userAuthorPosition) || 1;

    if (pos > total) {
      setForm(p => ({ ...p, userAuthorPosition: total }));
      return;
    }
    if (total === 1) {
      setForm(p => ({ ...p, otherAuthors: [] }));
      return;
    }

    const newOtherAuthors = [];
    for (let i = 1; i <= total; i++) {
      if (i !== pos) {
        const existing = form.otherAuthors.find(a => a.authorPosition === i);
        newOtherAuthors.push(existing || {
          authorPosition: i,
          affiliationType: "",
          empId: "",
          authorName: "",
          affiliationName: "",
        });
      }
    }
    setForm(p => ({ ...p, otherAuthors: newOtherAuthors }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.totalAuthors, form.userAuthorPosition]);

  useEffect(() => {
    API.get("/api/research/journal")
      .then(res => setPublicationsList(res.data?.data || res.data || []))
      .catch(() => {});
    API.get("/api/academic-years")
      .then(res => setAcademicYears(res.data?.years || res.data?.data || []))
      .catch(() => {});
  }, [viewMode]);

  // ── Field setters ────────────────────────────────────────────────────────────
  const set = (k) => (e) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    if (k === "doi") {
      setDoiFetched(false);
      setDoiFetchedFields({});
    }
  };

  const validateFile = (file) => {
    if (!file) return true;
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) { toast.error("Only PDF, JPG, and PNG files are allowed."); return false; }
    if (file.size > 500 * 1024) { toast.error("File size exceeds 500KB limit."); return false; }
    return true;
  };

  const setFile = (k) => (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) setFiles(p => ({ ...p, [k]: file }));
    else e.target.value = null;
  };

  // ── DOI Fetch ────────────────────────────────────────────────────────────────
  const fetchDOIData = async () => {
    if (!form.doi.trim()) { toast.warning("Please enter a DOI first."); return; }
    setDoiFetching(true);
    try {
      const data = await fetchJournalDataByDOI(form.doi.trim());

      const fetched = {};
      const patch = {};

      const map = {
        paperTitle: data.title,
        journalName: data.journalName,
        vol: data.vol,
        issue: data.issue,
        pageNos: data.pageRange,
        month: data.month,
        year: data.year,
        hIndex: String(data.hIndex || ""),
        impactFactor: String(data.impactFactor || ""),
        journalQuartile: data.quartile,
        journalType: data.journalType,
      };

      Object.entries(map).forEach(([k, v]) => {
        if (v) { patch[k] = v; fetched[k] = true; }
      });

      setForm(p => ({ ...p, ...patch }));
      setDoiFetched(true);
      setDoiFetchedFields(fetched);
      toast.success("Journal details fetched successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to fetch DOI details.");
    } finally {
      setDoiFetching(false);
    }
  };

  // ── Co-author helpers ────────────────────────────────────────────────────────
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
    } catch (_) {}
  };

  const handleCoAuthorChange = (pos, field, value) => {
    const updated = form.otherAuthors.map(a => {
      if (a.authorPosition !== pos) return a;
      const newA = { ...a, [field]: value };
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

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user?.panNumber || user?.panNumber === "Not Set" || !user?.college || user?.college === "Not Set") {
      toast.error("Please update your profile with PAN Number and College before submitting.");
      return;
    }
    if (!form.doi || !form.paperTitle || !form.journalName || !form.vol || !form.issue || !form.pageNos || !form.month || !form.year || !form.hIndex || !form.impactFactor) {
      toast.error("Please fill all required fields.");
      return;
    }
    if (!form.applyIncentive) {
      toast.error("Please select whether you want to apply for an incentive.");
      return;
    }
    if (form.applyIncentive === "Yes" && !form.incentiveApplied) {
      toast.error("Please select National or International for Research Incentive.");
      return;
    }

    // Validate co-authors
    const total = parseInt(form.totalAuthors);
    if (total > 1) {
      for (const a of form.otherAuthors) {
        if (
          !a.affiliationType ||
          (a.affiliationType === "Others" && (!a.authorName || !a.affiliationName)) ||
          (a.affiliationType === "Aditya University" && (!a.empId || !a.authorName))
        ) {
          toast.error(`Please complete details for Author Position ${a.authorPosition}.`);
          return;
        }
      }
    }

    if (!files.publishedPaper || !files.referencePages) {
      toast.error("Please attach all required documents.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      const total = parseInt(form.totalAuthors);
      const pos = parseInt(form.userAuthorPosition);
      const allAuthors = [];
      for (let i = 1; i <= total; i++) {
        if (i === pos) allAuthors.push({ authorPosition: i });
        else {
          const coAuth = form.otherAuthors.find(a => a.authorPosition === i);
          if (coAuth) allAuthors.push(coAuth);
        }
      }

      const fields = [
        "doi","paperTitle","journalName","journalQuartile","journalType",
        "vol","issue","pageNos","hIndex","impactFactor","agecRefCount",
        "referencingNos","month","year","applyIncentive","incentiveApplied",
        "totalAuthors","userAuthorPosition",
      ];
      fields.forEach(k => fd.append(k, form[k] ?? ""));
      fd.append("authors", JSON.stringify(allAuthors));
      fd.append("academicYear", selectedYear);
      fd.append("college", user?.college || "");
      fd.append("panNumber", user?.panNumber || "");

      if (files.publishedPaper) fd.append("publishedPaper", files.publishedPaper);
      if (files.referencePages) fd.append("referencePages", files.referencePages);

      await API.post("/api/research/journal", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Journal submitted successfully!");

      setForm(emptyForm);
      setFiles({ publishedPaper: null, referencePages: null });
      setDoiFetched(false);
      setDoiFetchedFields({});
      setSelectedYear("");
      setViewMode("list");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────────
  const renderList = () => (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>My Journal Publications</Typography>
        <Button
          variant="contained"
          onClick={() => setViewMode("select-year")}
          sx={{ background: "var(--gradient-primary)", borderRadius: "12px", px: 3, fontWeight: 700, textTransform: "none", "&:hover": { opacity: 0.9, transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }, transition: "all 0.2s ease" }}
        >
          Apply New
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
        <Table>
          <TableHead sx={{ background: "var(--gradient-primary)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>DOI</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Paper Title</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Journal Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Quartile</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Academic Year</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(!publicationsList || publicationsList.length === 0) ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No previous publications found. Click "Apply New" to submit one.
                </TableCell>
              </TableRow>
            ) : (
              publicationsList.map((pub, i) => (
                <TableRow key={pub._id || i}>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2, fontSize: 12 }}>{pub.doi || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>{pub.paperTitle || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.journalName || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.journalQuartile || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.academicYear?.year || "N/A"}</TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" sx={{
                      color: pub.status?.includes("Rejected") ? "#ef4444" : pub.status === "Approved" ? "#10b981" : "#e8a000",
                      fontWeight: 700,
                      background: pub.status?.includes("Rejected") ? "rgba(239,68,68,0.1)" : pub.status === "Approved" ? "rgba(16,185,129,0.1)" : "rgba(232,160,0,0.1)",
                      px: 1.5, py: 0.5, borderRadius: "6px", display: "inline-block"
                    }}>
                      {pub.status || "Pending"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderSelectYear = () => (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 5 }}>
      <FormCard title="Select Academic Year">
        <Typography sx={{ mb: 2, color: "var(--text-secondary)", fontWeight: 500 }}>Please select the academic year for this publication submission:</Typography>
        <Select fullWidth size="small" displayEmpty value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
          <MenuItem value="" disabled>Select Academic Year</MenuItem>
          {academicYears.map(y => <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>)}
        </Select>
        <Box sx={{ display: "flex", gap: 2, mt: 4, justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={() => setViewMode("list")} sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 600, color: "var(--text-primary)", borderColor: "var(--border-color)", "&:hover": { borderColor: "var(--color-primary)", background: "rgba(0,0,0,0.02)" } }}>Cancel</Button>
          <Button variant="contained" disabled={!selectedYear} onClick={() => setViewMode("form")} sx={{ background: "var(--gradient-primary)", borderRadius: "12px", px: 4, fontWeight: 700, textTransform: "none", "&:hover": { opacity: 0.9, transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }, "&.Mui-disabled": { background: "var(--bg-panel)", color: "var(--text-secondary)", opacity: 0.5 }, transition: "all 0.2s ease" }}>Proceed</Button>
        </Box>
      </FormCard>
    </Box>
  );

  const isFetched = (field) => doiFetched && doiFetchedFields[field];

  const renderForm = () => (
    <FormCard title="Journal Publication Submission">
      {/* Academic Year Badge */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 0.8, borderRadius: "8px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
        <Button size="small" variant="text" onClick={() => setViewMode("select-year")} sx={{ fontWeight: 700, textTransform: "none", color: "var(--color-primary)" }}>Change Year</Button>
      </Box>

      <FacultyInfoRow />

      {/* ── DOI Section ── */}
      <SubLabel text="DOI Lookup:" />
      <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Enter DOI (e.g. 10.1038/s41598-024-12345-y)"
          value={form.doi}
          onChange={set("doi")}
        />
        <Button
          variant="contained"
          onClick={fetchDOIData}
          disabled={!form.doi || doiFetching}
          startIcon={doiFetching ? <Loader size={16} color="inherit" /> : <Search />}
          sx={{ minWidth: "130px", textTransform: "none", borderRadius: "8px", fontWeight: 700, background: "var(--color-primary)", whiteSpace: "nowrap" }}
        >
          {doiFetching ? "Fetching…" : "Fetch Data"}
        </Button>
      </Box>

      {doiFetched && (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: "8px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}>
          <Typography sx={{ fontSize: 12, color: "#10b981", fontWeight: 700 }}>
            ✓ Details auto-filled from Scopus. Review and complete any remaining fields below.
          </Typography>
        </Box>
      )}

      {/* ── Article Details ── */}
      <SubLabel text="Details of the Journal Article:" />
      <Grid2 sx={{ mt: 1 }}>
        {/* Title */}
        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
          <Typography sx={labelStyle}>Title of the Article : *</Typography>
          <TextField size="small" fullWidth multiline rows={2} value={form.paperTitle} onChange={set("paperTitle")} disabled={isFetched("paperTitle")} sx={isFetched("paperTitle") ? disabledField : {}} />
        </Box>

        {/* Journal Name */}
        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
          <Typography sx={labelStyle}>Name of the Journal : *</Typography>
          <TextField size="small" fullWidth value={form.journalName} onChange={set("journalName")} disabled={isFetched("journalName")} sx={isFetched("journalName") ? disabledField : {}} />
        </Box>

        {/* Quartile */}
        <Box>
          <Typography sx={labelStyle}>Journal Quartile : *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.journalQuartile} onChange={set("journalQuartile")} disabled={isFetched("journalQuartile")} sx={isFetched("journalQuartile") ? disabledField : {}}>
            <MenuItem value="">Select</MenuItem>
            {QUARTILE_OPTIONS.map(q => <MenuItem key={q} value={q}>{q}</MenuItem>)}
          </Select>
        </Box>

        {/* Journal Type */}
        <Box>
          <Typography sx={labelStyle}>Type of Journal :</Typography>
          <Select size="small" fullWidth displayEmpty value={form.journalType} onChange={set("journalType")} disabled={isFetched("journalType")} sx={isFetched("journalType") ? disabledField : {}}>
            <MenuItem value="">Select</MenuItem>
            {JOURNAL_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </Box>

        {/* Vol */}
        <Box>
          <Typography sx={labelStyle}>Vol : *</Typography>
          <TextField size="small" fullWidth value={form.vol} onChange={set("vol")} disabled={isFetched("vol")} sx={isFetched("vol") ? disabledField : {}} />
        </Box>

        {/* Issue */}
        <Box>
          <Typography sx={labelStyle}>Issue : *</Typography>
          <TextField size="small" fullWidth value={form.issue} onChange={set("issue")} disabled={isFetched("issue")} sx={isFetched("issue") ? disabledField : {}} />
        </Box>

        {/* Page Nos */}
        <Box>
          <Typography sx={labelStyle}>Page No's : *</Typography>
          <TextField size="small" fullWidth value={form.pageNos} onChange={set("pageNos")} disabled={isFetched("pageNos")} sx={isFetched("pageNos") ? disabledField : {}} placeholder="e.g. 1245-1258" />
        </Box>

        {/* H-Index */}
        <Box>
          <Typography sx={labelStyle}>Journal H-Index : *</Typography>
          <TextField size="small" fullWidth value={form.hIndex} onChange={set("hIndex")} disabled={isFetched("hIndex")} sx={isFetched("hIndex") ? disabledField : {}} />
        </Box>

        {/* Impact Factor */}
        <Box>
          <Typography sx={labelStyle}>Impact Factor : *</Typography>
          <TextField size="small" fullWidth value={form.impactFactor} onChange={set("impactFactor")} disabled={isFetched("impactFactor")} sx={isFetched("impactFactor") ? disabledField : {}} />
        </Box>

        {/* AGEC References */}
        <Box>
          <Typography sx={labelStyle}>Number of References Belonging to AGEC :</Typography>
          <TextField size="small" fullWidth type="number" value={form.agecRefCount} onChange={set("agecRefCount")} inputProps={{ min: 0 }} />
        </Box>

        {/* Referencing Nos */}
        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
          <Typography sx={labelStyle}>Mention the Referencing No's that Belong to AGEC :</Typography>
          <TextField size="small" fullWidth placeholder="e.g. 3, 7, 12" value={form.referencingNos} onChange={set("referencingNos")} />
        </Box>
      </Grid2>

      {/* ── Publication Date ── */}
      <SubLabel text="Date of the Publication:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Month : *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.month} onChange={set("month")} disabled={isFetched("month")} sx={isFetched("month") ? disabledField : {}}>
            <MenuItem value="">Select</MenuItem>
            {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Year : *</Typography>
          <TextField size="small" fullWidth value={form.year} onChange={set("year")} placeholder="YYYY" inputProps={{ maxLength: 4 }} disabled={isFetched("year")} sx={isFetched("year") ? disabledField : {}} />
        </Box>
      </Grid2>

      {/* ── Author Details (like TextbookPublication) ── */}
      <Box sx={{ mt: 3, p: 2, borderRadius: "12px", border: "1px solid var(--border-color)", background: "var(--bg-panel)" }}>
        <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 2 }}>Author Details</Typography>
        <Grid2>
          <Box>
            <Typography sx={labelStyle}>Total Number of Authors :</Typography>
            <TextField size="small" fullWidth type="number" value={form.totalAuthors} onChange={set("totalAuthors")} inputProps={{ min: 1 }} />
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
                  {/* Position badge */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: "30px", height: "30px", background: "var(--color-primary)", color: "#fff", borderRadius: "50%", fontWeight: 700, fontSize: 14 }}>
                    {ca.authorPosition}
                  </Box>

                  {/* Affiliation Type */}
                  <Box sx={{ flex: 1, minWidth: "150px" }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION TYPE</Typography>
                    <Select
                      size="small"
                      fullWidth
                      displayEmpty
                      value={ca.affiliationType}
                      onChange={(e) => handleCoAuthorChange(ca.authorPosition, "affiliationType", e.target.value)}
                    >
                      <MenuItem value="" disabled>Select Affiliation</MenuItem>
                      <MenuItem value="Aditya University">Aditya University</MenuItem>
                      <MenuItem value="Others">Others</MenuItem>
                    </Select>
                  </Box>

                  {/* Aditya University → EmpID + fetched name */}
                  {ca.affiliationType === "Aditya University" ? (
                    <>
                      <Box sx={{ flex: 1, minWidth: "120px" }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>EMPLOYEE ID</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={ca.empId}
                          onChange={(e) => handleCoAuthorChange(ca.authorPosition, "empId", e.target.value)}
                          placeholder="e.g. 5741"
                        />
                      </Box>
                      <Box sx={{ flex: 2, minWidth: "200px" }}>
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
                  ) : (
                    <>
                      <Box sx={{ flex: 1, minWidth: "180px" }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-AUTHOR NAME</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={ca.authorName}
                          onChange={(e) => handleCoAuthorChange(ca.authorPosition, "authorName", e.target.value)}
                          placeholder="Full Name"
                        />
                      </Box>
                      <Box sx={{ flex: 2, minWidth: "200px" }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={ca.affiliationName}
                          onChange={(e) => handleCoAuthorChange(ca.authorPosition, "affiliationName", e.target.value)}
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

      {/* ── Documents ── */}
      <NoteBox />
      <Grid2 sx={{ mt: 2 }}>
        <FileField label="Published Paper – 1st Page *" name="publishedPaper" onChange={setFile("publishedPaper")} />
        <FileField label="Reference Pages (with tick mark) *" name="referencePages" onChange={setFile("referencePages")} />
      </Grid2>

      {/* ── Incentive ── */}
      <Grid2 sx={{ mt: 2 }}>
        <Box>
          <Typography sx={labelStyle}>Whether you want to apply for incentive? *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyIncentive} onChange={set("applyIncentive")}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
        {form.applyIncentive === "Yes" && (
          <Box>
            <Typography sx={labelStyle}>Research Incentive applied for : *</Typography>
            <Select size="small" fullWidth displayEmpty value={form.incentiveApplied} onChange={set("incentiveApplied")}>
              <MenuItem value="">Select</MenuItem>
              {INCENTIVE_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </Select>
          </Box>
        )}
      </Grid2>

      {/* ── Actions ── */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => setViewMode("list")}
          sx={{ px: 4, height: "44px", borderRadius: "12px", textTransform: "none", fontWeight: 600, color: "var(--text-primary)", borderColor: "var(--border-color)", "&:hover": { borderColor: "#ef4444", color: "#ef4444", background: "rgba(239,68,68,0.05)" }, transition: "all 0.3s ease" }}
        >
          Cancel
        </Button>
        <SubmitBtn onClick={handleSubmit} loading={loading} />
      </Box>
    </FormCard>
  );

  return (
    <Box>
      <PageHeader title="Journal" subtitle="Manage and submit your journal publications" breadcrumbs={["Home", "Publications", "Journal"]} />
      {viewMode === "list" && renderList()}
      {viewMode === "select-year" && renderSelectYear()}
      {viewMode === "form" && renderForm()}
    </Box>
  );
}
