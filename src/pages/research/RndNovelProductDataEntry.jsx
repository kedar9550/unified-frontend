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
import { labelStyle } from "../../components/faculty/publicationConstants";
import API from "../../api/axios";

const CATEGORIES = ["Developed", "Implemented"];

export default function RndNovelProductDataEntry() {
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
    productName: "",
    description: "",
    category: "",
    developedOrganization: "",
    implementedOrganization: "",
    remarks: "",
    investigatorType: "",
    applyIncentive: "No",
    appraisalEligible: "Yes",
    totalDevelopers: 1,
    otherDevelopersList: []
  };

  const [form, setForm] = useState(initialFormState);
  const [files, setFiles] = useState({ document: null });
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

  const setFile = (k) => (e) => setFiles((p) => ({ ...p, [k]: e.target.files[0] }));

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

  // Generate dynamic developer fields (identical to NovelProductPublication.jsx)
  useEffect(() => {
    let total = parseInt(form.totalDevelopers);
    if (isNaN(total) || total < 1) {
      total = 1;
      if (form.totalDevelopers !== "") {
        setForm(p => ({ ...p, totalDevelopers: 1 }));
      }
    }

    const type = form.investigatorType;
    if (!type || total <= 1) {
      setForm(p => ({ ...p, otherDevelopersList: [] }));
      return;
    }

    let newOtherDevelopers = [];
    if (type === "Principal Investigator (PI)") {
      for (let i = 1; i <= total - 1; i++) {
        const existing = form.otherDevelopersList[i - 1];
        newOtherDevelopers.push(existing || {
          developerPosition: i + 1,
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
        const existing = form.otherDevelopersList[i - 1];
        newOtherDevelopers.push(existing ? { ...existing, role: expectedRole } : {
          developerPosition: i + 1,
          role: expectedRole,
          affiliationType: "AUS",
          empId: "",
          name: "",
          affiliation: "Aditya University"
        });
      }
    }
    setForm(p => ({ ...p, otherDevelopersList: newOtherDevelopers }));
  }, [form.totalDevelopers, form.investigatorType]);

  const fetchCoDeveloperName = async (pos, empId) => {
    try {
      const res = await API.get(`/api/employees/staff/${empId}`);
      if (res.data && res.data.success) {
        const staff = res.data.data;
        const name = staff.employeename || staff.EmployeeName || staff.name || "";

        setForm(prev => {
          const updated = prev.otherDevelopersList.map(a => {
            if (a.developerPosition === pos) {
              return { ...a, name: name, affiliation: "Aditya University" };
            }
            return a;
          });
          return { ...prev, otherDevelopersList: updated };
        });
      }
    } catch (err) {
      console.error("Failed to fetch staff data", err);
    }
  };

  const handleCoDeveloperChange = (pos, field, value) => {
    const updated = form.otherDevelopersList.map(a => {
      if (a.developerPosition === pos) {
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
            fetchCoDeveloperName(pos, value);
          }
        }
        return newA;
      }
      return a;
    });
    setForm(p => ({ ...p, otherDevelopersList: updated }));
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
    if (!form.productName || !form.category || !form.description) {
      toast.error("Please fill all required fields");
      return;
    }
    if (form.category === "Developed" && !form.developedOrganization) {
      toast.error("Please enter Developed Organization");
      return;
    }
    if (form.category === "Implemented" && !form.implementedOrganization) {
      toast.error("Please enter Implemented Organization");
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

    const total = parseInt(form.totalDevelopers) || 1;
    if (form.investigatorType === "Co-Principal Investigator (Co-PI)" && total < 2) {
      toast.error("Total number of investigators must be at least 2 when you are Co-PI");
      return;
    }

    if (total > 1) {
      for (let i = 0; i < form.otherDevelopersList.length; i++) {
        const a = form.otherDevelopersList[i];
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

    if (!files.document) {
      toast.error("At least one supporting document/proof is mandatory");
      return;
    }

    setLoading(true);
    try {
      const coDevelopersList = form.otherDevelopersList.map(a => ({
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
      fd.append("productName", form.productName);
      fd.append("description", form.description);
      fd.append("category", form.category);
      if (form.category === "Developed" && form.developedOrganization) {
        fd.append("developedOrganization", form.developedOrganization);
      }
      if (form.category === "Implemented" && form.implementedOrganization) {
        fd.append("implementedOrganization", form.implementedOrganization);
      }
      fd.append("remarks", form.remarks);
      fd.append("academicYear", selectedYear);
      fd.append("investigatorType", form.investigatorType);
      fd.append("principalInvestigator", isPI ? "Yes" : "No");
      fd.append("coPrincipalInvestigator", isCoPI ? "Yes" : "No");
      fd.append("applyIncentive", "No");
      fd.append("appraisalEligible", form.appraisalEligible);
      fd.append("coDevelopers", JSON.stringify(coDevelopersList));
      fd.append("isDirectEntry", "true");
      fd.append("targetFacultyEmpId", targetFacultyEmpId);

      if (files.document) fd.append("document", files.document);

      await API.post("/api/research/novel-product", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Novel Product/Technology record added directly for faculty!");

      setForm(initialFormState);
      setFiles({ document: null });
      setTargetFacultyEmpId("");
      setTargetFacultyName("");
      setIsTargetFacultyValid(false);
      setTargetFacultyDetails(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit novel product/technology");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Novel Product Data Entry (R&D Direct Entry)"
        subtitle="Add novel product & technology records directly on behalf of faculty members with immediate approval"
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
                    setFiles({ document: null });
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
          <FormCard title="Product / Technology Submission">
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

            <SubLabel text="Product / Technology Details:" />
            <Grid2>
              <Box>
                <Typography sx={labelStyle}>Product / Technology Name : *</Typography>
                <TextField size="small" fullWidth value={form.productName} onChange={set("productName")} placeholder="e.g. Smart IoT Agri-Device" />
              </Box>
              <Box>
                <Typography sx={labelStyle}>Category : *</Typography>
                <Select size="small" fullWidth displayEmpty value={form.category} onChange={set("category")}>
                  <MenuItem value="" disabled>--Select Category--</MenuItem>
                  {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </Box>

              {form.category === "Developed" && (
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Typography sx={labelStyle}>Developed Organization : *</Typography>
                  <TextField size="small" fullWidth value={form.developedOrganization} onChange={set("developedOrganization")} placeholder="Name of organization where product was developed" />
                </Box>
              )}

              {form.category === "Implemented" && (
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Typography sx={labelStyle}>Implemented Organization : *</Typography>
                  <TextField size="small" fullWidth value={form.implementedOrganization} onChange={set("implementedOrganization")} placeholder="Name of organization where product was implemented" />
                </Box>
              )}

              <Box sx={{ gridColumn: "1 / -1" }}>
                <Typography sx={labelStyle}>Description of Novel Product / Technology : *</Typography>
                <TextField size="small" fullWidth multiline rows={6} value={form.description} onChange={set("description")} placeholder="Provide detailed specifications, utility, and outcomes of the product..." />
              </Box>

              <Box>
                <Typography sx={labelStyle}>Total Number of Investigators : *</Typography>
                <TextField
                  size="small"
                  type="number"
                  fullWidth
                  value={form.totalDevelopers}
                  onChange={set("totalDevelopers")}
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

              {parseInt(form.totalDevelopers) > 1 && form.investigatorType && (
                <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" }, mt: 2, background: "var(--bg-panel)", p: 2, borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                  <Typography sx={{ ...labelStyle, mb: 1.5, fontWeight: 700 }}>Name & affiliation of Investigator(s) :</Typography>
                  {form.otherDevelopersList.map((ca, index) => (
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
                            onChange={(e) => handleCoDeveloperChange(ca.developerPosition, "affiliationType", e.target.value)}
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
                                  if (/^\d*$/.test(val)) handleCoDeveloperChange(ca.developerPosition, "empId", val);
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
                                  if (!/\d/.test(val)) handleCoDeveloperChange(ca.developerPosition, "name", val);
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
                                  if (!/\d/.test(val)) handleCoDeveloperChange(ca.developerPosition, "affiliation", val);
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

              <Box>
                <Typography sx={labelStyle}>Applying for Incentive : *</Typography>
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

              <Box sx={{ gridColumn: "1 / -1" }}>
                <Typography sx={labelStyle}>Additional remarks (Optional) :</Typography>
                <TextField size="small" fullWidth multiline rows={2} value={form.remarks} onChange={set("remarks")} placeholder="Optional details..." />
              </Box>
            </Grid2>

            <NoteBox />

            <Box sx={{ mt: 3, maxWidth: 500 }}>
              <FileField
                label="Product Documentation / Technical Report / Implementation Proof : *"
                name="document"
                onChange={setFile("document")}
              />
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 5 }}>
              <SubmitBtn onClick={handleSubmit} loading={loading} />
            </Box>
          </FormCard>
        )}
      </Box>
    </PageContainer>
  );
}
