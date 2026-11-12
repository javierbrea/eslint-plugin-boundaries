import {
  getBoxPlace,
  getOpenPlaces,
  isOpenByDefault,
  toggleChoice,
} from "./inspectorPlaces";
import { INSPECTOR_PLACES } from "./inspectorPlaces.constants";
import type { InspectorPlace } from "./inspectorPlaces.types";

describe("inspectorPlaces", () => {
  describe("iNSPECTOR_PLACES", () => {
    it("should list the three sections and the boxes of the two that describe an entity", () => {
      // Assert
      expect(INSPECTOR_PLACES).toEqual([
        "from",
        "from.element",
        "from.file",
        "from.module",
        "to",
        "to.element",
        "to.file",
        "to.module",
        "dependency",
      ]);
    });
  });

  describe("getBoxPlace", () => {
    it("should name a box after its section and its own name", () => {
      // Act
      const places = [
        getBoxPlace("from", "element"),
        getBoxPlace("to", "file"),
        getBoxPlace("to", "module"),
      ];

      // Assert
      expect(places).toEqual(["from.element", "to.file", "to.module"]);
    });
  });

  describe("isOpenByDefault", () => {
    it("should fold only the two boxes of the module", () => {
      // Act
      const folded = INSPECTOR_PLACES.filter(
        (place) => !isOpenByDefault(place)
      );

      // Assert
      expect(folded).toEqual(["from.module", "to.module"]);
    });
  });

  describe("getOpenPlaces", () => {
    it("should open every place but the module boxes when the user chose nothing", () => {
      // Act
      const openPlaces = getOpenPlaces({});

      // Assert
      expect(openPlaces).toEqual({
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

    it("should take what the user chose over the default, in both directions", () => {
      // Act
      const openPlaces = getOpenPlaces({
        "from.module": true,
        "to.element": false,
      });

      // Assert
      expect(openPlaces["from.module"]).toBe(true);
      expect(openPlaces["to.element"]).toBe(false);
      expect(openPlaces["to.module"]).toBe(false);
      expect(openPlaces.dependency).toBe(true);
    });
  });

  describe("toggleChoice", () => {
    it("should fold a place that is open by default", () => {
      // Act
      const choices = toggleChoice({}, "from.element");

      // Assert
      expect(choices).toEqual({ "from.element": false });
    });

    it("should open a place that is folded by default", () => {
      // Act
      const choices = toggleChoice({}, "to.module");

      // Assert
      expect(choices).toEqual({ "to.module": true });
    });

    it("should turn a place back to what it was when it is pressed again", () => {
      // Arrange
      const once = toggleChoice({}, "from.element");

      // Act
      const twice = toggleChoice(once, "from.element");

      // Assert
      expect(twice).toEqual({ "from.element": true });
    });

    it("should keep what the user chose about the other places, and leave the choices it was given as they were", () => {
      // Arrange
      const before = { dependency: false };
      const place: InspectorPlace = "to";

      // Act
      const after = toggleChoice(before, place);

      // Assert
      expect(after).toEqual({ dependency: false, to: false });
      expect(before).toEqual({ dependency: false });
    });
  });
});
