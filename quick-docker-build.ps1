# 快速Docker构建脚本 - Windows版本

$ErrorActionPreference = "Stop"

Write-Host "🐳 快速Docker构建测试" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

# 检查Docker
try {
    docker --version | Out-Null
    Write-Host "✅ Docker已安装" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker未安装" -ForegroundColor Red
    exit 1
}

try {
    docker info | Out-Null
    Write-Host "✅ Docker正在运行" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker未运行，请启动Docker Desktop" -ForegroundColor Red
    exit 1
}

# 清理旧镜像
Write-Host "🧹 清理旧镜像..." -ForegroundColor Yellow
try {
    docker rmi qbittorrent-vps-manager:test 2>$null
} catch {
    # 忽略错误，镜像可能不存在
}

# 构建镜像
Write-Host "🔨 开始构建镜像..." -ForegroundColor Blue
try {
    docker build -t qbittorrent-vps-manager:test .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 镜像构建成功" -ForegroundColor Green
        
        # 显示镜像信息
        Write-Host "📋 镜像信息:" -ForegroundColor Cyan
        docker images | Select-String "qbittorrent-vps-manager:test"
        
        Write-Host ""
        Write-Host "🚀 测试运行:" -ForegroundColor Cyan
        Write-Host "   docker run -d -p 3001:3001 qbittorrent-vps-manager:test" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "🔍 查看日志:" -ForegroundColor Cyan
        Write-Host "   docker logs <container_id>" -ForegroundColor Yellow
        
    } else {
        Write-Host "❌ 镜像构建失败" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 镜像构建过程中发生错误: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
