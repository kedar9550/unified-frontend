import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

import { Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Autocomplete, CircularProgress } from "@mui/material";
import { toast } from "sonner";
import { AddCircle, Delete, Search } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn,
  labelStyle, MONTHS, YEARS, disabledField
} from "../../components/faculty/PublicationFormFields";
import API from "../../api/axios";

const ELSEVIER_API_KEY = "0436d4fe788649172354545ceca9e650";

export default function BookChapterPublication() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("list"); // 'list', 'select-year', 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [publicationsList, setPublicationsList] = useState([]);
  const [publishers, setPublishers] = useState([]);

  const [form, setForm] = useState({
    textBookName: "", chapterTitle: "", yearOfPublication: "",
    chaptersContributed: "", publisher: "", month: "", year: "",
    applyIncentive: "", publicationType: "", customPublisher: "", applyingSeedGrant: "",
    totalAuthors: 1, userAuthorPosition: 1, otherAuthors: []
  });
  const [files, setFiles] = useState({ coverPage: null, authorAffiliation: null, index: null, softCopy: null });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const [scopusIndexed, setScopusIndexed] = useState(false);
  const [scopusFetching, setScopusFetching] = useState(false);

  useEffect(() => {
    API.get("/api/research/book-chapter").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => console.log("Failed to fetch book chapters", err));

    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => console.log("Failed to fetch academic years", err));

    API.get("/api/publishers").then(res => {
      setPublishers(res.data?.data || []);
    }).catch(err => console.log("Failed to fetch publishers", err));
  }, [viewMode]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setFile = (k) => (e) => setFiles((p) => ({ ...p, [k]: e.target.files[0] }));

  const fetchScopusDetails = async () => {
    if (!form.chapterTitle.trim()) {
      toast.error("Please enter the Title of the Chapter first.");
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
        toast.error("This book chapter is not indexed in Scopus.");
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
        toast.error("Could not parse Scopus ID for this chapter.");
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
              const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
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
            const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
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
              const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
              const shortMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
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
                  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
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
          newState.publicationType = matchedPublisher.type; // Auto-preselect National / International
        } else if (rawPublisher) {
          newState.publisher = "Others";
          newState.customPublisher = rawPublisher;
          newState.publicationType = "International"; // Default fallback for scopus indexed book chapters
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
    const newErrors = {};
    if (!form.textBookName) newErrors.textBookName = true;
    if (!form.chapterTitle) newErrors.chapterTitle = true;
    if (!form.publisher) newErrors.publisher = true;
    if (!form.month) newErrors.month = true;
    if (!form.year) newErrors.year = true;
    if (!form.applyIncentive) newErrors.applyIncentive = true;
    if (!form.applyingSeedGrant) newErrors.applyingSeedGrant = true;
    if (!form.publicationType) newErrors.publicationType = true;

    if (!files.authorAffiliation) newErrors.authorAffiliation = true;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill all mandatory fields and upload required documents");
      return;
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

      // Calculate firstAuthor and authorPosition
      const isFirst = (parseInt(form.userAuthorPosition) === 1) ? "Yes" : "No";
      const authPos = (isFirst === "Yes") ? "" : String(form.userAuthorPosition);

      // Map coAuthors array matching CoAuthorSchema
      const coAuthorsList = form.otherAuthors.map(a => ({
        name: a.authorName || "",
        affiliation: a.affiliationType === "Aditya University" ? "Aditya University" : (a.affiliationName || "")
      })).filter(ca => ca.name && ca.affiliation);

      fd.append("textBookName", form.textBookName);
      fd.append("chapterTitle", form.chapterTitle);
      fd.append("yearOfPublication", form.year);
      fd.append("firstAuthor", isFirst);
      fd.append("authorPosition", authPos);
      fd.append("chaptersContributed", form.chaptersContributed || "");
      fd.append("publisher", form.publisher === "Others" ? form.customPublisher : form.publisher);
      fd.append("coAuthors", JSON.stringify(coAuthorsList));
      fd.append("month", form.month);
      fd.append("year", form.year);
      fd.append("applyIncentive", form.applyIncentive);
      fd.append("publicationType", form.publicationType);
      fd.append("applyingSeedGrant", form.applyingSeedGrant);
      fd.append("totalAuthors", String(total));
      fd.append("userAuthorPosition", String(form.userAuthorPosition));

      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });
      fd.append("academicYear", selectedYear);
      fd.append("college", user?.college || "");
      fd.append("panNumber", user?.panNumber || "");

      await API.post("/api/research/book-chapter", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Book Chapter submitted successfully!");
      setForm({
        textBookName: "", chapterTitle: "", yearOfPublication: "",
        chaptersContributed: "", publisher: "", month: "", year: "",
        applyIncentive: "", publicationType: "", customPublisher: "", applyingSeedGrant: "",
        totalAuthors: 1, userAuthorPosition: 1, otherAuthors: []
      });
      setFiles({ coverPage: null, authorAffiliation: null, index: null, softCopy: null });
      setErrors({});
      setSelectedYear("");
      setViewMode("list");
      setScopusIndexed(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const renderList = () => (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>My Book Chapter Publications</Typography>
        <Button
          variant="contained"
          onClick={() => setViewMode("select-year")}
          sx={{
            background: "var(--gradient-primary)",
            borderRadius: "12px",
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
      <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
        <Table>
          <TableHead sx={{ background: "var(--gradient-primary)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Text Book Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Chapter Title</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Publisher</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(!publicationsList || publicationsList.length === 0) ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No previous publications found. Click "Apply New" to submit one.
                </TableCell>
              </TableRow>
            ) : (
              publicationsList.map((pub, i) => (
                <TableRow key={pub._id || i}>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>{pub.textBookName || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.chapterTitle || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.publisher || "N/A"}</TableCell>
                  <TableCell sx={{ py: 2 }}><Typography variant="body2" sx={{ color: "#10b981", fontWeight: 700, background: "rgba(16, 185, 129, 0.1)", px: 1.5, py: 0.5, borderRadius: "6px", display: "inline-block" }}>Submitted</Typography></TableCell>
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
        <Select
          fullWidth
          size="small"
          displayEmpty
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          <MenuItem value="" disabled>Select Academic Year</MenuItem>
          {academicYears.map(y => (
            <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
          ))}
        </Select>
        <Box sx={{ display: "flex", gap: 2, mt: 4, justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            onClick={() => setViewMode("list")}
            sx={{
              borderRadius: "12px",
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
              borderRadius: "12px",
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

  const renderForm = () => (
    <FormCard title="Book chapter Submission">
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 0.8, borderRadius: "8px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
        <Button size="small" variant="text" onClick={() => setViewMode("select-year")} sx={{ fontWeight: 700, textTransform: "none", color: "var(--color-primary)" }}>Change Year</Button>
      </Box>

      <FacultyInfoRow />

      <Grid2 sx={{ mt: 1 }}>
        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
          <Typography sx={labelStyle}>Title of the Chapter: *</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Enter the Title of the Chapter to fetch details from Scopus (e.g. Machine Learning in Healthcare)"
              value={form.chapterTitle}
              onChange={(e) => {
                const newTitle = e.target.value;
                setForm({
                  chapterTitle: newTitle,
                  textBookName: "",
                  yearOfPublication: "",
                  chaptersContributed: "",
                  publisher: "",
                  customPublisher: "",
                  month: "",
                  year: "",
                  applyIncentive: "",
                  publicationType: "",
                  applyingSeedGrant: "",
                  totalAuthors: 1,
                  userAuthorPosition: 1,
                  otherAuthors: []
                });
                setFiles({ coverPage: null, authorAffiliation: null, index: null, softCopy: null });
                setScopusIndexed(false);
              }}
              error={!!errors.chapterTitle}
              helperText={errors.chapterTitle ? "Title is required" : ""}
            />
            <Button
              variant="contained"
              onClick={fetchScopusDetails}
              disabled={!form.chapterTitle || scopusFetching}
              startIcon={scopusFetching ? <CircularProgress size={16} color="inherit" /> : <Search />}
              sx={{
                minWidth: "140px",
                height: "40px",
                textTransform: "none",
                borderRadius: "8px",
                fontWeight: 700,
                background: "var(--color-primary)",
                whiteSpace: "nowrap",
                "&:hover": { background: "var(--color-primary-dark)" }
              }}
            >
              {scopusFetching ? "Fetching..." : "Fetch Details"}
            </Button>
          </Box>
          {scopusIndexed && (
            <Typography variant="caption" sx={{ color: "#10b981", fontWeight: 700, mt: 0.5, display: "block" }}>
              ✓ Scopus Indexing Verified! Details auto-filled below.
            </Typography>
          )}
        </Box>
        <Box>
          <Typography sx={labelStyle}>Title of the Book:</Typography>
          <TextField size="small" fullWidth value={form.textBookName} onChange={set("textBookName")} error={!!errors.textBookName} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Publication Type:</Typography>
          <Select
            fullWidth
            size="small"
            displayEmpty
            value={form.publicationType}
            onChange={(e) => setForm(p => ({ ...p, publicationType: e.target.value }))}
            error={!!errors.publicationType}
          >
            <MenuItem value="" disabled>Select</MenuItem>
            <MenuItem value="National">National</MenuItem>
            <MenuItem value="International">International</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Name of the Publisher :</Typography>
          <Autocomplete
            options={[...publishers.filter(p => p.type === form.publicationType), { name: "Others", type: form.publicationType }]}
            groupBy={(option) => option.type}
            getOptionLabel={(option) => option.name || ""}
            value={publishers.find(p => p.name === form.publisher) || (form.publisher === "Others" ? { name: "Others", type: form.publicationType } : (form.publisher ? { name: form.publisher, type: form.publicationType || "Unknown" } : null))}
            isOptionEqualToValue={(option, value) => option.name === value.name}
            onChange={(e, newValue) => setForm(p => ({ ...p, publisher: newValue ? newValue.name : "" }))}
            freeSolo
            onInputChange={(e, newInputValue) => {
              if (e?.type === "change") {
                setForm(p => ({ ...p, publisher: newInputValue }));
              }
            }}
            renderInput={(params) => (
              <TextField {...params} size="small" fullWidth placeholder="Select or search publisher" error={!!errors.publisher} />
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
          <Typography sx={labelStyle}>Total Number of Authors : *</Typography>
          <TextField
            size="small"
            fullWidth
            type="number"
            value={form.totalAuthors}
            onChange={set("totalAuthors")}
            inputProps={{ min: 1 }}
          />
        </Box>
        {parseInt(form.totalAuthors) > 1 && (
          <Box>
            <Typography sx={labelStyle}>Applicant Author Position : *</Typography>
            <Select size="small" fullWidth value={form.userAuthorPosition} onChange={set("userAuthorPosition")}>
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
      </Grid2>

      <SubLabel text="Date of the Publication:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Month:</Typography>
          <Select size="small" fullWidth displayEmpty value={form.month} onChange={set("month")} error={!!errors.month}>
            <MenuItem value="">Select</MenuItem>
            {MONTHS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Year:</Typography>
          <TextField size="small" fullWidth value={form.year} onChange={set("year")} placeholder="YYYY" inputProps={{ maxLength: 4 }} error={!!errors.year} />
        </Box>
      </Grid2>

      <NoteBox />

      <Grid2 sx={{ mt: 1 }}>
        <FileField label="Attach Page displaying author affiliation and chapter title" name="authorAffiliation" onChange={setFile("authorAffiliation")} error={!!errors.authorAffiliation} onError={(m) => toast.error(m)} />
        <Box>
          <Typography sx={labelStyle}>Applying as a Seed Grant Work? *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyingSeedGrant} onChange={set("applyingSeedGrant")} error={!!errors.applyingSeedGrant}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Whether you want to apply for incentive? *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyIncentive} onChange={set("applyIncentive")} error={!!errors.applyIncentive}>
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
            borderRadius: "12px",
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

  return (
    <Box>
      <PageHeader title="Book Chapter" subtitle="Manage and submit your book chapter publication details" breadcrumbs={["Home", "Publications", "Book Chapter"]} />

      {viewMode === "list" && renderList()}
      {viewMode === "select-year" && renderSelectYear()}
      {viewMode === "form" && renderForm()}

    </Box>
  );
}
