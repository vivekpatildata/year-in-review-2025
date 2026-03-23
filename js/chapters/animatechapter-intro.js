// ============================================================================
// CHAPTER: INTRO - Breathing Gradient
// Pure canvas animation — no map dependency
// Subtle, slow radial glow that breathes over pure black.
// Restrained, premium, cinematic.
// ============================================================================

function animateChapterIntro(map, chapterConfig) {
    console.log('[Intro] Initializing breathing gradient');

    // ========================================================================
    // CONFIG
    // ========================================================================

    const CFG = {
        BREATH_PERIOD: 14000,
        MAX_RADIUS_RATIO: 0.60,
        MIN_RADIUS_RATIO: 0.32,

        GLOWS: [
            { cx: 0.38, cy: 0.46, color: [0, 180, 200],  maxAlpha: 0.17, phaseOffset: 0 },
            { cx: 0.64, cy: 0.54, color: [0, 120, 180],   maxAlpha: 0.14, phaseOffset: Math.PI * 0.65 }
        ]
    };

    // ========================================================================
    // STATE
    // ========================================================================

    let running     = false;
    let rafId       = null;
    let canvas      = null;
    let ctx         = null;
    const timeouts  = [];

    // ========================================================================
    // CANVAS SETUP
    // ========================================================================

    function initCanvas() {
        canvas = document.getElementById('intro-particles-canvas');
        if (!canvas) return false;
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
        return true;
    }

    function resize() {
        if (!canvas) return;
        const dpr  = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width  = rect.width  * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width  = rect.width  + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ========================================================================
    // RENDER
    // ========================================================================

    function tick() {
        if (!running || !ctx) return;

        const rect = canvas.parentElement.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const diag = Math.sqrt(w * w + h * h);
        const now  = performance.now();

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        const breathT = (now % CFG.BREATH_PERIOD) / CFG.BREATH_PERIOD;

        for (let i = 0; i < CFG.GLOWS.length; i++) {
            const g = CFG.GLOWS[i];
            const phase = breathT * Math.PI * 2 + g.phaseOffset;
            const breathVal = 0.5 + 0.5 * Math.sin(phase);

            const radius = diag * (CFG.MIN_RADIUS_RATIO + (CFG.MAX_RADIUS_RATIO - CFG.MIN_RADIUS_RATIO) * breathVal);
            const alpha  = g.maxAlpha * (0.7 + 0.3 * breathVal);

            const cx = w * g.cx;
            const cy = h * g.cy;

            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            const [r, gv, b] = g.color;
            grad.addColorStop(0,   `rgba(${r},${gv},${b},${alpha.toFixed(4)})`);
            grad.addColorStop(0.4, `rgba(${r},${gv},${b},${(alpha * 0.5).toFixed(4)})`);
            grad.addColorStop(1,   `rgba(${r},${gv},${b},0)`);

            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        }

        rafId = requestAnimationFrame(tick);
    }

    // ========================================================================
    // TEXT HIGHLIGHTS
    // ========================================================================

    function triggerHighlights() {
        const highlights = document.querySelectorAll('.intro-highlight');
        if (!highlights.length) return;
        const tid = setTimeout(() => {
            if (!running) return;
            highlights.forEach(el => el.classList.add('active'));
        }, 600);
        timeouts.push(tid);
    }

    function clearHighlights() {
        const highlights = document.querySelectorAll('.intro-highlight');
        highlights.forEach(el => el.classList.remove('active'));
    }

    // ========================================================================
    // EMPHASIS PARAGRAPH — WORD-BY-WORD REVEAL
    // ========================================================================

    let emphasisOriginalHTML = null;

    function prepareEmphasis() {
        const para = document.getElementById('intro-emphasis-para');
        if (!para || para.querySelector('.intro-word')) return;

        emphasisOriginalHTML = para.innerHTML;

        // Walk through child nodes, wrap text nodes into word spans
        // while preserving <em> and other inline elements
        function wrapTextNodes(node) {
            const frag = document.createDocumentFragment();
            node.childNodes.forEach(child => {
                if (child.nodeType === 3) { // text node
                    const words = child.textContent.split(/(\s+)/);
                    words.forEach(w => {
                        if (/^\s+$/.test(w)) {
                            frag.appendChild(document.createTextNode(w));
                        } else if (w) {
                            const span = document.createElement('span');
                            span.className = 'intro-word';
                            span.textContent = w;
                            frag.appendChild(span);
                        }
                    });
                } else if (child.nodeType === 1) { // element (em, strong, etc.)
                    const wrapper = document.createElement(child.tagName.toLowerCase());
                    [...child.attributes].forEach(a => wrapper.setAttribute(a.name, a.value));
                    const inner = wrapTextNodes(child);
                    wrapper.appendChild(inner);
                    const span = document.createElement('span');
                    span.className = 'intro-word';
                    span.appendChild(wrapper);
                    frag.appendChild(span);
                }
            });
            return frag;
        }

        const wrapped = wrapTextNodes(para);
        para.innerHTML = '';
        para.appendChild(wrapped);
    }

    function triggerEmphasisReveal() {
        const para = document.getElementById('intro-emphasis-para');
        if (!para) return;

        const words = para.querySelectorAll('.intro-word');
        if (!words.length) return;

        const staggerMs = 40;
        const baseDelay = 2800; // starts after other elements have appeared

        words.forEach((word, i) => {
            const tid = setTimeout(() => {
                if (!running) return;
                word.style.transitionDelay = '0ms';
                word.style.color = 'rgba(255, 255, 255, 0.92)';
            }, baseDelay + i * staggerMs);
            timeouts.push(tid);
        });
    }

    function resetEmphasis() {
        const para = document.getElementById('intro-emphasis-para');
        if (!para) return;
        if (emphasisOriginalHTML !== null) {
            para.innerHTML = emphasisOriginalHTML;
            emphasisOriginalHTML = null;
        }
    }

    // ========================================================================
    // TAGLINE — WORD-BY-WORD REVEAL
    // ========================================================================

    let taglineOriginalHTML = null;

    function prepareTagline() {
        const el = document.getElementById('intro-tagline-text');
        if (!el || el.querySelector('.intro-word')) return;

        taglineOriginalHTML = el.innerHTML;

        const words = el.textContent.split(/(\s+)/);
        el.innerHTML = '';
        words.forEach(w => {
            if (/^\s+$/.test(w)) {
                el.appendChild(document.createTextNode(w));
            } else if (w) {
                const span = document.createElement('span');
                span.className = 'intro-word';
                span.textContent = w;
                el.appendChild(span);
            }
        });
    }

    function triggerTaglineReveal() {
        const el = document.getElementById('intro-tagline-text');
        if (!el) return;

        const words = el.querySelectorAll('.intro-word');
        if (!words.length) return;

        const staggerMs = 120;
        const baseDelay = 5200;

        words.forEach((word, i) => {
            const tid = setTimeout(() => {
                if (!running) return;
                word.style.color = 'rgba(255, 255, 255, 0.55)';
            }, baseDelay + i * staggerMs);
            timeouts.push(tid);
        });
    }

    function resetTagline() {
        const el = document.getElementById('intro-tagline-text');
        if (!el) return;
        if (taglineOriginalHTML !== null) {
            el.innerHTML = taglineOriginalHTML;
            taglineOriginalHTML = null;
        }
    }

    // ========================================================================
    // SHOW / CLEANUP
    // ========================================================================

    function showMain() {
        console.log('[Intro] Starting breathing gradient');
        cleanup();
        running = true;

        const overlay = document.getElementById('intro-overlay');
        if (overlay) overlay.classList.remove('hidden');

        if (!initCanvas()) {
            console.warn('[Intro] Canvas not found');
            return;
        }

        rafId = requestAnimationFrame(tick);

        prepareEmphasis();
        prepareTagline();

        const screen = document.getElementById('intro-screen');
        if (screen) {
            const tid = setTimeout(() => {
                if (running && screen) screen.classList.add('is-visible');
            }, 200);
            timeouts.push(tid);
        }

        triggerHighlights();
        triggerEmphasisReveal();
        triggerTaglineReveal();
    }

    function cleanup() {
        console.log('[Intro] Cleanup');
        running = false;

        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        timeouts.forEach(id => clearTimeout(id));
        timeouts.length = 0;

        clearHighlights();
        resetEmphasis();
        resetTagline();
        window.removeEventListener('resize', resize);

        const screen = document.getElementById('intro-screen');
        if (screen) screen.classList.remove('is-visible');

        const overlay = document.getElementById('intro-overlay');
        if (overlay) overlay.classList.add('hidden');

        if (ctx && canvas) {
            const rect = canvas.parentElement
                ? canvas.parentElement.getBoundingClientRect()
                : { width: 0, height: 0 };
            ctx.clearRect(0, 0, rect.width, rect.height);
        }

        ctx    = null;
        canvas = null;
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    return {
        showMain,
        cleanup,
        stop: cleanup,
        getProgress: () => 0,
        isComplete: () => false
    };
}

window.animateChapterIntro = animateChapterIntro;
