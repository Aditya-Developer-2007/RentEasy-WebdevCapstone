import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import {
  clearAccessToken,
  setAccessToken,
  setOnAuthFailure,
} from '../api/fetchClient';

const AuthContext = createContext(null);
const SESSION_HINT_KEY = 'renteasy_has_session';

const DASHBOARD_PATHS = {
  tenant: '/dashboard/tenant',
  owner: '/dashboard/owner',
  admin: '/dashboard/admin',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const getDashboardPath = useCallback(
    (role) => DASHBOARD_PATHS[role] || '/',
    []
  );

  useEffect(() => {
    setOnAuthFailure(() => {
      localStorage.removeItem(SESSION_HINT_KEY);
      setUser(null);
    });
    return () => setOnAuthFailure(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (localStorage.getItem(SESSION_HINT_KEY) !== '1') {
        setIsAuthLoading(false);
        return;
      }

      try {
        const refreshData = await authApi.refresh();
        if (refreshData?.accessToken) {
          setAccessToken(refreshData.accessToken);
          const meData = await authApi.getMe();
          if (!cancelled) {
            setUser(meData?.user || null);
          }
        }
      } catch {
        clearAccessToken();
        localStorage.removeItem(SESSION_HINT_KEY);
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsAuthLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    setAccessToken(data.accessToken);
    localStorage.setItem(SESSION_HINT_KEY, '1');
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    setAccessToken(data.accessToken);
    localStorage.setItem(SESSION_HINT_KEY, '1');
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear local session state even if network logout fails
    } finally {
      clearAccessToken();
      localStorage.removeItem(SESSION_HINT_KEY);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAuthLoading,
        login,
        register,
        logout,
        getDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}
