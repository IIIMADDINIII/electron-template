
/**
 * Type of the Translations.
 * @public
 */
export type Translations = {
  [key: string]: string | {
    ['_$litType$']: 1 | 2 | 3;
    strings: TemplateStringsArray;
    values: number[];
  } | {
    strTag: true;
    strings: TemplateStringsArray;
    values: number[];
  };
};

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
  initLocalization(): string;
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