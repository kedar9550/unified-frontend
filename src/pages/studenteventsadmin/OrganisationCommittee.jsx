import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, IconButton, Chip, Avatar, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Autocomplete, CircularProgress, Alert, InputAdornment, Paper, Tabs, Tab } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, CloudUpload as CloudUploadIcon, PersonAdd as PersonAddIcon, Star as StarIcon, People as PeopleIcon, AccountBalance as AccountBalanceIcon, Badge as BadgeIcon, Person as PersonIcon } from '@mui/icons-material';
import { PageContainer } from '../../components/common/design-system';
import PageHeader from '../../components/common/PageHeader';
import CustomTabs from '../../components/common/CustomTabs';
import ProfileCard from '../../components/common/ProfileCard';
import DataTable from '../../components/data/DataTable';
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
  const [formData, setFormData] = useState({ employee: '', status: 'Active', orderNumber: 0 });
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
      setFormData({ employee: member.employee?._id || '', status: member.status, orderNumber: member.orderNumber || 0 });
    } else {
      setEditingId(null);
      setFormData({ employee: '', status: 'Active', orderNumber: 0 });
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.25rem' }}>{role}s List</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ borderRadius: '9999px', textTransform: 'none', px: 3, py: 1, backgroundColor: '#0f172a', fontWeight: 600, '&:hover': { backgroundColor: '#1e293b' }, boxShadow: 'none' }}>
          Add {role}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : (
        <DataTable
          columns={['Photo', 'Employee Details', 'Status', 'Actions']}
          rows={members.map((member) => [
            {
              value: member.employee?.name || member.employee?.employeeName || 'Unknown',
              display: (
                <CoordinatorPhoto
                  employeeCode={member.employee?.institutionId || member.employee?.employeeCode}
                  name={member.employee?.name}
                  sx={{ width: 48, height: 48, borderRadius: '50%' }}
                />
              )
            },
            {
              value: member.employee?.name || member.employee?.employeeName || '',
              display: (
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem', mb: 0.5 }}>{member.employee?.name || member.employee?.employeeName}</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>Emp ID: {member.employee?.institutionId || member.employee?.employeeCode}</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>Ph: {member.employee?.phone || 'N/A'}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#0284c7', mt: 0.5, fontSize: '0.75rem' }}>Order No: {member.orderNumber || 0}</Typography>
                </Box>
              )
            },
            {
              value: member.status,
              display: (
                <Chip label={member.status} sx={{ backgroundColor: member.status === 'Active' ? '#16a34a' : '#e2e8f0', color: member.status === 'Active' ? '#ffffff' : '#475569', fontWeight: 600, fontSize: '0.75rem', height: '24px', borderRadius: '9999px', px: 1 }} />
              )
            },
            {
              value: 'Actions',
              display: (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <IconButton onClick={() => handleOpen(member)} size="small" sx={{ mr: 1, color: '#0284c7' }}><EditIcon fontSize="small" /></IconButton>
                  <IconButton onClick={() => handleDelete(member._id)} size="small" sx={{ color: '#ef4444' }}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              )
            }
          ])}
          alignments={['center', 'left', 'center', 'center']}
          columnWidths={['10%', '50%', '20%', '20%']}
          nonSortableColumns={[0, 3]}
        />
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
              type="number"
              fullWidth
              label="Order Number"
              value={formData.orderNumber}
              onChange={(e) => setFormData({ ...formData, orderNumber: Number(e.target.value) })}
              sx={{ mb: 3 }}
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
  const [formData, setFormData] = useState({ rollNo: '', status: 'Active', orderNumber: 0 });
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
      setFormData({ rollNo: member.rollNo || '', status: member.status, orderNumber: member.orderNumber || 0 });
    } else {
      setEditingId(null);
      setFormData({ rollNo: '', status: 'Active', orderNumber: 0 });
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.25rem' }}>{role}s List</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ borderRadius: '9999px', textTransform: 'none', px: 3, py: 1, backgroundColor: '#0f172a', fontWeight: 600, '&:hover': { backgroundColor: '#1e293b' }, boxShadow: 'none' }}>
          Add {role}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : (
        <DataTable
          columns={['Photo', 'Student Details', 'Status', 'Actions']}
          rows={members.map((member) => [
            {
              value: member.studentName || member.rollNo || 'Unknown',
              display: (
                <StudentPhoto
                  rollNo={member.rollNo}
                  name={member.studentName}
                  sx={{ width: 48, height: 48, borderRadius: '50%' }}
                />
              )
            },
            {
              value: member.studentName || member.rollNo || '',
              display: (
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem', mb: 0.5 }}>{member.studentName || 'Name not found'}</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>Roll No: {member.rollNo || 'N/A'}</Typography>
                  {member.mobileNumber && <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>Ph: {member.mobileNumber}</Typography>}
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#0284c7', mt: 0.5, fontSize: '0.75rem' }}>Order No: {member.orderNumber || 0}</Typography>
                </Box>
              )
            },
            {
              value: member.status,
              display: (
                <Chip label={member.status} sx={{ backgroundColor: member.status === 'Active' ? '#16a34a' : '#e2e8f0', color: member.status === 'Active' ? '#ffffff' : '#475569', fontWeight: 600, fontSize: '0.75rem', height: '24px', borderRadius: '9999px', px: 1 }} />
              )
            },
            {
              value: 'Actions',
              display: (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <IconButton onClick={() => handleOpen(member)} size="small" sx={{ mr: 1, color: '#0284c7' }}><EditIcon fontSize="small" /></IconButton>
                  <IconButton onClick={() => handleDelete(member._id)} size="small" sx={{ color: '#ef4444' }}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              )
            }
          ])}
          alignments={['center', 'left', 'center', 'center']}
          columnWidths={['10%', '50%', '20%', '20%']}
          nonSortableColumns={[0, 3]}
        />
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
              fullWidth
              label="Order Number"
              type="number"
              value={formData.orderNumber}
              onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
              sx={{ mb: 3 }}
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
// ReadOnlyCoordinators Component (For School & Faculty Coordinators)
// ----------------------------------------------------------------------
const ReadOnlyCoordinators = ({ type }) => {
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (type === 'School') {
        const response = await API.get('/api/event-schools');
        setDataList(response.data?.eventSchools || response.data?.event_schools || response.data?.data || []);
      } else {
        const response = await API.get('/api/events');
        setDataList(response.data?.events || response.data?.data || []);
      }
    } catch (error) {
      console.error(`Failed to load ${type} coordinators:`, error);
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
      if (type === 'School') {
        if (Array.isArray(item.coordinators) && item.coordinators.length > 0) {
          coordsList = item.coordinators;
        } else if (item.coordinator) {
          coordsList = [item.coordinator];
        }
      } else {
        coordsList = Array.isArray(item.facultyCoordinators) && item.facultyCoordinators.length > 0
          ? item.facultyCoordinators
          : (item.facultyCoordinator ? [item.facultyCoordinator] : []);
      }

      coordsList.forEach(c => {
        if (!c) return;
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
              designation: c.designation || (type === 'School' ? 'School Coordinator' : 'Faculty Coordinator'),
              phone: c.phone || c.mobile || 'N/A',
              labels: []
            });
          }
          const labelName = type === 'School' ? (item.name || item.shortName) : item.eventName;
          if (labelName && !coordsMap.get(id).labels.includes(labelName)) {
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mt: 1 }}>
          {coordinators.map(coord => (
              <ProfileCard
                key={coord.id}
                name={coord.name}
                role={`${coord.designation} ${coord.department && coord.department !== 'N/A' ? `- ${coord.department}` : ''}`}
                employeeId={coord.id}
                phone={coord.phone}
                labels={coord.labels}
                avatarComponent={
                  <CoordinatorPhoto
                    employeeCode={coord.id}
                    name={coord.name}
                    sx={{ width: 110, height: 110, border: '2px solid #fff', borderRadius: '50%' }}
                  />
                }
              />
          ))}
        </Box>
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
    <PageContainer>
      <PageHeader
        title="Organisation Committee"
        subtitle="Manage Conveners, Members, and view Coordinators"
      />
      <CustomTabs
        value={tabValue}
        onChange={handleTabChange}
        tabs={[
          { label: 'Conveners', icon: <StarIcon /> },
          { label: 'Members', icon: <PeopleIcon /> },
          { label: 'School Coordinators', icon: <AccountBalanceIcon /> },
          { label: 'Faculty Coordinators', icon: <BadgeIcon /> },
          { label: 'Student Coordinators', icon: <PersonIcon /> },
        ]}
      />

      <Box sx={{ mt: 3 }}>
        {tabValue === 0 && <CommitteeRoleManager role="Convener" />}
        {tabValue === 1 && <CommitteeRoleManager role="Member" />}
        {tabValue === 2 && <ReadOnlyCoordinators type="School" />}
        {tabValue === 3 && <ReadOnlyCoordinators type="Faculty" />}
        {tabValue === 4 && <StudentCoordinatorManager />}
      </Box>
    </PageContainer>
  );
};

export default OrganisationCommittee;
