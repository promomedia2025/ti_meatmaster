# Piraeus Bank Payment Integration Setup Guide

This document outlines the setup and configuration required for Piraeus Bank credit card payment integration.

## Overview

The integration uses Piraeus Bank's ePOS payment gateway with the **Redirection method**, which redirects customers to Piraeus Bank's secure payment page. This method simplifies PCI DSS compliance as your system doesn't handle sensitive card information directly.

## Required Credentials from Piraeus Bank

To integrate with Piraeus Bank, you need to obtain the following credentials from Piraeus Bank:

1. **Merchant ID** - Your unique merchant identifier
2. **POS ID** - Point of Sale identifier
3. **Acquirer ID** - Acquiring bank identifier
4. **API Key** (optional, if using API method)
5. **API Secret** (optional, if using API method)
6. **Webhook Secret** (optional, for webhook verification)

### How to Obtain Credentials

Contact Piraeus Bank to set up your merchant account:
- **Email:** e-paymentsServices@piraeusbank.gr
- **Website:** https://www.piraeusbank.gr/en/business-banking/business-banking-products-services/business-payments-collections/card-acceptance

## Environment Variables

Add the following environment variables to your `.env.local` file:

### Test Credentials (Provided by Piraeus Bank)

```env
# Piraeus Bank Payment Gateway Credentials - TEST ENVIRONMENT
PIRAEUS_MERCHANT_ID=2145221159
PIRAEUS_POS_ID=2136744836
PIRAEUS_ACQUIRER_ID=14

# Authentication Credentials (if needed for API/webhook)
PIRAEUS_USERNAME=CO578011
PIRAEUS_PASSWORD=ON212132

# Payment Gateway URLs
# Test environment
PIRAEUS_GATEWAY_URL=https://epos-test.piraeusbank.gr/epos/epos.jsp
# Production environment (use when going live)
# PIRAEUS_GATEWAY_URL=https://epos.piraeusbank.gr/epos/epos.jsp

# Callback URLs (automatically generated, but can be customized)
PIRAEUS_SUCCESS_URL=https://yourdomain.com/payment/success
PIRAEUS_FAILURE_URL=https://yourdomain.com/payment/failed

# Optional: Webhook secret for webhook verification
PIRAEUS_WEBHOOK_SECRET=your_webhook_secret_here
```

### Production Credentials

When you receive production credentials from Piraeus Bank, replace the test values with your production credentials.

## Integration Flow

### 1. Order Creation
When a customer selects "Credit Card" payment and submits an order:
- Order is created with `paymentMethod: "card"` and `paymentStatus: "pending"`
- Order ID is generated

### 2. Payment Initiation
- Frontend calls `/api/payments/piraeus/initiate` with order details
- Backend creates payment request and returns payment URL
- Customer is redirected to Piraeus Bank's secure payment page

### 3. Payment Processing
- Customer enters card details on Piraeus Bank's page
- Piraeus Bank processes the payment
- Customer is redirected back to your site via callback URL

### 4. Payment Callback
- Piraeus Bank redirects to `/api/payments/piraeus/callback`
- Backend verifies payment result
- Order payment status is updated
- Customer is redirected to success/failure page

### 5. Webhook (Optional)
- Piraeus Bank sends server-to-server notification to `/api/payments/piraeus/webhook`
- More reliable than callback redirects
- Updates order payment status

## API Endpoints

### Initiate Payment
**POST** `/api/payments/piraeus/initiate`

Request body:
```json
{
  "orderId": "12345",
  "amount": 25.50,
  "currency": "EUR",
  "description": "Order #12345",
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "customerPhone": "+306912345678"
}
```

Response:
```json
{
  "success": true,
  "paymentUrl": "https://epos.piraeusbank.gr/epos/epos.jsp?...",
  "transactionId": "12345"
}
```

### Payment Callback
**GET** `/api/payments/piraeus/callback`

This endpoint is called by Piraeus Bank after payment processing. It automatically redirects users to the appropriate success/failure page.

### Payment Webhook
**POST** `/api/payments/piraeus/webhook`

This endpoint receives server-to-server notifications from Piraeus Bank about payment status changes.

## Payment Status Pages

### Success Page
**Route:** `/[lang]/payment/success`

Displays success message with order ID and transaction ID.

### Failure Page
**Route:** `/[lang]/payment/failed`

Displays failure message with reason and options to retry.

## Testing

### Test Credentials
Test credentials have been provided by Piraeus Bank:

- **AcquirerID:** 14
- **MerchantID:** 2145221159
- **PosID:** 2136744836
- **Username:** CO578011
- **Password:** ON212132

These credentials are configured in the example environment file (`.env.example.piraeus`). Copy them to your `.env.local` file to start testing.

### Test Gateway URL
Use the test gateway URL for development:
```
https://epos-test.piraeusbank.gr/epos/epos.jsp
```

### Test Cards
Piraeus Bank should provide test card numbers for testing different scenarios:
- Successful payment
- Failed payment
- Cancelled payment
- Insufficient funds
- etc.

**Note:** Contact Piraeus Bank to obtain test card numbers and test scenarios.

## Important Notes

1. **PCI DSS Compliance**: The redirection method simplifies compliance, but you should still follow security best practices.

2. **Signature Verification**: Implement signature verification in the callback/webhook handlers based on Piraeus Bank's documentation to ensure payment authenticity.

3. **Error Handling**: Always handle payment failures gracefully. Orders should be created with "pending" payment status and updated after payment confirmation.

4. **Order Status**: Your backend API should support updating order payment status. The callback/webhook will call:
   ```
   POST /api/orders/{orderId}/payment-status
   ```

5. **Currency**: Currently configured for EUR. Update `formatCurrencyCode` in `lib/piraeus-payment.ts` if you need other currencies.

6. **Amount Format**: Amounts are converted to cents (smallest currency unit) for Piraeus Bank. EUR amounts are multiplied by 100.

7. **DNS/Gateway URL Issues**: If you encounter `DNS_PROBE_FINISHED_NXDOMAIN` errors:
   - Verify the gateway URL with Piraeus Bank support
   - Check if test environment requires VPN or IP whitelisting
   - Ensure your server's IP address is registered with Piraeus Bank
   - Contact e-paymentsServices@piraeusbank.gr for assistance

## Support

For technical support or questions:
- **Piraeus Bank:** e-paymentsServices@piraeusbank.gr
- **Documentation:** Check Piraeus Bank's official documentation for the latest API specifications

## Next Steps

1. Contact Piraeus Bank to obtain merchant credentials
2. Set up test environment and obtain test credentials
3. Configure environment variables
4. Test payment flow in sandbox environment
5. Implement signature verification (if required by Piraeus Bank)
6. Update backend API to handle payment status updates
7. Test thoroughly before going live
8. Switch to production credentials when ready

