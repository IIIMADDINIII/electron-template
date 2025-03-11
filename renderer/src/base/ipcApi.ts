import type { IpcApi, IpcApiListener, IpcApiListenerRemover } from "@app/common";

declare global {
  interface Window {
    /**
     * Interface to the Main Process via ipc Messages.
     */
    ipc?: IpcApi;
  }
}

/**
 * Test if IPC communication with main process is available.
 * @returns true if IPC interface exists.
 */
export function isIpcAvailable(): boolean {
  return window.ipc !== undefined;
}

/**
 * Sending a Message to main process.
 * @param channel - on which channel should the message be sent.
 * @param message - the message to send.
 * @param transfer - Optional list of MessagePorts to transfer.
 */
export function ipcPostMessage(channel: string, message: unknown, transfer?: MessagePort[]): void {
  if (window.ipc === undefined) throw new Error("Missing IPC Interface from Preload Script");
  window.ipc.postMessage(channel, message, transfer);
}

/**
 * Register a callback function to be called when a message for a channel is received.
 * @param channel - Channel to receive data from.
 * @param listener - function to call when data is received.
 * @returns a function to unregister the listener.
 */
export function ipcOn(channel: string, listener: IpcApiListener): IpcApiListenerRemover {
  if (window.ipc === undefined) throw new Error("Missing IPC Interface from Preload Script");
  return window.ipc.on(channel, listener);
}

/**
 * Register a callback function to be called when the next message for a channel is received.
 * @param channel - Channel to receive data from.
 * @param listener - function to call when data is received.
 * @returns a function to unregister the listener.
 */
export function ipcOnce(channel: string, listener: IpcApiListener): IpcApiListenerRemover {
  if (window.ipc === undefined) throw new Error("Missing IPC Interface from Preload Script");
  return window.ipc.once(channel, listener);
}

/**
 * Remove all listeners of an specific channel.
 * @param channel - Channel to remove all Listeners.
 */
export function ipcRemoveAllListeners(channel?: string): void {
  if (window.ipc === undefined) throw new Error("Missing IPC Interface from Preload Script");
  window.ipc.removeAllListeners(channel);
};