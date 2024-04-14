
import { wait } from "@app/common";
import { MainElement } from "./mainElement.js";
import { initLocalization, readySignalIsUsed, readySignalSend } from "./mainInterface.js";


async function run() {
  readySignalIsUsed();
  await initLocalization();
  await wait(1000);
  document.body.appendChild(new MainElement());
  readySignalSend();

}
run().catch(console.log);