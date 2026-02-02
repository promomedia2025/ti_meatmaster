"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check for expiration message from URL or check auth status
  useEffect(() => {
    const expired = searchParams?.get("expired");
    if (expired === "true") {
      toast.error("Your token has expired, please login again");
      setError("Your token has expired, please login again");
    }

    // Check if already logged in with valid session
    const checkAuth = async () => {
      const adminToken = localStorage.getItem("admin_token");
      if (adminToken) {
        // Verify session is still valid
        try {
          const response = await fetch("/api/auth/admin/check", {
            method: "GET",
            credentials: "include",
          });
          const result = await response.json();
          if (result.success && result.authenticated) {
            router.push("/admin");
          } else {
            // Session expired, clear token
            localStorage.removeItem("admin_token");
          }
        } catch (error) {
          // Error checking, allow login
        }
      }
    };
    checkAuth();
  }, [router, searchParams]);

  // Auto-fill credentials when running in Electron
  useEffect(() => {
    // Check if Electron API is available
    if (typeof window !== "undefined" && window.electron) {
      // Get credentials from environment variables
      const electronUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
      const electronPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;


      if (electronUsername && electronPassword) {
        setUsername(electronUsername);
        setPassword(electronPassword);
        
        // Trigger input events to ensure form validation recognizes the values
        setTimeout(() => {
          const usernameInput = document.getElementById("username") as HTMLInputElement;
          const passwordInput = document.getElementById("password") as HTMLInputElement;
          
          if (usernameInput) {
            // Set the value directly on the input element as well
            usernameInput.value = electronUsername;
            usernameInput.dispatchEvent(new Event("input", { bubbles: true }));
            usernameInput.dispatchEvent(new Event("change", { bubbles: true }));
          }
          
          if (passwordInput) {
            // Set the value directly on the input element as well
            passwordInput.value = electronPassword;
            passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
            passwordInput.dispatchEvent(new Event("change", { bubbles: true }));
          }
          
        }, 100);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Log the values being sent for debugging
    try {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const result = await response.json();
      

      if (result.success) {
        // Store a token or flag to indicate admin is logged in
        // You can store the actual token from the API response if provided
        localStorage.setItem("admin_token", "authenticated");
        
        // Redirect to dashboard
        router.push("/admin");
      } else {
        setError(result.error || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] p-4">
      <div className="bg-[#2a2a2a] rounded-lg w-full max-w-md p-8 shadow-lg">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Σύνδεση</h1>
          <p className="text-gray-400">Παρακαλώ συνδεθείτε για να αποκτήσετε πρόσβαση στον πίνακα διαχείρισης</p>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="space-y-4" 
          name="adminLoginForm"
          autoComplete="on"
          method="post"
          action="#"
        >
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500 h-12"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500 h-12"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-md p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#ff9328] hover:bg-[#915316] text-white h-12 disabled:opacity-50"
          >
            {isLoading ? "Σύνδεση..." : "Σύνδεση"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Φόρτωση...</div>
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}

