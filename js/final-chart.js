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

// Initialize the final chart section
function initializeFinalChart() {
    console.log('🚀 Initializing Final Chart section...');

    // Get the chart container
    const chartContainer = document.getElementById('chart-final');
    if (!chartContainer) {
        console.warn('Final chart container not found');
        return;
    }

    // Set the byline date
    const bylineDate = document.getElementById('byline-date');
    if (bylineDate) {
        bylineDate.textContent = 'January 2026';
    }

    // Initialize scroll animations
    initializeScrollAnimations();

    console.log('✅ Final chart initialized successfully');
    console.log('📊 Data Totals:', realTotals);
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
