import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip
} from '@mui/material';
import { FileText, Table as TableIcon, FileSpreadsheet, Settings } from 'lucide-react';
import formRegistry from '../../config/form-registry.json';
import DynamicForm from './DynamicForm';
import RecordsTable from './RecordsTable';
import FormTypesManagement from './FormTypesManagement';
import API from '../../api/axios';
import { PageHeader, CustomTabs } from '../../components/common';
import PageContainer from '../../components/common/design-system/PageContainer';

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

  // Custom Tabs Config
  const moduleTabs = [
    {
      key: 'entry',
      label: editingRecord
        ? `Edit Record (${selectedForm?.code || ''})`
        : `Data Entry Form (${selectedForm?.code || ''})`,
      icon: <FileText size={18} />
    },
    {
      key: 'records',
      label: 'Submitted Records',
      icon: <TableIcon size={18} />
    },
    {
      key: 'management',
      label: 'Form Types Management',
      icon: <Settings size={18} />
    }
  ];

  return (
    <PageContainer maxWidth="xl" px={3} py={3}>
      {/* Standardized Page Header */}
      <PageHeader
        title="University Data Entry Module"
        subtitle="Centralized single-registry data engine for Aditya University regular data collection"
        icon={<FileSpreadsheet size={24} />}
        showBack
        backPath="/central-events"
        actions={
          <Box sx={{ minWidth: 320, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              label={`${activeForms.length} Active Forms`}
              size="small"
              color="primary"
              sx={{ fontWeight: 700, borderRadius: '8px' }}
            />
            <FormControl fullWidth size="small">
              <InputLabel id="active-form-select-label">Select Active Form Type</InputLabel>
              <Select
                labelId="active-form-select-label"
                value={selectedFormCode}
                label="Select Active Form Type"
                onChange={handleFormChange}
                sx={{
                  borderRadius: '12px',
                  background: 'var(--bg-paper)',
                  fontWeight: 600
                }}
              >
                {Object.entries(groups).map(([groupName, formsList]) => [
                  <MenuItem
                    key={groupName}
                    disabled
                    sx={{ fontWeight: 700, opacity: 0.85, color: 'primary.main', bgcolor: 'action.hover' }}
                  >
                    -- {groupName} --
                  </MenuItem>,
                  ...formsList.map((f) => (
                    <MenuItem key={f.code} value={f.code} sx={{ pl: 3 }}>
                      [{f.code}] {f.name}
                    </MenuItem>
                  )),
                ])}
              </Select>
            </FormControl>
          </Box>
        }
      />

      {/* Module Custom Navigation Tabs */}
      <CustomTabs
        tabs={moduleTabs}
        value={currentTab}
        onChange={(_, val) => setCurrentTab(val)}
      />

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
    </PageContainer>
  );
}
