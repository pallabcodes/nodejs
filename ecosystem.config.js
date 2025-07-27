// Enhanced ecosystem.config.js for production PM2 deployment
module.exports = {
  apps: [
    {
      // Application Configuration
      name: 'smartvault-backend',
      script: 'server.js',
      cwd: '/app',
      
      // Process Management
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      
      // Auto-restart Configuration
      autorestart: true,
      watch: false, // Disable in production
      max_memory_restart: '1G',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Environment Variables
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
        LOG_LEVEL: 'info',
        PM2_CLUSTER_MODE: 'true'
      },
      
      // Logging Configuration
      log_file: '/app/logs/pm2-combined.log',
      out_file: '/app/logs/pm2-out.log',
      error_file: '/app/logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced Options
      kill_timeout: 5000,
      listen_timeout: 8000,
      wait_ready: true,
      
      // Health Monitoring
      health_check_http: {
        url: 'http://localhost:3000/health',
        interval: 30000,
        timeout: 5000,
        retries: 3
      },
      
      // Performance Tuning
      node_args: [
        '--max-old-space-size=1024',
        '--optimize-for-size',
        '--enable-source-maps'
      ],
      
      // Process Limits
      max_cpu: 90,
      max_memory: '1G',
      
      // Graceful Shutdown
      shutdown_with_message: true,
      kill_retry_time: 5000
    }
  ],
  
  // Deployment Configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['production-server-1', 'production-server-2'],
      ref: 'origin/main',
      repo: 'git@github.com:pallabcodes/nodejs.git',
      path: '/var/www/smartvault-backend',
      ssh_options: 'StrictHostKeyChecking=no',
      
      // Pre-deployment commands
      'pre-deploy': [
        'git fetch --all',
        'git reset --hard origin/main'
      ].join(' && '),
      
      // Post-deployment commands
      'post-deploy': [
        'npm ci --production',
        'npm run migrate',
        'pm2 reload ecosystem.config.js --env production',
        'pm2 save'
      ].join(' && '),
      
      // Pre-setup commands (run once)
      'pre-setup': [
        'mkdir -p /var/www/smartvault-backend/shared/logs',
        'mkdir -p /var/www/smartvault-backend/shared/uploads',
        'mkdir -p /var/www/smartvault-backend/shared/tmp'
      ].join(' && ')
    },
    
    staging: {
      user: 'deploy',
      host: 'staging-server',
      ref: 'origin/develop',
      repo: 'git@github.com:pallabcodes/nodejs.git',
      path: '/var/www/smartvault-backend-staging',
      ssh_options: 'StrictHostKeyChecking=no',
      
      'pre-deploy': 'git fetch --all',
      'post-deploy': [
        'npm ci --production',
        'npm run migrate',
        'pm2 reload ecosystem.config.js --env staging',
        'pm2 save'
      ].join(' && ')
    }
  }
};