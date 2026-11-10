import type { ShareNotice } from "@/domains/share/helpers/shareOutcome";

import { getShareNotice } from "./shareNotice";

describe("ShareNotice", () => {
  describe("getShareNotice", () => {
    describe("long", () => {
      it("should warn that the link was copied but some apps may cut it, with the numbers written with separators", () => {
        // Arrange
        const notice: ShareNotice = {
          kind: "long",
          length: 9412,
          maxLength: 8192,
        };

        // Act
        const view = getShareNotice(notice);

        // Assert
        expect(view).toEqual({
          tone: "warn",
          title: "Long link copied",
          text: "The link has 9,412 characters, and some apps cut links longer than 8,192 when they are pasted. After you paste it, check that it opens the whole project.",
          reason: undefined,
          link: undefined,
        });
      });

      it("should write a number below one thousand with no separator", () => {
        // Arrange
        const notice: ShareNotice = {
          kind: "long",
          length: 999,
          maxLength: 512,
        };

        // Act
        const { text } = getShareNotice(notice);

        // Assert
        expect(text).toContain("The link has 999 characters");
        expect(text).toContain("longer than 512 when");
      });
    });

    describe("not-copied", () => {
      it("should say that the browser did not let the playground copy the link, and hand over the link to copy by hand", () => {
        // Arrange
        const notice: ShareNotice = {
          kind: "not-copied",
          link: "https://example.test/playground/#v=1",
        };

        // Act
        const view = getShareNotice(notice);

        // Assert
        expect(view).toEqual({
          tone: "bad",
          title: "The link could not be copied",
          text: "The browser did not let the playground use the clipboard. The link is selected below: press Ctrl+C or ⌘C to copy it, or try again.",
          reason: undefined,
          link: "https://example.test/playground/#v=1",
        });
      });
    });

    describe("not-made", () => {
      it("should say that the link could not be made, and offer no link", () => {
        // Arrange
        const notice: ShareNotice = { kind: "not-made" };

        // Act
        const view = getShareNotice(notice);

        // Assert
        expect(view).toEqual({
          tone: "bad",
          title: "The link could not be made",
          text: "The page could not make the link of the project. Your project is still here: try again in a moment.",
          reason: undefined,
          link: undefined,
        });
      });
    });

    describe("too-large", () => {
      it.each<[ShareNotice, string]>([
        [
          { kind: "too-large", limit: "nodes", max: 1000 },
          "It has more than 1,000 files and folders, the most that a link can hold. Remove some of them and share it again.",
        ],
        [
          { kind: "too-large", limit: "dependencies", max: 3000 },
          "It has more than 3,000 dependencies, the most that a link can hold. Remove some of them and share it again.",
        ],
        [
          { kind: "too-large", limit: "nodes", max: 12345678 },
          "It has more than 12,345,678 files and folders, the most that a link can hold. Remove some of them and share it again.",
        ],
      ])(
        "should say how many of what a link holds at most, when the project has more: %j",
        (notice, text) => {
          // Act
          const view = getShareNotice(notice);

          // Assert
          expect(view).toEqual({
            tone: "bad",
            title: "The project is too large for a link",
            text,
            reason: undefined,
            link: undefined,
          });
        }
      );

      it.each<[number, string]>([
        [4 * 1024 * 1024, "4"],
        [1536 * 1024, "1.5"],
        [2048 * 1024 * 1024, "2,048"],
      ])(
        "should write the size of the JSON in MiB when it passes the limit of bytes: %d bytes are %s MiB",
        (max, size) => {
          // Arrange
          const notice: ShareNotice = {
            kind: "too-large",
            limit: "bytes",
            max,
          };

          // Act
          const view = getShareNotice(notice);

          // Assert
          expect(view).toEqual({
            tone: "bad",
            title: "The project is too large for a link",
            text: `It takes more than ${size} MiB once written as JSON, the most that a link can hold. Remove some files or dependencies, or shorten the config, and share it again.`,
            reason: undefined,
            link: undefined,
          });
        }
      );
    });

    describe("invalid", () => {
      it("should say that the project cannot be shared, and give the reason that the reader of links gives apart from the text", () => {
        // Arrange
        const notice: ShareNotice = {
          kind: "invalid",
          reason: "Dependency 1 cannot be in the project.",
        };

        // Act
        const view = getShareNotice(notice);

        // Assert
        expect(view).toEqual({
          tone: "bad",
          title: "The project cannot be shared",
          text: "A link would not open it, because the playground refuses it when it reads a link:",
          reason: "Dependency 1 cannot be in the project.",
          link: undefined,
        });
      });
    });
  });
});
