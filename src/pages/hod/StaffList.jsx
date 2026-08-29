import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import { People as PeopleIcon, Add as AddIcon } from '@mui/icons-material';
import API from '../../api/axios';
import DataTable from '../../components/data/DataTable';
import Loader from '../../components/common/Loader';
import PageHeader from '../../components/common/PageHeader';
import { PageContainer } from '../../components/common/design-system';
import ActionButton from '../../components/common/ActionButton';
import { toast } from 'sonner';

const StaffList = () => {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [canAddStaff, setCanAddStaff] = useState(false);

  // Add Staff Dialog State
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/employees/hod/staff');
      if (res.data && Array.isArray(res.data)) {
        setStaff(res.data);
      } else if (res.data && res.data.staff) {
        setStaff(res.data.staff);
        setCanAddStaff(res.data.canAddStaff);
      } else {
        setStaff([]);
      }
    } catch (err) {
      console.error('Failed to load  staff', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Debounced search for employee
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await API.get(`/api/employees/search?query=${searchQuery}`);
        // Filter out employees who are already in this department to avoid duplicates
        const alreadyInDeptIds = staff.map(s => s._id);
        const filtered = (res.data || []).filter(emp => !alreadyInDeptIds.includes(emp._id));
        setSearchResults(filtered);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, staff]);

  const handleAddStaffSubmit = async () => {
    if (!selectedEmployee) return;
    setSubmitting(true);
    try {
      const res = await API.post('/api/employees/hod/add-staff', { employeeId: selectedEmployee._id });
      if (res.data?.success) {
        toast.success(res.data.message || "Staff member added successfully!");
        setOpenAddDialog(false);
        setSelectedEmployee(null);
        setSearchQuery("");
        fetchStaff(); // Reload directory
      } else {
        toast.error(res.data?.message || "Failed to add staff member.");
      }
    } catch (err) {
      console.error("Add staff failed", err);
      toast.error(err.response?.data?.message || "Failed to add staff member.");
    } finally {
      setSubmitting(false);
    }
  };

// Dynamic Avatar component with automatic college URL fallbacks
const EmployeeAvatar = ({ item }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const initials = item.name ? item.name.charAt(0).toUpperCase() : 'U';

  useEffect(() => {
    if (item.profileImage) {
      setImgSrc(`/uploads/profile/${item.profileImage}`);
      return;
    }

    if (!item.institutionId) {
      setImgSrc(null);
      return;
    }

    const checkImage = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });
    };

    let isMounted = true;
    const resolveAvatar = async () => {
      const ausUrl = `https://info.aec.edu.in/aus/employeephotos/${item.institutionId}.jpg`;
      const aecUrl = `https://info.aec.edu.in/aec/employeephotos/${item.institutionId}.jpg`;
      const acetUrl = `https://info.aec.edu.in/acet/employeephotos/${item.institutionId}.jpg`;

      if (await checkImage(ausUrl)) {
        if (isMounted) setImgSrc(ausUrl);
      } else if (await checkImage(aecUrl)) {
        if (isMounted) setImgSrc(aecUrl);
      } else if (await checkImage(acetUrl)) {
        if (isMounted) setImgSrc(acetUrl);
      } else {
        if (isMounted) setImgSrc(null);
      }
    };

    resolveAvatar();

    return () => {
      isMounted = false;
    };
  }, [item]);

  return (
    <Avatar
      src={imgSrc}
      sx={{
        width: 40,
        height: 40,
        bgcolor: 'var(--color-primary)',
        color: '#fff',
        fontWeight: 700,
        fontSize: '1rem',
        border: '2px solid var(--border-color)',
      }}
    >
      {initials}
    </Avatar>
  );
};

  const columns = [
    '#',
    'Profile',
    'Faculty Name',
    'Employee ID',
    'Designation',
    'Email Address',
    'Phone Number',
  ];

  const rows = staff.map((item, index) => {
    return [
      index + 1,
      {
        value: item.name || '',
        display: <EmployeeAvatar item={item} />,
      },
      {
        value: item.name || '',
        display: (
          <Typography sx={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
            {item.name || 'N/A'}
          </Typography>
        ),
      },
      item.institutionId || 'N/A',
      item.designation || 'N/A',
      item.email || 'N/A',
      item.phone || 'N/A',
    ];
  });

  return (
    <PageContainer>
      <PageHeader
        title="Department Staff Directory"
        subtitle="View and search all active staff members registered in your department."
        icon={<PeopleIcon />}
        action={
          canAddStaff && (
            <ActionButton
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
            >
              Add Staff
            </ActionButton>
          )
        }
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Loader />
        </Box>
      ) : (
        <DataTable columns={columns} rows={rows} defaultRowsPerPage={10} />
      )}

      <Dialog
        open={openAddDialog}
        onClose={() => {
          setOpenAddDialog(false);
          setSelectedEmployee(null);
          setSearchQuery("");
        }}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '20px',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-color)',
              p: 2
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'var(--text-primary)', pb: 1 }}>
          Add Staff to Department
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 3 }}>
            Search for an existing staff member by name or Employee ID to add them to your department.
          </Typography>
          <Autocomplete
            open={openSearch && searchQuery.trim().length > 0}
            onOpen={() => setOpenSearch(true)}
            onClose={() => setOpenSearch(false)}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            getOptionLabel={(option) => `${option.name} (${option.institutionId}) - ${option.designation || 'Staff'}`}
            options={searchResults}
            loading={searchLoading}
            value={selectedEmployee}
            onChange={(event, newValue) => {
              setSelectedEmployee(newValue);
            }}
            onInputChange={(event, newInputValue) => {
              setSearchQuery(newInputValue);
            }}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              return (
                <Box key={key} component="li" {...optionProps} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 1, px: 2 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{option.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    ID: {option.institutionId} | Designation: {option.designation || 'N/A'}
                  </Typography>
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Staff by Name or ID"
                variant="outlined"
                fullWidth
                InputProps={{
                  ...(params.InputProps || {}),
                  endAdornment: (
                    <>
                      {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps?.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
          <Button
            onClick={() => {
              setOpenAddDialog(false);
              setSelectedEmployee(null);
              setSearchQuery("");
            }}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'var(--text-secondary)' }}
          >
            Cancel
          </Button>
          <ActionButton
            onClick={handleAddStaffSubmit}
            disabled={!selectedEmployee || submitting}
          >
            {submitting ? "Adding..." : "Add Staff"}
          </ActionButton>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default StaffList;
