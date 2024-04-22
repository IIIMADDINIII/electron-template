import sourceMapSupport from "source-map-support";
sourceMapSupport.install();
// leave empty line so this import does not get moved down
import { initialiseSafety } from "./base/safety.js";
initialiseSafety();
// leave empty line so this import does not get moved down
import { app, BrowserWindow } from "electron/main";
import { createRendererWindow, RendererWindow } from "./base/rendererWindow.js";
import { routeDir, routeLocales } from "./base/router.js";

async function createWindow(): Promise<RendererWindow> {
  const win = await createRendererWindow(undefined, {
    height: 1000,
    width: 1000,
  });
  return win;
};


async function ready() {
  routeLocales();
  routeDir("./assets/");

  let win1 = await createWindow();
  win1;
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

}

app.whenReady().then(ready).catch(console.error);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});