# 后端 HTTP API 服务
cmake_minimum_required(VERSION 3.16)
project(cube_backend VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 查找必要的依赖
find_package(Threads REQUIRED)

# 如果系统有安装 Crow，可以通过 find_package 查找
# 如果没有，需要下载 crow.h 头文件

# 后端源代码
add_executable(cube_server
    main.cpp
    api.cpp
    api.h
    ../native/tetris_core.cpp
    ../native/tetris_core.h
)

# 链接线程库
target_link_libraries(cube_server PRIVATE
    Threads::Threads
)

# 包含路径
target_include_directories(cube_server PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/../native
)

# Windows 下链接 ws2_32
if(WIN32)
    target_link_libraries(cube_server PRIVATE ws2_32)
endif()

# 下载 crow 头文件（如果不存在）
if(NOT EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/crow.h")
    file(DOWNLOAD
        "https://github.com/CrowCpp/Crow/releases/download/v1.2.0/crow_all.h"
        "${CMAKE_CURRENT_SOURCE_DIR}/crow.h"
        STATUS download_status
    )
    if(NOT download_status EQUAL 0)
        message(WARNING "无法自动下载 crow.h，请手动下载到 back_end/crow.h")
    endif()
endif()