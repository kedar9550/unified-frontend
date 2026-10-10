import API from './axios';

export const getEventTypes = async () => {
  const response = await API.get('/api/central-event-types');
  return response.data;
};

export const getAllCentralEventTypesAdmin = async () => {
  const response = await API.get('/api/central-event-types/all');
  return response.data;
};

export const createCentralEventType = async (typeData) => {
  const response = await API.post('/api/central-event-types', typeData);
  return response.data;
};

export const updateCentralEventType = async (id, typeData) => {
  const response = await API.put(`/api/central-event-types/${id}`, typeData);
  return response.data;
};

export const deleteCentralEventType = async (id) => {
  const response = await API.delete(`/api/central-event-types/${id}`);
  return response.data;
};


export const getCategoriesByTypeCode = async (typeCode) => {
  const response = await API.get(`/api/central-event-types/${typeCode}/categories`);
  return response.data;
};

export const getAllCentralEventCategoriesAdmin = async (typeCode = '', academicYear = '') => {
  const params = new URLSearchParams();
  if (typeCode) params.append('typeCode', typeCode);
  if (academicYear) params.append('academicYear', academicYear);
  const queryString = params.toString();
  const response = await API.get(`/api/central-event-categories/admin${queryString ? `?${queryString}` : ''}`);
  return response.data;
};

export const createCentralEventCategory = async (catData) => {
  const response = await API.post('/api/central-event-categories', catData);
  return response.data;
};

export const updateCentralEventCategory = async (id, catData) => {
  const response = await API.put(`/api/central-event-categories/${id}`, catData);
  return response.data;
};

export const deleteCentralEventCategory = async (id) => {
  const response = await API.delete(`/api/central-event-categories/${id}`);
  return response.data;
};

export const getAllCentralEventSubcategoriesAdmin = async (typeCode = '', academicYear = '', categoryId = '') => {
  const params = {};
  if (typeCode) params.typeCode = typeCode;
  if (academicYear) params.academicYear = academicYear;
  if (categoryId) params.categoryId = categoryId;
  const response = await API.get('/api/central-event-subcategories/admin', { params });
  return response.data;
};

export const createCentralEventSubcategory = async (subData) => {
  const response = await API.post('/api/central-event-subcategories', subData);
  return response.data;
};

export const updateCentralEventSubcategory = async (id, subData) => {
  const response = await API.put(`/api/central-event-subcategories/${id}`, subData);
  return response.data;
};

export const deleteCentralEventSubcategory = async (id) => {
  const response = await API.delete(`/api/central-event-subcategories/${id}`);
  return response.data;
};

export const getAcademicYears = async () => {
  const response = await API.get('/api/academic-years');
  return response.data;
};


export const getOrganizers = async (scope = '') => {
  const response = await API.get(`/api/organizers${scope ? `?scope=${scope}` : ''}`);
  return response.data;
};

export const getCentralEvents = async (params = {}) => {
  const response = await API.get('/api/central-events', { params });
  return response.data;
};

export const getCentralEventBySlug = async (slug) => {
  const response = await API.get(`/api/central-events/${slug}`);
  return response.data;
};

export const createCentralEvent = async (eventData) => {
  const response = await API.post('/api/central-events', eventData);
  return response.data;
};

export const updateCentralEvent = async (id, eventData) => {
  const response = await API.put(`/api/central-events/${id}`, eventData);
  return response.data;
};

export const publishCentralEvent = async (id) => {
  const response = await API.patch(`/api/central-events/${id}/publish`);
  return response.data;
};

export const cancelCentralEvent = async (id) => {
  const response = await API.patch(`/api/central-events/${id}/cancel`);
  return response.data;
};

export const uploadCentralEventFile = async (file, options = {}) => {
  const formData = new FormData();
  formData.append('file', file);

  const params = {};
  if (typeof options === 'string') {
    params.folderType = options;
  } else if (options && typeof options === 'object') {
    if (options.folderType) params.folderType = options.folderType;
    if (options.type) params.folderType = options.type;
    if (options.academicYear) params.academicYear = options.academicYear;
  }

  const response = await API.post('/api/central-events/upload', formData, { params });
  return response.data;
};

export const registerCentralEvent = async (eventId, registrationData = {}) => {
  const response = await API.post(`/api/central-events/${eventId}/register`, registrationData);
  return response.data;
};

export const getMyRegistrations = async () => {
  const response = await API.get('/api/central-event-registrations/my');
  return response.data;
};

export const getRegistrationById = async (id) => {
  const response = await API.get(`/api/central-event-registrations/${id}`);
  return response.data;
};

export const getPaymentSession = async (token) => {
  const response = await API.get(`/api/payments/session/${token}`);
  return response.data;
};

const sanitizeDept = (dept) => {
  if (!dept) return '';
  if (typeof dept === 'object') {
    return dept.name || dept.code || '';
  }
  const str = String(dept).trim();
  if (/^[0-9a-fA-F]{24}$/.test(str)) {
    return ''; // Exclude raw 24-character hex ObjectIds
  }
  return str;
};

export const getEmployeeByEmpId = async (empId) => {
  const code = (empId || '').trim();
  if (!code) return { success: false, message: 'Employee code required' };

  // Strategy 1: Direct by-empid
  try {
    const res = await API.get(`/api/employees/by-empid/${encodeURIComponent(code)}`);
    if (res.data?.success && res.data?.data) {
      const d = res.data.data;
      const cleanDept = sanitizeDept(d.department) || sanitizeDept(d.coreDepartment) || '';
      return {
        success: true,
        data: {
          ...d,
          department: cleanDept
        }
      };
    }
  } catch (err) {
    // Continue
  }

  // Strategy 2: Employee search query
  try {
    const res = await API.get(`/api/employees/search?query=${encodeURIComponent(code)}`);
    const users = res.data?.data || res.data || [];
    if (Array.isArray(users) && users.length > 0) {
      const match = users.find(u => (u.institutionId || u.empId || '').toLowerCase() === code.toLowerCase()) || users[0];
      const cleanDept = sanitizeDept(match.department) || sanitizeDept(match.coreDepartment) || sanitizeDept(match.DEPT_NAME) || '';
      return {
        success: true,
        data: {
          _id: match._id,
          name: match.name || match.EMP_NAME,
          institutionId: match.institutionId || match.empId || code,
          designation: match.designation || match.DESIGNATION || '',
          department: cleanDept,
          phone: match.phone || match.MOBILE || '',
          email: match.email || match.EMAIL || ''
        }
      };
    }
  } catch (err) {
    // Continue
  }

  // Strategy 3: ECAP staff lookup
  try {
    const res = await API.get(`/api/employees/staff/${encodeURIComponent(code)}`);
    const staff = res.data?.data || res.data;
    if (staff && (staff.EMP_NAME || staff.name)) {
      const cleanDept = sanitizeDept(staff.DEPT_NAME || staff.department || staff.DepartmentName);
      return {
        success: true,
        data: {
          name: staff.EMP_NAME || staff.name,
          institutionId: staff.EMP_ID || staff.institutionId || code,
          designation: staff.DESIGNATION || staff.designation || '',
          department: cleanDept,
          phone: staff.MOBILE || staff.phone || '',
          email: staff.EMAIL || staff.email || ''
        }
      };
    }
  } catch (err) {
    // All strategies failed
  }

  return { success: false, message: 'Employee data not found' };
};


export const verifyPaymentSignature = async (verificationData) => {
  const response = await API.post('/api/payments/verify', verificationData);
  return response.data;
};
