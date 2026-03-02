/**
 * Viva Payments API Integration
 * 
 * This module handles integration with Viva Payments (Viva Wallet) payment gateway.
 * Viva Payments provides a secure payment processing solution for Greek merchants.
 * 
 * Documentation: https://developer.vivawallet.com/
 * 
 * Required Environment Variables:
 * - VIVA_MERCHANT_ID: Your Viva Payments merchant ID
 * - VIVA_CLIENT_ID: Your Viva Payments OAuth2 Client ID
 * - VIVA_CLIENT_SECRET: Your Viva Payments OAuth2 Client Secret
 * - VIVA_SOURCE_CODE: Your Viva Payments source code
 * - VIVA_ENVIRONMENT: 'demo', 'live', or 'production' (default: 'demo')
 * - VIVA_SUCCESS_URL: URL to redirect after successful payment
 * - VIVA_FAILURE_URL: URL to redirect after failed payment
 */

export interface VivaPaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  tipAmount?: number; // Tip amount as a separate field (in the same currency unit as amount)
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  customerZipCode?: string;
  customerCountryCode?: string;
  successUrl?: string;
  failureUrl?: string;
}

export interface VivaPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  error?: string;
}

export interface VivaPaymentCallback {
  transactionId: string;
  orderId: string;
  status: "success" | "failed" | "pending" | "cancelled";
  amount: number;
  currency: string;
  message?: string;
}

/**
 * Get Viva Payments API base URL based on environment
 */
function getVivaApiUrl(): string {
  const environment = process.env.VIVA_ENVIRONMENT || "demo";
  if (environment === "live" || environment === "production") {
    return "https://api.vivapayments.com";
  }
  return "https://demo-api.vivapayments.com";
}

/**
 * Get Viva Payments Checkout (web) base URL based on environment
 */
function getVivaCheckoutUrl(): string {
  const environment = process.env.VIVA_ENVIRONMENT || "demo";
  if (environment === "live" || environment === "production") {
    return "https://www.vivapayments.com";
  }
  return "https://demo.vivapayments.com";
}

/**
 * Get Viva Payments Accounts (OAuth) base URL based on environment
 */
function getVivaAccountsUrl(): string {
  const environment = process.env.VIVA_ENVIRONMENT || "demo";
  if (environment === "live" || environment === "production") {
    return "https://accounts.vivapayments.com";
  }
  return "https://demo-accounts.vivapayments.com";
}

/**
 * OAuth2 Token Cache
 * Stores the access token and expiration time to avoid unnecessary token requests
 */
let oauthTokenCache: {
  accessToken: string;
  expiresAt: number;
} | null = null;

/**
 * Get OAuth2 access token for Viva Payments API
 * Uses Client Credentials grant type to obtain an access token
 */
async function getVivaOAuthToken(): Promise<string | null> {
  try {
    // Check if we have a valid cached token
    if (
      oauthTokenCache &&
      oauthTokenCache.expiresAt > Date.now() + 60000
    ) {
      // Return cached token if it's still valid (with 1 minute buffer)
      return oauthTokenCache.accessToken;
    }

    const clientId = process.env.VIVA_CLIENT_ID?.trim();
    const clientSecret = process.env.VIVA_CLIENT_SECRET?.trim();

    console.log("🔐 [VIVA OAUTH] Environment variables:", {
      VIVA_CLIENT_ID: clientId,
      VIVA_CLIENT_SECRET: clientSecret,
      clientIdLength: clientId?.length,
      clientSecretLength: clientSecret?.length,
      rawClientId: process.env.VIVA_CLIENT_ID,
      rawClientSecret: process.env.VIVA_CLIENT_SECRET,
    });

    if (!clientId || !clientSecret) {
      console.error(
        "Missing Viva Payments OAuth2 credentials (VIVA_CLIENT_ID, VIVA_CLIENT_SECRET)",
        {
          hasClientId: !!process.env.VIVA_CLIENT_ID,
          hasClientSecret: !!process.env.VIVA_CLIENT_SECRET,
          clientIdLength: process.env.VIVA_CLIENT_ID?.length,
          clientSecretLength: process.env.VIVA_CLIENT_SECRET?.length,
        }
      );
      return null;
    }

    const accountsUrl = getVivaAccountsUrl();
    const tokenUrl = `${accountsUrl}/connect/token`;

    // Create Basic Auth header (Client ID:Client Secret encoded in base64)
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );

    // Prepare form data body
    // Some OAuth2 implementations require scope parameter
    const bodyParams = new URLSearchParams({
      grant_type: "client_credentials",
    });
    const bodyString = bodyParams.toString();

    console.log("🔐 [VIVA OAUTH] Requesting token:", {
      url: tokenUrl,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId?.length,
      credentialsLength: credentials.length,
      body: bodyString,
    });

    // Request OAuth2 token using Client Credentials grant
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: bodyString,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("❌ [VIVA OAUTH] Token request failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
        url: tokenUrl,
      });
      return null;
    }

    const tokenData = await tokenResponse.json();

    console.log("🔐 [VIVA OAUTH] Token response received:", {
      hasAccessToken: !!tokenData.access_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
      fullResponse: tokenData,
      accessTokenPreview: tokenData.access_token 
        ? `${tokenData.access_token.substring(0, 30)}...` 
        : null,
      accessTokenLength: tokenData.access_token?.length,
    });

    if (!tokenData.access_token) {
      console.error(
        "Invalid OAuth2 token response from Viva Payments:",
        tokenData
      );
      return null;
    }

    // Cache the token with expiration time
    // Default to 1 hour if expires_in is not provided
    const expiresIn = tokenData.expires_in || 3600;
    oauthTokenCache = {
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    console.log("🔐 [VIVA OAUTH] OAuth2 token obtained successfully:", {
      tokenType: tokenData.token_type || "Bearer",
      expiresIn: expiresIn,
      expiresAt: new Date(oauthTokenCache.expiresAt).toISOString(),
      accessTokenLength: tokenData.access_token.length,
    });
    
    return oauthTokenCache.accessToken;
  } catch (error) {
    console.error("Error obtaining Viva Payments OAuth2 token:", error);
    return null;
  }
}

/**
 * Creates a payment session with Viva Payments
 * This initiates a payment and returns a payment URL for redirection
 */
export async function createVivaPaymentSession(
  request: VivaPaymentRequest
): Promise<VivaPaymentResponse> {
  try {
    const merchantId = process.env.VIVA_MERCHANT_ID;
    const sourceCode = process.env.VIVA_SOURCE_CODE;

    if (!merchantId || !sourceCode) {
      return {
        success: false,
        error: "Missing Viva Payments credentials. Please configure environment variables.",
      };
    }

    // Get OAuth2 access token
    const accessToken = await getVivaOAuthToken();
    if (!accessToken) {
      return {
        success: false,
        error: "Failed to obtain OAuth2 access token. Please check your VIVA_CLIENT_ID and VIVA_CLIENT_SECRET.",
      };
    }

    const baseUrl = getVivaApiUrl();
    // Use provided URLs or fall back to environment variables
    const successUrl = request.successUrl || process.env.VIVA_SUCCESS_URL || "";
    const failureUrl = request.failureUrl || process.env.VIVA_FAILURE_URL || "";

    // Convert amount to cents (Viva Payments expects amount in smallest currency unit)
    const amountInCents = Math.round(request.amount * 100);
    
    // Validate amount (must be at least 1 cent)
    if (amountInCents < 1) {
      return {
        success: false,
        error: "Invalid amount. Amount must be at least 0.01 EUR",
      };
    }

    // Convert tipAmount to cents if provided
    let tipAmountInCents: number | undefined;
    if (request.tipAmount !== undefined && request.tipAmount !== null && request.tipAmount > 0) {
      tipAmountInCents = Math.round(request.tipAmount * 100);
    }

    // Create payment order via Viva Payments Checkout v2 Orders API
    // Note: Ensure all required fields are present for Smart Checkout
    // Viva Payments requires numeric ISO 4217 currency code (e.g., 978 for EUR)
    const currencyCode = formatCurrencyCode(request.currency || "EUR");
    
    const orderPayload: any = {
      amount: amountInCents,
      customerTrns: request.description,
      sourceCode: sourceCode,
      merchantTrns: request.orderId,
      paymentTimeout: 1800, // 30 minutes
      currencyCode: currencyCode, // Use numeric ISO 4217 code (978 for EUR)
    };

    // Add tipAmount as a separate field if provided
    if (tipAmountInCents !== undefined && tipAmountInCents > 0) {
      orderPayload.tipAmount = tipAmountInCents;
    }

    // Add customer information if available (recommended for better conversion)
    // Only include customer object if we have at least email or name (avoid empty objects)
    if (request.customerEmail || request.customerName) {
      const customer: any = {};
      if (request.customerEmail) customer.email = request.customerEmail;
      if (request.customerName) customer.fullName = request.customerName;
      if (request.customerPhone) customer.phone = request.customerPhone;
      if (request.customerAddress) customer.address = request.customerAddress;
      if (request.customerCity) customer.city = request.customerCity;
      if (request.customerZipCode) customer.zipCode = request.customerZipCode;
      customer.countryCode = request.customerCountryCode || "GR";
      
      orderPayload.customer = customer;
    }

    // Add success and failure URLs if provided (for Smart Checkout redirects)
    if (successUrl) {
      orderPayload.successUrl = successUrl;
    }
    if (failureUrl) {
      orderPayload.failureUrl = failureUrl;
    }

    console.log("💳 [VIVA PAYMENT] Creating order with payload:", orderPayload);

    // Create order via Viva Payments Checkout v2 Orders API with OAuth2 token
    const orderResponse = await fetch(`${baseUrl}/checkout/v2/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error("❌ [VIVA PAYMENT] Order creation failed:", {
        status: orderResponse.status,
        statusText: orderResponse.statusText,
        error: errorText,
        url: `${baseUrl}/checkout/v2/orders`,
        headers: Object.fromEntries(orderResponse.headers.entries()),
      });
      return {
        success: false,
        error: `Failed to create payment order: ${orderResponse.status} - ${errorText}`,
      };
    }

    const orderData = await orderResponse.json();

    console.log("💳 [VIVA PAYMENT] Full order response from API:", JSON.stringify(orderData, null, 2));

    if (!orderData.orderCode) {
      console.error("❌ [VIVA PAYMENT] Missing orderCode in response:", orderData);
      return {
        success: false,
        error: "Invalid response from Viva Payments Checkout v2 Orders API - missing orderCode",
      };
    }

    // Get order code from response
    const orderCode = orderData.orderCode;

    // Check if API response includes a payment URL (some APIs return it directly)
    let paymentUrl = orderData.paymentUrl || orderData.checkoutUrl || orderData.redirectUrl;
    
    // If API didn't provide URL, construct it ourselves
    if (!paymentUrl) {
      // Get checkout URL (different from API URL)
      const checkoutBaseUrl = getVivaCheckoutUrl();
      
      // Color code (optional - can be configured via environment variable)
      const colorCode = process.env.VIVA_COLOR_CODE || "";
      
      // Create checkout session URL
      // Format: https://demo.vivapayments.com/web/checkout?ref={OrderCode}&color={ColorCode}
      paymentUrl = `${checkoutBaseUrl}/web/checkout?ref=${orderCode}`;
      if (colorCode) {
        paymentUrl += `&color=${encodeURIComponent(colorCode)}`;
      }
    }

    console.log("💳 [VIVA PAYMENT] Order created via Checkout v2 Orders API:", {
      orderCode,
      paymentUrl: paymentUrl,
    });

    return {
      success: true,
      paymentUrl,
      transactionId: orderCode,
    };
  } catch (error) {
    console.error("Error creating Viva payment session:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Fetches transaction details from Viva Payments Transaction API
 * Uses OAuth2 authentication to retrieve the complete transaction information
 */
export async function getVivaTransaction(
  transactionId: string
): Promise<VivaPaymentCallback | null> {
  try {
    console.log("🔍 [VIVA TRANSACTION] Fetching transaction:", transactionId);

    if (!transactionId) {
      console.error("❌ [VIVA TRANSACTION] Transaction ID is required");
      return null;
    }

    // Get OAuth2 access token
    const accessToken = await getVivaOAuthToken();
    if (!accessToken) {
      console.error(
        "❌ [VIVA TRANSACTION] Failed to obtain OAuth2 access token"
      );
      return null;
    }

    const baseUrl = getVivaApiUrl();
    const transactionUrl = `${baseUrl}/checkout/v2/transactions/${transactionId}`;

    console.log("🔍 [VIVA TRANSACTION] Fetching from:", transactionUrl);

    // Fetch transaction details from Viva Payments API
    const response = await fetch(transactionUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [VIVA TRANSACTION] API request failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return null;
    }

    const transactionData = await response.json();

    // Extract transaction details from API response
    // Viva API response format may vary, so we check multiple possible field names
    const apiTransactionId =
      transactionData.TransactionId ||
      transactionData.transactionId ||
      transactionData.Id ||
      transactionData.id ||
      transactionId;
    
    // Use merchantTrns as the primary source for orderId (this is what we sent when creating the order)
    const apiOrderId =
      transactionData.MerchantTrns ||
      transactionData.merchantTrns ||
      transactionData.OrderCode ||
      transactionData.orderCode ||
      transactionData.OrderId ||
      transactionData.orderId ||
      "";
    
    const statusId =
      transactionData.StatusId ||
      transactionData.statusId ||
      transactionData.Status ||
      transactionData.status ||
      "";
    
    // Extract currency code - Viva may return numeric ISO 4217 code (978 for EUR)
    const currencyCodeRaw =
      transactionData.CurrencyCode ||
      transactionData.currencyCode ||
      transactionData.Currency ||
      transactionData.currency ||
      "EUR";
    
    // Convert numeric currency code to currency symbol/string
    // 978 is ISO 4217 numeric code for EUR
    let currency = "EUR";
    if (currencyCodeRaw === "978" || currencyCodeRaw === 978) {
      currency = "EUR";
    } else if (typeof currencyCodeRaw === "string" && currencyCodeRaw.length === 3) {
      // If it's already a 3-letter code (EUR, USD, etc.), use it directly
      currency = currencyCodeRaw.toUpperCase();
    } else {
      // Default to EUR
      currency = "EUR";
    }

    const message =
      transactionData.Message ||
      transactionData.message ||
      transactionData.ErrorText ||
      transactionData.errorText ||
      "";

    // Map Viva Payments StatusId to our status format
    // Common Viva status IDs:
    // - 0 or "F" = Finished (success)
    // - 1 = In progress
    // - 2 = Failed
    // - 3 = Cancelled
    let status: "success" | "failed" | "pending" | "cancelled" = "pending";

    const statusIdStr = String(statusId).toUpperCase();
    if (
      statusIdStr === "F" ||
      statusIdStr === "0" ||
      statusIdStr === "FINISHED" ||
      statusIdStr === "FULL" ||
      statusIdStr === "SUCCESS" ||
      statusIdStr === "COMPLETED"
    ) {
      status = "success";
    } else if (
      statusIdStr === "C" ||
      statusIdStr === "3" ||
      statusIdStr === "CANCELLED" ||
      statusIdStr === "CANCEL"
    ) {
      status = "cancelled";
    } else if (
      statusIdStr === "P" ||
      statusIdStr === "1" ||
      statusIdStr === "PENDING" ||
      statusIdStr === "PROCESSING" ||
      statusIdStr === "IN_PROGRESS"
    ) {
      status = "pending";
    } else if (statusIdStr && statusIdStr !== "" && statusIdStr !== "2") {
      // Status ID 2 or any other value = failed
      status = "failed";
    } else if (statusIdStr === "2" || statusIdStr === "FAILED") {
      status = "failed";
    }

    // Handle amount conversion
    // originalAmount is already in main currency unit (EUR), not in cents
    // Amount is in cents and needs to be divided by 100
    let amountInMainUnit = 0;
    
    if (transactionData.OriginalAmount !== undefined || transactionData.originalAmount !== undefined) {
      // originalAmount is already in EUR, use it directly
      const originalAmount = transactionData.OriginalAmount || transactionData.originalAmount;
      amountInMainUnit = typeof originalAmount === "number" 
        ? originalAmount 
        : parseFloat(originalAmount);
    } else if (transactionData.Amount !== undefined || transactionData.amount !== undefined) {
      // Amount is in cents, convert to main currency unit
      const amountInCents = transactionData.Amount || transactionData.amount;
      amountInMainUnit = typeof amountInCents === "number"
        ? amountInCents / 100
        : parseFloat(amountInCents) / 100;
    } else if (transactionData.AmountInCents !== undefined || transactionData.amountInCents !== undefined) {
      // AmountInCents is in cents, convert to main currency unit
      const amountInCents = transactionData.AmountInCents || transactionData.amountInCents;
      amountInMainUnit = typeof amountInCents === "number"
        ? amountInCents / 100
        : parseFloat(amountInCents) / 100;
    }

    const result: VivaPaymentCallback = {
      transactionId: apiTransactionId,
      orderId: apiOrderId || apiTransactionId || "unknown",
      status,
      amount: amountInMainUnit,
      currency,
      message:
        message ||
        (status === "success"
          ? "Payment successful"
          : status === "failed"
          ? "Payment failed"
          : "Payment pending"),
    };

    console.log("✅ [VIVA TRANSACTION] Transaction verified:", result);
    return result;
  } catch (error) {
    console.error("❌ [VIVA TRANSACTION] Error fetching transaction:", error);
    return null;
  }
}

/**
 * Verifies payment callback from Viva Payments
 * This function verifies the payment result returned by Viva Payments callback
 * @deprecated Consider using getVivaTransaction() instead for more reliable verification
 */
export function verifyVivaPaymentCallback(
  callbackData: Record<string, string>
): VivaPaymentCallback | null {
  try {
    console.log("🔍 [VIVA VERIFY] Verifying callback data:", callbackData);

    // Extract callback parameters
    const transactionId =
      callbackData.TransactionId ||
      callbackData.transactionId ||
      callbackData.TransactionId ||
      callbackData.t ||
      callbackData.s || // Smart Checkout session ID
      "";
    const orderId =
      callbackData.OrderId ||
      callbackData.orderId ||
      callbackData.OrderId ||
      callbackData.merchantTrns ||
      "";
    const statusCode =
      callbackData.StatusCode ||
      callbackData.statusCode ||
      callbackData.Status ||
      callbackData.status ||
      callbackData.eventId || // Smart Checkout eventId (0=success, 1=pending, 2=failed)
      callbackData.EventId ||
      "";
    const amount =
      callbackData.Amount || callbackData.amount || callbackData.a || "0";
    const currency =
      callbackData.Currency ||
      callbackData.currency ||
      callbackData.c ||
      "EUR";
    const message =
      callbackData.Message ||
      callbackData.message ||
      callbackData.m ||
      "";

    console.log("🔍 [VIVA VERIFY] Extracted values:", {
      transactionId,
      orderId,
      statusCode,
      amount,
      currency,
      message,
    });

    // Map status code to our status
    // Viva Payments status codes:
    // - "F" = Finished (TRUE success - payment completed successfully)
    // - "FULL" = Full payment completed
    // - "C" = Cancelled (user cancelled the payment)
    // - "P" = Pending (payment is being processed)
    // - eventId: 0 = success, 1 = pending, 2 = failed
    // - Any other code = Failed
    let status: "success" | "failed" | "pending" | "cancelled" = "pending";

    // Check if statusCode is a numeric eventId (Smart Checkout format)
    const eventIdNum = parseInt(statusCode.toString());
    if (!isNaN(eventIdNum)) {
      // eventId format: 0 = success, 1 = pending, 2 = failed
      if (eventIdNum === 0) {
        status = "success";
      } else if (eventIdNum === 2) {
        status = "failed";
      } else if (eventIdNum === 1) {
        status = "pending";
      }
    } else {
      // String status code format
      const statusCodeUpper = statusCode.toUpperCase();
      if (
        statusCodeUpper === "F" || // Finished - TRUE success
        statusCodeUpper === "FULL" ||
        statusCodeUpper === "SUCCESS" ||
        statusCodeUpper === "COMPLETED" ||
        statusCodeUpper === "0"
      ) {
        status = "success";
      } else if (
        statusCodeUpper === "C" ||
        statusCodeUpper === "CANCELLED" ||
        statusCodeUpper === "CANCEL"
      ) {
        status = "cancelled";
      } else if (
        statusCodeUpper === "P" ||
        statusCodeUpper === "PENDING" ||
        statusCodeUpper === "PROCESSING" ||
        statusCodeUpper === "1"
      ) {
        status = "pending";
      } else if (statusCode && statusCodeUpper !== "") {
        status = "failed";
      }
    }

    // Convert amount from cents to main currency unit
    const amountInMainUnit =
      amount && amount !== "0" ? parseFloat(amount) / 100 : 0;

    const result = {
      transactionId: transactionId || orderId || "unknown",
      orderId: orderId || transactionId || "unknown",
      status,
      amount: amountInMainUnit,
      currency,
      message:
        message ||
        (status === "success"
          ? "Payment successful"
          : status === "failed"
          ? "Payment failed"
          : "Payment pending"),
    };

    console.log("✅ [VIVA VERIFY] Verification result:", result);
    return result;
  } catch (error) {
    console.error("❌ [VIVA VERIFY] Error verifying callback:", error);
    return null;
  }
}

/**
 * Formats currency code for Viva Payments
 * ISO 4217 currency codes
 */
export function formatCurrencyCode(currency: string): string {
  const currencyMap: Record<string, string> = {
    EUR: "978",
    USD: "840",
    GBP: "826",
  };

  return currencyMap[currency.toUpperCase()] || "978"; // Default to EUR
}
