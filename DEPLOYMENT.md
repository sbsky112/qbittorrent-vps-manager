# 部署指南

本文档介绍如何在生产环境中部署qBittorrent VPS Manager。

## 生产环境要求

### 系统要求
- **操作系统**: Linux (推荐 Ubuntu 20.04+)
- **Node.js**: 16.0.0 或更高版本
- **内存**: 最少 512MB，推荐 1GB+
- **磁盘空间**: 最少 1GB 可用空间
- **网络**: 稳定的互联网连接

### 软件依赖
- Node.js 和 npm
- PM2 (进程管理器)
- Nginx (反向代理，可选)
- SSL证书 (HTTPS，推荐)

## 部署步骤

### 1. 准备服务器

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js (使用NodeSource仓库)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version

# 安装PM2
sudo npm install -g pm2
```

### 2. 部署应用

```bash
# 克隆项目
git clone <your-repository-url>
cd qbittorrent-vps-manager

# 安装依赖
npm run install:deps

# 构建前端
npm run build

# 配置环境变量
cp .env.example .env
nano .env  # 编辑配置
```

### 3. 配置环境变量

编辑 `.env` 文件：

```env
# 生产环境配置
NODE_ENV=production
PORT=3001

# 数据库路径
DB_PATH=/var/lib/qbittorrent-manager/database.db

# 文件上传目录
UPLOAD_DIR=/var/lib/qbittorrent-manager/uploads

# 安全配置
CORS_ORIGIN=https://your-domain.com
SESSION_SECRET=your-very-secure-secret-key

# 日志配置
LOG_LEVEL=warn
LOG_FILE=/var/log/qbittorrent-manager/app.log
```

### 4. 创建系统用户和目录

```bash
# 创建专用用户
sudo useradd -r -s /bin/false qbt-manager

# 创建数据目录
sudo mkdir -p /var/lib/qbittorrent-manager
sudo mkdir -p /var/log/qbittorrent-manager

# 设置权限
sudo chown -R qbt-manager:qbt-manager /var/lib/qbittorrent-manager
sudo chown -R qbt-manager:qbt-manager /var/log/qbittorrent-manager
```

### 5. 使用PM2启动应用

创建PM2配置文件 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'qbittorrent-manager',
    script: 'server/index.js',
    cwd: '/path/to/qbittorrent-vps-manager',
    user: 'qbt-manager',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    error_file: '/var/log/qbittorrent-manager/error.log',
    out_file: '/var/log/qbittorrent-manager/out.log',
    log_file: '/var/log/qbittorrent-manager/combined.log',
    time: true
  }]
};
```

启动应用：

```bash
# 启动应用
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

### 6. 配置Nginx反向代理

创建Nginx配置文件 `/etc/nginx/sites-available/qbittorrent-manager`：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # 静态文件
    location / {
        root /path/to/qbittorrent-vps-manager/client/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/qbittorrent-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 安全配置

### 1. 防火墙设置

```bash
# 允许SSH、HTTP、HTTPS
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# 拒绝直接访问应用端口
sudo ufw deny 3001

# 启用防火墙
sudo ufw enable
```

### 2. SSL证书

使用Let's Encrypt获取免费SSL证书：

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 设置自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 监控和维护

### 1. 日志监控

```bash
# 查看应用日志
pm2 logs qbittorrent-manager

# 查看系统日志
sudo journalctl -u nginx
```

### 2. 性能监控

```bash
# PM2监控
pm2 monit

# 系统资源
htop
df -h
```

### 3. 备份策略

```bash
# 创建备份脚本
#!/bin/bash
BACKUP_DIR="/backup/qbittorrent-manager"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份数据库
cp /var/lib/qbittorrent-manager/database.db $BACKUP_DIR/database_$DATE.db

# 备份配置
cp /path/to/qbittorrent-vps-manager/.env $BACKUP_DIR/env_$DATE.backup

# 清理旧备份（保留30天）
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
```

## 更新应用

```bash
# 停止应用
pm2 stop qbittorrent-manager

# 拉取最新代码
git pull origin main

# 安装新依赖
npm run install:deps

# 重新构建
npm run build

# 重启应用
pm2 restart qbittorrent-manager
```

## 故障排除

### 常见问题

1. **应用无法启动**
   - 检查端口是否被占用：`sudo netstat -tlnp | grep 3001`
   - 查看PM2日志：`pm2 logs qbittorrent-manager`

2. **数据库权限错误**
   - 检查目录权限：`ls -la /var/lib/qbittorrent-manager/`
   - 修复权限：`sudo chown -R qbt-manager:qbt-manager /var/lib/qbittorrent-manager`

3. **Nginx配置错误**
   - 测试配置：`sudo nginx -t`
   - 查看错误日志：`sudo tail -f /var/log/nginx/error.log`

4. **SSL证书问题**
   - 检查证书有效期：`sudo certbot certificates`
   - 手动续期：`sudo certbot renew`
