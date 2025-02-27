import { wait } from "@app/common";
import type { RuntimeConfiguration } from "@lit/localize";
import { css, CSSResult, LitElement } from "lit";
import { initLocalization } from "./localization.js";
import { initRemote, readySignalIsUsed, readySignalSend, type InitRemoteOptions } from "./mainInterface.js";

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

/**
 * Options on how to initialize.
 */
export type InitOptions = {
  /**
   * Main Element to Append to the body.
   */
  mainElement?: Node | undefined;
  /**
   * Styles which should be applied at the Document Level.
   * @default css`html, body {
   *    height: 100%;
   *    width: 100%;
   *    margin: 0px;
   *    user-select: none;
   *  }`
   */
  documentStyles?: CSSResult | undefined | null;
  /**
   * Function gets called just before ready signal is set to main.
   */
  init?: undefined | (() => Promise<void> | void);
  /**
   * How many ms should the ready signal be delayed before sent to main.
   * @default 0
   */
  readySignalDelay?: number | undefined;
  /**
   * Options on how to Initialize the objectStore Remote.
   */
  remoteObjectStore?: InitRemoteOptions | undefined;
  /**
   * Initialization Options for Localization
   */
  localization?: undefined | {
    /**
     * name of the locale wich should be loaded on startup (by default setting from main or source-locale without -x-dev when it exists).
     */
    locale?: string | undefined;
    /**
     * the Prefix of the route, where the Localization files are served (default = "/locales/").
     */
    routePrefix?: string | undefined;
    /**
     * optionally provide a object containing the sourceLocale and targetLocales (default = will request this information from main).
     */
    config?: Omit<RuntimeConfiguration, "loadLocale"> | undefined;
  };
};

/**
 * Initialize the Document and interfaces.
 * @param options - options on how to initialize.
 */
export async function init(options: InitOptions = {}) {
  try {
    let styles = options.documentStyles;
    const main = options.mainElement;
    initRemote(options.remoteObjectStore);
    await readySignalIsUsed();
    if (styles === undefined) styles = css`html,body{height:100%;width:100%;margin:0px;user-select:none;}`;
    if (styles !== null) addDocumentStyles(styles);
    await initLocalization(options.localization?.locale, options.localization?.routePrefix, options.localization?.config);
    if (main !== undefined) {
      document.body.appendChild(main);
      if (main instanceof LitElement) {
        while (!await main.updateComplete) { }
      }
    }
    if (options.init) await options.init();
    await doubleRaf();
    await wait(options.readySignalDelay ?? 0);
    await readySignalSend();
  } catch (e) {
    console.error(e);
  }
}

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
export function addDocumentStyles(styles: CSSResult): void {
  const styleSheet = styles.styleSheet;
  if (styleSheet === undefined) throw new Error("Error while creating Document Styles");
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, styleSheet];
}