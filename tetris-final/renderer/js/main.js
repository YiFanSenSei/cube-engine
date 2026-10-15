// ===== 游戏入口 - 初始化和事件绑定 =====
'use strict';

// Load decor blocks
const THEME_ACCENT_RGB = {
    classic:{r:255,g:215,b:0},ocean:{r:0,g:229,b:255},
    forest:{r:0,g:200,b:83},
    midnight:{r:156,g:39,b:176},
    pink:{r:255,g:182,b:193}
};
let _decorBlocksEls = [];
function rgbToHSL(r,g,b){
    r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b);let h,s,l=(max+min)/2;
    if(max===min){h=0;s=0}else{const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;case b:h=((r-g)/d+4)/6;break}}
    return{h:h*360,s:s*100,l:l*100};
}
function refreshDecorBlocks(forceAccount){
    _decorBlocksEls.forEach(e=>{if(e.parentNode)e.parentNode.removeChild(e)});_decorBlocksEls=[];
    // 检测账户选择界面是否可见
    const accountOverlay=document.getElementById('accountOverlay');
    const isAccountVisible = (accountOverlay && !accountOverlay.classList.contains('hidden')) || forceAccount;
    const pal=[];
    if(isAccountVisible){
        // ---- 账户选择界面：黑白灰 + 底部 + 无交互 + 大小极端差异 ----
        const isLight=document.body.getAttribute('data-brightness')==='light';
        if(isLight){
            for(let i=0;i<100;i++){const l=30+Math.random()*45,s=0+(Math.random()-0.5)*10;pal.push('hsl(260, '+Math.max(0,s)+'%, '+l+'%)')}
        } else {
            for(let i=0;i<100;i++){const l=20+Math.random()*50,s=0+(Math.random()-0.5)*10;pal.push('hsl(260, '+Math.max(0,s)+'%, '+l+'%)')}
        }
        const ra=()=>(Math.random()-0.5)*100;let blocks=[];
        // 水平位置使用幂次分布：从左至右概率递增（右侧出现概率更高）
        const weightedLeft = () => Math.pow(Math.random(), 0.7) * 100;
        for(let i=0;i<60;i++){const s=10+Math.random()*290;const topBias=Math.random();const t=50+(1-topBias*topBias)*50;blocks.push({l:weightedLeft(),t:t,w:s,h:s,a:ra(),o:0.05+Math.random()*0.25})}
        // 规则：最大的方块必须生成在屏幕的右三分之一区域（left > 66.67%）
        const maxSize = Math.max(...blocks.map(b => b.w));
        blocks.forEach(b => { if(b.w === maxSize) b.l = 66.67 + Math.random() * 33.33; });
        blocks.forEach((b,i)=>{const d=document.createElement('div'),c=pal[i%pal.length],br=b.a;const initOpacity = forceAccount ? '0' : b.o;d.style.cssText='position:fixed;left:'+b.l+'%;top:'+b.t+'%;width:'+b.w+'px;height:'+b.h+'px;border-radius:'+(1+Math.random()*4)+'px;background:'+c+';pointer-events:none;z-index:550;opacity:'+initOpacity+';transform:rotate('+br+'deg);box-shadow:0 0 '+(2+Math.random()*12)+'px rgba(0,0,0,0.1);';d.__decorOrigOpacity = b.o;d.__decorOrigTransform = 'rotate('+br+'deg)';document.body.appendChild(d);_decorBlocksEls.push(d)});
    } else {
        // ---- 其他界面：恢复原始全屏+鼠标交互行为 ----
        const id=currentTheme||'classic',a=THEME_ACCENT_RGB[id]||THEME_ACCENT_RGB.classic,base=rgbToHSL(a.r,a.g,a.b);
        for(let i=0;i<60;i++){const h=base.h+(Math.random()-0.5)*28,s=Math.min(95,Math.max(45,base.s+(Math.random()-0.5)*40)),l=Math.min(82,Math.max(22,base.l+(Math.random()-0.5)*45));pal.push('hsl('+h+', '+s+'%, '+l+'%)')}
        const rs=()=>4+Math.random()*44,ra=()=>(Math.random()-0.5)*100,ro=()=>0.15+Math.random()*0.4;let blocks=[];
        for(let i=0;i<18;i++){const s=rs();blocks.push({l:Math.random()*100,t:-3+Math.random()*9,w:s,h:s,a:ra(),o:ro()})}
        for(let i=0;i<18;i++){const s=rs();blocks.push({l:Math.random()*100,t:94+Math.random()*9,w:s,h:s,a:ra(),o:ro()})}
        for(let i=0;i<14;i++){const s=rs();blocks.push({l:-4+Math.random()*7,t:Math.random()*100,w:s,h:s,a:ra(),o:ro()})}
        for(let i=0;i<14;i++){const s=rs();blocks.push({l:97+Math.random()*7,t:Math.random()*100,w:s,h:s,a:ra(),o:ro()})}
        for(let i=0;i<6;i++){const s=20+Math.random()*28;blocks.push({l:(i%2===0?-3:96)+Math.random()*5,t:(i<3?-3:94)+Math.random()*5,w:s,h:s,a:ra(),o:0.1+Math.random()*0.25})}
        const bd=[];blocks.forEach((b,i)=>{const d=document.createElement('div'),c=pal[i%pal.length],br=b.a,raA=12+Math.random()*16,sa=0.4+Math.random()*0.6,er=(Math.random()-0.5)*50,tm=200+Math.random()*200;d.style.cssText='position:fixed;left:'+b.l+'%;top:'+b.t+'%;width:'+b.w+'px;height:'+b.h+'px;border-radius:'+(1+Math.random()*4)+'px;background:'+c+';pointer-events:none;z-index:550;opacity:'+b.o+';transform:rotate('+br+'deg);box-shadow:0 0 '+(2+Math.random()*8)+'px rgba(0,0,0,0.12);transition:transform '+tm+'ms cubic-bezier(0.34,1.56,0.64,1), opacity '+(tm*0.6)+'ms ease, box-shadow '+tm+'ms ease;';document.body.appendChild(d);_decorBlocksEls.push(d);bd.push({el:d,l:b.l,t:b.t,w:b.w,h:b.h,baseO:b.o,baseRotate:br,riseAmp:raA,scaleAmp:sa,extraRotAmp:er})});
        let mx=-9999,my=-9999,rf=null;
        function ur(){const vw=window.innerWidth,vh=window.innerHeight,radius=120+Math.random()*40;bd.forEach(b=>{const cx=vw*b.l/100+b.w/2,cy=vh*b.t/100+b.h/2,dx=cx-mx,dy=cy-my,dist=Math.sqrt(dx*dx+dy*dy);if(dist<radius){const intensity=1-(dist/radius),ii=intensity*intensity,rise=-b.riseAmp*ii,scale=1+b.scaleAmp*ii,rot=b.baseRotate+b.extraRotAmp*ii,op=Math.min(1,b.baseO+0.35*ii);b.el.style.transform='translateY('+rise+'px) scale('+scale+') rotate('+rot+'deg)';b.el.style.opacity=op;b.el.style.boxShadow='0 '+(-rise+6)+'px '+(8+ii*12)+'px rgba(0,0,0,0.18)';b.el.style.zIndex='551'}else{b.el.style.transform='rotate('+b.baseRotate+'deg)';b.el.style.opacity=b.baseO;b.el.style.boxShadow='0 0 '+(2+Math.random()*8)+'px rgba(0,0,0,0.12)';b.el.style.zIndex='550'}})}
        document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;if(rf)cancelAnimationFrame(rf);rf=requestAnimationFrame(ur)});
        document.addEventListener('mouseleave',function(){bd.forEach(b=>{b.el.style.transform='rotate('+b.baseRotate+'deg)';b.el.style.opacity=b.baseO;b.el.style.boxShadow='0 0 '+(2+Math.random()*8)+'px rgba(0,0,0,0.12)';b.el.style.zIndex='550'})});
    }
}

// 注册所有方块皮肤
registerAllSkins();

// 创建渲染器
const playerRenderer = new Renderer('playerCanvas', 'playerNext', playerGame);
const aiRenderer = new Renderer('aiCanvas', 'aiNext', aiGame);
const coopRenderer = new CoopRenderer('coopCanvas', 'coopNextP1', 'coopNextP2', playerGame, aiGame);

// 初始化呼吸特效系统（默认绑定单人模式）
breathEffect.setMode('single', playerGame, aiGame);
window.addEventListener('resize', () => breathEffect.handleResize());

// 创建游戏主循环管理器
loopManager = new GameLoopManager();

// 初始化事件驱动特效监听器
setupEffectListeners();

// Event listeners - Buttons
document.getElementById('btnStart').addEventListener('click', () => { playSfx('click'); startGame(); });
document.getElementById('btnPause').addEventListener('click', () => { playSfx('click'); togglePause(); });
document.getElementById('modeSingle').addEventListener('click', () => { playSfx('click'); setMode('single'); });
document.getElementById('modeAi').addEventListener('click', () => { playSfx('click'); setMode('ai'); });
document.getElementById('modePvp').addEventListener('click', () => { playSfx('click'); setMode('pvp'); });
document.getElementById('modeCoop').addEventListener('click', () => { playSfx('click'); setMode('coop'); });

document.querySelectorAll('.diff-btn').forEach(b => b.addEventListener('click', () => {
    playSfx('click');
    document.querySelectorAll('.diff-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    aiDifficulty = b.dataset.diff;
    aiGame.difficulty = aiDifficulty;
    if(window.nativeAPI) window.nativeAPI.setDifficulty({game:'ai', difficulty: aiDifficulty});
}));
aiGame.difficulty = aiDifficulty;
updateModeUI();

// Initial overlays
if(gameMode === 'single') playerRenderer.showOverlay('playerOverlay', '<h2 style="font-size:22px;font-weight:300;">🎯 闯关模式</h2><p style="margin-top:6px;">达成分数即可通关！</p>', '');
else if(gameMode === 'coop') coopRenderer.showOverlay('<h2 style="font-size:22px;font-weight:300;">🤝 双人合作</h2><p style="margin-top:6px;">按「开始游戏」各控制一半</p>', '');
else playerRenderer.showOverlay('playerOverlay', '<h2 style="font-size:22px;font-weight:300;">🎮</h2><p style="margin-top:6px;">按「开始游戏」</p>', '');
aiRenderer.showOverlay('aiOverlay', '<h2 style="font-size:22px;font-weight:300;">🤖</h2><p style="margin-top:6px;">等待开始</p>', '');
playerRenderer.render(); aiRenderer.render(); coopRenderer.render(); updateUI();

loadAchievements(); updateAchievementBadge(); renderAchievementPanel(); updateUI();

// Menu events
document.querySelectorAll('.menu-btn').forEach(b => b.addEventListener('click', () => {
    playSfx('click');
    menuMode = b.dataset.menuMode;
    document.querySelectorAll('.menu-btn').forEach(x => x.classList.remove('active-mode'));
    b.classList.add('active-mode');
    document.getElementById('menuSubDifficulty').classList.toggle('show', menuMode === 'ai');
}));
document.querySelectorAll('.menu-diff-btn').forEach(b => b.addEventListener('click', () => {
    playSfx('click');
    document.querySelectorAll('.menu-diff-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    aiDifficulty = b.dataset.diff;
    aiGame.difficulty = aiDifficulty;
}));

document.getElementById('menuStartBtn').addEventListener('click', () => {
    playSfx('click');
    gameMode = menuMode;
        document.getElementById('menuOverlay').classList.add('hidden');
        document.getElementById('accountOverlay').classList.add('hidden');
    if(gameStarted){ running = false; playerGame.gameOver = true; aiGame.gameOver = true; }
    updateModeUI(); updateGameUI(); startGame();
});
document.getElementById('menuSettingsBtn').addEventListener('click', () => {
    playSfx('click');
    document.getElementById('settingsAccountName').textContent = getCurrentUser() || '游客';
    renderKeyBindingsUI();
    renderMySkins();
    // 重置设置面板滚动位置到顶部
    const panelBody = document.querySelector('.settings-panel .panel-body');
    if (panelBody) panelBody.scrollTop = 0;
    document.getElementById('settingsPanel').classList.add('show');
    document.getElementById('settingsBackdrop').classList.add('show');
});
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        playSfx('click');
        document.getElementById('settingsPanel').classList.remove('show');
        document.getElementById('settingsBackdrop').classList.remove('show');
        document.getElementById('inGameActions').classList.add('hidden');
        if(animFrameId){ cancelAnimationFrame(animFrameId); animFrameId = null; }
        if(challengeTimerInterval){ clearInterval(challengeTimerInterval); challengeTimerInterval = null; }
        if(loopManager) loopManager.destroy();
        // 隐藏游戏中的暂停覆盖层
        if(gameMode === 'coop') {
            if(typeof coopRenderer !== 'undefined') coopRenderer.hideOverlay();
        } else {
            if(typeof playerRenderer !== 'undefined') playerRenderer.hideOverlay('playerOverlay');
            if(typeof aiRenderer !== 'undefined') aiRenderer.hideOverlay('aiOverlay');
        }
        running = false; gameStarted = false; isReplayMode = false;
        // 重置所有游戏状态
        playerGame.reset(); aiGame.reset();
        document.getElementById('btnStart').textContent = '开始游戏';
        document.getElementById('btnPause').disabled = true;
        document.getElementById('btnPause').textContent = '暂停';
        document.getElementById('challengeTimer').classList.remove('show');
        document.getElementById('buildChallenge').classList.remove('show');
        playerGame.buildMode = false;
        // 重置游戏模式UI到初始状态
        setCurrentUser('');
        document.getElementById('menuOverlay').classList.add('hidden');
        // animateAccountEntrance() 会全权管理可见性和装饰方块刷新
        await renderAccountSelection();
        if (typeof animateAccountEntrance === 'function') animateAccountEntrance();
        updateGameUI();
        updateModeUI();
        playerRenderer.render(); aiRenderer.render();
    } catch(e) {
        console.error('[logout] 退出账户失败:', e, e.stack);
    }
});
document.getElementById('menuLeaderboardBtn').addEventListener('click', () => { playSfx('click'); renderLeaderboard(); document.getElementById('leaderboardOverlay').classList.add('show'); });
document.getElementById('menuAchievementBtn').addEventListener('click', () => { playSfx('click'); toggleAchievementPanel(); });
document.getElementById('accountCreateNewBtn').addEventListener('click', async () => {
    const i = document.getElementById('accountNewName'), n = i.value.trim();
    if(!n) return;
    const users = await getUsers();
    if(users.includes(n)){
        i.style.borderColor = '#ff6b6b';
        i.placeholder = '⚠️ 账户已存在，请换个名字';
        i.value = '';
        i.focus();
        return;
    }
    i.value = '';
    // 只创建账号，不自动切换
    const newUsers = await getUsers();
    if (!newUsers.includes(n)) {
        newUsers.push(n);
        await saveUsers(newUsers);
    }
    await renderAccountSelection();
});
document.getElementById('accountNewName').addEventListener('input', function() {
    this.style.borderColor = '';
    this.placeholder = '输入新昵称创建账户...';
});
document.getElementById('accountNewName').addEventListener('keydown', e => { if(e.code === 'Enter') document.getElementById('accountCreateNewBtn').click(); });
document.getElementById('settingsCloseBtn').addEventListener('click', () => { 
    capturingActionId = null; 
    // 游戏中关闭设置面板要恢复游戏
    if (gameStarted) {
        closeInGameSettings();
    } else {
        document.getElementById('settingsPanel').classList.remove('show'); 
        document.getElementById('settingsBackdrop').classList.remove('show');
        document.getElementById('inGameActions').classList.add('hidden');
    }
});
document.getElementById('settingsBackdrop').addEventListener('click', () => { 
    capturingActionId = null; 
    // 游戏中关闭设置面板要恢复游戏
    if (gameStarted) {
        closeInGameSettings();
    } else {
        document.getElementById('settingsPanel').classList.remove('show'); 
        document.getElementById('settingsBackdrop').classList.remove('show');
        document.getElementById('inGameActions').classList.add('hidden');
    }
});
// 亮度切换 - 推拉开关（设置面板）
document.getElementById('brightnessSwitch').addEventListener('click', () => {
    playSfx('click');
    const newMode = brightnessMode === 'dark' ? 'light' : 'dark';
    setBrightnessMode(newMode);
    // 刷新装饰方块以匹配新的亮暗色（账户界面版由 accBrightnessSwitch 处理）
    if (typeof refreshDecorBlocks === 'function') refreshDecorBlocks();
});
// 亮度切换 - 推拉开关（账户选择界面）
document.getElementById('accBrightnessSwitch').addEventListener('click', () => {
    playSfx('click');
    const newMode = brightnessMode === 'dark' ? 'light' : 'dark';
    setBrightnessMode(newMode);
    // 刷新装饰方块以匹配新的亮暗色
    if (typeof refreshDecorBlocks === 'function') refreshDecorBlocks();
});
// 皮肤标签页点击（设置面板内嵌版）
document.querySelectorAll('.my-skins-tab').forEach(b => b.addEventListener('click', () => {
    playSfx('click');
    document.querySelectorAll('.my-skins-tab').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    mySkinsTab = b.dataset.myskinsTab;
    renderMySkins();
}));
document.getElementById('keyResetBtn').addEventListener('click', () => {
    playSfx('click'); resetKeyBindings();
    const b = document.getElementById('keyResetBtn'); b.textContent = '✓ 已重置';
    setTimeout(() => { b.textContent = '重置默认'; }, 1500);
});
document.getElementById('sfxVolume').addEventListener('input', function(){
    audioSettings.sfxVolume = this.value / 100;
    document.getElementById('sfxVolDisplay').textContent = this.value + '%';
});
document.getElementById('lbCloseBtn').addEventListener('click', () => document.getElementById('leaderboardOverlay').classList.remove('show'));
document.getElementById('lbBackdrop').addEventListener('click', () => document.getElementById('leaderboardOverlay').classList.remove('show'));

// 侧边栏成就按钮（替代旧浮动按钮）
document.getElementById('achievementBtn').addEventListener('click', toggleAchievementPanel);
document.getElementById('coopAchievementBtn').addEventListener('click', toggleAchievementPanel);
document.getElementById('achievCloseBtn').addEventListener('click', toggleAchievementPanel);
document.getElementById('achievementBackdrop').addEventListener('click', toggleAchievementPanel);

// 侧边栏设置按钮 - 打开游戏内设置面板
document.getElementById('settingsBtn').addEventListener('click', () => {
    playSfx('click');
    openInGameSettings();
});
document.getElementById('coopSettingsBtn').addEventListener('click', () => {
    playSfx('click');
    openInGameSettings();
});

let settingsToggleState = false; // false = 初始（显示到b），true = 切换到a

// 平滑滚动动画函数
function smoothScrollTo(element, targetScrollTop, duration = 250) {
    const start = element.scrollTop;
    const distance = targetScrollTop - start;
    const startTime = performance.now();
    
    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeInOutQuad 缓动函数：先加速后减速
        const ease = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        element.scrollTop = start + distance * ease;
        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }
    requestAnimationFrame(step);
}

// 齿轮切换按钮 - 在a（游戏操作区可见）和初始状态之间切换
document.getElementById('inGameToggleBtn').addEventListener('click', () => {
    playSfx('click');
    const panelBody = document.querySelector('.settings-panel .panel-body');
    if (!panelBody) return;
    
    settingsToggleState = !settingsToggleState;
    
    if (settingsToggleState) {
        // 切换到"a"状态：滚动使a位置到达可见区域顶部
        const aSpacer = document.querySelector('.in-game-spacer-a');
        if (aSpacer) {
            const panelRect = panelBody.getBoundingClientRect();
            const aRect = aSpacer.getBoundingClientRect();
            const target = aRect.top - panelRect.top + panelBody.scrollTop;
            smoothScrollTo(panelBody, target, 250);
        }
    } else {
        // 回到初始状态：滚动到顶部
        smoothScrollTo(panelBody, 0, 250);
    }
});

// 游戏内设置面板中的按钮
// "回到游戏" - 关闭设置面板，恢复游戏
document.getElementById('inGameResumeBtn').addEventListener('click', () => {
    playSfx('click');
    closeInGameSettings();
});
document.getElementById('inGameRestartBtn').addEventListener('click', () => {
    playSfx('click');
    // 关闭设置面板
    closeInGameSettings();
    // 重新开始游戏
    startGame();
});
document.getElementById('inGameBackMenuBtn').addEventListener('click', () => {
    playSfx('click');
    // 关闭设置面板
    document.getElementById('settingsPanel').classList.remove('show');
    document.getElementById('settingsBackdrop').classList.remove('show');
    document.getElementById('inGameActions').classList.add('hidden');
    // 返回菜单（同旧 gtBackBtn 逻辑）
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
});

document.getElementById('shopCloseBtn').addEventListener('click', toggleShopPanel);
document.getElementById('shopBackdrop').addEventListener('click', toggleShopPanel);
document.getElementById('menuShopBtn').addEventListener('click', () => { playSfx('click'); toggleShopPanel(); });
document.getElementById('shopItems').addEventListener('click', handleShopAction);
document.querySelectorAll('.shop-tab').forEach(b => b.addEventListener('click', () => {
    playSfx('click');
    document.querySelectorAll('.shop-tab').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    shopTab = b.dataset.shopTab;
    renderShopItems();
}));

// Load data (async startup)
(async function startup(){
    try {
        await loadCurrentUser();
        await loadTheme();
        await loadKeyBindings();
        // Shop data must load after currentUser is set, or getStorageKey() returns wrong key
        await loadShopData();
        updateShopCurrencyUI();
        // Load custom skin data (user uploaded image)
        try {
            const savedSkin = await window.nativeAPI.dbGet(getStorageKey('custom_skin'));
            if(savedSkin && typeof savedSkin === 'string') customSkinDataUrl = savedSkin;
        } catch(e){}
        // Load custom background
        try {
            const savedBg = await window.nativeAPI.dbGet(getStorageKey('custom_bg'));
            if(savedBg && typeof savedBg === 'string') {
                customBgDataUrl = savedBg;
                applyCustomBg(savedBg);
            }
        } catch(e){}
        applyBlockSkin(equippedItems.block || 'classic');
        applyTheme(equippedItems.ui || 'classic');
        updateBrightnessToggleUI();
        updateGameUI(); updateModeUI();

        // Splash screen
        const splashOverlay = document.getElementById('splashOverlay');
        if (!splashOverlay) { console.error('[startup] splashOverlay not found!'); return; }
        document.getElementById('menuOverlay').classList.add('hidden');
        document.getElementById('accountOverlay').classList.add('hidden');
        // 在 splash 显示期间完全隐藏游戏棋盘，防止从 splash 背后透出
        const gameWrapper = document.querySelector('.game-wrapper');
        if (gameWrapper) gameWrapper.style.display = 'none';
        // 创建纯黑遮挡层（z-index 在 splash 之下、其他元素之上）
        // 无论 splash 背后透出什么，都被这个遮挡层挡住
        const blocker = document.createElement('div');
        blocker.id = '_startupBlocker';
        blocker.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:49999;background:#0a0a1a;pointer-events:none;';
        document.body.appendChild(blocker);
        
        setTimeout(() => {
            // 瞬间隐藏 splash（blocker 仍在，挡住一切）
            splashOverlay.style.transition = 'none';
            splashOverlay.classList.add('hidden');
            splashOverlay.style.display = 'none';
            (async () => {
                await renderAccountSelection();
                // overlay 仍 hidden 时创建 account 版装饰方块并移出屏幕
                if (typeof refreshDecorBlocks === 'function') refreshDecorBlocks(true);
                if (typeof _decorBlocksEls !== 'undefined' && _decorBlocksEls.length > 0) {
                    _decorBlocksEls.forEach(el => {
                        el.style.opacity = '0';
                        const orig = el.style.transform || '';
                        el.__decorOrigTransform = orig;
                        el.style.transform = 'translateY(100vh) ' + orig;
                    });
                }
                // ★ 注意：遮挡层(#_startupBlocker)不在此时移除，交由
                //   animateAccountEntrance() 在账户选择界面 overlay 就绪后移除，
                //   防止自定义背景图在过渡期间闪现
                await new Promise(r => setTimeout(r, 1000));
                if (typeof animateAccountEntrance === 'function') animateAccountEntrance();
            })();
        }, 2000);
    } catch(e) {
        console.error('[startup] 启动失败:', e);
        console.error('[startup] 错误堆栈:', e.stack);
    }
})();

// 初始化游戏小提示
if (typeof initTipCharacter === 'function') {
    // 等待 DOM 和 overlay 准备就绪后初始化
    setTimeout(initTipCharacter, 1200);
}
// 初始化小提示位置
if (typeof initTipPosition === 'function') {
    setTimeout(initTipPosition, 1200);
}

// Initial render
playerGame.reset(); aiGame.reset();
playerRenderer.render(); aiRenderer.render(); updateUI();

// Fullscreen button
(function(){
    const ext = document.querySelector('.menu-extra-btns');
    if(ext){
        const b = document.createElement('button');
        b.className = 'menu-extra-btn'; b.id = 'menuFullscreenBtn'; b.innerHTML = '🖥 全屏';
        b.addEventListener('click', () => { playSfx('click'); toggleFullscreen(); });
        ext.appendChild(b);
    }
})();

// Window resize
window.addEventListener('resize', debounce(adjustGameScale, 150));
setTimeout(adjustGameScale, 100);

// Mouse cursor tracking
document.addEventListener('mousemove', function(e){
    document.body.style.setProperty('--cursor-x', e.clientX + 'px');
    document.body.style.setProperty('--cursor-y', e.clientY + 'px');
});

// Refresh decor blocks（splash 活动期间不执行，由 animateAccountEntrance 全权负责）
const splashEl = document.getElementById('splashOverlay');
if (!splashEl || !splashEl.parentNode || splashEl.classList.contains('hidden')) {
    refreshDecorBlocks();
}

// 记录回放帧：在 gameLoop 中每帧调用
// 新回放系统替换了旧 replay.js

// 初始化回放控制面板（动态创建 DOM）
replayUI.createPanel();

// 初始化滚动渐淡遮罩管理器
// 为所有可滚动面板添加边缘渐淡效果
try {
    const scrollFadeManager = new ScrollFadeManager();
    
    // 添加到应用全局，方便其他模块调用刷新
    window.scrollFadeManager = scrollFadeManager;
    
    // 面板类滚动容器 - 使用 var(--bg-panel) 作为渐变色
    // 延迟初始化以确保 DOM 就绪
    const initScrollFadeTargets = () => {
        scrollFadeManager.addTarget({ selector: '.settings-panel .panel-body' });
        scrollFadeManager.addTarget({ selector: '.achievement-panel .panel-body' });
        scrollFadeManager.addTarget({ selector: '.shop-panel .panel-body' });
        scrollFadeManager.addTarget({ selector: '.leaderboard-panel .panel-body' });
        scrollFadeManager.addTarget({ selector: '.keybind-list', useBodyBg: true });
    };
    
    // 立即初始化已存在的元素
    initScrollFadeTargets();
    
    // 对于动态显示/更新的面板（如商城切换标签页后），需要刷新遮罩状态
    // 用一个 debounced 的刷新函数
    const refreshScrollFade = () => {
        if (window.scrollFadeManager) {
            // 延迟一下让 DOM 先更新完成
            requestAnimationFrame(() => {
                window.scrollFadeManager.refresh();
            });
        }
    };
    window.refreshScrollFade = refreshScrollFade;
    
    console.log('[ScrollFade] 滚动渐淡遮罩已初始化');
} catch(e) {
    console.warn('[ScrollFade] 初始化失败:', e);
}

console.log('[Tetris] 游戏初始化完成 - C++ 引擎驱动');
