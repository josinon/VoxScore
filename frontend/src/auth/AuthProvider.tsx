import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router';
import {
  ApiError,
  apiUrl,
  fetchCurrentUser,
  postOAuthMock,
  type MeResponse,
} from '../lib/api';
import { getAccessToken, setAccessToken } from '../lib/auth-storage';

type AuthContextValue = {
  user: MeResponse | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshMe: () => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => void;
  loginWithMockProfile: (body: {
    email: string;
    displayName?: string;
    photoUrl?: string | null;
  }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    const me = await fetchCurrentUser();
    setUser(me);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshMe();
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshMe]);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const loginWithGoogle = useCallback(() => {
    window.location.assign(apiUrl('/auth/google'));
  }, []);

  const loginWithMockProfile = useCallback(
    async (body: {
      email: string;
      displayName?: string;
      photoUrl?: string | null;
    }) => {
      const { accessToken } = await postOAuthMock(body);
      setAccessToken(accessToken);
      await refreshMe();
      navigate('/', { replace: true });
    },
    [navigate, refreshMe],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      refreshMe,
      logout,
      loginWithGoogle,
      loginWithMockProfile,
    }),
    [user, loading, refreshMe, logout, loginWithGoogle, loginWithMockProfile],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
