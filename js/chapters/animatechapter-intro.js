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
        GEOJSON_PATH: 'data/global-shipping-routes.geojson',
        LANE_FADE_DURATION: 5000,

        LANE_COLORS: {
            core:       'rgba(255, 85, 100, 0.55)',
            bright:     'rgba(255, 65, 85, 0.35)',
            mid:        'rgba(255, 90, 110, 0.22)',
            soft:       'rgba(255, 50, 70, 0.14)',
            haze:       'rgba(255, 40, 60, 0.08)',
            atmosphere: 'rgba(255, 30, 50, 0.04)'
        }
    };

    // ============================================================================
    // STATE
    // ============================================================================

    let running = false;
    let animationFrameId = null;
    const timeouts = [];

    const SOURCE_LANES = 'intro-shipping-lanes';
    const LAYERS = [
        'intro-lanes-atmosphere',
        'intro-lanes-haze',
        'intro-lanes-soft',
        'intro-lanes-mid',
        'intro-lanes-bright',
        'intro-lanes-core'
    ];

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

            if (!map.getSource(SOURCE_LANES)) {
                map.addSource(SOURCE_LANES, {
                    type: 'geojson',
                    data: geojsonData
                });
            }

            const layerDefs = [
                { id: LAYERS[0], color: CONFIG.LANE_COLORS.atmosphere, width: 32, blur: 28 },
                { id: LAYERS[1], color: CONFIG.LANE_COLORS.haze,       width: 22, blur: 20 },
                { id: LAYERS[2], color: CONFIG.LANE_COLORS.soft,       width: 14, blur: 14 },
                { id: LAYERS[3], color: CONFIG.LANE_COLORS.mid,        width: 7,  blur: 7  },
                { id: LAYERS[4], color: CONFIG.LANE_COLORS.bright,     width: 3,  blur: 3  },
                { id: LAYERS[5], color: CONFIG.LANE_COLORS.core,       width: 1,  blur: 0.5 }
            ];

            layerDefs.forEach(def => {
                if (!map.getLayer(def.id)) {
                    map.addLayer({
                        id: def.id,
                        type: 'line',
                        source: SOURCE_LANES,
                        layout: { 'line-join': 'round', 'line-cap': 'round' },
                        paint: {
                            'line-color': def.color,
                            'line-width': def.width,
                            'line-blur': def.blur,
                            'line-opacity': 0
                        }
                    });
                }
            });

            // Animate lanes fading in
            animateLanesFadeIn();

        } catch (e) {
            console.warn('[Intro] Error loading shipping lanes:', e);
        }
    }

    function animateLanesFadeIn() {
        const startTime = performance.now();
        const duration = CONFIG.LANE_FADE_DURATION;

        // Target opacities per layer (outer → inner)
        const targets = [0.5, 0.6, 0.65, 0.6, 0.7, 0.8];

        function animate() {
            if (!running) return;

            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);

            try {
                LAYERS.forEach((id, i) => {
                    if (map.getLayer(id)) {
                        map.setPaintProperty(id, 'line-opacity', eased * targets[i]);
                    }
                });
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

        try {
            [...LAYERS].reverse().forEach(id => {
                if (map.getLayer(id)) map.removeLayer(id);
            });
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
