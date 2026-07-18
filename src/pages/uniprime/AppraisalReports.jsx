import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  Select, 
  MenuItem, 
  InputLabel, 
  CircularProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { toast } from 'sonner';
import { Visibility, Assessment } from '@mui/icons-material';

const AppraisalReports = () => {
  const navigate = useNavigate();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [appraisals, setAppraisals] = useState([]);
  const [appraisalConfig, setAppraisalConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchAppraisalsAndConfig(selectedYear);
    }
  }, [selectedYear]);

  const fetchAcademicYears = async () => {
    try {
      const [resYears, resActive] = await Promise.all([
        axiosInstance.get('/api/academic-years'),
        axiosInstance.get('/api/appraisal/active-year')
      ]);
      
      const activeAppraisalYearId = resActive.data?.data;
      
      if (resYears.data && resYears.data.years) {
        const years = resYears.data.years;
        if (years.length > 0) {
          const mappedYears = years.map(y => ({
            ...y,
            isAppraisalActive: activeAppraisalYearId === y._id
          }));
          
          const sortedYears = [...mappedYears].sort((a, b) => {
            if (a.isAppraisalActive && !b.isAppraisalActive) return -1;
            if (!a.isAppraisalActive && b.isAppraisalActive) return 1;
            return b.year.localeCompare(a.year);
          });
          setAcademicYears(sortedYears);
          setSelectedYear(sortedYears[0]._id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch academic years", error);
      toast.error("Failed to fetch academic years");
    }
  };

  const fetchAppraisalsAndConfig = async (yearId) => {
    setLoading(true);
    try {
      const [resAppraisals, resConfig] = await Promise.all([
        axiosInstance.get(`/api/appraisal/all/${yearId}`),
        axiosInstance.get(`/api/appraisal/config/${yearId}`)
      ]);

      if (resConfig.data && resConfig.data.success) {
        setAppraisalConfig(resConfig.data.data);
      } else {
        setAppraisalConfig(null);
      }

      if (resAppraisals.data && resAppraisals.data.success) {
        // Filter out drafts or non-approved ones. User said: "need only the approved ones can show hear"
        const approvedOnly = resAppraisals.data.data.filter(app => ['Pending Research Admin', 'Completed'].includes(app.status));
        setAppraisals(approvedOnly);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Failed to fetch appraisals");
    } finally {
      setLoading(false);
    }
  };

  const getFacultyTypeInfo = (faculty) => {
    if (!faculty) return { type: 'N/A', minPoints: 0 };
    
    const desig = (faculty.designation || '').toLowerCase();
    const qual = (faculty.qualification || '').toLowerCase();
    
    // Determine Type
    let type = 'Non-Doctorate';
    let configKey = 'nonDoctorates';
    
    const leadershipKeywords = ['principal', 'dean', 'director', 'hod', 'head of department'];
    const isLeadership = leadershipKeywords.some(kw => desig.includes(kw));
    
    if (isLeadership) {
      type = 'Leadership Team';
      configKey = 'leadershipTeam';
    } else if (qual.includes('ph.d') || qual.includes('phd') || qual.includes('doctorate')) {
      type = 'Doctorate';
      configKey = 'doctorates';
    }
    
    // Get Min Points from Config
    let minPoints = 0;
    if (appraisalConfig && appraisalConfig.minimumPoints && appraisalConfig.minimumPoints[configKey]) {
      minPoints = appraisalConfig.minimumPoints[configKey].total || 0;
    }
    
    return { type, minPoints };
  };

  return (
    <Box sx={{ p: 4, maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 850, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
            <Assessment sx={{ fontSize: "2.5rem", color: "var(--color-primary)" }} />
            Appraisal Reports (Approved)
          </Typography>
          <Typography variant="subtitle1" sx={{ color: "var(--text-secondary)", mt: 0.5, fontWeight: 550 }}>
            View approved faculty performance appraisals
          </Typography>
        </Box>
        
        <FormControl sx={{ minWidth: 250, bgcolor: "var(--bg-paper)", borderRadius: "12px" }} size="small">
          <InputLabel id="academic-year-select-label" sx={{ fontWeight: 700 }}>Academic Year</InputLabel>
          <Select
            labelId="academic-year-select-label"
            id="academic-year-select"
            value={selectedYear}
            label="Academic Year"
            onChange={(e) => setSelectedYear(e.target.value)}
            sx={{ borderRadius: "12px", fontWeight: 700 }}
          >
            {academicYears.map((year) => (
              <MenuItem key={year._id} value={year._id} sx={{ fontWeight: year.isAppraisalActive ? 800 : 500 }}>
                {year.year} {year.isAppraisalActive ? ' (Active)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Data Table */}
      <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : appraisals.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <Assessment sx={{ fontSize: "4rem", color: "var(--text-secondary)", opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" sx={{ color: "var(--text-secondary)", fontWeight: 650 }}>
              No approved appraisals found
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--text-secondary)", mt: 0.5 }}>
              Try selecting a different academic year.
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead sx={{ background: "var(--gradient-primary)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Emp ID</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Faculty Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Type</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Min. Points</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Teaching</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Research</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Value Add</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Admin</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Interpersonal</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Total</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appraisals.map((row) => {
                const { type, minPoints } = getFacultyTypeInfo(row.facultyId);
                const grandTotal = row.grandTotalPoints || 0;
                const isMet = grandTotal >= minPoints;
                
                return (
                  <TableRow key={row._id} sx={{ "&:hover": { background: "var(--bg-accent-1)" }, transition: "background 0.15s", "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 700, color: "var(--color-primary)" }}>{row.facultyId?.institutionId || 'N/A'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{row.facultyId?.name || 'N/A'}</Typography>
                        <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 550 }}>{row.facultyId?.designation || 'N/A'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>{type}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{minPoints}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{row.teaching?.totalClaimed || 0}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{row.research?.totalClaimed || 0}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{row.valueAddition?.totalClaimed || 0}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{row.administrativeResponsibilities?.totalClaimed || 0}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{row.interpersonalSkills?.totalClaimed || 0}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: isMet ? "#10b981" : "error.main", bgcolor: isMet ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)" }}>
                      {grandTotal}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton 
                          onClick={() => navigate(`/uniprime/appraisal-reports/${row._id}`)} 
                          color="primary" 
                          size="small" 
                          sx={{ border: "1px solid rgba(79, 70, 229, 0.15)", bgcolor: "rgba(79, 70, 229, 0.05)" }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
};

export default AppraisalReports;