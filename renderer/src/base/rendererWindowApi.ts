import { noAdopt } from "./noAdopt.js";
noAdopt();

import { RENDERER_WINDOW_API_ID, RENDERER_WINDOW_REMOTE_OBJECTS_CHANNEL, translationsReviver, type LocaleError, type LocaleLoading, type LocaleReady, type LocaleStatusEventDetail, type RendererWindowApi, type RendererWindowApiInitData, type Translations } from "@app/common";
import { createObjectStore, type ObjectStore, type ObjectStoreOptions, type Remote, type RemoteObject, type RemoteObjectAble, type Transferable } from "@iiimaddiniii/remote-objects";
import { configureLocalization, type LocaleModule } from "@lit/localize";
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
   * Stores a object or function to be used by the remote.
   * @param id - a string with wich the remote can request this object.
   * @param object - Object or function to share with remote.
   * @public
   */
export function exposeRemoteObject(id: string, value: RemoteObjectAble): void {
  if (objectStore === undefined) throw new Error("ObjectStore remote is not initialized. Please initialize it before use");
  return objectStore.exposeRemoteObject(id, value);
};

/**
 * Will return a local Proxy wich represents this Object.
 * This does not Request any data from remote.
 * This will initially succeed, even if the id is not exposed on remote (will only fail on the first request to remote).
 * Use getRemoteObject if you need to use 'key in object', 'object instanceof class', 'Object.keys(object)' or similar.
 * @param id - id of the object or function to request.
 * @returns a Proxy wich represents this object.
 * @public
 */
export function getRemoteObject<const T extends RemoteObjectAble>(id: string): RemoteObject<T> {
  if (objectStore === undefined) throw new Error("ObjectStore remote is not initialized. Please initialize it before use");
  return objectStore.getRemoteObject(id);
};

/**
 * Will get the description of an Object from Remote and returns a local Proxy wich represents this Object.
 * Will request the metadata of the object from remote the first time for every id.
 * Use this method if you need to use 'key in object', 'object instanceof class', 'Object.keys(object)' or similar.
 * Use getRemoteProxy if you don't need to use these operations because it does not need to request data from remote.
 * @param id - id of the object or function to request.
 * @returns a Promise resolving to a Proxy wich represents this object.
 * @public
 */
export async function requestRemoteObject<const T extends RemoteObjectAble>(id: string): Promise<RemoteObject<T>> {
  if (objectStore === undefined) throw new Error("ObjectStore remote is not initialized. Please initialize it before use");
  return await objectStore.requestRemoteObject<T>(id);
};

/**
 * Synchronizes current GC State with remote.
 * @public
 */
export function syncGc(): void {
  if (objectStore === undefined) throw new Error("ObjectStore remote is not initialized. Please initialize it before use");
  return objectStore.syncGc();
};

/** Cache for RendererWindowApi remote Object */
let rendererWindowApiCache: Remote<RendererWindowApi> | undefined = undefined;

/**
 * Get the Api of the Remote Renderer.
 * @returns RendererWindowApi Remote Object proxy Object.
 */
function rendererWindowApi(): Remote<RendererWindowApi> {
  if (rendererWindowApiCache === undefined) rendererWindowApiCache = getRemoteObject<RendererWindowApi>(RENDERER_WINDOW_API_ID);
  return rendererWindowApiCache;
}

/**
 * Sends the Ready Signal used event to the RendererWindow.
 * Call this as soon as Possible in you code.
 * The RendererWindow will delay the show of the Window after you call readySignalSend().
 */
export async function readySignalIsUsed(): Promise<void> {
  await rendererWindowApi().readySignalIsUsed();
}

/**
 * Sends the Ready Signal event to the RendererWindow.
 * This signalizes to the RendererWindow that the Window is ready to be shown.
 * This only works if the readySignalUsed was send early enough.
 */
export async function readySignalSend() {
  await rendererWindowApi().readySignalSend();
}

/**
 * Status Data of the Locale.
 * Initialized by initLocalization.
 */
let localization: undefined | {
  getLocale(): string;
  setLocale(locale: string): Promise<void>;
  sourceLocale: string;
  targetLocales: Set<string>;
  allLocales: Set<string>;
  preload: undefined | { locale: string; template: Translations | undefined; };
  loading: undefined | PromiseWithResolvers<Translations | undefined> & { locale: string; };
  wrapperTemplate: Translations;
  loadedTemplate: Translations | undefined;
} = undefined;

/**
 * Internal Helper function to set the Template fields correctly.
 * @param template - the template to apply.
 * @returns the wrapperTemplate.
 */
function setTemplate(template: Translations | undefined): Translations {
  if (localization === undefined) throw new Error("Accessed Localization before Initialization");
  localization.loadedTemplate = template;
  if (localization.loadedTemplate === undefined) return Object.setPrototypeOf(localization.wrapperTemplate, null);
  return Object.setPrototypeOf(localization.wrapperTemplate, localization.loadedTemplate);
}

/**
 * Called when a Locale loading Event is received from Main.
 * @param detail - the Data for this event.
 */
async function loadingEventHandler(detail: LocaleLoading): Promise<void> {
  if (localization === undefined) return;
  try {
    await localization.setLocale(detail.loadingLocale);
  } catch { }
}

/**
 * Called when a locale ready Event is received from Main.
 * @param detail - the data for this Event.
 */
async function readyEventHandler(detail: LocaleReady): Promise<void> {
  if (localization === undefined) return;
  if (localization.loading !== undefined && localization.loading.locale === detail.readyLocale) {
    return localization.loading.resolve(detail.translations);
  }
  localization.preload = { locale: detail.readyLocale, template: detail.translations };
  try {
    await localization.setLocale(detail.readyLocale);
  } catch { }
}

/**
 * Called when a locale error Event is received from Main.
 * @param detail - the Data for this Event.
 */
async function errorEventHandler(detail: LocaleError): Promise<void> {
  if (localization === undefined) return;
  if (localization.loading !== undefined && localization.loading.locale === detail.errorLocale) {
    return localization.loading.reject(new Error(detail.errorMessage));
  }
}

/**
 * Called when ever there is an localization event from main.
 * @param details - json data containing the event details.
 */
async function localeEventHandler(details: string): Promise<void> {
  const data: LocaleStatusEventDetail = JSON.parse(details, translationsReviver);
  switch (data.status) {
    case "loading": return await loadingEventHandler(data);
    case "ready": return await readyEventHandler(data);
    case "error": return await errorEventHandler(data);
  }
}

/**
 * Called by Lit to load a specified Locale.
 * @param locale - the Locale to load.
 * @returns the loaded locale Translations.
 */
async function loadLocale(locale: string): Promise<LocaleModule> {
  if (localization === undefined) throw new Error("Accessed Localization before Initialization");
  if (localization.preload !== undefined) {
    const preload = localization.preload;
    localization.preload = undefined;
    if (preload.locale === locale) return { templates: setTemplate(preload.template) };
  }
  if (localization.loading !== undefined) localization.loading.reject(new Error("Locale did not finish loading."));
  localization.loading = { locale, ...Promise.withResolvers<Translations | undefined>() };
  try {
    return { templates: setTemplate(await localization.loading.promise) };
  } finally {
    localization.loading = undefined;
  }
}

/**
 * Sets up lit localization.
 * @param locale - name of the locale wich should be loaded on startup (by default setting from main or source-locale without -x-dev when it exists).
 * @param routePrefix - the Prefix of the route, where the Localization files are served (default = "/locales/").
 * @param config - optionally provide a object containing the sourceLocale and targetLocales (default = will request this information from main).
 */
export async function initLocalization(): Promise<void> {
  if (localization !== undefined) throw new Error("initLocalization can only be called once.");
  const jsonConfig = await rendererWindowApi().initLocalization(localeEventHandler);
  const config: RendererWindowApiInitData = JSON.parse(jsonConfig, translationsReviver);
  const sourceLocale = config.sourceLocale;
  const targetLocales = new Set(config.targetLocales);
  const allLocales = new Set(targetLocales);
  allLocales.add(sourceLocale);
  const currentLocale = config.currentLocale;
  const { getLocale, setLocale } = configureLocalization({
    sourceLocale,
    targetLocales,
    loadLocale,
  });
  localization = {
    getLocale,
    setLocale,
    sourceLocale,
    targetLocales,
    allLocales,
    wrapperTemplate: Object.setPrototypeOf({}, null),
    loadedTemplate: undefined,
    preload: { locale: config.currentLocale, template: config.translations },
    loading: undefined,
  };
  if (currentLocale !== sourceLocale) await setLocale(currentLocale);
}

/**
 * Returns the locale string of the currently loaded locale
 * @returns string of the currently loaded Locale.
 */
export function getLocale(): string {
  if (localization === undefined) throw new Error("Accessed Localization before Initialization");
  return localization.getLocale();
}

/**
 * Load a new Locale and wait until it is loaded.
 * @param locale - locale id to load. Empty String means to load the System preferred locale.
 * @returns Promise which resolves as soon as the locale is loaded on the main thread.
 */
export async function setLocale(locale: string): Promise<void> {
  if (localization === undefined) throw new Error("Accessed Localization before Initialization");
  return await rendererWindowApi().setLocale(locale);
}

/**
 * Returns the Source Locale of the Localization Config.
 * @returns the configured Source Locale.
 */
export function getSourceLocale(): string {
  if (localization === undefined) throw new Error("Accessed Localization before Initialization");
  return localization.sourceLocale;
}

/**
 * Returns the list of Target Locales of the Localization config.
 * @returns the configured targetLocales.
 */
export function getTargetLocales(): Set<string> {
  if (localization === undefined) throw new Error("Accessed Localization before Initialization");
  return localization.targetLocales;
}

/**
 * Returns the list of all configured locales in the Localization config.
 * @returns all configured locales.
 */
export function getAllLocales(): Set<string> {
  if (localization === undefined) throw new Error("Accessed Localization before Initialization");
  return localization.allLocales;
}

/**
 * Get a list of all available Locales.
 * @returns a list of all available source locales.
 */
export function getLocales(): string[] {
  if (localization === undefined) throw new Error("Accessed Localization before Initialization");
  return [...localization.allLocales.values()];
}

/**
 * Searches for the best fitting locale inside availableLocales in the order of preferredLocales.
 * @param preferredLocales - a list of locales strings sorted by highest priority first.
 * @param availableLocales - a list of available locale translations.
 * @param fallback - optional default value to return if no match can be found.
 * @returns the best matching locale from availableLocales or undefined (fallback) id non can be matched.
 */
export async function getBestLocale(preferredLocales: string[], availableLocales: string[], fallback: string): Promise<string>;
export async function getBestLocale(preferredLocales: string[], availableLocales: string[], fallback?: string | undefined): Promise<string | undefined>;
export async function getBestLocale(preferredLocales: string[], availableLocales: string[], fallback: string | undefined = undefined): Promise<string | undefined> {
  return await rendererWindowApi().getBestLocale(JSON.stringify([preferredLocales, availableLocales, fallback]));
}

/**
 * Returns a list of locales preferred by the user.
 * First in the list is the ost proffered locale of the user.
 * Last in the list is the least proffered Locale of the User.
 * @returns a list of locales in th order of preference (First is high preference).
 */
export async function getSystemLocales(): Promise<string[]> {
  return JSON.parse(await rendererWindowApi().getSystemLocales());
}

/**
 * Returns the best fitting preferred locale (from Operating System) based on the available locales (via getLocales).
 * @returns the best fitting locale or the fallback locale from initialization if none can be found.
 */
export async function getBestPreferredSystemLocale(): Promise<string> {
  return await rendererWindowApi().getBestPreferredSystemLocale();
}
