import { app, BrowserWindow } from "electron";
import { Window } from "./Window.js";
//import sourceMapSupport from "source-map-support";
//sourceMapSupport.install();

const createWindow = () => {
  const win = new Window("@app/renderer", {
    height: 1000,
    width: 1000,

  });
  win.on("message-port", ({ port, id }) => {
    console.log(port, id);
    port.on("message", console.log);
    port.start();
  });
  win.webContents.openDevTools();
  return win;
};

app.whenReady().then(() => {
  let win1 = createWindow();
  win1;
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  async function run() {
    // let { port1, port2 } = new MessageChannelMain();
    // let api = {
    //   value: 10,
    // };
    // expose(api, port1);
    // let port = wrap<typeof api>(port2);
    // console.log(await port.value);
  }
  run().catch(console.log);

});



app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});