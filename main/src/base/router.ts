import development from "consts:development";
import { app, protocol, type CustomScheme, type Privileges } from "electron/main";
import FindMyWay, { type HTTPMethod, type RouteOptions } from "find-my-way";
import { readFileSync } from "fs";
import { readFile, } from "fs/promises";
import { parse, resolve } from "path";

/**
 * Creating a Router using the find-my-way package
 * @param config - the Config to Use for the Router.
 * @returns the new Router wich can be used with electron custom Protocols.
 */
export function createRouter(config: Config): Router {
  const router: Router = <any>FindMyWay(<any>config);
  return router;
}

/**
 * Register a Protocol to be used with a router.
 * @param scheme - name of the scheme to handle.
 * @param config - config of the Router to use.
 * @returns the Router wich handles this protocol.
 */
export function protocolRouter(scheme: string, config: Config): Router {
  if (config.defaultRoute === undefined) {
    config.defaultRoute = function (_req, res) {
      return res(Response404.instance.clone());
    };
  }
  const router = createRouter(config);
  app.whenReady().then(() => {
    protocol.handle(scheme, (request) => {
      return new Promise((res, _rej) => {
        router.lookup(createRouterRequest(request), res, () => { });
      });
    });
  });
  return router;
}

/**
 * Holds on to the definition of the Privileged protocols which should be registered.
 */
let privilegedProtocols: CustomScheme[] | undefined = [];

/**
 * Use this function before instead of electrons protocol.registerSchemesAsPrivileged.
 * This needs to be called before initialiseSafety or registerPrivilegedSchemes.
 * @param customScheme - Array of schemes to register as Privileged.
 */
export function registerSchemesAsPrivileged(customSchemes: CustomScheme[]) {
  if (privilegedProtocols === undefined) throw new Error("registerSchemesAsPrivileged needs to be called before initialiseSafety.");
  privilegedProtocols.push(...customSchemes);
}

/**
 * Register a Protocol to be privileged and to be used with a router.
 * @param scheme - name of the scheme to handle.
 * @param config - config of the Router to use.
 * @param privileges - the privileges to apply to the scheme.
 * @returns the Router wich is created.
 */
export function privilegedProtocolRouter(scheme: string, config: Config, privileges: Privileges): Router {
  registerSchemesAsPrivileged([{ scheme, privileges }]);
  return protocolRouter(scheme, config);
}

/**
 * Should be called after all Protocols where Registered.
 * Is also called by initialiseSafety.
 */
export function registerPrivilegedSchemes() {
  if (privilegedProtocols === undefined) throw new Error("registerPrivilegedSchemes can only be called once.");
  protocol.registerSchemesAsPrivileged(privilegedProtocols);
  privilegedProtocols = undefined;
}

/**
 * Generates the HTML Content wich only imports a js Module.
 * @param jsSource - url to be used in the src attribute of the Script Tag.
 * @returns string with the HTML Content.
 */
export function generateHtmlTemplate(jsSource: string): string {
  return `<!DOCTYPE html><html><head><script type="module" src="${jsSource}"></script></head></html>`;
}

/**
 * Routes a Module as a HTML File.
 * Will resolve the module as a relative path to AppPath and resolve the main entry point.
 * Will serve this main entrypoint under basePath + "/" + filename + filmextension.
 * Will call the template Function retrieve html content to use.
 * Will server this content under basePath + "/" + filename + ".html".
 * Will return the path under wich the HTML file is served.
 * @param router - Router Instance to add the Routes to.
 * @param basePath - Prefix for the Routes.
 * @param module - Module to server.
 * @param template - template Function to use to create the HTML content.
 * @returns the Path under wich the html file is served.
 */
export function routeModuleAsHtmlFile(router: Router, basePath: string, module: string, template: (jsSource: string) => string = generateHtmlTemplate): string {
  const jsFile = getModuleMain(module);
  const jsPath = parse(jsFile);
  const jsRoute = basePath + "/" + jsPath.base;
  const htmlRoute = basePath + "/" + jsPath.name + ".html";
  if (!router.hasRoute("GET", htmlRoute)) {
    const cache = cachedResponse(async () => new HtmlStringResponse(template(`./${jsPath.base}`)));
    router.get(htmlRoute, (_req, res) => cache(res));
  }
  if (!router.hasRoute("GET", jsRoute)) {
    const cache = cachedResponse(async () => new JsStringResponse(await readFile(jsFile, { encoding: "utf8" })));
    router.get(jsRoute, (_req, res) => cache(res));
  }
  const jsMapRoute = jsRoute + ".map";
  if (development && !router.hasRoute("GET", jsMapRoute)) {
    const cache = cachedResponse(async () => new JsonStringResponse(await readFile(jsFile + ".map", { encoding: "utf8" })));
    router.get(jsMapRoute, (_req, res) => cache(res));
  }
  return htmlRoute;
}

/**
 * Types a Response Body can have.
 */
export type ResponseBody = typeof Response extends new (body?: infer U, init?: any) => any ? U : never;

/**
 * A Base Response with some default and strickt headers set.
 */
export class BaseResponse extends Response {
  /**
   * These Headers are always overwritten.
   */
  static strictHeaders: Map<string, string> = new Map([["Content-Security-Policy", "default-src 'self' data: 'unsafe-inline' 'unsafe-hashes'"]]);
  /**
   * These Headers are only set, if they are not already set.
   */
  static defaultHeaders: Map<string, string> = new Map([["Content-Type", "text/plain; charset=utf-8"]]);
  /**
   * Create a new Response with some default and Strict headers Set.
   * @param body - Body of the Response.
   * @param init - Some Additional data for the Response.
   */
  constructor(body: ResponseBody, init: ResponseInit) {
    super(body, init);
    for (const [key, value] of BaseResponse.strictHeaders) {
      this.headers.set(key, value);
    }
    for (const [key, value] of BaseResponse.defaultHeaders) {
      if (!this.headers.has(key)) this.headers.set(key, value);
    }
  }
}

/**
 * Create a Response for a String.
 */
export class StringResponse extends BaseResponse {
  constructor(contentType: string = "text/plain", content: string) {
    super(content, { headers: { "Content-Type": contentType + "; charset=utf-8" } });
  }
}

/**
 * Respond with a JavaScript String.
 */
export class JsStringResponse extends StringResponse {
  constructor(content: string) {
    super("text/javascript", content);
  }
}

/**
 * Return type of a cache Handler.
 */
export type CacheResponseHandler = (res: Res) => void;

/**
 * Calls the Handler only for the First request.
 * Any Subsequent Requests return the Response returned by the handler.
 * @param handler - Handler to run.
 * @returns a Function to invoke for each request with re Response callback.
 */
export function cachedResponse(handler: () => Promise<Response>): CacheResponseHandler {
  let response: Response | undefined = undefined;
  let requestsDuringHandling: Res[] = [];
  return (res: Res) => {
    if (response !== undefined) return res(response.clone());
    requestsDuringHandling.push(res);
    if (requestsDuringHandling.length !== 1) return;
    handler().then((res) => {
      response = res;
      for (const res of requestsDuringHandling) {
        res(response.clone());
      }
      requestsDuringHandling = [];
    }).catch(() => {
      for (const res of requestsDuringHandling) {
        res(Response404.instance);
      }
      requestsDuringHandling = [];
    });
  };
}

/**
 * Respond with a HTML String.
 */
export class HtmlStringResponse extends StringResponse {
  constructor(content: string) {
    super("text/html", content);
  }
}

/**
 * Respond with a JSON String.
 */
export class JsonStringResponse extends StringResponse {
  constructor(content: string) {
    super("application/jsontext/html", content);
  }
}

/**
 * Response used for 404 Errors.
 */
export class Response404 extends BaseResponse {
  static #internal: Response404 = new Response404();
  static get instance(): Response404 {
    return Response404.#internal.clone();
  }
  constructor() {
    super("404 Not Found", { status: 404 });
  }
}

/**
 * A Map to cache the results of the Module Resolution.
 */
const getModuleMainCache: Map<string, string> = new Map();

/**
 * Resolve the Main Entry of a local Module.
 * @param modulePath - Relative Path of the local Module based on the AppPath.
 * @returns the full path of the main entrypoint of this module.
 */
export function getModuleMain(modulePath: string): string {
  const pack = resolve(app.getAppPath(), modulePath);
  let ret = getModuleMainCache.get(pack);
  if (ret !== undefined) return ret;
  const main = <unknown>JSON.parse(readFileSync(resolve(pack, "package.json"), { encoding: "utf8" })).main;
  if (typeof main !== "string") throw new Error(`Package ${pack} has no valid main filed`);
  ret = resolve(pack, main);
  getModuleMainCache.set(pack, ret);
  return ret;
}

/**
 * Creates a Router Request wich is Compatible with find-my-way.
 * @param orig - the Request from the Electron Protocol Handler.
 * @returns a Router Request.
 */
export function createRouterRequest(orig: Request): RouterRequest {
  const parsedUrl = new URL(orig.url);
  return {
    body: orig.body,
    bodyUsed: orig.bodyUsed,
    cache: orig.cache,
    credentials: orig.credentials,
    destination: orig.destination,
    headers: Object.fromEntries([...orig.headers.entries(), ["host", parsedUrl.host]]),
    integrity: orig.integrity,
    method: orig.method,
    mode: orig.mode,
    redirect: orig.redirect,
    referrerPolicy: orig.referrerPolicy,
    signal: orig.signal,
    url: parsedUrl.pathname + parsedUrl.search,
    origUrl: orig.url,
    arrayBuffer: orig.arrayBuffer.bind(orig),
    blob: orig.blob.bind(orig),
    clone: orig.clone.bind(orig),
    json: orig.json.bind(orig),
    text: orig.text.bind(orig),
    keepalive: orig.keepalive,
    duplex: orig.duplex,
    formData: orig.formData.bind(orig),
    parsedUrl
  };
}

/**
 * Mapping Some Types to make find-my-way compatible with Electron custom Protocols.
 */

/**
 * Request Datatype.
 */
interface RouterRequest extends Omit<Request, "headers"> {
  headers: { [key: string]: string; };
  origUrl: string;
  parsedUrl: URL;
}

/**
 * Response Datatype.
 */
type Res = (res: Response) => void;

/**
 * Handler of a Route.
 */
type Handler = (req: RouterRequest, res: Res, params: { [k: string]: string | undefined; }, store: any, searchParams: { [k: string]: string; }) => any;

/**
 * Result of find.
 */
interface FindResult {
  handler: Handler;
  params: { [k: string]: string | undefined; };
  store: any;
  searchParams: { [k: string]: string; };
}

/**
 * Result of findRoute.
 */
interface FindRouteResult {
  handler: Handler;
  store: any;
  params: string[];
}

/**
 * Type of a Constraint Strategy.
 */
interface ConstraintStrategy<T = string> {
  name: string,
  mustMatchWhenDerived?: boolean,
  storage(): {
    get(value: T): Handler | null,
    set(value: T, handler: Handler): void,
    del?(value: T): void,
    empty?(): void;
  },
  validate?(value: unknown): void,
  deriveConstraint<Context>(req: RouterRequest, ctx?: Context): T,
}

/**
 * Type of an ShortHand Route Handler.
 */
interface ShortHandRoute {
  (path: string, handler: Handler): void;
  (path: string, opts: RouteOptions, handler: Handler): void;
  (path: string, handler: Handler, store: any): void;
  (path: string, opts: RouteOptions, handler: Handler, store: any): void;
}

/**
 * Type of an Router Instance.
 */
export interface Router {
  on(method: HTTPMethod | HTTPMethod[], path: string, handler: Handler): void;
  on(method: HTTPMethod | HTTPMethod[], path: string, options: RouteOptions, handler: Handler): void;
  on(method: HTTPMethod | HTTPMethod[], path: string, handler: Handler, store: any): void;
  on(method: HTTPMethod | HTTPMethod[], path: string, options: RouteOptions, handler: Handler, store: any): void;
  off(method: HTTPMethod | HTTPMethod[], path: string, constraints?: { [key: string]: any; }): void;
  lookup<Context>(req: RouterRequest, res: Res, ctx?: Context): any;
  find(method: HTTPMethod, path: string, constraints?: { [key: string]: any; }): FindResult | null;
  findRoute(method: HTTPMethod, path: string, constraints?: { [key: string]: any; }): FindRouteResult | null;
  hasRoute(method: HTTPMethod, path: string, constraints?: { [key: string]: any; }): boolean;
  reset(): void;
  prettyPrint(): string;
  prettyPrint(opts: { method?: HTTPMethod, commonPrefix?: boolean, includeMeta?: boolean | (string | symbol)[]; }): string;
  hasConstraintStrategy(strategyName: string): boolean;
  addConstraintStrategy(constraintStrategy: ConstraintStrategy): void;
  all: ShortHandRoute;
  acl: ShortHandRoute;
  bind: ShortHandRoute;
  checkout: ShortHandRoute;
  connect: ShortHandRoute;
  copy: ShortHandRoute;
  delete: ShortHandRoute;
  get: ShortHandRoute;
  head: ShortHandRoute;
  link: ShortHandRoute;
  lock: ShortHandRoute;
  'm-search': ShortHandRoute;
  merge: ShortHandRoute;
  mkactivity: ShortHandRoute;
  mkcalendar: ShortHandRoute;
  mkcol: ShortHandRoute;
  move: ShortHandRoute;
  notify: ShortHandRoute;
  options: ShortHandRoute;
  patch: ShortHandRoute;
  post: ShortHandRoute;
  propfind: ShortHandRoute;
  proppatch: ShortHandRoute;
  purge: ShortHandRoute;
  put: ShortHandRoute;
  rebind: ShortHandRoute;
  report: ShortHandRoute;
  search: ShortHandRoute;
  source: ShortHandRoute;
  subscribe: ShortHandRoute;
  trace: ShortHandRoute;
  unbind: ShortHandRoute;
  unlink: ShortHandRoute;
  unlock: ShortHandRoute;
  unsubscribe: ShortHandRoute;
}

/**
 * Options on how to create the Router.
 */
export interface Config {
  ignoreTrailingSlash?: boolean;
  ignoreDuplicateSlashes?: boolean;
  allowUnsafeRegex?: boolean;
  caseSensitive?: boolean;
  maxParamLength?: number;
  defaultRoute?(
    req: RouterRequest,
    res: Res
  ): void;
  onBadUrl?(
    path: string,
    req: RouterRequest,
    res: Res
  ): void;
  constraints?: {
    [key: string]: ConstraintStrategy;
  };
}