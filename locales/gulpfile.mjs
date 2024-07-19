import { tools, tasks } from "@iiimaddiniii/js-build-tool";

export const build = tools.exitAfter(
  tasks.buildTranslationPackage());
