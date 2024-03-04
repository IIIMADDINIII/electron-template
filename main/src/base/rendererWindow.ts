import { type BrowserWindowConstructorOptions } from "electron/main";
import * as path from "path";
import { BrowserWindowEx } from "./browserWindowEx.js";
import { getModuleMain, getProtocolPrefix, routeModuleAsHtmlFile } from "./safety.js";

export type RendererWindowOptions = BrowserWindowConstructorOptions;

export class RendererWindow extends BrowserWindowEx {

  static create(modulePath: string = "renderer", options?: RendererWindowOptions): Promise<RendererWindow> {
    return new Promise((res, rej) => new RendererWindow(modulePath, options, (error, window) => error !== undefined ? rej(error) : res(window)));
  }

  constructor(modulePath: string = "renderer", options?: RendererWindowOptions, fn: (error: unknown, window: RendererWindow) => void = () => { }) {
    let preload = options?.webPreferences?.preload;
    if (preload === undefined) preload = "./preload";
    if (!path.isAbsolute(preload)) preload = getModuleMain(preload);
    super({ ...options, webPreferences: { preload }, });
    const htmlUrl = getProtocolPrefix() + "local" + routeModuleAsHtmlFile("/" + modulePath, modulePath);
    this.loadURL(htmlUrl)
      .then(() => fn(undefined, this))
      .catch((e) => {
        this.destroy();
        fn(e, this);
      });
  }

}