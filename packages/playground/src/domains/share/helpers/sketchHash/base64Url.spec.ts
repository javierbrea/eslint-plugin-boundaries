import { fromBase64Url, toBase64Url } from "./base64Url";

describe("base64Url", () => {
  describe("toBase64Url", () => {
    it("should write the bytes of a text as base64url", () => {
      // Arrange
      const bytes = new Uint8Array([104, 101, 108, 108, 111]);

      // Act
      const text = toBase64Url(bytes);

      // Assert
      expect(text).toBe("aGVsbG8");
    });

    it("should use the characters of the URL-safe alphabet and no padding", () => {
      // Arrange
      // In base64 these bytes are `+/8=`
      const bytes = new Uint8Array([0xfb, 0xff]);

      // Act
      const text = toBase64Url(bytes);

      // Assert
      expect(text).toBe("-_8");
    });

    it("should write no bytes as an empty text", () => {
      // Act
      const text = toBase64Url(new Uint8Array(0));

      // Assert
      expect(text).toBe("");
    });

    it("should write a long array of bytes, which a call with one argument per byte could not", () => {
      // Arrange
      const bytes = new Uint8Array(300_000).map((_byte, index) => index % 256);

      // Act
      const text = toBase64Url(bytes);

      // Assert
      expect(text).toHaveLength(400_000);
      expect(fromBase64Url(text)).toStrictEqual(bytes);
    });
  });

  describe("fromBase64Url", () => {
    it.each([0, 1, 2, 3, 4, 5, 6, 7])(
      "should read back %i bytes, whatever the length leaves of the last group",
      (byteCount) => {
        // Arrange
        const bytes = new Uint8Array(byteCount).map(
          (_byte, index) => 250 - index
        );

        // Act
        const read = fromBase64Url(toBase64Url(bytes));

        // Assert
        expect(read).toStrictEqual(bytes);
      }
    );

    it("should read every value of a byte", () => {
      // Arrange
      const bytes = new Uint8Array(256).map((_byte, index) => index);

      // Act
      const read = fromBase64Url(toBase64Url(bytes));

      // Assert
      expect(read).toStrictEqual(bytes);
    });

    it.each([
      ["a plus", "ab+d"],
      ["a slash", "ab/d"],
      ["padding", "abc="],
      ["a space", "ab cd"],
      ["a character that is not ASCII", "abc日"],
      ["a percent escape", "ab%2Bd"],
    ])("should refuse a text with %s", (_name, text) => {
      // Act
      const read = fromBase64Url(text);

      // Assert
      expect(read).toBeUndefined();
    });

    it.each(["a", "abcde", "abcdefghi"])(
      "should refuse the text %j, whose length leaves a single character that cannot hold a byte",
      (text) => {
        // Act
        const read = fromBase64Url(text);

        // Assert
        expect(read).toBeUndefined();
      }
    );
  });
});
