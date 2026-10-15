# CMake 最低版本要求
cmake_minimum_required(VERSION 3.20)

# 项目名称和语言
project(cpp_jiaoshoujia LANGUAGES CXX)

# 设置 C++ 标准为 C++20
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# MSVC 特殊设置：UTF-8 源码编码 + 控制台输出
if(MSVC)
    add_compile_options(/utf-8)
endif()

# --- 构建类型 ---
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE "Debug" CACHE STRING "Build type" FORCE)
endif()

# --- 打印编译器信息 ---
message(STATUS "编译器: ${CMAKE_CXX_COMPILER_ID} ${CMAKE_CXX_COMPILER_VERSION}")
message(STATUS "构建类型: ${CMAKE_BUILD_TYPE}")

# --- 启用测试 ---
option(BUILD_TESTS "Build unit tests" ON)

# --- 子目录 ---
add_subdirectory(src)

# --- 单元测试 ---
if(BUILD_TESTS)
    enable_testing()
    add_subdirectory(tests)
endif()

message(STATUS "已配置 cpp.jiaoshoujia 项目。")
message(STATUS "编译选项: C++${CMAKE_CXX_STANDARD}, ${CMAKE_BUILD_TYPE}")
