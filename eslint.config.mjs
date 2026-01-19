import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig({
  files: ["**/*.{js,mjs}"],
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    globals: {
      ...globals.node,
      ...globals.browser
    }
  },
  // use the recommended config object directly
  ...js.configs.recommended,
  rules: {
    "no-console": "off" // allow console.log
  }
});
