import React from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Typography,
  Button,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
} from '@mui/material';
import { Plus, Trash2, Calculator } from 'lucide-react';

export default function FieldRenderer({
  field,
  value,
  onChange,
  error,
  formData = {},
}) {
  // Handle sub-table row fields
  if (field.type === 'rows') {
    const rows = Array.isArray(value) ? value : [];

    const handleAddRow = () => {
      const newRow = {};
      (field.fields || []).forEach((f) => {
        newRow[f.key] = '';
      });
      onChange(field.key, [...rows, newRow]);
    };

    const handleRemoveRow = (index) => {
      const updated = rows.filter((_, i) => i !== index);
      onChange(field.key, updated);
    };

    const handleRowCellChange = (index, cellKey, cellVal) => {
      const updated = rows.map((row, i) => {
        if (i === index) {
          return { ...row, [cellKey]: cellVal };
        }
        return row;
      });
      onChange(field.key, updated);
    };

    return (
      <Box sx={{ gridColumn: '1 / -1', my: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Plus size={16} />}
            onClick={handleAddRow}
            sx={{ borderRadius: 2 }}
          >
            Add Row
          </Button>
        </Box>

        <Paper variant="outlined" sx={{ overflowX: 'auto', borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                {(field.fields || []).map((col) => (
                  <TableCell key={col.key} sx={{ fontWeight: 600 }}>
                    {col.label} {col.required && <span style={{ color: 'red' }}>*</span>}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ fontWeight: 600 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={(field.fields?.length || 0) + 2} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No rows added yet. Click "Add Row" to enter items.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, rIdx) => (
                  <TableRow key={rIdx}>
                    <TableCell>{rIdx + 1}</TableCell>
                    {(field.fields || []).map((col) => (
                      <TableCell key={col.key} sx={{ minWidth: 150 }}>
                        <TextField
                          size="small"
                          fullWidth
                          type={col.type === 'number' ? 'number' : 'text'}
                          value={row[col.key] || ''}
                          onChange={(e) => handleRowCellChange(rIdx, col.key, e.target.value)}
                          placeholder={col.placeholder || ''}
                          disabled={col.readOnly || Boolean(col.calc)}
                        />
                      </TableCell>
                    ))}
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => handleRemoveRow(rIdx)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
        {error && (
          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
            {error}
          </Typography>
        )}
      </Box>
    );
  }

  const isReadOnly = field.readOnly || Boolean(field.calc);

  const inputStyle = { borderRadius: '12px' };

  return (
    <Box sx={{ gridColumn: field.fullWidth ? '1 / -1' : 'span 1' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          {field.label} {field.required && <span style={{ color: '#d32f2f' }}>*</span>}
        </Typography>
        {field.calc && (
          <Chip
            icon={<Calculator size={12} />}
            label="Calculated"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ height: 20, fontSize: '0.65rem', borderRadius: '6px' }}
          />
        )}
      </Box>

      {field.type === 'select' ? (
        <TextField
          select
          fullWidth
          size="small"
          value={value ?? ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          error={Boolean(error)}
          helperText={error}
          disabled={isReadOnly}
          InputProps={{ sx: inputStyle }}
        >
          <MenuItem value="">
            <em>-- Select {field.label} --</em>
          </MenuItem>
          {(field.options || []).map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </TextField>
      ) : field.type === 'textarea' ? (
        <TextField
          fullWidth
          multiline
          rows={3}
          size="small"
          value={value ?? ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder || ''}
          error={Boolean(error)}
          helperText={error}
          disabled={isReadOnly}
          InputProps={{ sx: inputStyle }}
        />
      ) : field.type === 'date' ? (
        <TextField
          fullWidth
          size="small"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={value ? (typeof value === 'string' ? value.slice(0, 10) : new Date(value).toISOString().slice(0, 10)) : ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          error={Boolean(error)}
          helperText={error}
          disabled={isReadOnly}
          InputProps={{ sx: inputStyle }}
        />
      ) : field.type === 'month' ? (
        <TextField
          fullWidth
          size="small"
          type="month"
          InputLabelProps={{ shrink: true }}
          value={value ?? ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder || 'YYYY-MM'}
          error={Boolean(error)}
          helperText={error}
          disabled={isReadOnly}
          InputProps={{ sx: inputStyle }}
        />
      ) : (
        <TextField
          fullWidth
          size="small"
          type={field.type === 'number' ? 'number' : 'text'}
          value={value ?? ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder || ''}
          error={Boolean(error)}
          helperText={error}
          disabled={isReadOnly}
          InputProps={{ sx: inputStyle }}
          slotProps={{
            htmlInput: {
              min: field.min,
              max: field.max,
            },
          }}
          sx={{
            ...(isReadOnly && {
              '& .MuiInputBase-input': {
                bgcolor: 'action.hover',
                fontWeight: 600,
                color: 'primary.main',
              },
            }),
          }}
        />
      )}
    </Box>
  );
}
