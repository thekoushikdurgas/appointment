<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Deploying Next.js on AWS EC2 with Nginx

Deploying a Next.js application on an AWS EC2 instance using Nginx as a reverse proxy is a robust approach that gives you full control over your production environment. This guide will walk you through the complete deployment process, from setting up your EC2 instance to configuring SSL certificates for secure HTTPS connections.[^1][^2][^3]

### Prerequisites

Before starting the deployment, ensure you have:

- An AWS account with access to EC2
- A Next.js application ready for deployment
- A domain name (optional, but recommended for SSL)
- Basic understanding of Linux commands and SSH


### Step 1: Launch and Configure EC2 Instance

**Launch the Instance**

Navigate to the AWS Console and access EC2. Launch a new instance with the following configuration:[^2][^4]

- **OS**: Ubuntu 22.04 LTS (recommended) or Amazon Linux
- **Instance Type**: t2.micro (free tier for testing) or t3.medium+ for production
- **Storage**: At least 20GB for application and dependencies

**Configure Security Groups**

Set up security group rules to allow necessary traffic:[^5][^2]

- **SSH (Port 22)**: Restrict to your IP address for security
- **HTTP (Port 80)**: Allow from anywhere (0.0.0.0/0)
- **HTTPS (Port 443)**: Allow from anywhere (0.0.0.0/0)
- **Custom TCP (Port 3000)**: Optional, only for direct testing

**Connect to Your Instance**

Once launched, connect via SSH using your key pair:[^1]

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

If you encounter permission errors, adjust the key file permissions:

```bash
chmod 400 your-key.pem
```


### Step 2: Install Required Software

**Update System and Install Essential Packages**

Start by updating the system and installing necessary tools:[^2][^1]

```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install git build-essential ufw nginx
```

**Configure Firewall**

Enable the firewall with appropriate rules:[^1]

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

**Install Node.js**

Install Node.js 20.x (or your preferred version):[^3][^2]

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify the installation:

```bash
node -v
npm -v
```


### Step 3: Install PM2 Process Manager

PM2 is a production-grade process manager that keeps your Next.js application running continuously, manages clusters, and provides automatic restarts:[^6][^2]

```bash
npm install -g pm2
pm2 startup
```

Run the command that PM2 outputs to enable it to start on system boot.[^2]

### Step 4: Deploy Your Next.js Application

**Clone Your Repository**

Navigate to your preferred directory and clone your project:[^3][^2]

```bash
cd ~
git clone https://github.com/yourusername/your-nextjs-app.git
cd your-nextjs-app
```

**Install Dependencies**

```bash
npm install
```

**Configure Environment Variables**

Create a `.env.production` or `.env.local` file for production environment variables:[^7][^8]

```bash
nano .env.production
```

Add your production variables:

```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
DATABASE_URL=your_database_connection_string
```

Next.js supports different environment files for different environments:[^8][^7]

- `.env` - Default for all environments
- `.env.local` - Local overrides (not committed to git)
- `.env.production` - Production-specific variables
- `.env.development` - Development-specific variables

**Build the Application**

Create an optimized production build:[^3][^2]

```bash
npm run build
```

For better performance, you can configure Next.js to use standalone output mode in `next.config.js`:[^9][^10]

```javascript
module.exports = {
  output: 'standalone',
}
```

This creates a minimal production build that includes only necessary dependencies.[^9]

**Start with PM2**

Launch your application using PM2:[^6][^2]

```bash
pm2 start npm --name "nextjs-app" -- start
pm2 save
```

Check the status:

```bash
pm2 list
pm2 logs nextjs-app
```

**Configure PM2 for Production**

Create an `ecosystem.config.js` file for advanced PM2 configuration:[^6]

```javascript
module.exports = {
  apps: [{
    name: 'nextjs-app',
    script: 'npm',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

Then start with:

```bash
pm2 start ecosystem.config.js --env production
```


### Step 5: Configure Nginx as Reverse Proxy

**Create Nginx Configuration**

Create a new site configuration:[^1][^2]

```bash
sudo nano /etc/nginx/sites-available/nextjs-app
```

Add the following configuration:[^2][^3][^1]

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

The `proxy_http_version` and WebSocket headers are crucial for Next.js hot module replacement during development and real-time features.[^11]

**Enable the Site**

Create a symbolic link to enable the site:[^1][^2]

```bash
sudo ln -s /etc/nginx/sites-available/nextjs-app /etc/nginx/sites-enabled/
```

**Test and Reload Nginx**

Test the configuration for syntax errors:

```bash
sudo nginx -t
```

If successful, reload Nginx:[^2]

```bash
sudo systemctl reload nginx
```


### Step 6: Set Up SSL with Let's Encrypt

Secure your application with free SSL certificates using Certbot and Let's Encrypt.[^12]

**Install Certbot**

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

The `python3-certbot-nginx` plugin is essential for automatic Nginx configuration.[^12]

**Obtain SSL Certificate**

Run Certbot to automatically configure SSL:[^12]

```bash
sudo certbot --nginx
```

Follow the prompts:

1. Enter your email address for renewal notifications
2. Agree to the Terms of Service
3. Select your domain(s)
4. Choose to redirect HTTP to HTTPS (recommended)

Certbot will automatically update your Nginx configuration to include SSL and redirect HTTP traffic to HTTPS.[^12]

**Verify SSL Configuration**

After installation, Certbot creates two server blocks in your Nginx configuration:[^12]

1. **HTTP (Port 80)** - Redirects to HTTPS:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

2. **HTTPS (Port 443)** - Serves your application securely:
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Automatic Certificate Renewal**

Let's Encrypt certificates expire every 90 days, but Certbot sets up automatic renewal. Test the renewal process:[^12]

```bash
sudo certbot renew --dry-run
```


### Step 7: Update and Maintain Your Application

**Deploying Updates**

When you need to deploy new changes:[^13]

```bash
cd ~/your-nextjs-app
git pull origin main
npm install
npm run build
pm2 restart nextjs-app
```

For zero-downtime deployments, consider using a blue-green deployment strategy with two PM2 instances:[^13]

```bash
# Deploy to secondary instance
cd ~/nextjs-app-v2
git pull && npm install && npm run build
pm2 start ecosystem.config.js --name nextjs-v2

# Switch traffic
pm2 stop nextjs-app
pm2 restart nextjs-v2
pm2 delete nextjs-app

# Update primary instance
cd ~/nextjs-app
git pull && npm install && npm run build
pm2 start ecosystem.config.js --name nextjs-app
```

**Monitor Your Application**

Use PM2's monitoring capabilities:[^6]

```bash
pm2 monit           # Real-time monitoring
pm2 logs nextjs-app # View logs
pm2 status          # Check process status
```


### Additional Optimizations

**Standalone Output Configuration**

For optimized builds with reduced dependencies, configure standalone mode in `next.config.js`:[^9]

```javascript
module.exports = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
}
```

**PM2 Cluster Mode**

Leverage multi-core CPUs by running multiple instances:[^6]

```javascript
module.exports = {
  apps: [{
    name: 'nextjs-app',
    script: 'npm',
    args: 'start',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    autorestart: true,
    max_memory_restart: '1G',
  }]
}
```

**Nginx Caching**

Improve performance by caching static assets:

```nginx
location /_next/static/ {
    proxy_pass http://localhost:3000;
    proxy_cache_valid 200 60m;
    add_header Cache-Control "public, immutable";
}
```

This comprehensive setup provides a production-ready Next.js deployment on EC2 with Nginx, combining reliability, security, and performance.[^3][^1][^2][^12]
<span style="display:none">[^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35]</span>

<div align="center">⁂</div>

[^1]: https://www.youtube.com/watch?v=VbfsXYW-MxU

[^2]: https://dev.to/duythenight/deploy-nextjs-on-aws-ec2-with-pm2-nginx-and-cloudflare-cdn-b42

[^3]: https://www.linkedin.com/pulse/supercharge-your-nextjs-application-deploying-aws-ec2-kalaiselvam-m2ehc

[^4]: https://www.vocso.com/blog/deploying-a-next-js-application-on-aws-step-by-step-guide/

[^5]: https://innosufiyan.hashnode.dev/setting-up-ec2-security-groups-for-secure-access

[^6]: https://dykraf.com/blog/deploying-nextjs-web-application-with-pm2

[^7]: https://github.com/vercel/next.js/discussions/25764

[^8]: https://refine.dev/blog/next-js-environment-variables/

[^9]: https://stackoverflow.com/questions/78877965/next-js-custom-server-with-standalone-output

[^10]: https://www.turing.com/kb/optimizing-build-performance-in-nextjs

[^11]: https://rutenisraila.com/blog/reverse-proxy-with-next-js-and-nginx

[^12]: https://joelolawanle.com/blog/ssl-ec2-with-certbot-lets-encrypt

[^13]: https://www.reddit.com/r/nextjs/comments/14pqf3f/deploying_to_production_with_pm2/

[^14]: https://dl.acm.org/doi/pdf/10.1145/3694715.3695947

[^15]: https://arxiv.org/pdf/2210.01073.pdf

[^16]: https://arxiv.org/pdf/2311.06962.pdf

[^17]: https://arxiv.org/html/2403.17574v1

[^18]: http://arxiv.org/pdf/2407.00832.pdf

[^19]: http://arxiv.org/pdf/2411.01129.pdf

[^20]: https://arxiv.org/html/2503.23952v1

[^21]: http://arxiv.org/pdf/2212.10131.pdf

[^22]: https://www.reddit.com/r/nextjs/comments/q49dsx/deploy_next_js_on_aws_ec2_server_help/

[^23]: https://www.linkedin.com/posts/utkarsh-patrikar_nextjs-vite-aws-activity-7336461446525935616-4dLx

[^24]: https://learnaws.io/blog/deploy-nextjs-on-ec2

[^25]: https://blog.stackademic.com/nginx-for-deploying-next-js-application-on-aws-ec2-with-aws-elb-control-and-stability-of-a99185deb1c6

[^26]: https://nextjs.org/docs/app/getting-started/deploying

[^27]: http://arxiv.org/pdf/2110.08588.pdf

[^28]: http://arxiv.org/pdf/2402.04586.pdf

[^29]: https://ejournal.ikado.ac.id/index.php/teknika/article/view/400

[^30]: https://ijcsrr.org/wp-content/uploads/2024/10/28-1010-2024.pdf

[^31]: https://arxiv.org/html/2504.03884v1

[^32]: https://www.mdpi.com/2079-9292/12/2/357/pdf?version=1673344794

[^33]: https://arxiv.org/pdf/2207.14711.pdf

[^34]: https://arxiv.org/pdf/1905.07314.pdf

[^35]: https://twm.me/beginner-guide-nextjs-aws-ec2-nginx

