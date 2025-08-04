#!/usr/bin/env python3
"""
Simple script to run the integrated PREDICT system
"""

import os
import sys
import subprocess
import time

def main():
    """Run the integrated system"""
    print("🚀 Starting MediChain PREDICT Integrated System")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists("web/web_app.py"):
        print("❌ Please run this script from the PREDICT directory")
        return False
    
    # Change to web directory and run the app
    web_dir = os.path.join(os.path.dirname(__file__), 'web')
    
    print(f"📁 Working directory: {web_dir}")
    print("🌐 Starting web server on http://localhost:5000")
    print("📊 Dashboard available at: http://localhost:5000")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 50)
    
    try:
        # Run the web app
        subprocess.run([sys.executable, "web_app.py"], cwd=web_dir)
    except KeyboardInterrupt:
        print("\n⚠️ Server stopped by user")
    except Exception as e:
        print(f"\n❌ Error running server: {e}")
        return False
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if not success:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1) 