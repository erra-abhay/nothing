# Quick Start - Manual Steps

Since the automated script needs sudo password, here are the manual steps:

## 1. Install Docker Compose

```bash
sudo apt-get install -y docker-compose
```

## 2. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
nano .env
```

**Important: Update these in .env:**
- `DB_PASSWORD` - Change from default
- `JWT_SECRET` - Generate new one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- `DOMAIN` - Your domain name
- `ALLOWED_ORIGINS` - Your domain URLs

## 3. Build and Start

```bash
# Build images
docker-compose build

# Start containers
docker-compose up -d

# View logs
docker-compose logs -f
```

## 4. Verify

```bash
# Check status
docker-compose ps

# Test health endpoint
curl http://localhost:3000/health

# Test application
curl http://localhost:3000
```

## 5. Access

- **Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Admin Login**: admin@kitsw.ac.in / admin123

## Common Commands

```bash
# View logs
docker-compose logs -f app

# Stop
docker-compose down

# Restart
docker-compose restart

# Rebuild
docker-compose up -d --build
```

## Troubleshooting

If you get permission errors:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

For more details, see [DOCKER.md](file:///home/abhay/folder/DOCKER.md)
