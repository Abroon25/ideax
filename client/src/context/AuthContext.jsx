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

  const readSaved = () => {
    try { return JSON.parse(localStorage.getItem('savedAccounts') || '[]'); }
    catch { return []; }
  };

  const writeSaved = (list) => {
    localStorage.setItem('savedAccounts', JSON.stringify(list));
    setSavedAccounts(list);
  };

  const upsertAccount = (userData, accessToken, refreshToken) => {
    const list = readSaved();
    const idx = list.findIndex(a => a.user.username === userData.username);
    const entry = { user: userData, accessToken, refreshToken };
    if (idx >= 0) list[idx] = entry;
    else list.push(entry);
    writeSaved(list);
  };

  const snapshotCurrentAccount = () => {
    if (!user) return;
    // ★ Always read LATEST from localStorage (interceptor may have refreshed)
    const at = localStorage.getItem('accessToken');
    const rt = localStorage.getItem('refreshToken');
    if (at && rt) upsertAccount(user, at, rt);
  };

  const fetchUser = useCallback(async () => {
    try {
      setSavedAccounts(readSaved());

      const token = localStorage.getItem('accessToken');
      if (!token) { setLoading(false); return; }

      const { data } = await api.get('/auth/me');
      setUser(data.user);

      // ★ KEY FIX: Read tokens AFTER the API call
      // The interceptor may have refreshed them during /auth/me
      const latestToken = localStorage.getItem('accessToken');
      const latestRefresh = localStorage.getItem('refreshToken');
      upsertAccount(data.user, latestToken, latestRefresh);
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

  const signup = async (formData) => {
    const { data } = await api.post('/auth/signup', formData);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    upsertAccount(data.user, data.accessToken, data.refreshToken);
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {
        refreshToken: localStorage.getItem('refreshToken'),
      });
    } catch {}

    if (user) {
      const remaining = readSaved().filter(
        a => a.user.username !== user.username
      );
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

  const switchAccount = (username) => {
    // ★ Save current account's LATEST tokens before leaving
    snapshotCurrentAccount();

    const list = readSaved();
    const target = list.find(a => a.user.username === username);

    if (!target) {
      console.error('Account not found:', username, 'Available:', list.map(a => a.user.username));
      window.location.href = '/login';
      return;
    }

    // ★ Set new tokens and hard reload
    localStorage.setItem('accessToken', target.accessToken);
    localStorage.setItem('refreshToken', target.refreshToken);
    window.location.href = '/';
  };

  const prepareAddAccount = () => {
    snapshotCurrentAccount();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (updates) => setUser((prev) => ({ ...prev, ...updates }));

  const otherAccounts = savedAccounts.filter(
    a => !user || a.user.username !== user.username
  );

  return (
    <AuthContext.Provider
      value={{
        user, loading, login, signup, logout, updateUser, fetchUser,
        savedAccounts, otherAccounts, switchAccount, prepareAddAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};