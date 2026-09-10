import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Divider,
  MenuItem,
  IconButton
} from '@mui/material';
import { Search as SearchIcon, ArrowBack as ArrowBackIcon, PersonAdd as PersonAddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/common/design-system';
import PageHeader from '../../components/common/PageHeader';
import API from '../../api/axios';
import { toast } from 'sonner';

const AddTeamMember = () => {
  const navigate = useNavigate();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [teamFound, setTeamFound] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);

  // Flow state
  const [step, setStep] = useState(1); // 1 = Search, 2 = Configure/Add
  const [availableSlots, setAvailableSlots] = useState(0);
  const [numMembersToAdd, setNumMembersToAdd] = useState(1);
  
  // Form state
  const [forms, setForms] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rollLookupLoading, setRollLookupLoading] = useState({});
  const [fetchedRolls, setFetchedRolls] = useState({});

  const handleLookupRoll = async (index, roll) => {
    const cleanRoll = roll?.trim().toUpperCase();
    if (!cleanRoll || cleanRoll.length < 5) return;
    if (fetchedRolls[index] === cleanRoll) return;

    setRollLookupLoading(prev => ({ ...prev, [index]: true }));
    try {
      const res = await API.get(`/api/razorpay/registrations/branch/${cleanRoll}`);
      const data = res.data;
      
      const student = Array.isArray(data) && data.length > 0 ? data[0] : null;

      if (student && student.rollno) {
        const studentName = student.studentname || student.NAME || '';
        const branch = student.branch || student.BRANCH || '';
        const year = student.current_year || student.YEAR || '';
        const mobile = student.mobilenumber || student.STUDENTMOBILE || '';
        const email = student.emailid || student.STUDENTEMAIL || '';
        const gender = student.gender || student.GENDER || '';

        setForms(prev => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            name: studentName || updated[index].name,
            branch: branch || updated[index].branch,
            department: branch || updated[index].department,
            year: year ? `${year} Year` : updated[index].year,
            mobile: mobile || updated[index].mobile,
            email: email || updated[index].email,
            gender: gender ? (gender.toUpperCase().startsWith('F') ? 'FEMALE' : 'MALE') : updated[index].gender,
            college: 'Aditya University'
          };
          return updated;
        });

        setFetchedRolls(prev => ({ ...prev, [index]: cleanRoll }));
      }
    } catch (err) {
      console.warn('Roll lookup error:', err);
    } finally {
      setRollLookupLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const processTeamSelection = async (matchedPayment) => {
    setTeamFound(matchedPayment);

    // Fetch event details to get maxTeamSize
    if (matchedPayment.eventId) {
      try {
        const eventRes = await API.get(`/api/events/${matchedPayment.eventId}`);
        const ev = eventRes.data.event || eventRes.data;
        if (ev) {
          setEventDetails(ev);
          const maxAllowed = (ev.maxTeamSize || 1) + (ev.extraTeamSize || 0);
          const currentMembers = matchedPayment.participants ? matchedPayment.participants.length : 0;
          const slots = Math.max(0, maxAllowed - currentMembers);
          setAvailableSlots(slots);
          
          if (slots > 0) {
            setNumMembersToAdd(1);
            setForms([createEmptyForm()]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch event details', err);
        toast.error('Could not verify team size limit for this event.');
      }
    }
    
    setStep(2);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a Team ID or Roll Number');
      return;
    }

    setIsSearching(true);
    setTeamFound(null);
    setEventDetails(null);
    setStep(1);

    try {
      // First try searching by Team ID
      let res = await API.get('/api/razorpay/registrations', {
        params: { paymentStatus: 'PAID', teamId: searchQuery }
      });
      
      let payments = res.data?.payments || [];
      
      // If no results, try searching by Roll Number
      if (payments.length === 0) {
        res = await API.get('/api/razorpay/registrations', {
          params: { paymentStatus: 'PAID', roll: searchQuery }
        });
        payments = res.data?.payments || [];
      }
      
      let matchedPayment = null;
      if (payments.length > 0) {
        matchedPayment = payments.find(p => p.teamId?.toLowerCase() === searchQuery.toLowerCase()) || payments[0];
      }

      if (!matchedPayment) {
        toast.error('No paid team found with that ID or Roll Number.');
        setIsSearching(false);
        return;
      }

      await processTeamSelection(matchedPayment);
    } catch (err) {
      console.error('Search failed', err);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const createEmptyForm = () => ({
    name: '', roll: '', email: '', mobile: '', gender: 'MALE', 
    college: 'Aditya University', branch: '', year: '', department: ''
  });

  const handleNumMembersChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setNumMembersToAdd(val);
    
    setForms(prev => {
      const newForms = [...prev];
      if (val > prev.length) {
        for (let i = prev.length; i < val; i++) {
          newForms.push(createEmptyForm());
        }
      } else if (val < prev.length) {
        newForms.splice(val);
      }
      return newForms;
    });
  };

  const updateForm = (index, field, value) => {
    setForms(prev => {
      const newForms = [...prev];
      newForms[index] = { ...newForms[index], [field]: value };
      return newForms;
    });
  };

  const handleSubmit = async () => {
    // Validate forms
    for (let i = 0; i < forms.length; i++) {
      const f = forms[i];
      if (!f.name || !f.roll || !f.email) {
        toast.error(`Member ${i + 1} is missing Name, Roll Number, or Email.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const updatedParticipants = [
        ...(teamFound.participants || []),
        ...forms.map(f => ({
          ...f,
          mobile: String(f.mobile),
          accommodation: 'No',
        }))
      ];

      const res = await API.put(`/api/razorpay/registrations/${teamFound._id}/participants`, {
        participants: updatedParticipants,
        eventName: teamFound.eventName,
        category: teamFound.category,
      });

      if (res.data.ok) {
        toast.success(`Successfully added ${forms.length} member(s) to team ${teamFound.teamId}!`);
        navigate('/Eventveda/registrations');
      }
    } catch (err) {
      console.error('Failed to add members:', err);
      toast.error(err.response?.data?.error || 'Failed to add members');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Add Team Member"
        subtitle="Search for an existing registered team and append new members"
        showBack={true}
        backPath="/Eventveda/registrations"
        breadcrumbs={[
          { label: 'Dashboard', path: '/' },
          { label: 'Student Event Admin', path: '/dashboard' },
          { label: 'Registrations', path: '/Eventveda/registrations' },
          { label: 'Add Member' },
        ]}
      />

      {step === 1 && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: '16px', border: '1px solid var(--border-color)' }} elevation={0}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={9}>
              <TextField
                fullWidth
                label="Search by Team ID or Roll Number"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSearch}
                disabled={isSearching}
                sx={{ height: 56, borderRadius: '8px' }}
              >
                {isSearching ? <CircularProgress size={24} color="inherit" /> : 'Search Team'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {step === 2 && teamFound && (
        <Paper sx={{ p: 3, borderRadius: '16px', border: '1px solid var(--border-color)' }} elevation={0}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Team Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Team ID</Typography>
                <Typography variant="body1" fontWeight={600}>{teamFound.teamId || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Event Name</Typography>
                <Typography variant="body1" fontWeight={600}>{teamFound.eventName || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Current Size</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {teamFound.participants?.length || 0}
                  {eventDetails && ` / ${(eventDetails.maxTeamSize || 1) + (eventDetails.extraTeamSize || 0)}`}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {availableSlots <= 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'error.main', color: 'error.contrastText', borderRadius: '12px', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>Team is Full</Typography>
              <Typography variant="body1">This team has reached its maximum allowed size for this event.</Typography>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight={700}>
                  Add New Members
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" fontWeight={600}>Slots Available: {availableSlots}</Typography>
                  <TextField
                    select
                    size="small"
                    label="Count"
                    value={numMembersToAdd}
                    onChange={handleNumMembersChange}
                    sx={{ minWidth: 100 }}
                  >
                    {Array.from({ length: availableSlots }, (_, i) => i + 1).map(num => (
                      <MenuItem key={num} value={num}>{num}</MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Box>

              {forms.map((form, index) => (
                <Box key={index} sx={{ mb: 4, p: 3, bgcolor: 'var(--bg-paper)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonAddIcon fontSize="small" color="primary" /> Member {index + 1}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Roll Number"
                        size="small"
                        fullWidth
                        value={form.roll}
                        onChange={(e) => {
                          updateForm(index, 'roll', e.target.value);
                          if (e.target.value.trim().length === 10) {
                            handleLookupRoll(index, e.target.value);
                          }
                        }}
                        onBlur={(e) => handleLookupRoll(index, e.target.value)}
                        required
                        InputProps={{
                          endAdornment: rollLookupLoading[index] ? <CircularProgress size={20} /> : null
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Full Name" size="small" fullWidth value={form.name} onChange={(e) => updateForm(index, 'name', e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Email Address" size="small" fullWidth type="email" value={form.email} onChange={(e) => updateForm(index, 'email', e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Mobile Number" size="small" fullWidth value={form.mobile} onChange={(e) => updateForm(index, 'mobile', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField select label="Gender" size="small" fullWidth value={form.gender} onChange={(e) => updateForm(index, 'gender', e.target.value)}>
                        <MenuItem value="MALE">Male</MenuItem>
                        <MenuItem value="FEMALE">Female</MenuItem>
                        <MenuItem value="OTHER">Other</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={8}>
                      <TextField label="College" size="small" fullWidth value={form.college} onChange={(e) => updateForm(index, 'college', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField label="Branch" size="small" fullWidth value={form.branch} onChange={(e) => updateForm(index, 'branch', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField label="Department" size="small" fullWidth value={form.department} onChange={(e) => updateForm(index, 'department', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField label="Year" size="small" fullWidth value={form.year} onChange={(e) => updateForm(index, 'year', e.target.value)} />
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={() => setStep(1)} sx={{ borderRadius: '8px' }}>
              Back to Search
            </Button>
            {availableSlots > 0 && (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                sx={{ borderRadius: '8px', minWidth: 150 }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Add Members'}
              </Button>
            )}
          </Box>
        </Paper>
      )}
    </PageContainer>
  );
};

export default AddTeamMember;
