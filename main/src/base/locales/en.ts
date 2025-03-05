
    // Do not modify this file by hand!
    // Re-generate this file by running lit-localize




    /* eslint-disable no-irregular-whitespace */
    /* eslint-disable @typescript-eslint/no-explicit-any */

let cache: import("@lit/localize").LocaleModule | undefined  = undefined;
//@ts-ignore
export function templates(str: typeof import("@lit/localize").str, html: typeof import("lit").html): import("@lit/localize").LocaleModule {
  if (cache !== undefined) return cache;
  const templates = {
      'h82ccc38d4d46eaa9': html`Hello2 <b>${0}</b>!`,
's00ad08ebae1e0f74': str`Hello2 ${0}!`,
's4caed5b7a7e5d89b': `English`,
's63e71d20d1eaca93': `German`,
's63f0bfacf2c00f6b': `Hello Test`,
    };
  cache = {templates};
  return cache;
}