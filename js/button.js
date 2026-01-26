/* ============================================
   THEIA YEAR IN REVIEW 2025 - BUTTON.JS
   Button Handlers & Panel Interactions
   
   STRUCTURE:
   1. State Management
   2. CTA Button Handlers
   3. Panel Controls
   4. Navigation Controls
   5. Share/Export Functions
   6. Keyboard Shortcuts
   7. Initialization
   ============================================ */

'use strict';

/* ============================================
   1. STATE MANAGEMENT
   Purpose: button-state-tracking
   ============================================ */
const BUTTON_STATE = {
    // Panels
    vesselPanelOpen: false,
    legendPanelOpen: true,
    infoPanelOpen: true,
    miniMapExpanded: false,
    
    // Navigation
    isScrolling: false,
    currentSection: 'opening',
    
    // Modals
    activeModal: null,
    
    // Touch tracking
    touchStartY: 0,
    touchStartX: 0
};


/* ============================================
   2. CTA BUTTON HANDLERS
   Purpose: call-to-action-buttons
   ============================================ */

// Purpose: handle-contact-click
function handleContactClick(event) {
    event.preventDefault();
    
    const contactUrl = 'https://synmax.com/contact';
    const contactEmail = 'theia@synmax.com';
    
    // Track analytics if available
    if (window.gtag) {
        gtag('event', 'cta_click', {
            'event_category': 'engagement',
            'event_label': 'contact_theia'
        });
    }
    
    // Open contact page in new tab
    window.open(contactUrl, '_blank', 'noopener,noreferrer');
    
    Utils.debugLog('Contact CTA clicked');
}

// Purpose: handle-demo-click
function handleDemoClick(event) {
    event.preventDefault();
    
    const demoUrl = 'https://synmax.com/theia/demo';
    
    if (window.gtag) {
        gtag('event', 'cta_click', {
            'event_category': 'engagement',
            'event_label': 'request_demo'
        });
    }
    
    window.open(demoUrl, '_blank', 'noopener,noreferrer');
    
    Utils.debugLog('Demo CTA clicked');
}

// Purpose: handle-learn-more-click
function handleLearnMoreClick(event) {
    event.preventDefault();
    
    const learnMoreUrl = 'https://synmax.com/theia';
    
    if (window.gtag) {
        gtag('event', 'cta_click', {
            'event_category': 'engagement',
            'event_label': 'learn_more'
        });
    }
    
    window.open(learnMoreUrl, '_blank', 'noopener,noreferrer');
    
    Utils.debugLog('Learn More CTA clicked');
}

// Purpose: handle-scroll-explore
function handleScrollExplore(event) {
    if (event) event.preventDefault();
    
    const introSection = document.querySelector('#intro-section');
    if (introSection) {
        introSection.scrollIntoView({ behavior: 'smooth' });
        
        if (window.gtag) {
            gtag('event', 'scroll_explore', {
                'event_category': 'navigation',
                'event_label': 'opening_to_intro'
            });
        }
    }
    
    Utils.debugLog('Scroll to explore triggered');
}


/* ============================================
   3. PANEL CONTROLS
   Purpose: panel-toggle-handlers
   ============================================ */

// Purpose: toggle-vessel-panel
function toggleVesselPanel() {
    const panel = document.querySelector('.vessel-panel');
    if (!panel) return;
    
    BUTTON_STATE.vesselPanelOpen = !BUTTON_STATE.vesselPanelOpen;
    
    if (BUTTON_STATE.vesselPanelOpen) {
        panel.classList.add('open');
        panel.setAttribute('aria-expanded', 'true');
    } else {
        panel.classList.remove('open');
        panel.setAttribute('aria-expanded', 'false');
    }
    
    Utils.debugLog('Vessel panel toggled:', BUTTON_STATE.vesselPanelOpen);
}

// Purpose: toggle-legend-panel
function toggleLegendPanel() {
    const panel = document.querySelector('.legend-container');
    if (!panel) return;
    
    BUTTON_STATE.legendPanelOpen = !BUTTON_STATE.legendPanelOpen;
    
    if (BUTTON_STATE.legendPanelOpen) {
        panel.classList.remove('collapsed');
        panel.setAttribute('aria-expanded', 'true');
    } else {
        panel.classList.add('collapsed');
        panel.setAttribute('aria-expanded', 'false');
    }
    
    Utils.debugLog('Legend panel toggled:', BUTTON_STATE.legendPanelOpen);
}

// Purpose: toggle-info-panel
function toggleInfoPanel() {
    const panel = document.querySelector('.chapter-info');
    if (!panel) return;
    
    BUTTON_STATE.infoPanelOpen = !BUTTON_STATE.infoPanelOpen;
    
    if (BUTTON_STATE.infoPanelOpen) {
        panel.classList.remove('collapsed');
    } else {
        panel.classList.add('collapsed');
    }
    
    Utils.debugLog('Info panel toggled:', BUTTON_STATE.infoPanelOpen);
}

// Purpose: toggle-mini-map
function toggleMiniMap() {
    const miniMap = document.querySelector('.mini-map-container');
    if (!miniMap) return;
    
    BUTTON_STATE.miniMapExpanded = !BUTTON_STATE.miniMapExpanded;
    
    if (BUTTON_STATE.miniMapExpanded) {
        miniMap.classList.add('expanded');
    } else {
        miniMap.classList.remove('expanded');
    }
    
    // Resize minimap if MapUtils available
    if (window.MapUtils && window.MapUtils.resizeMiniMap) {
        setTimeout(() => {
            window.MapUtils.resizeMiniMap();
        }, 300);
    }
    
    Utils.debugLog('Mini map toggled:', BUTTON_STATE.miniMapExpanded);
}

// Purpose: close-all-panels
function closeAllPanels() {
    const vesselPanel = document.querySelector('.vessel-panel');
    const legendPanel = document.querySelector('.legend-container');
    
    if (vesselPanel) {
        vesselPanel.classList.remove('open');
        BUTTON_STATE.vesselPanelOpen = false;
    }
    
    if (legendPanel) {
        legendPanel.classList.add('collapsed');
        BUTTON_STATE.legendPanelOpen = false;
    }
    
    Utils.debugLog('All panels closed');
}

// Purpose: open-vessel-panel
function openVesselPanel() {
    const panel = document.querySelector('.vessel-panel');
    if (!panel) return;
    
    BUTTON_STATE.vesselPanelOpen = true;
    panel.classList.add('open');
    panel.setAttribute('aria-expanded', 'true');
}

// Purpose: close-vessel-panel
function closeVesselPanel() {
    const panel = document.querySelector('.vessel-panel');
    if (!panel) return;
    
    BUTTON_STATE.vesselPanelOpen = false;
    panel.classList.remove('open');
    panel.setAttribute('aria-expanded', 'false');
}


/* ============================================
   4. NAVIGATION CONTROLS
   Purpose: chapter-navigation-handlers
   ============================================ */

// Purpose: scroll-to-chapter
function scrollToChapter(chapterId) {
    const chapter = document.querySelector(`[data-chapter="${chapterId}"]`);
    if (!chapter) {
        Utils.debugWarn('Chapter not found:', chapterId);
        return;
    }
    
    chapter.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    if (window.gtag) {
        gtag('event', 'chapter_navigation', {
            'event_category': 'navigation',
            'event_label': chapterId
        });
    }
    
    Utils.debugLog('Scrolling to chapter:', chapterId);
}

// Purpose: navigate-to-month
function navigateToMonth(month) {
    const monthMap = {
        '01': 'january', '02': 'february', '03': 'march',
        '04': 'april', '05': 'may', '06': 'june',
        '07': 'july', '08': 'august', '09': 'september',
        '10': 'october', '11': 'november', '12': 'december'
    };
    
    const chapterId = monthMap[month] || month.toLowerCase();
    scrollToChapter(chapterId);
}

// Purpose: go-to-previous-chapter
function goToPreviousChapter() {
    if (!window.MapUtils) return;
    
    const chapters = ['intro', 'january', 'february', 'march', 'april', 'may',
                     'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const currentIndex = chapters.indexOf(window.MapUtils.getCurrentChapter());
    
    if (currentIndex > 0) {
        scrollToChapter(chapters[currentIndex - 1]);
    }
}

// Purpose: go-to-next-chapter
function goToNextChapter() {
    if (!window.MapUtils) return;
    
    const chapters = ['intro', 'january', 'february', 'march', 'april', 'may',
                     'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const currentIndex = chapters.indexOf(window.MapUtils.getCurrentChapter());
    
    if (currentIndex < chapters.length - 1) {
        scrollToChapter(chapters[currentIndex + 1]);
    }
}

// Purpose: scroll-to-top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    Utils.debugLog('Scrolled to top');
}

// Purpose: scroll-to-stats
function scrollToStats() {
    const statsSection = document.querySelector('#stats-section');
    if (statsSection) {
        statsSection.scrollIntoView({ behavior: 'smooth' });
    }
}


/* ============================================
   5. SHARE/EXPORT FUNCTIONS
   Purpose: share-export-handlers
   ============================================ */

// Purpose: share-current-view
function shareCurrentView() {
    const currentChapter = window.MapUtils ? window.MapUtils.getCurrentChapter() : 'intro';
    const shareUrl = `${window.location.origin}${window.location.pathname}#${currentChapter}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'SynMax Theia: Year in Review 2025',
            text: 'Explore maritime intelligence stories from 2025',
            url: shareUrl
        }).catch(err => {
            Utils.debugLog('Share cancelled:', err);
        });
    } else {
        copyToClipboard(shareUrl);
        showNotification('Link copied to clipboard!');
    }
    
    if (window.gtag) {
        gtag('event', 'share', {
            'event_category': 'engagement',
            'event_label': currentChapter
        });
    }
}

// Purpose: copy-text-clipboard
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    }
    
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
    } catch (err) {
        Utils.debugError('Copy failed:', err);
    }
    
    document.body.removeChild(textarea);
}

// Purpose: show-notification-toast
function showNotification(message, duration = 3000) {
    // Remove existing notification
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Trigger animation
    Utils.nextFrame(() => {
        toast.classList.add('visible');
    });
    
    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Purpose: download-current-screenshot
async function downloadScreenshot() {
    showNotification('Preparing screenshot...');
    
    // This would require html2canvas library
    if (typeof html2canvas === 'undefined') {
        showNotification('Screenshot feature not available');
        return;
    }
    
    try {
        const mapContainer = document.querySelector('#map');
        const canvas = await html2canvas(mapContainer);
        
        const link = document.createElement('a');
        link.download = `theia-yir-2025-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        showNotification('Screenshot downloaded!');
    } catch (error) {
        Utils.debugError('Screenshot failed:', error);
        showNotification('Screenshot failed');
    }
}


/* ============================================
   6. KEYBOARD SHORTCUTS
   Purpose: keyboard-navigation-handlers
   ============================================ */

// Purpose: handle-keyboard-events
function handleKeyboardNavigation(event) {
    // Don't handle if in input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
            event.preventDefault();
            goToPreviousChapter();
            break;
            
        case 'ArrowRight':
        case 'ArrowDown':
            event.preventDefault();
            goToNextChapter();
            break;
            
        case 'Home':
            event.preventDefault();
            scrollToTop();
            break;
            
        case 'End':
            event.preventDefault();
            scrollToStats();
            break;
            
        case 'Escape':
            closeAllPanels();
            break;
            
        case 'l':
        case 'L':
            if (!event.ctrlKey && !event.metaKey) {
                toggleLegendPanel();
            }
            break;
            
        case 'v':
        case 'V':
            if (!event.ctrlKey && !event.metaKey) {
                toggleVesselPanel();
            }
            break;
            
        case 'm':
        case 'M':
            if (!event.ctrlKey && !event.metaKey) {
                toggleMiniMap();
            }
            break;
            
        case '?':
            showKeyboardHelp();
            break;
    }
}

// Purpose: show-keyboard-shortcuts
function showKeyboardHelp() {
    const helpText = `
Keyboard Shortcuts:
━━━━━━━━━━━━━━━━━━
↑/↓ or ←/→   Navigate chapters
Home          Go to start
End           Go to stats
L             Toggle legend
V             Toggle vessel panel
M             Toggle mini map
Esc           Close panels
?             Show this help
    `.trim();
    
    showNotification(helpText, 5000);
}


/* ============================================
   7. TOUCH GESTURE HANDLERS
   Purpose: mobile-gesture-support
   ============================================ */

// Purpose: handle-touch-start
function handleTouchStart(event) {
    BUTTON_STATE.touchStartY = event.touches[0].clientY;
    BUTTON_STATE.touchStartX = event.touches[0].clientX;
}

// Purpose: handle-touch-end
function handleTouchEnd(event) {
    if (!event.changedTouches[0]) return;
    
    const deltaY = event.changedTouches[0].clientY - BUTTON_STATE.touchStartY;
    const deltaX = event.changedTouches[0].clientX - BUTTON_STATE.touchStartX;
    
    // Minimum swipe distance
    const minSwipe = 50;
    
    // Vertical swipe (for chapter navigation in specific areas)
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipe) {
        // Could add chapter swipe navigation here if needed
    }
    
    // Horizontal swipe (for panel toggle on mobile)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipe) {
        if (deltaX > 0) {
            // Swipe right - open vessel panel
            openVesselPanel();
        } else {
            // Swipe left - close vessel panel
            closeVesselPanel();
        }
    }
}


/* ============================================
   8. INITIALIZATION
   Purpose: button-system-setup
   ============================================ */

// Purpose: bind-cta-buttons
function bindCTAButtons() {
    // Contact button
    const contactBtn = document.querySelector('.cta-btn.contact, [data-action="contact"]');
    if (contactBtn) {
        contactBtn.addEventListener('click', handleContactClick);
    }
    
    // Demo button
    const demoBtn = document.querySelector('.cta-btn.demo, [data-action="demo"]');
    if (demoBtn) {
        demoBtn.addEventListener('click', handleDemoClick);
    }
    
    // Learn more button
    const learnMoreBtn = document.querySelector('.cta-btn.learn-more, [data-action="learn-more"]');
    if (learnMoreBtn) {
        learnMoreBtn.addEventListener('click', handleLearnMoreClick);
    }
    
    // Scroll to explore
    const scrollExploreBtn = document.querySelector('.scroll-indicator, [data-action="scroll-explore"]');
    if (scrollExploreBtn) {
        scrollExploreBtn.addEventListener('click', handleScrollExplore);
    }
    
    Utils.debugLog('CTA buttons bound');
}

// Purpose: bind-panel-toggles
function bindPanelToggles() {
    // Vessel panel toggle
    const vesselToggle = document.querySelector('.vessel-panel-toggle, [data-toggle="vessel-panel"]');
    if (vesselToggle) {
        vesselToggle.addEventListener('click', toggleVesselPanel);
    }
    
    // Legend toggle
    const legendToggle = document.querySelector('.legend-toggle, [data-toggle="legend"]');
    if (legendToggle) {
        legendToggle.addEventListener('click', toggleLegendPanel);
    }
    
    // Mini map toggle
    const miniMapToggle = document.querySelector('.mini-map-toggle, [data-toggle="mini-map"]');
    if (miniMapToggle) {
        miniMapToggle.addEventListener('click', toggleMiniMap);
    }
    
    Utils.debugLog('Panel toggles bound');
}

// Purpose: bind-navigation-buttons
function bindNavigationButtons() {
    // Month navigation from timeline
    const monthButtons = document.querySelectorAll('[data-month]');
    monthButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navigateToMonth(btn.dataset.month);
        });
    });
    
    // Previous/next buttons if present
    const prevBtn = document.querySelector('.nav-prev, [data-action="prev-chapter"]');
    const nextBtn = document.querySelector('.nav-next, [data-action="next-chapter"]');
    
    if (prevBtn) prevBtn.addEventListener('click', goToPreviousChapter);
    if (nextBtn) nextBtn.addEventListener('click', goToNextChapter);
    
    // Share button
    const shareBtn = document.querySelector('.share-btn, [data-action="share"]');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareCurrentView);
    }
    
    Utils.debugLog('Navigation buttons bound');
}

// Purpose: bind-keyboard-events
function bindKeyboardEvents() {
    document.addEventListener('keydown', handleKeyboardNavigation);
    Utils.debugLog('Keyboard events bound');
}

// Purpose: bind-touch-events
function bindTouchEvents() {
    if (Utils.isTouchDevice()) {
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        Utils.debugLog('Touch events bound');
    }
}

// Purpose: initialize-buttons
function initButtons() {
    Utils.debugLog('Initializing button handlers...');
    
    bindCTAButtons();
    bindPanelToggles();
    bindNavigationButtons();
    bindKeyboardEvents();
    bindTouchEvents();
    
    Utils.debugLog('Button handlers initialized');
}

// Purpose: cleanup-button-handlers
function cleanupButtons() {
    document.removeEventListener('keydown', handleKeyboardNavigation);
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchend', handleTouchEnd);
    
    Utils.debugLog('Button handlers cleaned up');
}


/* ============================================
   EXPORT BUTTON API
   Purpose: expose-button-functions
   ============================================ */
window.ButtonUtils = {
    // State
    getState: () => ({ ...BUTTON_STATE }),
    
    // CTA
    handleContactClick,
    handleDemoClick,
    handleLearnMoreClick,
    handleScrollExplore,
    
    // Panels
    toggleVesselPanel,
    toggleLegendPanel,
    toggleInfoPanel,
    toggleMiniMap,
    openVesselPanel,
    closeVesselPanel,
    closeAllPanels,
    
    // Navigation
    scrollToChapter,
    navigateToMonth,
    goToPreviousChapter,
    goToNextChapter,
    scrollToTop,
    scrollToStats,
    
    // Share/Export
    shareCurrentView,
    copyToClipboard,
    showNotification,
    downloadScreenshot,
    
    // Init
    init: initButtons,
    cleanup: cleanupButtons
};

// Auto-initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initButtons);
} else {
    initButtons();
}

console.log('[Buttons] Button handlers loaded');
