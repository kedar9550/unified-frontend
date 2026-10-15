import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Paper,
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Globe,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Trash2,
  Copy as DuplicateIcon,
  ChevronUp,
  ChevronDown,
  Settings as SettingsIcon,
  Sliders,
  Layers,
  Search,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  FileCheck,
  FolderOpen
} from 'lucide-react';
import { toast } from 'sonner';
import API from '../../api/axios';
import { FIELD_TYPES, createNewField, generateFieldKey } from './fieldDefinitions';

export default function DynamicFormBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Builder State
  const [formId, setFormId] = useState(id || null);
  const [title, setTitle] = useState('Untitled Dynamic Form');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState('draft');
  const [fields, setFields] = useState([]);
  const [sections, setSections] = useState([]);
  const [settings, setSettings] = useState({
    submitButtonText: 'Submit Response',
    successMessage: 'Thank you! Your response has been submitted successfully.',
    allowMultipleSubmissions: true,
    isPublic: true,
    layout: 'two-column', // 'single-column' | 'two-column'
    startDate: '',
    endDate: ''
  });

  // UI State
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [rightPanelTab, setRightPanelTab] = useState(0); // 0 = Field Properties, 1 = Form Settings
  const [fieldSearch, setFieldSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Drag and Drop State
  const canvasRef = useRef(null);
  const [draggedItem, setDraggedItem] = useState(null); // { type: 'new' | 'existing', fieldType?: string, fieldIndex?: number }
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Auto-generate slug from title if slug not modified manually
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (!slugManuallyEdited && title) {
      const generated = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  }, [title, slugManuallyEdited]);

  // Load existing form if editing
  useEffect(() => {
    if (id) {
      loadFormData(id);
    } else {
      // Default initial field for brand new form
      const initialField = createNewField('text', []);
      initialField.label = 'Full Name';
      initialField.required = true;
      initialField.placeholder = 'Enter candidate full name';
      setFields([initialField]);
      setSelectedFieldId(initialField.id);
    }
  }, [id]);

  const loadFormData = async (formIdentifier) => {
    try {
      setLoading(true);
      const res = await API.get(`/api/forms/${formIdentifier}`);
      if (res.data?.success && res.data.data) {
        const f = res.data.data;
        setFormId(f._id);
        setTitle(f.title || '');
        setDescription(f.description || '');
        setSlug(f.slug || '');
        setSlugManuallyEdited(true);
        setStatus(f.status || 'draft');
        setFields(Array.isArray(f.fields) ? f.fields : []);
        setSections(Array.isArray(f.sections) ? f.sections : []);
        setSettings({
          submitButtonText: f.settings?.submitButtonText || 'Submit Response',
          successMessage: f.settings?.successMessage || 'Thank you! Your response has been submitted successfully.',
          allowMultipleSubmissions: f.settings?.allowMultipleSubmissions ?? true,
          isPublic: f.settings?.isPublic ?? true,
          layout: f.settings?.layout || 'two-column',
          startDate: f.settings?.startDate ? f.settings.startDate.substring(0, 10) : '',
          endDate: f.settings?.endDate ? f.settings.endDate.substring(0, 10) : ''
        });
        if (f.fields && f.fields.length > 0) {
          setSelectedFieldId(f.fields[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load form:', err);
      toast.error('Failed to load form details');
    } finally {
      setLoading(false);
    }
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  // Field manipulation functions
  const addField = (fieldType, atIndex = null) => {
    const newField = createNewField(fieldType, fields);
    const updated = [...fields];
    if (atIndex !== null && atIndex >= 0 && atIndex <= updated.length) {
      updated.splice(atIndex, 0, newField);
    } else {
      updated.push(newField);
    }
    setFields(updated);
    setSelectedFieldId(newField.id);
    setRightPanelTab(0);
    toast.success(`Added ${newField.label}`);

    setTimeout(() => {
      if (canvasRef.current && atIndex === null) {
        canvasRef.current.scrollTo({
          top: canvasRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 60);
  };

  const updateFieldProperty = (fieldId, key, value) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId) return f;
        return { ...f, [key]: value };
      })
    );
  };

  const updateFieldValidation = (fieldId, validationKey, value) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId) return f;
        return {
          ...f,
          validation: {
            ...(f.validation || {}),
            [validationKey]: value
          }
        };
      })
    );
  };

  const duplicateField = (fieldId) => {
    const idx = fields.findIndex((f) => f.id === fieldId);
    if (idx === -1) return;
    const original = fields[idx];
    const existingKeys = fields.map((f) => f.name);
    const cloned = JSON.parse(JSON.stringify(original));
    cloned.id = 'fld_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    cloned.label = `${original.label} (Copy)`;
    cloned.name = generateFieldKey(cloned.label, existingKeys);

    const updated = [...fields];
    updated.splice(idx + 1, 0, cloned);
    setFields(updated);
    setSelectedFieldId(cloned.id);
    toast.success('Field duplicated');
  };

  const deleteField = (fieldId) => {
    const updated = fields.filter((f) => f.id !== fieldId);
    setFields(updated);
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(updated.length > 0 ? updated[0].id : null);
    }
    toast.info('Field removed');
  };

  const moveField = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= fields.length) return;
    const updated = [...fields];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setFields(updated);
  };

  // Drag and Drop handlers
  const handleDragStartFromPalette = (e, fieldType) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'new', fieldType }));
    setDraggedItem({ type: 'new', fieldType });
  };

  const handleDragStartFromCanvas = (e, fieldIndex) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'existing', fieldIndex }));
    setDraggedItem({ type: 'existing', fieldIndex });
  };

  const handleCanvasDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);

    // Auto-scroll middle canvas smoothly when dragging near top or bottom boundaries
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseY = e.clientY;
      const threshold = 80;

      if (mouseY - rect.top < threshold && mouseY - rect.top >= 0) {
        canvasRef.current.scrollTop -= 16;
      } else if (rect.bottom - mouseY < threshold && rect.bottom - mouseY >= 0) {
        canvasRef.current.scrollTop += 16;
      }
    }
  };

  const handleCanvasDrop = (e, targetIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    try {
      const raw = e.dataTransfer.getData('text/plain');
      if (!raw) return;
      const data = JSON.parse(raw);

      if (data.type === 'new' && data.fieldType) {
        addField(data.fieldType, targetIndex);
      } else if (data.type === 'existing' && typeof data.fieldIndex === 'number') {
        const fromIdx = data.fieldIndex;
        if (fromIdx !== targetIndex) {
          moveField(fromIdx, targetIndex);
        }
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
    setDraggedItem(null);
  };

  // Save Form Handler
  const handleSave = async (desiredStatus = 'draft') => {
    if (!title.trim()) {
      toast.error('Please enter a Form Title');
      return false;
    }

    if (fields.length === 0) {
      toast.error('Please add at least one field to the form');
      return false;
    }

    // Check for duplicate field names / keys
    const names = fields.map((f) => f.name.trim());
    const duplicates = names.filter((name, idx) => names.indexOf(name) !== idx);
    if (duplicates.length > 0) {
      toast.error(`Duplicate field key detected: "${duplicates[0]}". Field keys must be unique.`);
      return false;
    }

    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        slug: slug.trim(),
        fields,
        sections,
        settings,
        status: desiredStatus
      };

      let response;
      if (formId) {
        response = await API.put(`/api/forms/${formId}`, payload);
      } else {
        response = await API.post('/api/forms', payload);
      }

      if (response.data?.success && response.data.data) {
        const saved = response.data.data;
        setFormId(saved._id);
        setStatus(saved.status);
        setSlug(saved.slug);

        if (desiredStatus === 'published') {
          setPublishedSlug(saved.slug);
          setPublishModalOpen(true);
          toast.success('Form published successfully!');
        } else {
          toast.success('Form draft saved successfully!');
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Save failed:', err);
      const msg = err.response?.data?.message || 'Failed to save form. Please try again.';
      toast.error(msg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Publish and Unpublish
  const handlePublish = async () => {
    await handleSave('published');
  };

  const handleUnpublish = async () => {
    if (!formId) return;
    try {
      setSaving(true);
      const res = await API.post(`/api/forms/${formId}/unpublish`);
      if (res.data?.success) {
        setStatus('draft');
        toast.success('Form unpublished. Public submissions are now closed.');
      }
    } catch (err) {
      console.error('Unpublish error:', err);
      toast.error(err.response?.data?.message || 'Failed to unpublish form');
    } finally {
      setSaving(false);
    }
  };

  const getPublicUrl = (formSlug) => {
    const host = window.location.origin;
    return `${host}/forms/${formSlug || slug}`;
  };

  const copyPublicLink = () => {
    const url = getPublicUrl(publishedSlug || slug);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success('Public form link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Filtered available fields
  const filteredFieldTypes = FIELD_TYPES.filter((f) =>
    f.label.toLowerCase().includes(fieldSearch.toLowerCase()) ||
    f.category.toLowerCase().includes(fieldSearch.toLowerCase())
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: { xs: 'calc(100dvh - 180px)', md: 'calc(100dvh - 225px)' },
        maxHeight: { xs: 'calc(100dvh - 180px)', md: 'calc(100dvh - 225px)' },
        minHeight: '520px',
        bgcolor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid var(--border-color, #e2e8f0)',
        boxShadow: 'var(--shadow-premium)',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* ============================================================ */}
      {/* TOP ACTION BAR                                                */}
      {/* ============================================================ */}
      <Box
        sx={{
          px: 3,
          py: 1.5,
          bgcolor: '#ffffff',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        {/* Left: Back & Title info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => navigate('/central-events/activities/forms')}
            size="small"
            sx={{
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              color: '#004e92',
              '&:hover': { bgcolor: '#eef2ff' }
            }}
          >
            <ArrowLeft size={18} />
          </IconButton>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.15rem' }}>
                {title || 'Untitled Form'}
              </Typography>
              <Chip
                label={status === 'published' ? 'Published' : 'Draft'}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  bgcolor: status === 'published' ? '#dcfce7' : '#f1f5f9',
                  color: status === 'published' ? '#15803d' : '#475569',
                  border: `1px solid ${status === 'published' ? '#bbf7d0' : '#cbd5e1'}`
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Slug: <strong style={{ color: '#004e92' }}>/forms/{slug || 'untitled'}</strong>
            </Typography>
          </Box>
        </Box>

        {/* Right: Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {status === 'published' && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Copy size={16} />}
              onClick={copyPublicLink}
              sx={{
                borderRadius: '9px',
                borderColor: '#cbd5e1',
                color: '#334155',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              {copiedLink ? 'Copied!' : 'Copy Link'}
            </Button>
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={<Eye size={16} />}
            onClick={() => setPreviewOpen(true)}
            sx={{
              borderRadius: '9px',
              borderColor: '#cbd5e1',
              color: '#334155',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' }
            }}
          >
            Preview
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Save size={16} />}
            disabled={saving}
            onClick={() => handleSave(status)}
            sx={{
              borderRadius: '9px',
              borderColor: '#004e92',
              color: '#004e92',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              '&:hover': { bgcolor: '#eff6ff' }
            }}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>

          {status === 'published' ? (
            <Button
              variant="outlined"
              size="small"
              color="error"
              disabled={saving}
              onClick={handleUnpublish}
              sx={{
                borderRadius: '9px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              Unpublish
            </Button>
          ) : (
            <Button
              variant="contained"
              size="small"
              startIcon={<Send size={16} />}
              disabled={saving}
              onClick={handlePublish}
              sx={{
                borderRadius: '9px',
                bgcolor: '#004e92',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                boxShadow: '0 4px 12px rgba(0, 78, 146, 0.25)',
                '&:hover': { bgcolor: '#003a6d' }
              }}
            >
              Publish Form
            </Button>
          )}
        </Box>
      </Box>

      {/* ============================================================ */}
      {/* 3-PANEL BUILDER BODY                                          */}
      {/* ============================================================ */}
      <Box sx={{ display: 'flex', flexGrow: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}>
        {/* ========================================================== */}
        {/* LEFT PANEL: Available Form Fields Palette                   */}
        {/* ========================================================== */}
        <Box
          sx={{
            width: '280px',
            bgcolor: '#ffffff',
            borderRight: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            minHeight: 0,
            height: '100%',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Layers size={16} color="#004e92" />
              Available Form Fields
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
              Drag onto the canvas or click (+) to add.
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Search fields..."
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search size={15} color="#94a3b8" style={{ marginRight: 8 }} />
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  bgcolor: '#f8fafc',
                  fontSize: '0.85rem'
                }
              }}
            />
          </Box>

          {/* Palette Items List */}
          <Box
            sx={{
              flexGrow: 1,
              minHeight: 0,
              overflowY: 'auto',
              p: 1.5,
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { bgcolor: '#f8fafc' },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: '4px' }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {filteredFieldTypes.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Box
                    key={item.type}
                    draggable
                    onDragStart={(e) => handleDragStartFromPalette(e, item.type)}
                    sx={{
                      p: 1.25,
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      bgcolor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'grab',
                      transition: 'all 0.18s ease-in-out',
                      '&:hover': {
                        borderColor: '#004e92',
                        bgcolor: '#f8fafc',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 3px 8px rgba(0, 78, 146, 0.08)'
                      },
                      '&:active': {
                        cursor: 'grabbing'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          bgcolor: '#f1f5f9',
                          color: '#004e92',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <IconComponent size={16} />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem', lineHeight: 1.2 }}>
                          {item.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                          {item.category}
                        </Typography>
                      </Box>
                    </Box>

                    <Tooltip title="Click to add to bottom">
                      <IconButton
                        size="small"
                        onClick={() => addField(item.type)}
                        sx={{
                          color: '#64748b',
                          p: 0.5,
                          '&:hover': { color: '#004e92', bgcolor: '#eef2ff' }
                        }}
                      >
                        <Plus size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* ========================================================== */}
        {/* CENTER PANEL: Form Canvas                                   */}
        {/* ========================================================== */}
        <Box
          ref={canvasRef}
          sx={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#f1f5f9',
            overflowY: 'auto',
            overflowX: 'hidden',
            p: { xs: 2, md: 3 },
            scrollBehavior: 'smooth',
            '&::-webkit-scrollbar': {
              width: '10px'
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: '#e2e8f0',
              borderRadius: '8px'
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: '#94a3b8',
              borderRadius: '8px',
              border: '2px solid #e2e8f0',
              '&:hover': {
                bgcolor: '#64748b'
              }
            }
          }}
          onDragOver={(e) => handleCanvasDragOver(e, fields.length)}
          onDrop={(e) => handleCanvasDrop(e, fields.length)}
        >
          {/* Main Form Paper */}
          <Paper
            elevation={0}
            sx={{
              maxWidth: '920px',
              width: '100%',
              mx: 'auto',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              overflow: 'visible',
              mb: 5
            }}
          >
            {/* Form Title & Description Header */}
            <Box
              sx={{
                p: 3,
                borderBottom: '1px solid #f1f5f9',
                background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'
              }}
            >
              <TextField
                variant="standard"
                fullWidth
                placeholder="Form Title (e.g. Student Registration 2026)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                InputProps={{
                  disableUnderline: true,
                  style: {
                    fontSize: '1.45rem',
                    fontWeight: 700,
                    color: '#0f172a'
                  }
                }}
              />
              <TextField
                variant="standard"
                fullWidth
                multiline
                rows={2}
                placeholder="Add a brief description or instructions for respondents..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                InputProps={{
                  disableUnderline: true,
                  style: {
                    fontSize: '0.9rem',
                    color: '#64748b',
                    marginTop: 8
                  }
                }}
              />
            </Box>

            {/* Drop Zone & Fields Grid */}
            <Box sx={{ p: 3 }}>
              {fields.length === 0 ? (
                // Empty State
                <Box
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '16px',
                    bgcolor: '#f8fafc'
                  }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      mx: 'auto',
                      mb: 2,
                      borderRadius: '50%',
                      bgcolor: '#eef2ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#004e92'
                    }}
                  >
                    <Sliders size={26} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                    Your form canvas is empty
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', maxWidth: '420px', mx: 'auto', mb: 2.5 }}>
                    Drag fields from the left panel onto this canvas, or click on any field to add it to your form.
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Plus size={16} />}
                    onClick={() => addField('text')}
                    sx={{
                      borderRadius: '10px',
                      bgcolor: '#004e92',
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Add Text Input
                  </Button>
                </Box>
              ) : (
                // Form Fields Grid
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: settings.layout === 'two-column' ? { xs: '1fr', md: '1fr 1fr' } : '1fr',
                    gap: 2.5
                  }}
                >
                  {fields.map((field, idx) => {
                    const isSelected = field.id === selectedFieldId;
                    const isOver = dragOverIndex === idx;
                    const isFullWidth = field.colSpan === 2 || ['textarea', 'file', 'heading', 'paragraph', 'divider', 'checkbox', 'radio'].includes(field.type);

                    return (
                      <Box
                        key={field.id}
                        draggable
                        onDragStart={(e) => handleDragStartFromCanvas(e, idx)}
                        onDragOver={(e) => handleCanvasDragOver(e, idx)}
                        onDrop={(e) => handleCanvasDrop(e, idx)}
                        onClick={() => {
                          setSelectedFieldId(field.id);
                          setRightPanelTab(0);
                        }}
                        sx={{
                          gridColumn: isFullWidth && settings.layout === 'two-column' ? 'span 2' : 'span 1',
                          p: 2,
                          borderRadius: '14px',
                          border: isSelected ? '2px solid #004e92' : '1px solid #e2e8f0',
                          bgcolor: isSelected ? '#fafcff' : '#ffffff',
                          boxShadow: isSelected ? '0 4px 16px rgba(0, 78, 146, 0.12)' : '0 1px 3px rgba(0,0,0,0.02)',
                          transition: 'all 0.15s ease',
                          cursor: 'pointer',
                          position: 'relative',
                          '&:hover': {
                            borderColor: isSelected ? '#004e92' : '#cbd5e1',
                            bgcolor: isSelected ? '#fafcff' : '#fcfdfd'
                          },
                          ...(isOver && {
                            borderTop: '3px solid #004e92'
                          })
                        }}
                      >
                        {/* Top Header of Field Card */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={field.type}
                              size="small"
                              sx={{
                                height: '20px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                bgcolor: '#eef2ff',
                                color: '#004e92'
                              }}
                            />
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                              [{field.name}]
                            </Typography>
                          </Box>

                          {/* Toolbar actions */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                            <Tooltip title="Move Up">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={idx === 0}
                                  onClick={() => moveField(idx, idx - 1)}
                                  sx={{ p: 0.5, color: '#64748b' }}
                                >
                                  <ChevronUp size={15} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Move Down">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={idx === fields.length - 1}
                                  onClick={() => moveField(idx, idx + 1)}
                                  sx={{ p: 0.5, color: '#64748b' }}
                                >
                                  <ChevronDown size={15} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Duplicate Field">
                              <IconButton
                                size="small"
                                onClick={() => duplicateField(field.id)}
                                sx={{ p: 0.5, color: '#64748b' }}
                              >
                                <DuplicateIcon size={15} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Field">
                              <IconButton
                                size="small"
                                onClick={() => deleteField(field.id)}
                                sx={{ p: 0.5, color: '#ef4444' }}
                              >
                                <Trash2 size={15} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>

                        {/* Field Canvas Visual Preview */}
                        <RenderCanvasFieldPreview field={field} />
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Bottom Submit Button Preview */}
              {fields.length > 0 && (
                <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    disabled
                    sx={{
                      borderRadius: '10px',
                      bgcolor: '#004e92 !important',
                      color: '#ffffff !important',
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 3,
                      py: 1
                    }}
                  >
                    {settings.submitButtonText || 'Submit Response'}
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>

        {/* ========================================================== */}
        {/* RIGHT PANEL: Field Properties & Form Settings Inspector    */}
        {/* ========================================================== */}
        <Box
          sx={{
            width: '340px',
            bgcolor: '#ffffff',
            borderLeft: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            minHeight: 0,
            height: '100%',
            overflow: 'hidden'
          }}
        >
          {/* Tabs */}
          <Tabs
            value={rightPanelTab}
            onChange={(e, val) => setRightPanelTab(val)}
            variant="fullWidth"
            sx={{
              borderBottom: '1px solid #e2e8f0',
              minHeight: '44px',
              '& .MuiTab-root': {
                minHeight: '44px',
                fontSize: '0.82rem',
                fontWeight: 700,
                textTransform: 'none',
                color: '#64748b'
              },
              '& .Mui-selected': {
                color: '#004e92'
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#004e92'
              }
            }}
          >
            <Tab icon={<Sliders size={15} style={{ marginRight: 6 }} />} iconPosition="start" label="Field Properties" />
            <Tab icon={<SettingsIcon size={15} style={{ marginRight: 6 }} />} iconPosition="start" label="Form Settings" />
          </Tabs>

          {/* Tab Content */}
          <Box
            sx={{
              flexGrow: 1,
              minHeight: 0,
              overflowY: 'auto',
              p: 2,
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { bgcolor: '#f8fafc' },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: '4px' }
            }}
          >
            {rightPanelTab === 0 ? (
              // TAB 0: Field Properties
              selectedField ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ pb: 1, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      Configure {selectedField.type.toUpperCase()}
                    </Typography>
                    <Chip label={`ID: ${selectedField.id}`} size="small" sx={{ fontSize: '0.65rem' }} />
                  </Box>

                  {/* Label */}
                  <TextField
                    size="small"
                    label="Field Label"
                    fullWidth
                    value={selectedField.label || ''}
                    onChange={(e) => updateFieldProperty(selectedField.id, 'label', e.target.value)}
                  />

                  {/* Unique Key */}
                  <TextField
                    size="small"
                    label="Field Key / Name"
                    helperText="Unique identifier in response data"
                    fullWidth
                    value={selectedField.name || ''}
                    onChange={(e) => {
                      const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                      updateFieldProperty(selectedField.id, 'name', clean);
                    }}
                  />

                  {/* Placeholder (if applicable) */}
                  {!['heading', 'paragraph', 'divider', 'file', 'yes_no'].includes(selectedField.type) && (
                    <TextField
                      size="small"
                      label="Placeholder"
                      fullWidth
                      value={selectedField.placeholder || ''}
                      onChange={(e) => updateFieldProperty(selectedField.id, 'placeholder', e.target.value)}
                    />
                  )}

                  {/* Help Text / Hint */}
                  <TextField
                    size="small"
                    label="Help Text / Hint"
                    multiline
                    rows={2}
                    fullWidth
                    value={selectedField.helpText || ''}
                    onChange={(e) => updateFieldProperty(selectedField.id, 'helpText', e.target.value)}
                  />

                  {/* Paragraph Content (for paragraph type) */}
                  {selectedField.type === 'paragraph' && (
                    <TextField
                      size="small"
                      label="Paragraph Content"
                      multiline
                      rows={4}
                      fullWidth
                      value={selectedField.content || ''}
                      onChange={(e) => updateFieldProperty(selectedField.id, 'content', e.target.value)}
                    />
                  )}

                  {/* Default Value */}
                  {!['heading', 'paragraph', 'divider', 'file'].includes(selectedField.type) && (
                    <TextField
                      size="small"
                      label="Default Value"
                      fullWidth
                      value={typeof selectedField.defaultValue === 'object' ? '' : selectedField.defaultValue || ''}
                      onChange={(e) => updateFieldProperty(selectedField.id, 'defaultValue', e.target.value)}
                    />
                  )}

                  {/* Column Width */}
                  <FormControl size="small" fullWidth>
                    <InputLabel>Column Width</InputLabel>
                    <Select
                      value={selectedField.colSpan || 1}
                      label="Column Width"
                      onChange={(e) => updateFieldProperty(selectedField.id, 'colSpan', Number(e.target.value))}
                    >
                      <MenuItem value={1}>Half Width (1 Column)</MenuItem>
                      <MenuItem value={2}>Full Width (2 Columns)</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Toggles: Required, Read Only, Hidden */}
                  {!['heading', 'paragraph', 'divider'].includes(selectedField.type) && (
                    <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={!!selectedField.required}
                            onChange={(e) => updateFieldProperty(selectedField.id, 'required', e.target.checked)}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Required Field</Typography>}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={!!selectedField.readOnly}
                            onChange={(e) => updateFieldProperty(selectedField.id, 'readOnly', e.target.checked)}
                          />
                        }
                        label={<Typography variant="body2">Read Only</Typography>}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={!!selectedField.hidden}
                            onChange={(e) => updateFieldProperty(selectedField.id, 'hidden', e.target.checked)}
                          />
                        }
                        label={<Typography variant="body2">Hidden Field</Typography>}
                      />
                    </Box>
                  )}

                  {/* Options Manager (for dropdown, radio, checkbox) */}
                  {['dropdown', 'radio', 'checkbox'].includes(selectedField.type) && (
                    <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Field Options ({selectedField.options?.length || 0})
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<Plus size={14} />}
                          onClick={() => {
                            const current = selectedField.options || [];
                            const newOption = {
                              label: `Option ${current.length + 1}`,
                              value: `option_${current.length + 1}`
                            };
                            updateFieldProperty(selectedField.id, 'options', [...current, newOption]);
                          }}
                          sx={{ textTransform: 'none', fontSize: '0.75rem', p: 0.5 }}
                        >
                          Add Option
                        </Button>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {(selectedField.options || []).map((opt, optIdx) => (
                          <Box key={optIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              size="small"
                              placeholder="Label"
                              value={opt.label}
                              onChange={(e) => {
                                const updatedOpts = [...selectedField.options];
                                updatedOpts[optIdx] = { ...opt, label: e.target.value };
                                updateFieldProperty(selectedField.id, 'options', updatedOpts);
                              }}
                              sx={{ flex: 1 }}
                            />
                            <TextField
                              size="small"
                              placeholder="Value"
                              value={opt.value}
                              onChange={(e) => {
                                const updatedOpts = [...selectedField.options];
                                updatedOpts[optIdx] = { ...opt, value: e.target.value };
                                updateFieldProperty(selectedField.id, 'options', updatedOpts);
                              }}
                              sx={{ flex: 1 }}
                            />
                            <IconButton
                              size="small"
                              disabled={selectedField.options.length <= 1}
                              onClick={() => {
                                const updatedOpts = selectedField.options.filter((_, i) => i !== optIdx);
                                updateFieldProperty(selectedField.id, 'options', updatedOpts);
                              }}
                              sx={{ color: '#ef4444' }}
                            >
                              <Trash2 size={14} />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* File Upload Settings */}
                  {selectedField.type === 'file' && (
                    <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        File Upload Limits
                      </Typography>
                      <TextField
                        size="small"
                        label="Accepted Extensions"
                        helperText="Comma separated, e.g. .pdf,.png,.jpg"
                        value={selectedField.validation?.allowedFileTypes || '.pdf,.jpg,.png'}
                        onChange={(e) => updateFieldValidation(selectedField.id, 'allowedFileTypes', e.target.value)}
                      />
                      <TextField
                        size="small"
                        type="number"
                        label="Max File Size (MB)"
                        value={selectedField.validation?.maxFileSizeMB || 10}
                        onChange={(e) => updateFieldValidation(selectedField.id, 'maxFileSizeMB', Number(e.target.value))}
                      />
                    </Box>
                  )}

                  {/* Number Settings */}
                  {selectedField.type === 'number' && (
                    <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Number Range Validation
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          size="small"
                          type="number"
                          label="Min Number"
                          value={selectedField.validation?.minNumber ?? ''}
                          onChange={(e) => updateFieldValidation(selectedField.id, 'minNumber', e.target.value)}
                        />
                        <TextField
                          size="small"
                          type="number"
                          label="Max Number"
                          value={selectedField.validation?.maxNumber ?? ''}
                          onChange={(e) => updateFieldValidation(selectedField.id, 'maxNumber', e.target.value)}
                        />
                      </Box>
                    </Box>
                  )}

                  {/* Text Length Settings */}
                  {['text', 'textarea', 'password'].includes(selectedField.type) && (
                    <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Length Validation
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          size="small"
                          type="number"
                          label="Min Length"
                          value={selectedField.validation?.minLength ?? ''}
                          onChange={(e) => updateFieldValidation(selectedField.id, 'minLength', e.target.value)}
                        />
                        <TextField
                          size="small"
                          type="number"
                          label="Max Length"
                          value={selectedField.validation?.maxLength ?? ''}
                          onChange={(e) => updateFieldValidation(selectedField.id, 'maxLength', e.target.value)}
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                  <AlertCircle size={32} style={{ marginBottom: 8, opacity: 0.6 }} />
                  <Typography variant="body2">Select a field on the canvas to configure its properties.</Typography>
                </Box>
              )
            ) : (
              // TAB 1: Form Settings
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', pb: 1, borderBottom: '1px solid #f1f5f9' }}>
                  General Form Settings
                </Typography>

                <TextField
                  size="small"
                  label="Form Title"
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <TextField
                  size="small"
                  label="Form Slug (URL)"
                  fullWidth
                  helperText={`Public URL: /forms/${slug}`}
                  value={slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                  }}
                />

                <TextField
                  size="small"
                  label="Submit Button Text"
                  fullWidth
                  value={settings.submitButtonText}
                  onChange={(e) => setSettings({ ...settings, submitButtonText: e.target.value })}
                />

                <TextField
                  size="small"
                  label="Success Message"
                  multiline
                  rows={2}
                  fullWidth
                  value={settings.successMessage}
                  onChange={(e) => setSettings({ ...settings, successMessage: e.target.value })}
                />

                <FormControl size="small" fullWidth>
                  <InputLabel>Form Canvas Layout</InputLabel>
                  <Select
                    value={settings.layout}
                    label="Form Canvas Layout"
                    onChange={(e) => setSettings({ ...settings, layout: e.target.value })}
                  >
                    <MenuItem value="two-column">Two Columns (Responsive)</MenuItem>
                    <MenuItem value="single-column">Single Column (Centered)</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={settings.isPublic}
                        onChange={(e) => setSettings({ ...settings, isPublic: e.target.checked })}
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Publicly Accessible</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={settings.allowMultipleSubmissions}
                        onChange={(e) => setSettings({ ...settings, allowMultipleSubmissions: e.target.checked })}
                      />
                    }
                    label={<Typography variant="body2">Allow Multiple Submissions</Typography>}
                  />
                </Box>

                <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Scheduling / Validity (Optional)
                  </Typography>
                  <TextField
                    size="small"
                    type="date"
                    label="Start Date"
                    InputLabelProps={{ shrink: true }}
                    value={settings.startDate}
                    onChange={(e) => setSettings({ ...settings, startDate: e.target.value })}
                  />
                  <TextField
                    size="small"
                    type="date"
                    label="End Date"
                    InputLabelProps={{ shrink: true }}
                    value={settings.endDate}
                    onChange={(e) => setSettings({ ...settings, endDate: e.target.value })}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* ============================================================ */}
      {/* PUBLISHED SUCCESS MODAL                                       */}
      {/* ============================================================ */}
      <Dialog
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 42, height: 42, borderRadius: '50%', bgcolor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Form Published Successfully!
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Your form is now live and accepting public responses.
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', mb: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Public Form Link
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#004e92', wordBreak: 'break-all', mt: 0.5 }}>
              {getPublicUrl(publishedSlug)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Copy size={16} />}
              onClick={copyPublicLink}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
            >
              {copiedLink ? 'Copied to Clipboard!' : 'Copy Form Link'}
            </Button>
            <Button
              variant="contained"
              fullWidth
              startIcon={<ExternalLink size={16} />}
              component="a"
              href={`/forms/${publishedSlug}`}
              target="_blank"
              rel="noreferrer"
              sx={{ borderRadius: '10px', bgcolor: '#004e92', textTransform: 'none', fontWeight: 600 }}
            >
              Open Form
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPublishModalOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================ */}
      {/* LIVE PREVIEW MODAL                                            */}
      {/* ============================================================ */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1, bgcolor: '#f8fafc' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Eye size={20} color="#004e92" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Form Live Preview
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                This is how respondents will see your form. Submissions in preview are not saved.
              </Typography>
            </Box>
          </Box>
          <Chip label="PREVIEW MODE" size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#004e92', mb: 1 }}>
              {title || 'Untitled Form'}
            </Typography>
            {description && (
              <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
                {description}
              </Typography>
            )}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: settings.layout === 'two-column' ? { xs: '1fr', md: '1fr 1fr' } : '1fr',
                gap: 2.5
              }}
            >
              {fields.map((f) => (
                <Box
                  key={f.id}
                  sx={{
                    gridColumn: (f.colSpan === 2 || ['textarea', 'file', 'heading', 'paragraph', 'divider', 'checkbox', 'radio'].includes(f.type)) && settings.layout === 'two-column'
                      ? 'span 2'
                      : 'span 1'
                  }}
                >
                  <RenderPreviewInteractiveField field={f} />
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={() => toast.info('Preview submission simulated! (Data is not persisted in preview)')}
                sx={{
                  borderRadius: '10px',
                  bgcolor: '#004e92',
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 4,
                  py: 1
                }}
              >
                {settings.submitButtonText || 'Submit Response'}
              </Button>
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPreviewOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Close Preview
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// =========================================================================
// HELPER COMPONENT: Render Canvas Field Item                               
// =========================================================================
function RenderCanvasFieldPreview({ field }) {
  const { type, label, placeholder, helpText, required, options } = field;

  if (type === 'heading') {
    return (
      <Box sx={{ py: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#004e92' }}>
          {label}
        </Typography>
        {helpText && <Typography variant="caption" sx={{ color: '#64748b' }}>{helpText}</Typography>}
      </Box>
    );
  }

  if (type === 'paragraph') {
    return (
      <Box sx={{ py: 0.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#334155', mb: 0.5 }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', whiteSpace: 'pre-line' }}>
          {field.content || 'Paragraph text...'}
        </Typography>
      </Box>
    );
  }

  if (type === 'divider') {
    return (
      <Box sx={{ py: 1.5 }}>
        <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.75 }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </Typography>

      {/* Input representations */}
      {type === 'textarea' ? (
        <Box sx={{ p: 1.5, border: '1px solid #cbd5e1', borderRadius: '10px', bgcolor: '#f8fafc', color: '#94a3b8', fontSize: '0.85rem', height: 70 }}>
          {placeholder || 'Enter text...'}
        </Box>
      ) : type === 'dropdown' ? (
        <Box sx={{ p: 1.25, border: '1px solid #cbd5e1', borderRadius: '10px', bgcolor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>{placeholder || 'Select an option...'}</span>
          <span>▼</span>
        </Box>
      ) : type === 'radio' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {(options || []).map((opt, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475569', fontSize: '0.85rem' }}>
              <input type="radio" disabled />
              <span>{opt.label}</span>
            </Box>
          ))}
        </Box>
      ) : type === 'checkbox' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {(options || []).map((opt, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475569', fontSize: '0.85rem' }}>
              <input type="checkbox" disabled />
              <span>{opt.label}</span>
            </Box>
          ))}
        </Box>
      ) : type === 'yes_no' ? (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', color: '#475569' }}>
            <input type="radio" name={`yn_${field.id}`} disabled defaultChecked /> Yes
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', color: '#475569' }}>
            <input type="radio" name={`yn_${field.id}`} disabled /> No
          </label>
        </Box>
      ) : type === 'file' ? (
        <Box sx={{ p: 2, border: '2px dashed #cbd5e1', borderRadius: '10px', textAlign: 'center', bgcolor: '#f8fafc', color: '#64748b' }}>
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
            Click or drag file to upload
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Allowed formats: {field.validation?.allowedFileTypes || '.pdf,.jpg,.png'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ p: 1.25, border: '1px solid #cbd5e1', borderRadius: '10px', bgcolor: '#f8fafc', color: '#94a3b8', fontSize: '0.85rem' }}>
          {placeholder || `Enter ${label}...`}
        </Box>
      )}

      {helpText && (
        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
          {helpText}
        </Typography>
      )}
    </Box>
  );
}

// =========================================================================
// HELPER COMPONENT: Render Preview Interactive Field                        
// =========================================================================
function RenderPreviewInteractiveField({ field }) {
  const { type, label, placeholder, helpText, required, options } = field;

  if (type === 'heading') {
    return (
      <Box sx={{ mt: 1, mb: 0.5, borderBottom: '2px solid #eef2ff', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#004e92' }}>
          {label}
        </Typography>
        {helpText && <Typography variant="caption" sx={{ color: '#64748b' }}>{helpText}</Typography>}
      </Box>
    );
  }

  if (type === 'paragraph') {
    return (
      <Box sx={{ py: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#334155' }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', whiteSpace: 'pre-line' }}>
          {field.content}
        </Typography>
      </Box>
    );
  }

  if (type === 'divider') {
    return <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '16px 0' }} />;
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.75 }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </Typography>

      {type === 'textarea' ? (
        <TextField
          multiline
          rows={3}
          fullWidth
          size="small"
          placeholder={placeholder}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />
      ) : type === 'dropdown' ? (
        <FormControl size="small" fullWidth>
          <Select defaultValue="" displayEmpty sx={{ borderRadius: '10px' }}>
            <MenuItem value="" disabled>
              <em>{placeholder || '-- Select an option --'}</em>
            </MenuItem>
            {(options || []).map((o, idx) => (
              <MenuItem key={idx} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : type === 'radio' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {(options || []).map((o, idx) => (
            <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="radio" name={`preview_${field.name}`} value={o.value} />
              {o.label}
            </label>
          ))}
        </Box>
      ) : type === 'checkbox' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {(options || []).map((o, idx) => (
            <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" name={`preview_${field.name}`} value={o.value} />
              {o.label}
            </label>
          ))}
        </Box>
      ) : type === 'yes_no' ? (
        <Box sx={{ display: 'flex', gap: 3 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="radio" name={`preview_yn_${field.name}`} value="yes" /> Yes
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="radio" name={`preview_yn_${field.name}`} value="no" defaultChecked /> No
          </label>
        </Box>
      ) : type === 'file' ? (
        <Box sx={{ p: 2, border: '2px dashed #cbd5e1', borderRadius: '10px', textAlign: 'center', bgcolor: '#f8fafc' }}>
          <input type="file" style={{ display: 'block', margin: '0 auto', fontSize: '0.85rem' }} />
        </Box>
      ) : (
        <TextField
          type={type === 'number' ? 'number' : type === 'date' ? 'date' : type === 'password' ? 'password' : 'text'}
          fullWidth
          size="small"
          placeholder={placeholder}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />
      )}

      {helpText && (
        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
          {helpText}
        </Typography>
      )}
    </Box>
  );
}
