import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import {
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Sparkles,
  Info,
  ArrowRight,
  BookmarkCheck,
  Building
} from 'lucide-react';
import API from '../../api/axios';
import PageContainer from '../../components/common/design-system/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'sonner';

export default function StudentActivityHubPage() {
  const [activeTab, setActiveTab] = useState(0); // 0: Available Activities, 1: My Registrations
  const [availableActivities, setAvailableActivities] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [registeringId, setRegisteringId] = useState(null);

  // Selected Activity Detail Modal
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Fetch Available Enabled Activities
  const fetchAvailableActivities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/activity-hub/student/available');
      if (res.data?.success) {
        setAvailableActivities(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching available activities:', err);
      toast.error('Failed to load available activities.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch My Registrations
  const fetchMyRegistrations = useCallback(async () => {
    try {
      const res = await API.get('/api/activity-hub/student/my-registrations');
      if (res.data?.success) {
        setMyRegistrations(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching my registrations:', err);
    }
  }, []);

  useEffect(() => {
    fetchAvailableActivities();
    fetchMyRegistrations();
  }, [fetchAvailableActivities, fetchMyRegistrations]);

  // Handle Self-Registration
  const handleRegister = async (activity) => {
    setRegisteringId(activity._id);
    try {
      const res = await API.post('/api/activity-hub/student/register', {
        activityId: activity._id
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Successfully registered for this activity!');
        fetchAvailableActivities();
        fetchMyRegistrations();
        setDetailModalOpen(false);
      }
    } catch (err) {
      console.error('Error registering:', err);
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setRegisteringId(null);
    }
  };

  return (
    <PageContainer maxWidth="xl" px={3} py={3}>
      <PageHeader
        title="Student Activity Hub"
        subtitle="Explore upcoming university workshops, guest lectures, industrial visits, and value-added courses. Register online to participate."
        icon={<Layers />}
      />

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: '#e2e8f0', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              minHeight: 48
            }
          }}
        >
          <Tab
            icon={<Sparkles size={18} />}
            iconPosition="start"
            label={`Available Activities (${availableActivities.length})`}
          />
          <Tab
            icon={<BookmarkCheck size={18} />}
            iconPosition="start"
            label={`My Registrations (${myRegistrations.length})`}
          />
        </Tabs>
      </Box>

      {/* Tab 0: Available Enabled Activities */}
      {activeTab === 0 && (
        <Box>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress size={36} />
              <Typography variant="body2" sx={{ mt: 1.5, color: '#64748b' }}>
                Loading available activities...
              </Typography>
            </Box>
          ) : availableActivities.length === 0 ? (
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <Layers size={48} color="#94a3b8" />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155', mt: 1.5 }}>
                No Active Activities Right Now
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                Check back soon! New workshops and university events will appear here once published.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {availableActivities.map((act) => {
                const isRegistered = act.isRegistered;
                const isDeadlinePassed = act.registrationDeadline ? new Date() > new Date(act.registrationDeadline) : false;

                return (
                  <Grid item xs={12} sm={6} md={4} key={act._id}>
                    <Card
                      elevation={0}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        borderRadius: '16px',
                        border: isRegistered ? '2px solid #22c55e' : '1px solid #e2e8f0',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.08)'
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                          <Chip
                            label={act.activityType}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              borderRadius: '8px',
                              bgcolor: 'rgba(0, 78, 146, 0.08)',
                              color: '#004e92'
                            }}
                          />
                          {isRegistered && (
                            <Chip
                              icon={<CheckCircle2 size={14} />}
                              label="Registered"
                              size="small"
                              color="success"
                              sx={{ fontWeight: 700, borderRadius: '8px' }}
                            />
                          )}
                        </Box>

                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', lineHeight: 1.3, mb: 1 }}>
                          {act.title}
                        </Typography>

                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem', mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {act.description || 'No description provided.'}
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Calendar size={15} color="#64748b" />
                            <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600 }}>
                              {new Date(act.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} — {new Date(act.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Building size={15} color="#64748b" />
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              Host: <strong>{act.departmentName || 'University Wide'}</strong>
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Users size={15} color="#64748b" />
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              Registered: <strong>{act.registrationCount || 0}</strong> {act.maxParticipants > 0 ? ` / ${act.maxParticipants} max` : 'students'}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>

                      <CardActions sx={{ p: 2.5, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedActivity(act);
                            setDetailModalOpen(true);
                          }}
                          sx={{ textTransform: 'none', fontWeight: 600, color: '#004e92' }}
                        >
                          View Details
                        </Button>

                        {isRegistered ? (
                          <Button
                            variant="outlined"
                            size="small"
                            color="success"
                            disabled
                            startIcon={<CheckCircle2 size={16} />}
                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                          >
                            Enrolled
                          </Button>
                        ) : isDeadlinePassed ? (
                          <Chip label="Closed" size="small" sx={{ fontWeight: 600 }} />
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleRegister(act)}
                            disabled={registeringId === act._id}
                            sx={{
                              borderRadius: '10px',
                              bgcolor: '#004e92',
                              color: '#ffffff',
                              textTransform: 'none',
                              fontWeight: 700,
                              px: 2,
                              '&:hover': { bgcolor: '#003a6d' }
                            }}
                          >
                            {registeringId === act._id ? 'Registering...' : 'Register Now'}
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}

      {/* Tab 1: My Registrations */}
      {activeTab === 1 && (
        <Box>
          {myRegistrations.length === 0 ? (
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <BookmarkCheck size={48} color="#94a3b8" />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155', mt: 1.5 }}>
                You Have Not Registered for Any Activities Yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, mb: 2 }}>
                Browse the Available Activities tab and enroll in workshops, seminars, and lectures.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setActiveTab(0)}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
              >
                Browse Activities
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={2.5}>
              {myRegistrations.map((reg) => (
                <Grid item xs={12} sm={6} md={4} key={reg._id}>
                  <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', p: 1 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip
                          label={reg.activity?.activityType || 'Activity'}
                          size="small"
                          sx={{ fontWeight: 700, borderRadius: '8px', bgcolor: 'rgba(0, 78, 146, 0.08)', color: '#004e92' }}
                        />
                        <Chip
                          icon={<CheckCircle2 size={13} />}
                          label={reg.status || 'Registered'}
                          size="small"
                          color="success"
                          sx={{ fontWeight: 700, borderRadius: '8px' }}
                        />
                      </Box>

                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, lineHeight: 1.3 }}>
                        {reg.activity?.title || 'Registered Activity'}
                      </Typography>

                      <Divider sx={{ my: 1.5 }} />

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Registered on: <strong>{new Date(reg.registeredAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Roll Number: <strong>{reg.rollNumber}</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Host Dept: <strong>{reg.activity?.departmentName || 'University Wide'}</strong>
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <Dialog
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: '20px' } }}
        >
          <DialogTitle sx={{ py: 2.5, px: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Chip
                label={selectedActivity.activityType}
                size="small"
                sx={{ fontWeight: 700, borderRadius: '8px', bgcolor: 'rgba(0, 78, 146, 0.08)', color: '#004e92', mb: 0.5 }}
              />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                {selectedActivity.title}
              </Typography>
            </Box>
            <Button onClick={() => setDetailModalOpen(false)} sx={{ minWidth: 32, p: 0, color: '#94a3b8' }}>
              ✕
            </Button>
          </DialogTitle>

          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  DESCRIPTION
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', mt: 0.5 }}>
                  {selectedActivity.description || 'No detailed description available.'}
                </Typography>
              </Box>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    START DATE
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    {new Date(selectedActivity.startDate).toLocaleDateString('en-IN')}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    END DATE
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    {new Date(selectedActivity.endDate).toLocaleDateString('en-IN')}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    HOST DEPARTMENT
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    {selectedActivity.departmentName || 'All Departments'}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    ACADEMIC YEAR
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    {selectedActivity.academicYearName || '-'}
                  </Typography>
                </Grid>
              </Grid>

              {/* Dynamic Type Specifics */}
              {selectedActivity.typeDetails && Object.keys(selectedActivity.typeDetails).length > 0 && (
                <>
                  <Divider />
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    ADDITIONAL DETAILS
                  </Typography>
                  <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    {Object.entries(selectedActivity.typeDetails).map(([key, val]) => (
                      <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'capitalize' }}>
                          {key.replace(/([A-Z])/g, ' $1')}:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {String(val || '-')}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => setDetailModalOpen(false)} sx={{ color: '#64748b', textTransform: 'none' }}>
              Close
            </Button>

            {selectedActivity.isRegistered ? (
              <Chip icon={<CheckCircle2 size={16} />} label="Already Registered" color="success" sx={{ fontWeight: 700 }} />
            ) : (
              <Button
                variant="contained"
                onClick={() => handleRegister(selectedActivity)}
                disabled={registeringId === selectedActivity._id}
                sx={{
                  borderRadius: '12px',
                  bgcolor: '#004e92',
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 3,
                  '&:hover': { bgcolor: '#003a6d' }
                }}
              >
                {registeringId === selectedActivity._id ? 'Registering...' : 'Confirm Registration'}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}
    </PageContainer>
  );
}
