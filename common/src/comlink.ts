
// Message Constants
export const messageId = "6c67f9b9-099d-48b9-a7b0-b1ca8444a268";
export const apiRequest = "api";
export const doneMessage = "done";

// Basic Types
export type ApiOrigin = number | "main";
export type ApiTarget = number | "main";
export type ApiId = string;
export type ApiPrefab<T> = () => Promise<T>;

export type ExposeListenerPrefab<T> = (id: ApiId, origin: ApiOrigin, target: ApiTarget | undefined, api: ApiPrefab<T>, preventDefault: () => void) => void;

export interface InternalWindowApiPrefab<T> {
  exposeApi(api: ApiPrefab<T>, id: ApiId, target?: ApiTarget): Promise<void>;
  deleteApi(id: ApiId, target?: ApiTarget): Promise<void>;
  getApi(id: ApiId, origin?: ApiOrigin): Promise<ApiPrefab<T> | "None">;
  addIntExposeListener(fn: ExposeListenerPrefab<T>, key: string): void;
  removeIntExposeListener(fn: ExposeListenerPrefab<T> | string): void;
  getWinId(): number;
}


export function getPortFromEvent<T>(event: { readonly ports: ReadonlyArray<T>; }): T {
  let port = event.ports[0];
  if (port === undefined) throw new Error("Received MessagePort Event without an MessagePort!");
  return port;
}


