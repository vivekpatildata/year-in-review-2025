// ============================================================================
// CHAPTER 10 ANIMATION - FALCON Part 2: Persian Gulf to Gulf of Aden
// Story: Between 25 Sep and 20 Oct 2025, the Cameroon-flagged LPG tanker
// FALCON (IMO 9014432) transmitted AIS positions indicating transit through
// the Persian Gulf toward Iraq, while satellite detections placed the vessel
// at Asaluyeh Port, Iran. Following a dark period, the vessel loitered in the
// Gulf of Oman before an on-board explosion left it drifting in the Gulf of Aden.
// This is Part 2 of the FALCON story (Part 1 was Chapter 5 / May).
//
// Marker sequence along the track:
//  1. 2x Spoofing near Basra (AIS said Iraq)
//  2. 2x Dark at Asaluyeh + sat image A
//  3. 2x Spoofing near Dubai
//  4. AIS Dark annotation box
//  5. 1x Dark SE Bandar Abbas + sat image B
//  6. 3x Light near Fujairah + 1x Spoofing + sat image C
//  7. 1x Dark at last AIS point + sat image D
// ============================================================================

function animateChapter10(map, chapterConfig) {
    console.log('Chapter 10: Init - FALCON Part 2 (Persian Gulf → Gulf of Aden)');

    // ============================================================================
    // CUSTOMIZATION OPTIONS
    // ============================================================================

    const CONFIG = {
        // --- COLORS ---
        LINE_COLOR: '#00ff88',
        GLOW_COLOR: '#00ff88',

        // --- ANIMATION ---
        MAIN_DURATION: 6000,

        // --- SVG MARKER FILES ---
        SVG_LIGHT: 'assets/svg/lightdetection.svg',
        SVG_DARK: 'assets/svg/darkdetection.svg',
        SVG_SPOOF: 'assets/svg/spoofing.svg',

        // --- MARKER SIZES ---
        MARKER_SIZE: 36,
        VESSEL_SIZE: 14,
        VESSEL_BORDER: 0,

        // --- IMAGE SETTINGS ---
        IMG_WIDTH: 180,

        // --- CINEMATIC CAMERA POSITIONS ---
        OVERVIEW: {
            center: [53.761, 27.752],
            zoom: 5.82,
            pitch: 0,
            bearing: 0
        },
        FOCUS: {
            center: [60.38, 27.52],
            zoom: 4.81,
            pitch: 0,
            bearing: 0
        },
        WIDE: {
            center: [58.42, 23.008],
            zoom: 4.49,
            pitch: 0,
            bearing: 0
        },

        // --- AIS OFF ANNOTATION (where vessel went dark) ---
        AIS_OFF_COORDS: [55.7355, 26.0907],
        AIS_OFF_OFFSET: [15, -30],
    };

    // ============================================================================
    // MARKER LOCATIONS — sequential order along the track
    // ============================================================================

    // Group 1: Spoofing near Basra (AIS claimed Iraq destination)
    const SPOOF_BASRA = [
        { COORDS: [47.85, 29.95], ROTATION: 0 },
        { COORDS: [48.15, 29.55], ROTATION: 0 },
    ];

    // Group 2: Dark detection at Asaluyeh + sat image A
    const DARK_ASALUYEH = [
        { COORDS: [52.5407, 27.5232], ROTATION: 150, IMAGE: 'images/chapter10/chapter10A.png', IMG_OFFSET: [-130, 200] },
        { COORDS: [52.35, 27.35],     ROTATION: -60 },
    ];

    // Group 3: Spoofing near Dubai
    const SPOOF_DUBAI = [
        { COORDS: [55.15, 25.45], ROTATION: 0 },
        { COORDS: [55.45, 25.25], ROTATION: 0 },
    ];

    // Group 4: Dark detection SE Bandar Abbas + sat image B
    const DARK_BANDAR = {
        COORDS: [56.3771, 26.9109], ROTATION: -30,
        IMAGE: 'images/chapter10/chapter10B.png', IMG_OFFSET: [100, 0]
    };

    // Group 5: Light detections near Fujairah + 1 spoofing + sat image C
    const LIGHT_FUJAIRAH = [
        { COORDS: [56.6743, 24.5807], ROTATION: 150, IMAGE: 'images/chapter10/chapter10C.png', IMG_OFFSET: [-50, 220] },
        { COORDS: [56.45, 24.75],     ROTATION: -60 },
        { COORDS: [56.85, 24.40],     ROTATION: -30 },
    ];
    const SPOOF_FUJAIRAH = { COORDS: [56.45, 24.75], ROTATION: 0 };

    // Group 6: Dark detection at last AIS point (Gulf of Aden) + sat image D
    // Coordinates set to actual last AIS point from the geojson
    const DARK_ADEN = {
        COORDS: [48.156667, 12.943333], ROTATION: 150,
        IMAGE: 'images/chapter10/chapter10D.png', IMG_OFFSET: [-100, 0]
    };

    // Percentage thresholds for marker appearance during animation
    const PCT_SPOOF_BASRA  = 0.005;
    const PCT_DARK_ASAL    = 0.10;
    const PCT_SPOOF_DUBAI  = 0.35;
    const PCT_AIS_DARK     = 0.42;
    const PCT_DARK_BANDAR  = 0.58;
    const PCT_LIGHT_FUJ    = 0.80;
    const PCT_DARK_ADEN    = 0.98;

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    const SOURCE_ID = 'ch10-track-src';
    const LAYER_ID  = 'ch10-track-line';
    const GLOW_ID   = 'ch10-track-glow';
    const AIS_OFF_LINE_SRC = 'ch10-ais-off-line-src';
    const AIS_OFF_LINE_LYR = 'ch10-ais-off-line-lyr';

    let coords = null;
    let total = 0;
    let animId = null;
    let progress = 0;
    let startT = null;
    let running = false;
    let markersShown = false;

    let vesselMkr = null;
    let allMarkers = [];
    let allPopups  = [];
    let numberMarkers = [];
    let aisOffPopup = null;
    let aisOffDot = null;
    let pendingTimeouts = [];

    let shown = {
        basra: false, asal: false, dubai: false,
        aisDark: false, bandar: false, fuj: false, aden: false
    };

    // ============================================================================
    // INJECT STYLES
    // ============================================================================

    if (!document.getElementById('ch10-css')) {
        const css = document.createElement('style');
        css.id = 'ch10-css';
        css.textContent = `
            /* === VESSEL MARKER === */
            .ch10-vessel {
                width: ${CONFIG.VESSEL_SIZE}px;
                height: ${CONFIG.VESSEL_SIZE}px;
                background: ${CONFIG.LINE_COLOR};
                border: ${CONFIG.VESSEL_BORDER}px solid #fff;
                border-radius: 50%;
                box-shadow: 0 0 15px ${CONFIG.LINE_COLOR}, 0 0 30px ${CONFIG.LINE_COLOR}40;
            }

            /* === PULSING GLOW ANIMATIONS === */
            @keyframes ch10-glow-blue {
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
            @keyframes ch10-glow-orange-white {
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
            @keyframes ch10-glow-red {
                0%, 100% {
                    filter: drop-shadow(0 0 8px rgba(255, 77, 77, 0.6))
                            drop-shadow(0 0 14px rgba(255, 77, 77, 0.3));
                }
                50% {
                    filter: drop-shadow(0 0 12px rgba(255, 77, 77, 0.8))
                            drop-shadow(0 0 20px rgba(255, 77, 77, 0.5));
                }
            }

            /* === LIGHT DETECTION MARKER (Blue Glow) === */
            .ch10-light-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
            }
            .ch10-light-marker:hover { transform: scale(1.15); }
            .ch10-light-marker img {
                width: ${CONFIG.MARKER_SIZE}px;
                height: auto;
                animation: ch10-glow-blue 2s ease-in-out infinite;
            }

            /* === DARK DETECTION MARKER (Orange + White Tint) === */
            .ch10-dark-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
            }
            .ch10-dark-marker:hover { transform: scale(1.15); }
            .ch10-dark-marker img {
                width: ${CONFIG.MARKER_SIZE}px;
                height: auto;
                animation: ch10-glow-orange-white 2s ease-in-out infinite;
            }

            /* === SPOOFING MARKER (Red Glow) === */
            .ch10-spoof-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
            }
            .ch10-spoof-marker:hover { transform: scale(1.15); }
            .ch10-spoof-marker img {
                width: ${CONFIG.MARKER_SIZE}px;
                height: auto;
                animation: ch10-glow-red 2s ease-in-out infinite;
            }

            /* === POPUP BASE === */
            .ch10-pop .mapboxgl-popup-tip { display: none !important; }
            .ch10-pop .mapboxgl-popup-content {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
                outline: none !important;
            }

            /* === LIGHT DETECTION IMAGE HOLDER (Blue Glow) === */
            .ch10-light-img-holder {
                display: inline-block;
                padding: 0 !important;
                margin: 0 !important;
                border-radius: 4px;
                background: none !important;
                background-color: transparent !important;
                border: none !important;
                outline: none !important;
                overflow: hidden;
                box-shadow:
                    0 0 25px rgba(0, 163, 227, 0.35),
                    0 0 50px rgba(0, 163, 227, 0.15);
            }
            .ch10-light-img {
                display: block;
                width: ${CONFIG.IMG_WIDTH}px;
                height: auto;
                border-radius: 0 !important;
                border: none !important;
                outline: none !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            /* === DARK DETECTION IMAGE HOLDER (Orange + White Tint Glow) === */
            .ch10-dark-img-holder {
                display: inline-block;
                padding: 0 !important;
                margin: 0 !important;
                border-radius: 4px;
                background: none !important;
                background-color: transparent !important;
                border: none !important;
                outline: none !important;
                overflow: hidden;
                box-shadow:
                    0 0 15px rgba(255, 255, 255, 0.5),
                    0 0 30px rgba(255, 200, 100, 0.4),
                    0 0 50px rgba(255, 165, 0, 0.25);
                animation: ch10-img-glow-orange 2.5s ease-in-out infinite;
            }
            @keyframes ch10-img-glow-orange {
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
            .ch10-dark-img {
                display: block;
                width: ${CONFIG.IMG_WIDTH}px;
                height: auto;
                border-radius: 0 !important;
                border: none !important;
                outline: none !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            /* === NUMBER MARKERS (circled annotation above detection markers) === */
            .ch10-number-marker {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: rgba(17, 19, 38, 0.95);
                border: 1.5px solid #00ff88;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Inter', sans-serif;
                font-size: 10px;
                font-weight: 700;
                color: #00ff88;
                box-shadow: 0 0 8px rgba(0, 255, 136, 0.4);
                opacity: 0;
                transition: opacity 0.4s ease, transform 0.3s ease;
            }
            .ch10-number-marker.visible {
                opacity: 1;
            }
            .ch10-number-marker:hover {
                transform: scale(1.1);
            }

            /* === IMAGE NUMBER BADGE (bottom-right overlay on sat images) === */
            .ch10-img-badge {
                position: absolute;
                bottom: 6px;
                right: 6px;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: rgba(0, 20, 40, 0.85);
                border: 1.5px solid #00ff88;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'JetBrains Mono', 'Inter', monospace;
                font-size: 11px;
                font-weight: 700;
                color: #00ff88;
                z-index: 10;
                box-shadow:
                    0 0 8px rgba(0, 255, 136, 0.4),
                    0 2px 4px rgba(0, 0, 0, 0.5);
                pointer-events: none;
            }

            /* === AIS OFF DOT === */
            .ch10-ais-off-dot {
                width: 7px;
                height: 7px;
                background: #ff3b30;
                border: none;
                border-radius: 50%;
                box-shadow: 0 0 8px rgba(255, 59, 48, 0.6);
            }

            /* === AIS OFF ANNOTATION (compact, sleek) === */
            .ch10-ais-off-popup .mapboxgl-popup-tip { display: none !important; }
            .ch10-ais-off-popup .mapboxgl-popup-content {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
            }
            .ch10-ais-off-box {
                background: rgba(10, 14, 24, 0.8);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 59, 48, 0.3);
                border-radius: 6px;
                padding: 6px 10px;
                font-family: 'Space Grotesk', sans-serif;
                white-space: nowrap;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .ch10-ais-off-box svg {
                width: 11px;
                height: 11px;
                stroke: #ff3b30;
                fill: none;
                flex-shrink: 0;
            }
            .ch10-ais-off-label {
                font-size: 9px;
                font-weight: 700;
                letter-spacing: 1.2px;
                text-transform: uppercase;
                color: #ff3b30;
            }
            .ch10-ais-off-dates {
                font-size: 10px;
                font-weight: 500;
                color: rgba(255, 255, 255, 0.85);
                letter-spacing: 0.2px;
            }

            @media (max-width: 768px) {
                .ch10-ais-off-label { font-size: 8px; }
                .ch10-ais-off-dates { font-size: 9px; }
                .ch10-ais-off-box { padding: 5px 8px; }
            }

            /* === RESPONSIVE - TABLET === */
            @media (max-width: 1024px) {
                .ch10-light-marker img,
                .ch10-dark-marker img,
                .ch10-spoof-marker img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.9)}px;
                }
                .ch10-light-img,
                .ch10-dark-img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.85)}px;
                }
                .ch10-number-marker {
                    width: 18px;
                    height: 18px;
                    font-size: 9px;
                }
                .ch10-img-badge {
                    width: 18px;
                    height: 18px;
                    font-size: 9px;
                }
            }

            /* === RESPONSIVE - MOBILE === */
            @media (max-width: 768px) {
                .ch10-light-marker img,
                .ch10-dark-marker img,
                .ch10-spoof-marker img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.8)}px;
                }
                .ch10-light-img,
                .ch10-dark-img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.7)}px;
                }
                .ch10-number-marker {
                    width: 16px;
                    height: 16px;
                    font-size: 8px;
                }
                .ch10-img-badge {
                    width: 16px;
                    height: 16px;
                    font-size: 8px;
                    bottom: 4px;
                    right: 4px;
                }
            }

            /* === RESPONSIVE - SMALL MOBILE === */
            @media (max-width: 480px) {
                .ch10-light-marker img,
                .ch10-dark-marker img,
                .ch10-spoof-marker img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.7)}px;
                }
                .ch10-light-img,
                .ch10-dark-img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.55)}px;
                }
                .ch10-vessel {
                    width: ${Math.round(CONFIG.VESSEL_SIZE * 0.8)}px;
                    height: ${Math.round(CONFIG.VESSEL_SIZE * 0.8)}px;
                }
                .ch10-number-marker {
                    width: 14px;
                    height: 14px;
                    font-size: 7px;
                }
                .ch10-img-badge {
                    width: 14px;
                    height: 14px;
                    font-size: 7px;
                    bottom: 3px;
                    right: 3px;
                }
            }
        `;
        document.head.appendChild(css);
    }

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    function safeSetTimeout(fn, delay) {
        const id = setTimeout(() => {
            pendingTimeouts = pendingTimeouts.filter(t => t !== id);
            fn();
        }, delay);
        pendingTimeouts.push(id);
        return id;
    }

    function clearPendingTimeouts() {
        pendingTimeouts.forEach(id => { try { clearTimeout(id); } catch(e) {} });
        pendingTimeouts = [];
    }

    function clearLayers() {
        try { if (map.getLayer(GLOW_ID)) map.removeLayer(GLOW_ID); } catch(e) {}
        try { if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID); } catch(e) {}
        try { if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID); } catch(e) {}
        try { if (map.getLayer(AIS_OFF_LINE_LYR)) map.removeLayer(AIS_OFF_LINE_LYR); } catch(e) {}
        try { if (map.getSource(AIS_OFF_LINE_SRC)) map.removeSource(AIS_OFF_LINE_SRC); } catch(e) {}
    }

    function clearMarkers() {
        try { if (vesselMkr) { vesselMkr.remove(); } vesselMkr = null; } catch(e) { vesselMkr = null; }
        allMarkers.forEach(m => { try { m.remove(); } catch(e) {} });
        allPopups.forEach(p => { try { p.remove(); } catch(e) {} });
        numberMarkers.forEach(m => { try { m.remove(); } catch(e) {} });
        allMarkers = [];
        allPopups = [];
        numberMarkers = [];
        try { if (aisOffPopup) { aisOffPopup.remove(); } aisOffPopup = null; } catch(e) { aisOffPopup = null; }
        try { if (aisOffDot) { aisOffDot.remove(); } aisOffDot = null; } catch(e) { aisOffDot = null; }
    }

    function stopAnim() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        running = false;
    }

    // Comprehensive cleanup of markers and popups (DOM fallback)
    function clearDetectionsAndPopups() {
        console.log('  🧹 Ch10 clearDetectionsAndPopups');

        clearMarkers();

        // Fallback: Remove any lingering DOM elements with ch10 classes
        document.querySelectorAll('.ch10-light-marker, .ch10-dark-marker, .ch10-spoof-marker, .ch10-vessel, .ch10-number-marker').forEach(el => {
            try {
                const markerWrapper = el.closest('.mapboxgl-marker');
                if (markerWrapper) {
                    markerWrapper.remove();
                } else {
                    el.remove();
                }
            } catch(e) {}
        });

        // Remove any ch10 popups
        document.querySelectorAll('.ch10-pop, .ch10-ais-off-popup, .ch10-light-img-holder, .ch10-dark-img-holder, .ch10-ais-off-box').forEach(el => {
            try {
                const popup = el.closest('.mapboxgl-popup');
                if (popup) {
                    popup.remove();
                } else {
                    el.remove();
                }
            } catch(e) {}
        });

        // Additional safety: remove all mapboxgl markers containing ch10 elements
        document.querySelectorAll('.mapboxgl-marker').forEach(marker => {
            if (marker.querySelector('[class*="ch10-"]')) {
                try { marker.remove(); } catch(e) {}
            }
        });
    }

    function clearAll() {
        clearPendingTimeouts();
        stopAnim();
        clearDetectionsAndPopups();
        clearLayers();
        progress = 0;
        markersShown = false;
        shown = {
            basra: false, asal: false, dubai: false,
            aisDark: false, bandar: false, fuj: false, aden: false
        };
    }

    // ============================================================================
    // MARKER CREATION HELPERS
    // ============================================================================

    function addSvgMarker(svgFile, lngLat, cssClass, rotation) {
        const el = document.createElement('div');
        el.className = cssClass;
        el.innerHTML = `<img src="${svgFile}" alt="detection marker">`;
        const mkr = new mapboxgl.Marker({ element: el, anchor: 'center', rotation: rotation })
            .setLngLat(lngLat)
            .addTo(map);
        allMarkers.push(mkr);
        return mkr;
    }

    function addImagePopup(lngLat, imageSrc, offset, holderClass, number) {
        const imgClass = holderClass.includes('light') ? 'ch10-light-img' : 'ch10-dark-img';
        const badgeHtml = number ? `<div class="ch10-img-badge">${number}</div>` : '';
        const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch10-pop',
            offset: offset
        })
            .setLngLat(lngLat)
            .setHTML(`
                <div style="position:relative; display:inline-block;">
                    ${badgeHtml}
                    <div class="${holderClass}"><img class="${imgClass}" src="${imageSrc}"></div>
                </div>
            `)
            .addTo(map);
        allPopups.push(popup);
        return popup;
    }

    function createNumberMarker(number, lngLat, offset) {
        offset = offset || [0, -28];
        const el = document.createElement('div');
        el.className = 'ch10-number-marker';
        el.textContent = number;
        const marker = new mapboxgl.Marker({ element: el, anchor: 'center', offset: offset })
            .setLngLat(lngLat)
            .addTo(map);
        numberMarkers.push(marker);
        setTimeout(() => el.classList.add('visible'), 50);
        return marker;
    }

    // ============================================================================
    // SHOW MARKERS — called from animateRoute, plots immediately at threshold
    // ============================================================================

    function checkAndShowMarkers(mainPct) {

        // === Group 1: Spoofing near Basra ===
        if (mainPct >= PCT_SPOOF_BASRA && !shown.basra) {
            shown.basra = true;
            SPOOF_BASRA.forEach(s => addSvgMarker(CONFIG.SVG_SPOOF, s.COORDS, 'ch10-spoof-marker', s.ROTATION));
        }

        // === Group 2: Dark at Asaluyeh + sat image A (annotation #1) ===
        if (mainPct >= PCT_DARK_ASAL && !shown.asal) {
            shown.asal = true;
            const primary = DARK_ASALUYEH[0];
            addSvgMarker(CONFIG.SVG_DARK, primary.COORDS, 'ch10-dark-marker', primary.ROTATION);
            createNumberMarker('1', primary.COORDS);
            addImagePopup(primary.COORDS, primary.IMAGE, primary.IMG_OFFSET, 'ch10-dark-img-holder', 1);
            addSvgMarker(CONFIG.SVG_DARK, DARK_ASALUYEH[1].COORDS, 'ch10-dark-marker', DARK_ASALUYEH[1].ROTATION);
        }

        // === Group 3: Spoofing near Dubai ===
        if (mainPct >= PCT_SPOOF_DUBAI && !shown.dubai) {
            shown.dubai = true;
            SPOOF_DUBAI.forEach(s => addSvgMarker(CONFIG.SVG_SPOOF, s.COORDS, 'ch10-spoof-marker', s.ROTATION));
        }

        // === Group 4: AIS Off — dot + annotation line + label at the point vessel went dark ===
        if (mainPct >= PCT_AIS_DARK && !shown.aisDark) {
            shown.aisDark = true;

            // Dot at exact coordinate
            const dotEl = document.createElement('div');
            dotEl.className = 'ch10-ais-off-dot';
            aisOffDot = new mapboxgl.Marker({ element: dotEl, anchor: 'center' })
                .setLngLat(CONFIG.AIS_OFF_COORDS).addTo(map);

            // Thin annotation line from coordinate to where the popup sits
            const lineEnd = [CONFIG.AIS_OFF_COORDS[0] + 0.6, CONFIG.AIS_OFF_COORDS[1] + 0.4];
            map.addSource(AIS_OFF_LINE_SRC, {
                type: 'geojson',
                data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [CONFIG.AIS_OFF_COORDS, lineEnd] } }
            });
            map.addLayer({
                id: AIS_OFF_LINE_LYR, type: 'line', source: AIS_OFF_LINE_SRC,
                paint: { 'line-color': 'rgba(255, 59, 48, 0.5)', 'line-width': 1, 'line-dasharray': [4, 3] }
            });

            // Popup at end of line
            aisOffPopup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
                className: 'ch10-ais-off-popup',
                offset: [8, 0],
                anchor: 'left'
            })
                .setLngLat(lineEnd)
                .setHTML(`
                    <div class="ch10-ais-off-box">
                        <svg viewBox="0 0 24 24" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        <span class="ch10-ais-off-label">AIS Dark</span>
                        <span class="ch10-ais-off-dates">01 Oct 20:04 – 06 Oct 01:51 UTC</span>
                    </div>
                `)
                .addTo(map);
            allPopups.push(aisOffPopup);
        }

        // === Group 5: Dark SE Bandar Abbas + sat image B (annotation #2) ===
        if (mainPct >= PCT_DARK_BANDAR && !shown.bandar) {
            shown.bandar = true;
            addSvgMarker(CONFIG.SVG_DARK, DARK_BANDAR.COORDS, 'ch10-dark-marker', DARK_BANDAR.ROTATION);
            createNumberMarker('2', DARK_BANDAR.COORDS);
            addImagePopup(DARK_BANDAR.COORDS, DARK_BANDAR.IMAGE, DARK_BANDAR.IMG_OFFSET, 'ch10-dark-img-holder', 2);
        }

        // === Group 6: Light near Fujairah + spoofing + sat image C (annotation #3) ===
        if (mainPct >= PCT_LIGHT_FUJ && !shown.fuj) {
            shown.fuj = true;
            const primary = LIGHT_FUJAIRAH[0];
            addSvgMarker(CONFIG.SVG_LIGHT, primary.COORDS, 'ch10-light-marker', primary.ROTATION);
            createNumberMarker('3', primary.COORDS);
            addImagePopup(primary.COORDS, primary.IMAGE, primary.IMG_OFFSET, 'ch10-light-img-holder', 3);
            addSvgMarker(CONFIG.SVG_LIGHT, LIGHT_FUJAIRAH[1].COORDS, 'ch10-light-marker', LIGHT_FUJAIRAH[1].ROTATION);
            addSvgMarker(CONFIG.SVG_LIGHT, LIGHT_FUJAIRAH[2].COORDS, 'ch10-light-marker', LIGHT_FUJAIRAH[2].ROTATION);
            addSvgMarker(CONFIG.SVG_SPOOF, SPOOF_FUJAIRAH.COORDS, 'ch10-spoof-marker', SPOOF_FUJAIRAH.ROTATION);
        }

        // === Group 7: Dark at last AIS point + sat image D (annotation #4) ===
        if (mainPct >= PCT_DARK_ADEN && !shown.aden) {
            shown.aden = true;
            addSvgMarker(CONFIG.SVG_DARK, DARK_ADEN.COORDS, 'ch10-dark-marker', DARK_ADEN.ROTATION);
            createNumberMarker('4', DARK_ADEN.COORDS);
            addImagePopup(DARK_ADEN.COORDS, DARK_ADEN.IMAGE, DARK_ADEN.IMG_OFFSET, 'ch10-dark-img-holder', 4);
        }
    }

    // ============================================================================
    // LOAD DATA
    // ============================================================================

    async function loadData() {
        if (coords) return true;
        try {
            const res = await fetch(chapterConfig?.dataFile || 'data/chapter10-falcon.geojson');
            const data = await res.json();

            let coordinates;
            if (data.type === 'FeatureCollection' && data.features?.[0]?.geometry?.coordinates) {
                coordinates = data.features[0].geometry.coordinates;
            } else if (data.type === 'Feature' && data.geometry?.coordinates) {
                coordinates = data.geometry.coordinates;
            } else if (data.type === 'LineString' && data.coordinates) {
                coordinates = data.coordinates;
            }

            if (coordinates && coordinates.length) {
                coords = coordinates;
                total = coords.length;
                console.log(`  ✓ ${total} points loaded for FALCON Part 2`);
                return true;
            }
        } catch(e) { console.error('Ch10 load error:', e); }
        return false;
    }

    // ============================================================================
    // SHOW MAIN — Cinematic Camera + FALCON AIS track with sequential detections
    // Flow: Overview → route animation → flyTo focus → markers → zoom out wide
    // ============================================================================

    async function showMain() {
        console.log('  → showMain (FALCON Part 2 - Cinematic Camera)');

        // Comprehensive cleanup (clearAll handles stopAnim + clearDetectionsAndPopups + clearLayers)
        clearAll();

        await loadData();
        if (!coords || !coords.length) {
            console.error('No coordinates loaded for Chapter 10');
            return;
        }

        // === PHASE 1: Jump to overview immediately (overrides default flyTo) ===
        map.jumpTo({
            center: CONFIG.OVERVIEW.center,
            zoom: CONFIG.OVERVIEW.zoom,
            pitch: CONFIG.OVERVIEW.pitch,
            bearing: CONFIG.OVERVIEW.bearing
        });
        console.log('  Phase 1: Overview (Strait of Hormuz / Persian Gulf)');

        // Setup source & layers for line animation
        map.addSource(SOURCE_ID, {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [coords[0]] } }
        });

        map.addLayer({
            id: GLOW_ID, type: 'line', source: SOURCE_ID,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': CONFIG.GLOW_COLOR, 'line-width': 10, 'line-opacity': 0.35, 'line-blur': 5 }
        });

        map.addLayer({
            id: LAYER_ID, type: 'line', source: SOURCE_ID,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': CONFIG.LINE_COLOR, 'line-width': 3, 'line-opacity': 0.95 }
        });

        // Vessel marker
        const vel = document.createElement('div');
        vel.className = 'ch10-vessel';
        vesselMkr = new mapboxgl.Marker({ element: vel, anchor: 'center' })
            .setLngLat(coords[0]).addTo(map);

        // === PHASE 2: Start route animation ===
        safeSetTimeout(() => {
            if (!coords) return;
            console.log('  Phase 2: Starting route animation');

            progress = 0;
            running = true;
            startT = performance.now();
            animateRoute();

            // === PHASE 3: Fly to focus ===
            safeSetTimeout(() => {
                if (!coords) return;
                console.log('  Phase 3: Fly to focus');
                map.flyTo({
                    center: CONFIG.FOCUS.center,
                    zoom: CONFIG.FOCUS.zoom,
                    pitch: CONFIG.FOCUS.pitch,
                    bearing: CONFIG.FOCUS.bearing,
                    duration: 2000,
                    essential: true,
                    curve: 1.2
                });

                // === PHASE 4: Camera settled, enable markers ===
                safeSetTimeout(() => {
                    if (!coords) return;
                    console.log('  Phase 4: Markers enabled');
                    markersShown = true;
                    const pct = total ? progress / (total - 1) : 0;
                    checkAndShowMarkers(pct);

                    // === PHASE 5: Zoom out to wide view ===
                    safeSetTimeout(() => {
                        if (!coords) return;
                        console.log('  Phase 5: Wide view');
                        map.flyTo({
                            center: CONFIG.WIDE.center,
                            zoom: CONFIG.WIDE.zoom,
                            pitch: CONFIG.WIDE.pitch,
                            bearing: CONFIG.WIDE.bearing,
                            duration: 2000,
                            essential: true,
                            curve: 1.2
                        });
                    }, 2000);

                }, 2800);

            }, 1500);

        }, 1500);
    }

    // ============================================================================
    // ANIMATE ROUTE — markers appear directly as track progresses (matches ch5/ch6)
    // ============================================================================

    function animateRoute() {
        if (!running || !coords) return;

        const elapsed = performance.now() - startT;
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

            if (markersShown) {
                checkAndShowMarkers(progress / (total - 1));
            }
        }

        if (pct < 1) {
            animId = requestAnimationFrame(animateRoute);
        } else {
            // Complete — ensure full track is drawn
            const src = map.getSource(SOURCE_ID);
            if (src) {
                src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } });
            }
            if (vesselMkr) vesselMkr.setLngLat(coords[total - 1]);

            // Ensure all markers exist
            checkAndShowMarkers(1);

            running = false;
            console.log('  ✓ Chapter 10 animation complete (FALCON Part 2)');
        }
    }

    // ============================================================================
    // CLEANUP
    // ============================================================================

    function cleanup() {
        console.log('  🧹 Ch10 cleanup');
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
                animateRoute();
            }
        },
        getProgress: () => total ? progress / total : 0,
        isComplete: () => progress >= total - 1
    };
}

window.animateChapter10 = animateChapter10;
