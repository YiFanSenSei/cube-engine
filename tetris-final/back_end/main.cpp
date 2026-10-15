/**
 * Tetris HTTP API 服务入口
 * 
 * 提供 RESTful API 接口，包装方块引擎。
 * 使用 Crow C++ HTTP 框架。
 * 
 * 启动方式：
 *   cd back_end && cmake -B build && cmake --build build && ./build/cube_server
 * 
 * 或者下载 crow_all.h 后直接编译：
 *   g++ -std=c++17 -pthread main.cpp api.cpp ../native/tetris_core.cpp -o cube_server
 */

#include <iostream>
#include <string>
#include <thread>
#include "api.h"

// 简易 HTTP 服务器实现（纯 C++17，不依赖第三方框架）
// 如果需要更完整的框架，可以使用 Crow 或 httplib

#include <cstring>
#include <sys/types.h>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#endif

const int PORT = 8080;

// 解析 HTTP 请求的路径和方法
static void parseHttpRequest(const std::string& raw, std::string& method, std::string& path, std::string& body) {
    size_t methodEnd = raw.find(' ');
    if (methodEnd == std::string::npos) return;
    method = raw.substr(0, methodEnd);
    
    size_t pathStart = methodEnd + 1;
    size_t pathEnd = raw.find(' ', pathStart);
    if (pathEnd == std::string::npos) return;
    path = raw.substr(pathStart, pathEnd - pathStart);
    
    // 查找 body（在 \r\n\r\n 之后）
    size_t bodyStart = raw.find("\r\n\r\n");
    if (bodyStart != std::string::npos) {
        body = raw.substr(bodyStart + 4);
    }
}

// 生成 HTTP 响应
static std::string httpResponse(int statusCode, const std::string& contentType, const std::string& body) {
    std::string statusText;
    switch (statusCode) {
        case 200: statusText = "OK"; break;
        case 201: statusText = "Created"; break;
        case 400: statusText = "Bad Request"; break;
        case 404: statusText = "Not Found"; break;
        case 500: statusText = "Internal Server Error"; break;
        default: statusText = "Unknown"; break;
    }
    
    std::string response = "HTTP/1.1 " + std::to_string(statusCode) + " " + statusText + "\r\n";
    response += "Content-Type: " + contentType + "\r\n";
    response += "Content-Length: " + std::to_string(body.size()) + "\r\n";
    response += "Access-Control-Allow-Origin: *\r\n";
    response += "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n";
    response += "Access-Control-Allow-Headers: Content-Type, Authorization\r\n";
    response += "Connection: close\r\n";
    response += "\r\n";
    response += body;
    return response;
}

// 路由分发
static std::string routeRequest(const std::string& method, const std::string& path, const std::string& body) {
    // CORS preflight
    if (method == "OPTIONS") {
        return httpResponse(200, "text/plain", "");
    }
    
    // API 路由
    if (path == "/api/game/init" && method == "POST") {
        return httpResponse(200, "application/json", handleGameInit(body));
    }
    if (path == "/api/game/move" && method == "POST") {
        return httpResponse(200, "application/json", handleGameMove(body));
    }
    if (path == "/api/game/rotate" && method == "POST") {
        return httpResponse(200, "application/json", handleGameRotate(body));
    }
    if (path == "/api/game/hardDrop" && method == "POST") {
        return httpResponse(200, "application/json", handleGameHardDrop(body));
    }
    if (path == "/api/game/state" && method == "POST") {
        return httpResponse(200, "application/json", handleGameGetState(body));
    }
    if (path == "/api/game/update" && method == "POST") {
        return httpResponse(200, "application/json", handleGameUpdate(body));
    }
    if (path == "/api/game/reset" && method == "POST") {
        return httpResponse(200, "application/json", handleGameReset(body));
    }
    if (path == "/api/user/register" && method == "POST") {
        return httpResponse(201, "application/json", handleUserRegister(body));
    }
    if (path == "/api/user/login" && method == "POST") {
        return httpResponse(200, "application/json", handleUserLogin(body));
    }
    if (path == "/api/user/highscore" && method == "POST") {
        return httpResponse(200, "application/json", handleUserHighScore(body));
    }
    if (path == "/api/health" && method == "GET") {
        std::string healthData = "{\"status\":\"ok\",\"activeGames\":" + std::to_string(globalGameManager.getActiveCount()) + "}";
        return httpResponse(200, "application/json", healthData);
    }
    
    // 404
    std::string errorBody = "{\"code\":404,\"message\":\"Not Found: " + path + "\"}";
    return httpResponse(404, "application/json", errorBody);
}

#ifdef _WIN32
// Windows 下的 socket 清理
class WSAInit {
public:
    WSAInit() {
        WSADATA wsaData;
        WSAStartup(MAKEWORD(2, 2), &wsaData);
    }
    ~WSAInit() {
        WSACleanup();
    }
};
#endif

// ========== 处理客户端连接 ==========
static void handleClient(int clientFd) {
    char buffer[65536] = {0};
    
#ifdef _WIN32
    int bytesRead = recv(clientFd, buffer, sizeof(buffer) - 1, 0);
#else
    ssize_t bytesRead = read(clientFd, buffer, sizeof(buffer) - 1);
#endif
    
    if (bytesRead > 0) {
        buffer[bytesRead] = '\0';
        std::string raw(buffer);
        
        std::string method, path, body;
        parseHttpRequest(raw, method, path, body);
        
        std::string response = routeRequest(method, path, body);
        
#ifdef _WIN32
        send(clientFd, response.c_str(), (int)response.size(), 0);
        closesocket(clientFd);
#else
        write(clientFd, response.c_str(), response.size());
        close(clientFd);
#endif
    }
}

int main() {
#ifdef _WIN32
    WSAInit wsaInit;
#endif
    
    // 创建 socket
    int serverFd;
#ifdef _WIN32
    serverFd = socket(AF_INET, SOCK_STREAM, 0);
    if (serverFd == INVALID_SOCKET) {
        std::cerr << "创建 socket 失败" << std::endl;
        return 1;
    }
#else
    serverFd = socket(AF_INET, SOCK_STREAM, 0);
    if (serverFd < 0) {
        std::cerr << "创建 socket 失败" << std::endl;
        return 1;
    }
#endif
    
    // 允许地址重用
    int opt = 1;
    setsockopt(serverFd, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));
    
    // 绑定地址
    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(PORT);
    
    if (bind(serverFd, (struct sockaddr*)&address, sizeof(address)) < 0) {
        std::cerr << "绑定端口 " << PORT << " 失败" << std::endl;
        return 1;
    }
    
    std::cout << "=================================" << std::endl;
    std::cout << " 🎮 Tetris API Server v1.0" << std::endl;
    std::cout << "    监听端口: " << PORT << std::endl;
    std::cout << "    健康检查: http://localhost:" << PORT << "/api/health" << std::endl;
    std::cout << "    游戏API:  http://localhost:" << PORT << "/api/game/*" << std::endl;
    std::cout << "    用户API:  http://localhost:" << PORT << "/api/user/*" << std::endl;
    std::cout << "=================================" << std::endl;
    
    listen(serverFd, 10);
    
    // 启动后台线程定期清理不活跃会话
    std::thread cleanupThread([]() {
        while (true) {
            std::this_thread::sleep_for(std::chrono::minutes(5));
            globalGameManager.cleanupInactive(1800); // 30分钟不活跃则清理
        }
    });
    cleanupThread.detach();
    
    // 主循环接受连接
    while (true) {
        struct sockaddr_in clientAddr;
#ifdef _WIN32
        int addrLen = sizeof(clientAddr);
#else
        socklen_t addrLen = sizeof(clientAddr);
#endif
        
        int clientFd = accept(serverFd, (struct sockaddr*)&clientAddr, &addrLen);
        if (clientFd < 0) {
            std::cerr << "接受连接失败" << std::endl;
            continue;
        }
        
        // 每个客户端连接使用独立线程处理
        std::thread clientThread(handleClient, clientFd);
        clientThread.detach();
    }
    
#ifdef _WIN32
    closesocket(serverFd);
#else
    close(serverFd);
#endif
    
    return 0;
}