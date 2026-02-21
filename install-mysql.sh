#!/bin/bash

# MySQL Installation and Setup Script for Question Paper Repository

echo "========================================="
echo "MySQL Installation and Configuration"
echo "========================================="
echo ""

# Update package list
echo "Updating package list..."
sudo apt-get update

# Install MySQL Server
echo ""
echo "Installing MySQL Server..."
sudo apt-get install -y mysql-server

# Start MySQL service
echo ""
echo "Starting MySQL service..."
sudo systemctl start mysql
sudo systemctl enable mysql

# Check MySQL status
echo ""
echo "MySQL Status:"
sudo systemctl status mysql --no-pager

echo ""
echo "========================================="
echo "MySQL Installation Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Set MySQL root password: sudo mysql_secure_installation"
echo "2. Update .env file with your MySQL password"
echo "3. Run the database schema: mysql -u root -p < config/schema.sql"
echo ""
