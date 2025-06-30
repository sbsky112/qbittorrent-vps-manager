# qBittorrent VPS Manager Windows 安装脚本
# PowerShell 5.0+ 支持

param(
    [switch]$SkipNodeCheck,
    [switch]$Development
)

# 设置错误处理
$ErrorActionPreference = "Stop"

# 颜色函数
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Info($message) {
    Write-ColorOutput Blue "[INFO] $message"
}

function Write-Success($message) {
    Write-ColorOutput Green "[SUCCESS] $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "[WARNING] $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "[ERROR] $message"
}

# 检查管理员权限
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# 检查Node.js
function Test-NodeJS {
    if ($SkipNodeCheck) {
        Write-Info "跳过Node.js检查"
        return $true
    }
    
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            $version = $nodeVersion.Substring(1).Split('.')[0]
            if ([int]$version -ge 16) {
                Write-Success "Node.js $nodeVersion 已安装"
                return $true
            } else {
                Write-Warning "Node.js版本过低: $nodeVersion (需要16+)"
                return $false
            }
        }
    } catch {
        Write-Warning "Node.js未安装"
        return $false
    }
    return $false
}

# 安装Node.js
function Install-NodeJS {
    Write-Info "正在下载Node.js安装程序..."
    
    $nodeUrl = "https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi"
    $nodeInstaller = "$env:TEMP\nodejs-installer.msi"
    
    try {
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
        Write-Info "正在安装Node.js..."
        Start-Process msiexec.exe -Wait -ArgumentList "/i $nodeInstaller /quiet"
        Remove-Item $nodeInstaller -Force
        
        # 刷新环境变量
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Success "Node.js安装完成"
        return $true
    } catch {
        Write-Error "Node.js安装失败: $($_.Exception.Message)"
        return $false
    }
}

# 克隆项目
function Get-Project {
    Write-Info "克隆项目代码..."
    
    if (Test-Path "qbittorrent-vps-manager") {
        Write-Warning "项目目录已存在，正在更新..."
        Set-Location "qbittorrent-vps-manager"
        git pull origin main
    } else {
        git clone https://github.com/your-username/qbittorrent-vps-manager.git
        Set-Location "qbittorrent-vps-manager"
    }
    
    Write-Success "项目代码准备完成"
}

# 安装依赖
function Install-Dependencies {
    Write-Info "安装项目依赖..."
    
    try {
        npm run install:deps
        Write-Success "依赖安装完成"
        return $true
    } catch {
        Write-Error "依赖安装失败: $($_.Exception.Message)"
        return $false
    }
}

# 配置环境
function Set-Environment {
    Write-Info "配置环境变量..."
    
    if (-not (Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
        Write-Info "已创建.env配置文件，请根据需要修改配置"
    } else {
        Write-Info ".env文件已存在"
    }
}

# 构建项目
function Build-Project {
    if ($Development) {
        Write-Info "开发模式，跳过构建"
        return $true
    }
    
    Write-Info "构建前端项目..."
    
    try {
        npm run build
        Write-Success "项目构建完成"
        return $true
    } catch {
        Write-Error "项目构建失败: $($_.Exception.Message)"
        return $false
    }
}

# 创建启动脚本
function New-StartupScript {
    $startScript = @"
@echo off
title qBittorrent VPS Manager
echo Starting qBittorrent VPS Manager...
cd /d "%~dp0"
npm start
pause
"@
    
    $startScript | Out-File -FilePath "start.bat" -Encoding ASCII
    
    $devScript = @"
@echo off
title qBittorrent VPS Manager (Development)
echo Starting qBittorrent VPS Manager in development mode...
cd /d "%~dp0"
npm run dev
pause
"@
    
    $devScript | Out-File -FilePath "start-dev.bat" -Encoding ASCII
    
    Write-Success "启动脚本已创建"
}

# 配置防火墙
function Set-Firewall {
    if (-not (Test-Administrator)) {
        Write-Warning "需要管理员权限配置防火墙，请手动开放3001端口"
        return
    }
    
    Write-Info "配置Windows防火墙..."
    
    try {
        New-NetFirewallRule -DisplayName "qBittorrent VPS Manager" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
        Write-Success "防火墙规则已添加"
    } catch {
        Write-Warning "防火墙配置失败，请手动开放3001端口"
    }
}

# 显示完成信息
function Show-Completion {
    Write-Success "安装完成！"
    Write-Output ""
    Write-Output "🎉 qBittorrent VPS Manager 已成功安装"
    Write-Output ""
    Write-Output "📋 启动方式:"
    if ($Development) {
        Write-Output "   开发模式: 双击 start-dev.bat 或运行 npm run dev"
    } else {
        Write-Output "   生产模式: 双击 start.bat 或运行 npm start"
    }
    Write-Output "   访问地址: http://localhost:3001"
    Write-Output ""
    Write-Output "🔧 其他命令:"
    Write-Output "   构建项目: npm run build"
    Write-Output "   安装依赖: npm run install:deps"
    Write-Output "   清理缓存: npm run clean"
    Write-Output ""
    Write-Output "📚 更多信息: https://github.com/your-username/qbittorrent-vps-manager"
}

# 主函数
function Main {
    Write-Output "🚀 qBittorrent VPS Manager Windows 安装脚本"
    Write-Output "=============================================="
    Write-Output ""
    
    # 检查Git
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Error "请先安装Git: https://git-scm.com/download/win"
        exit 1
    }
    
    # 检查和安装Node.js
    if (-not (Test-NodeJS)) {
        $install = Read-Host "是否自动安装Node.js? (y/N)"
        if ($install -eq 'y' -or $install -eq 'Y') {
            if (-not (Install-NodeJS)) {
                exit 1
            }
        } else {
            Write-Error "请手动安装Node.js 16+: https://nodejs.org/"
            exit 1
        }
    }
    
    # 执行安装步骤
    Get-Project
    Install-Dependencies
    Set-Environment
    Build-Project
    New-StartupScript
    Set-Firewall
    Show-Completion
}

# 运行主函数
try {
    Main
} catch {
    Write-Error "安装过程中发生错误: $($_.Exception.Message)"
    Write-Output "请检查错误信息并重试，或手动安装"
    exit 1
}
