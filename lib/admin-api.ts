/**
 * Wrapper for admin API calls that handles authentication and token expiration
 */
export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // Handle token expiration
  if (response.status === 401 || response.status === 403) {
    // Clear local storage
    localStorage.removeItem("admin_token");
    
    // Redirect to login with expired flag
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login?expired=true";
    }
    
    throw new Error("Your token has expired, please login again");
  }

  return response;
}

