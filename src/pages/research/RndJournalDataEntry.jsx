import Loader from "../../components/common/Loader";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";

import {
  Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Stack, Grid, Card, Chip, Divider, FormControl,
  TablePagination, Tooltip, Radio, RadioGroup, FormControlLabel
} from "@mui/material";
import { toast } from "sonner";
import { Search, Close, Download, Description, Groups, Article, Person, AttachFile, Visibility, Edit, CurrencyRupee, CardGiftcard } from "@mui/icons-material";
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

import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SchoolIcon from '@mui/icons-material/School';
import LinkIcon from '@mui/icons-material/Link';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import GrassIcon from '@mui/icons-material/Grass';
import PublicIcon from '@mui/icons-material/Public';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';

const SDG_COLOR_MAP = {
  1: { code: "SDG-1", label: "SDG-1: No Poverty", color: "#E5243B" },
  2: { code: "SDG-2", label: "SDG-2: Zero Hunger", color: "#DDA83A" },
  3: { code: "SDG-3", label: "SDG-3: Good Health & Well-Being", color: "#4C9F38" },
  4: { code: "SDG-4", label: "SDG-4: Quality Education", color: "#C5192D" },
  5: { code: "SDG-5", label: "SDG-5: Gender Equality", color: "#FF3A21" },
  6: { code: "SDG-6", label: "SDG-6: Clean Water And Sanitation", color: "#26BDE2" },
  7: { code: "SDG-7", label: "SDG-7: Affordable And Clean Energy", color: "#FCC30B" },
  8: { code: "SDG-8", label: "SDG-8: Decent Work And Economic Growth", color: "#A21942" },
  9: { code: "SDG-9", label: "SDG-9: Industry, Innovation And Infrastructure", color: "#FD6925" },
  10: { code: "SDG-10", label: "SDG-10: Reduced Inequalities", color: "#DD1367" },
  11: { code: "SDG-11", label: "SDG-11: Sustainable Cities And Communities", color: "#FD9D24" },
  12: { code: "SDG-12", label: "SDG-12: Responsible Consumption And Production", color: "#BF8B2E" },
  13: { code: "SDG-13", label: "SDG-13: Climate Action", color: "#3F7E44" },
  14: { code: "SDG-14", label: "SDG-14: Life Below Water", color: "#0A97D9" },
  15: { code: "SDG-15", label: "SDG-15: Life On Land", color: "#56C02B" },
  16: { code: "SDG-16", label: "SDG-16: Peace, Justice And Strong Institutions", color: "#00689D" },
  17: { code: "SDG-17", label: "SDG-17: Partnerships For The Goals", color: "#19486A" }
};

const getMatchedSdgBadgeList = (sdgInput) => {
  if (!sdgInput) return [SDG_COLOR_MAP[1], SDG_COLOR_MAP[11], SDG_COLOR_MAP[12], SDG_COLOR_MAP[13], SDG_COLOR_MAP[15], SDG_COLOR_MAP[2], SDG_COLOR_MAP[4], SDG_COLOR_MAP[6], SDG_COLOR_MAP[8], SDG_COLOR_MAP[9]];

  const numbers = String(sdgInput).match(/\d+/g);
  if (!numbers || numbers.length === 0) {
    return [SDG_COLOR_MAP[1], SDG_COLOR_MAP[11], SDG_COLOR_MAP[12], SDG_COLOR_MAP[13], SDG_COLOR_MAP[15], SDG_COLOR_MAP[2], SDG_COLOR_MAP[4], SDG_COLOR_MAP[6], SDG_COLOR_MAP[8], SDG_COLOR_MAP[9]];
  }

  const list = [];
  numbers.forEach(n => {
    const num = parseInt(n, 10);
    if (SDG_COLOR_MAP[num] && !list.some(item => item.code === SDG_COLOR_MAP[num].code)) {
      list.push(SDG_COLOR_MAP[num]);
    }
  });

  return list.length > 0 ? list : [SDG_COLOR_MAP[1], SDG_COLOR_MAP[11], SDG_COLOR_MAP[12], SDG_COLOR_MAP[13], SDG_COLOR_MAP[15], SDG_COLOR_MAP[2], SDG_COLOR_MAP[4], SDG_COLOR_MAP[6], SDG_COLOR_MAP[8], SDG_COLOR_MAP[9]];
};

// ─── Constants ───────────────────────────────────────────────────────────────
const JOURNAL_TYPES = ["SCI", "SCIE", "ESCI", "WoS", "None"];
const QUARTILE_OPTIONS = ["Q1", "Q2", "Q3", "Q4", "None"];
const INCENTIVE_OPTIONS = ["National", "International"];

// ─── Component ────────────────────────────────────────────────────────────────
export default function RndJournalDataEntry() {
  const { user } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const academicYearSelectRef = useRef(null);
  const [noActiveYearAlertOpen, setNoActiveYearAlertOpen] = useState(false);
  const [appraisalConfigActive, setAppraisalConfigActive] = useState(false);

  // Direct Entry States
  const [targetFacultyEmpId, setTargetFacultyEmpId] = useState("");
  const [targetFacultyName, setTargetFacultyName] = useState("");
  const [isTargetFacultyValid, setIsTargetFacultyValid] = useState(false);
  const [verifyingFaculty, setVerifyingFaculty] = useState(false);
  const [targetFacultyDetails, setTargetFacultyDetails] = useState(null);


  const [leftCardHeight, setLeftCardHeight] = useState(null);
  const observerRef = useRef(null);

  const leftCardRef = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (node) {
      const updateHeight = () => {
        const h = node.getBoundingClientRect().height;
        if (h > 0) {
          setLeftCardHeight(h);
        }
      };
      observerRef.current = new ResizeObserver(() => {
        updateHeight();
      });
      observerRef.current.observe(node);
      updateHeight();
    }
  }, []);

  // DOI fetch state
  const [doiFetching, setDoiFetching] = useState(false);
  const [doiFetched, setDoiFetched] = useState(false);
  const [doiFetchedFields, setDoiFetchedFields] = useState({});

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
    isStudentsInvolved: "No",
    issn: "",
    eissn: "",
    isScopus: "No",
    // Author details
    totalAuthors: 1,
    userAuthorPosition: 1,
    otherAuthors: [],
  };

  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState({ publishedPaper: null, referencePages: null, completeJournal: null });
  const [existingFiles, setExistingFiles] = useState({ publishedPaper: null, referencePages: null, completeJournal: null });
  const [editJournalId, setEditJournalId] = useState(null);
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
          CoAuthorType: "faculty",
          studentId: "",
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
        newForm.issn = "";
        newForm.eissn = "";
        newForm.isScopus = "No";
        setDoiFetched(false);
        setDoiFetchedFields({});
        setScannedSdgResults(null);
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

  const fetchDOIData = async () => {
    if (!form.doi.trim()) { toast.warning("Please enter a DOI first"); return; }
    setDoiFetching(true);
    startLoading();
    try {
      const res = await API.post("/api/research/journal/fetch-doi", { doi: form.doi.trim() });
      const data = res.data?.data;

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
        journalQuartile: data.journalQuartile,
        journalType: data.journalType,
        issn: data.issn || "",
        eissn: data.eissn || "",
        isScopus: data.isScopus || "No"
      };

      Object.entries(map).forEach(([k, v]) => {
        if (v) {
          patch[k] = v;
          if (k !== "issn" && k !== "eissn" && k !== "isScopus") {
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
      toast.error(err.response?.data?.message || err.message || "Failed to fetch DOI details");
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

      if (field === "CoAuthorType") {
        if (value === "student") {
          newA.empId = "";
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

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user?.panNumber || user?.panNumber === "Not Set" || !user?.college || user?.college === "Not Set") {
      toast.error("Please update your profile with PAN Number and College before submitting");
      return;
    }
    if (!targetFacultyEmpId || !isTargetFacultyValid) {
      toast.error("Please enter and verify a valid Target Faculty Employee ID");
      return;
    }
    if (!form.doi || !form.paperTitle || !form.journalName || !form.month || !form.year) {
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
          (a.affiliationType === "Aditya University" && a.CoAuthorType === "faculty" && (!a.empId || !a.authorName)) ||
          (a.affiliationType === "Aditya University" && a.CoAuthorType === "student" && (!a.studentId || !a.authorName))
        ) {
          toast.error(`Please complete details for Author Position ${a.authorPosition}.`);
          return;
        }
      }
    }

    if (!editJournalId) {
      if (!files.publishedPaper || !files.referencePages || !files.completeJournal) {
        toast.error("Please attach all required documents");
        return;
      }
    } else {
      if (!files.publishedPaper && !existingFiles.publishedPaper) { toast.error("Please attach Published Paper"); return; }
      if (!files.referencePages && !existingFiles.referencePages) { toast.error("Please attach Reference Pages"); return; }
      if (!files.completeJournal && !existingFiles.completeJournal) { toast.error("Please attach Complete Journal"); return; }
    }

    setLoading(true);
    try {
      const fd = new FormData();

      // Map coAuthors array matching CoAuthorSchema
      const coAuthorsList = form.otherAuthors.map(a => ({
        name: a.authorName || "",
        affiliation: a.affiliationType === "Aditya University" ? "Aditya University" : (a.affiliationName || ""),
        employeeId: (a.affiliationType === "Aditya University" && a.CoAuthorType !== "student") ? a.empId : null,
        studentId: (a.affiliationType === "Aditya University" && a.CoAuthorType === "student") ? a.studentId : null,
        CoAuthorType: form.isStudentsInvolved === "Yes" ? (a.CoAuthorType || "faculty") : "faculty",
        authorPosition: a.authorPosition
      })).filter(ca => ca.name && ca.affiliation);

      const fields = [
        "doi", "paperTitle", "journalName", "journalType",
        "vol", "issue", "agecReferencingNumbers", "applyIncentive", "publicationScope",
        "totalAuthors", "userAuthorPosition", "hIndex", "jcrImpactFactor", "isStudentsInvolved",
        "issn", "eissn", "isScopus"
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
      
      fd.append("isDirectEntry", "true");
      fd.append("targetFacultyEmpId", targetFacultyEmpId);

      if (files.publishedPaper) fd.append("publishedPaper", files.publishedPaper);
      if (files.referencePages) fd.append("referencePages", files.referencePages);
      if (files.completeJournal) fd.append("completeJournal", files.completeJournal);

      if (editJournalId) {
        await API.put(`/api/research/journal/${editJournalId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Journal resubmitted successfully!");
      } else {
        await API.post("/api/research/journal", fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Journal submitted successfully!");
      }

      setForm(emptyForm);
      setFiles({ publishedPaper: null, referencePages: null, completeJournal: null });
      setExistingFiles({ publishedPaper: null, referencePages: null, completeJournal: null });
      setEditJournalId(null);
      setDoiFetched(false);
      setDoiFetchedFields({});
      setTargetFacultyEmpId("");
      setTargetFacultyName("");
      setIsTargetFacultyValid(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  const verifyFaculty = async () => {
    if (!targetFacultyEmpId.trim()) {
      toast.error("Please enter Employee ID");
      return;
    }
    setVerifyingFaculty(true);
    try {
      const res = await API.get(`/api/employees/search?query=${targetFacultyEmpId.trim()}`);
      if (res.data?.success && res.data.data.length > 0) {
        const emp = res.data.data.find(e => e.institutionId.toLowerCase() === targetFacultyEmpId.trim().toLowerCase());
        if (emp) {
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
            toast.error("Faculty not found. Ensure exact ID is entered.");
        }
      } else {
        setTargetFacultyName("Not Found");
        setIsTargetFacultyValid(false);
        setTargetFacultyDetails(null);
        toast.error("Faculty not found");
      }
    } catch (err) {
      toast.error("Failed to verify faculty");
      setIsTargetFacultyValid(false);
      setTargetFacultyName("");
      setTargetFacultyDetails(null);
    } finally {
      setVerifyingFaculty(false);
    }
  };

  const isFetched = (field) => doiFetched && doiFetchedFields[field];

  const renderForm = () => (
    <Box sx={{
      background: "var(--bg-paper)",
      borderRadius: "16px",
      border: "1px solid var(--border-color)",
      boxShadow: "var(--shadow-premium)",
      p: 4
    }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, pb: 2, borderBottom: "1px solid var(--border-color)" }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
           Special R&D Journal Data Entry
        </Typography>
      </Box>

      {/* Target Faculty Section */}
      <FormCard title="Target Faculty Identification">
        <Grid2>
          <Box>
            <SubLabel required>Target Faculty Employee ID</SubLabel>
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
            sx={{ minWidth: 150, background: "var(--bg-panel)", ...(!editJournalId ? disabledField : {}) }}
            disabled={!editJournalId}
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
            DOI (Digital Object Identifier) : *
            <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10, opacity: 0.7 }}> — Enter DOI to auto-fill details (only journal papers accepted)</span>
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "flex-start" } }}>
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
            <Typography sx={{ mt: 1, fontSize: 11, color: form.isScopus === "Yes" ? "#10b981" : "#f59e0b", fontWeight: 700 }}>
              {form.isScopus === "Yes"
                ? "✓ Details auto-filled from Scopus. Review and complete any remaining fields below."
                : "✓ Details auto-filled from Crossref (Not found in Scopus). Review and complete any remaining fields below."}
            </Typography>
          )}
        </Box>
      </FormCard>

      {/* ── Article Details ── */}
      <SubLabel text="Details of the Journal Article:" />
      <Grid2 sx={{ mt: 1 }}>
        {/* Title */}
        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
          <Typography sx={labelStyle}>Title of the Article : *</Typography>
          <TextField size="small" fullWidth multiline rows={2} value={form.paperTitle} onChange={set("paperTitle")} disabled={true} sx={disabledField} placeholder="Auto-filled from DOI" />
        </Box>

        {/* Journal Name */}
        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
          <Typography sx={labelStyle}>Name of the Journal : *</Typography>
          <TextField size="small" fullWidth value={form.journalName} onChange={set("journalName")} disabled={true} sx={disabledField} placeholder="Auto-filled from DOI" />
        </Box>

        {/* Quartile */}
        <Box>
          <Typography sx={labelStyle}>Journal Quartile : *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.journalQuartile} onChange={set("journalQuartile")} disabled={true} sx={disabledField}>
            <MenuItem value="">Auto-filled from DOI</MenuItem>
            {QUARTILE_OPTIONS.map(q => <MenuItem key={q} value={q}>{q}</MenuItem>)}
          </Select>
        </Box>

        {/* Journal Type */}
        <Box>
          <Typography sx={labelStyle}>Type of Journal :</Typography>
          <Select size="small" fullWidth displayEmpty value={form.journalType || ""} onChange={set("journalType")} disabled={true} sx={disabledField}>
            <MenuItem value="">Auto-filled from DOI</MenuItem>
            {(form.journalType && !JOURNAL_TYPES.includes(form.journalType)
              ? [...JOURNAL_TYPES, form.journalType]
              : JOURNAL_TYPES
            ).map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </Box>

        {/* Indexed in Scopus */}
        <Box>
          <Typography sx={labelStyle}>Indexed in Scopus :</Typography>
          <TextField size="small" fullWidth value={form.isScopus || ""} disabled={true} sx={disabledField} placeholder="Auto-filled from DOI" />
        </Box>

        {/* Vol */}
        <Box>
          <Typography sx={labelStyle}>Vol :</Typography>
          <TextField size="small" fullWidth value={form.vol} onChange={set("vol")} disabled={isFetched("vol")} sx={isFetched("vol") ? disabledField : {}} />
        </Box>

        {/* Issue */}
        <Box>
          <Typography sx={labelStyle}>Issue :</Typography>
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
                      value={ca.affiliationType}
                      onChange={(e) => handleCoAuthorChange(ca.authorPosition, "affiliationType", e.target.value)}
                    >
                      <MenuItem value="" disabled>Select Affiliation</MenuItem>
                      <MenuItem value="Aditya University">Aditya University</MenuItem>
                      <MenuItem value="Others">Others</MenuItem>
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

      {/* ── Documents ── */}
      <NoteBox />
      <Grid2 sx={{ mt: 2 }}>
        <Box>
          <FileField
            label="Published Paper – 1st Page *"
            name="publishedPaper"
            onChange={setFile("publishedPaper")}
            existingFileUrl={!files.publishedPaper ? existingFiles.publishedPaper : null}
            existingFileName={existingFiles.publishedPaper ? existingFiles.publishedPaper.split('/').pop() : ""}
            onRemoveExisting={() => setExistingFiles(prev => ({ ...prev, publishedPaper: null }))}
          />
        </Box>

        <Box>
          <FileField
            label="Reference Pages (with tick mark) *"
            name="referencePages"
            onChange={setFile("referencePages")}
            existingFileUrl={!files.referencePages ? existingFiles.referencePages : null}
            existingFileName={existingFiles.referencePages ? existingFiles.referencePages.split('/').pop() : ""}
            onRemoveExisting={() => setExistingFiles(prev => ({ ...prev, referencePages: null }))}
          />
        </Box>

        <Box>
          <FileField
            label="Complete Journal *"
            name="completeJournal"
            onChange={handleCompleteJournalChange}
            accept=".pdf"
            maxSize={5 * 1024 * 1024}
            existingFileUrl={!files.completeJournal ? existingFiles.completeJournal : null}
            existingFileName={existingFiles.completeJournal ? existingFiles.completeJournal.split('/').pop() : ""}
            onRemoveExisting={() => setExistingFiles(prev => ({ ...prev, completeJournal: null }))}
          />
          {scanningSdg && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1, p: 1.5, borderRadius: '8px', bgcolor: 'rgba(25, 118, 210, 0.05)', border: '1px solid rgba(25, 118, 210, 0.2)' }}>
              <Loader size={16} />
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
          <Select size="small" fullWidth displayEmpty value={form.applyIncentive} onChange={set("applyIncentive")} disabled={form.isStudentsInvolved === "Yes"} sx={form.isStudentsInvolved === "Yes" ? disabledField : {}}>
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
          onClick={() => {
            setForm(emptyForm);
            setFiles({ publishedPaper: null, referencePages: null, completeJournal: null });
            setExistingFiles({ publishedPaper: null, referencePages: null, completeJournal: null });
            setDoiFetched(false);
            setDoiFetchedFields({});
            setTargetFacultyEmpId("");
            setTargetFacultyName("");
            setIsTargetFacultyValid(false);
          }}
          sx={{ px: 4, height: "44px", textTransform: "none", fontWeight: 600, color: "var(--text-primary)", borderColor: "var(--border-color)", "&:hover": { borderColor: "#ef4444", color: "#ef4444", background: "rgba(239,68,68,0.05)" }, transition: "all 0.3s ease" }}
        >
          Cancel
        </Button>
          <SubmitBtn onClick={handleSubmit} loading={loading} />
        </Box>
      </>
    )}
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Special Data Entry (R&D)"
        subtitle="Submit approved journal publications directly"
        icon={<Article />}
        breadcrumb={[{ label: "Research", path: "/research-dean/approvals" }, { label: "Journal Data Entry" }]}
      />
      {renderForm()}
      <NoActiveYearDialog
        open={noActiveYearAlertOpen}
        onClose={() => setNoActiveYearAlertOpen(false)}
        message="No active academic year found for Research. Please ask the administrator to set an active academic year."
      />
    </Box>
  );
}
