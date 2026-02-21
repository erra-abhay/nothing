#!/bin/bash

# Script to create MySQL user and configure database access

echo "Creating MySQL user 'abhay' and setting up permissions..."
echo "You'll be prompted for the MySQL root password"
echo ""

# Create user and grant permissions
sudo mysql -u root -p << EOF
-- Create user 'abhay' with password
CREATE USER IF NOT EXISTS 'abhay'@'localhost' IDENTIFIED BY 'your_password_here';

-- Grant all privileges on the question_paper_repo database
GRANT ALL PRIVILEGES ON question_paper_repo.* TO 'abhay'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Show the user was created
SELECT User, Host FROM mysql.user WHERE User = 'abhay';
EOF

echo ""
echo "✓ User 'abhay' created successfully!"
echo "✓ Permissions granted on question_paper_repo database"
echo ""
echo "Next steps:"
echo "1. Update .env file with DB_USER=abhay and DB_PASSWORD=your_password_here"
echo "2. Run: mysql -u abhay -p < config/schema.sql"
