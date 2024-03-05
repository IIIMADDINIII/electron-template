import { tools, tasks } from "@iiimaddiniii/js-build-tool";


export const clean = tools.exitAfter(
  tasks.cleanWithGit());

export const build = tools.exitAfter(
  tasks.installDependencies(),
  tasks.runWorkspaceScript("build"));

export const buildCi = tools.exitAfter(
  tasks.cleanWithGit(),
  tasks.prodInstallDependencies(),
  tasks.runWorkspaceScript("build"),
  tasks.electron.createSetups({}));

export const start = tools.exitAfter(
  tasks.electron.start());