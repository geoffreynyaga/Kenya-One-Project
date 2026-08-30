import js from "@eslint/js";
import a11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["build/**", "node_modules/**"] },

  js.configs.recommended,
  tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat.recommended,
  a11y.flatConfigs.recommended,

  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    // Pinned rather than detected: the plugin detects by reaching for an
    // eslint 9 context API that eslint 10 removed.
    settings: { react: { version: "19.0" } },
    rules: {
      // TypeScript already reports these, and reports them better.
      "no-unused-vars": "off",
      // The shards primitives destructure props they deliberately drop, and
      // mark them with a leading underscore.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Function declarations hoist, and the sheets read top-down better with
      // their formatters at the bottom.
      "@typescript-eslint/no-use-before-define": ["warn", { functions: false }],
      // Reports that the React Compiler skipped a component because it calls
      // useReactTable. We do not run the compiler, and it is not a defect.
      "react-hooks/incompatible-library": "off",
      // The sheets are typed; a few .js files predate that and have no props.
      "react/prop-types": "off",
      // Fixing this means restructuring how the sizing sheets fetch, which is
      // its own piece of work. Keep it visible rather than switched off.
      "react-hooks/set-state-in-effect": "warn",
      "no-console": "warn",
      "no-nested-ternary": "warn",
      "react/no-array-index-key": "warn",
      "jsx-a11y/control-has-associated-label": "warn",
      "prefer-destructuring": [
        "error",
        {
          VariableDeclarator: { array: false, object: true },
          AssignmentExpression: { array: false, object: false },
        },
      ],
    },
  },

  {
    // The shards primitives are wrappers: content arrives through children,
    // so the element is empty where it is declared.
    files: ["src/components/shards.tsx"],
    rules: {
      "jsx-a11y/anchor-has-content": "off",
      "jsx-a11y/heading-has-content": "off",
    },
  },

  {
    files: ["src/**/*.test.{js,jsx,ts,tsx}", "src/setupTests.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",
      },
    },
  }
);
