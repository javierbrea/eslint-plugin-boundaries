import type { serveEvaluations as ServeEvaluations } from "./serveEvaluations";

jest.mock("@/domains/evaluation/helpers/evaluator/serveEvaluations");

describe("evaluation.worker", () => {
  describe("when the script runs", () => {
    it("should serve the evaluations through the scope of the worker, once", async () => {
      // Arrange
      let serveEvaluations:
        | jest.MockedFunction<typeof ServeEvaluations>
        | undefined;

      // Act
      await jest.isolateModulesAsync(async () => {
        ({ serveEvaluations } = jest.mocked(
          await import("./serveEvaluations")
        ));
        await import("./evaluation.worker");
      });

      // Assert
      expect(serveEvaluations).toHaveBeenCalledTimes(1);
      expect(serveEvaluations?.mock.calls[0][0]).toBe(self);
    });
  });
});
