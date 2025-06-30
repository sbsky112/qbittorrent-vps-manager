#!/usr/bin/env node

/**
 * qBittorrent VPS Manager 构建脚本
 * 用于构建前端应用和准备生产环境
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// 执行命令并输出结果
function execCommand(command, cwd = process.cwd()) {
    try {
        logInfo(`执行命令: ${command}`);
        const result = execSync(command, { 
            cwd, 
            stdio: 'inherit',
            encoding: 'utf8'
        });
        return true;
    } catch (error) {
        logError(`命令执行失败: ${command}`);
        logError(error.message);
        return false;
    }
}

// 检查目录是否存在
function checkDirectory(dir) {
    if (!fs.existsSync(dir)) {
        logError(`目录不存在: ${dir}`);
        return false;
    }
    return true;
}

// 检查文件是否存在
function checkFile(file) {
    if (!fs.existsSync(file)) {
        logError(`文件不存在: ${file}`);
        return false;
    }
    return true;
}

// 主构建函数
function build() {
    log('🚀 开始构建 qBittorrent VPS Manager', 'cyan');
    log('=' .repeat(50), 'cyan');

    const startTime = Date.now();

    // 1. 检查必要的目录和文件
    logInfo('检查项目结构...');
    
    const clientDir = path.join(process.cwd(), 'client');
    const serverDir = path.join(process.cwd(), 'server');
    
    if (!checkDirectory(clientDir)) {
        logError('client目录不存在');
        process.exit(1);
    }
    
    if (!checkDirectory(serverDir)) {
        logError('server目录不存在');
        process.exit(1);
    }

    if (!checkFile(path.join(clientDir, 'package.json'))) {
        logError('client/package.json不存在');
        process.exit(1);
    }

    if (!checkFile(path.join(serverDir, 'package.json'))) {
        logError('server/package.json不存在');
        process.exit(1);
    }

    logSuccess('项目结构检查通过');

    // 2. 检查依赖是否已安装
    logInfo('检查依赖安装状态...');
    
    const clientNodeModules = path.join(clientDir, 'node_modules');
    const serverNodeModules = path.join(serverDir, 'node_modules');
    
    if (!fs.existsSync(clientNodeModules)) {
        logWarning('客户端依赖未安装，正在安装...');
        if (!execCommand('npm install', clientDir)) {
            process.exit(1);
        }
    }
    
    if (!fs.existsSync(serverNodeModules)) {
        logWarning('服务器端依赖未安装，正在安装...');
        if (!execCommand('npm install', serverDir)) {
            process.exit(1);
        }
    }

    logSuccess('依赖检查完成');

    // 3. 构建前端应用
    logInfo('构建前端应用...');
    
    if (!execCommand('npm run build', clientDir)) {
        logError('前端构建失败');
        process.exit(1);
    }

    logSuccess('前端构建完成');

    // 4. 检查构建输出
    const distDir = path.join(clientDir, 'dist');
    if (!fs.existsSync(distDir)) {
        logError('构建输出目录不存在');
        process.exit(1);
    }

    const indexHtml = path.join(distDir, 'index.html');
    if (!fs.existsSync(indexHtml)) {
        logError('构建输出文件不完整');
        process.exit(1);
    }

    logSuccess('构建输出检查通过');

    // 5. 创建必要的目录
    logInfo('创建运行时目录...');
    
    const directories = [
        path.join(serverDir, 'database'),
        path.join(serverDir, 'uploads'),
        'logs'
    ];

    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            logInfo(`创建目录: ${dir}`);
        }
    });

    logSuccess('运行时目录准备完成');

    // 6. 显示构建信息
    const endTime = Date.now();
    const buildTime = ((endTime - startTime) / 1000).toFixed(2);

    log('=' .repeat(50), 'green');
    logSuccess(`构建完成！耗时: ${buildTime}秒`);
    log('=' .repeat(50), 'green');

    log('\n📋 构建信息:', 'cyan');
    log(`   前端构建输出: ${distDir}`, 'blue');
    log(`   服务器入口: ${path.join(serverDir, 'index.js')}`, 'blue');
    
    log('\n🚀 启动命令:', 'cyan');
    log('   开发模式: npm run dev', 'yellow');
    log('   生产模式: npm start', 'yellow');
    log('   Docker: docker build -t qbittorrent-vps-manager .', 'yellow');

    log('\n🌐 访问地址:', 'cyan');
    log('   本地访问: http://localhost:3001', 'magenta');
}

// 错误处理
process.on('uncaughtException', (error) => {
    logError('未捕获的异常:');
    console.error(error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logError('未处理的Promise拒绝:');
    console.error(reason);
    process.exit(1);
});

// 运行构建
if (require.main === module) {
    build();
}

module.exports = { build };
