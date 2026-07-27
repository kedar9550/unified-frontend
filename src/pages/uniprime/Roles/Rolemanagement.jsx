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
    Tabs, Tab, TablePagination
} from "@mui/material";
import { toast } from "sonner";
import {
    Add, Edit, Delete, Security, People,
    Search, FilterList, MoreVert, Close, ExpandMore,
    PersonAdd, RemoveCircle, Save, CheckCircle,
    ArrowForward, Star, Sync, GroupAdd, UploadFile,
    Person, AdminPanelSettings
} from "@mui/icons-material";
import PageHeader from "../../../components/common/PageHeader";
import API from "../../../api/axios";
import { useLocation } from "react-router-dom";

const RoleManagement = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(0);
    const [allEmployees, setAllEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [employeesSearchQuery, setEmployeesSearchQuery] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        setPage(0);
    }, [employeesSearchQuery, selectedDepartment]);

    // Roles State
    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [rolesSearchQuery, setRolesSearchQuery] = useState("");
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
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: "", key: "", description: "", defaultRole: false });

    // Modal State - User Choice
    const [isUserChoiceModalOpen, setIsUserChoiceModalOpen] = useState(false);
    const [registrationView, setRegistrationView] = useState("selection"); // selection or individual
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
    const [editableCoreDept, setEditableCoreDept] = useState("");
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
    const [showCreateIndividualSearch, setShowCreateIndividualSearch] = useState(false);
    const [createIndividualQuery, setCreateIndividualQuery] = useState("");
    const [createIndividualPreview, setCreateIndividualPreview] = useState(null);
    const [isVerifyingCreate, setIsVerifyingCreate] = useState(false);
    const [isShowingSignupForm, setIsShowingSignupForm] = useState(false);

    // Individual Signup State
    const [signupData, setSignupData] = useState({
        id: '', fullname: '', department: '', coreDepartment: '', designation: '',
        email: '', phone: '', password: 'Aditya@123', confirmPassword: 'Aditya@123', role: 'Employee',
    });
    const [signupError, setSignupError] = useState('');
    const [disabledFields, setDisabledFields] = useState({});
    const [isEcapVerified, setIsEcapVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isIndividualSubmitting, setIsIndividualSubmitting] = useState(false);

    // HOD Department Context
    const [allDepartments, setAllDepartments] = useState([]);
    const [selectedHodDepts, setSelectedHodDepts] = useState([]);

    // Assignment State
    const [selectedUser, setSelectedUser] = useState(null);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [hasTypedSearch, setHasTypedSearch] = useState(false);
    const [assignedRoleIds, setAssignedRoleIds] = useState([]);
    const [savingRoles, setSavingRoles] = useState(false);

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

    useEffect(() => {
        fetchRoles();
        fetchDepartments();
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

        if (editingEmployee.isEcapFetched) {
            updates.name = editingEmployee.name;
            updates.department = editingEmployee.department;
            updates.designation = editingEmployee.designation;
        }

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

        // Restriction: Only CSV
        if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
            toast.error("Please select a valid CSV file");
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

    const handleDownloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,institutionId,email,serving_department,parent_department\n";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "employee_bulk_upload_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- INDIVIDUAL REGISTRATION LOGIC ---

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
            email: ""
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
                userType: signupData.role,
            };
            const res = await API.post("/api/employees/register", payload);
            if (res.data) {
                toast.success("User added successfully!");
                setIsUserChoiceModalOpen(false);
                setRegistrationView("selection");
                setSignupData({
                    id: '', fullname: '', department: '', coreDepartment: '', designation: '',
                    email: '', phone: '', password: 'Aditya@123', confirmPassword: 'Aditya@123', role: 'Employee',
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
        const initialRoleIds = userRoles.map(r => r._id) || [];

        setAssignedRoleIds(initialRoleIds);

        // Populate HOD departments if they exist
        const hod = userRoles.find(r => r.name === "HOD");
        if (hod && hod.departments) {
            setSelectedHodDepts(allDepartments.filter(d => hod.departments.includes(d._id)));
        } else {
            setSelectedHodDepts([]);
        }
    };

    // Checkbox Logic
    const handleRoleToggle = (roleId) => {
        if (!selectedUser) return;
        const id = roleId.toString();
        const role = roles.find(r => r._id === id);

        // If this role is an identity default role, do not allow toggling it from UI
        if (role && role.defaultRole) {
            return;
        }

        setAssignedRoleIds(prev => {
            const isCurrentlySelected = prev.includes(id);
            if (isCurrentlySelected && role?.defaultRole) {
                const otherSelectedDefaultRoles = roles.filter(r => r.defaultRole && r._id !== id && prev.includes(r._id));
                if (otherSelectedDefaultRoles.length === 0) {
                    toast.info("Users must have at least one default role based on their identity");
                    return prev;
                }
            }
            return isCurrentlySelected ? prev.filter(i => i !== id) : [...prev, id];
        });
    };

    const executeSaveAssignments = async () => {
        setSavingRoles(true);
        try {
            const res = await API.post("/api/roles/user/sync", {
                userId: selectedUser._id,
                roleIds: assignedRoleIds,
                hodDepartments: selectedHodDepts.map(d => d._id)
            });
            if (res.data.success) {
                toast.success("Roles updated successfully!");
                setHasTypedSearch(false);
                setSelectedUser(null);
                setUserSearchQuery("");
                setUserSearchResults([]);
                setSelectedHodDepts([]);
                setHodConfirm({ open: false, message: "" });
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
        const query = employeesSearchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
            emp.name.toLowerCase().includes(query) ||
            emp.institutionId.toLowerCase().includes(query) ||
            emp.email.toLowerCase().includes(query) ||
            (emp.designation && emp.designation.toLowerCase().includes(query))
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

    return (
        <Box sx={{ p: 0 }}>
            <PageHeader
                title="Employee & Role Management"
                subtitle="Manage system roles and assign them to employees"
                action={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {uploadingBulk && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, bgcolor: '#e3f2fd', borderRadius: '10px' }}><Typography variant="caption" fontWeight={700} color="primary">Uploading Employees...</Typography></Box>}
                        {/* Hidden CSV Input */}
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv" onChange={handleBulkFileSelect} />

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

            <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                    mt: 3,
                    mb: 2,
                    borderBottom: '1px solid var(--border-color)',
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: 'var(--text-secondary)',
                        pb: 1.5,
                        '&.Mui-selected': {
                            color: 'var(--color-primary)'
                        }
                    },
                    '& .MuiTabs-indicator': {
                        backgroundColor: 'var(--color-primary)',
                        height: '3px',
                        borderRadius: '3px'
                    }
                }}
            >
                <Tab label="Assign & Create Roles" icon={<Security />} iconPosition="start" />
                <Tab label="All Users" icon={<People />} iconPosition="start" />
                <Tab label="All Roles" icon={<AdminPanelSettings />} iconPosition="start" />
            </Tabs>

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
                                            Add and update data
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
                                        variant="contained"
                                        startIcon={<Add />}
                                        onClick={handleCreateClick}
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
                                        Add
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<Sync />}
                                        onClick={() => {
                                            setShowUpdateOptions(!showUpdateOptions);
                                            setShowCreateOptions(false);
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
                                        Update
                                    </Button>
                                </Box>

                                {/* Create Options Card */}
                                <Collapse in={showCreateOptions}>
                                    <Box sx={{ mt: 3, p: 2, borderRadius: '15px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', backdropFilter: 'blur(5px)' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="subtitle2" fontWeight={800} color="var(--text-primary)">Add Options</Typography>
                                            <IconButton onClick={() => setShowCreateOptions(false)} size="small"><Close sx={{ fontSize: 18 }} /></IconButton>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', width: '100%' }}>
                                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flex: 1 }}>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={uploadingBulk ? <Loader size={16} color="inherit" /> : <UploadFile />}
                                                    onClick={() => fileInputRef.current.click()}
                                                    disabled={uploadingBulk}
                                                    sx={{ width: { xs: '100%', sm: 'auto' }, borderRadius: '50px', textTransform: 'none', fontWeight: 700, border: '1.5px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', py: { xs: 1.2, sm: 0.5 }, transition: '0.3s', '&:hover': { background: 'rgba(0, 78, 146, 0.05)', boxShadow: '0 4px 10px rgba(0, 78, 146, 0.1)' } }}
                                                >
                                                    {uploadingBulk ? 'Uploading...' : 'Bulk Upload'}
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<PersonAdd />}
                                                    onClick={() => {
                                                        if (showCreateIndividualSearch) {
                                                            setCreateIndividualQuery("");
                                                        }
                                                        setShowCreateIndividualSearch(!showCreateIndividualSearch);
                                                    }}
                                                    sx={{ width: { xs: '100%', sm: 'auto' }, borderRadius: '50px', textTransform: 'none', fontWeight: 700, border: '1.5px solid var(--color-primary)', background: showCreateIndividualSearch ? 'rgba(0, 78, 146, 0.1)' : 'transparent', color: 'var(--color-primary)', transition: '0.3s', py: { xs: 1.2, sm: 0.5 }, '&:hover': { background: 'rgba(0, 78, 146, 0.05)' } }}
                                                >
                                                    Add Individual
                                                </Button>
                                            </Box>

                                            <Collapse in={showCreateIndividualSearch} orientation={window.innerWidth < 600 ? "vertical" : "horizontal"} sx={{ width: { xs: '100%', sm: 'auto' }, mt: { xs: 2, sm: 0 } }}>
                                                <TextField
                                                    placeholder="Enter ID to verify..."
                                                    size="small"
                                                    fullWidth={window.innerWidth < 600}
                                                    value={createIndividualQuery}
                                                    onChange={(e) => setCreateIndividualQuery(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === "Enter") {
                                                            handleVerifyCreate();
                                                        }
                                                    }}
                                                    sx={{
                                                        width: { xs: '100%', sm: '280px' },
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
                                                                    <Search fontSize="small" />
                                                                </InputAdornment>
                                                            ),
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={handleVerifyCreate}
                                                                        disabled={isVerifyingCreate || !createIndividualQuery.trim()}
                                                                    >
                                                                        {isVerifyingCreate ? <Loader size={16} /> : <ArrowForward fontSize="small" />}
                                                                    </IconButton>
                                                                    <IconButton size="small" onClick={() => { setShowCreateIndividualSearch(false); setCreateIndividualQuery(""); setCreateIndividualPreview(null); setIsShowingSignupForm(false); }}><Close fontSize="small" /></IconButton>
                                                                </InputAdornment>
                                                            )
                                                        }
                                                    }}
                                                />
                                            </Collapse>
                                        </Box>

                                        {/* Verification Preview Row */}
                                        <Collapse in={!!createIndividualPreview && !isShowingSignupForm}>
                                            <Box sx={{ mt: 2 }}>
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        borderRadius: '15px',
                                                        background: 'var(--border-color)',
                                                        backdropFilter: 'blur(10px)',
                                                        border: '1px solid var(--border-color)',
                                                        px: 3,
                                                        py: 1.5,
                                                        display: 'flex',
                                                        flexDirection: { xs: 'column', sm: 'row' },
                                                        justifyContent: 'space-between',
                                                        alignItems: { xs: 'stretch', sm: 'center' },
                                                        gap: { xs: 2, sm: 0 }
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={800} sx={{ color: 'var(--text-primary)' }}>{createIndividualPreview?.name}</Typography>
                                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>ID: {createIndividualPreview?.id}</Typography>
                                                    </Box>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        onClick={handleStartSignup}
                                                        sx={{
                                                            textTransform: 'none',
                                                            borderRadius: '50px',
                                                            background: "var(--gradient-primary)",
                                                            boxShadow: "0 4px 12px rgba(0, 78, 146, 0.3)",
                                                            px: 4,
                                                            width: { xs: '100%', sm: 'auto' },
                                                            transition: '0.3s',
                                                            '&:hover': {
                                                                background: "var(--gradient-primary-hover)",
                                                                boxShadow: "0 6px 16px rgba(0, 78, 146, 0.4)",
                                                            }
                                                        }}
                                                    >
                                                        Add
                                                    </Button>
                                                </Paper>
                                            </Box>
                                        </Collapse>

                                        {/* Inline Signup Form */}
                                        <Collapse in={isShowingSignupForm}>
                                            <Box sx={{ mt: 3, p: 3, borderRadius: '20px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', backdropFilter: 'blur(10px)' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                                    <Typography variant="subtitle1" fontWeight={800} color="var(--text-primary)">Complete Registration</Typography>
                                                    <IconButton size="small" onClick={() => setIsShowingSignupForm(false)}><Close /></IconButton>
                                                </Box>

                                                <Grid container spacing={3}>
                                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                        <TextField label="Name" fullWidth value={signupData.fullname} slotProps={{ input: { readOnly: true } }} size="small" variant="filled" sx={{ "& .MuiInputBase-input": { fontWeight: 700, color: 'var(--text-primary)' } }} />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                        <TextField label="Employee ID" fullWidth value={signupData.id} slotProps={{ input: { readOnly: true } }} size="small" variant="filled" sx={{ "& .MuiInputBase-input": { fontWeight: 700, color: 'var(--text-primary)' } }} />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                        <TextField
                                                            label="Email Address"
                                                            fullWidth
                                                            required
                                                            value={signupData.email}
                                                            onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                                            placeholder="Enter official email"
                                                            size="small"
                                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", background: "white" } }}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                        <TextField
                                                            fullWidth
                                                            select
                                                            required
                                                            label="Serving Department"
                                                            value={signupData.department || ""}
                                                            onChange={(e) => setSignupData({ ...signupData, department: e.target.value })}
                                                            size="small"
                                                            slotProps={{ select: { native: false } }}
                                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", background: "white" } }}
                                                        >
                                                            <MenuItem value="" disabled sx={{ fontWeight: 'bold' }}>Select Serving Department</MenuItem>
                                                            {allDepartments.map(d => (
                                                                <MenuItem key={d._id} value={d.name}>{d.name}</MenuItem>
                                                            ))}
                                                        </TextField>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                        <TextField
                                                            fullWidth
                                                            select
                                                            required
                                                            label="Parent Department"
                                                            value={signupData.coreDepartment || ""}
                                                            onChange={(e) => setSignupData({ ...signupData, coreDepartment: e.target.value })}
                                                            size="small"
                                                            slotProps={{ select: { native: false } }}
                                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", background: "white" } }}
                                                        >
                                                            <MenuItem value="" disabled sx={{ fontWeight: 'bold' }}>Select Parent Department</MenuItem>
                                                            {allDepartments.map(d => (
                                                                <MenuItem key={d._id} value={d.name}>{d.name}</MenuItem>
                                                            ))}
                                                        </TextField>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                        <TextField label="Phone" fullWidth value={signupData.phone} slotProps={{ input: { readOnly: true } }} size="small" variant="filled" sx={{ "& .MuiInputBase-input": { fontWeight: 700 } }} />
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: { xs: 'center', sm: 'flex-end' } }}>
                                                        <Button
                                                            variant="contained"
                                                            disabled={isIndividualSubmitting}
                                                            onClick={handleIndividualSignupSubmit}
                                                            sx={{
                                                                borderRadius: '50px',
                                                                textTransform: 'none',
                                                                fontWeight: 800,
                                                                px: 5,
                                                                py: 1.2,
                                                                background: "var(--gradient-primary)",
                                                                boxShadow: "0 4px 15px rgba(0, 78, 146, 0.3)",
                                                                transition: '0.3s',
                                                                '&:hover': {
                                                                    background: "var(--gradient-primary-hover)",
                                                                    boxShadow: "0 6px 16px rgba(0, 78, 146, 0.4)",
                                                                }
                                                            }}
                                                        >
                                                            {isIndividualSubmitting ? <Loader size={20} color="inherit" /> : 'Register'}
                                                        </Button>
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        </Collapse>
                                    </Box>
                                </Collapse>

                                <Collapse in={showUpdateOptions}>
                                    <Box sx={{ mt: 3, p: 2, borderRadius: '15px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', backdropFilter: 'blur(5px)' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="subtitle2" fontWeight={800} color="var(--text-primary)">Update Options</Typography>
                                            <IconButton onClick={() => {
                                                setShowUpdateOptions(false);
                                                setShowIndividualSearch(false);
                                                setInlineSearchQuery("");
                                                setInlineSearchResults([]);
                                            }} size="small"><Close sx={{ fontSize: 18 }} /></IconButton>
                                        </Box>
                                        <Collapse in={!editingEmployee}>
                                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', width: '100%' }}>
                                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flex: 1 }}>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={isSyncingBulk ? <Loader size={16} color="inherit" /> : <Sync />}
                                                        onClick={handleBulkSync}
                                                        disabled={isSyncingBulk}
                                                        sx={{ width: { xs: '100%', sm: 'auto' }, borderRadius: '50px', textTransform: 'none', fontWeight: 700, border: '1.5px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', py: { xs: 1.2, sm: 0.5 }, transition: '0.3s', '&:hover': { background: 'rgba(0, 78, 146, 0.05)', boxShadow: '0 4px 10px rgba(0, 78, 146, 0.1)' } }}
                                                    >
                                                        {isSyncingBulk ? 'Updating...' : 'Bulk Update'}
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<Person />}
                                                        onClick={() => {
                                                            if (showIndividualSearch) {
                                                                setInlineSearchQuery("");
                                                                setInlineSearchResults([]);
                                                            }
                                                            setShowIndividualSearch(!showIndividualSearch);
                                                        }}
                                                        sx={{ width: { xs: '100%', sm: 'auto' }, borderRadius: '50px', textTransform: 'none', fontWeight: 700, border: '1.5px solid var(--color-primary)', background: showIndividualSearch ? 'rgba(0, 78, 146, 0.1)' : 'transparent', color: 'var(--color-primary)', transition: '0.3s', py: { xs: 1.2, sm: 0.5 }, '&:hover': { background: 'rgba(0, 78, 146, 0.05)' } }}
                                                    >
                                                        Individual Update
                                                    </Button>
                                                </Box>

                                                <Collapse in={showIndividualSearch} orientation={window.innerWidth < 600 ? "vertical" : "horizontal"} sx={{ width: { xs: '100%', sm: 'auto' }, mt: { xs: 2, sm: 0 } }}>
                                                    <TextField
                                                        placeholder="Search name or ID..."
                                                        size="small"
                                                        fullWidth={window.innerWidth < 600}
                                                        value={inlineSearchQuery}
                                                        onChange={(e) => {
                                                            setInlineSearchQuery(e.target.value);
                                                        }}
                                                        onKeyPress={(e) => {
                                                            if (e.key === "Enter") {
                                                                handleInlineSearch();
                                                            }
                                                        }}
                                                        sx={{
                                                            width: { xs: '100%', sm: '280px' },
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
                                                                        <Search fontSize="small" />
                                                                    </InputAdornment>
                                                                ),
                                                                endAdornment: (
                                                                    <InputAdornment position="end">
                                                                        <IconButton size="small" onClick={() => { setShowIndividualSearch(false); setInlineSearchQuery(""); }}><Close fontSize="small" /></IconButton>
                                                                    </InputAdornment>
                                                                )
                                                            }
                                                        }}
                                                    />
                                                </Collapse>
                                            </Box>

                                            {/* Integrated search results below the action row */}
                                            <Collapse in={!!inlineSearchQuery}>
                                                <Box sx={{ mt: 2 }}>
                                                    {inlineSearchResults.length > 0 ? (
                                                        <Paper
                                                            elevation={0}
                                                            sx={{
                                                                borderRadius: '15px',
                                                                background: 'var(--border-color)',
                                                                backdropFilter: 'blur(10px)',
                                                                border: '1px solid var(--border-color)',
                                                                overflow: 'hidden'
                                                            }}
                                                        >
                                                            <List size="small" disablePadding>
                                                                {inlineSearchResults.slice(0, 5).map((user) => (
                                                                    <ListItem
                                                                        key={user._id}
                                                                        divider
                                                                        sx={{
                                                                            display: 'flex',
                                                                            flexDirection: { xs: 'column', sm: 'row' },
                                                                            justifyContent: 'space-between',
                                                                            alignItems: { xs: 'stretch', sm: 'center' },
                                                                            gap: { xs: 2, sm: 0 },
                                                                            px: 3,
                                                                            py: 1.5,
                                                                            '&:hover': { bgcolor: 'var(--bg-glass)' },
                                                                            transition: '0.2s'
                                                                        }}
                                                                    >
                                                                        <Box sx={{ flex: 1 }}>
                                                                            <Typography variant="body2" fontWeight={800} sx={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{user.name}</Typography>
                                                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>ID: {user.institutionId}</Typography>
                                                                        </Box>
                                                                        <Button
                                                                            size="small"
                                                                            variant="contained"
                                                                            startIcon={<Edit sx={{ fontSize: 14 }} />}
                                                                            onClick={async () => {
                                                                                setEditingEmployee(user);
                                                                                setEditableEmail(user.email || "");
                                                                                setEditableCoreDept(user.coreDepartment || user.department || "");

                                                                                const loadingToast = toast.loading("Fetching latest details from ECAP...");
                                                                                try {
                                                                                    const res = await API.post("/api/employees/ecap-data", {
                                                                                        institutionId: user.institutionId,
                                                                                        role: "Employee"
                                                                                    });
                                                                                    if (res.data && !res.data.error) {
                                                                                        const ecapName = res.data.employeename || res.data.EmployeeName || user.name;
                                                                                        const ecapDept = res.data.departmentname || res.data.DepartmentName;
                                                                                        const ecapDesig = res.data.designation || res.data.Designation || user.designation;

                                                                                        let mappedDeptId = user.department;
                                                                                        if (ecapDept) {
                                                                                            const escapedEcapDept = ecapDept.trim().toLowerCase();
                                                                                            const foundDept = allDepartments.find(d =>
                                                                                                d.name.toLowerCase() === escapedEcapDept ||
                                                                                                d.code.toLowerCase() === escapedEcapDept
                                                                                            );
                                                                                            if (foundDept) {
                                                                                                mappedDeptId = foundDept._id;
                                                                                            }
                                                                                        }

                                                                                        setEditingEmployee({
                                                                                            ...user,
                                                                                            name: ecapName,
                                                                                            department: mappedDeptId,
                                                                                            ecapDeptName: ecapDept,
                                                                                            designation: ecapDesig,
                                                                                            isEcapFetched: true
                                                                                        });
                                                                                        toast.success("Fetched details from ECAP", { id: loadingToast });
                                                                                    } else {
                                                                                        toast.error("Employee not found in ECAP", { id: loadingToast });
                                                                                    }
                                                                                } catch (e) {
                                                                                    console.error("Failed to fetch ECAP data", e);
                                                                                    toast.error("Failed to connect to ECAP", { id: loadingToast });
                                                                                }
                                                                            }}
                                                                            sx={{
                                                                                textTransform: 'none',
                                                                                borderRadius: '50px',
                                                                                background: "var(--gradient-primary)",
                                                                                px: 4,
                                                                                width: { xs: '100%', sm: 'auto' },
                                                                                boxShadow: '0 4px 10px rgba(0, 78, 146, 0.3)',
                                                                                transition: '0.3s',
                                                                                '&:hover': {
                                                                                    background: "var(--gradient-primary-hover)",
                                                                                    boxShadow: "0 6px 16px rgba(0, 78, 146, 0.4)",
                                                                                }
                                                                            }}
                                                                        >
                                                                            Edit
                                                                        </Button>
                                                                    </ListItem>
                                                                ))}
                                                            </List>
                                                        </Paper>
                                                    ) : (
                                                        inlineSearchQuery.length >= 2 && (
                                                            <Box sx={{ p: 2, textAlign: 'center', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                                                <Typography variant="body2" fontWeight={700} color="textSecondary">No Data Found</Typography>
                                                            </Box>
                                                        )
                                                    )}
                                                </Box>
                                            </Collapse>
                                        </Collapse>

                                        {/* Employee Edit Form */}
                                        <Collapse in={!!editingEmployee}>
                                            <Box sx={{ mt: 3, p: 3, borderRadius: '15px', background: 'var(--border-color)', border: '1px solid var(--border-color)' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                                    <Typography variant="subtitle2" fontWeight={800} color="var(--text-primary)">Employee Details</Typography>
                                                    <IconButton onClick={() => setEditingEmployee(null)} size="small"><Close sx={{ fontSize: 18 }} /></IconButton>
                                                </Box>

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
                                                            label="Serving Department"
                                                            value={allDepartments.find(d => d._id === editingEmployee?.department)?.name || editingEmployee?.ecapDeptName || editingEmployee?.department || ""}
                                                            disabled
                                                            size="small"
                                                            sx={{ "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "var(--text-secondary)", fontWeight: 600 } }}
                                                        />
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
                                                </Grid>

                                                <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' }, mt: 3 }}>
                                                    <Button
                                                        variant="contained"
                                                        onClick={handleUpdateEmployeeAdmin}
                                                        disabled={isUpdatingEmail || (!editableEmail && !editableCoreDept)}
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
                                        </Collapse>
                                    </Box>
                                </Collapse>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, lg: 12 }} id="search-results-section">
                            {/* Assign Roles to User Section */}
                            <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: "20px", background: "var(--bg-glass)", backdropFilter: "blur(10px) saturate(150%)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="h6" fontWeight={800} color="var(--text-primary)">Assign Roles</Typography>
                                        <Typography variant="body2" color="textSecondary" fontWeight={500}>
                                            Managing: <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{selectedUser ? `${selectedUser.name} (${selectedUser.institutionId})` : "Please select"}</span>
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<Add />}
                                        onClick={() => setIsRoleModalOpen(true)}
                                        sx={{ borderRadius: '50px', textTransform: 'none', fontWeight: 700, border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)', '&:hover': { border: '1.5px solid var(--color-primary)', background: 'var(--bg-accent-1)' } }}
                                    >
                                        New Role
                                    </Button>
                                </Box>
                                <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
                                    <TextField
                                        id="employee-search-input"
                                        fullWidth
                                        placeholder="Search employee to manage..."
                                        size="small"
                                        value={userSearchQuery}
                                        onChange={(e) => setUserSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && handleUserSearch()}
                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", background: "var(--bg-glass)", backdropFilter: "blur(5px)" } }}
                                        slotProps={{
                                            input: {
                                                startAdornment: (<InputAdornment position="start"><Search fontSize="small" sx={{ color: 'var(--color-primary)' }} /></InputAdornment>),
                                                endAdornment: searchingUsers && (
                                                    <InputAdornment position="end">
                                                        <Loader size={16} color="inherit" />
                                                    </InputAdornment>
                                                )
                                            }
                                        }}
                                    />
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>

                    <Collapse in={hasTypedSearch || searchingUsers}>
                        <Card sx={{ mt: 4, borderRadius: "20px", boxShadow: "0 8px 32px rgba(31, 38, 135, 0.05)", border: "1px solid var(--border-color)", background: "var(--bg-glass)", backdropFilter: "blur(10px) saturate(150%)" }}>
                            <CardContent sx={{ p: 0 }}>
                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, minHeight: { xs: 'auto', lg: 450 } }}>
                                    <Box sx={{ flex: 1, borderRight: { xs: 'none', lg: "1px solid rgba(0,0,0,0.05)" }, borderBottom: { xs: "1px solid rgba(0,0,0,0.05)", lg: 'none' }, p: 2 }}>
                                        <Typography variant="subtitle2" fontWeight={700} gutterBottom color="textSecondary">Search Results</Typography>
                                        <List>
                                            {userSearchResults.length > 0 ? userSearchResults.map((user) => (
                                                <ListItem key={user._id} disablePadding sx={{
                                                    mb: 1,
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    position: 'relative',
                                                    border: '1px solid transparent',
                                                    ...(selectedUser?._id === user._id && {
                                                        '&::before': {
                                                            content: '""',
                                                            position: 'absolute',
                                                            inset: 0,
                                                            borderRadius: 'inherit',
                                                            padding: '1.5px',
                                                            background: 'var(--gradient-primary)',
                                                            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                                            WebkitMaskComposite: 'xor',
                                                            maskComposite: 'exclude',
                                                            pointerEvents: 'none',
                                                            zIndex: 0
                                                        }
                                                    })
                                                }}>
                                                    <ListItemButton selected={selectedUser?._id === user._id} onClick={() => selectUser(user)} sx={{ p: 2 }}>
                                                        <Avatar sx={{ mr: 2, background: 'var(--bg-accent-1)', color: 'var(--color-primary)' }}>{user.name.charAt(0)}</Avatar>
                                                        <ListItemText
                                                            disableTypography
                                                            primary={<Typography variant="body1" fontWeight={700} sx={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{user.name}</Typography>}
                                                            secondary={
                                                                <Box sx={{ mt: 0.5 }}>
                                                                    <Typography variant="caption" display="block" color="textPrimary" fontWeight={600}>{user.institutionId} — {user.userType}</Typography>
                                                                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                        <Typography variant="caption" color="textSecondary" sx={{ mr: 1, width: '100%' }}>Present Roles:</Typography>
                                                                        {user.roles && user.roles.length > 0 ? user.roles.map(r => (
                                                                            <Chip key={r._id} label={r.name} size="small" sx={{ height: 22, fontSize: '10px', background: "var(--gradient-primary)", color: '#fff', fontWeight: 700, borderRadius: '50px' }} />
                                                                        )) : <Typography variant="caption" fontStyle="italic">None</Typography>}
                                                                    </Box>
                                                                </Box>
                                                            }
                                                        />
                                                        <ListItemSecondaryAction sx={{ right: 16 }}>
                                                            <IconButton
                                                                edge="end"
                                                                onClick={() => selectUser(user)}
                                                                sx={{
                                                                    color: selectedUser?._id === user._id ? 'var(--color-primary)' : 'var(--text-secondary)',
                                                                    transition: '0.3s',
                                                                    '&:hover': { color: 'var(--color-primary)', transform: 'scale(1.1)' }
                                                                }}
                                                            >
                                                                <PersonAdd />
                                                            </IconButton>
                                                        </ListItemSecondaryAction>
                                                    </ListItemButton>
                                                </ListItem>
                                            )) : <Box sx={{ textAlign: 'center', py: 5, color: 'text.disabled' }}><People sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} /><Typography variant="body2">No users found.</Typography></Box>}
                                        </List>

                                        {/* HOD Serving Department Selection UI (Under User Card) */}
                                        <Collapse in={!!selectedUser && assignedRoleIds.some(rid => roles.find(r => r._id === rid)?.name === 'HOD')}>
                                            <Box sx={{ mt: 2, p: 2, borderRadius: '15px', background: 'var(--bg-paper)', border: '1px solid var(--border-color)' }}>
                                                <Typography variant="subtitle2" fontWeight={800} color="var(--text-primary)" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Security sx={{ fontSize: 18 }} /> HOD Serving Department Assignment
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                                                    Assign this HOD to multiple serving departments for context-aware access.
                                                </Typography>

                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                                    {selectedHodDepts.map(dept => (
                                                        <Chip
                                                            key={dept._id}
                                                            label={dept.name}
                                                            size="small"
                                                            onDelete={() => setSelectedHodDepts(prev => prev.filter(d => d._id !== dept._id))}
                                                            sx={{ background: "var(--gradient-primary)", color: '#fff', fontWeight: 700, borderRadius: '50px', '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)' } }}
                                                        />
                                                    ))}
                                                </Box>

                                                <FormControlLabel
                                                    sx={{ width: '100%', m: 0 }}
                                                    control={
                                                        <Box sx={{ width: '100%', mt: 1 }}>
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1, border: '1px dashed var(--text-secondary)', borderRadius: '10px' }}>
                                                                {allDepartments.map(dept => {
                                                                    const isSelected = selectedHodDepts.some(d => d._id === dept._id);
                                                                    return (
                                                                        <Chip
                                                                            key={dept._id}
                                                                            label={dept.name}
                                                                            onClick={() => {
                                                                                if (isSelected) {
                                                                                    setSelectedHodDepts(prev => prev.filter(d => d._id !== dept._id));
                                                                                } else {
                                                                                    setSelectedHodDepts(prev => [...prev, dept]);
                                                                                }
                                                                            }}
                                                                            variant={isSelected ? "filled" : "outlined"}
                                                                            size="small"
                                                                            sx={{
                                                                                cursor: 'pointer',
                                                                                borderRadius: '50px',
                                                                                fontWeight: 700,
                                                                                border: isSelected ? 'none' : '1.5px solid var(--color-primary)',
                                                                                background: isSelected ? "var(--gradient-primary)" : 'transparent',
                                                                                color: isSelected ? '#fff' : 'var(--color-primary)'
                                                                            }}
                                                                        />
                                                                    );
                                                                })}
                                                            </Box>
                                                        </Box>
                                                    }
                                                    label=""
                                                />
                                            </Box>
                                        </Collapse>
                                    </Box>

                                    <Box sx={{ flex: 1.2, p: 3, background: 'var(--bg-accent-1)', display: 'flex', flexDirection: 'column', borderLeft: { xs: 'none', lg: '1px solid var(--border-color)' }, borderTop: { xs: '1px solid var(--border-color)', lg: 'none' } }}>
                                        <Typography variant="subtitle2" fontWeight={700} gutterBottom color="textSecondary">{selectedUser ? `Select Roles for ${selectedUser.name}` : "Available Roles"}</Typography>
                                        <Box sx={{ flex: 1, overflowY: 'auto' }}>
                                            {loadingRoles ? null : (
                                                <FormGroup>
                                                    {roles.length > 0 ? roles.map((role) => {
                                                        const isIdentityDefault = role.defaultRole;
                                                        const isChecked = assignedRoleIds.includes(role._id.toString());
                                                        return (
                                                            <Box key={role._id} onClick={() => handleRoleToggle(role._id)} sx={{
                                                                p: 1.5,
                                                                mb: 1,
                                                                borderRadius: '12px',
                                                                background: 'var(--bg-glass)',
                                                                position: 'relative',
                                                                border: '1px solid transparent',
                                                                ...(isChecked && {
                                                                    '&::before': {
                                                                        content: '""',
                                                                        position: 'absolute',
                                                                        inset: 0,
                                                                        borderRadius: 'inherit',
                                                                        padding: '1.5px',
                                                                        background: 'var(--gradient-primary)',
                                                                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                                                        WebkitMaskComposite: 'xor',
                                                                        maskComposite: 'exclude',
                                                                        pointerEvents: 'none',
                                                                        zIndex: 0
                                                                    }
                                                                }),
                                                                cursor: selectedUser ? (isIdentityDefault ? 'not-allowed' : 'pointer') : 'default',
                                                                opacity: selectedUser ? (isIdentityDefault ? 0.75 : 1) : 0.6,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                transition: '0.2s',
                                                                '&:hover': selectedUser && !isIdentityDefault ? { background: 'var(--bg-panel)' } : {}
                                                            }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                                    <Checkbox
                                                                        checked={isChecked}
                                                                        disabled={!selectedUser || isIdentityDefault}
                                                                        sx={{
                                                                            p: 0,
                                                                            mr: 2,
                                                                            '&.Mui-checked': { color: 'var(--color-primary)' },
                                                                            '&.MuiCheckbox-root': { color: isChecked ? 'var(--color-primary)' : 'var(--text-secondary)' }
                                                                        }}
                                                                    />
                                                                    <Box sx={{ flex: 1 }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                            <Typography variant="body2" fontWeight={700} sx={{ color: isChecked ? 'var(--color-primary)' : 'var(--text-primary)' }}>{role.name}</Typography>
                                                                            {role.defaultRole && <Chip label="Identity Role" size="small" color="success" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800 }} />}
                                                                            {isIdentityDefault && <Tooltip title="Recommended Default Identity Role"><Star sx={{ fontSize: 16, color: 'var(--color-primary)' }} /></Tooltip>}
                                                                        </Box>
                                                                    </Box>
                                                                </Box>
                                                            </Box>
                                                        );
                                                    }) : <Typography variant="body2" color="textSecondary">No roles found.</Typography>}
                                                </FormGroup>
                                            )}
                                        </Box>
                                        {selectedUser && (
                                            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.05)', position: 'sticky', bottom: 0, background: 'transparent', pb: 1 }}>
                                                <Button fullWidth variant="contained" startIcon={<Save />} onClick={handleSaveAssignments} disabled={savingRoles} sx={{ borderRadius: '50px', py: 1.5, textTransform: 'none', fontWeight: 800, fontSize: '1rem', background: "var(--gradient-primary)", boxShadow: '0 4px 14px 0 rgba(0, 78, 146, 0.3)', transition: '0.3s', '&:hover': { background: "var(--gradient-primary-hover)", boxShadow: '0 6px 16px rgba(0, 78, 146, 0.4)' } }}>Save Role Assignments</Button>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Collapse>
                </>
            )}

            {activeTab === 1 && (
                <Box sx={{ mt: 3 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: "20px", background: "var(--bg-glass)", backdropFilter: "blur(10px) saturate(150%)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
                            <Box>
                                <Typography variant="h6" fontWeight={800} color="var(--text-primary)">All Registered Employees</Typography>
                                <Typography variant="body2" color="textSecondary" fontWeight={500}>
                                    Total: {allEmployees.length} employees
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', sm: 'auto' } }}>
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
                                        <TableHead sx={{ bgcolor: 'var(--bg-accent-1)' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Name</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Institution ID</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Email</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Serving Department</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Designation</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Assigned Roles</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: 'var(--text-primary)', pr: 3 }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedEmployees.length > 0 ? (
                                                paginatedEmployees.map((emp) => {
                                                    const deptName = allDepartments.find(d => d._id === (emp.coreDepartment || emp.department))?.name || emp.department || "N/A";
                                                    return (
                                                        <TableRow key={emp._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                            <TableCell sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'var(--bg-accent-2)', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 800 }}>
                                                                        {emp.name.charAt(0)}
                                                                    </Avatar>
                                                                    {emp.name}
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.institutionId}</TableCell>
                                                            <TableCell sx={{ fontWeight: 500 }}>{emp.email}</TableCell>
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
                                                            <TableCell align="right" sx={{ pr: 2 }}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                                    <Tooltip title="Assign Roles">
                                                                        <IconButton
                                                                            size="small"
                                                                            color="primary"
                                                                            onClick={() => {
                                                                                setActiveTab(0);
                                                                                selectUser(emp);
                                                                                setUserSearchQuery(emp.name);
                                                                                setUserSearchResults([emp]);
                                                                                setHasTypedSearch(true);
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
                                                                            onClick={() => {
                                                                                setActiveTab(0);
                                                                                setEditingEmployee(emp);
                                                                                setEditableEmail(emp.email || "");
                                                                                setEditableCoreDept(emp.coreDepartment || emp.department || "");
                                                                                setShowUpdateOptions(true);
                                                                                setShowCreateOptions(false);
                                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
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
                                flexDirection: { xs: 'column', sm: 'row' },
                                justifyContent: 'space-between',
                                alignItems: { xs: 'stretch', sm: 'center' },
                                gap: 2,
                                mb: 3
                            }}
                        >
                            <Box>
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
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    width: { xs: '100%', sm: 'auto' }
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
                                        <TableHead sx={{ bgcolor: 'var(--bg-accent-1)' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Role Name</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Role Key</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Description</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Type</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>App Scope</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Created At</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: 'var(--text-primary)', pr: 3 }}>Actions</TableCell>
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

            {/* User Choice Modal (Bulk vs Individual) */}
            <Dialog open={isUserChoiceModalOpen} onClose={() => { setIsUserChoiceModalOpen(false); setRegistrationView("selection"); }} maxWidth={registrationView === "selection" ? "sm" : "md"} fullWidth slotProps={{ paper: { sx: { borderRadius: "20px", p: registrationView === "selection" ? 2 : 0 } } }}>
                {registrationView === "selection" ? (
                    <>
                        <DialogTitle component="div" sx={{ textAlign: 'center', pb: 0 }}>
                            <Typography variant="h5" fontWeight={800} color="var(--text-primary)">Add New Employee</Typography>
                            <Typography variant="body2" color="textSecondary">Select your preferred registration method</Typography>
                        </DialogTitle>
                        <DialogContent sx={{ mt: 3 }}>
                            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                                <Card
                                    onClick={() => fileInputRef.current.click()}
                                    sx={{ flex: 1, cursor: 'pointer', borderRadius: '18px', border: '2px solid transparent', '&:hover': { borderColor: 'primary.main', bgcolor: '#f8fbfc' }, transition: '0.3s' }}
                                >
                                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                                        <Avatar sx={{ width: 60, height: 60, bgcolor: '#e8eaf6', color: '#3f51b5', mx: 'auto', mb: 2 }}><UploadFile fontSize="large" /></Avatar>
                                        <Typography variant="h6" fontWeight={700}>Bulk Upload</Typography>
                                        <Typography variant="caption" color="textSecondary">Upload a CSV file. Format: institutionId, email, serving_department, parent_department</Typography>
                                    </CardContent>
                                </Card>
                                <Card
                                    onClick={() => setRegistrationView("individual")}
                                    sx={{ flex: 1, cursor: 'pointer', borderRadius: '18px', border: '2px solid transparent', '&:hover': { borderColor: 'secondary.main', bgcolor: '#fff8f8' }, transition: '0.3s' }}
                                >
                                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                                        <Avatar sx={{ width: 60, height: 60, bgcolor: '#fce4ec', color: '#e91e63', mx: 'auto', mb: 2 }}><Person fontSize="large" /></Avatar>
                                        <Typography variant="h6" fontWeight={700}>Individual</Typography>
                                        <Typography variant="caption" color="textSecondary">Register a single employee manually through a form</Typography>
                                    </CardContent>
                                </Card>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'center', pb: 2, display: 'flex', gap: 2 }}>
                            <Button onClick={() => setIsUserChoiceModalOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>Close</Button>
                        </DialogActions>
                    </>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 4, background: 'var(--bg-main)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="h5" fontWeight={800} color="var(--text-primary)">Individual Registration</Typography>
                                <Typography variant="body2" color="textSecondary">Register a new employee by providing their details manually</Typography>
                            </Box>
                            <IconButton onClick={() => setRegistrationView("selection")}><Close /></IconButton>
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
                                <TextField label="Designation" value={signupData.designation} onChange={(e) => setSignupData({ ...signupData, designation: e.target.value })} disabled={disabledFields.designation} size="small" fullWidth />
                                <TextField label="Password" type="password" value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} size="small" fullWidth />
                                <TextField label="Confirm Password" type="password" value={signupData.confirmPassword} onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })} size="small" fullWidth />
                            </Box>
                        </Box>
                        <Box sx={{ px: 4, pb: 4, display: 'flex', gap: 2 }}>
                            <Button fullWidth variant="outlined" onClick={() => setRegistrationView("selection")} sx={{ borderRadius: '50px', py: 1.5, textTransform: 'none', fontWeight: 700, border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)', background: 'transparent' }}>Back</Button>
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
                )}
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

        </Box>
    );
};

export default RoleManagement;