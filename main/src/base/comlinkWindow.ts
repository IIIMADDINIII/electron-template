import { ApiId, ApiOrigin, ApiPrefab, ApiTarget, doneMessage, getPortFromEvent, InternalWindowApiPrefab, messageId } from "@app/common/comlink";
import { expose, isMessagePort, proxy, Remote, TransferHandler, transferHandlers, wrap } from "comlink-electron-main";
import delay from "delay";
import type { BrowserWindowConstructorOptions, IpcMainEvent, MessagePortMain } from "electron/main";
import { MessageChannelMain } from "electron/main";
import { BrowserWindowEx } from "./BrowserWindowEx.js";

// Basic Types
type Api = ApiPrefab<MessagePortMain>;
type InternalWindowApi = InternalWindowApiPrefab<MessagePortMain>;
// Definition of the listeners
export interface ExposeListenerEvent {
  id: ApiId;
  origin: ApiOrigin;
  target: ApiTarget | undefined;
  api: Api;
  preventDefault: () => void;
}
export type ExposeListener = (event: ExposeListenerEvent) => void;
export interface GetListenerEvent {
  id: ApiId;
  origin: ApiOrigin | undefined;
  target: ApiTarget;
  preventDefault: () => void;
}
export type GetListener = (event: GetListenerEvent) => void;
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
const intExposeListeners: Set<ExposeListener> = new Set();
const getListeners: Set<GetListener> = new Set();
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
function getTargetMap(target?: ApiTarget): ApisMap {
  if (target === undefined) return globalApis;
  if (target === "main") return mainApis;
  let win = getComlinkWin(target);
  if (win === undefined) throw new Error(`Window Id ${target} does not belong to an ComlinkWindow Instance`);
  return win[ApiSym];
}

// registers the Api in the right Api Map
async function intExposeApi(api: Api, origin: ApiOrigin, id: ApiId = "", target?: ApiTarget): Promise<void> {
  if (emitExpose(api, id, origin, target)) return;
  return setApiInMap(getTargetMap(target), api, id, origin);
}

// Remove a Api from a map
async function intDeleteApi(origin: ApiOrigin, id: ApiId = "", target?: ApiTarget): Promise<void> {
  return deleteApiInMap(getTargetMap(target), id, origin);
}

// Saves the API globally for all ComlinkWindows and the MainThread to Use (except toWinId Parameter is set)
export async function exposeApi(api: unknown, id: ApiId = "", target?: ApiTarget): Promise<void> {
  return await intExposeApi(createApi(api), "main", id, target);
}

// Removes the API stored to free resources (further getApi calls to that API will fail)
export async function deleteApi(id: ApiId = "", target?: ApiTarget): Promise<void> {
  return await intDeleteApi("main", id, target);
}

// helper function to find the matching api in a an array of maps (first in array has highest priority)
function findApiInMaps(maps: ApisMap[], id: ApiId, origin?: ApiOrigin): Api | undefined {
  for (let map of maps) {
    let originMap = map.get(id);
    if (originMap === undefined || originMap.size === 0) continue;
    if (origin === undefined) {
      if (originMap.size > 1) throw new Error(`There are multiple Api's registered with Id "${id}"`);
      return originMap.values().next().value;
    }
    let api = originMap.get(origin);
    if (api === undefined) continue;
    return api;
  }
  return undefined;
}

// tests if an api definition from  an event matches the requested api
export function matchesRequest(id: ApiId, origin: ApiOrigin | undefined, target: ApiTarget, event: ExposeListenerEvent): boolean {
  if (event.id !== id) return false;
  if (event.target !== undefined && event.target !== target) return false;
  if (origin !== undefined && origin !== event.origin) return false;
  return true;
}

// general implementation for the getApi functionality
function intGetApi(id: ApiId = "", origin: ApiOrigin | undefined, target: ApiTarget, timeout: number): Promise<Api> | Api {
  // if request got blocked, pretend it was not found
  if (emitGet(id, origin, target)) return delay.reject(timeout, { value: new Error(`There are no Api's registered for id "${id}"`) });
  // Check if Api is already registered
  let api = findApiInMaps([getTargetMap(target), globalApis], id, origin);
  if (api !== undefined) return api;
  if (timeout <= 0) throw new Error(`There are no Api's registered for id "${id}"`);
  // Api was not registered and we should wait a bit
  return new Promise((resolve, reject) => {
    // Timeout handler cleanup and rejecting promise
    let timeoutId = setTimeout(() => {
      removeIntExposeListener(listener);
      reject(new Error(`There are no Api's registered for id "${id}"`));
    }, timeout);
    // Listener for new API's
    let listener: ExposeListener = (event) => {
      if (!matchesRequest(id, origin, target, event)) return;
      clearTimeout(timeoutId);
      removeIntExposeListener(listener);
      resolve(event.api);
    };
    addIntExposeListener(listener);
  });
}

// Requests the referenced API from any Source; Timeout=0: Don't wait for the api to be available
export async function getApi<T>(id: ApiId = "", origin?: ApiOrigin, timeout: number = defaultTimeoutMs): Promise<Remote<T>> {
  // ToDo: Implement Caching
  return await resolveApi(await intGetApi(id, origin, "main", timeout));
}

// register a function which gets called every time a api gets exposed
export function addExposeListener(listener: ExposeListener): void {
  exposeListeners.add(listener);
}

// remove registered function 
export function removeExposeListener(listener: ExposeListener): void {
  exposeListeners.delete(listener);
}

// register a function for internal use (is called after all public listeners)
function addIntExposeListener(listener: ExposeListener) {
  intExposeListeners.add(listener);
}

// remove registered function 
function removeIntExposeListener(fn: ExposeListener): void {
  intExposeListeners.delete(fn);
}

// call all expose listeners
function emitExpose(api: Api, id: ApiId, origin: ApiOrigin, target?: ApiTarget): boolean {
  let prevented: boolean = false;
  let event: ExposeListenerEvent = {
    api,
    id,
    origin,
    target,
    preventDefault: () => { prevented = true; },
  };
  for (let listener of exposeListeners.values()) {
    listener(event);
  }
  if (prevented) return prevented;
  for (let listener of intExposeListeners.values()) {
    listener(event);
  }
  return prevented;
}

// register a function which gets called every time a api gets exposed
export function addGetListener(listener: GetListener): void {
  getListeners.add(listener);
}

// remove registered function 
export function removeGetListener(listener: GetListener): void {
  getListeners.delete(listener);
}

// call all expose listeners
function emitGet(id: ApiId, origin: ApiOrigin | undefined, target: ApiTarget): boolean {
  let prevented: boolean = false;
  let event: GetListenerEvent = {
    id,
    origin,
    target,
    preventDefault: () => { prevented = true; },
  };
  for (let listener of getListeners.values()) {
    listener(event);
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
    return await intExposeApi(api, this.#id, id, target);
  };

  // Called when deleteApi is called in the Window
  async #deleteApiFromWindow(id: ApiId, target?: ApiTarget): Promise<void> {
    return await intDeleteApi(this.#id, id, target);
  };

  // try's to get the specified api
  async #getApiFromWindow(id: ApiId, origin: ApiOrigin | undefined, timeout: number): Promise<Api> {
    return await intGetApi(id, origin, this.#id, timeout);
  }

  // called when the remote internal Api gets destroyed (Properly Reloading)
  #remoteClosed() {
    for (let [target, idSet] of this.#exposing.entries()) {
      try {
        let map = getTargetMap(target);
        for (let id of idSet.values()) {
          let originMap = map.get(id);
          if (originMap === undefined) continue;
          originMap.delete(this.#id);
        }
      } catch { }
    }
    this.#exposing = new Map();
  }

  // Expose a an Api only to this Window
  async exposeApi(api: unknown, id: ApiId = ""): Promise<void> {
    return await intExposeApi(createApi(api), "main", id, this.#id);
  };

  // Delete a Api exposed only to this window
  async deleteApi(id: ApiId = ""): Promise<void> {
    return await intDeleteApi("main", id, this.#id);
  };

  // gets a Api from this Window
  async getApi<T>(id?: ApiId): Promise<Remote<T>> {
    return await getApi(id, this.#id);
  }

}
