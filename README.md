# @sylke/email-validation

RFC-compliant email validation and parsing library for JavaScript and TypeScript.

## Description

This library provides robust email validation and parsing functionality that strictly follows RFC standards. It allows you to:

- Validate email addresses
- Validate individual parts of an email address
- Parse email addresses into their components (local part, domain, display name)

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
  minimumSubDomains: 2, // Require at least one subdomain (e.g., sub.example.com)
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

## License

MIT (c) 2025 Sylke Technologies, LLC. See the [LICENSE](./LICENSE) file for details.