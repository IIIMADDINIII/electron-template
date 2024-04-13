
import { wait } from "@app/common";
import { MainElement } from "./mainElement.js";
import { getLocale, getTargetLocales, initLocalization, readySignalIsUsed, readySignalSend, setLocale } from "./mainInterface.js";


async function run() {
  readySignalIsUsed();
  await initLocalization();
  (window as any).getLocale = getLocale;
  (window as any).setLocale = setLocale;
  (window as any).getTargetLocales = getTargetLocales;

  await wait(1000);
  document.body.appendChild(new MainElement());
  readySignalSend();

}
run().catch(console.log);