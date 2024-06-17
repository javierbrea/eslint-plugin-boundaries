import prettier from "eslint-plugin-prettier";
import localRules from "eslint-plugin-local-rules";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [...compat.extends("prettier"), {
    ignores: ["eslint.config.mjs"],    
},
{
    plugins: {
        prettier,
        "local-rules": localRules,
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },

        ecmaVersion: 2022,
        sourceType: "commonjs",
    },

    rules: {
        "prettier/prettier": ["error", {
            printWidth: 99,
            parser: "flow",
        }],

        "no-shadow": [2, {
            builtinGlobals: true,
            hoist: "all",
        }],

        "no-undef": "error",

        "no-unused-vars": ["error", {
            vars: "all",
            args: "after-used",
            ignoreRestSiblings: false,
        }],
    },
}, {
    files: ["src/**/*.js"],

    settings: {
        "boundaries/dependency-nodes": ["require", "import", "dynamic-import", "export"],

        "boundaries/elements": [{
            type: "config",
            mode: "file",
            pattern: ["src/configs/*.js", "(package.json)"],
            capture: ["name"],
        }, {
            type: "constants",
            mode: "file",
            pattern: "src/constants/*.js",
            capture: ["name"],
        }, {
            type: "core",
            mode: "file",
            pattern: "src/core/*.js",
            capture: ["name"],
        }, {
            type: "helper",
            mode: "file",
            pattern: "src/helpers/*.js",
            capture: ["name"],
        }, {
            type: "rule",
            mode: "file",
            pattern: "src/rules/*.js",
            capture: ["name"],
        }, {
            type: "rule-factory",
            mode: "file",
            pattern: "src/rules-factories/*.js",
            capture: ["name"],
        }, {
            type: "plugin",
            mode: "full",
            pattern: ["src/index.js"],
        }],
    },

    rules: {
        "local-rules/boundaries/element-types": [2, {
            default: "disallow",

            rules: [{
                from: "plugin",
                allow: ["constants", "config", "rule"],
            }, {
                from: "config",
                allow: ["constants", "config"],
            }, {
                from: "constants",
                allow: ["constants"],
            }, {
                from: "core",
                allow: ["constants", "helper", "core"],
            }, {
                from: "helper",
                allow: ["constants", "helper"],
            }, {
                from: "rule",
                allow: ["constants", "helper", "core", "rule-factory"],
            }, {
                from: "rule-factory",
                allow: ["constants", "helper", "core"],
            }],
        }],

        "local-rules/boundaries/no-unknown": [2],
        "local-rules/boundaries/no-unknown-files": [2],
    }, 
}, {
    files: ["test/src/**/*.js"],

    plugins: {
        prettier
    },

    languageOptions: {
        globals: {
            ...globals.node,
            describe: "readonly",
            it: "readonly",
            expect: "readonly",
        },

        ecmaVersion: 2022,
        sourceType: "commonjs",
    },

    rules: {
        "prettier/prettier": ["error", {
            printWidth: 99,
            parser: "flow",
        }],

        "no-shadow": [2, {
            builtinGlobals: true,
            hoist: "all",
        }],

        "no-undef": "error",

        "no-unused-vars": ["error", {
            vars: "all",
            args: "after-used",
            ignoreRestSiblings: false,
        }],
    },
}];