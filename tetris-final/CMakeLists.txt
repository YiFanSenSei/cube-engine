# Cube Engine 项目 - 根构建文件
cmake_minimum_required(VERSION 3.16)
project(tetris VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 子目录
add_subdirectory(back_end)
add_subdirectory(tests)