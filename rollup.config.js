import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const isProd = process.env.BUILD === "production";

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ROLLUP
if you want to view the source visit the plugins github repository
*/
`;

export default {
  input: "main.ts",
  output: {
    dir: ".",
    sourcemap: isProd ? false : "inline",
    format: "cjs",
    exports: "default",
    banner,
  },
  external: [
    "obsidian",
    "@codemirror/state",
    "@codemirror/view",
    "@codemirror/language",
    "@codemirror/stream-parser",
  ],
  plugins: [typescript(), nodeResolve({ browser: true }), commonjs()],
};
