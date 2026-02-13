/* ============================================
   THEIA YEAR IN REVIEW 2025 - CONFIG.JS
   Centralized Configuration Settings
   
   PURPOSE:
   - Single source of truth for settings
   - Easy customization of colors, text, etc.
   - Environment-specific configurations
   ============================================ */

   'use strict';

   /* ============================================
      API CONFIGURATION
      Purpose: external-service-settings
      ============================================ */
   const API_CONFIG = {
       // Mapbox
       mapbox: {
           accessToken: '',
           style: 'mapbox://styles/vivekpatil17/cmk2wc0ze007701s58d7q9kgl',
           // Alternative styles
           styles: {
               dark: 'mapbox://styles/mapbox/dark-v11',
               satellite: 'mapbox://styles/mapbox/satellite-v9',
               satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v12'
           }
       }
   };
   
   
   /* ============================================
      DESIGN CONFIGURATION
      Purpose: visual-design-tokens
      ============================================ */
   const DESIGN_CONFIG = {
       // Color palette
       colors: {
           // Primary
           theia: {
               blue: '#00b4ff',
               cyan: '#00e5ff',
               glow: 'rgba(0, 180, 255, 0.3)'
           },
           
           // Vessels
           vessel: {
               primary: '#00ff88',    // Main tracked vessel
               secondary: '#eff379',   // Secondary vessel
               tertiary: '#ff6b9d',    // Third vessel
               dark: '#ff3366',        // Dark/spoofing vessel
               spoofing: '#9d4edd',    // Spoofing indication
               military: '#ff6b35'     // Military vessels
           },
           
           // Status indicators
           status: {
               active: '#00ff88',
               warning: '#ffd700',
               danger: '#ff3366',
               neutral: '#ffffff'
           },
           
           // Background
           background: {
               deep: '#0a0f1a',
               primary: '#0d1220',
               secondary: '#141c2e',
               card: 'rgba(20, 28, 46, 0.85)',
               glass: 'rgba(13, 18, 32, 0.75)'
           },
           
           // Text
           text: {
               primary: '#ffffff',
               secondary: 'rgba(255, 255, 255, 0.75)',
               muted: 'rgba(255, 255, 255, 0.5)',
               dim: 'rgba(255, 255, 255, 0.3)'
           }
       },
       
       // Animation durations (ms)
       animation: {
           fast: 150,
           base: 300,
           slow: 500,
           smooth: 600,
           camera: 2500
       },
       
       // Map defaults
       map: {
           initialView: {
               center: [0, 20],
               zoom: 1.5,
               pitch: 0,
               bearing: 0
           },
           minZoom: 1,
           maxZoom: 18,
           attributionControl: false
       }
   };
   
   
   /* ============================================
      CONTENT CONFIGURATION
      Purpose: text-content-settings
      ============================================ */
   const CONTENT_CONFIG = {
       // Document metadata
       meta: {
           title: 'SynMax Theia: Year in Review 2025',
           description: 'Global Maritime Intelligence Coverage',
           year: 2025
       },
       
       // Opening section
       opening: {
           synmax: 'SynMax',
           theia: 'Theia:',
           title: 'Year in Review 2025',
           issueDate: 'January 2026',
           scrollText: 'SCROLL TO EXPLORE'
       },
       
       // Introduction section
       intro: {
           headline: 'Global Maritime Intelligence Coverage',
           subtext: 'Journey through 12 months of unprecedented maritime intelligence, tracking vessels across every ocean as they employed deceptive practices, evaded sanctions, and operated in contested waters.'
       },
       
       // Statistics section (placeholder - update with real data)
       stats: [
           { value: '14.9M', label: 'Total Detections' },
           { value: '2,847', label: 'Dark Vessels Tracked' },
           { value: '1,234', label: 'STS Transfers Identified' },
           { value: '892', label: 'Spoofing Events' },
           { value: '156', label: 'Countries Covered' },
           { value: '365', label: 'Days of Coverage' }
       ],
       
       // Editor quote
       quote: {
           text: '2025 marked a pivotal year in maritime intelligence. As evasion tactics grew more sophisticated, so did our ability to pierce the veil of darkness shrouding illicit maritime activities.',
           author: '— Intelligence Analysis Team, SynMax'
       },
       
       // Byline
       byline: {
           text: 'Research & Analysis by SynMax Intelligence Team',
           date: 'Published January 2026'
       },
       
       // CTA
       cta: {
           buttonText: 'Contact Theia',
           buttonUrl: 'https://www.synmax.com/contact'
       },
       
       // Credits
       credits: [
           'Built with Mapbox GL JS',
           'Data: SynMax Theia Platform',
           '© 2025 SynMax Intelligence'
       ]
   };
   
   
   /* ============================================
      CHAPTER DATE RANGES
      Purpose: timeline-date-mappings
      ============================================ */
   const DATE_RANGES = {
       january: {
           start: 'DEC 24, 2024',
           end: 'JAN 25, 2025',
           description: 'TASCA deceptive practices in Malacca Strait'
       },
       february: {
           start: 'FEB 25, 2025',
           end: 'MAR 13, 2025',
           description: 'Chinese Jack-Up Barges dark transit'
       },
       march: {
           start: 'MAR 15, 2025',
           end: 'MAY 12, 2025',
           description: 'OCEANA ROSE Iran-Vietnam spoofing'
       },
       april: {
           start: 'MAY 24, 2025',
           end: 'JUN 03, 2025',
           description: 'KIBA Mozambique spoofing operation'
       },
       may: {
           start: 'MAY 24, 2025',
           end: 'JUN 03, 2025',
           description: 'FALCON Russian LPG spoofing'
       },
       june: {
           start: 'JUN 30, 2025',
           end: 'JUL 09, 2025',
           description: 'ETERNITY C Houthi attack & sinking'
       },
       july: {
           start: 'JUL 20, 2025',
           end: 'SEP 17, 2025',
           description: 'MATROS SHEVCHENKO Crimea-Egypt dark transit'
       },
       august: {
           start: 'AUG 03, 2025',
           end: 'AUG 15, 2025',
           description: 'China-Russia naval exercise'
       },
       september: {
           start: 'AUG 29, 2025',
           end: 'OCT 02, 2025',
           description: 'ARCTIC VOSTOK sanctioned LNG to China'
       },
       october: {
           start: 'AUG 29, 2025',
           end: 'OCT 02, 2025',
           description: 'LNG PHECDA infrastructure loitering'
       },
       november: {
           start: 'JUL 16, 2025',
           end: 'NOV 18, 2025',
           description: 'DUNE & STELLAR ORACLE Jask oil export'
       },
       december: {
           start: 'NOV 14, 2025',
           end: 'DEC 11, 2025',
           description: 'SKIPPER Venezuelan oil seizure'
       }
   };
   
   
   /* ============================================
      LAYER STYLING PRESETS
      Purpose: mapbox-layer-styles
      ============================================ */
   const LAYER_STYLES = {
       // AIS track line
       aisTrack: {
           type: 'line',
           paint: {
               'line-color': '#00ff88',
               'line-width': 2,
               'line-opacity': 0.9
           }
       },
       
       // Dark track line
       darkTrack: {
           type: 'line',
           paint: {
               'line-color': '#ff3366',
               'line-width': 2,
               'line-opacity': 0.9,
               'line-dasharray': [2, 2]
           }
       },
       
       // Spoofed position track
       spoofedTrack: {
           type: 'line',
           paint: {
               'line-color': '#9d4edd',
               'line-width': 2,
               'line-opacity': 0.7,
               'line-dasharray': [4, 4]
           }
       },
       
       // Zone fill (STS, dark, etc.)
       zoneFill: {
           type: 'fill',
           paint: {
               'fill-color': 'rgba(255, 107, 53, 0.3)',
               'fill-opacity': 0.5
           }
       },
       
       // Zone outline
       zoneOutline: {
           type: 'line',
           paint: {
               'line-color': '#ff6b35',
               'line-width': 1,
               'line-opacity': 0.8
           }
       },
       
       // Detection points
       detectionPoint: {
           type: 'circle',
           paint: {
               'circle-radius': 6,
               'circle-color': '#00b4ff',
               'circle-opacity': 0.9,
               'circle-stroke-width': 2,
               'circle-stroke-color': '#ffffff'
           }
       },
       
       // Glow effect layer
       glowEffect: {
           type: 'line',
           paint: {
               'line-color': '#00ff88',
               'line-width': 8,
               'line-opacity': 0.3,
               'line-blur': 4
           }
       }
   };
   
   
   /* ============================================
      FEATURE FLAGS
      Purpose: toggle-functionality
      ============================================ */
   const FEATURE_FLAGS = {
       // Enable/disable features
       enableHorizontalScroll: true,
       enableMiniMap: true,
       enableVesselPanel: true,
       enableDetectionCounter: true,
       enableTimeline: true,
       enableCollageAnimation: true,
       enableTypewriterEffect: true,
       
       // Debug options
       debugMode: false,
       showFPS: false,
       logTransitions: true
   };
   
   
   /* ============================================
      EXPORTS
      Purpose: global-config-access
      ============================================ */
   window.API_CONFIG = API_CONFIG;
   window.DESIGN_CONFIG = DESIGN_CONFIG;
   window.CONTENT_CONFIG = CONTENT_CONFIG;
   window.DATE_RANGES = DATE_RANGES;
   window.LAYER_STYLES = LAYER_STYLES;
   window.FEATURE_FLAGS = FEATURE_FLAGS;
