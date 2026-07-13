import Loader from "../../components/common/Loader";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

import { Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Grid, Card, Chip, Divider, Tooltip, TablePagination } from "@mui/material";
import { toast } from "sonner";
import { Close, Description, AttachFile, Groups, Book, Visibility } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import NoActiveYearDialog from "../../components/common/NoActiveYearDialog";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import {
  labelStyle, disabledField, MONTHS, YEARS
} from "../../components/faculty/publicationConstants"; import API from "../../api/axios";

const ELSEVIER_API_KEY = "0436d4fe788649172354545ceca9e650";

export default function BookChapterPublication() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("list"); // 'list', 'select-year', 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [noActiveYearAlertOpen, setNoActiveYearAlertOpen] = useState(false);
  const [publicationsList, setPublicationsList] = useState([]);
  const [selectedPubDetails, setSelectedPubDetails] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [form, setForm] = useState({
    doi: "",
    textBookName: "", chapterTitle: "", yearOfPublication: "",
    chaptersContributed: "", publisher: "", month: "", year: "",
    applyIncentive: "", publicationScope: "", applyingSeedGrant: "",
    isbnNumber: "",
    totalAuthors: 1, userAuthorPosition: 1, otherAuthors: []
  });
  const [files, setFiles] = useState({ coverPage: null, authorAffiliation: null, index: null, softCopy: null });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [scopusIndexed, setScopusIndexed] = useState(false);
  const [doiFetching, setDoiFetching] = useState(false);
  const [doiFetched, setDoiFetched] = useState(null);
  const [isbnFetching, setIsbnFetching] = useState(false);

  useEffect(() => {
    API.get("/api/research/book-chapter").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => console.log("Failed to fetch book chapters", err));

    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => console.log("Failed to fetch academic years", err));
  }, [viewMode]);

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm(p => {
      const newForm = { ...p, [k]: val };
      if (k === "doi") {
        newForm.textBookName = "";
        newForm.chapterTitle = "";
        newForm.publisher = "";
        newForm.publicationScope = "";
        newForm.month = "";
        newForm.year = "";
        setScopusIndexed(false);
        setDoiFetching(false);
        setDoiFetched(null);
      }
      return newForm;
    });
  };
  const setFile = (k) => (e) => setFiles((p) => ({ ...p, [k]: e.target.files[0] }));

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

  // ── DOI → Scopus fetch (same approach as ConferencePublication) ──────────────
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

      // Extract all fields from Scopus entry
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
        // textBookName intentionally NOT set from DOI — use ISBN to fetch Book Title
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

  // ── ISBN → Open Library book title fetch ─────────────────────────────────────
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

  // ── Old title-based Scopus fetch (kept stub to prevent breaking)
  const fetchScopusDetails = async () => {
    if (!form.chapterTitle.trim()) {
      toast.error("Please enter the Title of the Chapter first");
      return;
    }
    setScopusFetching(true);
    try {
      const headers = {
        "X-ELS-APIKey": ELSEVIER_API_KEY,
        Accept: "application/json",
      };

      // 1. Call Scopus Search API
      const searchUrl = `https://api.elsevier.com/content/search/scopus?query=TITLE-ABS-KEY("${encodeURIComponent(form.chapterTitle)}")&count=10`;
      const searchRes = await fetch(searchUrl, { method: "GET", headers });
      if (!searchRes.ok) {
        if (searchRes.status === 429) {
          throw new Error("Elsevier/Scopus API rate limit exceeded (HTTP 429). Please try again later.");
        } else if (searchRes.status === 401) {
          throw new Error("Invalid or unauthorized Elsevier API key. Please check your configuration.");
        } else {
          throw new Error("Failed to search chapter in Scopus database.");
        }
      }

      const searchJson = await searchRes.json();
      const entries = searchJson?.["search-results"]?.entry || [];

      if (entries.length === 0 || entries[0]?.error) {
        setScopusIndexed(false);
        toast.error("This book chapter is not indexed in Scopus");
        return;
      }

      // Title matching helper to find the most accurate chapter entry in the returned search results
      const cleanTitle = (t) => {
        if (!t) return "";
        return t.toLowerCase()
          .replace(/&/g, "and")
          .replace(/[^a-z0-9]/g, "");
      };
      const userClean = cleanTitle(form.chapterTitle);
      let bestEntry = null;

      // STRICT exact normalized match ONLY
      for (const ent of entries) {
        const entClean = cleanTitle(ent["dc:title"]);
        if (entClean === userClean) {
          bestEntry = ent;
          break;
        }
      }

      // If still not matched, block to prevent matching wrong generic articles
      if (!bestEntry) {
        setScopusIndexed(false);
        toast.error("This book chapter is not indexed in Scopus. (No exact title match was found)");
        return;
      }

      // Extract SCOPUS_ID & DOI from the best matched entry
      const dcIdentifier = bestEntry["dc:identifier"] || "";
      let scopusId = "";
      if (dcIdentifier.includes("SCOPUS_ID:")) {
        scopusId = dcIdentifier.replace("SCOPUS_ID:", "");
      } else {
        const match = dcIdentifier.match(/\d+/);
        if (match) scopusId = match[0];
      }

      const scopusDoi = bestEntry["prism:doi"] || "";

      if (!scopusId) {
        setScopusIndexed(false);
        toast.error("Could not parse Scopus ID for this chapter");
        return;
      }

      // Initialize auto-filled metadata holders
      let scopusBookTitle = "";
      let scopusPublisher = "";
      let scopusMonth = "";
      let scopusYear = "";

      // 1.5. Call Scopus Abstract Retrieval API for richer, accurate metadata
      try {
        const abstractUrl = `https://api.elsevier.com/content/abstract/scopus_id/${scopusId}`;
        const absRes = await fetch(abstractUrl, { method: "GET", headers });
        if (absRes.ok) {
          const absJson = await absRes.json();
          const coredata = absJson?.["abstracts-retrieval-response"]?.coredata || {};

          scopusBookTitle = coredata["prism:publicationName"] || "";
          scopusPublisher = coredata["dc:publisher"] || "";

          const coverDate = coredata["prism:coverDate"] || ""; // "YYYY-MM-DD"
          if (coverDate) {
            const parts = coverDate.split("-");
            if (parts[0]) scopusYear = parts[0];
            if (parts[1]) {
              const monthNum = parseInt(parts[1], 10);
              const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
              scopusMonth = monthNames[monthNum - 1] || "";
            }
          }
        }
      } catch (absErr) {
        console.error("Failed to retrieve Scopus Abstract details:", absErr);
      }

      // Fallback to Search API entry fields if Abstract Retrieval fields are blank
      if (!scopusBookTitle) {
        scopusBookTitle = bestEntry["prism:publicationName"] || "";
      }
      if (!scopusYear || !scopusMonth) {
        const coverDate = bestEntry["prism:coverDate"] || "";
        if (coverDate) {
          const parts = coverDate.split("-");
          if (!scopusYear && parts[0]) scopusYear = parts[0];
          if (!scopusMonth && parts[1]) {
            const monthNum = parseInt(parts[1], 10);
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            scopusMonth = monthNames[monthNum - 1] || "";
          }
        }
      }

      // 2. Call Crossref API using DOI as secondary fallback
      let crossrefBookTitle = "";
      let crossrefPublisher = "";
      let crossrefMonth = "";
      let crossrefYear = "";

      if (scopusDoi) {
        try {
          const crossrefUrl = `https://api.crossref.org/works/${encodeURIComponent(scopusDoi)}`;
          const crossrefRes = await fetch(crossrefUrl);
          if (crossrefRes.ok) {
            const crossrefJson = await crossrefRes.json();
            const msg = crossrefJson?.message || {};

            const containerTitleArray = msg["container-title"] || [];
            crossrefBookTitle = containerTitleArray.length > 0 ? containerTitleArray[containerTitleArray.length - 1] : "";
            crossrefPublisher = msg.publisher || "";

            // Month & Year parsing logic from Crossref
            const assertions = msg.assertion || [];
            const dateAssertion = assertions.find(a => a.value && typeof a.value === "string" && /\b(19|20)\d{2}\b/.test(a.value));
            if (dateAssertion) {
              const val = dateAssertion.value;
              const yearMatch = val.match(/\b(19|20)\d{2}\b/);
              if (yearMatch) crossrefYear = yearMatch[0];
              const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
              const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              for (let i = 0; i < 12; i++) {
                if (val.toLowerCase().includes(monthNames[i].toLowerCase()) || val.toLowerCase().includes(shortMonths[i].toLowerCase())) {
                  crossrefMonth = monthNames[i];
                  break;
                }
              }
            }

            if (!crossrefMonth || !crossrefYear) {
              const dateSource = msg["published-online"] || msg["published-print"] || msg["published"] || {};
              const dateParts = dateSource["date-parts"]?.[0] || [];
              if (dateParts.length > 0) {
                if (!crossrefYear) crossrefYear = String(dateParts[0]);
                if (!crossrefMonth && dateParts.length > 1) {
                  const monthNum = parseInt(dateParts[1], 10);
                  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                  crossrefMonth = monthNames[monthNum - 1] || "";
                }
              }
            }
          }
        } catch (crErr) {
          console.error("Failed to retrieve Crossref details:", crErr);
        }
      }

      // Prioritize Crossref for book chapter parents (exact Book Title) and clean publishers, falling back to Scopus series titles
      const bookTitle = crossrefBookTitle || scopusBookTitle;
      const rawPublisher = (crossrefPublisher || scopusPublisher || "").trim();
      const extractedMonth = crossrefMonth || scopusMonth;
      const extractedYear = crossrefYear || scopusYear;

      // Match rawPublisher to local database publishers list with normalized substring matches
      let matchedPublisher = null;
      if (rawPublisher) {
        const cleanRaw = rawPublisher.toLowerCase().replace(/[^a-z0-9]/g, "");

        // Try exact match first
        matchedPublisher = publishers.find(p => p.name?.toLowerCase() === rawPublisher.toLowerCase());

        // Try substring match next
        if (!matchedPublisher) {
          matchedPublisher = publishers.find(p => {
            const cleanDbName = p.name.toLowerCase().replace(/[^a-z0-9]/g, "");
            return cleanRaw.includes(cleanDbName) || cleanDbName.includes(cleanRaw);
          });
        }

        // Try major publisher alias mappings
        if (!matchedPublisher) {
          const lowerRaw = rawPublisher.toLowerCase();
          let alias = "";
          if (lowerRaw.includes("springer")) alias = "Springer";
          else if (lowerRaw.includes("wiley")) alias = "Wiley";
          else if (lowerRaw.includes("elsevier") || lowerRaw.includes("academic press")) alias = "Elsevier";
          else if (lowerRaw.includes("crc") || lowerRaw.includes("taylor")) alias = "CRC Press";
          else if (lowerRaw.includes("oxford")) alias = "Oxford University Press";
          else if (lowerRaw.includes("cambridge")) alias = "Cambridge University Press";
          else if (lowerRaw.includes("ieee")) alias = "IEEE";
          else if (lowerRaw.includes("apress")) alias = "Apress";
          else if (lowerRaw.includes("macmillan")) alias = "Macmillan Publishers";
          else if (lowerRaw.includes("mcgraw")) alias = "McGraw Hill Education";
          else if (lowerRaw.includes("pearson")) alias = "Pearson";
          else if (lowerRaw.includes("sage")) alias = "SAGE Publishing";
          else if (lowerRaw.includes("nova")) alias = "Nova Science Publishers";

          if (alias) {
            matchedPublisher = publishers.find(p => p.name?.toLowerCase() === alias.toLowerCase());
          }
        }
      }

      // Populate Form State
      setForm(prev => {
        const newState = {
          ...prev,
          textBookName: bookTitle || prev.textBookName,
          month: extractedMonth || prev.month,
          year: extractedYear || prev.year
        };

        if (matchedPublisher) {
          newState.publisher = matchedPublisher.name;
          newState.publicationScope = matchedPublisher.type;
        } else if (rawPublisher) {
          newState.publisher = "Others";
          newState.customPublisher = rawPublisher;
          newState.publicationScope = "International";
        } else {
          newState.publisher = prev.publisher;
        }

        return newState;
      });

      setScopusIndexed(true);
      toast.success("✓ Scopus indexing validated & metadata auto-filled!");
    } catch (err) {
      console.error(err);
      setScopusIndexed(false);
      toast.error(err.message || "An error occurred during verification.");
    } finally {
      setScopusFetching(false);
    }
  };

  // Handle dynamic author generation based on total authors and user position
  useEffect(() => {
    let total = parseInt(form.totalAuthors);
    if (isNaN(total) || total < 1) {
      total = 1;
      if (form.totalAuthors !== "") {
        setForm(p => ({ ...p, totalAuthors: 1 }));
      }
    }
    const pos = parseInt(form.userAuthorPosition) || 1;

    // Auto-adjust if position is greater than total
    if (pos > total) {
      setForm(p => ({ ...p, userAuthorPosition: total }));
      return;
    }

    if (total === 1) {
      setForm(p => ({ ...p, otherAuthors: [] }));
      return;
    }

    let newOtherAuthors = [];
    for (let i = 1; i <= total; i++) {
      if (i !== pos) {
        // Keep existing data if available
        const existing = form.otherAuthors.find(a => a.authorPosition === i);
        newOtherAuthors.push(existing || {
          authorPosition: i,
          affiliationType: "",
          empId: "",
          authorName: "",
          affiliationName: ""
        });
      }
    }
    setForm(p => ({ ...p, otherAuthors: newOtherAuthors }));
  }, [form.totalAuthors, form.userAuthorPosition]);

  const fetchCoAuthorName = async (pos, empId) => {
    try {
      const res = await API.get(`/api/employees/staff/${empId}`);
      if (res.data && res.data.success) {
        const staff = res.data.data;
        const name = staff.employeename || staff.EmployeeName || "";

        setForm(prev => {
          const updated = prev.otherAuthors.map(a => {
            if (a.authorPosition === pos) {
              return { ...a, authorName: name, affiliationName: "Aditya University" };
            }
            return a;
          });
          return { ...prev, otherAuthors: updated };
        });
      }
    } catch (err) {
      console.error("Failed to fetch staff data", err);
    }
  };

  const handleCoAuthorChange = (pos, field, value) => {
    const updated = form.otherAuthors.map(a => {
      if (a.authorPosition === pos) {
        const newA = { ...a, [field]: value };
        if (field === "affiliationType") {
          if (value === "Aditya University") {
            newA.affiliationName = "Aditya University";
            newA.authorName = ""; // clear name so it can be fetched
          } else {
            newA.affiliationName = "";
            newA.empId = "";
            newA.authorName = "";
          }
        }
        return newA;
      }
      return a;
    });

    setForm(p => ({ ...p, otherAuthors: updated }));

    // Fetch name if Aditya University and Employee ID is entered (length >= 3)
    if (field === "empId" && value.length >= 3) {
      const author = updated.find(a => a.authorPosition === pos);
      if (author && author.affiliationType === "Aditya University") {
        fetchCoAuthorName(pos, value);
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.doi.trim()) {
      toast.error("DOI is mandatory. Please enter the DOI.");
      return;
    }
    const newErrors = {};
    if (!form.textBookName) newErrors.textBookName = true;
    if (!form.chapterTitle) newErrors.chapterTitle = true;
    if (!form.publisher) newErrors.publisher = true;
    if (!form.month) newErrors.month = true;
    if (!form.year) newErrors.year = true;
    if (!form.applyIncentive) newErrors.applyIncentive = true;
    if (!form.applyingSeedGrant) newErrors.applyingSeedGrant = true;
    if (!form.publicationScope) newErrors.publicationScope = true;

    if (!files.authorAffiliation) newErrors.authorAffiliation = true;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill all mandatory fields and upload required documents");
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

    const total = parseInt(form.totalAuthors) || 1;
    if (total < 1) {
      toast.error("Total number of authors must be at least 1");
      return;
    }

    // Validate co-authors dynamically
    if (total > 1) {
      for (const a of form.otherAuthors) {
        if (!a.affiliationType || (a.affiliationType === 'Others' && (!a.authorName || !a.affiliationName)) || (a.affiliationType === 'Aditya University' && (!a.empId || !a.authorName))) {
          toast.error(`Please complete details for Author Position ${a.authorPosition}`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const fd = new FormData();

      // Map coAuthors array matching CoAuthorSchema
      const coAuthorsList = form.otherAuthors.map(a => ({
        name: a.authorName || "",
        affiliation: a.affiliationType === "Aditya University" ? "Aditya University" : (a.affiliationName || ""),
        employeeId: a.affiliationType === "Aditya University" ? a.empId : null,
        authorPosition: String(a.authorPosition)
      })).filter(ca => ca.name && ca.affiliation);

      fd.append("doi", form.doi || "");
      fd.append("textBookName", form.textBookName);
      fd.append("chapterTitle", form.chapterTitle);
      fd.append("yearOfPublication", form.year);
      fd.append("userAuthorPosition", String(form.userAuthorPosition));

      fd.append("totalAuthors", String(form.totalAuthors));
      fd.append("chaptersContributed", form.chaptersContributed || "");
      fd.append("publisher", form.publisher || "");
      fd.append("isbnNumber", form.isbnNumber || "");
      fd.append("publicationScope", form.publicationScope);
      fd.append("coAuthors", JSON.stringify(coAuthorsList));
      fd.append("month", form.month);
      fd.append("year", form.year);
      fd.append("applyIncentive", form.applyIncentive);
      fd.append("applyingSeedGrant", form.applyingSeedGrant);

      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });
      fd.append("academicYear", selectedYear);
      fd.append("college", user?.college || "");
      fd.append("panNumber", user?.panNumber || "");

      await API.post("/api/research/book-chapter", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Book Chapter submitted successfully!");
      setForm({
        doi: "",
        textBookName: "", chapterTitle: "", yearOfPublication: "",
        chaptersContributed: "", publisher: "", month: "", year: "",
        applyIncentive: "", publicationScope: "", applyingSeedGrant: "",
        isbnNumber: "",
        totalAuthors: 1, userAuthorPosition: 1, otherAuthors: []
      });
      setFiles({ coverPage: null, authorAffiliation: null, index: null, softCopy: null });
      setErrors({});
      setSelectedYear("");
      setViewMode("list");
      setScopusIndexed(false);
      setDoiFetched(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const renderList = () => (
    <Box>
      <Box sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: "center",
        gap: { xs: 2, sm: 0 },
        mb: 3
      }}>
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800, textAlign: { xs: "center", sm: "left" } }}>My Book Chapter Publications</Typography>
        <Button
          variant="contained"
          onClick={() => {
            const activeYear = academicYears.find(y => y.isGlobalActive);
            if (activeYear) {
              setSelectedYear("");
              setViewMode("select-year");
            } else {
              setNoActiveYearAlertOpen(true);
            }
          }}
          sx={{
            background: "var(--gradient-primary)",
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
            No Previous Book Chapters
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
            You haven't submitted any book chapters yet. Click the "Apply New" button to submit your first entry.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
          <Table sx={{ minWidth: 1100 }}>
            <TableHead sx={{ background: "var(--gradient-primary)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Text Book Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Chapter Title</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Publisher</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>DOI</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Applicant</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Co-Authors</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {publicationsList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((pub, i) => (
                <TableRow key={pub._id || i} sx={{ "&:hover": { background: "rgba(var(--color-primary-rgb, 99,102,241), 0.04)", transition: "background 0.2s" } }}>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>{pub.textBookName || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.chapterTitle || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.publisher || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.doi || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {pub.facultyId?.name || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: pub.visibilityRole === "Applicant" ? "var(--color-primary)" : "text.secondary" }}>
                      {pub.visibilityRole || "Applicant"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>
                    {pub.coAuthors && pub.coAuthors.length > 0
                      ? <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {pub.coAuthors.map(ca => ca.name).join(", ")}
                      </Typography>
                      : <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>None</Typography>}
                  </TableCell>
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
                      {pub.status || "Pending"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Tooltip title="View Details" arrow>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedPubDetails(pub)}
                        sx={{
                          color: "var(--color-primary)",
                          "&:hover": { background: "var(--bg-accent-1)", transform: "scale(1.1)" },
                          transition: "all 0.2s ease"
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
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{ borderTop: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
          />
        </TableContainer>
      )}
    </Box>
  );

  const renderSelectYear = () => {
    const activeYearDoc = academicYears.find(y => y.isGlobalActive);
    let priorYearStr = "";
    if (activeYearDoc && activeYearDoc.year) {
      const parts = activeYearDoc.year.split('-');
      if (parts.length === 2) {
        priorYearStr = `${parseInt(parts[0], 10) - 1}-${parseInt(parts[1], 10) - 1}`;
      }
    }
    const filteredYears = academicYears.filter(
      y => y.year === activeYearDoc?.year || y.year === priorYearStr
    );

    return (
      <Box sx={{ maxWidth: 500, mx: "auto", mt: 5 }}>
        <FormCard title="Select Academic Year">
          <Typography sx={{ mb: 2, color: "var(--text-secondary)", fontWeight: 500 }}>Please select the academic year for this publication submission:</Typography>
          <Select
            fullWidth
            size="small"
            displayEmpty
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}
          >
            <MenuItem value="" disabled>Select Academic Year</MenuItem>
            {filteredYears.map(y => (
              <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
            ))}
          </Select>
          <Box sx={{ display: "flex", gap: 2, mt: 4, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => setViewMode("list")}
              sx={{
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
  };

  const renderForm = () => (
    <FormCard title="Book chapter Submission">
      <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 0.8, borderRadius: "8px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
      </Box>

      <FacultyInfoRow />

      {/* ── DOI Field (Mandatory) ────────────────────────────────────────────── */}
      <Box sx={{ mb: 2.5, p: 2.5, borderRadius: "12px", border: "2px solid var(--color-primary)", background: "var(--bg-accent-1)", boxShadow: "0 2px 12px rgba(var(--color-primary-rgb,99,102,241),0.08)" }}>
        <Typography sx={{ ...labelStyle, mb: 1 }}>DOI (Digital Object Identifier) : * <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10, opacity: 0.7 }}>— Enter DOI to verify Scopus indexing & auto-fill details</span></Typography>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
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
            sx={{ minWidth: 120, height: "40px", background: "var(--gradient-primary)", textTransform: "none", fontWeight: 700, flexShrink: 0, "&:hover": { opacity: 0.9 }, "&.Mui-disabled": { opacity: 0.5 } }}
          >
            {doiFetching ? <><Loader size={14} color="inherit" sx={{ mr: 0.8 }} />Fetching...</> : "Fetch Details"}
          </Button>
        </Box>
        {scopusIndexed && (
          <Typography sx={{ mt: 1, fontSize: 11, color: "#10b981", fontWeight: 700 }}>✓ Found in Scopus — Scopus Indexed</Typography>
        )}
        {doiFetched === false && form.doi && !doiFetching && !scopusIndexed && (
          <Typography sx={{ mt: 1, fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>Not Found in Scopus / Not Scopus Indexed</Typography>
        )}
      </Box>

      <Grid2 sx={{ mt: 1 }}>
        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
          <Typography sx={labelStyle}>Title of the Chapter : *</Typography>
          <TextField
            size="small"
            fullWidth
            placeholder="Enter the title of the chapter"
            value={form.chapterTitle}
            onChange={set("chapterTitle")}
            error={!!errors.chapterTitle}
            helperText={errors.chapterTitle ? "Title is required" : ""}
          />
        </Box>

        {/* ISBN + Book Title fetch */}
        <Box>
          <Typography sx={labelStyle}>ISBN Number :</Typography>
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
              {isbnFetching ? <Loader size={14} color="inherit" /> : "Fetch Title"}
            </Button>
          </Box>
        </Box>

        <Box>
          <Typography sx={labelStyle}>Title of the Book : *</Typography>
          <TextField size="small" fullWidth value={form.textBookName} onChange={set("textBookName")} placeholder="Auto-filled from ISBN or enter manually" error={!!errors.textBookName} helperText={errors.textBookName ? "Book title is required" : ""} />
        </Box>

        <Box>
          <Typography sx={labelStyle}>Publication Scope : *</Typography>
          <Select
            size="small"
            fullWidth
            value={form.publicationScope}
            onChange={(e) => setForm(p => ({ ...p, publicationScope: e.target.value }))}
            error={!!errors.publicationScope}
            displayEmpty
            MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}
          >
            <MenuItem value="" disabled>Select Scope</MenuItem>
            <MenuItem value="National">National</MenuItem>
            <MenuItem value="International">International</MenuItem>
          </Select>
        </Box>

        <Box>
          <Typography sx={labelStyle}>Name of the Publisher : *</Typography>
          <TextField
            size="small"
            fullWidth
            placeholder="e.g. Springer, Elsevier, IEEE (auto-filled from DOI if available)"
            value={form.publisher}
            onChange={(e) => setForm(p => ({ ...p, publisher: e.target.value }))}
            error={!!errors.publisher}
            helperText={errors.publisher ? "Publisher is required" : ""}
          />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Total Number of Authors : *</Typography>
          <TextField
            size="small"
            fullWidth
            type="number"
            value={form.totalAuthors}
            onChange={set("totalAuthors")}
            slotProps={{ htmlInput: { min: 1 } }}
          />
        </Box>
        {parseInt(form.totalAuthors) > 1 && (
          <Box>
            <Typography sx={labelStyle}>Applicant Author Position : *</Typography>
            <Select size="small" fullWidth value={form.userAuthorPosition} onChange={set("userAuthorPosition")} MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}>
              {Array.from({ length: parseInt(form.totalAuthors) || 1 }, (_, i) => (
                <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
              ))}
            </Select>
          </Box>
        )}

        {parseInt(form.totalAuthors) > 1 && (
          <Box sx={{ gridColumn: { sm: "1 / -1" }, mt: 2, background: "var(--bg-panel)", p: 2, borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <Typography sx={{ ...labelStyle, mb: 1, fontWeight: 700 }}>Name & affiliation of Co-Author(s) :</Typography>
            {form.otherAuthors.map((ca) => (
              <Box key={ca.authorPosition} sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2, p: 2, borderRadius: "12px", border: "1px dashed var(--border-color)", background: "var(--bg-accent-1)" }}>
                <Box sx={{ display: "flex", gap: 2, flexWrap: { xs: "wrap", sm: "nowrap" }, alignItems: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", background: "var(--color-primary)", color: "#fff", borderRadius: "50%", fontWeight: 700, flexShrink: 0 }}>
                    {ca.authorPosition}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: "150px" }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION TYPE</Typography>
                    <Select
                      size="small"
                      fullWidth
                      value={ca.affiliationType}
                      onChange={(e) => handleCoAuthorChange(ca.authorPosition, "affiliationType", e.target.value)}
                      displayEmpty
                      MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}
                    >
                      <MenuItem value="" disabled>Select Affiliation</MenuItem>
                      <MenuItem value="Aditya University">Aditya University</MenuItem>
                      <MenuItem value="Others">Others</MenuItem>
                    </Select>
                  </Box>

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
                          placeholder="Fetched from API"
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
      </Grid2>

      <SubLabel text="Date of the Publication:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Year:</Typography>
          <Select size="small" fullWidth displayEmpty value={form.year} onChange={(e) => {
            setForm(p => ({ ...p, year: e.target.value, month: "" }));
          }} error={!!errors.year} MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}>
            <MenuItem value="">Select Year</MenuItem>
            {(form.year && !YEARS.includes(String(form.year))
              ? [...YEARS, String(form.year)].sort((a, b) => Number(b) - Number(a))
              : YEARS
            ).map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Month:</Typography>
          <Select size="small" fullWidth displayEmpty value={form.month} onChange={set("month")} disabled={!form.year} error={!!errors.month} MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}>
            <MenuItem value="">Select Month</MenuItem>
            {getAvailableMonths().map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
        </Box>
      </Grid2>

      <NoteBox />

      <Grid2 sx={{ mt: 1 }}>
        <FileField label="Attach Page displaying author affiliation and chapter title" name="authorAffiliation" onChange={setFile("authorAffiliation")} error={!!errors.authorAffiliation} onError={(m) => toast.error(m)} />
        <Box>
          <Typography sx={labelStyle}>Applying as a Seed Grant Work? *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyingSeedGrant} onChange={set("applyingSeedGrant")} error={!!errors.applyingSeedGrant} MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Whether you want to apply for incentive? *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyIncentive} onChange={set("applyIncentive")} error={!!errors.applyIncentive} MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
      </Grid2>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => setViewMode("list")}
          sx={{
            px: 4,
            height: "44px",

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
        <SubmitBtn onClick={handleSubmit} loading={loading} />
      </Box>
    </FormCard>
  );

  const handleCloseDetails = () => setSelectedPubDetails(null);

  const LabelValueDetails = ({ label, value, chip, horizontal = false }) => (
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

  const renderDetailFile = (title, filepath, folder = "book-chapters") => {
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
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "20px",
            background: "var(--bg-paper)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)",
          }
        }}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "blur(4px)",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
            }
          }
        }}
      >
        <DialogTitle component="div" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--gradient-primary)", color: "#fff", py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Book sx={{ color: "#fff" }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 800 }}>Book Chapter Details</Typography>
          </Box>
          <IconButton onClick={handleCloseDetails} sx={{ color: "#fff" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 1 }}>{data.chapterTitle}</Typography>
          <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 3, fontWeight: 600 }}>Text Book: {data.textBookName}</Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2 }}>
            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" }, display: "flex", flexDirection: "column" }}><LabelValueDetails label="Academic Year" value={data.academicYear?.year || "N/A"} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" }, display: "flex", flexDirection: "column" }}><LabelValueDetails label="Publisher" value={data.publisher} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" }, display: "flex", flexDirection: "column" }}><LabelValueDetails label="Role" value={data.visibilityRole || "Applicant"} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" }, display: "flex", flexDirection: "column" }}>
              <LabelValueDetails
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
            </Box>

            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" }, display: "flex", flexDirection: "column" }}><LabelValueDetails label="DOI" value={data.doi || "-"} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" }, display: "flex", flexDirection: "column" }}><LabelValueDetails label="Publication Scope" value={data.publicationScope || "National"} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" }, display: "flex", flexDirection: "column" }}><LabelValueDetails label="Month/Year" value={`${data.month || ""} ${data.year || ""}`} /></Box>

            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" }, display: "flex", flexDirection: "column" }}><LabelValueDetails label="Author Position" value={data.userAuthorPosition || "1"} /></Box>

            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" }, display: "flex", flexDirection: "column" }}><LabelValueDetails label="Applying Seed Grant?" value={data.applyingSeedGrant === "Yes" ? "Yes" : "No"} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" }, display: "flex", flexDirection: "column" }}><LabelValueDetails label="Apply Incentive?" value={data.applyIncentive === "Yes" ? "Yes" : "No"} /></Box>

            {data.status === "Approved" && data.approvedAmount && (
              <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" }, display: "flex", flexDirection: "column" }}>
                <LabelValueDetails
                  label="Approved Incentive"
                  value={`₹${data.approvedAmount}`}
                  chip={<Chip label={`₹${data.approvedAmount}`} size="small" sx={{ bgcolor: "rgba(76, 175, 80, 0.1)", color: "#4caf50", fontWeight: 800 }} />}
                />
              </Box>
            )}

            {/* Appraisal Claimant Selector */}
            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" }, display: "flex", flexDirection: "column" }}>
              <LabelValueDetails
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
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Co-Authors detail list */}
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
                      <TableCell sx={{ fontWeight: 700, color: "var(--text-secondary)", width: 80 }}>POSITION</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>NAME</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>AFFILIATION</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      const total = parseInt(data.totalAuthors) || (data.coAuthors ? data.coAuthors.length + 1 : 0);
                      const applicantPos = parseInt(data.userAuthorPosition) || 0;
                      const derivedPositions = total > 0
                        ? Array.from({ length: total }, (_, i) => i + 1).filter(p => p !== applicantPos)
                        : [];
                      return data.coAuthors.map((author, idx) => {
                        const pos = author.authorPosition || derivedPositions[idx] || (idx + 1);
                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <Box sx={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 30, height: 30, borderRadius: '50%',
                                bgcolor: 'rgba(190, 147, 55, 0.12)', border: '1.5px solid var(--color-primary)',
                                color: 'var(--color-primary)', fontWeight: 900, fontSize: '0.85rem'
                              }}>
                                {pos}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{author.name}</TableCell>
                            <TableCell sx={{ color: "var(--text-secondary)" }}>{author.affiliation}</TableCell>
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
              {renderDetailFile("Cover Page", data.coverPage)}
              {renderDetailFile("Author Affiliation", data.authorAffiliation)}
              {renderDetailFile("Index Page", data.index)}
              {renderDetailFile("Soft Copy", data.softCopy)}
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
      <PageHeader 
        title="Book Chapter Publications" 
        subtitle="Manage and submit your book chapter publications" 
        onBack={viewMode !== "list" ? () => setViewMode("list") : undefined} 
      />

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
