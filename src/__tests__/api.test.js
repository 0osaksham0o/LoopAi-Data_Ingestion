import request from 'supertest';
import app from '../index.js';
import { processingService } from '../services/processingService.js';

describe('Data Ingestion API', () => {
  beforeEach(() => {
    // Reset the processing service state
    processingService.queue = [];
    processingService.ingestionStore.clear();
    processingService.isProcessing = false;
  });

  describe('POST /ingest', () => {
    it('should create an ingestion request successfully', async () => {
      const response = await request(app)
        .post('/ingest')
        .send({
          ids: [1, 2, 3],
          priority: 'HIGH'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('ingestion_id');
    });

    it('should validate ID range', async () => {
      const response = await request(app)
        .post('/ingest')
        .send({
          ids: [0, 1, Math.pow(10, 9) + 8],
          priority: 'HIGH'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate priority levels', async () => {
      const response = await request(app)
        .post('/ingest')
        .send({
          ids: [1, 2, 3],
          priority: 'INVALID'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /status/:ingestionId', () => {
    it('should return 404 for non-existent ingestion ID', async () => {
      const response = await request(app)
        .get('/status/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return correct status for existing ingestion', async () => {
      // Create an ingestion request first
      const ingestResponse = await request(app)
        .post('/ingest')
        .send({
          ids: [1, 2, 3],
          priority: 'HIGH'
        });

      const { ingestion_id } = ingestResponse.body;

      const statusResponse = await request(app)
        .get(`/status/${ingestion_id}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body).toHaveProperty('ingestion_id', ingestion_id);
      expect(statusResponse.body).toHaveProperty('status');
      expect(statusResponse.body).toHaveProperty('batches');
      expect(Array.isArray(statusResponse.body.batches)).toBe(true);
    });
  });

  describe('Priority and Rate Limiting', () => {
    it('should process high priority requests before low priority ones', async () => {
      // Create a low priority request
      const lowPriorityResponse = await request(app)
        .post('/ingest')
        .send({
          ids: [1, 2, 3],
          priority: 'LOW'
        });

      // Create a high priority request
      const highPriorityResponse = await request(app)
        .post('/ingest')
        .send({
          ids: [4, 5, 6],
          priority: 'HIGH'
        });

      // Wait for some processing to occur
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check status of both requests
      const lowPriorityStatus = await request(app)
        .get(`/status/${lowPriorityResponse.body.ingestion_id}`);
      const highPriorityStatus = await request(app)
        .get(`/status/${highPriorityResponse.body.ingestion_id}`);

      // High priority should be processed first
      expect(highPriorityStatus.body.status).toBe('triggered');
    });

    it('should respect batch size limit of 3', async () => {
      const response = await request(app)
        .post('/ingest')
        .send({
          ids: [1, 2, 3, 4, 5],
          priority: 'HIGH'
        });

      const status = await request(app)
        .get(`/status/${response.body.ingestion_id}`);

      // First batch should have exactly 3 IDs
      expect(status.body.batches[0].ids.length).toBe(3);
      // Second batch should have the remaining 2 IDs
      expect(status.body.batches[1].ids.length).toBe(2);
    });

    it('should respect rate limit of 1 batch per 5 seconds', async () => {
      const response = await request(app)
        .post('/ingest')
        .send({
          ids: [1, 2, 3, 4, 5, 6],
          priority: 'HIGH'
        });

      // Wait for less than the rate limit
      await new Promise(resolve => setTimeout(resolve, 3000));

      const status = await request(app)
        .get(`/status/${response.body.ingestion_id}`);

      // Only the first batch should be completed or in progress
      const completedOrTriggered = status.body.batches.filter(
        batch => ['completed', 'triggered'].includes(batch.status)
      );
      expect(completedOrTriggered.length).toBeLessThanOrEqual(1);
    });
  });
}); 