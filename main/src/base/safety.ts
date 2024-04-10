import development from "consts:development";
import { Menu, app, protocol, session, type PermissionCheckHandlerHandlerDetails, type PermissionRequestHandlerHandlerDetails, type Session, type WebContents } from "electron/main";
import * as fs from "fs";
import * as path from "path";
import { create200Response, create404Response, createRouter, createRouterRequest, type Config, type Router } from "./router.js";

export type SessionRequestPermissions = 'clipboard-read' | 'clipboard-sanitized-write' | 'display-capture' | 'fullscreen' | 'geolocation' | 'idle-detection' | 'media' | 'mediaKeySystem' | 'midi' | 'midiSysex' | 'notifications' | 'pointerLock' | 'keyboardLock' | 'openExternal' | 'window-management' | 'unknown';
export type SessionCheckPermissions = 'clipboard-read' | 'clipboard-sanitized-write' | 'geolocation' | 'fullscreen' | 'hid' | 'idle-detection' | 'media' | 'mediaKeySystem' | 'midi' | 'midiSysex' | 'notifications' | 'openExternal' | 'pointerLock' | 'serial' | 'usb';

export function permissionRequestHandler(_webContents: WebContents, _permission: SessionRequestPermissions, callback: (permissionGranted: boolean) => void, details: PermissionRequestHandlerHandlerDetails): void {
  return callback(isDefaultProtocol(details.requestingUrl));
};

export function permissionCheckHandler(_webContents: WebContents | null, _permission: SessionCheckPermissions, requestingOrigin: string, _details: PermissionCheckHandlerHandlerDetails): boolean {
  return isDefaultProtocol(requestingOrigin);
}

let defaultPartition: string = "";

export function getPartition(): string {
  return defaultPartition;
}

export function getSession(): Session {
  return session.fromPartition(defaultPartition);
}

let defaultProtocol: string = "app";
let defaultProtocolPrefix: string = "app://";

export function getProtocol(): string {
  return defaultProtocol;
}

export function getProtocolPrefix(): string {
  return defaultProtocolPrefix;
}

export function isDefaultProtocol(url: string): boolean {
  if (url === "about:blank") return true;
  return url.startsWith(defaultProtocolPrefix);
}


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

let router: Router | undefined = undefined;

export function getRouter(): Router {
  if (router === undefined) throw new Error("initialiseSafety must be called before getting router");
  return router;
}

function registerProtocol(config: Config) {
  if (router !== undefined) throw new Error("Protocol was already registered");
  if (config.defaultRoute === undefined) {
    config.defaultRoute = function (_req, res) {
      return res(create404Response());
    };
  }
  router = createRouter(config);
  const r = router;
  protocol.registerSchemesAsPrivileged([{
    scheme: defaultProtocol,
    privileges: {
      standard: true,
      secure: true,
      bypassCSP: false,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      corsEnabled: false,
      stream: true,
      codeCache: true,
    }
  }]);
  app.whenReady().then(() => {
    protocol.handle(defaultProtocol, (request) => {
      return new Promise((res, _rej) => {
        r.lookup(createRouterRequest(request), res, () => { });
      });
    });
  });
}

let initialized: boolean = false;

export function initialiseSafety(partitionToUse: string = "", protocolToUse: string = "app", routerConfig: Config = {}) {
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
  registerProtocol(routerConfig);
  initialized = true;
}

export function routeString(route: string, content: string, contentType: string): void {
  const router = getRouter();
  if (router.hasRoute("GET", route)) return;
  router.get(route, (_req, res) => {
    res(create200Response(content, contentType));
  });
}

export function routeStringAsHtmlFile(route: string, html: string): void {
  return routeString(route, html, "text/html; charset=utf-8");
}

export function routeFile(route: string, file: string, contentType: string): void {
  const router = getRouter();
  if (router.hasRoute("GET", route)) return;
  let content: string | undefined = undefined;
  router.get(route, (_req, res) => {
    if (content) res(create200Response(content, contentType));
    fs.readFile(file, { encoding: "utf8" }, (error, data) => {
      if (error) return res(create404Response());
      content = data;
      return res(create200Response(content, contentType));
    });
  });
}

export function routeFileAsJsFile(route: string, file: string): void {
  return routeFile(route, file, "text/javascript; charset=utf-8");
}

export function routeFileAsJson(route: string, file: string): void {
  return routeFile(route, file, "application/json; charset=utf-8");
}

const defaultHtmlTemplate = `<!DOCTYPE html><html><head><script type="module" src="***"></script></head></html>`;
export function routeModuleAsHtmlFile(basePath: string, module: string, template: string = defaultHtmlTemplate): string {
  const jsFile = getModuleMain(module);
  const jsPath = path.parse(jsFile);
  const jsRoute = basePath + "/" + jsPath.base;
  const htmlRoute = basePath + "/" + jsPath.name + ".html";
  routeStringAsHtmlFile(htmlRoute, template.replaceAll("***", `./${jsPath.base}`));
  routeFileAsJsFile(jsRoute, jsFile);
  routeFileAsJson(jsRoute + ".map", jsFile + ".map");
  return htmlRoute;
}

const getModuleMainCache: Map<string, string> = new Map();
export function getModuleMain(modulePath: string): string {
  const pack = path.resolve(app.getAppPath(), modulePath);
  let ret = getModuleMainCache.get(pack);
  if (ret !== undefined) return ret;
  const main = <unknown>JSON.parse(fs.readFileSync(path.resolve(pack, "package.json"), { encoding: "utf8" })).main;
  if (typeof main !== "string") throw new Error(`Package ${pack} has no valid main filed`);
  ret = path.resolve(pack, main);
  getModuleMainCache.set(pack, ret);
  return ret;
}