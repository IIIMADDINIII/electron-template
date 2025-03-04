import { configureLocalization, str as litStr, type LocaleModule } from "@lit/localize";
import { html as litHtml } from "lit-html";


if ((globalThis as any).window === undefined) (globalThis as any).window = {};
(globalThis as any).window.dispatchEvent = (event: any) => {
  console.log(event, event.detail);
};



let internalGetLocale: undefined | (() => string);
let internalSetLocale: undefined | ((locale: string) => Promise<void>);

export type LoadLocale = (str: typeof litStr, html: typeof litHtml) => LocaleModule;

export type InitLocalesOptions = {
  /**
   * Name of the locale to show the source text.
   * @default "en-x-dev
   */
  sourceLocale?: string | undefined;
};

export type InitLocalesByDirOptions = InitLocalesOptions & {
  /**
   * the location of the Translations relative to AppPath.
   * @default "./locales/dist/"
   */
  localesDir?: string | undefined;
};

export type InitLocalesByImportOptions = InitLocalesOptions & {
  localesMap: { [locale: string]: LoadLocale; };
};

export function initLocalizationByDir(options: InitLocalesOptions = {}) {
  ({ getLocale: internalGetLocale, setLocale: internalSetLocale } = configureLocalization({
    sourceLocale: options?.sourceLocale ?? "en-x-dev",
    targetLocales: ["de", "en"],
    async loadLocale(_) {
      return de.templates(litStr, litHtml);
    },
  }));
  setLocale("de");
}

export function getLocale(): string {
  if (internalGetLocale === undefined) throw new Error("Accessed Localization before Initialization");
  return internalGetLocale();
}

export function setLocale(locale: string): Promise<void> {
  if (internalSetLocale === undefined) throw new Error("Accessed Localization before Initialization");
  return internalSetLocale(locale);
}

