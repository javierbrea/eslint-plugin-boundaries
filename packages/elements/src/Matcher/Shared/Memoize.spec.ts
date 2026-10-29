import { memoizeByIdentity, memoizeByIdentityPair } from "./Memoize";

describe("Memoize", () => {
  describe("memoizeByIdentity", () => {
    it("should call the function once for the same object and return the same result", () => {
      // Arrange
      const fn = jest.fn((value: { value: number }) => ({
        doubled: value.value * 2,
      }));
      const memoized = memoizeByIdentity(fn);
      const input = { value: 2 };

      // Act
      const first = memoized(input);
      const second = memoized(input);

      // Assert
      expect(fn).toHaveBeenCalledTimes(1);
      expect(first).toEqual({ doubled: 4 });
      expect(second).toBe(first);
    });

    it("should call the function again for a different object with the same content", () => {
      // Arrange
      const fn = jest.fn((value: { value: number }) => ({
        doubled: value.value * 2,
      }));
      const memoized = memoizeByIdentity(fn);

      // Act
      const first = memoized({ value: 2 });
      const second = memoized({ value: 2 });

      // Assert
      expect(fn).toHaveBeenCalledTimes(2);
      expect(second).toEqual(first);
      expect(second).not.toBe(first);
    });

    it("should memoize array inputs by identity", () => {
      // Arrange
      const fn = jest.fn((values: string[]) =>
        values.map((item) => item.toUpperCase())
      );
      const memoized = memoizeByIdentity(fn);
      const input = ["a", "b"];

      // Act
      const first = memoized(input);
      const second = memoized(input);

      // Assert
      expect(fn).toHaveBeenCalledTimes(1);
      expect(second).toBe(first);
      expect(first).toEqual(["A", "B"]);
    });

    it("should memoize a result that is undefined", () => {
      // Arrange
      const fn = jest.fn((_input: object): undefined => undefined);
      const memoized = memoizeByIdentity(fn);
      const input = {};

      // Act
      memoized(input);
      const result = memoized(input);

      // Assert
      expect(fn).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it("should call the function on every call for primitive inputs", () => {
      // Arrange
      const fn = jest.fn((type: string) => ({ type }));
      const memoized = memoizeByIdentity(fn);

      // Act
      const first = memoized("helpers");
      const second = memoized("helpers");

      // Assert
      expect(fn).toHaveBeenCalledTimes(2);
      expect(first).toEqual({ type: "helpers" });
      expect(second).toEqual(first);
      expect(second).not.toBe(first);
    });

    it("should call the function on every call for null inputs", () => {
      // Arrange
      const fn = jest.fn((value: null) => value);
      const memoized = memoizeByIdentity(fn);

      // Act
      memoized(null);
      memoized(null);

      // Assert
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("memoizeByIdentityPair", () => {
    type Pair = { first: unknown; second: unknown };

    let fn: jest.Mock<Pair, [unknown, object | undefined]>;
    let memoized: (first: unknown, second: object | undefined) => Pair;

    beforeEach(() => {
      fn = jest.fn(
        (a: unknown, b: object | undefined): Pair => ({ first: a, second: b })
      );
      memoized = memoizeByIdentityPair(fn);
    });

    it("should call the function once for the same pair of objects and return the same result", () => {
      // Arrange
      const first = { a: 1 };
      const second = { b: 2 };

      // Act
      const firstResult = memoized(first, second);
      const secondResult = memoized(first, second);

      // Assert
      expect(fn).toHaveBeenCalledTimes(1);
      expect(firstResult).toEqual({ first, second });
      expect(secondResult).toBe(firstResult);
    });

    it("should call the function again when the second object is different", () => {
      // Arrange
      const first = { a: 1 };
      const second = { b: 2 };
      const otherSecond = { b: 3 };

      // Act
      const firstResult = memoized(first, second);
      const secondResult = memoized(first, otherSecond);

      // Assert
      expect(fn).toHaveBeenCalledTimes(2);
      expect(firstResult).toEqual({ first, second });
      expect(secondResult).toEqual({ first, second: otherSecond });
    });

    it("should call the function again when the first object is different", () => {
      // Arrange
      const second = { b: 2 };

      // Act
      const firstResult = memoized({ a: 1 }, second);
      const secondResult = memoized({ a: 1 }, second);

      // Assert
      expect(fn).toHaveBeenCalledTimes(2);
      expect(secondResult).toEqual(firstResult);
      expect(secondResult).not.toBe(firstResult);
    });

    it("should memoize calls with an undefined second argument", () => {
      // Arrange
      const first = { a: 1 };

      // Act
      const firstResult = memoized(first, undefined);
      const secondResult = memoized(first, undefined);

      // Assert
      expect(fn).toHaveBeenCalledTimes(1);
      expect(firstResult).toEqual({ first, second: undefined });
      expect(secondResult).toBe(firstResult);
    });

    it("should keep the results for an undefined second argument and for an object apart", () => {
      // Arrange
      const first = { a: 1 };
      const second = { b: 2 };

      // Act
      const withoutSecond = memoized(first, undefined);
      const withSecond = memoized(first, second);

      // Assert
      expect(fn).toHaveBeenCalledTimes(2);
      expect(withoutSecond).toEqual({ first, second: undefined });
      expect(withSecond).toEqual({ first, second });
    });

    it("should memoize a result that is undefined", () => {
      // Arrange
      const undefinedFn = jest.fn((): undefined => undefined);
      const memoizedUndefined = memoizeByIdentityPair<
        object,
        object,
        undefined
      >(undefinedFn);
      const first = {};
      const second = {};

      // Act
      memoizedUndefined(first, second);
      const result = memoizedUndefined(first, second);

      // Assert
      expect(undefinedFn).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it("should call the function on every call when the first argument is a primitive", () => {
      // Arrange
      const second = { b: 2 };

      // Act
      const firstResult = memoized("x", second);
      const secondResult = memoized("x", second);

      // Assert
      expect(fn).toHaveBeenCalledTimes(2);
      expect(secondResult).toEqual(firstResult);
      expect(secondResult).not.toBe(firstResult);
    });
  });
});
