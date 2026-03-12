import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "../types/api";
import { tokenStore } from "./token-store";

const USER_KEY = "ehcp_user";

const loadInitialUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (input: { user: AuthUser; accessToken: string; refreshToken: string }) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(loadInitialUser);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(tokenStore.getAccessToken()),
      setSession: ({ user: nextUser, accessToken, refreshToken }) => {
        tokenStore.setTokens(accessToken, refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
      },
      clearSession: () => {
        tokenStore.clear();
        localStorage.removeItem(USER_KEY);
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};