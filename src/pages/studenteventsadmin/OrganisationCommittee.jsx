import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Tabs, Tab, Card, CardContent, Typography, Grid, CircularProgress, Chip,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Autocomplete,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import API from '../../api/axios';
import { toast } from 'sonner';

// Reusable Photo component from existing coordinator pages
const CAMPUS_PHOTO_BASES = [
  'https://info.aec.edu.in/aus/employeephotos',
  'https://info.aec.edu.in/aec/employeephotos',
  'https://info.aec.edu.in/acet/employeephotos',
  'https://info.aec.edu.in/acoe/employeephotos',
];

function CoordinatorPhoto({ employeeCode, name, sx }) {
  const initials = (name || '').split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'FC';
  const placeholderSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' fill='%231e40af'/><text x='50%' y='50%' dy='.35em' text-anchor='middle' font-family='Inter, Arial, Helvetica, sans-serif' font-size='46' fill='%23ffffff'>${initials}</text></svg>`;
  const placeholderDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(placeholderSvg)}`;

  const [attemptIndex, setAttemptIndex] = useState(0);
  const [imgSrc, setImgSrc] = useState(
    employeeCode ? `${CAMPUS_PHOTO_BASES[0]}/${employeeCode}.jpg` : placeholderDataUrl
  );

  useEffect(() => {
    setAttemptIndex(0);
    setImgSrc(employeeCode ? `${CAMPUS_PHOTO_BASES[0]}/${employeeCode}.jpg` : placeholderDataUrl);
  }, [employeeCode]);

  const handleError = () => {
    const nextIndex = attemptIndex + 1;
    if (nextIndex < CAMPUS_PHOTO_BASES.length) {
      setAttemptIndex(nextIndex);
      setImgSrc(`${CAMPUS_PHOTO_BASES[nextIndex]}/${employeeCode}.jpg`);
    } else {
      setImgSrc(placeholderDataUrl);
    }
  };

  return (
    <Box component="img" src={imgSrc} alt={`Photo`} sx={{ ...sx, objectFit: 'cover' }} onError={handleError} />
  );
}

// ----------------------------------------------------------------------
// CommitteeRoleManager Component (For Convener & Co-convener)
// ----------------------------------------------------------------------
const CommitteeRoleManager = ({ role }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({ employee: '', status: 'Active' });
  const [editingId, setEditingId] = useState(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get(`/api/organisation-committee?role=${role}`);
      setMembers(response.data?.data || []);
    } catch (error) {
      toast.error(`Failed to load ${role}s`);
    } finally {
      setLoading(false);
    }
  }, [role]);

  const fetchEmployees = async () => {
    try {
      const response = await API.get('/api/employees');
      setEmployees(response.data?.data || response.data || []);
    } catch (error) {
      toast.error('Failed to load employees');
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchEmployees();
  }, [fetchMembers]);

  const handleOpen = (member = null) => {
    if (member) {
      setEditingId(member._id);
      setFormData({ employee: member.employee?._id || '', status: member.status });
    } else {
      setEditingId(null);
      setFormData({ employee: '', status: 'Active' });
    }
    setOpenModal(true);
  };

  const handleClose = () => {
    setOpenModal(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/api/organisation-committee/${editingId}`, formData);
        toast.success(`${role} updated successfully`);
      } else {
        await API.post('/api/organisation-committee', { ...formData, role });
        toast.success(`${role} added successfully`);
      }
      fetchMembers();
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to save ${role}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete this ${role}?`)) {
      try {
        await API.delete(`/api/organisation-committee/${id}`);
        toast.success(`${role} deleted successfully`);
        fetchMembers();
      } catch (error) {
        toast.error(`Failed to delete ${role}`);
      }
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">{role}s List</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add {role}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ backgroundColor: 'background.default' }}>
              <TableRow>
                <TableCell>Photo</TableCell>
                <TableCell>Employee Details</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>No {role}s found.</TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member._id}>
                    <TableCell>
                      <CoordinatorPhoto
                        employeeCode={member.employee?.institutionId || member.employee?.employeeCode}
                        name={member.employee?.name}
                        sx={{ width: 50, height: 50, borderRadius: '50%' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight={600}>{member.employee?.name || member.employee?.employeeName}</Typography>
                      <Typography variant="body2" color="textSecondary">Emp ID: {member.employee?.institutionId || member.employee?.employeeCode}</Typography>
                      <Typography variant="caption" color="textSecondary">Ph: {member.employee?.phone || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={member.status} color={member.status === 'Active' ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpen(member)}><EditIcon /></IconButton>
                      <IconButton color="error" onClick={() => handleDelete(member._id)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingId ? `Edit ${role}` : `Add ${role}`}</DialogTitle>
          <DialogContent dividers>
            <Autocomplete
              options={employees}
              getOptionLabel={(option) => `${option.name || option.employeeName} (${option.institutionId || option.employeeCode})`}
              value={employees.find(emp => emp._id === formData.employee) || null}
              onChange={(event, newValue) => {
                setFormData({ ...formData, employee: newValue ? newValue._id : '' });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Employee"
                  required
                  sx={{ mb: 3, mt: 1 }}
                />
              )}
            />
            <TextField
              select
              fullWidth
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

// ----------------------------------------------------------------------
// StudentCoordinatorManager Component
// ----------------------------------------------------------------------
const StudentPhoto = ({ rollNo, name, sx }) => {
  const initials = (name || '').split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'SC';
  const placeholderSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' fill='%231e40af'/><text x='50%' y='50%' dy='.35em' text-anchor='middle' font-family='Inter, Arial, Helvetica, sans-serif' font-size='46' fill='%23ffffff'>${initials}</text></svg>`;
  const placeholderDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(placeholderSvg)}`;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:9000";

  return (
    <Box
      component="img"
      src={rollNo ? `${backendUrl}/api/proxy/student-photo/${rollNo}` : placeholderDataUrl}
      alt="Photo"
      sx={{ ...sx, objectFit: 'cover' }}
      onError={(e) => { e.target.onerror = null; e.target.src = placeholderDataUrl; }}
    />
  );
};

const StudentCoordinatorManager = () => {
  const role = 'Student Coordinator';
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({ rollNo: '', status: 'Active' });
  const [editingId, setEditingId] = useState(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get(`/api/organisation-committee?role=${role}`);
      setMembers(response.data?.data || []);
    } catch (error) {
      toast.error(`Failed to load ${role}s`);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleOpen = (member = null) => {
    if (member) {
      setEditingId(member._id);
      setFormData({ rollNo: member.rollNo || '', status: member.status });
    } else {
      setEditingId(null);
      setFormData({ rollNo: '', status: 'Active' });
    }
    setOpenModal(true);
  };

  const handleClose = () => {
    setOpenModal(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/api/organisation-committee/${editingId}`, formData);
        toast.success(`${role} updated successfully`);
      } else {
        await API.post('/api/organisation-committee', { ...formData, role });
        toast.success(`${role} added successfully`);
      }
      fetchMembers();
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to save ${role}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete this ${role}?`)) {
      try {
        await API.delete(`/api/organisation-committee/${id}`);
        toast.success(`${role} deleted successfully`);
        fetchMembers();
      } catch (error) {
        toast.error(`Failed to delete ${role}`);
      }
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">{role}s List</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add {role}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ backgroundColor: 'background.default' }}>
              <TableRow>
                <TableCell>Photo</TableCell>
                <TableCell>Student Details</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>No {role}s found.</TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member._id}>
                    <TableCell>
                      <StudentPhoto
                        rollNo={member.rollNo}
                        name={member.rollNo}
                        sx={{ width: 50, height: 50, borderRadius: '50%' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight={600}>{member.studentName || 'Name not found'}</Typography>
                      <Typography variant="body2" color="textSecondary">Roll No: {member.rollNo || 'N/A'}</Typography>
                      {member.mobileNumber && <Typography variant="caption" color="textSecondary" display="block">Ph: {member.mobileNumber}</Typography>}
                    </TableCell>
                    <TableCell>
                      <Chip label={member.status} color={member.status === 'Active' ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpen(member)}><EditIcon /></IconButton>
                      <IconButton color="error" onClick={() => handleDelete(member._id)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingId ? `Edit ${role}` : `Add ${role}`}</DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              label="Roll Number"
              value={formData.rollNo}
              onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
              required
              sx={{ mb: 3, mt: 1 }}
            />
            <TextField
              select
              fullWidth
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

// ----------------------------------------------------------------------
// ReadOnlyCoordinators Component (For Event & Faculty Coordinators)
// ----------------------------------------------------------------------
const ReadOnlyCoordinators = ({ type }) => {
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = type === 'Event' ? '/api/groups' : '/api/events';
      const response = await API.get(endpoint);
      setDataList(response.data?.groups || response.data?.events || []);
    } catch (error) {
      toast.error(`Failed to load ${type} coordinators`);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const coordinators = useMemo(() => {
    const coordsMap = new Map();

    dataList.forEach(item => {
      let coordsList = [];
      if (type === 'Event') {
        if (item.coordinator) coordsList = [item.coordinator];
      } else {
        coordsList = Array.isArray(item.facultyCoordinators) && item.facultyCoordinators.length > 0
          ? item.facultyCoordinators
          : (item.facultyCoordinator ? [item.facultyCoordinator] : []);
      }

      coordsList.forEach(c => {
        const id = c.institutionId || c.employeeId || c.employeeCode;
        if (id) {
          let deptName = c.department || '';
          if (typeof deptName === 'object' && deptName.name) deptName = deptName.name;
          if (typeof deptName === 'string' && /^[0-9a-fA-F]{24}$/.test(deptName)) deptName = '';

          if (!coordsMap.has(id)) {
            coordsMap.set(id, {
              id,
              name: c.employeeName || c.name || 'N/A',
              department: deptName,
              designation: c.designation || 'Coordinator',
              phone: c.phone || c.mobile || 'N/A',
              labels: []
            });
          }
          const labelName = type === 'Event' ? item.name : item.eventName;
          if (!coordsMap.get(id).labels.includes(labelName)) {
            coordsMap.get(id).labels.push(labelName);
          }
        }
      });
    });

    return Array.from(coordsMap.values());
  }, [dataList, type]);

  return (
    <Box sx={{ mt: 2 }}>
      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}><CircularProgress size={32} /></Box>
      ) : coordinators.length === 0 ? (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">No coordinators found.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {coordinators.map(coord => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={coord.id}>
              <Card sx={{
                height: '100%', display: 'flex', flexDirection: 'column',
                borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }
              }}>
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4 }}>
                  <CoordinatorPhoto employeeCode={coord.id} name={coord.name} sx={{ width: 80, height: 80, mx: 'auto', mb: 2, borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'block' }} />
                  <Typography variant="h6" fontWeight="700" gutterBottom>{coord.name}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {coord.designation} {coord.department && coord.department !== 'N/A' ? `- ${coord.department}` : ''}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600 }}>ID: {coord.id}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary', fontWeight: 600 }}>Ph: {coord.phone}</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mt: 2 }}>
                    {coord.labels.map(l => (
                      <Chip key={l} label={l} size="small" color="primary" variant="outlined" sx={{ borderRadius: '8px', fontWeight: 600 }} />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

// ----------------------------------------------------------------------
// Main OrganisationCommittee Component
// ----------------------------------------------------------------------
const OrganisationCommittee = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3, lg: 4 } }}>
      <PageHeader
        title="Organisation Committee"
        subtitle="Manage Conveners, Members, and view Coordinators"
      />
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3, backgroundColor: 'background.paper', borderRadius: 1 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Conveners" />
          <Tab label="Members" />
          <Tab label="Event Coordinators" />
          <Tab label="Faculty Coordinators" />
          <Tab label="Student Coordinators" />
        </Tabs>
      </Box>

      <Box sx={{ mt: 3 }}>
        {tabValue === 0 && <CommitteeRoleManager role="Convener" />}
        {tabValue === 1 && <CommitteeRoleManager role="Member" />}
        {tabValue === 2 && <ReadOnlyCoordinators type="Event" />}
        {tabValue === 3 && <ReadOnlyCoordinators type="Faculty" />}
        {tabValue === 4 && <StudentCoordinatorManager />}
      </Box>
    </Box>
  );
};

export default OrganisationCommittee;
