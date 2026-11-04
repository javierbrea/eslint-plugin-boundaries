import { formatValue } from "./FormatValue";

describe("formatValue", () => {
  it("should format null as null", () => {
    // Arrange
    const value = null;

    // Act
    const text = formatValue(value);

    // Assert
    expect(text).toBe("null");
  });

  it("should format a string in double quotes", () => {
    // Arrange
    const value = "src/modules/checkout";

    // Act
    const text = formatValue(value);

    // Assert
    expect(text).toBe('"src/modules/checkout"');
  });

  it("should escape the double quotes and the backslashes of a string", () => {
    // Arrange
    const value = 'a "b" \\ c';

    // Act
    const text = formatValue(value);

    // Assert
    expect(text).toBe('"a \\"b\\" \\\\ c"');
  });

  it("should format a number and a boolean as they are written", () => {
    // Arrange
    const values = [2, 0.5, true, false];

    // Act
    const texts = values.map((value) => formatValue(value));

    // Assert
    expect(texts).toEqual(["2", "0.5", "true", "false"]);
  });

  it("should format an array with a space inside the brackets and between its items", () => {
    // Arrange
    const value = ["a", "b"];

    // Act
    const text = formatValue(value);

    // Assert
    expect(text).toBe('[ "a", "b" ]');
  });

  it("should format an array of one item", () => {
    // Arrange
    const value = ["module"];

    // Act
    const text = formatValue(value);

    // Assert
    expect(text).toBe('[ "module" ]');
  });

  it("should format an empty array with no space", () => {
    // Arrange
    const value: string[] = [];

    // Act
    const text = formatValue(value);

    // Assert
    expect(text).toBe("[]");
  });

  it("should format an object with its keys unquoted", () => {
    // Arrange
    const value = { name: "Price" };

    // Act
    const text = formatValue(value);

    // Assert
    expect(text).toBe('{ name: "Price" }');
  });

  it("should format an object of several entries", () => {
    // Arrange
    const value = { name: "Price", scope: "atoms" };

    // Act
    const text = formatValue(value);

    // Assert
    expect(text).toBe('{ name: "Price", scope: "atoms" }');
  });

  it("should quote the keys that are not identifiers", () => {
    // Arrange
    const value = { "my-key": "a", "2nd": "b", _ok$: "c" };

    // Act
    const text = formatValue(value);

    // Assert
    expect(text).toBe('{ "my-key": "a", "2nd": "b", _ok$: "c" }');
  });

  it("should format an empty object with no space", () => {
    // Arrange
    const value = {};

    // Act
    const text = formatValue(value);

    // Assert
    expect(text).toBe("{}");
  });

  it("should format nested values the same way", () => {
    // Arrange
    const value = {
      parents: [{ path: "src/components", captured: null }, ["a", 1]],
      done: false,
    };

    // Act
    const text = formatValue(value);

    // Assert
    expect(text).toBe(
      '{ parents: [ { path: "src/components", captured: null }, [ "a", 1 ] ], done: false }'
    );
  });
});
