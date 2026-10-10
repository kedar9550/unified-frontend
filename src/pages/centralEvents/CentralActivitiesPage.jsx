import React from 'react';
import { PageHeader } from '../../components/common';
import PageContainer from '../../components/common/design-system/PageContainer';
import FormTypesManagement from '../UniversityData/FormTypesManagement';
import { Assignment as AssignmentIcon } from '@mui/icons-material';

export default function CentralActivitiesPage() {
  return (
    <PageContainer maxWidth="xl" px={3} py={3}>
      <PageHeader
        title="Event Activities & Form Types Management"
        subtitle="Configure activity templates, form fields, schemas, and collections for Departmental & University level events."
        icon={<AssignmentIcon />}
      />

      <FormTypesManagement />
    </PageContainer>
  );
}
