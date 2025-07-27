# MediChain BackendDB

This is a simple Node.js + Express + MongoDB backend for the MediChain project.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in this directory with:
   ```
   MONGODB_URI=mongodb://localhost:27017/medichain
   PORT=5000
   ```
   (Change `MONGODB_URI` if using MongoDB Atlas or a different host)

3. Start the server:
   ```
   npm run dev
   ```
   or
   ```
   npm start
   ```

## API Endpoints

- `GET /api/entries` - Get all entries
- `GET /api/entries/:id` - Get entry by ID
- `POST /api/entries` - Create new entry
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry
- `GET /api/entries/type/:type` - Get entries by type
- `GET /api/health` - Health check

## Entry Model
- `type`: Category (manufacturer, distributor, retailer, pharmacy, hospital, patient)
- `wallet_address`: Unique wallet address
- `location`: Location information
- `certificate`: Certificate data
- `createdAt`, `updatedAt`: Timestamps 