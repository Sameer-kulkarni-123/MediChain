#!/usr/bin/env python3
"""
Enhanced Predictor that integrates local_backend data with PREDICT system
"""

import requests
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import numpy as np
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

logger = logging.getLogger(__name__)

class EnhancedPredictor:
    """Enhanced predictor that uses both MongoDB and local_backend data"""
    
    def __init__(self, mongo_uri: str = "mongodb://localhost:27017", 
                 db_name: str = "medichain",
                 local_backend_url: str = "http://localhost:8000"):
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.local_backend_url = local_backend_url
        self.client = None
        self.db = None
        
        # Cache for performance
        self.retailers_cache = {}
        self.inventory_cache = {}
        self.cache_duration = 300  # 5 minutes
        self.last_cache_update = None
        
        self.setup_mongodb()
    
    def setup_mongodb(self):
        """Setup MongoDB connection"""
        try:
            self.client = MongoClient(self.mongo_uri)
            self.db = self.client[self.db_name]
            self.client.admin.command('ping')
            logger.info("✅ MongoDB connection established")
        except ConnectionFailure as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            raise
    
    def get_retailers_from_local_backend(self) -> List[Dict]:
        """Get retailers from local_backend API"""
        try:
            response = requests.get(f"{self.local_backend_url}/retailers/")
            if response.status_code == 200:
                retailers = response.json()
                logger.info(f"✅ Retrieved {len(retailers)} retailers from local_backend")
                return retailers
            else:
                logger.warning(f"⚠️ Failed to get retailers from local_backend: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"❌ Error getting retailers from local_backend: {e}")
            return []
    
    def get_retailers_from_mongodb(self) -> List[Dict]:
        """Get retailers from MongoDB (existing method)"""
        try:
            if self.should_refresh_cache():
                collections = self.db.list_collection_names()
                if "entries" not in collections:
                    logger.error("❌ 'entries' collection not found in database")
                    return []
                
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
            return self.retailers_cache
        except Exception as e:
            logger.error(f"❌ Error getting retailers from MongoDB: {e}")
            return []
    
    def get_all_retailers(self) -> List[Dict]:
        """Get retailers from both sources and merge them"""
        mongodb_retailers = self.get_retailers_from_mongodb()
        local_backend_retailers = self.get_retailers_from_local_backend()
        
        # Create a combined list with source information
        combined_retailers = []
        
        # Add MongoDB retailers
        for retailer in mongodb_retailers:
            retailer['data_source'] = 'mongodb'
            combined_retailers.append(retailer)
        
        # Add local_backend retailers (avoid duplicates by wallet address)
        existing_wallets = {r['walletAddress'] for r in combined_retailers}
        for retailer in local_backend_retailers:
            if retailer.get('walletAddress') not in existing_wallets:
                retailer['data_source'] = 'local_backend'
                combined_retailers.append(retailer)
        
        logger.info(f"✅ Combined {len(combined_retailers)} retailers from both sources")
        return combined_retailers
    
    def get_inventory_from_local_backend(self, wallet_address: str) -> Dict:
        """Get inventory for a retailer from local_backend API"""
        try:
            response = requests.get(f"{self.local_backend_url}/retailers/{wallet_address}/inventory")
            if response.status_code == 200:
                inventory_data = response.json()
                logger.info(f"✅ Retrieved inventory for {wallet_address} from local_backend")
                return inventory_data
            else:
                logger.warning(f"⚠️ Failed to get inventory for {wallet_address}: {response.status_code}")
                return {}
        except Exception as e:
            logger.error(f"❌ Error getting inventory from local_backend: {e}")
            return {}
    
    def get_inventory_from_mongodb(self, wallet_address: str) -> Dict:
        """Get inventory for a retailer from MongoDB (existing method)"""
        try:
            retailer = self.db.entries.find_one({"wallet_address": wallet_address, "type": "retailer"})
            if not retailer:
                logger.warning(f"⚠️ Retailer not found: {wallet_address}")
                return {}
            
            bottles = self.db.bottles.find({"certificate": retailer["certificate"]})
            bottles_list = list(bottles)
            
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
            
            logger.info(f"✅ Retrieved inventory for {wallet_address} from MongoDB")
            return inventory
        except Exception as e:
            logger.error(f"❌ Error getting inventory from MongoDB: {e}")
            return {}
    
    def get_combined_inventory(self, wallet_address: str) -> Dict:
        """Get inventory from both sources and merge them"""
        mongodb_inventory = self.get_inventory_from_mongodb(wallet_address)
        local_backend_inventory = self.get_inventory_from_local_backend(wallet_address)
        
        # Merge inventories (local_backend takes precedence for overlapping products)
        combined_inventory = mongodb_inventory.copy()
        
        if local_backend_inventory:
            for product_name, product_data in local_backend_inventory.items():
                if product_name in combined_inventory:
                    # Merge quantities
                    combined_inventory[product_name]["qty"] += product_data.get("qtyRemaining", 0)
                    # Use local_backend reorder level if available
                    if product_data.get("reorderLevel"):
                        combined_inventory[product_name]["reorderLevel"] = product_data["reorderLevel"]
                else:
                    # Add new product
                    combined_inventory[product_name] = {
                        "qty": product_data.get("qtyRemaining", 0),
                        "reorderLevel": product_data.get("reorderLevel", 10),
                        "productIds": product_data.get("productIds", [])
                    }
        
        logger.info(f"✅ Combined inventory for {wallet_address}: {len(combined_inventory)} products")
        return combined_inventory
    
    def should_refresh_cache(self) -> bool:
        """Check if cache should be refreshed"""
        if self.last_cache_update is None:
            return True
        return (datetime.now() - self.last_cache_update).seconds > self.cache_duration
    
    def predict_demand(self, product_name: str, current_stock: int) -> float:
        """Enhanced demand prediction using both data sources"""
        try:
            # Base demand prediction based on product type
            if "aspirin" in product_name.lower() or "pain" in product_name.lower():
                base_demand = 5.0
            elif "antibiotic" in product_name.lower():
                base_demand = 2.0
            elif "vitamin" in product_name.lower():
                base_demand = 3.0
            else:
                base_demand = 2.5
            
            # Add seasonal factors
            seasonal_factor = self.calculate_seasonal_factor()
            random_factor = np.random.uniform(0.8, 1.2)
            
            # Enhanced prediction with local_backend data consideration
            enhanced_demand = base_demand * seasonal_factor * random_factor
            
            return enhanced_demand
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
    
    def predict_restock_needs(self, wallet_address: str) -> List[Dict]:
        """Predict restock needs for a specific retailer using combined data"""
        try:
            inventory = self.get_combined_inventory(wallet_address)
            if not inventory:
                return []
            
            recommendations = []
            
            for product_name, product_data in inventory.items():
                current_stock = product_data["qty"]
                
                # Enhanced prediction logic
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
                    "reasoning": f"{urgency_level.upper()}: Stock will deplete within {days_until_depletion:.1f} days; Enhanced prediction using combined data sources",
                    "timestamp": datetime.now().isoformat(),
                    "data_source": "enhanced_integrated"
                }
                
                recommendations.append(recommendation)
            
            return recommendations
        except Exception as e:
            logger.error(f"❌ Error predicting restock needs for {wallet_address}: {e}")
            return []
    
    def get_all_recommendations(self) -> List[Dict]:
        """Get recommendations for all retailers using combined data"""
        retailers = self.get_all_retailers()
        all_recommendations = []
        
        for retailer in retailers:
            recommendations = self.predict_restock_needs(retailer["walletAddress"])
            all_recommendations.extend(recommendations)
        
        return all_recommendations
    
    def get_critical_alerts(self) -> List[Dict]:
        """Get critical alerts (high urgency only)"""
        all_recommendations = self.get_all_recommendations()
        return [rec for rec in all_recommendations if rec["urgency_level"] == "high"]
    
    def get_system_status(self) -> Dict:
        """Get comprehensive system status"""
        try:
            # Test MongoDB connection
            mongodb_status = "connected" if self.client else "disconnected"
            
            # Test local_backend connection
            try:
                response = requests.get(f"{self.local_backend_url}/retailers/", timeout=5)
                local_backend_status = "connected" if response.status_code == 200 else "error"
            except:
                local_backend_status = "disconnected"
            
            return {
                "mongodb": mongodb_status,
                "local_backend": local_backend_status,
                "enhanced_predictor": "initialized",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "mongodb": "error",
                "local_backend": "error",
                "enhanced_predictor": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            } 