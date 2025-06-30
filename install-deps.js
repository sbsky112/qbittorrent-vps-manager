#!/usr/bin/env node

/**
 * qBittorrent VPS Manager 依赖安装脚本
 * 自动安装所有必要的依赖包
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
        execSync(command, { 
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

// 检查Node.js版本
function checkNodeVersion() {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    logInfo(`当前Node.js版本: ${nodeVersion}`);
    
    if (majorVersion < 16) {
        logError('需要Node.js 16.0.0或更高版本');
        logError('请访问 https://nodejs.org/ 下载最新版本');
        return false;
    }
    
    logSuccess('Node.js版本检查通过');
    return true;
}

// 检查npm版本
function checkNpmVersion() {
    try {
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        logInfo(`当前npm版本: ${npmVersion}`);
        logSuccess('npm版本检查通过');
        return true;
    } catch (error) {
        logError('npm未安装或不可用');
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

// 安装依赖
function installDependencies() {
    log('📦 开始安装 qBittorrent VPS Manager 依赖', 'cyan');
    log('=' .repeat(60), 'cyan');

    const startTime = Date.now();

    // 1. 检查环境
    logInfo('检查运行环境...');
    
    if (!checkNodeVersion()) {
        process.exit(1);
    }
    
    if (!checkNpmVersion()) {
        process.exit(1);
    }

    // 2. 检查项目结构
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

    logSuccess('项目结构检查通过');

    // 3. 安装根目录依赖
    logInfo('安装根目录依赖...');
    if (!execCommand('npm install')) {
        logError('根目录依赖安装失败');
        process.exit(1);
    }
    logSuccess('根目录依赖安装完成');

    // 4. 安装服务器端依赖
    logInfo('安装服务器端依赖...');
    if (!execCommand('npm install', serverDir)) {
        logError('服务器端依赖安装失败');
        process.exit(1);
    }
    logSuccess('服务器端依赖安装完成');

    // 5. 安装客户端依赖
    logInfo('安装客户端依赖...');
    if (!execCommand('npm install', clientDir)) {
        logError('客户端依赖安装失败');
        process.exit(1);
    }
    logSuccess('客户端依赖安装完成');

    // 6. 验证安装
    logInfo('验证依赖安装...');
    
    const checkPaths = [
        path.join(process.cwd(), 'node_modules'),
        path.join(serverDir, 'node_modules'),
        path.join(clientDir, 'node_modules')
    ];

    for (const checkPath of checkPaths) {
        if (!fs.existsSync(checkPath)) {
            logError(`依赖目录不存在: ${checkPath}`);
            process.exit(1);
        }
    }

    logSuccess('依赖安装验证通过');

    // 7. 显示安装信息
    const endTime = Date.now();
    const installTime = ((endTime - startTime) / 1000).toFixed(2);

    log('=' .repeat(60), 'green');
    logSuccess(`依赖安装完成！耗时: ${installTime}秒`);
    log('=' .repeat(60), 'green');

    log('\n📋 安装信息:', 'cyan');
    log(`   根目录依赖: ${path.join(process.cwd(), 'node_modules')}`, 'blue');
    log(`   服务器依赖: ${path.join(serverDir, 'node_modules')}`, 'blue');
    log(`   客户端依赖: ${path.join(clientDir, 'node_modules')}`, 'blue');
    
    log('\n🚀 下一步操作:', 'cyan');
    log('   配置环境: cp .env.example .env', 'yellow');
    log('   开发模式: npm run dev', 'yellow');
    log('   构建项目: npm run build', 'yellow');
    log('   生产模式: npm start', 'yellow');

    log('\n📚 更多信息:', 'cyan');
    log('   README: https://github.com/sbsky112/qbittorrent-vps-manager#readme', 'magenta');
    log('   部署指南: https://github.com/sbsky112/qbittorrent-vps-manager/blob/main/DEPLOYMENT.md', 'magenta');
}

// 清理函数
function cleanup() {
    logInfo('清理临时文件...');
    // 这里可以添加清理逻辑
    logSuccess('清理完成');
}

// 错误处理
process.on('uncaughtException', (error) => {
    logError('未捕获的异常:');
    console.error(error);
    cleanup();
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logError('未处理的Promise拒绝:');
    console.error(reason);
    cleanup();
    process.exit(1);
});

// 信号处理
process.on('SIGINT', () => {
    log('\n收到中断信号，正在退出...', 'yellow');
    cleanup();
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('\n收到终止信号，正在退出...', 'yellow');
    cleanup();
    process.exit(0);
});

// 运行安装
if (require.main === module) {
    installDependencies();
}

module.exports = { installDependencies };
