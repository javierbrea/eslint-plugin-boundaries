import type { ConfigOptionsNormalized } from "../Config";
import { Micromatch } from "../Matcher";

import { ElementsDescriptor } from "./ElementsDescriptor";
import { FilesDescriptor } from "./FilesDescriptor";

describe("FilesDescriptor", () => {
  const config = {
    cache: true,
    legacyTemplates: false,
    descriptorsPriority: "first",
    includePaths: ["**/src/**/*.ts", "**/src/**/*.tsx"],
    ignorePaths: ["**/__tests__/**"],
    rootPath: undefined,
    flagAsExternal: {
      inNodeModules: true,
      unresolvableAlias: false,
      outsideRootPath: false,
      customSourcePatterns: [],
    },
  } as unknown as ConfigOptionsNormalized;

  const elementDescriptors = [
    {
      type: "component",
      pattern: "src/components/*.tsx",
      mode: "file" as const,
    },
  ];

  const fileDescriptors = [
    {
      category: "react-file",
      pattern: "src/components/(*)",
      capture: ["componentName"],
    },
    {
      category: ["ui", "presentation"],
      pattern: "src/components/*.tsx",
    },
    {
      category: "misc",
      pattern: "src/misc/*.ts",
    },
  ];

  let filesDescriptor: FilesDescriptor;

  beforeEach(() => {
    const micromatch = new Micromatch(config.cache);
    const elementsDescriptor = new ElementsDescriptor(
      elementDescriptors,
      config,
      micromatch
    );

    filesDescriptor = new FilesDescriptor(
      elementsDescriptor,
      fileDescriptors,
      config,
      micromatch
    );
  });

  it("should describe known local files including element and file categories", () => {
    const file = filesDescriptor.describeFile(
      "/project/src/components/Button.tsx"
    );

    expect(file).toEqual({
      path: "/project/src/components/Button.tsx",
      internalPath: "Button.tsx",
      category: ["react-file", "ui", "presentation"],
      captured: {
        componentName: "Button.tsx",
      },
      element: {
        type: "component",
        captured: null,
        parents: [],
        path: "/project/src/components/Button.tsx",
      },
      origin: "local",
      isIgnored: false,
      isUnknown: false,
    });
  });

  it("should describe unknown local files with category when file descriptors match", () => {
    const file = filesDescriptor.describeFile("/project/src/misc/other.ts");

    expect(file).toEqual({
      path: "/project/src/misc/other.ts",
      internalPath: null,
      category: ["misc"],
      captured: null,
      element: null,
      origin: "local",
      isIgnored: false,
      isUnknown: true,
    });
  });

  it("should keep ignored files ignored and without categories", () => {
    const file = filesDescriptor.describeFile("/project/src/__tests__/foo.ts");

    expect(file).toEqual({
      path: "/project/src/__tests__/foo.ts",
      internalPath: null,
      category: null,
      captured: null,
      element: null,
      origin: null,
      isIgnored: true,
      isUnknown: true,
    });
  });

  it("should describe dependency files as external/core without applying file categories", () => {
    const externalFile = filesDescriptor.describeFile(
      "/project/node_modules/react/index.js",
      "react"
    );

    expect(externalFile).toEqual({
      path: "/project/node_modules/react/index.js",
      internalPath: null,
      category: null,
      captured: null,
      element: null,
      origin: "external",
      isIgnored: false,
      isUnknown: true,
    });
  });

  it("should serialize and restore cache", () => {
    const first = filesDescriptor.describeFile(
      "/project/src/components/Button.tsx"
    );

    const serialized = filesDescriptor.serializeCache();

    filesDescriptor.clearCache();

    expect(Object.keys(filesDescriptor.serializeCache())).toHaveLength(0);

    filesDescriptor.setCacheFromSerialized(serialized);

    const second = filesDescriptor.describeFile(
      "/project/src/components/Button.tsx"
    );

    expect(second).toEqual(first);
  });
});
