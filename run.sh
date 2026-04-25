#!/bin/bash
# 咕噜世界 - 启动脚本

echo "🎮 智障探险队 - 咕噜的世界"
echo "============================"

cd "$(dirname "$0")"

# 检查依赖
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 需要 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

# 运行模式
MODE=${1:-server}
PORT=${2:-3000}

if [ "$MODE" = "server" ]; then
    echo "🚀 启动 API 服务器..."
    echo "   端口: $PORT"
    echo ""
    node agent_mvp.js server $PORT
elif [ "$MODE" = "test" ]; then
    echo "🧪 运行测试模式..."
    echo ""
    node agent_mvp.js test
else
    echo "用法: ./run.sh [server|test] [port]"
    echo ""
    echo "  server - 启动 API 服务器 + 像素界面 (默认)"
    echo "  test   - 运行测试模式"
    echo "  port   - API 服务器端口 (默认: 3000)"
fi
