import { describe, expect, it } from "vitest";
import { EmailError, ErrorKind } from "./errors";
import type { EmailOptions } from "./options";
import { isValid, parse } from "./parser";

describe("email validation (wikipedia examples)", () => {
  // https://en.wikipedia.org/wiki/Email_address#Valid_email_addresses
  const validEmails = [
    "simple@example.com",
    "very.common@example.com",
    "FirstName.LastName@EasierReading.org",
    "x@example.com",
    "long.email-address-with-hyphens@and.subdomains.example.com",
    "user.name+tag+sorting@example.com",
    "name/surname@example.com",
    "admin@example",
    "example@s.example",
    '" "@example.org',
    '"john..doe"@example.org',
    "mailhost!username@example.org",
    '"very.(),:;<>[]\\".VERY.\\"very@\\\\ \\"very\\".unusual"@strange.example.com',
    "user%example.com@example.org",
    "user-@example.org",
    "postmaster@[123.123.123.123]",
    "postmaster@[IPv6:2001:0db8:85a3:0000:0000:8a2e:0370:7334]",
    "_test@[IPv6:2001:0db8:85a3:0000:0000:8a2e:0370:7334]",
  ];

  for (const email of validEmails) {
    it(`should accept ${email}`, () => {
      const result = isValid(email);
      expect(result).toBe(true);
    });
  }

  // https://en.wikipedia.org/wiki/Email_address#Invalid_email_addresses
  const invalidEmails = [
    "abc.example.com",
    "a@b@c@example.com",
    'a"b(c)d,e:f;g<h>i[j\\k]l@example.com',
    'just"not"right@example.com',
    'this is"not\\allowed@example.com',
    'this\\ still\\"not\\\\allowed@example.com',
    "1234567890123456789012345678901234567890123456789012345678901234+x@example.com",
    "i.like.underscores@but_they_are_not_allowed_in_this_part",
  ];

  for (const email of invalidEmails) {
    it(`should reject ${email}`, () => {
      const result = isValid(email);
      expect(result).toBe(false);
    });
  }

  const parseEmailTest = "John Doe <john.doe@example.com>";

  it(`should parse ${parseEmailTest}`, () => {
    const result = parse(parseEmailTest);

    expect(result.original).toBe(parseEmailTest);
    expect(result.email).toBe("john.doe@example.com");
    expect(result.displayName).toBe("John Doe");
    expect(result.domain).toBe("example.com");
    expect(result.localPart).toBe("john.doe");
    expect(result.uri).toBe("mailto:john.doe@example.com");
  });

  it(`should fail to parse ${parseEmailTest}`, () => {
    const options: EmailOptions = {
      minimumSubDomains: 0,
      allowDisplayText: false,
      allowDomainLiteral: false,
    };

    expect(() => parse(parseEmailTest, options)).toThrowError(
      new EmailError(ErrorKind.UnsupportedDisplayName)
    );
  });

  it("should fail to parse john.doe@localhost", () => {
    const options: EmailOptions = {
      minimumSubDomains: 2,
      allowDisplayText: false,
      allowDomainLiteral: false,
    };

    expect(() => parse("john.doe@localhost", options)).toThrowError(
      new EmailError(ErrorKind.DomainTooFew)
    );
  });
});
