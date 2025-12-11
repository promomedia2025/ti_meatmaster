# Electron Window Focus Integration Guide

## 1. Main Process (main.js or main.ts)

Add the IPC handler to call your existing `focusWindow()` function:

```javascript
const { ipcMain, BrowserWindow } = require('electron');

// Your existing focusWindow function
function focusWindow() {
  if (!mainWindow) {
    return;
  }

  // Check if window is minimized
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  // Check if window is not focused
  if (!mainWindow.isFocused()) {
    mainWindow.focus();
  }

  // Bring window to front
  mainWindow.show();
}

// Add IPC handler for window-focus
ipcMain.handle('window-focus', async () => {
  try {
    focusWindow();
    return { success: true };
  } catch (error) {
    console.error('Error focusing window:', error);
    return { success: false, error: error.message };
  }
});

// Also handle the 'send' method (fire and forget)
ipcMain.on('window-focus', () => {
  focusWindow();
});
```

## 2. Preload Script (preload.js)

Update your preload script to expose the API:

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Direct focus method (calls IPC internally)
  focus: () => {
    ipcRenderer.send('window-focus');
  },

  // IPC Renderer methods
  ipcRenderer: {
    // Send a message to the main process (fire and forget)
    send: (channel, ...args) => {
      const validChannels = ['window-focus'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args);
      }
    },

    // Invoke a method in the main process and wait for response
    invoke: (channel, ...args) => {
      const validChannels = ['window-focus'];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      return Promise.reject(new Error(`Invalid channel: ${channel}`));
    },

    // Listen for messages from main process
    on: (channel, func) => {
      const validChannels = ['window-focus-response'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },

    // Remove listener
    removeListener: (channel, func) => {
      ipcRenderer.removeListener(channel, func);
    },
  },
});
```

## 3. BrowserWindow Configuration

Make sure your BrowserWindow is created with the preload script:

```javascript
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true, // Important for security
    nodeIntegration: false, // Important for security
  },
});
```

## Summary

The web app will call:
- `window.electron.focus()` → triggers `ipcRenderer.send('window-focus')` → calls your `focusWindow()`
- `window.electron.ipcRenderer.invoke('window-focus')` → calls your `focusWindow()` via IPC handler
- `window.electron.ipcRenderer.send('window-focus')` → calls your `focusWindow()` via IPC listener

All three methods will work and call your existing `focusWindow()` function!

