# Docker 部署指南

本文档详细介绍如何使用Docker部署qBittorrent VPS Manager。

## 🐳 快速开始

### 方法一：使用预构建镜像（推荐）

```bash
# 拉取并运行最新镜像
docker run -d \
  --name qbt-vps-manager \
  --restart unless-stopped \
  -p 3001:3001 \
  -v qbt-data:/app/data \
  -v qbt-uploads:/app/uploads \
  -v qbt-logs:/app/logs \
  sbsky112/qbittorrent-vps-manager:latest

# 访问应用
open http://localhost:3001
```

### 方法二：使用Docker Compose

1. **下载配置文件**
```bash
curl -O https://raw.githubusercontent.com/sbsky112/qbittorrent-vps-manager/main/docker-compose.yml
```

2. **启动服务**
```bash
docker-compose up -d
```

3. **查看状态**
```bash
docker-compose ps
docker-compose logs -f
```

## 📋 详细配置

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | `3001` | 服务端口 |
| `DB_PATH` | `/app/data/qbittorrent_manager.db` | 数据库路径 |
| `UPLOAD_DIR` | `/app/uploads` | 上传目录 |
| `LOG_FILE` | `/app/logs/app.log` | 日志文件 |
| `VPS_CHECK_INTERVAL` | `30000` | VPS检查间隔(ms) |
| `VPS_TIMEOUT` | `10000` | VPS超时时间(ms) |
| `REALTIME_UPDATE_INTERVAL` | `3000` | 实时更新间隔(ms) |

### 数据卷挂载

```bash
docker run -d \
  --name qbt-vps-manager \
  -p 3001:3001 \
  -v /host/data:/app/data \          # 数据库文件
  -v /host/uploads:/app/uploads \    # 上传文件
  -v /host/logs:/app/logs \          # 日志文件
  sbsky112/qbittorrent-vps-manager:latest
```

### 网络配置

```bash
# 创建自定义网络
docker network create qbt-network

# 运行容器
docker run -d \
  --name qbt-vps-manager \
  --network qbt-network \
  -p 3001:3001 \
  sbsky112/qbittorrent-vps-manager:latest
```

## 🔧 高级配置

### 使用自定义配置文件

```bash
# 创建配置文件
cat > .env << EOF
NODE_ENV=production
PORT=3001
DB_PATH=/app/data/qbittorrent_manager.db
UPLOAD_DIR=/app/uploads
LOG_FILE=/app/logs/app.log
VPS_CHECK_INTERVAL=30000
VPS_TIMEOUT=10000
REALTIME_UPDATE_INTERVAL=3000
EOF

# 运行容器
docker run -d \
  --name qbt-vps-manager \
  --env-file .env \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  sbsky112/qbittorrent-vps-manager:latest
```

### 使用Nginx反向代理

```yaml
# docker-compose.yml
version: '3.8'

services:
  qbittorrent-manager:
    image: sbsky112/qbittorrent-vps-manager:latest
    container_name: qbt-vps-manager
    restart: unless-stopped
    expose:
      - "3001"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    networks:
      - qbt-network

  nginx:
    image: nginx:alpine
    container_name: qbt-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - qbittorrent-manager
    networks:
      - qbt-network

networks:
  qbt-network:
    driver: bridge
```

### 资源限制

```bash
docker run -d \
  --name qbt-vps-manager \
  --memory=512m \
  --cpus=1.0 \
  --restart unless-stopped \
  -p 3001:3001 \
  sbsky112/qbittorrent-vps-manager:latest
```

## 🛠️ 从源码构建

### 构建镜像

```bash
# 克隆项目
git clone https://github.com/sbsky112/qbittorrent-vps-manager.git
cd qbittorrent-vps-manager

# 构建镜像
docker build -t qbittorrent-vps-manager:local .

# 运行自构建镜像
docker run -d \
  --name qbt-vps-manager-local \
  -p 3001:3001 \
  qbittorrent-vps-manager:local
```

### 快速构建测试

```bash
# Linux/macOS
chmod +x quick-docker-build.sh
./quick-docker-build.sh

# Windows PowerShell
.\quick-docker-build.ps1
```

## 📊 监控和日志

### 查看容器状态

```bash
# 查看运行状态
docker ps

# 查看容器详情
docker inspect qbt-vps-manager

# 查看资源使用
docker stats qbt-vps-manager
```

### 日志管理

```bash
# 查看实时日志
docker logs -f qbt-vps-manager

# 查看最近100行日志
docker logs --tail 100 qbt-vps-manager

# 查看特定时间的日志
docker logs --since "2024-01-01T00:00:00" qbt-vps-manager
```

### 健康检查

```bash
# 手动执行健康检查
docker exec qbt-vps-manager node server/healthcheck.js

# 查看健康状态
docker inspect --format='{{.State.Health.Status}}' qbt-vps-manager
```

## 🔄 更新和维护

### 更新镜像

```bash
# 停止当前容器
docker stop qbt-vps-manager

# 删除容器（保留数据卷）
docker rm qbt-vps-manager

# 拉取最新镜像
docker pull sbsky112/qbittorrent-vps-manager:latest

# 启动新容器
docker run -d \
  --name qbt-vps-manager \
  --restart unless-stopped \
  -p 3001:3001 \
  -v qbt-data:/app/data \
  -v qbt-uploads:/app/uploads \
  -v qbt-logs:/app/logs \
  sbsky112/qbittorrent-vps-manager:latest
```

### 数据备份

```bash
# 备份数据卷
docker run --rm \
  -v qbt-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/qbt-data-backup.tar.gz -C /data .

# 恢复数据卷
docker run --rm \
  -v qbt-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/qbt-data-backup.tar.gz -C /data
```

## 🚨 故障排除

### 常见问题

1. **容器无法启动**
```bash
# 查看错误日志
docker logs qbt-vps-manager

# 检查端口占用
netstat -tlnp | grep 3001
```

2. **数据丢失**
```bash
# 检查数据卷
docker volume ls
docker volume inspect qbt-data
```

3. **性能问题**
```bash
# 检查资源使用
docker stats qbt-vps-manager

# 调整资源限制
docker update --memory=1g --cpus=2.0 qbt-vps-manager
```

### 调试模式

```bash
# 以调试模式运行
docker run -it --rm \
  -p 3001:3001 \
  -e NODE_ENV=development \
  -e LOG_LEVEL=debug \
  sbsky112/qbittorrent-vps-manager:latest

# 进入容器调试
docker exec -it qbt-vps-manager /bin/sh
```

## 📚 更多资源

- [Docker官方文档](https://docs.docker.com/)
- [Docker Compose文档](https://docs.docker.com/compose/)
- [项目GitHub仓库](https://github.com/sbsky112/qbittorrent-vps-manager)
- [问题反馈](https://github.com/sbsky112/qbittorrent-vps-manager/issues)
