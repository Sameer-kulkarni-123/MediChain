#!/usr/bin/env python3
"""
Enhanced Flask web app for pharmaceutical inventory alerts with full MediChain integration
"""

from flask import Flask, render_template, jsonify, request
import json
import os
from datetime import datetime, timedelta
import glob
import logging
from typing import Dict, List, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

# Import the enhanced predictor
from enhanced_predictor import EnhancedPredictor

# Flask app setup
app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global enhanced predictor variable
enhanced_predictor = None

def initialize_enhanced_predictor():
    """Initialize the enhanced predictor"""
    global enhanced_predictor
    try:
        enhanced_predictor = EnhancedPredictor()
        return True
    except Exception as e:
        logger.error(f"❌ Failed to initialize enhanced predictor: {e}")
        return False

# Initialize on startup
if not initialize_enhanced_predictor():
    logger.error("❌ Failed to initialize enhanced predictor. Some endpoints may not work.")

@app.route('/')
def dashboard():
    """Main dashboard page"""
    return render_template('dashboard.html')

@app.route('/api/health')
def health_check():
    """Enhanced health check endpoint"""
    try:
        if enhanced_predictor:
            status = enhanced_predictor.get_system_status()
            return jsonify(status)
        else:
            return jsonify({
                "status": "unhealthy",
                "error": "Enhanced predictor not initialized",
                "timestamp": datetime.now().isoformat()
            })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        })

@app.route('/api/retailers')
def get_retailers():
    """Get all retailers from both sources"""
    try:
        logger.info("🌐 /api/retailers endpoint called")
        if not enhanced_predictor:
            logger.error("❌ Enhanced predictor not initialized")
            return jsonify({"error": "Enhanced predictor not initialized"})
        
        logger.info("📞 Calling enhanced_predictor.get_all_retailers()")
        retailers = enhanced_predictor.get_all_retailers()
        logger.info(f"📊 Retrieved {len(retailers)} retailers from enhanced predictor")
        
        return jsonify({
            "retailers": retailers,
            "count": len(retailers),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"❌ Error in /api/retailers: {e}")
        return jsonify({"error": str(e)})

@app.route('/api/retailer/<wallet_address>')
def get_retailer(wallet_address):
    """Get specific retailer information"""
    try:
        if not enhanced_predictor:
            return jsonify({"error": "Enhanced predictor not initialized"})
        
        retailers = enhanced_predictor.get_all_retailers()
        retailer = next((r for r in retailers if r["walletAddress"] == wallet_address), None)
        
        if not retailer:
            return jsonify({"error": "Retailer not found"})
        
        return jsonify(retailer)
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/retailer/<wallet_address>/inventory')
def get_retailer_inventory(wallet_address):
    """Get combined inventory for a specific retailer"""
    try:
        if not enhanced_predictor:
            return jsonify({"error": "Enhanced predictor not initialized"})
        
        inventory = enhanced_predictor.get_combined_inventory(wallet_address)
        return jsonify({
            "retailer_wallet": wallet_address,
            "inventory": inventory,
            "total_products": len(inventory),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/retailer/<wallet_address>/recommendations')
def get_retailer_recommendations(wallet_address):
    """Get enhanced restock recommendations for a specific retailer"""
    try:
        if not enhanced_predictor:
            return jsonify({"error": "Enhanced predictor not initialized"})
        
        recommendations = enhanced_predictor.predict_restock_needs(wallet_address)
        return jsonify({
            "retailer_wallet": wallet_address,
            "recommendations": recommendations,
            "count": len(recommendations),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/retailer/<wallet_address>/alerts')
def get_retailer_alerts(wallet_address):
    """Get critical alerts for a specific retailer"""
    try:
        if not enhanced_predictor:
            return jsonify({"error": "Enhanced predictor not initialized"})
        
        recommendations = enhanced_predictor.predict_restock_needs(wallet_address)
        alerts = [rec for rec in recommendations if rec["urgency_level"] == "high"]
        
        return jsonify({
            "retailer_wallet": wallet_address,
            "alerts": alerts,
            "count": len(alerts),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/recommendations')
def get_all_recommendations():
    """Get all enhanced restock recommendations"""
    try:
        if not enhanced_predictor:
            return jsonify({"error": "Enhanced predictor not initialized"})
        
        recommendations = enhanced_predictor.get_all_recommendations()
        return jsonify({
            "recommendations": recommendations,
            "count": len(recommendations),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/alerts')
def get_critical_alerts():
    """Get all critical alerts"""
    try:
        if not enhanced_predictor:
            return jsonify({"error": "Enhanced predictor not initialized"})
        
        alerts = enhanced_predictor.get_critical_alerts()
        return jsonify({
            "alerts": alerts,
            "count": len(alerts),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/system-status')
def get_system_status():
    """Get detailed system status"""
    try:
        if not enhanced_predictor:
            return jsonify({"error": "Enhanced predictor not initialized"})
        
        status = enhanced_predictor.get_system_status()
        return jsonify(status)
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/data-sources')
def get_data_sources():
    """Get information about data sources"""
    try:
        if not enhanced_predictor:
            return jsonify({"error": "Enhanced predictor not initialized"})
        
        # Get retailers from both sources
        mongodb_retailers = enhanced_predictor.get_retailers_from_mongodb()
        local_backend_retailers = enhanced_predictor.get_retailers_from_local_backend()
        
        return jsonify({
            "mongodb": {
                "retailers_count": len(mongodb_retailers),
                "status": "connected" if enhanced_predictor.client else "disconnected"
            },
            "local_backend": {
                "retailers_count": len(local_backend_retailers),
                "status": "connected" if enhanced_predictor.local_backend_url else "disconnected"
            },
            "combined": {
                "total_retailers": len(enhanced_predictor.get_all_retailers()),
                "enhanced_predictions": True
            },
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/generate-report', methods=['POST'])
def generate_report():
    """Generate a new comprehensive report with enhanced data"""
    try:
        if not enhanced_predictor:
            return jsonify({"error": "Enhanced predictor not initialized"})
        
        # Get all recommendations
        recommendations = enhanced_predictor.get_all_recommendations()
        
        # Get system status
        system_status = enhanced_predictor.get_system_status()
        
        # Generate report data
        report = {
            "generated_at": datetime.now().isoformat(),
            "system_status": system_status,
            "total_recommendations": len(recommendations),
            "critical_alerts": len([r for r in recommendations if r["urgency_level"] == "high"]),
            "medium_alerts": len([r for r in recommendations if r["urgency_level"] == "medium"]),
            "low_alerts": len([r for r in recommendations if r["urgency_level"] == "low"]),
            "retailers_analyzed": len(set(r["retailer_wallet"] for r in recommendations)),
            "data_sources": ["mongodb", "local_backend"],
            "enhanced_integration": True,
            "recommendations": recommendations
        }
        
        # Save report to file
        report_file = f"reports/enhanced_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        os.makedirs("reports", exist_ok=True)
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        return jsonify({
            "message": "Enhanced report generated successfully",
            "report_file": report_file,
            "report": report
        })
    except Exception as e:
        return jsonify({"error": str(e)})

# Legacy endpoints for backward compatibility
@app.route('/api/map')
def get_map():
    """API endpoint to get the latest map file"""
    try:
        # Find the latest map file
        map_files = glob.glob('reports/medicine_depletion_map_*.html')
        if not map_files:
            return jsonify({'error': 'No map found'})
        
        # Get the most recent map file
        latest_map_file = max(map_files, key=os.path.getctime)
        
        return jsonify({'map_file': latest_map_file})
    
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/map')
def view_map():
    """View the depletion map"""
    try:
        # Find the latest map file
        map_files = glob.glob('reports/medicine_depletion_map_*.html')
        if not map_files:
            return "No map found. Please run the prediction system first."
        
        # Get the most recent map file
        latest_map_file = max(map_files, key=os.path.getctime)
        
        # Read and return the map HTML with UTF-8 encoding
        with open(latest_map_file, 'r', encoding='utf-8') as f:
            map_html = f.read()
        
        return map_html
    
    except Exception as e:
        return f"Error loading map: {str(e)}"

if __name__ == '__main__':
    # Ensure reports directory exists
    os.makedirs("reports", exist_ok=True)
    
    # Initialize enhanced predictor before starting server
    if initialize_enhanced_predictor():
        logger.info("✅ Enhanced PREDICT system ready with full MediChain integration")
    else:
        logger.error("❌ Failed to initialize enhanced PREDICT system")
    
    app.run(debug=True, host='0.0.0.0', port=5000) 