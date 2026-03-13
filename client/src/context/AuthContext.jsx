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
  const [savedAccounts, setSavedAccounts] = useState([]);

  // Safely read from LocalStorage
  const readSaved = () => {
    try {
      const data = localStorage.getItem('savedAccounts');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const writeSaved = (list) => {
    localStorage.setItem('savedAccounts', JSON.stringify(list));
    setSavedAccounts(list);
  };

  const upsertAccount = (userData, accessToken, refreshToken) => {
    if (!userData || !userData.username) return;
    const list = readSaved();
    const idx = list.findIndex(a => a?.user?.username === userData.username);
    const entry = { user: userData, accessToken, refreshToken };
    
    if (idx >= 0) list[idx] = entry; // Update existing
    else list.push(entry);           // Add new
    
    writeSaved(list);
  };

  const fetchUser = useCallback(async () => {
    try {
      const saved = readSaved();
      setSavedAccounts(saved);

      const token = localStorage.getItem('accessToken');
      if (!token) { setLoading(false); return; }

      const { data } = await api.get('/auth/me');
      setUser(data.user);

      const refresh = localStorage.getItem('refreshToken');
      upsertAccount(data.user, token, refresh);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setSavedAccounts(readSaved());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = async (creds) => {
    const { data } = await api.post('/auth/login', creds);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    upsertAccount(data.user, data.accessToken, data.refreshToken);
    return data;
  };

  const signup = async (userData) => {
    const { data } = await api.post('/auth/signup', userData);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    upsertAccount(data.user, data.accessToken, data.refreshToken);
    return data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') }); } catch {}

    if (user) {
      const remaining = readSaved().filter(a => a?.user?.username !== user.username);
      writeSaved(remaining);

      if (remaining.length > 0) {
        localStorage.setItem('accessToken', remaining[0].accessToken);
        localStorage.setItem('refreshToken', remaining[0].refreshToken);
        window.location.href = '/';
        return;
      }
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    window.location.href = '/login';
  };

  const switchAccount = (targetUsername) => {
    // 1. Get the list of all accounts currently saved
    const list = readSaved();
    
    // 2. Find the exact account they clicked on
    const target = list.find(a => a?.user?.username === targetUsername);

    if (!target) {
      window.location.href = '/login';
      return;
    }

    // 3. FORCE write the new tokens to localStorage instantly
    localStorage.setItem('accessToken', target.accessToken);
    localStorage.setItem('refreshToken', target.refreshToken);
    
    // 4. Reload page to force the entire React app to boot up using the new tokens
    window.location.href = '/';
  };

  const prepareAddAccount = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (updates) => setUser((p) => ({ ...p, ...updates }));

  return (
    <AuthContext.Provider value={{
      user, loading, login, signup, logout, updateUser, fetchUser,
      savedAccounts, switchAccount, prepareAddAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};