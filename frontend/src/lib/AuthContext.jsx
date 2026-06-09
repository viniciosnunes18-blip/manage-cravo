import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';
const TOKEN_KEY = 'cravo_token';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings] = useState({ id: 'local', name: 'Cravo Dourado Local', is_local: true });

  useEffect(() => { checkUserAuth(); }, []);

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      return;
    }
    try {
      const { data: me } = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser({
        id: me.id,
        email: me.email,
        full_name: me.full_name,
        role: me.role,
        branch_id: me.branch_id || null,
        branch_name: me.branch_name || null,
        first_access: me.first_access || false,
        custom_id: me.id,
      });
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (e) {
      localStorage.removeItem(TOKEN_KEY);
      setIsAuthenticated(false);
      if (e.response?.status === 401 || e.response?.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Autenticação necessária' });
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const login = async (email, password) => {
    const { data } = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    const u = data.user;
    setUser({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      branch_id: u.branch_id || null,
      branch_name: u.branch_name || null,
      first_access: u.first_access || false,
      custom_id: u.id,
    });
    setIsAuthenticated(true);
    setAuthError(null);
    return data;
  };

  const logout = (shouldRedirect = true) => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) window.location.href = '/login';
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  // checkAppState alias para compatibilidade com componentes que chamam isso
  const checkAppState = checkUserAuth;

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings,
      authError, appPublicSettings, authChecked,
      logout, navigateToLogin, checkUserAuth, checkAppState, login,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
