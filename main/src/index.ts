

import production from "consts:production";
import delay from "delay";
import { app, BrowserWindow } from "electron/main";
import type { AddonHook } from "rollup";
import sourceMapSupport from "source-map-support";
import { Api, testApi } from "./apiTest.js";
import { RendererWindow } from "./base/rendererWindow.js";


if (production) {
  console.log("Prod");
} else {
  console.log("Dev");
}

type test = AddonHook;
let a: test = "";
a;
sourceMapSupport.install();

async function createWindow(): Promise<RendererWindow> {
  const win = await RendererWindow.create(undefined, {
    height: 1000,
    width: 1000,
  });
  win.webContents.openDevTools();
  return win;
};

async function ready() {

  let win1 = await createWindow();
  win1;
  await delay(5000);
  await win1.exposeApi(new Api());
  let api = await win1.getApi<Api>();
  let reload = await win1.getApi<() => void>("reload");
  await testApi(api);
  await reload();
  await delay(5000);
  let api2 = await win1.getApi<Api>();
  await testApi(api2);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

}

app.whenReady().then(ready).catch(console.log);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});