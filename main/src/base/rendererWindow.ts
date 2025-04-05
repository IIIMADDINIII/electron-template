import { RENDERER_WINDOW_API_ID, RENDERER_WINDOW_REMOTE_OBJECTS_CHANNEL, translationReplacer, type RendererWindowApi, type RendererWindowApiInitCallback, type RendererWindowApiInitData } from "@app/common";
import { createObjectStore, ObjectStore, type ObjectStoreOptions, type RemoteObject, type RemoteObjectAble } from "@iiimaddiniii/remote-objects";
import { type BrowserWindowConstructorOptions, type IpcMain } from "electron/main";
import * as path from "path";
import { BrowserWindowEx } from "./browserWindowEx.js";
import { addLocaleEventListener, getBestLocale, getBestPreferredSystemLocale, getLoadedTemplate, getLocale, getSourceLocale, getSystemLocales, getTargetLocales, setLocale } from "./localization.js";
import { getModuleMain, routeModuleAsHtmlFile } from "./router.js";
import { getProtocolPrefix, getSession, isDefaultProtocol } from "./safety.js";

/** Options on how to create a RendererWindow. */
type RendererWindowOwnOptions = {
  /**
   * The Module to load as the Webpage in to this window.
   * @default "renderer"
   */
  modulePath?: string | undefined;
  /**
   * Milliseconds to wait for a ReadySignal Used signal from Render Window.
   * If the Renderer sends a Ready Signal Used Signal at the start, the window will show the Window only after the readySignal was received.
   * @default 100
   */
  readySignalUsedTime?: number | undefined;
  /**
   * Milliseconds to wait for the ReadySignal.
   * If a ReadySignalUsed was received, the window is only shown is the readySignal was received or this Timeout as elapsed.
   * @default 5000
   */
  readySignalTimeout?: number | undefined;
  /**
   * A Prefix to add to all Routes for this window.
   * @default "/rendererWindow"
   */
  routePrefix?: string | undefined;
};

/** Options for a ObjectStore. */
export type CreateObjectStoreOptions = ObjectStoreOptions & {
  /**
   * Time in milliseconds after which a request is canceled with an TimeoutError.
   * @default 10000
   */
  timeout?: number;
};

/** Options on how to Create a Render Window. */
export type RendererWindowOptions = BrowserWindowConstructorOptions & CreateObjectStoreOptions & RendererWindowOwnOptions;

/** Type for making the fields of a Type Required (Dropping undefined and ?) */
type RequiredFields<T extends {}> = {
  [K in keyof T]-?: Exclude<T[K], undefined>;
};

/**
 * A Render Window wich makes it easy to create a Window displaying the Contend of a local package.
 * It sets up a Route for the Package to render.
 * Also makes the Window visible after the content finished loading (through a Ready Signal wich can be send from the renderer).
 */
export class RendererWindow extends BrowserWindowEx {
  /** Prefix used for all RendererWindow Routes. */
  static routerPrefix: string = "/rendererWindow";

  /** Promise which resolves once the window finished loading. */
  #readyPromise: Promise<void>;
  /** Default ObjectStore wich can be used for communication to the Window. */
  #objectStore: ObjectStore;
  /** Stores all exposed objects for when the objectStore needs to be recreated because of a reload */
  #exposedObjects: Map<string, RemoteObjectAble> = new Map();
  /** Options important to the RendererWindow. */
  #ownOptions: RequiredFields<RendererWindowOwnOptions>;
  /** Function is set when openGracefully is run. Used in RendererWindowApi. */
  #readySignalIsUsedFn: () => void = () => { };
  /** Function is set when openGracefully is run. Used in RendererWindowApi. */
  #readySignalSendFn: () => void = () => { };

  /**
   * Create a new Renderer Window.
   * @param options - BrowserWindow options.
   * @param fn - Callback is Called as soon as the Window is shown.
   */
  constructor(options?: RendererWindowOptions) {
    // Setting some default options differently
    let preload = options?.webPreferences?.preload;
    if (preload === undefined) preload = "./preload";
    if (!path.isAbsolute(preload)) preload = getModuleMain(preload);
    let show = options?.show;
    if (show === undefined) show = false;
    let session = options?.webPreferences?.session;
    if (session === undefined) session = getSession();
    // Call Super
    super({ ...options, webPreferences: { ...options?.webPreferences, preload, session, }, show });
    this.#ownOptions = {
      modulePath: options?.modulePath ?? "renderer",
      readySignalUsedTime: options?.readySignalUsedTime ?? 100,
      readySignalTimeout: options?.readySignalTimeout ?? 5000,
      routePrefix: options?.routePrefix !== undefined ? options.routePrefix : RendererWindow.routerPrefix
    };
    if (!this.#ownOptions.routePrefix.startsWith("/")) this.#ownOptions.routePrefix = "/" + this.#ownOptions.routePrefix;
    this.#objectStore = this.createObjectStoreOnChannel(RENDERER_WINDOW_REMOTE_OBJECTS_CHANNEL, options);
    this.webContents.on("did-start-loading", () => {
      this.#objectStore.close();
      this.#objectStore = this.createObjectStoreOnChannel(RENDERER_WINDOW_REMOTE_OBJECTS_CHANNEL, options);
      for (const [id, object] of this.#exposedObjects.entries()) {
        this.#objectStore.exposeRemoteObject(id, object);
      }
    });
    this.#exposeApi();
    this.#readyPromise = this.#openGracefully(show);
  }

  /**
   * Load the Url for this Window and show it after it finished loading.
   * @param show - BrowserWindow Show option.
   * @returns Promise which Resolves as soon as the Window is ready to Show.
   */
  #openGracefully(show: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const finish = () => {
        if (done) return;
        done = true;
        this.show();
        if (usedTimer) clearTimeout(usedTimer);
        if (timeoutTimer) clearTimeout(timeoutTimer);
        this.#readySignalIsUsedFn = () => { };
        this.#readySignalSendFn = () => { };
        resolve();
      };
      // variables for graceful display
      let readySignalUsed = false;
      let done = false;
      let usedTimer: NodeJS.Timeout | undefined = undefined;
      let timeoutTimer: NodeJS.Timeout | undefined = undefined;
      // Adding route for page
      const htmlUrl = getProtocolPrefix() + "local" + routeModuleAsHtmlFile(this.#ownOptions.routePrefix + "/" + this.#ownOptions.modulePath, this.#ownOptions.modulePath);
      // Load side
      this.loadURL(htmlUrl)
        .then(() => {
          // If window is already visible no need to start timers
          if (show) return finish();
          // start Timers for graceful display of the window
          usedTimer = setTimeout(() => {
            if (readySignalUsed) return;
            finish();
          }, this.#ownOptions.readySignalUsedTime);
          timeoutTimer = setTimeout(finish, this.#ownOptions.readySignalTimeout);
        })
        .catch((e) => {
          this.destroy();
          reject(e);
        });
      this.#readySignalIsUsedFn = () => {
        readySignalUsed = true;
      };
      this.#readySignalSendFn = () => {
        finish();
      };
    });
  }

  /** Expose the API's for this window type to the Renderer. */
  #exposeApi(): void {
    let initCallback: undefined | RendererWindowApiInitCallback = undefined;
    this.exposeRemoteObject(RENDERER_WINDOW_API_ID, {
      readySignalIsUsed: () => this.#readySignalIsUsedFn(),
      readySignalSend: () => this.#readySignalSendFn(),
      initLocalization: (callback) => {
        initCallback = callback;
        return JSON.stringify({
          currentLocale: getLocale(),
          sourceLocale: getSourceLocale(),
          targetLocales: [...getTargetLocales()],
          translations: getLoadedTemplate(),
        } satisfies RendererWindowApiInitData, translationReplacer);
      },
      getBestLocale: (args) => getBestLocale.apply(undefined, JSON.parse(args)),
      getSystemLocales: () => JSON.stringify(getSystemLocales()),
      getBestPreferredSystemLocale,
      setLocale,
    } satisfies RendererWindowApi);
    addLocaleEventListener(async (detail) => {
      if (initCallback === undefined) return;
      try {
        await initCallback(JSON.stringify(detail, translationReplacer));
      } catch (e) {
        initCallback = undefined;
      }
    });
  }

  /**
   * Create an ObjectStore which Communicates via ipc to the renderer.
   * @param channel - Channel to use for Communication.
   * @param options - Options on how to Create the ObjectStore
   * @returns the ObjectStore.
   */
  createObjectStoreOnChannel(channel: string, options: CreateObjectStoreOptions = {}): ObjectStore {
    let listener: Parameters<IpcMain["on"]>[1] = () => { };
    return createObjectStore({
      ...options,
      sendMessage: (message) => this.webContents.postMessage(channel, message),
      setNewMessageHandler: (newMessageHandler) => {
        listener = (event, data) => {
          if (!isDefaultProtocol(event.senderFrame?.url)) return;
          newMessageHandler(data);
        };
        this.webContents.ipc.on(channel, listener);
      },
      disconnectedHandler: () => this.webContents.ipc.off(channel, listener),
    });
  }

  /**
   * Wait until window is shown.
   * @returns Promise which Resolves as soon as the Window is ready to Show.
   */
  waitUntilReady(): Promise<void> {
    return this.#readyPromise;
  };

  /**
   * Stores a object or function to be used by the remote.
   * @param id - a string with wich the remote can request this object.
   * @param object - Object or function to share with remote.
   * @public
   */
  exposeRemoteObject(id: string, value: RemoteObjectAble): void {
    this.#objectStore.exposeRemoteObject(id, value);
    this.#exposedObjects.set(id, value);
    return;
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
  getRemoteObject<const T extends RemoteObjectAble>(id: string): RemoteObject<T> {
    return this.#objectStore.getRemoteObject(id);
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
  async requestRemoteObject<const T extends RemoteObjectAble>(id: string): Promise<RemoteObject<T>> {
    return await this.#objectStore.requestRemoteObject<T>(id);
  }

  /**
   * Synchronizes current GC State with remote.
   * @public
   */
  syncGc(): void {
    return this.#objectStore.syncGc();
  }

}