import { tools, tasks } from "@iiimaddiniii/js-build-tool";

export const build = tools.exitAfter(
  tasks.buildTranslationSource({ baseDir: "..", output: { outputDir: "./main/src/base/locales" } }),
  tasks.rollup.build({ type: "app", externalDependencies: ["electron"] }));