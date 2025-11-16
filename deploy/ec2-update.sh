#!/bin/bash

###############################################################################
# EC2 Application Update Script for NexusCRM
# 
# This script updates an existing deployment by pulling the latest code,
# rebuilding, and restarting the application.
#
# Usage:
#   cd /home/ubuntu/nexuscrm
#   chmod +x deploy/ec2-update.sh
#   ./deploy/ec2-update.sh
#
# Prerequisites:
#   - Existing deployment running
#   - Git repository with latest changes
###############################################################################

set -e  # Exit on any error

echo "=========================================="
echo "NexusCRM Application Update"
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
    exit 1
fi

# Check if PM2 process is running
if ! pm2 list | grep -q "nexuscrm"; then
    print_error "nexuscrm process not found in PM2!"
    print_warning "Please run ec2-deploy.sh first to deploy the application."
    exit 1
fi

# Backup current build (optional)
BACKUP_DIR=".next.backup.$(date +%Y%m%d_%H%M%S)"
if [ -d ".next" ]; then
    print_status "Creating backup of current build..."
    cp -r .next "$BACKUP_DIR"
    print_status "Backup created: $BACKUP_DIR"
fi

# Pull latest changes from Git
print_status "Pulling latest changes from Git..."
git pull origin main || git pull origin master

# Install/update dependencies
print_status "Installing/updating npm dependencies..."
npm install

# Build the application
print_status "Building Next.js application for production..."
npm run build

# Check if build was successful
if [ ! -d ".next" ]; then
    print_error "Build failed! Restoring from backup..."
    if [ -d "$BACKUP_DIR" ]; then
        rm -rf .next
        mv "$BACKUP_DIR" .next
        print_status "Backup restored. Application should still be running."
    fi
    exit 1
fi

# Restart application with PM2
print_status "Restarting application with PM2..."
pm2 restart nexuscrm

# Save PM2 process list
pm2 save

# Show PM2 status
print_status "PM2 process status:"
pm2 list

# Show recent logs
print_status "Recent application logs:"
pm2 logs nexuscrm --lines 20 --nostream

print_status ""
print_status "=========================================="
print_status "Application updated successfully!"
print_status "=========================================="
print_status ""
print_status "If you encounter issues, you can restore from backup:"
print_status "  rm -rf .next && mv $BACKUP_DIR .next && pm2 restart nexuscrm"
print_status ""

