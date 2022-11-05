import { defineConfig } from "rollup";
import commonjs from '@rollup/plugin-commonjs';
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from "@rollup/plugin-terser";

export default defineConfig({
  input: "./src/index.ts",
  output: {
    file: "./dist/index.js",
    format: "commonjs",
    sourcemap: true,
  },
  external: ["electron"],
  plugins: [
    commonjs(),
    typescript({ noEmitOnError: true, outputToFilesystem: true }),
    nodeResolve(),
    terser(),
  ],
});