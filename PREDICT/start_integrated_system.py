#!/usr/bin/env python3
"""
Startup script for the integrated PREDICT system with MongoDB
"""

import subprocess
import time
import requests
import sys
import os
from datetime import datetime

def check_mongodb():
    """Check if MongoDB is running"""
    try:
        import pymongo
        client = pymongo.MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        print("✅ MongoDB is running")
        return True
    except Exception as e:
        print(f"❌ MongoDB is not running: {e}")
        print("   Please start MongoDB first:")
        print("   - Windows: Start MongoDB service")
        print("   - Linux/Mac: sudo systemctl start mongod")
        return False

def check_backenddb():
    """Check if BackendDB server is running"""
    try:
        response = requests.get("http://localhost:5000/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ BackendDB server is running")
            return True
        else:
            print(f"❌ BackendDB server returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ BackendDB server is not running: {e}")
        return False

def start_backenddb():
    """Start the BackendDB server"""
    print("🚀 Starting BackendDB server...")
    
    # Change to backenddb directory
    backenddb_path = os.path.join(os.path.dirname(__file__), '..', 'backenddb')
    
    if not os.path.exists(backenddb_path):
        print(f"❌ BackendDB directory not found: {backenddb_path}")
        return False
    
    try:
        # Start the server in background
        process = subprocess.Popen(
            ["node", "server.js"],
            cwd=backenddb_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait a moment for server to start
        time.sleep(3)
        
        if process.poll() is None:
            print("✅ BackendDB server started successfully")
            return True
        else:
            print("❌ BackendDB server failed to start")
            return False
    except Exception as e:
        print(f"❌ Error starting BackendDB server: {e}")
        return False

def start_predict_backend():
    """Start the PREDICT backend"""
    print("🚀 Starting PREDICT backend...")
    
    try:
        # Start the web app
        web_dir = os.path.join(os.path.dirname(__file__), 'web')
        process = subprocess.Popen(
            [sys.executable, "web_app.py"],
            cwd=web_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait a moment for server to start
        time.sleep(3)
        
        if process.poll() is None:
            print("✅ PREDICT backend started successfully")
            return True
        else:
            print("❌ PREDICT backend failed to start")
            return False
    except Exception as e:
        print(f"❌ Error starting PREDICT backend: {e}")
        return False

def test_integration():
    """Test the complete integration"""
    print("\n🧪 Testing integration...")
    
    try:
        # Test health endpoint
        response = requests.get("http://localhost:5000/api/health", timeout=10)
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Integration test passed")
            print(f"   Status: {health_data.get('status', 'unknown')}")
            print(f"   MongoDB: {health_data.get('mongodb', 'unknown')}")
            print(f"   Predictor: {health_data.get('predictor', 'unknown')}")
            return True
        else:
            print(f"❌ Integration test failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Integration test error: {e}")
        return False

def install_dependencies():
    """Install required dependencies"""
    print("📦 Installing dependencies...")
    
    try:
        # Install Python dependencies
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", "requirements_integrated.txt"
        ], cwd=os.path.dirname(__file__), check=True)
        print("✅ Python dependencies installed")
        
        # Install Node.js dependencies for BackendDB
        backenddb_path = os.path.join(os.path.dirname(__file__), '..', 'backenddb')
        if os.path.exists(backenddb_path):
            subprocess.run(["npm", "install"], cwd=backenddb_path, check=True)
            print("✅ Node.js dependencies installed")
        
        return True
    except Exception as e:
        print(f"❌ Error installing dependencies: {e}")
        return False

def main():
    """Main startup function"""
    print("🚀 MediChain PREDICT Integrated System Startup")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists("web/web_app.py"):
        print("❌ Please run this script from the PREDICT directory")
        return False
    
    # Step 1: Install dependencies
    print("\n1. Installing dependencies...")
    if not install_dependencies():
        print("❌ Failed to install dependencies")
        return False
    
    # Step 2: Check MongoDB
    print("\n2. Checking MongoDB...")
    if not check_mongodb():
        print("❌ MongoDB is required but not running")
        return False
    
    # Step 3: Check/Start BackendDB
    print("\n3. Checking BackendDB server...")
    if not check_backenddb():
        print("   Starting BackendDB server...")
        if not start_backenddb():
            print("❌ Failed to start BackendDB server")
            return False
    
    # Step 4: Start PREDICT backend
    print("\n4. Starting PREDICT backend...")
    if not start_predict_backend():
        print("❌ Failed to start PREDICT backend")
        return False
    
    # Step 5: Test integration
    print("\n5. Testing integration...")
    if not test_integration():
        print("❌ Integration test failed")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 Integrated system is ready!")
    print("\n📋 Available services:")
    print("   • BackendDB server: http://localhost:5000")
    print("   • PREDICT backend: http://localhost:5000 (same port)")
    print("   • MongoDB: localhost:27017")
    
    print("\n🔗 API Endpoints:")
    print("   GET  /api/health                    - System health check")
    print("   GET  /api/retailers                 - Get all retailers")
    print("   GET  /api/retailer/{wallet}         - Get specific retailer")
    print("   GET  /api/retailer/{wallet}/inventory - Get retailer inventory")
    print("   GET  /api/retailer/{wallet}/recommendations - Get restock recommendations")
    print("   GET  /api/retailer/{wallet}/alerts - Get critical alerts")
    print("   GET  /api/recommendations           - Get all recommendations")
    print("   GET  /api/alerts                    - Get critical alerts")
    print("   POST /api/generate-report           - Generate comprehensive report")
    
    print("\n🧪 To test the system:")
    print("   python test_integration_with_mongodb.py")
    
    print("\n📝 To add test data:")
    print("   curl -X POST http://localhost:5000/api/entries \\")
    print("     -H 'Content-Type: application/json' \\")
    print("     -d '{\"type\": \"retailer\", \"wallet_address\": \"0x1234567890abcdef1234567890abcdef12345678\", \"location\": \"New York, NY\", \"certificate\": \"retailer_cert_001\"}'")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if success:
            print("\n✅ System startup completed successfully!")
        else:
            print("\n❌ System startup failed!")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n⚠️ Startup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1) 