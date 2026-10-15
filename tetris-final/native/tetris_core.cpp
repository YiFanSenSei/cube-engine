#include <functional>
#include "tetris_core.h"

namespace tetris {

TetrisGame::TetrisGame(bool ai) : isAI(ai), rng(std::random_device{}()) {
    gravityEnabled = true;
    lockDelayMax = ai ? 1000.0 : 500.0;
    reset();
}

const std::vector<std::string>& TetrisGame::getPieceNames() const {
    return buildMode ? BUILD_NAMES : PIECE_NAMES;
}

const std::vector<std::vector<int>>& TetrisGame::getShape(const std::string& name) const {
    const auto& shapes = buildMode ? BUILD_SHAPES : SHAPES;
    auto it = shapes.find(name);
    if (it != shapes.end()) return it->second;
    // Fallback: check the other map
    const auto& other = buildMode ? SHAPES : BUILD_SHAPES;
    auto it2 = other.find(name);
    if (it2 != other.end()) return it2->second;
    // Name not found in either map — return empty shape instead of crashing
    static const std::vector<std::vector<int>> emptyShape;
    return emptyShape;
}

void TetrisGame::setBuildMode(bool bm) {
    buildMode = bm;
    bag.clear();
    fillBag();
    nextPiece.clear();
    currentShape.clear();
    piece.clear();
    spawnPiece();
    nextPiece = getNextFromBag();
}

void TetrisGame::reset() {
    grid.assign(ROWS, std::vector<int>(COLS, 0));
    gridNames.assign(ROWS * COLS, "");
    score = 0; lines = 0; level = 1;
    gameOver = false; paused = false;
    bag.clear();
    piece.clear(); nextPiece.clear();
    currentShape.clear();
    dropCounter = 0; dropInterval = 1000;
    lockDelay = 0; hasLocked = false;
    clearing = false; clearTimer = 0; clearRows.clear();
    aiMoveSteps.clear(); aiWaitTimer = 0; aiThinkDelay = 0; aiSafetyCounter = 0;
    fillBag();
    spawnPiece();
    nextPiece = getNextFromBag();
}

void TetrisGame::fillBag() {
    if (bag.size() <= 1) {
        auto names = getPieceNames();
        std::shuffle(names.begin(), names.end(), rng);
        bag.insert(bag.end(), names.begin(), names.end());
    }
}

std::string TetrisGame::getNextFromBag() {
    fillBag();
    std::string name = bag.back();
    bag.pop_back();
    return name;
}

void TetrisGame::spawnPiece() {
    piece = nextPiece.empty() ? getNextFromBag() : nextPiece;
    nextPiece = getNextFromBag();
    const auto& shape = getShape(piece);
    currentShape = shape;
    pieceX = (COLS - (int)shape[0].size()) / 2;
    pieceY = 0;
    currentRotation = 0;
    hasLocked = false;
    lockDelay = 0;
    if (!isValid(currentShape, pieceX, pieceY)) {
        gameOver = true;
    }
}

bool TetrisGame::isValid(const std::vector<std::vector<int>>& shape, int px, int py) {
    for (int r = 0; r < (int)shape.size(); r++) {
        for (int c = 0; c < (int)shape[r].size(); c++) {
            if (!shape[r][c]) continue;
            int x = px + c, y = py + r;
            if (x < 0 || x >= COLS || y >= ROWS) return false;
            if (y >= 0 && grid[y][x] != 0) return false;
        }
    }
    return true;
}

bool TetrisGame::move(int dx, int dy) {
    if (piece.empty() || gameOver || paused || clearing) return false;
    if (isValid(currentShape, pieceX + dx, pieceY + dy)) {
        pieceX += dx; pieceY += dy;
        if (dy == 0) lockDelay = 0;
        return true;
    }
    return false;
}

bool TetrisGame::rotate() {
    if (piece.empty() || gameOver || paused || clearing) return false;
    if (piece == "O") return true;
    auto newShape = rotateCW(currentShape);
    std::vector<int> kicks = {0, -1, 1, -2, 2};
    for (int kick : kicks) {
        if (isValid(newShape, pieceX + kick, pieceY)) {
            currentShape = newShape;
            pieceX += kick;
            currentRotation = (currentRotation + 1) % 4;
            lockDelay = 0;
            return true;
        }
    }
    return false;
}

int TetrisGame::getGhostY() {
    if (piece.empty()) return 0;
    int gy = pieceY;
    while (isValid(currentShape, pieceX, gy + 1)) gy++;
    return gy;
}

bool TetrisGame::hardDrop() {
    if (piece.empty() || gameOver || paused || clearing) return false;
    int ghost = getGhostY();
    pieceY = ghost;
    // No score for hard drop — only line clears give points
    lockPiece();
    return true;
}

void TetrisGame::lockPiece() {
    if (piece.empty() || hasLocked) return;
    hasLocked = true;
    for (int r = 0; r < (int)currentShape.size(); r++) {
        for (int c = 0; c < (int)currentShape[r].size(); c++) {
            if (!currentShape[r][c]) continue;
            int x = pieceX + c, y = pieceY + r;
            if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
                grid[y][x] = 1;
                // Store piece name per cell for build mode (use flat gridNames)
            }
        }
    }
    // Also store piece names for rendering
    for (int r = 0; r < (int)currentShape.size(); r++) {
        for (int c = 0; c < (int)currentShape[r].size(); c++) {
            if (!currentShape[r][c]) continue;
            int x = pieceX + c, y = pieceY + r;
            if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
                gridNames[y * COLS + x] = piece;
            }
        }
    }
    clearRows.clear();
    for (int r = 0; r < ROWS; r++) {
        bool full = true;
        for (int c = 0; c < COLS; c++) if (grid[r][c] == 0) { full = false; break; }
        if (full) clearRows.push_back(r);
    }
    if (coopMode) {
        // Coop mode: don't enter clearing state — keep playing,
        // coopClearCheck will scan both grids and clear matching rows
        afterLock();
    } else if (!clearRows.empty()) { clearing = true; clearTimer = 0; }
    else afterLock();
}

void TetrisGame::afterLock() {
    spawnPiece();
    dropCounter = 0;
    lockDelay = 0;
    // Clear any leftover AI move steps from the locked piece
    aiMoveSteps.clear();
    aiSafetyCounter = 0;
    aiWaitTimer = 0;
    // Reset AI target so it re-thinks on the new piece
    aiTargetX = -999;
    aiTargetRot = -999;
}

void TetrisGame::clearLinesAndContinue() {
    int n = (int)clearRows.size();
    std::sort(clearRows.begin(), clearRows.end(), std::greater<int>());
    for (int r : clearRows) {
        grid.erase(grid.begin() + r);
        gridNames.erase(gridNames.begin() + r * COLS, gridNames.begin() + (r + 1) * COLS);
    }
    for (int i = 0; i < n; i++) {
        grid.insert(grid.begin(), std::vector<int>(COLS, 0));
        gridNames.insert(gridNames.begin(), COLS, "");
    }
    lines += n;
    if (buildMode) {
        score = std::max(0, score - n * 50);
        level = 1 + lines / 20;
    } else {
        static const int scores[] = {0, 100, 300, 500, 800};
        score += scores[std::min(n, 4)] * level;
        level = 1 + lines / 10;
    }
    dropInterval = std::max(16.0, 1000.0 - (level - 1) * 100.0);
    clearing = false;
    clearRows.clear();
    afterLock();
}

void TetrisGame::update(double dt) {
    if (gameOver || paused) return;
    if (clearing) {
        clearTimer += dt;
        if (clearTimer >= 300) {
            if (coopMode) {
                // Coop: clear the stored rows, then resume
                coopClearSpecificRows(clearRows);
                clearing = false;
                clearRows.clear();
            } else {
                clearLinesAndContinue();
            }
        }
        return;
    }
    if (buildMode && piece.empty() && !gameOver && !clearing) {
        spawnPiece();
        return;
    }
    if (piece.empty()) return;

    // Gravity
    if (gravityEnabled) {
        dropCounter += dt;
        if (dropCounter >= dropInterval) {
            dropCounter = 0;
            move(0, 1);
        }
    }

    // Lock delay: lock piece when it has been resting on a surface
    if (!isValid(currentShape, pieceX, pieceY + 1)) {
        lockDelay += dt;
        if (lockDelay >= lockDelayMax) {
            lockPiece();
        }
    } else {
        lockDelay = 0;
    }
}

// ========== AI ==========

double TetrisGame::evaluatePosition(const std::vector<std::vector<int>>& g,
    const std::vector<std::vector<int>>& shape, int px, int py) {
    // Pierre Dellacherie evaluation — battle-tested Tetris AI formula (2003)
    // Step 1: Place piece on test grid
    auto testGrid = g;
    int rCount = (int)shape.size(), cCount = (int)shape[0].size();
    for (int r = 0; r < rCount; r++)
        for (int c = 0; c < cCount; c++)
            if (shape[r][c]) {
                int y = py + r, x = px + c;
                if (y >= 0) testGrid[y][x] = 2;
            }

    // Step 2: Landing height — y-index of piece top (0 = top row)
    int landingHeight = ROWS - py;

    // Step 3: Clear full rows, count eroded cells of THIS piece
    int erodedCells = 0;
    int rowsCleared = 0;
    for (int r = ROWS - 1; r >= 0;) {
        bool full = true;
        for (int c = 0; c < COLS; c++)
            if (testGrid[r][c] == 0) { full = false; break; }
        if (full) {
            rowsCleared++;
            // Count how many cells of the placed piece contributed to this full row
            int shapeR = r - py;
            if (shapeR >= 0 && shapeR < rCount) {
                for (int c = 0; c < cCount; c++) {
                    int gx = px + c;
                    if (gx >= 0 && gx < COLS && shape[shapeR][c])
                        erodedCells++;
                }
            }
            testGrid.erase(testGrid.begin() + r);
            testGrid.insert(testGrid.begin(), std::vector<int>(COLS, 0));
        } else {
            r--;
        }
    }

    // Step 4: Column heights (post-clear)
    std::vector<int> heights(COLS, 0);
    for (int c = 0; c < COLS; c++) {
        for (int r = 0; r < ROWS; r++) {
            if (testGrid[r][c] != 0) { heights[c] = ROWS - r; break; }
        }
    }

    // Step 5: Row transitions (borders count as filled)
    int rowTrans = 0;
    for (int r = 0; r < ROWS; r++) {
        bool prev = true; // left wall = filled
        for (int c = 0; c < COLS; c++) {
            bool cur = testGrid[r][c] != 0;
            if (cur != prev) rowTrans++;
            prev = cur;
        }
        if (!prev) rowTrans++; // right wall = filled, empty→filled
    }

    // Step 6: Column transitions (top border counts as filled)
    int colTrans = 0;
    for (int c = 0; c < COLS; c++) {
        bool prev = true; // top wall = filled
        for (int r = 0; r < ROWS; r++) {
            bool cur = testGrid[r][c] != 0;
            if (cur != prev) colTrans++;
            prev = cur;
        }
        // Bottom: no transition counted (don't count empty→nothing)
    }

    // Step 7: Holes (empty cell with at least one filled cell above)
    int holes = 0;
    for (int c = 0; c < COLS; c++) {
        bool block = false;
        for (int r = 0; r < ROWS; r++) {
            if (testGrid[r][c] != 0) block = true;
            else if (block) holes++;
        }
    }

    // Step 8: Well sums — sum of depths where both neighbors are taller
    int wellSum = 0;
    for (int c = 0; c < COLS; c++) {
        int leftH  = (c == 0)    ? ROWS : heights[c - 1];
        int rightH = (c == COLS - 1) ? ROWS : heights[c + 1];
        int wallH  = std::min(leftH, rightH);
        if (wallH > heights[c])
            wellSum += wallH - heights[c];
    }

    // Pierre Dellacherie weights
    double score = -4.500158 * landingHeight
         +  3.4181268 * erodedCells
         -  3.217888  * rowTrans
         -  9.348695  * colTrans
         -  7.899265  * holes
         -  3.385597  * wellSum;

    // Hard override: massive bonus for clearing lines
    // This ensures the AI ALWAYS prioritizes line clears
    if (rowsCleared == 4) score += 5000.0;
    else if (rowsCleared == 3) score += 2000.0;
    else if (rowsCleared == 2) score += 500.0;
    else if (rowsCleared == 1) score += 100.0;

    return score;
}

bool TetrisGame::isValidShapeOnGrid(const std::vector<std::vector<int>>& shape, int px, int py) {
    for (int r = 0; r < (int)shape.size(); r++)
        for (int c = 0; c < (int)shape[r].size(); c++)
            if (shape[r][c]) {
                int x = px + c, y = py + r;
                if (x < 0 || x >= COLS || y >= ROWS) return false;
                if (y >= 0 && grid[y][x] != 0) return false;
            }
    return true;
}

AIMove TetrisGame::getBestMove() {
    if (piece.empty()) return {};
    const auto& shapeBase = getShape(piece);
    std::vector<AIMove> candidates;
    auto shape = shapeBase;
    for (int rot = 0; rot < 4; rot++) {
        if (rot > 0) { shape = rotateCW(shape); if (piece == "O") break; }
        int w = (int)shape[0].size();
        for (int col = -(w - 1); col < COLS; col++) {
            int row = 0;
            while (isValidShapeOnGrid(shape, col, row + 1)) row++;
            if (!isValidShapeOnGrid(shape, col, row)) continue;
            double score = evaluatePosition(grid, shape, col, row);
            double noise = 0;
            if (difficulty == Difficulty::EASY) noise = (std::uniform_real_distribution<>(0, 1)(rng) - 0.5) * 400;
            else if (difficulty == Difficulty::MEDIUM) noise = (std::uniform_real_distribution<>(0, 1)(rng) - 0.5) * 60;
            candidates.push_back({shape, col, row, rot, score + noise});
        }
    }
    if (candidates.empty()) return {};

    // Phase 1: check if ANY position would clear lines
    std::vector<int> lineClearerIndices;
    for (int ci = 0; ci < (int)candidates.size(); ci++) {
        auto g = grid;
        auto& c = candidates[ci];
        for (int r = 0; r < (int)c.shape.size(); r++)
            for (int cc2 = 0; cc2 < (int)c.shape[r].size(); cc2++)
                if (c.shape[r][cc2]) { int y = c.y + r, x = c.x + cc2; if (y >= 0) g[y][x] = 2; }
        for (int r = 0; r < ROWS; r++) {
            bool full = true;
            for (int c2 = 0; c2 < COLS; c2++) if (g[r][c2] == 0) { full = false; break; }
            if (full) { lineClearerIndices.push_back(ci); break; }
        }
    }

    // Phase 2: if any position clears lines, pick the best one among them
    if (!lineClearerIndices.empty()) {
        int bestIdx = lineClearerIndices[0];
        for (int idx : lineClearerIndices)
            if (candidates[idx].score > candidates[bestIdx].score) bestIdx = idx;
        return candidates[bestIdx];
    }

    // Phase 3: no line clears possible, pick the best overall candidate
    int bestIdx = 0;
    for (int i = 1; i < (int)candidates.size(); i++)
        if (candidates[i].score > candidates[bestIdx].score) bestIdx = i;
    return candidates[bestIdx];
}

void TetrisGame::aiThink() {
    if (gameOver || paused || piece.empty() || clearing) return;
    auto move = getBestMove();
    if (move.shape.empty()) return;
    // Fully teleport piece to target position (rotation + location)
    // Must set pieceX/pieceY too, otherwise rotated shape may overlap
    // existing blocks at the current spawn position (corrupting the grid).
    currentShape = move.shape;
    currentRotation = move.rot;
    pieceX = move.x;
    pieceY = move.y;
    aiTargetX = move.x;
    aiTargetRot = move.rot;
}

void TetrisGame::aiStep(double dt) {
    if (gameOver || paused) return;
    if (clearing) return;

    if (aiThinkDelay > 0) {
        aiThinkDelay -= dt;
        return;
    }

    if (piece.empty()) return;

    // New piece: compute target
    if (aiTargetRot == -999) {
        aiThink();
        if (aiTargetRot == -999) return;
        aiThinkDelay = 30;
        return;
    }

    // Move horizontally step-by-step toward target column
    if (pieceX != aiTargetX) {
        if (pieceX < aiTargetX) move(1, 0);
        else move(-1, 0);
        double stepDelay = 30;
        if (difficulty == Difficulty::EASY) stepDelay = 100;
        else if (difficulty == Difficulty::MEDIUM) stepDelay = 50;
        aiThinkDelay = stepDelay;
        return;
    }

    // At target column + correct rotation → hardDrop
    hardDrop();
    double pause = 300;
    if (difficulty == Difficulty::EASY) pause = 700;
    else if (difficulty == Difficulty::MEDIUM) pause = 400;
    else if (difficulty == Difficulty::HARD) pause = 150;
    aiThinkDelay = pause;
}

// Coop mode: clear specific rows from the grid without interfering with active piece
void TetrisGame::coopClearSpecificRows(const std::vector<int>& rows) {
    if (rows.empty()) return;
    auto sorted = rows;
    std::sort(sorted.begin(), sorted.end(), std::greater<int>());

    // Count rows cleared above the current piece, so we can shift it down
    int rowsAbovePiece = 0;
    for (int r : sorted) {
        if (r < pieceY) rowsAbovePiece++;
    }

    for (int r : sorted) {
        grid.erase(grid.begin() + r);
        gridNames.erase(gridNames.begin() + r * COLS, gridNames.begin() + (r + 1) * COLS);
    }
    for (size_t i = 0; i < sorted.size(); i++) {
        grid.insert(grid.begin(), std::vector<int>(COLS, 0));
        gridNames.insert(gridNames.begin(), COLS, "");
    }

    int n = (int)sorted.size();
    lines += n;
    static const int scores[] = {0, 100, 300, 500, 800};
    score += scores[std::min(n, 4)] * level;
    level = 1 + lines / 10;
    dropInterval = std::max(16.0, 1000.0 - (level - 1) * 100.0);

    pieceY += rowsAbovePiece;
}

// Serialization helpers (flatten 2D grid to 1D array for JS)
std::vector<int> TetrisGame::getFlatGrid() const {
    std::vector<int> flat;
    flat.reserve(ROWS * COLS);
    for (int r = 0; r < ROWS; r++)
        for (int c = 0; c < COLS; c++)
            flat.push_back(grid[r][c]);
    return flat;
}

std::vector<std::string> TetrisGame::getGridNamesFlat() const {
    std::vector<std::string> names;
    names.reserve(ROWS * COLS);
    for (int r = 0; r < ROWS; r++)
        for (int c = 0; c < COLS; c++) {
            int idx = r * COLS + c;
            names.push_back(idx < (int)gridNames.size() ? gridNames[idx] : "");
        }
    return names;
}

std::vector<int> TetrisGame::getFlatShape() const {
    std::vector<int> flat;
    if (currentShape.empty()) return flat;
    for (int r = 0; r < (int)currentShape.size(); r++)
        for (int c = 0; c < (int)currentShape[r].size(); c++)
            flat.push_back(currentShape[r][c]);
    return flat;
}

} // namespace tetris