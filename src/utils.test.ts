import { describe, expect, it } from "vitest";
import { EmailError, ErrorKind } from "./errors";
import {
  encode,
  isAtomChar,
  isAtomText,
  isDomainLabel,
  isDomainLiteralChar,
  isDotAtomText,
  isQuotedContent,
  isQuotedTextChar,
  isReservedUniChar,
  isUtf8NonAsciiChar,
  isVisibleChar,
  isWhitespaceChar,
  splitAt,
  splitDisplayEmail,
  splitParts,
} from "./utils";

describe("encode", () => {
  it("encodes reserved characters", () => {
    expect(encode("a@b.com")).toBe("a@b.com");
    expect(encode("a+b@b.com")).toBe("a%2Bb@b.com");
  });
});

describe("isReservedUniChar", () => {
  it("returns true for reserved characters", () => {
    expect(isReservedUniChar("!")).toBe(true);
    expect(isReservedUniChar("[")).toBe(true);
    expect(isReservedUniChar("z")).toBe(false);
  });
});

describe("splitDisplayEmail", () => {
  it("splits display and email", () => {
    expect(splitDisplayEmail("John Doe <john@example.com>")).toEqual([
      "John Doe",
      "john@example.com",
    ]);
    expect(splitDisplayEmail("john@example.com")).toEqual(["", "john@example.com"]);
  });

  it("throws on missing end bracket", () => {
    expect(() => splitDisplayEmail("John Doe <john@example.com")).toThrowError(
      new EmailError(ErrorKind.MissingEndBracket)
    );
  });
});

describe("splitAt", () => {
  it("splits at @", () => {
    expect(splitAt("a@b")).toEqual(["a", "b"]);
  });

  it("throws if no @", () => {
    expect(() => splitAt("invalid")).toThrowError(new EmailError(ErrorKind.MissingSeparator));
  });
});

describe("splitParts", () => {
  it("splits into local, domain, and display", () => {
    expect(splitParts("John <a@b.com>")).toEqual(["a", "b.com", "John"]);
  });
});

describe("character checks", () => {
  it("isAtomText validates string of atom chars", () => {
    expect(isAtomText("abc")).toBe(true);
    expect(isAtomText("a(c")).toBe(false);
  });

  it("isDotAtomText validates dot-separated atoms", () => {
    expect(isDotAtomText("a.b.c")).toBe(true);
    expect(isDotAtomText("a..b")).toBe(false);
  });

  it("isAtomChar matches allowed atext", () => {
    expect(isAtomChar("A")).toBe(true);
    expect(isAtomChar("!")).toBe(true);
    expect(isAtomChar("(")).toBe(false);
  });

  it("isDomainLabel validates DNS-safe labels", () => {
    expect(isDomainLabel("example")).toBe(true);
    expect(isDomainLabel("-example")).toBe(false);
    expect(isDomainLabel("example-")).toBe(false);
  });

  it("isQuotedContent handles escaped quoted pairs", () => {
    expect(isQuotedContent('\\"a\\"')).toBe(true);
    expect(isQuotedContent('bad"')).toBe(false);
  });

  it("isVisibleChar returns true for visible ASCII", () => {
    expect(isVisibleChar("A")).toBe(true);
    expect(isVisibleChar("~")).toBe(true);
    expect(isVisibleChar(" ")).toBe(false);
  });

  it("isWhitespaceChar identifies spaces and tabs", () => {
    expect(isWhitespaceChar(" ")).toBe(true);
    expect(isWhitespaceChar("\t")).toBe(true);
    expect(isWhitespaceChar("A")).toBe(false);
  });

  it("isQuotedTextChar checks allowed quoted characters", () => {
    expect(isQuotedTextChar("!")).toBe(true);
    expect(isQuotedTextChar('"')).toBe(false);
  });

  it("isDomainLiteralChar validates allowed characters", () => {
    expect(isDomainLiteralChar("A")).toBe(true);
    expect(isDomainLiteralChar("~")).toBe(true);
    expect(isDomainLiteralChar("\\")).toBe(false);
  });

  it("isUtf8NonAsciiChar returns true for non-ASCII", () => {
    expect(isUtf8NonAsciiChar("ü")).toBe(true);
    expect(isUtf8NonAsciiChar("A")).toBe(false);
  });
});
