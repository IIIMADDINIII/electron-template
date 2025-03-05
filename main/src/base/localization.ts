import { configureLocalization, str, type LocaleStatusEventDetail } from "@lit/localize";
import { lookup } from "bcp-47-match";
import { app } from "electron/main";
import { html } from "lit-html";
import * as locales from "./locales/index.js";

/** Type of the Listener for Locale Events */
export type LocaleEventListener = (detail: LocaleStatusEventDetail) => void;

/** Information about the Translation Config */
export type LocaleInfo = {
  /** The Locale which represents the Source */
  sourceLocale: string;
  /** A list of other available Locales */
  targetLocales: string[];
  /** A List of all available Locales */
  allLocales: string[];
};

/** List of all Listeners for Locale Events */
const localeEventListeners: LocaleEventListener[] = [];

/** Catching Locale Events and sending them to all Locale Listeners */
if ((globalThis as any).window === undefined) (globalThis as any).window = {};
(globalThis as any).window.dispatchEvent = (event: { detail: LocaleStatusEventDetail; }) => {
  const detail = event.detail;
  for (const listener of localeEventListeners) {
    listener(detail);
  }
};

/**
 * Add a Listener for Locale Events.
 * @param listener - Function which is executed if the status of locales changes (details as parameter).
 */
export function addLocaleEventListener(listener: LocaleEventListener): void {
  localeEventListeners.push(listener);
}

/**
 * Remove the Listener from the Locale Events List.
 * @param listener - The Listener which was added with addLocaleEventListener
 */
export function removeLocaleEventListener(listener: LocaleEventListener): void {
  const i = localeEventListeners.indexOf(listener);
  if (i >= 0) localeEventListeners.splice(i, 1);
}

/**
 * Status Data of the Locale.
 * Initialized by initLocalization.
 */
let data: undefined | {
  getLocale(): string;
  setLocale(locale: string): Promise<void>;
  sourceLocale: string;
  targetLocales: string[];
  allLocales: string[];
} = undefined;

export type InitLocalizationOptions = {

};

export function initLocalization(): void {
  if (data !== undefined) throw new Error("Localization is already initialized.");
  const sourceLocale = locales.sourceLocale;
  const targetLocales = Object.keys(locales.locales);
  const allLocales = [sourceLocale, ...targetLocales];
  const { getLocale, setLocale } = configureLocalization({
    sourceLocale,
    targetLocales,
    async loadLocale(locale) {
      return locales.locales[locale as keyof typeof locales.locales](str, html);
    },
  });
  data = {
    getLocale,
    setLocale,
    sourceLocale,
    targetLocales,
    allLocales,
  };
}

/**
 * Returns the locale string of the currently loaded locale
 * @returns string of the currently loaded Locale.
 */
export function getLocale(): string {
  if (data === undefined) throw new Error("Accessed Localization before Initialization");
  return data.getLocale();
}

/**
 * Load a new Locale and wait until it is loaded.
 * @param locale - locale id to load.
 * @returns Promise which resolves as soon as the locale is loaded.
 */
export async function setLocale(locale: string): Promise<void> {
  if (data === undefined) throw new Error("Accessed Localization before Initialization");
  return await data.setLocale(locale);
}

/**
 * Returns all information about the Locale Config.
 * @returns Information about the Locale Config.
 */
export function getLocaleInfo(): LocaleInfo {
  if (data === undefined) throw new Error("Accessed Localization before Initialization");
  return {
    sourceLocale: data.sourceLocale,
    targetLocales: data.targetLocales,
    allLocales: data.allLocales,
  };
};

/**
 * Get a list of all available Locales.
 * @returns a list of all available source locales.
 */
export function getLocales(): string[] {
  if (data === undefined) throw new Error("Accessed Localization before Initialization");
  return data.allLocales;
}

/**
 * Searches for the best fitting locale inside availableLocales in the order of preferredLocales.
 * @param preferredLocales - a list of locales strings sorted by highest priority first.
 * @param availableLocales - a list of available locale translations.
 * @param fallback - optional default value to return if no match can be found.
 * @returns the best matching locale from availableLocales or undefined (fallback) id non can be matched.
 */
export function getBestLocale(preferredLocales: string[], availableLocales: string[], fallback: string): string;
export function getBestLocale(preferredLocales: string[], availableLocales: string[], fallback?: string | undefined): string | undefined;
export function getBestLocale(preferredLocales: string[], availableLocales: string[], fallback: string | undefined = undefined): string | undefined {
  const tags = [...availableLocales];
  const map = new Map<string, string>(tags.map((v) => [v, v]));
  for (let locale of availableLocales.toSorted((a, b) => a.endsWith("-x-dev") ? 1 : b.endsWith("-x-dev") ? -1 : a.split("-").length - b.split("-").length)) {
    const orig = locale;
    let i = 0;
    while ((i = locale.lastIndexOf("-")) > -1) {
      locale = locale.slice(0, i);
      if (!map.has(locale)) {
        tags.push(locale);
        map.set(locale, orig);
      }
    }
  }
  tags.sort((a, b) => b.split("-").length - a.split("-").length);
  const l = lookup(tags, preferredLocales);
  if (l === undefined) return fallback;
  return map.get(l) ?? fallback;
}

/**
 * Returns the best fitting preferred locale (from Operating System) based on the available locales (via getLocales).
 * @param fallback - optional locale to return if non can be matched.
 * @returns the best fitting locale or undefined (fallback) if none can be found.
 */
export function getBestPreferredSystemLocale(fallback: string): string;
export function getBestPreferredSystemLocale(fallback?: string | undefined): string | undefined;
export function getBestPreferredSystemLocale(fallback: string | undefined = undefined): string | undefined {
  return getBestLocale(app.getPreferredSystemLanguages(), getLocales(), fallback);
}

/**
 * Sets the best fitting preferred locale based on the available locales (via getLocales).
 * @param fallback - locale to return if non can be matched.
 * @returns Resolves after locale has been loaded.
 */
export function setLocaleBasedOnSystem(fallback: string): Promise<void> {
  return setLocale(getBestLocale(app.getPreferredSystemLanguages(), getLocales(), fallback));
}