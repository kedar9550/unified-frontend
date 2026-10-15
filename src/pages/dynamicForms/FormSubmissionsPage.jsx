import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  CircularProgress
} from '@mui/material';
import {
  Download,
  Search,
  Eye,
  FileSpreadsheet,
  Calendar,
  ExternalLink,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import API from '../../api/axios';
import PageContainer from '../../components/common/design-system/PageContainer';
import PageHeader from '../../components/common/PageHeader';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function FormSubmissionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Detail Modal
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSubmissions();
    }
  }, [id, page, rowsPerPage]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: search.trim() || undefined
      };
      const res = await API.get(`/api/forms/${id}/submissions`, { params });
      if (res.data?.success) {
        setForm(res.data.form || null);
        setSubmissions(res.data.data || []);
        setTotalCount(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
      toast.error('Failed to load form submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchSubmissions();
  };

  const handleExportCSV = () => {
    const exportUrl = `${BACKEND_URL}/api/forms/${id}/submissions/export`;
    window.open(exportUrl, '_blank');
    toast.success('Downloading CSV export...');
  };

  // Extract input fields (ignoring layout fields) for table columns
  const inputFields = (form?.fields || []).filter(
    (f) => !['heading', 'paragraph', 'divider'].includes(f.type)
  );

  // Show first 4-5 fields as main columns in the table
  const previewColumns = inputFields.slice(0, 4);

  return (
    <PageContainer maxWidth="xl" px={3} py={3}>
      <PageHeader
        title={form ? `Submissions: ${form.title}` : 'Form Submissions'}
        subtitle={`Viewing submitted responses for /forms/${form?.slug || '...'}`}
        icon={<FileSpreadsheet />}
        showBack
        backPath="/central-events/activities/forms"
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<Download size={18} />}
              onClick={handleExportCSV}
              sx={{
                borderRadius: '12px',
                borderColor: '#004e92',
                color: '#004e92',
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5
              }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<Layers size={18} />}
              onClick={() => navigate(`/central-events/activities/generate-form/${id}`)}
              sx={{
                borderRadius: '12px',
                bgcolor: '#004e92',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
                '&:hover': { bgcolor: '#003a6d' }
              }}
            >
              Edit Form Schema
            </Button>
          </Box>
        }
      />

      {/* Filter and Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, maxWidth: 450 }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Search answers in submissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search size={16} color="#94a3b8" style={{ marginRight: 8 }} />
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          <Button
            type="submit"
            variant="contained"
            size="small"
            sx={{ borderRadius: '10px', bgcolor: '#004e92', textTransform: 'none', px: 2.5, fontWeight: 600 }}
          >
            Search
          </Button>
        </Box>

        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
          Total Responses: <strong style={{ color: '#004e92' }}>{totalCount}</strong>
        </Typography>
      </Paper>

      {/* Submissions Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#334155', py: 2 }}>Submitted At</TableCell>
                {previewColumns.map((col) => (
                  <TableCell key={col.id} sx={{ fontWeight: 700, color: '#334155' }}>
                    {col.label}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 700, color: '#334155', textAlign: 'right', pr: 3 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={previewColumns.length + 2} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: '#004e92', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#64748b' }}>Loading submissions...</Typography>
                  </TableCell>
                </TableRow>
              ) : submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={previewColumns.length + 2} align="center" sx={{ py: 6 }}>
                    <FileSpreadsheet size={40} color="#cbd5e1" style={{ marginBottom: 8 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      No Submissions Recorded Yet
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Responses submitted by users via the public URL will appear here.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((sub) => (
                  <TableRow key={sub._id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Calendar size={15} color="#94a3b8" />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                          {new Date(sub.submittedAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </TableCell>

                    {previewColumns.map((col) => {
                      const val = sub.submittedData ? sub.submittedData[col.name] : '';
                      const displayVal = Array.isArray(val)
                        ? val.join(', ')
                        : typeof val === 'object' && val !== null
                          ? JSON.stringify(val)
                          : String(val || '-');

                      return (
                        <TableCell key={col.id}>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 180,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: '#1e293b'
                            }}
                          >
                            {col.type === 'file' && val ? (
                              <a
                                href={`${BACKEND_URL}${val}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#004e92', textDecoration: 'underline' }}
                              >
                                View File
                              </a>
                            ) : (
                              displayVal
                            )}
                          </Typography>
                        </TableCell>
                      );
                    })}

                    <TableCell align="right" sx={{ pr: 3 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Eye size={15} />}
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setDetailModalOpen(true);
                        }}
                        sx={{
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          borderColor: '#cbd5e1',
                          color: '#004e92'
                        }}
                      >
                        View Full Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Paper>

      {/* Submission Detail Modal */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Submission Details
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              ID: {selectedSubmission?._id} • Submitted at {selectedSubmission && new Date(selectedSubmission.submittedAt).toLocaleString()}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedSubmission && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mt: 1 }}>
              {inputFields.map((f) => {
                const val = selectedSubmission.submittedData ? selectedSubmission.submittedData[f.name] : null;
                const isFull = f.colSpan === 2 || ['textarea', 'file'].includes(f.type);

                return (
                  <Box
                    key={f.id}
                    sx={{
                      gridColumn: isFull ? { md: 'span 2' } : 'span 1',
                      p: 2,
                      borderRadius: '12px',
                      bgcolor: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      {f.label} ({f.name})
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {f.type === 'file' && val ? (
                        <Button
                          variant="outlined"
                          size="small"
                          component="a"
                          href={`${BACKEND_URL}${val}`}
                          target="_blank"
                          rel="noreferrer"
                          startIcon={<ExternalLink size={15} />}
                          sx={{ textTransform: 'none', borderRadius: '8px', mt: 0.5 }}
                        >
                          Download / View File
                        </Button>
                      ) : (
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {Array.isArray(val)
                            ? val.join(', ')
                            : val !== undefined && val !== null && String(val).trim() !== ''
                              ? String(val)
                              : '-'}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDetailModalOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
