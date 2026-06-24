import { useState, useEffect } from "react";
import { Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Grid, Card, Chip, Divider, Tooltip, TablePagination, FormControl } from "@mui/material";
import { toast } from "sonner";
import { AddCircle, Delete, Close, Description, Download, AttachFile, Groups, WorkspacePremium, Visibility } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import NoActiveYearDialog from "../../components/common/NoActiveYearDialog";
import {
  FacultyInfoRow, FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import {
  labelStyle, disabledField, MONTHS, YEARS
} from "../../components/faculty/publicationConstants"; import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

const PATENT_STATUSES = ["Published", "Granted"];
const PATENT_APPLICANTS = ["Aditya University", "Aditya College of Pharmacy"];

export default function PatentPublication() {
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
    title: "", applicantName: "", patentName: "", area: "", filingNo: "", dateOfFiling: "",
    status: "", applyIncentive: "", applyingSeedGrant: "",
    patentFiledCountry: "", customCountryName: "",
    totalInventors: 1, otherInventors: []
  });
  const [files, setFiles] = useState({ eFilingReceipt: null, form1: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/api/research/patent").then(res => {
      setPublicationsList(res.data?.data || res.data || []);
    }).catch(err => console.log("Failed to fetch patents", err));

    API.get("/api/academic-years").then(res => {
      setAcademicYears(res.data?.years || res.data?.data || []);
    }).catch(err => console.log("Failed to fetch academic years", err));
  }, [viewMode]);

  useEffect(() => {
    if (user?.name) {
      setForm(prev => ({ ...prev, applicantName: user.name }));
    }
  }, [user]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setFile = (k) => (e) => setFiles((p) => ({ ...p, [k]: e.target.files[0] }));

  // Handle dynamic inventor generation based on total inventors
  useEffect(() => {
    let total = parseInt(form.totalInventors);
    if (isNaN(total) || total < 1) {
      total = 1;
      if (form.totalInventors !== "") {
        setForm(p => ({ ...p, totalInventors: 1 }));
      }
    }

    if (total === 1) {
      setForm(p => ({ ...p, otherInventors: [] }));
      return;
    }

    let newOtherInventors = [];
    for (let i = 2; i <= total; i++) {
      // Keep existing data if available
      const existing = form.otherInventors.find(a => a.inventorPosition === i);
      newOtherInventors.push(existing || {
        inventorPosition: i,
        affiliationType: "",
        empId: "",
        name: "",
        affiliation: ""
      });
    }
    setForm(p => ({ ...p, otherInventors: newOtherInventors }));
  }, [form.totalInventors]);

  const fetchCoInventorName = async (pos, empId) => {
    try {
      const res = await API.get(`/api/employees/staff/${empId}`);
      if (res.data && res.data.success) {
        const staff = res.data.data;
        const name = staff.employeename || staff.EmployeeName || "";

        setForm(prev => {
          const updated = prev.otherInventors.map(a => {
            if (a.inventorPosition === pos) {
              return { ...a, name: name, affiliation: "Aditya University" };
            }
            return a;
          });
          return { ...prev, otherInventors: updated };
        });
      }
    } catch (err) {
      console.error("Failed to fetch staff data", err);
    }
  };

  const handleCoInventorChange = (pos, field, value) => {
    const updated = form.otherInventors.map(a => {
      if (a.inventorPosition === pos) {
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

    setForm(p => ({ ...p, otherInventors: updated }));

    // Fetch name if Aditya University and Employee ID is entered (length >= 3)
    if (field === "empId" && value.length >= 3) {
      const inventor = updated.find(a => a.inventorPosition === pos);
      if (inventor && inventor.affiliationType === "Aditya University") {
        fetchCoInventorName(pos, value);
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.filingNo || !form.dateOfFiling) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!/^[A-Za-z0-9\/.-]+$/.test(form.filingNo)) {
      toast.error("Patent Filing No can only contain letters, numbers, '/', '.', and '-'");
      return;
    }
    if (!form.patentFiledCountry) {
      toast.error("Please select the Patent Filed Country");
      return;
    }
    if (form.patentFiledCountry === 'Others' && !form.customCountryName) {
      toast.error("Please enter the custom country name");
      return;
    }
    if (!form.patentName) {
      toast.error("Please select the Name of the Applicant in Patent");
      return;
    }
    if (!form.applyingSeedGrant) {
      toast.error("Please select whether applying as a Seed Grant Work");
      return;
    }

    // Future date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selDate = new Date(form.dateOfFiling);
    selDate.setHours(0, 0, 0, 0);
    if (selDate > today) {
      toast.error("Date of filing cannot be in the future");
      return;
    }

    // Validate co-inventors dynamically
    const total = parseInt(form.totalInventors) || 1;
    if (total < 1) {
      toast.error("Total number of inventors must be at least 1");
      return;
    }
    if (total > 1) {
      for (const a of form.otherInventors) {
        if (!a.affiliationType || (a.affiliationType === 'Others' && (!a.name || !a.affiliation)) || (a.affiliationType === 'Aditya University' && (!a.empId || !a.name))) {
          toast.error(`Please complete details for Inventor Position ${a.inventorPosition}`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const fd = new FormData();

      // Map otherInventors to coInventors array
      const coInventorsList = form.otherInventors.map(a => ({
        name: a.name || "",
        affiliation: a.affiliationType === "Aditya University" ? "Aditya University" : (a.affiliation || ""),
        employeeId: a.affiliationType === "Aditya University" ? a.empId : null
      })).filter(ca => ca.name && ca.affiliation);

      fd.append("title", form.title);
      fd.append("applicantName", form.applicantName || user?.name || "");
      fd.append("patentName", form.patentName);
      fd.append("area", form.area);
      fd.append("filingNo", form.filingNo);
      fd.append("dateOfFiling", form.dateOfFiling);
      fd.append("status", form.status);
      fd.append("patentFiledCountry", form.patentFiledCountry === 'Others' ? form.customCountryName : form.patentFiledCountry);
      fd.append("coInventors", JSON.stringify(coInventorsList));
      fd.append("applyIncentive", form.applyIncentive);
      fd.append("applyingSeedGrant", form.applyingSeedGrant);
      fd.append("totalInventors", String(total));

      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });
      fd.append("academicYear", selectedYear);
      fd.append("college", user?.college || "");
      fd.append("panNumber", user?.panNumber || "");

      await API.post("/api/research/patent", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Patent submitted successfully!");
      setForm({ title: "", applicantName: user?.name || "", patentName: "", area: "", filingNo: "", dateOfFiling: "", status: "", applyIncentive: "", applyingSeedGrant: "", patentFiledCountry: "", customCountryName: "", totalInventors: 1, otherInventors: [] });
      setFiles({ eFilingReceipt: null, form1: null });
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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>My Patent Publications</Typography>
        <Button
          variant="contained"
          onClick={() => {
            const activeYear = academicYears.find(y => y.isGlobalActive);
            if (activeYear) {
              setSelectedYear(activeYear._id);
              setViewMode("form");
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
            No Previous Patents
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
            You haven't submitted any patent details yet. Click the "Apply New" button to submit your first entry.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
          <Table>
            <TableHead sx={{ background: "var(--gradient-primary)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Area</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Filing No</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Applicant</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Co-Inventors</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {publicationsList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((pub, i) => (
                <TableRow key={pub._id || i} sx={{ "&:hover": { background: "rgba(var(--color-primary-rgb, 99,102,241), 0.04)", transition: "background 0.2s" } }}>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>{pub.title || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.area || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.filingNo || "N/A"}</TableCell>
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
                    {pub.coInventors && pub.coInventors.length > 0
                      ? <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {pub.coInventors.map(ca => ca.name).join(", ")}
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

  const renderForm = () => (
    <FormCard title="Patent Submission">
      <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
        <Typography variant="body2" sx={{ background: "var(--bg-accent-1)", color: "var(--color-primary)", px: 2, py: 0.8, borderRadius: "8px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
          Academic Year: {academicYears.find(y => y._id === selectedYear)?.year || "Selected"}
        </Typography>
      </Box>

      <FacultyInfoRow />

      <SubLabel text="Details of the Patent:" />
      <Grid2>
        <Box>
          <Typography sx={labelStyle}>Title of the Patent :</Typography>
          <TextField size="small" fullWidth multiline rows={2} value={form.title} onChange={set("title")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Name of the Applicant in Patent : *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.patentName} onChange={set("patentName")}>
            <MenuItem value="" disabled>--Select--</MenuItem>
            {PATENT_APPLICANTS.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Area of Patent :</Typography>
          <TextField size="small" fullWidth value={form.area} onChange={set("area")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Patent Filing No :</Typography>
          <TextField
            size="small"
            fullWidth
            value={form.filingNo}
            onChange={(e) => {
              const val = e.target.value;
              // Allow only letters, numbers, '/', '.', '-'
              if (val === "" || /^[A-Za-z0-9\/.-]+$/.test(val)) {
                setForm(p => ({ ...p, filingNo: val }));
              }
            }}
            placeholder="e.g. 202341012345"
            helperText="Allowed: letters, numbers, / . -"
            FormHelperTextProps={{ sx: { fontSize: "0.7rem", mt: 0.3 } }}
          />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Date of filing :</Typography>
          <TextField size="small" fullWidth type="date" value={form.dateOfFiling} onChange={set("dateOfFiling")} InputLabelProps={{ shrink: true }} inputProps={{ max: new Date().toISOString().split("T")[0] }} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Status of Patent Application :</Typography>
          <Select size="small" fullWidth displayEmpty value={form.status} onChange={set("status")}>
            <MenuItem value="">--Select--</MenuItem>
            {PATENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Patent Filed Country : *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.patentFiledCountry} onChange={set("patentFiledCountry")}>
            <MenuItem value="" disabled>--Select--</MenuItem>
            <MenuItem value="India">India</MenuItem>
            <MenuItem value="Others">Others</MenuItem>
          </Select>
        </Box>
        {form.patentFiledCountry === 'Others' && (
          <Box>
            <Typography sx={labelStyle}>Enter Country Name : *</Typography>
            <TextField size="small" fullWidth value={form.customCountryName} onChange={set("customCountryName")} placeholder="e.g., USA, UK" />
          </Box>
        )}
        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
          <Typography sx={labelStyle}>Total Number of Inventors : *</Typography>
          <TextField
            size="small"
            type="number"
            value={form.totalInventors}
            onChange={set("totalInventors")}
            inputProps={{ min: 1 }}
            sx={{ maxWidth: 250 }}
          />
        </Box>
        {parseInt(form.totalInventors) > 1 && (
          <Box sx={{ gridColumn: { sm: "1 / -1" }, mt: 2, background: "var(--bg-panel)", p: 2, borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <Typography sx={{ ...labelStyle, mb: 1, fontWeight: 700 }}>Name & affiliation of Co-Inventor(s) :</Typography>
            {form.otherInventors.map((ca) => (
              <Box key={ca.inventorPosition} sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2, p: 2, borderRadius: "12px", border: "1px dashed var(--border-color)", background: "var(--bg-accent-1)" }}>
                <Box sx={{ display: "flex", gap: 2, flexWrap: { xs: "wrap", sm: "nowrap" }, alignItems: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", background: "var(--color-primary)", color: "#fff", borderRadius: "50%", fontWeight: 700, flexShrink: 0 }}>
                    {ca.inventorPosition}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: "150px" }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION TYPE</Typography>
                    <Select
                      size="small"
                      fullWidth
                      value={ca.affiliationType}
                      onChange={(e) => handleCoInventorChange(ca.inventorPosition, "affiliationType", e.target.value)}
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
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d*$/.test(val)) handleCoInventorChange(ca.inventorPosition, "empId", val);
                          }}
                          placeholder="e.g. 5741"
                        />
                      </Box>
                      <Box sx={{ flex: 2, minWidth: "200px" }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-INVENTOR NAME</Typography>
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
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-INVENTOR NAME</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={ca.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!/\d/.test(val)) handleCoInventorChange(ca.inventorPosition, "name", val);
                          }}
                          placeholder="Full Name"
                        />
                      </Box>
                      <Box sx={{ flex: 2, minWidth: "200px" }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={ca.affiliation}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!/\d/.test(val)) handleCoInventorChange(ca.inventorPosition, "affiliation", val);
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

      <NoteBox />

      <Grid2 sx={{ mt: 1 }}>
        <FileField label="e-Filing Receipt:" name="eFilingReceipt" onChange={setFile("eFilingReceipt")} />
        <FileField label="Form -1" name="form1" onChange={setFile("form1")} />
        <Box sx={{ mt: 1 }}>
          <Typography sx={labelStyle}>Applying as a Seed Grant Work? *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyingSeedGrant} onChange={set("applyingSeedGrant")}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
        <Box sx={{ mt: 1 }}>
          <Typography sx={labelStyle}>Whether you want to apply for incentive? *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyIncentive} onChange={set("applyIncentive")}>
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

  const renderDetailFile = (title, filepath, folder = "patents") => {
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
            <WorkspacePremium sx={{ color: "#fff" }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Patent Details</Typography>
          </Box>
          <IconButton onClick={handleCloseDetails} sx={{ color: "#fff" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 1 }}>{data.title}</Typography>
          <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 3, fontWeight: 600 }}>Name of Applicant in Patent: {data.patentName}</Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Academic Year" value={data.academicYear?.year || "N/A"} /></Grid>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Area" value={data.area} /></Grid>
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

            <Grid item xs={12} sm={3}><LabelValueDetails label="Filing No" value={data.filingNo} /></Grid>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Date of Filing" value={formatDate(data.dateOfFiling)} /></Grid>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Patent Status" value={data.patentStatus} /></Grid>
            <Grid item xs={12} sm={3}><LabelValueDetails label="Filed Country" value={data.patentFiledCountry || "India"} /></Grid>

            <Grid item xs={12} sm={6}><LabelValueDetails label="Applying Seed Grant?" value={data.applyingSeedGrant === "Yes" ? "Yes" : "No"} /></Grid>
            <Grid item xs={12} sm={6}><LabelValueDetails label="Apply Incentive?" value={data.applyIncentive === "Yes" ? "Yes" : "No"} /></Grid>

            {data.status === "Approved" && data.approvedAmount && (
              <Grid item xs={12} sm={6}>
                <LabelValueDetails
                  label="Approved Incentive"
                  value={`₹${data.approvedAmount}`}
                  chip={<Chip label={`₹${data.approvedAmount}`} size="small" sx={{ bgcolor: "rgba(76, 175, 80, 0.1)", color: "#4caf50", fontWeight: 800 }} />}
                />
              </Grid>
            )}

            {/* Appraisal Claimant - read only in faculty view */}
            <Grid item xs={12} sm={6}>
              <LabelValueDetails
                label="Appraisal Claimant"
                chip={(() => {
                  const eligibleClaimants = [
                    { _id: data.facultyId?._id, name: data.facultyId?.name, institutionId: data.facultyId?.institutionId },
                    ...((data.coInventors || [])
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
                    <Typography variant="body2" sx={{ fontWeight: 700, color: currentClaimantObj ? "var(--text-primary)" : "#ff9800", mt: 0.5 }}>
                      {currentClaimantObj ? `${currentClaimantObj.name} (${currentClaimantObj.institutionId})` : "Not Yet Designated"}
                    </Typography>
                  );
                })()}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Co-Inventors detail list */}
          {data.coInventors && data.coInventors.length > 0 && (
            <Card sx={{ p: 0, overflow: "hidden", mb: 3, border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.01)" }}>
              <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, borderBottom: "1px solid var(--border-color)" }}>
                <Groups sx={{ color: "var(--color-primary)" }} />
                <Typography sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Co-Inventors & Affiliations</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "var(--bg-panel)" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>NAME</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>AFFILIATION</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.coInventors.map((inventor, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{inventor.name}</TableCell>
                        <TableCell sx={{ color: "var(--text-secondary)" }}>{inventor.affiliation}</TableCell>
                      </TableRow>
                    ))}
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
            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
              {renderDetailFile("e-Filing Receipt", data.eFilingReceipt)}
              {renderDetailFile("Form 1", data.form1)}
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
      <PageHeader title="Patent Publications" subtitle="Manage and submit your patent publications" />

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
