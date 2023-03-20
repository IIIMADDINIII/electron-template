import { ApiId, ApiOrigin, ApiPrefab, apiRequest, ApiTarget, CacheId, CacheMap, doneMessage, InternalWindowApiPrefab, messageId } from "@app/common/comlink";
import { expose, isMessagePort, proxy, Remote, TransferHandler, transferHandlers, wrap } from "comlink-electron-renderer";

// Basic Types
type InternalWindowApi = InternalWindowApiPrefab<MessagePort>;
type Api = ApiPrefab<MessagePort>;

const apisCache: CacheMap = new Map();

// Make it possible to transfer MessagePorts
const portsTransferHandler: TransferHandler<MessagePort, 0> = {
  canHandle: (val): val is MessagePort =>
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

// Create Internal Api Connection
let internalApi = new Promise<Remote<InternalWindowApi>>((res) => {
  let { port1, port2 } = new MessageChannel();
  window.postMessage({ id: messageId, type: apiRequest }, location.origin, [port2]);
  window.addEventListener("message", function listener(event) {
    if (event.origin !== location.origin || event.source !== window) return;
    if (event.data.id !== messageId) return;
    if (event.data.type !== doneMessage) return;
    res(wrap<InternalWindowApi>(port1));
    ready = true;
    window.removeEventListener("message", listener);
  });
});
let ready: boolean = false;

// Creates an Api Factory
function createApi(api: unknown): Api {
  return proxy(async function () {
    let { port1, port2 } = new MessageChannel();
    expose(api, port1);
    return port2;
  });
}

// Default timeout for getApi requests
export let defaultTimeoutMs: number = 1000;

// Allows setting a different default timeout
export function setDefaultTimeout(ms: number) {
  defaultTimeoutMs = ms;
}

// is the connection to the main thread established
export function isReady(): boolean {
  return ready;
}

// wait for the connection to the main thread to be established
export async function waitReady(): Promise<void> {
  await internalApi;
}

// Saves the API globally for all ComlinkWindows and the MainThread to Use (except toWinId Parameter is set)
export async function exposeApi(api: unknown, id: ApiId = "", target?: ApiTarget): Promise<void> {
  let intApi = await internalApi;
  return await intApi.exposeApi(createApi(api), id, target);
}

// Removes the API stored to free resources (further getApi calls to that API will fail)
export async function deleteApi(id: ApiId = "", toWinId?: ApiTarget): Promise<void> {
  let intApi = await internalApi;
  return await intApi.deleteApi(id, toWinId);
}

// removes all entries in the Cache
export function clearAllCache(): void {
  for (let cache of apisCache.values()) {
    cache.removeListener();
  }
  apisCache.clear();
}

// clear a specific Cache entry
export function clearCacheId(id: ApiId = "", origin?: ApiOrigin): void {
  let cacheId: CacheId = `${id}-${origin}`;
  let cache = apisCache.get(cacheId);
  if (cache !== undefined) cache.removeListener();
  apisCache.delete(cacheId);
}

// Requests the referenced API from any Source 
export async function getApi<T>(id: ApiId = "", origin?: ApiOrigin, timeout: number = defaultTimeoutMs): Promise<Remote<T>> {
  let cacheId: CacheId = `${id}-${origin}`;
  let cache = apisCache.get(cacheId);
  if (cache) return cache.api as Remote<T>;
  let intApi = await internalApi;
  function listener(): void {
    console.log("close", id, origin);
    //clearCacheId(id, origin);
  }
  let getApi = await intApi.getApi(id, origin, timeout, proxy(listener));
  let port = await getApi();
  function removeListener() {
    port.removeEventListener("close", listener);
  }
  // ToDo: Remove hack
  port.addEventListener("close", listener);
  let api = wrap<T>(port);
  apisCache.set(cacheId, { api, removeListener });
  return api;
}