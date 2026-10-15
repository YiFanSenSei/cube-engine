#include <napi.h>
#include "tetris_core.h"
#include <vector>
#include <string>

// Per-game-instance wrapper stored as Napi::External
class GameWrapper {
public:
    tetris::TetrisGame game;

    GameWrapper(bool isAI) : game(isAI) {}
};

// --------------- Helper: convert JS arrays to C++ ---------------
static std::vector<std::string> JsArrayToStringVector(const Napi::Array& arr) {
    std::vector<std::string> vec;
    vec.reserve(arr.Length());
    for (uint32_t i = 0; i < arr.Length(); i++) {
        vec.push_back(arr.Get(i).As<Napi::String>().Utf8Value());
    }
    return vec;
}

static Napi::Array StringVectorToJsArray(const Napi::Env& env, const std::vector<std::string>& vec) {
    Napi::Array arr = Napi::Array::New(env, vec.size());
    for (size_t i = 0; i < vec.size(); i++) {
        arr.Set(i, Napi::String::New(env, vec[i]));
    }
    return arr;
}

static Napi::Array IntVectorToJsArray(const Napi::Env& env, const std::vector<int>& vec) {
    Napi::Array arr = Napi::Array::New(env, vec.size());
    for (size_t i = 0; i < vec.size(); i++) {
        arr.Set(i, Napi::Number::New(env, vec[i]));
    }
    return arr;
}

// --------------- Constructors ---------------

Napi::Value CreateGame(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    bool isAI = false;
    if (info.Length() > 0 && info[0].IsBoolean()) {
        isAI = info[0].As<Napi::Boolean>().Value();
    }
    auto* wrapper = new GameWrapper(isAI);
    return Napi::External<GameWrapper>::New(env, wrapper,
        [](Napi::Env, GameWrapper* w) { delete w; });
}

// --------------- Methods ---------------

Napi::Value GameReset(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    auto* wrapper = info[0].As<Napi::External<GameWrapper>>().Data();
    wrapper->game.reset();
    return env.Undefined();
}

Napi::Value GameMove(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    auto* wrapper = info[0].As<Napi::External<GameWrapper>>().Data();
    int dx = info[1].As<Napi::Number>().Int32Value();
    int dy = info[2].As<Napi::Number>().Int32Value();
    bool result = wrapper->game.move(dx, dy);
    return Napi::Boolean::New(env, result);
}

Napi::Value GameRotate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    auto* wrapper = info[0].As<Napi::External<GameWrapper>>().Data();
    bool result = wrapper->game.rotate();
    return Napi::Boolean::New(env, result);
}

Napi::Value GameGetGhostY(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    auto* wrapper = info[0].As<Napi::External<GameWrapper>>().Data();
    return Napi::Number::New(env, wrapper->game.getGhostY());
}

Napi::Value GameHardDrop(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    auto* wrapper = info[0].As<Napi::External<GameWrapper>>().Data();
    bool result = wrapper->game.hardDrop();
    return Napi::Boolean::New(env, result);
}

Napi::Value GameUpdate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    auto* wrapper = info[0].As<Napi::External<GameWrapper>>().Data();
    double dt = info[1].As<Napi::Number>().DoubleValue();
    wrapper->game.update(dt);
    return env.Undefined();
}

Napi::Value GameAiStep(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    auto* wrapper = info[0].As<Napi::External<GameWrapper>>().Data();
    double dt = info[1].As<Napi::Number>().DoubleValue();
    wrapper->game.aiStep(dt);
    return env.Undefined();
}

Napi::Value GameSetDifficulty(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    auto* wrapper = info[0].As<Napi::External<GameWrapper>>().Data();
    std::string diff = info[1].As<Napi::String>().Utf8Value();
    if (diff == "easy") wrapper->game.difficulty = tetris::Difficulty::EASY;
    else if (diff == "medium") wrapper->game.difficulty = tetris::Difficulty::MEDIUM;
    else if (diff == "hard") wrapper->game.difficulty = tetris::Difficulty::HARD;
    return env.Undefined();
}

Napi::Value GameSetBuildMode(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    auto* wrapper = info[0].As<Napi::External<GameWrapper>>().Data();
    wrapper->game.setBuildMode(info[1].As<Napi::Boolean>().Value());
    return env.Undefined();
}

Napi::Value GameGetState(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    auto* wrapper = info[0].As<Napi::External<GameWrapper>>().Data();
    auto& g = wrapper->game;

    Napi::Object state = Napi::Object::New(env);

    // grid: flat int array
    state.Set("grid", IntVectorToJsArray(env, g.getFlatGrid()));

    // grid names: flat string array of piece names per cell
    state.Set("gridNames", StringVectorToJsArray(env, g.getGridNamesFlat()));

    state.Set("score", Napi::Number::New(env, g.score));
    state.Set("lines", Napi::Number::New(env, g.lines));
    state.Set("level", Napi::Number::New(env, g.level));
    state.Set("gameOver", Napi::Boolean::New(env, g.gameOver));
    state.Set("paused", Napi::Boolean::New(env, g.paused));

    state.Set("piece", Napi::String::New(env, g.piece));
    state.Set("pieceX", Napi::Number::New(env, g.pieceX));
    state.Set("pieceY", Napi::Number::New(env, g.pieceY));
    state.Set("currentRotation", Napi::Number::New(env, g.currentRotation));
    state.Set("currentShape", IntVectorToJsArray(env, g.getFlatShape()));

    state.Set("nextPiece", Napi::String::New(env, g.nextPiece));

    state.Set("clearing", Napi::Boolean::New(env, g.clearing));
    state.Set("clearRows", IntVectorToJsArray(env, g.clearRows));
    state.Set("clearTimer", Napi::Number::New(env, g.clearTimer));

    state.Set("dropInterval", Napi::Number::New(env, g.dropInterval));
    state.Set("buildMode", Napi::Boolean::New(env, g.buildMode));

    return state;
}

Napi::Value GameSetPiece(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    auto* wrapper = info[0].As<Napi::External<GameWrapper>>().Data();
    std::string name = info[1].As<Napi::String>().Utf8Value();
    wrapper->game.piece = name;
    const auto& s = wrapper->game.getShape(name);
    wrapper->game.currentShape = s;
    wrapper->game.pieceX = (tetris::COLS - (int)s[0].size()) / 2;
    wrapper->game.pieceY = 0;
    wrapper->game.currentRotation = 0;
    wrapper->game.hasLocked = false;
    wrapper->game.lockDelay = 0;
    return env.Undefined();
}

// --------------- Coop Mode: clear rows full in BOTH ---------------

// Get which rows are full in a given game
static std::vector<int> getFullRows(tetris::TetrisGame& g) {
    std::vector<int> rows;
    for (int r = 0; r < tetris::ROWS; r++) {
        bool full = true;
        for (int c = 0; c < tetris::COLS; c++) {
            if (g.grid[r][c] == 0) { full = false; break; }
        }
        if (full) rows.push_back(r);
    }
    return rows;
}

Napi::Value GameCoopClearCheck(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    auto* w1 = info[0].As<Napi::External<GameWrapper>>().Data();
    auto* w2 = info[1].As<Napi::External<GameWrapper>>().Data();
    auto& g1 = w1->game;
    auto& g2 = w2->game;

    // Coop mode: only clear rows that are full in BOTH grids
    auto full1 = getFullRows(g1);
    auto full2 = getFullRows(g2);

    // Compute intersection: rows full in both players' grids
    std::vector<int> common;
    for (int r : full1) {
        if (std::find(full2.begin(), full2.end(), r) != full2.end()) {
            common.push_back(r);
        }
    }

    if (!g1.clearing && !common.empty()) {
        g1.clearRows = common;
        g1.clearing = true;
        g1.clearTimer = 0;
    }
    if (!g2.clearing && !common.empty()) {
        g2.clearRows = common;
        g2.clearing = true;
        g2.clearTimer = 0;
    }

    return env.Undefined();
}

Napi::Value GameSetCoopMode(const Napi::CallbackInfo& info) {
    auto* wrapper = info[0].As<Napi::External<GameWrapper>>().Data();
    wrapper->game.coopMode = info[1].As<Napi::Boolean>().Value();
    return info.Env().Undefined();
}

// --------------- Module Init ---------------

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("createGame", Napi::Function::New(env, CreateGame));
    exports.Set("reset", Napi::Function::New(env, GameReset));
    exports.Set("move", Napi::Function::New(env, GameMove));
    exports.Set("rotate", Napi::Function::New(env, GameRotate));
    exports.Set("getGhostY", Napi::Function::New(env, GameGetGhostY));
    exports.Set("hardDrop", Napi::Function::New(env, GameHardDrop));
    exports.Set("update", Napi::Function::New(env, GameUpdate));
    exports.Set("aiStep", Napi::Function::New(env, GameAiStep));
    exports.Set("setDifficulty", Napi::Function::New(env, GameSetDifficulty));
    exports.Set("setBuildMode", Napi::Function::New(env, GameSetBuildMode));
    exports.Set("getState", Napi::Function::New(env, GameGetState));
    exports.Set("setPiece", Napi::Function::New(env, GameSetPiece));
    exports.Set("coopClearCheck", Napi::Function::New(env, GameCoopClearCheck));
    exports.Set("setCoopMode", Napi::Function::New(env, GameSetCoopMode));
    return exports;
}

NODE_API_MODULE(tetris_core, Init)