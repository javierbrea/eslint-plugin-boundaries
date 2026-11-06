import { createEngine } from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";

import { countVerdicts } from "./verdictCounts";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const { evaluate } = createEngine();

describe("verdictCounts", () => {
  describe("countVerdicts", () => {
    it("should count the dependencies of the quick-start example by what the engine decided", () => {
      // Arrange
      const { dependencies } = evaluate(QUICK_START);

      // Act
      const counts = countVerdicts(dependencies);

      // Assert
      expect(counts).toEqual({
        total: 9,
        allowed: 3,
        disallowed: 2,
        notChecked: 4,
      });
    });

    it("should count only the dependencies of the set it is given", () => {
      // Arrange
      const { dependencies } = evaluate(QUICK_START);
      const checkout = dependencies.filter(
        ({ ref }) => ref.path === "src/modules/checkout/index.js"
      );

      // Act
      const counts = countVerdicts(checkout);

      // Assert
      expect(counts).toEqual({
        total: 4,
        allowed: 2,
        disallowed: 1,
        notChecked: 1,
      });
    });

    it("should count a dependency that a warning disallows as disallowed", () => {
      // Arrange
      const config = QUICK_START.config.replace(
        '"boundaries/dependencies": [2,',
        '"boundaries/dependencies": ["warn",'
      );
      const { dependencies } = evaluate({ ...QUICK_START, config });

      // Act
      const { disallowed } = countVerdicts(dependencies);

      // Assert
      expect(config).not.toBe(QUICK_START.config);
      expect(disallowed).toBe(2);
    });

    it("should count a dependency that is not evaluated only in the total", () => {
      // Arrange
      const config = QUICK_START.config.replace(
        '"boundaries/dependencies": [2,',
        '"boundaries/dependencies": ["off",'
      );
      const { dependencies } = evaluate({ ...QUICK_START, config });

      // Act
      const counts = countVerdicts(dependencies);

      // Assert
      expect(counts).toEqual({
        total: 9,
        allowed: 0,
        disallowed: 0,
        notChecked: 0,
      });
    });

    it("should count nothing for no dependencies", () => {
      // Act
      const counts = countVerdicts([]);

      // Assert
      expect(counts).toEqual({
        total: 0,
        allowed: 0,
        disallowed: 0,
        notChecked: 0,
      });
    });
  });
});
