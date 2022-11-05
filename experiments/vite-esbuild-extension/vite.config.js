import path from "path";
import { defineConfig } from "vite";
import tsConfig from "./tsconfig.json";

const objectMap = (fn) => (o) => Object.fromEntries(Object.entries(o).map(fn));
const pathsEntryToAliasEntry = ([k, v]) => [k, path.resolve(__dirname, v[0])];
const pathsToAlias = objectMap(pathsEntryToAliasEntry);

console.log(process.env.MODE);

export default defineConfig(({ mode }) => ({
  clearScreen: false,
  resolve: {
    alias: pathsToAlias(tsConfig.compilerOptions.paths),
  },
  build: {
    emptyOutDir: false,
    outDir: "dist/unpacked",
    minify: mode === "development" ? false : true,
    sourcemap: mode === "development" ? "inline" : true,
  },
}));
