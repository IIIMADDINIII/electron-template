import { ipcRenderer } from "electron";
import type { MessagePortDetail } from "@app/common";
import { getEventPort } from "@app/common";

let ready: boolean = false;
let readyCache: MessagePortDetail<MessagePort>[] = [];

function messagePort({ port, id }: MessagePortDetail<MessagePort>): void {
  return window.postMessage({ type: "message-port", id }, location.origin, [port]);
}

ipcRenderer.on("message-port", (event, id) => {
  if (ready) return messagePort({ port: getEventPort(event), id });
  readyCache.push({ port: getEventPort(event), id });
});

function messagePortReady() {
  if (ready) return;
  for (let portDetail of readyCache) {
    messagePort(portDetail);
  }
  readyCache = [];
  ready = true;
}

function sendMessagePort({ port, id }: MessagePortDetail<MessagePort>): void {
  ipcRenderer.postMessage("message-port", id, [port]);
}

window.addEventListener("message", (event) => {
  if (event.origin !== location.origin || event.source !== window) console.log("origin", event);
  if (event.data.type === "message-port-ready") return messagePortReady();
  if (event.data.type === "send-message-port") return sendMessagePort({ id: event.data.id, port: getEventPort(event) });
});