import { pluginReact } from "@rsbuild/plugin-react";
import { defineConfig } from "@rslib/core";

export default defineConfig({
  lib: [
    {
      format: "esm",
      bundle: false,
      dts: { bundle: true },
      output: {
        distPath: { root: "./dist" },
      },
      // Bundle dependencies (mpg123-decoder), only externalize peerDependencies
      autoExternal: {
        dependencies: false,
        peerDependencies: true,
      },
    },
    {
      format: "cjs",
      bundle: false,
      output: {
        distPath: { root: "./dist" },
      },
      autoExternal: {
        dependencies: false,
        peerDependencies: true,
      },
    },
  ],
  source: {
    entry: {
      index: ["./src/**/*.{ts,tsx}", "!./src/_storybook/**"],
    },
  },
  output: {
    target: "web",
    externals: ["@types/react"],
  },
  server: {
    publicDir: false,
  },
  plugins: [pluginReact()],
});
