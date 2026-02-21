# 🚀 Server Deployment Guide

## 📦 Package.json Updated

All dependencies have been added to `package.json`:
- helmet (v4.6.0) - Security headers
- express-rate-limit (v5.5.1) - Rate limiting
- express-validator (v6.14.3) - Input validation
- express-mongo-sanitize (v2.2.0) - NoSQL injection prevention
- hpp (v0.2.3) - HTTP Parameter Pollution protection
- file-type (v16.5.4) - File magic number validation

---

## 🎯 Quick Deployment to Server

### Option 1: Automated Deployment (Recommended)

**On your local machine:**
```bash
# Create deployment package
tar -czf qpr-deployment.tar.gz \
  --exclude=node_modules \
  --exclude=uploads \
  --exclude=logs \
  --exclude=.git \
  .

# Transfer to server
scp qpr-deployment.tar.gz user@your-server-ip:/opt/
```

**On your server:**
```bash
# Extract files
cd /opt
tar -xzf qpr-deployment.tar.gz

# Run deployment script
sudo bash deploy-server.sh
```

**That's it! The script will:**
- ✅ Install Docker & Docker Compose (if needed)
- ✅ Build images
- ✅ Start containers with Nginx
- ✅ Configure firewall
- ✅ Show access points

---

### Option 2: Manual Deployment

**1. Transfer Files to Server**
```bash
# On local machine
tar -czf qpr-deployment.tar.gz \
  --exclude=node_modules \
  --exclude=uploads \
  --exclude=logs \
  --exclude=.git \
  .

scp qpr-deployment.tar.gz user@your-server-ip:/opt/
```

**2. On Server - Install Docker**
```bash
# Update system
sudo apt-get update

# Install Docker
sudo apt-get install -y docker.io docker-compose

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
```

**3. Extract and Deploy**
```bash
cd /opt
tar -xzf qpr-deployment.tar.gz

# Build and start
sudo docker-compose build
sudo docker-compose --profile with-nginx up -d
```

**4. Configure Firewall**
```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 55516/tcp
sudo ufw enable
```

**5. Verify Deployment**
```bash
# Check containers
sudo docker-compose ps

# Check health
curl http://localhost/health

# View logs
sudo docker-compose logs -f
```

---

## 🌐 Access Your Application

After deployment, access at:

- **HTTP**: `http://your-server-ip`
- **Direct App**: `http://your-server-ip:55516`
- **Admin Login**: `http://your-server-ip` → Click "Admin Login"

**Admin Credentials:**
- Email: `admin@kitsw.ac.in`
- Password: `admin123`

---

## 🔧 Server Management Commands

```bash
# View all containers
sudo docker-compose ps

# View logs
sudo docker-compose logs -f app
sudo docker-compose logs -f mysql
sudo docker-compose logs -f nginx

# Restart services
sudo docker-compose restart

# Stop all
sudo docker-compose down

# Update application
git pull  # or upload new files
sudo docker-compose up -d --build

# Backup database
sudo docker-compose exec mysql mysqldump -u abhay -p'BrikienlabsL@12' PVBL > backup.sql

# Restore database
sudo docker-compose exec -T mysql mysql -u abhay -p'BrikienlabsL@12' PVBL < backup.sql
```

---

## 📊 Configuration Summary

**Application:**
- Port: 55516
- Environment: production
- Database: PVBL

**MySQL:**
- Port: 32306
- Database: PVBL
- User: abhay
- Password: BrikienlabsL@12

**Nginx:**
- HTTP Port: 80
- HTTPS Port: 443 (ready for SSL)

---

## 🔒 Post-Deployment Security

1. **Change Admin Password**
   - Login as admin
   - Change password immediately

2. **Update JWT Secret**
   ```bash
   # Generate new secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   
   # Update in .env
   nano .env
   # Update JWT_SECRET=<new_secret>
   
   # Restart
   sudo docker-compose restart app
   ```

3. **Configure SSL/HTTPS** (when ready)
   - Get SSL certificate (Let's Encrypt)
   - Update nginx.conf
   - Restart with SSL

4. **Set Up Backups**
   ```bash
   # Create backup script
   sudo crontab -e
   
   # Add daily backup at 2 AM
   0 2 * * * cd /opt && docker-compose exec mysql mysqldump -u abhay -p'BrikienlabsL@12' PVBL > /backups/pvbl-$(date +\%Y\%m\%d).sql
   ```

---

## 🐛 Troubleshooting

**Container won't start:**
```bash
sudo docker-compose logs app
sudo docker-compose down
sudo docker-compose up -d --build
```

**Port already in use:**
```bash
sudo lsof -i :55516
sudo lsof -i :32306
# Kill process or change port in .env
```

**Database connection failed:**
```bash
sudo docker-compose logs mysql
sudo docker-compose restart mysql
```

**Can't access from outside:**
```bash
# Check firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 55516/tcp
```

---

## ✅ Deployment Checklist

- [ ] Files transferred to server
- [ ] Docker & Docker Compose installed
- [ ] Containers built and running
- [ ] Firewall configured
- [ ] Application accessible
- [ ] Admin login working
- [ ] Admin password changed
- [ ] Database backup configured
- [ ] Monitoring set up
- [ ] SSL certificate installed (optional)

---

## 📞 Support

For issues:
1. Check logs: `sudo docker-compose logs -f`
2. Verify containers: `sudo docker-compose ps`
3. Check firewall: `sudo ufw status`
4. Review configuration: `cat .env`

Your application is ready for production! 🎉
