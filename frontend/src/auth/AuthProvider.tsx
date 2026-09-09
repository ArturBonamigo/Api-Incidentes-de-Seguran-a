import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import * as authApi from "../api/auth.api";
import { clearTokens, getAccessToken, setTokens } from "../api/tokenStorage";
import { LoginRequest, User } from "../types/auth";
import { AuthContext } from "./AuthContext";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reloadUser = useCallback(async () => {
    const currentUser = await authApi.getCurrentUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    async function bootstrapSession() {
      if (!getAccessToken()) {
        setIsLoading(false);
        return;
      }

      try {
        await reloadUser();
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void bootstrapSession();
  }, [reloadUser]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const response = await authApi.login(payload);
      setTokens(response.access, response.refresh);
      await reloadUser();
    },
    [reloadUser]
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      reloadUser
    }),
    [isLoading, login, logout, reloadUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
