# Docker构建问题解决方案

## 🚨 你遇到的问题

根据你提供的错误信息：

```
ERROR: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
Error: Cannot find module '/app/build.js'
```

## ✅ 问题已解决

我已经为你创建了缺失的`build.js`文件和相关构建脚本，现在Docker构建应该可以正常工作了。

## 🔧 解决方案详情

### 1. 创建的新文件

- ✅ `build.js` - 主构建脚本
- ✅ `install-deps.js` - 依赖安装脚本
- ✅ `quick-docker-build.sh` - 快速构建测试脚本
- ✅ `quick-docker-build.ps1` - Windows快速构建脚本
- ✅ `docker-publish.sh` - 完整构建和发布脚本
- ✅ `.dockerignore` - Docker忽略文件
- ✅ 优化的`Dockerfile` - 多阶段构建

### 2. Dockerfile优化

新的Dockerfile使用多阶段构建：

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder
# ... 构建前端应用

# 生产阶段  
FROM node:18-alpine AS production
# ... 只包含运行时文件
```

## 🚀 现在如何构建

### 方法一：快速测试（推荐先试这个）

```bash
# Linux/macOS
chmod +x quick-docker-build.sh
./quick-docker-build.sh

# Windows PowerShell
.\quick-docker-build.ps1
```

### 方法二：完整构建

```bash
# Linux/macOS
chmod +x docker-publish.sh
./docker-publish.sh
```

### 方法三：手动构建

```bash
# 基本构建
docker build -t qbittorrent-vps-manager .

# 运行测试
docker run -d -p 3001:3001 qbittorrent-vps-manager
```

## 📋 构建步骤说明

新的构建过程：

1. **环境检查** - 检查Docker和项目文件
2. **依赖安装** - 分别安装前端和后端依赖
3. **前端构建** - 使用`cd client && npm run build`
4. **镜像打包** - 多阶段构建优化镜像大小
5. **健康检查** - 自动测试镜像功能

## 🔍 如果还有问题

### 1. 检查文件是否存在

```bash
# 检查关键文件
ls -la build.js
ls -la install-deps.js
ls -la client/package.json
ls -la server/package.json
```

### 2. 查看详细构建日志

```bash
# 详细构建日志
docker build --progress=plain --no-cache .
```

### 3. 分阶段调试

```bash
# 只构建到builder阶段
docker build --target builder -t debug-builder .

# 进入builder阶段调试
docker run -it debug-builder /bin/sh
```

### 4. 检查依赖安装

```bash
# 进入项目目录
cd qbittorrent-vps-manager-github

# 手动测试构建脚本
node build.js
```

## 🐳 推送到Docker Hub

构建成功后，推送到Docker Hub：

```bash
# 登录Docker Hub
docker login

# 标记镜像
docker tag qbittorrent-vps-manager sbsky112/qbittorrent-vps-manager:latest

# 推送镜像
docker push sbsky112/qbittorrent-vps-manager:latest
```

## 📊 验证构建结果

```bash
# 查看镜像
docker images | grep qbittorrent-vps-manager

# 运行容器
docker run -d --name qbt-test -p 3001:3001 sbsky112/qbittorrent-vps-manager:latest

# 检查容器状态
docker ps
docker logs qbt-test

# 健康检查
docker exec qbt-test node server/healthcheck.js

# 访问应用
curl http://localhost:3001/api/vps
```

## 🎯 预期结果

构建成功后，你应该看到：

```
✅ 镜像构建成功
📋 镜像信息:
sbsky112/qbittorrent-vps-manager   latest    abc123def456   2 minutes ago   150MB

🚀 测试运行:
   docker run -d -p 3001:3001 sbsky112/qbittorrent-vps-manager:latest
```

## 📚 相关文档

- [DOCKER.md](DOCKER.md) - 详细Docker部署指南
- [DOCKER_BUILD_GUIDE.md](DOCKER_BUILD_GUIDE.md) - 构建指南
- [README.md](README.md) - 项目主文档

## 🤝 需要帮助？

如果构建过程中还有问题：

1. **查看错误日志** - 仔细阅读构建输出
2. **检查网络** - 确保能访问npm registry
3. **清理缓存** - `docker system prune -a`
4. **重新克隆** - 确保代码完整

现在试试快速构建脚本，应该可以成功了！🚀
