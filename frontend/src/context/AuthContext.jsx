import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, getApiError } from '../services/api';
import { TOKEN_KEY, USER_KEY } from '../services/config';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(readStoredUser);
  const [ready, setReady] = useState(false);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setReady(true);
      return;
    }
    let active = true;
    authApi
      .me()
      .then((profile) => {
        if (!active) return;
        setUser(profile);
        setToken(storedToken);
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
      })
      .catch(() => {
        if (active) clearSession();
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [clearSession]);

  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener('connecthub:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('connecthub:unauthorized', handleUnauthorized);
  }, [clearSession]);

  const persistSession = useCallback((data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(
    async (identifier, password) => {
      try {
        const data = await authApi.login({ identifier, password });
        return persistSession(data);
      } catch (error) {
        throw new Error(getApiError(error, 'Unable to sign in'));
      }
    },
    [persistSession],
  );

  const register = useCallback(
    async (payload) => {
      try {
        const data = await authApi.register(payload);
        return persistSession(data);
      } catch (error) {
        throw new Error(getApiError(error, 'Unable to create your account'));
      }
    },
    [persistSession],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, token, ready, login, register, logout, setUser }),
    [user, token, ready, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
