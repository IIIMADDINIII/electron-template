import { app, protocol, session, type PermissionCheckHandlerHandlerDetails, type PermissionRequestHandlerHandlerDetails, type Session, type WebContents } from "electron/main";
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
  return url.startsWith(defaultProtocolPrefix);
}


function secureWebContents() {
  app.on("web-contents-created", (_event, contents) => {
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
  app.whenReady().then(() => {
    const session = getSession();
    session.setPermissionCheckHandler(permissionCheckHandler);
    session.setPermissionRequestHandler(permissionRequestHandler);
  });
  secureWebContents();
  registerProtocol(routerConfig);
  initialized = true;
}

const defaultHtmlTemplate = `<!DOCTYPE html><html><head><script type="module" src="***"></script></head></html>`;
export function routeModuleAsHtmlFile(basePath: string, module: string, template: string = defaultHtmlTemplate): string {
  const router = getRouter();
  const jsFile = getModuleMain(module);
  const jsPath = path.parse(jsFile);
  const mapFile = jsFile + ".map";
  const jsRoute = basePath + "/" + jsPath.base;
  const mapRoute = jsRoute + ".map";
  const htmlRoute = basePath + "/" + jsPath.name + ".html";
  const html = template.replaceAll("***", `./${jsPath.base}`);
  router.get(htmlRoute, (_req, res) => {
    res(create200Response(html, "text/html; charset=utf-8"));
  });
  let js: string | undefined = undefined;
  router.get(jsRoute, (_req, res) => {
    if (js) res(create200Response(js, "text/javascript; charset=utf-8"));
    fs.readFile(jsFile, { encoding: "utf8" }, (error, content) => {
      if (error) return res(create404Response());
      js = content;
      return res(create200Response(js, "text/javascript; charset=utf-8"));
    });
  });
  let map: string | undefined = undefined;
  router.get(mapRoute, (_req, res) => {
    if (map) res(create200Response(map, "application/json; charset=utf-8"));
    fs.readFile(mapFile, { encoding: "utf8" }, (error, content) => {
      if (error) return res(create404Response());
      map = content;
      return res(create200Response(map, "application/json; charset=utf-8"));
    });
  });
  return htmlRoute;
}

export function getModuleMain(modulePath: string): string {
  const pack = path.resolve(app.getAppPath(), modulePath);
  const main = <unknown>JSON.parse(fs.readFileSync(path.resolve(pack, "package.json"), { encoding: "utf8" })).main;
  if (typeof main !== "string") throw new Error(`Package ${pack} has no valid main filed`);
  return path.resolve(pack, main);
}