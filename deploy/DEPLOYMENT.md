# NexusCRM EC2 Deployment Guide

Complete step-by-step guide for deploying NexusCRM Next.js application on AWS EC2 with Nginx reverse proxy.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Information](#server-information)
3. [Phase 1: Initial Server Setup](#phase-1-initial-server-setup)
4. [Phase 2: Application Deployment](#phase-2-application-deployment)
5. [Phase 3: Nginx Configuration](#phase-3-nginx-configuration)
6. [Phase 4: Verification and Testing](#phase-4-verification-and-testing)
7. [Phase 5: Maintenance and Updates](#phase-5-maintenance-and-updates)
8. [Troubleshooting](#troubleshooting)
9. [Environment Variables Reference](#environment-variables-reference)

---

## Prerequisites

Before starting the deployment, ensure you have:

- ✅ AWS EC2 instance running Ubuntu 22.04 LTS
- ✅ SSH access to the EC2 instance (key pair file: `contacts.pem`)
- ✅ Git repository access: `https://github.com/thekoushikdurgas/appointment.git`
- ✅ All required environment variable values (API keys, backend URLs, etc.)
- ✅ Basic knowledge of Linux command line

---

## Server Information

- **EC2 Public IP**: `3.88.218.42`
- **EC2 Hostname**: `ec2-3-88-218-42.compute-1.amazonaws.com`
- **SSH Command**: 
  ```bash
  ssh -i "contacts.pem" ubuntu@ec2-3-88-218-42.compute-1.amazonaws.com
  ```
- **Application Port**: `3000` (internal)
- **Nginx Port**: `80` (public HTTP)
- **Node.js Version**: `20.x LTS`

---

## Phase 1: Initial Server Setup

This phase sets up the EC2 instance with all required software. **Run this only once** when setting up a new server.

### Step 1.1: Connect to EC2 Instance

```bash
# Set proper permissions for the key file
chmod 400 contacts.pem

# Connect to the server
ssh -i "contacts.pem" ubuntu@ec2-3-88-218-42.compute-1.amazonaws.com
```

### Step 1.2: Run Initial Setup Script

Once connected to the server, clone the repository and run the setup script:

```bash
# Clone the repository
cd ~
git clone https://github.com/thekoushikdurgas/appointment.git nexuscrm
cd nexuscrm

# Make setup script executable
chmod +x deploy/ec2-setup.sh

# Run the setup script (requires sudo)
sudo ./deploy/ec2-setup.sh
```

**What the setup script does:**
- Updates system packages
- Installs essential packages (git, build-essential, ufw, nginx)
- Configures firewall (UFW) for SSH, HTTP, and HTTPS
- Installs Node.js 20.x LTS
- Installs PM2 process manager globally
- Configures PM2 to start on system boot
- Creates application and logs directories

### Step 1.3: Complete PM2 Startup Configuration

After running the setup script, PM2 will output a command to enable startup. Run that command:

```bash
# Example output (your command may differ):
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

---

## Phase 2: Application Deployment

### Step 2.1: Configure Environment Variables

Create the production environment file with your actual values:

```bash
cd ~/nexuscrm

# Create production environment file (use env.example as template if .env.production.example doesn't exist)
if [ -f ".env.production.example" ]; then
    cp .env.production.example .env.production
else
    cp env.example .env.production
fi

# Edit the file with your production values
nano .env.production
```

**Required environment variables:**

```env
NEXT_PUBLIC_API_BASE_URL=http://54.87.173.234
NEXT_PUBLIC_CONTACTS_WRITE_KEY=your_contacts_write_key
NEXT_PUBLIC_COMPANIES_WRITE_KEY=your_companies_write_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
API_KEY=your_gemini_api_key
```

**Important:** Replace all placeholder values with your actual production values.

### Step 2.2: Deploy the Application

Run the deployment script:

```bash
cd ~/nexuscrm

# Make deployment script executable
chmod +x deploy/ec2-deploy.sh

# Run the deployment script
./deploy/ec2-deploy.sh
```

**What the deployment script does:**
- Verifies `.env.production` exists
- Installs npm dependencies
- Builds the Next.js application for production
- Stops any existing PM2 process
- Starts the application with PM2 in cluster mode
- Saves PM2 process list

### Step 2.3: Verify Application is Running

Check PM2 status:

```bash
pm2 list
pm2 logs nexuscrm
```

You should see the application running. Test locally on the server:

```bash
curl http://localhost:3000
```

---

## Phase 3: Nginx Configuration

### Step 3.1: Create Nginx Configuration

Copy the Nginx configuration template:

```bash
sudo cp ~/nexuscrm/deploy/ec2-nginx.conf /etc/nginx/sites-available/nexuscrm
```

### Step 3.2: Enable the Nginx Site

Create a symbolic link to enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/nexuscrm /etc/nginx/sites-enabled/
```

### Step 3.3: Disable Default Nginx Site (Optional)

If you want this to be the only site:

```bash
sudo rm /etc/nginx/sites-enabled/default
```

### Step 3.4: Test and Reload Nginx

Test the configuration for syntax errors:

```bash
sudo nginx -t
```

If the test is successful, reload Nginx:

```bash
sudo systemctl reload nginx
sudo systemctl enable nginx
```

### Step 3.5: Verify Nginx is Running

```bash
sudo systemctl status nginx
```

---

## Phase 4: Verification and Testing

### Step 4.1: Check Application Status

```bash
# Check PM2 status
pm2 list
pm2 status nexuscrm

# Check application logs
pm2 logs nexuscrm --lines 50

# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/nexuscrm-access.log
sudo tail -f /var/log/nginx/nexuscrm-error.log
```

### Step 4.2: Test Public Access

Open your web browser and navigate to:

```
http://3.88.218.42
```

You should see the NexusCRM application.

### Step 4.3: Test Key Functionality

- ✅ Application loads correctly
- ✅ Login page is accessible
- ✅ API connectivity works (check browser console for errors)
- ✅ Static assets load (CSS, images, etc.)

### Step 4.4: Monitor Application

Set up monitoring:

```bash
# Real-time monitoring
pm2 monit

# View logs in real-time
pm2 logs nexuscrm

# Check system resources
htop
```

---

## Phase 5: Maintenance and Updates

### Updating the Application

When you need to deploy updates:

```bash
cd ~/nexuscrm

# Make update script executable (first time only)
chmod +x deploy/ec2-update.sh

# Run the update script
./deploy/ec2-update.sh
```

**What the update script does:**
- Creates a backup of the current build
- Pulls latest changes from Git
- Updates npm dependencies
- Rebuilds the application
- Restarts the PM2 process
- Shows recent logs

### Manual Update Process

If you prefer to update manually:

```bash
cd ~/nexuscrm

# Pull latest code
git pull origin main

# Install/update dependencies
npm install

# Build the application
npm run build

# Restart with PM2
pm2 restart nexuscrm
pm2 save
```

### Updating Environment Variables

If you need to change environment variables:

```bash
cd ~/nexuscrm

# Edit the production environment file
nano .env.production

# Restart the application to apply changes
pm2 restart nexuscrm
```

### Viewing Logs

```bash
# Application logs
pm2 logs nexuscrm

# Nginx access logs
sudo tail -f /var/log/nginx/nexuscrm-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/nexuscrm-error.log

# System logs
sudo journalctl -u nginx -f
```

### Restarting Services

```bash
# Restart application
pm2 restart nexuscrm

# Restart Nginx
sudo systemctl restart nginx

# Restart both
pm2 restart nexuscrm && sudo systemctl restart nginx
```

---

## Troubleshooting

### Application Not Starting

**Problem:** PM2 shows the application as stopped or errored.

**Solutions:**
```bash
# Check logs for errors
pm2 logs nexuscrm --err

# Check if port 3000 is already in use
sudo lsof -i :3000

# Restart the application
pm2 restart nexuscrm

# If issues persist, delete and recreate
pm2 delete nexuscrm
cd ~/nexuscrm
pm2 start ecosystem.config.js --env production
pm2 save
```

### Nginx 502 Bad Gateway

**Problem:** Nginx returns 502 error when accessing the site.

**Solutions:**
```bash
# Check if application is running
pm2 list

# Check if application is listening on port 3000
curl http://localhost:3000

# Check Nginx error logs
sudo tail -50 /var/log/nginx/nexuscrm-error.log

# Restart both services
pm2 restart nexuscrm
sudo systemctl restart nginx
```

### Build Failures

**Problem:** `npm run build` fails.

**Solutions:**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check

# Try building again
npm run build
```

### Environment Variables Not Working

**Problem:** Application doesn't pick up environment variables.

**Solutions:**
```bash
# Verify .env.production exists
ls -la .env.production

# Check file contents (be careful not to expose secrets)
cat .env.production | grep -v "KEY\|SECRET"

# Restart application after changes
pm2 restart nexuscrm

# Check if variables are loaded
pm2 logs nexuscrm | grep -i "env\|config"
```

### Port Already in Use

**Problem:** Port 3000 is already in use.

**Solutions:**
```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process if needed
sudo kill -9 <PID>

# Or change the port in ecosystem.config.js and .env.production
```

### Cannot Access via Public IP

**Problem:** Can't access the application via EC2 public IP.

**Solutions:**
```bash
# Check security group rules (in AWS Console)
# Ensure port 80 (HTTP) is open to 0.0.0.0/0

# Check firewall on server
sudo ufw status

# Ensure Nginx is running
sudo systemctl status nginx

# Test locally first
curl http://localhost:3000
curl http://localhost
```

### High Memory Usage

**Problem:** Application uses too much memory.

**Solutions:**
```bash
# Check memory usage
pm2 monit

# Reduce PM2 instances in ecosystem.config.js
# Change instances: 'max' to instances: 2

# Restart with new configuration
pm2 delete nexuscrm
pm2 start ecosystem.config.js --env production
```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL | `http://54.87.173.234` |
| `NEXT_PUBLIC_CONTACTS_WRITE_KEY` | Contacts write operations key | `demo-write-key` |
| `NEXT_PUBLIC_COMPANIES_WRITE_KEY` | Companies write operations key | `demo-companies-write-key` |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Google Gemini API key | `your_gemini_api_key` |
| `API_KEY` | Google Gemini API key (duplicate) | `your_gemini_api_key` |

### Variable Notes

- All `NEXT_PUBLIC_*` variables are exposed to the browser
- Never commit `.env.production` to version control
- Use `.env.production.example` as a template
- Restart PM2 after changing environment variables

---

## Additional Resources

### Useful Commands

```bash
# PM2 Commands
pm2 list                    # List all processes
pm2 status                  # Show process status
pm2 logs nexuscrm           # View logs
pm2 monit                   # Real-time monitoring
pm2 restart nexuscrm        # Restart application
pm2 stop nexuscrm           # Stop application
pm2 delete nexuscrm         # Remove from PM2

# Nginx Commands
sudo nginx -t               # Test configuration
sudo systemctl status nginx # Check status
sudo systemctl restart nginx # Restart Nginx
sudo systemctl reload nginx  # Reload configuration

# System Commands
sudo ufw status             # Check firewall
df -h                       # Check disk space
free -h                     # Check memory
htop                        # Monitor system resources
```

### File Locations

- Application: `/home/ubuntu/nexuscrm`
- Environment: `/home/ubuntu/nexuscrm/.env.production`
- PM2 Logs: `/home/ubuntu/nexuscrm/logs/`
- Nginx Config: `/etc/nginx/sites-available/nexuscrm`
- Nginx Logs: `/var/log/nginx/nexuscrm-*.log`

---

## Security Considerations

1. **Firewall**: UFW is configured to allow only necessary ports
2. **SSH**: Keep your `.pem` key file secure and never commit it
3. **Environment Variables**: Never commit `.env.production` to Git
4. **Updates**: Keep system packages updated regularly
5. **SSL**: Consider adding SSL/HTTPS using Let's Encrypt for production

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review application logs: `pm2 logs nexuscrm`
3. Review Nginx logs: `sudo tail -f /var/log/nginx/nexuscrm-error.log`
4. Check system resources: `htop` or `free -h`

---

**Last Updated:** 2025-01-27

