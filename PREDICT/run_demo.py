#!/usr/bin/env python3
"""
Launcher script for the Pharmaceutical Inventory Management System
"""

import sys
import os

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def main():
    """Main launcher function"""
    print("=" * 60)
    print("    PHARMACEUTICAL INVENTORY MANAGEMENT SYSTEM")
    print("=" * 60)
    print()
    
    try:
        # Import and run the main system
        from sample import run_production_demo
        
        print("Starting production demo...")
        ai_system, predictions = run_production_demo()
        
        print("\n" + "=" * 60)
        print("DEMO COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print()
        print("Generated files:")
        print("• Reports: reports/")
        print("• Logs: logs/")
        print("• Data: data/")
        print()
        print("Next steps:")
        print("1. Start web dashboard: python web/web_app.py")
        print("2. View latest reports in reports/ directory")
        print("3. Check logs in logs/ directory")
        print("4. Configure settings in config/pharma_config.json")
        
    except ImportError as e:
        print(f"Error importing modules: {e}")
        print("Please ensure all dependencies are installed:")
        print("pip install -r requirements.txt")
    except Exception as e:
        print(f"Error running demo: {e}")
        print("Please check the logs for more details.")

if __name__ == "__main__":
    main() 