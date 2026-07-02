import Loader from "../../components/common/Loader";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";

import {
  Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Stack, Grid, Card, Chip, Divider, FormControl,
  TablePagination, Tooltip
} from "@mui/material";
import { toast } from "sonner";
import { Search, Close, Download, Description, Groups, Article, Person, AttachFile, Visibility } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import NoActiveYearDialog from "../../components/common/NoActiveYearDialog";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import {
  labelStyle, disabledField, MONTHS, YEARS
} from "../../components/faculty/publicationConstants"; import API from "../../api/axios";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// ─── Constants ───────────────────────────────────────────────────────────────
const JOURNAL_TYPES = ["SCI", "SCIE", "ESCI", "WoS", "SCOPUS"];
const QUARTILE_OPTIONS = ["Q1", "Q2", "Q3", "Q4"];
const INCENTIVE_OPTIONS = ["National", "International"];

const getSdgName = (sdgCode) => {
  const mapping = {
    "SDG-1": "SDG-1: No Poverty",
    "SDG-2": "SDG-2: Zero Hunger",
    "SDG-3": "SDG-3: Good Health and Well-being",
    "SDG-4": "SDG-4: Quality Education",
    "SDG-5": "SDG-5: Gender Equality",
    "SDG-6": "SDG-6: Clean Water and Sanitation",
    "SDG-7": "SDG-7: Affordable and Clean Energy",
    "SDG-8": "SDG-8: Decent Work and Economic Growth",
    "SDG-9": "SDG-9: Industry, Innovation and Infrastructure",
    "SDG-10": "SDG-10: Reduced Inequality",
    "SDG-11": "SDG-11: Sustainable Cities and Communities",
    "SDG-12": "SDG-12: Responsible Consumption and Production",
    "SDG-13": "SDG-13: Climate Action",
    "SDG-14": "SDG-14: Life Below Water",
    "SDG-15": "SDG-15: Life on Land",
    "SDG-16": "SDG-16: Peace, Justice and Strong Institutions",
    "SDG-17": "SDG-17: Partnerships for the Goals"
  };
  const cleanCode = (sdgCode || "").trim();
  if (mapping[cleanCode]) return mapping[cleanCode];
  if (cleanCode.startsWith("SDG-")) return cleanCode;
  const key = `SDG-${cleanCode}`;
  return mapping[key] || cleanCode;
};

// ─── Scopus / Elsevier API keys ───────────────────────────────────────────────
const ELSEVIER_API_KEY = import.meta.env.VITE_ELSEVIER_API_KEY;

// ─── DOI Fetch Helper ─────────────────────────────────────────────────────────
async function fetchJournalDataByDOI(doi) {
  const headers = {
    "X-ELS-APIKey": ELSEVIER_API_KEY,
    Accept: "application/json",
  };

  // 1. Abstract / article metadata
  const abstractRes = await fetch(
    `https://api.elsevier.com/content/search/scopus?query=DOI(${encodeURIComponent(doi)})`,
    { method: "GET", headers }
  );
  if (!abstractRes.ok) {
    if (abstractRes.status === 429) {
      throw new Error("Elsevier/Scopus API rate limit exceeded (HTTP 429). Please try again later or fill fields manually.");
    } else if (abstractRes.status === 401) {
      throw new Error("Invalid or unauthorized Elsevier API key. Please check your configuration.");
    } else {
      throw new Error("DOI not found in Scopus. Please fill fields manually.");
    }
  }
  const abstractJson = await abstractRes.json();
  const entry = abstractJson?.["search-results"]?.entry?.[0];
  if (!entry || entry.error || (!entry["dc:title"] && !entry["prism:publicationName"])) {
    throw new Error("DOI not found in Scopus. Please fill fields manually");
  }

  if (entry.subtype === "cp" || entry["prism:aggregationType"] === "Conference Proceeding") {
    throw new Error("Only journal papers are allowed. Conference papers are not accepted.");
  }

  const title = entry["dc:title"] || "";
  const journalName = entry["prism:publicationName"] || "";
  const vol = entry["prism:volume"] || "";
  const issue = entry["prism:issueIdentifier"] || "";
  const pageRange = entry["prism:pageRange"] || "";
  const coverDisplayDate = entry["prism:coverDisplayDate"] || "";

  // Clean ISSN
  const rawIssn = entry["prism:issn"] || "";
  const rawEissn = entry["prism:eIssn"] || "";

  let extractedIssn = null;
  let extractedEissn = null;

  if (rawIssn) extractedIssn = rawIssn.split(" ")[0].replace(/-/g, "");
  if (rawEissn) extractedEissn = rawEissn.split(" ")[0].replace(/-/g, "");

  const activeIssn = extractedIssn || extractedEissn;

  // Format ISSN with hyphen for WoS check
  const formatISSNWithHyphen = (raw) => {
    if (!raw) return "";
    const digits = raw.split(" ")[0].replace(/-/g, "");
    if (digits.length === 8) return digits.slice(0, 4) + "-" + digits.slice(4);
    return raw.split(" ")[0];
  };

  // Parse month/year from coverDisplayDate e.g. "January 2024" or "2024-01-15"
  let month = "";
  let year = "";
  if (coverDisplayDate) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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

  // 2. Serial / journal metrics (H-Index, jcrImpactFactor, quartile) via ISSN
  let hIndex = "";
  let jcrImpactFactor = "";
  let quartile = "N/A";
  let journalType = "SCOPUS";

  if (activeIssn) {
    try {
      let serialDataFetched = false;
      let entry = {};

      if (extractedIssn) {
        const serialRes = await fetch(
          `https://api.elsevier.com/content/serial/title/issn/${extractedIssn}?view=CITESCORE`,
          { method: "GET", headers }
        );
        if (serialRes.ok) {
          const serialJson = await serialRes.json();
          entry = serialJson?.["serial-metadata-response"]?.entry?.[0] || {};
          serialDataFetched = true;
        }
      }

      if (!serialDataFetched && extractedEissn) {
        const serialRes = await fetch(
          `https://api.elsevier.com/content/serial/title/issn/${extractedEissn}?view=CITESCORE`,
          { method: "GET", headers }
        );
        if (serialRes.ok) {
          const serialJson = await serialRes.json();
          entry = serialJson?.["serial-metadata-response"]?.entry?.[0] || {};
          serialDataFetched = true;
        }
      }

      if (serialDataFetched) {

        // H-Index and Impact Factor are NOT fetched from API to prevent wrong/incorrect values
        hIndex = "";
        jcrImpactFactor = "";

        // Quartile from CiteScore Percentiles
        const csYearInfo = entry?.citeScoreYearInfoList?.citeScoreYearInfo;
        let highestPercentile = null;

        if (Array.isArray(csYearInfo) && csYearInfo.length > 0) {
          const sortedYears = [...csYearInfo].sort((a, b) => parseInt(b["@year"] || 0) - parseInt(a["@year"] || 0));
          const latestYearInfo = sortedYears[0];

          const infoList = latestYearInfo.citeScoreInformationList || [];
          let percentiles = [];
          infoList.forEach(info => {
            const csInfo = info.citeScoreInfo || [];
            csInfo.forEach(cs => {
              const subjectRanks = cs.citeScoreSubjectRank || [];
              subjectRanks.forEach(sr => {
                if (sr.percentile) {
                  const pVal = parseFloat(sr.percentile);
                  if (!isNaN(pVal)) percentiles.push(pVal);
                }
              });
            });
          });

          if (percentiles.length > 0) {
            highestPercentile = Math.max(...percentiles);
          }
        }

        if (highestPercentile !== null) {
          if (highestPercentile >= 75) quartile = "Q1";
          else if (highestPercentile >= 50) quartile = "Q2";
          else if (highestPercentile >= 25) quartile = "Q3";
          else quartile = "Q4";
        }
      }
    } catch (_) { /* ignore serial fetch errors */ }

    // 3. Clarivate WoS proxy check for SCI / SCIE / ESCI / WoS flags
    try {
      let clarivateSuccess = false;

      if (extractedIssn) {
        const wosIssn = formatISSNWithHyphen(extractedIssn);
        const wosRes = await API.post("/api/research/journal/wos-type", { issn: wosIssn });
        if (wosRes.data?.success && wosRes.data?.journalType) {
          journalType = wosRes.data.journalType;
          clarivateSuccess = true;
        }
      }

      if (!clarivateSuccess && extractedEissn) {
        const wosEissn = formatISSNWithHyphen(extractedEissn);
        const wosRes = await API.post("/api/research/journal/wos-type", { issn: wosEissn });
        if (wosRes.data?.success && wosRes.data?.journalType) {
          journalType = wosRes.data.journalType;
          clarivateSuccess = true;
        }
      }
    } catch (_) { /* ignore WoS proxy errors */ }
  }

  return { title, journalName, vol, issue, pageRange, month, year, hIndex, jcrImpactFactor, quartile, journalType, issn: activeIssn };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function JournalPublication() {
  const { user } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'select-year' | 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [noActiveYearAlertOpen, setNoActiveYearAlertOpen] = useState(false);
  const [publicationsList, setPublicationsList] = useState([]);
  const [selectedPubDetails, setSelectedPubDetails] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // DOI fetch state
  const [doiFetching, setDoiFetching] = useState(false);
  const [doiFetched, setDoiFetched] = useState(false);
  const [doiFetchedFields, setDoiFetchedFields] = useState({});

  const [scanningSdg, setScanningSdg] = useState(false);
  const [scannedSdgResults, setScannedSdgResults] = useState(null);

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
    jcrImpactFactor: "",
    numberOfReferencesBelongingToAGEC: 0,
    agecReferencingNumbers: "",
    month: "",
    year: "",
    applyIncentive: "",
    publicationScope: "",
    applyingSeedGrant: "",
    completeJournalName: "",
    sdgs: "",
    // Author details
    totalAuthors: 1,
    userAuthorPosition: 1,
    otherAuthors: [],
  };

  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState({ publishedPaper: null, referencePages: null, completeJournal: null });
  const [loading, setLoading] = useState(false);

  // ── Dynamic co-author list (mirrors TextbookPublication logic) ──────────────
  useEffect(() => {
    let total = parseInt(form.totalAuthors);
    if (isNaN(total) || total < 1) {
      total = 1;
      if (form.totalAuthors !== "") {
        setForm(p => ({ ...p, totalAuthors: 1 }));
      }
    }
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
      .catch(() => { });
    API.get("/api/academic-years")
      .then(res => setAcademicYears(res.data?.years || res.data?.data || []))
      .catch(() => { });
  }, [viewMode]);

  // ── Field setters ────────────────────────────────────────────────────────────
  const set = (k) => (e) => {
    const val = e.target.value;
    setForm(p => {
      const newForm = { ...p, [k]: val };
      if (k === "doi") {
        newForm.paperTitle = "";
        newForm.journalName = "";
        newForm.journalQuartile = "";
        newForm.journalType = "";
        newForm.vol = "";
        newForm.issue = "";
        newForm.pageNos = "";
        newForm.hIndex = "";
        newForm.jcrImpactFactor = "";
        newForm.month = "";
        newForm.year = "";
        newForm.sdgs = "";
        newForm.completeJournalName = "";
        setDoiFetched(false);
        setDoiFetchedFields({});
        setScannedSdgResults(null);
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
      const currentMonthIndex = new Date().getMonth(); // 0 to 11
      return MONTHS.filter((_, idx) => idx <= currentMonthIndex);
    }
    return MONTHS;
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

  const handleCompleteJournalChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setFiles(p => ({ ...p, completeJournal: null }));
      setForm(p => ({ ...p, completeJournalName: "", sdgs: "" }));
      setScannedSdgResults(null);
      return;
    }

    const allowedExtensions = ['.pdf'];
    const fileName = file.name.toLowerCase();
    const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    if (!isValidExtension) {
      toast.error("Please upload only PDF files for the Complete Journal");
      e.target.value = null;
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Complete Journal file size exceeds 5MB limit");
      e.target.value = null;
      return;
    }

    setFiles(p => ({ ...p, completeJournal: file }));
    setForm(p => ({ ...p, completeJournalName: file.name }));

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

  const handleReferencingNosChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and commas
    const filteredValue = value.replace(/[^0-9,]/g, "");
    // Split values using comma, trim spaces, ignore empty values, and count total valid entries
    const count = filteredValue.split(',').map(s => s.trim()).filter(Boolean).length;

    setForm(p => ({
      ...p,
      agecReferencingNumbers: filteredValue,
      numberOfReferencesBelongingToAGEC: count
    }));
  };

  // ── DOI Fetch ────────────────────────────────────────────────────────────────
  const fetchDOIData = async () => {
    if (!form.doi.trim()) { toast.warning("Please enter a DOI first"); return; }
    setDoiFetching(true);
    startLoading();
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
        jcrImpactFactor: String(data.jcrImpactFactor || data.impactFactor || ""),
        journalQuartile: data.quartile,
        journalType: data.journalType,
      };

      Object.entries(map).forEach(([k, v]) => {
        if (v) {
          patch[k] = v;
          // Don't lock the quartile field when API returns "N/A" — let user select manually
          if (!(k === "journalQuartile" && v === "N/A")) {
            fetched[k] = true;
          }
        }
      });

      if (Object.keys(patch).length === 0) {
        throw new Error("No metadata found for this DOI. Please fill fields manually");
      }

      setForm(p => ({ ...p, ...patch }));
      setDoiFetched(true);
      setDoiFetchedFields(fetched);
      toast.success("Journal details fetched successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to fetch DOI details");
    } finally {
      setDoiFetching(false);
      stopLoading();
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
    } catch (_) { }
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
      toast.error("Please update your profile with PAN Number and College before submitting");
      return;
    }
    if (!form.doi || !form.paperTitle || !form.journalName || !form.vol || !form.issue || !form.month || !form.year) {
      toast.error("Please fill all required fields");
      return;
    }

    if (form.year && form.month) {
      const selectedYear = parseInt(form.year);
      const currentYear = new Date().getFullYear();
      const currentMonthIndex = new Date().getMonth();
      const monthIdx = MONTHS.indexOf(form.month);
      if (selectedYear > currentYear || (selectedYear === currentYear && monthIdx > currentMonthIndex)) {
        toast.error("Publication date cannot be in the future");
        return;
      }
    }
    if (!form.applyingSeedGrant) {
      toast.error("Please select whether applying as a Seed Grant Work");
      return;
    }
    if (!form.applyIncentive) {
      toast.error("Please select whether you want to apply for an incentive");
      return;
    }
    if (!form.publicationScope) {
      toast.error("Please select National or International for Publication Scope");
      return;
    }

    // Validate co-authors
    const total = parseInt(form.totalAuthors) || 1;
    if (total < 1) {
      toast.error("Total number of authors must be at least 1");
      return;
    }
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

    if (!files.publishedPaper || !files.referencePages || !files.completeJournal) {
      toast.error("Please attach all required documents");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();

      // Map coAuthors array matching CoAuthorSchema
      const coAuthorsList = form.otherAuthors.map(a => ({
        name: a.authorName || "",
        affiliation: a.affiliationType === "Aditya University" ? "Aditya University" : (a.affiliationName || ""),
        employeeId: a.affiliationType === "Aditya University" ? a.empId : null,
        authorPosition: a.authorPosition
      })).filter(ca => ca.name && ca.affiliation);

      const fields = [
        "doi", "paperTitle", "journalName", "journalType",
        "vol", "issue", "agecReferencingNumbers", "applyIncentive", "publicationScope",
        "totalAuthors", "userAuthorPosition", "hIndex", "jcrImpactFactor",
      ];
      fields.forEach(k => {
        fd.append(k, form[k] ?? "");
      });

      fd.append("numberOfReferencesBelongingToAGEC", form.numberOfReferencesBelongingToAGEC || 0);

      fd.append("publishedMonth", form.month);
      fd.append("publishedYear", form.year);
      fd.append("journalQuartile", form.journalQuartile ?? "");
      fd.append("coAuthors", JSON.stringify(coAuthorsList));
      fd.append("applyingSeedGrant", form.applyingSeedGrant);
      fd.append("completeJournalName", form.completeJournalName);
      fd.append("sdgs", form.sdgs);
      fd.append("academicYear", selectedYear);
      fd.append("college", user?.college || "");
      fd.append("panNumber", user?.panNumber || "");

      if (files.publishedPaper) fd.append("publishedPaper", files.publishedPaper);
      if (files.referencePages) fd.append("referencePages", files.referencePages);
      if (files.completeJournal) fd.append("completeJournal", files.completeJournal);

      await API.post("/api/research/journal", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Journal submitted successfully!");

      setForm(emptyForm);
      setFiles({ publishedPaper: null, referencePages: null, completeJournal: null });
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
          onClick={() => {
            const activeYear = academicYears.find(y => y.isGlobalActive);
            if (activeYear) {
              setSelectedYear(activeYear._id);
              setViewMode("form");
            } else {
              setNoActiveYearAlertOpen(true);
            }
          }}
          sx={{ background: "var(--gradient-primary)", px: 3, fontWeight: 700, textTransform: "none", "&:hover": { opacity: 0.9, transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }, transition: "all 0.2s ease" }}
        >
          Apply New
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
            No Previous Journals
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
            You haven't submitted any journal details yet. Click the "Apply New" button to submit your first entry.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
          <Table>
            <TableHead sx={{ background: "var(--gradient-primary)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>DOI</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Paper Title</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Journal Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Quartile</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Applicant</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Co-Authors</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2, textAlign: "center" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {publicationsList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((pub, i) => (
                <TableRow key={pub._id || i} sx={{ "&:hover": { background: "var(--bg-accent-1)" }, transition: "background 0.15s" }}>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2, fontSize: 12 }}>{pub.doi || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2, maxWidth: 200 }}>{pub.paperTitle || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.journalName || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.journalQuartile || pub.categoryOfJournal || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {pub.facultyId?.name || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>
                    {pub.coAuthors && pub.coAuthors.length > 0
                      ? <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {pub.coAuthors.map(ca => ca.name).join(", ")}
                      </Typography>
                      : <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>—</Typography>}
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: pub.visibilityRole === "Applicant" ? "var(--color-primary)" : "text.secondary" }}>
                      {pub.visibilityRole || "Applicant"}
                    </Typography>
                  </TableCell>
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
                  <TableCell sx={{ py: 2, textAlign: "center" }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => setSelectedPubDetails(pub)}
                        sx={{ color: "var(--color-primary)" }}
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
        <Typography sx={{ mb: 2, color: "var(--text-secondary)", fontWeight: 500 }}>Please select the academic year for this publication submission:</Typography>
        <Select fullWidth size="small" displayEmpty value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
          <MenuItem value="" disabled>Select Academic Year</MenuItem>
          {academicYears.map(y => <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>)}
        </Select>
        <Box sx={{ display: "flex", gap: 2, mt: 4, justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={() => setViewMode("list")} sx={{ textTransform: "none", fontWeight: 600, color: "var(--text-primary)", borderColor: "var(--border-color)", "&:hover": { borderColor: "var(--color-primary)", background: "rgba(0,0,0,0.02)" } }}>Cancel</Button>
          <Button variant="contained" disabled={!selectedYear} onClick={() => setViewMode("form")} sx={{ background: "var(--gradient-primary)", px: 4, fontWeight: 700, textTransform: "none", "&:hover": { opacity: 0.9, transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }, "&.Mui-disabled": { background: "var(--bg-panel)", color: "var(--text-secondary)", opacity: 0.5 }, transition: "all 0.2s ease" }}>Proceed</Button>
        </Box>
      </FormCard>
    </Box>
  );

  const isFetched = (field) => doiFetched && doiFetchedFields[field];

  const renderForm = () => (
    <FormCard title="Journal Publication Submission">
      {/* Academic Year Badge */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 0.8, borderRadius: "8px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
      </Box>

      <FacultyInfoRow />

      {/* ── DOI Section ── */}
      <Box sx={{ mb: 2.5, p: 2.5, borderRadius: "12px", border: "2px solid var(--color-primary)", background: "var(--bg-accent-1)", boxShadow: "0 2px 12px rgba(var(--color-primary-rgb,99,102,241),0.08)" }}>
        <Typography sx={{ ...labelStyle, color: "var(--color-primary)", mb: 1 }}>
          DOI (Digital Object Identifier) : *
          <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10, opacity: 0.7 }}> — Enter DOI to auto-fill details (only journal papers accepted)</span>
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          <TextField
            size="small"
            fullWidth
            value={form.doi}
            onChange={set("doi")}
            placeholder="e.g. 10.1038/s41598-024-12345-y"
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
            ✓ Details auto-filled from Scopus. Review and complete any remaining fields below.
          </Typography>
        )}
      </Box>

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
          <Select size="small" fullWidth displayEmpty value={form.journalType || ""} onChange={set("journalType")} disabled={isFetched("journalType")} sx={isFetched("journalType") ? disabledField : {}}>
            <MenuItem value="">Select</MenuItem>
            {(form.journalType && !JOURNAL_TYPES.includes(form.journalType)
              ? [...JOURNAL_TYPES, form.journalType]
              : JOURNAL_TYPES
            ).map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
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

        {/* Referencing Nos */}
        <Box>
          <Typography sx={labelStyle}>AGEC Referencing Numbers :</Typography>
          <TextField size="small" fullWidth placeholder="e.g. 1,4,7,10" value={form.agecReferencingNumbers} onChange={handleReferencingNosChange} />
        </Box>

        {/* Number of References Belonging to AGEC */}
        <Box>
          <Typography sx={labelStyle}>Number of References Belonging to AGEC :</Typography>
          <TextField size="small" fullWidth disabled value={form.numberOfReferencesBelongingToAGEC} />
        </Box>
      </Grid2>

      {/* ── Publication Date ── */}
      <SubLabel text="Date of the Publication:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Year : *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.year} onChange={(e) => {
            setForm(p => ({ ...p, year: e.target.value, month: "" }));
          }} disabled={isFetched("year")} sx={isFetched("year") ? disabledField : {}}>
            <MenuItem value="">Select Year</MenuItem>
            {(form.year && !YEARS.includes(String(form.year))
              ? [...YEARS, String(form.year)].sort((a, b) => Number(b) - Number(a))
              : YEARS
            ).map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Month : *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.month} onChange={set("month")} disabled={(!form.year) || (isFetched("month") && !!form.month)} sx={(isFetched("month") && !!form.month) ? disabledField : {}}>
            <MenuItem value="">Select Month</MenuItem>
            {getAvailableMonths().map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
        </Box>
      </Grid2>

      {/* ── Author Details (like TextbookPublication) ── */}
      <Box sx={{ mt: 3, p: 2, borderRadius: "12px", border: "1px solid var(--border-color)", background: "var(--bg-panel)" }}>
        <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 2 }}>Author Details</Typography>
        <Grid2>
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
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d*$/.test(val)) handleCoAuthorChange(ca.authorPosition, "empId", val);
                          }}
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
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!/\d/.test(val)) handleCoAuthorChange(ca.authorPosition, "authorName", val);
                          }}
                          placeholder="Full Name"
                        />
                      </Box>
                      <Box sx={{ flex: 2, minWidth: "200px" }}>
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

      {/* ── Documents ── */}
      <NoteBox />
      <Grid2 sx={{ mt: 2 }}>
        <FileField label="Published Paper – 1st Page *" name="publishedPaper" onChange={setFile("publishedPaper")} />
        <FileField label="Reference Pages (with tick mark) *" name="referencePages" onChange={setFile("referencePages")} />
        <Box>
          <FileField label="Complete Journal *" name="completeJournal" onChange={handleCompleteJournalChange} accept=".pdf" maxSize={5 * 1024 * 1024} />
          {scanningSdg && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1, p: 1.5, borderRadius: '8px', bgcolor: 'rgba(25, 118, 210, 0.05)', border: '1px solid rgba(25, 118, 210, 0.2)' }}>
              <CircularProgress size={16} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'var(--color-primary)' }}>Scanning complete journal for SDG keywords...</Typography>
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
      </Grid2>

      {/* ── Incentive ── */}
      <Grid2 sx={{ mt: 2 }}>
        <Box>
          <Typography sx={labelStyle}>Applying as a Seed Grant Work? *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyingSeedGrant} onChange={set("applyingSeedGrant")}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Whether you want to apply for incentive? *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyIncentive} onChange={set("applyIncentive")}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Publication Scope : *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.publicationScope} onChange={set("publicationScope")}>
            <MenuItem value="">Select</MenuItem>
            {INCENTIVE_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </Select>
        </Box>
      </Grid2>

      {/* ── Actions ── */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => setViewMode("list")}
          sx={{ px: 4, height: "44px", textTransform: "none", fontWeight: 600, color: "var(--text-primary)", borderColor: "var(--border-color)", "&:hover": { borderColor: "#ef4444", color: "#ef4444", background: "rgba(239,68,68,0.05)" }, transition: "all 0.3s ease" }}
        >
          Cancel
        </Button>
        <SubmitBtn onClick={handleSubmit} loading={loading} />
      </Box>
    </FormCard>
  );

  const handleCloseDetails = () => setSelectedPubDetails(null);

  const LabelValue = ({ label, value, chip, horizontal = false }) => (
    <Box sx={{
      p: 2,
      borderRadius: "12px",
      background: horizontal ? "transparent" : "var(--bg-accent-1)",
      border: horizontal ? "none" : "1px solid var(--border-color)",
      borderBottom: horizontal ? "1px solid var(--border-color)" : "1px solid var(--border-color)",
      display: "flex",
      flexDirection: horizontal ? "row" : "column",
      alignItems: horizontal ? "center" : "flex-start",
      justifyContent: horizontal ? "flex-start" : "center",
      gap: horizontal ? 2 : 1,
      height: "100%",
      boxShadow: horizontal ? "none" : "var(--shadow-premium)",
      transition: "all 0.2s ease-in-out",
      "&:hover": horizontal ? {} : {
        borderColor: "var(--color-primary)",
        transform: "translateY(-1px)"
      },
      "&:last-child": horizontal ? { borderBottom: "none" } : {},
    }}>
      <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800, fontSize: "0.65rem" }}>{label}</Typography>
      <Box sx={{ flex: horizontal ? 1 : "none", display: "flex", alignItems: "center" }}>
        {chip ? chip : <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.85rem", wordBreak: "break-all" }}>{value || "-"}</Typography>}
      </Box>
    </Box>
  );

  const renderDetailFile = (title, filepath) => {
    if (!filepath) return null;
    const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
    const fileUrl = filepath.startsWith('http') ? filepath : `${backendURL}${filepath}`;
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filepath);

    return (
      <Box sx={{ flex: "1 1 200px" }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.7rem", textTransform: "uppercase", display: "block", mb: 1 }}>{title}</Typography>
        <Box sx={{
          height: 120, display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid var(--border-color)", background: "var(--bg-panel)", borderRadius: "8px",
          overflow: "hidden", cursor: "pointer", transition: "all 0.2s ease",
          "&:hover": { borderColor: "var(--color-primary)", transform: "translateY(-2px)" }
        }} onClick={() => window.open(fileUrl, '_blank')}>
          {isImage ? <img src={fileUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Box sx={{ textAlign: "center" }}><Description sx={{ fontSize: 24, color: "var(--text-secondary)", mb: 0.5 }} /><Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, display: "block" }}>PDF</Typography></Box>}
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

    return (
      <Dialog
        open={!!selectedPubDetails}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              background: "var(--bg-paper)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-premium)",
            }
          }
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--gradient-primary)", color: "#fff", py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Article sx={{ color: "#fff" }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Journal Details</Typography>
          </Box>
          <IconButton onClick={handleCloseDetails} sx={{ color: "#fff" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 1 }}>{data.paperTitle}</Typography>
          <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 3, fontWeight: 600 }}>Journal: {data.journalName}</Typography>

          <Grid container spacing={2.5}>
            <Grid xs={12} sm={3} sx={{ display: "flex", flexDirection: "column" }}><LabelValue label="Academic Year" value={data.academicYear?.year || "-"} /></Grid>
            <Grid xs={12} sm={6} sx={{ display: "flex", flexDirection: "column" }}><LabelValue label="DOI" value={data.doi || "-"} /></Grid>
            <Grid xs={12} sm={3} sx={{ display: "flex", flexDirection: "column" }}>
              <LabelValue
                label="Status"
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

            {/* Author position, Quartile, type */}
            <Grid xs={12} sm={4} sx={{ display: "flex", flexDirection: "column" }}>
              <LabelValue
                label="Applicant Author Position"
                value={data.userAuthorPosition ? `${data.userAuthorPosition} / ${data.totalAuthors}` : (data.firstAuthor === "Yes" ? "1" : data.authorPosition || "-")}
              />
            </Grid>
            <Grid xs={12} sm={4} sx={{ display: "flex", flexDirection: "column" }}><LabelValue label="Journal Quartile" value={data.journalQuartile || data.categoryOfJournal} /></Grid>
            <Grid xs={12} sm={4} sx={{ display: "flex", flexDirection: "column" }}><LabelValue label="Journal Type" value={data.journalType || "-"} /></Grid>

            {/* Volume, Issue, Published Year, Published Month */}
            <Grid xs={12} sm={3} sx={{ display: "flex", flexDirection: "column" }}><LabelValue label="Volume" value={data.vol || "-"} /></Grid>
            <Grid xs={12} sm={3} sx={{ display: "flex", flexDirection: "column" }}><LabelValue label="Issue" value={data.issue || "-"} /></Grid>
            <Grid xs={12} sm={3} sx={{ display: "flex", flexDirection: "column" }}><LabelValue label="Published Year" value={data.publishedYear || data.year || "-"} /></Grid>
            <Grid xs={12} sm={3} sx={{ display: "flex", flexDirection: "column" }}><LabelValue label="Published Month" value={data.publishedMonth || data.month || "-"} /></Grid>

            {/* H-Index, Impact Factor, Citations, SDGS */}
            <Grid xs={12} sm={4} sx={{ display: "flex", flexDirection: "column" }}><LabelValue label="H-Index" value={data.hIndex || "-"} /></Grid>
            <Grid xs={12} sm={4} sx={{ display: "flex", flexDirection: "column" }}><LabelValue label="Impact Factor" value={data.jcrImpactFactor || data.impactFactor || "-"} /></Grid>
            <Grid xs={12} sm={4} sx={{ display: "flex", flexDirection: "column" }}><LabelValue label="Citations" value={data.citations || "-"} /></Grid>

            <Grid xs={12} sm={6} sx={{ display: "flex", flexDirection: "column" }}><LabelValue label="AGEC Referencing Numbers" value={data.agecReferencingNumbers || data.referencingNos || "-"} /></Grid>
            <Grid xs={12} sm={6} sx={{ display: "flex", flexDirection: "column" }}><LabelValue label="Number of References Belonging to AGEC" value={data.numberOfReferencesBelongingToAGEC !== undefined ? data.numberOfReferencesBelongingToAGEC : (data.papersCited !== undefined ? data.papersCited : "-")} /></Grid>

            {/* Seed Grant Work & SDGS */}
            <Grid xs={12} sm={6} sx={{ display: "flex", flexDirection: "column" }}><LabelValue label="Seed Grant Work" value={data.applyingSeedGrant || "No"} /></Grid>
            <Grid xs={12} sm={6} sx={{ display: "flex", flexDirection: "column" }}><LabelValue label="SDGS Matched" value={data.sdgs ? data.sdgs.split(', ').map(getSdgName).join(', ') : "None"} /></Grid>

            {/* Publication Scope information */}
            <Grid xs={12} sm={6} sx={{ display: "flex", flexDirection: "column" }}>
              <LabelValue
                label="Publication Scope"
                value={data.publicationScope || data.incentiveApplied || "-"}
              />
            </Grid>
            {data.status === "Approved" && data.approvedAmount && (
              <Grid xs={12} sm={6} sx={{ display: "flex", flexDirection: "column" }}>
                <LabelValue
                  label="Approved Incentive"
                  value={`₹${data.approvedAmount}`}
                  chip={<Chip label={`₹${data.approvedAmount}`} size="small" sx={{ bgcolor: "rgba(76, 175, 80, 0.1)", color: "#4caf50", fontWeight: 800 }} />}
                />
              </Grid>
            )}

            {/* Appraisal Claimant Selector */}
            <Grid xs={12} sm={6} sx={{ display: "flex", flexDirection: "column" }}>
              <LabelValue
                label="Appraisal Claimant"
                chip={
                  (() => {
                    const isApplicant = data.visibilityRole === "Applicant";
                    const eligibleClaimants = [
                      { _id: data.facultyId?._id, name: data.facultyId?.name, institutionId: data.facultyId?.institutionId },
                      ...((data.coAuthors || [])
                        .filter(ca => ca.employeeId)
                        .map(ca => ({
                          _id: ca.employeeId?._id || ca.employeeId,
                          name: ca.employeeId?.name || ca.name,
                          institutionId: ca.employeeId?.institutionId || ca.employeeId || ""
                        })))
                    ];
                    const uniqueClaimants = eligibleClaimants.filter((v, i, a) => v._id && a.findIndex(t => t._id.toString() === v._id.toString()) === i);

                    if (uniqueClaimants.length <= 1) {
                      return (
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>
                          {data.facultyId?.name || "-"} (Auto-assigned)
                        </Typography>
                      );
                    }

                    const currentClaimantObj = uniqueClaimants.find(c =>
                      (c.institutionId && c.institutionId === (data.appraisalClaimant?.institutionId || data.appraisalClaimant || "").toString()) ||
                      (c._id && c._id.toString() === (data.appraisalClaimant?._id || data.appraisalClaimant || "").toString())
                    );
                    return (
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>
                        {currentClaimantObj ? `${currentClaimantObj.name} (${currentClaimantObj.institutionId})` : "Not Yet Designated"}
                      </Typography>
                    );
                  })()
                }
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Co-Authors table */}
          {data.coAuthors && data.coAuthors.length > 0 && (
            <Card sx={{ p: 0, overflow: "hidden", mb: 3, border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.01)" }}>
              <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, borderBottom: "1px solid var(--border-color)" }}>
                <Groups sx={{ color: "var(--color-primary)" }} />
                <Typography sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Co-Authors & Affiliations</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "var(--bg-panel)" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: "var(--text-secondary)", width: 80 }}>AUTHOR NO</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>NAME</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>AFFILIATION</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      // Derive correct author positions for co-authors:
                      // Skip the applicant's position from the full 1..totalAuthors range.
                      const total = parseInt(data.totalAuthors) || 0;
                      const applicantPos = parseInt(data.userAuthorPosition) || 0;
                      const derivedPositions = total > 0
                        ? Array.from({ length: total }, (_, i) => i + 1).filter(p => p !== applicantPos)
                        : [];
                      return data.coAuthors.map((ca, idx) => {
                        const pos = ca.authorPosition || derivedPositions[idx] || (idx + 1);
                        return (
                          <TableRow key={idx} sx={{ '&:hover': { bgcolor: 'rgba(190,147,55,0.04)' } }}>
                            <TableCell>
                              <Box sx={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 30, height: 30, borderRadius: '50%',
                                bgcolor: 'rgba(190, 147, 55, 0.12)', border: '1.5px solid var(--color-primary)',
                                color: 'var(--color-primary)', fontWeight: 900, fontSize: '0.82rem'
                              }}>
                                {pos}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{ca.name}</TableCell>
                            <TableCell sx={{ color: "var(--text-secondary)" }}>{ca.affiliation || "-"}</TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}

          {/* Attached Files previews */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 2 }}>
              <AttachFile sx={{ color: "var(--color-primary)" }} />
              <Typography sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Attached Documents</Typography>
            </Box>
            <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap" }} useFlexGap>
              {renderDetailFile("Published Paper (1st Page)", data.publishedPaper)}
              {renderDetailFile("Reference Pages", data.referencePages)}
              {data.completeJournal ? (
                renderDetailFile("Complete Journal", data.completeJournal)
              ) : (
                data.completeJournalName && (
                  <Box sx={{ flex: "1 1 200px" }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.7rem", textTransform: "uppercase", display: "block", mb: 1 }}>Complete Journal</Typography>
                    <Box sx={{
                      height: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 2,
                      border: "1px solid var(--border-color)", background: "var(--bg-panel)", borderRadius: "8px",
                    }}>
                      <Description sx={{ fontSize: 24, color: "var(--text-secondary)", mb: 0.5 }} />
                      <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, display: "block", textAlign: "center", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {data.completeJournalName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "var(--color-primary)", fontWeight: 800, display: "block", mt: 0.5, fontSize: "0.6rem" }}>
                        (Client-side Scanned)
                      </Typography>
                    </Box>
                  </Box>
                )
              )}
            </Stack>
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
    <Box>
      <PageHeader title="Journal Publications" subtitle="Manage and submit your journal publications" />
      {viewMode === "list" && renderList()}
      {viewMode === "select-year" && renderSelectYear()}
      {viewMode === "form" && renderForm()}
      {renderDetailsDialog()}
      <NoActiveYearDialog
        open={noActiveYearAlertOpen}
        onClose={() => setNoActiveYearAlertOpen(false)}
      />
    </Box>
  );
}
