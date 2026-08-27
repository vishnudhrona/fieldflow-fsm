import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizeString, sanitizeEmail, sanitizeBoolean, sanitizeOptionalString, isValidUuid } from '../src/utils/sanitizers';

describe('Sanitizers and Validators Unit Tests', () => {
  it('sanitizeString should trim strings and handle non-strings', () => {
    assert.strictEqual(sanitizeString('  hello world  '), 'hello world');
    assert.strictEqual(sanitizeString(null), '');
    assert.strictEqual(sanitizeString(123), '');
  });

  it('sanitizeEmail should trim and lowercase emails', () => {
    assert.strictEqual(sanitizeEmail('  Tech@Example.COM '), 'tech@example.com');
    assert.strictEqual(sanitizeEmail(undefined), '');
  });

  it('sanitizeBoolean should convert inputs properly', () => {
    assert.strictEqual(sanitizeBoolean(true), true);
    assert.strictEqual(sanitizeBoolean(false), false);
    assert.strictEqual(sanitizeBoolean(undefined, true), true);
  });

  it('sanitizeOptionalString should return null for empty strings', () => {
    assert.strictEqual(sanitizeOptionalString('  valid  '), 'valid');
    assert.strictEqual(sanitizeOptionalString('   '), null);
    assert.strictEqual(sanitizeOptionalString(null), null);
  });

  it('isValidUuid should correctly validate UUID v4 strings', () => {
    assert.strictEqual(isValidUuid('c77302c2-58af-486c-ac4a-1e513e32fa1c'), true);
    assert.strictEqual(isValidUuid('12345'), false);
    assert.strictEqual(isValidUuid(null), false);
    assert.strictEqual(isValidUuid(''), false);
  });
});

