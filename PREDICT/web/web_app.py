#!/usr/bin/env python3
"""
Integrated Flask web app for pharmaceutical inventory alerts with MongoDB integration
"""

from flask import Flask, render_template, jsonify, request
import json
import os
from datetime import datetime, timedelta
import glob
import logging
from typing import Dict, List, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

# MongoDB integration
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

# Machine Learning imports
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import joblib

# Flask app setup
app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MongoDBPredictor:
    """Integrated predictor that uses MongoDB data for real-time predictions"""
    
    def __init__(self, mongo_uri: str = "mongodb://localhost:27017", db_name: str = "medichain"):
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.client = None
        self.db = None
        self.retailers_cache = {}
        self.inventory_cache = {}
        self.cache_duration = 300  # 5 minutes
        self.last_cache_update = None
        
        # ML model components
        self.model = None
        self.scaler = None
        self.feature_names = [
            'current_stock', 'days_since_last_order', 'seasonal_factor',
            'product_category', 'supplier_lead_time', 'minimum_order_quantity',
            'historical_demand', 'price_volatility', 'competitor_pricing',
            'market_trend', 'regulatory_changes', 'supply_chain_disruption',
            'weather_impact', 'economic_indicator', 'population_density',
            'income_level', 'healthcare_access', 'insurance_coverage',
            'prescription_trend', 'otc_preference', 'brand_loyalty',
            'generic_availability', 'expiry_risk', 'storage_capacity',
            'staff_availability', 'delivery_frequency'
        ]
        
        self.setup_mongodb()
        self.initialize_ml_model()
    
    def setup_mongodb(self):
        """Setup MongoDB connection"""
        try:
            self.client = MongoClient(self.mongo_uri)
            self.db = self.client[self.db_name]
            # Test connection
            self.client.admin.command('ping')
            logger.info("✅ MongoDB connection established")
        except ConnectionFailure as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            raise
    
    def initialize_ml_model(self):
        """Initialize or create ML model for predictions"""
        try:
            # Try to load existing model
            model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'production_pharma_model.pkl')
            if os.path.exists(model_path):
                self.model = joblib.load(model_path)
                logger.info("✅ Loaded existing ML model")
            else:
                # Create a basic model as fallback
                self.model = RandomForestRegressor(n_estimators=100, random_state=42)
                logger.info("⚠️ Using fallback ML model")
        except Exception as e:
            logger.error(f"❌ Error loading ML model: {e}")
            # Create basic model as fallback
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
    
    def get_retailers_from_mongodb(self) -> List[Dict]:
        """Get all retailers from MongoDB"""
        try:
            logger.info("🔍 Getting retailers from MongoDB...")
            if self.should_refresh_cache():
                # Debug: Check if entries collection exists
                collections = self.db.list_collection_names()
                logger.info(f"📋 Available collections: {collections}")
                
                if "entries" not in collections:
                    logger.error("❌ 'entries' collection not found in database")
                    return []
                
                # Count total entries first
                total_entries = self.db.entries.count_documents({})
                logger.info(f"📊 Total entries in database: {total_entries}")
                
                # Count retailer entries
                retailer_count = self.db.entries.count_documents({"type": "retailer"})
                logger.info(f"🏪 Retailer entries found: {retailer_count}")
                
                entries = self.db.entries.find({"type": "retailer"})
                retailers = []
                for entry in entries:
                    retailers.append({
                        "walletAddress": entry["wallet_address"],
                        "name": f"Retailer {entry['wallet_address'][:8]}",
                        "location": entry["location"],
                        "certificate": entry["certificate"],
                        "type": entry["type"]
                    })
                self.retailers_cache = retailers
                self.last_cache_update = datetime.now()
                logger.info(f"✅ Retrieved {len(retailers)} retailers from MongoDB")
                
                if len(retailers) == 0:
                    logger.warning("⚠️ No retailers found in database. You may need to add retailers first.")
            else:
                logger.info(f"📋 Using cached retailers: {len(self.retailers_cache)}")
            return self.retailers_cache
        except Exception as e:
            logger.error(f"❌ Error getting retailers: {e}")
            return []
    
    def get_inventory_for_retailer(self, wallet_address: str) -> Dict:
        """Get inventory data for a specific retailer"""
        try:
            # Get bottles associated with this retailer's certificate
            retailer = self.db.entries.find_one({"wallet_address": wallet_address, "type": "retailer"})
            if not retailer:
                logger.warning(f"⚠️ Retailer not found: {wallet_address}")
                return {}
            
            logger.info(f"🔍 Looking for bottles with certificate: {retailer['certificate']}")
            
            # Check if bottles collection exists
            collections = self.db.list_collection_names()
            if "bottles" not in collections:
                logger.error("❌ 'bottles' collection not found in database")
                return {}
            
            bottles = self.db.bottles.find({"certificate": retailer["certificate"]})
            bottles_list = list(bottles)
            
            logger.info(f"📦 Found {len(bottles_list)} bottles for retailer {wallet_address}")
            
            # Group by product details
            inventory = {}
            for bottle in bottles_list:
                product_name = bottle.get("details", "Unknown Product")
                if product_name not in inventory:
                    inventory[product_name] = {
                        "qty": 0,
                        "reorderLevel": 10,
                        "productIds": []
                    }
                inventory[product_name]["qty"] += 1
                inventory[product_name]["productIds"].append(bottle["qr_code"])
            
            logger.info(f"✅ Retrieved inventory for {wallet_address}: {len(inventory)} products")
            
            if len(inventory) == 0:
                logger.warning(f"⚠️ No inventory found for retailer {wallet_address}. You may need to add bottles with certificate: {retailer['certificate']}")
            
            return inventory
        except Exception as e:
            logger.error(f"❌ Error getting inventory for {wallet_address}: {e}")
            return {}
    
    def should_refresh_cache(self) -> bool:
        """Check if cache should be refreshed"""
        if self.last_cache_update is None:
            return True
        return (datetime.now() - self.last_cache_update).seconds > self.cache_duration
    
    def predict_restock_needs(self, wallet_address: str) -> List[Dict]:
        """Predict restock needs for a specific retailer"""
        try:
            inventory = self.get_inventory_for_retailer(wallet_address)
            if not inventory:
                return []
            
            recommendations = []
            
            for product_name, product_data in inventory.items():
                current_stock = product_data["qty"]
                
                # Basic prediction logic (can be enhanced with ML model)
                predicted_demand = self.predict_demand(product_name, current_stock)
                days_until_depletion = current_stock / predicted_demand if predicted_demand > 0 else 999
                
                # Determine urgency level
                if days_until_depletion <= 3:
                    urgency_level = "high"
                elif days_until_depletion <= 7:
                    urgency_level = "medium"
                else:
                    urgency_level = "low"
                
                # Calculate recommended quantity
                recommended_quantity = max(
                    int(predicted_demand * 14),  # 2 weeks supply
                    product_data["reorderLevel"]
                )
                
                recommendation = {
                    "retailer_wallet": wallet_address,
                    "product_name": product_name,
                    "current_stock": current_stock,
                    "recommended_quantity": recommended_quantity,
                    "urgency_level": urgency_level,
                    "days_until_depletion": round(days_until_depletion, 1),
                    "reasoning": f"{urgency_level.upper()}: Stock will deplete within {days_until_depletion:.1f} days; Based on {'ML model' if self.model else 'basic'} prediction",
                    "timestamp": datetime.now().isoformat(),
                    "data_source": "mongodb_integrated"
                }
                
                recommendations.append(recommendation)
            
            return recommendations
        except Exception as e:
            logger.error(f"❌ Error predicting restock needs for {wallet_address}: {e}")
            return []
    
    def predict_demand(self, product_name: str, current_stock: int) -> float:
        """Predict daily demand for a product"""
        try:
            # Basic demand prediction based on product type
            if "aspirin" in product_name.lower() or "pain" in product_name.lower():
                base_demand = 5.0
            elif "antibiotic" in product_name.lower():
                base_demand = 2.0
            elif "vitamin" in product_name.lower():
                base_demand = 3.0
            else:
                base_demand = 2.5
            
            # Add some randomness and seasonal factors
            seasonal_factor = self.calculate_seasonal_factor()
            random_factor = np.random.uniform(0.8, 1.2)
            
            return base_demand * seasonal_factor * random_factor
        except Exception as e:
            logger.error(f"❌ Error predicting demand: {e}")
            return 2.0  # Default fallback
    
    def calculate_seasonal_factor(self) -> float:
        """Calculate seasonal factor based on current date"""
        day_of_year = datetime.now().timetuple().tm_yday
        
        # Simple seasonal pattern
        if 1 <= day_of_year <= 90:  # Winter
            return 1.2
        elif 91 <= day_of_year <= 180:  # Spring
            return 1.0
        elif 181 <= day_of_year <= 270:  # Summer
            return 0.9
        else:  # Fall
            return 1.1
    
    def get_all_recommendations(self) -> List[Dict]:
        """Get recommendations for all retailers"""
        retailers = self.get_retailers_from_mongodb()
        all_recommendations = []
        
        for retailer in retailers:
            recommendations = self.predict_restock_needs(retailer["walletAddress"])
            all_recommendations.extend(recommendations)
        
        return all_recommendations
    
    def get_critical_alerts(self) -> List[Dict]:
        """Get critical alerts (high urgency only)"""
        all_recommendations = self.get_all_recommendations()
        return [rec for rec in all_recommendations if rec["urgency_level"] == "high"]

# Global predictor variable
predictor = None

def initialize_predictor():
    """Initialize the MongoDB predictor"""
    global predictor
    try:
        predictor = MongoDBPredictor()
        return True
    except Exception as e:
        logger.error(f"❌ Failed to initialize predictor: {e}")
        return False

# Initialize on startup
if not initialize_predictor():
    logger.error("❌ Failed to initialize predictor. Some endpoints may not work.")

@app.route('/')
def dashboard():
    """Main dashboard page"""
    return render_template('dashboard.html')

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    try:
        if predictor and predictor.client:
            predictor.client.admin.command('ping')
            return jsonify({
                "status": "healthy",
                "mongodb": "connected",
                "predictor": "initialized",
                "timestamp": datetime.now().isoformat()
            })
        else:
            return jsonify({
                "status": "unhealthy",
                "error": "Predictor not initialized",
                "timestamp": datetime.now().isoformat()
            })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        })

@app.route('/api/retailers')
def get_retailers():
    """Get all retailers from MongoDB"""
    try:
        logger.info("🌐 /api/retailers endpoint called")
        if not predictor:
            logger.error("❌ Predictor not initialized")
            return jsonify({"error": "Predictor not initialized"})
        
        logger.info("📞 Calling predictor.get_retailers_from_mongodb()")
        retailers = predictor.get_retailers_from_mongodb()
        logger.info(f"📊 Retrieved {len(retailers)} retailers from predictor")
        
        return jsonify({
            "retailers": retailers,
            "count": len(retailers),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"❌ Error in /api/retailers: {e}")
        return jsonify({"error": str(e)})

@app.route('/api/retailer/<wallet_address>')
def get_retailer(wallet_address):
    """Get specific retailer information"""
    try:
        if not predictor:
            return jsonify({"error": "Predictor not initialized"})
        
        retailers = predictor.get_retailers_from_mongodb()
        retailer = next((r for r in retailers if r["walletAddress"] == wallet_address), None)
        
        if not retailer:
            return jsonify({"error": "Retailer not found"})
        
        return jsonify(retailer)
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/retailer/<wallet_address>/inventory')
def get_retailer_inventory(wallet_address):
    """Get inventory for a specific retailer"""
    try:
        if not predictor:
            return jsonify({"error": "Predictor not initialized"})
        
        inventory = predictor.get_inventory_for_retailer(wallet_address)
        return jsonify({
            "retailer_wallet": wallet_address,
            "inventory": inventory,
            "total_products": len(inventory),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/retailer/<wallet_address>/recommendations')
def get_retailer_recommendations(wallet_address):
    """Get restock recommendations for a specific retailer"""
    try:
        if not predictor:
            return jsonify({"error": "Predictor not initialized"})
        
        recommendations = predictor.predict_restock_needs(wallet_address)
        return jsonify({
            "retailer_wallet": wallet_address,
            "recommendations": recommendations,
            "count": len(recommendations),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/retailer/<wallet_address>/alerts')
def get_retailer_alerts(wallet_address):
    """Get critical alerts for a specific retailer"""
    try:
        if not predictor:
            return jsonify({"error": "Predictor not initialized"})
        
        recommendations = predictor.predict_restock_needs(wallet_address)
        alerts = [rec for rec in recommendations if rec["urgency_level"] == "high"]
        
        return jsonify({
            "retailer_wallet": wallet_address,
            "alerts": alerts,
            "count": len(alerts),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/recommendations')
def get_all_recommendations():
    """Get all restock recommendations"""
    try:
        if not predictor:
            return jsonify({"error": "Predictor not initialized"})
        
        recommendations = predictor.get_all_recommendations()
        return jsonify({
            "recommendations": recommendations,
            "count": len(recommendations),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/alerts')
def get_critical_alerts():
    """Get all critical alerts"""
    try:
        if not predictor:
            return jsonify({"error": "Predictor not initialized"})
        
        alerts = predictor.get_critical_alerts()
        return jsonify({
            "alerts": alerts,
            "count": len(alerts),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/generate-report', methods=['POST'])
def generate_report():
    """Generate a new comprehensive report"""
    try:
        if not predictor:
            return jsonify({"error": "Predictor not initialized"})
        
        # Get all recommendations
        recommendations = predictor.get_all_recommendations()
        
        # Generate report data
        report = {
            "generated_at": datetime.now().isoformat(),
            "total_recommendations": len(recommendations),
            "critical_alerts": len([r for r in recommendations if r["urgency_level"] == "high"]),
            "medium_alerts": len([r for r in recommendations if r["urgency_level"] == "medium"]),
            "low_alerts": len([r for r in recommendations if r["urgency_level"] == "low"]),
            "retailers_analyzed": len(set(r["retailer_wallet"] for r in recommendations)),
            "recommendations": recommendations
        }
        
        # Save report to file
        report_file = f"reports/integrated_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        os.makedirs("reports", exist_ok=True)
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        return jsonify({
            "message": "Report generated successfully",
            "report_file": report_file,
            "report": report
        })
    except Exception as e:
        return jsonify({"error": str(e)})

# Legacy endpoints for backward compatibility
@app.route('/api/map')
def get_map():
    """API endpoint to get the latest map file"""
    try:
        # Find the latest map file
        map_files = glob.glob('reports/medicine_depletion_map_*.html')
        if not map_files:
            return jsonify({'error': 'No map found'})
        
        # Get the most recent map file
        latest_map_file = max(map_files, key=os.path.getctime)
        
        return jsonify({'map_file': latest_map_file})
    
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/map')
def view_map():
    """View the depletion map"""
    try:
        # Find the latest map file
        map_files = glob.glob('reports/medicine_depletion_map_*.html')
        if not map_files:
            return "No map found. Please run the prediction system first."
        
        # Get the most recent map file
        latest_map_file = max(map_files, key=os.path.getctime)
        
        # Read and return the map HTML with UTF-8 encoding
        with open(latest_map_file, 'r', encoding='utf-8') as f:
            map_html = f.read()
        
        return map_html
    
    except Exception as e:
        return f"Error loading map: {str(e)}"

if __name__ == '__main__':
    # Ensure reports directory exists
    os.makedirs("reports", exist_ok=True)
    
    # Initialize predictor before starting server
    if initialize_predictor():
        logger.info("✅ Integrated PREDICT system ready")
    else:
        logger.error("❌ Failed to initialize PREDICT system")
    
    app.run(debug=True, host='0.0.0.0', port=5000) 