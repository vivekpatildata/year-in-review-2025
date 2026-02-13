/* ============================================
   THEIA YEAR IN REVIEW 2025 - LUMIA LIVE TILES
   Square grid + non-adjacent highlighting
   ============================================ */

'use strict';

const LUMIA_CONFIG = {
    containerId: 'opening-media',
    highlightCount: 5,
    cycleInterval: 2800,
    
    // Images - add wide: true manually for SAR/panoramic images you want to show wider
    images: [
        'images/chapter1/chapter1A.png',
        'images/chapter1/chapter1B.png',
        'images/chapter1/chapter1C.png',
        'images/chapter1/chapter1D.png',
        'images/chapter1/chapter1E.png',
        'images/chapter2/chapter2A.png',
        'images/chapter2/chapter2B.png',
        'images/chapter2/chapter2C.png',
        'images/chapter2/chapter2D.png',
        'images/chapter2/chapter2E.png',
        'images/chapter2/chapter2F.png',
        'images/chapter3/chapter3A.png',
        'images/chapter3/chapter3B.png',
        'images/chapter3/chapter3C.png',
        'images/chapter3/chapter3D.png',
        'images/chapter4/chapter4A.png',
        'images/chapter4/chapter4B.png',
        'images/chapter4/chapter4C.png',
        'images/chapter5/chapter5A.png',
        'images/chapter5/chapter5B.png',
        'images/chapter5/chapter5C.png',
        'images/chapter5/chapter5D.png',
        'images/chapter6/chapter6A.png',
        'images/chapter6/chapter6B.png',
        'images/chapter6/chapter6C.png',
        'images/chapter6/chapter6D.png',
        'images/chapter7/chapter7A.png',
        'images/chapter7/chapter7B.png',
        'images/chapter7/chapter7C.png',
        'images/chapter7/chapter7D.png',
        'images/chapter8/chapter8A.png',
        'images/chapter8/chapter8B.png',
        'images/chapter8/chapter8C.png',
        'images/chapter8/chapter8D.png',
        'images/chapter8/chapter8E.png',
        'images/chapter8/chapter8F.png',
        'images/chapter9/chapter9A.png',
        'images/chapter9/chapter9B.png',
        'images/chapter9/chapter9C.png',
        'images/chapter11/chapter11A.png',
        'images/chapter11/chapter11B.png',
        'images/chapter11/chapter11C.png',
        'images/chapter11/chapter11D.png',
        'images/chapter11/chapter11E.png',
        'images/chapter12/chapter12A.png',
        'images/chapter12/chapter12B.png',
        'images/chapter12/chapter12C.png',
        'images/chapter12/chapter12D.png'
        // To mark an image as wide, use object format: { src: 'path/to/image.png', wide: true }
    ]
};

let state = {
    tiles: [],
    highlighted: new Set(),
    timer: null
};

/* ============================================
   STYLES
   ============================================ */
function injectStyles() {
    if (document.getElementById('lumia-styles')) return;
    
    const css = `
        .lumia-wrap {
            position: absolute;
            inset: 0;
            overflow: hidden;
            background: #050508;
        }
        
        /* Subtle noise/grain overlay */
        .lumia-noise {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 4;
            opacity: 0.035;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
            background-repeat: repeat;
            background-size: 200px 200px;
        }
        
        /* Vignette - subtle edge darkening */
        .lumia-vignette {
            position: absolute;
            inset: 0;
            background: radial-gradient(
                ellipse at 35% 50%,
                transparent 30%,
                rgba(0, 0, 0, 0.4) 65%,
                rgba(0, 0, 0, 0.75) 100%
            );
            pointer-events: none;
            z-index: 2;
        }
        
        /* Ambient glow behind grid - 2024 style */
        .lumia-glow {
            position: absolute;
            top: 50%;
            left: 35%;
            transform: translate(-50%, -50%);
            width: 75%;
            height: 100%;
            background: radial-gradient(
                ellipse at center,
                rgba(0, 255, 255, 0.15) 0%,
                rgba(0, 200, 255, 0.10) 30%,
                rgba(0, 150, 200, 0.05) 50%,
                transparent 70%
            );
            filter: blur(50px);
            pointer-events: none;
            z-index: 0;
        }
        
        /* Square grid */
        .lumia-grid {
            position: absolute;
            top: 50%;
            left: 0;
            transform: translateY(-50%) translate(0px, 0px);
            width: 70%;
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 0;
            z-index: 1;
            filter: drop-shadow(0 0 50px rgba(0, 255, 255, 0.3));
            transition: transform 0.15s ease-out;
            will-change: transform;
        }
        
        /* Square tile */
        .lumia-tile {
            position: relative;
            width: 100%;
            aspect-ratio: 1 / 1;
            overflow: hidden;
            opacity: 0;
            transition: 
                transform 0.7s cubic-bezier(0.4, 0, 0.2, 1),
                z-index 0s 0.35s,
                opacity 0.5s ease;
        }
        
        .lumia-tile.show {
            opacity: 1;
        }
        
        /* Highlighted - scales up */
        .lumia-tile.highlight {
            transform: scale(1.5);
            z-index: 10;
            transition: 
                transform 0.7s cubic-bezier(0.4, 0, 0.2, 1),
                z-index 0s 0s,
                opacity 0.5s ease;
        }
        
        /* Wide images - show wider when highlighted */
        .lumia-tile.wide.highlight {
            transform: scale(1.5) scaleX(1.4);
        }
        
        .lumia-tile.wide.highlight img {
            object-fit: contain;
            background: #050508;
        }
        
        /* Image - proper square crop */
        .lumia-tile img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
            filter: brightness(0.8) saturate(0.95);
            transition: filter 0.7s ease;
        }
        
        .lumia-tile.highlight img {
            filter: brightness(1.1) saturate(1.2) contrast(1.15);
        }
        
        .lumia-tile:hover img {
            filter: brightness(1) saturate(1.1);
        }
        
        /* Hover glow ring */
        .lumia-tile::before {
            content: '';
            position: absolute;
            inset: 0;
            border: 2px solid transparent;
            pointer-events: none;
            z-index: 5;
            transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        
        .lumia-tile:hover::before {
            border-color: rgba(0, 220, 255, 0.6);
            box-shadow: 
                inset 0 0 15px rgba(0, 220, 255, 0.2),
                0 0 8px rgba(0, 220, 255, 0.3);
        }
        
        /* Subtle glow on highlight only */
        .lumia-tile.highlight::after {
            content: '';
            position: absolute;
            inset: 0;
            box-shadow: 0 0 20px rgba(0, 180, 255, 0.15);
            pointer-events: none;
        }
        
        /* Fade to title */
        .lumia-fade {
            position: absolute;
            top: 0;
            right: 28%;
            bottom: 0;
            width: 6%;
            background: linear-gradient(
                to right,
                transparent 0%,
                rgba(5, 5, 8, 0.6) 40%,
                rgba(5, 5, 8, 1) 100%
            );
            pointer-events: none;
            z-index: 15;
        }
        
        /* Responsive */
        @media (max-width: 1024px) {
            .lumia-grid {
                width: 100%;
                grid-template-columns: repeat(8, 1fr);
            }
            
            .lumia-tile.highlight {
                transform: scale(1.4);
            }
            
            .lumia-tile.wide.highlight {
                transform: scale(1.4) scaleX(1.3);
            }
            
            .lumia-fade {
                display: none;
            }
        }
        
        @media (max-width: 768px) {
            .lumia-grid {
                grid-template-columns: repeat(6, 1fr);
            }
            
            .lumia-tile.highlight {
                transform: scale(1.35);
            }
            
            .lumia-tile.wide.highlight {
                transform: scale(1.35) scaleX(1.25);
            }
        }
        
        @media (max-width: 480px) {
            .lumia-grid {
                grid-template-columns: repeat(5, 1fr);
            }
            
            .lumia-tile.wide.highlight {
                transform: scale(1.3) scaleX(1.2);
            }
        }
    `;
    
    const style = document.createElement('style');
    style.id = 'lumia-styles';
    style.textContent = css;
    document.head.appendChild(style);
}

/* ============================================
   UTILS
   ============================================ */
const COLS = 8;

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Get neighbors of a tile (including diagonals)
function getNeighbors(idx, total) {
    const row = Math.floor(idx / COLS);
    const col = idx % COLS;
    const neighbors = [];
    
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < Math.ceil(total / COLS) && nc >= 0 && nc < COLS) {
                const ni = nr * COLS + nc;
                if (ni < total) neighbors.push(ni);
            }
        }
    }
    return neighbors;
}

// Check if tile is on left or right edge
function isEdgeTile(idx) {
    const col = idx % COLS;
    return col === 0 || col === COLS - 1;
}

// Get indices that aren't adjacent to any highlighted tile
function getRandomIndices(count, max, highlighted = new Set()) {
    // Build exclusion set: highlighted + their neighbors
    const excluded = new Set(highlighted);
    highlighted.forEach(idx => {
        getNeighbors(idx, max).forEach(n => excluded.add(n));
    });
    
    const available = [];
    for (let i = 0; i < max; i++) {
        // Exclude edge tiles (first and last columns)
        if (!excluded.has(i) && !isEdgeTile(i)) available.push(i);
    }
    
    // Pick non-adjacent indices
    const result = [];
    const shuffled = shuffle(available);
    
    for (const idx of shuffled) {
        if (result.length >= count) break;
        
        // Check this idx isn't adjacent to any already picked
        const neighbors = getNeighbors(idx, max);
        const isAdjacent = result.some(r => neighbors.includes(r));
        
        if (!isAdjacent) {
            result.push(idx);
        }
    }
    
    return result;
}

/* ============================================
   CREATE DOM
   ============================================ */
function createDOM() {
    const container = document.getElementById(LUMIA_CONFIG.containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    const wrap = document.createElement('div');
    wrap.className = 'lumia-wrap';
    
    const grid = document.createElement('div');
    grid.className = 'lumia-grid';
    
    const images = shuffle(LUMIA_CONFIG.images);
    state.tiles = [];
    
    images.forEach((img, i) => {
        // Support both string and object format
        const isObject = typeof img === 'object';
        const src = isObject ? img.src : img;
        const isWide = isObject && img.wide;
        
        const tile = document.createElement('div');
        tile.className = 'lumia-tile' + (isWide ? ' wide' : '');
        tile.dataset.index = i;
        tile.innerHTML = `<img src="${src}" alt="" loading="lazy" />`;
        grid.appendChild(tile);
        state.tiles.push(tile);
    });
    
    // Ambient glow behind grid
    const glow = document.createElement('div');
    glow.className = 'lumia-glow';
    wrap.appendChild(glow);
    
    wrap.appendChild(grid);
    
    const fade = document.createElement('div');
    fade.className = 'lumia-fade';
    wrap.appendChild(fade);
    
    // Vignette overlay
    const vignette = document.createElement('div');
    vignette.className = 'lumia-vignette';
    wrap.appendChild(vignette);
    
    // Noise/grain overlay
    const noise = document.createElement('div');
    noise.className = 'lumia-noise';
    wrap.appendChild(noise);
    
    container.appendChild(wrap);
}

/* ============================================
   ANIMATIONS
   ============================================ */
function animateIn() {
    const cols = 8;
    state.tiles.forEach((tile, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const delay = (row * 60) + (col * 40) + Math.random() * 40;
        setTimeout(() => tile.classList.add('show'), delay);
    });
}

function cycleHighlights() {
    const total = state.tiles.length;
    
    // Remove half current highlights
    const current = Array.from(state.highlighted);
    const removeCount = Math.ceil(current.length / 2);
    
    for (let i = 0; i < removeCount && current.length > 0; i++) {
        const idx = current.splice(Math.floor(Math.random() * current.length), 1)[0];
        state.highlighted.delete(idx);
        state.tiles[idx].classList.remove('highlight');
    }
    
    // Add new highlights (non-adjacent)
    const needed = LUMIA_CONFIG.highlightCount - state.highlighted.size;
    const newOnes = getRandomIndices(needed, total, state.highlighted);
    
    newOnes.forEach((idx, i) => {
        setTimeout(() => {
            state.highlighted.add(idx);
            state.tiles[idx].classList.add('highlight');
        }, i * 120);
    });
}

function startLoop() {
    // Initial highlights
    setTimeout(() => {
        const initial = getRandomIndices(LUMIA_CONFIG.highlightCount, state.tiles.length);
        initial.forEach((idx, i) => {
            setTimeout(() => {
                state.highlighted.add(idx);
                state.tiles[idx].classList.add('highlight');
            }, i * 180);
        });
    }, 1200);
    
    // Cycle
    setTimeout(() => {
        state.timer = setInterval(cycleHighlights, LUMIA_CONFIG.cycleInterval);
    }, 2500);
}

/* ============================================
   MOUSE PARALLAX (disabled)
   ============================================ */
function initParallax() {
    // Parallax removed — no-op
}

/* ============================================
   INIT
   ============================================ */
function init() {
    injectStyles();
    createDOM();
    setTimeout(animateIn, 100);
    startLoop();
    initParallax();
}

window.addEventListener('beforeunload', () => {
    if (state.timer) clearInterval(state.timer);
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
