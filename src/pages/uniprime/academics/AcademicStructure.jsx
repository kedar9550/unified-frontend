import React, { useState, useEffect } from "react";
import {
    Box, Typography, Button, Card, CardContent, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, CircularProgress, IconButton,
    Tooltip, Divider, Fade, Chip, MenuItem, Select, FormControl, InputLabel,
    Tabs, Tab, Paper, Menu,
    Collapse
} from "@mui/material";
import { toast } from "sonner";
import {
    Add, Edit, Delete, AccountTree, Business, Code, School,
    CheckCircle, Cancel, Warning, ChevronRight, ExpandMore, ExpandLess, Search, MoreVert
} from "@mui/icons-material";
import PageHeader from "../../../components/common/PageHeader";
import API from "../../../api/axios";

const AcademicStructure = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Data State
    const [schools, setSchools] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [branches, setBranches] = useState([]);

    // Modal State
    const [modal, setModal] = useState({ open: false, type: '', mode: 'add', data: {} });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: '', id: null, name: "" });

    // Card Menu State
    const [cardMenu, setCardMenu] = useState({ anchorEl: null, type: '', data: null });

    // Node Expand State
    const [expandedNodes, setExpandedNodes] = useState({});
    
    // Add New Action Dropdown state
    const [addNewAnchor, setAddNewAnchor] = useState(null);

    const handleOpenAddNew = (e) => setAddNewAnchor(e.currentTarget);
    const handleCloseAddNew = () => setAddNewAnchor(null);

    const getLevelColorConfig = (level) => {
        switch (level) {
            case 'PG':
                return { bg: "rgba(2, 132, 199, 0.08)", color: "var(--color-primary)" };
            case 'UG':
                return { bg: "rgba(34, 197, 94, 0.08)", color: "#16a34a" };
            case 'PHD':
                return { bg: "rgba(124, 58, 237, 0.08)", color: "#7c3aed" };
            case 'DIPLOMA':
                return { bg: "rgba(249, 115, 22, 0.08)", color: "#ea580c" };
            case 'CERTIFICATE':
                return { bg: "rgba(234, 179, 8, 0.08)", color: "#ca8a04" };
            default:
                return { bg: "rgba(100, 116, 139, 0.08)", color: "#64748b" };
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [schoolRes, deptRes, progRes, branchRes] = await Promise.all([
                API.get("/api/academics/schools"),
                API.get("/api/academics/departments"),
                API.get("/api/academics/programs"),
                API.get("/api/academics/branches")
            ]);

            setSchools(schoolRes.data.data || []);
            setDepartments(deptRes.data.data || []);
            setPrograms(progRes.data.data || []);
            setBranches(branchRes.data.data || []);
        } catch (error) {
            toast.error("Failed to load academic data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async () => {
        const { type, mode, data } = modal;
        
        // Basic Validations
        if (!data.name?.trim()) { toast.warning("Name is required"); return; }
        if (type !== 'branch' && !data.code?.trim()) { toast.warning("Code is required"); return; }
        if (type === 'program' && !data.type) { toast.warning("Program Level (Type) is required"); return; }
        if (type === 'department' && data.type === 'Academic' && !data.schoolId) { toast.warning("School is required for Academic Departments"); return; }
        if (type === 'branch' && !data.programId) { toast.warning("Program is required for Branches"); return; }
        if (type === 'branch' && !data.departmentId) { toast.warning("Department is required for Branches"); return; }

        setSubmitting(true);
        try {
            let res;
            const pluralType = type === 'branch' ? 'branches' : `${type}s`;
            const endpoint = `/api/academics/${pluralType}`;

            if (mode === 'add') {
                res = await API.post(endpoint, data);
            } else {
                res = await API.put(`${endpoint}/${data._id}`, data);
            }

            if (res.data.success) {
                toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} ${mode === 'add' ? 'added' : 'updated'} successfully!`);
                setModal({ open: false, type: '', mode: 'add', data: {} });
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `Error saving ${type}.`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setSubmitting(true);
        try {
            const pluralType = deleteConfirm.type === 'branch' ? 'branches' : `${deleteConfirm.type}s`;
            const res = await API.delete(`/api/academics/${pluralType}/${deleteConfirm.id}`);
            if (res.data.success) {
                toast.success(`${deleteConfirm.type.charAt(0).toUpperCase() + deleteConfirm.type.slice(1)} deleted successfully.`);
                setDeleteConfirm({ open: false, type: '', id: null, name: "" });
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Error deleting item.");
        } finally {
            setSubmitting(false);
        }
    };

    const openModal = (type, mode = 'add', data = {}) => {
        const modalData = { ...data };
        setModal({ open: true, type, mode, data: modalData });
    };

    const toggleNode = (key) => {
        setExpandedNodes(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // --- Search & Traversal Matching Logic ---
    const getSearchMatches = () => {
        if (!searchQuery.trim()) {
            return {
                matches: null,
                autoExpandKeys: {}
            };
        }

        const query = searchQuery.toLowerCase().trim();
        const matches = {
            schools: new Set(),
            programs: new Set(),
            departments: new Set(),
            branches: new Set()
        };
        const autoExpandKeys = {};

        // Find direct matches
        branches.forEach(b => {
            if (b.name.toLowerCase().includes(query) || b.code.toLowerCase().includes(query)) {
                matches.branches.add(b._id);
            }
        });

        departments.forEach(d => {
            if (d.name.toLowerCase().includes(query) || d.code.toLowerCase().includes(query)) {
                matches.departments.add(d._id);
            }
        });

        programs.forEach(p => {
            if (p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query)) {
                matches.programs.add(p._id);
            }
        });

        schools.forEach(s => {
            if (s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query)) {
                matches.schools.add(s._id);
            }
        });

        // Traverse upwards to ensure all matched nodes are visible and expanded
        schools.forEach(school => {
            const schoolDepts = departments.filter(d => (d.schoolId?._id || d.schoolId) === school._id);
            const schoolBranches = branches.filter(b => schoolDepts.some(d => d._id === (b.departmentId?._id || b.departmentId)));
            const schoolProgramIds = [...new Set(schoolBranches.map(b => b.programId?._id || b.programId))];

            let schoolHasMatch = matches.schools.has(school._id);

            schoolProgramIds.forEach(pId => {
                const progBranches = schoolBranches.filter(b => (b.programId?._id || b.programId) === pId);
                const progDepts = schoolDepts.filter(d => progBranches.some(b => (b.departmentId?._id || b.departmentId) === d._id));

                let programHasMatch = matches.programs.has(pId);

                progDepts.forEach(dept => {
                    const deptProgBranches = progBranches.filter(b => (b.departmentId?._id || b.departmentId) === dept._id);

                    const hasMatchingBranch = deptProgBranches.some(b => matches.branches.has(b._id));
                    const hasMatchingDept = matches.departments.has(dept._id);

                    if (hasMatchingBranch || hasMatchingDept) {
                        matches.departments.add(dept._id);
                        matches.programs.add(pId);
                        matches.schools.add(school._id);
                        schoolHasMatch = true;
                        programHasMatch = true;

                        autoExpandKeys[`school-${school._id}`] = true;
                        autoExpandKeys[`school-${school._id}-prog-${pId}`] = true;
                        autoExpandKeys[`school-${school._id}-prog-${pId}-dept-${dept._id}`] = true;
                    }
                });

                // Check for departments matching in this program
                const deptDirectMatch = progDepts.some(d => matches.departments.has(d._id));
                if (programHasMatch || deptDirectMatch) {
                    matches.programs.add(pId);
                    matches.schools.add(school._id);
                    schoolHasMatch = true;
                    autoExpandKeys[`school-${school._id}`] = true;
                    autoExpandKeys[`school-${school._id}-prog-${pId}`] = true;
                }
            });

            // Also check unassigned departments for direct matches
            const unassignedDepts = schoolDepts.filter(d => !branches.some(b => (b.departmentId?._id || b.departmentId) === d._id));
            const hasUnassignedMatch = unassignedDepts.some(d => matches.departments.has(d._id));
            if (hasUnassignedMatch) {
                matches.schools.add(school._id);
                schoolHasMatch = true;
                autoExpandKeys[`school-${school._id}`] = true;
                autoExpandKeys[`school-${school._id}-unassigned`] = true;
            }

            if (schoolHasMatch) {
                matches.schools.add(school._id);
            }
        });

        return { matches, autoExpandKeys };
    };

    const getAllExpandableKeys = () => {
        const keys = [];
        schools.forEach(s => {
            keys.push(`school-${s._id}`);
            keys.push(`school-${s._id}-unassigned`);

            const schoolDepts = departments.filter(d => (d.schoolId?._id || d.schoolId) === s._id);
            const schoolBranches = branches.filter(b => schoolDepts.some(d => d._id === (b.departmentId?._id || b.departmentId)));
            const schoolProgramIds = [...new Set(schoolBranches.map(b => b.programId?._id || b.programId))];

            schoolProgramIds.forEach(pId => {
                keys.push(`school-${s._id}-prog-${pId}`);
                
                const progBranches = schoolBranches.filter(b => (b.programId?._id || b.programId) === pId);
                const progDepts = schoolDepts.filter(d => progBranches.some(b => (b.departmentId?._id || b.departmentId) === d._id));
                
                progDepts.forEach(dept => {
                    keys.push(`school-${s._id}-prog-${pId}-dept-${dept._id}`);
                });
            });
        });
        return keys;
    };

    const isAllExpanded = () => {
        const allKeys = getAllExpandableKeys();
        if (allKeys.length === 0) return false;
        return allKeys.every(k => !!expandedNodes[k]);
    };

    const toggleExpandAll = () => {
        if (isAllExpanded()) {
            setExpandedNodes({});
        } else {
            const newExpanded = {};
            getAllExpandableKeys().forEach(k => { newExpanded[k] = true; });
            setExpandedNodes(newExpanded);
        }
    };

    // --- Tab Content Renderers ---

    const renderSchoolsTree = () => {
        const { matches, autoExpandKeys } = getSearchMatches();
        const filteredSchools = schools.filter(s => !matches || matches.schools.has(s._id));

        if (filteredSchools.length === 0) {
            return (
                <Box sx={{ textAlign: "center", py: 8 }}>
                    <Typography color="textSecondary">No academic structure elements match your search.</Typography>
                </Box>
            );
        }

        return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {filteredSchools.map(school => {
                    const schoolDepts = departments.filter(d => (d.schoolId?._id || d.schoolId) === school._id);
                    const schoolBranches = branches.filter(b => schoolDepts.some(d => d._id === (b.departmentId?._id || b.departmentId)));
                    
                    const schoolProgramIds = [...new Set(schoolBranches.map(b => b.programId?._id || b.programId))];
                    const schoolProgs = programs.filter(p => schoolProgramIds.includes(p._id) && (!matches || matches.programs.has(p._id)));
                    
                    const unassignedDepts = schoolDepts.filter(d => !branches.some(b => (b.departmentId?._id || b.departmentId) === d._id) && (!matches || matches.departments.has(d._id)));

                    const isExpanded = !!expandedNodes[`school-${school._id}`] || (searchQuery.trim() && !!autoExpandKeys[`school-${school._id}`]);

                    return (
                        <Paper key={school._id} variant="outlined" sx={{ borderRadius: "16px", border: "1px solid var(--border-color)", background: "var(--bg-glass)", overflow: "hidden" }}>
                            {/* School Header Row */}
                            <Box sx={{
                                p: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: "pointer",
                                background: isExpanded ? "rgba(0, 0, 0, 0.01)" : "transparent",
                                "&:hover": { background: "rgba(0, 0, 0, 0.03)" },
                                transition: "background 0.2s"
                            }} onClick={() => toggleNode(`school-${school._id}`)}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <IconButton size="small" sx={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                                        <ChevronRight fontSize="small" />
                                    </IconButton>
                                    <Box sx={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(2, 132, 199, 0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Business sx={{ color: "var(--color-primary)", fontSize: 20 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={700} color="var(--text-primary)">
                                            {school.name} <Typography component="span" variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>({school.code})</Typography>
                                        </Typography>
                                        <Box sx={{ display: "flex", gap: 1.5, mt: 0.2, flexWrap: "wrap" }}>
                                            <Typography variant="caption" color="textSecondary">{schoolProgs.length} Programs</Typography>
                                            <Typography variant="caption" color="textSecondary">•</Typography>
                                            <Typography variant="caption" color="textSecondary">{schoolDepts.length} Departments</Typography>
                                            <Typography variant="caption" color="textSecondary">•</Typography>
                                            <Typography variant="caption" color="textSecondary">{schoolBranches.length} Branches</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box sx={{ display: "flex", gap: 0.5 }} onClick={e => e.stopPropagation()}>
                                    <IconButton size="small" onClick={() => openModal('department', 'add', { type: 'Academic', schoolId: school._id })} sx={{ color: 'var(--color-primary)' }} title="Add Department to School"><Add fontSize="small" /></IconButton>
                                    <IconButton size="small" onClick={() => openModal('school', 'edit', school)} sx={{ color: "var(--text-secondary)" }}><Edit fontSize="small" /></IconButton>
                                    <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, type: 'school', id: school._id, name: school.name })} sx={{ color: "var(--text-secondary)" }}><Delete fontSize="small" /></IconButton>
                                </Box>
                            </Box>

                            {/* Programs collapsible container */}
                            <Collapse in={isExpanded}>
                                <Box sx={{ pl: 4, pr: 2, pb: 2, pt: 1, borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: 1.5 }}>
                                    {schoolProgs.length === 0 && unassignedDepts.length === 0 && (
                                        <Typography variant="body2" color="textSecondary" sx={{ py: 1.5, pl: 2, fontStyle: "italic" }}>
                                            No active academic structures found. Click Quick Actions to add departments or branches.
                                        </Typography>
                                    )}

                                    {schoolProgs.map(prog => {
                                        const progBranches = schoolBranches.filter(b => (b.programId?._id || b.programId) === prog._id);
                                        const progDepts = schoolDepts.filter(d => progBranches.some(b => (b.departmentId?._id || b.departmentId) === d._id) && (!matches || matches.departments.has(d._id)));

                                        const isProgExpanded = !!expandedNodes[`school-${school._id}-prog-${prog._id}`] || (searchQuery.trim() && !!autoExpandKeys[`school-${school._id}-prog-${prog._id}`]);

                                        return (
                                            <Box key={prog._id} sx={{ display: "flex", flexDirection: "column" }}>
                                                {/* Program Node */}
                                                <Box sx={{
                                                    p: 1,
                                                    px: 1.5,
                                                    borderRadius: "8px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    cursor: "pointer",
                                                    background: "transparent",
                                                    "&:hover": { background: "rgba(0, 0, 0, 0.03)" },
                                                    transition: "background 0.2s"
                                                }} onClick={() => toggleNode(`school-${school._id}-prog-${prog._id}`)}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                        <IconButton size="small" sx={{ transform: isProgExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", p: 0.2 }}>
                                                            <ChevronRight fontSize="small" />
                                                        </IconButton>
                                                        <School sx={{ color: "#16a34a", fontSize: 18 }} />
                                                        <Typography variant="body2" fontWeight={700} color="var(--text-primary)">
                                                            {prog.name} <Chip label={prog.code} size="small" sx={{ ml: 1, height: 18, fontSize: "0.65rem", fontWeight: 700 }} />
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            ({progDepts.length} Departments, {progBranches.length} Branches)
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: "flex", gap: 0.5 }} onClick={e => e.stopPropagation()}>
                                                        <IconButton size="small" onClick={() => openModal('program', 'edit', prog)} sx={{ color: "var(--text-secondary)" }}><Edit sx={{ fontSize: 16 }} /></IconButton>
                                                    </Box>
                                                </Box>

                                                {/* Departments collapsible container */}
                                                <Collapse in={isProgExpanded}>
                                                    <Box sx={{ pl: 3.5, borderLeft: "1px dashed var(--border-color)", ml: 2, mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                                                        {progDepts.map(dept => {
                                                            const deptProgBranches = progBranches.filter(b => (b.departmentId?._id || b.departmentId) === dept._id && (!matches || matches.branches.has(b._id)));
                                                            
                                                            const isDeptExpanded = !!expandedNodes[`school-${school._id}-prog-${prog._id}-dept-${dept._id}`] || (searchQuery.trim() && !!autoExpandKeys[`school-${school._id}-prog-${prog._id}-dept-${dept._id}`]);

                                                            return (
                                                                <Box key={dept._id} sx={{ display: "flex", flexDirection: "column" }}>
                                                                    {/* Department Node */}
                                                                    <Box sx={{
                                                                        p: 0.8,
                                                                        px: 1.5,
                                                                        borderRadius: "6px",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "space-between",
                                                                        cursor: "pointer",
                                                                        background: "transparent",
                                                                        "&:hover": { background: "rgba(0, 0, 0, 0.03)" },
                                                                        transition: "background 0.2s"
                                                                    }} onClick={() => toggleNode(`school-${school._id}-prog-${prog._id}-dept-${dept._id}`)}>
                                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                                            <IconButton size="small" sx={{ transform: isDeptExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", p: 0.2 }}>
                                                                                <ChevronRight fontSize="small" />
                                                                            </IconButton>
                                                                            <AccountTree sx={{ color: "#7c3aed", fontSize: 18 }} />
                                                                            <Typography variant="body2" fontWeight={600} color="var(--text-primary)">
                                                                                {dept.name} <Chip label={dept.code} size="small" variant="outlined" sx={{ ml: 1, height: 18, fontSize: "0.65rem", fontWeight: 700 }} />
                                                                            </Typography>
                                                                            <Typography variant="caption" color="textSecondary">
                                                                                ({deptProgBranches.length} Branches)
                                                                            </Typography>
                                                                        </Box>
                                                                        <Box sx={{ display: "flex", gap: 0.5 }} onClick={e => e.stopPropagation()}>
                                                                            <IconButton size="small" onClick={() => openModal('branch', 'add', { departmentId: dept._id, programId: prog._id })} sx={{ color: "var(--color-primary)" }} title="Add Branch under this Department"><Add sx={{ fontSize: 16 }} /></IconButton>
                                                                            <IconButton size="small" onClick={() => openModal('department', 'edit', dept)} sx={{ color: "var(--text-secondary)" }}><Edit sx={{ fontSize: 16 }} /></IconButton>
                                                                        </Box>
                                                                    </Box>

                                                                    {/* Branches collapsible container */}
                                                                    <Collapse in={isDeptExpanded}>
                                                                        <Box sx={{ pl: 3.5, borderLeft: "1px dashed var(--border-color)", ml: 2, mt: 1, display: "flex", flexDirection: "column", gap: 0.8 }}>
                                                                            {deptProgBranches.map(branch => (
                                                                                <Box key={branch._id} sx={{
                                                                                    p: 0.6,
                                                                                    px: 1.5,
                                                                                    borderRadius: "6px",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "space-between",
                                                                                    background: "transparent",
                                                                                    "&:hover": { background: "rgba(0, 0, 0, 0.02)" },
                                                                                    transition: "background 0.2s"
                                                                                }}>
                                                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                                                        <Code sx={{ color: "#0891b2", fontSize: 16 }} />
                                                                                        <Typography variant="body2" fontWeight={500} color="var(--text-primary)">
                                                                                            {branch.name}
                                                                                        </Typography>
                                                                                        <Chip label={branch.code} size="small" sx={{ height: 18, fontSize: "0.6rem", background: "var(--gradient-primary)", color: "white", fontWeight: 700 }} />
                                                                                        {branch.status !== false ? (
                                                                                            <Chip label="Active" size="small" color="success" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 800 }} />
                                                                                        ) : (
                                                                                            <Chip label="Inactive" size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 800 }} />
                                                                                        )}
                                                                                    </Box>
                                                                                    <Box sx={{ display: "flex", gap: 0.5 }}>
                                                                                        <IconButton size="small" onClick={() => openModal('branch', 'edit', branch)} sx={{ color: "var(--text-secondary)" }}><Edit sx={{ fontSize: 14 }} /></IconButton>
                                                                                        <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, type: 'branch', id: branch._id, name: branch.name })} sx={{ color: "var(--text-secondary)" }}><Delete sx={{ fontSize: 14 }} /></IconButton>
                                                                                    </Box>
                                                                                </Box>
                                                                            ))}
                                                                        </Box>
                                                                    </Collapse>
                                                                </Box>
                                                            );
                                                        })}
                                                    </Box>
                                                </Collapse>
                                            </Box>
                                        );
                                    })}

                                    {/* School Unassigned Departments */}
                                    {unassignedDepts.length > 0 && (
                                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                                            <Box sx={{
                                                p: 1,
                                                px: 1.5,
                                                borderRadius: "8px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                cursor: "pointer",
                                                background: "transparent",
                                                "&:hover": { background: "rgba(249, 115, 22, 0.05)" },
                                                transition: "background 0.2s"
                                            }} onClick={() => toggleNode(`school-${school._id}-unassigned`)}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                    <IconButton size="small" sx={{ transform: !!expandedNodes[`school-${school._id}-unassigned`] ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", p: 0.2 }}>
                                                        <ChevronRight fontSize="small" />
                                                    </IconButton>
                                                    <Business sx={{ color: "#f97316", fontSize: 18 }} />
                                                    <Typography variant="body2" fontWeight={700} color="#f97316">
                                                        Unassigned Departments
                                                    </Typography>
                                                    <Chip label={`${unassignedDepts.length} Pending`} size="small" color="warning" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }} />
                                                </Box>
                                            </Box>

                                            <Collapse in={!!expandedNodes[`school-${school._id}-unassigned`]}>
                                                <Box sx={{ pl: 3.5, borderLeft: "1px dashed #f97316", ml: 2, mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                                                    {unassignedDepts.map(dept => (
                                                        <Box key={dept._id} sx={{
                                                            p: 0.8,
                                                            px: 1.5,
                                                            borderRadius: "6px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            background: "transparent",
                                                            "&:hover": { background: "rgba(249, 115, 22, 0.02)" },
                                                            transition: "background 0.2s"
                                                        }}>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                                <AccountTree sx={{ color: "#f97316", fontSize: 16 }} />
                                                                <Typography variant="body2" fontWeight={600} color="var(--text-primary)">
                                                                    {dept.name} <Chip label={dept.code} size="small" variant="outlined" color="warning" sx={{ ml: 1, height: 18, fontSize: "0.6rem", fontWeight: 700 }} />
                                                                </Typography>
                                                                <Typography variant="caption" color="textSecondary" sx={{ fontStyle: "italic" }}>
                                                                    (No branches created yet)
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ display: "flex", gap: 0.5 }}>
                                                                <IconButton size="small" onClick={() => openModal('branch', 'add', { departmentId: dept._id })} sx={{ color: "#f97316" }} title="Create Branch & Link Program"><Add sx={{ fontSize: 16 }} /></IconButton>
                                                                <IconButton size="small" onClick={() => openModal('department', 'edit', dept)} sx={{ color: "var(--text-secondary)" }}><Edit sx={{ fontSize: 14 }} /></IconButton>
                                                                <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, type: 'department', id: dept._id, name: dept.name })} sx={{ color: "var(--text-secondary)" }}><Delete sx={{ fontSize: 14 }} /></IconButton>
                                                            </Box>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Collapse>
                                        </Box>
                                    )}
                                </Box>
                            </Collapse>
                        </Paper>
                    );
                })}
            </Box>
        );
    };

    const renderProgramsView = () => {
        const { matches } = getSearchMatches();
        const filteredPrograms = programs.filter(p => !matches || matches.programs.has(p._id));

        if (filteredPrograms.length === 0) {
            return (
                <Box sx={{ textAlign: "center", py: 8 }}>
                    <Typography color="textSecondary">No programs match your search.</Typography>
                </Box>
            );
        }

        return (
            <Box sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                gap: 3
            }}>
                {filteredPrograms.map(prog => {
                    const progBranches = branches.filter(b => (b.programId?._id || b.programId) === prog._id);
                    const progDepts = departments.filter(d => progBranches.some(b => (b.departmentId?._id || b.departmentId) === d._id));
                    const progSchoolIds = [...new Set(progDepts.map(d => d.schoolId?._id || d.schoolId).filter(Boolean))];
                    const progSchools = schools.filter(s => progSchoolIds.includes(s._id));
                    const colors = getLevelColorConfig(prog.type);

                    return (
                        <Card key={prog._id} variant="outlined" sx={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            borderRadius: "16px",
                            background: "var(--bg-glass)",
                            borderColor: "var(--border-color)",
                            "&:hover": { borderColor: "var(--color-primary)", transform: "translateY(-2px)" },
                            transition: "all 0.2s",
                            position: "relative",
                            p: 2.5
                        }}>
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 1.5 }}>
                                <Box sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    background: colors.bg
                                }}>
                                    <School sx={{ color: colors.color, fontSize: 22 }} />
                                </Box>

                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                    <Typography variant="subtitle1" fontWeight={800} color="var(--text-primary)" sx={{ lineHeight: 1.2, mb: 0.2, pr: 2, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                        {prog.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                                        ({prog.code})
                                    </Typography>
                                </Box>

                                <IconButton
                                    size="small"
                                    onClick={(e) => setCardMenu({ anchorEl: e.currentTarget, type: 'program', data: prog })}
                                    sx={{ position: "absolute", top: 12, right: 12, color: "var(--text-secondary)" }}
                                >
                                    <MoreVert fontSize="small" />
                                </IconButton>
                            </Box>

                            <Box sx={{ flexGrow: 1, mb: 2 }}>
                                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
                                    <Chip
                                        label={prog.type}
                                        size="small"
                                        sx={{
                                            height: 22,
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            background: colors.bg,
                                            color: colors.color,
                                            border: "none"
                                        }}
                                    />
                                    <Chip
                                        label={`${prog.durationYears || 4} Years`}
                                        size="small"
                                        sx={{
                                            height: 22,
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            background: "rgba(34, 197, 94, 0.08)",
                                            color: "#16a34a",
                                            border: "none"
                                        }}
                                    />
                                    <Chip
                                        label={prog.programPattern === "YEAR" ? "Annual" : "Semester Wise"}
                                        size="small"
                                        sx={{
                                            height: 22,
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            background: "rgba(124, 58, 237, 0.08)",
                                            color: "#7c3aed",
                                            border: "none"
                                        }}
                                    />
                                </Box>
                                <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.85rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                    {prog.description || "No description provided."}
                                </Typography>
                            </Box>

                            <Divider sx={{ opacity: 0.5, mb: 1.5 }} />

                            <Box sx={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr 1fr", gap: 1, alignItems: "center" }}>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, display: "block", mb: 0.2 }}>
                                        School
                                    </Typography>
                                    <Typography variant="body2" fontWeight={700} color="var(--text-primary)" sx={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                        {progSchools.length > 0 ? progSchools[0].name : "None"}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, display: "block", mb: 0.2 }}>
                                        Departments
                                    </Typography>
                                    <Typography variant="body2" fontWeight={700} color="var(--text-primary)">
                                        {progDepts.length}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, display: "block", mb: 0.2 }}>
                                        Status
                                    </Typography>
                                    <Chip
                                        label="Active"
                                        size="small"
                                        sx={{
                                            height: 20,
                                            fontSize: "0.65rem",
                                            fontWeight: 700,
                                            background: "rgba(34, 197, 94, 0.08)",
                                            color: "#16a34a",
                                            border: "none"
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Card>
                    );
                })}
            </Box>
        );
    };

    const [expandedDepts, setExpandedDepts] = useState({});

    const toggleDept = (id) => {
        setExpandedDepts(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const renderDepartmentsView = () => {
        const { matches } = getSearchMatches();
        const filteredDepts = departments.filter(d => !matches || matches.departments.has(d._id));

        if (filteredDepts.length === 0) {
            return (
                <Box sx={{ textAlign: "center", py: 8 }}>
                    <Typography color="textSecondary">No departments match your search.</Typography>
                </Box>
            );
        }

        const academicDepts = filteredDepts.filter(d => d.type !== "Central");
        const centralDepts = filteredDepts.filter(d => d.type === "Central");

        const getDeptTypeColors = (type) => {
            if (type === "Central") {
                return { bg: "rgba(244, 63, 94, 0.08)", color: "#f43f5e" };
            }
            return { bg: "rgba(124, 58, 237, 0.08)", color: "#7c3aed" };
        };

        return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {academicDepts.length > 0 && (
                    <Box>
                        <Typography variant="subtitle1" fontWeight={800} color="var(--text-primary)" sx={{ mb: 2 }}>
                            Academic Departments
                        </Typography>
                        <Box sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                            gap: 3
                        }}>
                            {academicDepts.map(dept => {
                                const deptBranches = branches.filter(b => (b.departmentId?._id || b.departmentId) === dept._id);
                                const school = schools.find(s => s._id === (dept.schoolId?._id || dept.schoolId));
                                const isDeptExpanded = !!expandedDepts[dept._id];
                                const colors = getDeptTypeColors(dept.type);

                                return (
                                    <Card key={dept._id} variant="outlined" sx={{
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        borderRadius: "16px",
                                        background: "var(--bg-glass)",
                                        borderColor: "var(--border-color)",
                                        "&:hover": { borderColor: "var(--color-primary)", transform: "translateY(-2px)" },
                                        transition: "all 0.2s",
                                        position: "relative",
                                        p: 2.5
                                    }}>
                                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 1.5 }}>
                                            <Box sx={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: "50%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                                background: colors.bg
                                            }}>
                                                <AccountTree sx={{ color: colors.color, fontSize: 22 }} />
                                            </Box>

                                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                <Typography variant="subtitle1" fontWeight={800} color="var(--text-primary)" sx={{ lineHeight: 1.2, mb: 0.2, pr: 2, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                                    {dept.name}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                                                    ({dept.code})
                                                </Typography>
                                            </Box>

                                            <IconButton
                                                size="small"
                                                onClick={(e) => setCardMenu({ anchorEl: e.currentTarget, type: 'department', data: dept })}
                                                sx={{ position: "absolute", top: 12, right: 12, color: "var(--text-secondary)" }}
                                            >
                                                <MoreVert fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ flexGrow: 1, mb: 2 }}>
                                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
                                                <Chip
                                                    label="Academic"
                                                    size="small"
                                                    sx={{
                                                        height: 22,
                                                        fontSize: "0.7rem",
                                                        fontWeight: 700,
                                                        background: colors.bg,
                                                        color: colors.color,
                                                        border: "none"
                                                    }}
                                                />
                                                {school && (
                                                    <Chip
                                                        label={school.code}
                                                        size="small"
                                                        sx={{
                                                            height: 22,
                                                            fontSize: "0.7rem",
                                                            fontWeight: 700,
                                                            background: "rgba(2, 132, 199, 0.08)",
                                                            color: "var(--color-primary)",
                                                            border: "none"
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                            <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.85rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                {dept.description || "Academic department under school."}
                                            </Typography>
                                        </Box>

                                        <Divider sx={{ opacity: 0.5, mb: 1.5 }} />

                                        <Box sx={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr 1fr", gap: 1, alignItems: "center" }}>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, display: "block", mb: 0.2 }}>
                                                    School
                                                </Typography>
                                                <Typography variant="body2" fontWeight={700} color="var(--text-primary)" sx={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                                    {school ? school.name : "None"}
                                                </Typography>
                                            </Box>
                                            <Box 
                                                onClick={() => deptBranches.length > 0 && toggleDept(dept._id)} 
                                                sx={{ cursor: deptBranches.length > 0 ? "pointer" : "default" }}
                                            >
                                                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, display: "block", mb: 0.2 }}>
                                                    Branches
                                                </Typography>
                                                <Typography variant="body2" fontWeight={700} color="var(--color-primary)" sx={{ display: "flex", alignItems: "center", gap: 0.2 }}>
                                                    {deptBranches.length} {deptBranches.length > 0 && (isDeptExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />)}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, display: "block", mb: 0.2 }}>
                                                    Status
                                                </Typography>
                                                <Chip
                                                    label="Active"
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: "0.65rem",
                                                        fontWeight: 700,
                                                        background: "rgba(34, 197, 94, 0.08)",
                                                        color: "#16a34a",
                                                        border: "none"
                                                    }}
                                                />
                                            </Box>
                                        </Box>

                                        <Collapse in={isDeptExpanded}>
                                            <Divider sx={{ my: 1.5, opacity: 0.5 }} />
                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                                {deptBranches.map(branch => {
                                                    const prog = programs.find(p => p._id === (branch.programId?._id || branch.programId));
                                                    return (
                                                        <Box key={branch._id} sx={{
                                                            p: 1,
                                                            px: 1.5,
                                                            borderRadius: "8px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            background: "rgba(0, 0, 0, 0.02)",
                                                            border: "1px solid var(--border-color)",
                                                            fontSize: "0.85rem"
                                                        }}>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                                                <Typography variant="body2" fontWeight={600} color="var(--text-primary)" sx={{ fontSize: "0.85rem" }}>
                                                                    {branch.name}
                                                                </Typography>
                                                                <Chip label={branch.code} size="small" sx={{ height: 16, fontSize: "0.6rem", fontWeight: 700 }} />
                                                                {prog && (
                                                                    <Chip label={prog.code} size="small" variant="outlined" sx={{ height: 16, fontSize: "0.6rem", color: "var(--color-primary)", borderColor: "var(--color-primary)", fontWeight: 700 }} />
                                                                )}
                                                                {branch.status === false && (
                                                                    <Chip label="Inactive" size="small" sx={{ height: 16, fontSize: "0.6rem", fontWeight: 800 }} />
                                                                )}
                                                            </Box>
                                                            <Box sx={{ display: "flex", gap: 0.5 }}>
                                                                <IconButton size="small" onClick={() => openModal('branch', 'edit', branch)} sx={{ color: "var(--text-secondary)", p: 0.5 }}><Edit sx={{ fontSize: 14 }} /></IconButton>
                                                                <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, type: 'branch', id: branch._id, name: branch.name })} sx={{ color: "var(--text-secondary)", p: 0.5 }}><Delete sx={{ fontSize: 14 }} /></IconButton>
                                                            </Box>
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        </Collapse>
                                    </Card>
                                );
                            })}
                        </Box>
                    </Box>
                )}

                {centralDepts.length > 0 && (
                    <Box>
                        <Typography variant="subtitle1" fontWeight={800} color="var(--text-primary)" sx={{ mb: 2 }}>
                            Central Level Departments
                        </Typography>
                        <Box sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                            gap: 3
                        }}>
                            {centralDepts.map(dept => {
                                const deptBranches = branches.filter(b => (b.departmentId?._id || b.departmentId) === dept._id);
                                const isDeptExpanded = !!expandedDepts[dept._id];
                                const colors = getDeptTypeColors(dept.type);

                                return (
                                    <Card key={dept._id} variant="outlined" sx={{
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        borderRadius: "16px",
                                        background: "var(--bg-glass)",
                                        borderColor: "var(--border-color)",
                                        "&:hover": { borderColor: "var(--color-primary)", transform: "translateY(-2px)" },
                                        transition: "all 0.2s",
                                        position: "relative",
                                        p: 2.5
                                    }}>
                                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 1.5 }}>
                                            <Box sx={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: "50%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                                background: colors.bg
                                            }}>
                                                <Business sx={{ color: colors.color, fontSize: 22 }} />
                                            </Box>

                                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                <Typography variant="subtitle1" fontWeight={800} color="var(--text-primary)" sx={{ lineHeight: 1.2, mb: 0.2, pr: 2, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                                    {dept.name}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                                                    ({dept.code})
                                                </Typography>
                                            </Box>

                                            <IconButton
                                                size="small"
                                                onClick={(e) => setCardMenu({ anchorEl: e.currentTarget, type: 'department', data: dept })}
                                                sx={{ position: "absolute", top: 12, right: 12, color: "var(--text-secondary)" }}
                                            >
                                                <MoreVert fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ flexGrow: 1, mb: 2 }}>
                                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
                                                <Chip
                                                    label="Central"
                                                    size="small"
                                                    sx={{
                                                        height: 22,
                                                        fontSize: "0.7rem",
                                                        fontWeight: 700,
                                                        background: colors.bg,
                                                        color: colors.color,
                                                        border: "none"
                                                    }}
                                                />
                                            </Box>
                                            <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.85rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                {dept.description || "Operates at the central level."}
                                            </Typography>
                                        </Box>

                                        <Divider sx={{ opacity: 0.5, mb: 1.5 }} />

                                        <Box sx={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr 1fr", gap: 1, alignItems: "center" }}>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, display: "block", mb: 0.2 }}>
                                                    School
                                                </Typography>
                                                <Typography variant="body2" fontWeight={700} color="var(--text-primary)">
                                                    Central Level
                                                </Typography>
                                            </Box>
                                            <Box 
                                                onClick={() => deptBranches.length > 0 && toggleDept(dept._id)} 
                                                sx={{ cursor: deptBranches.length > 0 ? "pointer" : "default" }}
                                            >
                                                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, display: "block", mb: 0.2 }}>
                                                    Branches
                                                </Typography>
                                                <Typography variant="body2" fontWeight={700} color="var(--color-primary)" sx={{ display: "flex", alignItems: "center", gap: 0.2 }}>
                                                    {deptBranches.length} {deptBranches.length > 0 && (isDeptExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />)}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 500, display: "block", mb: 0.2 }}>
                                                    Status
                                                </Typography>
                                                <Chip
                                                    label="Active"
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: "0.65rem",
                                                        fontWeight: 700,
                                                        background: "rgba(34, 197, 94, 0.08)",
                                                        color: "#16a34a",
                                                        border: "none"
                                                    }}
                                                />
                                            </Box>
                                        </Box>

                                        <Collapse in={isDeptExpanded}>
                                            <Divider sx={{ my: 1.5, opacity: 0.5 }} />
                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                                {deptBranches.map(branch => {
                                                    const prog = programs.find(p => p._id === (branch.programId?._id || branch.programId));
                                                    return (
                                                        <Box key={branch._id} sx={{
                                                            p: 1,
                                                            px: 1.5,
                                                            borderRadius: "8px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            background: "rgba(0, 0, 0, 0.02)",
                                                            border: "1px solid var(--border-color)",
                                                            fontSize: "0.85rem"
                                                        }}>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                                                <Typography variant="body2" fontWeight={600} color="var(--text-primary)" sx={{ fontSize: "0.85rem" }}>
                                                                    {branch.name}
                                                                </Typography>
                                                                <Chip label={branch.code} size="small" sx={{ height: 16, fontSize: "0.6rem", fontWeight: 700 }} />
                                                                {prog && (
                                                                    <Chip label={prog.code} size="small" variant="outlined" sx={{ height: 16, fontSize: "0.6rem", color: "var(--color-primary)", borderColor: "var(--color-primary)", fontWeight: 700 }} />
                                                                )}
                                                                {branch.status === false && (
                                                                    <Chip label="Inactive" size="small" sx={{ height: 16, fontSize: "0.6rem", fontWeight: 800 }} />
                                                                )}
                                                            </Box>
                                                            <Box sx={{ display: "flex", gap: 0.5 }}>
                                                                <IconButton size="small" onClick={() => openModal('branch', 'edit', branch)} sx={{ color: "var(--text-secondary)", p: 0.5 }}><Edit sx={{ fontSize: 14 }} /></IconButton>
                                                                <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, type: 'branch', id: branch._id, name: branch.name })} sx={{ color: "var(--text-secondary)", p: 0.5 }}><Delete sx={{ fontSize: 14 }} /></IconButton>
                                                            </Box>
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        </Collapse>
                                    </Card>
                                );
                            })}
                        </Box>
                    </Box>
                )}
            </Box>
        );
    };

    return (
        <Box>
            <PageHeader
                title="Academic Structure"
                subtitle="Configure Departments, Programs, and Branches for the University"
                breadcrumbs={["Home", "UniPrime", "Academics", "Structure"]}
            />

            {/* Dashboard Action Header */}
            <Box sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "stretch", md: "center" },
                gap: 2,
                mb: 4
            }}>
                <Box>
                    <Typography variant="subtitle2" sx={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                        Manage academic hierarchy or search details across all tabs.
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 2, alignItems: "center", width: { xs: "100%", md: "auto" } }}>
                    <TextField
                        size="small"
                        placeholder="Search academic structure..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <Search fontSize="small" sx={{ mr: 1, color: "var(--text-secondary)" }} />,
                            endAdornment: searchQuery && (
                                <IconButton size="small" onClick={() => setSearchQuery("")}>
                                    <Cancel fontSize="small" />
                                </IconButton>
                            )
                        }}
                        sx={{
                            flexGrow: { xs: 1, md: 0 },
                            width: { md: 280 },
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "50px",
                                background: "var(--bg-glass)",
                                "& fieldset": { borderColor: "var(--border-color)" },
                                "&:hover fieldset": { borderColor: "var(--color-primary)" }
                            }
                        }}
                    />

                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleOpenAddNew}
                        sx={{
                            borderRadius: "50px",
                            background: "var(--gradient-primary)",
                            px: 3,
                            fontWeight: 700,
                            textTransform: "none",
                            boxShadow: "0 4px 14px rgba(0, 78, 146, 0.2)"
                        }}
                    >
                        Add New
                    </Button>

                    <Menu
                        anchorEl={addNewAnchor}
                        open={Boolean(addNewAnchor)}
                        onClose={handleCloseAddNew}
                        PaperProps={{
                            sx: {
                                mt: 1,
                                borderRadius: "12px",
                                width: 180,
                                border: "1px solid var(--border-color)",
                                background: "var(--bg-panel)",
                                boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
                            }
                        }}
                    >
                        <MenuItem onClick={() => { handleCloseAddNew(); openModal('school', 'add'); }} sx={{ gap: 1.5, py: 1.2 }}><Business fontSize="small" /> Add School</MenuItem>
                        <MenuItem onClick={() => { handleCloseAddNew(); openModal('program', 'add'); }} sx={{ gap: 1.5, py: 1.2 }}><School fontSize="small" /> Add Program</MenuItem>
                        <MenuItem onClick={() => { handleCloseAddNew(); openModal('department', 'add'); }} sx={{ gap: 1.5, py: 1.2 }}><AccountTree fontSize="small" /> Add Department</MenuItem>
                        <MenuItem onClick={() => { handleCloseAddNew(); openModal('branch', 'add'); }} sx={{ gap: 1.5, py: 1.2 }}><Code fontSize="small" /> Add Branch</MenuItem>
                    </Menu>
                </Box>
            </Box>

            {/* Main view section */}
            <Box sx={{ width: "100%" }}>
                {/* Tab Selection */}
                <Paper sx={{
                    mb: 3,
                    p: 0.8,
                    background: "var(--bg-glass)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "16px"
                }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, val) => setActiveTab(val)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            minHeight: "auto",
                            "& .MuiTabs-indicator": { display: "none" },
                            "& .MuiTabs-flexContainer": { gap: 1 }
                        }}
                    >
                        <Tab
                            label="Schools Hierarchy"
                            icon={<Business fontSize="small" />}
                            iconPosition="start"
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                minHeight: "auto",
                                py: 1,
                                px: 2.5,
                                borderRadius: "12px",
                                color: "var(--text-secondary)",
                                "&.Mui-selected": {
                                    color: "var(--color-primary) !important",
                                    background: "rgba(2, 132, 199, 0.08)"
                                }
                            }}
                        />
                        <Tab
                            label="Programs"
                            icon={<School fontSize="small" />}
                            iconPosition="start"
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                minHeight: "auto",
                                py: 1,
                                px: 2.5,
                                borderRadius: "12px",
                                color: "var(--text-secondary)",
                                "&.Mui-selected": {
                                    color: "var(--color-primary) !important",
                                    background: "rgba(2, 132, 199, 0.08)"
                                }
                            }}
                        />
                        <Tab
                            label="Departments"
                            icon={<AccountTree fontSize="small" />}
                            iconPosition="start"
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                minHeight: "auto",
                                py: 1,
                                px: 2.5,
                                borderRadius: "12px",
                                color: "var(--text-secondary)",
                                "&.Mui-selected": {
                                    color: "var(--color-primary) !important",
                                    background: "rgba(2, 132, 199, 0.08)"
                                }
                            }}
                        />
                    </Tabs>
                </Paper>

                {/* Dynamic View Card */}
                <Card variant="outlined" sx={{ borderRadius: "24px", border: "1px solid var(--border-color)", background: "var(--bg-glass)", minHeight: 400 }}>
                    <CardContent sx={{ p: 3 }}>
                        {loading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Fade in={!loading}>
                                <Box>
                                    {activeTab === 0 && (
                                        <Box>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                                                <Typography variant="h6" fontWeight={800} color="var(--text-primary)">
                                                    Structure Overview
                                                </Typography>
                                                <Button
                                                    size="small"
                                                    onClick={toggleExpandAll}
                                                    sx={{ textTransform: "none", fontWeight: 700, color: "var(--color-primary)" }}
                                                >
                                                    {isAllExpanded() ? "Collapse All" : "Expand All"}
                                                </Button>
                                            </Box>
                                            {renderSchoolsTree()}
                                        </Box>
                                    )}
                                    {activeTab === 1 && renderProgramsView()}
                                    {activeTab === 2 && renderDepartmentsView()}
                                </Box>
                            </Fade>
                        )}
                    </CardContent>
                </Card>
            </Box>

            {/* General Create / Edit Entity Dialog */}
            <Dialog open={modal.open} onClose={() => setModal({ ...modal, open: false })} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>
                    {modal.mode === 'add' ? 'Add New' : 'Edit'} {modal.type?.charAt(0).toUpperCase() + modal.type?.slice(1)}
                </DialogTitle>
                <DialogContent sx={{ py: 2 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
                        
                        {/* 1. PROGRAM FIELDS */}
                        {modal.type === 'program' && (
                            <>
                                <FormControl fullWidth>
                                    <InputLabel>Program Level (Type)</InputLabel>
                                    <Select
                                        value={modal.data.type || ''}
                                        onChange={(e) => setModal({ ...modal, data: { ...modal.data, type: e.target.value } })}
                                        label="Program Level (Type)"
                                    >
                                        <MenuItem value="UG">UG (Undergraduate)</MenuItem>
                                        <MenuItem value="PG">PG (Postgraduate)</MenuItem>
                                        <MenuItem value="PHD">PHD (Doctoral)</MenuItem>
                                        <MenuItem value="DIPLOMA">Diploma</MenuItem>
                                        <MenuItem value="CERTIFICATE">Certificate</MenuItem>
                                    </Select>
                                </FormControl>
                                
                                <TextField
                                    label="Duration (Years)"
                                    fullWidth
                                    type="number"
                                    value={modal.data.durationYears || ''}
                                    onChange={(e) => setModal({ ...modal, data: { ...modal.data, durationYears: parseInt(e.target.value) || '' } })}
                                    InputProps={{ inputProps: { min: 1, max: 10 } }}
                                />
                                
                                <FormControl fullWidth>
                                    <InputLabel>Program Pattern</InputLabel>
                                    <Select
                                        value={modal.data.programPattern || 'SEMESTER'}
                                        onChange={(e) => setModal({ ...modal, data: { ...modal.data, programPattern: e.target.value } })}
                                        label="Program Pattern"
                                    >
                                        <MenuItem value="SEMESTER">Semester Wise</MenuItem>
                                        <MenuItem value="YEAR">Year Wise</MenuItem>
                                    </Select>
                                </FormControl>
                            </>
                        )}

                        {/* 2. DEPARTMENT FIELDS */}
                        {modal.type === 'department' && (
                            <>
                                <FormControl fullWidth>
                                    <InputLabel>Department Type</InputLabel>
                                    <Select
                                        value={modal.data.type || 'Academic'}
                                        onChange={(e) => setModal({ ...modal, data: { ...modal.data, type: e.target.value, schoolId: e.target.value === 'Central' ? null : modal.data.schoolId } })}
                                        label="Department Type"
                                    >
                                        <MenuItem value="Academic">Academic (Under a School)</MenuItem>
                                        <MenuItem value="Central">Central Level</MenuItem>
                                    </Select>
                                </FormControl>
                                
                                {(!modal.data.type || modal.data.type === 'Academic') && (
                                    <FormControl fullWidth>
                                        <InputLabel>School</InputLabel>
                                        <Select
                                            value={modal.data.schoolId?._id || modal.data.schoolId || ''}
                                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, schoolId: e.target.value } })}
                                            label="School"
                                        >
                                            {schools.map(s => <MenuItem key={s._id} value={s._id}>{s.name} ({s.code})</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                )}
                            </>
                        )}

                        {/* 3. BRANCH FIELDS */}
                        {modal.type === 'branch' && (
                            <>
                                <FormControl fullWidth>
                                    <InputLabel>Program</InputLabel>
                                    <Select
                                        value={modal.data.programId?._id || modal.data.programId || ''}
                                        onChange={(e) => setModal({ ...modal, data: { ...modal.data, programId: e.target.value } })}
                                        label="Program"
                                    >
                                        {programs.map(p => <MenuItem key={p._id} value={p._id}>{p.name} ({p.type})</MenuItem>)}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel>Department</InputLabel>
                                    <Select
                                        value={modal.data.departmentId?._id || modal.data.departmentId || ''}
                                        onChange={(e) => setModal({ ...modal, data: { ...modal.data, departmentId: e.target.value } })}
                                        label="Department"
                                    >
                                        {departments.map(d => {
                                            const sch = schools.find(s => s._id === (d.schoolId?._id || d.schoolId));
                                            return (
                                                <MenuItem key={d._id} value={d._id}>
                                                    {d.name} {sch ? `(${sch.code})` : '(Central)'}
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                </FormControl>
                            </>
                        )}

                        {/* 4. COMMON FIELDS */}
                        <TextField
                            label="Name"
                            fullWidth
                            value={modal.data.name || ''}
                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })}
                            helperText={modal.type === 'branch' ? "e.g., Computer Science & Engineering (AI & ML)" : ""}
                        />

                        {modal.type !== 'branch' && (
                            <TextField
                                label="Code"
                                fullWidth
                                value={modal.data.code || ''}
                                onChange={(e) => setModal({ ...modal, data: { ...modal.data, code: e.target.value.toUpperCase() } })}
                                helperText={modal.type === 'school' ? "e.g., SOE" : modal.type === 'department' ? "e.g., CSE" : modal.type === 'program' ? "e.g., BTECH" : "e.g., CSE-VLSI"}
                            />
                        )}

                        {modal.type === 'branch' && (
                            <TextField
                                label="Branch Code"
                                fullWidth
                                value={modal.data.code || ''}
                                onChange={(e) => setModal({ ...modal, data: { ...modal.data, code: e.target.value.toUpperCase() } })}
                                helperText="e.g., CSE-AIML"
                            />
                        )}

                        {modal.type !== 'branch' && (
                            <TextField
                                label="Description"
                                fullWidth
                                multiline
                                rows={2}
                                value={modal.data.description || ''}
                                onChange={(e) => setModal({ ...modal, data: { ...modal.data, description: e.target.value } })}
                            />
                        )}

                        {modal.type === 'branch' && modal.mode === 'edit' && (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={modal.data.status !== false}
                                        onChange={(e) => setModal({ ...modal, data: { ...modal.data, status: e.target.checked } })}
                                        color="primary"
                                    />
                                }
                                label="Active Status"
                            />
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setModal({ ...modal, open: false })} sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" disabled={submitting} sx={{ borderRadius: "50px", background: "var(--gradient-primary)", px: 4, fontWeight: 700, textTransform: "none" }}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ ...deleteConfirm, open: false })}>
                <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 800 }}>
                    <Warning color="error" /> Confirm Deletion
                </DialogTitle>
                <DialogContent>
                    Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
                    This will fail if there are dependent entities linked to this {deleteConfirm.type}.
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDeleteConfirm({ ...deleteConfirm, open: false })} sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained" disabled={submitting} sx={{ borderRadius: "50px", px: 4, fontWeight: 700, textTransform: "none" }}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Premium Card Context Menu */}
            <Menu
                anchorEl={cardMenu.anchorEl}
                open={Boolean(cardMenu.anchorEl)}
                onClose={() => setCardMenu({ anchorEl: null, type: '', data: null })}
                PaperProps={{
                    sx: {
                        mt: 0.5,
                        borderRadius: "12px",
                        width: cardMenu.type === 'department' ? 180 : 150,
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-panel)",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
                    }
                }}
            >
                {cardMenu.type === 'program' && cardMenu.data && [
                    <MenuItem key="edit" onClick={() => { openModal('program', 'edit', cardMenu.data); setCardMenu({ anchorEl: null, type: '', data: null }); }} sx={{ gap: 1.5, py: 1 }}><Edit fontSize="small" /> Edit Program</MenuItem>,
                    <MenuItem key="delete" onClick={() => { setDeleteConfirm({ open: true, type: 'program', id: cardMenu.data._id, name: cardMenu.data.name }); setCardMenu({ anchorEl: null, type: '', data: null }); }} sx={{ gap: 1.5, py: 1, color: "var(--color-error, #ef4444)" }}><Delete fontSize="small" /> Delete Program</MenuItem>
                ]}
                {cardMenu.type === 'department' && cardMenu.data && [
                    <MenuItem key="add-branch" onClick={() => { openModal('branch', 'add', { departmentId: cardMenu.data._id }); setCardMenu({ anchorEl: null, type: '', data: null }); }} sx={{ gap: 1.5, py: 1 }}><Add fontSize="small" /> Add Branch</MenuItem>,
                    <MenuItem key="edit" onClick={() => { openModal('department', 'edit', cardMenu.data); setCardMenu({ anchorEl: null, type: '', data: null }); }} sx={{ gap: 1.5, py: 1 }}><Edit fontSize="small" /> Edit Department</MenuItem>,
                    <MenuItem key="delete" onClick={() => { setDeleteConfirm({ open: true, type: 'department', id: cardMenu.data._id, name: cardMenu.data.name }); setCardMenu({ anchorEl: null, type: '', data: null }); }} sx={{ gap: 1.5, py: 1, color: "var(--color-error, #ef4444)" }}><Delete fontSize="small" /> Delete Department</MenuItem>
                ]}
            </Menu>
        </Box>
    );
};

export default AcademicStructure;
