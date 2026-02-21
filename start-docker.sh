#!/bin/bash

# Question Paper Repository - Quick Start Script

echo "🚀 Question Paper Repository - Docker Setup"
echo "============================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    
    echo "⚠️  IMPORTANT: Please update the following in .env file:"
    echo "   - DB_PASSWORD (change from default)"
    echo "   - JWT_SECRET (generate a new one)"
    echo "   - DOMAIN (your domain name)"
    echo "   - ALLOWED_ORIGINS (your domain URLs)"
    echo ""
    echo "Generate JWT_SECRET with:"
    echo "   node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    echo ""
    read -p "Press Enter to continue after updating .env file..."
else
    echo "✅ .env file exists"
fi

echo ""
echo "🔨 Building Docker images..."
docker-compose build

echo ""
echo "🚀 Starting containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "✅ Setup complete!"
echo ""
echo "📍 Access points:"
echo "   - Application: http://localhost:3000"
echo "   - Health Check: http://localhost:3000/health"
echo "   - MySQL: localhost:3306"
echo ""
echo "📋 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop: docker-compose down"
echo "   - Restart: docker-compose restart"
echo ""
echo "📚 For more information, see DOCKER.md"
