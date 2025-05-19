// src/pipelines/snapshotWrappedPipeline.js
import { compose } from '../shared/utils/compose.js';
import { requestContext } from '../shared/middlewares/requestContext.js';
import { createSnapshotManager } from '../shared/utils/snapshotManager.js';

export const createSnapshotWrappedPipeline = (innerPipeline) => {
  const snapshotManager = createSnapshotManager();

  return compose(
    requestContext,
    async (ctx) => {
      const snapshot = await snapshotManager.createSnapshot(ctx);
      const result = await innerPipeline(ctx);
      
      if (result.isErr) {
        await snapshotManager.rollback(snapshot.id);
      } else {
        await snapshotManager.commit(snapshot.id);
      }

      return result;
    }
  );
};
