/* ============================================
   THEIA YEAR IN REVIEW 2025 - MAP.JS
   Main Map Controller & Scrollytelling Engine
   
   STRUCTURE:
   1. Global State Management
   2. Configuration Objects
   3. Map Initialization
   4. Cleanup Functions (Critical!)
   5. Layer Management
   6. Marker Management
   7. Chapter Handlers
   8. Scroll Controllers
   9. Event Listeners
   10. Initialization
   ============================================ */

   'use strict';

   /* ============================================
      1. GLOBAL STATE MANAGEMENT
      Purpose: centralized-state-tracking
      ============================================ */
   const STATE = {
       // Map instances
       map: null,
       miniMap: null,
       miniMarker: null,
       introMap: null,
       
       // Split-screen maps (Chapter 7)
       splitMapLeft: null,
       splitMapRight: null,
       splitScreenActive: false,

       // Current position
       currentChapter: null,
       previousChapter: null,

       // Transition control
       isTransitioning: false,
       pendingChapter: null,        // Latest chapter to transition to (replaces queue)
       debounceTimeout: null,       // Debounce timer for fast scrolling
       flyToCallbackId: null,       // Track flyTo callback to cancel if needed
       lastTransitionTime: 0,       // Track last transition timestamp for rapid scroll detection
       rapidScrollCleanupId: null,  // Safety cleanup for rapid scrolling

       // Animation tracking
       activeAnimations: [],
       activeTimeouts: [],
       activeIntervals: [],

       // Markers tracking (also accessible as activeMarkers/activePopups for cleanup)
       markers: {
           main: [],
           mini: [],
           detection: [],
           vessel: []
       },
       activeMarkers: [],           // Flat list for easy cleanup
       activePopups: [],            // Flat list for easy cleanup

       // Popups tracking
       popups: [],

       // Layers tracking
       activeLayers: [],
       activeSources: [],

       // Scroll type (vertical/horizontal)
       scrollType: 'vertical',
       horizontalProgress: 0,

       // Horizontal scroll mode
       isHorizontalMode: false,
       currentHorizontalChapter: null,

       // Data cache
       dataCache: {},

       // Cleanup flags
       cleanupInProgress: false
   };
   
   
   /* ============================================
      2. CONFIGURATION OBJECTS
      Purpose: chapter-definitions-data
      ============================================ */
   
   // Mapbox access token
   const MAPBOX_TOKEN = 'pk.eyJ1Ijoidml2ZWtwYXRpbDE3IiwiYSI6ImNtOTBhc2E1ZTA1cTEyanBxaWJ0M2NkOTcifQ.hkIZBo-Qa-U651UubO87fw';
   
   // Map style
   const MAP_STYLE = 'mapbox://styles/vivekpatil17/cmlfm4wke005101ql8ss514dh';
   
   // Initial map view
   const INITIAL_VIEW = {
       center: [0, 20],
       zoom: 1.5,
       pitch: 0,
       bearing: 0
   };
   
   // Chapter configurations - DUMMY COORDS (replace with actual)
   const CHAPTERS = {
       // === INTRO ===
       intro: {
           id: 'intro',
           month: null,
           title: 'Global Maritime Intelligence Coverage',
           dateRange: { start: 'JAN 2025', end: 'DEC 2025' },
           camera: {
               center: [0, 20],
               zoom: 1.8,
               pitch: 0,
               bearing: 0,
               duration: 2000
           },
           scrollType: 'vertical',
           layers: [],
           legend: [],
           vessels: [],
           dataFile: null,
           animateFile: 'animatechapter-intro'
       },
       
       // === JANUARY: TASCA - STS Transfer ===
       january: {
           id: 'january',
           month: '01',
           title: 'The Transfer',
           subtitle: 'STS Detection West of Malaysia',
           region: 'Malacca Strait',
           dateRange: { start: '14 Nov 2024', end: '14 Nov 2024' },
           camera: {
               center: [101.917, 2.3433],  // STS location
               zoom: 9.4,
               pitch: 19,
               bearing: 0,
               duration: 2500
           },
           scrollType: 'vertical',
           layers: [],
           legend: [
               { type: 'svg', icon: 'assets/svg/lightstsdectection.svg', label: 'Light STS Detection' }
           ],
           vesselInfo: {
               vessel1: {
                   name: 'TASCA',
                   imo: '9313149',
                   cargo: 'CRUDE OIL',
                   operation: 'STS TRANSFER'
               },
               vessel2: {
                   name: 'VERONICA III',
                   imo: '9256498',
                   cargo: 'CRUDE OIL',
                   operation: 'STS TRANSFER'
               }
           },
           dataFile: 'data/chapter1-tasca.geojson',
           animateFile: 'animatechapter1',
           hasHorizontal: false,
           horizontalChapter: null
       },

       // === JANUARY H1: TASCA Route Tracking ===
       'january-h1': {
           id: 'january-h1',
           month: '01',
           title: 'TASCA',
           subtitle: 'Tracking the Shadow Tanker',
           region: 'Malacca Strait → South China Sea',
           dateRange: { start: '14 Nov 2024', end: '24 Dec 2024' },
           camera: {
               center: [102.803, 2.083],
               zoom: 7.38,
               pitch: 0,
               bearing: -29.6,
               duration: 1800
           },
           scrollType: 'vertical',
           isSubChapter: true,
           parentChapter: 'january',
           subChapterAction: 'showPath',
           layers: [],
           legend: [
               { type: 'line', color: '#00ff88', label: 'TASCA AIS Track' }
           ],
           vesselInfo: {
               vessel1: {
                   name: 'TASCA',
                   imo: '9313149',
                   cargo: 'CRUDE OIL',
                   operation: 'AIS TRACKING'
               }
           },
           dataFile: 'data/chapter1-tasca.geojson',
           animateFile: 'animatechapter1'
       },

       // === JANUARY H2: Deck Repainting Detection ===
       'january-h2': {
           id: 'january-h2',
           month: '01',
           title: 'Caught Painting',
           subtitle: 'Identity Evasion Detected',
           region: 'South China Sea',
           dateRange: { start: '01 Jan 2025', end: '10 Feb 2025' },
           camera: {
               center: [104.7135, 2.0003],
               zoom: 9.21,
               pitch: 0,
               bearing: 0,
               duration: 1800
           },
           scrollType: 'vertical',
           isSubChapter: true,
           parentChapter: 'january',
           subChapterAction: 'showGalleryKeepPath',
           layers: [],
           legend: [
               { type: 'line', color: '#00ff88', label: 'TASCA AIS Track' },
               { type: 'svg', icon: 'assets/svg/darkdetection.svg', label: 'Dark Detection' }
           ],
           vesselInfo: {
               vessel1: {
                   name: 'TASCA',
                   imo: '9313149',
                   cargo: 'CRUDE OIL',
                   operation: 'DECK REPAINTING'
               }
           },
           dataFile: 'data/chapter1-tasca.geojson',
           animateFile: 'animatechapter1'
       },

       // === FEBRUARY: CHINESE JACK-UP BARGES ===
       february: {
           id: 'february',
           month: '02',
           title: 'Chinese Jack-Up Barges',
           subtitle: 'Unattributed Departure',
           region: 'Guangzhou Shipyard, Longxue Island',
           dateRange: { start: 'FEB 25, 2025', end: 'MAR 13, 2025' },
           camera: {
               center: [113.645, 22.705],  // Guangzhou/Shenzhen area - AOI 1
               zoom: 9,
               pitch: 0,
               bearing: 20,
               duration: 2500
           },
           scrollType: 'vertical',
           layers: [],
           legend: [
               { type: 'svg', icon: 'assets/svg/unattributed.svg', label: 'Unattributed Detection' },
               { type: 'area', color: '#ffaa00', label: 'Area of Interest' }
           ],
           vesselInfo: {
               vessel1: {
                   name: 'JACK-UP BARGES (×3)',
                   imo: 'UNATTRIBUTED',
                   cargo: 'CONSTRUCTION',
                   operation: 'DARK DEPARTURE'
               }
           },
           dataFile: 'data/chapter2-barges.geojson',
           animateFile: 'animatechapter2',
           hasHorizontal: false,  // Disabled - using vertical sub-chapter (february-h1) instead
           horizontalChapter: null
       },

       // === FEBRUARY H1: Beach Operations ===
       'february-h1': {
           id: 'february-h1',
           month: '02',
           title: 'Beach Operations',
           subtitle: 'Artificial Dock Construction',
           region: 'Nansan Island, China',
           dateRange: { start: 'FEB 27, 2025', end: 'MAR 13, 2025' },
           camera: {
               center: [110.60, 21.13],  // Nansan Island area - centered on markers
               zoom: 11.1,
               pitch: 20,
               bearing: -30,
               duration: 2000
           },
           scrollType: 'vertical',
           isSubChapter: true,
           parentChapter: 'february',
           sameFamily: false,  // Changed to false - let it create fresh controller
           subChapterAction: 'showCourse',  // Triggers showCourse() in animatechapter2
           layers: [],
           legend: [
               { type: 'svg', icon: 'assets/svg/unattributed.svg', label: 'Barge Position' },
               { type: 'line', color: '#ffffff', label: 'Bailey Bridge' },
               { type: 'line', color: '#E8A0A0', label: 'Assessed Course' },
               { type: 'area', color: '#ffaa00', label: 'Area of Interest' }
           ],
           vesselInfo: {
               vessel1: {
                   name: 'JACK-UP BARGES (×3)',
                   imo: 'UNATTRIBUTED',
                   cargo: 'AMPHIBIOUS OPS',
                   operation: 'DOCK FORMATION'
               }
           },
           dataFile: 'data/chapter2-barges.geojson',
           animateFile: 'animatechapter2'
       },

       // === FEBRUARY DETAIL: Horizontal Sub-Chapter (DEPRECATED) ===
       'february-detail': {
           id: 'february-detail',
           month: '02',
           title: 'Barges Transit Tracking',
           subtitle: 'Assessed Course to Nansan Island',
           region: 'Zhanjiang, China',
           dateRange: { start: 'FEB 27, 2025', end: 'MAR 13, 2025' },
           camera: null,
           scrollType: 'horizontal',
           isSubChapter: true,
           parentChapter: 'february',
           horizontalConfig: {
               totalSlides: 1,
               slideData: [
                   {
                       id: 'assessed-course',
                       camera: { center: [111.5, 21.8], zoom: 8.0, pitch: 40, bearing: 15 },
                       action: 'showCourse'
                   }
               ]
           },
           layers: [],
           legend: [
               { type: 'dot', color: '#ff4466', label: 'Barge Detection' },
               { type: 'area', color: '#ffaa00', label: 'Area of Interest' },
               { type: 'line', color: '#ff6b9d', label: 'Assessed Course' }
           ],
           vesselInfo: {
               vessel1: {
                   name: 'JACK-UP BARGES',
                   imo: 'UNATTRIBUTED',
                   cargo: 'CONSTRUCTION',
                   operation: 'ARTIFICIAL DOCK'
               }
           },
           dataFile: null,
           animateFile: null
       },
       
       // === MARCH: OCEANA ROSE ===
       march: {
           id: 'march',
           month: '03',
           title: 'OCEANA ROSE',
           subtitle: 'AIS Spoofing in Persian Gulf',
           region: 'Persian Gulf',
           dateRange: { start: 'MAR 15, 2025', end: 'APR 22, 2025' },
           camera: {
               center: [56.119, 28.125],  // Persian Gulf focus: Kuwait to Iran coast
               zoom: 5.3,
               pitch: 0,
               bearing: 0,
               duration: 2500
           },
           scrollType: 'vertical',
           layers: [],
           legend: [
               { type: 'svg', icon: 'assets/svg/lightdetection.svg', label: 'Light Detection' },
               { type: 'svg', icon: 'assets/svg/darkdetection.svg', label: 'Dark Detection' },
               { type: 'svg', icon: 'assets/svg/spoofing.svg', label: 'AIS Spoofing' }
           ],
           vesselInfo: {
               vessel1: {
                   name: 'OCEANA ROSE',
                   imo: '9293966',
                   cargo: 'WHITE AGGREGATE',
                   operation: '37D AIS SPOOF'
               }
           },
           dataFile: 'data/chapter3-oceana-rose.geojson',
           animateFile: 'animatechapter3',
           hasHorizontal: false,  // Disabled - using vertical sub-chapter (march-h1) instead
           horizontalChapter: null
       },

       // === MARCH H1: Sea-Based Unloading in Vietnam ===
       'march-h1': {
           id: 'march-h1',
           month: '03',
           title: 'Sea-Based Unloading',
           subtitle: 'Iran → Ha Long Bay, Vietnam',
           region: 'Indian Ocean to Vietnam',
           dateRange: { start: 'MAR 15, 2025', end: 'MAY 12, 2025' },
           camera: {
               center: [73.22, 21.19],  // Wide view showing full transit
               zoom: 3.2,
               pitch: 0,
               bearing: 0,
               duration: 2000
           },
           scrollType: 'vertical',
           isSubChapter: true,
           parentChapter: 'march',
           sameFamily: false,
           subChapterAction: 'showH1',  // Triggers showH1() in animatechapter3
           layers: [],
           legend: [
               { type: 'line', color: '#00ff88', label: 'Vessel Track' },
               { type: 'svg', icon: 'assets/svg/lightdetection.svg', label: 'Light Detection' }
           ],
           vesselInfo: {
               vessel1: {
                   name: 'OCEANA ROSE',
                   imo: '9293966',
                   cargo: 'WHITE AGGREGATE',
                   operation: 'BARGE TRANSFER'
               }
           },
           dataFile: 'data/chapter3-oceana-rose.geojson',
           animateFile: 'animatechapter3'
       },
       
       // === APRIL: KIBA ===
       april: {
           id: 'april',
           month: '04',
           title: 'KIBA',
           subtitle: 'AIS Spoofing at Asalouyeh',
           region: 'Gulf of Oman, Iran',
           dateRange: { start: 'APR 30, 2025', end: 'MAY 20, 2025' },
           camera: {
               center: [54.5, 26.5],    // Strait of Hormuz focus
               zoom: 5,
               pitch: 10,
               bearing: 20,
               duration: 2000
           },
           scrollType: 'vertical',
           layers: [],
           legend: [
               { type: 'line', color: '#00ff88', label: 'Vessel Track' },
               { type: 'svg', icon: 'assets/svg/darkdetection.svg', label: 'Dark Detection' },
               { type: 'svg', icon: 'assets/svg/spoofing.svg', label: 'AIS Spoof Location' },
               { type: 'svg', icon: 'assets/svg/lightdetection.svg', label: 'Light Detection' }
           ],
           vesselInfo: {
               vessel1: {
                   name: 'KIBA',
                   imo: '9315407',
                   cargo: 'BULK CARGO',
                   operation: '21D AIS SPOOF'
               }
           },
           dataFile: 'data/chapter4-kiba.geojson',
           animateFile: 'animatechapter4',
           hasHorizontal: false,
           horizontalChapter: null
       },

       // === APRIL H1: KIBA Transit to Mozambique ===
       'april-h1': {
           id: 'april-h1',
           month: '04',
           title: 'Transit to Beira',
           subtitle: 'Gulf of Oman → Mozambique',
           region: 'Arabian Sea to East Africa',
           dateRange: { start: 'MAY 21, 2025', end: 'JUL 07, 2025' },
           camera: {
               center: [21.61, 10],
               zoom: 2.91,
               pitch: 0,
               bearing: 0,
               duration: 2000
           },
           scrollType: 'vertical',
           isSubChapter: true,
           parentChapter: 'april',
           sameFamily: false,
           subChapterAction: 'showH1',  // Triggers showH1() in animatechapter4
           layers: [],
           legend: [
               { type: 'line', color: '#00ff88', label: 'Vessel Track' },
               { type: 'svg', icon: 'assets/svg/lightdetection.svg', label: 'Light Detection' }
           ],
           vesselInfo: {
               vessel1: {
                   name: 'KIBA',
                   imo: '9315407',
                   cargo: 'IRAN BULK',
                   operation: '38D TRANSIT'
               }
           },
           dataFile: 'data/chapter4-kiba.geojson',
           animateFile: 'animatechapter4'
       },
       
       // === MAY: FALCON ===
       may: {
           id: 'may',
           month: '05',
           title: 'FALCON',
           subtitle: 'AIS Spoofing at Ust-Luga',
           region: 'Baltic Sea, Gulf of Finland',
           dateRange: { start: 'MAY 25, 2025', end: 'JUN 03, 2025' },
           hideChapterInfo: true,
           camera: {
               center: [16.03, 57.46],
               zoom: 4.1,
               pitch: 0,
               bearing: -10,
               duration: 2500
           },
           scrollType: 'vertical',
           layers: [],
           legend: [
               { type: 'line', color: '#00ff88', label: 'FALCON Track' },
               { type: 'svg', icon: 'assets/svg/lightdetection.svg', label: 'Light Detection' },
               { type: 'svg', icon: 'assets/svg/darkdetection.svg', label: 'Dark Detection' },
               { type: 'svg', icon: 'assets/svg/unattributed.svg', label: 'Unattributed' },
               { type: 'svg', icon: 'assets/svg/spoofing.svg', label: 'Spoof Position' }
           ],
           vesselInfo: {
               vessel1: {
                   name: 'FALCON',
                   imo: '9014432',
                   cargo: 'RUSSIAN LPG',
                   operation: '7D AIS SPOOF'
               }
           },
           dataFile: 'data/chapter5-falcon.geojson',
           animateFile: 'animatechapter5'
       },
       
       // === JUNE: ETERNITY C ===
       june: {
           id: 'june',
           month: '06',
           title: 'ETERNITY C',
           subtitle: 'Houthi Attack → Vessel Sunk',
           region: 'Red Sea, Gulf of Aden',
           dateRange: { start: 'JUN 30, 2025', end: 'JUL 09, 2025' },
           hideChapterInfo: true,
           camera: {
               center: [31.88, 24.14],
               zoom: 4.05,
               pitch: 0,
               bearing: 8,
               duration: 2500
           },
           scrollType: 'vertical',
           layers: [],
           legend: [
               { type: 'line', color: '#00ff88', label: 'ETERNITY C AIS Track' },
               { type: 'line', color: '#ff6b6b', label: 'ETERNITY C Assessed Track', style: 'dotted' },
               { type: 'svg', icon: 'assets/svg/lightdetection.svg', label: 'Light Detection' },
               { type: 'svg', icon: 'assets/svg/darkdetection.svg', label: 'Dark Detection' }
           ],
           vesselInfo: {
               vessel1: {
                   name: 'ETERNITY C',
                   imo: '9588249',
                   cargo: 'BULK CARGO',
                   operation: 'SUNK 09 JUL'
               }
           },
           dataFile: 'data/chapter6-eternity.geojson',
           animateFile: 'animatechapter6'
       },
       
       // === JULY: MATROS SHEVCHENKO ===
       july: {
           id: 'july',
           month: '07',
           title: 'MATROS SHEVCHENKO',
           subtitle: 'Crimea to Egypt Dark Transit',
           region: 'Black Sea to Mediterranean',
           dateRange: { start: 'JUL 20, 2025', end: 'SEP 17, 2025' },
           hideChapterInfo: true,
           // SPLIT SCREEN CONFIG
           splitScreen: true,
           leftCamera: {
               center: [34.817, 45.482],      // Black Sea / Crimea focus
               zoom: 5.3,
               pitch: 0,
               bearing: 0,
               duration: 2000
           },
           rightCamera: {
               center: [31.5, 36.5],      // Istanbul to Egypt overview
               zoom: 4,
               pitch: 0,
               bearing: 0,
               duration: 2000
           },
           camera: {
               center: [29.71, 39.73],    // Fallback for single map mode
               zoom: 4,
               pitch: 0,
               bearing: 0,
               duration: 2500
           },
           scrollType: 'vertical',
           layers: [],
           legend: [
               { type: 'line', color: '#00ff88', label: 'MATROS SHEVCHENKO AIS Track' },
               { type: 'line', color: '#00ff88', label: 'MATROS SHEVCHENKO Assessed Course', style: 'dotted' },
               { type: 'svg', icon: 'assets/svg/lightdetection.svg', label: 'Light Detection' },
               { type: 'svg', icon: 'assets/svg/darkdetection.svg', label: 'Dark Detection' },
               { type: 'svg', icon: 'assets/svg/humintdetection.svg', label: 'HUMINT Detection' }
           ],
           vesselInfo: {
               vessel1: {
                   name: 'MATROS SHEVCHENKO',
                   imo: '9574195',
                   cargo: 'GRAIN',
                   operation: 'DARK TRANSIT'
               }
           },
           dataFile: 'data/chapter7-matros.geojson',
           animateFile: 'animatechapter7'
       },
       
       // === AUGUST: NAVAL EXERCISE ===
       august: {
           id: 'august',
           month: '08',
           title: 'ZHU HAI YUN',
           subtitle: 'China\'s Autonomous Drone Mothership',
           region: 'South China Sea • Spratly Islands',
           dateRange: { start: 'JUL 28, 2025', end: 'AUG 17, 2025' },
           camera: {
               center: [117.258, 10.977],
               zoom: 5.67,
               pitch: 0,
               bearing: 0,
               duration: 2500
           },
           scrollType: 'vertical',
           layers: ['august-vessel-track'],
           legend: [
               { type: 'line', color: '#00ff88', label: 'ZHU HAI YUN AIS Track' },
               { type: 'svg', icon: 'assets/svg/lightdetection.svg', label: 'Light Detection' }
           ],
           vessels: [
               { name: 'ZHU HAI YUN', color: '#00ff88', status: 'Autonomous' }
           ],
           dataFile: 'data/ZHUHAIYUN AIS Data_track_time_windows_min (1).geojson',
           animateFile: 'animatechapter8'
       },
       
       // === SEPTEMBER: ARCTIC VOSTOK ===
       september: {
           id: 'september',
           month: '09',
           title: 'ARCTIC VOSTOK',
           subtitle: 'STS Transfer from KORYAK FSU',
           region: 'Kamchatka, Russia',
           dateRange: { start: 'AUG 29, 2025', end: 'SEP 05, 2025' },
           hideChapterInfo: true,
           camera: {
               center: [160.44, 53.58],  // Koryak FSU location
               zoom: 4.69,
               pitch: 35,
               bearing: 15,
               duration: 2500
           },
           scrollType: 'vertical',
           layers: [],
           legend: [
               { type: 'line', color: '#00ff88', label: 'ARCTIC VOSTOK AIS Track' },
               { type: 'svg', icon: 'assets/svg/bunkering.svg', label: 'STS / Bunkering Detection' }
           ],
           vesselInfo: {
               vessel1: {
                   name: 'KORYAK FSU',
                   imo: '9253724',
                   cargo: 'LNG STORAGE',
                   operation: 'STS TRANSFER'
               },
               vessel2: {
                   name: 'ARCTIC VOSTOK',
                   imo: '9216298',
                   cargo: 'LNG',
                   operation: 'OFAC SANCTIONED'
               }
           },
           dataFile: 'data/chapter9-arcticvostok.geojson',
           animateFile: 'animatechapter9',
           hasHorizontal: false,
           horizontalChapter: null
       },

       // === SEPTEMBER H1: Erratic Transit Pattern ===
       'september-h1': {
           id: 'september-h1',
           month: '09',
           title: 'Beihai LNG Delivery',
           subtitle: '7th Sanctioned LNG at Beihai in 2025',
           region: 'Gulf of Tonkin → Beihai, China',
           dateRange: { start: 'SEP 16, 2025', end: 'OCT 02, 2025' },
           camera: {
               center: [110.5, 17.905],  // Gulf of Tonkin area
               zoom: 5.3,
               pitch: 0,
               bearing: 0,
               duration: 2000
           },
           scrollType: 'vertical',
           isSubChapter: true,
           parentChapter: 'september',
           subChapterAction: 'showH1',
           layers: [],
           legend: [
               { type: 'line', color: '#00ff88', label: 'ARCTIC VOSTOK AIS Track' },
               { type: 'svg', icon: 'assets/svg/lightdetection.svg', label: 'Light Detection' }
           ],
           vesselInfo: {
               vessel1: {
                   name: 'ARCTIC VOSTOK',
                   imo: '9216298',
                   cargo: 'LNG CARGO',
                   operation: '7TH SANCTIONED'
               }
           },
           dataFile: null,
           animateFile: null
       },
       
       // === OCTOBER: LNG PHECDA ===
       october: {
           id: 'october',
           month: '10',
           title: 'LNG PHECDA',
           subtitle: 'Critical Infrastructure Loitering',
           region: 'Irish Sea / Bay of Biscay',
           dateRange: { start: 'AUG 29, 2025', end: 'OCT 02, 2025' },
           camera: {
               center: [-8, 50],  // Irish Sea / Bay of Biscay
               zoom: 5,
               pitch: 35,
               bearing: 15,
               duration: 2500
           },
           scrollType: 'vertical',
           layers: ['october-ais-track', 'october-loiter-zones'],
           legend: [
               { type: 'line', color: '#eff379', label: 'AIS Track' },
               { type: 'area', color: 'rgba(255, 215, 0, 0.3)', label: 'Loiter Zone' }
           ],
           vessels: [
               { name: 'LNG PHECDA', color: '#eff379', status: 'Loitering' }
           ],
           dataFile: 'data/chapter10-october.geojson',
           animateFile: 'animatechapter10'
       },
       
       // === NOVEMBER: DUNE & STELLAR ORACLE ===
       november: {
           id: 'november',
           month: '11',
           title: 'DUNE & STELLAR ORACLE',
          subtitle: 'Iranian Oil Export via Identity Spoofing',
          region: 'Iran to China',
          dateRange: { start: '23 Jul 2025', end: '15 Nov 2025' },
           hideChapterInfo: true,
           camera: {
               center: [75.81, 22.04],  // Jask, Iran
               zoom: 3.3,
               pitch: 0,
               bearing: 0,
               duration: 2500
           },
           scrollType: 'vertical',
           layers: [],
           legend: [
               { type: 'line', color: '#00ff88', label: 'DUNE Assessed Path', style: 'dotted' },
               { type: 'svg', icon: 'assets/svg/darkdetection.svg', label: 'Dark Detection' }
           ],
           vesselInfo: {
               vessel1: {
                   name: 'DUNE',
                   imo: '9236804',
                   cargo: 'CRUDE OIL',
                   operation: 'DARK LOADING'
               }
           },
           dataFile: 'data/chapter11-dune-assessed.geojson',
           animateFile: 'animatechapter11',
           hasHorizontal: false,
           horizontalChapter: null
       },

       // === NOVEMBER H1: STS Transfer ===
       'november-h1': {
           id: 'november-h1',
           month: '11',
           title: 'STS Transfer Operation',
          subtitle: 'DUNE meets STELLAR ORACLE',
          region: 'South China Sea',
          dateRange: { start: '15 Aug 2025', end: '26 Sep 2025' },
           camera: {
               center: [111.95, 4.25],  // STS location
               zoom: 4.55,
               pitch: 0,
               bearing: 0,
               duration: 2000
           },
           scrollType: 'vertical',
           isSubChapter: true,
           parentChapter: 'november',
           subChapterAction: 'showH1',
           layers: [],
           legend: [
               { type: 'line', color: '#00ff88', label: 'DUNE AIS Track' },
               { type: 'line', color: '#00ff88', label: 'DUNE Assessed Path', style: 'dotted' },
               { type: 'line', color: '#6cb4ee', label: 'STELLAR ORACLE (KSECOND) Track' },
               { type: 'svg', icon: 'assets/svg/lightdetection.svg', label: 'Light Detection' },
               { type: 'svg', icon: 'assets/svg/bunkering.svg', label: 'STS Detection' }
           ],
           vesselInfo: {
               vessel1: {
                   name: 'DUNE',
                   imo: '9236804',
                   cargo: 'CRUDE OIL',
                   operation: 'STS DISCHARGE'
               },
               vessel2: {
                   name: 'STELLAR ORACLE',
                   imo: '9194127',
                   cargo: 'CRUDE OIL',
                   operation: 'AS KSECOND'
               }
           },
           dataFile: 'data/chapter11-dune.geojson',
           animateFile: 'animatechapter11'
       },

       // === NOVEMBER H2: Identity Spoofing ===
       'november-h2': {
           id: 'november-h2',
           month: '11',
           title: 'Identity Spoofing',
          subtitle: 'STELLAR ORACLE becomes SINCON',
          region: 'Taiwan to Yellow Sea',
          dateRange: { start: '04 Oct 2025', end: '15 Nov 2025' },
           camera: {
               center: [122.116583, 30],  // Near Taiwan / Yellow Sea
               zoom: 4.5,
               pitch: 0,
               bearing: 0,
               duration: 2000
           },
           scrollType: 'vertical',
           isSubChapter: true,
           parentChapter: 'november',
           subChapterAction: 'showH2',
           layers: [],
          legend: [
              { type: 'line', color: '#00ff88', label: 'DUNE AIS Track' },
              { type: 'line', color: '#00ff88', label: 'DUNE Assessed Path', style: 'dotted' },
              { type: 'line', color: '#6cb4ee', label: 'STELLAR ORACLE (KSECOND) Track' },
              { type: 'line', color: '#a78bfa', label: 'STELLAR ORACLE (SINCON) Track' },
              { type: 'svg', icon: 'assets/svg/lightdetection.svg', label: 'Light Detection' },
              { type: 'svg', icon: 'assets/svg/transmissionchange.svg', label: 'Transmission Change' }
          ],
          vesselInfo: {
              vessel1: {
                  name: 'STELLAR ORACLE',
                  imo: '9194127',
                  cargo: 'CRUDE OIL',
                  operation: 'AS SINCON'
              }
          },
          dataFile: 'data/chapter11-sincon.geojson',
           animateFile: 'animatechapter11'
       },
       
       // === DECEMBER: SKIPPER ===
       december: {
           id: 'december',
           month: '12',
           title: 'SKIPPER',
           subtitle: 'Venezuelan Oil Seizure',
           region: 'Venezuela / Caribbean',
           dateRange: { start: '14 Nov 2025', end: '11 Dec 2025' },
           hideChapterInfo: true,
           camera: {
               center: [-59.989, 10.562],  // Venezuela / Caribbean
               zoom: 5.4,
               pitch: 2,
               bearing: 14.4,
               duration: 2500
           },
           scrollType: 'vertical',
           layers: [],
           legend: [
               { type: 'line', color: '#00ff88', label: 'SKIPPER AIS Track' },
               { type: 'line', color: '#00ff88', label: 'SKIPPER Assessed Course', style: 'dotted' },
               { type: 'svg', icon: 'assets/svg/darkdetection.svg', label: 'Dark Detection' },
               { type: 'svg', icon: 'assets/svg/lightdarkstsdetection.svg', label: 'Light-Dark STS Detection' },
               { type: 'svg', icon: 'assets/svg/spoofing.svg', label: 'AIS Spoofing' }
           ],
           vesselInfo: {
               vessel1: {
                   name: 'SKIPPER',
                   imo: '9220772',
                   cargo: 'CRUDE OIL',
                   operation: 'US SEIZURE'
               }
           },
           dataFile: 'data/chapter12-skipper.geojson',
           animateFile: 'animatechapter12'
       }
   };

   // Chapter order for navigation (includes sub-chapters)
   const CHAPTER_ORDER = [
       'intro',
       'january',
       'january-h1',
       'january-h2',
       'february',
       'february-h1',
       'march',
       'march-h1',
       'april',
       'april-h1',
       'may',
       'june',
       'july',
       'august',
       'september',
       'october',
       'november',
       'november-h1',
       'november-h2',
       'december'
   ];
   
   
   /* ============================================
      3. MAP INITIALIZATION
      Purpose: setup-map-instances
      ============================================ */
   
   /**
    * Initialize main map
    * Purpose: create-main-mapbox
    */
   function initMainMap() {
       mapboxgl.accessToken = MAPBOX_TOKEN;
       
       STATE.map = new mapboxgl.Map({
           container: 'map',
           style: MAP_STYLE,
           center: INITIAL_VIEW.center,
           zoom: INITIAL_VIEW.zoom,
           pitch: INITIAL_VIEW.pitch,
           bearing: INITIAL_VIEW.bearing,
           interactive: false,  // Disable user interaction
           attributionControl: false,
           logoPosition: 'bottom-left',
           dragPan: false,
           dragRotate: false,
           scrollZoom: false,
           touchZoomRotate: false,
           doubleClickZoom: false,
           keyboard: false
       });
       
       STATE.map.on('load', () => {
           console.log('[MAP] Main map loaded');
           onMainMapReady();
       });
       
       STATE.map.on('error', (e) => {
           console.error('[MAP] Map error:', e);
       });
   }
   
   /**
    * Initialize mini map
    * Purpose: create-overview-minimap
    * Uses light style for better contrast
    */
   function initMiniMap() {
       const container = document.getElementById('mini-map');
       if (!container) {
           console.warn('[MAP] Mini map container not found');
           return;
       }
       
       // Use light map style for better contrast
       STATE.miniMap = new mapboxgl.Map({
           container: 'mini-map',
           style: 'mapbox://styles/mapbox/light-v11',
           center: [0, 20],
           zoom: 1.5,
           interactive: false,
           attributionControl: false,
           preserveDrawingBuffer: true
       });
       
       STATE.miniMap.on('load', () => {
           console.log('[MAP] Mini map loaded with light style');
           
           // Create pulsing marker element
           const markerEl = document.createElement('div');
           markerEl.className = 'mini-marker-dot';
           markerEl.style.cssText = `
               width: 12px;
               height: 12px;
               border-radius: 50%;
               background: #00ff88;
               border: none;
               box-shadow: 0 0 16px rgba(0, 255, 136, 1), 
                           0 0 10px rgba(0, 255, 136, 0.9),
                           0 0 24px rgba(0, 255, 136, 0.6),
                           inset 0 0 6px rgba(255, 255, 255, 0.4);
               position: relative;
               z-index: 100;
           `;
           
           // Add pulse ring
           const pulseRing = document.createElement('div');
           pulseRing.style.cssText = `
               position: absolute;
               top: 50%;
               left: 50%;
               transform: translate(-50%, -50%);
               width: 100%;
               height: 100%;
               border-radius: 50%;
               border: 2px solid #00ff88;
               opacity: 0.8;
               animation: miniPulse 2s ease-out infinite;
               pointer-events: none;
           `;
           markerEl.appendChild(pulseRing);
           
           // Add pulse animation if not exists
           if (!document.getElementById('miniPulseAnimation')) {
               const style = document.createElement('style');
               style.id = 'miniPulseAnimation';
               style.textContent = `
                   @keyframes miniPulse {
                       0% {
                           transform: translate(-50%, -50%) scale(1);
                           opacity: 0.9;
                       }
                       100% {
                           transform: translate(-50%, -50%) scale(3);
                           opacity: 0;
                       }
                   }
               `;
               document.head.appendChild(style);
           }
           
           // Create marker and store reference
           STATE.miniMarker = new mapboxgl.Marker(markerEl)
               .setLngLat([0, 20])
               .addTo(STATE.miniMap);
           
           // Initial update
           updateMiniMapMarker(INITIAL_VIEW.center);
       });
   }
   
   /**
    * Initialize intro section map
    * Purpose: create-intro-background
    * NOTE: Removed - intro text now shows on main map during intro chapter
    */
   function initIntroMap() {
       // No longer needed - intro content moved to main map overlay
       console.log('[MAP] Intro map skipped - using main map with overlay');
   }
   
   // ============================================
   // SPLIT-SCREEN MAP (Chapter 7)
   // ============================================
   
   /**
    * Create split-screen container and maps
    */
   function createSplitScreenContainer() {
       // Check if container already exists
       if (document.getElementById('split-screen-container')) {
           return;
       }
       
       const container = document.createElement('div');
       container.id = 'split-screen-container';
       container.className = 'split-screen-container';
       container.innerHTML = `
           <div class="split-map-left">
               <div id="split-map-left" class="map"></div>
               <div class="split-map-label">AIS OFF · GRAIN LOADING</div>
               <div class="split-map-number">1</div>
           </div>
           <div class="split-screen-divider"></div>
           <div class="split-map-right">
               <div id="split-map-right" class="map"></div>
               <div class="split-map-label">AIS ON · BOSPHORUS → EL DEKHEILA</div>
               <div class="split-map-number">2</div>
           </div>
       `;
       
       // Insert before the map container
       const mapContainer = document.querySelector('.map-container');
       if (mapContainer) {
           mapContainer.parentNode.insertBefore(container, mapContainer);
       } else {
           document.body.appendChild(container);
       }
   }
   
   /**
    * Initialize split-screen maps for Chapter 7
    */
   function initSplitScreenMaps(leftCamera, rightCamera) {
       // Create container if needed
       createSplitScreenContainer();
       
       // Make container visible first so maps get correct dimensions
       const splitContainer = document.getElementById('split-screen-container');
       if (splitContainer) {
           splitContainer.classList.add('active');
       }
       
       // Small delay to ensure container is rendered with correct dimensions
       setTimeout(() => {
           // Initialize left map (Black Sea / Crimea)
           if (!STATE.splitMapLeft) {
               STATE.splitMapLeft = new mapboxgl.Map({
                   container: 'split-map-left',
                   style: MAP_STYLE,
                   center: leftCamera.center,
                   zoom: leftCamera.zoom,
                   pitch: leftCamera.pitch || 0,
                   bearing: leftCamera.bearing || 0,
                   interactive: false,
                   attributionControl: false,
                   logoPosition: 'bottom-left',
                   dragPan: false,
                   dragRotate: false,
                   scrollZoom: false,
                   touchZoomRotate: false,
                   doubleClickZoom: false,
                   keyboard: false
               });
               
               STATE.splitMapLeft.on('load', () => {
                   console.log('[SPLIT] Left map loaded (Crimea)');
                   // Resize after load to ensure correct dimensions
                   STATE.splitMapLeft.resize();
               });
           } else {
               // Map exists, just resize and fly to position
               STATE.splitMapLeft.resize();
               STATE.splitMapLeft.flyTo({
                   center: leftCamera.center,
                   zoom: leftCamera.zoom,
                   duration: leftCamera.duration || 1500
               });
           }
           
           // Initialize right map (Istanbul to Egypt)
           if (!STATE.splitMapRight) {
               STATE.splitMapRight = new mapboxgl.Map({
                   container: 'split-map-right',
                   style: MAP_STYLE,
                   center: rightCamera.center,
                   zoom: rightCamera.zoom,
                   pitch: rightCamera.pitch || 0,
                   bearing: rightCamera.bearing || 0,
                   interactive: false,
                   attributionControl: false,
                   logoPosition: 'bottom-left',
                   dragPan: false,
                   dragRotate: false,
                   scrollZoom: false,
                   touchZoomRotate: false,
                   doubleClickZoom: false,
                   keyboard: false
               });
               
               STATE.splitMapRight.on('load', () => {
                   console.log('[SPLIT] Right map loaded (Egypt route)');
                   // Resize after load to ensure correct dimensions
                   STATE.splitMapRight.resize();
               });
           } else {
               // Map exists, just resize and fly to position
               STATE.splitMapRight.resize();
               STATE.splitMapRight.flyTo({
                   center: rightCamera.center,
                   zoom: rightCamera.zoom,
                   duration: rightCamera.duration || 1500
               });
           }
       }, 50);
   }
   
   /**
    * Activate split-screen mode
    */
   function activateSplitScreen(chapter) {
       if (STATE.splitScreenActive) return;
       
       console.log('[SPLIT] Activating split-screen mode');
       
       document.body.classList.add('split-screen-active');
       STATE.splitScreenActive = true;
       
       // Initialize maps (this also makes container visible)
       initSplitScreenMaps(chapter.leftCamera, chapter.rightCamera);
   }
   
   /**
    * Deactivate split-screen mode
    */
   function deactivateSplitScreen() {
       if (!STATE.splitScreenActive) return;
       
       console.log('[SPLIT] Deactivating split-screen mode');
       
       const splitContainer = document.getElementById('split-screen-container');
       if (splitContainer) {
           splitContainer.classList.remove('active');
       }
       
       document.body.classList.remove('split-screen-active');
       STATE.splitScreenActive = false;
   }
   
   /**
    * Cleanup split-screen maps
    */
   function cleanupSplitScreenMaps() {
       // Remove any markers/popups on split maps
       document.querySelectorAll('#split-map-left .mapboxgl-marker, #split-map-right .mapboxgl-marker').forEach(el => el.remove());
       document.querySelectorAll('#split-map-left .mapboxgl-popup, #split-map-right .mapboxgl-popup').forEach(el => el.remove());
       
       // Clear layers from split maps
       if (STATE.splitMapLeft) {
           const style = STATE.splitMapLeft.getStyle();
           if (style && style.layers) {
               style.layers.forEach(layer => {
                   if (layer.id.startsWith('ch7-')) {
                       try { STATE.splitMapLeft.removeLayer(layer.id); } catch(e) {}
                   }
               });
           }
           const sources = STATE.splitMapLeft.getStyle()?.sources || {};
           Object.keys(sources).forEach(srcId => {
               if (srcId.startsWith('ch7-')) {
                   try { STATE.splitMapLeft.removeSource(srcId); } catch(e) {}
               }
           });
       }
       
       if (STATE.splitMapRight) {
           const style = STATE.splitMapRight.getStyle();
           if (style && style.layers) {
               style.layers.forEach(layer => {
                   if (layer.id.startsWith('ch7-')) {
                       try { STATE.splitMapRight.removeLayer(layer.id); } catch(e) {}
                   }
               });
           }
           const sources = STATE.splitMapRight.getStyle()?.sources || {};
           Object.keys(sources).forEach(srcId => {
               if (srcId.startsWith('ch7-')) {
                   try { STATE.splitMapRight.removeSource(srcId); } catch(e) {}
               }
           });
       }
   }
   
   /**
    * Called when main map is ready
    * Purpose: post-load-setup
    */
   function onMainMapReady() {
       console.log('[MAP] onMainMapReady called');
       console.log('[MAP] STATE.map is:', STATE.map ? 'set' : 'null');
       
       // Initialize scrollytelling
       initScrollama();
       
       // Setup event listeners
       setupEventListeners();
       
       // Preload first chapter data
       preloadChapterData('intro');
       preloadChapterData('january');
       
       console.log('[MAP] Post-load setup complete');
   }
   
   
   /* ============================================
      4. CLEANUP FUNCTIONS (CRITICAL!)
      Purpose: prevent-layer-residue
      ============================================ */
   
   /**
    * Clear markers and popups ONLY (preserve map layers like path lines)
    * Used for same-family transitions (parent <-> sub-chapters)
    */
   function clearMarkersAndPopupsOnly() {
       console.log('[CLEANUP] Clearing markers and popups only...');
       
       // Remove all markers - flat list
       STATE.activeMarkers.forEach(m => {
           try {
               if (m && typeof m.remove === 'function') {
                   m.remove();
               }
           } catch(e) {}
       });
       STATE.activeMarkers = [];

       // Clean nested markers structure
       Object.keys(STATE.markers).forEach(key => {
           STATE.markers[key].forEach(m => {
               try {
                   if (m && typeof m.remove === 'function') {
                       m.remove();
                   }
               } catch(e) {}
           });
           STATE.markers[key] = [];
       });

       // Remove all popups - flat list
       STATE.activePopups.forEach(p => {
           try {
               if (p && typeof p.remove === 'function') {
                   p.remove();
               }
           } catch(e) {}
       });
       STATE.activePopups = [];
       STATE.popups = [];

       // Remove any Mapbox popup DOM elements
       document.querySelectorAll('.mapboxgl-popup').forEach(el => {
           try { el.remove(); } catch(e) {}
       });
       
       // ===== COMPREHENSIVE CLEANUP FOR ALL CHAPTERS =====
       // Remove markers, popups, sat images for ALL chapters
       const allChapterSelectors = [
           // Chapter 1
           '.ch1-svg-marker', '.ch1-svg-marker-dark', '.ch1-sts-img-holder', 
           '.ch1-sts-img', '.ch1-gal', '.ch1-gal-img-holder', '.ch1-pop', '.ch1-vessel',
           
           // Chapter 2
           '.ch2-svg-marker', '.ch2-svg-marker-white', '.ch2-marker-ring', '.ch2-pop',
           '.ch2-main-gal', '.ch2-hgal', '.ch2-hgal-wide', '.ch2-hgal-row',
           
           // Chapter 3
           '.ch3-light-marker', '.ch3-dark-marker', '.ch3-spoof-marker', '.ch3-vessel',
           '.ch3-pop', '.ch3-kuwait-img-holder', '.ch3-kuwait-img', 
           '.ch3-iran-img-holder', '.ch3-iran-gal', '.ch3-vietnam-img-holder', '.ch3-vietnam-img',
           
          // Chapter 4
          '.ch4-light-marker', '.ch4-dark-marker', '.ch4-dark-marker-primary', '.ch4-spoof-marker', '.ch4-vessel',
          '.ch4-pop', '.ch4-dark-img-holder', '.ch4-dark-img-holder-primary', '.ch4-dark-img',
          '.ch4-spoof-img-holder', '.ch4-spoof-img', 
          '.ch4-mozambique-img-holder', '.ch4-mozambique-img',
          '.ch4-origin-marker', '.ch4-origin-glow', '.ch4-origin-label',
           
          // Chapter 5
          '.ch5-light-marker', '.ch5-dark-marker', '.ch5-unattr-marker', '.ch5-spoof-marker',
          '.ch5-vessel', '.ch5-pop', '.ch5-light-img-holder', '.ch5-light-img',
          '.ch5-dark-img-holder', '.ch5-dark-img',
          '.ch5-unattr-img-holder', '.ch5-unattr-img',
          '.ch5-light-final-img-holder', '.ch5-light-final-img',
           
          // Chapter 6
          '.ch6-light-marker', '.ch6-dark-marker', '.ch6-oil-spill-marker', '.ch6-vessel', '.ch6-pop',
          '.ch6-light-img-holder', '.ch6-light-img', '.ch6-dark-img-holder', '.ch6-dark-img',
          '.ch6-oil-spill-gallery', '.ch6-oil-spill-img-holder', '.ch6-oil-spill-img',
           
           // Chapter 7
           '.ch7-light-marker', '.ch7-dark-marker', '.ch7-humint-marker', '.ch7-vessel',
           '.ch7-pop', '.ch7-legend',
           
           // Chapter 8
           '.ch8-light-marker', '.ch8-number-marker', '.ch8-img-holder', 
           '.ch8-sat-img', '.ch8-pop', '.ch8-vessel',
           
           // Chapter 9
           '.ch9-bunkering-marker', '.ch9-light-marker', '.ch9-light-marker-primary',
           '.ch9-terminal-marker', '.ch9-beihai-terminal-marker', '.ch9-beihai-terminal-label',
           '.ch9-img-placeholder', '.ch9-sat-img', '.ch9-pop', '.ch9-legend', '.ch9-vessel',
           '.ch9-beihai-img-holder', '.ch9-regular-img-holder',
           
           // Chapter 10
           '.ch10-svg-marker', '.ch10-img-holder', '.ch10-pop', '.ch10-vessel',
           
           // Chapter 11
           '.ch11-svg-marker', '.ch11-number-marker', '.ch11-img-placeholder',
           '.ch11-sat-img', '.ch11-pop', '.ch11-vessel-panel', '.ch11-annotation-box',
           '.ch11-trans-popup', '.ch11-legend',
           
           // Chapter 12
           '.ch12-svg-marker', '.ch12-number-marker', '.ch12-img-placeholder',
           '.ch12-sat-img', '.ch12-pop', '.ch12-vessel-latest', '.ch12-legend'
       ];
       
      document.querySelectorAll(allChapterSelectors.join(', ')).forEach(el => {
          try {
              // If inside a mapboxgl-marker container, remove the whole container
              const markerWrapper = el.closest('.mapboxgl-marker');
              if (markerWrapper) {
                  markerWrapper.remove();
              } else {
                  el.remove();
              }
          } catch(e) {}
      });
      
      // Additional: remove any mapboxgl markers that have chapter-specific elements inside
      document.querySelectorAll('.mapboxgl-marker').forEach(marker => {
          if (marker.querySelector('[class*="ch"]')) {
              try { marker.remove(); } catch(e) {}
          }
      });
      
      console.log('[CLEANUP] Markers and popups cleared for all chapters');
  }

   /**
    * Master cleanup function - ALWAYS FULL CLEANUP
    * Purpose: clean-slate-for-every-scroll
    * ENHANCED: More thorough cleanup to prevent memory leaks
    */
   function masterCleanup() {
       if (STATE.cleanupInProgress) return;

       STATE.cleanupInProgress = true;
       console.log('[CLEANUP] Full cleanup starting...');

       const cleanupStats = {
           timeouts: 0,
           intervals: 0,
           animations: 0,
           markers: 0,
           popups: 0,
           layers: 0,
           sources: 0,
           domElements: 0
       };

       try {
           // Cancel any pending flyTo callback (but NOT debounce - that's handled separately)
           if (STATE.flyToCallbackId) {
               clearTimeout(STATE.flyToCallbackId);
               STATE.flyToCallbackId = null;
           }

           // Clear all timeouts
           STATE.activeTimeouts.forEach(id => {
               try {
                   clearTimeout(id);
                   cleanupStats.timeouts++;
               } catch(e) {}
           });
           STATE.activeTimeouts = [];

           // Clear all intervals
           STATE.activeIntervals.forEach(id => {
               try {
                   clearInterval(id);
                   cleanupStats.intervals++;
               } catch(e) {}
           });
           STATE.activeIntervals = [];

           // Stop all animation controllers - try multiple methods
           STATE.activeAnimations.forEach(anim => {
               if (anim) {
                   try {
                       // Try stop first
                       if (typeof anim.stop === 'function') {
                           anim.stop();
                       }
                       // Then cleanup
                       if (typeof anim.cleanup === 'function') {
                           anim.cleanup();
                       }
                       // Then destroy (for GSAP-like)
                       if (typeof anim.kill === 'function') {
                           anim.kill();
                       }
                       // Clear any internal references
                       if (typeof anim.clear === 'function') {
                           anim.clear();
                       }
                       cleanupStats.animations++;
                   } catch(e) {
                       console.warn('[CLEANUP] Animation cleanup error:', e.message);
                   }
               }
           });
           STATE.activeAnimations = [];

           // Kill all GSAP animations if present
           if (typeof gsap !== 'undefined') {
               try {
                   gsap.killTweensOf('*');
               } catch(e) {}
           }

           // Remove all markers - flat list first
           STATE.activeMarkers.forEach(m => {
               try {
                   if (m && typeof m.remove === 'function') {
                       // Get element before removal to clean up listeners
                       const el = m.getElement ? m.getElement() : null;
                       if (el) {
                           // Remove event listeners by cloning
                           const clone = el.cloneNode(true);
                           if (el.parentNode) {
                               el.parentNode.replaceChild(clone, el);
                           }
                       }
                       m.remove();
                       cleanupStats.markers++;
                   }
               } catch(e) {}
           });
           STATE.activeMarkers = [];

           // Clean nested markers structure
           Object.keys(STATE.markers).forEach(key => {
               STATE.markers[key].forEach(m => {
                   try {
                       if (m && typeof m.remove === 'function') {
                           m.remove();
                           cleanupStats.markers++;
                       }
                   } catch(e) {}
               });
               STATE.markers[key] = [];
           });

           // Remove all popups - flat list first
           STATE.activePopups.forEach(p => {
               try {
                   if (p && typeof p.remove === 'function') {
                       p.remove();
                       cleanupStats.popups++;
                   }
               } catch(e) {}
           });
           STATE.activePopups = [];

           // Clean old popups array
           STATE.popups.forEach(p => {
               try {
                   if (p && typeof p.remove === 'function') {
                       p.remove();
                       cleanupStats.popups++;
                   }
               } catch(e) {}
           });
           STATE.popups = [];

           // Remove any orphaned popup DOM elements
           document.querySelectorAll('.mapboxgl-popup').forEach(el => {
               try {
                   el.remove();
                   cleanupStats.domElements++;
               } catch(e) {}
           });

           // Remove orphaned marker DOM elements
           document.querySelectorAll('.mapboxgl-marker').forEach(el => {
               // Only remove markers that aren't the mini-map marker
               if (!el.closest('#mini-map')) {
                   try {
                       el.remove();
                       cleanupStats.domElements++;
                   } catch(e) {}
               }
           });

           // Remove chapter-specific CSS injected styles (except the ones we want to keep)
           for (let i = 1; i <= 12; i++) {
               const css = document.getElementById(`ch${i}-css`);
               if (css) {
                   css.remove();
                   cleanupStats.domElements++;
               }
           }

           // Remove chapter layers and sources from map
           if (STATE.map) {
               try {
                   const style = STATE.map.getStyle();
                   if (style && style.layers) {
                       // Create list first to avoid modifying while iterating
                       const layersToRemove = style.layers.filter(layer =>
                           layer.id.startsWith('ch1-') || layer.id.startsWith('ch2-') ||
                           layer.id.startsWith('ch3-') || layer.id.startsWith('ch4-') ||
                           layer.id.startsWith('ch5-') || layer.id.startsWith('ch6-') ||
                           layer.id.startsWith('ch7-') || layer.id.startsWith('ch8-') ||
                           layer.id.startsWith('ch9-') || layer.id.startsWith('ch10-') ||
                           layer.id.startsWith('ch11-') || layer.id.startsWith('ch12-') ||
                           layer.id.startsWith('chapter-') || layer.id.startsWith('intro-')
                       ).map(l => l.id);

                       layersToRemove.forEach(layerId => {
                           try {
                               if (STATE.map.getLayer(layerId)) {
                                   STATE.map.removeLayer(layerId);
                                   cleanupStats.layers++;
                               }
                           } catch(e) {}
                       });
                   }

                   if (style && style.sources) {
                       // Create list first to avoid modifying while iterating
                       const sourcesToRemove = Object.keys(style.sources).filter(src =>
                           src.startsWith('ch1-') || src.startsWith('ch2-') ||
                           src.startsWith('ch3-') || src.startsWith('ch4-') ||
                           src.startsWith('ch5-') || src.startsWith('ch6-') ||
                           src.startsWith('ch7-') || src.startsWith('ch8-') ||
                           src.startsWith('ch9-') || src.startsWith('ch10-') ||
                           src.startsWith('ch11-') || src.startsWith('ch12-') ||
                           src.startsWith('chapter-') || src.startsWith('intro-')
                       );

                       sourcesToRemove.forEach(sourceId => {
                           try {
                               if (STATE.map.getSource(sourceId)) {
                                   STATE.map.removeSource(sourceId);
                                   cleanupStats.sources++;
                               }
                           } catch(e) {}
                       });
                   }
               } catch (mapError) {
                   console.warn('[CLEANUP] Map style access error:', mapError.message);
               }
           }

           // Clear tracked layers/sources arrays
           STATE.activeLayers = [];
           STATE.activeSources = [];

           // Cleanup split-screen maps if active
           if (STATE.splitScreenActive) {
               cleanupSplitScreenMaps();
           }

           console.log(`[CLEANUP] Done: ${cleanupStats.timeouts} timeouts, ${cleanupStats.intervals} intervals, ${cleanupStats.animations} animations, ${cleanupStats.markers} markers, ${cleanupStats.popups} popups, ${cleanupStats.layers} layers, ${cleanupStats.sources} sources, ${cleanupStats.domElements} DOM elements`);

       } catch (error) {
           console.error('[CLEANUP] Error during cleanup:', error);
       } finally {
           STATE.cleanupInProgress = false;
       }
   }
   
   /**
    * Clear all tracked timeouts
    * Purpose: prevent-delayed-execution
    */
   function clearAllTimeouts() {
       STATE.activeTimeouts.forEach(id => {
           clearTimeout(id);
       });
       STATE.activeTimeouts = [];
       console.log('[CLEANUP] Cleared all timeouts');
   }
   
   /**
    * Clear all tracked intervals
    * Purpose: stop-repeating-operations
    */
   function clearAllIntervals() {
       STATE.activeIntervals.forEach(id => {
           clearInterval(id);
       });
       STATE.activeIntervals = [];
       console.log('[CLEANUP] Cleared all intervals');
   }
   
   /**
    * Cancel active animations
    * Purpose: stop-ongoing-animations
    */
   function cancelActiveAnimations() {
       STATE.activeAnimations.forEach(anim => {
           if (anim && typeof anim.stop === 'function') {
               anim.stop();
           }
           if (anim && typeof anim.cancel === 'function') {
               anim.cancel();
           }
           if (anim && typeof anim.kill === 'function') {
               anim.kill();
           }
       });
       STATE.activeAnimations = [];
       
       // Also kill GSAP animations if present
       if (typeof gsap !== 'undefined') {
           gsap.killTweensOf('*');
       }
       
       console.log('[CLEANUP] Cancelled all animations');
   }
   
   /**
    * Remove all markers from all maps
    * Purpose: clear-marker-elements
    */
   function removeAllMarkers() {
       // Main map markers
       STATE.markers.main.forEach(marker => {
           if (marker && typeof marker.remove === 'function') {
               marker.remove();
           }
       });
       STATE.markers.main = [];
       
       // Mini map markers
       STATE.markers.mini.forEach(marker => {
           if (marker && typeof marker.remove === 'function') {
               marker.remove();
           }
       });
       STATE.markers.mini = [];
       
       // Detection markers
       STATE.markers.detection.forEach(marker => {
           if (marker && typeof marker.remove === 'function') {
               marker.remove();
           }
       });
       STATE.markers.detection = [];
       
       // Vessel markers
       STATE.markers.vessel.forEach(marker => {
           if (marker && typeof marker.remove === 'function') {
               marker.remove();
           }
       });
       STATE.markers.vessel = [];
       
       console.log('[CLEANUP] Removed all markers');
   }
   
   /**
    * Remove all popups
    * Purpose: clear-popup-elements
    */
   function removeAllPopups() {
       STATE.popups.forEach(popup => {
           if (popup && typeof popup.remove === 'function') {
               popup.remove();
           }
       });
       STATE.popups = [];
       
       // Also remove any orphaned popup DOM elements
       document.querySelectorAll('.mapboxgl-popup').forEach(el => el.remove());
       
       console.log('[CLEANUP] Removed all popups');
   }
   
   /**
    * Remove custom DOM elements added by chapters
    * Purpose: clear-chapter-dom
    */
   function removeCustomDOMElements() {
       // Remove chapter-specific elements by common classes
       const selectors = [
           '.chapter-marker',
           '.detection-marker',
           '.vessel-marker',
           '.sts-zone',
           '.sat-image-popup',
           '.annotation-label',
           '.path-animation',
           '.custom-popup',
           '.chapter-overlay',
           '[class*="chapter-"]',
           '[data-chapter]'
       ];
       
       selectors.forEach(selector => {
           document.querySelectorAll(selector).forEach(el => {
               // Don't remove step elements or main UI
               if (!el.classList.contains('step') && 
                   !el.classList.contains('chapter-card') &&
                   !el.closest('.scrolly-steps')) {
                   el.remove();
               }
           });
       });
       
       console.log('[CLEANUP] Removed custom DOM elements');
   }
   
   /**
    * Remove all map layers
    * Purpose: clear-visual-layers
    */
   function removeAllLayers() {
       if (!STATE.map) return;
       
       // Get all layers to remove
       const layersToRemove = [...STATE.activeLayers];
       
       layersToRemove.forEach(layerId => {
           try {
               if (STATE.map.getLayer(layerId)) {
                   STATE.map.removeLayer(layerId);
               }
           } catch (e) {
               console.warn(`[CLEANUP] Could not remove layer ${layerId}:`, e.message);
           }
       });
       
       STATE.activeLayers = [];
       console.log('[CLEANUP] Removed all layers');
   }
   
   /**
    * Remove all map sources
    * Purpose: clear-data-sources
    */
   function removeAllSources() {
       if (!STATE.map) return;
       
       // Get all sources to remove
       const sourcesToRemove = [...STATE.activeSources];
       
       sourcesToRemove.forEach(sourceId => {
           try {
               if (STATE.map.getSource(sourceId)) {
                   STATE.map.removeSource(sourceId);
               }
           } catch (e) {
               console.warn(`[CLEANUP] Could not remove source ${sourceId}:`, e.message);
           }
       });
       
       STATE.activeSources = [];
       console.log('[CLEANUP] Removed all sources');
   }
   
   /**
    * Call previous chapter's cleanup function if it exists
    * Purpose: chapter-specific-cleanup
    */
   function cleanupPreviousChapter() {
       if (!STATE.previousChapter) return;
       
       // Map chapter IDs to cleanup function names
       const chapterNumberMap = {
           'intro': 'Intro',
           'january': '1',
           'february': '2',
           'march': '3',
           'april': '4',
           'may': '5',
           'june': '6',
           'july': '7',
           'august': '8',
           'september': '9',
           'october': '10',
           'november': '11',
           'december': '12'
       };
       
       const chapterSuffix = chapterNumberMap[STATE.previousChapter] || STATE.previousChapter.charAt(0).toUpperCase() + STATE.previousChapter.slice(1);
       const cleanupFunctionName = `clearChapter${chapterSuffix}`;
       
       if (typeof window[cleanupFunctionName] === 'function') {
           try {
               window[cleanupFunctionName](STATE.map);
               console.log(`[CLEANUP] Called ${cleanupFunctionName}`);
           } catch (e) {
               console.warn(`[CLEANUP] Error in ${cleanupFunctionName}:`, e);
           }
       }
   }
   
   /**
    * Clear legend container
    * Purpose: reset-legend-ui
    */
   function clearLegend() {
       const legendContainer = document.getElementById('legend-container');
       if (legendContainer) {
           legendContainer.innerHTML = '';
           legendContainer.classList.add('hidden');
       }
   }
   
   /**
    * Clear vessel panel
    * Purpose: reset-vessel-ui
    */
   function clearVesselPanel() {
       // Legacy function - vessel panel was removed
       // Keeping as no-op for backward compatibility
       return;
   }
   
   
   /* ============================================
      5. LAYER MANAGEMENT
      Purpose: add-remove-layers
      ============================================ */
   
   /**
    * Add a GeoJSON source to the map
    * Purpose: register-data-source
    * ENHANCED: Better error handling and validation
    */
   function addSource(sourceId, data) {
       if (!STATE.map) {
           console.warn(`[LAYER] Cannot add source ${sourceId}: Map not initialized`);
           return false;
       }

       if (!sourceId || typeof sourceId !== 'string') {
           console.error(`[LAYER] Invalid source ID: ${sourceId}`);
           return false;
       }

       try {
           // Check if source already exists
           if (STATE.map.getSource(sourceId)) {
               console.log(`[LAYER] Source already exists: ${sourceId}`);
               return true;
           }

           // Validate data
           if (!data) {
               console.warn(`[LAYER] No data provided for source: ${sourceId}`);
               data = { type: 'FeatureCollection', features: [] };
           }

           // Ensure valid GeoJSON structure
           if (!data.type) {
               console.warn(`[LAYER] Invalid GeoJSON for source ${sourceId}, creating empty FeatureCollection`);
               data = { type: 'FeatureCollection', features: [] };
           }

           STATE.map.addSource(sourceId, {
               type: 'geojson',
               data: data
           });

           STATE.activeSources.push(sourceId);
           console.log(`[LAYER] Added source: ${sourceId}`);
           return true;

       } catch (e) {
           console.error(`[LAYER] Error adding source ${sourceId}:`, e.message);
           return false;
       }
   }

   /**
    * Add a layer to the map
    * Purpose: register-visual-layer
    * ENHANCED: Better error handling and validation
    */
   function addLayer(layerConfig) {
       if (!STATE.map) {
           console.warn(`[LAYER] Cannot add layer: Map not initialized`);
           return false;
       }

       if (!layerConfig || !layerConfig.id) {
           console.error(`[LAYER] Invalid layer config: missing id`);
           return false;
       }

       try {
           // Check if layer already exists
           if (STATE.map.getLayer(layerConfig.id)) {
               console.log(`[LAYER] Layer already exists: ${layerConfig.id}`);
               return true;
           }

           // Check if source exists (if layer references one)
           if (layerConfig.source && typeof layerConfig.source === 'string') {
               if (!STATE.map.getSource(layerConfig.source)) {
                   console.warn(`[LAYER] Source ${layerConfig.source} not found for layer ${layerConfig.id}`);
                   return false;
               }
           }

           STATE.map.addLayer(layerConfig);
           STATE.activeLayers.push(layerConfig.id);
           console.log(`[LAYER] Added layer: ${layerConfig.id}`);
           return true;

       } catch (e) {
           console.error(`[LAYER] Error adding layer ${layerConfig.id}:`, e.message);
           return false;
       }
   }
   
   /**
    * Set layer visibility
    * Purpose: show-hide-layer
    */
   function setLayerVisibility(layerId, visible) {
       if (!STATE.map) return;
       
       try {
           if (STATE.map.getLayer(layerId)) {
               STATE.map.setLayoutProperty(
                   layerId,
                   'visibility',
                   visible ? 'visible' : 'none'
               );
           }
       } catch (e) {
           console.warn(`[LAYER] Could not set visibility for ${layerId}:`, e.message);
       }
   }
   
   /**
    * Remove specific layer
    * Purpose: delete-single-layer
    */
   function removeLayer(layerId) {
       if (!STATE.map) return;
       
       try {
           if (STATE.map.getLayer(layerId)) {
               STATE.map.removeLayer(layerId);
               STATE.activeLayers = STATE.activeLayers.filter(id => id !== layerId);
           }
       } catch (e) {
           console.warn(`[LAYER] Could not remove layer ${layerId}:`, e.message);
       }
   }
   
   /**
    * Remove specific source
    * Purpose: delete-single-source
    */
   function removeSource(sourceId) {
       if (!STATE.map) return;
       
       try {
           if (STATE.map.getSource(sourceId)) {
               STATE.map.removeSource(sourceId);
               STATE.activeSources = STATE.activeSources.filter(id => id !== sourceId);
           }
       } catch (e) {
           console.warn(`[LAYER] Could not remove source ${sourceId}:`, e.message);
       }
   }
   
   
   /* ============================================
      6. MARKER MANAGEMENT
      Purpose: create-manage-markers
      ENHANCED: Better tracking and memory management
      ============================================ */

   /**
    * Register a marker for cleanup tracking
    * Purpose: track-marker-for-cleanup
    */
   function registerMarker(marker, category = 'default') {
       if (!marker) return marker;

       // Add to flat list for easy cleanup
       STATE.activeMarkers.push(marker);

       // Add to categorized structure
       if (!STATE.markers[category]) {
           STATE.markers[category] = [];
       }
       STATE.markers[category].push(marker);

       return marker;
   }

   /**
    * Register a popup for cleanup tracking
    * Purpose: track-popup-for-cleanup
    */
   function registerPopup(popup, category = 'default') {
       if (!popup) return popup;

       // Add to flat list
       STATE.activePopups.push(popup);

       // Add to legacy array
       STATE.popups.push(popup);

       return popup;
   }

   /**
    * Safe marker removal
    * Purpose: safely-remove-single-marker
    */
   function safeRemoveMarker(marker) {
       if (!marker) return;

       try {
           // Remove from tracking arrays
           STATE.activeMarkers = STATE.activeMarkers.filter(m => m !== marker);
           Object.keys(STATE.markers).forEach(key => {
               STATE.markers[key] = STATE.markers[key].filter(m => m !== marker);
           });

           // Actually remove the marker
           if (typeof marker.remove === 'function') {
               marker.remove();
           }
       } catch (e) {
           console.warn('[MARKER] Error removing marker:', e.message);
       }
   }

   /**
    * Safe popup removal
    * Purpose: safely-remove-single-popup
    */
   function safeRemovePopup(popup) {
       if (!popup) return;

       try {
           // Remove from tracking arrays
           STATE.activePopups = STATE.activePopups.filter(p => p !== popup);
           STATE.popups = STATE.popups.filter(p => p !== popup);

           // Actually remove the popup
           if (typeof popup.remove === 'function') {
               popup.remove();
           }
       } catch (e) {
           console.warn('[POPUP] Error removing popup:', e.message);
       }
   }

   /**
    * Create a vessel marker
    * Purpose: add-vessel-indicator
    */
   function createVesselMarker(coordinates, options = {}) {
       const {
           color = '#00ff88',
           name = '',
           size = 12,
           pulse = true
       } = options;

       const el = document.createElement('div');
       el.className = 'vessel-marker';
       el.style.cssText = `
           width: ${size}px;
           height: ${size}px;
           background: ${color};
           border: 2px solid white;
           border-radius: 50%;
           cursor: pointer;
           box-shadow: 0 0 10px ${color};
           ${pulse ? 'animation: pulse 2s ease-in-out infinite;' : ''}
       `;
       
       if (name) {
           el.setAttribute('data-vessel', name);
           el.title = name;
       }
       
       const marker = new mapboxgl.Marker({ element: el })
           .setLngLat(coordinates)
           .addTo(STATE.map);
       
       STATE.markers.vessel.push(marker);
       return marker;
   }
   
   /**
    * Create a detection marker
    * Purpose: add-detection-indicator
    */
   function createDetectionMarker(coordinates, options = {}) {
       const {
           color = '#00b4ff',
           type = 'default',
           onClick = null
       } = options;
       
       const el = document.createElement('div');
       el.className = 'detection-marker';
       el.style.cssText = `
           width: 10px;
           height: 10px;
           background: ${color};
           border-radius: 50%;
           cursor: pointer;
           box-shadow: 0 0 8px ${color};
       `;
       
       if (onClick) {
           el.addEventListener('click', onClick);
       }
       
       const marker = new mapboxgl.Marker({ element: el })
           .setLngLat(coordinates)
           .addTo(STATE.map);
       
       STATE.markers.detection.push(marker);
       return marker;
   }
   
   /**
    * Update mini map marker position and sync view
    * Purpose: sync-minimap-view
    */
   function updateMiniMapMarker(coordinates) {
       if (!STATE.miniMap || !STATE.miniMarker) return;
       
       try {
           // Special handling for june: place marker in center of Red Sea
           if (STATE.currentChapter === 'june') {
               STATE.miniMarker.setLngLat([39.5, 16.5]);  // Center of Red Sea
               STATE.miniMap.jumpTo({
                   center: [39.5, 16.5],
                   zoom: 2.5
               });
               return;
           }
           
           // Special handling for april-h1: show full Iran-to-Mozambique corridor
           if (STATE.currentChapter === 'april-h1') {
               STATE.miniMarker.setLngLat([34.82, -19.87]);  // Marker at Beira, Mozambique
               STATE.miniMap.jumpTo({
                   center: [46, 5],       // Centered on Indian Ocean — shows Gulf of Oman + Mozambique
                   zoom: 0.5              // Zoomed out to show full corridor
               });
               return;
           }
           
           const [lng, lat] = coordinates;
           
           // Update marker position
           STATE.miniMarker.setLngLat(coordinates);
           
           // Calculate dynamic zoom based on region
           let targetZoom = 2.0;
           
           // Atlantic/Caribbean (zoom out for context)
           if (lng < -40 && lng > -90 && lat > 10 && lat < 35) {
               targetZoom = 1.5;
           }
           // Europe/Baltic region
           else if (lng > -10 && lng < 40 && lat > 40 && lat < 70) {
               targetZoom = 2.8;
           }
           // Asia Pacific
           else if (lng > 90 && lng < 180) {
               targetZoom = 1.8;
           }
           // Middle East / Suez
           else if (lng > 25 && lng < 60 && lat > 10 && lat < 40) {
               targetZoom = 2.5;
           }
           // Global view (intro)
           else if (lng === 0 && lat === 20) {
               targetZoom = 1.0;
           }
           
           // Pan mini map to follow marker
           STATE.miniMap.jumpTo({
               center: coordinates,
               zoom: targetZoom
           });
           
       } catch (error) {
           console.warn('[MAP] Mini map update error:', error);
       }
   }
   
   
   /* ============================================
      7. CHAPTER HANDLERS
      Purpose: manage-chapter-transitions
      ============================================ */
   
   /**
    * Handle chapter enter - DEBOUNCED for fast scrolling
    * When user scrolls fast, we only transition to the final destination
    */
   function handleChapterEnter(chapterId) {
       console.log(`[CHAPTER] Enter: ${chapterId}`);

       // Handle horizontal trigger immediately (no debounce for these)
       if (chapterId.includes('-detail')) {
           // Cancel any pending debounce
           if (STATE.debounceTimeout) {
               clearTimeout(STATE.debounceTimeout);
               STATE.debounceTimeout = null;
           }
           handleHorizontalChapterEnter(chapterId);
           return;
       }

       // Skip if already at this chapter
       if (chapterId === STATE.currentChapter && !STATE.isTransitioning) return;

       // Store as pending destination (overwrites any previous pending)
       STATE.pendingChapter = chapterId;

       // Clear existing debounce timer
       if (STATE.debounceTimeout) {
           clearTimeout(STATE.debounceTimeout);
       }

       // Debounce: wait 150ms for scrolling to settle before transitioning
       // This prevents triggering transitions for chapters we scroll past quickly
       STATE.debounceTimeout = setTimeout(() => {
           STATE.debounceTimeout = null;
           executeChapterTransition(STATE.pendingChapter);
       }, 150);
   }

   /**
    * Execute the actual chapter transition (called after debounce)
    */
   function executeChapterTransition(chapterId) {
       if (!chapterId) return;
       if (chapterId === STATE.currentChapter) return;

       console.log(`[CHAPTER] Executing transition to: ${chapterId}`);

       // Rapid scroll detection - if transitioning within 500ms, force comprehensive cleanup
       const now = Date.now();
       const timeSinceLastTransition = now - STATE.lastTransitionTime;
       if (timeSinceLastTransition < 500 && STATE.lastTransitionTime > 0) {
           console.log(`[CLEANUP] Rapid scroll detected (${timeSinceLastTransition}ms), forcing comprehensive cleanup`);
           clearMarkersAndPopupsOnly();  // Immediate cleanup of all visible markers
       }
       STATE.lastTransitionTime = now;

       // Cancel any pending rapid scroll cleanup
       if (STATE.rapidScrollCleanupId) {
           clearTimeout(STATE.rapidScrollCleanupId);
           STATE.rapidScrollCleanupId = null;
       }

       // Cancel any in-flight flyTo callback
       if (STATE.flyToCallbackId) {
           clearTimeout(STATE.flyToCallbackId);
           STATE.flyToCallbackId = null;
       }

       const previousChapterId = STATE.currentChapter;
       STATE.isTransitioning = true;
       STATE.previousChapter = previousChapterId;
       STATE.currentChapter = chapterId;
       STATE.pendingChapter = null;

       const chapter = CHAPTERS[chapterId];
       const prevChapter = CHAPTERS[previousChapterId];

       // Check if we're transitioning between sub-chapters of the same parent
       // or between parent and its sub-chapters - skip cleanup to preserve data layers
       const isSameFamily = (
           // Both are sub-chapters of the same parent
           (chapter?.isSubChapter && prevChapter?.isSubChapter &&
            chapter.parentChapter === prevChapter.parentChapter) ||
           // Current is sub-chapter of previous (parent -> child)
           (chapter?.isSubChapter && chapter.parentChapter === previousChapterId) ||
           // Previous was sub-chapter of current (child -> parent)
           (prevChapter?.isSubChapter && prevChapter.parentChapter === chapterId)
       );

       if (isSameFamily) {
           console.log(`[CHAPTER] Same family transition (${previousChapterId} -> ${chapterId}), cleaning markers only`);
           // Clear markers/popups immediately, but preserve map layers (path lines etc)
           clearMarkersAndPopupsOnly();
       } else {
           // Full cleanup for transitions between different chapter families
           masterCleanup();
       }
       if (!chapter) {
           STATE.isTransitioning = false;
           return;
       }

       // Handle split-screen for Chapter 7
       if (chapter.splitScreen) {
           activateSplitScreen(chapter);
       } else if (STATE.splitScreenActive) {
           cleanupSplitScreenMaps();
           deactivateSplitScreen();
       }

       // Handle intro overlay
       const introOverlay = document.getElementById('intro-overlay');
       if (introOverlay) {
           introOverlay.classList.toggle('hidden', chapterId !== 'intro');
       }

       // Handle mini map
       const miniMapContainer = document.getElementById('mini-map-container');
       if (miniMapContainer) {
           miniMapContainer.classList.toggle('hidden', chapterId === 'intro');
           if (chapterId !== 'intro' && STATE.miniMap) {
               setTimeout(() => STATE.miniMap.resize(), 100);
           }
       }

       // Handle vessel info panel
       const vesselInfoPanel = document.getElementById('vessel-info-panel');
       if (vesselInfoPanel) {
           vesselInfoPanel.classList.toggle('hidden', chapterId === 'intro');
           if (chapterId !== 'intro') {
               updateVesselInfoPanel(chapterId, chapter);
           }
       }

       // Update UI
       if (typeof updateTimeline === 'function') {
           updateTimeline(chapterId, chapter.dateRange);
       }
       updateLegend(chapter.legend);
       updateVesselPanel(chapter.vessels);
       updateChapterInfo(chapter);

       if (chapterId !== 'intro' && chapter.camera) {
           updateMiniMapMarker(chapter.camera.center);
       }

       // Fly and activate - pass isSameFamily to reuse animation controller when appropriate
       flyToChapter(chapter.camera, () => {
           // Only activate if this is still the current chapter
           // (user might have scrolled again during flyTo)
           if (STATE.currentChapter === chapterId) {
               // For same-family transitions, reuse existing controller to preserve data layers
               activateChapterAnimation(chapterId, 'showMain', isSameFamily);
           }
           STATE.isTransitioning = false;
           
           // Schedule a safety cleanup 800ms after transition to catch any lingering elements
           // from previous chapters that might have appeared during the transition
           STATE.rapidScrollCleanupId = setTimeout(() => {
               if (STATE.currentChapter === chapterId) {
                   safetyCleanupForChapter(chapterId);
               }
           }, 800);
       });
   }
   
   /**
    * Safety cleanup - removes elements from OTHER chapters that might be lingering
    * Only removes elements NOT belonging to current chapter
    */
   function safetyCleanupForChapter(currentChapterId) {
       // Map chapter IDs to their CSS prefixes
       const chapterPrefixes = {
           'january': 'ch1', 'january-h1': 'ch1', 'january-h2': 'ch1',
           'february': 'ch2', 'february-h1': 'ch2',
           'march': 'ch3', 'march-h1': 'ch3',
           'april': 'ch4', 'april-h1': 'ch4',
           'may': 'ch5',
           'june': 'ch6',
           'july': 'ch7',
           'august': 'ch8',
           'september': 'ch9', 'september-h1': 'ch9',
           'october': 'ch10',
           'november': 'ch11', 'november-h1': 'ch11', 'november-h2': 'ch11',
           'december': 'ch12'
       };
       
       const currentPrefix = chapterPrefixes[currentChapterId];
       if (!currentPrefix) return;
       
       // Find and remove markers/popups from OTHER chapters
       document.querySelectorAll('.mapboxgl-marker, .mapboxgl-popup').forEach(el => {
           // Check if this element belongs to a different chapter
           const classList = el.className || '';
           const innerHTML = el.innerHTML || '';
           
           // Check for any chapter class that's NOT the current chapter
           for (const [chapId, prefix] of Object.entries(chapterPrefixes)) {
               if (prefix !== currentPrefix) {
                   // Check if element contains classes from another chapter
                   if (classList.includes(prefix + '-') || innerHTML.includes(prefix + '-')) {
                       try { 
                           el.remove(); 
                           console.log(`[SAFETY CLEANUP] Removed lingering element from ${prefix}`);
                       } catch(e) {}
                       break;
                   }
               }
           }
       });
   }
   
   
   /**
    * Handle horizontal chapter enter - SIMPLE: cleanup + show this slide's content
    * Detects scroll direction to start at correct slide (first or last)
    */
   function handleHorizontalChapterEnter(chapterId) {
       console.log(`[H-CHAPTER] Enter: ${chapterId}`);
       
       const chapter = CHAPTERS[chapterId];
       if (!chapter) return;
       
       const parentChapterId = chapter.parentChapter;
       const previousChapter = STATE.currentChapter;
       
       // Detect scroll direction by comparing chapter order
       const chapterOrder = ['intro', 'january', 'january-h1', 'january-h2', 'february', 'february-h1', 'march', 'march-h1', 'april', 'april-h1', 'may', 'may-detail', 'june', 'june-detail', 'july', 'july-detail', 'august', 'august-detail', 'september', 'september-h1', 'october', 'october-detail', 'november', 'november-h1', 'november-h2', 'december', 'december-detail'];
       
       const prevIndex = chapterOrder.indexOf(previousChapter);
       const currIndex = chapterOrder.indexOf(chapterId);
       const scrollingBackward = prevIndex > currIndex;
       
       console.log(`[H-CHAPTER] Direction: ${scrollingBackward ? 'BACKWARD' : 'FORWARD'} (from ${previousChapter})`);
       
       // Update state
       STATE.previousChapter = STATE.currentChapter;
       STATE.currentChapter = chapterId;
       
       // Always full cleanup
       masterCleanup();
       
       // Create fresh animation controller for parent chapter
       // Pass null to prevent auto-trigger of showMain - we'll call the slide action explicitly
       activateChapterAnimation(parentChapterId, null);
       
       // Initialize horizontal scroll
       if (typeof HorizontalScroll !== 'undefined') {
           const initialized = HorizontalScroll.init(parentChapterId);
           
           if (initialized) {
               // Update UI
               if (typeof updateTimeline === 'function') {
                   updateTimeline(parentChapterId, chapter.dateRange);
               }
               updateLegend(chapter.legend);
               
               // Determine which slide to show
               const totalSlides = chapter.horizontalConfig?.totalSlides || 1;
               const startSlideIndex = scrollingBackward ? (totalSlides - 1) : 0;
               const slideData = chapter.horizontalConfig?.slideData?.[startSlideIndex];
               const camera = slideData?.camera || chapter.camera;
               
               console.log(`[H-CHAPTER] Starting at slide ${startSlideIndex + 1} of ${totalSlides}`);
               
               if (camera) {
                   flyToChapter(camera, () => {
                       HorizontalScroll.activate(startSlideIndex);
                       STATE.isHorizontalMode = true;
                       STATE.currentHorizontalChapter = parentChapterId;
                       
                       // Trigger slide action
                       setTimeout(() => {
                           if (slideData?.action && STATE.activeAnimations.length > 0) {
                               const anim = STATE.activeAnimations[STATE.activeAnimations.length - 1];
                               if (typeof anim[slideData.action] === 'function') {
                                   anim[slideData.action]();
                               }
                           }
                       }, 100);
                   });
               } else {
                   HorizontalScroll.activate(startSlideIndex);
                   STATE.isHorizontalMode = true;
                   STATE.currentHorizontalChapter = parentChapterId;
               }
           }
       }
   }
   
   
   /**
    * Handle horizontal slide changes - just call the action
    */
   function handleHorizontalSlideChange(event) {
       const { chapterId, slideIndex, direction } = event.detail;
       console.log(`[H-SLIDE] Slide ${slideIndex}, chapter: ${chapterId}`);
       
       const detailChapterId = `${chapterId}-detail`;
       const chapter = CHAPTERS[detailChapterId];
       
       if (!chapter?.horizontalConfig?.slideData?.[slideIndex]) return;
       
       const slideData = chapter.horizontalConfig.slideData[slideIndex];
       
       // Fly to slide camera
       if (slideData.camera && STATE.map) {
           STATE.map.flyTo({
               center: slideData.camera.center,
               zoom: slideData.camera.zoom || 8,
               pitch: slideData.camera.pitch || 45,
               bearing: slideData.camera.bearing || 0,
               duration: 400,
               essential: true
           });
           updateMiniMapMarker(slideData.camera.center);
       }
       
       // Call slide action
       if (slideData.action && STATE.activeAnimations.length > 0) {
           const anim = STATE.activeAnimations[STATE.activeAnimations.length - 1];
           if (typeof anim[slideData.action] === 'function') {
               anim[slideData.action]();
           }
       }
       
       // Update counter
       const counter = document.querySelector('.h-slide-counter .current');
       if (counter) counter.textContent = slideIndex + 1;
   }
   
   
   /**
    * Handle exit from horizontal scroll - cleanup and restore main chapter view
    */
   function handleHorizontalExit(event) {
       const { chapterId, direction } = event.detail;
       console.log(`[H-EXIT] ${chapterId}, dir: ${direction}`);
       
       STATE.isHorizontalMode = false;
       STATE.currentHorizontalChapter = null;
       
       if (typeof HorizontalScroll !== 'undefined') {
           HorizontalScroll.destroy();
       }
       
       if (direction === 'up') {
           // Going back to main chapter - full cleanup and re-init
           STATE.currentChapter = chapterId;
           
           // Full cleanup
           masterCleanup();
           
           // Re-activate chapter animation
           activateChapterAnimation(chapterId);
           
           const parentChapter = CHAPTERS[chapterId];
           
           // Fly back to main chapter camera
           if (parentChapter?.camera && STATE.map) {
               STATE.map.flyTo({
                   center: parentChapter.camera.center,
                   zoom: parentChapter.camera.zoom || 9,
                   pitch: parentChapter.camera.pitch || 45,
                   bearing: parentChapter.camera.bearing || 0,
                   duration: 500,
                   essential: true
               });
               updateMiniMapMarker(parentChapter.camera.center);
           }
           
           updateLegend(parentChapter?.legend);
           
           // Scroll DOM
           setTimeout(() => {
               const parentStep = document.querySelector(`[data-chapter="${chapterId}"]`);
               if (parentStep) {
                   parentStep.scrollIntoView({ behavior: 'smooth' });
               }
           }, 100);
       }
   }
   
   /**
    * Handle chapter exit
    * Purpose: deactivate-chapter-content
    */
   function handleChapterExit(chapterId) {
       console.log(`[CHAPTER] Exiting: ${chapterId}`);
       // Most cleanup happens on enter, but can add exit-specific logic here
   }
   
   /**
    * Fly to chapter camera position
    * Purpose: animate-camera-movement
    * UPDATED: Faster transitions, cancellable callbacks for fast scrolling
    */
   function flyToChapter(camera, callback) {
       // Skip flyTo for split-screen mode (maps are already positioned)
       if (STATE.splitScreenActive) {
           console.log('[FLY] Split-screen active, skipping main map flyTo');
           if (callback) setTimeout(callback, 100);
           return;
       }
       
       // Skip flyTo for chapters with custom cinematic camera animations
       const chaptersWithCustomCamera = ['september-h1'];
       if (chaptersWithCustomCamera.includes(STATE.currentChapter)) {
           console.log('[FLY] Custom camera chapter, skipping default flyTo');
           if (callback) setTimeout(callback, 100);
           return;
       }
       
       if (!STATE.map) {
           console.error('[FLY] No map instance!');
           if (callback) callback();
           return;
       }

       if (!camera) {
           console.error('[FLY] No camera config!');
           if (callback) callback();
           return;
       }

       // Cancel any previous flyTo callback
       if (STATE.flyToCallbackId) {
           clearTimeout(STATE.flyToCallbackId);
           STATE.flyToCallbackId = null;
       }

       // Use faster duration for responsive feel (max 1000ms)
       const duration = Math.min(camera.duration || 1000, 1000);

       console.log(`[FLY] Flying to: [${camera.center}], zoom: ${camera.zoom}, duration: ${duration}ms`);

       STATE.map.flyTo({
           center: camera.center,
           zoom: camera.zoom,
           pitch: camera.pitch || 0,
           bearing: camera.bearing || 0,
           duration: duration,
           essential: true,
           easing: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2 // ease-in-out
       });

       // Track the callback so it can be cancelled if user scrolls again
       STATE.flyToCallbackId = setTimeout(() => {
           STATE.flyToCallbackId = null;
           console.log(`[FLY] Flight animation complete`);
           if (callback) callback();
       }, duration);
   }
   
   /**
    * Activate chapter animation
    * Purpose: run-chapter-visuals
    * @param {string} chapterId - Chapter to activate
    * @param {string|null} initialAction - Action to call after init ('showMain', 'showH1', null for none)
    * @param {boolean} reuseExisting - If true, reuse existing animation controller (for same-family transitions)
    */
   function activateChapterAnimation(chapterId, initialAction = 'showMain', reuseExisting = false) {
       const chapter = CHAPTERS[chapterId];
       if (!chapter) return;

       // Map chapter IDs to animation function names
       // Files are named animatechapter1.js, animatechapter2.js, etc.
       const chapterNumberMap = {
           'intro': 'Intro',
           'january': '1',
           'february': '2',
           'march': '3',
           'april': '4',
           'may': '5',
           'june': '6',
           'july': '7',
           'august': '8',
           'september': '9',
           'october': '10',
           'november': '11',
           'december': '12'
       };

       // Handle sub-chapters: use parent chapter's animation with subChapterAction
       let lookupChapterId = chapterId;
       let actionToCall = initialAction;

       if (chapter.isSubChapter && chapter.parentChapter) {
           lookupChapterId = chapter.parentChapter;
           // If chapter has a specific subChapterAction, use that instead
           if (chapter.subChapterAction) {
               actionToCall = chapter.subChapterAction;
           }
           console.log(`[CHAPTER] Sub-chapter detected: ${chapterId} -> parent: ${lookupChapterId}, action: ${actionToCall}`);
       }

       // If reusing existing controller, just call the action on it
       if (reuseExisting && STATE.activeAnimations.length > 0) {
           const existingController = STATE.activeAnimations[STATE.activeAnimations.length - 1];
           if (existingController && actionToCall && typeof existingController[actionToCall] === 'function') {
               console.log(`[CHAPTER] Reusing existing controller, calling action: ${actionToCall}`);
               existingController[actionToCall]();
               return;
           }
       }

       const chapterSuffix = chapterNumberMap[lookupChapterId] || lookupChapterId.charAt(0).toUpperCase() + lookupChapterId.slice(1);
       const functionName = `animateChapter${chapterSuffix}`;

       console.log(`[CHAPTER] Looking for animation function: ${functionName}`);

       if (typeof window[functionName] === 'function') {
           try {
               console.log(`[CHAPTER] Calling animation: ${functionName}`);
               
               // For split-screen chapters, pass both maps
               let animController;
               if (chapter.splitScreen && STATE.splitScreenActive) {
                   console.log(`[CHAPTER] Split-screen mode - passing dual maps`);
                   animController = window[functionName](
                       { left: STATE.splitMapLeft, right: STATE.splitMapRight },
                       chapter
                   );
               } else {
                   animController = window[functionName](STATE.map, chapter);
               }

               // Store animation controller for later access (horizontal slides, cleanup)
               if (animController) {
                   STATE.activeAnimations.push(animController);
                   console.log(`[CHAPTER] Animation controller stored, total: ${STATE.activeAnimations.length}`);

                   // Call the determined action
                   if (actionToCall && typeof animController[actionToCall] === 'function') {
                       console.log(`[CHAPTER] Calling action: ${actionToCall}`);
                       animController[actionToCall]();
                   }
               }
           } catch (e) {
               console.error(`[CHAPTER] Error in ${functionName}:`, e);
           }
       } else {
           console.warn(`[CHAPTER] No animation function found: ${functionName}`);
           console.log(`[CHAPTER] Available window functions:`, Object.keys(window).filter(k => k.startsWith('animate')));
       }
   }
   
   /**
    * Cancel any pending transitions (debounce + flyTo + safety cleanup)
    * Purpose: abort-in-flight-transitions
    */
   function cancelPendingTransitions() {
       if (STATE.debounceTimeout) {
           clearTimeout(STATE.debounceTimeout);
           STATE.debounceTimeout = null;
       }
       if (STATE.flyToCallbackId) {
           clearTimeout(STATE.flyToCallbackId);
           STATE.flyToCallbackId = null;
       }
       if (STATE.rapidScrollCleanupId) {
           clearTimeout(STATE.rapidScrollCleanupId);
           STATE.rapidScrollCleanupId = null;
       }
       STATE.pendingChapter = null;
   }
   
   
   /* ============================================
      8. SCROLL CONTROLLERS
      Purpose: scrollama-integration
      ============================================ */
   
   /**
    * Initialize Scrollama
    * Purpose: setup-scroll-triggers
    */
   function initScrollama() {
       console.log('[SCROLL] Setting up Scrollama...');
       
       // Check if steps exist
       const steps = document.querySelectorAll('.step');
       console.log(`[SCROLL] Found ${steps.length} step elements`);
       
       if (steps.length === 0) {
           console.error('[SCROLL] No .step elements found!');
           return;
       }
       
       try {
           const scroller = scrollama();
           
           scroller
               .setup({
                   step: '.step',
                   offset: 0.5,
                   progress: false,
                   debug: false
               })
               .onStepEnter(response => {
                   const chapterId = response.element.dataset.chapter;
                   const scrollType = response.element.dataset.scrollType;
                   
                   console.log(`[SCROLL] Step Enter: ${chapterId}, direction: ${response.direction}`);
                   
                   // Update scroll type
                   STATE.scrollType = scrollType || 'vertical';
                   
                   // Handle chapter enter
                   handleChapterEnter(chapterId);
                   
                   // Add active class
                   response.element.classList.add('is-active');
               })
               .onStepExit(response => {
                   const chapterId = response.element.dataset.chapter;
                   console.log(`[SCROLL] Step Exit: ${chapterId}, direction: ${response.direction}`);
                   
                   // Handle chapter exit
                   handleChapterExit(chapterId);
                   
                   // Remove active class
                   response.element.classList.remove('is-active');
               });
           
           // Handle resize
           window.addEventListener('resize', scroller.resize);
           
           console.log('[SCROLL] Scrollama initialized successfully');
       } catch (e) {
           console.error('[SCROLL] Scrollama initialization error:', e);
       }
   }
   
   /**
    * Handle horizontal scroll progress
    * Purpose: manage-horizontal-slides
    */
   function handleHorizontalProgress(progress, element) {
       STATE.horizontalProgress = progress;
       
       const slidesContainer = element.querySelector('.horizontal-slides');
       if (!slidesContainer) return;
       
       const slides = slidesContainer.children;
       const totalSlides = slides.length;
       
       if (totalSlides <= 1) return;
       
       // Calculate which slide to show
       const slideIndex = Math.min(
           Math.floor(progress * totalSlides),
           totalSlides - 1
       );
       
       // Translate slides
       const translateX = -slideIndex * 100;
       slidesContainer.style.transform = `translateX(${translateX}vw)`;
   }
   
   
   /* ============================================
      9. UI UPDATE FUNCTIONS
      Purpose: sync-interface-state
      ============================================ */
   
   /**
    * Update vessel info panel with chapter data
    * Purpose: show-chapter-context-info
    */
   function updateVesselInfoPanel(chapterId, chapter) {
       const panel = document.getElementById('vessel-info-panel');
       const vesselBlock1 = document.getElementById('vessel-block-1');
       const vesselBlock2 = document.getElementById('vessel-block-2');
       
       if (!panel) return;
       
       // Check for explicit vesselInfo first, then fall back to vessels array
       let vesselData = chapter?.vesselInfo || null;
       
       // Convert from old vessels array format if needed
       if (!vesselData && chapter?.vessels && chapter.vessels.length > 0) {
           vesselData = {
               vessel1: {
                   name: chapter.vessels[0]?.name || '—',
                   imo: chapter.vessels[0]?.imo || 'IMO N/A',
                   cargo: chapter.vessels[0]?.cargo || chapter.vessels[0]?.status || '—',
                   operation: chapter.vessels[0]?.operation || 'TRACKING'
               }
           };
           
           // Add second vessel if exists
           if (chapter.vessels.length > 1) {
               vesselData.vessel2 = {
                   name: chapter.vessels[1]?.name || '—',
                   imo: chapter.vessels[1]?.imo || 'IMO N/A',
                   cargo: chapter.vessels[1]?.cargo || chapter.vessels[1]?.status || '—',
                   operation: chapter.vessels[1]?.operation || 'TRACKING'
               };
           }
       }
       
       // If still no vessel data, show default state
       if (!vesselData || !vesselData.vessel1) {
           const defaultVesselData = getDefaultVesselData(chapterId, chapter);
           populateVesselBlock(1, defaultVesselData.vessel1);
           
           // Hide second vessel block
           if (vesselBlock2) {
               vesselBlock2.classList.add('hidden');
           }
           panel.classList.remove('two-vessels');
           return;
       }
       
       // Populate primary vessel
       populateVesselBlock(1, vesselData.vessel1);
       
       // Handle secondary vessel
       if (vesselData.vessel2 && vesselBlock2) {
           vesselBlock2.classList.remove('hidden');
           populateVesselBlock(2, vesselData.vessel2);
           panel.classList.add('two-vessels');
       } else if (vesselBlock2) {
           vesselBlock2.classList.add('hidden');
           panel.classList.remove('two-vessels');
       }
       
       console.log(`[UI] Vessel info panel updated for: ${chapterId}`);
   }
   
   /**
    * Populate a vessel block with data
    */
   function populateVesselBlock(blockNum, data) {
       const vesselEl = document.getElementById(`info-vessel-${blockNum}`);
       const imoEl = document.getElementById(`info-imo-${blockNum}`);
       const cargoEl = document.getElementById(`info-cargo-${blockNum}`);
       const operationEl = document.getElementById(`info-operation-${blockNum}`);
       
       if (vesselEl) vesselEl.textContent = data?.name || '—';
       if (imoEl) imoEl.textContent = data?.imo || '—';
       if (cargoEl) cargoEl.textContent = data?.cargo || '—';
       if (operationEl) operationEl.textContent = data?.operation || '—';
   }
   
   /**
    * Get default vessel data for chapters without explicit vessel info
    */
   function getDefaultVesselData(chapterId, chapter) {
       // Default data based on chapter month or region
       const defaults = {
           'intro': {
               vessel1: { name: '—', imo: '—', cargo: '—', operation: '—' }
           },
           'january': {
               vessel1: { name: 'THEIA COVERAGE', imo: 'GLOBAL', cargo: 'MARITIME DATA', operation: 'MONITORING' }
           },
           'february': {
               vessel1: { name: 'THEIA COVERAGE', imo: 'GLOBAL', cargo: 'MARITIME DATA', operation: 'TRACKING' }
           },
           'march': {
               vessel1: { name: 'THEIA COVERAGE', imo: 'GLOBAL', cargo: 'MARITIME DATA', operation: 'ANALYSIS' }
           },
           'april': {
               vessel1: { name: 'THEIA COVERAGE', imo: 'GLOBAL', cargo: 'MARITIME DATA', operation: 'DETECTION' }
           },
           'may': {
               vessel1: { name: 'THEIA COVERAGE', imo: 'GLOBAL', cargo: 'MARITIME DATA', operation: 'SURVEILLANCE' }
           },
           'june': {
               vessel1: { name: 'THEIA COVERAGE', imo: 'GLOBAL', cargo: 'MARITIME DATA', operation: 'INTEL' }
           },
           'july': {
               vessel1: { name: 'THEIA COVERAGE', imo: 'GLOBAL', cargo: 'MARITIME DATA', operation: 'TRACKING' }
           },
           'august': {
               vessel1: { name: 'THEIA COVERAGE', imo: 'GLOBAL', cargo: 'MARITIME DATA', operation: 'MONITORING' }
           },
           'september': {
               vessel1: { name: 'THEIA COVERAGE', imo: 'GLOBAL', cargo: 'MARITIME DATA', operation: 'ANALYSIS' }
           },
           'october': {
               vessel1: { name: 'THEIA COVERAGE', imo: 'GLOBAL', cargo: 'MARITIME DATA', operation: 'DETECTION' }
           },
           'november': {
               vessel1: { name: 'THEIA COVERAGE', imo: 'GLOBAL', cargo: 'MARITIME DATA', operation: 'TRACKING' }
           },
           'december': {
               vessel1: { name: 'THEIA COVERAGE', imo: 'GLOBAL', cargo: 'MARITIME DATA', operation: 'REVIEW' }
           }
       };
       
       return defaults[chapterId] || defaults['january'];
   }
   
   /**
    * Update legend display
    * Purpose: show-chapter-legend
    */
   function updateLegend(legendItems) {
       const container = document.getElementById('legend-container');
       if (!container) return;
       
       container.innerHTML = '';
       
       if (!legendItems || legendItems.length === 0) {
           container.classList.add('hidden');
           return;
       }
       
       // Add title
       const title = document.createElement('div');
       title.className = 'legend-title';
       title.textContent = 'LEGEND';
       container.appendChild(title);
       
       // Add items
       legendItems.forEach(item => {
           const itemEl = document.createElement('div');
           itemEl.className = 'legend-item';

           const iconEl = document.createElement('div');
           iconEl.className = 'legend-icon';

           if (item.type === 'line') {
               const line = document.createElement('div');
               line.className = 'legend-line';
               line.style.background = item.color;
               iconEl.appendChild(line);
           } else if (item.type === 'dot') {
               const dot = document.createElement('div');
               dot.className = 'legend-dot';
               dot.style.background = item.color;
               iconEl.appendChild(dot);
           } else if (item.type === 'area') {
               const area = document.createElement('div');
               area.className = 'legend-dot';
               area.style.background = item.color;
               area.style.borderRadius = '2px';
               iconEl.appendChild(area);
           } else if (item.type === 'svg') {
               // SVG marker icon - use actual SVG file
               const img = document.createElement('img');
               img.src = item.icon;
               img.alt = item.label;
               img.style.width = '22px';
               img.style.height = 'auto';
               img.style.display = 'block';
               iconEl.appendChild(img);
           }

           const labelEl = document.createElement('span');
           labelEl.className = 'legend-label';
           labelEl.textContent = item.label;

           itemEl.appendChild(iconEl);
           itemEl.appendChild(labelEl);
           container.appendChild(itemEl);
       });
       
       container.classList.remove('hidden');
   }
   
   /**
    * Update vessel panel
    * Purpose: show-tracked-vessels
    */
   function updateVesselPanel(vessels) {
       // Legacy function - vessel panel was replaced by vessel-info-panel
       // Keeping as no-op for backward compatibility
       return;
   }
   
   /**
    * Update chapter info box
    * Purpose: show-chapter-context
    */
   function updateChapterInfo(chapter) {
       const infoBox = document.getElementById('chapter-info');
       const monthEl = document.getElementById('chapter-month');
       const titleEl = document.getElementById('chapter-title');
       const challengeEl = document.getElementById('chapter-challenge');

       if (!infoBox) return;

       // Hide for intro or if chapter has hideChapterInfo: true
       if (!chapter || chapter.id === 'intro' || chapter.hideChapterInfo) {
           infoBox.classList.add('hidden');
           return;
       }

       if (monthEl) monthEl.textContent = chapter.region || '';
       if (titleEl) titleEl.textContent = chapter.title || '';
       if (challengeEl) challengeEl.textContent = chapter.subtitle || '';

       infoBox.classList.remove('hidden');
   }
   
   /**
    * Update detection counter
    * Purpose: animate-detection-count
    */
   function updateDetectionCounter(count, animate = true) {
       const counter = document.getElementById('detection-counter');
       const valueEl = document.getElementById('counter-value');
       
       if (!counter || !valueEl) return;
       
       if (count <= 0) {
           counter.classList.add('hidden');
           return;
       }
       
       counter.classList.remove('hidden');
       
       if (animate && typeof gsap !== 'undefined') {
           gsap.to({ val: 0 }, {
               val: count,
               duration: 1.5,
               ease: 'power2.out',
               onUpdate: function() {
                   valueEl.textContent = Math.round(this.targets()[0].val).toLocaleString();
               }
           });
       } else {
           valueEl.textContent = count.toLocaleString();
       }
   }
   
   
   /* ============================================
      10. DATA LOADING
      Purpose: fetch-chapter-data
      ============================================ */
   
   /**
    * Preload chapter data
    * Purpose: cache-geojson-data
    * ENHANCED: Better error handling with retries and fallback
    */
   async function preloadChapterData(chapterId) {
       const chapter = CHAPTERS[chapterId];

       if (!chapter) {
           console.warn(`[DATA] Unknown chapter: ${chapterId}`);
           return createEmptyGeoJSON();
       }

       if (!chapter.dataFile) {
           console.log(`[DATA] No data file for ${chapterId}`);
           return createEmptyGeoJSON();
       }

       // Return cached data if available
       if (STATE.dataCache[chapterId]) {
           console.log(`[DATA] Using cached data for ${chapterId}`);
           return STATE.dataCache[chapterId];
       }

       // Try to fetch with retries
       const maxRetries = 2;
       const retryDelay = 1000;

       for (let attempt = 0; attempt <= maxRetries; attempt++) {
           try {
               const controller = new AbortController();
               const timeoutId = setTimeout(() => controller.abort(), 30000);

               const response = await fetch(chapter.dataFile, {
                   signal: controller.signal
               });

               clearTimeout(timeoutId);

               if (!response.ok) {
                   throw new Error(`HTTP ${response.status} ${response.statusText}`);
               }

               const data = await response.json();

               // Validate GeoJSON
               if (!data || !data.type) {
                   console.warn(`[DATA] Invalid GeoJSON for ${chapterId}, using empty fallback`);
                   STATE.dataCache[chapterId] = createEmptyGeoJSON();
                   return STATE.dataCache[chapterId];
               }

               STATE.dataCache[chapterId] = data;
               console.log(`[DATA] Loaded data for ${chapterId} (${data.features?.length || 0} features)`);
               return data;

           } catch (e) {
               const isTimeout = e.name === 'AbortError';
               const isLastAttempt = attempt === maxRetries;

               console.warn(`[DATA] ${isTimeout ? 'Timeout' : 'Error'} loading ${chapter.dataFile} (attempt ${attempt + 1}/${maxRetries + 1}):`, e.message);

               if (isLastAttempt) {
                   console.error(`[DATA] Failed to load ${chapterId} after ${maxRetries + 1} attempts, using empty fallback`);
                   STATE.dataCache[chapterId] = createEmptyGeoJSON();
                   return STATE.dataCache[chapterId];
               }

               // Wait before retry
               await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
           }
       }

       return createEmptyGeoJSON();
   }

   /**
    * Get chapter data (from cache or load)
    * Purpose: retrieve-chapter-geojson
    */
   async function getChapterData(chapterId) {
       if (STATE.dataCache[chapterId]) {
           return STATE.dataCache[chapterId];
       }
       return await preloadChapterData(chapterId);
   }

   /**
    * Create empty GeoJSON fallback
    * Purpose: graceful-fallback-for-missing-data
    */
   function createEmptyGeoJSON() {
       return {
           type: 'FeatureCollection',
           features: []
       };
   }
   
   
   /* ============================================
      11. EVENT LISTENERS
      Purpose: handle-user-interactions
      ============================================ */
   
   /**
    * Setup all event listeners
    * Purpose: bind-ui-events
    */
   function setupEventListeners() {
       // Keyboard navigation
       document.addEventListener('keydown', handleKeyboard);
       
       // Map move sync with mini map
       if (STATE.map) {
           STATE.map.on('move', () => {
               // Skip move sync for chapters with custom mini-map positions
               if (STATE.currentChapter === 'april-h1' || STATE.currentChapter === 'june') return;
               const center = STATE.map.getCenter();
               updateMiniMapMarker([center.lng, center.lat]);
           });
       }
       
       console.log('[EVENTS] Event listeners setup complete');
   }
   
   /**
    * Handle keyboard navigation
    * Purpose: keyboard-accessibility
    */
   function handleKeyboard(e) {
       // Arrow down or space - scroll to next section
       if (e.key === 'ArrowDown' || e.key === ' ') {
           // Let default scroll behavior handle it
       }
       
       // Escape - close vessel info panel on mobile or hide other UI
       if (e.key === 'Escape') {
           document.getElementById('vessel-info-panel')?.classList.add('hidden');
       }
   }
   
   
   /* ============================================
      12. UTILITY FUNCTIONS
      Purpose: helper-methods
      ============================================ */
   
   /**
    * Register a timeout for cleanup tracking
    * Purpose: track-timeout-ids
    */
   function registerTimeout(callback, delay) {
       const id = setTimeout(callback, delay);
       STATE.activeTimeouts.push(id);
       return id;
   }
   
   /**
    * Register an interval for cleanup tracking
    * Purpose: track-interval-ids
    */
   function registerInterval(callback, delay) {
       const id = setInterval(callback, delay);
       STATE.activeIntervals.push(id);
       return id;
   }
   
   /**
    * Register an animation for cleanup tracking
    * Purpose: track-animation-refs
    */
   function registerAnimation(animation) {
       STATE.activeAnimations.push(animation);
       return animation;
   }
   
   /**
    * Expose utility functions globally for chapter scripts
    * Purpose: global-api-access
    * ENHANCED: Added new memory management helpers
    */
   window.MapUtils = {
       // Layer management
       addSource,
       addLayer,
       removeLayer,
       removeSource,
       setLayerVisibility,

       // Marker management
       createVesselMarker,
       createDetectionMarker,
       registerMarker,
       safeRemoveMarker,

       // Popup management
       registerPopup,
       safeRemovePopup,

       // Timer management
       registerTimeout,
       registerInterval,
       registerAnimation,

       // UI updates
       updateDetectionCounter,
       updateLegend,
       updateVesselPanel,

       // Data
       getChapterData,
       createEmptyGeoJSON,

       // State access
       getState: () => STATE,
       getMap: () => STATE.map
   };
   
   
   /* ============================================
      13. INITIALIZATION
      Purpose: startup-sequence
      ============================================ */
   
   /**
    * Main initialization
    * Purpose: app-entry-point
    */
   function init() {
       console.log('[INIT] Starting Theia Year in Review 2025');
       
       // Initialize opening animations
       if (typeof initOpening === 'function') {
           initOpening();
       }
       
       // Initialize timeline
       if (typeof initTimeline === 'function') {
           initTimeline();
       }
       
       // Initialize maps
       initMainMap();
       initMiniMap();
       initIntroMap();
       
       // Initialize buttons
       if (typeof initButtons === 'function') {
           initButtons();
       }
       
       // Setup horizontal scroll event listeners
       setupHorizontalScrollListeners();
       
       console.log('[INIT] Initialization complete');
   }
   
   
   /**
    * Setup event listeners for horizontal scroll module
    */
   function setupHorizontalScrollListeners() {
       // Listen for slide changes
       document.addEventListener('hslide:change', handleHorizontalSlideChange);
       
       // Listen for horizontal scroll exit
       document.addEventListener('hslide:exit', handleHorizontalExit);
       
       console.log('[INIT] Horizontal scroll listeners registered');
   }
   
   // Start when DOM is ready
   if (document.readyState === 'loading') {
       document.addEventListener('DOMContentLoaded', init);
   } else {
       init();
   }
   
   
   /* ============================================
      EXPORTS FOR MODULES
      ============================================ */
   window.STATE = STATE;
   window.CHAPTERS = CHAPTERS;
   window.CHAPTER_ORDER = CHAPTER_ORDER;
   window.masterCleanup = masterCleanup;
   window.handleChapterEnter = handleChapterEnter;
   window.handleChapterExit = handleChapterExit;
   
   // Split-screen exports for Chapter 7
   window.activateSplitScreen = activateSplitScreen;
   window.deactivateSplitScreen = deactivateSplitScreen;
   window.cleanupSplitScreenMaps = cleanupSplitScreenMaps;