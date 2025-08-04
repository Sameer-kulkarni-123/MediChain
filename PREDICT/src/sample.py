import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import json
import sqlite3
import folium
from folium.plugins import MarkerCluster
import logging
from typing import Dict, List, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

# Machine Learning imports
from sklearn.model_selection import train_test_split, TimeSeriesSplit, cross_val_score
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GridSearchCV
import joblib

class ProductionPharmaceuticalInventoryAI:
    def __init__(self, config_file: str = 'config/pharma_config.json'):
        """Initialize the production system with configuration"""
        # Initialize basic attributes first
        self.models = {}
        self.scalers = {}
        self.evaluation_results = {}
        self.feature_importance = {}
        self.db_connection = None
        
        # Setup logging first
        self.setup_logging()
        
        # Then load configuration
        self.config = self.load_configuration(config_file)
        
        # Finally setup database
        self.setup_database()
        
    def setup_logging(self):
        """Setup logging for the system"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('logs/pharma_inventory.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
    def load_configuration(self, config_file: str) -> Dict:
        """Load system configuration from JSON file"""
        default_config = {
            "medicine_categories": {
                "antibiotics": {
                    "seasonal_pattern": "winter_peak",
                    "volatility": 0.4,
                    "critical_stock_days": 3,
                    "reorder_multiplier": 2.0
                },
                "pain_relief": {
                    "seasonal_pattern": "stable",
                    "volatility": 0.2,
                    "critical_stock_days": 5,
                    "reorder_multiplier": 1.5
                },
                "cold_flu": {
                    "seasonal_pattern": "winter_peak",
                    "volatility": 0.6,
                    "critical_stock_days": 2,
                    "reorder_multiplier": 3.0
                },
                "allergy": {
                    "seasonal_pattern": "spring_peak",
                    "volatility": 0.5,
                    "critical_stock_days": 4,
                    "reorder_multiplier": 2.5
                },
                "chronic_disease": {
                    "seasonal_pattern": "stable",
                    "volatility": 0.1,
                    "critical_stock_days": 7,
                    "reorder_multiplier": 1.8
                },
                "vitamins": {
                    "seasonal_pattern": "stable",
                    "volatility": 0.3,
                    "critical_stock_days": 10,
                    "reorder_multiplier": 1.2
                }
            },
            "suppliers": {
                "supplier_1": {
                    "name": "MedSupply Corp",
                    "lead_time_days": 3,
                    "minimum_order": 100,
                    "reliability_score": 0.95,
                    "contact_email": "orders@medsupply.com"
                },
                "supplier_2": {
                    "name": "PharmaDistributor Ltd",
                    "lead_time_days": 7,
                    "minimum_order": 50,
                    "reliability_score": 0.90,
                    "contact_email": "orders@pharmadist.com"
                }
            },
            "alert_settings": {
                "web_alerts_enabled": True,
                "alert_recipients": ["manager@pharmacy.com", "inventory@pharmacy.com"],
                "alert_frequency_hours": 6,
                "map_center_lat": 12.9716,
                "map_center_lon": 77.5946,
                "map_zoom": 11
            },
            "pos_integration": {
                "database_type": "sqlite",  # or "mysql", "postgresql"
                "connection_string": "pharmacy_pos.db",
                "sales_table": "sales_transactions",
                "inventory_table": "current_inventory",
                "sync_frequency_minutes": 30
            },
            "model_settings": {
                "retrain_frequency_days": 30,
                "model_type": "random_forest",
                "validation_split": 0.2,
                "max_prediction_days": 30
            }
        }
        
        try:
            with open(config_file, 'r') as f:
                user_config = json.load(f)
                # Merge with defaults
                for key, value in user_config.items():
                    if isinstance(value, dict) and key in default_config:
                        default_config[key].update(value)
                    else:
                        default_config[key] = value
                return default_config
        except FileNotFoundError:
            self.logger.info(f"Config file {config_file} not found. Creating default configuration.")
            with open(config_file, 'w') as f:
                json.dump(default_config, f, indent=4)
            return default_config
    
    def setup_database(self):
        """Setup database connection for storing results and logs"""
        try:
            self.db_connection = sqlite3.connect('data/pharma_inventory_system.db')
            cursor = self.db_connection.cursor()
            
            # Create tables for system data
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS predictions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    medicine_id TEXT,
                    medicine_name TEXT,
                    predicted_demand REAL,
                    current_stock INTEGER,
                    days_until_stockout REAL,
                    risk_level TEXT,
                    recommended_order_quantity INTEGER
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS alerts_sent (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    medicine_id TEXT,
                    alert_type TEXT,
                    message TEXT,
                    recipients TEXT
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS model_performance (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    model_name TEXT,
                    mae REAL,
                    rmse REAL,
                    r2_score REAL,
                    feature_importance TEXT
                )
            ''')
            
            self.db_connection.commit()
            self.logger.info("Database setup completed successfully")
            
        except Exception as e:
            self.logger.error(f"Database setup failed: {str(e)}")
            # Create a new database connection if the previous one failed
            try:
                self.db_connection = sqlite3.connect('data/pharma_inventory_system.db')
                self.logger.info("Database connection re-established")
            except Exception as e2:
                self.logger.error(f"Failed to re-establish database connection: {str(e2)}")
    
    def load_real_sales_data(self, file_path: str = None, pos_integration: bool = True) -> pd.DataFrame:
        """Load real sales data from file or POS system"""
        if pos_integration and file_path is None:
            return self.load_from_pos_system()
        elif file_path:
            return self.load_from_file(file_path)
        else:
            self.logger.warning("No data source specified. Using synthetic data for demo.")
            return self.generate_demo_data()
    
    def load_from_file(self, file_path: str) -> pd.DataFrame:
        """Load sales data from CSV/Excel file"""
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_path.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file_path)
            else:
                raise ValueError("Unsupported file format. Use CSV or Excel.")
            
            # Validate required columns
            required_columns = ['date', 'medicine_id', 'medicine_name', 'quantity_sold', 'current_stock']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                raise ValueError(f"Missing required columns: {missing_columns}")
            
            # Data preprocessing
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values(['medicine_id', 'date'])
            
            self.logger.info(f"Successfully loaded {len(df)} records from {file_path}")
            return df
            
        except Exception as e:
            self.logger.error(f"Failed to load data from {file_path}: {str(e)}")
            raise
    
    def load_from_pos_system(self) -> pd.DataFrame:
        """Load data from POS system database"""
        try:
            pos_config = self.config['pos_integration']
            
            if pos_config['database_type'] == 'sqlite':
                pos_conn = sqlite3.connect('data/' + pos_config['connection_string'])
            else:
                # For MySQL/PostgreSQL, you'd use appropriate connectors
                raise NotImplementedError("MySQL/PostgreSQL integration not implemented in this demo")
            
            # Query sales data
            sales_query = f"""
                SELECT 
                    s.transaction_date as date,
                    s.medicine_id,
                    s.medicine_name,
                    s.quantity as quantity_sold,
                    i.current_stock,
                    i.unit_price,
                    i.category,
                    i.supplier_id,
                    i.shelf_life_days
                FROM {pos_config['sales_table']} s
                JOIN {pos_config['inventory_table']} i ON s.medicine_id = i.medicine_id
                WHERE s.transaction_date >= date('now', '-2 years')
                ORDER BY s.medicine_id, s.transaction_date
            """
            
            df = pd.read_sql_query(sales_query, pos_conn)
            pos_conn.close()
            
            # Convert date column to datetime
            df['date'] = pd.to_datetime(df['date'])
            
            self.logger.info(f"Successfully loaded {len(df)} records from POS system")
            return df
            
        except Exception as e:
            self.logger.error(f"Failed to load data from POS system: {str(e)}")
            # Fallback to demo data
            return self.generate_demo_data()
    
    def generate_demo_data(self) -> pd.DataFrame:
        """Generate demo data based on configured categories"""
        np.random.seed(42)
        categories = list(self.config['medicine_categories'].keys())
        n_medicines = 50
        n_days = 730  # 2 years
        
        data = []
        start_date = datetime(2022, 1, 1)
        
        for med_id in range(n_medicines):
            category = np.random.choice(categories)
            category_config = self.config['medicine_categories'][category]
            
            # Assign supplier
            supplier_id = np.random.choice(list(self.config['suppliers'].keys()))
            supplier = self.config['suppliers'][supplier_id]
            
            med_name = f"{category}_{med_id:03d}"
            unit_price = np.random.uniform(5, 200)
            shelf_life_days = np.random.choice([30, 60, 90, 180, 365, 730])
            
            base_demand = np.random.uniform(10, 50)
            
            for day in range(n_days):
                current_date = start_date + timedelta(days=day)
                
                # Seasonal patterns based on category
                seasonal_factor = self.calculate_seasonal_factor(
                    day, category_config['seasonal_pattern']
                )
                
                # Calculate demand
                demand = max(0, base_demand * seasonal_factor + 
                           np.random.normal(0, category_config['volatility'] * base_demand))
                
                # Stock calculation
                current_stock = max(0, np.random.poisson(demand * 15))
                
                data.append({
                    'date': current_date,
                    'medicine_id': med_id,
                    'medicine_name': med_name,
                    'category': category,
                    'quantity_sold': int(demand),
                    'current_stock': current_stock,
                    'unit_price': unit_price,
                    'shelf_life_days': shelf_life_days,
                    'supplier_id': supplier_id,
                    'supplier_lead_time': supplier['lead_time_days'],
                    'supplier_minimum_order': supplier['minimum_order']
                })
        
        return pd.DataFrame(data)
    
    def calculate_seasonal_factor(self, day_of_year: int, pattern: str) -> float:
        """Calculate seasonal factor based on pattern type"""
        if pattern == "winter_peak":
            # Peak in winter (December-February)
            return 1 + 0.5 * np.sin(2 * np.pi * (day_of_year + 90) / 365)
        elif pattern == "spring_peak":
            # Peak in spring (March-May)
            return 1 + 0.4 * np.sin(2 * np.pi * (day_of_year - 60) / 365)
        elif pattern == "summer_peak":
            # Peak in summer (June-August)
            return 1 + 0.3 * np.sin(2 * np.pi * (day_of_year - 150) / 365)
        else:  # stable
            return 1.0
    
    def enhanced_feature_engineering(self, df: pd.DataFrame) -> pd.DataFrame:
        """Enhanced feature engineering with category-specific features"""
        df = df.copy()
        df = df.sort_values(['medicine_id', 'date'])
        
        # Basic lag features
        for lag in [1, 3, 7, 14, 30]:
            df[f'demand_lag_{lag}'] = df.groupby('medicine_id')['quantity_sold'].shift(lag)
        
        # Rolling statistics
        for window in [7, 14, 30]:
            df[f'demand_rolling_mean_{window}'] = (
                df.groupby('medicine_id')['quantity_sold']
                .rolling(window, min_periods=1)
                .mean()
                .reset_index(level=0, drop=True)
            )
            df[f'demand_rolling_std_{window}'] = (
                df.groupby('medicine_id')['quantity_sold']
                .rolling(window, min_periods=1)
                .std()
                .reset_index(level=0, drop=True)
            )
        
        # Category-specific features (optional - not used in notebook model)
        # Commented out to match pre-trained model features
        # df['category_volatility'] = df['category'].map(
        #     {cat: config['volatility'] for cat, config in self.config['medicine_categories'].items()}
        # )
        # df['category_critical_days'] = df['category'].map(
        #     {cat: config['critical_stock_days'] for cat, config in self.config['medicine_categories'].items()}
        # )
        
        # Supplier features (optional - not used in notebook model)
        # Commented out to match pre-trained model features
        # if 'supplier_id' in df.columns:
        #     supplier_reliability = {sid: config['reliability_score'] 
        #                           for sid, config in self.config['suppliers'].items()}
        #     df['supplier_reliability'] = df['supplier_id'].map(supplier_reliability).fillna(0.8)
        
        # Time-based features
        df['day_of_week'] = df['date'].dt.dayofweek
        df['month'] = df['date'].dt.month
        df['day_of_year'] = df['date'].dt.dayofyear
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        
        # Cyclical encoding
        df['sin_day_of_year'] = np.sin(2 * np.pi * df['day_of_year'] / 365)
        df['cos_day_of_year'] = np.cos(2 * np.pi * df['day_of_year'] / 365)
        df['sin_day_of_week'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['cos_day_of_week'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        
        # Stock ratios
        df['stock_to_demand_ratio'] = df['current_stock'] / (df['quantity_sold'] + 1)
        df['days_of_stock'] = df['current_stock'] / (df['quantity_sold'] + 1)
        
        # Price features
        df['price_tier'] = pd.cut(df['unit_price'], bins=3, labels=['low', 'medium', 'high'])
        le = LabelEncoder()
        df['price_tier_encoded'] = le.fit_transform(df['price_tier'].astype(str))
        df['category_encoded'] = le.fit_transform(df['category'])
        
        return df
    
    def load_pretrained_model(self):
        """Load the pre-trained model from the notebook"""
        try:
            model = joblib.load('models/production_pharma_model.pkl')
            self.models['production'] = model
            self.logger.info("Successfully loaded pre-trained model from production_pharma_model.pkl")
            return True
        except FileNotFoundError:
            self.logger.warning("Pre-trained model not found. Will train a new model.")
            return False
        except Exception as e:
            self.logger.error(f"Error loading pre-trained model: {str(e)}")
            return False
        except ImportError as e:
            self.logger.error(f"Import error loading pre-trained model: {str(e)}")
            return False

    def train_production_models(self, df: pd.DataFrame):
        """Train models for production use or load pre-trained model"""
        self.logger.info("Starting model setup for production...")
        
        # Try to load pre-trained model first
        if self.load_pretrained_model():
            self.logger.info("Using pre-trained model from production_pharma_model.ipynb")
            # Feature engineering for prediction
            df_features = self.enhanced_feature_engineering(df)
            df_clean = df_features.dropna()
            return None, None, df_clean
        
        # If no pre-trained model, train a new one
        self.logger.info("Training new model for production...")
        
        # Feature engineering
        df_features = self.enhanced_feature_engineering(df)
        
        # Prepare data (matching notebook features)
        feature_columns = [
            'demand_lag_1', 'demand_lag_3', 'demand_lag_7', 'demand_lag_14', 'demand_lag_30',
            'demand_rolling_mean_7', 'demand_rolling_mean_14', 'demand_rolling_mean_30',
            'demand_rolling_std_7', 'demand_rolling_std_14', 'demand_rolling_std_30',
            'current_stock', 'stock_to_demand_ratio', 'days_of_stock',
            'unit_price', 'shelf_life_days', 'supplier_lead_time',
            'day_of_week', 'month', 'is_weekend',
            'sin_day_of_year', 'cos_day_of_year', 'sin_day_of_week', 'cos_day_of_week',
            'category_encoded', 'price_tier_encoded'
        ]
        
        # Remove rows with NaN values
        df_clean = df_features.dropna()
        X = df_clean[feature_columns]
        y = df_clean['quantity_sold']
        
        # Train best model based on configuration
        model_type = self.config['model_settings']['model_type']
        
        if model_type == 'random_forest':
            model = RandomForestRegressor(
                n_estimators=200,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
        elif model_type == 'gradient_boosting':
            model = GradientBoostingRegressor(
                n_estimators=150,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            )
        else:
            model = LinearRegression()
        
        # Time series validation
        tscv = TimeSeriesSplit(n_splits=5)
        cv_scores = cross_val_score(model, X, y, cv=tscv, scoring='neg_mean_absolute_error')
        
        # Train final model
        model.fit(X, y)
        y_pred = model.predict(X)
        
        # Store model and results
        self.models['production'] = model
        self.evaluation_results['production'] = {
            'cv_mae': -cv_scores.mean(),
            'cv_mae_std': cv_scores.std(),
            'train_mae': mean_absolute_error(y, y_pred),
            'train_rmse': np.sqrt(mean_squared_error(y, y_pred)),
            'train_r2': r2_score(y, y_pred)
        }
        
        if hasattr(model, 'feature_importances_'):
            self.feature_importance['production'] = dict(zip(feature_columns, model.feature_importances_))
        
        # Save model to disk
        joblib.dump(model, 'models/production_pharma_model.pkl')
        
        # Log performance to database
        self.log_model_performance('production', self.evaluation_results['production'])
        
        self.logger.info(f"Production model trained successfully. MAE: {mean_absolute_error(y, y_pred):.2f}")
        
        return X, y, df_clean
    
    def predict_and_alert(self, df: pd.DataFrame, days_ahead: int = 7) -> pd.DataFrame:
        """Make predictions and trigger alerts for critical medicines"""
        model = self.models['production']
        
        # Get latest data for each medicine
        latest_data = df.groupby('medicine_id').last().reset_index()
        
        predictions = []
        critical_alerts = []
        
        for _, medicine_data in latest_data.iterrows():
            medicine_id = medicine_data['medicine_id']
            current_stock = medicine_data['current_stock']
            category = medicine_data['category']
            
            # Get category-specific settings
            category_config = self.config['medicine_categories'].get(category, {})
            critical_days = category_config.get('critical_stock_days', 5)
            reorder_multiplier = category_config.get('reorder_multiplier', 2.0)
            
            # Prepare features for prediction (matching the notebook model)
            feature_columns = [
                'demand_lag_1', 'demand_lag_3', 'demand_lag_7', 'demand_lag_14', 'demand_lag_30',
                'demand_rolling_mean_7', 'demand_rolling_mean_14', 'demand_rolling_mean_30',
                'demand_rolling_std_7', 'demand_rolling_std_14', 'demand_rolling_std_30',
                'current_stock', 'stock_to_demand_ratio', 'days_of_stock',
                'unit_price', 'shelf_life_days', 'supplier_lead_time',
                'day_of_week', 'month', 'is_weekend',
                'sin_day_of_year', 'cos_day_of_year', 'sin_day_of_week', 'cos_day_of_week',
                'category_encoded', 'price_tier_encoded'
            ]
            
            # Add missing columns with default values
            for col in feature_columns:
                if col not in medicine_data:
                    if col == 'supplier_lead_time':
                        medicine_data[col] = 7  # Default lead time
                    elif col == 'shelf_life_days':
                        medicine_data[col] = 365  # Default shelf life
                    else:
                        medicine_data[col] = 0  # Default for other missing columns
            
            # Predict demand
            try:
                X_pred = medicine_data[feature_columns].values.reshape(1, -1)
                predicted_demand = model.predict(X_pred)[0] * days_ahead
                
                # Calculate days until stockout
                if predicted_demand > 0:
                    days_until_stockout = current_stock / (predicted_demand / days_ahead)
                else:
                    days_until_stockout = float('inf')
                
                # Determine risk level
                if days_until_stockout <= critical_days:
                    risk_level = 'CRITICAL'
                elif days_until_stockout <= critical_days * 2:
                    risk_level = 'HIGH'
                elif days_until_stockout <= critical_days * 3:
                    risk_level = 'MEDIUM'
                else:
                    risk_level = 'LOW'
                
                # Calculate recommended order quantity
                recommended_order = max(0, predicted_demand * reorder_multiplier - current_stock)
                
                # Apply supplier minimum order
                supplier_id = medicine_data.get('supplier_id')
                if supplier_id and supplier_id in self.config['suppliers']:
                    min_order = self.config['suppliers'][supplier_id]['minimum_order']
                    if recommended_order > 0 and recommended_order < min_order:
                        recommended_order = min_order
                
                prediction = {
                    'medicine_id': medicine_id,
                    'medicine_name': medicine_data['medicine_name'],
                    'category': category,
                    'current_stock': current_stock,
                    'predicted_demand_7days': predicted_demand,
                    'days_until_stockout': days_until_stockout,
                    'risk_level': risk_level,
                    'recommended_order_quantity': int(recommended_order),
                    'supplier_id': supplier_id,
                    'unit_price': medicine_data.get('unit_price', 0)
                }
                
                predictions.append(prediction)
                
                # Add to critical alerts if needed
                if risk_level in ['CRITICAL', 'HIGH']:
                    critical_alerts.append(prediction)
                    
            except Exception as e:
                self.logger.error(f"Prediction failed for medicine {medicine_id}: {str(e)}")
                continue
        
        predictions_df = pd.DataFrame(predictions).sort_values('days_until_stockout')
        
        # Save predictions to database
        self.save_predictions_to_db(predictions_df)
        
        # Generate depletion map
        map_filename = self.generate_depletion_map(predictions_df)
        
        # Send web alerts for critical medicines
        if critical_alerts:
            self.send_web_alerts(critical_alerts)
        
        return predictions_df
    
    def save_predictions_to_db(self, predictions_df: pd.DataFrame):
        """Save predictions to database"""
        try:
            if self.db_connection is None:
                self.logger.warning("Database connection not available. Skipping database save.")
                return
                
            cursor = self.db_connection.cursor()
            for _, row in predictions_df.iterrows():
                cursor.execute('''
                    INSERT INTO predictions 
                    (medicine_id, medicine_name, predicted_demand, current_stock, 
                     days_until_stockout, risk_level, recommended_order_quantity)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    row['medicine_id'], row['medicine_name'], row['predicted_demand_7days'],
                    row['current_stock'], row['days_until_stockout'], 
                    row['risk_level'], row['recommended_order_quantity']
                ))
            self.db_connection.commit()
            self.logger.info(f"Saved {len(predictions_df)} predictions to database")
        except Exception as e:
            self.logger.error(f"Failed to save predictions to database: {str(e)}")
    
    def generate_depletion_map(self, predictions_df: pd.DataFrame) -> str:
        """Generate interactive map showing medicine depletion risk"""
        try:
            # Add fake lat/lon coordinates (inside Bangalore region)
            np.random.seed(42)
            predictions_df = predictions_df.copy()
            predictions_df['lat'] = np.random.uniform(12.85, 13.10, len(predictions_df))
            predictions_df['lon'] = np.random.uniform(77.45, 77.65, len(predictions_df))
            
            # Create Folium Map
            map_config = self.config['alert_settings']
            m = folium.Map(
                location=[map_config['map_center_lat'], map_config['map_center_lon']], 
                zoom_start=map_config['map_zoom']
            )
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
                        <b>Recommended Order:</b> {row['recommended_order_quantity']} units<br>
                        """, 
                        max_width=300
                    )
                ).add_to(marker_cluster)
            
            # Save map
            map_filename = f"reports/medicine_depletion_map_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
            m.save(map_filename)
            
            # Ensure the file is saved with UTF-8 encoding
            try:
                with open(map_filename, 'r', encoding='utf-8') as f:
                    content = f.read()
                with open(map_filename, 'w', encoding='utf-8') as f:
                    f.write(content)
            except Exception as e:
                self.logger.warning(f"Could not re-encode map file: {str(e)}")
            
            self.logger.info(f"Depletion map saved as {map_filename}")
            return map_filename
            
        except Exception as e:
            self.logger.error(f"Failed to generate depletion map: {str(e)}")
            return None

    def send_web_alerts(self, critical_alerts: List[Dict]):
        """Send web-based alerts for critical stock situations"""
        if not self.config['alert_settings']['web_alerts_enabled']:
            return
        
        try:
            # Create web alert content
            alert_content = {
                'timestamp': datetime.now().isoformat(),
                'alert_count': len(critical_alerts),
                'critical_medicines': []
            }
            
            for alert in critical_alerts:
                alert_content['critical_medicines'].append({
                    'medicine_name': alert['medicine_name'],
                    'category': alert['category'],
                    'current_stock': alert['current_stock'],
                    'days_until_stockout': round(alert['days_until_stockout'], 1),
                    'risk_level': alert['risk_level'],
                    'recommended_order': alert['recommended_order_quantity']
                })
            
            # Save alert to JSON file for web app consumption
            alert_filename = f"reports/critical_alerts_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(alert_filename, 'w') as f:
                json.dump(alert_content, f, indent=2)
            
            # Log alert to database
            if self.db_connection is not None:
                try:
                    cursor = self.db_connection.cursor()
                    cursor.execute('''
                        INSERT INTO alerts_sent (medicine_id, alert_type, message, recipients)
                        VALUES (?, ?, ?, ?)
                    ''', (
                        ','.join([str(alert['medicine_id']) for alert in critical_alerts]),
                        'WEB_ALERT',
                        f"Critical stock alert - {len(critical_alerts)} medicines",
                        'web_app'
                    ))
                    self.db_connection.commit()
                except Exception as e:
                    self.logger.error(f"Failed to log alert to database: {str(e)}")
            
            self.logger.info(f"Web alert saved as {alert_filename} with {len(critical_alerts)} critical medicines")
            
        except Exception as e:
            self.logger.error(f"Failed to send web alerts: {str(e)}")
    
    def log_model_performance(self, model_name: str, performance: Dict):
        """Log model performance to database"""
        try:
            if self.db_connection is None:
                self.logger.warning("Database connection not available. Skipping performance logging.")
                return
                
            cursor = self.db_connection.cursor()
            cursor.execute('''
                INSERT INTO model_performance 
                (model_name, mae, rmse, r2_score, feature_importance)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                model_name,
                performance['train_mae'],
                performance['train_rmse'],
                performance['train_r2'],
                json.dumps(self.feature_importance.get(model_name, {}))
            ))
            self.db_connection.commit()
        except Exception as e:
            self.logger.error(f"Failed to log model performance: {str(e)}")
    
    def generate_comprehensive_report(self, predictions_df: pd.DataFrame) -> str:
        """Generate comprehensive inventory report"""
        total_medicines = len(predictions_df)
        critical_count = len(predictions_df[predictions_df['risk_level'] == 'CRITICAL'])
        high_count = len(predictions_df[predictions_df['risk_level'] == 'HIGH'])
        
        # Calculate financial metrics
        total_order_value = (predictions_df['recommended_order_quantity'] * 
                           predictions_df['unit_price']).sum()
        
        # Category analysis
        category_summary = predictions_df.groupby('category').agg({
            'risk_level': lambda x: (x.isin(['CRITICAL', 'HIGH'])).sum(),
            'recommended_order_quantity': 'sum',
            'unit_price': 'mean'
        }).round(2)
        
        report = f"""
        ================================================================
                    PHARMACEUTICAL INVENTORY MANAGEMENT REPORT
        ================================================================
        Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        
        EXECUTIVE SUMMARY
        -----------------------------------------------------------------
        Total Medicines Monitored:     {total_medicines:,}
        Critical Stock Alerts:         {critical_count:,} ({critical_count/total_medicines*100:.1f}%)
        High Risk Medicines:           {high_count:,} ({high_count/total_medicines*100:.1f}%)
        Total Recommended Order Value: ${total_order_value:,.2f}
        
        IMMEDIATE ACTION REQUIRED
        -----------------------------------------------------------------
        """
        
        # Critical medicines details
        critical_medicines = predictions_df[predictions_df['risk_level'] == 'CRITICAL'].head(10)
        if len(critical_medicines) > 0:
            report += "\n        TOP CRITICAL MEDICINES:\n"
            for _, med in critical_medicines.iterrows():
                report += f"        • {med['medicine_name']} ({med['category']})\n"
                report += f"          Stock: {med['current_stock']:.0f} | Days: {med['days_until_stockout']:.1f} | Order: {med['recommended_order_quantity']:.0f}\n"
        
        report += f"""
        
        CATEGORY RISK ANALYSIS
        -----------------------------------------------------------------
        """
        
        for category, data in category_summary.iterrows():
            total_in_cat = len(predictions_df[predictions_df['category'] == category])
            risk_pct = (data['risk_level'] / total_in_cat) * 100
            report += f"        {category.upper():<20} | High Risk: {data['risk_level']:2.0f}/{total_in_cat:2.0f} ({risk_pct:4.1f}%) | Avg Price: ${data['unit_price']:6.2f}\n"
        
        # Model performance
        if 'production' in self.evaluation_results:
            perf = self.evaluation_results['production']
            report += f"""
        
        MODEL PERFORMANCE
        -----------------------------------------------------------------
        Cross-Validation MAE:    {perf['cv_mae']:.2f} ± {perf['cv_mae_std']:.2f}
        Training MAE:            {perf['train_mae']:.2f}
        Training RMSE:           {perf['train_rmse']:.2f}
        R² Score:                {perf['train_r2']:.3f}
        """
        
        # Top feature importance
        if 'production' in self.feature_importance:
            top_features = sorted(self.feature_importance['production'].items(), 
                                key=lambda x: x[1], reverse=True)[:5]
            report += "\n        TOP PREDICTIVE FEATURES:\n"
            for feature, importance in top_features:
                report += f"        • {feature:<25} | Importance: {importance:.3f}\n"
        
        report += f"""
        
        RECOMMENDATIONS
        -----------------------------------------------------------------
        1. Immediate Orders Required: {critical_count + high_count} medicines
        2. Priority Categories: {', '.join(category_summary.nlargest(3, 'risk_level').index)}
        3. Total Investment Needed: ${total_order_value:,.2f}
        4. Next Model Retrain: {(datetime.now() + timedelta(days=self.config['model_settings']['retrain_frequency_days'])).strftime('%Y-%m-%d')}
        
        ================================================================
        """
        
        return report
    
    def run_automated_pipeline(self, data_file: str = None):
        """Run the complete automated pipeline"""
        try:
            self.logger.info("Starting automated pharmaceutical inventory pipeline...")
            
            # Step 1: Load data
            df = self.load_real_sales_data(data_file)
            self.logger.info(f"Loaded {len(df)} sales records")
            
            # Step 2: Train models
            X, y, df_clean = self.train_production_models(df)
            
            # Step 3: Make predictions and send alerts
            predictions = self.predict_and_alert(df_clean)
            
            # Step 4: Generate report
            report = self.generate_comprehensive_report(predictions)
            
            # Step 5: Save report
            report_filename = f"reports/inventory_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            with open(report_filename, 'w') as f:
                f.write(report)
            
            self.logger.info(f"Pipeline completed successfully. Report saved as {report_filename}")
            
            print(report)
            return predictions, report
            
        except Exception as e:
            self.logger.error(f"Pipeline failed: {str(e)}")
            raise
    
    def setup_scheduler(self):
        """Setup automated scheduling (requires schedule library)"""
        schedule_code = '''
# To set up automated scheduling, install the schedule library:
# pip install schedule

import schedule
import time

def run_daily_analysis():
    """Run daily inventory analysis"""
    try:
        ai_system = ProductionPharmaceuticalInventoryAI()
        ai_system.run_automated_pipeline()
    except Exception as e:
        print(f"Daily analysis failed: {e}")

def run_model_retrain():
    """Run weekly model retraining"""
    try:
        ai_system = ProductionPharmaceuticalInventoryAI()
        # Load fresh data and retrain
        df = ai_system.load_real_sales_data()
        ai_system.train_production_models(df)
        print("Model retrained successfully")
    except Exception as e:
        print(f"Model retraining failed: {e}")

# Schedule jobs
schedule.every().day.at("08:00").do(run_daily_analysis)
schedule.every().week.at("02:00").do(run_model_retrain)

# Run scheduler
while True:
    schedule.run_pending()
    time.sleep(60)  # Check every minute
        '''
        
        with open('src/scheduler_setup.py', 'w') as f:
            f.write(schedule_code)
        
        self.logger.info("Scheduler setup code saved to scheduler_setup.py")

# Integration Helper Functions
class POSIntegration:
    """Helper class for POS system integration"""
    
    @staticmethod
    def create_sample_pos_database():
        """Create a sample POS database for testing"""
        conn = sqlite3.connect('data/pharmacy_pos.db')
        cursor = conn.cursor()
        
        # Create sales table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sales_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_date DATE,
                medicine_id TEXT,
                medicine_name TEXT,
                quantity INTEGER,
                unit_price REAL,
                total_amount REAL
            )
        ''')
        
        # Create inventory table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS current_inventory (
                medicine_id TEXT PRIMARY KEY,
                medicine_name TEXT,
                category TEXT,
                current_stock INTEGER,
                unit_price REAL,
                supplier_id TEXT,
                shelf_life_days INTEGER,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert sample data
        import random
        categories = ['antibiotics', 'pain_relief', 'cold_flu', 'allergy', 'chronic_disease', 'vitamins']
        suppliers = ['supplier_1', 'supplier_2']
        
        # Sample inventory
        for i in range(50):
            cursor.execute('''
                INSERT OR REPLACE INTO current_inventory 
                (medicine_id, medicine_name, category, current_stock, unit_price, supplier_id, shelf_life_days)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                f'MED_{i:03d}',
                f'{random.choice(categories)}_{i:03d}',
                random.choice(categories),
                random.randint(10, 500),
                round(random.uniform(5, 200), 2),
                random.choice(suppliers),
                random.choice([30, 60, 90, 180, 365, 730])
            ))
        
        # Sample sales transactions (last 2 years)
        start_date = datetime.now() - timedelta(days=730)
        for day in range(730):
            current_date = start_date + timedelta(days=day)
            
            # Random number of transactions per day
            num_transactions = random.randint(10, 50)
            
            for _ in range(num_transactions):
                med_id = f'MED_{random.randint(0, 49):03d}'
                quantity = random.randint(1, 10)
                unit_price = round(random.uniform(5, 200), 2)
                
                cursor.execute('''
                    INSERT INTO sales_transactions 
                    (transaction_date, medicine_id, medicine_name, quantity, unit_price, total_amount)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    current_date.date(),
                    med_id,
                    f'medicine_{med_id}',
                    quantity,
                    unit_price,
                    quantity * unit_price
                ))
        
        conn.commit()
        conn.close()
        print("Sample POS database created successfully!")

# Demo and Setup Functions
def setup_production_system():
    """Setup the production system with all configurations"""
    print("Setting up Production Pharmaceutical Inventory System...")
    
    # Create sample POS database
    POSIntegration.create_sample_pos_database()
    
    # Initialize the system
    ai_system = ProductionPharmaceuticalInventoryAI()
    
    # Create sample configuration file
    config = {
        "medicine_categories": {
            "antibiotics": {
                "seasonal_pattern": "winter_peak",
                "volatility": 0.4,
                "critical_stock_days": 3,
                "reorder_multiplier": 2.0
            },
            "pain_relief": {
                "seasonal_pattern": "stable",
                "volatility": 0.2,
                "critical_stock_days": 5,
                "reorder_multiplier": 1.5
            },
            "cold_flu": {
                "seasonal_pattern": "winter_peak",
                "volatility": 0.6,
                "critical_stock_days": 2,
                "reorder_multiplier": 3.0
            }
        },
        "suppliers": {
            "supplier_1": {
                "name": "MedSupply Corp",
                "lead_time_days": 3,
                "minimum_order": 100,
                "reliability_score": 0.95,
                "contact_email": "orders@medsupply.com"
            }
        },
        "alert_settings": {
            "email_enabled": False,  # Set to True and configure SMTP for real alerts
            "alert_recipients": ["manager@pharmacy.com"]
        }
    }
    
    with open('config/pharma_config.json', 'w') as f:
        json.dump(config, f, indent=4)
    
    print("Configuration file created: config/pharma_config.json")
    print("Sample POS database created: data/pharmacy_pos.db")
    print("System database initialized: data/pharma_inventory_system.db")
    
    # Setup scheduler
    ai_system.setup_scheduler()
    print("Scheduler setup code created: src/scheduler_setup.py")
    
    return ai_system

def run_production_demo():
    """Run a complete production demo"""
    print("PRODUCTION PHARMACEUTICAL INVENTORY SYSTEM DEMO")
    print("=" * 80)
    
    # Setup system
    ai_system = setup_production_system()
    
    # Run the automated pipeline
    predictions, report = ai_system.run_automated_pipeline()
    
    # Display key results
    print("\nKEY INSIGHTS:")
    critical_meds = predictions[predictions['risk_level'] == 'CRITICAL']
    print(f"• {len(critical_meds)} medicines need CRITICAL attention")
    print(f"• Total recommended order value: ${(predictions['recommended_order_quantity'] * predictions['unit_price']).sum():,.2f}")
    
    if len(critical_meds) > 0:
        print(f"\nTOP CRITICAL MEDICINE:")
        top_critical = critical_meds.iloc[0]
        print(f"• {top_critical['medicine_name']} ({top_critical['category']})")
        print(f"• Current stock: {top_critical['current_stock']}")
        print(f"• Days until stockout: {top_critical['days_until_stockout']:.1f}")
        print(f"• Recommended order: {top_critical['recommended_order_quantity']} units")
    
    return ai_system, predictions

# Run the production demo
if __name__ == "__main__":
    try:
        ai_system, predictions = run_production_demo()
        print("\nProduction system demo completed successfully!")
        print("\nNext steps:")
        print("1. Configure your email settings in pharma_config.json")
        print("2. Replace sample data connection with your real POS system")
        print("3. Run 'python scheduler_setup.py' for automated monitoring")
        print("4. Customize medicine categories for your inventory")
        
    except Exception as e:
        print(f"Demo failed: {str(e)}")
        print("Please check the logs for detailed error information.")