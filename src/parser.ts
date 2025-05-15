import { DISPLAY_START, MAILTO_URI_PREFIX } from "./constants";
import { EmailError, ErrorKind } from "./errors";
import { type EmailOptions, defaultEmailOptions } from "./options";
import { encode, parseDomain, parseLocalPart, splitDisplayEmail, splitParts } from "./utils";

export type ParsedEmail = {
  original: string;
  email: string;
  localPart: string;
  domain: string;
  displayName: string;
  uri: string;
};

export function parse(address: string, options: EmailOptions = defaultEmailOptions): ParsedEmail {
  const [localPart, domain, display] = splitParts(address);
  const hasDisplay = display.length > 0;
  const startsWithBracket = localPart.startsWith(DISPLAY_START);

  if (hasDisplay && !options.allowDisplayText) {
    throw new EmailError(ErrorKind.UnsupportedDisplayName);
  }

  if (!hasDisplay && startsWithBracket && options.allowDisplayText) {
    throw new EmailError(ErrorKind.MissingDisplayName);
  }

  if (!hasDisplay && startsWithBracket && !options.allowDisplayText) {
    throw new EmailError(ErrorKind.InvalidCharacter);
  }

  parseLocalPart(localPart);
  parseDomain(domain, options);

  const email = splitDisplayEmail(address)[1];

  return {
    original: address,
    email,
    localPart,
    domain,
    displayName: display,
    uri: MAILTO_URI_PREFIX + encode(email),
  };
}

export function isValid(address: string, options?: EmailOptions): boolean {
  try {
    parse(address, options);
    return true;
  } catch {
    return false;
  }
}

export function isValidLocalPart(part: string): boolean {
  try {
    parseLocalPart(part);
    return true;
  } catch {
    return false;
  }
}

export function isValidDomain(part: string, options?: EmailOptions): boolean {
  try {
    parseDomain(part, options ?? defaultEmailOptions);
    return true;
  } catch {
    return false;
  }
}
