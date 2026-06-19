import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Grid, Card, Button, TextField, Chip, IconButton, Stack,
  FormControl, InputLabel, Select, MenuItem, Checkbox, Dialog, DialogTitle,
  DialogContent, DialogActions
} from "@mui/material";
import {
  Description, Person, CheckCircle, Cancel
} from "@mui/icons-material";
import { toast } from "sonner";
import PageHeader from "../../components/common/PageHeader";
import SectionHeader from "../../components/common/SectionHeader";
import API from "../../api/axios";
import DataTable from "../../components/data/DataTable";

// 13 Categories definitions
const CONTRIBUTION_CATEGORIES = [
  { id: 1, name: "Member of BOG / GB / AC / BOS" },
  { id: 2, name: "Editorial Board Member (SCIE / Q1 / Q2)" },
  { id: 3, name: "Editorial Board Member (ESCI / Q3 / Q4 / Conference Proceedings)" },
  { id: 4, name: "Awards (MHRD / AICTE / UGC / State Govt / Top Institutions)" },
  { id: 5, name: "Awards (NGO / Trust / Others)" },
  { id: 6, name: "Developed E-Content" },
  { id: 7, name: "Certification on New Age Technologies" },
  { id: 8, name: "Students Trained and Shortlisted for Finals" },
  { id: 9, name: "Articles Published in Magazine / Newspaper" },
  { id: 10, name: "Research Facility Establishment / Maintenance" },
  { id: 11, name: "NPTEL Course Completion" },
  { id: 12, name: "Coursera Course Completion" },
  { id: 13, name: "FDP / Seminar Grant Sanctioned" }
];

export default function ContributionApproval() {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Pending at HOD");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActionType, setBulkActionType] = useState(null);
  const [openBulkRemarksDialog, setOpenBulkRemarksDialog] = useState(false);
  const [bulkRemarks, setBulkRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [individualRejectId, setIndividualRejectId] = useState(null);
  const [individualRemarks, setIndividualRemarks] = useState("");
  const [openIndividualRemarksDialog, setOpenIndividualRemarksDialog] = useState(false);

  const fetchRequests = useCallback(async (yearId, status, category) => {
    if (!yearId) return;
    setLoading(true);
    try {
      const params = { status, academicYear: yearId };
      if (category !== "All") params.category = category;
      const res = await API.get("/api/value-addition/contribution/pending-hod", { params });
      if (res.data?.success) {
        setData(res.data.data);
        setSelectedIds([]);
      }
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
      toast.error(err.response?.data?.message || "Failed to load approvals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initializeDashboard = async () => {
      try {
        const res = await API.get("/api/academic-years");
        const years = res.data?.years || res.data?.data || [];
        if (!isMounted) return;
        setAcademicYears(years);
        if (years.length > 0) {
          const defaultYearId = years[0]._id;
          setSelectedYear(defaultYearId);
          await fetchRequests(defaultYearId, statusFilter, categoryFilter);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch academic years", err);
        if (isMounted) setLoading(false);
      }
    };
    initializeDashboard();
    return () => { isMounted = false; };
  }, [fetchRequests]);

  const handleYearChange = (e) => {
    const nextYear = e.target.value;
    setSelectedYear(nextYear);
    fetchRequests(nextYear, statusFilter, categoryFilter);
  };

  const handleStatusChange = (e) => {
    const nextStatus = e.target.value;
    setStatusFilter(nextStatus);
    fetchRequests(selectedYear, nextStatus, categoryFilter);
  };

  const handleCategoryChange = (e) => {
    const nextCategory = e.target.value;
    setCategoryFilter(nextCategory);
    fetchRequests(selectedYear, statusFilter, nextCategory);
  };

  // Group data by faculty
  const groupedData = data.reduce((groups, item) => {
    const facultyId = item.facultyId?._id;
    if (!facultyId) return groups;
    if (!groups[facultyId]) {
      groups[facultyId] = { faculty: item.facultyId, academicYear: item.academicYear?.year || "N/A", entries: [] };
    }
    groups[facultyId].entries.push(item);
    return groups;
  }, {});

  // Apply search query
  const groupedFacultyIds = Object.keys(groupedData).filter(facId => {
    const group = groupedData[facId];
    const facName = group.faculty?.name?.toLowerCase() || "";
    const empId = group.faculty?.institutionId?.toLowerCase() || "";
    const term = searchQuery.toLowerCase();
    return facName.includes(term) || empId.includes(term);
  });

  const handleSelectEntry = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAllForFaculty = (entries, isChecked) => {
    const pendingIds = entries.filter(e => e.status === "Pending at HOD").map(e => e._id);
    if (isChecked) {
      setSelectedIds(prev => [...new Set([...prev, ...pendingIds])]);
    } else {
      setSelectedIds(prev => prev.filter(i => !pendingIds.includes(i)));
    }
  };

  const handleIndividualAction = async (id, action, remarksText = "") => {
    if (action === "Reject" && !remarksText) {
      setIndividualRejectId(id);
      setIndividualRemarks("");
      setOpenIndividualRemarksDialog(true);
      return;
    }
    setActionLoading(true);
    try {
      await API.put(`/api/value-addition/contribution/hod-action/${id}`, { action, comment: remarksText });
      toast.success(`Request successfully ${action === "Approve" ? "Approved" : "Rejected"}.`);
      setOpenIndividualRemarksDialog(false);
      fetchRequests(selectedYear, statusFilter, categoryFilter);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkActionTrigger = (action) => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one entry using the checkboxes");
      return;
    }
    setBulkActionType(action);
    setBulkRemarks("");
    setOpenBulkRemarksDialog(true);
  };

  const handleBulkActionSubmit = async () => {
    if (bulkActionType === "Reject" && !bulkRemarks) {
      toast.error("Rejection remarks are mandatory");
      return;
    }
    setActionLoading(true);
    try {
      await API.post("/api/value-addition/contribution/hod-bulk-action", {
        ids: selectedIds, action: bulkActionType, comment: bulkRemarks
      });
      toast.success(`Successfully ${bulkActionType === "Approve" ? "approved" : "rejected"} ${selectedIds.length} entries.`);
      setOpenBulkRemarksDialog(false);
      fetchRequests(selectedYear, statusFilter, categoryFilter);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Bulk action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === "Approved") return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" };
    if (status === "Rejected") return { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" };
    if (status === "Pending at HOD") return { bg: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" };
    return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b" };
  };

  const getCategoryName = (catId) => {
    const found = CONTRIBUTION_CATEGORIES.find(c => c.id === catId);
    return found ? found.name : `Category ${catId}`;
  };

  const getFileLink = (filepath) => {
    if (!filepath) return "#";
    const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
    return filepath.startsWith("http") ? filepath : `${backendURL}${filepath}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const renderDurationPeriod = (item) => {
    const cat = parseInt(item.category);
    if ([1, 2, 3, 7, 10, 12, 13].includes(cat)) {
      if (item.fromDate && item.toDate) {
        const toDateFormatted = new Date(item.toDate).getFullYear() > 2050 ? "Present" : formatDate(item.toDate);
        return `${formatDate(item.fromDate)} - ${toDateFormatted}`;
      }
      if (item.duration) {
        return item.duration.includes("Days") || item.duration.includes("Hours") || item.duration.includes("Weeks")
          ? item.duration : `${item.duration} Days`;
      }
    }
    if (cat === 11) return item.duration || "-";
    if ([4, 5].includes(cat) && item.awardDate) return formatDate(item.awardDate);
    if (cat === 8 && item.eventDate) return formatDate(item.eventDate);
    if (cat === 9 && item.publicationDate) return formatDate(item.publicationDate);
    if (cat === 10 && item.facilityDate) return formatDate(item.facilityDate);
    if (cat === 13 && item.sanctionDate) return formatDate(item.sanctionDate);
    return "-";
  };

  const renderDynamicTextDetails = (item) => {
    const cat = parseInt(item.category);
    switch (cat) {
      case 1: return <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.organizationName}</Typography>;
      case 2:
      case 3: return <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.journalName || item.journalConferenceName}</Typography>;
      case 4:
      case 5: return <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.awardName}</Typography>;
      case 6:
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.courseName}</Typography>
            <Typography sx={{ fontSize: 10, color: "var(--color-primary)", fontWeight: 700 }}>
              URL: <a href={item.url} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary)", textDecoration: "underline" }}>View Link</a>
            </Typography>
          </Box>
        );
      case 7: return <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.certificationName}</Typography>;
      case 8: return <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.eventName}</Typography>;
      case 9:
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.articleTitle}</Typography>
            <Typography sx={{ fontSize: 10, color: "var(--color-primary)", fontWeight: 700 }}>Publication: {item.publicationName}</Typography>
          </Box>
        );
      case 10: return <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.facilityName}</Typography>;
      case 11:
      case 12: return <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.courseName}</Typography>;
      case 13: return <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.grantName}</Typography>;
      default: return null;
    }
  };

  const showCheckbox = statusFilter === "Pending at HOD" || statusFilter === "All";

  // Build DataTable rows for a faculty group
  const buildRows = (entries) =>
    entries.map((item, idx) => {
      const isPending = item.status === "Pending at HOD";
      const statusStyle = getStatusColor(item.status);
      const categoryName = getCategoryName(item.category);
      const durationText = renderDurationPeriod(item);

      return [
        // 0 – Checkbox or S.No (non-sortable)
        showCheckbox
          ? {
              value: selectedIds.includes(item._id) ? 1 : 0,
              display: (
                <Checkbox
                  checked={selectedIds.includes(item._id)}
                  onChange={() => handleSelectEntry(item._id)}
                  disabled={!isPending}
                  size="small"
                />
              ),
            }
          : {
              value: idx + 1,
              display: (
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-secondary)", textAlign: "center" }}>
                  {idx + 1}
                </Typography>
              ),
            },
        // 1 – Category
        { value: categoryName, display: categoryName },
        // 2 – Contribution Details (non-sortable)
        {
          value: categoryName,
          display: renderDynamicTextDetails(item),
        },
        // 3 – Duration / Period
        { value: durationText, display: durationText },
        // 4 – Proof (non-sortable)
        {
          value: item.proof ? 1 : 0,
          display: item.proof ? (
            <IconButton size="small" onClick={() => window.open(getFileLink(item.proof), "_blank")} sx={{ color: "var(--color-primary)" }}>
              <Description fontSize="small" />
            </IconButton>
          ) : null,
        },
        // 5 – Status
        {
          value: item.status,
          display: (
            <Chip
              label={item.status}
              size="small"
              sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, fontWeight: 700, borderRadius: "6px", fontSize: "0.7rem" }}
            />
          ),
        },
        // 6 – HOD Remarks (non-sortable)
        {
          value: item.hodComment ?? "",
          display: isPending ? (
            <TextField
              fullWidth size="small"
              placeholder="Add comments..."
              id={`remarks-${item._id}`}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "var(--bg-panel)", fontSize: "0.8rem" } }}
            />
          ) : (
            <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontStyle: "italic", fontSize: "0.8rem" }}>
              {item.hodComment || "-"}
            </Typography>
          ),
        },
        // 7 – Actions (non-sortable, only shown for pending view)
        ...(showCheckbox
          ? [{
              value: isPending ? 0 : 1,
              display: isPending ? (
                <Stack direction="row" spacing={1} justifyContent="center">
                  <IconButton
                    size="small" color="success"
                    onClick={() => {
                      const remVal = document.getElementById(`remarks-${item._id}`)?.value || "";
                      handleIndividualAction(item._id, "Approve", remVal);
                    }}
                  >
                    <CheckCircle fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small" color="error"
                    onClick={() => {
                      const remVal = document.getElementById(`remarks-${item._id}`)?.value || "";
                      handleIndividualAction(item._id, "Reject", remVal);
                    }}
                  >
                    <Cancel fontSize="small" />
                  </IconButton>
                </Stack>
              ) : (
                <Typography variant="caption" sx={{ color: "text.disabled", display: "block", textAlign: "center" }}>
                  Processed
                </Typography>
              ),
            }]
          : []),
      ];
    });

  const TABLE_COLUMNS = showCheckbox
    ? ["", "Category", "Contribution Details", "Duration / Period", "Proof", "Status", "HOD Remarks", "Actions"]
    : ["S.No", "Category", "Contribution Details", "Duration / Period", "Proof", "Status", "HOD Remarks"];
  // Non-sortable: checkbox/sno(0), Contribution Details(2), Proof(4), HOD Remarks(6), Actions(7)
  const NON_SORTABLE = showCheckbox ? [0, 2, 4, 6, 7] : [0, 2, 4, 6];

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader
        title="Contribution / Expertise Approvals"
        subtitle="Consolidated HOD review screen for awards, e-content, course completions, and certifications."
      />

      <Box sx={{ mt: 4 }}>
        <SectionHeader title="Tabular Review Screen" />

        {/* Global Toolbar & Filters */}
        <Box sx={{ p: 2.5, mb: 4, background: "var(--bg-panel)", borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "0 4px 24px rgba(0,0,0,0.02)" }}>
          <Grid container spacing={2} sx={{ alignItems: "center" }}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={handleStatusChange} sx={{ borderRadius: "12px", background: "var(--bg-glass)" }}>
                  <MenuItem value="All">All Processed &amp; Submitted</MenuItem>
                  <MenuItem value="Pending at HOD">Pending at HOD</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Academic Year</InputLabel>
                <Select value={selectedYear} label="Academic Year" onChange={handleYearChange} sx={{ borderRadius: "12px", background: "var(--bg-glass)" }}>
                  {academicYears.map(y => <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select value={categoryFilter} label="Category" onChange={handleCategoryChange} sx={{ borderRadius: "12px", background: "var(--bg-glass)" }}>
                  <MenuItem value="All">All Categories</MenuItem>
                  {CONTRIBUTION_CATEGORIES.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth size="small"
                placeholder="Search faculty name, emp ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "var(--bg-glass)" } }}
              />
            </Grid>
          </Grid>

          {/* Bulk Action Toolbar */}
          {selectedIds.length > 0 && (
            <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ color: "var(--color-primary)", fontWeight: 700, fontSize: "0.9rem" }}>
                Selected {selectedIds.length} entries for bulk processing:
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained" color="success"
                  onClick={() => handleBulkActionTrigger("Approve")}
                  sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}
                >
                  Approve Selected
                </Button>
                <Button
                  variant="outlined" color="error"
                  onClick={() => handleBulkActionTrigger("Reject")}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Reject Selected
                </Button>
              </Stack>
            </Box>
          )}
        </Box>

        {/* Faculty Group Cards with DataTable */}
        {loading ? (
          <Typography sx={{ textAlign: "center", py: 5 }}>Loading entries...</Typography>
        ) : groupedFacultyIds.length === 0 ? (
          <Typography sx={{ textAlign: "center", py: 5, color: "var(--text-secondary)" }}>
            No submitted entries found matching criteria.
          </Typography>
        ) : (
          groupedFacultyIds.map(facId => {
            const group = groupedData[facId];
            const fac = group.faculty;
            const entries = group.entries;

            const pendingEntries = entries.filter(e => e.status === "Pending at HOD");
            const allChecked = pendingEntries.length > 0 && pendingEntries.every(e => selectedIds.includes(e._id));
            const someChecked = pendingEntries.some(e => selectedIds.includes(e._id)) && !allChecked;

            return (
              <Card key={facId} sx={{ mb: 4.5, borderRadius: "20px", border: "1px solid var(--border-color)", background: "var(--bg-glass)", backdropFilter: "blur(10px)", boxShadow: "var(--shadow-premium)", overflow: "hidden" }}>
                {/* Group Header */}
                <Box sx={{ p: 2.5, bgcolor: "var(--bg-panel)", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Person sx={{ color: "var(--color-primary)", fontSize: "1.6rem" }} />
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "1.05rem" }}>{fac?.name}</Typography>
                      <Typography sx={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600 }}>
                        Emp ID: {fac?.institutionId} | Department: {fac?.coreDepartment?.name || fac?.department?.name}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Chip label={`Academic Year: ${group.academicYear}`} size="small" sx={{ bgcolor: "rgba(190, 147, 55, 0.1)", color: "var(--color-primary)", fontWeight: 800 }} />
                    {showCheckbox && (
                      <>
                        <Checkbox
                          checked={allChecked}
                          indeterminate={someChecked}
                          disabled={pendingEntries.length === 0}
                          onChange={(e) => handleSelectAllForFaculty(entries, e.target.checked)}
                          sx={{ color: "var(--color-primary)" }}
                        />
                        <Typography variant="caption" sx={{ color: pendingEntries.length === 0 ? "text.disabled" : "var(--text-secondary)", fontWeight: 700 }}>
                          Select All
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>

                {/* DataTable */}
                <Box sx={{ p: 2 }}>
                  <DataTable
                    columns={TABLE_COLUMNS}
                    rows={buildRows(entries)}
                    nonSortableColumns={NON_SORTABLE}
                    defaultRowsPerPage={10}
                  />
                </Box>
              </Card>
            );
          })
        )}
      </Box>

      {/* Bulk Remarks Dialog */}
      <Dialog open={openBulkRemarksDialog} onClose={() => setOpenBulkRemarksDialog(false)} PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Bulk {bulkActionType} Decisions</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: "var(--text-secondary)" }}>
            Provide comments for processing the selected {selectedIds.length} contribution entries:
            {bulkActionType === "Reject" && <strong style={{ color: "#ef4444" }}> (Remarks are mandatory for rejection)</strong>}
          </Typography>
          <TextField
            fullWidth multiline rows={3} placeholder="Type comments here..."
            value={bulkRemarks} onChange={e => setBulkRemarks(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "var(--bg-panel)" } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenBulkRemarksDialog(false)} sx={{ textTransform: "none", fontWeight: 700 }}>Cancel</Button>
          <Button
            variant="contained"
            color={bulkActionType === "Approve" ? "success" : "error"}
            disabled={actionLoading}
            onClick={handleBulkActionSubmit}
            sx={{ textTransform: "none", fontWeight: 800, bgcolor: bulkActionType === "Approve" ? "#10b981" : "#ef4444" }}
          >
            {bulkActionType === "Approve" ? "Bulk Approve" : "Bulk Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Individual Rejection Dialog */}
      <Dialog open={openIndividualRemarksDialog} onClose={() => setOpenIndividualRemarksDialog(false)} PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#ef4444" }}>Rejection Comments Mandatory</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: "var(--text-secondary)" }}>
            Please enter comments detailing the reason for rejecting this faculty contribution:
          </Typography>
          <TextField
            fullWidth multiline rows={3} placeholder="Type comments here..."
            value={individualRemarks} onChange={e => setIndividualRemarks(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "var(--bg-panel)" } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenIndividualRemarksDialog(false)} sx={{ textTransform: "none", fontWeight: 700 }}>Cancel</Button>
          <Button
            variant="contained" color="error"
            disabled={actionLoading || !individualRemarks}
            onClick={() => handleIndividualAction(individualRejectId, "Reject", individualRemarks)}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            Reject Entry
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}