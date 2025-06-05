# Data Ingestion API System

This is a RESTful API system that handles data ingestion requests with priority-based processing and rate limiting.

## Features

- Asynchronous data processing in batches
- Priority-based queue system (HIGH, MEDIUM, LOW)
- Rate limiting (3 IDs per 5 seconds)
- Status tracking for ingestion requests
- Batch processing with status updates

## Technical Stack

- Node.js
- Express.js
- In-memory data storage
- Jest & Supertest for testing

## API Endpoints

### 1. Ingestion API
- **Endpoint**: POST /ingest
- **Input**: JSON payload with IDs and priority
```json
{
  "ids": [1, 2, 3, 4, 5],
  "priority": "HIGH"
}
```
- **Output**: Ingestion ID
```json
{
  "ingestion_id": "abc123"
}
```

### 2. Status API
- **Endpoint**: GET /status/:ingestion_id
- **Output**: Status of ingestion request
```json
{
  "ingestion_id": "abc123",
  "status": "triggered",
  "batches": [
    {
      "batch_id": "uuid1",
      "ids": [1, 2, 3],
      "status": "completed"
    },
    {
      "batch_id": "uuid2",
      "ids": [4, 5],
      "status": "triggered"
    }
  ]
}
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Start the server:
```bash
npm start
```
4. Run tests:
```bash
npm test
```

## Rate Limiting and Priority Rules

- Maximum 3 IDs processed at once
- One batch per 5 seconds
- Higher priority requests are processed before lower priority ones
- Processing order is based on (priority, created_time)

## Testing

The application includes comprehensive tests that verify:
- API endpoints functionality
- Rate limiting behavior
- Priority-based processing
- Batch processing logic
- Status tracking accuracy

Run the tests using:
```bash
npm test
``` 