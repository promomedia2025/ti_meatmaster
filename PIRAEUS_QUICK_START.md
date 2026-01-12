# Piraeus Bank Payment - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Add Environment Variables

Copy the test credentials to your `.env.local` file:

```env
# Test Credentials (Already provided)
PIRAEUS_MERCHANT_ID=2145221159
PIRAEUS_POS_ID=2136744836
PIRAEUS_ACQUIRER_ID=14
PIRAEUS_USERNAME=CO578011
PIRAEUS_PASSWORD=ON212132

# Test Gateway URL
PIRAEUS_GATEWAY_URL=https://epos-test.piraeusbank.gr/epos/epos.jsp
```

**Or** copy from `.env.example.piraeus`:
```bash
# Copy the example file and rename it
cp .env.example.piraeus .env.local
# Then add the Piraeus variables to your existing .env.local
```

### Step 2: Restart Your Development Server

After adding environment variables, restart your Next.js development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

### Step 3: Test the Payment Flow

1. Go to your checkout page
2. Add items to cart
3. Select **"Πληρωμή με κάρτα"** (Credit Card Payment)
4. Complete the order
5. You should be redirected to Piraeus Bank's test payment page

### Step 4: Test with Test Cards

Contact Piraeus Bank to obtain test card numbers for testing:
- Successful payments
- Failed payments
- Cancelled payments

## ✅ What's Already Configured

- ✅ Payment service utility (`lib/piraeus-payment.ts`)
- ✅ Payment initiation API (`/api/payments/piraeus/initiate`)
- ✅ Payment callback handler (`/api/payments/piraeus/callback`)
- ✅ Payment webhook handler (`/api/payments/piraeus/webhook`)
- ✅ Success page (`/[lang]/payment/success`)
- ✅ Failure page (`/[lang]/payment/failed`)
- ✅ Checkout page integration (credit card option)

## 🔧 Next Steps

1. **Test the integration** with the provided test credentials
2. **Contact Piraeus Bank** to get test card numbers
3. **Update your backend API** to handle payment status updates:
   ```
   POST /api/orders/{orderId}/payment-status
   ```
4. **Test thoroughly** before going live
5. **Get production credentials** from Piraeus Bank when ready
6. **Switch to production** by updating environment variables

## 📝 Important Notes

- The integration uses the **Redirection method** - customers are redirected to Piraeus Bank's secure payment page
- Orders are created with "pending" payment status
- Payment status is updated after successful payment via callback
- Make sure your backend API supports payment status updates

## 🆘 Troubleshooting

### Payment URL not generated
- Check that all environment variables are set correctly
- Verify credentials are correct
- Check server logs for errors

### DNS Error: "This site can't be reached" / "DNS_PROBE_FINISHED_NXDOMAIN"
If you see a DNS error when redirecting to the payment gateway:

1. **Verify the Gateway URL**: The test gateway URL might not be publicly accessible or may have changed
   - Current test URL: `https://epos-test.piraeusbank.gr/epos/epos.jsp`
   - Contact Piraeus Bank to confirm the correct test gateway URL
   - Email: e-paymentsServices@piraeusbank.gr

2. **Check Network Access**: 
   - The test environment might require VPN or specific network access
   - Verify if your network/IP is whitelisted with Piraeus Bank

3. **Try Production URL** (if you have production credentials):
   ```env
   PIRAEUS_GATEWAY_URL=https://epos.piraeusbank.gr/epos/epos.jsp
   ```

4. **Verify DNS Resolution**:
   - Try accessing the gateway URL directly in your browser
   - Use `nslookup epos-test.piraeusbank.gr` or `ping epos-test.piraeusbank.gr` to check DNS resolution

5. **Contact Piraeus Bank Support**:
   - Provide them with the error message and your server's IP address
   - Ask them to verify your IP is whitelisted (if required)
   - Request the correct test gateway URL if it has changed

### Redirect not working
- Ensure callback URLs are accessible
- Check that PIRAEUS_GATEWAY_URL is correct
- Verify the gateway URL is reachable
- Check browser console for DNS/network errors

### Payment callback not received
- Check that your callback URL is publicly accessible
- Verify Piraeus Bank has your callback URL configured
- Check server logs for callback requests

## 📚 Full Documentation

See `PIRAEUS_PAYMENT_SETUP.md` for complete documentation.

