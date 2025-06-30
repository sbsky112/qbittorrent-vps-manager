module.exports = {
  apps: [{
    name: 'qbittorrent-vps-manager',
    script: 'server/index.js',
    cwd: '/path/to/qbittorrent-vps-manager',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DB_PATH: './server/database/qbittorrent_manager.db',
      UPLOAD_DIR: './server/uploads',
      LOG_FILE: './logs/app.log',
      VPS_CHECK_INTERVAL: 30000,
      VPS_TIMEOUT: 10000,
      REALTIME_UPDATE_INTERVAL: 3000
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001,
      LOG_LEVEL: 'debug'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      LOG_LEVEL: 'info'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    listen_timeout: 3000,
    shutdown_with_message: true
  }],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/your-username/qbittorrent-vps-manager.git',
      path: '/var/www/qbittorrent-vps-manager',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'ForwardAgent=yes'
    },
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'https://github.com/your-username/qbittorrent-vps-manager.git',
      path: '/var/www/qbittorrent-vps-manager-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging',
        PORT: 3002
      }
    }
  }
};
