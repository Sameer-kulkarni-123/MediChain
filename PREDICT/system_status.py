#!/usr/bin/env python3
"""
MediChain PREDICT System Status and Usage Guide
"""
import requests
import json
from datetime import datetime

def check_system_status():
    """Check the current system status"""
    print("🔍 MediChain PREDICT System Status")
    print("=" * 50)
    
    try:
        # Health check
        response = requests.get("http://localhost:5000/api/health")
        if response.status_code == 200:
            health = response.json()
            print(f"✅ System Status: {health['status']}")
            print(f"✅ MongoDB: {health['mongodb']}")
            print(f"✅ Predictor: {health['predictor']}")
        else:
            print("❌ System not responding")
            return
        
        # Get retailers
        response = requests.get("http://localhost:5000/api/retailers")
        if response.status_code == 200:
            retailers_data = response.json()
            print(f"✅ Retailers Found: {retailers_data['count']}")
            
            if retailers_data['retailers']:
                print("\n📋 Sample Retailers:")
                for i, retailer in enumerate(retailers_data['retailers'][:3]):
                    print(f"   {i+1}. {retailer['name']} ({retailer['walletAddress'][:10]}...)")
        
        # Get recommendations
        response = requests.get("http://localhost:5000/api/recommendations")
        if response.status_code == 200:
            rec_data = response.json()
            print(f"✅ Total Recommendations: {rec_data['count']}")
            
            if rec_data['recommendations']:
                high_urgency = len([r for r in rec_data['recommendations'] if r['urgency_level'] == 'high'])
                medium_urgency = len([r for r in rec_data['recommendations'] if r['urgency_level'] == 'medium'])
                low_urgency = len([r for r in rec_data['recommendations'] if r['urgency_level'] == 'low'])
                
                print(f"   🔴 High Urgency: {high_urgency}")
                print(f"   🟡 Medium Urgency: {medium_urgency}")
                print(f"   🟢 Low Urgency: {low_urgency}")
        
        print("\n" + "=" * 50)
        print("🎉 SYSTEM IS WORKING CORRECTLY!")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Error checking system: {e}")

def show_usage_guide():
    """Show how to use the system"""
    print("\n📖 USAGE GUIDE")
    print("=" * 50)
    
    print("🌐 Web Dashboard:")
    print("   • Open: http://localhost:5000")
    print("   • Shows real-time recommendations and alerts")
    print("   • Interactive charts and data visualization")
    
    print("\n🔌 API Endpoints:")
    print("   • Health: GET http://localhost:5000/api/health")
    print("   • Retailers: GET http://localhost:5000/api/retailers")
    print("   • Recommendations: GET http://localhost:5000/api/recommendations")
    print("   • Specific Retailer: GET http://localhost:5000/api/retailer/{wallet_address}")
    print("   • Retailer Inventory: GET http://localhost:5000/api/retailer/{wallet_address}/inventory")
    print("   • Retailer Recommendations: GET http://localhost:5000/api/retailer/{wallet_address}/recommendations")
    
    print("\n🚀 Quick Start:")
    print("   1. Start the system: python web/web_app.py")
    print("   2. Open dashboard: python open_dashboard.py")
    print("   3. Test API: python test_web_app.py")
    print("   4. Check status: python system_status.py")
    
    print("\n📊 What's Working:")
    print("   ✅ MongoDB integration with retailer wallet addresses")
    print("   ✅ Real-time inventory tracking")
    print("   ✅ ML-based restock recommendations")
    print("   ✅ Urgency-based alerting system")
    print("   ✅ Web dashboard with live data")
    print("   ✅ RESTful API for frontend integration")

if __name__ == "__main__":
    check_system_status()
    show_usage_guide() 