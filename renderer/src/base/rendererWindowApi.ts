import { RENDERER_WINDOW_REMOTE_OBJECTS_CHANNEL, type RendererWindowApi } from "@app/common";
import { createObjectStore, type ObjectStore, type ObjectStoreOptions, type Transferable } from "@iiimaddiniii/remote-objects";
import { configureLocalization, str, type RuntimeConfiguration } from "@lit/localize";
import { html } from "lit";
import { ipcOn, ipcPostMessage } from "./ipcApi.js";


/**
 * Options on how to create the ObjectStore.
 */
export type CreateObjectStoreOptions = ObjectStoreOptions & {
  /**
   * Time in milliseconds after which a request is canceled with an TimeoutError.
   * @default 10000
   */
  timeout?: number;
};

/**
 * Create a ObjectStore which communicates over ipc wih main.
 * @param channel - Ipc Channel to use for this object Store.
 * @param options - Options on how to create the ObjectStore.
 * @returns the Object Store Instance.
 */
export function createObjectStoreOnChannel(channel: string, options: CreateObjectStoreOptions = {}): ObjectStore {
  let off = () => { };
  return createObjectStore({
    ...options,
    sendMessage(message) {
      ipcPostMessage(channel, message);
    },
    setNewMessageHandler(newMessageHandler) {
      off = ipcOn(channel, (_, message) => {
        newMessageHandler(message as Transferable);
      });
    },
    disconnectedHandler() {
      off();
    }
  });
}

/**
 * ObjectStore used for remote. Is undefined before Initialization.
 */
export let objectStore: ObjectStore | undefined = undefined;

/**
 * Initializes the Communication to the Remote side.
 * @param options - Options on how to create the ObjectStore.
 * @returns The ObjectStore just created.
 */
export function initRemote(options: CreateObjectStoreOptions = {}): ObjectStore {
  if (objectStore !== undefined) throw new Error("Remote is already initialized");
  return objectStore = createObjectStoreOnChannel(RENDERER_WINDOW_REMOTE_OBJECTS_CHANNEL, options);
}

/**
 * Returns the ObjectStore for communication with the RendererWindow Class on main Process. THrows if it gets called before initialization.
 * @returns The ObjectStore created for communication with the RendererWindow on the Main Process.
 */
export function remote(): ObjectStore {
  if (objectStore !== undefined) return objectStore;
  throw new Error("ObjectStore remote is not initialized. Please initialize it before use");
}

/**
 * Sends the Ready Signal used event to the RendererWindow.
 * Call this as soon as Possible in you code.
 * The RendererWindow will delay the show of the Window after you call readySignalSend().
 */
export async function readySignalIsUsed(): Promise<void> {
  await remote().getRemoteObject<RendererWindowApi>("readySignal").isUsed();
}

/**
 * Sends the Ready Signal event to the RendererWindow.
 * This signalizes to the RendererWindow that the Window is ready to be shown.
 * This only works if the readySignalUsed was send early enough.
 */
export async function readySignalSend() {
  await remote().getRemoteObject<RendererWindowApi>("readySignal").send();
}










/**
 * Applies a new Locale to the Page.
 * @param newLocale - the new Locale to load.
 */
export function setLocale(newLocale: string): Promise<void> {
  if (internalSetLocale === undefined) throw new Error("Localization needs to be initialized first.");
  return internalSetLocale(newLocale);
}

/**
 * returns the current locale in use.
 * @returns a string with the locale.
 */
export function getLocale(): string {
  if (internalGetLocale === undefined) throw new Error("Localization needs to be initialized first.");
  return internalGetLocale();
}

/**
 * Returns a list of available locales.
 * @returns an array of strings with the available locales.
 */
export function getTargetLocales(): string[] {
  if (internalConfig === undefined) throw new Error("Localization needs to be initialized first.");
  return [...internalConfig.targetLocales];
}

/**
 * Internally stores the function to get the current locale.
 */
let internalGetLocale: (() => string) | undefined = undefined;
/**
 * Internally stores the function to set a new locale.
 */
let internalSetLocale: ((newLocale: string) => Promise<void>) | undefined = undefined;
/**
 * Internally stores the configuration of the localization (sourceLocale, targetLocale).
 */
let internalConfig: Omit<RuntimeConfiguration, "loadLocale"> & { defaultLocale?: string | undefined; } | undefined;

/**
 * Sets up lit localization.
 * @param locale - name of the locale wich should be loaded on startup (by default setting from main or source-locale without -x-dev when it exists).
 * @param routePrefix - the Prefix of the route, where the Localization files are served (default = "/locales/").
 * @param config - optionally provide a object containing the sourceLocale and targetLocales (default = will request this information from main).
 */
export async function initLocalization(locale: string | undefined = undefined, routePrefix: string = "/locales/", config?: Omit<RuntimeConfiguration, "loadLocale"> | undefined): Promise<void> {
  if (internalConfig !== undefined) throw new Error("Localization is already initialized.");
  internalConfig = config;
  if (internalConfig === undefined) internalConfig = await (await fetch(routePrefix)).json();
  if (internalConfig === undefined) throw new Error("Empty Config is not Possible.");
  ({ getLocale: internalGetLocale, setLocale: internalSetLocale } = configureLocalization({
    loadLocale: async (locale) => (await import(routePrefix + locale)).templates(str, html),
    ...internalConfig,
  }));
  const validLocales = new Set(internalConfig.targetLocales);
  validLocales.add(internalConfig.sourceLocale);
  if (locale && validLocales.has(locale)) return await setLocale(locale);
  if (internalConfig.defaultLocale && validLocales.has(internalConfig.defaultLocale)) return await setLocale(internalConfig.defaultLocale);
  if (internalConfig.sourceLocale.endsWith("-x-dev") && validLocales.has(internalConfig.sourceLocale.slice(0, -6))) return await setLocale(internalConfig.sourceLocale.slice(0, -6));
}