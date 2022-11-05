import { BrowserWindow, BrowserWindowConstructorOptions, MessageChannelMain, MessagePortMain } from "electron";
import type TypedEmitter from "typed-emitter";
import type { MessagePortDetail } from "@app/common";
import { getEventPort } from "@app/common";

type MessageEvents = {
  "message-port": (MessagePortDetail: MessagePortDetail<MessagePortMain>) => void;
};


export class Window extends (BrowserWindow as new (options?: BrowserWindowConstructorOptions) => (BrowserWindow & TypedEmitter<MessageEvents>)) {
  constructor(module: string, options?: BrowserWindowConstructorOptions) {
    super({ ...options, webPreferences: { preload: require.resolve("@app/preload") }, });
    this.webContents.ipc.on("message-port", (event, id) => {
      this.emit("message-port", { port: getEventPort(event), id });
    });
    this.loadFile(require.resolve(module));
  }

  sendMessagePort(port: MessagePortMain, id?: string): void {
    this.webContents.postMessage("message-port", id, [port]);
  }

  shareMessageChannel(id?: string): MessagePortMain {
    let { port1, port2 } = new MessageChannelMain();
    this.sendMessagePort(port1, id);
    return port2;
  }

}