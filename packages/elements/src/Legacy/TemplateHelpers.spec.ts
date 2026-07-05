import type {
  DependencyDescription,
  DependencyInfoDescription,
  ElementDescription,
  EntityDescription,
  FileDescription,
  ModuleDescription,
} from "../Descriptor";
import type { TemplateData } from "../Matcher";

import {
  getLegacyEntitySelectorExtraTemplateData,
  getLegacyElementSelectorExtraTemplateData,
  getLegacyDependencySelectorExtraTemplateData,
} from "./TemplateHelpers";

function createElementDescription(
  overrides?: Partial<ElementDescription>
): ElementDescription {
  return {
    path: "/src/components/Button",
    captured: { component: "Button" },
    isIgnored: false,
    isUnknown: false,
    types: ["component"],
    category: "components",
    filePath: "/src/components/Button/index.ts",
    fileInternalPath: "index.ts",
    parents: [],
    ...overrides,
  };
}

function createModuleDescription(
  overrides?: Partial<ModuleDescription>
): ModuleDescription {
  return {
    origin: "local",
    source: null,
    internalPath: null,
    ...overrides,
  };
}

function createFileDescription(
  overrides?: Partial<FileDescription>
): FileDescription {
  return {
    path: "/src/components/Button/index.ts",
    captured: null,
    isIgnored: false,
    isUnknown: false,
    categories: ["source"],
    ...overrides,
  };
}

function createEntityDescription(
  overrides?: Partial<EntityDescription>
): EntityDescription {
  return {
    element: createElementDescription(),
    file: createFileDescription(),
    module: createModuleDescription(),
    ...overrides,
  };
}

function createDependencyInfoDescription(
  overrides?: Partial<DependencyInfoDescription>
): DependencyInfoDescription {
  return {
    source: "./helpers",
    kind: "value",
    nodeKind: "ImportDeclaration",
    specifiers: ["helper"],
    relationship: { from: null, to: null },
    ...overrides,
  };
}

function createDependencyDescription(
  overrides?: Partial<DependencyDescription>
): DependencyDescription {
  return {
    from: createEntityDescription(),
    to: createEntityDescription({
      element: createElementDescription({
        path: "/src/helpers/helper",
        types: ["helper"],
        category: "helpers",
      }),
    }),
    dependency: createDependencyInfoDescription(),
    ...overrides,
  };
}

describe("getLegacyEntitySelectorExtraTemplateData", () => {
  it("should return element with legacy aliases, file, and origin", () => {
    const entity = createEntityDescription();

    const result = getLegacyEntitySelectorExtraTemplateData(entity);

    expect(result).toEqual({
      element: {
        ...entity.element,
        type: "component",
        elementPath: entity.element.path,
        internalPath: entity.element.fileInternalPath,
        origin: entity.module.origin,
        parents: [],
      },
      file: entity.file,
      origin: entity.module,
    });
  });

  it("should add origin property when module origin is defined", () => {
    const entity = createEntityDescription({
      module: createModuleDescription({ origin: "external" }),
    });

    const result = getLegacyEntitySelectorExtraTemplateData(entity);

    expect(result.element).toHaveProperty("origin", "external");
  });

  it("should not add origin property when module origin is undefined", () => {
    const entity = createEntityDescription({
      module: createModuleDescription({
        origin: undefined as unknown as ModuleDescription["origin"],
      }),
    });

    const result = getLegacyEntitySelectorExtraTemplateData(entity);

    expect(result.element).not.toHaveProperty("origin");
  });

  it("should use module internalPath over element fileInternalPath", () => {
    const entity = createEntityDescription({
      element: createElementDescription({
        fileInternalPath: "element/path.ts",
      }),
      module: createModuleDescription({ internalPath: "module/path.ts" }),
    });

    const result = getLegacyEntitySelectorExtraTemplateData(entity);

    expect(result.element).toHaveProperty("internalPath", "module/path.ts");
  });

  it("should fall back to element fileInternalPath when module internalPath is null", () => {
    const entity = createEntityDescription({
      element: createElementDescription({
        fileInternalPath: "element/path.ts",
      }),
      module: createModuleDescription({ internalPath: null }),
    });

    const result = getLegacyEntitySelectorExtraTemplateData(entity);

    expect(result.element).toHaveProperty("internalPath", "element/path.ts");
  });
});

describe("getLegacyElementSelectorExtraTemplateData", () => {
  it("should return element with legacy aliases", () => {
    const element = createElementDescription();

    const result = getLegacyElementSelectorExtraTemplateData(element);

    expect(result).toEqual({
      element: {
        ...element,
        type: "component",
        elementPath: element.path,
        internalPath: element.fileInternalPath,
        parents: [],
      },
    });
  });

  it("should set type to null when types is null", () => {
    const element = createElementDescription({ types: null });

    const result = getLegacyElementSelectorExtraTemplateData(element);

    expect(result.element).toHaveProperty("type", null);
  });

  it("should set type to first element when types has multiple values", () => {
    const element = createElementDescription({
      types: ["primary", "secondary"],
    });

    const result = getLegacyElementSelectorExtraTemplateData(element);

    expect(result.element).toHaveProperty("type", "primary");
  });

  it("should map parents with legacy aliases when parents is an array", () => {
    const element = createElementDescription({
      parents: [
        {
          types: ["layout"],
          category: "layouts",
          path: "/src/layouts/Main",
          captured: null,
        },
        { types: null, category: null, path: "/src/other", captured: null },
      ],
    });

    const result = getLegacyElementSelectorExtraTemplateData(element);

    const parents = (result.element as Record<string, unknown>)
      .parents as Record<string, unknown>[];

    expect(parents).toEqual([
      {
        types: ["layout"],
        category: "layouts",
        path: "/src/layouts/Main",
        captured: null,
        type: "layout",
        elementPath: "/src/layouts/Main",
      },
      {
        types: null,
        category: null,
        path: "/src/other",
        captured: null,
        type: null,
        elementPath: "/src/other",
      },
    ]);
  });

  it("should keep parents as-is when parents is not an array", () => {
    const element = createElementDescription({
      parents: undefined,
    });

    const result = getLegacyElementSelectorExtraTemplateData(element);

    expect((result.element as Record<string, unknown>).parents).toBeUndefined();
  });

  it("should use module internalPath when moduleDescription is provided", () => {
    const element = createElementDescription({ fileInternalPath: "file.ts" });
    const moduleDescription = createModuleDescription({
      internalPath: "module.ts",
    });

    const result = getLegacyElementSelectorExtraTemplateData(
      element,
      moduleDescription
    );

    expect(result.element).toHaveProperty("internalPath", "module.ts");
  });

  it("should add origin when moduleDescription has origin", () => {
    const element = createElementDescription();
    const moduleDescription = createModuleDescription({ origin: "external" });

    const result = getLegacyElementSelectorExtraTemplateData(
      element,
      moduleDescription
    );

    expect(result.element).toHaveProperty("origin", "external");
  });

  it("should not add origin when moduleDescription is not provided", () => {
    const element = createElementDescription();

    const result = getLegacyElementSelectorExtraTemplateData(element);

    expect(result.element).not.toHaveProperty("origin");
  });
});

describe("getLegacyDependencySelectorExtraTemplateData", () => {
  it("should return from, to, and dependency with legacy aliases", () => {
    const dependency = createDependencyDescription();

    const result = getLegacyDependencySelectorExtraTemplateData(dependency);

    expect(result.from).toBeDefined();
    expect(result.to).toBeDefined();
    expect(result.dependency).toBeDefined();
  });

  it("should include legacy element aliases in from", () => {
    const dependency = createDependencyDescription();

    const result = getLegacyDependencySelectorExtraTemplateData(dependency);

    const from = result.from as Record<string, unknown>;

    expect(from).toHaveProperty("elementPath", dependency.from.element.path);
    expect(from).toHaveProperty("type", "component");
    expect(from).toHaveProperty("file", dependency.from.file);
    expect(from.element).toBeDefined();
  });

  it("should include legacy element aliases in to", () => {
    const dependency = createDependencyDescription();

    const result = getLegacyDependencySelectorExtraTemplateData(dependency);

    const to = result.to as Record<string, unknown>;

    expect(to).toHaveProperty("elementPath", dependency.to.element.path);
    expect(to).toHaveProperty("type", "helper");
    expect(to).toHaveProperty("file", dependency.to.file);
    expect(to.element).toBeDefined();
  });

  it("should include dependency info with origin from to.module", () => {
    const dependency = createDependencyDescription({
      to: createEntityDescription({
        module: createModuleDescription({ origin: "external" }),
      }),
    });

    const result = getLegacyDependencySelectorExtraTemplateData(dependency);

    const dep = result.dependency as Record<string, unknown>;

    expect(dep).toHaveProperty("origin", "external");
    expect(dep).toHaveProperty("source", "./helpers");
  });

  it("should merge extraTemplateData.from into from result", () => {
    const dependency = createDependencyDescription();
    const extraTemplateData: TemplateData = {
      from: { customProp: "fromValue" },
    };

    const result = getLegacyDependencySelectorExtraTemplateData(
      dependency,
      extraTemplateData
    );

    const from = result.from as Record<string, unknown>;

    expect(from).toHaveProperty("customProp", "fromValue");
  });

  it("should merge extraTemplateData.to into to result", () => {
    const dependency = createDependencyDescription();
    const extraTemplateData: TemplateData = {
      to: { customProp: "toValue" },
    };

    const result = getLegacyDependencySelectorExtraTemplateData(
      dependency,
      extraTemplateData
    );

    const to = result.to as Record<string, unknown>;

    expect(to).toHaveProperty("customProp", "toValue");
  });

  it("should merge extraTemplateData.dependency into dependency result", () => {
    const dependency = createDependencyDescription();
    const extraTemplateData: TemplateData = {
      dependency: { customProp: "depValue" },
    };

    const result = getLegacyDependencySelectorExtraTemplateData(
      dependency,
      extraTemplateData
    );

    const dep = result.dependency as Record<string, unknown>;

    expect(dep).toHaveProperty("customProp", "depValue");
  });

  it("should use empty object when extraTemplateData.from is not an object", () => {
    const dependency = createDependencyDescription();
    const extraTemplateData: TemplateData = {
      from: "not-an-object",
    };

    const result = getLegacyDependencySelectorExtraTemplateData(
      dependency,
      extraTemplateData
    );

    const from = result.from as Record<string, unknown>;

    expect(from).toHaveProperty("elementPath");
  });

  it("should use empty object when extraTemplateData.to is not an object", () => {
    const dependency = createDependencyDescription();
    const extraTemplateData: TemplateData = {
      to: 42,
    };

    const result = getLegacyDependencySelectorExtraTemplateData(
      dependency,
      extraTemplateData
    );

    const to = result.to as Record<string, unknown>;

    expect(to).toHaveProperty("elementPath");
  });

  it("should use empty object when extraTemplateData.dependency is not an object", () => {
    const dependency = createDependencyDescription();
    const extraTemplateData: TemplateData = {
      dependency: true,
    };

    const result = getLegacyDependencySelectorExtraTemplateData(
      dependency,
      extraTemplateData
    );

    const dep = result.dependency as Record<string, unknown>;

    expect(dep).toHaveProperty("source");
  });

  it("should handle when extraTemplateData is undefined", () => {
    const dependency = createDependencyDescription();

    const result = getLegacyDependencySelectorExtraTemplateData(dependency);

    expect(result.from).toBeDefined();
    expect(result.to).toBeDefined();
    expect(result.dependency).toBeDefined();
  });

  it("should preserve extra top-level properties from extraTemplateData", () => {
    const dependency = createDependencyDescription();
    const extraTemplateData: TemplateData = {
      topLevel: "value",
    };

    const result = getLegacyDependencySelectorExtraTemplateData(
      dependency,
      extraTemplateData
    );

    expect(result).toHaveProperty("topLevel", "value");
  });
});
