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

  const updateSavedAccount = (userData, accessToken, refreshToken, currentSaved) => {
    let updated = [...currentSaved];
    const existingIndex = updated.findIndex(a => a.user.username === userData.username);
    if (existingIndex >= 0) {
      updated[existingIndex] = { user: userData, accessToken, refreshToken };
    } else {
      updated.push({ user: userData, accessToken, refreshToken });
    }
    localStorage.setItem("savedAccounts", JSON.stringify(updated));
    setSavedAccounts(updated);
  };

  const fetchUser = useCallback(async () => {
    try {
      const saved = JSON.parse(localStorage.getItem("savedAccounts") || "[]");
      setSavedAccounts(saved);

      const token = localStorage.getItem('accessToken');
      if (!token) { setLoading(false); return; }
      const { data } = await api.get('/auth/me');
      setUser(data.user);

      const refresh = localStorage.getItem('refreshToken');
      updateSavedAccount(data.user, token, refresh, saved);

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
    updateSavedAccount(data.user, data.accessToken, data.refreshToken, savedAccounts);

    return data;
  };

  const signup = async (userData) => {
    const { data } = await api.post('/auth/signup', userData);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    updateSavedAccount(data.user, data.accessToken, data.refreshToken, savedAccounts);

    return data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') }); } catch {}
    
    // NEW: Multi-account logout logic
    if (user) {
      const updated = savedAccounts.filter(a => a.user.username !== user.username);
      localStorage.setItem("savedAccounts", JSON.stringify(updated));
      setSavedAccounts(updated);
      
      // If another account is logged in, switch to it automatically!
      if (updated.length > 0) {
        switchAccount(updated[0].accessToken, updated[0].refreshToken);
        return;
      }
    }

    // If no other accounts, fully clear
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    window.location.href = '/login';
  };

  // NEW: Switch to a different saved account
  const switchAccount = (accessToken, refreshToken) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    window.location.href = "/"; // Reload app to log into the new account
  };

  // NEW: Temporarily clear current tokens to allow new login, but keep saved list
  const prepareAddAccount = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  };

  const updateUser = (updates) => setUser((p) => ({ ...p, ...updates }));

  return (
    <AuthContext.Provider value={{ 
      user, loading, login, signup, logout, updateUser, fetchUser,
      savedAccounts, switchAccount, prepareAddAccount // NEW exports
    }}>
      {children}
    </AuthContext.Provider>
  );
};

