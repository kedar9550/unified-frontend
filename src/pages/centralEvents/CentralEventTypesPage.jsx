import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
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
  ArrowBack as ArrowBackIcon,
  Category as CategoryIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  getAllCentralEventTypesAdmin,
  createCentralEventType,
  updateCentralEventType,
  deleteCentralEventType,
  uploadCentralEventFile
} from '../../api/centralEventsApi';
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
      const res = await uploadCentralEventFile(file);
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

  const displayedTypes = types.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/central-events')} sx={{ mb: 2 }}>
        Back to Central Events Hub
      </Button>

      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Central Event Types Management
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Define, edit, and configure rules and banner branding for all central event types
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1.2, fontWeight: 600 }}
        >
          Add Event Type
        </Button>
      </Paper>

      {/* Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell><strong>S.No</strong></TableCell>
                  <TableCell><strong>Banner</strong></TableCell>
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
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
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
                              borderRadius: 6,
                              border: '1px solid #e2e8f0'
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 60,
                              height: 38,
                              borderRadius: 6,
                              backgroundColor: '#f1f5f9',
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
                        <Chip label={row.code} color="primary" size="small" sx={{ fontWeight: 700 }} />
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
                              <Chip key={lvl} label={lvl} size="small" color="secondary" variant="outlined" />
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
            count={types.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingItem ? 'Edit Event Type' : 'Add New Event Type'}</DialogTitle>
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
              />

              <TextField
                fullWidth
                required
                label="Event Type Name"
                placeholder="e.g. VEDA National Tech Fest"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              {/* Banner Upload Section */}
              <Box sx={{ border: '1px border-dashed #cbd5e1', p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
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
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                    <input type="file" hidden accept="image/*" onChange={handleBannerUpload} />
                  </Button>

                  {banner && (
                    <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: 2 }}>
                      <img
                        src={getImageUrl(banner)}
                        alt="Banner Preview"
                        style={{ width: 70, height: 42, objectFit: 'cover', borderRadius: 4, marginRight: 8 }}
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
                    input={<OutlinedInput label="Allowed Levels" />}
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
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button variant="contained" type="submit" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : editingItem ? 'Update Type' : 'Create Type'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this event type? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
