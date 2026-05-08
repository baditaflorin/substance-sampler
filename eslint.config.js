import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["docs/assets/**", "docs/*.js", "docs/*.css", "coverage/**", "node_modules/**"]
  },
  js.configs.recommended,
  {
    files: ["scripts/**/*.mjs", "vite.config.ts", "tailwind.config.ts"],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ["*.config.cjs", "postcss.config.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node
    }
  },
  {
    files: ["public/sw.js"],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        ...globals.browser
      }
    }
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.worker,
        __APP_VERSION__: "readonly",
        __GIT_COMMIT__: "readonly",
        __REPO_URL__: "readonly",
        __PAYPAL_URL__: "readonly"
      }
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-explicit-any": "error"
    }
  },
  prettier
);
