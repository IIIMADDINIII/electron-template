import { addMessagePortListener } from "./messagePort.js";
import * as messagePort from "./messagePort.js";

(<any>window).messagePort = messagePort;

addMessagePortListener((event) => {
  console.log(event.detail);
  event.detail.port.addEventListener("message", console.log);
  event.detail.port.start();
});