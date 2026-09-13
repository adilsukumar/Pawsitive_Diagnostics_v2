import js from "@eslint/js";
import { globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  globalIgnores([
    "dist/",
    ".output/",
    ".vinxi/",
    ".nitro/",
    ".tanstack/",
    ".vercel/",
    "coverage/",
    "src/routeTree.gen.ts",
  ]),
  {
    name: "pawsitive/typescript",
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    name: "pawsitive/node-config",
    files: ["*.config.{js,ts}", "vite.config.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
  eslintConfigPrettier,
);
