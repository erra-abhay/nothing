#!/bin/bash

# Server Deployment Script
# Run this on your production server

echo "================================================"
echo "Question Paper Repository - Server Deployment"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker not found. Installing Docker...${NC}"
    apt-get update
    apt-get install -y docker.io
    systemctl start docker
    systemctl enable docker
else
    echo -e "${GREEN}✓ Docker is installed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 2: Checking Docker Compose installation...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose not found. Installing...${NC}"
    apt-get install -y docker-compose
else
    echo -e "${GREEN}✓ Docker Compose is installed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3: Stopping any existing containers...${NC}"
docker-compose down 2>/dev/null || true

echo ""
echo -e "${YELLOW}Step 4: Building Docker images...${NC}"
docker-compose build

echo ""
echo -e "${YELLOW}Step 5: Starting containers with Nginx...${NC}"
docker-compose --profile with-nginx up -d

echo ""
echo -e "${YELLOW}Step 6: Waiting for services to be ready...${NC}"
sleep 10

echo ""
echo -e "${YELLOW}Step 7: Checking container status...${NC}"
docker-compose ps

echo ""
echo -e "${YELLOW}Step 8: Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 55516/tcp
    echo -e "${GREEN}✓ Firewall rules added${NC}"
else
    echo -e "${YELLOW}⚠ UFW not found. Please configure firewall manually:${NC}"
    echo "  - Allow port 80 (HTTP)"
    echo "  - Allow port 443 (HTTPS)"
    echo "  - Allow port 55516 (Application)"
fi

echo ""
echo "================================================"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo "================================================"
echo ""
echo "Access Points:"
echo "  - HTTP: http://your-server-ip"
echo "  - Direct App: http://your-server-ip:55516"
echo "  - MySQL: your-server-ip:32306"
echo ""
echo "Admin Credentials:"
echo "  - Email: admin@kitsw.ac.in"
echo "  - Password: admin123"
echo ""
echo "Database:"
echo "  - Name: PVBL"
echo "  - User: abhay"
echo "  - Password: BrikienlabsL@12"
echo ""
echo "Useful Commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Restart: docker-compose restart"
echo "  - Stop: docker-compose down"
echo ""
echo -e "${YELLOW}⚠ IMPORTANT: Change admin password after first login!${NC}"
echo "================================================"
