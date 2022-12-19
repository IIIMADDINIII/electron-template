import { BrowserWindow } from "electron";
import type { BrowserWindowConstructorOptions } from "electron/main";

// retain a mapping from BrowserWindow to BrowserWindowEx
const map: WeakMap<BrowserWindow, BrowserWindowEx> = new WeakMap();

// Map a Value
type MapValue<T> = T extends BrowserWindow ? BrowserWindowEx : T;

// Map the Return Type of a Function 1
type MapReturn<T> = T extends BrowserWindow[] ? BrowserWindowEx[] : MapValue<T>;

// Map if Browser Window is the First argument
type MapArgs<T> = T extends [BrowserWindow | infer U] ? [BrowserWindow | U] extends T ? [win: BrowserWindowEx | BrowserWindow | U] : T : T;

// Map all Parameters and Return Types of function 
type MapSimpleFunction<T> = T extends (...args: infer P) => infer R ? (...args: MapArgs<P>) => MapReturn<R> : T;

// Check if it is a Function like the Events
type MapFunction<T> = T extends (...a: any) => BrowserWindow ? Overload40<T> : MapSimpleFunction<T>;

// Map all 40 Overloads for future use
type Overload40<T, B = BrowserWindow, E = BrowserWindowEx> =
  T extends {
    (...a: infer P01): B; (...a: infer P02): B; (...a: infer P03): B; (...a: infer P04): B; (...a: infer P05): B; (...a: infer P06): B; (...a: infer P07): B; (...a: infer P08): B; (...a: infer P09): B; (...a: infer P10): B;
    (...a: infer P11): B; (...a: infer P12): B; (...a: infer P13): B; (...a: infer P14): B; (...a: infer P15): B; (...a: infer P16): B; (...a: infer P17): B; (...a: infer P18): B; (...a: infer P19): B; (...a: infer P20): B;
    (...a: infer P21): B; (...a: infer P22): B; (...a: infer P23): B; (...a: infer P24): B; (...a: infer P25): B; (...a: infer P26): B; (...a: infer P27): B; (...a: infer P28): B; (...a: infer P29): B; (...a: infer P30): B;
    (...a: infer P31): B; (...a: infer P32): B; (...a: infer P33): B; (...a: infer P34): B; (...a: infer P35): B; (...a: infer P36): B; (...a: infer P37): B; (...a: infer P38): B; (...a: infer P39): B; (...a: infer P40): B;
  } ? {
    (...a: P01): E; (...a: P02): E; (...a: P03): E; (...a: P04): E; (...a: P05): E; (...a: P06): E; (...a: P07): E; (...a: P08): E; (...a: P09): E; (...a: P10): E;
    (...a: P11): E; (...a: P12): E; (...a: P13): E; (...a: P14): E; (...a: P15): E; (...a: P16): E; (...a: P17): E; (...a: P18): E; (...a: P19): E; (...a: P20): E;
    (...a: P21): E; (...a: P22): E; (...a: P23): E; (...a: P24): E; (...a: P25): E; (...a: P26): E; (...a: P27): E; (...a: P28): E; (...a: P29): E; (...a: P30): E;
    (...a: P31): E; (...a: P32): E; (...a: P33): E; (...a: P34): E; (...a: P35): E; (...a: P36): E; (...a: P37): E; (...a: P38): E; (...a: P39): E; (...a: P40): E;
  } : Overload39<T>;

// Map all 39 Overloads for future use
type Overload39<T, B = BrowserWindow, E = BrowserWindowEx> =
  T extends {
    (...a: infer P01): B; (...a: infer P02): B; (...a: infer P03): B; (...a: infer P04): B; (...a: infer P05): B; (...a: infer P06): B; (...a: infer P07): B; (...a: infer P08): B; (...a: infer P09): B; (...a: infer P10): B;
    (...a: infer P11): B; (...a: infer P12): B; (...a: infer P13): B; (...a: infer P14): B; (...a: infer P15): B; (...a: infer P16): B; (...a: infer P17): B; (...a: infer P18): B; (...a: infer P19): B; (...a: infer P20): B;
    (...a: infer P21): B; (...a: infer P22): B; (...a: infer P23): B; (...a: infer P24): B; (...a: infer P25): B; (...a: infer P26): B; (...a: infer P27): B; (...a: infer P28): B; (...a: infer P29): B; (...a: infer P30): B;
    (...a: infer P31): B; (...a: infer P32): B; (...a: infer P33): B; (...a: infer P34): B; (...a: infer P35): B; (...a: infer P36): B; (...a: infer P37): B; (...a: infer P38): B; (...a: infer P39): B;
  } ? {
    (...a: P01): E; (...a: P02): E; (...a: P03): E; (...a: P04): E; (...a: P05): E; (...a: P06): E; (...a: P07): E; (...a: P08): E; (...a: P09): E; (...a: P10): E;
    (...a: P11): E; (...a: P12): E; (...a: P13): E; (...a: P14): E; (...a: P15): E; (...a: P16): E; (...a: P17): E; (...a: P18): E; (...a: P19): E; (...a: P20): E;
    (...a: P21): E; (...a: P22): E; (...a: P23): E; (...a: P24): E; (...a: P25): E; (...a: P26): E; (...a: P27): E; (...a: P28): E; (...a: P29): E; (...a: P30): E;
    (...a: P31): E; (...a: P32): E; (...a: P33): E; (...a: P34): E; (...a: P35): E; (...a: P36): E; (...a: P37): E; (...a: P38): E; (...a: P39): E;
  } : Overload38<T>;

// Map all 38 Overloads for future use
type Overload38<T, B = BrowserWindow, E = BrowserWindowEx> =
  T extends {
    (...a: infer P01): B; (...a: infer P02): B; (...a: infer P03): B; (...a: infer P04): B; (...a: infer P05): B; (...a: infer P06): B; (...a: infer P07): B; (...a: infer P08): B; (...a: infer P09): B; (...a: infer P10): B;
    (...a: infer P11): B; (...a: infer P12): B; (...a: infer P13): B; (...a: infer P14): B; (...a: infer P15): B; (...a: infer P16): B; (...a: infer P17): B; (...a: infer P18): B; (...a: infer P19): B; (...a: infer P20): B;
    (...a: infer P21): B; (...a: infer P22): B; (...a: infer P23): B; (...a: infer P24): B; (...a: infer P25): B; (...a: infer P26): B; (...a: infer P27): B; (...a: infer P28): B; (...a: infer P29): B; (...a: infer P30): B;
    (...a: infer P31): B; (...a: infer P32): B; (...a: infer P33): B; (...a: infer P34): B; (...a: infer P35): B; (...a: infer P36): B; (...a: infer P37): B; (...a: infer P38): B;
  } ? {
    (...a: P01): E; (...a: P02): E; (...a: P03): E; (...a: P04): E; (...a: P05): E; (...a: P06): E; (...a: P07): E; (...a: P08): E; (...a: P09): E; (...a: P10): E;
    (...a: P11): E; (...a: P12): E; (...a: P13): E; (...a: P14): E; (...a: P15): E; (...a: P16): E; (...a: P17): E; (...a: P18): E; (...a: P19): E; (...a: P20): E;
    (...a: P21): E; (...a: P22): E; (...a: P23): E; (...a: P24): E; (...a: P25): E; (...a: P26): E; (...a: P27): E; (...a: P28): E; (...a: P29): E; (...a: P30): E;
    (...a: P31): E; (...a: P32): E; (...a: P33): E; (...a: P34): E; (...a: P35): E; (...a: P36): E; (...a: P37): E; (...a: P38): E;
  } : Overload37<T>;

// Map all 37 Overloads for future use
type Overload37<T, B = BrowserWindow, E = BrowserWindowEx> =
  T extends {
    (...a: infer P01): B; (...a: infer P02): B; (...a: infer P03): B; (...a: infer P04): B; (...a: infer P05): B; (...a: infer P06): B; (...a: infer P07): B; (...a: infer P08): B; (...a: infer P09): B; (...a: infer P10): B;
    (...a: infer P11): B; (...a: infer P12): B; (...a: infer P13): B; (...a: infer P14): B; (...a: infer P15): B; (...a: infer P16): B; (...a: infer P17): B; (...a: infer P18): B; (...a: infer P19): B; (...a: infer P20): B;
    (...a: infer P21): B; (...a: infer P22): B; (...a: infer P23): B; (...a: infer P24): B; (...a: infer P25): B; (...a: infer P26): B; (...a: infer P27): B; (...a: infer P28): B; (...a: infer P29): B; (...a: infer P30): B;
    (...a: infer P31): B; (...a: infer P32): B; (...a: infer P33): B; (...a: infer P34): B; (...a: infer P35): B; (...a: infer P36): B; (...a: infer P37): B;
  } ? {
    (...a: P01): E; (...a: P02): E; (...a: P03): E; (...a: P04): E; (...a: P05): E; (...a: P06): E; (...a: P07): E; (...a: P08): E; (...a: P09): E; (...a: P10): E;
    (...a: P11): E; (...a: P12): E; (...a: P13): E; (...a: P14): E; (...a: P15): E; (...a: P16): E; (...a: P17): E; (...a: P18): E; (...a: P19): E; (...a: P20): E;
    (...a: P21): E; (...a: P22): E; (...a: P23): E; (...a: P24): E; (...a: P25): E; (...a: P26): E; (...a: P27): E; (...a: P28): E; (...a: P29): E; (...a: P30): E;
    (...a: P31): E; (...a: P32): E; (...a: P33): E; (...a: P34): E; (...a: P35): E; (...a: P36): E; (...a: P37): E;
  } : Overload36<T>;

// Map all 36 Overloads of the Events which are Currently needed
type Overload36<T, B = BrowserWindow, E = BrowserWindowEx> =
  T extends {
    (...a: infer P01): B; (...a: infer P02): B; (...a: infer P03): B; (...a: infer P04): B; (...a: infer P05): B; (...a: infer P06): B; (...a: infer P07): B; (...a: infer P08): B; (...a: infer P09): B; (...a: infer P10): B;
    (...a: infer P11): B; (...a: infer P12): B; (...a: infer P13): B; (...a: infer P14): B; (...a: infer P15): B; (...a: infer P16): B; (...a: infer P17): B; (...a: infer P18): B; (...a: infer P19): B; (...a: infer P20): B;
    (...a: infer P21): B; (...a: infer P22): B; (...a: infer P23): B; (...a: infer P24): B; (...a: infer P25): B; (...a: infer P26): B; (...a: infer P27): B; (...a: infer P28): B; (...a: infer P29): B; (...a: infer P30): B;
    (...a: infer P31): B; (...a: infer P32): B; (...a: infer P33): B; (...a: infer P34): B; (...a: infer P35): B; (...a: infer P36): B;
  } ? {
    (...a: P01): E; (...a: P02): E; (...a: P03): E; (...a: P04): E; (...a: P05): E; (...a: P06): E; (...a: P07): E; (...a: P08): E; (...a: P09): E; (...a: P10): E;
    (...a: P11): E; (...a: P12): E; (...a: P13): E; (...a: P14): E; (...a: P15): E; (...a: P16): E; (...a: P17): E; (...a: P18): E; (...a: P19): E; (...a: P20): E;
    (...a: P21): E; (...a: P22): E; (...a: P23): E; (...a: P24): E; (...a: P25): E; (...a: P26): E; (...a: P27): E; (...a: P28): E; (...a: P29): E; (...a: P30): E;
    (...a: P31): E; (...a: P32): E; (...a: P33): E; (...a: P34): E; (...a: P35): E; (...a: P36): E;
  } : T;

// Map all returns and parameters with type BrowserWindow to BrowserWindowEx
type MapToEx<T> = {
  [key in keyof T]: MapFunction<T[key]>;
};

// Class of an instance
export interface BrowserWindowEx extends MapToEx<BrowserWindow> {
  native: BrowserWindow;
}

// Type of the Constructor of a BrowserWindow
type BrowserWindowCtor = Pick<typeof BrowserWindow, keyof typeof BrowserWindow>;

// BrowserWindowEx Constructor Type
export interface BrowserWindowExCtor extends MapToEx<BrowserWindowCtor> {
  new(options?: BrowserWindowConstructorOptions): BrowserWindowEx;
  native: BrowserWindow;
  fromBrowserWindow(bw: BrowserWindow): BrowserWindowEx;
}

// Class for Proxying the Native BrowserWindow Class
export const BrowserWindowEx = <BrowserWindowExCtor><unknown>class BrowserWindowEx {
  // Map to the Native representations
  static native: typeof BrowserWindow = BrowserWindow;
  native: BrowserWindow;

  // Hidden constructor type to create an BrowserWindowEx after the fact
  constructor(options?: BrowserWindowConstructorOptions | BrowserWindow) {
    if (options instanceof BrowserWindow) {
      // BrowserWindow already exists
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

  // Maps from a native BrowserWindow to the BrowserWindowEx Instance
  static fromBrowserWindow(bw: BrowserWindow): BrowserWindowEx {
    let ret = map.get(bw);
    if (ret == undefined) {
      ret = <any>new BrowserWindowEx(<any>bw);
    }
    return <any>ret;
  }
};

// don't copy Property Descriptors of those fields
const excludeFields = ["constructor", "prototype", "arguments", "caller"];

// Copy the implementation from some object and paste it on the Target
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

// try's to cast the BrowserWindow Instances returned from API calls to BrowserWindowEx
function tryCastToEx(value: unknown): unknown {
  if (!(value instanceof BrowserWindow)) return value;
  if (Array.isArray(value)) return value.map((v) => (v instanceof BrowserWindow) ? BrowserWindowEx.fromBrowserWindow(v) : v);
  return BrowserWindowEx.fromBrowserWindow(value);
}

// try's to convert BrowserWindowEx instances supplied to api calls to BrowserWindow
function tryCastFromEx(value: unknown[]): unknown[] {
  return value.map((v) => (v instanceof BrowserWindowEx) ? BrowserWindowEx.native : v);
}

// Proxies an Function of the original implementation
function fnProxy(key: string) {
  return function (this: any, ...args: unknown[]) {
    return tryCastToEx(this.native[key](...tryCastFromEx(args)));
  };
}

// proxies an getter of the original Implementation
function getProxy(this: any, key: string) {
  return function (this: any) {
    return this.native[key];
  };
}

// proxies an setter of the original Implementation
function setProxy(key: string) {
  return function (this: any, val: unknown) {
    this.native[key] = val;
  };
}

