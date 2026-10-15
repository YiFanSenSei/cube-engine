#!/bin/bash
# ============================================
# Cube Engine 后端本地部署脚本
# 用于 VM 上的 GitLab Runner（shell 执行器）
# 功能：编译 → 备份 → 启动 → 健康检查 → 自动回滚
# ============================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$REPO_DIR/back_end"
BUILD_DIR="$BACKEND_DIR/build"
BINARY="$BUILD_DIR/cube_server"
BACKUP_BINARY="$BUILD_DIR/cube_server.backup"
LOG_FILE="/tmp/cube_server.log"

echo "========================================="
echo "🚀 Cube Engine 后端部署脚本"
echo "仓库目录: $REPO_DIR"
echo "========================================="

# ---- 步骤1：编译 ----
echo ""
echo "🔨 [1/5] 编译后端..."
cd "$BACKEND_DIR"
cmake -B build 2>/dev/null || cmake -B build
cmake --build build
echo "✅ 编译完成"

# ---- 步骤2：备份当前版本 ----
echo ""
echo "💾 [2/5] 备份旧版本..."
if [ -f "$BINARY" ]; then
    cp "$BINARY" "$BACKUP_BINARY"
    echo "✅ 已备份到 $BACKUP_BINARY"
else
    echo "⚠️  没有旧版本需要备份"
fi

# ---- 步骤3：停止旧服务 ----
echo ""
echo "⏹️  [3/5] 停止旧服务..."
sudo pkill -f cube_server || echo "⚠️  没有正在运行的服务"
sleep 1
echo "✅ 已停止"

# ---- 步骤4：启动新服务 ----
echo ""
echo "▶️  [4/5] 启动新服务..."
sudo nohup "$BINARY" > "$LOG_FILE" 2>&1 &
NEW_PID=$!
sleep 3
echo "✅ 已启动 (PID: $NEW_PID)"

# ---- 步骤5：健康检查 ----
echo ""
echo "🩺 [5/5] 健康检查..."
if curl -s -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "✅ 部署成功！服务正常运行"
    echo "📍 健康检查: $(curl -s http://localhost:8080/api/health)"
    echo ""
    echo "========================================="
    echo "🎉 部署完成！"
    echo "========================================="
    exit 0
else
    echo "❌ 健康检查失败！"
    echo "📝 日志最后5行:"
    sudo tail -5 "$LOG_FILE" 2>/dev/null || echo "（无日志）"

    # ---- 自动回滚 ----
    if [ -f "$BACKUP_BINARY" ]; then
        echo ""
        echo "🔄 正在回滚到上一版本..."
        sudo pkill -f cube_server || true
        sleep 1
        cp "$BACKUP_BINARY" "$BINARY"
        sudo nohup "$BINARY" > "$LOG_FILE" 2>&1 &
        sleep 3

        if curl -s -f http://localhost:8080/api/health > /dev/null 2>&1; then
            echo "✅ 已成功回滚到上一版本"
            echo "========================================="
            echo "⚠️  部署失败，但已自动回滚"
            echo "========================================="
            exit 0
        else
            echo "❌ 回滚也失败！请登录虚拟机手动检查"
            echo "📝 日志: $LOG_FILE"
            exit 1
        fi
    else
        echo "❌ 无可用备份，部署失败"
        exit 1
    fi
fi
