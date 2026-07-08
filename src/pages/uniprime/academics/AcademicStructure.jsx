import Loader from "../../../components/common/Loader";
import React, { useState, useEffect } from "react";
import {
    Box, Typography, Button, Grid, Card, CardContent, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, IconButton,
    Tooltip, Divider, List, ListItem, ListItemText, ListItemSecondaryAction,
    Fade, Chip, MenuItem, Select, FormControl, InputLabel,
    Tabs, Tab, Paper, Switch, FormControlLabel, FormHelperText,
    useTheme, useMediaQuery
} from "@mui/material";
import { toast } from "sonner";
import {
    Add, Edit, Delete, AccountTree, Business, Code, School,
    CheckCircle, Cancel, Warning, ArrowBack, ChevronRight
} from "@mui/icons-material";
import PageHeader from "../../../components/common/PageHeader";
import API from "../../../api/axios";

const ConnectorLine = ({ color = "var(--color-primary)" }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
        <Box sx={{ width: '2px', height: '16px', backgroundColor: color }} />
        <Box sx={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
        <Box sx={{ width: '2px', height: '16px', backgroundColor: color }} />
    </Box>
);

const GridConnector = ({ activeIndex, itemsCount, color = "var(--color-primary)", height = 32, noWrap = false, cols = { sm: 2, md: 4 }, sx = {} }) => {
    if (activeIndex === null || activeIndex === undefined || activeIndex === -1) return null;

    if (noWrap) {
        return (
            <Grid
                container
                spacing={3}
                sx={{
                    mt: -2,
                    mb: 1,
                    pointerEvents: 'none',
                    flexWrap: 'nowrap',
                    display: { xs: 'none', sm: 'flex' },
                    ...sx
                }}
            >
                {Array.from({ length: itemsCount }).map((_, idx) => {
                    const isConnector = idx === activeIndex;
                    return (
                        <Grid
                            size="grow"
                            key={idx}
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                flex: '1 1 0px',
                                minWidth: 0
                            }}
                        >
                            {isConnector ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: `${height}px`, justifyContent: 'center', width: '100%' }}>
                                    <Box sx={{ width: '2px', height: `${height}px`, backgroundColor: color, position: 'relative' }}>
                                        <Box sx={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color, position: 'absolute', top: -3, left: -2 }} />
                                        <Box sx={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color, position: 'absolute', bottom: -3, left: -2 }} />
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ height: `${height}px` }} />
                            )}
                        </Grid>
                    );
                })}
            </Grid>
        );
    }

    const smCols = cols.sm || 2;
    const mdCols = cols.md || 4;
    const lgCols = cols.lg || mdCols;

    return (
        <Box
            sx={{
                mt: -2,
                mb: 1,
                pointerEvents: 'none',
                display: { xs: 'none', sm: 'grid' },
                gridTemplateColumns: {
                    sm: `repeat(${smCols}, 1fr)`,
                    md: `repeat(${mdCols}, 1fr)`,
                    lg: `repeat(${lgCols}, 1fr)`
                },
                gap: 3,
                width: '100%',
                ...sx
            }}
        >
            {/* Large Desktop Connector (lg) */}
            <Box sx={{
                display: { xs: 'none', sm: 'none', md: 'none', lg: lgCols !== mdCols ? 'flex' : 'none' },
                gridColumn: (activeIndex % lgCols) + 1,
                justifyContent: 'center',
                alignItems: 'center',
                height: `${height}px`
            }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: `${height}px`, justifyContent: 'center', width: '100%' }}>
                    <Box sx={{ width: '2px', height: `${height}px`, backgroundColor: color, position: 'relative' }}>
                        <Box sx={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color, position: 'absolute', top: -3, left: -2 }} />
                        <Box sx={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color, position: 'absolute', bottom: -3, left: -2 }} />
                    </Box>
                </Box>
            </Box>

            {/* Medium Desktop Connector (md) */}
            <Box sx={{
                display: { xs: 'none', sm: 'none', md: 'flex', lg: lgCols !== mdCols ? 'none' : 'flex' },
                gridColumn: (activeIndex % mdCols) + 1,
                justifyContent: 'center',
                alignItems: 'center',
                height: `${height}px`
            }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: `${height}px`, justifyContent: 'center', width: '100%' }}>
                    <Box sx={{ width: '2px', height: `${height}px`, backgroundColor: color, position: 'relative' }}>
                        <Box sx={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color, position: 'absolute', top: -3, left: -2 }} />
                        <Box sx={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color, position: 'absolute', bottom: -3, left: -2 }} />
                    </Box>
                </Box>
            </Box>

            {/* Tablet Connector (sm) */}
            <Box sx={{
                display: { xs: 'none', sm: 'flex', md: 'none', lg: 'none' },
                gridColumn: (activeIndex % smCols) + 1,
                justifyContent: 'center',
                alignItems: 'center',
                height: `${height}px`
            }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: `${height}px`, justifyContent: 'center', width: '100%' }}>
                    <Box sx={{ width: '2px', height: `${height}px`, backgroundColor: color, position: 'relative' }}>
                        <Box sx={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color, position: 'absolute', top: -3, left: -2 }} />
                        <Box sx={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color, position: 'absolute', bottom: -3, left: -2 }} />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

const AcademicStructure = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [activeTab, setActiveTab] = useState(0);
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Data State
    const [schools, setSchools] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [branches, setBranches] = useState([]);

    // Modal State
    const [modal, setModal] = useState({ open: false, type: '', mode: 'add', data: {} });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: '', id: null, name: "" });


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
            toast.error(error.response?.data?.message || "Failed to load academic data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async () => {
        const { type, mode, data } = modal;
        setSubmitting(true);
        try {
            // Sanitize populated fields to send only plain IDs
            const payload = { ...data };
            if (payload.schoolId && typeof payload.schoolId === 'object') {
                payload.schoolId = payload.schoolId._id;
            }
            if (payload.departmentId && typeof payload.departmentId === 'object') {
                payload.departmentId = payload.departmentId._id;
            }
            if (payload.programId && typeof payload.programId === 'object') {
                payload.programId = payload.programId._id;
            }
            if (payload.schoolIds && Array.isArray(payload.schoolIds)) {
                payload.schoolIds = payload.schoolIds.map(s => typeof s === 'object' ? s._id : s);
            }

            let res;
            const pluralType = type === 'branch' ? 'branches' : `${type}s`;
            const endpoint = `/api/academics/${pluralType}`;

            if (mode === 'add') {
                res = await API.post(endpoint, payload);
            } else {
                res = await API.put(`${endpoint}/${payload._id}`, payload);
            }

            if (res.data.success) {
                const displayName = type === 'branch' ? 'Specialization' : type.charAt(0).toUpperCase() + type.slice(1);
                toast.success(`${displayName} ${mode === 'add' ? 'added' : 'updated'} successfully!`);
                setModal({ open: false, type: '', mode: 'add', data: {} });
                fetchData();
            }
        } catch (error) {
            const displayName = type === 'branch' ? 'specialization' : type;
            toast.error(error.response?.data?.message || `Error saving ${displayName}.`);
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
                const displayName = deleteConfirm.type === 'branch' ? 'Specialization' : deleteConfirm.type.charAt(0).toUpperCase() + deleteConfirm.type.slice(1);
                toast.success(`${displayName} deleted successfully.`);
                setDeleteConfirm({ open: false, type: '', id: null, name: "" });
                fetchData();
            }
        } catch (error) {
            const displayName = deleteConfirm.type === 'branch' ? 'specialization' : deleteConfirm.type;
            toast.error(error.response?.data?.message || `Error deleting ${displayName}.`);
        } finally {
            setSubmitting(false);
        }
    };

    const openModal = (type, mode = 'add', data = {}) => {
        const modalData = { ...data };
        if (type === 'branch' && mode === 'add') {
            if (selectedDepartment) {
                modalData.departmentId = selectedDepartment._id;
                if (!data.programId) {
                    modalData.name = selectedDepartment.name;
                    modalData.code = selectedDepartment.code;
                }
            }
            if (data.programId) {
                modalData.programId = data.programId;
            }
            if (selectedSchool) {
                modalData.schoolId = selectedSchool._id;
            }
        }
        setModal({ open: true, type, mode, data: modalData });
    };

    const renderAcademicHierarchy = () => {
        const centralDepts = departments.filter(d => d.type === 'Central');

        // School departments (if a school is selected)
        const schoolDepts = selectedSchool
            ? departments.filter(d =>
                (d.schoolIds && d.schoolIds.some(id => (id?._id || id) === selectedSchool._id)) ||
                d.schoolId?._id === selectedSchool._id ||
                d.schoolId === selectedSchool._id
            )
            : [];

        // Programs for the selected department
        let deptPrograms = [];
        if (selectedDepartment) {
            const deptBranches = branches.filter(b => b.departmentId?._id === selectedDepartment._id || b.departmentId === selectedDepartment._id);
            const programIdsSeen = new Set();
            deptBranches.forEach(b => {
                if (b.programId && b.programId._id) {
                    const progId = b.programId._id.toString();
                    if (!programIdsSeen.has(progId)) {
                        programIdsSeen.add(progId);
                        deptPrograms.push(b.programId);
                    }
                }
            });

            if (selectedDepartment.programId) {
                const prog = programs.find(p => p._id === (selectedDepartment.programId._id || selectedDepartment.programId));
                if (prog && !programIdsSeen.has(prog._id.toString())) {
                    programIdsSeen.add(prog._id.toString());
                    deptPrograms.push(prog);
                }
            }
        }

        // Specializations for the selected department and program
        const programBranches = (selectedDepartment && selectedProgram)
            ? branches.filter(b =>
                (b.departmentId?._id === selectedDepartment._id || b.departmentId === selectedDepartment._id) &&
                (b.programId?._id === selectedProgram._id || b.programId === selectedProgram._id) &&
                (!selectedSchool || !b.schoolId || (b.schoolId?._id === selectedSchool._id || b.schoolId === selectedSchool._id))
            )
            : [];

        // --- MOBILE INLINE RENDERING HELPERS ---
        const renderDepartmentsSection = () => {
            if (!selectedSchool) return null;
            return (
                <Box sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: '16px', background: '#f4fbf7', border: '1px solid #d1f2e1', mb: 2, ml: { xs: 0, sm: 3, md: 4 } }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, mb: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Box sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: '#10B981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)'
                            }}>
                                <Business sx={{ color: '#fff', fontSize: 16 }} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#1b4332', fontSize: '1rem', lineHeight: 1.2 }}>
                                    {selectedSchool.name} ({selectedSchool.code}) - Departments
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Click a department to view its programs and specializations.
                                </Typography>
                            </Box>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#047857', fontWeight: 700, fontSize: '0.8rem' }}>
                            {schoolDepts.length} Departments
                        </Typography>
                    </Box>

                    {/* Departments grid */}
                    <Grid container spacing={3}>
                        {schoolDepts.map(dept => {
                            const isDeptSelected = selectedDepartment?._id === dept._id;
                            return (
                                <React.Fragment key={dept._id}>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                borderRadius: "12px",
                                                background: "#ffffff",
                                                border: isDeptSelected ? '1.5px solid #10B981' : '1px solid rgba(0, 0, 0, 0.06)',
                                                boxShadow: isDeptSelected ? '0 8px 20px rgba(16, 185, 129, 0.1)' : '0 2px 8px rgba(0,0,0,0.02)',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                transition: 'all 0.2s ease-in-out',
                                                minHeight: '100px',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                                                    '& .edit-dept-btn': { opacity: 1, visibility: 'visible' }
                                                }
                                            }}
                                            onClick={() => {
                                                if (isDeptSelected) {
                                                    setSelectedDepartment(null);
                                                    setSelectedProgram(null);
                                                } else {
                                                    setSelectedDepartment(dept);
                                                    setSelectedProgram(null);
                                                }
                                            }}
                                        >
                                            <CardContent sx={{ p: '16px !important', display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                        <Box sx={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: '50%',
                                                            background: '#10B981',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0
                                                        }}>
                                                            <Business sx={{ color: '#fff', fontSize: 16 }} />
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#065f46', fontSize: '0.85rem', lineHeight: 1.2 }}>
                                                                {dept.name}
                                                            </Typography>
                                                            <Typography variant="caption" fontWeight={600} color="textSecondary" sx={{ fontSize: '0.75rem', mt: 0.25, display: 'block' }}>
                                                                {dept.code}
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    <IconButton
                                                        size="small"
                                                        className="edit-dept-btn"
                                                        onClick={(e) => { e.stopPropagation(); openModal('department', 'edit', dept); }}
                                                        sx={{
                                                            color: 'text.secondary',
                                                            p: 0.5,
                                                            opacity: 0,
                                                            visibility: 'hidden',
                                                            transition: 'all 0.2s ease',
                                                            mt: -0.5,
                                                            mr: -1,
                                                            '&:hover': { color: '#10B981', background: 'rgba(16, 185, 129, 0.08)' }
                                                        }}
                                                    >
                                                        <Edit sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    {isDeptSelected && (
                                        <Grid size={{ xs: 12 }} sx={{ display: { xs: 'block', sm: 'none' }, mb: 2 }}>
                                            {renderProgramsSection()}
                                        </Grid>
                                    )}
                                </React.Fragment>
                            );
                        })}

                        {/* Add Department card */}
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card
                                sx={{
                                    border: "1.5px dashed #10B981",
                                    background: "rgba(16,185,129,0.02)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "12px",
                                    minHeight: "100px",
                                    boxShadow: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease-in-out',
                                    "&:hover": {
                                        background: "rgba(16,185,129,0.05)",
                                        borderColor: "#059669",
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                                onClick={() => openModal('department', 'add', { type: 'Academic', schoolId: selectedSchool._id })}
                            >
                                <Box sx={{ textAlign: "center", p: 1.5 }}>
                                    <Add sx={{ fontSize: 20, color: '#10B981', mb: 0.25 }} />
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#10B981', fontSize: '0.8rem' }}>Add Department</Typography>
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            );
        };

        const renderProgramsSection = () => {
            if (!selectedDepartment) return null;
            return (
                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: '12px', background: '#f0f9ff', border: '1px solid #bae6fd', mb: 2, ml: { xs: 0, sm: 5, md: 8 } }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Box sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: 'var(--color-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(2, 132, 199, 0.2)'
                            }}>
                                <School sx={{ color: '#fff', fontSize: 14 }} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#0369a1', fontSize: '0.925rem', lineHeight: 1.2 }}>
                                    {selectedDepartment.name} ({selectedDepartment.code}) - Programs
                                </Typography>
                                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                                    Click a program to view its specializations.
                                </Typography>
                            </Box>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#0369a1', fontWeight: 700, fontSize: '0.75rem' }}>
                            {deptPrograms.length} Programs
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {deptPrograms.map(prog => {
                            const isProgSelected = selectedProgram?._id === prog._id;
                            return (
                                <React.Fragment key={prog._id}>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                borderRadius: "10px",
                                                background: "#ffffff",
                                                border: isProgSelected ? '1.5px solid var(--color-primary)' : '1px solid rgba(0, 0, 0, 0.06)',
                                                boxShadow: isProgSelected ? '0 8px 20px rgba(37, 99, 235, 0.1)' : '0 2px 8px rgba(0,0,0,0.02)',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                transition: 'all 0.2s ease-in-out',
                                                minHeight: '85px',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                                                    '& .edit-prog-btn': { opacity: 1, visibility: 'visible' }
                                                }
                                            }}
                                            onClick={() => {
                                                if (isProgSelected) {
                                                    setSelectedProgram(null);
                                                } else {
                                                    setSelectedProgram(prog);
                                                }
                                            }}
                                        >
                                            <CardContent sx={{ p: '12px !important', display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'text.primary', fontSize: '0.825rem', lineHeight: 1.2 }}>
                                                            {prog.name}
                                                        </Typography>
                                                        <Typography variant="caption" fontWeight={600} color="textSecondary" sx={{ mt: 0.25, display: 'block', fontSize: '0.725rem' }}>
                                                            {prog.type} · {prog.durationYears || 4} Years
                                                        </Typography>
                                                    </Box>

                                                    <IconButton
                                                        size="small"
                                                        className="edit-prog-btn"
                                                        onClick={(e) => { e.stopPropagation(); openModal('program', 'edit', prog); }}
                                                        sx={{
                                                            color: 'text.secondary',
                                                            p: 0.5,
                                                            opacity: 0,
                                                            visibility: 'hidden',
                                                            transition: 'all 0.2s ease',
                                                            mt: -0.5,
                                                            mr: -1,
                                                            '&:hover': { color: 'var(--color-primary)', background: 'rgba(37, 99, 235, 0.08)' }
                                                        }}
                                                    >
                                                        <Edit sx={{ fontSize: 14 }} />
                                                    </IconButton>
                                                </Box>

                                                <Box sx={{ mt: 'auto', display: 'flex', gap: 1, alignItems: 'center', pt: 1 }}>
                                                    <Chip
                                                        label={prog.programPattern === 'YEAR' ? 'YEAR WISE' : 'SEMESTER WISE'}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 700,
                                                            height: 18,
                                                            fontSize: '0.6rem',
                                                            borderRadius: '4px',
                                                            bgcolor: 'rgba(37, 99, 235, 0.08)',
                                                            color: 'var(--color-primary)'
                                                        }}
                                                    />
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    {isProgSelected && (
                                        <Grid size={{ xs: 12 }} sx={{ display: { xs: 'block', sm: 'none' }, mb: 2 }}>
                                            {renderSpecializationsSection()}
                                        </Grid>
                                    )}
                                </React.Fragment>
                            );
                        })}

                        {/* Add Program card */}
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card
                                sx={{
                                    border: "1.5px dashed var(--color-primary)",
                                    background: "rgba(37,99,235,0.02)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "10px",
                                    minHeight: "85px",
                                    boxShadow: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease-in-out',
                                    "&:hover": {
                                        background: "rgba(37,99,235,0.05)",
                                        borderColor: "#1d4ed8",
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                                onClick={() => openModal('branch', 'add', { departmentId: selectedDepartment._id })}
                            >
                                <Box sx={{ textAlign: "center", p: 1.5 }}>
                                    <Add sx={{ fontSize: 20, color: 'var(--color-primary)', mb: 0.25 }} />
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'var(--color-primary)', fontSize: '0.75rem' }}>Add Program</Typography>
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            );
        };

        const renderSpecializationsSection = () => {
            if (!selectedProgram) return null;
            return (
                <Box sx={{ p: { xs: 1.25, sm: 1.5 }, borderRadius: '10px', background: '#faf5ff', border: '1px solid #f3e8ff', mb: 2, ml: { xs: 0, sm: 7, md: 12 } }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Box sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: '#8b5cf6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(139, 92, 246, 0.2)'
                            }}>
                                <AccountTree sx={{ color: '#fff', fontSize: 12 }} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#5b21b6', fontSize: '0.85rem', lineHeight: 1.2 }}>
                                    {selectedProgram.name} - Specializations
                                </Typography>
                                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                                    Manage the academic specializations under this program.
                                </Typography>
                            </Box>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#6d28d9', fontWeight: 700, fontSize: '0.7rem' }}>
                            {programBranches.length} Specializations
                        </Typography>
                    </Box>

                    <Grid container spacing={2}>
                        {programBranches.map(spec => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={spec._id} sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Card
                                    sx={{
                                        borderRadius: "8px",
                                        background: "#ffffff",
                                        border: '1px solid rgba(0, 0, 0, 0.08)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                        transition: 'all 0.3s ease',
                                        minHeight: '70px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
                                        }
                                    }}
                                >
                                    <CardContent sx={{ p: '10px 12px !important', display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'text.primary', fontSize: '0.775rem', lineHeight: 1.2 }}>
                                                    {spec.name}
                                                </Typography>
                                                <Typography variant="caption" fontWeight={600} color="textSecondary" sx={{ mt: 0.25, display: 'block', fontSize: '0.7rem' }}>
                                                    CODE: {spec.code}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', gap: 0.25, mt: -0.5, mr: -0.5 }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => openModal('branch', 'edit', spec)}
                                                    sx={{ color: 'text.secondary', p: 0.25, '&:hover': { color: 'var(--color-primary)', background: 'rgba(2, 132, 199, 0.08)' } }}
                                                >
                                                    <Edit sx={{ fontSize: 14 }} />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setDeleteConfirm({ open: true, type: 'branch', id: spec._id, name: spec.name })}
                                                    sx={{ color: 'error.main', p: 0.25, '&:hover': { background: 'rgba(239, 68, 68, 0.08)' } }}
                                                >
                                                    <Delete sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}

                        {/* Add Specialization card */}
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card
                                sx={{
                                    border: "1.5px dashed #8b5cf6",
                                    background: "rgba(139,92,246,0.02)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "8px",
                                    minHeight: "70px",
                                    boxShadow: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    "&:hover": {
                                        background: "rgba(139,92,246,0.06)",
                                        borderColor: "#7c3aed",
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                                onClick={() => openModal('branch', 'add', { departmentId: selectedDepartment._id, programId: selectedProgram._id, lockProgram: true })}
                            >
                                <Box sx={{ textAlign: "center", p: 1 }}>
                                    <Add sx={{ fontSize: 20, color: '#8b5cf6', mb: 0.25 }} />
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#8b5cf6', fontSize: '0.725rem' }}>Add Specialization</Typography>
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            );
        };

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* SCHOOLS ROW */}
                <Box>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 2 }}>
                        <Box>
                            <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'var(--text-primary)' }}>
                                <School sx={{ color: 'var(--color-primary)' }} /> Schools
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Schools are the major academic divisions in the university. Click to explore.
                            </Typography>
                        </Box>
                        <Button variant="contained" startIcon={<Add />} onClick={() => openModal('school', 'add')}
                            sx={{ borderRadius: '50px', background: "var(--gradient-primary)", textTransform: 'none', fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}>
                            Create School
                        </Button>
                    </Box>

                    <Grid container spacing={3} sx={{ mb: 2 }}>
                        {schools.map(school => {
                            const sDepts = departments.filter(d =>
                                (d.schoolIds && d.schoolIds.some(id => (id?._id || id) === school._id)) ||
                                d.schoolId?._id === school._id ||
                                d.schoolId === school._id
                            );
                            const sBranches = branches.filter(b =>
                                b.schoolId?._id === school._id || b.schoolId === school._id ||
                                (!b.schoolId && sDepts.some(d => d._id === b.departmentId?._id || d._id === b.departmentId))
                            );
                            const sProgs = programs.filter(p => p.schoolId?._id === school._id || p.schoolId === school._id);
                            const isSelected = selectedSchool?._id === school._id;

                            return (
                                <React.Fragment key={school._id}>
                                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                borderRadius: "12px",
                                                background: "#ffffff",
                                                border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid rgba(0, 0, 0, 0.06)',
                                                boxShadow: isSelected ? '0 8px 20px rgba(37, 99, 235, 0.1)' : '0 2px 8px rgba(0,0,0,0.02)',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                transition: 'all 0.2s ease-in-out',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                                                    '& .edit-school-btn': { opacity: 1, visibility: 'visible' }
                                                }
                                            }}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedSchool(null);
                                                    setSelectedDepartment(null);
                                                    setSelectedProgram(null);
                                                } else {
                                                    setSelectedSchool(school);
                                                    setSelectedDepartment(null);
                                                    setSelectedProgram(null);
                                                }
                                            }}
                                        >
                                            <CardContent sx={{ p: '20px !important', display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                        <Box sx={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: '50%',
                                                            background: 'var(--color-primary)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0
                                                        }}>
                                                            <School sx={{ color: '#fff', fontSize: 20 }} />
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#1e3a8a', fontSize: '0.95rem', lineHeight: 1.2 }}>
                                                                {school.name}
                                                            </Typography>
                                                            <Typography variant="caption" fontWeight={600} color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                                                                ({school.code})
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: -0.5, mr: -1 }}>
                                                        <IconButton
                                                            size="small"
                                                            className="edit-school-btn"
                                                            onClick={(e) => { e.stopPropagation(); openModal('school', 'edit', school); }}
                                                            sx={{
                                                                color: 'text.secondary',
                                                                p: 0.5,
                                                                opacity: 0,
                                                                visibility: 'hidden',
                                                                transition: 'all 0.2s ease',
                                                                '&:hover': { color: 'var(--color-primary)', background: 'rgba(37, 99, 235, 0.08)' }
                                                            }}
                                                        >
                                                            <Edit sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                        <ChevronRight sx={{ color: 'text.secondary', fontSize: 18, opacity: 0.5 }} />
                                                    </Box>
                                                </Box>

                                                <Typography variant="body2" color="textSecondary" sx={{ mb: 2.5, minHeight: 36, fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {school.description || "Academic division for engineering, technology, and sciences."}
                                                </Typography>

                                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, textAlign: 'left', mt: 'auto' }}>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.65rem', fontWeight: 600 }}>
                                                            Departments
                                                        </Typography>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.25, fontSize: '0.95rem' }}>
                                                            {sDepts.length}
                                                        </Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.65rem', fontWeight: 600 }}>
                                                            Programs
                                                        </Typography>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.25, fontSize: '0.95rem' }}>
                                                            {sProgs.length}
                                                        </Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.65rem', fontWeight: 600 }}>
                                                            Specializations
                                                        </Typography>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.25, fontSize: '0.95rem' }}>
                                                            {sBranches.length}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    {isSelected && (
                                        <Grid size={{ xs: 12 }} sx={{ display: { xs: 'block', sm: 'none' }, mb: 2 }}>
                                            {renderDepartmentsSection()}
                                        </Grid>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </Grid>
                </Box>

                {/* Desktop-only outer sections layout */}
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    {/* SCHOOL TO DEPARTMENTS CONNECTOR */}
                    {selectedSchool && (
                        <>
                            <GridConnector
                                activeIndex={schools.findIndex(s => s._id === selectedSchool._id)}
                                itemsCount={schools.length}
                                color="#10B981"
                                cols={{ sm: 2, md: 4, lg: 4 }}
                            />
                            <Box sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'center', mt: -1, mb: 1 }}>
                                <ConnectorLine color="#10B981" />
                            </Box>
                        </>
                    )}

                    {/* DEPARTMENTS SECTION */}
                    {renderDepartmentsSection()}

                    {/* DEPARTMENTS TO PROGRAMS CONNECTOR */}
                    {selectedSchool && selectedDepartment && (
                        <>
                            <GridConnector
                                activeIndex={schoolDepts.findIndex(d => d._id === selectedDepartment._id)}
                                itemsCount={schoolDepts.length + 1}
                                color="#10B981"
                                sx={{ ml: { xs: 1.5, sm: 3, md: 4 }, px: 2.5 }}
                            />
                            <Box sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'center', mt: -1, mb: 1, ml: { xs: 1.5, sm: 3, md: 4 } }}>
                                <ConnectorLine color="#10B981" />
                            </Box>
                        </>
                    )}

                    {/* PROGRAMS SECTION */}
                    {renderProgramsSection()}

                    {/* PROGRAMS TO SPECIALIZATIONS CONNECTOR */}
                    {selectedDepartment && selectedProgram && (
                        <>
                            <GridConnector
                                activeIndex={deptPrograms.findIndex(p => p._id === selectedProgram._id)}
                                itemsCount={deptPrograms.length + 1}
                                color="var(--color-primary)"
                                sx={{ ml: { xs: 2.5, sm: 5, md: 8 }, px: 2 }}
                            />
                            <Box sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'center', mt: -1, mb: 1, ml: { xs: 2.5, sm: 5, md: 8 } }}>
                                <ConnectorLine color="var(--color-primary)" />
                            </Box>
                        </>
                    )}

                    {/* SPECIALIZATIONS SECTION */}
                    {renderSpecializationsSection()}
                </Box>

                {/* CENTRAL LEVEL DEPARTMENTS */}
                {(!selectedSchool || selectedDepartment?.type === 'Central') && (
                    <Box sx={{ mt: 4 }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 2 }}>
                            <Box>
                                <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'var(--text-primary)' }}>
                                    <Business sx={{ color: 'var(--color-primary)' }} /> Central Level Departments
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Departments operating at the central level. Click to explore.
                                </Typography>
                            </Box>
                            <Button variant="contained" startIcon={<Add />} onClick={() => openModal('department', 'add', { type: 'Central' })}
                                sx={{ borderRadius: '50px', background: "var(--gradient-primary)", textTransform: 'none', fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}>
                                Add Central Department
                            </Button>
                        </Box>

                        <Grid container spacing={3}>
                            {centralDepts.map(dept => {
                                const isDeptSelected = selectedDepartment?._id === dept._id;
                                return (
                                    <React.Fragment key={dept._id}>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Card
                                                sx={{
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    borderRadius: "12px",
                                                    background: "#ffffff",
                                                    border: isDeptSelected ? '1.5px solid var(--color-primary)' : '1px solid rgba(0, 0, 0, 0.08)',
                                                    boxShadow: isDeptSelected ? '0 8px 20px rgba(37, 99, 235, 0.1)' : '0 2px 8px rgba(0,0,0,0.02)',
                                                    cursor: 'pointer',
                                                    position: 'relative',
                                                    transition: 'all 0.3s ease',
                                                    minHeight: '100px',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
                                                    }
                                                }}
                                                onClick={() => {
                                                    if (isDeptSelected) {
                                                        setSelectedDepartment(null);
                                                        setSelectedProgram(null);
                                                    } else {
                                                        setSelectedSchool(null); // Clear active school
                                                        setSelectedDepartment(dept);
                                                        setSelectedProgram(null);
                                                    }
                                                }}
                                            >
                                                <CardContent sx={{ p: '16px !important', display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                            <Box sx={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: '50%',
                                                                background: 'var(--color-primary)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexShrink: 0
                                                            }}>
                                                                <Business sx={{ color: '#fff', fontSize: 16 }} />
                                                            </Box>
                                                            <Box>
                                                                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#1e3a8a', fontSize: '0.85rem', lineHeight: 1.2 }}>
                                                                    {dept.name}
                                                                </Typography>
                                                                <Typography variant="caption" fontWeight={600} color="textSecondary" sx={{ fontSize: '0.75rem', mt: 0.25, display: 'block' }}>
                                                                    {dept.code}
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => { e.stopPropagation(); openModal('department', 'edit', dept); }}
                                                            sx={{ color: 'text.secondary', p: 0.5, mt: -0.5, mr: -1, '&:hover': { color: 'var(--color-primary)', background: 'rgba(2, 132, 199, 0.08)' } }}
                                                        >
                                                            <Edit sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        {isDeptSelected && (
                                            <Grid size={{ xs: 12 }} sx={{ display: { xs: 'block', sm: 'none' }, mb: 2 }}>
                                                {renderProgramsSection()}
                                            </Grid>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </Grid>
                    </Box>
                )}
            </Box>
        );
    };;;

    const renderProgramsView = () => {
        return (
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' },
                gap: 3
            }}>
                <Card
                    sx={{
                        ...cardStyle,
                        border: "2px dashed var(--color-primary)",
                        background: "var(--bg-accent-1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: '100%',
                        minHeight: "140px",
                        boxShadow: 'none',
                        "&:hover": {
                            background: "var(--bg-accent-2)",
                            transform: 'translateY(-8px)',
                            border: "2px dashed var(--color-primary)",
                        }
                    }}
                    onClick={() => openModal('program', 'add')}
                >
                    <Box sx={{ textAlign: "center" }}>
                        <Box sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            border: '2px solid var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                            background: "var(--bg-glass)",
                            backdropFilter: "blur(4px)"
                        }}>
                            <Add sx={{ fontSize: 28, color: 'var(--color-primary)' }} />
                        </Box>
                        <Typography variant="body1" fontWeight={800} sx={{ color: 'var(--color-primary)', letterSpacing: '0.5px' }}>
                            Add Program
                        </Typography>
                    </Box>
                </Card>

                {programs.length === 0 && (
                    <Box sx={{ gridColumn: '1 / -1', py: 5 }}>
                        <Typography variant="body1" color="textSecondary" align="center">No programs found.</Typography>
                    </Box>
                )}

                {programs.map(prog => (
                    <Card key={prog._id} sx={{ ...cardStyle, width: '100%', minHeight: '120px', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: '24px !important' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{
                                    lineHeight: 1.3,
                                    wordBreak: 'break-word',
                                    color: 'var(--text-primary)',
                                    pr: 1
                                }}>
                                    {prog.name}
                                </Typography>
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openModal('program', 'edit', prog); }} sx={{ color: 'var(--text-secondary)', flexShrink: 0, p: 0.5, "&:hover": { background: 'none', color: 'var(--color-primary)', transform: 'scale(1.2)' }, transition: 'all 0.2s' }}>
                                    <Edit sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                <Chip label={prog.code} size="small" sx={{ fontWeight: 800, height: 22, fontSize: '0.7rem', borderRadius: '50px', background: "var(--gradient-primary)", color: '#fff' }} />
                                {prog.schoolId && (
                                    <Chip label={`School: ${prog.schoolId.code || prog.schoolId.name}`} size="small" variant="outlined" sx={{ fontWeight: 700, height: 22, fontSize: '0.65rem', borderRadius: '50px', border: '1.5px solid #f59e0b', color: '#f59e0b' }} />
                                )}
                                <Chip label={prog.type} size="small" variant="outlined" sx={{ fontWeight: 700, height: 22, fontSize: '0.65rem', borderRadius: '50px', border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)' }} />
                                <Chip label={`${prog.durationYears || 4} Years`} size="small" variant="outlined" sx={{ fontWeight: 700, height: 22, fontSize: '0.65rem', borderRadius: '50px', border: '1px solid #10b981', color: '#10b981' }} />
                                <Chip label={prog.programPattern === 'YEAR' ? 'YEAR WISE' : 'SEMESTER WISE'} size="small" variant="outlined" sx={{ fontWeight: 700, height: 22, fontSize: '0.65rem', borderRadius: '50px', border: '1px solid #8b5cf6', color: '#8b5cf6' }} />
                            </Box>

                            <Divider sx={{ mb: 1.5, mt: 'auto', opacity: 0.5 }} />

                            <Typography variant="caption" color="textSecondary" sx={{
                                fontWeight: 500,
                                opacity: 0.8,
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {prog.description || "No description"}
                            </Typography>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        );
    };

    return (
        <Box>
            <PageHeader
                title="Academic Structure"
                subtitle="Configure Departments, Programs, and Specializations for the University" />

            <Paper sx={{
                mb: 4,
                p: 2,
                background: "var(--bg-glass)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--border-color)",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
            }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, val) => setActiveTab(val)}
                    variant={isMobile ? "fullWidth" : "standard"}
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={{
                        '& .MuiTabs-flexContainer': { gap: { xs: 0, sm: 1 } },
                        '& .MuiTab-root': {
                            color: 'var(--text-secondary)',
                            fontWeight: 700,
                            minHeight: '48px',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            textTransform: 'none',
                            px: { xs: 1, sm: 3 },
                            fontSize: { xs: '0.85rem', sm: '1rem' }
                        },
                        '& .Mui-selected': {
                            color: 'var(--color-primary) !important',
                            background: 'rgba(0, 78, 146, 0.08) !important',
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: 'var(--color-primary)',
                            height: '3px',
                            borderRadius: '3px 3px 0 0'
                        }
                    }}
                >
                    <Tab icon={<Business />} iconPosition="start" label="Departments & Specializations" />
                    <Tab icon={<School />} iconPosition="start" label="Programs" />
                </Tabs>
            </Paper>

            <Fade in={!loading}>
                <Box>
                    {activeTab === 0 && renderAcademicHierarchy()}
                    {activeTab === 1 && renderProgramsView()}
                </Box>
            </Fade>

            {/* Entity Dialog */}
            <Dialog open={modal.open} onClose={() => setModal({ ...modal, open: false })} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {modal.mode === 'add'
                        ? (modal.type === 'branch'
                            ? (modal.data.lockProgram
                                ? `Add Specialization for ${programs.find(p => p._id === (modal.data.programId?._id || modal.data.programId))?.name || ''}`
                                : `Add Program for ${selectedDepartment?.name || ''}`)
                            : `Add ${modal.type?.toUpperCase()}`)
                        : (modal.type === 'branch'
                            ? `Edit Specialization for ${programs.find(p => p._id === (modal.data.programId?._id || modal.data.programId))?.name || ''}`
                            : `Edit ${modal.type?.toUpperCase()}`)}
                </DialogTitle>
                <DialogContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        {modal.type === 'program' && (
                            <>
                                <FormControl fullWidth>
                                    <InputLabel>School</InputLabel>
                                    <Select
                                        value={modal.data.schoolId?._id || modal.data.schoolId || ''}
                                        onChange={(e) => setModal({ ...modal, data: { ...modal.data, schoolId: e.target.value } })}
                                        label="School"
                                    >
                                        <MenuItem value=""><em>None / Central Level</em></MenuItem>
                                        {schools.map(s => <MenuItem key={s._id} value={s._id}>{s.name} ({s.code})</MenuItem>)}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel>Type (Level)</InputLabel>
                                    <Select
                                        value={modal.data.type || ''}
                                        onChange={(e) => setModal({ ...modal, data: { ...modal.data, type: e.target.value } })}
                                        label="Type (Level)"
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

                        {modal.type === 'branch' && (
                            <FormControl fullWidth>
                                <InputLabel>Program</InputLabel>
                                <Select
                                    value={modal.data.programId?._id || modal.data.programId || ''}
                                    onChange={(e) => setModal({ ...modal, data: { ...modal.data, programId: e.target.value } })}
                                    label="Program"
                                    disabled={modal.mode === 'edit' || (modal.mode === 'add' && !!modal.data.lockProgram)}
                                >
                                    {programs.map(p => (
                                        <MenuItem key={p._id} value={p._id}>
                                            {p.name} ({p.type}){p.schoolId ? ` — ${p.schoolId.code || p.schoolId.name}` : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}



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
                                        <InputLabel>Schools</InputLabel>
                                        <Select
                                            multiple
                                            value={
                                                modal.data.schoolIds
                                                    ? modal.data.schoolIds.map(s => typeof s === 'object' ? s._id : s)
                                                    : (modal.data.schoolId ? [typeof modal.data.schoolId === 'object' ? modal.data.schoolId._id : modal.data.schoolId] : [])
                                            }
                                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, schoolIds: e.target.value } })}
                                            label="Schools"
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((value) => {
                                                        const school = schools.find(s => s._id === value);
                                                        return <Chip key={value} label={school ? school.code : value} size="small" />;
                                                    })}
                                                </Box>
                                            )}
                                        >
                                            {schools.map(s => (
                                                <MenuItem key={s._id} value={s._id}>
                                                    {s.name} ({s.code})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            </>
                        )}

                        <TextField
                            label="Name"
                            fullWidth
                            value={modal.data.name || ''}
                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })}
                            helperText={modal.type === 'branch' ? (selectedProgram ? "e.g., Structural Engineering" : `e.g., ${selectedDepartment?.name || "Civil Engineering"}`) : ""}
                        />

                        {(modal.type === 'school' || modal.type === 'department' || modal.type === 'branch' || modal.type === 'program') && (
                            <TextField
                                label="Code"
                                fullWidth
                                value={modal.data.code || ''}
                                onChange={(e) => setModal({ ...modal, data: { ...modal.data, code: e.target.value.toUpperCase() } })}
                                helperText={
                                    modal.type === 'school' ? "e.g., SOE" :
                                        modal.type === 'department' ? "e.g., CSE" :
                                            modal.type === 'program' ? "e.g., BTECH" :
                                                (selectedProgram ? "e.g., SE" : `e.g., ${selectedDepartment?.code || "CE"}`)
                                }
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
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModal({ ...modal, open: false })} sx={{ color: 'var(--text-secondary)' }}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" disabled={submitting} sx={{ borderRadius: '50px', background: "var(--gradient-primary)", px: 4, fontWeight: 700, textTransform: 'none' }}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ ...deleteConfirm, open: false })} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="error" /> Confirm Deletion
                </DialogTitle>
                <DialogContent>
                    Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
                    This will fail if there are dependent entities.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirm({ ...deleteConfirm, open: false })} sx={{ color: 'var(--text-secondary)' }}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained" disabled={submitting} sx={{ borderRadius: '50px', px: 4, fontWeight: 700, textTransform: 'none' }}>Delete</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

const cardStyle = {
    position: "relative",
    borderRadius: "16px",
    background: "#ffffff",
    border: "1px solid rgba(0, 0, 0, 0.08)",
    boxShadow: "0 4px 16px 0 rgba(0, 0, 0, 0.04)",
    transition: "all 0.2s ease-in-out",
    overflow: "hidden",
    "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 8px 24px 0 rgba(0, 0, 0, 0.08)",
    }
};

const cardDrillStyle = {
    ...cardStyle,
    cursor: "pointer",
};

export default AcademicStructure;
