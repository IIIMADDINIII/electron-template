import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("readySignal", {
  isUsed() {
    ipcRenderer.postMessage("readySignal", "isUsed");
  },
  send() {
    ipcRenderer.postMessage("readySignal", "send");
  }
});