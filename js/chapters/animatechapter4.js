// ============================================================================
// CHAPTER 4 ANIMATION - KIBA: AIS Spoofing Iran to Mozambique
// Story: Barbados-flagged bulk carrier conducted AIS spoofing 30 Apr - 20 May 2025.
// While broadcasting AIS along Oman shores, detected at Asalouyeh Port, Iran.
// Ceased spoofing 21 May, transited to Beira Port, Mozambique arriving ~30 Jun.
// ============================================================================

function animateChapter4(map, chapterConfig) {
    console.log('Chapter 4: Init - KIBA');

    // ============================================================================
    // CUSTOMIZATION OPTIONS
    // ============================================================================

    const CONFIG = {
        // --- COLORS ---
        LINE_COLOR: '#00ff88',           // Neon green track
        GLOW_COLOR: '#00ff88',           // Track glow
        LIGHT_DET_COLOR: '#00a3e3',      // Blue for light detection
        DARK_DET_COLOR: '#FFA500',       // Orange for dark detection
        SPOOF_COLOR: '#ff4d4d',          // Red for spoofing marker

        // --- ANIMATION ---
        MAIN_DURATION: 2500,             // Main chapter animation speed (ms)
        H1_DURATION: 3000,               // H1 scroll animation speed (ms)

        // --- SVG MARKER FILES ---
        SVG_LIGHT: 'assets/svg/lightdetection.svg',
        SVG_DARK: 'assets/svg/darkdetection.svg',
        SVG_SPOOF: 'assets/svg/spoofing.svg',

        // --- MARKER SIZES ---
        LIGHT_MARKER_SIZE: 32,
        DARK_MARKER_SIZE: 40,
        SPOOF_MARKER_SIZE: 38,

        // --- VESSEL MARKER ---
        VESSEL_SIZE: 14,
        VESSEL_BORDER: 0,
    };

    // ============================================================================
    // MAIN SCROLL MARKERS
    // ============================================================================

    // Dark Detection 1 - Asalouyeh Port, Iran (actual position)
    const DARK_DETECTION_1 = {
        COORDS: [52.5571, 27.5303],      // [lng, lat]
        IMAGE: 'images/chapter4/chapter4A.png',
        IMG_WIDTH: 200,
        IMG_HEIGHT: 200,
        IMG_OFFSET: [-30, 230],
    };

    // Dark Detection 2 - Second dark detection with satellite image
    const DARK_DETECTION_2 = {
        COORDS: [55.1433, 26.1225],      // [lng, lat] - was spoofing, now dark detection
        IMAGE: 'images/chapter4/chapter4B.png',
        IMG_WIDTH: 200,
        IMG_HEIGHT: 200,
        IMG_OFFSET: [100, -45],
    };

    // Spoofing Markers - AIS broadcast positions (false locations)
    const SPOOF_MARKERS = [
        { COORDS: [55.4619, 26.3467] },   // Spoof 1: lat 26.3467, lng 55.4619
        { COORDS: [55.0666, 26.6173] },   // Spoof 2: lat 26.6173, lng 55.0666
        { COORDS: [55.4619, 25.5836] },   // Spoof 3: lat 25.5836, lng 55.4619
        { COORDS: [54.9387, 25.7722] },   // Spoof 4: lat 25.7722, lng 54.9387
    ];

    // Light Detection - Near Strait of Hormuz
    const LIGHT_DETECTION_MAIN = {
        COORDS: [54.9852, 26.1143],       // [lng, lat] - lat 26.1143, lng 54.9852
    };

    // Light Detection - Exit point (after line animation starts)
    const LIGHT_DETECTION_EXIT = {
        COORDS: [59.4570, 23.2565],       // [lng, lat]
    };

    // ============================================================================
    // H1 SCROLL MARKERS (Transit to Mozambique)
    // ============================================================================

    const H1_MARKERS = {
        // Mozambique endpoint - last point of track
        MOZAMBIQUE: { lng: 34.822966666666666, lat: -19.865033333333333 },

        // Satellite image for Mozambique
        MOZAMBIQUE_IMAGE: 'images/chapter4/chapter4C.png',
        MOZAMBIQUE_IMG_WIDTH: 220,
        MOZAMBIQUE_IMG_HEIGHT: 180,
        MOZAMBIQUE_IMG_OFFSET: [0, -50],  // [x, y] offset - ADJUST AS NEEDED
    };

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    const SOURCE_ID = 'ch4-src';
    const LAYER_ID = 'ch4-line';
    const GLOW_ID = 'ch4-glow';

    let coords = null;
    let total = 0;
    let animId = null;
    let progress = 0;
    let startT = null;
    let running = false;

    // Main scroll markers
    let vesselMkr = null;
    let darkDetMkr1 = null;
    let darkDetPopup1 = null;
    let darkDetMkr2 = null;
    let darkDetPopup2 = null;
    let spoofMkrs = [];           // Array for 4 spoofing markers
    let lightDetMkrMain = null;   // Light detection on main scroll
    let lightDetMkrExit = null;   // Light detection at exit point

    // H1 scroll markers
    let mozambiqueMkr = null;
    let mozambiquePopup = null;
    let originMarker = null;      // Real cargo origin marker for H1

    // Track where main animation ends (for H1 to continue from)
    let mainEndIndex = 0;
    const MAIN_STOP_PCT = 0.30;  // Stop at 30% of track (exit Gulf of Oman)

    // ============================================================================
    // INJECT STYLES
    // ============================================================================

    if (!document.getElementById('ch4-css')) {
        const css = document.createElement('style');
        css.id = 'ch4-css';
        css.textContent = `
            /* === VESSEL MARKER === */
            .ch4-vessel {
                width: ${CONFIG.VESSEL_SIZE}px;
                height: ${CONFIG.VESSEL_SIZE}px;
                background: ${CONFIG.LINE_COLOR};
                border: ${CONFIG.VESSEL_BORDER}px solid #fff;
                border-radius: 50%;
                box-shadow: 0 0 15px ${CONFIG.LINE_COLOR}, 0 0 30px ${CONFIG.LINE_COLOR}40;
            }

            /* === PULSING GLOW ANIMATIONS === */
            
            /* PRIMARY Dark Detection - White tint gradient (attention-grabbing) */
            @keyframes ch4-glow-orange-primary {
                0%, 100% {
                    filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.9))
                            drop-shadow(0 0 20px rgba(255, 200, 100, 0.8))
                            drop-shadow(0 0 35px rgba(255, 165, 0, 0.6))
                            drop-shadow(0 0 50px rgba(255, 140, 0, 0.4));
                }
                50% {
                    filter: drop-shadow(0 0 18px rgba(255, 255, 255, 1))
                            drop-shadow(0 0 30px rgba(255, 200, 100, 0.9))
                            drop-shadow(0 0 50px rgba(255, 165, 0, 0.7))
                            drop-shadow(0 0 70px rgba(255, 140, 0, 0.5));
                }
            }

            /* Secondary markers - Reduced glow */
            @keyframes ch4-glow-blue-subtle {
                0%, 100% {
                    filter: drop-shadow(0 0 6px rgba(0, 163, 227, 0.6))
                            drop-shadow(0 0 12px rgba(0, 163, 227, 0.3));
                }
                50% {
                    filter: drop-shadow(0 0 10px rgba(0, 163, 227, 0.7))
                            drop-shadow(0 0 18px rgba(0, 163, 227, 0.4));
                }
            }

            @keyframes ch4-glow-orange-subtle {
                0%, 100% {
                    filter: drop-shadow(0 0 6px rgba(255, 165, 0, 0.5))
                            drop-shadow(0 0 12px rgba(255, 165, 0, 0.25));
                }
                50% {
                    filter: drop-shadow(0 0 10px rgba(255, 165, 0, 0.6))
                            drop-shadow(0 0 18px rgba(255, 165, 0, 0.35));
                }
            }

            @keyframes ch4-glow-red-subtle {
                0%, 100% {
                    filter: drop-shadow(0 0 6px rgba(255, 77, 77, 0.5))
                            drop-shadow(0 0 12px rgba(255, 77, 77, 0.25));
                }
                50% {
                    filter: drop-shadow(0 0 10px rgba(255, 77, 77, 0.6))
                            drop-shadow(0 0 18px rgba(255, 77, 77, 0.35));
                }
            }

            /* === LIGHT DETECTION MARKER (Blue - Subtle) === */
            .ch4-light-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
            }
            .ch4-light-marker:hover {
                transform: scale(1.15);
            }
            .ch4-light-marker img {
                width: ${CONFIG.LIGHT_MARKER_SIZE}px;
                height: auto;
                animation: ch4-glow-blue-subtle 2s ease-in-out infinite;
            }

            /* === DARK DETECTION MARKER (Orange - Subtle for secondary) === */
            .ch4-dark-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
            }
            .ch4-dark-marker:hover {
                transform: scale(1.15);
            }
            .ch4-dark-marker img {
                width: ${CONFIG.DARK_MARKER_SIZE}px;
                height: auto;
                animation: ch4-glow-orange-subtle 2s ease-in-out infinite;
            }

            /* === PRIMARY DARK DETECTION (White-Orange Gradient - Attention) === */
            .ch4-dark-marker-primary {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
            }
            .ch4-dark-marker-primary:hover {
                transform: scale(1.15);
            }
            .ch4-dark-marker-primary img {
                width: ${CONFIG.DARK_MARKER_SIZE}px;
                height: auto;
                animation: ch4-glow-orange-primary 2s ease-in-out infinite;
            }

            /* === SPOOFING MARKER (Red - Subtle) === */
            .ch4-spoof-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
            }
            .ch4-spoof-marker:hover {
                transform: scale(1.15);
            }
            .ch4-spoof-marker img {
                width: ${CONFIG.SPOOF_MARKER_SIZE}px;
                height: auto;
                animation: ch4-glow-red-subtle 2s ease-in-out infinite;
            }

            /* === REAL CARGO ORIGIN MARKER (H1 Scroll - Iran) === */
            .ch4-origin-marker {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1px;
                pointer-events: none;
                z-index: 1000;
            }

            .ch4-origin-glow {
                position: relative;
                width: 40px;
                height: 40px;
            }

            .ch4-origin-ring-outer {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: radial-gradient(circle, 
                    rgba(255, 180, 50, 0.4) 0%, 
                    rgba(255, 140, 0, 0.2) 50%,
                    transparent 100%);
                animation: ch4-origin-pulse-outer 2s ease-out infinite;
            }

            .ch4-origin-core {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: rgba(255, 160, 50, 1);
                box-shadow:
                    0 0 6px rgba(255, 140, 0, 0.9),
                    0 0 12px rgba(255, 120, 0, 0.6);
            }

            .ch4-origin-label {
                font-family: 'Space Grotesk', 'Inter', sans-serif;
                font-size: 9px;
                font-weight: 600;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                color: rgba(255, 180, 50, 0.9);
                text-shadow: 
                    0 0 8px rgba(255, 140, 0, 0.7),
                    0 0 15px rgba(255, 100, 0, 0.4);
                white-space: nowrap;
            }

            @keyframes ch4-origin-pulse-outer {
                0% {
                    transform: translate(-50%, -50%) scale(0.5);
                    opacity: 0.7;
                }
                100% {
                    transform: translate(-50%, -50%) scale(2);
                    opacity: 0;
                }
            }

            /* === POPUP BASE === */
            .ch4-pop .mapboxgl-popup-tip { display: none !important; }
            .ch4-pop .mapboxgl-popup-content {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
                outline: none !important;
            }

            /* === PRIMARY DARK DETECTION IMAGE (White + Orange Tint - ATTENTION) === */
            .ch4-dark-img-holder-primary {
                display: inline-block;
                padding: 0 !important;
                border-radius: 8px;
                background: transparent !important;
                border: none !important;
                outline: none !important;
                box-shadow:
                    0 0 15px rgba(255, 255, 255, 0.5),
                    0 0 30px rgba(255, 200, 100, 0.4),
                    0 0 50px rgba(255, 165, 0, 0.25);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                animation: ch4-img-glow-primary 2.5s ease-in-out infinite;
            }
            @keyframes ch4-img-glow-primary {
                0%, 100% {
                    box-shadow:
                        0 0 15px rgba(255, 255, 255, 0.5),
                        0 0 30px rgba(255, 200, 100, 0.4),
                        0 0 50px rgba(255, 165, 0, 0.25);
                }
                50% {
                    box-shadow:
                        0 0 22px rgba(255, 255, 255, 0.7),
                        0 0 42px rgba(255, 200, 100, 0.55),
                        0 0 65px rgba(255, 165, 0, 0.4);
                }
            }
            .ch4-dark-img-holder-primary:hover {
                transform: scale(1.02);
                box-shadow:
                    0 0 25px rgba(255, 255, 255, 0.7),
                    0 0 45px rgba(255, 200, 100, 0.5),
                    0 0 70px rgba(255, 165, 0, 0.35);
            }

            /* === SECONDARY DARK DETECTION IMAGE (Subtle Orange Glow) === */
            .ch4-dark-img-holder {
                display: inline-block;
                padding: 0 !important;
                border-radius: 8px;
                background: transparent !important;
                border: none !important;
                outline: none !important;
                box-shadow:
                    0 0 20px rgba(255, 165, 0, 0.4),
                    0 0 40px rgba(255, 165, 0, 0.2);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .ch4-dark-img-holder:hover {
                transform: scale(1.02);
                box-shadow:
                    0 0 30px rgba(255, 165, 0, 0.5),
                    0 0 60px rgba(255, 165, 0, 0.25);
            }
            .ch4-dark-img {
                display: block;
                max-width: ${DARK_DETECTION_1.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                outline: none !important;
            }

            /* === SPOOFING SATELLITE IMAGE (Red Glow) === */
            .ch4-spoof-img-holder {
                display: inline-block;
                padding: 0 !important;
                border-radius: 8px;
                background: transparent !important;
                border: none !important;
                outline: none !important;
                box-shadow:
                    0 0 20px rgba(255, 77, 77, 0.4),
                    0 0 40px rgba(255, 77, 77, 0.2);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .ch4-spoof-img-holder:hover {
                transform: scale(1.02);
                box-shadow:
                    0 0 30px rgba(255, 77, 77, 0.5),
                    0 0 60px rgba(255, 77, 77, 0.25);
            }
            .ch4-spoof-img {
                display: block;
                max-width: ${DARK_DETECTION_2.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                outline: none !important;
            }

            /* === MOZAMBIQUE SATELLITE IMAGE (Blue Glow) === */
            .ch4-mozambique-img-holder {
                display: inline-block;
                padding: 0 !important;
                border-radius: 8px;
                background: transparent !important;
                border: none !important;
                outline: none !important;
                box-shadow:
                    0 0 20px rgba(0, 163, 227, 0.4),
                    0 0 40px rgba(0, 163, 227, 0.2);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .ch4-mozambique-img-holder:hover {
                transform: scale(1.02);
                box-shadow:
                    0 0 30px rgba(0, 163, 227, 0.5),
                    0 0 60px rgba(0, 163, 227, 0.25);
            }
            .ch4-mozambique-img {
                display: block;
                max-width: ${H1_MARKERS.MOZAMBIQUE_IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                outline: none !important;
            }

            /* === RESPONSIVE - TABLET === */
            @media (max-width: 1024px) {
                .ch4-light-marker {
                    width: ${Math.round(CONFIG.LIGHT_MARKER_SIZE * 0.9)}px;
                    height: ${Math.round(CONFIG.LIGHT_MARKER_SIZE * 0.9)}px;
                }
                .ch4-dark-marker {
                    width: ${Math.round(CONFIG.DARK_MARKER_SIZE * 0.9)}px;
                    height: ${Math.round(CONFIG.DARK_MARKER_SIZE * 0.9)}px;
                }
                .ch4-spoof-marker {
                    width: ${Math.round(CONFIG.SPOOF_MARKER_SIZE * 0.9)}px;
                    height: ${Math.round(CONFIG.SPOOF_MARKER_SIZE * 0.9)}px;
                }
                .ch4-dark-img {
                    max-width: ${Math.round(DARK_DETECTION_1.IMG_WIDTH * 0.85)}px;
                }
                .ch4-spoof-img {
                    max-width: ${Math.round(DARK_DETECTION_2.IMG_WIDTH * 0.85)}px;
                }
                .ch4-mozambique-img {
                    max-width: ${Math.round(H1_MARKERS.MOZAMBIQUE_IMG_WIDTH * 0.85)}px;
                }
            }

            /* === RESPONSIVE - MOBILE === */
            @media (max-width: 768px) {
                .ch4-light-marker {
                    width: ${Math.round(CONFIG.LIGHT_MARKER_SIZE * 0.8)}px;
                    height: ${Math.round(CONFIG.LIGHT_MARKER_SIZE * 0.8)}px;
                }
                .ch4-dark-marker {
                    width: ${Math.round(CONFIG.DARK_MARKER_SIZE * 0.8)}px;
                    height: ${Math.round(CONFIG.DARK_MARKER_SIZE * 0.8)}px;
                }
                .ch4-spoof-marker {
                    width: ${Math.round(CONFIG.SPOOF_MARKER_SIZE * 0.8)}px;
                    height: ${Math.round(CONFIG.SPOOF_MARKER_SIZE * 0.8)}px;
                }
                .ch4-dark-img {
                    max-width: ${Math.round(DARK_DETECTION_1.IMG_WIDTH * 0.7)}px;
                }
                .ch4-spoof-img {
                    max-width: ${Math.round(DARK_DETECTION_2.IMG_WIDTH * 0.7)}px;
                }
                .ch4-mozambique-img {
                    max-width: ${Math.round(H1_MARKERS.MOZAMBIQUE_IMG_WIDTH * 0.7)}px;
                }
            }

            /* === RESPONSIVE - SMALL MOBILE === */
            @media (max-width: 480px) {
                .ch4-light-marker {
                    width: ${Math.round(CONFIG.LIGHT_MARKER_SIZE * 0.7)}px;
                    height: ${Math.round(CONFIG.LIGHT_MARKER_SIZE * 0.7)}px;
                }
                .ch4-dark-marker {
                    width: ${Math.round(CONFIG.DARK_MARKER_SIZE * 0.7)}px;
                    height: ${Math.round(CONFIG.DARK_MARKER_SIZE * 0.7)}px;
                }
                .ch4-spoof-marker {
                    width: ${Math.round(CONFIG.SPOOF_MARKER_SIZE * 0.7)}px;
                    height: ${Math.round(CONFIG.SPOOF_MARKER_SIZE * 0.7)}px;
                }
                .ch4-dark-img {
                    max-width: ${Math.round(DARK_DETECTION_1.IMG_WIDTH * 0.55)}px;
                }
                .ch4-spoof-img {
                    max-width: ${Math.round(DARK_DETECTION_2.IMG_WIDTH * 0.55)}px;
                }
                .ch4-mozambique-img {
                    max-width: ${Math.round(H1_MARKERS.MOZAMBIQUE_IMG_WIDTH * 0.55)}px;
                }
                .ch4-vessel {
                    width: ${Math.round(CONFIG.VESSEL_SIZE * 0.8)}px;
                    height: ${Math.round(CONFIG.VESSEL_SIZE * 0.8)}px;
                }
            }
        `;
        document.head.appendChild(css);
    }

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    function clearLayers() {
        try { if (map.getLayer(GLOW_ID)) map.removeLayer(GLOW_ID); } catch(e) {}
        try { if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID); } catch(e) {}
        try { if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID); } catch(e) {}
    }

    function clearMarkers() {
        if (vesselMkr) { vesselMkr.remove(); vesselMkr = null; }
        if (darkDetMkr1) { darkDetMkr1.remove(); darkDetMkr1 = null; }
        if (darkDetPopup1) { darkDetPopup1.remove(); darkDetPopup1 = null; }
        if (darkDetMkr2) { darkDetMkr2.remove(); darkDetMkr2 = null; }
        if (darkDetPopup2) { darkDetPopup2.remove(); darkDetPopup2 = null; }
        // Clear all spoofing markers
        spoofMkrs.forEach(mkr => { if (mkr) mkr.remove(); });
        spoofMkrs = [];
        if (lightDetMkrMain) { lightDetMkrMain.remove(); lightDetMkrMain = null; }
        if (lightDetMkrExit) { lightDetMkrExit.remove(); lightDetMkrExit = null; }
        if (mozambiqueMkr) { mozambiqueMkr.remove(); mozambiqueMkr = null; }
        if (mozambiquePopup) { mozambiquePopup.remove(); mozambiquePopup = null; }
        if (originMarker) { originMarker.remove(); originMarker = null; }
    }

    // Comprehensive cleanup of markers and popups only (keeps path layers for transitions)
    function clearDetectionsAndPopups() {
        console.log('  🧹 Ch4 clearDetectionsAndPopups');
        
        // Clear dark detection markers and popups
        try {
            if (darkDetMkr1) { darkDetMkr1.remove(); }
            darkDetMkr1 = null;
        } catch(e) { darkDetMkr1 = null; }
        
        try {
            if (darkDetPopup1) { darkDetPopup1.remove(); }
            darkDetPopup1 = null;
        } catch(e) { darkDetPopup1 = null; }
        
        try {
            if (darkDetMkr2) { darkDetMkr2.remove(); }
            darkDetMkr2 = null;
        } catch(e) { darkDetMkr2 = null; }
        
        try {
            if (darkDetPopup2) { darkDetPopup2.remove(); }
            darkDetPopup2 = null;
        } catch(e) { darkDetPopup2 = null; }
        
        // Clear all spoofing markers
        spoofMkrs.forEach(mkr => {
            try { if (mkr) mkr.remove(); } catch(e) {}
        });
        spoofMkrs = [];
        
        // Clear light detection markers
        try {
            if (lightDetMkrMain) { lightDetMkrMain.remove(); }
            lightDetMkrMain = null;
        } catch(e) { lightDetMkrMain = null; }
        
        try {
            if (lightDetMkrExit) { lightDetMkrExit.remove(); }
            lightDetMkrExit = null;
        } catch(e) { lightDetMkrExit = null; }
        
        // Clear H1 markers
        try {
            if (mozambiqueMkr) { mozambiqueMkr.remove(); }
            mozambiqueMkr = null;
        } catch(e) { mozambiqueMkr = null; }
        
        try {
            if (mozambiquePopup) { mozambiquePopup.remove(); }
            mozambiquePopup = null;
        } catch(e) { mozambiquePopup = null; }
        
        try {
            if (originMarker) { originMarker.remove(); }
            originMarker = null;
        } catch(e) { originMarker = null; }
        
        // Also clear vessel marker during transitions
        try {
            if (vesselMkr) { vesselMkr.remove(); }
            vesselMkr = null;
        } catch(e) { vesselMkr = null; }
        
        // Fallback: Remove any lingering DOM elements with ch4 classes
        // These might be wrapped in mapboxgl-marker containers
        document.querySelectorAll('.ch4-dark-marker, .ch4-dark-marker-primary, .ch4-spoof-marker, .ch4-light-marker, .ch4-vessel, .ch4-origin-marker').forEach(el => {
            try {
                // If this is inside a mapboxgl-marker, remove the marker wrapper
                const markerWrapper = el.closest('.mapboxgl-marker');
                if (markerWrapper) {
                    markerWrapper.remove();
                } else {
                    el.remove();
                }
            } catch(e) {}
        });
        
        // Remove any ch4 popups
        document.querySelectorAll('.ch4-pop, .ch4-dark-img-holder, .ch4-dark-img-holder-primary, .ch4-dark-img').forEach(el => {
            try {
                const popup = el.closest('.mapboxgl-popup');
                if (popup) {
                    popup.remove();
                } else {
                    el.remove();
                }
            } catch(e) {}
        });
        
        // Additional safety: remove all mapboxgl markers that have ch4 elements inside
        document.querySelectorAll('.mapboxgl-marker').forEach(marker => {
            if (marker.querySelector('[class*="ch4-"]')) {
                try { marker.remove(); } catch(e) {}
            }
        });
    }

    function stopAnim() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        running = false;
    }

    function clearAll() {
        stopAnim();
        clearMarkers();
        clearLayers();
        progress = 0;
    }

    // Create light detection marker (blue glow)
    function createLightMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch4-light-marker';
        el.innerHTML = `<img src="${svgFile}" alt="Light detection marker">`;
        return el;
    }

    // Create dark detection marker (orange glow - subtle)
    function createDarkMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch4-dark-marker';
        el.innerHTML = `<img src="${svgFile}" alt="Dark detection marker">`;
        return el;
    }

    // Create primary dark detection marker (white-orange glow - attention)
    function createDarkMarkerPrimary(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch4-dark-marker-primary';
        el.innerHTML = `<img src="${svgFile}" alt="Dark detection marker">`;
        return el;
    }

    // Create spoofing marker (red glow)
    function createSpoofMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch4-spoof-marker';
        el.innerHTML = `<img src="${svgFile}" alt="Spoofing marker">`;
        return el;
    }

    // ============================================================================
    // LOAD DATA
    // ============================================================================

    async function loadData() {
        if (coords) return true;
        try {
            const res = await fetch(chapterConfig?.dataFile || 'data/chapter4-kiba.geojson');
            const data = await res.json();

            let coordinates;
            if (data.type === 'Feature' && data.geometry?.coordinates) {
                coordinates = data.geometry.coordinates;
            } else if (data.type === 'LineString' && data.coordinates) {
                coordinates = data.coordinates;
            } else if (data.features?.[0]?.geometry?.coordinates) {
                coordinates = data.features[0].geometry.coordinates;
            }

            if (coordinates && coordinates.length) {
                coords = coordinates;
                total = coords.length;
                console.log(`  ✓ ${total} points loaded`);
                return true;
            }
        } catch(e) { console.error('Load error:', e); }
        return false;
    }

    // ============================================================================
    // SHOW MAIN (Main Chapter - Strait of Hormuz area with spoofing detection)
    // ============================================================================

    async function showMain() {
        console.log('  → showMain (Gulf of Oman - AIS Spoofing Exposed)');
        
        // CRITICAL: Stop any running animation FIRST to prevent race conditions
        stopAnim();
        
        // Immediately clear any markers/popups from previous scroll
        clearDetectionsAndPopups();
        
        // Full cleanup (also calls clearMarkers which is redundant but safe)
        clearAll();

        await loadData();
        if (!coords || !coords.length) {
            console.error('No coordinates loaded for main scroll');
            return;
        }

        // Calculate end index for main scroll
        mainEndIndex = Math.floor(total * MAIN_STOP_PCT);

        // === DARK DETECTION 1: Asalouyeh Port, Iran (PRIMARY - White tint glow) ===
        const darkEl1 = createDarkMarkerPrimary(CONFIG.SVG_DARK);
        darkDetMkr1 = new mapboxgl.Marker({ element: darkEl1, anchor: 'center' })
            .setLngLat(DARK_DETECTION_1.COORDS)
            .addTo(map);

        darkDetPopup1 = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch4-pop',
            offset: DARK_DETECTION_1.IMG_OFFSET
        })
            .setLngLat(DARK_DETECTION_1.COORDS)
            .setHTML(`
                <div class="ch4-dark-img-holder-primary">
                    <img class="ch4-dark-img" src="${DARK_DETECTION_1.IMAGE}">
                </div>
            `)
            .addTo(map);

        // === DARK DETECTION 2: Second dark detection with satellite image ===
        const darkEl2 = createDarkMarker(CONFIG.SVG_DARK);
        darkDetMkr2 = new mapboxgl.Marker({ element: darkEl2, anchor: 'center' })
            .setLngLat(DARK_DETECTION_2.COORDS)
            .addTo(map);

        darkDetPopup2 = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch4-pop',
            offset: DARK_DETECTION_2.IMG_OFFSET
        })
            .setLngLat(DARK_DETECTION_2.COORDS)
            .setHTML(`
                <div class="ch4-dark-img-holder">
                    <img class="ch4-dark-img" src="${DARK_DETECTION_2.IMAGE}">
                </div>
            `)
            .addTo(map);

        // === 4 SPOOFING MARKERS: AIS broadcast positions (false locations) ===
        SPOOF_MARKERS.forEach((spoof, index) => {
            const spoofEl = createSpoofMarker(CONFIG.SVG_SPOOF);
            const mkr = new mapboxgl.Marker({ element: spoofEl, anchor: 'center' })
                .setLngLat(spoof.COORDS)
                .addTo(map);
            spoofMkrs.push(mkr);
        });

        // === LIGHT DETECTION: Near Strait of Hormuz ===
        const lightElMain = createLightMarker(CONFIG.SVG_LIGHT);
        lightDetMkrMain = new mapboxgl.Marker({ element: lightElMain, anchor: 'center' })
            .setLngLat(LIGHT_DETECTION_MAIN.COORDS)
            .addTo(map);

        // === Setup source & layers for line animation ===
        map.addSource(SOURCE_ID, {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [coords[0]] } }
        });

        map.addLayer({
            id: GLOW_ID, type: 'line', source: SOURCE_ID,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': CONFIG.GLOW_COLOR, 'line-width': 10, 'line-opacity': 0.4, 'line-blur': 5 }
        });

        map.addLayer({
            id: LAYER_ID, type: 'line', source: SOURCE_ID,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': CONFIG.LINE_COLOR, 'line-width': 3, 'line-opacity': 0.95 }
        });

        // Vessel marker
        const vel = document.createElement('div');
        vel.className = 'ch4-vessel';
        vesselMkr = new mapboxgl.Marker({ element: vel, anchor: 'center' })
            .setLngLat(coords[0]).addTo(map);

        // Start animation
        progress = 0;
        running = true;
        startT = performance.now();
        animateMain();
    }

    function animateMain() {
        if (!running || !coords) return;

        const elapsed = performance.now() - startT;
        const pct = Math.min(elapsed / CONFIG.MAIN_DURATION, 1);
        const idx = Math.floor(pct * mainEndIndex);

        if (idx > progress) {
            progress = idx;

            const src = map.getSource(SOURCE_ID);
            if (src) {
                src.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: coords.slice(0, progress + 1) }
                });
            }

            if (vesselMkr) vesselMkr.setLngLat(coords[progress]);

            // Calculate progress as percentage of MAIN portion
            const mainPct = progress / mainEndIndex;

            // Light Detection marker at exit point (~80% of main animation)
            if (mainPct >= 0.8 && !lightDetMkrExit) {
                const lightEl = createLightMarker(CONFIG.SVG_LIGHT);
                lightDetMkrExit = new mapboxgl.Marker({ element: lightEl, anchor: 'center' })
                    .setLngLat(LIGHT_DETECTION_EXIT.COORDS)
                    .addTo(map);
            }
        }

        if (pct < 1) {
            animId = requestAnimationFrame(animateMain);
        } else {
            // Complete main animation
            const src = map.getSource(SOURCE_ID);
            if (src) {
                src.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: coords.slice(0, mainEndIndex + 1) }
                });
            }
            if (vesselMkr) vesselMkr.setLngLat(coords[mainEndIndex]);

            // Ensure light detection marker at exit exists
            if (!lightDetMkrExit) {
                const lightEl = createLightMarker(CONFIG.SVG_LIGHT);
                lightDetMkrExit = new mapboxgl.Marker({ element: lightEl, anchor: 'center' })
                    .setLngLat(LIGHT_DETECTION_EXIT.COORDS)
                    .addTo(map);
            }

            running = false;
            console.log('  ✓ Main animation complete');
        }
    }

    // ============================================================================
    // SHOW H1 (H1 Scroll - Continue animation to Mozambique)
    // ============================================================================

    async function showH1() {
        console.log('  → showH1 (Continue to Mozambique)');
        
        // CRITICAL: Stop any running animation FIRST to prevent race conditions
        stopAnim();
        
        // Immediately clear any markers/popups from previous scroll
        clearDetectionsAndPopups();
        
        // Full cleanup (also calls clearMarkers which is redundant but safe)
        clearAll();

        await loadData();
        if (!coords || !coords.length) return;

        // Recalculate mainEndIndex in case showMain wasn't called
        if (mainEndIndex === 0) {
            mainEndIndex = Math.floor(total * MAIN_STOP_PCT);
        }

        // Setup source & layers - start with the track up to where main left off
        map.addSource(SOURCE_ID, {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords.slice(0, mainEndIndex + 1) } }
        });

        map.addLayer({
            id: GLOW_ID, type: 'line', source: SOURCE_ID,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': CONFIG.GLOW_COLOR, 'line-width': 10, 'line-opacity': 0.4, 'line-blur': 5 }
        });

        map.addLayer({
            id: LAYER_ID, type: 'line', source: SOURCE_ID,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': CONFIG.LINE_COLOR, 'line-width': 3, 'line-opacity': 0.95 }
        });

        // Vessel marker - start where main left off
        const vel = document.createElement('div');
        vel.className = 'ch4-vessel';
        vesselMkr = new mapboxgl.Marker({ element: vel, anchor: 'center' })
            .setLngLat(coords[mainEndIndex]).addTo(map);

        // === REAL CARGO ORIGIN MARKER (Iran - Asalouyeh Port) ===
        // Shows where the vessel actually loaded cargo while spoofing
        const originEl = document.createElement('div');
        originEl.className = 'ch4-origin-marker';
        originEl.innerHTML = `
            <div class="ch4-origin-label">REAL CARGO ORIGIN</div>
            <div class="ch4-origin-glow">
                <div class="ch4-origin-ring-outer"></div>
                <div class="ch4-origin-core"></div>
            </div>
        `;
        originMarker = new mapboxgl.Marker({ element: originEl, anchor: 'bottom' })
            .setLngLat(DARK_DETECTION_1.COORDS)  // [52.5571, 27.5303] - Asalouyeh Port
            .addTo(map);

        // Start animation from mainEndIndex
        progress = mainEndIndex;
        running = true;
        startT = performance.now();
        animateH1();
    }

    function animateH1() {
        if (!running || !coords) return;

        const elapsed = performance.now() - startT;
        const pct = Math.min(elapsed / CONFIG.H1_DURATION, 1);

        // Animate from mainEndIndex to end of track
        const remainingPoints = total - mainEndIndex;
        const idx = mainEndIndex + Math.floor(pct * remainingPoints);

        if (idx > progress) {
            progress = idx;

            const src = map.getSource(SOURCE_ID);
            if (src) {
                src.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: coords.slice(0, progress + 1) }
                });
            }

            if (vesselMkr) vesselMkr.setLngLat(coords[progress]);

            // Calculate progress within H1 portion
            const h1Pct = (progress - mainEndIndex) / remainingPoints;

            // At 90% of H1 animation, show Mozambique marker + satellite image
            if (h1Pct >= 0.9 && !mozambiqueMkr) {
                // Light detection marker at last point of track
                const lightEl = createLightMarker(CONFIG.SVG_LIGHT);
                mozambiqueMkr = new mapboxgl.Marker({ element: lightEl, anchor: 'center' })
                    .setLngLat([H1_MARKERS.MOZAMBIQUE.lng, H1_MARKERS.MOZAMBIQUE.lat])
                    .addTo(map);

                // Mozambique satellite image popup (blue glow)
                mozambiquePopup = new mapboxgl.Popup({
                    closeButton: false,
                    closeOnClick: false,
                    className: 'ch4-pop',
                    offset: H1_MARKERS.MOZAMBIQUE_IMG_OFFSET
                })
                    .setLngLat([H1_MARKERS.MOZAMBIQUE.lng, H1_MARKERS.MOZAMBIQUE.lat])
                    .setHTML(`
                        <div class="ch4-mozambique-img-holder">
                            <img class="ch4-mozambique-img" src="${H1_MARKERS.MOZAMBIQUE_IMAGE}">
                        </div>
                    `)
                    .addTo(map);
            }
        }

        if (pct < 1) {
            animId = requestAnimationFrame(animateH1);
        } else {
            // Complete - ensure full track is drawn
            const src = map.getSource(SOURCE_ID);
            if (src) {
                src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } });
            }
            if (vesselMkr) vesselMkr.setLngLat(coords[total - 1]);

            // Ensure marker + popup exist (fallback if not created during animation)
            if (!mozambiqueMkr) {
                const lightEl = createLightMarker(CONFIG.SVG_LIGHT);
                mozambiqueMkr = new mapboxgl.Marker({ element: lightEl, anchor: 'center' })
                    .setLngLat([H1_MARKERS.MOZAMBIQUE.lng, H1_MARKERS.MOZAMBIQUE.lat])
                    .addTo(map);
            }
            if (!mozambiquePopup) {
                mozambiquePopup = new mapboxgl.Popup({
                    closeButton: false,
                    closeOnClick: false,
                    className: 'ch4-pop',
                    offset: H1_MARKERS.MOZAMBIQUE_IMG_OFFSET
                })
                    .setLngLat([H1_MARKERS.MOZAMBIQUE.lng, H1_MARKERS.MOZAMBIQUE.lat])
                    .setHTML(`
                        <div class="ch4-mozambique-img-holder">
                            <img class="ch4-mozambique-img" src="${H1_MARKERS.MOZAMBIQUE_IMAGE}">
                        </div>
                    `)
                    .addTo(map);
            }

            running = false;
            console.log('  ✓ H1 animation complete (Mozambique)');
        }
    }

    // ============================================================================
    // CLEANUP
    // ============================================================================

    function cleanup() {
        console.log('  🧹 Ch4 cleanup');
        clearAll();
        coords = null;
        total = 0;
    }

    // ============================================================================
    // RETURN CONTROLLER
    // ============================================================================

    return {
        stop: cleanup,
        showMain,
        showH1,
        pause: stopAnim,
        resume: () => {
            if (coords && !running && progress < total - 1) {
                running = true;
                startT = performance.now() - (progress/total) * CONFIG.H1_DURATION;
                animateH1();
            }
        },
        getProgress: () => total ? progress / total : 0,
        isComplete: () => progress >= total - 1
    };
}

window.animateChapter4 = animateChapter4;
