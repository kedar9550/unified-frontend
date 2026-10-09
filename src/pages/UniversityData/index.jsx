import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import { FileText, Table as TableIcon, FileSpreadsheet, Settings } from 'lucide-react';
import formRegistry from '../../config/form-registry.json';
import DynamicForm from './DynamicForm';
import RecordsTable from './RecordsTable';
import FormTypesManagement from './FormTypesManagement';
import API from '../../api/axios';

export default function UniversityDataPage() {
  const [activeForms, setActiveForms] = useState(formRegistry.forms);
  const [selectedFormCode, setSelectedFormCode] = useState('1.1');
  const [currentTab, setCurrentTab] = useState(0); // 0: Entry, 1: Records, 2: Management
  const [editingRecord, setEditingRecord] = useState(null);
  const [headerState, setHeaderState] = useState({ academic_year: '2025-26', department: 'CSE' });

  // Fetch ACTIVE form types dynamically from API
  const fetchActiveForms = useCallback(async () => {
    try {
      const res = await API.get('/api/university-data/form-types', { params: { active_only: true } });
      const fetched = res.data?.data;
      if (Array.isArray(fetched) && fetched.length > 0) {
        setActiveForms(fetched);
        // Ensure selectedFormCode points to a valid active form
        if (!fetched.some((f) => f.code === selectedFormCode)) {
          setSelectedFormCode(fetched[0].code);
        }
      }
    } catch (err) {
      console.error('Fetch active forms error:', err);
      // Fallback to static registry
      setActiveForms(formRegistry.forms.filter((f) => f.is_active !== false));
    }
  }, [selectedFormCode]);

  useEffect(() => {
    fetchActiveForms();
  }, []);

  const selectedForm = activeForms.find((f) => f.code === selectedFormCode) || activeForms[0] || formRegistry.forms[0];

  // Group active forms by category
  const groups = {};
  activeForms.forEach((form) => {
    const grp = form.group || 'Other Forms';
    if (!groups[grp]) groups[grp] = [];
    groups[grp].push(form);
  });

  const handleFormChange = (e) => {
    setSelectedFormCode(e.target.value);
    setEditingRecord(null);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setCurrentTab(0); // Switch to Entry Form tab
  };

  const handleSaveSuccess = (savedRecord, formData) => {
    setEditingRecord(null);
    if (formData.academic_year || formData.department) {
      setHeaderState((prev) => ({
        academic_year: formData.academic_year || prev.academic_year,
        department: formData.department || prev.department,
      }));
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Module Title Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#fff',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <FileSpreadsheet size={28} style={{ color: '#38bdf8' }} />
              <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
                University Data Entry Module
              </Typography>
              <Chip
                label={`${activeForms.length} Active Forms`}
                size="small"
                color="primary"
                sx={{ fontWeight: 600 }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Centralized single-registry data engine for Aditya University regular data collection
            </Typography>
          </Box>

          {/* Active Form Picker Dropdown */}
          <Box sx={{ minWidth: 320 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Select Active Form Type"
              value={selectedFormCode}
              onChange={handleFormChange}
              sx={{
                bgcolor: 'rgba(255,255,255,0.08)',
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                '& .MuiInputBase-input': { color: '#fff', fontWeight: 600 },
                '& .MuiInputLabel-root': { color: '#94a3b8' },
              }}
            >
              {Object.entries(groups).map(([groupName, formsList]) => [
                <MenuItem
                  key={groupName}
                  disabled
                  sx={{ fontWeight: 700, opacity: 0.8, color: 'primary.main', bgcolor: 'action.hover' }}
                >
                  -- {groupName} --
                </MenuItem>,
                ...formsList.map((f) => (
                  <MenuItem key={f.code} value={f.code} sx={{ pl: 3 }}>
                    [{f.code}] {f.name}
                  </MenuItem>
                )),
              ])}
            </TextField>
          </Box>
        </Box>
      </Paper>

      {/* Tabs Bar */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={currentTab}
          onChange={(_, val) => setCurrentTab(val)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<FileText size={18} />}
            iconPosition="start"
            label={
              editingRecord
                ? `Edit Record (${selectedForm?.code || ''})`
                : `Data Entry Form (${selectedForm?.code || ''})`
            }
            sx={{ fontWeight: 600 }}
          />
          <Tab
            icon={<TableIcon size={18} />}
            iconPosition="start"
            label="Submitted Records"
            sx={{ fontWeight: 600 }}
          />
          <Tab
            icon={<Settings size={18} />}
            iconPosition="start"
            label="Form Types Management"
            sx={{ fontWeight: 600, ml: 'auto' }}
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      {currentTab === 0 ? (
        <DynamicForm
          form={selectedForm}
          initialData={editingRecord}
          onSaveSuccess={handleSaveSuccess}
          persistentHeader={headerState}
        />
      ) : currentTab === 1 ? (
        <RecordsTable
          form={selectedForm}
          onEditRecord={handleEditRecord}
          headerState={headerState}
        />
      ) : (
        <FormTypesManagement onFormTypesUpdated={fetchActiveForms} />
      )}
    </Container>
  );
}
