import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Autocomplete,
  CircularProgress,
  Alert,
  InputAdornment,
  Paper,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  ListSubheader
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CloudUpload as CloudUploadIcon,
  PersonAdd as PersonAddIcon,
  Star as StarIcon,
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
  Badge as BadgeIcon,
  Person as PersonIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
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
// CommitteeRoleManager Component (For Convener & Members)
// ----------------------------------------------------------------------
const CommitteeRoleManager = ({ role, selectedEventType, eventTypes = [] }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    employee: '',
    status: 'Active',
    orderNumber: 0,
    event_type: selectedEventType !== 'ALL' ? selectedEventType : 'VEDA'
  });
  const [editingId, setEditingId] = useState(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { role };
      if (selectedEventType && selectedEventType !== 'ALL') {
        params.event_type = selectedEventType;
      }
      const response = await API.get('/api/central-events/organisation-committee', { params });
      setMembers(response.data?.data || []);
    } catch (error) {
      toast.error(`Failed to load ${role}s`);
    } finally {
      setLoading(false);
    }
  }, [role, selectedEventType]);

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
      setFormData({
        employee: member.employee?._id || '',
        status: member.status || 'Active',
        orderNumber: member.orderNumber || 0,
        event_type: member.event_type || (selectedEventType !== 'ALL' ? selectedEventType : 'VEDA')
      });
    } else {
      setEditingId(null);
      setFormData({
        employee: '',
        status: 'Active',
        orderNumber: 0,
        event_type: selectedEventType !== 'ALL' ? selectedEventType : 'VEDA'
      });
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
      const payload = {
        ...formData,
        role,
        event_type: formData.event_type || (selectedEventType !== 'ALL' ? selectedEventType : 'VEDA')
      };

      if (editingId) {
        await API.put(`/api/central-events/organisation-committee/${editingId}`, payload);
        toast.success(`${role} updated successfully`);
      } else {
        await API.post('/api/central-events/organisation-committee', payload);
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
        await API.delete(`/api/central-events/organisation-committee/${id}`);
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
        <Box display="flex" alignItems="center" gap={1.5}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.25rem' }}>
            {role}s List
          </Typography>
          {selectedEventType && selectedEventType !== 'ALL' && (
            <Chip
              label={selectedEventType}
              size="small"
              sx={{ fontWeight: 700, bgcolor: 'rgba(30, 58, 138, 0.08)', color: '#1e3a8a', borderRadius: '8px' }}
            />
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{
            borderRadius: '9999px',
            textTransform: 'none',
            px: 3,
            py: 1,
            backgroundColor: '#0f172a',
            fontWeight: 600,
            '&:hover': { backgroundColor: '#1e293b' },
            boxShadow: 'none'
          }}
        >
          Add {role}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <DataTable
          columns={['Photo', 'Employee Details', 'Event Type', 'Status', 'Actions']}
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem', mb: 0.5 }}>
                    {member.employee?.name || member.employee?.employeeName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                    Emp ID: {member.employee?.institutionId || member.employee?.employeeCode}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                    Ph: {member.employee?.phone || 'N/A'}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#0284c7', mt: 0.5, fontSize: '0.75rem' }}>
                    Order No: {member.orderNumber || 0}
                  </Typography>
                </Box>
              )
            },
            {
              value: member.event_type || 'VEDA',
              display: (
                <Chip
                  label={member.event_type || 'VEDA'}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    borderRadius: '8px',
                    bgcolor: 'rgba(30, 58, 138, 0.08)',
                    color: '#1e3a8a',
                    border: '1px solid rgba(30, 58, 138, 0.2)'
                  }}
                />
              )
            },
            {
              value: member.status,
              display: (
                <Chip
                  label={member.status}
                  sx={{
                    backgroundColor: member.status === 'Active' ? '#16a34a' : '#e2e8f0',
                    color: member.status === 'Active' ? '#ffffff' : '#475569',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: '24px',
                    borderRadius: '9999px',
                    px: 1
                  }}
                />
              )
            },
            {
              value: 'Actions',
              display: (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <IconButton onClick={() => handleOpen(member)} size="small" sx={{ mr: 1, color: '#0284c7' }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(member._id)} size="small" sx={{ color: '#ef4444' }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              )
            }
          ])}
          alignments={['center', 'left', 'center', 'center', 'center']}
          columnWidths={['10%', '42%', '18%', '15%', '15%']}
          nonSortableColumns={[0, 4]}
        />
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingId ? `Edit ${role}` : `Add ${role}`}
          </DialogTitle>
          <DialogContent dividers>
            {/* Event Type Mapping Selection */}
            <TextField
              select
              fullWidth
              label="Event Type"
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              required
              sx={{ mb: 3, mt: 1 }}
            >
              {eventTypes.length > 0 ? (
                eventTypes.map((t) => (
                  <MenuItem key={t.code} value={t.code}>
                    {t.name} ({t.code})
                  </MenuItem>
                ))
              ) : (
                ['VEDA', 'COLORS', 'ALA', 'CLUB', 'DEPARTMENTAL', 'UNIVERSITY'].map((code) => (
                  <MenuItem key={code} value={code}>
                    {code}
                  </MenuItem>
                ))
              )}
            </TextField>

            <Autocomplete
              options={employees}
              getOptionLabel={(option) => `${option.name || option.employeeName} (${option.institutionId || option.employeeCode})`}
              value={employees.find((emp) => emp._id === formData.employee) || null}
              onChange={(event, newValue) => {
                setFormData({ ...formData, employee: newValue ? newValue._id : '' });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Employee"
                  required
                  sx={{ mb: 3 }}
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
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
              Save
            </Button>
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
  const initials = (name || '').split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase() || 'SC';
  const placeholderSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' fill='%231e40af'/><text x='50%' y='50%' dy='.35em' text-anchor='middle' font-family='Inter, Arial, Helvetica, sans-serif' font-size='46' fill='%23ffffff'>${initials}</text></svg>`;
  const placeholderDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(placeholderSvg)}`;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

  return (
    <Box
      component="img"
      src={rollNo ? `${backendUrl}/api/proxy/student-photo/${rollNo}` : placeholderDataUrl}
      alt="Photo"
      sx={{ ...sx, objectFit: 'cover' }}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = placeholderDataUrl;
      }}
    />
  );
};

const StudentCoordinatorManager = ({ selectedEventType, eventTypes = [] }) => {
  const role = 'Student Coordinator';
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    rollNo: '',
    status: 'Active',
    orderNumber: 0,
    event_type: selectedEventType !== 'ALL' ? selectedEventType : 'VEDA'
  });
  const [editingId, setEditingId] = useState(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { role };
      if (selectedEventType && selectedEventType !== 'ALL') {
        params.event_type = selectedEventType;
      }
      const response = await API.get('/api/central-events/organisation-committee', { params });
      setMembers(response.data?.data || []);
    } catch (error) {
      toast.error(`Failed to load ${role}s`);
    } finally {
      setLoading(false);
    }
  }, [role, selectedEventType]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleOpen = (member = null) => {
    if (member) {
      setEditingId(member._id);
      setFormData({
        rollNo: member.rollNo || '',
        status: member.status || 'Active',
        orderNumber: member.orderNumber || 0,
        event_type: member.event_type || (selectedEventType !== 'ALL' ? selectedEventType : 'VEDA')
      });
    } else {
      setEditingId(null);
      setFormData({
        rollNo: '',
        status: 'Active',
        orderNumber: 0,
        event_type: selectedEventType !== 'ALL' ? selectedEventType : 'VEDA'
      });
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
      const payload = {
        ...formData,
        role,
        event_type: formData.event_type || (selectedEventType !== 'ALL' ? selectedEventType : 'VEDA')
      };

      if (editingId) {
        await API.put(`/api/central-events/organisation-committee/${editingId}`, payload);
        toast.success(`${role} updated successfully`);
      } else {
        await API.post('/api/central-events/organisation-committee', payload);
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
        await API.delete(`/api/central-events/organisation-committee/${id}`);
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
        <Box display="flex" alignItems="center" gap={1.5}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.25rem' }}>
            {role}s List
          </Typography>
          {selectedEventType && selectedEventType !== 'ALL' && (
            <Chip
              label={selectedEventType}
              size="small"
              sx={{ fontWeight: 700, bgcolor: 'rgba(30, 58, 138, 0.08)', color: '#1e3a8a', borderRadius: '8px' }}
            />
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{
            borderRadius: '9999px',
            textTransform: 'none',
            px: 3,
            py: 1,
            backgroundColor: '#0f172a',
            fontWeight: 600,
            '&:hover': { backgroundColor: '#1e293b' },
            boxShadow: 'none'
          }}
        >
          Add {role}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <DataTable
          columns={['Photo', 'Student Details', 'Event Type', 'Status', 'Actions']}
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem', mb: 0.5 }}>
                    {member.studentName || 'Name not found'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                    Roll No: {member.rollNo || 'N/A'}
                  </Typography>
                  {member.mobileNumber && (
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                      Ph: {member.mobileNumber}
                    </Typography>
                  )}
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#0284c7', mt: 0.5, fontSize: '0.75rem' }}>
                    Order No: {member.orderNumber || 0}
                  </Typography>
                </Box>
              )
            },
            {
              value: member.event_type || 'VEDA',
              display: (
                <Chip
                  label={member.event_type || 'VEDA'}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    borderRadius: '8px',
                    bgcolor: 'rgba(30, 58, 138, 0.08)',
                    color: '#1e3a8a',
                    border: '1px solid rgba(30, 58, 138, 0.2)'
                  }}
                />
              )
            },
            {
              value: member.status,
              display: (
                <Chip
                  label={member.status}
                  sx={{
                    backgroundColor: member.status === 'Active' ? '#16a34a' : '#e2e8f0',
                    color: member.status === 'Active' ? '#ffffff' : '#475569',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: '24px',
                    borderRadius: '9999px',
                    px: 1
                  }}
                />
              )
            },
            {
              value: 'Actions',
              display: (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <IconButton onClick={() => handleOpen(member)} size="small" sx={{ mr: 1, color: '#0284c7' }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(member._id)} size="small" sx={{ color: '#ef4444' }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              )
            }
          ])}
          alignments={['center', 'left', 'center', 'center', 'center']}
          columnWidths={['10%', '42%', '18%', '15%', '15%']}
          nonSortableColumns={[0, 4]}
        />
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingId ? `Edit ${role}` : `Add ${role}`}
          </DialogTitle>
          <DialogContent dividers>
            {/* Event Type Mapping Selection */}
            <TextField
              select
              fullWidth
              label="Event Type"
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              required
              sx={{ mb: 3, mt: 1 }}
            >
              {eventTypes.length > 0 ? (
                eventTypes.map((t) => (
                  <MenuItem key={t.code} value={t.code}>
                    {t.name} ({t.code})
                  </MenuItem>
                ))
              ) : (
                ['VEDA', 'COLORS', 'ALA', 'CLUB', 'DEPARTMENTAL', 'UNIVERSITY'].map((code) => (
                  <MenuItem key={code} value={code}>
                    {code}
                  </MenuItem>
                ))
              )}
            </TextField>

            <TextField
              fullWidth
              label="Roll Number"
              value={formData.rollNo}
              onChange={(e) => setFormData({ ...formData, rollNo: e.target.value.toUpperCase() })}
              required
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="Order Number"
              type="number"
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
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

// ----------------------------------------------------------------------
// ReadOnlyCoordinators Component (For School & Faculty Coordinators)
// ----------------------------------------------------------------------
const ReadOnlyCoordinators = ({ type, selectedEventType }) => {
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (type === 'School') {
        let list = [];
        if (selectedEventType && selectedEventType !== 'ALL') {
          // Fetch categories specific to the active event type
          try {
            const res = await API.get(`/api/central-event-types/${selectedEventType}/categories`);
            list = res.data?.data || [];
          } catch (e) {
            console.warn(`Failed to fetch categories for ${selectedEventType}:`, e);
          }

          // If VEDA, also include legacy event-schools for backward compatibility
          if (selectedEventType === 'VEDA') {
            try {
              const legacyRes = await API.get('/api/event-schools');
              const legacySchools = legacyRes.data?.eventSchools || legacyRes.data?.event_schools || legacyRes.data?.data || [];
              const tagged = legacySchools.map((s) => ({ ...s, typeCode: 'VEDA' }));
              list = [...list, ...tagged];
            } catch (e) {
              console.warn('Failed to fetch legacy event schools:', e);
            }
          }
        } else {
          // 'ALL': Fetch all central categories across event types, plus legacy event-schools
          try {
            const [catRes, schoolRes] = await Promise.allSettled([
              API.get('/api/central-event-categories/admin'),
              API.get('/api/event-schools')
            ]);
            const catList = catRes.status === 'fulfilled' ? (catRes.value.data?.data || []) : [];
            const schoolList = schoolRes.status === 'fulfilled' ? (schoolRes.value.data?.eventSchools || schoolRes.value.data?.data || []) : [];
            const taggedSchools = schoolList.map((s) => ({ ...s, typeCode: 'VEDA' }));
            list = [...catList, ...taggedSchools];
          } catch (e) {
            console.warn('Failed to fetch all categories/schools:', e);
          }
        }
        setDataList(list);
      } else {
        // Faculty Coordinators
        let combined = [];
        if (selectedEventType && selectedEventType !== 'ALL') {
          try {
            const centralRes = await API.get('/api/central-events', { params: { typeCode: selectedEventType } });
            combined = centralRes.data?.data || [];
          } catch (e) {
            console.warn(`Failed to fetch central events for ${selectedEventType}:`, e);
          }

          // Only include legacy /api/events if selectedEventType is VEDA (legacy events were all VEDA)
          if (selectedEventType === 'VEDA') {
            try {
              const legacyRes = await API.get('/api/events');
              const legacyEvents = legacyRes.data?.events || legacyRes.data?.data || [];
              const tagged = legacyEvents.map((ev) => ({ ...ev, typeCode: 'VEDA' }));
              combined = [...combined, ...tagged];
            } catch (e) {
              console.warn('Failed to fetch legacy events:', e);
            }
          }
        } else {
          // 'ALL': Fetch both central-events and legacy events
          const [centralRes, legacyRes] = await Promise.allSettled([
            API.get('/api/central-events'),
            API.get('/api/events')
          ]);
          const centralEvents = centralRes.status === 'fulfilled' ? (centralRes.value.data?.data || []) : [];
          const legacyEvents = legacyRes.status === 'fulfilled' ? (legacyRes.value.data?.events || legacyRes.value.data?.data || []) : [];
          const tagged = legacyEvents.map((ev) => ({ ...ev, typeCode: 'VEDA' }));
          combined = [...centralEvents, ...tagged];
        }
        setDataList(combined);
      }
    } catch (error) {
      console.error(`Failed to load ${type} coordinators:`, error);
      toast.error(`Failed to load ${type} coordinators`);
    } finally {
      setLoading(false);
    }
  }, [type, selectedEventType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const coordinators = useMemo(() => {
    const coordsMap = new Map();

    dataList.forEach((item) => {
      let coordsList = [];
      if (type === 'School') {
        if (Array.isArray(item.coordinators) && item.coordinators.length > 0) {
          coordsList.push(...item.coordinators);
        }
        if (item.coordinator && (item.coordinator.empId || item.coordinator.employeeId || item.coordinator.name || item.coordinator.employeeName)) {
          coordsList.push(item.coordinator);
        }

        // Also check subcategories coordinators if any
        if (Array.isArray(item.subcategories)) {
          item.subcategories.forEach((sub) => {
            if (Array.isArray(sub.coordinators) && sub.coordinators.length > 0) {
              sub.coordinators.forEach((sc) => coordsList.push({ ...sc, subcategoryName: sub.name, isSubcategory: true }));
            }
            if (sub.coordinator && (sub.coordinator.empId || sub.coordinator.employeeId || sub.coordinator.name || sub.coordinator.employeeName)) {
              coordsList.push({ ...sub.coordinator, subcategoryName: sub.name, isSubcategory: true });
            }
          });
        }
      } else {
        // Faculty coordinators can be in item.coordinators.faculty or item.facultyCoordinators
        if (item.coordinators?.faculty && Array.isArray(item.coordinators.faculty)) {
          coordsList.push(...item.coordinators.faculty);
        } else if (Array.isArray(item.facultyCoordinators) && item.facultyCoordinators.length > 0) {
          coordsList.push(...item.facultyCoordinators);
        } else if (item.facultyCoordinator) {
          coordsList.push(item.facultyCoordinator);
        }
      }

      coordsList.forEach((c) => {
        if (!c) return;
        const rawId = c.institutionId || c.employeeId || c.employeeCode || c.empId;
        const id = rawId ? String(rawId).trim() : (c.name || c.employeeName ? String(c.name || c.employeeName).trim() : null);
        if (id) {
          let deptName = c.department || '';
          if (typeof deptName === 'object' && deptName.name) deptName = deptName.name;
          if (typeof deptName === 'string' && /^[0-9a-fA-F]{24}$/.test(deptName)) deptName = '';

          const defaultRole = type === 'School'
            ? (c.isSubcategory ? 'Subcategory Coordinator' : ((item.typeCode === 'VEDA' || selectedEventType === 'VEDA') ? 'School Coordinator' : 'Category Coordinator'))
            : 'Faculty Coordinator';

          if (!coordsMap.has(id)) {
            coordsMap.set(id, {
              id,
              name: c.employeeName || c.name || 'N/A',
              department: deptName,
              designation: defaultRole,
              phone: c.phone || c.mobile || 'N/A',
              labels: []
            });
          }

          const eventPrefix = selectedEventType === 'ALL' && (item.typeCode || item.eventType) ? `[${item.typeCode || item.eventType}] ` : '';
          const labelName = type === 'School'
            ? `${eventPrefix}${c.subcategoryName ? `${item.name || item.shortName} (${c.subcategoryName})` : (item.name || item.shortName)}`
            : `${eventPrefix}${item.title || item.eventName}`;

          if (labelName && !coordsMap.get(id).labels.includes(labelName)) {
            coordsMap.get(id).labels.push(labelName);
          }
        }
      });
    });

    return Array.from(coordsMap.values());
  }, [dataList, type, selectedEventType]);

  const displayTypeLabel = type === 'School'
    ? (selectedEventType === 'VEDA' ? 'School' : (selectedEventType === 'ALL' ? 'School / Category' : 'Category'))
    : type;

  return (
    <Box sx={{ mt: 2 }}>
      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          <CircularProgress size={32} />
        </Box>
      ) : coordinators.length === 0 ? (
        <Box sx={{ mt: 4, textAlign: 'center', py: 6 }}>
          <Typography variant="body1" color="text.secondary">
            No {displayTypeLabel} coordinators found for {selectedEventType === 'ALL' ? 'any event type' : selectedEventType}.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mt: 1 }}>
          {coordinators.map((coord) => (
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
  const [eventTypes, setEventTypes] = useState([]);
  const [selectedEventType, setSelectedEventType] = useState('VEDA');
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Fetch Central Event Types for mapping
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await API.get('/api/central-event-types');
        const types = response.data?.data || response.data || [];
        if (Array.isArray(types) && types.length > 0) {
          setEventTypes(types);
          // Default to VEDA if available, or first type
          const hasVeda = types.some((t) => t.code === 'VEDA');
          if (!hasVeda && types[0]?.code) {
            setSelectedEventType(types[0].code);
          }
        }
      } catch (err) {
        console.error('Failed to load event types:', err);
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchTypes();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Organisation Committee"
        subtitle="Manage Conveners, Members, and view Coordinators mapped to Central Event Types"
      />

      {/* Event Type Filter Bar with Grouped Selection */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          my: 3,
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-glass, rgba(255, 255, 255, 0.8))',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 320, maxWidth: 480 }} size="small">
            <InputLabel id="org-event-type-filter-label">Filter by Event Type</InputLabel>
            <Select
              labelId="org-event-type-filter-label"
              id="org-event-type-filter-select"
              value={selectedEventType}
              label="Filter by Event Type"
              onChange={(e) => setSelectedEventType(e.target.value)}
              sx={{ borderRadius: '12px', bgcolor: 'var(--bg-paper)' }}
            >
              <MenuItem value="ALL">
                <em>All Event Types</em>
              </MenuItem>

              <ListSubheader sx={{ fontWeight: 700, color: 'info.main', lineHeight: '32px', bgcolor: 'var(--bg-paper)' }}>
                🌐 Global Level Events
              </ListSubheader>
              {eventTypes
                .filter((t) => (t.levelGroup || 'GLOBAL') === 'GLOBAL' || ['VEDA', 'COLORS', 'ALA'].includes(t.code))
                .map((t) => (
                  <MenuItem key={t.code} value={t.code} sx={{ pl: 3.5 }}>
                    {t.name} ({t.code})
                  </MenuItem>
                ))}

              <ListSubheader sx={{ fontWeight: 700, color: 'success.main', lineHeight: '32px', bgcolor: 'var(--bg-paper)' }}>
                🏫 Institute Level Events
              </ListSubheader>
              {eventTypes
                .filter((t) => t.levelGroup === 'INSTITUTE' || ['CLUB', 'DEPARTMENTAL', 'UNIVERSITY'].includes(t.code))
                .map((t) => (
                  <MenuItem key={t.code} value={t.code} sx={{ pl: 3.5 }}>
                    {t.name} ({t.code})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          {selectedEventType && selectedEventType !== 'ALL' && (
            <Chip
              label={`Active: ${eventTypes.find((t) => t.code === selectedEventType)?.name || selectedEventType}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600, borderRadius: '8px', py: 0.5 }}
            />
          )}
        </Box>
      </Paper>

      {/* Tabs */}
      <CustomTabs
        value={tabValue}
        onChange={handleTabChange}
        tabs={[
          { label: 'Conveners', icon: <StarIcon /> },
          { label: 'Members', icon: <PeopleIcon /> },
          {
            label: selectedEventType === 'VEDA'
              ? 'School Coordinators'
              : (selectedEventType === 'ALL' ? 'School / Category Coordinators' : 'Category Coordinators'),
            icon: <AccountBalanceIcon />
          },
          { label: 'Faculty Coordinators', icon: <BadgeIcon /> },
          { label: 'Student Coordinators', icon: <PersonIcon /> },
        ]}
      />

      <Box sx={{ mt: 3 }}>
        {tabValue === 0 && (
          <CommitteeRoleManager
            role="Convener"
            selectedEventType={selectedEventType}
            eventTypes={eventTypes}
          />
        )}
        {tabValue === 1 && (
          <CommitteeRoleManager
            role="Member"
            selectedEventType={selectedEventType}
            eventTypes={eventTypes}
          />
        )}
        {tabValue === 2 && (
          <ReadOnlyCoordinators
            type="School"
            selectedEventType={selectedEventType}
            eventTypes={eventTypes}
          />
        )}
        {tabValue === 3 && (
          <ReadOnlyCoordinators
            type="Faculty"
            selectedEventType={selectedEventType}
            eventTypes={eventTypes}
          />
        )}
        {tabValue === 4 && (
          <StudentCoordinatorManager
            selectedEventType={selectedEventType}
            eventTypes={eventTypes}
          />
        )}
      </Box>
    </PageContainer>
  );
};

export default OrganisationCommittee;
