import development from "consts:development";
import { Menu, app, session, type PermissionCheckHandlerHandlerDetails, type Session, type WebPreferences } from "electron/main";
import { privilegedProtocolRouter, registerPrivilegedSchemes, type Config, type Router } from "./router.js";

/** Type of the Permission Request Handler Callback Function */
export type PermissionRequestHandler = Exclude<Parameters<Session["setPermissionRequestHandler"]>[0], null>;

/** Type of the permissionRequestHandler Callback Function. */
type PermissionRequestHandlerParameters = Parameters<PermissionRequestHandler>;

/** First Parameter of the permissionRequestHandler Callback FUnction named webContents. */
export type PermissionRequestWebContents = PermissionRequestHandlerParameters[0];

/** Second Parameter of the permissionRequestHandler Callback FUnction named permission. */
export type PermissionRequestPermission = PermissionRequestHandlerParameters[1];

/** Third Parameter of the permissionRequestHandler Callback FUnction named callback. */
export type PermissionRequestCallback = PermissionRequestHandlerParameters[2];

/** Fourth Parameter of the permissionRequestHandler Callback FUnction named details. */
export type PermissionRequestDetails = PermissionRequestHandlerParameters[3];

/**
 * Default Permission Request Handler.
 * Only allow Requests, if they are from the default Protocol.
 * @param _webContents - not used
 * @param _permission - not used
 * @param callback - to be called with the result of the request.
 * @param details - details for the request
 */
export function permissionRequestHandler(_webContents: PermissionRequestWebContents, _permission: PermissionRequestPermission, callback: PermissionRequestCallback, details: PermissionRequestDetails): void {
  return callback(isUrlAllowed(details.requestingUrl));
};

/** Type of the Permission Check Handler Callback Function */
export type PermissionCheckHandler = Exclude<Parameters<Session["setPermissionCheckHandler"]>[0], null>;

/** Type of the permissionCheckHandler Callback Function. */
type PermissionCheckHandlerParameters = Parameters<PermissionCheckHandler>;

/** First Parameter of the permissionCheckHandler Callback FUnction named webContents. */
export type PermissionCheckWebContents = PermissionCheckHandlerParameters[0];

/** Second Parameter of the permissionCheckHandler Callback FUnction named permission. */
export type PermissionCheckPermission = PermissionCheckHandlerParameters[1];

/** Third Parameter of the permissionCheckHandler Callback FUnction named RequestOrigin. */
export type PermissionCheckRequestOrigin = PermissionCheckHandlerParameters[2];

/**
 * Default Permission Check Handler.
 * Only allow Requests, if they are from the default Protocol.
 * @param _webContents - not used
 * @param _permission - not used
 * @param requestingOrigin - the Origin from where the Request originated.
 * @param _details - not used.
 * @returns if the permission is allowed.
 */
export function permissionCheckHandler(_webContents: PermissionCheckWebContents, _permission: PermissionCheckPermission, requestingOrigin: PermissionCheckRequestOrigin, _details: PermissionCheckHandlerHandlerDetails): boolean {
  return isUrlAllowed(requestingOrigin);
}

/** String Identifier of the Default Partition to use. */
let defaultPartition: string | undefined;

/**
 * Returns the Partition String wich should be used.
 * @returns the Petition String wich is used by Default.
 */
export function getPartition(): string {
  if (defaultPartition === undefined) throw new Error("initialiseSafety must be called before getting the partition");
  return defaultPartition;
}

/**
 * Returns the Session to used (derived from Partition String).
 * @returns The Session based on the Partition String.
 */
export function getSession(): Session {
  if (defaultPartition === undefined) throw new Error("initialiseSafety must be called before getting the session");
  return session.fromPartition(defaultPartition);
}

/** Default Protocol to Use. */
let defaultProtocol: string | undefined = "app";

/** Protocol Prefix of the Default Protocol. */
let defaultProtocolPrefix: string | undefined = "app://";

/**
 * Returns the Protocol String (default = "app").
 * @returns the Protocol name to be used.
 */
export function getProtocol(): string {
  if (defaultProtocol === undefined) throw new Error("initialiseSafety must be called before getting the protocol");
  return defaultProtocol;
}

/**
 * Returns the Protocol Prefix to be Used (default = "app://").
 * @returns the Protocol Prefix.
 */
export function getProtocolPrefix(): string {
  if (defaultProtocolPrefix === undefined) throw new Error("initialiseSafety must be called before getting the protocol prefix");
  return defaultProtocolPrefix;
}

/**
 * Checks if a Given URL is part of the default Protocol.
 * @param url - the URL to check.
 * @returns if the URL is the DefaultProtocol.
 */
export function isDefaultProtocol(url: string | null | undefined): boolean {
  if (typeof url !== "string") return false;
  return url.startsWith(getProtocolPrefix());
}

/** Function to store the checkUrl function */
let checkUrlFn: undefined | CheckUrl = undefined;

/**
 * Check of a url is generally allowed to do everything.
 * @param url - the Url to Check.
 * @returns true if it is allowed to do everything.
 */
export function isUrlAllowed(url: string | null | undefined): boolean {
  if (typeof url !== "string") return false;
  if (checkUrlFn !== undefined) return checkUrlFn(url);
  return false;
}

/** Type of the checkUrl function. */
export type CheckUrl = (url: string) => boolean;

/** Default handler for the checkUrl parameter. */
export function checkUrl(url: string): boolean {
  if (url === "about:blank") return true;
  return isDefaultProtocol(url);
}

/** Type of the WillAttachWebview handler */
export type WillAttachWebview = (event: Electron.Event,
  /**
   * The web preferences that will be used by the guest page. This object can be
   * modified to adjust the preferences for the guest page.
   */
  webPreferences: WebPreferences,
  /**
   * The other `<webview>` parameters such as the `src` URL. This object can be
   * modified to adjust the parameters of the guest page.
   */
  params: Record<string, string>) => void;

/**
 * Default Handler for the will-attack-webview event.
 * @param event - Event to be able to prevent the action.
 * @param _webPreferences - not used.
 * @param params - Parameters for the webview.
 */
export function willAttachWebview(event: Electron.Event, _webPreferences: WebPreferences, params: Record<string, string>) {
  if (typeof params["src"] !== "string" || !isUrlAllowed(params["src"])) {
    event.preventDefault();
  }
}

/** Details Parameter of the WillNavigate Event Handler. */
export type WillNavigateDetails = Electron.Event<Electron.WebContentsWillNavigateEventParams>;

/** type of the WillNavigate Handler */
export type WillNavigate = (details: WillNavigateDetails) => void;

/**
 * Default willNavigate Handler.
 * @param details - the details of this Navigation.
 */
export function willNavigate(details: WillNavigateDetails) {
  if (!isUrlAllowed(details.url)) {
    details.preventDefault();
  }
}

/** Type of the windowOpenHandler function. */
export type WindowOpenHandler = (details: Electron.HandlerDetails) => Electron.WindowOpenHandlerResponse;

/**
 * Default handler for the windowOpenerHandler.
 * @param details - Details of the open event.
 * @returns result if opening is allowed.
 */
export function windowOpenHandler(details: Electron.HandlerDetails): Electron.WindowOpenHandlerResponse {
  if (isUrlAllowed(details.url)) {
    return { action: "allow" };
  }
  return { action: "deny" };
}

/** Options on how to secure the WebContents */
export type SecureWebContentsOptions = {
  /**
   * Disable the Creation of shortcuts during development (F12 for devtools, F5 for reload etc.).
   * @default false
   */
  disableDevShortcuts?: boolean;
  /**
   * Function to Use as a check if a Webview can be crated.
   * null => do not set any event.
   * Defaults to the willAttackWebview function from this Module.
   */
  willAttachWebview?: WillAttachWebview | null;
  /**
   * Function to use as a check of a window is allowed to navigate.
   * null => to not check navigations.
   * Defaults to the willNavigate function from this module.
   */
  willNavigate?: WillNavigate | null;
  /**
   * Function to use as a check if a new Browser Window can be crated.
   * null => setWindowOpenHandler is not called.
   * Defaults to the windowOpenHandler function of this module.
   */
  windowOpenHandler?: WindowOpenHandler | null;
};

/**
 * Augments every new WebContents with some shortcuts in Development mode and some security features.
 *  - Only Allow WebViews wich use Default Protocol.
 *  - Only allow Navigation to urls containing the Default Protocol.
 *  - Only allow to Open Windows wich open a Default Protocol url.
 * @param options - Options on how to secure the WebContents.
 */
export function secureWebContents(options: SecureWebContentsOptions = {}) {
  const waw = options.willAttachWebview === undefined ? willAttachWebview : options.willAttachWebview;
  const wn = options.willNavigate === undefined ? willNavigate : options.willNavigate;
  const woh = options.windowOpenHandler === undefined ? windowOpenHandler : options.windowOpenHandler;
  app.on("web-contents-created", (_event, contents) => {
    // Add Keyboard Shortcuts only in development environment
    if (development) {
      if (options.disableDevShortcuts !== true) {
        contents.on("before-input-event", (event, input) => {
          const key = input.key.toLowerCase();
          if (((input.control || input.meta) && key === "r") || (key === "f5")) {
            contents.reload();
            return event.preventDefault();
          }
          if ((((input.control && input.shift) || (input.meta && input.alt)) && (key === "j" || key === "i")) || (key === "f12")) {
            if (contents.isDevToolsOpened()) {
              contents.devToolsWebContents?.focus();
            } else {
              contents.openDevTools();
            }
            return event.preventDefault();
          }
        });
      }
    }
    if (waw !== null) contents.on("will-attach-webview", waw);
    if (wn !== null) contents.on("will-navigate", wn);
    if (woh !== null) contents.setWindowOpenHandler(woh);
  });
}

/** The default Router to use. */
let router: Router | undefined = undefined;

/**
 * Returns the default Router to use.
 * @returns the Default router of the default Protocol.
 */
export function getRouter(): Router {
  if (router === undefined) throw new Error("initialiseSafety must be called before getting router");
  return router;
}

/** Config Options for initialize Safety. */
export type InitialiseSafetyOptions = {
  /**
   * Name of the User session Partition.
   * @default ""
   */
  partition?: string;
  /**
   * Name of the Protocol to Use.
   * @default "app"
   */
  protocol?: string;
  /**
   * Config for the FindMyWay Router.
   * @default { ignoreDuplicateSlashes: true }
   */
  config?: Config;
  /**
   * Should app.enableSandbox not be called.
   * @default false
   */
  disableSandbox?: boolean;
  /**
   * Argument to the session.setPermissionCheckHandler function.
   * Defaults to the permissionCheckHandler from this module.
   */
  permissionCheckHandler?: PermissionCheckHandler | null;
  /**
   * Argument to the session.setPermissionRequestHandler function.
   * Defaults to the permissionRequestHandler from this module.
   */
  permissionRequestHandler?: PermissionRequestHandler | null;
  /**
   * Options on how to secure the WebContents. Option for secureWebContents.
   * @default {}
   */
  webContents?: SecureWebContentsOptions;
  /**
   * Function to use if an URL is allowed to do everything.
   * Used by the default handlers to allow everything or deny everything.
   * Defaults to the checkUrl function from this Module.
   */
  checkUrl?: CheckUrl;
};

/** Remember if safety was already initialized. */
let initialized: boolean = false;

/**
 * Initialize Safety functions.
 * This is setting up the [Electron Security BestPractices](https://www.electronjs.org/de/docs/latest/tutorial/security).
 *  - Enables Sandbox.
 *  - Set Application Menu to null.
 *  - Setup permission Check and Request Handlers to only allow when using the registered protocol.
 *  - Secures the WebContexts
 *    - Setup Key Events for Reload and opening Devtools (similar shortcuts to chrome)
 * @param options - Options on how to create the Safety.
 */
export function initialiseSafety(options: InitialiseSafetyOptions = {}) {
  if (initialized) throw new Error("initialiseSafety can only be called once.");
  defaultPartition = options.partition ?? "";
  defaultProtocol = options.protocol ?? "app";
  defaultProtocolPrefix = defaultProtocol + "://";
  checkUrlFn = options.checkUrl ?? checkUrl;
  if (options.disableSandbox !== true) app.enableSandbox();
  Menu.setApplicationMenu(null);
  app.whenReady().then(() => {
    const session = getSession();
    session.setPermissionCheckHandler(options.permissionCheckHandler === undefined ? permissionCheckHandler : options.permissionCheckHandler);
    session.setPermissionRequestHandler(options.permissionRequestHandler === undefined ? permissionRequestHandler : options.permissionRequestHandler);
  });
  secureWebContents(options.webContents);
  router = privilegedProtocolRouter(defaultProtocol, options.config ?? { ignoreDuplicateSlashes: true }, {
    standard: true,
    secure: true,
    bypassCSP: false,
    allowServiceWorkers: true,
    supportFetchAPI: true,
    corsEnabled: false,
    stream: true,
    codeCache: true,
  });
  registerPrivilegedSchemes();
  initialized = true;
}

