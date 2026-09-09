import { createContext } from "react";
import { LoginRequest, User } from "../types/auth";

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => void;
  reloadUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
