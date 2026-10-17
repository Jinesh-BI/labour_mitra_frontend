import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AUTH_LOGOUT_EVENT } from "@/api/client";
import { queryClient } from "@/api/queryClient";
import { tokenStorage } from "@/api/tokenStorage";
import type { AuthSession, AuthUser } from "@/api/types";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isOperator: boolean;
  /** Call with the response of register or login. */
  signIn: (session: AuthSession) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): AuthUser | null {
  const json = tokenStorage.getUserJson();
  if (!json || !tokenStorage.getAccess()) return null;
  try {
    return JSON.parse(json) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  const signIn = useCallback((session: AuthSession) => {
    tokenStorage.setAccess(session.access);
    tokenStorage.setRefresh(session.refresh);
    tokenStorage.setUserJson(JSON.stringify(session.user));
    setUser(session.user);
  }, []);

  const signOut = useCallback(() => {
    tokenStorage.clear();
    queryClient.clear(); // never show one user's cached data to the next
    setUser(null);
  }, []);

  // The API client fires this when a refresh fails, so a dead session returns to the login screen.
  useEffect(() => {
    window.addEventListener(AUTH_LOGOUT_EVENT, signOut);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, signOut);
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isOperator: user?.role === "operator" || user?.role === "admin",
      signIn,
      signOut,
    }),
    [user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
