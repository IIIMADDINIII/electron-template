import { apiRequest, getPortFromEvent, messageId } from "@app/common/comlink";
import { ipcRenderer } from "electron";

ipcRenderer.on(messageId, (_event, data) => {
  window.postMessage({ ...data, id: messageId }, location.origin);
});

window.addEventListener("message", (event) => {
  if (event.origin !== location.origin || event.source !== window) return;
  if (event.data.id !== messageId) return;
  if (event.data.type !== apiRequest) return;
  ipcRenderer.postMessage(messageId, undefined, [getPortFromEvent(event)]);
});