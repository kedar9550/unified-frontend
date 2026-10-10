import { useState, useEffect } from "react";
import { Box, TextField, MenuItem, Select, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Grid, Card, Chip, Divider, Tooltip, TablePagination, FormControl, Radio, RadioGroup, FormControlLabel } from "@mui/material";
import { toast } from "sonner";
import { AddCircle, Delete, Close, Description, Download, AttachFile, Groups, WorkspacePremium, Visibility, Edit, CheckCircle, Cancel, AccessTime, Settings } from "@mui/icons-material";
import SchoolIcon from "@mui/icons-material/School";
import PublicIcon from "@mui/icons-material/Public";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CategoryIcon from "@mui/icons-material/Category";
import ArticleIcon from "@mui/icons-material/Article";
import GrassIcon from "@mui/icons-material/Grass";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import PersonIcon from "@mui/icons-material/Person";
import HandshakeIcon from "@mui/icons-material/Handshake";
import PageHeader from "../../components/common/PageHeader";
import { Alert, AlertTitle } from "@mui/material";
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
  const [appraisalConfigActive, setAppraisalConfigActive] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [form, setForm] = useState({
    facultyRole: "", applicantAffiliation: "",
    title: "", applicantName: "", patentName: "Aditya University", patentFiledInInstitution: "Yes", isUtilityType: "Yes", area: "", applicationNo: "", dateOfFiling: "",
    status: "", isStudentsInvolved: "No", applyIncentive: "", applyingSeedGrant: "", eligibleForTechTransfer: "No",
    patentFiledCountry: "", customCountryName: "",
    totalInventors: 1, otherInventors: [],
    publishedstatus: "no", publishedexpectedamount: "", publishedinsentiveampunt: "", publisheddate: "", publishedinsentiveappllieddate: "",
    grantedstatus: "no", grantedexpectedamount: "", grantedinsentiveampunt: "", granteddate: "", grantedinsentiveappllieddate: ""
  });
  const [files, setFiles] = useState({ cbr: null, form1: null, grantedCertificate: null });
  const [existingFiles, setExistingFiles] = useState({ cbr: null, form1: null, grantedCertificate: null });
  const [deleteFlags, setDeleteFlags] = useState({ cbr: false, form1: false, grantedCertificate: false });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [updateStatusExpanded, setUpdateStatusExpanded] = useState(false);
  const [statusUpdateForm, setStatusUpdateForm] = useState({ granteddate: "", eligibleForTechTransfer: "No" });
  const [statusUpdateFile, setStatusUpdateFile] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const handleStatusUpdateSubmit = async () => {
    if (!statusUpdateForm.granteddate || !statusUpdateFile) {
      toast.error("Please provide both granted date and granted certificate");
      return;
    }
    setStatusUpdateLoading(true);
    try {
      const fd = new FormData();
      fd.append("granteddate", statusUpdateForm.granteddate);
      fd.append("eligibleForTechTransfer", statusUpdateForm.eligibleForTechTransfer);
      fd.append("grantedCertificate", statusUpdateFile);
      
      const res = await API.patch(`/api/research/patent/${selectedPubDetails._id}/update-status`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      
      toast.success("Patent status updated to Granted!");
      const updatedPatent = res.data.data;
      setPublicationsList(prev => prev.map(p => p._id === updatedPatent._id ? updatedPatent : p));
      setSelectedPubDetails(updatedPatent);
      setUpdateStatusExpanded(false);
      setStatusUpdateForm({ granteddate: "", eligibleForTechTransfer: "No" });
      setStatusUpdateFile(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update patent status");
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleEditClick = (pub) => {
    setEditMode(true);
    setEditId(pub._id);
    setSelectedYear(pub.academicYear?._id || pub.academicYear);

    const mappedAuthors = [];
    if (pub.coInventors && pub.coInventors.length > 0) {
      let positionCounter = 1;
      const total = parseInt(pub.totalInventors) || 1;
      const myPos = parseInt(pub.userInventorPosition) || 1;

      for (let i = 1; i <= total; i++) {
        if (i === myPos) continue;
        const ca = pub.coInventors[positionCounter - 1];
        if (ca) {
          const isInternal = ca.employeeId ? true : false;
          mappedAuthors.push({
            inventorPosition: i,
            affiliationType: isInternal ? "Aditya University" : "Others",
            empId: isInternal ? (ca.employeeId?.institutionId || ca.employeeId) : "",
            name: ca.name || "",
            affiliation: ca.affiliation || ""
          });
          positionCounter++;
        }
      }
    }

    setForm({
      facultyRole: pub.facultyRole || "",
      applicantAffiliation: pub.applicantAffiliation || "",
      title: pub.title || "",
      applicantName: pub.applicantName || user?.name || "",
      patentName: pub.patentName || "",
      patentFiledInInstitution: pub.patentFiledInInstitution || "Yes",
      isUtilityType: pub.isUtilityType || "Yes",
      area: pub.area || "",
      applicationNo: pub.applicationNo || pub.applicationnumber || "",
      dateOfFiling: pub.dateOfFiling ? pub.dateOfFiling.split('T')[0] : "",
      status: pub.patentStatus || pub.status || "",
      isStudentsInvolved: pub.isStudentsInvolved || "No",
      applyIncentive: pub.applyIncentive || "",
      applyingSeedGrant: pub.applyingSeedGrant || "",
      eligibleForTechTransfer: pub.eligibleForTechTransfer || "No",
      patentFiledCountry: pub.patentFiledCountry || "India",
      customCountryName: "",
      totalInventors: pub.totalInventors || 1,
      otherInventors: mappedAuthors,
      publishedstatus: pub.published?.publishedstatus || "no",
      publishedexpectedamount: pub.published?.publishedexpectedamount || "",
      publishedinsentiveampunt: pub.published?.publishedinsentiveampunt || "",
      publisheddate: pub.published?.publisheddate ? pub.published.publisheddate.split('T')[0] : "",
      publishedinsentiveappllieddate: pub.published?.publishedinsentiveappllieddate ? pub.published.publishedinsentiveappllieddate.split('T')[0] : "",
      grantedstatus: pub.granted?.grantedstatus || "no",
      grantedexpectedamount: pub.granted?.grantedexpectedamount || "",
      grantedinsentiveampunt: pub.granted?.grantedinsentiveampunt || "",
      granteddate: pub.granted?.granteddate ? pub.granted.granteddate.split('T')[0] : "",
      grantedinsentiveappllieddate: pub.granted?.grantedinsentiveappllieddate ? pub.granted.grantedinsentiveappllieddate.split('T')[0] : ""
    });
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:9000";
    setExistingFiles({
      cbr: pub.cbr ? `${backendUrl}${pub.cbr}` : null,
      form1: pub.form1 ? `${backendUrl}${pub.form1}` : null,
      grantedCertificate: pub.grantedCertificate ? `${backendUrl}${pub.grantedCertificate}` : null,
    });
    setFiles({ cbr: null, form1: null, grantedCertificate: null });
    setDeleteFlags({ cbr: false, form1: false, grantedCertificate: false });
    setViewMode("form");
  };

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

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm((p) => {
      const newForm = { ...p, [k]: val };
      if (k === "status") {
        if (val === "Published") {
          newForm.publishedstatus = "yes";
          newForm.grantedstatus = "no";
          newForm.grantedexpectedamount = "";
          newForm.grantedinsentiveampunt = "";
          newForm.granteddate = "";
          newForm.grantedinsentiveappllieddate = "";
        } else if (val === "Granted") {
          newForm.grantedstatus = "yes";
        }
      }
      return newForm;
    });
  };
  const setFile = (k) => (e) => setFiles((p) => ({ ...p, [k]: e.target.files[0] }));

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

    // Fetch name if Aditya University and Employee ID is entered (length >= 3)
    if (field === "empId" && value.length >= 3) {
      const inventor = updated.find(a => a.inventorPosition === pos);
      if (inventor && inventor.affiliationType === "Aditya University") {
        fetchCoInventorName(pos, value);
      }
    }
  };

  const handleSubmit = async () => {
    const finalFacultyRole = form.patentFiledInInstitution === "Yes" ? "Inventor / Co-Inventor" : form.facultyRole;
    const finalPatentName = form.patentFiledInInstitution === "Yes" ? "Aditya University" : (finalFacultyRole === "Applicant" ? (user?.name || "") : form.patentName);
    const finalApplicantAffiliation = form.patentFiledInInstitution === "Yes" ? "Aditya University" : (finalFacultyRole === "Applicant" ? (user?.college || "") : form.applicantAffiliation);

    if (form.patentFiledInInstitution === "No" && !finalFacultyRole) {
      toast.error("Please select your role in the patent");
      return;
    }
    if (finalFacultyRole === "Inventor / Co-Inventor" && (!finalPatentName || !finalApplicantAffiliation)) {
      toast.error("Please provide the Name of the Applicant and Applicant Affiliation");
      return;
    }
    if (!form.title || !form.applicationNo || (form.status !== 'Granted' && !form.dateOfFiling)) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!/^[A-Za-z0-9\/.-]+$/.test(form.applicationNo)) {
      toast.error("Patent Application No can only contain letters, numbers, '/', '.', and '-'");
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
    if (form.dateOfFiling) {
      const selDate = new Date(form.dateOfFiling);
      selDate.setHours(0, 0, 0, 0);
      if (selDate > today) {
        toast.error("Date of filing cannot be in the future");
        return;
      }
    }

    // Validate co-inventors dynamically
    const total = parseInt(form.totalInventors) || 1;
    if (total < 1) {
      toast.error("Total number of inventors must be at least 1");
      return;
    }
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
          if (a.CoInventorType === 'student') {
            if (!a.studentId || !a.name) {
              toast.error(`Please provide Student Roll No and Name for Inventor Position ${a.inventorPosition}`);
              return;
            }
          } else {
            if (!a.empId || !a.name) {
              toast.error(`Please provide Employee ID and verify Name for Inventor Position ${a.inventorPosition}`);
              return;
            }
          }
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

      fd.append("facultyRole", finalFacultyRole);
      fd.append("applicantAffiliation", finalApplicantAffiliation);
      fd.append("title", form.title);
      fd.append("applicantName", user?.name || "");
      fd.append("patentName", finalPatentName);
      fd.append("patentFiledInInstitution", form.patentFiledInInstitution || "Yes");
      fd.append("isUtilityType", form.isUtilityType || "Yes");
      fd.append("area", form.area);
      fd.append("applicationNo", form.applicationNo);
      fd.append("dateOfFiling", form.dateOfFiling);
      fd.append("status", form.status);
      fd.append("patentFiledCountry", form.patentFiledCountry === 'Others' ? form.customCountryName : form.patentFiledCountry);
      fd.append("coInventors", JSON.stringify(coInventorsList));
      fd.append("isStudentsInvolved", form.isStudentsInvolved || "No");
      const isUtilityTypeNo = form.isUtilityType === "No";
      const applyIncentive = (parseInt(form.userInventorPosition || 1) > 5 || isUtilityTypeNo) ? "No" : form.applyIncentive;
      fd.append("applyIncentive", applyIncentive);
      fd.append("applyingSeedGrant", form.applyingSeedGrant);
      fd.append("eligibleForTechTransfer", form.eligibleForTechTransfer || "No");
      const total = form.otherInventors.length + 1;
      fd.append("totalInventors", String(total));

      let expectedAmt = form.status === "Published" ? 5000 : (form.status === "Granted" ? 15000 : 0);
      if (form.applyingSeedGrant === "Yes") expectedAmt = expectedAmt / 2;
      if (isUtilityTypeNo) expectedAmt = 0;

      fd.append("publishedstatus", form.publishedstatus);
      fd.append("publishedexpectedamount", (applyIncentive === "Yes" && form.status === "Published") ? expectedAmt : "");
      fd.append("publishedinsentiveampunt", form.publishedinsentiveampunt);
      fd.append("publisheddate", form.publisheddate);
      fd.append("publishedinsentiveappllieddate", form.publishedinsentiveappllieddate);
      
      fd.append("grantedstatus", form.grantedstatus);
      fd.append("grantedexpectedamount", (applyIncentive === "Yes" && form.status === "Granted") ? expectedAmt : "");
      fd.append("grantedinsentiveampunt", form.grantedinsentiveampunt);
      fd.append("granteddate", form.granteddate);
      fd.append("grantedinsentiveappllieddate", form.grantedinsentiveappllieddate);

      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (deleteFlags.cbr) fd.append("deleteCbr", "true");
      if (deleteFlags.form1) fd.append("deleteForm1", "true");
      if (deleteFlags.grantedCertificate) fd.append("deleteGrantedCertificate", "true");

      fd.append("academicYear", selectedYear);
      fd.append("college", user?.college || "");
      fd.append("panNumber", user?.panNumber || "");

      if (editMode) {
        await API.put(`/api/research/patent/${editId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Patent resubmitted successfully!");
      } else {
        await API.post("/api/research/patent", fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Patent submitted successfully!");
      }

      setForm({ facultyRole: "", applicantAffiliation: "", title: "", applicantName: user?.name || "", patentName: "Aditya University", patentFiledInInstitution: "Yes", isUtilityType: "Yes", area: "", applicationnumber: "", dateOfFiling: "", status: "", isStudentsInvolved: "No", applyIncentive: "", applyingSeedGrant: "", eligibleForTechTransfer: "No", patentFiledCountry: "", customCountryName: "", totalInventors: 1, otherInventors: [], publishedstatus: "no", publishedexpectedamount: "", publishedinsentiveampunt: "", publisheddate: "", publishedinsentiveappllieddate: "", grantedstatus: "no", grantedexpectedamount: "", grantedinsentiveampunt: "", granteddate: "", grantedinsentiveappllieddate: "" });
      setFiles({ cbr: null, form1: null, grantedCertificate: null });
      setExistingFiles({ cbr: null, form1: null, grantedCertificate: null });
      setDeleteFlags({ cbr: false, form1: false, grantedCertificate: false });
      setEditMode(false);
      setEditId(null);
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
      <Box sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: "center",
        gap: { xs: 2, sm: 0 },
        mb: 3
      }}>
        <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800, textAlign: { xs: "center", sm: "left" } }}>My Patent Publications</Typography>
        <Button
          variant="contained"
          onClick={() => {
            const activeYear = academicYears.length > 0;
            if (activeYear) {
              setSelectedYear("");
              setViewMode("select-year");
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
          <Table sx={{ minWidth: 1100 }}>
            <TableHead sx={{ background: "var(--gradient-primary)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Area</TableCell>

                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Applicant</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Co-Inventors</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Status / Remarks</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {publicationsList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((pub, i) => (
                <TableRow key={pub._id || i} sx={{ "&:hover": { background: "rgba(var(--color-primary-rgb, 99,102,241), 0.04)", transition: "background 0.2s" } }}>
                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 500, py: 2 }}>{pub.title || "N/A"}</TableCell>
                  <TableCell sx={{ color: "var(--text-secondary)", py: 2 }}>{pub.area || "N/A"}</TableCell>

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
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <Chip
                        icon={
                          pub.status === 'Approved' ? <CheckCircle style={{ fontSize: 16 }} /> :
                            pub.status?.includes('Rejected') ? <Cancel style={{ fontSize: 16 }} /> :
                              <AccessTime style={{ fontSize: 16 }} />
                        }
                        label={pub.status || "Pending"}
                        size="small"
                        sx={{
                          color: pub.status?.includes('Rejected') ? "#ef4444" : pub.status === 'Approved' ? "#10b981" : "#e8a000",
                          fontWeight: 700,
                          background: pub.status?.includes('Rejected') ? "rgba(239, 68, 68, 0.1)" : pub.status === 'Approved' ? "rgba(16, 185, 129, 0.1)" : "rgba(232, 160, 0, 0.1)",
                          border: `1px solid ${pub.status?.includes('Rejected') ? "rgba(239, 68, 68, 0.3)" : pub.status === 'Approved' ? "rgba(16, 185, 129, 0.3)" : "rgba(232, 160, 0, 0.3)"}`,
                          width: "fit-content",
                          "& .MuiChip-icon": {
                            color: "inherit"
                          }
                        }}
                      />
                      {pub.status?.includes('Rejected') && (pub.rndComment || pub.hodComment) && (
                        <Tooltip title={pub.rndComment || pub.hodComment} arrow placement="top">
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#ef4444",
                              fontStyle: "italic",
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              cursor: "pointer",
                              maxWidth: 220,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}
                          >
                            <span>ð¬</span> "{pub.rndComment || pub.hodComment}"
                          </Typography>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View Details" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDetails(pub)}
                          sx={{
                            color: "var(--color-primary)",
                            "&:hover": { background: "var(--bg-accent-1)", transform: "scale(1.1)" },
                            transition: "all 0.2s ease"
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {pub.status?.includes("Rejected") && (
                        <Tooltip title="Edit & Resubmit" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(pub)}
                            sx={{
                              color: "#ef4444",
                              "&:hover": { background: "rgba(239, 68, 68, 0.1)", transform: "scale(1.1)" },
                              transition: "all 0.2s ease"
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
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

  const renderSelectYear = () => {
    const activeYearDoc = academicYears.find(y => y.active) || academicYears[0];
    let priorYearStr = "";
    if (activeYearDoc && activeYearDoc.year) {
      const parts = activeYearDoc.year.split('-');
      if (parts.length === 2) {
        priorYearStr = `${parseInt(parts[0], 10) - 1}-${parseInt(parts[1], 10) - 1}`;
      }
    }

    // Only show Active and Prior year
    let filteredYears = academicYears.filter(y => y._id === activeYearDoc?._id || y.year === priorYearStr);

    // Ensure active is first
    filteredYears.sort((a, b) => {
      if (a._id === activeYearDoc?._id) return -1;
      if (b._id === activeYearDoc?._id) return 1;
      return 0;
    });

    return (
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
            {filteredYears.map(y => (
              <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
            ))}
          </Select>
          <Box sx={{ display: "flex", gap: 2, mt: 4, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => { setViewMode("list"); setEditMode(false); setEditId(null); }}
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
  };

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
        <Box sx={{ mb: 1, p: 2, background: "var(--bg-panel)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Typography sx={{ ...labelStyle, mb: 0, fontWeight: 700, color: "var(--text-primary)" }}>Is Patent filed in University Name? *</Typography>
            <RadioGroup
              row
              value={form.patentFiledInInstitution || "Yes"}
              onChange={(e) => {
                const val = e.target.value;
                setForm(prev => {
                  const newRole = val === "Yes" ? "Inventor / Co-Inventor" : prev.facultyRole;
                  return {
                    ...prev,
                    patentFiledInInstitution: val,
                    facultyRole: newRole,
                    patentName: val === "Yes" ? "Aditya University" : (newRole === "Applicant" ? (user?.name || "") : ""),
                    applicantAffiliation: val === "Yes" ? "Aditya University" : (newRole === "Applicant" ? (user?.college || "") : "")
                  };
                });
              }}
            >
              <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Yes</Typography>} />
              <FormControlLabel value="No" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>No</Typography>} />
            </RadioGroup>
          </Box>
        </Box>
        
        <Box sx={{ mb: 1, p: 2, background: "var(--bg-panel)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Typography sx={{ ...labelStyle, mb: 0, fontWeight: 700, color: "var(--text-primary)" }}>Is the patent utility type? *</Typography>
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

        {form.patentFiledInInstitution === "No" && (
          <Box sx={{ gridColumn: { sm: "1 / -1" }, mb: 1, p: 2, background: "var(--bg-panel)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <Typography sx={{ ...labelStyle, mb: 0, fontWeight: 700, color: "var(--text-primary)" }}>Your Role in the Patent *</Typography>
              <RadioGroup
                row
                value={form.facultyRole}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm(prev => ({
                    ...prev,
                    facultyRole: val,
                    patentName: prev.patentFiledInInstitution === "Yes" ? "Aditya University" : (val === "Applicant" ? (user?.name || "") : ""),
                    applicantAffiliation: prev.patentFiledInInstitution === "Yes" ? "Aditya University" : (val === "Applicant" ? (user?.college || "") : "")
                  }));
                }}
              >
                <FormControlLabel value="Applicant" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Applicant</Typography>} />
                <FormControlLabel value="Inventor / Co-Inventor" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Inventor / Co-Inventor</Typography>} />
              </RadioGroup>
            </Box>
          </Box>
        )}

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

        <Box>
          <Typography sx={labelStyle}>Title of the Patent : *</Typography>
          <TextField size="small" fullWidth value={form.title} onChange={set("title")} placeholder="Enter Title of the Patent" />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Status of Patent Application :</Typography>
          <Select size="small" fullWidth displayEmpty value={form.status} onChange={set("status")}>
            <MenuItem value="">--Select--</MenuItem>
            {PATENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </Box>

        <Box>
          <Typography sx={labelStyle}>Area of Patent :</Typography>
          <TextField size="small" fullWidth value={form.area} onChange={set("area")} />
        </Box>
        <Box>
          <Typography sx={labelStyle}>Patent Application No :</Typography>
          <TextField
            size="small"
            fullWidth
            value={form.applicationNo}
            onChange={(e) => {
              const val = e.target.value;
              // Allow only letters, numbers, '/', '.', '-'
              if (val === "" || /^[A-Za-z0-9\/.-]+$/.test(val)) {
                setForm(p => ({ ...p, applicationNo: val }));
              }
            }}
            placeholder="e.g. 202341012345"
          />
        </Box>
        {form.status !== "Granted" && (
          <Box>
            <Typography sx={labelStyle}>Date of filing :</Typography>
            <TextField size="small" fullWidth type="date" value={form.dateOfFiling} onChange={set("dateOfFiling")} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().split("T")[0] } }} />
          </Box>
        )}
        
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
          <Typography sx={{ ...labelStyle, mb: 0, fontSize: 14, color: "var(--text-primary)", fontWeight: 700, textTransform: "uppercase" }}>Co-Inventor(s) Details (if any):</Typography>
          {form.otherInventors.length === 0 && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleAddInventor}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", color: "var(--color-primary)", borderColor: "var(--color-primary)", "&:hover": { background: "var(--bg-accent-1)" } }}
            >
              + Add inventor / co-inventor details
            </Button>
          )}
        </Box>

        {form.otherInventors.length > 0 && (
          <Box sx={{ gridColumn: { sm: "1 / -1" }, background: "var(--bg-panel)", p: 2, borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography sx={{ ...labelStyle, mb: 0, fontWeight: 700, color: "var(--text-primary)", fontSize: "12px", textTransform: "uppercase" }}>Name & affiliation of Co-Inventor(s) :</Typography>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleAddInventor} 
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", color: "var(--color-primary)", borderColor: "var(--color-primary)", "&:hover": { background: "var(--bg-accent-1)" } }}
              >
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

      <NoteBox />

      <Grid2 sx={{ mt: 1 }}>
        <FileField
          label="Certificate of Basic Registration (CBR):"
          name="cbr"
          onChange={setFile("cbr")}
          existingFileUrl={existingFiles.cbr}
          onRemoveExisting={() => {
            setExistingFiles(p => ({ ...p, cbr: null }));
            setDeleteFlags(p => ({ ...p, cbr: true }));
          }}
        />
        <FileField
          label="Form -1"
          name="form1"
          onChange={setFile("form1")}
          existingFileUrl={existingFiles.form1}
          onRemoveExisting={() => {
            setExistingFiles(p => ({ ...p, form1: null }));
            setDeleteFlags(p => ({ ...p, form1: true }));
          }}
        />
        {form.status === "Granted" && (
          <FileField
            label="Granted Certificate"
            name="grantedCertificate"
            onChange={setFile("grantedCertificate")}
            existingFileUrl={existingFiles.grantedCertificate}
            onRemoveExisting={() => {
              setExistingFiles(p => ({ ...p, grantedCertificate: null }));
              setDeleteFlags(p => ({ ...p, grantedCertificate: true }));
            }}
          />
        )}
      </Grid2>

      <Grid2 sx={{ mt: 2 }}>
        <Box sx={{ mt: 1 }}>
          <Typography sx={labelStyle}>Applying as a Seed Grant Work? *</Typography>
          <Select size="small" fullWidth displayEmpty value={form.applyingSeedGrant} onChange={set("applyingSeedGrant")}>
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>

        <Box sx={{ mt: 1 }}>
          {(() => {
            const isPositionGreaterThan5 = parseInt(form.userInventorPosition || 1) > 5;
            const isUtilityTypeNo = form.isUtilityType === "No";
            const disableIncentive = isPositionGreaterThan5 || isUtilityTypeNo;
            return (
              <>
                <Typography sx={labelStyle}>Whether you want to apply for incentive? *</Typography>
                <Select size="small" fullWidth displayEmpty value={disableIncentive ? "No" : form.applyIncentive} onChange={set("applyIncentive")} disabled={disableIncentive}>
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>

                {isPositionGreaterThan5 && (
                  <Typography variant="caption" sx={{ color: "#ef4444", fontWeight: 600, mt: 0.5, display: "block" }}>
                    * Application for incentive is only for the first 5 inventor positions.
                  </Typography>
                )}
                {isUtilityTypeNo && !isPositionGreaterThan5 && (
                  <Typography variant="caption" sx={{ color: "#ef4444", fontWeight: 600, mt: 0.5, display: "block" }}>
                    * Incentive applies only for utility type patents.
                  </Typography>
                )}
              </>
            );
          })()}
        </Box>
      </Grid2>

      {(() => {
        const isPositionGreaterThan5 = parseInt(form.userInventorPosition || 1) > 5;
        const isUtilityTypeNo = form.isUtilityType === "No";
        const disableIncentive = isPositionGreaterThan5 || isUtilityTypeNo;
        let amount = form.status === "Published" ? 5000 : (form.status === "Granted" ? 15000 : 0);
        if (form.applyingSeedGrant === "Yes") {
          amount = amount / 2;
        }
        if (isUtilityTypeNo) {
          amount = 0;
        }
        
        if (form.applyIncentive === "Yes" && !disableIncentive && form.status) {
          return (
            <Box sx={{
              gridColumn: { sm: "1 / -1" },
              p: 2.5,
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.05)",
              border: "1px dashed rgba(16, 185, 129, 0.3)",
              mt: 3
            }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                <Box>
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#059669" }}>
                    Estimated Research Incentive Amount
                  </Typography>
                  <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: "#047857", mt: 0.5 }}>
                    ₹{amount.toLocaleString('en-IN')}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        }
        return null;
      })()}

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => { setViewMode("list"); setEditMode(false); setEditId(null); }}
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

  const handleOpenDetails = async (pub) => {
    setSelectedPubDetails(pub);
    try {
      const ayId = pub.academicYear?._id || pub.academicYear;
      if (ayId) {
        const res = await API.get(`/api/appraisal/config/${ayId}`);
        setAppraisalConfigActive(res.data?.data?.isActive || res.data?.data?.status === 'On');
      }
    } catch (err) {
      console.error("Failed to fetch appraisal config", err);
      setAppraisalConfigActive(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedPubDetails(null);
    setUpdateStatusExpanded(false);
    setStatusUpdateForm({ granteddate: "", eligibleForTechTransfer: "No" });
    setStatusUpdateFile(null);
  };

  const handleResolveClaim = async (researchId, researchType, claimantId) => {
    try {
      const res = await API.post("/api/appraisal/resolve-claim", {
        researchId,
        researchType,
        claimantId
      });
      if (res.data.success) {
        setSelectedPubDetails(prev => ({ ...prev, appraisalClaimant: claimantId }));
        API.get("/api/research/patent").then(r => setPublicationsList(r.data?.data || r.data || [])).catch(() => { });
        toast.success("Appraisal claimant successfully updated!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resolve claim");
    }
  };

  const LabelValueDetails = ({ label, value, chip, horizontal = false }) => (
    <Box sx={{
      p: 2,
      borderRadius: "16px",
      background: horizontal ? "transparent" : "linear-gradient(145deg, var(--bg-paper) 0%, var(--bg-panel) 100%)",
      border: horizontal ? "none" : "1px solid var(--border-color)",
      borderBottom: horizontal ? "1px solid var(--border-color)" : "1px solid var(--border-color)",
      display: "flex",
      flexDirection: horizontal ? "row" : "column",
      alignItems: horizontal ? "center" : "flex-start",
      justifyContent: horizontal ? "flex-start" : "center",
      gap: horizontal ? 2 : 1,
      height: "100%",
      boxShadow: horizontal ? "none" : "0 4px 20px rgba(0,0,0,0.03)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": horizontal ? {} : {
        borderColor: "var(--color-primary)",
        transform: "translateY(-2px)",
        boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
      },
      "&:last-child": horizontal ? { borderBottom: "none" } : {},
    }}>
      <Typography variant="caption" sx={{ color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, fontSize: "0.65rem", display: "flex", alignItems: "center", gap: 1 }}>
        <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "var(--color-primary)", opacity: 0.8 }} />
        {label}
      </Typography>
      <Box sx={{ flex: horizontal ? 1 : "none", display: "flex", alignItems: "center", mt: horizontal ? 0 : 0.5, ml: horizontal ? 0 : 1.5 }}>
        {chip ? chip : <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem", wordBreak: "break-word", lineHeight: 1.4 }}>{value || "-"}</Typography>}
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
      <Box sx={{ flex: "1 1 220px", minWidth: 180 }}>
        <Box sx={{ mb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.75rem", textTransform: "uppercase" }}>
            {title}
          </Typography>
          <IconButton size="small" href={fileUrl} download target="_blank" sx={{ color: "var(--color-primary)", p: 0.5 }}>
            <Download fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{
          height: 120, display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid var(--border-color)", background: "var(--bg-panel)", borderRadius: "12px",
          overflow: "hidden", cursor: "pointer", transition: "all 0.2s ease",
          "&:hover": { borderColor: "var(--color-primary)", transform: "translateY(-2px)", boxShadow: "var(--shadow-premium)" }
        }} onClick={() => window.open(fileUrl, '_blank')}>
          {isImage ? (
            <img src={fileUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Box sx={{ textAlign: "center" }}>
              <Description sx={{ fontSize: 32, color: "var(--text-secondary)", mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, display: "block" }}>PDF View</Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const renderDetailsDialog = () => {
    if (!selectedPubDetails) return null;
    const data = selectedPubDetails;
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
        maxWidth="lg"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "20px",
            background: "var(--bg-paper)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-premium)",
            maxHeight: "90vh"
          }
        }}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "blur(4px)",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
            }
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
          {/* Top Banner Card */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: "16px", border: "1px solid var(--border-color)", background: "var(--bg-paper)" }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2 }}>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 0.5, wordBreak: "break-word" }}>
                  {data.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                  Name of Applicant in Patent: <strong style={{ color: "var(--text-primary)" }}>{data.patentName}</strong>
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", flexShrink: 0 }}>
                {(data.entryType === 'Admin' || data.isDirectEntry === 'true' || data.isDirectEntry === true) && (
                  <Chip
                    label="R&D Direct Entry"
                    sx={{
                      bgcolor: "rgba(124, 58, 237, 0.1)",
                      color: "#7c3aed",
                      border: "1px solid rgba(124, 58, 237, 0.3)",
                      fontWeight: 700,
                      borderRadius: "20px",
                      px: 1,
                      py: 0.5
                    }}
                  />
                )}
                <Chip
                  icon={
                    /approved/i.test(data.status) ? (
                      <CheckCircleOutlineIcon sx={{ fontSize: "16px !important", color: "inherit" }} />
                    ) : /reject/i.test(data.status) ? (
                      <Close sx={{ fontSize: "16px !important", color: "inherit" }} />
                    ) : (
                      <AccessTime sx={{ fontSize: "16px !important", color: "inherit" }} />
                    )
                  }
                  label={data.status || "Pending at R&D"}
                  sx={{
                    bgcolor: /approved/i.test(data.status) ? "rgba(46, 125, 50, 0.1)" : /reject/i.test(data.status) ? "rgba(211, 47, 47, 0.1)" : "rgba(237, 108, 2, 0.1)",
                    color: /approved/i.test(data.status) ? "#2e7d32" : /reject/i.test(data.status) ? "#d32f2f" : "#ed6c02",
                    border: `1px solid ${/approved/i.test(data.status) ? "rgba(46, 125, 50, 0.3)" : /reject/i.test(data.status) ? "rgba(211, 47, 47, 0.3)" : "rgba(237, 108, 2, 0.3)"}`,
                    fontWeight: 700,
                    borderRadius: "20px",
                    px: 1,
                    py: 0.5
                  }}
                />
              </Box>
            </Box>
          </Paper>

          {/* Main Grid: Left Column (Patent Details) + Right Column (Eligibility & Files) */}
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.3fr) minmax(0, 0.9fr)" },
            gap: 3,
            mb: 3,
            width: "100%",
            alignItems: "flex-start"
          }}>
            {/* Left Column (Patent Details) */}
            <Box sx={{ minWidth: 0 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 0,
                  overflow: "hidden",
                  borderRadius: "16px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-paper)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <Box sx={{ p: 3, pb: 2, borderBottom: "1px solid var(--border-color)" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                    <FormatListBulletedIcon sx={{ color: "var(--color-primary)" }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                      Patent Details
                    </Typography>
                  </Box>
                  <Box sx={{ width: 140, height: 3, bgcolor: "var(--color-primary)", borderRadius: "3px" }} />
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  {[
                    { label: "Academic Year", value: data.academicYear?.year || "-", icon: <SchoolIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    ...((data.entryType === 'Admin' || data.isDirectEntry === 'true' || data.isDirectEntry === true) ? [{ label: "Entry Source", value: "R&D Direct Entry", icon: <PersonIcon sx={{ fontSize: 18, color: "var(--color-primary)" }} /> }] : []),
                    { label: "Filed in Institution Name", value: data.patentFiledInInstitution || "Yes", icon: <AccountBalanceIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Name of Applicant in Patent", value: data.patentName || "-", icon: <PersonOutlineIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Area of Patent", value: data.area || "-", icon: <CategoryIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Patent Application No", value: data.applicationnumber || "-", icon: <ArticleIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Date of Filing", value: formatDate(data.dateOfFiling), icon: <CalendarTodayIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Patent Application Status", value: data.patentStatus || "-", icon: <CheckCircleOutlineIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Filed Country", value: data.patentFiledCountry || "India", icon: <PublicIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    ...(data.patentStatus === "Granted" ? [{ label: "Eligible for Technology Transfer", value: data.eligibleForTechTransfer || "No", icon: <HandshakeIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> }] : []),
                    { label: "Role", value: data.visibilityRole || "Applicant", icon: <PersonIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Seed Grant Work", value: data.applyingSeedGrant === "Yes" ? "Yes" : "No", icon: <GrassIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    { label: "Apply For Incentive", value: data.applyIncentive === "Yes" ? "Yes" : "No", icon: <CardGiftcardIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} /> },
                    ...(data.status === "Approved" && data.approvedAmount ? [{ label: "Approved Incentive Amount", value: `₹${data.approvedAmount}`, icon: <CurrencyRupeeIcon sx={{ fontSize: 18, color: "#2e7d32" }} /> }] : [])
                  ].map((item, idx, arr) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 3,
                        py: 1.6,
                        borderBottom: idx === arr.length - 1 ? "none" : "1px solid var(--border-color)",
                        "&:hover": { bgcolor: "rgba(0,0,0,0.015)" },
                        transition: "background 0.2s"
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        {item.icon}
                        <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.875rem" }}>
                          {item.label}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", textAlign: "right", maxWidth: "55%", wordBreak: "break-word" }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>

            {/* Right Column (Eligibility, Claimant & Files) */}
            <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Card 1: Appraisal & Eligibility Info */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid var(--border-color)", background: "var(--bg-paper)" }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2, borderBottom: "1px solid var(--border-color)" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <CheckCircleOutlineIcon sx={{ color: "var(--text-secondary)", fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                        Patent Eligibility for Appraisal
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                      {data.status === "Approved" ? (data.appraisalEligible || "No") : "Not yet decided"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.5 }}>
                      <PersonIcon sx={{ color: "var(--text-secondary)", fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                        Appraisal Claimant
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", maxWidth: "60%" }}>
                      {(() => {
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

                        const isApproved = data.status === "Approved";
                        const isAppraisalEligible = data.appraisalEligible === "Yes";

                        if (uniqueClaimants.length <= 1) {
                          return (
                            <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                              {data.facultyId?.name || "-"} <Typography component="span" variant="caption" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>(Auto-assigned)</Typography>
                            </Typography>
                          );
                        }

                        if (!isApproved || !isAppraisalEligible) {
                          return (
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>
                              N/A - Not Eligible or Not Approved
                            </Typography>
                          );
                        }

                        const currentClaimantObj = uniqueClaimants.find(c => {
                          const cInst = (c.institutionId || "").toString().trim();
                          const cId = (c._id || "").toString().trim();
                          const acInst = (data.appraisalClaimant?.institutionId || data.appraisalClaimant || "").toString().trim();
                          const acId = (data.appraisalClaimant?._id || data.appraisalClaimant || "").toString().trim();
                          return (cInst && cInst === acInst) || (cId && cId === acId);
                        });

                        const isApplicant = data.visibilityRole === "Applicant" || (data.facultyId && (data.facultyId === user?.userId || data.facultyId._id === user?.userId));

                        if (!data.appraisalClaimant && isApplicant && appraisalConfigActive && uniqueClaimants.length > 1) {
                          return (
                            <Select
                              size="small"
                              fullWidth
                              value=""
                              displayEmpty
                              onChange={(e) => handleResolveClaim(data._id, "Patent", e.target.value)}
                              sx={{ backgroundColor: "var(--bg-paper)", fontSize: "0.875rem" }}
                            >
                              <MenuItem value="" disabled>Select Claimant</MenuItem>
                              {uniqueClaimants.map(c => (
                                <MenuItem key={c.institutionId || c._id} value={c.institutionId || c._id}>
                                  {c.name} ({c.institutionId})
                                </MenuItem>
                              ))}
                            </Select>
                          );
                        }

                        return (
                          <Typography variant="body2" sx={{ fontWeight: 800, color: currentClaimantObj ? "var(--text-primary)" : "#ed6c02" }}>
                            {currentClaimantObj ? `${currentClaimantObj.name} (${currentClaimantObj.institutionId})` : "Not Yet Designated"}
                          </Typography>
                        );
                      })()}
                    </Box>
                  </Box>
                </Box>
              </Paper>

              {data.patentStatus !== "Granted" && data.status === "Approved" && !updateStatusExpanded && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 2,
                    borderRadius: "12px",
                    background: "#eef6fd",
                    flexWrap: "wrap",
                    gap: 2
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Settings sx={{ fontSize: 28, color: "#004085" }} />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 0.2 }}>
                        Patent Status
                      </Typography>
                      <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                        Current status: <span style={{ color: "#f59e0b" }}>{data.patentStatus || "Published"}</span>
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    sx={{
                      borderRadius: "8px",
                      px: 3,
                      py: 1,
                      bgcolor: "#003b73",
                      color: "#fff",
                      fontWeight: 700,
                      textTransform: "none",
                      boxShadow: "none",
                      "&:hover": {
                        bgcolor: "#002a54",
                        boxShadow: "none"
                      }
                    }}
                    onClick={() => setUpdateStatusExpanded(true)}
                  >
                    Update Patent Status
                  </Button>
                </Box>
              )}

              {updateStatusExpanded && (
                <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid var(--border-color)", background: "var(--bg-panel)" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--color-primary)", mb: 2 }}>Update Patent to Granted</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", mb: 0.5 }}>Granted Date *</Typography>
                      <TextField 
                        type="date" 
                        size="small" 
                        fullWidth 
                        value={statusUpdateForm.granteddate}
                        onChange={e => setStatusUpdateForm(p => ({ ...p, granteddate: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                    <Box>
                      <FileField
                        label="Granted Certificate * (PDF, max 200KB)"
                        name="grantedCertificate"
                        onChange={e => setStatusUpdateFile(e.target.files[0])}
                      />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", mb: 0.5 }}>Eligible for Technology Transfer?</Typography>
                      <Select 
                        size="small" 
                        fullWidth 
                        value={statusUpdateForm.eligibleForTechTransfer}
                        onChange={e => setStatusUpdateForm(p => ({ ...p, eligibleForTechTransfer: e.target.value }))}
                      >
                        <MenuItem value="Yes">Yes</MenuItem>
                        <MenuItem value="No">No</MenuItem>
                      </Select>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button 
                        variant="outlined" 
                        color="inherit" 
                        fullWidth 
                        disabled={statusUpdateLoading}
                        onClick={() => {
                          setUpdateStatusExpanded(false);
                          setStatusUpdateForm({ granteddate: "", eligibleForTechTransfer: "No" });
                          setStatusUpdateFile(null);
                        }}
                        sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600 }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="contained" 
                        fullWidth 
                        disabled={statusUpdateLoading}
                        onClick={handleStatusUpdateSubmit}
                        sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, bgcolor: "var(--color-primary)", "&:hover": { bgcolor: "var(--color-primary-dark)" } }}
                      >
                        {statusUpdateLoading ? "Updating..." : "Submit Update"}
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              )}

              {/* Card 2: Attached Documents */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid var(--border-color)", background: "var(--bg-paper)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <AttachFile sx={{ color: "var(--color-primary)" }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                    Attached Documents
                  </Typography>
                </Box>
                <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }} useFlexGap>
                  {renderDetailFile("e-Filing Receipt", data.cbr)}
                  {renderDetailFile("Form 1", data.form1)}
                </Stack>
              </Paper>
            </Box>
          </Box>

          {/* Co-Inventors Details Table */}
          {(() => {
            const filteredCoInventors = (data.coInventors || []).filter((ca) => {
              const isApplicantName = ca.name && user?.name && ca.name.trim().toLowerCase() === user.name.trim().toLowerCase();
              const isApplicantEmpId = ca.empId && user?.institutionId && String(ca.empId).trim() === String(user.institutionId).trim();
              return !isApplicantName && !isApplicantEmpId;
            });

            if (filteredCoInventors.length === 0) return null;

            return (
              <Paper elevation={0} sx={{ p: 0, overflow: "hidden", mb: 3, border: "1px solid var(--border-color)", background: "var(--bg-paper)", borderRadius: "16px" }}>
                <Box sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 1.5, borderBottom: "1px solid var(--border-color)" }}>
                  <Groups sx={{ color: "var(--color-primary)" }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Co-Inventors & Affiliations</Typography>
                  <Box sx={{ ml: 'auto', px: 1.5, py: 0.5, borderRadius: '20px', bgcolor: 'rgba(190,147,55,0.12)', border: '1px solid rgba(190,147,55,0.3)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'var(--color-primary)', fontSize: '0.75rem' }}>
                      {filteredCoInventors.length} Co-Inventor{filteredCoInventors.length > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "var(--bg-panel)" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", fontSize: "0.75rem", width: 80 }}>POSITION</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", fontSize: "0.75rem" }}>NAME</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", fontSize: "0.75rem" }}>INVENTOR TYPE</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", fontSize: "0.75rem" }}>AFFILIATION</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredCoInventors.map((inventor, idx) => {
                        const rawType = inventor.CoInventorType || inventor.CoAuthorType || (inventor.studentId ? "student" : "faculty");
                        const displayType = rawType.charAt(0).toUpperCase() + rawType.slice(1);
                        const isStudent = rawType.toLowerCase() === "student";

                        return (
                          <TableRow key={idx} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.015)' } }}>
                            <TableCell>
                              <Box sx={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 28, height: 28, borderRadius: '50%',
                                bgcolor: 'rgba(190, 147, 55, 0.12)', border: '1.5px solid var(--color-primary)',
                                color: 'var(--color-primary)', fontWeight: 800, fontSize: '0.8rem'
                              }}>
                                {inventor.inventorPosition || inventor.authorPosition || (idx + 1)}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{inventor.name}</TableCell>
                            <TableCell>
                              <Chip
                                label={displayType}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.7rem',
                                  bgcolor: isStudent ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                  color: isStudent ? '#2563eb' : '#059669',
                                  border: '1px solid',
                                  borderColor: isStudent ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>{inventor.affiliation || "-"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            );
          })()}

          {/* Remarks/Comments if available */}
          {(data.hodComment || data.rndComment || data.approvedAmount) && (
            <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
              {data.hodComment && (
                <Box sx={{ p: 2, bgcolor: "rgba(255, 193, 7, 0.05)", borderRadius: "12px", border: "1px solid rgba(255, 193, 7, 0.2)" }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: "#ed6c02", textTransform: "uppercase" }}>HOD Remarks</Typography>
                  <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5, color: "var(--text-secondary)", fontWeight: 600 }}>"{data.hodComment}"</Typography>
                </Box>
              )}
              {(data.rndComment || data.approvedAmount) && (
                <Box sx={{ p: 2, bgcolor: "rgba(76, 175, 80, 0.05)", borderRadius: "12px", border: "1px solid rgba(76, 175, 80, 0.2)" }}>
                  {data.rndComment && (
                    <>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: "#2e7d32", textTransform: "uppercase" }}>R&D Remarks</Typography>
                      <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5, color: "var(--text-secondary)", fontWeight: 600 }}>"{data.rndComment}"</Typography>
                    </>
                  )}
                  {data.approvedAmount && (
                    <Typography variant="h6" sx={{ mt: data.rndComment ? 2 : 0, fontWeight: 900, color: "#10b981" }}>
                      Approved Amount: ₹{data.approvedAmount}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid var(--border-color)", justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={handleCloseDetails} sx={{ color: "var(--text-primary)", borderColor: "var(--border-color)", fontWeight: 700, textTransform: "none", px: 3 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      <PageHeader
        title="Patent Publications"
        subtitle="Manage and submit your patent publications"
        onBack={viewMode !== "list" ? () => setViewMode("list") : undefined}
      />
      {(!user?.panNumber || !user?.college) && (
        <Box sx={{ px: 3, mb: 4 }}>
          <Alert severity="warning" variant="filled" sx={{ borderRadius: "16px" }}>
            <AlertTitle sx={{ fontWeight: 700 }}>Profile Details Incomplete</AlertTitle>
            <Typography variant="body2">
              You must complete the following fields in your profile before you submit:
              <strong> PAN Number, College</strong>. Please navigate to the Profile settings to update them.
            </Typography>
          </Alert>
        </Box>
      )}

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
