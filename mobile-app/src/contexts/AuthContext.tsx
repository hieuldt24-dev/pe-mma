import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { api, ApiError, setUnauthorizedHandler } from '@/services/api';
import { sessionStore } from '@/storage/session';
import type { AuthResult, User } from '@/types/finance';
import { errorMessage } from '@/utils/format';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  loading: boolean;
  startupError: string;
  restore: () => Promise<void>;
  authenticate: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

async function readSavedSession() {
  const saved = await sessionStore.get();
  if (!saved) return null;
  try {
    const result = await api<{ user: User }>('/auth/me', { token: saved });
    return { token: saved, user: result.user };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await sessionStore.clear();
      return null;
    }
    throw error;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState('');
  const currentToken = useRef<string | null>(null);
  const acceptSavedSession = useCallback(
    (session: Awaited<ReturnType<typeof readSavedSession>>) => {
      currentToken.current = session?.token ?? null;
      setToken(session?.token ?? null);
      setUser(session?.user ?? null);
    },
    [],
  );
  const restore = useCallback(async () => {
    setLoading(true);
    setStartupError('');
    try {
      acceptSavedSession(await readSavedSession());
    } catch (error) {
      setStartupError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [acceptSavedSession]);
  useEffect(() => {
    let active = true;
    readSavedSession()
      .then((session) => {
        if (active) acceptSavedSession(session);
      })
      .catch((error) => {
        if (active) setStartupError(errorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [acceptSavedSession]);
  useEffect(() => {
    setUnauthorizedHandler((expiredToken) => {
      if (currentToken.current !== expiredToken) return;
      currentToken.current = null;
      setToken(null);
      setUser(null);
      void sessionStore
        .clear()
        .catch(() => setStartupError('Không thể xóa phiên trên thiết bị. Vui lòng thử lại.'));
    });
    return () => setUnauthorizedHandler(undefined);
  }, []);
  async function authenticate(email: string, password: string, name?: string) {
    const result = await api<AuthResult>(name === undefined ? '/auth/login' : '/auth/register', {
      method: 'POST',
      body: { email, password, ...(name === undefined ? {} : { name }) },
    });
    try {
      await sessionStore.set(result.token);
    } catch {
      await api('/auth/logout', { token: result.token, method: 'POST' }).catch(() => undefined);
      throw new Error('Không lưu được phiên đăng nhập. Kiểm tra bộ nhớ thiết bị.');
    }
    currentToken.current = result.token;
    setUser(result.user);
    setToken(result.token);
  }
  async function logout() {
    if (token) {
      try {
        await api('/auth/logout', { method: 'POST', token });
      } catch (error) {
        // A revoked/expired session is already signed out on the server.
        if (!(error instanceof ApiError && error.status === 401)) throw error;
      }
    }
    await sessionStore.clear();
    currentToken.current = null;
    setToken(null);
    setUser(null);
  }
  return (
    <AuthContext.Provider
      value={{ token, user, loading, startupError, restore, authenticate, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}
