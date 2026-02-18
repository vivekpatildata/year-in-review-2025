// ============================================================================
// CHAPTER 8 ANIMATION - ZHU HAI YUN: China's Autonomous Drone Mothership
// Story: Between late July and mid-August 2025, China's first autonomous drone
// mothership conducted a systematic transit through the disputed South China Sea's
// Spratly Islands, visiting multiple contested reef complexes.
// ============================================================================

function animateChapter8(map, chapterConfig) {
    console.log('Chapter 8: Init - ZHU HAI YUN');

    // ============================================================================
    // CUSTOMIZATION OPTIONS
    // ============================================================================

    const CONFIG = {
        // --- COLORS ---
        LINE_COLOR: '#00ff88',           // Neon green track
        GLOW_COLOR: '#00ff88',           // Track glow
        LIGHT_DET_COLOR: '#00a3e3',      // Blue for light detection

        // --- ANIMATION ---
        MAIN_DURATION: 5000,             // Animation speed (ms)

        // --- SVG MARKER FILES ---
        SVG_LIGHT: 'assets/svg/lightdetection.svg',

        // --- MARKER SIZES ---
        LIGHT_MARKER_SIZE: 32,

        // --- VESSEL MARKER ---
        VESSEL_SIZE: 14,
        VESSEL_BORDER: 0,
    };

    // ============================================================================
    // MARKER LOCATIONS (6 Light Detection markers along the route)
    // Spratly Islands contested reef complexes
    // ============================================================================

    // MARKER 1: Irving Reef (29th-31st July) - Philippines administered
    const MARKER_1 = {
        COORDS: [114.935, 10.883333],    // [lng, lat] - matches AIS track point
        IMAGE: 'images/chapter8/chapter8A.png',
        IMG_WIDTH: 180,
        IMG_HEIGHT: 180,
        IMG_OFFSET: [-20, -90],
        LABEL: 'Irving Reef'
    };

    // MARKER 2: Subi Reef (31st July-3rd August) - Chinese artificial island
    const MARKER_2 = {
        COORDS: [114.078333, 10.92],     // [lng, lat] - matches AIS track point
        IMAGE: 'images/chapter8/chapter8B.png',
        IMG_WIDTH: 180,
        IMG_HEIGHT: 180,
        IMG_OFFSET: [-160, 0],
        LABEL: 'Subi Reef'
    };

    // MARKER 3: North Gaven Reef (3rd-4th August) - Tizard Bank area
    const MARKER_3 = {
        COORDS: [114.238333, 10.2],      // [lng, lat] - matches AIS track point
        IMAGE: 'images/chapter8/chapter8C.png',
        IMG_WIDTH: 180,
        IMG_HEIGHT: 180,
        IMG_OFFSET: [300, -20],
        LABEL: 'North Gaven Reef'
    };

    // MARKER 4: Mischief Reef (5th-8th August) - 3,000m runway
    const MARKER_4 = {
        COORDS: [115.535, 9.901667],     // [lng, lat] - matches AIS track point
        IMAGE: 'images/chapter8/chapter8D.png',
        IMG_WIDTH: 180,
        IMG_HEIGHT: 180,
        IMG_OFFSET: [200, 170],
        LABEL: 'Mischief Reef'
    };

    // MARKER 5: Union Banks (4th-8th August) - Large atoll formation
    const MARKER_5 = {
        COORDS: [114.283333, 9.75],      // [lng, lat] - matches AIS track point
        IMAGE: 'images/chapter8/chapter8E.png',
        IMG_WIDTH: 180,
        IMG_HEIGHT: 180,
        IMG_OFFSET: [0, 270],
        LABEL: 'Union Banks'
    };

    // MARKER 6: Fiery Cross Reef (10th-16th August)
    const MARKER_6 = {
        COORDS: [112.895, 9.553333],     // [lng, lat] - matches AIS track point
        IMAGE: 'images/chapter8/chapter8F.png',
        IMG_WIDTH: 180,
        IMG_HEIGHT: 180,
        IMG_OFFSET: [-120, 120],
        LABEL: 'Fiery Cross Reef'
    };

    // Percentage thresholds for marker appearance during animation
    const PCT_MARKER_1 = 0.10;   // Irving Reef at 10%
    const PCT_MARKER_2 = 0.25;   // Subi Reef at 25%
    const PCT_MARKER_3 = 0.40;   // North Gaven Reef at 40%
    const PCT_MARKER_4 = 0.55;   // Mischief Reef at 55%
    const PCT_MARKER_5 = 0.70;   // Union Banks at 70%
    const PCT_MARKER_6 = 0.85;   // Fiery Cross Reef at 85%

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    const SOURCE_ID = 'ch8-src';
    const LAYER_ID = 'ch8-line';
    const GLOW_ID = 'ch8-glow';
    
    // South China Sea disputed territory layer
    const SCS_SOURCE = 'ch8-scs-src';
    const SCS_FILL_LAYER = 'ch8-scs-fill';
    const SCS_LINE_LAYER = 'ch8-scs-line';

    let coords = null;
    let total = 0;
    let animId = null;
    let progress = 0;
    let startT = null;
    let running = false;

    // Markers
    let vesselMkr = null;
    let marker1 = null;
    let popup1 = null;
    let numMkr1 = null;
    let marker2 = null;
    let popup2 = null;
    let numMkr2 = null;
    let marker3 = null;
    let popup3 = null;
    let numMkr3 = null;
    let marker4 = null;
    let popup4 = null;
    let numMkr4 = null;
    let marker5 = null;
    let popup5 = null;
    let numMkr5 = null;
    let marker6 = null;
    let popup6 = null;
    let numMkr6 = null;

    // ============================================================================
    // INJECT STYLES
    // ============================================================================

    if (!document.getElementById('ch8-css')) {
        const css = document.createElement('style');
        css.id = 'ch8-css';
        css.textContent = `
            /* === VESSEL MARKER === */
            .ch8-vessel {
                width: ${CONFIG.VESSEL_SIZE}px;
                height: ${CONFIG.VESSEL_SIZE}px;
                background: ${CONFIG.LINE_COLOR};
                border: ${CONFIG.VESSEL_BORDER}px solid #fff;
                border-radius: 50%;
                box-shadow: 0 0 15px ${CONFIG.LINE_COLOR}, 0 0 30px ${CONFIG.LINE_COLOR}40;
            }

            /* === LIGHT DETECTION MARKER (Blue Glow) === */
            .ch8-light-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
            }
            .ch8-light-marker:hover {
                transform: scale(1.15);
            }
            .ch8-light-marker img {
                width: ${CONFIG.LIGHT_MARKER_SIZE}px;
                height: auto;
                filter: drop-shadow(0 0 12px rgba(0, 163, 227, 0.9))
                        drop-shadow(0 0 20px rgba(0, 163, 227, 0.6))
                        drop-shadow(0 0 30px rgba(0, 163, 227, 0.4));
            }

            /* === NUMBER MARKERS === */
            .ch8-number-marker {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: rgba(17, 19, 38, 0.95);
                border: 2px solid #00a3e3;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                font-weight: 700;
                color: #00a3e3;
                box-shadow: 0 0 12px rgba(0, 163, 227, 0.5);
                transition: opacity 0.4s ease, transform 0.3s ease;
            }
            .ch8-number-marker:hover {
                transform: scale(1.1);
            }

            /* === POPUP BASE === */
            .ch8-pop .mapboxgl-popup-tip { display: none !important; }
            .ch8-pop .mapboxgl-popup-content {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
                outline: none !important;
            }

            /* === SATELLITE IMAGE (Blue Glow) === */
            .ch8-img-holder {
                position: relative;
                display: inline-block;
                padding: 0 !important;
                margin: 0 !important;
                border-radius: 4px;
                background: none !important;
                border: none !important;
                outline: none !important;
                overflow: hidden;
                box-shadow:
                    0 0 25px rgba(0, 163, 227, 0.35),
                    0 0 50px rgba(0, 163, 227, 0.15);
            }
            .ch8-sat-img {
                display: block;
                width: 180px;
                height: auto;
                border-radius: 0 !important;
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            /* === IMAGE NUMBER BADGE — bottom-right overlay === */
            .ch8-img-badge {
                position: absolute;
                bottom: 6px;
                right: 6px;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: rgba(0, 20, 40, 0.85);
                border: 1.5px solid #00a3e3;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'JetBrains Mono', 'Inter', monospace;
                font-size: 11px;
                font-weight: 700;
                color: #00d4ff;
                z-index: 10;
                box-shadow:
                    0 0 8px rgba(0, 163, 227, 0.6),
                    0 2px 4px rgba(0, 0, 0, 0.5);
                pointer-events: none;
            }

            /* === RESPONSIVE - TABLET === */
            @media (max-width: 1024px) {
                .ch8-light-marker img {
                    width: ${Math.round(CONFIG.LIGHT_MARKER_SIZE * 0.9)}px;
                }
                .ch8-sat-img {
                    width: 160px;
                }
                .ch8-number-marker {
                    width: 24px;
                    height: 24px;
                    font-size: 12px;
                }
                .ch8-img-badge {
                    width: 20px;
                    height: 20px;
                    font-size: 10px;
                }
            }

            /* === TERRITORY LABELS ON MAP === */
            .ch8-territory-label {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 12px;
                font-weight: 700;
                letter-spacing: 2px;
                text-transform: uppercase;
                color: #ff4444;
                pointer-events: none;
                text-shadow: 
                    0 0 10px rgba(0, 0, 0, 1),
                    0 0 20px rgba(0, 0, 0, 0.9),
                    0 2px 4px rgba(0, 0, 0, 0.9),
                    2px 2px 6px rgba(0, 0, 0, 0.8);
                opacity: 0.9;
            }
            
            .ch8-territory-label span {
                display: block;
                white-space: nowrap;
            }

            /* === RESPONSIVE - MOBILE === */
            @media (max-width: 768px) {
                .ch8-light-marker img {
                    width: ${Math.round(CONFIG.LIGHT_MARKER_SIZE * 0.8)}px;
                }
                .ch8-sat-img {
                    width: 140px;
                }
                .ch8-number-marker {
                    width: 22px;
                    height: 22px;
                    font-size: 11px;
                }
                .ch8-img-badge {
                    width: 18px;
                    height: 18px;
                    font-size: 9px;
                    bottom: 4px;
                    right: 4px;
                }
                .ch8-territory-label {
                    font-size: 10px;
                    letter-spacing: 1.5px;
                }
            }

            /* === RESPONSIVE - SMALL MOBILE === */
            @media (max-width: 480px) {
                .ch8-light-marker img {
                    width: ${Math.round(CONFIG.LIGHT_MARKER_SIZE * 0.7)}px;
                }
                .ch8-sat-img {
                    width: 110px;
                }
                .ch8-vessel {
                    width: ${Math.round(CONFIG.VESSEL_SIZE * 0.8)}px;
                    height: ${Math.round(CONFIG.VESSEL_SIZE * 0.8)}px;
                }
                .ch8-number-marker {
                    width: 20px;
                    height: 20px;
                    font-size: 10px;
                }
                .ch8-img-badge {
                    width: 16px;
                    height: 16px;
                    font-size: 8px;
                    bottom: 3px;
                    right: 3px;
                }
                .ch8-territory-label {
                    font-size: 9px;
                    letter-spacing: 1px;
                }
            }
        `;
        document.head.appendChild(css);
    }

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    function clearLayers() {
        // Clear track layers
        try { if (map.getLayer(GLOW_ID)) map.removeLayer(GLOW_ID); } catch(e) {}
        try { if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID); } catch(e) {}
        try { if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID); } catch(e) {}
        
        // Clear South China Sea disputed territory layers
        try { if (map.getLayer(SCS_LINE_LAYER)) map.removeLayer(SCS_LINE_LAYER); } catch(e) {}
        try { if (map.getLayer(SCS_FILL_LAYER)) map.removeLayer(SCS_FILL_LAYER); } catch(e) {}
        try { if (map.getSource(SCS_SOURCE)) map.removeSource(SCS_SOURCE); } catch(e) {}
    }

    function clearMarkers() {
        if (vesselMkr) { vesselMkr.remove(); vesselMkr = null; }
        if (marker1) { marker1.remove(); marker1 = null; }
        if (popup1) { popup1.remove(); popup1 = null; }
        if (numMkr1) { numMkr1.remove(); numMkr1 = null; }
        if (marker2) { marker2.remove(); marker2 = null; }
        if (popup2) { popup2.remove(); popup2 = null; }
        if (numMkr2) { numMkr2.remove(); numMkr2 = null; }
        if (marker3) { marker3.remove(); marker3 = null; }
        if (popup3) { popup3.remove(); popup3 = null; }
        if (numMkr3) { numMkr3.remove(); numMkr3 = null; }
        if (marker4) { marker4.remove(); marker4 = null; }
        if (popup4) { popup4.remove(); popup4 = null; }
        if (numMkr4) { numMkr4.remove(); numMkr4 = null; }
        if (marker5) { marker5.remove(); marker5 = null; }
        if (popup5) { popup5.remove(); popup5 = null; }
        if (numMkr5) { numMkr5.remove(); numMkr5 = null; }
        if (marker6) { marker6.remove(); marker6 = null; }
        if (popup6) { popup6.remove(); popup6 = null; }
        if (numMkr6) { numMkr6.remove(); numMkr6 = null; }
    }

    function stopAnim() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        running = false;
    }

    function clearAll() {
        stopAnim();
        clearMarkers();
        clearLayers();
        removeTerritoryAnnotation();
        progress = 0;
    }

    // Territory labels positioned within visible camera area (center: 117.258, 10.977, zoom: 5.67)
    const TERRITORY_LABELS = [
        { name: 'VIETNAM', coords: [110.0, 13.0] },          // Left coast - moved right into view
        { name: 'PARACEL ISLANDS', coords: [112.0, 14.5] },  // North of Spratly
        { name: 'PHILIPPINES', coords: [121.0, 12.5] },      // Right side
        { name: 'MALAYSIA / BRUNEI', coords: [115.0, 6.5] }, // Bottom - Borneo coast
        { name: 'SPRATLY ISLANDS', coords: [114.5, 10.0] }   // Center - disputed area
    ];
    
    let territoryMarkers = [];
    
    function createTerritoryAnnotation() {
        removeTerritoryAnnotation();
        
        TERRITORY_LABELS.forEach(territory => {
            const el = document.createElement('div');
            el.className = 'ch8-territory-label';
            el.innerHTML = `<span>${territory.name}</span>`;
            
            const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
                .setLngLat(territory.coords)
                .addTo(map);
            
            territoryMarkers.push(marker);
        });
    }
    
    function removeTerritoryAnnotation() {
        territoryMarkers.forEach(m => m.remove());
        territoryMarkers = [];
    }

    // Create light detection marker (blue glow)
    function createLightMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch8-light-marker';
        el.innerHTML = `<img src="${svgFile}" alt="Light detection marker">`;
        return el;
    }

    // Create number marker
    function createNumberMarker(number, lngLat, offset = [0, -35]) {
        const el = document.createElement('div');
        el.className = 'ch8-number-marker';
        el.textContent = number;
        return new mapboxgl.Marker({ element: el, anchor: 'center', offset: offset })
            .setLngLat(lngLat)
            .addTo(map);
    }

    // Create satellite image popup with number badge
    function createSatPopup(markerConfig, number) {
        return new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch8-pop',
            offset: markerConfig.IMG_OFFSET
        })
            .setLngLat(markerConfig.COORDS)
            .setHTML(`
                <div class="ch8-img-holder">
                    <div class="ch8-img-badge">${number}</div>
                    <img class="ch8-sat-img" src="${markerConfig.IMAGE}"
                         onerror="this.parentElement.style.display='none';">
                </div>
            `);
    }

    // ============================================================================
    // LOAD DATA
    // ============================================================================

    async function loadData() {
        if (coords) return true;
        try {
            const res = await fetch(chapterConfig?.dataFile || 'data/ZHUHAIYUN AIS Data_track_time_windows_min (1).geojson');
            const data = await res.json();

            let coordinates;
            if (data.type === 'FeatureCollection' && data.features?.[0]?.geometry?.coordinates) {
                coordinates = data.features[0].geometry.coordinates;
            } else if (data.type === 'Feature' && data.geometry?.coordinates) {
                coordinates = data.geometry.coordinates;
            } else if (data.type === 'LineString' && data.coordinates) {
                coordinates = data.coordinates;
            } else if (data.features?.[0]?.geometry?.coordinates) {
                coordinates = data.features[0].geometry.coordinates;
            }

            if (coordinates && coordinates.length) {
                coords = coordinates;
                total = coords.length;
                console.log(`  ✓ ${total} points loaded for ZHU HAI YUN`);
                return true;
            }
        } catch(e) { console.error('Load error:', e); }
        return false;
    }

    // ============================================================================
    // SHOW MAIN (Main Chapter - Full animation with 6 markers)
    // ============================================================================

    async function showMain() {
        console.log('  → showMain (ZHU HAI YUN - Spratly Islands transit)');
        clearAll();

        await loadData();
        if (!coords || !coords.length) {
            console.error('No coordinates loaded for Chapter 8');
            return;
        }

        // =========================================
        // SOUTH CHINA SEA DISPUTED TERRITORY LAYER (Background)
        // =========================================
        try {
            const scsRes = await fetch('data/south_china_sea.geojson');
            const scsData = await scsRes.json();
            
            map.addSource(SCS_SOURCE, {
                type: 'geojson',
                data: scsData
            });

            // Fill layer - subtle transparent fill
            map.addLayer({
                id: SCS_FILL_LAYER,
                type: 'fill',
                source: SCS_SOURCE,
                paint: {
                    'fill-color': '#ff6b6b',
                    'fill-opacity': 0.08
                }
            });

            // Line layer - dashed border for disputed territory
            map.addLayer({
                id: SCS_LINE_LAYER,
                type: 'line',
                source: SCS_SOURCE,
                paint: {
                    'line-color': '#ff6b6b',
                    'line-width': 2,
                    'line-opacity': 0.4,
                    'line-dasharray': [4, 4]
                }
            });
            
            // Add territory annotation overlay
            createTerritoryAnnotation();
            
            console.log('  ✓ South China Sea disputed territory layer loaded');
        } catch (e) {
            console.warn('  Could not load South China Sea layer:', e);
        }

        // =========================================
        // VESSEL TRACK LAYERS
        // =========================================
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
        vel.className = 'ch8-vessel';
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

            // === MARKER 1: Irving Reef at PCT_MARKER_1 (7 o'clock = 120°) ===
            if (pct >= PCT_MARKER_1 && !marker1) {
                const el = createLightMarker(CONFIG.SVG_LIGHT);
                marker1 = new mapboxgl.Marker({ element: el, anchor: 'center', rotation: 120 })
                    .setLngLat(MARKER_1.COORDS)
                    .addTo(map);
                numMkr1 = createNumberMarker('1', MARKER_1.COORDS, [35, -35]);  // Diagonally right of marker
                popup1 = createSatPopup(MARKER_1, 1);
                popup1.addTo(map);
            }

            // === MARKER 2: Subi Reef at PCT_MARKER_2 (4 o'clock = 30°) ===
            if (pct >= PCT_MARKER_2 && !marker2) {
                const el = createLightMarker(CONFIG.SVG_LIGHT);
                marker2 = new mapboxgl.Marker({ element: el, anchor: 'center', rotation: 30 })
                    .setLngLat(MARKER_2.COORDS)
                    .addTo(map);
                numMkr2 = createNumberMarker('2', MARKER_2.COORDS);
                popup2 = createSatPopup(MARKER_2, 2);
                popup2.addTo(map);
            }

            // === MARKER 3: North Gaven Reef at PCT_MARKER_3 (7 o'clock = 120°) ===
            if (pct >= PCT_MARKER_3 && !marker3) {
                const el = createLightMarker(CONFIG.SVG_LIGHT);
                marker3 = new mapboxgl.Marker({ element: el, anchor: 'center', rotation: 120 })
                    .setLngLat(MARKER_3.COORDS)
                    .addTo(map);
                numMkr3 = createNumberMarker('3', MARKER_3.COORDS, [35, 0]);  // Right of marker
                popup3 = createSatPopup(MARKER_3, 3);
                popup3.addTo(map);
            }

            // === MARKER 4: Mischief Reef at PCT_MARKER_4 (7:30 = 135°) ===
            if (pct >= PCT_MARKER_4 && !marker4) {
                const el = createLightMarker(CONFIG.SVG_LIGHT);
                marker4 = new mapboxgl.Marker({ element: el, anchor: 'center', rotation: 135 })
                    .setLngLat(MARKER_4.COORDS)
                    .addTo(map);
                numMkr4 = createNumberMarker('4', MARKER_4.COORDS);
                popup4 = createSatPopup(MARKER_4, 4);
                popup4.addTo(map);
            }

            // === MARKER 5: Union Banks at PCT_MARKER_5 (6:10 = 95°) ===
            if (pct >= PCT_MARKER_5 && !marker5) {
                const el = createLightMarker(CONFIG.SVG_LIGHT);
                marker5 = new mapboxgl.Marker({ element: el, anchor: 'center', rotation: 95 })
                    .setLngLat(MARKER_5.COORDS)
                    .addTo(map);
                numMkr5 = createNumberMarker('5', MARKER_5.COORDS, [0, 35]);  // Below marker
                popup5 = createSatPopup(MARKER_5, 5);
                popup5.addTo(map);
            }

            // === MARKER 6: Fiery Cross Reef at PCT_MARKER_6 (11 o'clock = -120°) ===
            if (pct >= PCT_MARKER_6 && !marker6) {
                const el = createLightMarker(CONFIG.SVG_LIGHT);
                marker6 = new mapboxgl.Marker({ element: el, anchor: 'center', rotation: -120 })
                    .setLngLat(MARKER_6.COORDS)
                    .addTo(map);
                numMkr6 = createNumberMarker('6', MARKER_6.COORDS);
                popup6 = createSatPopup(MARKER_6, 6);
                popup6.addTo(map);
            }
        }

        if (pct < 1) {
            animId = requestAnimationFrame(animateMain);
        } else {
            // Complete animation - ensure full track is drawn
            const src = map.getSource(SOURCE_ID);
            if (src) {
                src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } });
            }
            if (vesselMkr) vesselMkr.setLngLat(coords[total - 1]);

            // Ensure all markers are placed
            if (!marker1) {
                const el = createLightMarker(CONFIG.SVG_LIGHT);
                marker1 = new mapboxgl.Marker({ element: el, anchor: 'center', rotation: 120 })
                    .setLngLat(MARKER_1.COORDS).addTo(map);
                numMkr1 = createNumberMarker('1', MARKER_1.COORDS, [35, -35]);
                popup1 = createSatPopup(MARKER_1, 1);
                popup1.addTo(map);
            }
            if (!marker2) {
                const el = createLightMarker(CONFIG.SVG_LIGHT);
                marker2 = new mapboxgl.Marker({ element: el, anchor: 'center', rotation: 30 })
                    .setLngLat(MARKER_2.COORDS).addTo(map);
                numMkr2 = createNumberMarker('2', MARKER_2.COORDS);
                popup2 = createSatPopup(MARKER_2, 2);
                popup2.addTo(map);
            }
            if (!marker3) {
                const el = createLightMarker(CONFIG.SVG_LIGHT);
                marker3 = new mapboxgl.Marker({ element: el, anchor: 'center', rotation: 120 })
                    .setLngLat(MARKER_3.COORDS).addTo(map);
                numMkr3 = createNumberMarker('3', MARKER_3.COORDS, [35, 0]);
                popup3 = createSatPopup(MARKER_3, 3);
                popup3.addTo(map);
            }
            if (!marker4) {
                const el = createLightMarker(CONFIG.SVG_LIGHT);
                marker4 = new mapboxgl.Marker({ element: el, anchor: 'center', rotation: 135 })
                    .setLngLat(MARKER_4.COORDS).addTo(map);
                numMkr4 = createNumberMarker('4', MARKER_4.COORDS);
                popup4 = createSatPopup(MARKER_4, 4);
                popup4.addTo(map);
            }
            if (!marker5) {
                const el = createLightMarker(CONFIG.SVG_LIGHT);
                marker5 = new mapboxgl.Marker({ element: el, anchor: 'center', rotation: 95 })
                    .setLngLat(MARKER_5.COORDS).addTo(map);
                numMkr5 = createNumberMarker('5', MARKER_5.COORDS, [0, 35]);
                popup5 = createSatPopup(MARKER_5, 5);
                popup5.addTo(map);
            }
            if (!marker6) {
                const el = createLightMarker(CONFIG.SVG_LIGHT);
                marker6 = new mapboxgl.Marker({ element: el, anchor: 'center', rotation: -120 })
                    .setLngLat(MARKER_6.COORDS).addTo(map);
                numMkr6 = createNumberMarker('6', MARKER_6.COORDS);
                popup6 = createSatPopup(MARKER_6, 6);
                popup6.addTo(map);
            }

            running = false;
            console.log('  ✓ Chapter 8 animation complete (ZHU HAI YUN - Spratly Islands)');
        }
    }

    // ============================================================================
    // CLEANUP
    // ============================================================================

    function cleanup() {
        console.log('  🧹 Ch8 cleanup');
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
        pause: stopAnim,
        resume: () => {
            if (coords && !running && progress < total - 1) {
                running = true;
                startT = performance.now() - (progress/total) * CONFIG.MAIN_DURATION;
                animateMain();
            }
        },
        getProgress: () => total ? progress / total : 0,
        isComplete: () => progress >= total - 1
    };
}

window.animateChapter8 = animateChapter8;
