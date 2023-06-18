import { tools, tasks } from "@iiimaddiniii/js-build-tool";


export const clean = tools.exitAfter(
  tasks.cleanWithGit());

export const build = tools.exitAfter(
  tasks.selectPnpmAndInstall(),
  tasks.runWorkspaceScript("build"));

export const buildCi = tools.exitAfter(
  tasks.cleanWithGit(),
  tasks.prodSelectPnpmAndInstall(),
  tools.parallel(
    tasks.runWorkspaceScript("build"),
    tasks.electron.prepareWixTools()),
  tasks.electron.forgeMake());

export const start = tools.exitAfter(
  tasks.electron.start());