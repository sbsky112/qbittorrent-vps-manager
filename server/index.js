const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const vpsRoutes = require('./routes/vps');
const torrentRoutes = require('./routes/torrents');
const { initDatabase } = require('./database/init');
const { startMonitoring } = require('./services/monitoring');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// API路由
app.use('/api/vps', vpsRoutes);
app.use('/api/torrents', torrentRoutes);

// SPA回退路由 - 必须放在静态文件服务之后，API路由之后
app.get('*', (req, res) => {
  // 如果请求的是API路径，返回404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // 对于所有其他路径，返回index.html（SPA路由处理）
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// WebSocket连接处理
wss.on('connection', (ws) => {
  console.log('客户端已连接');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('收到消息:', data);
    } catch (error) {
      console.error('解析消息失败:', error);
    }
  });

  ws.on('close', () => {
    console.log('客户端已断开连接');
  });
});

// 全局WebSocket广播函数
global.broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// 初始化数据库和启动监控
async function startServer() {
  try {
    await initDatabase();
    console.log('数据库初始化完成');
    
    startMonitoring();
    console.log('VPS监控服务已启动');
    
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();
