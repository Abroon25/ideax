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

  /* ── helpers ───────────────────────────────────────────── */

  const readSaved = () => {
    try { return JSON.parse(localStorage.getItem('savedAccounts') || '[]'); }
    catch { return []; }
  };

  const writeSaved = (list) => {
    localStorage.setItem('savedAccounts', JSON.stringify(list));
    setSavedAccounts(list);
  };

  // Upsert by username — always dedupes
  const upsertAccount = (userData, accessToken, refreshToken) => {
    const list = readSaved();                                    // ← always read FRESH from storage
    const idx  = list.findIndex(a => a.user.username === userData.username);
    const entry = { user: userData, accessToken, refreshToken };

    if (idx >= 0) list[idx] = entry;
    else list.push(entry);

    writeSaved(list);
  };

  // ★ KEY FIX: snapshot current session's LATEST tokens
  //   (the interceptor may have silently refreshed them)
  const snapshotCurrentAccount = () => {
    if (!user) return;
    const at = localStorage.getItem('accessToken');
    const rt = localStorage.getItem('refreshToken');
    if (at && rt) upsertAccount(user, at, rt);
  };

  /* ── fetch on mount ────────────────────────────────────── */

  const fetchUser = useCallback(async () => {
    try {
      setSavedAccounts(readSaved());

      const token = localStorage.getItem('accessToken');
      if (!token) { setLoading(false); return; }

      const { data } = await api.get('/auth/me');
      setUser(data.user);

      // sync savedAccounts with fresh user data + current tokens
      const refresh = localStorage.getItem('refreshToken');
      upsertAccount(data.user, token, refresh);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      // DON'T clear savedAccounts — other accounts are still valid
      setSavedAccounts(readSaved());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  /* ── login / signup ────────────────────────────────────── */

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

  /* ── logout ────────────────────────────────────────────── */

  const logout = async () => {
    try {
      await api.post('/auth/logout', {
        refreshToken: localStorage.getItem('refreshToken'),
      });
    } catch {}

    if (user) {
      // remove THIS account from saved list
      const remaining = readSaved().filter(
        a => a.user.username !== user.username
      );
      writeSaved(remaining);

      if (remaining.length > 0) {
        // auto-switch to next saved account
        localStorage.setItem('accessToken',  remaining[0].accessToken);
        localStorage.setItem('refreshToken', remaining[0].refreshToken);
        window.location.href = '/';          // hard reload picks up new tokens
        return;
      }
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    window.location.href = '/login';
  };

  /* ── switch account ────────────────────────────────────── */

  const switchAccount = (username) => {
    // ★ FIX 1: save current account's LATEST tokens before leaving
    snapshotCurrentAccount();

    // read fresh (includes the just-snapshotted current account)
    const list   = readSaved();
    const target = list.find(a => a.user.username === username);

    if (!target) {
      window.location.href = '/login';
      return;
    }

    // ★ FIX 2: set tokens + hard reload (no stale React state)
    localStorage.setItem('accessToken',  target.accessToken);
    localStorage.setItem('refreshToken', target.refreshToken);
    window.location.href = '/';
  };

  /* ── add account ───────────────────────────────────────── */

  const prepareAddAccount = () => {
    snapshotCurrentAccount();                // save before clearing
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (updates) =>
    setUser((prev) => ({ ...prev, ...updates }));

  /* ── ★ FIX 3: filtered list for the UI ─────────────────── */
  const otherAccounts = savedAccounts.filter(
    a => !user || a.user.username !== user.username
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateUser,
        fetchUser,
        savedAccounts,
        otherAccounts,        // ← USE THIS in the dropdown
        switchAccount,
        prepareAddAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};