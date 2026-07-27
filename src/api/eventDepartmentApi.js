import API from './axios';

const EVENT_DEPARTMENT_PATHS = [
  '/api/event-departments',
  '/api/eventdepartments',
  '/api/departments',
];

const isRetryableEventDeptError = (error) => {
  const status = error?.response?.status;
  return status === 401 || status === 404;
};

const buildUrl = (basePath, suffix) => `${basePath}${suffix}`;

export const tryEventDepartmentRequest = async (method, suffix = '', data = null, config = {}) => {
  let lastError;

  for (const basePath of EVENT_DEPARTMENT_PATHS) {
    try {
      const url = buildUrl(basePath, suffix);
      if (method === 'get' || method === 'delete') {
        return await API[method](url, config);
      }
      return await API[method](url, data, config);
    } catch (error) {
      if (!isRetryableEventDeptError(error)) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to fetch event departments.');
};

export const fetchEventDepartments = async () => tryEventDepartmentRequest('get');
export const createEventDepartment = async (payload) => tryEventDepartmentRequest('post', '', payload);
export const updateEventDepartment = async (id, payload) => tryEventDepartmentRequest('put', `/${id}`, payload);
export const deleteEventDepartment = async (id) => tryEventDepartmentRequest('delete', `/${id}`);
