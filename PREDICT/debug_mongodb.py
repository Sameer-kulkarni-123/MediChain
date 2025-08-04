#!/usr/bin/env python3
"""
Debug script to identify MongoDB integration issues
"""

import pymongo
from datetime import datetime
import json

def debug_mongodb_connection():
    """Debug MongoDB connection and data"""
    print("🔍 Debugging MongoDB Integration")
    print("=" * 50)
    
    try:
        # Connect to MongoDB
        client = pymongo.MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=5000)
        db = client["medichain"]
        
        print("✅ MongoDB connection successful")
        
        # Check if collections exist
        collections = db.list_collection_names()
        print(f"📋 Available collections: {collections}")
        
        # Check entries collection
        if "entries" in collections:
            entries_count = db.entries.count_documents({})
            print(f"📊 Total entries: {entries_count}")
            
            # Check for retailers
            retailers = list(db.entries.find({"type": "retailer"}))
            print(f"🏪 Retailers found: {len(retailers)}")
            
            if retailers:
                print("\n📝 Retailer details:")
                for i, retailer in enumerate(retailers[:3]):  # Show first 3
                    print(f"  {i+1}. Wallet: {retailer.get('wallet_address', 'N/A')}")
                    print(f"     Location: {retailer.get('location', 'N/A')}")
                    print(f"     Certificate: {retailer.get('certificate', 'N/A')}")
                    print()
            else:
                print("❌ No retailers found in database")
                print("💡 You need to add retailers first!")
        else:
            print("❌ 'entries' collection not found")
        
        # Check bottles collection
        if "bottles" in collections:
            bottles_count = db.bottles.count_documents({})
            print(f"💊 Total bottles: {bottles_count}")
            
            if bottles_count > 0:
                # Show sample bottles
                sample_bottles = list(db.bottles.find().limit(3))
                print("\n📦 Sample bottles:")
                for i, bottle in enumerate(sample_bottles):
                    print(f"  {i+1}. QR: {bottle.get('qr_code', 'N/A')[:20]}...")
                    print(f"     Certificate: {bottle.get('certificate', 'N/A')}")
                    print(f"     Details: {bottle.get('details', 'N/A')}")
                    print(f"     Scanned: {bottle.get('scanned', 'N/A')}")
                    print()
        else:
            print("❌ 'bottles' collection not found")
        
        # Test inventory retrieval
        if retailers:
            first_retailer = retailers[0]
            wallet_address = first_retailer["wallet_address"]
            certificate = first_retailer["certificate"]
            
            print(f"\n🧪 Testing inventory for retailer: {wallet_address[:8]}...")
            
            # Find bottles for this retailer
            bottles = list(db.bottles.find({"certificate": certificate}))
            print(f"📦 Bottles found for this retailer: {len(bottles)}")
            
            if bottles:
                # Group by product
                inventory = {}
                for bottle in bottles:
                    product_name = bottle.get("details", "Unknown Product")
                    if product_name not in inventory:
                        inventory[product_name] = 0
                    inventory[product_name] += 1
                
                print("\n📊 Inventory breakdown:")
                for product, count in inventory.items():
                    print(f"  • {product}: {count} units")
            else:
                print("❌ No bottles found for this retailer")
                print("💡 You need to add bottles with matching certificate!")
        
        client.close()
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("\n🔧 Troubleshooting steps:")
        print("1. Make sure MongoDB is running: mongod")
        print("2. Check if the database 'medichain' exists")
        print("3. Verify collections 'entries' and 'bottles' exist")

def add_sample_data():
    """Add sample data to test the system"""
    print("\n📝 Adding sample data...")
    
    try:
        client = pymongo.MongoClient("mongodb://localhost:27017")
        db = client["medichain"]
        
        # Add a sample retailer
        retailer_data = {
            "type": "retailer",
            "wallet_address": "0x1234567890abcdef1234567890abcdef12345678",
            "location": "New York, NY",
            "certificate": "retailer_cert_001"
        }
        
        # Check if retailer already exists
        existing = db.entries.find_one({"wallet_address": retailer_data["wallet_address"]})
        if existing:
            print("✅ Retailer already exists")
        else:
            db.entries.insert_one(retailer_data)
            print("✅ Sample retailer added")
        
        # Add sample bottles
        bottle_data = {
            "qr_code": "sample_qr_001",
            "blockchain_value": "blockchain_hash_001",
            "certificate": "retailer_cert_001",
            "details": "Aspirin 500mg",
            "scanned": False
        }
        
        # Check if bottle already exists
        existing_bottle = db.bottles.find_one({"qr_code": bottle_data["qr_code"]})
        if existing_bottle:
            print("✅ Sample bottle already exists")
        else:
            db.bottles.insert_one(bottle_data)
            print("✅ Sample bottle added")
        
        # Add more bottles for testing
        for i in range(2, 16):  # Add 14 more bottles (total 15)
            bottle_data = {
                "qr_code": f"sample_qr_{i:03d}",
                "blockchain_value": "blockchain_hash_001",
                "certificate": "retailer_cert_001",
                "details": "Aspirin 500mg",
                "scanned": False
            }
            db.bottles.insert_one(bottle_data)
        
        print("✅ Added 15 total bottles for testing")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error adding sample data: {e}")

def test_recommendations():
    """Test the recommendation system"""
    print("\n🧪 Testing recommendation system...")
    
    try:
        import requests
        
        # Test health endpoint
        response = requests.get("http://localhost:5000/api/health")
        if response.status_code == 200:
            print("✅ Health check passed")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return
        
        # Test retailers endpoint
        response = requests.get("http://localhost:5000/api/retailers")
        if response.status_code == 200:
            data = response.json()
            retailers = data.get('retailers', [])
            print(f"✅ Found {len(retailers)} retailers")
            
            if retailers:
                # Test recommendations
                wallet = retailers[0]['walletAddress']
                response = requests.get(f"http://localhost:5000/api/retailer/{wallet}/recommendations")
                if response.status_code == 200:
                    data = response.json()
                    recommendations = data.get('recommendations', [])
                    print(f"✅ Generated {len(recommendations)} recommendations")
                    
                    if recommendations:
                        print("\n📊 Sample recommendation:")
                        rec = recommendations[0]
                        print(f"  Product: {rec['product_name']}")
                        print(f"  Current Stock: {rec['current_stock']}")
                        print(f"  Recommended: {rec['recommended_quantity']}")
                        print(f"  Urgency: {rec['urgency_level']}")
                        print(f"  Days until depletion: {rec['days_until_depletion']}")
                    else:
                        print("❌ No recommendations generated")
                else:
                    print(f"❌ Recommendations failed: {response.status_code}")
            else:
                print("❌ No retailers found")
        else:
            print(f"❌ Retailers endpoint failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing recommendations: {e}")

if __name__ == "__main__":
    print("🚀 MediChain PREDICT Debug Tool")
    print("=" * 50)
    
    # Step 1: Debug MongoDB
    debug_mongodb_connection()
    
    # Step 2: Add sample data if needed
    print("\n" + "=" * 50)
    add_sample_data()
    
    # Step 3: Test recommendations
    print("\n" + "=" * 50)
    test_recommendations()
    
    print("\n" + "=" * 50)
    print("🎯 Debug complete!")
    print("\n💡 If you still see issues:")
    print("1. Make sure the web server is running: python web_app.py")
    print("2. Check MongoDB is running: mongod")
    print("3. Verify data exists in the database")
    print("4. Check the logs for specific error messages") 