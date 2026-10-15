#include <gtest/gtest.h>
#include <iostream>

int main(int argc, char** argv)
{
    std::cout << "======================================" << std::endl;
    std::cout << "   运行 Google Test 单元测试           " << std::endl;
    std::cout << "======================================" << std::endl;

    testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
