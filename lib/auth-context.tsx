"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: number;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    remember?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Get CSRF token
  const getCsrfToken = async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/csrf");
      if (response.ok) {
        const data = await response.json();
        return data.csrfToken;
      }
      return null;
    } catch (error) {
      console.error("Error getting CSRF token:", error);
      return null;
    }
  };

  // Login function
  const login = async (
    email: string,
    password: string,
    remember: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Make login request to our API route (which handles the external API call)
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          remember,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Store user data (adjust based on actual API response structure)
        console.log("🔍 API response data:", result.data);
        console.log("🔍 API response user:", result.data.data?.user);

        const userData: User = {
          id: result.data.data?.user?.id || 1,
          email: result.data.data?.user?.email || email,
          name: result.data.data?.user?.name,
          first_name: result.data.data?.user?.first_name,
          last_name: result.data.data?.user?.last_name,
        };

        console.log("🔍 User data to store:", userData);

        setUser(userData);

        // Store based on remember preference
        if (remember) {
          localStorage.setItem("user", JSON.stringify(userData));
          sessionStorage.removeItem("user"); // Clear sessionStorage if remember me is checked
          console.log(
            "💾 User data saved to localStorage (remember me checked)"
          );
        } else {
          sessionStorage.setItem("user", JSON.stringify(userData));
          console.log("💾 User data saved to sessionStorage (session only)");
        }

        return { success: true };
      } else {
        return { success: false, error: result.error || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call the logout API endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local state and both storage types
      setUser(null);
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      console.log("🗑️ User data cleared from storage");
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      // You can implement user data refresh logic here
      // This could make an API call to verify the current session
      // For now, we'll leave it empty since we're not persisting user data locally
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  // Check localStorage and sessionStorage for existing user on app load
  useEffect(() => {
    const checkStoredUser = () => {
      try {
        setIsLoading(true);
        console.log("🔍 Checking storage for user...");

        // Check localStorage first (remember me), then sessionStorage (session only)
        const storedUser =
          localStorage.getItem("user") || sessionStorage.getItem("user");
        const storageType = localStorage.getItem("user")
          ? "localStorage"
          : "sessionStorage";

        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.log(`✅ User restored from ${storageType}:`, userData);
        } else {
          console.log("ℹ️ No stored user found - user needs to login");
        }
      } catch (error) {
        console.error("❌ Error loading stored user:", error);
        localStorage.removeItem("user"); // Clear corrupted data
        sessionStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredUser();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
