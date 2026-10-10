import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Stack,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Card
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Folder as FolderIcon,
  Event as EventIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  Public as PublicIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getAllCentralEventTypesAdmin,
  createCentralEventType,
  updateCentralEventType,
  deleteCentralEventType,
  uploadCentralEventFile
} from '../../api/centralEventsApi';
import { PageHeader, CustomTabs } from '../../components/common';
import PageContainer from '../../components/common/design-system/PageContainer';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9022';

const getImageUrl = (img) => {
  if (!img) return '';
  const pathStr = typeof img === 'string' ? img : img.url;
  if (!pathStr) return '';
  return pathStr.startsWith('http') ? pathStr : `${BACKEND_URL}${pathStr.startsWith('/') ? '' : '/'}${pathStr}`;
};

const LEVEL_OPTIONS = ['STUDENT', 'FACULTY'];

export default function CentralEventTypesPage() {
  const navigate = useNavigate();
  const { user, activeRole } = useAuth();

  const userRoles = (user?.roles || []).map(r => (typeof r === 'string' ? r : (r.role?.key || r.role?.name || r.role || '')).toUpperCase());
  const isGlobalAdmin = userRoles.includes('GLOBAL_EVENT_ADMIN') || userRoles.includes('SUPER_ADMIN') || activeRole?.toUpperCase() === 'GLOBAL_EVENT_ADMIN';

  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [levelGroup, setLevelGroup] = useState('GLOBAL');
  const [hasCategories, setHasCategories] = useState(false);
  const [hasLevels, setHasLevels] = useState(false);
  const [allowedLevels, setAllowedLevels] = useState([]);
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  // Banner State
  const [banner, setBanner] = useState(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Delete Confirm Dialog State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Navigation Tabs
  const navTabs = [
    { key: 'all', label: 'All Central Events', icon: <EventIcon />, path: '/central-events' },
    { key: 'types', label: 'Event Types', icon: <CategoryIcon />, path: '/central-events/types' },
    { key: 'categories', label: 'Event Categories', icon: <FolderIcon />, path: '/central-events/categories' },
    { key: 'subcategories', label: 'Event Subcategories', icon: <FolderIcon />, path: '/central-events/subcategories' },
    ...(isGlobalAdmin ? [{ key: 'create', label: 'Create Event', icon: <AddIcon />, path: '/central-events/create' }] : [])
  ];

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await getAllCentralEventTypesAdmin();
      if (res.success) {
        setTypes(res.data);
      }
    } catch (err) {
      toast.error('Failed to load central event types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setCode('');
    setName('');
    setLevelGroup('GLOBAL');
    setHasCategories(false);
    setHasLevels(false);
    setAllowedLevels([]);
    setSortOrder('0');
    setIsActive(true);
    setBanner(null);
    setOpenModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setCode(item.code);
    setName(item.name);
    setLevelGroup(item.levelGroup || 'GLOBAL');
    setHasCategories(!!item.hasCategories);
    setHasLevels(!!item.hasLevels);
    setAllowedLevels(item.allowedLevels || []);
    setSortOrder(String(item.sortOrder || 0));
    setIsActive(item.isActive !== undefined ? item.isActive : true);
    setBanner(item.banner || null);
    setOpenModal(true);
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
      const res = await uploadCentralEventFile(file, { folderType: 'category' });
      if (res.success) {
        setBanner(res.data);
        toast.success('Banner image uploaded');
      }
    } catch (err) {
      toast.error('Failed to upload banner image');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        levelGroup,
        hasCategories,
        hasLevels,
        allowedLevels: hasLevels ? allowedLevels : [],
        sortOrder: parseInt(sortOrder || '0', 10),
        isActive,
        banner
      };

      if (editingItem) {
        const res = await updateCentralEventType(editingItem._id, payload);
        if (res.success) {
          toast.success('Event type updated successfully');
          setOpenModal(false);
          fetchTypes();
        }
      } else {
        const res = await createCentralEventType(payload);
        if (res.success) {
          toast.success('Event type created successfully');
          setOpenModal(false);
          fetchTypes();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await deleteCentralEventType(deleteConfirmId);
      if (res.success) {
        toast.success('Event type deleted successfully');
        setDeleteConfirmId(null);
        fetchTypes();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete event type');
    }
  };

  // Scope Filter Tabs State (ALL, GLOBAL, INSTITUTE)
  const [scopeTab, setScopeTab] = useState('ALL');

  const globalCount = types.filter(t => (t.levelGroup || 'GLOBAL') === 'GLOBAL' || ['VEDA','COLORS','ALA'].includes(t.code)).length;
  const instituteCount = types.filter(t => t.levelGroup === 'INSTITUTE' || ['CLUB','DEPARTMENTAL','UNIVERSITY'].includes(t.code)).length;

  const filteredTypes = types.filter(t => {
    if (scopeTab === 'GLOBAL') {
      return (t.levelGroup || 'GLOBAL') === 'GLOBAL' || ['VEDA', 'COLORS', 'ALA'].includes(t.code);
    }
    if (scopeTab === 'INSTITUTE') {
      return t.levelGroup === 'INSTITUTE' || ['CLUB', 'DEPARTMENTAL', 'UNIVERSITY'].includes(t.code);
    }
    return true;
  });

  const displayedTypes = filteredTypes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <PageContainer maxWidth="xl" px={3} py={3}>
      {/* Standard Page Header */}
      <PageHeader
        title="Central Event Types Management"
        subtitle="Define, edit, and configure rules and banner branding for all central event types"
        icon={<CategoryIcon />}
        showBack
        backPath="/central-events"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              px: 3,
              py: 1.2,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            Add Event Type
          </Button>
        }
      />

      {/* Scope Sub-Tabs (All, Global Event Types, Institute Level Event Types) */}
      <Paper
        elevation={0}
        sx={{
          p: 1.2,
          mb: 3,
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
        }}
      >
        <Tabs
          value={scopeTab}
          onChange={(e, val) => {
            setScopeTab(val);
            setPage(0);
          }}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.925rem',
              borderRadius: '12px',
              px: 3,
              minHeight: 44,
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                backgroundColor: 'var(--bg-accent-4, rgba(37, 99, 235, 0.1))',
                color: 'var(--color-primary, #2563eb)'
              }
            }
          }}
        >
          <Tab
            icon={<CategoryIcon fontSize="small" />}
            iconPosition="start"
            label={`All Event Types (${types.length})`}
            value="ALL"
          />
          <Tab
            icon={<PublicIcon fontSize="small" />}
            iconPosition="start"
            label={`Global Event Types (${globalCount})`}
            value="GLOBAL"
          />
          <Tab
            icon={<AccountBalanceIcon fontSize="small" />}
            iconPosition="start"
            label={`Institute Level Event Types (${instituteCount})`}
            value="INSTITUTE"
          />
        </Tabs>
      </Paper>

      {/* Table Section */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper
          elevation={0}
          sx={{
            borderRadius: '18px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-paper)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
          }}
        >
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: 'var(--bg-accent-1, #f8fafc)' }}>
                <TableRow>
                  <TableCell><strong>S.No</strong></TableCell>
                  <TableCell><strong>Banner</strong></TableCell>
                  <TableCell><strong>Level Scope</strong></TableCell>
                  <TableCell><strong>Code</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Has Categories</strong></TableCell>
                  <TableCell><strong>Has Levels</strong></TableCell>
                  <TableCell><strong>Allowed Levels</strong></TableCell>
                  <TableCell><strong>Sort Order</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {types.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                      No event types found. Click "Add Event Type" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedTypes.map((row, index) => (
                    <TableRow key={row._id} hover>
                      <TableCell><Typography fontWeight={600} color="text.secondary">{page * rowsPerPage + index + 1}</Typography></TableCell>
                      <TableCell>
                        {row.banner?.url ? (
                          <img
                            src={getImageUrl(row.banner)}
                            alt={row.name}
                            style={{
                              width: 60,
                              height: 38,
                              objectFit: 'cover',
                              borderRadius: 8,
                              border: '1px solid var(--border-color)'
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 60,
                              height: 38,
                              borderRadius: 2,
                              backgroundColor: 'var(--bg-accent-2, #f1f5f9)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#94a3b8'
                            }}
                          >
                            <ImageIcon fontSize="small" />
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={row.levelGroup === 'INSTITUTE' ? <AccountBalanceIcon fontSize="small" /> : <PublicIcon fontSize="small" />}
                          label={row.levelGroup === 'INSTITUTE' ? 'Institute Level' : 'Global Level'}
                          color={row.levelGroup === 'INSTITUTE' ? 'success' : 'info'}
                          size="small"
                          sx={{ fontWeight: 600, borderRadius: '8px' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={row.code} color="primary" size="small" sx={{ fontWeight: 700, borderRadius: '8px' }} />
                      </TableCell>
                      <TableCell><Typography fontWeight={600}>{row.name}</Typography></TableCell>
                      <TableCell>
                        <Chip
                          label={row.hasCategories ? 'Yes' : 'No'}
                          color={row.hasCategories ? 'success' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.hasLevels ? 'Yes' : 'No'}
                          color={row.hasLevels ? 'info' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {row.allowedLevels?.length > 0 ? (
                            row.allowedLevels.map((lvl) => (
                              <Chip key={lvl} label={lvl} size="small" color="secondary" variant="outlined" sx={{ borderRadius: '6px' }} />
                            ))
                          ) : (
                            <Typography variant="caption" color="text.secondary">N/A</Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>{row.sortOrder}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.isActive ? 'Active' : 'Inactive'}
                          color={row.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleOpenEdit(row)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => setDeleteConfirmId(row._id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredTypes.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Add / Edit Dialog with Standardized MUI Form Fields */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingItem ? 'Edit Event Type' : 'Add New Event Type'}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5} mt={1}>
              <TextField
                fullWidth
                required
                label="Event Type Code (Unique)"
                placeholder="e.g. VEDA, WORKSHOP"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={!!editingItem}
                slotProps={{ input: { sx: { borderRadius: '12px' } } }}
              />

              <TextField
                fullWidth
                required
                label="Event Type Name"
                placeholder="e.g. VEDA National Tech Fest"
                value={name}
                onChange={(e) => setName(e.target.value)}
                slotProps={{ input: { sx: { borderRadius: '12px' } } }}
              />

              <FormControl fullWidth required>
                <InputLabel id="level-group-select-label">Level Scope Group</InputLabel>
                <Select
                  labelId="level-group-select-label"
                  value={levelGroup}
                  label="Level Scope Group"
                  onChange={(e) => setLevelGroup(e.target.value)}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value="GLOBAL">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PublicIcon color="info" fontSize="small" />
                      <Typography fontWeight={600}>Global Level Events</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="INSTITUTE">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AccountBalanceIcon color="success" fontSize="small" />
                      <Typography fontWeight={600}>Institute Level Events</Typography>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Banner Upload Section */}
              <Box sx={{ border: '1px dashed var(--border-color)', p: 2, borderRadius: '12px', bgcolor: 'var(--bg-accent-1, #f8fafc)' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Event Type Banner Image
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    disabled={uploadingBanner}
                    size="small"
                    sx={{ textTransform: 'none', borderRadius: '10px' }}
                  >
                    {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                    <input type="file" hidden accept="image/*" onChange={handleBannerUpload} />
                  </Button>

                  {banner && (
                    <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: '10px' }}>
                      <img
                        src={getImageUrl(banner)}
                        alt="Banner Preview"
                        style={{ width: 70, height: 42, objectFit: 'cover', borderRadius: 6, marginRight: 8 }}
                      />
                      <Typography variant="caption" fontWeight={600} sx={{ maxWidth: 140 }} noWrap>
                        {banner.name}
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => setBanner(null)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Card>
                  )}
                </Stack>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={hasCategories}
                    onChange={(e) => setHasCategories(e.target.checked)}
                    color="primary"
                  />
                }
                label="Has Categories (Cat1..CatN)"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={hasLevels}
                    onChange={(e) => {
                      setHasLevels(e.target.checked);
                      if (!e.target.checked) setAllowedLevels([]);
                    }}
                    color="primary"
                  />
                }
                label="Has Levels (STUDENT / FACULTY)"
              />

              {hasLevels && (
                <FormControl fullWidth>
                  <InputLabel id="allowed-levels-select-label">Allowed Levels</InputLabel>
                  <Select
                    labelId="allowed-levels-select-label"
                    multiple
                    value={allowedLevels}
                    onChange={(e) => setAllowedLevels(e.target.value)}
                    input={<OutlinedInput label="Allowed Levels" sx={{ borderRadius: '12px' }} />}
                    renderValue={(selected) => selected.join(', ')}
                  >
                    {LEVEL_OPTIONS.map((lvl) => (
                      <MenuItem key={lvl} value={lvl}>
                        <Checkbox checked={allowedLevels.indexOf(lvl) > -1} />
                        <ListItemText primary={lvl} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <TextField
                fullWidth
                type="number"
                label="Sort Order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                slotProps={{ input: { sx: { borderRadius: '12px' } } }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    color="success"
                  />
                }
                label="Active Status"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenModal(false)} sx={{ borderRadius: '10px' }}>Cancel</Button>
            <Button variant="contained" type="submit" disabled={submitting} sx={{ borderRadius: '10px', px: 3 }}>
              {submitting ? <CircularProgress size={24} /> : editingItem ? 'Update Type' : 'Create Type'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this event type? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmId(null)} sx={{ borderRadius: '10px' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ borderRadius: '10px' }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
