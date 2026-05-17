import os
import time
import subprocess
import json

SERVICE_NAME = "pv_app"
MIN_REPLICAS = 2
MAX_REPLICAS = 10
UP_THRESHOLD = 70.0
DOWN_THRESHOLD = 20.0

def get_cpu_usage():
    try:
        # Get stats for the service containers
        cmd = "docker stats --no-stream --format '{{.CPUPerc}}'"
        result = subprocess.check_output(cmd, shell=True).decode('utf-8')
        percentages = [float(p.replace('%', '')) for p in result.splitlines() if p]
        if not percentages: return 0
        return sum(percentages) / len(percentages)
    except:
        return 0

def get_current_replicas():
    cmd = f"docker service inspect {SERVICE_NAME} --format '{{{{.Spec.Mode.Replicated.Replicas}}}}'"
    return int(subprocess.check_output(cmd, shell=True).decode('utf-8').strip())

def scale_service(replicas):
    print(f"🚀 Scaling {SERVICE_NAME} to {replicas} replicas...")
    subprocess.run(f"docker service scale {SERVICE_NAME}={replicas}", shell=True)

def monitor():
    print(f"📊 Auto-scaler started for {SERVICE_NAME} (Min: {MIN_REPLICAS}, Max: {MAX_REPLICAS})")
    while True:
        cpu = get_cpu_usage()
        current = get_current_replicas()
        
        print(f"📈 Current CPU: {cpu}% | Replicas: {current}")
        
        if cpu > UP_THRESHOLD and current < MAX_REPLICAS:
            scale_service(current + 1)
        elif cpu < DOWN_THRESHOLD and current > MIN_REPLICAS:
            scale_service(current - 1)
            
        time.sleep(30)

if __name__ == "__main__":
    monitor()
