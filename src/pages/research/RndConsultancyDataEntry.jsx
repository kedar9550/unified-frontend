import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Box, TextField, MenuItem, Select, Typography, Button
} from "@mui/material";
import { toast } from "sonner";
import { Search, AttachFile } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/design-system/PageContainer";
import {
  FormCard, Grid2, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import { labelStyle, MONTHS, YEARS } from "../../components/faculty/publicationConstants";
import API from "../../api/axios";

const INVESTIGATOR_TYPES = ["Principal Investigator (PI)", "Co-Principal Investigator (Co-PI)"];
const PROJECT_STATUSES = ["Sanctioned", "Ongoing", "Completed"];

export default function RndConsultancyDataEntry() {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  const [targetFacultyEmpId, setTargetFacultyEmpId] = useState("");
  const [targetFacultyName, setTargetFacultyName] = useState("");
  const [isTargetFacultyValid, setIsTargetFacultyValid] = useState(false);
  const [verifyingFaculty, setVerifyingFaculty] = useState(false);
  const [targetFacultyDetails, setTargetFacultyDetails] = useState(null);

  const [form, setForm] = useState({
    title: "",
    fundingAgency: "",
    amount: "",
    duration: "",
    month: "",
    year: "",
    investigatorType: "Principal Investigator (PI)",
    projectStatus: "Sanctioned",
    applyingSeedGrant: "No",
    applyIncentive: "No",
    totalInvestigators: 1,
    otherInvestigatorsList: []
  });

  const [files, setFiles] = useState({ sanctionOrder: null });
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

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

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
      for (let i = 1; i <= total - 1; i++) {
        const existing = form.otherInvestigatorsList[i - 1];
        newOtherInvestigators.push(existing || {
          investigatorPosition: i + 1,
          role: "Co-Investigator",
          affiliationType: "Aditya University",
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
          affiliationType: "Aditya University",
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
          if (value === "Aditya University") {
            newA.affiliation = "Aditya University";
            newA.name = "";
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

    if (field === "empId" && value.length >= 3) {
      const inv = updated.find(a => a.investigatorPosition === pos);
      if (inv && inv.affiliationType === "Aditya University") {
        fetchCoInvestigatorName(pos, value);
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
    if (!form.title || !form.fundingAgency || !form.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => {
        if (k === "otherInvestigatorsList") {
          fd.append(k, JSON.stringify(form[k]));
        } else {
          fd.append(k, form[k]);
        }
      });

      fd.append("academicYear", selectedYear);
      fd.append("isDirectEntry", "true");
      fd.append("targetFacultyEmpId", targetFacultyEmpId);

      if (files.sanctionOrder) fd.append("sanctionOrder", files.sanctionOrder);

      await API.post("/api/research/consultancy", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Consultancy record added directly for faculty!");
      setForm({
        title: "", fundingAgency: "", amount: "", duration: "", month: "", year: "",
        investigatorType: "Principal Investigator (PI)", projectStatus: "Sanctioned",
        applyingSeedGrant: "No", applyIncentive: "No", totalInvestigators: 1, otherInvestigatorsList: []
      });
      setFiles({ sanctionOrder: null });
      setTargetFacultyEmpId("");
      setIsTargetFacultyValid(false);
      setTargetFacultyDetails(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit consultancy project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Consultancy Data Entry (R&D Direct Entry)"
        subtitle="Add consultancy project records directly on behalf of faculty members with immediate approval"
      />

      {/* Target Faculty Section */}
      <FormCard title="Target Faculty Identification">
        <Grid2>
          <Box>
            <Typography sx={{ ...labelStyle, mb: 0.5 }}>TARGET FACULTY EMPLOYEE ID : <span style={{ color: 'red' }}>*</span></Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Enter Employee ID (e.g., ADITYA123)"
                value={targetFacultyEmpId}
                onChange={(e) => {
                  setTargetFacultyEmpId(e.target.value);
                  setIsTargetFacultyValid(false);
                  setTargetFacultyName("");
                  setTargetFacultyDetails(null);
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
          <Box>
            <Typography sx={{ ...labelStyle, mb: 0.5 }}>VERIFIED FACULTY NAME :</Typography>
            <TextField
              size="small"
              fullWidth
              disabled
              value={targetFacultyName}
              placeholder="Verified faculty name will appear here"
              sx={{ background: "rgba(0,0,0,0.02)" }}
            />
          </Box>
        </Grid2>
        {isTargetFacultyValid && targetFacultyDetails && (
          <Box sx={{ mt: 2, p: 2, background: "rgba(16, 185, 129, 0.08)", border: "1px solid #10b981", borderRadius: "10px" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#065f46" }}>
              ✓ Verified: {targetFacultyDetails.name} ({targetFacultyDetails.designation || "Faculty"} - {targetFacultyDetails.department || "Dept"})
            </Typography>
          </Box>
        )}
      </FormCard>

      {/* Consultancy Details */}
      <FormCard title="Consultancy Details">
        <Grid2>
          <Box>
            <Typography sx={labelStyle}>Academic Year :</Typography>
            <Select fullWidth size="small" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {academicYears.map(y => <MenuItem key={y._id} value={y._id}>{y.yearRange || y.year}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography sx={labelStyle}>Title of Consultancy Project : <span style={{ color: 'red' }}>*</span></Typography>
            <TextField fullWidth size="small" multiline rows={2} value={form.title} onChange={set("title")} placeholder="Consultancy Project Title" />
          </Box>
          <Box>
            <Typography sx={labelStyle}>Client / Funding Agency Name : <span style={{ color: 'red' }}>*</span></Typography>
            <TextField fullWidth size="small" value={form.fundingAgency} onChange={set("fundingAgency")} placeholder="Organization Name" />
          </Box>
          <Box>
            <Typography sx={labelStyle}>Sanctioned Amount (₹) : <span style={{ color: 'red' }}>*</span></Typography>
            <TextField fullWidth type="number" size="small" value={form.amount} onChange={set("amount")} placeholder="Amount in INR" />
          </Box>
          <Box>
            <Typography sx={labelStyle}>Duration (Months) :</Typography>
            <TextField fullWidth type="number" size="small" value={form.duration} onChange={set("duration")} placeholder="Duration in months" />
          </Box>
          <Box>
            <Typography sx={labelStyle}>Investigator Role :</Typography>
            <Select fullWidth size="small" value={form.investigatorType} onChange={set("investigatorType")}>
              {INVESTIGATOR_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography sx={labelStyle}>Project Status :</Typography>
            <Select fullWidth size="small" value={form.projectStatus} onChange={set("projectStatus")}>
              {PROJECT_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography sx={labelStyle}>Sanction Month :</Typography>
            <Select fullWidth size="small" value={form.month} onChange={set("month")}>
              <MenuItem value="">Select Month</MenuItem>
              {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography sx={labelStyle}>Sanction Year :</Typography>
            <Select fullWidth size="small" value={form.year} onChange={set("year")}>
              <MenuItem value="">Select Year</MenuItem>
              {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </Box>

          <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
            <Typography sx={labelStyle}>Total Number of Investigators :</Typography>
            <TextField
              size="small"
              type="number"
              value={form.totalInvestigators}
              onChange={set("totalInvestigators")}
              slotProps={{ htmlInput: { min: 1 } }}
              sx={{ maxWidth: 250 }}
            />
          </Box>

          {parseInt(form.totalInvestigators) > 1 && (
            <Box sx={{ gridColumn: { sm: "1 / -1" }, background: "var(--bg-panel)", p: 2, borderRadius: "12px", border: "1px solid var(--border-color)" }}>
              <Typography sx={{ ...labelStyle, mb: 1, fontWeight: 700 }}>Other Investigators Details :</Typography>
              {form.otherInvestigatorsList.map((ca) => (
                <Box key={ca.investigatorPosition} sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2, p: 2, borderRadius: "12px", border: "1px dashed var(--border-color)", background: "var(--bg-accent-1)" }}>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: { xs: "wrap", sm: "nowrap" }, alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", px: 1.5, py: 0.5, background: "var(--color-primary)", color: "#fff", borderRadius: "6px", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                      {ca.role}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: "150px" }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION TYPE</Typography>
                      <Select
                        size="small"
                        fullWidth
                        value={ca.affiliationType}
                        onChange={(e) => handleCoInvestigatorChange(ca.investigatorPosition, "affiliationType", e.target.value)}
                      >
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
                    ) : (
                      <>
                        <Box sx={{ flex: 1, minWidth: "180px" }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>NAME</Typography>
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
                            placeholder="Organization / College"
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
      </FormCard>

      {/* Attachments Section */}
      <FormCard title="Attachments & Options" icon={<AttachFile sx={{ color: "var(--color-primary)" }} />}>
        <Grid2>
          <FileField label="Sanction Order / Work Order Document:" onChange={(e) => setFiles(p => ({ ...p, sanctionOrder: e.target.files[0] }))} />
          <Box>
            <Typography sx={labelStyle}>Apply for Incentive?</Typography>
            <Select size="small" fullWidth value={form.applyIncentive} onChange={set("applyIncentive")}>
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
          </Box>
        </Grid2>
      </FormCard>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <SubmitBtn onClick={handleSubmit} disabled={loading || !isTargetFacultyValid}>
          {loading ? "Submitting..." : "Submit Consultancy Record Directly"}
        </SubmitBtn>
      </Box>
    </PageContainer>
  );
}
