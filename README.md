# qBittorrent VPS Manager

一个现代化的Web界面，用于管理多台VPS服务器上的qBittorrent-nox实例。支持实时监控、种子管理、文件上传等功能。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-16%2B-green.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)
![SQLite](https://img.shields.io/badge/database-SQLite-orange.svg)

## ✨ 功能特性

### 🖥️ VPS管理
- **多VPS支持**: 管理多台VPS服务器上的qBittorrent实例
- **实时监控**: 实时显示VPS在线状态和响应时间
- **状态指示**: 直观的在线/离线状态显示
- **存储监控**: 显示每台VPS的磁盘使用情况和剩余空间

### 📁 种子管理
- **实时同步**: 3秒间隔自动同步下载/上传速度和进度
- **多种添加方式**: 支持磁力链接、种子文件上传
- **批量操作**: 支持批量暂停、恢复、删除种子
- **智能筛选**: 按状态、VPS筛选种子
- **详细信息**: 显示种子详细信息、进度、速度等

### 🎨 用户界面
- **现代化设计**: 基于React和Tailwind CSS的现代UI
- **响应式布局**: 完美适配桌面和移动设备
- **实时状态**: 实时显示下载/上传状态和进度
- **进度可视化**: 直观的进度条和状态指示器

### ⚡ 性能优化
- **智能更新**: 只更新变化的数据，减少网络开销
- **错误处理**: 完善的错误处理和用户提示
- **状态保持**: 页面刷新后保持操作状态
- **资源管理**: 优化的内存和CPU使用

## 🛠️ 技术栈

### 后端
- **Node.js**: 服务器运行环境
- **Express.js**: Web框架
- **SQLite**: 轻量级数据库
- **WebSocket**: 实时通信
- **Axios**: HTTP客户端

### 前端
- **React 18**: 用户界面框架
- **React Router**: 路由管理
- **Tailwind CSS**: 样式框架
- **Lucide React**: 图标库
- **Vite**: 构建工具

### 数据库
- **SQLite**: 主数据库，存储VPS配置和状态
- **自动迁移**: 从JSON文件自动迁移到SQLite
- **事务支持**: 保证数据一致性

## 📋 系统要求

### 服务器要求
- **Node.js**: 16.0.0 或更高版本
- **内存**: 最少512MB，推荐1GB+
- **磁盘空间**: 最少1GB可用空间
- **操作系统**: Windows、Linux、macOS

### VPS要求
- **qBittorrent-nox**: 已安装并运行
- **Web UI**: 已启用qBittorrent Web界面
- **网络访问**: 管理服务器能访问VPS的qBittorrent端口

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/sbsky112/qbittorrent-vps-manager.git
cd qbittorrent-vps-manager
```

### 2. 安装依赖
```bash
# 自动安装所有依赖
npm run install:deps

# 或者手动安装
npm install
cd server && npm install
cd ../client && npm install
```

### 3. 配置环境
```bash
# 复制环境配置文件
cp .env.example .env

# 编辑配置文件
nano .env
```

### 4. 启动应用

#### 开发模式
```bash
npm run dev
```
- 前端: http://localhost:3000
- 后端: http://localhost:3001

#### 生产模式
```bash
# 构建前端
npm run build

# 启动生产服务器
npm start
```
- 访问: http://localhost:3001

## ⚙️ 配置说明

### 环境变量配置
编辑`.env`文件：

```env
# 服务器配置
PORT=3001
NODE_ENV=production

# 数据库配置
DB_PATH=./database/qbittorrent_manager.db

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB

# VPS监控配置
VPS_CHECK_INTERVAL=30000  # 30秒
VPS_TIMEOUT=10000         # 10秒

# 实时同步配置
REALTIME_UPDATE_INTERVAL=3000  # 3秒

# 安全配置
CORS_ORIGIN=http://localhost:3000
SESSION_SECRET=your-secret-key-here
```

### VPS配置
在Web界面中添加VPS：

1. 访问"VPS管理"页面
2. 点击"添加VPS"
3. 填写VPS信息：
   - **名称**: VPS显示名称
   - **主机地址**: VPS IP地址或域名
   - **端口**: qBittorrent Web UI端口（默认8080）
   - **用户名**: qBittorrent Web UI用户名
   - **密码**: qBittorrent Web UI密码

## 📖 使用指南

### VPS管理
1. **添加VPS**: 在VPS管理页面添加新的VPS服务器
2. **测试连接**: 添加后自动测试连接状态
3. **编辑配置**: 修改VPS连接信息
4. **删除VPS**: 删除不需要的VPS配置

### 种子管理
1. **查看种子**: 在种子管理页面查看所有VPS的种子
2. **添加种子**: 
   - 磁力链接：直接粘贴磁力链接
   - 种子文件：上传.torrent文件
3. **管理种子**:
   - 暂停/恢复下载
   - 删除种子（可选择是否删除文件）
   - 查看详细信息

### 监控功能
- **实时状态**: 自动更新VPS在线状态
- **下载统计**: 实时显示下载/上传速度
- **存储监控**: 显示磁盘使用情况
- **历史记录**: 查看VPS状态历史

## 🔧 开发指南

### 项目结构
```
qbittorrent-vps-manager/
├── client/                 # 前端React应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/         # 页面组件
│   │   └── utils/         # 工具函数
│   ├── public/            # 静态资源
│   └── package.json       # 前端依赖
├── server/                # 后端Node.js应用
│   ├── routes/            # API路由
│   ├── services/          # 业务逻辑
│   ├── database/          # 数据库相关
│   └── package.json       # 后端依赖
├── .env.example           # 环境配置示例
├── package.json           # 根项目配置
└── README.md             # 项目说明
```

### 可用脚本
```bash
# 开发
npm run dev              # 启动开发服务器
npm run server:dev       # 仅启动后端开发服务器
npm run client:dev       # 仅启动前端开发服务器

# 构建
npm run build           # 构建前端应用
npm run build:client    # 仅构建前端

# 生产
npm start              # 启动生产服务器
npm run preview        # 预览构建结果

# 工具
npm run install:deps   # 安装所有依赖
npm run clean         # 清理node_modules
npm run lint          # 代码检查
```

### API接口
主要API端点：

```
GET    /api/vps           # 获取VPS列表
POST   /api/vps           # 添加VPS
PUT    /api/vps/:id       # 更新VPS
DELETE /api/vps/:id       # 删除VPS
GET    /api/vps/status    # 获取VPS状态

GET    /api/torrents      # 获取所有种子
GET    /api/torrents/:vpsId        # 获取指定VPS种子
GET    /api/torrents/:vpsId/info   # 获取VPS详细信息
POST   /api/torrents/:vpsId/add    # 添加种子
```

## 🚀 部署指南

详细的生产环境部署指南请参考 [DEPLOYMENT.md](DEPLOYMENT.md)

### Docker部署（推荐）
```bash
# 构建镜像
docker build -t qbittorrent-vps-manager .

# 运行容器
docker run -d \
  --name qbt-manager \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  qbittorrent-vps-manager
```

### PM2部署
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

### 开发规范
- 使用ESLint进行代码检查
- 遵循React和Node.js最佳实践
- 添加适当的注释和文档
- 确保所有测试通过

## 📝 更新日志

### v1.0.0 (2025-7-1)
- ✨ 初始版本发布
- 🎉 支持多VPS管理
- 📁 完整的种子管理功能
- 🔄 实时状态监控
- 💾 SQLite数据库支持
- 🎨 现代化Web界面

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [qBittorrent](https://www.qbittorrent.org/) - 优秀的BitTorrent客户端
- [React](https://reactjs.org/) - 用户界面框架
- [Express.js](https://expressjs.com/) - Web应用框架
- [SQLite](https://www.sqlite.org/) - 轻量级数据库

## 📞 支持

如果你遇到问题或有建议，请：

1. 查看[常见问题](docs/FAQ.md)
2. 搜索[已有Issues](https://github.com/sbsky112/qbittorrent-vps-manager/issues)
3. 创建[新Issue](https://github.com/sbsky112/qbittorrent-vps-manager/issues/new)

---

⭐ 如果这个项目对你有帮助，请给它一个星标！
