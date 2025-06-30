#!/bin/bash

# qBittorrent VPS Manager 快速安装脚本
# 支持 Ubuntu/Debian/CentOS/RHEL

set -e

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

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "请不要使用root用户运行此脚本"
        exit 1
    fi
}

# 检测操作系统
detect_os() {
    if [[ -f /etc/redhat-release ]]; then
        OS="centos"
        PM="yum"
    elif [[ -f /etc/debian_version ]]; then
        OS="debian"
        PM="apt"
    else
        log_error "不支持的操作系统"
        exit 1
    fi
    log_info "检测到操作系统: $OS"
}

# 安装Node.js
install_nodejs() {
    log_info "检查Node.js安装状态..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        
        if [[ $MAJOR_VERSION -ge 16 ]]; then
            log_success "Node.js $NODE_VERSION 已安装"
            return
        else
            log_warning "Node.js版本过低 ($NODE_VERSION)，需要升级"
        fi
    fi
    
    log_info "安装Node.js 18..."
    
    if [[ $OS == "debian" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ $OS == "centos" ]]; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    fi
    
    log_success "Node.js安装完成"
}

# 安装PM2
install_pm2() {
    log_info "检查PM2安装状态..."
    
    if command -v pm2 &> /dev/null; then
        log_success "PM2已安装"
        return
    fi
    
    log_info "安装PM2..."
    sudo npm install -g pm2
    log_success "PM2安装完成"
}

# 克隆项目
clone_project() {
    log_info "克隆项目代码..."
    
    if [[ -d "qbittorrent-vps-manager" ]]; then
        log_warning "项目目录已存在，正在更新..."
        cd qbittorrent-vps-manager
        git pull origin main
    else
        git clone https://github.com/your-username/qbittorrent-vps-manager.git
        cd qbittorrent-vps-manager
    fi
    
    log_success "项目代码准备完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    npm run install:deps
    log_success "依赖安装完成"
}

# 配置环境
setup_environment() {
    log_info "配置环境变量..."
    
    if [[ ! -f .env ]]; then
        cp .env.example .env
        log_info "已创建.env配置文件，请根据需要修改配置"
    else
        log_info ".env文件已存在"
    fi
}

# 构建项目
build_project() {
    log_info "构建前端项目..."
    npm run build
    log_success "项目构建完成"
}

# 配置PM2
setup_pm2() {
    log_info "配置PM2..."
    
    # 更新ecosystem.config.js中的路径
    sed -i "s|/path/to/qbittorrent-vps-manager|$(pwd)|g" ecosystem.config.js
    
    # 启动应用
    pm2 start ecosystem.config.js --env production
    
    # 保存PM2配置
    pm2 save
    
    # 设置开机自启
    pm2 startup
    
    log_success "PM2配置完成"
}

# 配置防火墙
setup_firewall() {
    log_info "配置防火墙..."
    
    if command -v ufw &> /dev/null; then
        sudo ufw allow 3001/tcp
        log_success "UFW防火墙规则已添加"
    elif command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --permanent --add-port=3001/tcp
        sudo firewall-cmd --reload
        log_success "Firewalld防火墙规则已添加"
    else
        log_warning "未检测到防火墙，请手动开放3001端口"
    fi
}

# 显示完成信息
show_completion() {
    log_success "安装完成！"
    echo
    echo "🎉 qBittorrent VPS Manager 已成功安装并启动"
    echo
    echo "📋 访问信息:"
    echo "   URL: http://$(hostname -I | awk '{print $1}'):3001"
    echo "   本地: http://localhost:3001"
    echo
    echo "🔧 管理命令:"
    echo "   查看状态: pm2 status"
    echo "   查看日志: pm2 logs qbittorrent-vps-manager"
    echo "   重启应用: pm2 restart qbittorrent-vps-manager"
    echo "   停止应用: pm2 stop qbittorrent-vps-manager"
    echo
    echo "📚 更多信息请查看: https://github.com/your-username/qbittorrent-vps-manager"
}

# 主函数
main() {
    echo "🚀 qBittorrent VPS Manager 安装脚本"
    echo "======================================"
    
    check_root
    detect_os
    install_nodejs
    install_pm2
    clone_project
    install_dependencies
    setup_environment
    build_project
    setup_pm2
    setup_firewall
    show_completion
}

# 运行主函数
main "$@"
