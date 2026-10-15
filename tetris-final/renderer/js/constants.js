// ===== 常量定义 =====
const COLS = 10;
const ROWS = 20;
const CELL = 24;

const COLORS = { I: '#00f0f0', O: '#f0f000', T: '#a000f0', S: '#00f000', Z: '#f00000', J: '#0000f0', L: '#f0a000', X: '#888888' };
const COLOR_GLOW = { I: 'rgba(0,240,240,0.3)', O: 'rgba(240,240,0,0.3)', T: 'rgba(160,0,240,0.3)', S: 'rgba(0,240,0,0.3)', Z: 'rgba(240,0,0,0.3)', J: 'rgba(0,0,240,0.3)', L: 'rgba(240,160,0,0.3)', X: 'rgba(136,136,136,0.3)' };
COLORS.SINGLE = '#ff6b6b'; COLOR_GLOW.SINGLE = 'rgba(255,107,107,0.3)';
COLORS.BAR2 = '#4ecdc4'; COLOR_GLOW.BAR2 = 'rgba(78,205,196,0.3)';
COLORS.BAR3 = '#45b7d1'; COLOR_GLOW.BAR3 = 'rgba(69,183,209,0.3)';
COLORS.CORNER_L = '#ff9ff3'; COLOR_GLOW.CORNER_L = 'rgba(255,159,243,0.3)';
COLORS.CORNER_J = '#feca57'; COLOR_GLOW.CORNER_J = 'rgba(254,202,87,0.3)';

// 自定义纹理皮肤全局变量
let customTexturePattern = null;
let textureSkinActive = false;
let customSkinDataUrl = null; // 用户上传的皮肤图片 (base64 data URL)

// 自定义背景全局变量
let customBgDataUrl = null; // 用户上传的背景图片 (base64 data URL)
let customBgActive = false;

const SHAPES = { I: [[1,1,1,1]], O: [[1,1],[1,1]], T: [[0,1,0],[1,1,1]], S: [[0,1,1],[1,1,0]], Z: [[1,1,0],[0,1,1]], J: [[1,0,0],[1,1,1]], L: [[0,0,1],[1,1,1]] };
const PIECE_NAMES = ['I','O','T','S','Z','J','L'];
const BUILD_PIECE_NAMES = ['I','O','SINGLE','BAR2','BAR3','CORNER_L','CORNER_J'];
const BUILD_SHAPES = { I: [[1,1,1,1]], O: [[1,1],[1,1]], SINGLE: [[1]], BAR2: [[1,1]], BAR3: [[1,1,1]], CORNER_L: [[1,0],[1,0],[1,1]], CORNER_J: [[0,1],[0,1],[1,1]] };

const BLOCK_SKIN_COLORS = {
    classic:{I:'#00f0f0',O:'#f0f000',T:'#a000f0',S:'#00f000',Z:'#f00000',J:'#0000f0',L:'#f0a000'},
    neon:{I:'#ff00ff',O:'#00ffff',T:'#ff0066',S:'#00ff66',Z:'#ff3300',J:'#6600ff',L:'#ff9900'},
    pastel:{I:'#a8e6cf',O:'#ffd3b6',T:'#dcedc1',S:'#ff8b94',Z:'#ffaaa5',J:'#b5eaea',L:'#f7d794'},
    candy:{I:'#ff9ff3',O:'#feca57',T:'#ff6b6b',S:'#48dbfb',Z:'#ff9f43',J:'#5f27cd',L:'#01a3a4'},
    matrix:{I:'#00ff41',O:'#33ee00',T:'#66ff33',S:'#aaff00',Z:'#007700',J:'#00ff00',L:'#00bb44'},
    golden:{I:'#ffd700',O:'#daa520',T:'#ffc107',S:'#ffb300',Z:'#ff8f00',J:'#ffab00',L:'#ffea00'},
    crystal:{I:'#80e8ff',O:'#ffffff',T:'#c8a0ff',S:'#80ffb0',Z:'#ff9090',J:'#9090ff',L:'#ffd080'},
    rainbow:{I:'#ff0000',O:'#ff7700',T:'#ffff00',S:'#00ff00',Z:'#0077ff',J:'#0000ff',L:'#7700ff'},
    custom:{I:'#ff69b4',O:'#ff69b4',T:'#ff69b4',S:'#ff69b4',Z:'#ff69b4',J:'#ff69b4',L:'#ff69b4'},
    uploaded:{I:'#ff69b4',O:'#ff69b4',T:'#ff69b4',S:'#ff69b4',Z:'#ff69b4',J:'#ff69b4',L:'#ff69b4'}
};
const BLOCK_SKIN_GLOWS = {
    classic:{I:'rgba(0,240,240,0.3)',O:'rgba(240,240,0,0.3)',T:'rgba(160,0,240,0.3)',S:'rgba(0,240,0,0.3)',Z:'rgba(240,0,0,0.3)',J:'rgba(0,0,240,0.3)',L:'rgba(240,160,0,0.3)'},
    neon:{I:'rgba(255,0,255,0.4)',O:'rgba(0,255,255,0.4)',T:'rgba(255,0,102,0.4)',S:'rgba(0,255,102,0.4)',Z:'rgba(255,51,0,0.4)',J:'rgba(102,0,255,0.4)',L:'rgba(255,153,0,0.4)'},
    pastel:{I:'rgba(168,230,207,0.3)',O:'rgba(255,211,182,0.3)',T:'rgba(220,237,193,0.3)',S:'rgba(255,139,148,0.3)',Z:'rgba(255,170,165,0.3)',J:'rgba(181,234,234,0.3)',L:'rgba(247,215,148,0.3)'},
    candy:{I:'rgba(255,159,243,0.3)',O:'rgba(254,202,87,0.3)',T:'rgba(255,107,107,0.3)',S:'rgba(72,219,251,0.3)',Z:'rgba(255,159,67,0.3)',J:'rgba(95,39,205,0.3)',L:'rgba(1,163,164,0.3)'},
    matrix:{I:'rgba(0,255,65,0.3)',O:'rgba(0,204,51,0.3)',T:'rgba(51,255,102,0.3)',S:'rgba(102,255,51,0.3)',Z:'rgba(0,170,0,0.3)',J:'rgba(0,255,0,0.3)',L:'rgba(0,221,0,0.3)'},
    golden:{I:'rgba(255,215,0,0.4)',O:'rgba(218,165,32,0.4)',T:'rgba(255,193,7,0.4)',S:'rgba(255,179,0,0.4)',Z:'rgba(255,143,0,0.4)',J:'rgba(255,171,0,0.4)',L:'rgba(255,234,0,0.4)'},
    crystal:{I:'rgba(128,232,255,0.25)',O:'rgba(255,255,255,0.2)',T:'rgba(200,160,255,0.25)',S:'rgba(128,255,176,0.25)',Z:'rgba(255,144,144,0.25)',J:'rgba(144,144,255,0.25)',L:'rgba(255,208,128,0.25)'},
    rainbow:{I:'rgba(255,0,0,0.3)',O:'rgba(255,119,0,0.3)',T:'rgba(255,255,0,0.3)',S:'rgba(0,255,0,0.3)',Z:'rgba(0,119,255,0.3)',J:'rgba(0,0,255,0.3)',L:'rgba(119,0,255,0.3)'},
    custom:{I:'rgba(255,105,180,0.3)',O:'rgba(255,105,180,0.3)',T:'rgba(255,105,180,0.3)',S:'rgba(255,105,180,0.3)',Z:'rgba(255,105,180,0.3)',J:'rgba(255,105,180,0.3)',L:'rgba(255,105,180,0.3)'},
    uploaded:{I:'rgba(255,105,180,0.3)',O:'rgba(255,105,180,0.3)',T:'rgba(255,105,180,0.3)',S:'rgba(255,105,180,0.3)',Z:'rgba(255,105,180,0.3)',J:'rgba(255,105,180,0.3)',L:'rgba(255,105,180,0.3)'}
};

// 确保所有皮肤都有 X 回退色
for(const _id of Object.keys(BLOCK_SKIN_COLORS)){
    if(!BLOCK_SKIN_COLORS[_id].X) BLOCK_SKIN_COLORS[_id].X = '#888888';
    if(!BLOCK_SKIN_GLOWS[_id].X) BLOCK_SKIN_GLOWS[_id].X = 'rgba(136,136,136,0.3)';
}

const THEMES = [
    {id:'classic',name:'经典黄',dot:'#1a1a0a'},
    {id:'ocean',name:'深海蓝',dot:'#0a1628'},
    {id:'forest',name:'森林绿',dot:'#0a140e'},
    {id:'midnight',name:'午夜紫',dot:'#0a0a1a'},
    {id:'pink',name:'少女粉',dot:'#1a0a1a'}
];

const STAGE_WIN_DELAY = 1500;

// Utility functions
function rotateCW(s){
    const H = s.length, W = s[0].length, r = [];
    for(let c = 0; c < W; c++){ r[c] = []; for(let l = H - 1; l >= 0; l--) r[c].push(s[l][c]); }
    return r;
}
function shuffle(a){
    for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}

// Node.js 导出（用于 Jest 测试）
if(typeof module !== 'undefined' && module.exports){
    module.exports = { rotateCW, shuffle, COLS, ROWS, CELL, COLORS, COLOR_GLOW, SHAPES, PIECE_NAMES, BUILD_PIECE_NAMES, BUILD_SHAPES, BLOCK_SKIN_COLORS, BLOCK_SKIN_GLOWS, THEMES };
}