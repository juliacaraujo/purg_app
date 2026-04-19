import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import { logoutUser, checkSession } from "../services/api";

export type User = { id: number; email?: string };

type AuthContextType = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
};

// Tempo máximo em segundo plano antes de deslogar (3 minutos)
const TIMEOUT_MS = 3 * 60 * 1000;

const STORAGE_ID_KEY = "purg_uid";
const STORAGE_EMAIL_KEY = "purg_email";
const STORAGE_HIDDEN_AT_KEY = "purg_hidden_at";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Wrapper seguro para localStorage (só disponível no web)
const webStorage = {
  get: (key: string): string | null => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {}
    return null;
  },
  set: (key: string, value: string) => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {}
  },
  remove: (key: string) => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {}
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // isLoading = true enquanto verifica sessão salva no reload
  const [isLoading, setIsLoading] = useState(true);
  const hiddenAt = useRef<number | null>(null);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {}
    setUser(null);
    webStorage.remove(STORAGE_ID_KEY);
    webStorage.remove(STORAGE_EMAIL_KEY);
    webStorage.remove(STORAGE_HIDDEN_AT_KEY);
  }, []);

  const login = useCallback((u: User) => {
    setUser(u);
    // Persiste no localStorage para sobreviver ao reload no web
    webStorage.set(STORAGE_ID_KEY, String(u.id));
    if (u.email) webStorage.set(STORAGE_EMAIL_KEY, u.email);
    webStorage.remove(STORAGE_HIDDEN_AT_KEY);
  }, []);

  // Ao montar: tenta restaurar sessão salva (corrige bug de reload no web)
  useEffect(() => {
    const savedId = webStorage.get(STORAGE_ID_KEY);

    if (!savedId) {
      setIsLoading(false);
      return;
    }

    // Verifica se o app ficou inativo além do timeout enquanto estava morto
    const storedHiddenAt = webStorage.get(STORAGE_HIDDEN_AT_KEY);
    if (storedHiddenAt) {
      const elapsed = Date.now() - Number(storedHiddenAt);
      if (elapsed >= TIMEOUT_MS) {
        webStorage.remove(STORAGE_ID_KEY);
        webStorage.remove(STORAGE_EMAIL_KEY);
        webStorage.remove(STORAGE_HIDDEN_AT_KEY);
        setIsLoading(false);
        return;
      }
    }

    // Restaura imediatamente (otimista) para evitar flash de tela de login no reload
    const email = webStorage.get(STORAGE_EMAIL_KEY) ?? undefined;
    setUser({ id: Number(savedId), email });

    // Valida a sessão no servidor em background
    checkSession(Number(savedId))
      .then((valid) => {
        if (!valid) {
          // Sessão expirou no backend
          setUser(null);
          webStorage.remove(STORAGE_ID_KEY);
          webStorage.remove(STORAGE_EMAIL_KEY);
        }
      })
      .catch(() => {
        // Erro de rede — mantém o usuário restaurado para tentar depois
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Timeout por inatividade — mobile (AppState)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "background" || nextState === "inactive") {
        const now = Date.now();
        hiddenAt.current = now;
        // Persiste no localStorage para detectar timeout após kill do app
        webStorage.set(STORAGE_HIDDEN_AT_KEY, String(now));
      } else if (nextState === "active") {
        if (hiddenAt.current !== null && user) {
          const elapsed = Date.now() - hiddenAt.current;
          if (elapsed >= TIMEOUT_MS) {
            logout();
            return;
          }
        }
        hiddenAt.current = null;
        webStorage.remove(STORAGE_HIDDEN_AT_KEY);
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [user, logout]);

  // Timeout por inatividade — web (visibilitychange)
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibility = () => {
      if (document.hidden) {
        const now = Date.now();
        hiddenAt.current = now;
        webStorage.set(STORAGE_HIDDEN_AT_KEY, String(now));
      } else {
        if (hiddenAt.current !== null && user) {
          const elapsed = Date.now() - hiddenAt.current;
          if (elapsed >= TIMEOUT_MS) {
            logout();
            return;
          }
        }
        hiddenAt.current = null;
        webStorage.remove(STORAGE_HIDDEN_AT_KEY);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
