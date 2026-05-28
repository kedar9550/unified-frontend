import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

import { Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Grid, Card, Chip, Divider } from "@mui/material";
import { toast } from "sonner";
import { Close, Description, Download, AttachFile, Groups, AccountBalanceWallet } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn,
  labelStyle
} from "../../components/faculty/PublicationFormFields";
import API from "../../api/axios";

export default function FundedProject() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("list"); // 'list', 'select-year', 'form'
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [publicationsList, setPublicationsList] = useState([]);
  const [selectedPubDetails, setSelectedPubDetails] = useState(null);

  const [form, setForm] = useState({
    title: "", duration: "", fundingAgency: "", scheme: "",
    principalInvestigator: "", recurring: "", nonRecurring: "",
    sanctionedAmount: "", sanctionDate: "",
    applyingSeedGrant: "",
    totalInvestigators: 1, otherInvestigatorsList: []
  });
  const [files, setFiles] = useState({ sanctionOrder: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/api/research/funded-project").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => console.log("Failed to fetch funded projects", err));

    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => console.log("Failed to fetch academic years", err));
  }, [viewMode]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setFile = (k) => (e) => setFiles((p) => ({ ...p, [k]: e.target.files[0] }));

  const handleNumericChange = (key, allowDecimal = true) => (e) => {
    const val = e.target.value;
    const regex = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/;
    if (regex.test(val)) {
      setForm(p => ({ ...p, [key]: val }));
    }
  };

  // Handle dynamic investigator generation based on total count
  useEffect(() => {
    let total = parseInt(form.totalInvestigators);
    if (isNaN(total) || total < 1) {
      total = 1;
      if (form.totalInvestigators !== "") {
        setForm(p => ({ ...p, totalInvestigators: 1 }));
      }
    }

    if (total === 1) {
      setForm(p => ({ ...p, otherInvestigatorsList: [] }));
      return;
    }

    let newOtherInvestigators = [];
    for (let i = 2; i <= total; i++) {
      // Keep existing data if available
      const existing = form.otherInvestigatorsList.find(a => a.investigatorPosition === i);
      newOtherInvestigators.push(existing || {
        investigatorPosition: i,
        affiliationType: "",
        empId: "",
        name: "",
        affiliation: ""
      });
    }
    setForm(p => ({ ...p, otherInvestigatorsList: newOtherInvestigators }));
  }, [form.totalInvestigators]);

  const fetchCoInvestigatorName = async (pos, empId) => {
    try {
      const res = await API.get(`/api/employees/staff/${empId}`);
      if (res.data && res.data.success) {
        const staff = res.data.data;
        const name = staff.employeename || staff.EmployeeName || "";

        setForm(prev => {
          const updated = prev.otherInvestigatorsList.map(a => {
            if (a.investigatorPosition === pos) {
              return { ...a, name: name, affiliation: "Aditya University" };
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
          if (value === "Aditya University") {
            newA.affiliation = "Aditya University";
            newA.name = ""; // clear name so it can be fetched
          } else {
            newA.affiliation = "";
            newA.empId = "";
            newA.name = "";
          }
        }
        return newA;
      }
      return a;
    });

    setForm(p => ({ ...p, otherInvestigatorsList: updated }));

    // Fetch name if Aditya University and Employee ID is entered (length >= 3)
    if (field === "empId" && value.length >= 3) {
      const investigator = updated.find(a => a.investigatorPosition === pos);
      if (investigator && investigator.affiliationType === "Aditya University") {
        fetchCoInvestigatorName(pos, value);
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.fundingAgency || !form.sanctionedAmount || !form.sanctionDate || !form.applyingSeedGrant) {
      toast.error("Please fill all required fields");
      return;
    }

    // Numeric and Future Date Validations
    if (form.duration) {
      const numDuration = Number(form.duration);
      if (isNaN(numDuration) || numDuration <= 0) {
        toast.error("Duration of Project in Years must be a positive numeric value");
        return;
      }
    }
    if (form.recurring) {
      const numRecurring = Number(form.recurring);
      if (isNaN(numRecurring) || numRecurring < 0) {
        toast.error("Recurring amount must be a positive numeric value");
        return;
      }
    }
    if (form.nonRecurring) {
      const numNonRecurring = Number(form.nonRecurring);
      if (isNaN(numNonRecurring) || numNonRecurring < 0) {
        toast.error("Non-Recurring amount must be a positive numeric value");
        return;
      }
    }
    const numSanctioned = Number(form.sanctionedAmount);
    if (isNaN(numSanctioned) || numSanctioned <= 0) {
      toast.error("Sanctioned Amount must be a positive numeric value");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selDate = new Date(form.sanctionDate);
    selDate.setHours(0, 0, 0, 0);
    if (selDate > today) {
      toast.error("Sanction Date cannot be in the future");
      return;
    }

    // Validate co-investigators dynamically
    const total = parseInt(form.totalInvestigators) || 1;
    if (total < 1) {
      toast.error("Total number of investigators must be at least 1");
      return;
    }
    if (total > 1) {
      for (const a of form.otherInvestigatorsList) {
        if (!a.affiliationType || (a.affiliationType === 'Others' && (!a.name || !a.affiliation)) || (a.affiliationType === 'Aditya University' && (!a.empId || !a.name))) {
          toast.error(`Please complete details for Investigator Position ${a.investigatorPosition}`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const fd = new FormData();

      // Construct otherInvestigators comma-separated string
      const otherNames = form.otherInvestigatorsList
        .map(a => a.name)
        .filter(Boolean)
        .join(", ");

      fd.append("title", form.title);
      fd.append("duration", form.duration);
      fd.append("fundingAgency", form.fundingAgency);
      fd.append("scheme", form.scheme || "");
      fd.append("principalInvestigator", form.principalInvestigator);
      fd.append("recurring", form.recurring || "");
      fd.append("nonRecurring", form.nonRecurring || "");
      fd.append("sanctionedAmount", form.sanctionedAmount);
      fd.append("sanctionDate", form.sanctionDate);
      fd.append("applyingSeedGrant", form.applyingSeedGrant);
      fd.append("otherInvestigators", otherNames);
      fd.append("totalInvestigators", String(total));

      if (files.sanctionOrder) fd.append("sanctionOrder", files.sanctionOrder);
      fd.append("academicYear", selectedYear);
      fd.append("college", user?.college || "");
      fd.append("panNumber", user?.panNumber || "");

      await API.post("/api/research/funded-project", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Funded Project submitted successfully!");
      setForm({
        title: "", duration: "", fundingAgency: "", scheme: "",
        principalInvestigator: "", recurring: "", nonRecurring: "",
        sanctionedAmount: "", sanctionDate: "", applyingSeedGrant: "",
        totalInvestigators: 1, otherInvestigatorsList: []
      });
      setFiles({ sanctionOrder: null });
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
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>My Funded Projects</Typography>
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
            No Previous Funded Projects
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
            You haven't submitted any funded project details yet. Click the "Apply New" button to submit your first entry.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflow: "hidden" }}>
          <Table>
            <TableHead sx={{ background: "var(--gradient-primary)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Funding Agency</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Sanction Date</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Applicant</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Academic Year</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {publicationsList.map((pub, i) => (
                <TableRow key={pub._id || i}>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>{pub.title || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.fundingAgency || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>
                    {pub.sanctionDate ? new Date(pub.sanctionDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "N/A"}
                  </TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.facultyId?.name || "N/A"}</TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: pub.visibilityRole === "Applicant" ? "var(--color-primary)" : "text.secondary" }}>
                      {pub.visibilityRole || "Applicant"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.academicYear?.year || "N/A"}</TableCell>
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
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setSelectedPubDetails(pub)}
                      sx={{
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: 700,
                        borderColor: "var(--color-primary)",
                        color: "var(--color-primary)",
                        "&:hover": {
                          background: "var(--bg-accent-1)",
                          borderColor: "var(--color-primary)"
                        }
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );

  const renderSelectYear = () => (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 5 }}>
      <FormCard title="Select Academic Year">
        <Typography sx={{ mb: 2, color: "var(--text-secondary)", fontWeight: 500 }}>Please select the academic year for this project submission:</Typography>
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
    <FormCard title="Funded Projects Submission">
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 0.8, borderRadius: "8px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
        <Button size="small" variant="text" onClick={() => setViewMode("select-year")} sx={{ fontWeight: 700, textTransform: "none", color: "var(--color-primary)" }}>Change Year</Button>
      </Box>

      <FacultyInfoRow />

      <SubLabel text="Details of the Funded Projects:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Title of the Project :</Typography>
          <TextField size="small" fullWidth value={form.title} onChange={set("title")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Duration of Project in Years :</Typography>
          <TextField size="small" fullWidth value={form.duration} onChange={handleNumericChange("duration")} placeholder="e.g. 2 or 1.5 or 0.5" />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Funding Agency :</Typography>
          <TextField size="small" fullWidth value={form.fundingAgency} onChange={set("fundingAgency")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Scheme :</Typography>
          <TextField size="small" fullWidth value={form.scheme} onChange={set("scheme")} />
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
        {parseInt(form.totalInvestigators) > 1 && (
          <Box sx={{ gridColumn: { sm: "1 / -1" }, mt: 2, background: "var(--bg-panel)", p: 2, borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <Typography sx={{ ...labelStyle, mb: 1, fontWeight: 700 }}>Name & affiliation of Co-Investigator(s) :</Typography>
            {form.otherInvestigatorsList.map((ca) => (
              <Box key={ca.investigatorPosition} sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2, p: 2, borderRadius: "12px", border: "1px dashed var(--border-color)", background: "var(--bg-accent-1)" }}>
                <Box sx={{ display: "flex", gap: 2, flexWrap: { xs: "wrap", sm: "nowrap" }, alignItems: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", background: "var(--color-primary)", color: "#fff", borderRadius: "50%", fontWeight: 700, flexShrink: 0 }}>
                    {ca.investigatorPosition}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: "150px" }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION TYPE</Typography>
                    <Select
                      size="small"
                      fullWidth
                      value={ca.affiliationType}
                      onChange={(e) => handleCoInvestigatorChange(ca.investigatorPosition, "affiliationType", e.target.value)}
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
                          onChange={(e) => handleCoInvestigatorChange(ca.investigatorPosition, "empId", e.target.value)}
                          placeholder="e.g. 5741"
                        />
                      </Box>
                      <Box sx={{ flex: 2, minWidth: "200px" }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-INVESTIGATOR NAME</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={ca.name}
                          disabled
                          placeholder="Fetched from API"
                          sx={{ background: "rgba(0,0,0,0.02)" }}
                        />
                      </Box>
                    </>
                  ) : (
                    <>
                      <Box sx={{ flex: 1, minWidth: "180px" }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-INVESTIGATOR NAME</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={ca.name}
                          onChange={(e) => handleCoInvestigatorChange(ca.investigatorPosition, "name", e.target.value)}
                          placeholder="Full Name"
                        />
                      </Box>
                      <Box sx={{ flex: 2, minWidth: "200px" }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={ca.affiliation}
                          onChange={(e) => handleCoInvestigatorChange(ca.investigatorPosition, "affiliation", e.target.value)}
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
        <Box>
          <Typography sx={labelStyle}>Are You The Principal Investigator:</Typography>
          <Select size="small" fullWidth displayEmpty value={form.principalInvestigator} onChange={set("principalInvestigator")}>
            <MenuItem value="">--Select--</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Recurring :</Typography>
          <TextField size="small" fullWidth value={form.recurring} onChange={handleNumericChange("recurring")} placeholder="Amount" />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Non-Recurring :</Typography>
          <TextField size="small" fullWidth value={form.nonRecurring} onChange={handleNumericChange("nonRecurring")} placeholder="Amount" />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Sanctioned Amount :</Typography>
          <TextField size="small" fullWidth value={form.sanctionedAmount} onChange={handleNumericChange("sanctionedAmount")} placeholder="Amount" />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Date of Sanction :</Typography>
          <TextField size="small" fullWidth type="date" value={form.sanctionDate} onChange={set("sanctionDate")} InputLabelProps={{ shrink: true }} inputProps={{ max: new Date().toISOString().split("T")[0] }} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Applying as a Seed Grant Work? *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyingSeedGrant} onChange={set("applyingSeedGrant")}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
      </Grid2>

      <NoteBox />

      <Box sx={{ mt: 1, maxWidth: 350 }}>
        <FileField label="Sanction Order:" name="sanctionOrder" onChange={setFile("sanctionOrder")} />
      </Box>

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

  const renderDetailFile = (title, filepath, folder = "funded-projects") => {
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

    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch (e) {
        return dateStr;
      }
    };

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
            <AccountBalanceWallet sx={{ color: "#fff" }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Funded Project Details</Typography>
          </Box>
          <IconButton onClick={handleCloseDetails} sx={{ color: "#fff" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 1 }}>{data.title}</Typography>
          <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 3, fontWeight: 600 }}>Funding Agency: {data.fundingAgency}</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Academic Year" value={data.academicYear?.year || "N/A"} /></Grid>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Duration (Years)" value={data.duration} /></Grid>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Role" value={data.visibilityRole || "Applicant"} /></Grid>
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

            <Grid item xs={12} sm={3}><LabelValueDetails label="Scheme" value={data.scheme || "-"} /></Grid>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Sanctioned Amount" value={`₹${data.sanctionedAmount}`} /></Grid>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Date of Sanction" value={formatDate(data.sanctionDate)} /></Grid>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Is PI?" value={data.principalInvestigator || "No"} /></Grid>

            <Grid item xs={12} sm={4}><LabelValueDetails label="Recurring Amount" value={data.recurring ? `₹${data.recurring}` : "-"} /></Grid>
            <Grid item xs={12} sm={4}><LabelValueDetails label="Non-Recurring Amount" value={data.nonRecurring ? `₹${data.nonRecurring}` : "-"} /></Grid>
            <Grid item xs={12} sm={4}><LabelValueDetails label="Applying Seed Grant?" value={data.applyingSeedGrant === "Yes" ? "Yes" : "No"} /></Grid>

            <Grid item xs={12} sm={12}><LabelValueDetails label="Other Investigators" value={data.otherInvestigators || "None"} /></Grid>

            {data.status === "Approved" && data.approvedAmount && (
              <Grid item xs={12} sm={6}>
                <LabelValueDetails 
                  label="Approved Incentive" 
                  value={`₹${data.approvedAmount}`} 
                  chip={<Chip label={`₹${data.approvedAmount}`} size="small" sx={{ bgcolor: "rgba(76, 175, 80, 0.1)", color: "#4caf50", fontWeight: 800 }} />}
                />
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Attached Files previews */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 2 }}>
              <AttachFile sx={{ color: "var(--color-primary)" }} />
              <Typography sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Attached Documents</Typography>
            </Box>
            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
              {renderDetailFile("Sanction Order", data.sanctionOrder)}
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
    <>
      <PageHeader title="Funded Projects" subtitle="Manage and submit your funded project details" breadcrumbs={["Home", "Publications", "Funded Project"]} />

      {viewMode === "list" && renderList()}
      {viewMode === "select-year" && renderSelectYear()}
      {viewMode === "form" && renderForm()}
      {renderDetailsDialog()}
    </>
  );
}
