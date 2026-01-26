/* Final Chart JS - Regional Maritime Intelligence Summary with Real Data */

// 2025 REAL TOTALS - Update these with actual data
const realTotals = {
    light: 4125000,
    dark: 82500,
    sts: 105000,
    spoofing: 84000,
    detections: 14500000
};

// Utility function to format numbers (K/M format)
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    } else {
        return num.toString();
    }
}

// Animate counting up numbers
function animateCounter(element, targetValue, duration = 2000) {
    const startTime = performance.now();
    const startValue = 0;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeProgress);
        element.textContent = formatNumber(currentValue);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = formatNumber(targetValue);
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
                    const statTotal = document.getElementById('stat-total');
                    const statLight = document.getElementById('stat-light');
                    const statDark = document.getElementById('stat-dark');
                    const statSts = document.getElementById('stat-sts');
                    const statSpoofing = document.getElementById('stat-spoofing');

                    if (statTotal) animateCounter(statTotal, realTotals.detections, 2500);
                    if (statLight) animateCounter(statLight, realTotals.light, 2000);
                    if (statDark) animateCounter(statDark, realTotals.dark, 2000);
                    if (statSts) animateCounter(statSts, realTotals.sts, 2000);
                    if (statSpoofing) animateCounter(statSpoofing, realTotals.spoofing, 2000);
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
