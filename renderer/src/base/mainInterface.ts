import { configureLocalization, str, type RuntimeConfiguration } from "@lit/localize";
import { html } from "lit";

/**
 * Applies a new Locale to the Page.
 * @param newLocale - the new Locale to load.
 */
export function setLocale(newLocale: string): Promise<void> {
  if (internalSetLocale === undefined) throw new Error("Localization needs to be initialized first.");
  return internalSetLocale(newLocale);
}

/**
 * returns the current locale in use.
 * @returns a string with the locale.
 */
export function getLocale(): string {
  if (internalGetLocale === undefined) throw new Error("Localization needs to be initialized first.");
  return internalGetLocale();
}

/**
 * Returns a list of available locales.
 * @returns an array of strings with the available locales.
 */
export function getTargetLocales(): string[] {
  if (internalConfig === undefined) throw new Error("Localization needs to be initialized first.");
  return [...internalConfig.targetLocales];
}

/**
 * Internally stores the function to get the current locale.
 */
let internalGetLocale: (() => string) | undefined = undefined;
/**
 * Internally stores the function to set a new locale.
 */
let internalSetLocale: ((newLocale: string) => Promise<void>) | undefined = undefined;
/**
 * Internally stores the configuration of the localization (sourceLocale, targetLocale).
 */
let internalConfig: Omit<RuntimeConfiguration, "loadLocale"> & { defaultLocale?: string | undefined; } | undefined;

/**
 * Sets up lit localization.
 * @param locale - name of the locale wich should be loaded on startup (by default setting from main or source-locale without -x-dev when it exists).
 * @param routePrefix - the Prefix of the route, where the Localization files are served (default = "/locales/").
 * @param config - optionally provide a object containing the sourceLocale and targetLocales (default = will request this information from main).
 */
export async function initLocalization(locale: string | undefined = undefined, routePrefix: string = "/locales/", config?: Omit<RuntimeConfiguration, "loadLocale"> | undefined): Promise<void> {
  if (internalConfig !== undefined) throw new Error("Localization is already initialized.");
  internalConfig = config;
  if (internalConfig === undefined) internalConfig = await (await fetch(routePrefix)).json();
  if (internalConfig === undefined) throw new Error("Empty Config is not Possible.");
  ({ getLocale: internalGetLocale, setLocale: internalSetLocale } = configureLocalization({
    loadLocale: async (locale) => (await import(routePrefix + locale)).templates(str, html),
    ...internalConfig,
  }));
  const validLocales = new Set(internalConfig.targetLocales);
  validLocales.add(internalConfig.sourceLocale);
  if (locale && validLocales.has(locale)) return await setLocale(locale);
  if (internalConfig.defaultLocale && validLocales.has(internalConfig.defaultLocale)) return await setLocale(internalConfig.defaultLocale);
  if (internalConfig.sourceLocale.endsWith("-x-dev") && validLocales.has(internalConfig.sourceLocale.slice(0, -6))) return await setLocale(internalConfig.sourceLocale.slice(0, -6));
}

declare global {
  interface Window {
    readySignal?: {
      isUsed?(): void;
      send?(): void;
    };
  }
}

/**
 * Sends the Ready Signal used event to the RendererWindow.
 * Call this as soon as Possible in you code.
 * The RendererWindow will delay the show of the Window after you call readySignalSend().
 */
export function readySignalIsUsed() {
  window.readySignal?.isUsed?.();
}

/**
 * Sends the Ready Signal event to the RendererWindow.
 * This signalizes to the RendererWindow that the Window is ready to be shown.
 * This only works if the readySignalUsed was send early enough.
 */
export function readySignalSend() {
  window.readySignal?.send?.();
}