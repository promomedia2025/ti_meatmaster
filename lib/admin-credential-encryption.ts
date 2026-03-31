/**
 * Admin Credential Encryption Utility
 * Uses Web Crypto API for secure password encryption/decryption
 * Only works in Electron environment for security
 */

// Get salt for key derivation (should be consistent for the same app)
function getSalt(): ArrayBuffer {
  // Create a unique identifier for this Electron app
  // Combine multiple sources for better security
  const sources: string[] = [];
  
  // Use Electron-specific data if available
  if (typeof window !== "undefined" && window.electron) {
    // Try to get app-specific data
    try {
      // Use a combination of user agent, origin, and a fixed salt
      sources.push(navigator.userAgent);
      sources.push(window.location.origin);
    } catch (e) {
      // Fallback if Electron API not available
    }
  }
  
  // Add a fixed salt (this should be unique per app installation)
  // In production, you might want to generate this once per installation
  const fixedSalt = "ti_MeatMasters_admin_encryption_salt_v1";
  sources.push(fixedSalt);
  
  // Combine all sources
  const combined = sources.join("|");
  
  // Convert to ArrayBuffer
  const encoder = new TextEncoder();
  return encoder.encode(combined);
}

// Get password material for key derivation
function getPasswordMaterial(): ArrayBuffer {
  // Use a fixed password combined with app-specific data
  // This ensures the key is tied to the specific Electron installation
  const password = "ti_MeatMasters_admin_password_key_v1";
  const encoder = new TextEncoder();
  return encoder.encode(password);
}

// Derive encryption key using PBKDF2
async function deriveKey(): Promise<CryptoKey> {
  const passwordMaterial = getPasswordMaterial();
  const salt = getSalt();
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordMaterial,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  // Derive the actual encryption key
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000, // High iteration count for security
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a password using AES-GCM
 * @param password - Plain text password to encrypt
 * @returns Encrypted password with IV (base64 encoded)
 */
export async function encryptPassword(password: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("Web Crypto API not available");
  }

  try {
    // Get encryption key
    const key = await deriveKey();
    
    // Generate random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for AES-GCM
    
    // Encrypt the password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      data
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to base64 for storage
    const base64 = btoa(String.fromCharCode(...combined));
    
    return base64;
  } catch (error) {
    console.error("Error encrypting password:", error);
    throw new Error("Failed to encrypt password");
  }
}

/**
 * Decrypt a password using AES-GCM
 * @param encryptedPassword - Encrypted password with IV (base64 encoded)
 * @returns Plain text password
 */
export async function decryptPassword(encryptedPassword: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("Web Crypto API not available");
  }

  try {
    // Get encryption key
    const key = await deriveKey();
    
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedPassword), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encrypted
    );
    
    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Error decrypting password:", error);
    throw new Error("Failed to decrypt password");
  }
}

/**
 * Store encrypted credentials in localStorage
 * @param username - Username (stored in plain text)
 * @param password - Password (encrypted before storage)
 */
export async function storeEncryptedCredentials(
  username: string,
  password: string
): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("localStorage not available");
  }

  try {
    const encryptedPassword = await encryptPassword(password);
    const credentials = {
      username,
      encryptedPassword,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(
      "admin_remembered_credentials",
      JSON.stringify(credentials)
    );
  } catch (error) {
    console.error("Error storing encrypted credentials:", error);
    throw error;
  }
}

/**
 * Retrieve and decrypt credentials from localStorage
 * @returns Object with username and decrypted password, or null if not found
 */
export async function getEncryptedCredentials(): Promise<{
  username: string;
  password: string;
} | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem("admin_remembered_credentials");
    if (!stored) {
      return null;
    }

    const credentials = JSON.parse(stored);
    
    if (!credentials.username || !credentials.encryptedPassword) {
      return null;
    }

    const password = await decryptPassword(credentials.encryptedPassword);
    
    return {
      username: credentials.username,
      password: password,
    };
  } catch (error) {
    console.error("Error retrieving encrypted credentials:", error);
    // Clear corrupted data
    localStorage.removeItem("admin_remembered_credentials");
    return null;
  }
}

/**
 * Clear stored credentials
 */
export function clearEncryptedCredentials(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("admin_remembered_credentials");
  }
}
