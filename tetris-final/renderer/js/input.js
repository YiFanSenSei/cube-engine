// ===== 输入系统 =====
const KEYBIND_ACTIONS = [
    {id:'p1_moveLeft',label:'P1 左移',defaultCode:'KeyA',isP1:true,continuous:true},
    {id:'p1_moveRight',label:'P1 右移',defaultCode:'KeyD',isP1:true,continuous:true},
    {id:'p1_softDrop',label:'P1 软降',defaultCode:'KeyS',isP1:true,continuous:true},
    {id:'p1_rotate',label:'P1 旋转',defaultCode:'KeyW',isP1:true,continuous:false},
    {id:'p1_hardDrop',label:'P1 硬降',defaultCode:'KeyF',isP1:true,continuous:false},
    {id:'pause',label:'暂停（共享）',defaultCode:'KeyP',isP1:true,continuous:false},
    {id:'p2_moveLeft',label:'P2 左移',defaultCode:'ArrowLeft',isP1:false,continuous:true},
    {id:'p2_moveRight',label:'P2 右移',defaultCode:'ArrowRight',isP1:false,continuous:true},
    {id:'p2_softDrop',label:'P2 软降',defaultCode:'ArrowDown',isP1:false,continuous:true},
    {id:'p2_rotate',label:'P2 旋转',defaultCode:'ArrowUp',isP1:false,continuous:false},
    {id:'p2_hardDrop',label:'P2 硬降',defaultCode:'Space',isP1:false,continuous:false}
];

const CODE_DISPLAY_NAMES = {
    ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓',Space:'Space',Escape:'Esc',
    Enter:'Enter',Tab:'Tab',ShiftLeft:'L-Shift',ShiftRight:'R-Shift',
    ControlLeft:'L-Ctrl',ControlRight:'R-Ctrl',AltLeft:'L-Alt',AltRight:'R-Alt',
    MetaLeft:'Win',MetaRight:'Win',Backspace:'BS',Delete:'Del',CapsLock:'Caps',
    Comma:',',Period:'.',Slash:'/',Semicolon:';',Quote:"'",BracketLeft:'[',BracketRight:']',
    Backquote:'`',Backslash:'\\',Minus:'-',Equal:'='
};

let keyBindings = {};
let capturingActionId = null;

const KEY_MAP = [
    {id:'p1_moveLeft',cpp:{method:'move',args:{game:'player',dx:-1,dy:0}},continuous:true,cooldown:80},
    {id:'p1_moveRight',cpp:{method:'move',args:{game:'player',dx:1,dy:0}},continuous:true,cooldown:80},
    {id:'p1_softDrop',cpp:{method:'move',args:{game:'player',dx:0,dy:1}},continuous:true,cooldown:30},
    {id:'p2_moveLeft',cpp:{method:'move',args:{game:'ai',dx:-1,dy:0}},continuous:true,cooldown:80},
    {id:'p2_moveRight',cpp:{method:'move',args:{game:'ai',dx:1,dy:0}},continuous:true,cooldown:80},
    {id:'p2_softDrop',cpp:{method:'move',args:{game:'ai',dx:0,dy:1}},continuous:true,cooldown:30}
];

const keysDown = {};
const keysJustPressed = {};
const keyMoveTimer = {};
const KEY_COOLDOWN_H = 80;
const KEY_COOLDOWN_D = 30;

function codeToDisplay(c){
    return CODE_DISPLAY_NAMES[c] || (c.startsWith('Key') ? c.slice(3) : c.startsWith('Digit') ? c.slice(5) : c.startsWith('Numpad') ? 'Num' + c.slice(6) : (c.startsWith('F') && c.length >= 2 && c.length <= 3) ? c : c);
}

function buildDefaultBindings(){
    const o = {};
    KEYBIND_ACTIONS.forEach(a => o[a.id] = a.defaultCode);
    return o;
}

async function loadKeyBindings(){
    try {
        const d = await window.nativeAPI.dbGet(getStorageKey('keybindings'));
        if(d && typeof d === 'object' && d.bindings && typeof d.bindings === 'object'){
            const defaults = buildDefaultBindings(), m = {};
            for(const id of Object.keys(defaults)) m[id] = d.bindings[id] && typeof d.bindings[id] === 'string' ? d.bindings[id] : defaults[id];
            keyBindings = m;
            return;
        }
    } catch(e){}
    keyBindings = buildDefaultBindings();
}

async function saveKeyBindings(){
    try{ await window.nativeAPI.dbSet(getStorageKey('keybindings'), {version:1,bindings:keyBindings}); } catch(e){}
}

async function resetKeyBindings(){
    keyBindings = buildDefaultBindings();
    await saveKeyBindings();
    renderKeyBindingsUI();
    updateKeyHints();
}

function resolveKeyConflicts(id){
    const nc = keyBindings[id], defaults = buildDefaultBindings();
    for(const [i, c] of Object.entries(keyBindings)){
        if(i === id) continue;
        if(c === nc) keyBindings[i] = defaults[i];
    }
}

function checkKeyConflict(id){
    const c = keyBindings[id];
    return c && Object.entries(keyBindings).some(([i, co]) => i !== id && co === c);
}

function startKeyCapture(id){
    if(capturingActionId) return;
    capturingActionId = id;
    renderKeyBindingsUI();
}

function renderKeyBindingsUI(){
    const c = document.getElementById('keybindList');
    if(!c) return;
    c.innerHTML = KEYBIND_ACTIONS.map(a => {
        const code = keyBindings[a.id] || a.defaultCode, display = codeToDisplay(code),
              cap = capturingActionId === a.id, conf = checkKeyConflict(a.id);
        return `<div class="keybind-row${cap?' capturing':''}${conf?' conflict':''}" data-action="${a.id}"><span class="keybind-label">${a.label}</span><button class="keybind-btn${cap?' capturing':''}${conf?' conflict':''}" data-action="${a.id}"><span class="keybind-key">${cap?'按下...':display}</span>${conf?'<span class="conflict-warn" title="此按键已被其他动作使用">!</span>':''}</button></div>`;
    }).join('');
    c.querySelectorAll('.keybind-btn').forEach(b => b.addEventListener('click', function(e){
        e.stopPropagation();
        if(capturingActionId) return;
        startKeyCapture(this.dataset.action);
    }));
}

function updateKeyHints(){
    if(!keyBindings || !keyBindings.p1_moveLeft) return;
    const m = gameMode;
    const p1L = codeToDisplay(keyBindings.p1_moveLeft), p1R = codeToDisplay(keyBindings.p1_moveRight),
          p1Rot = codeToDisplay(keyBindings.p1_rotate), p1Drop = codeToDisplay(keyBindings.p1_softDrop),
          p1Hard = codeToDisplay(keyBindings.p1_hardDrop), pk = codeToDisplay(keyBindings.pause),
          p2L = codeToDisplay(keyBindings.p2_moveLeft), p2R = codeToDisplay(keyBindings.p2_moveRight),
          p2Rot = codeToDisplay(keyBindings.p2_rotate), p2Drop = codeToDisplay(keyBindings.p2_softDrop),
          p2Hard = codeToDisplay(keyBindings.p2_hardDrop);
    const kh = document.getElementById('keyHints');
    if(m === 'single' || m === 'challenge')
        kh.innerHTML = `<span class="key-hint-group"><kbd>${p1L}</kbd><kbd>${p1R}</kbd>移 <kbd>${p1Rot}</kbd>转 <kbd>${p1Drop}</kbd>降 <kbd>${p1Hard}</kbd>直落</span><span class="key-hint-group"><kbd>${pk}</kbd> 暂停</span>`;
    else if(m === 'build')
        kh.innerHTML = `<span class="key-hint-group"><kbd>${p1L}</kbd><kbd>${p1R}</kbd>移 <kbd>${p1Rot}</kbd>转 <kbd>${p1Drop}</kbd>降 <kbd>${p1Hard}</kbd>直落</span><span class="key-hint-group"><kbd>${pk}</kbd> 暂停 &nbsp;|&nbsp; ⚠️ 消除行会扣分</span>`;
    else if(m === 'pvp' || m === 'coop')
        kh.innerHTML = `<span class="key-hint-group"><span class="label">P1</span><kbd>${p1L}</kbd><kbd>${p1R}</kbd>移 <kbd>${p1Rot}</kbd>转 <kbd>${p1Drop}</kbd>降 <kbd>${p1Hard}</kbd>直落</span><span class="key-hint-group"><span class="label">P2</span><kbd>${p2L}</kbd><kbd>${p2R}</kbd>移 <kbd>${p2Rot}</kbd>转 <kbd>${p2Drop}</kbd>降 <kbd>${p2Hard}</kbd>直落</span><span class="key-hint-group"><kbd>${pk}</kbd> 暂停</span>`;
    else
        kh.innerHTML = `<span class="key-hint-group"><kbd>${p1L}</kbd><kbd>${p1R}</kbd>移 <kbd>${p1Rot}</kbd>转 <kbd>${p1Drop}</kbd>降 <kbd>${p1Hard}</kbd>直落 &nbsp; 左侧画面</span><span class="key-hint-group"><kbd>${pk}</kbd> 暂停</span>`;
}

function processInput(){
    if(!nativeAvailable) return;
    const now = performance.now(), pvp = gameMode === 'pvp', coop = gameMode === 'coop';
    const p1Ok = running && gameStarted && !playerGame.paused && !playerGame.gameOver;
    const p2Ok = running && gameStarted && !aiGame.paused && !aiGame.gameOver && (pvp || coop);
    const B = (id) => keyBindings[id];

    // Continuous actions
    for(const m of KEY_MAP){
        const ok = m.id.startsWith('p1') ? p1Ok : p2Ok, code = B(m.id);
        if(ok && keysDown[code] && (now - (keyMoveTimer[code] || -999)) >= m.cooldown){
            const _p = window.nativeAPI[m.cpp.method](m.cpp.args); _p && _p.catch(e => console.warn('[IPC]', e));
            keyMoveTimer[code] = now;
        }
    }

    // One-shot actions
    const p1R = B('p1_rotate'), p1H = B('p1_hardDrop'), p1SD = B('p1_softDrop'), p2R = B('p2_rotate'), p2H = B('p2_hardDrop'), p2SD = B('p2_softDrop');
    if(p1Ok && keysJustPressed[p1R]){ const _p = window.nativeAPI.rotate({game:'player'}); _p && _p.catch(e => console.warn('[IPC]', e)); gameStats.playerRotations++; playSfx('rotate'); }
    if(p1Ok && keysJustPressed[p1H]){ const _p = window.nativeAPI.hardDrop({game:'player'}); _p && _p.catch(e => console.warn('[IPC]', e)); gameStats.totalDrops++; playSfx('drop'); gameStats._lastDropWasHard = true; }
    if(p1Ok && keysJustPressed[p1SD]){ playSfx('softdrop'); }
    if(p2Ok && keysJustPressed[p2R]){ const _p = window.nativeAPI.rotate({game:'ai'}); _p && _p.catch(e => console.warn('[IPC]', e)); playSfx('rotate'); }
    if(p2Ok && keysJustPressed[p2H]){ const _p = window.nativeAPI.hardDrop({game:'ai'}); _p && _p.catch(e => console.warn('[IPC]', e)); playSfx('drop'); if (coop) gameStats._lastDropWasHard_ai = true; }
    if(p2Ok && keysJustPressed[p2SD]){ playSfx('softdrop'); }
    // Pause key is now handled by separate event listener that opens in-game settings panel

    for(const k in keysJustPressed) delete keysJustPressed[k];
}

// Window event listeners
window.addEventListener('blur', () => {
    for(const k in keysDown) delete keysDown[k];
    for(const k in keysJustPressed) delete keysJustPressed[k];
    for(const k in keyMoveTimer) delete keyMoveTimer[k];
});

document.addEventListener('keydown', async e => {
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(capturingActionId){
        e.preventDefault();
        if(e.code === 'Escape'){ capturingActionId = null; renderKeyBindingsUI(); e.stopImmediatePropagation(); return; }
        keyBindings[capturingActionId] = e.code;
        resolveKeyConflicts(capturingActionId);
        capturingActionId = null;
        await saveKeyBindings();
        renderKeyBindingsUI();
        updateKeyHints();
        return;
    }
    if(keysDown[e.code]) return;
    keysDown[e.code] = true;
    keysJustPressed[e.code] = true;
    delete keyMoveTimer[e.code];
    e.preventDefault();
});

document.addEventListener('keyup', e => { keysDown[e.code] = false; });

document.addEventListener('keydown', e => {
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(e.code === 'Escape'){
        const sp = document.getElementById('settingsPanel'), lb = document.getElementById('leaderboardOverlay'),
              ap = document.getElementById('achievementPanel');
        if(capturingActionId){ capturingActionId = null; renderKeyBindingsUI(); return; }
        if(sp.classList.contains('show')){ 
            // 游戏中关闭设置面板要恢复游戏
            if (gameStarted) {
                closeInGameSettings();
            } else {
                sp.classList.remove('show'); 
                document.getElementById('settingsBackdrop').classList.remove('show');
                document.getElementById('inGameActions').classList.add('hidden');
            }
            return; 
        }
        if(ap.classList.contains('show')){ ap.classList.remove('show'); document.getElementById('achievementBackdrop').classList.remove('show'); return; }
        if(lb.classList.contains('show')){ lb.classList.remove('show'); return; }
        // In replay mode: ESC exits replay
        if (isReplayMode) {
            exitReplay();
            return;
        }
        // In-game: open settings (game over 时也能打开)
        if(gameStarted){
            openInGameSettings();
        }
    }
});

// P key also opens in-game settings (game over 时也能打开)
document.addEventListener('keydown', e => {
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if((e.code === (keyBindings.pause || 'KeyP')) && gameStarted){
        // If settings panel is open, close it; otherwise open it
        const sp = document.getElementById('settingsPanel');
        if(sp.classList.contains('show')){
            closeInGameSettings();
        } else {
            openInGameSettings();
        }
    }
});

// Fullscreen
function toggleFullscreen(){
    if(!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => console.warn('[IPC]', e));
    else document.exitFullscreen().catch(e => console.warn('[IPC]', e));
}
document.addEventListener('keydown', e => {
    if(e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.altKey && e.code === 'Enter'){
        toggleFullscreen();
        e.preventDefault();
    }
});