import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
} from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';

const FormPreview = () => {
  const [savedConfig, setSavedConfig] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConfigAndValidate = async () => {
      const data = localStorage.getItem('mockFormConfig');
      if (data) {
        try {
          const parsedConfig = JSON.parse(data);
          
          // Fetch active events from backend to validate the saved config
          const groupsRes = await API.get('/api/major-events/groups');
          const groups = groupsRes.data?.groups || [];
          const targetGroup = groups.find(g => 
            g.groupName.toLowerCase().includes('cultural') || 
            g.assignedFestName.toLowerCase().includes('cultural')
          ) || groups[0];

          if (targetGroup) {
            const eventsRes = await API.get(`/api/major-events/groups/${targetGroup._id}/events`);
            const fetchedEvents = eventsRes.data?.events || [];
            
            // Get names of all currently active events
            const activeEventNames = fetchedEvents
              .filter(e => e.status === 'Active')
              .map(e => e.eventName);
              
            // Filter the parsedConfig events to ensure we only preview active ones
            parsedConfig.events = (parsedConfig.events || []).filter(event => {
              const eventName = typeof event === 'string' ? event : event.name;
              return activeEventNames.includes(eventName);
            });
          }
          
          setSavedConfig(parsedConfig);
        } catch (e) {
          console.error("Failed to parse config or fetch events", e);
        }
      }
    };
    
    fetchConfigAndValidate();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Preview Assigned Forms"
        subtitle="Review how the assigned forms will appear to users"
      />
      
      {!savedConfig || !savedConfig.events || savedConfig.events.length === 0 ? (
        <Box sx={{ mt: 5, textAlign: 'center', p: 4, bgcolor: 'background.paper', borderRadius: '16px', border: '1px dashed', borderColor: 'divider' }}>
          <Typography variant="h6" color="text.secondary" mb={2}>No Active Events to Preview</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            No active events exist in Event Management, or no form configuration has been created yet.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/major-event-admin/form-assign')} sx={{ borderRadius: '10px' }}>
            Go to Configuration
          </Button>
        </Box>
      ) : (
        <Box sx={{ mt: 3, maxWidth: 1200, mx: 'auto' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 3.5 }}>
            {savedConfig.events.map(event => {
              const eventName = typeof event === 'string' ? event : event.name;
              const status = typeof event === 'string' ? 'Active' : event.status;
              const eventFields = savedConfig.fields.filter(f => f.assignedEvents.includes(eventName));
              
              if (eventFields.length === 0) return null;

              return (
                <Card key={eventName} sx={{ borderRadius: '16px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)', overflow: 'hidden', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
                  <Box sx={{ bgcolor: 'rgba(15, 118, 110, 0.06)', px: 3, py: 2, borderBottom: '1px solid rgba(15, 118, 110, 0.12)' }}>
                    <Typography variant="h6" fontWeight={800} color="#0f766e" sx={{ display: 'flex', alignItems: 'center' }}>
                      {eventName} Event Registration
                      {status === 'Active' && (
                        <Chip label="Active" size="small" color="success" sx={{ ml: 1, height: 20, fontSize: '0.65rem', fontWeight: 800 }} />
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Mock preview of the assigned form</Typography>
                  </Box>
                  <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {eventFields.map((field, idx) => (
                       <Box key={idx}>
                         <Typography variant="subtitle2" fontWeight={700} mb={0.75} sx={{ color: '#1e293b' }}>
                           {field.name} <Typography component="span" color="error">*</Typography>
                         </Typography>
                         {field.type === 'Text' && <TextField size="small" fullWidth disabled placeholder={`Enter ${field.name.toLowerCase()}`} sx={{ bgcolor: 'rgba(248, 250, 252, 0.5)' }} />}
                         {field.type === 'Number' && <TextField size="small" fullWidth disabled placeholder={`Enter ${field.name.toLowerCase()} (Numeric)`} type="number" sx={{ bgcolor: 'rgba(248, 250, 252, 0.5)' }} />}
                         {field.type === 'Email' && <TextField size="small" fullWidth disabled placeholder={`Enter your email`} type="email" sx={{ bgcolor: 'rgba(248, 250, 252, 0.5)' }} />}
                         {field.type === 'Dropdown' && (
                           <FormControl fullWidth size="small" disabled>
                             <Select value="" sx={{ bgcolor: 'rgba(248, 250, 252, 0.5)' }}>
                               <MenuItem value="">Select an option...</MenuItem>
                             </Select>
                           </FormControl>
                         )}
                         {field.type === 'Radio Button' && (
                            <RadioGroup row>
                              <FormControlLabel value="1" disabled control={<Radio size="small" />} label="Option 1" />
                              <FormControlLabel value="2" disabled control={<Radio size="small" />} label="Option 2" />
                            </RadioGroup>
                         )}
                         {field.type === 'Date' && <TextField size="small" fullWidth disabled placeholder="YYYY-MM-DD" type="date" sx={{ bgcolor: 'rgba(248, 250, 252, 0.5)' }} InputLabelProps={{ shrink: true }} />}
                         {field.type === 'File' && <TextField size="small" fullWidth disabled type="file" sx={{ bgcolor: 'rgba(248, 250, 252, 0.5)' }} InputLabelProps={{ shrink: true }} />}
                       </Box>
                    ))}
                    <Box sx={{ mt: 1, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Button variant="contained" disabled sx={{ borderRadius: '8px', px: 3, fontWeight: 700 }}>Submit Registration</Button>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FormPreview;
