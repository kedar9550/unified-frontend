import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

import { Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Grid, Card, Chip, Divider, FormControl, Tooltip, TablePagination } from "@mui/material";
import { toast } from "sonner";
import { Close, Description, Download, AttachFile, Groups, AssignmentInd, Visibility } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import {
  labelStyle, disabledField, MONTHS, YEARS
} from "../../components/faculty/publicationConstants";import API from "../../api/axios";

export default function ConsultancyPublication() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("list"); // 'list', 'select-year', 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [publicationsList, setPublicationsList] = useState([]);
  const [selectedPubDetails, setSelectedPubDetails] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [form, setForm] = useState({
    title: "", organization: "", amount: "", duration: "", month: "", year: "",
    applyingSeedGrant: "",
    investigatorType: "",
    principalInvestigator: "",
    coPrincipalInvestigator: "",
    applyIncentive: "No",
    projectStatus: "Sanctioned",
    totalInvestigators: 1,
    otherInvestigatorsList: []
  });
  const [loading, setLoading] = useState(false);

  // Generate dynamic investigator fields
  useEffect(() => {
    let total = parseInt(form.totalInvestigators);
    if (isNaN(total) || total < 1) {
      total = 1;
      if (form.totalInvestigators !== "") {
        setForm(p => ({ ...p, totalInvestigators: 1 }));
      }
    }

    const type = form.investigatorType;
    if (!type || total <= 1) {
      setForm(p => ({ ...p, otherInvestigatorsList: [] }));
      return;
    }

    let newOtherInvestigators = [];
    if (type === "Principal Investigator (PI)") {
      // Applicant is PI. Generate N-1 rows, all as Co-Investigators.
      for (let i = 1; i <= total - 1; i++) {
        const existing = form.otherInvestigatorsList[i - 1];
        newOtherInvestigators.push(existing || {
          investigatorPosition: i + 1,
          role: "Co-Investigator",
          affiliationType: "",
          empId: "",
          name: "",
          affiliation: "",
          department: "",
          designation: ""
        });
      }
    } else if (type === "Co-Principal Investigator (Co-PI)") {
      // Applicant is Co-PI. Generate N-1 rows: 1 PI + N-2 Co-Investigators.
      for (let i = 1; i <= total - 1; i++) {
        const expectedRole = i === 1 ? "Principal Investigator" : "Co-Investigator";
        const existing = form.otherInvestigatorsList[i - 1];
        if (existing) {
          newOtherInvestigators.push({
            ...existing,
            investigatorPosition: i + 1,
            role: expectedRole
          });
        } else {
          newOtherInvestigators.push({
            investigatorPosition: i + 1,
            role: expectedRole,
            affiliationType: "",
            empId: "",
            name: "",
            affiliation: "",
            department: "",
            designation: ""
          });
        }
      }
    }
    setForm(p => ({ ...p, otherInvestigatorsList: newOtherInvestigators }));
  }, [form.totalInvestigators, form.investigatorType]);

  const fetchCoInvestigatorName = async (pos, empId) => {
    try {
      const res = await API.get(`/api/employees/staff/${empId}`);
      if (res.data && res.data.success) {
        const staff = res.data.data;
        const name = staff.employeename || staff.EmployeeName || "";
        const dept = staff.departmentname || staff.DepartmentName || "";
        const desig = staff.designation || staff.Designation || "";

        setForm(prev => {
          const updated = prev.otherInvestigatorsList.map(a => {
            if (a.investigatorPosition === pos) {
              return { 
                ...a, 
                name: name, 
                affiliation: "Aditya University",
                department: dept,
                designation: desig
              };
            }
            return a;
          });
          return { ...prev, otherInvestigatorsList: updated };
        });
      }
    } catch (err) {
      console.error("Failed to fetch staff data", err);
    }
  };

  const handleCoInvestigatorChange = (pos, field, value) => {
    const updated = form.otherInvestigatorsList.map(a => {
      if (a.investigatorPosition === pos) {
        const newA = { ...a, [field]: value };
        if (field === "affiliationType") {
          if (value === "AUS") {
            newA.affiliation = "Aditya University";
            newA.name = ""; // clear name so it can be fetched
            newA.department = "";
            newA.designation = "";
            newA.empId = "";
          } else {
            newA.affiliation = "";
            newA.empId = "";
            newA.name = "";
            newA.department = "";
            newA.designation = "";
          }
        }
        return newA;
      }
      return a;
    });

    setForm(p => ({ ...p, otherInvestigatorsList: updated }));

    // Fetch name if AUS and Employee ID is entered (length >= 3)
    if (field === "empId" && value.length >= 3) {
      const investigator = updated.find(a => a.investigatorPosition === pos);
      if (investigator && investigator.affiliationType === "AUS") {
        fetchCoInvestigatorName(pos, value);
      }
    }
  };

  useEffect(() => {
    API.get("/api/research/consultancy").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => console.log("Failed to fetch consultancies", err));

    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => console.log("Failed to fetch academic years", err));
  }, [viewMode]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleNumericChange = (key, allowDecimal = true) => (e) => {
    const val = e.target.value;
    const regex = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/;
    if (regex.test(val)) {
      setForm(p => ({ ...p, [key]: val }));
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.organization || !form.applyingSeedGrant || !form.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    // Numeric Validations
    const numAmount = Number(form.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Consultancy Amount must be a positive numeric value");
      return;
    }

    if (form.duration) {
      const numDuration = Number(form.duration);
      if (isNaN(numDuration) || numDuration <= 0) {
        toast.error("Duration of Consultancy Work must be a positive numeric value");
        return;
      }
    }

    // Future date validations
    if (form.year && form.month) {
      const selectedYear = parseInt(form.year);
      const currentYear = new Date().getFullYear();
      const currentMonthIndex = new Date().getMonth(); // 0 to 11
      const monthIdx = MONTHS.indexOf(form.month);
      if (selectedYear > currentYear || (selectedYear === currentYear && monthIdx > currentMonthIndex)) {
        toast.error("Commencement date cannot be in the future");
        return;
      }
    }

    const total = parseInt(form.totalInvestigators) || 1;
    if (total < 1) {
      toast.error("Total number of investigators must be at least 1");
      return;
    }
    if (!form.investigatorType) {
      toast.error("Please select Investigator Type");
      return;
    }
    if (form.investigatorType === "Co-Principal Investigator (Co-PI)" && total < 2) {
      toast.error("Total number of investigators must be at least 2 when you are Co-PI");
      return;
    }

    if (total > 1) {
      for (let i = 0; i < form.otherInvestigatorsList.length; i++) {
        const a = form.otherInvestigatorsList[i];
        if (!a.affiliationType) {
          toast.error(`Please select affiliation type for Investigator row ${i + 1}`);
          return;
        }
        if (a.affiliationType === 'Others' && (!a.name || !a.affiliation)) {
          toast.error(`Please complete Name and Affiliation for Investigator row ${i + 1}`);
          return;
        }
        if (a.affiliationType === 'AUS' && (!a.empId || !a.name)) {
          toast.error(`Please complete Employee ID for Investigator row ${i + 1}`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const coInvestigatorsList = form.otherInvestigatorsList.map(a => ({
        role: a.role,
        affiliationType: a.affiliationType,
        employeeId: a.affiliationType === "AUS" ? a.empId : null,
        name: a.name || "",
        affiliation: a.affiliationType === "AUS" ? "Aditya University" : (a.affiliation || ""),
        department: a.department || "",
        designation: a.designation || "",
        // Backward compatibility flags
        principalInvestigator: a.role === "Principal Investigator" ? "Yes" : "No",
        coPrincipalInvestigator: a.role === "Co-Investigator" ? "Yes" : "No"
      }));

      const isPI = form.investigatorType === "Principal Investigator (PI)";
      const isCoPI = form.investigatorType === "Co-Principal Investigator (Co-PI)";

      const payload = {
        ...form,
        principalInvestigator: isPI ? "Yes" : "No",
        coPrincipalInvestigator: isCoPI ? "Yes" : "No",
        coInvestigators: coInvestigatorsList,
        academicYear: selectedYear,
        college: user?.college || "",
        panNumber: user?.panNumber || ""
      };

      await API.post("/api/research/consultancy", payload);
      toast.success("Consultancy submitted successfully!");
      setForm({
        title: "", organization: "", amount: "", duration: "", month: "", year: "", applyingSeedGrant: "",
        investigatorType: "", principalInvestigator: "", coPrincipalInvestigator: "", applyIncentive: "No", projectStatus: "Sanctioned",
        totalInvestigators: 1, otherInvestigatorsList: []
      });
      setSelectedYear("");
      setViewMode("list");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const renderList = () => (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>My Consultancy Work</Typography>
        <Button
 variant="contained"
 onClick={() => setViewMode("select-year")}
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
            No Previous Consultancy Submissions
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
            You haven't submitted any consultancy details yet. Click the "Apply New" button to submit your first entry.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflow: "hidden" }}>
          <Table>
            <TableHead sx={{ background: "var(--gradient-primary)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Organization</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Applicant</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Co-Investigators</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {publicationsList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((pub, i) => (
                <TableRow key={pub._id || i} sx={{ "&:hover": { background: "rgba(var(--color-primary-rgb, 99,102,241), 0.04)", transition: "background 0.2s" } }}>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>{pub.title || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.organization || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.amount || "N/A"}</TableCell>
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
                    {pub.coInvestigators && pub.coInvestigators.length > 0
                      ? <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {pub.coInvestigators.map(ca => ca.name).join(", ")}
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

  const renderSelectYear = () => (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 5 }}>
      <FormCard title="Select Academic Year">
        <Typography sx={{ mb: 2, color: "var(--text-secondary)", fontWeight: 500 }}>Please select the academic year for this consultancy submission:</Typography>
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
          <Button variant="outlined" onClick={() => setViewMode("list")} sx={{ textTransform: "none", fontWeight: 600 }}>Cancel</Button>
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

  const getAvailableMonths = () => {
    const selectedYearVal = parseInt(form.year);
    const currentYear = new Date().getFullYear();
    if (selectedYearVal === currentYear) {
      const currentMonthIndex = new Date().getMonth(); // 0 to 11
      return MONTHS.filter((_, idx) => idx <= currentMonthIndex);
    }
    return MONTHS;
  };

  const renderForm = () => {
    const hasPI = form.principalInvestigator === "Yes" || form.otherInvestigatorsList.some(d => d.principalInvestigator === "Yes");
    return (
      <FormCard title="Consultancy Submission">
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 0.8, borderRadius: "8px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
            Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
          </Typography>
          <Button size="small" variant="text" onClick={() => setViewMode("select-year")} sx={{ fontWeight: 700, textTransform: "none", color: "var(--color-primary)" }}>Change Year</Button>
        </Box>

        <FacultyInfoRow />

        <SubLabel text="Details of the Consultancy:" />
        <Grid2>
          <Box>
            <Typography sx={labelStyle}>Title of the Consultancy Work :</Typography>
            <TextField size="small" fullWidth value={form.title} onChange={set("title")} />
          </Box>
          <Box>
            <Typography sx={labelStyle}>Organization/client :</Typography>
            <TextField size="small" fullWidth value={form.organization} onChange={set("organization")} />
          </Box>
          <Box>
            <Typography sx={labelStyle}>Consultancy Amount :</Typography>
            <TextField size="small" fullWidth value={form.amount} onChange={handleNumericChange("amount")} placeholder="Amount" />
          </Box>
          <Box>
            <Typography sx={labelStyle}>Duration of Consultancy Work in Years :</Typography>
            <TextField size="small" fullWidth value={form.duration} onChange={handleNumericChange("duration")} placeholder="e.g. 1 or 1.5 or 0.5" />
          </Box>
          <Box>
            <Typography sx={labelStyle}>Total Number of Investigators : *</Typography>
            <TextField
              size="small"
              type="number"
              value={form.totalInvestigators}
              onChange={set("totalInvestigators")}
              inputProps={{ min: 1 }}
            />
          </Box>

        <Box>
          <Typography sx={labelStyle}>Investigator Type : *</Typography>
          <Select
            size="small"
            fullWidth
            displayEmpty
            value={form.investigatorType}
            onChange={(e) => setForm(p => ({ ...p, investigatorType: e.target.value }))}
          >
            <MenuItem value="" disabled>Select Investigator Type</MenuItem>
            <MenuItem value="Principal Investigator (PI)">Principal Investigator (PI)</MenuItem>
            <MenuItem value="Co-Principal Investigator (Co-PI)">Co-Principal Investigator (Co-PI)</MenuItem>
          </Select>
        </Box>
      </Grid2>

      {parseInt(form.totalInvestigators) > 1 && form.investigatorType && (
        <Box sx={{ mt: 2, mb: 3, background: "var(--bg-panel)", p: 2, borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <Typography sx={{ ...labelStyle, mb: 1.5, fontWeight: 700 }}>Name & affiliation of Investigator(s) :</Typography>
          {form.otherInvestigatorsList.map((ca, index) => {
            return (
              <Box key={index} sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2, p: 2.5, borderRadius: "12px", border: "1px dashed var(--border-color)", background: "var(--bg-accent-1)" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, borderBottom: "1px solid var(--border-color)", pb: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", background: "var(--color-primary)", color: "#fff", borderRadius: "50%", fontWeight: 700, fontSize: "0.8rem" }}>
                      {index + 1}
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>Investigator Details</Typography>
                  </Box>
                  <Chip label={ca.role} size="small" color={ca.role === "Principal Investigator" ? "primary" : "secondary"} sx={{ fontWeight: 700, borderRadius: "6px" }} />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION TYPE *</Typography>
                    <Select
                      size="small"
                      fullWidth
                      value={ca.affiliationType}
                      onChange={(e) => handleCoInvestigatorChange(ca.investigatorPosition, "affiliationType", e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="" disabled>Select Affiliation</MenuItem>
                      <MenuItem value="AUS">Aditya University</MenuItem>
                      <MenuItem value="Others">Others</MenuItem>
                    </Select>
                  </Grid>

                  {ca.affiliationType === "AUS" && (
                    <>
                      <Grid item xs={12} sm={4}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>EMPLOYEE ID *</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={ca.empId}
                          onChange={(e) => handleCoInvestigatorChange(ca.investigatorPosition, "empId", e.target.value)}
                          placeholder="e.g. 5741"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>NAME</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={ca.name}
                          disabled
                          placeholder="Auto-fetched"
                          sx={{ background: "rgba(0,0,0,0.02)" }}
                        />
                      </Grid>
                    </>
                  )}

                  {ca.affiliationType === "Others" && (
                    <>
                      <Grid item xs={12} sm={4}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>NAME *</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={ca.name}
                          onChange={(e) => handleCoInvestigatorChange(ca.investigatorPosition, "name", e.target.value)}
                          placeholder="Full Name"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION / ORG *</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={ca.affiliation}
                          onChange={(e) => handleCoInvestigatorChange(ca.investigatorPosition, "affiliation", e.target.value)}
                          placeholder="College / Organization"
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>
            );
          })}
        </Box>
      )}

      <SubLabel text="Date of Commencement of the Consultancy:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Year :</Typography>
          <Select size="small" fullWidth displayEmpty value={form.year} onChange={(e) => {
            setForm(p => ({ ...p, year: e.target.value, month: "" })); // clear month when year changes
          }}>
            <MenuItem value="">--Select Year--</MenuItem>
            {Array.from({ length: 2 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Month :</Typography>
          <Select size="small" fullWidth displayEmpty value={form.month} onChange={set("month")} disabled={!form.year}>
            <MenuItem value="">--Select Month--</MenuItem>
            {getAvailableMonths().map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
        </Box>
      </Grid2>

      <Grid2 sx={{ mt: 2 }}>
        <Box>
          <Typography sx={labelStyle}>Applying as a Seed Grant Work? *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyingSeedGrant} onChange={set("applyingSeedGrant")}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
        <Box></Box>
          <Box>
            <Typography sx={labelStyle}>Applying for Incentive? *</Typography>
            <Select size="small" fullWidth displayEmpty value={form.applyIncentive} onChange={set("applyIncentive")}>
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
          </Box>
          <Box>
            <Typography sx={labelStyle}>Project Status *</Typography>
            <Select size="small" fullWidth displayEmpty value={form.projectStatus} onChange={set("projectStatus")}>
              <MenuItem value="Shortlisted">Shortlisted</MenuItem>
              <MenuItem value="Sanctioned">Sanctioned</MenuItem>
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
  };

  const handleCloseDetails = () => setSelectedPubDetails(null);

  const LabelValueDetails = ({ label, value, chip, horizontal = false }) => (
    <Box sx={{
      p: horizontal ? "10px 16px" : 1.5,
      borderRadius: "10px",
      background: horizontal ? "transparent" : "rgba(255,255,255,0.02)",
      display: "flex",
      flexDirection: horizontal ? "row" : "column",
      alignItems: horizontal ? "center" : "flex-start",
      justifyContent: horizontal ? "flex-start" : "center",
      gap: horizontal ? 2 : 0.5,
      borderBottom: horizontal ? "1px solid var(--border-color)" : "1px solid transparent",
      "&:last-child": { borderBottom: "none" },
    }}>
      <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800, fontSize: "0.65rem", mb: horizontal ? 0 : 0.5 }}>{label}</Typography>
      <Box sx={{ flex: horizontal ? 1 : "none" }}>
        {chip ? chip : <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.85rem" }}>{value || "-"}</Typography>}
      </Box>
    </Box>
  );

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
        PaperProps={{
          sx: {
            borderRadius: "20px",
            background: "var(--bg-glass)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)",
          }
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--gradient-primary)", color: "#fff", py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <AssignmentInd sx={{ color: "#fff" }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Consultancy Details</Typography>
          </Box>
          <IconButton onClick={handleCloseDetails} sx={{ color: "#fff" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 1 }}>{data.title}</Typography>
          <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 3, fontWeight: 600 }}>Organization / Client: {data.organization}</Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Academic Year" value={data.academicYear?.year || "N/A"} /></Grid>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Amount" value={`₹${data.amount}`} /></Grid>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Duration (Years)" value={data.duration || "-"} /></Grid>
            <Grid item xs={12} sm={3}>
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
            </Grid>

            <Grid item xs={12} sm={4}><LabelValueDetails label="Commencement Month/Year" value={`${data.month || ""} ${data.year || ""}`} /></Grid>
            <Grid item xs={12} sm={4}><LabelValueDetails label="Applying Seed Grant?" value={data.applyingSeedGrant === "Yes" ? "Yes" : "No"} /></Grid>
            <Grid item xs={12} sm={4}><LabelValueDetails label="Applicant Faculty" value={data.facultyId?.name || "N/A"} /></Grid>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Role" value={data.visibilityRole || "Applicant"} /></Grid>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Is PI?" value={data.principalInvestigator || "Yes"} /></Grid>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Applying Incentive?" value={data.applyIncentive || "No"} /></Grid>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Project Status" value={data.projectStatus || "Sanctioned"} /></Grid>
            <Grid item xs={12} sm={6}>
              <LabelValueDetails
                label="Appraisal Claimant"
                chip={
                  (() => {
                    const isApplicant = data.visibilityRole === "Applicant";
                    const eligibleClaimants = [
                      { _id: data.facultyId?._id, name: data.facultyId?.name, institutionId: data.facultyId?.institutionId },
                      ...((data.coInvestigators || [])
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

                    if (isApplicant) {
                      return (
                        <FormControl size="small" fullWidth sx={{ mt: 0.5 }}>
                          <Select
                            value={data.appraisalClaimant?.institutionId || data.appraisalClaimant || ""}
                            onChange={async (e) => {
                              const selectedVal = e.target.value;
                              try {
                                const res = await API.post("/api/appraisal/resolve-claim", {
                                  researchId: data._id,
                                  researchType: "Consultancy",
                                  claimantId: selectedVal
                                });
                                if (res.data?.success) {
                                  toast.success("Claimant resolved successfully!");
                                  setPublicationsList(prev => prev.map(p => p._id === data._id ? { ...p, appraisalClaimant: selectedVal } : p));
                                  setSelectedPubDetails(prev => ({ ...prev, appraisalClaimant: selectedVal }));
                                }
                              } catch (err) {
                                toast.error(err.response?.data?.message || "Failed to resolve claim.");
                              }
                            }}
                            displayEmpty
                          >
                            <MenuItem value="" disabled>--Select Claimant--</MenuItem>
                            {uniqueClaimants.map(c => (
                              <MenuItem key={c.institutionId || c._id} value={c.institutionId || c._id}>
                                {c.name} {c.institutionId ? `(${c.institutionId})` : ""}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      );
                    } else {
                      const currentClaimantObj = uniqueClaimants.find(c =>
                        (c.institutionId && c.institutionId === (data.appraisalClaimant?.institutionId || data.appraisalClaimant || "").toString()) ||
                        (c._id && c._id.toString() === (data.appraisalClaimant?._id || data.appraisalClaimant || "").toString())
                      );
                      return (
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>
                          {currentClaimantObj ? `${currentClaimantObj.name} (${currentClaimantObj.institutionId})` : "Not Yet Designated"}
                        </Typography>
                      );
                    }
                  })()
                }
              />
            </Grid>

            {data.status === "Approved" && data.approvedAmount && (
              <Grid item xs={12} sm={6}>
                <LabelValueDetails
                  label="Approved Incentive"
                  value={`₹${data.approvedAmount}`}
                  chip={<Chip label={`₹${data.approvedAmount}`} size="small" sx={{ bgcolor: "rgba(76, 175, 80, 0.1)", color: "#4caf50", fontWeight: 800 }} />}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={12}>
              <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800, fontSize: "0.65rem", display: "block", mb: 1.5 }}>
                Investigators & Roles List
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, bgcolor: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{data.facultyId?.name} (Applicant)</Typography>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", display: "block" }}>
                      Aditya University {data.facultyId?.department?.name ? `| ${data.facultyId.department.name}` : ""} {data.facultyId?.designation ? `| ${data.facultyId.designation}` : ""}
                    </Typography>
                  </Box>
                  <Chip 
                    size="small" 
                    label={data.investigatorType || (data.principalInvestigator === "Yes" ? "Principal Investigator (PI)" : "Co-Principal Investigator (Co-PI)")} 
                    color="primary" 
                    sx={{ fontWeight: 700, borderRadius: "6px" }} 
                  />
                </Box>
                {(data.coInvestigators || []).map((co, idx) => {
                  const roleText = co.role || (co.principalInvestigator === "Yes" ? "Principal Investigator" : "Co-Investigator");
                  return (
                    <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, bgcolor: "rgba(255,255,255,0.01)", borderRadius: "12px", border: "1px dashed var(--border-color)" }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                          {co.name} {co.employeeId ? `(Staff Code: ${co.employeeId})` : ""}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "var(--text-secondary)", display: "block" }}>
                          {co.affiliation || "Aditya University"} {co.department ? `| ${co.department}` : ""} {co.designation ? `| ${co.designation}` : ""}
                        </Typography>
                      </Box>
                      <Chip 
                        size="small" 
                        label={roleText} 
                        color={roleText.includes("Principal") ? "primary" : "secondary"} 
                        variant="outlined"
                        sx={{ fontWeight: 700, borderRadius: "6px" }} 
                      />
                    </Box>
                  );
                })}
              </Stack>
            </Grid>
          </Grid>

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
    <>
      <PageHeader title="Consultancy Projects" subtitle="Manage and submit your consultancy projects" />

      {viewMode === "list" && renderList()}
      {viewMode === "select-year" && renderSelectYear()}
      {viewMode === "form" && renderForm()}
      {renderDetailsDialog()}
    </>
  );
}
