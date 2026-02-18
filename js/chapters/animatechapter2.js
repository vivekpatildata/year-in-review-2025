// ============================================================================
// CHAPTER 2 ANIMATION - Chinese Jack-Up Barges: Guangzhou to Nansan Island
// ============================================================================

function animateChapter2(map, chapterConfig) {
    console.log('Chapter 2: Init - Chinese Jack-Up Barges');

    // ============================================================================
    // CUSTOMIZATION - COLORS
    // ============================================================================

    const COLORS = {
        AOI_BORDER: '#ffaa00',              // Orange for Area of Interest border
        COURSE_LINE: '#E8A0A0',             // Pastel red for assessed course
        COURSE_GLOW: '#D88888',             // Pastel red glow
        IMG_RED_GLOW: 'rgba(255, 80, 80, 0.4)',      // Red glow for images
        IMG_WHITE_GLOW: 'rgba(255, 255, 255, 0.5)', // White glow for wide image
        BRIDGE_COLOR: '#ffffff',            // White for Bailey Bridge
        BRIDGE_GLOW: 'rgba(255, 255, 255, 0.6)',    // White glow for bridge
    };

    // ============================================================================
    // CUSTOMIZATION - SVG MARKER CONFIG
    // ============================================================================

    const CONFIG = {
        SVG_UNATTRIBUTED: 'assets/svg/unattributed.svg',
        MARKER_SIZE: 36,                    // Slightly smaller marker size
        RING_SIZE: 50,                      // Pulsing ring size
    };

    // ============================================================================
    // CUSTOMIZATION - AOI 1 (Guangzhou Shipyard - Main Scroll)
    // Three jack-up barges detected at shipyard
    // ============================================================================

    const AOI1 = {
        // Center point for popup positioning
        CENTER: [113.645, 22.705],

        // Three unattributed detection markers - one for each barge
        DETECTIONS: [
            { lng: 113.6455, lat: 22.7095, heading: 45 },   // Barge 1 - NE heading
            { lng: 113.6419, lat: 22.7042, heading: 90 },   // Barge 2 - E heading
            { lng: 113.6490, lat: 22.7020, heading: 135 },  // Barge 3 - SE heading
        ],

        // Image popup settings
        IMAGES: [
            'images/chapter2/chapter2A.png',
            'images/chapter2/chapter2B.png'
        ],
        IMG_WIDTH: 220,
        IMG_HEIGHT: 220,
        IMG_GAP: 12,
        IMG_OFFSET_X: 200,
        IMG_OFFSET_Y: -140,
    };

    // ============================================================================
    // CUSTOMIZATION - AOI 2 (Nansan Island Beach - H1 Scroll)
    // Three barges with Bailey Bridge connecting them
    // ============================================================================

    const AOI2 = {
        // Center point for popup positioning
        CENTER: [110.60, 21.13],

        // Three barge positions (forming the artificial dock)
        BARGES: [
            { lng: 110.6037, lat: 21.1307 },  // Barge 1 (westernmost)
            { lng: 110.6119, lat: 21.1283 },  // Barge 2 (middle)
            { lng: 110.6200, lat: 21.1255 },  // Barge 3 (easternmost)
        ],

        // Individual satellite images for each barge
        BARGE_IMAGES: [
            { src: 'images/chapter2/chapter2C.png', offset: [-280, 230] },
            { src: 'images/chapter2/chapter2D.png', offset: [-240, 230] },
            { src: 'images/chapter2/chapter2E.png', offset: [-200, 230] },
        ],
        BARGE_IMG_SIZE: 150,

        // SAR image (wide) - positioned at center
        SAR_IMG: 'images/chapter2/chapter2F.png',
        SAR_WIDTH: 360,
        SAR_HEIGHT: 260,
        SAR_OFFSET: [-300, 10],
    };

    // ============================================================================
    // CUSTOMIZATION - ANIMATION
    // ============================================================================

    const ANIM = {
        COURSE_DURATION: 1500,          // Path animation speed (ms)
        MARKER_DELAY: 800,              // Delay before showing markers after line completes
        BRIDGE_DELAY: 400,              // Delay before showing bridge after markers
        AOI_DASH: [8, 4],               // AOI border dash pattern
        COURSE_DASH: [4, 6],            // Course line dash pattern (dotted)
    };

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    const SRC_AOI1 = 'ch2-aoi1-src';
    const SRC_AOI2 = 'ch2-aoi2-src';
    const SRC_COURSE = 'ch2-course-src';
    const SRC_BRIDGE = 'ch2-bridge-src';
    const LYR_AOI1 = 'ch2-aoi1-line';
    const LYR_AOI2 = 'ch2-aoi2-line';
    const LYR_COURSE = 'ch2-course-line';
    const LYR_COURSE_GLOW = 'ch2-course-glow';
    const LYR_BRIDGE = 'ch2-bridge-line';
    const LYR_BRIDGE_GLOW = 'ch2-bridge-glow';

    let geojsonData = null;
    let courseCoords = null;
    let animId = null;
    let progress = 0;
    let total = 0;
    let startT = null;
    let running = false;
    let dataLoaded = false;

    let aoi1Markers = [];
    let aoi2Markers = [];
    let mainPopup = null;
    let bargePopups = [];    // Individual popups for each barge image
    let sarPopup = null;     // SAR image popup

    // ============================================================================
    // INJECT STYLES
    // ============================================================================

    function injectStyles() {
        if (document.getElementById('ch2-css')) return;

        const css = document.createElement('style');
        css.id = 'ch2-css';
        css.textContent = `
            /* === SVG MARKER CONTAINER === */
            .ch2-svg-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
            }
            .ch2-svg-marker:hover {
                transform: scale(1.15);
            }
            .ch2-svg-marker img {
                width: ${CONFIG.MARKER_SIZE}px;
                height: auto;
                filter: drop-shadow(0 0 8px rgba(255, 80, 80, 0.7))
                        drop-shadow(0 0 15px rgba(255, 80, 80, 0.4));
                animation: ch2-glow-pulse 2s ease-in-out infinite;
            }

            @keyframes ch2-glow-pulse {
                0%, 100% {
                    filter: drop-shadow(0 0 8px rgba(255, 80, 80, 0.7))
                            drop-shadow(0 0 15px rgba(255, 80, 80, 0.4));
                }
                50% {
                    filter: drop-shadow(0 0 12px rgba(255, 80, 80, 0.9))
                            drop-shadow(0 0 25px rgba(255, 80, 80, 0.6));
                }
            }

            /* === PULSING RING === */
            .ch2-marker-ring {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: ${CONFIG.RING_SIZE}px;
                height: ${CONFIG.RING_SIZE}px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255, 80, 80, 0.4) 0%, rgba(255, 80, 80, 0) 70%);
                animation: ch2-ring-pulse 2s ease-out infinite;
                pointer-events: none;
            }

            @keyframes ch2-ring-pulse {
                0% {
                    transform: translate(-50%, -50%) scale(0.5);
                    opacity: 0.8;
                }
                100% {
                    transform: translate(-50%, -50%) scale(2);
                    opacity: 0;
                }
            }

            /* === WHITE + RED TINT GLOW MARKER (for barge markers in dock formation) === */
            .ch2-svg-marker-white img {
                filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.9))
                        drop-shadow(0 0 20px rgba(255, 255, 255, 0.6))
                        drop-shadow(0 0 30px rgba(255, 255, 255, 0.4))
                        drop-shadow(0 0 40px rgba(255, 100, 100, 0.3)) !important;
                animation: ch2-glow-pulse-white 2s ease-in-out infinite !important;
            }

            @keyframes ch2-glow-pulse-white {
                0%, 100% {
                    filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.9))
                            drop-shadow(0 0 20px rgba(255, 255, 255, 0.6))
                            drop-shadow(0 0 30px rgba(255, 255, 255, 0.4))
                            drop-shadow(0 0 40px rgba(255, 100, 100, 0.3));
                }
                50% {
                    filter: drop-shadow(0 0 18px rgba(255, 255, 255, 1))
                            drop-shadow(0 0 30px rgba(255, 255, 255, 0.8))
                            drop-shadow(0 0 45px rgba(255, 255, 255, 0.5))
                            drop-shadow(0 0 55px rgba(255, 100, 100, 0.45));
                }
            }

            .ch2-svg-marker-white .ch2-marker-ring {
                background: radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, rgba(255, 120, 120, 0.2) 50%, rgba(255, 255, 255, 0) 70%) !important;
                animation: ch2-ring-pulse-white 1.8s ease-out infinite !important;
            }

            @keyframes ch2-ring-pulse-white {
                0% {
                    transform: translate(-50%, -50%) scale(0.5);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(2.5);
                    opacity: 0;
                }
            }

            /* === POPUP === */
            .ch2-pop .mapboxgl-popup-tip { display: none !important; }
            .ch2-pop .mapboxgl-popup-content {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
            }

            /* === MAIN GALLERY (2 vertical) - RED GLOW === */
            .ch2-main-gal {
                display: flex;
                flex-direction: column;
                gap: ${AOI1.IMG_GAP}px;
            }
            .ch2-main-gal img {
                display: block;
                width: ${AOI1.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                background: transparent !important;
                box-shadow: 0 0 25px ${COLORS.IMG_RED_GLOW},
                            0 0 50px rgba(255, 80, 80, 0.2);
            }

            /* === H1 SCROLL - BARGE IMAGES ROW (same size as main scroll) === */
            .ch2-barge-row {
                display: flex;
                flex-direction: row;
                gap: 12px;
                align-items: center;
            }

            .ch2-barge-img-holder {
                display: inline-block;
                padding: 0 !important;
                border-radius: 10px;
                background: transparent !important;
                border: none !important;
                box-shadow: 0 0 25px ${COLORS.IMG_RED_GLOW},
                            0 0 50px rgba(255, 80, 80, 0.2);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }

            .ch2-barge-img-holder:hover {
                transform: scale(1.05);
                box-shadow: 0 0 35px ${COLORS.IMG_RED_GLOW},
                            0 0 60px rgba(255, 80, 80, 0.3);
            }

            .ch2-barge-img {
                display: block;
                width: ${AOI1.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                background: transparent !important;
                box-shadow: none !important;
            }

            /* SAR image - WHITE GLOW with red tint */
            .ch2-sar-holder {
                display: inline-block;
                padding: 0 !important;
                border-radius: 10px;
                background: transparent !important;
                border: none !important;
                box-shadow: 0 0 25px ${COLORS.IMG_WHITE_GLOW},
                            0 0 50px rgba(255, 255, 255, 0.2),
                            0 0 60px rgba(255, 100, 100, 0.15);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }

            .ch2-sar-holder:hover {
                transform: scale(1.03);
                box-shadow: 0 0 35px ${COLORS.IMG_WHITE_GLOW},
                            0 0 60px rgba(255, 255, 255, 0.3),
                            0 0 80px rgba(255, 100, 100, 0.2);
            }

            .ch2-sar-img {
                display: block;
                width: ${AOI2.SAR_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                background: transparent !important;
                box-shadow: none !important;
            }

            /* === RESPONSIVE === */
            @media (max-width: 1024px) {
                .ch2-svg-marker img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.85)}px;
                }
                .ch2-marker-ring {
                    width: ${Math.round(CONFIG.RING_SIZE * 0.85)}px;
                    height: ${Math.round(CONFIG.RING_SIZE * 0.85)}px;
                }
                .ch2-main-gal img {
                    width: ${Math.round(AOI1.IMG_WIDTH * 0.85)}px;
                }
                .ch2-barge-img {
                    width: ${Math.round(AOI1.IMG_WIDTH * 0.85)}px;
                }
                .ch2-sar-img {
                    width: ${Math.round(AOI2.SAR_WIDTH * 0.8)}px;
                }
            }

            @media (max-width: 768px) {
                .ch2-svg-marker img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.75)}px;
                }
                .ch2-marker-ring {
                    width: ${Math.round(CONFIG.RING_SIZE * 0.75)}px;
                    height: ${Math.round(CONFIG.RING_SIZE * 0.75)}px;
                }
                .ch2-main-gal img {
                    width: ${Math.round(AOI1.IMG_WIDTH * 0.7)}px;
                }
                .ch2-barge-row {
                    gap: 8px;
                }
                .ch2-barge-img {
                    width: ${Math.round(AOI1.IMG_WIDTH * 0.7)}px;
                }
                .ch2-sar-img {
                    width: ${Math.round(AOI2.SAR_WIDTH * 0.65)}px;
                }
            }

            @media (max-width: 480px) {
                .ch2-svg-marker img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.65)}px;
                }
                .ch2-marker-ring {
                    width: ${Math.round(CONFIG.RING_SIZE * 0.65)}px;
                    height: ${Math.round(CONFIG.RING_SIZE * 0.65)}px;
                }
                .ch2-main-gal {
                    flex-direction: row;
                    gap: 8px;
                }
                .ch2-main-gal img {
                    width: ${Math.round(AOI1.IMG_WIDTH * 0.5)}px;
                }
                .ch2-barge-row {
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 6px;
                }
                .ch2-barge-img {
                    width: ${Math.round(AOI1.IMG_WIDTH * 0.5)}px;
                }
                .ch2-sar-img {
                    width: ${Math.round(AOI2.SAR_WIDTH * 0.5)}px;
                }
            }
        `;
        document.head.appendChild(css);
    }

    // ============================================================================
    // HELPERS
    // ============================================================================

    function clearLayers() {
        [LYR_BRIDGE_GLOW, LYR_BRIDGE, LYR_COURSE_GLOW, LYR_COURSE, LYR_AOI1, LYR_AOI2].forEach(id => {
            try { if (map.getLayer(id)) map.removeLayer(id); } catch(e) {}
        });
        [SRC_BRIDGE, SRC_COURSE, SRC_AOI1, SRC_AOI2].forEach(id => {
            try { if (map.getSource(id)) map.removeSource(id); } catch(e) {}
        });
    }

    function clearMarkers() {
        aoi1Markers.forEach(m => { try { m.remove(); } catch(e) {} });
        aoi1Markers = [];
        aoi2Markers.forEach(m => { try { m.remove(); } catch(e) {} });
        aoi2Markers = [];
        if (mainPopup) { try { mainPopup.remove(); } catch(e) {} mainPopup = null; }
        // Clear individual barge popups
        bargePopups.forEach(p => { try { p.remove(); } catch(e) {} });
        bargePopups = [];
        if (sarPopup) { try { sarPopup.remove(); } catch(e) {} sarPopup = null; }
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

    // ============================================================================
    // LOAD DATA
    // ============================================================================

    async function loadData() {
        if (dataLoaded && geojsonData) return true;

        try {
            const res = await fetch(chapterConfig?.dataFile || 'data/chapter2-barges.geojson');
            geojsonData = await res.json();

            const courseFeat = geojsonData.features.find(f => f.properties.type === 'assessed-course');
            if (courseFeat) {
                courseCoords = courseFeat.geometry.coordinates;
                total = courseCoords.length;
            }

            dataLoaded = true;
            console.log(`  Ch2 data loaded, ${total} course points`);
            return true;
        } catch(e) {
            console.error('Ch2 Load error:', e);
            return false;
        }
    }

    // ============================================================================
    // CREATE SVG MARKER WITH PULSING RING
    // ============================================================================

    function createSVGMarker(lng, lat, heading = 0, isWhiteGlow = false) {
        const el = document.createElement('div');
        el.className = isWhiteGlow ? 'ch2-svg-marker ch2-svg-marker-white' : 'ch2-svg-marker';
        el.innerHTML = `
            <div class="ch2-marker-ring"></div>
            <img src="${CONFIG.SVG_UNATTRIBUTED}" alt="Detection" style="transform: rotate(${heading}deg);">
        `;
        return new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat([lng, lat]).addTo(map);
    }

    // ============================================================================
    // ADD AOI LAYER
    // ============================================================================

    function addAOILayer(sourceId, layerId, polygonCoords) {
        if (map.getSource(sourceId)) {
            try { map.removeLayer(layerId); } catch(e) {}
            try { map.removeSource(sourceId); } catch(e) {}
        }

        map.addSource(sourceId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: polygonCoords }
            }
        });

        map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            paint: {
                'line-color': COLORS.AOI_BORDER,
                'line-width': 2,
                'line-opacity': 0.9,
                'line-dasharray': ANIM.AOI_DASH
            }
        });
    }

    // ============================================================================
    // ADD BAILEY BRIDGE LAYER
    // Connects three barges with glowing white line
    // ============================================================================

    function addBaileyBridge() {
        console.log('  -> Adding Bailey Bridge');

        // Create LineString connecting all three barges, extended beyond edges
        const barges = AOI2.BARGES;
        const first = barges[0];
        const second = barges[1];
        const secondLast = barges[barges.length - 2];
        const last = barges[barges.length - 1];
        const ext = 0.008;
        const startExt = [first.lng - (second.lng - first.lng) / Math.hypot(second.lng - first.lng, second.lat - first.lat) * ext,
                          first.lat - (second.lat - first.lat) / Math.hypot(second.lng - first.lng, second.lat - first.lat) * ext];
        const endExt = [last.lng + (last.lng - secondLast.lng) / Math.hypot(last.lng - secondLast.lng, last.lat - secondLast.lat) * ext,
                        last.lat + (last.lat - secondLast.lat) / Math.hypot(last.lng - secondLast.lng, last.lat - secondLast.lat) * ext];
        const bridgeCoords = [startExt, ...barges.map(b => [b.lng, b.lat]), endExt];

        // Remove existing bridge layers if present
        try { if (map.getLayer(LYR_BRIDGE_GLOW)) map.removeLayer(LYR_BRIDGE_GLOW); } catch(e) {}
        try { if (map.getLayer(LYR_BRIDGE)) map.removeLayer(LYR_BRIDGE); } catch(e) {}
        try { if (map.getSource(SRC_BRIDGE)) map.removeSource(SRC_BRIDGE); } catch(e) {}

        // Add bridge source
        map.addSource(SRC_BRIDGE, {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: { name: 'Bailey Bridge' },
                geometry: { type: 'LineString', coordinates: bridgeCoords }
            }
        });

        // Outer glow
        map.addLayer({
            id: LYR_BRIDGE_GLOW,
            type: 'line',
            source: SRC_BRIDGE,
            paint: {
                'line-color': COLORS.BRIDGE_COLOR,
                'line-width': 12,
                'line-opacity': 0.35,
                'line-blur': 4
            }
        });

        // Main bridge line - thin white
        map.addLayer({
            id: LYR_BRIDGE,
            type: 'line',
            source: SRC_BRIDGE,
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
            },
            paint: {
                'line-color': COLORS.BRIDGE_COLOR,
                'line-width': 3,
                'line-opacity': 1
            }
        });

        console.log('  Bailey Bridge added');
    }

    // ============================================================================
    // SHOW AOI1 - MAIN CHAPTER (Main Scroll)
    // Three barges at Guangzhou Shipyard
    // ============================================================================

    async function showAOI1() {
        console.log('  -> showAOI1 (Main Scroll - Guangzhou Shipyard)');
        clearAll();

        await loadData();
        injectStyles();

        // Add AOI1 polygon
        const aoi1Feat = geojsonData?.features?.find(f => f.id === 'aoi-1');
        if (aoi1Feat) {
            addAOILayer(SRC_AOI1, LYR_AOI1, aoi1Feat.geometry.coordinates);
        }

        // Create 3 SVG markers with pulsing rings - one for each barge
        // Each with different heading to show different vessel orientations
        AOI1.DETECTIONS.forEach(det => {
            const marker = createSVGMarker(det.lng, det.lat, det.heading);
            aoi1Markers.push(marker);
        });

        // Create image popup with RED GLOW
        const imgsHtml = AOI1.IMAGES.map(src =>
            `<img src="${src}" onerror="this.style.background='linear-gradient(135deg, #0a1628 0%, #1a2844 100%)'">`
        ).join('');

        mainPopup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch2-pop',
            offset: [AOI1.IMG_OFFSET_X, AOI1.IMG_OFFSET_Y]
        })
            .setLngLat(AOI1.CENTER)
            .setHTML(`<div class="ch2-main-gal">${imgsHtml}</div>`)
            .addTo(map);

        console.log('  AOI1 displayed with 3 barge markers');
    }

    // ============================================================================
    // SHOW COURSE - H1 SCROLL (Nansan Island Beach)
    // Sequence: 1) Line animation -> 2) Plot barge markers -> 3) Add bridge -> 4) Show gallery
    // ============================================================================

    async function showCourse() {
        console.log('  -> showCourse (H1 Scroll - Nansan Island Beach)');
        clearAll();

        await loadData();
        injectStyles();

        if (!courseCoords || !courseCoords.length) {
            console.error('  No course coords');
            return;
        }

        // Add AOI2 polygon
        const aoi2Feat = geojsonData?.features?.find(f => f.id === 'aoi-2');
        if (aoi2Feat) {
            addAOILayer(SRC_AOI2, LYR_AOI2, aoi2Feat.geometry.coordinates);
        }

        // Add course source for animation
        map.addSource(SRC_COURSE, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: [courseCoords[0]] }
            }
        });

        // Glow layer - pastel red
        map.addLayer({
            id: LYR_COURSE_GLOW,
            type: 'line',
            source: SRC_COURSE,
            paint: {
                'line-color': COLORS.COURSE_GLOW,
                'line-width': 10,
                'line-opacity': 0.3,
                'line-blur': 5
            }
        });

        // Main dotted line - pastel red
        map.addLayer({
            id: LYR_COURSE,
            type: 'line',
            source: SRC_COURSE,
            paint: {
                'line-color': COLORS.COURSE_LINE,
                'line-width': 3,
                'line-opacity': 0.9,
                'line-dasharray': ANIM.COURSE_DASH
            }
        });

        // Start line animation
        progress = 0;
        running = true;
        startT = performance.now();
        animateCourse();

        console.log('  Course animation started');
    }

    // ============================================================================
    // COURSE ANIMATION - then trigger markers, bridge, and gallery
    // ============================================================================

    function animateCourse() {
        if (!running || !courseCoords) return;

        const elapsed = performance.now() - startT;
        const pct = Math.min(elapsed / ANIM.COURSE_DURATION, 1);
        const idx = Math.floor(pct * (total - 1));

        if (idx > progress) {
            progress = idx;

            const src = map.getSource(SRC_COURSE);
            if (src) {
                src.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: courseCoords.slice(0, progress + 1) }
                });
            }
        }

        if (pct < 1) {
            animId = requestAnimationFrame(animateCourse);
        } else {
            // Line animation complete - show full line
            const src = map.getSource(SRC_COURSE);
            if (src) {
                src.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: courseCoords }
                });
            }
            running = false;
            console.log('  Course line complete');

            // After delay, show markers
            setTimeout(() => {
                showBargeMarkersAndBridge();
            }, ANIM.MARKER_DELAY);
        }
    }

    // ============================================================================
    // SHOW BARGE MARKERS, BAILEY BRIDGE, AND IMAGES
    // ============================================================================

    function showBargeMarkersAndBridge() {
        console.log('  -> Showing barge markers and Bailey Bridge');

        // Create 3 barge markers with WHITE glow (dock formation)
        // SVG points right (3 o'clock), 10 o'clock = -150° CSS rotation
        AOI2.BARGES.forEach((barge, index) => {
            setTimeout(() => {
                const marker = createSVGMarker(barge.lng, barge.lat, -150, true);
                aoi2Markers.push(marker);
            }, index * 200);
        });

        // Add Bailey Bridge after markers appear
        setTimeout(() => {
            addBaileyBridge();
            
            // Show all 3 barge images in one horizontal row popup
            setTimeout(() => {
                showBargeImagesRow();
            }, 300);

            // Show SAR image after barge images
            setTimeout(() => {
                showSARImage();
            }, 500);
        }, ANIM.BRIDGE_DELAY + 600);
    }

    // ============================================================================
    // SHOW BARGE IMAGES IN ONE HORIZONTAL ROW
    // ============================================================================

    function showBargeImagesRow() {
        console.log('  -> Showing barge images row');

        // Build HTML for all 3 images in a row
        const imagesHtml = AOI2.BARGE_IMAGES.map(img => `
            <div class="ch2-barge-img-holder">
                <img class="ch2-barge-img" 
                     src="${img.src}"
                     onerror="this.parentElement.style.display='none';">
            </div>
        `).join('');

        const bargeRowPopup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch2-pop',
            offset: [-420, 330]  // Below and left of markers/bridge
        })
            .setLngLat(AOI2.CENTER)
            .setHTML(`<div class="ch2-barge-row">${imagesHtml}</div>`)
            .addTo(map);

        bargePopups.push(bargeRowPopup);
        console.log('  Barge images row displayed');
    }

    // ============================================================================
    // SHOW SAR IMAGE (separate from barge images)
    // ============================================================================

    function showSARImage() {
        console.log('  -> Showing SAR image');

        sarPopup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch2-pop',
            offset: AOI2.SAR_OFFSET
        })
            .setLngLat(AOI2.CENTER)
            .setHTML(`
                <div class="ch2-sar-holder">
                    <img class="ch2-sar-img" 
                         src="${AOI2.SAR_IMG}"
                         onerror="this.style.background='linear-gradient(135deg, #0a1628 0%, #1a2844 100%)'">
                </div>
            `)
            .addTo(map);

        console.log('  SAR image displayed');
    }

    // ============================================================================
    // CLEANUP
    // ============================================================================

    function cleanup() {
        console.log('  Ch2 cleanup');
        clearAll();
    }

    // ============================================================================
    // INIT
    // ============================================================================

    injectStyles();

    // ============================================================================
    // RETURN CONTROLLER
    // ============================================================================

    return {
        stop: cleanup,
        showAOI1,
        showMain: showAOI1,
        showCourse,
        pause: stopAnim,
        resume: () => {
            if (courseCoords && !running && progress < total - 1) {
                running = true;
                startT = performance.now() - (progress / total) * ANIM.COURSE_DURATION;
                animateCourse();
            }
        },
        getProgress: () => total ? progress / total : 0,
        isComplete: () => progress >= total - 1
    };
}

window.animateChapter2 = animateChapter2;
