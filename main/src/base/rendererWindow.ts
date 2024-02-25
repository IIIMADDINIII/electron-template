import type { BrowserWindowConstructorOptions } from "electron/main";
import { BrowserWindowEx } from "./browserWindowEx.js";

export type RendererWindowOptions = BrowserWindowConstructorOptions & { webPreferences?: { preload?: never; }; };

export class RendererWindow extends BrowserWindowEx {

  static create(module: string = "renderer", options?: RendererWindowOptions): Promise<RendererWindow> {
    return new Promise((res, rej) => new RendererWindow(module, options, (error, window) => error !== undefined ? rej(error) : res(window)));
  }

  constructor(module: string = "renderer", options?: RendererWindowOptions, fn: (error: unknown, window: RendererWindow) => void = () => { }) {
    super({ ...options, webPreferences: { preload: require.resolve("@app/preload") }, });
    let file = require.resolve("@app/" + module);
    if (file.endsWith(".html") || file.endsWith(".htm")) {
      this.loadFile(require.resolve("@app/" + module))
        .then(() => fn(undefined, this))
        .catch((e) => {
          this.destroy();
          fn(e, this);
        });
    } else {
      throw new Error("Renderer File must be a htm or html file!");
    }
  }

}