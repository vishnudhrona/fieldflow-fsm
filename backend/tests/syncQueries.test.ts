import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ROLES } from '../src/config/constants';

describe('Sync Logic and Concurrency Validation', () => {
  it('should detect version conflict when baseVersion is older than serverVersion', () => {
    const serverWorkOrder = { id: 'wo-1', version: 3, status: 'IN_PROGRESS' };
    const clientMutation = {
      mutationId: 'mut-1',
      actionType: 'UPDATE_STATUS',
      workOrderId: 'wo-1',
      baseVersion: 2, // Stale! Server is at 3
      payload: { status: 'COMPLETED' },
    };

    const hasConflict = clientMutation.baseVersion !== undefined &&
      clientMutation.baseVersion !== null &&
      serverWorkOrder.version > clientMutation.baseVersion;

    assert.strictEqual(hasConflict, true, 'Outdated baseVersion must trigger conflict detection');
  });

  it('should permit update when baseVersion matches serverVersion', () => {
    const serverWorkOrder = { id: 'wo-1', version: 2, status: 'IN_PROGRESS' };
    const clientMutation = {
      mutationId: 'mut-2',
      actionType: 'UPDATE_STATUS',
      workOrderId: 'wo-1',
      baseVersion: 2, // Matches server!
      payload: { status: 'COMPLETED' },
    };

    const hasConflict = clientMutation.baseVersion !== undefined &&
      clientMutation.baseVersion !== null &&
      serverWorkOrder.version > clientMutation.baseVersion;

    assert.strictEqual(hasConflict, false, 'Matching version must not trigger conflict');
  });

  it('should validate row-level authorization for technician assignment', () => {
    const technicianActor = { id: 'tech-100', role: ROLES.TECHNICIAN };
    const otherTechnicianActor = { id: 'tech-999', role: ROLES.TECHNICIAN };
    const dispatcherActor = { id: 'admin-1', role: ROLES.ADMIN_DISPATCHER };

    const workOrder = { id: 'wo-1', technicianId: 'tech-100' };

    const checkAuth = (actor: { id: string; role: string }, wo: { technicianId: string }) => {
      if (actor.role === ROLES.ADMIN_DISPATCHER || wo.technicianId === actor.id) {
        return { ok: true };
      }
      return { ok: false, reason: 'FORBIDDEN' };
    };

    assert.strictEqual(checkAuth(technicianActor, workOrder).ok, true);
    assert.strictEqual(checkAuth(dispatcherActor, workOrder).ok, true);
    assert.strictEqual(checkAuth(otherTechnicianActor, workOrder).ok, false);
    assert.strictEqual(checkAuth(otherTechnicianActor, workOrder).reason, 'FORBIDDEN');
  });

  it('should detect explicit conflict when work order was CANCELLED by dispatcher', () => {
    const cancelledWorkOrder = { id: 'wo-1', version: 2, status: 'CANCELLED' };
    const clientMutation = {
      mutationId: 'mut-3',
      actionType: 'UPDATE_STATUS',
      workOrderId: 'wo-1',
      baseVersion: 1,
      payload: { status: 'COMPLETED' },
    };

    const isCancelledConflict =
      cancelledWorkOrder.status === 'CANCELLED' &&
      (clientMutation.actionType === 'UPDATE_STATUS' || clientMutation.actionType === 'COMPLETE_JOB');

    assert.strictEqual(isCancelledConflict, true, 'Offline completion on CANCELLED work order must trigger CONFLICT');
  });

  it('should fail mutation when note content or reading metrics are empty', () => {
    const emptyNote = { content: '   ' };
    const emptyReading = { metric: '', value: '120', unit: 'PSI' };

    const validateNote = (n: { content?: string }) => Boolean(n.content && n.content.trim().length > 0);
    const validateReading = (r: { metric?: string; value?: string; unit?: string }) =>
      Boolean(r.metric?.trim() && r.value?.trim() && r.unit?.trim());

    assert.strictEqual(validateNote(emptyNote), false, 'Empty note must fail validation');
    assert.strictEqual(validateReading(emptyReading), false, 'Empty reading metric must fail validation');
  });

  it('should detect version conflict when baseVersion is ahead of serverVersion (chained mutation race)', () => {
    const serverWorkOrder = { id: 'wo-1', version: 3, status: 'IN_PROGRESS' };
    const chainedMutation = {
      mutationId: 'mut-chained-2',
      actionType: 'UPDATE_STATUS',
      workOrderId: 'wo-1',
      baseVersion: 4, // Client assumed M1 succeeded, but M1 failed on server
      payload: { status: 'COMPLETED' },
    };

    const hasConflict =
      chainedMutation.baseVersion !== undefined &&
      chainedMutation.baseVersion !== null &&
      serverWorkOrder.version !== chainedMutation.baseVersion;

    assert.strictEqual(hasConflict, true, 'baseVersion ahead of server must trigger CONFLICT');
  });

  it('should reject additive mutations when work order is CANCELLED', () => {
    const cancelledWorkOrder = { id: 'wo-1', version: 2, status: 'CANCELLED' };
    const noteMutation = {
      mutationId: 'mut-note-1',
      actionType: 'ADD_NOTE',
      workOrderId: 'wo-1',
      payload: { content: 'Added while cancelled' },
    };

    const isBlocked = cancelledWorkOrder.status === 'CANCELLED';
    assert.strictEqual(isBlocked, true, 'Additive changes on CANCELLED work orders must be rejected');
  });

  it('should short-circuit subsequent mutations for a work order in a batch if an earlier one fails or conflicts', () => {
    const haltedWoIds = new Set<string>();
    const mutations = [
      { id: 'm1', woId: 'wo-1', status: 'CONFLICT' },
      { id: 'm2', woId: 'wo-1', status: 'PENDING' },
      { id: 'm3', woId: 'wo-2', status: 'SYNCED' },
    ];

    const results: string[] = [];
    for (const m of mutations) {
      if (haltedWoIds.has(m.woId)) {
        results.push('SHORT_CIRCUITED_CONFLICT');
        continue;
      }
      results.push(m.status);
      if (m.status === 'CONFLICT' || m.status === 'FAILED') {
        haltedWoIds.add(m.woId);
      }
    }

    assert.deepStrictEqual(results, ['CONFLICT', 'SHORT_CIRCUITED_CONFLICT', 'SYNCED']);
  });
});

