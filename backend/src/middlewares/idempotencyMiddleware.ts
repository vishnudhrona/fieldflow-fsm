import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { claimSyncOperation, completeSyncOperation, releaseSyncOperation, stableHash } from '../helpers/syncOperationQueries';

export const idempotencyMiddleware = (options?: { required?: boolean }) => {
  const required = options?.required ?? false;

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const key = req.header('X-Idempotency-Key');

    if (!key) {
      if (required) {
        return res.status(400).json({ message: 'X-Idempotency-Key header is required' });
      }
      return next();
    }

    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized: idempotency requires an authenticated actor' });
    }

    const requestHash = stableHash({
      method: req.method,
      url: req.originalUrl,
      body: req.body,
    });

    let claim: Awaited<ReturnType<typeof claimSyncOperation>>;
    try {
      claim = await claimSyncOperation({
        actorId: req.user.id,
        mutationId: `http:${key}`,
        operationType: `HTTP ${req.method} ${req.path}`,
        requestHash,
      });
    } catch {
      return res.status(500).json({ message: 'Idempotency check failed' });
    }

    if (claim.type === 'HASH_MISMATCH') {
      return res.status(422).json({
        message: 'Idempotency key was already used with a different request payload',
      });
    }

    if (claim.type === 'IN_PROGRESS') {
      return res.status(409).json({
        message: 'A request with this idempotency key is currently being processed. Retry shortly.',
      });
    }

    if (claim.type === 'REPLAY' && claim.responsePayload) {
      const stored = claim.responsePayload as { httpStatus?: number; body?: unknown };
      return res.status(stored.httpStatus ?? 200).json(stored.body);
    }

    const newClaim = claim as { type: 'NEW'; operationId: string };

    const originalJson = res.json.bind(res);
    res.json = (body?: any) => {
      completeSyncOperation(newClaim.operationId, 'SUCCEEDED', {
        httpStatus: res.statusCode,
        body,
      }).catch(() => releaseSyncOperation(newClaim.operationId));
      return originalJson(body);
    };

    next();
  };
};
