#!/usr/bin/env python3
"""
Fix the database by adding retailer entries for existing bottles
"""

import pymongo
from datetime import datetime

def fix_database():
    """Fix the database by adding retailer entries for existing bottles"""
    print("🔧 Fixing Database - Adding Missing Retailers")
    print("=" * 50)
    
    try:
        # Connect to MongoDB
        client = pymongo.MongoClient("mongodb://localhost:27017")
        db = client["medichain"]
        
        # Get all unique certificates from bottles
        bottles = list(db.bottles.find({}))
        certificates = set()
        
        for bottle in bottles:
            cert = bottle.get("certificate")
            if cert:
                certificates.add(cert)
        
        print(f"📦 Found {len(bottles)} bottles")
        print(f"🏪 Found {len(certificates)} unique certificates")
        
        # Check existing retailers
        existing_retailers = list(db.entries.find({"type": "retailer"}))
        existing_certificates = {retailer["certificate"] for retailer in existing_retailers}
        
        print(f"✅ Found {len(existing_retailers)} existing retailers")
        
        # Add missing retailers
        added_count = 0
        for cert in certificates:
            if cert not in existing_certificates:
                # Create a retailer entry for this certificate
                retailer_data = {
                    "type": "retailer",
                    "wallet_address": f"0x{cert[:8].upper()}1234567890abcdef12345678",
                    "location": f"Location {cert[:4]}",
                    "certificate": cert
                }
                
                db.entries.insert_one(retailer_data)
                added_count += 1
                print(f"✅ Added retailer for certificate: {cert}")
        
        print(f"\n🎉 Added {added_count} new retailers")
        
        # Verify the fix
        all_retailers = list(db.entries.find({"type": "retailer"}))
        print(f"📊 Total retailers now: {len(all_retailers)}")
        
        # Test inventory retrieval
        if all_retailers:
            first_retailer = all_retailers[0]
            wallet = first_retailer["wallet_address"]
            cert = first_retailer["certificate"]
            
            bottles_for_retailer = list(db.bottles.find({"certificate": cert}))
            print(f"\n🧪 Test: Retailer {wallet[:8]}... has {len(bottles_for_retailer)} bottles")
            
            if bottles_for_retailer:
                # Group by product
                inventory = {}
                for bottle in bottles_for_retailer:
                    product_name = bottle.get("details", "Unknown Product")
                    if product_name not in inventory:
                        inventory[product_name] = 0
                    inventory[product_name] += 1
                
                print("📊 Inventory breakdown:")
                for product, count in inventory.items():
                    print(f"  • {product or 'Unknown Product'}: {count} units")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error fixing database: {e}")

def add_sample_data():
    """Add comprehensive sample data"""
    print("\n📝 Adding comprehensive sample data...")
    
    try:
        client = pymongo.MongoClient("mongodb://localhost:27017")
        db = client["medichain"]
        
        # Add sample retailers with different products
        sample_retailers = [
            {
                "type": "retailer",
                "wallet_address": "0x1234567890abcdef1234567890abcdef12345678",
                "location": "New York, NY",
                "certificate": "retailer_cert_001"
            },
            {
                "type": "retailer", 
                "wallet_address": "0xabcdef1234567890abcdef1234567890abcdef12",
                "location": "Los Angeles, CA",
                "certificate": "retailer_cert_002"
            },
            {
                "type": "retailer",
                "wallet_address": "0x9876543210fedcba9876543210fedcba98765432",
                "location": "Chicago, IL", 
                "certificate": "retailer_cert_003"
            }
        ]
        
        # Add retailers
        for retailer in sample_retailers:
            existing = db.entries.find_one({"wallet_address": retailer["wallet_address"]})
            if not existing:
                db.entries.insert_one(retailer)
                print(f"✅ Added retailer: {retailer['wallet_address'][:8]}...")
        
        # Add sample bottles for each retailer
        products = [
            ("Aspirin 500mg", 15),
            ("Ibuprofen 400mg", 12), 
            ("Vitamin C 1000mg", 8),
            ("Antibiotic Amoxicillin", 5),
            ("Paracetamol 500mg", 20)
        ]
        
        for retailer in sample_retailers:
            cert = retailer["certificate"]
            for product_name, count in products:
                for i in range(count):
                    bottle_data = {
                        "qr_code": f"{cert}_product_{product_name.replace(' ', '_')}_{i:03d}",
                        "blockchain_value": f"blockchain_hash_{cert}",
                        "certificate": cert,
                        "details": product_name,
                        "scanned": False
                    }
                    
                    # Check if bottle already exists
                    existing = db.bottles.find_one({"qr_code": bottle_data["qr_code"]})
                    if not existing:
                        db.bottles.insert_one(bottle_data)
            
            print(f"✅ Added {sum(count for _, count in products)} bottles for {cert}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error adding sample data: {e}")

if __name__ == "__main__":
    print("🚀 Database Fix Tool")
    print("=" * 50)
    
    # Step 1: Fix existing data
    fix_database()
    
    # Step 2: Add comprehensive sample data
    print("\n" + "=" * 50)
    add_sample_data()
    
    print("\n" + "=" * 50)
    print("🎉 Database fix complete!")
    print("\n💡 Now you can:")
    print("1. Start the web server: python web/web_app.py")
    print("2. Visit the dashboard: http://localhost:5000")
    print("3. Test the API: python test_integration_with_mongodb.py") 