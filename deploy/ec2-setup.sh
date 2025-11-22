#!/bin/bash

###############################################################################
# EC2 Initial Server Setup Script for Contact360
# 
# This script performs the initial setup of an Ubuntu 22.04 EC2 instance
# for deploying a Next.js application with Nginx and PM2.
#
# Usage:
#   chmod +x deploy/ec2-setup.sh
#   ./deploy/ec2-setup.sh
#
# Prerequisites:
#   - Ubuntu 22.04 LTS EC2 instance
#   - SSH access with sudo privileges
#   - Internet connectivity
###############################################################################

set -e  # Exit on any error

echo "=========================================="
echo "Contact360 EC2 Server Setup"
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

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or with sudo"
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
print_status "Installing essential packages (git, build-essential, ufw, nginx)..."
apt install -y git build-essential ufw nginx curl

# Configure firewall
print_status "Configuring firewall (UFW)..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
print_status "Firewall configured. SSH and Nginx ports are open."

# Install Node.js 20.x LTS
print_status "Installing Node.js 20.x LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
print_status "Node.js installed: $NODE_VERSION"
print_status "npm installed: $NPM_VERSION"

# Install PM2 globally
print_status "Installing PM2 process manager..."
npm install -g pm2

# Configure PM2 to start on boot
print_status "Configuring PM2 to start on system boot..."
pm2 startup systemd -u ubuntu --hp /home/ubuntu
print_warning "Please run the command shown above to enable PM2 startup."

# Create application directory
APP_DIR="/home/ubuntu/contact360"
if [ ! -d "$APP_DIR" ]; then
    print_status "Creating application directory: $APP_DIR"
    mkdir -p "$APP_DIR"
    chown ubuntu:ubuntu "$APP_DIR"
fi

# Create logs directory
LOGS_DIR="$APP_DIR/logs"
if [ ! -d "$LOGS_DIR" ]; then
    print_status "Creating logs directory: $LOGS_DIR"
    mkdir -p "$LOGS_DIR"
    chown ubuntu:ubuntu "$LOGS_DIR"
fi

print_status ""
print_status "=========================================="
print_status "Server setup completed successfully!"
print_status "=========================================="
print_status ""
print_status "Next steps:"
print_status "1. Clone your repository:"
print_status "   cd /home/ubuntu"
print_status "   git clone https://github.com/thekoushikdurgas/appointment.git contact360"
print_status ""
print_status "2. Create .env.production file with your environment variables"
print_status ""
print_status "3. Run the deployment script:"
print_status "   cd /home/ubuntu/contact360"
print_status "   chmod +x deploy/ec2-deploy.sh"
print_status "   ./deploy/ec2-deploy.sh"
print_status ""

