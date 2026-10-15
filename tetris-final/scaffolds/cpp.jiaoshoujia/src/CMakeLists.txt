# 示例库子目录
add_subdirectory(hello)

# 查找 fmt 库
find_package(fmt CONFIG REQUIRED)

# 主程序可执行文件
add_executable(jiaoshoujia_main main.cpp)

# 链接库
target_link_libraries(jiaoshoujia_main PRIVATE hello_lib fmt::fmt)

# 设置输出目录
set_target_properties(jiaoshoujia_main PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin"
)
