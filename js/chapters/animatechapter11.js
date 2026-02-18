// ============================================================================
// CHAPTER 11 ANIMATION - DUNE & STELLAR ORACLE: Identity Spoofing
// Three-phase animation: Main (DUNE assessed path) + H1 (DUNE+KSECOND STS) + H2 (SINCON)
// Features: Numbered markers (1-5), vessel color changes, annotation with connecting line
// ============================================================================

function animateChapter11(map, chapterConfig) {
    console.log('Chapter 11: Init - DUNE & STELLAR ORACLE');

    // ============================================================================
    // CUSTOMIZATION OPTIONS
    // ============================================================================

    const CONFIG = {
        // --- COLORS ---
        DUNE_COLOR: '#00ff88',           // Green for DUNE AIS track
        KSECOND_COLOR: '#6cb4ee',         // Soft Blue for KSECOND/STELLAR ORACLE
        SINCON_COLOR: '#a78bfa',          // Soft Violet for SINCON (different identity)
        ASSESSED_COLOR: '#00ff88',        // Green for assessed path (dotted)

        // --- ANIMATION TIMING ---
        ASSESSED_ANIMATION_DURATION: 4000,  // Assessed path animation (ms)
        H1_ANIMATION_DURATION: 2000,        // Much faster H1 animation (ms)
        H2_ANIMATION_DURATION: 2000,        // Fast H2 animation (ms)
        MARKER_DELAY: 300,                  // Delay between marker appearances

        // --- SVG MARKER SIZE ---
        MARKER_SIZE: 40,

        // --- NUMBER MARKER COLORS ---
        NUMBER_BORDER_COLOR: '#00ff88',      // Green border for numbered markers
        NUMBER_GLOW_COLOR: 'rgba(0, 255, 136, 0.4)',

        // --- MAIN SCROLL: Detection #1 at Jask (only sat image in main scroll) ---
        DET_1: [57.2409, 25.8466],
        DET_1_IMAGE: 'images/chapter11/chapter11A.png',
        DET_1_OFFSET: [200, 50],
        DET_1_LABEL: '23 Jul 2025',
        DET_1_SUBLABEL: 'Dark loading detected at Jask, Iran',

        // --- H1 SCROLL: Detection #2 (sat image) and #3 (sat image) ---

        // Detection 2: Light Detection in Malacca Strait - has sat image
        DET_2: [101.2952, 2.6322],
        DET_2_IMAGE: 'images/chapter11/chapter11B.png',
        DET_2_OFFSET: [-100, 260],
        DET_2_LABEL: 'Sep 2025',
        DET_2_SUBLABEL: 'DUNE detected in Malacca Strait',

        // Detection 3: STS with KSECOND (STELLAR ORACLE) - Yellow glow, has sat image
        DET_3: [104.7441, 2.0160],
        DET_3_IMAGE: 'images/chapter11/chapter11C.png',
        DET_3_OFFSET: [140, 230],
        DET_3_LABEL: '23 Sep 2025',
        DET_3_SUBLABEL: 'STS between DUNE and STELLAR ORACLE',

        // Detection 4: Light Detection near Ho Chi Minh - WITH sat image
        DET_4: [109.4054, 8.4894],
        DET_4_IMAGE: 'images/chapter11/chapter11D.png',
        DET_4_OFFSET: [200, 100],
        DET_4_LABEL: 'Oct 2025',
        DET_4_SUBLABEL: 'STELLAR ORACLE detected near Vietnam',

        // --- H2 SCROLL: Detection #5 ---

        // Transmission Change marker location (near Taiwan) - NO sat image here now
        TRANS_CHANGE: [122.116583, 22.449917],

        // Detection 5: Light Detection near Jiangsu, China - has sat image
        DET_5: [124.1191, 34.0337],
        DET_5_IMAGE: 'images/chapter11/chapter11E.png',
        DET_5_OFFSET: [200, 100],
        DET_5_LABEL: 'Nov 2025',
        DET_5_SUBLABEL: 'SINCON detected in Yellow Sea',

        // --- IMAGE PLACEHOLDER SETTINGS ---
        IMG_WIDTH: 220,
        IMG_HEIGHT: 140,

        // --- ANNOTATION SETTINGS ---
        ANNOTATION_LINE_COLOR: '#ff9d00',  // Mango color for annotation line
    };

    // ============================================================================
    // STATE
    // ============================================================================

    // Sources and layers
    const SOURCE_ASSESSED = 'ch11-assessed-src';
    const LAYER_ASSESSED = 'ch11-assessed-line';

    const SOURCE_DUNE = 'ch11-dune-src';
    const LAYER_DUNE = 'ch11-dune-line';
    const LAYER_DUNE_GLOW = 'ch11-dune-glow';

    const SOURCE_KSECOND = 'ch11-ksecond-src';
    const LAYER_KSECOND = 'ch11-ksecond-line';
    const LAYER_KSECOND_GLOW = 'ch11-ksecond-glow';

    const SOURCE_SINCON = 'ch11-sincon-src';
    const LAYER_SINCON = 'ch11-sincon-line';
    const LAYER_SINCON_GLOW = 'ch11-sincon-glow';

    // Connector line from KSECOND end to SINCON start (fills the gap)
    const SOURCE_CONNECTOR = 'ch11-connector-src';
    const LAYER_CONNECTOR = 'ch11-connector-line';
    const LAYER_CONNECTOR_GLOW = 'ch11-connector-glow';

    // Data
    let assessedCoords = null;
    let duneCoords = null;
    let ksecondCoords = null;
    let sinconCoords = null;

    // Animation state
    let animId = null;
    let progress = 0;
    let startT = null;
    let running = false;
    let phase = 'main';  // 'main' -> 'h1' -> 'h2' -> 'complete'

    // Markers and popups
    let markers = [];
    let popups = [];
    let numberMarkers = [];

    // Track which detections have been shown
    let det1Shown = false;
    let det2Shown = false;
    let det3Shown = false;
    let det4Shown = false;
    let transChangeShown = false;
    let det5Shown = false;

    // H1 sub-phases
    let h1Phase = 'dune';  // 'dune' -> 'ksecond' -> 'complete'
    let ksecondStartT = null;

    // Track all pending timeouts for cleanup during fast scrolling
    let pendingTimeouts = [];

    // ============================================================================
    // INJECT STYLES
    // ============================================================================

    if (!document.getElementById('ch11-css')) {
        const css = document.createElement('style');
        css.id = 'ch11-css';
        css.textContent = `
            /* === SVG MARKER BASE === */
            .ch11-svg-marker {
                cursor: pointer;
                transition: transform 0.3s ease, opacity 0.4s ease;
                opacity: 0;
            }
            .ch11-svg-marker.visible {
                opacity: 1;
            }
            .ch11-svg-marker:hover {
                transform: scale(1.15);
            }
            .ch11-svg-marker img {
                width: ${CONFIG.MARKER_SIZE}px;
                height: auto;
                filter: drop-shadow(0 0 8px rgba(0,0,0,0.6));
            }

            /* === NUMBER MARKERS (like Chapter 12) === */
            .ch11-number-marker {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: rgba(17, 19, 38, 0.95);
                border: 2px solid ${CONFIG.NUMBER_BORDER_COLOR};
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                font-weight: 700;
                color: ${CONFIG.NUMBER_BORDER_COLOR};
                box-shadow: 0 0 12px ${CONFIG.NUMBER_GLOW_COLOR};
                opacity: 0;
                transition: opacity 0.4s ease, transform 0.3s ease;
            }
            .ch11-number-marker.visible {
                opacity: 1;
            }
            .ch11-number-marker:hover {
                transform: scale(1.1);
            }

            /* === DARK DETECTION MARKER (Red Glow) === */
            .ch11-dark-marker img {
                filter: drop-shadow(0 0 10px rgba(227, 66, 66, 0.8))
                        drop-shadow(0 0 18px rgba(227, 66, 66, 0.5));
            }

            /* === LIGHT DETECTION MARKER (Blue Glow) === */
            .ch11-light-marker img {
                filter: drop-shadow(0 0 10px rgba(0, 163, 227, 0.8))
                        drop-shadow(0 0 18px rgba(0, 163, 227, 0.5));
            }

            /* === STS MARKER (Yellow Glow) === */
            .ch11-sts-marker img {
                filter: drop-shadow(0 0 12px rgba(255, 213, 0, 0.9))
                        drop-shadow(0 0 20px rgba(255, 213, 0, 0.6))
                        drop-shadow(0 0 30px rgba(255, 213, 0, 0.4));
            }

            /* === STS MARKER PRIMARY (White Tint - ATTENTION) === */
            .ch11-sts-marker-primary img {
                width: ${CONFIG.MARKER_SIZE}px;
                height: auto;
                animation: ch11-glow-white-sts 2s ease-in-out infinite;
            }
            
            @keyframes ch11-glow-white-sts {
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

            /* === TRANSMISSION CHANGE MARKER (Mango/Orange Glow) === */
            .ch11-trans-marker img {
                filter: drop-shadow(0 0 12px rgba(255, 157, 0, 0.9))
                        drop-shadow(0 0 20px rgba(255, 157, 0, 0.6))
                        drop-shadow(0 0 30px rgba(255, 157, 0, 0.4));
            }

            /* === POPUP BASE === */
            .ch11-pop .mapboxgl-popup-tip { display: none !important; }
            .ch11-pop .mapboxgl-popup-content {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
                outline: none !important;
            }

            /* === SATELLITE IMAGES (Direct - No Container) === */
            .ch11-sat-img {
                display: block;
                max-width: ${CONFIG.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
            }

            /* Blue glow for light detection */
            .ch11-sat-img.blue {
                box-shadow:
                    0 0 25px rgba(0, 163, 227, 0.35),
                    0 0 50px rgba(0, 163, 227, 0.15);
            }

            /* Red glow for dark detection */
            .ch11-sat-img.red {
                box-shadow:
                    0 0 25px rgba(227, 66, 66, 0.35),
                    0 0 50px rgba(227, 66, 66, 0.15);
            }

            /* Yellow glow for STS detection */
            .ch11-sat-img.yellow {
                box-shadow:
                    0 0 25px rgba(255, 213, 0, 0.35),
                    0 0 50px rgba(255, 213, 0, 0.15);
            }
            
            /* === STS IMAGE HOLDER (White Tint Glow - ATTENTION) === */
            .ch11-sts-img-holder {
                display: inline-block;
                padding: 0 !important;
                border-radius: 10px;
                background: transparent !important;
                border: none !important;
                outline: none !important;
                box-shadow:
                    0 0 15px rgba(255, 255, 255, 0.5),
                    0 0 30px rgba(255, 213, 0, 0.4),
                    0 0 50px rgba(255, 180, 50, 0.25);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                animation: ch11-sts-img-glow 2.5s ease-in-out infinite;
            }
            @keyframes ch11-sts-img-glow {
                0%, 100% {
                    box-shadow:
                        0 0 15px rgba(255, 255, 255, 0.5),
                        0 0 30px rgba(255, 213, 0, 0.4),
                        0 0 50px rgba(255, 180, 50, 0.25);
                }
                50% {
                    box-shadow:
                        0 0 22px rgba(255, 255, 255, 0.7),
                        0 0 40px rgba(255, 213, 0, 0.55),
                        0 0 65px rgba(255, 180, 50, 0.4);
                }
            }
            .ch11-sts-img-holder:hover {
                transform: scale(1.03);
                box-shadow:
                    0 0 25px rgba(255, 255, 255, 0.7),
                    0 0 45px rgba(255, 213, 0, 0.5),
                    0 0 70px rgba(255, 180, 50, 0.35);
            }
            .ch11-sts-img-holder img {
                display: block;
                max-width: ${CONFIG.IMG_WIDTH}px;
                height: auto;
                border-radius: 6px;
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
            }

            /* === IMAGE NUMBER BADGE — bottom-right overlay === */
            .ch11-img-badge {
                position: absolute;
                bottom: 6px;
                right: 6px;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: rgba(0, 20, 40, 0.85);
                border: 1.5px solid ${CONFIG.NUMBER_BORDER_COLOR};
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'JetBrains Mono', 'Inter', monospace;
                font-size: 11px;
                font-weight: 700;
                color: ${CONFIG.NUMBER_BORDER_COLOR};
                z-index: 10;
                box-shadow:
                    0 0 8px ${CONFIG.NUMBER_GLOW_COLOR},
                    0 2px 4px rgba(0, 0, 0, 0.5);
                pointer-events: none;
            }

            /* Orange glow for transmission change */
            .ch11-sat-img.orange {
                box-shadow:
                    0 0 25px rgba(255, 157, 0, 0.35),
                    0 0 50px rgba(255, 157, 0, 0.15);
            }

            /* === IMAGE PLACEHOLDER (shown while loading) === */
            .ch11-img-placeholder {
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

            .ch11-img-placeholder.visible {
                opacity: 1;
            }

            /* Light Detection - Blue placeholder */
            .ch11-img-placeholder.blue {
                background: rgba(0, 163, 227, 0.15);
                border: 2px solid rgba(0, 163, 227, 0.6);
                color: rgba(0, 163, 227, 0.9);
                box-shadow: 0 0 20px rgba(0, 163, 227, 0.3);
            }

            /* Dark Detection - Red placeholder */
            .ch11-img-placeholder.red {
                background: rgba(227, 66, 66, 0.15);
                border: 2px solid rgba(227, 66, 66, 0.6);
                color: rgba(227, 66, 66, 0.9);
                box-shadow: 0 0 20px rgba(227, 66, 66, 0.3);
            }

            /* STS Detection - Yellow placeholder */
            .ch11-img-placeholder.yellow {
                background: rgba(255, 213, 0, 0.15);
                border: 2px solid rgba(255, 213, 0, 0.6);
                color: rgba(255, 213, 0, 0.9);
                box-shadow: 0 0 20px rgba(255, 213, 0, 0.3);
            }

            /* Transmission Change - Orange placeholder */
            .ch11-img-placeholder.orange {
                background: rgba(255, 157, 0, 0.15);
                border: 2px solid rgba(255, 157, 0, 0.6);
                color: rgba(255, 157, 0, 0.9);
                box-shadow: 0 0 20px rgba(255, 157, 0, 0.3);
            }

            .ch11-popup-label {
                font-size: 11px;
                font-weight: 600;
                margin-bottom: 2px;
            }

            .ch11-popup-sublabel {
                font-size: 8px;
                opacity: 0.7;
                text-align: center;
                max-width: 180px;
            }

            /* === LEGEND === */
            .ch11-legend {
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
                min-width: 280px;
            }

            .ch11-legend.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .ch11-legend-item {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 10px;
                font-size: 13px;
                color: rgba(255,255,255,0.95);
            }

            .ch11-legend-item:last-child {
                margin-bottom: 0;
            }

            .ch11-legend-item .legend-text {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .ch11-legend-item .legend-main {
                font-weight: 500;
            }

            .ch11-legend-item .legend-sub {
                font-size: 10px;
                color: rgba(255,255,255,0.5);
            }

            .ch11-legend-line {
                width: 28px;
                height: 3px;
                border-radius: 2px;
                flex-shrink: 0;
            }

            .ch11-legend-line.solid-green {
                background: ${CONFIG.DUNE_COLOR};
            }

            .ch11-legend-line.dashed-green {
                background: repeating-linear-gradient(
                    90deg,
                    ${CONFIG.DUNE_COLOR} 0px,
                    ${CONFIG.DUNE_COLOR} 4px,
                    transparent 4px,
                    transparent 8px
                );
            }

            .ch11-legend-line.solid-pink {
                background: ${CONFIG.KSECOND_COLOR};
            }

            .ch11-legend-line.solid-orange {
                background: ${CONFIG.SINCON_COLOR};
            }

            .ch11-legend-icon {
                width: 22px;
                height: 22px;
                flex-shrink: 0;
            }

            .ch11-legend-icon img {
                width: 100%;
                height: auto;
            }

            /* === VESSEL INFO PANEL === */
            .ch11-vessel-panel {
                position: absolute;
                top: 100px;
                right: 30px;
                background: rgba(17, 19, 38, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 8px;
                padding: 12px 16px;
                font-family: 'Inter', sans-serif;
                z-index: 100;
                opacity: 0;
                transform: translateX(20px);
                transition: opacity 0.5s ease, transform 0.5s ease, border-color 0.5s ease;
                min-width: 200px;
            }

            .ch11-vessel-panel.visible {
                opacity: 1;
                transform: translateX(0);
            }

            .ch11-vessel-panel.green {
                border: 1px solid rgba(0, 255, 136, 0.3);
            }

            .ch11-vessel-panel.pink {
                border: 1px solid rgba(232, 85, 197, 0.3);
            }

            .ch11-vessel-panel.orange {
                border: 1px solid rgba(255, 157, 0, 0.3);
            }

            .ch11-vessel-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }

            .ch11-vessel-icon {
                width: 12px;
                height: 12px;
                border-radius: 2px;
                transition: background 0.5s ease;
            }

            .ch11-vessel-icon.green {
                background: ${CONFIG.DUNE_COLOR};
            }

            .ch11-vessel-icon.pink {
                background: ${CONFIG.KSECOND_COLOR};
            }

            .ch11-vessel-icon.orange {
                background: ${CONFIG.SINCON_COLOR};
            }

            .ch11-vessel-title {
                font-size: 11px;
                font-weight: 600;
                color: rgba(255,255,255,0.6);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .ch11-vessel-content {
                font-size: 12px;
                color: rgba(255,255,255,0.9);
            }

            .ch11-vessel-sub {
                font-size: 10px;
                color: rgba(255,255,255,0.5);
                margin-top: 4px;
            }

            /* === ANNOTATION BOX (improved styling) === */
            .ch11-annotation-box {
                position: absolute;
                top: 120px;
                right: 30px;
                z-index: 100;
                opacity: 0;
                transform: translateY(10px);
                transition: opacity 0.5s ease, transform 0.5s ease;
            }

            .ch11-annotation-box.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .ch11-annotation-content {
                background: rgba(17, 19, 38, 0.95);
                backdrop-filter: blur(12px);
                border-radius: 10px;
                padding: 14px 18px;
                font-family: 'Inter', sans-serif;
                font-size: 12px;
                color: rgba(255,255,255,0.9);
                max-width: 260px;
                line-height: 1.6;
                border: 1px solid rgba(255, 157, 0, 0.4);
                box-shadow: 0 0 20px rgba(255, 157, 0, 0.15),
                            0 4px 20px rgba(0, 0, 0, 0.3);
            }

            .ch11-annotation-title {
                font-size: 11px;
                font-weight: 600;
                color: ${CONFIG.ANNOTATION_LINE_COLOR};
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .ch11-annotation-title::before {
                content: '';
                width: 8px;
                height: 8px;
                background: ${CONFIG.ANNOTATION_LINE_COLOR};
                border-radius: 50%;
                box-shadow: 0 0 8px ${CONFIG.ANNOTATION_LINE_COLOR};
            }

            .ch11-annotation-text {
                color: rgba(255,255,255,0.85);
            }

            /* === ANNOTATION CONNECTOR (line on map) === */
            .ch11-annotation-connector {
                position: absolute;
                pointer-events: none;
            }

            /* === TRANSMISSION ANNOTATION POPUP (H2 scroll - Mapbox popup) === */
            .ch11-trans-popup .mapboxgl-popup-tip { display: none !important; }
            .ch11-trans-popup .mapboxgl-popup-content {
                padding: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
            }

            .ch11-trans-annotation-content {
                /* Ultra translucent glass panel - matches vessel info panel */
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
                min-width: 280px;
                max-width: 320px;
                line-height: 1.5;
                border: 1px solid rgba(0, 255, 136, 0.15);
                /* Enhanced layered shadow with glow */
                box-shadow:
                    0 8px 32px rgba(0, 0, 0, 0.35),
                    0 2px 8px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.06),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.15),
                    0 0 25px rgba(0, 255, 136, 0.03);
            }

            .ch11-trans-annotation-row {
                display: flex;
                align-items: center;
                gap: 14px;
            }

            .ch11-trans-annotation-icon {
                flex-shrink: 0;
                width: 32px;
                height: 32px;
                background: rgba(255, 157, 0, 0.12);
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .ch11-trans-annotation-icon svg {
                width: 16px;
                height: 16px;
                color: ${CONFIG.SINCON_COLOR};
            }

            .ch11-trans-annotation-body {
                flex: 1;
                min-width: 0;
            }

            .ch11-trans-annotation-title {
                font-size: 11px;
                font-weight: 600;
                color: rgba(255, 255, 255, 0.5);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 3px;
            }

            .ch11-trans-annotation-text {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.9);
                line-height: 1.5;
                font-weight: 400;
            }

            .ch11-trans-annotation-text .highlight-pink {
                color: ${CONFIG.KSECOND_COLOR};
                font-weight: 600;
            }

            .ch11-trans-annotation-text .highlight-orange {
                color: ${CONFIG.SINCON_COLOR};
                font-weight: 600;
            }
            
            .ch11-trans-annotation-meta {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid rgba(255, 255, 255, 0.06);
            }
            
            .ch11-trans-meta-item {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 10px;
                color: rgba(255, 255, 255, 0.45);
            }
            
            .ch11-trans-meta-item span {
                color: rgba(255, 255, 255, 0.7);
                font-weight: 500;
            }

            /* === RESPONSIVE - TABLET === */
            @media (max-width: 1024px) {
                .ch11-svg-marker img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.9)}px;
                }
                .ch11-sat-img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.85)}px;
                }
                .ch11-img-placeholder {
                    width: ${Math.round(CONFIG.IMG_WIDTH * 0.85)}px;
                    height: ${Math.round(CONFIG.IMG_HEIGHT * 0.85)}px;
                }
                .ch11-sts-img-holder img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.85)}px;
                }
                .ch11-sts-marker-primary img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.9)}px;
                }
                .ch11-legend {
                    padding: 14px 18px;
                    min-width: 240px;
                }
                .ch11-number-marker {
                    width: 24px;
                    height: 24px;
                    font-size: 12px;
                }
                .ch11-img-badge {
                    width: 20px;
                    height: 20px;
                    font-size: 10px;
                }
                .ch11-trans-annotation-content {
                    min-width: 240px;
                    max-width: 280px;
                    padding: 10px 14px;
                    backdrop-filter: blur(32px) saturate(180%);
                    -webkit-backdrop-filter: blur(32px) saturate(180%);
                }
                .ch11-trans-annotation-icon {
                    width: 28px;
                    height: 28px;
                }
                .ch11-trans-annotation-icon svg {
                    width: 14px;
                    height: 14px;
                }
                .ch11-trans-annotation-title {
                    font-size: 10px;
                }
                .ch11-trans-annotation-text {
                    font-size: 11px;
                }
                .ch11-trans-meta-item {
                    font-size: 9px;
                }
            }

            /* === RESPONSIVE - MOBILE === */
            @media (max-width: 768px) {
                .ch11-svg-marker img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.8)}px;
                }
                .ch11-sat-img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.7)}px;
                }
                .ch11-img-placeholder {
                    width: ${Math.round(CONFIG.IMG_WIDTH * 0.7)}px;
                    height: ${Math.round(CONFIG.IMG_HEIGHT * 0.7)}px;
                }
                .ch11-sts-img-holder img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.7)}px;
                }
                .ch11-sts-marker-primary img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.8)}px;
                }
                .ch11-legend {
                    bottom: 20px;
                    left: 20px;
                    padding: 12px 16px;
                    min-width: 200px;
                }
                .ch11-legend-item {
                    font-size: 11px;
                    gap: 10px;
                }
                .ch11-number-marker {
                    width: 22px;
                    height: 22px;
                    font-size: 11px;
                }
                .ch11-img-badge {
                    width: 18px;
                    height: 18px;
                    font-size: 9px;
                    bottom: 4px;
                    right: 4px;
                }
                .ch11-vessel-panel {
                    top: 80px;
                    right: 20px;
                    min-width: 180px;
                }
                .ch11-annotation-box {
                    top: 100px;
                    right: 20px;
                }
                .ch11-annotation-content {
                    max-width: 220px;
                    padding: 12px 14px;
                    font-size: 11px;
                }
                .ch11-trans-annotation-content {
                    min-width: 220px;
                    max-width: 260px;
                    padding: 10px 12px;
                    backdrop-filter: blur(28px) saturate(170%);
                    -webkit-backdrop-filter: blur(28px) saturate(170%);
                }
                .ch11-trans-annotation-row {
                    gap: 10px;
                }
                .ch11-trans-annotation-icon {
                    width: 26px;
                    height: 26px;
                }
                .ch11-trans-annotation-icon svg {
                    width: 13px;
                    height: 13px;
                }
                .ch11-trans-annotation-title {
                    font-size: 9px;
                }
                .ch11-trans-annotation-text {
                    font-size: 11px;
                }
                .ch11-trans-annotation-meta {
                    gap: 8px;
                    margin-top: 6px;
                    padding-top: 6px;
                }
                .ch11-trans-meta-item {
                    font-size: 9px;
                }
            }

            /* === RESPONSIVE - SMALL MOBILE === */
            @media (max-width: 480px) {
                .ch11-svg-marker img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.7)}px;
                }
                .ch11-sat-img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.55)}px;
                }
                .ch11-img-placeholder {
                    width: ${Math.round(CONFIG.IMG_WIDTH * 0.55)}px;
                    height: ${Math.round(CONFIG.IMG_HEIGHT * 0.55)}px;
                }
                .ch11-sts-img-holder img {
                    max-width: ${Math.round(CONFIG.IMG_WIDTH * 0.55)}px;
                }
                .ch11-sts-marker-primary img {
                    width: ${Math.round(CONFIG.MARKER_SIZE * 0.7)}px;
                }
                .ch11-sts-img-holder {
                    box-shadow:
                        0 0 10px rgba(255, 255, 255, 0.4),
                        0 0 20px rgba(255, 213, 0, 0.3),
                        0 0 35px rgba(255, 180, 50, 0.2);
                }
                .ch11-legend {
                    bottom: 15px;
                    left: 15px;
                    padding: 10px 14px;
                    min-width: 160px;
                }
                .ch11-legend-item {
                    font-size: 10px;
                    gap: 8px;
                    margin-bottom: 6px;
                }
                .ch11-legend-line {
                    width: 20px;
                }
                .ch11-legend-icon {
                    width: 18px;
                    height: 18px;
                }
                .ch11-number-marker {
                    width: 20px;
                    height: 20px;
                    font-size: 10px;
                }
                .ch11-img-badge {
                    width: 16px;
                    height: 16px;
                    font-size: 8px;
                    bottom: 3px;
                    right: 3px;
                }
                .ch11-vessel-panel {
                    top: 70px;
                    right: 15px;
                    min-width: 150px;
                    padding: 10px 12px;
                }
                .ch11-vessel-title {
                    font-size: 10px;
                }
                .ch11-vessel-content {
                    font-size: 11px;
                }
                .ch11-vessel-sub {
                    font-size: 9px;
                }
                .ch11-annotation-box {
                    top: 80px;
                    right: 15px;
                }
                .ch11-trans-annotation-content {
                    min-width: 180px;
                    max-width: 220px;
                    padding: 8px 10px;
                    border-radius: 8px;
                    backdrop-filter: blur(24px) saturate(160%);
                    -webkit-backdrop-filter: blur(24px) saturate(160%);
                }
                .ch11-trans-annotation-row {
                    gap: 8px;
                }
                .ch11-trans-annotation-icon {
                    width: 24px;
                    height: 24px;
                    border-radius: 5px;
                }
                .ch11-trans-annotation-icon svg {
                    width: 12px;
                    height: 12px;
                }
                .ch11-trans-annotation-title {
                    font-size: 8px;
                    margin-bottom: 2px;
                }
                .ch11-trans-annotation-text {
                    font-size: 10px;
                }
                .ch11-trans-annotation-meta {
                    gap: 6px;
                    margin-top: 5px;
                    padding-top: 5px;
                }
                .ch11-trans-meta-item {
                    font-size: 8px;
                    gap: 3px;
                }
                .ch11-annotation-content {
                    max-width: 180px;
                    padding: 10px 12px;
                    font-size: 10px;
                }
                .ch11-annotation-title {
                    font-size: 10px;
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

        // Reset detection flags
        det1Shown = det2Shown = det3Shown = det4Shown = det5Shown = false;
        transChangeShown = false;

        // Remove UI elements
        const legend = document.querySelector('.ch11-legend');
        if (legend) legend.remove();

        const vesselPanel = document.querySelector('.ch11-vessel-panel');
        if (vesselPanel) vesselPanel.remove();

        const annotation = document.querySelector('.ch11-annotation-box');
        if (annotation) annotation.remove();

        const transAnnotation = document.querySelector('.ch11-trans-annotation');
        if (transAnnotation) transAnnotation.remove();
    }

    function clearLayers() {
        // Remove all layers
        [LAYER_ASSESSED, LAYER_DUNE, LAYER_DUNE_GLOW, LAYER_KSECOND, LAYER_KSECOND_GLOW, LAYER_SINCON, LAYER_SINCON_GLOW, LAYER_CONNECTOR, LAYER_CONNECTOR_GLOW].forEach(id => {
            try { if (map.getLayer(id)) map.removeLayer(id); } catch(e) {}
        });
        // Remove all sources
        [SOURCE_ASSESSED, SOURCE_DUNE, SOURCE_KSECOND, SOURCE_SINCON, SOURCE_CONNECTOR].forEach(id => {
            try { if (map.getSource(id)) map.removeSource(id); } catch(e) {}
        });
    }

    // Comprehensive DOM fallback cleanup - catches any lingering elements
    function domFallbackCleanup() {
        const selectors = [
            '.ch11-svg-marker', '.ch11-dark-marker', '.ch11-light-marker', '.ch11-sts-marker',
            '.ch11-sts-marker-primary', '.ch11-trans-marker', '.ch11-number-marker',
            '.ch11-img-placeholder', '.ch11-sat-img', '.ch11-sts-img-holder',
            '.ch11-pop', '.ch11-trans-popup', '.ch11-legend', '.ch11-vessel-panel',
            '.ch11-annotation-box', '.ch11-trans-annotation'
        ];
        document.querySelectorAll(selectors.join(', ')).forEach(el => {
            try {
                const wrapper = el.closest('.mapboxgl-marker') || el.closest('.mapboxgl-popup');
                if (wrapper) wrapper.remove();
                else el.remove();
            } catch(e) {}
        });

        // Additional safety: remove all mapboxgl markers that have ch11 elements inside
        document.querySelectorAll('.mapboxgl-marker').forEach(marker => {
            if (marker.querySelector('[class*="ch11-"]') || marker.innerHTML.includes('ch11-')) {
                try { marker.remove(); } catch(e) {}
            }
        });

        // Remove any lingering popups with ch11 classes
        document.querySelectorAll('.mapboxgl-popup').forEach(popup => {
            if (popup.querySelector('[class*="ch11-"]') || popup.innerHTML.includes('ch11-')) {
                try { popup.remove(); } catch(e) {}
            }
        });
    }

    function clearAll() {
        console.log('[CH11] clearAll - comprehensive cleanup');
        clearPendingTimeouts();
        stopAnim();
        clearMarkers();
        clearLayers();
        domFallbackCleanup();
        progress = 0;
        phase = 'main';
        h1Phase = 'dune';
        ksecondStartT = null;
    }

    // ============================================================================
    // LOAD DATA
    // ============================================================================

    async function loadData() {
        const loadPromises = [];

        // Load assessed path
        if (!assessedCoords) {
            loadPromises.push(
                fetch('data/chapter11-dune-assessed.geojson')
                    .then(res => res.json())
                    .then(data => {
                        if (data?.features?.[0]?.geometry?.coordinates) {
                            assessedCoords = data.features[0].geometry.coordinates;
                            console.log(`  Loaded ${assessedCoords.length} assessed path coordinates`);
                        }
                    })
                    .catch(e => console.error('Chapter 11 assessed path load error:', e))
            );
        }

        // Load DUNE
        if (!duneCoords) {
            loadPromises.push(
                fetch('data/chapter11-dune.geojson')
                    .then(res => res.json())
                    .then(data => {
                        if (data?.features?.[0]?.geometry?.coordinates) {
                            duneCoords = data.features[0].geometry.coordinates;
                            console.log(`  Loaded ${duneCoords.length} DUNE coordinates`);
                        }
                    })
                    .catch(e => console.error('Chapter 11 DUNE load error:', e))
            );
        }

        // Load KSECOND
        if (!ksecondCoords) {
            loadPromises.push(
                fetch('data/chapter11-ksecond.geojson')
                    .then(res => res.json())
                    .then(data => {
                        if (data?.features?.[0]?.geometry?.coordinates) {
                            ksecondCoords = data.features[0].geometry.coordinates;
                            console.log(`  Loaded ${ksecondCoords.length} KSECOND coordinates`);
                        }
                    })
                    .catch(e => console.error('Chapter 11 KSECOND load error:', e))
            );
        }

        // Load SINCON
        if (!sinconCoords) {
            loadPromises.push(
                fetch('data/chapter11-sincon.geojson')
                    .then(res => res.json())
                    .then(data => {
                        if (data?.features?.[0]?.geometry?.coordinates) {
                            sinconCoords = data.features[0].geometry.coordinates;
                            console.log(`  Loaded ${sinconCoords.length} SINCON coordinates`);
                        }
                    })
                    .catch(e => console.error('Chapter 11 SINCON load error:', e))
            );
        }

        await Promise.all(loadPromises);
        return assessedCoords && duneCoords && ksecondCoords && sinconCoords;
    }

    // ============================================================================
    // MARKER HELPERS
    // ============================================================================

    function createSvgMarker(svgPath, lngLat, markerClass = '', rotation = 0) {
        const el = document.createElement('div');
        el.className = `ch11-svg-marker ${markerClass}`;
        el.innerHTML = `<img src="${svgPath}" alt="marker">`;
        const opts = { element: el, anchor: 'center' };
        if (rotation !== 0) opts.rotation = rotation;
        const marker = new mapboxgl.Marker(opts)
            .setLngLat(lngLat)
            .addTo(map);
        markers.push(marker);
        return marker;
    }

    function createNumberMarker(number, lngLat, offset = [0, -35]) {
        const el = document.createElement('div');
        el.className = 'ch11-number-marker';
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

    function createImagePopup(lngLat, imagePath, colorType, offset, label, sublabel, number) {
        const uniqueId = `ph-${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
        const badgeHtml = number ? `<div class="ch11-img-badge">${number}</div>` : '';
        const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch11-pop',
            offset: offset
        })
            .setLngLat(lngLat)
            .setHTML(`
                <div class="ch11-img-placeholder ${colorType}" id="${uniqueId}">
                    <span class="ch11-popup-label">${label}</span>
                    <span class="ch11-popup-sublabel">${sublabel || 'SAT IMAGE'}</span>
                </div>
                <div style="position:relative; display:inline-block;">
                    ${badgeHtml}
                    <img class="ch11-sat-img ${colorType}" src="${imagePath}"
                         style="display:none;"
                         onload="this.style.display='block'; this.parentElement.previousElementSibling.style.display='none';"
                         onerror="this.style.display='none';">
                </div>
            `)
            .addTo(map);
        popups.push(popup);
        return popup;
    }

    function showPopup(popup) {
        if (popup) {
            const el = popup.getElement();
            if (el) {
                const placeholder = el.querySelector('.ch11-img-placeholder');
                if (placeholder) placeholder.classList.add('visible');
            }
        }
    }

    // STS marker with white tint glow (primary - attention grabbing)
    function createStsMarkerPrimary(svgPath, lngLat, rotation = 0) {
        const el = document.createElement('div');
        el.className = 'ch11-svg-marker ch11-sts-marker-primary';
        el.innerHTML = `<img src="${svgPath}" alt="STS Detection">`;
        const opts = { element: el, anchor: 'center' };
        if (rotation !== 0) opts.rotation = rotation;
        const marker = new mapboxgl.Marker(opts)
            .setLngLat(lngLat)
            .addTo(map);
        markers.push(marker);
        return marker;
    }

    // STS image popup with white tint glow holder (attention grabbing)
    function createStsImagePopup(lngLat, imagePath, offset, label, sublabel, number) {
        const badgeHtml = number ? `<div class="ch11-img-badge">${number}</div>` : '';
        const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch11-pop',
            offset: offset
        })
            .setLngLat(lngLat)
            .setHTML(`
                <div class="ch11-sts-img-holder" style="position:relative;">
                    ${badgeHtml}
                    <img src="${imagePath}" alt="${sublabel}" onerror="this.parentElement.style.display='none';">
                </div>
            `)
            .addTo(map);
        popups.push(popup);
        return popup;
    }

    // ============================================================================
    // CREATE LEGEND
    // ============================================================================

    function createLegend(phase) {
        const existing = document.querySelector('.ch11-legend');
        if (existing) existing.remove();

        const legend = document.createElement('div');
        legend.className = 'ch11-legend';

        let legendItems = '';

        if (phase === 'main') {
            legendItems = `
                <div class="ch11-legend-item">
                    <div class="ch11-legend-line dashed-green"></div>
                    <span class="legend-main">DUNE Assessed AIS Track</span>
                </div>
                <div class="ch11-legend-item">
                    <div class="ch11-legend-icon"><img src="darkdetection.svg" alt=""></div>
                    <span class="legend-main">Dark Detection</span>
                </div>
            `;
        } else if (phase === 'h1') {
            legendItems = `
                <div class="ch11-legend-item">
                    <div class="ch11-legend-line solid-green"></div>
                    <span class="legend-main">DUNE AIS Track</span>
                </div>
                <div class="ch11-legend-item">
                    <div class="ch11-legend-line dashed-green"></div>
                    <span class="legend-main">DUNE Assessed AIS Track</span>
                </div>
                <div class="ch11-legend-item">
                    <div class="ch11-legend-line solid-pink"></div>
                    <div class="legend-text">
                        <span class="legend-main">STELLAR ORACLE AIS Track</span>
                        <span class="legend-sub">Transmitting as KSECOND (IMO: 9212864)</span>
                    </div>
                </div>
                <div class="ch11-legend-item">
                    <div class="ch11-legend-icon"><img src="lightdetection.svg" alt=""></div>
                    <span class="legend-main">Light Detection</span>
                </div>
                <div class="ch11-legend-item">
                    <div class="ch11-legend-icon"><img src="bunkering.svg" alt=""></div>
                    <span class="legend-main">STS Detection</span>
                </div>
            `;
        } else if (phase === 'h2') {
            legendItems = `
                <div class="ch11-legend-item">
                    <div class="ch11-legend-line solid-green"></div>
                    <span class="legend-main">DUNE AIS Track</span>
                </div>
                <div class="ch11-legend-item">
                    <div class="ch11-legend-line dashed-green"></div>
                    <span class="legend-main">DUNE Assessed AIS Track</span>
                </div>
                <div class="ch11-legend-item">
                    <div class="ch11-legend-line solid-pink"></div>
                    <div class="legend-text">
                        <span class="legend-main">STELLAR ORACLE AIS Track</span>
                        <span class="legend-sub">Transmitting as KSECOND (IMO: 9212864)</span>
                    </div>
                </div>
                <div class="ch11-legend-item">
                    <div class="ch11-legend-line solid-orange"></div>
                    <div class="legend-text">
                        <span class="legend-main">STELLAR ORACLE AIS Track</span>
                        <span class="legend-sub">Transmitting as SINCON (IMO: 9212864)</span>
                    </div>
                </div>
                <div class="ch11-legend-item">
                    <div class="ch11-legend-icon"><img src="lightdetection.svg" alt=""></div>
                    <span class="legend-main">Light Detection</span>
                </div>
                <div class="ch11-legend-item">
                    <div class="ch11-legend-icon"><img src="transmissionchange.svg" alt=""></div>
                    <span class="legend-main">Transmission Change</span>
                </div>
            `;
        }

        legend.innerHTML = legendItems;

        document.body.appendChild(legend);
        safeSetTimeout(() => legend.classList.add('visible'), 100);
    }

    // ============================================================================
    // CREATE VESSEL INFO PANEL
    // ============================================================================

    function createVesselPanel(vesselName, vesselInfo, colorClass) {
        const existing = document.querySelector('.ch11-vessel-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.className = `ch11-vessel-panel ${colorClass}`;

        panel.innerHTML = `
            <div class="ch11-vessel-header">
                <div class="ch11-vessel-icon ${colorClass}"></div>
                <span class="ch11-vessel-title">${vesselName}</span>
            </div>
            <div class="ch11-vessel-content">${vesselInfo.name}</div>
            <div class="ch11-vessel-sub">${vesselInfo.details}</div>
        `;

        document.body.appendChild(panel);
        safeSetTimeout(() => panel.classList.add('visible'), 200);
    }

    function updateVesselPanel(vesselName, vesselInfo, colorClass) {
        const panel = document.querySelector('.ch11-vessel-panel');
        if (!panel) {
            createVesselPanel(vesselName, vesselInfo, colorClass);
            return;
        }

        // Update classes
        panel.className = `ch11-vessel-panel visible ${colorClass}`;

        // Update content
        panel.innerHTML = `
            <div class="ch11-vessel-header">
                <div class="ch11-vessel-icon ${colorClass}"></div>
                <span class="ch11-vessel-title">${vesselName}</span>
            </div>
            <div class="ch11-vessel-content">${vesselInfo.name}</div>
            <div class="ch11-vessel-sub">${vesselInfo.details}</div>
        `;
    }

    // ============================================================================
    // CREATE ANNOTATION WITH LINE (improved for H2 scroll)
    // ============================================================================

    function createAnnotation(title, text) {
        const existing = document.querySelector('.ch11-annotation-box');
        if (existing) existing.remove();

        const box = document.createElement('div');
        box.className = 'ch11-annotation-box';

        box.innerHTML = `
            <div class="ch11-annotation-content">
                <div class="ch11-annotation-title">${title}</div>
                <div class="ch11-annotation-text">${text}</div>
            </div>
        `;

        document.body.appendChild(box);
        safeSetTimeout(() => box.classList.add('visible'), 300);
    }

    // ============================================================================
    // LAYER HELPERS
    // ============================================================================

    function addAssessedPathLayer(animated = false) {
        if (!map.getSource(SOURCE_ASSESSED)) {
            map.addSource(SOURCE_ASSESSED, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: animated ? [] : assessedCoords
                    }
                }
            });
        }

        if (!map.getLayer(LAYER_ASSESSED)) {
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
        }
    }

    function addDuneLayer(animated = false) {
        if (!map.getSource(SOURCE_DUNE)) {
            map.addSource(SOURCE_DUNE, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: animated ? [duneCoords[0]] : duneCoords
                    }
                }
            });
        }

        if (!map.getLayer(LAYER_DUNE_GLOW)) {
            map.addLayer({
                id: LAYER_DUNE_GLOW,
                type: 'line',
                source: SOURCE_DUNE,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': CONFIG.DUNE_COLOR,
                    'line-width': 10,
                    'line-opacity': 0.3,
                    'line-blur': 5
                }
            });
        }

        if (!map.getLayer(LAYER_DUNE)) {
            map.addLayer({
                id: LAYER_DUNE,
                type: 'line',
                source: SOURCE_DUNE,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': CONFIG.DUNE_COLOR,
                    'line-width': 3,
                    'line-opacity': 0.95
                }
            });
        }
    }

    function addKsecondLayer(animated = false) {
        if (!map.getSource(SOURCE_KSECOND)) {
            map.addSource(SOURCE_KSECOND, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: animated ? [ksecondCoords[0]] : ksecondCoords
                    }
                }
            });
        }

        if (!map.getLayer(LAYER_KSECOND_GLOW)) {
            map.addLayer({
                id: LAYER_KSECOND_GLOW,
                type: 'line',
                source: SOURCE_KSECOND,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': CONFIG.KSECOND_COLOR,
                    'line-width': 10,
                    'line-opacity': 0.3,
                    'line-blur': 5
                }
            });
        }

        if (!map.getLayer(LAYER_KSECOND)) {
            map.addLayer({
                id: LAYER_KSECOND,
                type: 'line',
                source: SOURCE_KSECOND,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': CONFIG.KSECOND_COLOR,
                    'line-width': 3,
                    'line-opacity': 0.95
                }
            });
        }
    }

    function addSinconLayer(animated = false) {
        if (!map.getSource(SOURCE_SINCON)) {
            map.addSource(SOURCE_SINCON, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: animated ? [sinconCoords[0]] : sinconCoords
                    }
                }
            });
        }

        if (!map.getLayer(LAYER_SINCON_GLOW)) {
            map.addLayer({
                id: LAYER_SINCON_GLOW,
                type: 'line',
                source: SOURCE_SINCON,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': CONFIG.SINCON_COLOR,
                    'line-width': 10,
                    'line-opacity': 0.3,
                    'line-blur': 5
                }
            });
        }

        if (!map.getLayer(LAYER_SINCON)) {
            map.addLayer({
                id: LAYER_SINCON,
                type: 'line',
                source: SOURCE_SINCON,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': CONFIG.SINCON_COLOR,
                    'line-width': 3,
                    'line-opacity': 0.95
                }
            });
        }
    }

    // Add connector line from KSECOND end to transmission change marker
    function addConnectorLayer() {
        if (!ksecondCoords?.length) return;

        // Get the last point of KSECOND and connect to transmission change marker
        const ksecondEnd = ksecondCoords[ksecondCoords.length - 1];
        const connectorCoords = [ksecondEnd, CONFIG.TRANS_CHANGE];

        if (!map.getSource(SOURCE_CONNECTOR)) {
            map.addSource(SOURCE_CONNECTOR, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: connectorCoords
                    }
                }
            });
        }

        if (!map.getLayer(LAYER_CONNECTOR_GLOW)) {
            map.addLayer({
                id: LAYER_CONNECTOR_GLOW,
                type: 'line',
                source: SOURCE_CONNECTOR,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': CONFIG.KSECOND_COLOR,
                    'line-width': 10,
                    'line-opacity': 0.3,
                    'line-blur': 5
                }
            });
        }

        if (!map.getLayer(LAYER_CONNECTOR)) {
            map.addLayer({
                id: LAYER_CONNECTOR,
                type: 'line',
                source: SOURCE_CONNECTOR,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': CONFIG.KSECOND_COLOR,
                    'line-width': 3,
                    'line-opacity': 0.95
                }
            });
        }
    }

    // ============================================================================
    // DETECTION MARKERS
    // ============================================================================

    // Detection #1: Dark detection at Jask - WITH sat image
    // SVG points right (3 o'clock), 3:35 = 17.5°
    function showDetection1() {
        console.log('  Detection 1: Dark detection at Jask, Iran');

        const mkr = createSvgMarker('assets/svg/darkdetection.svg', CONFIG.DET_1, 'ch11-dark-marker', 30);
        const numMkr = createNumberMarker('1', CONFIG.DET_1);
        const popup = createImagePopup(
            CONFIG.DET_1,
            CONFIG.DET_1_IMAGE,
            'red',
            CONFIG.DET_1_OFFSET,
            CONFIG.DET_1_LABEL,
            CONFIG.DET_1_SUBLABEL,
            1
        );

        safeSetTimeout(() => {
            showMarker(mkr);
            showMarker(numMkr);
            showPopup(popup);
        }, CONFIG.MARKER_DELAY);
    }

    // Detection #2: Light detection in Malacca - WITH sat image
    // SVG points right (3 o'clock), 4 o'clock = 30°
    function showDetection2() {
        console.log('  Detection 2: Light detection in Malacca Strait');

        const mkr = createSvgMarker('assets/svg/lightdetection.svg', CONFIG.DET_2, 'ch11-light-marker', 30);
        const numMkr = createNumberMarker('2', CONFIG.DET_2);
        const popup = createImagePopup(
            CONFIG.DET_2,
            CONFIG.DET_2_IMAGE,
            'blue',
            CONFIG.DET_2_OFFSET,
            CONFIG.DET_2_LABEL,
            CONFIG.DET_2_SUBLABEL,
            2
        );

        safeSetTimeout(() => {
            showMarker(mkr);
            showMarker(numMkr);
            showPopup(popup);
        }, CONFIG.MARKER_DELAY);
    }

    // Detection #3: STS with STELLAR ORACLE - WITH sat image (WHITE TINT - ATTENTION)
    // Bunkering SVG is square (default 12 o'clock), 11:30 = 345°
    function showDetection3() {
        console.log('  Detection 3: STS with STELLAR ORACLE (white tint attention)');

        // Use primary marker with white tint glow for attention
        const mkr = createStsMarkerPrimary('assets/svg/bunkering.svg', CONFIG.DET_3, 345);
        const numMkr = createNumberMarker('3', CONFIG.DET_3);
        // Use STS image popup with white tint glow holder
        const popup = createStsImagePopup(
            CONFIG.DET_3,
            CONFIG.DET_3_IMAGE,
            CONFIG.DET_3_OFFSET,
            CONFIG.DET_3_LABEL,
            CONFIG.DET_3_SUBLABEL,
            3
        );

        safeSetTimeout(() => {
            showMarker(mkr);
            showMarker(numMkr);
            // No need to call showPopup - image loads directly
        }, CONFIG.MARKER_DELAY);
    }

    // Detection #4: Light detection - WITH sat image (chapter11D)
    // SVG points right (3 o'clock), 12 o'clock = -90°
    function showDetection4() {
        console.log('  Detection 4: Light detection with sat image');

        const mkr = createSvgMarker('assets/svg/lightdetection.svg', CONFIG.DET_4, 'ch11-light-marker', -47.5);
        const numMkr = createNumberMarker('4', CONFIG.DET_4);
        const popup = createImagePopup(
            CONFIG.DET_4,
            CONFIG.DET_4_IMAGE,
            'blue',
            CONFIG.DET_4_OFFSET,
            CONFIG.DET_4_LABEL,
            CONFIG.DET_4_SUBLABEL,
            4
        );

        safeSetTimeout(() => {
            showMarker(mkr);
            showMarker(numMkr);
            showPopup(popup);
        }, CONFIG.MARKER_DELAY);
    }

    // Transmission change marker - WITH annotation box on H2 scroll
    function showTransmissionChange() {
        console.log('  Transmission change marker: STELLAR ORACLE → SINCON with annotation');

        const mkr = createSvgMarker('assets/svg/transmissionchange.svg', CONFIG.TRANS_CHANGE, 'ch11-trans-marker');

        safeSetTimeout(() => {
            showMarker(mkr);
            // Show annotation box for transmission change on H2 scroll
            createTransmissionAnnotation();
        }, CONFIG.MARKER_DELAY);
    }

    // Annotation box for Transmission Change on H2 scroll - as Mapbox popup next to marker
    function createTransmissionAnnotation() {
        const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'ch11-trans-popup',
            offset: [20, 0],  // Offset to the right of the marker
            anchor: 'left'    // Anchor on the left so popup appears to the right
        })
            .setLngLat(CONFIG.TRANS_CHANGE)
            .setHTML(`
                <div class="ch11-trans-annotation-content">
                    <div class="ch11-trans-annotation-row">
                        <div class="ch11-trans-annotation-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                            </svg>
                        </div>
                        <div class="ch11-trans-annotation-body">
                            <div class="ch11-trans-annotation-title">Identity Change · 04 Oct 2025</div>
                            <div class="ch11-trans-annotation-text">
                                <span class="highlight-pink">KSECOND</span> → <span class="highlight-orange">SINCON</span>
                            </div>
                        </div>
                    </div>
                    <div class="ch11-trans-annotation-meta">
                        <div class="ch11-trans-meta-item">AIS Gap: <span>~20 min</span></div>
                        <div class="ch11-trans-meta-item">Shift: <span>6 km</span></div>
                    </div>
                </div>
            `)
            .addTo(map);
        popups.push(popup);
    }

    // Detection #5: Light detection near Jiangsu - WITH sat image
    // SVG points right (3 o'clock), 12 o'clock = -90°
    function showDetection5() {
        console.log('  Detection 5: Light detection near Jiangsu, China');

        const mkr = createSvgMarker('assets/svg/lightdetection.svg', CONFIG.DET_5, 'ch11-light-marker', -105);
        const numMkr = createNumberMarker('5', CONFIG.DET_5);
        const popup = createImagePopup(
            CONFIG.DET_5,
            CONFIG.DET_5_IMAGE,
            'blue',
            CONFIG.DET_5_OFFSET,
            CONFIG.DET_5_LABEL,
            CONFIG.DET_5_SUBLABEL,
            5
        );

        safeSetTimeout(() => {
            showMarker(mkr);
            showMarker(numMkr);
            showPopup(popup);
        }, CONFIG.MARKER_DELAY);
    }

    // ============================================================================
    // SHOW MAIN - DUNE assessed path from Jask (only Detection #1 with sat image)
    // ============================================================================

    async function showMain() {
        console.log('  showMain (DUNE - Assessed Path from Iran)');
        clearAll();

        await loadData();
        if (!assessedCoords?.length) return;

        // Add assessed path - animated
        addAssessedPathLayer(true);

        // Create legend
        createLegend('main');

        // Create vessel panel for DUNE
        createVesselPanel('Vessel Tracking', {
            name: 'DUNE',
            details: 'Dark transit from Jask, Iran'
        }, 'green');

        // Animate assessed path
        phase = 'main';
        running = true;
        startT = performance.now();
        animateAssessedPath();
    }

    function animateAssessedPath() {
        if (!running) return;

        const elapsed = performance.now() - startT;
        const pct = Math.min(elapsed / CONFIG.ASSESSED_ANIMATION_DURATION, 1);
        const total = assessedCoords.length;
        const idx = Math.floor(pct * (total - 1));

        // Animate line
        const src = map.getSource(SOURCE_ASSESSED);
        if (src && idx >= 0) {
            src.setData({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: assessedCoords.slice(0, idx + 1) }
            });
        }

        // Show Detection #1 (Dark detection at Jask) at start - only sat image in main scroll
        if (!det1Shown && pct >= 0.05) {
            det1Shown = true;
            showDetection1();
        }

        if (pct >= 1) {
            // Complete main phase
            if (src) {
                src.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: assessedCoords }
                });
            }
            running = false;
            console.log('  Main scroll assessed path complete');
        } else {
            animId = requestAnimationFrame(animateAssessedPath);
        }
    }

    // ============================================================================
    // SHOW H1 - DUNE + KSECOND animation (FASTER) with #2, #3 sat images, #4 no sat image
    // ============================================================================

    function showH1() {
        console.log('  showH1 (DUNE + STELLAR ORACLE STS)');

        // Stop any running animation first
        stopAnim();

        if (!duneCoords?.length || !ksecondCoords?.length) {
            console.log('  Waiting for data...');
            loadData().then(() => {
                if (duneCoords?.length && ksecondCoords?.length) startH1Animation();
            });
            return;
        }

        startH1Animation();
    }

    function startH1Animation() {
        console.log('  Starting H1 animation (faster)');

        // Clear previous phase elements but keep data
        clearMarkers();
        clearLayers();

        // Create legend for H1
        createLegend('h1');

        // Create vessel panel - starts with DUNE
        createVesselPanel('Vessel Tracking', {
            name: 'DUNE',
            details: 'AIS track through Malacca Strait'
        }, 'green');

        // Add assessed path - STATIC (shows complete path from main scroll)
        addAssessedPathLayer(false);

        // Add DUNE - animated
        addDuneLayer(true);

        // Add KSECOND - animated (will start later)
        addKsecondLayer(true);

        // Start animation
        progress = 0;
        phase = 'h1';
        h1Phase = 'dune';
        ksecondStartT = null;
        running = true;
        startT = performance.now();
        animateH1();
    }

    function animateH1() {
        if (!running) return;

        const elapsed = performance.now() - startT;

        if (h1Phase === 'dune') {
            // Phase 1: Animate DUNE - FASTER
            const pct = Math.min(elapsed / CONFIG.H1_ANIMATION_DURATION, 1);

            const duneTotal = duneCoords.length;
            const duneIdx = Math.floor(pct * (duneTotal - 1));
            const duneSrc = map.getSource(SOURCE_DUNE);
            if (duneSrc && duneIdx >= 0) {
                duneSrc.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: duneCoords.slice(0, duneIdx + 1) }
                });
            }

            // Detection #2: Light Detection in Malacca Strait (~20% through DUNE track)
            if (!det2Shown && pct >= 0.20) {
                det2Shown = true;
                showDetection2();
            }

            // Detection #3: STS Detection (~70% through DUNE track)
            if (!det3Shown && pct >= 0.70) {
                det3Shown = true;
                showDetection3();
            }

            if (pct >= 1) {
                // DUNE complete, ensure full track shown
                if (duneSrc) {
                    duneSrc.setData({
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: duneCoords }
                    });
                }
                // Switch to KSECOND phase
                h1Phase = 'ksecond';
                ksecondStartT = performance.now();

                // Update vessel panel to KSECOND (STELLAR ORACLE)
                updateVesselPanel('Vessel Tracking', {
                    name: 'STELLAR ORACLE',
                    details: 'Transmitting as KSECOND (IMO: 9212864)'
                }, 'pink');

                console.log('  DUNE animation complete, starting KSECOND');
            }
        } else if (h1Phase === 'ksecond') {
            // Phase 2: Animate KSECOND (after DUNE is complete) - FASTER
            const ksecondElapsed = performance.now() - ksecondStartT;
            const ksecondPct = Math.min(ksecondElapsed / CONFIG.H1_ANIMATION_DURATION, 1);

            const ksecondTotal = ksecondCoords.length;
            const ksecondIdx = Math.floor(ksecondPct * (ksecondTotal - 1));
            const ksecondSrc = map.getSource(SOURCE_KSECOND);
            if (ksecondSrc && ksecondIdx >= 0) {
                ksecondSrc.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: ksecondCoords.slice(0, ksecondIdx + 1) }
                });
            }

            // Detection #4: Light detection near Ho Chi Minh (~70% through KSECOND track) - NO sat image
            if (!det4Shown && ksecondPct >= 0.70) {
                det4Shown = true;
                showDetection4();
            }

            if (ksecondPct >= 1) {
                // KSECOND complete
                if (ksecondSrc) {
                    ksecondSrc.setData({
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: ksecondCoords }
                    });
                }
                h1Phase = 'complete';
                running = false;
                console.log('  H1 Animation complete (both DUNE and KSECOND)');
                return;
            }
        }

        if (running) {
            animId = requestAnimationFrame(animateH1);
        }
    }

    // ============================================================================
    // SHOW H2 - Transmission change + SINCON (plays faster)
    // ============================================================================

    function showH2() {
        console.log('  showH2 (Transmission Change + SINCON)');

        // Stop any running animation first
        stopAnim();

        if (!sinconCoords?.length) {
            console.log('  Waiting for SINCON data...');
            loadData().then(() => {
                if (sinconCoords?.length) startH2Animation();
            });
            return;
        }

        startH2Animation();
    }

    function startH2Animation() {
        console.log('  Starting H2 animation (faster)');

        // Clear previous phase elements
        clearMarkers();
        clearLayers();

        // Create legend for H2
        createLegend('h2');

        // Create vessel panel - SINCON
        createVesselPanel('Vessel Tracking', {
            name: 'STELLAR ORACLE',
            details: 'Now transmitting as SINCON (IMO: 9212864)'
        }, 'orange');

        // Add ALL previous routes as STATIC (complete paths)
        addAssessedPathLayer(false);  // Assessed path
        addDuneLayer(false);          // DUNE complete
        addKsecondLayer(false);       // KSECOND complete
        addConnectorLayer();          // Connector from KSECOND end to transmission change marker

        // Add SINCON - animated
        addSinconLayer(true);

        // Show transmission change marker immediately
        showTransmissionChange();
        transChangeShown = true;

        // Start animation - FASTER (H2_ANIMATION_DURATION)
        progress = 0;
        phase = 'h2';
        running = true;
        startT = performance.now();
        animateH2();
    }

    function animateH2() {
        if (!running) return;

        const elapsed = performance.now() - startT;
        // Use faster H2 animation duration
        const pct = Math.min(elapsed / CONFIG.H2_ANIMATION_DURATION, 1);

        // Animate SINCON
        const sinconTotal = sinconCoords.length;
        const sinconIdx = Math.floor(pct * (sinconTotal - 1));
        const sinconSrc = map.getSource(SOURCE_SINCON);
        if (sinconSrc && sinconIdx >= 0) {
            sinconSrc.setData({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: sinconCoords.slice(0, sinconIdx + 1) }
            });
        }

        // Detection #5: Light Detection near Jiangsu (~75% through track)
        if (!det5Shown && pct >= 0.75) {
            det5Shown = true;
            showDetection5();
        }

        if (pct >= 1) {
            // Complete H2 phase
            if (sinconSrc) {
                sinconSrc.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: sinconCoords }
                });
            }
            phase = 'complete';
            running = false;
            console.log('  H2 Animation complete (faster)');
        } else {
            animId = requestAnimationFrame(animateH2);
        }
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        showMain,
        showH1,
        showH2,
        stop: clearAll,
        cleanup: clearAll,
        pause: stopAnim,
        resume: () => {
            if (!running) {
                running = true;
                if (phase === 'main') animateAssessedPath();
                else if (phase === 'h1') animateH1();
                else if (phase === 'h2') animateH2();
            }
        },
        getProgress: () => {
            if (phase === 'main') return 0;
            if (phase === 'h1') return 0.33;
            if (phase === 'h2') return 0.66;
            return 1;
        },
        isComplete: () => phase === 'complete'
    };
}

window.animateChapter11 = animateChapter11;
