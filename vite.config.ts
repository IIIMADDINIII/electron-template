import { defineConfig } from "vite-plus";

export default defineConfig((_env) => {
  return {
    test: {
      ui: false,
      coverage: {
        enabled: true,
        provider: "istanbul",
      },
      include: ["src/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      execArgv: ["--expose-gc"],
      typecheck: {
        enabled: true,
      },
    },
    lint: {
      jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
      rules: { "vite-plus/prefer-vite-plus-imports": "error" },
      ignorePatterns: ["/**/mise/", "/**/declarations.d.ts"],
      options: {
        typeAware: true,
        typeCheck: true,
        denyWarnings: true,
      },
    },
    fmt: {
      ignorePatterns: ["/**/mise/"],
      sortImports: true,
      printWidth: 150,
      jsdoc: {
        descriptionWithDot: true,
        lineWrappingStyle: "balance",
      },
    },
  };
});
