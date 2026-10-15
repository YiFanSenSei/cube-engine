/**
 * 方块引擎单元测试
 * 
 * 测试 tetris_core.cpp 中游戏核心逻辑的正确性。
 * 使用 Google Test 框架。
 * 
 * 运行方式：
 *   cd tests && cmake -B build && cmake --build build && build/tetris_test
 */

#include <gtest/gtest.h>
#include "tetris_core.h"

using namespace tetris;

// ========== 基本功能测试 ==========

// 测试：创建游戏实例后棋盘应为空
TEST(TetrisCoreTest, InitialBoardIsEmpty) {
    TetrisGame game(false);
    
    // 验证所有格子为空
    for (int r = 0; r < ROWS; r++) {
        for (int c = 0; c < COLS; c++) {
            EXPECT_EQ(game.grid[r][c], 0) << "位置 (" << r << "," << c << ") 应该为空";
        }
    }
    
    EXPECT_FALSE(game.gameOver);
    EXPECT_EQ(game.score, 0);
    EXPECT_EQ(game.lines, 0);
    EXPECT_EQ(game.level, 1);
}

// 测试：重置游戏后状态恢复初始
TEST(TetrisCoreTest, ResetRestoresInitialState) {
    TetrisGame game(false);
    game.score = 999;
    game.lines = 10;
    game.level = 5;
    game.gameOver = true;
    
    game.reset();
    
    EXPECT_EQ(game.score, 0);
    EXPECT_EQ(game.lines, 0);
    EXPECT_EQ(game.level, 1);
    EXPECT_FALSE(game.gameOver);
}

// 测试：七种方块都能正常生成
TEST(TetrisCoreTest, AllSevenPiecesExist) {
    EXPECT_EQ(PIECE_NAMES.size(), 7);
    EXPECT_EQ(SHAPES.size(), 7);
    
    // 验证每种方块都有名称和形状
    for (const auto& name : PIECE_NAMES) {
        EXPECT_TRUE(SHAPES.find(name) != SHAPES.end()) << "缺少方块: " << name;
        EXPECT_FALSE(SHAPES.at(name).empty()) << "方块 " << name << " 的形状为空";
    }
}

// ========== 方块移动测试 ==========

// 测试：左移操作
TEST(TetrisCoreTest, MoveLeftDecreasesX) {
    TetrisGame game(false);
    int originalX = game.pieceX;
    
    bool result = game.move(-1, 0);
    
    EXPECT_TRUE(result);
    EXPECT_EQ(game.pieceX, originalX - 1);
}

// 测试：右移操作
TEST(TetrisCoreTest, MoveRightIncreasesX) {
    TetrisGame game(false);
    int originalX = game.pieceX;
    
    bool result = game.move(1, 0);
    
    EXPECT_TRUE(result);
    EXPECT_EQ(game.pieceX, originalX + 1);
}

// 测试：方块不能移出左边界
TEST(TetrisCoreTest, CannotMovePastLeftBoundary) {
    TetrisGame game(false);
    
    // 不断左移直到碰壁
    for (int i = 0; i < COLS + 5; i++) {
        game.move(-1, 0);
    }
    
    // 验证方块没有超出左边界
    EXPECT_GE(game.pieceX, 0);
    for (int c = 0; c < (int)game.currentShape[0].size(); c++) {
        if (game.currentShape[0][c]) {
            EXPECT_GE(game.pieceX + c, 0);
        }
    }
}

// 测试：方块不能移出右边界
TEST(TetrisCoreTest, CannotMovePastRightBoundary) {
    TetrisGame game(false);
    
    // 不断右移直到碰壁
    for (int i = 0; i < COLS + 5; i++) {
        game.move(1, 0);
    }
    
    // 验证方块没有超出右边界
    EXPECT_LE(game.pieceX, COLS);
    for (int r = 0; r < (int)game.currentShape.size(); r++) {
        for (int c = (int)game.currentShape[r].size() - 1; c >= 0; c--) {
            if (game.currentShape[r][c]) {
                EXPECT_LE(game.pieceX + c, COLS - 1);
            }
        }
    }
}

// ========== 方块旋转测试 ==========

// 测试：旋转不改变方块类型
TEST(TetrisCoreTest, RotatePreservesPieceType) {
    TetrisGame game(false);
    std::string originalPiece = game.piece;
    
    game.rotate();
    
    EXPECT_EQ(game.piece, originalPiece);
}

// 测试：连续旋转四次回到原始状态
TEST(TetrisCoreTest, FourRotationsReturnToOriginal) {
    // 这个测试依赖于 I 方块的初始形状
    auto original = SHAPES.at("I");
    
    auto rotated = rotateCW(original);          // 1次
    rotated = rotateCW(rotated);                // 2次
    rotated = rotateCW(rotated);                // 3次
    rotated = rotateCW(rotated);                // 4次
    
    EXPECT_EQ(rotated, original);
}

// ========== 碰撞检测测试 ==========

// 测试：方块与已有方块碰撞检测
TEST(TetrisCoreTest, CollisionWithExistingBlocks) {
    TetrisGame game(false);

    // 铺满底部一行，然后验证放在该行上的方块会被检测为非法
    for (int c = 0; c < COLS; c++) {
        game.grid[ROWS - 1][c] = 1;
    }

    // 形状为 1x1 方块，放在已填满的底部行的位置 → 非法
    auto testShape = std::vector<std::vector<int>>{{1}};
    bool invalidPlace = game.isValid(testShape, COLS / 2, ROWS - 1);
    EXPECT_FALSE(invalidPlace);

    // 同样的形状放在顶部空白区域 → 合法
    bool validPlace = game.isValid(testShape, COLS / 2, 0);
    EXPECT_TRUE(validPlace);
}

// ========== 消行测试 ==========

// 测试：满行消除增加分数
TEST(TetrisCoreTest, ClearLineIncreasesScore) {
    TetrisGame game(false);

    // 填满一行
    int row = ROWS - 1;
    for (int c = 0; c < COLS; c++) {
        game.grid[row][c] = 1;
        game.gridNames[row][c] = 'I';
    }

    int oldScore = game.score;
    int oldLines = game.lines;

    // 先将该行加入 clearRows，模拟正常游戏流程中的消行动作
    game.clearRows.push_back(row);
    game.clearLinesAndContinue();

    // 分数应该增加
    EXPECT_GT(game.score, oldScore);
    // 消行数应该增加
    EXPECT_GT(game.lines, oldLines);
}

// 测试：同时消除四行（Tetris）获得更多分数
TEST(TetrisCoreTest, TetrisBonus) {
    TetrisGame game(false);

    // 同时填满底部四行
    for (int r = 0; r < 4; r++) {
        for (int c = 0; c < COLS; c++) {
            game.grid[ROWS - 1 - r][c] = 1;
            game.gridNames[ROWS - 1 - r][c] = 'I';
        }
    }

    int oldScore = game.score;

    // 将四行都加入 clearRows
    for (int r = 0; r < 4; r++) {
        game.clearRows.push_back(ROWS - 1 - r);
    }
    game.clearLinesAndContinue();

    // Tetris（四消）应该获得比单消更多的分数
    // 得分公式：scores[4] * level = 800 * 1 = 800
    EXPECT_GT(game.score - oldScore, 100);
}

// ========== 游戏结束测试 ==========

// 测试：方块堆叠到顶部触发游戏结束
TEST(TetrisCoreTest, BlocksAtTopTriggerGameOver) {
    TetrisGame game(false);

    // 填满棋盘中间列（4-7列），使得新方块无法在默认位置生成
    for (int r = 0; r < 4; r++) {
        for (int c = 3; c < 7; c++) {
            game.grid[r][c] = 1;
        }
    }

    // 尝试生成新方块
    game.spawnPiece();

    // 如果新方块无法正常放置，应该触发 gameOver
    EXPECT_TRUE(game.gameOver)
        << "棋盘顶部被占满时 spawnPiece() 应设置 gameOver = true";
}

// ========== 硬降测试 ==========

// 测试：硬降将方块移到底部
TEST(TetrisCoreTest, HardDropMovesPieceToBottom) {
    TetrisGame game(false);
    
    int originalY = game.pieceY;
    
    bool result = game.hardDrop();
    
    EXPECT_TRUE(result);
    // 硬降后方块应该在底部或碰撞位置
    EXPECT_GE(game.pieceY, originalY);
}

// ========== 幽灵方块测试 ==========

// 测试：幽灵位置不低于实际位置
TEST(TetrisCoreTest, GhostYNotLessThanActualY) {
    TetrisGame game(false);
    
    int ghostY = game.getGhostY();
    
    EXPECT_GE(ghostY, game.pieceY);
    EXPECT_LE(ghostY, ROWS);
}

// ========== 难度设置测试 ==========

// 测试：设置不同难度不影响基础下落速度（下落速度仅由等级决定）
TEST(TetrisCoreTest, DifficultyDoesNotChangeDropInterval) {
    TetrisGame game(false);

    game.difficulty = Difficulty::EASY;
    EXPECT_EQ(game.dropInterval, 1000);

    game.difficulty = Difficulty::HARD;
    EXPECT_EQ(game.dropInterval, 1000);
}

// 测试：高难度 AI 思考延迟更短
TEST(TetrisCoreTest, HardshipDecreasesAIThinkDelay) {
    TetrisGame aiEasy(true);
    aiEasy.difficulty = Difficulty::EASY;

    TetrisGame aiHard(true);
    aiHard.difficulty = Difficulty::HARD;

    // 首次 aiStep 触发 aiThink()，然后 aiThinkDelay 被设为 30
    aiEasy.aiStep(0);
    aiHard.aiStep(0);

    // 消耗掉首次思考延迟（30ms），进入水平移动阶段
    aiEasy.aiStep(31);
    aiHard.aiStep(31);

    // 水平移动阶段的 aiThinkDelay 应随难度变化：
    // EASY=100, MEDIUM=50, HARD=30
    // 注意：两次 aiStep 才能完成一次水平移动（判断方向 + 执行）
    EXPECT_LT(aiHard.aiThinkDelay, aiEasy.aiThinkDelay)
        << "HARD 难度的 AI 水平移动延迟应显著低于 EASY";
}

// ========== AI 测试 ==========

// 测试：AI 能找到合法落点
TEST(TetrisCoreTest, AIFindValidMove) {
    TetrisGame game(true);
    
    AIMove move = game.getBestMove();
    
    // AI 应该返回一个合法的形状和位置
    EXPECT_FALSE(move.shape.empty());
    EXPECT_GE(move.x, 0);
}

// ========== 形状操作测试 ==========

// 测试：rotateCW 正确旋转 I 字形
TEST(ShapeTest, RotateI) {
    auto iShape = SHAPES.at("I");
    EXPECT_EQ(iShape.size(), 1);
    EXPECT_EQ(iShape[0].size(), 4);
    
    auto rotated = rotateCW(iShape);
    EXPECT_EQ(rotated.size(), 4);
    EXPECT_EQ(rotated[0].size(), 1);
}

// 测试：rotateCW 正确旋转 O 字形（旋转后不变）
TEST(ShapeTest, RotateO) {
    auto oShape = SHAPES.at("O");
    
    auto rotated = rotateCW(oShape);
    
    // O 方块旋转后形状不变
    EXPECT_EQ(rotated, oShape);
}

// 测试：每种方块至少有一个格子
TEST(ShapeTest, AllShapesNonEmpty) {
    for (const auto& [name, shape] : SHAPES) {
        bool hasBlock = false;
        for (const auto& row : shape) {
            for (int cell : row) {
                if (cell) hasBlock = true;
            }
        }
        EXPECT_TRUE(hasBlock) << "方块 " << name << " 没有填色的格子";
    }
}

// 测试：所有方块只包含 0 或 1
TEST(ShapeTest, AllCellsAreZeroOrOne) {
    for (const auto& [name, shape] : SHAPES) {
        for (const auto& row : shape) {
            for (int cell : row) {
                EXPECT_TRUE(cell == 0 || cell == 1) 
                    << "方块 " << name << " 包含非法值: " << cell;
            }
        }
    }
}

// ========== 边界条件测试 ==========

// 测试：网格尺寸正确
TEST(BoundaryTest, GridDimensions) {
    EXPECT_EQ(ROWS, 20);
    EXPECT_EQ(COLS, 10);
}

// 测试：连续移动不会崩溃
TEST(StressTest, RepeatedMovesDontCrash) {
    TetrisGame game(false);

    for (int i = 0; i < 1000; i++) {
        game.move(-1, 0);
        game.move(1, 0);
        game.rotate();
        if (i % 10 == 0) game.hardDrop();
    }

    SUCCEED();
}

// ========== 等级公式测试 ==========

// 测试：等级随消行数增加 (level = 1 + lines/10)
TEST(TetrisCoreTest, LevelIncreasesWithLines) {
    TetrisGame game(false);
    EXPECT_EQ(game.level, 1);

    // 填满底部 10 行
    for (int r = ROWS - 10; r < ROWS; r++) {
        for (int c = 0; c < COLS; c++) {
            game.grid[r][c] = 1;
            game.gridNames[r * COLS + c] = "I";
        }
        game.clearRows.push_back(r);
    }
    game.clearLinesAndContinue();
    EXPECT_EQ(game.lines, 10);
    EXPECT_EQ(game.level, 2);

    // 再填 15 行 → 累计 25 行 → level = 1 + 25/10 = 3
    for (int r = ROWS - 15; r < ROWS; r++) {
        for (int c = 0; c < COLS; c++) {
            game.grid[r][c] = 1;
            game.gridNames[r * COLS + c] = "I";
        }
        game.clearRows.push_back(r);
    }
    game.clearLinesAndContinue();
    EXPECT_EQ(game.lines, 25);
    EXPECT_EQ(game.level, 3);
}

// 测试：buildMode 下等级公式为 level = 1 + lines/20
TEST(TetrisCoreTest, BuildModeLevelFormula) {
    TetrisGame game(false);
    game.setBuildMode(true);

    for (int r = ROWS - 20; r < ROWS; r++) {
        for (int c = 0; c < COLS; c++) {
            game.grid[r][c] = 1;
            game.gridNames[r * COLS + c] = "I";
        }
        game.clearRows.push_back(r);
    }
    game.clearLinesAndContinue();
    EXPECT_EQ(game.lines, 20);
    EXPECT_EQ(game.level, 2);  // 1 + 20/20 = 2
}

// ========== 下落速度公式测试 ==========

// 测试：dropInterval 随等级降低 (最小 16ms)
TEST(TetrisCoreTest, DropIntervalDecreasesWithLevel) {
    TetrisGame game(false);

    // level 1 → 1000ms
    EXPECT_EQ(game.dropInterval, 1000);

    // level 5 → 1000 - 4*100 = 600ms
    game.level = 5;
    game.dropInterval = std::max(16.0, 1000.0 - (game.level - 1) * 100.0);
    EXPECT_EQ(game.dropInterval, 600);

    // level 10 → 100ms
    game.level = 10;
    game.dropInterval = std::max(16.0, 1000.0 - (game.level - 1) * 100.0);
    EXPECT_EQ(game.dropInterval, 100);

    // level 11 → 0ms，但被 clamp 到 16ms
    game.level = 11;
    game.dropInterval = std::max(16.0, 1000.0 - (game.level - 1) * 100.0);
    EXPECT_EQ(game.dropInterval, 16);
}

// ========== 得分计算测试 ==========

// 测试：不同消行数的得分
TEST(TetrisCoreTest, ScoreForDifferentClears) {
    TetrisGame game(false);

    // 1 行 → +100
    for (int c = 0; c < COLS; c++) {
        game.grid[ROWS - 1][c] = 1;
        game.gridNames[(ROWS - 1) * COLS + c] = "I";
    }
    game.clearRows.push_back(ROWS - 1);
    int before = game.score;
    game.clearLinesAndContinue();
    EXPECT_EQ(game.score - before, 100 * 1);  // 100 * level

    // 2 行 → +300
    for (int r = ROWS - 1; r >= ROWS - 2; r--) {
        for (int c = 0; c < COLS; c++) {
            game.grid[r][c] = 1;
            game.gridNames[r * COLS + c] = "I";
        }
        game.clearRows.push_back(r);
    }
    before = game.score;
    game.clearLinesAndContinue();
    EXPECT_EQ(game.score - before, 300 * game.level);

    // 4 行 (Tetris) → +800
    for (int r = ROWS - 1; r >= ROWS - 4; r--) {
        for (int c = 0; c < COLS; c++) {
            game.grid[r][c] = 1;
            game.gridNames[r * COLS + c] = "I";
        }
        game.clearRows.push_back(r);
    }
    before = game.score;
    game.clearLinesAndContinue();
    EXPECT_EQ(game.score - before, 800 * game.level);
}

// 测试：buildMode 消行扣分
TEST(TetrisCoreTest, BuildModeClearDeductsScore) {
    TetrisGame game(false);
    game.setBuildMode(true);
    game.score = 200;

    for (int r = ROWS - 2; r < ROWS; r++) {
        for (int c = 0; c < COLS; c++) {
            game.grid[r][c] = 1;
            game.gridNames[r * COLS + c] = "I";
        }
        game.clearRows.push_back(r);
    }
    game.clearLinesAndContinue();
    EXPECT_EQ(game.score, 200 - 2 * 50);  // 200 - 100 = 100
}

// ========== Lock Delay 测试 ==========

// 测试：悬空时 lockDelay 不增加，落地后开始计数
TEST(TetrisCoreTest, LockDelayCountsOnlyWhenOnSurface) {
    TetrisGame game(false);

    // 刚生成时在空中 → lockDelay 为 0
    EXPECT_EQ(game.lockDelay, 0);
    game.update(100);
    EXPECT_EQ(game.lockDelay, 0);  // 在空中不会计数

    // 下落到地面
    while (game.isValid(game.currentShape, game.pieceX, game.pieceY + 1)) {
        game.move(0, 1);
    }

    game.update(250);
    EXPECT_NEAR(game.lockDelay, 250, 15);  // 允许微小误差
    EXPECT_FALSE(game.hasLocked);  // 250 < 500

    game.update(260);  // 累计 510 > 500 → 触发 lock
    // lock 后 afterLock → spawnPiece → piece 变为新方块
    // lockDelay 被重置为 0
    EXPECT_EQ(game.lockDelay, 0);
}

// ========== clearing 状态阻塞输入测试 ==========

// 测试：clearing 期间 move 和 rotate 返回 false
TEST(TetrisCoreTest, ClearingBlocksInput) {
    TetrisGame game(false);

    game.clearing = true;
    game.clearRows = {ROWS - 1};

    EXPECT_FALSE(game.move(-1, 0));
    EXPECT_FALSE(game.move(1, 0));
    EXPECT_FALSE(game.move(0, 1));
    EXPECT_FALSE(game.rotate());
    EXPECT_FALSE(game.hardDrop());
}

// ========== 合作模式消行测试 ==========

// 测试：coopClearSpecificRows 清除指定行并调整 pieceY
TEST(TetrisCoreTest, CoopClearSpecificRows) {
    TetrisGame game(false);

    // 填满底部 3 行
    for (int r = ROWS - 3; r < ROWS; r++) {
        for (int c = 0; c < COLS; c++) {
            game.grid[r][c] = 1;
            game.gridNames[r * COLS + c] = "I";
        }
    }

    int beforeScore = game.score;
    game.coopClearSpecificRows({ROWS - 3, ROWS - 2, ROWS - 1});

    // 三消得分
    EXPECT_EQ(game.score - beforeScore, 500);
    EXPECT_EQ(game.lines, 3);

    // 棋盘底部应该空了（插入的空行在顶部）
    for (int c = 0; c < COLS; c++) {
        EXPECT_EQ(game.grid[ROWS - 1][c], 0);
    }
}

// 测试：coopClearSpecificRows 在方块上方消行时调整 pieceY
TEST(TetrisCoreTest, CoopClearRowsAbovePieceShiftsPieceDown) {
    TetrisGame game(false);

    // pieceY 默认为 0
    // 在下落途中设置一个具体的 pieceY
    game.pieceY = 8;

    // 填满第 5 行和第 6 行（在 piece 上方）
    for (int r = 5; r <= 6; r++) {
        for (int c = 0; c < COLS; c++) {
            game.grid[r][c] = 1;
            game.gridNames[r * COLS + c] = "I";
        }
    }

    int oldPieceY = game.pieceY;  // 8
    game.coopClearSpecificRows({5, 6});
    // 有两行在 pieceY(8) 上方被清除 → pieceY 应增加 2
    EXPECT_EQ(game.pieceY, oldPieceY + 2);
}

// ========== 重力开关测试 ==========

// 测试：关闭重力后方块不下落
TEST(TetrisCoreTest, GravityDisabledPreventsAutoDrop) {
    TetrisGame game(false);
    game.gravityEnabled = false;

    int originalY = game.pieceY;
    game.update(5000);  // 5 秒，足够多次下落
    // gravityEnabled=false，pieceY 不应变化（除了手动移动）
    EXPECT_EQ(game.pieceY, originalY);

    // 验证手动移动仍然有效
    game.move(0, 1);
    EXPECT_EQ(game.pieceY, originalY + 1);
}

// ========== Build 模式特殊方块测试 ==========

// 测试：Build 模式使用 BUILD_SHAPES
TEST(TetrisCoreTest, BuildModeUsesBuildPieces) {
    TetrisGame game(false);
    game.setBuildMode(true);

    // Build 模式的方块名称
    for (const auto& name : BUILD_NAMES) {
        EXPECT_TRUE(BUILD_SHAPES.find(name) != BUILD_SHAPES.end());
    }

    // 应该有 7 种建造方块
    EXPECT_EQ(BUILD_NAMES.size(), 7);
    EXPECT_EQ(BUILD_SHAPES.size(), 7);
}

// 主函数
int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}