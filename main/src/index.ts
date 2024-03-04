import sourceMapSupport from "source-map-support";
sourceMapSupport.install();
// leave empty line so this import does not get moved down
import { initialiseSafety } from "./base/safety.js";
initialiseSafety();

import { app, BrowserWindow } from "electron/main";
import { RendererWindow } from "./base/rendererWindow.js";

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

}

app.whenReady().then(ready).catch(console.log);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});