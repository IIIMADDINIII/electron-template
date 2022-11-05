import type { MessagePortDetail } from "@app/common";
import { getEventPort } from "@app/common";

declare global {
  interface WindowEventMap {
    "message-port": CustomEvent<MessagePortDetail<MessagePort>>;
  }
  interface MessagePortEventMap {
    "close": MessageEvent;
  }
}

let readyCalled: boolean = false;

window.addEventListener("message", (event: MessageEvent<{ type: string, id?: string; }>) => {
  if (event.origin !== location.origin || event.source !== window) return;
  if (event.data.type !== "message-port") return;
  window.dispatchEvent(new CustomEvent<MessagePortDetail<MessagePort>>("message-port", { detail: { port: getEventPort(event), id: event.data.id } }));
});

export function ready() {
  if (readyCalled) return;
  window.postMessage({ type: "message-port-ready" }, location.origin, []);
  readyCalled = true;
}

type Listener = (this: Window, ev: CustomEvent<MessagePortDetail<MessagePort>>) => any;
export function addMessagePortListener(listener: Listener, options?: boolean | AddEventListenerOptions, isReady: boolean = true): void {
  window.addEventListener("message-port", listener, options);
  if (isReady) ready();
};

export function sendMessagePort(port: MessagePort, id?: string): void {
  window.postMessage({ type: "send-message-port", id }, location.origin, [port]);
}

export function shareMessageChannel(id?: string): MessagePort {
  let { port1, port2 } = new MessageChannel();
  sendMessagePort(port1, id);
  return port2;
}