import { tools, tasks } from "@iiimaddiniii/js-build-tool";


export const build = tools.exitAfter(tasks.rollup.build({ type: "app", environment: "browser", }));

export const extractTranslations = tools.exitAfter(
  tasks.litLocalizeExtractPackage());