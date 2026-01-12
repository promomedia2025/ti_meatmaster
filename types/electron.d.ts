// Type definitions for Electron API exposed to renderer process
interface ElectronAPI {
  print?: (options?: {
    silent?: boolean;
    printBackground?: boolean;
    deviceName?: string;
  }) => void;
  focus?: () => void;
  playNotificationSound?: () => void;
  ipcRenderer?: {
    send: (channel: string, ...args: any[]) => void;
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    on: (channel: string, func: (...args: any[]) => void) => void;
    removeListener: (channel: string, func: (...args: any[]) => void) => void;
  };
}

declare global {
  interface Window {
    electron?: ElectronAPI;
    require?: (module: string) => any;
  }
}

export {};
