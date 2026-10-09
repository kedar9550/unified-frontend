import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  MenuItem,
  IconButton,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  InputAdornment,
} from '@mui/material';
import { Search, Edit, Trash2, RefreshCw } from 'lucide-react';
import API from '../../api/axios';
import { toast } from 'sonner';

export default function RecordsTable({ form, onEditRecord, headerState }) {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [academicYear, setAcademicYear] = useState(headerState.academic_year || '');
  const [department, setDepartment] = useState(headerState.department || '');

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRecords = useCallback(
    async (pageToFetch = 1) => {
      if (!form) return;
      setLoading(true);
      try {
        const params = {
          page: pageToFetch,
          limit: pagination.limit,
          academic_year: academicYear,
          department,
          search,
        };

        const res = await API.get(`/api/university-data/forms/${form.code}/records`, { params });
        setRecords(res.data?.data || []);
        setPagination(
          res.data?.pagination || { page: pageToFetch, limit: 10, total: 0, pages: 1 }
        );
      } catch (err) {
        console.error('Fetch records error:', err);
        toast.error('Failed to load records for this form.');
      } finally {
        setLoading(false);
      }
    },
    [form, academicYear, department, search, pagination.limit]
  );

  useEffect(() => {
    fetchRecords(1);
  }, [form?.code, academicYear, department, search]);

  const handleDeleteConfirm = async () => {
    if (!recordToDelete || !form) return;
    setDeleting(true);
    try {
      await API.delete(`/api/university-data/forms/${form.code}/records/${recordToDelete._id}`);
      toast.success('Record deleted successfully!');
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      fetchRecords(pagination.page);
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete record.');
    } finally {
      setDeleting(false);
    }
  };

  if (!form) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Select a form to view records.</Typography>
      </Paper>
    );
  }

  // Derive visible columns (first 5-6 non-rows fields)
  const columns = (form.fields || [])
    .filter((f) => f.type !== 'rows')
    .slice(0, 6);

  return (
    <Box>
      {/* Filters Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 2fr auto' },
            gap: 2,
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            label="Academic Year"
            placeholder="e.g. 2025-26"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
          />

          <TextField
            size="small"
            label="Department"
            placeholder="e.g. CSE"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />

          <TextField
            size="small"
            label="Search"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={() => fetchRecords(1)}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Data Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                {columns.map((col) => (
                  <TableCell key={col.key} sx={{ fontWeight: 700 }}>
                    {col.label}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={30} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Loading records...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No records found for this form.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((row, idx) => (
                  <TableRow key={row._id || idx} hover>
                    <TableCell>{(pagination.page - 1) * pagination.limit + idx + 1}</TableCell>
                    {columns.map((col) => {
                      let cellVal = row[col.key];
                      if (col.type === 'date' && cellVal) {
                        cellVal = new Date(cellVal).toLocaleDateString();
                      } else if (Array.isArray(cellVal)) {
                        cellVal = `${cellVal.length} items`;
                      }
                      return (
                        <TableCell key={col.key}>
                          {cellVal !== undefined && cellVal !== null && cellVal !== '' ? (
                            String(cellVal)
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              —
                            </Typography>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onEditRecord(row)}
                        title="Edit Record"
                      >
                        <Edit size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setRecordToDelete(row);
                          setDeleteDialogOpen(true);
                        }}
                        title="Delete Record"
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {records.length} of {pagination.total} records
            </Typography>
            <Pagination
              count={pagination.pages}
              page={pagination.page}
              onChange={(_, page) => fetchRecords(page)}
              color="primary"
              size="small"
            />
          </Box>
        )}
      </Paper>

      {/* Confirm Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete this record? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <Trash2 size={16} />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
