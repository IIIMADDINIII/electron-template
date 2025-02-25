import { tools, tasks } from "@iiimaddiniii/js-build-tool";

export const clean = tools.exitAfter(
  tasks.cleanWithGit());

export const build = tools.exitAfter(
  tasks.installDependencies(),
  tasks.runScriptsInPackages({ "**": "build" }));

export const buildCi = tools.exitAfter(
  tasks.cleanWithGit(),
  tasks.prodInstallDependencies(),
  tasks.runScriptsInPackages({ "**": "build" }),
  tasks.electron.createSetups());

export const start = tools.exitAfter(
  tasks.electron.start());

export const buildAndStart = tools.exitAfter(
  tasks.installDependencies(),
  tasks.runScriptsInPackages({ "**": "build" }),
  tasks.electron.start());

export const extractTranslations = tools.exitAfter(
  tasks.runScriptsInPackages({ "**": "extractTranslations" }, false));

export const createSetups = tools.exitAfter(tasks.electron.createSetups());