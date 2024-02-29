/**
   * @param {string} string 
   * @returns {string}
   */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const excludeExtensions = [".d.ts", ".d.ts.map", ".js.map", ".cjs.map", ".mjs.map"];
const includeOnMainLevel = ["main", "package.json"];
const subPackagesToExclude = ["common"];
const includeInSubPackage = ["dist", "package.json", "html"];

function generateIgnores() {
  let extensions = excludeExtensions.map((value) => RegExp("^.*" + escapeRegExp(value) + "$"));
  let mainInclude = RegExp("^\\/" + includeOnMainLevel.map((value) => "(?!" + escapeRegExp(value) + "(\\/|$))").join("") + ".*$");
  let subPackagesExclude = subPackagesToExclude.map((value) => RegExp("^\\/main\\/node_modules\\/@app\\/" + escapeRegExp(value) + "$"));
  let includeInMainPackage = RegExp("^\\/main\\/" + ["node_modules", ...includeInSubPackage].map((value) => "(?!" + escapeRegExp(value) + "(\\/|$))").join("") + ".*$");
  let onlyAppInMainModules = /^\/main\/node_modules\/(?!@app(\/|$)).*$/;
  let includeInPackage = RegExp("^\\/main\\/node_modules\\/@app\\/[^\\/]*\\/" + includeInSubPackage.map((value) => "(?!" + escapeRegExp(value) + "(\\/|$))").join("") + ".*$");
  return [...extensions, mainInclude, ...subPackagesExclude, includeInMainPackage, onlyAppInMainModules, includeInPackage];
}
const ignores = generateIgnores();


module.exports = {
  packagerConfig: {
    ignore: ignores,
    asar: true,
    derefSymlinks: true,
    icon: "icons/appIcon",
  },
  makers: [
    {
      "name": "@electron-forge/maker-wix",
      "config": {
        icon: "icons/installerIcon.ico",
        manufacturer: "IIIMADDINIII",
        language: 1033,
        upgradeCode: "19c18dda-fc57-4884-8fd9-523c310eb4f8",
        ui: {
          enabled: true,
        },
      }
    },
    {
      "name": "@electron-forge/maker-zip",
    },
  ]
};