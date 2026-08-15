import Loader from "../../components/common/Loader";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  Typography,
  Button,
  FormControl,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Stack
} from "@mui/material";
import { RateReview, Visibility } from "@mui/icons-material";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";
import DataTable from "../../components/data/DataTable";
import PageHeader from "../../components/common/PageHeader";

const ManagementAppraisalEvaluation = () => {
  const navigate = useNavigate();
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Pending");

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/appraisal/pending-management");
      if (res.data && res.data.success) {
        setPendingList(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch pending management appraisals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleSelectAppraisal = (appr) => {
    navigate(`/appraisal/details/${appr._id}`);
  };

  const filteredList = pendingList.filter(appr => {
    const isPending = appr.status.startsWith("Submitted to ");
    const isApproved = appr.status.startsWith("Approved by ");
    const isRejected = appr.status.startsWith("Rejected by ");

    if (statusFilter === "Pending") return isPending;
    if (statusFilter === "Approved") return isApproved;
    if (statusFilter === "Rejected") return isRejected;
    return true; // "All"
  });

  const getStatusColor = (status) => {
    if (status.startsWith("Submitted to ")) return { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" };
    if (status.startsWith("Approved by ")) return { bg: "rgba(34, 197, 94, 0.12)", color: "#22c55e" };
    if (status.startsWith("Rejected by ")) return { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444" };
    return { bg: "rgba(100, 116, 139, 0.12)", color: "#64748b" };
  };

  return (
    <Box p={4} sx={{ maxWidth: 1200, margin: "0 auto", animation: "fadeIn 0.5s ease" }}>
      {loading && <Loader />}
      
      <Stack spacing={3} sx={{ width: "100%", mb: 3 }}>
        <PageHeader
          title="Management Verification Desk"
          subtitle="Review and evaluate faculty appraisals for approval"
        />
      </Stack>

      <Box>
        <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", p: 3 }}>
          <DataTable
            columns={["FACULTY NAME", "EMPLOYEE ID", "DEPARTMENT", "ACADEMIC YEAR", "STATUS", "ACTION"]}
            rows={filteredList.map((appr) => {
              const statusColor = getStatusColor(appr.status);
              const name = appr.facultyId?.name || "N/A";
              const empId = appr.facultyId?.institutionId || "N/A";
              const dept = appr.personalInfoSnapshot?.departmentName || "N/A";
              const year = appr.academicYearId?.year || "N/A";

              return [
                { value: name, display: <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.88rem" }}>{name}</Typography> },
                { value: empId, display: <Typography sx={{ fontWeight: 600 }}>{empId}</Typography> },
                { value: dept, display: dept },
                { value: year, display: <Typography sx={{ fontWeight: 600 }}>{year}</Typography> },
                {
                  value: appr.status,
                  display: (
                    <Chip
                      label={appr.status}
                      size="small"
                      sx={{
                        bgcolor: statusColor.bg,
                        color: statusColor.color,
                        fontWeight: 800,
                        borderRadius: "6px"
                      }}
                    />
                  )
                },
                {
                  value: "",
                  display: appr.status.startsWith("Submitted to ") ? (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<RateReview />}
                      onClick={() => handleSelectAppraisal(appr)}
                      color="primary"
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      Evaluate
                    </Button>
                  ) : (
                    <IconButton
                      onClick={() => handleSelectAppraisal(appr)}
                      color="secondary"
                      size="small"
                      title="View"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  )
                }
              ];
            })}
            alignments={["left", "center", "left", "center", "center", "center"]}
            nonSortableColumns={[5]}
            toolbarLeft={(
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, color: "var(--text-secondary)" }}>Status</Typography>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    borderRadius: "10px",
                    background: "var(--bg-paper)",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" }
                  }}
                >
                  <MenuItem value="Pending">Pending Evaluation</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                  <MenuItem value="All">All Requests</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Card>
      </Box>
    </Box>
  );
};

export default ManagementAppraisalEvaluation;
