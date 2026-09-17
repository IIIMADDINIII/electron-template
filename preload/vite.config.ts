import { builtinModules } from "node:module";

import { defineConfig } from "vite-plus";

const nodeLikeBuiltins: (string | RegExp)[] = [...builtinModules.filter((id) => !id.includes(":")), /^node:/, /^bun:/];

export default defineConfig((env) => {
  return {
    build: {
      lib: {
        entry: ["./src/index.ts"],
        name: "index",
        formats: ["cjs"],
      },
      minify: env.mode === "production" ? "oxc" : false,
      sourcemap: env.mode !== "production" ? "inline" : false,
      rolldownOptions: {
        external: ["electron", "electron/main", ...nodeLikeBuiltins],
      },
    },
  };
});
