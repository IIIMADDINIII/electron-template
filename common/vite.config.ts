import { defineConfig } from "vite-plus";

export default defineConfig((_env) => {
  return {
    pack: {
      entry: ["./src/index.ts"],
      dts: true,
      exports: true,
      sourcemap: true,
      platform: "neutral",
      format: ["esm", "cjs"],
      failOnWarn: true,
    },
  };
});
