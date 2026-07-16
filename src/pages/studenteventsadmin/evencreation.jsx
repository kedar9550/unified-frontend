import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Autocomplete,
  Chip,
  CircularProgress,
  Button,
  Grid,
  IconButton,
  FormHelperText,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import API from '../../api/axios';

const EventCreation = () => {
  const [eventName, setEventName] = useState('');
  
  // Convener states
  const [convenerSearchTerm, setConvenerSearchTerm] = useState('');
  const [convenerOptions, setConvenerOptions] = useState([]);
  const [selectedConveners, setSelectedConveners] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Image states
  const [bannerImage, setBannerImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState('');

  // Form errors
  const [errors, setErrors] = useState({});

  // Debounced search for conveners
  useEffect(() => {
    if (!convenerSearchTerm || convenerSearchTerm.trim() === '') {
      setConvenerOptions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await API.get('/api/employees/search', {
          params: { query: convenerSearchTerm },
        });
        // API might return data wrapped in 'users' or just the array directly
        const users = response.data?.users || response.data || [];
        setConvenerOptions(Array.isArray(users) ? users : []);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setConvenerOptions([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [convenerSearchTerm]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageError('');
    
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageError('Please upload a valid image file (JPG, JPEG, PNG, WebP).');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image size should not exceed 5 MB.');
      return;
    }

    setBannerImage(file);
    setImagePreview(URL.createObjectURL(file));
    
    // Clear banner error if any
    setErrors(prev => ({ ...prev, bannerImage: null }));
  };

  const removeImage = () => {
    setBannerImage(null);
    setImagePreview(null);
    setImageError('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!eventName.trim()) {
      newErrors.eventName = 'Event Name is required.';
    } else if (eventName.length > 200) {
      newErrors.eventName = 'Event Name cannot exceed 200 characters.';
    }

    if (selectedConveners.length === 0) {
      newErrors.conveners = 'At least one Convener must be selected.';
    }

    if (!bannerImage) {
      newErrors.bannerImage = 'Banner Image is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Prepare payload
    const formData = new FormData();
    formData.append('eventName', eventName);
    
    const convenersPayload = selectedConveners.map((conv) => ({
      employeeId: conv.institutionId,
      employeeName: conv.name,
      department: conv.department?.name || conv.department,
      designation: conv.designation,
      role: 'Convener'
    }));
    
    formData.append('conveners', JSON.stringify(convenersPayload));
    formData.append('bannerImage', bannerImage);

    try {
      const response = await API.post('/api/events', formData);
      if (response.data.success) {
        alert('Event created successfully!');
      } else {
        alert('Event creation failed: ' + response.data.message);
      }
      
      // Reset form on success
      setEventName('');
      setSelectedConveners([]);
      removeImage();
      setErrors({});
    } catch (error) {
      console.error('Error creating event:', error);
      alert(error.response?.data?.message || 'Failed to create event. Please try again.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Event Creation"
        subtitle="Create a new student event"
        showLogo={false}
        showBack={false}
      />

      <Card sx={{ mt: 3, maxWidth: 800, mx: 'auto', boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            
            {/* Event Name */}
            <Box>
              <Typography variant="subtitle1" fontWeight="600" mb={1}>
                Event Name *
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter event name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                error={!!errors.eventName}
                helperText={errors.eventName || `${eventName.length}/200`}
                slotProps={{
                  htmlInput: { maxLength: 200 }
                }}
                variant="outlined"
              />
            </Box>

            {/* Conveners Section */}
            <Box>
              <Typography variant="subtitle1" fontWeight="600" mb={1}>
                Conveners *
              </Typography>
              <Autocomplete
                multiple
                options={convenerOptions}
                getOptionLabel={(option) => `${option.name} (${option.institutionId})`}
                isOptionEqualToValue={(option, value) => option.institutionId === value.institutionId}
                filterOptions={(x) => x}
                loading={isSearching}
                value={selectedConveners}
                onChange={(event, newValue) => {
                  setSelectedConveners(newValue);
                  if (newValue.length > 0) {
                      setErrors(prev => ({ ...prev, conveners: null }));
                  }
                }}
                onInputChange={(event, newInputValue) => {
                  setConvenerSearchTerm(newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search employees by Name or ID..."
                    error={!!errors.conveners}
                    helperText={errors.conveners}
                    variant="outlined"
                    InputProps={{
                      ...(params.InputProps || {}),
                      endAdornment: (
                        <React.Fragment>
                          {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps?.endAdornment}
                        </React.Fragment>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                        <li key={key} {...otherProps}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
                                <Typography variant="body1" fontWeight="500">
                                    {option.name} <Typography component="span" variant="body2" color="text.secondary">({option.institutionId})</Typography>
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {option.department?.name || option.department} • {option.designation}
                                </Typography>
                            </Box>
                        </li>
                    );
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={`${option.name} (${option.institutionId})`}
                          {...tagProps}
                          color="primary"
                          variant="outlined"
                          sx={{ m: 0.5 }}
                        />
                      );
                  })
                }
                noOptionsText={convenerSearchTerm ? "No employees found" : "Type to search"}
              />
            </Box>

            {/* Banner Image Upload */}
            <Box>
              <Typography variant="subtitle1" fontWeight="600" mb={1}>
                Banner Image *
              </Typography>
              {!imagePreview ? (
                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: errors.bannerImage ? 'error.main' : 'grey.300',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: 'background.default',
                    transition: 'all 0.2s',
                    '&:hover': { 
                        borderColor: 'primary.main', 
                        bgcolor: 'action.hover' 
                    },
                  }}
                  component="label"
                >
                  <input
                    type="file"
                    hidden
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleImageChange}
                  />
                  <CloudUploadIcon sx={{ fontSize: 48, color: errors.bannerImage ? 'error.main' : 'primary.main', mb: 1 }} />
                  <Typography variant="h6" color="text.primary" gutterBottom>
                    Click or drag file to this area to upload
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Support for a single image upload (JPG, PNG, WebP). Max size: 5MB.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ 
                    position: 'relative', 
                    width: '100%', 
                    maxHeight: 400, 
                    borderRadius: 2, 
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                  <img
                    src={imagePreview}
                    alt="Banner Preview"
                    style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                  />
                  <Box sx={{ 
                      position: 'absolute', 
                      top: 16, 
                      right: 16, 
                      display: 'flex', 
                      gap: 1,
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      p: 0.5,
                      borderRadius: 1,
                      boxShadow: 1
                  }}>
                    <Button
                      variant="contained"
                      component="label"
                      size="small"
                      color="primary"
                    >
                      Replace
                      <input
                        type="file"
                        hidden
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleImageChange}
                      />
                    </Button>
                    <IconButton
                      color="error"
                      onClick={removeImage}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              )}
              {imageError && (
                <FormHelperText error sx={{ mt: 1, ml: 1 }}>
                  {imageError}
                </FormHelperText>
              )}
              {errors.bannerImage && !imagePreview && (
                <FormHelperText error sx={{ mt: 1, ml: 1 }}>
                  {errors.bannerImage}
                </FormHelperText>
              )}
            </Box>

            {/* Actions */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => {
                    setEventName('');
                    setSelectedConveners([]);
                    removeImage();
                    setErrors({});
                  }}
                >
                  Clear Form
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  size="large"
                  sx={{ px: 4 }}
                >
                  Save Event
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EventCreation;
