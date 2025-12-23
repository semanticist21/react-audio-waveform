import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    dts({
      include: ["src"],
      exclude: ["src/_storybook/**"],
      rollupTypes: true,
    }),
  ],
  build: {
    copyPublicDir: false,
    minify: false, // 난독화 없이 raw 코드 유지
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "overlayscrollbars", "overlayscrollbars-react"],
      output: [
        {
          format: "es",
          preserveModules: true,
          preserveModulesRoot: "src",
          entryFileNames: "[name].js",
          exports: "named",
        },
        {
          format: "cjs",
          preserveModules: true,
          preserveModulesRoot: "src",
          entryFileNames: "[name].cjs",
          exports: "named",
        },
      ],
    },
  },
});
