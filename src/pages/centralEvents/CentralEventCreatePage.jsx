import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  ListSubheader,
  Button,
  FormControl,
  InputLabel,
  Select,
  Stack,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  InputAdornment,
  Autocomplete,
  Avatar,
  Chip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Folder as FolderIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  Payments as PaymentsIcon,
  Description as DescriptionIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Badge as BadgeIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getEventTypes,
  getCategoriesByTypeCode,
  getOrganizers,
  createCentralEvent,
  updateCentralEvent,
  getCentralEventBySlug,
  uploadCentralEventFile,
  getAcademicYears
} from '../../api/centralEventsApi';
import { fetchEventDepartments } from '../../api/eventDepartmentApi';
import API from '../../api/axios';
import axios from 'axios';
import { PageHeader, CustomTabs } from '../../components/common';
import PageContainer from '../../components/common/design-system/PageContainer';
import { toast } from 'sonner';
import formRegistry from '../../config/form-registry.json';
import DynamicForm from '../UniversityData/DynamicForm';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const ECAP_API_KEY = import.meta.env.VITE_ECAP_API_KEY || import.meta.env.ECAP_API_KEY || (typeof process !== 'undefined' && process.env?.ECAP_API_KEY);

const getImageUrl = (img) => {
  if (!img) return '';
  const pathStr = typeof img === 'string' ? img : img.url;
  if (!pathStr) return '';
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://') || pathStr.startsWith('blob:')) {
    return pathStr;
  }
  return `${BACKEND_URL}${pathStr.startsWith('/') ? '' : '/'}${pathStr}`;
};

const toLocalISOString = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
};

export default function CentralEventCreatePage() {
  const navigate = useNavigate();
  const { slug: routeSlug } = useParams();
  const [searchParams] = useSearchParams();
  const editSlug = routeSlug || searchParams.get('slug') || searchParams.get('editId') || searchParams.get('id');
  const isEditMode = Boolean(editSlug);
  const [editingEventId, setEditingEventId] = useState(null);

  const { user, activeRole } = useAuth();

  const userRoles = (user?.roles || []).map(r => (typeof r === 'string' ? r : (r.role?.key || r.role?.name || r.role || '')).toUpperCase());
  const isGlobalAdmin = userRoles.includes('GLOBAL_EVENT_ADMIN') || userRoles.includes('SUPER_ADMIN') || activeRole?.toUpperCase() === 'GLOBAL_EVENT_ADMIN';

  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Academic Year State
  const [academicYears, setAcademicYears] = useState([]);
  const [academicYear, setAcademicYear] = useState('');

  // Department State
  const [departments, setDepartments] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);

  // Infrastructure & Venue State
  const [venueType, setVenueType] = useState('Indoor');
  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [groundId, setGroundId] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [onlineLink, setOnlineLink] = useState('');
  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [groundsList, setGroundsList] = useState([]);

  // Form State
  const [typeCode, setTypeCode] = useState('');
  const [selectedTypeObj, setSelectedTypeObj] = useState(null);
  const [selectedFormCode, setSelectedFormCode] = useState('2.6');
  const [categoryId, setCategoryId] = useState('');
  const [level, setLevel] = useState('');
  const [activityType, setActivityType] = useState('');
  const [organizerId, setOrganizerId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('OFFLINE');
  const [venueName, setVenueName] = useState('');
  const [feeRupees, setFeeRupees] = useState('0');
  const [capacity, setCapacity] = useState('100');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [regDeadline, setRegDeadline] = useState('');
  const [participationType, setParticipationType] = useState('SINGLE');
  const [minTeamSize, setMinTeamSize] = useState('1');
  const [maxTeamSize, setMaxTeamSize] = useState('1');

  const [rules, setRules] = useState(['', '', '']);

  const handleRuleChange = (index, value) => {
    setRules((currentRules) => currentRules.map((rule, i) => (i === index ? value : rule)));
  };

  const addRule = () => setRules((currentRules) => [...currentRules, '']);

  const removeRule = (index) => {
    setRules((currentRules) => {
      if (currentRules.length <= 1) return [''];
      return currentRules.filter((_, i) => i !== index);
    });
  };

  // Faculty Coordinators State
  const [selectedFacultyCoordinators, setSelectedFacultyCoordinators] = useState([]);
  const [facultySearchQuery, setFacultySearchQuery] = useState('');
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [isSearchingFaculty, setIsSearchingFaculty] = useState(false);

  // Student Coordinators State
  const [studentCoordinators, setStudentCoordinators] = useState([]);
  const [studentRollNoInput, setStudentRollNoInput] = useState('');
  const [studentError, setStudentError] = useState('');
  const [isFetchingStudent, setIsFetchingStudent] = useState(false);

  // Uploaded Files
  const [banner, setBanner] = useState(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Grouped Activity Forms from formRegistry
  const groupedActivityForms = React.useMemo(() => {
    const groups = {};
    (formRegistry.forms || []).forEach((f) => {
      if (f.is_active === false) return;
      const grp = f.group || 'General Activities';
      if (!groups[grp]) groups[grp] = [];
      groups[grp].push(f);
    });
    return groups;
  }, []);

  const selectedActivityForm = React.useMemo(() => {
    return (formRegistry.forms || []).find((f) => f.code === selectedFormCode) || formRegistry.forms[0];
  }, [selectedFormCode]);

  const isDepartmentalOrUniversity = typeCode === 'DEPARTMENTAL' || typeCode === 'UNIVERSITY';

  const handleActivitySaveSuccess = async (savedRecord, formData) => {
    try {
      setSubmitting(true);
      const eventTitle = formData.title || formData.name || selectedActivityForm?.name || 'Departmental Event';
      const eventDesc = formData.remarks || `${selectedActivityForm?.name || 'Departmental'} activity event`;

      const payload = {
        typeCode,
        title: eventTitle,
        description: eventDesc,
        mode: mode || 'OFFLINE',
        venue: { name: venueName || 'Campus Venue' },
        fee: { amount: 0, currency: 'INR' },
        capacity: parseInt(capacity || '100', 10),
        schedule: {
          fromDate: formData.start_date || fromDate || new Date(),
          toDate: formData.end_date || toDate || new Date(),
          regDeadline: formData.start_date || regDeadline || new Date()
        },
        participation: {
          type: 'SINGLE',
          minTeamSize: 1,
          maxTeamSize: 1
        },
        level: level || 'STUDENT',
        activityType: selectedActivityForm?.code || 'WORKSHOP',
        banner
      };

      const res = await createCentralEvent(payload);
      if (res.success) {
        toast.success(`Event & Activity Record [${selectedActivityForm?.code}] created successfully!`);
        navigate('/central-events');
      }
    } catch (err) {
      console.error('Error creating central event from activity form:', err);
      toast.error('Activity record saved successfully!');
      navigate('/central-events');
    } finally {
      setSubmitting(false);
    }
  };

  // Navigation Tabs
  const navTabs = [
    { key: 'all', label: 'All Central Events', icon: <EventIcon />, path: '/central-events' },
    { key: 'types', label: 'Event Types', icon: <CategoryIcon />, path: '/central-events/types' },
    { key: 'categories', label: 'Event Categories', icon: <FolderIcon />, path: '/central-events/categories' },
    { key: 'subcategories', label: 'Event Subcategories', icon: <FolderIcon />, path: '/central-events/subcategories' },
    ...(isGlobalAdmin ? [{ key: 'create', label: isEditMode ? 'Edit Event' : 'Create Event', icon: isEditMode ? <EventIcon /> : <AddIcon />, path: isEditMode ? `/central-events/edit/${editSlug}` : '/central-events/create' }] : [])
  ];

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [typesRes, orgsRes, bRes, fRes, gRes, dRes, ayRes] = await Promise.allSettled([
          getEventTypes(),
          getOrganizers(),
          API.get('/api/infrastructure/buildings'),
          API.get('/api/infrastructure/floors'),
          API.get('/api/infrastructure/grounds'),
          fetchEventDepartments(),
          getAcademicYears()
        ]);
        if (typesRes.status === 'fulfilled' && typesRes.value?.success) setTypes(typesRes.value.data);
        if (orgsRes.status === 'fulfilled' && orgsRes.value?.success) setOrganizers(orgsRes.value.data);
        if (bRes.status === 'fulfilled') {
          setBuildingsList(bRes.value.data?.data?.filter((b) => b.status?.toLowerCase() === 'active') || []);
        }
        if (fRes.status === 'fulfilled') {
          setFloorsList(fRes.value.data?.data?.filter((f) => f.status?.toLowerCase() === 'active') || []);
        }
        if (gRes.status === 'fulfilled') {
          setGroundsList(gRes.value.data?.data?.filter((g) => g.status?.toLowerCase() === 'active') || []);
        }
        if (dRes.status === 'fulfilled') {
          const depts = dRes.value.data?.departments || dRes.value.data?.data || [];
          setDepartmentsList(depts.filter((d) => d.status === 'Active' || !d.status));
        }
        if (ayRes.status === 'fulfilled') {
          const ayList = ayRes.value?.years || ayRes.value?.data || ayRes.value || [];
          if (Array.isArray(ayList)) {
            setAcademicYears(ayList);
            const activeAY = ayList.find((ay) => ay.active)?.year || ayList[0]?.year || '';
            if (activeAY) {
              setAcademicYear((prev) => prev || activeAY);
            }
          }
        }
      } catch (err) {
        toast.error('Failed to load form metadata');
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchMasterData();
  }, []);

  // Fetch event details if in Edit Mode
  useEffect(() => {
    if (!editSlug) return;
    const fetchEventForEdit = async () => {
      try {
        const res = await getCentralEventBySlug(editSlug);
        if (res.success && res.data) {
          const ev = res.data;
          setEditingEventId(ev._id);
          setTitle(ev.title || '');
          setDescription(ev.description || '');
          if (ev.academicYear) setAcademicYear(ev.academicYear);
          if (ev.typeCode) {
            setTypeCode(ev.typeCode);
            try {
              const catRes = await getCategoriesByTypeCode(ev.typeCode);
              if (catRes.success && catRes.data) {
                setCategories(catRes.data);
              }
            } catch (catErr) {
              console.error('Failed to load categories for edit:', catErr);
            }
          }
          if (ev.categoryId) {
            setCategoryId(typeof ev.categoryId === 'object' ? ev.categoryId._id : ev.categoryId);
          }
          if (ev.level) setLevel(ev.level);
          if (ev.activityType) setActivityType(ev.activityType);
          if (ev.organizer?.organizerId) {
            setOrganizerId(typeof ev.organizer.organizerId === 'object' ? ev.organizer.organizerId._id : ev.organizer.organizerId);
          }
          if (ev.mode) setMode(ev.mode);
          if (ev.venue?.venueType) setVenueType(ev.venue.venueType);
          if (ev.venue?.building) setBuildingId(typeof ev.venue.building === 'object' ? ev.venue.building._id : ev.venue.building);
          if (ev.venue?.floor) setFloorId(typeof ev.venue.floor === 'object' ? ev.venue.floor._id : ev.venue.floor);
          if (ev.venue?.ground) setGroundId(typeof ev.venue.ground === 'object' ? ev.venue.ground._id : ev.venue.ground);
          if (ev.venue?.roomNo) setRoomNo(ev.venue.roomNo);
          if (ev.venue?.link) setOnlineLink(ev.venue.link);
          if (ev.venue?.venueType === 'Indoor' || ev.venue?.venueType === 'Outdoor') {
            setVenueName('');
          } else {
            setVenueName(ev.venue?.name || '');
          }
          if (ev.department && Array.isArray(ev.department)) {
            setDepartments(ev.department.map(d => typeof d === 'object' ? d._id : d));
          }
          if (ev.fee?.amount !== undefined) setFeeRupees((ev.fee.amount / 100).toString());
          if (ev.capacity !== undefined) setCapacity(ev.capacity.toString());
          if (ev.schedule?.fromDate) setFromDate(toLocalISOString(ev.schedule.fromDate));
          if (ev.schedule?.toDate) setToDate(toLocalISOString(ev.schedule.toDate));
          if (ev.schedule?.regDeadline) setRegDeadline(toLocalISOString(ev.schedule.regDeadline));
          if (ev.participation?.type) setParticipationType(ev.participation.type);
          if (ev.participation?.minTeamSize !== undefined) setMinTeamSize(ev.participation.minTeamSize.toString());
          if (ev.participation?.maxTeamSize !== undefined) setMaxTeamSize(ev.participation.maxTeamSize.toString());
          if (Array.isArray(ev.rules) && ev.rules.length > 0) setRules(ev.rules);
          if (ev.banner) setBanner(ev.banner);
          if (ev.coordinators?.faculty && Array.isArray(ev.coordinators.faculty)) {
            setSelectedFacultyCoordinators(ev.coordinators.faculty);
          }
          if (ev.coordinators?.student && Array.isArray(ev.coordinators.student)) {
            setStudentCoordinators(ev.coordinators.student);
          }
        }
      } catch (err) {
        console.error('Error fetching event for edit:', err);
        toast.error('Failed to load event details for editing');
      }
    };
    fetchEventForEdit();
  }, [editSlug]);

  useEffect(() => {
    if (types.length && typeCode && (!selectedTypeObj || !selectedTypeObj.name)) {
      const tObj = types.find((t) => t.code === typeCode);
      if (tObj) {
        setSelectedTypeObj(tObj);
        if (tObj.hasCategories && categories.length === 0) {
          getCategoriesByTypeCode(typeCode).then(res => {
            if (res.success) setCategories(res.data);
          }).catch(() => {});
        }
      }
    }
  }, [types, typeCode, selectedTypeObj, categories.length]);

  const handleTypeChange = async (code) => {
    setTypeCode(code);
    const tObj = types.find((t) => t.code === code);
    setSelectedTypeObj(tObj);
    setCategoryId('');
    setLevel('');
    setActivityType('');
    setOrganizerId('');

    if (tObj?.hasCategories) {
      try {
        const res = await getCategoriesByTypeCode(code);
        if (res.success) setCategories(res.data);
      } catch (err) {
        toast.error('Failed to load categories');
      }
    } else {
      setCategories([]);
    }
  };

  // Live employee search for faculty coordinators
  useEffect(() => {
    if (!facultySearchQuery || facultySearchQuery.trim().length < 2) return;
    const timer = setTimeout(async () => {
      setIsSearchingFaculty(true);
      try {
        const res = await API.get('/api/employees/search', { params: { query: facultySearchQuery.trim() } });
        const users = res.data?.data || res.data || [];
        if (Array.isArray(users)) {
          const formatted = users.map((u) => ({
            empId: u.institutionId || u.empId || u.employeeId || '',
            name: u.name || u.EMP_NAME || '',
            designation: u.designation || u.DESIGNATION || '',
            department: typeof u.department === 'object' ? (u.department?.name || u.department?.code) : (u.department || u.DEPT_NAME || ''),
            phone: u.phone || u.MOBILE || '',
            email: u.email || u.EMAIL || ''
          }));
          setFacultyOptions(formatted);
        }
      } catch (err) {
        console.error('Error searching faculty employees:', err);
      } finally {
        setIsSearchingFaculty(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [facultySearchQuery]);

  const handleAddStudentCoordinator = async () => {
    const rollNo = studentRollNoInput.trim().toUpperCase();
    if (!rollNo) {
      setStudentError('Please enter a roll number');
      return;
    }
    if (studentCoordinators.some((s) => s.rollNo === rollNo)) {
      setStudentError(`Roll number ${rollNo} is already added`);
      return;
    }

    setIsFetchingStudent(true);
    setStudentError('');
    try {
      const targetUrl = `/adityaapi/api/studentdata/${encodeURIComponent(rollNo)}`;
      const res = await axios.get(targetUrl, {
        headers: {
          'x-api-key': ECAP_API_KEY,
          'X-API-Key': ECAP_API_KEY
        }
      });
      const json = res.data;
      const norm = Array.isArray(json) ? json : (json ? [json] : []);
      if (norm.length > 0 && !norm[0].error && (norm[0].studentname || norm[0].studentName || norm[0].name)) {
        const student = norm[0];
        setStudentCoordinators((prev) => [
          ...prev,
          {
            rollNo: student.rollno || student.RollNo || rollNo,
            name: student.studentname || student.studentName || student.name,
            department: student.department || '',
            branch: student.branch || ''
          }
        ]);
        setStudentRollNoInput('');
        toast.success(`Added student coordinator: ${student.studentname || student.studentName || student.name} (${rollNo})`);
      } else {
        setStudentError(`Student with roll number "${rollNo}" not found`);
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
      if (err.response?.status === 404) {
        setStudentError(`Student with roll number "${rollNo}" not found`);
      } else {
        setStudentError(err.response?.data?.message || err.message || 'Error connecting to student database');
      }
    } finally {
      setIsFetchingStudent(false);
    }
  };

  const handleRemoveStudentCoordinator = (rollNoToRemove) => {
    setStudentCoordinators((prev) => prev.filter((s) => s.rollNo !== rollNoToRemove));
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
      const targetAy = academicYear || categories.find((c) => c._id === categoryId)?.academicYear || '';
      const res = await uploadCentralEventFile(file, { folderType: 'events', academicYear: targetAy });
      if (res.success) {
        setBanner(res.data);
        toast.success('Banner uploaded successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to upload banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fromDate || !toDate || !regDeadline) {
      toast.error('Please specify Start Date, End Date, and Registration Deadline');
      return;
    }

    const startDt = new Date(fromDate);
    const endDt = new Date(toDate);
    const deadlineDt = new Date(regDeadline);

    if (isNaN(startDt.getTime()) || isNaN(endDt.getTime()) || isNaN(deadlineDt.getTime())) {
      toast.error('Please enter valid dates for schedule');
      return;
    }

    if (endDt < startDt) {
      toast.error('End Date & Time must be after or equal to Start Date & Time');
      return;
    }

    setSubmitting(true);

    try {
      const parsedRules = rules.map((r) => r.trim()).filter(Boolean);
      const targetAy = academicYear || categories.find((c) => c._id === categoryId)?.academicYear || '';

      // Construct structured venue name and payload
      let finalVenueName = venueName;
      if (mode === 'OFFLINE' || mode === 'HYBRID') {
        if (venueType === 'Indoor') {
          const bName = buildingsList.find((b) => b._id === buildingId)?.name || '';
          const fName = floorsList.find((f) => f._id === floorId)?.name || '';
          const customDetail = (venueName && !venueName.includes(bName) && !venueName.includes(fName)) ? venueName : '';
          const parts = [bName, fName, roomNo ? `Room: ${roomNo}` : '', customDetail].filter(Boolean);
          finalVenueName = parts.join(' - ');
        } else if (venueType === 'Outdoor') {
          const gName = groundsList.find((g) => g._id === groundId)?.name || '';
          const customDetail = (venueName && !venueName.includes(gName)) ? venueName : '';
          const parts = [gName, customDetail].filter(Boolean);
          finalVenueName = parts.join(' - ');
        }
      }

      const venuePayload = {
        name: finalVenueName || venueName || (mode === 'ONLINE' ? 'Online' : 'Campus Venue'),
        address: finalVenueName || venueName || '',
        link: (mode === 'ONLINE' || mode === 'HYBRID') ? onlineLink : '',
        venueType: (mode === 'OFFLINE' || mode === 'HYBRID') ? venueType : null,
        building: (venueType === 'Indoor' && buildingId) ? buildingId : null,
        floor: (venueType === 'Indoor' && floorId) ? floorId : null,
        ground: (venueType === 'Outdoor' && groundId) ? groundId : null,
        roomNo: roomNo || ''
      };

      const payload = {
        typeCode,
        title,
        description,
        mode,
        venue: venuePayload,
        department: departments || [],
        fee: {
          amount: Math.round(parseFloat(feeRupees || '0') * 100), // convert rupees to paise
          currency: 'INR'
        },
        capacity: parseInt(capacity || '100', 10),
        schedule: {
          fromDate: new Date(fromDate).toISOString(),
          toDate: new Date(toDate).toISOString(),
          regDeadline: new Date(regDeadline).toISOString()
        },
        participation: {
          type: participationType,
          minTeamSize: parseInt(minTeamSize, 10),
          maxTeamSize: parseInt(maxTeamSize, 10)
        },
        rules: parsedRules,
        outcomes: [],
        banner,
        coordinators: {
          faculty: selectedFacultyCoordinators.map((f) => ({
            name: f.name || f.employeeName || '',
            empId: f.empId || f.institutionId || f.employeeId || '',
            designation: f.designation || '',
            department: f.department || '',
            phone: f.phone || '',
            email: f.email || ''
          })),
          student: studentCoordinators.map((s) => ({
            rollNo: s.rollNo,
            name: s.name,
            department: s.department || '',
            branch: s.branch || '',
            phone: s.phone || '',
            email: s.email || ''
          }))
        }
      };

      if (targetAy) {
        payload.academicYear = targetAy;
      }

      if (selectedTypeObj?.hasCategories) {
        payload.categoryId = categoryId;
      }

      if (selectedTypeObj?.hasLevels) {
        payload.level = level;
        payload.activityType = activityType;
        payload.organizer = { organizerId };
      }

      if (isEditMode && editingEventId) {
        const res = await updateCentralEvent(editingEventId, payload);
        if (res.success) {
          toast.success('Central Event updated successfully!');
          navigate('/central-events');
        }
      } else {
        const res = await createCentralEvent(payload);
        if (res.success) {
          toast.success('Central Event created successfully (DRAFT)');
          navigate(`/central-events/${res.data.slug}`);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save central event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTypes) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <PageContainer maxWidth="lg" px={3} py={3}>
      {/* Standard Page Header */}
      <PageHeader
        title={isEditMode ? "Edit Central Event" : "Create New Central Event"}
        subtitle={isEditMode ? "Update event details, academic year, schedule timelines, and participation parameters." : "Configure event hierarchy, target levels, schedule timelines, participation rules, and fee parameters."}
        icon={<EventIcon />}
        showBack
        backPath="/central-events"
      />

      <form onSubmit={handleSubmit}>
        <Stack spacing={3.5}>

          {/* Section 1: Classification & Scope */}
          <Card elevation={0} sx={{ borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-paper)' }}>
            <CardContent sx={{ p: 3.5 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <CategoryIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  1. Event Classification & Scope
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {/* Academic Year */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel id="academic-year-label">Academic Year</InputLabel>
                    <Select
                      labelId="academic-year-label"
                      value={academicYear}
                      label="Academic Year"
                      onChange={(e) => setAcademicYear(e.target.value)}
                      sx={{ borderRadius: '12px' }}
                    >
                      {academicYears.map((ay) => (
                        <MenuItem key={ay._id || ay.year} value={ay.year}>
                          {ay.year} {ay.active ? '(Active)' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Event Type */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel id="event-type-label">Event Type</InputLabel>
                    <Select
                      labelId="event-type-label"
                      value={typeCode}
                      label="Event Type"
                      onChange={(e) => handleTypeChange(e.target.value)}
                      sx={{ borderRadius: '12px' }}
                    >
                      <ListSubheader sx={{ fontWeight: 700, color: 'info.main', lineHeight: '32px', bgcolor: 'var(--bg-paper)' }}>
                        🌐 Global Level Events
                      </ListSubheader>
                      {types.filter(t => (t.levelGroup || 'GLOBAL') === 'GLOBAL' || ['VEDA', 'COLORS', 'ALA'].includes(t.code)).map((t) => (
                        <MenuItem key={t.code} value={t.code} sx={{ pl: 3.5 }}>
                          {t.name}
                        </MenuItem>
                      ))}

                      <ListSubheader sx={{ fontWeight: 700, color: 'success.main', lineHeight: '32px', bgcolor: 'var(--bg-paper)' }}>
                        🏫 Institute Level Events
                      </ListSubheader>
                      {types.filter(t => t.levelGroup === 'INSTITUTE' || ['CLUB', 'DEPARTMENTAL', 'UNIVERSITY'].includes(t.code)).map((t) => (
                        <MenuItem key={t.code} value={t.code} sx={{ pl: 3.5 }}>
                          {t.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Activity Form Type selection for Departmental & University level events */}
                {isDepartmentalOrUniversity && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth required>
                      <InputLabel id="activity-form-type-label">Select Activity Form Type</InputLabel>
                      <Select
                        labelId="activity-form-type-label"
                        value={selectedFormCode}
                        label="Select Activity Form Type"
                        onChange={(e) => setSelectedFormCode(e.target.value)}
                        sx={{ borderRadius: '12px', fontWeight: 600 }}
                      >
                        {Object.entries(groupedActivityForms).map(([groupName, formsList]) => [
                          <ListSubheader key={groupName} sx={{ fontWeight: 700, color: 'primary.main', bgcolor: 'var(--bg-paper)' }}>
                            -- {groupName} --
                          </ListSubheader>,
                          ...formsList.map((f) => (
                            <MenuItem key={f.code} value={f.code} sx={{ pl: 3.5 }}>
                              {f.name}
                            </MenuItem>
                          ))
                        ])}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Category / Event School */}
                {!isDepartmentalOrUniversity && selectedTypeObj?.hasCategories && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth required>
                      <InputLabel id="category-label">
                        {typeCode === 'VEDA' ? 'Event School' : 'Category'}
                      </InputLabel>
                      <Select
                        labelId="category-label"
                        value={categoryId}
                        label={typeCode === 'VEDA' ? 'Event School' : 'Category'}
                        onChange={(e) => setCategoryId(e.target.value)}
                        sx={{ borderRadius: '12px' }}
                      >
                        {categories.map((c) => (
                          <MenuItem key={c._id} value={c._id}>
                            {c.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Department Dropdown */}
                {!isDepartmentalOrUniversity && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel id="department-label">Department</InputLabel>
                      <Select
                        labelId="department-label"
                        multiple
                        value={departments}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.includes('all')) {
                            if (departmentsList.length > 0 && departments.length === departmentsList.length) {
                              setDepartments([]);
                            } else {
                              setDepartments(departmentsList.map((d) => d._id));
                            }
                          } else {
                            setDepartments(value);
                          }
                        }}
                        label="Department"
                        renderValue={(selected) => {
                          if (!selected || selected.length === 0) {
                            return <Typography color="text.secondary">Select department(s)</Typography>;
                          }
                          if (departmentsList.length > 0 && selected.length === departmentsList.length) {
                            return 'All Departments';
                          }
                          return selected
                            .map((deptId) => departmentsList.find((dept) => dept._id === deptId)?.name || deptId)
                            .join(', ');
                        }}
                        sx={{ borderRadius: '12px' }}
                        MenuProps={{ PaperProps: { sx: { maxHeight: 300, borderRadius: '12px' } } }}
                      >
                        {departmentsList.length > 0 && (
                          <MenuItem value="all">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <input
                                type="checkbox"
                                checked={departmentsList.length > 0 && departments.length === departmentsList.length}
                                readOnly
                                style={{ width: 16, height: 16, cursor: 'pointer' }}
                              />
                              <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>Select All</Typography>
                            </Box>
                          </MenuItem>
                        )}
                        {departmentsList.map((dept) => (
                          <MenuItem key={dept._id} value={dept._id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <input
                                type="checkbox"
                                checked={departments.includes(dept._id)}
                                readOnly
                                style={{ width: 16, height: 16, cursor: 'pointer' }}
                              />
                              <Typography>{dept.name}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Levels, Activity Type & Organizer */}
                {!isDepartmentalOrUniversity && selectedTypeObj?.hasLevels && (
                  <>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth required>
                        <InputLabel id="target-level-label">Target Level</InputLabel>
                        <Select
                          labelId="target-level-label"
                          value={level}
                          label="Target Level"
                          onChange={(e) => {
                            setLevel(e.target.value);
                            setActivityType('');
                          }}
                          sx={{ borderRadius: '12px' }}
                        >
                          <MenuItem value="STUDENT">Student Level</MenuItem>
                          <MenuItem value="FACULTY">Faculty Level</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth required>
                        <InputLabel id="activity-type-label">Activity Type</InputLabel>
                        <Select
                          labelId="activity-type-label"
                          value={activityType}
                          label="Activity Type"
                          onChange={(e) => setActivityType(e.target.value)}
                          sx={{ borderRadius: '12px' }}
                        >
                          <MenuItem value="WORKSHOP">Workshop</MenuItem>
                          <MenuItem value="SEMINAR">Seminar / Orientation</MenuItem>
                          {level === 'FACULTY' && <MenuItem value="FDP">FDP</MenuItem>}
                          {level === 'FACULTY' && <MenuItem value="STTP">STTP</MenuItem>}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth required>
                        <InputLabel id="organizer-label">Organizer</InputLabel>
                        <Select
                          labelId="organizer-label"
                          value={organizerId}
                          label="Organizer"
                          onChange={(e) => setOrganizerId(e.target.value)}
                          sx={{ borderRadius: '12px' }}
                        >
                          {organizers.map((o) => (
                            <MenuItem key={o._id} value={o._id}>
                              {o.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Conditional Rendering: Step 1 (Departmental/University Activity Form) vs Step 2 (Standard Event Details) */}
          {isDepartmentalOrUniversity ? (
            <Card elevation={0} sx={{ borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-paper)' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                  <DescriptionIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    2. Complete Activity Form Details [{selectedActivityForm?.code} - {selectedActivityForm?.name}]
                  </Typography>
                </Box>
                {selectedActivityForm && (
                  <DynamicForm
                    form={selectedActivityForm}
                    onSaveSuccess={handleActivitySaveSuccess}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <>

              {/* Section 2: General Details & Venue */}
              <Card elevation={0} sx={{ borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-paper)' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                    <DescriptionIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      2. Event Information & Location
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        required
                        label="Event Title"
                        placeholder="e.g. National Level Coding Hackathon 2026"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        required
                        multiline
                        rows={4}
                        label="Event Description"
                        placeholder="Detailed overview of the event, objective, guidelines, and highlights..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                      />
                    </Grid>

                    {/* Event Mode */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth required>
                        <InputLabel id="mode-label">Event Mode</InputLabel>
                        <Select
                          labelId="mode-label"
                          value={mode}
                          label="Event Mode"
                          onChange={(e) => setMode(e.target.value)}
                          sx={{ borderRadius: '12px' }}
                        >
                          <MenuItem value="OFFLINE">Offline (On Campus)</MenuItem>
                          <MenuItem value="ONLINE">Online (Virtual)</MenuItem>
                          <MenuItem value="HYBRID">Hybrid</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Venue Type (Indoor / Outdoor) */}
                    {(mode === 'OFFLINE' || mode === 'HYBRID') && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth required>
                          <InputLabel id="venue-type-label">Venue Type</InputLabel>
                          <Select
                            labelId="venue-type-label"
                            value={venueType}
                            label="Venue Type"
                            onChange={(e) => {
                              setVenueType(e.target.value);
                              setBuildingId('');
                              setFloorId('');
                              setGroundId('');
                              setRoomNo('');
                            }}
                            sx={{ borderRadius: '12px' }}
                          >
                            <MenuItem value="Indoor">Indoor</MenuItem>
                            <MenuItem value="Outdoor">Outdoor</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    )}

                    {/* Online Link for ONLINE mode */}
                    {mode === 'ONLINE' && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          required
                          label="Online Meeting Link"
                          placeholder="e.g. Zoom / Google Meet / Teams link"
                          value={onlineLink}
                          onChange={(e) => setOnlineLink(e.target.value)}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LocationIcon color="action" />
                                </InputAdornment>
                              ),
                              sx: { borderRadius: '12px' }
                            }
                          }}
                        />
                      </Grid>
                    )}

                    {/* Indoor: Building and Floor */}
                    {(mode === 'OFFLINE' || mode === 'HYBRID') && venueType === 'Indoor' && (
                      <>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth required>
                            <InputLabel id="building-label">Building</InputLabel>
                            <Select
                              labelId="building-label"
                              value={buildingId}
                              label="Building"
                              onChange={(e) => setBuildingId(e.target.value)}
                              sx={{ borderRadius: '12px' }}
                            >
                              {buildingsList.map((b) => (
                                <MenuItem key={b._id} value={b._id}>
                                  {b.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth required>
                            <InputLabel id="floor-label">Floor</InputLabel>
                            <Select
                              labelId="floor-label"
                              value={floorId}
                              label="Floor"
                              onChange={(e) => setFloorId(e.target.value)}
                              sx={{ borderRadius: '12px' }}
                            >
                              {floorsList.map((f) => (
                                <MenuItem key={f._id} value={f._id}>
                                  {f.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </>
                    )}

                    {/* Outdoor: Ground */}
                    {(mode === 'OFFLINE' || mode === 'HYBRID') && venueType === 'Outdoor' && (
                      <>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth required>
                            <InputLabel id="ground-label">Ground</InputLabel>
                            <Select
                              labelId="ground-label"
                              value={groundId}
                              label="Ground"
                              onChange={(e) => setGroundId(e.target.value)}
                              sx={{ borderRadius: '12px' }}
                            >
                              {groundsList.map((g) => (
                                <MenuItem key={g._id} value={g._id}>
                                  {g.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            label="Ground Location / Landmark (Optional)"
                            placeholder="e.g. Near West Pavilion / Athletic Track"
                            value={venueName}
                            onChange={(e) => setVenueName(e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                          />
                        </Grid>
                      </>
                    )}

                    {/* Room No (for Indoor) and Additional Details */}
                    {(mode === 'OFFLINE' || mode === 'HYBRID') && venueType && (
                      <>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            label="Room No"
                            placeholder="e.g. 101"
                            value={roomNo}
                            onChange={(e) => setRoomNo(e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            label="Additional Venue Details (Optional)"
                            placeholder="e.g. Seminar Hall / Lab 4 / Auditorium"
                            value={venueName}
                            onChange={(e) => setVenueName(e.target.value)}
                            slotProps={{
                              input: {
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <LocationIcon color="action" />
                                  </InputAdornment>
                                ),
                                sx: { borderRadius: '12px' }
                              }
                            }}
                          />
                        </Grid>
                      </>
                    )}

                    {/* Hybrid Meeting Link */}
                    {mode === 'HYBRID' && (
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          label="Online Meeting Link (Hybrid Event)"
                          placeholder="e.g. Zoom / Google Meet link"
                          value={onlineLink}
                          onChange={(e) => setOnlineLink(e.target.value)}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LocationIcon color="action" />
                                </InputAdornment>
                              ),
                              sx: { borderRadius: '12px' }
                            }
                          }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              {/* Section 3: Event Coordinators (Faculty & Student) */}
              <Card elevation={0} sx={{ borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-paper)' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                    <PeopleIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      3. Event Coordinators
                    </Typography>
                  </Box>

                  <Grid container spacing={3.5}>
                    {/* Faculty Coordinators Sub-section */}
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ p: 2.5, borderRadius: '14px', bgcolor: 'var(--bg-accent-1, #f8fafc)', border: '1px solid var(--border-color)' }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <BadgeIcon color="primary" fontSize="small" />
                          <Typography variant="subtitle1" fontWeight={700}>
                            Faculty Coordinators
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                          Search and assign faculty / staff coordinators for this event.
                        </Typography>

                        <Autocomplete
                          multiple
                          fullWidth
                          options={facultyOptions}
                          getOptionLabel={(option) => {
                            if (!option) return '';
                            const name = option.name || option.employeeName || '';
                            const id = option.empId || option.institutionId || option.employeeId || '';
                            return id ? `${name} (${id})` : name;
                          }}
                          value={selectedFacultyCoordinators}
                          onChange={(_, newValue) => {
                            if (newValue) {
                              const formatted = newValue.map((val) => {
                                const id = val.empId || val.institutionId || val.employeeId || '';
                                return {
                                  ...val,
                                  empId: id,
                                  name: val.name || val.employeeName || '',
                                  designation: val.designation || '',
                                  department: val.department || ''
                                };
                              });
                              setSelectedFacultyCoordinators(formatted);
                            } else {
                              setSelectedFacultyCoordinators([]);
                            }
                          }}
                          inputValue={facultySearchQuery}
                          onInputChange={(_, newInputValue) => setFacultySearchQuery(newInputValue)}
                          filterOptions={(x) => x}
                          isOptionEqualToValue={(option, val) => {
                            const optId = option.empId || option.institutionId || option.employeeId || '';
                            const valId = val?.empId || val?.institutionId || val?.employeeId || '';
                            return optId === valId;
                          }}
                          loading={isSearchingFaculty}
                          noOptionsText={facultySearchQuery ? 'No coordinator found' : 'Search employee by name or ID (min 2 chars)'}
                          renderInput={(params) => {
                            const inputProps = params.InputProps || {};
                            return (
                              <TextField
                                {...params}
                                fullWidth
                                placeholder={selectedFacultyCoordinators.length === 0 ? "Search employee by name or ID..." : "Add another faculty coordinator..."}
                                InputProps={{
                                  ...inputProps,
                                  sx: { borderRadius: '12px', bgcolor: 'var(--bg-paper)' },
                                  endAdornment: (
                                    <>
                                      {isSearchingFaculty ? <CircularProgress color="inherit" size={20} /> : null}
                                      {inputProps.endAdornment}
                                    </>
                                  )
                                }}
                                variant="outlined"
                              />
                            );
                          }}
                          renderOption={(props, option) => (
                            <Box
                              component="li"
                              {...props}
                              key={option.empId || option.institutionId || option.employeeId || option._id}
                              sx={{ py: 1.25, px: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}
                            >
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: 'primary.main',
                                  fontSize: '0.8rem',
                                  fontWeight: 600
                                }}
                              >
                                {(option.name || option.employeeName || 'F')[0]?.toUpperCase()}
                              </Avatar>
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary' }}>
                                  {option.name || option.employeeName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {option.designation || 'Staff'} • {option.department || 'General'}
                                  {(option.empId || option.institutionId || option.employeeId) &&
                                    ` • ID: ${option.empId || option.institutionId || option.employeeId}`}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip
                                key={option.empId || index}
                                avatar={
                                  <Avatar sx={{ bgcolor: 'primary.main', color: '#fff', fontSize: '0.75rem' }}>
                                    {(option.name || 'F')[0]?.toUpperCase()}
                                  </Avatar>
                                }
                                label={`${option.name || 'Faculty'} ${option.empId ? `(${option.empId})` : ''}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ borderRadius: '8px', fontWeight: 600 }}
                                {...getTagProps({ index })}
                              />
                            ))
                          }
                        />
                      </Box>
                    </Grid>

                    {/* Student Coordinators Sub-section */}
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ p: 2.5, borderRadius: '14px', bgcolor: 'var(--bg-accent-1, #f8fafc)', border: '1px solid var(--border-color)' }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <SchoolIcon color="primary" fontSize="small" />
                          <Typography variant="subtitle1" fontWeight={700}>
                            Student Coordinators
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                          Add student coordinators by selecting or typing their university roll number.
                        </Typography>

                        <Box display="flex" gap={2} alignItems="flex-start" flexWrap={{ xs: 'wrap', sm: 'nowrap' }}>
                          <TextField
                            fullWidth
                            label="Student Roll Number"
                            placeholder="e.g. 21A91A0501"
                            value={studentRollNoInput}
                            onChange={(e) => {
                              setStudentRollNoInput(e.target.value.toUpperCase());
                              if (studentError) setStudentError('');
                            }}
                            error={!!studentError}
                            helperText={studentError || 'Type roll number and click Add Student (or press Enter)'}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddStudentCoordinator();
                              }
                            }}
                            slotProps={{ input: { sx: { borderRadius: '12px', bgcolor: 'var(--bg-paper)' } } }}
                          />
                          <Button
                            variant="contained"
                            onClick={handleAddStudentCoordinator}
                            disabled={isFetchingStudent || !studentRollNoInput.trim()}
                            sx={{
                              borderRadius: '12px',
                              px: 3.5,
                              py: 1.8,
                              fontWeight: 700,
                              textTransform: 'none',
                              whiteSpace: 'nowrap',
                              minWidth: '150px'
                            }}
                          >
                            {isFetchingStudent ? <CircularProgress size={22} color="inherit" /> : 'Add Student'}
                          </Button>
                        </Box>

                        {/* Selected Student Coordinators List */}
                        {studentCoordinators.length > 0 && (
                          <Box mt={2.5}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={1.5} display="block">
                              Assigned Student Coordinators ({studentCoordinators.length})
                            </Typography>
                            <Grid container spacing={2}>
                              {studentCoordinators.map((s) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={s.rollNo}>
                                  <Card
                                    variant="outlined"
                                    sx={{
                                      p: 1.5,
                                      borderRadius: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      bgcolor: 'var(--bg-paper)'
                                    }}
                                  >
                                    <Box display="flex" alignItems="center" gap={1.5} overflow="hidden">
                                      <Avatar sx={{ bgcolor: '#0284c7', width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700 }}>
                                        {(s.name || 'S')[0]?.toUpperCase()}
                                      </Avatar>
                                      <Box minWidth={0}>
                                        <Typography variant="body2" fontWeight={700} noWrap>
                                          {s.name}
                                        </Typography>
                                        <Typography variant="caption" color="primary" fontWeight={600} display="block">
                                          {s.rollNo}
                                        </Typography>
                                        {(s.branch || s.department) && (
                                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                                            {s.branch || s.department}
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleRemoveStudentCoordinator(s.rollNo)}
                                      title="Remove student coordinator"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Section 4: Schedule Timeline */}
              <Card elevation={0} sx={{ borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-paper)' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                    <ScheduleIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      4. Schedule & Deadlines
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        required
                        type="datetime-local"
                        label="Start Date & Time"
                        value={fromDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFromDate(val);
                          if (!regDeadline) setRegDeadline(val);
                          if (!toDate) setToDate(val);
                        }}
                        helperText="Event start date & time"
                        slotProps={{
                          inputLabel: { shrink: true },
                          input: { sx: { borderRadius: '12px' } }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        required
                        type="datetime-local"
                        label="End Date & Time"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        helperText="Event conclusion date & time"
                        slotProps={{
                          inputLabel: { shrink: true },
                          input: {
                            min: fromDate || undefined,
                            sx: { borderRadius: '12px' }
                          }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        required
                        type="datetime-local"
                        label="Registration Deadline"
                        value={regDeadline}
                        onChange={(e) => setRegDeadline(e.target.value)}
                        helperText="Last date & time for registrations"
                        slotProps={{
                          inputLabel: { shrink: true },
                          input: { sx: { borderRadius: '12px' } }
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Section 5: Participation, Fee & Capacity */}
              <Card elevation={0} sx={{ borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-paper)' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                    <PaymentsIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      5. Capacity, Fees & Participation Mode
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        required
                        type="number"
                        label="Registration Fee"
                        value={feeRupees}
                        onChange={(e) => setFeeRupees(e.target.value)}
                        slotProps={{
                          input: {
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                            sx: { borderRadius: '12px' }
                          }
                        }}
                        helperText="Enter 0 for Free Events"
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        required
                        type="number"
                        label="Seat Capacity"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        helperText="Max registrations allowed"
                        slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth required>
                        <InputLabel id="participation-label">Participation Type</InputLabel>
                        <Select
                          labelId="participation-label"
                          value={participationType}
                          label="Participation Type"
                          onChange={(e) => setParticipationType(e.target.value)}
                          sx={{ borderRadius: '12px' }}
                        >
                          <MenuItem value="SINGLE">Individual Only</MenuItem>
                          <MenuItem value="TEAM">Team Participation</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {participationType === 'TEAM' && (
                      <>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            required
                            type="number"
                            label="Min Team Size"
                            value={minTeamSize}
                            onChange={(e) => setMinTeamSize(e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            required
                            type="number"
                            label="Max Team Size"
                            value={maxTeamSize}
                            onChange={(e) => setMaxTeamSize(e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '12px' } } }}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              {/* Section 6: Media & Rules */}
              <Card elevation={0} sx={{ borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-paper)' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                    <UploadIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      6. Rules & Banner Image
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600} color="text.primary" sx={{ mb: 2 }}>
                          Rules & Guidelines (Add points / regulations for participants)
                        </Typography>

                        <Stack spacing={2}>
                          {rules.map((rule, index) => (
                            <Box
                              key={`rule-${index}`}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                width: '100%'
                              }}
                            >
                              <TextField
                                fullWidth
                                placeholder={`Rule / Regulation ${index + 1}`}
                                value={rule}
                                onChange={(e) => handleRuleChange(index, e.target.value)}
                                slotProps={{
                                  input: {
                                    sx: {
                                      borderRadius: '12px',
                                      bgcolor: 'var(--bg-paper)'
                                    }
                                  }
                                }}
                              />
                              <IconButton
                                aria-label="remove regulation"
                                onClick={() => removeRule(index)}
                                disabled={rules.length === 1 && !rule}
                                sx={{
                                  color: 'text.secondary',
                                  '&:hover': { color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.08)' },
                                  p: 1,
                                  flexShrink: 0
                                }}
                              >
                                <RemoveIcon />
                              </IconButton>
                            </Box>
                          ))}
                        </Stack>

                        <Box sx={{ mt: 2.5 }}>
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={addRule}
                            sx={{
                              bgcolor: '#0a192f',
                              '&:hover': { bgcolor: '#1e293b' },
                              color: '#ffffff',
                              borderRadius: '24px',
                              textTransform: 'none',
                              fontWeight: 700,
                              px: 3,
                              py: 1,
                              boxShadow: '0 2px 8px rgba(10, 25, 47, 0.25)'
                            }}
                          >
                            Add Rule / Regulation
                          </Button>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 1 }}>
                        Event Banner Image
                      </Typography>

                      <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<UploadIcon />}
                          disabled={uploadingBanner}
                          sx={{ borderRadius: '12px', px: 3, py: 1.2, textTransform: 'none', fontWeight: 600 }}
                        >
                          {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                          <input type="file" hidden accept="image/*" onChange={handleBannerUpload} />
                        </Button>

                        {banner && (
                          <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: '12px' }}>
                            <img
                              src={getImageUrl(banner)}
                              alt="Banner Preview"
                              style={{ width: 100, height: 60, objectFit: 'cover', borderRadius: 8, marginRight: 12 }}
                            />
                            <Box mr={2}>
                              <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
                                {banner.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Uploaded
                              </Typography>
                            </Box>
                            <IconButton color="error" onClick={() => setBanner(null)}>
                              <DeleteIcon />
                            </IconButton>
                          </Card>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Form Actions */}
              <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2} pt={2} pb={6}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/central-events')}
                  sx={{ borderRadius: '12px', px: 4, py: 1.2, textTransform: 'none', fontWeight: 600 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  size="large"
                  disabled={submitting}
                  startIcon={submitting ? null : <CheckCircleIcon />}
                  sx={{
                    borderRadius: '12px',
                    px: 5,
                    py: 1.2,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                    boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.4)'
                  }}
                >
                  {submitting ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? 'Update Central Event' : 'Create Central Event')}
                </Button>
              </Box>
            </>
          )}

        </Stack>
      </form>
    </PageContainer>
  );
}
