# Afghanistan Country Issue in Orders

## Problem
The order address is showing "Afghanistan" as the country instead of Greece.

## Root Cause Analysis

### The Flow:
1. **Checkout** → User enters/selects address
2. **Order Submission** → `deliveryAddress.fullAddress` is sent to backend
3. **Backend Storage** → Address is stored with country from geocoding
4. **Order Display** → Address shown in invoice/order details

### Problem Areas:

#### 1. **Reverse Geocoding (`/api/geocode/route.ts`)**
   - **Line 72**: Nominatim reverse geocoding doesn't restrict to Greece
   - **No country validation**: Whatever Nominatim/Google returns is used as-is
   - **No filtering**: Could return any country if coordinates are ambiguous

#### 2. **Forward Geocoding (`/api/geocode/route.ts`)**
   - **Line 103**: Google geocoding has `country:GR` restriction ✅ (Good!)
   - **Line 160**: Nominatim has `countrycodes=gr` restriction ✅ (Good!)
   - But reverse geocoding (coordinates → address) has NO restrictions ❌

#### 3. **Address Storage (`components/add-address-modal.tsx`)**
   - **Line 191**: Defaults to "Ελλάδα" if country is missing ✅
   - But if Google/Nominatim returns wrong country, it uses that ❌

#### 4. **Checkout Address Submission (`app/[lang]/checkout/page.tsx`)**
   - **Line 419-426**: Only sends `city`, `fullAddress`, `coordinates`
   - **No country validation** before sending ❌

### Why Afghanistan Appears:
1. **Nominatim/Google reverse geocoding** might be misidentifying coordinates
2. **No country restriction** on reverse geocoding calls
3. **No validation** that country should be Greece
4. The wrong country gets stored in the backend and shows in orders

## Recommended Fixes

### Fix 1: Restrict Reverse Geocoding to Greece
Add country restriction to Nominatim reverse geocoding calls.

### Fix 2: Validate Country in Reverse Geocoding Response
Validate that returned country is Greece, and override if not.

### Fix 3: Add Country Validation in Checkout
Validate country before submitting order.

### Fix 4: Filter Country from Display
Strip/ignore country information in address display if it's not Greece.

Let me implement these fixes!

