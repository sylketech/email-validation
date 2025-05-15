import { DOMAIN_MAX_LENGTH, DOT, LOCAL_PART_MAX_LENGTH, SUB_DOMAIN_MAX_LENGTH } from "./constants";

export enum ErrorKind {
  InvalidCharacter = "InvalidCharacter",
  MissingSeparator = "MissingSeparator",
  LocalPartEmpty = "LocalPartEmpty",
  LocalPartTooLong = "LocalPartTooLong",
  DomainEmpty = "DomainEmpty",
  DomainTooLong = "DomainTooLong",
  SubdomainEmpty = "SubdomainEmpty",
  SubdomainTooLong = "SubdomainTooLong",
  DomainTooFew = "DomainTooFew",
  DomainInvalidSeparator = "DomainInvalidSeparator",
  UnbalancedQuotes = "UnbalancedQuotes",
  InvalidComment = "InvalidComment",
  InvalidIPAddress = "InvalidIPAddress",
  UnsupportedDomainLiteral = "UnsupportedDomainLiteral",
  UnsupportedDisplayName = "UnsupportedDisplayName",
  MissingDisplayName = "MissingDisplayName",
  MissingEndBracket = "MissingEndBracket",
}

export class EmailError extends Error {
  public readonly kind: ErrorKind;

  constructor(kind: ErrorKind) {
    super(getErrorMessage(kind));
    this.name = "EmailError";
    this.kind = kind;
  }
}

function getErrorMessage(kind: ErrorKind): string {
  switch (kind) {
    case ErrorKind.InvalidCharacter:
      return "Invalid character.";
    case ErrorKind.MissingSeparator:
      return "Missing separator character '@'.";
    case ErrorKind.LocalPartEmpty:
      return "Local part is empty.";
    case ErrorKind.LocalPartTooLong:
      return `Local part is too long. Length limit: ${LOCAL_PART_MAX_LENGTH}.`;
    case ErrorKind.DomainEmpty:
      return "Domain is empty.";
    case ErrorKind.DomainTooLong:
      return `Domain is too long. Length limit: ${DOMAIN_MAX_LENGTH}.`;
    case ErrorKind.SubdomainEmpty:
      return "A subdomain is empty.";
    case ErrorKind.SubdomainTooLong:
      return `A subdomain is too long. Length limit: ${SUB_DOMAIN_MAX_LENGTH}.`;
    case ErrorKind.DomainTooFew:
      return "Too few parts in the domain.";
    case ErrorKind.DomainInvalidSeparator:
      return `Invalid placement of the domain separator '${DOT}'.`;
    case ErrorKind.UnbalancedQuotes:
      return "Quotes around the local-part are unbalanced.";
    case ErrorKind.InvalidComment:
      return "A comment was badly formed.";
    case ErrorKind.InvalidIPAddress:
      return "Invalid IP Address specified for domain.";
    case ErrorKind.UnsupportedDomainLiteral:
      return "Domain literals are not supported.";
    case ErrorKind.UnsupportedDisplayName:
      return "Display names are not supported.";
    case ErrorKind.MissingDisplayName:
      return "Display name was not supplied, but email starts with '<'.";
    case ErrorKind.MissingEndBracket:
      return "Terminating '>' is missing.";
    default:
      return "Unknown error.";
  }
}
