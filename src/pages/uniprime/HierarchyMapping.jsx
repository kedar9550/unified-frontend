import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, Button,
    IconButton, Select, MenuItem, FormControl, InputLabel, CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, Save as SaveIcon, Edit as EditIcon } from '@mui/icons-material';
import API from '../../api/axios';
import { toast } from 'sonner';
import PageHeader from "../../components/common/PageHeader";
import { PageContainer } from "../../components/common/design-system";
import DataTable from "../../components/data/DataTable";

const HierarchyMapping = () => {
    const [employeeMappings, setEmployeeMappings] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form States
    const [empId, setEmpId] = useState('');
    const [roleId, setRoleId] = useState('');

    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(false);

    useEffect(() => {
        fetchMappings();
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setLoadingRoles(true);
        try {
            const res = await API.get("/api/roles");

            const rolesData = res.data?.data || res.data;
            if (Array.isArray(rolesData)) {
                const filteredRoles = rolesData.filter(role => {
                    const key = (role.key || "").toUpperCase();
                    // Filter out HOD, SCHOOL_DEAN and any role with GROUP in its key
                    return key !== "HOD" && key !== "SCHOOL_DEAN" && !key.includes("GROUP");
                });
                setRoles(filteredRoles);
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
            toast.error("Failed to fetch roles.");
        } finally {
            setLoadingRoles(false);
        }
    };

    const fetchMappings = async () => {
        setLoading(true);
        try {
            const empRes = await API.get(`/api/hierarchy-mapping/employee-to-role`);
            const data = empRes.data?.data || empRes.data;
            setEmployeeMappings(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching mappings:", error);
            toast.error("Failed to fetch mappings.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEmployeeMapping = async () => {
        if (!empId || !roleId) {
            toast.warning("Please fill both Employee ID and Role ID");
            return;
        }
        try {
            await API.post(
                `/api/hierarchy-mapping/employee-to-role`,
                { empId, roleId }
            );
            toast.success("Employee mapping saved successfully!");
            setEmpId('');
            setRoleId('');
            fetchMappings();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to save mapping.");
        }
    };

    const handleEdit = (mapping) => {
        setEmpId(mapping.empId);
        setRoleId(mapping.roleId?._id || mapping.roleId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this mapping?")) return;
        try {
            await API.delete(`/api/hierarchy-mapping/${id}`);
            toast.success("Mapping deleted.");
            fetchMappings();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to delete mapping.");
        }
    };

    const columns = ["Employee ID", "Employee Name", "Reporting Role", "Actions"];
    const rows = (employeeMappings || []).map(mapping => [
        mapping.empId,
        mapping.empName || "Unknown Employee",
        mapping.roleId?.name || mapping.roleId?._id || mapping.roleId,
        <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small" color="primary" onClick={() => handleEdit(mapping)}>
                <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => handleDelete(mapping._id)}>
                <DeleteIcon fontSize="small" />
            </IconButton>
        </Box>
    ]);

    const formContent = (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center', width: { xs: '100%', md: 'auto' } }}>
                    <TextField
                        label="Employee ID (e.g., 3541)"
                        value={empId}
                        onChange={(e) => setEmpId(e.target.value)}
                        size="small"
                        sx={{ width: { xs: '100%', md: 'auto' } }}
                    />
                    <FormControl size="small" sx={{ width: { xs: '100%', md: 'auto' }, minWidth: { md: 200 } }}>
                        <InputLabel id="role-select-label">Role</InputLabel>
                        <Select
                            labelId="role-select-label"
                            value={roleId}
                            label="Role"
                            onChange={(e) => setRoleId(e.target.value)}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: 300,
                                    },
                                },
                            }}
                        >
                            {loadingRoles ? (
                                <MenuItem disabled value=""><CircularProgress size={20} sx={{ mr: 1 }} /> Loading...</MenuItem>
                            ) : roles.length > 0 ? (
                                roles.map(role => (
                                    <MenuItem key={role._id} value={role._id}>
                                        {role.name}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled value="">No roles available</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveEmployeeMapping}
                        sx={{ textTransform: 'none', width: { xs: '100%', md: 'auto' } }}
                    >
                        Save Mapping
                    </Button>
        </Box>
    );

    return (
        <PageContainer>
            <PageHeader
                title="Hierarchy Mapping (Special Cases)"
                subtitle="Configure direct reporting lines (Employee ID to Role ID) for faculty who do not follow the standard HOD/Dean structure."
            />

            <Paper sx={{ p: 3 }}>
                <DataTable
                    columns={columns}
                    rows={rows}
                    toolbarLeft={formContent}
                />
            </Paper>

        </PageContainer>
    );
};

export default HierarchyMapping;
