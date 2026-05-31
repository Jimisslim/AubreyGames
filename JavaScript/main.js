console.log("Hello there, fellow inspect user. You wont find anything very cool in here. Dont look too deep into my programming \"skills\" though");

const LOCKED_PASSWORD = "5789";
let pendingUrl = null;
let pendingGameName = null;

function openLocked(card, url) {
    pendingUrl = url;
    pendingGameName = card.dataset.game || 'Unknown';
    const backdrop = document.getElementById('pwBackdrop');
    const input = document.getElementById('pwInput');
    const errEl = document.getElementById('pwError');
    errEl.textContent = '';
    input.value = '';
    backdrop.classList.add('open');
    setTimeout(() => input.focus(), 80);
}

function closePwModal(e) {
    if (e && e.target !== document.getElementById('pwBackdrop')) return;
    document.getElementById('pwBackdrop').classList.remove('open');
    pendingUrl = null;
    pendingGameName = null;
}

function confirmPassword() {
    const input = document.getElementById('pwInput');
    const errEl = document.getElementById('pwError');
    if (input.value === LOCKED_PASSWORD) {
        document.getElementById('pwBackdrop').classList.remove('open');
        if (pendingGameName) statsTrackPlay(pendingGameName);
        window.open(pendingUrl, '_blank');
        pendingUrl = null;
        pendingGameName = null;
    } else {
        errEl.textContent = 'Incorrect. Ask me for the password.';
        input.classList.remove('shake');
        void input.offsetWidth;
        input.classList.add('shake');
        input.value = '';
        setTimeout(() => input.classList.remove('shake'), 400);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('pwBackdrop').classList.remove('open');
        pendingUrl = null;
        pendingGameName = null;
        closeStatsPanel();
    }
    if (e.ctrlKey && e.shiftKey && (e.key === '`' || e.key === '~')) {
        e.preventDefault();
        toggleStatsPanel();
    }
})

document.addEventListener('mousemove', (e) => {
    if (Math.random() > 0.4) return;
    const spark = document.createElement('div');
    spark.style.cssText = `
        position:fixed; pointer-events:none; z-index:998;
        left:${e.clientX}px; top:${e.clientY}px;
        width:6px; height:6px; border-radius:50%;
        background: hsl(${330 + Math.random()*40}deg, 100%, 75%);
        transform: translate(-50%,-50%) scale(1);
        transition: transform 0.5s, opacity 0.5s;
        opacity: 0.9;
    `;
    document.body.appendChild(spark);
    requestAnimationFrame(() => {
        spark.style.transform = `translate(${(Math.random()-0.5)*30}px, ${-20 - Math.random()*20}px) scale(0)`;
        spark.style.opacity = '0';
    });
    setTimeout(() => spark.remove(), 550);
});
const STAT_VISITS_KEY   = 'stats-total-visits';
const STAT_PLAYS_KEY    = 'stats-game-plays';
const STAT_TIME_KEY     = 'stats-total-time';
const ACTIVE_TTL        = 90000;

const sessionStart = Date.now();
const myActiveKey  = 'active-' + Math.random().toString(36).slice(2, 10);
async function hbSet() {
    try { await window.storage.set(myActiveKey, String(Date.now()), true); } catch(_) {}
}
async function hbClear() {
    try { await window.storage.delete(myActiveKey, true); } catch(_) {}
}
async function countActive() {
    try {
        const r = await window.storage.list('active-', true);
        if (!r || !r.keys || r.keys.length === 0) return 1;
        let n = 0;
        const now = Date.now();
        for (const k of r.keys) {
            try {
                const v = await window.storage.get(k, true);
                if (v && (now - parseInt(v.value)) < ACTIVE_TTL) n++;
            } catch(_) {}
        }
        return Math.max(1, n);
    } catch(_) { return 1; }
}

async function statsIncrementVisits() {
    try {
        const r = await window.storage.get(STAT_VISITS_KEY, true);
        const n = r ? (parseInt(r.value) || 0) : 0;
        await window.storage.set(STAT_VISITS_KEY, String(n + 1), true);
    } catch(_) {
        try { await window.storage.set(STAT_VISITS_KEY, '1', true); } catch(__) {}
    }
}

async function statsTrackPlay(gameName) {
    try {
        const r = await window.storage.get(STAT_PLAYS_KEY, true);
        const plays = r ? JSON.parse(r.value) : {};
        plays[gameName] = (plays[gameName] || 0) + 1;
        await window.storage.set(STAT_PLAYS_KEY, JSON.stringify(plays), true);
    } catch(_) {
        try {
            await window.storage.set(STAT_PLAYS_KEY, JSON.stringify({ [gameName]: 1 }), true);
        } catch(__) {}
    }
}

async function statsSaveTime() {
    const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
    if (elapsed < 2) return;
    try {
        const r = await window.storage.get(STAT_TIME_KEY, true);
        const total = r ? (parseInt(r.value) || 0) : 0;
        await window.storage.set(STAT_TIME_KEY, String(total + elapsed), true);
    } catch(_) {}
}

function fmtTime(s) {
    if (s < 60) return s + 's';
    if (s < 3600) return Math.floor(s / 60) + 'm ' + (s % 60) + 's';
    return Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm';
}

function patchGameCards() {
    document.querySelectorAll('.game-card:not([data-locked])').forEach(card => {
        const gameName = card.dataset.game || (card.querySelector('h3') || {}).textContent || 'Unknown';
        const origOnclick = card.getAttribute('onclick');
        if (!origOnclick || card.dataset.statsWired) return;
        card.dataset.statsWired = '1';
        card.removeAttribute('onclick');
        card.addEventListener('click', () => {
            statsTrackPlay(gameName);
            try { (new Function(origOnclick)).call(card); } catch(_) {}
        });
    });
}

function toggleStatsPanel() {
    const panel = document.getElementById('stats-panel');
    if (panel.classList.contains('open')) {
        closeStatsPanel();
    } else {
        panel.classList.add('open');
        renderStatsPanel();
    }
}
function closeStatsPanel() {
    document.getElementById('stats-panel').classList.remove('open');
}

async function renderStatsPanel() {
    const loading  = document.getElementById('sp-loading');
    const content  = document.getElementById('sp-content');
    loading.style.display  = 'block';
    content.style.display  = 'none';
    try {
        const [visitR, timeR, playsR, active] = await Promise.all([
            window.storage.get(STAT_VISITS_KEY, true).catch(() => null),
            window.storage.get(STAT_TIME_KEY,   true).catch(() => null),
            window.storage.get(STAT_PLAYS_KEY,  true).catch(() => null),
            countActive()
        ]);
        const visits   = visitR ? (parseInt(visitR.value) || 0) : 0;
        const totalSec = (timeR  ? (parseInt(timeR.value)  || 0) : 0)
                       + Math.floor((Date.now() - sessionStart) / 1000);
        const plays    = playsR ? JSON.parse(playsR.value) : {};
        const sorted   = Object.entries(plays).sort((a, b) => b[1] - a[1]);
        const totalPlays = sorted.reduce((s, [, v]) => s + v, 0);
        document.getElementById('sp-active').textContent      = active;
        document.getElementById('sp-visits').textContent      = visits.toLocaleString();
        document.getElementById('sp-time').textContent        = fmtTime(totalSec);
        document.getElementById('sp-total-plays').textContent = totalPlays.toLocaleString();
        const gamesList = document.getElementById('sp-games-list');
        if (sorted.length === 0) {
            gamesList.innerHTML = '<div class="sp-stat-row"><span class="sp-stat-label" style="font-size:11px;font-style:italic">No games launched yet!</span></div>';
        } else {
            gamesList.innerHTML = sorted.map(([name, count]) => `
                <div class="sp-stat-row">
                    <span class="sp-stat-label">${name}</span>
                    <span class="sp-stat-val">${count}</span>
                </div>
            `).join('');
        }
        loading.style.display = 'none';
        content.style.display = 'block'; 
    } catch (err) {
        loading.textContent = 'Could not load stats :(';
    }
}
statsIncrementVisits();
hbSet();
setInterval(hbSet, 30000);
window.addEventListener('beforeunload', () => {
    statsSaveTime();
    hbClear();
});
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') statsSaveTime();
    else hbSet();
});
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchGameCards);
} else {
    patchGameCards();
}