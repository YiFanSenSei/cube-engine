// ===== UI 系统 =====
let gameMode = 'single';
let running = false;
let gameStarted = false;
let animFrameId = null;
let stage = 1;
let stageTarget = 1000;
let stageWinTimer = -1;
let aiDifficulty = 'medium';
let challengeTimeLeft = 300;
let challengeTimerInterval = null;
let menuMode = 'single';
let fromMenu = true;
let combo = 0; // 硬降连击计数

function updateModeUI(){
    const mode = gameMode;
    document.getElementById('modeSingle').className = 'mode-btn' + (mode === 'single' ? ' active' : '');
    document.getElementById('modeAi').className = 'mode-btn' + (mode === 'ai' ? ' active' : '');
    document.getElementById('modePvp').className = 'mode-btn' + (mode === 'pvp' ? ' active' : '');
    document.getElementById('modeCoop').className = 'mode-btn' + (mode === 'coop' ? ' active' : '');
    const p2 = document.querySelector('.ai-section'), p1 = document.querySelector('.player-section'),
          bc = document.querySelector('.board-container'), cs = document.getElementById('coopSection'),
          ts = document.getElementById('targetStatContainer'), lbl = document.getElementById('levelLabel');
    if(mode === 'single'){
        document.getElementById('p1Label').textContent = '闯关模式';
        p2.classList.add('hidden'); p1.style.display = ''; cs.classList.remove('show');
        bc.classList.add('single-mode'); ts.classList.add('show'); lbl.textContent = '关卡';
        document.getElementById('difficultySelect').classList.add('hidden');
    } else if(mode === 'challenge'){
        document.getElementById('p1Label').textContent = '挑战模式';
        p2.classList.add('hidden'); p1.style.display = ''; cs.classList.remove('show');
        bc.classList.add('single-mode'); ts.classList.remove('show'); lbl.textContent = '等级';
        document.getElementById('difficultySelect').classList.add('hidden');
    } else if(mode === 'build'){
        document.getElementById('p1Label').textContent = '🧱 建造模式';
        p2.classList.add('hidden'); p1.style.display = ''; cs.classList.remove('show');
        bc.classList.add('single-mode'); ts.classList.remove('show'); lbl.textContent = '等级';
        document.getElementById('difficultySelect').classList.add('hidden');
    } else if(mode === 'coop'){
        document.getElementById('p1Label').textContent = '玩家1';
        document.getElementById('p2Label').textContent = '玩家2';
        p1.style.display = 'none'; p2.classList.remove('hidden'); p2.style.display = 'none';
        cs.classList.add('show'); bc.classList.remove('single-mode'); ts.classList.remove('show');
        lbl.textContent = '等级'; document.getElementById('difficultySelect').classList.add('hidden');
    } else {
        const ip = mode === 'pvp';
        p2.classList.remove('hidden'); p2.style.display = ''; p1.style.display = '';
        cs.classList.remove('show'); bc.classList.remove('single-mode'); ts.classList.remove('show');
        lbl.textContent = '等级';
        document.getElementById('difficultySelect').classList.toggle('hidden', mode !== 'ai');
        document.getElementById('p1Label').textContent = ip ? '玩家1' : '玩家';
        document.getElementById('p2Label').textContent = ip ? '玩家2' : 'AI';
        document.getElementById('p2Dot').className = 'dot ' + (ip ? 'p2' : 'ai');
        document.getElementById('p2ScoreColor').className = 'stat-value ' + (ip ? 'p2-score' : 'ai-score');
    }
    updateKeyHints();
}

function updateUI(){
    document.getElementById('playerScore').textContent = playerGame.score;
    document.getElementById('playerLines').textContent = playerGame.lines;
    document.getElementById('playerLevel').textContent = gameMode === 'single' ? stage : playerGame.level;
    document.getElementById('playerBest').textContent = gameStats.playerMaxScore;
    document.getElementById('aiScore').textContent = aiGame.score;
    document.getElementById('aiLines').textContent = aiGame.lines;
    document.getElementById('aiLevel').textContent = aiGame.level;
    if(gameMode === 'coop'){
        document.getElementById('coopP1Score').textContent = playerGame.score;
        document.getElementById('coopP2Score').textContent = aiGame.score;
        document.getElementById('coopLines').textContent = playerGame.lines + aiGame.lines;
    }
    if(gameMode === 'challenge' || gameMode === 'build') document.getElementById('targetStatContainer').classList.remove('show');
}

function updateGameUI(){
    const p = gameStarted, m = gameMode;
    document.querySelector('.mode-switch').style.display = p ? 'none' : 'flex';
    document.getElementById('levelLabel').textContent = m === 'single' ? '关卡' : '等级';
    document.getElementById('buildChallenge').classList.toggle('show', m === 'build' && gameStarted);
    // 游戏中隐藏控制区，显示侧边栏操作按钮
    const controls = document.getElementById('gameControls');
    const sidebarActions = document.getElementById('sidebarActions');
    const coopSidebarActions = document.getElementById('coopSidebarActions');
    if (p) {
        controls.classList.add('hidden-in-game');
        if (sidebarActions) sidebarActions.classList.remove('hidden');
        if (coopSidebarActions) coopSidebarActions.classList.remove('hidden');
    } else {
        controls.classList.remove('hidden-in-game');
        if (sidebarActions) sidebarActions.classList.add('hidden');
        if (coopSidebarActions) coopSidebarActions.classList.add('hidden');
    }
}

/** 死亡界面上"回到主菜单"的统一逻辑 */
function backToMainMenu(){
    playSfx('click');
    document.getElementById('settingsPanel').classList.remove('show');
    document.getElementById('settingsBackdrop').classList.remove('show');
    document.getElementById('inGameActions').classList.add('hidden');
    if(gameStarted){ running = false; playerGame.gameOver = true; aiGame.gameOver = true; }
    gameStarted = false;
    if(challengeTimerInterval){ clearInterval(challengeTimerInterval); challengeTimerInterval = null; }
    playerGame.reset(); aiGame.reset();
    document.getElementById('btnStart').textContent = '开始游戏';
    document.getElementById('btnPause').disabled = true;
    document.getElementById('btnPause').textContent = '暂停';
    document.getElementById('challengeTimer').classList.remove('show');
    document.getElementById('buildChallenge').classList.remove('show');
    playerGame.buildMode = false;
    updateGameUI(); updateModeUI();
    playerRenderer.hideOverlay('playerOverlay'); aiRenderer.hideOverlay('aiOverlay');
    playerRenderer.render(); aiRenderer.render(); updateUI();
    clearTrialSkin(true);
    document.getElementById('menuOverlay').classList.remove('hidden');
}

/** 死亡界面上"再来一局"的统一逻辑 */
function restartGame(){
    playSfx('click');
    playerRenderer.hideOverlay('playerOverlay'); aiRenderer.hideOverlay('aiOverlay');
    startGame();
}

/** 死亡界面上两个操作按钮的 HTML 片段 */
function deathActionButtonsHTML(){
    return '<div class="death-action-btns">'
        + '<button class="death-action-btn death-back-btn" onclick="backToMainMenu()">←</button>'
        + '<button class="death-action-btn death-restart-btn" onclick="restartGame()">🔄</button>'
        + '</div>';
}

// 打开游戏内设置面板（暂停游戏）
function openInGameSettings(){
    if (!gameStarted) return;
    const isGameOver = playerGame.gameOver || aiGame.gameOver;
    // 暂停游戏（仅当游戏未结束时）
    if (running) {
        running = false;
        playerGame.paused = true;
        aiGame.paused = true;
        // 同步暂停 GameLoopManager 内部状态，确保游戏循环真正停止
        if (loopManager) loopManager.setPaused(true);
    }
    // 更新设置面板内容
    document.getElementById('settingsAccountName').textContent = getCurrentUser() || '游客';
    renderKeyBindingsUI();
    renderMySkins();
    settingsToggleState = false;
    // 重置设置面板滚动位置到顶部
    const panelBody = document.querySelector('.settings-panel .panel-body');
    if (panelBody) panelBody.scrollTop = 0;
    // 显示设置面板
    document.getElementById('settingsPanel').classList.add('show');
    document.getElementById('settingsBackdrop').classList.add('show');
    // 显示游戏内操作按钮
    document.getElementById('inGameActions').classList.remove('hidden');
    // 仅当游戏未结束时显示暂停覆盖层
    if (!isGameOver) {
        if(gameMode === 'coop') coopRenderer.showOverlay('<h2 style="font-size:34px;">⏸</h2><p>已暂停</p>', '');
        else {
            playerRenderer.showOverlay('playerOverlay', '<h2 style="font-size:34px;">⏸</h2><p>已暂停</p>', '');
            aiRenderer.showOverlay('aiOverlay', '<h2 style="font-size:34px;">⏸</h2><p>已暂停</p>', '');
        }
    }
}

// 关闭游戏内设置面板（恢复游戏）
function closeInGameSettings(){
    // 隐藏设置面板
    document.getElementById('settingsPanel').classList.remove('show');
    document.getElementById('settingsBackdrop').classList.remove('show');
    document.getElementById('inGameActions').classList.add('hidden');
    const isGameOver = playerGame.gameOver || aiGame.gameOver;
    // 仅当游戏未结束时才隐藏覆盖层（避免清除死亡/胜利界面）
    if (!isGameOver) {
        if(gameMode === 'coop') coopRenderer.hideOverlay();
        else {
            playerRenderer.hideOverlay('playerOverlay');
            aiRenderer.hideOverlay('aiOverlay');
        }
        // 恢复游戏
        running = true;
        playerGame.paused = false;
        aiGame.paused = false;
        if (loopManager) loopManager.setPaused(false);
        playerGame.lastTime = performance.now();
        aiGame.lastTime = performance.now();
        animFrameId = requestAnimationFrame(gameLoop);
    }
}

function setMode(mode){
    if(mode === gameMode) return;
    if(gameStarted){ running = false; playerGame.gameOver = true; aiGame.gameOver = true; }
    gameMode = mode;
    updateModeUI();
    // 更新呼吸系统模式
    breathEffect.setMode(mode, playerGame, aiGame);
    breathEffect.clear();
    if(!gameStarted){
        playerRenderer.hideOverlay('playerOverlay');
        aiRenderer.hideOverlay('aiOverlay');
        coopRenderer.hideOverlay();
        playerRenderer.render(); aiRenderer.render(); coopRenderer.render();
        if(mode === 'single') playerRenderer.showOverlay('playerOverlay', '<h2 style="font-size:22px;font-weight:300;">🎯 闯关模式</h2><p style="margin-top:6px;">达成分数即可通关！</p>', '');
        else if(mode === 'coop') coopRenderer.showOverlay('<h2 style="font-size:22px;font-weight:300;">🤝 双人合作</h2><p style="margin-top:6px;">按「开始游戏」各控制一半</p>', '');
    }
}

// 游戏主循环实例（在 main.js 中创建）
let loopManager = null;

/** 兼容性包装：保留 gameLoop 函数名，内部委托给 GameLoopManager */
async function gameLoop(timestamp) {
    if (!loopManager) return;
    await loopManager._loop(timestamp);
}

function startGame(){
    // 如果回放面板处于活动状态，退出回放
    if (replayUI.isActive()) {
        replayUI.exitReplay();
    }
    if(animFrameId){ cancelAnimationFrame(animFrameId); animFrameId = null; }
    running = false; gameStarted = false;
    gameStats._gameOverTracked = false;
    const mode = gameMode;
    if(challengeTimerInterval){ clearInterval(challengeTimerInterval); challengeTimerInterval = null; }

    if(mode === 'single'){ stage = 1; stageTarget = 1000; stageWinTimer = -1; document.getElementById('targetScoreDisplay').textContent = stageTarget; }
    if(mode === 'challenge'){
        challengeTimeLeft = 300;
        document.getElementById('challengeTimeDisplay').textContent = '5:00';
        document.getElementById('challengeTimer').classList.add('show');
        document.getElementById('targetStatContainer').classList.remove('show');
        document.getElementById('buildChallenge').classList.remove('show');
    } else document.getElementById('challengeTimer').classList.remove('show');

    if(mode === 'build'){ initBuildMode(); playerGame.buildMode = true; playerGame.dropInterval = 1500; }
    else { playerGame.buildMode = false; document.getElementById('buildChallenge').classList.remove('show'); }

    combo = 0; // 新游戏重制连击
    gameStats._lastDropWasHard = false;
    gameStats._gameStartTime = Date.now();
    gameStats._firstLineCleared = false;
    gameStats._lastLines = 0;
    gameStats._gameOverTracked = false;
    _trackedPiecesThisGame = new Set();

    // Initialize C++ games
    if(nativeAvailable){
        const isPvp = mode === 'pvp' || mode === 'coop';
        window.nativeAPI.init({
            playerIsAI: false,
            aiIsAI: mode === 'ai',
            difficulty: aiDifficulty,
            buildMode: mode === 'build',
            p2pMode: isPvp
        }).then(r => {
            if(r && r.error){ console.warn('C++ 初始化失败:', r.error); }
            else if(r && r.playerState){
                if(mode === 'coop'){
                    window.nativeAPI.setCoopMode(true);
                }
                syncFromNative();
            }
        }).catch(e => { console.warn('C++ 初始化异常:', e); });
    }

    playerGame.reset();
    aiGame.reset();
    playerGame._gameOverHandled = false;
    aiGame._gameOverHandled = false;
    aiGame.difficulty = aiDifficulty;
    // 清除粒子
    playerRenderer.particles.clear();
    aiRenderer.particles.clear();
    coopRenderer.particles.clear();
    // 同步难度按钮显示状态
    document.querySelectorAll('.diff-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.diff === aiDifficulty);
    });

    // 使用新回放录制系统
    replayRecorder.start();
    playerRenderer.hideOverlay('playerOverlay');
    aiRenderer.hideOverlay('aiOverlay');
    coopRenderer.hideOverlay();
    // 重置心跳状态
    resetHeartbeat();
    // 重置呼吸特效，绑定当前模式对应的游戏对象
    breathEffect.setMode(mode, playerGame, aiGame);
    breathEffect.clear();
    gameStarted = true;
    running = true;
    document.getElementById('btnStart').textContent = '重新开始';
    document.getElementById('btnPause').textContent = '暂停';
    document.getElementById('btnPause').disabled = false;
    updateGameUI();
    updateUI();

    // Challenge timer
    if(mode === 'challenge'){
        challengeTimerInterval = setInterval(() => {
            if(!running) return;
            challengeTimeLeft--;
            const m = Math.floor(challengeTimeLeft / 60), s = challengeTimeLeft % 60;
            document.getElementById('challengeTimeDisplay').textContent = m + ':' + (s < 10 ? '0' : '') + s;
            if(challengeTimeLeft <= 30) {
                document.getElementById('challengeTimeDisplay').classList.add('timer-urgent');
                if (challengeTimeLeft <= 30 && challengeTimeLeft > 0 && challengeTimeLeft % 5 === 0) playSfx('urgent');
            }
            if(challengeTimeLeft <= 0){ clearInterval(challengeTimerInterval); challengeTimerInterval = null; playerGame.gameOver = true; }
        }, 1000);
    }

    applyBlockSkin(equippedItems.block || 'classic');
    applyTheme(equippedItems.ui || 'classic');
    // 使用 GameLoopManager 启动循环
    if (loopManager) loopManager.start();
}

function togglePause(){
    if(!gameStarted || playerGame.gameOver || aiGame.gameOver) return;
    running = !running;
    playerGame.paused = !running;
    aiGame.paused = !running;
    // 同步暂停 GameLoopManager 内部状态
    if (loopManager) loopManager.setPaused(!running);
    document.getElementById('btnPause').textContent = running ? '暂停' : '继续';
    if(running){
        if(gameMode === 'coop') coopRenderer.hideOverlay();
        else { playerRenderer.hideOverlay('playerOverlay'); aiRenderer.hideOverlay('aiOverlay'); }
        playerGame.lastTime = performance.now();
        aiGame.lastTime = performance.now();
        // GameLoopManager._loop 已自行调度下一帧，此处无需重复 requestAnimationFrame
    } else {
        if(gameMode === 'coop') coopRenderer.showOverlay('<h2 style="font-size:34px;">⏸</h2><p>已暂停</p>', '');
        else {
            playerRenderer.showOverlay('playerOverlay', '<h2 style="font-size:34px;">⏸</h2><p>已暂停</p>', '');
            aiRenderer.showOverlay('aiOverlay', '<h2 style="font-size:34px;">⏸</h2><p>已暂停</p>', '');
        }
    }
}

function checkGameOver(){
    // AI / PvP: each side dies independently
    if(gameMode === 'ai' || gameMode === 'pvp'){
        const hasFrames = replayRecorder.getFrameCount() > 0;
        const rb1 = gameMode !== 'pvp' && hasFrames ? '<br><button class="btn btn-primary" id="replayWatchBtn" style="margin-top:10px;padding:6px 20px;font-size:13px;">📼 观看回放</button>' : '';
        const deathBtns = deathActionButtonsHTML();
        if(playerGame.gameOver && !playerGame._gameOverHandled){
            playerGame._gameOverHandled = true;
            gameStats.gameOverCount = (gameStats.gameOverCount || 0) + 1;
            gameStats.playerMaxScore = Math.max(gameStats.playerMaxScore, playerGame.score);
            gameStats.maxLevel = Math.max(gameStats.maxLevel, playerGame.level);
            if(gameMode === 'ai' && playerGame.score > aiGame.score) gameStats.aiWins = (gameStats.aiWins || 0) + 1;
            if(gameMode === 'pvp' && playerGame.score > aiGame.score) gameStats.pvpWins = (gameStats.pvpWins || 0) + 1;
            checkAchievements().catch(()=>{});
            clearTrialSkin(true).catch(()=>{});
            setTimeout(() => playSfx('gameover'), 100);
            // AI 模式根据分数动态显示胜负
            if(gameMode === 'ai'){
                const pWin = playerGame.score > aiGame.score;
                const pTie = playerGame.score === aiGame.score;
                const pEmoji = pWin ? '🎉' : (pTie ? '🤝' : '💥');
                const pLabel = pWin ? '你赢了！' : (pTie ? '平局！' : '你输了');
                playerRenderer.showOverlay('playerOverlay',
                    '<div class="big-emoji">'+pEmoji+'</div><h2>'+pLabel+'</h2><p>得分: '+playerGame.score+' | AI: '+aiGame.score+'</p>'+renderBlockStatsHTML(playerGame.blockStats)+rb1+deathBtns, '');
                // 玩家输了 → AI 也立即结束，不让 AI 继续玩
                aiGame.gameOver = true;
            } else {
                playerRenderer.showOverlay('playerOverlay',
                    '<div class="big-emoji">💥</div><h2>玩家1 淘汰</h2><p>得分: '+playerGame.score+'</p>'+renderBlockStatsHTML(playerGame.blockStats)+rb1+deathBtns, '');
            }
            if(rb1) setTimeout(() => { const b = document.getElementById('replayWatchBtn'); if(b) b.addEventListener('click', () => replayUI.startReplay('player')); }, 50);
        }
        if(aiGame.gameOver && !aiGame._gameOverHandled){
            aiGame._gameOverHandled = true;
            setTimeout(() => playSfx('gameover'), 100);
            // PvP 双人对战保留双方回放，AI 对战只留玩家侧
            const rb2 = '';
            aiRenderer.showOverlay('aiOverlay',
                '<div class="big-emoji">💥</div><h2>'+(gameMode==='ai'?'AI 输了':'玩家2 淘汰')+'</h2><p>得分: '+aiGame.score+'</p>'+renderBlockStatsHTML(aiGame.blockStats)+rb2+deathBtns, '');
            // AI 模式：AI 先死 → 不结束玩家游戏，等待玩家也输后再比分数
            // 玩家侧继续游戏，AI overlay 已在上方显示 "AI 输了"
            if(rb2) setTimeout(() => { const b = document.getElementById('replayWatchAiBtn'); if(b) b.addEventListener('click', () => replayUI.startReplay('ai')); }, 50);
        }
        if(playerGame.gameOver && aiGame.gameOver){
            running = false;
            document.getElementById('btnStart').textContent = '重新开始';
            document.getElementById('btnPause').disabled = true;
            updateUI();
            return true;
        }
        return false;
    }

    if(playerGame.gameOver || aiGame.gameOver){
        if(!playerGame.gameOver) playerGame.gameOver = true;
        if(!aiGame.gameOver) aiGame.gameOver = true;
        running = false;
        if(gameMode === 'challenge' && challengeTimerInterval){ clearInterval(challengeTimerInterval); challengeTimerInterval = null; }
        const mode = gameMode;
        document.getElementById('btnStart').textContent = '重新开始';
        document.getElementById('btnPause').disabled = true;
        updateUI();
        if(!gameStats._gameOverTracked){
            gameStats._gameOverTracked = true;
            gameStats.gameOverCount++;
            gameStats.playerMaxScore = Math.max(gameStats.playerMaxScore, playerGame.score);
            gameStats.maxLevel = Math.max(gameStats.maxLevel, playerGame.level);
            if(mode === 'challenge' && playerGame.score > 0){ addLeaderboardEntry(playerGame.score); if(challengeTimeLeft <= 0 && playerGame.score > 0) gameStats._perfectChallenge = true; }
            checkAchievements().catch(()=>{});
            clearTrialSkin(true).catch(()=>{});
        }
        setTimeout(() => playSfx('gameover'), 100);
        const hasFrames = replayRecorder.getFrameCount() > 0;
        const rb = hasFrames ? '<br><button class="btn btn-primary" id="replayWatchBtn" style="margin-top:10px;padding:6px 20px;font-size:13px;">📼 观看回放</button>' : '';
        const bs = renderBlockStatsHTML(playerGame.blockStats);
        const deathBtns = deathActionButtonsHTML();
        if(mode === 'single'){
            playerRenderer.showOverlay('playerOverlay', '<div class="big-emoji">💥</div><h2>游戏结束</h2><p>到达第 '+stage+' 关 · 得分: '+playerGame.score+'</p>'+bs+rb+deathBtns, '');
            aiRenderer.hideOverlay('aiOverlay');
        } else if(mode === 'challenge'){
            const isNewRecord = leaderboard.length>0 && leaderboard[0].score===playerGame.score;
            if (isNewRecord) playSfx('newrecord');
            playerRenderer.showOverlay('playerOverlay', '<div class="big-emoji">⏱</div><h2>挑战结束！</h2><p>得分: '+playerGame.score+'</p>'+(isNewRecord?'<p style="color:var(--gold-1);font-size:16px;margin-top:4px;">🎉 新纪录！</p>':'')+bs+rb+deathBtns, '');
            aiRenderer.hideOverlay('aiOverlay');
        } else if(mode === 'build'){
            playerRenderer.showOverlay('playerOverlay', '<div class="big-emoji">🏗️</div><h2>建造结束</h2><p>完成 '+buildCompletedCount+' 个挑战 · 得分: '+playerGame.score+'</p>'+bs+rb+deathBtns, '');
            aiRenderer.hideOverlay('aiOverlay');
        } else if(mode === 'coop'){
            const p1 = playerGame.score, p2 = aiGame.score, msg = p1>p2?'👤 玩家1 更胜一筹':p2>p1?'👤 玩家2 更胜一筹':'🤝 旗鼓相当！';
            coopRenderer.showOverlay('<div class="big-emoji">💥</div><h2>合作结束</h2><p style="margin-bottom:6px;">'+msg+'</p><div class="coop-result-grid"><div class="coop-result-p1"><div class="coop-result-name">👤 玩家1</div><div class="coop-result-score p1-score">'+p1+'</div></div><div class="coop-result-vs">VS</div><div class="coop-result-p2"><div class="coop-result-name">👤 玩家2</div><div class="coop-result-score p2-score">'+p2+'</div></div></div>'+renderBlockStatsHTML(playerGame.blockStats)+renderBlockStatsHTML(aiGame.blockStats)+rb+deathBtns, '');
        } else {
            const p1 = playerGame.score, p2 = aiGame.score, ip = mode === 'pvp', msg = p1>p2?ip?'🎉 玩家1 获胜！':'🎉 你赢了！':p2>p1?ip?'🎉 玩家2 获胜！':'🤖 AI 获胜！':'🤝 平局！';
            playerRenderer.showOverlay('playerOverlay', '<h2>游戏结束</h2><p>得分: '+playerGame.score+'</p>'+bs+rb+deathBtns, '');
            aiRenderer.showOverlay('aiOverlay', '<h2>游戏结束</h2><p style="color:'+(p1>p2?'#00d4ff':p2>p1?(ip?'#ffd700':'#ff6b6b'):'#ffd700')+'; font-size:22px; font-weight:700;">'+msg+'</p><div class="game-over-sub">'+(ip?'玩家1':'玩家')+' '+p1+' — '+(ip?'玩家2':'AI')+' '+p2+'</div>'+renderBlockStatsHTML(aiGame.blockStats), '');
        }
        if(hasFrames) setTimeout(() => { const b = document.getElementById('replayWatchBtn'); if(b) b.addEventListener('click', () => replayUI.startReplay('player')); }, 50);
        return true;
    }
    return false;
}

function adjustGameScale(){
    const w = document.querySelector('.game-wrapper'), b = document.body, mw = b.clientWidth - 20, mh = b.clientHeight - 20;
    let s = Math.min(mw / 860, mh / 920);
    s = Math.max(0.5, Math.min(1.5, s));
    if(Math.abs(s - 1) > 0.02){
        w.style.transform = 'scale(' + s + ')';
        w.style.transformOrigin = 'center top';
        w.style.marginTop = Math.max(0, (b.clientHeight - 920 * s) / 2) + 'px';
    } else { w.style.transform = ''; w.style.marginTop = ''; }
}

function debounce(fn, ms){ let t; return function(...a){ clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; }

/** 弹出关卡通关小标签（类似成就通知） */
function showStageNotification(newStage, targetScore){
    const el = document.getElementById('stageNotif');
    if(!el) return;
    el.querySelector('.notif-name').textContent = '进入第 ' + newStage + ' 关';
    el.querySelector('.notif-desc').innerHTML = '目标分数: <span id="stageNotifTarget">' + targetScore + '</span>';
    el.classList.add('show');
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.classList.remove('show'), 4000);
}

// ===== 游戏小提示系统 =====
const TETRIS_TIPS = [
    '按空格键可以硬降方块，快速落地',
    '按 ↑ 键可以旋转方块',
    '使用 T 旋可以插入狭窄的缝隙',
    '尽量保持堆叠平整，方便放置后续方块',
    '消除四行（Tetris）可以获得大量分数',
    '把方块留到最右边再旋转，有时能多争取空间',
    '按住 ↓ 键可以软降加速',
    '用 I 方块一次消四行，留着它等机会',
    '提前看下一个方块，提前规划位置',
    '不要在一个地方堆太高，留出缓冲空间',
    '连续硬降（连击）会获得额外分数奖励',
    '在闯关模式下，达到目标分数即可进入下一关',
    'S 和 Z 方块最难放，提前留好位置',
    '方块下落时可以快速按左右微调位置',
    '熟悉每种方块的形状，能更快做出判断',
    '在挑战模式下尽可能快地消除，获得更高排名',
    '利用墙踢（Wall Kick）机制，墙面旁也能旋转',
    '对战模式中给对手送垃圾行是翻盘的关键',
    '合作模式下和队友配合好才能走得更远',
    '建造模式要小心，方块堆满就结束了，尽快完成挑战吧',
    '连续消除会累积连击分数加成，越消越多',
    '方块快到顶时别慌，还有机会扭转局面',
    'I 方块竖着放消四行，横着放能垫底填坑',
    '硬降前先看好位置，避免落地后手忙脚乱',
    'AI 模式速度会越来越快，保持冷静别着急',
    '在皮肤商城可以更换方块和界面主题',
    '堆叠时留出峡谷形状，方便长条方块通过',
];

let _tipInterval = null;
let _tipVisible = false;
let _tipGameActive = false;

function initTipCharacter() {
    const chara = document.getElementById('tipCharacter');
    if (!chara) return;

    // 监听游戏状态变化
    _showRandomTip();
    _tipVisible = true;
    chara.classList.add('visible');

    // 每 12 秒更换提示
    _tipInterval = setInterval(() => {
        if (_tipGameActive) {
            _showRandomTip();
        }
    }, 6000);

    // 点击小人换一条
    chara.addEventListener('click', () => {
        _showRandomTip();
    });
}

function _showRandomTip() {
    const el = document.getElementById('tipText');
    if (!el) return;
    // 简单随机，不重复上一条
    let idx;
    do {
        idx = Math.floor(Math.random() * TETRIS_TIPS.length);
    } while (TETRIS_TIPS.length > 1 && TETRIS_TIPS[idx] === el._lastTip);
    el.textContent = TETRIS_TIPS[idx];
    el._lastTip = TETRIS_TIPS[idx];

    // 轻微弹出动画
    const bubble = document.getElementById('tipBubble');
    if (bubble) {
        bubble.style.transition = 'none';
        bubble.style.transform = 'scale(0.9)';
        bubble.style.opacity = '0.5';
        void bubble.offsetHeight;
        bubble.style.transition = 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease';
        bubble.style.transform = 'scale(1)';
        bubble.style.opacity = '1';
    }
}

function setTipGameActive(active) {
    _tipGameActive = active;
    const chara = document.getElementById('tipCharacter');
    if (!chara) return;

    if (active) {
        // 游戏进行中：显示小提示
        chara.classList.add('visible');
        _tipVisible = true;
        _showRandomTip();
    } else if (!document.querySelector('.menu-overlay:not(.hidden)')) {
        // 没有全屏覆盖层时保持可见
        // 否则隐藏
    }
}

// ===== 小提示位置 — 可拖拽 =====
/** 应用快捷预设位置（左上/右上/左下/右下） */
function applyTipPreset(pos) {
    const chara = document.getElementById('tipCharacter');
    if (!chara) return;
    // 清除行内定位
    chara.style.left = '';
    chara.style.top = '';
    chara.style.right = '';
    chara.style.bottom = '';
    chara.style.transition = '';
    // 清除旧方向 class，应用 preset class
    chara.className = chara.className
        .split(' ').filter(c => !c.startsWith('tip-pos-'))
        .concat(['tip-pos-' + pos])
        .join(' ');
    // 保存为预设名称字符串
    if (typeof equippedItems !== 'undefined') {
        equippedItems.tipPosition = pos;
        if (typeof saveShopData === 'function') saveShopData().catch(() => {});
    }
    // 更新设置面板按钮高亮
    document.querySelectorAll('#tipPosOptions .tip-pos-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.pos === pos);
    });
}

/** 应用自定义像素位置（拖拽结果） */
function applyTipCustomPosition(x, y) {
    const chara = document.getElementById('tipCharacter');
    if (!chara) return;
    chara.className = chara.className
        .split(' ').filter(c => !c.startsWith('tip-pos-'))
        .join(' ');
    chara.style.left = x + 'px';
    chara.style.top = y + 'px';
    chara.style.right = 'auto';
    chara.style.bottom = 'auto';
    updateTipArrowDirection(x);
}

/** 根据水平位置决定箭头方向 */
function updateTipArrowDirection(x) {
    const chara = document.getElementById('tipCharacter');
    if (!chara) return;
    const half = window.innerWidth / 2;
    const shouldFlip = x + chara.offsetWidth / 2 > half;
    chara.classList.toggle('tip-pos-right', shouldFlip);
}

/** 保存拖拽后的自定义位置 */
function saveTipCustomPosition() {
    const chara = document.getElementById('tipCharacter');
    if (!chara) return;
    const x = parseFloat(chara.style.left);
    const y = parseFloat(chara.style.top);
    if (isNaN(x) || isNaN(y)) return;
    if (typeof equippedItems !== 'undefined') {
        equippedItems.tipPosition = { x, y };
        if (typeof saveShopData === 'function') saveShopData().catch(() => {});
    }
    // 取消所有预设按钮高亮
    document.querySelectorAll('#tipPosOptions .tip-pos-btn').forEach(b => {
        b.classList.remove('active');
    });
}

function initTipPosition() {
    const chara = document.getElementById('tipCharacter');
    if (!chara) return;

    // 恢复保存的位置
    const saved = (typeof equippedItems !== 'undefined' && equippedItems.tipPosition);
    if (saved && typeof saved === 'object' && saved.x !== undefined) {
        applyTipCustomPosition(saved.x, saved.y);
    } else {
        applyTipPreset(typeof saved === 'string' ? saved : 'tl');
    }

    // 绑定设置面板按钮
    const container = document.getElementById('tipPosOptions');
    if (container) {
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.tip-pos-btn');
            if (!btn) return;
            applyTipPreset(btn.dataset.pos);
        });
    }

    // === 拖拽功能（跟回放面板一样） ===
    const handle = chara.querySelector('.tip-chara-body');
    if (!handle) return;

    let isDragging = false;
    let startX, startY, origLeft, origTop;

    const dragStart = (clientX, clientY) => {
        isDragging = true;
        const rect = chara.getBoundingClientRect();
        startX = clientX;
        startY = clientY;
        origLeft = rect.left;
        origTop = rect.top;
        chara.style.transition = 'none';
        // 清除 preset 类，准备用 inline 定位
        chara.className = chara.className
            .split(' ').filter(c => !c.startsWith('tip-pos-'))
            .join(' ');
        chara.style.left = rect.left + 'px';
        chara.style.top = rect.top + 'px';
        chara.style.right = 'auto';
        chara.style.bottom = 'auto';
    };

    const dragMove = (clientX, clientY) => {
        if (!isDragging) return;
        let x = origLeft + clientX - startX;
        let y = origTop + clientY - startY;
        // 边界约束，防止拖出视口
        const cw = chara.offsetWidth;
        const ch = chara.offsetHeight;
        x = Math.max(0, Math.min(x, window.innerWidth - cw));
        y = Math.max(0, Math.min(y, window.innerHeight - ch));
        chara.style.left = x + 'px';
        chara.style.top = y + 'px';
        // 动态切换箭头方向
        updateTipArrowDirection(x);
    };

    const dragEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        chara.style.transition = '';
        saveTipCustomPosition();
    };

    // 鼠标事件
    handle.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        dragStart(e.clientX, e.clientY);
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        dragMove(e.clientX, e.clientY);
    });
    document.addEventListener('mouseup', dragEnd);

    // 触屏事件
    handle.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        if (!t) return;
        dragStart(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const t = e.touches[0];
        if (!t) return;
        dragMove(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchend', dragEnd, { passive: true });
}