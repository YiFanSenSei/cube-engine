# ============================================
# Cube Engine 后端 API 服务器 — Docker 多阶段构建
# ============================================
# 构建方式：
#   docker build -t tetris-server:latest .
#   docker run -d -p 8080:8080 --name tetris tetris-server:latest
# ============================================

# ---- 阶段一：编译 ----
FROM gcc:latest AS builder

WORKDIR /app

# 先复制 CMakeLists.txt，利用 Docker 缓存层加速重复构建
COPY back_end/CMakeLists.txt back_end/
# 复制源代码
COPY back_end/main.cpp back_end/
COPY back_end/api.cpp back_end/
COPY back_end/api.h back_end/
COPY native/ native/

# 编译
RUN apt-get update && apt-get install -y cmake && \
    cd back_end && \
    cmake -B build && \
    cmake --build build && \
    apt-get clean

# ---- 阶段二：运行镜像 ----
FROM debian:bookworm-slim

# 安装运行时依赖（ca-certificates 用于 HTTPS 下载）
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# 从编译阶段拷贝二进制
COPY --from=builder /app/back_end/build/cube_server /usr/local/bin/cube_server

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# 启动
CMD ["cube_server"]
