
/**
 * Declare That something like a Message Port Exists. 
 * If it is not declared some where else later, it defines an empty Object.
 */
declare global {
  interface MessagePort { }
}

/**
 * Definition of a Listener for the RemoteObjectsApi
 * @public
 */
export type IpcApiListener = (event: { ports: MessagePort[]; }, message: unknown) => void;

/**
 * Function to call if the Listener should be removed again.
 * @public
 */
export type IpcApiListenerRemover = () => void;

/**
 * Api for the Remote Object to send Data to Main and Receive Data from Main.
 * @public
 */
export type IpcApi = {
  /**
   * Sending a Message to main process.
   * @param channel - on which channel should the message be sent.
   * @param message - the message to send.
   * @param transfer - Optional list of MessagePorts to transfer.
   */
  postMessage(channel: string, data: unknown, transfer?: MessagePort[]): void;
  /**
   * Register a callback function to be called when a message for a channel is received.
   * @param channel - Channel to receive data from.
   * @param listener - function to call when data is received.
   * @returns a function to unregister the listener.
   */
  on(channel: string, listener: IpcApiListener): IpcApiListenerRemover;
  /**
   * Register a callback function to be called when the next message for a channel is received.
   * @param channel - Channel to receive data from.
   * @param listener - function to call when data is received.
   * @returns a function to unregister the listener.
   */
  once(channel: string, listener: IpcApiListener): IpcApiListenerRemover;
  /**
   * Remove all listeners of an specific channel.
   * @param channel - Channel to remove all Listeners.
   */
  removeAllListeners(channel?: string): void;
};