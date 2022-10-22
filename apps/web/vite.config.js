import path from "path";
import { defineConfig } from "vite";
import tsConfig from "./tsconfig.json";

const objectMap = (fn) => (o) => Object.fromEntries(Object.entries(o).map(fn));
const pathsEntryToAliasEntry = ([k, v]) => [k, path.resolve(__dirname, v[0])];
const pathsToAlias = objectMap(pathsEntryToAliasEntry);

export default defineConfig({
  clearScreen: false,
  resolve: {
    alias: pathsToAlias(tsConfig.compilerOptions.paths),
  },
});
