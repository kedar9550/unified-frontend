import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Paper,
  Alert,
  IconButton,
  Chip
} from '@mui/material';
import {
  CheckCircle2,
  AlertCircle,
  Upload,
  FileText,
  Clock,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Send
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function PublicFormPage() {
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null); // 'not_found' | 'unpublished' | 'expired' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // Form values state: key -> value
  const [values, setValues] = useState({});
  // Form errors state: key -> error message string
  const [errors, setErrors] = useState({});

  // File upload state: fieldName -> { file: File, uploading: boolean, url: string, name: string }
  const [fileStates, setFileStates] = useState({});

  // Submission success state
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState(null);

  useEffect(() => {
    if (slug) {
      loadPublicForm(slug);
    }
  }, [slug]);

  const loadPublicForm = async (formSlug) => {
    try {
      setLoading(true);
      setErrorStatus(null);
      const res = await axios.get(`${BACKEND_URL}/api/public/forms/${formSlug}`);
      if (res.data?.success && res.data.data) {
        const formData = res.data.data;
        setForm(formData);

        // Initialize default values for fields
        const initialValues = {};
        (formData.fields || []).forEach((f) => {
          if (!['heading', 'paragraph', 'divider'].includes(f.type)) {
            if (f.type === 'checkbox') {
              initialValues[f.name] = Array.isArray(f.defaultValue) ? f.defaultValue : [];
            } else if (f.type === 'yes_no') {
              initialValues[f.name] = f.defaultValue || 'no';
            } else {
              initialValues[f.name] = f.defaultValue || '';
            }
          }
        });
        setValues(initialValues);
      } else {
        setErrorStatus('not_found');
        setErrorMessage(res.data?.message || 'Form not found.');
      }
    } catch (err) {
      console.error('Failed to load public form:', err);
      const msg = err.response?.data?.message || 'This form is currently unavailable.';
      if (err.response?.status === 404) {
        setErrorStatus('not_found');
      } else if (err.response?.status === 403) {
        setErrorStatus('unpublished');
      } else if (err.response?.status === 410) {
        setErrorStatus('expired');
      } else {
        setErrorStatus('error');
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldName, value) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
    // Clear validation error on change
    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const handleCheckboxChange = (fieldName, optionValue, isChecked) => {
    setValues((prev) => {
      const current = Array.isArray(prev[fieldName]) ? prev[fieldName] : [];
      let updated;
      if (isChecked) {
        updated = [...current, optionValue];
      } else {
        updated = current.filter((v) => v !== optionValue);
      }
      return { ...prev, [fieldName]: updated };
    });

    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const handleFileUpload = async (fieldName, file, fieldDef) => {
    if (!file) return;

    // Validate size
    const maxMB = fieldDef.validation?.maxFileSizeMB || 10;
    if (file.size > maxMB * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: `File size exceeds the maximum limit of ${maxMB} MB.`
      }));
      return;
    }

    // Validate extension
    const allowed = fieldDef.validation?.allowedFileTypes;
    if (allowed) {
      const exts = allowed.split(',').map((e) => e.trim().toLowerCase());
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      if (!exts.includes(fileExt)) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: `Invalid file type. Allowed formats: ${allowed}`
        }));
        return;
      }
    }

    setFileStates((prev) => ({
      ...prev,
      [fieldName]: { file, uploading: true, url: '', name: file.name }
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post(`${BACKEND_URL}/api/public/forms/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success && res.data.url) {
        setFileStates((prev) => ({
          ...prev,
          [fieldName]: { file, uploading: false, url: res.data.url, name: file.name }
        }));
        setValues((prev) => ({ ...prev, [fieldName]: res.data.url }));
        setErrors((prev) => {
          const next = { ...prev };
          delete next[fieldName];
          return next;
        });
      }
    } catch (err) {
      console.error('File upload failed:', err);
      setFileStates((prev) => ({
        ...prev,
        [fieldName]: { file: null, uploading: false, url: '', name: '' }
      }));
      setErrors((prev) => ({
        ...prev,
        [fieldName]: 'Failed to upload file. Please try again.'
      }));
    }
  };

  // Validate form before submission
  const validate = () => {
    const newErrors = {};
    if (!form || !Array.isArray(form.fields)) return false;

    for (const f of form.fields) {
      if (['heading', 'paragraph', 'divider'].includes(f.type)) continue;

      const val = values[f.name];

      // Required check
      if (f.required) {
        if (f.type === 'checkbox') {
          if (!Array.isArray(val) || val.length === 0) {
            newErrors[f.name] = `${f.label} is required. Please select at least one option.`;
          }
        } else if (f.type === 'file') {
          if (!val) {
            newErrors[f.name] = `${f.label} is required. Please upload a file.`;
          }
        } else if (val === undefined || val === null || String(val).trim() === '') {
          newErrors[f.name] = `${f.label} is required.`;
        }
      }

      // If value is provided, validate specific constraints
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        // Email
        if (f.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(val).trim())) {
            newErrors[f.name] = 'Please enter a valid email address.';
          }
        }

        // Phone
        if (f.type === 'phone') {
          const cleanPhone = String(val).replace(/[\s\-\(\)\+]/g, '');
          if (cleanPhone.length < 7 || cleanPhone.length > 15 || !/^\d+$/.test(cleanPhone)) {
            newErrors[f.name] = 'Please enter a valid phone number (minimum 7 digits).';
          }
        }

        // Number min/max
        if (f.type === 'number') {
          const numVal = Number(val);
          if (isNaN(numVal)) {
            newErrors[f.name] = 'Please enter a valid numeric value.';
          } else {
            if (f.validation?.minNumber !== undefined && f.validation?.minNumber !== '' && numVal < Number(f.validation.minNumber)) {
              newErrors[f.name] = `Value must be at least ${f.validation.minNumber}.`;
            }
            if (f.validation?.maxNumber !== undefined && f.validation?.maxNumber !== '' && numVal > Number(f.validation.maxNumber)) {
              newErrors[f.name] = `Value cannot exceed ${f.validation.maxNumber}.`;
            }
          }
        }

        // Text min/max length
        if (['text', 'textarea', 'password'].includes(f.type)) {
          const str = String(val);
          if (f.validation?.minLength && str.length < Number(f.validation.minLength)) {
            newErrors[f.name] = `Must be at least ${f.validation.minLength} characters.`;
          }
          if (f.validation?.maxLength && str.length > Number(f.validation.maxLength)) {
            newErrors[f.name] = `Cannot exceed ${f.validation.maxLength} characters.`;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`${BACKEND_URL}/api/public/forms/${slug}/submissions`, {
        submittedData: values
      });

      if (res.data?.success) {
        setSubmissionReceipt({
          id: res.data.submissionId,
          submittedAt: new Date().toLocaleString()
        });
        setSubmissionSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Submission failed:', err);
      const msg = err.response?.data?.message || 'Submission failed. Please check the inputs and try again.';
      setErrorMessage(msg);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForAnotherSubmission = () => {
    setSubmissionSuccess(false);
    setSubmissionReceipt(null);
    setErrors({});
    // Reset values to defaults
    if (form) {
      const reset = {};
      (form.fields || []).forEach((f) => {
        if (!['heading', 'paragraph', 'divider'].includes(f.type)) {
          if (f.type === 'checkbox') reset[f.name] = [];
          else if (f.type === 'yes_no') reset[f.name] = 'no';
          else reset[f.name] = '';
        }
      });
      setValues(reset);
    }
  };

  // =========================================================================
  // LOADING STATE
  // =========================================================================
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={48} sx={{ color: '#004e92', mb: 2 }} />
        <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 600 }}>
          Loading form details...
        </Typography>
      </Box>
    );
  }

  // =========================================================================
  // ERROR / UNAVAILABLE STATE
  // =========================================================================
  if (errorStatus || !form) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        {/* Navy Header */}
        <PublicHeader />

        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
          <Paper
            elevation={0}
            sx={{
              maxWidth: '520px',
              width: '100%',
              p: 5,
              textAlign: 'center',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '0 8px 30px rgba(0,0,0,0.05)'
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2,
                borderRadius: '50%',
                bgcolor: '#fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertCircle size={32} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
              {errorStatus === 'not_found'
                ? 'Form Not Found'
                : errorStatus === 'expired'
                  ? 'Submissions Closed'
                  : errorStatus === 'unpublished'
                    ? 'Form Unpublished'
                    : 'Form Unavailable'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
              {errorMessage || 'This form is currently not accepting submissions or may have been removed by the administrator.'}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
              startIcon={<RotateCcw size={16} />}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: '#004e92', color: '#004e92' }}
            >
              Try Again
            </Button>
          </Paper>
        </Box>
      </Box>
    );
  }

  // =========================================================================
  // SUCCESS SCREEN
  // =========================================================================
  if (submissionSuccess) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f9', display: 'flex', flexDirection: 'column' }}>
        <PublicHeader />

        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
          <Paper
            elevation={0}
            sx={{
              maxWidth: '580px',
              width: '100%',
              p: { xs: 4, md: 6 },
              textAlign: 'center',
              borderRadius: '24px',
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.06)'
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                mx: 'auto',
                mb: 2.5,
                borderRadius: '50%',
                bgcolor: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircle2 size={40} />
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
              Submission Recorded!
            </Typography>

            <Typography variant="body1" sx={{ color: '#475569', mb: 3, lineHeight: 1.6 }}>
              {form.settings?.successMessage || 'Thank you! Your response has been submitted successfully.'}
            </Typography>

            {submissionReceipt && (
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', mb: 3.5, textAlign: 'left' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Reference ID:
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#004e92' }}>
                    {submissionReceipt.id}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Submitted At:
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600 }}>
                    {submissionReceipt.submittedAt}
                  </Typography>
                </Box>
              </Box>
            )}

            {form.settings?.allowMultipleSubmissions !== false && (
              <Button
                variant="outlined"
                onClick={handleResetForAnotherSubmission}
                startIcon={<RotateCcw size={16} />}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#004e92',
                  color: '#004e92',
                  px: 3,
                  py: 1,
                  '&:hover': { bgcolor: '#eef2ff' }
                }}
              >
                Submit Another Response
              </Button>
            )}
          </Paper>
        </Box>
      </Box>
    );
  }

  // =========================================================================
  // ACTIVE FORM RENDERER
  // =========================================================================
  const isTwoCol = form.settings?.layout === 'two-column';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f9', display: 'flex', flexDirection: 'column' }}>
      {/* University Branding Navy Header */}
      <PublicHeader />

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, py: { xs: 3, md: 5 }, px: 2 }}>
        <Paper
          elevation={0}
          component="form"
          onSubmit={handleSubmit}
          sx={{
            maxWidth: '860px',
            width: '100%',
            mx: 'auto',
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
          }}
        >
          {/* Header Banner inside Card */}
          <Box
            sx={{
              p: { xs: 3, md: 4 },
              borderBottom: '1px solid #f1f5f9',
              background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#004e92', mb: 1, fontSize: { xs: '1.6rem', md: '2rem' } }}>
              {form.title}
            </Typography>
            {form.description && (
              <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {form.description}
              </Typography>
            )}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShieldCheck size={16} color="#16a34a" />
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Official Aditya University form • Responses are recorded securely
              </Typography>
            </Box>
          </Box>

          {/* Form Fields Body */}
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                {errorMessage}
              </Alert>
            )}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: isTwoCol ? { xs: '1fr', md: '1fr 1fr' } : '1fr',
                gap: 3
              }}
            >
              {(form.fields || []).map((field) => {
                const isFull = field.colSpan === 2 || ['textarea', 'file', 'heading', 'paragraph', 'divider', 'checkbox', 'radio'].includes(field.type);
                const hasError = !!errors[field.name];

                return (
                  <Box
                    key={field.id}
                    sx={{
                      gridColumn: isFull && isTwoCol ? 'span 2' : 'span 1'
                    }}
                  >
                    <RenderFormField
                      field={field}
                      value={values[field.name]}
                      onChange={(val) => handleInputChange(field.name, val)}
                      onCheckboxChange={(optVal, checked) => handleCheckboxChange(field.name, optVal, checked)}
                      onFileUpload={(file) => handleFileUpload(field.name, file, field)}
                      fileState={fileStates[field.name]}
                      hasError={hasError}
                      errorMessage={errors[field.name]}
                    />
                  </Box>
                );
              })}
            </Box>

            {/* Submit Action */}
            <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Send size={18} />}
                sx={{
                  borderRadius: '12px',
                  bgcolor: '#004e92',
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  px: 4,
                  py: 1.25,
                  boxShadow: '0 4px 16px rgba(0, 78, 146, 0.25)',
                  '&:hover': { bgcolor: '#003a6d' }
                }}
              >
                {submitting ? 'Submitting...' : form.settings?.submitButtonText || 'Submit Response'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 3, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
        Aditya University Form Engine © {new Date().getFullYear()} • Powered by Unified Central Forms
      </Box>
    </Box>
  );
}

// =========================================================================
// PUBLIC NAVBAR WITH ADITYA UNIVERSITY BRANDING
// =========================================================================
function PublicHeader() {
  return (
    <Box
      sx={{
        width: '100%',
        py: 2,
        px: { xs: 2.5, md: 4 },
        background: 'linear-gradient(140deg, #000428 0%, #013c6e 50%, #000428 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Aditya University Sun Emblem */}
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            border: '2px solid rgba(255, 215, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.08)',
            boxShadow: '0 0 16px rgba(255, 215, 0, 0.3)'
          }}
        >
          <Typography sx={{ fontSize: '1.4rem' }}>☀️</Typography>
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              letterSpacing: '1px',
              lineHeight: 1.1,
              color: '#ffffff',
              fontSize: { xs: '1.1rem', md: '1.25rem' }
            }}
          >
            ADITYA UNIVERSITY
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '0.5px' }}>
            Central Events & Digital Services Portal
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// =========================================================================
// RENDER DYNAMIC FIELD IN PUBLIC FORM
// =========================================================================
function RenderFormField({
  field,
  value,
  onChange,
  onCheckboxChange,
  onFileUpload,
  fileState,
  hasError,
  errorMessage
}) {
  const { type, label, placeholder, helpText, required, options } = field;

  // Layout presentation elements
  if (type === 'heading') {
    return (
      <Box sx={{ pt: 2, pb: 0.5, borderBottom: '2px solid #eef2ff' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#004e92' }}>
          {label}
        </Typography>
        {helpText && (
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            {helpText}
          </Typography>
        )}
      </Box>
    );
  }

  if (type === 'paragraph') {
    return (
      <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
        {label && (
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 0.5 }}>
            {label}
          </Typography>
        )}
        <Typography variant="body2" sx={{ color: '#475569', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
          {field.content || ''}
        </Typography>
      </Box>
    );
  }

  if (type === 'divider') {
    return <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />;
  }

  // Input Fields
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.75 }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </Typography>

      {/* Field switch */}
      {type === 'textarea' ? (
        <TextField
          multiline
          rows={field.validation?.rows || 4}
          fullWidth
          size="small"
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          error={hasError}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
        />
      ) : type === 'dropdown' ? (
        <FormControl size="small" fullWidth error={hasError}>
          <Select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            displayEmpty
            sx={{ borderRadius: '12px' }}
          >
            <MenuItem value="" disabled>
              <em>{placeholder || '-- Select an option --'}</em>
            </MenuItem>
            {(options || []).map((opt, i) => (
              <MenuItem key={i} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : type === 'radio' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 0.5 }}>
          {(options || []).map((opt, i) => (
            <label
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.9rem',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <input
                type="radio"
                name={field.name}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                style={{ width: 16, height: 16, accentColor: '#004e92' }}
              />
              {opt.label}
            </label>
          ))}
        </Box>
      ) : type === 'checkbox' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 0.5 }}>
          {(options || []).map((opt, i) => {
            const isChecked = Array.isArray(value) && value.includes(opt.value);
            return (
              <label
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '0.9rem',
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={isChecked}
                  onChange={(e) => onCheckboxChange(opt.value, e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#004e92' }}
                />
                {opt.label}
              </label>
            );
          })}
        </Box>
      ) : type === 'yes_no' ? (
        <Box sx={{ display: 'flex', gap: 4, p: 0.5 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name={`yn_${field.name}`}
              value="yes"
              checked={value === 'yes'}
              onChange={() => onChange('yes')}
              style={{ width: 16, height: 16, accentColor: '#004e92' }}
            />
            Yes
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name={`yn_${field.name}`}
              value="no"
              checked={value === 'no'}
              onChange={() => onChange('no')}
              style={{ width: 16, height: 16, accentColor: '#004e92' }}
            />
            No
          </label>
        </Box>
      ) : type === 'file' ? (
        <Box
          sx={{
            p: 2.5,
            border: hasError ? '2px dashed #ef4444' : '2px dashed #cbd5e1',
            borderRadius: '14px',
            bgcolor: '#f8fafc',
            textAlign: 'center'
          }}
        >
          <input
            type="file"
            id={`file_${field.name}`}
            style={{ display: 'none' }}
            accept={field.validation?.allowedFileTypes}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onFileUpload(e.target.files[0]);
              }
            }}
          />
          <label htmlFor={`file_${field.name}`} style={{ cursor: 'pointer' }}>
            <Upload size={24} color="#004e92" style={{ marginBottom: 6 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#004e92' }}>
              {fileState?.uploading
                ? 'Uploading file...'
                : fileState?.name
                  ? `Uploaded: ${fileState.name}`
                  : 'Click to select file'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
              Allowed formats: {field.validation?.allowedFileTypes || '.pdf,.jpg,.png'} (Max{' '}
              {field.validation?.maxFileSizeMB || 10} MB)
            </Typography>
          </label>
        </Box>
      ) : (
        <TextField
          type={type === 'number' ? 'number' : type === 'date' ? 'date' : type === 'password' ? 'password' : 'text'}
          fullWidth
          size="small"
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          error={hasError}
          InputLabelProps={type === 'date' ? { shrink: true } : undefined}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
        />
      )}

      {/* Error or Help Text */}
      {hasError ? (
        <Typography variant="caption" sx={{ color: '#ef4444', display: 'block', mt: 0.5, fontWeight: 500 }}>
          {errorMessage}
        </Typography>
      ) : helpText ? (
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
          {helpText}
        </Typography>
      ) : null}
    </Box>
  );
}
