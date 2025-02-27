import type { IpcApi } from "@app/common";
import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

// Exposing IPC Messages to the Render Window.
contextBridge.exposeInMainWorld("ipc", {
  postMessage(channel: string, data: unknown, transfer?: MessagePort[]) {
    ipcRenderer.postMessage(channel, data, transfer);
  },
  on(channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void): () => void {
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.off(channel, listener);
  },
  once(channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void): () => void {
    ipcRenderer.once(channel, listener);
    return () => ipcRenderer.off(channel, listener);
  },
  removeAllListeners(channel?: string): void {
    ipcRenderer.removeAllListeners(channel);
  }
} satisfies IpcApi);