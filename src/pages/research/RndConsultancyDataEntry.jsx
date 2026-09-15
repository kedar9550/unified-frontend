import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Box, TextField, MenuItem, Select, Typography, Button, Chip
} from "@mui/material";
import { toast } from "sonner";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/design-system/PageContainer";
import {
  FormCard, Grid2, SubLabel, NoteBox, FileField, SubmitBtn, FacultyInfoRow
} from "../../components/faculty/PublicationFormFields";
import { labelStyle, MONTHS } from "../../components/faculty/publicationConstants";
import API from "../../api/axios";

export default function RndConsultancyDataEntry() {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  // Target Faculty Verification States (identical to RndJournalDataEntry)
  const [targetFacultyEmpId, setTargetFacultyEmpId] = useState("");
  const [targetFacultyName, setTargetFacultyName] = useState("");
  const [isTargetFacultyValid, setIsTargetFacultyValid] = useState(false);
  const [verifyingFaculty, setVerifyingFaculty] = useState(false);
  const [targetFacultyDetails, setTargetFacultyDetails] = useState(null);

  const initialFormState = {
    title: "",
    fundingAgency: "",
    fundingAdityaUniversity: "",
    amount: "",
    duration: "",
    month: "",
    year: "",
    applyingSeedGrant: "",
    investigatorType: "",
    applyIncentive: "No",
    appraisalEligible: "Yes",
    projectStatus: "Sanctioned",
    totalInvestigators: 1,
    otherInvestigatorsList: []
  };

  const [form, setForm] = useState(initialFormState);
  const [files, setFiles] = useState({ sanctionLetter: null, mou: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/api/academic-years").then(res => {
      const years = res.data?.years || res.data?.data || [];
      setAcademicYears(years);
      const activeYear = years.find(y => y.isActive || y.active);
      if (activeYear) setSelectedYear(activeYear._id);
      else if (years.length > 0) setSelectedYear(years[0]._id);
    }).catch(err => console.error("Failed to fetch academic years", err));
  }, []);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleNumericChange = (key) => (e) => {
    const val = e.target.value;
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setForm((prev) => ({ ...prev, [key]: val }));
    }
  };

  const setFile = (k) => (e) => setFiles((p) => ({ ...p, [k]: e.target.files[0] }));

  const getAvailableMonths = () => {
    const selectedYearVal = parseInt(form.year);
    const currentYear = new Date().getFullYear();
    if (selectedYearVal === currentYear) {
      const currentMonthIndex = new Date().getMonth();
      return MONTHS.filter((_, idx) => idx <= currentMonthIndex);
    }
    return MONTHS;
  };

  // Target Faculty Verification (identical logic to RndJournalDataEntry)
  const verifyFaculty = async () => {
    if (!targetFacultyEmpId.trim()) {
      toast.error("Please enter Employee ID");
      return;
    }
    setVerifyingFaculty(true);
    try {
      const res = await API.get(`/api/employees/by-empid/${targetFacultyEmpId.trim()}`);
      if (res.data?.success && res.data?.data) {
        const emp = res.data.data;
        if (emp.isActive) {
          setTargetFacultyName(emp.name);
          setIsTargetFacultyValid(true);
          setTargetFacultyDetails(emp);
          toast.success(`Faculty Verified: ${emp.name}`);
        } else {
          setTargetFacultyName("Inactive Faculty");
          setIsTargetFacultyValid(false);
          setTargetFacultyDetails(null);
          toast.error("This faculty member is inactive and cannot be selected.");
        }
      } else {
        setTargetFacultyName("Not Found");
        setIsTargetFacultyValid(false);
        setTargetFacultyDetails(null);
        toast.error("Faculty not found. Ensure the exact Employee ID is entered.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Faculty not found";
      toast.error(msg);
      setIsTargetFacultyValid(false);
      setTargetFacultyName("Not Found");
      setTargetFacultyDetails(null);
    } finally {
      setVerifyingFaculty(false);
    }
  };

  // Generate dynamic investigator fields (identical to ConsultancyPublication.jsx)
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
      for (let i = 1; i <= total - 1; i++) {
        const existing = form.otherInvestigatorsList[i - 1];
        newOtherInvestigators.push(existing || {
          investigatorPosition: i + 1,
          role: "Co-Investigator",
          affiliationType: "AUS",
          empId: "",
          name: "",
          affiliation: "Aditya University"
        });
      }
    } else if (type === "Co-Principal Investigator (Co-PI)") {
      for (let i = 1; i <= total - 1; i++) {
        const expectedRole = i === 1 ? "Principal Investigator" : "Co-Investigator";
        const existing = form.otherInvestigatorsList[i - 1];
        newOtherInvestigators.push(existing ? { ...existing, role: expectedRole } : {
          investigatorPosition: i + 1,
          role: expectedRole,
          affiliationType: "AUS",
          empId: "",
          name: "",
          affiliation: "Aditya University"
        });
      }
    }
    setForm(p => ({ ...p, otherInvestigatorsList: newOtherInvestigators }));
  }, [form.totalInvestigators, form.investigatorType]);

  const fetchCoInvestigatorName = async (pos, empId) => {
    try {
      const res = await API.get(`/api/employees/staff/${empId}`);
      if (res.data && res.data.success) {
        const staff = res.data.data;
        const name = staff.employeename || staff.EmployeeName || staff.name || "";

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
          if (value === "AUS") {
            newA.affiliation = "Aditya University";
            newA.name = "";
          } else {
            newA.affiliation = "";
            newA.empId = "";
            newA.name = "";
          }
        }
        if (field === "empId") {
          newA.name = "";
          if (value.length >= 3) {
            fetchCoInvestigatorName(pos, value);
          }
        }
        return newA;
      }
      return a;
    });
    setForm(p => ({ ...p, otherInvestigatorsList: updated }));
  };

  const handleSubmit = async () => {
    if (!isTargetFacultyValid || !targetFacultyEmpId) {
      toast.error("Please verify a valid Target Faculty Employee ID first");
      return;
    }
    if (!selectedYear) {
      toast.error("Please select an Academic Year");
      return;
    }
    if (!form.title || !form.fundingAdityaUniversity || !form.applyingSeedGrant || !form.amount) {
      toast.error("Please fill all required fields");
      return;
    }
    if (form.fundingAdityaUniversity === "No" && (!form.fundingAgency || !form.fundingAgency.trim())) {
      toast.error("Please specify the Funding Agency");
      return;
    }
    if (!form.investigatorType) {
      toast.error("Please select Investigator Type");
      return;
    }
    if (!form.appraisalEligible) {
      toast.error("Please select Appraisal Eligible status");
      return;
    }

    const numAmount = Number(form.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Consultancy Amount must be a positive numeric value");
      return;
    }

    const total = parseInt(form.totalInvestigators) || 1;
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
        if (a.affiliationType === "Others" && (!a.name || !a.affiliation)) {
          toast.error(`Please complete Name and Affiliation for Investigator row ${i + 1}`);
          return;
        }
        if (a.affiliationType === "AUS" && (!a.empId || !a.name)) {
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
        principalInvestigator: a.role === "Principal Investigator" ? "Yes" : "No",
        coPrincipalInvestigator: a.role === "Co-Investigator" ? "Yes" : "No"
      }));

      const isPI = form.investigatorType === "Principal Investigator (PI)";
      const isCoPI = form.investigatorType === "Co-Principal Investigator (Co-PI)";

      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k !== "otherInvestigatorsList") fd.append(k, v);
      });

      fd.append("principalInvestigator", isPI ? "Yes" : "No");
      fd.append("coPrincipalInvestigator", isCoPI ? "Yes" : "No");
      fd.append("coInvestigators", JSON.stringify(coInvestigatorsList));
      fd.append("academicYear", selectedYear);
      fd.append("isDirectEntry", "true");
      fd.append("targetFacultyEmpId", targetFacultyEmpId);

      if (files.sanctionLetter) fd.append("sanctionLetter", files.sanctionLetter);
      if (files.mou) fd.append("mou", files.mou);

      await API.post("/api/research/consultancy", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Consultancy record added directly for faculty!");

      setForm(initialFormState);
      setFiles({ sanctionLetter: null, mou: null });
      setTargetFacultyEmpId("");
      setTargetFacultyName("");
      setIsTargetFacultyValid(false);
      setTargetFacultyDetails(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit consultancy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Consultancy Data Entry (R&D Direct Entry)"
        subtitle="Add consultancy records directly on behalf of faculty members with immediate approval"
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Target Faculty Section (Matching RndJournalDataEntry) */}
        <FormCard title="Target Faculty Identification">
          <Grid2>
            <Box>
              <Typography sx={{ ...labelStyle, mb: 0.5 }}>
                TARGET FACULTY EMPLOYEE ID : <span style={{ color: "red" }}>*</span>
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Enter Employee ID"
                  value={targetFacultyEmpId}
                  onChange={(e) => {
                    setTargetFacultyEmpId(e.target.value);
                    setIsTargetFacultyValid(false);
                    setTargetFacultyName("");
                    setTargetFacultyDetails(null);
                    setForm(initialFormState);
                    setFiles({ sanctionLetter: null, mou: null });
                  }}
                />
                <Button
                  variant="contained"
                  onClick={verifyFaculty}
                  disabled={verifyingFaculty || !targetFacultyEmpId}
                  sx={{ whiteSpace: "nowrap", textTransform: "none" }}
                >
                  {verifyingFaculty ? "Verifying..." : "Verify"}
                </Button>
              </Box>
              {targetFacultyName && (
                <Typography variant="caption" color={isTargetFacultyValid ? "success.main" : "error.main"} sx={{ mt: 1, display: "block" }}>
                  {isTargetFacultyValid ? `✓ Validated: ${targetFacultyName}` : `✗ ${targetFacultyName}`}
                </Typography>
              )}
            </Box>
          </Grid2>
        </FormCard>

        {isTargetFacultyValid && (
          <FormCard title="Consultancy Submission">
            {/* Academic Year Selection */}
            <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
              <Typography sx={{ ...labelStyle, mb: 0 }}>Academic Year :</Typography>
              <Select
                size="small"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                sx={{ minWidth: 150, background: "var(--bg-panel)" }}
              >
                {academicYears.map(y => (
                  <MenuItem key={y._id} value={y._id}>{y.year || y.yearRange}</MenuItem>
                ))}
              </Select>
            </Box>

            {/* Read-only details of verified faculty member */}
            <FacultyInfoRow faculty={targetFacultyDetails} />

            <SubLabel text="Details of the Consultancy:" />
            <Grid2>
              <Box>
                <Typography sx={labelStyle}>Title of the Consultancy Work : *</Typography>
                <TextField size="small" fullWidth value={form.title} onChange={set("title")} placeholder="Title of consultancy" />
              </Box>
              <Box>
                <Typography sx={labelStyle}>Funding Agency : *</Typography>
                <Select
                  size="small"
                  fullWidth
                  displayEmpty
                  value={form.fundingAdityaUniversity}
                  onChange={(e) => setForm(p => ({
                    ...p,
                    fundingAdityaUniversity: e.target.value,
                    fundingAgency: e.target.value === "Yes" ? "Aditya University" : ""
                  }))}
                >
                  <MenuItem value="" disabled>--Select--</MenuItem>
                  <MenuItem value="Yes">Aditya University</MenuItem>
                  <MenuItem value="No">Others</MenuItem>
                </Select>
              </Box>
              {form.fundingAdityaUniversity === "No" && (
                <Box>
                  <Typography sx={labelStyle}>Please Specify Funding Agency : *</Typography>
                  <TextField size="small" fullWidth value={form.fundingAgency} onChange={set("fundingAgency")} placeholder="Specify funding agency name" />
                </Box>
              )}
              <Box>
                <Typography sx={labelStyle}>Consultancy Amount : *</Typography>
                <TextField size="small" fullWidth value={form.amount} onChange={handleNumericChange("amount")} placeholder="Amount in INR" />
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
                  slotProps={{ htmlInput: { min: 1 } }}
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
                {form.otherInvestigatorsList.map((ca, index) => (
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

                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2 }}>
                      <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
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
                      </Box>

                      {ca.affiliationType === "AUS" && (
                        <>
                          <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>EMPLOYEE ID *</Typography>
                            <TextField
                              size="small"
                              fullWidth
                              value={ca.empId}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d*$/.test(val)) handleCoInvestigatorChange(ca.investigatorPosition, "empId", val);
                              }}
                              placeholder="e.g. 5741"
                            />
                          </Box>
                          <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>NAME</Typography>
                            <TextField
                              size="small"
                              fullWidth
                              value={ca.name}
                              disabled
                              placeholder="Auto-fetched"
                              sx={{ background: "rgba(0,0,0,0.02)" }}
                            />
                          </Box>
                        </>
                      )}

                      {ca.affiliationType === "Others" && (
                        <>
                          <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>NAME *</Typography>
                            <TextField
                              size="small"
                              fullWidth
                              value={ca.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!/\d/.test(val)) handleCoInvestigatorChange(ca.investigatorPosition, "name", val);
                              }}
                              placeholder="Full Name"
                            />
                          </Box>
                          <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION / ORG *</Typography>
                            <TextField
                              size="small"
                              fullWidth
                              value={ca.affiliation}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!/\d/.test(val)) handleCoInvestigatorChange(ca.investigatorPosition, "affiliation", val);
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

            <SubLabel text="Date of Commencement of the Consultancy:" />
            <Grid2>
              <Box>
                <Typography sx={labelStyle}>Year :</Typography>
                <Select
                  size="small"
                  fullWidth
                  displayEmpty
                  value={form.year}
                  onChange={(e) => {
                    setForm(p => ({ ...p, year: e.target.value, month: "" }));
                  }}
                >
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
                  <MenuItem value="" disabled>Select</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </Box>
              <Box>
                <Typography sx={labelStyle}>Applying for Incentive? *</Typography>
                <Select size="small" fullWidth displayEmpty value={form.applyIncentive} disabled>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </Box>
              <Box>
                <Typography sx={labelStyle}>Appraisal Eligible *</Typography>
                <Select size="small" fullWidth value={form.appraisalEligible} onChange={set("appraisalEligible")}>
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

            <NoteBox />

            <Grid2 sx={{ mt: 2 }}>
              <FileField
                label="Sanction Letter:"
                name="sanctionLetter"
                onChange={setFile("sanctionLetter")}
              />
              <FileField
                label="MOU (If any):"
                name="mou"
                onChange={setFile("mou")}
              />
            </Grid2>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
              <SubmitBtn onClick={handleSubmit} loading={loading} />
            </Box>
          </FormCard>
        )}
      </Box>
    </PageContainer>
  );
}
