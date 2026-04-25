FROM node:18-alpine

WORKDIR /app

# 安装静态文件服务依赖
COPY 咕噜_world.html .
COPY assets/ ./assets/
COPY agent_mvp.js .

EXPOSE 3002

# 使用简单静态服务器
CMD ["sh", "-c", "npm install -g serve > /dev/null 2>&1 && serve -l 3002 -s ."]
