// ===== 回放系统 =====
let replayFrames = [], isReplayMode = false, replayFrameIndex = 0, replayTimer = null, replayCanvas = null, replayCtx = null, replaySpeed = 600;

function startRecording(){ replayFrames = []; isReplayMode = false; }
function recordReplayFrame(){
    if(!running) return;
    if(gameMode === 'coop') replayFrames.push({grid1:playerGame.grid.map(r=>[...r]),grid2:aiGame.grid.map(r=>[...r]),score1:playerGame.score,score2:aiGame.score,lines1:playerGame.lines,lines2:aiGame.lines,level1:playerGame.level,level2:aiGame.level,timestamp:performance.now()});
    else replayFrames.push({score:playerGame.score,lines:playerGame.lines,level:playerGame.level,grid:playerGame.grid.map(r=>[...r]),timestamp:performance.now()});
}
function startReplay(){
    if(replayFrames.length === 0) return;
    isReplayMode = true; replayFrameIndex = 0;
    const isMulti = replayFrames[0] && 'grid2' in replayFrames[0];
    if(isMulti){ replayCanvas = document.getElementById('coopCanvas'); replayCtx = replayCanvas.getContext('2d'); document.getElementById('coopOverlay').classList.remove('show'); }
    else {
        replayCanvas = document.getElementById('playerCanvas'); replayCtx = replayCanvas.getContext('2d');
        document.getElementById('playerOverlay').classList.remove('show'); document.getElementById('aiOverlay').classList.remove('show');
        document.querySelector('.ai-section').classList.add('hidden'); document.querySelector('.board-container').classList.add('single-mode');
    }
    document.getElementById('btnStart').disabled = true; document.getElementById('btnPause').disabled = true;
    const gtm = document.getElementById('gtModeDisplay');
    if(gtm) gtm.textContent = '🔄 回放中';
    document.getElementById('gameControls').classList.remove('hidden-in-game');
    document.getElementById('keyHints').innerHTML = '<span>按 <kbd>ESC</kbd> 退出回放 &nbsp;|&nbsp; 速度: </span><button class="replay-speed-btn" data-speed="1000" style="font-size:11px;padding:2px 8px;margin:0 2px;cursor:pointer;background:#222;color:#fff;border:1px solid #555;border-radius:4px;">🐢 慢</button><button class="replay-speed-btn" data-speed="600" style="font-size:11px;padding:2px 8px;margin:0 2px;cursor:pointer;background:#222;color:#fff;border:1px solid #555;border-radius:4px;">中</button><button class="replay-speed-btn" data-speed="300" style="font-size:11px;padding:2px 8px;margin:0 2px;cursor:pointer;background:#222;color:#fff;border:1px solid #555;border-radius:4px;">🐇 快</button><button class="replay-speed-btn" data-speed="100" style="font-size:11px;padding:2px 8px;margin:0 2px;cursor:pointer;background:#222;color:#fff;border:1px solid #555;border-radius:4px;">🚀 极速</button>';
    document.querySelectorAll('.replay-speed-btn').forEach(b => b.addEventListener('click', () => changeReplaySpeed(parseInt(b.dataset.speed))));
    if(replayTimer) clearInterval(replayTimer);
    replayTimer = setInterval(playReplayFrame, replaySpeed);
}
function changeReplaySpeed(s){ replaySpeed = s; if(replayTimer){ clearInterval(replayTimer); replayTimer = setInterval(playReplayFrame, replaySpeed); } }
function playReplayFrame(){
    if(replayFrameIndex >= replayFrames.length){ clearInterval(replayTimer); replayTimer = null; showReplayEnd(); return; }
    const frame = replayFrames[replayFrameIndex]; replayFrameIndex++;
    const isMulti = 'grid2' in frame;
    replayCtx.clearRect(0, 0, replayCanvas.width, replayCanvas.height);
    replayCtx.fillStyle = '#111122'; replayCtx.fillRect(0, 0, replayCanvas.width, replayCanvas.height);
    const hw = COLS * CELL;
    if(isMulti){
        replayCtx.strokeStyle = 'rgba(255,255,255,0.04)'; replayCtx.lineWidth = 1;
        for(let r = 0; r <= ROWS; r++){ replayCtx.beginPath(); replayCtx.moveTo(0, r * CELL); replayCtx.lineTo(replayCanvas.width, r * CELL); replayCtx.stroke(); }
        for(let c = 0; c <= COLS; c++){
            replayCtx.beginPath(); replayCtx.moveTo(c * CELL, 0); replayCtx.lineTo(c * CELL, replayCanvas.height); replayCtx.stroke();
            replayCtx.beginPath(); replayCtx.moveTo(hw + c * CELL, 0); replayCtx.lineTo(hw + c * CELL, replayCanvas.height); replayCtx.stroke();
        }
        replayCtx.strokeStyle = 'rgba(255,255,255,0.25)'; replayCtx.lineWidth = 2; replayCtx.setLineDash([6,4]);
        replayCtx.beginPath(); replayCtx.moveTo(hw, 0); replayCtx.lineTo(hw, replayCanvas.height); replayCtx.stroke(); replayCtx.setLineDash([]);
        const db = (grid, ox) => {
            for(let r = 0; r < ROWS; r++) for(let c = 0; c < COLS; c++){
                const v = grid[r][c];
                if(v){
                    const px = ox + c * CELL, py = r * CELL, pad = 1, sz = CELL - pad * 2, color = COLORS[v] || '#888', glow = COLOR_GLOW[v] || null;
                    replayCtx.fillStyle = color; replayCtx.fillRect(px + pad, py + pad, sz, sz);
                    replayCtx.fillStyle = 'rgba(255,255,255,0.2)'; replayCtx.fillRect(px + pad, py + pad, sz, 3); replayCtx.fillRect(px + pad, py + pad, 3, sz);
                    replayCtx.fillStyle = 'rgba(0,0,0,0.2)'; replayCtx.fillRect(px + pad, py + sz - 3, sz, 3); replayCtx.fillRect(px + sz - 3, py + pad, 3, sz);
                    if(glow){ replayCtx.shadowColor = color; replayCtx.shadowBlur = 8; replayCtx.fillStyle = 'transparent'; replayCtx.fillRect(px + pad, py + pad, sz, sz); replayCtx.shadowBlur = 0; }
                }
            }
        };
        db(frame.grid1, 0); db(frame.grid2, hw);
        replayCtx.fillStyle = 'rgba(0,0,0,0.6)'; replayCtx.fillRect(0, 0, replayCanvas.width, 22);
        replayCtx.fillStyle = '#fff'; replayCtx.font = '12px sans-serif'; replayCtx.textAlign = 'left';
        const sl = replaySpeed >= 800 ? '慢速' : replaySpeed >= 450 ? '中速' : replaySpeed >= 200 ? '快速' : '极速';
        replayCtx.fillText('🔄 回放 '+replayFrameIndex+'/'+replayFrames.length+' ['+sl+']', 6, 15);
        replayCtx.textAlign = 'right'; replayCtx.fillStyle = '#00d4ff';
        replayCtx.fillText('P1: '+frame.score1, hw - 6, 15);
        replayCtx.fillStyle = '#f7b731'; replayCtx.fillText('P2: '+frame.score2+'  ', replayCanvas.width - 6, 15);
        document.getElementById('playerScore').textContent = frame.score1;
        document.getElementById('playerLines').textContent = frame.lines1;
        document.getElementById('playerLevel').textContent = frame.level1;
        document.getElementById('aiScore').textContent = frame.score2;
        document.getElementById('aiLines').textContent = frame.lines2;
        document.getElementById('aiLevel').textContent = frame.level2;
    } else {
        replayCtx.strokeStyle = 'rgba(255,255,255,0.04)'; replayCtx.lineWidth = 1;
        for(let r = 0; r <= ROWS; r++){ replayCtx.beginPath(); replayCtx.moveTo(0, r * CELL); replayCtx.lineTo(replayCanvas.width, r * CELL); replayCtx.stroke(); }
        for(let c = 0; c <= COLS; c++){ replayCtx.beginPath(); replayCtx.moveTo(c * CELL, 0); replayCtx.lineTo(c * CELL, replayCanvas.height); replayCtx.stroke(); }
        for(let r = 0; r < ROWS; r++) for(let c = 0; c < COLS; c++){ const v = frame.grid[r][c]; if(v) playerRenderer.drawBlock(replayCtx, c, r, COLORS[v] || '#fff', COLOR_GLOW[v] || 'rgba(255,255,255,0.2)', 1); }
        replayCtx.fillStyle = 'rgba(0,0,0,0.6)'; replayCtx.fillRect(0, 0, replayCanvas.width, 22);
        replayCtx.fillStyle = '#fff'; replayCtx.font = '12px sans-serif'; replayCtx.textAlign = 'left';
        const sl = replaySpeed >= 800 ? '慢速' : replaySpeed >= 450 ? '中速' : replaySpeed >= 200 ? '快速' : '极速';
        replayCtx.fillText('🔄 回放 '+replayFrameIndex+'/'+replayFrames.length+' ['+sl+']', 6, 15);
        replayCtx.fillStyle = '#f7b731'; replayCtx.textAlign = 'right'; replayCtx.fillText('🏆 '+frame.score, replayCanvas.width - 6, 15);
        document.getElementById('playerScore').textContent = frame.score;
        document.getElementById('playerLines').textContent = frame.lines;
        document.getElementById('playerLevel').textContent = frame.level;
    }
}
function showReplayEnd(){
    const isMulti = replayFrames[0] && 'grid2' in replayFrames[0], oid = isMulti ? 'coopOverlay' : 'playerOverlay';
    const overlay = document.getElementById(oid);
    overlay.innerHTML = '<div class="big-emoji">📼</div><h2>回放结束</h2><p>已播放 '+replayFrames.length+' 帧</p><button class="btn btn-primary" id="replayRestartBtn" style="margin-top:8px;">🔄 重新回放</button><br><button class="btn" id="replayExitBtn" style="margin-top:6px;font-size:13px;">← 返回</button>';
    overlay.classList.add('show');
    document.getElementById('replayRestartBtn').addEventListener('click', () => { replayFrameIndex = 0; if(replayTimer) clearInterval(replayTimer); replayTimer = setInterval(playReplayFrame, replaySpeed); overlay.classList.remove('show'); });
    document.getElementById('replayExitBtn').addEventListener('click', () => { exitReplay(); overlay.classList.add('show'); checkGameOver(); });
}
function exitReplay(){
    if(!isReplayMode) return;
    isReplayMode = false;
    if(replayTimer){ clearInterval(replayTimer); replayTimer = null; }
    document.getElementById('playerOverlay').classList.remove('show');
    document.getElementById('coopOverlay').classList.remove('show');
    document.querySelector('.ai-section').classList.remove('hidden');
    document.querySelector('.board-container').classList.remove('single-mode');
    document.getElementById('btnStart').disabled = false;
    document.getElementById('btnPause').disabled = false;
    updateModeUI(); updateGameUI(); playerRenderer.render(); aiRenderer.render(); coopRenderer.render();
}

// Hook hardDrop for recording (replaces original hook)
const _origHardDrop = function(){};