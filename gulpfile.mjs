import { tools, tasks } from "@iiimaddiniii/js-build-tool";


export const clean = tools.exitAfter(
  tasks.cleanWithGit());

export const build = tools.exitAfter(
  tasks.installDependencies(),
  tasks.runWorkspaceScript("build"));

export const createSetups = tools.exitAfter(
  tasks.electron.createSetups({ additionalFilesToPackage: ["./package.json"] }));

export const buildCi = tools.exitAfter(
  tasks.cleanWithGit(),
  tasks.prodInstallDependencies(),
  tools.parallel(tasks.runWorkspaceScript("build"), tasks.electron.prepareWixTools()),
  //tasks.electron.forgeMake()
);

export const start = tools.exitAfter(
  tasks.electron.runForgeStart());