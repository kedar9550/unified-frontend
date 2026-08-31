import Loader from "../../../components/common/Loader";
import React, { useState, useEffect, useRef } from "react";
import {
    Box, Button, Card, CardContent, Typography,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Chip, IconButton,
    Tooltip, TextField, InputAdornment, Dialog,
    DialogTitle, DialogContent, DialogActions, Collapse,
    List, ListItem, ListItemText, ListItemSecondaryAction,
    Divider, Avatar, Checkbox, FormControlLabel, FormGroup,
    ListItemButton, Menu, MenuItem, ListItemIcon, Grid,
    Tabs, Tab, TablePagination, Switch, Alert
} from "@mui/material";
import { toast } from "sonner";
import {
    Add, Edit, Delete, Security, People,
    Search, FilterList, MoreVert, Close, ExpandMore,
    PersonAdd, RemoveCircle, Save, CheckCircle,
    ArrowForward, Star, Sync, GroupAdd, UploadFile,
    Person, AdminPanelSettings, School
} from "@mui/icons-material";
import PageHeader from "../../../components/common/PageHeader";
import CustomTabs from "../../../components/common/CustomTabs";
import { PageContainer } from "../../../components/common/design-system";
import API from "../../../api/axios";
import { useLocation } from "react-router-dom";

const QUALIFICATION_MAP = {
  "UG": ["B.Tech.", "B.Ed."],
  "PG": ["M.Tech.", "M.E.", "M.Sc.", "M.A.", "M.Com.", "MCA", "MBA", "M.Phil.", "M.Pharm", "PGDM", "MMS", "M.S.", "Pharm.D."],
  "Doctoral": ["Pharm.D.", "Ph.D."]
};

const getTodayDateStr = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const sanitizeDateInput = (val, maxDateStr = getTodayDateStr()) => {
    if (!val) return "";
    const parts = val.split('-');
    if (parts[0] && parts[0].length > 4) {
        parts[0] = parts[0].slice(0, 4);
        val = parts.join('-');
    }
    if (val > maxDateStr) {
        val = maxDateStr;
    }
    return val;
};

const RoleManagement = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(0);
    const [allEmployees, setAllEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [employeesSearchQuery, setEmployeesSearchQuery] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [selectedRoleFilter, setSelectedRoleFilter] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        setPage(0);
    }, [employeesSearchQuery, selectedDepartment, selectedRoleFilter]);

    // Roles State
    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [rolesSearchQuery, setRolesSearchQuery] = useState("");
    const [assignmentRolesSearchQuery, setAssignmentRolesSearchQuery] = useState("");
    const [rolesPage, setRolesPage] = useState(0);
    const [rolesRowsPerPage, setRolesRowsPerPage] = useState(10);
    const [editingRole, setEditingRole] = useState(null);
    const [roleDeleteModal, setRoleDeleteModal] = useState({ open: false, role: null });
    const [deletingRole, setDeletingRole] = useState(false);

    useEffect(() => {
        setRolesPage(0);
    }, [rolesSearchQuery]);

    // Menu state
    const [createAnchorEl, setCreateAnchorEl] = useState(null);
    const openCreateMenu = Boolean(createAnchorEl);

    // Modal State - Role
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [assignRoleDialogOpen, setAssignRoleDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: "", key: "", description: "", defaultRole: false });

    // Modal State - User Choice
    const [isUserChoiceModalOpen, setIsUserChoiceModalOpen] = useState(false);

    const [uploadingBulk, setUploadingBulk] = useState(false);
    const [bulkResults, setBulkResults] = useState(null);
    const fileInputRef = useRef(null);
    const [showUpdateOptions, setShowUpdateOptions] = useState(false);
    const [showCreateOptions, setShowCreateOptions] = useState(false);
    const [isSyncingBulk, setIsSyncingBulk] = useState(false);
    const [showIndividualSearch, setShowIndividualSearch] = useState(false);
    const [inlineSearchQuery, setInlineSearchQuery] = useState("");
    const [inlineSearchResults, setInlineSearchResults] = useState([]);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [editableEmail, setEditableEmail] = useState("");
    const [editableLeadership, setEditableLeadership] = useState("");
    const [editableCoreDept, setEditableCoreDept] = useState("");
    const [editableServingDept, setEditableServingDept] = useState("");
    const [editableDefaultRole, setEditableDefaultRole] = useState("");
    const [editableQualifications, setEditableQualifications] = useState([]);
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
    const [showCreateIndividualSearch, setShowCreateIndividualSearch] = useState(false);
    const [createIndividualQuery, setCreateIndividualQuery] = useState("");
    const [createIndividualPreview, setCreateIndividualPreview] = useState(null);
    const [isVerifyingCreate, setIsVerifyingCreate] = useState(false);
    const [isShowingSignupForm, setIsShowingSignupForm] = useState(false);

    // Individual Signup State
    const [signupData, setSignupData] = useState({
        id: '', fullname: '', department: '', coreDepartment: '', designation: '',
        email: '', phone: '', password: 'Aditya@123', confirmPassword: 'Aditya@123', role: 'Employee', roleId: '',
        qualifications: [], dateOfJoining: '', leadership: 'no'
    });
    const [signupError, setSignupError] = useState('');
    const [disabledFields, setDisabledFields] = useState({});
    const [isEcapVerified, setIsEcapVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isIndividualSubmitting, setIsIndividualSubmitting] = useState(false);
    const [editableDoj, setEditableDoj] = useState("");

    // HOD Department Context
    const [allDepartments, setAllDepartments] = useState([]);
    const [selectedHodDepts, setSelectedHodDepts] = useState([]);

    // SCHOOL_DEAN Context
    const [allSchools, setAllSchools] = useState([]);
    const [selectedDeanSchools, setSelectedDeanSchools] = useState([]);

    // Assignment State
    const [selectedUser, setSelectedUser] = useState(null);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [hasTypedSearch, setHasTypedSearch] = useState(false);
    const [assignedRoleIds, setAssignedRoleIds] = useState([]);
    const [savingRoles, setSavingRoles] = useState(false);
    const [isEditingHodDepts, setIsEditingHodDepts] = useState(false);
    const [isEditingDeanSchools, setIsEditingDeanSchools] = useState(false);

    // Delete Confirmation State
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, userId: null, roleId: null, roleName: "", userName: "" });

    // HOD Replacement Confirmation State
    const [hodConfirm, setHodConfirm] = useState({ open: false, message: "" });

    // Debounced Search Effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (userSearchQuery.trim().length >= 2) {
                handleUserSearch();
            } else if (userSearchQuery.trim().length === 0) {
                setUserSearchResults([]);
                setHasTypedSearch(false);
                setSelectedUser(null);
            }
        }, 600);

        return () => clearTimeout(delayDebounceFn);
    }, [userSearchQuery]);


    // Fetch All Roles
    const fetchRoles = async () => {
        setLoadingRoles(true);
        try {
            const res = await API.get("/api/roles");
            if (res.data.success) {
                setRoles(res.data.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch roles");
        } finally {
            setLoadingRoles(false);
        }
    };

    const fetchAllEmployees = async () => {
        setLoadingEmployees(true);
        try {
            const res = await API.get("/api/employees");
            setAllEmployees(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Failed to fetch employees", error);
            toast.error(error.response?.data?.message || "Failed to fetch employee list");
        } finally {
            setLoadingEmployees(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await API.get("/api/academics/departments");
            if (res.data.success) {
                setAllDepartments(res.data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch departments", error);
        }
    };

    const fetchSchools = async () => {
        try {
            const res = await API.get("/api/academics/schools");
            if (res.data.success) {
                setAllSchools(res.data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch schools", error);
        }
    };

    useEffect(() => {
        fetchRoles();
        fetchDepartments();
        fetchSchools();
    }, []);

    useEffect(() => {
        if (location.state?.activeTab !== undefined) {
            setActiveTab(location.state.activeTab);
        }
    }, [location]);

    useEffect(() => {
        if (activeTab === 1) {
            fetchAllEmployees();
        }
    }, [activeTab]);


    // Create Menu Handlers
    const handleCreateClose = () => setCreateAnchorEl(null);

    const handleRoleOption = () => {
        handleCreateClose();
        setIsRoleModalOpen(true);
    };

    const handleUserOption = () => {
        handleCreateClose();
        setIsUserChoiceModalOpen(true);
    };

    const handleCreateClick = () => {
        setShowCreateOptions(!showCreateOptions);
        setShowUpdateOptions(false);
    };

    const handleBulkSync = async () => {
        try {
            setIsSyncingBulk(true);
            const response = await API.put('/api/employees/bulk-sync');
            if (response.data.success) {
                if (response.data.successCount > 0) {
                    toast.success(`Updated successfully! ${response.data.successCount} records changed.`);
                } else {
                    toast.info("Data is up-to-date. No changes needed.");
                }
                if (userSearchQuery) handleUserSearch();
                fetchAllEmployees();
            } else {
                toast.warning(response.data.message || 'Sync completed with some errors.');
            }
        } catch (error) {
            console.error("Bulk Sync Error:", error);
            toast.error(error.response?.data?.message || 'Bulk sync failed. Please try again.');
        } finally {
            setIsSyncingBulk(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (inlineSearchQuery) {
                handleInlineSearch();
            } else {
                setInlineSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [inlineSearchQuery]);

    const handleInlineSearch = async () => {
        if (!inlineSearchQuery) return;
        try {
            const res = await API.get(`/api/employees/search?query=${inlineSearchQuery}`);
            setInlineSearchResults(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Inline search failed", error);
        }
    };

    const handleAddEditableQualification = () => {
        setEditableQualifications(prev => [
            ...prev,
            { level: "", qualification: "", completedMonth: "", completedYear: new Date().getFullYear() }
        ]);
    };

    const handleRemoveEditableQualification = (index) => {
        setEditableQualifications(prev => prev.filter((_, i) => i !== index));
    };

    const handleEditableQualificationChange = (index, field, value) => {
        setEditableQualifications(prev => {
            const newQuals = [...prev];
            newQuals[index] = { ...newQuals[index], [field]: value };
            if (field === "level") {
                newQuals[index].qualification = ""; // reset qualification when level changes
            }
            return newQuals;
        });
    };

    const handleUpdateEmployeeAdmin = async () => {
        if (!editingEmployee) return;

        const updates = {};
        if (editableEmail && editableEmail !== editingEmployee.email) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editableEmail)) {
                toast.warning("Please enter a valid email address");
                return;
            }
            updates.email = editableEmail;
        }

        if (editableCoreDept && editableCoreDept !== editingEmployee.coreDepartment) {
            updates.coreDepartment = editableCoreDept;
        }

        if (editableLeadership && editableLeadership !== editingEmployee.leadership) {
            updates.leadership = editableLeadership;
        }

        if (editableServingDept && editableServingDept !== editingEmployee.department) {
            updates.department = editableServingDept;
        }

        const defRole = editingEmployee.roles?.find(r => r.defaultRole);
        if (editableDefaultRole && editableDefaultRole !== (defRole ? defRole._id : "")) {
            updates.defaultRoleId = editableDefaultRole;
        }

        if (editingEmployee.isEcapFetched) {
            updates.name = editingEmployee.name;
            updates.department = updates.department || editingEmployee.department;
            updates.designation = editingEmployee.designation;
        }

        updates.qualifications = (editableQualifications || []).filter(
            q => q.level && q.qualification && q.completedMonth && q.completedYear
        );
        updates.dateOfJoining = editableDoj;

        if (Object.keys(updates).length === 0) {
            toast.info("No changes to update");
            setEditingEmployee(null);
            return;
        }

        setIsUpdatingEmail(true);
        try {
            const res = await API.put(`/api/employees/${editingEmployee._id}/admin-update`, updates);
            if (res.data.success) {
                toast.success("Employee updated successfully!");
                // Update local states if needed
                if (selectedUser?._id === editingEmployee._id) {
                    setSelectedUser({ ...selectedUser, ...updates });
                }
                setEditingEmployee(null);
                setInlineSearchResults([]);
                setInlineSearchQuery("");
                fetchAllEmployees();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update employee");
        } finally {
            setIsUpdatingEmail(false);
        }
    };

    const handleCloseRoleModal = () => {
        setIsRoleModalOpen(false);
        setEditingRole(null);
        setFormData({ name: "", description: "", defaultRole: false });
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleBulkFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Restriction: Allow CSV and XLSX
        if (file.type !== "text/csv" && 
            file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" && 
            !file.name.endsWith(".csv") && 
            !file.name.endsWith(".xlsx")) {
            toast.error("Please select a valid CSV or XLSX file");
            return;
        }

        setUploadingBulk(true);
        setIsUserChoiceModalOpen(false);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await API.post("/api/employees/bulk-upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res.data.success) {
                setBulkResults(res.data);
                toast.success(`Bulk registration complete! ${res.data.successCount} users added.`);
                fetchRoles(); // Refresh to ensure roles are synced
                fetchAllEmployees();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Bulk upload failed");
        } finally {
            setUploadingBulk(false);
            e.target.value = ""; // Reset input
        }
    };

    const handleDownloadTemplate = async () => {
        const toastId = toast.loading("Generating template...");
        try {
            const response = await API.get("/api/employees/bulk-template", {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "employee_bulk_upload_template.xlsx");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success("Template downloaded!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to download template", { id: toastId });
        }
    };

    // --- INDIVIDUAL REGISTRATION LOGIC ---

    const handleAddQualification = () => {
        setSignupData(prev => ({
            ...prev,
            qualifications: [...(prev.qualifications || []), { level: "", qualification: "", completedMonth: "", completedYear: new Date().getFullYear() }]
        }));
    };

    const handleRemoveQualification = (index) => {
        setSignupData(prev => ({
            ...prev,
            qualifications: (prev.qualifications || []).filter((_, i) => i !== index)
        }));
    };

    const handleQualificationChange = (index, field, value) => {
        setSignupData(prev => {
            const newQuals = [...(prev.qualifications || [])];
            newQuals[index] = { ...newQuals[index], [field]: value };
            if (field === "level") {
                newQuals[index].qualification = ""; // reset qualification when level changes
            }
            return { ...prev, qualifications: newQuals };
        });
    };

    const validateIndividual = (data) => {
        if (!data.id?.trim()) return "ID is required";
        if (!data.fullname?.trim()) return "Full name is required";
        if (!data.department) return "Serving Department is required";
        if (!data.coreDepartment) return "Parent Department is required";
        if (!data.email?.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return "Invalid email format";
        const cleanPhone = data.phone?.toString().replace(/\D/g, '').slice(-10);
        if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) return "Enter valid Indian mobile number";
        if (!data.password || data.password.length < 6) return "Password must be at least 6 characters";
        if (data.password !== data.confirmPassword) return "Passwords do not match";
        return null;
    };

    const handleUserIdBlur = async () => {
        if (!signupData.id.trim()) { setDisabledFields({}); setIsEcapVerified(false); return; }
        setIsVerifying(true); setSignupError('');
        try {
            const res = await API.post("/api/employees/ecap-data", {
                institutionId: signupData.id.trim(),
                role: signupData.role
            });
            const data = res.data;
            if (data && !data.error) {
                const mapped = signupData.role === "Employee" ? {
                    fullname: data?.employeename?.trim() || "",
                    designation: data?.designation || "",
                    phone: data?.mobileno || "",
                } : {
                    fullname: data?.studentname?.trim() || "",
                    designation: "Student",
                    phone: data?.mobilenumber || "",
                    email: data?.emailid || "",
                };
                setSignupData(prev => ({ ...prev, ...mapped }));
                const dis = {};
                Object.keys(mapped).forEach(k => { if (mapped[k]) dis[k] = true; });
                setDisabledFields(dis);
                setIsEcapVerified(true);
            } else {
                setDisabledFields({}); setIsEcapVerified(false);
                setSignupError(`User not found in ECAP for ${signupData.role}.`);
            }
        } catch (err) {
            console.error(err);
            setDisabledFields({}); setIsEcapVerified(false);
            setSignupError('Error verifying user against ECAP.');
        } finally { setIsVerifying(false); }
    };

    const handleVerifyCreate = async () => {
        if (!createIndividualQuery.trim()) return;
        setIsVerifyingCreate(true);
        setCreateIndividualPreview(null);
        try {
            // Step 1: Check if employee already exists in our DB
            const dbCheck = await API.get(`/api/employees/search?query=${createIndividualQuery.trim()}`);
            const existing = Array.isArray(dbCheck.data) ? dbCheck.data.find(u => u.institutionId === createIndividualQuery.trim()) : null;
            if (existing) {
                toast.info(`Employee "${existing.name}" (ID: ${existing.institutionId}) already exists in the system.`);
                setIsVerifyingCreate(false);
                return;
            }

            // Step 2: Fetch from ECAP if not in DB
            const res = await API.post("/api/employees/ecap-data", {
                institutionId: createIndividualQuery.trim(),
                role: "Employee"
            });
            if (res.data && !res.data.error) {
                setCreateIndividualPreview({
                    id: createIndividualQuery.trim(),
                    name: res.data.employeename || res.data.studentname || "Unknown",
                    ecapData: res.data
                });
            } else {
                toast.error(res.data?.error || "Employee not found in ECAP");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Verification failed");
        } finally {
            setIsVerifyingCreate(false);
        }
    };

    const isLeadershipDesignation = (designation) => {
        if (!designation) return false;
        const cleanDesig = designation.toLowerCase().replace(/[^a-z0-9]/g, ' ');
        const leadershipRoles = ['Deans', 'Associate Deans', 'CoE', 'HoD', 'Chancellor', 'Pro-chancellor', 'Registrar', 'Vice-chancellor', 'Director Academics', 'Head'];
        return leadershipRoles.some(role => {
            if (!role) return false;
            let cleanRole = role.toLowerCase().trim();
            if (cleanRole.endsWith('s') && !['coe', 'chancellor', 'pro-chancellor', 'vice-chancellor', 'registrar'].includes(cleanRole)) {
                cleanRole = cleanRole.slice(0, -1);
            }
            cleanRole = cleanRole.replace(/[^a-z0-9]/g, ' ');
            return cleanDesig.includes(cleanRole);
        });
    };

    const handleStartSignup = () => {
        if (!createIndividualPreview) return;
        const data = createIndividualPreview.ecapData;
        setSignupData({
            ...signupData,
            id: createIndividualPreview.id,
            fullname: data.employeename || data.EmployeeName || data.studentname || "",
            department: "",
            coreDepartment: "",
            designation: data.designation || data.Designation || (signupData.role === "Student" ? "Student" : "Staff"),
            phone: data.mobileno || data.MobileNo || data.mobilenumber || "",
            email: "",
            dateOfJoining: (() => {
                const dojRaw = data.dateofjoin || data.DateOfJoin;
                if (!dojRaw) return "";
                const parts = dojRaw.split('/');
                if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                return dojRaw;
            })(),
            leadership: isLeadershipDesignation(data.designation || data.Designation) ? "yes" : "no"
        });
        setIsShowingSignupForm(true);
    };

    const handleIndividualSignupSubmit = async () => {
        // Sanitize phone before validation
        const sanitizedData = {
            ...signupData,
            phone: signupData.phone?.toString().replace(/\D/g, '').slice(-10)
        };

        const error = validateIndividual(sanitizedData);
        if (error) {
            toast.error(error);
            return;
        }

        setIsIndividualSubmitting(true);
        try {
            const res = await API.post("/api/employees/register", sanitizedData);
            if (res.data.success) {
                toast.success("Employee registered successfully!");
                setIsShowingSignupForm(false);
                setCreateIndividualPreview(null);
                setCreateIndividualQuery("");
                setShowCreateIndividualSearch(false);
                if (userSearchQuery) handleUserSearch();
                fetchAllEmployees();
            } else {
                toast.error(res.data.message || "Registration failed");
            }
        } catch (error) {
            console.error("Signup Error:", error.response?.data);
            if (error.response?.status === 409) {
                toast.info(error.response.data.message || "This employee is already registered in the system.");
                // Optionally close the form since they exist
                setIsShowingSignupForm(false);
                setCreateIndividualPreview(null);
                setCreateIndividualQuery("");
            } else {
                toast.error(error.response?.data?.message || "Registration failed. Please check all fields.");
            }
        } finally {
            setIsIndividualSubmitting(false);
        }
    };

    const handleIndividualSubmit = async () => {
        const err = validateIndividual(signupData);
        if (err) { setSignupError(err); return; }
        if (!isEcapVerified) { setSignupError("Please verify ID against ECAP first."); return; }

        setIsIndividualSubmitting(true);
        try {
            const payload = {
                fullname: signupData.fullname,
                id: signupData.id,
                department: signupData.department,
                coreDepartment: signupData.coreDepartment,
                designation: signupData.designation,
                email: signupData.email,
                phone: signupData.phone,
                password: signupData.password,
                roleId: signupData.roleId,
            };
            const res = await API.post("/api/employees/register", payload);
            if (res.data) {
                toast.success("User added successfully!");
                setIsUserChoiceModalOpen(false);    setSignupData({
                    id: '', fullname: '', department: '', coreDepartment: '', designation: '',
                    email: '', phone: '', password: 'Aditya@123', confirmPassword: 'Aditya@123', role: 'Employee', roleId: ''
                });
                fetchRoles();
                fetchAllEmployees();
            }
        } catch (error) {
            setSignupError(error.response?.data?.message || "Registration failed");
        } finally {
            setIsIndividualSubmitting(false);
        }
    };

    const handleSubmitRole = async () => {
        if (!formData.name || !formData.name.trim()) {
            toast.error("Role name is required");
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                name: formData.name.trim().toUpperCase(),
                key: (formData.key || formData.name).trim().toUpperCase().replace(/ /g, '_'),
                description: formData.description || "",
                defaultRole: Boolean(formData.defaultRole)
            };

            if (editingRole) {
                const res = await API.put(`/api/roles/${editingRole._id}`, payload);
                if (res.data.success) {
                    toast.success("Role updated successfully!");
                    handleCloseRoleModal();
                    fetchRoles();
                }
            } else {
                const res = await API.post("/api/roles", payload);
                if (res.data.success) {
                    toast.success("Role created successfully!");
                    handleCloseRoleModal();
                    fetchRoles();
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmDeleteRole = async () => {
        if (!roleDeleteModal.role?._id) return;
        setDeletingRole(true);
        try {
            const res = await API.delete(`/api/roles/${roleDeleteModal.role._id}`);
            if (res.data.success) {
                toast.success("Role deleted successfully!");
                setRoleDeleteModal({ open: false, role: null });
                fetchRoles();
                if (allEmployees.length > 0) fetchAllEmployees();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete role");
        } finally {
            setDeletingRole(false);
        }
    };

    // User Search Logic
    const handleUserSearch = async () => {
        if (!userSearchQuery) return;
        setSearchingUsers(true);
        try {
            const res = await API.get(`/api/employees/search?query=${userSearchQuery}`);
            const results = Array.isArray(res.data) ? res.data : [];
            setUserSearchResults(results);
            setHasTypedSearch(true);

            if (selectedUser) {
                const updated = results.find(u => u._id === selectedUser._id);
                if (updated) setSelectedUser(updated);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "User search failed");
            setUserSearchResults([]);
        } finally {
            setSearchingUsers(false);
        }
    };

    const selectUser = (user) => {
        setSelectedUser(user);
        const userRoles = user.roles || [];
        const initialRoleIds = userRoles.map(r => (r._id ? r._id.toString() : r.toString())) || [];

        setAssignedRoleIds(initialRoleIds);
        setIsEditingHodDepts(false);
        setIsEditingDeanSchools(false);

        // Populate HOD departments if they exist
        const hod = userRoles.find(r => r.name === "HOD" || r.key === "HOD");
        if (hod && hod.departments && hod.departments.length > 0) {
            setSelectedHodDepts(allDepartments.filter(d => hod.departments.some(hd => hd.toString() === d._id.toString())));
        } else {
            setSelectedHodDepts([]);
        }
        
        // Populate SCHOOL_DEAN schools if they exist
        const dean = userRoles.find(r => r.key === "SCHOOL_DEAN" || r.name === "SCHOOL_DEAN");
        if (dean && dean.schools && dean.schools.length > 0) {
            setSelectedDeanSchools(allSchools.filter(s => dean.schools.some(ds => ds.toString() === s._id.toString())));
        } else {
            setSelectedDeanSchools([]);
        }
    };

    // Checkbox Logic
    const toggleEmployeeStatus = async (empId, currentStatus) => {
        try {
            const res = await API.put(`/api/employees/${empId}/admin-update`, {
                isActive: !currentStatus
            });
            if (res.data.success) {
                toast.success(`Employee status updated to ${!currentStatus ? 'Active' : 'Inactive'}`);
                setAllEmployees(prev => prev.map(emp => emp._id === empId ? { ...emp, isActive: !currentStatus } : emp));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Error updating employee status");
        }
    };

    const handleRoleToggle = (roleId) => {
        if (!selectedUser) return;
        const id = roleId.toString();
        const role = roles.find(r => r._id.toString() === id);

        // If this role is an identity default role, do not allow toggling it from UI
        if (role && role.defaultRole) {
            return;
        }

        setAssignedRoleIds(prev => {
            const isCurrentlySelected = prev.some(i => i.toString() === id);
            if (isCurrentlySelected && role?.defaultRole) {
                const otherSelectedDefaultRoles = roles.filter(r => r.defaultRole && r._id.toString() !== id && prev.some(p => p.toString() === r._id.toString()));
                if (otherSelectedDefaultRoles.length === 0) {
                    toast.info("Users must have at least one default role based on their identity");
                    return prev;
                }
            }

            if (isCurrentlySelected) {
                if (role?.name === 'HOD' || role?.key === 'HOD') {
                    setSelectedHodDepts([]);
                    setIsEditingHodDepts(false);
                }
                if (role?.key === 'SCHOOL_DEAN' || role?.name === 'SCHOOL_DEAN') {
                    setSelectedDeanSchools([]);
                    setIsEditingDeanSchools(false);
                }
                return prev.filter(i => i.toString() !== id);
            } else {
                if (role?.name === 'HOD' || role?.key === 'HOD') {
                    setIsEditingHodDepts(true);
                }
                if (role?.key === 'SCHOOL_DEAN' || role?.name === 'SCHOOL_DEAN') {
                    setIsEditingDeanSchools(true);
                }
                return [...prev, id];
            }
        });
    };

    const executeSaveAssignments = async () => {
        setSavingRoles(true);
        try {
            const res = await API.post("/api/roles/user/sync", {
                userId: selectedUser._id,
                roleIds: assignedRoleIds,
                hodDepartments: selectedHodDepts.map(d => d._id),
                deanSchools: selectedDeanSchools.map(s => s._id)
            });
            if (res.data.success) {
                toast.success("Roles updated successfully!");
                setHasTypedSearch(false);
                setSelectedUser(null);
                setUserSearchQuery("");
                setUserSearchResults([]);
                setSelectedHodDepts([]);
                setSelectedDeanSchools([]);
                setHodConfirm({ open: false, message: "" });
                setAssignRoleDialogOpen(false);
                fetchAllEmployees();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update roles");
        } finally {
            setSavingRoles(false);
        }
    };

    const handleSaveAssignments = async () => {
        if (!selectedUser) return;

        // Validation for HOD role
        const isHodSelected = assignedRoleIds.some(rid => roles.find(r => r._id === rid)?.name === 'HOD');
        if (isHodSelected && selectedHodDepts.length === 0) {
            toast.error("Please select at least one serving department for the HOD role");
            return;
        }

        if (isHodSelected) {
            let conflictMsg = null;
            for (const dept of selectedHodDepts) {
                const existingHod = allEmployees.find(emp =>
                    emp._id !== selectedUser._id &&
                    emp.roles?.some(r => r.name === 'HOD' && r.departments?.includes(dept._id))
                );
                if (existingHod) {
                    conflictMsg = `Department "${dept.name}" already has an HOD (${existingHod.name}). Continuing will replace them. Are you sure?`;
                    break;
                }
            }

            if (conflictMsg) {
                setHodConfirm({ open: true, message: conflictMsg });
                return;
            }
        }

        // Validation for SCHOOL_DEAN role
        const isDeanSelected = assignedRoleIds.some(rid => roles.find(r => r._id === rid)?.key === 'SCHOOL_DEAN');
        if (isDeanSelected && selectedDeanSchools.length === 0) {
            toast.error("Please select at least one school for the SCHOOL_DEAN role");
            return;
        }

        if (isDeanSelected) {
            let conflictMsg = null;
            for (const school of selectedDeanSchools) {
                const existingDean = allEmployees.find(emp =>
                    emp._id !== selectedUser._id &&
                    emp.roles?.some(r => r.name === 'SCHOOL_DEAN' && r.schools?.includes(school._id))
                );
                if (existingDean) {
                    conflictMsg = `School "${school.name}" already has a Dean (${existingDean.name}). Continuing will replace them. Are you sure?`;
                    break;
                }
            }

            if (conflictMsg) {
                setHodConfirm({ open: true, message: conflictMsg });
                return;
            }
        }

        executeSaveAssignments();
    };

    const handleDeleteUserMapping = async () => {
        const { userId, roleId } = deleteConfirm;
        const role = roles.find(r => r._id === roleId);
        if (role?.defaultRole) {
            toast.warning("Cannot remove a default identity-based role individually. Please use the assignment panel to swap it.");
            return;
        }

        try {
            const res = await API.delete(`/api/roles/${roleId}/users/${userId}`);
            if (res.data.success) {
                toast.success("Role removed successfully");
                setDeleteConfirm({ ...deleteConfirm, open: false });
                handleUserSearch();
                fetchAllEmployees();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to remove role");
        }
    };

    const filteredEmployees = allEmployees.filter(emp => {
        if (selectedDepartment) {
            const empDeptId = emp.coreDepartment || emp.department;
            const selectedDeptObj = allDepartments.find(d => d._id === selectedDepartment);
            const selectedDeptName = selectedDeptObj ? selectedDeptObj.name.toLowerCase() : "";
            const empDeptStr = (emp.coreDepartment || emp.department || "").toString().toLowerCase();
            const matchesId = empDeptId === selectedDepartment;
            const matchesName = selectedDeptName && empDeptStr === selectedDeptName;
            if (!matchesId && !matchesName) {
                return false;
            }
        }
        
        if (selectedRoleFilter) {
            const hasRole = emp.roles && emp.roles.some(r => r.name === selectedRoleFilter);
            if (!hasRole) {
                return false;
            }
        }

        const query = employeesSearchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
            String(emp.name || "").toLowerCase().includes(query) ||
            String(emp.institutionId || "").toLowerCase().includes(query) ||
            String(emp.email || "").toLowerCase().includes(query) ||
            String(emp.designation || "").toLowerCase().includes(query)
        );
    });

    const paginatedEmployees = filteredEmployees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const filteredRoles = roles.filter((role) => {
        if (!rolesSearchQuery) return true;
        const query = rolesSearchQuery.toLowerCase().trim();
        return (
            (role.name && role.name.toLowerCase().includes(query)) ||
            (role.description && role.description.toLowerCase().includes(query)) ||
            (role.app && role.app.toLowerCase().includes(query))
        );
    });

    const paginatedRoles = filteredRoles.slice(
        rolesPage * rolesRowsPerPage,
        rolesPage * rolesRowsPerPage + rolesRowsPerPage
    );

    const filteredAssignmentRoles = roles.filter(role => {
        if (!assignmentRolesSearchQuery) return true;
        return role.name?.toLowerCase().includes(assignmentRolesSearchQuery.toLowerCase().trim()) || 
               role.key?.toLowerCase().includes(assignmentRolesSearchQuery.toLowerCase().trim());
    });

    return (
        <PageContainer px={0} py={0}>
            <PageHeader
                title="Employee & Role Management"
                subtitle="Manage system roles and assign them to employees"
                action={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {uploadingBulk && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, bgcolor: '#e3f2fd', borderRadius: '10px' }}><Typography variant="caption" fontWeight={700} color="primary">Uploading Employees...</Typography></Box>}
                        {/* Hidden CSV Input */}
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv, .xlsx" onChange={handleBulkFileSelect} />

                        <Menu
                            anchorEl={createAnchorEl}
                            open={openCreateMenu}
                            onClose={handleCreateClose}
                            slotProps={{ paper: { sx: { borderRadius: '12px', mt: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', minWidth: 160 } } }}
                        >
                            <MenuItem onClick={handleRoleOption} sx={{ py: 1.5 }}>
                                <ListItemIcon><Security fontSize="small" color="primary" /></ListItemIcon>
                                <ListItemText primary="Role" slotProps={{ primary: { fontWeight: 600 } }} />
                            </MenuItem>
                            <MenuItem onClick={handleUserOption} sx={{ py: 1.5 }}>
                                <ListItemIcon><PersonAdd fontSize="small" color="secondary" /></ListItemIcon>
                                <ListItemText primary="Employee" slotProps={{ primary: { fontWeight: 600 } }} />
                            </MenuItem>
                        </Menu>
                    </Box>
                }
            />

            <CustomTabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                tabs={[
                    { label: "Add Employees", icon: <PersonAdd /> },
                    { label: "All Users", icon: <People /> },
                    { label: "All Roles", icon: <AdminPanelSettings /> },
                ]}
            />

            {activeTab === 0 && (
                <>
                    <Grid container spacing={3} sx={{ mt: 1, width: '100%', ml: 0 }}>
                        <Grid size={{ xs: 12, lg: 12 }}>
                            {/* Create Roles Section */}
                            <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: "20px", background: "var(--bg-glass)", backdropFilter: "blur(10px) saturate(150%)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'flex-start' }, gap: 2 }}>
                                    <Box>
                                        <Typography variant="h6" fontWeight={800} color="var(--text-primary)">Add Employee</Typography>
                                        <Typography variant="body2" color="textSecondary" fontWeight={500}>
                                            Add data
                                        </Typography>
                                    </Box>
                                    <Button
                                        onClick={handleDownloadTemplate}
                                        variant="outlined"
                                        size="small"
                                        startIcon={<UploadFile />}
                                        sx={{
                                            textTransform: 'none',
                                            borderRadius: '50px',
                                            fontWeight: 700,
                                            border: '1.5px solid var(--color-primary)',
                                            background: 'transparent',
                                            color: 'var(--color-primary)',
                                            width: { xs: '100%', sm: 'auto' },
                                            transition: '0.3s',
                                            '&:hover': {
                                                background: 'rgba(0, 78, 146, 0.05)',
                                                borderColor: 'var(--color-primary)',
                                                boxShadow: '0 4px 12px rgba(0, 78, 146, 0.1)'
                                            }
                                        }}
                                    >
                                        Download Template
                                    </Button>
                                </Box>
                                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={uploadingBulk ? <Loader size={16} color="inherit" /> : <UploadFile />}
                                        onClick={() => fileInputRef.current.click()}
                                        disabled={uploadingBulk}
                                        sx={{
                                            flex: 1,
                                            borderRadius: "50px",
                                            textTransform: "none",
                                            px: { xs: 1, sm: 4 },
                                            fontWeight: 700,
                                            border: '1.5px solid var(--color-primary)',
                                            color: 'var(--color-primary)',
                                            fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                            transition: '0.3s',
                                            '&:hover': {
                                                background: "rgba(0, 78, 146, 0.05)",
                                                boxShadow: "0 4px 10px rgba(0, 78, 146, 0.1)"
                                            }
                                        }}
                                    >
                                        {uploadingBulk ? 'Uploading...' : 'Bulk Upload'}
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<PersonAdd />}
                                        onClick={() => {
                                            const facultyRole = roles.find(r => r.key === "FACULTY" && r.defaultRole);
                                            setSignupData(prev => ({
                                                ...prev,
                                                roleId: facultyRole ? facultyRole._id : ''
                                            }));
                                            setIsUserChoiceModalOpen(true);
                                        }}
                                        sx={{
                                            flex: 1,
                                            background: "var(--gradient-primary)",
                                            borderRadius: "50px",
                                            textTransform: "none",
                                            px: { xs: 1, sm: 4 },
                                            fontWeight: 700,
                                            fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                            boxShadow: "0 4px 12px rgba(0, 78, 146, 0.3)",
                                            transition: '0.3s',
                                            '&:hover': {
                                                background: "var(--gradient-primary-hover)",
                                                boxShadow: "0 6px 16px rgba(0, 78, 146, 0.4)",
                                                transform: 'translateY(-1px)'
                                            }
                                        }}
                                    >
                                        Add Employee
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>

                    </Grid>
                </>
            )}

            {activeTab === 1 && (
                <Box sx={{ mt: 3 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", background: "var(--bg-glass)", backdropFilter: "blur(10px) saturate(150%)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 3, mb: 3 }}>
                            <Box sx={{ minWidth: "250px" }}>
                                <Typography variant="h6" fontWeight={800} color="var(--text-primary)">All Registered Employees</Typography>
                                <Typography variant="body2" color="textSecondary" fontWeight={500}>
                                    Total: {allEmployees.length} employees
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flex: 1, flexDirection: { xs: 'column', sm: 'row' }, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                                <TextField
                                    select
                                    value={selectedRoleFilter}
                                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                                    size="small"
                                    slotProps={{ select: { displayEmpty: true } }}
                                    sx={{
                                        width: { xs: '100%', sm: '180px' },
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "10px",
                                            background: "var(--bg-glass)",
                                            backdropFilter: "blur(5px)"
                                        }
                                    }}
                                >
                                    <MenuItem value="">All Roles</MenuItem>
                                    {roles.map(r => (
                                        <MenuItem key={r._id} value={r.name}>{r.name}</MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    size="small"
                                    slotProps={{ select: { displayEmpty: true } }}
                                    sx={{
                                        width: { xs: '100%', sm: '200px' },
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "10px",
                                            background: "var(--bg-glass)",
                                            backdropFilter: "blur(5px)"
                                        }
                                    }}
                                >
                                    <MenuItem value="">All Serving Departments</MenuItem>
                                    {allDepartments.map(d => (
                                        <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    placeholder="Search by name, ID, or email..."
                                    size="small"
                                    value={employeesSearchQuery}
                                    onChange={(e) => setEmployeesSearchQuery(e.target.value)}
                                    sx={{
                                        width: { xs: '100%', sm: '320px' },
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "10px",
                                            background: "var(--bg-glass)",
                                            backdropFilter: "blur(5px)"
                                        }
                                    }}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search fontSize="small" sx={{ color: 'var(--color-primary)' }} />
                                                </InputAdornment>
                                            )
                                        }
                                    }}
                                />
                            </Box>
                        </Box>

                        {loadingEmployees ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                                <Loader />
                            </Box>
                        ) : (
                            <>
                                <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '15px', overflowX: 'auto' }}>
                                    <Table>
                                        <TableHead sx={{ background: 'var(--gradient-primary)' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 2 }}>Name</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 2 }}>Institution ID</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 2 }}>Serving Department</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 2 }}>Designation</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 2 }}>Assigned Roles</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 2, textAlign: 'center' }}>Status</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: '#ffffff', pr: 3, py: 2 }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedEmployees.length > 0 ? (
                                                paginatedEmployees.map((emp) => {
                                                    const deptName = allDepartments.find(d => d._id === (emp.coreDepartment || emp.department))?.name || emp.department || "N/A";
                                                    return (
                                                        <TableRow key={emp._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                            <TableCell sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                                {emp.name}
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.institutionId}</TableCell>
                                                            <TableCell sx={{ fontWeight: 500 }}>{deptName}</TableCell>
                                                            <TableCell sx={{ fontWeight: 500 }}>{emp.designation || 'N/A'}</TableCell>
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                    {emp.roles && emp.roles.length > 0 ? (
                                                                        emp.roles.map(r => (
                                                                            <Chip
                                                                                key={r._id}
                                                                                label={r.name}
                                                                                size="small"
                                                                                sx={{
                                                                                    height: 20,
                                                                                    fontSize: '10px',
                                                                                    background: "var(--gradient-primary)",
                                                                                    color: '#fff',
                                                                                    fontWeight: 700,
                                                                                    borderRadius: '50px'
                                                                                }}
                                                                            />
                                                                        ))
                                                                    ) : (
                                                                        <Typography variant="caption" fontStyle="italic" color="textSecondary">None</Typography>
                                                                    )}
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Tooltip title={emp.isActive !== false ? "Click to Deactivate" : "Click to Activate"}>
                                                                    <Switch
                                                                        checked={emp.isActive !== false}
                                                                        onChange={() => toggleEmployeeStatus(emp._id, emp.isActive !== false)}
                                                                        color="success"
                                                                        size="small"
                                                                    />
                                                                </Tooltip>
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ pr: 2 }}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                                    <Tooltip title="Assign Roles">
                                                                        <IconButton
                                                                            size="small"
                                                                            color="primary"
                                                                            onClick={() => {
                                                                                selectUser(emp);
                                                                                setAssignRoleDialogOpen(true);
                                                                            }}
                                                                            sx={{ border: '1.5px solid var(--border-color)', borderRadius: '10px' }}
                                                                        >
                                                                            <Security fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Edit Details">
                                                                        <IconButton
                                                                            size="small"
                                                                            color="secondary"
                                                                            onClick={async () => {
                                                                                setEditingEmployee(emp);
                                                                                setEditableEmail(emp.email || "");
                                                                                setEditableCoreDept(emp.coreDepartment?._id || emp.coreDepartment || emp.department?._id || emp.department || "");
                                                                                setEditableServingDept(emp.department?._id || emp.department || "");
                                                                                setEditableLeadership(emp.leadership || "no");
                                                                                setEditableQualifications(emp.qualifications || []);
                                                                                setEditableDoj(emp.dateOfJoining || "");
                                                                                
                                                                                const defRole = emp.roles?.find(r => r.defaultRole);
                                                                                setEditableDefaultRole(defRole ? defRole._id : "");

                                                                                const loadingToast = toast.loading("Fetching latest details from ECAP...");
                                                                                try {
                                                                                    const res = await API.post("/api/employees/ecap-data", {
                                                                                        institutionId: emp.institutionId,
                                                                                        role: "Employee"
                                                                                    });
                                                                                    if (res.data && !res.data.error) {
                                                                                        const ecapName = res.data.employeename || res.data.EmployeeName || emp.name;
                                                                                        const ecapDept = res.data.departmentname || res.data.DepartmentName;
                                                                                        const ecapDesig = res.data.designation || res.data.Designation || emp.designation;

                                                                                        const dbServingDept = emp.department?._id || emp.department;
                                                                                        
                                                                                        setEditingEmployee({
                                                                                            ...emp,
                                                                                            name: ecapName,
                                                                                            department: dbServingDept,
                                                                                            ecapDeptName: ecapDept,
                                                                                            designation: ecapDesig,
                                                                                            isEcapFetched: true
                                                                                        });
                                                                                        setEditableServingDept(dbServingDept);
                                                                                        toast.success("Fetched details from ECAP", { id: loadingToast });
                                                                                    } else {
                                                                                        toast.error("Employee not found in ECAP. Showing details from database.", { id: loadingToast });
                                                                                    }
                                                                                } catch (e) {
                                                                                    console.error("Failed to fetch ECAP data", e);
                                                                                    toast.error("Failed to connect to ECAP. Showing details from database.", { id: loadingToast });
                                                                                }
                                                                            }}
                                                                            sx={{ border: '1.5px solid var(--border-color)', borderRadius: '10px' }}
                                                                        >
                                                                            <Edit fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Box>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                                        <People sx={{ fontSize: 40, color: 'text.disabled', mb: 1, opacity: 0.5 }} />
                                                        <Typography variant="body2" color="textSecondary">No employees found matching the criteria.</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 20]}
                                    component="div"
                                    count={filteredEmployees.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={(event, newPage) => setPage(newPage)}
                                    onRowsPerPageChange={(event) => {
                                        setRowsPerPage(parseInt(event.target.value, 10));
                                        setPage(0);
                                    }}
                                    sx={{
                                        borderTop: '1px solid var(--border-color)',
                                        color: 'var(--text-secondary)',
                                        fontWeight: 600,
                                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                                            fontWeight: 600,
                                        }
                                    }}
                                />
                            </>
                        )}
                    </Paper>
                </Box>
            )}

            {activeTab === 2 && (
                <Box sx={{ mt: 3 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: "20px",
                            background: "var(--bg-glass)",
                            backdropFilter: "blur(10px) saturate(150%)",
                            border: "1px solid var(--border-color)",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 3,
                                mb: 3
                            }}
                        >
                            <Box sx={{ minWidth: "200px" }}>
                                <Typography variant="h6" fontWeight={800} color="var(--text-primary)">
                                    All System Roles
                                </Typography>
                                <Typography variant="body2" color="textSecondary" fontWeight={500}>
                                    Total: {filteredRoles.length} roles
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 2,
                                    flexWrap: 'wrap',
                                    flex: 1,
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    justifyContent: { xs: 'flex-start', sm: 'flex-end' }
                                }}
                            >
                                <TextField
                                    placeholder="Search by role name or description..."
                                    size="small"
                                    value={rolesSearchQuery}
                                    onChange={(e) => setRolesSearchQuery(e.target.value)}
                                    sx={{
                                        width: { xs: '100%', sm: '320px' },
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "10px",
                                            background: "var(--bg-glass)",
                                            backdropFilter: "blur(5px)"
                                        }
                                    }}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search fontSize="small" sx={{ color: 'var(--color-primary)' }} />
                                                </InputAdornment>
                                            )
                                        }
                                    }}
                                />

                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={() => {
                                        setEditingRole(null);
                                        setFormData({ name: "", key: "", description: "", defaultRole: false });
                                        setIsRoleModalOpen(true);
                                    }}
                                    sx={{
                                        borderRadius: '50px',
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        background: "var(--gradient-primary)",
                                        boxShadow: "0 4px 12px rgba(0, 78, 146, 0.3)",
                                        px: 3,
                                        '&:hover': {
                                            background: "var(--gradient-primary-hover)",
                                            boxShadow: "0 6px 16px rgba(0, 78, 146, 0.4)"
                                        }
                                    }}
                                >
                                    Create Role
                                </Button>
                            </Box>
                        </Box>

                        {loadingRoles ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                                <Loader />
                            </Box>
                        ) : (
                            <>
                                <TableContainer
                                    component={Paper}
                                    elevation={0}
                                    sx={{
                                        background: 'transparent',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '15px',
                                        overflowX: 'auto'
                                    }}
                                >
                                    <Table>
                                        <TableHead sx={{ background: 'var(--gradient-primary)' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 2 }}>Role Name</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 2 }}>Role Key</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 2 }}>Description</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 2 }}>Type</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 2 }}>App Scope</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 2 }}>Created At</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: '#ffffff', pr: 3, py: 2 }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedRoles.length > 0 ? (
                                                paginatedRoles.map((role) => (
                                                    <TableRow key={role._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                        <TableCell sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'var(--bg-accent-2)', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 800 }}>
                                                                    <Security fontSize="small" />
                                                                </Avatar>
                                                                <Typography variant="body2" fontWeight={800} color="var(--text-primary)">
                                                                    {role.name}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                            {role.key || <Typography variant="caption" fontStyle="italic" color="text.disabled">N/A</Typography>}
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 500, color: 'var(--text-secondary)', maxWidth: 300 }}>
                                                            {role.description || <Typography variant="caption" fontStyle="italic" color="text.disabled">No description</Typography>}
                                                        </TableCell>
                                                        <TableCell>
                                                            {role.defaultRole ? (
                                                                <Chip
                                                                    label="Identity Role"
                                                                    size="small"
                                                                    color="success"
                                                                    icon={<Star sx={{ fontSize: '12px !important' }} />}
                                                                    sx={{ height: 22, fontSize: '11px', fontWeight: 700, borderRadius: '50px' }}
                                                                />
                                                            ) : (
                                                                <Chip
                                                                    label="Custom Role"
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ height: 22, fontSize: '11px', fontWeight: 600, borderRadius: '50px', borderColor: 'var(--border-color)' }}
                                                                />
                                                            )}
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                            <Chip
                                                                label={role.app || 'UNIFIED_SYSTEM'}
                                                                size="small"
                                                                sx={{ height: 20, fontSize: '10px', background: 'var(--bg-accent-1)', color: 'var(--color-primary)', fontWeight: 700 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                                                            {role.createdAt ? new Date(role.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ pr: 2 }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                                <Tooltip title="Edit Role">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="primary"
                                                                        onClick={() => {
                                                                            setEditingRole(role);
                                                                            setFormData({
                                                                                name: role.name || "",
                                                                                key: role.key || "",
                                                                                description: role.description || "",
                                                                                defaultRole: role.defaultRole || false
                                                                            });
                                                                            setIsRoleModalOpen(true);
                                                                        }}
                                                                        sx={{ border: '1.5px solid var(--border-color)', borderRadius: '10px' }}
                                                                    >
                                                                        <Edit fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Delete Role">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => setRoleDeleteModal({ open: true, role })}
                                                                        sx={{ border: '1.5px solid var(--border-color)', borderRadius: '10px' }}
                                                                    >
                                                                        <Delete fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                                        <Security sx={{ fontSize: 40, color: 'text.disabled', mb: 1, opacity: 0.5 }} />
                                                        <Typography variant="body2" color="textSecondary">No roles found matching criteria.</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25]}
                                    component="div"
                                    count={filteredRoles.length}
                                    rowsPerPage={rolesRowsPerPage}
                                    page={rolesPage}
                                    onPageChange={(event, newPage) => setRolesPage(newPage)}
                                    onRowsPerPageChange={(event) => {
                                        setRolesRowsPerPage(parseInt(event.target.value, 10));
                                        setRolesPage(0);
                                    }}
                                    sx={{
                                        borderTop: '1px solid var(--border-color)',
                                        color: 'var(--text-secondary)',
                                        fontWeight: 600,
                                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                                            fontWeight: 600,
                                        }
                                    }}
                                />
                            </>
                        )}
                    </Paper>
                </Box>
            )}

            
            {/* Edit Employee Dialog */}
                                        <Dialog open={!!editingEmployee} onClose={() => setEditingEmployee(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "20px", background: "var(--bg-glass)", backdropFilter: "blur(20px) saturate(200%)" } }}>
                <DialogTitle sx={{ fontWeight: 800, color: "var(--text-primary)", borderBottom: "1px solid rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    Edit Employee Details
                    <IconButton onClick={() => setEditingEmployee(null)} size="small" sx={{ color: "var(--text-secondary)" }}><Close /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                                            <Box sx={{ p: 1 }}>


                                                <Grid container spacing={2}>
                                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                        <TextField
                                                            fullWidth
                                                            label="Name"
                                                            value={editingEmployee?.name || ""}
                                                            disabled
                                                            size="small"
                                                            sx={{ "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "var(--text-secondary)", fontWeight: 600 } }}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                        <TextField
                                                            fullWidth
                                                            label="ID"
                                                            value={editingEmployee?.institutionId || ""}
                                                            disabled
                                                            size="small"
                                                            sx={{ "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "var(--text-secondary)", fontWeight: 600 } }}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                        <TextField
                                                            fullWidth
                                                            select
                                                            label="Serving Department"
                                                            value={editableServingDept}
                                                            onChange={(e) => setEditableServingDept(e.target.value)}
                                                            size="small"
                                                            slotProps={{ select: { native: false } }}
                                                            sx={{
                                                                bgcolor: 'var(--bg-glass)',
                                                                borderRadius: '10px',
                                                                "& .MuiOutlinedInput-root": { borderRadius: '10px' }
                                                            }}
                                                        >
                                                            <MenuItem value="" disabled>Select Serving Department</MenuItem>
                                                            {allDepartments.map(d => (
                                                                <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                                                            ))}
                                                        </TextField>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                        <TextField
                                                            fullWidth
                                                            label="Designation"
                                                            value={editingEmployee?.designation || ""}
                                                            disabled
                                                            size="small"
                                                            sx={{ "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "var(--text-secondary)", fontWeight: 600 } }}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6 }}>
                                                        <TextField
                                                            fullWidth
                                                            label="Email (Editable)"
                                                            value={editableEmail}
                                                            onChange={(e) => setEditableEmail(e.target.value)}
                                                            size="small"
                                                            placeholder="Enter new email..."
                                                            sx={{
                                                                bgcolor: 'var(--bg-glass)',
                                                                borderRadius: '10px',
                                                                "& .MuiOutlinedInput-root": { borderRadius: '10px' }
                                                            }}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6 }}>
                                                        <TextField
                                                            fullWidth
                                                            select
                                                            label="Parent Department"
                                                            value={editableCoreDept}
                                                            onChange={(e) => setEditableCoreDept(e.target.value)}
                                                            size="small"
                                                            slotProps={{ select: { native: false } }}
                                                            sx={{
                                                                bgcolor: 'var(--bg-glass)',
                                                                borderRadius: '10px',
                                                                "& .MuiOutlinedInput-root": { borderRadius: '10px' }
                                                            }}
                                                        >
                                                            <MenuItem value="" disabled>Select Parent Department</MenuItem>
                                                            {allDepartments
                                                                .filter(d => d.type !== 'Central' && d.name.toLowerCase() !== 'freshman engineering')
                                                                .map(d => (
                                                                    <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                                                                ))}
                                                        </TextField>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6 }}>
                                                        <TextField
                                                            fullWidth
                                                            select
                                                            label="Leadership Role"
                                                            value={editableLeadership || "no"}
                                                            onChange={(e) => setEditableLeadership(e.target.value)}
                                                            size="small"
                                                            slotProps={{ select: { native: false } }}
                                                            sx={{
                                                                bgcolor: 'var(--bg-glass)',
                                                                borderRadius: '10px',
                                                                "& .MuiOutlinedInput-root": { borderRadius: '10px' }
                                                            }}
                                                        >
                                                            <MenuItem value="yes">Yes</MenuItem>
                                                            <MenuItem value="no">No</MenuItem>
                                                        </TextField>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6 }}>
                                                        <TextField
                                                            fullWidth
                                                            select
                                                            label="Default Role"
                                                            value={editableDefaultRole}
                                                            onChange={(e) => setEditableDefaultRole(e.target.value)}
                                                            size="small"
                                                            slotProps={{ select: { native: false } }}
                                                            sx={{
                                                                bgcolor: 'var(--bg-glass)',
                                                                borderRadius: '10px',
                                                                "& .MuiOutlinedInput-root": { borderRadius: '10px' }
                                                            }}
                                                        >
                                                            <MenuItem value="" disabled>Select Default Role</MenuItem>
                                                            {roles.filter(r => r.defaultRole).map(r => (
                                                                <MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>
                                                            ))}
                                                        </TextField>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6 }}>
                                                        <TextField
                                                            fullWidth
                                                            type="date"
                                                            label="Date of Joining"
                                                            value={editableDoj || ""}
                                                            onChange={(e) => setEditableDoj(sanitizeDateInput(e.target.value))}
                                                            size="small"
                                                            slotProps={{ 
                                                                htmlInput: { max: getTodayDateStr() },
                                                                inputLabel: { shrink: true } 
                                                            }}
                                                            sx={{
                                                                bgcolor: 'var(--bg-glass)',
                                                                borderRadius: '10px',
                                                                "& .MuiOutlinedInput-root": { borderRadius: '10px' }
                                                            }}
                                                        />
                                                    </Grid>

                                                    <Grid size={{ xs: 12 }}>
                                                        <Box sx={{ mt: 1 }}>
                                                            <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", mb: 1 }}>
                                                                Qualifications
                                                            </Typography>
                                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                                                {(editableQualifications || []).map((qual, index) => (
                                                                    <Box key={index} sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", p: 1.5, background: "rgba(0,0,0,0.02)", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.05)" }}>
                                                                        <TextField
                                                                            select
                                                                            size="small"
                                                                            label="Level"
                                                                            value={qual.level}
                                                                            onChange={(e) => handleEditableQualificationChange(index, "level", e.target.value)}
                                                                            sx={{ minWidth: 120, bgcolor: 'var(--bg-glass)', "& .MuiOutlinedInput-root": { borderRadius: '8px' } }}
                                                                        >
                                                                            {Object.keys(QUALIFICATION_MAP).map(level => (
                                                                                <MenuItem key={level} value={level}>{level}</MenuItem>
                                                                            ))}
                                                                        </TextField>
                                                                        <TextField
                                                                            select
                                                                            size="small"
                                                                            label="Qualification"
                                                                            value={qual.qualification}
                                                                            onChange={(e) => handleEditableQualificationChange(index, "qualification", e.target.value)}
                                                                            disabled={!qual.level}
                                                                            sx={{ minWidth: 160, bgcolor: 'var(--bg-glass)', "& .MuiOutlinedInput-root": { borderRadius: '8px' } }}
                                                                        >
                                                                            {(QUALIFICATION_MAP[qual.level] || []).map(q => (
                                                                                <MenuItem key={q} value={q}>{q}</MenuItem>
                                                                            ))}
                                                                        </TextField>
                                                                        <TextField
                                                                            select
                                                                            size="small"
                                                                            label="Month"
                                                                            value={qual.completedMonth}
                                                                            onChange={(e) => handleEditableQualificationChange(index, "completedMonth", e.target.value)}
                                                                            sx={{ minWidth: 140, bgcolor: 'var(--bg-glass)', "& .MuiOutlinedInput-root": { borderRadius: '8px' } }}
                                                                        >
                                                                            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                                                                <MenuItem key={m} value={m}>{m}</MenuItem>
                                                                            ))}
                                                                        </TextField>
                                                                        <TextField
                                                                            size="small"
                                                                            type="number"
                                                                            label="Year"
                                                                            value={qual.completedYear || ""}
                                                                            onChange={(e) => handleEditableQualificationChange(index, "completedYear", e.target.value)}
                                                                            sx={{ minWidth: 100, width: 100, bgcolor: 'var(--bg-glass)', "& .MuiOutlinedInput-root": { borderRadius: '8px' } }}
                                                                        />
                                                                        <IconButton onClick={() => handleRemoveEditableQualification(index)} color="error" size="small" sx={{ bgcolor: 'rgba(239,68,68,0.1)' }}>
                                                                            <Close fontSize="small" />
                                                                        </IconButton>
                                                                    </Box>
                                                                ))}
                                                                <Button variant="outlined" size="small" onClick={handleAddEditableQualification} sx={{ alignSelf: "flex-start", borderRadius: '50px', textTransform: 'none', fontWeight: 600 }}>
                                                                    + Add Qualification
                                                                </Button>
                                                            </Box>
                                                        </Box>
                                                    </Grid>
                                                </Grid>

                                                <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' }, mt: 3 }}>
                                                    <Button
                                                        variant="contained"
                                                        onClick={handleUpdateEmployeeAdmin}
                                                        disabled={isUpdatingEmail || (!editableEmail && !editableCoreDept && !editableLeadership && !editableServingDept)}
                                                        startIcon={isUpdatingEmail ? <Loader size={16} color="inherit" /> : <Save />}
                                                        fullWidth={false}
                                                        sx={{
                                                            borderRadius: '50px',
                                                            textTransform: 'none',
                                                            fontWeight: 700,
                                                            background: "var(--gradient-primary)",
                                                            px: { xs: 8, sm: 5 },
                                                            py: 1.2,
                                                            boxShadow: '0 4px 15px rgba(0, 78, 146, 0.3)',
                                                            width: { xs: '100%', sm: 'auto' },
                                                            transition: '0.3s',
                                                            '&:hover': {
                                                                background: "var(--gradient-primary-hover)",
                                                                boxShadow: "0 6px 16px rgba(0, 78, 146, 0.4)",
                                                            }
                                                        }}
                                                    >
                                                        {isUpdatingEmail ? 'Updating...' : 'Update'}
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </DialogContent>
            </Dialog>
            {/* Assign Roles Dialog */}
            <Dialog open={assignRoleDialogOpen} onClose={() => setAssignRoleDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "20px", background: "var(--bg-glass)", backdropFilter: "blur(20px) saturate(200%)" } }}>
                <DialogTitle sx={{ fontWeight: 800, color: 'var(--text-primary)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {selectedUser ? `Assign Roles for ${selectedUser.name}` : "Assign Roles"}
                    <IconButton onClick={() => setAssignRoleDialogOpen(false)} size="small" sx={{ color: 'var(--text-secondary)' }}><Close /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', minHeight: '60vh' }}>

                    <Box sx={{ flex: 1, p: 3, background: 'var(--bg-accent-1)', display: 'flex', flexDirection: 'column' }}>
                        <TextField placeholder="Search roles to assign..." size="small" fullWidth value={assignmentRolesSearchQuery} onChange={(e) => setAssignmentRolesSearchQuery(e.target.value)} sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "10px", background: "var(--bg-glass)" } }} InputProps={{ startAdornment: ( <InputAdornment position="start"> <Search sx={{ color: 'var(--text-secondary)' }} /> </InputAdornment> ) }} />
                        <Box sx={{ flex: 1, overflowY: 'auto' }}>
                            {loadingRoles ? null : (
                                <Grid container spacing={2} sx={{ pb: 1 }}>
                                    {filteredAssignmentRoles.length > 0 ? filteredAssignmentRoles.map((role) => {
                                        const isIdentityDefault = role.defaultRole;
                                        const isChecked = assignedRoleIds.some(id => id.toString() === role._id.toString());
                                        const expands = isChecked && ((role.name === 'HOD' && isEditingHodDepts) || (role.key === 'SCHOOL_DEAN' && isEditingDeanSchools));
                                        return (
                                            <Grid size={{ xs: 12, sm: expands ? 12 : 6, md: expands ? 12 : 4 }} key={role._id}>
                                                <Box onClick={() => handleRoleToggle(role._id)} sx={{ p: 1.5, height: '100%', borderRadius: '12px', background: 'var(--bg-glass)', position: 'relative', border: '1px solid transparent', ...(isChecked && { '&::before': { content: '""', position: 'absolute', inset: 0, borderRadius: 'inherit', padding: '1.5px', background: 'var(--gradient-primary)', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', pointerEvents: 'none', zIndex: 0 } }), cursor: selectedUser ? (isIdentityDefault ? 'not-allowed' : 'pointer') : 'default', opacity: selectedUser ? (isIdentityDefault ? 0.75 : 1) : 0.6, display: 'flex', flexDirection: 'column', transition: '0.2s', '&:hover': selectedUser && !isIdentityDefault ? { background: 'var(--bg-panel)' } : {} }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
                                                            <Checkbox checked={isChecked} disabled={!selectedUser || isIdentityDefault} sx={{ p: 0, mr: 1.5, '&.Mui-checked': { color: 'var(--color-primary)' }, '&.MuiCheckbox-root': { color: isChecked ? 'var(--color-primary)' : 'var(--text-secondary)' } }} />
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                                                <Typography variant="body2" fontWeight={700} sx={{ color: isChecked ? 'var(--color-primary)' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>{role.name}</Typography>
                                                                {role.defaultRole && <Chip label="Identity Role" size="small" color="success" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800 }} />}
                                                                {isIdentityDefault && <Tooltip title="Recommended Default Identity Role"><Star sx={{ fontSize: 16, color: 'var(--color-primary)' }} /></Tooltip>}
                                                            </Box>
                                                        </Box>
                                                        {role.name === 'HOD' && isChecked && (
                                                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, ml: 1, flexShrink: 0 }}>
                                                                {selectedHodDepts.slice(0, 2).map(dept => (
                                                                    <Chip key={dept._id} label={dept.name} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, background: "var(--gradient-primary)", color: '#fff' }} />
                                                                ))}
                                                                {selectedHodDepts.length > 2 && (
                                                                    <Chip label={`+${selectedHodDepts.length - 2}`} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, background: "rgba(255,255,255,0.15)", color: 'var(--text-primary)' }} />
                                                                )}
                                                                <Tooltip title={isEditingHodDepts ? "Close Department Selector" : "Edit Assigned Departments"}>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setIsEditingHodDepts(prev => !prev);
                                                                        }}
                                                                        sx={{ p: 0.5, color: isEditingHodDepts ? 'var(--color-primary)' : 'var(--text-secondary)', opacity: 0.8, '&:hover': { opacity: 1 } }}
                                                                    >
                                                                        <Edit sx={{ fontSize: 13 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        )}
                                                        {role.key === 'SCHOOL_DEAN' && isChecked && (
                                                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, ml: 1, flexShrink: 0 }}>
                                                                {selectedDeanSchools.slice(0, 2).map(school => (
                                                                    <Chip key={school._id} label={school.name} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, background: "var(--gradient-primary)", color: '#fff' }} />
                                                                ))}
                                                                {selectedDeanSchools.length > 2 && (
                                                                    <Chip label={`+${selectedDeanSchools.length - 2}`} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, background: "rgba(255,255,255,0.15)", color: 'var(--text-primary)' }} />
                                                                )}
                                                                <Tooltip title={isEditingDeanSchools ? "Close School Selector" : "Edit Assigned Schools"}>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setIsEditingDeanSchools(prev => !prev);
                                                                        }}
                                                                        sx={{ p: 0.5, color: isEditingDeanSchools ? 'var(--color-primary)' : 'var(--text-secondary)', opacity: 0.8, '&:hover': { opacity: 1 } }}
                                                                    >
                                                                        <Edit sx={{ fontSize: 13 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        )}
                                                    </Box>

                                                    {role.name === 'HOD' && (
                                                        <Collapse in={!!selectedUser && isChecked && isEditingHodDepts}>
                                                            <Box onClick={(e) => e.stopPropagation()} sx={{ mt: 2, pt: 2, borderTop: '1px dashed var(--border-color)', cursor: 'default' }}>
                                                                <Typography variant="subtitle2" fontWeight={800} color="var(--text-primary)" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.75rem' }}>
                                                                    <Security sx={{ fontSize: 16 }} /> Serving Department Assignment
                                                                </Typography>
                                                                {selectedHodDepts.length > 0 && (
                                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1.5 }}>
                                                                        {selectedHodDepts.map(dept => (
                                                                            <Chip key={dept._id} label={dept.name} size="small" onDelete={() => setSelectedHodDepts(prev => prev.filter(d => d._id !== dept._id))} sx={{ background: "var(--gradient-primary)", color: '#fff', fontWeight: 700, fontSize: '0.7rem', height: 24, borderRadius: '50px' }} />
                                                                        ))}
                                                                    </Box>
                                                                )}
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, p: 1.5, border: '1px dashed var(--text-secondary)', borderRadius: '10px' }}>
                                                                    {allDepartments.map(dept => {
                                                                        const isSelected = selectedHodDepts.some(d => d._id === dept._id);
                                                                        return (
                                                                            <Chip key={dept._id} label={dept.name} onClick={() => { if (isSelected) setSelectedHodDepts(prev => prev.filter(d => d._id !== dept._id)); else setSelectedHodDepts(prev => [...prev, dept]); }} variant={isSelected ? "filled" : "outlined"} size="small" sx={{ cursor: 'pointer', borderRadius: '50px', fontWeight: 700, fontSize: '0.7rem', height: 24, border: isSelected ? 'none' : '1.5px solid var(--color-primary)', background: isSelected ? "var(--gradient-primary)" : 'transparent', color: isSelected ? '#fff' : 'var(--color-primary)' }} />
                                                                        );
                                                                    })}
                                                                </Box>
                                                            </Box>
                                                        </Collapse>
                                                    )}

                                                    {role.key === 'SCHOOL_DEAN' && (
                                                        <Collapse in={!!selectedUser && isChecked && isEditingDeanSchools}>
                                                            <Box onClick={(e) => e.stopPropagation()} sx={{ mt: 2, pt: 2, borderTop: '1px dashed var(--border-color)', cursor: 'default' }}>
                                                                <Typography variant="subtitle2" fontWeight={800} color="var(--text-primary)" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.75rem' }}>
                                                                    <School sx={{ fontSize: 16 }} /> School Assignment
                                                                </Typography>
                                                                {selectedDeanSchools.length > 0 && (
                                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1.5 }}>
                                                                        {selectedDeanSchools.map(school => (
                                                                            <Chip key={school._id} label={school.name} size="small" onDelete={() => setSelectedDeanSchools(prev => prev.filter(s => s._id !== school._id))} sx={{ background: "var(--gradient-primary)", color: '#fff', fontWeight: 700, fontSize: '0.7rem', height: 24, borderRadius: '50px' }} />
                                                                        ))}
                                                                    </Box>
                                                                )}
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, p: 1.5, border: '1px dashed var(--text-secondary)', borderRadius: '10px' }}>
                                                                    {allSchools.map(school => {
                                                                        const isSelected = selectedDeanSchools.some(s => s._id === school._id);
                                                                        return (
                                                                            <Chip key={school._id} label={school.name} onClick={() => { if (isSelected) setSelectedDeanSchools(prev => prev.filter(s => s._id !== school._id)); else setSelectedDeanSchools(prev => [...prev, school]); }} variant={isSelected ? "filled" : "outlined"} size="small" sx={{ cursor: 'pointer', borderRadius: '50px', fontWeight: 700, fontSize: '0.7rem', height: 24, border: isSelected ? 'none' : '1.5px solid var(--color-primary)', background: isSelected ? "var(--gradient-primary)" : 'transparent', color: isSelected ? '#fff' : 'var(--color-primary)' }} />
                                                                        );
                                                                    })}
                                                                </Box>
                                                            </Box>
                                                        </Collapse>
                                                    )}
                                                </Box>
                                            </Grid>
                                        );
                                    }) : <Typography variant="body2" color="textSecondary">No roles found.</Typography>}
                                </Grid>
                            )}
                        </Box>


                        {selectedUser && (
                            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.05)', position: 'sticky', bottom: 0, background: 'transparent', pb: 1 }}>
                                <Button fullWidth variant="contained" startIcon={<Save />} onClick={handleSaveAssignments} disabled={savingRoles} sx={{ borderRadius: '50px', py: 1.5, textTransform: 'none', fontWeight: 800, fontSize: '1rem', background: "var(--gradient-primary)", boxShadow: '0 4px 14px 0 rgba(0, 78, 146, 0.3)', transition: '0.3s', '&:hover': { background: "var(--gradient-primary-hover)", boxShadow: '0 6px 16px rgba(0, 78, 146, 0.4)' } }}>Save Role Assignments</Button>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Create / Edit Role Modal */}
            <Dialog open={isRoleModalOpen} onClose={handleCloseRoleModal} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: "16px", p: 1 } } }}>
                <DialogTitle component="div" sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={700}>
                        {editingRole ? "Edit Role" : "Create New Role"}
                    </Typography>
                    <IconButton onClick={handleCloseRoleModal} size="small"><Close /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField
                            fullWidth
                            label="Role Name"
                            name="name"
                            value={formData.name}
                            onChange={handleFormChange}
                            size="small"
                            placeholder="E.g. FACULTY, HOD"
                            helperText="Role name will automatically be formatted in uppercase"
                        />
                        <TextField
                            fullWidth
                            label="Role Key"
                            name="key"
                            value={formData.key}
                            onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase().replace(/ /g, '_') })}
                            size="small"
                            placeholder="E.g. FACULTY, HOD"
                            helperText="Unique identifier for logic. Auto-formats to uppercase without spaces."
                            required
                            slotProps={{
                                input: {
                                    readOnly: !!editingRole,
                                },
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            value={formData.description || ""}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            size="small"
                            multiline
                            rows={3}
                            placeholder="Describe role capabilities and scope..."
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.defaultRole || false}
                                    onChange={(e) => setFormData({ ...formData, defaultRole: e.target.checked })}
                                    color="primary"
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body2" fontWeight={700}>Default Identity Role</Typography>
                                    <Typography variant="caption" color="textSecondary">Mark if this role is a default identity role</Typography>
                                </Box>
                            }
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseRoleModal}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmitRole}
                        disabled={submitting}
                        sx={{
                            borderRadius: '50px',
                            textTransform: 'none',
                            fontWeight: 700,
                            background: "var(--gradient-primary)",
                            boxShadow: '0 4px 12px rgba(0, 78, 146, 0.3)',
                            px: 4,
                            transition: '0.3s',
                            '&:hover': {
                                background: "var(--gradient-primary-hover)",
                                boxShadow: '0 6px 16px rgba(0, 78, 146, 0.4)'
                            }
                        }}
                    >
                        {submitting ? <Loader size={20} color="inherit" /> : (editingRole ? "Update Role" : "Create Role")}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Role Modal */}
            <Dialog
                open={roleDeleteModal.open}
                onClose={() => setRoleDeleteModal({ open: false, role: null })}
                slotProps={{ paper: { sx: { borderRadius: '16px' } } }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Confirm Role Deletion</DialogTitle>
                <DialogContent>
                    <Typography color="var(--text-secondary)" sx={{ mb: 1 }}>
                        Are you sure you want to delete the role <b>{roleDeleteModal.role?.name}</b>?
                    </Typography>
                    <Typography variant="caption" color="error.main" fontWeight={600} display="block">
                        Warning: This action will unassign this role from all assigned employees and cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button
                        onClick={() => setRoleDeleteModal({ open: false, role: null })}
                        sx={{ borderRadius: '50px', textTransform: 'none', fontWeight: 600 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmDeleteRole}
                        disabled={deletingRole}
                        sx={{ borderRadius: '50px', textTransform: 'none', fontWeight: 700 }}
                    >
                        {deletingRole ? <Loader size={20} color="inherit" /> : 'Delete Role'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Individual Registration Modal */}
            <Dialog open={isUserChoiceModalOpen} onClose={() => setIsUserChoiceModalOpen(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: "20px", p: 0 } } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ p: 4, background: 'var(--bg-main)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h5" fontWeight={800} color="var(--text-primary)">Individual Registration</Typography>
                            <Typography variant="body2" color="textSecondary">Register a new employee by providing their details manually</Typography>
                        </Box>
                        <IconButton onClick={() => setIsUserChoiceModalOpen(false)}><Close /></IconButton>
                    </Box>
                    <Box sx={{ p: 4 }}>
                        {signupError && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{signupError}</Alert>}
                        <Box component="form" sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                            <TextField
                                label="Institution ID" value={signupData.id}
                                onChange={(e) => setSignupData({ ...signupData, id: e.target.value.toUpperCase() })}
                                onBlur={handleUserIdBlur} size="small" fullWidth
                                helperText={isVerifying ? "Checking ECAP..." : "Type ID and click away to verify"}
                            />
                            <TextField label="Full Name" value={signupData.fullname} onChange={(e) => setSignupData({ ...signupData, fullname: e.target.value })} disabled={disabledFields.fullname} size="small" fullWidth />
                            <TextField label="Email Address" value={signupData.email} onChange={(e) => setSignupData({ ...signupData, email: e.target.value })} disabled={disabledFields.email} size="small" fullWidth />
                            <TextField label="Phone Number" value={signupData.phone} onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })} disabled={disabledFields.phone} size="small" fullWidth placeholder="9876543210" />
                            <TextField
                                select
                                required
                                label="Serving Department"
                                value={signupData.department || ""}
                                onChange={(e) => setSignupData({ ...signupData, department: e.target.value })}
                                size="small"
                                fullWidth
                                slotProps={{ select: { native: false } }}
                            >
                                <MenuItem value="" disabled sx={{ fontWeight: 'bold' }}>Select Serving Department</MenuItem>
                                {allDepartments.map(d => (
                                    <MenuItem key={d._id} value={d.name}>{d.name}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                required
                                label="Parent Department"
                                value={signupData.coreDepartment || ""}
                                onChange={(e) => setSignupData({ ...signupData, coreDepartment: e.target.value })}
                                size="small"
                                fullWidth
                                slotProps={{ select: { native: false } }}
                            >
                                <MenuItem value="" disabled sx={{ fontWeight: 'bold' }}>Select Parent Department</MenuItem>
                                {allDepartments.map(d => (
                                    <MenuItem key={d._id} value={d.name}>{d.name}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                required
                                label="Default Role"
                                value={signupData.roleId || ""}
                                onChange={(e) => setSignupData({ ...signupData, roleId: e.target.value })}
                                size="small"
                                fullWidth
                                slotProps={{ select: { native: false } }}
                            >
                                <MenuItem value="" disabled sx={{ fontWeight: 'bold' }}>Select Default Role</MenuItem>
                                {roles.filter(r => r.defaultRole).map(r => (
                                    <MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>
                                ))}
                            </TextField>
                            <TextField label="Designation" value={signupData.designation} onChange={(e) => setSignupData({ ...signupData, designation: e.target.value })} disabled={disabledFields.designation} size="small" fullWidth />
                            <TextField
                                select
                                label="Leadership Role"
                                value={signupData.leadership || "no"}
                                onChange={(e) => setSignupData({ ...signupData, leadership: e.target.value })}
                                size="small"
                                fullWidth
                                slotProps={{ select: { native: false } }}
                            >
                                <MenuItem value="yes">Yes</MenuItem>
                                <MenuItem value="no">No</MenuItem>
                            </TextField>
                            <TextField
                                type="date"
                                label="Date of Joining"
                                value={signupData.dateOfJoining || ""}
                                onChange={(e) => setSignupData({ ...signupData, dateOfJoining: sanitizeDateInput(e.target.value) })}
                                size="small"
                                fullWidth
                                slotProps={{ 
                                    htmlInput: { max: getTodayDateStr() },
                                    inputLabel: { shrink: true } 
                                }}
                            />
                            <TextField label="Password" type="password" value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} size="small" fullWidth />
                            <TextField label="Confirm Password" type="password" value={signupData.confirmPassword} onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })} size="small" fullWidth />
                            
                            <Box sx={{ gridColumn: "1 / -1", mt: 2 }}>
                                <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", mb: 2 }}>
                                    Qualifications
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    {(signupData.qualifications || []).map((qual, index) => (
                                        <Box key={index} sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", p: 2, background: "rgba(0,0,0,0.02)", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.05)" }}>
                                            <TextField
                                                select
                                                size="small"
                                                label="Level"
                                                value={qual.level}
                                                onChange={(e) => handleQualificationChange(index, "level", e.target.value)}
                                                sx={{ minWidth: 120 }}
                                            >
                                                {Object.keys(QUALIFICATION_MAP).map(level => (
                                                    <MenuItem key={level} value={level}>{level}</MenuItem>
                                                ))}
                                            </TextField>
                                            <TextField
                                                select
                                                size="small"
                                                label="Qualification"
                                                value={qual.qualification}
                                                onChange={(e) => handleQualificationChange(index, "qualification", e.target.value)}
                                                disabled={!qual.level}
                                                sx={{ minWidth: 160 }}
                                            >
                                                {(QUALIFICATION_MAP[qual.level] || []).map(q => (
                                                    <MenuItem key={q} value={q}>{q}</MenuItem>
                                                ))}
                                            </TextField>
                                            <TextField
                                                select
                                                size="small"
                                                label="Month"
                                                value={qual.completedMonth}
                                                onChange={(e) => handleQualificationChange(index, "completedMonth", e.target.value)}
                                                sx={{ minWidth: 140 }}
                                            >
                                                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                                    <MenuItem key={m} value={m}>{m}</MenuItem>
                                                ))}
                                            </TextField>
                                            <TextField
                                                size="small"
                                                type="number"
                                                label="Year"
                                                value={qual.completedYear || ""}
                                                onChange={(e) => handleQualificationChange(index, "completedYear", e.target.value)}
                                                sx={{ minWidth: 100, width: 100 }}
                                            />
                                            <IconButton onClick={() => handleRemoveQualification(index)} color="error" size="small">
                                                <Close fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    ))}
                                    <Button variant="outlined" size="small" onClick={handleAddQualification} sx={{ alignSelf: "flex-start", borderRadius: '50px', textTransform: 'none', fontWeight: 600 }}>
                                        + Add Qualification
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={{ px: 4, pb: 4, display: 'flex', gap: 2 }}>
                        <Button fullWidth variant="outlined" onClick={() => setIsUserChoiceModalOpen(false)} sx={{ borderRadius: '50px', py: 1.5, textTransform: 'none', fontWeight: 700, border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)', background: 'transparent' }}>Cancel</Button>
                        <Button
                            fullWidth variant="contained"
                            onClick={handleIndividualSubmit}
                            disabled={isIndividualSubmitting || !isEcapVerified}
                            sx={{ borderRadius: '50px', py: 1.5, textTransform: 'none', fontWeight: 700, background: "var(--gradient-primary)", boxShadow: '0 4px 15px rgba(0, 78, 146, 0.3)', transition: '0.3s', '&:hover': { background: "var(--gradient-primary-hover)", boxShadow: '0 6px 16px rgba(0, 78, 146, 0.4)' } }}
                        >
                            Register Employee
                        </Button>
                    </Box>
                </Box>
            </Dialog>

            {/* Bulk Results Dialog */}
            <Dialog open={!!bulkResults} onClose={() => setBulkResults(null)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: '20px' } } }}>
                <DialogTitle component="div" sx={{ bgcolor: '#f8fbfc', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={800}>Upload Results</Typography>
                    <IconButton onClick={() => setBulkResults(null)}><Close /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ py: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <Paper sx={{ flex: 1, p: 2, bgcolor: '#e8f5e9', textAlign: 'center', borderRadius: '15px' }}>
                            <Typography variant="h4" fontWeight={800} color="success.main">{bulkResults?.successCount || 0}</Typography>
                            <Typography variant="caption" fontWeight={700}>Success</Typography>
                        </Paper>
                        <Paper sx={{ flex: 1, p: 2, bgcolor: '#ffebee', textAlign: 'center', borderRadius: '15px' }}>
                            <Typography variant="h4" fontWeight={800} color="error.main">{bulkResults?.failureCount || 0}</Typography>
                            <Typography variant="caption" fontWeight={700}>Failed</Typography>
                        </Paper>
                    </Box>

                    {bulkResults?.errors && bulkResults.errors.length > 0 && (
                        <>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Failure Details:</Typography>
                            <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', p: 1 }}>
                                {bulkResults.errors.map((err, i) => (
                                    <Box key={i} sx={{ p: 1, mb: 0.5, bgcolor: '#fffcfc', borderRadius: '8px', borderLeft: '4px solid #ef5350' }}>
                                        <Typography variant="caption" fontWeight={700} display="block">ID: {err.id}</Typography>
                                        <Typography variant="caption" color="textSecondary">{err.error}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button fullWidth variant="contained" onClick={() => setBulkResults(null)} sx={{ borderRadius: '50px', py: 1.2, background: "var(--gradient-primary)", fontWeight: 700, textTransform: 'none' }}>Done</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ ...deleteConfirm, open: false })} slotProps={{ paper: { sx: { borderRadius: '16px' } } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Confirm Role Removal</DialogTitle>
                <DialogContent><Typography>Are you sure you want to remove <b>{deleteConfirm.roleName}</b>?</Typography></DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteConfirm({ ...deleteConfirm, open: false })}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteUserMapping} sx={{ borderRadius: '50px', textTransform: 'none', fontWeight: 700 }}>Remove Role</Button>
                </DialogActions>
            </Dialog>

            {/* HOD Replacement Confirmation */}
            <Dialog open={hodConfirm.open} onClose={() => setHodConfirm({ open: false, message: "" })} slotProps={{ paper: { sx: { borderRadius: '16px' } } }}>
                <DialogTitle sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Confirm HOD Replacement</DialogTitle>
                <DialogContent><Typography sx={{ color: 'var(--text-secondary)' }}>{hodConfirm.message}</Typography></DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setHodConfirm({ open: false, message: "" })} sx={{ borderRadius: '50px', textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={executeSaveAssignments} disabled={savingRoles} sx={{ borderRadius: '50px', textTransform: 'none', fontWeight: 700, background: "var(--gradient-primary)", boxShadow: "0 4px 12px rgba(0, 78, 146, 0.3)" }}>
                        {savingRoles ? <Loader size={20} color="inherit" /> : 'Confirm Replacement'}
                    </Button>
                </DialogActions>
            </Dialog>

        </PageContainer>
    );
};

export default RoleManagement;
