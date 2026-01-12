/**
 * Piraeus Bank Payment Gateway Integration
 *
 * This module handles integration with Piraeus Bank's ePOS payment gateway.
 * We're using the Redirection method which redirects customers to Piraeus Bank's
 * secure payment page, simplifying PCI DSS compliance.
 *
 * Required Credentials (from Piraeus Bank):
 * - MERCHANT_ID: Your unique merchant identifier
 * - POS_ID: Point of Sale identifier
 * - ACQUIRER_ID: Acquiring bank identifier
 * - API_KEY: API key for authentication (if using API method)
 * - API_SECRET: API secret for authentication (if using API method)
 *
 * Environment Variables Needed:
 * - PIRAEUS_MERCHANT_ID
 * - PIRAEUS_POS_ID
 * - PIRAEUS_ACQUIRER_ID
 * - PIRAEUS_API_KEY (optional, for API method)
 * - PIRAEUS_API_SECRET (optional, for API method)
 * - PIRAEUS_GATEWAY_URL (test/production URL)
 * - PIRAEUS_CALLBACK_URL (your callback URL for payment results)
 * - PIRAEUS_SUCCESS_URL (URL to redirect after successful payment)
 * - PIRAEUS_FAILURE_URL (URL to redirect after failed payment)
 */

export interface PiraeusPaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PiraeusPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  formData?: Record<string, string>;
  gatewayUrl?: string;
  transactionId?: string;
  error?: string;
}

export interface PiraeusPaymentCallback {
  transactionId: string;
  orderId: string;
  status: "success" | "failed" | "pending" | "cancelled";
  amount: number;
  currency: string;
  message?: string;
  signature?: string;
}

/**
 * Validates that the gateway URL is properly formatted
 * Note: This doesn't check if the URL is reachable (DNS/network check)
 */
function validateGatewayUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

/**
 * Generates payment request for Piraeus Bank
 *
 * For Redirection method, this creates a form that redirects to Piraeus Bank's payment page
 *
 * IMPORTANT: If you encounter DNS_PROBE_FINISHED_NXDOMAIN errors:
 * 1. Verify the gateway URL is correct with Piraeus Bank
 * 2. Check if the test environment requires VPN or specific network access
 * 3. Contact Piraeus Bank support: e-paymentsServices@piraeusbank.gr
 * 4. Consider using production URL if you have production credentials
 */
export function createPiraeusPaymentRequest(
  request: PiraeusPaymentRequest
): PiraeusPaymentResponse {
  try {
    const merchantId = process.env.PIRAEUS_MERCHANT_ID;
    const posId = process.env.PIRAEUS_POS_ID;
    const acquirerId = process.env.PIRAEUS_ACQUIRER_ID;
    // Default to test environment if not specified
    const gatewayUrl = process.env.PIRAEUS_GATEWAY_URL || "";

    if (!merchantId || !posId || !acquirerId) {
      return {
        success: false,
        error:
          "Missing Piraeus Bank credentials. Please configure environment variables.",
      };
    }

    // Validate gateway URL format
    if (!validateGatewayUrl(gatewayUrl)) {
      return {
        success: false,
        error: `Invalid gateway URL format: ${gatewayUrl}. Please check PIRAEUS_GATEWAY_URL in your environment variables.`,
      };
    }

    // Format amount (Piraeus Bank expects amount in smallest currency unit, e.g., cents for EUR)
    // For EUR, multiply by 100 to get cents
    const amountInCents = Math.round(request.amount * 100);

    // Get username and password from environment variables
    const username = process.env.PIRAEUS_USERNAME;
    const password = process.env.PIRAEUS_PASSWORD;

    // Create form data for POST request (hidden fields)
    const formData: Record<string, string> = {
      MerchantID: merchantId,
      PosID: posId,
      AcquirerID: acquirerId,
      OrderID: request.orderId,
      Amount: amountInCents.toString(),
      Currency: request.currency === "EUR" ? "978" : "978", // ISO 4217 code for EUR
      Description: request.description.substring(0, 255), // Max 255 chars
      ReturnURL: request.returnUrl,
      CancelURL: request.cancelUrl,
    };

    // Add optional customer fields
    if (request.customerEmail) {
      formData.CustomerEmail = request.customerEmail;
    }
    if (request.customerName) {
      formData.CustomerName = request.customerName;
    }
    if (request.customerPhone) {
      formData.CustomerPhone = request.customerPhone;
    }

    // Add credentials if provided (as hidden fields per Piraeus Bank documentation)
    if (username) {
      formData.Username = username;
    }
    if (password) {
      formData.Password = password;
    }

    // Log the form data that will be sent in the POST request (mask password for security)
    const formDataForLog = { ...formData };
    if (formDataForLog.Password) {
      formDataForLog.Password = "***MASKED***";
    }
    console.log(
      "💳 [PIRAEUS PAYMENT] Form data to be submitted:",
      JSON.stringify(formDataForLog, null, 2)
    );
    console.log("💳 [PIRAEUS PAYMENT] Gateway URL:", gatewayUrl);
    console.log("💳 [PIRAEUS PAYMENT] Request details:", {
      orderId: request.orderId,
      amount: request.amount,
      amountInCents,
      currency: request.currency,
      description: request.description,
      returnUrl: request.returnUrl,
      cancelUrl: request.cancelUrl,
    });

    return {
      success: true,
      formData,
      gatewayUrl: gatewayUrl,
      transactionId: request.orderId, // Use orderId as initial transaction ID
    };
  } catch (error) {
    console.error("Error creating Piraeus payment request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Verifies payment callback from Piraeus Bank
 *
 * This function verifies the payment result returned by Piraeus Bank's callback
 */
export function verifyPiraeusPaymentCallback(
  callbackData: Record<string, string>
): PiraeusPaymentCallback | null {
  try {
    console.log("🔍 [PAYMENT VERIFY] Verifying callback data:", callbackData);

    // Extract callback parameters
    // Note: Actual parameter names may vary based on Piraeus Bank's documentation
    // Try multiple possible parameter name variations
    const transactionId =
      callbackData.TransactionID ||
      callbackData.transactionId ||
      callbackData.TransactionId ||
      callbackData.TRANSACTION_ID ||
      "";
    const orderId =
      callbackData.OrderID ||
      callbackData.orderId ||
      callbackData.OrderId ||
      callbackData.ORDER_ID ||
      callbackData.orderId ||
      "";
    const statusCode =
      callbackData.StatusCode ||
      callbackData.statusCode ||
      callbackData.Status ||
      callbackData.status ||
      callbackData.STATUS_CODE ||
      "";
    const amount =
      callbackData.Amount || callbackData.amount || callbackData.AMOUNT || "0";
    const currency =
      callbackData.Currency ||
      callbackData.currency ||
      callbackData.CURRENCY ||
      "EUR";
    const message =
      callbackData.Message ||
      callbackData.message ||
      callbackData.MESSAGE ||
      callbackData.error ||
      callbackData.Error ||
      "";
    const signature =
      callbackData.Signature ||
      callbackData.signature ||
      callbackData.SIGNATURE ||
      "";

    console.log("🔍 [PAYMENT VERIFY] Extracted values:", {
      transactionId,
      orderId,
      statusCode,
      amount,
      currency,
      message,
    });

    // If we don't have at least a transactionId or orderId, the callback might be invalid
    // But we'll still process it if we have a status code
    if (!transactionId && !orderId && !statusCode) {
      console.warn(
        "⚠️ [PAYMENT VERIFY] No transactionId, orderId, or statusCode found in callback"
      );
      // Still return a result with pending status to allow error handling
    }

    // Map status code to our status
    // Note: Actual status codes should be verified with Piraeus Bank documentation
    let status: "success" | "failed" | "pending" | "cancelled" = "pending";

    const statusCodeUpper = statusCode.toUpperCase();
    if (
      statusCodeUpper === "00" ||
      statusCodeUpper === "OK" ||
      statusCodeUpper === "SUCCESS" ||
      statusCodeUpper === "APPROVED"
    ) {
      status = "success";
    } else if (
      statusCodeUpper === "CANCELLED" ||
      statusCodeUpper === "CANCEL" ||
      statusCodeUpper === "CANCELED"
    ) {
      status = "cancelled";
    } else if (
      statusCodeUpper === "PENDING" ||
      statusCodeUpper === "PROCESSING"
    ) {
      status = "pending";
    } else if (statusCode && statusCodeUpper !== "") {
      // If we have a status code but it's not one of the known success codes, treat as failed
      status = "failed";
    }

    // Verify signature if provided (important for security)
    // Note: Signature verification logic should be implemented based on Piraeus Bank's documentation
    if (signature) {
      // TODO: Implement signature verification
      // const isValid = verifySignature(callbackData, signature);
      // if (!isValid) {
      //   console.error('❌ [PAYMENT VERIFY] Invalid signature');
      //   return null; // Invalid signature
      // }
    }

    // Convert amount from cents to main currency unit (if amount is provided)
    // If amount is not provided or is 0, we'll use 0
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
      signature,
    };

    console.log("✅ [PAYMENT VERIFY] Verification result:", result);
    return result;
  } catch (error) {
    console.error("❌ [PAYMENT VERIFY] Error verifying callback:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      callbackData,
    });
    return null;
  }
}

/**
 * Formats currency code for Piraeus Bank
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
