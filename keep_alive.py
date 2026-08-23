"""
ResumeIQ Backend Keep-Alive Script
----------------------------------
Prevents Render free-tier web services from sleeping (cold-start delay).
Can be run locally, via cron job, or scheduled on free uptime monitors like UptimeRobot.
"""

import urllib.request
import os
import time

# Set your Render backend URL here or via environment variable RENDER_BACKEND_URL
BACKEND_URL = os.environ.get("RENDER_BACKEND_URL", "https://your-backend.onrender.com")

def ping_health():
    endpoint = f"{BACKEND_URL.rstrip('/')}/health"
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Pinging backend health endpoint: {endpoint}")
    try:
        req = urllib.request.Request(
            endpoint,
            headers={'User-Agent': 'ResumeIQ-KeepAlive/1.0'}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            if response.status == 200:
                print(f"✅ Success! Status: {response.status}. Backend is active and warm.")
            else:
                print(f"⚠️ Warning! Status code: {response.status}")
    except Exception as e:
        print(f"❌ Ping failed: {e}")

if __name__ == "__main__":
    ping_health()
