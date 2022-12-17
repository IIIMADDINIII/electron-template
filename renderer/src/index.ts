//import { addMessagePortListener } from "./comlink.js";
//import * as messagePort from "./comlink.js";
import { Api, testApi } from "./apiTest.js";
import { expose, wrap } from "comlink-electron-renderer";

//(<any>window).messagePort = messagePort;

// addMessagePortListener((event) => {
//   console.log(event.detail);
//   event.detail.port.addEventListener("message", console.log);
//   event.detail.port.start();
// });

async function run() {
  let { port1, port2 } = new MessageChannel();
  expose(new Api(), port1);
  await testApi(wrap<Api>(port2));
}
run().catch(console.log);