import "./base/sourceMapSupport.js";
// Leave Line Empty so this happens first and does not get moved down
import { app, BrowserWindow } from "electron/main";
import { initLocalizationByDir } from "./base/localization.js";
import { routeDir, routeLocales } from "./base/router.js";
import { initialiseSafety } from "./base/safety.js";
import { SampleWindow } from "./SampleWindow.js";

initialiseSafety();

async function ready() {
  initLocalizationByDir();
  routeLocales();
  routeDir("./assets/");

  let win1 = new SampleWindow();
  win1;
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) new SampleWindow();
  });

}

app.whenReady().then(ready).catch(console.error);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});