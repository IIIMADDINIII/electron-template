


export const ipcName = "comlink";

export enum MessageType {
  messagePort = "MessagePort",
  comlink = "Comlink",
}

export type Message = MessagePortMessage | ComlinkMessage;
export interface MessagePortMessage {
  type: MessageType.messagePort;
  id: string;
}
export interface ComlinkMessage {
  type: MessageType.comlink;
  id: string;
}

export function getEventPort<T>(event: { readonly ports: ReadonlyArray<T>; }): T {
  let port = event.ports[0];
  if (port === undefined) throw new Error("Received MessagePort Event without an MessagePort!");
  return port;
}