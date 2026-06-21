import { defineConfig } from "vite-plus";

export default defineConfig(({  }) => ({
  pack: {
    entry: ["./src/index.ts", "./src/RequestHandler.ts", "./src/ObjectStore.ts"],
    dts: {
      tsgo: true,
    },
    exports: true,
    format: ["esm", "cjs"],
  },
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
    ignorePatterns: ["/mise/", "/declarations.d.ts"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: ["/mise/"],
    sortImports: true,
    printWidth: 150,
    jsdoc: {
      descriptionWithDot: true,
      lineWrappingStyle: "balance",
    },
  },
}));
