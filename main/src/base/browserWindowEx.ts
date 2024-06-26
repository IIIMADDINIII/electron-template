import { BrowserWindow } from "electron";
import type { BrowserWindowConstructorOptions } from "electron/main";

/**
 * Map a BrowserWindow to BrowserWindowEx.
 */
type MapValue<T> = T extends BrowserWindow ? BrowserWindowEx : T;

/**
 * Map the Return Type of a Function.
 */
type MapReturn<T> = T extends BrowserWindow[] ? BrowserWindowEx[] : MapValue<T>;

/**
 * Map if Browser Window is the First argument.
 */
type MapArgs<T> = T extends [BrowserWindow | infer U] ? [BrowserWindow | U] extends T ? [win: BrowserWindowEx | BrowserWindow | U] : T : T;

/**
 * Map all Parameters and Return Types of function.
 * If it is not a Function, map it as a value.
 */
type MapSimpleFunction<T> = T extends (...args: infer P) => infer R ? (...args: MapArgs<P>) => MapReturn<R> : MapValue<T>;

/**
 * Check if it is a Function like the Events.
 */
type MapFunction<T> = T extends (...a: any) => BrowserWindow ? Overload70<T> : MapSimpleFunction<T>;

/**
 * Map up to 40 Overloads of a Function wich returns a BrowserWindow.
 * This is Used for something like on, off, addEventListener etc.
 */
type Overload70<T, B = BrowserWindow, E = BrowserWindowEx> =
  T extends {
    (...a: infer P01): B; (...a: infer P02): B; (...a: infer P03): B; (...a: infer P04): B; (...a: infer P05): B; (...a: infer P06): B; (...a: infer P07): B; (...a: infer P08): B; (...a: infer P09): B; (...a: infer P10): B;
    (...a: infer P11): B; (...a: infer P12): B; (...a: infer P13): B; (...a: infer P14): B; (...a: infer P15): B; (...a: infer P16): B; (...a: infer P17): B; (...a: infer P18): B; (...a: infer P19): B; (...a: infer P20): B;
    (...a: infer P21): B; (...a: infer P22): B; (...a: infer P23): B; (...a: infer P24): B; (...a: infer P25): B; (...a: infer P26): B; (...a: infer P27): B; (...a: infer P28): B; (...a: infer P29): B; (...a: infer P30): B;
    (...a: infer P31): B; (...a: infer P32): B; (...a: infer P33): B; (...a: infer P34): B; (...a: infer P35): B; (...a: infer P36): B; (...a: infer P37): B; (...a: infer P38): B; (...a: infer P39): B; (...a: infer P40): B;
    (...a: infer P41): B; (...a: infer P42): B; (...a: infer P43): B; (...a: infer P44): B; (...a: infer P45): B; (...a: infer P46): B; (...a: infer P47): B; (...a: infer P48): B; (...a: infer P49): B; (...a: infer P50): B;
    (...a: infer P51): B; (...a: infer P52): B; (...a: infer P53): B; (...a: infer P54): B; (...a: infer P55): B; (...a: infer P56): B; (...a: infer P57): B; (...a: infer P58): B; (...a: infer P59): B; (...a: infer P60): B;
    (...a: infer P61): B; (...a: infer P62): B; (...a: infer P63): B; (...a: infer P64): B; (...a: infer P66): B; (...a: infer P66): B; (...a: infer P67): B; (...a: infer P68): B; (...a: infer P69): B; (...a: infer P70): B;
  } ? {
    (...a: P01): E; (...a: P02): E; (...a: P03): E; (...a: P04): E; (...a: P05): E; (...a: P06): E; (...a: P07): E; (...a: P08): E; (...a: P09): E; (...a: P10): E;
    (...a: P11): E; (...a: P12): E; (...a: P13): E; (...a: P14): E; (...a: P15): E; (...a: P16): E; (...a: P17): E; (...a: P18): E; (...a: P19): E; (...a: P20): E;
    (...a: P21): E; (...a: P22): E; (...a: P23): E; (...a: P24): E; (...a: P25): E; (...a: P26): E; (...a: P27): E; (...a: P28): E; (...a: P29): E; (...a: P30): E;
    (...a: P31): E; (...a: P32): E; (...a: P33): E; (...a: P34): E; (...a: P35): E; (...a: P36): E; (...a: P37): E; (...a: P38): E; (...a: P39): E; (...a: P40): E;
    (...a: P41): E; (...a: P42): E; (...a: P43): E; (...a: P44): E; (...a: P45): E; (...a: P46): E; (...a: P47): E; (...a: P48): E; (...a: P49): E; (...a: P50): E;
    (...a: P51): E; (...a: P52): E; (...a: P53): E; (...a: P54): E; (...a: P55): E; (...a: P56): E; (...a: P57): E; (...a: P58): E; (...a: P59): E; (...a: P60): E;
    (...a: P61): E; (...a: P62): E; (...a: P63): E; (...a: P64): E; (...a: P66): E; (...a: P66): E; (...a: P67): E; (...a: P68): E; (...a: P69): E; (...a: P70): E;
  } : never;

/**
 * Map all returns and parameters and fields with type BrowserWindow to BrowserWindowEx
 */
type MapToEx<T> = {
  [key in keyof T]: MapFunction<T[key]>;
};

/**
 * Class of an instance.
 */
export interface BrowserWindowEx extends MapToEx<BrowserWindow> {
  /**
   * Native Instance of the Browser Window.
   */
  native: BrowserWindow;
}

/**
 * Constructor Type of a Notmal Browser Window.
 */
type BrowserWindowCtor = Pick<typeof BrowserWindow, keyof typeof BrowserWindow>;

/**
 * BrowserWindowEx Constructor Type.
 */
export interface BrowserWindowExCtor extends MapToEx<BrowserWindowCtor> {
  /**
   * Creates a New Browser Window wich is Extensible.
   * @param options - Options are the Same as the Native Browser Window.
   */
  new(options?: BrowserWindowConstructorOptions): BrowserWindowEx;
  /**
   * Native Constructor of the Browser Window.
   */
  native: typeof BrowserWindow;
  /**
   * Maps from a native BrowserWindow to the BrowserWindowEx Instance.
   * @param bw - the Native Browser Window Instance.
   * @returns the Extendable Browser Window Instance.
   */
  fromBrowserWindow(bw: BrowserWindow): BrowserWindowEx;
}

/**
 * retain a mapping from BrowserWindow to BrowserWindowEx.
 */
const map: WeakMap<BrowserWindow, BrowserWindowEx> = new WeakMap();

/**
 * Class for Proxying the Native BrowserWindow Class.
 */
export const BrowserWindowEx = <BrowserWindowExCtor><unknown>class BrowserWindowEx {
  /**
   * Native Constructor of the Browser Window.
   */
  static native: typeof BrowserWindow = BrowserWindow;
  /**
   * Native Instance of the Browser Window.
   */
  native: BrowserWindow;

  /**
   * Creates a New Browser Window wich is Extensible.
   * @param options - Options are the Same as the Native Browser Window.
   */
  constructor(options?: BrowserWindowConstructorOptions | BrowserWindow) {
    if (options instanceof BrowserWindow) {
      // BrowserWindow already exists (hidden option for fromBrowserWindow function)
      this.native = options;
    } else {
      // BrowserWindow is created
      this.native = new BrowserWindow(options);
    }
    // Copy fields from the native BrowserWindow
    implement(this.native, this);
    // Register Class in the map for later lookup
    map.set(this.native, <any>this);
  }

  /**
   * Maps from a native BrowserWindow to the BrowserWindowEx Instance.
   * @param bw - the Native Browser Window Instance.
   * @returns the Extendable Browser Window Instance.
   */
  static fromBrowserWindow(bw: BrowserWindow): BrowserWindowEx {
    let ret = map.get(bw);
    if (ret == undefined) {
      ret = <any>new BrowserWindowEx(<any>bw);
    }
    return <any>ret;
  }
};

/**
 * don't copy Property Descriptors of those fields.
 */
const excludeFields = ["constructor", "prototype", "arguments", "caller"];

/**
 * Copy the implementation from some object and paste it on the Target.
 * @param proto - the Object from wich to copy the Implementation.
 * @param target - the Target where to attach the implementation.
 */
function implement(proto: Object, target: Object) {
  let properties: { [x: string]: PropertyDescriptor; } = {};
  for (let [key, desc] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
    // Don't copy internal fields and other unwanted stuff
    if (key.startsWith("_")) continue;
    if (excludeFields.includes(key)) continue;
    // Proxy getter and setter when defined
    if (typeof desc.get == "function") desc.get = getProxy(key);
    if (typeof desc.set == "function") desc.set = setProxy(key);
    // Proxy Value fields
    if (desc.value !== undefined) {
      if (typeof desc.value == "function") desc.value = fnProxy(key);
      // Non function fields need a getter setter as a proxy
      else {
        desc = { ...desc, get: getProxy(key), set: setProxy(key) };
        delete desc.writable;
        delete desc.value;
      };
    }
    properties[key] = desc;
  }
  // Apply implementations on the target
  Object.defineProperties(target, properties);
}

// Copy Implementations of the EventEmitter
implement((<any>BrowserWindow).prototype.__proto__.__proto__, BrowserWindowEx.prototype);
// Copy Implementations from BaseWindow
implement((<any>BrowserWindow).prototype.__proto__, BrowserWindowEx.prototype);
// Copy Implementations from BrowserWindow
implement(BrowserWindow.prototype, BrowserWindowEx.prototype);
// Copy static Implementations
implement(BrowserWindow, BrowserWindowEx);

/**
 * try's to cast the BrowserWindow Instances returned from API calls to BrowserWindowEx.
 * @param value - the Value wich maybe is a BrowserWindow or BrowserWindow[].
 * @returns the original value if it is not an BrowserWindow([]?) or the BrowserWindowEx Implementation.
 */
function tryCastToEx(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((v) => (v instanceof BrowserWindow) ? BrowserWindowEx.fromBrowserWindow(v) : v);
  return (value instanceof BrowserWindow) ? BrowserWindowEx.fromBrowserWindow(value) : value;
}

/**
 * try's to convert BrowserWindowEx instances supplied to api calls to BrowserWindow
 * @param value - Array of Values wich maybe are BrowserWindowsEx.
 * @returns An Array of Values wich mapped every 
 */
function tryCastFromEx<T extends unknown>(value: T): T {
  if (Array.isArray(value)) return <T>value.map((v) => (v instanceof BrowserWindowEx) ? (v as BrowserWindowEx).native : v);
  return (value instanceof BrowserWindowEx) ? <T>(value as BrowserWindowEx).native : value;
}

/**
 * Proxies an Function of the original implementation.
 * Try's to map the Parameters and return type to the Extendable Implementation.
 * @param key - The Key to Proxy.
 * @returns a Function calling the Original implementation.
 */
function fnProxy(key: string) {
  return function (this: any, ...args: unknown[]) {
    return tryCastToEx(this.native[key](...tryCastFromEx(args)));
  };
}

/**
 * proxies an getter of the original Implementation.
 * @param key - The Key to Proxy.
 * @returns a Function returning the Key of the Native implementation.
 */
function getProxy(this: any, key: string) {
  return function (this: any) {
    return tryCastToEx(this.native[key]);
  };
}

/**
 * proxies an setter of the original Implementation.
 * @param key - The Key to Proxy.
 * @returns a Function setting the Key of the Native implementation.
 */
function setProxy(key: string) {
  return function (this: any, val: unknown) {
    this.native[key] = tryCastFromEx(val);
  };
}

