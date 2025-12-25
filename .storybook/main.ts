import tailwindcss from "@tailwindcss/postcss";
import type { StorybookConfig } from "storybook-react-rsbuild";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-docs"],
  framework: {
    name: "storybook-react-rsbuild",
    options: {},
  },
  rsbuildFinal: (config) => {
    // Tailwind CSS v4 via PostCSS
    config.tools = {
      ...config.tools,
      postcss: {
        postcssOptions: {
          plugins: [tailwindcss],
        },
      },
    };
    return config;
  },
};

export default config;
