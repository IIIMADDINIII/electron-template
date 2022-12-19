import { ApiId, ApiOrigin, ApiPrefab, ApiTarget, doneMessage, ExposeListenerPrefab, getPortFromEvent, InternalWindowApiPrefab, messageId } from "@app/common/comlink";
import { expose, isMessagePort, proxy, Remote, TransferHandler, transferHandlers, wrap } from "comlink-electron-main";
import type { BrowserWindowConstructorOptions, IpcMainEvent, MessagePortMain } from "electron/main";
import { MessageChannelMain } from "electron/main";
import { BrowserWindowEx } from "./BrowserWindowEx.js";

// Basic Types
type Api = ApiPrefab<MessagePortMain>;
type InternalWindowApi = InternalWindowApiPrefab<MessagePortMain>;
type ExposeListener = ExposeListenerPrefab<MessagePortMain>;
type ApisMap = Map<ApiId, Map<ApiOrigin, Api>>;
type ExposeMap = Map<ApiTarget | undefined, Set<ApiId>>;

// Api's targeted to main thread
const mainApis: ApisMap = new Map();
// Untargeted Api's
const globalApis: ApisMap = new Map();
// Private symbol for hidden exposeApi function
const ApiSym = Symbol();
// Event Listeners
const exposeListeners: Set<ExposeListener> = new Set();
const intExposeListeners: Map<ExposeListener | string, ExposeListener> = new Map();
// Default timeout for getApi requests
export let defaultTimeoutMs: number = 1000;

// Allows setting a different default timeout
export function setDefaultTimeout(ms: number) {
  defaultTimeoutMs = ms;
}

// Make it possible to transfer MessagePorts
const portsTransferHandler: TransferHandler<MessagePortMain, 0> = {
  canHandle: (val): val is MessagePortMain =>
    isMessagePort(val),
  serialize(port) {
    return [0, [port]];
  },
  deserialize(_value, ports) {
    let port = ports[0];
    if (!port) throw new Error("Did not receive a MessagePort!");
    return port;
  },
};
transferHandlers.set("ports", portsTransferHandler);

// Creates an Api Factory
function createApi(api: unknown): Api {
  return proxy(async function () {
    let { port1, port2 } = new MessageChannelMain();
    expose(api, port1);
    return port2;
  });
}

// Helper Function to store an API in an ApisMap
function setApiInMap(map: ApisMap, api: Api, id: ApiId, origin: ApiOrigin): void {
  let originMap = map.get(id);
  if (originMap === undefined) {
    originMap = new Map();
    map.set(id, originMap);
  }
  originMap.set(origin, api);
};

// Helper Function to clear the API stored in a map
function deleteApiInMap(map: ApisMap, id: ApiId, origin: ApiOrigin): void {
  let originMap = map.get(id);
  if (originMap === undefined) return;
  originMap.delete(origin);
}

// helper function to find the matching api in a map
function findApiInMap(map: ApisMap, id: ApiId, origin?: ApiOrigin): Api | "Multiple" | "None" {
  let originMap = map.get(id);
  if (originMap === undefined) return "None";
  if (originMap.size === 0) return "None";
  if (origin === undefined) {
    if (originMap.size > 1) return "Multiple";
    return originMap.values().next().value;
  }
  let api = originMap.get(origin);
  if (api === undefined) return "None";
  return api;
}

// Requests an comlink channel from the API Origin
async function resolveApi<T>(api: Api): Promise<Remote<T>> {
  return wrap<T>(await api());
}

// Tries to resolve an BrowserWindow.id to an ComlinkWindow Instance
function getComlinkWin(id: number): ComlinkWindow | undefined {
  let win = BrowserWindowEx.fromId(id);
  if (win === null) return undefined;
  if (!(win instanceof ComlinkWindow)) return undefined;
  return win;
}

// returns the map for a Target
function getTargetMap(target?: ApiTarget): ApisMap | undefined {
  if (target === undefined) return globalApis;
  if (target === "main") return mainApis;
  return getComlinkWin(target)?.[ApiSym];
}

// registers the Api in the right Api Map
async function exposeApiFrom(api: Api, origin: ApiOrigin, id: ApiId = "", target?: ApiTarget): Promise<void> {
  if (await emitExpose(api, id, origin, target)) return;
  let map = getTargetMap(target);
  if (map === undefined) throw new Error(`Window Id ${id} does not belong to an ComlinkWindow Instance`);
  return setApiInMap(map, api, id, origin);
}

// Remove a Api from a map
async function deleteApiFrom(origin: ApiOrigin, id: ApiId = "", target?: ApiTarget): Promise<void> {
  let map = getTargetMap(target);
  if (map === undefined) throw new Error(`Window Id ${id} does not belong to an ComlinkWindow Instance`);
  return deleteApiInMap(map, id, origin);
}

// Saves the API globally for all ComlinkWindows and the MainThread to Use (except toWinId Parameter is set)
export async function exposeApi(api: unknown, id: ApiId = "", target?: ApiTarget): Promise<void> {
  return await exposeApiFrom(createApi(api), "main", id, target);
}

// Removes the API stored to free resources (further getApi calls to that API will fail)
export async function deleteApi(id: ApiId = "", target?: ApiTarget): Promise<void> {
  return await deleteApiFrom("main", id, target);
}

// Requests the referenced API from any Source; Timeout=0: Don't wait for the api to be available
export async function getApi<T>(id: ApiId = "", origin?: ApiOrigin, timeout: number = defaultTimeoutMs): Promise<Remote<T>> {
  // ToDo: Implement Caching
  // ToDo: simplify function
  let api = findApiInMap(mainApis, id, origin);
  if (typeof api !== "string") return await resolveApi(api);
  if (api === "Multiple") throw new Error(`There are multiple Api's registered with Id "${id}" for the main Thread`);
  api = findApiInMap(globalApis, id, origin);
  if (typeof api !== "string") return await resolveApi(api);
  if (api === "Multiple") throw new Error(`There are multiple Api's registered with Id "${id}" globally`);
  if (timeout <= 0) throw new Error(`There are no Api's registered fpr id "${id}" on main Thread or globally`);
  return new Promise((res, rej) => {
    let tm = setTimeout(() => {
      removeIntExposeListener(listener);
      rej(new Error(`There are no Api's registered fpr id "${id}" on main Thread or globally`));
    }, timeout);
    let listener = (evId: ApiId, evOrigin: ApiOrigin, evTarget: ApiTarget | undefined, evApi: Api) => {
      if (evId !== id) return;
      if (evTarget && evTarget !== "main") return;
      if (origin && evOrigin !== origin) return;
      clearTimeout(tm);
      removeIntExposeListener(listener);
      res(resolveApi(evApi));
    };
    addIntExposeListener(listener);
  });
}

// register a function which gets called every time a api gets exposed
export function addExposeListener(fn: ExposeListener): void {
  exposeListeners.add(fn);
}

// remove registered function 
export function removeExposeListener(fn: ExposeListener): void {
  exposeListeners.delete(fn);
}

// register a function for internal use (is called after all public listeners)
function addIntExposeListener(fn: ExposeListener, key: ExposeListener | string = fn) {
  intExposeListeners.set(key, fn);
}

// remove registered function 
function removeIntExposeListener(key: ExposeListener | string): void {
  intExposeListeners.delete(key);
}

// call all expose listeners
async function emitExpose(api: Api, id: ApiId, origin: ApiOrigin, target?: ApiTarget): Promise<boolean> {
  let prevented: boolean = false;
  let preventDefault = proxy(() => {
    prevented = true;
  });
  for (let listener of exposeListeners.values()) {
    await listener(id, origin, target, api, preventDefault);
  }
  if (prevented) return prevented;
  for (let listener of intExposeListeners.values()) {
    await listener(id, origin, target, api, preventDefault);
  }
  return prevented;
}

// BrowserWindow Enhanced with Comlink functionality
export class ComlinkWindow extends BrowserWindowEx {
  [ApiSym]: ApisMap = new Map();
  #exposing: ExposeMap = new Map();
  #id: number;
  constructor(options?: BrowserWindowConstructorOptions) {
    super(options);
    this.#id = this.id;
    // Listen for messages from the comlink module in the Window
    this.webContents.ipc.on(messageId, this.#ipcMessage.bind(this));
  }

  // gets called as soon as the window loaded the comlink module
  #ipcMessage(event: IpcMainEvent) {
    let port = getPortFromEvent(event);
    let api: InternalWindowApi = {
      exposeApi: this.#exposeApiFromWindow.bind(this),
      deleteApi: this.#deleteApiFromWindow.bind(this),
      getApi: this.#getApiFromWindow.bind(this),
      getWinId: this.#getWinId.bind(this),
      addIntExposeListener,
      removeIntExposeListener,
    };
    expose(api, port);
    this.webContents.postMessage(messageId, { type: doneMessage, value: this.#id });
    port.once("close", this.#remoteClosed.bind(this));
  }

  // Called when exposeApi is called in the Window
  async #exposeApiFromWindow(api: Api, id: ApiId = "", target?: ApiTarget): Promise<void> {
    let idSet = this.#exposing.get(target);
    if (idSet === undefined) {
      idSet = new Set();
      this.#exposing.set(target, idSet);
    }
    idSet.add(id);
    return await exposeApiFrom(api, this.#id, id, target);
  };

  // Called when deleteApi is called in the Window
  async #deleteApiFromWindow(id: ApiId, target?: ApiTarget): Promise<void> {
    return await deleteApiFrom(this.#id, id, target);
  };

  // called when the remote internal Api gets destroyed (Properly Reloading)
  #remoteClosed() {
    for (let [target, idSet] of this.#exposing.entries()) {
      let map = getTargetMap(target);
      if (map === undefined) continue;
      for (let id of idSet.values()) {
        let originMap = map.get(id);
        if (originMap === undefined) continue;
        originMap.delete(this.#id);
      }
    }
    this.#exposing = new Map();
  }

  // Gets the Window Id
  #getWinId(): number {
    return this.#id;
  }

  // try's to get the specified api
  async #getApiFromWindow(id: ApiId, origin?: ApiOrigin): Promise<Api | "None"> {
    let api = findApiInMap(this[ApiSym], id, origin);
    if (typeof api !== "string") return api;
    if (api === "Multiple") throw new Error(`There are multiple Api's registered with Id "${id}" for the main Thread`);
    api = findApiInMap(globalApis, id, origin);
    if (typeof api !== "string") return api;
    if (api === "Multiple") throw new Error(`There are multiple Api's registered with Id "${id}" globally`);
    return "None";
  }

  // Expose a an Api only to this Window
  async exposeApi(api: unknown, id: ApiId = ""): Promise<void> {
    return await exposeApiFrom(createApi(api), "main", id, this.#id);
  };

  // Delete a Api exposed only to this window
  async deleteApi(id: ApiId = ""): Promise<void> {
    return await deleteApiFrom("main", id, this.#id);
  };

  // gets a Api from this Window
  async getApi<T>(id?: ApiId): Promise<Remote<T>> {
    return await getApi(id, this.#id);
  }

}
