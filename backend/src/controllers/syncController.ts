import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { processBatchMutations, type BatchMutation, type SyncActor } from '../helpers/syncQueries';

export { type BatchMutation };

export const batchSync = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { mutations } = req.body as { mutations: BatchMutation[] };

  if (!req.user?.id) {
    res.status(401).json({ message: 'Unauthorized: no authenticated actor' });
    return;
  }

  if (!Array.isArray(mutations) || mutations.length === 0) {
    res.status(400).json({ message: 'No mutations provided for synchronization' });
    return;
  }
  
  const actor: SyncActor = { id: req.user.id, role: req.user.role };

  const results = await processBatchMutations(mutations, actor);

  res.status(200).json({
    success: true,
    processed: results.length,
    results,
  });
};
