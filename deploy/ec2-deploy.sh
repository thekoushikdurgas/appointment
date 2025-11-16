#!/bin/bash

###############################################################################
# EC2 Application Deployment Script for NexusCRM
# 
# This script deploys the Next.js application to the EC2 server.
# It should be run from the application directory after cloning the repository.
#
# Usage:
#   cd /home/ubuntu/nexuscrm
#   chmod +x deploy/ec2-deploy.sh
#   ./deploy/ec2-deploy.sh
#
# Prerequisites:
#   - Server setup completed (run ec2-setup.sh first)
#   - Repository cloned to /home/ubuntu/nexuscrm
#   - .env.production file created with production environment variables
###############################################################################

set -e  # Exit on any error

echo "=========================================="
echo "NexusCRM Application Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to application directory
cd "$APP_DIR"

print_status "Working directory: $APP_DIR"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    print_warning "Please create .env.production file with your production environment variables."
    print_warning "You can use .env.production.example as a template."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please run ec2-setup.sh first."
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Please run ec2-setup.sh first."
    exit 1
fi

# Install dependencies
print_status "Installing npm dependencies..."
npm install

# Build the application
print_status "Building Next.js application for production..."
npm run build

# Check if build was successful
if [ ! -d ".next" ]; then
    print_error "Build failed! .next directory not found."
    exit 1
fi

print_status "Build completed successfully!"

# Stop existing PM2 process if running
if pm2 list | grep -q "nexuscrm"; then
    print_warning "Stopping existing nexuscrm process..."
    pm2 stop nexuscrm || true
    pm2 delete nexuscrm || true
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 process list
print_status "Saving PM2 process list..."
pm2 save

# Show PM2 status
print_status "PM2 process status:"
pm2 list

print_status ""
print_status "=========================================="
print_status "Application deployed successfully!"
print_status "=========================================="
print_status ""
print_status "Application is running on: http://localhost:3000"
print_status ""
print_status "Next steps:"
print_status "1. Configure Nginx (see deploy/ec2-nginx.conf)"
print_status "2. Test the application: pm2 logs nexuscrm"
print_status "3. Access via EC2 public IP: http://3.88.218.42"
print_status ""

