#!/bin/bash

# qBittorrent VPS Manager Docker构建和发布脚本

set -e

# 配置变量
DOCKER_USERNAME="sbsky112"
IMAGE_NAME="qbittorrent-vps-manager"
VERSION="1.0.0"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# 显示横幅
show_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                qBittorrent VPS Manager                       ║"
    echo "║                Docker构建和发布工具                          ║"
    echo "║                                                              ║"
    echo "║  版本: v${VERSION}                                              ║"
    echo "║  镜像: ${DOCKER_USERNAME}/${IMAGE_NAME}                           ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 检查必要工具
check_requirements() {
    log_step "检查必要工具..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    log_info "Docker: $(docker --version)"
    
    # 检查Docker是否运行
    if ! docker info &> /dev/null; then
        log_error "Docker未运行，请启动Docker"
        exit 1
    fi
    
    # 检查Git
    if ! command -v git &> /dev/null; then
        log_warning "Git未安装，无法获取版本信息"
    else
        log_info "Git: $(git --version)"
    fi
    
    log_success "工具检查完成"
}

# 检查项目状态
check_project() {
    log_step "检查项目状态..."
    
    # 检查必要文件
    local required_files=(
        "Dockerfile"
        "package.json"
        "server/package.json"
        "client/package.json"
        "server/index.js"
        "server/healthcheck.js"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "缺少必要文件: $file"
            exit 1
        fi
    done
    
    # 检查Git状态
    if command -v git &> /dev/null && [[ -d .git ]]; then
        local git_status=$(git status --porcelain)
        if [[ -n "$git_status" ]]; then
            log_warning "工作目录有未提交的更改"
            echo "$git_status"
        fi
        
        local current_branch=$(git branch --show-current)
        log_info "当前分支: $current_branch"
        
        local commit_hash=$(git rev-parse --short HEAD)
        log_info "提交哈希: $commit_hash"
    fi
    
    log_success "项目状态检查完成"
}

# 清理旧镜像
cleanup_images() {
    log_step "清理旧镜像..."
    
    # 删除旧的镜像
    local old_images=$(docker images "${DOCKER_USERNAME}/${IMAGE_NAME}" -q)
    if [[ -n "$old_images" ]]; then
        log_info "删除旧镜像..."
        echo "$old_images" | xargs docker rmi -f 2>/dev/null || true
    fi
    
    # 清理悬空镜像
    docker image prune -f >/dev/null 2>&1 || true
    
    log_success "镜像清理完成"
}

# 构建镜像
build_image() {
    log_step "构建Docker镜像..."
    
    local build_args=""
    if command -v git &> /dev/null && [[ -d .git ]]; then
        local commit_hash=$(git rev-parse --short HEAD)
        local build_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        build_args="--build-arg COMMIT_HASH=$commit_hash --build-arg BUILD_DATE=$build_date"
    fi
    
    # 构建镜像
    log_info "开始构建镜像..."
    docker build \
        --no-cache \
        --progress=plain \
        $build_args \
        -t ${DOCKER_USERNAME}/${IMAGE_NAME}:latest \
        -t ${DOCKER_USERNAME}/${IMAGE_NAME}:v${VERSION} \
        -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION} \
        .
    
    if [[ $? -eq 0 ]]; then
        log_success "镜像构建完成"
    else
        log_error "镜像构建失败"
        exit 1
    fi
}

# 测试镜像
test_image() {
    log_step "测试镜像..."
    
    local test_port=3002
    local container_name="qbt-test-$(date +%s)"
    
    # 检查端口是否被占用
    if netstat -tlnp 2>/dev/null | grep -q ":$test_port "; then
        log_warning "端口 $test_port 被占用，使用随机端口"
        test_port=0
    fi
    
    # 运行测试容器
    log_info "启动测试容器..."
    local container_id=$(docker run -d \
        --name $container_name \
        -p $test_port:3001 \
        ${DOCKER_USERNAME}/${IMAGE_NAME}:latest)
    
    if [[ $? -ne 0 ]]; then
        log_error "测试容器启动失败"
        exit 1
    fi
    
    # 等待容器启动
    log_info "等待容器启动..."
    sleep 20
    
    # 检查容器状态
    if docker ps | grep -q $container_id; then
        log_success "容器运行正常"
    else
        log_error "容器启动失败"
        docker logs $container_id
        docker rm -f $container_id 2>/dev/null || true
        exit 1
    fi
    
    # 健康检查
    log_info "执行健康检查..."
    local health_check_attempts=0
    local max_attempts=5
    
    while [[ $health_check_attempts -lt $max_attempts ]]; do
        if docker exec $container_id node server/healthcheck.js >/dev/null 2>&1; then
            log_success "健康检查通过"
            break
        else
            ((health_check_attempts++))
            if [[ $health_check_attempts -eq $max_attempts ]]; then
                log_warning "健康检查失败，但容器正在运行"
                docker logs --tail 20 $container_id
            else
                log_info "健康检查失败，重试中... ($health_check_attempts/$max_attempts)"
                sleep 5
            fi
        fi
    done
    
    # 清理测试容器
    docker stop $container_id >/dev/null 2>&1
    docker rm $container_id >/dev/null 2>&1
    
    log_success "镜像测试完成"
}

# 登录Docker Hub
docker_login() {
    log_step "登录Docker Hub..."
    
    if docker login; then
        log_success "Docker Hub登录成功"
    else
        log_error "Docker Hub登录失败"
        exit 1
    fi
}

# 推送镜像
push_image() {
    log_step "推送镜像到Docker Hub..."
    
    local tags=(
        "latest"
        "v${VERSION}"
        "${VERSION}"
    )
    
    for tag in "${tags[@]}"; do
        log_info "推送标签: $tag"
        if docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:$tag; then
            log_success "标签 $tag 推送成功"
        else
            log_error "标签 $tag 推送失败"
            exit 1
        fi
    done
    
    log_success "所有镜像推送完成"
}

# 显示完成信息
show_completion() {
    echo
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                     🎉 发布完成！                            ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    log_info "镜像信息:"
    docker images | grep ${DOCKER_USERNAME}/${IMAGE_NAME} | head -5
    
    echo
    echo -e "${CYAN}📋 使用方法:${NC}"
    echo "   docker run -d -p 3001:3001 ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
    echo
    echo -e "${CYAN}🔗 Docker Hub链接:${NC}"
    echo "   https://hub.docker.com/r/${DOCKER_USERNAME}/${IMAGE_NAME}"
    echo
    echo -e "${CYAN}📚 更多信息:${NC}"
    echo "   https://github.com/${DOCKER_USERNAME}/${IMAGE_NAME}"
    echo
}

# 主函数
main() {
    show_banner
    check_requirements
    check_project
    cleanup_images
    build_image
    test_image
    
    # 询问是否推送
    echo
    read -p "是否推送镜像到Docker Hub? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker_login
        push_image
        show_completion
    else
        log_info "跳过推送，镜像已构建完成"
        echo
        echo -e "${CYAN}📋 本地使用:${NC}"
        echo "   docker run -d -p 3001:3001 ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
    fi
}

# 错误处理
trap 'log_error "脚本执行被中断"; exit 1' INT TERM

# 运行主函数
main "$@"
