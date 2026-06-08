import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Grid, Card, Button, TextField, Chip, IconButton, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  FormControl, InputLabel, Select, MenuItem, Checkbox, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider
} from "@mui/material";
import {
  WorkspacePremium, Close, Description, Download, Person, CalendarToday, CheckCircle, Cancel
} from "@mui/icons-material";
import { toast } from "sonner";
import PageHeader from "../../components/common/PageHeader";
import SectionHeader from "../../components/common/SectionHeader";
import API from "../../api/axios";

export default function ResourceUtilizationApproval() {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true); // Default to true to prevent layout shift
  const [statusFilter, setStatusFilter] = useState("Pending at HOD");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActionType, setBulkActionType] = useState(null);
  const [openBulkRemarksDialog, setOpenBulkRemarksDialog] = useState(false);
  const [bulkRemarks, setBulkRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [individualRejectId, setIndividualRejectId] = useState(null);
  const [individualRemarks, setIndividualRemarks] = useState("");
  const [openIndividualRemarksDialog, setOpenIndividualRemarksDialog] = useState(false);

  // Wrapped in useCallback to prevent re-creation loops
  const fetchRequests = useCallback(async (yearId, status) => {
    if (!yearId) return;
    setLoading(true);
    try {
      const params = {
        status: status,
        academicYear: yearId
      };
      const res = await API.get("/api/value-addition/resource-utilization/pending-hod", { params });
      if (res.data?.success) {
        setData(res.data.data);
        setSelectedIds([]);
      }
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
      toast.error("Failed to load approvals.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Orchestrated single initialization effect
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
          // Directly fetch using the fresh ID instead of waiting for a re-render cycle
          await fetchRequests(defaultYearId, statusFilter);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch academic years", err);
        if (isMounted) setLoading(false);
      }
    };

    initializeDashboard();

    return () => {
      isMounted = false;
    };
  }, [fetchRequests]);

  // Handles subsequent standard user filter alterations cleanly
  const handleYearChange = (e) => {
    const nextYear = e.target.value;
    setSelectedYear(nextYear);
    fetchRequests(nextYear, statusFilter);
  };

  const handleStatusChange = (e) => {
    const nextStatus = e.target.value;
    setStatusFilter(nextStatus);
    fetchRequests(selectedYear, nextStatus);
  };

  // Group data by faculty
  const groupedData = data.reduce((groups, item) => {
    const facultyId = item.facultyId?._id;
    if (!facultyId) return groups;

    if (!groups[facultyId]) {
      groups[facultyId] = {
        faculty: item.facultyId,
        academicYear: item.academicYear?.year || "N/A",
        entries: []
      };
    }
    groups[facultyId].entries.push(item);
    return groups;
  }, {});

  // Apply search query to filtered grouped keys
  const groupedFacultyIds = Object.keys(groupedData).filter(facId => {
    const group = groupedData[facId];
    const facName = group.faculty?.name?.toLowerCase() || "";
    const empId = group.faculty?.institutionId?.toLowerCase() || "";
    const term = searchQuery.toLowerCase();

    return facName.includes(term) || empId.includes(term);
  });

  const handleSelectEntry = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllForFaculty = (entries, isChecked) => {
    const pendingIds = entries.filter(e => e.status === 'Pending at HOD').map(e => e._id);
    if (isChecked) {
      setSelectedIds(prev => [...new Set([...prev, ...pendingIds])]);
    } else {
      setSelectedIds(prev => prev.filter(i => !pendingIds.includes(i)));
    }
  };

  const handleIndividualAction = async (id, action, remarksText = "") => {
    if (action === 'Reject' && !remarksText) {
      setIndividualRejectId(id);
      setIndividualRemarks("");
      setOpenIndividualRemarksDialog(true);
      return;
    }

    setActionLoading(true);
    try {
      await API.put(`/api/value-addition/resource-utilization/hod-action/${id}`, {
        action,
        comment: remarksText
      });
      toast.success(`Request successfully ${action === 'Approve' ? 'Approved' : 'Rejected'}.`);
      setOpenIndividualRemarksDialog(false);
      fetchRequests(selectedYear, statusFilter);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkActionTrigger = (action) => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one entry using the checkboxes.");
      return;
    }
    setBulkActionType(action);
    setBulkRemarks("");
    setOpenBulkRemarksDialog(true);
  };

  const handleBulkActionSubmit = async () => {
    if (bulkActionType === 'Reject' && !bulkRemarks) {
      toast.error("Rejection remarks are mandatory.");
      return;
    }

    setActionLoading(true);
    try {
      await API.post("/api/value-addition/resource-utilization/hod-bulk-action", {
        ids: selectedIds,
        action: bulkActionType,
        comment: bulkRemarks
      });
      toast.success(`Successfully ${bulkActionType === 'Approve' ? 'approved' : 'rejected'} ${selectedIds.length} entries.`);
      setOpenBulkRemarksDialog(false);
      fetchRequests(selectedYear, statusFilter);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Bulk action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Approved') return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" };
    if (status === 'Rejected') return { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" };
    if (status === 'Pending at HOD') return { bg: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" };
    return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b" };
  };

  const getFileLink = (filepath) => {
    if (!filepath) return "#";
    const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
    return filepath.startsWith('http') ? filepath : `${backendURL}${filepath}`;
  };

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader
        title="Resource Utilization Approvals"
        subtitle="Consolidated tabular dashboard to review, search, and approve department faculty utilization activities."
      />

      <Box sx={{ mt: 4 }}>
        <SectionHeader title="Tabular Review Screen" />

        {/* Global Toolbar & Filters */}
        <Box sx={{
          p: 2.5, mb: 4, background: "var(--bg-panel)", borderRadius: "16px",
          border: "1px solid var(--border-color)", boxShadow: "0 4px 24px rgba(0,0,0,0.02)"
        }}>
          <Grid container spacing={2.5} sx={{ alignItems: "center" }}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusChange}
                  sx={{ borderRadius: "12px", background: "var(--bg-glass)" }}
                >
                  <MenuItem value="All">All Processed & Submitted</MenuItem>
                  <MenuItem value="Pending at HOD">Pending at HOD</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Academic Year"
                  onChange={handleYearChange}
                  sx={{ borderRadius: "12px", background: "var(--bg-glass)" }}
                >
                  {academicYears.map(y => (
                    <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by Faculty name or Employee ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "var(--bg-glass)" } }}
              />
            </Grid>
          </Grid>

          {/* Bulk actions triggers */}
          {selectedIds.length > 0 && (
            <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ color: "var(--color-primary)", fontWeight: 700, fontSize: "0.9rem" }}>
                Selected {selectedIds.length} entries for bulk processing:
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleBulkActionTrigger('Approve')}
                  sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700, bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}
                >
                  Approve Selected
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleBulkActionTrigger('Reject')}
                  sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700 }}
                >
                  Reject Selected
                </Button>
              </Stack>
            </Box>
          )}
        </Box>

        {/* Tabular Groups */}
        {loading ? (
          <Typography sx={{ textAlign: "center", py: 5 }}>Loading submissions...</Typography>
        ) : groupedFacultyIds.length === 0 ? (
          <Typography sx={{ textAlign: "center", py: 5, color: "var(--text-secondary)" }}>
            No submitted activities found matching the criteria.
          </Typography>
        ) : (
          groupedFacultyIds.map(facId => {
            const group = groupedData[facId];
            const fac = group.faculty;
            const entries = group.entries;

            const pendingEntries = entries.filter(e => e.status === 'Pending at HOD');
            const allChecked = pendingEntries.length > 0 && pendingEntries.every(e => selectedIds.includes(e._id));
            const someChecked = pendingEntries.some(e => selectedIds.includes(e._id)) && !allChecked;

            return (
              <Card key={facId} sx={{
                mb: 4.5, borderRadius: "20px", border: "1px solid var(--border-color)",
                background: "var(--bg-glass)", backdropFilter: "blur(10px)",
                boxShadow: "var(--shadow-premium)", overflow: "hidden"
              }}>
                <Box sx={{
                  p: 2.5, bgcolor: "var(--bg-panel)", borderBottom: "1px solid var(--border-color)",
                  display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "center", gap: 2
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Person sx={{ color: "var(--color-primary)", fontSize: "1.6rem" }} />
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "1.05rem" }}>
                        {fac?.name}
                      </Typography>
                      <Typography sx={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600 }}>
                        Emp ID: {fac?.institutionId} | Department: {fac?.coreDepartment?.name || fac?.department?.name}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Chip label={`Academic Year: ${group.academicYear}`} size="small" sx={{ bgcolor: "rgba(190, 147, 55, 0.1)", color: "var(--color-primary)", fontWeight: 800 }} />
                    <Checkbox
                      checked={allChecked}
                      indeterminate={someChecked}
                      disabled={pendingEntries.length === 0}
                      onChange={(e) => handleSelectAllForFaculty(entries, e.target.checked)}
                      sx={{ color: "var(--color-primary)" }}
                    />
                    <Typography variant="caption" sx={{ color: pendingEntries.length === 0 ? "text.disabled" : "var(--text-secondary)", fontWeight: 700 }}>Select All</Typography>
                  </Box>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "rgba(0,0,0,0.01)" }}>
                      <TableRow>
                        <TableCell sx={{ width: "40px" }}></TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", py: 1.5 }}>Event Category</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", py: 1.5 }}>Role / Type</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", py: 1.5 }}>Organization / Event Name</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", py: 1.5 }}>No. of Sessions / Days</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", py: 1.5 }}>Duration / Dates</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", py: 1.5 }}>Proof</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", py: 1.5 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", py: 1.5 }}>HOD Remarks</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", py: 1.5, textAlign: "center" }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {entries.map(act => {
                        const statusStyle = getStatusColor(act.status);
                        const isPending = act.status === 'Pending at HOD';

                        return (
                          <TableRow key={act._id} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.01)" } }}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.includes(act._id)}
                                onChange={() => handleSelectEntry(act._id)}
                                disabled={!isPending}
                              />
                            </TableCell>
                            <TableCell sx={{ color: "var(--text-primary)", fontWeight: 700 }}>{act.activityCategory}</TableCell>
                            <TableCell sx={{ color: "var(--text-secondary)" }}>{act.activityType}</TableCell>
                            <TableCell sx={{ color: "var(--text-secondary)", maxWidth: 220 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{act.organizationName}</Typography>
                              {act.activityCategory === "FDP" && act.activityType === "FDP Participant" && (
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography sx={{ fontSize: 10, color: "text.secondary", fontWeight: 700 }}>
                                    Category: <strong style={{ color: "var(--color-primary)" }}>{act.organizingInstitutionCategory}</strong>
                                  </Typography>
                                  {act.location && (
                                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>
                                      Location: {act.location}
                                    </Typography>
                                  )}
                                  {act.organizingInstitutionCategory === "MHRD R&D Lab" && act.labName && (
                                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>
                                      Lab: {act.labName}
                                    </Typography>
                                  )}
                                  {act.organizingInstitutionCategory === "Govt. University" && act.universityName && (
                                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>
                                      Univ: {act.universityName}
                                    </Typography>
                                  )}
                                  {act.organizingInstitutionCategory === "NIRF Ranked Institute (Below 200)" && act.instituteName && (
                                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>
                                      Inst: {act.instituteName} (Rank: {act.nirfRank})
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </TableCell>
                            <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                              {act.sessionsConducted !== undefined && act.sessionsConducted !== null
                                ? `${act.sessionsConducted} Sessions`
                                : act.daysParticipated !== undefined && act.daysParticipated !== null
                                  ? `${act.daysParticipated} Days`
                                  : "-"}
                            </TableCell>
                            <TableCell sx={{ color: "var(--text-secondary)" }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>{act.duration} Days</Typography>
                              <Typography sx={{ fontSize: 10, color: "text.secondary" }}>
                                {new Date(act.fromDate).toLocaleDateString("en-IN")} - {new Date(act.toDate).toLocaleDateString("en-IN")}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {act.proof && (
                                <IconButton
                                  size="small"
                                  onClick={() => window.open(getFileLink(act.proof), '_blank')}
                                  sx={{ color: "var(--color-primary)" }}
                                >
                                  <Description fontSize="small" />
                                </IconButton>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={act.status}
                                size="small"
                                sx={{
                                  bgcolor: statusStyle.bg, color: statusStyle.color,
                                  fontWeight: 700, borderRadius: "6px", fontSize: "0.7rem"
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ py: 1, minWidth: 150 }}>
                              {isPending ? (
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Add comments..."
                                  id={`remarks-${act._id}`}
                                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "var(--bg-panel)", fontSize: "0.8rem" } }}
                                />
                              ) : (
                                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontStyle: "italic", fontSize: "0.8rem" }}>
                                  {act.hodComment || "-"}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ py: 1 }}>
                              {isPending ? (
                                <Stack direction="row" spacing={1} sx={{ justifyContent: "center" }}>
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => {
                                      const remVal = document.getElementById(`remarks-${act._id}`)?.value || "";
                                      handleIndividualAction(act._id, 'Approve', remVal);
                                    }}
                                  >
                                    <CheckCircle fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      const remVal = document.getElementById(`remarks-${act._id}`)?.value || "";
                                      handleIndividualAction(act._id, 'Reject', remVal);
                                    }}
                                  >
                                    <Cancel fontSize="small" />
                                  </IconButton>
                                </Stack>
                              ) : (
                                <Typography variant="caption" sx={{ color: "text.disabled", display: "block", textAlign: "center" }}>
                                  Processed
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            );
          })
        )}
      </Box>

      {/* Bulk Action Dialog */}
      <Dialog
        open={openBulkRemarksDialog}
        onClose={() => setOpenBulkRemarksDialog(false)}
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Bulk {bulkActionType} Decisions
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: "var(--text-secondary)" }}>
            Provide comments for processing the selected {selectedIds.length} entries in bulk:
            {bulkActionType === 'Reject' && <strong style={{ color: "#ef4444" }}> (Remarks are mandatory for rejection)</strong>}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Type comments here..."
            value={bulkRemarks}
            onChange={e => setBulkRemarks(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "var(--bg-panel)" } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenBulkRemarksDialog(false)} sx={{ textTransform: "none", fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={bulkActionType === 'Approve' ? 'success' : 'error'}
            disabled={actionLoading}
            onClick={handleBulkActionSubmit}
            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 800, bgcolor: bulkActionType === 'Approve' ? "#10b981" : "#ef4444" }}
          >
            {bulkActionType === 'Approve' ? 'Bulk Approve' : 'Bulk Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Individual Action Dialog */}
      <Dialog
        open={openIndividualRemarksDialog}
        onClose={() => setOpenIndividualRemarksDialog(false)}
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#ef4444" }}>
            Rejection Comments Mandatory
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: "var(--text-secondary)" }}>
            Please enter your comments detailing the reason for rejecting this faculty utilization activity:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Type comments here..."
            value={individualRemarks}
            onChange={e => setIndividualRemarks(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "var(--bg-panel)" } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenIndividualRemarksDialog(false)} sx={{ textTransform: "none", fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={actionLoading || !individualRemarks}
            onClick={() => handleIndividualAction(individualRejectId, 'Reject', individualRemarks)}
            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 800 }}
          >
            Reject Entry
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}