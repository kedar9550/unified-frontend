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
  FormCard, Grid2, SubLabel, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import { labelStyle } from "../../components/faculty/publicationConstants";
import API from "../../api/axios";

const PATENT_STATUSES = ["Filed", "Published", "Granted"];
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

  const [form, setForm] = useState({
    title: "",
    applicantName: "",
    patentName: "Aditya University",
    area: "",
    filingNo: "",
    dateOfFiling: "",
    status: "Filed",
    patentFiledCountry: "India",
    customCountryName: "",
    applyingSeedGrant: "No",
    applyIncentive: "No",
    totalInventors: 1,
    otherInventors: []
  });
  const [files, setFiles] = useState({ eFilingReceipt: null, form1: null });
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
      const existing = form.otherInventors.find(a => a.inventorPosition === i);
      newOtherInventors.push(existing || {
        inventorPosition: i,
        affiliationType: "Aditya University",
        empId: "",
        name: "",
        affiliation: "Aditya University"
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
    if (!form.title || !form.filingNo || !form.dateOfFiling) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!/^[A-Za-z0-9\/.-]+$/.test(form.filingNo)) {
      toast.error("Patent Filing No can only contain letters, numbers, '/', '.', and '-'");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      const coInventorsList = form.otherInventors.map(a => ({
        name: a.name || "",
        affiliation: a.affiliationType === "Aditya University" ? "Aditya University" : (a.affiliation || ""),
        employeeId: a.affiliationType === "Aditya University" ? a.empId : null
      })).filter(ca => ca.name && ca.affiliation);

      fd.append("title", form.title);
      fd.append("applicantName", form.applicantName || targetFacultyName || "");
      fd.append("patentName", form.patentName);
      fd.append("area", form.area);
      fd.append("filingNo", form.filingNo);
      fd.append("dateOfFiling", form.dateOfFiling);
      fd.append("status", form.status);
      fd.append("patentFiledCountry", form.patentFiledCountry === 'Others' ? form.customCountryName : form.patentFiledCountry);
      fd.append("coInventors", JSON.stringify(coInventorsList));
      fd.append("applyIncentive", form.applyIncentive);
      fd.append("applyingSeedGrant", form.applyingSeedGrant);
      fd.append("totalInventors", String(form.totalInventors));
      fd.append("academicYear", selectedYear);
      fd.append("isDirectEntry", "true");
      fd.append("targetFacultyEmpId", targetFacultyEmpId);

      if (files.eFilingReceipt) fd.append("eFilingReceipt", files.eFilingReceipt);
      if (files.form1) fd.append("form1", files.form1);

      await API.post("/api/research/patent", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Patent record added directly for faculty!");
      setForm({
        title: "", applicantName: "", patentName: "Aditya University", area: "", filingNo: "", dateOfFiling: "",
        status: "Filed", patentFiledCountry: "India", customCountryName: "", applyingSeedGrant: "No", applyIncentive: "No",
        totalInventors: 1, otherInventors: []
      });
      setFiles({ eFilingReceipt: null, form1: null });
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

      {/* Details of the Patent */}
      <FormCard title="Patent Details">
        <Grid2>
          <Box>
            <Typography sx={labelStyle}>Academic Year :</Typography>
            <Select fullWidth size="small" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {academicYears.map(y => <MenuItem key={y._id} value={y._id}>{y.yearRange || y.year}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography sx={labelStyle}>Title of the Patent : <span style={{ color: 'red' }}>*</span></Typography>
            <TextField size="small" fullWidth multiline rows={2} value={form.title} onChange={set("title")} placeholder="Full title of the patent" />
          </Box>
          <Box>
            <Typography sx={labelStyle}>Name of the Applicant in Patent : <span style={{ color: 'red' }}>*</span></Typography>
            <Select size="small" fullWidth displayEmpty value={form.patentName} onChange={set("patentName")}>
              {PATENT_APPLICANTS.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box>
            <Typography sx={labelStyle}>Area of Patent :</Typography>
            <TextField size="small" fullWidth value={form.area} onChange={set("area")} placeholder="e.g. AI / Embedded Systems" />
          </Box>
          <Box>
            <Typography sx={labelStyle}>Patent Filing No : <span style={{ color: 'red' }}>*</span></Typography>
            <TextField
              size="small"
              fullWidth
              value={form.filingNo}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^[A-Za-z0-9\/.-]+$/.test(val)) {
                  setForm(p => ({ ...p, filingNo: val }));
                }
              }}
              placeholder="e.g. 202341012345"
            />
          </Box>
          <Box>
            <Typography sx={labelStyle}>Date of Filing : <span style={{ color: 'red' }}>*</span></Typography>
            <TextField size="small" fullWidth type="date" value={form.dateOfFiling} onChange={set("dateOfFiling")} slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
          <Box>
            <Typography sx={labelStyle}>Status of Patent Application :</Typography>
            <Select size="small" fullWidth value={form.status} onChange={set("status")}>
              {PATENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography sx={labelStyle}>Patent Filed Country :</Typography>
            <Select size="small" fullWidth value={form.patentFiledCountry} onChange={set("patentFiledCountry")}>
              <MenuItem value="India">India</MenuItem>
              <MenuItem value="Others">Others</MenuItem>
            </Select>
          </Box>
          {form.patentFiledCountry === 'Others' && (
            <Box>
              <Typography sx={labelStyle}>Enter Country Name :</Typography>
              <TextField size="small" fullWidth value={form.customCountryName} onChange={set("customCountryName")} placeholder="e.g. USA, UK" />
            </Box>
          )}
          <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
            <Typography sx={labelStyle}>Total Number of Inventors :</Typography>
            <TextField
              size="small"
              type="number"
              value={form.totalInventors}
              onChange={set("totalInventors")}
              slotProps={{ htmlInput: { min: 1 } }}
              sx={{ maxWidth: 250 }}
            />
          </Box>
          {parseInt(form.totalInventors) > 1 && (
            <Box sx={{ gridColumn: { sm: "1 / -1" }, background: "var(--bg-panel)", p: 2, borderRadius: "12px", border: "1px solid var(--border-color)" }}>
              <Typography sx={{ ...labelStyle, mb: 1, fontWeight: 700 }}>Name & Affiliation of Co-Inventor(s) :</Typography>
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
                            onChange={(e) => {
                              const val = e.target.value;
                              handleCoInventorChange(ca.inventorPosition, "empId", val);
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
                    ) : (
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
                            onChange={(e) => handleCoInventorChange(ca.inventorPosition, "affiliation", e.target.value)}
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
      <FormCard title="Attachments & Additional Information" icon={<AttachFile sx={{ color: "var(--color-primary)" }} />}>
        <Grid2>
          <FileField label="e-Filing Receipt Document:" onChange={(e) => setFiles(p => ({ ...p, eFilingReceipt: e.target.files[0] }))} />
          <FileField label="Form-1 Document:" onChange={(e) => setFiles(p => ({ ...p, form1: e.target.files[0] }))} />
          <Box>
            <Typography sx={labelStyle}>Applying as a Seed Grant Work?</Typography>
            <Select size="small" fullWidth value={form.applyingSeedGrant} onChange={set("applyingSeedGrant")}>
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
          </Box>
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
          {loading ? "Submitting..." : "Submit Patent Record Directly"}
        </SubmitBtn>
      </Box>
    </PageContainer>
  );
}
