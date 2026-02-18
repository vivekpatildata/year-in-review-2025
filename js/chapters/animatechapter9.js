// ============================================================================
// CHAPTER 9 ANIMATION - ARCTIC VOSTOK: Sanctioned Russian LNG to China
// Two-phase animation: Main scroll (Koryak FSU) + H1 (transit to Beihai)
// ============================================================================

function animateChapter9(map, chapterConfig) {
    console.log('Chapter 9: Init - ARCTIC VOSTOK');

    // ============================================================================
    // CUSTOMIZATION OPTIONS
    // ============================================================================

    const CONFIG = {
        // --- COLORS ---
        LINE_COLOR: '#00ff88',           // Green for AIS track
        GLOW_COLOR: '#00ff88',

        // --- ANIMATION TIMING ---
        AIS_ANIMATION_DURATION: 3500,    // Track animation speed (ms) - faster
        MARKER_DELAY: 300,               // Delay between marker appearances

        // --- SVG MARKER SIZE ---
        MARKER_SIZE: 40,

        // --- MARKER LOCATIONS [lng, lat] ---

        // Bunkering Detection: Koryak FSU - Aug 29 - Sep 5, 2025 - Loading LNG (Ship-to-Ship)
        BUNKERING_MKR: [159.8411, 53.2713],
        BUNKERING_MKR_LABEL: '29 Aug - 05 Sep 2025',
        BUNKERING_MKR_SUBLABEL: 'Loading LNG from KORYAK FSU',

        // Light Detection 2: Gulf of Tonkin - 20-25 Sep 2025
        LIGHT_MKR_2: [108.1903, 19.7506],
        LIGHT_MKR_2_LABEL: '20-25 Sep 2025',
        LIGHT_MKR_2_SUBLABEL: 'Holding in Gulf of Tonkin',

        // Light Detection 3: Beihai LNG Terminal - 28-30 Sep 2025 (WHITE TINT ATTENTION)
        LIGHT_MKR_3: [109.5362, 21.4488],
        LIGHT_MKR_3_LABEL: '28-30 Sep 2025',
        LIGHT_MKR_3_SUBLABEL: 'Beihai Regasification Terminal',

        // Beihai Terminal Marker (yellow dot with label)
        BEIHAI_TERMINAL: [109.5362, 21.4488],

        // --- SATELLITE IMAGE LOCATIONS [lng, lat] ---
        BUNKERING_IMG: [159.8411, 53.2713],
        BUNKERING_IMG_PATH: 'images/chapter9/chapter9A.png',
        BUNKERING_IMG_OFFSET: [160, 60],

        LIGHT_IMG_2: [108.1903, 19.7506],
        LIGHT_IMG_2_PATH: 'images/chapter9/chapter9B.png',
        LIGHT_IMG_2_OFFSET: [-200, 200],

        LIGHT_IMG_3: [109.5362, 21.4488],
        LIGHT_IMG_3_PATH: 'images/chapter9/chapter9C.png',
        LIGHT_IMG_3_OFFSET: [-220, 90],

        // --- IMAGE PLACEHOLDER SETTINGS ---
        IMG_WIDTH: 200,
        IMG_HEIGHT: 130,

        // --- VESSEL MARKER ---
        VESSEL_SIZE: 12,
    };

    // ============================================================================
    // STATE
    // ============================================================================

    const SOURCE_AIS = 'ch9-ais-src';
    const LAYER_AIS = 'ch9-ais-line';
    const LAYER_AIS_GLOW = 'ch9-ais-glow';

    let aisCoords = null;

    let animId = null;
    let progress = 0;
    let startT = null;
    let running = false;
    let phase = 'main';  // 'main' -> 'h1' -> 'complete'

    // Markers and popups
    let vesselMkr = null;
    let bunkeringMkr = null;
    let lightMkr2 = null;
    let lightMkr3 = null;
    let beihaiTerminalMkr = null;

    let bunkeringPopup = null;
    let lightPopup2 = null;
    let lightPopup3 = null;

    // Track which markers have been shown
    let bunkeringMkrShown = false;
    let lightMkr2Shown = false;
    let lightMkr3Shown = false;

    // Track if H1 animation has started
    let h1AnimationStarted = false;
    
    // Track all pending timeouts for cleanup
    let pendingTimeouts = [];

    // ============================================================================
    // INJECT STYLES
    // ============================================================================

    if (!document.getElementById('ch9-css')) {
        const css = document.createElement('style');
        css.id = 'ch9-css';
        css.textContent = `
            /* === VESSEL MARKER === */
            .ch9-vessel {
                width: ${CONFIG.VESSEL_SIZE}px;
                height: ${CONFIG.VESSEL_SIZE}px;
                background: ${CONFIG.LINE_COLOR};
                border-radius: 50%;
                box-shadow: 0 0 15px ${CONFIG.LINE_COLOR}, 0 0 30px ${CONFIG.LINE_COLOR}40;
                transition: transform 0.1s ease;
            }

            /* === BUNKERING DETECTION MARKER (Cyan Glow) === */
            .ch9-bunkering-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
                opacity: 0;
            }
            .ch9-bunkering-marker.visible {
                opacity: 1;
            }
            .ch9-bunkering-marker:hover {
                transform: scale(1.15);
            }
            .ch9-bunkering-marker img {
                width: ${CONFIG.MARKER_SIZE}px;
                height: auto;
                filter: drop-shadow(0 0 12px rgba(0, 163, 227, 0.9))
                        drop-shadow(0 0 20px rgba(0, 163, 227, 0.6))
                        drop-shadow(0 0 30px rgba(0, 163, 227, 0.4));
            }

            /* === LIGHT DETECTION MARKER (Blue Glow) === */
            .ch9-light-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
                opacity: 0;
            }
            .ch9-light-marker.visible {
                opacity: 1;
            }
            .ch9-light-marker:hover {
                transform: scale(1.15);
            }
            .ch9-light-marker img {
                width: ${CONFIG.MARKER_SIZE}px;
                height: auto;
                filter: drop-shadow(0 0 12px rgba(0, 163, 227, 0.9))
                        drop-shadow(0 0 20px rgba(0, 163, 227, 0.6))
                        drop-shadow(0 0 30px rgba(0, 163, 227, 0.4));
                animation: ch9-glow-blue 2s ease-in-out infinite;
            }
            
            @keyframes ch9-glow-blue {
                0%, 100% { filter: drop-shadow(0 0 12px rgba(0, 163, 227, 0.9)) drop-shadow(0 0 20px rgba(0, 163, 227, 0.6)); }
                50% { filter: drop-shadow(0 0 18px rgba(0, 163, 227, 1)) drop-shadow(0 0 30px rgba(0, 163, 227, 0.8)); }
            }
            
            /* === BEIHAI TERMINAL MARKER (White Tint Attention) === */
            .ch9-light-marker-primary img {
                width: ${CONFIG.MARKER_SIZE}px;
                height: auto;
                animation: ch9-glow-white 2s ease-in-out infinite;
            }
            
            @keyframes ch9-glow-white {
                0%, 100% { 
                    filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.9)) 
                            drop-shadow(0 0 25px rgba(0, 163, 227, 0.7))
                            drop-shadow(0 0 35px rgba(255, 165, 0, 0.5)); 
                }
                50% { 
                    filter: drop-shadow(0 0 25px rgba(255, 255, 255, 1)) 
                            drop-shadow(0 0 40px rgba(0, 163, 227, 0.9))
                            drop-shadow(0 0 50px rgba(255, 165, 0, 0.7)); 
                }
            }
            
            /* === BEIHAI TERMINAL LABEL (Yellow Dot) === */
            .ch9-terminal-marker {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                pointer-events: none;
                z-index: 1000;
            }
            
            .ch9-terminal-dot {
                width: 10px;
                height: 10px;
                background: #ffa500;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(255, 165, 0, 0.8),
                            0 0 20px rgba(255, 165, 0, 0.5),
                            0 0 30px rgba(255, 165, 0, 0.3);
                animation: ch9-terminal-pulse 2s ease-in-out infinite;
            }
            
            @keyframes ch9-terminal-pulse {
                0%, 100% { 
                    box-shadow: 0 0 10px rgba(255, 165, 0, 0.8), 0 0 20px rgba(255, 165, 0, 0.5); 
                    transform: scale(1);
                }
                50% { 
                    box-shadow: 0 0 15px rgba(255, 165, 0, 1), 0 0 30px rgba(255, 165, 0, 0.7); 
                    transform: scale(1.1);
                }
            }
            
            .ch9-terminal-label {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 9px;
                font-weight: 700;
                letter-spacing: 1.5px;
                text-transform: uppercase;
                color: #ffa500;
                text-shadow: 0 0 8px rgba(0, 0, 0, 1),
                            0 0 15px rgba(0, 0, 0, 0.8),
                            0 1px 3px rgba(0, 0, 0, 0.9);
                white-space: nowrap;
            }
            
            /* === BEIHAI IMAGE HOLDER (White Tint Glow - ATTENTION) === */
            .ch9-beihai-img-holder {
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
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                animation: ch9-beihai-img-glow 2.5s ease-in-out infinite;
            }
            @keyframes ch9-beihai-img-glow {
                0%, 100% {
                    box-shadow:
                        0 0 15px rgba(255, 255, 255, 0.5),
                        0 0 30px rgba(255, 200, 100, 0.4),
                        0 0 50px rgba(255, 165, 0, 0.25);
                }
                50% {
                    box-shadow:
                        0 0 22px rgba(255, 255, 255, 0.7),
                        0 0 40px rgba(255, 200, 100, 0.55),
                        0 0 65px rgba(255, 165, 0, 0.4);
                }
            }
            .ch9-beihai-img-holder:hover {
                transform: scale(1.05);
                box-shadow:
                    0 0 25px rgba(255, 255, 255, 0.7),
                    0 0 45px rgba(255, 200, 100, 0.5),
                    0 0 70px rgba(255, 165, 0, 0.35);
            }
            .ch9-beihai-img-holder img {
                display: block;
                width: ${CONFIG.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
            }

            /* === POPUP BASE (No black edges) === */
            .ch9-pop .mapboxgl-popup-tip { display: none !important; }
            .ch9-pop .mapboxgl-popup-content {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
                outline: none !important;
                border-radius: 0 !important;
            }
            .ch9-pop .mapboxgl-popup-content * {
                background: transparent !important;
            }
            .ch9-pop .mapboxgl-popup-content img {
                background: transparent !important;
                border: none !important;
            }

            /* === SATELLITE IMAGES (Consistent with other chapters) === */
            .ch9-sat-img {
                display: block;
                max-width: ${CONFIG.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                background: transparent !important;
                border: none !important;
                box-shadow:
                    0 0 25px rgba(0, 163, 227, 0.35),
                    0 0 50px rgba(0, 163, 227, 0.15);
            }
            
            .ch9-sat-img-holder {
                background: transparent !important;
                border: none !important;
                padding: 0 !important;
            }
            
            /* === REGULAR IMAGE HOLDER (Blue Glow - matches Ch1 STS style) === */
            .ch9-regular-img-holder {
                background: transparent !important;
                border: none !important;
                padding: 0 !important;
                border-radius: 10px;
                overflow: hidden;
                box-shadow:
                    0 0 20px rgba(0, 163, 227, 0.4),
                    0 0 40px rgba(0, 163, 227, 0.25),
                    0 0 50px rgba(0, 163, 227, 0.15);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                animation: ch9-blue-img-glow 2.5s ease-in-out infinite;
            }
            .ch9-regular-img-holder:hover {
                transform: scale(1.05);
                box-shadow:
                    0 0 30px rgba(0, 163, 227, 0.55),
                    0 0 50px rgba(0, 163, 227, 0.35),
                    0 0 65px rgba(0, 163, 227, 0.2);
            }
            @keyframes ch9-blue-img-glow {
                0%, 100% {
                    box-shadow:
                        0 0 20px rgba(0, 163, 227, 0.4),
                        0 0 40px rgba(0, 163, 227, 0.25),
                        0 0 50px rgba(0, 163, 227, 0.15);
                }
                50% {
                    box-shadow:
                        0 0 28px rgba(0, 163, 227, 0.55),
                        0 0 50px rgba(0, 163, 227, 0.35),
                        0 0 65px rgba(0, 163, 227, 0.2);
                }
            }
            
            .ch9-regular-img-holder .ch9-sat-img {
                background: transparent !important;
                border: none !important;
            }

            /* === IMAGE PLACEHOLDER (shown while loading) === */
            .ch9-img-placeholder {
                width: ${CONFIG.IMG_WIDTH}px;
                height: ${CONFIG.IMG_HEIGHT}px;
                border-radius: 6px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: 'Inter', sans-serif;
                font-size: 10px;
                font-weight: 500;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                opacity: 0;
                transition: opacity 0.4s ease;
                gap: 4px;
            }

            .ch9-img-placeholder.visible {
                opacity: 1;
            }

            /* Blue placeholder */
            .ch9-img-placeholder.blue {
                background: rgba(0, 163, 227, 0.15);
                border: 2px solid rgba(0, 163, 227, 0.6);
                color: rgba(0, 163, 227, 0.9);
                box-shadow: 0 0 20px rgba(0, 163, 227, 0.3);
            }

            .ch9-popup-label {
                font-size: 11px;
                font-weight: 600;
                margin-bottom: 2px;
            }

            .ch9-popup-sublabel {
                font-size: 8px;
                opacity: 0.7;
                text-align: center;
                max-width: 180px;
            }

            /* === LEGEND === */
            .ch9-legend {
                position: absolute;
                bottom: 30px;
                left: 30px;
                background: rgba(17, 19, 38, 0.9);
                backdrop-filter: blur(10px);
                border-radius: 8px;
                padding: 16px 20px;
                font-family: 'Inter', sans-serif;
                z-index: 100;
                border: 1px solid rgba(255,255,255,0.1);
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.5s ease, transform 0.5s ease;
            }

            .ch9-legend.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .ch9-legend-title {
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 1px;
                text-transform: uppercase;
                color: rgba(255,255,255,0.6);
                margin-bottom: 12px;
            }

            .ch9-legend-item {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 8px;
                font-size: 12px;
                color: rgba(255,255,255,0.85);
            }

            .ch9-legend-item:last-child {
                margin-bottom: 0;
            }

            .ch9-legend-line {
                width: 24px;
                height: 3px;
                border-radius: 2px;
                background: ${CONFIG.LINE_COLOR};
            }

            .ch9-legend-icon {
                width: 20px;
                height: auto;
            }

            /* === RESPONSIVE - TABLET === */
            @media (max-width: 1024px) {
                .ch9-bunkering-marker img,
                .ch9-light-marker img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.9)}px;
                }
                .ch9-sat-img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.85)}px;
                }
                .ch9-legend {
                    padding: 14px 18px;
                }
            }

            /* === RESPONSIVE - MOBILE === */
            @media (max-width: 768px) {
                .ch9-bunkering-marker img,
                .ch9-light-marker img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.8)}px;
                }
                .ch9-sat-img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.7)}px;
                }
                .ch9-legend {
                    bottom: 20px;
                    left: 20px;
                    padding: 12px 16px;
                }
                .ch9-legend-item {
                    font-size: 11px;
                }
            }

            /* === RESPONSIVE - SMALL MOBILE === */
            @media (max-width: 480px) {
                .ch9-bunkering-marker img,
                .ch9-light-marker img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.7)}px;
                }
                .ch9-sat-img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.55)}px;
                }
                .ch9-vessel {
                    width: ${Math.round(CONFIG.VESSEL_SIZE * 0.8)}px;
                    height: ${Math.round(CONFIG.VESSEL_SIZE * 0.8)}px;
                }
                .ch9-legend {
                    bottom: 15px;
                    left: 15px;
                    padding: 10px 14px;
                }
                .ch9-legend-title {
                    font-size: 10px;
                    margin-bottom: 10px;
                }
                .ch9-legend-item {
                    font-size: 10px;
                    gap: 8px;
                    margin-bottom: 6px;
                }
                .ch9-legend-line {
                    width: 20px;
                }
                .ch9-legend-icon {
                    width: 16px;
                }
            }
        `;
        document.head.appendChild(css);
    }

    // ============================================================================
    // CLEANUP
    // ============================================================================

    function stopAnim() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        running = false;
    }

    function clearMarkers() {
        [vesselMkr, bunkeringMkr, lightMkr2, lightMkr3, beihaiTerminalMkr].forEach(m => m?.remove());
        vesselMkr = bunkeringMkr = lightMkr2 = lightMkr3 = beihaiTerminalMkr = null;

        [bunkeringPopup, lightPopup2, lightPopup3].forEach(p => p?.remove());
        bunkeringPopup = lightPopup2 = lightPopup3 = null;

        bunkeringMkrShown = lightMkr2Shown = lightMkr3Shown = false;

        const legend = document.querySelector('.ch9-legend');
        if (legend) legend.remove();
        
        // Remove terminal marker from DOM
        document.querySelectorAll('.ch9-terminal-marker').forEach(el => el.remove());
    }

    function clearLayers() {
        [LAYER_AIS, LAYER_AIS_GLOW].forEach(id => {
            if (map.getLayer(id)) map.removeLayer(id);
        });
        [SOURCE_AIS].forEach(id => {
            if (map.getSource(id)) map.removeSource(id);
        });
    }

    function clearAll() {
        stopAnim();
        clearPendingTimeouts();
        clearMarkers();
        clearLayers();
        progress = 0;
        phase = 'main';
        h1AnimationStarted = false;
    }
    
    // Clear all pending timeouts
    function clearPendingTimeouts() {
        pendingTimeouts.forEach(id => {
            try { clearTimeout(id); } catch(e) {}
        });
        pendingTimeouts = [];
    }
    
    // Helper to track setTimeout
    function safeSetTimeout(fn, delay) {
        const id = setTimeout(() => {
            // Remove from tracking array when executed
            pendingTimeouts = pendingTimeouts.filter(t => t !== id);
            fn();
        }, delay);
        pendingTimeouts.push(id);
        return id;
    }

    // Comprehensive cleanup for same-family transitions
    function clearDetectionsAndPopups() {
        console.log('[CH9] clearDetectionsAndPopups called');
        clearPendingTimeouts();
        
        // Remove markers
        [vesselMkr, bunkeringMkr, lightMkr2, lightMkr3, beihaiTerminalMkr].forEach(m => {
            try { if (m) m.remove(); } catch(e) {}
        });
        vesselMkr = bunkeringMkr = lightMkr2 = lightMkr3 = beihaiTerminalMkr = null;
        
        // Remove popups
        [bunkeringPopup, lightPopup2, lightPopup3].forEach(p => {
            try { if (p) p.remove(); } catch(e) {}
        });
        bunkeringPopup = lightPopup2 = lightPopup3 = null;
        
        // Reset marker flags
        bunkeringMkrShown = lightMkr2Shown = lightMkr3Shown = false;
        
        // DOM fallback cleanup
        const selectors = [
            '.ch9-bunkering-marker', '.ch9-light-marker', '.ch9-light-marker-primary',
            '.ch9-img-placeholder', '.ch9-sat-img', '.ch9-pop', '.ch9-vessel',
            '.ch9-terminal-marker', '.ch9-beihai-img-holder', '.ch9-regular-img-holder'
        ];
        document.querySelectorAll(selectors.join(', ')).forEach(el => {
            try {
                const wrapper = el.closest('.mapboxgl-marker');
                if (wrapper) wrapper.remove();
                else el.remove();
            } catch(e) {}
        });
    }

    // ============================================================================
    // LOAD DATA
    // ============================================================================

    async function loadData() {
        if (aisCoords) return true;
        try {
            const res = await fetch(chapterConfig?.dataFile || 'data/chapter9-arcticvostok.geojson');
            const data = await res.json();
            if (data?.features?.[0]?.geometry?.coordinates) {
                aisCoords = data.features[0].geometry.coordinates;
                console.log(`  Loaded ${aisCoords.length} AIS coordinates`);
                return true;
            }
        } catch (e) {
            console.error('Chapter 9 load error:', e);
        }
        return false;
    }

    // ============================================================================
    // MARKER HELPERS
    // ============================================================================

    function createBunkeringMarker(svgPath) {
        const el = document.createElement('div');
        el.className = 'ch9-bunkering-marker';
        el.innerHTML = `<img src="${svgPath}" alt="Bunkering Detection">`;
        return el;
    }

    function createLightMarker(svgPath) {
        const el = document.createElement('div');
        el.className = 'ch9-light-marker';
        el.innerHTML = `<img src="${svgPath}" alt="Light Detection">`;
        return el;
    }
    
    // Primary light marker with white tint attention
    function createLightMarkerPrimary(svgPath) {
        const el = document.createElement('div');
        el.className = 'ch9-light-marker-primary';
        el.innerHTML = `<img src="${svgPath}" alt="Light Detection">`;
        return el;
    }
    
    // Beihai Terminal marker (yellow dot with label)
    function createTerminalMarker() {
        const el = document.createElement('div');
        el.className = 'ch9-terminal-marker';
        el.innerHTML = `
            <div class="ch9-terminal-label">BEIHAI REGASIFICATION TERMINAL</div>
            <div class="ch9-terminal-dot"></div>
        `;
        return el;
    }

    function showMarker(marker) {
        if (marker?.getElement) {
            marker.getElement().classList.add('visible');
        }
    }

    function createImagePopup(lngLat, imagePath, colorType, offset, label, sublabel) {
        const uniqueId = `ph-${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
        return new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch9-pop',
            offset: offset
        })
            .setLngLat(lngLat)
            .setHTML(`
                <div class="ch9-regular-img-holder">
                    <div class="ch9-img-placeholder ${colorType}" id="${uniqueId}">
                        <span class="ch9-popup-label">${label}</span>
                        <span class="ch9-popup-sublabel">${sublabel || 'SAT IMAGE'}</span>
                    </div>
                    <img class="ch9-sat-img" src="${imagePath}"
                         style="display:none;"
                         onload="this.style.display='block'; this.previousElementSibling.style.display='none';"
                         onerror="this.style.display='none';">
                </div>
            `)
            .addTo(map);
    }
    
    // Beihai image popup with white tint glow holder
    function createBeihaiImagePopup(lngLat, imagePath, offset, label, sublabel) {
        return new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch9-pop',
            offset: offset
        })
            .setLngLat(lngLat)
            .setHTML(`
                <div class="ch9-beihai-img-holder">
                    <img src="${imagePath}" onerror="this.parentElement.style.display='none';">
                </div>
            `)
            .addTo(map);
    }

    function showPopup(popup) {
        if (popup) {
            const el = popup.getElement();
            if (el) {
                const placeholder = el.querySelector('.ch9-img-placeholder');
                if (placeholder) placeholder.classList.add('visible');
            }
        }
    }

    // ============================================================================
    // CREATE LEGEND
    // ============================================================================

    function createLegend() {
        const existing = document.querySelector('.ch9-legend');
        if (existing) existing.remove();

        const legend = document.createElement('div');
        legend.className = 'ch9-legend';
        legend.innerHTML = `
            <div class="ch9-legend-title">Legend</div>
            <div class="ch9-legend-item">
                <div class="ch9-legend-line"></div>
                <span>ARCTIC VOSTOK AIS Track</span>
            </div>
            <div class="ch9-legend-item">
                <img class="ch9-legend-icon" src="lightdetection.svg" alt="">
                <span>Light Detection</span>
            </div>
            <div class="ch9-legend-item">
                <img class="ch9-legend-icon" src="bunkering.svg" alt="">
                <span>Bunkering Detection</span>
            </div>
        `;

        document.body.appendChild(legend);
        setTimeout(() => legend.classList.add('visible'), 100);
    }

    // ============================================================================
    // SHOW MAIN - Initial view at Koryak FSU with first light detection marker
    // ============================================================================

    async function showMain() {
        console.log('  showMain (ARCTIC VOSTOK - Koryak FSU STS Transfer)');
        stopAnim();
        clearDetectionsAndPopups();
        clearAll();

        await loadData();
        if (!aisCoords?.length) return;

        // Add AIS track source - starts empty
        map.addSource(SOURCE_AIS, {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
        });

        // AIS Glow
        map.addLayer({
            id: LAYER_AIS_GLOW,
            type: 'line',
            source: SOURCE_AIS,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
                'line-color': CONFIG.GLOW_COLOR,
                'line-width': 10,
                'line-opacity': 0.3,
                'line-blur': 5
            }
        });

        // AIS Main (solid)
        map.addLayer({
            id: LAYER_AIS,
            type: 'line',
            source: SOURCE_AIS,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
                'line-color': CONFIG.LINE_COLOR,
                'line-width': 3,
                'line-opacity': 0.95
            }
        });

        // Create bunkering marker immediately (Koryak FSU - Ship-to-Ship transfer)
        // Bunkering SVG is square, default 12 o'clock. 7 o'clock = 210°
        const bunkeringEl = createBunkeringMarker('assets/svg/bunkering.svg');
        bunkeringMkr = new mapboxgl.Marker({ element: bunkeringEl, anchor: 'center', rotation: 225 })
            .setLngLat(CONFIG.BUNKERING_MKR)
            .addTo(map);
        bunkeringPopup = createImagePopup(
            CONFIG.BUNKERING_IMG,
            CONFIG.BUNKERING_IMG_PATH,
            'blue',
            CONFIG.BUNKERING_IMG_OFFSET,
            CONFIG.BUNKERING_MKR_LABEL,
            CONFIG.BUNKERING_MKR_SUBLABEL
        );
        setTimeout(() => {
            showMarker(bunkeringMkr);
            showPopup(bunkeringPopup);
            bunkeringMkrShown = true;
        }, 300);

        // Create legend
        createLegend();

        phase = 'main';
        console.log('  Main scroll complete - Koryak FSU marker shown');
    }

    // ============================================================================
    // SHOW H1 - Animate vessel path with remaining detections
    // ============================================================================

    function showH1() {
        console.log('  showH1 (ARCTIC VOSTOK - Beihai Delivery)');
        stopAnim();
        clearDetectionsAndPopups();

        if (h1AnimationStarted) {
            console.log('  H1 animation already started, skipping...');
            return;
        }
        h1AnimationStarted = true;

        if (!aisCoords?.length) {
            console.log('  No AIS coords, loading data...');
            loadData().then(() => {
                if (aisCoords?.length) startH1WithCinematicCamera();
            });
            return;
        }

        startH1WithCinematicCamera();
    }

    // Cinematic camera animation: zoom out → animate route → zoom into destination → show markers
    function startH1WithCinematicCamera() {
        console.log('  Starting cinematic camera animation...');
        
        // Comprehensive cleanup first
        clearDetectionsAndPopups();
        
        // IMMEDIATELY jump to overview to override default flyTo
        map.jumpTo({
            center: [144.18, 39.02],
            zoom: 3.1,
            pitch: 32,
            bearing: -21.6
        });
        
        // Delay before starting the animation sequence - let user see the overview
        safeSetTimeout(() => {
            // Start the line animation (route only, NO markers during overview)
            startH1AnimationRouteOnly();
            
            // After showing the route plotting for a bit, smoothly zoom to destination
            safeSetTimeout(() => {
                console.log('  Zooming to destination...');
                map.flyTo({
                    center: [109.218, 19.617],
                    zoom: 5.4,
                    pitch: 1,
                    bearing: 19.2,
                    duration: 1500,  // Smooth 2 second zoom in
                    essential: true,
                    curve: 1.2  // Smooth easing curve
                });
                
                // ONLY show markers AFTER camera fully settles (2s zoom + 800ms buffer)
                safeSetTimeout(() => {
                    console.log('  Camera settled, now showing markers...');
                    showH1MarkersSequentially();
                }, 2800);
                
            }, 1500);  // Wait 2s to let the route animation get going
            
        }, 1500);  // 2s delay to let user see the overview first
    }
    
    // Route animation only (no markers) - used during overview zoom
    function startH1AnimationRouteOnly() {
        if (!aisCoords?.length) return;
        
        // Ensure source exists
        if (!map.getSource(SOURCE_AIS)) {
            map.addSource(SOURCE_AIS, {
                type: 'geojson',
                data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [aisCoords[0]] } }
            });
        }
        
        // Ensure layers exist
        if (!map.getLayer(LAYER_AIS_GLOW)) {
            map.addLayer({
                id: LAYER_AIS_GLOW,
                type: 'line',
                source: SOURCE_AIS,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': CONFIG.GLOW_COLOR,
                    'line-width': 10,
                    'line-opacity': 0.3,
                    'line-blur': 5
                }
            });
        }
        
        if (!map.getLayer(LAYER_AIS)) {
            map.addLayer({
                id: LAYER_AIS,
                type: 'line',
                source: SOURCE_AIS,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': CONFIG.LINE_COLOR,
                    'line-width': 3,
                    'line-opacity': 0.95
                }
            });
        }
        
        // Animate the full route quickly
        let routeProgress = 0;
        const routeDuration = 3500;
        const routeStartTime = performance.now();
        
        function animateRoute() {
            const elapsed = performance.now() - routeStartTime;
            routeProgress = Math.min(elapsed / routeDuration, 1);
            
            const idx = Math.floor(routeProgress * (aisCoords.length - 1));
            const lineCoords = aisCoords.slice(0, idx + 1);
            
            const src = map.getSource(SOURCE_AIS);
            if (src && lineCoords.length > 0) {
                src.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: lineCoords }
                });
            }
            
            if (routeProgress < 1) {
                requestAnimationFrame(animateRoute);
            } else {
                // Ensure full route is drawn
                if (src) {
                    src.setData({
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: aisCoords }
                    });
                }
                console.log('  Route animation complete');
            }
        }
        
        animateRoute();
    }
    
    // Show h1 markers sequentially AFTER camera settles
    function showH1MarkersSequentially() {
        console.log('  Showing markers sequentially...');
        phase = 'h1';
        
        // First marker: Gulf of Tonkin (after 400ms)
        safeSetTimeout(() => {
            if (lightMkr2Shown) return;
            lightMkr2Shown = true;
            
            // SVG points right (3 o'clock), 11 o'clock = -120°
            const lightEl2 = createLightMarker('assets/svg/lightdetection.svg');
            lightMkr2 = new mapboxgl.Marker({ element: lightEl2, anchor: 'center', rotation: -120 })
                .setLngLat(CONFIG.LIGHT_MKR_2)
                .addTo(map);
            lightPopup2 = createImagePopup(
                CONFIG.LIGHT_IMG_2,
                CONFIG.LIGHT_IMG_2_PATH,
                'blue',
                CONFIG.LIGHT_IMG_2_OFFSET,
                CONFIG.LIGHT_MKR_2_LABEL,
                CONFIG.LIGHT_MKR_2_SUBLABEL
            );
            safeSetTimeout(() => {
                showMarker(lightMkr2);
                showPopup(lightPopup2);
            }, 100);
        }, 400);
        
        // Second marker: Beihai with white tint (after 1500ms)
        safeSetTimeout(() => {
            if (lightMkr3Shown) return;
            lightMkr3Shown = true;
            
            // Primary light marker with white tint glow
            // SVG points right (3 o'clock), 1 o'clock = -60°
            const lightEl3 = createLightMarkerPrimary('assets/svg/lightdetection.svg');
            lightMkr3 = new mapboxgl.Marker({ element: lightEl3, anchor: 'center', rotation: -60 })
                .setLngLat(CONFIG.LIGHT_MKR_3)
                .addTo(map);
            
            // Satellite image popup with white tint holder
            lightPopup3 = createBeihaiImagePopup(
                CONFIG.LIGHT_IMG_3,
                CONFIG.LIGHT_IMG_3_PATH,
                CONFIG.LIGHT_IMG_3_OFFSET,
                CONFIG.LIGHT_MKR_3_LABEL,
                CONFIG.LIGHT_MKR_3_SUBLABEL
            );
            
            safeSetTimeout(() => {
                showMarker(lightMkr3);
                showPopup(lightPopup3);
            }, 100);
        }, 1500);
        
        // Third marker: Beihai Terminal yellow dot (after 2200ms)
        safeSetTimeout(() => {
            const terminalEl = createTerminalMarker();
            beihaiTerminalMkr = new mapboxgl.Marker({ element: terminalEl, anchor: 'bottom' })
                .setLngLat([CONFIG.BEIHAI_TERMINAL[0], CONFIG.BEIHAI_TERMINAL[1] + 0.15])
                .addTo(map);
            
            phase = 'complete';
            console.log('  All h1 markers shown');
        }, 2200);
    }

    function startH1Animation() {
        console.log('  Starting H1 animation with', aisCoords.length, 'coordinates');

        // Ensure source exists - recreate if needed
        if (!map.getSource(SOURCE_AIS)) {
            console.log('  Recreating AIS source for H1...');
            map.addSource(SOURCE_AIS, {
                type: 'geojson',
                data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [aisCoords[0]] } }
            });
        }

        // Ensure layers exist - recreate if needed
        if (!map.getLayer(LAYER_AIS_GLOW)) {
            console.log('  Recreating AIS glow layer for H1...');
            map.addLayer({
                id: LAYER_AIS_GLOW,
                type: 'line',
                source: SOURCE_AIS,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': CONFIG.GLOW_COLOR,
                    'line-width': 10,
                    'line-opacity': 0.3,
                    'line-blur': 5
                }
            });
        }

        if (!map.getLayer(LAYER_AIS)) {
            console.log('  Recreating AIS line layer for H1...');
            map.addLayer({
                id: LAYER_AIS,
                type: 'line',
                source: SOURCE_AIS,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': CONFIG.LINE_COLOR,
                    'line-width': 3,
                    'line-opacity': 0.95
                }
            });
        }

        // Start animation
        progress = 0;
        phase = 'h1';
        running = true;
        startT = performance.now();
        animate();
    }

    // ============================================================================
    // ANIMATION
    // ============================================================================

    function animate() {
        if (!running) return;

        const elapsed = performance.now() - startT;

        if (phase === 'h1') {
            animateH1(elapsed);
        }

        if (running) {
            animId = requestAnimationFrame(animate);
        }
    }

    function animateH1(elapsed) {
        // Two-phase timing: first 50% of line at normal speed, last 50% much slower
        // Time allocation: 30% of duration for first half, 70% for second half
        const FIRST_HALF_TIME_RATIO = 0.3;  // First 50% of line takes 30% of time
        const SECOND_HALF_TIME_RATIO = 0.7; // Last 50% of line takes 70% of time (much slower)

        const totalDuration = CONFIG.AIS_ANIMATION_DURATION;
        const firstHalfDuration = totalDuration * FIRST_HALF_TIME_RATIO;

        let pct;
        if (elapsed <= firstHalfDuration) {
            // First phase: 0-50% of line in first 40% of time
            const phaseProgress = elapsed / firstHalfDuration;
            pct = phaseProgress * 0.5; // Maps 0-1 to 0-0.5
        } else {
            // Second phase: 50-100% of line in remaining 60% of time (slower)
            const phaseElapsed = elapsed - firstHalfDuration;
            const secondHalfDuration = totalDuration * SECOND_HALF_TIME_RATIO;
            const phaseProgress = Math.min(phaseElapsed / secondHalfDuration, 1);
            pct = 0.5 + (phaseProgress * 0.5); // Maps 0-1 to 0.5-1.0
        }

        pct = Math.min(pct, 1);
        const total = aisCoords.length;
        const idx = Math.floor(pct * (total - 1));

        // Build line coordinates up to current index
        const lineCoords = aisCoords.slice(0, idx + 1);

        // Update line - every frame
        const src = map.getSource(SOURCE_AIS);
        if (src && lineCoords.length > 0) {
            src.setData({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: lineCoords }
            });
        }

        // Track progress for marker triggers
        progress = idx;

        // Light Detection 2: Gulf of Tonkin (~60% through track)
        // SVG points right (3 o'clock), 11 o'clock = -120°
        if (!lightMkr2Shown && pct >= 0.60) {
            lightMkr2Shown = true;
            const lightEl2 = createLightMarker('assets/svg/lightdetection.svg');
            lightMkr2 = new mapboxgl.Marker({ element: lightEl2, anchor: 'center', rotation: -120 })
                .setLngLat(CONFIG.LIGHT_MKR_2)
                .addTo(map);
            lightPopup2 = createImagePopup(
                CONFIG.LIGHT_IMG_2,
                CONFIG.LIGHT_IMG_2_PATH,
                'blue',
                CONFIG.LIGHT_IMG_2_OFFSET,
                CONFIG.LIGHT_MKR_2_LABEL,
                CONFIG.LIGHT_MKR_2_SUBLABEL
            );
            setTimeout(() => {
                showMarker(lightMkr2);
                showPopup(lightPopup2);
            }, 50);
        }

        // Light Detection 3: Beihai (~90% through track) - WHITE TINT ATTENTION
        // SVG points right (3 o'clock), 1 o'clock = -60°
        if (!lightMkr3Shown && pct >= 0.90) {
            lightMkr3Shown = true;
            
            // Primary light marker with white tint glow
            const lightEl3 = createLightMarkerPrimary('assets/svg/lightdetection.svg');
            lightMkr3 = new mapboxgl.Marker({ element: lightEl3, anchor: 'center', rotation: -60 })
                .setLngLat(CONFIG.LIGHT_MKR_3)
                .addTo(map);
            
            // Satellite image popup with white tint holder
            lightPopup3 = createBeihaiImagePopup(
                CONFIG.LIGHT_IMG_3,
                CONFIG.LIGHT_IMG_3_PATH,
                CONFIG.LIGHT_IMG_3_OFFSET,
                CONFIG.LIGHT_MKR_3_LABEL,
                CONFIG.LIGHT_MKR_3_SUBLABEL
            );
            
            // Beihai Terminal yellow dot marker
            const terminalEl = createTerminalMarker();
            beihaiTerminalMkr = new mapboxgl.Marker({ element: terminalEl, anchor: 'bottom' })
                .setLngLat([CONFIG.BEIHAI_TERMINAL[0], CONFIG.BEIHAI_TERMINAL[1] + 0.15])  // Slightly above
                .addTo(map);
            
            setTimeout(() => {
                showMarker(lightMkr3);
                showPopup(lightPopup3);
            }, 50);
        }

        if (pct >= 1) {
            // Complete H1 phase - ensure full path is drawn
            const src = map.getSource(SOURCE_AIS);
            if (src) {
                src.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: aisCoords }
                });
            }

            // Ensure all markers are shown at completion (fallback)
            if (!lightMkr2Shown) {
                const lightEl2 = createLightMarker('assets/svg/lightdetection.svg');
                lightMkr2 = new mapboxgl.Marker({ element: lightEl2, anchor: 'center', rotation: -120 })
                    .setLngLat(CONFIG.LIGHT_MKR_2)
                    .addTo(map);
                lightPopup2 = createImagePopup(
                    CONFIG.LIGHT_IMG_2,
                    CONFIG.LIGHT_IMG_2_PATH,
                    'blue',
                    CONFIG.LIGHT_IMG_2_OFFSET,
                    CONFIG.LIGHT_MKR_2_LABEL,
                    CONFIG.LIGHT_MKR_2_SUBLABEL
                );
                showMarker(lightMkr2);
                showPopup(lightPopup2);
                lightMkr2Shown = true;
            }

            if (!lightMkr3Shown) {
                const lightEl3 = createLightMarkerPrimary('assets/svg/lightdetection.svg');
                lightMkr3 = new mapboxgl.Marker({ element: lightEl3, anchor: 'center', rotation: -60 })
                    .setLngLat(CONFIG.LIGHT_MKR_3)
                    .addTo(map);
                lightPopup3 = createImagePopup(
                    CONFIG.LIGHT_IMG_3,
                    CONFIG.LIGHT_IMG_3_PATH,
                    'blue',
                    CONFIG.LIGHT_IMG_3_OFFSET,
                    CONFIG.LIGHT_MKR_3_LABEL,
                    CONFIG.LIGHT_MKR_3_SUBLABEL
                );
                showMarker(lightMkr3);
                showPopup(lightPopup3);
                lightMkr3Shown = true;
            }

            phase = 'complete';
            running = false;
            console.log('  ✓ Animation complete (ARCTIC VOSTOK)');
        }
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        showMain,
        showH1,
        stop: clearAll,
        cleanup: clearAll,
        pause: stopAnim,
        resume: () => {
            if (!running && aisCoords) {
                running = true;
                animate();
            }
        },
        getProgress: () => {
            if (!aisCoords) return 0;
            if (phase === 'main') return 0;
            if (phase === 'h1') return progress / aisCoords.length;
            return 1;
        },
        isComplete: () => phase === 'complete'
    };
}

window.animateChapter9 = animateChapter9;
