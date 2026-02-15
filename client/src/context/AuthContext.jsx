import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { setLoading(false); return; }
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      localStorage.clear();
      setUser(null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = async (creds) => {
    const { data } = await api.post('/auth/login', creds);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    return data;
  };

  const signup = async (userData) => {
    const { data } = await api.post('/auth/signup', userData);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') }); } catch {}
    localStorage.clear();
    setUser(null);
  };

  const updateUser = (updates) => setUser((p) => ({ ...p, ...updates }));

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
