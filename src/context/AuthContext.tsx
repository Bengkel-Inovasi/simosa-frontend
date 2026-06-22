"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("simosa_admin_token");
    if (savedToken) {
      // Verify token with backend
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      })
        .then((res) => {
          if (res.ok) {
            setToken(savedToken);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("simosa_admin_token");
          }
        })
        .catch(() => {
          // Keep it on network error, or clear depending on preference.
          // Since local SQLite might be restarted, we can clear to be safe.
          localStorage.removeItem("simosa_admin_token");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem("simosa_admin_token", newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("simosa_admin_token");
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
