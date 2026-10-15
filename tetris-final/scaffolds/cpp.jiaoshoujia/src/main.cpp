#include "hello/hello.h"
#include <iostream>
#include <fmt/core.h>

#ifdef _WIN32
#include <windows.h>
#endif

int main()
{
#ifdef _WIN32
    // 设置控制台输出为 UTF-8，解决中文乱码
    SetConsoleOutputCP(CP_UTF8);
#endif

    std::cout << "======================================" << std::endl;
    std::cout << "   C++ 脚手架项目 - cpp.jiaoshoujia    " << std::endl;
    std::cout << "======================================" << std::endl;
    std::cout << std::endl;

    // 使用示例库
    hello::printHello();

    // 使用 fmt 库
    fmt::print("使用 fmt 库: 项目名称 = {}, 版本 = {}\n", "cpp.jiaoshoujia", "1.0.0");

    // 调用计算函数
    int a = 42, b = 23;
    std::cout << "调用示例库: " << a << " + " << b << " = " << hello::add(a, b) << std::endl;
    std::cout << "调用示例库: " << a << " - " << b << " = " << hello::subtract(a, b) << std::endl;

    std::cout << std::endl;
    std::cout << "======================================" << std::endl;
    std::cout << "   项目已就绪，欢迎开始开发！           " << std::endl;
    std::cout << "======================================" << std::endl;

    return 0;
}
