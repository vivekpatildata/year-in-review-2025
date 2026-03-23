/* Final Chart JS - Global Maritime Intelligence Summary with Real Data */

// 2025 REAL TOTALS from Theia Statistics dashboard
const realTotals = {
    // Hero row
    detections:   35009404,
    areaIngested: 11838345868,

    // Core 4
    dark:       62617,
    spoofing:   76672,
    opticalSts: 84555,
    aisSts:     319250,

    // Attribution pipeline
    attributions: 11350579,
    uniqueShips:  318842,
    weeklyAttr:   73851,
    mmsiSharers:  14478,

    // Satellite ingest (daily)
    planet:   41328598,
    sentinel1: 40996503,
    sentinel2: 49134405,
    imgPerDay: 45527407,

    // Intelligence intercepts
    military:   130686,
    carriers:   1789,
    submarines: 564,
    sanctioned: 0
};

// Utility function to format numbers (K/M/B format)
function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1).replace('.0', '') + 'B';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    } else {
        return num.toLocaleString();
    }
}

// Format with full commas for large numbers (used for hero stats)
function formatNumberFull(num) {
    return num.toLocaleString();
}

// Animate counting up numbers
function animateCounter(element, targetValue, duration = 2000, useFull = false) {
    const startTime = performance.now();
    const startValue = 0;
    const formatter = useFull ? formatNumberFull : formatNumber;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeProgress);
        element.textContent = formatter(currentValue);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = formatter(targetValue);
        }
    }

    requestAnimationFrame(update);
}

// Initialize scroll-triggered animations
function initializeScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Trigger counter animations when summary stats become visible
                if (entry.target.classList.contains('summary-stats')) {
                    // Hero
                    const el = (id) => document.getElementById(id);

                    animateCounter(el('stat-total'),      realTotals.detections,   2500);
                    animateCounter(el('stat-area'),       realTotals.areaIngested, 2500);

                    // Core 4
                    animateCounter(el('stat-dark'),       realTotals.dark,       2000);
                    animateCounter(el('stat-spoofing'),   realTotals.spoofing,   2000);
                    animateCounter(el('stat-optical-sts'),realTotals.opticalSts, 2000);
                    animateCounter(el('stat-ais-sts'),    realTotals.aisSts,     2000);

                    // Satellite ticker
                    animateCounter(el('stat-planet'), realTotals.planet,   2000);
                    animateCounter(el('stat-s1'),     realTotals.sentinel1,2000);
                    animateCounter(el('stat-s2'),     realTotals.sentinel2,2000);
                    animateCounter(el('stat-img-day'),realTotals.imgPerDay,2000);

                    // Pipeline
                    animateCounter(el('stat-attributions'), realTotals.attributions, 2200);
                    animateCounter(el('stat-unique'),       realTotals.uniqueShips,  2200);
                    animateCounter(el('stat-weekly'),       realTotals.weeklyAttr,   2200);
                    animateCounter(el('stat-mmsi'),         realTotals.mmsiSharers,  2200);

                    // Intercepts
                    animateCounter(el('stat-military'),   realTotals.military,   1800);
                    animateCounter(el('stat-carriers'),   realTotals.carriers,   1800);
                    animateCounter(el('stat-subs'),       realTotals.submarines, 1800);
                }
            }
        });
    }, observerOptions);

    // Observe all animation elements
    document.querySelectorAll('.fade-in-up, .scale-in').forEach(el => {
        observer.observe(el);
    });
}

// ============================================================================
// CLOSING BREATHING GRADIENT (matches intro aesthetic)
// ============================================================================

const closingGlow = {
    BREATH_PERIOD: 16000,
    MAX_RADIUS_RATIO: 0.55,
    MIN_RADIUS_RATIO: 0.28,
    GLOWS: [
        { cx: 0.35, cy: 0.40, color: [0, 180, 200], maxAlpha: 0.14, phaseOffset: 0 },
        { cx: 0.68, cy: 0.62, color: [0, 120, 180], maxAlpha: 0.11, phaseOffset: Math.PI * 0.7 }
    ]
};

let closingRafId = null;
let closingCanvas = null;
let closingCtx = null;
let closingRunning = false;

function initClosingCanvas() {
    closingCanvas = document.getElementById('closing-canvas');
    if (!closingCanvas) return false;
    closingCtx = closingCanvas.getContext('2d');
    resizeClosingCanvas();
    window.addEventListener('resize', resizeClosingCanvas);
    return true;
}

function resizeClosingCanvas() {
    if (!closingCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = closingCanvas.parentElement.getBoundingClientRect();
    closingCanvas.width = rect.width * dpr;
    closingCanvas.height = rect.height * dpr;
    closingCanvas.style.width = rect.width + 'px';
    closingCanvas.style.height = rect.height + 'px';
    closingCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function closingTick() {
    if (!closingRunning || !closingCtx) return;

    const rect = closingCanvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const diag = Math.sqrt(w * w + h * h);
    const now = performance.now();

    closingCtx.clearRect(0, 0, w, h);
    closingCtx.fillStyle = '#000';
    closingCtx.fillRect(0, 0, w, h);

    const breathT = (now % closingGlow.BREATH_PERIOD) / closingGlow.BREATH_PERIOD;

    for (let i = 0; i < closingGlow.GLOWS.length; i++) {
        const g = closingGlow.GLOWS[i];
        const phase = breathT * Math.PI * 2 + g.phaseOffset;
        const breathVal = 0.5 + 0.5 * Math.sin(phase);

        const radius = diag * (closingGlow.MIN_RADIUS_RATIO + (closingGlow.MAX_RADIUS_RATIO - closingGlow.MIN_RADIUS_RATIO) * breathVal);
        const alpha = g.maxAlpha * (0.7 + 0.3 * breathVal);

        const cx = w * g.cx;
        const cy = h * g.cy;

        const grad = closingCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        const [r, gv, b] = g.color;
        grad.addColorStop(0,   `rgba(${r},${gv},${b},${alpha.toFixed(4)})`);
        grad.addColorStop(0.4, `rgba(${r},${gv},${b},${(alpha * 0.5).toFixed(4)})`);
        grad.addColorStop(1,   `rgba(${r},${gv},${b},0)`);

        closingCtx.fillStyle = grad;
        closingCtx.fillRect(0, 0, w, h);
    }

    closingRafId = requestAnimationFrame(closingTick);
}

function startClosingGlow() {
    if (closingRunning) return;
    if (!closingCanvas && !initClosingCanvas()) return;
    resizeClosingCanvas();
    closingRunning = true;
    closingRafId = requestAnimationFrame(closingTick);
}

function stopClosingGlow() {
    closingRunning = false;
    if (closingRafId) { cancelAnimationFrame(closingRafId); closingRafId = null; }
}

function initClosingObserver() {
    const section = document.getElementById('chart-final');
    if (!section) return;

    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startClosingGlow();
            } else {
                stopClosingGlow();
            }
        });
    }, { threshold: 0.05 });

    obs.observe(section);
}

// Initialize the final chart section
function initializeFinalChart() {
    console.log('Initializing Final Chart section...');

    const chartContainer = document.getElementById('chart-final');
    if (!chartContainer) {
        console.warn('Final chart container not found');
        return;
    }

    const bylineDate = document.getElementById('byline-date');
    if (bylineDate) {
        bylineDate.textContent = 'January 2026';
    }

    initializeScrollAnimations();
    initClosingCanvas();
    initClosingObserver();

    console.log('Final chart initialized');
}

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeFinalChart, 100);
        });
    } else {
        setTimeout(initializeFinalChart, 100);
    }
}

// Export for potential external use
if (typeof window !== 'undefined') {
    window.FinalChart = {
        initialize: initializeFinalChart,
        realTotals: realTotals,
        formatNumber: formatNumber
    };
}
