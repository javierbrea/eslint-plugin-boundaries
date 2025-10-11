// TODO: Rename into E2E or something similar. Add tests. Check types.
// Use different eslint plugin files with different imports, namespaces, etc. Run eslint programmatically using all different files.
// Check that types are working as expected.
// Check wrong types by adding @ts-expect-error in some places.
import eslintPluginBoundaries from "eslint-plugin-boundaries";
import type { Config } from "eslint-plugin-boundaries";

const testTypesConfig: Config<"foo"> = {
  files: ["**/*.test-types.ts"],
  plugins: {
    foo: eslintPluginBoundaries,
  },
  settings: {
    "boundaries/elements": [
      {
        type: "component",
        pattern: "src/components/**",
        capture: ["test"],
      },
    ],
  },
  rules: {
    "foo/element-types": [
      2,
      {
        default: "disallow",
        rules: [{ from: "component", allow: ["component", "util"] }],
      },
    ],
  },
};

export default testTypesConfig;
