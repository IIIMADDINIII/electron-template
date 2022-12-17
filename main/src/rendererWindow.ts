import type { BrowserWindowConstructorOptions } from "electron/main";
import { ComlinkWindow } from "./comlinkWindow.js";
import { extendBrowserWindowClass, extendBrowserWindowCtor } from "./util.js";

export type RendererWindowOptions = BrowserWindowConstructorOptions & { webPreferences?: { preload?: never; }; };


export interface RendererWindow extends ComlinkWindow { }
export class RendererWindow {

  static async create(module: string = "renderer", options?: RendererWindowOptions) {
    let instance = extendBrowserWindowCtor(RendererWindow, new ComlinkWindow({ ...options, webPreferences: { preload: require.resolve("@app/preload") }, }));
    let file = require.resolve("@app/" + module);
    if (file.endsWith(".html") || file.endsWith(".htm")) {
      await instance.loadFile(require.resolve("@app/" + module)).catch(console.error);
    } else {
      throw new Error("Renderer File must be a htm or html file!");
    }
    return instance;
  }

  constructor() {
    throw new Error("Don't use this constructor. Call and await the static Function create instead.");

  }

  test2() {
    return "test2";
  }

}
extendBrowserWindowClass(RendererWindow, ComlinkWindow);