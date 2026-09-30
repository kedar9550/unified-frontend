import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Select,
  MenuItem,
  Menu,
  ListItemIcon,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Tooltip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from "@mui/material";
import {
  ConfirmationNumber as TicketIcon,
  Add as AddIcon,
  History as HistoryIcon,
  PhoneIphone as PhoneIcon,
  CheckCircle as CheckIcon,
  Schedule as ClockIcon,
  UploadFile as UploadIcon,
  Delete as DeleteIcon,
  ExitToApp as LogoutIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  Build as BuildIcon,
  LocationOn as LocationIcon,
  PriorityHigh as PriorityIcon,
  Help as HelpIcon,
  ArrowForward as ArrowForwardIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Close as CloseIcon,
  KeyboardArrowDown,
  Brightness4,
  CalendarTodayOutlined as CalendarIcon,
  PersonOutlineOutlined as AssignedUserIcon,
  GridViewOutlined as CategoryGridIcon,
  Check as StepCheckIcon,
  Send as SendIcon,
  Chat as ChatIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FiberManualRecord as DotIcon,
  Forum as ForumIcon,
  VisibilityOutlined as ViewIcon,
  Visibility,
  Info as InfoIcon
} from "@mui/icons-material";
import StepConnector, { stepConnectorClasses } from "@mui/material/StepConnector";
import { styled } from "@mui/material/styles";
import axios from "axios";
import { toast } from "sonner";
import ThemeToggle from "../../components/common/Themetoggle";
import CustomTabs from "../../components/common/CustomTabs";
import universityLogoGold from "../../assets/Aditya University Gold Logo.png";
import circleLogoWhite from "../../assets/Circle_logo_white.png";
import smallLogoWhite from "../../assets/Small_logo_white.png";
import logoDarkTheme from "../../assets/Logo_Dark_theme.svg";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:9022";

// Dedicated Axios instance for Student Campus Desk (Session Isolated)
const createStudentAPI = () => {
  const token = localStorage.getItem("campus_student_token");
  return axios.create({
    baseURL: BACKEND_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json"
    }
  });
};

const SLA_MAP = {
  CRITICAL: { label: "Critical (< 2h)", color: "#ef4444", bg: "#fef2f2" },
  HIGH: { label: "High (< 4h)", color: "#f97316", bg: "#fff7ed" },
  MEDIUM: { label: "Medium (< 24h)", color: "#3b82f6", bg: "#eff6ff" },
  LOW: { label: "Low (< 72h)", color: "#10b981", bg: "#f0fdf4" }
};

const getStatusBadge = (status) => {
  switch (status) {
    case "OPEN":
      return <Chip label="Open (Waiting)" size="small" sx={{ bgcolor: "#e0f2fe", color: "#0369a1", fontWeight: 700 }} />;
    case "ASSIGNED":
      return <Chip label="Assigned" size="small" sx={{ bgcolor: "#ede9fe", color: "#6d28d9", fontWeight: 700 }} />;
    case "IN_PROGRESS":
      return <Chip label="In Progress" size="small" sx={{ bgcolor: "#fef3c7", color: "#b45309", fontWeight: 700 }} />;
    case "RESOLVED":
      return <Chip label="Resolved" size="small" sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 700 }} />;
    case "CLOSED":
      return <Chip label="Closed" size="small" sx={{ bgcolor: "#f1f5f9", color: "#475569", fontWeight: 700 }} />;
    case "REJECTED":
      return <Chip label="Rejected" size="small" sx={{ bgcolor: "#fee2e2", color: "#b91c1c", fontWeight: 700 }} />;
    default:
      return <Chip label={status} size="small" />;
  }
};

const getTimelineStep = (status) => {
  switch (status) {
    case "OPEN": return 0;
    case "ASSIGNED": return 1;
    case "IN_PROGRESS": return 2;
    case "RESOLVED": return 3;
    case "CLOSED": return 4;
    case "REJECTED": return 0;
    default: return 0;
  }
};

const CustomStepConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 13,
    left: "calc(-50% + 14px)",
    right: "calc(50% + 14px)"
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: "var(--border-color, #e2e8f0)",
    borderRadius: 2
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: "linear-gradient(95deg, #16a34a 0%, #2563eb 100%)"
    }
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: "linear-gradient(95deg, #16a34a 0%, #2563eb 100%)"
    }
  }
}));

function CustomTimelineStepIcon(props) {
  const { active, completed, icon } = props;

  if (completed) {
    return (
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          bgcolor: "#16a34a",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 6px rgba(22, 163, 74, 0.3)"
        }}
      >
        <StepCheckIcon sx={{ fontSize: 17, stroke: "#ffffff", strokeWidth: 1 }} />
      </Box>
    );
  }

  if (active) {
    return (
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          bgcolor: "#2563eb",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "0.82rem",
          boxShadow: "0 2px 8px rgba(37, 99, 235, 0.35)"
        }}
      >
        {icon}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        bgcolor: "#cbd5e1",
        ".dark-mode &": { bgcolor: "#334155" },
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        fontSize: "0.8rem"
      }}
    >
      {icon}
    </Box>
  );
}

const formatTimelineStepDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const day = d.getDate();
  const month = d.toLocaleString("en-IN", { month: "short" });
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? String(hours).padStart(2, "0") : "12";
  return `${day} ${month}, ${hours}:${minutes} ${ampm}`;
};

const formatRaisedOnDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";
  const day = d.getDate();
  const month = d.toLocaleString("en-IN", { month: "short" });
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? String(hours).padStart(2, "0") : "12";
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};

export default function CampusServiceRequest() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.body.classList.contains("dark-mode") ||
      document.documentElement.classList.contains("dark-mode") ||
      localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    const updateTheme = () => {
      const dark = document.body.classList.contains("dark-mode") ||
        document.documentElement.classList.contains("dark-mode") ||
        localStorage.getItem("theme") === "dark";
      setIsDarkMode(dark);
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const handleThemeEvent = (e) => {
      if (e?.detail?.isDark !== undefined) {
        setIsDarkMode(e.detail.isDark);
      } else {
        updateTheme();
      }
    };

    window.addEventListener("themeChanged", handleThemeEvent);
    window.addEventListener("storage", updateTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener("themeChanged", handleThemeEvent);
      window.removeEventListener("storage", updateTheme);
    };
  }, []);

  // Auth state
  const [student, setStudent] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("campus_student_token") || "");
  const [authChecking, setAuthChecking] = useState(true);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const profileOpen = Boolean(profileAnchorEl);

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleProfileClick = (event) => {
    if (profileAnchorEl) {
      handleProfileClose();
    } else {
      setProfileAnchorEl(event.currentTarget);
    }
  };

  // Login flow states
  const [step, setStep] = useState(1); // 1 = Enter Roll No, 2 = Enter OTP
  const [rollNoInput, setRollNoInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpStatus, setOtpStatus] = useState("idle");
  const [maskedMobile, setMaskedMobile] = useState("");
  const [studentNamePreview, setStudentNamePreview] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Dashboard states
  const [activeTab, setActiveTab] = useState(0); // 0 = Raise Ticket, 1 = My Requests
  const [services, setServices] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [metaLoading, setMetaLoading] = useState(false);

  // Ticket Form States
  const [selectedService, setSelectedService] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // My Tickets List
  const [myTickets, setMyTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketFilter, setTicketFilter] = useState("ALL");

  // Feedback Dialog
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedFeedbackTicket, setSelectedFeedbackTicket] = useState(null);
  const [rating, setRating] = useState(5);
  const [satisfaction, setSatisfaction] = useState("Very Satisfied");
  const [feedbackComments, setFeedbackComments] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Ticket Detail View Dialog & Table Pagination
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tableSearchQuery, setTableSearchQuery] = useState("");

  const handleOpenTicketDetail = (ticket) => {
    setSelectedTicketDetail(ticket);
    setDetailOpen(true);
    fetchTicketComments(ticket._id);
  };

  const handleCloseTicketDetail = () => {
    setDetailOpen(false);
    setSelectedTicketDetail(null);
  };

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // Ensure staff/employee sessions and cookies are cleared on mount so the student portal runs in full isolation
  useEffect(() => {
    const clearStaffSessionOnMount = async () => {
      // 1. Remove employee localStorage artifacts if present
      const hadEmployeeUser = localStorage.getItem("user");
      const hadAuthToken = localStorage.getItem("authToken");
      if (hadEmployeeUser || hadAuthToken) {
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        localStorage.removeItem("activeRole");
        localStorage.removeItem("fcmToken");
      }

      // 2. Clear backend HTTP-only staff session cookie
      try {
        await axios.post(
          `${BACKEND_URL}/api/campus-service-request/auth/clear-staff-session`,
          {},
          { withCredentials: true }
        );
      } catch (err) {
        // Silently continue
      }
    };

    clearStaffSessionOnMount();
  }, []);

  // Check saved student session on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("campus_student_token");
      const savedProfile = localStorage.getItem("campus_student_profile");

      if (savedToken && savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setStudent(parsed);
          setToken(savedToken);

          // Verify with backend silently
          const api = axios.create({
            baseURL: BACKEND_URL,
            headers: { Authorization: `Bearer ${savedToken}` }
          });
          const res = await api.get("/api/campus-service-request/auth/me");
          if (res.data.success && res.data.student) {
            setStudent(res.data.student);
            localStorage.setItem("campus_student_profile", JSON.stringify(res.data.student));
          }
        } catch (e) {
          console.warn("[Campus Desk] Stored student token invalid or expired");
          handleLogout();
        }
      }
      setAuthChecking(false);
    };

    initAuth();
  }, []);

  // Fetch Services, Blocks & Tickets when student is logged in
  useEffect(() => {
    if (student && token) {
      fetchMeta();
      fetchMyTickets();
    }
  }, [student, token]);

  const fetchMeta = async () => {
    try {
      setMetaLoading(true);
      const api = createStudentAPI();
      const res = await api.get("/api/campus-service-request/services-and-blocks");
      if (res.data.success) {
        setServices(res.data.data.services || []);
        setBlocks(res.data.data.blocks || []);
      }
    } catch (err) {
      console.error("Error loading services:", err);
      toast.error("Failed to load available services");
    } finally {
      setMetaLoading(false);
    }
  };

  const fetchMyTickets = async () => {
    try {
      setLoadingTickets(true);
      const api = createStudentAPI();
      const res = await api.get("/api/campus-service-request/my-tickets");
      if (res.data.success) {
        setMyTickets(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  // -------------------------------------------------------------
  // Ticket Conversation / Comments Handlers
  // -------------------------------------------------------------
  const [openChatTickets, setOpenChatTickets] = useState({});
  const [ticketComments, setTicketComments] = useState({});
  const [ticketCommentsLoading, setTicketCommentsLoading] = useState({});
  const [newMessages, setNewMessages] = useState({});
  const [sendingComment, setSendingComment] = useState({});

  const fetchTicketComments = async (ticketId) => {
    try {
      setTicketCommentsLoading((prev) => ({ ...prev, [ticketId]: true }));
      const api = createStudentAPI();
      const res = await api.get(`/api/campus-service-request/tickets/${ticketId}/comments`);
      if (res.data.success) {
        setTicketComments((prev) => ({ ...prev, [ticketId]: res.data.data || [] }));
      }
    } catch (err) {
      console.error("Error fetching comments for ticket:", ticketId, err);
    } finally {
      setTicketCommentsLoading((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  const toggleTicketChat = async (ticketId) => {
    const willBeOpen = !openChatTickets[ticketId];
    setOpenChatTickets((prev) => ({ ...prev, [ticketId]: willBeOpen }));
    if (willBeOpen && !ticketComments[ticketId]) {
      fetchTicketComments(ticketId);
    }
  };

  const handleSendTicketComment = async (ticketId, e) => {
    if (e) e.preventDefault();
    const text = (newMessages[ticketId] || "").trim();
    if (!text) return;

    try {
      setSendingComment((prev) => ({ ...prev, [ticketId]: true }));
      const api = createStudentAPI();
      const res = await api.post(`/api/campus-service-request/tickets/${ticketId}/comments`, {
        message: text
      });
      if (res.data.success) {
        setTicketComments((prev) => ({
          ...prev,
          [ticketId]: [...(prev[ticketId] || []), res.data.data]
        }));
        setNewMessages((prev) => ({ ...prev, [ticketId]: "" }));
        toast.success("Comment sent successfully");
      }
    } catch (err) {
      console.error("Error sending comment:", err);
      toast.error(err.response?.data?.message || "Failed to send comment");
    } finally {
      setSendingComment((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  // -------------------------------------------------------------
  // Authentication Handlers (OTP Send & Verify)
  // -------------------------------------------------------------
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanRoll = rollNoInput.trim().toUpperCase();

    if (!cleanRoll) {
      toast.error("Please enter your Student Roll Number");
      return;
    }

    try {
      setOtpSending(true);
      const res = await axios.post(`${BACKEND_URL}/api/campus-service-request/auth/send-otp`, {
        rollno: cleanRoll
      });

      if (res.data.success) {
        setMaskedMobile(res.data.data.maskedMobile);
        setStudentNamePreview(res.data.data.studentname);
        setStep(2);
        setResendTimer(60);
        if (res.data.data.devOtp) {
          setOtpInput(res.data.data.devOtp);
          toast.success(`OTP sent to ${res.data.data.maskedMobile}! (Dev Code: ${res.data.data.devOtp})`, { duration: 6000 });
        } else {
          toast.success(res.data.message || "OTP sent successfully");
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to verify roll number. Please check university records.";
      toast.error(msg, { duration: 6000 });
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanRoll = rollNoInput.trim().toUpperCase();
    const cleanOtp = otpInput.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    try {
      setOtpVerifying(true);
      setOtpStatus("idle");
      const res = await axios.post(`${BACKEND_URL}/api/campus-service-request/auth/verify-otp`, {
        rollno: cleanRoll,
        otp: cleanOtp
      });

      if (res.data.success && res.data.token) {
        setOtpStatus("success");
        const receivedToken = res.data.token;
        const receivedStudent = res.data.student;

        // Briefly show success state before proceeding
        setTimeout(() => {
          localStorage.removeItem("user");
          localStorage.removeItem("authToken");
          localStorage.removeItem("activeRole");
          localStorage.removeItem("fcmToken");

          localStorage.setItem("campus_student_token", receivedToken);
          localStorage.setItem("campus_student_profile", JSON.stringify(receivedStudent));

          setToken(receivedToken);
          setStudent(receivedStudent);
          toast.success(`Welcome, ${receivedStudent.studentname}!`);
        }, 800);
      }
    } catch (err) {
      setOtpStatus("error");
      setTimeout(() => {
        setOtpInput("");
        setOtpStatus("idle");
        document.getElementById(`otp-input-0`)?.focus();
      }, 500);
      const msg = err.response?.data?.message || "Invalid or expired OTP. Please try again.";
      toast.error(msg);
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("campus_student_token");
    localStorage.removeItem("campus_student_profile");
    setStudent(null);
    setToken("");
    setStep(1);
    setRollNoInput("");
    setOtpInput("");
    setMyTickets([]);
    toast.info("Logged out from Campus Service Desk");
  };

  // -------------------------------------------------------------
  // Ticket Creation Form Handlers
  // -------------------------------------------------------------
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (attachments.length + selectedFiles.length > 5) {
      toast.error("You can upload a maximum of 5 attachments.");
      return;
    }

    // Check size limit (15MB each)
    for (const f of selectedFiles) {
      if (f.size > 15 * 1024 * 1024) {
        toast.error(`File ${f.name} exceeds the 15MB limit.`);
        return;
      }
    }

    setAttachments([...attachments, ...selectedFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();

    if (!selectedService) {
      toast.error("Please select a Service Category");
      return;
    }

    const serviceObj = services.find((s) => s._id === selectedService);
    if (!serviceObj?.isGlobalService && !selectedBlock) {
      toast.error("Please select your Block / Location for this service");
      return;
    }

    if (!description.trim()) {
      toast.error("Please describe your problem or request");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("service", selectedService);
      formData.append("subcategory", selectedSubcategory);
      if (selectedSubcategory === "Others") {
        formData.append("customSubcategory", customSubcategory);
      }
      if (selectedBlock) {
        formData.append("block", selectedBlock);
      }
      formData.append("priority", priority);
      formData.append("description", description);

      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const api = axios.create({
        baseURL: BACKEND_URL,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      const res = await api.post("/api/campus-service-request/tickets", formData);
      if (res.data.success) {
        toast.success(`Service Request #${res.data.data.ticketNumber} created successfully!`, { duration: 5000 });
        // Reset form
        setSelectedService("");
        setSelectedSubcategory("");
        setCustomSubcategory("");
        setSelectedBlock("");
        setPriority("MEDIUM");
        setDescription("");
        setAttachments([]);
        // Refresh list and switch to My Requests tab
        fetchMyTickets();
        setActiveTab(1);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit service request";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Feedback Submission
  // -------------------------------------------------------------
  const openFeedbackDialog = (ticket) => {
    setSelectedFeedbackTicket(ticket);
    setRating(5);
    setSatisfaction("Very Satisfied");
    setFeedbackComments("");
    setFeedbackOpen(true);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedFeedbackTicket) return;

    try {
      setSubmittingFeedback(true);
      const api = createStudentAPI();
      const res = await api.post(`/api/campus-service-request/tickets/${selectedFeedbackTicket._id}/feedback`, {
        rating,
        satisfaction,
        comments: feedbackComments
      });

      if (res.data.success) {
        toast.success("Thank you! Your feedback has been submitted.");
        setFeedbackOpen(false);
        fetchMyTickets();
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit feedback";
      toast.error(msg);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const selectedServiceObj = services.find((s) => s._id === selectedService);

  // Filter & Search tickets
  const filteredTickets = myTickets.filter((t) => {
    // Tab Status Filter
    if (ticketFilter === "ACTIVE" && !["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(t.status)) return false;
    if (ticketFilter === "RESOLVED" && t.status !== "RESOLVED") return false;
    if (ticketFilter === "CLOSED" && t.status !== "CLOSED") return false;

    // Search Query Filter
    if (tableSearchQuery.trim()) {
      const q = tableSearchQuery.toLowerCase().trim();
      const matchTicketNo = t.ticketNumber?.toLowerCase().includes(q);
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchCategory = t.service?.name?.toLowerCase().includes(q);
      const matchSubcategory = t.subcategory?.toLowerCase().includes(q);
      const matchAssigned = t.assignedTo?.some((a) => a.employee?.name?.toLowerCase().includes(q));
      if (!matchTicketNo && !matchTitle && !matchCategory && !matchSubcategory && !matchAssigned) {
        return false;
      }
    }

    return true;
  });

  const paginatedTickets = filteredTickets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (authChecking) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f8fafc" }}>
        <CircularProgress size={40} sx={{ color: "#2563eb" }} />
      </Box>
    );
  }

  // =============================================================
  // SCREEN 1: OTP LOGIN / VERIFICATION VIEW
  // =============================================================
  if (!student || !token) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          bgcolor: isDarkMode ? "#0f172a" : "#e6f3ffff",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Top Right Theme Toggle */}
        <Box sx={{ position: "absolute", top: { xs: 16, sm: 24 }, right: { xs: 16, sm: 24 }, zIndex: 10 }}>
          <ThemeToggle />
        </Box>

        {/* Left Side: 70% */}
        <Box
          sx={{
            flex: { xs: "1", md: "0 0 70%" },
            width: { xs: "100%", md: "70%" },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 2, sm: 4 },
            color: "var(--text-primary, #1e293b)",
            position: "relative",
            zIndex: 2
          }}
        >
          {/* Header Branding */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", mb: 4 }}>
            <Box
              component="img"
              src="/site-logo.svg"
              alt="Aditya University Logo"
              sx={{ height: 64, mb: .8 }}
            />
            {/* <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.5px", color: isDarkMode ? "#f8fafc" : "#0f172a" }}>
              Aditya University
            </Typography> */}
            <Typography variant="subtitle1" sx={{ color: isDarkMode ? "#94a3b8" : "#64748b", fontWeight: 400, textAlign: "center" }}>
              Campus Service Request & Student Helpdesk
            </Typography>
          </Box>

          {/* Auth Card */}
          <Card
            sx={{
              width: "100%",
              maxWidth: 440,
              borderRadius: "20px",
              bgcolor: "var(--bg-paper, #ffffff)",
              color: "var(--text-primary, #1e293b)",
              border: "1px solid var(--border-color, #e2e8f0)",
              boxShadow: isDarkMode ? "0 25px 50px -12px rgba(0, 0, 0, 0.7)" : "0 25px 50px -12px rgba(0, 0, 0, 0.12)",
              overflow: "hidden"
            }}
          >
            <Box sx={{ p: 3, bgcolor: "var(--bg-panel, #f8fafc)", borderBottom: "1px solid var(--border-color, #e2e8f0)" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>
                {step === 1 ? "Student Verification" : "Enter Verification Code"}
              </Typography>
              <Typography variant="body2" sx={{ color: "var(--text-secondary, #64748b)", mt: 0.5 }}>
                {step === 1
                  ? "Enter your University Roll Number to receive OTP."
                  : `6-digit OTP sent to ${maskedMobile}`}
              </Typography>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {step === 1 ? (
                <Box component="form" onSubmit={handleSendOtp} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  <TextField
                    fullWidth
                    label="Student Roll Number"
                    placeholder="e.g. 19A91A0341"
                    value={rollNoInput}
                    onChange={(e) => setRollNoInput(e.target.value.toUpperCase())}
                    autoFocus
                    required
                    slotProps={{
                      input: {
                        startAdornment: <PersonIcon sx={{ color: "#94a3b8", mr: 1 }} />
                      }
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "50px",
                      },
                      "& .MuiInputLabel-root": {
                        ml: 2
                      },
                      "& .MuiOutlinedInput-root legend": {
                        ml: 2
                      }
                    }}
                    helperText="Only active regular students can raise campus service requests."
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={otpSending || !rollNoInput.trim()}
                    sx={{
                      py: 1.5,
                      px: 6,
                      alignSelf: "center",
                      borderRadius: "50px",
                      fontWeight: 400,
                      bgcolor: "var(--gradient-primary)",
                      "&:hover": { bgcolor: "var(--gradient-primary-hover)" }
                    }}
                  >
                    {otpSending ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Send OTP"}
                  </Button>
                </Box>
              ) : (
                <Box component="form" onSubmit={handleVerifyOtp} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  <Box sx={{ p: 2, bgcolor: isDarkMode ? "rgba(59, 130, 246, 0.15)" : "#eff6ff", borderRadius: "10px", border: isDarkMode ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid #bfdbfe" }}>
                    <Typography variant="body2" sx={{ color: isDarkMode ? "#93c5fd" : "#1e40af", fontWeight: 600 }}>
                      Student: {studentNamePreview}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDarkMode ? "#60a5fa" : "#3b82f6" }}>
                      Roll No: {rollNoInput}
                    </Typography>
                  </Box>

                  <style>
                    {`
                      @keyframes shake {
                        10%, 90% { transform: translate3d(-1px, 0, 0); }
                        20%, 80% { transform: translate3d(2px, 0, 0); }
                        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                        40%, 60% { transform: translate3d(4px, 0, 0); }
                      }
                    `}
                  </style>
                  <Box sx={{ display: "flex", gap: { xs: 1, sm: 1.5 }, justifyContent: "center", mb: 2 }}>
                    {[...Array(6)].map((_, index) => (
                      <TextField
                        key={index}
                        id={`otp-input-${index}`}
                        autoFocus={index === 0}
                        value={otpInput[index] || ""}
                        inputProps={{
                          maxLength: 1,
                        }}
                        sx={{
                          width: { xs: 45, sm: 55 },
                          animation: otpStatus === "error" ? "shake 0.5s cubic-bezier(.36,.07,.19,.97) both" : "none",
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "12px",
                            bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#fff",
                            "& fieldset": {
                              borderColor: otpStatus === "success" ? "#16a34a !important" : otpStatus === "error" ? "#dc2626 !important" : undefined,
                              borderWidth: otpStatus !== "idle" ? "2px" : undefined
                            }
                          },
                          "& .MuiInputBase-input": {
                            textAlign: "center",
                            fontSize: "1.5rem",
                            fontWeight: 700,
                            p: 1.5,
                            color: otpStatus === "success" ? "#16a34a" : otpStatus === "error" ? "#dc2626" : "inherit"
                          }
                        }}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          if (val) {
                            const newOtp = otpInput.split("");
                            newOtp[index] = val;
                            setOtpInput(newOtp.join("").slice(0, 6));
                            if (index < 5) {
                              document.getElementById(`otp-input-${index + 1}`).focus();
                            }
                          } else {
                            const newOtp = otpInput.split("");
                            newOtp[index] = "";
                            setOtpInput(newOtp.join(""));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !otpInput[index] && index > 0) {
                            document.getElementById(`otp-input-${index - 1}`).focus();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, 6);
                          if (pastedData) {
                            setOtpInput(pastedData);
                            const nextIndex = Math.min(pastedData.length, 5);
                            document.getElementById(`otp-input-${nextIndex}`)?.focus();
                          }
                        }}
                      />
                    ))}
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={otpVerifying || otpInput.length < 6}
                    sx={{
                      py: 1.5,
                      px: 6,
                      alignSelf: "center",
                      borderRadius: "50px",
                      fontWeight: 700,
                      bgcolor: "#16a34a",
                      "&:hover": { bgcolor: "#15803d" }
                    }}
                  >
                    {otpVerifying ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Verify"}
                  </Button>

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1 }}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => {
                        setStep(1);
                        setOtpInput("");
                      }}
                      sx={{ color: "var(--text-secondary, #64748b)", textTransform: "none" }}
                    >
                      Change Roll Number
                    </Button>

                    <Button
                      variant="text"
                      size="small"
                      disabled={resendTimer > 0 || otpSending}
                      onClick={handleSendOtp}
                      sx={{ color: resendTimer > 0 ? "var(--text-secondary, #94a3b8)" : "#2563eb", fontWeight: 600, textTransform: "none" }}
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Footer Note */}
          <Typography variant="caption" sx={{ color: isDarkMode ? "#94a3b8" : "#64748b", mt: 4, textAlign: "center" }}>
            Campus Service Request System &bull; Aditya University
          </Typography>
        </Box>

        {/* Right Side: 30% */}
        <Box
          sx={{
            flex: { xs: "none", md: "0 0 30%" },
            width: { xs: "100%", md: "30%" },
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}
        >
          <Box
            component="img"
            src={isDarkMode ? "/Circle_Gold.svg" : "/Circle_Orange.svg"}
            alt="University Graphic"
            sx={{
              position: "absolute",
              right: 0,
              top: "50%",
              width: { xs: "400px", md: "800px", lg: "1250px" },
              height: "auto",
              filter: isDarkMode ? "drop-shadow(0 0 40px rgba(190,147,55,0.2))" : "drop-shadow(0 0 40px rgba(249,115,22,0.2))",
              animation: "spinAndStay 60s linear infinite",
              "@keyframes spinAndStay": {
                "0%": { transform: "translate(51%, -50%) rotate(0deg)" },
                "100%": { transform: "translate(51%, -50%) rotate(360deg)" }
              }
            }}
          />
        </Box>
      </Box>
    );
  }

  // =============================================================
  // SCREEN 2: AUTHENTICATED STUDENT SERVICE DESK
  // =============================================================
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "var(--bg-main, #f8fafc)", color: "var(--text-primary, #1e293b)", pb: 8 }}>
      {/* Top Banner & Header */}
      <Box
        sx={{
          background: "var(--gradient-primary, linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%))",
          color: "#ffffff",
          py: 1.5,
          px: { xs: 2, sm: 4 },
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.12)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
        }}
      >
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2
          }}
        >
          {/* Left Section: University Logo + Title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              component="img"
              src={isDarkMode ? smallLogoWhite : universityLogoGold}
              alt="Aditya University Logo"
              sx={{
                display: { xs: "none", sm: "block" },
                height: 48,
                width: "auto",
                objectFit: "contain"
              }}
            />
            <Box
              component="img"
              src={isDarkMode ? circleLogoWhite : logoDarkTheme}
              alt="Aditya University Logo"
              sx={{
                display: { xs: "block", sm: "none" },
                height: 38,
                width: 38,
                objectFit: "contain"
              }}
            />
            <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" }, borderColor: "rgba(255, 255, 255, 0.2)", my: 0.5 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.15, color: "#ffffff", fontSize: { xs: "0.95rem", sm: "1.15rem" } }}>
                Campus Service Desk
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.75)", fontWeight: 500, fontSize: "0.75rem" }}>
                Student Self-Service Portal
              </Typography>
            </Box>
          </Box>

          {/* Right Section: Expanding Profile Pill & Menu (Header.jsx style) */}
          <Box sx={{ display: "flex", alignItems: "center", position: "relative", zIndex: profileOpen ? 1302 : 1 }}>
            <Box
              onClick={handleProfileClick}
              sx={{
                position: "relative",
                zIndex: profileOpen ? 1302 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end", // Anchor avatar to the right
                height: 48,
                borderRadius: "1000px",
                background: profileOpen
                  ? "var(--bg-panel, #ffffff)"
                  : "rgba(255, 255, 255, 0.12)",
                border: profileOpen ? "2px solid transparent" : "1px solid rgba(255, 255, 255, 0.25)",
                backdropFilter: "blur(8px)",
                cursor: "pointer",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: profileOpen ? "0 4px 20px rgba(0,0,0,0.2)" : "none",
                maxWidth: profileOpen ? "400px" : "48px", // Collapsed = perfect circle
                boxSizing: "border-box",
                overflow: "hidden",
                "@media (hover: hover)": {
                  "&:hover": {
                    maxWidth: "400px",
                    background: "var(--bg-panel, #ffffff)",
                    borderColor: "transparent",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.22)"
                  },
                  "&:hover .profile-text-content": {
                    opacity: 1,
                    transform: "translateX(0)"
                  },
                  "&:hover .profile-name-text": {
                    color: "var(--text-primary, #0f172a)"
                  },
                  "&:hover .profile-sub-text": {
                    color: "var(--text-secondary, #64748b)"
                  },
                  "&:hover .profile-arrow-icon": {
                    color: "var(--text-secondary, #64748b)"
                  }
                },
                userSelect: "none",
                p: 0
              }}
            >
              {/* Expanding Details Section */}
              <Box
                className="profile-text-content"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.2,
                  opacity: profileOpen ? 1 : 0,
                  transform: profileOpen ? "translateX(0)" : "translateX(10px)",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  pl: 2,
                  pr: 1,
                  overflow: "hidden",
                  flex: 1,
                  minWidth: 0
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", overflow: "hidden", width: "100%", minWidth: 0 }}>
                  <Typography
                    className="profile-name-text"
                    noWrap
                    sx={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: profileOpen ? "var(--text-primary, #0f172a)" : "#ffffff",
                      lineHeight: 1.1,
                      mb: 0.3,
                      width: "100%",
                      transition: "color 0.3s ease"
                    }}
                  >
                    {student?.studentname || "Student"}
                  </Typography>
                  <Typography
                    className="profile-sub-text"
                    noWrap
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 500,
                      color: profileOpen ? "var(--text-secondary, #64748b)" : "rgba(255, 255, 255, 0.8)",
                      lineHeight: 1,
                      width: "100%",
                      transition: "color 0.3s ease"
                    }}
                  >
                    {student?.branch || student?.coursename || "Student"}
                  </Typography>
                </Box>
                <KeyboardArrowDown
                  className="profile-arrow-icon"
                  sx={{
                    fontSize: 18,
                    color: profileOpen ? "var(--text-secondary, #64748b)" : "rgba(255, 255, 255, 0.8)",
                    transition: "transform 0.3s ease, color 0.3s ease",
                    transform: profileOpen ? "rotate(180deg)" : "none"
                  }}
                />
              </Box>

              {/* Avatar Container */}
              <Box
                sx={{
                  minWidth: 40,
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  background: "var(--gradient-primary, #1e3a8a)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  mr: "3px"
                }}
              >
                <Avatar
                  src={`https://info.aec.edu.in/adityacentral/StudentPhotos/${student?.rollno}.jpg`}
                  alt={student?.studentname}
                  sx={{
                    width: "100%",
                    height: "100%",
                    bgcolor: "transparent",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "0.85rem"
                  }}
                  imgProps={{
                    onError: (e) => {
                      if (!e.target.dataset.triedFallback) {
                        e.target.dataset.triedFallback = "true";
                        e.target.src = `https://info.aec.edu.in/aus/studentphotos/${student?.rollno}.jpg`;
                      }
                    }
                  }}
                >
                  {student?.studentname?.charAt(0) || "S"}
                </Avatar>
              </Box>
            </Box>

            {/* Profile Dropdown Menu */}
            <Menu
              anchorEl={profileAnchorEl}
              open={profileOpen}
              onClose={handleProfileClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right"
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right"
              }}
              slotProps={{
                backdrop: {
                  sx: {
                    backgroundColor: "rgba(15, 23, 42, 0.45)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)"
                  }
                },
                paper: {
                  sx: {
                    zIndex: 1302,
                    mt: 2,
                    width: { xs: "calc(100vw - 32px)", sm: 300 },
                    borderRadius: "20px",
                    p: 2,
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
                    border: "1px solid var(--border-color, #e2e8f0)",
                    bgcolor: "var(--bg-paper, #ffffff)",
                    color: "var(--text-primary, #1e293b)"
                  }
                }
              }}
            >
              {/* Student Details Card */}
              <Box sx={{ p: 1.5, mb: 1.5, bgcolor: "var(--bg-panel, #f8fafc)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>
                  {student?.studentname}
                </Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)", fontWeight: 600, mt: 0.3 }}>
                  Roll No: <Box component="span" sx={{ color: "#0284c7", fontWeight: 700 }}>{student?.rollno}</Box>
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", mt: 0.2 }}>
                  Course: {student?.coursename || "B.Tech"} ({student?.branch || "N/A"})
                </Typography>
              </Box>

              {/* Appearance / Theme Toggle */}
              <MenuItem
                disableRipple
                sx={{
                  borderRadius: "12px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-secondary, #64748b)",
                  py: 1.2,
                  px: 1.5,
                  mb: 1.5,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "var(--bg-panel, #f8fafc)",
                  border: "1px solid var(--border-color, #e2e8f0)",
                  "&:hover": { bgcolor: "var(--bg-panel, #f8fafc)", cursor: "default" }
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Brightness4 fontSize="small" sx={{ color: "var(--text-secondary, #64748b)" }} />
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary, #1e293b)" }}>
                    Appearance
                  </Typography>
                </Box>
                <ThemeToggle onToggle={handleProfileClose} />
              </MenuItem>

              {/* Logout Button */}
              <MenuItem
                onClick={() => {
                  handleProfileClose();
                  handleLogout();
                }}
                sx={{
                  borderRadius: "50px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "#ffffff",
                  py: 1.2,
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0, 78, 146, 0.2)",
                  transition: "all 0.4s ease",
                  position: "relative",
                  background: "transparent",
                  overflow: "hidden",
                  zIndex: 1,

                  "& .blue-bg": {
                    position: "absolute",
                    inset: 0,
                    background: "var(--gradient-primary, linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%))",
                    borderRadius: "50px",
                    zIndex: -3,
                    transition: "opacity 0.4s ease",
                    opacity: 1
                  },

                  "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50px",
                    background: "#fef2f2",
                    zIndex: -2,
                    transition: "opacity 0.4s ease",
                    opacity: 0
                  },

                  "&::after": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50px",
                    padding: "2px",
                    background: "linear-gradient(90deg, #cb2d3e, #ef473a)",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    zIndex: -1,
                    transition: "opacity 0.4s ease",
                    opacity: 0
                  },

                  "&:hover": {
                    color: "#cb2d3e",
                    boxShadow: "0 8px 20px rgba(203, 45, 62, 0.15)",
                    transform: "translateY(-1px)",
                    "& .blue-bg": { opacity: 0 },
                    "&::before": { opacity: 1 },
                    "&::after": { opacity: 1 },
                    "& .MuiListItemIcon-root .MuiSvgIcon-root": { color: "#cb2d3e" }
                  }
                }}
              >
                <Box className="blue-bg" />
                <ListItemIcon sx={{ minWidth: 28, zIndex: 2 }}>
                  <LogoutIcon sx={{ fontSize: 18, color: "#ffffff", transition: "color 0.4s ease" }} />
                </ListItemIcon>
                <Box component="span" sx={{ zIndex: 2, position: "relative" }}>
                  Logout
                </Box>
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Box>

      {/* Main Container */}
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, sm: 4 }, mt: 4 }}>
        {/* Navigation Tabs */}
        <CustomTabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{ mb: 4, mt: 0 }}
          tabs={[
            {
              label: "Raise Service Request",
              icon: <AddIcon />
            },
            {
              label: `My Requests & Live Tracking (${myTickets.length})`,
              icon: <HistoryIcon />
            }
          ]}
        />

        {/* ----------------------------------------------------------- */}
        {/* TAB 1: RAISE SERVICE REQUEST FORM                           */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 0 && (
          <Box sx={{ maxWidth: 880, mx: "auto" }}>
            {/* Form Card */}
            <Card sx={{ borderRadius: "16px", border: "1px solid var(--border-color, #e2e8f0)", bgcolor: "var(--bg-paper, #ffffff)", color: "var(--text-primary, #1e293b)", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary, #0f172a)", mb: 0.5 }}>
                  Submit a New Campus Request
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--text-secondary, #64748b)", mb: 3 }}>
                  Select the appropriate category and describe your issue. Our support team will attend to it promptly.
                </Typography>

                <Box component="form" onSubmit={handleCreateTicket} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* Service Category */}
                  <FormControl fullWidth required>
                    <InputLabel id="service-select-label">Service Category</InputLabel>
                    <Select
                      labelId="service-select-label"
                      label="Service Category"
                      value={selectedService}
                      onChange={(e) => {
                        setSelectedService(e.target.value);
                        setSelectedSubcategory("");
                        setCustomSubcategory("");
                      }}
                    >
                      {services.map((s) => (
                        <MenuItem key={s._id} value={s._id}>
                          {s.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Subcategory (if service has subcategories) */}
                  {selectedServiceObj && selectedServiceObj.subcategories?.length > 0 && (
                    <FormControl fullWidth>
                      <InputLabel id="subcategory-label">Subcategory / Issue Type</InputLabel>
                      <Select
                        labelId="subcategory-label"
                        label="Subcategory / Issue Type"
                        value={selectedSubcategory}
                        onChange={(e) => setSelectedSubcategory(e.target.value)}
                      >
                        {selectedServiceObj.subcategories.map((sub, idx) => (
                          <MenuItem key={idx} value={sub}>
                            {sub}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {/* Custom Subcategory when "Others" is selected */}
                  {selectedSubcategory === "Others" && (
                    <TextField
                      fullWidth
                      label="Please Specify Issue Title"
                      placeholder="e.g. Broken laboratory stool"
                      value={customSubcategory}
                      onChange={(e) => setCustomSubcategory(e.target.value)}
                      required
                    />
                  )}

                  {/* Block / Location Selection */}
                  {selectedServiceObj && !selectedServiceObj.isGlobalService && (
                    <FormControl fullWidth required>
                      <InputLabel id="block-select-label">Campus Block / Hostel / Location</InputLabel>
                      <Select
                        labelId="block-select-label"
                        label="Campus Block / Hostel / Location"
                        value={selectedBlock}
                        onChange={(e) => setSelectedBlock(e.target.value)}
                      >
                        {blocks
                          .filter((b) => {
                            if (selectedServiceObj.applicableBlockType === "HOSTEL") return b.blockType === "HOSTEL";
                            if (selectedServiceObj.applicableBlockType === "ACADEMIC") return b.blockType === "ACADEMIC";
                            return true;
                          })
                          .map((b) => (
                            <MenuItem key={b._id} value={b._id}>
                              {b.blockName} {b.blockType === "HOSTEL" ? `(${b.genderTag === "GIRLS" ? "Girls Hostel" : "Boys Hostel"})` : ""} ({b.blockCode})
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  )}

                  {/* Priority Selector */}
                  <FormControl fullWidth required>
                    <InputLabel id="priority-label">Urgency / Priority</InputLabel>
                    <Select
                      labelId="priority-label"
                      label="Urgency / Priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <MenuItem value="CRITICAL">🔴 Critical - Urgent emergency (Resolution &lt; 2 Hours)</MenuItem>
                      <MenuItem value="HIGH">🟠 High - Immediate attention needed (Resolution &lt; 4 Hours)</MenuItem>
                      <MenuItem value="MEDIUM">🔵 Medium - Standard Request (Resolution &lt; 24 Hours)</MenuItem>
                      <MenuItem value="LOW">🟢 Low - Minor issue (Resolution &lt; 72 Hours)</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Problem Description */}
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={4}
                    label="Detailed Description & Room Number"
                    placeholder="Provide specific details such as Room No, Floor, exact nature of problem, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />

                  {/* File Uploads (Images / Proof) */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155", mb: 1 }}>
                      Attach Photos / Screenshots (Optional, max 5)
                    </Typography>

                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />

                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        textTransform: "none",
                        borderRadius: "10px",
                        borderStyle: "dashed",
                        borderColor: "#cbd5e1",
                        py: 1.5,
                        px: 3,
                        color: "#475569",
                        "&:hover": { borderColor: "#2563eb", bgcolor: "#f8fafc" }
                      }}
                    >
                      Click to Upload Files
                    </Button>

                    {/* Attachment chips */}
                    {attachments.length > 0 && (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                        {attachments.map((file, idx) => (
                          <Chip
                            key={idx}
                            label={`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`}
                            onDelete={() => removeAttachment(idx)}
                            deleteIcon={<DeleteIcon />}
                            sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 600 }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={submitting || metaLoading}
                    sx={{
                      py: 1.8,
                      borderRadius: "12px",
                      fontWeight: 800,
                      bgcolor: "#2563eb",
                      fontSize: "1rem",
                      boxShadow: "0 10px 20px -5px rgba(37, 99, 235, 0.4)",
                      "&:hover": { bgcolor: "#1d4ed8" }
                    }}
                  >
                    {submitting ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "🚀 Submit Service Request"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TAB 2: MY REQUESTS & LIVE TRACKING                          */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 1 && (
          <Box>
            {/* Filter, Search, and Refresh Bar */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                mb: 3
              }}
            >
              {/* Status Filter Chips */}
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {[
                  { key: "ALL", label: "All Requests" },
                  { key: "ACTIVE", label: "Active / In Progress" },
                  { key: "RESOLVED", label: "Resolved" },
                  { key: "CLOSED", label: "Closed" }
                ].map((f) => (
                  <Chip
                    key={f.key}
                    label={f.label}
                    onClick={() => {
                      setTicketFilter(f.key);
                      setPage(0);
                    }}
                    variant={ticketFilter === f.key ? "filled" : "outlined"}
                    color={ticketFilter === f.key ? "primary" : "default"}
                    sx={{ fontWeight: 700, cursor: "pointer" }}
                  />
                ))}
              </Box>

              {/* Search & Refresh */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <TextField
                  size="small"
                  placeholder="Search Ticket #, Title, Category..."
                  value={tableSearchQuery}
                  onChange={(e) => {
                    setTableSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  sx={{
                    width: { xs: "100%", sm: 260 },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      bgcolor: "var(--bg-paper, #ffffff)"
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={fetchMyTickets}
                  disabled={loadingTickets}
                  sx={{ textTransform: "none", borderRadius: "10px", py: 0.9 }}
                >
                  Refresh Status
                </Button>
              </Box>
            </Box>

            {/* Content: Loading / Empty / Table */}
            {loadingTickets ? (
              <Box sx={{ py: 8, textAlign: "center" }}>
                <CircularProgress size={36} sx={{ color: "#2563eb" }} />
                <Typography variant="body2" sx={{ color: "#64748b", mt: 2 }}>
                  Fetching your tickets...
                </Typography>
              </Box>
            ) : filteredTickets.length === 0 ? (
              <Card sx={{ borderRadius: "16px", p: 6, textAlign: "center", border: "1px dashed var(--border-color, #cbd5e1)", bgcolor: "var(--bg-paper, #ffffff)" }}>
                <TicketIcon sx={{ fontSize: 48, color: "#94a3b8", mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--text-primary, #334155)" }}>
                  No Service Requests Found
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--text-secondary, #64748b)", mt: 0.5, mb: 3 }}>
                  {tableSearchQuery ? "No tickets matched your search query." : "You haven't raised any requests in this category yet."}
                </Typography>
                <Button variant="contained" onClick={() => setActiveTab(0)} sx={{ borderRadius: "10px", fontWeight: 700 }}>
                  Raise a Request Now
                </Button>
              </Card>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: "16px",
                  border: "1px solid var(--border-color, #e2e8f0)",
                  bgcolor: "var(--bg-paper, #ffffff)",
                  overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
                }}
              >
                <TableContainer sx={{ overflowX: "auto" }}>
                  <Table size="medium">
                    <TableHead sx={{ background: "var(--gradient-primary, linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%))" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1.8, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                          TICKET #
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1.8, fontSize: "0.82rem", minWidth: 180 }}>
                          ISSUE TITLE
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1.8, fontSize: "0.82rem" }}>
                          CATEGORY
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1.8, fontSize: "0.82rem" }}>
                          ASSIGNED TO
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: "#ffffff", py: 1.8, fontSize: "0.82rem" }}>
                          PRIORITY
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: "#ffffff", py: 1.8, fontSize: "0.82rem" }}>
                          STATUS
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#ffffff", py: 1.8, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                          RAISED ON
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: "#ffffff", py: 1.8, fontSize: "0.82rem" }}>
                          ACTION
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedTickets.map((t) => {
                        const assignedName = t.assignedTo && t.assignedTo.filter((a) => a.status !== "REJECTED").length > 0
                          ? t.assignedTo.filter((a) => a.status !== "REJECTED").map((a) => a.employee?.name).join(", ")
                          : (t.status === "OPEN" ? "Pending Assignment" : "Unassigned");

                        return (
                          <TableRow
                            key={t._id}
                            hover
                            onClick={() => handleOpenTicketDetail(t)}
                            sx={{
                              cursor: "pointer",
                              transition: "background 0.15s ease",
                              "&:hover": {
                                bgcolor: "var(--bg-accent-1, rgba(59, 130, 246, 0.05))"
                              }
                            }}
                          >
                            {/* Ticket Number */}
                            <TableCell sx={{ fontWeight: 700, color: "#2563eb", fontFamily: "monospace", fontSize: "0.85rem", py: 1.8 }}>
                              {t.ticketNumber}
                            </TableCell>

                            {/* Issue Title */}
                            <TableCell sx={{ py: 1.8 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary, #0f172a)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {t.title}
                              </Typography>
                            </TableCell>

                            {/* Category */}
                            <TableCell sx={{ py: 1.8 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--text-primary, #0f172a)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {t.service?.name || "Software"}
                              </Typography>
                            </TableCell>

                            {/* Assigned To */}
                            <TableCell sx={{ py: 1.8 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: "0.82rem",
                                  color: t.assignedTo?.filter((a) => a.status !== "REJECTED").length > 0 ? "#2563eb" : "var(--text-secondary, #64748b)",
                                  maxWidth: 160,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                {assignedName}
                              </Typography>
                            </TableCell>

                            {/* Priority */}
                            <TableCell align="center" sx={{ py: 1.8 }}>
                              <Chip
                                label={t.priority}
                                size="small"
                                sx={{
                                  bgcolor: SLA_MAP[t.priority]?.bg || "#f1f5f9",
                                  color: SLA_MAP[t.priority]?.color || "#334155",
                                  fontWeight: 700,
                                  fontSize: "0.7rem",
                                  height: 24
                                }}
                              />
                            </TableCell>

                            {/* Status */}
                            <TableCell align="center" sx={{ py: 1.8 }}>
                              {getStatusBadge(t.status)}
                            </TableCell>

                            {/* Raised On */}
                            <TableCell sx={{ color: "var(--text-secondary, #64748b)", fontSize: "0.8rem", whiteSpace: "nowrap", py: 1.8 }}>
                              {formatRaisedOnDate(t.createdAt)}
                            </TableCell>

                            {/* Action: Filled View Eye Icon Button */}
                            <TableCell align="center" sx={{ py: 1.8 }}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenTicketDetail(t);
                                  }}
                                  sx={{
                                    bgcolor: "var(--bg-glass, rgba(37, 99, 235, 0.08))",
                                    color: "#2563eb",
                                    "&:hover": {
                                      bgcolor: "#2563eb",
                                      color: "#ffffff"
                                    },
                                    transition: "all 0.2s ease"
                                  }}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Table Pagination */}
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredTickets.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  sx={{
                    borderTop: "1px solid var(--border-color, #e2e8f0)",
                    color: "var(--text-secondary, #64748b)"
                  }}
                />
              </Paper>
            )}
          </Box>
        )}
      </Box>

      {/* ----------------------------------------------------------- */}
      {/* TICKET DETAIL VIEW MODAL (DIALOG)                           */}
      {/* ----------------------------------------------------------- */}
      <Dialog
        open={detailOpen}
        onClose={handleCloseTicketDetail}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "18px",
            bgcolor: "var(--bg-paper, #ffffff)",
            border: "1px solid var(--border-color, #e2e8f0)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            p: { xs: 1, sm: 2 }
          }
        }}
      >
        {selectedTicketDetail && (
          <>
            <DialogTitle
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1.5,
                pb: 1.5,
                borderBottom: "1px solid var(--border-color, #e2e8f0)"
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#2563eb" }}>
                  {selectedTicketDetail.ticketNumber}
                </Typography>
                {getStatusBadge(selectedTicketDetail.status)}
                <Chip
                  label={selectedTicketDetail.priority}
                  size="small"
                  sx={{
                    bgcolor: SLA_MAP[selectedTicketDetail.priority]?.bg || "#f1f5f9",
                    color: SLA_MAP[selectedTicketDetail.priority]?.color || "#334155",
                    fontWeight: 700
                  }}
                />
                {selectedTicketDetail.block && (
                  <Chip
                    icon={<LocationIcon style={{ fontSize: 15 }} />}
                    label={`${selectedTicketDetail.block.blockName} (${selectedTicketDetail.block.blockCode})`}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>

              <IconButton onClick={handleCloseTicketDetail} size="small" sx={{ color: "var(--text-secondary, #64748b)" }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ py: 2.5, px: { xs: 1.5, sm: 2.5 } }}>
              {/* Ticket Title & Description */}
              <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--text-primary, #0f172a)", mb: 0.8 }}>
                {selectedTicketDetail.title}
              </Typography>
              <Typography variant="body2" sx={{ color: "var(--text-secondary, #475569)", mb: 2.5, whiteSpace: "pre-line" }}>
                {selectedTicketDetail.description}
              </Typography>

              {/* 3-Column Metadata Grid */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                  p: { xs: 2, sm: 2.2 },
                  bgcolor: "var(--bg-panel, #f8fafc)",
                  border: "1px solid var(--border-color, #e2e8f0)",
                  borderRadius: "14px",
                  gap: { xs: 2, md: 3 },
                  mb: 3,
                  alignItems: "center"
                }}
              >
                {/* 1. Raised On */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CalendarIcon sx={{ fontSize: 26, color: "var(--text-secondary, #64748b)" }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary, #64748b)", fontSize: "0.75rem", display: "block", mb: 0.2 }}>
                      Raised On
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-primary, #1e293b)", fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {formatRaisedOnDate(selectedTicketDetail.createdAt)}
                    </Typography>
                  </Box>
                </Box>

                {/* 2. Assigned To */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <AssignedUserIcon sx={{ fontSize: 28, color: "var(--text-secondary, #64748b)" }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary, #64748b)", fontSize: "0.75rem", display: "block", mb: 0.2 }}>
                      Assigned To
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: "#2563eb",
                        fontSize: "0.85rem",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {selectedTicketDetail.assignedTo && selectedTicketDetail.assignedTo.filter((a) => a.status !== "REJECTED").length > 0
                        ? selectedTicketDetail.assignedTo.filter((a) => a.status !== "REJECTED").map((a) => a.employee?.name).join(", ")
                        : (selectedTicketDetail.status === "OPEN" ? "Pending Assignment" : "Unassigned")}
                    </Typography>
                  </Box>
                </Box>

                {/* 3. Category */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CategoryGridIcon sx={{ fontSize: 26, color: "var(--text-secondary, #64748b)" }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: "var(--text-secondary, #64748b)", fontSize: "0.75rem", display: "block", mb: 0.2 }}>
                      Category
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--text-primary, #1e293b)", fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {selectedTicketDetail.service?.name || "Software"}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* PROGRESS TIMELINE */}
              <Box sx={{ width: "100%", py: 1.5, mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: "var(--text-secondary, #64748b)",
                    display: "block",
                    mb: 2.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    fontSize: "0.75rem"
                  }}
                >
                  PROGRESS TIMELINE
                </Typography>
                <Stepper
                  activeStep={getTimelineStep(selectedTicketDetail.status)}
                  alternativeLabel
                  connector={<CustomStepConnector />}
                  sx={{ width: "100%" }}
                >
                  {[
                    { label: "Submitted" },
                    { label: "Assigned" },
                    { label: "In Progress" },
                    { label: "Resolved" },
                    { label: "Closed" }
                  ].map((stepObj, index) => {
                    const stepIdx = getTimelineStep(selectedTicketDetail.status);
                    const isCompleted = stepIdx > index || (index === 3 && selectedTicketDetail.status === "CLOSED") || (index === 4 && selectedTicketDetail.status === "CLOSED");
                    const isActive = stepIdx === index && selectedTicketDetail.status !== "CLOSED";

                    let stepDate = null;
                    if (index === 0) {
                      stepDate = formatTimelineStepDate(selectedTicketDetail.createdAt);
                    } else if (index === 1 && stepIdx >= 1) {
                      const assignedTime = selectedTicketDetail.assignedTo?.[0]?.assignedAt || selectedTicketDetail.assignedTo?.[0]?.updatedAt || selectedTicketDetail.updatedAt;
                      stepDate = formatTimelineStepDate(assignedTime);
                    } else if (index === 2 && stepIdx >= 2) {
                      const inProgTime = selectedTicketDetail.assignedTo?.[0]?.updatedAt || selectedTicketDetail.updatedAt;
                      stepDate = formatTimelineStepDate(inProgTime);
                    } else if (index === 3 && stepIdx >= 3) {
                      stepDate = formatTimelineStepDate(selectedTicketDetail.updatedAt);
                    } else if (index === 4 && stepIdx >= 4) {
                      stepDate = formatTimelineStepDate(selectedTicketDetail.closedAt || selectedTicketDetail.updatedAt);
                    }

                    return (
                      <Step key={stepObj.label} completed={isCompleted}>
                        <StepLabel
                          StepIconComponent={(iconProps) => (
                            <CustomTimelineStepIcon
                              {...iconProps}
                              completed={isCompleted}
                              active={isActive}
                              icon={index + 1}
                            />
                          )}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isCompleted || isActive ? 700 : 500,
                              color: isCompleted || isActive
                                ? "var(--text-primary, #0f172a)"
                                : "var(--text-secondary, #64748b)",
                              fontSize: "0.82rem",
                              lineHeight: 1.2
                            }}
                          >
                            {stepObj.label}
                          </Typography>
                          {stepDate && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                color: "var(--text-secondary, #64748b)",
                                fontSize: "0.72rem",
                                mt: 0.4,
                                fontWeight: 500
                              }}
                            >
                              {stepDate}
                            </Typography>
                          )}
                        </StepLabel>
                      </Step>
                    );
                  })}
                </Stepper>
              </Box>

              {/* Live Comments / Discussion in Modal */}
              <Box
                sx={{
                  mt: 2,
                  border: "1px solid var(--border-color, #e2e8f0)",
                  borderRadius: "14px",
                  bgcolor: "var(--bg-panel, #f8fafc)",
                  overflow: "hidden"
                }}
              >
                {/* Chat Header */}
                <Box
                  sx={{
                    p: 1.6,
                    px: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "var(--bg-paper, #ffffff)",
                    borderBottom: "1px solid var(--border-color, #e2e8f0)"
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "8px",
                        bgcolor: selectedTicketDetail.isChatActive && selectedTicketDetail.status !== "CLOSED" && selectedTicketDetail.status !== "REJECTED" ? "rgba(37, 99, 235, 0.1)" : "rgba(100, 116, 139, 0.1)",
                        color: selectedTicketDetail.isChatActive && selectedTicketDetail.status !== "CLOSED" && selectedTicketDetail.status !== "REJECTED" ? "#2563eb" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <ChatIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
                      Comments & Live Discussion
                    </Typography>
                    {selectedTicketDetail.isChatActive && selectedTicketDetail.status !== "CLOSED" && selectedTicketDetail.status !== "REJECTED" ? (
                      <Chip
                        icon={<DotIcon sx={{ fontSize: "10px !important", color: "#16a34a !important" }} />}
                        label="Chat Active"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          bgcolor: "#dcfce7",
                          color: "#15803d",
                          pl: 0.5
                        }}
                      />
                    ) : (
                      <Chip
                        label="Archived"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          bgcolor: "#f1f5f9",
                          color: "#64748b"
                        }}
                      />
                    )}
                  </Box>
                </Box>

                {/* Chat Messages */}
                <Box sx={{ p: 2, bgcolor: "var(--bg-paper, #ffffff)" }}>
                  {ticketCommentsLoading[selectedTicketDetail._id] ? (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4, gap: 1.5 }}>
                      <CircularProgress size={20} />
                      <Typography variant="caption" sx={{ color: "var(--text-secondary, #64748b)" }}>
                        Loading conversation...
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Box
                        sx={{
                          maxHeight: 260,
                          minHeight: 100,
                          overflowY: "auto",
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                          p: 2,
                          mb: 2,
                          borderRadius: "10px",
                          bgcolor: "var(--bg-panel, #f8fafc)",
                          border: "1px solid var(--border-color, #e2e8f0)"
                        }}
                      >
                        {(!ticketComments[selectedTicketDetail._id] || ticketComments[selectedTicketDetail._id].length === 0) ? (
                          <Box sx={{ py: 3, textAlign: "center" }}>
                            <Typography variant="body2" sx={{ color: "var(--text-secondary, #64748b)", fontSize: "0.85rem" }}>
                              💬 No comments yet. Have a question or note for the technician? Start the conversation below!
                            </Typography>
                          </Box>
                        ) : (
                          ticketComments[selectedTicketDetail._id].map((msg, idx) => {
                            const isStudent = msg.senderType === "STUDENT" || !msg.sender;
                            const msgDate = new Date(msg.createdAt).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true
                            });

                            return (
                              <Box
                                key={msg._id || idx}
                                sx={{
                                  display: "flex",
                                  flexDirection: isStudent ? "row-reverse" : "row",
                                  alignItems: "flex-start",
                                  gap: 1.5
                                }}
                              >
                                <Avatar
                                  src={isStudent ? `https://info.aec.edu.in/adityacentral/StudentPhotos/${student?.rollno}.jpg` : undefined}
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: isStudent ? "#2563eb" : "#475569",
                                    color: "#ffffff",
                                    fontSize: "0.8rem",
                                    fontWeight: 700
                                  }}
                                >
                                  {isStudent
                                    ? (student?.studentname?.charAt(0) || "S")
                                    : (msg.sender?.name?.charAt(0) || msg.senderName?.charAt(0) || "T")}
                                </Avatar>

                                <Box
                                  sx={{
                                    maxWidth: "80%",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: isStudent ? "flex-end" : "flex-start"
                                  }}
                                >
                                  <Box
                                    sx={{
                                      p: 1.6,
                                      borderRadius: "12px",
                                      borderTopRightRadius: isStudent ? 0 : "12px",
                                      borderTopLeftRadius: !isStudent ? 0 : "12px",
                                      bgcolor: isStudent ? "#2563eb" : "var(--bg-paper, #ffffff)",
                                      border: isStudent ? "none" : "1px solid var(--border-color, #e2e8f0)",
                                      color: isStudent ? "#ffffff" : "var(--text-primary, #0f172a)",
                                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                                    }}
                                  >
                                    {!isStudent && (
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          display: "block",
                                          fontWeight: 800,
                                          color: "#2563eb",
                                          fontSize: "0.72rem",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.3px",
                                          mb: 0.5
                                        }}
                                      >
                                        {msg.sender?.name || msg.senderName || "Technician / Support"}
                                      </Typography>
                                    )}
                                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.5, fontSize: "0.85rem" }}>
                                      {msg.message}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        display: "block",
                                        textAlign: "right",
                                        mt: 0.6,
                                        fontSize: "0.65rem",
                                        color: isStudent ? "rgba(255,255,255,0.75)" : "var(--text-secondary, #64748b)"
                                      }}
                                    >
                                      {msgDate}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            );
                          })
                        )}
                      </Box>

                      {/* Comment Input */}
                      {selectedTicketDetail.isChatActive && selectedTicketDetail.status !== "CLOSED" && selectedTicketDetail.status !== "REJECTED" ? (
                        <Box
                          component="form"
                          onSubmit={(e) => handleSendTicketComment(selectedTicketDetail._id, e)}
                          sx={{ display: "flex", gap: 1.5, alignItems: "center" }}
                        >
                          <Avatar
                            src={`https://info.aec.edu.in/adityacentral/StudentPhotos/${student?.rollno}.jpg`}
                            sx={{ width: 34, height: 34, bgcolor: "#2563eb", fontSize: "0.8rem", fontWeight: 700 }}
                          >
                            {student?.studentname?.charAt(0) || "S"}
                          </Avatar>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Add a comment or reply to technician..."
                            value={newMessages[selectedTicketDetail._id] || ""}
                            onChange={(e) => setNewMessages((prev) => ({ ...prev, [selectedTicketDetail._id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendTicketComment(selectedTicketDetail._id, e);
                              }
                            }}
                            disabled={sendingComment[selectedTicketDetail._id]}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "10px",
                                bgcolor: "var(--bg-panel, #f8fafc)"
                              }
                            }}
                          />
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={!newMessages[selectedTicketDetail._id]?.trim() || sendingComment[selectedTicketDetail._id]}
                            sx={{
                              bgcolor: "#2563eb",
                              color: "#ffffff",
                              minWidth: 42,
                              width: 42,
                              height: 40,
                              p: 0,
                              borderRadius: "10px",
                              "&:hover": { bgcolor: "#1d4ed8" }
                            }}
                          >
                            {sendingComment[selectedTicketDetail._id] ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ fontSize: 18 }} />}
                          </Button>
                        </Box>
                      ) : (
                        <Alert severity="info" sx={{ borderRadius: "10px", py: 0.5, fontSize: "0.82rem" }}>
                          🔒 This ticket is closed. Comments are in read-only archive mode.
                        </Alert>
                      )}
                    </>
                  )}
                </Box>
              </Box>

              {/* Feedback Section when RESOLVED */}
              {selectedTicketDetail.status === "RESOLVED" && !selectedTicketDetail.feedback && (
                <Box sx={{ mt: 3, p: 2, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                  <Typography variant="body2" sx={{ color: "#16a34a", fontWeight: 700 }}>
                    🎉 This issue has been marked resolved. Please verify and submit feedback!
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<StarIcon />}
                    onClick={() => {
                      handleCloseTicketDetail();
                      openFeedbackDialog(selectedTicketDetail);
                    }}
                    sx={{ fontWeight: 700, borderRadius: "8px", textTransform: "none" }}
                  >
                    Give Feedback & Close
                  </Button>
                </Box>
              )}

              {/* Already Submitted Feedback */}
              {selectedTicketDetail.feedback && (
                <Box sx={{ mt: 2.5, p: 2, bgcolor: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#166534" }}>
                      Your Rating & Feedback
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <Rating value={selectedTicketDetail.feedback.rating} readOnly size="small" />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#15803d" }}>
                        {selectedTicketDetail.feedback.satisfaction}
                      </Typography>
                    </Box>
                    {selectedTicketDetail.feedback.comments && (
                      <Typography variant="caption" sx={{ color: "#14532d", display: "block", mt: 0.5 }}>
                        "{selectedTicketDetail.feedback.comments}"
                      </Typography>
                    )}
                  </Box>
                  <Chip label="Completed" color="success" size="small" />
                </Box>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* ----------------------------------------------------------- */}
      {/* FEEDBACK & RATING MODAL                                     */}
      {/* ----------------------------------------------------------- */}
      <Dialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: "#0f172a", pb: 1 }}>
          ⭐ Service Feedback & Rating
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
            Ticket <strong>#{selectedFeedbackTicket?.ticketNumber}</strong> — {selectedFeedbackTicket?.title}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ textAlign: "center", py: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                How satisfied are you with the resolution?
              </Typography>
              <Rating
                value={rating}
                onChange={(e, val) => setRating(val || 1)}
                size="large"
                sx={{ fontSize: "2.5rem" }}
              />
            </Box>

            <FormControl fullWidth>
              <InputLabel id="satisfaction-label">Satisfaction Level</InputLabel>
              <Select
                labelId="satisfaction-label"
                label="Satisfaction Level"
                value={satisfaction}
                onChange={(e) => setSatisfaction(e.target.value)}
              >
                <MenuItem value="Very Satisfied">😄 Very Satisfied</MenuItem>
                <MenuItem value="Satisfied">🙂 Satisfied</MenuItem>
                <MenuItem value="Neutral">😐 Neutral</MenuItem>
                <MenuItem value="Dissatisfied">🙁 Dissatisfied</MenuItem>
                <MenuItem value="Very Dissatisfied">😡 Very Dissatisfied</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Additional Remarks / Comments (Optional)"
              placeholder="Tell us what went well or how we can improve..."
              value={feedbackComments}
              onChange={(e) => setFeedbackComments(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setFeedbackOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={submittingFeedback}
            onClick={handleSubmitFeedback}
            sx={{ fontWeight: 700, borderRadius: "8px", textTransform: "none", px: 3 }}
          >
            {submittingFeedback ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Submit Feedback & Close"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
