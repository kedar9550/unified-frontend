import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Box, TextField, MenuItem, Select, Typography, Button, Grid
} from "@mui/material";
import { toast } from "sonner";
import { Search, AttachFile, MenuBook, Person } from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import PageContainer from "../../components/common/design-system/PageContainer";
import {
  FormCard, FieldLabel, FileField, SubmitBtn
} from "../../components/faculty/PublicationFormFields";
import {
  MONTHS, YEARS
} from "../../components/faculty/publicationConstants";
import API from "../../api/axios";

export default function RndTextbookDataEntry() {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  const [targetFacultyEmpId, setTargetFacultyEmpId] = useState("");
  const [targetFacultyName, setTargetFacultyName] = useState("");
  const [isTargetFacultyValid, setIsTargetFacultyValid] = useState(false);
  const [verifyingFaculty, setVerifyingFaculty] = useState(false);
  const [targetFacultyDetails, setTargetFacultyDetails] = useState(null);

  const [form, setForm] = useState({
    title: "", publisher: "", isbn: "", edition: "",
    month: "", year: "", scope: "", applyIncentive: "", applyingSeedGrant: "",
    totalAuthors: 1, userAuthorPosition: 1, otherAuthors: []
  });
  const [files, setFiles] = useState({ coverPage: null, indexPage: null });
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

  const handleVerifyFaculty = async () => {
    if (!targetFacultyEmpId.trim()) { toast.error("Please enter Employee ID"); return; }
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
        }
      } else {
        toast.error("Faculty not found with given Employee ID");
        setIsTargetFacultyValid(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to verify faculty");
      setIsTargetFacultyValid(false);
    } finally {
      setVerifyingFaculty(false);
    }
  };

  const handleSubmit = async () => {
    if (!targetFacultyEmpId || !isTargetFacultyValid) {
      toast.error("Please verify a valid Target Faculty Employee ID first");
      return;
    }
    if (!form.title || !form.publisher || !form.isbn || !form.month || !form.year) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!files.coverPage) {
      toast.error("Please attach the Cover Page document");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => {
        if (k === "otherAuthors") {
          const coAuthorsList = form.otherAuthors.map(a => ({
            name: a.authorName || "",
            affiliation: a.affiliationType === "Aditya University" ? "Aditya University" : (a.affiliationName || ""),
            employeeId: a.affiliationType === "Aditya University" ? a.empId : null,
            authorPosition: a.authorPosition
          })).filter(ca => ca.name && ca.affiliation);
          fd.append("coAuthors", JSON.stringify(coAuthorsList));
        } else {
          fd.append(k, form[k]);
        }
      });

      fd.append("academicYear", selectedYear);
      fd.append("isDirectEntry", "true");
      fd.append("targetFacultyEmpId", targetFacultyEmpId);

      if (files.coverPage) fd.append("coverPage", files.coverPage);
      if (files.indexPage) fd.append("indexPage", files.indexPage);

      await API.post("/api/research/textbook", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Textbook publication record added directly for faculty!");
      setForm({
        title: "", publisher: "", isbn: "", edition: "",
        month: "", year: "", scope: "", applyIncentive: "", applyingSeedGrant: "",
        totalAuthors: 1, userAuthorPosition: 1, otherAuthors: []
      });
      setFiles({ coverPage: null, indexPage: null });
      setTargetFacultyEmpId("");
      setIsTargetFacultyValid(false);
      setTargetFacultyDetails(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit textbook publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Textbook Data Entry (R&D Direct Entry)"
        subtitle="Add textbook publication records directly on behalf of faculty members"
      />

      <FormCard title="1. Target Faculty Identification" icon={<Person sx={{ color: "var(--color-primary)" }} />}>
        <Grid container spacing={2.5} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Target Faculty Employee ID</FieldLabel>
            <TextField
              fullWidth size="small" placeholder="e.g. 10024"
              value={targetFacultyEmpId}
              onChange={(e) => {
                setTargetFacultyEmpId(e.target.value);
                setIsTargetFacultyValid(false);
                setTargetFacultyDetails(null);
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ mt: 2.5 }}>
            <Button
              variant="contained"
              onClick={handleVerifyFaculty}
              disabled={verifyingFaculty || !targetFacultyEmpId}
              startIcon={<Search />}
              sx={{ background: "var(--gradient-primary)", color: "#fff", textTransform: "none", fontWeight: 700 }}
            >
              {verifyingFaculty ? "Verifying..." : "Verify Faculty"}
            </Button>
          </Grid>
          {isTargetFacultyValid && targetFacultyDetails && (
            <Grid item xs={12}>
              <Box sx={{ p: 2, background: "rgba(16, 185, 129, 0.08)", border: "1px solid #10b981", borderRadius: "10px" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#065f46" }}>
                  ✓ Verified: {targetFacultyDetails.name} ({targetFacultyDetails.designation || "Faculty"} - {targetFacultyDetails.department || "Dept"})
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </FormCard>

      <FormCard title="2. Textbook Details" icon={<MenuBook sx={{ color: "var(--color-primary)" }} />}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel>Academic Year</FieldLabel>
            <Select fullWidth size="small" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {academicYears.map(y => <MenuItem key={y._id} value={y._id}>{y.yearRange}</MenuItem>)}
            </Select>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Textbook Title</FieldLabel>
            <TextField fullWidth size="small" value={form.title} onChange={set("title")} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Publisher</FieldLabel>
            <TextField fullWidth size="small" value={form.publisher} onChange={set("publisher")} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>ISBN</FieldLabel>
            <TextField fullWidth size="small" value={form.isbn} onChange={set("isbn")} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel>Edition</FieldLabel>
            <TextField fullWidth size="small" value={form.edition} onChange={set("edition")} placeholder="e.g. 1st Edition" />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Month</FieldLabel>
            <Select fullWidth size="small" value={form.month} onChange={set("month")}>
              {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FieldLabel required>Year</FieldLabel>
            <Select fullWidth size="small" value={form.year} onChange={set("year")}>
              {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </Grid>
        </Grid>
      </FormCard>

      <FormCard title="3. Attachments" icon={<AttachFile sx={{ color: "var(--color-primary)" }} />}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <FieldLabel required>Cover Page Document</FieldLabel>
            <FileField onChange={(e) => setFiles(p => ({ ...p, coverPage: e.target.files[0] }))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FieldLabel>Index / Contents Page Document</FieldLabel>
            <FileField onChange={(e) => setFiles(p => ({ ...p, indexPage: e.target.files[0] }))} />
          </Grid>
        </Grid>
      </FormCard>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <SubmitBtn onClick={handleSubmit} disabled={loading || !isTargetFacultyValid}>
          {loading ? "Submitting..." : "Submit Record Directly"}
        </SubmitBtn>
      </Box>
    </PageContainer>
  );
}
