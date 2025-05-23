import development from "consts:development";
import { Menu, app, session, type PermissionCheckHandlerHandlerDetails, type Session } from "electron/main";
import { privilegedProtocolRouter, registerPrivilegedSchemes, type Config, type Router } from "./router.js";

/**
 * Type of the permissionRequestHandler Callback Function.
 */
type PermissionRequestHandlerParameters = Parameters<Exclude<Parameters<Session["setPermissionRequestHandler"]>[0], null>>;

/**
 * First Parameter of the permissionRequestHandler Callback FUnction named webContents.
 */
export type PermissionRequestWebContents = PermissionRequestHandlerParameters[0];

/**
 * Second Parameter of the permissionRequestHandler Callback FUnction named permission.
 */
export type PermissionRequestPermission = PermissionRequestHandlerParameters[1];

/**
 * Third Parameter of the permissionRequestHandler Callback FUnction named callback.
 */
export type PermissionRequestCallback = PermissionRequestHandlerParameters[2];

/**
 * Fourth Parameter of the permissionRequestHandler Callback FUnction named details.
 */
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
  return callback(isDefaultProtocol(details.requestingUrl));
};

/**
 * Type of the permissionCheckHandler Callback Function.
 */
type PermissionCheckHandlerParameters = Parameters<Exclude<Parameters<Session["setPermissionCheckHandler"]>[0], null>>;

/**
 * First Parameter of the permissionCheckHandler Callback FUnction named webContents.
 */
export type PermissionCheckWebContents = PermissionCheckHandlerParameters[0];

/**
 * Second Parameter of the permissionCheckHandler Callback FUnction named permission.
 */
export type PermissionCheckPermission = PermissionCheckHandlerParameters[1];

/**
 * Third Parameter of the permissionCheckHandler Callback FUnction named RequestOrigin.
 */
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
  return isDefaultProtocol(requestingOrigin);
}

/**
 * String Identifier of the Default Partition to use.
 */
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

/**
 * Default Protocol to Use.
 */
let defaultProtocol: string | undefined = "app";

/**
 * Protocol Prefix of the Default Protocol.
 */
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

/**
 * Augments every new WebContents with some shortcuts in Development mode and some security features.
 *  - Only Allow WebViews wich use Default Protocol.
 *  - Only allow Navigation to urls containing the Default Protocol.
 *  - Only allow to Open Windows wich open a Default Protocol url.
 */
function secureWebContents() {
  app.on("web-contents-created", (_event, contents) => {
    // Add Keyboard Shortcuts only in development environment
    if (development) {
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
    contents.on("will-attach-webview", (event, _webPreferences, params) => {
      if (typeof params["src"] !== "string" || !isDefaultProtocol(params["src"])) {
        event.preventDefault();
      }
    });
    contents.on("will-navigate", (event, navigationUrl) => {
      if (!isDefaultProtocol(navigationUrl)) {
        event.preventDefault();
      }
    });
    contents.setWindowOpenHandler((details) => {
      if (isDefaultProtocol(details.url)) {
        return { action: "allow" };
      }
      return { action: "deny" };
    });
  });
}

/**
 * The default Router to use.
 */
let router: Router | undefined = undefined;

/**
 * Returns the default Router to use.
 * @returns the Default router of the default Protocol.
 */
export function getRouter(): Router {
  if (router === undefined) throw new Error("initialiseSafety must be called before getting router");
  return router;
}

/**
 * Remember if safety was already initialized.
 */
let initialized: boolean = false;

/**
 * Initialize Safety functions.
 * This is setting up the [Electron Security BestPractices](https://www.electronjs.org/de/docs/latest/tutorial/security).
 *  - Enables Sandbox.
 *  - Set Application Menu to null.
 *  - Setup permission Check and Request Handlers to only allow when using the registered protocol.
 *  - Secures the WebContexts
 *    - Setup Key Events for Reload and opening Devtools (similar shortcuts to chrome)
 * @param partitionToUse 
 * @param protocolToUse 
 * @param config 
 */
export function initialiseSafety(partitionToUse: string = "", protocolToUse: string = "app", config: Config = { ignoreDuplicateSlashes: true }) {
  if (initialized) throw new Error("initialiseSafety can only be called once.");
  defaultPartition = partitionToUse;
  defaultProtocol = protocolToUse;
  defaultProtocolPrefix = defaultProtocol + "://";
  app.enableSandbox();
  Menu.setApplicationMenu(null);
  app.whenReady().then(() => {
    const session = getSession();
    session.setPermissionCheckHandler(permissionCheckHandler);
    session.setPermissionRequestHandler(permissionRequestHandler);
  });
  secureWebContents();
  router = privilegedProtocolRouter(defaultProtocol, config, {
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

