
import { wait } from "@app/common";
import { MainElement } from "./mainElement.js";
import { readySignalIsUsed, readySignalSend } from "./mainInterface.js";


async function run() {
  readySignalIsUsed();
  await wait(1000);
  document.body.appendChild(new MainElement());
  readySignalSend();

}
run().catch(console.log);