#pragma once
#include <string>
#include <vector>
#include <unordered_map>
#include <random>
#include <algorithm>
#include <cmath>

namespace tetris {

const int COLS = 10;
const int ROWS = 20;

const std::vector<std::string> PIECE_NAMES = {"I", "O", "T", "S", "Z", "J", "L"};

const std::unordered_map<std::string, std::vector<std::vector<int>>> SHAPES = {
    {"I", {{1,1,1,1}}},
    {"O", {{1,1},{1,1}}},
    {"T", {{0,1,0},{1,1,1}}},
    {"S", {{0,1,1},{1,1,0}}},
    {"Z", {{1,1,0},{0,1,1}}},
    {"J", {{1,0,0},{1,1,1}}},
    {"L", {{0,0,1},{1,1,1}}}
};

const std::vector<std::string> BUILD_NAMES = {"I", "O", "SINGLE", "BAR2", "BAR3", "CORNER_L", "CORNER_J"};
const std::unordered_map<std::string, std::vector<std::vector<int>>> BUILD_SHAPES = {
    {"I", {{1,1,1,1}}},
    {"O", {{1,1},{1,1}}},
    {"SINGLE", {{1}}},
    {"BAR2", {{1,1}}},
    {"BAR3", {{1,1,1}}},
    {"CORNER_L", {{1,0},{1,0},{1,1}}},
    {"CORNER_J", {{0,1},{0,1},{1,1}}},
};

enum class Difficulty { EASY, MEDIUM, HARD };

inline std::vector<std::vector<int>> rotateCW(const std::vector<std::vector<int>>& shape) {
    int H = (int)shape.size(), W = (int)shape[0].size();
    std::vector<std::vector<int>> res(W, std::vector<int>(H));
    for (int c = 0; c < W; c++)
        for (int r = 0; r < H; r++)
            res[c][r] = shape[H - 1 - r][c];
    return res;
}

struct AIMove {
    std::vector<std::vector<int>> shape;
    int x = 0, y = 0, rot = 0;
    double score = 0;
};

class TetrisGame {
public:
    std::vector<std::vector<int>> grid;       // 0 = empty, non-zero = has block
    std::vector<std::string> gridNames;       // piece name per cell
    int score = 0, lines = 0, level = 1;
    bool gameOver = false, paused = false;

    std::string piece;
    std::vector<std::vector<int>> currentShape;
    int pieceX = 0, pieceY = 0, currentRotation = 0;
    std::string nextPiece;

    double dropCounter = 0, dropInterval = 1000;
    double lockDelay = 0, lockDelayMax = 500;
    bool hasLocked = false;

    bool clearing = false;
    double clearTimer = 0;
    std::vector<int> clearRows;

    bool isAI = false;
    bool buildMode = false;
    bool coopMode = false;
    void setBuildMode(bool bm);
    Difficulty difficulty = Difficulty::MEDIUM;
    bool gravityEnabled = true;

    // AI state
    std::vector<std::string> aiMoveSteps;
    double aiWaitTimer = 0;
    double aiThinkDelay = 0;
    int aiSafetyCounter = 0;
    int aiTargetX = 3;
    int aiTargetRot = 0;

    TetrisGame(bool ai = false);
    void reset();
    bool isValid(const std::vector<std::vector<int>>& shape, int px, int py);
    bool move(int dx, int dy);
    bool rotate();
    int getGhostY();
    bool hardDrop();
    void lockPiece();
    void afterLock();
    void clearLinesAndContinue();
    void spawnPiece();
    void update(double dt);

    // AI
    double evaluatePosition(
        const std::vector<std::vector<int>>& g,
        const std::vector<std::vector<int>>& shape,
        int px, int py);
    AIMove getBestMove();
    bool isValidShapeOnGrid(
        const std::vector<std::vector<int>>& shape,
        int px, int py);
    void aiThink();
    void aiStep(double dt);

    // Coop mode: clear rows that are full in both games
    void coopClearSpecificRows(const std::vector<int>& rows);

    // Serialization helpers
    std::vector<int> getFlatGrid() const;
    std::vector<std::string> getGridNamesFlat() const;
    std::vector<int> getFlatShape() const;

    // Piece info
    const std::vector<std::string>& getPieceNames() const;
    const std::vector<std::vector<int>>& getShape(const std::string& name) const;

private:
    std::vector<std::string> bag;
    std::mt19937 rng;

    void fillBag();
    std::string getNextFromBag();
};

} // namespace tetris