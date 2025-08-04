#!/usr/bin/env python3
"""
Open the MediChain PREDICT dashboard in the browser
"""
import webbrowser
import time
import requests

def open_dashboard():
    """Open the dashboard in the browser"""
    dashboard_url = "http://localhost:5000"
    
    print("🚀 Opening MediChain PREDICT Dashboard...")
    print(f"📊 Dashboard URL: {dashboard_url}")
    
    # Check if the server is running
    try:
        response = requests.get(f"{dashboard_url}/api/health")
        if response.status_code == 200:
            print("✅ Server is running and healthy")
            print("🌐 Opening dashboard in browser...")
            webbrowser.open(dashboard_url)
            print("✅ Dashboard opened!")
        else:
            print("❌ Server is not responding properly")
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        print("💡 Make sure to run: python web/web_app.py")

if __name__ == "__main__":
    open_dashboard() 