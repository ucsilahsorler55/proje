import api from './axios';

export const authService = {
  // Kayıt
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Giriş
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Çıkış
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Mevcut kullanıcı
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Token kontrolü
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

export const clubService = {
  // Tüm kulüpler
  getClubs: async (status = 'active') => {
    const response = await api.get(`/clubs/?status=${status}`);
    return response.data;
  },

  // Kulüp detayı
  getClub: async (clubId) => {
    const response = await api.get(`/clubs/${clubId}/`);
    return response.data;
  },

  // Yeni kulüp
  createClub: async (clubData) => {
    const response = await api.post('/clubs/', clubData);
    return response.data;
  },

  // Kulübe katıl
  joinClub: async (clubId) => {
    const response = await api.post(`/clubs/${clubId}/join/`);
    return response.data;
  },

  // Kulüpten ayrıl
  leaveClub: async (clubId) => {
    const response = await api.post(`/clubs/${clubId}/leave/`);
    return response.data;
  },

  // Kulüp onayla (Admin)
  approveClub: async (clubId) => {
    const response = await api.post(`/clubs/${clubId}/approve/`);
    return response.data;
  },

  // Kulüp reddet (Admin)
  rejectClub: async (clubId) => {
    const response = await api.post(`/clubs/${clubId}/reject/`);
    return response.data;
  },
};

export const eventService = {
  // Tüm etkinlikler
  getEvents: async (clubId = null) => {
    const url = clubId ? `/events/?club_id=${clubId}` : '/events/';
    const response = await api.get(url);
    return response.data;
  },

  // Etkinlik detayı
  getEvent: async (eventId) => {
    const response = await api.get(`/events/${eventId}/`);
    return response.data;
  },

  // Yeni etkinlik
  createEvent: async (eventData) => {
    const response = await api.post('/events/', eventData);
    return response.data;
  },

  // Etkinliğe kayıt
  registerEvent: async (eventId) => {
    const response = await api.post(`/events/${eventId}/register/`);
    return response.data;
  },

  // Etkinlik onayla (Admin)
  approveEvent: async (eventId) => {
    const response = await api.post(`/events/${eventId}/approve/`);
    return response.data;
  },

  // Etkinlik reddet (Admin)
  rejectEvent: async (eventId) => {
    const response = await api.post(`/events/${eventId}/reject/`);
    return response.data;
  },
};

export const userService = {
  // Profil bilgisi
  getProfile: async () => {
    const response = await api.get('/users/profile/');
    return response.data;
  },

  // Profil güncelle
  updateProfile: async (userData) => {
    const response = await api.put('/users/profile/', userData);
    return response.data;
  },

  // Tüm kullanıcılar (Admin)
  getUsers: async (role = null) => {
    const url = role ? `/users/?role=${role}` : '/users/';
    const response = await api.get(url);
    return response.data;
  },
};
