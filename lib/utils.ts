import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the API URL from environment variables
 * - Server-side: uses API_URL
 * - Client-side: uses NEXT_PUBLIC_API_URL
 */
export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side
    return process.env.API_URL || 'https://e-spitiko-2.bettersolution.gr'
  } else {
    // Client-side
    return process.env.NEXT_PUBLIC_API_URL || 'https://e-spitiko-2.bettersolution.gr'
  }
}