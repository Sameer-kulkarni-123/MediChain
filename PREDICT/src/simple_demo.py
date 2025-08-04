#!/usr/bin/env python3
"""
Simplified demo for pharmaceutical inventory system with web alerts and map
"""

import pandas as pd
import numpy as np
import joblib
import folium
from folium.plugins import MarkerCluster
from datetime import datetime, timedelta
import json
import warnings
warnings.filterwarnings('ignore')

def generate_simple_data():
    """Generate simple test data"""
    np.random.seed(42)
    
    # Create 50 medicines with realistic data
    medicines = []
    categories = ['antibiotics', 'pain_relief', 'cold_flu', 'allergy', 'chronic_disease', 'vitamins']
    
    for i in range(50):
        category = np.random.choice(categories)
        current_stock = np.random.randint(10, 500)
        unit_price = np.random.uniform(5, 200)
        
        # Calculate days until stockout based on category
        if category == 'antibiotics':
            daily_demand = np.random.uniform(5, 15)
        elif category == 'pain_relief':
            daily_demand = np.random.uniform(8, 20)
        elif category == 'cold_flu':
            daily_demand = np.random.uniform(3, 10)
        else:
            daily_demand = np.random.uniform(2, 8)
        
        days_until_stockout = current_stock / daily_demand if daily_demand > 0 else float('inf')
        
        # Determine risk level
        if days_until_stockout <= 3:
            risk_level = 'CRITICAL'
        elif days_until_stockout <= 7:
            risk_level = 'HIGH'
        elif days_until_stockout <= 14:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'LOW'
        
        medicines.append({
            'medicine_id': f'MED_{i:03d}',
            'medicine_name': f'{category}_{i:03d}',
            'category': category,
            'current_stock': current_stock,
            'unit_price': unit_price,
            'daily_demand': daily_demand,
            'days_until_stockout': days_until_stockout,
            'risk_level': risk_level,
            'recommended_order': max(0, daily_demand * 14 - current_stock)
        })
    
    return pd.DataFrame(medicines)

def generate_depletion_map(predictions_df):
    """Generate interactive map showing medicine depletion risk"""
    # Add fake lat/lon coordinates (inside Bangalore region)
    np.random.seed(42)
    predictions_df = predictions_df.copy()
    predictions_df['lat'] = np.random.uniform(12.85, 13.10, len(predictions_df))
    predictions_df['lon'] = np.random.uniform(77.45, 77.65, len(predictions_df))
    
    # Create Folium Map
    m = folium.Map(location=[12.9716, 77.5946], zoom_start=11)
    marker_cluster = MarkerCluster().add_to(m)
    
    # Color scheme for risk levels
    risk_colors = {
        'CRITICAL': 'red',
        'HIGH': 'orange',
        'MEDIUM': 'blue',
        'LOW': 'green'
    }
    
    # Add markers for each medicine
    for _, row in predictions_df.iterrows():
        folium.CircleMarker(
            location=[row['lat'], row['lon']],
            radius=8,
            color=risk_colors.get(row['risk_level'], 'gray'),
            fill=True,
            fill_color=risk_colors.get(row['risk_level'], 'gray'),
            fill_opacity=0.7,
                            popup=folium.Popup(
                f"""
                <b>Medicine:</b> {row['medicine_name']}<br>
                <b>Category:</b> {row['category']}<br>
                <b>Current Stock:</b> {row['current_stock']}<br>
                <b>Days Until Stockout:</b> {row['days_until_stockout']:.1f}<br>
                <b>Risk Level:</b> <span style='color:{risk_colors[row['risk_level']]}'>{row['risk_level']}</span><br>
                <b>Recommended Order:</b> {row['recommended_order']:.0f} units<br>
                """, 
                max_width=300
            )
        ).add_to(marker_cluster)
    
    # Save map
    map_filename = f"medicine_depletion_map_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
    m.save(map_filename)
    
    # Ensure the file is saved with UTF-8 encoding
    try:
        with open(map_filename, 'r', encoding='utf-8') as f:
            content = f.read()
        with open(map_filename, 'w', encoding='utf-8') as f:
            f.write(content)
    except Exception as e:
        print(f"Warning: Could not re-encode map file: {str(e)}")
    
    print(f"Depletion map saved as {map_filename}")
    return map_filename

def create_web_alerts(predictions_df):
    """Create web alerts for critical medicines"""
    critical_medicines = predictions_df[predictions_df['risk_level'].isin(['CRITICAL', 'HIGH'])]
    
    alert_content = {
        'timestamp': datetime.now().isoformat(),
        'alert_count': len(critical_medicines),
        'critical_medicines': []
    }
    
    for _, medicine in critical_medicines.iterrows():
        alert_content['critical_medicines'].append({
            'medicine_name': medicine['medicine_name'],
            'category': medicine['category'],
            'current_stock': medicine['current_stock'],
            'days_until_stockout': round(medicine['days_until_stockout'], 1),
            'risk_level': medicine['risk_level'],
            'recommended_order': int(medicine['recommended_order'])
        })
    
    # Save alert to JSON file
    alert_filename = f"critical_alerts_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(alert_filename, 'w') as f:
        json.dump(alert_content, f, indent=2)
    
    print(f"Web alerts saved as {alert_filename}")
    return alert_filename

def main():
    """Main demo function"""
    print("PHARMACEUTICAL INVENTORY SYSTEM DEMO")
    print("=" * 60)
    
    # Generate data
    print("\n1️⃣ Generating pharmaceutical data...")
    predictions_df = generate_simple_data()
    print(f"Generated data for {len(predictions_df)} medicines")
    
    # Analyze results
    critical_count = len(predictions_df[predictions_df['risk_level'] == 'CRITICAL'])
    high_count = len(predictions_df[predictions_df['risk_level'] == 'HIGH'])
    total_value = (predictions_df['recommended_order'] * predictions_df['unit_price']).sum()
    
    print(f"\nANALYSIS RESULTS:")
    print(f"• Total medicines: {len(predictions_df)}")
    print(f"• Critical alerts: {critical_count}")
    print(f"• High risk: {high_count}")
    print(f"• Total recommended order value: ${total_value:,.2f}")
    
    # Generate map
    print("\n2️⃣ Generating depletion map...")
    map_filename = generate_depletion_map(predictions_df)
    
    # Create web alerts
    print("\n3️⃣ Creating web alerts...")
    alert_filename = create_web_alerts(predictions_df)
    
    # Display critical medicines
    critical_meds = predictions_df[predictions_df['risk_level'] == 'CRITICAL']
    if len(critical_meds) > 0:
        print(f"\nCRITICAL MEDICINES ({len(critical_meds)}):")
        for _, med in critical_meds.head(5).iterrows():
            print(f"• {med['medicine_name']} ({med['category']})")
            print(f"  Stock: {med['current_stock']} | Days: {med['days_until_stockout']:.1f} | Order: {med['recommended_order']:.0f}")
    
    print(f"\nDEMO COMPLETED!")
    print(f"Files created:")
    print(f"• Map: {map_filename}")
    print(f"• Alerts: {alert_filename}")
    print(f"\nTo view the web dashboard, run: python web_app.py")
    
    return predictions_df

if __name__ == "__main__":
    main() 