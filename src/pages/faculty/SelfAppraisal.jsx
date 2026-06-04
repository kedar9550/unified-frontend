import React, { useState, useEffect } from "react";
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
  FormLabel
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
  Description
} from "@mui/icons-material";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";
import { SubLabel, Grid2, labelStyle, NoteBox, FileField } from "../../components/faculty/PublicationFormFields";

const ADMINISTRATIVE_ROLES_LIST = [
  { id: "dean", label: "Deans / Assoc Deans / CoE" },
  { id: "hod", label: "HoD / Dy. CoE / Coordinator (Univ. Office)" },
  { id: "dy_hod", label: "Dy. HoD / Dept. Exam Cell Incharge" },
  { id: "timetable", label: "Time Table / Project Coordinator / Curriculum Coordinator" },
  { id: "placement", label: "Placement / Internship / Alumni Coordinator" },
  { id: "coursera", label: "Coursera / LinkedIn Coordinator / ALA" },
  { id: "edc", label: "EDC / IIC / IQAC Coordinator" },
  { id: "course_coord", label: "Course Coordinator" },
  { id: "website", label: "Website Coordinator" },
  { id: "nss", label: "NSS / Any Clubs / Professional Chapters Coordinator" },
  { id: "training", label: "Any Training Program Coordinator (Smart Interviews / GPP / Etc.)" },
  { id: "drc", label: "DRC / Research Coordinator" },
  { id: "antiragging", label: "Anti-Ragging Committee Coordinator" },
  { id: "other", label: "Any other remarkable event / activity coordinator", hasDetails: true }
];

const CONTRIBUTION_CATEGORIES = [
  { id: 1, name: "Member of BOG / GB / AC / BOS" },
  { id: 2, name: "Editorial Board Member (SCIE / Q1 / Q2)" },
  { id: 3, name: "Editorial Board Member (ESCI / Q3 / Q4 / Conference Proceedings)" },
  { id: 4, name: "Awards (MHRD / AICTE / UGC / State Govt / Top Institutions)" },
  { id: 5, name: "Awards (NGO / Trust / Others)" },
  { id: 6, name: "Developed E-Content" },
  { id: 7, name: "Certification on New Age Technologies" },
  { id: 8, name: "Students Trained and Shortlisted for Finals" },
  { id: 9, name: "Articles Published in Magazine / Newspaper" },
  { id: 10, name: "Research Facility Establishment / Maintenance" },
  { id: 11, name: "NPTEL Course Completion" },
  { id: 12, name: "Coursera Course Completion" },
  { id: 13, name: "FDP / Seminar Grant Sanctioned" }
];

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
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [appraisal, setAppraisal] = useState(null);
  const [profileComplete, setProfileComplete] = useState(true);
  const [missingFields, setMissingFields] = useState([]);
  const [appraisalConfig, setAppraisalConfig] = useState(null);

  // Claim research publication modal states
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [undertakingFile, setUndertakingFile] = useState(null);

  // Extra Details States
  const [proctoringDetail, setProctoringDetail] = useState(null);
  const [resourceUtilizationDetails, setResourceUtilizationDetails] = useState([]);
  const [contributionDetails, setContributionDetails] = useState([]);
  const [administrationDetail, setAdministrationDetail] = useState(null);

  // Proctoring Inline Form States
  const [totalStudents, setTotalStudents] = useState("");
  const [studentsAppeared, setAppeared] = useState("");
  const [studentsPassed, setPassed] = useState("");
  const [submittingProctoring, setSubmittingProctoring] = useState(false);

  // Administration Inline Form States
  const [adminRolesForm, setAdminRolesForm] = useState({});
  const [submittingAdmin, setSubmittingAdmin] = useState(false);

  // Resource Utilization Modal States
  const [resUtOpen, setResUtOpen] = useState(false);
  const [resUtEditingId, setResUtEditingId] = useState(null);
  const [resUtForm, setResUtForm] = useState({
    activityCategory: "",
    activityType: "",
    organizationName: "",
    fromDate: "",
    toDate: "",
    duration: "",
    remarks: "",
    sessionsConducted: "",
    daysParticipated: "",
    courseFdpName: "",
    organizingInstitutionCategory: "",
    location: "",
    labName: "",
    universityName: "",
    instituteName: "",
    nirfRank: ""
  });
  const [resUtProof, setResUtProof] = useState(null);
  const [resUtLoading, setResUtLoading] = useState(false);
  const [selectedResUtDetails, setSelectedResUtDetails] = useState(null);

  // Contribution Modal States
  const [contOpen, setContOpen] = useState(false);
  const [contEditingId, setContEditingId] = useState(null);
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
    sanctionDate: ""
  });
  const [contProof, setContProof] = useState(null);
  const [contLoading, setContLoading] = useState(false);
  const [selectedContDetails, setSelectedContDetails] = useState(null);

  // Fetch Academic Years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await axiosInstance.get("/api/academic-years");
        const yearsList = res.data?.years || [];
        setAcademicYears(yearsList);
        if (yearsList.length > 0) {
          setSelectedYear(yearsList[0]._id);
        }
      } catch (err) {
        toast.error("Failed to load academic years.");
      }
    };
    fetchYears();
  }, []);

  // Fetch/Initiate Appraisal on Academic Year change
  const fetchAppraisal = async () => {
    if (!selectedYear) return;
    setLoading(true);
    try {
      // Fetch Appraisal Config Settings
      try {
        const configRes = await axiosInstance.get(`/api/appraisal/config/${selectedYear}`);
        if (configRes.data && configRes.data.success) {
          setAppraisalConfig(configRes.data.data);
        }
      } catch (configErr) {
        console.error("Failed to load appraisal config:", configErr);
      }

      const res = await axiosInstance.get(`/api/appraisal/initiate/${selectedYear}`);
      if (res.data && res.data.success) {
        setAppraisal(res.data.data);
        setProfileComplete(res.data.isProfileComplete);
        setMissingFields(res.data.missingProfileFields || []);

        // Populating extra states
        const proc = res.data.proctoringDetail || null;
        setProctoringDetail(proc);
        setResourceUtilizationDetails(res.data.resourceUtilizationDetails || []);
        setContributionDetails(res.data.contributionDetails || []);
        setAdministrationDetail(res.data.administrationDetail || null);

        if (proc) {
          setTotalStudents(proc.totalStudents ? proc.totalStudents.toString() : "");
          setAppeared(proc.studentsAppeared ? proc.studentsAppeared.toString() : "");
          setPassed(proc.studentsPassed ? proc.studentsPassed.toString() : "");
        } else {
          setTotalStudents("");
          setAppeared("");
          setPassed("");
        }
      }
    } catch (err) {
      toast.error("Failed to fetch or calculate self appraisal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppraisal();
  }, [selectedYear]);

  // Submit Appraisal
  const handleSubmit = async () => {
    if (!profileComplete) {
      toast.error("Please complete your faculty profile details before submitting.");
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

  // 1.2 Proctoring Submit Handler
  const handleProctoringSubmit = async (e) => {
    e.preventDefault();
    const total = parseInt(totalStudents);
    const appeared = parseInt(studentsAppeared);
    const passed = parseInt(studentsPassed);

    if (isNaN(total) || isNaN(appeared) || isNaN(passed)) {
      toast.warning("Please fill in all the student counts with valid numbers");
      return;
    }
    if (total < 0 || appeared < 0 || passed < 0) {
      toast.warning("Counts cannot be negative");
      return;
    }
    if (appeared > total) {
      toast.warning("Appeared count cannot exceed total students under proctoring");
      return;
    }
    if (passed > appeared) {
      toast.warning("Passed count cannot exceed appeared count");
      return;
    }

    setSubmittingProctoring(true);
    try {
      const res = await axiosInstance.post("/api/faculty-proctoring", {
        academicYear: selectedYear,
        totalStudents: total,
        studentsAppeared: appeared,
        studentsPassed: passed
      });
      if (res.data?.success) {
        toast.success("Proctoring statistics submitted successfully!");
        fetchAppraisal();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit proctoring statistics.");
    } finally {
      setSubmittingProctoring(false);
    }
  };

  // 4. Administration Sync and Submit Handlers
  useEffect(() => {
    const initialForm = {};
    ADMINISTRATIVE_ROLES_LIST.forEach((r) => {
      let matchedRole = null;
      if (administrationDetail && administrationDetail.roles) {
        matchedRole = administrationDetail.roles.find((x) => x.roleName === r.label);
      }
      initialForm[r.id] = {
        roleName: r.label,
        isResponsible: matchedRole ? matchedRole.isResponsible : false,
        level: matchedRole ? matchedRole.level : "",
        details: matchedRole ? matchedRole.details : ""
      };
    });
    setAdminRolesForm(initialForm);
  }, [selectedYear, administrationDetail]);

  const handleToggleResponsibility = (id, checked) => {
    const roleLabel = ADMINISTRATIVE_ROLES_LIST.find((r) => r.id === id)?.label;
    if (administrationDetail) {
      const foundRole = (administrationDetail.roles || []).find((x) => x.roleName === roleLabel);
      if (foundRole && foundRole.isResponsible && (foundRole.status === "Approved" || foundRole.status === "Pending")) {
        return;
      }
    }
    setAdminRolesForm((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        isResponsible: checked,
        level: checked ? (prev[id].level || "Department level") : "",
        details: checked ? prev[id].details : ""
      }
    }));
  };

  const handleLevelChange = (id, level) => {
    setAdminRolesForm((prev) => ({
      ...prev,
      [id]: { ...prev[id], level }
    }));
  };

  const handleDetailsChange = (id, details) => {
    setAdminRolesForm((prev) => ({
      ...prev,
      [id]: { ...prev[id], details }
    }));
  };

  const handleAdminRolesSubmit = async (e) => {
    e.preventDefault();
    const hasSelectedRole = Object.values(adminRolesForm).some((role) => role.isResponsible);
    if (!hasSelectedRole) {
      toast.error("Please select at least one administrative responsibility before submitting.");
      return;
    }

    try {
      const rolesPayload = Object.values(adminRolesForm).map((role) => {
        if (role.roleName === "Any other remarkable event / activity coordinator" && role.isResponsible && !role.details.trim()) {
          throw new Error("Please specify the name of the event/activity.");
        }
        return {
          roleName: role.roleName,
          isResponsible: role.isResponsible,
          level: role.isResponsible ? role.level : "",
          details: role.isResponsible ? role.details : ""
        };
      });

      setSubmittingAdmin(true);
      const res = await axiosInstance.post("/api/faculty-administration", {
        academicYear: selectedYear,
        roles: rolesPayload
      });
      if (res.data?.success) {
        toast.success("Administrative roles saved successfully!");
        fetchAppraisal();
      }
    } catch (err) {
      toast.error(err.message || err.response?.data?.message || "Failed to save administrative roles.");
    } finally {
      setSubmittingAdmin(false);
    }
  };

  // 3.1 Resource Utilization Form Recalculate Duration
  useEffect(() => {
    if (resUtForm.fromDate && resUtForm.toDate) {
      const start = new Date(resUtForm.fromDate);
      const end = new Date(resUtForm.toDate);
      if (start <= end) {
        const diffTime = Math.abs(end - start);
        const days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
        setResUtForm(prev => ({ ...prev, duration: String(days) }));
      }
    }
  }, [resUtForm.fromDate, resUtForm.toDate]);

  const handleResUtOpenAdd = () => {
    setResUtEditingId(null);
    setResUtForm({
      activityCategory: "",
      activityType: "",
      organizationName: "",
      fromDate: "",
      toDate: "",
      duration: "",
      remarks: "",
      sessionsConducted: "",
      daysParticipated: "",
      courseFdpName: "",
      organizingInstitutionCategory: "",
      location: "",
      labName: "",
      universityName: "",
      instituteName: "",
      nirfRank: ""
    });
    setResUtProof(null);
    setResUtOpen(true);
  };

  const handleResUtOpenEdit = (activity) => {
    setResUtEditingId(activity._id);
    setResUtForm({
      activityCategory: activity.activityCategory,
      activityType: activity.activityType,
      organizationName: activity.organizationName,
      fromDate: activity.fromDate ? activity.fromDate.substring(0, 10) : "",
      toDate: activity.toDate ? activity.toDate.substring(0, 10) : "",
      duration: String(activity.duration),
      remarks: activity.remarks || "",
      sessionsConducted: activity.sessionsConducted !== undefined ? String(activity.sessionsConducted) : "",
      daysParticipated: activity.daysParticipated !== undefined ? String(activity.daysParticipated) : "",
      courseFdpName: activity.courseFdpName || "",
      organizingInstitutionCategory: activity.organizingInstitutionCategory || "",
      location: activity.location || "",
      labName: activity.labName || "",
      universityName: activity.universityName || "",
      instituteName: activity.instituteName || "",
      nirfRank: activity.nirfRank !== undefined ? String(activity.nirfRank) : ""
    });
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
    const showSessionsField = resUtForm.activityType?.includes("Resource Person");
    const showDaysField = resUtForm.activityType?.includes("Participant");

    const isFdpParticipant = resUtForm.activityCategory === "FDP" && resUtForm.activityType === "FDP Participant";
    const basicFieldsValid = isFdpParticipant
      ? (resUtForm.activityCategory && resUtForm.activityType && resUtForm.courseFdpName && resUtForm.fromDate && resUtForm.toDate)
      : (resUtForm.activityCategory && resUtForm.activityType && resUtForm.organizationName && resUtForm.fromDate && resUtForm.toDate);

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

    if (showSessionsField && !resUtForm.sessionsConducted) {
      toast.error("Number of Sessions Conducted is required for Resource Person role");
      return;
    }
    if (showDaysField && !resUtForm.daysParticipated) {
      toast.error("Number of Days Participated is required for Participant role");
      return;
    }
    if (!resUtProof && !resUtEditingId) {
      toast.error("Supporting proof upload is mandatory");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = new Date(resUtForm.fromDate);
    const to = new Date(resUtForm.toDate);

    if (from > today || to > today) {
      toast.error("Activity dates cannot be in the future");
      return;
    }
    if (from >= to) {
      toast.error("To Date must be greater than From Date");
      return;
    }

    setResUtLoading(true);
    try {
      const fd = new FormData();
      fd.append("academicYear", selectedYear);
      fd.append("activityCategory", resUtForm.activityCategory);
      fd.append("activityType", resUtForm.activityType);
      fd.append("fromDate", resUtForm.fromDate);
      fd.append("toDate", resUtForm.toDate);
      fd.append("duration", resUtForm.duration);
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
        }
      } else {
        fd.append("organizationName", resUtForm.organizationName);
      }

      if (showSessionsField && resUtForm.sessionsConducted) {
        fd.append("sessionsConducted", resUtForm.sessionsConducted);
      }
      if (showDaysField && resUtForm.daysParticipated) {
        fd.append("daysParticipated", resUtForm.daysParticipated);
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
      facilityDate: "",
      grantName: "",
      sanctionDate: ""
    });
    setContProof(null);
    setContOpen(true);
  };

  const handleContOpenEdit = (item) => {
    setContEditingId(item._id);
    setContForm({
      category: item.category,
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
      facilityDate: item.facilityDate ? item.facilityDate.substring(0, 10) : "",
      grantName: item.grantName || "",
      sanctionDate: item.sanctionDate ? item.sanctionDate.substring(0, 10) : ""
    });
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
    if (!contProof && !contEditingId) {
      toast.error("Supporting proof upload is mandatory");
      return;
    }

    const cat = parseInt(contForm.category);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validateDate = (dateStr, fieldLabel, allowFuture = false) => {
      if (!dateStr) return `${fieldLabel} is required.`;
      const dateVal = new Date(dateStr);
      if (!allowFuture && dateVal > today) return `${fieldLabel} cannot be in the future.`;
      return null;
    };

    let fieldErr = null;

    if ([1, 2, 3, 7, 10, 12, 13].includes(cat)) {
      if (!contForm.fromDate || !contForm.toDate) {
        fieldErr = "From Date and To Date are required.";
      } else {
        const from = new Date(contForm.fromDate);
        const to = new Date(contForm.toDate);
        if (from > today) {
          fieldErr = "From Date cannot be in the future.";
        } else if (from >= to) {
          fieldErr = "To Date must be greater than From Date.";
        } else {
          if ([7, 10, 12, 13].includes(cat) && to > today) {
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
          break;
        case 11:
          if (!contForm.courseName || !contForm.duration) {
            fieldErr = "Course Name and Duration are required.";
          }
          break;
        case 12:
          if (!contForm.courseName) fieldErr = "Course Name is required.";
          break;
        case 13:
          if (!contForm.grantName) fieldErr = "Grant Name is required.";
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
      fd.append("category", String(cat));

      if ([1, 2, 3, 7, 10, 12, 13].includes(cat)) {
        fd.append("fromDate", contForm.fromDate);
        fd.append("toDate", contForm.toDate);
        fd.append("duration", contForm.duration);
      }

      if (cat === 1) {
        fd.append("organizationName", contForm.organizationName);
      } else if (cat === 2) {
        fd.append("journalName", contForm.journalName);
      } else if (cat === 3) {
        fd.append("journalConferenceName", contForm.journalConferenceName);
      } else if (cat === 4 || cat === 5) {
        fd.append("awardName", contForm.awardName);
        fd.append("awardDate", contForm.awardDate);
      } else if (cat === 6) {
        fd.append("courseName", contForm.courseName);
        fd.append("url", contForm.url);
      } else if (cat === 7) {
        fd.append("certificationName", contForm.certificationName);
      } else if (cat === 8) {
        fd.append("eventName", contForm.eventName);
        fd.append("eventDate", contForm.eventDate);
      } else if (cat === 9) {
        fd.append("articleTitle", contForm.articleTitle);
        fd.append("publicationName", contForm.publicationName);
        fd.append("publicationDate", contForm.publicationDate);
      } else if (cat === 10) {
        fd.append("facilityName", contForm.facilityName);
      } else if (cat === 11) {
        fd.append("courseName", contForm.courseName);
        fd.append("duration", contForm.duration);
      } else if (cat === 12) {
        fd.append("courseName", contForm.courseName);
      } else if (cat === 13) {
        fd.append("grantName", contForm.grantName);
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
      sanctionDate: ""
    });
  };

  const getContributionNameField = (category, data) => {
    const cat = parseInt(category);
    switch (cat) {
      case 1: return { field: 'organizationName', value: data.organizationName };
      case 2: return { field: 'journalName', value: data.journalName };
      case 3: return { field: 'journalConferenceName', value: data.journalConferenceName };
      case 4:
      case 5: return { field: 'awardName', value: data.awardName };
      case 6: return { field: 'courseName', value: data.courseName };
      case 7: return { field: 'certificationName', value: data.certificationName };
      case 8: return { field: 'eventName', value: data.eventName };
      case 9: return { field: 'articleTitle', value: data.articleTitle };
      case 10: return { field: 'facilityName', value: data.facilityName };
      case 11:
      case 12: return { field: 'courseName', value: data.courseName };
      case 13: return { field: 'grantName', value: data.grantName };
      default: return { field: '', value: '' };
    }
  };

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
      pts = (parseInt(r.sessionsConducted) || 1) * (resourceUtConf.resourcePerson ?? 2);
    } else if (activityRole.includes('participant') || activityRole.includes('participated')) {
      pts = (parseInt(r.daysParticipated) || 1) * (resourceUtConf.participated ?? 1);
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

    const cat = parseInt(item.category);
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

    let pts = 5; // default fallback
    const name = r.roleName.toLowerCase();
    const level = (r.level || '').toLowerCase();
    const isCentral = level.includes('central') || level.includes('institute');

    if (name.includes('dean') || name.includes('coe')) {
      pts = adminConf.deanCentral ?? 20;
    } else if (name.includes('hod')) {
      if (name.includes('dy') || name.includes('vice')) {
        pts = adminConf.dyHodDept ?? 10;
      } else {
        pts = isCentral ? (adminConf.hodCentral ?? 15) : (adminConf.hodDept ?? 15);
      }
    } else if (name.includes('exam cell') || name.includes('exam incharge')) {
      pts = adminConf.dyHodDept ?? 10;
    } else if (name.includes('timetable') || name.includes('time table') || name.includes('project') || name.includes('curriculum')) {
      pts = adminConf.timetableDept ?? 10;
    } else if (name.includes('placement') || name.includes('internship') || name.includes('alumni')) {
      pts = isCentral ? (adminConf.placementCentral ?? 10) : (adminConf.placementDept ?? 10);
    } else if (name.includes('coursera') || name.includes('linkedin') || name.includes('ala')) {
      pts = isCentral ? (adminConf.courseraCentral ?? 10) : (adminConf.courseraDept ?? 5);
    } else if (name.includes('edc') || name.includes('iic') || name.includes('iqac')) {
      pts = isCentral ? (adminConf.edcCentral ?? 10) : (adminConf.edcDept ?? 5);
    } else if (name.includes('course coordinator')) {
      pts = adminConf.courseDept ?? 5;
    } else if (name.includes('website')) {
      pts = adminConf.websiteCentral ?? 10;
    } else if (name.includes('nss') || name.includes('professional chapter')) {
      pts = isCentral ? (adminConf.nssCentral ?? 10) : (adminConf.nssDept ?? 5);
    } else if (name.includes('training')) {
      pts = isCentral ? (adminConf.trainingCentral ?? 10) : (adminConf.trainingDept ?? 5);
    } else if (name.includes('drc') || name.includes('research')) {
      pts = adminConf.drcDept ?? 5;
    } else if (name.includes('anti-ragging') || name.includes('antiragging')) {
      pts = isCentral ? (adminConf.antiRaggingCentral ?? 5) : (adminConf.antiRaggingDept ?? 3);
    } else {
      pts = isCentral ? (adminConf.otherCentral ?? 10) : (adminConf.otherDept ?? 5);
    }
    return pts;
  };

  const getCategoryName = (catId) => {
    const found = CONTRIBUTION_CATEGORIES.find(c => c.id === catId);
    return found ? found.name : `Category ${catId}`;
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

  if (!appraisal) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography color="var(--text-secondary)">Loading appraisal details...</Typography>
      </Box>
    );
  }

  return (
    <Box p={4} sx={{ maxWidth: 1300, margin: "0 auto", animation: "fadeIn 0.5s ease" }}>

      {/* Header Panel */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          mb: 4,
          p: 3,
          borderRadius: "20px",
          background: "var(--bg-panel)",
          border: "1px solid var(--border-color)",
          backdropFilter: "blur(12px)",
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
            Faculty Self Appraisal Portal
          </Typography>
          <Typography variant="body2" color="var(--text-secondary)">
            Fill, review, and submit your performance appraisal form.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: { xs: "100%", md: "auto" } }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200, background: "var(--bg-paper)", borderRadius: "8px" }}>
            <InputLabel>Academic Year</InputLabel>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              label="Academic Year"
            >
              {academicYears.map((ay) => (
                <MenuItem key={ay._id} value={ay._id}>
                  {ay.year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {appraisal.status === "Draft" || appraisal.status === "Rejected by HOD" ? (
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                px: 3,
                boxShadow: "0 4px 14px rgba(34, 197, 94, 0.4)",
                background: "var(--gradient-primary)",
                color: "#fff"
              }}
            >
              Submit to HOD
            </Button>
          ) : (
            <Chip
              label={`Status: ${appraisal.status}`}
              color={appraisal.status === "Completed" ? "success" : "info"}
              icon={<AssignmentTurnedIn />}
              sx={{ fontWeight: 700, px: 2, py: 2.2, borderRadius: "10px" }}
            />
          )}
        </Box>
      </Box>

      {/* Completeness Warning Banner */}
      {!profileComplete && (
        <Alert severity="warning" variant="filled" sx={{ mb: 4, borderRadius: "16px" }}>
          <AlertTitle sx={{ fontWeight: 700 }}>Profile Details Incomplete</AlertTitle>
          You must complete the following fields in your profile before you can submit this appraisal to HOD:
          <strong> {missingFields.join(", ")}</strong>. Please navigate to the Profile settings to update them.
        </Alert>
      )}

      {/* Main Grid */}
      <Grid container spacing={4}>

        {/* Left Side: Detail Sheets */}
        <Grid item xs={12} lg={8.5}>
          {/* PART-A: Personal Information */}
          <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
                <Person sx={{ color: "var(--color-primary)" }} /> PART-A: Personal Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={2.5}>
                {[
                  { label: "Name with Emp ID", val: `${appraisal.personalInfoSnapshot?.name} (${appraisal.personalInfoSnapshot?.institutionId})` },
                  { label: "Designation & Dept", val: `${appraisal.personalInfoSnapshot?.designation} - ${appraisal.personalInfoSnapshot?.departmentName}` },
                  { label: "Scopus ID", val: appraisal.personalInfoSnapshot?.scopusId || "N/A", highlight: !appraisal.personalInfoSnapshot?.scopusId },
                  { label: "Web of Science ID", val: appraisal.personalInfoSnapshot?.wosId || "N/A", highlight: !appraisal.personalInfoSnapshot?.wosId },
                  { label: "ORCID ID", val: appraisal.personalInfoSnapshot?.orcidId || "N/A", highlight: !appraisal.personalInfoSnapshot?.orcidId }
                ].map((item, idx) => (
                  <Grid item xs={12} md={6} key={idx}>
                    <Typography variant="caption" color="var(--text-secondary)" sx={{ fontWeight: 700 }}>
                      {item.label}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: item.highlight ? "var(--color-danger)" : "var(--text-primary)",
                        mt: 0.5
                      }}
                    >
                      {item.val}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* PART-B: Performance Details */}

          {/* 1. Teaching & Learning */}
          <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
                <MenuBook sx={{ color: "var(--color-primary)" }} /> 1. Teaching (Max 80 points)
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {/* 1.1 Course pass percentage */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                1.1 Course Average Pass Percentage (Theory only)
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Course Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Sem-Branch-Sec</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Appeared</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Passed</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Pass %</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Points claimed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appraisal.teaching.passPercentage.courses.length > 0 ? (
                      appraisal.teaching.passPercentage.courses.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontWeight: 500 }}>{c.courseName}</TableCell>
                          <TableCell>{c.secBranchSem}</TableCell>
                          <TableCell align="right">{c.appeared}</TableCell>
                          <TableCell align="right">{c.passed}</TableCell>
                          <TableCell align="right">{c.percentage}%</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>{c.pointsClaimed}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" color="var(--text-secondary)">No theory subjects result found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 1.2 Proctoring Students' Average Pass Percentage */}
              {proctoringDetail && (proctoringDetail.status === "Approved" || proctoringDetail.status === "Pending") ? (
                <>
                  <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>
                      1.2 Proctoring Students' Average Pass Percentage
                    </Typography>
                    <Chip
                      label={proctoringDetail.status}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(proctoringDetail.status).bg,
                        color: getStatusColor(proctoringDetail.status).color,
                        fontWeight: 800,
                        borderRadius: "6px"
                      }}
                    />
                  </Box>
                  <TableContainer component={Paper} sx={{ mb: 3, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                          <TableCell sx={{ fontWeight: 700 }}>Total Allotted</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Appeared (A)</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Passed (B)</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Pass % (B/A)</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Points claimed</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {appraisal.teaching.proctoring.entries.length > 0 ? (
                          appraisal.teaching.proctoring.entries.map((e, i) => (
                            <TableRow key={i}>
                              <TableCell sx={{ fontWeight: 500 }}>{e.totalStudents}</TableCell>
                              <TableCell align="right">{e.appeared}</TableCell>
                              <TableCell align="right">{e.passed}</TableCell>
                              <TableCell align="right">{e.percentage}%</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>{e.pointsClaimed}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} align="center">No proctoring entries found.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                    1.2 Proctoring Students' Average Pass Percentage
                  </Typography>
                  <Box sx={{ p: 2.5, mb: 3, border: "1px dashed var(--border-color)", borderRadius: "12px", background: "var(--bg-glass)" }}>
                    {proctoringDetail && proctoringDetail.status === "Rejected" && (
                      <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>
                        <strong>Rejection Remarks from HOD:</strong> {proctoringDetail.remarks || "No comments provided."}
                      </Alert>
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-secondary)", mb: 2 }}>
                      {proctoringDetail ? "Edit and Resubmit Proctoring Statistics:" : "No Proctoring records found for this academic cycle. Please enter details inline:"}
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Total Allotted Students"
                          type="number"
                          size="small"
                          fullWidth
                          value={totalStudents}
                          onChange={(e) => setTotalStudents(e.target.value)}
                          disabled={submittingProctoring}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Students Appeared"
                          type="number"
                          size="small"
                          fullWidth
                          value={studentsAppeared}
                          onChange={(e) => setAppeared(e.target.value)}
                          disabled={submittingProctoring}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Students Passed"
                          type="number"
                          size="small"
                          fullWidth
                          value={studentsPassed}
                          onChange={(e) => setPassed(e.target.value)}
                          disabled={submittingProctoring}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box display="flex" flexDirection="column">
                          <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--text-secondary)" }}>
                            Calculated Pass %
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: "var(--color-primary)", mt: 0.5 }}>
                            {studentsAppeared > 0 && studentsPassed >= 0 ? ((parseInt(studentsPassed) / parseInt(studentsAppeared)) * 100).toFixed(2) + '%' : '0.00%'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                        <Button
                          variant="contained"
                          onClick={handleProctoringSubmit}
                          disabled={submittingProctoring}
                          size="small"
                          sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", color: "#fff" }}
                        >
                          {submittingProctoring ? "Submitting..." : proctoringDetail ? "Resubmit Proctoring" : "Submit Proctoring"}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}

              {/* 1.3 Course Feedback */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                1.3 Course Feedback
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Course Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Sem-Branch-Sec</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Students</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Feedback %</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Points claimed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appraisal.teaching.feedback.courses.length > 0 ? (
                      appraisal.teaching.feedback.courses.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontWeight: 500 }}>{c.courseName}</TableCell>
                          <TableCell>{c.secBranchSem}</TableCell>
                          <TableCell align="right">{c.noOfStudents}</TableCell>
                          <TableCell align="right">{c.feedbackPercentage}%</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>{c.pointsClaimed}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No course feedbacks found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 1.4 CO Attainment */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                1.4 CO Attainment (Theory only)
              </Typography>
              <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Course Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Sem-Branch-Sec</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Total COs</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">COs Attained</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Points claimed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appraisal.teaching.coAttainment.courses.length > 0 ? (
                      appraisal.teaching.coAttainment.courses.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontWeight: 500 }}>{c.courseName}</TableCell>
                          <TableCell>{c.secBranchSem}</TableCell>
                          <TableCell align="right">{c.noOfCos}</TableCell>
                          <TableCell align="right">{c.noOfCosAttained}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>{c.pointsClaimed}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No CO attainment details found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* 2. Research Contributions */}
          <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
                <Science sx={{ color: "var(--color-primary)" }} /> 2. Research Contributions
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {/* 2.1 Papers Publication with Claims Coordination */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                2.1 Paper Publications (Journals)
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 4, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Paper Title</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Journal Scope</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>DOI</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Claim Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Points</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appraisal.research.papers.items.length > 0 ? (
                      appraisal.research.papers.items.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontWeight: 500 }}>{p.title}</TableCell>
                          <TableCell>{p.scope}</TableCell>
                          <TableCell>{p.doi}</TableCell>
                          <TableCell>
                            {p.claimStatus === "claimed_by_me" && (
                              <Chip label="Claimed by Me" color="success" size="small" />
                            )}
                            {p.claimStatus === "claimed_by_other" && (
                              <Chip label={`Claimed by: ${p.claimedBy}`} color="error" size="small" />
                            )}
                            {p.claimStatus === "auto_eligible" && (
                              <Chip label="Eligible (Single AUS Author)" color="info" size="small" />
                            )}
                            {p.claimStatus === "requires_claim_action" && (
                              <Button
                                variant="outlined"
                                color="warning"
                                size="small"
                                onClick={() => {
                                  setSelectedPaper(p);
                                  setClaimModalOpen(true);
                                }}
                                disabled={appraisal.status !== "Draft" && appraisal.status !== "Rejected by HOD"}
                                sx={{ textTransform: "none", py: 0.2, fontWeight: 700 }}
                              >
                                Claim Points
                              </Button>
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>{p.pointsClaimed}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No approved journals found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* PhD, Books, Patents */}
              <Grid container spacing={3}>
                {/* 2.2 PhD Guiding */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                    2.2 Guiding Ph.D. Scholars
                  </Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                          <TableCell sx={{ fontWeight: 700 }}>Scholar Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Points</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {appraisal.research.phdGuiding.items.length > 0 ? (
                          appraisal.research.phdGuiding.items.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell>{p.name}</TableCell>
                              <TableCell>{p.status}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{p.pointsClaimed}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center">None</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* 2.3 Books Chapters */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                    2.3 Books / Chapters (Max 10 pts)
                  </Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                          <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>ISBN</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Points</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {appraisal.research.booksChapters.items.length > 0 ? (
                          appraisal.research.booksChapters.items.map((b, i) => (
                            <TableRow key={i}>
                              <TableCell>{b.title}</TableCell>
                              <TableCell>{b.isbn || "N/A"}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{b.pointsClaimed}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center">None</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* 2.4 Patents */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                    2.4 Patents
                  </Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                          <TableCell sx={{ fontWeight: 700 }}>Patent Title</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Points</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {appraisal.research.patents?.items?.length > 0 ? (
                          appraisal.research.patents.items.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell>{p.title}</TableCell>
                              <TableCell>{p.status}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{p.pointsClaimed}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center">None</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* 2.5 Novel Products / Technology */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                    2.5 Novel Products / Technology
                  </Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                          <TableCell sx={{ fontWeight: 700 }}>Product Title</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Points</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {appraisal.research.novelProducts?.items?.length > 0 ? (
                          appraisal.research.novelProducts.items.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell>{p.title}</TableCell>
                              <TableCell>{p.status}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{p.pointsClaimed}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center">None</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* 2.6 Project Proposals / Consultancies */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--color-primary)" }}>
                    2.6 Funded Projects & Consultancies
                  </Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                          <TableCell sx={{ fontWeight: 700 }}>Project Title</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Agency</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Amount (Lakhs)</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Points</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {appraisal.research.projectsConsultancies?.items?.length > 0 ? (
                          appraisal.research.projectsConsultancies.items.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell sx={{ fontWeight: 500 }}>{p.title}</TableCell>
                              <TableCell>{p.projectType === 'FundedProject' ? 'Funded Project' : 'Consultancy'}</TableCell>
                              <TableCell>{p.agency || "N/A"}</TableCell>
                              <TableCell align="right">{p.amountInLakhs || 0}</TableCell>
                              <TableCell>{p.status}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{p.pointsClaimed}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} align="center">None</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>

              {/* R&D Admin Provided Scores */}
              <Box sx={{ mt: 4, p: 2, background: "var(--bg-accent-4)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "var(--text-primary)" }}>
                  Research & Development Admin Verified Scores
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, background: "var(--bg-paper)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                        2.7 Scopus Citation Score
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                        {appraisal.research.scopusCitationScore || 0} pts
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, background: "var(--bg-paper)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                        2.8 Scopus h-index Score Points
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                        {appraisal.research.scopusHIndexScore || 0} pts
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>

          {/* 3. Extension / Value Addition */}
          <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
                <CardMembership sx={{ color: "var(--color-primary)" }} /> 3. Extension / Value Addition
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {/* 3.1 Resource Utilization */}
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


              <TableContainer component={Paper} sx={{ mb: 4, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                      <TableCell sx={{ fontWeight: 700, width: "60px" }}>S. No</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Details of the Event along with dates</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: "120px" }}>Duration</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: "180px" }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: "130px" }}>Points claimed</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: "120px" }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: "120px" }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resourceUtilizationDetails.length > 0 ? (
                      <>
                        {resourceUtilizationDetails.map((activity, i) => {
                          const statusStyle = getStatusColor(activity.status);
                          const isEditable = activity.status === 'Draft' || activity.status === 'Rejected';
                          const fromDateFormatted = activity.fromDate ? new Date(activity.fromDate).toLocaleDateString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";
                          const toDateFormatted = activity.toDate ? new Date(activity.toDate).toLocaleDateString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";

                          return (
                            <TableRow key={activity._id || i}>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>
                                {activity.organizationName} {fromDateFormatted && toDateFormatted ? `(${fromDateFormatted} - ${toDateFormatted})` : ""}
                              </TableCell>
                              <TableCell>{activity.duration} Days</TableCell>
                              <TableCell>{activity.activityType}</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: "var(--color-primary)" }}>
                                {calculateResourceUtilizationPoints(activity, appraisalConfig)}
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
                                <Stack direction="row" spacing={1} justifyContent="center">
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
                        <TableRow sx={{ background: "rgba(0,0,0,0.02)" }}>
                          <TableCell colSpan={4} align="right" sx={{ fontWeight: 800, pr: 2 }}>
                            Self-Assessment Points (Max:10)
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                            {Math.min(10, resourceUtilizationDetails.reduce((sum, r) => r.status !== 'Rejected' ? sum + calculateResourceUtilizationPoints(r, appraisalConfig) : sum, 0))}
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                      </>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ color: "var(--text-secondary)", py: 2 }}>
                          No Resource Utilization records found for this academic year.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 3.2 Expertise / Contribution */}
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


              <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                      <TableCell sx={{ fontWeight: 700, width: "60px" }}>S. No</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Details of the Faculty Expertise/Recognition/Contribution</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: "130px" }}>Points claimed</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: "120px" }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: "120px" }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contributionDetails.length > 0 ? (
                      <>
                        {contributionDetails.map((item, i) => {
                          const statusStyle = getStatusColor(item.status);
                          const isEditable = item.status === 'Draft' || item.status === 'Rejected';
                          const { value } = getContributionNameField(item.category, item);
                          return (
                            <TableRow key={item._id || i}>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>
                                {getCategoryName(item.category)} - {value || "N/A"}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, color: "var(--color-primary)" }}>
                                {calculateContributionPoints(item, appraisalConfig)}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={item.status}
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
                                <Stack direction="row" spacing={1} justifyContent="center">
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
                        <TableRow sx={{ background: "rgba(0,0,0,0.02)" }}>
                          <TableCell colSpan={2} align="right" sx={{ fontWeight: 800, pr: 2 }}>
                            Self-Assessment Points (Max:10)
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                            {Math.min(10, contributionDetails.reduce((sum, r) => r.status !== 'Rejected' ? sum + calculateContributionPoints(r, appraisalConfig) : sum, 0))}
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                      </>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ color: "var(--text-secondary)", py: 2 }}>
                          No Expertise / Contribution records found for this academic year.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* 4. Administrative Responsibilities */}
          <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", mb: 4 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <AssignmentTurnedIn sx={{ color: "var(--color-primary)" }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                  4. Administrative Responsibilities (Max 20 points)
                </Typography>
                {administrationDetail && (
                  <Chip
                    label={administrationDetail.status}
                    size="small"
                    sx={{
                      bgcolor: getStatusColor(administrationDetail.status).bg,
                      color: getStatusColor(administrationDetail.status).color,
                      fontWeight: 800,
                      borderRadius: "6px"
                    }}
                  />
                )}
              </Box>
              <Divider sx={{ mb: 3 }} />


              {administrationDetail && (administrationDetail.status === "Approved" || administrationDetail.status === "Pending") ? (
                <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                        <TableCell sx={{ fontWeight: 700, width: "60px" }}>S. No</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Details of the Administrative Responsibility</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: "150px" }}>Assigned by</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: "130px" }}>Points claimed</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: "120px" }}>Status</TableCell>
                        {administrationDetail.roles?.some(r => r.isResponsible && r.remarks) && (
                          <TableCell sx={{ fontWeight: 700, width: "180px" }}>Remarks</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(() => {
                        const responsibleRoles = administrationDetail.roles?.filter(r => r.isResponsible) || [];
                        return (
                          <>
                            {responsibleRoles.map((role, i) => {
                              const assignedByText = role.level && (role.level.toLowerCase().includes("central") || role.level.toLowerCase().includes("institute")) ? "Central" : "Dept";
                              return (
                                <TableRow key={i}>
                                  <TableCell>{i + 1}</TableCell>
                                  <TableCell sx={{ fontWeight: 500 }}>
                                    {role.roleName} {role.details ? `(${role.details})` : ""}
                                  </TableCell>
                                  <TableCell>{assignedByText}</TableCell>
                                  <TableCell sx={{ fontWeight: 700, color: "var(--color-primary)" }}>
                                    {calculateAdministrativePoints(role, appraisalConfig)}
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={role.status}
                                      size="small"
                                      sx={{
                                        bgcolor: getStatusColor(role.status).bg,
                                        color: getStatusColor(role.status).color,
                                        fontWeight: 800,
                                        borderRadius: "6px"
                                      }}
                                    />
                                  </TableCell>
                                  {administrationDetail.roles?.some(r => r.isResponsible && r.remarks) && (
                                    <TableCell sx={{ fontStyle: "italic", color: "var(--text-secondary)" }}>
                                      {role.remarks || "-"}
                                    </TableCell>
                                  )}
                                </TableRow>
                              );
                            })}
                            {/* Footer row displaying dynamic sum */}
                            <TableRow sx={{ background: "rgba(0,0,0,0.02)" }}>
                              <TableCell colSpan={3} align="right" sx={{ fontWeight: 800, pr: 2 }}>
                                Self-Assessment points (Max:20)
                              </TableCell>
                              <TableCell sx={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                                {Math.min(20, responsibleRoles.reduce((sum, r) => r.status !== 'Rejected' ? sum + calculateAdministrativePoints(r, appraisalConfig) : sum, 0))}
                              </TableCell>
                              <TableCell colSpan={administrationDetail.roles?.some(r => r.isResponsible && r.remarks) ? 2 : 1}></TableCell>
                            </TableRow>
                          </>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 2.5, border: "1px dashed var(--border-color)", borderRadius: "12px", background: "var(--bg-glass)" }}>
                  {administrationDetail && administrationDetail.status === "Rejected" && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: "8px" }}>
                      <strong>Rejection Remarks from HOD:</strong> {administrationDetail.remarks || "Please check individual role feedback."}
                    </Alert>
                  )}

                  {/* Live Claim Counter Header Box */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>
                      Select your Administrative Responsibilities for the Academic Year:
                    </Typography>
                    {(() => {
                      const livePoints = Math.min(20, Object.values(adminRolesForm).reduce((sum, role) => {
                        return role.isResponsible ? sum + calculateAdministrativePoints(role, appraisalConfig) : sum;
                      }, 0));
                      return (
                        <Chip
                          label={`Live Points Claimed: ${livePoints} / 20`}
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 800, px: 1, borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
                        />
                      );
                    })()}
                  </Box>

                  <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", mb: 3 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: "var(--bg-accent-4)" }}>
                          <TableCell sx={{ fontWeight: 700 }} width="50">Claim</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Administrative Role / Responsibility</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} width="220">Level</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} width="300">Remarkable Event / Work Done Details</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ADMINISTRATIVE_ROLES_LIST.map((role) => {
                          const formRole = adminRolesForm[role.id] || { isResponsible: false, level: "Department level", details: "" };
                          return (
                            <TableRow key={role.id}>
                              <TableCell>
                                <Switch
                                  size="small"
                                  checked={formRole.isResponsible}
                                  onChange={(e) => handleToggleResponsibility(role.id, e.target.checked)}
                                  disabled={submittingAdmin}
                                />
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: formRole.isResponsible ? "var(--color-primary)" : "var(--text-primary)" }}>
                                {role.label}
                              </TableCell>
                              <TableCell>
                                {formRole.isResponsible && (
                                  <Select
                                    size="small"
                                    fullWidth
                                    value={formRole.level}
                                    onChange={(e) => handleLevelChange(role.id, e.target.value)}
                                    disabled={submittingAdmin}
                                  >
                                    <MenuItem value="Department level">Department level</MenuItem>
                                    <MenuItem value="Institute / Central level">Institute / Central level</MenuItem>
                                  </Select>
                                )}
                              </TableCell>
                              <TableCell>
                                {formRole.isResponsible && (
                                  <TextField
                                    size="small"
                                    fullWidth
                                    placeholder={role.hasDetails ? "Specify event/activity name *" : "Enter work description"}
                                    value={formRole.details}
                                    onChange={(e) => handleDetailsChange(role.id, e.target.value)}
                                    disabled={submittingAdmin}
                                    required={role.hasDetails}
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="contained"
                      onClick={handleAdminRolesSubmit}
                      disabled={submittingAdmin || (appraisal.status !== "Draft" && appraisal.status !== "Rejected by HOD")}
                      startIcon={<Save />}
                      sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", color: "#fff" }}
                    >
                      {submittingAdmin ? "Saving Roles..." : "Submit Administrative Roles"}
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: Quick Points Scorecard Summary Panel */}
        <Grid item xs={12} lg={3.5}>
          <Card
            sx={{
              position: "sticky",
              top: 24,
              borderRadius: "20px",
              background: "linear-gradient(135deg, var(--bg-accent-4) 0%, var(--bg-panel) 100%)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-premium)"
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1 }}>
                <CardMembership sx={{ color: "var(--color-primary)" }} /> Points Scorecard
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {[
                { label: "1. Teaching & Learning", points: appraisal.teaching.totalClaimed, max: 80 },
                { label: "2. Research Contributions", points: appraisal.research.totalClaimed, max: "N/A" },
                { label: "3. Extension / Value Addition", points: appraisal.valueAddition.totalClaimed, max: "N/A" },
                { label: "4. Administrative Duties", points: appraisal.administration.totalClaimed, max: 20 },
                { label: "HOD Interpersonal Skills", points: appraisal.hodEvaluation?.totalInterpersonalPoints || 0, max: 50 }
              ].map((m, i) => (
                <Box key={i} sx={{ display: "flex", justifyContent: "space-between", py: 1.5, borderBottom: "1px solid var(--border-color)" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-secondary)" }}>{m.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                    {m.points} {m.max !== "N/A" ? `/ ${m.max}` : ""}
                  </Typography>
                </Box>
              ))}

            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
        PaperProps={{
          sx: {
            borderRadius: "20px",
            background: "var(--bg-panel)",
            border: "1px solid var(--border-color)"
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
                      "NPTEL"
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
                        placeholder="e.g. 45"
                      />
                    </Box>
                  </>
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
              <Typography sx={labelStyle}>From Date: *</Typography>
              <TextField
                size="small"
                fullWidth
                type="date"
                value={resUtForm.fromDate}
                onChange={(e) => setResUtForm(p => ({ ...p, fromDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: new Date().toISOString().split("T")[0] }}
              />
            </Box>

            <Box>
              <Typography sx={labelStyle}>To Date: *</Typography>
              <TextField
                size="small"
                fullWidth
                type="date"
                value={resUtForm.toDate}
                onChange={(e) => setResUtForm(p => ({ ...p, toDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: new Date().toISOString().split("T")[0] }}
              />
            </Box>

            <Box>
              <Typography sx={labelStyle}>Duration (Days):</Typography>
              <TextField
                size="small"
                fullWidth
                disabled
                value={resUtForm.duration || ""}
                placeholder="Calculated automatically"
              />
            </Box>

            {resUtForm.activityType?.includes("Resource Person") && (
              <Box>
                <Typography sx={labelStyle}>Number of Sessions Conducted: *</Typography>
                <TextField
                  size="small"
                  fullWidth
                  type="number"
                  value={resUtForm.sessionsConducted}
                  onChange={(e) => setResUtForm(p => ({ ...p, sessionsConducted: e.target.value }))}
                  placeholder="e.g. 3"
                />
              </Box>
            )}

            {resUtForm.activityType?.includes("Participant") && (
              <Box>
                <Typography sx={labelStyle}>Number of Days Participated: *</Typography>
                <TextField
                  size="small"
                  fullWidth
                  type="number"
                  value={resUtForm.daysParticipated}
                  onChange={(e) => setResUtForm(p => ({ ...p, daysParticipated: e.target.value }))}
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
              <FileField
                label={resUtEditingId ? "Upload New Proof (Leave empty to keep existing)" : "Supporting Proof (PDF/Image, Max 500KB) *"}
                name="proof"
                onChange={(e) => setResUtProof(e.target.files[0])}
                error={!resUtProof && !resUtEditingId}
              />
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
            PaperProps={{
              sx: {
                borderRadius: "20px",
                background: "var(--bg-panel)",
                border: "1px solid var(--border-color)"
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
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                        <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Organizing Category</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.organizingInstitutionCategory}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                        <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Location</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.location}</Typography>
                      </Box>
                    </Grid>
                    {data.organizingInstitutionCategory === "MHRD R&D Lab" && (
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                          <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Lab Name</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.labName}</Typography>
                        </Box>
                      </Grid>
                    )}
                    {data.organizingInstitutionCategory === "Govt. University" && (
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                          <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>University Name</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.universityName}</Typography>
                        </Box>
                      </Grid>
                    )}
                    {data.organizingInstitutionCategory === "NIRF Ranked Institute (Below 200)" && (
                      <>
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                            <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Institute Name</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.instituteName}</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                            <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>NIRF Rank</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.nirfRank}</Typography>
                          </Box>
                        </Grid>
                      </>
                    )}
                  </>
                )}

                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                    <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Dates</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>
                      {new Date(data.fromDate).toLocaleDateString("en-IN")} to {new Date(data.toDate).toLocaleDateString("en-IN")}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                    <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Duration</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.duration} Days</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                    <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Status</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={data.status}
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

                {data.sessionsConducted !== undefined && (
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                      <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Sessions Conducted</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.sessionsConducted}</Typography>
                    </Box>
                  </Grid>
                )}

                {data.daysParticipated !== undefined && (
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                      <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Days Participated</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.daysParticipated}</Typography>
                    </Box>
                  </Grid>
                )}

                {data.remarks && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                      <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Remarks</Typography>
                      <Typography variant="body2" sx={{ color: "var(--text-primary)", mt: 0.5 }}>{data.remarks}</Typography>
                    </Box>
                  </Grid>
                )}

                {data.hodComment && (
                  <Grid item xs={12}>
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
        PaperProps={{
          sx: {
            borderRadius: "20px",
            background: "var(--bg-panel)",
            border: "1px solid var(--border-color)"
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
                {CONTRIBUTION_CATEGORIES.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </Box>

            {/* Render fields conditionally based on category selection */}
            {contForm.category && (() => {
              const cat = parseInt(contForm.category);
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
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ max: todayStr }}
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
                      InputLabelProps={{ shrink: true }}
                      inputProps={isFutureAllowed ? {} : { max: todayStr }}
                    />
                  </Box>
                  <Box>
                    <Typography sx={labelStyle}>Auto Duration (Days):</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      disabled
                      value={contForm.duration || ""}
                      placeholder="Calculated automatically"
                    />
                  </Box>
                </>
              );

              switch (cat) {
                case 1:
                  return (
                    <>
                      <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                        <Typography sx={labelStyle}>Organization Name: *</Typography>
                        <TextField size="small" fullWidth value={contForm.organizationName} onChange={(e) => setContForm(p => ({ ...p, organizationName: e.target.value }))} />
                      </Box>
                      {renderDateFields()}
                    </>
                  );
                case 2:
                  return (
                    <>
                      <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                        <Typography sx={labelStyle}>Journal Name (SCIE / Q1 / Q2): *</Typography>
                        <TextField size="small" fullWidth value={contForm.journalName} onChange={(e) => setContForm(p => ({ ...p, journalName: e.target.value }))} />
                      </Box>
                      {renderDateFields()}
                    </>
                  );
                case 3:
                  return (
                    <>
                      <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                        <Typography sx={labelStyle}>Journal / Conference Name: *</Typography>
                        <TextField size="small" fullWidth value={contForm.journalConferenceName} onChange={(e) => setContForm(p => ({ ...p, journalConferenceName: e.target.value }))} />
                      </Box>
                      {renderDateFields()}
                    </>
                  );
                case 4:
                case 5:
                  return (
                    <>
                      <Box>
                        <Typography sx={labelStyle}>Award Name: *</Typography>
                        <TextField size="small" fullWidth value={contForm.awardName} onChange={(e) => setContForm(p => ({ ...p, awardName: e.target.value }))} />
                      </Box>
                      <Box>
                        <Typography sx={labelStyle}>Award Date: *</Typography>
                        <TextField size="small" fullWidth type="date" value={contForm.awardDate} onChange={(e) => setContForm(p => ({ ...p, awardDate: e.target.value }))} InputLabelProps={{ shrink: true }} inputProps={{ max: todayStr }} />
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
                      {renderDateFields()}
                    </>
                  );
                case 8:
                  return (
                    <>
                      <Box>
                        <Typography sx={labelStyle}>Event Name: *</Typography>
                        <TextField size="small" fullWidth value={contForm.eventName} onChange={(e) => setContForm(p => ({ ...p, eventName: e.target.value }))} />
                      </Box>
                      <Box>
                        <Typography sx={labelStyle}>Event Date: *</Typography>
                        <TextField size="small" fullWidth type="date" value={contForm.eventDate} onChange={(e) => setContForm(p => ({ ...p, eventDate: e.target.value }))} InputLabelProps={{ shrink: true }} inputProps={{ max: todayStr }} />
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
                        <TextField size="small" fullWidth type="date" value={contForm.publicationDate} onChange={(e) => setContForm(p => ({ ...p, publicationDate: e.target.value }))} InputLabelProps={{ shrink: true }} inputProps={{ max: todayStr }} />
                      </Box>
                    </>
                  );
                case 10:
                  return (
                    <>
                      <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                        <Typography sx={labelStyle}>Facility Name: *</Typography>
                        <TextField size="small" fullWidth value={contForm.facilityName} onChange={(e) => setContForm(p => ({ ...p, facilityName: e.target.value }))} />
                      </Box>
                      {renderDateFields()}
                    </>
                  );
                case 11:
                  return (
                    <>
                      <Box>
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
                      {renderDateFields()}
                    </>
                  );
                case 13:
                  return (
                    <>
                      <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                        <Typography sx={labelStyle}>Grant Name: *</Typography>
                        <TextField size="small" fullWidth value={contForm.grantName} onChange={(e) => setContForm(p => ({ ...p, grantName: e.target.value }))} />
                      </Box>
                      {renderDateFields()}
                    </>
                  );
                default:
                  return null;
              }
            })()}

            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
              <FileField
                label={contEditingId ? "Upload New Proof (Leave empty to keep existing)" : "Supporting Proof (PDF/Image, Max 500KB) *"}
                name="proof"
                onChange={(e) => setContProof(e.target.files[0])}
                error={!contProof && !contEditingId}
              />
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
        const statusStyle = getStatusColor(data.status);
        const { value } = getContributionNameField(data.category, data);

        const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
        const fileUrl = data.proof ? (data.proof.startsWith('http') ? data.proof : `${backendURL}${data.proof}`) : null;
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(data.proof || "");

        return (
          <Dialog
            open={!!selectedContDetails}
            onClose={() => setSelectedContDetails(null)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: "20px",
                background: "var(--bg-panel)",
                border: "1px solid var(--border-color)"
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
            <DialogContent sx={{ p: 3, mt: 1 }}>
              <Typography variant="subtitle2" color="var(--color-primary)" sx={{ fontWeight: 800, textTransform: "uppercase" }}>
                {getCategoryName(data.category)}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", mb: 2, mt: 0.5 }}>
                {value}
              </Typography>

              <Grid container spacing={2}>
                {[1, 2, 3, 7, 10, 12, 13].includes(data.category) && (
                  <>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                        <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Dates</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>
                          {new Date(data.fromDate).toLocaleDateString("en-IN")} to {new Date(data.toDate).toLocaleDateString("en-IN")}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                        <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Duration</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>{data.duration}</Typography>
                      </Box>
                    </Grid>
                  </>
                )}

                {data.awardDate && (
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                      <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Award Date</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>
                        {new Date(data.awardDate).toLocaleDateString("en-IN")}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {data.eventDate && (
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                      <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Event Date</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>
                        {new Date(data.eventDate).toLocaleDateString("en-IN")}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {data.publicationDate && (
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                      <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Publication Date</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", mt: 0.5 }}>
                        {new Date(data.publicationDate).toLocaleDateString("en-IN")}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {data.url && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                      <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>URL / Reference Link</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                        <a href={data.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", textDecoration: "none" }}>{data.url}</a>
                      </Typography>
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 1.5, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                    <Typography variant="caption" sx={{ color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 800 }}>Status</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={data.status}
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
                  <Grid item xs={12}>
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

    </Box>
  );
};

export default SelfAppraisal;
