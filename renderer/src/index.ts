import { Api, testApi } from "./apiTest.js";
import * as comlink from "./comlink.js";
import { MainElement } from "./mainElement.js";

declare global {
  interface Window {
    comlink: typeof comlink;
  }
}

window.comlink = comlink;

async function run() {
  document.body.appendChild(new MainElement());
  comlink.setDefaultTimeout(10000);
  await comlink.exposeApi(new Api(), "", "main");
  await comlink.exposeApi(() => {
    console.log("reload");
    setTimeout(() => location.reload(), 100);
  }, "reload", "main");
  let api = await comlink.getApi<Api>();
  await testApi(api);
}
run().catch(console.log);