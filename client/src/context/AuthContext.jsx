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

  // Helper function to save account to list
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
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = async (creds) => {
    const { data } = await api.post('/auth/login', creds);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    
    // Make sure we have latest savedAccounts before updating
    const currentSaved = JSON.parse(localStorage.getItem("savedAccounts") || "[]");
    updateSavedAccount(data.user, data.accessToken, data.refreshToken, currentSaved);
    
    return data;
  };

  const signup = async (userData) => {
    const { data } = await api.post('/auth/signup', userData);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    
    const currentSaved = JSON.parse(localStorage.getItem("savedAccounts") || "[]");
    updateSavedAccount(data.user, data.accessToken, data.refreshToken, currentSaved);
    
    return data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') }); } catch {}
    
    if (user) {
      const updated = savedAccounts.filter(a => a.user.username !== user.username);
      localStorage.setItem("savedAccounts", JSON.stringify(updated));
      setSavedAccounts(updated);
      
      if (updated.length > 0) {
        // INSTANT SWITCH (No reload)
        switchAccount(updated[0].accessToken, updated[0].refreshToken);
        return;
      }
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    window.location.href = '/login';
  };

  // INSTANT ACCOUNT SWITCHING FIX
  const switchAccount = async (accessToken, refreshToken) => {
    setLoading(true);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    
    try {
      // Re-fetch the user profile with the newly set token
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      // If the token expired while they were switched away, force a clean login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      window.location.href = "/login";
    } finally {
      setLoading(false);
      window.location.href = "/"; // Send them to home screen of the new account
    }
  };

  const prepareAddAccount = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null); // Clear context instantly
    window.location.href = "/login";
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