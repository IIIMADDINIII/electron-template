import { wait } from "@app/common";
import { css, CSSResult, LitElement } from "lit";
import { initLocalization, initRemote, readySignalIsUsed, readySignalSend, type CreateObjectStoreOptions } from "./rendererWindowApi.js";

/**
 * Checking if Element is of a specific Type.
 * @param elem - Element to check.
 * @param tag - the Expected Tag Name the Element should have.
 * @returns boolean indicating if element has the tag.
 */
export function isElement<T extends keyof HTMLElementTagNameMap>(elem: EventTarget | null, tag: T): elem is HTMLElementTagNameMap[T] {
  if (elem === null) return false;
  if (!(elem instanceof Element)) return false;
  if (elem.tagName.toLocaleUpperCase() !== tag.toLocaleUpperCase()) return false;
  return true;
}

/** Options on how to initialize. */
export type InitOptions = {
  /** Main Element (or Constructor to Instantiate and) to Append to the body. */
  mainElement?: Element | typeof Element | undefined;
  /**
   * Styles which should be applied at the Document Level.
   * @default css`html, body {
   *   height: 100%;
   *   width: 100%;
   *   margin: 0px;
   * }
   * *, *::after, *::before {
   *   user-select: none;
   *   -webkit-user-drag: none;
   *   touch-action: none;
   * }`
   */
  documentStyles?: CSSResult | undefined | null;
  /** Function gets called just after main Element is added to the Dom and before waiting to send the Ready Signal */
  init?: undefined | (() => Promise<void> | void);
  /**
   * How many ms should the ready signal be delayed before sent to main (after the DOMContentLoaded and load event haf triggered).
   * @default 0
   */
  readySignalDelay?: number | undefined;
  /** Options on how to Initialize the objectStore Remote. */
  remoteObjectStore?: CreateObjectStoreOptions | undefined;
  /**
   * Wait until the load event before sending the ready event.
   * @default true
   */
  waitLoaded?: boolean | undefined;
};

/**
 * Initialize the Document and interfaces.
 * @param options - options on how to initialize.
 */
export async function init(options: InitOptions = {}) {
  try {
    let styles = options.documentStyles;
    let main = options.mainElement;
    initRemote(options.remoteObjectStore);
    await readySignalIsUsed();
    if (styles === undefined) styles = css`html,body{height:100%;width:100%;margin:0px;}*,*::after,*::before{user-select:none;-webkit-user-drag:none;touch-action:none;}`;
    if (styles !== null) addDocumentStyles(styles);
    await initLocalization();
    if (main !== undefined) {
      if (!(main instanceof Element)) main = new main();
      document.body.appendChild(main);
      if (main instanceof LitElement) {
        while (!await main.updateComplete) { }
      }
    }
    if (options.init) await options.init();
    if (options.waitLoaded === undefined || options.waitLoaded) await waitLoaded;
    await doubleRaf();
    await wait(options.readySignalDelay ?? 0);
    await readySignalSend();
  } catch (e) {
    console.error(e);
  }
}

/** Await this wo wait until all content is loaded (load event of the Document fired) */
export const waitLoaded: Promise<void> = document.readyState === "complete" ? Promise.resolve() : new Promise<void>((res) => {
  window.addEventListener("load", () => res(), { once: true });
});

/**
 * Promise version of requestAnimationFrame.
 * This Promise resolves just before the browser is painting the next frame.
 * https://developer.mozilla.org/de/docs/Web/API/DedicatedWorkerGlobalScope/requestAnimationFrame
 * @returns DOMHighResTimeStamp
 */
export function raf(): Promise<DOMHighResTimeStamp> {
  return new Promise((res) => {
    window.requestAnimationFrame(res);
  });
}

/**
 * Promise version of a double RAF.
 * This is actually implemented using a requestAnimationFrame followed by a setTimeout(, 0).
 * It has the benefit, that it doesen't wait for the second frame but instead starts the work after the current frame finished.
 * @returns 
 */
export function doubleRaf(): Promise<DOMHighResTimeStamp> {
  return new Promise((res) => {
    window.requestAnimationFrame(() => {
      window.setTimeout(res, 0);
    });
  });
}

/**
 * Function to add document wide Stylesheets using a css`` Template String.
 * @param styles - the result of an css`` template String.
 */
export function addDocumentStyles(styles: CSSResult, doc: Document = document): void {
  const styleSheet = styles.styleSheet;
  if (styleSheet === undefined) throw new Error("Error while creating Document Styles");
  doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, styleSheet];
}

/** Options on how to create a Window. */
export type CreateWindowOptions = {
  /** Main Element (or Constructor to Instantiate and) to Append to the body. */
  mainElement?: Element | typeof Element | undefined;
  /**
   * Styles which should be applied at the Document Level.
   * @default css`html, body {
   *   height: 100%;
   *   width: 100%;
   *   margin: 0px;
   * }
   * *, *::after, *::before {
   *   user-select: none;
   *   -webkit-user-drag: none;
   *   touch-action: none;
   * }`
   */
  documentStyles?: CSSResult | undefined | null;
};

/**
 * Function creates an Empty Window (about:blank) and applies styles and an Main Element to the new Document.
 * @param options - options for how to create this document.
 * @returns the window instance.
 */
export function createWindow(options: CreateWindowOptions): Window | null {
  try {
    let styles = options.documentStyles;
    let main = options.mainElement;
    const win = window.open("about:blank");
    if (win === null) return null;
    if (styles === undefined) styles = css`html,body{height:100%;width:100%;margin:0px;}*,*::after,*::before{user-select:none;-webkit-user-drag:none;touch-action:none;}`;
    if (styles !== null) addDocumentStyles(styles, win.document);
    if (main !== undefined) {
      if (!(main instanceof Element)) main = new main();
      document.body.appendChild(main);
    }
    return win;
  } catch (e) {
    console.error(e);
    return null;
  }
}

/**
 * Return a Promise wich resolves if a Image is loaded Successfully.
 * Throws if the image fails to load.
 * @param image - the Image Element to wait for.
 */
export function waitImageLoaded(image: HTMLImageElement): Promise<void> {
  if (image.complete) return Promise.resolve();
  return new Promise((res, rej) => {
    function finish(error?: Error) {
      image.removeEventListener("load", resolve);
      image.removeEventListener("error", reject);
      if (error) return rej(error);
      res();
    }
    const resolve = () => finish();
    const reject = () => finish(new Error("Failed to Load Image"));
    image.addEventListener("load", resolve);
    image.addEventListener("error", reject);
  });
}

/**
 * Return a Promise wich resolves if a Image is loaded or failed to load.
 * does not throw if the Image fails to Load.
 * @param image - the Image to wait for.
 */
export async function waitImageSettled(image: HTMLImageElement): Promise<void> {
  try {
    await waitImageLoaded(image);
  } catch { }
}
