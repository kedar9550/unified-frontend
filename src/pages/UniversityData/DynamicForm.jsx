import React, { useState, useEffect } from 'react';
import { Box, Button, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import { Save, RefreshCw } from 'lucide-react';
import FieldRenderer from './FieldRenderer';
import { computeFormCalculations } from '../../utils/calcEngine';
import API from '../../api/axios';
import { toast } from 'sonner';

/**
 * Evaluates showIf condition string in frontend
 */
function evaluateShowIf(showIf, doc) {
  if (!showIf || typeof showIf !== 'string') return true;
  try {
    const eqIdx = showIf.indexOf('===');
    if (eqIdx !== -1) {
      const leftKey = showIf.slice(0, eqIdx).trim();
      const rightVal = showIf.slice(eqIdx + 3).trim().replace(/^['"]|['"]$/g, '');
      return String(doc[leftKey] || '') === rightVal;
    }
    const neqIdx = showIf.indexOf('!==');
    if (neqIdx !== -1) {
      const leftKey = showIf.slice(0, neqIdx).trim();
      const rightVal = showIf.slice(neqIdx + 3).trim().replace(/^['"]|['"]$/g, '');
      return String(doc[leftKey] || '') !== rightVal;
    }
  } catch (err) {
    console.error('Error evaluating showIf:', err);
  }
  return true;
}

export default function DynamicForm({
  form,
  initialData = null,
  onSaveSuccess,
  persistentHeader = { academic_year: '', department: '' },
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Initialize form data
  useEffect(() => {
    if (form) {
      const defaultData = {};
      (form.fields || []).forEach((f) => {
        if (f.type === 'rows') {
          defaultData[f.key] = [];
        } else {
          defaultData[f.key] = '';
        }
      });

      // Merge persistent header (Academic Year & Department)
      if (persistentHeader.academic_year && defaultData.hasOwnProperty('academic_year')) {
        defaultData.academic_year = persistentHeader.academic_year;
      }
      if (persistentHeader.department && defaultData.hasOwnProperty('department')) {
        defaultData.department = persistentHeader.department;
      }

      // Merge initialData if editing
      if (initialData) {
        Object.assign(defaultData, initialData);
      }

      const computed = computeFormCalculations(form.fields, defaultData);
      setFormData(computed);
      setErrors({});
      setApiError(null);
    }
  }, [form, initialData, persistentHeader.academic_year, persistentHeader.department]);

  const handleFieldChange = (key, val) => {
    const nextData = { ...formData, [key]: val };
    const recomputed = computeFormCalculations(form?.fields || [], nextData);

    setFormData(recomputed);

    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    (form?.fields || []).forEach((field) => {
      const isVisible = evaluateShowIf(field.showIf, formData);
      if (!isVisible) return;

      const val = formData[field.key];
      if (field.required && (val === undefined || val === null || val === '')) {
        newErrors[field.key] = `${field.label || field.key} is required`;
      } else if (field.type === 'number' && val !== '' && val !== null && val !== undefined) {
        const num = Number(val);
        if (isNaN(num)) {
          newErrors[field.key] = 'Must be a valid number';
        } else {
          if (field.min !== undefined && num < field.min) {
            newErrors[field.key] = `Min value is ${field.min}`;
          }
          if (field.max !== undefined && num > field.max) {
            newErrors[field.key] = `Max value is ${field.max}`;
          }
        }
      }
    });

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        newErrors.end_date = 'End date cannot be earlier than start date';
      }
    }

    if (formData.academic_year && !/^\d{4}-\d{2}$/.test(String(formData.academic_year))) {
      newErrors.academic_year = 'Academic year format must be YYYY-YY (e.g. 2025-26)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting.');
      return;
    }

    setLoading(true);

    try {
      let res;
      if (initialData && initialData._id) {
        res = await API.put(`/api/university-data/forms/${form.code}/records/${initialData._id}`, formData);
        toast.success(`Record updated successfully!`);
      } else {
        res = await API.post(`/api/university-data/forms/${form.code}/records`, formData);
        toast.success(`Record created successfully!`);
      }

      if (onSaveSuccess) {
        onSaveSuccess(res.data?.data, formData);
      }

      // Reset form but retain Academic Year & Department
      if (!initialData) {
        const resetData = {};
        (form.fields || []).forEach((f) => {
          resetData[f.key] = f.type === 'rows' ? [] : '';
        });
        resetData.academic_year = formData.academic_year || '';
        resetData.department = formData.department || '';

        setFormData(computeFormCalculations(form.fields, resetData));
      }
    } catch (err) {
      console.error('Submit error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save record';
      setApiError(msg);

      if (err.response?.data?.errors) {
        const serverErrors = {};
        err.response.data.errors.forEach((e) => {
          serverErrors[e.field] = e.message;
        });
        setErrors(serverErrors);
      }

      if (err.response?.status === 409) {
        toast.error(`Duplicate Entry: ${msg}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!form) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Select a form to begin entering data.</Typography>
      </Paper>
    );
  }

  const visibleFields = (form.fields || []).filter((f) => evaluateShowIf(f.showIf, formData));

  return (
    <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
      <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
          [{form.code}] {form.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {form.group} • Collection: {form.collection}
        </Typography>
      </Box>

      {apiError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {apiError}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2.5,
          rowGap: 3,
        }}
      >
        {visibleFields.map((field) => (
          <FieldRenderer
            key={field.key}
            field={field}
            value={formData[field.key]}
            onChange={handleFieldChange}
            error={errors[field.key]}
            formData={formData}
          />
        ))}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<RefreshCw size={18} />}
          onClick={() => {
            const resetData = {};
            (form.fields || []).forEach((f) => {
              resetData[f.key] = f.type === 'rows' ? [] : '';
            });
            resetData.academic_year = formData.academic_year || '';
            resetData.department = formData.department || '';
            setFormData(computeFormCalculations(form.fields, resetData));
            setErrors({});
            setApiError(null);
          }}
          disabled={loading}
        >
          Reset Form
        </Button>

        <Button
          type="submit"
          variant="contained"
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
          disabled={loading}
          sx={{ px: 4, borderRadius: 2 }}
        >
          {initialData ? 'Update Record' : 'Save Record'}
        </Button>
      </Box>
    </Paper>
  );
}
