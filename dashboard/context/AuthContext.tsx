"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "COACH" | "ATHLETE" | "PHYSICIAN" | "RESEARCHER" | string;
  athlete_id?: string | null;
}

export interface RegisterPayload {
  username: string;
  password: string;
  name: string;
  role: string;
  sport?: string;
  position?: string;
  age?: number;
  jersey_number?: string;
  weight_kg?: number;
  height_cm?: number;
  baseline_notes?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string; user?: User; athlete?: any }>;
  logout: () => void;
  switchDemoUser: (username: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
  switchDemoUser: async () => false,
});

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const DEMO_CREDENTIALS: Record<string, string> = {
  admin: "admin123",
  coach: "coach123",
  athlete07: "athlete123",
  athlete12: "athlete123",
  researcher: "research123",
  kylian10: "password123",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore stored session on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("sports_auth_token");
      const storedUser = localStorage.getItem("sports_auth_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        // Default initial session as Dr. Robert Vance (Chief Physician) for frictionless demo access
        const defaultUser: User = {
          id: "usr-admin",
          username: "admin",
          name: "Dr. Robert Vance",
          role: "ADMIN",
          athlete_id: "07",
        };
        setUser(defaultUser);
        localStorage.setItem("sports_auth_user", JSON.stringify(defaultUser));
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || "Invalid credentials" };
      }

      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem("sports_auth_token", data.access_token);
      localStorage.setItem("sports_auth_user", JSON.stringify(data.user));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error during authentication" };
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || "Registration failed" };
      }

      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem("sports_auth_token", data.access_token);
      localStorage.setItem("sports_auth_user", JSON.stringify(data.user));
      return { success: true, user: data.user, athlete: data.athlete };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to register person" };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("sports_auth_token");
    localStorage.removeItem("sports_auth_user");
  }, []);

  const switchDemoUser = useCallback(async (username: string) => {
    const password = DEMO_CREDENTIALS[username] || "password123";
    const res = await login(username, password);
    return res.success;
  }, [login]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
