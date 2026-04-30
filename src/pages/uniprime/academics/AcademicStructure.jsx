import React, { useState, useEffect } from "react";
import {
    Box, Typography, Button, Grid, Card, CardContent, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, CircularProgress, IconButton,
    Tooltip, Divider, List, ListItem, ListItemText, ListItemSecondaryAction,
    Snackbar, Alert, Chip, MenuItem, Select, FormControl, InputLabel, Fade,
    Tabs, Tab, Paper, Switch, FormControlLabel, FormHelperText
} from "@mui/material";
import {
    Add, Edit, Delete, AccountTree, Business, Code, School,
    CheckCircle, Cancel, Warning, ArrowBack
} from "@mui/icons-material";
import PageHeader from "../../../components/common/PageHeader";
import API from "../../../api/axios";

const AcademicStructure = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    // Data State
    const [departments, setDepartments] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [branches, setBranches] = useState([]);

    // Modal State
    const [modal, setModal] = useState({ open: false, type: '', mode: 'add', data: {} });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: '', id: null, name: "" });

    const showSnackbar = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [deptRes, progRes, branchRes] = await Promise.all([
                API.get("/api/academics/departments"),
                API.get("/api/academics/programs"),
                API.get("/api/academics/branches")
            ]);

            setDepartments(deptRes.data.data || []);
            setPrograms(progRes.data.data || []);
            setBranches(branchRes.data.data || []);
        } catch (error) {
            showSnackbar("Failed to load academic data.", "error");
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
            let res;
            const pluralType = type === 'branch' ? 'branches' : `${type}s`;
            const endpoint = `/api/academics/${pluralType}`;

            if (mode === 'add') {
                res = await API.post(endpoint, data);
            } else {
                res = await API.put(`${endpoint}/${data._id}`, data);
            }

            if (res.data.success) {
                showSnackbar(`${type.charAt(0).toUpperCase() + type.slice(1)} ${mode === 'add' ? 'added' : 'updated'} successfully!`);
                setModal({ open: false, type: '', mode: 'add', data: {} });
                fetchData();
            }
        } catch (error) {
            showSnackbar(error.response?.data?.message || `Error saving ${type}.`, "error");
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
                showSnackbar(`${deleteConfirm.type.charAt(0).toUpperCase() + deleteConfirm.type.slice(1)} deleted successfully.`);
                setDeleteConfirm({ open: false, type: '', id: null, name: "" });
                fetchData();
            }
        } catch (error) {
            showSnackbar(error.response?.data?.message || "Error deleting item.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const openModal = (type, mode = 'add', data = {}) => {
        const modalData = { ...data };
        // Force branch name to match parent department name
        if (type === 'branch' && selectedDepartment) {
            modalData.name = selectedDepartment.name;
        }

        setModal({ open: true, type, mode, data: modalData });
    };

    const renderDepartmentsView = () => (
        <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' },
            gap: 3
        }}>
            <Card
                sx={{
                    ...cardDrillStyle,
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
                onClick={() => openModal('department')}
            >
                <Box sx={{ textAlign: "center" }}>
                    <Box sx={{
                        width: 54,
                        height: 54,
                        borderRadius: '50%',
                        border: '2px solid var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        background: "var(--bg-glass)",
                        backdropFilter: "blur(4px)"
                    }}>
                        <Add sx={{ fontSize: 32, color: 'var(--color-primary)' }} />
                    </Box>
                    <Typography variant="body1" fontWeight={800} sx={{ color: 'var(--color-primary)', letterSpacing: '0.5px' }}>
                        Add Department
                    </Typography>
                </Box>
            </Card>

            {departments.map(dept => (
                <Card key={dept._id} sx={{ ...cardDrillStyle, width: '100%', minHeight: '120px', display: 'flex', flexDirection: 'column' }} onClick={() => setSelectedDepartment(dept)}>
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: '24px !important' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{
                                lineHeight: 1.3,
                                wordBreak: 'break-word',
                                color: 'var(--text-primary)',
                                pr: 1
                            }}>
                                {dept.name}
                            </Typography>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); openModal('department', 'edit', dept); }} sx={{ color: 'var(--text-secondary)', flexShrink: 0, p: 0.5, "&:hover": { background: 'none', color: 'var(--color-primary)', transform: 'scale(1.2)' }, transition: 'all 0.2s' }}>
                                <Edit sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            <Chip label={dept.code} size="small" sx={{ fontWeight: 800, height: 22, fontSize: '0.7rem', borderRadius: '50px', background: "var(--gradient-primary)", color: '#fff' }} />
                            {dept.programIds?.map(prog => (
                                <Chip
                                    key={prog._id}
                                    label={prog.name}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontWeight: 700, height: 22, fontSize: '0.65rem', borderRadius: '50px', border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)' }}
                                />
                            ))}
                            {dept.hasStudents && (
                                <Chip label="Has Students" size="small" variant="outlined" sx={{ fontWeight: 800, height: 22, fontSize: '0.65rem', borderRadius: '50px', color: '#2e7d32', border: '1.5px solid #2e7d32' }} />
                            )}
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
                            {dept.description || "No description"}
                        </Typography>
                    </CardContent>
                </Card>
            ))}
        </Box>
    );

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
                                <Chip label={prog.type} size="small" variant="outlined" sx={{ fontWeight: 700, height: 22, fontSize: '0.65rem', borderRadius: '50px', border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)' }} />
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

    const renderBranchesView = () => {
        const deptBranches = branches.filter(b => b.departmentId?._id === selectedDepartment._id);

        return (
            <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Button startIcon={<ArrowBack />} onClick={() => setSelectedDepartment(null)} sx={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                        Back to Departments
                    </Button>
                </Box>

                {/* Department Header Info */}
                <Paper sx={{
                    p: 3,
                    mb: 4,
                    borderRadius: "20px",
                    background: "var(--bg-glass)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid var(--border-color)"
                }}>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Typography variant="h5" fontWeight={800} sx={{ color: 'var(--text-primary)' }}>
                                    {selectedDepartment.name}
                                </Typography>
                                <Chip label={selectedDepartment.code} size="small" sx={{ fontWeight: 800, background: "var(--gradient-primary)", color: 'white', borderRadius: '50px' }} />
                            </Box>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                {selectedDepartment.description || "No description provided for this department."}
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>

                <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountTree sx={{ color: 'var(--color-primary)' }} /> Department Branches
                </Typography>

                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' },
                    gap: 3
                }}>
                    <Card
                        sx={{
                            ...cardDrillStyle,
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
                        onClick={() => openModal('branch', 'add', { departmentId: selectedDepartment._id, name: selectedDepartment.name })}
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
                                Add Branch
                            </Typography>
                        </Box>
                    </Card>

                    {deptBranches.length === 0 && (
                        <Box sx={{ gridColumn: '1 / -1', py: 5 }}>
                            <Typography variant="body1" color="textSecondary" align="center">No branches found.</Typography>
                        </Box>
                    )}

                    {deptBranches.map(branch => (
                        <Card key={branch._id} sx={{ ...cardStyle, width: '100%', minHeight: '100px', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: '24px !important' }}>
                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Typography variant="h6" fontWeight={700} sx={{
                                            lineHeight: 1.2,
                                            wordBreak: 'break-word',
                                            color: 'var(--text-primary)',
                                            pr: 1
                                        }}>
                                            {branch.name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); openModal('branch', 'edit', branch); }} sx={{ color: 'var(--text-secondary)', p: 0.5, "&:hover": { color: 'var(--color-primary)' } }}>
                                                <Edit sx={{ fontSize: 18 }} />
                                            </IconButton>
                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, type: 'branch', id: branch._id, name: branch.name }); }} sx={{ color: 'var(--text-secondary)', p: 0.5, "&:hover": { color: '#f44336' } }}>
                                                <Delete sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700 }}>
                                        CODE: {branch.code}
                                    </Typography>
                                </Box>
                                <Box mt="auto" display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                    {branch.programId && (
                                        <Chip
                                            label={branch.programId.name}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontWeight: 800, borderRadius: '50px', border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)' }}
                                        />
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            </Box>
        );
    };

    return (
        <Box sx={{ pb: 4 }}>
            <PageHeader
                title="Academic Structure"
                subtitle="Configure Departments, Programs, and Branches for the University"
                breadcrumbs={["Home", "UniPrime", "Academics", "Structure"]}
            />

            {!selectedDepartment && (
                <Paper sx={{
                    mb: 4,
                    pt: 1,
                    px: 2,
                    background: "var(--bg-glass)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "16px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
                }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, val) => setActiveTab(val)}
                        sx={{
                            '& .MuiTab-root': { color: 'var(--text-secondary)', fontWeight: 600 },
                            '& .Mui-selected': { color: 'var(--color-primary) !important' },
                            '& .MuiTabs-indicator': { backgroundColor: 'var(--color-primary)' }
                        }}
                    >
                        <Tab icon={<Business />} iconPosition="start" label="Departments & Branches" />
                        <Tab icon={<School />} iconPosition="start" label="Programs" />
                    </Tabs>
                </Paper>
            )}

            {selectedDepartment && (
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 4,
                    gap: 1,
                    background: 'var(--bg-glass)',
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid var(--border-color)",
                    p: 1,
                    borderRadius: "16px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
                }}>
                    <Button
                        variant="text"
                        onClick={() => setSelectedDepartment(null)}
                        startIcon={<Business />}
                        sx={{ borderRadius: "10px", color: 'var(--color-primary)', fontWeight: 700 }}
                    >
                        Departments
                    </Button>
                    <Typography color="textSecondary" sx={{ opacity: 0.6 }}>/</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AccountTree />}
                        disableElevation
                        sx={{ borderRadius: "10px", px: 2, background: 'var(--gradient-primary)', fontWeight: 700 }}
                    >
                        {selectedDepartment.name} Branches
                    </Button>
                </Box>
            )}

            <Fade in={!loading}>
                <Box>
                    {activeTab === 0 && !selectedDepartment && renderDepartmentsView()}
                    {activeTab === 0 && selectedDepartment && renderBranchesView()}
                    {activeTab === 1 && renderProgramsView()}
                </Box>
            </Fade>

            {/* Entity Dialog */}
            <Dialog open={modal.open} onClose={() => setModal({ ...modal, open: false })} maxWidth="xs" fullWidth>
                <DialogTitle>
                    {modal.mode === 'add' ? 'Add' : 'Edit'} {modal.type === 'branch' && selectedDepartment ? selectedDepartment.name.toUpperCase() : modal.type?.toUpperCase()}
                </DialogTitle>
                <DialogContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        {modal.type === 'program' && (
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
                        )}

                        {modal.type === 'program' && (
                            <FormControl fullWidth>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={modal.data.type || ''}
                                    onChange={(e) => setModal({ ...modal, data: { ...modal.data, type: e.target.value } })}
                                    label="Type"
                                >
                                    <MenuItem value="UG">UG (Undergraduate)</MenuItem>
                                    <MenuItem value="PG">PG (Postgraduate)</MenuItem>
                                    <MenuItem value="PHD">PHD (Doctoral)</MenuItem>
                                </Select>
                            </FormControl>
                        )}

                        {modal.type === 'branch' && (
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
                        )}



                        {modal.type === 'department' && (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={modal.data.hasStudents || false}
                                        onChange={(e) => setModal({ ...modal, data: { ...modal.data, hasStudents: e.target.checked } })}
                                        sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: 'var(--color-primary)',
                                            },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: 'var(--color-primary)',
                                            },
                                        }}
                                    />
                                }
                                label="Has Students?"
                                sx={{ mb: 1 }}
                            />
                        )}

                        <TextField
                            label="Name"
                            fullWidth
                            value={modal.data.name || ''}
                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })}
                            //disabled={modal.type === 'branch'}
                            helperText={modal.type === 'branch' ? `Branch name is locked to Department: ${selectedDepartment?.name}` : ""}
                        />

                        {(modal.type === 'department' || modal.type === 'branch' || modal.type === 'program') && (
                            <TextField
                                label="Code"
                                fullWidth
                                value={modal.data.code || ''}
                                onChange={(e) => setModal({ ...modal, data: { ...modal.data, code: e.target.value.toUpperCase() } })}
                                helperText={modal.type === 'department' ? "e.g., CSE" : modal.type === 'program' ? "e.g., BTECH" : "e.g., CSE-VLSI"}
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

            <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ ...deleteConfirm, open: false })}>
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

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

const cardStyle = {
    position: "relative",
    borderRadius: "24px",
    background: "var(--bg-glass)",
    backdropFilter: "blur(18px) saturate(160%)",
    WebkitBackdropFilter: "blur(18px) saturate(160%)",
    border: "1px solid var(--border-color)",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    "&::after": {
        content: '""',
        position: "absolute",
        inset: "-1px",
        borderRadius: "24px",
        padding: "2px",
        background: "var(--gradient-primary)",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        opacity: 0,
        transition: "opacity 0.3s ease",
        pointerEvents: "none"
    },
    "&:hover": {
        transform: "translateY(-8px)",
        background: "var(--bg-panel)",
        boxShadow: "0 12px 40px 0 rgba(0, 0, 0, 0.15)",
        borderColor: "transparent",
    },
    "&:hover::after": {
        opacity: 1
    }
};

const cardDrillStyle = {
    ...cardStyle,
    cursor: "pointer",
};

export default AcademicStructure;
