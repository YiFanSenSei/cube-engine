// ===== 成就系统 =====
const ACHIEVEMENTS = [
    {id:'first_score',name:'第一分',desc:'获得第一个100分',icon:'⭐',reward:{gold:50,diamond:0},check:s=>s.playerMaxScore>=100},
    {id:'score_1000',name:'小有所成',desc:'达到1000分',icon:'🌟',reward:{gold:100,diamond:3},check:s=>s.playerMaxScore>=1000},
    {id:'score_5000',name:'方块大师',desc:'达到5000分',icon:'🏆',reward:{gold:200,diamond:8},check:s=>s.playerMaxScore>=5000},
    {id:'score_10000',name:'传说中的高手',desc:'达到10000分',icon:'👑',reward:{gold:400,diamond:15},check:s=>s.playerMaxScore>=10000},
    {id:'score_20000',name:'独占鳌头',desc:'达到20000分',icon:'🥇',reward:{gold:600,diamond:25},check:s=>s.playerMaxScore>=20000},
    {id:'score_35000',name:'超凡入圣',desc:'达到35000分',icon:'💎',reward:{gold:800,diamond:35},check:s=>s.playerMaxScore>=35000},
    {id:'score_50000',name:'登峰造极',desc:'达到50000分',icon:'👑',reward:{gold:1000,diamond:50},check:s=>s.playerMaxScore>=50000},
    {id:'first_line',name:'破零',desc:'消除第一行',icon:'📐',reward:{gold:30,diamond:0},check:s=>s.playerLines>=1},
    {id:'lines_10',name:'十行新手',desc:'累计消除10行',icon:'📏',reward:{gold:80,diamond:2},check:s=>s.playerLines>=10},
    {id:'lines_50',name:'五十行高手',desc:'累计消除50行',icon:'📊',reward:{gold:150,diamond:6},check:s=>s.playerLines>=50},
    {id:'lines_100',name:'百行宗师',desc:'累计消除100行',icon:'💯',reward:{gold:300,diamond:12},check:s=>s.playerLines>=100},
    {id:'lines_200',name:'二百行传奇',desc:'累计消除200行',icon:'🏅',reward:{gold:500,diamond:20},check:s=>s.playerLines>=200},
    {id:'lines_500',name:'五百行神话',desc:'累计消除500行',icon:'🪐',reward:{gold:800,diamond:35},check:s=>s.playerLines>=500},
    {id:'tetris',name:'四消达人',desc:'一次消除4行',icon:'🔥',reward:{gold:100,diamond:5},check:s=>s.tetrisCount>=1},
    {id:'tetris_10',name:'十次四消',desc:'累计10次四消',icon:'💥',reward:{gold:300,diamond:15},check:s=>s.tetrisCount>=10},
    {id:'tetris_30',name:'四消狂魔',desc:'累计30次四消',icon:'⚡',reward:{gold:500,diamond:30},check:s=>s.tetrisCount>=30},
    {id:'first_death',name:'第一次失败',desc:'第一次游戏结束',icon:'💀',reward:{gold:20,diamond:0},check:s=>s.gameOverCount>=1},
    {id:'never_give_up',name:'坚持不懈',desc:'游戏结束10次',icon:'💪',reward:{gold:60,diamond:2},check:s=>s.gameOverCount>=10},
    {id:'game_over_50',name:'百折不挠',desc:'游戏结束50次',icon:'🛡️',reward:{gold:150,diamond:5},check:s=>s.gameOverCount>=50},
    {id:'fast_clear',name:'闪电开局',desc:'开局15秒内消除一行',icon:'⚡',reward:{gold:100,diamond:4},check:s=>s.fastClear},
    {id:'drop_master',name:'一落千丈',desc:'硬降累计超过100格',icon:'⬇️',reward:{gold:100,diamond:3},check:s=>s.totalDrops>=100},
    {id:'drop_500',name:'从天而降',desc:'硬降累计超过500格',icon:'🌊',reward:{gold:200,diamond:8},check:s=>s.totalDrops>=500},
    {id:'rotate_50',name:'旋转高手',desc:'累计旋转50次',icon:'🔄',reward:{gold:80,diamond:3},check:s=>s.playerRotations>=50},
    {id:'rotate_200',name:'陀螺大师',desc:'累计旋转200次',icon:'🌀',reward:{gold:200,diamond:8},check:s=>s.playerRotations>=200},
    {id:'rotate_500',name:'风车成精',desc:'累计旋转500次',icon:'🎡',reward:{gold:400,diamond:18},check:s=>s.playerRotations>=500},
    {id:'speed_demon',name:'急速下降',desc:'达到等级10',icon:'💨',reward:{gold:150,diamond:5},check:s=>s.maxLevel>=10},
    {id:'max_level_20',name:'光速反应',desc:'达到等级20',icon:'🚀',reward:{gold:300,diamond:12},check:s=>s.maxLevel>=20},
    {id:'stage_5',name:'通关达人',desc:'通过第5关',icon:'🎯',reward:{gold:150,diamond:6},check:s=>s.maxStage>=5},
    {id:'stage_10',name:'无尽挑战',desc:'通过第10关',icon:'♾️',reward:{gold:400,diamond:18},check:s=>s.maxStage>=10},
    {id:'stage_20',name:'突破极限',desc:'通过第20关',icon:'🌌',reward:{gold:700,diamond:35},check:s=>s.maxStage>=20},
    {id:'ai_slayer',name:'AI克星',desc:'在AI模式中战胜电脑',icon:'🤖',reward:{gold:100,diamond:6},check:s=>s.aiWins>=1},
    {id:'ai_10_wins',name:'AI终结者',desc:'在AI模式中战胜电脑10次',icon:'⚔️',reward:{gold:400,diamond:18},check:s=>s.aiWins>=10},
    {id:'pvp_winner',name:'双冠王',desc:'在双人模式中获胜',icon:'👥',reward:{gold:100,diamond:6},check:s=>s.pvpWins>=1},
    {id:'pvp_10_wins',name:'对战大师',desc:'在双人模式中获胜10次',icon:'🏟️',reward:{gold:400,diamond:18},check:s=>s.pvpWins>=10},
    {id:'build_10',name:'建筑新手',desc:'建造模式完成10个挑战',icon:'🧱',reward:{gold:200,diamond:10},check:s=>s._buildCount>=10},
    {id:'build_50',name:'建筑大师',desc:'建造模式完成50个挑战',icon:'🏗️',reward:{gold:600,diamond:28},check:s=>s._buildCount>=50},
    {id:'all_pieces',name:'全能选手',desc:'一局内使用过全部7种方块',icon:'🌈',reward:{gold:200,diamond:10},check:s=>s._allPieces},
    {id:'perfectionist',name:'完美主义者',desc:'挑战模式0失败通关',icon:'✨',reward:{gold:400,diamond:20},check:s=>s._perfectChallenge},
    {id:'all_clear',name:'完美收官',desc:'解锁全部成就',icon:'🏰',reward:{gold:2000,diamond:120},check:s=>s._allUnlocked}
];

let gameStats = {
    playerMaxScore:0, playerLines:0, playerRotations:0, totalDrops:0,
    tetrisCount:0, gameOverCount:0, maxStage:0, maxLevel:0,
    fastClear:false, aiWins:0, pvpWins:0,
    _gameStartTime:0, _firstLineCleared:false, _lastLines:0,
    _gameOverTracked:false, _allUnlocked:false, _buildCount:0,
    _allPieces:false, _perfectChallenge:false, _achievementTimer:0
};

const unlockedAchievements = new Set();
const newAchievements = new Set();

// 记录成就面板打开前游戏是否正在运行，用于关闭面板时恢复
let _achievementPauseState = false;

async function loadAchievements(){
    unlockedAchievements.clear(); newAchievements.clear();
    Object.assign(gameStats, {
        playerMaxScore:0, playerLines:0, playerRotations:0, totalDrops:0,
        tetrisCount:0, gameOverCount:0, maxStage:0, maxLevel:0,
        fastClear:false, aiWins:0, pvpWins:0,
        _gameStartTime:0, _firstLineCleared:false, _lastLines:0,
        _gameOverTracked:false, _allUnlocked:false, _buildCount:0,
        _allPieces:false, _perfectChallenge:false
    });
    try {
        const d = await window.nativeAPI.dbGet(getStorageKey('achievements'));
        if(!d) return;
        if(d.unlocked && Array.isArray(d.unlocked)) d.unlocked.forEach(id => { if(typeof id === 'string') unlockedAchievements.add(id); });
        if(d.newIds && Array.isArray(d.newIds)) d.newIds.forEach(id => { if(typeof id === 'string') newAchievements.add(id); });
        if(d.stats && typeof d.stats === 'object'){
            const ks = {playerMaxScore:0, playerLines:0, playerRotations:0, totalDrops:0, tetrisCount:0, gameOverCount:0, maxStage:0, maxLevel:0, fastClear:false, aiWins:0, pvpWins:0, _buildCount:0, _allPieces:false, _perfectChallenge:false};
            for(const k of Object.keys(ks)) if(d.stats[k] !== undefined) gameStats[k] = d.stats[k];
        }
    } catch(e){
        unlockedAchievements.clear(); newAchievements.clear();
        Object.assign(gameStats, {playerMaxScore:0,playerLines:0,playerRotations:0,totalDrops:0,tetrisCount:0,gameOverCount:0,maxStage:0,maxLevel:0,fastClear:false,aiWins:0,pvpWins:0,_gameStartTime:0,_firstLineCleared:false,_lastLines:0,_gameOverTracked:false});
    }
}

async function saveAchievements(){
    try {
        await window.nativeAPI.dbSet(getStorageKey('achievements'), {
            unlocked: [...unlockedAchievements], newIds: [...newAchievements],
            stats: {
                playerMaxScore: gameStats.playerMaxScore, playerLines: gameStats.playerLines,
                playerRotations: gameStats.playerRotations, totalDrops: gameStats.totalDrops,
                tetrisCount: gameStats.tetrisCount, gameOverCount: gameStats.gameOverCount,
                maxStage: gameStats.maxStage, maxLevel: gameStats.maxLevel,
                fastClear: gameStats.fastClear, aiWins: gameStats.aiWins, pvpWins: gameStats.pvpWins,
                _buildCount: gameStats._buildCount, _allPieces: gameStats._allPieces,
                _perfectChallenge: gameStats._perfectChallenge
            }
        });
    } catch(e){}
}

async function checkAchievements(){
    if(unlockedAchievements.size >= ACHIEVEMENTS.length - 1 && !unlockedAchievements.has('all_clear')) gameStats._allUnlocked = true;
    let any = false;
    for(const a of ACHIEVEMENTS){
        if(unlockedAchievements.has(a.id)) continue;
        if(a.check(gameStats)){
            unlockedAchievements.add(a.id); newAchievements.add(a.id); any = true;
            playSfx('achievement');
            if(a.reward){
                if(a.reward.gold > 0) shopCurrency.gold += a.reward.gold;
                if(a.reward.diamond > 0) shopCurrency.diamond += a.reward.diamond;
                await saveShopData(); updateShopCurrencyUI();
            }
            showAchievementNotification(a);
        }
    }
    if(any){ await saveAchievements(); updateAchievementBadge(); }
}

function showAchievementNotification(ach){
    const el = document.getElementById('achievementNotif');
    if(!el) return;
    el.querySelector('.notif-icon').textContent = ach.icon;
    el.querySelector('.notif-name').textContent = ach.name;
    el.querySelector('.notif-desc').textContent = ach.desc;
    const r = document.getElementById('notifReward');
    if(r){
        const p = [];
        if(ach.reward.gold > 0) p.push('🪙 +' + ach.reward.gold);
        if(ach.reward.diamond > 0) p.push('💎 +' + ach.reward.diamond);
        r.textContent = p.join('  '); r.style.display = p.length ? '' : 'none';
    }
    el.classList.add('show');
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.classList.remove('show'), 4000);
}

function updateAchievementBadge(){
    const badges = document.querySelectorAll('.achievement-btn .badge, #coopAchievementBtn .badge');
    badges.forEach(b => {
        if(!b) return;
        if(newAchievements.size > 0){ b.textContent = '' + newAchievements.size; b.classList.remove('hidden'); }
        else b.classList.add('hidden');
    });
}

function renderAchievementPanel(){
    const l = document.getElementById('achievementList');
    if(!l) return;
    l.innerHTML = ACHIEVEMENTS.map(a => {
        const u = unlockedAchievements.has(a.id), n = newAchievements.has(a.id), rp = [];
        if(a.reward.gold > 0) rp.push('🪙' + a.reward.gold);
        if(a.reward.diamond > 0) rp.push('💎' + a.reward.diamond);
        const rs = rp.length ? '<span class="ach-reward">' + rp.join(' ') + '</span>' : '';
        return '<div class="achievement-item' + (u ? '' : ' locked') + (n ? ' new' : '') + '"><div class="icon">' + a.icon + '</div><div class="info"><div class="name">' + a.name + ' ' + rs + '</div><div class="desc">' + a.desc + '</div></div><div class="status">' + (u ? '✅' : '🔒') + '</div></div>';
    }).join('');
    const u = unlockedAchievements.size;
    document.getElementById('achievementProgress').textContent = '成就 ' + u + '/' + ACHIEVEMENTS.length;
}

async function toggleAchievementPanel(){
    const p = document.getElementById('achievementPanel');
    const bp = document.getElementById('achievementBackdrop');
    if(!p) return;
    const s = p.classList.contains('show');
    if(!s){
        // ---- 打开成就面板 ----
        // 如果游戏正在进行且未结束，保存运行状态并暂停游戏
        if (gameStarted && !playerGame.gameOver && !aiGame.gameOver) {
            _achievementPauseState = running;
            if (running) {
                running = false;
                playerGame.paused = true;
                aiGame.paused = true;
                if (loopManager) loopManager.setPaused(true);
                // 显示暂停覆盖层
                if(gameMode === 'coop') coopRenderer.showOverlay('<h2 style="font-size:34px;">⏸</h2><p>已暂停</p>', '');
                else {
                    playerRenderer.showOverlay('playerOverlay', '<h2 style="font-size:34px;">⏸</h2><p>已暂停</p>', '');
                    aiRenderer.showOverlay('aiOverlay', '<h2 style="font-size:34px;">⏸</h2><p>已暂停</p>', '');
                }
            }
        } else {
            _achievementPauseState = false;
        }

        newAchievements.clear(); updateAchievementBadge(); renderAchievementPanel();
        await saveAchievements(); p.classList.add('show');
        if(bp) bp.classList.add('show');
    } else {
        // ---- 关闭成就面板 ----
        // 如果之前游戏正在运行，恢复游戏
        if (_achievementPauseState) {
            running = true;
            playerGame.paused = false;
            aiGame.paused = false;
            if (loopManager) loopManager.setPaused(false);
            playerGame.lastTime = performance.now();
            aiGame.lastTime = performance.now();
            animFrameId = requestAnimationFrame(gameLoop);
            // 隐藏暂停覆盖层
            if(gameMode === 'coop') coopRenderer.hideOverlay();
            else {
                playerRenderer.hideOverlay('playerOverlay');
                aiRenderer.hideOverlay('aiOverlay');
            }
        }
        _achievementPauseState = false;

        p.classList.remove('show');
        if(bp) bp.classList.remove('show');
    }
}

function renderBlockStatsHTML(st){
    if(!st) return '';
    const names = Object.keys(st).filter(k => st[k] > 0);
    if(names.length === 0) return '';
    const total = names.reduce((s, k) => s + st[k], 0), max = Math.max(...names.map(k => st[k]));
    return '<div class="block-stats"><div class="block-stats-title">🧱 消除方块统计 · 总计 ' + total + ' 块</div>' + names.map(n => {
        const cnt = st[n], pct = max > 0 ? cnt / max * 100 : 0, color = COLORS[n] || '#888';
        return '<div class="block-stats-row">' + renderMiniShape(n) + '<span class="block-stats-name">' + n + '</span><div class="block-stats-bar-bg"><div class="block-stats-bar" style="width:' + pct + '%;background:' + color + '"></div></div><span class="block-stats-count">' + cnt + '</span></div>';
    }).join('') + '</div>';
}

function renderMiniShape(n){
    const s = SHAPES[n];
    if(!s || !s[0]) return '';
    const c = COLORS[n] || '#888', cols = s[0].length;
    return '<div style="display:inline-grid;grid-template-columns:repeat(' + cols + ',7px);gap:0;vertical-align:middle;margin-right:6px;">' +
        s.map(r => r.map(cell => cell ? '<div style="width:7px;height:7px;background:' + c + ';border-radius:1px;margin:0.5px;"></div>' : '<div style="width:7px;height:7px;margin:0.5px;"></div>').join('')).join('') + '</div>';
}