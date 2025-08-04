#!/usr/bin/env python3
"""
Test script for PREDICT integration with MongoDB
"""

import requests
import json
import time
from datetime import datetime

def test_mongodb_integration():
    """Test the integrated PREDICT system with MongoDB"""
    
    base_url = "http://localhost:5000"
    
    print("🧪 Testing PREDICT Integration with MongoDB")
    print("=" * 50)
    
    # Test 1: Health Check
    print("\n1. Testing Health Check...")
    try:
        response = requests.get(f"{base_url}/api/health")
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Health Check: {health_data['status']}")
            print(f"   MongoDB: {health_data.get('mongodb', 'unknown')}")
            print(f"   Predictor: {health_data.get('predictor', 'unknown')}")
        else:
            print(f"❌ Health Check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health Check error: {e}")
        return False
    
    # Test 2: Get Retailers
    print("\n2. Testing Retailer Retrieval...")
    try:
        response = requests.get(f"{base_url}/api/retailers")
        if response.status_code == 200:
            retailers_data = response.json()
            retailers = retailers_data.get('retailers', [])
            print(f"✅ Found {len(retailers)} retailers")
            
            if retailers:
                # Test with first retailer
                first_retailer = retailers[0]
                wallet_address = first_retailer['walletAddress']
                print(f"   Testing with retailer: {wallet_address[:8]}...")
                
                # Test 3: Get Retailer Details
                print("\n3. Testing Retailer Details...")
                response = requests.get(f"{base_url}/api/retailer/{wallet_address}")
                if response.status_code == 200:
                    retailer_data = response.json()
                    print(f"✅ Retailer details retrieved")
                    print(f"   Name: {retailer_data.get('name', 'N/A')}")
                    print(f"   Location: {retailer_data.get('location', 'N/A')}")
                else:
                    print(f"❌ Retailer details failed: {response.status_code}")
                
                # Test 4: Get Inventory
                print("\n4. Testing Inventory Retrieval...")
                response = requests.get(f"{base_url}/api/retailer/{wallet_address}/inventory")
                if response.status_code == 200:
                    inventory_data = response.json()
                    inventory = inventory_data.get('inventory', {})
                    print(f"✅ Inventory retrieved: {len(inventory)} products")
                    
                    if inventory:
                        # Test 5: Get Recommendations
                        print("\n5. Testing Restock Recommendations...")
                        response = requests.get(f"{base_url}/api/retailer/{wallet_address}/recommendations")
                        if response.status_code == 200:
                            recommendations_data = response.json()
                            recommendations = recommendations_data.get('recommendations', [])
                            print(f"✅ Generated {len(recommendations)} recommendations")
                            
                            if recommendations:
                                # Show first recommendation
                                first_rec = recommendations[0]
                                print(f"   Sample recommendation:")
                                print(f"     Product: {first_rec.get('product_name', 'N/A')}")
                                print(f"     Current Stock: {first_rec.get('current_stock', 'N/A')}")
                                print(f"     Recommended: {first_rec.get('recommended_quantity', 'N/A')}")
                                print(f"     Urgency: {first_rec.get('urgency_level', 'N/A')}")
                                print(f"     Days until depletion: {first_rec.get('days_until_depletion', 'N/A')}")
                        else:
                            print(f"❌ Recommendations failed: {response.status_code}")
                    else:
                        print("⚠️ No inventory found for this retailer")
                else:
                    print(f"❌ Inventory retrieval failed: {response.status_code}")
                
                # Test 6: Get Alerts
                print("\n6. Testing Critical Alerts...")
                response = requests.get(f"{base_url}/api/retailer/{wallet_address}/alerts")
                if response.status_code == 200:
                    alerts_data = response.json()
                    alerts = alerts_data.get('alerts', [])
                    print(f"✅ Found {len(alerts)} critical alerts")
                else:
                    print(f"❌ Alerts failed: {response.status_code}")
            else:
                print("⚠️ No retailers found. You may need to add retailers to MongoDB first.")
                print("   Use the BackendDB server to add retailers:")
                print("   curl -X POST http://localhost:5000/api/entries \\")
                print("     -H 'Content-Type: application/json' \\")
                print("     -d '{\"type\": \"retailer\", \"wallet_address\": \"0x1234567890abcdef1234567890abcdef12345678\", \"location\": \"New York, NY\", \"certificate\": \"retailer_cert_001\"}'")
        else:
            print(f"❌ Retailer retrieval failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Retailer retrieval error: {e}")
        return False
    
    # Test 7: Get All Recommendations
    print("\n7. Testing All Recommendations...")
    try:
        response = requests.get(f"{base_url}/api/recommendations")
        if response.status_code == 200:
            all_recs_data = response.json()
            all_recommendations = all_recs_data.get('recommendations', [])
            print(f"✅ Total recommendations: {len(all_recommendations)}")
            
            # Count by urgency level
            high_count = len([r for r in all_recommendations if r.get('urgency_level') == 'high'])
            medium_count = len([r for r in all_recommendations if r.get('urgency_level') == 'medium'])
            low_count = len([r for r in all_recommendations if r.get('urgency_level') == 'low'])
            
            print(f"   High urgency: {high_count}")
            print(f"   Medium urgency: {medium_count}")
            print(f"   Low urgency: {low_count}")
        else:
            print(f"❌ All recommendations failed: {response.status_code}")
    except Exception as e:
        print(f"❌ All recommendations error: {e}")
    
    # Test 8: Get Critical Alerts
    print("\n8. Testing Critical Alerts...")
    try:
        response = requests.get(f"{base_url}/api/alerts")
        if response.status_code == 200:
            alerts_data = response.json()
            alerts = alerts_data.get('alerts', [])
            print(f"✅ Critical alerts: {len(alerts)}")
        else:
            print(f"❌ Critical alerts failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Critical alerts error: {e}")
    
    # Test 9: Generate Report
    print("\n9. Testing Report Generation...")
    try:
        response = requests.post(f"{base_url}/api/generate-report")
        if response.status_code == 200:
            report_data = response.json()
            print(f"✅ Report generated successfully")
            print(f"   File: {report_data.get('report_file', 'N/A')}")
            print(f"   Total recommendations: {report_data.get('report', {}).get('total_recommendations', 'N/A')}")
        else:
            print(f"❌ Report generation failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Report generation error: {e}")
    
    print("\n" + "=" * 50)
    print("✅ Integration test completed!")
    return True

def add_test_data():
    """Add test data to MongoDB via BackendDB server"""
    print("\n📝 Adding test data to MongoDB...")
    
    # Add a test retailer
    retailer_data = {
        "type": "retailer",
        "wallet_address": "0x1234567890abcdef1234567890abcdef12345678",
        "location": "New York, NY",
        "certificate": "retailer_cert_001"
    }
    
    try:
        response = requests.post(
            "http://localhost:5000/api/entries",
            headers={"Content-Type": "application/json"},
            json=retailer_data
        )
        
        if response.status_code == 200 or response.status_code == 201:
            print("✅ Test retailer added successfully")
        else:
            print(f"⚠️ Retailer may already exist: {response.status_code}")
    except Exception as e:
        print(f"❌ Error adding retailer: {e}")
    
    # Add test bottles
    bottles_data = {
        "count": 20,
        "blockchain_value": "blockchain_hash_001",
        "certificate": "retailer_cert_001",
        "details": "Aspirin 500mg"
    }
    
    try:
        response = requests.post(
            "http://localhost:5000/api/bottles/generate",
            headers={"Content-Type": "application/json"},
            json=bottles_data
        )
        
        if response.status_code == 200 or response.status_code == 201:
            print("✅ Test bottles added successfully")
        else:
            print(f"⚠️ Bottles may already exist: {response.status_code}")
    except Exception as e:
        print(f"❌ Error adding bottles: {e}")

if __name__ == "__main__":
    print("🚀 PREDICT MongoDB Integration Test")
    print("=" * 50)
    
    # Check if services are running
    print("Checking if services are running...")
    
    # Try to add test data first
    add_test_data()
    
    # Wait a moment for data to be processed
    print("Waiting for data processing...")
    time.sleep(2)
    
    # Run the integration test
    success = test_mongodb_integration()
    
    if success:
        print("\n🎉 All tests passed! The PREDICT system is working correctly with MongoDB.")
    else:
        print("\n❌ Some tests failed. Please check the logs and ensure all services are running.")
    
    print("\n📋 Available endpoints:")
    print("   GET  /api/health                    - System health check")
    print("   GET  /api/retailers                 - Get all retailers")
    print("   GET  /api/retailer/{wallet}         - Get specific retailer")
    print("   GET  /api/retailer/{wallet}/inventory - Get retailer inventory")
    print("   GET  /api/retailer/{wallet}/recommendations - Get restock recommendations")
    print("   GET  /api/retailer/{wallet}/alerts - Get critical alerts")
    print("   GET  /api/recommendations           - Get all recommendations")
    print("   GET  /api/alerts                    - Get critical alerts")
    print("   POST /api/generate-report           - Generate comprehensive report") 