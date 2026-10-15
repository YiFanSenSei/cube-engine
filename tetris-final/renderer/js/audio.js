// ===== 音频系统 =====
let _audioCtx = null;
function getAudioCtx(){ if(!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); return _audioCtx; }

// 默认音效音量从 0.6 提升到 1.0，整体音效更响亮
const audioSettings = { sfxVolume: 1.0 };

// 心跳音效相关状态
let _lastHeartbeatTime = 0;      // 上次心跳触发时间
let _heartbeatInterval = 0;      // 当前心跳间隔（ms）
let _heartbeatPhase = 0;         // 0=待触发, 1=第一次"咚", 2=第二次"咚"之间的间隔

/**
 * 播放心跳音效（低沉的"咚-咚"声）
 * @param {number} interval - 心跳间隔时间（ms），决定了心跳的快慢
 */
function playHeartbeat(interval) {
    if (audioSettings.sfxVolume === 0) return;
    const now = performance.now();
    // 如果正在播放第二次"咚"的过程中，不打断
    if (_heartbeatPhase === 2 && now - _lastHeartbeatTime < 300) return;
    
    try {
        const ctx = getAudioCtx();
        const vol = audioSettings.sfxVolume;
        const currentTime = ctx.currentTime;
        
        // 第一次"咚"（lub）— 较低沉（音量从 0.35 提升到 0.5）
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(80, currentTime);
        osc1.frequency.exponentialRampToValueAtTime(50, currentTime + 0.12);
        
        const gain1 = ctx.createGain();
        gain1.gain.setValueAtTime(vol * 0.50, currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(currentTime);
        osc1.stop(currentTime + 0.15);
        
        // 第二次"咚"（dub）— 稍高一点，间隔约 120ms（音量从 0.28 提升到 0.40）
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(100, currentTime + 0.12);
        osc2.frequency.exponentialRampToValueAtTime(60, currentTime + 0.24);
        
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(vol * 0.40, currentTime + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.27);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(currentTime + 0.12);
        osc2.stop(currentTime + 0.27);
        
        // 更新状态
        _lastHeartbeatTime = now;
        _heartbeatInterval = interval;
        _heartbeatPhase = 1; // 第一次"咚"已触发
        
        // 120ms 后标记第二次"咚"完成
        setTimeout(() => {
            _heartbeatPhase = 2;
        }, 200);
        
    } catch(e) {
        // 静默失败
    }
}

/**
 * 重置心跳状态（游戏结束时调用）
 */
function resetHeartbeat() {
    _lastHeartbeatTime = 0;
    _heartbeatInterval = 0;
    _heartbeatPhase = 0;
}

// playSfx — 整体提升了所有音效的音量倍率
function playSfx(type){
    if(audioSettings.sfxVolume === 0) return;
    try {
        const ctx = getAudioCtx(), vol = audioSettings.sfxVolume, g = ctx.createGain();
        g.connect(ctx.destination); g.gain.value = vol * 0.5;
        if(type === 'move'){
            const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 300 + Math.random() * 100;
            g.gain.value = vol * 0.2; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            o.connect(g); o.start(); o.stop(ctx.currentTime + 0.05);
        } else if(type === 'rotate'){
            const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 400;
            o.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.08);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            o.connect(g); o.start(); o.stop(ctx.currentTime + 0.08);
        } else if(type === 'drop'){
            const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 200;
            o.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);
            g.gain.value = vol * 0.45; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
            o.connect(g); o.start(); o.stop(ctx.currentTime + 0.12);
        } else if(type === 'clear'){
            [523, 659, 784].forEach((f, i) => {
                const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
                const gg = ctx.createGain(); gg.connect(ctx.destination); gg.gain.value = vol * 0.35;
                gg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15 + i * 0.08);
                o.connect(gg); o.start(ctx.currentTime + i * 0.08); o.stop(ctx.currentTime + 0.15 + i * 0.08);
            });
        } else if(type === 'tetris'){
            [523, 659, 784, 1047].forEach((f, i) => {
                const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
                const gg = ctx.createGain(); gg.connect(ctx.destination); gg.gain.value = vol * 0.45;
                gg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2 + i * 0.1);
                o.connect(gg); o.start(ctx.currentTime + i * 0.1); o.stop(ctx.currentTime + 0.2 + i * 0.1);
            });
        } else if(type === 'gameover'){
            [400, 350, 300, 200].forEach((f, i) => {
                const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
                const gg = ctx.createGain(); gg.connect(ctx.destination); gg.gain.value = vol * 0.3;
                gg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25 + i * 0.12);
                o.connect(gg); o.start(ctx.currentTime + i * 0.12); o.stop(ctx.currentTime + 0.25 + i * 0.12);
            });
        } else if(type === 'click'){
            const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 800;
            g.gain.value = vol * 0.15; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
            o.connect(g); o.start(); o.stop(ctx.currentTime + 0.04);
        }
        // === 新增音效 ===
        else if(type === 'softdrop'){
            // 轻快 tick — 软降逐格下落
            const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 600 + Math.random() * 100;
            g.gain.value = vol * 0.1; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
            o.connect(g); o.start(); o.stop(ctx.currentTime + 0.03);
        } else if(type === 'lock'){
            // 厚实撞击 — 方块锁定落定
            const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(150, ctx.currentTime);
            o.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
            g.gain.value = vol * 0.4; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            o.connect(g); o.start(); o.stop(ctx.currentTime + 0.1);
        } else if(type === 'score'){
            // 清脆叮咚 — 得分增量
            const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 880;
            g.gain.value = vol * 0.2; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
            o.connect(g); o.start(); o.stop(ctx.currentTime + 0.06);
        } else if(type === 'stageup'){
            // 上行胜利号角 — 关卡通关
            [440, 554, 659, 880].forEach((f, i) => {
                const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
                const gg = ctx.createGain(); gg.connect(ctx.destination); gg.gain.value = vol * 0.3;
                gg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25 + i * 0.12);
                o.connect(gg); o.start(ctx.currentTime + i * 0.12); o.stop(ctx.currentTime + 0.25 + i * 0.12);
            });
        } else if(type === 'urgent'){
            // 短促警告 — 挑战时间紧迫
            const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 440;
            g.gain.value = vol * 0.12; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            o.connect(g); o.start(); o.stop(ctx.currentTime + 0.08);
        } else if(type === 'achievement'){
            // 特殊叮~长音 — 成就解锁
            const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(1047, ctx.currentTime);
            o.frequency.linearRampToValueAtTime(1319, ctx.currentTime + 0.25);
            g.gain.value = vol * 0.35; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
            o.connect(g); o.start(); o.stop(ctx.currentTime + 0.45);
        } else if(type === 'purchase'){
            // 金币叮当 — 购买成功
            [880, 1109, 1319].forEach((f, i) => {
                const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
                const gg = ctx.createGain(); gg.connect(ctx.destination); gg.gain.value = vol * 0.2;
                gg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12 + i * 0.08);
                o.connect(gg); o.start(ctx.currentTime + i * 0.08); o.stop(ctx.currentTime + 0.12 + i * 0.08);
            });
        } else if(type === 'newrecord'){
            // 庆祝音 — 新纪录
            [523, 659, 784, 1047, 1319].forEach((f, i) => {
                const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
                const gg = ctx.createGain(); gg.connect(ctx.destination); gg.gain.value = vol * 0.35;
                gg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15 + i * 0.1);
                o.connect(gg); o.start(ctx.currentTime + i * 0.1); o.stop(ctx.currentTime + 0.15 + i * 0.1);
            });
        } else if(type === 'replay_click'){
            // 回放面板专用轻点击 — 比普通 click 稍厚一点
            const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 660;
            g.gain.value = vol * 0.12; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            o.connect(g); o.start(); o.stop(ctx.currentTime + 0.05);
        }
    } catch(e){}
}

