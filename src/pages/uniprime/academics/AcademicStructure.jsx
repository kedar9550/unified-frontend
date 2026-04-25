import React, { useState, useEffect } from "react";
import {
    Box, Typography, Button, Grid, Card, CardContent, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, CircularProgress, IconButton,
    Tooltip, Divider, List, ListItem, ListItemText, ListItemSecondaryAction,
    Snackbar, Alert, Chip, MenuItem, Select, FormControl, InputLabel, Fade,
    Tabs, Tab, Paper, Switch, FormControlLabel
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
        setModal({ open: true, type, mode, data: { ...data } });
    };

    const renderDepartmentsView = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button startIcon={<Add />} onClick={() => openModal('department')} variant="outlined">Add Department</Button>
            </Grid>
            {departments.map(dept => (
                <Grid item xs={12} sm={6} md={4} key={dept._id} onClick={() => setSelectedDepartment(dept)} sx={{ cursor: 'pointer' }}>
                    <Card sx={cardDrillStyle}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between">
                                <Typography variant="h6" fontWeight={700}>{dept.name}</Typography>
                                <Box>
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); openModal('department', 'edit', dept); }}><Edit /></IconButton>
                                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, type: 'department', id: dept._id, name: dept.name }); }}><Delete /></IconButton>
                                </Box>
                            </Box>
                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                <Chip label={dept.code} color="primary" size="small" />
                                {dept.hasStudents && (
                                    <Chip label="Has Students" color="success" size="small" variant="outlined" />
                                )}
                            </Box>
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>{dept.description || "No description"}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );

    const renderProgramsView = () => {
        return (
            <Grid container spacing={3}>
                <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button startIcon={<Add />} onClick={() => openModal('program', 'add')} variant="outlined">Add Program</Button>
                </Grid>
                {programs.length === 0 && (
                    <Grid item xs={12}>
                        <Typography variant="body1" color="textSecondary" align="center" py={5}>No programs found. Click 'Add Program' to create one.</Typography>
                    </Grid>
                )}
                {programs.map(prog => (
                    <Grid item xs={12} sm={6} md={4} key={prog._id} sx={{ cursor: 'default' }}>
                        <Card sx={cardStyle}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="h6" fontWeight={700}>{prog.name}</Typography>
                                    <Box>
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openModal('program', 'edit', prog); }}><Edit /></IconButton>
                                        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, type: 'program', id: prog._id, name: prog.name }); }}><Delete /></IconButton>
                                    </Box>
                                </Box>
                                <Box mt={1} display="flex" gap={1}>
                                    <Chip label={prog.code} size="small" color="primary" />
                                    <Chip label={prog.type} size="small" variant="outlined" />
                                </Box>
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>{prog.description || "No description"}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    };

    const renderBranchesView = () => {
        const deptBranches = branches.filter(b => b.departmentId?._id === selectedDepartment._id);

        return (
            <Grid container spacing={3}>
                <Grid item xs={12} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Button startIcon={<ArrowBack />} onClick={() => setSelectedDepartment(null)}>
                        Back to Departments
                    </Button>
                    <Button startIcon={<Add />} onClick={() => openModal('branch', 'add', { departmentId: selectedDepartment._id })} variant="outlined">
                        Add Branch
                    </Button>
                </Grid>
                {deptBranches.length === 0 && (
                    <Grid item xs={12}>
                        <Typography variant="body1" color="textSecondary" align="center" py={5}>No branches found for this department. Click 'Add Branch' to create one.</Typography>
                    </Grid>
                )}
                {deptBranches.map(branch => (
                    <Grid item xs={12} sm={6} md={4} key={branch._id} sx={{ cursor: 'pointer' }}>
                        <Card sx={cardStyle}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="h6" fontWeight={700}>{branch.name}</Typography>
                                    <Box>
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openModal('branch', 'edit', branch); }}><Edit /></IconButton>
                                        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, type: 'branch', id: branch._id, name: branch.name }); }}><Delete /></IconButton>
                                    </Box>
                                </Box>
                                <Box mt={1} display="flex" alignItems="center" gap={1}>
                                    <Chip label={branch.code} size="small" color="primary" />
                                    {branch.programId && (
                                        <Typography variant="caption" color="textSecondary">IN {branch.programId.name}</Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
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
                <Paper sx={{ mb: 3, pt: 1, px: 2 }}>
                    <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
                        <Tab icon={<Business />} iconPosition="start" label="Departments & Branches" />
                        <Tab icon={<School />} iconPosition="start" label="Programs" />
                    </Tabs>
                </Paper>
            )}

            {selectedDepartment && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1, backgroundColor: 'rgba(255,255,255,0.5)', p: 1, borderRadius: 2 }}>
                    <Button
                        variant="text"
                        onClick={() => setSelectedDepartment(null)}
                        startIcon={<Business />}
                    >
                        Departments
                    </Button>
                    <Typography color="textSecondary">/</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AccountTree />}
                        disableElevation
                    >
                        {selectedDepartment.code || selectedDepartment.name} Branches
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
                <DialogTitle>{modal.mode === 'add' ? 'Add' : 'Edit'} {modal.type?.toUpperCase()}</DialogTitle>
                <DialogContent>
                    <Box mt={1} display="flex" flexDirection="column" gap={2}>
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
                                        color="primary"
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
                            helperText={modal.type === 'branch' ? "e.g., Computer Science, VLSI Design" : ""}
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
                    <Button onClick={() => setModal({ ...modal, open: false })}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" disabled={submitting}>
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
                    <Button onClick={() => setDeleteConfirm({ ...deleteConfirm, open: false })}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained" disabled={submitting}>Delete</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

const cardStyle = {
    height: '100%',
    borderRadius: "16px",
    background: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(0,0,0,0.05)",
    transition: "transform 0.2s",
    "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 10px 20px rgba(0,0,0,0.1)"
    }
};

const cardDrillStyle = {
    ...cardStyle,
    cursor: "pointer",
    "&:hover": {
        transform: "translateY(-6px)",
        boxShadow: "0 14px 28px rgba(0,0,0,0.15), 0 0 0 2px rgba(25, 118, 210, 0.5) inset"
    }
};

export default AcademicStructure;
