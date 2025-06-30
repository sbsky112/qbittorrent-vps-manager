#!/bin/bash

# 快速Docker构建脚本 - 用于测试

set -e

echo "🐳 快速Docker构建测试"
echo "===================="

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker未运行"
    exit 1
fi

echo "✅ Docker环境检查通过"

# 清理旧镜像
echo "🧹 清理旧镜像..."
docker rmi qbittorrent-vps-manager:test 2>/dev/null || true

# 构建镜像
echo "🔨 开始构建镜像..."
docker build -t qbittorrent-vps-manager:test .

if [ $? -eq 0 ]; then
    echo "✅ 镜像构建成功"
    
    # 显示镜像信息
    echo "📋 镜像信息:"
    docker images | grep qbittorrent-vps-manager:test
    
    echo ""
    echo "🚀 测试运行:"
    echo "   docker run -d -p 3001:3001 qbittorrent-vps-manager:test"
    echo ""
    echo "🔍 查看日志:"
    echo "   docker logs <container_id>"
    
else
    echo "❌ 镜像构建失败"
    exit 1
fi
