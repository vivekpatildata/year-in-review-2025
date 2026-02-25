/* ============================================
   THEIA YEAR IN REVIEW 2025 - TIMELINE.JS
   Timeline Animation System - Auto-Hide Design

   BEHAVIOR:
   - On scroll/chapter change: Timeline slides DOWN into view
   - After 3 seconds: Timeline slides UP, only tracking period stays visible
   - Tracking period is always visible (compact bar at top)
   - Smooth slide animations for elegant UX
   - Dynamic prologue: Chapter 1 shows NOV/DEC 2024 within the same bar
   ============================================ */

'use strict';

/* ============================================
   TIMELINE CONFIGURATION
   ============================================ */
const TIMELINE_CONFIG = {
    year: 2025,

    autoHideDelay: 3000,

    // All possible months (14 total when prologue active, 12 normally)
    prologueMonths: [
        { id: 'nov24', label: "NOV '24", fullLabel: 'November 2024', isPrologue: true },
        { id: 'dec24', label: "DEC '24", fullLabel: 'December 2024', isPrologue: true }
    ],

    months: [
        { id: 'jan', label: 'JAN', fullLabel: 'January' },
        { id: 'feb', label: 'FEB', fullLabel: 'February' },
        { id: 'mar', label: 'MAR', fullLabel: 'March' },
        { id: 'apr', label: 'APR', fullLabel: 'April' },
        { id: 'may', label: 'MAY', fullLabel: 'May' },
        { id: 'jun', label: 'JUN', fullLabel: 'June' },
        { id: 'jul', label: 'JUL', fullLabel: 'July' },
        { id: 'aug', label: 'AUG', fullLabel: 'August' },
        { id: 'sep', label: 'SEP', fullLabel: 'September' },
        { id: 'oct', label: 'OCT', fullLabel: 'October' },
        { id: 'nov', label: 'NOV', fullLabel: 'November' },
        { id: 'dec', label: 'DEC', fullLabel: 'December' }
    ],

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
    isExpanded: false,
    isPrologueActive: false,
    notchElements: [],       // 12 main month notches
    prologueElements: [],    // 2 prologue notches (NOV '24, DEC '24)
    yearDividerEl: null,
    indicatorElement: null,
    trackElement: null,
    containerElement: null,
    autoHideTimer: null,
    lastScrollTime: 0,
    hasOnboarded: false,
    hintElement: null
};

// Normal positions: 12 months evenly across 0-100%
function getNormalPositions() {
    return TIMELINE_CONFIG.months.map((_, i) => (i / 12) * 100);
}

// Prologue positions: 14 slots, prologue months slightly compressed
// NOV'24 and DEC'24 get ~6% each, remaining 12 months share ~88%
function getProloguePositions() {
    const prologueWidth = 12; // total % for 2 prologue months
    const mainStart = prologueWidth;
    const mainSpan = 100 - mainStart;
    const prologuePos = TIMELINE_CONFIG.prologueMonths.map((_, i) => (i / 2) * prologueWidth);
    const mainPos = TIMELINE_CONFIG.months.map((_, i) => mainStart + (i / 12) * mainSpan);
    return { prologuePos, mainPos };
}


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

    trackElement.innerHTML = '';

    createMonthNotches(trackElement);
    createProgressIndicator(trackElement);

    setupTimelineInteraction();
    setupVisibilityHandler();

    hideTimeline();

    console.log('[TIMELINE] Timeline initialized with', TIMELINE_STATE.notchElements.length, 'months');
}


function createMonthNotches(container) {
    TIMELINE_STATE.notchElements = [];
    TIMELINE_STATE.prologueElements = [];

    // Create prologue notches (hidden by default)
    TIMELINE_CONFIG.prologueMonths.forEach((month) => {
        const notch = document.createElement('div');
        notch.className = 'timeline-notch timeline-prologue-notch';
        notch.dataset.month = month.id;
        notch.style.left = '0%';
        notch.style.opacity = '0';
        notch.style.pointerEvents = 'none';

        const label = document.createElement('span');
        label.className = 'timeline-notch-label';
        label.textContent = month.label;
        notch.appendChild(label);

        container.appendChild(notch);
        TIMELINE_STATE.prologueElements.push(notch);
    });

    // Year divider (hidden by default)
    const yearDiv = document.createElement('div');
    yearDiv.className = 'timeline-year-divider';
    yearDiv.innerHTML = '<span>2025</span>';
    yearDiv.style.opacity = '0';
    container.appendChild(yearDiv);
    TIMELINE_STATE.yearDividerEl = yearDiv;

    // Create main 12 month notches
    const normalPos = getNormalPositions();
    TIMELINE_CONFIG.months.forEach((month, index) => {
        const notch = document.createElement('div');
        notch.className = 'timeline-notch';
        notch.dataset.month = month.id;
        notch.dataset.index = index;
        notch.style.left = `${normalPos[index]}%`;

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
   DYNAMIC LAYOUT - Prologue Mode
   ============================================ */

function activatePrologue() {
    if (TIMELINE_STATE.isPrologueActive) return;
    TIMELINE_STATE.isPrologueActive = true;

    const { prologuePos, mainPos } = getProloguePositions();
    const trans = `left 0.5s ${TIMELINE_CONFIG.animation.easing}, opacity 0.4s ease`;

    // Slide main months to make room
    TIMELINE_STATE.notchElements.forEach((notch, i) => {
        notch.style.transition = trans;
        notch.style.left = `${mainPos[i]}%`;
    });

    // Fade in and position prologue notches
    TIMELINE_STATE.prologueElements.forEach((notch, i) => {
        notch.style.transition = trans;
        notch.style.left = `${prologuePos[i]}%`;
        notch.style.opacity = '1';
        notch.style.pointerEvents = 'auto';
        notch.classList.add('active');
    });

    // Show year divider between DEC '24 and JAN, centered in the gap
    if (TIMELINE_STATE.yearDividerEl) {
        const gapCenter = (prologuePos[1] + mainPos[0]) / 2;
        TIMELINE_STATE.yearDividerEl.style.transition = `left 0.5s ${TIMELINE_CONFIG.animation.easing}, opacity 0.4s ease 0.2s`;
        TIMELINE_STATE.yearDividerEl.style.left = `${gapCenter}%`;
        TIMELINE_STATE.yearDividerEl.style.opacity = '1';
    }
}


function deactivatePrologue() {
    if (!TIMELINE_STATE.isPrologueActive) return;
    TIMELINE_STATE.isPrologueActive = false;

    const normalPos = getNormalPositions();
    const trans = `left 0.5s ${TIMELINE_CONFIG.animation.easing}, opacity 0.3s ease`;

    // Slide main months back to normal
    TIMELINE_STATE.notchElements.forEach((notch, i) => {
        notch.style.transition = trans;
        notch.style.left = `${normalPos[i]}%`;
    });

    // Fade out prologue notches
    TIMELINE_STATE.prologueElements.forEach((notch) => {
        notch.style.transition = trans;
        notch.style.opacity = '0';
        notch.style.pointerEvents = 'none';
        notch.classList.remove('active');
    });

    // Hide year divider
    if (TIMELINE_STATE.yearDividerEl) {
        TIMELINE_STATE.yearDividerEl.style.transition = `opacity 0.2s ease`;
        TIMELINE_STATE.yearDividerEl.style.opacity = '0';
    }
}


/* ============================================
   VISIBILITY CHANGE HANDLER
   ============================================ */

function setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearAutoHideTimer();
        } else {
            if (TIMELINE_STATE.isVisible && TIMELINE_STATE.isExpanded) {
                startAutoHideTimer();
            }
        }
    });

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

    if (chapterId === 'intro') {
        hideTimeline();
        return;
    }

    let baseChapterId = chapterId;
    if (chapterId.includes('-h')) {
        baseChapterId = chapterId.split('-h')[0];
    }

    const monthIndex = TIMELINE_CONFIG.chapterMonths[chapterId] ?? TIMELINE_CONFIG.chapterMonths[baseChapterId];

    if (monthIndex === null || monthIndex === undefined) {
        console.warn(`[TIMELINE] No month mapping for: ${chapterId}`);
        return;
    }

    showTimeline();
    expandTimeline();

    TIMELINE_STATE.previousMonth = TIMELINE_STATE.currentMonth;
    TIMELINE_STATE.currentMonth = monthIndex;

    // Dynamic prologue for Chapter 1
    const isChapter1 = chapterId === 'january' || chapterId === 'january-h1' || chapterId === 'january-h2';
    if (isChapter1) {
        activatePrologue();
    } else {
        deactivatePrologue();
    }

    setActiveMonth(monthIndex);
    setCurrentMonth(monthIndex);
    updateProgressIndicator(monthIndex);
    updateDateRange(dateRange);

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
 * Update progress bar width to match current month position
 */
function updateProgressIndicator(monthIndex) {
    if (!TIMELINE_STATE.indicatorElement) return;

    // Read the current computed left position of the target notch
    const notch = TIMELINE_STATE.notchElements[monthIndex];
    if (!notch) return;

    // Use the inline style left value (which is always set as %)
    const progress = parseFloat(notch.style.left) || 0;

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
   ============================================ */

function expandTimeline() {
    const container = TIMELINE_STATE.containerElement || document.getElementById('timeline-container');
    if (!container) return;

    container.classList.add('expanded');
    container.classList.remove('collapsed');
    TIMELINE_STATE.isExpanded = true;

    if (!TIMELINE_STATE.hasOnboarded) {
        setTimeout(playOnboardingRipple, 400);
    }

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
    TIMELINE_STATE.notchElements.forEach(notch => {
        notch.classList.remove('active', 'current');
    });

    if (TIMELINE_STATE.indicatorElement) {
        TIMELINE_STATE.indicatorElement.style.width = '0%';
    }

    deactivatePrologue();

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

        gsap.fromTo('.timeline-notch:not(.timeline-prologue-notch)',
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
    const container = TIMELINE_STATE.containerElement || document.getElementById('timeline-container');
    if (container) {
        container.addEventListener('click', (e) => {
            if (!TIMELINE_STATE.isExpanded && TIMELINE_STATE.isVisible) {
                expandTimeline();
                startAutoHideTimer();
            }
        });

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
    dismissOnboarding();

    const chapterId = getChapterForMonth(monthIndex);
    if (!chapterId) return;

    const chapterElement = document.querySelector(`[data-chapter="${chapterId}"]`);
    if (chapterElement) {
        chapterElement.scrollIntoView({ behavior: 'smooth' });
    }
}


function getChapterForMonth(monthIndex) {
    for (const [chapterId, month] of Object.entries(TIMELINE_CONFIG.chapterMonths)) {
        if (month === monthIndex && !chapterId.includes('-h')) {
            return chapterId;
        }
    }
    return null;
}


/* ============================================
   ONBOARDING: First-expand ripple + click hint
   ============================================ */

function playOnboardingRipple() {
    if (TIMELINE_STATE.hasOnboarded) return;
    TIMELINE_STATE.hasOnboarded = true;

    console.log('[TIMELINE] Playing onboarding ripple');

    TIMELINE_STATE.notchElements.forEach((notch, i) => {
        setTimeout(() => {
            notch.classList.add('onboard-ping');
            setTimeout(() => notch.classList.remove('onboard-ping'), 650);
        }, i * 80);
    });

    showClickHint();
}


function showClickHint() {
    const wrapper = document.querySelector('.timeline-wrapper');
    if (!wrapper || TIMELINE_STATE.hintElement) return;

    const hint = document.createElement('div');
    hint.className = 'timeline-click-hint';
    hint.innerHTML = `
        <span class="timeline-hint-cursor"></span>
        <span class="timeline-hint-text">click any month to jump</span>
    `;
    wrapper.appendChild(hint);
    TIMELINE_STATE.hintElement = hint;

    requestAnimationFrame(() => {
        hint.classList.add('visible');
    });

    setTimeout(() => {
        if (hint.parentNode) {
            hint.classList.remove('visible');
            hint.classList.add('exiting');
            setTimeout(() => {
                if (hint.parentNode) hint.parentNode.removeChild(hint);
                TIMELINE_STATE.hintElement = null;
            }, 700);
        }
    }, 4500);
}


function dismissOnboarding() {
    if (TIMELINE_STATE.hintElement && TIMELINE_STATE.hintElement.parentNode) {
        TIMELINE_STATE.hintElement.classList.remove('visible');
        TIMELINE_STATE.hintElement.classList.add('exiting');
        const el = TIMELINE_STATE.hintElement;
        setTimeout(() => {
            if (el && el.parentNode) el.parentNode.removeChild(el);
        }, 500);
        TIMELINE_STATE.hintElement = null;
    }
}


/* ============================================
   RESPONSIVE HANDLING
   ============================================ */

function updateTimelineForMobile() {
    const isMobile = window.innerWidth <= 480;

    TIMELINE_STATE.notchElements.forEach((notch, index) => {
        const label = notch.querySelector('.timeline-notch-label');
        if (label) {
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
