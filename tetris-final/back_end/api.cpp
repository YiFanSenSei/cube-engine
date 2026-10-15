#include "api.h"
#include <sstream>
#include <fstream>
#include <chrono>
#include <ctime>
#include <algorithm>

// ========== 全局游戏管理器 ==========
GameManager globalGameManager;

// ========== GameManager 实现 ==========
std::string GameManager::createSession(bool isAI) {
    std::lock_guard<std::mutex> lock(mutex);
    std::string gameId = "game_" + std::to_string(nextId++);
    auto session = std::make_shared<GameSession>(isAI);
    session->game->reset();
    sessions[gameId] = session;
    return gameId;
}

std::shared_ptr<GameSession> GameManager::getSession(const std::string& gameId) {
    std::lock_guard<std::mutex> lock(mutex);
    auto it = sessions.find(gameId);
    if (it != sessions.end()) {
        it->second->lastAccessTime = std::chrono::duration<double>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count();
        return it->second;
    }
    return nullptr;
}

bool GameManager::removeSession(const std::string& gameId) {
    std::lock_guard<std::mutex> lock(mutex);
    return sessions.erase(gameId) > 0;
}

void GameManager::cleanupInactive(double timeoutSeconds) {
    std::lock_guard<std::mutex> lock(mutex);
    double now = std::chrono::duration<double>(
        std::chrono::system_clock::now().time_since_epoch()
    ).count();
    for (auto it = sessions.begin(); it != sessions.end(); ) {
        if (now - it->second->lastAccessTime > timeoutSeconds) {
            it = sessions.erase(it);
        } else {
            ++it;
        }
    }
}

int GameManager::getActiveCount() {
    std::lock_guard<std::mutex> lock(mutex);
    return (int)sessions.size();
}

// ========== JSON 辅助函数（简易实现，无需额外依赖）==========
static std::string jsonEscape(const std::string& s) {
    std::string out;
    out.reserve(s.size() + 2);
    for (char c : s) {
        switch (c) {
            case '"': out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\n': out += "\\n"; break;
            case '\r': out += "\\r"; break;
            case '\t': out += "\\t"; break;
            default: out += c;
        }
    }
    return out;
}

static std::string vecToJson(const std::vector<int>& vec) {
    std::string out = "[";
    for (size_t i = 0; i < vec.size(); i++) {
        if (i > 0) out += ",";
        out += std::to_string(vec[i]);
    }
    out += "]";
    return out;
}

static std::string vecToJson(const std::vector<std::string>& vec) {
    std::string out = "[";
    for (size_t i = 0; i < vec.size(); i++) {
        if (i > 0) out += ",";
        out += "\"" + jsonEscape(vec[i]) + "\"";
    }
    out += "]";
    return out;
}

static std::string parseJsonString(const std::string& json, const std::string& key) {
    // 简易 JSON 解析器
    std::string search = "\"" + key + "\"";
    size_t pos = json.find(search);
    if (pos == std::string::npos) return "";
    
    pos = json.find(':', pos + search.length());
    if (pos == std::string::npos) return "";
    
    pos++; // skip ':'
    // 跳过空白
    while (pos < json.size() && (json[pos] == ' ' || json[pos] == '\t')) pos++;
    
    if (pos >= json.size()) return "";
    
    if (json[pos] == '"') {
        // 字符串值
        pos++;
        std::string val;
        while (pos < json.size() && json[pos] != '"') {
            if (json[pos] == '\\') { pos++; if (pos < json.size()) val += json[pos]; }
            else val += json[pos];
            pos++;
        }
        return val;
    } else {
        // 数值或布尔值
        size_t end = pos;
        while (end < json.size() && json[end] != ',' && json[end] != '}' && json[end] != ']' && json[end] != ' ') end++;
        return json.substr(pos, end - pos);
    }
}

static bool parseJsonBool(const std::string& json, const std::string& key, bool defaultVal = false) {
    std::string val = parseJsonString(json, key);
    if (val.empty()) return defaultVal;
    return val == "true" || val == "1";
}

static int parseJsonInt(const std::string& json, const std::string& key, int defaultVal = 0) {
    std::string val = parseJsonString(json, key);
    if (val.empty()) return defaultVal;
    try { return std::stoi(val); } catch (...) { return defaultVal; }
}

// ========== ApiResponse 实现 ==========
std::string ApiResponse::error(int code, const std::string& msg) {
    std::string out = "{\"code\":";
    out += std::to_string(code);
    out += ",\"message\":\"";
    out += jsonEscape(msg);
    out += "\"}";
    return out;
}

std::string ApiResponse::success(const std::string& data) {
    std::string out = "{\"code\":0,\"data\":";
    out += data;
    out += "}";
    return out;
}

// ========== 序列化游戏状态 ==========
std::string serializeGameState(const tetris::TetrisGame& game) {
    std::string out = "{";
    
    out += "\"grid\":" + vecToJson(game.getFlatGrid()) + ",";
    out += "\"gridNames\":" + vecToJson(game.getGridNamesFlat()) + ",";
    out += "\"score\":" + std::to_string(game.score) + ",";
    out += "\"lines\":" + std::to_string(game.lines) + ",";
    out += "\"level\":" + std::to_string(game.level) + ",";
    out += "\"gameOver\":" + std::string(game.gameOver ? "true" : "false") + ",";
    out += "\"paused\":" + std::string(game.paused ? "true" : "false") + ",";
    out += "\"piece\":\"" + jsonEscape(game.piece) + "\",";
    out += "\"pieceX\":" + std::to_string(game.pieceX) + ",";
    out += "\"pieceY\":" + std::to_string(game.pieceY) + ",";
    out += "\"currentRotation\":" + std::to_string(game.currentRotation) + ",";
    out += "\"currentShape\":" + vecToJson(game.getFlatShape()) + ",";
    out += "\"nextPiece\":\"" + jsonEscape(game.nextPiece) + "\",";
    out += "\"dropInterval\":" + std::to_string(game.dropInterval) + ",";
    out += "\"clearing\":" + std::string(game.clearing ? "true" : "false") + ",";
    out += "\"clearTimer\":" + std::to_string(game.clearTimer) + ",";
    out += "\"buildMode\":" + std::string(game.buildMode ? "true" : "false");
    
    out += "}";
    return out;
}

// ========== API 处理函数实现 ==========

std::string handleGameInit(const std::string& body) {
    bool isAI = parseJsonBool(body, "isAI", false);
    bool buildMode = parseJsonBool(body, "buildMode", false);
    std::string difficulty = parseJsonString(body, "difficulty");
    
    std::string gameId = globalGameManager.createSession(isAI);
    auto session = globalGameManager.getSession(gameId);
    if (!session) {
        return ApiResponse::error(5001, "创建游戏会话失败");
    }
    
    if (!difficulty.empty()) {
        if (difficulty == "easy") session->game->difficulty = tetris::Difficulty::EASY;
        else if (difficulty == "hard") session->game->difficulty = tetris::Difficulty::HARD;
        else session->game->difficulty = tetris::Difficulty::MEDIUM;
    }
    
    if (buildMode) {
        session->game->buildMode = true;
    }
    
    session->game->reset();
    
    std::string data = "{\"gameId\":\"" + gameId + "\",";
    data += "\"state\":" + serializeGameState(*session->game) + "}";
    
    return ApiResponse::success(data);
}

std::string handleGameMove(const std::string& body) {
    std::string gameId = parseJsonString(body, "gameId");
    int dx = parseJsonInt(body, "dx", 0);
    int dy = parseJsonInt(body, "dy", 0);
    
    auto session = globalGameManager.getSession(gameId);
    if (!session) {
        return ApiResponse::error(4001, "游戏会话不存在或已过期");
    }
    
    bool result = session->game->move(dx, dy);
    
    std::string data = "{\"result\":" + std::string(result ? "true" : "false") + ",";
    data += "\"state\":" + serializeGameState(*session->game) + "}";
    
    return ApiResponse::success(data);
}

std::string handleGameRotate(const std::string& body) {
    std::string gameId = parseJsonString(body, "gameId");
    
    auto session = globalGameManager.getSession(gameId);
    if (!session) {
        return ApiResponse::error(4001, "游戏会话不存在或已过期");
    }
    
    bool result = session->game->rotate();
    
    std::string data = "{\"result\":" + std::string(result ? "true" : "false") + ",";
    data += "\"state\":" + serializeGameState(*session->game) + "}";
    
    return ApiResponse::success(data);
}

std::string handleGameHardDrop(const std::string& body) {
    std::string gameId = parseJsonString(body, "gameId");
    
    auto session = globalGameManager.getSession(gameId);
    if (!session) {
        return ApiResponse::error(4001, "游戏会话不存在或已过期");
    }
    
    bool result = session->game->hardDrop();
    
    std::string data = "{\"result\":" + std::string(result ? "true" : "false") + ",";
    data += "\"state\":" + serializeGameState(*session->game) + "}";
    
    return ApiResponse::success(data);
}

std::string handleGameGetState(const std::string& body) {
    std::string gameId = parseJsonString(body, "gameId");
    
    auto session = globalGameManager.getSession(gameId);
    if (!session) {
        return ApiResponse::error(4001, "游戏会话不存在或已过期");
    }
    
    std::string data = "{\"state\":" + serializeGameState(*session->game) + "}";
    return ApiResponse::success(data);
}

std::string handleGameUpdate(const std::string& body) {
    std::string gameId = parseJsonString(body, "gameId");
    double dt = parseJsonInt(body, "dt", 16);
    
    auto session = globalGameManager.getSession(gameId);
    if (!session) {
        return ApiResponse::error(4001, "游戏会话不存在或已过期");
    }
    
    session->game->update(dt);
    
    std::string data = "{\"state\":" + serializeGameState(*session->game) + "}";
    return ApiResponse::success(data);
}

std::string handleGameReset(const std::string& body) {
    std::string gameId = parseJsonString(body, "gameId");
    
    auto session = globalGameManager.getSession(gameId);
    if (!session) {
        return ApiResponse::error(4001, "游戏会话不存在或已过期");
    }
    
    session->game->reset();
    session->highScore = 0;
    
    std::string data = "{\"state\":" + serializeGameState(*session->game) + "}";
    return ApiResponse::success(data);
}

// ========== 用户管理（简易文件存储）==========
struct UserData {
    int id = 0;
    std::string username;
    std::string password;
    int highScore = 0;
};

static std::vector<UserData> loadUsers() {
    std::vector<UserData> users;
    std::ifstream file("users.json");
    if (!file.is_open()) return users;

    std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    file.close();

    // 简易 JSON 数组解析（与 saveUsers 格式一致）
    size_t pos = 0;
    while ((pos = content.find('{', pos)) != std::string::npos) {
        size_t end = content.find('}', pos);
        if (end == std::string::npos) break;
        std::string obj = content.substr(pos, end - pos + 1);
        pos = end + 1;

        UserData u;
        u.id = parseJsonInt(obj, "id", 0);
        u.username = parseJsonString(obj, "username");
        u.password = parseJsonString(obj, "password");
        u.highScore = parseJsonInt(obj, "highScore", 0);
        if (!u.username.empty()) users.push_back(u);
    }
    return users;
}

static void saveUsers(const std::vector<UserData>& users) {
    std::ofstream file("users.json");
    if (!file.is_open()) return;
    
    file << "[";
    for (size_t i = 0; i < users.size(); i++) {
        if (i > 0) file << ",";
        file << "{";
        file << "\"id\":" << users[i].id << ",";
        file << "\"username\":\"" << jsonEscape(users[i].username) << "\",";
        file << "\"password\":\"" << jsonEscape(users[i].password) << "\",";
        file << "\"highScore\":" << users[i].highScore;
        file << "}";
    }
    file << "]";
    file.close();
}

std::string handleUserRegister(const std::string& body) {
    std::string username = parseJsonString(body, "username");
    std::string password = parseJsonString(body, "password");
    
    if (username.empty() || password.empty()) {
        return ApiResponse::error(1003, "用户名和密码不能为空");
    }
    
    auto users = loadUsers();
    
    // 检查用户名是否已存在
    for (const auto& u : users) {
        if (u.username == username) {
            return ApiResponse::error(1001, "用户名已存在，请更换后重新注册");
        }
    }
    
    // 创建新用户
    UserData newUser;
    newUser.id = users.empty() ? 1 : (users.back().id + 1);
    newUser.username = username;
    newUser.password = password;
    newUser.highScore = 0;
    users.push_back(newUser);
    saveUsers(users);
    
    std::string data = "{";
    data += "\"id\":" + std::to_string(newUser.id) + ",";
    data += "\"username\":\"" + jsonEscape(newUser.username) + "\",";
    data += "\"password\":\"" + jsonEscape(newUser.password) + "\"";
    data += "}";
    
    return ApiResponse::success(data);
}

std::string handleUserLogin(const std::string& body) {
    std::string username = parseJsonString(body, "username");
    std::string password = parseJsonString(body, "password");
    
    auto users = loadUsers();
    
    for (const auto& u : users) {
        if (u.username == username && u.password == password) {
            std::string data = "{";
            data += "\"id\":" + std::to_string(u.id) + ",";
            data += "\"username\":\"" + jsonEscape(u.username) + "\",";
            data += "\"token\":\"token_" + std::to_string(u.id) + "_" + std::to_string(std::time(nullptr)) + "\"";
            data += "}";
            return ApiResponse::success(data);
        }
    }
    
    return ApiResponse::error(1002, "用户名或密码错误，请重试");
}

std::string handleUserHighScore(const std::string& body) {
    int id = parseJsonInt(body, "id", 0);
    int score = parseJsonInt(body, "score", 0);
    
    auto users = loadUsers();
    
    for (auto& u : users) {
        if (u.id == id) {
            if (score > u.highScore) {
                u.highScore = score;
                saveUsers(users);
            } else {
                std::string data = "{";
                data += "\"id\":" + std::to_string(u.id) + ",";
                data += "\"score\":" + std::to_string(score) + ",";
                data += "\"highScore\":" + std::to_string(u.highScore) + ",";
                data += "\"isNewRecord\":false";
                data += "}";
                return ApiResponse::success(data);
            }
            
            std::string data = "{";
            data += "\"id\":" + std::to_string(u.id) + ",";
            data += "\"highScore\":" + std::to_string(u.highScore) + ",";
            data += "\"isNewRecord\":true";
            data += "}";
            return ApiResponse::success(data);
        }
    }
    
    return ApiResponse::error(1004, "用户不存在");
}