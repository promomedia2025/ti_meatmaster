# Testing Printer Options Feature

## Quick Test Steps

### 1. Start the Development Server (if not running)
```bash
npm run dev
```
The app should be available at `http://localhost:3000`

### 2. Navigate to Admin Panel
1. Go to `http://localhost:3000/admin/login`
2. Log in with your admin credentials
3. You should see the admin dashboard with the left sidebar

### 3. Test the Printer Options Sidebar

#### Step 1: Locate the Button
- Look in the left admin sidebar
- You should see a button with a printer icon labeled "Επιλογες εκτυπωτη"
- It should be at the bottom of the sidebar menu

#### Step 2: Open the Sidebar
- Click the "Επιλογες εκτυπωτη" button
- A right sidebar should slide in from the right side of the screen
- It should have a header saying "Επιλογές Εκτυπωτή" with a printer icon

#### Step 3: Select Paper Sizes
- You should see 4 paper size options:
  - **A4** (210 × 297 mm)
  - **A5** (148 × 210 mm)
  - **80mm** (thermal)
  - **58mm** (69.95mm thermal)
- Click on each option and verify:
  - The selected option gets an orange highlight
  - An orange dot appears on the right side
  - A success toast notification appears saying "Επιλέχθηκε: [size name]"

#### Step 4: Test Persistence
1. Select a paper size (e.g., "80mm")
2. Close the sidebar by clicking the X button or clicking outside
3. Reopen the sidebar by clicking "Επιλογες εκτυπωτη" again
4. **Expected**: The previously selected size should still be highlighted

#### Step 5: Test localStorage (Developer Console)
1. Open browser Developer Tools (F12)
2. Go to the "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Expand "Local Storage"
4. Click on your domain (e.g., `http://localhost:3000`)
5. Look for the key: `admin_printer_paper_size`
6. **Expected**: Value should match your selected paper size (e.g., "80mm", "A4", etc.)

#### Step 6: Test After Page Reload
1. Select a paper size
2. Reload the page (F5 or Ctrl+R)
3. Navigate back to the admin panel
4. Open the printer options sidebar again
5. **Expected**: Your selected size should still be selected

### 4. Visual Verification Checklist

- [ ] Button appears in the left sidebar
- [ ] Button has printer icon
- [ ] Right sidebar slides in smoothly from right
- [ ] Right sidebar has correct header and close button
- [ ] All 4 paper size options are visible
- [ ] Dimensions are displayed correctly for each option
- [ ] Selected option is highlighted in orange
- [ ] Orange dot indicator appears on selected option
- [ ] Toast notification appears on selection
- [ ] Selection persists after closing/reopening sidebar
- [ ] Selection persists after page reload
- [ ] Backdrop/dark overlay appears behind sidebar
- [ ] Clicking outside closes the sidebar
- [ ] Close button (X) works correctly

### 5. Browser Console Testing

You can also test the helper functions in the browser console:

```javascript
// Import the functions (in browser console after page loads)
// These are exported from the component, so you can test them

// Get current paper size
const size = localStorage.getItem('admin_printer_paper_size');

// Set a paper size manually
localStorage.setItem('admin_printer_paper_size', 'A4');
// Then reload and check if A4 is selected

// Clear the storage
localStorage.removeItem('admin_printer_paper_size');
// Then reload and check if default (A4) is selected
```

## Troubleshooting

### If the button doesn't appear:
- Check browser console for errors
- Make sure you're logged in as admin
- Verify the component is imported correctly in `admin-sidebar.tsx`

### If the sidebar doesn't open:
- Check browser console for JavaScript errors
- Verify z-index values (sidebar should be z-[70], backdrop z-[60])
- Check if there are any CSS conflicts

### If selection doesn't persist:
- Check browser console for localStorage errors
- Verify localStorage is enabled in your browser
- Check if you're in incognito/private mode (localStorage might be restricted)

### If styles look wrong:
- Check if Tailwind CSS is working correctly
- Verify all classes are being applied
- Check browser DevTools for CSS conflicts

## Testing Different Scenarios

1. **Mobile View**: Resize browser to mobile size and test sidebar behavior
2. **Different Paper Sizes**: Select each of the 4 options and verify each works
3. **Rapid Selection**: Quickly click between different options
4. **Multiple Tabs**: Open admin panel in multiple tabs, select different sizes, verify they don't conflict

## Expected Behavior Summary

- ✅ Button visible in left sidebar
- ✅ Right sidebar slides in from right
- ✅ 4 paper size options displayed
- ✅ Selection highlights in orange
- ✅ Toast notification on selection
- ✅ Selection saved to localStorage
- ✅ Selection persists after reload
- ✅ Sidebar closes on backdrop click
- ✅ Sidebar closes on X button click

