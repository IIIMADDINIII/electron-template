import { expose, wrap } from "comlink-electron-main";
import { app, BrowserWindow, MessageChannelMain } from "electron/main";
import sourceMapSupport from "source-map-support";
import { Api, testApi } from "./apiTest.js";
import { RendererWindow } from "./rendererWindow.js";
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
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  async function run() {
    let { port1, port2 } = new MessageChannelMain();
    expose(new Api(), port1);
    await testApi(wrap<Api>(port2));
  }
  run().catch(console.log);

}


app.whenReady().then(ready).catch(console.log);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});