import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('gc_token');
    localStorage.removeItem('gc_user');
    setCurrentUser(null);
  }, []);

  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [logout]);

  useEffect(() => {
    const syncLogout = (e) => {
      if (e.key === 'gc_token' && !e.newValue) {
        logout();
      }
    };
    window.addEventListener('storage', syncLogout);
    return () => window.removeEventListener('storage', syncLogout);
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('gc_token');
    const savedUser = localStorage.getItem('gc_user');
    if (token && savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      apiFetch('/api/auth/me').then(r => {
        if (r?.ok) {
          setCurrentUser(r.data);
          localStorage.setItem('gc_user', JSON.stringify(r.data));
        } else {
          logout();
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [logout]);

  const login = async (email, senha) => {
    const r = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
    if (r?.ok) {
      localStorage.setItem('gc_token', r.data.token);
      localStorage.setItem('gc_user', JSON.stringify(r.data.usuario));
      setCurrentUser(r.data.usuario);
      return true;
    }
    return r?.data?.erro || 'Erro ao fazer login';
  };

  const updateCurrentUser = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('gc_user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
