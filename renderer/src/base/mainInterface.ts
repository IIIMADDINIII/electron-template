import { REMOTE_OBJECT_MESSAGE_CHANNEL, type ReadySignalApi } from "@app/common";
import { createObjectStore, type ObjectStore, type ObjectStoreOptions, type Transferable } from "@iiimaddiniii/remote-objects";

/**
 * Listener for IPC Communication from main process.
 * @param event - object containing an array of all transferred MessagePorts unter the ports key.
 * @param message - the Message to send to main.
 */
type Listener = (event: { ports: MessagePort[]; }, message: unknown) => void;

/**
 * Function to call if the Listener should be removed again.
 */
type ListenerRemover = () => void;

declare global {
  interface Window {
    /**
     * Interface to the Main Process via ipc Messages.
     */
    ipc?: {
      /**
       * Sending a Message to main process.
       * @param channel - on which channel should the message be sent.
       * @param message - the message to send.
       * @param transfer - Optional list of MessagePorts to transfer.
       */
      postMessage(channel: string, message: unknown, transfer?: MessagePort[]): void;
      /**
       * Register a callback function to be called when a message for a channel is received.
       * @param channel - Channel to receive data from.
       * @param listener - function to call when data is received.
       * @returns a function to unregister the listener.
       */
      on(channel: string, listener: Listener): ListenerRemover;
      /**
       * Register a callback function to be called when the next message for a channel is received.
       * @param channel - Channel to receive data from.
       * @param listener - function to call when data is received.
       * @returns a function to unregister the listener.
       */
      once(channel: string, listener: Listener): ListenerRemover;
      /**
       * Remove all listeners of an specific channel.
       * @param channel - Channel to remove all Listeners.
       */
      removeAllListeners(channel?: string): void;
    };
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
export function ipcOn(channel: string, listener: Listener): ListenerRemover {
  if (window.ipc === undefined) throw new Error("Missing IPC Interface from Preload Script");
  return window.ipc.on(channel, listener);
}

/**
 * Register a callback function to be called when the next message for a channel is received.
 * @param channel - Channel to receive data from.
 * @param listener - function to call when data is received.
 * @returns a function to unregister the listener.
 */
export function ipcOnce(channel: string, listener: Listener): ListenerRemover {
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

/**
 * ObjectStore used for remote. Is undefined before Initialization.
 */
export let objectStore: ObjectStore | undefined = undefined;

/**
 * Options on how to create the ObjectStore.
 */
export type InitRemoteOptions = ObjectStoreOptions & {
  /**
   * Time in milliseconds after which a request is canceled with an TimeoutError.
   * @default 10000
   */
  timeout?: number;
};

/**
 * Initializes the Communication to the Remote side.
 * @param options - Options on how to create the ObjectStore.
 * @returns The ObjectStore just created.
 */
export function initRemote(options: InitRemoteOptions = {}): ObjectStore {
  objectStore = createObjectStore({
    ...options,
    sendMessage(message) {
      ipcPostMessage(REMOTE_OBJECT_MESSAGE_CHANNEL, message);
    },
    setNewMessageHandler(newMessageHandler) {
      ipcOn(REMOTE_OBJECT_MESSAGE_CHANNEL, (_, message) => {
        newMessageHandler(message as Transferable);
      });
    },
  });
  return objectStore;
}

/**
 * Returns the ObjectStore for communication with the RendererWindow Class on main Process. THrows if it gets called before initialization.
 * @returns The ObjectStore created for communication with the RendererWindow on the Main Process.
 */
export function remote(): ObjectStore {
  if (objectStore !== undefined) return objectStore;
  throw new Error("ObjectStore remote is not initialized. Please initialize it before use");
}

/**
 * Sends the Ready Signal used event to the RendererWindow.
 * Call this as soon as Possible in you code.
 * The RendererWindow will delay the show of the Window after you call readySignalSend().
 */
export async function readySignalIsUsed(): Promise<void> {
  await remote().getRemoteObject<ReadySignalApi>("readySignal").isUsed();
}

/**
 * Sends the Ready Signal event to the RendererWindow.
 * This signalizes to the RendererWindow that the Window is ready to be shown.
 * This only works if the readySignalUsed was send early enough.
 */
export async function readySignalSend() {
  await remote().getRemoteObject<ReadySignalApi>("readySignal").send();
}