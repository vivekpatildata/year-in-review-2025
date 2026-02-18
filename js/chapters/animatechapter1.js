// ============================================================================
// CHAPTER 1 ANIMATION - TASCA: STS Transfer & Deck Repainting
// Premium UX with SVG markers, gradient rings, and polished visuals
// ============================================================================

function animateChapter1(map, chapterConfig) {
    console.log('Chapter 1: Init - TASCA');

    // ============================================================================
    // CUSTOMIZATION OPTIONS
    // ============================================================================

    const CONFIG = {
        // --- COLORS ---
        LINE_COLOR: '#00ff88',           // Neon green track
        GLOW_COLOR: '#00ff88',           // Track glow
        STS_COLOR: '#00a3e3',            // Blue for STS/Light detection
        DARK_DET_COLOR: '#FFA500',       // Orange for dark detection (matches SVG)

        // --- ANIMATION ---
        ANIMATION_DURATION: 3000,        // Track animation speed (ms)

        // --- SVG MARKER FILES (from main directory) ---
        SVG_LIGHT: 'assets/svg/lightstsdectection.svg',
        SVG_DARK: 'assets/svg/darkdetection.svg',
        MARKER_SIZE: 32,                 // SVG marker width in pixels (reduced from 40)
        DARK_MARKER_SIZE: 40,            // Dark detection marker size

        // --- STS MARKER (Main Chapter - Blue) ---
        STS_COORDS: [102.0161, 2.3028],  // STS location
        STS_IMAGE: 'images/chapter1/chapter1A.png',
        STS_IMG_OFFSET: [-150, 150],     // Position offset [x, y]

        // --- DARK DETECTION MARKERS (Part 2 - Yellow/Orange) ---
        // 4 satellite detection points
        DARK_DET_1: [104.7135, 2.0003],  // First detection
        DARK_DET_2: [104.7110, 2.0013],  // Second detection
        DARK_DET_3: [104.6815, 1.9293],  // Third detection
        DARK_DET_4: [104.6679, 1.8887],  // Fourth detection

        // --- GALLERY IMAGES (Part 2) ---
        GALLERY_IMAGES: [
            'images/chapter1/chapter1B.png',
            'images/chapter1/chapter1C.png',
            'images/chapter1/chapter1D.png',
            'images/chapter1/chapter1E.png'
        ],
        GAL_OFFSET: [-150, -30],           // Gallery position offset [x, y]

        // --- VESSEL MARKER ---
        VESSEL_SIZE: 14,
        VESSEL_BORDER: 0,
    };

    // ============================================================================
    // STATE
    // ============================================================================

    const SOURCE_ID = 'ch1-src';
    const LAYER_ID = 'ch1-line';
    const GLOW_ID = 'ch1-glow';

    let coords = null;
    let total = 0;
    let animId = null;
    let progress = 0;
    let startT = null;
    let running = false;

    let vesselMkr = null;
    let stsMkr = null;
    let stsPopup = null;
    let darkMkrs = [];
    let galPopup = null;
    let aisOffPopup = null;

    // ============================================================================
    // INJECT STYLES
    // ============================================================================

    if (!document.getElementById('ch1-css')) {
        const css = document.createElement('style');
        css.id = 'ch1-css';
        css.textContent = `
            /* === VESSEL MARKER === */
            .ch1-vessel {
                width: ${CONFIG.VESSEL_SIZE}px;
                height: ${CONFIG.VESSEL_SIZE}px;
                background: ${CONFIG.LINE_COLOR};
                border: ${CONFIG.VESSEL_BORDER}px solid #fff;
                border-radius: 50%;
                box-shadow: 0 0 15px ${CONFIG.LINE_COLOR}, 0 0 30px ${CONFIG.LINE_COLOR}40;
            }

            /* === SVG MARKER (Light Detection - Blue) === */
            .ch1-svg-marker {
                cursor: pointer;
                transition: transform 0.3s ease;
            }
            .ch1-svg-marker:hover {
                transform: scale(1.15);
            }
            .ch1-svg-marker img {
                width: ${CONFIG.MARKER_SIZE}px;
                height: auto;
                filter: drop-shadow(0 0 8px rgba(0, 163, 227, 0.9))
                        drop-shadow(0 0 16px rgba(0, 163, 227, 0.6));
                animation: ch1-glow-blue 2s ease-in-out infinite;
            }

            @keyframes ch1-glow-blue {
                0%, 100% {
                    filter: drop-shadow(0 0 8px rgba(0, 163, 227, 0.9))
                            drop-shadow(0 0 16px rgba(0, 163, 227, 0.6));
                }
                50% {
                    filter: drop-shadow(0 0 12px rgba(0, 163, 227, 1))
                            drop-shadow(0 0 25px rgba(0, 163, 227, 0.8))
                            drop-shadow(0 0 40px rgba(0, 163, 227, 0.4));
                }
            }

            /* === SVG MARKER (Dark Detection - Orange) === */
            .ch1-svg-marker-dark {
                cursor: pointer;
                transition: transform 0.3s ease;
            }
            .ch1-svg-marker-dark:hover {
                transform: scale(1.15);
            }
            .ch1-svg-marker-dark img {
                width: ${CONFIG.DARK_MARKER_SIZE}px;
                height: auto;
                filter: drop-shadow(0 0 8px rgba(255, 165, 0, 0.9))
                        drop-shadow(0 0 16px rgba(255, 165, 0, 0.6));
                animation: ch1-glow-orange 2s ease-in-out infinite;
            }

            @keyframes ch1-glow-orange {
                0%, 100% {
                    filter: drop-shadow(0 0 8px rgba(255, 165, 0, 0.9))
                            drop-shadow(0 0 16px rgba(255, 165, 0, 0.6));
                }
                50% {
                    filter: drop-shadow(0 0 12px rgba(255, 165, 0, 1))
                            drop-shadow(0 0 25px rgba(255, 165, 0, 0.8))
                            drop-shadow(0 0 40px rgba(255, 165, 0, 0.4));
                }
            }

            /* === AIS OFF ANNOTATION (glassmorphic popup at last AIS point) === */
            .ch1-ais-off-popup .mapboxgl-popup-tip { display: none !important; }
            .ch1-ais-off-popup .mapboxgl-popup-content {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
            }
            .ch1-ais-off-content {
                background: linear-gradient(
                    145deg,
                    rgba(14, 20, 32, 0.38) 0%,
                    rgba(8, 12, 22, 0.45) 100%
                );
                backdrop-filter: blur(36px) saturate(190%);
                -webkit-backdrop-filter: blur(36px) saturate(190%);
                border-radius: 10px;
                padding: 12px 16px;
                font-family: 'Inter', sans-serif;
                min-width: 200px;
                max-width: 260px;
                line-height: 1.5;
                border: 1px solid rgba(255, 59, 48, 0.25);
                box-shadow:
                    0 8px 32px rgba(0, 0, 0, 0.35),
                    0 2px 8px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.06),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.15),
                    0 0 25px rgba(255, 59, 48, 0.05);
            }
            .ch1-ais-off-row {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .ch1-ais-off-icon {
                flex-shrink: 0;
                width: 32px;
                height: 32px;
                background: rgba(255, 59, 48, 0.12);
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .ch1-ais-off-icon svg {
                width: 16px;
                height: 16px;
                color: #ff3b30;
            }
            .ch1-ais-off-title {
                font-size: 11px;
                font-weight: 600;
                color: rgba(255, 255, 255, 0.5);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 3px;
            }
            .ch1-ais-off-text {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.9);
                line-height: 1.5;
                font-weight: 400;
            }
            .ch1-ais-off-text .highlight-red {
                color: #ff3b30;
                font-weight: 600;
            }

            @media (max-width: 768px) {
                .ch1-ais-off-content {
                    min-width: 170px;
                    max-width: 220px;
                    padding: 10px 12px;
                    backdrop-filter: blur(28px) saturate(170%);
                    -webkit-backdrop-filter: blur(28px) saturate(170%);
                }
                .ch1-ais-off-icon { width: 26px; height: 26px; }
                .ch1-ais-off-icon svg { width: 13px; height: 13px; }
                .ch1-ais-off-title { font-size: 9px; }
                .ch1-ais-off-text { font-size: 11px; }
            }

            @media (max-width: 480px) {
                .ch1-ais-off-content {
                    min-width: 150px;
                    max-width: 190px;
                    padding: 8px 10px;
                    border-radius: 8px;
                }
                .ch1-ais-off-icon { width: 24px; height: 24px; border-radius: 5px; }
                .ch1-ais-off-icon svg { width: 12px; height: 12px; }
                .ch1-ais-off-title { font-size: 8px; }
                .ch1-ais-off-text { font-size: 10px; }
            }

            /* === POPUP BASE === */
            .ch1-pop .mapboxgl-popup-tip { display: none !important; }
            .ch1-pop .mapboxgl-popup-content {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
                outline: none !important;
            }

            /* === STS IMAGE HOLDER (Blue glow only - no border/outline) === */
            .ch1-sts-img-holder {
                display: inline-block;
                padding: 0 !important;
                border-radius: 10px;
                background: transparent !important;
                border: none !important;
                border-width: 0 !important;
                outline: none !important;
                box-shadow:
                    0 0 25px rgba(0, 163, 227, 0.35),
                    0 0 50px rgba(0, 163, 227, 0.15);
            }
            .ch1-sts-img {
                display: block;
                max-width: 240px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                border-width: 0 !important;
                outline: none !important;
                box-shadow: none !important;
            }

            /* === GALLERY CONTAINER (4 separate holders in a row) === */
            .ch1-gal {
                display: flex;
                gap: 12px;
            }

            /* === INDIVIDUAL GALLERY IMAGE HOLDER (Yellow glow only - no border/outline) === */
            .ch1-gal-img-holder {
                display: inline-block;
                padding: 0 !important;
                border-radius: 10px;
                background: transparent !important;
                border: none !important;
                border-width: 0 !important;
                outline: none !important;
                box-shadow:
                    0 0 25px rgba(255, 165, 0, 0.35),
                    0 0 50px rgba(255, 165, 0, 0.15);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                min-width: 180px;
                min-height: 120px;
            }
            .ch1-gal-img-holder:hover {
                transform: scale(1.05);
                box-shadow:
                    0 0 35px rgba(255, 165, 0, 0.45),
                    0 0 60px rgba(255, 165, 0, 0.25);
            }
            .ch1-gal-img-holder img {
                display: block;
                width: 180px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                border-width: 0 !important;
                outline: none !important;
                box-shadow: none !important;
            }
            /* Placeholder text when image fails to load */
            .ch1-gal-img-holder .placeholder {
                display: none;
                width: 180px;
                height: 120px;
                border-radius: 6px;
                background: rgba(255, 165, 0, 0.1);
                color: rgba(255, 165, 0, 0.6);
                font-size: 11px;
                text-align: center;
                line-height: 120px;
            }
            .ch1-gal-img-holder img.hidden + .placeholder {
                display: block;
            }

            /* === RESPONSIVE - TABLET === */
            @media (max-width: 1024px) {
                .ch1-svg-marker {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.9)}px;
                    height: ${Math.round(CONFIG.MARKER_SIZE * 0.9)}px;
                }
                .ch1-svg-marker-dark {
                    width: ${Math.round(CONFIG.DARK_MARKER_SIZE * 0.9)}px;
                    height: ${Math.round(CONFIG.DARK_MARKER_SIZE * 0.9)}px;
                }
                .ch1-sts-img {
                    max-width: 200px;
                }
                .ch1-gal-img-holder img {
                    width: 150px;
                }
                .ch1-gal-img-holder {
                    min-width: 150px;
                    min-height: 100px;
                }
                .ch1-gal { gap: 10px; }
            }

            /* === RESPONSIVE - MOBILE === */
            @media (max-width: 768px) {
                .ch1-svg-marker {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.8)}px;
                    height: ${Math.round(CONFIG.MARKER_SIZE * 0.8)}px;
                }
                .ch1-svg-marker-dark {
                    width: ${Math.round(CONFIG.DARK_MARKER_SIZE * 0.8)}px;
                    height: ${Math.round(CONFIG.DARK_MARKER_SIZE * 0.8)}px;
                }
                .ch1-sts-img {
                    max-width: 160px;
                }
                .ch1-gal {
                    flex-wrap: wrap;
                    justify-content: center;
                    max-width: 380px;
                }
                .ch1-gal-img-holder img {
                    width: 120px;
                }
                .ch1-gal-img-holder {
                    min-width: 120px;
                    min-height: 80px;
                }
                .ch1-gal { gap: 8px; }
            }

            /* === RESPONSIVE - SMALL MOBILE === */
            @media (max-width: 480px) {
                .ch1-svg-marker {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.7)}px;
                    height: ${Math.round(CONFIG.MARKER_SIZE * 0.7)}px;
                }
                .ch1-svg-marker-dark {
                    width: ${Math.round(CONFIG.DARK_MARKER_SIZE * 0.7)}px;
                    height: ${Math.round(CONFIG.DARK_MARKER_SIZE * 0.7)}px;
                }
                .ch1-sts-img {
                    max-width: 130px;
                }
                .ch1-gal {
                    max-width: 280px;
                }
                .ch1-gal-img-holder img {
                    width: 90px;
                }
                .ch1-gal-img-holder {
                    min-width: 90px;
                    min-height: 60px;
                }
                .ch1-gal { gap: 6px; }
                .ch1-vessel {
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
        if (stsMkr) { stsMkr.remove(); stsMkr = null; }
        if (stsPopup) { stsPopup.remove(); stsPopup = null; }
        darkMkrs.forEach(m => m.remove());
        darkMkrs = [];
        if (galPopup) { galPopup.remove(); galPopup = null; }
        if (aisOffPopup) { aisOffPopup.remove(); aisOffPopup = null; }
    }

    // Comprehensive cleanup of detection markers and popups only (keeps path)
    function clearDetectionsAndPopups() {
        if (stsMkr) { stsMkr.remove(); stsMkr = null; }
        if (stsPopup) { stsPopup.remove(); stsPopup = null; }
        darkMkrs.forEach(m => m.remove());
        darkMkrs = [];
        if (galPopup) { galPopup.remove(); galPopup = null; }
        if (aisOffPopup) { aisOffPopup.remove(); aisOffPopup = null; }
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

    function createAisOffAnnotation(lngLat) {
        return new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch1-ais-off-popup',
            offset: [20, -40],
            anchor: 'left'
        })
            .setLngLat(lngLat)
            .setHTML(`
                <div class="ch1-ais-off-content">
                    <div class="ch1-ais-off-row">
                        <div class="ch1-ais-off-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                            </svg>
                        </div>
                        <div class="ch1-ais-off-body">
                            <div class="ch1-ais-off-title">AIS Turned Off</div>
                            <div class="ch1-ais-off-text">
                                <span class="highlight-red">24 Dec 2024</span>
                            </div>
                        </div>
                    </div>
                </div>
            `)
            .addTo(map);
    }

    // Create SVG marker element - light detection (blue glow)
    function createLightMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch1-svg-marker';
        el.innerHTML = `<img src="${svgFile}" alt="Detection marker">`;
        return el;
    }

    // Create SVG marker element - dark detection (orange glow)
    function createDarkMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch1-svg-marker-dark';
        el.innerHTML = `<img src="${svgFile}" alt="Detection marker">`;
        return el;
    }

    // ============================================================================
    // LOAD DATA
    // ============================================================================

    async function loadData() {
        if (coords) return true;
        try {
            const res = await fetch(chapterConfig?.dataFile || 'data/chapter1-tasca.geojson');
            const data = await res.json();
            if (data?.features?.[0]?.geometry?.coordinates) {
                coords = data.features[0].geometry.coordinates;
                total = coords.length;
                console.log(`  ✓ ${total} points loaded`);
                return true;
            }
        } catch(e) { console.error('Load error:', e); }
        return false;
    }

    // ============================================================================
    // SHOW STS (Main Chapter - Blue Light Detection Marker)
    // ============================================================================

    function showSTS() {
        console.log('  → showSTS');
        
        // Immediately clear any markers/popups from previous scroll
        clearDetectionsAndPopups();
        
        // Full cleanup
        clearAll();

        // Create STS marker with external SVG and blue glow (10:45 heading)
        // SVG default points right (3 o'clock). User calibrated: -127.5 = 2 o'clock, so 11 o'clock = -217.5°
        const el = createLightMarker(CONFIG.SVG_LIGHT);
        stsMkr = new mapboxgl.Marker({ element: el, anchor: 'center', rotation: -217.5 })
            .setLngLat(CONFIG.STS_COORDS)
            .addTo(map);

        // Create popup with satellite image (blue glow, fits naturally)
        stsPopup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch1-pop',
            offset: CONFIG.STS_IMG_OFFSET
        })
            .setLngLat(CONFIG.STS_COORDS)
            .setHTML(`
                <div class="ch1-sts-img-holder">
                    <img class="ch1-sts-img" src="${CONFIG.STS_IMAGE}"
                         onerror="this.parentElement.style.display='none';">
                </div>
            `)
            .addTo(map);
    }

    // ============================================================================
    // SHOW PATH (Part 1 - Animated Track)
    // ============================================================================

    async function showPath() {
        console.log('  → showPath');
        
        // Immediately clear any markers/popups from previous scroll
        clearDetectionsAndPopups();
        
        // Then clear everything for fresh start
        clearAll();

        await loadData();
        if (!coords || !coords.length) return;

        // Setup source & layers
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
        vel.className = 'ch1-vessel';
        vesselMkr = new mapboxgl.Marker({ element: vel, anchor: 'center' })
            .setLngLat(coords[0]).addTo(map);

        // Start animation
        progress = 0;
        running = true;
        startT = performance.now();
        animate();
    }

    function animate() {
        if (!running || !coords) return;

        const elapsed = performance.now() - startT;
        const pct = Math.min(elapsed / CONFIG.ANIMATION_DURATION, 1);
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
        }

        if (pct < 1) {
            animId = requestAnimationFrame(animate);
        } else {
            // Complete
            const src = map.getSource(SOURCE_ID);
            if (src) {
                src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } });
            }
            if (vesselMkr) vesselMkr.setLngLat(coords[total - 1]);
            running = false;

            // Show AIS Off annotation at last point
            if (!aisOffPopup) {
                aisOffPopup = createAisOffAnnotation(coords[total - 1]);
            }

            console.log('  ✓ Path complete');
        }
    }

    // ============================================================================
    // SHOW GALLERY (Part 2 - 4 Dark Detection Markers + Gallery)
    // ============================================================================

    function showGallery() {
        console.log('  → showGallery');

        // Clear STS markers but keep path
        if (stsMkr) { stsMkr.remove(); stsMkr = null; }
        if (stsPopup) { stsPopup.remove(); stsPopup = null; }

        // Clear existing dark markers and gallery
        darkMkrs.forEach(m => m.remove());
        darkMkrs = [];
        if (galPopup) { galPopup.remove(); galPopup = null; }

        // Create 4 dark detection markers (yellow glow, no ring) using external SVG
        // Det1=11:00(-120°), Det2=12:00(-90°), Det3=1:00(-60°), Det4=1:00(-60°)
        const darkCoords = [
            CONFIG.DARK_DET_1,
            CONFIG.DARK_DET_2,
            CONFIG.DARK_DET_3,
            CONFIG.DARK_DET_4
        ];
        const darkRotations = [-120, -90, -60, -60];

        darkCoords.forEach((coord, i) => {
            const el = createDarkMarker(CONFIG.SVG_DARK);
            const marker = new mapboxgl.Marker({ element: el, anchor: 'center', rotation: darkRotations[i] })
                .setLngLat(coord)
                .addTo(map);
            darkMkrs.push(marker);
        });

        // Gallery with 4 separate image holders (each with own yellow glow)
        const imgs = CONFIG.GALLERY_IMAGES.map((s, i) =>
            `<div class="ch1-gal-img-holder">
                <img src="${s}" alt="Satellite capture ${i+1}"
                     onerror="this.classList.add('hidden');">
                <div class="placeholder">SAT ${i+1}</div>
            </div>`
        ).join('');

        galPopup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch1-pop',
            offset: CONFIG.GAL_OFFSET
        })
            .setLngLat(CONFIG.DARK_DET_1)
            .setHTML(`<div class="ch1-gal">${imgs}</div>`)
            .addTo(map);
    }

    // ============================================================================
    // SHOW GALLERY WITH PATH (Part 2 - Preserves Path from Part 1)
    // ============================================================================

    async function showGalleryKeepPath() {
        console.log('  → showGalleryKeepPath');
        
        // IMMEDIATELY clear any existing markers/popups before anything else
        clearDetectionsAndPopups();

        // First, ensure path data is loaded and drawn (instantly, no animation)
        await loadData();
        if (coords && coords.length) {
            // Check if path layers already exist
            if (!map.getSource(SOURCE_ID)) {
                // Draw complete path instantly (no animation)
                map.addSource(SOURCE_ID, {
                    type: 'geojson',
                    data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } }
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

                // Vessel marker at end of path
                const vel = document.createElement('div');
                vel.className = 'ch1-vessel';
                vesselMkr = new mapboxgl.Marker({ element: vel, anchor: 'center' })
                    .setLngLat(coords[coords.length - 1]).addTo(map);

                console.log('  ✓ Path drawn instantly for Part 2');
            }
        }

        // Now show the gallery with dark detection markers
        // Clear any STS markers
        if (stsMkr) { stsMkr.remove(); stsMkr = null; }
        if (stsPopup) { stsPopup.remove(); stsPopup = null; }

        // Clear existing dark markers and gallery
        darkMkrs.forEach(m => m.remove());
        darkMkrs = [];
        if (galPopup) { galPopup.remove(); galPopup = null; }

        // Create 4 dark detection markers (yellow glow, no ring) using external SVG
        // Det1=11:00(-120°), Det2=12:00(-90°), Det3=1:00(-60°), Det4=1:00(-60°)
        const darkCoords = [
            CONFIG.DARK_DET_1,
            CONFIG.DARK_DET_2,
            CONFIG.DARK_DET_3,
            CONFIG.DARK_DET_4
        ];
        const darkRotations = [-120, -90, -60, -60];

        darkCoords.forEach((coord, i) => {
            const el = createDarkMarker(CONFIG.SVG_DARK);
            const marker = new mapboxgl.Marker({ element: el, anchor: 'center', rotation: darkRotations[i] })
                .setLngLat(coord)
                .addTo(map);
            darkMkrs.push(marker);
        });

        // Gallery with 4 separate image holders (each with own yellow glow)
        const imgs = CONFIG.GALLERY_IMAGES.map((s, i) =>
            `<div class="ch1-gal-img-holder">
                <img src="${s}" alt="Satellite capture ${i+1}"
                     onerror="this.classList.add('hidden');">
                <div class="placeholder">SAT ${i+1}</div>
            </div>`
        ).join('');

        galPopup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch1-pop',
            offset: CONFIG.GAL_OFFSET
        })
            .setLngLat(CONFIG.DARK_DET_1)
            .setHTML(`<div class="ch1-gal">${imgs}</div>`)
            .addTo(map);

        // AIS Off annotation at last AIS point
        if (coords && coords.length > 1) {
            if (aisOffPopup) { aisOffPopup.remove(); aisOffPopup = null; }
            aisOffPopup = createAisOffAnnotation(coords[coords.length - 1]);
        }

        console.log('  ✓ Gallery shown with path preserved');
    }

    // ============================================================================
    // CLEANUP
    // ============================================================================

    function cleanup() {
        console.log('  🧹 Ch1 cleanup');
        clearAll();
        coords = null;
        total = 0;
    }

    // ============================================================================
    // RETURN CONTROLLER
    // ============================================================================

    return {
        stop: cleanup,
        showSTS,
        showMain: showSTS,
        showPath,
        showGallery,
        showGalleryKeepPath,
        pause: stopAnim,
        resume: () => {
            if (coords && !running && progress < total - 1) {
                running = true;
                startT = performance.now() - (progress/total) * CONFIG.ANIMATION_DURATION;
                animate();
            }
        },
        getProgress: () => total ? progress / total : 0,
        isComplete: () => progress >= total - 1
    };
}

window.animateChapter1 = animateChapter1;
