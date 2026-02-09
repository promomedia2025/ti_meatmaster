# Electron Printer Enumeration Guide

## Overview
This guide explains how to implement printer enumeration in the Electron main process to support the admin panel's printer selection feature.

## Required IPC Handler

Add the following IPC handler to your Electron main process (`index.js` or `main.js`):

```javascript
const { ipcMain, webContents } = require('electron');

// Handler to get list of available printers
ipcMain.handle('get-printers', async (event) => {
  try {
    // Get the webContents that sent the request
    const sender = event.sender;
    
    // Use Electron's built-in printer enumeration
    // This requires a BrowserWindow instance
    const printers = await sender.getPrintersAsync();
    
    // Format printer list for the renderer process
    const printerList = printers.map((printer) => ({
      name: printer.name,                    // Device name (used for printing)
      displayName: printer.displayName || printer.name,  // Display name
      description: printer.description || '',  // Optional description
      status: printer.isDefault ? 'Default' : '',  // Status indicator
      isDefault: printer.isDefault,          // Whether it's the default printer
    }));
    
    return printerList;
  } catch (error) {
    console.error('Error getting printers:', error);
    // Return empty array on error - the UI will show a default option
    return [];
  }
});
```

## Alternative Implementation (If `getPrintersAsync` is not available)

If your Electron version doesn't support `getPrintersAsync()`, you can use the synchronous version:

```javascript
const { ipcMain } = require('electron');

ipcMain.handle('get-printers', async (event) => {
  try {
    // Get printers synchronously (requires a BrowserWindow)
    const sender = event.sender;
    
    // Note: This requires Electron 5.0+
    // For older versions, you may need to use a different approach
    const printers = sender.getPrinters();
    
    const printerList = printers.map((printer) => ({
      name: printer.name,
      displayName: printer.displayName || printer.name,
      description: printer.description || '',
      status: printer.isDefault ? 'Default' : '',
      isDefault: printer.isDefault,
    }));
    
    return printerList;
  } catch (error) {
    console.error('Error getting printers:', error);
    return [];
  }
});
```

## Using System Commands (Fallback)

If Electron's printer API doesn't work, you can use system commands:

### Windows (PowerShell)
```javascript
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

ipcMain.handle('get-printers', async () => {
  try {
    const { stdout } = await execAsync('powershell -Command "Get-Printer | Select-Object Name, PrinterStatus | ConvertTo-Json"');
    const printers = JSON.parse(stdout);
    
    return Array.isArray(printers) 
      ? printers.map(p => ({
          name: p.Name,
          displayName: p.Name,
          description: p.PrinterStatus || '',
        }))
      : [{
          name: printers.Name,
          displayName: printers.Name,
          description: printers.PrinterStatus || '',
        }];
  } catch (error) {
    console.error('Error getting printers:', error);
    return [];
  }
});
```

### macOS (lpstat)
```javascript
ipcMain.handle('get-printers', async () => {
  try {
    const { stdout } = await execAsync('lpstat -p | awk \'{print $2}\'');
    const printerNames = stdout.trim().split('\n').filter(Boolean);
    
    return printerNames.map(name => ({
      name: name,
      displayName: name,
      description: '',
    }));
  } catch (error) {
    console.error('Error getting printers:', error);
    return [];
  }
});
```

### Linux (lpstat)
```javascript
ipcMain.handle('get-printers', async () => {
  try {
    const { stdout } = await execAsync('lpstat -p 2>/dev/null | awk \'{print $2}\'');
    const printerNames = stdout.trim().split('\n').filter(Boolean);
    
    return printerNames.map(name => ({
      name: name,
      displayName: name,
      description: '',
    }));
  } catch (error) {
    console.error('Error getting printers:', error);
    return [];
  }
});
```

## Integration with Print Function

The selected printer name is automatically passed to the `print-pdf` IPC handler via the `deviceName` option:

```javascript
ipcMain.on('print-pdf', async (event, options) => {
  const { pdfData, deviceName, ...otherOptions } = options;
  
  // deviceName will be the selected printer name, or undefined for default printer
  // Use deviceName when calling webContents.print() or system print commands
  
  // Example with webContents.print():
  const printOptions = {
    silent: true,
    printBackground: true,
    deviceName: deviceName,  // Use selected printer
    ...otherOptions,
  };
  
  // Print using the selected printer
  // ... (rest of your print logic)
});
```

## Testing

1. Open the admin panel in your Electron app
2. Click the printer options button to open the sidebar
3. The sidebar should automatically load and display available printers
4. Select a printer - it should be saved and used for subsequent prints
5. Click the refresh button to reload the printer list

## Notes

- The printer list is cached in the renderer process and refreshed when the sidebar opens
- If no printers are found, a "Default Printer" option is shown
- The selected printer is stored in localStorage and persists across sessions
- If Electron's printer API is not available, the UI gracefully falls back to showing a default option
