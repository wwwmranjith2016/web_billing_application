// Web API Service - Replaces Electron IPC for web deployment
const API_BASE_URL = import.meta.env.NODE_ENV === 'development'
  ? 'http://localhost:3001'
  : import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  // Handle BigInt serialization for POST/PUT requests
  if (options.method && (options.method.toUpperCase() === 'POST' || options.method.toUpperCase() === 'PUT') && options.body) {
    // Only stringify if body is not already a string
    if (typeof options.body !== 'string') {
      options = {
        ...options,
        body: JSON.stringify(options.body, (_key, value) => {
          // Convert BigInt to string for JSON serialization
          if (typeof value === 'bigint') {
            return value.toString();
          }
          return value;
        })
      };
    }
  }

  // Get auth token from localStorage if available
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Check if response is HTML (error page)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      const text = await response.text();
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        throw new Error('Authentication required. Please login again.');
      }
    }
    
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Products API
export const productsAPI = {
  getAll: () => fetchAPI('/api/products'),
  getById: (id: number) => fetchAPI(`/api/products/${id}`),
  create: (data: any) => fetchAPI('/api/products', { method: 'POST', body: data }),
  update: (id: number, data: any) => fetchAPI(`/api/products/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => fetchAPI(`/api/products/${id}`, { method: 'DELETE' }),
  search: (query: string) => fetchAPI(`/api/products/search/${query}`),
  findByBarcode: (barcode: string) => fetchAPI(`/api/products/barcode/${barcode}`),
};

// Bills API
export const billsAPI = {
  create: (data: any) => fetchAPI('/api/bills', { method: 'POST', body: data }),
  getAll: (filters?: { startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    return fetchAPI(`/api/bills?${params.toString()}`);
  },
  getById: (id: number) => fetchAPI(`/api/bills/${id}`),
  getToday: () => fetchAPI('/api/bills/today'),
  update: (id: number, data: any) => fetchAPI(`/api/bills/${id}`, { method: 'PUT', body: data }),
  search: (query: string) => fetchAPI(`/api/bills/search/${query}`),
};

// Returns API
export const returnsAPI = {
  create: (data: any) => fetchAPI('/api/returns', { method: 'POST', body: data }),
  getAll: (filters?: { startDate?: string; endDate?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.status) params.append('status', filters.status);
    return fetchAPI(`/api/returns?${params.toString()}`);
  },
  getById: (id: number) => fetchAPI(`/api/returns/${id}`),
  updateStatus: (id: number, status: string) =>
    fetchAPI(`/api/returns/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

// Reports API
export const reportsAPI = {
  dailySales: (date?: string) => {
    const params = date ? `?date=${date}` : '';
    return fetchAPI(`/api/reports/daily-sales${params}`);
  },
  salesByDateRange: (startDate: string, endDate: string) => 
    fetchAPI(`/api/reports/sales?startDate=${startDate}&endDate=${endDate}`),
  inventoryReport: () => fetchAPI('/api/reports/inventory'),
  financialReport: (startDate: string, endDate: string) => 
    fetchAPI(`/api/reports/financial?startDate=${startDate}&endDate=${endDate}`),
};

// Settings API
export const settingsAPI = {
  getShopInfo: () => fetchAPI('/api/settings/shop'),
  updateShopInfo: (data: any) => fetchAPI('/api/settings/shop', { method: 'PUT', body: data }),
  get: (key: string) => fetchAPI(`/api/settings/${key}`),
  set: (key: string, value: string) => fetchAPI('/api/settings', { method: 'POST', body: JSON.stringify({ key, value }) }),
};

// Customers API
export const customersAPI = {
  getAll: () => fetchAPI('/api/customers'),
  create: (data: any) => fetchAPI('/api/customers', { method: 'POST', body: JSON.stringify(data) }),
  search: (query: string) => fetchAPI(`/api/customers/search/${query}`),
};

// Authentication API
export const authAPI = {
  login: (username: string, password: string) =>
    fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
  logout: () => fetchAPI('/api/auth/logout', { method: 'POST' }),
  getCurrentUser: () => fetchAPI('/api/auth/me'),
  register: (userData: any) =>
    fetchAPI('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
  changePassword: (userId: number, currentPassword: string, newPassword: string) =>
    fetchAPI(`/api/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    }),
};

// Users API (Admin)
export const usersAPI = {
  getAll: () => fetchAPI('/api/users'),
  getById: (id: number) => fetchAPI(`/api/users/${id}`),
  update: (id: number, userData: any) =>
    fetchAPI(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    }),
};

// Barcode API
export const barcodeAPI = {
  generateUnique: (category?: string) => fetchAPI(`/api/barcode/generate/${category || 'general'}`),
};

// Sample Data API
export const sampleDataAPI = {
  add: () => fetchAPI('/api/sample-data', { method: 'POST' }),
};

// Health Check
export const healthCheck = () => fetchAPI('/api/health');

// Export as window.electron for backward compatibility
if (typeof window !== 'undefined') {
  (window as any).electron = {
    products: productsAPI,
    bills: billsAPI,
    returns: returnsAPI,
    reports: reportsAPI,
    settings: settingsAPI,
    customers: customersAPI,
    auth: authAPI,
    users: usersAPI,
    barcode: {
      generateUnique: barcodeAPI.generateUnique,
      generateImage: () => Promise.resolve({ success: true }),
      onScan: () => {},
      removeScanListener: () => {},
    },
    printer: {
      getAvailable: () => Promise.resolve({ success: true, data: [] }),
      initialize: () => Promise.resolve({ success: true }),
      testConnection: () => Promise.resolve({ success: true }),
      getStatus: () => Promise.resolve({ success: true, data: { connected: false } }),
      printBill: () => Promise.resolve({ success: true, message: 'Printer not available in web mode. Use browser print.' }),
    },
    label: {
      print: () => Promise.resolve({ success: true, message: 'Use browser print dialog' }),
      printBulk: () => Promise.resolve({ success: true, message: 'Use browser print dialog' }),
      getSizes: () => Promise.resolve({ success: true, data: [] }),
      getTemplates: () => Promise.resolve({ success: true, data: [] }),
    },
  };
}
