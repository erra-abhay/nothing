# PaperVault Kubernetes Command Center

This guide contains all the commands needed to manage the PaperVault production environment on your HPE ProLiant server.

---

## 🚀 1. Deployment & Updates
Use these when you make changes to the code or manifests.

**On your Laptop (Sync code):**
```bash
rsync -avz --exclude 'node_modules' --exclude '.next' . ethan@30.30.30.27:~/papervault-nextjs
```

**On the HPE Server (Build & Apply):**
```bash
# 1. Build the new image
cd ~/papervault-nextjs
docker build -t localhost:32000/papervault-nextjs:latest .
docker push localhost:32000/papervault-nextjs:latest

# 2. Apply all configurations
kubectl apply -k kubernetes/base/

# 3. Force pods to use the new image
kubectl rollout restart deployment/papervault-app -n papervault
```

---

## 📊 2. Comprehensive Monitoring & Status
Use these to understand exactly what is happening inside your cluster.

### **A. Quick Overviews**
```bash
# See ALL resources in your namespace (Pods, SVC, Deploy, HPA)
kubectl get all -n papervault

# See Pods with more detail (IP addresses and Node name)
kubectl get pods -n papervault -o wide

# See a summary of all namespaces (System health)
kubectl get pods -A
```

### **B. Live Resource Usage (Real-time Stats)**
```bash
# CPU and Memory usage for all App Pods
kubectl top pods -n papervault

# Resource usage for the physical HPE Server
kubectl top nodes
```

### **C. Audit & History**
```bash
# See recent system events (Crashing pods, scaling events, etc.)
kubectl get events -n papervault --sort-by='.lastTimestamp'

# See deployment history
kubectl rollout history deployment/papervault-app -n papervault
```

### **D. Network & Ingress Status**
```bash
# See your public entry point and IP
kubectl get ingress -n papervault

# See internal service IPs and Ports
kubectl get svc -n papervault

# Check if the Ingress Controller is healthy
kubectl get pods -n ingress
```

### **E. Auto-Scaling Status**
```bash
# Watch the HPA decide when to scale up/down
kubectl get hpa -n papervault -w
```

---

## 📺 4. Live Monitoring (Real-time Dashboards)
Use these for a continuous "Control Room" view.

### **A. Terminal "Watch" Mode**
```bash
# Watch pod status changes live in your terminal
watch -n 1 kubectl get pods -n papervault

# Watch resource usage (CPU/RAM) live
watch -n 2 kubectl top pods -n papervault
```

### **B. Graphical Dashboard (The Pro Way)**
MicroK8s comes with a beautiful web-based dashboard.
```bash
# 1. Enable the dashboard addon
microk8s enable dashboard

# 2. Start the proxy (This gives you a URL)
microk8s dashboard-proxy
```
*(Open the URL provided in your browser to see graphs, logs, and stats in real-time)*

### **C. Log Streaming (Multi-replica)**
```bash
# Live stream logs from all app replicas at once
kubectl logs -f -n papervault -l app=papervault-app --max-log-requests=10
```

---

## 🔍 3. Advanced Troubleshooting & Debugging
Use these to find the "needle in the haystack."

### **A. Deep Log Analysis**
```bash
# Stream logs from ALL replicas of the app at once
kubectl logs -n papervault -l app=papervault-app --tail=100 -f

# See logs for a pod that just crashed (Previous instance)
kubectl logs -n papervault <pod-name> --previous

# Search logs for a specific error string
kubectl logs -n papervault deployment/papervault-app | grep "Error"
```

### **B. Deep Inspections**
```bash
# See the full internal configuration of a pod
kubectl get pod -n papervault <pod-name> -o yaml

# Inspect the Ingress rules and SSL certificate link
kubectl describe ingress -n papervault papervault-ingress
```

### **C. Cluster Health (MicroK8s Specific)**
```bash
# Check if MicroK8s itself is running correctly
microk8s status

# See which addons are enabled
microk8s status --yaml | grep -A 20 addons
```

---

## 💾 4. Database & Redis Management
Directly interact with your data layers.

```bash
# Import/Reset Database Schema
kubectl exec -i -n papervault deployment/mysql -- mysql -uabhay -pBrikienlabsL@12 PVBL < scripts/init.sql

# Enter MySQL Shell
kubectl exec -it -n papervault deployment/mysql -- mysql -uabhay -pBrikienlabsL@12 PVBL

# Check Redis Search Index status
kubectl exec -it -n papervault deployment/redis -- redis-cli FT._LIST
```

---

## 🔒 5. SSL & Networking
Manage your domains and certificates.

```bash
# Check SSL Certificate status
kubectl get certificate -n papervault

# Check SSL Challenge progress (if pending)
kubectl get challenges -n papervault

# See all external entry points
kubectl get ingress -n papervault
```

---

## 🛠 6. Scaling & Maintenance
```bash
# Manually scale to 5 replicas (ignoring HPA temporarily)
kubectl scale deployment/papervault-app -n papervault --replicas=5

# Delete everything (Caution!)
# kubectl delete -k kubernetes/base/
```
