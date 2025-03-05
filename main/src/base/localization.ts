import { configureLocalization, str, type LocaleStatusEventDetail } from "@lit/localize";
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
 * Searches for the best fitting locale inside 
 * @param preferredLocales 
 * @param availableLocales 
 * @returns 
 */
export function getBestLocale(preferredLocales: string[], availableLocales: string[]): string | undefined;
export function getBestLocale(preferredLocales: string[], availableLocales: string[], fallback: string): string;
export function getBestLocale(preferredLocales: string[], availableLocales: string[], fallback: string | undefined = undefined): string | undefined {

}