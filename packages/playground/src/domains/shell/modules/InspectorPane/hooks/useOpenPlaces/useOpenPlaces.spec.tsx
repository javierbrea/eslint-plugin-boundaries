import { act, renderHook } from "@testing-library/react";

import { useOpenPlaces } from "./useOpenPlaces";

describe("useOpenPlaces", () => {
  it("should open every place but the module boxes until the user chooses", () => {
    // Act
    const { result } = renderHook(() => useOpenPlaces());

    // Assert
    expect(result.current.openPlaces).toEqual({
      from: true,
      "from.element": true,
      "from.file": true,
      "from.module": false,
      to: true,
      "to.element": true,
      "to.file": true,
      "to.module": false,
      dependency: true,
    });
  });

  it("should fold a place that is open when it is toggled, and no other", () => {
    // Arrange
    const { result } = renderHook(() => useOpenPlaces());

    // Act
    act(() => result.current.onToggle("to.element"));

    // Assert
    expect(result.current.openPlaces["to.element"]).toBe(false);
    expect(result.current.openPlaces["from.element"]).toBe(true);
    expect(result.current.openPlaces.to).toBe(true);
  });

  it("should open a place that is folded when it is toggled", () => {
    // Arrange
    const { result } = renderHook(() => useOpenPlaces());

    // Act
    act(() => result.current.onToggle("from.module"));

    // Assert
    expect(result.current.openPlaces["from.module"]).toBe(true);
    expect(result.current.openPlaces["to.module"]).toBe(false);
  });

  it("should put a place back to what it was when it is toggled twice", () => {
    // Arrange
    const { result } = renderHook(() => useOpenPlaces());

    // Act
    act(() => result.current.onToggle("dependency"));
    act(() => result.current.onToggle("dependency"));

    // Assert
    expect(result.current.openPlaces.dependency).toBe(true);
  });

  it("should keep what the user chose through the renders that follow", () => {
    // Arrange
    const { result, rerender } = renderHook(() => useOpenPlaces());
    act(() => result.current.onToggle("from"));

    // Act
    rerender();

    // Assert
    expect(result.current.openPlaces.from).toBe(false);
  });

  it("should give the same places and the same function while nothing is toggled, so that a pane does not render again for it", () => {
    // Arrange
    const { result, rerender } = renderHook(() => useOpenPlaces());
    const before = result.current;

    // Act
    rerender();

    // Assert
    expect(result.current.openPlaces).toBe(before.openPlaces);
    expect(result.current.onToggle).toBe(before.onToggle);
  });

  it("should keep a separate state for each component that calls it", () => {
    // Arrange
    const first = renderHook(() => useOpenPlaces());
    const second = renderHook(() => useOpenPlaces());

    // Act
    act(() => first.result.current.onToggle("from"));

    // Assert
    expect(first.result.current.openPlaces.from).toBe(false);
    expect(second.result.current.openPlaces.from).toBe(true);
  });
});
