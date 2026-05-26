import type { ConfigOptionsNormalized } from "./Config";
import { Config } from "./Config";
import type { DescriptorsConfig } from "./Descriptor";
import { Elements } from "./Elements";
import type { ElementsSerializedCache } from "./Elements.types";
import type {
  MatcherSerializedCache,
  MicromatchSerializedCache,
} from "./Matcher";
import { Matcher, Micromatch } from "./Matcher";
import { MatchersCache } from "./MatchersCache";

jest.mock("./Config");
jest.mock("./Matcher");
jest.mock("./MatchersCache");

const MockedConfig = jest.mocked(Config);
const MockedMatcher = jest.mocked(Matcher);
const MockedMicromatch = jest.mocked(Micromatch);
const MockedMatchersCache = jest.mocked(MatchersCache);

describe("Elements", () => {
  const MOCK_NORMALIZED_OPTIONS = {
    legacyTemplates: true,
    cache: true,
  } as unknown as ConfigOptionsNormalized;

  const MOCK_DESCRIPTOR_OPTIONS = { ignorePaths: [] };
  const MOCK_MATCHERS_OPTIONS = { legacyTemplates: true };

  const MOCK_MICROMATCH_CACHE: MicromatchSerializedCache = {
    matchingResults: {},
    captures: {},
  };

  const MOCK_MATCHER_CACHE = {
    descriptors: {},
  } as unknown as MatcherSerializedCache;

  let matchersCacheInstance: {
    getAll: jest.Mock;
    getKey: jest.Mock;
    has: jest.Mock;
    get: jest.Mock;
    set: jest.Mock;
    clear: jest.Mock;
  };

  let micromatchWithCacheInstance: {
    serializeCache: jest.Mock;
    setFromSerialized: jest.Mock;
    clearCache: jest.Mock;
  };

  let micromatchWithoutCacheInstance: {
    serializeCache: jest.Mock;
    setFromSerialized: jest.Mock;
    clearCache: jest.Mock;
  };

  beforeEach(() => {
    matchersCacheInstance = {
      getAll: jest.fn().mockReturnValue(new Map()),
      getKey: jest.fn().mockReturnValue("mock-key"),
      has: jest.fn().mockReturnValue(false),
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    };

    micromatchWithCacheInstance = {
      serializeCache: jest.fn().mockReturnValue(MOCK_MICROMATCH_CACHE),
      setFromSerialized: jest.fn(),
      clearCache: jest.fn(),
    };

    micromatchWithoutCacheInstance = {
      serializeCache: jest.fn(),
      setFromSerialized: jest.fn(),
      clearCache: jest.fn(),
    };

    MockedMatchersCache.mockReturnValue(
      matchersCacheInstance as unknown as MatchersCache
    );

    MockedMicromatch.mockImplementation(
      (cache: boolean) =>
        (cache
          ? micromatchWithCacheInstance
          : micromatchWithoutCacheInstance) as unknown as Micromatch
    );

    MockedConfig.mockReturnValue({
      options: MOCK_NORMALIZED_OPTIONS,
      cache: true,
      descriptorOptions: MOCK_DESCRIPTOR_OPTIONS,
      matchersOptions: MOCK_MATCHERS_OPTIONS,
    } as unknown as Config);

    MockedMatcher.mockReturnValue({
      serializeCache: jest.fn().mockReturnValue(MOCK_MATCHER_CACHE),
      setCacheFromSerialized: jest.fn(),
      clearCache: jest.fn(),
    } as unknown as Matcher);
  });

  describe("constructor", () => {
    it("should create a Config with the provided options", () => {
      const options = { cache: false };

      new Elements(options);

      expect(MockedConfig).toHaveBeenCalledWith(options);
    });

    it("should create a Config with undefined when no options are provided", () => {
      new Elements();

      expect(MockedConfig).toHaveBeenCalledWith(undefined);
    });

    it("should create Micromatch instances with and without cache", () => {
      new Elements();

      expect(MockedMicromatch).toHaveBeenCalledTimes(2);
      expect(MockedMicromatch).toHaveBeenCalledWith(true);
      expect(MockedMicromatch).toHaveBeenCalledWith(false);
    });

    it("should create a MatchersCache instance", () => {
      new Elements();

      expect(MockedMatchersCache).toHaveBeenCalledTimes(1);
    });
  });

  describe("serializeCache", () => {
    it("should return empty matchers when cache has no entries", () => {
      const elements = new Elements();

      const result = elements.serializeCache();

      expect(result).toEqual({
        matchers: {},
        micromatch: MOCK_MICROMATCH_CACHE,
      });
    });

    it("should serialize all cached matchers with their config and descriptors", () => {
      const matcherInstance = {
        serializeCache: jest.fn().mockReturnValue(MOCK_MATCHER_CACHE),
      };
      const descriptors: DescriptorsConfig = { elements: [] };

      matchersCacheInstance.getAll.mockReturnValue(
        new Map([
          [
            "entry-key",
            {
              config: MOCK_NORMALIZED_OPTIONS,
              descriptors,
              matcher: matcherInstance,
            },
          ],
        ])
      );

      const elements = new Elements();
      const result = elements.serializeCache();

      expect(matcherInstance.serializeCache).toHaveBeenCalled();
      expect(result).toEqual({
        matchers: {
          "entry-key": {
            config: MOCK_NORMALIZED_OPTIONS,
            descriptors,
            cache: MOCK_MATCHER_CACHE,
          },
        },
        micromatch: MOCK_MICROMATCH_CACHE,
      });
    });
  });

  describe("setCacheFromSerialized", () => {
    it("should set micromatch cache from serialized data when matchers are empty", () => {
      const serialized: ElementsSerializedCache = {
        matchers: {},
        micromatch: MOCK_MICROMATCH_CACHE,
      };
      const elements = new Elements();

      elements.setCacheFromSerialized(serialized);

      expect(
        micromatchWithCacheInstance.setFromSerialized
      ).toHaveBeenCalledWith(MOCK_MICROMATCH_CACHE);
    });

    it("should restore each matcher from serialized data", () => {
      const descriptors: DescriptorsConfig = { elements: [] };
      const matcherInstance = {
        serializeCache: jest.fn().mockReturnValue(MOCK_MATCHER_CACHE),
        setCacheFromSerialized: jest.fn(),
        clearCache: jest.fn(),
      };
      MockedMatcher.mockReturnValue(matcherInstance as unknown as Matcher);

      const serialized: ElementsSerializedCache = {
        matchers: {
          "key-1": {
            config: MOCK_NORMALIZED_OPTIONS,
            descriptors,
            cache: MOCK_MATCHER_CACHE,
          },
        },
        micromatch: MOCK_MICROMATCH_CACHE,
      };

      const elements = new Elements();
      elements.setCacheFromSerialized(serialized);

      expect(matcherInstance.setCacheFromSerialized).toHaveBeenCalledWith(
        MOCK_MATCHER_CACHE
      );
      expect(matchersCacheInstance.set).toHaveBeenCalledWith("key-1", {
        config: MOCK_NORMALIZED_OPTIONS,
        descriptors,
        matcher: matcherInstance,
      });
    });
  });

  describe("clearCache", () => {
    it("should clear matchers cache and micromatch cache when no matchers are cached", () => {
      const elements = new Elements();

      elements.clearCache();

      expect(matchersCacheInstance.clear).toHaveBeenCalled();
      expect(micromatchWithCacheInstance.clearCache).toHaveBeenCalled();
    });

    it("should clear each cached matcher before clearing the caches", () => {
      const matcherInstance = {
        clearCache: jest.fn(),
      };

      matchersCacheInstance.getAll.mockReturnValue(
        new Map([
          [
            "key-1",
            {
              config: MOCK_NORMALIZED_OPTIONS,
              descriptors: {},
              matcher: matcherInstance,
            },
          ],
        ])
      );

      const elements = new Elements();
      elements.clearCache();

      expect(matcherInstance.clearCache).toHaveBeenCalled();
      expect(matchersCacheInstance.clear).toHaveBeenCalled();
      expect(micromatchWithCacheInstance.clearCache).toHaveBeenCalled();
    });
  });

  describe("getMatcher", () => {
    it("should use global config options when no config is provided", () => {
      const elements = new Elements();
      MockedConfig.mockClear();

      elements.getMatcher({});

      expect(MockedConfig).toHaveBeenCalledWith(MOCK_NORMALIZED_OPTIONS);
    });

    it("should use provided config when config argument is given", () => {
      const customConfig = { cache: false, rootPath: "/custom" };
      const elements = new Elements();
      MockedConfig.mockClear();

      elements.getMatcher({}, customConfig);

      expect(MockedConfig).toHaveBeenCalledWith(customConfig);
    });

    it("should return cached matcher on cache hit", () => {
      const existingMatcher = {} as unknown as Matcher;
      matchersCacheInstance.has.mockReturnValue(true);
      matchersCacheInstance.get.mockReturnValue({
        config: MOCK_NORMALIZED_OPTIONS,
        descriptors: {},
        matcher: existingMatcher,
      });

      const elements = new Elements();
      const result = elements.getMatcher({});

      expect(result).toBe(existingMatcher);
      expect(MockedMatcher).not.toHaveBeenCalled();
    });

    it("should create Matcher with cached micromatch when cache is enabled", () => {
      const descriptors: DescriptorsConfig = { elements: [] };
      const elements = new Elements();

      elements.getMatcher(descriptors);

      expect(MockedMatcher).toHaveBeenCalledWith({
        descriptors,
        micromatch: micromatchWithCacheInstance,
        options: {
          descriptors: MOCK_DESCRIPTOR_OPTIONS,
          matchers: MOCK_MATCHERS_OPTIONS,
        },
      });
    });

    it("should create Matcher with non-cached micromatch when cache is disabled", () => {
      MockedConfig.mockReturnValue({
        options: MOCK_NORMALIZED_OPTIONS,
        cache: false,
        descriptorOptions: MOCK_DESCRIPTOR_OPTIONS,
        matchersOptions: MOCK_MATCHERS_OPTIONS,
      } as unknown as Config);

      const descriptors: DescriptorsConfig = { elements: [] };
      const elements = new Elements();
      elements.getMatcher(descriptors);

      expect(MockedMatcher).toHaveBeenCalledWith({
        descriptors,
        micromatch: micromatchWithoutCacheInstance,
        options: {
          descriptors: MOCK_DESCRIPTOR_OPTIONS,
          matchers: MOCK_MATCHERS_OPTIONS,
        },
      });
    });

    it("should store new matcher in the cache", () => {
      const descriptors: DescriptorsConfig = { elements: [] };
      const elements = new Elements();

      elements.getMatcher(descriptors);

      expect(matchersCacheInstance.set).toHaveBeenCalledWith(
        "mock-key",
        expect.objectContaining({
          config: MOCK_NORMALIZED_OPTIONS,
          descriptors,
        })
      );
    });

    it("should generate cache key with normalized config and descriptors", () => {
      const descriptors: DescriptorsConfig = { elements: [] };
      const elements = new Elements();

      elements.getMatcher(descriptors);

      expect(matchersCacheInstance.getKey).toHaveBeenCalledWith({
        config: MOCK_NORMALIZED_OPTIONS,
        descriptors,
      });
    });
  });
});
