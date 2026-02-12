"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  storeEncryptedCredentials,
  getEncryptedCredentials,
  clearEncryptedCredentials,
} from "@/lib/admin-credential-encryption";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [isAutoSigningIn, setIsAutoSigningIn] = useState(false);
  const hasAttemptedAutoSignIn = useRef(false);

  // Attempt automatic sign-in with remembered credentials
  const attemptAutoSignIn = useCallback(async () => {
    if (!isElectron || hasAttemptedAutoSignIn.current) return;
    
    hasAttemptedAutoSignIn.current = true;
    setIsAutoSigningIn(true);

    try {
      // Try to get encrypted credentials
      const credentials = await getEncryptedCredentials();
      
      if (credentials && credentials.username && credentials.password) {
        // Auto-fill the form
        setUsername(credentials.username);
        setPassword(credentials.password);
        setRemember(true);
        
        // Attempt automatic login
        try {
          const response = await fetch("/api/auth/admin/login", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          const result = await response.json();

          if (result.success) {
            localStorage.setItem("admin_token", "authenticated");
            toast.success("Αυτόματη σύνδεση επιτυχής");
            router.push("/admin");
            return;
          } else {
            // Auto sign-in failed, show credentials in form for manual login
            console.log("Auto sign-in failed, credentials loaded in form");
          }
        } catch (error) {
          console.error("Error during auto sign-in:", error);
          // Auto sign-in failed, show credentials in form for manual login
        }
      }
    } catch (error) {
      console.error("Error loading encrypted credentials:", error);
      clearEncryptedCredentials();
    } finally {
      setIsAutoSigningIn(false);
    }
  }, [isElectron, router]);

  // Check if Electron API is available
  useEffect(() => {
    if (typeof window !== "undefined" && window.electron) {
      setIsElectron(true);
    }
  }, []);

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
            return true; // Already authenticated
          } else {
            // Session expired, clear token
            localStorage.removeItem("admin_token");
          }
        } catch (error) {
          // Error checking, allow login
        }
      }
      return false; // Not authenticated
    };
    
    const performAuthCheck = async () => {
      const isAuthenticated = await checkAuth();
      
      // Only attempt auto sign-in if:
      // 1. Not authenticated (cookie expired)
      // 2. Electron is detected
      // 3. Haven't attempted auto sign-in yet
      // 4. Credentials exist (meaning it's cookie expiration, not manual logout)
      if (!isAuthenticated && isElectron && !hasAttemptedAutoSignIn.current) {
        // Check if credentials exist - if they don't, it means manual logout happened
        try {
          const credentials = await getEncryptedCredentials();
          if (credentials && credentials.username && credentials.password) {
            // Credentials exist, so this is likely cookie expiration - try auto sign-in
            setTimeout(() => {
              attemptAutoSignIn();
            }, 500);
          }
          // If no credentials, it was manual logout - don't auto sign-in
        } catch (error) {
          // Error checking credentials - don't auto sign-in
          console.error("Error checking credentials for auto sign-in:", error);
        }
      }
    };
    
    performAuthCheck();
  }, [router, searchParams, isElectron, attemptAutoSignIn]);

  // Load remembered credentials for form display (Electron only)
  useEffect(() => {
    if (!isElectron) return;

    // Load credentials for form display (but don't auto sign-in here - that's handled in checkAuth)
    const loadCredentials = async () => {
      try {
        const credentials = await getEncryptedCredentials();
        if (credentials && credentials.username && credentials.password) {
          setUsername(credentials.username);
          setPassword(credentials.password);
          setRemember(true);
          
          // Trigger input events to ensure form validation recognizes the values
          setTimeout(() => {
            const usernameInput = document.getElementById("username") as HTMLInputElement;
            const passwordInput = document.getElementById("password") as HTMLInputElement;
            
            if (usernameInput) {
              usernameInput.value = credentials.username;
              usernameInput.dispatchEvent(new Event("input", { bubbles: true }));
              usernameInput.dispatchEvent(new Event("change", { bubbles: true }));
            }
            
            if (passwordInput) {
              passwordInput.value = credentials.password;
              passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
              passwordInput.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }, 100);
        }
      } catch (error) {
        console.error("Error loading encrypted credentials:", error);
        clearEncryptedCredentials();
      }
    };

    loadCredentials();
  }, [isElectron]);

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
        
        // Save encrypted credentials if "Remember me" is checked and Electron is detected
        if (remember && isElectron) {
          try {
            await storeEncryptedCredentials(username, password);
            console.log("💾 Admin credentials encrypted and saved (Remember me checked, Electron detected)");
          } catch (error) {
            console.error("Error saving encrypted credentials:", error);
            toast.error("Σφάλμα κατά την αποθήκευση των διαπιστευτηρίων");
          }
        } else {
          // Clear remembered credentials if "Remember me" is not checked
          clearEncryptedCredentials();
        }
        
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
          <p className="text-gray-400">
            {isAutoSigningIn
              ? "Αυτόματη σύνδεση..."
              : "Παρακαλώ συνδεθείτε για να αποκτήσετε πρόσβαση στον πίνακα διαχείρισης"}
          </p>
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

          {/* Remember Me Checkbox - Only show if Electron is detected */}
          {isElectron && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
                className="data-[state=checked]:bg-[var(--brand-border)] data-[state=checked]:border-[var(--brand-border)] border-gray-600 bg-[#1a1a1a]"
              />
              <label
                htmlFor="remember"
                className="text-sm text-gray-300 cursor-pointer select-none"
              >
                Θυμήσου με
              </label>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-md p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-white h-12 disabled:opacity-50"
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

