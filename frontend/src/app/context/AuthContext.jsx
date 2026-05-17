import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from token on mount
  useEffect(() => {
    const token = localStorage.getItem('goturf_token');
    if (token) {
      api.getMe()
        .then(data => setUser(data.user))
        .catch(() => localStorage.removeItem('goturf_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    const data = await api.login({ email, password });
    localStorage.setItem('goturf_token', data.token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (userData) => {
    setError(null);
    const data = await api.register(userData);
    localStorage.setItem('goturf_token', data.token);
    setUser(data.user);
    return data;
  }, []);

  const googleLogin = useCallback(async (token) => {
    setError(null);
    const data = await api.googleLogin(token);
    localStorage.setItem('goturf_token', data.token);
    setUser(data.user);
    return data;
  }, []);

  const sendOtp = useCallback(async (type, value) => {
    return await api.sendOtp(type, value);
  }, []);

  const verifyOtp = useCallback(async (payload) => {
    setError(null);
    const data = await api.verifyOtp(payload);
    localStorage.setItem('goturf_token', data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('goturf_token');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      register, 
      googleLogin, 
      sendOtp, 
      verifyOtp, 
      logout, 
      updateUser, 
      isAdmin: user?.role === 'admin',
      isOwner: user?.role === 'turf_owner'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
