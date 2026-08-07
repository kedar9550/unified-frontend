import Loader from "../../components/common/Loader";
import React, { useState, useEffect } from "react";
import { ADMIN_ROLE_CATALOG, ASSIGNED_BY_OPTIONS } from "../../constants/adminRoleCatalog";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  AlertTitle,
  Modal,
  TextField,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Switch,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  TablePagination,
  Tabs,
  Tab
} from "@mui/material";
import {
  Send,
  CloudUpload,
  Person,
  MenuBook,
  Science,
  CardMembership,
  CheckCircle,
  AssignmentTurnedIn,
  Close,
  AddCircle,
  Edit,
  Delete,
  Visibility,
  Save,
  Warning,
  Info,
  Description,
  Cancel,
  HourglassEmpty,
  School,
  Work,
  Badge,
  Public,
  Fingerprint,
  AccountBox,
  EmojiEvents,
  Groups,
  BarChart,
  WorkspacePremium,
  SupervisorAccount,
  ThumbUp,
  Flag
} from "@mui/icons-material";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";
import { SubLabel, Grid2, NoteBox, FileField } from "../../components/faculty/PublicationFormFields";
import { labelStyle } from "../../components/faculty/publicationConstants";
import PageHeader from "../../components/common/PageHeader";



// Contribution Categories are now fetched from the database

const RESOURCE_UTILIZATION_CATEGORIES = [
  "CONFERENCE",
  "STTP",
  "Refresher Course",
  "FDP",
  "SYMPOSIUM",
  "GUEST LECTURE",
  "WORKSHOP",
  "Event"
];

const ROLES_BY_CATEGORY = {
  "CONFERENCE": [
    "Conference Chair",
    "Conference Co-Chair",
    "Conference Finance Chair",
    "Conference Publication Chair",
    "Conference Registration Chair",
    "Conference Resource Person",
    "Conference Participant"
  ],
  "STTP": [
    "Convenor",
    "Co-Convenor 1",
    "Co-Convenor 2",
    "Coordinator",
    "Resource Person",
    "Participant"
  ],
  "Refresher Course": [
    "Convenor",
    "Co-Convenor 1",
    "Co-Convenor 2",
    "Coordinator",
    "Resource Person",
    "Participant"
  ],
  "FDP": [
    "FDP Convenor",
    "FDP Co-Convenor",
    "FDP Coordinator",
    "FDP Resource Person",
    "FDP Participant"
  ],
  "SYMPOSIUM": [
    "Symposium Convenor",
    "Symposium Co-Convenor",
    "Symposium Coordinator",
    "Symposium Resource Person",
    "Symposium Participant"
  ],
  "GUEST LECTURE": [
    "Guest Lecture Coordinator",
    "Guest Lecture Resource Person"
  ],
  "WORKSHOP": [
    "Workshop Coordinator",
    "Workshop Resource Person"
  ],
  "Event": [
    "Event Coordinator",
    "Event Resource Person"
  ]
};

const SelfAppraisal = () => {
  const navigate = useNavigate();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [appraisal, setAppraisal] = useState(null);
  const [faculty, setFaculty] = useState(null);
  const [profileComplete, setProfileComplete] = useState(true);
  const [missingFields, setMissingFields] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  const horizontalTabStyle = {
    textTransform: "none",
    fontWeight: 700,
    fontSize: { xs: "0.8rem", sm: "0.92rem" },
    py: { xs: 1, sm: 1.5 },
    px: { xs: 1.5, sm: 2.5 },
    minHeight: { xs: "40px", sm: "48px" },
    color: "var(--text-secondary)",
    transition: "all 0.2s ease-in-out",
    "&.Mui-selected": {
      color: "var(--color-primary) !important",
      "& .MuiSvgIcon-root": {
        color: "var(--color-primary) !important"
      }
    },
    "& .MuiSvgIcon-root": {
      color: "var(--text-secondary)",
      transition: "color 0.2s ease"
    },
    "&:hover": {
      color: "var(--color-primary)",
      "& .MuiSvgIcon-root": {
        color: "var(--color-primary)"
      }
    }
  };

  // List View States
  const [viewMode, setViewMode] = useState("list"); // "list" | "form"
  const [myAppraisals, setMyAppraisals] = useState([]);
  const [fetchingAppraisals, setFetchingAppraisals] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [citationYear, setCitationYear] = useState("");
  const [previousHIndexYear, setPreviousHIndexYear] = useState("");
  const [currentHIndexYear, setCurrentHIndexYear] = useState("");

  const blurActiveElement = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const getStatusChip = (status) => {
    let bg = "rgba(100, 116, 139, 0.08)";
    let color = "#64748b";
    let label = status || "Pending";

    if (status === "Approved") {
      bg = "rgba(16, 185, 129, 0.08)";
      color = "#10b981";
    } else if (status === "Rejected") {
      bg = "rgba(239, 68, 68, 0.08)";
      color = "#ef4444";
    } else if (status === "Pending") {
      bg = "rgba(245, 158, 11, 0.08)";
      color = "#f59e0b";
      label = "Pending Verification";
    }

    return (
      <Chip
        label={label}
        size="small"
        sx={{
          bgcolor: bg,
          color: color,
          fontWeight: 800,
          borderRadius: "6px",
          height: "20px",
          fontSize: "0.65rem",
          ml: 1
        }}
      />
    );
  };

  const selectMenuProps = {
    disableAutoFocusItem: true,
    slotProps: {
      list: {
        onMouseDown: blurActiveElement
      }
    }
  };
  const [appraisalConfig, setAppraisalConfig] = useState(null);
  const [contributionCategories, setContributionCategories] = useState([]);
  // Claim research publication modal states
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [undertakingFile, setUndertakingFile] = useState(null);

  // Extra Details States
  const [proctoringDetail, setProctoringDetail] = useState([]);
  const [resourceUtilizationDetails, setResourceUtilizationDetails] = useState([]);
  const [contributionDetails, setContributionDetails] = useState([]);
  const [administrationDetail, setAdministrationDetail] = useState(null);


  // Proctoring Form States
  const [programs, setPrograms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [semesterNumber, setSemesterNumber] = useState("");
  const [yearNumber, setYearNumber] = useState("");
  const [section, setSection] = useState("");
  const [totalStudents, setTotalStudents] = useState("");
  const [eligibleStudents, setEligibleStudents] = useState("");
  const [passedStudents, setPassedStudents] = useState("");
  const [submittingProctoring, setSubmittingProctoring] = useState(false);
  const [isProctorModalOpen, setIsProctorModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // Administration Modal States
  const [adminRolesForm, setAdminRolesForm] = useState({});
  const [submittingAdmin, setSubmittingAdmin] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({
    primaryRoleType: "",
    roleId: "",
    roleLabel: "",
    level: "",
    assignedByType: "",
    assignedByOtherText: "",
    details: ""
  });
  const [adminEditingRole, setAdminEditingRole] = useState(null);

  // Resource Utilization Modal States
  const [resUtOpen, setResUtOpen] = useState(false);
  const [resUtEditingId, setResUtEditingId] = useState(null);
  const [isResUtDocumentRemoved, setIsResUtDocumentRemoved] = useState(false);
  const [resUtForm, setResUtForm] = useState({
    activityCategory: "",
    activityType: "",
    organizationName: "",
    eventStartDate: "",
    eventEndDate: "",
    numberOfDaysOrganized: "",
    remarks: "",
    numberOfSessions: "",
    numberOfDaysParticipated: "",
    courseFdpName: "",
    organizingInstitutionCategory: "",
    location: "",
    labName: "",
    universityName: "",
    instituteName: "",
    nirfRank: "",
    existingProof: ""
  });
  const [resUtProof, setResUtProof] = useState(null);
  const [resUtLoading, setResUtLoading] = useState(false);

  const resUtRole = (resUtForm.activityType || '').toLowerCase();
  const showSessionsField = resUtRole.includes("resource person") || resUtRole.includes("resourceperson");
  const showDaysField = resUtRole.includes("participant") || resUtRole.includes("participated");
  const showOrganizedDaysField = !showSessionsField && !showDaysField;

  const [selectedResUtDetails, setSelectedResUtDetails] = useState(null);

  // Contribution Modal States
  const [contOpen, setContOpen] = useState(false);
  const [contEditingId, setContEditingId] = useState(null);
  const [isContDocumentRemoved, setIsContDocumentRemoved] = useState(false);
  const [contForm, setContForm] = useState({
    category: "",
    organizationName: "",
    fromDate: "",
    toDate: "",
    journalName: "",
    journalConferenceName: "",
    duration: "",
    awardName: "",
    awardDate: "",
    courseName: "",
    url: "",
    certificationName: "",
    eventName: "",
    eventDate: "",
    articleTitle: "",
    publicationName: "",
    publicationDate: "",
    facilityName: "",
    facilityDate: "",
    grantName: "",
    sanctionDate: "",
    existingProof: ""
  });
  const [contProof, setContProof] = useState(null);
  const [contLoading, setContLoading] = useState(false);
  const [selectedContDetails, setSelectedContDetails] = useState(null);

  const fetchMyAppraisals = async () => {
    setFetchingAppraisals(true);
    try {
      const res = await axiosInstance.get("/api/appraisal/my-appraisals");
      if (res.data && res.data.success) {
        setMyAppraisals(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch my appraisals:", error);
      toast.error("Failed to load your appraisals.");
    } finally {
      setFetchingAppraisals(false);
    }
  };

  useEffect(() => {
    fetchMyAppraisals();
    axiosInstance.get("/api/value-addition/contribution-category")
      .then(res => setContributionCategories(res.data?.data || []))
      .catch(err => console.log("Failed to fetch contribution categories", err));
  }, []);

  const handleApplyNew = async () => {
    try {
      const res = await axiosInstance.get("/api/appraisal/active-year");
      if (res.data && res.data.success && res.data.data) {
        const activeYearObj = res.data.data;
        const activeYearId = typeof activeYearObj === 'string' ? activeYearObj : activeYearObj._id;

        if (!activeYearId) {
          toast.error("Active appraisal year is invalid.");
          return;
        }

        const existing = myAppraisals.find(app => {
          const appId = typeof app.academicYearId === 'object' ? app.academicYearId._id : app.academicYearId;
          return appId === activeYearId;
        });

        if (existing) {
          if (existing.status === "Draft" || existing.status === "Rejected by HOD") {
            toast.info(`Opening existing ${existing.status} appraisal.`);
            setAcademicYears([activeYearObj]);
            setSelectedYear(activeYearId);
            setViewMode("form");
          } else {
            toast.warning(`Appraisal for this year is already ${existing.status}.`);
          }
        } else {
          setAcademicYears([activeYearObj]);
          setSelectedYear(activeYearId);
          setViewMode("form");
        }
      } else {
        toast.error("No active appraisal year is configured.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to initiate appraisal");
    }
  };

  // Unresolved co-authored claims state variables
  const [unresolvedClaims, setUnresolvedClaims] = useState([]);
  const [showGatekeeperModal, setShowGatekeeperModal] = useState(false);
  const [resolvingClaimId, setResolvingClaimId] = useState(null);
  const [appraisalError, setAppraisalError] = useState("");
  const [selectedClaimants, setSelectedClaimants] = useState({});

  // Fetch/Initiate Appraisal on Academic Year change
  const fetchAppraisal = async () => {
    if (!selectedYear) return;
    setLoading(true);
    setAppraisalError("");
    try {
      // Fetch Appraisal Config Settings first
      try {
        const configRes = await axiosInstance.get(`/api/appraisal/config/${selectedYear}`);
        if (configRes.data && configRes.data.success) {
          setAppraisalConfig(configRes.data.data);
        }
      } catch (configErr) {
        console.error("Failed to load appraisal config:", configErr);
      }

      // Fetch/Initiate Appraisal.
      const res = await axiosInstance.get(`/api/appraisal/initiate/${selectedYear}`);
      if (res.data && res.data.success) {
        const appraisalData = res.data.data;

        // Only check for unresolved co-authored claims if the appraisal is still a Draft or is Rejected by HOD
        if (appraisalData.status === "Draft" || appraisalData.status === "Rejected by HOD") {
          const claimsRes = await axiosInstance.get(`/api/appraisal/unresolved-claims/${selectedYear}`);
          if (claimsRes.data && claimsRes.data.success && claimsRes.data.data.length > 0) {
            setUnresolvedClaims(claimsRes.data.data);
            setShowGatekeeperModal(true);
            setAppraisal(null);
            setLoading(false);
            return;
          }
        }

        // No unresolved claims found or appraisal is already submitted/evaluated
        setUnresolvedClaims([]);
        setShowGatekeeperModal(false);

        setAppraisal(appraisalData);
        setFaculty(res.data.faculty || null);
        setProfileComplete(res.data.isProfileComplete);
        setMissingFields(res.data.missingProfileFields || []);

        setCitationYear(res.data.citationYear || "2025");
        setPreviousHIndexYear(res.data.previousHIndexYear || "2024");
        setCurrentHIndexYear(res.data.currentHIndexYear || "2025");

        // Populating extra states
        const proc = res.data.proctoringDetail || [];
        setProctoringDetail(proc);
        setResourceUtilizationDetails(res.data.resourceUtilizationDetails || []);
        setContributionDetails(res.data.contributionDetails || []);
        setAdministrationDetail(res.data.administrationDetail || null);

        // No scopus state needed — data comes from appraisal.research directly
      } else {
        setAppraisalError(res.data?.message || "Self-appraisal is not active for this academic year.");
        setAppraisal(null);
        setFaculty(null);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setAppraisalError(err.response?.data?.message || "Self-appraisal is not active for this academic year.");
      } else {
        toast.error("Failed to fetch or calculate self appraisal");
        setAppraisalError(err.response?.data?.message || "Failed to fetch or calculate self appraisal");
      }
      setAppraisal(null);
      setFaculty(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveClaim = async (claimId, type, claimantId) => {
    if (!claimantId) return;
    setResolvingClaimId(claimId);
    try {
      const res = await axiosInstance.post("/api/appraisal/resolve-claim", {
        researchId: claimId,
        researchType: type,
        claimantId: claimantId
      });
      if (res.data && res.data.success) {
        toast.success("Claim resolved successfully!");
        fetchAppraisal();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resolve claim.");
    } finally {
      setResolvingClaimId(null);
    }
  };

  useEffect(() => {
    fetchAppraisal();
  }, [selectedYear]);

  // Submit Appraisal
  const handleSubmit = async () => {
    if (missingFields.includes("Qualification")) {
      toast.error("Please update your profile qualification before submitting the appraisal.");
      return;
    }

    if (missingFields.includes("Parent Department")) {
      toast.error("Your Parent Department is not set. Please contact the Administrator to assign it.");
      return;
    }


    // Check for rejected items in proctoring, resource utilization, contributions, and administrative responsibilities
    const hasRejectedProc = proctoringDetail?.status === "Rejected";
    const hasRejectedResUt = resourceUtilizationDetails?.some(r => r.status === "Rejected");
    const hasRejectedCont = contributionDetails?.some(c => c.status === "Rejected");
    const hasRejectedAdmin = administrationDetail?.roles?.some(r => r.isResponsible && r.status === "Rejected");

    if (hasRejectedProc || hasRejectedResUt || hasRejectedCont || hasRejectedAdmin) {
      toast.error("You have rejected entries in your self-appraisal (marked in red). Please correct or remove them before submitting.");
      return;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/appraisal/submit", {
        academicYearId: selectedYear
      });
      if (res.data && res.data.success) {
        toast.success("Appraisal submitted to HOD successfully!");
        fetchAppraisal(); // reload
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit appraisal.");
    } finally {
      setLoading(false);
    }
  };


  // Fetch all active programs
  const fetchPrograms = async () => {
    try {
      const res = await axiosInstance.get("/api/academics/programs?status=true");
      if (res.data?.success) {
        setPrograms(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching programs:", err);
    }
  };

  // Fetch branches dynamically
  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedProgramId) {
        setBranches([]);
        setSelectedBranchId("");
        return;
      }
      try {
        const res = await axiosInstance.get(`/api/academics/branches?programId=${selectedProgramId}&status=true`);
        if (res.data?.success) {
          setBranches(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };
    fetchBranches();
  }, [selectedProgramId]);

  // Load programs on mount
  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleOpenAddModal = () => {
    setEditingEntry(null);
    setSelectedProgramId("");
    setSelectedBranchId("");
    setSemesterNumber("");
    setYearNumber("");
    setSection("");
    setTotalStudents("");
    setEligibleStudents("");
    setPassedStudents("");
    setIsProctorModalOpen(true);
  };

  const handleOpenEditModal = (entry) => {
    setEditingEntry(entry);
    setSelectedProgramId(entry.programId?._id || entry.programId);
    setSelectedBranchId(entry.branchId?._id || entry.branchId);
    setSemesterNumber(entry.semesterNumber !== null && entry.semesterNumber !== undefined ? entry.semesterNumber.toString() : "");
    setYearNumber(entry.yearNumber !== null && entry.yearNumber !== undefined ? entry.yearNumber.toString() : "");
    setSection(entry.section !== null && entry.section !== undefined ? entry.section.toString() : "");
    setTotalStudents(entry.totalStudents !== null && entry.totalStudents !== undefined ? entry.totalStudents.toString() : "");
    setEligibleStudents(entry.eligibleStudents !== null && entry.eligibleStudents !== undefined ? entry.eligibleStudents.toString() : "");
    setPassedStudents(entry.passedStudents !== null && entry.passedStudents !== undefined ? entry.passedStudents.toString() : "");
    setIsProctorModalOpen(true);
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this proctoring record?")) return;
    try {
      const res = await axiosInstance.delete(`/api/faculty-proctoring/${id}`);
      if (res.data?.success) {
        toast.success("Proctoring record deleted successfully!");
        fetchAppraisal();
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.response?.data?.message || "Failed to delete record.");
    }
  };

  const handleProctorModalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedYear) {
      toast.error("Please select a valid academic year");
      return;
    }

    if (!selectedProgramId) {
      toast.error("Please select a Program");
      return;
    }
    if (!selectedBranchId) {
      toast.error("Please select a Branch");
      return;
    }

    const program = programs.find(p => p._id === selectedProgramId);
    const semVal = program?.programPattern === "YEAR" ? null : parseInt(semesterNumber);
    const yrVal = program?.programPattern === "YEAR" ? parseInt(yearNumber) : null;

    if (program?.programPattern === "YEAR" && (yrVal === null || isNaN(yrVal))) {
      toast.error("Year number must be a valid number");
      return;
    }
    if (program?.programPattern !== "YEAR" && (semVal === null || isNaN(semVal))) {
      toast.error("Semester number must be a valid number");
      return;
    }

    const secVal = parseInt(section);
    if (isNaN(secVal) || secVal < 1) {
      toast.error("Section must be a positive number");
      return;
    }

    const total = parseInt(totalStudents);
    const eligible = parseInt(eligibleStudents);
    const passed = parseInt(passedStudents);

    if (isNaN(total) || isNaN(eligible) || isNaN(passed)) {
      toast.error("Please enter valid student counts");
      return;
    }

    if (total < 0 || eligible < 0 || passed < 0) {
      toast.error("Counts cannot be negative");
      return;
    }

    if (eligible > total) {
      toast.error("Eligible students cannot exceed total allotted students");
      return;
    }

    if (passed > eligible) {
      toast.error("Passed students cannot exceed eligible students");
      return;
    }

    setSubmittingProctoring(true);
    try {
      const payload = {
        academicYear: selectedYear,
        programId: selectedProgramId,
        branchId: selectedBranchId,
        semesterNumber: semVal,
        yearNumber: yrVal,
        section: secVal,
        totalStudents: total,
        eligibleStudents: eligible,
        passedStudents: passed
      };

      let res;
      if (editingEntry) {
        res = await axiosInstance.put(`/api/faculty-proctoring/${editingEntry._id}`, payload);
      } else {
        res = await axiosInstance.post("/api/faculty-proctoring", payload);
      }

      if (res.data?.success) {
        toast.success(`Proctoring statistics ${editingEntry ? "updated" : "submitted"} successfully!`);
        setIsProctorModalOpen(false);
        fetchAppraisal();
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err.response?.data?.message || "Failed to submit proctoring statistics.");
    } finally {
      setSubmittingProctoring(false);
    }
  };

  const handleDutiesToggle = async (val) => {
    try {
      const res = await axiosInstance.post("/api/appraisal/proctoring-duties", {
        academicYearId: selectedYear,
        hasProctoringDuties: val
      });
      if (res.data?.success) {
        toast.success(`Response saved: Proctoring duties set to ${val}`);
        fetchAppraisal();
      }
    } catch (err) {
      console.error("Failed to update duties response:", err);
      toast.error(err.response?.data?.message || "Failed to save proctoring duties selection.");
    }
  };

  // 4. Administration Sync and Submit Handlers
  const openAdminModalAdd = () => {
    setAdminEditingRole(null);
    setAdminForm({ primaryRoleType: "", roleId: "", roleLabel: "", level: "", assignedByType: "", assignedByOtherText: "", details: "", trainingProgramType: "", trainingProgramOther: "" });
    setAdminOpen(true);
  };

  const openAdminModalEdit = (role) => {
    setAdminEditingRole(role.roleId || role.roleName);

    let pType = role.roleId;
    if (role.roleId) {
      const catalogEntry = ADMIN_ROLE_CATALOG.find((r) => r.roleId === role.roleId);
      if (catalogEntry && catalogEntry.category === "Coordinator") {
        pType = "COORDINATOR";
      }
    }

    let tType = "";
    let tOther = "";
    if (role.roleId === "training_coord" && (role.roleLabel || role.roleName)) {
      const label = role.roleLabel || role.roleName;
      if (label.includes(" - ")) {
        const type = label.split(" - ")[1].trim();
        if (type === "Smart Interviews" || type === "GPP") {
          tType = type;
        } else {
          tType = "Others";
          tOther = type;
        }
      }
    }

    setAdminForm({
      primaryRoleType: pType || "",
      roleId: role.roleId || "",
      roleLabel: role.roleLabel || role.roleName || "",
      level: role.level || "",
      assignedByType: role.assignedBy?.type || role.assignedBy || "",
      assignedByOtherText: role.assignedBy?.otherText || "",
      details: role.details || "",
      trainingProgramType: tType,
      trainingProgramOther: tOther
    });
    setAdminOpen(true);
  };

  const handleAdminSave = async (e) => {
    e.preventDefault();
    if (!adminForm.roleId) { toast.error("Please select an administrative role"); return; }
    if (!adminForm.level) { toast.error("Please select a level"); return; }
    if (!adminForm.assignedByType) { toast.error("Please select who assigned this role"); return; }
    if (adminForm.assignedByType === "Others" && (!adminForm.assignedByOtherText || !adminForm.assignedByOtherText.trim())) {
      toast.error("Please specify the assigning authority"); return;
    }
    if ((adminForm.roleId === "other" || adminForm.roleId === "other_coord") && (!adminForm.roleLabel || !adminForm.roleLabel.trim())) {
      toast.error("Please specify the custom role name"); return;
    }
    if (adminForm.roleId === "training_coord") {
      if (!adminForm.trainingProgramType) {
        toast.error("Please select a training program"); return;
      }
      if (adminForm.trainingProgramType === "Others" && (!adminForm.trainingProgramOther || !adminForm.trainingProgramOther.trim())) {
        toast.error("Please specify the other training program"); return;
      }
    }

    const catalogEntry = ADMIN_ROLE_CATALOG.find((r) => r.roleId === adminForm.roleId);
    if (catalogEntry && !catalogEntry.allowedLevels.includes(adminForm.level)) {
      toast.error(`Level ${adminForm.level} is not allowed for this role`); return;
    }

    const existingRoles = administrationDetail?.roles?.filter(r => r.isResponsible) || [];
    let updatedRoles;

    const newRole = {
      roleId: adminForm.roleId,
      roleLabel: (() => {
        if (adminForm.roleId === "other" || adminForm.roleId === "other_coord") return adminForm.roleLabel.trim();
        if (adminForm.roleId === "training_coord") {
          const suffix = adminForm.trainingProgramType === "Others" ? adminForm.trainingProgramOther.trim() : adminForm.trainingProgramType;
          return `Training Program Coordinator - ${suffix}`;
        }
        return catalogEntry?.label || adminForm.roleLabel;
      })(),
      isResponsible: true,
      level: adminForm.level,
      assignedBy: {
        type: adminForm.assignedByType,
        otherText: adminForm.assignedByType === "Others" ? adminForm.assignedByOtherText.trim() : ""
      },
      details: adminForm.details
    };

    if (adminEditingRole) {
      updatedRoles = existingRoles.map(r => (r.roleId === adminEditingRole || r.roleName === adminEditingRole) ? { ...r, ...newRole, status: 'Pending' } : r);
    } else {
      updatedRoles = [...existingRoles, { ...newRole, status: 'Pending' }];
    }

    try {
      setSubmittingAdmin(true);
      const res = await axiosInstance.post("/api/faculty-administration", {
        academicYear: selectedYear,
        roles: updatedRoles
      });
      if (res.data?.success) {
        toast.success("Administrative role saved successfully!");
        setAdminOpen(false);
        fetchAppraisal();
      }
    } catch (err) {
      toast.error(err.message || err.response?.data?.message || "Failed to save administrative role.");
    } finally {
      setSubmittingAdmin(false);
    }
  };

  const handleAdminDelete = async (roleIdentifier) => {
    if (!window.confirm("Are you sure you want to delete this administrative role?")) return;

    const existingRoles = administrationDetail?.roles || [];
    const updatedRoles = existingRoles.map(r => (r.roleId === roleIdentifier || r.roleName === roleIdentifier) ? { ...r, isResponsible: false } : r);

    try {
      const res = await axiosInstance.post("/api/faculty-administration", {
        academicYear: selectedYear,
        roles: updatedRoles
      });
      if (res.data?.success) {
        toast.success("Administrative role deleted successfully!");
        fetchAppraisal();
      }
    } catch (err) {
      toast.error("Failed to delete administrative role");
    }
  };

  // 3.1 Resource Utilization Form Recalculate Duration (Removed)

  const handleResUtOpenAdd = () => {
    setResUtEditingId(null);
    setResUtForm({
      activityCategory: "",
      activityType: "",
      organizationName: "",
      eventStartDate: "",
      eventEndDate: "",
      numberOfDaysOrganized: "",
      remarks: "",
      numberOfSessions: "",
      numberOfDaysParticipated: "",
      courseFdpName: "",
      organizingInstitutionCategory: "",
      location: "",
      labName: "",
      universityName: "",
      instituteName: "",
      nirfRank: "",
      existingProof: ""
    });
    setIsResUtDocumentRemoved(false);
    setResUtProof(null);
    setResUtOpen(true);
  };

  const handleResUtOpenEdit = (activity) => {
    setResUtEditingId(activity._id);
    setResUtForm({
      activityCategory: activity.activityCategory,
      activityType: activity.activityType,
      organizationName: activity.organizationName,
      eventStartDate: activity.eventStartDate ? activity.eventStartDate.substring(0, 10) : (activity.fromDate ? activity.fromDate.substring(0, 10) : ""),
      eventEndDate: activity.eventEndDate ? activity.eventEndDate.substring(0, 10) : (activity.toDate ? activity.toDate.substring(0, 10) : ""),
      numberOfDaysOrganized: activity.numberOfDaysOrganized !== undefined ? String(activity.numberOfDaysOrganized) : "",
      remarks: activity.remarks || "",
      numberOfSessions: (activity.numberOfSessions !== undefined ? String(activity.numberOfSessions) : (activity.sessionsConducted !== undefined ? String(activity.sessionsConducted) : "")),
      numberOfDaysParticipated: (activity.numberOfDaysParticipated !== undefined ? String(activity.numberOfDaysParticipated) : (activity.daysParticipated !== undefined ? String(activity.daysParticipated) : "")),
      courseFdpName: activity.courseFdpName || "",
      organizingInstitutionCategory: activity.organizingInstitutionCategory || "",
      location: activity.location || "",
      labName: activity.labName || "",
      universityName: activity.universityName || "",
      instituteName: activity.instituteName || "",
      nirfRank: activity.nirfRank !== undefined ? String(activity.nirfRank) : "",
      existingProof: activity.proof || ""
    });
    setIsResUtDocumentRemoved(false);
    setResUtProof(null);
    setResUtOpen(true);
  };

  const handleResUtDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) return;
    try {
      await axiosInstance.delete(`/api/value-addition/resource-utilization/${id}`);
      toast.success("Activity deleted successfully!");
      fetchAppraisal();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete activity.");
    }
  };

  const handleResUtSaveDraft = async () => {


    const isFdpParticipant = resUtForm.activityCategory === "FDP" && resUtForm.activityType === "FDP Participant";
    const basicFieldsValid = isFdpParticipant
      ? (resUtForm.activityCategory && resUtForm.activityType && resUtForm.courseFdpName && resUtForm.eventStartDate && resUtForm.eventEndDate)
      : (resUtForm.activityCategory && resUtForm.activityType && resUtForm.organizationName && resUtForm.eventStartDate && resUtForm.eventEndDate);

    if (!basicFieldsValid) {
      toast.error("Please fill all required fields");
      return;
    }

    if (isFdpParticipant) {
      if (!resUtForm.organizingInstitutionCategory) {
        toast.error("Organizing Institution Category is required");
        return;
      }
      if (!resUtForm.location) {
        toast.error("Location is required");
        return;
      }
      if (resUtForm.organizingInstitutionCategory === "MHRD R&D Lab" && !resUtForm.labName) {
        toast.error("Lab Name is required");
        return;
      }
      if (resUtForm.organizingInstitutionCategory === "Govt. University" && !resUtForm.universityName) {
        toast.error("University Name is required");
        return;
      }
      if (resUtForm.organizingInstitutionCategory === "NIRF Ranked Institute (Below 200)") {
        if (!resUtForm.instituteName) {
          toast.error("Institute Name is required");
          return;
        }
        if (!resUtForm.nirfRank) {
          toast.error("NIRF Rank is required");
          return;
        }
        const rank = parseInt(resUtForm.nirfRank);
        if (isNaN(rank) || rank <= 0 || rank >= 200) {
          toast.error("NIRF Rank must be a positive integer less than 200");
          return;
        }
      }
    }

    if (showOrganizedDaysField) {
      if (!resUtForm.numberOfDaysOrganized) {
        toast.error("Number of Days Organized is required");
        return;
      }
      const days = parseInt(resUtForm.numberOfDaysOrganized, 10);
      if (isNaN(days) || days < 0) {
        toast.error("Number of days cannot be negative");
        return;
      }
      if (resUtForm.eventStartDate && resUtForm.eventEndDate) {
        const fromDate = new Date(resUtForm.eventStartDate);
        const toDate = new Date(resUtForm.eventEndDate);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
        const maxDays = Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
        if (days > maxDays) {
          toast.error(`Number of days cannot exceed the event duration (${maxDays} days)`);
          return;
        }
      }
    }
    if (showSessionsField && !resUtForm.numberOfSessions) {
      toast.error("Number of Sessions Conducted is required for Resource Person role");
      return;
    }
    if (showDaysField && !resUtForm.numberOfDaysParticipated) {
      toast.error("Number of Days Participated is required for Participant role");
      return;
    }
    if (!resUtProof && (!resUtEditingId || isResUtDocumentRemoved)) {
      toast.error("Supporting proof upload is mandatory");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = new Date(resUtForm.eventStartDate);
    const to = new Date(resUtForm.eventEndDate);

    if (from > today || to > today) {
      toast.error("Activity dates cannot be in the future");
      return;
    }
    if (from > to) {
      toast.error("To Date must be greater than or equal to From Date");
      return;
    }

    setResUtLoading(true);
    try {
      const fd = new FormData();
      fd.append("academicYear", selectedYear);
      fd.append("activityCategory", resUtForm.activityCategory);
      fd.append("activityType", resUtForm.activityType);
      fd.append("eventStartDate", resUtForm.eventStartDate);
      fd.append("eventEndDate", resUtForm.eventEndDate);
      if (showOrganizedDaysField) {
        fd.append("numberOfDaysOrganized", resUtForm.numberOfDaysOrganized);
      }
      fd.append("remarks", resUtForm.remarks || "");

      if (isFdpParticipant) {
        fd.append("courseFdpName", resUtForm.courseFdpName);
        fd.append("organizingInstitutionCategory", resUtForm.organizingInstitutionCategory);
        fd.append("location", resUtForm.location);
        fd.append("organizationName", resUtForm.courseFdpName);
        if (resUtForm.organizingInstitutionCategory === "MHRD R&D Lab") {
          fd.append("labName", resUtForm.labName);
        } else if (resUtForm.organizingInstitutionCategory === "Govt. University") {
          fd.append("universityName", resUtForm.universityName);
        } else if (resUtForm.organizingInstitutionCategory === "NIRF Ranked Institute (Below 200)") {
          fd.append("instituteName", resUtForm.instituteName);
          fd.append("nirfRank", resUtForm.nirfRank);
        } else if (resUtForm.organizingInstitutionCategory === "Other / Host Institute") {
          fd.append("instituteName", resUtForm.instituteName);
        }
      } else {
        fd.append("organizationName", resUtForm.organizationName);
      }

      if (showSessionsField && resUtForm.numberOfSessions) {
        fd.append("numberOfSessions", resUtForm.numberOfSessions);
      }
      if (showDaysField && resUtForm.numberOfDaysParticipated) {
        fd.append("numberOfDaysParticipated", resUtForm.numberOfDaysParticipated);
      }
      if (resUtProof) {
        fd.append("proof", resUtProof);
      }

      if (resUtEditingId) {
        await axiosInstance.put(`/api/value-addition/resource-utilization/${resUtEditingId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Resource utilization updated successfully!");
      } else {
        await axiosInstance.post("/api/value-addition/resource-utilization", fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Resource utilization added successfully!");
      }

      setResUtOpen(false);
      fetchAppraisal();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save resource utilization");
    } finally {
      setResUtLoading(false);
    }
  };

  // 3.2 Contribution Form Recalculate Duration
  useEffect(() => {
    if (contForm.fromDate && contForm.toDate) {
      const start = new Date(contForm.fromDate);
      const end = new Date(contForm.toDate);
      if (start <= end) {
        const diffTime = Math.abs(end - start);
        const days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
        setContForm(prev => ({ ...prev, duration: `${days} Days` }));
      }
    }
  }, [contForm.fromDate, contForm.toDate]);

  const handleContOpenAdd = () => {
    setContEditingId(null);
    setContForm({
      category: "",
      organizationName: "",
      fromDate: "",
      toDate: "",
      journalName: "",
      journalConferenceName: "",
      duration: "",
      awardName: "",
      awardDate: "",
      courseName: "",
      url: "",
      certificationName: "",
      eventName: "",
      eventDate: "",
      articleTitle: "",
      publicationName: "",
      publicationDate: "",
      facilityName: "",
      contributionType: "",
      facilityDate: "",
      grantType: "",
      grantTitle: "",
      fundingAgency: "",
      grantAmount: "",
      sanctionDate: "",
      courseHours: "",
      certificateNumber: "",
      memberType: "",
      journalType: "",
      eventType: "",
      studentNames: "",
      existingProof: ""
    });
    setIsContDocumentRemoved(false);
    setContProof(null);
    setContOpen(true);
  };

  const handleContOpenEdit = (item) => {
    setContEditingId(item._id);
    const cat = item.category;
    setContForm({
      category: cat?._id || cat || "",
      organizationName: item.organizationName || "",
      fromDate: item.fromDate ? item.fromDate.substring(0, 10) : "",
      toDate: item.toDate ? item.toDate.substring(0, 10) : "",
      journalName: item.journalName || "",
      journalConferenceName: item.journalConferenceName || "",
      duration: item.duration || "",
      awardName: item.awardName || "",
      awardDate: item.awardDate ? item.awardDate.substring(0, 10) : "",
      courseName: item.courseName || "",
      url: item.url || "",
      certificationName: item.certificationName || "",
      eventName: item.eventName || "",
      eventDate: item.eventDate ? item.eventDate.substring(0, 10) : "",
      articleTitle: item.articleTitle || "",
      publicationName: item.publicationName || "",
      publicationDate: item.publicationDate ? item.publicationDate.substring(0, 10) : "",
      facilityName: item.facilityName || "",
      contributionType: item.contributionType || "",
      facilityDate: item.facilityDate ? item.facilityDate.substring(0, 10) : "",
      grantType: item.grantType || "",
      grantTitle: item.grantTitle || "",
      fundingAgency: item.fundingAgency || "",
      grantAmount: item.grantAmount || "",
      sanctionDate: item.sanctionDate ? item.sanctionDate.substring(0, 10) : "",
      courseHours: item.courseHours || "",
      certificateNumber: item.certificateNumber || "",
      memberType: item.memberType || "",
      journalType: item.journalType || "",
      eventType: item.eventType || "",
      studentNames: item.studentNames || "",
      existingProof: item.proof || ""
    });
    setIsContDocumentRemoved(false);
    setContProof(null);
    setContOpen(true);
  };

  const handleContDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this contribution?")) return;
    try {
      await axiosInstance.delete(`/api/value-addition/contribution/${id}`);
      toast.success("Contribution deleted successfully!");
      fetchAppraisal();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete contribution.");
    }
  };

  const handleContSaveDraft = async () => {
    if (!contForm.category) {
      toast.error("Please select a contribution category");
      return;
    }
    if (!contProof && (!contEditingId || isContDocumentRemoved)) {
      toast.error("Supporting proof upload is mandatory");
      return;
    }

    const cat = getCategoryCode(contForm.category);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validateDate = (dateStr, fieldLabel, allowFuture = false) => {
      if (!dateStr) return `${fieldLabel} is required.`;
      const dateVal = new Date(dateStr);
      if (!allowFuture && dateVal > today) return `${fieldLabel} cannot be in the future.`;
      return null;
    };

    let fieldErr = null;

    if ([1, 2, 3, 7, 12].includes(cat) || (cat === 10 && contForm.contributionType === "Maintenance")) {
      if (!contForm.fromDate || !contForm.toDate) {
        fieldErr = "From Date and To Date are required.";
      } else {
        const from = new Date(contForm.fromDate);
        const to = new Date(contForm.toDate);
        if (from > today) {
          fieldErr = "From Date cannot be in the future.";
        } else if (from > to) {
          fieldErr = "To Date must be greater than or equal to From Date.";
        } else {
          if (([7, 12].includes(cat) || cat === 10) && to > today) {
            fieldErr = "To Date cannot be in the future.";
          }
        }
      }
    }

    if (!fieldErr) {
      switch (cat) {
        case 1:
          if (!contForm.organizationName) fieldErr = "Organization Name is required.";
          break;
        case 2:
          if (!contForm.journalName) fieldErr = "Journal Name is required.";
          break;
        case 3:
          if (!contForm.journalConferenceName) fieldErr = "Journal / Conference Name is required.";
          break;
        case 4:
        case 5:
          if (!contForm.awardName) fieldErr = "Award Name is required.";
          else fieldErr = validateDate(contForm.awardDate, "Award Date");
          break;
        case 6:
          if (!contForm.courseName || !contForm.url) {
            fieldErr = "Course Name and URL are mandatory.";
          }
          break;
        case 7:
          if (!contForm.certificationName) fieldErr = "Certification Name is required.";
          else if (!contForm.fromDate || !contForm.toDate) fieldErr = "From and To dates are required.";
          else if (!contForm.courseHours) fieldErr = "Hours are required.";
          else if (isNaN(Number(contForm.courseHours)) || Number(contForm.courseHours) < 40) fieldErr = "Minimum 40 hours is required.";
          break;
        case 8:
          if (!contForm.eventName) fieldErr = "Event Name is required.";
          else fieldErr = validateDate(contForm.eventDate, "Event Date");
          break;
        case 9:
          if (!contForm.articleTitle || !contForm.publicationName) {
            fieldErr = "Article Title and Publication Name are mandatory.";
          } else fieldErr = validateDate(contForm.publicationDate, "Publication Date");
          break;
        case 10:
          if (!contForm.facilityName) fieldErr = "Facility Name is required.";
          else if (!contForm.contributionType) fieldErr = "Contribution Type is required.";
          else if (contForm.contributionType === "Establishment") {
            fieldErr = validateDate(contForm.fromDate, "Establishment Date");
          }
          break;
        case 11:
          if (!contForm.courseName || !contForm.duration) {
            fieldErr = "Course Name and Duration are required.";
          }
          break;
        case 12:
          if (!contForm.courseName) {
            fieldErr = "Course Name is required.";
          } else if (!contForm.courseHours) {
            fieldErr = "Course Duration (Hours) is required.";
          } else if (isNaN(Number(contForm.courseHours)) || Number(contForm.courseHours) < 40) {
            fieldErr = "Coursera Course must be at least 40 Hours.";
          }
          break;
        case 13:
          if (!contForm.grantType || !contForm.grantTitle || !contForm.fundingAgency || !contForm.grantAmount) {
            fieldErr = "Grant Type, Title, Funding Agency, and Amount are required.";
          } else {
            fieldErr = validateDate(contForm.sanctionDate, "Sanction Date");
          }
          break;
        default:
          fieldErr = "Invalid Category.";
      }
    }

    if (fieldErr) {
      toast.error(fieldErr);
      return;
    }

    setContLoading(true);
    try {
      const fd = new FormData();
      fd.append("academicYear", selectedYear);
      fd.append("category", contForm.category);

      if ([1, 2, 3, 7, 10, 12, 13].includes(cat)) {
        fd.append("fromDate", contForm.fromDate);
        fd.append("toDate", contForm.toDate);
        fd.append("duration", contForm.duration);
      }

      if (contForm.certificateNumber) {
        fd.append("certificateNumber", contForm.certificateNumber);
      }

      if (cat === 1) {
        fd.append("organizationName", contForm.organizationName);
        if (contForm.memberType) fd.append("memberType", contForm.memberType);
      } else if (cat === 2) {
        fd.append("journalName", contForm.journalName);
        if (contForm.journalType) fd.append("journalType", contForm.journalType);
      } else if (cat === 3) {
        fd.append("journalConferenceName", contForm.journalConferenceName);
        if (contForm.journalType) fd.append("journalType", contForm.journalType);
      } else if (cat === 4 || cat === 5) {
        fd.append("awardName", contForm.awardName);
        if (contForm.awardingAgency) fd.append("awardingAgency", contForm.awardingAgency);
        fd.append("awardDate", contForm.awardDate);
      } else if (cat === 6) {
        fd.append("courseName", contForm.courseName);
        fd.append("url", contForm.url);
      } else if (cat === 7) {
        fd.append("certificationName", contForm.certificationName);
        fd.append("courseHours", contForm.courseHours);
      } else if (cat === 8) {
        fd.append("eventName", contForm.eventName);
        fd.append("eventDate", contForm.eventDate);
        if (contForm.eventType) fd.append("eventType", contForm.eventType);
        if (contForm.studentNames) fd.append("studentNames", contForm.studentNames);
      } else if (cat === 9) {
        fd.append("articleTitle", contForm.articleTitle);
        fd.append("publicationName", contForm.publicationName);
        fd.append("publicationDate", contForm.publicationDate);
      } else if (cat === 10) {
        fd.append("facilityName", contForm.facilityName);
        fd.append("contributionType", contForm.contributionType);
      } else if (cat === 11) {
        fd.append("courseName", contForm.courseName);
        fd.append("duration", contForm.duration);
      } else if (cat === 12) {
        fd.append("courseName", contForm.courseName);
        fd.append("courseHours", contForm.courseHours);
        fd.append("certificateNumber", contForm.certificateNumber);
      } else if (cat === 13) {
        fd.append("grantType", contForm.grantType);
        fd.append("grantTitle", contForm.grantTitle);
        fd.append("fundingAgency", contForm.fundingAgency);
        fd.append("grantAmount", contForm.grantAmount);
        fd.append("sanctionDate", contForm.sanctionDate);
      }

      if (contProof) {
        fd.append("proof", contProof);
      }

      if (contEditingId) {
        await axiosInstance.put(`/api/value-addition/contribution/${contEditingId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Contribution updated successfully!");
      } else {
        await axiosInstance.post("/api/value-addition/contribution", fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Contribution added successfully!");
      }

      setContOpen(false);
      fetchAppraisal();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save contribution");
    } finally {
      setContLoading(false);
    }
  };

  const handleResUtCategoryChange = (e) => {
    const category = e.target.value;
    setResUtForm(prev => ({
      ...prev,
      activityCategory: category,
      activityType: "",
      sessionsConducted: "",
      daysParticipated: "",
      courseFdpName: "",
      organizingInstitutionCategory: "",
      location: "",
      labName: "",
      universityName: "",
      instituteName: "",
      nirfRank: ""
    }));
  };

  const handleResUtRoleChange = (e) => {
    const role = e.target.value;
    setResUtForm(prev => ({
      ...prev,
      activityType: role,
      sessionsConducted: "",
      daysParticipated: "",
      courseFdpName: "",
      organizingInstitutionCategory: "",
      location: "",
      labName: "",
      universityName: "",
      instituteName: "",
      nirfRank: ""
    }));
  };

  const handleContCategoryChange = (e) => {
    const category = e.target.value;
    setContForm({
      category: category,
      organizationName: "",
      fromDate: "",
      toDate: "",
      journalName: "",
      journalConferenceName: "",
      duration: "",
      awardName: "",
      awardDate: "",
      courseName: "",
      url: "",
      certificationName: "",
      eventName: "",
      eventDate: "",
      articleTitle: "",
      publicationName: "",
      publicationDate: "",
      facilityName: "",
      facilityDate: "",
      grantName: "",
      sanctionDate: "",
      courseHours: "",
      certificateNumber: "",
      memberType: "",
      journalType: "",
      eventType: "",
      studentNames: ""
    });
  };

  // getContributionNameField removed as it's replaced by getContributionDetailsString

  const getStatusColor = (status) => {
    if (status === 'Approved') return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" };
    if (status === 'Rejected') return { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" };
    if (status === 'Pending at HOD' || status === 'Pending') return { bg: "rgba(232, 160, 0, 0.1)", color: "#e8a000" };
    return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b" }; // Draft
  };

  const calculateResourceUtilizationPoints = (r, config) => {
    const resourceUtConf = config?.valueAddition?.resourceUtilizationPoints || {
      conference: 10,
      sttp: 10,
      fdp: 10,
      guestLecture: 2,
      resourcePerson: 2,
      participated: 1
    };
    let pts = 0;
    const activityRole = (r.activityType || '').toLowerCase();
    const activityCat = (r.activityCategory || '').toLowerCase();

    if (activityRole.includes('resource person') || activityRole.includes('resourceperson')) {
      pts = (parseInt(r.numberOfSessions) || parseInt(r.sessionsConducted) || 1) * (resourceUtConf.resourcePerson ?? 2);
    } else if (activityRole.includes('participant') || activityRole.includes('participated')) {
      // Use manually entered daysParticipated as authoritative; duration is auto-calculated fallback
      const participantDays = parseInt(r.numberOfDaysParticipated) || parseInt(r.daysParticipated) || Number(r.duration) || 1;
      pts = participantDays * (resourceUtConf.participated ?? 1);
    } else if (activityRole.includes('guest lecture') || activityRole.includes('workshop') || activityRole.includes('event')) {
      pts = resourceUtConf.guestLecture ?? 2;
    } else {
      // Organized STTP/FDP/Conference
      if (activityCat.includes('conference')) {
        pts = resourceUtConf.conference ?? 10;
      } else if (activityCat.includes('sttp') || activityCat.includes('refresher')) {
        pts = resourceUtConf.sttp ?? 10;
      } else if (activityCat.includes('fdp') || activityCat.includes('symposium')) {
        pts = resourceUtConf.fdp ?? 10;
      } else {
        pts = resourceUtConf.conference ?? 10; // fallback
      }
    }
    return pts;
  };

  const getResourceUtilizationPoints = (r) => {
    const appraisalItem = appraisal?.valueAddition?.resourceUtilization?.items?.find(i => i.eventId?.toString() === r._id?.toString());
    if (appraisalItem?.awardedPoints !== undefined && appraisalItem?.awardedPoints !== null) {
      return appraisalItem.awardedPoints;
    }
    return calculateResourceUtilizationPoints(r, appraisalConfig);
  };

  const calculateContributionPoints = (item, config) => {
    const expPointsConf = config?.valueAddition?.expertisePoints || {
      memberBOS: 5,
      editorialBoardSCIE: 5,
      editorialBoardESCI: 3,
      awardsGovt: 5,
      awardsOthers: 3,
      developedEContent: 10,
      certificationNewAge: 5,
      hackathonShortlisted: 5,
      newspaperArticle: 3,
      researchFacility: 3,
      nptel12W: 10,
      nptel8W: 8,
      nptel4W: 5,
      coursera: 5,
      grantSanctioned: 5
    };

    const cat = item.category?.code || parseInt(item.category);
    switch (cat) {
      case 1: return expPointsConf.memberBOS ?? 5;
      case 2: return expPointsConf.editorialBoardSCIE ?? 5;
      case 3: return expPointsConf.editorialBoardESCI ?? 3;
      case 4: return expPointsConf.awardsGovt ?? 5;
      case 5: return expPointsConf.awardsOthers ?? 3;
      case 6: return expPointsConf.developedEContent ?? 10;
      case 7: return expPointsConf.certificationNewAge ?? 5;
      case 8: return expPointsConf.hackathonShortlisted ?? 5;
      case 9: return expPointsConf.newspaperArticle ?? 3;
      case 10: return expPointsConf.researchFacility ?? 3;
      case 11:
        const dur = (item.duration || '').toLowerCase();
        if (dur.includes('12')) return expPointsConf.nptel12W ?? 10;
        if (dur.includes('8')) return expPointsConf.nptel8W ?? 8;
        if (dur.includes('4')) return expPointsConf.nptel4W ?? 5;
        return expPointsConf.nptel8W ?? 8;
      case 12: return expPointsConf.coursera ?? 5;
      case 13: return expPointsConf.grantSanctioned ?? 5;
      default: return 0;
    }
  };

  const calculateAdministrativePoints = (r, config) => {
    const adminConf = config?.administration?.rolePoints || {
      deanCentral: 20,
      hodCentral: 15,
      hodDept: 15,
      dyHodDept: 10,
      timetableDept: 10,
      placementCentral: 10,
      placementDept: 10,
      courseraCentral: 10,
      courseraDept: 5,
      edcCentral: 10,
      edcDept: 5,
      courseDept: 5,
      websiteCentral: 10,
      nssCentral: 10,
      nssDept: 5,
      trainingCentral: 10,
      trainingDept: 5,
      drcDept: 5,
      antiRaggingCentral: 5,
      antiRaggingDept: 3,
      otherCentral: 10,
      otherDept: 5
    };

    if (!r.isResponsible || r.status === "Rejected") return 0;

    let pts = 5;
    const level = (r.level || '').toLowerCase();
    const isCentral = level.includes('central') || level.includes('institute');

    const catalogEntry = ADMIN_ROLE_CATALOG.find(c => c.roleId === r.roleId);

    if (catalogEntry) {
      const pg = catalogEntry.pointsGroup;
      const key = pg + (isCentral ? 'Central' : 'Dept');
      pts = adminConf[key] ?? pts;
    } else if (r.roleName && r.roleName.toLowerCase().startsWith('any other')) {
      pts = isCentral ? (adminConf.otherCentral ?? 10) : (adminConf.otherDept ?? 5);
    } else {
      pts = isCentral ? (adminConf.otherCentral ?? 10) : (adminConf.otherDept ?? 5);
    }
    return pts;
  };

  const getCategoryCode = (id) => {
    if (!id) return null;
    if (typeof id === 'object' && id.code) return id.code;
    const searchId = String(typeof id === 'object' ? id._id : id);
    const isNum = /^\d+$/.test(searchId);
    const found = contributionCategories.find(c => String(c._id) === searchId || (isNum && c.code === parseInt(searchId, 10)));
    return found ? found.code : (isNum ? parseInt(searchId, 10) : null);
  };

  const getCategoryName = (catId) => {
    if (typeof catId === 'object' && catId?.name) return catId.name;
    let found = contributionCategories.find(c => c._id === catId);
    if (!found) found = contributionCategories.find(c => c.code === parseInt(catId));
    return found ? found.name : `Category ${catId}`;
  };

  const getContributionDetailsString = (item) => {
    if (!item) return "N/A";
    const catCode = getCategoryCode(item.category);
    const catName = getCategoryName(item.category);
    const fDate = item.fromDate ? new Date(item.fromDate).toLocaleDateString('en-GB') : "";
    const tDate = item.toDate ? new Date(item.toDate).toLocaleDateString('en-GB') : "";

    switch (catCode) {
      case 1: {
        const typeMap = {
          'BOG': 'the Board of Governance',
          'GB': 'the Governing Body',
          'AC': 'the Academic Council',
          'BOS': 'the Board of Studies'
        };
        const mType = typeMap[item.memberType] || item.memberType || 'N/A';
        return `Member of ${mType} of ${item.organizationName || 'N/A'}. (From ${fDate} to ${tDate})`;
      }
      case 2:
      case 3: return `Member of the Editorial Board of ${item.journalName || 'N/A'} (Type: ${item.journalType || 'N/A'}) (${fDate} to ${tDate})`;
      case 4:
      case 5: return `Awarded as ${item.awardName || 'N/A'} by ${item.awardingAgency || 'N/A'} on ${item.awardDate ? new Date(item.awardDate).toLocaleDateString('en-GB') : 'N/A'}`;
      case 6: return (
        <span>
          Developed e-content for the course {item.courseName || 'N/A'}
          {item.url && (
            <>
              {" "}
              &bull;{" "}
              <a href={item.url} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
                View Resource
              </a>
            </>
          )}
        </span>
      );
      case 7: return `Completed the certification ${item.certificationName || 'N/A'} from ${fDate} to ${tDate} (${item.courseHours || 'N/A'} hours).`;
      case 8: return `Trained student(s) ${item.studentNames || 'N/A'} shortlisted for the finals of the ${item.eventType || 'N/A'} "${item.eventName || 'N/A'}" on ${item.eventDate ? new Date(item.eventDate).toLocaleDateString('en-GB') : 'N/A'}.`;
      case 9: return `Published the article "${item.articleTitle || 'N/A'}" in ${item.publicationName || 'N/A'} on ${item.publicationDate ? new Date(item.publicationDate).toLocaleDateString('en-GB') : 'N/A'}.`;
      case 10: return item.contributionType === "Establishment" ? `Established the research facility ${item.facilityName || 'N/A'} on ${fDate}.` : `Maintained the research facility ${item.facilityName || 'N/A'} from ${fDate} to ${tDate}.`;
      case 11: return `Completed the NPTEL course ${item.courseName || 'N/A'} with a duration of ${item.duration || 'N/A'}.`;
      case 12: return `Completed the Coursera course ${item.courseName || 'N/A'} from ${fDate} to ${tDate} (${item.courseHours || 'N/A'} hours).`;
      case 13: return `Received a ${item.grantType?.toLowerCase() || 'grant'} of ₹${item.grantAmount || 0} from ${item.fundingAgency || 'N/A'} for "${item.grantTitle || 'N/A'}" on ${item.sanctionDate ? new Date(item.sanctionDate).toLocaleDateString('en-GB') : 'N/A'}.`;
      default: return catName;
    }
  };

  const getFacultyCategory = (fac) => {
    if (!fac) return "Non-Doctorate Faculty";
    const lead = (fac.leadership || "").toLowerCase().trim();
    const qual = (fac.qualification || "").toLowerCase().trim();
    const doct = (fac.doctorate || "").toLowerCase().trim();

    if (lead === "yes" || lead === "true") return "Leadership Team";
    if (qual.includes("phd") || qual.includes("ph.d") || doct === "yes" || doct === "true") return "Doctorate Faculty";
    return "Non-Doctorate Faculty";
  };

  const getCategoryThresholds = (category) => {
    if (category === "Doctorate Faculty") {
      return { teaching: 50, metric21: 40, total1to4: 135, grandTotal: 165 };
    }
    if (category === "Leadership Team") {
      return { teaching: 40, metric21: 30, total1to4: 110, grandTotal: 140 };
    }
    return { teaching: 50, metric21: 30, total1to4: 110, grandTotal: 140 };
  };



  const checkFdpCourseraRequirement = () => {
    const allowedOrg = [
      "ugc", "aicte", "iit", "iim", "nit", "mhrd r&d lab", "mhrd r&d labs",
      "nitttr", "niper", "icmr", "nirf ranked institute (below 200)",
      "nirf ranked institute (below rank 200)", "govt. university", "government university", "nptel"
    ];

    const hasValidFdp = resourceUtilizationDetails.some(r => {
      if (r.status === 'Rejected') return false;
      const cat = (r.activityCategory || '').toLowerCase().trim();
      const type = (r.activityType || '').toLowerCase().trim();
      const org = (r.organizingInstitutionCategory || '').toLowerCase().trim();
      const days = Number(r.numberOfDaysParticipated) || Number(r.daysParticipated) || Number(r.duration) || 0;
      if (cat === 'fdp' && type === 'fdp participant' && days >= 5 && allowedOrg.includes(org)) {
        if (org.includes("nirf")) {
          const rank = Number(r.nirfRank);
          return !isNaN(rank) && rank > 0 && rank < 200;
        }
        return true;
      }
      return false;
    });

    const hasValidCoursera40Hours = contributionDetails.some(c => {
      if (c.status === 'Rejected') return false;
      const cat = getCategoryCode(c.category);
      return cat === 12 && Number(c.courseHours) >= 40;
    });

    return hasValidFdp || hasValidCoursera40Hours;
  };

  const getMetric21Score = () => {
    return appraisal?.research?.papers?.totalClaimed || 0;
  };

  const calculateOverallScores = () => {
    if (!appraisal) return { total1to4: 0, grandTotal: 0, T: 0, R_sum: 0, V: 0, A: 0, I: 0 };
    const T = Number(appraisal.teaching?.totalClaimed) || 0;
    const R_sum = Number(appraisal.research?.totalClaimed) || 0;

    // Compute V live from sub-sections (each capped at 10) so it always reflects latest calculations
    // Helper gets awardedPoints or falls back to calculateResourceUtilizationPoints
    const resUtilTotal = resourceUtilizationDetails?.reduce((sum, r) => r.status !== 'Rejected' ? sum + getResourceUtilizationPoints(r) : sum, 0) || 0;
    const contribTotal = contributionDetails?.reduce((sum, r) => r.status !== 'Rejected' ? sum + calculateContributionPoints(r, appraisalConfig) : sum, 0) || 0;
    const cappedResUtil = Math.min(10, resUtilTotal);
    const cappedContrib = Math.min(10, contribTotal);
    const V = cappedResUtil + cappedContrib;

    // Compute A live from administrationDetail.roles list
    const adminRolesList = administrationDetail?.roles?.filter(r => r.isResponsible) || [];
    const adminRaw = adminRolesList.reduce((sum, r) => r.status !== 'Rejected' ? sum + calculateAdministrativePoints(r, appraisalConfig) : sum, 0);
    const A = Math.min(20, adminRaw);

    const I = Number(appraisal.hodEvaluation?.totalInterpersonalPoints) || 0;

    const total1to4 = parseFloat((Math.min(200, T + R_sum + V + A)).toFixed(2));
    const grandTotal = parseFloat((total1to4 + I).toFixed(2));

    return { T, R_sum, V, A, I, total1to4, grandTotal };
  };

  const calculateProgressPercentage = () => {
    if (!appraisal) return 0;
    const category = getFacultyCategory(faculty);
    const thresholds = getCategoryThresholds(category);
    const scores = calculateOverallScores();

    // 1. Profile Completeness: 100% if complete, 0% if not
    const profileProgress = profileComplete ? 100 : 0;

    // 2. FDP / Coursera Requirement: 100% if met, 0% if not
    const fdpCourseraPassed = checkFdpCourseraRequirement();
    const fdpProgress = fdpCourseraPassed ? 100 : 0;

    // 3. Teaching: Current / Min Threshold
    const teachingProgress = thresholds.teaching > 0
      ? Math.min(100, Math.round((scores.T / thresholds.teaching) * 100))
      : 100;

    // 4. Research 2.1 (Papers): Current / Min Threshold
    const metric21Score = getMetric21Score();
    const metric21Progress = thresholds.metric21 > 0
      ? Math.min(100, Math.round((metric21Score / thresholds.metric21) * 100))
      : 100;

    // 5. Research 2.2 to 2.8: Min Doctorates 10, others 0
    const r22To28Threshold = category === "Doctorate Faculty" ? 10 : 0;
    const r22To28Score = scores.R_sum - metric21Score;
    const r22To28Progress = r22To28Threshold > 0
      ? Math.min(100, Math.round((r22To28Score / r22To28Threshold) * 100))
      : 100;

    // 6. Value Addition: Min 20
    const valueAdditionProgress = Math.min(100, Math.round((scores.V / 20) * 100));

    // 7. Administration: Doctorate 15, Leadership 20, Non-Doctorate 10
    const adminThreshold = category === "Doctorate Faculty" ? 15 : (category === "Leadership Team" ? 20 : 10);
    const adminProgress = adminThreshold > 0
      ? Math.min(100, Math.round((scores.A / adminThreshold) * 100))
      : 100;

    const total =
      profileProgress +
      fdpProgress +
      teachingProgress +
      metric21Progress +
      r22To28Progress +
      valueAdditionProgress +
      adminProgress;

    return Math.min(100, Math.max(0, Math.round(total / 7)));
  };

  const getEligibilityChecklist = () => {
    const category = getFacultyCategory(faculty);
    const thresholds = getCategoryThresholds(category);
    const scores = calculateOverallScores();

    const fdpCourseraPassed = checkFdpCourseraRequirement();
    const metric21Score = getMetric21Score();
    const metric21Passed = metric21Score >= thresholds.metric21;
    const teachingPassed = scores.T >= thresholds.teaching;
    const total1to4Passed = scores.total1to4 >= thresholds.total1to4;
    const interpersonalScore = scores.I;
    const interpersonalPassed = interpersonalScore >= 30;
    const grandTotalPassed = scores.grandTotal >= thresholds.grandTotal;

    const canSubmit = fdpCourseraPassed && metric21Passed;

    return {
      category,
      thresholds,
      scores,
      canSubmit,
      checklist: {
        fdpCoursera: {
          label: "FDP / Coursera",
          desc: "FDP of min 5 days by allowed organizers OR Coursera course (min 40 Hours) completed",
          passed: fdpCourseraPassed,
          isGating: true
        },
        metric21: {
          label: `Metric 2.1 Score (Min ${thresholds.metric21})`,
          desc: `Current: ${metric21Score}`,
          passed: metric21Passed,
          isGating: true
        }
      }
    };
  };

  // Claim Publication Submit handler
  const handleClaimSubmit = async () => {
    if (!selectedPaper) return;

    const formData = new FormData();
    formData.append("researchId", selectedPaper.paperId);
    formData.append("researchType", "Journal");
    formData.append("doiOrIsbn", selectedPaper.doi);
    formData.append("academicYearId", selectedYear);
    if (undertakingFile) {
      formData.append("undertaking", undertakingFile);
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/appraisal/claim-research", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data && res.data.success) {
        toast.success("Publication claimed successfully!");
        setClaimModalOpen(false);
        setUndertakingFile(null);
        fetchAppraisal(); // recalculate
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to claim publication.");
    } finally {
      setLoading(false);
    }
  };

  const renderGatekeeperModal = () => {
    return (
      <Dialog
        open={showGatekeeperModal}
        onClose={() => setShowGatekeeperModal(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              background: "var(--bg-panel)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-premium)"
            }
          }
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-accent-4)", py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Warning sx={{ color: "#e8a000" }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>Action Required: Unresolved Co-Authored Publications</Typography>
          </Box>
          <IconButton onClick={() => setShowGatekeeperModal(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 3 }}>
            Below are co-authored publications for this academic year where the appraisal claimant has not been selected.
            <strong> Applicants</strong> must select who will claim the points. <strong>Co-authors</strong> must wait for the applicant to resolve.
          </Typography>

          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", boxShadow: "none", width: "100%" }}>
            <Table size="small" sx={{ minWidth: 650, mx: "auto" }}>
              <TableHead sx={{ background: "var(--gradient-primary)" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Title / Details</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Applicant</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Action / Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unresolvedClaims.map((claim) => (
                  <TableRow key={claim._id}>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <Chip label={claim.type} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{claim.title}</Typography>
                      <Typography variant="caption" sx={{ color: "var(--text-secondary)", display: "block" }}>{claim.info}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{claim.applicant?.name || "N/A"}</Typography>
                      <Typography variant="caption" sx={{ color: "var(--text-secondary)" }}>{claim.applicant?.institutionId}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      {claim.isApplicant ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, justifyContent: "center" }}>
                          <FormControl size="small" sx={{ minWidth: 200 }}>
                            <Select
                              displayEmpty
                              value={selectedClaimants[claim._id] || ""}
                              onChange={(e) => setSelectedClaimants({
                                ...selectedClaimants,
                                [claim._id]: e.target.value
                              })}
                              disabled={resolvingClaimId === claim._id}
                            >
                              <MenuItem value="" disabled>Select Claimant</MenuItem>
                              {claim.eligibleClaimants.map((el, idx) => (
                                <MenuItem key={el.institutionId || el.name || idx} value={el.institutionId || el.name}>
                                  {el.name}{el.institutionId ? ` (${el.institutionId})` : ""}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleResolveClaim(claim._id, claim.type, selectedClaimants[claim._id])}
                            disabled={!selectedClaimants[claim._id] || resolvingClaimId === claim._id}
                            sx={{
                              background: "var(--gradient-primary)",
                              color: "#fff",
                              fontWeight: 700,
                              textTransform: "none",
                              px: 2,
                              py: 0.8
                            }}
                          >
                            Resolve
                          </Button>
                        </Box>
                      ) : (
                        <Chip
                          label={`Awaiting ${claim.applicant?.name || "Applicant"}`}
                          size="small"
                          sx={{ bgcolor: "rgba(232, 160, 0, 0.1)", color: "#e8a000", fontWeight: 700 }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid var(--border-color)" }}>
          <Button onClick={() => setShowGatekeeperModal(false)} sx={{ fontWeight: 700 }}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (viewMode === "list") {
    if (fetchingAppraisals) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <Loader />
        </Box>
      );
    }
    return (
      <Box>
        <PageHeader
          title="Faculty Self Appraisal"
          subtitle="Manage and submit your self appraisal applications"
        />
        <Box p={3} sx={{ animation: "fadeIn 0.5s ease" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>
              My Appraisals
            </Typography>
            <Button
              variant="contained"
              onClick={handleApplyNew}
              sx={{
                background: "var(--gradient-primary)",
                px: 3,
                fontWeight: 700,
                textTransform: "none",
                "&:hover": { opacity: 0.9, transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
                transition: "all 0.2s ease"
              }}
            >
              Apply New
            </Button>
          </Box>

          {myAppraisals.length === 0 ? (
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
                No Previous Appraisals
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: "400px" }}>
                You haven't submitted any appraisal details yet. Click the "Apply New" button to start.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", overflowX: "auto" }}>
              <Table sx={{ minWidth: 700 }}>
                <TableHead sx={{ background: "var(--gradient-primary)" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }}>Academic Year</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }} align="center">Min Points Required</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }} align="center">Total Points Gained</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }} align="center">Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#fff", py: 2 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {myAppraisals.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((app) => (
                    <TableRow key={app._id} sx={{ "&:hover": { background: "var(--bg-accent-1)" }, transition: "background 0.15s" }}>
                      <TableCell sx={{ color: "var(--text-secondary)", py: 2, fontWeight: 600 }}>{app.academicYearId?.year || "N/A"}</TableCell>
                      <TableCell align="center" sx={{ color: "var(--text-secondary)", py: 2, fontWeight: 600 }}>{app.minPointsRequired}</TableCell>
                      <TableCell align="center" sx={{ py: 2 }}>
                        <Chip label={app.totalPointsGained} color="primary" variant="outlined" size="small" sx={{ fontWeight: 700, fontSize: "0.85rem", minWidth: "60px" }} />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2 }}>
                        {getStatusChip(app.status)}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2 }}>
                        <IconButton
                          color="primary"
                          onClick={() => {
                            if (app.status === 'Completed') {
                              navigate(`/appraisal/details/${app._id}`);
                            } else {
                              setAcademicYears([app.academicYearId]);
                              setSelectedYear(app.academicYearId._id);
                              setViewMode("form");
                            }
                          }}
                          sx={{ bgcolor: "rgba(59,130,246,0.1)", "&:hover": { bgcolor: "rgba(59,130,246,0.2)" } }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={myAppraisals.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[5, 10, 25]}
                sx={{
                  borderTop: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                  ".MuiTablePagination-select": { color: "var(--text-primary)" },
                  ".MuiTablePagination-selectIcon": { color: "var(--text-secondary)" },
                  ".MuiIconButton-root": { color: "var(--text-secondary)" },
                  ".MuiIconButton-root.Mui-disabled": { opacity: 0.3 }
                }}
              />
            </TableContainer>
          )}
        </Box>
      </Box>
    );
  }

  if (!appraisal) {
    if (appraisalError) {
      return (
        <Box p={4} sx={{ maxWidth: 800, margin: "40px auto", textAlign: "center" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "stretch", sm: "center" },
              mb: 4,
              p: 3,
              borderRadius: "20px",
              background: "var(--bg-panel)",
              border: "1px solid var(--border-color)",
              backdropFilter: "blur(12px)",
              gap: 2
            }}
          >
            <Box sx={{ textAlign: "left" }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                Faculty Self Appraisal Portal
              </Typography>
              <Typography variant="body2" color="var(--text-secondary)">
                Appraisal Academic Year
              </Typography>
            </Box>
            {selectedYear && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.2, px: 2.5, borderRadius: "10px", background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                  Appraisal Year: {academicYears.find(y => y._id === selectedYear)?.year || "Loading..."}
                </Typography>
              </Box>
            )}
          </Box>

          <Card sx={{ p: 4, borderRadius: "20px", border: "1px solid var(--border-color)", background: "var(--bg-panel)", boxShadow: "var(--shadow-premium)" }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <Info sx={{ fontSize: 60, color: "var(--color-primary)" }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 2 }}>
              Appraisal Inactive
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>
              {appraisalError}
            </Typography>
          </Card>
        </Box>
      );
    }

    if (unresolvedClaims && unresolvedClaims.length > 0) {
      return (
        <Box p={4} sx={{ maxWidth: 800, margin: "40px auto", textAlign: "center" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "stretch", sm: "center" },
              mb: 4,
              p: 3,
              borderRadius: "20px",
              background: "var(--bg-panel)",
              border: "1px solid var(--border-color)",
              backdropFilter: "blur(12px)",
              gap: 2
            }}
          >
            <Box sx={{ textAlign: "left" }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                Faculty Self Appraisal Portal
              </Typography>
              <Typography variant="body2" color="var(--text-secondary)">
                Appraisal Academic Year
              </Typography>
            </Box>
            {selectedYear && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.2, px: 2.5, borderRadius: "10px", background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                  Appraisal Year: {academicYears.find(y => y._id === selectedYear)?.year || "Loading..."}
                </Typography>
              </Box>
            )}
          </Box>

          <Card sx={{ p: 4, borderRadius: "20px", border: "1px solid var(--border-color)", background: "var(--bg-panel)", boxShadow: "var(--shadow-premium)" }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <Warning sx={{ fontSize: 60, color: "#e8a000" }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 2 }}>
              Action Required: Unresolved Co-Authored Claims
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 4 }}>
              You have pending co-authored publications for the selected academic year. You must designate the appraisal claimant before you can proceed to your self-appraisal form.
            </Typography>

            <Button
              variant="contained"
              onClick={() => setShowGatekeeperModal(true)}
              sx={{ background: "var(--gradient-primary)", color: "#fff", fontWeight: 700, px: 4, py: 1.5 }}
            >
              Resolve Pending Claims
            </Button>
          </Card>
          {renderGatekeeperModal()}
        </Box>
      );
    }

    return (
      <Box
        sx={{
          p: 4,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <Typography color="var(--text-secondary)" mb={2}>
          Loading appraisal details...
        </Typography>
      </Box>
    );
  }

  const eligibility = getEligibilityChecklist();

  return (
    <Box>
      <PageHeader
        title="Faculty Self Appraisal"
        subtitle="Fill, review, and submit your performance appraisal form."
        onBack={() => setViewMode("list")}
      />
      <Box p={4} sx={{ maxWidth: 1300, margin: "0 auto", animation: "fadeIn 0.5s ease" }}>

        {appraisal.status === 'Rejected' && appraisal.hodComment && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.3)", '& .MuiAlert-message': { width: '100%' } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Appraisal Rejected by HOD</Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}><strong>Remarks:</strong> {appraisal.hodComment}</Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>Please fix the mentioned issues and resubmit your appraisal.</Typography>
          </Alert>
        )}

        {/* Header Panel */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            mb: 4,
            p: 3.5,
            borderRadius: "24px",
            background: "var(--bg-panel)",
            border: "1px solid var(--border-color)",
            backdropFilter: "blur(12px)",
            boxShadow: "var(--shadow-premium)",
            gap: 3
          }}
        >
          {/* Top Row: Status and Academic Year */}
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, alignItems: { xs: "stretch", md: "center" }, justifyContent: "space-between", width: "100%" }}>
            {appraisal.status === "Draft" || appraisal.status === "Rejected by HOD" ? (
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={handleSubmit}
                disabled={loading}
                sx={{
                  whiteSpace: "nowrap",

                  textTransform: "none",
                  fontWeight: 800,
                  px: 4,
                  py: 1.2,
                  boxShadow: "0 4px 14px rgba(0, 78, 146, 0.3)",
                  background: "var(--color-primary)",
                  color: "var(--bg-paper)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background: "var(--gradient-primary-hover)",
                    transform: "translateY(-1px)",
                    boxShadow: "0 6px 20px rgba(0, 78, 146, 0.4)"
                  },
                  "&.Mui-disabled": {
                    background: "var(--border-color)",
                    color: "var(--text-secondary)"
                  }
                }}
              >
                Submit to HOD
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Chip
                  label={`Status: ${appraisal.status}`}
                  icon={<AssignmentTurnedIn sx={{ color: "#fff !important" }} />}
                  sx={{
                    fontWeight: 800,
                    px: 2.5,
                    py: 2.5,
                    borderRadius: "20px",
                    whiteSpace: "nowrap",
                    background: "var(--gradient-primary)",
                    color: "#fff",
                    border: "none",
                    boxShadow: "0 4px 14px rgba(0, 78, 146, 0.3)"
                  }}
                />
                {appraisal.status === 'Completed' && (
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/appraisal/details/${appraisal._id}`)}
                    startIcon={<Visibility />}
                    sx={{
                      fontWeight: 800,
                      borderRadius: "12px",
                      textTransform: "none",
                      borderColor: "var(--color-primary)",
                      color: "var(--color-primary)",
                      height: "44px",
                      "&:hover": {
                        background: "rgba(59, 130, 246, 0.1)",
                        borderColor: "var(--color-primary)"
                      }
                    }}
                  >
                    View Details
                  </Button>
                )}
              </Box>
            )}

            {selectedYear && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.2, px: 2.5, borderRadius: "10px", background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.2)", minWidth: 200, justifyContent: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                  Appraisal Year: {academicYears.find(y => y._id === selectedYear)?.year || "Loading..."}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Bottom Row: Avatar and Title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, width: "100%" }}>
            {/* Profile Photo Avatar Frame */}
            <Box sx={{ position: "relative" }}>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "18px",
                  background: "rgba(59, 130, 246, 0.08)",
                  border: "2px solid rgba(59, 130, 246, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.05)"
                }}
              >
                <Person sx={{ fontSize: 36, color: "var(--color-primary)" }} />
              </Box>
              {/* Overlapping gold status badge at bottom right */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  backgroundColor: "#e8a000",
                  border: "2px solid var(--bg-paper)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)"
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                  ✓
                </Typography>
              </Box>
            </Box>

            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Faculty Self Appraisal Portal
              </Typography>
              <Typography variant="body2" color="var(--text-secondary)" sx={{ mt: 0.5 }}>
                Fill, review, and submit your performance appraisal form.
              </Typography>
            </Box>
          </Box>

          {/* Custom Progress Bar Loader */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Progress
            </Typography>
            <Box sx={{ flexGrow: 1, height: 10, borderRadius: 5, bgcolor: "var(--border-color)", overflow: "hidden", position: "relative" }}>
              <Box
                sx={{
                  height: "100%",
                  borderRadius: 5,
                  width: `${calculateProgressPercentage()}%`,
                  background: "var(--gradient-primary)",
                  boxShadow: "0 0 10px rgba(0, 78, 146, 0.2)",
                  transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
              {calculateProgressPercentage()}%
            </Typography>
          </Box>
        </Box>

        {/* Completeness Warning Banner */}
        {!profileComplete && (
          <Alert severity="warning" variant="filled" sx={{ mb: 4, borderRadius: "16px" }}>
            <AlertTitle sx={{ fontWeight: 700 }}>Profile Details Incomplete</AlertTitle>
            {(() => {
              const hasCoreDeptMissing = missingFields.includes("Parent Department");
              const otherMissingFields = missingFields.filter(f => f !== "Parent Department");
              return (
                <Box>
                  {otherMissingFields.length > 0 && (
                    <Typography variant="body2" sx={{ mb: hasCoreDeptMissing ? 1.5 : 0 }}>
                      You must complete the following fields in your profile before you can submit this appraisal to HOD:
                      <strong> {otherMissingFields.join(", ")}</strong>. Please navigate to the Profile settings to update them.
                    </Typography>
                  )}
                  {hasCoreDeptMissing && (
                    <Typography variant="body2">
                      Your <strong>Parent Department</strong> is not set. Please contact the <strong>Administrator</strong> or your <strong>HOD</strong> to assign it before submitting your appraisal.
                    </Typography>
                  )}
                </Box>
              );
            })()}
          </Alert>
        )}


        {/* Main Grid */}
        <Grid container spacing={4}>

          {/* Left Side: Detail Sheets - NOW SPANNING FULL WIDTH (xs={12}) */}
          <Grid size={{ xs: 12 }}>
            <Card
              sx={{
                borderRadius: "24px",
                background: "var(--bg-panel)",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-premium)",
                overflow: "visible",
                mb: 4
              }}
            >
              {/* Horizontal Navigation Tabs */}
              <Box sx={{ borderBottom: "1px solid var(--border-color)", px: { xs: 2, md: 3 } }}>
                <Tabs
                  value={activeTab}
                  onChange={(e, newTab) => setActiveTab(newTab)}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{
                    "& .MuiTabs-indicator": {
                      backgroundColor: "var(--color-primary)",
                      height: "3px",
                      borderRadius: "3px 3px 0 0"
                    }
                  }}
                >
                  <Tab label="Personal Info" icon={<Person fontSize="small" />} iconPosition="start" sx={horizontalTabStyle} />
                  <Tab label="Teaching & Learning" icon={<School fontSize="small" />} iconPosition="start" sx={horizontalTabStyle} />
                  <Tab label="Research Contributions" icon={<Science fontSize="small" />} iconPosition="start" sx={horizontalTabStyle} />
                  <Tab label="Value Addition" icon={<WorkspacePremium fontSize="small" />} iconPosition="start" sx={horizontalTabStyle} />
                  <Tab label="Administrative Roles" icon={<SupervisorAccount fontSize="small" />} iconPosition="start" sx={horizontalTabStyle} />
                </Tabs>
              </Box>

              {/* Tab content panel */}
              <Box sx={{ p: { xs: 2, md: 3.5 } }}>
                {activeTab === 0 && (
                  <Box sx={{ animation: "fadeIn 0.3s ease" }}>
                    {/* PART-A: Personal Information */}
                    <Card sx={{ borderRadius: "20px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", mb: 0, boxShadow: "none" }}>
                      <CardContent sx={{ p: 3.5 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Person sx={{ color: "#e8a000" }} /> PART-A: Personal Information
                          </Typography>

                          {profileComplete ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, bgcolor: "rgba(16, 185, 129, 0.1)", color: "#10b981", px: 2, py: 0.5, borderRadius: "20px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                              <CheckCircle sx={{ fontSize: 16 }} />
                              <Typography variant="caption" sx={{ fontWeight: 800 }}>Completed</Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, bgcolor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", px: 2, py: 0.5, borderRadius: "20px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                              <Cancel sx={{ fontSize: 16 }} />
                              <Typography variant="caption" sx={{ fontWeight: 800 }}>Incomplete</Typography>
                            </Box>
                          )}
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5 }}>
                          {[
                            {
                              label: "Name with Emp ID",
                              val: `${appraisal.personalInfoSnapshot?.name || "N/A"} (${appraisal.personalInfoSnapshot?.institutionId || "N/A"})`,
                              icon: <Badge sx={{ fontSize: 22 }} />,
                              iconBg: "rgba(59, 130, 246, 0.12)",
                              iconColor: "#3b82f6"
                            },
                            {
                              label: "Designation & Dept",
                              val: `${appraisal.personalInfoSnapshot?.designation || "N/A"} - ${appraisal.personalInfoSnapshot?.departmentName || "N/A"}`,
                              icon: <Work sx={{ fontSize: 22 }} />,
                              iconBg: "rgba(168, 85, 247, 0.12)",
                              iconColor: "#a855f7"
                            },
                            {
                              label: "Qualification",
                              val: appraisal.personalInfoSnapshot?.qualification || "N/A",
                              icon: <School sx={{ fontSize: 22 }} />,
                              iconBg: "rgba(16, 185, 129, 0.12)",
                              iconColor: "#10b981"
                            },
                            {
                              label: "Scopus ID",
                              val: appraisal.personalInfoSnapshot?.scopusId || "N/A",
                              icon: <Description sx={{ fontSize: 22 }} />,
                              iconBg: "rgba(234, 179, 8, 0.12)",
                              iconColor: "#e8a000"
                            },
                            {
                              label: "Web of Science ID",
                              val: appraisal.personalInfoSnapshot?.wosId || "N/A",
                              icon: <Public sx={{ fontSize: 22 }} />,
                              iconBg: "rgba(244, 63, 94, 0.12)",
                              iconColor: "#f43f5e"
                            },
                            {
                              label: "ORCID ID",
                              val: appraisal.personalInfoSnapshot?.orcidId || "N/A",
                              icon: <Fingerprint sx={{ fontSize: 22 }} />,
                              iconBg: "rgba(6, 182, 212, 0.12)",
                              iconColor: "#06b6d4"
                            }
                          ].map((item, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                flex: {
                                  xs: "1 1 100%",
                                  sm: "1 1 calc(50% - 10px)",
                                  md: "1 1 calc(33.333% - 14px)"
                                },
                                minWidth: 0,
                                display: "flex"
                              }}
                            >
                              <Card
                                elevation={0}
                                sx={{
                                  p: 2,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  borderRadius: "16px",
                                  border: "1px solid var(--border-color)",
                                  background: "var(--bg-paper)",
                                  height: "100%",
                                  width: "100%",
                                  transition: "all 0.3s ease",
                                  "&:hover": {
                                    transform: "translateY(-3px)",
                                    boxShadow: "var(--shadow-premium)",
                                    borderColor: "var(--color-primary)"
                                  }
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: item.iconBg,
                                    color: item.iconColor,
                                    flexShrink: 0
                                  }}
                                >
                                  {item.icon}
                                </Box>
                                <Box sx={{ overflow: "hidden" }}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "var(--text-secondary)",
                                      fontWeight: 700,
                                      textTransform: "uppercase",
                                      fontSize: "0.68rem",
                                      letterSpacing: "0.3px",
                                      display: "block"
                                    }}
                                  >
                                    {item.label}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 700,
                                      color: "var(--text-primary)",
                                      mt: 0.5,
                                      wordBreak: "break-word",
                                      lineHeight: 1.3
                                    }}
                                  >
                                    {item.val}
                                  </Typography>
                                </Box>
                              </Card>
                            </Box>
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {activeTab === 1 && (
                  <Box sx={{ animation: "fadeIn 0.3s ease" }}>
                    {/* 1. Teaching & Learning */}
                    <Card sx={{ borderRadius: "20px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", mb: 0, boxShadow: "none" }}>
                      <CardContent sx={{ p: 3.5 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
                              <MenuBook sx={{ color: "var(--color-primary)" }} /> 1. Teaching & Learning
                            </Typography>
                            <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, display: "block", ml: 5 }}>
                              Maximum Points: 80
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, bgcolor: "rgba(59, 130, 246, 0.04)", p: "8px 16px", borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.1)", width: { xs: "100%", sm: "auto" } }}>
                            <Box>
                              <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>
                                Total Points Earned
                              </Typography>
                              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>
                                  {eligibility.scores.T}
                                </Typography>
                                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>
                                  / 80
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ position: "relative", display: "inline-flex" }}>
                              <Loader
                                variant="determinate"
                                value={100}
                                size={40}
                                thickness={4}
                                sx={{ color: "var(--border-color)", opacity: 0.15 }}
                              />
                              <Loader
                                variant="determinate"
                                value={Math.min(100, Math.round((eligibility.scores.T / 80) * 100))}
                                size={40}
                                thickness={4}
                                sx={{
                                  color: "var(--color-primary)",
                                  position: "absolute",
                                  left: 0
                                }}
                              />
                              <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: "absolute", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.7rem" }}>
                                  {Math.min(100, Math.round((eligibility.scores.T / 80) * 100))}%
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        {/* 1.1 Course pass percentage */}
                        {!(appraisal.status === "Completed" && (!appraisal.teaching.passPercentage?.courses || appraisal.teaching.passPercentage.courses.length === 0)) && (
                          <>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                              1.1 Course Average Pass Percentage
                            </Typography>
                            <TableContainer component={Paper} elevation={0} sx={{ mb: 3.5, borderRadius: "16px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", boxShadow: "none", width: "100%" }}>
                              <Table size="small" sx={{ minWidth: 650, mx: "auto" }}>
                                <TableHead sx={{ background: "var(--gradient-primary)" }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Course Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Sem-Branch-Sec</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Appeared</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Passed</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Pass %</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Points claimed</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {appraisal.teaching.passPercentage.courses.length > 0 ? (
                                    <>
                                      {appraisal.teaching.passPercentage.courses.map((c, i) => (
                                        <TableRow key={i} sx={{ "&:hover": { bgcolor: "var(--bg-hover)" } }}>
                                          <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.courseName}</TableCell>
                                          <TableCell sx={{ color: "var(--text-primary)" }}>{c.secBranchSem}</TableCell>
                                          <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{c.appeared}</TableCell>
                                          <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{c.passed}</TableCell>
                                          <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{c.percentage}%</TableCell>
                                          <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{c.pointsClaimed}</TableCell>
                                        </TableRow>
                                      ))}
                                      {/* Summary / Average Row */}
                                      {(() => {
                                        const totalAppeared = appraisal.teaching.passPercentage.courses.reduce((sum, c) => sum + (Number(c.appeared) || 0), 0);
                                        const totalPassed = appraisal.teaching.passPercentage.courses.reduce((sum, c) => sum + (Number(c.passed) || 0), 0);
                                        const overallPassPct = totalAppeared > 0 ? ((totalPassed / totalAppeared) * 100).toFixed(2) : "0.00";
                                        return (
                                          <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)", "&:hover": { bgcolor: "rgba(0, 78, 146, 0.06) !important" } }}>
                                            <TableCell colSpan={2} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                              <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                                Overall Performance
                                              </Box>
                                            </TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{totalAppeared}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{totalPassed}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>{overallPassPct}%</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                                              {appraisal.teaching.passPercentage.averagePoints}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })()}
                                    </>
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: "var(--text-secondary)", fontStyle: "italic" }}>
                                        No subjects result found.
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}

                        {/* 1.2 Course Feedback */}
                        {!(appraisal.status === "Completed" && (!appraisal.teaching.feedback?.courses || appraisal.teaching.feedback.courses.length === 0)) && (
                          <>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "var(--color-primary)" }}>
                              1.2 Course Feedback
                            </Typography>
                            <TableContainer component={Paper} elevation={0} sx={{ mb: 3.5, borderRadius: "16px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", boxShadow: "none", width: "100%" }}>
                              <Table size="small" sx={{ minWidth: 650, mx: "auto" }}>
                                <TableHead sx={{ background: "var(--gradient-primary)" }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Course Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Sem-Branch-Sec</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Total Students</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Given Students</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Feedback %</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Points claimed</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {appraisal.teaching.feedback.courses.length > 0 ? (
                                    <>
                                      {appraisal.teaching.feedback.courses.map((c, i) => (
                                        <TableRow key={i} sx={{ "&:hover": { bgcolor: "var(--bg-hover)" } }}>
                                          <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.courseName}</TableCell>
                                          <TableCell sx={{ color: "var(--text-primary)" }}>{c.secBranchSem}</TableCell>
                                          <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{c.totalStudents || c.noOfStudents}</TableCell>
                                          <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{c.givenStudents || ''}</TableCell>
                                          <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{c.feedbackPercentage}%</TableCell>
                                          <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{c.pointsClaimed}</TableCell>
                                        </TableRow>
                                      ))}
                                      {/* Summary / Average Row */}
                                      {(() => {
                                        const totalSt = appraisal.teaching.feedback.courses.reduce((sum, c) => sum + (Number(c.totalStudents || c.noOfStudents) || 0), 0);
                                        const givenSt = appraisal.teaching.feedback.courses.reduce((sum, c) => sum + (Number(c.givenStudents) || 0), 0);
                                        const avgFb = appraisal.teaching.feedback.courses.length > 0
                                          ? (appraisal.teaching.feedback.courses.reduce((sum, c) => sum + (Number(c.feedbackPercentage) || 0), 0) / appraisal.teaching.feedback.courses.length).toFixed(2)
                                          : "0.00";
                                        return (
                                          <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)", "&:hover": { bgcolor: "rgba(0, 78, 146, 0.06) !important" } }}>
                                            <TableCell colSpan={2} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                              <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                                Overall Performance
                                              </Box>
                                            </TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{totalSt}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{givenSt}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>{avgFb}%</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)", fontSize: "0.95rem" }}>{appraisal.teaching.feedback.averagePoints} Points</TableCell>
                                          </TableRow>
                                        );
                                      })()}
                                    </>
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: "var(--text-secondary)", fontStyle: "italic" }}>
                                        No course feedbacks found.
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}

                        {/* 1.3 Proctoring Students' Average Pass Percentage */}
                        {!(appraisal.status === "Completed" && (!appraisal.teaching.proctoring?.entries || appraisal.teaching.proctoring.entries.length === 0)) && (
                          <Box sx={{ mb: 4 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>
                                1.3 Proctoring Students' Average Pass Percentage
                              </Typography>
                            </Box>

                            {/* <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>
                                  Proctoring Records for this cycle:
                                </Typography>
                              </Box>
                            </Box> */}

                            <TableContainer component={Paper} elevation={0} sx={{ mb: 3.5, borderRadius: "16px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", boxShadow: "none", width: "100%" }}>
                              <Table size="small" sx={{ minWidth: 650, mx: "auto" }}>
                                <TableHead sx={{ background: "var(--gradient-primary)" }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Program</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Sem/Yr - Branch - Sec</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="right">Total Allotted</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="right">Eligible (A)</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="right">Passed (B)</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="right">Pass % (B/A)</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="right">Points</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {appraisal.teaching.proctoring.entries.length > 0 ? (
                                    <>
                                      {appraisal.teaching.proctoring.entries.map((e, i) => {
                                        const isYearProg = e.yearNumber !== null && e.yearNumber !== undefined && e.yearNumber !== 0;
                                        const semYrBranchSec = isYearProg
                                          ? `YEAR-${e.yearNumber} ${e.branchCode || "—"} - SEC ${e.section}`
                                          : `SEM-${e.semesterNumber} ${e.branchCode || "—"} - SEC ${e.section}`;
                                        return (
                                          <TableRow key={i} sx={{
                                            "&:hover": { bgcolor: "var(--bg-hover)" }
                                          }}>
                                            <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{e.programCode || "—"}</TableCell>
                                            <TableCell sx={{ color: "var(--text-primary)" }}>{semYrBranchSec}</TableCell>
                                            <TableCell align="right" sx={{ color: "var(--text-primary)" }}>{e.totalStudents}</TableCell>
                                            <TableCell align="right" sx={{ color: "#8B5CF6", fontWeight: 600 }}>{e.appeared}</TableCell>
                                            <TableCell align="right" sx={{ color: "#10B981", fontWeight: 600 }}>{e.passed}</TableCell>
                                            <TableCell align="right" sx={{ color: "var(--text-primary)" }}>{e.percentage.toFixed(2)}%</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{e.pointsClaimed}</TableCell>
                                          </TableRow>
                                        );
                                      })}
                                      {/* Summary / Average Row */}
                                      {(() => {
                                        const totalAppeared = appraisal.teaching.proctoring.entries.reduce((sum, e) => sum + (Number(e.appeared) || 0), 0);
                                        const totalPassed = appraisal.teaching.proctoring.entries.reduce((sum, e) => sum + (Number(e.passed) || 0), 0);
                                        const overallPassPct = totalAppeared > 0 ? ((totalPassed / totalAppeared) * 100).toFixed(2) : "0.00";
                                        return (
                                          <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)", "&:hover": { bgcolor: "rgba(0, 78, 146, 0.06) !important" } }}>
                                            <TableCell colSpan={2} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                              <Box component="span" sx={{ display: "inline-block", whiteSpace: "nowrap" }}>
                                                Overall Performance (Average Points)
                                              </Box>
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{appraisal.teaching.proctoring.entries.reduce((sum, e) => sum + (Number(e.totalStudents) || 0), 0)}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{totalAppeared}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{totalPassed}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>{overallPassPct}%</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 900, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                                              {appraisal.teaching.proctoring.averagePoints} Points
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })()}
                                    </>
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: "var(--text-secondary)", fontStyle: "italic" }}>
                                        No proctoring records found.
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        )}

                        {/* Self Appraisal Proctoring Form CRUD Dialog Modal */}
                        <Dialog
                          open={isProctorModalOpen}
                          onClose={() => setIsProctorModalOpen(false)}
                          maxWidth="sm"
                          fullWidth
                          slotProps={{
                            paper: {
                              sx: {
                                borderRadius: "20px",
                                bgcolor: "var(--bg-panel)",
                                border: "1px solid var(--border-color)",
                                backgroundImage: "none",
                                p: 1
                              }
                            }
                          }}
                        >
                          <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)", pb: 1 }}>
                            {editingEntry ? "Edit Proctoring Record" : "Add Proctoring Record"}
                          </DialogTitle>
                          <form onSubmit={handleProctorModalSubmit}>
                            <DialogContent>
                              <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                                {/* Program selection */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                  <FormControl fullWidth size="small">
                                    <InputLabel shrink sx={{ color: "var(--text-secondary)" }}>Program</InputLabel>
                                    <Select
                                      value={selectedProgramId}
                                      label="Program"
                                      onChange={(e) => setSelectedProgramId(e.target.value)}
                                      displayEmpty
                                      fullWidth
                                      sx={{ borderRadius: "10px", color: "var(--text-primary)", bgcolor: "rgba(255,255,255,0.01)" }}
                                    >
                                      <MenuItem value="" disabled sx={{ fontStyle: "italic", color: "var(--text-secondary)" }}>
                                        Select Program
                                      </MenuItem>
                                      {programs.map((p) => (
                                        <MenuItem key={p._id} value={p._id}>
                                          {p.name} ({p.code})
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Grid>

                                {/* Branch selection */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                  <FormControl fullWidth size="small" disabled={!selectedProgramId}>
                                    <InputLabel shrink sx={{ color: "var(--text-secondary)" }}>Branch Code</InputLabel>
                                    <Select
                                      value={selectedBranchId}
                                      label="Branch Code"
                                      onChange={(e) => setSelectedBranchId(e.target.value)}
                                      displayEmpty
                                      fullWidth
                                      sx={{ borderRadius: "10px", color: "var(--text-primary)", bgcolor: "rgba(255,255,255,0.01)" }}
                                    >
                                      <MenuItem value="" disabled sx={{ fontStyle: "italic", color: "var(--text-secondary)" }}>
                                        Select Branch
                                      </MenuItem>
                                      {branches.map((b) => (
                                        <MenuItem key={b._id} value={b._id}>
                                          {b.name} ({b.code})
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Grid>

                                {/* Sem/Year numeric input based on Program Pattern */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                  {(() => {
                                    const program = programs.find((p) => p._id === selectedProgramId);
                                    const isYearPattern = program?.programPattern === "YEAR";
                                    if (isYearPattern) {
                                      return (
                                        <TextField
                                          label="Year Number"
                                          type="number"
                                          fullWidth
                                          size="small"
                                          required
                                          value={yearNumber}
                                          onChange={(e) => setYearNumber(e.target.value)}
                                          slotProps={{ htmlInput: { min: 1, step: 1 } }}
                                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                        />
                                      );
                                    } else {
                                      return (
                                        <TextField
                                          label="Semester Number"
                                          type="number"
                                          fullWidth
                                          size="small"
                                          required
                                          value={semesterNumber}
                                          onChange={(e) => setSemesterNumber(e.target.value)}
                                          slotProps={{ htmlInput: { min: 1, step: 1 } }}
                                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                        />
                                      );
                                    }
                                  })()}
                                </Grid>

                                {/* Section - numeric only */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                  <TextField
                                    label="Section (Numeric Only)"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    required
                                    value={section}
                                    onChange={(e) => setSection(e.target.value)}
                                    slotProps={{ htmlInput: { min: 1, step: 1 } }}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                  />
                                </Grid>

                                {/* Student counts inputs */}
                                <Grid size={{ xs: 12, sm: 4 }}>
                                  <TextField
                                    label="Total Allotted"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    required
                                    value={totalStudents}
                                    onChange={(e) => setTotalStudents(e.target.value)}
                                    slotProps={{ htmlInput: { min: 0, step: 1 } }}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                  />
                                </Grid>

                                <Grid size={{ xs: 12, sm: 4 }}>
                                  <TextField
                                    label="Eligible for End Exams (A)"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    required
                                    value={eligibleStudents}
                                    onChange={(e) => setEligibleStudents(e.target.value)}
                                    slotProps={{ htmlInput: { min: 0, step: 1 } }}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                  />
                                </Grid>

                                <Grid size={{ xs: 12, sm: 4 }}>
                                  <TextField
                                    label="Passed Students (B)"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    required
                                    value={passedStudents}
                                    onChange={(e) => setPassedStudents(e.target.value)}
                                    slotProps={{ htmlInput: { min: 0, step: 1 } }}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                                  />
                                </Grid>

                                {/* Calculated Pass Percentage display */}
                                <Grid size={{ xs: 12 }}>
                                  <Box
                                    sx={{
                                      p: 2,
                                      borderRadius: "12px",
                                      bgcolor: "rgba(2, 132, 199, 0.05)",
                                      border: "1px solid rgba(2, 132, 199, 0.15)",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center"
                                    }}
                                  >
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>
                                      Calculated Pass Percentage:
                                    </Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                                      {(() => {
                                        const elg = parseInt(eligibleStudents);
                                        const pass = parseInt(passedStudents);
                                        if (isNaN(elg) || isNaN(pass) || elg <= 0 || pass < 0 || pass > elg) return "0.00%";
                                        return `${((pass / elg) * 100).toFixed(2)}%`;
                                      })()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                            </DialogContent>
                            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                              <Button
                                onClick={() => setIsProctorModalOpen(false)}
                                disabled={submittingProctoring}
                                sx={{ textTransform: "none", fontWeight: 700, color: "var(--text-secondary)" }}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                variant="contained"
                                disabled={submittingProctoring}
                                sx={{
                                  textTransform: "none",
                                  fontWeight: 700,

                                  px: 3,
                                  background: "var(--gradient-primary)",
                                  color: "#fff",
                                  boxShadow: "0 4px 15px rgba(0, 78, 146, 0.2)",
                                  "&:hover": {
                                    background: "var(--gradient-primary)",
                                    opacity: 0.95
                                  }
                                }}
                              >
                                {submittingProctoring ? <Loader size={16} sx={{ color: "#fff" }} /> : editingEntry ? "Save Changes" : "Add Record"}
                              </Button>
                            </DialogActions>
                          </form>
                        </Dialog>


                        {/* 1.4 CO Attainment */}
                        {!(appraisal.status === "Completed" && (!appraisal.teaching.coAttainment?.courses || appraisal.teaching.coAttainment.courses.length === 0)) && (
                          <>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "var(--color-primary)" }}>
                              1.4 CO Attainment
                            </Typography>
                            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "16px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", boxShadow: "none", width: "100%", mb: 4 }}>
                              <Table size="small" sx={{ minWidth: 650, mx: "auto" }}>
                                <TableHead sx={{ background: "var(--gradient-primary)" }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Course Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Sem-Branch-Sec</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Total COs</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">COs Attained</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Points claimed</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {appraisal.teaching.coAttainment.courses.length > 0 ? (
                                    <>
                                      {appraisal.teaching.coAttainment.courses.map((c, i) => (
                                        <TableRow key={i} sx={{ "&:hover": { bgcolor: "var(--bg-hover)" } }}>
                                          <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.courseName}</TableCell>
                                          <TableCell sx={{ color: "var(--text-primary)" }}>{c.secBranchSem}</TableCell>
                                          <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{c.noOfCos}</TableCell>
                                          <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{c.noOfCosAttained}</TableCell>
                                          <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{c.pointsClaimed}</TableCell>
                                        </TableRow>
                                      ))}
                                      {/* Summary / Average Row */}
                                      {(() => {
                                        const totalCos = appraisal.teaching.coAttainment.courses.reduce((sum, c) => sum + (Number(c.noOfCos) || 0), 0);
                                        const totalCosAttained = appraisal.teaching.coAttainment.courses.reduce((sum, c) => sum + (Number(c.noOfCosAttained) || 0), 0);
                                        return (
                                          <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)", "&:hover": { bgcolor: "rgba(0, 78, 146, 0.06) !important" } }}>
                                            <TableCell colSpan={2} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                              <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                                Overall Performance
                                              </Box>
                                            </TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{totalCos}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{totalCosAttained}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                                              {appraisal.teaching.coAttainment.averagePoints}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })()}
                                    </>
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: "var(--text-secondary)", fontStyle: "italic" }}>
                                        No CO attainment details found.
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {activeTab === 2 && (
                  <Box sx={{ animation: "fadeIn 0.3s ease" }}>
                    {/* 2. Research Contributions */}
                    <Card sx={{ borderRadius: "20px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", mb: 0, boxShadow: "none" }}>
                      <CardContent sx={{ p: 3.5 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
                              <Science sx={{ color: "#a855f7" }} /> 2. Research Contributions
                            </Typography>
                            <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, display: "block", ml: 5 }}>
                              Maximum Points: 80*
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, bgcolor: "rgba(168, 85, 247, 0.04)", p: "8px 16px", borderRadius: "12px", border: "1px solid rgba(168, 85, 247, 0.1)", width: { xs: "100%", sm: "auto" } }}>
                            <Box>
                              <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>
                                Total Points Earned
                              </Typography>
                              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 900, color: "#a855f7" }}>
                                  {eligibility.scores.R_sum}
                                </Typography>
                                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>
                                  / 80
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ position: "relative", display: "inline-flex" }}>
                              <Loader
                                variant="determinate"
                                value={100}
                                size={40}
                                thickness={4}
                                sx={{ color: "var(--border-color)", opacity: 0.15 }}
                              />
                              <Loader
                                variant="determinate"
                                value={Math.min(100, Math.round((eligibility.scores.R_sum / 80) * 100))}
                                size={40}
                                thickness={4}
                                sx={{
                                  color: "#a855f7",
                                  position: "absolute",
                                  left: 0
                                }}
                              />
                              <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: "absolute", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.7rem" }}>
                                  {Math.min(100, Math.round((eligibility.scores.R_sum / 80) * 100))}%
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        {/* 2.1 Papers Publication with Claims Coordination */}
                        {!(appraisal.status === "Completed" && (!appraisal.research.papers?.items || appraisal.research.papers.items.length === 0)) && (
                          <>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "var(--color-primary)" }}>
                              2.1 Paper Publication: (only for one Aditya author)
                            </Typography>
                            <TableContainer component={Paper} elevation={0} sx={{ mb: 4, borderRadius: "16px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", boxShadow: "none", width: "100%" }}>
                              <Table size="small" sx={{ minWidth: 800, mx: "auto" }}>
                                <TableHead sx={{ background: "var(--gradient-primary)" }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "80px", whiteSpace: "nowrap" }} align="center">S. No</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Article details in IEEE format</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Category of the Journal</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">JCR Impact Factor</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Points claimed</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {appraisal.research.papers.items.length > 0 ? (
                                    <>
                                      {appraisal.research.papers.items.map((p, i) => (
                                        <TableRow key={i} sx={{ "&:hover": { bgcolor: "var(--bg-hover)" } }}>
                                          <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{i + 1}</TableCell>
                                          <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.title}</TableCell>
                                          <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{p.scope}</TableCell>
                                          <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{p.impactFactor ?? 0}</TableCell>
                                          <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{p.pointsClaimed}</TableCell>
                                        </TableRow>
                                      ))}
                                      {/* Summary / Total Row */}
                                      <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)", "&:hover": { bgcolor: "rgba(0, 78, 146, 0.06) !important" } }}>
                                        <TableCell colSpan={4} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                          <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                            Self-Assessment Points
                                          </Box>
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                                          {appraisal.research.papers.items.reduce((sum, p) => sum + (Number(p.pointsClaimed) || 0), 0)}
                                        </TableCell>
                                      </TableRow>
                                    </>
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: "var(--text-secondary)", fontStyle: "italic" }}>
                                        No approved journals found.
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}

                        {/* PhD, Books, Patents */}
                        {/* 2.2 Guiding Ph. D Scholars */}
                        {appraisal.research.phdGuiding?.items?.length > 0 && (
                          <>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "var(--color-primary)" }}>
                              2.2 Guiding Ph. D Scholars: Pursuing- 2 Points, Awarded- 20 points
                            </Typography>
                            <TableContainer component={Paper} elevation={0} sx={{ mb: 4, borderRadius: "16px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", boxShadow: "none", width: "100%" }}>
                              <Table size="small" sx={{ minWidth: 800, mx: "auto" }}>
                                <TableHead sx={{ background: "var(--gradient-primary)" }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "80px", whiteSpace: "nowrap" }} align="center">S. No</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Name of the Research Scholar (FT/PT)</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>University</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Month & Year of Admission/Award</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Pursuing / Awarded</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Points claimed</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {appraisal.research.phdGuiding.items.map((p, i) => (
                                    <TableRow key={i} sx={{ "&:hover": { bgcolor: "var(--bg-hover)" } }}>
                                      <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{i + 1}</TableCell>
                                      <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                        {p.name} ({p.scholarType === 'Part-Time' ? 'PT' : 'FT'})
                                      </TableCell>
                                      <TableCell sx={{ color: "var(--text-primary)" }}>{p.university || "Aditya University"}</TableCell>
                                      <TableCell align="center" sx={{ color: "var(--text-primary)" }}>
                                        {p.admissionOrAwardDate ? new Date(p.admissionOrAwardDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "—"}
                                      </TableCell>
                                      <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{p.status}</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{p.pointsClaimed}</TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)", "&:hover": { bgcolor: "rgba(0, 78, 146, 0.06) !important" } }}>
                                    <TableCell colSpan={5} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                      <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                        Self-Assessment Points
                                      </Box>
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                                      {appraisal.research.phdGuiding.items.reduce((sum, p) => sum + (Number(p.pointsClaimed) || 0), 0)}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}

                        {/* 2.3 Books / Chapters */}
                        {appraisal.research.booksChapters?.items?.length > 0 && (
                          <>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "var(--color-primary)" }}>
                              2.3 Books / Chapters (Max 10 pts)
                            </Typography>
                            <TableContainer component={Paper} elevation={0} sx={{ mb: 4, borderRadius: "16px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", boxShadow: "none", width: "100%" }}>
                              <Table size="small" sx={{ minWidth: 800, mx: "auto" }}>
                                <TableHead sx={{ background: "var(--gradient-primary)" }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "80px", whiteSpace: "nowrap" }} align="center">S. No</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Details of Books/Chapter/conference Proceedings published along with ISBN/ISSN number</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Category (Book/chapter/Proceedings)</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Publisher</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Points claimed</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {appraisal.research.booksChapters.items.map((b, i) => (
                                    <TableRow key={i} sx={{ "&:hover": { bgcolor: "var(--bg-hover)" } }}>
                                      <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{i + 1}</TableCell>
                                      <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{b.title}</TableCell>
                                      <TableCell sx={{ color: "var(--text-primary)" }}>
                                        {b.itemType === 'Textbook' ? 'Book' : b.itemType === 'BookChapter' ? 'Book Chapter' : 'Conference Proceedings'}
                                      </TableCell>
                                      <TableCell sx={{ color: "var(--text-primary)" }}>{b.publisher || "—"}</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{b.pointsClaimed}</TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)", "&:hover": { bgcolor: "rgba(0, 78, 146, 0.06) !important" } }}>
                                    <TableCell colSpan={4} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                      <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                        Self-Assessment Points (Max:10)
                                      </Box>
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                                      {Math.min(10, appraisal.research.booksChapters.items.reduce((sum, b) => sum + (Number(b.pointsClaimed) || 0), 0))}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}

                        {/* 2.4 Patents */}
                        {appraisal.research.patents?.items?.length > 0 && (
                          <>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "var(--color-primary)" }}>
                              2.4 Patents
                            </Typography>
                            <TableContainer component={Paper} elevation={0} sx={{ mb: 4, borderRadius: "16px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", boxShadow: "none", width: "100%" }}>
                              <Table size="small" sx={{ minWidth: 800, mx: "auto" }}>
                                <TableHead sx={{ background: "var(--gradient-primary)" }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "80px", whiteSpace: "nowrap" }} align="center">S. No</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Patent Title along with Number and date</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Patent filed Country</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Published/Granted</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Points claimed</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {appraisal.research.patents.items.map((p, i) => {
                                    const dateObj = new Date(p.dateOfFiling);
                                    const dateString = !isNaN(dateObj) ? dateObj.toLocaleDateString("en-GB") : "N/A";
                                    return (
                                      <TableRow key={i} sx={{ "&:hover": { bgcolor: "var(--bg-hover)" } }}>
                                        <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{i + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.title} - {p.filingNo} - {dateString}</TableCell>
                                        <TableCell sx={{ color: "var(--text-primary)" }}>{p.country}</TableCell>
                                        <TableCell sx={{ color: "var(--text-primary)" }}>{p.status}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{p.pointsClaimed}</TableCell>
                                      </TableRow>
                                    );
                                  })}
                                  <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)", "&:hover": { bgcolor: "rgba(0, 78, 146, 0.06) !important" } }}>
                                    <TableCell colSpan={4} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                      <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                        Self-Assessment Points
                                      </Box>
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                                      {appraisal.research.patents.items.reduce((sum, p) => sum + (Number(p.pointsClaimed) || 0), 0)}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}

                        {/* 2.5 Novel Products / Technology */}
                        {appraisal.research.novelProducts?.items?.length > 0 && (
                          <>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "var(--color-primary)" }}>
                              2.5 Novel Products / Technology
                            </Typography>
                            <TableContainer component={Paper} elevation={0} sx={{ mb: 4, borderRadius: "16px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", boxShadow: "none", width: "100%" }}>
                              <Table size="small" sx={{ minWidth: 700, mx: "auto" }}>
                                <TableHead sx={{ background: "var(--gradient-primary)" }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "80px", whiteSpace: "nowrap" }} align="center">S. No</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Details of the Novel Product/Technology</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Name of the Implemented organization</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Points claimed</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {appraisal.research.novelProducts.items.map((p, i) => (
                                    <TableRow key={i} sx={{ "&:hover": { bgcolor: "var(--bg-hover)" } }}>
                                      <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{i + 1}</TableCell>
                                      <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.title} ({p.status})</TableCell>
                                      <TableCell sx={{ color: "var(--text-primary)" }}>{p.organizationName}</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{p.pointsClaimed}</TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)", "&:hover": { bgcolor: "rgba(0, 78, 146, 0.06) !important" } }}>
                                    <TableCell colSpan={3} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                      <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                        Self-Assessment Points
                                      </Box>
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                                      {appraisal.research.novelProducts.items.reduce((sum, p) => sum + (Number(p.pointsClaimed) || 0), 0)}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}

                        {/* 2.6 Funded Projects & Consultancies */}
                        {appraisal.research.projectsConsultancies?.items?.length > 0 && (
                          <>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "var(--color-primary)" }}>
                              2.6 Funded Projects & Consultancies
                            </Typography>
                            <TableContainer component={Paper} elevation={0} sx={{ mb: 4, borderRadius: "16px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", boxShadow: "none", width: "100%" }}>
                              <Table size="small" sx={{ minWidth: 800, mx: "auto" }}>
                                <TableHead sx={{ background: "var(--gradient-primary)" }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "80px", whiteSpace: "nowrap" }} align="center">S. No</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Details of the Research Project/Consultancy</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Funding Agency/Industry</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="right">Total worth (in lakhs)</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Points claimed</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {appraisal.research.projectsConsultancies.items.map((p, i) => (
                                    <TableRow key={i} sx={{ "&:hover": { bgcolor: "var(--bg-hover)" } }}>
                                      <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{i + 1}</TableCell>
                                      <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                        {p.title} ({p.projectType === 'FundedProject' ? 'Funded Project' : 'Consultancy'} - {p.status})
                                      </TableCell>
                                      <TableCell sx={{ color: "var(--text-primary)" }}>{p.agency || "N/A"}</TableCell>
                                      <TableCell align="right" sx={{ color: "var(--text-primary)" }}>{p.amountInLakhs || 0}</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{p.pointsClaimed}</TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)", "&:hover": { bgcolor: "rgba(0, 78, 146, 0.06) !important" } }}>
                                    <TableCell colSpan={4} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                      <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                        Self-Assessment Points
                                      </Box>
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                                      {appraisal.research.projectsConsultancies.items.reduce((sum, p) => sum + (Number(p.pointsClaimed) || 0), 0)}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}

                        {/* 2.7 — Scopus Citations */}
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, mt: 4, color: "var(--color-primary)" }}>
                          2.7 Scopus Citations
                        </Typography>
                        {appraisal.status !== "Completed" && (appraisal.research.scopusCitations === null || appraisal.research.scopusCitations === undefined) && (
                          <Alert severity="warning" sx={{ mb: 2, borderRadius: "10px", "& .MuiAlert-message": { width: "100%" } }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Scopus Citations and H-Index data not found. Please contact the Research Team to update your records.
                            </Typography>
                          </Alert>
                        )}

                        <TableContainer component={Paper} elevation={0} sx={{ mb: 4, borderRadius: "16px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", boxShadow: "none", width: "100%" }}>
                          <Table size="small" sx={{ minWidth: 800, mx: "auto" }}>
                            <TableHead sx={{ background: "var(--gradient-primary)" }}>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "80px", whiteSpace: "nowrap" }} align="center">S. No</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Metric Details</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Citations ({citationYear})</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Evaluated Points</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              <TableRow sx={{ "&:hover": { bgcolor: "var(--bg-hover)" } }}>
                                <TableCell align="center" sx={{ color: "var(--text-primary)" }}>1</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>Scopus Citations</TableCell>
                                <TableCell sx={{ color: "var(--text-primary)", fontWeight: 700 }}>{appraisal.research.scopusCitations != null ? appraisal.research.scopusCitations : "—"}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{appraisal.research.scopusCitationScore || 0}</TableCell>
                              </TableRow>

                              <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)", "&:hover": { bgcolor: "rgba(0, 78, 146, 0.06) !important" } }}>
                                <TableCell colSpan={3} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                  <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                    Total Evaluated Points
                                  </Box>
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                                  {appraisal.research.scopusCitationScore || 0}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>

                        {/* 2.8 — Scopus h-index */}
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, mt: 4, color: "var(--color-primary)" }}>
                          2.8 Scopus h-index
                        </Typography>


                        <TableContainer component={Paper} elevation={0} sx={{ mb: 4, borderRadius: "16px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", boxShadow: "none", width: "100%" }}>
                          <Table size="small" sx={{ minWidth: 800, mx: "auto" }}>
                            <TableHead sx={{ background: "var(--gradient-primary)" }}>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "80px", whiteSpace: "nowrap" }} align="center">S. No</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Metric Details</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>h-index in {previousHIndexYear}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>h-index in {currentHIndexYear}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Raise (Diff)</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }} align="center">Evaluated Points</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              <TableRow sx={{ "&:hover": { bgcolor: "var(--bg-hover)" } }}>
                                <TableCell align="center" sx={{ color: "var(--text-primary)" }}>1</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>Scopus h-index</TableCell>
                                <TableCell sx={{ color: "var(--text-primary)", fontWeight: 700 }}>
                                  {appraisal.research.hIndexPrevYear != null ? appraisal.research.hIndexPrevYear : "—"}
                                </TableCell>
                                <TableCell sx={{ color: "var(--text-primary)", fontWeight: 700 }}>
                                  {appraisal.research.hIndexCurrentYear != null ? appraisal.research.hIndexCurrentYear : "—"}
                                </TableCell>
                                <TableCell sx={{ color: "var(--text-primary)", fontWeight: 700 }}>
                                  {appraisal.research.hIndexPrevYear != null && appraisal.research.hIndexCurrentYear != null ? (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      {appraisal.research.hIndexCurrentYear - appraisal.research.hIndexPrevYear > 0 ? (
                                        <Typography component="span" variant="caption" sx={{ color: "#10b981", fontWeight: 800, bgcolor: "rgba(16,185,129,0.1)", px: 1, py: 0.2, borderRadius: "4px" }}>
                                          +{appraisal.research.hIndexCurrentYear - appraisal.research.hIndexPrevYear}
                                        </Typography>
                                      ) : (
                                        appraisal.research.hIndexCurrentYear - appraisal.research.hIndexPrevYear
                                      )}
                                    </Box>
                                  ) : "—"}
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{appraisal.research.scopusHIndexScore || 0}</TableCell>
                              </TableRow>

                              <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)", "&:hover": { bgcolor: "rgba(0, 78, 146, 0.06) !important" } }}>
                                <TableCell colSpan={5} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                  <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                    Total Evaluated Points
                                  </Box>
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                                  {appraisal.research.scopusHIndexScore || 0}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {activeTab === 3 && (
                  <Box sx={{ animation: "fadeIn 0.3s ease" }}>
                    {/* 3. Extension / Value Addition */}
                    <Card sx={{ borderRadius: "20px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", mb: 0, boxShadow: "none" }}>
                      <CardContent sx={{ p: 3.5 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
                              <CardMembership sx={{ color: "#10b981" }} /> 3. Extension / Value Addition
                            </Typography>
                            <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, display: "block", ml: 5 }}>
                              Maximum Points: 20
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, bgcolor: "rgba(16, 185, 129, 0.04)", p: "8px 16px", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.1)", width: { xs: "100%", sm: "auto" } }}>
                            <Box>
                              <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>
                                Total Points Earned
                              </Typography>
                              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 900, color: "#10b981" }}>
                                  {eligibility.scores.V}
                                </Typography>
                                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>
                                  / 20
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ position: "relative", display: "inline-flex" }}>
                              <Loader
                                variant="determinate"
                                value={100}
                                size={40}
                                thickness={4}
                                sx={{ color: "var(--border-color)", opacity: 0.15 }}
                              />
                              <Loader
                                variant="determinate"
                                value={Math.min(100, Math.round((eligibility.scores.V / 20) * 100))}
                                size={40}
                                thickness={4}
                                sx={{
                                  color: "#10b981",
                                  position: "absolute",
                                  left: 0
                                }}
                              />
                              <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: "absolute", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.7rem" }}>
                                  {Math.min(100, Math.round((eligibility.scores.V / 20) * 100))}%
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        {/* 3.1 Resource Utilization */}
                        {!(appraisal.status === "Completed" && (!resourceUtilizationDetails || resourceUtilizationDetails.length === 0)) && (
                          <>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>
                                3.1 Resource Utilization (Max 10 points)
                              </Typography>
                              {(appraisal.status === "Draft" || appraisal.status === "Rejected by HOD") && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<AddCircle />}
                                  onClick={handleResUtOpenAdd}
                                  sx={{ textTransform: "none", fontWeight: 700 }}
                                >
                                  Add Resource Utilization
                                </Button>
                              )}
                            </Box>

                            <TableContainer component={Paper} elevation={0} sx={{ mb: 4, borderRadius: "16px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", boxShadow: "none", width: "100%" }}>
                              <Table size="small" sx={{ minWidth: 800, mx: "auto" }}>
                                <TableHead sx={{ background: "var(--gradient-primary)" }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "80px", whiteSpace: "nowrap" }}>S. No</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Details of the Event along with dates</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "120px" }}>Duration</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "180px" }}>Role</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "130px" }} align="center">Points claimed</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "120px" }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "120px" }} align="center">Actions</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {resourceUtilizationDetails.length > 0 ? (
                                    <>
                                      {resourceUtilizationDetails.map((activity, i) => {
                                        const statusStyle = getStatusColor(activity.status);
                                        const isEditable = activity.status === 'Draft' || activity.status === 'Rejected';
                                        const startDate = activity.eventStartDate || activity.fromDate;
                                        const endDate = activity.eventEndDate || activity.toDate;
                                        const fromDateFormatted = startDate ? new Date(startDate).toLocaleDateString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";
                                        const toDateFormatted = endDate ? new Date(endDate).toLocaleDateString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";

                                        return (
                                          <TableRow key={activity._id || i} sx={{ "&:hover": { bgcolor: "var(--bg-hover)" } }}>
                                            <TableCell sx={{ color: "var(--text-primary)" }}>{i + 1}</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                              {activity.organizationName} {fromDateFormatted && toDateFormatted ? `(${fromDateFormatted} - ${toDateFormatted})` : ""}
                                              {activity.status === "Rejected" && activity.hodComment && (
                                                <Typography variant="caption" sx={{ color: "error.main", mt: 0.5, display: "block", fontWeight: 700 }}>
                                                  Rejection Reason: {activity.hodComment}
                                                </Typography>
                                              )}
                                            </TableCell>
                                            <TableCell sx={{ color: "var(--text-primary)" }}>
                                              {(() => {
                                                const role = (activity.activityType || '').toLowerCase();
                                                if (role.includes('resource person') || role.includes('resourceperson')) {
                                                  const num = activity.numberOfSessions || activity.sessionsConducted || 0;
                                                  return `${num} session${num === 1 ? '' : 's'}`;
                                                } else if (role.includes('participant') || role.includes('participated')) {
                                                  const num = activity.numberOfDaysParticipated || activity.daysParticipated || activity.duration || 0;
                                                  return `${num} day${num === 1 ? '' : 's'}`;
                                                } else {
                                                  const num = activity.numberOfDaysOrganized || activity.duration || 0;
                                                  return `${num} day${num === 1 ? '' : 's'}`;
                                                }
                                              })()}
                                            </TableCell>
                                            <TableCell sx={{ color: "var(--text-primary)" }}>{activity.activityType}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                                              {(() => {
                                                const appraisalItem = appraisal?.valueAddition?.resourceUtilization?.items?.find(i => i.eventId?.toString() === activity._id?.toString());
                                                if (appraisalItem?.awardedPoints !== undefined && appraisalItem?.awardedPoints !== null) {
                                                  return (
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                      <span>{appraisalItem.awardedPoints}</span>
                                                      <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>
                                                        (Auto: {calculateResourceUtilizationPoints(activity, appraisalConfig)})
                                                      </Typography>
                                                    </Box>
                                                  );
                                                }
                                                return getResourceUtilizationPoints(activity);
                                              })()}
                                            </TableCell>
                                            <TableCell>
                                              <Chip
                                                label={activity.status}
                                                size="small"
                                                sx={{
                                                  bgcolor: statusStyle.bg,
                                                  color: statusStyle.color,
                                                  fontWeight: 800,
                                                  borderRadius: "6px"
                                                }}
                                              />
                                            </TableCell>
                                            <TableCell align="center">
                                              <Stack direction="row" spacing={1} sx={{ justifyContent: "center" }}>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => setSelectedResUtDetails(activity)}
                                                  sx={{ color: "var(--color-primary)" }}
                                                >
                                                  <Visibility fontSize="small" />
                                                </IconButton>
                                                {isEditable && (appraisal.status === "Draft" || appraisal.status === "Rejected by HOD") && (
                                                  <>
                                                    <IconButton
                                                      size="small"
                                                      color="info"
                                                      onClick={() => handleResUtOpenEdit(activity)}
                                                    >
                                                      <Edit fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                      size="small"
                                                      color="error"
                                                      onClick={() => handleResUtDelete(activity._id)}
                                                    >
                                                      <Delete fontSize="small" />
                                                    </IconButton>
                                                  </>
                                                )}
                                              </Stack>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                      {/* Footer row displaying dynamic sum */}
                                      <TableRow sx={{ background: "var(--bg-accent-1)" }}>
                                        <TableCell colSpan={4} sx={{ fontWeight: 800, pl: 2, color: "var(--text-primary)" }}>
                                          <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                            Self-Assessment Points (Max:10)
                                          </Box>
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                                          {Math.min(10, resourceUtilizationDetails.reduce((sum, r) => r.status !== 'Rejected' ? sum + getResourceUtilizationPoints(r) : sum, 0))}
                                        </TableCell>
                                        <TableCell colSpan={2}></TableCell>
                                      </TableRow>
                                    </>
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={7} align="center" sx={{ color: "var(--text-secondary)", py: 3, fontStyle: "italic" }}>
                                        No Resource Utilization records found for this academic year.
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}

                        {/* 3.2 Expertise / Contribution */}
                        {!(appraisal.status === "Completed" && (!appraisal.extension?.contributions || appraisal.extension.contributions.length === 0)) && (
                          <>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>
                                3.2 Expertise / Contribution (Max 10 points)
                              </Typography>
                              {(appraisal.status === "Draft" || appraisal.status === "Rejected by HOD") && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<AddCircle />}
                                  onClick={handleContOpenAdd}
                                  sx={{ textTransform: "none", fontWeight: 700 }}
                                >
                                  Add Contribution
                                </Button>
                              )}
                            </Box>

                            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "16px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", boxShadow: "none", width: "100%", mb: 4 }}>
                              <Table size="small" sx={{ minWidth: 800, mx: "auto" }}>
                                <TableHead sx={{ background: "var(--gradient-primary)" }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "80px", whiteSpace: "nowrap" }}>S. No</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Details of the Faculty Expertise/Recognition/Contribution</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "130px" }} align="center">Points claimed</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "120px" }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "120px" }} align="center">Actions</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {contributionDetails.length > 0 ? (
                                    <>
                                      {contributionDetails.map((item, i) => {
                                        const statusStyle = getStatusColor(item.status);
                                        const isEditable = item.status === 'Draft' || item.status === 'Rejected';
                                        return (
                                          <TableRow key={item._id || i} sx={{ "&:hover": { bgcolor: "var(--bg-hover)" } }}>
                                            <TableCell sx={{ color: "var(--text-primary)" }}>{i + 1}</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                              {getContributionDetailsString(item)}
                                              {item.status === "Rejected" && item.hodComment && (
                                                <Typography variant="caption" sx={{ color: "error.main", mt: 0.5, display: "block", fontWeight: 700 }}>
                                                  Rejection Reason: {item.hodComment}
                                                </Typography>
                                              )}
                                            </TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                                              {calculateContributionPoints(item, appraisalConfig)}
                                            </TableCell>
                                            <TableCell>
                                              <Chip
                                                label={item.status === "Pending at HOD" ? "Pending at HOD / Dean" : item.status}
                                                size="small"
                                                sx={{
                                                  bgcolor: statusStyle.bg,
                                                  color: statusStyle.color,
                                                  fontWeight: 800,
                                                  borderRadius: "6px"
                                                }}
                                              />
                                            </TableCell>
                                            <TableCell align="center">
                                              <Stack direction="row" spacing={1} sx={{ justifyContent: "center" }}>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => setSelectedContDetails(item)}
                                                  sx={{ color: "var(--color-primary)" }}
                                                >
                                                  <Visibility fontSize="small" />
                                                </IconButton>
                                                {isEditable && (appraisal.status === "Draft" || appraisal.status === "Rejected by HOD") && (
                                                  <>
                                                    <IconButton
                                                      size="small"
                                                      color="info"
                                                      onClick={() => handleContOpenEdit(item)}
                                                    >
                                                      <Edit fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                      size="small"
                                                      color="error"
                                                      onClick={() => handleContDelete(item._id)}
                                                    >
                                                      <Delete fontSize="small" />
                                                    </IconButton>
                                                  </>
                                                )}
                                              </Stack>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                      {/* Footer row displaying dynamic sum */}
                                      <TableRow sx={{ background: "var(--bg-accent-1)" }}>
                                        <TableCell colSpan={2} sx={{ fontWeight: 800, pl: 2, color: "var(--text-primary)" }}>
                                          <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                            Self-Assessment Points (Max:10)
                                          </Box>
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                                          {Math.min(10, contributionDetails.reduce((sum, r) => r.status !== 'Rejected' ? sum + calculateContributionPoints(r, appraisalConfig) : sum, 0))}
                                        </TableCell>
                                        <TableCell colSpan={2}></TableCell>
                                      </TableRow>
                                    </>
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={5} align="center" sx={{ color: "var(--text-secondary)", py: 3, fontStyle: "italic" }}>
                                        No Expertise / Contribution records found for this academic year.
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {activeTab === 4 && (
                  <Box sx={{ animation: "fadeIn 0.3s ease" }}>
                    {/* 4. Administrative Responsibilities */}
                    {!(appraisal.status === "Completed" && (!administrationDetail?.roles || administrationDetail.roles.length === 0)) ? (
                      <Card sx={{ borderRadius: "20px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", mb: 0, boxShadow: "none" }}>
                        <CardContent sx={{ p: 3.5 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
                                <AssignmentTurnedIn sx={{ color: "#f97316" }} /> 4. Administrative Responsibilities
                              </Typography>
                              <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, display: "block", ml: 5 }}>
                                Maximum Points: 20
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", width: { xs: "100%", sm: "auto" } }}>
                              {(appraisal.status === "Draft" || appraisal.status === "Rejected by HOD") && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<AddCircle />}
                                  onClick={openAdminModalAdd}
                                  sx={{ textTransform: "none", fontWeight: 700, whiteSpace: "nowrap" }}
                                >
                                  Add Responsibility
                                </Button>
                              )}
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, bgcolor: "rgba(249, 115, 22, 0.04)", p: "8px 16px", borderRadius: "12px", border: "1px solid rgba(249, 115, 22, 0.1)", width: { xs: "100%", sm: "auto" } }}>
                                <Box>
                                  <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>
                                    Total Points Earned
                                  </Typography>
                                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 900, color: "#f97316" }}>
                                      {eligibility.scores.A}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>
                                      / 20
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ position: "relative", display: "inline-flex" }}>
                                  <Loader
                                    variant="determinate"
                                    value={100}
                                    size={40}
                                    thickness={4}
                                    sx={{ color: "var(--border-color)", opacity: 0.15 }}
                                  />
                                  <Loader
                                    variant="determinate"
                                    value={Math.min(100, Math.round((eligibility.scores.A / 20) * 100))}
                                    size={40}
                                    thickness={4}
                                    sx={{
                                      color: "#f97316",
                                      position: "absolute",
                                      left: 0
                                    }}
                                  />
                                  <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: "absolute", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.7rem" }}>
                                      {Math.min(100, Math.round((eligibility.scores.A / 20) * 100))}%
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                          <Divider sx={{ mb: 3 }} />

                          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "16px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", boxShadow: "none", width: "100%", mb: 4 }}>
                            <Table size="small" sx={{ minWidth: 800, mx: "auto" }}>
                              <TableHead sx={{ background: "var(--gradient-primary)" }}>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "80px", whiteSpace: "nowrap" }}>S. No</TableCell>
                                  <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2 }}>Details of the Administrative Responsibility</TableCell>
                                  <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "150px" }}>Assigned by</TableCell>
                                  <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "130px" }} align="center">Points claimed</TableCell>
                                  <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "120px" }}>Status</TableCell>
                                  <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 2, width: "120px" }} align="center">Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {administrationDetail && administrationDetail.roles?.filter(r => r.isResponsible).length > 0 ? (
                                  <>
                                    {administrationDetail.roles.filter(r => r.isResponsible).map((role, i) => {
                                      let assignedByDisplay = "-";
                                      if (role.assignedBy) {
                                        if (typeof role.assignedBy === 'string') assignedByDisplay = role.assignedBy;
                                        else if (role.assignedBy.type) {
                                          assignedByDisplay = role.assignedBy.type === "Others"
                                            ? `Others (${role.assignedBy.otherText})`
                                            : role.assignedBy.type;
                                        }
                                      }
                                      const isEditable = role.status === 'Pending' || role.status === 'Rejected';
                                      return (
                                        <TableRow key={i} sx={{ "&:hover": { bgcolor: "var(--bg-hover)" } }}>
                                          <TableCell sx={{ color: "var(--text-primary)" }}>{i + 1}</TableCell>
                                          <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                            {(() => {
                                              const catalogEntry = ADMIN_ROLE_CATALOG.find(c => c.roleId === role.roleId);
                                              return (catalogEntry && !['other', 'other_coord', 'training_coord'].includes(role.roleId))
                                                ? catalogEntry.label
                                                : (role.roleLabel || role.roleName);
                                            })()} {!['dean', 'assoc_dean', 'coe', 'hod', 'dy_coe', 'univ_office_coord', 'dy_hod', 'dept_exam_cell'].includes(role.roleId) && role.level ? `(${role.level})` : ""} {role.details ? `[${role.details}]` : ""}
                                            {role.status === "Rejected" && role.remarks && (
                                              <Typography variant="caption" sx={{ color: "error.main", mt: 0.5, display: "block", fontWeight: 700 }}>
                                                Rejection Reason: {role.remarks}
                                              </Typography>
                                            )}
                                          </TableCell>
                                          <TableCell sx={{ color: "var(--text-primary)" }}>{assignedByDisplay}</TableCell>
                                          <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                                            {calculateAdministrativePoints(role, appraisalConfig)}
                                          </TableCell>
                                          <TableCell>
                                            <Chip
                                              label={role.status || "Pending"}
                                              size="small"
                                              sx={{
                                                bgcolor: getStatusColor(role.status || "Pending").bg,
                                                color: getStatusColor(role.status || "Pending").color,
                                                fontWeight: 800,
                                                borderRadius: "6px"
                                              }}
                                            />
                                          </TableCell>
                                          <TableCell align="center">
                                            <Stack direction="row" spacing={1} sx={{ justifyContent: "center" }}>
                                              {isEditable && (appraisal.status === "Draft" || appraisal.status === "Rejected by HOD") && (
                                                <>
                                                  <IconButton size="small" color="info" onClick={() => openAdminModalEdit(role)}>
                                                    <Edit fontSize="small" />
                                                  </IconButton>
                                                  <IconButton size="small" color="error" onClick={() => handleAdminDelete(role.roleId || role.roleName)}>
                                                    <Delete fontSize="small" />
                                                  </IconButton>
                                                </>
                                              )}
                                            </Stack>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                    <TableRow sx={{ background: "var(--bg-accent-1)" }}>
                                      <TableCell colSpan={3} sx={{ fontWeight: 800, pl: 2, color: "var(--text-primary)" }}>
                                        <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                          Self-Assessment points (Max:20)
                                        </Box>
                                      </TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                                        {Math.min(20, administrationDetail.roles.filter(r => r.isResponsible).reduce((sum, r) => r.status !== 'Rejected' ? sum + calculateAdministrativePoints(r, appraisalConfig) : sum, 0))}
                                      </TableCell>
                                      <TableCell colSpan={2}></TableCell>
                                    </TableRow>
                                  </>
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ color: "var(--text-secondary)", py: 3, fontStyle: "italic" }}>
                                      No administrative responsibilities claimed yet.
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card sx={{ borderRadius: "20px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", mb: 0, boxShadow: "none" }}>
                        <CardContent sx={{ p: 3.5, textAlign: "center" }}>
                          <Typography variant="body1" color="var(--text-secondary)" sx={{ fontStyle: "italic" }}>
                            No administrative responsibilities to display.
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                  </Box>
                )}
              </Box>
            </Card>
          </Grid>

          {/* Right Side Panel Removed - Scorecard is now rendered at the bottom */}
        </Grid>

        {/* Eligibility Checklist Section */}
        <Box sx={{ mt: 5, mb: 5, width: "100%" }}>
          <Card
            sx={{
              p: 4,
              borderRadius: "24px",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-premium)",
              background: "var(--bg-glass)",
              backdropFilter: "blur(20px)",
              width: "100%",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
              <CardMembership sx={{ color: "var(--color-primary)", fontSize: 28 }} /> Eligibility Checklist
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 3,
                mb: 4
              }}
            >
              {Object.entries(eligibility.checklist).map(([key, item]) => {
                let icon = item.passed ? <ThumbUp sx={{ fontSize: 24 }} /> : <HourglassEmpty sx={{ fontSize: 24 }} />;
                let color = "#3b82f6";
                let iconBg = "rgba(59, 130, 246, 0.08)";
                let cardBorder = "rgba(59, 130, 246, 0.2)";

                return (
                  <Box
                    key={key}
                    sx={{
                      p: 2.5,
                      borderRadius: "16px",
                      bgcolor: "var(--bg-paper)",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: cardBorder,
                        boxShadow: "var(--shadow-premium)",
                        transform: "translateY(-2px)"
                      }
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        bgcolor: iconBg,
                        color: color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      {icon}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.3 }}>
                        {item.label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "var(--text-secondary)", mt: 0.75, display: "block", lineHeight: 1.4 }}>
                        {item.desc}
                      </Typography>

                    </Box>
                  </Box>
                );
              })}
            </Box>


          </Card>
        </Box>

        <Box sx={{ mb: 5, width: "100%" }}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: "16px",
              border: "1px solid var(--border-color)",
              boxShadow: "none",
              background: "var(--bg-paper)",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              width: "100%"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  bgcolor: "rgba(59, 130, 246, 0.08)",
                  color: "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <Flag sx={{ fontSize: 24 }} />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.3 }}>
                  Total (1-4) Score (Min {eligibility.thresholds.total1to4})
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", mt: 0.75, display: "block", lineHeight: 1.4 }}>
                  Current: {eligibility.scores.total1to4} / 200
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 1, borderColor: "var(--border-color)" }} />
            
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr 1fr" }, gap: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 600, display: "block", mb: 0.5 }}>1. Teaching</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{eligibility.scores.T} / 80</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 600, display: "block", mb: 0.5 }}>2. Research</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{eligibility.scores.R_sum}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 600, display: "block", mb: 0.5 }}>3. Value Addition</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{eligibility.scores.V} / 20</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 600, display: "block", mb: 0.5 }}>4. Administration</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{eligibility.scores.A} / 20</Typography>
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Co-author claims modal */}
        <Modal open={claimModalOpen} onClose={() => setClaimModalOpen(false)}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 480,
              background: "var(--bg-panel)",
              border: "1px solid var(--border-color)",
              boxShadow: 24,
              p: 4,
              borderRadius: "16px"
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: "var(--text-primary)" }}>
              Claim Co-Authored Research
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="body2" color="var(--text-secondary)" sx={{ mb: 3 }}>
              Only one author from Aditya University can claim this paper. If you are <strong>not</strong> the first author, you must upload a signed <strong>Undertaking Form</strong> from other authors.
            </Typography>

            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
              sx={{ py: 1.5, borderStyle: "dashed", mb: 3, textTransform: "none", fontWeight: 700 }}
            >
              Upload Undertaking (PDF/Image)
              <input
                type="file"
                hidden
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setUndertakingFile(e.target.files[0])}
              />
            </Button>

            {undertakingFile && (
              <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3, borderRadius: "10px" }}>
                File selected: {undertakingFile.name}
              </Alert>
            )}

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button onClick={() => setClaimModalOpen(false)} sx={{ fontWeight: 700 }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="warning"
                onClick={handleClaimSubmit}
                disabled={loading}
                sx={{ fontWeight: 700, color: "#fff" }}
              >
                Submit Claim
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* 3.1 Resource Utilization Form Dialog */}
        <Dialog
          open={resUtOpen}
          onClose={() => setResUtOpen(false)}
          maxWidth="md"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                borderRadius: "20px",
                background: "var(--bg-panel)",
                border: "1px solid var(--border-color)"
              }
            }
          }}
        >
          <DialogTitle sx={{ borderBottom: "1px solid var(--border-color)", pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
              {resUtEditingId ? "Edit Resource Utilization Entry" : "Add Resource Utilization Entry"}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3, pt: 4 }}>
            <SubLabel text="Details of the Activity:" />
            <Grid2>
              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <Typography sx={labelStyle}>Academic Year:</Typography>
                {/* Show the selected year as read-only disabled field since it is already selected in appraisal */}
                {(() => {
                  const yearObj = academicYears.find(y => y._id === selectedYear);
                  return (
                    <TextField
                      size="small"
                      fullWidth
                      disabled
                      value={yearObj ? yearObj.year : "N/A"}
                      sx={{
                        "& .MuiInputBase-root": { background: "rgba(0,0,0,0.02)" },
                        "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "var(--text-secondary)", fontWeight: 600 }
                      }}
                    />
                  );
                })()}
              </Box>

              <Box>
                <Typography sx={labelStyle}>Activity Category: *</Typography>
                <Select
                  size="small"
                  fullWidth
                  displayEmpty
                  value={resUtForm.activityCategory}
                  onChange={handleResUtCategoryChange}
                >
                  <MenuItem value="" disabled>--Select Category--</MenuItem>
                  {RESOURCE_UTILIZATION_CATEGORIES.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </Box>

              <Box>
                <Typography sx={labelStyle}>Activity Role / Type: *</Typography>
                <Select
                  size="small"
                  fullWidth
                  displayEmpty
                  value={resUtForm.activityType}
                  onChange={handleResUtRoleChange}
                  disabled={!resUtForm.activityCategory}
                >
                  <MenuItem value="" disabled>--Select Role--</MenuItem>
                  {resUtForm.activityCategory && ROLES_BY_CATEGORY[resUtForm.activityCategory]?.map(role => (
                    <MenuItem key={role} value={role}>{role}</MenuItem>
                  ))}
                </Select>
              </Box>

              {resUtForm.activityCategory === "FDP" && resUtForm.activityType === "FDP Participant" ? (
                <>
                  <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                    <Typography sx={labelStyle}>Course Name: *</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      value={resUtForm.courseFdpName}
                      onChange={(e) => setResUtForm(p => ({ ...p, courseFdpName: e.target.value }))}
                      placeholder="Enter Course Name"
                    />
                  </Box>

                  <Box>
                    <Typography sx={labelStyle}>Organizing Institution Category: *</Typography>
                    <Select
                      size="small"
                      fullWidth
                      displayEmpty
                      value={resUtForm.organizingInstitutionCategory}
                      onChange={(e) => setResUtForm(p => ({ ...p, organizingInstitutionCategory: e.target.value }))}
                    >
                      <MenuItem value="" disabled>--Select Category--</MenuItem>
                      {[
                        "UGC",
                        "AICTE",
                        "IIT",
                        "IIM",
                        "NIT",
                        "MHRD R&D Lab",
                        "NITTTR",
                        "NIPER",
                        "ICMR",
                        "Govt. University",
                        "NIRF Ranked Institute (Below 200)",
                        "NPTEL",
                        "Other / Host Institute"
                      ].map(opt => (
                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                      ))}
                    </Select>
                  </Box>

                  <Box>
                    <Typography sx={labelStyle}>Location (City, State): *</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      value={resUtForm.location}
                      onChange={(e) => setResUtForm(p => ({ ...p, location: e.target.value }))}
                      placeholder="e.g. Hyderabad, Telangana"
                    />
                  </Box>

                  {resUtForm.organizingInstitutionCategory === "MHRD R&D Lab" && (
                    <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                      <Typography sx={labelStyle}>Lab Name: *</Typography>
                      <TextField
                        size="small"
                        fullWidth
                        value={resUtForm.labName}
                        onChange={(e) => setResUtForm(p => ({ ...p, labName: e.target.value }))}
                        placeholder="Enter Lab Name"
                      />
                    </Box>
                  )}

                  {resUtForm.organizingInstitutionCategory === "Govt. University" && (
                    <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                      <Typography sx={labelStyle}>University Name: *</Typography>
                      <TextField
                        size="small"
                        fullWidth
                        value={resUtForm.universityName}
                        onChange={(e) => setResUtForm(p => ({ ...p, universityName: e.target.value }))}
                        placeholder="Enter University Name"
                      />
                    </Box>
                  )}

                  {resUtForm.organizingInstitutionCategory === "NIRF Ranked Institute (Below 200)" && (
                    <>
                      <Box>
                        <Typography sx={labelStyle}>Institute Name: *</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={resUtForm.instituteName}
                          onChange={(e) => setResUtForm(p => ({ ...p, instituteName: e.target.value }))}
                          placeholder="Enter Institute Name"
                        />
                      </Box>
                      <Box>
                        <Typography sx={labelStyle}>NIRF Rank: *</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          value={resUtForm.nirfRank}
                          onChange={(e) => setResUtForm(p => ({ ...p, nirfRank: e.target.value }))}
                          placeholder="e.g. 15"
                        />
                      </Box>
                    </>
                  )}

                  {resUtForm.organizingInstitutionCategory === "Other / Host Institute" && (
                    <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                      <Typography sx={labelStyle}>Institute Name: *</Typography>
                      <TextField
                        size="small"
                        fullWidth
                        value={resUtForm.instituteName}
                        onChange={(e) => setResUtForm(p => ({ ...p, instituteName: e.target.value }))}
                        placeholder="Enter Institute Name"
                      />
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                  <Typography sx={labelStyle}>Organization / Event Name: *</Typography>
                  <TextField
                    size="small"
                    fullWidth
                    value={resUtForm.organizationName}
                    onChange={(e) => setResUtForm(p => ({ ...p, organizationName: e.target.value }))}
                    placeholder="Enter Name of Event or Organization"
                  />
                </Box>
              )}

              <Box>
                <Typography sx={labelStyle}>Event Start Date: *</Typography>
                <TextField
                  size="small"
                  fullWidth
                  type="date"
                  value={resUtForm.eventStartDate}
                  onChange={(e) => setResUtForm(p => ({ ...p, eventStartDate: e.target.value }))}
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { max: new Date().toISOString().split("T")[0] }
                  }}
                />
              </Box>

              <Box>
                <Typography sx={labelStyle}>Event End Date: *</Typography>
                <TextField
                  size="small"
                  fullWidth
                  type="date"
                  value={resUtForm.eventEndDate}
                  onChange={(e) => setResUtForm(p => ({ ...p, eventEndDate: e.target.value }))}
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { max: new Date().toISOString().split("T")[0] }
                  }}
                />
              </Box>

              {showOrganizedDaysField && (
                <Box>
                  <Typography sx={labelStyle}>Number of Days Organized: *</Typography>
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    value={resUtForm.numberOfDaysOrganized}
                    onChange={(e) => setResUtForm(p => ({ ...p, numberOfDaysOrganized: e.target.value }))}
                    placeholder="e.g. 5"
                  />
                </Box>
              )}

              {showSessionsField && (
                <Box>
                  <Typography sx={labelStyle}>Number of Sessions Conducted: *</Typography>
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    value={resUtForm.numberOfSessions}
                    onChange={(e) => setResUtForm(p => ({ ...p, numberOfSessions: e.target.value }))}
                    placeholder="e.g. 3"
                  />
                </Box>
              )}

              {showDaysField && (
                <Box>
                  <Typography sx={labelStyle}>Number of Days Participated: *</Typography>
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    value={resUtForm.numberOfDaysParticipated}
                    onChange={(e) => setResUtForm(p => ({ ...p, numberOfDaysParticipated: e.target.value }))}
                    placeholder="e.g. 5"
                  />
                </Box>
              )}

              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <Typography sx={labelStyle}>Remarks / Comments:</Typography>
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  value={resUtForm.remarks}
                  onChange={(e) => setResUtForm(p => ({ ...p, remarks: e.target.value }))}
                  placeholder="Any additional information..."
                />
              </Box>

              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                {resUtEditingId && resUtForm.existingProof && !isResUtDocumentRemoved ? (
                  <Box sx={{ p: 2, border: "1px solid var(--border-color)", borderRadius: "12px", background: "var(--bg-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {resUtForm.existingProof.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                        <a href={resUtForm.existingProof.startsWith('http') ? resUtForm.existingProof : `${(import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")}${resUtForm.existingProof}`} target="_blank" rel="noreferrer">
                          <img
                            src={resUtForm.existingProof.startsWith('http') ? resUtForm.existingProof : `${(import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")}${resUtForm.existingProof}`}
                            alt="Proof Document"
                            style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                          />
                        </a>
                      ) : (
                        <Description sx={{ color: "var(--color-primary)", fontSize: 40 }} />
                      )}
                      <Box>
                        <Typography sx={{ fontWeight: 600, color: "var(--text-primary)" }}>Existing Document</Typography>
                        {!resUtForm.existingProof.match(/\.(jpeg|jpg|gif|png)$/i) && (
                          <Button size="small" href={resUtForm.existingProof.startsWith('http') ? resUtForm.existingProof : `${(import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")}${resUtForm.existingProof}`} target="_blank" sx={{ mt: 0.5, textTransform: "none", p: 0, minWidth: "auto" }}>View PDF</Button>
                        )}
                      </Box>
                    </Box>
                    <IconButton onClick={() => setIsResUtDocumentRemoved(true)} sx={{ color: "#ef4444" }}>
                      <Delete />
                    </IconButton>
                  </Box>
                ) : (
                  <FileField
                    label="Supporting Proof (PDF/Image, Max 200KB) *"
                    name="proof"
                    onChange={(e) => setResUtProof(e.target.files[0])}
                  />
                )}
              </Box>
            </Grid2>
            <NoteBox />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: "1px solid var(--border-color)" }}>
            <Button onClick={() => setResUtOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleResUtSaveDraft}
              disabled={resUtLoading}
              sx={{ fontWeight: 700, color: "#fff" }}
            >
              {resUtLoading ? "Saving..." : "Save Entry"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 3.1 Resource Utilization Details View Dialog */}
        {selectedResUtDetails && (() => {
          const data = selectedResUtDetails;
          const statusStyle = getStatusColor(data.status);
          const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
          const fileUrl = data.proof ? (data.proof.startsWith('http') ? data.proof : `${backendURL}${data.proof}`) : null;
          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(data.proof || "");

          return (
            <Dialog
              open={!!selectedResUtDetails}
              onClose={() => setSelectedResUtDetails(null)}
              maxWidth="md"
              fullWidth
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: "20px",
                    background: "var(--bg-panel)",
                    border: "1px solid var(--border-color)"
                  }
                }
              }}
            >
              <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-accent-4)", py: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Info sx={{ color: "var(--color-primary)" }} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Resource Utilization Details</Typography>
                </Box>
                <IconButton onClick={() => setSelectedResUtDetails(null)}><Close /></IconButton>
              </DialogTitle>
              <DialogContent sx={{ p: 3, mt: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 1 }}>
                  {data.activityCategory} - {data.activityType}
                </Typography>
                {data.activityCategory === "FDP" && data.activityType === "FDP Participant" ? (
                  <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 3, fontWeight: 600 }}>Course Name: {data.courseFdpName || data.organizationName}</Typography>
                ) : (
                  <Typography variant="body2" sx={{ color: "var(--text-secondary)", mb: 3, fontWeight: 600 }}>Organization / Event Name: {data.organizationName}</Typography>
                )}

                <Grid container spacing={2}>
                  {data.activityCategory === "FDP" && data.activityType === "FDP Participant" && (
                    <>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                          <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Organizing Category</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.organizingInstitutionCategory}</Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                          <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Location</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.location}</Typography>
                        </Box>
                      </Grid>
                      {data.organizingInstitutionCategory === "MHRD R&D Lab" && (
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                            <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Lab Name</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.labName}</Typography>
                          </Box>
                        </Grid>
                      )}
                      {data.organizingInstitutionCategory === "Govt. University" && (
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                            <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>University Name</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.universityName}</Typography>
                          </Box>
                        </Grid>
                      )}
                      {data.organizingInstitutionCategory === "NIRF Ranked Institute (Below 200)" && (
                        <>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                              <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Institute Name</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.instituteName}</Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                              <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>NIRF Rank</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.nirfRank}</Typography>
                            </Box>
                          </Grid>
                        </>
                      )}
                    </>
                  )}

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                      <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Dates</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>
                        {new Date(data.fromDate).toLocaleDateString("en-IN")} to {new Date(data.toDate).toLocaleDateString("en-IN")}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                      <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Duration</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.duration} Days</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                      <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Status</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={data.status === "Pending at HOD" ? "Pending at HOD / Dean" : data.status}
                          size="small"
                          sx={{
                            bgcolor: statusStyle.bg,
                            color: statusStyle.color,
                            fontWeight: 800,
                            borderRadius: "6px"
                          }}
                        />
                      </Box>
                    </Box>
                  </Grid>

                  {(data.numberOfSessions !== undefined || data.sessionsConducted !== undefined) && (
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                        <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Sessions Conducted</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.numberOfSessions || data.sessionsConducted}</Typography>
                      </Box>
                    </Grid>
                  )}

                  {(data.numberOfDaysParticipated !== undefined || data.daysParticipated !== undefined) && (
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                        <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Days Participated</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.numberOfDaysParticipated || data.daysParticipated}</Typography>
                      </Box>
                    </Grid>
                  )}

                  {data.remarks && (
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                        <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Remarks</Typography>
                        <Typography variant="body2" sx={{ color: "var(--text-primary)", mt: 0.5 }}>{data.remarks}</Typography>
                      </Box>
                    </Grid>
                  )}

                  {data.hodComment && (
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ p: 2, bgcolor: "rgba(239, 68, 68, 0.05)", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: "#ef4444", textTransform: "uppercase" }}>HOD Feedback</Typography>
                        <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5, color: "var(--text-primary)" }}>"{data.hodComment}"</Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>

                {fileUrl && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", display: "block", mb: 1 }}>Proof Document</Typography>
                    <Box sx={{
                      height: 250, display: "flex", alignItems: "center", justifyContent: "center",
                      border: "1px solid var(--border-color)", background: "var(--bg-paper)", borderRadius: "8px",
                      overflow: "hidden", cursor: "pointer", transition: "all 0.2s ease",
                      "&:hover": { borderColor: "var(--color-primary)", transform: "translateY(-2px)" }
                    }} onClick={() => window.open(fileUrl, '_blank')}>
                      {isImage ? (
                        <img src={fileUrl} alt="Proof" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        <Box sx={{ textAlign: "center" }}>
                          <Description sx={{ fontSize: 40, color: "var(--text-secondary)", mb: 0.5 }} />
                          <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, display: "block" }}>PDF Preview (Click to open)</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ p: 2.5, borderTop: "1px solid var(--border-color)" }}>
                <Button onClick={() => setSelectedResUtDetails(null)} sx={{ fontWeight: 700 }}>Close</Button>
              </DialogActions>
            </Dialog>
          );
        })()}

        {/* 3.2 Contribution Form Dialog */}
        <Dialog
          open={contOpen}
          onClose={() => setContOpen(false)}
          maxWidth="md"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                borderRadius: "20px",
                background: "var(--bg-panel)",
                border: "1px solid var(--border-color)"
              }
            }
          }}
        >
          <DialogTitle sx={{ borderBottom: "1px solid var(--border-color)", pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
              {contEditingId ? "Edit Contribution Entry" : "Add Contribution Entry"}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3, pt: 4 }}>
            <SubLabel text="Details of the Contribution:" />
            <Grid2>
              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <Typography sx={labelStyle}>Academic Year:</Typography>
                {/* Show the selected year as read-only disabled field since it is already selected in appraisal */}
                {(() => {
                  const yearObj = academicYears.find(y => y._id === selectedYear);
                  return (
                    <TextField
                      size="small"
                      fullWidth
                      disabled
                      value={yearObj ? yearObj.year : "N/A"}
                      sx={{
                        "& .MuiInputBase-root": { background: "rgba(0,0,0,0.02)" },
                        "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "var(--text-secondary)", fontWeight: 600 }
                      }}
                    />
                  );
                })()}
              </Box>

              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <Typography sx={labelStyle}>Contribution Category: *</Typography>
                <Select
                  size="small"
                  fullWidth
                  displayEmpty
                  value={contForm.category}
                  onChange={handleContCategoryChange}
                  disabled={!!contEditingId}
                >
                  <MenuItem value="" disabled>--Select Category--</MenuItem>
                  {contributionCategories.map(cat => (
                    <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </Box>

              {/* Render fields conditionally based on category selection */}
              {contForm.category && (() => {
                const cat = getCategoryCode(contForm.category);
                const isFutureAllowed = [1, 2, 3].includes(cat);
                const todayStr = new Date().toISOString().split("T")[0];

                const renderDateFields = () => (
                  <>
                    <Box>
                      <Typography sx={labelStyle}>From Date: *</Typography>
                      <TextField
                        size="small"
                        fullWidth
                        type="date"
                        value={contForm.fromDate}
                        onChange={(e) => setContForm(p => ({ ...p, fromDate: e.target.value }))}
                        slotProps={{
                          inputLabel: { shrink: true },
                          htmlInput: { max: todayStr }
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography sx={labelStyle}>To Date: *</Typography>
                      <TextField
                        size="small"
                        fullWidth
                        type="date"
                        value={contForm.toDate}
                        onChange={(e) => setContForm(p => ({ ...p, toDate: e.target.value }))}
                        slotProps={{
                          inputLabel: { shrink: true },
                          htmlInput: isFutureAllowed ? {} : { max: todayStr }
                        }}
                      />
                    </Box>
                  </>
                );

                switch (cat) {
                  case 1:
                    return (
                      <>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Member Type: *</Typography>
                          <Select size="small" fullWidth displayEmpty value={contForm.memberType || ""} onChange={(e) => setContForm(p => ({ ...p, memberType: e.target.value }))}>
                            <MenuItem value="" disabled>--Select Role--</MenuItem>
                            <MenuItem value="BOG">Board of Governance (BOG)</MenuItem>
                            <MenuItem value="GB">Governing Body (GB)</MenuItem>
                            <MenuItem value="AC">Academic Council (AC)</MenuItem>
                            <MenuItem value="BOS">Board of Studies (BOS)</MenuItem>
                          </Select>
                        </Box>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Organization Name: *</Typography>
                          <TextField size="small" fullWidth value={contForm.organizationName || ""} onChange={(e) => setContForm(p => ({ ...p, organizationName: e.target.value }))} />
                        </Box>
                        {renderDateFields()}
                      </>
                    );
                  case 2:
                    return (
                      <>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Journal Name: *</Typography>
                          <TextField size="small" fullWidth value={contForm.journalName || ""} onChange={(e) => setContForm(p => ({ ...p, journalName: e.target.value }))} />
                        </Box>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Journal Type: *</Typography>
                          <Select size="small" fullWidth displayEmpty value={contForm.journalType || ""} onChange={(e) => setContForm(p => ({ ...p, journalType: e.target.value }))}>
                            <MenuItem value="" disabled>--Select Type--</MenuItem>
                            <MenuItem value="SCIE">SCIE</MenuItem>
                            <MenuItem value="Q1">Q1</MenuItem>
                            <MenuItem value="Q2">Q2</MenuItem>
                          </Select>
                        </Box>
                        {renderDateFields()}
                      </>
                    );
                  case 3:
                    return (
                      <>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Journal / Conference Name: *</Typography>
                          <TextField size="small" fullWidth value={contForm.journalName || ""} onChange={(e) => setContForm(p => ({ ...p, journalName: e.target.value }))} />
                        </Box>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Journal Type: *</Typography>
                          <Select size="small" fullWidth displayEmpty value={contForm.journalType || ""} onChange={(e) => setContForm(p => ({ ...p, journalType: e.target.value }))}>
                            <MenuItem value="" disabled>--Select Type--</MenuItem>
                            <MenuItem value="ESCI">ESCI</MenuItem>
                            <MenuItem value="Q3">Q3</MenuItem>
                            <MenuItem value="Q4">Q4</MenuItem>
                            <MenuItem value="Conference proceedings">Conference proceedings</MenuItem>
                          </Select>
                        </Box>
                        {renderDateFields()}
                      </>
                    );
                  case 4:
                  case 5:
                    return (
                      <>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Awarding Agency: *</Typography>
                          {cat === 4 ? (
                            <Select size="small" fullWidth displayEmpty value={contForm.awardingAgency || ""} onChange={(e) => setContForm(p => ({ ...p, awardingAgency: e.target.value }))}>
                              <MenuItem value="" disabled>--Select Awarding Agency--</MenuItem>
                              <MenuItem value="MHRD">MHRD</MenuItem>
                              <MenuItem value="AICTE">AICTE</MenuItem>
                              <MenuItem value="UGC">UGC</MenuItem>
                              <MenuItem value="State Govt.">State Govt.</MenuItem>
                              <MenuItem value="Top 2%">Top 2%</MenuItem>
                            </Select>
                          ) : (
                            <TextField size="small" fullWidth value={contForm.awardingAgency || ""} onChange={(e) => setContForm(p => ({ ...p, awardingAgency: e.target.value }))} placeholder="NGO / Trust / Other name" />
                          )}
                        </Box>
                        <Box>
                          <Typography sx={labelStyle}>Award Name: *</Typography>
                          <TextField size="small" fullWidth value={contForm.awardName || ""} onChange={(e) => setContForm(p => ({ ...p, awardName: e.target.value }))} />
                        </Box>
                        <Box>
                          <Typography sx={labelStyle}>Award Date: *</Typography>
                          <TextField size="small" fullWidth type="date" value={contForm.awardDate || ""} onChange={(e) => setContForm(p => ({ ...p, awardDate: e.target.value }))} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayStr } }} />
                        </Box>
                      </>
                    );
                  case 6:
                    return (
                      <>
                        <Box>
                          <Typography sx={labelStyle}>Course Name: *</Typography>
                          <TextField size="small" fullWidth value={contForm.courseName} onChange={(e) => setContForm(p => ({ ...p, courseName: e.target.value }))} />
                        </Box>
                        <Box>
                          <Typography sx={labelStyle}>E-Content URL: *</Typography>
                          <TextField size="small" fullWidth value={contForm.url} onChange={(e) => setContForm(p => ({ ...p, url: e.target.value }))} placeholder="https://example.com/course" />
                        </Box>
                      </>
                    );
                  case 7:
                    return (
                      <>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Certification Name: *</Typography>
                          <TextField size="small" fullWidth value={contForm.certificationName} onChange={(e) => setContForm(p => ({ ...p, certificationName: e.target.value }))} />
                        </Box>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Duration (Hours): *</Typography>
                          <TextField type="number" size="small" fullWidth value={contForm.courseHours || ""} onChange={(e) => setContForm(p => ({ ...p, courseHours: e.target.value }))} placeholder="e.g. 40" />
                        </Box>
                        {renderDateFields()}
                      </>
                    );
                  case 8:
                    return (
                      <>
                        <Box>
                          <Typography sx={labelStyle}>Event Type: *</Typography>
                          <Select size="small" fullWidth displayEmpty value={contForm.eventType || ""} onChange={(e) => setContForm(p => ({ ...p, eventType: e.target.value }))}>
                            <MenuItem value="" disabled>--Select Event Type--</MenuItem>
                            <MenuItem value="Hackathon">Hackathon</MenuItem>
                            <MenuItem value="Startup">Startup</MenuItem>
                            <MenuItem value="Events">Events</MenuItem>
                          </Select>
                        </Box>
                        <Box>
                          <Typography sx={labelStyle}>Event Name: *</Typography>
                          <TextField size="small" fullWidth value={contForm.eventName || ""} onChange={(e) => setContForm(p => ({ ...p, eventName: e.target.value }))} />
                        </Box>
                        <Box>
                          <Typography sx={labelStyle}>Student Names: *</Typography>
                          <TextField size="small" fullWidth value={contForm.studentNames || ""} onChange={(e) => setContForm(p => ({ ...p, studentNames: e.target.value }))} placeholder="John, Jane, etc." />
                        </Box>
                        <Box>
                          <Typography sx={labelStyle}>Event Date: *</Typography>
                          <TextField size="small" fullWidth type="date" value={contForm.eventDate} onChange={(e) => setContForm(p => ({ ...p, eventDate: e.target.value }))} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayStr } }} />
                        </Box>
                      </>
                    );
                  case 9:
                    return (
                      <>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Article Title: *</Typography>
                          <TextField size="small" fullWidth value={contForm.articleTitle} onChange={(e) => setContForm(p => ({ ...p, articleTitle: e.target.value }))} />
                        </Box>
                        <Box>
                          <Typography sx={labelStyle}>Publication Name: *</Typography>
                          <TextField size="small" fullWidth value={contForm.publicationName} onChange={(e) => setContForm(p => ({ ...p, publicationName: e.target.value }))} />
                        </Box>
                        <Box>
                          <Typography sx={labelStyle}>Publication Date: *</Typography>
                          <TextField size="small" fullWidth type="date" value={contForm.publicationDate} onChange={(e) => setContForm(p => ({ ...p, publicationDate: e.target.value }))} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayStr } }} />
                        </Box>
                      </>
                    );
                  case 10:
                    return (
                      <>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Contribution Type: *</Typography>
                          <Select size="small" fullWidth displayEmpty value={contForm.contributionType || ""} onChange={(e) => setContForm(p => ({ ...p, contributionType: e.target.value }))}>
                            <MenuItem value="" disabled>--Select Type--</MenuItem>
                            <MenuItem value="Establishment">Establishment</MenuItem>
                            <MenuItem value="Maintenance">Maintenance</MenuItem>
                          </Select>
                        </Box>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Facility Name: *</Typography>
                          <TextField size="small" fullWidth value={contForm.facilityName} onChange={(e) => setContForm(p => ({ ...p, facilityName: e.target.value }))} />
                        </Box>
                        {contForm.contributionType === "Establishment" && (
                          <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                            <Typography sx={labelStyle}>Establishment Date: *</Typography>
                            <TextField size="small" fullWidth type="date" value={contForm.fromDate} onChange={(e) => setContForm(p => ({ ...p, fromDate: e.target.value }))} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayStr } }} />
                          </Box>
                        )}
                        {contForm.contributionType === "Maintenance" && renderDateFields()}
                      </>
                    );
                  case 11:
                    return (
                      <>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Course Name: *</Typography>
                          <TextField size="small" fullWidth value={contForm.courseName} onChange={(e) => setContForm(p => ({ ...p, courseName: e.target.value }))} />
                        </Box>
                        <Box>
                          <Typography sx={labelStyle}>Duration: *</Typography>
                          <Select
                            size="small"
                            fullWidth
                            value={contForm.duration}
                            onChange={(e) => setContForm(p => ({ ...p, duration: e.target.value }))}
                            displayEmpty
                          >
                            <MenuItem value="" disabled>--Select NPTEL Duration--</MenuItem>
                            <MenuItem value="12 Weeks">12 Weeks</MenuItem>
                            <MenuItem value="8 Weeks">8 Weeks</MenuItem>
                            <MenuItem value="4 Weeks">4 Weeks</MenuItem>
                          </Select>
                        </Box>
                        <Box>
                          <Typography sx={labelStyle}>Certificate Number (Optional):</Typography>
                          <TextField size="small" fullWidth value={contForm.certificateNumber || ""} onChange={(e) => setContForm(p => ({ ...p, certificateNumber: e.target.value }))} placeholder="Enter Certificate Number (if available)" />
                        </Box>
                        <Box sx={{ gridColumn: { sm: "1 / -1" }, mt: 2, p: 2, bgcolor: "rgba(232, 160, 0, 0.08)", border: "1px solid rgba(232, 160, 0, 0.3)", borderRadius: "8px" }}>
                          <Typography variant="body2" sx={{ color: "#e8a000", fontWeight: 700 }}>
                            Note: Certificate will be considered only in one metric, either 3.1 or 3.2.
                          </Typography>
                        </Box>
                      </>
                    );
                  case 12:
                    return (
                      <>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Course Name (Coursera): *</Typography>
                          <TextField size="small" fullWidth value={contForm.courseName} onChange={(e) => setContForm(p => ({ ...p, courseName: e.target.value }))} />
                        </Box>
                        <Box>
                          <Typography sx={labelStyle}>Course Duration (Hours): *</Typography>
                          <TextField type="number" size="small" fullWidth value={contForm.courseHours || ""} onChange={(e) => setContForm(p => ({ ...p, courseHours: e.target.value }))} placeholder="e.g. 40" />
                        </Box>
                        <Box>
                          <Typography sx={labelStyle}>Certificate Number (Optional):</Typography>
                          <TextField size="small" fullWidth value={contForm.certificateNumber || ""} onChange={(e) => setContForm(p => ({ ...p, certificateNumber: e.target.value }))} placeholder="Enter Certificate Number (if available)" />
                        </Box>
                        {renderDateFields()}
                      </>
                    );
                  case 13:
                    return (
                      <>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Grant Type: *</Typography>
                          <Select size="small" fullWidth displayEmpty value={contForm.grantType || ""} onChange={(e) => setContForm(p => ({ ...p, grantType: e.target.value }))}>
                            <MenuItem value="" disabled>--Select Type--</MenuItem>
                            <MenuItem value="FDP">FDP</MenuItem>
                            <MenuItem value="Seminar">Seminar</MenuItem>
                          </Select>
                        </Box>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Title of FDP / Seminar: *</Typography>
                          <TextField size="small" fullWidth value={contForm.grantTitle} onChange={(e) => setContForm(p => ({ ...p, grantTitle: e.target.value }))} />
                        </Box>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Funding Agency: *</Typography>
                          <TextField size="small" fullWidth value={contForm.fundingAgency} onChange={(e) => setContForm(p => ({ ...p, fundingAgency: e.target.value }))} />
                        </Box>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Grant Amount (₹): *</Typography>
                          <TextField size="small" fullWidth type="number" value={contForm.grantAmount} onChange={(e) => setContForm(p => ({ ...p, grantAmount: e.target.value }))} />
                        </Box>
                        <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <Typography sx={labelStyle}>Sanction Date: *</Typography>
                          <TextField size="small" fullWidth type="date" value={contForm.sanctionDate} onChange={(e) => setContForm(p => ({ ...p, sanctionDate: e.target.value }))} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayStr } }} />
                        </Box>
                      </>
                    );
                  default:
                    return null;
                }
              })()}

              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                {contEditingId && contForm.existingProof && !isContDocumentRemoved ? (
                  <Box sx={{ p: 2, border: "1px solid var(--border-color)", borderRadius: "12px", background: "var(--bg-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {contForm.existingProof.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                        <a href={contForm.existingProof.startsWith('http') ? contForm.existingProof : `${(import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")}${contForm.existingProof}`} target="_blank" rel="noreferrer">
                          <img
                            src={contForm.existingProof.startsWith('http') ? contForm.existingProof : `${(import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")}${contForm.existingProof}`}
                            alt="Proof Document"
                            style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                          />
                        </a>
                      ) : (
                        <Description sx={{ color: "var(--color-primary)", fontSize: 40 }} />
                      )}
                      <Box>
                        <Typography sx={{ fontWeight: 600, color: "var(--text-primary)" }}>Existing Document</Typography>
                        {!contForm.existingProof.match(/\.(jpeg|jpg|gif|png)$/i) && (
                          <Button size="small" href={contForm.existingProof.startsWith('http') ? contForm.existingProof : `${(import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")}${contForm.existingProof}`} target="_blank" sx={{ mt: 0.5, textTransform: "none", p: 0, minWidth: "auto" }}>View PDF</Button>
                        )}
                      </Box>
                    </Box>
                    <IconButton onClick={() => setIsContDocumentRemoved(true)} sx={{ color: "#ef4444" }}>
                      <Delete />
                    </IconButton>
                  </Box>
                ) : (
                  <FileField
                    label="Supporting Proof (PDF/Image, Max 200KB) *"
                    name="proof"
                    onChange={(e) => setContProof(e.target.files[0])}
                  />
                )}
              </Box>
            </Grid2>
            <NoteBox />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: "1px solid var(--border-color)" }}>
            <Button onClick={() => setContOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleContSaveDraft}
              disabled={contLoading}
              sx={{ fontWeight: 700, color: "#fff" }}
            >
              {contLoading ? "Saving..." : "Save Entry"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 3.2 Contribution Details View Dialog */}
        {selectedContDetails && (() => {
          const data = selectedContDetails;
          const submitDate = new Date(data.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric' });
          const statusStyle = getStatusColor(data.status);
          const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
          const fileUrl = data.proof ? (data.proof.startsWith('http') ? data.proof : `${backendURL}${data.proof}`) : null;
          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(data.proof || "");

          return (
            <Dialog
              open={!!selectedContDetails}
              onClose={() => setSelectedContDetails(null)}
              maxWidth="md"
              fullWidth
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: "20px",
                    background: "var(--bg-panel)",
                    border: "1px solid var(--border-color)"
                  }
                }
              }}
            >
              <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-accent-4)", py: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Info sx={{ color: "var(--color-primary)" }} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Contribution Details</Typography>
                </Box>
                <IconButton onClick={() => setSelectedContDetails(null)}><Close /></IconButton>
              </DialogTitle>
              <DialogContent sx={{ pt: 2, px: 3, pb: 3, mt: 2 }}>
                <Typography variant="subtitle2" color="var(--color-primary)" sx={{ fontWeight: 800, textTransform: "uppercase" }}>
                  {getCategoryName(data.category)}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 2, mt: 0.5 }}>
                  {getContributionDetailsString(data)}
                </Typography>

                <Grid container spacing={2}>
                  {data.fromDate && data.toDate && (
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                        <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Dates</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>
                          {new Date(data.fromDate).toLocaleDateString("en-IN")} to {new Date(data.toDate).toLocaleDateString("en-IN")}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  {data.duration && (
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                        <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Duration</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.duration}</Typography>
                      </Box>
                    </Grid>
                  )}

                  {data.awardDate && (
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                        <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Award Date</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>
                          {new Date(data.awardDate).toLocaleDateString("en-IN")}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {data.eventDate && (
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                        <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Event Date</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>
                          {new Date(data.eventDate).toLocaleDateString("en-IN")}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {data.publicationDate && (
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                        <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Publication Date</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>
                          {new Date(data.publicationDate).toLocaleDateString("en-IN")}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {data.url && (
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                        <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>URL / Reference Link</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                          <a href={data.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", textDecoration: "none" }}>{data.url}</a>
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                      <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Status</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={data.status === "Pending at HOD" ? "Pending at HOD / Dean" : data.status}
                          size="small"
                          sx={{
                            bgcolor: statusStyle.bg,
                            color: statusStyle.color,
                            fontWeight: 800,
                            borderRadius: "6px"
                          }}
                        />
                      </Box>
                    </Box>
                  </Grid>

                  {data.hodComment && (
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ p: 2, bgcolor: "rgba(239, 68, 68, 0.05)", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: "#ef4444", textTransform: "uppercase" }}>HOD Feedback</Typography>
                        <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5, color: "var(--text-primary)" }}>"{data.hodComment}"</Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>

                {fileUrl && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", display: "block", mb: 1 }}>Proof Document</Typography>
                    <Box sx={{
                      height: 250, display: "flex", alignItems: "center", justifyContent: "center",
                      border: "1px solid var(--border-color)", background: "var(--bg-paper)", borderRadius: "8px",
                      overflow: "hidden", cursor: "pointer", transition: "all 0.2s ease",
                      "&:hover": { borderColor: "var(--color-primary)", transform: "translateY(-2px)" }
                    }} onClick={() => window.open(fileUrl, '_blank')}>
                      {isImage ? (
                        <img src={fileUrl} alt="Proof" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        <Box sx={{ textAlign: "center" }}>
                          <Description sx={{ fontSize: 40, color: "var(--text-secondary)", mb: 0.5 }} />
                          <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, display: "block" }}>PDF Preview (Click to open)</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ p: 2.5, borderTop: "1px solid var(--border-color)" }}>
                <Button onClick={() => setSelectedContDetails(null)} sx={{ fontWeight: 700 }}>Close</Button>
              </DialogActions>
            </Dialog>
          );
        })()}

        {/* 4. Administrative Responsibilities Dialog */}
        <Dialog open={adminOpen} onClose={() => setAdminOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "20px", background: "var(--bg-panel)" } } }}>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-accent-4)", py: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <AssignmentTurnedIn sx={{ color: "var(--color-primary)" }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{adminEditingRole ? "Edit" : "Add"} Administrative Responsibility</Typography>
            </Box>
            <IconButton onClick={() => setAdminOpen(false)}><Close /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3, mt: 1 }}>
            <Grid2 sx={{ mb: 2 }}>
              <Box sx={{ gridColumn: "1 / -1", mb: 2 }}>
                <Typography sx={labelStyle}>Select Responsibility Category: *</Typography>
                <Select
                  size="small"
                  fullWidth
                  value={adminForm.primaryRoleType}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'COORDINATOR') {
                      setAdminForm(p => ({ ...p, primaryRoleType: val, roleId: "", roleLabel: "", level: "" }));
                    } else {
                      const sel = ADMIN_ROLE_CATALOG.find(r => r.roleId === val);
                      setAdminForm(p => ({
                        ...p,
                        primaryRoleType: val,
                        roleId: sel.roleId,
                        roleLabel: sel.roleId === 'other' ? '' : sel.label,
                        level: sel.allowedLevels.length === 1 ? sel.allowedLevels[0] : "",
                      }));
                    }
                  }}
                  disabled={!!adminEditingRole}
                >
                  {ADMIN_ROLE_CATALOG.filter(r => r.category === 'Direct').map(role => {
                    const isClaimed = administrationDetail?.roles?.find(r => r.roleId === role.roleId)?.isResponsible;
                    const isRejected = administrationDetail?.roles?.find(r => r.roleId === role.roleId)?.status === 'Rejected';
                    const isDisabled = !adminEditingRole && isClaimed && !isRejected;
                    return <MenuItem key={role.roleId} value={role.roleId} disabled={isDisabled}>{role.label}</MenuItem>;
                  })}

                  <MenuItem value="COORDINATOR" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>Coordinator</MenuItem>

                  {ADMIN_ROLE_CATALOG.filter(r => r.category === 'Other').map(role => {
                    return <MenuItem key={role.roleId} value={role.roleId}>{role.label}</MenuItem>;
                  })}
                </Select>
              </Box>

              {adminForm.primaryRoleType === 'COORDINATOR' && (
                <Box sx={{ gridColumn: "1 / -1", mb: 2 }}>
                  <Typography sx={labelStyle}>Select Coordinator Role: *</Typography>
                  <Select
                    size="small"
                    fullWidth
                    value={adminForm.roleId}
                    onChange={(e) => {
                      const sel = ADMIN_ROLE_CATALOG.find(r => r.roleId === e.target.value);
                      setAdminForm(p => ({
                        ...p,
                        roleId: sel.roleId,
                        roleLabel: sel.roleId === 'other_coord' ? '' : sel.label,
                        level: sel.allowedLevels.length === 1 ? sel.allowedLevels[0] : "",
                      }));
                    }}
                    disabled={!!adminEditingRole}
                  >
                    {ADMIN_ROLE_CATALOG.filter(r => r.category === 'Coordinator').map(role => {
                      const isClaimed = administrationDetail?.roles?.find(r => r.roleId === role.roleId)?.isResponsible;
                      const isRejected = administrationDetail?.roles?.find(r => r.roleId === role.roleId)?.status === 'Rejected';
                      const isDisabled = role.roleId !== 'other_coord' && !adminEditingRole && isClaimed && !isRejected;
                      return <MenuItem key={role.roleId} value={role.roleId} disabled={isDisabled}>{role.label}</MenuItem>;
                    })}
                  </Select>
                </Box>
              )}

              {(adminForm.roleId === "other" || adminForm.roleId === "other_coord") && (
                <Box sx={{ gridColumn: "1 / -1", mb: 2 }}>
                  <Typography sx={labelStyle}>Specify Custom Role Name: *</Typography>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Enter custom role name"
                    value={adminForm.roleLabel || ""}
                    onChange={(e) => setAdminForm(p => ({ ...p, roleLabel: e.target.value }))}
                  />
                </Box>
              )}

              {adminForm.roleId === "training_coord" && (
                <>
                  <Box sx={{ gridColumn: "1 / -1", mb: 2 }}>
                    <Typography sx={labelStyle}>Select Training Program: *</Typography>
                    <Select
                      size="small"
                      fullWidth
                      value={adminForm.trainingProgramType}
                      onChange={(e) => setAdminForm(p => ({ ...p, trainingProgramType: e.target.value, trainingProgramOther: "" }))}
                    >
                      <MenuItem value="Smart Interviews">Smart Interviews</MenuItem>
                      <MenuItem value="GPP">GPP</MenuItem>
                      <MenuItem value="Others">Others</MenuItem>
                    </Select>
                  </Box>
                  {adminForm.trainingProgramType === "Others" && (
                    <Box sx={{ gridColumn: "1 / -1", mb: 2 }}>
                      <Typography sx={labelStyle}>Specify Training Program: *</Typography>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Enter specific training program"
                        value={adminForm.trainingProgramOther || ""}
                        onChange={(e) => setAdminForm(p => ({ ...p, trainingProgramOther: e.target.value }))}
                      />
                    </Box>
                  )}
                </>
              )}

              <Box sx={{ gridColumn: "1 / -1", mb: 2 }}>
                <Typography sx={labelStyle}>Assigned By: *</Typography>
                <Select
                  size="small"
                  fullWidth
                  value={adminForm.assignedByType}
                  onChange={(e) => setAdminForm(p => ({ ...p, assignedByType: e.target.value, assignedByOtherText: "" }))}
                >
                  {ASSIGNED_BY_OPTIONS.map((opt, i) => (
                    <MenuItem key={i} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </Box>

              {adminForm.assignedByType === "Others" && (
                <Box sx={{ gridColumn: "1 / -1", mb: 2 }}>
                  <Typography sx={labelStyle}>Please Specify (Assigned By): *</Typography>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="E.g., Principal, Management, etc."
                    value={adminForm.assignedByOtherText}
                    onChange={(e) => setAdminForm(p => ({ ...p, assignedByOtherText: e.target.value }))}
                  />
                </Box>
              )}

              {(() => {
                const catalogEntry = ADMIN_ROLE_CATALOG.find((r) => r.roleId === adminForm.roleId);
                const hideLevelForRoles = ['dean', 'assoc_dean', 'coe', 'hod', 'dy_coe', 'univ_office_coord', 'dy_hod', 'dept_exam_cell'];
                const showLevel = catalogEntry && catalogEntry.allowedLevels.length > 1 && !hideLevelForRoles.includes(adminForm.roleId);

                return (
                  <>
                    {showLevel && (
                      <Box sx={{ gridColumn: "1 / -1", mb: 2 }}>
                        <Typography sx={labelStyle}>Level of Service: *</Typography>
                        <Select
                          size="small"
                          fullWidth
                          value={adminForm.level}
                          onChange={(e) => setAdminForm(p => ({ ...p, level: e.target.value }))}
                        >
                          {catalogEntry.allowedLevels.map(lvl => (
                            <MenuItem key={lvl} value={lvl}>{lvl}</MenuItem>
                          ))}
                        </Select>
                      </Box>
                    )}
                    <Box sx={{ gridColumn: "1 / -1", mb: 2 }}>
                      <Typography sx={labelStyle}>Remarks / Details (Optional):</Typography>
                      <TextField
                        size="small"
                        fullWidth
                        value={adminForm.details}
                        onChange={(e) => setAdminForm(p => ({ ...p, details: e.target.value }))}
                        placeholder={catalogEntry?.category === 'Other' ? "Enter work description" : "Any specific remarks"}
                      />
                    </Box>
                  </>
                );
              })()}
            </Grid2>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: "1px solid var(--border-color)" }}>
            <Button onClick={() => setAdminOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleAdminSave}
              disabled={submittingAdmin}
              sx={{ fontWeight: 700, color: "#fff" }}
            >
              {submittingAdmin ? "Saving..." : "Save Entry"}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Box>
  );
};

export default SelfAppraisal;
