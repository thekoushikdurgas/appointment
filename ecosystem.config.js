/**
 * PM2 Ecosystem Configuration for Contact360
 * 
 * This configuration file manages the Next.js application in production
 * using PM2 process manager with cluster mode for better performance.
 * 
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 stop ecosystem.config.js
 *   pm2 restart ecosystem.config.js
 */

module.exports = {
  apps: [{
    name: 'contact360',
    script: 'npm',
    args: 'start',
    // Use cluster mode to leverage all CPU cores
    instances: 'max', // or specify a number like 2
    exec_mode: 'cluster',
    
    // Auto-restart configuration
    autorestart: true,
    watch: false, // Disable file watching in production
    max_memory_restart: '1G', // Restart if memory exceeds 1GB
    
    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Logging configuration
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true, // Prepend timestamp to logs
    merge_logs: true, // Merge logs from all instances
    
    // Advanced options
    min_uptime: '10s', // Minimum uptime to consider app stable
    max_restarts: 10, // Maximum number of restarts
    restart_delay: 4000, // Delay between restarts (ms)
    
    // Graceful shutdown
    kill_timeout: 5000, // Time to wait for graceful shutdown
    listen_timeout: 10000, // Time to wait for app to listen
  }]
};

