import React, { useState, useEffect, useRef } from "react";
import {
    Box, Button, Card, CardContent, Typography,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Chip, IconButton,
    Tooltip, TextField, InputAdornment, Dialog,
    DialogTitle, DialogContent, DialogActions,
    CircularProgress, Snackbar, Alert, Collapse,
    List, ListItem, ListItemText, ListItemSecondaryAction,
    Divider, Avatar, Checkbox, FormControlLabel, FormGroup,
    ListItemButton, Menu, MenuItem, ListItemIcon
} from "@mui/material";
import {
    Add, Edit, Delete, Security, People,
    Search, FilterList, MoreVert, Close, ExpandMore,
    PersonAdd, RemoveCircle, Save, CheckCircle,
    ArrowForward, Star, Sync, GroupAdd, UploadFile,
    Person
} from "@mui/icons-material";
import PageHeader from "../../../components/common/PageHeader";
import API from "../../../api/axios";

const RoleManagement = () => {
    // Roles State
    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);

    // Menu state
    const [createAnchorEl, setCreateAnchorEl] = useState(null);
    const openCreateMenu = Boolean(createAnchorEl);

    // Modal State - Role
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: "" });

    // Modal State - User Choice
    const [isUserChoiceModalOpen, setIsUserChoiceModalOpen] = useState(false);
    const [registrationView, setRegistrationView] = useState("selection"); // selection or individual
    const [uploadingBulk, setUploadingBulk] = useState(false);
    const [bulkResults, setBulkResults] = useState(null);
    const fileInputRef = useRef(null);

    // Individual Signup State
    const [signupData, setSignupData] = useState({
        id: '', fullname: '', department: '', designation: '',
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

    // Global State
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    // Helper to get system-expected role name
    const getSystemRoleName = (user) => {
        if (!user) return "";
        if (user.userType === "Student") return "STUDENT";
        const desig = (user.designation || "").toLowerCase();
        if (/prof|professor|ass|teaching|ph\.?d\.?\s*full[- ]?time\s*scholar/i.test(desig)) return "FACULTY";
        if (/technician|programmer/i.test(desig)) return "TECHNICIAN";
        return "STAFF";
    };

    // Fetch All Roles
    const fetchRoles = async () => {
        setLoadingRoles(true);
        try {
            const res = await API.get("/api/roles");
            if (res.data.success) {
                setRoles(res.data.data);
            }
        } catch (error) {
            showSnackbar("Failed to fetch roles", "error");
        } finally {
            setLoadingRoles(false);
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

    const showSnackbar = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    // Create Menu Handlers
    const handleCreateClick = (event) => setCreateAnchorEl(event.currentTarget);
    const handleCreateClose = () => setCreateAnchorEl(null);

    const handleRoleOption = () => {
        handleCreateClose();
        setIsRoleModalOpen(true);
    };

    const handleUserOption = () => {
        handleCreateClose();
        setIsUserChoiceModalOpen(true);
    };

    const handleCloseRoleModal = () => {
        setIsRoleModalOpen(false);
        setFormData({ name: "" });
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleBulkFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Restriction: Only CSV
        if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
            showSnackbar("Please select a valid CSV file", "error");
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
                showSnackbar(`Bulk registration complete! ${res.data.successCount} users added.`, "success");
                fetchRoles(); // Refresh to ensure roles are synced
            }
        } catch (error) {
            showSnackbar(error.response?.data?.message || "Bulk upload failed", "error");
        } finally {
            setUploadingBulk(false);
            e.target.value = ""; // Reset input
        }
    };

    // --- INDIVIDUAL REGISTRATION LOGIC ---

    const validateIndividual = (data) => {
        if (!data.id?.trim()) return "ID is required";
        if (!data.fullname?.trim()) return "Full name is required";
        if (!data.department) return "Department is required";
        if (!data.email?.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return "Invalid email format";
        if (!data.phone) return "Phone number required";
        if (!/^[6-9]\d{9}$/.test(data.phone)) return "Enter valid Indian mobile number";
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
                    department: data?.departmentname || "",
                    designation: data?.designation || "",
                    phone: data?.mobileno || "",
                } : {
                    fullname: data?.studentname?.trim() || "",
                    department: data?.branch || "",
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
            setDisabledFields({}); setIsEcapVerified(false);
            setSignupError('Error verifying user against ECAP.');
        } finally { setIsVerifying(false); }
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
                designation: signupData.designation,
                email: signupData.email,
                phone: signupData.phone,
                password: signupData.password,
                userType: signupData.role,
            };
            const res = await API.post("/api/employees/register", payload);
            if (res.data) {
                showSnackbar("User added successfully!", "success");
                setIsUserChoiceModalOpen(false);
                setRegistrationView("selection");
                setSignupData({
                    id: '', fullname: '', department: '', designation: '',
                    email: '', phone: '', password: 'Aditya@123', confirmPassword: 'Aditya@123', role: 'Employee',
                });
                fetchRoles();
            }
        } catch (error) {
            setSignupError(error.response?.data?.message || "Registration failed");
        } finally {
            setIsIndividualSubmitting(false);
        }
    };

    const handleSubmitRole = async () => {
        if (!formData.name) return;
        setSubmitting(true);
        try {
            const res = await API.post("/api/roles", formData);
            if (res.data.success) {
                showSnackbar("Role created successfully!");
                handleCloseRoleModal();
                fetchRoles();
            }
        } catch (error) {
            showSnackbar(error.response?.data?.message || "Failed to create role", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteRole = async (id) => {
        const role = roles.find(r => r._id === id);
        if (role?.defaultRole) {
            showSnackbar("System Default roles cannot be deleted from here.", "warning");
            return;
        }
        if (!window.confirm("Are you sure? This will remove the role from ALL users.")) return;
        try {
            const res = await API.delete(`/api/roles/${id}`);
            if (res.data.success) {
                showSnackbar("Role deleted successfully!");
                fetchRoles();
                if (selectedUser) handleUserSearch();
            }
        } catch (error) {
            showSnackbar("Failed to delete role", "error");
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
            showSnackbar("User search failed", "error");
            setUserSearchResults([]);
        } finally {
            setSearchingUsers(false);
        }
    };

    const selectUser = (user) => {
        setSelectedUser(user);
        const userRoles = user.roles || [];
        setAssignedRoleIds(userRoles.map(r => r._id) || []);
        
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

        setAssignedRoleIds(prev => {
            const isCurrentlySelected = prev.includes(id);
            if (isCurrentlySelected && role?.defaultRole) {
                const otherSelectedDefaultRoles = roles.filter(r => r.defaultRole && r._id !== id && prev.includes(r._id));
                if (otherSelectedDefaultRoles.length === 0) {
                    showSnackbar("Users must have at least one default role based on their identity.", "info");
                    return prev;
                }
            }
            return isCurrentlySelected ? prev.filter(i => i !== id) : [...prev, id];
        });
    };

    const handleSaveAssignments = async () => {
        if (!selectedUser) return;

        // Validation for HOD role
        const isHodSelected = assignedRoleIds.some(rid => roles.find(r => r._id === rid)?.name === 'HOD');
        if (isHodSelected && selectedHodDepts.length === 0) {
            showSnackbar("Please select at least one department for the HOD role", "error");
            return;
        }

        setSavingRoles(true);
        try {
            const res = await API.post("/api/roles/user/sync", {
                userId: selectedUser._id,
                roleIds: assignedRoleIds,
                hodDepartments: selectedHodDepts.map(d => d._id)
            });
            if (res.data.success) {
                showSnackbar("Roles updated successfully!");
                setHasTypedSearch(false);
                setSelectedUser(null);
                setUserSearchQuery("");
                setUserSearchResults([]);
                setSelectedHodDepts([]);
            }
        } catch (error) {
            showSnackbar(error.response?.data?.message || "Failed to update roles", "error");
        } finally {
            setSavingRoles(false);
        }
    };

    const handleDeleteUserMapping = async () => {
        const { userId, roleId } = deleteConfirm;
        const role = roles.find(r => r._id === roleId);
        if (role?.defaultRole) {
            showSnackbar("Cannot remove a default identity-based role individually. Please use the assignment panel to swap it.", "warning");
            return;
        }

        try {
            const res = await API.delete(`/api/roles/${roleId}/users/${userId}`);
            if (res.data.success) {
                showSnackbar("Role removed successfully");
                setDeleteConfirm({ ...deleteConfirm, open: false });
                handleUserSearch();
            }
        } catch (error) {
            showSnackbar("Failed to remove role", "error");
        }
    };

    return (
        <Box sx={{ p: 0 }}>
            <PageHeader
                title="User & Role Management"
                subtitle="Manage system roles and assign them to users"
                action={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {uploadingBulk && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, bgcolor: '#e3f2fd', borderRadius: '10px' }}><Typography variant="caption" fontWeight={700} color="primary">Uploading Users...</Typography></Box>}
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleCreateClick}
                            disabled={uploadingBulk}
                            sx={{ 
                                borderRadius: "12px", 
                                textTransform: "none", 
                                px: 4, 
                                fontWeight: 700, 
                                background: "rgba(11, 82, 153, 0.6)", 
                                backdropFilter: "blur(10px) saturate(150%)",
                                WebkitBackdropFilter: "blur(10px) saturate(150%)",
                                border: "1px solid rgba(255, 255, 255, 0.3)",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                '&:hover': {
                                    background: "rgba(11, 82, 153, 0.8)",
                                    boxShadow: "0 6px 16px rgba(11, 82, 153, 0.3)",
                                }
                            }}
                        >
                            Create
                        </Button>
                        {/* Hidden CSV Input */}
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv" onChange={handleBulkFileSelect} />
                        
                        <Menu
                            anchorEl={createAnchorEl}
                            open={openCreateMenu}
                            onClose={handleCreateClose}
                            PaperProps={{ sx: { borderRadius: '12px', mt: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', minWidth: 160 } }}
                        >
                            <MenuItem onClick={handleRoleOption} sx={{ py: 1.5 }}>
                                <ListItemIcon><Security fontSize="small" color="primary" /></ListItemIcon>
                                <ListItemText primary="Role" primaryTypographyProps={{ fontWeight: 600 }} />
                            </MenuItem>
                            <MenuItem onClick={handleUserOption} sx={{ py: 1.5 }}>
                                <ListItemIcon><PersonAdd fontSize="small" color="secondary" /></ListItemIcon>
                                <ListItemText primary="User" primaryTypographyProps={{ fontWeight: 600 }} />
                            </MenuItem>
                        </Menu>
                    </Box>
                }
            />

            {/* Assign Roles to User Section */}
            <Box sx={{ mt: 5 }}>
                <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: "20px", background: "rgba(255, 255, 255, 0.35)", backdropFilter: "blur(10px) saturate(150%)", border: "1px solid rgba(255, 255, 255, 0.4)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h6" fontWeight={800} color="#1a237e">Assign Roles</Typography>
                            <Typography variant="body2" color="textSecondary" fontWeight={500}>
                                Managing: <span style={{ color: '#1a237e', fontWeight: 700 }}>{selectedUser ? `${selectedUser.name} (${selectedUser.institutionId})` : "Please select"}</span>
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
                        <TextField 
                            fullWidth 
                            placeholder="Search user to manage..." 
                            size="small" 
                            value={userSearchQuery} 
                            onChange={(e) => setUserSearchQuery(e.target.value)} 
                            onKeyPress={(e) => e.key === "Enter" && handleUserSearch()} 
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", background: "rgba(255, 255, 255, 0.5)", backdropFilter: "blur(5px)" } }} 
                            InputProps={{ startAdornment: (<InputAdornment position="start"><Search fontSize="small" /></InputAdornment>) }} 
                        />
                        <Button variant="contained" onClick={handleUserSearch} disabled={!userSearchQuery || searchingUsers} sx={{ px: 4, borderRadius: "10px", textTransform: "none", fontWeight: 700, bgcolor: "#448AFF" }}>
                            Search
                        </Button>
                    </Box>
                </Paper>

                <Collapse in={hasTypedSearch || searchingUsers}>
                    <Card sx={{ borderRadius: "20px", boxShadow: "0 8px 32px rgba(31, 38, 135, 0.05)", border: "1px solid rgba(255, 255, 255, 0.4)", background: "rgba(255, 255, 255, 0.25)", backdropFilter: "blur(10px) saturate(150%)" }}>
                        <CardContent sx={{ p: 0 }}>
                            <Box sx={{ display: 'flex', minHeight: 450 }}>
                                <Box sx={{ flex: 1, borderRight: "1px solid rgba(0,0,0,0.05)", p: 2 }}>
                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom color="textSecondary">Search Results</Typography>
                                    <List>
                                        {userSearchResults.length > 0 ? userSearchResults.map((user) => (
                                            <ListItem key={user._id} disablePadding sx={{ mb: 1, borderRadius: '12px', overflow: 'hidden', border: selectedUser?._id === user._id ? '1px solid #1a237e' : '1px solid transparent' }}>
                                                <ListItemButton selected={selectedUser?._id === user._id} onClick={() => selectUser(user)} sx={{ p: 2 }}>
                                                    <Avatar sx={{ mr: 2, bgcolor: '#e3f2fd', color: '#1976d2' }}>{user.name.charAt(0)}</Avatar>
                                                    <ListItemText
                                                        primary={user.name}
                                                        secondary={
                                                            <Box sx={{ mt: 0.5 }}>
                                                                <Typography variant="caption" display="block" color="textPrimary" fontWeight={600}>{user.institutionId} — {user.userType}</Typography>
                                                                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                    <Typography variant="caption" color="textSecondary" sx={{ mr: 1, width: '100%' }}>Present Roles:</Typography>
                                                                    {user.roles && user.roles.length > 0 ? user.roles.map(r => (
                                                                        <Chip key={r._id} label={r.name} size="small" deleteIcon={<Delete sx={{ fontSize: '14px !important' }} />} onDelete={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, userId: user._id, roleId: r._id, roleName: r.name, userName: user.name }); }} sx={{ height: 20, fontSize: '10px', bgcolor: '#E3F2FD', color: '#1976D2', fontWeight: roles.find(rl => rl.name === r.name)?.defaultRole ? 700 : 400 }} />
                                                                    )) : <Typography variant="caption" fontStyle="italic">None</Typography>}
                                                                </Box>
                                                            </Box>
                                                        }
                                                        primaryTypographyProps={{ fontWeight: 700, fontSize: '0.95rem' }}
                                                    />
                                                    <ListItemSecondaryAction sx={{ right: 8 }}>
                                                        <IconButton edge="end" onClick={() => selectUser(user)} color={selectedUser?._id === user._id ? "primary" : "default"}><PersonAdd /></IconButton>
                                                    </ListItemSecondaryAction>
                                                </ListItemButton>
                                            </ListItem>
                                        )) : <Box sx={{ textAlign: 'center', py: 5, color: 'text.disabled' }}><People sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} /><Typography variant="body2">No users found.</Typography></Box>}
                                    </List>

                                    {/* HOD Department Selection UI (Under User Card) */}
                                    <Collapse in={!!selectedUser && assignedRoleIds.some(rid => roles.find(r => r._id === rid)?.name === 'HOD')}>
                                        <Box sx={{ mt: 2, p: 2, borderRadius: '15px', bgcolor: '#fff', border: '1px solid #e0e0e0' }}>
                                            <Typography variant="subtitle2" fontWeight={800} color="#1a237e" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Security sx={{ fontSize: 18 }} /> HOD Department Assignment
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                                                Assign this HOD to multiple departments for context-aware access.
                                            </Typography>
                                            
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                                {selectedHodDepts.map(dept => (
                                                    <Chip 
                                                        key={dept._id} 
                                                        label={dept.name} 
                                                        size="small" 
                                                        onDelete={() => setSelectedHodDepts(prev => prev.filter(d => d._id !== dept._id))}
                                                        sx={{ bgcolor: '#ede7f6', color: '#5e35b1', fontWeight: 600 }}
                                                    />
                                                ))}
                                            </Box>

                                            <FormControlLabel
                                                sx={{ width: '100%', m: 0 }}
                                                control={
                                                    <Box sx={{ width: '100%', mt: 1 }}>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 150, overflowY: 'auto', p: 1, border: '1px dashed #ccc', borderRadius: '10px' }}>
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
                                                                        color={isSelected ? "primary" : "default"}
                                                                        size="small"
                                                                        sx={{ cursor: 'pointer', borderRadius: '8px' }}
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

                                <Box sx={{ flex: 1.2, p: 3, background: 'rgba(255, 255, 255, 0.15)', display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom color="textSecondary">{selectedUser ? `Select Roles for ${selectedUser.name}` : "Available Roles"}</Typography>
                                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                                        {loadingRoles ? null : (
                                            <FormGroup>
                                                {roles.length > 0 ? roles.map((role) => {
                                                    const isIdentityDefault = getSystemRoleName(selectedUser) === role.name;
                                                    return (
                                                        <Box key={role._id} onClick={() => handleRoleToggle(role._id)} sx={{ p: 1.5, mb: 1, borderRadius: '12px', bgcolor: 'white', border: '1px solid', borderColor: assignedRoleIds.includes(role._id.toString()) ? 'primary.main' : 'rgba(0,0,0,0.05)', cursor: selectedUser ? 'pointer' : 'default', opacity: selectedUser ? 1 : 0.6, display: 'flex', alignItems: 'center', transition: '0.2s', '&:hover': selectedUser ? { bgcolor: '#fcfdff', borderColor: 'primary.main', transform: 'translateX(5px)' } : {} }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                                <Checkbox checked={assignedRoleIds.includes(role._id.toString())} disabled={!selectedUser} color="primary" sx={{ p: 0, mr: 2 }} />
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Typography variant="body2" fontWeight={700} color={assignedRoleIds.includes(role._id.toString()) ? 'primary.main' : 'inherit'}>{role.name}</Typography>
                                                                        {role.defaultRole && <Chip label="Identity Role" size="small" color="success" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800 }} />}
                                                                        {isIdentityDefault && <Tooltip title="Recommended"><Star sx={{ fontSize: 16, color: '#fbc02d' }} /></Tooltip>}
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
                                            <Button fullWidth variant="contained" startIcon={<Save />} onClick={handleSaveAssignments} disabled={savingRoles} sx={{ borderRadius: '12px', py: 1.5, textTransform: 'none', fontWeight: 800, fontSize: '1rem', bgcolor: '#2e7d32', boxShadow: '0 4px 14px 0 rgba(46, 125, 50, 0.39)' }}>Save Role Assignments</Button>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Collapse>
            </Box>

            {/* Create Role Modal */}
            <Dialog open={isRoleModalOpen} onClose={handleCloseRoleModal} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}>
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={700}>Create New Role</Typography>
                    <IconButton onClick={handleCloseRoleModal} size="small"><Close /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField fullWidth label="Role Name" name="name" value={formData.name} onChange={handleFormChange} size="small" />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseRoleModal}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmitRole} disabled={submitting}>Create Role</Button>
                </DialogActions>
            </Dialog>

            {/* User Choice Modal (Bulk vs Individual) */}
            <Dialog open={isUserChoiceModalOpen} onClose={() => { setIsUserChoiceModalOpen(false); setRegistrationView("selection"); }} maxWidth={registrationView === "selection" ? "sm" : "md"} fullWidth PaperProps={{ sx: { borderRadius: "20px", p: registrationView === "selection" ? 2 : 0 } }}>
                {registrationView === "selection" ? (
                    <>
                        <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
                            <Typography variant="h5" fontWeight={800} color="#1a237e">Add New User</Typography>
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
                                        <Typography variant="caption" color="textSecondary">Upload a CSV file only. Format: name, institutionId, etc.</Typography>
                                    </CardContent>
                                </Card>
                                <Card 
                                    onClick={() => setRegistrationView("individual")}
                                    sx={{ flex: 1, cursor: 'pointer', borderRadius: '18px', border: '2px solid transparent', '&:hover': { borderColor: 'secondary.main', bgcolor: '#fff8f8' }, transition: '0.3s' }}
                                >
                                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                                        <Avatar sx={{ width: 60, height: 60, bgcolor: '#fce4ec', color: '#e91e63', mx: 'auto', mb: 2 }}><Person fontSize="large" /></Avatar>
                                        <Typography variant="h6" fontWeight={700}>Individual</Typography>
                                        <Typography variant="caption" color="textSecondary">Register a single user manually through a form</Typography>
                                    </CardContent>
                                </Card>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                            <Button onClick={() => setIsUserChoiceModalOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>Close</Button>
                        </DialogActions>
                    </>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 4, bgcolor: '#f8f9fa', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="h5" fontWeight={800} color="#1a237e">Individual Registration</Typography>
                                <Typography variant="body2" color="textSecondary">Register a new user by providing their details manually</Typography>
                            </Box>
                            <IconButton onClick={() => setRegistrationView("selection")}><Close /></IconButton>
                        </Box>
                        <Box sx={{ p: 4 }}>
                            {signupError && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{signupError}</Alert>}
                            <Box component="form" sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                                <TextField 
                                    select label="User Type" value={signupData.role} 
                                    onChange={(e) => setSignupData({ ...signupData, role: e.target.value, id: '', fullname: '', department: '', phone: '', email: '' })} 
                                    size="small" fullWidth SelectProps={{ native: true }}
                                >
                                    <option value="Employee">Employee</option>
                                    <option value="Student">Student</option>
                                </TextField>
                                <TextField 
                                    label="Institution ID" value={signupData.id} 
                                    onChange={(e) => setSignupData({ ...signupData, id: e.target.value.toUpperCase() })} 
                                    onBlur={handleUserIdBlur} size="small" fullWidth
                                    helperText={isVerifying ? "Checking ECAP..." : "Type ID and click away to verify"}
                                />
                                <TextField label="Full Name" value={signupData.fullname} onChange={(e) => setSignupData({ ...signupData, fullname: e.target.value })} disabled={disabledFields.fullname} size="small" fullWidth />
                                <TextField label="Email Address" value={signupData.email} onChange={(e) => setSignupData({ ...signupData, email: e.target.value })} disabled={disabledFields.email} size="small" fullWidth />
                                <TextField label="Phone Number" value={signupData.phone} onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })} disabled={disabledFields.phone} size="small" fullWidth placeholder="9876543210" />
                                <TextField label="Department" value={signupData.department} onChange={(e) => setSignupData({ ...signupData, department: e.target.value })} disabled={disabledFields.department} size="small" fullWidth />
                                <TextField label="Designation" value={signupData.designation} onChange={(e) => setSignupData({ ...signupData, designation: e.target.value })} disabled={disabledFields.designation} size="small" fullWidth />
                                <TextField label="Password" type="password" value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} size="small" fullWidth />
                                <TextField label="Confirm Password" type="password" value={signupData.confirmPassword} onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })} size="small" fullWidth />
                            </Box>
                        </Box>
                        <Box sx={{ px: 4, pb: 4, display: 'flex', gap: 2 }}>
                            <Button fullWidth variant="outlined" onClick={() => setRegistrationView("selection")} sx={{ borderRadius: '12px', py: 1.5, textTransform: 'none', fontWeight: 700 }}>Back</Button>
                            <Button 
                                fullWidth variant="contained" 
                                onClick={handleIndividualSubmit} 
                                disabled={isIndividualSubmitting || !isEcapVerified}
                                sx={{ borderRadius: '12px', py: 1.5, textTransform: 'none', fontWeight: 700, bgcolor: '#1a237e' }}
                            >
                                Register User
                            </Button>
                        </Box>
                    </Box>
                )}
            </Dialog>

            {/* Bulk Results Dialog */}
            <Dialog open={!!bulkResults} onClose={() => setBulkResults(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
                <DialogTitle sx={{ bgcolor: '#f8fbfc', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                    <Button fullWidth variant="contained" onClick={() => setBulkResults(null)} sx={{ borderRadius: '12px', py: 1 }}>Done</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ ...deleteConfirm, open: false })} PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Confirm Role Removal</DialogTitle>
                <DialogContent><Typography>Are you sure you want to remove <b>{deleteConfirm.roleName}</b>?</Typography></DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteConfirm({ ...deleteConfirm, open: false })}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteUserMapping} sx={{ borderRadius: '10px' }}>Remove Role</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: "12px" }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default RoleManagement;