// ============================================================================
// CHAPTER 12 ANIMATION - SKIPPER: Venezuelan Oil Smuggling & US Seizure
// Single scroll sequential animation
// Timeline: 14 Nov - 11 Dec 2025
// - 14-18 Nov: SKIPPER loading at Jose Terminal (AIS spoofed since Atlantic)
// - 19 Nov - 04 Dec: Anchored near Jose Terminal
// - 07 Dec: STS with NEPTUNE 6 (IMO: 9198666) ~20km south of Curaçao
// - 08 Dec: SKIPPER (AIS dark) heading east
// - 10 Dec: Interdicted and seized by United States
// - 11 Dec: Post-seizure AIS transmitting ~45km SE of Grenada, heading NE
// ============================================================================

function animateChapter12(map, chapterConfig) {
    console.log('Chapter 12: Init - SKIPPER');

    // ============================================================================
    // CUSTOMIZATION OPTIONS
    // ============================================================================

    const CONFIG = {
        // --- COLORS ---
        SKIPPER_COLOR: '#00ff88',         // Green for SKIPPER AIS track
        ASSESSED_COLOR: '#00ff88',        // Green for assessed path (dotted)

        // --- ANIMATION TIMING (faster) ---
        ASSESSED_SEGMENT_DURATION: 800,   // Time for each dotted segment (ms)
        AIS_ANIMATION_DURATION: 2500,     // SKIPPER AIS track animation (ms)
        MARKER_FADE_DELAY: 100,           // Delay for marker fade-in
        PHASE_DELAY: 600,                 // Delay between phases

        // --- SVG MARKER SIZE ---
        MARKER_SIZE: 40,

        // --- CAMERA ---
        CAMERA: { center: [-65, 12], zoom: 4 },

        // --- DETECTION POINTS (in sequence order) ---

        // Detection 1: Jose Terminal loading - 14-18 Nov 2025
        DET_1: [-64.8279, 10.1396],
        DET_1_IMAGE: 'images/chapter12/chapter12A.png',
        DET_1_OFFSET: [0,260],  // Left side to avoid overlap with Detection 2
        DET_1_LABEL: '14 Nov 2025 15:31 UTC',
        DET_1_SUBLABEL: 'SKIPPER loading at Jose Terminal, Venezuela',

        // Detection 2: Anchored near Jose - 19 Nov - 04 Dec 2025
        DET_2: [-64.8038, 10.2158],
        DET_2_IMAGE: 'images/chapter12/chapter12B.png',
        DET_2_OFFSET: [240, 255],
        DET_2_LABEL: '27 Nov 2025 15:17 UTC',
        DET_2_SUBLABEL: 'SKIPPER anchored near Jose Terminal',

        // Detection 3: STS with NEPTUNE 6 - 07 Dec 2025 (~20km south of Curaçao)
        DET_3: [-68.8317, 11.8333],
        DET_3_IMAGE: 'images/chapter12/chapter12C.png',
        DET_3_OFFSET: [0, 250],
        DET_3_LABEL: '07 Dec 2025 15:09-22:50 UTC',
        DET_3_SUBLABEL: 'STS with NEPTUNE 6 (IMO: 9198666) south of Curaçao',

        // Detection 4: Heading east from STS - 08 Dec 2025 (AIS dark)
        DET_4: [-68.1134, 11.4955],
        DET_4_IMAGE: 'images/chapter12/chapter12D.png',
        DET_4_OFFSET: [100, -70],
        DET_4_LABEL: '08 Dec 2025 15:31 UTC',
        DET_4_SUBLABEL: 'SKIPPER (AIS dark) heading east from STS',

        // SKIPPER AIS Start point (for spoofing marker)
        SKIPPER_AIS_START: [-56.906667, 7.818333],

        // --- IMAGE PLACEHOLDER SETTINGS ---
        IMG_WIDTH: 220,
        IMG_HEIGHT: 140,
    };

    // ============================================================================
    // STATE
    // ============================================================================

    // Sources and layers
    const SOURCE_ASSESSED = 'ch12-assessed-src';
    const LAYER_ASSESSED = 'ch12-assessed-line';

    const SOURCE_SKIPPER = 'ch12-skipper-src';
    const LAYER_SKIPPER = 'ch12-skipper-line';
    const LAYER_SKIPPER_GLOW = 'ch12-skipper-glow';

    // Data
    let skipperCoords = null;

    // Animation state
    let animId = null;
    let running = false;
    let startT = null;
    let currentPhase = 0;  // 0-6 phases

    // Markers and popups
    let markers = [];
    let popups = [];
    let numberMarkers = [];

    // Track all pending timeouts for cleanup during fast scrolling
    let pendingTimeouts = [];

    // ============================================================================
    // INJECT STYLES
    // ============================================================================

    if (!document.getElementById('ch12-css')) {
        const css = document.createElement('style');
        css.id = 'ch12-css';
        css.textContent = `
            /* === SVG MARKER BASE === */
            .ch12-svg-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
                opacity: 0;
            }
            .ch12-svg-marker.visible {
                opacity: 1;
            }
            .ch12-svg-marker:hover {
                transform: scale(1.15);
            }
            .ch12-svg-marker img {
                width: ${CONFIG.MARKER_SIZE}px;
                height: auto;
                filter: drop-shadow(0 0 8px rgba(0,0,0,0.6));
            }

            /* === DARK DETECTION MARKER (Red Glow + Pulse) === */
            .ch12-dark-marker img {
                animation: ch12-glow-red 2s ease-in-out infinite;
            }
            
            @keyframes ch12-glow-red {
                0%, 100% { 
                    filter: drop-shadow(0 0 10px rgba(227, 66, 66, 0.8))
                            drop-shadow(0 0 18px rgba(227, 66, 66, 0.5)); 
                }
                50% { 
                    filter: drop-shadow(0 0 15px rgba(227, 66, 66, 1))
                            drop-shadow(0 0 28px rgba(227, 66, 66, 0.7)); 
                }
            }

            /* === LIGHT-DARK STS MARKER (Cyan Glow + Pulse) === */
            .ch12-sts-marker img {
                animation: ch12-glow-cyan 2s ease-in-out infinite;
            }
            
            @keyframes ch12-glow-cyan {
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

            /* === SPOOFING MARKER (Purple Glow + Pulse) === */
            .ch12-spoof-marker img {
                animation: ch12-glow-purple 2s ease-in-out infinite;
            }
            
            @keyframes ch12-glow-purple {
                0%, 100% { 
                    filter: drop-shadow(0 0 12px rgba(168, 85, 247, 0.9))
                            drop-shadow(0 0 20px rgba(168, 85, 247, 0.6))
                            drop-shadow(0 0 30px rgba(168, 85, 247, 0.4)); 
                }
                50% { 
                    filter: drop-shadow(0 0 18px rgba(168, 85, 247, 1))
                            drop-shadow(0 0 30px rgba(168, 85, 247, 0.8))
                            drop-shadow(0 0 45px rgba(168, 85, 247, 0.5)); 
                }
            }

            /* === NUMBER MARKERS === */
            .ch12-number-marker {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: rgba(17, 19, 38, 0.95);
                border: 2px solid #00ff88;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                font-weight: 700;
                color: #00ff88;
                box-shadow: 0 0 12px rgba(0, 255, 136, 0.4);
                opacity: 0;
                transition: opacity 0.4s ease, transform 0.3s ease;
            }
            .ch12-number-marker.visible {
                opacity: 1;
            }
            .ch12-number-marker:hover {
                transform: scale(1.1);
            }

            /* === POPUP BASE === */
            .ch12-pop .mapboxgl-popup-tip { display: none !important; }
            .ch12-pop .mapboxgl-popup-content {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
                outline: none !important;
            }

            /* === SATELLITE IMAGES (Direct - No Container) === */
            .ch12-sat-img {
                display: block;
                max-width: ${CONFIG.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
            }

            /* Red glow for dark detection */
            .ch12-sat-img.red {
                box-shadow:
                    0 0 25px rgba(227, 66, 66, 0.35),
                    0 0 50px rgba(227, 66, 66, 0.15);
            }

            /* Cyan glow for light-dark STS */
            .ch12-sat-img.cyan {
                box-shadow:
                    0 0 25px rgba(0, 163, 227, 0.35),
                    0 0 50px rgba(0, 163, 227, 0.15);
            }

            /* === IMAGE PLACEHOLDER (shown while loading) === */
            .ch12-img-placeholder {
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

            .ch12-img-placeholder.visible {
                opacity: 1;
            }

            /* Dark Detection - Red placeholder */
            .ch12-img-placeholder.red {
                background: rgba(227, 66, 66, 0.15);
                border: 2px solid rgba(227, 66, 66, 0.6);
                color: rgba(227, 66, 66, 0.9);
                box-shadow: 0 0 20px rgba(227, 66, 66, 0.3);
            }

            /* Light-Dark STS - Cyan placeholder */
            .ch12-img-placeholder.cyan {
                background: rgba(0, 163, 227, 0.15);
                border: 2px solid rgba(0, 163, 227, 0.6);
                color: rgba(0, 163, 227, 0.9);
                box-shadow: 0 0 20px rgba(0, 163, 227, 0.3);
            }

            .ch12-popup-label {
                font-size: 11px;
                font-weight: 600;
                margin-bottom: 2px;
            }

            .ch12-popup-sublabel {
                font-size: 8px;
                opacity: 0.7;
                text-align: center;
                max-width: 180px;
            }

            /* === LEGEND === */
            .ch12-legend {
                position: absolute;
                bottom: 30px;
                left: 30px;
                background: rgba(17, 19, 38, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 8px;
                padding: 16px 20px;
                font-family: 'Inter', sans-serif;
                z-index: 100;
                border: 1px solid rgba(255,255,255,0.1);
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.5s ease, transform 0.5s ease;
                min-width: 260px;
            }

            .ch12-legend.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .ch12-legend-title {
                font-size: 10px;
                font-weight: 700;
                color: #00ff88;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 14px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .ch12-legend-item {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 10px;
                font-size: 13px;
                color: rgba(255,255,255,0.95);
            }

            .ch12-legend-item:last-child {
                margin-bottom: 0;
            }

            .ch12-legend-item .legend-text {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .ch12-legend-item .legend-main {
                font-weight: 500;
            }

            .ch12-legend-item .legend-sub {
                font-size: 10px;
                color: rgba(255,255,255,0.5);
            }

            .ch12-legend-line {
                width: 28px;
                height: 3px;
                border-radius: 2px;
                flex-shrink: 0;
            }

            .ch12-legend-line.solid-green {
                background: ${CONFIG.SKIPPER_COLOR};
            }

            .ch12-legend-line.dashed-green {
                background: repeating-linear-gradient(
                    90deg,
                    ${CONFIG.ASSESSED_COLOR} 0px,
                    ${CONFIG.ASSESSED_COLOR} 3px,
                    transparent 3px,
                    transparent 6px
                );
                height: 3px;
            }

            .ch12-legend-icon {
                width: 22px;
                height: 22px;
                flex-shrink: 0;
            }

            .ch12-legend-icon img {
                width: 100%;
                height: auto;
            }

            /* === VESSEL INFO PANEL === */
            .ch12-vessel-latest {
                position: absolute;
                top: 100px;
                right: 30px;
                background: rgba(17, 19, 38, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 8px;
                padding: 12px 16px;
                font-family: 'Inter', sans-serif;
                z-index: 100;
                border: 1px solid rgba(0, 255, 136, 0.3);
                opacity: 0;
                transform: translateX(20px);
                transition: opacity 0.5s ease, transform 0.5s ease;
            }

            .ch12-vessel-latest.visible {
                opacity: 1;
                transform: translateX(0);
            }

            .ch12-vessel-latest-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }

            .ch12-vessel-latest-icon {
                width: 12px;
                height: 12px;
                background: #00ff88;
                border-radius: 2px;
            }

            .ch12-vessel-latest-title {
                font-size: 11px;
                font-weight: 600;
                color: rgba(255,255,255,0.6);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .ch12-vessel-latest-content {
                font-size: 12px;
                color: rgba(255,255,255,0.9);
            }

            .ch12-vessel-latest-sub {
                font-size: 10px;
                color: rgba(255,255,255,0.5);
                margin-top: 4px;
            }

            /* === RESPONSIVE - TABLET === */
            @media (max-width: 1024px) {
                .ch12-svg-marker img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.9)}px;
                }
                .ch12-sat-img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.85)}px;
                }
                .ch12-img-placeholder {
                    width: ${Math.round(CONFIG.IMG_WIDTH * 0.85)}px;
                    height: ${Math.round(CONFIG.IMG_HEIGHT * 0.85)}px;
                }
                .ch12-legend {
                    padding: 14px 18px;
                    min-width: 220px;
                }
                .ch12-number-marker {
                    width: 24px;
                    height: 24px;
                    font-size: 12px;
                }
            }

            /* === RESPONSIVE - MOBILE === */
            @media (max-width: 768px) {
                .ch12-svg-marker img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.8)}px;
                }
                .ch12-sat-img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.7)}px;
                }
                .ch12-img-placeholder {
                    width: ${Math.round(CONFIG.IMG_WIDTH * 0.7)}px;
                    height: ${Math.round(CONFIG.IMG_HEIGHT * 0.7)}px;
                }
                .ch12-legend {
                    bottom: 20px;
                    left: 20px;
                    padding: 12px 16px;
                    min-width: 180px;
                }
                .ch12-legend-item {
                    font-size: 11px;
                    gap: 10px;
                }
                .ch12-number-marker {
                    width: 22px;
                    height: 22px;
                    font-size: 11px;
                }
                .ch12-vessel-latest {
                    top: 80px;
                    right: 20px;
                    min-width: 180px;
                }
            }

            /* === RESPONSIVE - SMALL MOBILE === */
            @media (max-width: 480px) {
                .ch12-svg-marker img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.7)}px;
                }
                .ch12-sat-img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.55)}px;
                }
                .ch12-img-placeholder {
                    width: ${Math.round(CONFIG.IMG_WIDTH * 0.55)}px;
                    height: ${Math.round(CONFIG.IMG_HEIGHT * 0.55)}px;
                }
                .ch12-legend {
                    bottom: 15px;
                    left: 15px;
                    padding: 10px 14px;
                    min-width: 150px;
                }
                .ch12-legend-item {
                    font-size: 10px;
                    gap: 8px;
                    margin-bottom: 6px;
                }
                .ch12-legend-line {
                    width: 20px;
                }
                .ch12-legend-icon {
                    width: 18px;
                    height: 18px;
                }
                .ch12-number-marker {
                    width: 20px;
                    height: 20px;
                    font-size: 10px;
                }
                .ch12-vessel-latest {
                    top: 70px;
                    right: 15px;
                    min-width: 150px;
                    padding: 10px 12px;
                }
                .ch12-vessel-latest-title {
                    font-size: 10px;
                }
                .ch12-vessel-latest-content {
                    font-size: 11px;
                }
                .ch12-vessel-latest-sub {
                    font-size: 9px;
                }
            }
        `;
        document.head.appendChild(css);
    }

    // ============================================================================
    // CLEANUP - Comprehensive measures for fast scrolling
    // ============================================================================

    // Clear all pending timeouts (critical for fast scrolling)
    function clearPendingTimeouts() {
        pendingTimeouts.forEach(id => {
            try { clearTimeout(id); } catch(e) {}
        });
        pendingTimeouts = [];
    }

    // Safe setTimeout that tracks for cleanup
    function safeSetTimeout(fn, delay) {
        const id = setTimeout(() => {
            // Remove from tracking array when executed
            pendingTimeouts = pendingTimeouts.filter(t => t !== id);
            fn();
        }, delay);
        pendingTimeouts.push(id);
        return id;
    }

    function stopAnim() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        running = false;
    }

    function clearMarkers() {
        markers.forEach(m => { try { m?.remove(); } catch(e) {} });
        markers = [];

        popups.forEach(p => { try { p?.remove(); } catch(e) {} });
        popups = [];

        numberMarkers.forEach(m => { try { m?.remove(); } catch(e) {} });
        numberMarkers = [];

        const legend = document.querySelector('.ch12-legend');
        if (legend) legend.remove();

        const vesselPanel = document.querySelector('.ch12-vessel-latest');
        if (vesselPanel) vesselPanel.remove();
    }

    function clearLayers() {
        [LAYER_ASSESSED, LAYER_SKIPPER, LAYER_SKIPPER_GLOW].forEach(id => {
            try { if (map.getLayer(id)) map.removeLayer(id); } catch(e) {}
        });
        [SOURCE_ASSESSED, SOURCE_SKIPPER].forEach(id => {
            try { if (map.getSource(id)) map.removeSource(id); } catch(e) {}
        });
    }

    // Comprehensive DOM fallback cleanup - catches any lingering elements
    function domFallbackCleanup() {
        const selectors = [
            '.ch12-svg-marker', '.ch12-dark-marker', '.ch12-light-marker', 
            '.ch12-lightdark-marker', '.ch12-spoof-marker', '.ch12-number-marker',
            '.ch12-img-placeholder', '.ch12-sat-img', '.ch12-pop', 
            '.ch12-legend', '.ch12-vessel-latest'
        ];
        document.querySelectorAll(selectors.join(', ')).forEach(el => {
            try {
                const wrapper = el.closest('.mapboxgl-marker') || el.closest('.mapboxgl-popup');
                if (wrapper) wrapper.remove();
                else el.remove();
            } catch(e) {}
        });

        // Additional safety: remove all mapboxgl markers that have ch12 elements inside
        document.querySelectorAll('.mapboxgl-marker').forEach(marker => {
            if (marker.querySelector('[class*="ch12-"]') || marker.innerHTML.includes('ch12-')) {
                try { marker.remove(); } catch(e) {}
            }
        });

        // Remove any lingering popups with ch12 classes
        document.querySelectorAll('.mapboxgl-popup').forEach(popup => {
            if (popup.querySelector('[class*="ch12-"]') || popup.innerHTML.includes('ch12-')) {
                try { popup.remove(); } catch(e) {}
            }
        });
    }

    function clearAll() {
        console.log('[CH12] clearAll - comprehensive cleanup');
        clearPendingTimeouts();
        stopAnim();
        clearMarkers();
        clearLayers();
        domFallbackCleanup();
        currentPhase = 0;
    }

    // ============================================================================
    // LOAD DATA
    // ============================================================================

    async function loadData() {
        if (!skipperCoords) {
            try {
                const res = await fetch('data/chapter12-skipper.geojson');
                const data = await res.json();
                if (data?.features?.[0]?.geometry?.coordinates) {
                    skipperCoords = data.features[0].geometry.coordinates;
                    console.log(`  Loaded ${skipperCoords.length} SKIPPER coordinates`);
                }
            } catch (e) {
                console.error('Chapter 12 SKIPPER load error:', e);
            }
        }
        return !!skipperCoords;
    }

    // ============================================================================
    // MARKER HELPERS
    // ============================================================================

    function createSvgMarker(svgPath, lngLat, markerClass = '', rotation = 0) {
        const el = document.createElement('div');
        el.className = `ch12-svg-marker ${markerClass}`;
        el.innerHTML = `<img src="${svgPath}" alt="marker" style="transform: rotate(${rotation}deg);">`;
        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat(lngLat)
            .addTo(map);
        markers.push(marker);
        return marker;
    }

    function createNumberMarker(number, lngLat, offset = [0, -35]) {
        const el = document.createElement('div');
        el.className = 'ch12-number-marker';
        el.textContent = number;
        const marker = new mapboxgl.Marker({ element: el, anchor: 'center', offset: offset })
            .setLngLat(lngLat)
            .addTo(map);
        numberMarkers.push(marker);
        return marker;
    }

    function showMarker(marker) {
        if (marker?.getElement) {
            marker.getElement().classList.add('visible');
        }
    }

    function createImagePopup(lngLat, imagePath, colorType, offset, label, sublabel) {
        const uniqueId = `ph-${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
        const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch12-pop',
            offset: offset
        })
            .setLngLat(lngLat)
            .setHTML(`
                <div class="ch12-img-placeholder ${colorType}" id="${uniqueId}">
                    <span class="ch12-popup-label">${label}</span>
                    <span class="ch12-popup-sublabel">${sublabel || 'SAT IMAGE'}</span>
                </div>
                <img class="ch12-sat-img ${colorType}" src="${imagePath}"
                     style="display:none;"
                     onload="this.style.display='block'; this.previousElementSibling.style.display='none';"
                     onerror="this.style.display='none';">
            `)
            .addTo(map);
        popups.push(popup);
        return popup;
    }

    function showPopup(popup) {
        if (popup) {
            const el = popup.getElement();
            if (el) {
                const placeholder = el.querySelector('.ch12-img-placeholder');
                if (placeholder) placeholder.classList.add('visible');
            }
        }
    }

    // ============================================================================
    // CREATE LEGEND
    // ============================================================================

    function createLegend() {
        console.log('Chapter 12: Building legend programmatically');
        const existing = document.querySelector('.ch12-legend');
        if (existing) existing.remove();

        const legend = document.createElement('div');
        legend.className = 'ch12-legend';

        // Add LEGEND title header
        const title = document.createElement('div');
        title.className = 'ch12-legend-title';
        title.textContent = 'LEGEND';
        legend.appendChild(title);

        // Define legend items
        const items = [
            { type: 'line', lineClass: 'solid-green', text: 'SKIPPER AIS Track' },
            { type: 'line', lineClass: 'dashed-green', text: 'SKIPPER Assessed Course' },
            { type: 'icon', icon: 'assets/svg/darkdetection.svg', text: 'Dark Detection' },
            { type: 'icon', icon: 'assets/svg/lightdarkstsdetection.svg', text: 'Light-Dark STS Detection' },
            { type: 'icon', icon: 'assets/svg/spoofing.svg', text: 'AIS Spoofing' }
        ];

        // Build each item
        items.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'ch12-legend-item';

            if (item.type === 'line') {
                div.innerHTML = '<div class="ch12-legend-line ' + item.lineClass + '"></div><span class="legend-main">' + item.text + '</span>';
            } else {
                div.innerHTML = '<div class="ch12-legend-icon"><img src="' + item.icon + '" alt=""></div><span class="legend-main">' + item.text + '</span>';
            }

            legend.appendChild(div);
            console.log('  Added legend item ' + (idx + 1) + ': ' + item.text);
        });

        document.body.appendChild(legend);
        safeSetTimeout(() => legend.classList.add('visible'), 100);
        console.log('Chapter 12: Legend created with ' + items.length + ' items');
    }

    // ============================================================================
    // CREATE VESSEL INFO PANEL
    // ============================================================================

    function createVesselPanel() {
        const existing = document.querySelector('.ch12-vessel-latest');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.className = 'ch12-vessel-latest';

        panel.innerHTML = `
            <div class="ch12-vessel-latest-header">
                <div class="ch12-vessel-latest-icon"></div>
                <span class="ch12-vessel-latest-title">SKIPPER Post-Seizure Position</span>
            </div>
            <div class="ch12-vessel-latest-content">11 Dec 2025 09:30 UTC</div>
            <div class="ch12-vessel-latest-sub">~45km SE of Grenada • Heading NE • Seized by US on 10 Dec</div>
        `;

        document.body.appendChild(panel);
        safeSetTimeout(() => panel.classList.add('visible'), 500);
    }

    // ============================================================================
    // BUILD ASSESSED PATH COORDINATES
    // ============================================================================

    function buildAssessedPath() {
        // From Jose Terminal to STS point to Dark detection to SKIPPER AIS start
        // Route goes through water to avoid land crossings
        const skipperStart = skipperCoords ? skipperCoords[0] : CONFIG.SKIPPER_AIS_START;

        return [
            CONFIG.DET_1,           // Detection 1: Jose Terminal [-64.8279, 10.1396]
            CONFIG.DET_2,           // Detection 2: Anchored [-64.8038, 10.2158]
            // Waypoint: Go north into Caribbean Sea - STAY OFFSHORE to avoid Venezuela mainland
            [-65.0, 11.0],          // North from Jose, staying offshore
            [-66.0, 12.0],          // Northwest through Caribbean Sea
            [-67.5, 12.3],          // Continue west, north of coast
            CONFIG.DET_3,           // Detection 3: STS location [-68.8317, 11.8333]
            CONFIG.DET_4,           // Detection 4: Heading east [-68.1134, 11.4955]
            // Waypoint: Route east through Caribbean - stay north of islands
            [-66.0, 12.0],          // East through Caribbean
            [-63.5, 11.5],          // Continue east, well north of Trinidad
            [-61.0, 10.8],          // Southeast, north of Trinidad
            [-59.0, 9.5],           // Past Tobago/Grenada area
            [-58.0, 8.5],           // Continue toward SKIPPER AIS start
            skipperStart            // SKIPPER AIS track starts [-56.906667, 7.818333]
        ];
    }

    // ============================================================================
    // SHOW MAIN - Sequential Animation
    // ============================================================================

    async function showMain() {
        console.log('  showMain (SKIPPER - Venezuelan Oil Seizure)');
        clearAll();

        await loadData();
        if (!skipperCoords?.length) {
            console.error('  No SKIPPER coordinates loaded');
            return;
        }

        // Create legend
        createLegend();

        // Build assessed path
        const assessedPath = buildAssessedPath();

        // Add assessed path source - starts empty
        map.addSource(SOURCE_ASSESSED, {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
        });

        // Assessed path (dotted line)
        map.addLayer({
            id: LAYER_ASSESSED,
            type: 'line',
            source: SOURCE_ASSESSED,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
                'line-color': CONFIG.ASSESSED_COLOR,
                'line-width': 3,
                'line-opacity': 0.8,
                'line-dasharray': [2, 4]
            }
        });

        // Add SKIPPER source (will animate later)
        map.addSource(SOURCE_SKIPPER, {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [skipperCoords[0]] } }
        });

        // SKIPPER Glow
        map.addLayer({
            id: LAYER_SKIPPER_GLOW,
            type: 'line',
            source: SOURCE_SKIPPER,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
                'line-color': CONFIG.SKIPPER_COLOR,
                'line-width': 10,
                'line-opacity': 0,
                'line-blur': 5
            }
        });

        // SKIPPER Main (hidden until phase 6)
        map.addLayer({
            id: LAYER_SKIPPER,
            type: 'line',
            source: SOURCE_SKIPPER,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
                'line-color': CONFIG.SKIPPER_COLOR,
                'line-width': 3,
                'line-opacity': 0
            }
        });

        // Start sequential animation
        running = true;
        currentPhase = 0;
        runSequentialAnimation(assessedPath);
    }

    // ============================================================================
    // SEQUENTIAL ANIMATION - Runs through all phases in order
    // ============================================================================

    function runSequentialAnimation(assessedPath) {
        if (!running) return;

        // assessedPath now has waypoints:
        // [0] DET_1, [1] DET_2, [2] waypoint, [3] waypoint, [4] DET_3, [5] DET_4,
        // [6-9] waypoints, [10] SKIPPER start

        // Phase 0: Show Detection 1 (Dark detection at Jose Terminal)
        showDetection1();

        // Phase 1: After delay, show Detection 2
        safeSetTimeout(() => {
            if (!running) return;
            showDetection2();

            // Phase 2: Animate dotted line from Det 1-2 through waypoints to Det 3 (STS)
            safeSetTimeout(() => {
                if (!running) return;
                // Animate through waypoints to DET_3 (index 4)
                animateAssessedPath(
                    [assessedPath[0], assessedPath[1]],
                    [assessedPath[2], assessedPath[3], assessedPath[4]],
                    () => {
                        // Phase 3: Show STS detection
                        showDetection3();

                        // Phase 4: Animate dotted line to Det 4
                        safeSetTimeout(() => {
                            if (!running) return;
                            animateAssessedSegment(
                                assessedPath.slice(0, 5),
                                assessedPath[5],
                                () => {
                                    // Show Detection 4
                                    showDetection4();

                                    // Phase 5: Animate dotted line through waypoints to SKIPPER start
                                    safeSetTimeout(() => {
                                        if (!running) return;
                                        animateAssessedPath(
                                            assessedPath.slice(0, 6),
                                            assessedPath.slice(6), // waypoints + SKIPPER start
                                            () => {
                                                // Show spoofing marker at SKIPPER AIS start
                                                showSpoofingMarker();

                                                // Phase 6: Animate SKIPPER AIS track
                                                safeSetTimeout(() => {
                                                    if (!running) return;
                                                    animateSkipperTrack();
                                                }, 200);
                                            }
                                        );
                                    }, 400);
                                }
                            );
                        }, 400);
                    }
                );
            }, CONFIG.PHASE_DELAY);
        }, CONFIG.PHASE_DELAY);
    }

    // Animate through multiple waypoints
    function animateAssessedPath(existingCoords, targetCoords, onComplete) {
        if (!targetCoords.length) {
            if (onComplete) onComplete();
            return;
        }

        const nextTarget = targetCoords[0];
        const remainingTargets = targetCoords.slice(1);

        animateAssessedSegment(existingCoords, nextTarget, () => {
            if (!running) return;
            // Continue to next waypoint
            animateAssessedPath([...existingCoords, nextTarget], remainingTargets, onComplete);
        });
    }

    // ============================================================================
    // DETECTION MARKERS
    // ============================================================================

    function showDetection1() {
        console.log('  Phase 0: Detection 1 - SKIPPER loading at Jose Terminal (14-18 Nov)');

        // Dark detection marker with red glow - heading: docked/stationary (0°)
        const mkr = createSvgMarker('assets/svg/darkdetection.svg', CONFIG.DET_1, 'ch12-dark-marker', 45);

        // Number marker - offset to left to avoid overlap with Detection 2
        const numMkr = createNumberMarker('1', CONFIG.DET_1, [-30, 15]);

        // Popup with sat image
        const popup = createImagePopup(
            CONFIG.DET_1,
            CONFIG.DET_1_IMAGE,
            'red',
            CONFIG.DET_1_OFFSET,
            CONFIG.DET_1_LABEL,
            CONFIG.DET_1_SUBLABEL
        );

        safeSetTimeout(() => {
            showMarker(mkr);
            showMarker(numMkr);
            showPopup(popup);
        }, CONFIG.MARKER_FADE_DELAY);
    }

    function showDetection2() {
        console.log('  Phase 1: Detection 2 - SKIPPER anchored near Jose (19 Nov - 04 Dec)');

        // Dark detection marker with red glow - heading: anchored/NW facing (315°)
        const mkr = createSvgMarker('assets/svg/darkdetection.svg', CONFIG.DET_2, 'ch12-dark-marker', -30);

        // Number marker
        const numMkr = createNumberMarker('2', CONFIG.DET_2);

        // Popup with sat image
        const popup = createImagePopup(
            CONFIG.DET_2,
            CONFIG.DET_2_IMAGE,
            'red',
            CONFIG.DET_2_OFFSET,
            CONFIG.DET_2_LABEL,
            CONFIG.DET_2_SUBLABEL
        );

        safeSetTimeout(() => {
            showMarker(mkr);
            showMarker(numMkr);
            showPopup(popup);
        }, CONFIG.MARKER_FADE_DELAY);
    }

    function showDetection3() {
        console.log('  Phase 3: Detection 3 - STS with NEPTUNE 6 south of Curaçao (07 Dec)');

        // Light-Dark STS detection marker with cyan glow - no rotation
        const mkr = createSvgMarker('assets/svg/lightdarkstsdetection.svg', CONFIG.DET_3, 'ch12-sts-marker', 0);

        // Number marker
        const numMkr = createNumberMarker('3', CONFIG.DET_3);

        // Popup with sat image
        const popup = createImagePopup(
            CONFIG.DET_3,
            CONFIG.DET_3_IMAGE,
            'cyan',
            CONFIG.DET_3_OFFSET,
            CONFIG.DET_3_LABEL,
            CONFIG.DET_3_SUBLABEL
        );

        safeSetTimeout(() => {
            showMarker(mkr);
            showMarker(numMkr);
            showPopup(popup);
        }, CONFIG.MARKER_FADE_DELAY);
    }

    function showDetection4() {
        console.log('  Phase 4: Detection 4 - SKIPPER (AIS dark) heading east (08 Dec)');

        // Dark detection marker with red glow - heading: pointing towards STS marker (northwest ~-50°)
        const mkr = createSvgMarker('assets/svg/darkdetection.svg', CONFIG.DET_4, 'ch12-dark-marker', -50);

        // Number marker
        const numMkr = createNumberMarker('4', CONFIG.DET_4);

        // Popup with sat image
        const popup = createImagePopup(
            CONFIG.DET_4,
            CONFIG.DET_4_IMAGE,
            'red',
            CONFIG.DET_4_OFFSET,
            CONFIG.DET_4_LABEL,
            CONFIG.DET_4_SUBLABEL
        );

        safeSetTimeout(() => {
            showMarker(mkr);
            showMarker(numMkr);
            showPopup(popup);
        }, CONFIG.MARKER_FADE_DELAY);
    }

    function showSpoofingMarker() {
        console.log('  Phase 5: Spoofing marker - SKIPPER AIS (spoofed since Atlantic crossing)');

        // Spoofing marker at SKIPPER AIS track start point with purple glow - no rotation
        const mkr = createSvgMarker('assets/svg/spoofing.svg', CONFIG.SKIPPER_AIS_START, 'ch12-spoof-marker', 0);

        safeSetTimeout(() => {
            showMarker(mkr);
        }, CONFIG.MARKER_FADE_DELAY);
    }

    // ============================================================================
    // ANIMATE ASSESSED SEGMENT (dotted line)
    // ============================================================================

    function animateAssessedSegment(existingCoords, targetCoord, onComplete) {
        const startTime = performance.now();
        const startCoord = existingCoords[existingCoords.length - 1];

        function animate() {
            if (!running) return;

            const elapsed = performance.now() - startTime;
            const pct = Math.min(elapsed / CONFIG.ASSESSED_SEGMENT_DURATION, 1);

            // Interpolate between start and target
            const currentLng = startCoord[0] + (targetCoord[0] - startCoord[0]) * pct;
            const currentLat = startCoord[1] + (targetCoord[1] - startCoord[1]) * pct;

            // Update source with existing coords + interpolated point
            const coords = [...existingCoords, [currentLng, currentLat]];
            const src = map.getSource(SOURCE_ASSESSED);
            if (src) {
                src.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: coords }
                });
            }

            if (pct >= 1) {
                // Ensure final point is exact
                const finalCoords = [...existingCoords, targetCoord];
                if (src) {
                    src.setData({
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: finalCoords }
                    });
                }
                if (onComplete) onComplete();
            } else {
                animId = requestAnimationFrame(animate);
            }
        }

        animate();
    }

    // ============================================================================
    // ANIMATE SKIPPER AIS TRACK
    // ============================================================================

    function animateSkipperTrack() {
        console.log('  Phase 6: Animating SKIPPER AIS track');

        // Show the SKIPPER layers
        map.setPaintProperty(LAYER_SKIPPER, 'line-opacity', 0.95);
        map.setPaintProperty(LAYER_SKIPPER_GLOW, 'line-opacity', 0.3);

        // Create vessel panel
        createVesselPanel();

        const startTime = performance.now();

        function animate() {
            if (!running) return;

            const elapsed = performance.now() - startTime;
            const pct = Math.min(elapsed / CONFIG.AIS_ANIMATION_DURATION, 1);

            const total = skipperCoords.length;
            const idx = Math.floor(pct * (total - 1));

            const src = map.getSource(SOURCE_SKIPPER);
            if (src && idx >= 0) {
                src.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: skipperCoords.slice(0, idx + 1) }
                });
            }

            if (pct >= 1) {
                // Ensure full track shown
                if (src) {
                    src.setData({
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: skipperCoords }
                    });
                }
                running = false;
                console.log('  SKIPPER animation complete');
            } else {
                animId = requestAnimationFrame(animate);
            }
        }

        animate();
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        showMain,
        stop: clearAll,
        cleanup: clearAll,
        pause: stopAnim,
        resume: () => {
            // Cannot easily resume sequential animation
            console.log('  Resume not supported for Chapter 12');
        },
        getProgress: () => currentPhase / 6,
        isComplete: () => !running && currentPhase >= 6
    };
}

window.animateChapter12 = animateChapter12;
