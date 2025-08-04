#!/usr/bin/env python3
"""
Quick test to check if recommendations are working
"""

import requests
import json

def test_recommendations():
    """Test the recommendation system"""
    print("🧪 Quick Test - Checking Recommendations")
    print("=" * 50)
    
    try:
        # Test health
        print("1. Testing health check...")
        response = requests.get("http://localhost:5000/api/health", timeout=5)
        if response.status_code == 200:
            health = response.json()
            print(f"✅ Health: {health.get('status', 'unknown')}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return
        
        # Test retailers
        print("\n2. Testing retailers...")
        response = requests.get("http://localhost:5000/api/retailers", timeout=5)
        if response.status_code == 200:
            data = response.json()
            retailers = data.get('retailers', [])
            print(f"✅ Found {len(retailers)} retailers")
            
            if retailers:
                # Test first retailer
                first_retailer = retailers[0]
                wallet = first_retailer['walletAddress']
                print(f"   Testing retailer: {wallet[:8]}...")
                
                # Test inventory
                print("\n3. Testing inventory...")
                response = requests.get(f"http://localhost:5000/api/retailer/{wallet}/inventory", timeout=5)
                if response.status_code == 200:
                    inventory_data = response.json()
                    inventory = inventory_data.get('inventory', {})
                    print(f"✅ Inventory: {len(inventory)} products")
                    
                    if inventory:
                        for product, data in inventory.items():
                            print(f"   • {product}: {data['qty']} units")
                
                # Test recommendations
                print("\n4. Testing recommendations...")
                response = requests.get(f"http://localhost:5000/api/retailer/{wallet}/recommendations", timeout=5)
                if response.status_code == 200:
                    rec_data = response.json()
                    recommendations = rec_data.get('recommendations', [])
                    print(f"✅ Generated {len(recommendations)} recommendations")
                    
                    if recommendations:
                        print("\n📊 Sample recommendations:")
                        for i, rec in enumerate(recommendations[:3]):
                            print(f"   {i+1}. {rec['product_name']}")
                            print(f"      Current: {rec['current_stock']} → Recommended: {rec['recommended_quantity']}")
                            print(f"      Urgency: {rec['urgency_level']} ({rec['days_until_depletion']} days)")
                            print()
                    else:
                        print("❌ No recommendations generated")
                else:
                    print(f"❌ Recommendations failed: {response.status_code}")
            else:
                print("❌ No retailers found")
        else:
            print(f"❌ Retailers failed: {response.status_code}")
        
        # Test all recommendations
        print("\n5. Testing all recommendations...")
        response = requests.get("http://localhost:5000/api/recommendations", timeout=5)
        if response.status_code == 200:
            data = response.json()
            all_recs = data.get('recommendations', [])
            print(f"✅ Total recommendations: {len(all_recs)}")
            
            if all_recs:
                high_count = len([r for r in all_recs if r.get('urgency_level') == 'high'])
                medium_count = len([r for r in all_recs if r.get('urgency_level') == 'medium'])
                low_count = len([r for r in all_recs if r.get('urgency_level') == 'low'])
                
                print(f"   • High urgency: {high_count}")
                print(f"   • Medium urgency: {medium_count}")
                print(f"   • Low urgency: {low_count}")
            else:
                print("❌ No recommendations found")
        else:
            print(f"❌ All recommendations failed: {response.status_code}")
        
        print("\n" + "=" * 50)
        print("🎉 Test complete!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure it's running:")
        print("   python web/web_app.py")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_recommendations() 