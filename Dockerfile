# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json文件
COPY package*.json ./

# 安装根目录依赖
RUN npm install

# 复制服务器端代码和package.json
COPY server/package*.json ./server/
RUN cd server && npm install

# 复制客户端代码和package.json
COPY client/package*.json ./client/
RUN cd client && npm install

# 复制所有源代码
COPY . .

# 构建前端应用
RUN npm run build

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S qbtmanager -u 1001

# 创建必要的目录并设置权限
RUN mkdir -p /app/server/database /app/server/uploads /app/logs
RUN chown -R qbtmanager:nodejs /app

# 切换到非root用户
USER qbtmanager

# 暴露端口
EXPOSE 3001

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node server/healthcheck.js || exit 1

# 启动应用
CMD ["npm", "start"]
