import { BrowserWindow } from "electron/main";

export function extendBrowserWindowCtor<T extends abstract new (...args: any) => any>(to: T, baseInstance: any): InstanceType<T> {
  baseInstance.__proto__ = to.prototype;
  return baseInstance;
}


export function extendBrowserWindowClass(to: any, baseClass: any) {
  to.prototype.__proto__ = baseClass.prototype;
  to.prototype.constructor = BrowserWindow;
}