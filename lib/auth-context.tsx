"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
// Location context is handled separately

interface User {
  id: number;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  telephone?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  postcode?: string;
  created_at?: string;
  updated_at?: string;
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
  register: (
    first_name: string,
    last_name: string,
    email: string,
    password: string,
    password_confirmation: string,
    telephone: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: (updatedUserData?: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Location tracking is handled automatically by LocationProvider

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
          phone:
            result.data.data?.user?.phone || result.data.data?.user?.telephone,
          telephone: result.data.data?.user?.telephone,
          date_of_birth: result.data.data?.user?.date_of_birth,
          address: result.data.data?.user?.address,
          city: result.data.data?.user?.city,
          postcode: result.data.data?.user?.postcode,
          created_at: result.data.data?.user?.created_at,
          updated_at: result.data.data?.user?.updated_at,
        };

        console.log("🔍 User data to store:", userData);

        setUser(userData);

        // Location tracking will be handled automatically by LocationProvider

        // Create storage object without id field
        const { id, ...userDataWithoutId } = userData;

        // Store based on remember preference
        if (remember) {
          localStorage.setItem("user", JSON.stringify(userDataWithoutId));
          sessionStorage.removeItem("user"); // Clear sessionStorage if remember me is checked
          console.log(
            "💾 User data saved to localStorage (remember me checked, id removed)"
          );
        } else {
          sessionStorage.setItem("user", JSON.stringify(userDataWithoutId));
          console.log("💾 User data saved to sessionStorage (session only, id removed)");
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

  // Register function
  const register = async (
    first_name: string,
    last_name: string,
    email: string,
    password: string,
    password_confirmation: string,
    telephone: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Make register request to our API route
      const response = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name,
          last_name,
          email,
          password,
          password_confirmation,
          telephone,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Don't sign in immediately - user needs to verify email with OTP first
        // Just return success so the OTP modal can be shown
        return { success: true };
      } else {
        return { success: false, error: result.error || "Registration failed" };
      }
    } catch (error) {
      console.error("Registration error:", error);
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
      // Location tracking will be cleared automatically by LocationProvider
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
    }
  };

  // Refresh user data
  const refreshUser = async (updatedUserData?: Partial<User>) => {
    try {
      // If updated user data is provided, use it directly (works even if no existing user)
      if (updatedUserData) {
        // If we have an existing user, merge with it; otherwise use the provided data as the base
        const updatedUser: User = user
          ? { ...user, ...updatedUserData }
          : (updatedUserData as User);
        
        setUser(updatedUser);

        // Update storage with the new data
        const storedUser =
          localStorage.getItem("user") || sessionStorage.getItem("user");
        const storageType = localStorage.getItem("user")
          ? "localStorage"
          : "sessionStorage";

        if (storageType === "localStorage") {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } else {
          sessionStorage.setItem("user", JSON.stringify(updatedUser));
        }

        console.log("✅ User data refreshed with provided data");
        return;
      }

      // If no user ID and no updated data provided, can't refresh
      if (!user?.id) {
        console.log("⚠️ Cannot refresh user: no user ID");
        return;
      }

      // Otherwise, try to fetch from storage (fallback)
      const storedUser =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      const storageType = localStorage.getItem("user")
        ? "localStorage"
        : "sessionStorage";

      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        console.log("✅ User data refreshed from", storageType);
      } else {
        console.log("⚠️ No stored user data found for refresh");
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  // Check localStorage and sessionStorage for existing user on app load
  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        setIsLoading(true);

        // Check localStorage first (remember me), then sessionStorage (session only)
        const storedUser =
          localStorage.getItem("user") || sessionStorage.getItem("user");
        const storageType = localStorage.getItem("user")
          ? "localStorage"
          : "sessionStorage";

        if (storedUser) {
          const storedUserData = JSON.parse(storedUser);
          
          // If stored data doesn't have id, verify session to get full user data
          if (!storedUserData.id) {
            try {
              const verifyResponse = await fetch("/api/auth/user", {
                method: "GET",
                credentials: "include",
              });
              
              const verifyData = await verifyResponse.json();
              if (verifyData.success && verifyData.data?.user) {
                const verifiedUser = verifyData.data.user;
                const userData: User = {
                  id: verifiedUser.id,
                  email: verifiedUser.email,
                  name: verifiedUser.name,
                  first_name: verifiedUser.first_name,
                  last_name: verifiedUser.last_name,
                  phone: verifiedUser.phone || verifiedUser.telephone,
                  telephone: verifiedUser.telephone,
                  date_of_birth: verifiedUser.date_of_birth,
                  address: verifiedUser.address,
                  city: verifiedUser.city,
                  postcode: verifiedUser.postcode,
                  created_at: verifiedUser.created_at,
                  updated_at: verifiedUser.updated_at,
                };
          setUser(userData);
                console.log("✅ User data loaded and verified from session");
              } else {
                // Session invalid, clear storage
                localStorage.removeItem("user");
                sessionStorage.removeItem("user");
                console.log("⚠️ Session invalid, cleared stored user data");
              }
            } catch (error) {
              console.error("Error verifying session on load:", error);
              // Clear corrupted data
              localStorage.removeItem("user");
              sessionStorage.removeItem("user");
            }
          } else {
            // Legacy format with id, use it directly but remove id from storage
            setUser(storedUserData);
            const { id, ...userDataWithoutId } = storedUserData;
            if (storageType === "localStorage") {
              localStorage.setItem("user", JSON.stringify(userDataWithoutId));
            } else {
              sessionStorage.setItem("user", JSON.stringify(userDataWithoutId));
            }
            console.log("✅ User data loaded from storage (legacy format, id removed)");
          }

          // Location tracking will be handled automatically by LocationProvider
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
    register,
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
