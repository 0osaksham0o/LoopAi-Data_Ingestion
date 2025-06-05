import express from 'express';
import { processingService } from '../services/processingService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { ids, priority = 'MEDIUM' } = req.body;

    // Validate input
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Invalid or missing ids array' });
    }

    if (!['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority level' });
    }

    // Validate ID range
    const MAX_ID = Math.pow(10, 9) + 7;
    if (ids.some(id => !Number.isInteger(id) || id < 1 || id > MAX_ID)) {
      return res.status(400).json({ 
        error: `All IDs must be integers between 1 and ${MAX_ID}` 
      });
    }

    // Create ingestion request
    const ingestionId = processingService.createIngestionRequest(ids, priority);

    res.status(201).json({ ingestion_id: ingestionId });
  } catch (error) {
    console.error('Error in ingest route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const ingestRouter = router; 