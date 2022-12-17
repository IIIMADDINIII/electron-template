import type { MessageType } from "@app/common/comlink";
import type { Remote } from "comlink-electron-main";
import { BrowserWindow, BrowserWindowConstructorOptions, MessagePortMain } from "electron/main";
import { extendBrowserWindowClass, extendBrowserWindowCtor } from "./util.js";

export interface MessagePortEvent {
  port: MessagePortMain;
  id: string;
  type: MessageType;
  preventDefault(): void;
}

export interface ComlinkEvent {
  wrapped: any;
  id: string;
}


// Saves the API globally for all ComlinkWindows and the MainThread to Use
export function exposeApi(_api: unknown, _id?: undefined, toId?: number | "main"): void {
  if (toId !== undefined) {
    if (toId === "main") {
      //ToDo: Implement Main only list
      return;
    }
    let win = BrowserWindow.fromId(toId);
    if (win === null) throw new Error(`Window Id ${toId} does not exist`);
    if (win)
      return;
  }
}


// Requests the referenced API from any Source
export function getApi<T>(_id?: string, _from?: number | "main"): Remote<T> | undefined {
  return undefined;
}

export interface ComlinkWindow extends BrowserWindow { };
export class ComlinkWindow {


  constructor(options?: BrowserWindowConstructorOptions) {
    let instance = extendBrowserWindowCtor(ComlinkWindow, new BrowserWindow(options));
    return instance;
  }

  test() {
    return "test";
  }

}
extendBrowserWindowClass(ComlinkWindow, BrowserWindow);
