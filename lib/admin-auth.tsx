"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

interface AdminAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isExpired: boolean;
  error: string | null;
}

export function useAdminAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AdminAuthState>({
    isAuthenticated: false,
    isLoading: true,
    isExpired: false,
    error: null,
  });

  const checkAuth = useCallback(async (showError = false) => {
    // Skip auth check on login page
    if (pathname === "/admin/login") {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        isExpired: false,
        error: null,
      });
      return;
    }

    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      // First check localStorage flag
      const adminToken = localStorage.getItem("admin_token");
      if (!adminToken) {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          isExpired: false,
          error: null,
        });
        if (pathname !== "/admin/login") {
          router.replace("/admin/login");
        }
        return;
      }

      // Then check if session token exists on server
      const response = await fetch("/api/auth/admin/check", {
        method: "GET",
        credentials: "include",
      });

      const result = await response.json();

      if (result.success && result.authenticated) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          isExpired: false,
          error: null,
        });
      } else {
        // Token expired or doesn't exist
        localStorage.removeItem("admin_token");
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          isExpired: result.expired || false,
          error: result.error || "Please login to continue",
        });

        if (result.expired) {
          toast.error("Your token has expired, please login again");
          router.replace("/admin/login?expired=true");
        } else {
          if (pathname !== "/admin/login") {
            router.replace("/admin/login");
          }
        }
      }
    } catch (error) {
      console.error("Admin auth check error:", error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        isExpired: false,
        error: "Failed to verify authentication",
      });

      if (showError) {
        toast.error("Failed to verify authentication. Please login again.");
      }

      if (pathname !== "/admin/login") {
        router.replace("/admin/login");
      }
    }
  }, [router, pathname]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleApiError = useCallback((error: any, response?: Response) => {
    // Check if error is due to expired token (401/403)
    if (response && (response.status === 401 || response.status === 403)) {
      localStorage.removeItem("admin_token");
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        isExpired: true,
        error: "Your token has expired, please login again",
      });
      toast.error("Your token has expired, please login again");
      router.replace("/admin/login?expired=true");
      return true;
    }
    return false;
  }, [router]);

  return {
    ...authState,
    checkAuth,
    handleApiError,
  };
}

