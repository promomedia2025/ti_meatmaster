"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function favoriteLocation(
  locationId: number
): Promise<{ success: boolean; error?: string; message?: string }> {
  console.log("❤️ [FAVORITE] Starting favoriteLocation action");
  console.log("❤️ [FAVORITE] Location ID:", locationId);

  try {
    const cookieStore = cookies();
    const cookieString = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    console.log(
      "❤️ [FAVORITE] Cookies available:",
      cookieString ? "Yes" : "No"
    );
    console.log("❤️ [FAVORITE] Cookie string length:", cookieString.length);

    const url = `https://cocofino.bettersolution.gr/api/locations/${locationId}/favorite`;
    console.log("❤️ [FAVORITE] Request URL:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString,
      },
    });

    console.log("❤️ [FAVORITE] Response status:", response.status);
    console.log("❤️ [FAVORITE] Response OK:", response.ok);
    console.log("❤️ [FAVORITE] Response statusText:", response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❤️ [FAVORITE] ❌ Error response:", errorText);
      console.error("❤️ [FAVORITE] ❌ HTTP Status:", response.status);

      // Check for authentication errors
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: "AUTH_REQUIRED",
          message: "Authentication required. Please log in again.",
        };
      }

      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const result = await response.json();
    console.log(
      "❤️ [FAVORITE] ✅ Success response:",
      JSON.stringify(result, null, 2)
    );

    // Revalidate the page to refresh data
    const pathToRevalidate = `/location/cocofino-${locationId}`;
    console.log("❤️ [FAVORITE] Revalidating path:", pathToRevalidate);
    revalidatePath(pathToRevalidate, "page");

    console.log("❤️ [FAVORITE] ✅ Action completed successfully");
    return { success: true };
  } catch (error) {
    console.error("❤️ [FAVORITE] 💥 Exception caught:", error);
    console.error(
      "❤️ [FAVORITE] Error type:",
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      "❤️ [FAVORITE] Error message:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "❤️ [FAVORITE] Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function unfavoriteLocation(
  locationId: number
): Promise<{ success: boolean; error?: string; message?: string }> {
  console.log("💔 [UNFAVORITE] Starting unfavoriteLocation action");
  console.log("💔 [UNFAVORITE] Location ID:", locationId);

  try {
    const cookieStore = cookies();
    const cookieString = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    console.log(
      "💔 [UNFAVORITE] Cookies available:",
      cookieString ? "Yes" : "No"
    );
    console.log("💔 [UNFAVORITE] Cookie string length:", cookieString.length);

    const url = `https://cocofino.bettersolution.gr/api/locations/${locationId}/favorite`;
    console.log("💔 [UNFAVORITE] Request URL:", url);

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString,
      },
    });

    console.log("💔 [UNFAVORITE] Response status:", response.status);
    console.log("💔 [UNFAVORITE] Response OK:", response.ok);
    console.log("💔 [UNFAVORITE] Response statusText:", response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("💔 [UNFAVORITE] ❌ Error response:", errorText);
      console.error("💔 [UNFAVORITE] ❌ HTTP Status:", response.status);

      // Check for authentication errors
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: "AUTH_REQUIRED",
          message: "Authentication required. Please log in again.",
        };
      }

      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const result = await response.json();
    console.log(
      "💔 [UNFAVORITE] ✅ Success response:",
      JSON.stringify(result, null, 2)
    );

    // Revalidate the page to refresh data
    const pathToRevalidate = `/location/cocofino-${locationId}`;
    console.log("💔 [UNFAVORITE] Revalidating path:", pathToRevalidate);
    revalidatePath(pathToRevalidate, "page");

    console.log("💔 [UNFAVORITE] ✅ Action completed successfully");
    return { success: true };
  } catch (error) {
    console.error("💔 [UNFAVORITE] 💥 Exception caught:", error);
    console.error(
      "💔 [UNFAVORITE] Error type:",
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      "💔 [UNFAVORITE] Error message:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "💔 [UNFAVORITE] Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
