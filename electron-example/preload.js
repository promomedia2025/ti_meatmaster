/**
 * Preload script for Electron
 * This runs in the renderer process before the web page loads
 * It exposes safe APIs to the renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Direct focus method (optional - can be implemented here or via IPC)
  focus: () => {
    ipcRenderer.send('window-focus');
  },

  // IPC Renderer methods
  ipcRenderer: {
    // Send a message to the main process (fire and forget)
    send: (channel, ...args) => {
      // Whitelist channels for security
      const validChannels = ['window-focus'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args);
      }
    },

    // Invoke a method in the main process and wait for response
    invoke: (channel, ...args) => {
      // Whitelist channels for security
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

  // Print functionality (if you have it)
  print: (options) => {
    ipcRenderer.send('print', options);
  },
});

