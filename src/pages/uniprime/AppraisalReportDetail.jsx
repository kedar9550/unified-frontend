import Loader from "../../components/common/Loader";
import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Alert,
  Chip,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Select,
  MenuItem
} from "@mui/material";
import { RateReview, CheckCircle, Reply, Visibility, OpenInNew, School, Science, CardMembership, Work, Groups, Person, MenuBook, Badge, Description, Public, Fingerprint, Cancel, BarChart, Close, Search } from "@mui/icons-material";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";
import DataTable from "../../components/data/DataTable";
import AppraisalPDFReport from "../../components/pdf/AppraisalPDFReport";

const PARAMETERS = [
  { id: 1, text: "Commitment- Unwavering dedication to student growth and institutional progress, consistently completing all work with diligence." },
  { id: 2, text: "Ownership – Going beyond the assigned task reflects accountability, integrity, and leadership potential by anticipating challenges, taking corrective action without waiting for instructions, and consistently striving for excellence." },
  { id: 3, text: "Development- The commitment to continuous self-improvement and proactively keeping knowledge and skills up-to-date." },
  { id: 4, text: "Initiative- A self-motivated teacher who improves teaching methods and adopts new ideas independently." },
  { id: 5, text: "Responsibility- Understands duties and takes ownership of assigned tasks." },
  { id: 6, text: "Punctuality - Values others’ time by being prompt to classes, assigned duties and completing the tasks." },
  { id: 7, text: "Communication- Engaging in respectful, professional dialogue with students, colleagues, and leadership." },
  { id: 8, text: "Teamwork- Demonstrates effective collaboration and partnership with colleagues." },
  { id: 9, text: "Leadership- Mentors junior faculty, guides students, and leads institutional projects, demonstrating clear direction and active listening skills." },
  { id: 10, text: "Student Mentoring - Demonstrates empathy, approachability, and support for students’ academic and personal development." }
];

const getFacultyCategory = (fac) => {
  if (!fac) return "Non-Doctorate Faculty";
  const doc = (fac.doctorate || "").toLowerCase().trim();
  const lead = (fac.leadership || "").toLowerCase().trim();
  if (doc === "yes" && lead === "no") return "Doctorate Faculty";
  if (lead === "yes") return "Leadership Team";
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
    if (activityCat.includes('conference')) {
      pts = resourceUtConf.conference ?? 10;
    } else if (activityCat.includes('sttp') || activityCat.includes('refresher')) {
      pts = resourceUtConf.sttp ?? 10;
    } else if (activityCat.includes('fdp') || activityCat.includes('symposium')) {
      pts = resourceUtConf.fdp ?? 10;
    } else {
      pts = resourceUtConf.conference ?? 10;
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

  let pts = 5;
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

const AppraisalReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = localStorage.getItem("activeRole") || "";
  const [pendingList, setPendingList] = useState([]);
  const [selectedAppraisal, setSelectedAppraisal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [appraisalConfig, setAppraisalConfig] = useState(null);

  // Evaluation States
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState("");

  // Detailed Section verification remarks
  const [proctoringRemarks, setProctoringRemarks] = useState("");
  const [resUtRemarks, setResUtRemarks] = useState({}); // { itemId: remarks }
  const [contRemarks, setContRemarks] = useState({}); // { itemId: remarks }
  const [adminRemarks, setAdminRemarks] = useState({}); // { roleName: remarks }

  // Details dialog states
  const [selectedResUtDetails, setSelectedResUtDetails] = useState(null);
  const [selectedContDetails, setSelectedContDetails] = useState(null);
  const [dialogComment, setDialogComment] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [searchTerm, setSearchTerm] = useState("");

  // Print Ref
  const printRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Faculty_Appraisal_Report_2025-26",
    pageStyle: `
      @page {
        size: auto;
        margin: 0mm;
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact; 
          margin: 15mm !important; 
        }
      }
    `,
  });

  // Main Appraisal Actions
  const [mainAppraisalRemarks, setMainAppraisalRemarks] = useState("");

  const handleMainHODAction = async (action) => {
    if (action === "Reject" && !mainAppraisalRemarks.trim()) {
      toast.warning("Please provide remarks for rejection.");
      return;
    }
    try {
      const res = await axiosInstance.put(`/api/appraisal/hod-evaluate/${id}`, {
        action,
        comments: mainAppraisalRemarks
      });
      if (res.data?.success) {
        toast.success(`Appraisal ${action === 'Approve' ? 'approved' : 'rejected'} successfully.`);
        fetchDetail();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} appraisal.`);
    }
  };

  // HOD actions on individual sections
  const handleProctoringHODBulkAction = async (action, remarks) => {
    if (action === "Reject" && (!remarks || !remarks.trim())) {
      toast.warning("Please provide a rejection reason/remarks");
      return;
    }
    const facultyId = selectedAppraisal.facultyId?._id || selectedAppraisal.facultyId;
    const academicYear = selectedAppraisal.academicYearId?._id || selectedAppraisal.academicYearId;

    try {
      const res = await axiosInstance.post("/api/faculty-proctoring/hod-action-bulk", {
        facultyId,
        academicYear,
        action,
        remarks
      });
      if (res.data?.success) {
        const actionText = action === "Approve" ? "approved" : "rejected";
        toast.success(`Proctoring entries ${actionText} successfully.`);

        // Update local selectedAppraisal state
        setSelectedAppraisal(prev => {
          const updatedDetail = Array.isArray(prev.proctoringDetail)
            ? prev.proctoringDetail.map(e => e.status === "Pending" || e.status === "Pending at HOD" ? { ...e, status: action === "Approve" ? "Approved" : "Rejected", remarks } : e)
            : prev.proctoringDetail;
          return {
            ...prev,
            proctoringDetail: updatedDetail
          };
        });

        if (action === "Reject") {
          await handleSubmitEvaluation("Reject", `Proctoring entries rejected: ${remarks}`);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update proctoring entries.");
    }
  };

  const handleResUtHODAction = async (id, action, comment) => {
    if (action === "Reject" && (!comment || !comment.trim())) {
      toast.warning("Please provide a rejection reason/remarks");
      return;
    }
    try {
      const res = await axiosInstance.put(`/api/value-addition/resource-utilization/hod-action/${id}`, { action, comment });
      if (res.data?.success) {
        const actionText = action === "Approve" ? "approved" : "rejected";
        toast.success(`Resource Utilization entry ${actionText} successfully.`);
        if (action === "Reject") {
          await handleSubmitEvaluation("Reject", `Resource Utilization entry rejected: ${comment}`);
        } else {
          setSelectedAppraisal(prev => ({
            ...prev,
            resourceUtilizationDetails: prev.resourceUtilizationDetails.map(item =>
              item._id === id ? { ...item, status: "Approved", hodComment: comment } : item
            )
          }));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update entry.");
    }
  };

  const handleContHODAction = async (id, action, comment) => {
    if (action === "Reject" && (!comment || !comment.trim())) {
      toast.warning("Please provide a rejection reason/remarks");
      return;
    }
    try {
      const res = await axiosInstance.put(`/api/value-addition/contribution/hod-action/${id}`, { action, comment });
      if (res.data?.success) {
        const actionText = action === "Approve" ? "approved" : "rejected";
        toast.success(`Expertise / Contribution entry ${actionText} successfully.`);
        if (action === "Reject") {
          await handleSubmitEvaluation("Reject", `Expertise / Contribution entry rejected: ${comment}`);
        } else {
          setSelectedAppraisal(prev => ({
            ...prev,
            contributionDetails: prev.contributionDetails.map(item =>
              item._id === id ? { ...item, status: "Approved", hodComment: comment } : item
            )
          }));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update entry.");
    }
  };

  const handleAdminHODAction = async (id, roleName, action, remarks) => {
    if (action === "Reject" && (!remarks || !remarks.trim())) {
      toast.warning("Please provide a rejection reason/remarks");
      return;
    }
    try {
      const res = await axiosInstance.put(`/api/faculty-administration/hod-action-role/${id}`, { roleName, action, remarks });
      if (res.data?.success) {
        const actionText = action === "Approve" ? "approved" : "rejected";
        toast.success(`Administrative role '${roleName}' ${actionText} successfully.`);
        if (action === "Reject") {
          await handleSubmitEvaluation("Reject", `Administrative role '${roleName}' rejected: ${remarks}`);
        } else {
          setSelectedAppraisal(prev => ({
            ...prev,
            administrationDetail: res.data.data
          }));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update administrative role.");
    }
  };

  const getAppraisalValidationStatus = () => {
    if (!selectedAppraisal) return { hasPending: false, hasRejected: false };

    const hasPendingProctoring = Array.isArray(selectedAppraisal.proctoringDetail)
      ? selectedAppraisal.proctoringDetail.some(item => item.status === "Pending" || item.status === "Pending at HOD")
      : selectedAppraisal.proctoringDetail?.status === "Pending";
    const hasRejectedProctoring = Array.isArray(selectedAppraisal.proctoringDetail)
      ? selectedAppraisal.proctoringDetail.some(item => item.status === "Rejected")
      : selectedAppraisal.proctoringDetail?.status === "Rejected";

    const hasPendingResUt = selectedAppraisal.resourceUtilizationDetails?.some(item => item.status === "Pending" || item.status === "Pending at HOD");
    const hasRejectedResUt = selectedAppraisal.resourceUtilizationDetails?.some(item => item.status === "Rejected");

    const hasPendingCont = selectedAppraisal.contributionDetails?.some(item => item.status === "Pending" || item.status === "Pending at HOD");
    const hasRejectedCont = selectedAppraisal.contributionDetails?.some(item => item.status === "Rejected");

    const hasPendingAdmin = selectedAppraisal.administrationDetail?.roles?.some(role => role.isResponsible && role.status === "Pending");
    const hasRejectedAdmin = selectedAppraisal.administrationDetail?.roles?.some(role => role.isResponsible && role.status === "Rejected");

    const hasPending = hasPendingProctoring || hasPendingResUt || hasPendingCont || hasPendingAdmin;
    const hasRejected = hasRejectedProctoring || hasRejectedResUt || hasRejectedCont || hasRejectedAdmin;

    return { hasPending, hasRejected };
  };

  const getStatusColor = (status) => {
    if (status === 'Approved') return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" };
    if (status === 'Rejected') return { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" };
    if (status === 'Pending at HOD' || status === 'Pending') return { bg: "rgba(232, 160, 0, 0.1)", color: "#e8a000" };
    return { bg: "rgba(100, 116, 139, 0.1)", color: "#64748b" }; // Draft
  };

  const getContCategoryName = (catId) => {
    const categories = {
      1: "Member of BOG / GB / AC / BOS",
      2: "Editorial Board Member (SCIE / Q1 / Q2)",
      3: "Editorial Board Member (ESCI / Q3 / Q4 / Proceedings)",
      4: "Awards (MHRD / AICTE / UGC / State / Top Inst)",
      5: "Awards (NGO / Trust / Others)",
      6: "Developed E-Content",
      7: "Certification on New Age Technologies",
      8: "Students Trained and Shortlisted for Finals",
      9: "Articles Published in Magazine / Newspaper",
      10: "Research Facility Establishment / Maintenance",
      11: "NPTEL Course Completion",
      12: "Coursera Course Completion",
      13: "FDP / Seminar Grant Sanctioned"
    };
    return categories[catId] || `Category ${catId}`;
  };

  const getContDescription = (category, item) => {
    const cat = parseInt(category);
    switch (cat) {
      case 1: return item.organizationName;
      case 2: return item.journalName;
      case 3: return item.journalConferenceName;
      case 4:
      case 5: return item.awardName;
      case 6: return item.courseName;
      case 7: return item.certificationName;
      case 8: return item.eventName;
      case 9: return item.articleTitle;
      case 10: return item.facilityName;
      case 11:
      case 12: return item.courseName;
      case 13: return item.grantName;
      default: return "";
    }
  };


  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/appraisal/detail/${id}`);
      if (res.data && res.data.success) {
        const appr = res.data.data;
        setSelectedAppraisal(appr);
        const initRatings = {};
        if (appr.hodEvaluation?.interpersonalRatings?.length > 0) {
          appr.hodEvaluation.interpersonalRatings.forEach(r => {
            initRatings[r.parameterId] = r.rating;
          });
          setComments(appr.hodEvaluation.comments || "");
        } else {
          PARAMETERS.forEach(p => {
            initRatings[p.id] = ""; // default to empty (no selection)
          });
          setComments("");
        }
        setRatings(initRatings);
        setProctoringRemarks(
          Array.isArray(appr.proctoringDetail)
            ? (appr.proctoringDetail.find(e => e.remarks)?.remarks || "")
            : (appr.proctoringDetail?.remarks || "")
        );
        setResUtRemarks({});
        setContRemarks({});
        setAdminRemarks({});

        const confRes = await axiosInstance.get(`/api/appraisal/config/${appr.academicYearId._id || appr.academicYearId}`);
        if (confRes.data && confRes.data.success) {
          setAppraisalConfig(confRes.data.data);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch appraisal detail.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);


  const handleSelectAppraisal = async (appr) => {
    setSelectedAppraisal(appr);
    const initRatings = {};
    if (appr.hodEvaluation?.interpersonalRatings?.length > 0) {
      appr.hodEvaluation.interpersonalRatings.forEach(r => {
        initRatings[r.parameterId] = r.rating;
      });
      setComments(appr.hodEvaluation.comments || "");
    } else {
      PARAMETERS.forEach(p => {
        initRatings[p.id] = ""; // default to empty (no selection)
      });
      setComments("");
    }
    setRatings(initRatings);
    setProctoringRemarks(
      Array.isArray(appr.proctoringDetail)
        ? (appr.proctoringDetail.find(e => e.remarks)?.remarks || "")
        : (appr.proctoringDetail?.remarks || "")
    );
    setResUtRemarks({});
    setContRemarks({});
    setAdminRemarks({});

    try {
      const res = await axiosInstance.get(`/api/appraisal/config/${appr.academicYearId._id}`);
      if (res.data && res.data.success) {
        setAppraisalConfig(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load config:", err);
    }
  };

  const handleRatingChange = (paramId, score) => {
    setRatings(prev => ({
      ...prev,
      [paramId]: Number(score)
    }));
  };

  const calculateTotalScore = () => {
    let total = 0;
    Object.keys(ratings).forEach(k => {
      total += Number(ratings[k]) || 0;
    });
    return total;
  };

  const handleSubmitEvaluation = async (action, customComment = null) => {
    if (!selectedAppraisal) return;

    const formattedRatings = PARAMETERS.map(p => ({
      parameterId: p.id,
      parameterText: p.text,
      rating: ratings[p.id] || 5
    }));

    const finalComment = customComment || comments || (action === "Approve" ? "Appraisal approved by HOD." : "Appraisal sent back by HOD.");

    setLoading(true);
    try {
      const res = await axiosInstance.put(`/api/appraisal/hod-evaluate/${selectedAppraisal._id}`, {
        interpersonalRatings: formattedRatings,
        comments: finalComment,
        action // 'Approve' or 'Reject'
      });
      if (res.data && res.data.success) {
        toast.dismiss(); // Clear any existing toasts to prevent overlapping
        toast.success(action === "Approve" ? "Appraisal approved and finalized successfully!" : "Appraisal sent back to faculty for corrections.");
        setSelectedAppraisal(null);
        fetchDetail();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process appraisal action.");
    } finally {
      setLoading(false);
    }
  };
  const filteredList = pendingList.filter(appr => {
    if (statusFilter === "Pending") return appr.status === "Submitted to HOD";
    if (statusFilter === "Approved") return appr.status === "Pending Research Admin" || appr.status === "Completed";
    if (statusFilter === "Rejected") return appr.status === "Rejected by HOD";
    return true; // "All"
  });

  // Live calculations for Section 3 & 4 points in HOD Appraisal Evaluation
  const liveResUtilPoints = selectedAppraisal?.resourceUtilizationDetails?.reduce((sum, r) => r.status !== 'Rejected' ? sum + calculateResourceUtilizationPoints(r, appraisalConfig) : sum, 0) || 0;
  const liveContPoints = selectedAppraisal?.contributionDetails?.reduce((sum, r) => r.status !== 'Rejected' ? sum + calculateContributionPoints(r, appraisalConfig) : sum, 0) || 0;
  const liveValueAdditionPoints = Math.min(10, liveResUtilPoints) + Math.min(10, liveContPoints);

  const liveAdminRoles = selectedAppraisal?.administrationDetail?.roles?.filter(r => r.isResponsible) || [];
  const liveAdminPointsRaw = liveAdminRoles.reduce((sum, r) => r.status !== 'Rejected' ? sum + calculateAdministrativePoints(r, appraisalConfig) : sum, 0);
  const liveAdminPoints = Math.min(20, liveAdminPointsRaw);

  // PDF Pre-calculated Data Object
  const calculatedPrintData = selectedAppraisal ? {
    personalInfoSnapshot: selectedAppraisal.personalInfoSnapshot,
    academicYearId: selectedAppraisal.academicYearId,
    status: selectedAppraisal.status,
    hodEvaluation: selectedAppraisal.hodEvaluation,
    facultyCategory: getFacultyCategory(selectedAppraisal.personalInfoSnapshot),
    minimumPoints: appraisalConfig?.minimumPoints,
    teaching: {
      passPercentage: selectedAppraisal.teaching?.passPercentage || {},
      courseFeedback: selectedAppraisal.teaching?.feedback || {},
      proctoring: selectedAppraisal.teaching?.proctoring || {},
      coAttainment: selectedAppraisal.teaching?.coAttainment || {},
      t1: Number(selectedAppraisal.teaching?.passPercentage?.averagePoints || 0),
      t2: Number(selectedAppraisal.teaching?.feedback?.averagePoints || 0),
      t3: Number(selectedAppraisal.teaching?.proctoring?.averagePoints || 0),
      t4: Number(selectedAppraisal.teaching?.coAttainment?.averagePoints || 0),
      teachingTotal: Number(selectedAppraisal.teaching?.totalClaimed || 0)
    },
    research: {
      papers: selectedAppraisal.research?.papers || {},
      phdGuidance: selectedAppraisal.research?.phdGuiding || {},
      booksChapters: selectedAppraisal.research?.booksChapters || {},
      patents: selectedAppraisal.research?.patents || {},
      novelProducts: selectedAppraisal.research?.novelProducts || {},
      projectsConsultancies: selectedAppraisal.research?.projectsConsultancies || {},
      r21: (selectedAppraisal.research?.papers?.items || []).reduce((s, p) => s + (Number(p.pointsClaimed) || 0), 0),
      r22: (selectedAppraisal.research?.phdGuiding?.items || []).reduce((s, p) => s + (Number(p.pointsClaimed) || 0), 0),
      r23: Math.min(10, (selectedAppraisal.research?.booksChapters?.items || []).reduce((s, b) => s + (Number(b.pointsClaimed) || 0), 0)),
      r24: (selectedAppraisal.research?.patents?.items || []).reduce((s, p) => s + (Number(p.pointsClaimed) || 0), 0),
      r25: (selectedAppraisal.research?.novelProducts?.items || []).reduce((s, p) => s + (Number(p.pointsClaimed) || 0), 0),
      r26: (selectedAppraisal.research?.projectsConsultancies?.items || []).reduce((s, p) => s + (Number(p.pointsClaimed) || 0), 0),
      r27: Number(selectedAppraisal.research?.scopusCitationScore || 0),
      r28: Number(selectedAppraisal.research?.scopusHIndexScore || 0),
      researchTotal: Number(selectedAppraisal.research?.totalClaimed || 0)
    },
    valueAddition: {
      resourceUtilization: (selectedAppraisal.resourceUtilizationDetails || []).filter(r => r.status !== 'Rejected').map(r => ({ ...r, pointsClaimed: calculateResourceUtilizationPoints(r, appraisalConfig) })),
      contributions: (selectedAppraisal.contributionDetails || []).filter(r => r.status !== 'Rejected').map(r => ({ ...r, pointsClaimed: calculateContributionPoints(r, appraisalConfig) })),
      valueAdditionTotal: liveValueAdditionPoints
    },
    administrativeResponsibilities: {
      roles: liveAdminRoles.filter(r => r.status !== 'Rejected').map(r => ({ ...r, pointsClaimed: calculateAdministrativePoints(r, appraisalConfig) })),
      adminTotal: liveAdminPoints
    }
  } : null;

  return (
    <Box p={4} sx={{ maxWidth: 1200, margin: "0 auto", animation: "fadeIn 0.5s ease" }}>

      <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, color: "var(--text-primary)" }}> Appraisal Report Details </Typography>

      {!selectedAppraisal ? (
        <Box>
          <Card sx={{ borderRadius: "16px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)", p: 3 }}>
            <Box sx={{ px: 0, pb: 2.5, borderBottom: "1px solid var(--border-color)", mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                Faculty Appraisals List
              </Typography>
            </Box>

            <DataTable
              columns={["FACULTY NAME", "EMPLOYEE ID", "DEPARTMENT", "ACADEMIC YEAR", "STATUS", "ACTION"]}
              rows={filteredList.map((appr) => {
                const displayStatus = appr.status === "Submitted to HOD"
                  ? "Pending"
                  : (appr.status === "Pending Research Admin" || appr.status === "Completed" ? "Approved" : "Rejected");
                const statusColor = getStatusColor(displayStatus === "Pending" ? "Pending at HOD" : displayStatus);
                const name = appr.facultyId?.name || "N/A";
                const empId = appr.facultyId?.institutionId || "N/A";
                const dept = appr.personalInfoSnapshot?.departmentName || "N/A";
                const year = appr.academicYearId?.year || "N/A";

                return [
                  { value: name, display: <Typography sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.88rem" }}>{name}</Typography> },
                  { value: empId, display: <Typography sx={{ fontWeight: 600 }}>{empId}</Typography> },
                  { value: dept, display: dept },
                  { value: year, display: <Typography sx={{ fontWeight: 600 }}>{year}</Typography> },
                  {
                    value: displayStatus,
                    display: (
                      <Chip
                        label={displayStatus === "Pending" ? "Pending at HOD / Dean" : displayStatus === "Pending at HOD" ? "Pending at HOD / Dean" : displayStatus}
                        size="small"
                        sx={{
                          bgcolor: statusColor.bg,
                          color: statusColor.color,
                          fontWeight: 800,
                          borderRadius: "6px"
                        }}
                      />
                    )
                  },
                  {
                    value: "",
                    display: appr.status === "Submitted to HOD" ? (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<RateReview />}
                        onClick={() => handleSelectAppraisal(appr)}
                        color="primary"
                        sx={{ textTransform: "none", fontWeight: 700 }}
                      >
                        Evaluate
                      </Button>
                    ) : (
                      <IconButton
                        onClick={() => handleSelectAppraisal(appr)}
                        color="secondary"
                        size="small"
                        title="View"
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    )
                  }
                ];
              })}
              alignments={["left", "center", "left", "center", "center", "center"]}
              nonSortableColumns={[5]}
              toolbarLeft={(
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, color: "var(--text-secondary)" }}>Status</Typography>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{
                      borderRadius: "10px",
                      background: "var(--bg-paper)",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" }
                    }}
                  >
                    <MenuItem value="Pending">Pending Verification</MenuItem>
                    <MenuItem value="Approved">Approved & Finalized</MenuItem>
                    <MenuItem value="Rejected">Rejected by HOD</MenuItem>
                    <MenuItem value="All">All Requests</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Card>
        </Box>
      ) : (
        <Box sx={{ width: '100%' }}>
          
          <div style={{ display: 'none' }}>
            <AppraisalPDFReport data={calculatedPrintData} ref={printRef} hideInterpersonal={role === "FACULTY"} />
          </div>

          <Grid container spacing={4}>
            {/* Left Column: Full Appraisal Preview (xs={12} lg={7.5}) */}
            <Grid xs={12} lg={role === "FACULTY" ? 12 : 7.5}>
              {/* PART-A: Personal Information */}
              <Card sx={{ borderRadius: "20px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", mb: 4, boxShadow: "var(--shadow-premium)" }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Person sx={{ color: "#e8a000" }} /> PART-A: Personal Information
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {selectedAppraisal.status === "Approved" || selectedAppraisal.status === "Completed" || selectedAppraisal.status === "Pending Research Admin" ? (
                        <Button size="small" variant="contained" onClick={handlePrint} sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#e8a000", color: "#fff", '&:hover': { bgcolor: "#cc8d00" } }}>
                          Download PDF
                        </Button>
                      ) : null}
                      <Button size="small" startIcon={<Reply />} onClick={() => navigate(-1)} sx={{ textTransform: "none", fontWeight: 700 }}>
                        Back to Reports
                      </Button>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ mb: 2.5 }} />
                <Grid container spacing={2}>
                  {[
                    { label: "Name with Emp ID", val: `${selectedAppraisal.personalInfoSnapshot?.name || "N/A"} (${selectedAppraisal.personalInfoSnapshot?.institutionId || "N/A"})`, icon: <Badge fontSize="small" />, iconColor: "#3b82f6" },
                    { label: "Designation & Dept", val: `${selectedAppraisal.personalInfoSnapshot?.designation || "N/A"} - ${selectedAppraisal.personalInfoSnapshot?.departmentName || "N/A"}`, icon: <Work fontSize="small" />, iconColor: "#a855f7" },
                    { label: "Qualification", val: selectedAppraisal.personalInfoSnapshot?.qualification || "N/A", icon: <School fontSize="small" />, iconColor: "#10b981" },
                    { label: "Scopus ID", val: selectedAppraisal.personalInfoSnapshot?.scopusId || "N/A", icon: <Description fontSize="small" />, iconColor: "#e8a000" },
                    { label: "Web of Science ID", val: selectedAppraisal.personalInfoSnapshot?.wosId || "N/A", icon: <Public fontSize="small" />, iconColor: "#f43f5e" },
                    { label: "ORCID ID", val: selectedAppraisal.personalInfoSnapshot?.orcidId || "N/A", icon: <Fingerprint fontSize="small" />, iconColor: "#06b6d4" }
                  ].map((item, idx) => (
                    <Grid xs={12} sm={6} key={idx}>
                      <Box sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1.5, borderRadius: "12px", border: "1px solid var(--border-color)", background: "var(--bg-paper)" }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", color: item.iconColor }}>{item.icon}</Box>
                        <Box>
                          <Typography variant="caption" color="var(--text-secondary)" display="block" sx={{ fontSize: "0.7rem", fontWeight: 700 }}>{item.label}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.85rem" }}>{item.val}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* 1. Teaching & Learning */}
            <Card sx={{ borderRadius: "20px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", mb: 4, boxShadow: "var(--shadow-premium)" }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
                      <MenuBook sx={{ color: "var(--color-primary)" }} /> 1. Teaching & Learning
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, display: "block", ml: 5 }}>
                      Maximum Points: 80
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, bgcolor: "rgba(59, 130, 246, 0.04)", p: "8px 16px", borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.1)" }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>
                        Total Points Earned
                      </Typography>
                      <Box display="flex" alignItems="baseline" gap={0.5}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>
                          {selectedAppraisal.teaching?.totalClaimed || 0}
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
                        value={Math.min(100, Math.round(((selectedAppraisal.teaching?.totalClaimed || 0) / 80) * 100))}
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
                          {Math.min(100, Math.round(((selectedAppraisal.teaching?.totalClaimed || 0) / 80) * 100))}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                {/* 1.1 Theory Pass Percentage Table */}
                {!(selectedAppraisal.status === "Completed" && (!selectedAppraisal.teaching?.passPercentage?.courses || selectedAppraisal.teaching.passPercentage.courses.length === 0)) && (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "var(--color-primary)", display: "block" }}>
                      1.1 Course Average Pass Percentage (Theory only)
                    </Typography>
                    <TableContainer component={Paper} sx={{ mb: 3, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", width: "100%" }}>
                      <Table size="small" sx={{ minWidth: 650, mx: "auto" }}>
                        <TableHead sx={{ background: "var(--gradient-primary)" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Course Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Sem-Branch-Sec</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Appeared</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Passed</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Pass %</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Points claimed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedAppraisal.teaching?.passPercentage?.courses?.length > 0 ? (
                            <>
                              {selectedAppraisal.teaching.passPercentage.courses.map((c, i) => (
                                <TableRow key={i}>
                                  <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.courseName}</TableCell>
                                  <TableCell sx={{ color: "var(--text-primary)" }}>{c.secBranchSem}</TableCell>
                                  <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{c.appeared}</TableCell>
                                  <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{c.passed}</TableCell>
                                  <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{c.percentage}%</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{c.pointsClaimed}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)" }}>
                                <TableCell colSpan={2} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                  <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                    Overall Performance
                                  </Box>
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{selectedAppraisal.teaching.passPercentage.courses.reduce((sum, c) => sum + (Number(c.appeared) || 0), 0)}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{selectedAppraisal.teaching.passPercentage.courses.reduce((sum, c) => sum + (Number(c.passed) || 0), 0)}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>
                                  {(selectedAppraisal.teaching.passPercentage.courses.reduce((sum, c) => sum + (Number(c.appeared) || 0), 0) > 0
                                    ? ((selectedAppraisal.teaching.passPercentage.courses.reduce((sum, c) => sum + (Number(c.passed) || 0), 0) / selectedAppraisal.teaching.passPercentage.courses.reduce((sum, c) => sum + (Number(c.appeared) || 0), 0)) * 100).toFixed(2)
                                    : "0.00")}%
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>{selectedAppraisal.teaching.passPercentage.averagePoints}</TableCell>
                              </TableRow>
                            </>
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} align="center" sx={{ py: 2, color: "var(--text-secondary)", fontStyle: "italic" }}>No theory subjects result found.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                {/* 1.2 Proctoring Students' average Pass percentage */}
                {!(selectedAppraisal.status === "Completed" && (!selectedAppraisal.teaching?.proctoring?.entries || selectedAppraisal.teaching.proctoring.entries.length === 0)) && (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "var(--color-primary)", display: "block" }}>
                      1.2 Proctoring Students' Average Pass Percentage
                    </Typography>
                    <TableContainer component={Paper} sx={{ mb: 2, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", width: "100%" }}>
                      <Table size="small" sx={{ minWidth: 650, mx: "auto" }}>
                        <TableHead sx={{ background: "var(--gradient-primary)" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Program</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Sem/Yr - Branch - Sec</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="right">Total Allotted</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="right">Eligible (A)</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="right">Passed (B)</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="right">Pass % (B/A)</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="right">Points claimed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedAppraisal.teaching?.proctoring?.entries?.length > 0 ? (
                            <>
                              {selectedAppraisal.teaching.proctoring.entries.map((e, i) => {
                                const isYearProg = e.yearNumber !== null && e.yearNumber !== undefined && e.yearNumber !== 0;
                                const semYrBranchSec = isYearProg
                                  ? `YEAR-${e.yearNumber} ${e.branchCode || "—"} - SEC ${e.section}`
                                  : `SEM-${e.semesterNumber} ${e.branchCode || "—"} - SEC ${e.section}`;
                                return (
                                  <TableRow key={i}>
                                    <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{e.programCode || "—"}</TableCell>
                                    <TableCell sx={{ color: "var(--text-primary)" }}>{semYrBranchSec}</TableCell>
                                    <TableCell align="right" sx={{ color: "var(--text-primary)" }}>{e.totalStudents}</TableCell>
                                    <TableCell align="right" sx={{ color: "#8B5CF6", fontWeight: 600 }}>{e.appeared}</TableCell>
                                    <TableCell align="right" sx={{ color: "#10B981", fontWeight: 600 }}>{e.passed}</TableCell>
                                    <TableCell align="right" sx={{ color: "var(--text-primary)" }}>{Number(e.percentage || 0).toFixed(2)}%</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{e.pointsClaimed}</TableCell>
                                  </TableRow>
                                );
                              })}
                              <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)" }}>
                                <TableCell colSpan={2} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                  <Box component="span" sx={{ display: "inline-block", whiteSpace: "nowrap" }}>
                                    Overall Performance (Average Points)
                                  </Box>
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                                  {selectedAppraisal.teaching.proctoring.entries.reduce((sum, e) => sum + (Number(e.totalStudents) || 0), 0)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                                  {selectedAppraisal.teaching.proctoring.entries.reduce((sum, e) => sum + (Number(e.appeared) || 0), 0)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
                                  {selectedAppraisal.teaching.proctoring.entries.reduce((sum, e) => sum + (Number(e.passed) || 0), 0)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>
                                  {(() => {
                                    const totalAppeared = selectedAppraisal.teaching.proctoring.entries.reduce((sum, e) => sum + (Number(e.appeared) || 0), 0);
                                    const totalPassed = selectedAppraisal.teaching.proctoring.entries.reduce((sum, e) => sum + (Number(e.passed) || 0), 0);
                                    return totalAppeared > 0 ? ((totalPassed / totalAppeared) * 100).toFixed(2) : "0.00";
                                  })()}%
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>
                                  {selectedAppraisal.teaching.proctoring.averagePoints}
                                </TableCell>
                              </TableRow>
                            </>
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} align="center" sx={{ py: 2, color: "var(--text-secondary)", fontStyle: "italic" }}>No proctoring entries found.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Inline HOD Actions for Proctoring */}
                    {(() => {
                      const pendingProcEntries = Array.isArray(selectedAppraisal.proctoringDetail)
                        ? selectedAppraisal.proctoringDetail.filter(e => e.status === "Pending" || e.status === "Pending at HOD")
                        : (selectedAppraisal.proctoringDetail?.status === "Pending" || selectedAppraisal.proctoringDetail?.status === "Pending at HOD" ? [selectedAppraisal.proctoringDetail] : []);

                      if (pendingProcEntries.length === 0) {
                        return null;
                      }

                      return (
                        <Box sx={{ p: 2, mb: 3, borderRadius: "10px", background: "var(--bg-paper)", border: "1px solid var(--border-color)" }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                              Proctoring HOD Action Required (Bulk):
                            </Typography>
                            <Chip label="Pending Review" size="small" sx={{ bgcolor: "rgba(232, 160, 0, 0.1)", color: "#e8a000", fontWeight: 800, borderRadius: "6px" }} />
                          </Box>
                          <Box>
                            <TextField
                              size="small"
                              fullWidth
                              placeholder="Provide rejection reason or approval remarks for all pending proctoring entries..."
                              value={proctoringRemarks}
                              onChange={(e) => setProctoringRemarks(e.target.value)}
                              sx={{ mb: 1.5 }}
                            />
                            <Stack direction="row" spacing={2} justifyContent="flex-end">
                              <Button size="small" variant="outlined" color="error" onClick={() => handleProctoringHODBulkAction("Reject", proctoringRemarks)}>Reject All</Button>
                              <Button size="small" variant="contained" color="success" sx={{ color: "#fff" }} onClick={() => handleProctoringHODBulkAction("Approve", proctoringRemarks)}>Approve All</Button>
                            </Stack>
                          </Box>
                        </Box>
                      );
                    })()}
                  </>
                )}

                {/* 1.3 Subject Feedback Table */}
                {!(selectedAppraisal.status === "Completed" && (!selectedAppraisal.teaching?.feedback?.courses || selectedAppraisal.teaching.feedback.courses.length === 0)) && (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "var(--color-primary)", display: "block" }}>
                      1.3 Course Student Feedback Points
                    </Typography>
                    <TableContainer component={Paper} sx={{ mb: 3, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", width: "100%" }}>
                      <Table size="small" sx={{ minWidth: 650, mx: "auto" }}>
                        <TableHead sx={{ background: "var(--gradient-primary)" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Course Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Sem-Branch-Sec</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Total Students</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Given Students</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Feedback %</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Points claimed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedAppraisal.teaching?.feedback?.courses?.length > 0 ? (
                            <>
                              {selectedAppraisal.teaching.feedback.courses.map((c, i) => (
                                <TableRow key={i}>
                                  <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.courseName}</TableCell>
                                  <TableCell sx={{ color: "var(--text-primary)" }}>{c.secBranchSem}</TableCell>
                                  <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{c.totalStudents || c.noOfStudents}</TableCell>
                                  <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{c.givenStudents || ''}</TableCell>
                                  <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{c.feedbackPercentage}%</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{c.pointsClaimed}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)" }}>
                                <TableCell colSpan={2} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                  <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                    Overall Performance
                                  </Box>
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{selectedAppraisal.teaching.feedback.courses.reduce((sum, c) => sum + (Number(c.totalStudents || c.noOfStudents) || 0), 0)}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{selectedAppraisal.teaching.feedback.courses.reduce((sum, c) => sum + (Number(c.givenStudents) || 0), 0)}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>
                                  {(selectedAppraisal.teaching.feedback.courses.length > 0
                                    ? (selectedAppraisal.teaching.feedback.courses.reduce((sum, c) => sum + (Number(c.feedbackPercentage) || 0), 0) / selectedAppraisal.teaching.feedback.courses.length).toFixed(2)
                                    : "0.00")}%
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>{selectedAppraisal.teaching.feedback.averagePoints}</TableCell>
                              </TableRow>
                            </>
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} align="center" sx={{ py: 2, color: "var(--text-secondary)", fontStyle: "italic" }}>No student feedbacks found.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                {/* 1.4 Theory Courses CO Attainment Table */}
                {!(selectedAppraisal.status === "Completed" && (!selectedAppraisal.teaching?.coAttainment?.courses || selectedAppraisal.teaching.coAttainment.courses.length === 0)) && (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "var(--color-primary)", display: "block" }}>
                      1.4 Course CO Attainment Points
                    </Typography>
                    <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", width: "100%", mb: 4 }}>
                      <Table size="small" sx={{ minWidth: 650, mx: "auto" }}>
                        <TableHead sx={{ background: "var(--gradient-primary)" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Course Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Sem-Branch-Sec</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Total COs</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">COs Attained</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Points claimed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedAppraisal.teaching?.coAttainment?.courses?.length > 0 ? (
                            <>
                              {selectedAppraisal.teaching.coAttainment.courses.map((c, i) => (
                                <TableRow key={i}>
                                  <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.courseName}</TableCell>
                                  <TableCell sx={{ color: "var(--text-primary)" }}>{c.secBranchSem}</TableCell>
                                  <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{c.noOfCos}</TableCell>
                                  <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{c.noOfCosAttained}</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{c.pointsClaimed}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)" }}>
                                <TableCell colSpan={2} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                  <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                    Overall Performance
                                  </Box>
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{selectedAppraisal.teaching.coAttainment.courses.reduce((sum, c) => sum + (Number(c.noOfCos) || 0), 0)}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{selectedAppraisal.teaching.coAttainment.courses.reduce((sum, c) => sum + (Number(c.noOfCosAttained) || 0), 0)}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>{selectedAppraisal.teaching.coAttainment.averagePoints}</TableCell>
                              </TableRow>
                            </>
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} align="center" sx={{ py: 2, color: "var(--text-secondary)", fontStyle: "italic" }}>No CO attainment details found.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 2. Research Contributions */}
            <Card sx={{ borderRadius: "20px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", mb: 4, boxShadow: "var(--shadow-premium)" }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Science sx={{ color: "#a855f7" }} /> 2. Research Contributions
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, display: "block", ml: 5 }}>
                      Maximum Points: 80
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, bgcolor: "rgba(168, 85, 247, 0.04)", p: "8px 16px", borderRadius: "12px", border: "1px solid rgba(168, 85, 247, 0.1)" }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>
                        Total Points Earned
                      </Typography>
                      <Box display="flex" alignItems="baseline" gap={0.5}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "#a855f7" }}>
                          {selectedAppraisal.research?.totalClaimed || 0}
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
                        value={Math.min(100, Math.round(((selectedAppraisal.research?.totalClaimed || 0) / 80) * 100))}
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
                          {Math.min(100, Math.round(((selectedAppraisal.research?.totalClaimed || 0) / 80) * 100))}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                {/* 2.1 Journals/Conferences */}
                {!(selectedAppraisal.status === "Completed" && (!selectedAppraisal.research?.papers?.items || selectedAppraisal.research.papers.items.length === 0)) && (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "var(--color-primary)", display: "block" }}>
                      2.1 Journal / Conference Publications
                    </Typography>
                    <TableContainer component={Paper} sx={{ mb: 3, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", width: "100%" }}>
                      <Table size="small" sx={{ minWidth: 800, mx: "auto" }}>
                        <TableHead sx={{ background: "var(--gradient-primary)" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "80px", whiteSpace: "nowrap" }} align="center">S. No</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Title of the paper</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Category</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Impact Factor</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Points claimed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedAppraisal.research?.papers?.items?.length > 0 ? (
                            <>
                              {selectedAppraisal.research.papers.items.map((p, i) => (
                                <TableRow key={i}>
                                  <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{i + 1}</TableCell>
                                  <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.title} {p.doi ? `(DOI: ${p.doi})` : ""}</TableCell>
                                  <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{p.scope}</TableCell>
                                  <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{p.impactFactor ?? 0}</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{p.pointsClaimed}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)" }}>
                                <TableCell colSpan={4} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                  <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                    Self-Assessment Points
                                  </Box>
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>{selectedAppraisal.research.papers.items.reduce((sum, p) => sum + (Number(p.pointsClaimed) || 0), 0)}</TableCell>
                              </TableRow>
                            </>
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} align="center" sx={{ py: 2, color: "var(--text-secondary)", fontStyle: "italic" }}>No approved publications found.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                {/* 2.2 PhD Guiding */}
                {selectedAppraisal.research?.phdGuiding?.items?.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "var(--color-primary)", display: "block" }}>
                      2.2 Guiding Ph. D Scholars
                    </Typography>
                    <TableContainer component={Paper} sx={{ mb: 3, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", width: "100%" }}>
                      <Table size="small" sx={{ minWidth: 800, mx: "auto" }}>
                        <TableHead sx={{ background: "var(--gradient-primary)" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "80px", whiteSpace: "nowrap" }} align="center">S. No</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Name of the Scholar</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>University</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Admission/Award Date</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Status</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Points claimed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedAppraisal.research.phdGuiding.items.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{i + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.name} ({p.scholarType === 'Part-Time' ? 'PT' : 'FT'})</TableCell>
                              <TableCell sx={{ color: "var(--text-primary)" }}>{p.university || "Aditya University"}</TableCell>
                              <TableCell align="center" sx={{ color: "var(--text-primary)" }}>
                                {p.admissionOrAwardDate ? new Date(p.admissionOrAwardDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "—"}
                              </TableCell>
                              <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{p.status}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{p.pointsClaimed}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)" }}>
                            <TableCell colSpan={5} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                              <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                Self-Assessment Points
                              </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>{selectedAppraisal.research.phdGuiding.items.reduce((sum, p) => sum + (Number(p.pointsClaimed) || 0), 0)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                {/* 2.3 Books Chapters */}
                {selectedAppraisal.research?.booksChapters?.items?.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "var(--color-primary)", display: "block" }}>
                      2.3 Books / Chapters (Max 10 pts)
                    </Typography>
                    <TableContainer component={Paper} sx={{ mb: 3, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", width: "100%" }}>
                      <Table size="small" sx={{ minWidth: 800, mx: "auto" }}>
                        <TableHead sx={{ background: "var(--gradient-primary)" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "80px", whiteSpace: "nowrap" }} align="center">S. No</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Details of Books/Chapters published</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Publisher</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Points claimed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedAppraisal.research.booksChapters.items.map((b, i) => (
                            <TableRow key={i}>
                              <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{i + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{b.title}</TableCell>
                              <TableCell sx={{ color: "var(--text-primary)" }}>
                                {b.itemType === 'Textbook' ? 'Book' : b.itemType === 'BookChapter' ? 'Book Chapter' : 'Conference Proceedings'}
                              </TableCell>
                              <TableCell sx={{ color: "var(--text-primary)" }}>{b.publisher || "—"}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{b.pointsClaimed}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)" }}>
                            <TableCell colSpan={4} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                              <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                Self-Assessment Points
                              </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>
                              {Math.min(10, selectedAppraisal.research.booksChapters.items.reduce((sum, b) => sum + (Number(b.pointsClaimed) || 0), 0))}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                {/* 2.4 Patents */}
                {selectedAppraisal.research?.patents?.items?.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "var(--color-primary)", display: "block" }}>
                      2.4 Patents
                    </Typography>
                    <TableContainer component={Paper} sx={{ mb: 3, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", width: "100%" }}>
                      <Table size="small" sx={{ minWidth: 800, mx: "auto" }}>
                        <TableHead sx={{ background: "var(--gradient-primary)" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "80px", whiteSpace: "nowrap" }} align="center">S. No</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Patent Title & Details</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Country</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Points claimed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedAppraisal.research.patents.items.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{i + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.title} - {p.filingNo} - {p.dateOfFiling ? new Date(p.dateOfFiling).toLocaleDateString("en-GB") : ""}</TableCell>
                              <TableCell sx={{ color: "var(--text-primary)" }}>{p.country}</TableCell>
                              <TableCell sx={{ color: "var(--text-primary)" }}>{p.status}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{p.pointsClaimed}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)" }}>
                            <TableCell colSpan={4} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                              <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                Self-Assessment Points
                              </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>{selectedAppraisal.research.patents.items.reduce((sum, p) => sum + (Number(p.pointsClaimed) || 0), 0)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                {/* 2.5 Novel Products */}
                {selectedAppraisal.research?.novelProducts?.items?.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "var(--color-primary)", display: "block" }}>
                      2.5 Novel Products / Technology
                    </Typography>
                    <TableContainer component={Paper} sx={{ mb: 3, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", width: "100%" }}>
                      <Table size="small" sx={{ minWidth: 700, mx: "auto" }}>
                        <TableHead sx={{ background: "var(--gradient-primary)" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "80px", whiteSpace: "nowrap" }} align="center">S. No</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Details of the Product</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Implemented Organization</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Points claimed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedAppraisal.research.novelProducts.items.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{i + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.title} ({p.status})</TableCell>
                              <TableCell sx={{ color: "var(--text-primary)" }}>{p.organizationName}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{p.pointsClaimed}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)" }}>
                            <TableCell colSpan={3} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                              <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                Self-Assessment Points
                              </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>{selectedAppraisal.research.novelProducts.items.reduce((sum, p) => sum + (Number(p.pointsClaimed) || 0), 0)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                {/* 2.6 Projects / Consultancies */}
                {selectedAppraisal.research?.projectsConsultancies?.items?.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "var(--color-primary)", display: "block" }}>
                      2.6 Funded Projects & Consultancies
                    </Typography>
                    <TableContainer component={Paper} sx={{ mb: 3, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", width: "100%" }}>
                      <Table size="small" sx={{ minWidth: 800, mx: "auto" }}>
                        <TableHead sx={{ background: "var(--gradient-primary)" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "80px", whiteSpace: "nowrap" }} align="center">S. No</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Details of the Project/Consultancy</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Funding Agency</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="right">Amount (Lakhs)</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }} align="center">Points claimed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedAppraisal.research.projectsConsultancies.items.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell align="center" sx={{ color: "var(--text-primary)" }}>{i + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.title} ({p.projectType === 'FundedProject' ? 'Project' : 'Consultancy'} - {p.status})</TableCell>
                              <TableCell sx={{ color: "var(--text-primary)" }}>{p.agency || "N/A"}</TableCell>
                              <TableCell align="right" sx={{ color: "var(--text-primary)" }}>{p.amountInLakhs}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{p.pointsClaimed}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)" }}>
                            <TableCell colSpan={4} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                              <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                Self-Assessment Points
                              </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>{selectedAppraisal.research.projectsConsultancies.items.reduce((sum, p) => sum + (Number(p.pointsClaimed) || 0), 0)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                {/* 2.7 & 2.8 — Scopus API Verified Metrics */}
                {(() => {
                  const startYear = selectedAppraisal?.academicYearId?.year ? Number(selectedAppraisal.academicYearId.year.split('-')[0]) : 2025;
                  const citationYear = startYear;
                  const previousHIndexYear = startYear - 1;
                  const currentHIndexYear = startYear;

                  const getStatusChip = (status) => {
                    const chipColor = status === "Approved" ? { bg: "rgba(16,185,129,0.1)", color: "#10b981" } : status === "Rejected" ? { bg: "rgba(239,68,68,0.1)", color: "#ef4444" } : { bg: "rgba(232,160,0,0.1)", color: "#e8a000" };
                    return (
                      <Chip
                        label={status === "Pending" ? "Pending Verification" : status}
                        size="small"
                        sx={{ bgcolor: chipColor.bg, color: chipColor.color, fontWeight: 800, borderRadius: "6px" }}
                      />
                    );
                  };

                  return (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 1 }}>
                        <Description fontSize="small" /> 2.7 Scopus Citations
                      </Typography>

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
                              <TableCell sx={{ color: "var(--text-primary)", fontWeight: 700 }}>{selectedAppraisal.research?.scopusCitations != null ? selectedAppraisal.research.scopusCitations : "—"}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{selectedAppraisal.research?.scopusCitationScore || 0}</TableCell>
                            </TableRow>

                            <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)", "&:hover": { bgcolor: "rgba(0, 78, 146, 0.06) !important" } }}>
                              <TableCell colSpan={3} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                  Total Evaluated Points
                                </Box>
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                                {selectedAppraisal.research?.scopusCitationScore || 0}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, mt: 4, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 1 }}>
                        <Description fontSize="small" /> 2.8 Scopus h-index
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
                                {selectedAppraisal.research?.hIndexPrevYear != null ? selectedAppraisal.research.hIndexPrevYear : "—"}
                              </TableCell>
                              <TableCell sx={{ color: "var(--text-primary)", fontWeight: 700 }}>
                                {selectedAppraisal.research?.hIndexCurrentYear != null ? selectedAppraisal.research.hIndexCurrentYear : "—"}
                              </TableCell>
                              <TableCell sx={{ color: "var(--text-primary)", fontWeight: 700 }}>
                                {selectedAppraisal.research?.hIndexPrevYear != null && selectedAppraisal.research?.hIndexCurrentYear != null ? (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    {selectedAppraisal.research.hIndexCurrentYear - selectedAppraisal.research.hIndexPrevYear > 0 ? (
                                      <Typography component="span" variant="caption" sx={{ color: "#10b981", fontWeight: 800, bgcolor: "rgba(16,185,129,0.1)", px: 1, py: 0.2, borderRadius: "4px" }}>
                                        +{selectedAppraisal.research.hIndexCurrentYear - selectedAppraisal.research.hIndexPrevYear}
                                      </Typography>
                                    ) : (
                                      selectedAppraisal.research.hIndexCurrentYear - selectedAppraisal.research.hIndexPrevYear
                                    )}
                                  </Box>
                                ) : "—"}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>{selectedAppraisal.research?.scopusHIndexScore || 0}</TableCell>
                            </TableRow>

                            <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)", "&:hover": { bgcolor: "rgba(0, 78, 146, 0.06) !important" } }}>
                              <TableCell colSpan={5} sx={{ fontWeight: 800, color: "var(--text-primary)", pl: 2 }}>
                                <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                  Total Evaluated Points
                                </Box>
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                                {selectedAppraisal.research?.scopusHIndexScore || 0}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  );
                })()}
              </CardContent>
            </Card>

            {/* 3. Extension / Value Addition */}
            <Card sx={{ borderRadius: "20px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", mb: 4, boxShadow: "var(--shadow-premium)" }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
                      <CardMembership sx={{ color: "#10b981" }} /> 3. Extension / Value Addition
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, display: "block", ml: 5 }}>
                      Maximum Points: 20
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, bgcolor: "rgba(16, 185, 129, 0.04)", p: "8px 16px", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.1)" }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>
                        Total Points Earned
                      </Typography>
                      <Box display="flex" alignItems="baseline" gap={0.5}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "#10b981" }}>
                          {liveValueAdditionPoints}
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
                        value={Math.min(100, Math.round((liveValueAdditionPoints / 20) * 100))}
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
                          {Math.min(100, Math.round((liveValueAdditionPoints / 20) * 100))}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                {/* 3.1 Resource Utilization */}
                {!(selectedAppraisal.status === "Completed" && (!selectedAppraisal.resourceUtilizationDetails || selectedAppraisal.resourceUtilizationDetails.length === 0)) && (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "var(--color-primary)", display: "block" }}>
                      3.1 Resource Utilization (Max 10 points)
                    </Typography>
                    <TableContainer component={Paper} sx={{ mb: 4, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", width: "100%" }}>
                      <Table size="small" sx={{ minWidth: 800, mx: "auto" }}>
                        <TableHead sx={{ background: "var(--gradient-primary)" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "80px", whiteSpace: "nowrap" }}>S. No</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Details of the Event along with dates</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "120px" }}>Duration</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "180px" }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "130px" }} align="center">Points claimed</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "120px" }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "80px" }} align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedAppraisal.resourceUtilizationDetails && selectedAppraisal.resourceUtilizationDetails.length > 0 ? (
                            <>
                              {selectedAppraisal.resourceUtilizationDetails.map((item, i) => {
                                const statusColor = getStatusColor(item.status);
                                const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
                                const fileUrl = item.proof ? (item.proof.startsWith('http') ? item.proof : `${backendURL}${item.proof}`) : null;
                                const fromDateFormatted = item.fromDate ? new Date(item.fromDate).toLocaleDateString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";
                                const toDateFormatted = item.toDate ? new Date(item.toDate).toLocaleDateString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";

                                return (
                                  <React.Fragment key={item._id || i}>
                                    <TableRow sx={{ "&:hover": { bgcolor: "rgba(0, 0, 0, 0.015)" } }}>
                                      <TableCell sx={{ color: "var(--text-primary)", fontWeight: 600 }}>{i + 1}</TableCell>
                                      <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                        <Box>
                                          <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                                            {item.activityCategory === "FDP" && item.activityType === "FDP Participant" ? item.courseFdpName : item.organizationName}
                                          </Typography>
                                          <Typography variant="caption" color="var(--text-secondary)" sx={{ fontSize: "0.75rem", display: "block", mt: 0.25 }}>
                                            Dates: {fromDateFormatted && toDateFormatted ? `${fromDateFormatted} - ${toDateFormatted}` : ""}
                                          </Typography>
                                          {item.activityCategory === "FDP" && item.activityType === "FDP Participant" && (
                                            <Box sx={{ mt: 0.5, p: 1, borderRadius: "6px", background: "rgba(0,0,0,0.02)", border: "1px dashed var(--border-color)" }}>
                                              <Typography variant="caption" color="var(--text-secondary)" display="block">
                                                Organizing Category: <strong style={{ color: "var(--color-primary)" }}>{item.organizingInstitutionCategory}</strong> | Location: <strong>{item.location}</strong>
                                              </Typography>
                                              {item.organizingInstitutionCategory === "MHRD R&D Lab" && item.labName && (
                                                <Typography variant="caption" color="var(--text-secondary)" display="block">Lab Name: <strong>{item.labName}</strong></Typography>
                                              )}
                                              {item.organizingInstitutionCategory === "Govt. University" && item.universityName && (
                                                <Typography variant="caption" color="var(--text-secondary)" display="block">University Name: <strong>{item.universityName}</strong></Typography>
                                              )}
                                              {item.organizingInstitutionCategory === "NIRF Ranked Institute (Below 200)" && item.instituteName && (
                                                <Typography variant="caption" color="var(--text-secondary)" display="block">Institute Name: <strong>{item.instituteName}</strong> | NIRF Rank: <strong>{item.nirfRank}</strong></Typography>
                                              )}
                                            </Box>
                                          )}
                                          {/* Removed remarks and proof buttons as they are available in eye-icon dialog */}
                                        </Box>
                                      </TableCell>
                                      <TableCell sx={{ color: "var(--text-primary)" }}>{item.duration} Days</TableCell>
                                      <TableCell sx={{ color: "var(--text-primary)" }}>{item.activityType}</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                                        {calculateResourceUtilizationPoints(item, appraisalConfig)}
                                      </TableCell>
                                      <TableCell>
                                        <Chip label={item.status} size="small" sx={{ bgcolor: statusColor.bg, color: statusColor.color, fontWeight: 800, borderRadius: "6px" }} />
                                      </TableCell>
                                      <TableCell align="center">
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() => {
                                            setSelectedResUtDetails(item);
                                            setDialogComment(item.hodComment || "");
                                          }}
                                        >
                                          <Visibility fontSize="small" />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>

                                    {/* Inline Actions Row */}
                                    {(item.status === "Pending" || item.status === "Pending at HOD") ? (
                                      <TableRow sx={{ background: "rgba(232, 160, 0, 0.02)" }}>
                                        <TableCell colSpan={7} sx={{ py: 1.5 }}>
                                          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, alignItems: "flex-start", px: 1 }}>
                                            <TextField
                                              size="small"
                                              fullWidth
                                              placeholder="HOD comments/remarks..."
                                              value={resUtRemarks[item._id] || ""}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setResUtRemarks(p => ({ ...p, [item._id]: val }));
                                              }}
                                            />
                                            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                                              <Button size="small" variant="outlined" color="error" onClick={() => handleResUtHODAction(item._id, "Reject", resUtRemarks[item._id] || "")}>Reject</Button>
                                              <Button size="small" variant="contained" color="success" sx={{ color: "#fff" }} onClick={() => handleResUtHODAction(item._id, "Approve", resUtRemarks[item._id] || "")}>Approve</Button>
                                            </Stack>
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    ) : null}
                                  </React.Fragment>
                                );
                              })}
                              <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)" }}>
                                <TableCell colSpan={4} sx={{ fontWeight: 800, pl: 2, color: "var(--text-primary)" }}>
                                  <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                    Self-Assessment Points (Max:10)
                                  </Box>
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>
                                  {Math.min(10, selectedAppraisal.resourceUtilizationDetails.reduce((sum, r) => r.status !== 'Rejected' ? sum + calculateResourceUtilizationPoints(r, appraisalConfig) : sum, 0))}
                                </TableCell>
                                <TableCell colSpan={2}></TableCell>
                              </TableRow>
                            </>
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} align="center" sx={{ py: 2, color: "var(--text-secondary)", fontStyle: "italic" }}>
                                No resource utilization entries claimed.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                <Divider sx={{ my: 3 }} />

                {/* 3.2 Expertise / Contribution */}
                {!(selectedAppraisal.status === "Completed" && (!selectedAppraisal.contributionDetails || selectedAppraisal.contributionDetails.length === 0)) && (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "var(--color-primary)", display: "block" }}>
                      3.2 Expertise / Contribution (Max 10 points)
                    </Typography>
                    <TableContainer component={Paper} sx={{ mb: 2, borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", width: "100%" }}>
                      <Table size="small" sx={{ minWidth: 800, mx: "auto" }}>
                        <TableHead sx={{ background: "var(--gradient-primary)" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "80px", whiteSpace: "nowrap" }}>S. No</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Details of the Faculty Expertise/Recognition/Contribution</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "130px", whiteSpace: "nowrap" }} align="center">Points claimed</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "120px" }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "80px" }} align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedAppraisal.contributionDetails && selectedAppraisal.contributionDetails.length > 0 ? (
                            <>
                              {selectedAppraisal.contributionDetails.map((item, i) => {
                                const statusColor = getStatusColor(item.status);
                                const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
                                const fileUrl = item.proof ? (item.proof.startsWith('http') ? item.proof : `${backendURL}${item.proof}`) : null;
                                const descText = getContDescription(item.category, item);

                                return (
                                  <React.Fragment key={item._id || i}>
                                    <TableRow sx={{ "&:hover": { bgcolor: "rgba(0, 0, 0, 0.015)" } }}>
                                      <TableCell sx={{ color: "var(--text-primary)", fontWeight: 600 }}>{i + 1}</TableCell>
                                      <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                        <Box>
                                          <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                                            {getContCategoryName(item.category)}
                                          </Typography>
                                          <Typography variant="caption" color="var(--text-secondary)" sx={{ display: "block", mt: 0.25 }}>
                                            Detail: {descText}
                                          </Typography>
                                          {item.duration && <Typography variant="caption" color="var(--text-secondary)" display="block" sx={{ fontSize: "0.7rem" }}>Duration: {item.duration}</Typography>}
                                          {item.fromDate && <Typography variant="caption" color="var(--text-secondary)" display="block" sx={{ fontSize: "0.7rem" }}>Dates: {new Date(item.fromDate).toLocaleDateString("en-IN")} to {new Date(item.toDate).toLocaleDateString("en-IN")}</Typography>}
                                          {item.url && <Typography variant="caption" color="var(--text-secondary)" display="block" sx={{ fontSize: "0.7rem" }}>Link: <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>{item.url}</a></Typography>}
                                          {/* Removed proof button as it is available in eye-icon dialog */}
                                        </Box>
                                      </TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                                        {calculateContributionPoints(item, appraisalConfig)}
                                      </TableCell>
                                      <TableCell>
                                        <Chip label={item.status} size="small" sx={{ bgcolor: statusColor.bg, color: statusColor.color, fontWeight: 800, borderRadius: "6px" }} />
                                      </TableCell>
                                      <TableCell align="center">
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() => {
                                            setSelectedContDetails(item);
                                            setDialogComment(item.hodComment || "");
                                          }}
                                        >
                                          <Visibility fontSize="small" />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>

                                    {/* Inline Actions Row */}
                                    {(item.status === "Pending" || item.status === "Pending at HOD") ? (
                                      <TableRow sx={{ background: "rgba(232, 160, 0, 0.02)" }}>
                                        <TableCell colSpan={5} sx={{ py: 1.5 }}>
                                          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, alignItems: "flex-start", px: 1 }}>
                                            <TextField
                                              size="small"
                                              fullWidth
                                              placeholder="HOD comments/remarks..."
                                              value={contRemarks[item._id] || ""}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setContRemarks(p => ({ ...p, [item._id]: val }));
                                              }}
                                            />
                                            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                                              <Button size="small" variant="outlined" color="error" onClick={() => handleContHODAction(item._id, "Reject", contRemarks[item._id] || "")}>Reject</Button>
                                              <Button size="small" variant="contained" color="success" sx={{ color: "#fff" }} onClick={() => handleContHODAction(item._id, "Approve", contRemarks[item._id] || "")}>Approve</Button>
                                            </Stack>
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    ) : null}
                                  </React.Fragment>
                                );
                              })}
                              <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)" }}>
                                <TableCell colSpan={2} sx={{ fontWeight: 800, pl: 2, color: "var(--text-primary)" }}>
                                  <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                    Self-Assessment Points (Max:10)
                                  </Box>
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>
                                  {Math.min(10, selectedAppraisal.contributionDetails.reduce((sum, r) => r.status !== 'Rejected' ? sum + calculateContributionPoints(r, appraisalConfig) : sum, 0))}
                                </TableCell>
                                <TableCell colSpan={2}></TableCell>
                              </TableRow>
                            </>
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} align="center" sx={{ py: 2, color: "var(--text-secondary)", fontStyle: "italic" }}>
                                No extension / value addition entries claimed.
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

            {/* 4. Administrative Responsibilities */}
            <Card sx={{ borderRadius: "20px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", mb: 4, boxShadow: "var(--shadow-premium)" }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Work sx={{ color: "#f97316" }} /> 4. Administrative Responsibilities
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, display: "block", ml: 5 }}>
                      Maximum Points: 20
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, bgcolor: "rgba(249, 115, 22, 0.04)", p: "8px 16px", borderRadius: "12px", border: "1px solid rgba(249, 115, 22, 0.1)" }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>
                        Total Points Earned
                      </Typography>
                      <Box display="flex" alignItems="baseline" gap={0.5}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "#f97316" }}>
                          {liveAdminPoints}
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
                        value={Math.min(100, Math.round((liveAdminPoints / 20) * 100))}
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
                          {Math.min(100, Math.round((liveAdminPoints / 20) * 100))}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <TableContainer component={Paper} sx={{ borderRadius: "12px", background: "var(--bg-paper)", border: "1px solid var(--border-color)", overflowX: "auto", width: "100%", mb: 4 }}>
                  <Table size="small" sx={{ minWidth: 800, mx: "auto" }}>
                    <TableHead sx={{ background: "var(--gradient-primary)" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "80px", whiteSpace: "nowrap" }}>S. No</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1 }}>Details of the Administrative Responsibility</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "150px" }}>Assigned by</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "130px", whiteSpace: "nowrap" }} align="center">Points claimed</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1, width: "120px" }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedAppraisal.administrationDetail && selectedAppraisal.administrationDetail.roles?.some(r => r.isResponsible) ? (
                        <>
                          {selectedAppraisal.administrationDetail.roles.filter(r => r.isResponsible).map((role, i) => {
                            const statusColor = getStatusColor(role.status);
                            const assignedByText = role.level && (role.level.toLowerCase().includes("central") || role.level.toLowerCase().includes("institute")) ? "Central" : "Dept";

                            return (
                              <React.Fragment key={i}>
                                <TableRow sx={{ "&:hover": { bgcolor: "rgba(0, 0, 0, 0.015)" } }}>
                                  <TableCell sx={{ color: "var(--text-primary)", fontWeight: 600 }}>{i + 1}</TableCell>
                                  <TableCell sx={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{role.roleName}</Typography>
                                      {role.details && <Typography variant="caption" sx={{ color: "var(--text-secondary)", display: "block", mt: 0.25 }}>Details: {role.details}</Typography>}
                                    </Box>
                                  </TableCell>
                                  <TableCell sx={{ color: "var(--text-primary)" }}>{assignedByText}</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 800, color: "var(--color-primary)" }}>
                                    {calculateAdministrativePoints(role, appraisalConfig)}
                                  </TableCell>
                                  <TableCell>
                                    <Chip label={role.status || "Pending"} size="small" sx={{ bgcolor: statusColor.bg, color: statusColor.color, fontWeight: 800, borderRadius: "6px" }} />
                                  </TableCell>
                                </TableRow>

                                {/* Inline Actions Row */}
                                {role.status === "Pending" ? (
                                  <TableRow sx={{ background: "rgba(232, 160, 0, 0.02)" }}>
                                    <TableCell colSpan={5} sx={{ py: 1.5 }}>
                                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, alignItems: "flex-start", px: 1 }}>
                                        <TextField
                                          size="small"
                                          fullWidth
                                          placeholder="HOD comments/remarks..."
                                          value={adminRemarks[role.roleName] || ""}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setAdminRemarks(p => ({ ...p, [role.roleName]: val }));
                                          }}
                                        />
                                        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                                          <Button size="small" variant="outlined" color="error" onClick={() => handleAdminHODAction(selectedAppraisal.administrationDetail._id, role.roleName, "Reject", adminRemarks[role.roleName] || "")}>Reject</Button>
                                          <Button size="small" variant="contained" color="success" sx={{ color: "#fff" }} onClick={() => handleAdminHODAction(selectedAppraisal.administrationDetail._id, role.roleName, "Approve", adminRemarks[role.roleName] || "")}>Approve</Button>
                                        </Stack>
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                ) : null}
                              </React.Fragment>
                            );
                          })}
                          <TableRow sx={{ background: "rgba(0, 78, 146, 0.04)" }}>
                            <TableCell colSpan={3} sx={{ fontWeight: 800, pl: 2, color: "var(--text-primary)" }}>
                              <Box component="span" sx={{ position: "sticky", left: 16, display: "inline-block", whiteSpace: "nowrap" }}>
                                Self-Assessment Points (Max:20)
                              </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>
                              {Math.min(20, selectedAppraisal.administrationDetail.roles.filter(r => r.isResponsible).reduce((sum, r) => r.status !== 'Rejected' ? sum + calculateAdministrativePoints(r, appraisalConfig) : sum, 0))}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </>
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 2, color: "var(--text-secondary)", fontStyle: "italic" }}>
                            No administrative responsibilities declared.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Scorecard & II. Interpersonal Skills (xs={12} lg={4.5}) */}
          {role !== "FACULTY" && (
            <Grid xs={12} lg={4.5}>
              {/* 5. HOD Interpersonal Skills */}
              <Card sx={{ borderRadius: "20px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-premium)" }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Groups sx={{ color: "#3b82f6" }} /> 5. HOD Interpersonal Skills
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, display: "block", ml: 5 }}>
                      Maximum Points: 50
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, bgcolor: "rgba(59, 130, 246, 0.04)", p: "8px 16px", borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.1)" }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>
                        Total Points Earned
                      </Typography>
                      <Box display="flex" alignItems="baseline" gap={0.5}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "#3b82f6" }}>
                          {calculateTotalScore()}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>
                          / 50
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
                        value={Math.min(100, Math.round((calculateTotalScore() / 50) * 100))}
                        size={40}
                        thickness={4}
                        sx={{
                          color: "#3b82f6",
                          position: "absolute",
                          left: 0
                        }}
                      />
                      <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: "absolute", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.7rem" }}>
                          {Math.min(100, Math.round((calculateTotalScore() / 50) * 100))}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                {selectedAppraisal.status === "Submitted to HOD" && (
                  <Typography variant="caption" color="var(--text-secondary)" sx={{ display: "block", mb: 2 }}>
                    Rate the faculty on a 5-point scale (5 - Best, 1 - Poorest) for each parameter.
                  </Typography>
                )}

                <Box sx={{ maxHeight: "450px", overflowY: "auto", position: "relative", pr: 1, mb: 3, display: "flex", flexDirection: "column", gap: 2 }}>
                  {PARAMETERS.map((p) => (
                    <Box
                      key={p.id}
                      sx={{
                        p: selectedAppraisal.status !== "Submitted to HOD" ? 2 : 0,
                        borderRadius: selectedAppraisal.status !== "Submitted to HOD" ? "12px" : "0",
                        background: selectedAppraisal.status !== "Submitted to HOD" ? "var(--bg-paper)" : "transparent",
                        border: selectedAppraisal.status !== "Submitted to HOD" ? "1px solid var(--border-color)" : "none",
                        mb: selectedAppraisal.status !== "Submitted to HOD" ? 0 : 2.5
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700, mb: selectedAppraisal.status !== "Submitted to HOD" ? 1.5 : 0.5, color: "var(--text-primary)", fontSize: "0.85rem", lineHeight: 1.4 }}>
                        {p.id}. {p.text}
                      </Typography>

                      {selectedAppraisal.status !== "Submitted to HOD" ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Chip
                            label={`${ratings[p.id] || 0} Points`}
                            size="small"
                            sx={{
                              bgcolor: "rgba(59, 130, 246, 0.1)",
                              color: "#3b82f6",
                              fontWeight: 800,
                              borderRadius: "6px"
                            }}
                          />
                          <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                            Out of 5
                          </Typography>
                        </Box>
                      ) : (
                        <FormControl component="fieldset">
                          <RadioGroup
                            row
                            value={ratings[p.id] !== undefined && ratings[p.id] !== null ? ratings[p.id] : ""}
                            onChange={(e) => handleRatingChange(p.id, e.target.value)}
                          >
                            {[1, 2, 3, 4, 5].map((val) => (
                              <FormControlLabel
                                key={val}
                                value={val}
                                control={<Radio size="small" />}
                                label={<Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{val}</Typography>}
                                sx={{ mr: 2 }}
                              />
                            ))}
                          </RadioGroup>
                        </FormControl>
                      )}
                    </Box>
                  ))}
                </Box>

                <TextField
                  label="HOD Evaluation Remarks / Comments"
                  multiline
                  rows={2}
                  fullWidth
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  disabled={selectedAppraisal.status !== "Submitted to HOD"}
                  InputProps={{ readOnly: selectedAppraisal.status !== "Submitted to HOD" }}
                  sx={{ mb: 2 }}
                />

                {selectedAppraisal.status !== "Submitted to HOD" ? (
                  <Alert
                    severity={selectedAppraisal.status === "Rejected by HOD" ? "error" : "success"}
                    sx={{ mb: 2, borderRadius: "10px", py: 1 }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {selectedAppraisal.status === "Rejected by HOD"
                        ? `This appraisal was rejected and sent back to the faculty member.`
                        : `This appraisal has been verified and finalized.`}
                    </Typography>
                    {selectedAppraisal.hodEvaluation?.evaluationDate && (
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                        Evaluation Date: {new Date(selectedAppraisal.hodEvaluation.evaluationDate).toLocaleString("en-IN")}
                      </Typography>
                    )}
                  </Alert>
                ) : (
                  (() => {
                    const validationStatus = getAppraisalValidationStatus();
                    const allRatingsProvided = PARAMETERS.every(p => ratings[p.id] !== undefined && ratings[p.id] !== null && ratings[p.id] !== "");
                    return (
                      <>
                        {validationStatus.hasPending && (
                          <Alert severity="warning" sx={{ mb: 2, borderRadius: "10px", py: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>
                              Please approve or reject all pending sections first.
                            </Typography>
                          </Alert>
                        )}
                        {!allRatingsProvided && (
                          <Alert severity="warning" sx={{ mb: 2, borderRadius: "10px", py: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>
                              Please rate all 10 Interpersonal Skills parameters.
                            </Typography>
                          </Alert>
                        )}
                        {validationStatus.hasRejected && (
                          <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", py: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>
                              Some sections have been rejected. Click "Send Back for Corrections" to return the form to the faculty member.
                            </Typography>
                          </Alert>
                        )}
                        <Box display="flex" gap={1.5} justifyContent="flex-end">
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleSubmitEvaluation("Reject")}
                            disabled={loading}
                            sx={{ textTransform: "none", fontWeight: 700 }}
                          >
                            Send Back for Corrections
                          </Button>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CheckCircle />}
                            onClick={() => handleSubmitEvaluation("Approve")}
                            disabled={loading || validationStatus.hasPending || validationStatus.hasRejected || !allRatingsProvided}
                            sx={{ textTransform: "none", fontWeight: 700, color: "#fff" }}
                          >
                            Approve
                          </Button>
                        </Box>
                      </>
                    );
                  })()
                )}
              </CardContent>
            </Card>
          </Grid>
          )}
        </Grid>
        </Box>
      )}

      {/* Resource Utilization Detail View Dialog */}
      <Dialog
        open={Boolean(selectedResUtDetails)}
        onClose={() => setSelectedResUtDetails(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            background: "var(--bg-panel)",
            border: "1px solid var(--border-color)",
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
            Resource Utilization Details
          </Typography>
          <IconButton onClick={() => setSelectedResUtDetails(null)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 2 }}>
          {selectedResUtDetails && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Activity Category</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{selectedResUtDetails.activityCategory}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Role / Activity Type</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{selectedResUtDetails.activityType}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                  {selectedResUtDetails.activityCategory === "FDP" && selectedResUtDetails.activityType === "FDP Participant" ? "Course Name" : "Organization Name"}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                  {selectedResUtDetails.activityCategory === "FDP" && selectedResUtDetails.activityType === "FDP Participant" ? selectedResUtDetails.courseFdpName : selectedResUtDetails.organizationName}
                </Typography>
              </Box>
              <Box display="flex" gap={4}>
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Duration</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{selectedResUtDetails.duration} Days</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Dates</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                    {selectedResUtDetails.fromDate ? new Date(selectedResUtDetails.fromDate).toLocaleDateString("en-IN") : ""} - {selectedResUtDetails.toDate ? new Date(selectedResUtDetails.toDate).toLocaleDateString("en-IN") : ""}
                  </Typography>
                </Box>
              </Box>
              {selectedResUtDetails.activityCategory === "FDP" && selectedResUtDetails.activityType === "FDP Participant" && (
                <>
                  <Box display="flex" gap={4}>
                    <Box>
                      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Organizing Category</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{selectedResUtDetails.organizingInstitutionCategory}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Location</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{selectedResUtDetails.location}</Typography>
                    </Box>
                  </Box>
                  {selectedResUtDetails.labName && (
                    <Box>
                      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Lab Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{selectedResUtDetails.labName}</Typography>
                    </Box>
                  )}
                  {selectedResUtDetails.universityName && (
                    <Box>
                      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>University Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{selectedResUtDetails.universityName}</Typography>
                    </Box>
                  )}
                  {selectedResUtDetails.instituteName && (
                    <Box display="flex" gap={4}>
                      <Box>
                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Institute Name</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{selectedResUtDetails.instituteName}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>NIRF Rank</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{selectedResUtDetails.nirfRank}</Typography>
                      </Box>
                    </Box>
                  )}
                </>
              )}
              {selectedResUtDetails.remarks && (
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Faculty Remarks</Typography>
                  <Typography variant="body2" sx={{ color: "var(--text-primary)", fontStyle: "italic" }}>{selectedResUtDetails.remarks}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Proof Certificate</Typography>
                {selectedResUtDetails.proof ? (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<OpenInNew />}
                    onClick={() => {
                      const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
                      const fileUrl = selectedResUtDetails.proof.startsWith('http') ? selectedResUtDetails.proof : `${backendURL}${selectedResUtDetails.proof}`;
                      window.open(fileUrl, '_blank');
                    }}
                  >
                    Open Certificate
                  </Button>
                ) : (
                  <Typography variant="body2" color="error">No proof uploaded</Typography>
                )}
              </Box>

              <Divider sx={{ my: 1 }} />

              {(selectedResUtDetails.status === "Pending" || selectedResUtDetails.status === "Pending at HOD") ? (
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: "block", mb: 1 }}>HOD Evaluation Action</Typography>
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Enter HOD remarks/comments..."
                    value={dialogComment}
                    onChange={(e) => setDialogComment(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={async () => {
                        await handleResUtHODAction(selectedResUtDetails._id, "Reject", dialogComment);
                        setSelectedResUtDetails(null);
                      }}
                    >
                      Reject Entry
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      sx={{ color: "#fff" }}
                      onClick={async () => {
                        await handleResUtHODAction(selectedResUtDetails._id, "Approve", dialogComment);
                        setSelectedResUtDetails(null);
                      }}
                    >
                      Approve Entry
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: "block" }}>Status</Typography>
                  <Chip
                    label={selectedResUtDetails.status}
                    size="small"
                    sx={{
                      bgcolor: getStatusColor(selectedResUtDetails.status).bg,
                      color: getStatusColor(selectedResUtDetails.status).color,
                      fontWeight: 800,
                      borderRadius: "6px",
                      mt: 0.5,
                      mb: 1
                    }}
                  />
                  {selectedResUtDetails.hodComment && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>HOD Remarks</Typography>
                      <Typography variant="body2" sx={{ color: "var(--text-primary)" }}>{selectedResUtDetails.hodComment}</Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* Expertise / Contribution Detail View Dialog */}
      <Dialog
        open={Boolean(selectedContDetails)}
        onClose={() => setSelectedContDetails(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            background: "var(--bg-panel)",
            border: "1px solid var(--border-color)",
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
            Expertise / Contribution Details
          </Typography>
          <IconButton onClick={() => setSelectedContDetails(null)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 2 }}>
          {selectedContDetails && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Contribution Category</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{getContCategoryName(selectedContDetails.category)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Detail Information</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{getContDescription(selectedContDetails.category, selectedContDetails)}</Typography>
              </Box>
              {selectedContDetails.duration && (
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Duration</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{selectedContDetails.duration}</Typography>
                </Box>
              )}
              {selectedContDetails.fromDate && (
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Dates</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--text-primary)" }}>
                    {new Date(selectedContDetails.fromDate).toLocaleDateString("en-IN")} to {new Date(selectedContDetails.toDate).toLocaleDateString("en-IN")}
                  </Typography>
                </Box>
              )}
              {selectedContDetails.url && (
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Link / URL</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    <a href={selectedContDetails.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                      {selectedContDetails.url}
                    </a>
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Proof Certificate</Typography>
                {selectedContDetails.proof ? (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<OpenInNew />}
                    onClick={() => {
                      const backendURL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
                      const fileUrl = selectedContDetails.proof.startsWith('http') ? selectedContDetails.proof : `${backendURL}${selectedContDetails.proof}`;
                      window.open(fileUrl, '_blank');
                    }}
                  >
                    Open Certificate
                  </Button>
                ) : (
                  <Typography variant="body2" color="error">No proof uploaded</Typography>
                )}
              </Box>

              <Divider sx={{ my: 1 }} />

              {(selectedContDetails.status === "Pending" || selectedContDetails.status === "Pending at HOD") ? (
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: "block", mb: 1 }}>HOD Evaluation Action</Typography>
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Enter HOD remarks/comments..."
                    value={dialogComment}
                    onChange={(e) => setDialogComment(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={async () => {
                        await handleContHODAction(selectedContDetails._id, "Reject", dialogComment);
                        setSelectedContDetails(null);
                      }}
                    >
                      Reject Entry
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      sx={{ color: "#fff" }}
                      onClick={async () => {
                        await handleContHODAction(selectedContDetails._id, "Approve", dialogComment);
                        setSelectedContDetails(null);
                      }}
                    >
                      Approve Entry
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: "block" }}>Status</Typography>
                  <Chip
                    label={selectedContDetails.status}
                    size="small"
                    sx={{
                      bgcolor: getStatusColor(selectedContDetails.status).bg,
                      color: getStatusColor(selectedContDetails.status).color,
                      fontWeight: 800,
                      borderRadius: "6px",
                      mt: 0.5,
                      mb: 1
                    }}
                  />
                  {selectedContDetails.hodComment && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>HOD Remarks</Typography>
                      <Typography variant="body2" sx={{ color: "var(--text-primary)" }}>{selectedContDetails.hodComment}</Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* Main HOD Action Bar */}
      {role === "HOD" && selectedAppraisal?.status === "Submitted to HOD" && (
        <Paper
          elevation={4}
          sx={{
            position: "sticky",
            bottom: 20,
            zIndex: 1000,
            mx: { xs: 2, md: 4 },
            mt: 4,
            p: 3,
            borderRadius: "16px",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            background: "var(--bg-glass)",
            backdropFilter: "blur(20px)",
            display: "flex",
            flexDirection: "column",
            gap: 2
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
            Final HOD Verification
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>
            Ensure you have reviewed all individual sections (Journals, Patents, Duties, etc.) before taking the final action on this appraisal.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Enter final remarks (Required for rejection)..."
            value={mainAppraisalRemarks}
            onChange={(e) => setMainAppraisalRemarks(e.target.value)}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 1 }}>
            <Button
              variant="outlined"
              color="error"
              size="large"
              onClick={() => handleMainHODAction("Reject")}
              sx={{ fontWeight: 700, px: 4 }}
            >
              Reject Appraisal
            </Button>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={() => handleMainHODAction("Approve")}
              sx={{ fontWeight: 700, px: 4, color: "#fff" }}
            >
              Approve Appraisal
            </Button>
          </Box>
        </Paper>
      )}

    </Box>
  );
};

export default AppraisalReportDetail;
