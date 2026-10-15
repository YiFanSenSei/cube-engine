#ifndef TETRIS_API_H
#define TETRIS_API_H

#include <string>
#include <unordered_map>
#include <memory>
#include <mutex>
#include "tetris_core.h"

/**
 * Tetris API 服务
 * 
 * 提供 RESTful HTTP API 接口，封装方块引擎。
 * 支持多游戏实例并发管理，每个客户端通过 game_id 标识自己的游戏会话。
 */

// 游戏会话
struct GameSession {
    std::unique_ptr<tetris::TetrisGame> game;
    std::string playerName;
    int highScore = 0;
    double lastAccessTime = 0;
    bool loggedIn = false;
    
    GameSession() : game(std::make_unique<tetris::TetrisGame>(false)) {}
    explicit GameSession(bool isAI) : game(std::make_unique<tetris::TetrisGame>(isAI)) {}
};

// API 响应结构
struct ApiResponse {
    int code = 0;
    std::string message = "success";
    std::string data;  // JSON string
    
    static std::string error(int code, const std::string& msg);
    static std::string success(const std::string& data = "{}");
};

// 游戏管理器（线程安全）
class GameManager {
private:
    std::unordered_map<std::string, std::shared_ptr<GameSession>> sessions;
    std::mutex mutex;
    int nextId = 1;
    
public:
    std::string createSession(bool isAI = false);
    std::shared_ptr<GameSession> getSession(const std::string& gameId);
    bool removeSession(const std::string& gameId);
    void cleanupInactive(double timeoutSeconds = 3600);
    int getActiveCount();
};

// 全局游戏管理器实例
extern GameManager globalGameManager;

// ========== API 处理函数 ==========

// 游戏操作
std::string handleGameInit(const std::string& body);
std::string handleGameMove(const std::string& body);
std::string handleGameRotate(const std::string& body);
std::string handleGameHardDrop(const std::string& body);
std::string handleGameGetState(const std::string& body);
std::string handleGameUpdate(const std::string& body);
std::string handleGameReset(const std::string& body);

// 用户相关
std::string handleUserRegister(const std::string& body);
std::string handleUserLogin(const std::string& body);
std::string handleUserHighScore(const std::string& body);

// 辅助函数
std::string serializeGameState(const tetris::TetrisGame& game);

#endif // TETRIS_API_H