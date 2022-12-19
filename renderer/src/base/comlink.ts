import { ApiId, ApiOrigin, ApiPrefab, apiRequest, ApiTarget, doneMessage, InternalWindowApiPrefab, messageId } from "@app/common/comlink";
import { expose, isMessagePort, proxy, Remote, TransferHandler, transferHandlers, wrap } from "comlink-electron-renderer";

// Basic Types
type InternalWindowApi = InternalWindowApiPrefab<MessagePort>;
type Api = ApiPrefab<MessagePort>;

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

// Requests an comlink channel from the API Origin
async function resolveApi<T>(api: Api): Promise<Remote<T>> {
  return wrap<T>(await api());
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

// Requests the referenced API from any Source 
export async function getApi<T>(id: ApiId = "", origin?: ApiOrigin, timeout: number = defaultTimeoutMs): Promise<Remote<T>> {
  // ToDo: Implement Caching
  let intApi = await internalApi;
  return await resolveApi(await intApi.getApi(id, origin, timeout));
}