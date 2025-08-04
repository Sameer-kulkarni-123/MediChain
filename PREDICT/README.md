# Pharmaceutical Inventory Management System

A comprehensive AI-powered pharmaceutical inventory management system with predictive analytics, automated alerts, and web-based monitoring.

## Project Structure

```
PREDICT/
├── src/                    # Source code
│   ├── sample.py          # Main AI system implementation
│   ├── simple_demo.py     # Demo script
│   └── scheduler_setup.py # Automated scheduling
├── data/                  # Data files and databases
│   ├── pharmacy_pos.db    # POS system database
│   └── pharma_inventory_system.db # System database
├── models/                # Machine learning models
│   └── production_pharma_model.ipynb # Model training notebook
├── config/                # Configuration files
│   └── pharma_config.json # System configuration
├── reports/               # Generated reports and alerts
│   ├── critical_alerts_*.json
│   ├── inventory_report_*.txt
│   └── medicine_depletion_map_*.html
├── logs/                  # Log files
│   └── pharma_inventory.log
├── web/                   # Web application
│   ├── web_app.py        # Flask web server
│   └── templates/        # HTML templates
├── requirements.txt       # Python dependencies
└── .gitignore           # Git ignore file
```

## Features

- **Predictive Analytics**: AI-powered demand forecasting
- **Automated Alerts**: Critical stock level notifications
- **Interactive Maps**: Visual medicine depletion tracking
- **POS Integration**: Real-time sales data processing
- **Web Dashboard**: Browser-based monitoring interface
- **Automated Scheduling**: Daily analysis and weekly retraining

## Quick Start

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Demo**:
   ```bash
   python src/sample.py
   ```

3. **Start Web Application**:
   ```bash
   python web/web_app.py
   ```

4. **Setup Automated Scheduling**:
   ```bash
   python src/scheduler_setup.py
   ```

## Configuration

Edit `config/pharma_config.json` to customize:
- Medicine categories and their properties
- Supplier information
- Alert settings
- Model parameters

## File Descriptions

- **sample.py**: Main AI system with all core functionality
- **simple_demo.py**: Simplified demo version
- **web_app.py**: Flask web server for dashboard
- **pharma_config.json**: System configuration
- **requirements.txt**: Python package dependencies

## Generated Files

The system automatically generates:
- **Critical Alerts**: JSON files with urgent stock warnings
- **Inventory Reports**: Text reports with detailed analysis
- **Depletion Maps**: Interactive HTML maps showing risk levels
- **Log Files**: Detailed system activity logs

## Notes

- All databases are stored in the `data/` directory
- Reports and alerts are saved in the `reports/` directory
- Logs are stored in the `logs/` directory
- The system maintains only the latest generated files to avoid clutter 