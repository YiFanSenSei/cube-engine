# 查找 Google Test (通过 vcpkg)
find_package(GTest CONFIG REQUIRED)

# 测试可执行文件
add_executable(jiaoshoujia_tests
    main_test.cpp
)

target_link_libraries(jiaoshoujia_tests PRIVATE
    GTest::gtest
    GTest::gtest_main
    hello_lib
)

target_include_directories(jiaoshoujia_tests PRIVATE
    ${CMAKE_SOURCE_DIR}/src
)

# 注册测试
include(GoogleTest)
gtest_discover_tests(jiaoshoujia_tests)

# 设置输出目录
set_target_properties(jiaoshoujia_tests PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin"
)

message(STATUS "已配置测试项目。测试文件: ${CMAKE_CURRENT_SOURCE_DIR}")
