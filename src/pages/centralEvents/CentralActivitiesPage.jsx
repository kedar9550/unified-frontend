import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Tabs, Tab, Paper, Typography } from '@mui/material';
import { PageHeader } from '../../components/common';
import PageContainer from '../../components/common/design-system/PageContainer';
import FormTypesManagement from '../UniversityData/FormTypesManagement';
import DynamicFormsListPage from '../dynamicForms/DynamicFormsListPage';
import { Assignment as AssignmentIcon, DynamicForm, ListAlt } from '@mui/icons-material';
import { Plus, Layers, FileSpreadsheet } from 'lucide-react';

export default function CentralActivitiesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <PageContainer maxWidth="xl" px={3} py={3}>
      <PageHeader
        title="Event Activities & Form Management"
        subtitle="Create custom drag-and-drop forms, configure activity templates, schemas, and manage participant submissions."
        icon={<AssignmentIcon />}
        actions={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => navigate('/central-events/activities/generate-form')}
              sx={{
                borderRadius: '12px',
                bgcolor: '#004e92',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5,
                py: 1,
                boxShadow: '0 4px 14px rgba(0, 78, 146, 0.25)',
                '&:hover': { bgcolor: '#003a6d' }
              }}
            >
              Generate Form
            </Button>
            <Button
              variant="outlined"
              startIcon={<Layers size={18} />}
              onClick={() => navigate('/central-events/activities/forms')}
              sx={{
                borderRadius: '12px',
                borderColor: '#004e92',
                color: '#004e92',
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5,
                py: 1,
                '&:hover': { bgcolor: '#eff6ff' }
              }}
            >
              Dynamic Forms
            </Button>
          </Box>
        }
      />

      {/* Navigation Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          mb: 3,
          p: 0.5
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{
            minHeight: '48px',
            '& .MuiTab-root': {
              minHeight: '48px',
              fontSize: '0.9rem',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '12px',
              color: '#64748b',
              mx: 0.5
            },
            '& .Mui-selected': {
              color: '#004e92 !important',
              bgcolor: '#eef2ff'
            },
            '& .MuiTabs-indicator': {
              display: 'none'
            }
          }}
        >
          <Tab
            icon={<ListAlt sx={{ fontSize: 18, mr: 1 }} />}
            iconPosition="start"
            label="Activity Templates & Schemas"
          />
          <Tab
            icon={<DynamicForm sx={{ fontSize: 18, mr: 1 }} />}
            iconPosition="start"
            label="Dynamic Drag-and-Drop Forms"
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      {activeTab === 0 ? (
        <FormTypesManagement />
      ) : (
        <DynamicFormsListPage />
      )}
    </PageContainer>
  );
}
