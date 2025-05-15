import {
  AT_SYMBOL,
  DISPLAY_END,
  DISPLAY_SEPARATOR,
  DOMAIN_MAX_LENGTH,
  DOT,
  DOUBLE_QUOTE,
  HORIZONTAL_TAB,
  LEFT_BRACKET,
  LEFT_PARENTHESIS,
  LOCAL_PART_MAX_LENGTH,
  RIGHT_BRACKET,
  RIGHT_PARENTHESIS,
  SPACE,
  SUB_DOMAIN_MAX_LENGTH,
} from "./constants";
import { EmailError, ErrorKind } from "./errors";
import type { EmailOptions } from "./options";

export function encode(address: string): string {
  let result = "";

  for (const ch of address) {
    if (isReservedUniChar(ch)) {
      const code = ch.charCodeAt(0).toString(16).toUpperCase();
      result += `%${code.padStart(2, "0")}`;
    } else {
      result += ch;
    }
  }

  return result;
}

export function isReservedUniChar(c: string): boolean {
  return [
    "!",
    "#",
    "$",
    "%",
    "&",
    "'",
    "(",
    ")",
    "*",
    "+",
    ",",
    "/",
    ":",
    ";",
    "=",
    "?",
    "[",
    "]",
  ].includes(c);
}

export function splitDisplayEmail(text: string): [string, string] {
  const idx = text.lastIndexOf(DISPLAY_SEPARATOR);

  if (idx === -1) {
    return ["", text];
  }

  const left = text.substring(0, idx).trim();
  const rightRaw = text.substring(idx + DISPLAY_SEPARATOR.length).trim();

  if (!rightRaw.endsWith(DISPLAY_END)) {
    throw new EmailError(ErrorKind.MissingEndBracket);
  }

  const email = rightRaw.substring(0, rightRaw.length - 1);

  return [left, email];
}

export function splitAt(address: string): [string, string] {
  const idx = address.lastIndexOf(AT_SYMBOL);

  if (idx === -1) {
    throw new EmailError(ErrorKind.MissingSeparator);
  }

  return [address.substring(0, idx), address.substring(idx + 1)];
}

export function splitParts(address: string): [string, string, string] {
  const [display, email] = splitDisplayEmail(address);
  const [local, domain] = splitAt(email);
  return [local, domain, display];
}

export function parseLocalPart(part: string): void {
  if (part.length === 0) {
    throw new EmailError(ErrorKind.LocalPartEmpty);
  }

  if (part.length > LOCAL_PART_MAX_LENGTH) {
    throw new EmailError(ErrorKind.LocalPartTooLong);
  }

  if (part.startsWith(DOUBLE_QUOTE) && part.endsWith(DOUBLE_QUOTE)) {
    if (part.length <= 2) {
      throw new EmailError(ErrorKind.LocalPartEmpty);
    }

    parseQuotedLocalPart(part.slice(1, -1));
  } else {
    parseUnquotedLocalPart(part);
  }
}

export function parseQuotedLocalPart(part: string): void {
  if (!isQuotedContent(part)) {
    throw new EmailError(ErrorKind.InvalidCharacter);
  }
}

export function parseUnquotedLocalPart(part: string): void {
  if (!isDotAtomText(part)) {
    throw new EmailError(ErrorKind.InvalidCharacter);
  }
}

export function parseDomain(part: string, options: EmailOptions): void {
  if (part.length === 0) {
    throw new EmailError(ErrorKind.DomainEmpty);
  }

  if (part.length > DOMAIN_MAX_LENGTH) {
    throw new EmailError(ErrorKind.DomainTooLong);
  }

  if (part.startsWith(LEFT_BRACKET) && part.endsWith(RIGHT_BRACKET)) {
    if (options.allowDomainLiteral) {
      parseLiteralDomain(part.slice(1, -1));
    } else {
      throw new EmailError(ErrorKind.UnsupportedDomainLiteral);
    }
  } else {
    parseTextDomain(part, options);
  }
}

export function parseTextDomain(part: string, options: EmailOptions): void {
  const segments = part.split(DOT);
  if (segments.length === 0) {
    throw new EmailError(ErrorKind.DomainTooFew);
  }
  let count = 0;
  for (const seg of segments) {
    if (seg.length === 0) {
      throw new EmailError(ErrorKind.SubdomainEmpty);
    }

    if (seg.length > SUB_DOMAIN_MAX_LENGTH) {
      throw new EmailError(ErrorKind.SubdomainTooLong);
    }

    // Domain labels must be letter, digit, hyphen and not start/end with hyphen
    if (!isDomainLabel(seg)) {
      throw new EmailError(ErrorKind.InvalidCharacter);
    }

    count++;
  }

  if (count < options.minimumSubDomains) {
    throw new EmailError(ErrorKind.DomainTooFew);
  }
}

export function parseLiteralDomain(part: string): void {
  for (const c of part) {
    if (!isDomainLiteralChar(c)) {
      throw new EmailError(ErrorKind.InvalidCharacter);
    }
  }
}

export function isAtomText(s: string): boolean {
  return s.length > 0 && [...s].every(isAtomChar);
}

export function isDotAtomText(s: string): boolean {
  return s.split(DOT).every(isAtomText);
}

export function isAtomChar(c: string): boolean {
  const code = c.codePointAt(0);
  if (code === undefined) return false;

  return (
    (code >= 0x21 &&
      code <= 0x7e &&
      c !== LEFT_PARENTHESIS &&
      c !== RIGHT_PARENTHESIS &&
      c !== "<" &&
      c !== ">" &&
      c !== "[" &&
      c !== "]" &&
      c !== ":" &&
      c !== ";" &&
      c !== "@" &&
      c !== "\\" &&
      c !== "," &&
      c !== "." &&
      c !== '"') ||
    isUtf8NonAsciiChar(c)
  );
}

export function isDomainLabel(s: string): boolean {
  return /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(s);
}

export function isQuotedContent(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s[i];

    if (c === "\\") {
      const c2 = s[i + 1];

      if (c2 && isVisibleChar(c2)) {
        i++;
        continue;
      }

      return false;
    }

    if (!(isWhitespaceChar(c) || isQuotedTextChar(c))) {
      return false;
    }
  }
  return true;
}

export function isVisibleChar(c: string): boolean {
  const code = c.charCodeAt(0);
  return code >= 0x21 && code <= 0x7e;
}

export function isWhitespaceChar(c: string): boolean {
  return c === SPACE || c === HORIZONTAL_TAB;
}

export function isQuotedTextChar(c: string): boolean {
  const code = c.charCodeAt(0);
  return code === 0x21 || (code >= 0x23 && code <= 0x5b) || (code >= 0x5d && code <= 0x7e);
}

export function isDomainLiteralChar(c: string): boolean {
  const code = c.charCodeAt(0);
  return (code >= 0x21 && code <= 0x5a) || (code >= 0x5e && code <= 0x7e) || isUtf8NonAsciiChar(c);
}

export function isUtf8NonAsciiChar(c: string): boolean {
  const cp = c.codePointAt(0);
  return cp !== undefined && cp > 127;
}
