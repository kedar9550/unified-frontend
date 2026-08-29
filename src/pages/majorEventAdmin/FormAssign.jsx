import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  Button,
  IconButton,
  FormControl,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { PageContainer } from '../../components/common/design-system';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';

const initialFields = [
  { id: 1, name: 'Name', type: 'Text', mappedEvents: { 'Dance': true, 'Singing': true } },
  { id: 2, name: 'Roll no', type: 'Text', mappedEvents: { 'Dance': true, 'Singing': true } },
  { id: 3, name: 'Branch', type: 'Dropdown', mappedEvents: { 'Dance': true, 'Singing': true } },
  { id: 4, name: 'College', type: 'Dropdown', mappedEvents: { 'Dance': true, 'Singing': true } },
  { id: 5, name: 'Email', type: 'Email', mappedEvents: { 'Dance': true, 'Singing': true } },
  { id: 6, name: 'Phone', type: 'Number', mappedEvents: { 'Dance': true, 'Singing': true } },
  { id: 7, name: 'Team', type: 'Text', mappedEvents: { 'Dance': true } },
];

const mockEvents = [
  { name: 'Dance', status: 'Active' },
  { name: 'Singing', status: 'Active' }
];
const fieldTypes = ['Text', 'Dropdown', 'Radio Button', 'Number', 'Email', 'Date', 'File'];

const FormAssign = () => {
  const [fields, setFields] = useState(initialFields);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCulturalEvents = async () => {
      try {
        setLoading(true);
        const groupsRes = await API.get('/api/major-events/groups');
        const event_schools = groupsRes.data?.event_schools || [];
        
        // Find Cultural Fest or default to the first available group
        const targetGroup = groups.find(g => 
          g.groupName.toLowerCase().includes('cultural') || 
          g.assignedFestName.toLowerCase().includes('cultural')
        ) || event_schools[0];

        if (targetGroup) {
          const eventsRes = await API.get(`/api/major-events/groups/${targetGroup._id}/events`);
          let fetchedEvents = eventsRes.data?.events || [];
          
          // Filter to only include Active events
          fetchedEvents = fetchedEvents.filter(e => e.status === 'Active');
          setEvents(fetchedEvents.map(e => ({ name: e.eventName, status: e.status })));
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error("Failed to fetch events dynamically:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCulturalEvents();
  }, []);

  const handleAddRow = () => {
    const newId = fields.length > 0 ? Math.max(...fields.map((f) => f.id)) + 1 : 1;
    setFields([
      ...fields,
      { id: newId, name: '', type: 'Text', mappedEvents: {} },
    ]);
  };

  const handleRemoveRow = (id) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleFieldChange = (id, key, value) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, [key]: value } : field
      )
    );
  };

  const handleMappingChange = (fieldId, eventName, checked) => {
    setFields(
      fields.map((field) => {
        if (field.id === fieldId) {
          return {
            ...field,
            mappedEvents: {
              ...field.mappedEvents,
              [eventName]: checked,
            },
          };
        }
        return field;
      })
    );
  };

  const handleSave = () => {
    // Validate empty field names
    const emptyNames = fields.filter((f) => !f.name.trim());
    if (emptyNames.length > 0) {
      toast.error('Please enter a name for all fields');
      return;
    }

    const payload = {
      events: events.map(e => e.name),
      fields: fields.map((f) => ({
        name: f.name,
        type: f.type,
        assignedEvents: events.map(e => e.name).filter((e) => f.mappedEvents[e]),
      })),
    };

    console.log('Form Assignment Payload:', payload);
    localStorage.setItem('mockFormConfig', JSON.stringify(payload));
    toast.success('Form configuration saved!');
    navigate('/major-event-admin/form-preview');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Form Assign"
        subtitle="Assign form fields to specific events"
        showBack={false}
      />

      <Card sx={{ maxWidth: 1000, mx: 'auto', width: '100%', boxShadow: 'var(--shadow-premium)', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-panel)', overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2.5, sm: 4 }, pt: { xs: 2.5, sm: 4 }, pb: 2, borderBottom: '1px solid var(--border-color)' }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: 'var(--text-primary)' }}>Assign form to Events</Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Define the registration form fields and select which events require them.
          </Typography>
        </Box>
        
        <CardContent sx={{ p: 0 }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader aria-label="form assignment table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: 60, textAlign: 'center', bgcolor: 'var(--bg-paper)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 200, bgcolor: 'var(--bg-paper)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Fieldname</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 150, bgcolor: 'var(--bg-paper)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Field Type</TableCell>
                  {events.map((event, i) => (
                    <TableCell key={event.name || i} sx={{ fontWeight: 700, textAlign: 'center', minWidth: 100, bgcolor: 'var(--bg-paper)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        {event.name}
                        {event.status === 'Active' && (
                          <Chip label="Active" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />
                        )}
                      </Box>
                    </TableCell>
                  ))}
                  <TableCell sx={{ width: 60, bgcolor: 'var(--bg-paper)', borderBottom: '1px solid var(--border-color)' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow key="loading">
                    <TableCell colSpan={3 + Math.max(events.length, 1) + 1} sx={{ textAlign: 'center', py: 4, borderColor: 'var(--border-color)' }}>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>Loading events...</Typography>
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow key="no-events">
                    <TableCell colSpan={4} sx={{ textAlign: 'center', py: 5, borderColor: 'var(--border-color)' }}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'var(--text-primary)' }}>
                        No active events found for Cultural Fest.
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 0.5 }}>
                        Please create or activate an event under Fest Groups -&gt; Cultural Fest Event Management first.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : fields.map((field, index) => (
                  <TableRow key={field.id} hover sx={{ '&:hover': { background: 'var(--bg-panel)' } }}>
                    <TableCell sx={{ textAlign: 'center', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
                      {index + 1}.
                    </TableCell>
                    <TableCell sx={{ borderColor: 'var(--border-color)' }}>
                      <TextField
                        size="small"
                        fullWidth
                        variant="outlined"
                        placeholder="Enter field name"
                        value={field.name}
                        onChange={(e) => handleFieldChange(field.id, 'name', e.target.value)}
                        sx={{ bgcolor: 'var(--bg-paper)', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderColor: 'var(--border-color)' }}>
                      <FormControl fullWidth size="small">
                        <Select
                          value={field.type}
                          onChange={(e) => handleFieldChange(field.id, 'type', e.target.value)}
                          sx={{ bgcolor: 'var(--bg-paper)', borderRadius: '8px' }}
                        >
                          {fieldTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    {events.map((event, i) => (
                      <TableCell key={event.name || i} sx={{ textAlign: 'center', borderColor: 'var(--border-color)' }}>
                        <Checkbox
                          color="primary"
                          checked={!!field.mappedEvents[event.name]}
                          onChange={(e) => handleMappingChange(field.id, event.name, e.target.checked)}
                          sx={{ '&.Mui-checked': { color: 'var(--color-primary)' } }}
                        />
                      </TableCell>
                    ))}
                    <TableCell sx={{ textAlign: 'center', borderColor: 'var(--border-color)' }}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveRow(field.id)}
                        disabled={fields.length === 1}
                        sx={{ bgcolor: 'rgba(220, 38, 38, 0.1)' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', bgcolor: 'var(--bg-paper)' }}>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddRow}
              sx={{ fontWeight: 600, borderRadius: '8px', color: 'var(--color-primary)', bgcolor: 'var(--bg-accent-4)', '&:hover': { bgcolor: 'var(--bg-accent-3)' } }}
            >
              Add row
            </Button>
            
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{ px: 4, fontWeight: 700, borderRadius: '10px', background: 'var(--gradient-primary)' }}
            >
              OK
            </Button>
          </Box>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default FormAssign;
