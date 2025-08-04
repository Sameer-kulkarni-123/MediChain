
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
        