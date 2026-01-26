// ============================================================================
// CHAPTER 3 ANIMATION - OCEANA ROSE: AIS Spoofing & Iran Connection
// Story: Panama-flagged bulk carrier departed Kuwait 15 Mar 2025, spoofed AIS
// from 16 Mar - 22 Apr while loading cargo at Bandar Abbas, Iran.
// After brief Fujairah stop, proceeded to Ha Long Bay, Vietnam arriving 10 May.
// ============================================================================

function animateChapter3(map, chapterConfig) {
    console.log('Chapter 3: Init - OCEANA ROSE');

    // ============================================================================
    // CUSTOMIZATION OPTIONS
    // ============================================================================

    const CONFIG = {
        // --- COLORS ---
        LINE_COLOR: '#00ff88',           // Neon green track
        GLOW_COLOR: '#00ff88',           // Track glow
        LIGHT_DET_COLOR: '#00a3e3',      // Blue for light detection
        DARK_DET_COLOR: '#FFA500',       // Yellow/Orange for dark detection
        SPOOF_COLOR: '#ff4d4d',          // Red for spoofing marker

        // --- ANIMATION ---
        MAIN_DURATION: 2500,             // Main chapter animation speed (ms)
        H1_DURATION: 3000,               // H1 scroll animation speed (ms)

        // --- SVG MARKER FILES ---
        SVG_LIGHT: 'assets/svg/lightdetection.svg',
        SVG_DARK: 'assets/svg/darkdetection.svg',
        SVG_SPOOF: 'assets/svg/spoofing.svg',

        // --- MARKER SIZES ---
        LIGHT_MARKER_SIZE: 32,           // Light detection marker size
        DARK_MARKER_SIZE: 40,            // Dark detection marker size
        SPOOF_MARKER_SIZE: 38,           // Spoofing marker size

        // --- VESSEL MARKER ---
        VESSEL_SIZE: 14,
        VESSEL_BORDER: 0,
    };

    // ============================================================================
    // MAIN SCROLL MARKERS
    // ============================================================================

    // Kuwait - Light Detection (departure point)
    const KUWAIT = {
        COORDS: [48.1552, 29.0429],      // [lng, lat]
        IMAGE: 'images/chapter3/chapter3A.png',  // Placeholder - update path later
        IMG_WIDTH: 200,
        IMG_HEIGHT: 200,
        IMG_OFFSET: [0, 250],          // [x, y] offset from marker
    };

    // Iran - Two Dark Detections (Bandar Abbas area)
    const IRAN = {
        DETECTIONS: [
            { lng: 56.3463, lat: 27.0149 },  // Detection 1 - Anchorage
            { lng: 56.0598, lat: 27.1028 },  // Detection 2 - Berth
        ],
        IMAGES: [
            'images/chapter3/chapter3B.png',  // Placeholder - update path later
            'images/chapter3/chapter3C.png',  // Placeholder - update path later
        ],
        IMG_WIDTH: 180,
        IMG_HEIGHT: 180,
        IMG_GAP: 12,
        IMG_OFFSET: [-50, -50],          // [x, y] offset from center of detections
    };

    // Sohar - Spoofing Marker (fake AIS position)
    const SOHAR = {
        COORDS: [56.3802, 25.5719],      // [lng, lat]
    };

    // ============================================================================
    // H1 SCROLL MARKERS (Transit to Vietnam)
    // ============================================================================

    const H1_MARKERS = {
        // Light detection markers along the route (coordinates on the actual track linestring)
        DETECTION_1: { lng: 76.25166666666668, lat: 7.465 },        // Indian Ocean (20% of H1)
        DETECTION_2: { lng: 100.08500000000001, lat: 3.5566666666666666 },  // Strait of Malacca (55% of H1)
        DETECTION_3: { lng: 107.14608, lat: 20.83408166666667 },    // Ha Long Bay - last point of track

        // Vietnam endpoint satellite image
        VIETNAM_IMAGE: 'images/chapter3/chapter3D.png',
        VIETNAM_IMG_WIDTH: 220,
        VIETNAM_IMG_HEIGHT: 180,
        VIETNAM_IMG_OFFSET: [-180, 60],  // [x, y] offset from marker
    };

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    const SOURCE_ID = 'ch3-src';
    const LAYER_ID = 'ch3-line';
    const GLOW_ID = 'ch3-glow';

    let coords = null;
    let total = 0;
    let animId = null;
    let progress = 0;
    let startT = null;
    let running = false;

    // Main scroll markers
    let vesselMkr = null;
    let kuwaitMkr = null;
    let kuwaitPopup = null;
    let iranMkrs = [];
    let iranPopup = null;
    let spoofMkr = null;

    // H1 scroll markers
    let h1Mkr1 = null;
    let h1Mkr2 = null;
    let h1Mkr3 = null;
    let vietnamPopup = null;
    let originMarker = null;  // Cargo origin highlight for H1 scroll

    // ============================================================================
    // INJECT STYLES
    // ============================================================================

    if (!document.getElementById('ch3-css')) {
        const css = document.createElement('style');
        css.id = 'ch3-css';
        css.textContent = `
            /* === VESSEL MARKER === */
            .ch3-vessel {
                width: ${CONFIG.VESSEL_SIZE}px;
                height: ${CONFIG.VESSEL_SIZE}px;
                background: ${CONFIG.LINE_COLOR};
                border: ${CONFIG.VESSEL_BORDER}px solid #fff;
                border-radius: 50%;
                box-shadow: 0 0 15px ${CONFIG.LINE_COLOR}, 0 0 30px ${CONFIG.LINE_COLOR}40;
            }

            /* === LIGHT DETECTION MARKER (Blue Glow + Pulse) === */
            .ch3-light-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
            }
            .ch3-light-marker:hover {
                transform: scale(1.15);
            }
            .ch3-light-marker img {
                width: ${CONFIG.LIGHT_MARKER_SIZE}px;
                height: auto;
                filter: drop-shadow(0 0 12px rgba(0, 163, 227, 0.9))
                        drop-shadow(0 0 20px rgba(0, 163, 227, 0.6))
                        drop-shadow(0 0 30px rgba(0, 163, 227, 0.4));
                animation: ch3-glow-blue 2s ease-in-out infinite;
            }

            @keyframes ch3-glow-blue {
                0%, 100% {
                    filter: drop-shadow(0 0 12px rgba(0, 163, 227, 0.9))
                            drop-shadow(0 0 20px rgba(0, 163, 227, 0.6))
                            drop-shadow(0 0 30px rgba(0, 163, 227, 0.4));
                }
                50% {
                    filter: drop-shadow(0 0 18px rgba(0, 163, 227, 1))
                            drop-shadow(0 0 30px rgba(0, 163, 227, 0.8))
                            drop-shadow(0 0 45px rgba(0, 163, 227, 0.5));
                }
            }

            /* === DARK DETECTION MARKER (Orange + White Tint Glow + Pulse) === */
            .ch3-dark-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
            }
            .ch3-dark-marker:hover {
                transform: scale(1.15);
            }
            .ch3-dark-marker img {
                width: ${CONFIG.DARK_MARKER_SIZE}px;
                height: auto;
                filter: drop-shadow(0 0 12px rgba(255, 165, 0, 0.9))
                        drop-shadow(0 0 20px rgba(255, 165, 0, 0.6))
                        drop-shadow(0 0 30px rgba(255, 165, 0, 0.4))
                        drop-shadow(0 0 40px rgba(255, 255, 255, 0.35));
                animation: ch3-glow-orange-white 2s ease-in-out infinite;
            }

            @keyframes ch3-glow-orange-white {
                0%, 100% {
                    filter: drop-shadow(0 0 12px rgba(255, 165, 0, 0.9))
                            drop-shadow(0 0 20px rgba(255, 165, 0, 0.6))
                            drop-shadow(0 0 30px rgba(255, 165, 0, 0.4))
                            drop-shadow(0 0 40px rgba(255, 255, 255, 0.35));
                }
                50% {
                    filter: drop-shadow(0 0 18px rgba(255, 165, 0, 1))
                            drop-shadow(0 0 30px rgba(255, 165, 0, 0.8))
                            drop-shadow(0 0 45px rgba(255, 165, 0, 0.5))
                            drop-shadow(0 0 55px rgba(255, 255, 255, 0.5));
                }
            }

            /* === SPOOFING MARKER (Red Glow + Pulse) === */
            .ch3-spoof-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
            }
            .ch3-spoof-marker:hover {
                transform: scale(1.15);
            }
            .ch3-spoof-marker img {
                width: ${CONFIG.SPOOF_MARKER_SIZE}px;
                height: auto;
                filter: drop-shadow(0 0 12px rgba(255, 77, 77, 0.9))
                        drop-shadow(0 0 20px rgba(255, 77, 77, 0.6))
                        drop-shadow(0 0 30px rgba(255, 77, 77, 0.4));
                animation: ch3-glow-red 2s ease-in-out infinite;
            }

            @keyframes ch3-glow-red {
                0%, 100% {
                    filter: drop-shadow(0 0 12px rgba(255, 77, 77, 0.9))
                            drop-shadow(0 0 20px rgba(255, 77, 77, 0.6))
                            drop-shadow(0 0 30px rgba(255, 77, 77, 0.4));
                }
                50% {
                    filter: drop-shadow(0 0 18px rgba(255, 77, 77, 1))
                            drop-shadow(0 0 30px rgba(255, 77, 77, 0.8))
                            drop-shadow(0 0 45px rgba(255, 77, 77, 0.5));
                }
            }

            /* === POPUP BASE === */
            .ch3-pop .mapboxgl-popup-tip { display: none !important; }
            .ch3-pop .mapboxgl-popup-content {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
                outline: none !important;
            }

            /* === KUWAIT SATELLITE IMAGE (Blue Glow) === */
            .ch3-kuwait-img-holder {
                display: inline-block;
                padding: 0 !important;
                border-radius: 10px;
                background: transparent !important;
                border: none !important;
                outline: none !important;
                box-shadow:
                    0 0 25px rgba(0, 163, 227, 0.4),
                    0 0 50px rgba(0, 163, 227, 0.2);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .ch3-kuwait-img-holder:hover {
                transform: scale(1.05);
                box-shadow:
                    0 0 35px rgba(0, 163, 227, 0.5),
                    0 0 60px rgba(0, 163, 227, 0.3);
            }
            .ch3-kuwait-img {
                display: block;
                width: ${KUWAIT.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
            }

            /* === IRAN GALLERY (Horizontal Stack - Orange + White Tint Glow) === */
            .ch3-iran-gal {
                display: flex;
                flex-direction: row;
                gap: ${IRAN.IMG_GAP}px;
            }
            /* Iran Dark Detection Images - WHITE TINT GLOW for attention */
            .ch3-iran-img-holder {
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
                animation: ch3-iran-img-glow 2.5s ease-in-out infinite;
            }
            @keyframes ch3-iran-img-glow {
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
            .ch3-iran-img-holder:hover {
                transform: scale(1.05);
                box-shadow:
                    0 0 25px rgba(255, 255, 255, 0.7),
                    0 0 45px rgba(255, 200, 100, 0.5),
                    0 0 70px rgba(255, 165, 0, 0.35);
            }
            .ch3-iran-img-holder img {
                display: block;
                width: ${IRAN.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
            }

            /* === VIETNAM SATELLITE IMAGE (Blue Glow) === */
            .ch3-vietnam-img-holder {
                display: inline-block;
                padding: 0 !important;
                border-radius: 10px;
                background: transparent !important;
                border: none !important;
                outline: none !important;
                box-shadow:
                    0 0 25px rgba(0, 163, 227, 0.4),
                    0 0 50px rgba(0, 163, 227, 0.2);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .ch3-vietnam-img-holder:hover {
                transform: scale(1.05);
                box-shadow:
                    0 0 35px rgba(0, 163, 227, 0.5),
                    0 0 60px rgba(0, 163, 227, 0.3);
            }
            .ch3-vietnam-img {
                display: block;
                width: ${H1_MARKERS.VIETNAM_IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
            }

            /* === REAL CARGO ORIGIN MARKER (H1 Scroll - Iran/Bandar Abbas) === */
            .ch3-origin-marker {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1px;
                pointer-events: none;
                z-index: 1000;
            }

            .ch3-origin-glow {
                position: relative;
                width: 40px;
                height: 40px;
            }

            /* Outer pulsing ring */
            .ch3-origin-ring-outer {
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
                animation: ch3-origin-pulse-outer 2s ease-out infinite;
            }

            /* Solid orange core dot (no white) */
            .ch3-origin-core {
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

            /* Label */
            .ch3-origin-label {
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

            @keyframes ch3-origin-pulse-outer {
                0% {
                    transform: translate(-50%, -50%) scale(0.5);
                    opacity: 0.7;
                }
                100% {
                    transform: translate(-50%, -50%) scale(2);
                    opacity: 0;
                }
            }

            /* === RESPONSIVE - TABLET === */
            @media (max-width: 1024px) {
                .ch3-light-marker img {
                    width: ${Math.round(CONFIG.LIGHT_MARKER_SIZE * 0.9)}px;
                }
                .ch3-dark-marker img {
                    width: ${Math.round(CONFIG.DARK_MARKER_SIZE * 0.9)}px;
                }
                .ch3-spoof-marker img {
                    width: ${Math.round(CONFIG.SPOOF_MARKER_SIZE * 0.9)}px;
                }
                .ch3-kuwait-img {
                    width: ${Math.round(KUWAIT.IMG_WIDTH * 0.85)}px;
                }
                .ch3-iran-img-holder img {
                    width: ${Math.round(IRAN.IMG_WIDTH * 0.85)}px;
                }
                .ch3-vietnam-img {
                    width: ${Math.round(H1_MARKERS.VIETNAM_IMG_WIDTH * 0.85)}px;
                }
            }

            /* === RESPONSIVE - MOBILE === */
            @media (max-width: 768px) {
                .ch3-light-marker img {
                    width: ${Math.round(CONFIG.LIGHT_MARKER_SIZE * 0.8)}px;
                }
                .ch3-dark-marker img {
                    width: ${Math.round(CONFIG.DARK_MARKER_SIZE * 0.8)}px;
                }
                .ch3-spoof-marker img {
                    width: ${Math.round(CONFIG.SPOOF_MARKER_SIZE * 0.8)}px;
                }
                .ch3-kuwait-img {
                    width: ${Math.round(KUWAIT.IMG_WIDTH * 0.7)}px;
                }
                .ch3-iran-gal {
                    flex-direction: column;
                    gap: 8px;
                }
                .ch3-iran-img-holder img {
                    width: ${Math.round(IRAN.IMG_WIDTH * 0.7)}px;
                }
                .ch3-vietnam-img {
                    width: ${Math.round(H1_MARKERS.VIETNAM_IMG_WIDTH * 0.7)}px;
                }
            }

            /* === RESPONSIVE - SMALL MOBILE === */
            @media (max-width: 480px) {
                .ch3-light-marker img {
                    width: ${Math.round(CONFIG.LIGHT_MARKER_SIZE * 0.7)}px;
                }
                .ch3-dark-marker img {
                    width: ${Math.round(CONFIG.DARK_MARKER_SIZE * 0.7)}px;
                }
                .ch3-spoof-marker img {
                    width: ${Math.round(CONFIG.SPOOF_MARKER_SIZE * 0.7)}px;
                }
                .ch3-kuwait-img {
                    width: ${Math.round(KUWAIT.IMG_WIDTH * 0.55)}px;
                }
                .ch3-iran-img-holder img {
                    width: ${Math.round(IRAN.IMG_WIDTH * 0.55)}px;
                }
                .ch3-vietnam-img {
                    width: ${Math.round(H1_MARKERS.VIETNAM_IMG_WIDTH * 0.55)}px;
                }
                .ch3-vessel {
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
        if (kuwaitMkr) { kuwaitMkr.remove(); kuwaitMkr = null; }
        if (kuwaitPopup) { kuwaitPopup.remove(); kuwaitPopup = null; }
        iranMkrs.forEach(m => m.remove());
        iranMkrs = [];
        if (iranPopup) { iranPopup.remove(); iranPopup = null; }
        if (spoofMkr) { spoofMkr.remove(); spoofMkr = null; }
        if (h1Mkr1) { h1Mkr1.remove(); h1Mkr1 = null; }
        if (h1Mkr2) { h1Mkr2.remove(); h1Mkr2 = null; }
        if (h1Mkr3) { h1Mkr3.remove(); h1Mkr3 = null; }
        if (vietnamPopup) { vietnamPopup.remove(); vietnamPopup = null; }
        if (originMarker) { originMarker.remove(); originMarker = null; }
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

    // Create light detection marker (blue glow, no ring)
    function createLightMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch3-light-marker';
        el.innerHTML = `<img src="${svgFile}" alt="Light detection marker">`;
        return el;
    }

    // Create dark detection marker (yellow glow, no ring)
    function createDarkMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch3-dark-marker';
        el.innerHTML = `<img src="${svgFile}" alt="Dark detection marker">`;
        return el;
    }

    // Create spoofing marker (red glow, no ring)
    function createSpoofMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch3-spoof-marker';
        el.innerHTML = `<img src="${svgFile}" alt="Spoofing marker">`;
        return el;
    }

    // ============================================================================
    // LOAD DATA
    // ============================================================================

    async function loadData() {
        if (coords) return true;
        try {
            const res = await fetch(chapterConfig?.dataFile || 'data/chapter3-oceana-rose.geojson');
            const data = await res.json();

            // Handle both LineString and Feature formats
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
    // SHOW MAIN (Main Chapter - Animate to Gulf of Oman + markers + satellite images)
    // ============================================================================

    // Track where main animation ends (for H1 to continue from)
    let mainEndIndex = 0;
    const MAIN_STOP_PCT = 0.25;  // Stop at 25% of track (Gulf of Oman region)

    async function showMain() {
        console.log('  → showMain (animate to Gulf of Oman)');
        clearAll();

        await loadData();
        if (!coords || !coords.length) {
            console.error('No coordinates loaded for main scroll');
            return;
        }

        // Calculate end index for main scroll (Gulf of Oman = ~25% of track)
        mainEndIndex = Math.floor(total * MAIN_STOP_PCT);

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
        vel.className = 'ch3-vessel';
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
        // Only animate to mainEndIndex (Gulf of Oman), not the full track
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

            // === KUWAIT - Light Detection Marker at start (10% of main) ===
            if (mainPct >= 0.1 && !kuwaitMkr) {
                const kuwaitEl = createLightMarker(CONFIG.SVG_LIGHT);
                kuwaitMkr = new mapboxgl.Marker({ element: kuwaitEl, anchor: 'center' })
                    .setLngLat(KUWAIT.COORDS)
                    .addTo(map);

                // Kuwait satellite image popup (blue glow)
                kuwaitPopup = new mapboxgl.Popup({
                    closeButton: false,
                    closeOnClick: false,
                    className: 'ch3-pop',
                    offset: KUWAIT.IMG_OFFSET
                })
                    .setLngLat(KUWAIT.COORDS)
                    .setHTML(`
                        <div class="ch3-kuwait-img-holder">
                            <img class="ch3-kuwait-img" src="${KUWAIT.IMAGE}"
                                 onerror="this.parentElement.style.display='none';">
                        </div>
                    `)
                    .addTo(map);
            }

            // === IRAN - Dark Detection Markers at ~50% of main ===
            if (mainPct >= 0.5 && iranMkrs.length === 0) {
                IRAN.DETECTIONS.forEach((det) => {
                    const iranEl = createDarkMarker(CONFIG.SVG_DARK);
                    const marker = new mapboxgl.Marker({ element: iranEl, anchor: 'center' })
                        .setLngLat([det.lng, det.lat])
                        .addTo(map);
                    iranMkrs.push(marker);
                });

                // Iran satellite images popup (horizontal stack, yellow glow)
                const centerLng = IRAN.DETECTIONS.reduce((s, d) => s + d.lng, 0) / IRAN.DETECTIONS.length;
                const centerLat = IRAN.DETECTIONS.reduce((s, d) => s + d.lat, 0) / IRAN.DETECTIONS.length;

                const iranImgs = IRAN.IMAGES.map(src =>
                    `<div class="ch3-iran-img-holder">
                        <img src="${src}" onerror="this.parentElement.style.display='none';">
                    </div>`
                ).join('');

                iranPopup = new mapboxgl.Popup({
                    closeButton: false,
                    closeOnClick: false,
                    className: 'ch3-pop',
                    offset: IRAN.IMG_OFFSET
                })
                    .setLngLat([centerLng, centerLat])
                    .setHTML(`<div class="ch3-iran-gal">${iranImgs}</div>`)
                    .addTo(map);
            }

            // === SOHAR - Spoofing Marker at ~75% of main ===
            if (mainPct >= 0.75 && !spoofMkr) {
                const spoofEl = createSpoofMarker(CONFIG.SVG_SPOOF);
                spoofMkr = new mapboxgl.Marker({ element: spoofEl, anchor: 'center' })
                    .setLngLat(SOHAR.COORDS)
                    .addTo(map);
            }
        }

        if (pct < 1) {
            animId = requestAnimationFrame(animateMain);
        } else {
            // Complete main animation - ensure all markers are placed
            const src = map.getSource(SOURCE_ID);
            if (src) {
                src.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: coords.slice(0, mainEndIndex + 1) }
                });
            }
            if (vesselMkr) vesselMkr.setLngLat(coords[mainEndIndex]);

            // Ensure Kuwait marker exists
            if (!kuwaitMkr) {
                const kuwaitEl = createLightMarker(CONFIG.SVG_LIGHT);
                kuwaitMkr = new mapboxgl.Marker({ element: kuwaitEl, anchor: 'center' })
                    .setLngLat(KUWAIT.COORDS)
                    .addTo(map);

                kuwaitPopup = new mapboxgl.Popup({
                    closeButton: false,
                    closeOnClick: false,
                    className: 'ch3-pop',
                    offset: KUWAIT.IMG_OFFSET
                })
                    .setLngLat(KUWAIT.COORDS)
                    .setHTML(`
                        <div class="ch3-kuwait-img-holder">
                            <img class="ch3-kuwait-img" src="${KUWAIT.IMAGE}"
                                 onerror="this.parentElement.style.display='none';">
                        </div>
                    `)
                    .addTo(map);
            }

            // Ensure Iran markers exist
            if (iranMkrs.length === 0) {
                IRAN.DETECTIONS.forEach((det) => {
                    const iranEl = createDarkMarker(CONFIG.SVG_DARK);
                    const marker = new mapboxgl.Marker({ element: iranEl, anchor: 'center' })
                        .setLngLat([det.lng, det.lat])
                        .addTo(map);
                    iranMkrs.push(marker);
                });

                const centerLng = IRAN.DETECTIONS.reduce((s, d) => s + d.lng, 0) / IRAN.DETECTIONS.length;
                const centerLat = IRAN.DETECTIONS.reduce((s, d) => s + d.lat, 0) / IRAN.DETECTIONS.length;

                const iranImgs = IRAN.IMAGES.map(src =>
                    `<div class="ch3-iran-img-holder">
                        <img src="${src}" onerror="this.parentElement.style.display='none';">
                    </div>`
                ).join('');

                iranPopup = new mapboxgl.Popup({
                    closeButton: false,
                    closeOnClick: false,
                    className: 'ch3-pop',
                    offset: IRAN.IMG_OFFSET
                })
                    .setLngLat([centerLng, centerLat])
                    .setHTML(`<div class="ch3-iran-gal">${iranImgs}</div>`)
                    .addTo(map);
            }

            // Ensure Spoofing marker exists
            if (!spoofMkr) {
                const spoofEl = createSpoofMarker(CONFIG.SVG_SPOOF);
                spoofMkr = new mapboxgl.Marker({ element: spoofEl, anchor: 'center' })
                    .setLngLat(SOHAR.COORDS)
                    .addTo(map);
            }

            running = false;
            console.log('  ✓ Main animation complete (Gulf of Oman)');
        }
    }

    // ============================================================================
    // SHOW H1 (H1 Scroll - Continue animation from Gulf of Oman to Vietnam)
    // ============================================================================

    async function showH1() {
        console.log('  → showH1 (Continue to Vietnam)');
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
        vel.className = 'ch3-vessel';
        vesselMkr = new mapboxgl.Marker({ element: vel, anchor: 'center' })
            .setLngLat(coords[mainEndIndex]).addTo(map);

        // === REAL CARGO ORIGIN MARKER (Iran/Bandar Abbas) ===
        // Shows where the vessel actually loaded cargo while spoofing
        // Position slightly below center of dark detection coordinates
        const originLng = (IRAN.DETECTIONS[0].lng + IRAN.DETECTIONS[1].lng) / 2;  // 56.203
        const originLat = ((IRAN.DETECTIONS[0].lat + IRAN.DETECTIONS[1].lat) / 2) - 0.72;  // ~26.34 (tiny bit more south)

        const originEl = document.createElement('div');
        originEl.className = 'ch3-origin-marker';
        originEl.innerHTML = `
            <div class="ch3-origin-label">REAL CARGO ORIGIN</div>
            <div class="ch3-origin-glow">
                <div class="ch3-origin-ring-outer"></div>
                <div class="ch3-origin-core"></div>
            </div>
        `;
        originMarker = new mapboxgl.Marker({ element: originEl, anchor: 'bottom' })
            .setLngLat([originLng, originLat])
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

            // Calculate progress within H1 portion (mainEndIndex to end)
            const h1Pct = (progress - mainEndIndex) / remainingPoints;

            // Detection 1 - Around 20% of H1 track (Indian Ocean)
            if (h1Pct >= 0.2 && !h1Mkr1) {
                const el1 = createLightMarker(CONFIG.SVG_LIGHT);
                h1Mkr1 = new mapboxgl.Marker({ element: el1, anchor: 'center' })
                    .setLngLat([H1_MARKERS.DETECTION_1.lng, H1_MARKERS.DETECTION_1.lat])
                    .addTo(map);
            }

            // Detection 2 - Around 55% of H1 track (Near Singapore)
            if (h1Pct >= 0.55 && !h1Mkr2) {
                const el2 = createLightMarker(CONFIG.SVG_LIGHT);
                h1Mkr2 = new mapboxgl.Marker({ element: el2, anchor: 'center' })
                    .setLngLat([H1_MARKERS.DETECTION_2.lng, H1_MARKERS.DETECTION_2.lat])
                    .addTo(map);
            }

            // Detection 3 - Around 90% of H1 track (Ha Long Bay) + satellite image
            if (h1Pct >= 0.9 && !h1Mkr3) {
                const el3 = createLightMarker(CONFIG.SVG_LIGHT);
                h1Mkr3 = new mapboxgl.Marker({ element: el3, anchor: 'center' })
                    .setLngLat([H1_MARKERS.DETECTION_3.lng, H1_MARKERS.DETECTION_3.lat])
                    .addTo(map);

                // Vietnam satellite image popup (blue glow) - appears with marker 3
                vietnamPopup = new mapboxgl.Popup({
                    closeButton: false,
                    closeOnClick: false,
                    className: 'ch3-pop',
                    offset: H1_MARKERS.VIETNAM_IMG_OFFSET
                })
                    .setLngLat([H1_MARKERS.DETECTION_3.lng, H1_MARKERS.DETECTION_3.lat])
                    .setHTML(`
                        <div class="ch3-vietnam-img-holder">
                            <img class="ch3-vietnam-img" src="${H1_MARKERS.VIETNAM_IMAGE}">
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

            // Ensure all markers are placed at their exact coordinates
            if (!h1Mkr1) {
                const el1 = createLightMarker(CONFIG.SVG_LIGHT);
                h1Mkr1 = new mapboxgl.Marker({ element: el1, anchor: 'center' })
                    .setLngLat([H1_MARKERS.DETECTION_1.lng, H1_MARKERS.DETECTION_1.lat])
                    .addTo(map);
            }
            if (!h1Mkr2) {
                const el2 = createLightMarker(CONFIG.SVG_LIGHT);
                h1Mkr2 = new mapboxgl.Marker({ element: el2, anchor: 'center' })
                    .setLngLat([H1_MARKERS.DETECTION_2.lng, H1_MARKERS.DETECTION_2.lat])
                    .addTo(map);
            }
            if (!h1Mkr3) {
                const el3 = createLightMarker(CONFIG.SVG_LIGHT);
                h1Mkr3 = new mapboxgl.Marker({ element: el3, anchor: 'center' })
                    .setLngLat([H1_MARKERS.DETECTION_3.lng, H1_MARKERS.DETECTION_3.lat])
                    .addTo(map);

                // Vietnam satellite image popup (fallback if not created during animation)
                if (!vietnamPopup) {
                    vietnamPopup = new mapboxgl.Popup({
                        closeButton: false,
                        closeOnClick: false,
                        className: 'ch3-pop',
                        offset: H1_MARKERS.VIETNAM_IMG_OFFSET
                    })
                        .setLngLat([H1_MARKERS.DETECTION_3.lng, H1_MARKERS.DETECTION_3.lat])
                        .setHTML(`
                            <div class="ch3-vietnam-img-holder">
                                <img class="ch3-vietnam-img" src="${H1_MARKERS.VIETNAM_IMAGE}">
                            </div>
                        `)
                        .addTo(map);
                }
            }

            running = false;
            console.log('  ✓ H1 animation complete (Vietnam)');
        }
    }

    // ============================================================================
    // CLEANUP
    // ============================================================================

    function cleanup() {
        console.log('  🧹 Ch3 cleanup');
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

window.animateChapter3 = animateChapter3;
