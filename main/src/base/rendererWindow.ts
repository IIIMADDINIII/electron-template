import { type BrowserWindowConstructorOptions, type IpcMainEvent } from "electron/main";
import * as path from "path";
import { BrowserWindowEx } from "./browserWindowEx.js";
import { getModuleMain, getProtocolPrefix, routeModuleAsHtmlFile } from "./safety.js";

export type RendererWindowOptions = BrowserWindowConstructorOptions & { readySignalUsedTime?: number, readySignalTimeout?: number, routePrefix?: string; };

export class RendererWindow extends BrowserWindowEx {
  static create(modulePath: string = "renderer", options?: RendererWindowOptions): Promise<RendererWindow> {
    return new Promise((res, rej) => new RendererWindow(modulePath, options, (error, window) => error !== undefined ? rej(error) : res(window)));
  }

  constructor(modulePath: string = "renderer", options?: RendererWindowOptions, fn: (error: unknown, window: RendererWindow) => void = () => { }) {
    // Setting some default options differently
    let preload = options?.webPreferences?.preload;
    if (preload === undefined) preload = "./preload";
    if (!path.isAbsolute(preload)) preload = getModuleMain(preload);
    let show = options?.show;
    if (show === undefined) show = false;
    // Call Super
    super({ ...options, webPreferences: { preload }, show });
    // Loading done => Show Window and cleanup
    const finish = () => {
      if (done) return;
      done = true;
      this.show();
      if (usedTimer) clearTimeout(usedTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      this.webContents.ipc.removeListener("readySignal", readySignalListener);
      fn(undefined, this);
    };
    // Timeouts for graceful display
    const readySignalUsedTime = options?.readySignalUsedTime || 100;
    const readySignalTimeout = options?.readySignalTimeout || 5000;
    // variables for graceful display
    let readySignalUsed = false;
    let done = false;
    let usedTimer: NodeJS.Timeout | undefined = undefined;
    let timeoutTimer: NodeJS.Timeout | undefined = undefined;
    // Adding route for page
    const routePrefix = options?.routePrefix || "window";
    const htmlUrl = getProtocolPrefix() + "local" + routeModuleAsHtmlFile("/" + routePrefix + "/" + modulePath, modulePath);
    // Load side
    this.loadURL(htmlUrl)
      .then(() => {
        // If window is already visible no need to start timers
        if (show) return finish();
        // start Timers for graceful display of the window
        usedTimer = setTimeout(() => {
          if (readySignalUsed) return;
          finish();
        }, readySignalUsedTime);
        timeoutTimer = setTimeout(finish, readySignalTimeout);
      })
      .catch((e) => {
        this.destroy();
        fn(e, this);
      });
    // signal from renderer to handle graceful display
    function readySignalListener(_event: IpcMainEvent, message: unknown) {
      if (message === "isUsed") return readySignalUsed = true;
      if (message === "send") return finish();
    }
    this.webContents.ipc.on("readySignal", readySignalListener);
  }

}