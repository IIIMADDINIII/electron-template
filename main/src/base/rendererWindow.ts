import { type BrowserWindowConstructorOptions, type IpcMainEvent } from "electron/main";
import * as path from "path";
import { BrowserWindowEx } from "./browserWindowEx.js";
import { getModuleMain, routeModuleAsHtmlFile } from "./router.js";
import { getProtocolPrefix, getRouter, getSession } from "./safety.js";

/**
 * Options on how to Create a Render Window.
 */
export type RendererWindowOptions = BrowserWindowConstructorOptions & {
  /**
   * Milliseconds to wait for a ReadySignal Used signal from Render Window.
   * If the Renderer sends a Ready Signal Used Signal at the start, the window will show the Window only after the readySignal was received.
   * @default 100
   */
  readySignalUsedTime?: number;
  /**
   * Milliseconds to wait for the ReadySignal.
   * If a ReadySignalUsed was received, the window is only shown is the readySignal was received or this Timeout as elapsed.
   * @default 5000
   */
  readySignalTimeout?: number;
  /**
   * A Prefix to add to all Routes for this window.
   * @default "/rendererWindow"
   */
  routePrefix?: string;
};

/**
 * Create a new Renderer Window asynchronously.
 * @param modulePath - the Path of the Module to render (default = "renderer").
 * @param options - BrowserWindow options.
 * @returns a Promise, wich resolves as soon the Window is shown.
 */
export function createRendererWindow(modulePath: string = "renderer", options?: RendererWindowOptions): Promise<RendererWindow> {
  return new Promise((res, rej) => new RendererWindow(modulePath, options, (error, window) => error !== undefined ? rej(error) : res(window)));
}

/**
 * A Render Window wich makes it easy to create a Window displaying the Contend of a local package.
 * It sets up a Route for the Package to render.
 * Also makes the Window visible after the content finished loading (through a Ready Signal wich can be send from the renderer).
 */
export class RendererWindow extends BrowserWindowEx {
  static defaultRoutePrefix: string = "/rendererWindow";

  /**
   * Create a new Renderer Window.
   * @param modulePath - the Path of the Module to render (default = "renderer").
   * @param options - BrowserWindow options.
   * @param fn - Callback is Called as soon as the Window is shown.
   */
  constructor(modulePath: string = "renderer", options?: RendererWindowOptions, fn: (error: unknown, window: RendererWindow) => void = () => { }) {
    // Setting some default options differently
    let preload = options?.webPreferences?.preload;
    if (preload === undefined) preload = "./preload";
    if (!path.isAbsolute(preload)) preload = getModuleMain(preload);
    let show = options?.show;
    if (show === undefined) show = false;
    let session = options?.webPreferences?.session;
    if (session === undefined) session = getSession();
    // Call Super
    super({ ...options, webPreferences: { ...options?.webPreferences, preload, session, }, show });
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
    let routePrefix = options?.routePrefix !== undefined ? options.routePrefix : RendererWindow.defaultRoutePrefix;
    if (!routePrefix.startsWith("/")) routePrefix = "/" + routePrefix;
    const htmlUrl = getProtocolPrefix() + "local" + routeModuleAsHtmlFile(getRouter(), routePrefix + "/" + modulePath, modulePath);
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
      switch (message) {
        case "isUsed": return readySignalUsed = true;
        case "send": return finish();
      }
    }
    this.webContents.ipc.on("readySignal", readySignalListener);
  }

}