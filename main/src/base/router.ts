import FindMyWay, { type HTTPMethod, type RouteOptions } from "find-my-way";

interface RouterRequest extends Omit<Request, "headers"> {
  headers: { [key: string]: string; };
  origUrl: string;
  parsedUrl: URL;
}

type Req = RouterRequest;
type Res = (res: Response) => void;

type Handler = (
  req: Req,
  res: Res,
  params: { [k: string]: string | undefined; },
  store: any,
  searchParams: { [k: string]: string; }
) => any;

interface FindResult {
  handler: Handler;
  params: { [k: string]: string | undefined; };
  store: any;
  searchParams: { [k: string]: string; };
}

interface FindRouteResult {
  handler: Handler;
  store: any;
  params: string[];
}

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
  deriveConstraint<Context>(req: Req, ctx?: Context): T,
}

interface ShortHandRoute {
  (path: string, handler: Handler): void;
  (path: string, opts: RouteOptions, handler: Handler): void;
  (path: string, handler: Handler, store: any): void;
  (path: string, opts: RouteOptions, handler: Handler, store: any): void;
}

export interface Router {
  on(
    method: HTTPMethod | HTTPMethod[],
    path: string,
    handler: Handler
  ): void;
  on(
    method: HTTPMethod | HTTPMethod[],
    path: string,
    options: RouteOptions,
    handler: Handler
  ): void;
  on(
    method: HTTPMethod | HTTPMethod[],
    path: string,
    handler: Handler,
    store: any
  ): void;
  on(
    method: HTTPMethod | HTTPMethod[],
    path: string,
    options: RouteOptions,
    handler: Handler,
    store: any
  ): void;
  off(
    method: HTTPMethod | HTTPMethod[],
    path: string,
    constraints?: { [key: string]: any; }
  ): void;

  lookup<Context>(
    req: Req,
    res: Res,
    ctx?: Context
  ): any;

  find(
    method: HTTPMethod,
    path: string,
    constraints?: { [key: string]: any; }
  ): FindResult | null;

  findRoute(
    method: HTTPMethod,
    path: string,
    constraints?: { [key: string]: any; }
  ): FindRouteResult | null;

  hasRoute(
    method: HTTPMethod,
    path: string,
    constraints?: { [key: string]: any; }
  ): boolean;

  reset(): void;
  prettyPrint(): string;
  prettyPrint(opts: {
    method?: HTTPMethod,
    commonPrefix?: boolean,
    includeMeta?: boolean | (string | symbol)[];
  }): string;

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

export interface Config {
  ignoreTrailingSlash?: boolean;

  ignoreDuplicateSlashes?: boolean;

  allowUnsafeRegex?: boolean;

  caseSensitive?: boolean;

  maxParamLength?: number;

  defaultRoute?(
    req: Req,
    res: Res
  ): void;

  onBadUrl?(
    path: string,
    req: Req,
    res: Res
  ): void;

  constraints?: {
    [key: string]: ConstraintStrategy;
  };
}

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

export function createRouter(config: Config): Router {
  return <any>FindMyWay(<any>config);
}

export function create200Response(content: string, contentType: string): Response {
  return new Response(content, { status: 200, headers: { "Content-Type": contentType, "Content-Security-Policy": "default-src 'self';" } });
}

export function create404Response(): Response {
  return new Response("404 Not Found", { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": "default-src 'self';" } });
}