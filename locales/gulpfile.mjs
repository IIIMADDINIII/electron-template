import { tools, tasks } from "@iiimaddiniii/js-build-tool";

const targetLocales =
  (await tools.fs.readdir("./translations", { withFileTypes: true }))
    .filter((e) => e.isFile() && e.name.endsWith(".xlf"))
    .map((e) => e.name.slice(0, -4));
const conf = { inputFiles: ["../**/src/**/*.ts"], targetLocales, output: { language: "ts", outputDir: "./src/" }, };

export const build = tools.exitAfter(
  tasks.buildTranslationPackage());
