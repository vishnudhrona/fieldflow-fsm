import { describe, it } from 'node:test';
import assert from 'node:assert';
import { stableHash } from '../src/helpers/syncOperationQueries';

describe('Idempotency and Hash Normalization Tests', () => {
  it('stableHash should produce identical SHA256 hashes regardless of key order', () => {
    const payloadA = { status: 'IN_PROGRESS', technicianId: 'tech-123', notes: 'Arrived at site' };
    const payloadB = { notes: 'Arrived at site', status: 'IN_PROGRESS', technicianId: 'tech-123' };

    const hashA = stableHash(payloadA);
    const hashB = stableHash(payloadB);

    assert.strictEqual(typeof hashA, 'string');
    assert.strictEqual(hashA.length, 64);
    assert.strictEqual(hashA, hashB, 'Hashes of identical payloads with different key order must match');
  });

  it('stableHash should produce different hashes for different payloads', () => {
    const payloadA = { status: 'IN_PROGRESS', version: 1 };
    const payloadB = { status: 'COMPLETED', version: 1 };

    const hashA = stableHash(payloadA);
    const hashB = stableHash(payloadB);

    assert.notStrictEqual(hashA, hashB, 'Different payloads must yield different hashes');
  });

  it('stableHash should handle nested objects and arrays deterministically', () => {
    const obj1 = { meta: { b: 2, a: 1 }, items: [1, 2, 3] };
    const obj2 = { items: [1, 2, 3], meta: { a: 1, b: 2 } };

    assert.strictEqual(stableHash(obj1), stableHash(obj2));
  });
});

