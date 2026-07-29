from apscheduler.schedulers.blocking import BlockingScheduler
import subprocess
import sys

def run_radar():
    print("Scheduled Radar run starting...")
    subprocess.run([sys.executable, "main.py"])

scheduler = BlockingScheduler()
scheduler.add_job(run_radar, "cron", hour=8, minute=0)  # runs daily at 8:00 AM

if __name__ == "__main__":
    print("Radar scheduler started. Waiting for next scheduled run (daily 8:00 AM)...")
    print("Press Ctrl+C to stop.")
    try:
        scheduler.start()
    except KeyboardInterrupt:
        print("Scheduler stopped.")