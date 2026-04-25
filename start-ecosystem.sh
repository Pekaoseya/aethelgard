#!/bin/bash

# ==========================================
# 艾瑟雅大陆 - Agent生态圈 Demo 启动脚本
# ==========================================

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║   🏰 艾瑟雅大陆 - Agent生态圈 Demo                      ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo ""

# 进入目录
cd "$(dirname "$0")" || exit 1

# 启动服务器
echo "🚀 启动生态圈服务器..."
echo ""
echo "📍 访问地址: http://localhost:5000"
echo "📊 API状态:  http://localhost:5000/api/ecosystem/status"
echo "📜 事件日志: http://localhost:5000/api/ecosystem/events"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "─────────────────────────────────────────"
echo ""

node standalone_server.js
