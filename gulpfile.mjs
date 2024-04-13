import { tools, tasks } from "@iiimaddiniii/js-build-tool";

/**
 * @type tools.LitConfig
 */
const litLocalizeOptions = {
  targetLocales: ["en", "de"],
};

export const clean = tools.exitAfter(
  tasks.cleanWithGit());

export const build = tools.exitAfter(
  tasks.installDependencies(),
  tasks.litLocalizeBuild(litLocalizeOptions),
  tasks.runWorkspaceScript("build"));

export const buildCi = tools.exitAfter(
  tasks.cleanWithGit(),
  tasks.prodInstallDependencies(),
  tasks.litLocalizeBuild(litLocalizeOptions),
  tasks.runWorkspaceScript("build"),
  tasks.electron.createSetups({ additionalFilesToPackage: ["./locales/*.js"] }));

export const start = tools.exitAfter(
  tasks.electron.start());

export const buildAndStart = tools.exitAfter(
  tasks.installDependencies(),
  tasks.litLocalizeBuild(litLocalizeOptions),
  tasks.runWorkspaceScript("build"),
  tasks.electron.start());

export const extractTranslations = tools.exitAfter(
  tasks.litLocalizeExtract(litLocalizeOptions));