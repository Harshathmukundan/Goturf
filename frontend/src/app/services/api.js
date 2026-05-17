const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

class ApiService {
  constructor() {
    this.baseUrl = API_URL;
  }

  getToken() {
    return localStorage.getItem('goturf_token');
  }

  getHeaders(isFormData = false) {
    const headers = {};
    if (!isFormData) headers['Content-Type'] = 'application/json';
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: { ...this.getHeaders(), ...options.headers },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // Auth
  async register(userData) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
  }

  async sendOtp(type, value) {
    return this.request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ type, value }) });
  }

  async verifyOtp(payload) {
    return this.request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) });
  }

  async googleLogin(token) {
    return this.request('/auth/google', { method: 'POST', body: JSON.stringify({ token }) });
  }

  async login(credentials) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(data) {
    return this.request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) });
  }

  // Admin User APIs
  async getAllUsers() {
    return this.request('/auth/admin/users');
  }

  async updateUserRole(id, role) {
    return this.request(`/auth/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
  }

  // Turfs
  async getTurfs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/turfs${query ? `?${query}` : ''}`);
  }

  async getTurf(id) {
    return this.request(`/turfs/${id}`);
  }

  async getTurfSlots(id, date) {
    return this.request(`/turfs/${id}/slots?date=${date}`);
  }

  async createTurf(data) {
    return this.request('/turfs', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateTurf(id, data) {
    return this.request(`/turfs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  // Bookings
  async createBooking(data) {
    return this.request('/bookings', { method: 'POST', body: JSON.stringify(data) });
  }

  async getUserBookings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/bookings/my${query ? `?${query}` : ''}`);
  }

  async getBooking(id) {
    return this.request(`/bookings/${id}`);
  }

  async confirmBooking(id, transactionId) {
    return this.request(`/bookings/${id}/confirm`, { method: 'PUT', body: JSON.stringify({ transactionId }) });
  }

  async cancelBooking(id, reason) {
    return this.request(`/bookings/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) });
  }

  async getAdminStats() {
    return this.request('/bookings/admin/stats');
  }

  async getAllBookings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/bookings/admin/all${query ? `?${query}` : ''}`);
  }

  // Turf Owner
  async getOwnerTurfs() {
    return this.request('/turfs/owner/my-turfs');
  }

  async getOwnerBookings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/bookings/owner/my-bookings${query ? `?${query}` : ''}`);
  }

  async getOwnerStats() {
    return this.request('/bookings/owner/stats');
  }

  // Teams
  async createTeam(data) {
    return this.request('/teams', { method: 'POST', body: JSON.stringify(data) });
  }

  async getTeam(id) {
    return this.request(`/teams/${id}`);
  }

  async getTeamByInviteCode(code) {
    return this.request(`/teams/invite/${code}`);
  }

  async inviteMember(teamId, email) {
    return this.request(`/teams/${teamId}/invite`, { method: 'POST', body: JSON.stringify({ email }) });
  }

  async respondToInvite(teamId, status) {
    return this.request(`/teams/${teamId}/respond`, { method: 'PUT', body: JSON.stringify({ status }) });
  }

  // Chat
  async getChatMessages(chatRoomId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/chat/${chatRoomId}/messages${query ? `?${query}` : ''}`);
  }

  async sendChatMessage(chatRoomId, message) {
    return this.request(`/chat/${chatRoomId}/messages`, { method: 'POST', body: JSON.stringify({ message }) });
  }

  // Health
  async healthCheck() {
    return this.request('/health');
  }
}

export const api = new ApiService();
export default api;
