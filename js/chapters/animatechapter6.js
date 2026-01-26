// ============================================================================
// CHAPTER 6 ANIMATION - ETERNITY C: Houthi Attack & Sinking in Red Sea
// Story: Liberia-flagged bulk carrier ETERNITY C (IMO: 9588249) was targeted
// by Houthi militia on 07 July 2025 while transiting the Red Sea dark.
// The vessel was observed drifting on 08 July as UI small vessels departed.
// By 09 July, ETERNITY C had sunk, leaving only a visible oil slick.
// Prior: Loaded cargo at Berbera Port, Somalia from 30 Jun - 06 Jul 2025.
// ============================================================================

function animateChapter6(map, chapterConfig) {
    console.log('Chapter 6: Init - ETERNITY C');

    // ============================================================================
    // CUSTOMIZATION OPTIONS
    // ============================================================================

    const CONFIG = {
        // --- COLORS ---
        LINE_COLOR: '#00ff88',               // Neon green for AIS track (solid)
        GLOW_COLOR: '#00ff88',
        DARK_LINE_COLOR: '#ff6b6b',          // Red-ish for dark/assessed track (danger)
        DARK_GLOW_COLOR: '#ff6b6b',

        // --- ANIMATION DURATIONS ---
        SOLID_DURATION: 3000,                // Solid line animation (faster)
        DOTTED_DURATION: 5000,               // Dotted line animation (SLOWER - dramatic)
        PAUSE_AFTER_SOLID: 800,              // Pause after solid line before dotted starts

        // --- SVG MARKER FILES ---
        SVG_LIGHT: 'assets/svg/lightdetection.svg',
        SVG_DARK: 'assets/svg/darkdetection.svg',

        // --- MARKER SIZES ---
        LIGHT_MARKER_SIZE: 32,
        DARK_MARKER_SIZE: 40,

        // --- VESSEL MARKER ---
        VESSEL_SIZE: 14,

        // --- IMAGE SETTINGS ---
        IMG_WIDTH: 180,

        // --- DOTTED LINE SETTINGS ---
        DASH_ARRAY: [8, 6],
    };

    // ============================================================================
    // MARKER LOCATIONS
    // ============================================================================

    // MARKER 1: First Light Detection (Near Suez - during solid line)
    const LIGHT_DET_SUEZ = {
        COORDS: [34.9224, 26.3817],           // [lng, lat] - Near Suez
        IMAGE: 'images/chapter6/chapter6A.png',
        IMG_OFFSET: [-120, 150],
    };

    // MARKER 2: Dark Detection (while running dark in Red Sea)
    const DARK_DET = {
        COORDS: [40.1585, 17.4346],           // [lng, lat] - Red Sea
        IMAGE: 'images/chapter6/chapter6B.png',
        IMG_OFFSET: [-120, 150],
    };

    // MARKER 3, 4, 5: THREE Light Detections at Berbera (NO sat images - markers only)
    const BERBERA_MARKERS = {
        COORDS_1: [44.61, 10.946667],         // First marker
        COORDS_2: [44.64, 10.905],            // Second marker
        COORDS_3: [44.68, 10.92],             // Third marker (different heading)
    };

    // MARKER 6: OIL SPILL - THE HIGHLIGHT (with 2 vertical sat images)
    const OIL_SPILL = {
        COORDS: [42.2636, 14.4226],           // Primary oil spill location
        COORDS_2: [42.4882, 14.4580],         // Secondary detection
        IMAGE_1: 'images/chapter6/chapter6C.png',  // Oil slick image 1
        IMAGE_2: 'images/chapter6/chapter6D.png',  // Oil slick image 2
        IMG_OFFSET: [100, -20],
    };

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    const SOURCE_SOLID = 'ch6-solid-src';
    const SOURCE_DOTTED = 'ch6-dotted-src';
    const LAYER_SOLID = 'ch6-solid-line';
    const LAYER_SOLID_GLOW = 'ch6-solid-glow';
    const LAYER_DOTTED = 'ch6-dotted-line';
    const LAYER_DOTTED_GLOW = 'ch6-dotted-glow';

    let solidCoords = null;
    let dottedCoords = null;
    let animId = null;
    let progress = 0;
    let startT = null;
    let running = false;
    let phase = 'solid'; // 'solid', 'pause', 'dotted'

    // Markers
    let vesselMkr = null;
    let lightDetSuezMkr = null;
    let lightDetSuezPopup = null;
    let lightDetSuezMkr_pending = false;
    let darkDetMkr = null;
    let darkDetPopup = null;
    let darkDetMkr_pending = false;
    let berberaMkr1 = null;
    let berberaMkr2 = null;
    let berberaMkr3 = null;
    let berberaMkrs_pending = false;
    let oilSpillMkr = null;
    let oilSpillPopup = null;
    let oilSpillMkr_pending = false;

    // Phase tracking
    let solidComplete = false;
    let pauseStartTime = null;
    let dottedProgress = 0;

    // ============================================================================
    // INJECT STYLES
    // ============================================================================

    if (!document.getElementById('ch6-css')) {
        const css = document.createElement('style');
        css.id = 'ch6-css';
        css.textContent = `
            /* === PULSING GLOW ANIMATIONS === */
            @keyframes ch6-glow-blue {
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
            @keyframes ch6-glow-orange {
                0%, 100% {
                    filter: drop-shadow(0 0 8px rgba(255, 165, 0, 0.7))
                            drop-shadow(0 0 14px rgba(255, 165, 0, 0.4));
                }
                50% {
                    filter: drop-shadow(0 0 12px rgba(255, 165, 0, 0.9))
                            drop-shadow(0 0 20px rgba(255, 165, 0, 0.6));
                }
            }
            /* White + Orange glow for OIL SPILL highlight */
            @keyframes ch6-glow-oil-spill {
                0%, 100% {
                    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))
                            drop-shadow(0 0 14px rgba(255, 200, 100, 0.7))
                            drop-shadow(0 0 22px rgba(255, 100, 50, 0.5));
                }
                50% {
                    filter: drop-shadow(0 0 12px rgba(255, 255, 255, 1))
                            drop-shadow(0 0 20px rgba(255, 200, 100, 0.9))
                            drop-shadow(0 0 30px rgba(255, 100, 50, 0.7));
                }
            }

            /* === VESSEL MARKER === */
            .ch6-vessel {
                width: ${CONFIG.VESSEL_SIZE}px;
                height: ${CONFIG.VESSEL_SIZE}px;
                background: ${CONFIG.LINE_COLOR};
                border-radius: 50%;
                box-shadow: 0 0 15px ${CONFIG.LINE_COLOR}, 0 0 30px ${CONFIG.LINE_COLOR}40;
                transition: background 0.5s ease, box-shadow 0.5s ease;
            }
            /* Vessel turns red when going dark */
            .ch6-vessel.dark-mode {
                background: ${CONFIG.DARK_LINE_COLOR};
                box-shadow: 0 0 15px ${CONFIG.DARK_LINE_COLOR}, 0 0 30px ${CONFIG.DARK_LINE_COLOR}40;
            }

            /* === LIGHT DETECTION MARKER (Blue Glow - Pulsing) === */
            .ch6-light-marker {
                cursor: pointer;
                transition: transform 0.3s ease;
            }
            .ch6-light-marker:hover {
                transform: scale(1.15);
            }
            .ch6-light-marker img {
                width: ${CONFIG.LIGHT_MARKER_SIZE}px;
                height: auto;
                animation: ch6-glow-blue 2s ease-in-out infinite;
            }

            /* === DARK DETECTION MARKER (Orange Glow - Pulsing) === */
            .ch6-dark-marker {
                cursor: pointer;
                transition: transform 0.3s ease;
            }
            .ch6-dark-marker:hover {
                transform: scale(1.15);
            }
            .ch6-dark-marker img {
                width: ${CONFIG.DARK_MARKER_SIZE}px;
                height: auto;
                animation: ch6-glow-orange 2s ease-in-out infinite;
            }

            /* === OIL SPILL MARKER (White + Orange - HIGHLIGHT) === */
            .ch6-oil-spill-marker {
                cursor: pointer;
                transition: transform 0.3s ease;
            }
            .ch6-oil-spill-marker:hover {
                transform: scale(1.15);
            }
            .ch6-oil-spill-marker img {
                width: ${CONFIG.LIGHT_MARKER_SIZE + 4}px;
                height: auto;
                animation: ch6-glow-oil-spill 2s ease-in-out infinite;
            }

            /* === POPUP BASE === */
            .ch6-pop .mapboxgl-popup-tip { display: none !important; }
            .ch6-pop .mapboxgl-popup-content {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
            }

            /* === LIGHT DETECTION SATELLITE IMAGE (Blue Glow) === */
            .ch6-light-img-holder {
                display: inline-block;
                padding: 0 !important;
                border-radius: 10px;
                background: transparent !important;
                border: none !important;
                box-shadow:
                    0 0 25px rgba(0, 163, 227, 0.35),
                    0 0 50px rgba(0, 163, 227, 0.15);
            }
            .ch6-light-img {
                display: block;
                max-width: ${CONFIG.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
            }

            /* === DARK DETECTION SATELLITE IMAGE (Orange Glow) === */
            .ch6-dark-img-holder {
                display: inline-block;
                padding: 0 !important;
                border-radius: 10px;
                background: transparent !important;
                border: none !important;
                box-shadow:
                    0 0 25px rgba(255, 165, 0, 0.35),
                    0 0 50px rgba(255, 165, 0, 0.15);
            }
            .ch6-dark-img {
                display: block;
                max-width: ${CONFIG.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
            }

            /* === OIL SPILL IMAGES - VERTICAL STACK WITH WHITE TINT === */
            .ch6-oil-spill-gallery {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .ch6-oil-spill-img-holder {
                display: inline-block;
                padding: 0 !important;
                border-radius: 10px;
                background: transparent !important;
                border: none !important;
                box-shadow:
                    0 0 15px rgba(255, 255, 255, 0.5),
                    0 0 30px rgba(255, 200, 100, 0.4),
                    0 0 50px rgba(255, 100, 50, 0.25);
                animation: ch6-oil-img-glow 2.5s ease-in-out infinite;
            }
            @keyframes ch6-oil-img-glow {
                0%, 100% {
                    box-shadow:
                        0 0 15px rgba(255, 255, 255, 0.5),
                        0 0 30px rgba(255, 200, 100, 0.4),
                        0 0 50px rgba(255, 100, 50, 0.25);
                }
                50% {
                    box-shadow:
                        0 0 22px rgba(255, 255, 255, 0.7),
                        0 0 42px rgba(255, 200, 100, 0.55),
                        0 0 65px rgba(255, 100, 50, 0.4);
                }
            }
            .ch6-oil-spill-img {
                display: block;
                max-width: ${CONFIG.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
            }

            /* === AIS LOST INDICATOR === */
            .ch6-ais-lost-indicator {
                position: absolute;
                top: -30px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 100, 100, 0.9);
                color: white;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: bold;
                letter-spacing: 0.5px;
                white-space: nowrap;
                animation: ch6-blink 1s ease-in-out infinite;
            }
            @keyframes ch6-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            /* === RESPONSIVE === */
            @media (max-width: 768px) {
                .ch6-light-marker img, .ch6-dark-marker img, .ch6-oil-spill-marker img {
                    width: ${Math.round(CONFIG.LIGHT_MARKER_SIZE * 0.8)}px;
                }
                .ch6-light-img, .ch6-dark-img, .ch6-oil-spill-img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.7)}px;
                }
            }
            @media (max-width: 480px) {
                .ch6-light-marker img, .ch6-dark-marker img, .ch6-oil-spill-marker img {
                    width: ${Math.round(CONFIG.LIGHT_MARKER_SIZE * 0.7)}px;
                }
                .ch6-light-img, .ch6-dark-img, .ch6-oil-spill-img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.55)}px;
                }
                .ch6-oil-spill-gallery {
                    gap: 6px;
                }
            }
        `;
        document.head.appendChild(css);
    }

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    function clearLayers() {
        try { if (map.getLayer(LAYER_SOLID_GLOW)) map.removeLayer(LAYER_SOLID_GLOW); } catch(e) {}
        try { if (map.getLayer(LAYER_SOLID)) map.removeLayer(LAYER_SOLID); } catch(e) {}
        try { if (map.getLayer(LAYER_DOTTED_GLOW)) map.removeLayer(LAYER_DOTTED_GLOW); } catch(e) {}
        try { if (map.getLayer(LAYER_DOTTED)) map.removeLayer(LAYER_DOTTED); } catch(e) {}
        try { if (map.getSource(SOURCE_SOLID)) map.removeSource(SOURCE_SOLID); } catch(e) {}
        try { if (map.getSource(SOURCE_DOTTED)) map.removeSource(SOURCE_DOTTED); } catch(e) {}
    }

    function clearMarkers() {
        try { if (vesselMkr) vesselMkr.remove(); vesselMkr = null; } catch(e) { vesselMkr = null; }
        try { if (lightDetSuezMkr) lightDetSuezMkr.remove(); lightDetSuezMkr = null; } catch(e) { lightDetSuezMkr = null; }
        try { if (lightDetSuezPopup) lightDetSuezPopup.remove(); lightDetSuezPopup = null; } catch(e) { lightDetSuezPopup = null; }
        try { if (darkDetMkr) darkDetMkr.remove(); darkDetMkr = null; } catch(e) { darkDetMkr = null; }
        try { if (darkDetPopup) darkDetPopup.remove(); darkDetPopup = null; } catch(e) { darkDetPopup = null; }
        try { if (berberaMkr1) berberaMkr1.remove(); berberaMkr1 = null; } catch(e) { berberaMkr1 = null; }
        try { if (berberaMkr2) berberaMkr2.remove(); berberaMkr2 = null; } catch(e) { berberaMkr2 = null; }
        try { if (berberaMkr3) berberaMkr3.remove(); berberaMkr3 = null; } catch(e) { berberaMkr3 = null; }
        try { if (oilSpillMkr) oilSpillMkr.remove(); oilSpillMkr = null; } catch(e) { oilSpillMkr = null; }
        try { if (oilSpillPopup) oilSpillPopup.remove(); oilSpillPopup = null; } catch(e) { oilSpillPopup = null; }
    }

    function clearDetectionsAndPopups() {
        clearMarkers();
        // DOM fallback
        document.querySelectorAll('.ch6-light-marker, .ch6-dark-marker, .ch6-oil-spill-marker, .ch6-vessel').forEach(el => {
            try {
                const wrapper = el.closest('.mapboxgl-marker');
                if (wrapper) wrapper.remove(); else el.remove();
            } catch(e) {}
        });
        document.querySelectorAll('.ch6-pop, .ch6-light-img-holder, .ch6-dark-img-holder, .ch6-oil-spill-gallery').forEach(el => {
            try {
                const popup = el.closest('.mapboxgl-popup');
                if (popup) popup.remove(); else el.remove();
            } catch(e) {}
        });
    }

    function stopAnim() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        running = false;
    }

    function clearAll() {
        stopAnim();
        clearDetectionsAndPopups();
        clearLayers();
        progress = 0;
        dottedProgress = 0;
        phase = 'solid';
        solidComplete = false;
        pauseStartTime = null;
        // Reset pending flags
        lightDetSuezMkr_pending = false;
        darkDetMkr_pending = false;
        berberaMkrs_pending = false;
        oilSpillMkr_pending = false;
    }

    function createLightMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch6-light-marker';
        el.innerHTML = `<img src="${svgFile}" alt="Light detection">`;
        return el;
    }

    function createDarkMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch6-dark-marker';
        el.innerHTML = `<img src="${svgFile}" alt="Dark detection">`;
        return el;
    }

    function createOilSpillMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch6-oil-spill-marker';
        el.innerHTML = `<img src="${svgFile}" alt="Oil spill detection">`;
        return el;
    }

    // ============================================================================
    // LOAD DATA
    // ============================================================================

    async function loadData() {
        if (solidCoords && dottedCoords) return true;
        try {
            const res = await fetch(chapterConfig?.dataFile || 'data/chapter6-eternity.geojson');
            const data = await res.json();

            // Look for two features: solid and dotted tracks
            if (data.features && data.features.length >= 2) {
                // Assume first feature is solid, second is dotted
                solidCoords = data.features[0]?.geometry?.coordinates || [];
                dottedCoords = data.features[1]?.geometry?.coordinates || [];
            } else if (data.type === 'Feature' && data.geometry?.coordinates) {
                // Single track - split it (fallback)
                const coords = data.geometry.coordinates;
                const splitIdx = Math.floor(coords.length * 0.6);
                solidCoords = coords.slice(0, splitIdx);
                dottedCoords = coords.slice(splitIdx - 1); // Overlap by 1 for continuity
            } else if (data.features?.[0]?.geometry?.coordinates) {
                const coords = data.features[0].geometry.coordinates;
                const splitIdx = Math.floor(coords.length * 0.6);
                solidCoords = coords.slice(0, splitIdx);
                dottedCoords = coords.slice(splitIdx - 1);
            }

            if (solidCoords?.length && dottedCoords?.length) {
                console.log(`  ✓ Loaded: Solid ${solidCoords.length} pts, Dotted ${dottedCoords.length} pts`);
                return true;
            }
        } catch(e) { console.error('Load error:', e); }
        return false;
    }

    // ============================================================================
    // SHOW MAIN
    // ============================================================================

    async function showMain() {
        console.log('  → showMain (ETERNITY C - Houthi Attack)');
        stopAnim();
        clearDetectionsAndPopups();
        clearAll();

        await loadData();
        if (!solidCoords?.length) {
            console.error('No coordinates loaded');
            return;
        }

        // Setup SOLID track source
        map.addSource(SOURCE_SOLID, {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [solidCoords[0]] } }
        });

        map.addLayer({
            id: LAYER_SOLID_GLOW, type: 'line', source: SOURCE_SOLID,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': CONFIG.GLOW_COLOR, 'line-width': 10, 'line-opacity': 0.4, 'line-blur': 5 }
        });

        map.addLayer({
            id: LAYER_SOLID, type: 'line', source: SOURCE_SOLID,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': CONFIG.LINE_COLOR, 'line-width': 3, 'line-opacity': 0.95 }
        });

        // Setup DOTTED track source (empty initially)
        map.addSource(SOURCE_DOTTED, {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
        });

        map.addLayer({
            id: LAYER_DOTTED_GLOW, type: 'line', source: SOURCE_DOTTED,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': CONFIG.DARK_GLOW_COLOR, 'line-width': 8, 'line-opacity': 0.3, 'line-blur': 4 }
        });

        map.addLayer({
            id: LAYER_DOTTED, type: 'line', source: SOURCE_DOTTED,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 
                'line-color': CONFIG.DARK_LINE_COLOR, 
                'line-width': 3, 
                'line-opacity': 0.9, 
                'line-dasharray': CONFIG.DASH_ARRAY 
            }
        });

        // Vessel marker
        const vel = document.createElement('div');
        vel.className = 'ch6-vessel';
        vesselMkr = new mapboxgl.Marker({ element: vel, anchor: 'center' })
            .setLngLat(solidCoords[0]).addTo(map);

        // Start animation
        phase = 'solid';
        progress = 0;
        dottedProgress = 0;
        solidComplete = false;
        running = true;
        startT = performance.now();
        animateMain();
    }

    function animateMain() {
        if (!running) return;

        const now = performance.now();

        // === PHASE 1: SOLID LINE (AIS Active) ===
        if (phase === 'solid') {
            const elapsed = now - startT;
            const pct = Math.min(elapsed / CONFIG.SOLID_DURATION, 1);
            const idx = Math.floor(pct * (solidCoords.length - 1));

            if (idx > progress) {
                progress = idx;
                const src = map.getSource(SOURCE_SOLID);
                if (src) {
                    src.setData({
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: solidCoords.slice(0, progress + 1) }
                    });
                }
                if (vesselMkr) vesselMkr.setLngLat(solidCoords[progress]);
            }

            // === SUEZ LIGHT DETECTION (at ~30% of solid track + 1.2s delay) ===
            const solidPct = progress / (solidCoords.length - 1);
            if (solidPct >= 0.30 && !lightDetSuezMkr && !lightDetSuezMkr_pending) {
                lightDetSuezMkr_pending = true;
                setTimeout(() => {
                    if (!lightDetSuezMkr && running) {
                        const el = createLightMarker(CONFIG.SVG_LIGHT);
                        lightDetSuezMkr = new mapboxgl.Marker({ element: el, anchor: 'center' })
                            .setLngLat(LIGHT_DET_SUEZ.COORDS).addTo(map);

                        lightDetSuezPopup = new mapboxgl.Popup({
                            closeButton: false, closeOnClick: false,
                            className: 'ch6-pop', offset: LIGHT_DET_SUEZ.IMG_OFFSET
                        })
                            .setLngLat(LIGHT_DET_SUEZ.COORDS)
                            .setHTML(`<div class="ch6-light-img-holder"><img class="ch6-light-img" src="${LIGHT_DET_SUEZ.IMAGE}"></div>`)
                            .addTo(map);
                    }
                }, 1200);
            }

            if (pct >= 1) {
                // Solid complete - ensure full track drawn
                const src = map.getSource(SOURCE_SOLID);
                if (src) {
                    src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: solidCoords } });
                }
                if (vesselMkr) vesselMkr.setLngLat(solidCoords[solidCoords.length - 1]);

                solidComplete = true;
                phase = 'pause';
                pauseStartTime = now;
                console.log('  ✓ Solid track complete, pausing...');
            }

            animId = requestAnimationFrame(animateMain);
            return;
        }

        // === PHASE 2: PAUSE (Transition moment - AIS goes dark) ===
        if (phase === 'pause') {
            const pauseElapsed = now - pauseStartTime;

            // Change vessel to "dark mode" visual
            if (pauseElapsed > 300 && vesselMkr) {
                vesselMkr.getElement().classList.add('dark-mode');
            }

            if (pauseElapsed >= CONFIG.PAUSE_AFTER_SOLID) {
                phase = 'dotted';
                startT = now;
                dottedProgress = 0;
                console.log('  → Starting dotted track (AIS Dark)...');
            }

            animId = requestAnimationFrame(animateMain);
            return;
        }

        // === PHASE 3: DOTTED LINE (Running Dark - SLOW) ===
        if (phase === 'dotted') {
            const elapsed = now - startT;
            const pct = Math.min(elapsed / CONFIG.DOTTED_DURATION, 1);
            const idx = Math.floor(pct * (dottedCoords.length - 1));

            if (idx > dottedProgress) {
                dottedProgress = idx;
                const src = map.getSource(SOURCE_DOTTED);
                if (src) {
                    src.setData({
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: dottedCoords.slice(0, dottedProgress + 1) }
                    });
                }
                if (vesselMkr) vesselMkr.setLngLat(dottedCoords[dottedProgress]);
            }

            const dottedPct = dottedProgress / (dottedCoords.length - 1);

            // === DARK DETECTION (at ~40% of dotted track + 1.8s delay) ===
            if (dottedPct >= 0.40 && !darkDetMkr && !darkDetMkr_pending) {
                darkDetMkr_pending = true;
                setTimeout(() => {
                    if (!darkDetMkr && running) {
                        const el = createDarkMarker(CONFIG.SVG_DARK);
                        darkDetMkr = new mapboxgl.Marker({ element: el, anchor: 'center' })
                            .setLngLat(DARK_DET.COORDS).addTo(map);

                        darkDetPopup = new mapboxgl.Popup({
                            closeButton: false, closeOnClick: false,
                            className: 'ch6-pop', offset: DARK_DET.IMG_OFFSET
                        })
                            .setLngLat(DARK_DET.COORDS)
                            .setHTML(`<div class="ch6-dark-img-holder"><img class="ch6-dark-img" src="${DARK_DET.IMAGE}"></div>`)
                            .addTo(map);
                    }
                }, 1800);
            }

            // === THREE BERBERA MARKERS (at ~50% + 1.2s delay - NO sat images, markers only) ===
            if (dottedPct >= 0.50 && !berberaMkr1 && !berberaMkrs_pending) {
                berberaMkrs_pending = true;
                setTimeout(() => {
                    if (!berberaMkr1 && running) {
                        const el1 = createLightMarker(CONFIG.SVG_LIGHT);
                        berberaMkr1 = new mapboxgl.Marker({ element: el1, anchor: 'center' })
                            .setLngLat(BERBERA_MARKERS.COORDS_1).addTo(map);

                        const el2 = createLightMarker(CONFIG.SVG_LIGHT);
                        berberaMkr2 = new mapboxgl.Marker({ element: el2, anchor: 'center', rotation: 45 })
                            .setLngLat(BERBERA_MARKERS.COORDS_2).addTo(map);

                        const el3 = createLightMarker(CONFIG.SVG_LIGHT);
                        berberaMkr3 = new mapboxgl.Marker({ element: el3, anchor: 'center', rotation: -30 })
                            .setLngLat(BERBERA_MARKERS.COORDS_3).addTo(map);
                    }
                }, 1200);
            }

            // === OIL SPILL - THE HIGHLIGHT (at ~85% + 1.2s delay - end of journey) ===
            if (dottedPct >= 0.85 && !oilSpillMkr && !oilSpillMkr_pending) {
                oilSpillMkr_pending = true;
                setTimeout(() => {
                    if (!oilSpillMkr && running) {
                        const el = createOilSpillMarker(CONFIG.SVG_LIGHT);
                        oilSpillMkr = new mapboxgl.Marker({ element: el, anchor: 'center' })
                            .setLngLat(OIL_SPILL.COORDS).addTo(map);

                        oilSpillPopup = new mapboxgl.Popup({
                            closeButton: false, closeOnClick: false,
                            className: 'ch6-pop', offset: OIL_SPILL.IMG_OFFSET
                        })
                            .setLngLat(OIL_SPILL.COORDS)
                            .setHTML(`
                                <div class="ch6-oil-spill-gallery">
                                    <div class="ch6-oil-spill-img-holder">
                                        <img class="ch6-oil-spill-img" src="${OIL_SPILL.IMAGE_1}">
                                    </div>
                                    <div class="ch6-oil-spill-img-holder">
                                        <img class="ch6-oil-spill-img" src="${OIL_SPILL.IMAGE_2}">
                                    </div>
                                </div>
                            `)
                            .addTo(map);
                    }
                }, 1200);
            }

            if (pct >= 1) {
                // Complete
                const src = map.getSource(SOURCE_DOTTED);
                if (src) {
                    src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: dottedCoords } });
                }
                if (vesselMkr) vesselMkr.setLngLat(dottedCoords[dottedCoords.length - 1]);

                // FALLBACK: Create any markers that haven't appeared yet due to delays
                setTimeout(() => {
                    // Suez light detection
                    if (!lightDetSuezMkr) {
                        const el = createLightMarker(CONFIG.SVG_LIGHT);
                        lightDetSuezMkr = new mapboxgl.Marker({ element: el, anchor: 'center' })
                            .setLngLat(LIGHT_DET_SUEZ.COORDS).addTo(map);
                        lightDetSuezPopup = new mapboxgl.Popup({
                            closeButton: false, closeOnClick: false,
                            className: 'ch6-pop', offset: LIGHT_DET_SUEZ.IMG_OFFSET
                        })
                            .setLngLat(LIGHT_DET_SUEZ.COORDS)
                            .setHTML(`<div class="ch6-light-img-holder"><img class="ch6-light-img" src="${LIGHT_DET_SUEZ.IMAGE}"></div>`)
                            .addTo(map);
                    }
                    // Dark detection
                    if (!darkDetMkr) {
                        const el = createDarkMarker(CONFIG.SVG_DARK);
                        darkDetMkr = new mapboxgl.Marker({ element: el, anchor: 'center' })
                            .setLngLat(DARK_DET.COORDS).addTo(map);
                        darkDetPopup = new mapboxgl.Popup({
                            closeButton: false, closeOnClick: false,
                            className: 'ch6-pop', offset: DARK_DET.IMG_OFFSET
                        })
                            .setLngLat(DARK_DET.COORDS)
                            .setHTML(`<div class="ch6-dark-img-holder"><img class="ch6-dark-img" src="${DARK_DET.IMAGE}"></div>`)
                            .addTo(map);
                    }
                    // Berbera markers (no sat images)
                    if (!berberaMkr1) {
                        const el1 = createLightMarker(CONFIG.SVG_LIGHT);
                        berberaMkr1 = new mapboxgl.Marker({ element: el1, anchor: 'center' })
                            .setLngLat(BERBERA_MARKERS.COORDS_1).addTo(map);
                        const el2 = createLightMarker(CONFIG.SVG_LIGHT);
                        berberaMkr2 = new mapboxgl.Marker({ element: el2, anchor: 'center', rotation: 45 })
                            .setLngLat(BERBERA_MARKERS.COORDS_2).addTo(map);
                        const el3 = createLightMarker(CONFIG.SVG_LIGHT);
                        berberaMkr3 = new mapboxgl.Marker({ element: el3, anchor: 'center', rotation: -30 })
                            .setLngLat(BERBERA_MARKERS.COORDS_3).addTo(map);
                    }
                    // OIL SPILL - THE HIGHLIGHT (with vertical sat images)
                    if (!oilSpillMkr) {
                        const el = createOilSpillMarker(CONFIG.SVG_LIGHT);
                        oilSpillMkr = new mapboxgl.Marker({ element: el, anchor: 'center' })
                            .setLngLat(OIL_SPILL.COORDS).addTo(map);
                        oilSpillPopup = new mapboxgl.Popup({
                            closeButton: false, closeOnClick: false,
                            className: 'ch6-pop', offset: OIL_SPILL.IMG_OFFSET
                        })
                            .setLngLat(OIL_SPILL.COORDS)
                            .setHTML(`
                                <div class="ch6-oil-spill-gallery">
                                    <div class="ch6-oil-spill-img-holder">
                                        <img class="ch6-oil-spill-img" src="${OIL_SPILL.IMAGE_1}">
                                    </div>
                                    <div class="ch6-oil-spill-img-holder">
                                        <img class="ch6-oil-spill-img" src="${OIL_SPILL.IMAGE_2}">
                                    </div>
                                </div>
                            `)
                            .addTo(map);
                    }
                }, 1500); // Slightly longer than marker delays to ensure they appear

                running = false;
                console.log('  ✓ Animation complete (ETERNITY C)');
                return;
            }

            animId = requestAnimationFrame(animateMain);
        }
    }

    // ============================================================================
    // CLEANUP
    // ============================================================================

    function cleanup() {
        console.log('  🧹 Ch6 cleanup');
        clearAll();
        solidCoords = null;
        dottedCoords = null;
        // Reset pending flags
        lightDetSuezMkr_pending = false;
        darkDetMkr_pending = false;
        berberaMkrs_pending = false;
        oilSpillMkr_pending = false;
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
            if (!running && (solidCoords || dottedCoords)) {
                running = true;
                startT = performance.now();
                animateMain();
            }
        },
        getProgress: () => {
            const total = (solidCoords?.length || 0) + (dottedCoords?.length || 0);
            return total ? (progress + dottedProgress) / total : 0;
        },
        isComplete: () => phase === 'dotted' && dottedProgress >= (dottedCoords?.length || 1) - 1
    };
}

window.animateChapter6 = animateChapter6;
