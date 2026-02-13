"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function favoriteLocation(
  locationId: number
): Promise<{ success: boolean; error?: string; message?: string }> {

  try {
    const cookieStore = cookies();
    const cookieString = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");


    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/api/locations/${locationId}/favorite`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString,
      },
    });


    if (!response.ok) {
      const errorText = await response.text();

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

    // Revalidate the page to refresh data
    const pathToRevalidate = `/location/Perfetta-${locationId}`;
    revalidatePath(pathToRevalidate, "page");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function unfavoriteLocation(
  locationId: number
): Promise<{ success: boolean; error?: string; message?: string }> {

  try {
    const cookieStore = cookies();
    const cookieString = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");


    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/api/locations/${locationId}/favorite`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString,
      },
    });


    if (!response.ok) {
      const errorText = await response.text();

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
  

    // Revalidate the page to refresh data
    const pathToRevalidate = `/location/Perfetta-${locationId}`;
    revalidatePath(pathToRevalidate, "page");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
