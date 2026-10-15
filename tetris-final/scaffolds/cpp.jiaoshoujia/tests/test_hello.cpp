#include <gtest/gtest.h>
#include "hello/hello.h"

// 测试：add 函数的基本功能
TEST(HelloTest, AddPositive)
{
    EXPECT_EQ(hello::add(1, 2), 3);
    EXPECT_EQ(hello::add(10, 20), 30);
    EXPECT_EQ(hello::add(0, 0), 0);
}

// 测试：add 函数处理负数
TEST(HelloTest, AddNegative)
{
    EXPECT_EQ(hello::add(-1, -2), -3);
    EXPECT_EQ(hello::add(-5, 5), 0);
    EXPECT_EQ(hello::add(10, -3), 7);
}

// 测试：subtract 函数的基本功能
TEST(HelloTest, SubtractBasic)
{
    EXPECT_EQ(hello::subtract(5, 3), 2);
    EXPECT_EQ(hello::subtract(10, 10), 0);
    EXPECT_EQ(hello::subtract(0, 5), -5);
}

// 测试：subtract 函数处理负数
TEST(HelloTest, SubtractNegative)
{
    EXPECT_EQ(hello::subtract(-1, -2), 1);
    EXPECT_EQ(hello::subtract(-5, 5), -10);
    EXPECT_EQ(hello::subtract(3, -7), 10);
}

// 测试：组合使用 add 和 subtract
TEST(HelloTest, Combined)
{
    int sum = hello::add(10, 20);       // 30
    int result = hello::subtract(sum, 5); // 25
    EXPECT_EQ(result, 25);

    result = hello::add(hello::subtract(100, 30), 10); // (100-30)+10 = 80
    EXPECT_EQ(result, 80);
}

// 测试：大数值
TEST(HelloTest, LargeNumbers)
{
    constexpr int big = 1'000'000;
    EXPECT_EQ(hello::add(big, big), 2 * big);
    EXPECT_EQ(hello::subtract(big, 1), big - 1);
}
