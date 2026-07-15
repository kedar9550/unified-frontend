import Loader from "../../components/common/Loader";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

import { Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Autocomplete, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Grid, Card, Chip, Divider, Tooltip, TablePagination } from "@mui/material";
import { toast } from "sonner";
import { Delete, Search, CurrencyRupee, Close, Groups, MenuBook, AttachFile, Description, Download, Visibility } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import NoActiveYearDialog from "../../components/common/NoActiveYearDialog";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import {
  labelStyle, disabledField, MONTHS, YEARS
} from "../../components/faculty/publicationConstants"; import API from "../../api/axios";

export default function TextbookPublication() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("list"); // 'list', 'select-year', 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [noActiveYearAlertOpen, setNoActiveYearAlertOpen] = useState(false);
  const [publicationsList, setPublicationsList] = useState([]);
  const [selectedPubDetails, setSelectedPubDetails] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editions, setEditions] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [isbnFetching, setIsbnFetching] = useState(false);
  const [isbnFetched, setIsbnFetched] = useState(false);
  const [isbnFetchedFields, setIsbnFetchedFields] = useState({ title: false, publisher: false });

  const [form, setForm] = useState({
    title: "", publisher: "", isbn: "", yearOfPublication: "",
    totalAuthors: 1, userAuthorPosition: 1,
    edition: "", cost: "", month: "", year: "",
    applyIncentive: "",
    otherAuthors: [],
    publicationScope: "National",
    customPublisher: "",
    currencySymbol: "₹"
  });
  const [files, setFiles] = useState({ coverPage: null, authorAffiliation: null, index: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/api/research/textbook").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => { });

    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => { });

    API.get("/api/research/textbook/editions").then(res => {
      setEditions(res.data?.data || []);
    }).catch(err => { });

    API.get("/api/publishers").then(res => {
      setPublishers(res.data?.data || []);
    }).catch(err => { });
  }, [viewMode]);

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

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm((p) => {
      const newForm = { ...p, [k]: val };
      if (k === "isbn") {
        newForm.title = "";
        newForm.publisher = "";
        newForm.month = "";
        newForm.year = "";
        setIsbnFetched(false);
        setIsbnFetchedFields({ title: false, publisher: false });
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
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      toast.error("Only PDF, JPG, and PNG files are allowed");
      return false;
    }
    if (file.size > 500 * 1024) {
      toast.error("File size exceeds 500KB limit");
      return false;
    }
    return true;
  };

  const setFile = (k) => (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      setFiles((p) => ({ ...p, [k]: file }));
    } else {
      e.target.value = null; // reset
    }
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
      toast.error(err?.response?.data?.message || err.message || "Failed to fetch ISBN details");
    } finally {
      setIsbnFetching(false);
    }
  };



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
    if (!user?.panNumber || user?.panNumber === "Not Set" || !user?.college || user?.college === "Not Set") {
      toast.error("Please update your profile with PAN Number and College before submitting");
      return;
    }

    if (!form.title || !form.publisher || !form.isbn) {
      toast.error("Please fill all required fields");
      return;
    }

    if (form.cost) {
      const numCost = Number(form.cost);
      if (isNaN(numCost) || numCost < 0) {
        toast.error("Cost must be a positive numeric value");
        return;
      }
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

    if (!form.applyIncentive) {
      toast.error("Please select whether you want to apply for an incentive");
      return;
    }

    // Check if total authors is correctly filled
    const total = parseInt(form.totalAuthors) || 1;
    if (total < 1) {
      toast.error("Total number of authors must be at least 1");
      return;
    }
    if (total > 1) {
      for (const a of form.otherAuthors) {
        if (!a.affiliationType || (a.affiliationType === 'Others' && (!a.authorName || !a.affiliationName)) || (a.affiliationType === 'Aditya University' && (!a.empId || !a.authorName))) {
          toast.error(`Please complete details for Author Position ${a.authorPosition}`);
          return;
        }
      }
    }

    // Check mandatory file uploads
    if (!files.coverPage || !files.authorAffiliation || !files.index) {
      toast.error("Please attach all the required documents (Cover Page, Author Affiliation, Index)");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      const submissionForm = { ...form };
      if (!submissionForm.yearOfPublication) submissionForm.yearOfPublication = form.year;

      // Construct final authors array for backend
      const allAuthors = [];
      const userPos = parseInt(form.userAuthorPosition);
      for (let i = 1; i <= total; i++) {
        if (i === userPos) {
          allAuthors.push({ authorPosition: i }); // Backend will fill user details
        } else {
          const coAuth = form.otherAuthors.find(a => a.authorPosition === i);
          if (coAuth) {
            allAuthors.push({
              authorPosition: coAuth.authorPosition,
              authorName: coAuth.authorName,
              affiliationType: coAuth.affiliationType,
              employeeId: coAuth.affiliationType === "Aditya University" ? coAuth.empId : null, // Backend accepts author.employeeId || author.empId
              empId: coAuth.affiliationType === "Aditya University" ? coAuth.empId : null,
              affiliationName: coAuth.affiliationType === "Aditya University" ? "Aditya University" : coAuth.affiliationName
            });
          }
        }
      }

      // Append standard fields
      fd.append("title", submissionForm.title);
      fd.append("isbn", submissionForm.isbn);
      fd.append("yearOfPublication", submissionForm.yearOfPublication);
      fd.append("totalAuthors", submissionForm.totalAuthors);
      fd.append("userAuthorPosition", submissionForm.userAuthorPosition);
      fd.append("edition", submissionForm.edition);
      fd.append("cost", submissionForm.cost);
      fd.append("month", submissionForm.month);
      fd.append("year", submissionForm.year);
      fd.append("publicationScope", submissionForm.publicationScope);
      fd.append("publisher", submissionForm.publisher === "Others" ? submissionForm.customPublisher : submissionForm.publisher);
      fd.append("applyIncentive", submissionForm.applyIncentive);
      fd.append("authors", JSON.stringify(allAuthors));

      fd.append("academicYear", selectedYear);
      fd.append("college", user?.college || "");

      if (files.coverPage) fd.append("coverPage", files.coverPage);
      if (files.authorAffiliation) fd.append("authorAffiliation", files.authorAffiliation);
      if (files.index) fd.append("index", files.index);

      await API.post("/api/research/textbook", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Textbook submitted successfully!");

      // Reset form
      setForm({ title: "", publisher: "", isbn: "", yearOfPublication: "", totalAuthors: 1, userAuthorPosition: 1, edition: "", cost: "", month: "", year: "", applyIncentive: "", otherAuthors: [], publicationScope: "National", currencySymbol: "₹" });
      setFiles({ coverPage: null, authorAffiliation: null, index: null });
      setSelectedYear("");
      setViewMode("list");
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
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800, textAlign: { xs: "center", sm: "left" } }}>My Textbook Publications</Typography>
        <Button
          variant="contained"
          onClick={() => {
            const activeYear = academicYears.length > 0;
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
            No Previous Textbooks
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
            You haven't submitted any textbook details yet. Click the "Apply New" button to submit your first entry.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
          <Table sx={{ minWidth: 1100 }}>
            <TableHead sx={{ background: "var(--gradient-primary)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>ISBN</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Applicant</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Author / Co-Author</TableCell>

                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {publicationsList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((pub, i) => (
                <TableRow key={pub._id || i} sx={{ "&:hover": { background: "rgba(var(--color-primary-rgb, 99,102,241), 0.04)", transition: "background 0.2s" } }}>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>{pub.title || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.isbn || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {pub.facultyId?.name || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {pub.authors && pub.authors.length > 0 ? pub.authors.map(a => a.authorName).filter(Boolean).join(", ") : "N/A"}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: pub.visibilityRole === "Applicant" ? "var(--color-primary)" : "text.secondary" }}>
                      {pub.visibilityRole || "Applicant"}
                    </Typography>
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
    const activeYearDoc = academicYears[0];
    let priorYearStr = "";
    if (activeYearDoc && activeYearDoc.year) {
      const parts = activeYearDoc.year.split('-');
      if (parts.length === 2) {
        priorYearStr = `${parseInt(parts[0], 10) - 1}-${parseInt(parts[1], 10) - 1}`;
      }
    }
    const filteredYears = academicYears;

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
    <FormCard title="Text book Submission">
      <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 0.8, borderRadius: "8px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
      </Box>

      <FacultyInfoRow />

      <SubLabel text="Details of the Text Book:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Publication Scope :</Typography>
          <Select
            fullWidth
            size="small"
            value={form.publicationScope}
            onChange={(e) => {
              const val = e.target.value;
              setForm(prev => ({
                ...prev,
                publisher: val,
                publicationScope: val,
                customPublisher: "",
                currencySymbol: val === "National" ? "₹" : "$"
              }));
            }}
            MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}
          >
            <MenuItem value="National">National</MenuItem>
            <MenuItem value="International">International</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>ISBN NO :</Typography>
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
          <Typography sx={labelStyle}>Title of the Text Book :</Typography>
          <TextField size="small" fullWidth value={form.title} onChange={set("title")} slotProps={{ htmlInput: { maxLength: 200 } }} disabled={isbnFetchedFields.title} sx={isbnFetchedFields.title ? disabledField : {}} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Name of the Publisher :</Typography>
          <Autocomplete
            options={[...publishers.filter(p => p.type === form.publicationScope), { name: "Others", type: form.publicationScope }]}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.name === value?.name}
            value={publishers.find(p => p.name === form.publisher) || (form.publisher === "Others" ? { name: "Others", type: form.publicationScope } : (form.publisher ? { name: form.publisher, type: form.publicationScope || "Unknown" } : null))}
            onChange={(e, newValue) => {
              const val = newValue ? newValue.name : "";
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
            options={editions.map(e => e.name)}
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
            {/* Left Side: Currency Indicator */}
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

            {/* Center: Input Field */}
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

            {/* Right Side: Toggle Switch */}
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
        <Box></Box>

        {/* Authors Section */}
        <Box sx={{ gridColumn: { sm: "1 / -1" }, background: "var(--bg-panel)", p: 2, borderRadius: "12px", border: "1px solid var(--border-color)", mt: 2 }}>
          <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 2 }}>Author Details</Typography>
          <Grid2>
            <Box>
              <Typography sx={labelStyle}>Total Number of Authors :</Typography>
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
                <Typography sx={labelStyle}>Applicant Author Position :</Typography>
                <Select size="small" fullWidth value={form.userAuthorPosition} onChange={set("userAuthorPosition")} MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}>
                  {Array.from({ length: parseInt(form.totalAuthors) || 1 }, (_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
                  ))}
                </Select>
              </Box>
            )}
          </Grid2>

          {parseInt(form.totalAuthors) > 1 && (
            <Box sx={{ mt: 3 }}>
              <Typography sx={{ ...labelStyle, mb: 1 }}>Name & affiliation of Co-Author(s) :</Typography>
              {form.otherAuthors.map((ca, index) => (
                <Box key={ca.authorPosition} sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2, p: 2, borderRadius: "12px", border: "1px dashed var(--border-color)", background: "var(--bg-accent-1)", position: "relative" }}>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: { xs: "wrap", sm: "nowrap" }, alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", background: "var(--color-primary)", color: "#fff", borderRadius: "50%", fontWeight: 700 }}>
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
        </Box>
      </Grid2>

      <SubLabel text="Date of the Publication:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Year:</Typography>
          <Select size="small" fullWidth displayEmpty value={form.year} onChange={(e) => {
            setForm(p => ({ ...p, year: e.target.value, month: "" }));
          }} MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}>
            <MenuItem value="">Select Year</MenuItem>
            {(form.year && !YEARS.includes(String(form.year))
              ? [...YEARS, String(form.year)].sort((a, b) => Number(b) - Number(a))
              : YEARS
            ).map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
          {isbnFetched && !form.year && (
            <Typography variant="caption" sx={{ color: "#e8a000", fontWeight: 600, mt: 0.5, display: "block" }}>
              ⚠ Year not found from ISBN — please select manually
            </Typography>
          )}
        </Box>
        {form.year ? (
          <Box>
            <Typography sx={labelStyle}>Month:</Typography>
            <Select size="small" fullWidth displayEmpty value={form.month} onChange={set("month")} disabled={!form.year} MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}>
              <MenuItem value="">Select Month</MenuItem>
              {getAvailableMonths().map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
            {isbnFetched && !form.month && (
              <Typography variant="caption" sx={{ color: "#e8a000", fontWeight: 600, mt: 0.5, display: "block" }}>
                ⚠ Month not found from ISBN — please select manually
              </Typography>
            )}
          </Box>
        ) : (
          <Box />
        )}
      </Grid2>

      <NoteBox />

      <Grid2 sx={{ mt: 3 }}>
        <FileField label="Attach CoverPage *" name="coverPage" onChange={setFile("coverPage")} />
        <FileField label="Attach Page displaying author affiliation *" name="authorAffiliation" onChange={setFile("authorAffiliation")} />
        <FileField label="Attach Index *" name="index" onChange={setFile("index")} />
        <Box>
          <Typography sx={labelStyle}>Whether you want to apply for incentive?</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyIncentive} onChange={set("applyIncentive")} MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}>
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

  const renderDetailFile = (title, filepath, folder = "textbooks") => {
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
            <MenuBook sx={{ color: "#fff" }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 800 }}>Text Book Details</Typography>
          </Box>
          <IconButton onClick={handleCloseDetails} sx={{ color: "#fff" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 1 }}>{data.title}</Typography>
          <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 3, fontWeight: 600 }}>Publisher: {data.publisher}</Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2 }}>
            {/* Status and dates */}
            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" }, display: "flex", flexDirection: "column" }}><LabelValueDetails label="Academic Year" value={data.academicYear?.year || "N/A"} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" }, display: "flex", flexDirection: "column" }}><LabelValueDetails label="ISBN" value={data.isbn} /></Box>
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

            {/* Edition, cost, type, month/year */}
            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" }, display: "flex", flexDirection: "column" }}><LabelValueDetails label="Edition" value={data.edition || "-"} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" }, display: "flex", flexDirection: "column" }}><LabelValueDetails label="Cost" value={data.cost || "-"} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" }, display: "flex", flexDirection: "column" }}><LabelValueDetails label="Publication Scope" value={data.publicationScope || "National"} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 3" }, display: "flex", flexDirection: "column" }}><LabelValueDetails label="Month/Year" value={`${data.month || ""} ${data.year || ""}`} /></Box>

            {/* Author details */}
            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" }, display: "flex", flexDirection: "column" }}><LabelValueDetails label="Total Authors" value={data.totalAuthors} /></Box>
            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" }, display: "flex", flexDirection: "column" }}><LabelValueDetails label="Applicant Position" value={data.userAuthorPosition} /></Box>

            {/* Incentive details */}
            <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" }, display: "flex", flexDirection: "column" }}>
              <LabelValueDetails
                label="Incentive details"
                value={data.applyIncentive === "Yes" ? "Yes" : "No"}
              />
            </Box>
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
                    const isApplicant = data.visibilityRole === "Applicant" || (data.facultyId && (data.facultyId === user?.userId || data.facultyId._id === user?.userId));
                    const eligibleClaimants = [
                      { _id: data.facultyId?._id, name: data.facultyId?.name, institutionId: data.facultyId?.institutionId },
                      ...((data.authors || [])
                        .filter(a => a.employeeId)
                        .map(a => ({
                          _id: a.employeeId?._id || a.employeeId,
                          name: a.employeeId?.name || a.authorName,
                          institutionId: a.employeeId?.institutionId || a.employeeId || ""
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

          {/* Authors table */}
          {data.authors && data.authors.length > 0 && (
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
                      const applicantPos = parseInt(data.userAuthorPosition) || 0;
                      const coAuthors = data.authors ? data.authors.filter(a => parseInt(a.authorPosition) !== applicantPos) : [];
                      return coAuthors.map((author, idx) => (
                        <TableRow key={idx} sx={{ '&:hover': { bgcolor: 'rgba(190,147,55,0.04)' } }}>
                          <TableCell>
                            <Box sx={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 30, height: 30, borderRadius: '50%',
                              bgcolor: 'rgba(190, 147, 55, 0.12)', border: '1.5px solid var(--color-primary)',
                              color: 'var(--color-primary)', fontWeight: 900, fontSize: '0.82rem'
                            }}>
                              {author.authorPosition}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{author.authorName}</TableCell>
                          <TableCell sx={{ color: "var(--text-secondary)" }}>{author.affiliationName || "-"}</TableCell>
                        </TableRow>
                      ));
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
              {renderDetailFile("Index", data.index)}
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
        title="Textbook Publications" 
        subtitle="Manage and submit your textbook publications" 
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
