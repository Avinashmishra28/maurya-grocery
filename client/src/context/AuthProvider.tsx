import { useState, type ReactNode } from "react";

import { useNavigate } from "react-router-dom";
import type { User } from "../types";
import api from "../config/api";
import toast from "react-hot-toast";
import axios from "axios";

import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("auth_user");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("auth_token");
  });

  const loading = false;

  // Login
  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post("/auth/login", {
        email,
        password,
      });

      setUser(data.user);
      setToken(data.token);

      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));

      toast.success("Login successful");
      navigate("/");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || error.message || "Login failed",
        );
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  // Register
  const register = async (name: string, email: string, password: string) => {
    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      setUser(data.user);
      setToken(data.token);

      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));

      toast.success("Registration successful");
      navigate("/");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Registration failed",
        );
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  // Update user
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updated = {
        ...user,
        ...userData,
      };

      setUser(updated);

      localStorage.setItem("auth_user", JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
