# MediChain PREDICT Enhanced Integration

## 🎯 Overview

This enhanced integration combines the **local_backend** data with the **PREDICT** system to provide comprehensive pharmaceutical inventory predictions and restock recommendations using both MongoDB and local_backend data sources.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MongoDB       │    │  local_backend  │    │  Enhanced       │
│   (entries,     │    │  (FastAPI)      │    │  PREDICT        │
│    bottles)     │    │  (retailers,    │    │  (Flask)        │
│                 │    │   products,      │    │                 │
│                 │    │   inventory)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Enhanced       │
                    │  Predictor      │
                    │  (Combines      │
                    │   both data     │
                    │   sources)      │
                    └─────────────────┘
```

## 🚀 Quick Start

### 1. Start Full Integration
```bash
cd PREDICT
python start_full_integration.py
```

This will:
- ✅ Start local_backend on port 8000
- ✅ Start enhanced PREDICT on port 5000
- ✅ Test the integration
- ✅ Display dashboard URLs

### 2. Manual Start (Alternative)

#### Start local_backend:
```bash
cd local_backend
python src/main.py
```

#### Start Enhanced PREDICT:
```bash
cd PREDICT/web
python enhanced_web_app.py
```

### 3. Test Integration
```bash
cd PREDICT
python test_enhanced_integration.py
```

## 📊 Data Sources

### MongoDB Data
- **Collections**: `entries`, `bottles`
- **Retailers**: From `entries` collection with `type: "retailer"`
- **Inventory**: From `bottles` collection linked by `certificate`
- **Products**: From bottle `details` field

### Local Backend Data
- **API**: FastAPI running on port 8000
- **Retailers**: `/retailers/` endpoint
- **Inventory**: `/retailers/{wallet}/inventory` endpoint
- **Products**: `/products/` endpoint

### Combined Data
- **Enhanced Predictor**: Merges both data sources
- **Deduplication**: Avoids duplicate retailers by wallet address
- **Inventory Merging**: Combines quantities from both sources
- **Enhanced Predictions**: Uses combined data for better accuracy

## 🔌 API Endpoints

### Enhanced Health Check
```
GET /api/health
```
Returns status of MongoDB, local_backend, and enhanced predictor.

### Combined Retailers
```
GET /api/retailers
```
Returns retailers from both MongoDB and local_backend sources.

### System Status
```
GET /api/system-status
```
Detailed system status and connection information.

### Data Sources Info
```
GET /api/data-sources
```
Information about data sources and retailer counts.

### Enhanced Recommendations
```
GET /api/recommendations
```
Restock recommendations using combined data sources.

### Individual Retailer
```
GET /api/retailer/{wallet_address}/inventory
GET /api/retailer/{wallet_address}/recommendations
GET /api/retailer/{wallet_address}/alerts
```

## 🎯 Key Features

### ✅ Enhanced Data Integration
- **Dual Data Sources**: MongoDB + local_backend
- **Smart Merging**: Combines retailers and inventory
- **Deduplication**: Prevents duplicate entries
- **Fallback Support**: Works if one source is unavailable

### ✅ Enhanced Predictions
- **Combined Inventory**: Uses data from both sources
- **Improved Accuracy**: More comprehensive data leads to better predictions
- **Data Source Tracking**: Tracks which source provided each recommendation
- **Enhanced Reasoning**: More detailed prediction explanations

### ✅ System Monitoring
- **Health Checks**: Monitors both data sources
- **Connection Status**: Real-time status of all components
- **Error Handling**: Graceful degradation if services are unavailable
- **Performance Metrics**: Tracks data source performance

## 📈 Enhanced Dashboard

The dashboard now shows:
- **Combined Retailer Data**: From both MongoDB and local_backend
- **Enhanced Recommendations**: Using merged inventory data
- **Data Source Indicators**: Shows which source provided each data point
- **System Status**: Real-time health of all components

## 🔧 Configuration

### Enhanced Predictor Configuration
```python
# In enhanced_predictor.py
class EnhancedPredictor:
    def __init__(self, 
                 mongo_uri: str = "mongodb://localhost:27017",
                 db_name: str = "medichain",
                 local_backend_url: str = "http://localhost:8000"):
```

### Environment Variables
```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=medichain

# Local Backend
LOCAL_BACKEND_URL=http://localhost:8000

# Enhanced PREDICT
PREDICT_PORT=5000
```

## 🧪 Testing

### Run Full Integration Test
```bash
python test_enhanced_integration.py
```

### Test Individual Components
```bash
# Test local_backend
curl http://localhost:8000/retailers/

# Test enhanced PREDICT
curl http://localhost:5000/api/health
curl http://localhost:5000/api/retailers
curl http://localhost:5000/api/recommendations
```

## 📊 Sample Output

### Health Check Response
```json
{
  "mongodb": "connected",
  "local_backend": "connected", 
  "enhanced_predictor": "initialized",
  "timestamp": "2025-08-04T12:00:00.000000"
}
```

### Combined Retailers Response
```json
{
  "retailers": [
    {
      "walletAddress": "0xCERT41151234567890abcdef12345678",
      "name": "Retailer 0xCERT41",
      "location": "Location cert",
      "certificate": "cert41151",
      "type": "retailer",
      "data_source": "mongodb"
    },
    {
      "walletAddress": "0xLOCAL1234567890abcdef1234567890",
      "name": "Local Pharmacy",
      "address": "123 Main St",
      "licenceNo": "PHAR123",
      "data_source": "local_backend"
    }
  ],
  "count": 2,
  "timestamp": "2025-08-04T12:00:00.000000"
}
```

### Enhanced Recommendation Response
```json
{
  "retailer_wallet": "0xCERT41151234567890abcdef12345678",
  "product_name": "Aspirin 500mg",
  "current_stock": 15,
  "recommended_quantity": 35,
  "urgency_level": "medium",
  "days_until_depletion": 5.2,
  "reasoning": "MEDIUM: Stock will deplete within 5.2 days; Enhanced prediction using combined data sources",
  "timestamp": "2025-08-04T12:00:00.000000",
  "data_source": "enhanced_integrated"
}
```

## 🚨 Troubleshooting

### Local Backend Not Starting
```bash
# Check if port 8000 is available
netstat -an | grep 8000

# Check local_backend dependencies
cd local_backend
pip install -r requirements.txt
```

### Enhanced PREDICT Not Starting
```bash
# Check if port 5000 is available
netstat -an | grep 5000

# Check PREDICT dependencies
cd PREDICT
pip install -r requirements_integrated.txt
```

### MongoDB Connection Issues
```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"

# Check if medichain database exists
mongosh medichain --eval "db.getCollectionNames()"
```

## 📝 Development

### Adding New Data Sources
1. Extend `EnhancedPredictor` class
2. Add new data source methods
3. Update `get_all_retailers()` method
4. Update `get_combined_inventory()` method
5. Test with new data source

### Customizing Predictions
1. Modify `predict_demand()` method
2. Add new prediction factors
3. Update urgency calculation logic
4. Test with enhanced predictions

## 🎉 Benefits

### ✅ **Comprehensive Data**
- Uses both MongoDB and local_backend data
- No data loss from either source
- Enhanced accuracy through data combination

### ✅ **Robust System**
- Graceful degradation if one source fails
- Real-time health monitoring
- Comprehensive error handling

### ✅ **Enhanced Predictions**
- More accurate inventory predictions
- Better restock recommendations
- Improved urgency calculations

### ✅ **Easy Integration**
- Simple startup script
- Comprehensive testing
- Clear documentation

## 🔗 Integration Points

### With Existing MediChain Components
- **MongoDB**: Uses existing entries and bottles collections
- **local_backend**: Integrates with FastAPI endpoints
- **PREDICT**: Enhanced with combined data sources
- **Dashboard**: Shows enhanced recommendations

### Future Extensions
- **Blockchain Integration**: Add blockchain data sources
- **External APIs**: Integrate with external pharmacy systems
- **Machine Learning**: Enhanced ML models with more data
- **Real-time Updates**: WebSocket connections for live updates

---

**🎯 The enhanced integration provides a complete MediChain PREDICT system that leverages all available data sources for maximum prediction accuracy and system reliability.** 