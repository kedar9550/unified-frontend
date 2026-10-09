import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Box, TextField, MenuItem, Select, Typography, Button, IconButton,
  Radio, RadioGroup, FormControlLabel
} from "@mui/material";
import { toast } from "sonner";
import { Search, AttachFile, Close } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/design-system/PageContainer";
import {
  FormCard, Grid2, SubLabel, FileField, SubmitBtn, FacultyInfoRow
} from "../../components/faculty/PublicationFormFields";
import { labelStyle } from "../../components/faculty/publicationConstants";
import API from "../../api/axios";

const PATENT_STATUSES = ["Published", "Granted"];
const PATENT_APPLICANTS = ["Aditya University", "Aditya College of Pharmacy", "Other"];

export default function RndPatentDataEntry() {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  const [targetFacultyEmpId, setTargetFacultyEmpId] = useState("");
  const [targetFacultyName, setTargetFacultyName] = useState("");
  const [isTargetFacultyValid, setIsTargetFacultyValid] = useState(false);
  const [verifyingFaculty, setVerifyingFaculty] = useState(false);
  const [targetFacultyDetails, setTargetFacultyDetails] = useState(null);

  const initialFormState = {
    facultyRole: "Applicant",
    applicantAffiliation: "",
    title: "",
    applicantName: "",
    patentName: "Aditya University",
    patentFiledInInstitution: "Yes",
    isInstitutionRecord: "No",
    area: "",
    applicationNo: "",
    dateOfFiling: "",
    status: "",
    patentFiledCountry: "India",
    customCountryName: "",
    applyingSeedGrant: "No",
    eligibleForTechTransfer: "No",
    applyIncentive: "",
    otherInventors: [],
    appraisalEligible: "",
    approvedAmount: "",
    publisheddate: "",
    granteddate: "",
    isUtilityType: "Yes"
  };

  const [form, setForm] = useState(initialFormState);
  const [files, setFiles] = useState({ cbr: null, form1: null, grantedCertificate: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/api/academic-years").then(res => {
      const years = res.data?.years || res.data?.data || [];
      setAcademicYears(years);
      const activeYear = years.find(y => y.isActive);
      if (activeYear) setSelectedYear(activeYear._id);
      else if (years.length > 0) setSelectedYear(years[0]._id);
    }).catch(err => console.log("Failed to fetch academic years", err));
  }, []);

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm(p => {
      const newForm = { ...p, [k]: val };
      if (k === "isInstitutionRecord") {
        if (val === "Yes") {
          newForm.applyIncentive = "No";
          newForm.appraisalEligible = "No";
          newForm.approvedAmount = "";
        } else {
          newForm.applyIncentive = "";
          newForm.appraisalEligible = "";
          newForm.approvedAmount = "";
        }
      }
      return newForm;
    });
  };

  const handleAddInventor = () => {
    setForm(p => {
      const maxPos = p.otherInventors.length > 0 ? Math.max(...p.otherInventors.map(a => a.inventorPosition)) : 1;
      return {
        ...p,
        otherInventors: [
          ...p.otherInventors,
          {
            inventorPosition: maxPos + 1,
            affiliationType: "",
            empId: "",
            name: "",
            affiliation: ""
          }
        ]
      };
    });
  };

  const handleRemoveInventor = (pos) => {
    setForm(p => ({
      ...p,
      otherInventors: p.otherInventors.filter(a => a.inventorPosition !== pos)
    }));
  };

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
            newA.empId = "";
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

    if (field === "empId" && value.length >= 3) {
      const inventor = updated.find(a => a.inventorPosition === pos);
      if (inventor && inventor.affiliationType === "Aditya University") {
        fetchCoInventorName(pos, value);
      }
    }
  };



  const handleVerifyFaculty = async () => {
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
          toast.error("Faculty record found but is inactive.");
          setIsTargetFacultyValid(false);
          setTargetFacultyDetails(null);
        }
      } else {
        toast.error("Faculty not found with given Employee ID");
        setIsTargetFacultyValid(false);
        setTargetFacultyDetails(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to verify faculty");
      setIsTargetFacultyValid(false);
      setTargetFacultyDetails(null);
    } finally {
      setVerifyingFaculty(false);
    }
  };

  const handleSubmit = async () => {
    if (!targetFacultyEmpId || !isTargetFacultyValid) {
      toast.error("Please verify a valid Target Faculty Employee ID first");
      return;
    }

    const finalFacultyRole = form.patentFiledInInstitution === "Yes" ? "Inventor / Co-Inventor" : form.facultyRole;
    const finalPatentName = form.patentFiledInInstitution === "Yes" ? "Aditya University" : (finalFacultyRole === "Applicant" ? (targetFacultyName || "") : form.patentName);
    const finalApplicantAffiliation = form.patentFiledInInstitution === "Yes" ? "Aditya University" : (finalFacultyRole === "Applicant" ? (targetFacultyDetails?.college || "") : form.applicantAffiliation);

    if (form.patentFiledInInstitution === "No" && !finalFacultyRole) {
      toast.error("Please select Target Faculty's role in the patent");
      return;
    }
    if (finalFacultyRole === "Inventor / Co-Inventor" && (!finalPatentName || !finalApplicantAffiliation)) {
      toast.error("Please provide the Name of the Applicant and Applicant Affiliation");
      return;
    }
    if (!finalPatentName) {
      toast.error("Please provide the Name of the Applicant");
      return;
    }
    if (!form.title || !form.applicationNo || (form.status !== 'Granted' && !form.dateOfFiling)) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!/^[A-Za-z0-9\/.-]+$/.test(form.applicationNo)) {
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

    // Future date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (form.dateOfFiling) {
      const selDate = new Date(form.dateOfFiling);
      selDate.setHours(0, 0, 0, 0);
      if (selDate > today) {
        toast.error("Date of filing cannot be in the future");
        return;
      }
    }

    // Validate co-inventors dynamically
    const total = form.otherInventors.length + 1;
    if (total > 1) {
      for (const a of form.otherInventors) {
        if (!a.affiliationType) {
          toast.error(`Please select affiliation type for Inventor Position ${a.inventorPosition}`);
          return;
        }
        if (a.affiliationType === 'Others' && (!a.name || !a.affiliation)) {
          toast.error(`Please complete details for Inventor Position ${a.inventorPosition}`);
          return;
        }
        if (a.affiliationType === 'Aditya University') {
          if (!a.empId || !a.name) {
            toast.error(`Please provide Employee ID and verify Name for Inventor Position ${a.inventorPosition}`);
            return;
          }
        }
      }
    }

    if (form.applyIncentive === "Yes" && (!form.approvedAmount || Number(form.approvedAmount) <= 0)) {
      toast.error("Please enter a valid Approved Incentive Amount");
      return;
    }
    if (!form.appraisalEligible) {
      toast.error("Please select Appraisal Eligible status");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      const coInventorsList = form.otherInventors.map(a => ({
        name: a.name || "",
        affiliation: a.affiliationType === "Aditya University" ? "Aditya University" : (a.affiliation || ""),
        employeeId: a.affiliationType === "Aditya University" ? a.empId : null,
        inventorPosition: a.inventorPosition
      })).filter(ca => ca.name && ca.affiliation);

      fd.append("title", form.title);
      fd.append("facultyRole", finalFacultyRole || "Applicant");
      fd.append("applicantAffiliation", finalApplicantAffiliation);
      fd.append("applicantName", targetFacultyName || "");
      fd.append("patentName", finalPatentName);
      fd.append("patentFiledInInstitution", form.patentFiledInInstitution || "Yes");
      fd.append("isUtilityType", form.isUtilityType || "Yes");
      fd.append("area", form.area);
      fd.append("applicationNo", form.applicationNo);
      fd.append("dateOfFiling", form.dateOfFiling);
      fd.append("status", form.status);
      fd.append("patentFiledCountry", form.patentFiledCountry === 'Others' ? form.customCountryName : form.patentFiledCountry);
      fd.append("coInventors", JSON.stringify(coInventorsList));
      fd.append("isInstitutionRecord", form.isInstitutionRecord || "No");
      const isUtilityTypeNo = form.isUtilityType === "No";
      const applyIncentive = isUtilityTypeNo ? "No" : form.applyIncentive;
      fd.append("applyIncentive", applyIncentive);
      fd.append("applyingSeedGrant", form.applyingSeedGrant);
      fd.append("eligibleForTechTransfer", form.eligibleForTechTransfer);
      fd.append("appraisalEligible", form.appraisalEligible || "Yes");
      fd.append("approvedAmount", form.approvedAmount || "");
      
      const total = form.otherInventors.length + 1;
      fd.append("totalInventors", String(total));

      let expectedAmt = form.status === "Published" ? 5000 : (form.status === "Granted" ? 15000 : 0);
      if (form.applyingSeedGrant === "Yes") expectedAmt = expectedAmt / 2;
      if (isUtilityTypeNo) expectedAmt = 0;

      fd.append("publishedstatus", form.status === "Published" ? "yes" : "no");
      fd.append("publisheddate", form.publisheddate || "");
      fd.append("publishedexpectedamount", (applyIncentive === "Yes" && form.status === "Published") ? expectedAmt : "");
      
      fd.append("grantedstatus", form.status === "Granted" ? "yes" : "no");
      fd.append("granteddate", form.granteddate || "");
      fd.append("grantedexpectedamount", (form.applyIncentive === "Yes" && form.status === "Granted") ? expectedAmt : "");

      fd.append("academicYear", selectedYear);
      fd.append("college", targetFacultyDetails?.college || user?.college || "");
      fd.append("panNumber", targetFacultyDetails?.panNumber || user?.panNumber || "");
      fd.append("isDirectEntry", "true");
      fd.append("targetFacultyEmpId", targetFacultyEmpId);

      if (files.cbr) fd.append("cbr", files.cbr);
      if (files.form1) fd.append("form1", files.form1);
      if (files.grantedCertificate) fd.append("grantedCertificate", files.grantedCertificate);

      await API.post("/api/research/patent", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Patent record added directly for faculty!");
      setForm(initialFormState);
      setFiles({ cbr: null, form1: null, grantedCertificate: null });
      setTargetFacultyEmpId("");
      setIsTargetFacultyValid(false);
      setTargetFacultyDetails(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit patent publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Patent Data Entry (R&D Direct Entry)"
        subtitle="Add patent records directly on behalf of faculty members with immediate approval"
      />

      {/* Target Faculty Section */}
      <FormCard title="Target Faculty Identification">
        <Box>
          <Typography sx={{ ...labelStyle, mb: 0.5 }}>TARGET FACULTY EMPLOYEE ID : <span style={{ color: 'red' }}>*</span></Typography>
          <Box sx={{ display: 'flex', gap: 2, maxWidth: 500 }}>
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
                setFiles({ cbr: null, form1: null, grantedCertificate: null });
              }}
            />
            <Button
              variant="contained"
              onClick={handleVerifyFaculty}
              disabled={verifyingFaculty || !targetFacultyEmpId}
              startIcon={<Search />}
              sx={{ background: "var(--gradient-primary)", color: "#fff", textTransform: "none", fontWeight: 700, px: 3, whiteSpace: "nowrap" }}
            >
              {verifyingFaculty ? "Verifying..." : "Verify"}
            </Button>
          </Box>
        </Box>
      </FormCard>

      {isTargetFacultyValid && targetFacultyDetails && (
        <>
          <FormCard title="Target Faculty Profile Details">
            <FacultyInfoRow faculty={targetFacultyDetails} />
          </FormCard>

          {/* Details of the Patent */}
          <FormCard title="Patent Details">
            <Grid2>
              {/* Row 0: Academic Year */}
              <Box sx={{ gridColumn: { sm: "1 / -1" }, mb: 1 }}>
                <Typography sx={labelStyle}>Academic Year :</Typography>
                <Select fullWidth size="small" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                  {academicYears.map(y => <MenuItem key={y._id} value={y._id}>{y.yearRange || y.year}</MenuItem>)}
                </Select>
              </Box>

              {/* Row 0.5: Institution Record */}
              <Box sx={{ gridColumn: { sm: "1 / -1" }, mb: 1, p: 2, background: "var(--bg-panel)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Typography sx={{ ...labelStyle, mb: 0, fontWeight: 700, color: "var(--text-primary)" }}>Is this an Institution Record? *</Typography>
                  <RadioGroup row value={form.isInstitutionRecord} onChange={set("isInstitutionRecord")}>
                    <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Yes</Typography>} />
                    <FormControlLabel value="No" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>No</Typography>} />
                  </RadioGroup>
                </Box>
                {form.isInstitutionRecord === "Yes" && (
                  <Typography variant="caption" sx={{ color: "var(--color-warning, #f59e0b)", fontWeight: 600, mt: 1, display: "block" }}>
                    ⚠ Institution Record: Apply Incentive and Appraisal Eligibility are Not Applicable
                  </Typography>
                )}
              </Box>



              {/* Row 1 */}
              <Box sx={{ p: 2, background: "var(--bg-panel)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Typography sx={{ ...labelStyle, mb: 0, fontWeight: 700, color: "var(--text-primary)", fontSize: "12px", textTransform: "uppercase" }}>Is Patent filed in University Name? *</Typography>
                  <RadioGroup
                    row
                    value={form.patentFiledInInstitution || "Yes"}
                    onChange={(e) => {
                      const val = e.target.value;
                      const newRole = form.facultyRole || "Applicant";
                      setForm(prev => ({
                        ...prev,
                        patentFiledInInstitution: val,
                        patentName: val === "Yes" ? "Aditya University" : (newRole === "Applicant" ? (targetFacultyName || "") : ""),
                        applicantAffiliation: val === "Yes" ? "Aditya University" : (newRole === "Applicant" ? (targetFacultyDetails?.college || "") : "")
                      }));
                    }}
                  >
                    <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Yes</Typography>} />
                    <FormControlLabel value="No" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>No</Typography>} />
                  </RadioGroup>
                </Box>
              </Box>

              <Box sx={{ p: 2, background: "var(--bg-panel)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Typography sx={{ ...labelStyle, mb: 0, fontWeight: 700, color: "var(--text-primary)", fontSize: "12px", textTransform: "uppercase" }}>Is the patent utility type? *</Typography>
                  <RadioGroup
                    row
                    value={form.isUtilityType || "Yes"}
                    onChange={set("isUtilityType")}
                  >
                    <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Yes</Typography>} />
                    <FormControlLabel value="No" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>No</Typography>} />
                  </RadioGroup>
                </Box>
              </Box>
              {/* Target Faculty Role */}
              {form.patentFiledInInstitution === "No" && (
                <Box sx={{ gridColumn: { sm: "1 / -1" }, mb: 1, p: 2, background: "var(--bg-panel)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <Typography sx={{ ...labelStyle, mb: 0, fontWeight: 700, color: "var(--text-primary)", fontSize: "12px", textTransform: "uppercase" }}>Target Faculty's Role in the Patent *</Typography>
                    <RadioGroup
                      row
                      value={form.facultyRole}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm(prev => ({
                          ...prev,
                          facultyRole: val,
                          patentName: prev.patentFiledInInstitution === "Yes" ? "Aditya University" : (val === "Applicant" ? (targetFacultyName || "") : ""),
                          applicantAffiliation: prev.patentFiledInInstitution === "Yes" ? "Aditya University" : (val === "Applicant" ? (targetFacultyDetails?.college || "") : "")
                        }));
                      }}
                    >
                      <FormControlLabel value="Applicant" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Applicant</Typography>} />
                      <FormControlLabel value="Inventor / Co-Inventor" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Inventor / Co-Inventor</Typography>} />
                    </RadioGroup>
                  </Box>
                </Box>
              )}

              {/* Row 2 */}
              <Box>
                <Typography sx={labelStyle}>Name of the Applicant : *</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.patentName}
                  onChange={set("patentName")}
                  placeholder="Enter Applicant Name"
                  disabled={(form.patentFiledInInstitution || "Yes") === "Yes" || form.facultyRole === "Applicant"}
                />
              </Box>
              <Box>
                <Typography sx={labelStyle}>Applicant Affiliation : *</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.applicantAffiliation}
                  onChange={set("applicantAffiliation")}
                  placeholder="Enter Applicant Affiliation"
                  disabled={(form.patentFiledInInstitution || "Yes") === "Yes" || form.facultyRole === "Applicant"}
                />
              </Box>

              {/* Row 3 */}
              <Box>
                <Typography sx={labelStyle}>Title of the Patent : <span style={{ color: 'red' }}>*</span></Typography>
                <TextField size="small" fullWidth value={form.title} onChange={set("title")} placeholder="Enter Title of the Patent" />
              </Box>
              <Box>
                <Typography sx={labelStyle}>Status of Patent Application :</Typography>
                <Select size="small" fullWidth displayEmpty value={form.status} onChange={set("status")}>
                  <MenuItem value="">--Select--</MenuItem>
                  {PATENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </Box>

              {/* Row 4 */}
              <Box>
                <Typography sx={labelStyle}>Area of Patent :</Typography>
                <TextField size="small" fullWidth value={form.area} onChange={set("area")} placeholder="e.g. AI / Embedded Systems" />
              </Box>
              <Box>
                <Typography sx={labelStyle}>Patent Application No : <span style={{ color: 'red' }}>*</span></Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.applicationNo}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^[A-Za-z0-9\/.-]+$/.test(val)) {
                      setForm(p => ({ ...p, applicationNo: val }));
                    }
                  }}
                  placeholder="e.g. 202341012345"
                />
              </Box>

              {/* Row 5 */}
              {form.status !== "Granted" && (
                <Box>
                  <Typography sx={labelStyle}>Date of Filing : <span style={{ color: 'red' }}>*</span></Typography>
                  <TextField size="small" fullWidth type="date" value={form.dateOfFiling} onChange={set("dateOfFiling")} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().split("T")[0] } }} />
                </Box>
              )}
              <Box>
                <Typography sx={labelStyle}>Patent Filed Country :</Typography>
                <Select size="small" fullWidth value={form.patentFiledCountry} onChange={set("patentFiledCountry")}>
                  <MenuItem value="India">India</MenuItem>
                  <MenuItem value="Others">Others</MenuItem>
                </Select>
              </Box>

              {/* Conditional rows */}
              {(form.status === "Published" || form.status === "Granted") && (
                <Box>
                  <Typography sx={labelStyle}>Published Date :</Typography>
                  <TextField size="small" fullWidth type="date" value={form.publisheddate} onChange={set("publisheddate")} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().split("T")[0] } }} />
                </Box>
              )}
              {form.status === "Granted" && (
                <Box>
                  <Typography sx={labelStyle}>Granted Date :</Typography>
                  <TextField size="small" fullWidth type="date" value={form.granteddate} onChange={set("granteddate")} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().split("T")[0] } }} />
                </Box>
              )}
              {form.patentFiledCountry === 'Others' && (
                <Box>
                  <Typography sx={labelStyle}>Enter Country Name :</Typography>
                  <TextField size="small" fullWidth value={form.customCountryName} onChange={set("customCountryName")} placeholder="e.g. USA, UK" />
                </Box>
              )}
              {form.status === "Granted" && (
                <Box>
                  <Typography sx={labelStyle}>Eligible for Technology Transfer :</Typography>
                  <Select size="small" fullWidth value={form.eligibleForTechTransfer || "No"} onChange={set("eligibleForTechTransfer")}>
                    <MenuItem value="No">No</MenuItem>
                    <MenuItem value="Yes">Yes</MenuItem>
                  </Select>
                </Box>
              )}
              <Box sx={{ gridColumn: { sm: "1 / -1" }, display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
                <Typography sx={{ ...labelStyle, mb: 0, fontSize: 14 }}>Co-Inventor(s) Details (if any):</Typography>
                {form.otherInventors.length === 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleAddInventor}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
                  >
                    + Add inventor / co-inventor details
                  </Button>
                )}
              </Box>

              {form.otherInventors.length > 0 && (
                <Box sx={{ gridColumn: { sm: "1 / -1" }, background: "var(--bg-panel)", p: 2, borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
                    <Typography sx={{ ...labelStyle, mb: 0, fontWeight: 700 }}>Name & Affiliation of Co-Inventor(s) :</Typography>
                    <Button variant="outlined" size="small" onClick={handleAddInventor} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}>
                      + Add More
                    </Button>
                  </Box>
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
                                placeholder="Auto-fetched"
                                sx={{ background: "rgba(0,0,0,0.02)" }}
                              />
                            </Box>
                          </>
                        ) : ca.affiliationType === "Others" ? (
                          <>
                            <Box sx={{ flex: 1, minWidth: "180px" }}>
                              <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-INVENTOR NAME</Typography>
                              <TextField
                                size="small"
                                fullWidth
                                value={ca.name}
                                onChange={(e) => handleCoInventorChange(ca.inventorPosition, "name", e.target.value)}
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
                                placeholder="Organization / College"
                              />
                            </Box>
                          </>
                        ) : null}

                        
                        
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleRemoveInventor(ca.inventorPosition)}
                          sx={{ mt: { sm: 2 } }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Grid2>
          </FormCard>

          {/* Attachments Section */}
          <FormCard title="Attachments & Additional Information" icon={<AttachFile sx={{ color: "var(--color-primary)" }} />}>
            <Grid2>
              <FileField label="Certificate of Basic Registration (CBR):" onChange={(e) => setFiles(p => ({ ...p, cbr: e.target.files[0] }))} />
              <FileField label="Form-1 Document:" onChange={(e) => setFiles(p => ({ ...p, form1: e.target.files[0] }))} />
              {form.status === "Granted" && (
                <FileField label="Granted Certificate" onChange={(e) => setFiles(p => ({ ...p, grantedCertificate: e.target.files[0] }))} />
              )}
              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <Grid2>
                  <Box>
                    <Typography sx={labelStyle}>Applying as a Seed Grant Work?</Typography>
                    <Select size="small" fullWidth value={form.applyingSeedGrant} onChange={set("applyingSeedGrant")}>
                      <MenuItem value="Yes">Yes</MenuItem>
                      <MenuItem value="No">No</MenuItem>
                    </Select>
                  </Box>

                  <Box>
                    <Typography sx={labelStyle}>Apply Incentive? : *</Typography>
                    <Select
                      size="small" fullWidth displayEmpty
                      value={(form.isInstitutionRecord === "Yes" || form.isUtilityType === "No") ? "No" : form.applyIncentive}
                      onChange={set("applyIncentive")}
                      disabled={form.isInstitutionRecord === "Yes" || form.isUtilityType === "No"}
                      sx={(form.isInstitutionRecord === "Yes" || form.isUtilityType === "No") ? { opacity: 0.6 } : {}}
                    >
                      <MenuItem value="" disabled>Select Option</MenuItem>
                      <MenuItem value="Yes">Yes</MenuItem>
                      <MenuItem value="No">No</MenuItem>
                    </Select>
                  </Box>
                </Grid2>
              </Box>

              {(() => {
                const amount = form.status === "Published" ? 5000 : (form.status === "Granted" ? 15000 : 0);
                let expectedAmt = amount;
                if (form.applyingSeedGrant === "Yes") expectedAmt = expectedAmt / 2;
                if (form.isUtilityType === "No") expectedAmt = 0;
                
                if (form.applyIncentive === "Yes" && form.status && form.isUtilityType !== "No") {
                  return (
                    <Box sx={{
                      gridColumn: { sm: "1 / -1" },
                      p: 2.5,
                      borderRadius: "12px",
                      background: "rgba(16, 185, 129, 0.05)",
                      border: "1px dashed rgba(16, 185, 129, 0.3)",
                      mb: 2
                    }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                        <Box>
                          <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#059669" }}>
                            Estimated Research Incentive Amount
                          </Typography>
                          <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: "#047857", mt: 0.5 }}>
                            ₹{expectedAmt.toLocaleString('en-IN')}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                }
                return null;
              })()}

              {form.applyIncentive === "Yes" && (
                <Box>
                  <Typography sx={labelStyle}>Approved Incentive Amount (₹) : *</Typography>
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    placeholder="Enter approved amount"
                    value={form.approvedAmount}
                    onChange={set("approvedAmount")}
                  />
                </Box>
              )}
              <Box>
                <Typography sx={labelStyle}>Article Eligibility for Appraisal : *</Typography>
                <Select
                  size="small" fullWidth displayEmpty
                  value={form.appraisalEligible}
                  onChange={set("appraisalEligible")}
                  disabled={form.isInstitutionRecord === "Yes"}
                  sx={form.isInstitutionRecord === "Yes" ? { opacity: 0.6 } : {}}
                >
                  <MenuItem value="" disabled>Select Option</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </Box>
            </Grid2>
          </FormCard>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <SubmitBtn onClick={handleSubmit} disabled={loading || !isTargetFacultyValid}>
              {loading ? "Submitting..." : "Submit Patent Record Directly"}
            </SubmitBtn>
          </Box>
        </>
      )}
    </PageContainer>
  );
}
