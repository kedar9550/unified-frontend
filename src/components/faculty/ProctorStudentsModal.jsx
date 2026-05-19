import Loader from "../common/Loader";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Button,
} from "@mui/material";
import { Close, Group, FileDownload, Visibility } from "@mui/icons-material";
import DataTable from "../data/DataTable";
import API from "../../api/axios";

const ProctorStudentsModal = ({ open, onClose, proctorId }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && proctorId) {
      fetchProctorStudents();
    }
  }, [open, proctorId]);

  const fetchProctorStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      // Using the updated dept-proctor endpoint with proctorId filter
      const res = await API.get(`/api/dept-proctor?proctorId=${proctorId}`);
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch proctor students:", err);
      setError("Failed to load proctoring assignments.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // Basic CSV download logic
    if (students.length === 0) return;
    
    const headers = ["Student ID", "Student Name", "Department", "Sem/Year", "Start Academic Year"];
    const rows = students.map(s => [
      s.studentId, 
      s.studentName, 
      s.department, 
      s.currentYearName !== "—" ? s.currentYearName : `Sem ${s.currentSemester}`,
      s.fromAcademicYear
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `proctoring_students_${proctorId}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: "16px",
            background: "var(--bg-panel)",
            backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))",
            boxShadow: "var(--shadow-premium)",
            border: "1px solid var(--border-color)",
          }
        }
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #3B82F6, #2563EB)",
              color: "#fff",
            }}
          >
            <Group />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
              Proctoring Assignments
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500 }}>
              Students assigned to you for mentorship
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            startIcon={<FileDownload />}
            onClick={handleDownload}
            disabled={students.length === 0}
            sx={{
              textTransform: "none",
              borderRadius: "8px",
              fontWeight: 600,
              color: "var(--color-primary)",
            }}
          >
            Export
          </Button>
          <IconButton
            onClick={onClose}
            sx={{
              color: "var(--text-secondary)",
              "&:hover": { color: "var(--color-error)", background: "rgba(239, 68, 68, 0.1)" },
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <Loader size={40} thickness={4} sx={{ color: "var(--color-primary)" }} />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography sx={{ color: "var(--color-error)", fontWeight: 600 }}>{error}</Typography>
            <Button onClick={fetchProctorStudents} sx={{ mt: 2, textTransform: "none" }}>
              Try Again
            </Button>
          </Box>
        ) : students.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              background: "var(--bg-glass)",
              borderRadius: "12px",
              border: "1px dashed var(--border-color)",
            }}
          >
            <Group sx={{ fontSize: 48, color: "var(--text-secondary)", opacity: 0.3, mb: 2 }} />
            <Typography sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
              No students assigned for proctoring yet.
            </Typography>
          </Box>
        ) : (
          <DataTable
            columns={["ROLL NO", "STUDENT NAME", "DEPARTMENT", "SEM/YEAR", "ASSIGNED SINCE", "ACTIONS"]}
            rows={students.map((s) => [
              s.studentId,
              s.studentName,
              s.department,
              s.currentYearName !== "—" ? s.currentYearName : `Sem ${s.currentSemester}`,
              s.fromAcademicYear,
              {
                display: (
                  <IconButton
                    size="small"
                    sx={{
                      color: "var(--color-primary)",
                      "&:hover": { background: "var(--bg-accent-1)" },
                    }}
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                ),
                value: "View",
              },
            ])}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProctorStudentsModal;
