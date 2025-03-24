import type { LocaleStatusEventDetail, Translations } from "@app/common";
import { configureLocalization, str } from "@lit/localize";
import { lookup } from "bcp-47-match";
import { app } from "electron/main";
import { readFile, writeFile } from "fs/promises";
import { html } from "lit-html";
import { resolve } from "path";
import * as locales from "./locales/index.js";

/** Content of the Translation Module */
export type LocaleModule = { templates: Translations; };

/** Type of the Listener for Locale Events */
export type LocaleEventListener = (detail: LocaleStatusEventDetail) => void;

/** List of all Listeners for Locale Events */
const localeEventListeners: LocaleEventListener[] = [];

/**
 * Emit an Lit Event to all who Listen.
 * @param event - The Details of the Event to dispatch.
 */
function emitLitEvent(event: { detail: LocaleStatusEventDetail; }) {
  const detail = event.detail;
  if (detail.status === "ready" && data !== undefined) {
    if (detail.readyLocale === data.sourceLocale) setTemplate(undefined);
    if (data.localeFile !== "")
      writeFile(data.localeFile, JSON.stringify(data.systemWasSet ? "" : detail.readyLocale))
        .catch((e) => console.error("Error while Saving Locale Change to Disk:", e));
    detail.translations = getLoadedTemplate();
  }
  for (const listener of localeEventListeners) {
    listener(detail);
  }
}

/** Catching Locale Events and sending them to all Locale Listeners */
if ((globalThis as any).window === undefined) (globalThis as any).window = {};
(globalThis as any).window.dispatchEvent = emitLitEvent;

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
  systemWasSet: boolean;
  sourceLocale: string;
  targetLocales: Set<string>;
  allLocales: Set<string>;
  fallback: string;
  localeFile: string;
  wrapperTemplate: Translations;
  loadedTemplate: Translations | undefined;
  loadLocale: (locale: string) => Promise<LocaleModule> | LocaleModule;
} = undefined;

/**
 * Internal Helper function to set the Template fields correctly.
 * @param template - the template to apply.
 * @returns the wrapperTemplate.
 */
function setTemplate(template: LocaleModule | undefined): Translations {
  if (data === undefined) throw new Error("Accessed Localization before Initialization");
  data.loadedTemplate = template?.templates;
  if (data.loadedTemplate === undefined) return Object.setPrototypeOf(data.wrapperTemplate, null);
  return Object.setPrototypeOf(data.wrapperTemplate, data.loadedTemplate);
}

/**
 * Options on how to initialize the Localization.
 */
export type InitLocalizationOptions = {
  /**
   * Path to the file, where to store the Locale Data.
   * Use an Empty String so not store Locale to Disk.
   * Default is resolve(app.getPath("userdata"), "locale.json").
   */
  persistentLocale?: string | undefined;
  /**
   * Locale to Use if no system locale is compatible with the available translations. 
   * It uses the sourceLocale (with -x-dev removed when possible) by default.
   */
  fallback?: string | undefined;
  /**
   * The Source Locale to use.
   * Uses the value from ./locales/index.ts by default.
   */
  sourceLocale?: string | undefined;
  /**
   * A list of valid locales to use.
   * Should match the available locales in ./locales/*.
   * Uses the available Locales in ./locales/* by default.
   * If a locale is provided in this list, which is not in ./locales/* then the loadLocale should be set as well.
   * Else the additional locales can not be loaded.
   */
  targetLocales?: string[] | undefined;
  /**
   * Override how locales are loaded.
   * getLocaleData can be used to load the locale data from ./locales/*
   * Function should throw if locale can not be loaded.
   */
  loadLocale?: undefined | ((locale: string) => Promise<LocaleModule> | LocaleModule);
};

/**
 * Initialize the Localization.
 * @param options - Options on how to initialize the Localization.
 */
export async function initLocalization(options: InitLocalizationOptions = {}): Promise<void> {
  if (data !== undefined) throw new Error("Localization is already initialized.");
  const sourceLocale = options.sourceLocale ?? locales.sourceLocale;
  const sourceWithoutDev = sourceLocale.endsWith("-x-dev") ? sourceLocale.slice(0, -6) : sourceLocale;
  const targetLocales = new Set(options.targetLocales ?? Object.keys(locales.locales));
  const allLocales = new Set(targetLocales);
  allLocales.add(sourceLocale);
  const loadLocale = options.loadLocale ?? getLocaleDataOrThrow;
  const lit = configureLocalization({
    sourceLocale,
    targetLocales,
    async loadLocale(locale) {
      return { templates: setTemplate(await loadLocale(locale)) };
    },
  });
  data = {
    ...lit,
    systemWasSet: false,
    sourceLocale,
    targetLocales,
    allLocales,
    fallback: options.fallback ?? (allLocales.has(sourceWithoutDev) ? sourceWithoutDev : sourceLocale),
    localeFile: options.persistentLocale ?? resolve(app.getPath("userData"), "locale.json"),
    wrapperTemplate: Object.setPrototypeOf({}, null),
    loadedTemplate: undefined,
    loadLocale,
  };
  let persistentLocale = undefined;
  if (data.localeFile !== "") {
    try {
      persistentLocale = JSON.parse(await readFile(data.localeFile, { encoding: "utf8" }));
    } catch { }
  }
  try {
    await setLocale(persistentLocale ?? "");
  } catch { }
}

/**
 * Force a Reload of the current locale.
 * This is useful if you have a custom loadLocale function and the translation data changed (For example additional translations for a plugin are loaded).
 * It will rerun the loadLocale Handler.
 */
export async function forceReload(): Promise<void> {
  if (data === undefined) throw new Error("Accessed Localization before Initialization");
  const locale = data.getLocale();
  const template = await data.loadLocale(locale);
  if (locale !== data.getLocale()) return;
  setTemplate(template);
  emitLitEvent({ detail: { status: "ready", readyLocale: locale } });
}

/**
 * Get the translation Map of the Loaded locale.
 * @returns A LocaleModule (List of all Translations) or undefined if source locale is loaded.
 */
export function getLoadedTemplate(): Translations | undefined {
  if (data === undefined) throw new Error("Accessed Localization before Initialization");
  if (data.loadedTemplate === undefined) return undefined;
  return data.loadedTemplate;
}

/**
 * Get the translation Data of the Loaded locale.
 * @returns A LocaleModule (List of all Translations) or undefined if source locale is loaded.
 */
export function getLoadedData(): LocaleModule | undefined {
  const templates = getLoadedTemplate();
  if (templates === undefined) return undefined;
  return { templates };
}

/**
 * Same as getLocaleData but throws if data can not be found
 * @param locale - which locale to load?
 * @returns the Locale Module.
 */
export function getLocaleDataOrThrow(locale: string): LocaleModule {
  const ret = getLocaleData(locale);
  if (ret === undefined) throw new Error(`Locale ${locale} was not found in Translations and could not be loaded.`);
  return ret;
}

/**
 * Returns the Locale Data from the ./locales/* folder.
 * @param locale - which locale to load?
 * @returns the Locale Module if the Locale can be found or undefined.
 */
export function getLocaleData(locale: string): LocaleModule | undefined {
  return (locales.locales as unknown as { [locale: string]: undefined | ((s: typeof str, h: typeof html) => LocaleModule); })[locale]?.(str, html);
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
 * @param locale - locale id to load. Empty String means to load the System preferred locale.
 * @returns Promise which resolves as soon as the locale is loaded.
 */
export async function setLocale(locale: string): Promise<void> {
  if (data === undefined) throw new Error("Accessed Localization before Initialization");
  data.systemWasSet = locale === "";
  return await data.setLocale(data.systemWasSet ? getBestPreferredSystemLocale() : locale);
}

/**
 * Returns the Source Locale of the Localization Config.
 * @returns the configured Source Locale.
 */
export function getSourceLocale(): string {
  if (data === undefined) throw new Error("Accessed Localization before Initialization");
  return data.sourceLocale;
}

/**
 * Returns the list of Target Locales of the Localization config.
 * @returns the configured targetLocales.
 */
export function getTargetLocales(): Set<string> {
  if (data === undefined) throw new Error("Accessed Localization before Initialization");
  return data.targetLocales;
}

/**
 * Returns the list of all configured locales in the Localization config.
 * @returns all configured locales.
 */
export function getAllLocales(): Set<string> {
  if (data === undefined) throw new Error("Accessed Localization before Initialization");
  return data.allLocales;
}

/**
 * Get a list of all available Locales.
 * @returns a list of all available source locales.
 */
export function getLocales(): string[] {
  if (data === undefined) throw new Error("Accessed Localization before Initialization");
  return [...data.allLocales.values()];
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
 * Returns a list of locales preferred by the user.
 * First in the list is the ost proffered locale of the user.
 * Last in the list is the least proffered Locale of the User.
 * @returns a list of locales in th order of preference (First is high preference).
 */
export function getSystemLocales(): string[] {
  return app.getPreferredSystemLanguages();
}

/**
 * Returns the best fitting preferred locale (from Operating System) based on the available locales (via getLocales).
 * @returns the best fitting locale or the fallback locale from initialization if none can be found.
 */
export function getBestPreferredSystemLocale(): string {
  if (data === undefined) throw new Error("Accessed Localization before Initialization");
  return getBestLocale(getSystemLocales(), getLocales(), data.fallback);
}