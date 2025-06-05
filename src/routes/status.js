import express from 'express';
import { processingService } from '../services/processingService.js';

const router = express.Router();

router.get('/:ingestionId', (req, res) => {
  try {
    const { ingestionId } = req.params;
    const status = processingService.getStatus(ingestionId);

    if (!status) {
      return res.status(404).json({ error: 'Ingestion request not found' });
    }

    res.json({
      ingestion_id: status.ingestionId,
      status: status.status,
      batches: status.batches.map(batch => ({
        batch_id: batch.batchId,
        ids: batch.ids,
        status: batch.status
      }))
    });
  } catch (error) {
    console.error('Error in status route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const statusRouter = router; 