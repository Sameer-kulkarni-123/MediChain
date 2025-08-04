#!/usr/bin/env python3
"""
Test script to debug web_app.py retailer retrieval issue
"""
import requests
import json
import time

def test_web_app():
    """Test the web app endpoints"""
    base_url = "http://localhost:5000/api"
    
    print("🔍 Testing web_app.py endpoints...")
    
    # Test health check
    try:
        response = requests.get(f"{base_url}/health")
        print(f"✅ Health check: {response.status_code}")
        if response.status_code == 200:
            health_data = response.json()
            print(f"   Status: {health_data.get('status')}")
            print(f"   MongoDB: {health_data.get('mongodb')}")
            print(f"   Predictor: {health_data.get('predictor')}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return
    
    # Test retailers endpoint
    try:
        response = requests.get(f"{base_url}/retailers")
        print(f"✅ Retailers endpoint: {response.status_code}")
        if response.status_code == 200:
            retailers_data = response.json()
            print(f"   Count: {retailers_data.get('count')}")
            print(f"   Retailers: {len(retailers_data.get('retailers', []))}")
            if retailers_data.get('retailers'):
                print(f"   Sample retailer: {retailers_data['retailers'][0]}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Retailers endpoint failed: {e}")
    
    # Test recommendations endpoint
    try:
        response = requests.get(f"{base_url}/recommendations")
        print(f"✅ Recommendations endpoint: {response.status_code}")
        if response.status_code == 200:
            rec_data = response.json()
            print(f"   Count: {rec_data.get('count')}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Recommendations endpoint failed: {e}")

if __name__ == "__main__":
    test_web_app() 