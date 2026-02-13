// ============================================================================
// CHAPTER 10 ANIMATION - LNG PHECDA: Critical Infrastructure Loitering
// Story: LNG PHECDA, a Hong Kong-flagged LNG carrier jointly owned by Japan's
// MOL and China's COSCO, serves the Yamal LNG supply chain. After loading at
// Sabetta in the Russian Arctic, the vessel transited south through European
// waters, exhibiting suspicious loitering over critical sub-sea cables in the
// Irish Sea and Bay of Biscay.
//
// Cinematic Camera: Opens with wide Arctic overview (showing Russia/Yamal),
// then auto-zooms into the English Channel/Irish Sea as the track animates,
// syncing the loitering reveal with the camera arrival.
// ============================================================================

function animateChapter10(map, chapterConfig) {
    console.log('Chapter 10: Init - LNG PHECDA Critical Infrastructure Loitering');

    // ============================================================================
    // CUSTOMIZATION OPTIONS
    // ============================================================================

    const CONFIG = {
        // --- COLORS (neon green matching all other chapters) ---
        TRACK_COLOR: '#00ff88',
        TRACK_GLOW: '#00ff88',

        // Cable type colors (distinct from vessel track)
        CABLE_TELECOM: '#00a3e3',         // Bright cyan-blue
        CABLE_ELECTRICITY: '#ff9f43',     // Warm amber/orange

        // --- ANIMATION TIMING ---
        ROUTE_DURATION: 8000,
        CAMERA_OVERVIEW_DELAY: 1200,
        CAMERA_ZOOM_START: 1500,
        CAMERA_ZOOM_DURATION: 2500,
        MARKER_SHOW_DELAY: 2000,

        // --- MARKER SIZES ---
        MARKER_SIZE: 40,
        VESSEL_SIZE: 14,

        // --- CAMERA POSITIONS ---
        ARCTIC_OVERVIEW: {
            center: [54.87, 64.99],
            zoom: 2.1,
            pitch: 0,
            bearing: 0
        },
        IRISH_SEA_FOCUS: {
            center: [-0.542, 53.936],
            zoom: 5.5,
            pitch: 0,
            bearing: 0
        },

        // --- SAR DETECTION ---
        SAR_DET: [-4.379010, 53.707914],
        SAR_IMAGE: 'images/chapter10/chapter10A.png',
        SAR_OFFSET: [200, 150],

        // --- IMAGE SETTINGS ---
        IMG_WIDTH: 220,
    };

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    const SOURCE_TRACK = 'ch10-track-src';
    const LAYER_TRACK = 'ch10-track-line';
    const LAYER_GLOW = 'ch10-track-glow';
    const SOURCE_CABLES = 'ch10-cables-src';
    const LAYER_CABLES = 'ch10-cables-line';
    const LAYER_CABLES_GLOW = 'ch10-cables-glow';

    let coords = null;
    let total = 0;
    let animId = null;
    let progress = 0;
    let startT = null;
    let running = false;

    // Markers
    let vesselMkr = null;
    let sarMarker = null;
    let sarPopup = null;
    let sarShown = false;
    let cablesLoaded = false;
    let yamalMkr = null;

    let pendingTimeouts = [];

    // ============================================================================
    // INJECT STYLES
    // ============================================================================

    if (!document.getElementById('ch10-css')) {
        const css = document.createElement('style');
        css.id = 'ch10-css';
        css.textContent = `
            /* === VESSEL MARKER === */
            .ch10-vessel {
                width: ${CONFIG.VESSEL_SIZE}px;
                height: ${CONFIG.VESSEL_SIZE}px;
                background: ${CONFIG.TRACK_COLOR};
                border: 0px solid #fff;
                border-radius: 50%;
                box-shadow: 0 0 15px ${CONFIG.TRACK_COLOR}, 0 0 30px ${CONFIG.TRACK_COLOR}40;
            }

            /* === YAMAL LNG TERMINAL MARKER (Yellow Dot + Label) === */
            .ch10-terminal-marker {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                pointer-events: none;
                z-index: 1000;
            }
            .ch10-terminal-dot {
                width: 10px;
                height: 10px;
                background: #ffa500;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(255, 165, 0, 0.8),
                            0 0 20px rgba(255, 165, 0, 0.5),
                            0 0 30px rgba(255, 165, 0, 0.3);
                animation: ch10-terminal-pulse 2s ease-in-out infinite;
            }
            @keyframes ch10-terminal-pulse {
                0%, 100% {
                    box-shadow: 0 0 10px rgba(255, 165, 0, 0.8), 0 0 20px rgba(255, 165, 0, 0.5);
                    transform: scale(1);
                }
                50% {
                    box-shadow: 0 0 15px rgba(255, 165, 0, 1), 0 0 30px rgba(255, 165, 0, 0.7);
                    transform: scale(1.1);
                }
            }
            .ch10-terminal-label {
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

            /* === LIGHT DETECTION MARKER (White Tint Glow) === */
            .ch10-light-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
            }
            .ch10-light-marker:hover {
                transform: scale(1.15);
            }
            .ch10-light-marker img {
                width: ${CONFIG.MARKER_SIZE}px;
                height: auto;
                animation: ch10-glow-white 2s ease-in-out infinite;
            }
            @keyframes ch10-glow-white {
                0%, 100% {
                    filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.9))
                            drop-shadow(0 0 22px rgba(255, 213, 0, 0.8))
                            drop-shadow(0 0 35px rgba(255, 180, 50, 0.5));
                }
                50% {
                    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 1))
                            drop-shadow(0 0 35px rgba(255, 213, 0, 1))
                            drop-shadow(0 0 50px rgba(255, 180, 50, 0.7));
                }
            }

            /* === POPUP BASE === */
            .ch10-pop .mapboxgl-popup-tip { display: none !important; }
            .ch10-pop .mapboxgl-popup-content {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
                outline: none !important;
            }

            /* === SATELLITE IMAGE (White Tint Glow) === */
            .ch10-img-holder {
                position: relative;
                display: inline-block;
                padding: 0 !important;
                margin: 0 !important;
                border-radius: 10px;
                background: transparent !important;
                border: none !important;
                outline: none !important;
                overflow: hidden;
                box-shadow:
                    0 0 15px rgba(255, 255, 255, 0.5),
                    0 0 30px rgba(255, 213, 0, 0.4),
                    0 0 50px rgba(255, 180, 50, 0.25);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                animation: ch10-img-glow 2.5s ease-in-out infinite;
            }
            @keyframes ch10-img-glow {
                0%, 100% {
                    box-shadow:
                        0 0 15px rgba(255, 255, 255, 0.5),
                        0 0 30px rgba(255, 213, 0, 0.4),
                        0 0 50px rgba(255, 180, 50, 0.25);
                }
                50% {
                    box-shadow:
                        0 0 25px rgba(255, 255, 255, 0.7),
                        0 0 45px rgba(255, 213, 0, 0.5),
                        0 0 70px rgba(255, 180, 50, 0.35);
                }
            }
            .ch10-img-holder:hover {
                transform: scale(1.03);
                box-shadow:
                    0 0 25px rgba(255, 255, 255, 0.7),
                    0 0 45px rgba(255, 213, 0, 0.5),
                    0 0 70px rgba(255, 180, 50, 0.35);
            }
            .ch10-sat-img {
                display: block;
                width: ${CONFIG.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            /* === RESPONSIVE - TABLET === */
            @media (max-width: 1024px) {
                .ch10-light-marker img { width: ${Math.round(CONFIG.MARKER_SIZE * 0.9)}px; }
                .ch10-sat-img { width: ${Math.round(CONFIG.IMG_WIDTH * 0.85)}px; }
            }

            /* === RESPONSIVE - MOBILE === */
            @media (max-width: 768px) {
                .ch10-light-marker img { width: ${Math.round(CONFIG.MARKER_SIZE * 0.8)}px; }
                .ch10-sat-img { width: ${Math.round(CONFIG.IMG_WIDTH * 0.7)}px; }
            }

            /* === RESPONSIVE - SMALL MOBILE === */
            @media (max-width: 480px) {
                .ch10-light-marker img { width: ${Math.round(CONFIG.MARKER_SIZE * 0.7)}px; }
                .ch10-sat-img { width: ${Math.round(CONFIG.IMG_WIDTH * 0.55)}px; }
                .ch10-vessel { width: ${Math.round(CONFIG.VESSEL_SIZE * 0.8)}px; height: ${Math.round(CONFIG.VESSEL_SIZE * 0.8)}px; }
                .ch10-img-holder {
                    box-shadow:
                        0 0 10px rgba(255, 255, 255, 0.4),
                        0 0 20px rgba(255, 213, 0, 0.3),
                        0 0 35px rgba(255, 180, 50, 0.2);
                }
            }
        `;
        document.head.appendChild(css);
    }

    // ============================================================================
    // HELPERS
    // ============================================================================

    function safeSetTimeout(fn, delay) {
        const id = setTimeout(() => {
            pendingTimeouts = pendingTimeouts.filter(t => t !== id);
            fn();
        }, delay);
        pendingTimeouts.push(id);
        return id;
    }

    function clearPendingTimeouts() {
        pendingTimeouts.forEach(id => { try { clearTimeout(id); } catch(e) {} });
        pendingTimeouts = [];
    }

    function clearLayers() {
        [LAYER_GLOW, LAYER_TRACK, LAYER_CABLES_GLOW, LAYER_CABLES].forEach(id => {
            try { if (map.getLayer(id)) map.removeLayer(id); } catch(e) {}
        });
        [SOURCE_TRACK, SOURCE_CABLES].forEach(id => {
            try { if (map.getSource(id)) map.removeSource(id); } catch(e) {}
        });
    }

    function clearMarkers() {
        if (vesselMkr) { vesselMkr.remove(); vesselMkr = null; }
        if (sarMarker) { sarMarker.remove(); sarMarker = null; }
        if (sarPopup) { sarPopup.remove(); sarPopup = null; }
        if (yamalMkr) { yamalMkr.remove(); yamalMkr = null; }
        sarShown = false;
        // DOM fallback for terminal marker
        document.querySelectorAll('.ch10-terminal-marker').forEach(el => {
            const wrapper = el.closest('.mapboxgl-marker');
            if (wrapper) wrapper.remove();
            else el.remove();
        });
    }

    function stopAnim() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        running = false;
    }

    function clearAll() {
        clearPendingTimeouts();
        stopAnim();
        clearMarkers();
        clearLayers();
        cablesLoaded = false;
        progress = 0;
    }

    // ============================================================================
    // LOAD DATA
    // ============================================================================

    async function loadData() {
        if (coords) return true;
        try {
            const res = await fetch('data/chapter10-lng-phecda-extended.geojson');
            const data = await res.json();
            let coordinates;
            if (data.type === 'FeatureCollection' && data.features?.[0]?.geometry?.coordinates) {
                coordinates = data.features[0].geometry.coordinates;
            } else if (data.type === 'Feature' && data.geometry?.coordinates) {
                coordinates = data.geometry.coordinates;
            }
            if (coordinates && coordinates.length) {
                coords = coordinates;
                total = coords.length;
                console.log(`  ✓ ${total} points loaded for LNG PHECDA (from Oct 16)`);
                return true;
            }
        } catch(e) { console.error('Ch10 load error:', e); }
        return false;
    }

    // ============================================================================
    // CABLE LAYERS — colored by cable_type property
    // ============================================================================

    async function loadCables() {
        if (cablesLoaded) return;
        try {
            const res = await fetch('data/chapter10-cables-all.json');
            const cablesData = await res.json();

            map.addSource(SOURCE_CABLES, {
                type: 'geojson',
                data: cablesData
            });

            // Cable glow — uses the color property baked into each feature
            map.addLayer({
                id: LAYER_CABLES_GLOW,
                type: 'line',
                source: SOURCE_CABLES,
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': 6,
                    'line-opacity': 0.15,
                    'line-blur': 4
                }
            });

            // Cable lines — uses the color property baked into each feature
            map.addLayer({
                id: LAYER_CABLES,
                type: 'line',
                source: SOURCE_CABLES,
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': 2,
                    'line-opacity': 0.6
                }
            });

            cablesLoaded = true;
            console.log('  ✓ Sub-sea cables loaded (telecom + electricity, color-coded)');
        } catch(e) {
            console.warn('  Could not load cables:', e);
        }
    }

    // ============================================================================
    // SAR DETECTION + SAT IMAGE
    // ============================================================================

    function showSarDetection() {
        if (sarShown) return;
        sarShown = true;
        console.log('  Light Detection: LNG PHECDA over sub-sea cables');

        // Light detection marker with white tint glow
        const el = document.createElement('div');
        el.className = 'ch10-light-marker';
        el.innerHTML = `<img src="assets/svg/lightdetection.svg" alt="Light Detection">`;
        sarMarker = new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat(CONFIG.SAR_DET)
            .addTo(map);

        // Sat image popup (no number badge)
        sarPopup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch10-pop',
            offset: CONFIG.SAR_OFFSET
        })
            .setLngLat(CONFIG.SAR_DET)
            .setHTML(`
                <div class="ch10-img-holder">
                    <img class="ch10-sat-img" src="${CONFIG.SAR_IMAGE}"
                         onerror="this.parentElement.style.display='none';">
                </div>
            `)
            .addTo(map);
    }

    // ============================================================================
    // SHOW MAIN — Cinematic Camera + Track Animation
    // ============================================================================

    async function showMain() {
        console.log('  → showMain (LNG PHECDA - Cinematic Arctic → Irish Sea)');
        clearAll();

        await loadData();
        if (!coords || !coords.length) {
            console.error('No coordinates loaded for Chapter 10');
            return;
        }

        // =============================================
        // PHASE 1: Jump to Arctic overview immediately
        // =============================================
        map.jumpTo({
            center: CONFIG.ARCTIC_OVERVIEW.center,
            zoom: CONFIG.ARCTIC_OVERVIEW.zoom,
            pitch: CONFIG.ARCTIC_OVERVIEW.pitch,
            bearing: CONFIG.ARCTIC_OVERVIEW.bearing
        });
        console.log('  Phase 1: Arctic overview (Yamal/Russia)');

        // Place Yamal LNG Terminal marker immediately on Arctic overview
        const yamalEl = document.createElement('div');
        yamalEl.className = 'ch10-terminal-marker';
        yamalEl.innerHTML = `
            <div class="ch10-terminal-dot"></div>
            <div class="ch10-terminal-label">YAMAL LNG TERMINAL</div>
        `;
        yamalMkr = new mapboxgl.Marker({ element: yamalEl, anchor: 'top' })
            .setLngLat([72.2426, 71.2884])
            .addTo(map);

        // Add track source (empty, will animate)
        map.addSource(SOURCE_TRACK, {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [coords[0]] } }
        });

        map.addLayer({
            id: LAYER_GLOW, type: 'line', source: SOURCE_TRACK,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': CONFIG.TRACK_GLOW, 'line-width': 10, 'line-opacity': 0.35, 'line-blur': 5 }
        });

        map.addLayer({
            id: LAYER_TRACK, type: 'line', source: SOURCE_TRACK,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': CONFIG.TRACK_COLOR, 'line-width': 3, 'line-opacity': 0.95 }
        });

        // Vessel marker at start (Arctic)
        const vel = document.createElement('div');
        vel.className = 'ch10-vessel';
        vesselMkr = new mapboxgl.Marker({ element: vel, anchor: 'center' })
            .setLngLat(coords[0]).addTo(map);

        // =============================================
        // PHASE 2: After overview delay, start track animation
        // =============================================
        safeSetTimeout(() => {
            if (!coords) return;
            console.log('  Phase 2: Starting route animation from Arctic');

            // Start the track animation
            progress = 0;
            running = true;
            startT = performance.now();
            animateRoute();

            // =============================================
            // PHASE 3: Zoom into English Channel / Irish Sea
            // Load cables during the zoom so they appear as camera arrives
            // =============================================
            safeSetTimeout(() => {
                if (!coords) return;
                console.log('  Phase 3: Zooming to Irish Sea / English Channel');

                // Load cables just before zoom arrives
                loadCables();

                map.flyTo({
                    center: CONFIG.IRISH_SEA_FOCUS.center,
                    zoom: CONFIG.IRISH_SEA_FOCUS.zoom,
                    pitch: CONFIG.IRISH_SEA_FOCUS.pitch,
                    bearing: CONFIG.IRISH_SEA_FOCUS.bearing,
                    duration: CONFIG.CAMERA_ZOOM_DURATION,
                    essential: true,
                    curve: 1.2
                });

                // =============================================
                // PHASE 4: After camera settles, show SAR detection
                // =============================================
                safeSetTimeout(() => {
                    if (!coords) return;
                    console.log('  Phase 4: Camera settled — showing SAR detection');

                    // Show SAR detection after a brief pause
                    safeSetTimeout(() => {
                        showSarDetection();
                    }, CONFIG.MARKER_SHOW_DELAY);

                }, CONFIG.CAMERA_ZOOM_DURATION + 500);

            }, CONFIG.CAMERA_ZOOM_START);

        }, CONFIG.CAMERA_OVERVIEW_DELAY);
    }

    // ============================================================================
    // ANIMATE ROUTE — runs continuously from Arctic to Irish Sea
    // ============================================================================

    function animateRoute() {
        if (!running || !coords) return;

        const elapsed = performance.now() - startT;
        const pct = Math.min(elapsed / CONFIG.ROUTE_DURATION, 1);
        const idx = Math.floor(pct * (total - 1));

        if (idx > progress) {
            progress = idx;

            const src = map.getSource(SOURCE_TRACK);
            if (src) {
                src.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: coords.slice(0, progress + 1) }
                });
            }

            if (vesselMkr) vesselMkr.setLngLat(coords[progress]);
        }

        if (pct < 1) {
            animId = requestAnimationFrame(animateRoute);
        } else {
            // Complete — ensure full track drawn
            const src = map.getSource(SOURCE_TRACK);
            if (src) {
                src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } });
            }
            if (vesselMkr) vesselMkr.setLngLat(coords[total - 1]);

            // Ensure everything is shown
            if (!cablesLoaded) loadCables();
            if (!sarShown) showSarDetection();

            running = false;
            console.log('  ✓ Chapter 10 animation complete');
        }
    }

    // ============================================================================
    // CLEANUP
    // ============================================================================

    function cleanup() {
        console.log('  Ch10 cleanup');
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
                startT = performance.now() - (progress / total) * CONFIG.ROUTE_DURATION;
                animateRoute();
            }
        },
        getProgress: () => total ? progress / total : 0,
        isComplete: () => progress >= total - 1
    };
}

window.animateChapter10 = animateChapter10;
