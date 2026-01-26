/* ============================================
   THEIA YEAR IN REVIEW 2025 - TIMELINE.JS
   Timeline Animation System - Auto-Hide Design

   BEHAVIOR:
   - On scroll/chapter change: Timeline slides DOWN into view
   - After 3 seconds: Timeline slides UP, only tracking period stays visible
   - Tracking period is always visible (compact bar at top)
   - Smooth slide animations for elegant UX
   - Works on visibility change (tab switching, minimize)
   ============================================ */

'use strict';

/* ============================================
   TIMELINE CONFIGURATION
   ============================================ */
const TIMELINE_CONFIG = {
    year: 2025,

    // Auto-hide timing
    autoHideDelay: 3000,  // 3 seconds before hiding months

    // Month data - position is left edge of month
    months: [
        { id: 'jan', label: 'JAN', fullLabel: 'January', position: 0 },
        { id: 'feb', label: 'FEB', fullLabel: 'February', position: 8.33 },
        { id: 'mar', label: 'MAR', fullLabel: 'March', position: 16.67 },
        { id: 'apr', label: 'APR', fullLabel: 'April', position: 25 },
        { id: 'may', label: 'MAY', fullLabel: 'May', position: 33.33 },
        { id: 'jun', label: 'JUN', fullLabel: 'June', position: 41.67 },
        { id: 'jul', label: 'JUL', fullLabel: 'July', position: 50 },
        { id: 'aug', label: 'AUG', fullLabel: 'August', position: 58.33 },
        { id: 'sep', label: 'SEP', fullLabel: 'September', position: 66.67 },
        { id: 'oct', label: 'OCT', fullLabel: 'October', position: 75 },
        { id: 'nov', label: 'NOV', fullLabel: 'November', position: 83.33 },
        { id: 'dec', label: 'DEC', fullLabel: 'December', position: 91.67 }
    ],

    // Chapter to month mapping
    chapterMonths: {
        intro: null,
        january: 0,
        'january-h1': 0,
        'january-h2': 0,
        february: 1,
        'february-h1': 1,
        march: 2,
        april: 3,
        may: 4,
        june: 5,
        july: 6,
        august: 7,
        september: 8,
        october: 9,
        november: 10,
        december: 11
    },

    // Animation settings - smoother transitions
    animation: {
        duration: 400,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
    }
};


/* ============================================
   TIMELINE STATE
   ============================================ */
const TIMELINE_STATE = {
    currentMonth: null,
    previousMonth: null,
    isVisible: false,
    isExpanded: false,  // true = full timeline visible, false = only tracking period
    notchElements: [],
    indicatorElement: null,
    trackElement: null,
    containerElement: null,
    autoHideTimer: null,
    lastScrollTime: 0
};


/* ============================================
   INITIALIZATION
   ============================================ */

function initTimeline() {
    console.log('[TIMELINE] Initializing auto-hide timeline');

    const container = document.getElementById('timeline-container');
    const trackElement = document.getElementById('timeline-track');

    if (!trackElement || !container) {
        console.warn('[TIMELINE] Timeline elements not found');
        return;
    }

    TIMELINE_STATE.containerElement = container;
    TIMELINE_STATE.trackElement = trackElement;

    // Clear existing
    trackElement.innerHTML = '';

    // Create elements
    createMonthNotches(trackElement);
    createProgressIndicator(trackElement);

    // Setup click handlers for navigation
    setupTimelineInteraction();

    // Setup visibility change handler (for tab switching/minimize)
    setupVisibilityHandler();

    // Initially hidden - will show on chapter 1
    hideTimeline();

    console.log('[TIMELINE] Timeline initialized with', TIMELINE_STATE.notchElements.length, 'months');
}


function createMonthNotches(container) {
    TIMELINE_STATE.notchElements = [];

    TIMELINE_CONFIG.months.forEach((month, index) => {
        const notch = document.createElement('div');
        notch.className = 'timeline-notch';
        notch.dataset.month = month.id;
        notch.dataset.index = index;
        notch.style.left = `${month.position}%`;

        const label = document.createElement('span');
        label.className = 'timeline-notch-label';
        label.textContent = month.label;
        notch.appendChild(label);

        container.appendChild(notch);
        TIMELINE_STATE.notchElements.push(notch);
    });
}


function createProgressIndicator(container) {
    TIMELINE_STATE.indicatorElement = document.getElementById('timeline-indicator');

    if (!TIMELINE_STATE.indicatorElement) {
        const indicator = document.createElement('div');
        indicator.className = 'timeline-indicator';
        indicator.id = 'timeline-indicator';
        container.appendChild(indicator);
        TIMELINE_STATE.indicatorElement = indicator;
    }
}


/* ============================================
   VISIBILITY CHANGE HANDLER
   Prevents issues when switching tabs/minimizing
   ============================================ */

function setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page is hidden - clear any pending timers
            clearAutoHideTimer();
        } else {
            // Page is visible again - if timeline was showing, restart the hide timer
            if (TIMELINE_STATE.isVisible && TIMELINE_STATE.isExpanded) {
                startAutoHideTimer();
            }
        }
    });

    // Also handle window focus/blur
    window.addEventListener('blur', () => {
        clearAutoHideTimer();
    });

    window.addEventListener('focus', () => {
        if (TIMELINE_STATE.isVisible && TIMELINE_STATE.isExpanded) {
            startAutoHideTimer();
        }
    });
}


/* ============================================
   AUTO-HIDE TIMER MANAGEMENT
   ============================================ */

function clearAutoHideTimer() {
    if (TIMELINE_STATE.autoHideTimer) {
        clearTimeout(TIMELINE_STATE.autoHideTimer);
        TIMELINE_STATE.autoHideTimer = null;
    }
}

function startAutoHideTimer() {
    clearAutoHideTimer();

    TIMELINE_STATE.autoHideTimer = setTimeout(() => {
        collapseTimeline();
    }, TIMELINE_CONFIG.autoHideDelay);
}


/* ============================================
   TIMELINE UPDATES - Core Logic
   ============================================ */

function updateTimeline(chapterId, dateRange) {
    console.log(`[TIMELINE] Updating for chapter: ${chapterId}`);

    // Don't show for intro
    if (chapterId === 'intro') {
        hideTimeline();
        return;
    }

    // Get base chapter for sub-chapters (e.g., january-h1 -> january)
    let baseChapterId = chapterId;
    if (chapterId.includes('-h')) {
        baseChapterId = chapterId.split('-h')[0];
    }

    const monthIndex = TIMELINE_CONFIG.chapterMonths[chapterId] ?? TIMELINE_CONFIG.chapterMonths[baseChapterId];

    if (monthIndex === null || monthIndex === undefined) {
        console.warn(`[TIMELINE] No month mapping for: ${chapterId}`);
        return;
    }

    // Show timeline and expand it (reveals month track)
    showTimeline();
    expandTimeline();

    // Store previous for comparison
    TIMELINE_STATE.previousMonth = TIMELINE_STATE.currentMonth;
    TIMELINE_STATE.currentMonth = monthIndex;

    // Update visual state
    setActiveMonth(monthIndex);
    setCurrentMonth(monthIndex);
    updateProgressIndicator(monthIndex);
    updateDateRange(dateRange);

    // Start auto-hide timer (collapses after 3 seconds)
    startAutoHideTimer();
}


/**
 * Mark all months up to and including current as "active" (completed)
 */
function setActiveMonth(monthIndex) {
    TIMELINE_STATE.notchElements.forEach((notch, index) => {
        if (index < monthIndex) {
            notch.classList.add('active');
            notch.classList.remove('current');
        } else {
            notch.classList.remove('active');
        }
    });
}


/**
 * Mark the current month with special "current" class for glowing indicator
 */
function setCurrentMonth(monthIndex) {
    TIMELINE_STATE.notchElements.forEach((notch, index) => {
        if (index === monthIndex) {
            notch.classList.add('current');
            notch.classList.add('active');
        } else {
            notch.classList.remove('current');
        }
    });
}


/**
 * Update progress bar - fills up TO the current month (not covering it)
 */
function updateProgressIndicator(monthIndex) {
    if (!TIMELINE_STATE.indicatorElement) return;

    const targetMonth = TIMELINE_CONFIG.months[monthIndex];
    if (!targetMonth) return;

    // Progress goes TO the current month position (not past it)
    const progress = targetMonth.position;

    TIMELINE_STATE.indicatorElement.style.transition = `width ${TIMELINE_CONFIG.animation.duration}ms ${TIMELINE_CONFIG.animation.easing}`;
    TIMELINE_STATE.indicatorElement.style.width = `${progress}%`;
}


function updateDateRange(dateRange) {
    const startEl = document.getElementById('date-start');
    const endEl = document.getElementById('date-end');

    if (!dateRange) {
        if (startEl) startEl.textContent = 'JAN 2025';
        if (endEl) endEl.textContent = 'DEC 2025';
        return;
    }

    if (startEl) startEl.textContent = dateRange.start || '';
    if (endEl) endEl.textContent = dateRange.end || '';
}


/* ============================================
   EXPAND/COLLAPSE CONTROLS
   Expand = Full timeline with months visible
   Collapse = Only tracking period visible
   ============================================ */

function expandTimeline() {
    const container = TIMELINE_STATE.containerElement || document.getElementById('timeline-container');
    if (!container) return;

    container.classList.add('expanded');
    container.classList.remove('collapsed');
    TIMELINE_STATE.isExpanded = true;

    console.log('[TIMELINE] Expanded - showing full timeline');
}

function collapseTimeline() {
    const container = TIMELINE_STATE.containerElement || document.getElementById('timeline-container');
    if (!container) return;

    container.classList.remove('expanded');
    container.classList.add('collapsed');
    TIMELINE_STATE.isExpanded = false;

    console.log('[TIMELINE] Collapsed - showing only tracking period');
}


/* ============================================
   VISIBILITY CONTROLS
   ============================================ */

function showTimeline() {
    const container = TIMELINE_STATE.containerElement || document.getElementById('timeline-container');
    if (container && !TIMELINE_STATE.isVisible) {
        container.classList.add('visible');
        TIMELINE_STATE.isVisible = true;
        console.log('[TIMELINE] Timeline shown');
    }
}


function hideTimeline() {
    const container = TIMELINE_STATE.containerElement || document.getElementById('timeline-container');
    if (container) {
        container.classList.remove('visible');
        container.classList.remove('expanded');
        container.classList.remove('collapsed');
        TIMELINE_STATE.isVisible = false;
        TIMELINE_STATE.isExpanded = false;
        clearAutoHideTimer();
    }
}


function showFullYearTimeline() {
    // For intro - show all months dimmed
    TIMELINE_STATE.notchElements.forEach(notch => {
        notch.classList.remove('active', 'current');
    });

    if (TIMELINE_STATE.indicatorElement) {
        TIMELINE_STATE.indicatorElement.style.width = '0%';
    }

    updateDateRange({ start: 'JAN 2025', end: 'DEC 2025' });

    TIMELINE_STATE.currentMonth = null;
}


/* ============================================
   ANIMATION UTILITIES
   ============================================ */

function animateTimelineIn() {
    const container = document.getElementById('timeline-container');
    if (!container) return;

    if (typeof gsap !== 'undefined') {
        gsap.fromTo(container,
            { opacity: 0, y: -20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }
        );

        gsap.fromTo('.timeline-notch',
            { opacity: 0, scale: 0.8 },
            {
                opacity: 1,
                scale: 1,
                duration: 0.4,
                stagger: 0.04,
                ease: 'expo.out',
                delay: 0.25
            }
        );
    }
}


/* ============================================
   INTERACTIVE FEATURES
   ============================================ */

function setupTimelineInteraction() {
    // Click on timeline container to expand it
    const container = TIMELINE_STATE.containerElement || document.getElementById('timeline-container');
    if (container) {
        container.addEventListener('click', (e) => {
            // If collapsed, expand it on click
            if (!TIMELINE_STATE.isExpanded && TIMELINE_STATE.isVisible) {
                expandTimeline();
                startAutoHideTimer();
            }
        });

        // Hover keeps it expanded
        container.addEventListener('mouseenter', () => {
            if (TIMELINE_STATE.isVisible) {
                clearAutoHideTimer();
                if (!TIMELINE_STATE.isExpanded) {
                    expandTimeline();
                }
            }
        });

        container.addEventListener('mouseleave', () => {
            if (TIMELINE_STATE.isVisible && TIMELINE_STATE.isExpanded) {
                startAutoHideTimer();
            }
        });
    }

    // Month notch clicks for navigation
    TIMELINE_STATE.notchElements.forEach((notch, index) => {
        notch.addEventListener('click', (e) => {
            e.stopPropagation();
            handleMonthClick(index);
        });
    });
}


function handleMonthClick(monthIndex) {
    const chapterId = getChapterForMonth(monthIndex);
    if (!chapterId) return;

    const chapterElement = document.querySelector(`[data-chapter="${chapterId}"]`);
    if (chapterElement) {
        chapterElement.scrollIntoView({ behavior: 'smooth' });
    }
}


function getChapterForMonth(monthIndex) {
    for (const [chapterId, month] of Object.entries(TIMELINE_CONFIG.chapterMonths)) {
        // Skip sub-chapters, return main chapter
        if (month === monthIndex && !chapterId.includes('-h')) {
            return chapterId;
        }
    }
    return null;
}


/* ============================================
   RESPONSIVE HANDLING
   ============================================ */

function updateTimelineForMobile() {
    const isMobile = window.innerWidth <= 480;

    TIMELINE_STATE.notchElements.forEach((notch, index) => {
        const label = notch.querySelector('.timeline-notch-label');
        if (label) {
            // On mobile, show every 3rd label
            if (isMobile && index % 3 !== 0) {
                label.style.display = 'none';
            } else {
                label.style.display = '';
            }
        }
    });
}

window.addEventListener('resize', updateTimelineForMobile);


/* ============================================
   EXPORTS
   ============================================ */
window.initTimeline = initTimeline;
window.updateTimeline = updateTimeline;
window.showTimeline = showTimeline;
window.hideTimeline = hideTimeline;
window.showFullYearTimeline = showFullYearTimeline;
window.animateTimelineIn = animateTimelineIn;
window.expandTimeline = expandTimeline;
window.collapseTimeline = collapseTimeline;
window.TIMELINE_CONFIG = TIMELINE_CONFIG;
window.TIMELINE_STATE = TIMELINE_STATE;

// TimelineUtils for chapter animations
window.TimelineUtils = {
    showTimeline,
    hideTimeline,
    updateTimeline,
    showFullYearTimeline,
    setActiveMonth,
    setCurrentMonth,
    updateProgressIndicator,
    updateDateRange,
    animateTimelineIn,
    expandTimeline,
    collapseTimeline,
    getState: () => TIMELINE_STATE
};

console.log('[TIMELINE] Timeline module loaded (auto-hide version)');
