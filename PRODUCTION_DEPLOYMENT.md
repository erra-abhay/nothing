# Production Server Deployment Guide

## 🚀 Server Configuration

Your application is configured for production deployment with:

- **Application Port**: 55516
- **MySQL Port**: 32306 (to avoid conflict with existing MySQL on 3306)
- **Database Name**: PVBL
- **Database User**: abhay
- **Database Password**: BrikienlabsL@12

---

## 📋 Pre-Deployment Checklist

### 1. Transfer Files to Server

```bash
# On your local machine, create a deployment package
tar -czf qpr-app.tar.gz \
  --exclude=node_modules \
  --exclude=uploads \
  --exclude=logs \
  --exclude=.git \
  .

# Transfer to server
scp qpr-app.tar.gz user@your-server:/path/to/deployment/

# On server, extract
ssh user@your-server
cd /path/to/deployment/
tar -xzf qpr-app.tar.gz
```

### 2. Verify Docker Installation

```bash
# Check Docker
docker --version

# Check Docker Compose
docker-compose --version

# If not installed, install them:
# sudo apt-get update
# sudo apt-get install -y docker.io docker-compose
```

### 3. Configure Environment

The `.env` file is already configured with your settings:
- Database: PVBL
- User: abhay
- Password: BrikienlabsL@12
- App Port: 55516
- MySQL Port: 32306

---

## 🔧 Deployment Steps

### 1. Stop Existing Containers (if any)

```bash
docker-compose down
```

### 2. Build and Start

```bash
# Build images
docker-compose build

# Start containers
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Verify Deployment

```bash
# Check container status
docker-compose ps

# Test health endpoint
curl http://localhost:55516/health

# Check application
curl http://localhost:55516
```

---

## 🌐 Access Points

### On Server

- **Application**: http://localhost:55516
- **Health Check**: http://localhost:55516/health
- **MySQL**: localhost:32306

### External Access

- **Application**: http://your-server-ip:55516
- **MySQL**: your-server-ip:32306 (if firewall allows)

---

## 🔒 Firewall Configuration

### Allow Application Port

```bash
# UFW (Ubuntu)
sudo ufw allow 55516/tcp
sudo ufw status

# Or iptables
sudo iptables -A INPUT -p tcp --dport 55516 -j ACCEPT
sudo iptables-save
```

### Optional: Allow MySQL Port (if needed externally)

```bash
sudo ufw allow 32306/tcp
```

---

## 🗄️ Database Setup

The database will be automatically created with the schema on first run.

### Manual Database Access

```bash
# Via Docker
docker-compose exec mysql mysql -u abhay -p'BrikienlabsL@12' PVBL

# Or from host (if MySQL client installed)
mysql -h localhost -P 32306 -u abhay -p'BrikienlabsL@12' PVBL
```

### Import Existing Data (if needed)

```bash
# If you have existing data to import
docker-compose exec -T mysql mysql -u abhay -p'BrikienlabsL@12' PVBL < your_data.sql
```

---

## 📊 Monitoring

### View Logs

```bash
# Application logs
docker-compose logs -f app

# MySQL logs
docker-compose logs -f mysql

# Security logs (inside container)
docker-compose exec app tail -f logs/security-$(date +%Y-%m-%d).log
```

### Check Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

---

## 🔄 Updates and Maintenance

### Update Application

```bash
# Pull latest code
git pull  # or transfer new files

# Rebuild and restart
docker-compose up -d --build

# Check logs
docker-compose logs -f app
```

### Backup Database

```bash
# Backup
docker-compose exec mysql mysqldump -u abhay -p'BrikienlabsL@12' PVBL > backup-$(date +%Y%m%d).sql

# Restore
docker-compose exec -T mysql mysql -u abhay -p'BrikienlabsL@12' PVBL < backup-20260126.sql
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart app only
docker-compose restart app

# Restart MySQL only
docker-compose restart mysql
```

---

## 🐛 Troubleshooting

### Port Already in Use

**Issue**: Port 55516 or 32306 already in use

**Solution**:
```bash
# Check what's using the port
sudo lsof -i :55516
sudo lsof -i :32306

# Kill the process or change port in .env
```

### Database Connection Failed

**Issue**: App can't connect to database

**Solution**:
```bash
# Check MySQL is running
docker-compose ps mysql

# Check logs
docker-compose logs mysql

# Verify credentials
docker-compose exec mysql mysql -u abhay -p'BrikienlabsL@12' PVBL
```

### Container Won't Start

**Issue**: Container exits immediately

**Solution**:
```bash
# Check logs
docker-compose logs app

# Rebuild
docker-compose up -d --build --force-recreate
```

---

## 📝 Important Notes

1. **Port 55516**: Application is accessible on this port
2. **Port 32306**: MySQL is accessible on this port (not 3306)
3. **Database Name**: PVBL (not question_paper_repo)
4. **Credentials**: Username `abhay`, password `BrikienlabsL@12`
5. **Existing MySQL**: Your existing MySQL on port 3306 is not affected

---

## ✅ Quick Start Commands

```bash
# Start everything
docker-compose up -d

# Check status
docker-compose ps
curl http://localhost:55516/health

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Restart
docker-compose restart
```

---

## 🎯 Next Steps

1. Deploy to server
2. Configure firewall (allow port 55516)
3. Test application access
4. Set up SSL/HTTPS (when ready)
5. Configure domain name
6. Set up automated backups
7. Configure monitoring/alerts

Your application is ready for production deployment! 🚀
