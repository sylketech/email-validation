import { describe, expect, it } from "vitest";
import { EmailError, ErrorKind } from "./errors";
import type { EmailOptions } from "./options";
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
  parseDomain,
  parseLiteralDomain,
  parseLocalPart,
  parseQuotedLocalPart,
  parseTextDomain,
  parseUnquotedLocalPart,
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

describe("parseLocalPart", () => {
  it("validates valid local parts", () => {
    expect(() => parseLocalPart("simple")).not.toThrow();
    expect(() => parseLocalPart("dot.separated")).not.toThrow();
    expect(() => parseLocalPart('"quoted.string"')).not.toThrow();
  });

  it("throws on empty local part", () => {
    expect(() => parseLocalPart("")).toThrowError(new EmailError(ErrorKind.LocalPartEmpty));
  });

  it("throws on too long local part", () => {
    const tooLong = "a".repeat(65);
    expect(() => parseLocalPart(tooLong)).toThrowError(new EmailError(ErrorKind.LocalPartTooLong));
  });

  it("throws on empty quoted local part", () => {
    expect(() => parseLocalPart('""')).toThrowError(new EmailError(ErrorKind.LocalPartEmpty));
  });
});

describe("parseQuotedLocalPart", () => {
  it("validates valid quoted content", () => {
    expect(() => parseQuotedLocalPart("simple")).not.toThrow();
    expect(() => parseQuotedLocalPart("with space")).not.toThrow();
    expect(() => parseQuotedLocalPart('with\\"escaped\\"quotes')).not.toThrow();
  });

  it("throws on invalid quoted content", () => {
    expect(() => parseQuotedLocalPart('invalid"quote')).toThrowError(
      new EmailError(ErrorKind.InvalidCharacter)
    );
  });
});

describe("parseUnquotedLocalPart", () => {
  it("validates valid unquoted local parts", () => {
    expect(() => parseUnquotedLocalPart("simple")).not.toThrow();
    expect(() => parseUnquotedLocalPart("dot.separated")).not.toThrow();
    expect(() => parseUnquotedLocalPart("with-hyphen")).not.toThrow();
  });

  it("throws on invalid unquoted local parts", () => {
    expect(() => parseUnquotedLocalPart("invalid..dots")).toThrowError(
      new EmailError(ErrorKind.InvalidCharacter)
    );
    expect(() => parseUnquotedLocalPart("invalid space")).toThrowError(
      new EmailError(ErrorKind.InvalidCharacter)
    );
  });
});

describe("parseDomain", () => {
  const opts: EmailOptions = {
    minimumSubDomains: 2,
    allowDomainLiteral: true,
    allowDisplayText: true,
  };

  const opts2: EmailOptions = {
    minimumSubDomains: 2,
    allowDomainLiteral: false,
    allowDisplayText: true,
  };

  it("validates valid domains", () => {
    expect(() => parseDomain("example.com", opts)).not.toThrow();
    expect(() => parseDomain("sub.example.com", opts)).not.toThrow();
  });

  it("validates domain literals when allowed", () => {
    expect(() => parseDomain("[127.0.0.1]", opts)).not.toThrow();
  });

  it("throws on empty domain", () => {
    expect(() => parseDomain("", opts)).toThrowError(new EmailError(ErrorKind.DomainEmpty));
  });

  it("throws on too long domain", () => {
    const tooLong = `${"a".repeat(256)}.com`;
    expect(() => parseDomain(tooLong, opts)).toThrowError(new EmailError(ErrorKind.DomainTooLong));
  });

  it("throws on domain literal when not allowed", () => {
    expect(() => parseDomain("[127.0.0.1]", opts2)).toThrowError(
      new EmailError(ErrorKind.UnsupportedDomainLiteral)
    );
  });
});

describe("parseTextDomain", () => {
  const opts: EmailOptions = {
    minimumSubDomains: 2,
    allowDomainLiteral: false,
    allowDisplayText: true,
  };

  it("validates valid text domains", () => {
    expect(() => parseTextDomain("example.com", opts)).not.toThrow();
    expect(() => parseTextDomain("sub.example.com", opts)).not.toThrow();
  });

  it("throws on empty subdomain", () => {
    expect(() => parseTextDomain("example..com", opts)).toThrowError(
      new EmailError(ErrorKind.SubdomainEmpty)
    );
  });

  it("throws on too long subdomain", () => {
    const tooLong = `${"a".repeat(64)}.com`;
    expect(() => parseTextDomain(tooLong, opts)).toThrowError(
      new EmailError(ErrorKind.SubdomainTooLong)
    );
  });

  it("throws on invalid subdomain character", () => {
    expect(() => parseTextDomain("invalid_char.com", opts)).toThrowError(
      new EmailError(ErrorKind.InvalidCharacter)
    );
  });

  it("throws when not enough subdomains", () => {
    expect(() => parseTextDomain("singlepart", opts)).toThrowError(
      new EmailError(ErrorKind.DomainTooFew)
    );
  });
});

describe("parseLiteralDomain", () => {
  it("validates valid literal domains", () => {
    expect(() => parseLiteralDomain("127.0.0.1")).not.toThrow();
    expect(() => parseLiteralDomain("IPv6:2001:db8::1")).not.toThrow();
  });

  it("throws on invalid literal domain characters", () => {
    expect(() => parseLiteralDomain("invalid\\character")).toThrowError(
      new EmailError(ErrorKind.InvalidCharacter)
    );
  });
});
