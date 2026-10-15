# 单元测试配置
cmake_minimum_required(VERSION 3.16)
project(tetris_tests VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# MSVC 编码设置
if(MSVC)
    add_compile_options(/utf-8)
endif()

# 优先查找系统已安装的 GTest（vcpkg），找不到则自动下载
find_package(GTest QUIET)
if(NOT GTest_FOUND)
    message(STATUS "未找到系统 GTest，通过 FetchContent 自动下载...")
    include(FetchContent)
    FetchContent_Declare(
        googletest
        URL https://github.com/google/googletest/archive/refs/tags/v1.14.0.zip
    )
    set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
    FetchContent_MakeAvailable(googletest)
else()
    message(STATUS "使用系统已安装的 GTest")
endif()

find_package(Threads REQUIRED)

# 测试可执行文件
add_executable(tetris_test
    test_tetris_core.cpp
    ../native/tetris_core.cpp
    ../native/tetris_core.h
)

target_include_directories(tetris_test PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/../native
)

target_link_libraries(tetris_test PRIVATE
    GTest::gtest
    GTest::gtest_main
    Threads::Threads
)

# 启用测试
include(GoogleTest)
gtest_discover_tests(tetris_test)