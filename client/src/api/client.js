const BASE = '/api';

function getToken() {
  return localStorage.getItem('sheger_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(BASE + path, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  profile: () => request('/auth/profile'),

  // Dashboard
  dashboard: () => request('/dashboard'),

  // Construction
  phases: () => request('/construction/phases'),
  updatePhase: (id, data) => request(`/construction/phases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addMilestone: (data) => request('/construction/milestones', { method: 'POST', body: JSON.stringify(data) }),
  updateMilestone: (id, data) => request(`/construction/milestones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMilestone: (id) => request(`/construction/milestones/${id}`, { method: 'DELETE' }),
  uploadMilestonePhoto: (id, file) => {
    const fd = new FormData();
    fd.append('photo', file);
    return request(`/construction/milestones/${id}/photo`, { method: 'POST', body: fd });
  },

  // Finance
  budget: () => request('/finance/budget'),
  updateBudget: (category, allocated) => request(`/finance/budget/${category}`, { method: 'PUT', body: JSON.stringify({ allocated }) }),
  expenses: (params = '') => request(`/finance/expenses${params ? '?' + params : ''}`),
  addExpense: (data) => request('/finance/expenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (id) => request(`/finance/expenses/${id}`, { method: 'DELETE' }),
  financeSummary: () => request('/finance/summary'),

  // Sales
  apartments: () => request('/sales/apartments'),
  addApartment: (data) => request('/sales/apartments', { method: 'POST', body: JSON.stringify(data) }),
  updateApartment: (id, data) => request(`/sales/apartments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteApartment: (id) => request(`/sales/apartments/${id}`, { method: 'DELETE' }),
  sales: () => request('/sales'),
  addSale: (data) => request('/sales', { method: 'POST', body: JSON.stringify(data) }),
  addPayment: (saleId, data) => request(`/sales/${saleId}/payments`, { method: 'POST', body: JSON.stringify(data) }),

  // Documents
  documents: (folder = '') => request(`/documents${folder ? '?folder=' + folder : ''}`),
  uploadDocument: (title, folder, file) => {
    const fd = new FormData();
    fd.append('title', title);
    fd.append('folder', folder);
    fd.append('file', file);
    return request('/documents', { method: 'POST', body: fd });
  },
  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),

  // Contacts
  contacts: (role = '') => request(`/contacts${role ? '?role=' + role : ''}`),
  addContact: (data) => request('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: (id, data) => request(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),
};
