// ============================================================================
// CHAPTER 5 ANIMATION - FALCON: AIS Spoofing for Russian LPG
// Story: Cameroon-flagged LPG tanker FALCON spoofed AIS 25 May - 31 May 2025.
// Broadcast fake position 50km NE of Tallinn, Estonia while actually at
// Luga Bay / Ust-Luga Port, Russia to load Russian LPG.
// ============================================================================

function animateChapter5(map, chapterConfig) {
    console.log('Chapter 5: Init - FALCON');

    // ============================================================================
    // CUSTOMIZATION OPTIONS
    // ============================================================================

    const CONFIG = {
        // --- COLORS ---
        LINE_COLOR: '#00ff88',           // Neon green AIS track (consistent with other chapters)
        GLOW_COLOR: '#00ff88',           // Track glow
        LIGHT_DET_COLOR: '#00a3e3',      // Blue for light detection
        DARK_DET_COLOR: '#FFA500',       // Orange/Yellow for dark detection
        UNATTR_COLOR: '#ff4d4d',         // Red for unattributed detection
        SPOOF_COLOR: '#ff4d4d',          // Red for spoofing marker

        // --- ANIMATION ---
        MAIN_DURATION: 4000,             // Animation speed (ms) - single scroll

        // --- SVG MARKER FILES ---
        SVG_LIGHT: 'assets/svg/lightdetection.svg',
        SVG_DARK: 'assets/svg/darkdetection.svg',
        SVG_UNATTR: 'assets/svg/unattributed.svg',
        SVG_SPOOF: 'assets/svg/spoofing.svg',

        // --- MARKER SIZES ---
        LIGHT_MARKER_SIZE: 32,
        DARK_MARKER_SIZE: 40,
        UNATTR_MARKER_SIZE: 38,
        SPOOF_MARKER_SIZE: 38,

        // --- VESSEL MARKER ---
        VESSEL_SIZE: 14,
        VESSEL_BORDER: 0,
    };

    // ============================================================================
    // MARKER LOCATIONS (in sequence order as the line animates)
    // ============================================================================

    // MARKER 1: Light Detection - Baltic Sea (24 May 2025)
    const LIGHT_DET = {
        COORDS: [14.5427, 55.3255],       // [lng, lat] - Baltic Sea
        IMAGE: 'images/chapter5/chapter5A.png',
        IMG_WIDTH: 200,
        IMG_OFFSET: [0, 230],              // INDEPENDENT - adjust as needed
    };

    // MARKER 2: Spoofing Zone (near Tallinn, Estonia - fake AIS position)
    const SPOOF = {
        COORDS: [25.3229, 59.7881],       // [lng, lat] - 50km NE of Tallinn
        // No satellite image for spoofing marker
    };

    // MARKER 3: Dark Detection at Luga Bay (actual position in Russia)
    const DARK_DET = {
        COORDS: [28.4296, 59.8162],       // [lng, lat] - Luga Bay, Russia
        IMAGE: 'images/chapter5/chapter5B.png',
        IMG_WIDTH: 180,
        IMG_OFFSET: [29, -22],            // INDEPENDENT - adjust as needed
    };

    // MARKER 4: Unattributed Detection (Ust-Luga)
    const UNATTR_DET = {
        COORDS: [28.3799, 59.6754],       // [lng, lat] - Ust-Luga
        IMAGE: 'images/chapter5/chapter5C.png',
        IMG_WIDTH: 180,
        IMG_OFFSET: [0, 200],             // INDEPENDENT - adjust as needed
    };

    // MARKER 5: Final Light Detection (on return journey - Kattegat)
    const LIGHT_DET_FINAL = {
        COORDS: [11.4556, 56.3483],       // [lng, lat] - Return journey
        IMAGE: 'images/chapter5/chapter5D.png',
        IMG_WIDTH: 200,
        IMG_OFFSET: [140, 0],             // INDEPENDENT - adjust as needed
    };

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    const SOURCE_ID = 'ch5-src';
    const LAYER_ID = 'ch5-line';
    const GLOW_ID = 'ch5-glow';

    let coords = null;
    let total = 0;
    let animId = null;
    let progress = 0;
    let startT = null;
    let running = false;

    // Markers - each with independent popup
    let vesselMkr = null;
    let lightDetMkr = null;
    let lightDetPopup = null;
    let spoofMkr = null;
    let darkDetMkr = null;
    let darkDetPopup = null;        // INDEPENDENT popup for dark detection
    let unattrDetMkr = null;
    let unattrDetPopup = null;      // INDEPENDENT popup for unattributed
    let lightDetFinalMkr = null;
    let lightDetFinalPopup = null;

    // Percentage thresholds for marker appearance during animation
    const PCT_LIGHT = 0.20;           // Light detection at 20%
    const PCT_SPOOF = 0.35;           // Spoofing marker at 35% - PAUSE HERE
    const PCT_LIGHT_FINAL = 0.85;     // Final light detection at 85%
    
    // Pause configuration at spoofing location
    const PAUSE_DURATION = 1200;      // 1.2 second pause at spoofing location
    let isPaused = false;
    let pauseStartTime = null;
    let russiaMarkersShown = false;   // Track if dark/unattr markers revealed during pause

    // ============================================================================
    // INJECT STYLES
    // ============================================================================

    if (!document.getElementById('ch5-css')) {
        const css = document.createElement('style');
        css.id = 'ch5-css';
        css.textContent = `
            /* === VESSEL MARKER === */
            .ch5-vessel {
                width: ${CONFIG.VESSEL_SIZE}px;
                height: ${CONFIG.VESSEL_SIZE}px;
                background: ${CONFIG.LINE_COLOR};
                border: ${CONFIG.VESSEL_BORDER}px solid #fff;
                border-radius: 50%;
                box-shadow: 0 0 15px ${CONFIG.LINE_COLOR}, 0 0 30px ${CONFIG.LINE_COLOR}40;
            }

            /* === PULSING GLOW ANIMATIONS === */
            @keyframes ch5-glow-blue {
                0%, 100% {
                    filter: drop-shadow(0 0 10px rgba(0, 163, 227, 0.8))
                            drop-shadow(0 0 18px rgba(0, 163, 227, 0.5))
                            drop-shadow(0 0 28px rgba(0, 163, 227, 0.3));
                }
                50% {
                    filter: drop-shadow(0 0 14px rgba(0, 163, 227, 1))
                            drop-shadow(0 0 24px rgba(0, 163, 227, 0.7))
                            drop-shadow(0 0 36px rgba(0, 163, 227, 0.5));
                }
            }
            /* Orange glow with WHITE TINT for dark detection - ATTENTION GRABBING */
            @keyframes ch5-glow-orange-white {
                0%, 100% {
                    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.9))
                            drop-shadow(0 0 12px rgba(255, 200, 100, 0.8))
                            drop-shadow(0 0 20px rgba(255, 165, 0, 0.6))
                            drop-shadow(0 0 30px rgba(255, 165, 0, 0.3));
                }
                50% {
                    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 1))
                            drop-shadow(0 0 18px rgba(255, 200, 100, 1))
                            drop-shadow(0 0 28px rgba(255, 165, 0, 0.8))
                            drop-shadow(0 0 40px rgba(255, 165, 0, 0.5));
                }
            }
            /* Red glow with WHITE TINT for unattributed - ATTENTION GRABBING */
            @keyframes ch5-glow-red-white {
                0%, 100% {
                    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.9))
                            drop-shadow(0 0 12px rgba(255, 150, 150, 0.8))
                            drop-shadow(0 0 20px rgba(255, 77, 77, 0.6))
                            drop-shadow(0 0 30px rgba(255, 77, 77, 0.3));
                }
                50% {
                    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 1))
                            drop-shadow(0 0 18px rgba(255, 150, 150, 1))
                            drop-shadow(0 0 28px rgba(255, 77, 77, 0.8))
                            drop-shadow(0 0 40px rgba(255, 77, 77, 0.5));
                }
            }
            /* Subtle red glow for spoofing marker */
            @keyframes ch5-glow-red {
                0%, 100% {
                    filter: drop-shadow(0 0 8px rgba(255, 77, 77, 0.6))
                            drop-shadow(0 0 14px rgba(255, 77, 77, 0.3));
                }
                50% {
                    filter: drop-shadow(0 0 12px rgba(255, 77, 77, 0.8))
                            drop-shadow(0 0 20px rgba(255, 77, 77, 0.5));
                }
            }

            /* === LIGHT DETECTION MARKER (Blue Glow - Pulsing) === */
            .ch5-light-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
            }
            .ch5-light-marker:hover {
                transform: scale(1.15);
            }
            .ch5-light-marker img {
                width: ${CONFIG.LIGHT_MARKER_SIZE}px;
                height: auto;
                animation: ch5-glow-blue 2s ease-in-out infinite;
            }

            /* === DARK DETECTION MARKER (Orange + White Tint - ATTENTION) === */
            .ch5-dark-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
            }
            .ch5-dark-marker:hover {
                transform: scale(1.15);
            }
            .ch5-dark-marker img {
                width: ${CONFIG.DARK_MARKER_SIZE}px;
                height: auto;
                animation: ch5-glow-orange-white 2s ease-in-out infinite;
            }

            /* === UNATTRIBUTED DETECTION MARKER (Red + White Tint - ATTENTION) === */
            .ch5-unattr-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
            }
            .ch5-unattr-marker:hover {
                transform: scale(1.15);
            }
            .ch5-unattr-marker img {
                width: ${CONFIG.UNATTR_MARKER_SIZE}px;
                height: auto;
                animation: ch5-glow-red-white 2s ease-in-out infinite;
            }

            /* === SPOOFING MARKER (Red Glow - Pulsing) === */
            .ch5-spoof-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
            }
            .ch5-spoof-marker:hover {
                transform: scale(1.15);
            }
            .ch5-spoof-marker img {
                width: ${CONFIG.SPOOF_MARKER_SIZE}px;
                height: auto;
                animation: ch5-glow-red 2s ease-in-out infinite;
            }

            /* === POPUP BASE === */
            .ch5-pop .mapboxgl-popup-tip { display: none !important; }
            .ch5-pop .mapboxgl-popup-content {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
                outline: none !important;
            }

            /* === LIGHT DETECTION SATELLITE IMAGE (Blue Glow) === */
            .ch5-light-img-holder {
                display: inline-block;
                padding: 0 !important;
                border-radius: 10px;
                background: transparent !important;
                border: none !important;
                outline: none !important;
                box-shadow:
                    0 0 25px rgba(0, 163, 227, 0.35),
                    0 0 50px rgba(0, 163, 227, 0.15);
            }
            .ch5-light-img {
                display: block;
                max-width: ${LIGHT_DET.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                outline: none !important;
            }

            /* === DARK DETECTION IMAGE (Orange + White Tint Glow) - ATTENTION === */
            .ch5-dark-img-holder {
                display: inline-block;
                padding: 0 !important;
                border-radius: 10px;
                background: transparent !important;
                border: none !important;
                outline: none !important;
                box-shadow:
                    0 0 15px rgba(255, 255, 255, 0.5),
                    0 0 30px rgba(255, 200, 100, 0.4),
                    0 0 50px rgba(255, 165, 0, 0.25);
                animation: ch5-img-glow-orange 2.5s ease-in-out infinite;
            }
            @keyframes ch5-img-glow-orange {
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
            .ch5-dark-img {
                display: block;
                max-width: ${DARK_DET.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                outline: none !important;
            }

            /* === UNATTRIBUTED IMAGE (Red + White Tint Glow) - ATTENTION === */
            .ch5-unattr-img-holder {
                display: inline-block;
                padding: 0 !important;
                border-radius: 10px;
                background: transparent !important;
                border: none !important;
                outline: none !important;
                box-shadow:
                    0 0 15px rgba(255, 255, 255, 0.5),
                    0 0 30px rgba(255, 150, 150, 0.4),
                    0 0 50px rgba(255, 77, 77, 0.25);
                animation: ch5-img-glow-red 2.5s ease-in-out infinite;
            }
            @keyframes ch5-img-glow-red {
                0%, 100% {
                    box-shadow:
                        0 0 15px rgba(255, 255, 255, 0.5),
                        0 0 30px rgba(255, 150, 150, 0.4),
                        0 0 50px rgba(255, 77, 77, 0.25);
                }
                50% {
                    box-shadow:
                        0 0 22px rgba(255, 255, 255, 0.7),
                        0 0 42px rgba(255, 150, 150, 0.55),
                        0 0 65px rgba(255, 77, 77, 0.4);
                }
            }
            .ch5-unattr-img {
                display: block;
                max-width: ${UNATTR_DET.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                outline: none !important;
            }

            /* === FINAL LIGHT DETECTION IMAGE (Blue Glow) - INDEPENDENT === */
            .ch5-light-final-img-holder {
                display: inline-block;
                padding: 0 !important;
                border-radius: 10px;
                background: transparent !important;
                border: none !important;
                outline: none !important;
                box-shadow:
                    0 0 25px rgba(0, 163, 227, 0.35),
                    0 0 50px rgba(0, 163, 227, 0.15);
            }
            .ch5-light-final-img {
                display: block;
                max-width: ${LIGHT_DET_FINAL.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                outline: none !important;
            }

            /* === RESPONSIVE - TABLET === */
            @media (max-width: 1024px) {
                .ch5-light-marker img {
                    width: ${Math.round(CONFIG.LIGHT_MARKER_SIZE * 0.9)}px;
                }
                .ch5-dark-marker img {
                    width: ${Math.round(CONFIG.DARK_MARKER_SIZE * 0.9)}px;
                }
                .ch5-unattr-marker img {
                    width: ${Math.round(CONFIG.UNATTR_MARKER_SIZE * 0.9)}px;
                }
                .ch5-spoof-marker img {
                    width: ${Math.round(CONFIG.SPOOF_MARKER_SIZE * 0.9)}px;
                }
                .ch5-light-img {
                    max-width: ${Math.round(LIGHT_DET.IMG_WIDTH * 0.85)}px;
                }
                .ch5-dark-img {
                    max-width: ${Math.round(DARK_DET.IMG_WIDTH * 0.85)}px;
                }
                .ch5-unattr-img {
                    max-width: ${Math.round(UNATTR_DET.IMG_WIDTH * 0.85)}px;
                }
                .ch5-light-final-img {
                    max-width: ${Math.round(LIGHT_DET_FINAL.IMG_WIDTH * 0.85)}px;
                }
            }

            /* === RESPONSIVE - MOBILE === */
            @media (max-width: 768px) {
                .ch5-light-marker img {
                    width: ${Math.round(CONFIG.LIGHT_MARKER_SIZE * 0.8)}px;
                }
                .ch5-dark-marker img {
                    width: ${Math.round(CONFIG.DARK_MARKER_SIZE * 0.8)}px;
                }
                .ch5-unattr-marker img {
                    width: ${Math.round(CONFIG.UNATTR_MARKER_SIZE * 0.8)}px;
                }
                .ch5-spoof-marker img {
                    width: ${Math.round(CONFIG.SPOOF_MARKER_SIZE * 0.8)}px;
                }
                .ch5-light-img {
                    max-width: ${Math.round(LIGHT_DET.IMG_WIDTH * 0.7)}px;
                }
                .ch5-dark-img {
                    max-width: ${Math.round(DARK_DET.IMG_WIDTH * 0.7)}px;
                }
                .ch5-unattr-img {
                    max-width: ${Math.round(UNATTR_DET.IMG_WIDTH * 0.7)}px;
                }
                .ch5-light-final-img {
                    max-width: ${Math.round(LIGHT_DET_FINAL.IMG_WIDTH * 0.7)}px;
                }
            }

            /* === RESPONSIVE - SMALL MOBILE === */
            @media (max-width: 480px) {
                .ch5-light-marker img {
                    width: ${Math.round(CONFIG.LIGHT_MARKER_SIZE * 0.7)}px;
                }
                .ch5-dark-marker img {
                    width: ${Math.round(CONFIG.DARK_MARKER_SIZE * 0.7)}px;
                }
                .ch5-unattr-marker img {
                    width: ${Math.round(CONFIG.UNATTR_MARKER_SIZE * 0.7)}px;
                }
                .ch5-spoof-marker img {
                    width: ${Math.round(CONFIG.SPOOF_MARKER_SIZE * 0.7)}px;
                }
                .ch5-light-img {
                    max-width: ${Math.round(LIGHT_DET.IMG_WIDTH * 0.55)}px;
                }
                .ch5-dark-img {
                    max-width: ${Math.round(DARK_DET.IMG_WIDTH * 0.55)}px;
                }
                .ch5-unattr-img {
                    max-width: ${Math.round(UNATTR_DET.IMG_WIDTH * 0.55)}px;
                }
                .ch5-light-final-img {
                    max-width: ${Math.round(LIGHT_DET_FINAL.IMG_WIDTH * 0.55)}px;
                }
                .ch5-vessel {
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
        try { if (vesselMkr) { vesselMkr.remove(); } vesselMkr = null; } catch(e) { vesselMkr = null; }
        try { if (lightDetMkr) { lightDetMkr.remove(); } lightDetMkr = null; } catch(e) { lightDetMkr = null; }
        try { if (lightDetPopup) { lightDetPopup.remove(); } lightDetPopup = null; } catch(e) { lightDetPopup = null; }
        try { if (spoofMkr) { spoofMkr.remove(); } spoofMkr = null; } catch(e) { spoofMkr = null; }
        try { if (darkDetMkr) { darkDetMkr.remove(); } darkDetMkr = null; } catch(e) { darkDetMkr = null; }
        try { if (darkDetPopup) { darkDetPopup.remove(); } darkDetPopup = null; } catch(e) { darkDetPopup = null; }
        try { if (unattrDetMkr) { unattrDetMkr.remove(); } unattrDetMkr = null; } catch(e) { unattrDetMkr = null; }
        try { if (unattrDetPopup) { unattrDetPopup.remove(); } unattrDetPopup = null; } catch(e) { unattrDetPopup = null; }
        try { if (lightDetFinalMkr) { lightDetFinalMkr.remove(); } lightDetFinalMkr = null; } catch(e) { lightDetFinalMkr = null; }
        try { if (lightDetFinalPopup) { lightDetFinalPopup.remove(); } lightDetFinalPopup = null; } catch(e) { lightDetFinalPopup = null; }
    }

    function stopAnim() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        running = false;
    }

    // Comprehensive cleanup of markers and popups (DOM fallback)
    function clearDetectionsAndPopups() {
        console.log('  🧹 Ch5 clearDetectionsAndPopups');
        
        // Clear all marker and popup references
        clearMarkers();
        
        // Fallback: Remove any lingering DOM elements with ch5 classes
        document.querySelectorAll('.ch5-light-marker, .ch5-dark-marker, .ch5-unattr-marker, .ch5-spoof-marker, .ch5-vessel').forEach(el => {
            try {
                const markerWrapper = el.closest('.mapboxgl-marker');
                if (markerWrapper) {
                    markerWrapper.remove();
                } else {
                    el.remove();
                }
            } catch(e) {}
        });
        
        // Remove any ch5 popups (now with independent image holders)
        document.querySelectorAll('.ch5-pop, .ch5-light-img-holder, .ch5-dark-img-holder, .ch5-unattr-img-holder, .ch5-light-final-img-holder').forEach(el => {
            try {
                const popup = el.closest('.mapboxgl-popup');
                if (popup) {
                    popup.remove();
                } else {
                    el.remove();
                }
            } catch(e) {}
        });
        
        // Additional safety: remove all mapboxgl markers containing ch5 elements
        document.querySelectorAll('.mapboxgl-marker').forEach(marker => {
            if (marker.querySelector('[class*="ch5-"]')) {
                try { marker.remove(); } catch(e) {}
            }
        });
    }

    function clearAll() {
        stopAnim();
        clearDetectionsAndPopups();
        clearLayers();
        progress = 0;
        // Reset pause state
        isPaused = false;
        pauseStartTime = null;
        russiaMarkersShown = false;
    }

    // Create light detection marker (blue glow)
    function createLightMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch5-light-marker';
        el.innerHTML = `<img src="${svgFile}" alt="Light detection marker">`;
        return el;
    }

    // Create dark detection marker (orange/yellow glow)
    function createDarkMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch5-dark-marker';
        el.innerHTML = `<img src="${svgFile}" alt="Dark detection marker">`;
        return el;
    }

    // Create unattributed detection marker (red glow)
    function createUnattrMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch5-unattr-marker';
        el.innerHTML = `<img src="${svgFile}" alt="Unattributed detection marker">`;
        return el;
    }

    // Create spoofing marker (red glow)
    function createSpoofMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch5-spoof-marker';
        el.innerHTML = `<img src="${svgFile}" alt="Spoofing marker">`;
        return el;
    }

    // ============================================================================
    // LOAD DATA
    // ============================================================================

    async function loadData() {
        if (coords) return true;
        try {
            const res = await fetch(chapterConfig?.dataFile || 'data/chapter5-falcon.geojson');
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
    // SHOW MAIN (Single scroll - full FALCON track with sequential markers)
    // ============================================================================

    async function showMain() {
        console.log('  → showMain (FALCON - Baltic Sea to Ust-Luga, Russia)');
        
        // CRITICAL: Stop any running animation FIRST to prevent race conditions
        stopAnim();
        
        // Comprehensive cleanup
        clearDetectionsAndPopups();
        clearAll();

        await loadData();
        if (!coords || !coords.length) {
            console.error('No coordinates loaded');
            return;
        }

        // Setup source & layers for line animation
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
        vel.className = 'ch5-vessel';
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

        const now = performance.now();
        
        // === HANDLE PAUSE STATE ===
        if (isPaused) {
            const pauseElapsed = now - pauseStartTime;
            
            // Show Russia markers (dark + unattr) during pause with slight stagger
            if (!russiaMarkersShown && pauseElapsed > 200) {
                // Dark detection marker + popup
                const darkEl = createDarkMarker(CONFIG.SVG_DARK);
                darkDetMkr = new mapboxgl.Marker({ element: darkEl, anchor: 'center' })
                    .setLngLat(DARK_DET.COORDS)
                    .addTo(map);

                darkDetPopup = new mapboxgl.Popup({
                    closeButton: false,
                    closeOnClick: false,
                    className: 'ch5-pop',
                    offset: DARK_DET.IMG_OFFSET
                })
                    .setLngLat(DARK_DET.COORDS)
                    .setHTML(`
                        <div class="ch5-dark-img-holder">
                            <img class="ch5-dark-img" src="${DARK_DET.IMAGE}">
                        </div>
                    `)
                    .addTo(map);

                // Unattributed marker + popup (slight delay after dark)
                setTimeout(() => {
                    if (!unattrDetMkr) {
                        const unattrEl = createUnattrMarker(CONFIG.SVG_UNATTR);
                        unattrDetMkr = new mapboxgl.Marker({ element: unattrEl, anchor: 'center' })
                            .setLngLat(UNATTR_DET.COORDS)
                            .addTo(map);

                        unattrDetPopup = new mapboxgl.Popup({
                            closeButton: false,
                            closeOnClick: false,
                            className: 'ch5-pop',
                            offset: UNATTR_DET.IMG_OFFSET
                        })
                            .setLngLat(UNATTR_DET.COORDS)
                            .setHTML(`
                                <div class="ch5-unattr-img-holder">
                                    <img class="ch5-unattr-img" src="${UNATTR_DET.IMAGE}">
                                </div>
                            `)
                            .addTo(map);
                    }
                }, 300);

                russiaMarkersShown = true;
            }
            
            // Check if pause duration is over
            if (pauseElapsed >= PAUSE_DURATION) {
                isPaused = false;
                // Adjust startT to account for the pause duration
                startT = now - (PCT_SPOOF * CONFIG.MAIN_DURATION);
            }
            
            animId = requestAnimationFrame(animateMain);
            return;
        }

        const elapsed = now - startT;
        const pct = Math.min(elapsed / CONFIG.MAIN_DURATION, 1);
        const idx = Math.floor(pct * (total - 1));

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

            // Calculate progress percentage
            const mainPct = progress / (total - 1);

            // === LIGHT DETECTION (first, at Baltic Sea) ===
            if (mainPct >= PCT_LIGHT && !lightDetMkr) {
                const el = createLightMarker(CONFIG.SVG_LIGHT);
                lightDetMkr = new mapboxgl.Marker({ element: el, anchor: 'center' })
                    .setLngLat(LIGHT_DET.COORDS)
                    .addTo(map);

                lightDetPopup = new mapboxgl.Popup({
                    closeButton: false,
                    closeOnClick: false,
                    className: 'ch5-pop',
                    offset: LIGHT_DET.IMG_OFFSET
                })
                    .setLngLat(LIGHT_DET.COORDS)
                    .setHTML(`
                        <div class="ch5-light-img-holder">
                            <img class="ch5-light-img" src="${LIGHT_DET.IMAGE}">
                        </div>
                    `)
                    .addTo(map);
            }

            // === SPOOFING MARKER + PAUSE (fake AIS position near Tallinn) ===
            if (mainPct >= PCT_SPOOF && !spoofMkr) {
                const spoofEl = createSpoofMarker(CONFIG.SVG_SPOOF);
                spoofMkr = new mapboxgl.Marker({ element: spoofEl, anchor: 'center' })
                    .setLngLat(SPOOF.COORDS)
                    .addTo(map);
                
                // INITIATE PAUSE - vessel stops here while we reveal Russia detections
                if (!isPaused && !russiaMarkersShown) {
                    isPaused = true;
                    pauseStartTime = now;
                    console.log('  ⏸ Pausing at spoofing location...');
                }
            }

            // === FINAL LIGHT DETECTION (on return journey) ===
            if (mainPct >= PCT_LIGHT_FINAL && !lightDetFinalMkr) {
                const el = createLightMarker(CONFIG.SVG_LIGHT);
                lightDetFinalMkr = new mapboxgl.Marker({ element: el, anchor: 'center' })
                    .setLngLat(LIGHT_DET_FINAL.COORDS)
                    .addTo(map);

                lightDetFinalPopup = new mapboxgl.Popup({
                    closeButton: false,
                    closeOnClick: false,
                    className: 'ch5-pop',
                    offset: LIGHT_DET_FINAL.IMG_OFFSET
                })
                    .setLngLat(LIGHT_DET_FINAL.COORDS)
                    .setHTML(`
                        <div class="ch5-light-final-img-holder">
                            <img class="ch5-light-final-img" src="${LIGHT_DET_FINAL.IMAGE}">
                        </div>
                    `)
                    .addTo(map);
            }
        }

        if (pct < 1) {
            animId = requestAnimationFrame(animateMain);
        } else {
            // Complete - ensure full track is drawn
            const src = map.getSource(SOURCE_ID);
            if (src) {
                src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } });
            }
            if (vesselMkr) vesselMkr.setLngLat(coords[total - 1]);

            // Ensure all markers exist (fallback if not created during animation)
            if (!lightDetMkr) {
                const el = createLightMarker(CONFIG.SVG_LIGHT);
                lightDetMkr = new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat(LIGHT_DET.COORDS).addTo(map);
                lightDetPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, className: 'ch5-pop', offset: LIGHT_DET.IMG_OFFSET })
                    .setLngLat(LIGHT_DET.COORDS).setHTML(`<div class="ch5-light-img-holder"><img class="ch5-light-img" src="${LIGHT_DET.IMAGE}"></div>`).addTo(map);
            }

            if (!spoofMkr) {
                const spoofEl = createSpoofMarker(CONFIG.SVG_SPOOF);
                spoofMkr = new mapboxgl.Marker({ element: spoofEl, anchor: 'center' }).setLngLat(SPOOF.COORDS).addTo(map);
            }

            if (!darkDetMkr) {
                const darkEl = createDarkMarker(CONFIG.SVG_DARK);
                darkDetMkr = new mapboxgl.Marker({ element: darkEl, anchor: 'center' }).setLngLat(DARK_DET.COORDS).addTo(map);
            }
            if (!darkDetPopup) {
                darkDetPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, className: 'ch5-pop', offset: DARK_DET.IMG_OFFSET })
                    .setLngLat(DARK_DET.COORDS)
                    .setHTML(`<div class="ch5-dark-img-holder"><img class="ch5-dark-img" src="${DARK_DET.IMAGE}"></div>`)
                    .addTo(map);
            }

            if (!unattrDetMkr) {
                const unattrEl = createUnattrMarker(CONFIG.SVG_UNATTR);
                unattrDetMkr = new mapboxgl.Marker({ element: unattrEl, anchor: 'center' }).setLngLat(UNATTR_DET.COORDS).addTo(map);
            }
            if (!unattrDetPopup) {
                unattrDetPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, className: 'ch5-pop', offset: UNATTR_DET.IMG_OFFSET })
                    .setLngLat(UNATTR_DET.COORDS)
                    .setHTML(`<div class="ch5-unattr-img-holder"><img class="ch5-unattr-img" src="${UNATTR_DET.IMAGE}"></div>`)
                    .addTo(map);
            }

            if (!lightDetFinalMkr) {
                const el = createLightMarker(CONFIG.SVG_LIGHT);
                lightDetFinalMkr = new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat(LIGHT_DET_FINAL.COORDS).addTo(map);
                lightDetFinalPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, className: 'ch5-pop', offset: LIGHT_DET_FINAL.IMG_OFFSET })
                    .setLngLat(LIGHT_DET_FINAL.COORDS).setHTML(`<div class="ch5-light-final-img-holder"><img class="ch5-light-final-img" src="${LIGHT_DET_FINAL.IMAGE}"></div>`).addTo(map);
            }

            running = false;
            console.log('  ✓ Main animation complete (FALCON)');
        }
    }

    // ============================================================================
    // CLEANUP
    // ============================================================================

    function cleanup() {
        console.log('  🧹 Ch5 cleanup');
        clearAll();
        coords = null;
        total = 0;
    }

    // ============================================================================
    // RETURN CONTROLLER
    // ============================================================================

    return {
        showMain,
        cleanup,
        stop: clearAll,
        pause: stopAnim,
        resume: () => {
            if (!running && progress > 0 && coords) {
                running = true;
                startT = performance.now() - (progress / total) * CONFIG.MAIN_DURATION;
                animateMain();
            }
        },
        getProgress: () => total ? progress / total : 0,
        isComplete: () => progress >= total - 1
    };
}

window.animateChapter5 = animateChapter5;
