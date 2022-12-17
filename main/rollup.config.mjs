import { defineConfig } from "rollup";
import sourceMaps from 'rollup-plugin-include-sourcemaps';
import commonjs from '@rollup/plugin-commonjs';
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from "@rollup/plugin-terser";


const externalPackages = ["electron"];

function externalFilter(moduleName) {
  for (let dependency of externalPackages) {
    if (moduleName === dependency) return true;
    if (moduleName.startsWith(dependency + "/")) return true;
  }
  return false;
}

export default defineConfig({
  input: "./src/index.ts",
  output: {
    file: "./dist/index.js",
    format: "commonjs",
    sourcemap: true,
  },
  external: externalFilter,
  plugins: [
    commonjs(),
    typescript({ noEmitOnError: true, outputToFilesystem: true }),
    sourceMaps(),
    nodeResolve(),
    terser(),
  ],
});