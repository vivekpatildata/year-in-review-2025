// ============================================================================
// CHAPTER: INTRO - 2025 Global Maritime Intelligence
// Purpose: Beautiful visualization of real shipping lane data
// Animation: Fuzzy red-glowing shipping lanes from geojson data
// ============================================================================

function animateChapterIntro(map, chapterConfig) {
    console.log('[Intro] Initializing - Loading shipping lane data');

    // ============================================================================
    // CONFIGURATION
    // ============================================================================

    const CONFIG = {
        // GeoJSON data path
        GEOJSON_PATH: 'data/cleaned-2023-ustoasia-jan-august.geojson',

        // Animation timing
        LANE_FADE_DURATION: 4000,

        // Visual settings - RED fuzzy glow palette
        LANE_COLORS: {
            bright: 'rgba(255, 70, 90, 0.6)',
            primary: 'rgba(255, 90, 110, 0.4)',
            secondary: 'rgba(255, 110, 130, 0.3)',
            glow: 'rgba(255, 50, 70, 0.2)',
            outerGlow: 'rgba(255, 40, 60, 0.1)'
        }
    };

    // ============================================================================
    // STATE
    // ============================================================================

    let running = false;
    let animationFrameId = null;
    const timeouts = [];

    const SOURCE_LANES = 'intro-shipping-lanes';
    const LAYER_LANES_OUTER_GLOW = 'intro-lanes-outer-glow';
    const LAYER_LANES_GLOW = 'intro-lanes-glow';
    const LAYER_LANES_MAIN = 'intro-lanes-main';
    const LAYER_LANES_BRIGHT = 'intro-lanes-bright';

    // ============================================================================
    // ANTIMERIDIAN CROSSING FIX
    // Split lines that cross the 180° meridian to avoid drawing through land
    // ============================================================================

    function splitLineStringAtAntimeridian(coordinates) {
        let segments = [];
        let currentSegment = [];

        for (let i = 0; i < coordinates.length - 1; i++) {
            const [lon1, lat1] = coordinates[i];
            const [lon2, lat2] = coordinates[i + 1];

            currentSegment.push([lon1, lat1]);

            // Check if the line crosses the antimeridian (longitude difference > 180°)
            if (Math.abs(lon2 - lon1) > 180) {
                // End the current segment at the antimeridian
                segments.push(currentSegment);
                currentSegment = [];
            }
        }

        // Push the last coordinate and segment
        currentSegment.push(coordinates[coordinates.length - 1]);
        segments.push(currentSegment);

        return segments;
    }

    function processGeoJsonData(data) {
        let allSegments = [];

        data.features.forEach(feature => {
            if (feature.geometry.type === 'LineString') {
                const splitSegments = splitLineStringAtAntimeridian(feature.geometry.coordinates);
                splitSegments.forEach(segment => {
                    // Only add segments with at least 2 points
                    if (segment.length >= 2) {
                        allSegments.push({
                            type: 'Feature',
                            geometry: {
                                type: 'LineString',
                                coordinates: segment
                            },
                            properties: feature.properties
                        });
                    }
                });
            }
        });

        return {
            type: 'FeatureCollection',
            features: allSegments
        };
    }

    // ============================================================================
    // SHIPPING LANES VISUALIZATION
    // ============================================================================

    async function loadAndAddShippingLanes() {
        try {
            // Load the geojson file
            const response = await fetch(CONFIG.GEOJSON_PATH);
            if (!response.ok) {
                throw new Error(`Failed to load geojson: ${response.status}`);
            }
            const rawData = await response.json();

            // Process data to split lines at antimeridian
            const geojsonData = processGeoJsonData(rawData);

            console.log(`[Intro] Loaded ${rawData.features?.length || 0} routes, split into ${geojsonData.features.length} segments`);

            // Add source
            if (!map.getSource(SOURCE_LANES)) {
                map.addSource(SOURCE_LANES, {
                    type: 'geojson',
                    data: geojsonData
                });
            }

            // Layer 1: Outer fuzzy glow (very wide, very blurred)
            if (!map.getLayer(LAYER_LANES_OUTER_GLOW)) {
                map.addLayer({
                    id: LAYER_LANES_OUTER_GLOW,
                    type: 'line',
                    source: SOURCE_LANES,
                    paint: {
                        'line-color': CONFIG.LANE_COLORS.outerGlow,
                        'line-width': 20,
                        'line-blur': 18,
                        'line-opacity': 0
                    }
                });
            }

            // Layer 2: Wide glow
            if (!map.getLayer(LAYER_LANES_GLOW)) {
                map.addLayer({
                    id: LAYER_LANES_GLOW,
                    type: 'line',
                    source: SOURCE_LANES,
                    paint: {
                        'line-color': CONFIG.LANE_COLORS.glow,
                        'line-width': 12,
                        'line-blur': 12,
                        'line-opacity': 0
                    }
                });
            }

            // Layer 3: Main lane body
            if (!map.getLayer(LAYER_LANES_MAIN)) {
                map.addLayer({
                    id: LAYER_LANES_MAIN,
                    type: 'line',
                    source: SOURCE_LANES,
                    paint: {
                        'line-color': CONFIG.LANE_COLORS.secondary,
                        'line-width': 4,
                        'line-blur': 4,
                        'line-opacity': 0
                    }
                });
            }

            // Layer 4: Bright center line
            if (!map.getLayer(LAYER_LANES_BRIGHT)) {
                map.addLayer({
                    id: LAYER_LANES_BRIGHT,
                    type: 'line',
                    source: SOURCE_LANES,
                    paint: {
                        'line-color': CONFIG.LANE_COLORS.bright,
                        'line-width': 1.5,
                        'line-blur': 1,
                        'line-opacity': 0
                    }
                });
            }

            // Animate lanes fading in
            animateLanesFadeIn();

        } catch (e) {
            console.warn('[Intro] Error loading shipping lanes:', e);
        }
    }

    function animateLanesFadeIn() {
        const startTime = performance.now();
        const duration = CONFIG.LANE_FADE_DURATION;

        function animate() {
            if (!running) return;

            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Smooth ease-out curve
            const eased = 1 - Math.pow(1 - progress, 4);

            try {
                if (map.getLayer(LAYER_LANES_OUTER_GLOW)) {
                    map.setPaintProperty(LAYER_LANES_OUTER_GLOW, 'line-opacity', eased * 0.6);
                }
                if (map.getLayer(LAYER_LANES_GLOW)) {
                    map.setPaintProperty(LAYER_LANES_GLOW, 'line-opacity', eased * 0.7);
                }
                if (map.getLayer(LAYER_LANES_MAIN)) {
                    map.setPaintProperty(LAYER_LANES_MAIN, 'line-opacity', eased * 0.6);
                }
                if (map.getLayer(LAYER_LANES_BRIGHT)) {
                    map.setPaintProperty(LAYER_LANES_BRIGHT, 'line-opacity', eased * 0.8);
                }
            } catch (e) { /* ignore */ }

            if (progress < 1 && running) {
                animationFrameId = requestAnimationFrame(animate);
            }
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    // ============================================================================
    // CLEANUP
    // ============================================================================

    function cleanup() {
        console.log('[Intro] Cleanup');
        running = false;

        // Cancel animation frame
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        // Clear timeouts
        timeouts.forEach(id => clearTimeout(id));
        timeouts.length = 0;

        // Reset text highlights
        clearHighlights();

        // Remove map layers/sources
        try {
            if (map.getLayer(LAYER_LANES_BRIGHT)) map.removeLayer(LAYER_LANES_BRIGHT);
            if (map.getLayer(LAYER_LANES_MAIN)) map.removeLayer(LAYER_LANES_MAIN);
            if (map.getLayer(LAYER_LANES_GLOW)) map.removeLayer(LAYER_LANES_GLOW);
            if (map.getLayer(LAYER_LANES_OUTER_GLOW)) map.removeLayer(LAYER_LANES_OUTER_GLOW);
            if (map.getSource(SOURCE_LANES)) map.removeSource(SOURCE_LANES);
        } catch (e) { /* ignore */ }
    }

    // ============================================================================
    // SHOW MAIN
    // ============================================================================

    // ============================================================================
    // TEXT HIGHLIGHT ANIMATION
    // ============================================================================

    function triggerHighlights() {
        const highlights = document.querySelectorAll('.intro-highlight');
        if (!highlights.length) return;

        // Add 'active' class — CSS transition-delay handles the stagger
        const tid = setTimeout(() => {
            if (!running) return;
            highlights.forEach(el => el.classList.add('active'));
            console.log(`[Intro] Triggered ${highlights.length} text highlights`);
        }, 600); // small delay so card is visible first
        timeouts.push(tid);
    }

    function clearHighlights() {
        const highlights = document.querySelectorAll('.intro-highlight');
        highlights.forEach(el => el.classList.remove('active'));
    }

    function showMain() {
        console.log('[Intro] Starting shipping lanes visualization');
        cleanup();
        running = true;

        // Load and display lanes
        const tid = setTimeout(() => {
            if (running) loadAndAddShippingLanes();
        }, 300);
        timeouts.push(tid);

        // Trigger text highlights
        triggerHighlights();
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        showMain,
        cleanup,
        stop: cleanup,
        getProgress: () => 0,
        isComplete: () => false
    };
}

window.animateChapterIntro = animateChapterIntro;
