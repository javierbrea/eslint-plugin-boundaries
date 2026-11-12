import { spawnWorker } from "./spawnWorker";

describe("spawnWorker", () => {
  let installed: typeof Worker;
  let WorkerSpy: jest.Mock<Worker, [URL, WorkerOptions]>;
  let created: Worker;

  beforeEach(() => {
    // `jest.setup.cjs` installs a worker that runs in the thread of the tests: this one only records how it is created
    installed = globalThis.Worker;
    created = {} as unknown as Worker;
    WorkerSpy = jest.fn<Worker, [URL, WorkerOptions]>(() => created);
    globalThis.Worker = WorkerSpy as unknown as typeof Worker;
  });

  afterEach(() => {
    globalThis.Worker = installed;
  });

  describe("spawnWorker", () => {
    it("should create one worker, with the new operator, and give it back", () => {
      // Act
      const worker = spawnWorker();

      // Assert
      expect(WorkerSpy).toHaveBeenCalledTimes(1);
      expect(WorkerSpy.mock.instances[0]).toBeInstanceOf(WorkerSpy);
      expect(worker).toBe(created);
    });

    it("should load the script of the worker, evaluation.worker.js, from the folder of the file that creates it", () => {
      // Act
      spawnWorker();

      // Assert
      const [url] = WorkerSpy.mock.calls[0];

      expect(url).toBeInstanceOf(URL);
      expect(url.href.endsWith("/evaluation.worker.js")).toBe(true);
      expect(new URL(".", url).href).toBe(new URL(".", import.meta.url).href);
    });

    it("should create a module worker with the name of the playground's evaluation", () => {
      // Act
      spawnWorker();

      // Assert
      expect(WorkerSpy.mock.calls[0][1]).toEqual({
        type: "module",
        name: "playground-evaluation",
      });
    });
  });
});
