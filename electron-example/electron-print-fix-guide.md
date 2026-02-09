# Electron Print PDF Fix Guide - Preventing Centering

## Problem
When printing PDFs from Electron, the content is centered instead of aligned to the left edge (especially for thermal printers).

## Solution
The Electron main process must use the correct print settings when handling the `print-pdf` IPC message.

## Required Electron Main Process Code

### Option 1: Using `webContents.printToPDF()` (Recommended)

```javascript
const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

ipcMain.on('print-pdf', async (event, options) => {
  const { pdfData, paperSize, margins, scaleFactor, pageSize } = options;
  
  try {
    // Decode base64 PDF data
    const pdfBuffer = Buffer.from(pdfData, 'base64');
    
    // Save to temporary file
    const tempDir = require('os').tmpdir();
    const tempFilePath = path.join(tempDir, `invoice-${Date.now()}.pdf`);
    fs.writeFileSync(tempFilePath, pdfBuffer);
    
    // For thermal printers, use system print command with exact page size
    if (paperSize === '80mm' || paperSize === '58mm') {
      // Use system print command (works on Windows, macOS, Linux)
      const printCommand = process.platform === 'win32'
        ? `powershell -Command "Start-Process -FilePath '${tempFilePath}' -Verb Print"`
        : process.platform === 'darwin'
        ? `lpr -o media=${paperSize} -o fit-to-page "${tempFilePath}"`
        : `lp -o media=${paperSize} "${tempFilePath}"`;
      
      exec(printCommand, (error) => {
        if (error) {
          console.error('Print error:', error);
          // Fallback: open with default PDF viewer
          require('electron').shell.openPath(tempFilePath);
        } else {
          // Clean up temp file after a delay
          setTimeout(() => {
            try {
              fs.unlinkSync(tempFilePath);
            } catch (e) {
              console.error('Error deleting temp file:', e);
            }
          }, 5000);
        }
      });
    } else {
      // For standard paper sizes, use Electron's print dialog
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });
      
      printWindow.loadURL(`file://${tempFilePath}`);
      
      printWindow.webContents.on('did-finish-load', () => {
        printWindow.webContents.print({
          silent: options.silent || false,
          printBackground: options.printBackground || true,
          deviceName: options.deviceName,
          // CRITICAL: Set margins to none to prevent centering
          margins: margins || { marginType: 'none' },
          scaleFactor: scaleFactor || 1,
          pageSize: pageSize || undefined,
        }, (success, failureReason) => {
          if (success) {
            console.log('Print successful');
          } else {
            console.error('Print failed:', failureReason);
          }
          printWindow.close();
          // Clean up temp file
          setTimeout(() => {
            try {
              fs.unlinkSync(tempFilePath);
            } catch (e) {
              console.error('Error deleting temp file:', e);
            }
          }, 1000);
        });
      });
    }
  } catch (error) {
    console.error('Error handling print-pdf:', error);
  }
});
```

### Option 2: Using PDF.js or PDFKit (More Control)

If you need more control, you can use a PDF library:

```javascript
const PDFDocument = require('pdfkit');
const fs = require('fs');

ipcMain.on('print-pdf', async (event, options) => {
  const { pdfData, paperSize, margins } = options;
  
  try {
    // Decode base64
    const pdfBuffer = Buffer.from(pdfData, 'base64');
    const tempFilePath = path.join(require('os').tmpdir(), `invoice-${Date.now()}.pdf`);
    
    // Write PDF to temp file
    fs.writeFileSync(tempFilePath, pdfBuffer);
    
    // Use system print with exact settings
    const printOptions = {
      margins: margins || { marginType: 'none' },
      scaleFactor: 1,
      pageSize: paperSize === '80mm' ? { width: 226.77, height: 0 } 
                : paperSize === '58mm' ? { width: 164.41, height: 0 }
                : undefined,
    };
    
    // Print using system command with no margins
    const printCommand = process.platform === 'win32'
      ? `powershell -Command "$printer = Get-Printer | Select-Object -First 1; Start-Process -FilePath '${tempFilePath}' -Verb PrintTo -ArgumentList $printer.Name"`
      : process.platform === 'darwin'
      ? `lpr -o media=${paperSize} -o page-left=0 -o page-right=0 -o page-top=0 -o page-bottom=0 "${tempFilePath}"`
      : `lp -o media=${paperSize} -o page-left=0 -o page-right=0 -o page-top=0 -o page-bottom=0 "${tempFilePath}"`;
    
    exec(printCommand, (error) => {
      if (error) {
        console.error('Print error:', error);
      }
      // Clean up after delay
      setTimeout(() => {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (e) {}
      }, 5000);
    });
  } catch (error) {
    console.error('Error:', error);
  }
});
```

## Key Settings to Prevent Centering

1. **Margins**: Must be `{ marginType: 'none' }` or `{ marginType: 'custom', top: 0, bottom: 0, left: 0, right: 0 }`
2. **Scale Factor**: Must be `1` (no scaling)
3. **Page Size**: Must match exactly (80mm = 226.77 points, 58mm = 164.41 points)
4. **No Headers/Footers**: Disable if possible

## Testing

After implementing, test with:
- 80mm thermal printer
- 58mm thermal printer
- A4 paper

The content should align to the left edge, not be centered.

## Alternative: Use Browser Print (Fallback)

If Electron printing continues to have issues, the code already falls back to browser print which works correctly. You can also force browser print by not detecting Electron or by adding a setting to prefer browser print.
