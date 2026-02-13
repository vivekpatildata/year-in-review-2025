// ============================================================================
// CHAPTER 7 ANIMATION - MATROS SHEVCHENKO: Crimea to Egypt Dark Transit
// SPLIT-SCREEN: Left = Black Sea/Crimea, Right = Bosphorus to Egypt
// ============================================================================

function animateChapter7(mapInput, chapterConfig) {
    console.log('Chapter 7: Init - MATROS SHEVCHENKO');
    
    // Handle split-screen mode: mapInput can be single map or { left, right }
    const isSplitScreen = mapInput && mapInput.left && mapInput.right;
    const mapLeft = isSplitScreen ? mapInput.left : mapInput;
    const mapRight = isSplitScreen ? mapInput.right : mapInput;
    const map = mapLeft; // Default to left for backward compatibility
    
    console.log(`  Split-screen mode: ${isSplitScreen}`);

    // ============================================================================
    // CUSTOMIZATION OPTIONS
    // ============================================================================

    const CONFIG = {
        // --- COLORS ---
        AIS_LINE_COLOR: '#00ff88',           // Green for AIS track (solid)
        AIS_GLOW_COLOR: '#00ff88',
        ASSESSED_LINE_COLOR: '#00ff88',      // Same color but dotted for assessed track
        ASSESSED_GLOW_COLOR: '#00ff88',

        // --- ANIMATION TIMING ---
        ASSESSED_ANIMATION_DURATION: 3500,   // Phase 1: Assessed course animation (ms)
        AIS_ANIMATION_DURATION: 4000,        // Phase 2: AIS track animation (ms)
        MARKER_DELAY: 400,                   // Delay between marker appearances
        PHASE_DELAY: 800,                    // Delay between phases

        // --- SVG MARKER SIZE ---
        MARKER_SIZE: 40,

        // --- MARKER LOCATIONS [lng, lat] (independent from satellite images) ---
        // Dark Detection 1: Feodosia Bay - 17-19 Aug 2025 - Loading cargo
        DARK_MKR_1: [35.3880, 45.0304],      // Marker position
        DARK_MKR_1_LABEL: '17-19 Aug 2025',
        DARK_MKR_1_SUBLABEL: 'Berthed at Feodosia - loading grain',

        // Dark Detection 2: Sevastopol - 09 Sep 2025 - Docked at grain silos
        DARK_MKR_2: [33.5547, 44.6245],      // Marker position
        DARK_MKR_2_LABEL: '09 Sep 2025',
        DARK_MKR_2_SUBLABEL: 'Berthed at Sevastopol grain silos',

        // HUMINT Detection: Bosphorus Strait - 13 Sep 2025 - Transiting after AIS resumed
        HUMINT_MKR: [29.05, 41.11],          // Marker position
        HUMINT_MKR_LABEL: '13 Sep 2025',
        HUMINT_MKR_SUBLABEL: 'Transiting Bosphorus Strait',

        // Light Detection: El Dekheila - 16-17 Sep 2025 - Docked in Egypt
        LIGHT_MKR: [29.74,31.228333],       // Marker position29.74,31.228333
        LIGHT_MKR_LABEL: '16-17 Sep 2025',
        LIGHT_MKR_SUBLABEL: 'Docked at El Dekheila, Egypt',

        // --- SATELLITE IMAGE LOCATIONS [lng, lat] (independent from markers) ---
        // Can be adjusted separately to position images without moving markers
        DARK_IMG_1: [35.3880, 45.0304],      // Image anchor position
        DARK_IMG_1_PATH: 'images/chapter7/chapter7A.png',
        DARK_IMG_1_OFFSET: [100, -10],

        DARK_IMG_2: [33.5547, 44.6245],      // Image anchor position
        DARK_IMG_2_PATH: 'images/chapter7/chapter7B.png',
        DARK_IMG_2_OFFSET: [-150, 60],

        HUMINT_IMG: [29.05, 41.11],          // Image anchor position
        HUMINT_IMG_PATH: 'images/chapter7/chapter7C.png',
        HUMINT_IMG_OFFSET: [100, 140],

        LIGHT_IMG: [29.8096, 31.1392],       // Image anchor position
        LIGHT_IMG_PATH: 'images/chapter7/chapter7D.png',
        LIGHT_IMG_OFFSET: [-170, 80],

        // --- AIS TRACK START (where AIS resumed - 11 Sep near Sevastopol) ---
        AIS_START: [33.352257, 43.167355],

        // --- IMAGE PLACEHOLDER SETTINGS ---
        IMG_WIDTH: 200,
        IMG_HEIGHT: 130,

        // --- VESSEL MARKER ---
        VESSEL_SIZE: 12,

        // --- DOTTED LINE SETTINGS ---
        DASH_ARRAY: [4, 4],  // More dotted
        
        // --- ADDITIONAL DARK MARKERS AT FEODOSIA (10 more = 11 total, different headings) ---
        FEODOSIA_MARKERS: [
            { coords: [35.3880, 45.0304], rotation: 0 },
            { coords: [35.3920, 45.0280], rotation: 15 },
            { coords: [35.3840, 45.0330], rotation: -20 },
            { coords: [35.3960, 45.0260], rotation: 45 },
            { coords: [35.3800, 45.0350], rotation: -45 },
            { coords: [35.4000, 45.0240], rotation: 30 },
            { coords: [35.3760, 45.0370], rotation: -30 },
            { coords: [35.4040, 45.0220], rotation: 60 },
            { coords: [35.3720, 45.0390], rotation: -60 },
            { coords: [35.4080, 45.0200], rotation: 90 },
            { coords: [35.3680, 45.0410], rotation: -90 }
        ],
        
        // --- ADDITIONAL DARK MARKERS AT SEVASTOPOL (5 more = 6 total, different headings) ---
        SEVASTOPOL_MARKERS: [
            { coords: [33.5547, 44.6245], rotation: 0 },
            { coords: [33.5600, 44.6200], rotation: 25 },
            { coords: [33.5490, 44.6290], rotation: -25 },
            { coords: [33.5650, 44.6160], rotation: 50 },
            { coords: [33.5440, 44.6330], rotation: -50 },
            { coords: [33.5700, 44.6120], rotation: 75 }
        ]
    };

    // ============================================================================
    // STATE
    // ============================================================================

    const SOURCE_ASSESSED = 'ch7-assessed-src';
    const SOURCE_ASSESSED_RIGHT = 'ch7-assessed-right-src';  // For right map sync
    const SOURCE_AIS = 'ch7-ais-src';
    const LAYER_ASSESSED = 'ch7-assessed-line';
    const LAYER_ASSESSED_GLOW = 'ch7-assessed-glow';
    const LAYER_ASSESSED_RIGHT = 'ch7-assessed-right-line';
    const LAYER_ASSESSED_RIGHT_GLOW = 'ch7-assessed-right-glow';
    const LAYER_AIS = 'ch7-ais-line';
    const LAYER_AIS_GLOW = 'ch7-ais-glow';

    // Assessed course coordinates (dotted line): Feodosia → curve through water → Sevastopol → AIS Start
    // UPDATED: Curved path that stays in water, avoiding land
    const assessedCoords = [
        [35.3880, 45.0304],      // Feodosia Bay
        [35.2000, 44.8500],      // Curve point 1 - into Black Sea
        [34.5000, 44.5000],      // Curve point 2 - offshore
        [34.0000, 44.4000],      // Curve point 3 - approaching Sevastopol from sea
        [33.5547, 44.6245],      // Sevastopol
        [33.4500, 44.3000],      // Exit Sevastopol bay
        [33.3500, 43.8000],      // Heading south
        [33.352257, 43.167355]   // Where AIS track begins
    ];

    let aisCoords = null;

    let animId = null;
    let progress = 0;
    let startT = null;
    let running = false;
    let phase = 'assessed';  // 'assessed' -> 'ais' -> 'complete'

    // Markers and popups
    let vesselMkrLeft = null;   // Vessel on left map (Crimea)
    let vesselMkrRight = null;  // Vessel on right map (Egypt route)
    let feodosiaMarkers = [];   // Array of dark markers at Feodosia (11 total)
    let sevastopolMarkers = []; // Array of dark markers at Sevastopol (6 total)
    let humintMkr = null;       // Bosphorus (right map)
    let lightMkr = null;        // Egypt (right map)

    let darkPopup1 = null;      // Single sat image for Feodosia
    let darkPopup2 = null;      // Single sat image for Sevastopol
    let humintPopup = null;
    let lightPopup = null;

    // Track which markers have been shown
    let feodosiaMarkersShown = false;
    let sevastopolMarkersShown = false;
    let humintMkrShown = false;
    let lightMkrShown = false;

    // ============================================================================
    // INJECT STYLES
    // ============================================================================

    if (!document.getElementById('ch7-css')) {
        const css = document.createElement('style');
        css.id = 'ch7-css';
        css.textContent = `
            /* === VESSEL MARKER === */
            .ch7-vessel {
                width: ${CONFIG.VESSEL_SIZE}px;
                height: ${CONFIG.VESSEL_SIZE}px;
                background: ${CONFIG.AIS_LINE_COLOR};
                border-radius: 50%;
                box-shadow: 0 0 15px ${CONFIG.AIS_LINE_COLOR}, 0 0 30px ${CONFIG.AIS_LINE_COLOR}40;
                transition: opacity 0.5s ease;
            }
            .ch7-vessel.hidden {
                opacity: 0 !important;
                pointer-events: none;
            }

            /* === LIGHT DETECTION MARKER (Blue Glow) === */
            .ch7-light-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
                opacity: 0;
            }
            .ch7-light-marker.visible {
                opacity: 1;
            }
            .ch7-light-marker:hover {
                transform: scale(1.15);
            }
            .ch7-light-marker img {
                width: ${CONFIG.MARKER_SIZE}px;
                height: auto;
                filter: drop-shadow(0 0 12px rgba(0, 163, 227, 0.9))
                        drop-shadow(0 0 20px rgba(0, 163, 227, 0.6))
                        drop-shadow(0 0 30px rgba(0, 163, 227, 0.4));
            }

            /* === DARK DETECTION MARKER (Orange/Yellow Glow) === */
            .ch7-dark-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
                opacity: 0;
            }
            .ch7-dark-marker.visible {
                opacity: 1;
            }
            .ch7-dark-marker:hover {
                transform: scale(1.15);
            }
            .ch7-dark-marker img {
                width: ${CONFIG.MARKER_SIZE}px;
                height: auto;
                filter: drop-shadow(0 0 8px rgba(255, 165, 0, 0.8))
                        drop-shadow(0 0 15px rgba(255, 165, 0, 0.5))
                        drop-shadow(0 0 25px rgba(255, 165, 0, 0.3));
            }

            /* === HUMINT DETECTION MARKER (Amber Glow) === */
            .ch7-humint-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
                opacity: 0;
            }
            .ch7-humint-marker.visible {
                opacity: 1;
            }
            .ch7-humint-marker:hover {
                transform: scale(1.15);
            }
            .ch7-humint-marker img {
                width: ${CONFIG.MARKER_SIZE}px;
                height: auto;
                filter: drop-shadow(0 0 10px rgba(220, 141, 24, 0.9))
                        drop-shadow(0 0 18px rgba(220, 141, 24, 0.6))
                        drop-shadow(0 0 28px rgba(220, 141, 24, 0.4));
            }

            /* === POPUP BASE === */
            .ch7-pop .mapboxgl-popup-tip { display: none !important; }
            .ch7-pop .mapboxgl-popup-content {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
                outline: none !important;
            }

            /* === LIGHT DETECTION SATELLITE IMAGE (Blue Glow) === */
            .ch7-light-img-holder {
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
            .ch7-light-img {
                display: block;
                max-width: ${CONFIG.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                border-width: 0 !important;
                outline: none !important;
                box-shadow: none !important;
            }

            /* === DARK DETECTION SATELLITE IMAGE (Orange/Yellow Glow) === */
            .ch7-dark-img-holder {
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
            }
            .ch7-dark-img {
                display: block;
                max-width: ${CONFIG.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                border-width: 0 !important;
                outline: none !important;
                box-shadow: none !important;
            }

            /* === HUMINT DETECTION SATELLITE IMAGE (Amber Glow) === */
            .ch7-humint-img-holder {
                display: inline-block;
                padding: 0 !important;
                border-radius: 10px;
                background: transparent !important;
                border: none !important;
                border-width: 0 !important;
                outline: none !important;
                box-shadow:
                    0 0 25px rgba(220, 141, 24, 0.35),
                    0 0 50px rgba(220, 141, 24, 0.15);
            }
            .ch7-humint-img {
                display: block;
                max-width: ${CONFIG.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                border-width: 0 !important;
                outline: none !important;
                box-shadow: none !important;
            }

            /* === LEGEND === */
            .ch7-legend {
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

            .ch7-legend.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .ch7-legend-title {
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 1px;
                text-transform: uppercase;
                color: rgba(255,255,255,0.6);
                margin-bottom: 12px;
            }

            .ch7-legend-item {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 8px;
                font-size: 12px;
                color: rgba(255,255,255,0.85);
            }

            .ch7-legend-item:last-child {
                margin-bottom: 0;
            }

            .ch7-legend-line {
                width: 24px;
                height: 3px;
                border-radius: 2px;
            }

            .ch7-legend-line.solid {
                background: ${CONFIG.AIS_LINE_COLOR};
            }

            .ch7-legend-line.dotted {
                background: repeating-linear-gradient(
                    to right,
                    ${CONFIG.ASSESSED_LINE_COLOR} 0px,
                    ${CONFIG.ASSESSED_LINE_COLOR} 5px,
                    transparent 5px,
                    transparent 9px
                );
            }

            .ch7-legend-icon {
                width: 20px;
                height: auto;
            }

            /* === RESPONSIVE - TABLET === */
            @media (max-width: 1024px) {
                .ch7-light-marker img,
                .ch7-dark-marker img,
                .ch7-humint-marker img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.9)}px;
                }
                .ch7-light-img,
                .ch7-dark-img,
                .ch7-humint-img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.85)}px;
                }
            }

            /* === RESPONSIVE - MOBILE === */
            @media (max-width: 768px) {
                .ch7-light-marker img,
                .ch7-dark-marker img,
                .ch7-humint-marker img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.8)}px;
                }
                .ch7-light-img,
                .ch7-dark-img,
                .ch7-humint-img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.7)}px;
                }
            }

            /* === RESPONSIVE - SMALL MOBILE === */
            @media (max-width: 480px) {
                .ch7-light-marker img,
                .ch7-dark-marker img,
                .ch7-humint-marker img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.7)}px;
                }
                .ch7-light-img,
                .ch7-dark-img,
                .ch7-humint-img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.55)}px;
                }
                .ch7-vessel {
                    width: ${Math.round(CONFIG.VESSEL_SIZE * 0.8)}px;
                    height: ${Math.round(CONFIG.VESSEL_SIZE * 0.8)}px;
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
        // Clear vessel markers
        [vesselMkrLeft, vesselMkrRight, humintMkr, lightMkr].forEach(m => {
            try { if (m) m.remove(); } catch(e) {}
        });
        vesselMkrLeft = vesselMkrRight = humintMkr = lightMkr = null;

        // Clear Feodosia markers array
        feodosiaMarkers.forEach(m => {
            try { if (m) m.remove(); } catch(e) {}
        });
        feodosiaMarkers = [];

        // Clear Sevastopol markers array
        sevastopolMarkers.forEach(m => {
            try { if (m) m.remove(); } catch(e) {}
        });
        sevastopolMarkers = [];

        // Clear popups
        [darkPopup1, darkPopup2, humintPopup, lightPopup].forEach(p => {
            try { if (p) p.remove(); } catch(e) {}
        });
        darkPopup1 = darkPopup2 = humintPopup = lightPopup = null;

        feodosiaMarkersShown = sevastopolMarkersShown = humintMkrShown = lightMkrShown = false;

        const legend = document.querySelector('.ch7-legend');
        if (legend) legend.remove();
        
        // DOM cleanup for both maps
        document.querySelectorAll('.ch7-vessel, .ch7-light-marker, .ch7-dark-marker, .ch7-humint-marker').forEach(el => {
            try {
                const wrapper = el.closest('.mapboxgl-marker');
                if (wrapper) wrapper.remove(); else el.remove();
            } catch(e) {}
        });
        document.querySelectorAll('.ch7-pop').forEach(el => {
            try {
                const popup = el.closest('.mapboxgl-popup');
                if (popup) popup.remove(); else el.remove();
            } catch(e) {}
        });
    }

    function clearLayers() {
        // Clear from left map (assessed track)
        [LAYER_ASSESSED, LAYER_ASSESSED_GLOW].forEach(id => {
            try { if (mapLeft.getLayer(id)) mapLeft.removeLayer(id); } catch(e) {}
        });
        [SOURCE_ASSESSED].forEach(id => {
            try { if (mapLeft.getSource(id)) mapLeft.removeSource(id); } catch(e) {}
        });
        
        // Clear from right map (AIS track + synced assessed track)
        [LAYER_AIS, LAYER_AIS_GLOW, LAYER_ASSESSED_RIGHT, LAYER_ASSESSED_RIGHT_GLOW].forEach(id => {
            try { if (mapRight.getLayer(id)) mapRight.removeLayer(id); } catch(e) {}
        });
        [SOURCE_AIS, SOURCE_ASSESSED_RIGHT].forEach(id => {
            try { if (mapRight.getSource(id)) mapRight.removeSource(id); } catch(e) {}
        });
        
        // Also clear from single map mode (backward compatibility)
        if (!isSplitScreen) {
            [LAYER_AIS, LAYER_AIS_GLOW, LAYER_ASSESSED, LAYER_ASSESSED_GLOW].forEach(id => {
                try { if (map.getLayer(id)) map.removeLayer(id); } catch(e) {}
            });
            [SOURCE_AIS, SOURCE_ASSESSED].forEach(id => {
                try { if (map.getSource(id)) map.removeSource(id); } catch(e) {}
            });
        }
    }

    function clearAll() {
        stopAnim();
        clearMarkers();
        clearLayers();
        progress = 0;
        phase = 'assessed';
    }

    // ============================================================================
    // LOAD DATA
    // ============================================================================

    async function loadData() {
        if (aisCoords) return true;
        try {
            const res = await fetch(chapterConfig?.dataFile || 'data/chapter7-matros.geojson');
            const data = await res.json();
            if (data?.features?.[0]?.geometry?.coordinates) {
                aisCoords = data.features[0].geometry.coordinates;
                console.log(`  Loaded ${aisCoords.length} AIS coordinates`);
                return true;
            }
        } catch (e) {
            console.error('Chapter 7 load error:', e);
        }
        return false;
    }

    // ============================================================================
    // MARKER HELPERS
    // ============================================================================

    // Create light detection marker (blue glow)
    function createLightMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch7-light-marker';
        el.innerHTML = `<img src="${svgFile}" alt="Light detection marker">`;
        return el;
    }

    // Create dark detection marker (orange/yellow glow)
    function createDarkMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch7-dark-marker';
        el.innerHTML = `<img src="${svgFile}" alt="Dark detection marker">`;
        return el;
    }

    // Create HUMINT detection marker (amber glow)
    function createHumintMarker(svgFile) {
        const el = document.createElement('div');
        el.className = 'ch7-humint-marker';
        el.innerHTML = `<img src="${svgFile}" alt="HUMINT detection marker">`;
        return el;
    }

    function showMarker(marker) {
        if (marker?.getElement) {
            marker.getElement().classList.add('visible');
        }
    }

    // Create satellite image popup with proper glow styling
    function createImagePopup(lngLat, imagePath, colorType, offset, targetMap = mapLeft) {
        // Map colorType to proper CSS class names
        const holderClass = colorType === 'blue' ? 'ch7-light-img-holder' :
                           colorType === 'orange' ? 'ch7-dark-img-holder' :
                           'ch7-humint-img-holder';
        const imgClass = colorType === 'blue' ? 'ch7-light-img' :
                        colorType === 'orange' ? 'ch7-dark-img' :
                        'ch7-humint-img';

        return new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch7-pop',
            offset: offset
        })
            .setLngLat(lngLat)
            .setHTML(`
                <div class="${holderClass}">
                    <img class="${imgClass}" src="${imagePath}">
                </div>
            `)
            .addTo(targetMap);
    }

    // ============================================================================
    // CREATE LEGEND
    // ============================================================================

    function createLegend() {
        const existing = document.querySelector('.ch7-legend');
        if (existing) existing.remove();

        const legend = document.createElement('div');
        legend.className = 'ch7-legend';
        legend.innerHTML = `
            <div class="ch7-legend-title">Legend</div>
            <div class="ch7-legend-item">
                <div class="ch7-legend-line solid"></div>
                <span>AIS Track (11 Sep onwards)</span>
            </div>
            <div class="ch7-legend-item">
                <div class="ch7-legend-line dotted"></div>
                <span>Dark Transit (Assessed)</span>
            </div>
            <div class="ch7-legend-item">
                <img class="ch7-legend-icon" src="darkdetection.svg" alt="">
                <span>Dark Detection</span>
            </div>
            <div class="ch7-legend-item">
                <img class="ch7-legend-icon" src="humintdetection.svg" alt="">
                <span>HUMINT Detection</span>
            </div>
            <div class="ch7-legend-item">
                <img class="ch7-legend-icon" src="lightdetection.svg" alt="">
                <span>Light Detection</span>
            </div>
        `;

        document.body.appendChild(legend);
        setTimeout(() => legend.classList.add('visible'), 100);
    }

    // ============================================================================
    // COORDINATE DISTANCE HELPER
    // ============================================================================

    function getDistance(coord1, coord2) {
        const dx = coord1[0] - coord2[0];
        const dy = coord1[1] - coord2[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    function isNearCoord(vesselCoord, targetCoord, threshold = 0.5) {
        return getDistance(vesselCoord, targetCoord) < threshold;
    }

    // ============================================================================
    // INTERPOLATE ALONG ASSESSED PATH
    // ============================================================================

    function interpolateAssessedPath(progress, coords) {
        // Calculate total path length
        let totalLength = 0;
        const segmentLengths = [];

        for (let i = 0; i < coords.length - 1; i++) {
            const len = getDistance(coords[i], coords[i + 1]);
            segmentLengths.push(len);
            totalLength += len;
        }

        // Find position along path
        const targetDist = progress * totalLength;
        let accumulatedDist = 0;

        for (let i = 0; i < segmentLengths.length; i++) {
            if (accumulatedDist + segmentLengths[i] >= targetDist) {
                // Interpolate within this segment
                const segmentProgress = (targetDist - accumulatedDist) / segmentLengths[i];
                const lng = coords[i][0] + (coords[i + 1][0] - coords[i][0]) * segmentProgress;
                const lat = coords[i][1] + (coords[i + 1][1] - coords[i][1]) * segmentProgress;
                return [lng, lat];
            }
            accumulatedDist += segmentLengths[i];
        }

        return coords[coords.length - 1];
    }

    // ============================================================================
    // BUILD ASSESSED PATH COORDINATES FOR ANIMATION
    // ============================================================================

    function buildAssessedPathUpTo(progress, coords) {
        // Generate interpolated coordinates for smooth line drawing
        const result = [];
        const steps = Math.max(2, Math.floor(progress * 50));

        for (let i = 0; i <= steps; i++) {
            const p = i / 50;
            if (p <= progress) {
                result.push(interpolateAssessedPath(p, coords));
            }
        }

        return result;
    }

    // ============================================================================
    // SHOW MAIN
    // ============================================================================

    async function showMain() {
        console.log('  showMain (MATROS SHEVCHENKO)');
        clearAll();

        await loadData();
        if (!aisCoords?.length) return;

        // =========================================
        // LEFT MAP: Assessed Track (Crimea)
        // =========================================
        
        // Setup assessed track source (dotted line) on LEFT map
        if (!mapLeft.getSource(SOURCE_ASSESSED)) {
            mapLeft.addSource(SOURCE_ASSESSED, {
                type: 'geojson',
                data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
            });
        }

        // Assessed Glow
        if (!mapLeft.getLayer(LAYER_ASSESSED_GLOW)) {
            mapLeft.addLayer({
                id: LAYER_ASSESSED_GLOW,
                type: 'line',
                source: SOURCE_ASSESSED,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': CONFIG.ASSESSED_GLOW_COLOR,
                    'line-width': 8,
                    'line-opacity': 0.2,
                    'line-blur': 4
                }
            });
        }

        // Assessed Main (dotted)
        if (!mapLeft.getLayer(LAYER_ASSESSED)) {
            mapLeft.addLayer({
                id: LAYER_ASSESSED,
                type: 'line',
                source: SOURCE_ASSESSED,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': CONFIG.ASSESSED_LINE_COLOR,
                    'line-width': 3,
                    'line-opacity': 0.9,
                    'line-dasharray': CONFIG.DASH_ARRAY
                }
            });
        }

        // =========================================
        // RIGHT MAP: Synced Assessed Track + AIS Track
        // =========================================
        
        // Setup SYNCED assessed track source on RIGHT map (animates simultaneously)
        if (isSplitScreen) {
            if (!mapRight.getSource(SOURCE_ASSESSED_RIGHT)) {
                mapRight.addSource(SOURCE_ASSESSED_RIGHT, {
                    type: 'geojson',
                    data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
                });
            }

            // Assessed Glow on right map
            if (!mapRight.getLayer(LAYER_ASSESSED_RIGHT_GLOW)) {
                mapRight.addLayer({
                    id: LAYER_ASSESSED_RIGHT_GLOW,
                    type: 'line',
                    source: SOURCE_ASSESSED_RIGHT,
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: {
                        'line-color': CONFIG.ASSESSED_GLOW_COLOR,
                        'line-width': 8,
                        'line-opacity': 0.2,
                        'line-blur': 4
                    }
                });
            }

            // Assessed Main (dotted) on right map
            if (!mapRight.getLayer(LAYER_ASSESSED_RIGHT)) {
                mapRight.addLayer({
                    id: LAYER_ASSESSED_RIGHT,
                    type: 'line',
                    source: SOURCE_ASSESSED_RIGHT,
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: {
                        'line-color': CONFIG.ASSESSED_LINE_COLOR,
                        'line-width': 3,
                        'line-opacity': 0.9,
                        'line-dasharray': CONFIG.DASH_ARRAY
                    }
                });
            }
        }
        
        // Setup AIS track source (solid line) on RIGHT map
        if (!mapRight.getSource(SOURCE_AIS)) {
            mapRight.addSource(SOURCE_AIS, {
                type: 'geojson',
                data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
            });
        }

        // AIS Glow
        if (!mapRight.getLayer(LAYER_AIS_GLOW)) {
            mapRight.addLayer({
                id: LAYER_AIS_GLOW,
                type: 'line',
                source: SOURCE_AIS,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': CONFIG.AIS_GLOW_COLOR,
                    'line-width': 10,
                    'line-opacity': 0.3,
                    'line-blur': 5
                }
            });
        }

        // AIS Main (solid)
        if (!mapRight.getLayer(LAYER_AIS)) {
            mapRight.addLayer({
                id: LAYER_AIS,
                type: 'line',
                source: SOURCE_AIS,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': CONFIG.AIS_LINE_COLOR,
                    'line-width': 3,
                    'line-opacity': 0.95
                }
            });
        }

        // =========================================
        // VESSEL MARKERS (both maps)
        // =========================================
        
        // Vessel marker on LEFT map - starts at Feodosia
        const velLeft = document.createElement('div');
        velLeft.className = 'ch7-vessel';
        vesselMkrLeft = new mapboxgl.Marker({ element: velLeft, anchor: 'center' })
            .setLngLat(assessedCoords[0])
            .addTo(mapLeft);

        // Vessel marker on RIGHT map - starts hidden, will appear when AIS phase begins
        if (isSplitScreen) {
            const velRight = document.createElement('div');
            velRight.className = 'ch7-vessel hidden';  // Hidden by default
            vesselMkrRight = new mapboxgl.Marker({ element: velRight, anchor: 'center' })
                .setLngLat(CONFIG.AIS_START)
                .addTo(mapRight);
        }

        // =========================================
        // DARK DETECTION MARKERS - FEODOSIA (11 markers, 1 sat image)
        // =========================================
        
        // Create all 11 Feodosia dark detection markers with different headings
        CONFIG.FEODOSIA_MARKERS.forEach((markerConfig, index) => {
            const darkEl = createDarkMarker('assets/svg/darkdetection.svg');
            const marker = new mapboxgl.Marker({ 
                element: darkEl, 
                anchor: 'center',
                rotation: markerConfig.rotation
            })
                .setLngLat(markerConfig.coords)
                .addTo(mapLeft);
            feodosiaMarkers.push(marker);
        });
        
        // Single satellite image popup for Feodosia (attached to first marker position)
        darkPopup1 = createImagePopup(
            CONFIG.DARK_IMG_1,
            CONFIG.DARK_IMG_1_PATH,
            'orange',
            CONFIG.DARK_IMG_1_OFFSET,
            mapLeft
        );
        
        // Show all Feodosia markers
        setTimeout(() => {
            feodosiaMarkers.forEach(m => showMarker(m));
            feodosiaMarkersShown = true;
        }, 200);

        // Create legend
        createLegend();

        // Start animation
        progress = 0;
        phase = 'assessed';
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

        if (phase === 'assessed') {
            animateAssessed(elapsed);
        } else if (phase === 'ais') {
            animateAIS(elapsed);
        }

        if (running) {
            animId = requestAnimationFrame(animate);
        }
    }

    function animateAssessed(elapsed) {
        const pct = Math.min(elapsed / CONFIG.ASSESSED_ANIMATION_DURATION, 1);

        // Update assessed track (dotted line) on LEFT map
        const pathCoords = buildAssessedPathUpTo(pct, assessedCoords);
        if (pathCoords.length >= 2) {
            const src = mapLeft.getSource(SOURCE_ASSESSED);
            if (src) {
                src.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: pathCoords }
                });
            }
            
            // SYNC: Also update assessed track on RIGHT map simultaneously
            if (isSplitScreen) {
                const srcRight = mapRight.getSource(SOURCE_ASSESSED_RIGHT);
                if (srcRight) {
                    srcRight.setData({
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: pathCoords }
                    });
                }
            }
        }

        // Update vessel position on LEFT map
        const currentPos = interpolateAssessedPath(pct, assessedCoords);
        if (vesselMkrLeft) vesselMkrLeft.setLngLat(currentPos);

        // Show Sevastopol markers (6 total) when vessel reaches ~50% of assessed path
        if (!sevastopolMarkersShown && pct >= 0.5) {
            sevastopolMarkersShown = true;
            
            // Create all 6 Sevastopol dark detection markers with different headings
            CONFIG.SEVASTOPOL_MARKERS.forEach((markerConfig, index) => {
                const darkEl = createDarkMarker('assets/svg/darkdetection.svg');
                const marker = new mapboxgl.Marker({ 
                    element: darkEl, 
                    anchor: 'center',
                    rotation: markerConfig.rotation
                })
                    .setLngLat(markerConfig.coords)
                    .addTo(mapLeft);
                sevastopolMarkers.push(marker);
            });
            
            // Single satellite image popup for Sevastopol (attached to first marker position)
            darkPopup2 = createImagePopup(
                CONFIG.DARK_IMG_2,
                CONFIG.DARK_IMG_2_PATH,
                'orange',
                CONFIG.DARK_IMG_2_OFFSET,
                mapLeft
            );
            
            // Show all Sevastopol markers
            setTimeout(() => {
                sevastopolMarkers.forEach(m => showMarker(m));
            }, 50);
        }

        if (pct >= 1) {
            // Complete assessed phase - ensure full path is drawn on BOTH maps
            const src = mapLeft.getSource(SOURCE_ASSESSED);
            if (src) {
                src.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: assessedCoords }
                });
            }
            
            // SYNC: Complete assessed track on right map too
            if (isSplitScreen) {
                const srcRight = mapRight.getSource(SOURCE_ASSESSED_RIGHT);
                if (srcRight) {
                    srcRight.setData({
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: assessedCoords }
                    });
                }
            }
            
            if (vesselMkrLeft) vesselMkrLeft.setLngLat(assessedCoords[assessedCoords.length - 1]);

            console.log('  Assessed track complete, starting AIS track...');

            // Transition to AIS phase after a short delay
            setTimeout(() => {
                phase = 'ais';
                progress = 0;
                startT = performance.now();
                
                // Show vessel on RIGHT map when AIS phase starts
                if (vesselMkrRight) {
                    vesselMkrRight.getElement().classList.remove('hidden');
                }
            }, CONFIG.PHASE_DELAY);
        }
    }

    function animateAIS(elapsed) {
        const pct = Math.min(elapsed / CONFIG.AIS_ANIMATION_DURATION, 1);
        const total = aisCoords.length;
        const idx = Math.floor(pct * (total - 1));

        if (idx > progress) {
            progress = idx;
            const currentCoord = aisCoords[progress];

            // Update AIS track (solid line) on RIGHT map
            const src = mapRight.getSource(SOURCE_AIS);
            if (src) {
                src.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: aisCoords.slice(0, progress + 1) }
                });
            }

            // Update vessel position on RIGHT map
            if (vesselMkrRight) vesselMkrRight.setLngLat(currentCoord);

            // Show HUMINT detection at Bosphorus (~15% through AIS track) on RIGHT map
            if (!humintMkrShown && pct >= 0.15) {
                humintMkrShown = true;
                const humintEl = createHumintMarker('assets/svg/humintdetection.svg');
                humintMkr = new mapboxgl.Marker({ element: humintEl, anchor: 'center' })
                    .setLngLat(CONFIG.HUMINT_MKR)
                    .addTo(mapRight);
                humintPopup = createImagePopup(
                    CONFIG.HUMINT_IMG,
                    CONFIG.HUMINT_IMG_PATH,
                    'amber',
                    CONFIG.HUMINT_IMG_OFFSET,
                    mapRight
                );
                setTimeout(() => {
                    showMarker(humintMkr);
                }, 50);
            }

            // Show light detection at El Dekheila (~90% through AIS track) on RIGHT map
            // SVG points right (3 o'clock), 12 o'clock = -90°
            if (!lightMkrShown && pct >= 0.90) {
                lightMkrShown = true;
                const lightEl = createLightMarker('assets/svg/lightdetection.svg');
                lightMkr = new mapboxgl.Marker({ element: lightEl, anchor: 'center', rotation: -90 })
                    .setLngLat(CONFIG.LIGHT_MKR)
                    .addTo(mapRight);
                lightPopup = createImagePopup(
                    CONFIG.LIGHT_IMG,
                    CONFIG.LIGHT_IMG_PATH,
                    'blue',
                    CONFIG.LIGHT_IMG_OFFSET,
                    mapRight
                );
                setTimeout(() => {
                    showMarker(lightMkr);
                }, 50);
            }
        }

        if (pct >= 1) {
            // Complete AIS phase
            const src = mapRight.getSource(SOURCE_AIS);
            if (src) {
                src.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: aisCoords }
                });
            }
            if (vesselMkrRight) vesselMkrRight.setLngLat(aisCoords[total - 1]);

            // Ensure all markers are shown (fallback) on RIGHT map
            if (!humintMkrShown) {
                const humintEl = createHumintMarker('assets/svg/humintdetection.svg');
                humintMkr = new mapboxgl.Marker({ element: humintEl, anchor: 'center' })
                    .setLngLat(CONFIG.HUMINT_MKR)
                    .addTo(mapRight);
                humintPopup = createImagePopup(
                    CONFIG.HUMINT_IMG,
                    CONFIG.HUMINT_IMG_PATH,
                    'amber',
                    CONFIG.HUMINT_IMG_OFFSET,
                    mapRight
                );
                showMarker(humintMkr);
            }

            if (!lightMkrShown) {
                const lightEl = createLightMarker('assets/svg/lightdetection.svg');
                lightMkr = new mapboxgl.Marker({ element: lightEl, anchor: 'center', rotation: -90 })
                    .setLngLat(CONFIG.LIGHT_MKR)
                    .addTo(mapRight);
                lightPopup = createImagePopup(
                    CONFIG.LIGHT_IMG,
                    CONFIG.LIGHT_IMG_PATH,
                    'blue',
                    CONFIG.LIGHT_IMG_OFFSET,
                    mapRight
                );
                showMarker(lightMkr);
            }

            phase = 'complete';
            running = false;
            console.log('  ✓ Animation complete (MATROS SHEVCHENKO)');
        }
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
            if (!running && aisCoords) {
                running = true;
                animate();
            }
        },
        getProgress: () => {
            if (!aisCoords) return 0;
            if (phase === 'assessed') return (progress / 100) * 0.3;
            if (phase === 'ais') return 0.3 + (progress / aisCoords.length) * 0.7;
            return 1;
        },
        isComplete: () => phase === 'complete'
    };
}

window.animateChapter7 = animateChapter7;
