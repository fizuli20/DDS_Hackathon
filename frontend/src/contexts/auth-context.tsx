"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  apiFetchMe,
  clearAuth,
  getStoredAuthUser,
  getStoredToken,
  persistAuth,
  type AuthUser,
  USE_AUTH_API,
} from "@/lib/auth-client";

type AuthContextValue = {
  ready: boolean;
  useApi: boolean;
  token: string | null;
  user: AuthUser | null;
  setSessionFromLogin: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!USE_AUTH_API) {
      setReady(true);
      return;
    }
    const t = getStoredToken();
    const u = getStoredAuthUser();
    setToken(t);
    setUser(u);
    if (t) {
      void apiFetchMe(t).then((res) => {
        if (res?.user) {
          setUser(res.user);
          try {
            sessionStorage.setItem("hspts_auth_user", JSON.stringify(res.user));
          } catch {
            // noop
          }
        }
      });
    }
    setReady(true);
  }, []);

  const setSessionFromLogin = useCallback((tk: string, u: AuthUser) => {
    persistAuth(tk, u);
    setToken(tk);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      useApi: USE_AUTH_API,
      token,
      user,
      setSessionFromLogin,
      logout,
    }),
    [ready, token, user, setSessionFromLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
