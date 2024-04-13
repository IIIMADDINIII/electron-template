import { configureLocalization, type RuntimeConfiguration } from "@lit/localize";

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
let internalConfig: Omit<RuntimeConfiguration, "loadLocale"> | undefined;

/**
 * Sets up lit localization.
 * @param routePrefix - the Prefix of the route, where the Localization files are served (default = "/locales/").
 * @param config - optionally provide a object containing the sourceLocale and targetLocales (default = will request this information from main).
 */
export async function initLocalization(routePrefix: string = "/locales/", config?: Omit<RuntimeConfiguration, "loadLocale"> | undefined): Promise<void> {
  if (internalConfig !== undefined) throw new Error("Localization is already initialized.");
  internalConfig = config;
  if (internalConfig === undefined) internalConfig = await (await fetch(routePrefix)).json();
  if (internalConfig === undefined) throw new Error("Empty Config is not Possible.");
  ({ getLocale: internalGetLocale, setLocale: internalSetLocale } = configureLocalization({
    loadLocale: (locale) => import(routePrefix + locale),
    ...internalConfig,
  }));
  if (internalConfig.sourceLocale.endsWith("-x-dev")) await setLocale(internalConfig.sourceLocale.slice(0, -6));
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