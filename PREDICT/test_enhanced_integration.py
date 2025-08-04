#!/usr/bin/env python3
"""
Test script for enhanced PREDICT integration with local_backend
"""

import requests
import json
from datetime import datetime

def test_enhanced_integration():
    """Test the enhanced integration"""
    print("🧪 Testing Enhanced PREDICT Integration")
    print("=" * 50)
    
    base_url = "http://localhost:5000/api"
    
    # Test 1: Health Check
    print("\n1️⃣ Testing Enhanced Health Check...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            health = response.json()
            print(f"✅ Health: {health}")
            print(f"   MongoDB: {health.get('mongodb', 'unknown')}")
            print(f"   Local Backend: {health.get('local_backend', 'unknown')}")
            print(f"   Enhanced Predictor: {health.get('enhanced_predictor', 'unknown')}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Test 2: Data Sources
    print("\n2️⃣ Testing Data Sources...")
    try:
        response = requests.get(f"{base_url}/data-sources")
        if response.status_code == 200:
            sources = response.json()
            print(f"✅ Data Sources: {sources}")
            print(f"   MongoDB retailers: {sources.get('mongodb', {}).get('retailers_count', 0)}")
            print(f"   Local Backend retailers: {sources.get('local_backend', {}).get('retailers_count', 0)}")
            print(f"   Combined retailers: {sources.get('combined', {}).get('total_retailers', 0)}")
        else:
            print(f"❌ Data sources failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Data sources error: {e}")
    
    # Test 3: Combined Retailers
    print("\n3️⃣ Testing Combined Retailers...")
    try:
        response = requests.get(f"{base_url}/retailers")
        if response.status_code == 200:
            data = response.json()
            retailers = data.get('retailers', [])
            print(f"✅ Combined retailers: {len(retailers)} found")
            
            if retailers:
                print("📋 Sample retailers:")
                for i, retailer in enumerate(retailers[:3]):
                    source = retailer.get('data_source', 'unknown')
                    print(f"   {i+1}. {retailer.get('name', 'Unknown')} ({source})")
        else:
            print(f"❌ Retailers failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Retailers error: {e}")
        return False
    
    # Test 4: Enhanced Recommendations
    print("\n4️⃣ Testing Enhanced Recommendations...")
    try:
        response = requests.get(f"{base_url}/recommendations")
        if response.status_code == 200:
            data = response.json()
            recommendations = data.get('recommendations', [])
            print(f"✅ Enhanced recommendations: {len(recommendations)} found")
            
            if recommendations:
                high_urgency = len([r for r in recommendations if r.get('urgency_level') == 'high'])
                medium_urgency = len([r for r in recommendations if r.get('urgency_level') == 'medium'])
                low_urgency = len([r for r in recommendations if r.get('urgency_level') == 'low'])
                
                print(f"   🔴 High urgency: {high_urgency}")
                print(f"   🟡 Medium urgency: {medium_urgency}")
                print(f"   🟢 Low urgency: {low_urgency}")
                
                # Show sample recommendation
                if recommendations:
                    sample = recommendations[0]
                    print(f"📊 Sample recommendation:")
                    print(f"   Product: {sample.get('product_name')}")
                    print(f"   Current: {sample.get('current_stock')} → Recommended: {sample.get('recommended_quantity')}")
                    print(f"   Urgency: {sample.get('urgency_level')}")
                    print(f"   Days until depletion: {sample.get('days_until_depletion')}")
                    print(f"   Data source: {sample.get('data_source')}")
        else:
            print(f"❌ Recommendations failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Recommendations error: {e}")
    
    # Test 5: System Status
    print("\n5️⃣ Testing System Status...")
    try:
        response = requests.get(f"{base_url}/system-status")
        if response.status_code == 200:
            status = response.json()
            print(f"✅ System Status: {status}")
        else:
            print(f"❌ System status failed: {response.status_code}")
    except Exception as e:
        print(f"❌ System status error: {e}")
    
    # Test 6: Local Backend Direct Test
    print("\n6️⃣ Testing Local Backend Directly...")
    try:
        response = requests.get("http://localhost:8000/retailers/")
        if response.status_code == 200:
            retailers = response.json()
            print(f"✅ Local Backend: {len(retailers)} retailers found")
        else:
            print(f"❌ Local Backend failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Local Backend error: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Enhanced Integration Test Complete!")
    print("=" * 50)
    return True

def test_individual_retailer():
    """Test individual retailer functionality"""
    print("\n🔍 Testing Individual Retailer...")
    
    try:
        # Get retailers first
        response = requests.get("http://localhost:5000/api/retailers")
        if response.status_code == 200:
            data = response.json()
            retailers = data.get('retailers', [])
            
            if retailers:
                # Test first retailer
                retailer = retailers[0]
                wallet_address = retailer.get('walletAddress')
                
                print(f"📋 Testing retailer: {retailer.get('name')} ({wallet_address})")
                
                # Test inventory
                response = requests.get(f"http://localhost:5000/api/retailer/{wallet_address}/inventory")
                if response.status_code == 200:
                    inventory_data = response.json()
                    inventory = inventory_data.get('inventory', {})
                    print(f"   📦 Inventory: {len(inventory)} products")
                    
                    for product_name, product_data in inventory.items():
                        print(f"      • {product_name}: {product_data.get('qty', 0)} units")
                
                # Test recommendations
                response = requests.get(f"http://localhost:5000/api/retailer/{wallet_address}/recommendations")
                if response.status_code == 200:
                    rec_data = response.json()
                    recommendations = rec_data.get('recommendations', [])
                    print(f"   💡 Recommendations: {len(recommendations)} found")
                    
                    for rec in recommendations:
                        print(f"      • {rec.get('product_name')}: {rec.get('current_stock')} → {rec.get('recommended_quantity')} ({rec.get('urgency_level')})")
                
                return True
            else:
                print("❌ No retailers found")
                return False
        else:
            print(f"❌ Failed to get retailers: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Individual retailer test error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Enhanced PREDICT Integration Test")
    print("=" * 50)
    print(f"📅 Test started at: {datetime.now()}")
    
    # Run main integration test
    if test_enhanced_integration():
        print("\n✅ Main integration test passed!")
        
        # Run individual retailer test
        if test_individual_retailer():
            print("✅ Individual retailer test passed!")
        else:
            print("❌ Individual retailer test failed!")
    else:
        print("\n❌ Main integration test failed!")
    
    print("\n" + "=" * 50)
    print("🏁 Test Complete!")
    print("=" * 50) 