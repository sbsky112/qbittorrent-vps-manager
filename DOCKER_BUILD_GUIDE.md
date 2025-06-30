# Docker构建指南

本文档介绍如何构建和发布qBittorrent VPS Manager的Docker镜像。

## 🛠️ 构建脚本

项目提供了多个构建脚本，适用于不同的场景：

### 1. 快速测试构建

**Linux/macOS:**
```bash
chmod +x quick-docker-build.sh
./quick-docker-build.sh
```

**Windows:**
```powershell
.\quick-docker-build.ps1
```

这个脚本用于快速测试Docker构建是否正常，构建的镜像标签为`qbittorrent-vps-manager:test`。

### 2. 完整构建和发布

**Linux/macOS:**
```bash
chmod +x docker-publish.sh
./docker-publish.sh
```

这个脚本会：
- 检查环境和项目状态
- 清理旧镜像
- 构建新镜像（多个标签）
- 测试镜像功能
- 可选推送到Docker Hub

### 3. 手动构建

```bash
# 基本构建
docker build -t qbittorrent-vps-manager .

# 多标签构建
docker build \
  -t sbsky112/qbittorrent-vps-manager:latest \
  -t sbsky112/qbittorrent-vps-manager:v1.0.0 \
  -t sbsky112/qbittorrent-vps-manager:1.0.0 \
  .
```

## 🔧 构建过程详解

### Dockerfile结构

项目使用多阶段构建来优化镜像大小：

1. **构建阶段** (`builder`)
   - 基于`node:18-alpine`
   - 安装构建依赖
   - 构建前端应用

2. **生产阶段** (`production`)
   - 基于`node:18-alpine`
   - 只包含运行时依赖
   - 复制构建结果

### 构建优化

- 使用`.dockerignore`排除不必要文件
- 多阶段构建减少镜像大小
- 使用`dumb-init`作为PID 1
- 非root用户运行提高安全性

## 📋 构建要求

### 系统要求
- Docker 20.10+
- 可用内存 2GB+
- 可用磁盘空间 5GB+

### 网络要求
- 能够访问Docker Hub
- 能够访问npm registry
- 稳定的网络连接

## 🚨 常见问题

### 1. 构建失败

**问题**: `npm run build`失败
```
Error: Cannot find module '/app/build.js'
```

**解决**: 确保`build.js`文件存在
```bash
# 检查文件
ls -la build.js

# 如果不存在，重新克隆项目
git clone https://github.com/sbsky112/qbittorrent-vps-manager.git
```

### 2. 内存不足

**问题**: 构建过程中内存不足
```
ERROR: failed to solve: process "/bin/sh -c npm install" did not complete successfully
```

**解决**: 增加Docker内存限制
```bash
# 检查Docker内存设置
docker system info | grep Memory

# 在Docker Desktop中增加内存分配
```

### 3. 网络超时

**问题**: npm安装超时
```
npm ERR! network timeout
```

**解决**: 使用国内镜像源
```bash
# 临时使用淘宝镜像
docker build --build-arg NPM_REGISTRY=https://registry.npmmirror.com .
```

### 4. 权限问题

**问题**: 文件权限错误
```
permission denied while trying to connect to the Docker daemon socket
```

**解决**: 添加用户到docker组
```bash
sudo usermod -aG docker $USER
# 重新登录或重启
```

## 🔍 调试技巧

### 1. 分层构建调试

```bash
# 构建到特定阶段
docker build --target builder -t debug-builder .

# 进入构建阶段调试
docker run -it debug-builder /bin/sh
```

### 2. 查看构建日志

```bash
# 详细构建日志
docker build --progress=plain --no-cache .

# 保存构建日志
docker build . 2>&1 | tee build.log
```

### 3. 镜像分析

```bash
# 查看镜像层
docker history sbsky112/qbittorrent-vps-manager:latest

# 分析镜像大小
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# 进入容器调试
docker run -it --entrypoint /bin/sh sbsky112/qbittorrent-vps-manager:latest
```

## 📊 性能优化

### 1. 构建缓存

```bash
# 使用BuildKit缓存
export DOCKER_BUILDKIT=1
docker build --cache-from sbsky112/qbittorrent-vps-manager:latest .
```

### 2. 并行构建

```bash
# 多平台构建
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t sbsky112/qbittorrent-vps-manager:latest \
  --push .
```

### 3. 镜像压缩

```bash
# 使用压缩
docker build --compress .

# 清理构建缓存
docker builder prune
```

## 🚀 自动化构建

### GitHub Actions

项目包含GitHub Actions配置，自动构建和发布：

```yaml
# .github/workflows/ci.yml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    platforms: linux/amd64,linux/arm64
    push: true
    tags: ${{ steps.meta.outputs.tags }}
```

### 本地自动化

```bash
# 使用watch自动构建
watch -n 60 './quick-docker-build.sh'

# 使用cron定时构建
echo "0 2 * * * cd /path/to/project && ./docker-publish.sh" | crontab -
```

## 📚 相关资源

- [Docker官方文档](https://docs.docker.com/)
- [Docker最佳实践](https://docs.docker.com/develop/dev-best-practices/)
- [多阶段构建](https://docs.docker.com/develop/dev-best-practices/#use-multi-stage-builds)
- [Dockerfile参考](https://docs.docker.com/engine/reference/builder/)

## 🤝 贡献

如果你在构建过程中遇到问题或有改进建议，欢迎：

1. 提交Issue: [GitHub Issues](https://github.com/sbsky112/qbittorrent-vps-manager/issues)
2. 提交PR: [Pull Requests](https://github.com/sbsky112/qbittorrent-vps-manager/pulls)
3. 参与讨论: [GitHub Discussions](https://github.com/sbsky112/qbittorrent-vps-manager/discussions)
