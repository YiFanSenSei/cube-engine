// ===== 排行榜（JSON 文件存储）=====
let leaderboard = [];

async function loadLeaderboard(){
    try {
        const d = await window.nativeAPI.dbGet(getStorageKey('leaderboard'));
        if(Array.isArray(d)) leaderboard = d.filter(e => e && typeof e.score === 'number' && e.score >= 0 && typeof e.date === 'string' && typeof e.timestamp === 'number' && e.timestamp > 0).slice(0, 10);
    } catch(e){ leaderboard = []; }
}

async function saveLeaderboard(){
    try{ await window.nativeAPI.dbSet(getStorageKey('leaderboard'), leaderboard.slice(0, 10)); } catch(e){}
}

function addLeaderboardEntry(score){
    const e = { score, date: new Date().toLocaleDateString('zh-CN'), timestamp: Date.now() };
    leaderboard.push(e);
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    saveLeaderboard().catch(()=>{});
}

function renderLeaderboard(){
    const c = document.getElementById('lbEntries');
    if(!c) return;
    if(leaderboard.length === 0){
        c.innerHTML = '<div class="lb-empty">暂无记录<br>在挑战模式中取得好成绩吧！</div>';
        return;
    }
    c.innerHTML = leaderboard.map((e, i) => {
        const m = ['🥇', '🥈', '🥉'], rank = i < 3 ? m[i] : `#${i+1}`,
              rc = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        return `<div class="lb-entry"><div class="lb-rank ${rc}">${rank}</div><div class="lb-score">${e.score.toLocaleString()}</div><div class="lb-date">${e.date}</div></div>`;
    }).join('');
}
