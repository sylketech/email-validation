# @sylke/email-validation

[![npm version](https://img.shields.io/npm/v/@sylke/email-validation)](https://www.npmjs.com/package/@sylke/email-validation)
[![Build Status](https://github.com/sylketech/email-validation/actions/workflows/ci.yml/badge.svg)](https://github.com/sylketech/email-validation/actions)
[![License](https://img.shields.io/npm/l/@sylke/email-validation)](./LICENSE)

This library provides email validation and parsing functionality.

- Validate email addresses according to [RFC 5322 (Internet Message Format)](https://datatracker.ietf.org/doc/html/rfc5322) specifications
- Validate individual parts of an email address (local part, domain)
- Parse email addresses into their components (local part, domain, display name)
- Support for internationalized domain names
- Handled quoted strings and special characters in the local part
- Support for domain literals (IP addresses in square brackets)

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
  - [Basic Validation](#basic-validation)
  - [Parsing Email Addresses](#parsing-email-addresses)
  - [Validating Parts](#validating-parts)
  - [Custom Options](#custom-options)
  - [Integration with Zod](#integration-with-zod)
- [License](#license)

## Installation

```bash
# Using npm
npm install @sylke/email-validation

# Using yarn
yarn add @sylke/email-validation

# Using pnpm
pnpm add @sylke/email-validation
```

## Usage

### Basic Validation

```typescript
import { isValid } from '@sylke/email-validation';

// Simple validation
console.log(isValid('user@example.com')); // true
console.log(isValid('invalid-email')); // false

// With display name
console.log(isValid('John Doe <john.doe@example.com>')); // true
```

### Parsing Email Addresses

```typescript
import { parse } from '@sylke/email-validation';

const parsed = parse('John Doe <john.doe@example.com>');
console.log(parsed);
// Output:
// {
//   original: 'John Doe <john.doe@example.com>',
//   email: 'john.doe@example.com',
//   localPart: 'john.doe',
//   domain: 'example.com',
//   displayName: 'John Doe',
//   uri: 'mailto:john.doe@example.com'
// }
```

### Validating Parts

```typescript
import { isValidLocalPart, isValidDomain } from '@sylke/email-validation';

console.log(isValidLocalPart('john.doe')); // true
console.log(isValidLocalPart('invalid@part')); // false

console.log(isValidDomain('example.com')); // true
console.log(isValidDomain('invalid domain')); // false
```

### Custom Options

```typescript
import { isValid, parse, type EmailOptions } from '@sylke/email-validation';

const options: EmailOptions = {
  minimumSubDomains: 2, // Require at least two parts to the domain (e.g., example.com)
  allowDomainLiteral: false, // Disallow domain literals like [127.0.0.1]
  allowDisplayText: false, // Disallow display names
};

console.log(isValid('user@example', options)); // false
console.log(isValid('user@example.com', options)); // true

// This would throw an error because display names are not allowed
try {
  parse('John Doe <john.doe@example.com>', options);
} catch (error) {
  console.error(error.message);
}
```

### Integration with Zod

```typescript
import { z } from 'zod';
import { isValid } from '@sylke/email-validation';

// Create a schema with custom email validation using @sylke/email-validation
const userSchema = z.object({
  email: z.string().refine(
    (email) => isValid(email, {
      minimumSubDomains: 2,
      allowDomainLiteral: false,
      allowDisplayText: false,
    }), 
    {
      message: 'Invalid email address format',
    }
  ),
});

// Example usage
try {
  const validUser = userSchema.parse({ email: 'user@example.com' });
  console.log('Valid user:', validUser);

  // This will throw an error
  const invalidUser = userSchema.parse({ email: 'invalid-email' });
} catch (error) {
  console.error('Validation error:', error.errors);
}
```

## License

MIT (c) 2025 Sylke Technologies, LLC. See the [LICENSE](./LICENSE) file for details.
