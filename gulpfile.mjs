import { tools, tasks } from "@iiimaddiniii/js-build-tool";


export const clean = tools.exitAfter(
  tasks.cleanWithGit());

export const build = tools.exitAfter(
  tasks.installDependencies(),
  tasks.runWorkspaceScript("build"));

// ToDo: Implement in js-build-tool to blow the fuses 
export const buildCi = tools.exitAfter(
  tasks.cleanWithGit(),
  tasks.prodInstallDependencies(),
  tools.parallel(tasks.runWorkspaceScript("build"), tasks.electron.prepareWixTools()),
  tasks.electron.createSetups({ platform: process.platform === "win32" ? ["win32", "linux"] : ["win32", "linux", "darwin"] }));

export const start = tools.exitAfter(
  tasks.electron.runForgeStart());