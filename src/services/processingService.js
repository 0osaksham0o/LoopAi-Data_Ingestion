import { v4 as uuidv4 } from 'uuid';

class ProcessingService {
  constructor() {
    this.queue = [];
    this.inProgress = new Set();
    this.ingestionStore = new Map();
    this.isProcessing = false;
    this.BATCH_SIZE = 3;
    this.RATE_LIMIT_MS = 5000;
  }

  // Priority levels and their weights
  static PRIORITY_WEIGHTS = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
  };

  createIngestionRequest(ids, priority) {
    const ingestionId = uuidv4();
    const batches = this.createBatches(ids);
    
    this.ingestionStore.set(ingestionId, {
      ingestionId,
      status: 'yet_to_start',
      priority,
      createdAt: Date.now(),
      batches: batches.map(batchIds => ({
        batchId: uuidv4(),
        ids: batchIds,
        status: 'yet_to_start'
      }))
    });

    // Add batches to processing queue
    batches.forEach((batchIds, index) => {
      this.queue.push({
        ingestionId,
        batchIndex: index,
        priority,
        createdAt: Date.now()
      });
    });

    // Sort queue by priority and creation time
    this.sortQueue();

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return ingestionId;
  }

  getStatus(ingestionId) {
    return this.ingestionStore.get(ingestionId) || null;
  }

  createBatches(ids) {
    const batches = [];
    for (let i = 0; i < ids.length; i += this.BATCH_SIZE) {
      batches.push(ids.slice(i, i + this.BATCH_SIZE));
    }
    return batches;
  }

  sortQueue() {
    this.queue.sort((a, b) => {
      const priorityDiff = ProcessingService.PRIORITY_WEIGHTS[b.priority] - 
                          ProcessingService.PRIORITY_WEIGHTS[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt - b.createdAt;
    });
  }

  async startProcessing() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.shift();
      const ingestion = this.ingestionStore.get(batch.ingestionId);
      
      if (!ingestion) continue;

      // Update batch status to triggered
      ingestion.batches[batch.batchIndex].status = 'triggered';
      this.updateIngestionStatus(batch.ingestionId);

      // Process the batch
      await this.processBatch(batch);

      // Update batch status to completed
      ingestion.batches[batch.batchIndex].status = 'completed';
      this.updateIngestionStatus(batch.ingestionId);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_MS));
    }

    this.isProcessing = false;
  }

  async processBatch(batch) {
    const ingestion = this.ingestionStore.get(batch.ingestionId);
    const batchData = ingestion.batches[batch.batchIndex];

    // Simulate processing each ID in the batch
    const processPromises = batchData.ids.map(async id => {
      await this.simulateExternalApiCall(id);
    });

    await Promise.all(processPromises);
  }

  async simulateExternalApiCall(id) {
    // Simulate external API call with a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { id, data: 'processed' };
  }

  updateIngestionStatus(ingestionId) {
    const ingestion = this.ingestionStore.get(ingestionId);
    if (!ingestion) return;

    const allCompleted = ingestion.batches.every(batch => batch.status === 'completed');
    const anyTriggered = ingestion.batches.some(batch => batch.status === 'triggered');
    const allYetToStart = ingestion.batches.every(batch => batch.status === 'yet_to_start');

    if (allCompleted) {
      ingestion.status = 'completed';
    } else if (anyTriggered) {
      ingestion.status = 'triggered';
    } else if (allYetToStart) {
      ingestion.status = 'yet_to_start';
    }
  }
}

export const processingService = new ProcessingService(); 