const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel, args) => ipcRenderer.invoke(channel, args),
  listen: (channel, callback) => {
    // Mimic Tauri's event listener structure: listener callback receives { payload }
    const subscription = (event, data) => callback({ payload: data });
    ipcRenderer.on(channel, subscription);
    
    // Return a function to unregister the listener (matching Tauri unlisten pattern)
    return Promise.resolve(() => {
      ipcRenderer.removeListener(channel, subscription);
    });
  }
});
