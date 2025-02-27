
/**
 * Type of a single translation entry inside the Translations.
 * @public
 */
export type Translation = string | {
  ['_$litType$']: 1 | 2 | 3;
  strings: TemplateStringsArray;
  values: number[];
} | {
  strTag: true;
  strings: TemplateStringsArray;
  values: number[];
};

/**
 * Type of the Translations.
 * @public
 */
export type Translations = {
  [key: string]: Translation;
};

/** 
 * Type of a single translation entry inside the Serialized Translations.
 * @public
 */
export type SerializedTranslation = string | {
  ['_$litType$']: 1 | 2 | 3;
  strings: ReadonlyArray<string>;
  raw: readonly string[];
  values: number[];
} | {
  strTag: true;
  strings: ReadonlyArray<string>;
  raw: readonly string[];
  values: number[];
};

/** 
 * Type of the Serialized Translations for Json Serialization.
 * @public
 */
export type SerializedTranslations = {
  [key: string]: SerializedTranslation;
};

/**
 * Replacer for JSON.stringify to serialize the Translations.
 * @param _key - the key which is serialized
 * @param value - the value to maybe transform.
 * @returns the transformed value.
 * @public
 */
export function translationReplacer(_key: string, value: unknown): unknown {
  if (typeof value !== "object" || value === null) return value;
  if (!("strings" in value) || !Array.isArray(value.strings)) return value;
  if (!("raw" in value.strings) || !Array.isArray(value.strings.raw)) return value;
  if (!("values" in value)) return value;
  if ("strTag" in value && value.strTag === true || "_$litType$" in value && (value["_$litType$"] === 1 || value["_$litType$"] === 2 || value["_$litType$"] === 3))
    return {
      ...value,
      raw: value.strings.raw,
    };
  return value;
}

/**
 * Reviver for JSON.parse to parse the Translations.
 * @param _key - the key which is serialized.
 * @param value - the value to maybe transform.
 * @returns the transformed value.
 * @public
 */
export function translationsReviver(_key: string, value: unknown): unknown {
  if (typeof value !== "object" || value === null) return value;
  if (!("strings" in value) || !Array.isArray(value.strings)) return value;
  if (!("raw" in value) || !("values" in value)) return value;
  if ("strTag" in value && value.strTag === true || "_$litType$" in value && (value["_$litType$"] === 1 || value["_$litType$"] === 2 || value["_$litType$"] === 3))
    (value.strings as unknown as { raw: unknown; }).raw = value.raw;
  return value;
}

/**
 * The possible details of the "lit-localize-status" event.
 * @public
 */
export type LocaleStatusEventDetail = LocaleLoading | LocaleReady | LocaleError;
/**
 * Detail of the "lit-localize-status" event when a new locale has started to
 * load.
 *
 * A "loading" status can be followed by [1] another "loading" status (in the
 * case that a second locale is requested before the first one completed), [2] a
 * "ready" status, or [3] an "error" status.
 * @public
 */
export interface LocaleLoading {
  status: 'loading';
  /** Code of the locale that has started loading. */
  loadingLocale: string;
}
/**
 * Detail of the "lit-localize-status" event when a new locale has successfully
 * loaded and is ready for rendering.
 *
 * A "ready" status can be followed only by a "loading" status.
 * @public
 */
export interface LocaleReady {
  status: 'ready';
  /** Code of the locale that has successfully loaded. */
  readyLocale: string;
  /** The translations of this locale */
  translations?: Translations | undefined;
}
/**
 * Detail of the "lit-localize-status" event when a new locale failed to load.
 *
 * An "error" status can be followed only by a "loading" status.
 * @public
 */
export interface LocaleError {
  status: 'error';
  /** Code of the locale that failed to load. */
  errorLocale: string;
  /** Error message from locale load failure. */
  errorMessage: string;
}

/**
 * Callback Parameter of the initLocalization function.
 * @public
 */
export type RendererWindowApiInitCallback = (details: string) => Promise<void>;

/** 
 * The data stored inside the JSON string of the return value of initLocalization.
 * @public
 */
export type RendererWindowApiInitData = {
  currentLocale: string;
  sourceLocale: string;
  targetLocales: string[];
  translations?: Translations | undefined;
};

/**
 * RemoteObject Api for the Ready Signal for a RendererWindow.
 * Used to only show the Window once it finished loading and rendering.
 * @public
 */
export type RendererWindowApi = {
  /**
   * Call this when you want to use the Ready Signal very early on.
   */
  readySignalIsUsed(): void;
  /**
   * Call this once the Window has finished loading and rendering.
   */
  readySignalSend(): void;
  /**
   * Call this to get information on how to initialize the localization.
   * Returns the data as a JSON formatted string.
   */
  initLocalization(callback: RendererWindowApiInitCallback): string;
  /**
   * Returns a list of locales preferred by the user.
   * Response is a String Array as JSON string.
   */
  getSystemLocales(): string;
  /**
   * Returns the best fitting preferred locale (from Operating System) based on the available locales (via getLocales).
   */
  getBestPreferredSystemLocale(): string;
  /**
   * Searches for the best fitting locale inside availableLocales in the order of preferredLocales.
   * Arguments ar encoded as a JSON string.
   */
  getBestLocale(args: string): string | undefined;
  /**
   * Load a new Locale and wait until it is loaded.
   * @param locale - locale id to load. Empty String means to load the System preferred locale.
   * @returns Promise which resolves as soon as the locale is loaded.
   */
  setLocale(locale: string): Promise<void>;
};

/** 
 * Name of the Remote Object providing the Ready Signal Api. 
 * @public
 */
export const RENDERER_WINDOW_API_ID = "renderer-window-api";

/**
 * Channel Used to Communicate remote Objects messages.
 * @public
 */
export const RENDERER_WINDOW_REMOTE_OBJECTS_CHANNEL = "remote-objects";