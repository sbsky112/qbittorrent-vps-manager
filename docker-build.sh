#!/bin/bash

# qBittorrent VPS Manager Docker构建脚本

set -e

# 配置变量
IMAGE_NAME="qbittorrent-vps-manager"
VERSION="1.0.0"
DOCKER_USERNAME="sbsky112"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    log_success "Docker已安装: $(docker --version)"
}

# 检查Docker是否运行
check_docker_running() {
    if ! docker info &> /dev/null; then
        log_error "Docker未运行，请启动Docker"
        exit 1
    fi
    log_success "Docker正在运行"
}

# 清理旧镜像
cleanup_old_images() {
    log_info "清理旧镜像..."
    
    # 删除旧的镜像
    docker images | grep "${DOCKER_USERNAME}/${IMAGE_NAME}" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
    
    # 清理悬空镜像
    docker image prune -f
    
    log_success "旧镜像清理完成"
}

# 构建镜像
build_image() {
    log_info "开始构建Docker镜像..."
    
    # 构建镜像
    docker build \
        --no-cache \
        --progress=plain \
        -t ${DOCKER_USERNAME}/${IMAGE_NAME}:latest \
        -t ${DOCKER_USERNAME}/${IMAGE_NAME}:v${VERSION} \
        -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION} \
        .
    
    if [ $? -eq 0 ]; then
        log_success "镜像构建完成"
    else
        log_error "镜像构建失败"
        exit 1
    fi
}

# 测试镜像
test_image() {
    log_info "测试镜像..."
    
    # 运行容器进行测试
    CONTAINER_ID=$(docker run -d -p 3002:3001 ${DOCKER_USERNAME}/${IMAGE_NAME}:latest)
    
    if [ $? -ne 0 ]; then
        log_error "容器启动失败"
        exit 1
    fi
    
    # 等待容器启动
    log_info "等待容器启动..."
    sleep 15
    
    # 检查容器状态
    if docker ps | grep -q $CONTAINER_ID; then
        log_success "容器运行正常"
    else
        log_error "容器启动失败"
        docker logs $CONTAINER_ID
        docker rm -f $CONTAINER_ID 2>/dev/null || true
        exit 1
    fi
    
    # 健康检查
    log_info "执行健康检查..."
    if docker exec $CONTAINER_ID node server/healthcheck.js; then
        log_success "健康检查通过"
    else
        log_warning "健康检查失败，但容器正在运行"
    fi
    
    # 清理测试容器
    docker stop $CONTAINER_ID >/dev/null 2>&1
    docker rm $CONTAINER_ID >/dev/null 2>&1
    
    log_success "镜像测试完成"
}

# 显示镜像信息
show_image_info() {
    log_info "镜像信息:"
    docker images | grep ${DOCKER_USERNAME}/${IMAGE_NAME} | head -5
    
    echo
    log_success "🎉 Docker镜像构建完成！"
    echo
    echo "📋 使用方法:"
    echo "   docker run -d -p 3001:3001 ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
    echo
    echo "🔗 推送到Docker Hub:"
    echo "   docker login"
    echo "   docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
    echo "   docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:v${VERSION}"
    echo
    echo "📚 更多信息:"
    echo "   https://github.com/${DOCKER_USERNAME}/${IMAGE_NAME}"
}

# 主函数
main() {
    echo "🐳 qBittorrent VPS Manager Docker构建"
    echo "======================================"
    
    check_docker
    check_docker_running
    cleanup_old_images
    build_image
    test_image
    show_image_info
}

# 运行主函数
main "$@"
