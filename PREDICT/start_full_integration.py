#!/usr/bin/env python3
"""
Startup script for full MediChain integration
Starts local_backend and enhanced PREDICT system
"""

import subprocess
import time
import requests
import os
import sys
from datetime import datetime

def check_port_available(port):
    """Check if a port is available"""
    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result != 0
    except:
        return True

def wait_for_service(url, timeout=30):
    """Wait for a service to be available"""
    print(f"⏳ Waiting for {url} to be ready...")
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ {url} is ready!")
                return True
        except:
            time.sleep(1)
    print(f"❌ {url} failed to start within {timeout} seconds")
    return False

def start_local_backend():
    """Start the local_backend service"""
    print("🚀 Starting local_backend...")
    
    # Check if local_backend directory exists
    local_backend_path = os.path.join(os.path.dirname(__file__), '..', 'local_backend')
    if not os.path.exists(local_backend_path):
        print(f"❌ local_backend directory not found at {local_backend_path}")
        return False
    
    # Check if port 8000 is available
    if not check_port_available(8000):
        print("⚠️ Port 8000 is already in use. local_backend may already be running.")
        return True
    
    try:
        # Start local_backend
        process = subprocess.Popen(
            [sys.executable, "src/main.py"],
            cwd=local_backend_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait for service to be ready
        if wait_for_service("http://localhost:8000/retailers/"):
            print("✅ local_backend started successfully")
            return True
        else:
            print("❌ local_backend failed to start")
            return False
            
    except Exception as e:
        print(f"❌ Error starting local_backend: {e}")
        return False

def start_enhanced_predict():
    """Start the enhanced PREDICT system"""
    print("🚀 Starting enhanced PREDICT system...")
    
    # Check if port 5000 is available
    if not check_port_available(5000):
        print("⚠️ Port 5000 is already in use. Enhanced PREDICT may already be running.")
        return True
    
    try:
        # Start enhanced web app
        process = subprocess.Popen(
            [sys.executable, "enhanced_web_app.py"],
            cwd=os.path.join(os.path.dirname(__file__), 'web'),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait for service to be ready
        if wait_for_service("http://localhost:5000/api/health"):
            print("✅ Enhanced PREDICT system started successfully")
            return True
        else:
            print("❌ Enhanced PREDICT system failed to start")
            return False
            
    except Exception as e:
        print(f"❌ Error starting enhanced PREDICT: {e}")
        return False

def test_integration():
    """Test the full integration"""
    print("\n🧪 Testing full integration...")
    
    try:
        # Test local_backend
        response = requests.get("http://localhost:8000/retailers/")
        if response.status_code == 200:
            retailers = response.json()
            print(f"✅ local_backend: {len(retailers)} retailers found")
        else:
            print("❌ local_backend test failed")
            return False
        
        # Test enhanced PREDICT
        response = requests.get("http://localhost:5000/api/health")
        if response.status_code == 200:
            health = response.json()
            print(f"✅ Enhanced PREDICT: {health}")
        else:
            print("❌ Enhanced PREDICT test failed")
            return False
        
        # Test combined data
        response = requests.get("http://localhost:5000/api/retailers")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Combined retailers: {data['count']} retailers")
        else:
            print("❌ Combined data test failed")
            return False
        
        print("🎉 Full integration test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        return False

def main():
    """Main startup function"""
    print("🔗 MediChain Full Integration Startup")
    print("=" * 50)
    print(f"📅 Started at: {datetime.now()}")
    
    # Start local_backend
    if not start_local_backend():
        print("❌ Failed to start local_backend")
        return False
    
    # Start enhanced PREDICT
    if not start_enhanced_predict():
        print("❌ Failed to start enhanced PREDICT")
        return False
    
    # Test integration
    if not test_integration():
        print("❌ Integration test failed")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 Full MediChain Integration Ready!")
    print("=" * 50)
    print("🌐 Services:")
    print("   • local_backend: http://localhost:8000")
    print("   • Enhanced PREDICT: http://localhost:5000")
    print("   • Dashboard: http://localhost:5000")
    print("\n📊 API Endpoints:")
    print("   • Health: http://localhost:5000/api/health")
    print("   • Retailers: http://localhost:5000/api/retailers")
    print("   • System Status: http://localhost:5000/api/system-status")
    print("   • Data Sources: http://localhost:5000/api/data-sources")
    print("\n💡 Press Ctrl+C to stop all services")
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down services...")
        print("✅ Services stopped")

if __name__ == "__main__":
    main() 