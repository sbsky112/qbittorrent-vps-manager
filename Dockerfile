# 多阶段构建 - 构建阶段
FROM node:18-alpine AS builder

# 安装必要的系统依赖
RUN apk add --no-cache python3 make g++ git

# 设置工作目录
WORKDIR /app

# 复制package.json文件
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# 安装所有依赖
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# 复制源代码
COPY . .

# 构建前端应用
RUN cd client && npm run build

# 生产阶段
FROM node:18-alpine AS production

# 安装运行时依赖
RUN apk add --no-cache dumb-init

# 设置工作目录
WORKDIR /app

# 复制package.json文件
COPY package*.json ./
COPY server/package*.json ./server/

# 只安装生产依赖
RUN npm ci --only=production
RUN cd server && npm ci --only=production

# 从构建阶段复制构建结果和必要文件
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/.env.example ./.env.example

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S qbtmanager -u 1001 -G nodejs

# 创建必要的目录
RUN mkdir -p /app/data /app/uploads /app/logs && \
    chown -R qbtmanager:nodejs /app

# 切换到非root用户
USER qbtmanager

# 暴露端口
EXPOSE 3001

# 设置环境变量
ENV NODE_ENV=production \
    PORT=3001 \
    DB_PATH=/app/data/qbittorrent_manager.db \
    UPLOAD_DIR=/app/uploads \
    LOG_FILE=/app/logs/app.log

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node server/healthcheck.js || exit 1

# 使用dumb-init作为PID 1
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["node", "server/index.js"]
