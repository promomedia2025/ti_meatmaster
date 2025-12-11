/**
 * Utility functions for Electron window management
 */

/**
 * Focuses and restores the Electron window if it's minimized or not in focus
 * This function should be called when important notifications occur (e.g., new orders)
 */
export function focusElectronWindow(): void {
  console.log("🔍 focusElectronWindow: Function called");

  if (typeof window === "undefined") {
    console.warn("⚠️ focusElectronWindow: window is undefined");
    return;
  }

  // Check if Electron API is available
  console.log("🔍 focusElectronWindow: Checking for window.electron", {
    hasElectron: !!window.electron,
    electronType: typeof window.electron,
    electronKeys: window.electron ? Object.keys(window.electron) : [],
  });

  if (!window.electron) {
    console.warn("⚠️ focusElectronWindow: window.electron is not available");
    return;
  }

  try {
    console.log("🔍 focusElectronWindow: Electron API structure:", {
      hasFocus: typeof window.electron.focus === "function",
      hasFocusWindow:
        typeof (window.electron as any).focusWindow === "function",
      hasIpcRenderer: !!window.electron.ipcRenderer,
      hasInvoke: typeof window.electron.ipcRenderer?.invoke === "function",
      hasSend: typeof window.electron.ipcRenderer?.send === "function",
    });

    // Try different possible Electron API structures
    // First check for focusWindow (your Electron app exposes this)
    if (typeof (window.electron as any).focusWindow === "function") {
      console.log("✅ focusElectronWindow: Using focusWindow() method");
      (window.electron as any).focusWindow();
    } else if (window.electron?.focus) {
      console.log("✅ focusElectronWindow: Using direct focus() method");
      window.electron.focus();
    } else if (window.electron?.ipcRenderer?.invoke) {
      console.log(
        "✅ focusElectronWindow: Using ipcRenderer.invoke('focus-window')"
      );
      // Use IPC to communicate with main process to focus/restore window
      // Try "focus-window" first (matches your handler), fallback to "window-focus"
      window.electron.ipcRenderer
        .invoke("focus-window")
        .then((result) => {
          console.log("✅ focusElectronWindow: IPC invoke success", result);
        })
        .catch((error) => {
          console.warn(
            "⚠️ focusElectronWindow: Failed to invoke 'focus-window', trying 'window-focus'",
            error
          );
          // Fallback to alternative channel name
          return window.electron?.ipcRenderer
            ?.invoke("window-focus")
            .then((result) => {
              console.log(
                "✅ focusElectronWindow: IPC invoke 'window-focus' success",
                result
              );
            })
            .catch((fallbackError) => {
              console.warn(
                "⚠️ focusElectronWindow: Both IPC channels failed, using window.focus()",
                fallbackError
              );
              // Fallback to standard window focus
              window.focus();
            });
        });
    } else if (window.electron?.ipcRenderer?.send) {
      console.log(
        "✅ focusElectronWindow: Using ipcRenderer.send('focus-window')"
      );
      // Alternative IPC method (fire and forget)
      // Try "focus-window" first, fallback to "window-focus"
      try {
        window.electron.ipcRenderer.send("focus-window");
        console.log("✅ focusElectronWindow: IPC send('focus-window') called");
      } catch (sendError) {
        console.warn(
          "⚠️ focusElectronWindow: send('focus-window') failed, trying 'window-focus'",
          sendError
        );
        try {
          window.electron.ipcRenderer.send("window-focus");
          console.log(
            "✅ focusElectronWindow: IPC send('window-focus') called"
          );
        } catch (fallbackError) {
          console.warn(
            "⚠️ focusElectronWindow: Both send channels failed",
            fallbackError
          );
        }
      }
    } else {
      console.warn(
        "⚠️ focusElectronWindow: No Electron API methods found, using window.focus()"
      );
      // Fallback: try to use window.focus() which works in some Electron setups
      window.focus();
    }
  } catch (error) {
    console.error("❌ focusElectronWindow: Error in try block", error);
    // Fallback to standard window focus
    try {
      window.focus();
      console.log("✅ focusElectronWindow: Fallback window.focus() succeeded");
    } catch (fallbackError) {
      console.error(
        "❌ focusElectronWindow: Fallback window.focus() also failed",
        fallbackError
      );
    }
  }
}

/**
 * Checks if the current window is in focus
 */
export function isWindowFocused(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return document.hasFocus();
}

/**
 * Checks if Electron API is available
 */
export function isElectron(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return !!window.electron;
}
