# Question Paper Repository - Docker Deployment Guide

## 🐳 Quick Start

### Prerequisites
- Docker installed ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed ([Install Docker Compose](https://docs.docker.com/compose/install/))

### 1. Clone and Setup

```bash
# Navigate to project directory
cd /home/abhay/folder

# Copy environment template
cp .env.example .env

# Edit .env file with your settings
nano .env
```

### 2. Configure Environment

**Important settings in `.env`:**

```bash
# Database password (CHANGE THIS!)
DB_PASSWORD=your_secure_password_here

# JWT Secret (GENERATE A NEW ONE!)
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_generated_secret_here

# Protocol (http for now, https later)
PROTOCOL=http
DOMAIN=yourdomain.com

# Allowed origins for CORS
ALLOWED_ORIGINS=http://yourdomain.com,http://www.yourdomain.com
```

### 3. Build and Run

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Access Application

- **Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **MySQL**: localhost:3306

---

## 📋 Docker Commands

### Container Management

```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# Restart containers
docker-compose restart

# View logs
docker-compose logs -f app
docker-compose logs -f mysql

# Execute commands in container
docker-compose exec app sh
docker-compose exec mysql mysql -u root -p
```

### Database Management

```bash
# Access MySQL shell
docker-compose exec mysql mysql -u root -p${DB_PASSWORD} question_paper_repo

# Backup database
docker-compose exec mysql mysqldump -u root -p${DB_PASSWORD} question_paper_repo > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u root -p${DB_PASSWORD} question_paper_repo < backup.sql

# View database logs
docker-compose logs mysql
```

### Application Management

```bash
# View application logs
docker-compose logs -f app

# Restart application only
docker-compose restart app

# Rebuild application
docker-compose up -d --build app

# View application shell
docker-compose exec app sh
```

---

## 🔄 Migrating from HTTP to HTTPS

When you're ready to enable HTTPS, follow these steps:

### Step 1: Obtain SSL Certificate

**Option A: Let's Encrypt (Free)**
```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates will be in:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

**Option B: Commercial Certificate**
- Purchase from provider
- Follow provider's instructions

### Step 2: Copy Certificates

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Copy certificates (adjust paths as needed)
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Set permissions
sudo chmod 644 nginx/ssl/fullchain.pem
sudo chmod 600 nginx/ssl/privkey.pem
```

### Step 3: Update Configuration

**Edit `.env`:**
```bash
PROTOCOL=https
DOMAIN=yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Edit `nginx/nginx.conf`:**
- Uncomment the HTTPS server block
- Uncomment the HTTP to HTTPS redirect
- Update `server_name` with your domain

### Step 4: Enable Nginx and Restart

```bash
# Start with nginx profile
docker-compose --profile with-nginx up -d

# View logs
docker-compose logs -f nginx
```

### Step 5: Test HTTPS

```bash
# Test SSL configuration
curl -I https://yourdomain.com

# Check certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

---

## 🔧 Configuration Options

### Without Nginx (HTTP Only - Current Setup)

```bash
# Start without nginx
docker-compose up -d

# Access directly on port 3000
http://localhost:3000
```

### With Nginx (For HTTPS - Future)

```bash
# Start with nginx
docker-compose --profile with-nginx up -d

# Access via nginx
http://localhost:80 (redirects to HTTPS)
https://localhost:443
```

---

## 📦 Data Persistence

All data is stored in Docker volumes:

```bash
# List volumes
docker volume ls | grep qpr

# Backup volumes
docker run --rm -v qpr_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz /data
docker run --rm -v qpr_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads_backup.tar.gz /data

# Restore volumes
docker run --rm -v qpr_mysql_data:/data -v $(pwd):/backup alpine tar xzf /backup/mysql_backup.tar.gz -C /

# Remove volumes (WARNING: Deletes all data!)
docker-compose down -v
```

---

## 🐛 Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose logs app

# Check if MySQL is ready
docker-compose logs mysql | grep "ready for connections"

# Restart services
docker-compose restart
```

### Database connection errors

```bash
# Verify MySQL is running
docker-compose ps mysql

# Check database credentials in .env
cat .env | grep DB_

# Test connection
docker-compose exec mysql mysql -u root -p${DB_PASSWORD} -e "SHOW DATABASES;"
```

### Port already in use

```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :3306

# Change ports in .env
APP_PORT=3001
```

### Permission errors

```bash
# Fix upload directory permissions
docker-compose exec app chown -R nodejs:nodejs /app/uploads /app/logs
```

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] Change `DB_PASSWORD` in `.env`
- [ ] Generate new `JWT_SECRET`
- [ ] Update `ALLOWED_ORIGINS` with your domain
- [ ] Set `NODE_ENV=production`
- [ ] Configure firewall rules
- [ ] Set up SSL certificates (when ready for HTTPS)
- [ ] Enable automatic backups
- [ ] Configure log rotation
- [ ] Review and update nginx configuration
- [ ] Test all security features

---

## 📊 Monitoring

### Health Checks

```bash
# Application health
curl http://localhost:3000/health

# Docker health status
docker-compose ps
```

### Logs

```bash
# Application logs
docker-compose logs -f app

# Security logs (inside container)
docker-compose exec app tail -f logs/security-$(date +%Y-%m-%d).log

# MySQL logs
docker-compose logs -f mysql
```

### Resource Usage

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
git pull

# Rebuild and restart
docker-compose up -d --build

# Check logs
docker-compose logs -f app
```

### Update Dependencies

```bash
# Update package.json
# Then rebuild
docker-compose build --no-cache app
docker-compose up -d app
```

### Database Migrations

```bash
# Access MySQL
docker-compose exec mysql mysql -u root -p${DB_PASSWORD} question_paper_repo

# Run migration SQL
# Or copy SQL file and execute
docker cp migration.sql qpr_mysql:/tmp/
docker-compose exec mysql mysql -u root -p${DB_PASSWORD} question_paper_repo < /tmp/migration.sql
```

---

## 🆘 Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Review [SECURITY.md](file:///home/abhay/folder/SECURITY.md)
3. Check Docker documentation
4. Contact system administrator

---

## 📝 Notes

- **Current Setup**: HTTP only, direct access to Node.js app
- **Future Setup**: HTTPS with Nginx reverse proxy
- **No Code Changes Needed**: Just update `.env` and nginx config when migrating to HTTPS
- **Automatic Backups**: Set up cron jobs for regular backups
- **SSL Renewal**: Let's Encrypt certificates expire every 90 days - set up auto-renewal
