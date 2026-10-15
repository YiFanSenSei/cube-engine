// ===== 建造模式 =====
const BUILD_CHALLENGES = [
    {id:'tower_4',name:'小高塔 🗼',desc:'使任一列堆叠到4格高',reward:100,check:g=>{for(let c=0;c<COLS;c++){let h=0;for(let r=ROWS-1;r>=0;r--){if(g[r][c])h++;else break}if(h>=4)return true}return false},drawPreview:(c,w,h)=>drawStackPreview(c,w,h,4,'#00d4ff')},
    {id:'tower_8',name:'摩天大楼 🏙️',desc:'使任一列堆叠到8格高',reward:300,check:g=>{for(let c=0;c<COLS;c++){let h=0;for(let r=ROWS-1;r>=0;r--){if(g[r][c])h++;else break}if(h>=8)return true}return false},drawPreview:(c,w,h)=>drawStackPreview(c,w,h,8,'#ff6b35')},
    {id:'beam_5',name:'小桥流水 🌉',desc:'铺一条至少5格连续的横线',reward:150,check:g=>{for(let r=0;r<ROWS;r++){let cnt=0;for(let c=0;c<COLS;c++){cnt=g[r][c]?cnt+1:0;if(cnt>=5)return true}}return false},drawPreview:(c,w,h)=>drawBeamPreview(c,w,h,5,'#4ecdc4')},
    {id:'beam_8',name:'跨海大桥 🌁',desc:'铺一条至少8格连续的横线',reward:400,check:g=>{for(let r=0;r<ROWS;r++){let cnt=0;for(let c=0;c<COLS;c++){cnt=g[r][c]?cnt+1:0;if(cnt>=8)return true}}return false},drawPreview:(c,w,h)=>drawBeamPreview(c,w,h,8,'#45b7d1')},
    {id:'symmetry',name:'对称之美 🦋',desc:'使方块布局左右完全对称',reward:500,check:g=>{for(let r=0;r<ROWS;r++)for(let c=0;c<Math.floor(COLS/2);c++)if((g[r][c]!==0)!==(g[r][COLS-1-c]!==0))return false;return true},drawPreview:(c,w,h)=>drawSymmetryPreview(c,w,h)},
    {id:'big_square',name:'大庄园 🏡',desc:'建造一个3×3的实心方块区域',reward:600,check:g=>{for(let r=0;r<=ROWS-3;r++)for(let c=0;c<=COLS-3;c++){let full=true;for(let dr=0;dr<3&&full;dr++)for(let dc=0;dc<3;dc++)if(!g[r+dr][c+dc]){full=false;break}if(full)return true}return false},drawPreview:(c,w,h)=>drawSquarePreview(c,w,h,3,'#ff9ff3')},
    {id:'colorful_3',name:'三色堇 🌈',desc:'使用至少3种不同颜色的方块',reward:200,check:g=>{const s=new Set();for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(g[r][c])s.add(g[r][c]);return s.size>=3},drawPreview:(c,w,h)=>drawColorfulPreview(c,w,h,3)},
    {id:'colorful_all',name:'五光十色 🎨',desc:'使用至少5种不同颜色的方块',reward:450,check:g=>{const s=new Set();for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(g[r][c])s.add(g[r][c]);return s.size>=5},drawPreview:(c,w,h)=>drawColorfulPreview(c,w,h,5)},
    {id:'wall_3',name:'三柱擎天 🏛️',desc:'3列同时达到6格高',reward:700,check:g=>{let cnt=0;for(let c=0;c<COLS;c++){let h=0;for(let r=ROWS-1;r>=0;r--){if(g[r][c])h++;else break}if(h>=6)cnt++}return cnt>=3},drawPreview:(c,w,h)=>drawWallPreview(c,w,h,3,6,'#feca57')},
    {id:'staircase',name:'楼梯间 🪜',desc:'建造一个阶梯（3行每行多1格，左或右对齐）',reward:350,check:g=>{for(let r=2;r<ROWS;r++)for(let c=0;c<=COLS-3;c++){if(g[r][c]&&g[r][c+1]&&g[r][c+2]&&g[r-1][c]&&g[r-1][c+1]&&g[r-2][c])return true;if(g[r][c]&&g[r][c+1]&&g[r][c+2]&&g[r-1][c+1]&&g[r-1][c+2]&&g[r-2][c+2])return true}return false},drawPreview:(c,w,h)=>drawStaircasePreview(c,w,h)},
];

let buildChallengePool = [];
let buildCurrentChallenge = null;
let buildChallengeCompleted = false;
let buildChallengeTimer = -1;
let buildCompletedCount = 0;
let buildCombo = 0;
let buildCooldown = 0;
let _trackedPiecesThisGame = new Set();

let _buildAllComplete = false;
let _buildNullRetryTimer = 0; // 用于重试获取挑战的计时器

function getNextBuildChallenge(){
    _buildAllComplete = false;
    // 从未被棋盘满足的挑战中随机选一个
    const unsatisfied = buildChallengePool.filter(c => !c.check(playerGame.grid));
    if(unsatisfied.length === 0){
        // 池子空了，补充所有挑战（已完成的重新洗牌）
        if(buildChallengePool.length === 0) buildChallengePool = shuffle([...BUILD_CHALLENGES]);
        const refill = buildChallengePool.filter(c => !c.check(playerGame.grid));
        if(refill.length === 0){
            // 所有挑战都已被当前棋盘满足 → 仍然随机选一个
            // 玩家继续搭方块可能会破坏条件（如对称），届时可以重新完成
            const fallback = shuffle([...BUILD_CHALLENGES]);
            for(const fb of fallback){
                const idx = buildChallengePool.indexOf(fb);
                if(idx >= 0) return buildChallengePool.splice(idx, 1)[0];
            }
            // 真的一个都不剩了（理论上不会到这）
            _buildAllComplete = true;
            return null;
        }
        const pick = refill[Math.floor(Math.random() * refill.length)];
        const idx = buildChallengePool.indexOf(pick);
        return buildChallengePool.splice(idx, 1)[0];
    }
    const pick = unsatisfied[Math.floor(Math.random() * unsatisfied.length)];
    const idx = buildChallengePool.indexOf(pick);
    return buildChallengePool.splice(idx, 1)[0];
}

function updateBuildChallengeUI(){
    const t = document.getElementById('bcTask'), r = document.getElementById('bcReward'),
          co = document.getElementById('bcCombo'), cnt = document.getElementById('bcCount'),
          cv = document.getElementById('bcPreview'), ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 0, cv.width, cv.height);
    if(buildChallengeCompleted && buildCurrentChallenge){
        t.textContent = '✅ 任务完成！+'+buildCurrentChallenge.reward+' 分';
        r.textContent = '🎁 +'+buildCurrentChallenge.reward;
        co.textContent = '🔥 连击 x'+buildCombo;
        cnt.textContent = '✅ 已完成 '+buildCompletedCount;
        ctx.fillStyle = '#00c853'; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('✓', cv.width/2, cv.height/2);
    } else if(buildCurrentChallenge){
        t.textContent = '🧱 '+buildCurrentChallenge.name+' — '+buildCurrentChallenge.desc;
        r.textContent = '🎁 +'+buildCurrentChallenge.reward;
        const b = Math.floor(buildCombo * 50);
        co.textContent = b > 0 ? '🔥 连击奖励 +'+b : '🔥 连击 x'+buildCombo;
        cnt.textContent = '✅ 已完成 '+buildCompletedCount;
        if(buildCurrentChallenge.drawPreview) buildCurrentChallenge.drawPreview(ctx, cv.width, cv.height);
    } else if(_buildAllComplete) {
        t.textContent = '🎉 全部完成！继续搭建吧'; r.textContent = ''; co.textContent = '';
        cnt.textContent = '✅ 已完成 '+buildCompletedCount;
        ctx.fillStyle = '#ffd700'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🏆', cv.width/2, cv.height/2);
    } else {
        t.textContent = '⏳ 加载中...'; r.textContent = ''; co.textContent = ''; cnt.textContent = '✅ 已完成 '+buildCompletedCount;
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('?', cv.width/2, cv.height/2);
    }
    if(buildCooldown > 0 && !buildChallengeCompleted){
        const pct = buildCooldown / 3000, bar = document.getElementById('buildChallenge');
        let cd = document.getElementById('bcCooldown');
        if(!cd){
            cd = document.createElement('div'); cd.id = 'bcCooldown';
            cd.style.cssText = 'height:4px;border-radius:2px;margin-top:4px;background:rgba(255,255,255,0.1);overflow:hidden;position:relative;';
            const bf = document.createElement('div'); bf.id = 'bcCooldownFill';
            bf.style.cssText = 'height:100%;border-radius:2px;background:var(--accent-1);transition:none;';
            cd.appendChild(bf); bar.appendChild(cd);
        }
        document.getElementById('bcCooldownFill').style.width = ((1 - pct) * 100) + '%';
    } else {
        const cd = document.getElementById('bcCooldown');
        if(cd) cd.remove();
    }
}

function showBuildChallengeComplete(challenge, bonus){
    const n = document.getElementById('achievementNotif');
    if(!n) return;
    n.querySelector('.notif-icon').textContent = '🎉';
    n.querySelector('.notif-name').textContent = '任务完成！';
    n.querySelector('.notif-desc').textContent = challenge.name+' +'+challenge.reward+(bonus>0?'（连击+'+bonus+'）':'');
    n.classList.add('show');
    clearTimeout(n._timeout);
    n._timeout = setTimeout(() => n.classList.remove('show'), 3500);
}

function initBuildMode(){
    buildChallengePool = []; buildCurrentChallenge = null; buildChallengeCompleted = false;
    buildChallengeTimer = -1; buildCompletedCount = 0; buildCombo = 0; buildCooldown = 0;
    _buildAllComplete = false; _buildNullRetryTimer = 0;
    buildCurrentChallenge = getNextBuildChallenge();
    updateBuildChallengeUI();
    document.getElementById('buildChallenge').classList.add('show');
    document.getElementById('targetStatContainer').classList.remove('show');
    document.getElementById('challengeTimer').classList.remove('show');
}

// Preview drawing utilities
function drawGridBg(ctx, w, h){
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for(let x = 0; x < w; x += 12) ctx.fillRect(x, 0, 1, h);
    for(let y = 0; y < h; y += 12) ctx.fillRect(0, y, w, 1);
}
function drawBlock(ctx, x, y, s, color, alpha){
    ctx.globalAlpha = alpha || 1; const p = 1;
    ctx.fillStyle = color; ctx.fillRect(x + p, y + p, s - p * 2, s - p * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x + p, y + p, s - p * 2, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x + p, y + s - p - 2, s - p * 2, 2);
    ctx.globalAlpha = 1;
}
function drawStackPreview(ctx, w, h, count, color){
    drawGridBg(ctx, w, h); const bs = 10, gap = 2, totalH = count * (bs + gap), ox = Math.floor((w - bs) / 2), oy = Math.floor((h - totalH) / 2) + totalH - bs;
    for(let i = 0; i < count; i++) drawBlock(ctx, ox, oy - i * (bs + gap), bs, color);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(count+'格', w/2, h-3);
}
function drawBeamPreview(ctx, w, h, count, color){
    drawGridBg(ctx, w, h); const bs = 10, gap = 2, totalW = count * (bs + gap), ox = Math.floor((w - totalW) / 2), oy = Math.floor((h - bs) / 2);
    for(let i = 0; i < count; i++) drawBlock(ctx, ox + i * (bs + gap), oy, bs, color);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(count+'格宽', w/2, h-3);
}
function drawSymmetryPreview(ctx, w, h){
    drawGridBg(ctx, w, h);
    const cols = ['#00d4ff','#7b2ff7','#ff6b6b','#feca57','#4ecdc4'], shape = [[0,0,1,1,1,0,0],[0,1,1,1,1,1,0],[1,1,1,0,1,1,1],[0,1,0,1,0,1,0]];
    const bs = 10, gap = 2, rows = shape.length, totalW = shape[0].length * (bs + gap), ox = Math.floor((w - totalW) / 2), oy = 14;
    for(let r = 0; r < rows; r++) for(let c = 0; c < shape[0].length; c++){ if(!shape[r][c]) continue; drawBlock(ctx, ox + c * (bs + gap), oy + r * (bs + gap), bs, cols[r % cols.length]); }
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('左右镜像', w/2, h-3);
}
function drawSquarePreview(ctx, w, h, size, color){
    drawGridBg(ctx, w, h); const bs = 14, gap = 2, total = size * (bs + gap), ox = Math.floor((w - total) / 2), oy = Math.floor((h - total) / 2);
    for(let r = 0; r < size; r++) for(let c = 0; c < size; c++) drawBlock(ctx, ox + c * (bs + gap), oy + r * (bs + gap), bs, color);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(size+'×'+size, w/2, h-3);
}
function drawColorfulPreview(ctx, w, h, count){
    drawGridBg(ctx, w, h); const colors = ['#ff6b6b','#4ecdc4','#feca57','#7b2ff7','#45b7d1','#ff9ff3','#00d4ff','#ffa500'];
    const bs = 14, gap = 4, totalW = count * (bs + gap), ox = Math.floor((w - totalW) / 2), oy = Math.floor((h - bs) / 2);
    for(let i = 0; i < count; i++) drawBlock(ctx, ox + i * (bs + gap), oy, bs, colors[i % colors.length]);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(count+'种颜色', w/2, h-3);
}
function drawWallPreview(ctx, w, h, colCount, height, color){
    drawGridBg(ctx, w, h); const bs = 10, gap = 2, tw = colCount * (bs + gap), totalH = height * (bs + gap), ox = Math.floor((w - tw) / 2), oy = Math.floor((h - totalH) / 2) + totalH - bs;
    for(let c = 0; c < colCount; c++) for(let r = 0; r < height; r++) drawBlock(ctx, ox + c * (bs + gap), oy - r * (bs + gap), bs, color, 0.7 + 0.3 * (r / height));
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(colCount+'列×'+height+'格', w/2, h-3);
}
function drawStaircasePreview(ctx, w, h){
    drawGridBg(ctx, w, h); const bs = 12, gap = 2, stair = [[1,0,0],[1,1,0],[1,1,1]], rows = stair.length, totalW = stair[0].length * (bs + gap), ox = Math.floor((w - totalW) / 2), oy = Math.floor((h - rows * (bs + gap)) / 2), ox2 = ox + (stair[0].length - 1) * (bs + gap);
    for(let r = 0; r < rows; r++){ for(let c = 0; c < stair[0].length; c++){ if(!stair[r][c]) continue; drawBlock(ctx, ox + c * (bs + gap), oy + r * (bs + gap), bs, '#00d4ff'); drawBlock(ctx, ox2 - c * (bs + gap), oy + r * (bs + gap), bs, 'rgba(255,107,53,0.5)'); } }
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '7px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('左/右对齐阶梯', w/2, h-3);
}