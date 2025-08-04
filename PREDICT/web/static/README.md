# PREDICT API - Retailer Wallet Address Fetching & Predictions

This directory contains the PREDICT API system that integrates with MongoDB to fetch retailer wallet addresses and generate restock predictions.

## Files Overview

### Core API Files
- **`predict_api.js`** - Main API functions for fetching retailers and making predictions
- **`api_local.js`** - Original API file (for reference)
- **`demo.html`** - Interactive demo page to test the API
- **`usage_example.js`** - Usage examples and workflows
- **`README.md`** - This documentation

## Quick Start

### 1. Start the PREDICT Web Server
```bash
cd PREDICT/web
python web_app.py
```

The server will run on `http://localhost:5000`

### 2. Test the API
Open `demo.html` in your browser to interactively test all API functions.

### 3. Use the API in Your Code

```javascript
import predictAPI from './predict_api.js';

// Get all retailers with wallet addresses
const retailers = await predictAPI.getRetailersWithWallets();

// Get predictions for a specific retailer
const analysis = await predictAPI.getDetailedPredictionAnalysis(walletAddress);

// Get all predictions
const allPredictions = await predictAPI.getPredictionsForAllRetailers();
```

## API Functions

### Health & System Functions
- `checkSystemHealth()` - Check MongoDB connection and system status
- `getSystemStatus()` - Get detailed system information

### Retailer Functions
- `getAllRetailers()` - Get all retailers from MongoDB
- `getRetailerByWallet(walletAddress)` - Get specific retailer by wallet address
- `getRetailerInventory(walletAddress)` - Get inventory for a specific retailer
- `getRetailersWithWallets()` - Get all retailers with their wallet addresses

### Prediction Functions
- `getRetailerRecommendations(walletAddress)` - Get restock recommendations for a retailer
- `getRetailerAlerts(walletAddress)` - Get critical alerts for a retailer
- `getAllRecommendations()` - Get all recommendations across all retailers
- `getAllAlerts()` - Get all critical alerts across all retailers
- `getPredictionsForAllRetailers()` - Get predictions for all retailers
- `getDetailedPredictionAnalysis(walletAddress)` - Get comprehensive analysis for a retailer

### Utility Functions
- `needsImmediateRestock(walletAddress)` - Check if retailer needs immediate restock
- `getPredictionSummary()` - Get summary statistics for all retailers
- `processBatchPredictions(walletAddresses)` - Process predictions for multiple retailers

## Usage Examples

### Example 1: Get All Retailers
```javascript
import predictAPI from './predict_api.js';

const retailers = await predictAPI.getRetailersWithWallets();
console.log(`Found ${retailers.length} retailers`);

retailers.forEach(retailer => {
    console.log(`Wallet: ${retailer.walletAddress}`);
    console.log(`Name: ${retailer.name}`);
    console.log(`Location: ${retailer.location}`);
});
```

### Example 2: Get Predictions for a Specific Retailer
```javascript
const walletAddress = "0x1234567890abcdef1234567890abcdef12345678";
const analysis = await predictAPI.getDetailedPredictionAnalysis(walletAddress);

console.log(`Retailer: ${analysis.retailer.name}`);
console.log(`Total Products: ${analysis.totalProducts}`);
console.log(`Recommendations: ${analysis.totalRecommendations}`);
console.log(`Critical Alerts: ${analysis.criticalAlerts}`);

// Show recommendations
analysis.recommendations.forEach(rec => {
    console.log(`${rec.product_name}: ${rec.current_stock} → ${rec.recommended_quantity} (${rec.urgency_level})`);
});
```

### Example 3: Check for Urgent Restock Needs
```javascript
const walletAddress = "0x1234567890abcdef1234567890abcdef12345678";
const needsRestock = await predictAPI.needsImmediateRestock(walletAddress);

if (needsRestock) {
    console.log("🚨 URGENT: This retailer needs immediate restock!");
    const alerts = await predictAPI.getRetailerAlerts(walletAddress);
    console.log("Critical alerts:", alerts.data.alerts);
} else {
    console.log("✅ This retailer has adequate stock levels");
}
```

### Example 4: Get Summary Statistics
```javascript
const summary = await predictAPI.getPredictionSummary();

console.log(`Total Retailers: ${summary.totalRetailers}`);
console.log(`Total Recommendations: ${summary.totalRecommendations}`);
console.log(`Critical Alerts: ${summary.criticalAlerts}`);
console.log(`Average Recommendations per Retailer: ${summary.averageRecommendationsPerRetailer}`);
console.log(`Retailers with Alerts: ${summary.retailersWithAlerts}`);
```

### Example 5: Process Batch Predictions
```javascript
const walletAddresses = [
    "0x1234567890abcdef1234567890abcdef12345678",
    "0xabcdef1234567890abcdef1234567890abcdef12"
];

const results = await predictAPI.processBatchPredictions(walletAddresses);

console.log(`Processed: ${results.totalProcessed}`);
console.log(`Successful: ${results.successful}`);
console.log(`Failed: ${results.failed}`);

Object.entries(results.results).forEach(([wallet, result]) => {
    if (result.error) {
        console.log(`❌ ${wallet}: ${result.error}`);
    } else {
        console.log(`✅ ${wallet}: ${result.totalRecommendations} recommendations`);
    }
});
```

## Complete Workflow Example

```javascript
import { example7_completeWorkflow } from './usage_example.js';

// Run the complete workflow
const results = await example7_completeWorkflow();

console.log("Workflow Results:", {
    totalRetailers: results.retailers.length,
    urgentRetailers: results.urgentRetailers.length,
    totalRecommendations: results.summary.totalRecommendations,
    criticalAlerts: results.summary.criticalAlerts
});
```

## API Endpoints

The PREDICT API provides the following REST endpoints:

### Health & System
- `GET /api/health` - Check system health
- `GET /api/retailers` - Get all retailers

### Retailer-Specific
- `GET /api/retailer/{walletAddress}` - Get retailer details
- `GET /api/retailer/{walletAddress}/inventory` - Get retailer inventory
- `GET /api/retailer/{walletAddress}/recommendations` - Get retailer recommendations
- `GET /api/retailer/{walletAddress}/alerts` - Get retailer alerts

### Global Predictions
- `GET /api/recommendations` - Get all recommendations
- `GET /api/alerts` - Get all critical alerts
- `POST /api/generate-report` - Generate comprehensive report

## Data Structure

### Retailer Object
```javascript
{
    walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
    name: "Retailer 12345678",
    location: "New York, NY",
    certificate: "retailer_cert_001",
    type: "retailer"
}
```

### Recommendation Object
```javascript
{
    retailer_wallet: "0x1234567890abcdef1234567890abcdef12345678",
    product_name: "Aspirin 500mg",
    current_stock: 5,
    recommended_quantity: 20,
    urgency_level: "high", // "high", "medium", "low"
    days_until_depletion: 2.5,
    reasoning: "HIGH: Stock will deplete within 2.5 days; Based on ML model prediction",
    timestamp: "2024-01-15T10:30:00.000Z",
    data_source: "mongodb_integrated"
}
```

### Analysis Object
```javascript
{
    retailer: { /* retailer object */ },
    inventory: { /* inventory object */ },
    recommendations: [ /* array of recommendation objects */ ],
    alerts: [ /* array of high urgency recommendations */ ],
    urgencyBreakdown: {
        high: 2,
        medium: 1,
        low: 3
    },
    totalProducts: 6,
    totalRecommendations: 6,
    criticalAlerts: 2,
    timestamp: "2024-01-15T10:30:00.000Z"
}
```

## Error Handling

All API functions include proper error handling:

```javascript
try {
    const retailers = await predictAPI.getRetailersWithWallets();
    console.log("Success:", retailers);
} catch (error) {
    console.error("Error:", error.message);
    // Handle error appropriately
}
```

## Testing

### Interactive Demo
1. Start the web server: `python web_app.py`
2. Open `demo.html` in your browser
3. Use the interactive buttons to test all API functions

### Programmatic Testing
```javascript
import { example1_getAllRetailers, example7_completeWorkflow } from './usage_example.js';

// Test individual functions
const retailers = await example1_getAllRetailers();

// Test complete workflow
const results = await example7_completeWorkflow();
```

## Troubleshooting

### Common Issues

1. **Server not running**
   - Error: "Cannot connect to server"
   - Solution: Start the web server with `python web_app.py`

2. **No retailers found**
   - Error: "Found 0 retailers"
   - Solution: Run the database fix script: `python fix_database.py`

3. **MongoDB connection issues**
   - Error: "MongoDB connection failed"
   - Solution: Ensure MongoDB is running: `mongod`

4. **No recommendations generated**
   - Error: "No recommendations found"
   - Solution: Check if retailers have inventory in the database

### Debug Tools

- `debug_mongodb.py` - Debug MongoDB connection and data
- `fix_database.py` - Fix database issues and add sample data
- `quick_test.py` - Quick API testing

## Integration with Existing Systems

The PREDICT API can be integrated with existing systems by:

1. **Importing the API functions**
   ```javascript
   import predictAPI from './predict_api.js';
   ```

2. **Using the retailer wallet addresses**
   ```javascript
   const retailers = await predictAPI.getRetailersWithWallets();
   const walletAddresses = retailers.map(r => r.walletAddress);
   ```

3. **Making predictions for specific retailers**
   ```javascript
   for (const walletAddress of walletAddresses) {
       const analysis = await predictAPI.getDetailedPredictionAnalysis(walletAddress);
       // Process the analysis results
   }
   ```

4. **Monitoring for urgent cases**
   ```javascript
   const urgentRetailers = [];
   for (const retailer of retailers) {
       const needsRestock = await predictAPI.needsImmediateRestock(retailer.walletAddress);
       if (needsRestock) {
           urgentRetailers.push(retailer);
       }
   }
   ```

This API provides a complete solution for fetching retailer wallet addresses from MongoDB and generating intelligent restock predictions based on inventory data. 