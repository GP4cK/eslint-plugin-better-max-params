"use strict";

const { defineConfig } = require("eslint/config");
const globals = require("globals");
const js = require("@eslint/js");
const eslintPlugin = require("eslint-plugin-eslint-plugin");
const nodePlugin = require("eslint-plugin-n")

const {
  FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

module.exports = defineConfig([
  eslintPlugin.default.configs.recommended,
  nodePlugin.configs['flat/recommended'],
  {
    extends: compat.extends(
      "eslint:recommended",
    ),

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  }, {
    files: ["tests/**/*.js"],

    languageOptions: {
      globals: {
        ...globals.mocha,
      },
    },
  },
  // Disable 'n/no-unpublished-require' for this config file only
  {
    files: ["eslint.config.js"],
    rules: {
      "n/no-unpublished-require": "off",
    },
  },
]);
