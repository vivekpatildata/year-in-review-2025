/* ============================================
   THEIA YEAR IN REVIEW 2025 - UTILS.JS
   Utility Functions & Helper Methods
   
   STRUCTURE:
   1. DOM Utilities
   2. Animation Utilities
   3. Data Utilities
   4. Format Utilities
   5. Debug Utilities
   6. Mobile Detection
   7. Performance Utilities
   ============================================ */

   'use strict';

   /* ============================================
      1. DOM UTILITIES
      Purpose: dom-manipulation-helpers
      ============================================ */
   
   // Purpose: get-element-safely
   function getElement(selector) {
       const el = document.querySelector(selector);
       if (!el) {
           console.warn(`Element not found: ${selector}`);
       }
       return el;
   }
   
   // Purpose: get-multiple-elements
   function getElements(selector) {
       return document.querySelectorAll(selector);
   }
   
   // Purpose: create-element-with-class
   function createElement(tag, className, attributes = {}) {
       const el = document.createElement(tag);
       if (className) {
           el.className = className;
       }
       Object.entries(attributes).forEach(([key, value]) => {
           el.setAttribute(key, value);
       });
       return el;
   }
   
   // Purpose: remove-element-safely
   function removeElement(element) {
       if (element && element.parentNode) {
           element.parentNode.removeChild(element);
       }
   }
   
   // Purpose: remove-elements-by-selector
   function removeElementsBySelector(selector) {
       document.querySelectorAll(selector).forEach(el => {
           if (el.parentNode) {
               el.parentNode.removeChild(el);
           }
       });
   }
   
   // Purpose: add-class-safely
   function addClass(element, className) {
       if (element && className) {
           element.classList.add(className);
       }
   }
   
   // Purpose: remove-class-safely
   function removeClass(element, className) {
       if (element && className) {
           element.classList.remove(className);
       }
   }
   
   // Purpose: toggle-class-safely
   function toggleClass(element, className, force) {
       if (element && className) {
           return element.classList.toggle(className, force);
       }
       return false;
   }
   
   // Purpose: has-class-check
   function hasClass(element, className) {
       return element && element.classList && element.classList.contains(className);
   }
   
   // Purpose: set-element-styles
   function setStyles(element, styles) {
       if (element && styles) {
           Object.assign(element.style, styles);
       }
   }
   
   // Purpose: set-css-variable
   function setCSSVariable(name, value, element = document.documentElement) {
       element.style.setProperty(name, value);
   }
   
   // Purpose: get-css-variable
   function getCSSVariable(name, element = document.documentElement) {
       return getComputedStyle(element).getPropertyValue(name).trim();
   }
   
   
   /* ============================================
      2. ANIMATION UTILITIES
      Purpose: animation-control-helpers
      ============================================ */
   
   // Purpose: request-animation-frame-wrapper
   function nextFrame(callback) {
       return requestAnimationFrame(() => {
           requestAnimationFrame(callback);
       });
   }
   
   // Purpose: cancel-animation-frame-wrapper
   function cancelFrame(id) {
       if (id) {
           cancelAnimationFrame(id);
       }
   }
   
   // Purpose: delay-execution-promise
   function delay(ms) {
       return new Promise(resolve => setTimeout(resolve, ms));
   }
   
   // Purpose: animate-value-smoothly
   function animateValue(start, end, duration, callback, easing = 'easeOutCubic') {
       const startTime = performance.now();
       const easingFunctions = {
           linear: t => t,
           easeOutCubic: t => 1 - Math.pow(1 - t, 3),
           easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
           easeOutQuart: t => 1 - Math.pow(1 - t, 4),
           easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
       };
       
       const easeFn = easingFunctions[easing] || easingFunctions.easeOutCubic;
       
       function tick(currentTime) {
           const elapsed = currentTime - startTime;
           const progress = Math.min(elapsed / duration, 1);
           const easedProgress = easeFn(progress);
           const currentValue = start + (end - start) * easedProgress;
           
           callback(currentValue);
           
           if (progress < 1) {
               requestAnimationFrame(tick);
           }
       }
       
       requestAnimationFrame(tick);
   }
   
   // Purpose: typewriter-effect-generator
   function typewriterEffect(element, text, speed = 50, callback = null) {
       let i = 0;
       element.textContent = '';
       
       function type() {
           if (i < text.length) {
               element.textContent += text.charAt(i);
               i++;
               setTimeout(type, speed);
           } else if (callback) {
               callback();
           }
       }
       
       type();
   }
   
   // Purpose: fade-element-in
   function fadeIn(element, duration = 300) {
       if (!element) return Promise.resolve();
       
       element.style.opacity = '0';
       element.style.display = 'block';
       element.style.transition = `opacity ${duration}ms ease`;
       
       return new Promise(resolve => {
           nextFrame(() => {
               element.style.opacity = '1';
               setTimeout(resolve, duration);
           });
       });
   }
   
   // Purpose: fade-element-out
   function fadeOut(element, duration = 300) {
       if (!element) return Promise.resolve();
       
       element.style.transition = `opacity ${duration}ms ease`;
       element.style.opacity = '0';
       
       return new Promise(resolve => {
           setTimeout(() => {
               element.style.display = 'none';
               resolve();
           }, duration);
       });
   }
   
   // Purpose: slide-element-in
   function slideIn(element, direction = 'left', duration = 300) {
       if (!element) return Promise.resolve();
       
       const transforms = {
           left: 'translateX(-100%)',
           right: 'translateX(100%)',
           up: 'translateY(-100%)',
           down: 'translateY(100%)'
       };
       
       element.style.transform = transforms[direction];
       element.style.opacity = '0';
       element.style.display = 'block';
       element.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
       
       return new Promise(resolve => {
           nextFrame(() => {
               element.style.transform = 'translate(0, 0)';
               element.style.opacity = '1';
               setTimeout(resolve, duration);
           });
       });
   }
   
   // Purpose: slide-element-out
   function slideOut(element, direction = 'left', duration = 300) {
       if (!element) return Promise.resolve();
       
       const transforms = {
           left: 'translateX(-100%)',
           right: 'translateX(100%)',
           up: 'translateY(-100%)',
           down: 'translateY(100%)'
       };
       
       element.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
       element.style.transform = transforms[direction];
       element.style.opacity = '0';
       
       return new Promise(resolve => {
           setTimeout(() => {
               element.style.display = 'none';
               element.style.transform = '';
               resolve();
           }, duration);
       });
   }
   
   
   /* ============================================
      3. DATA UTILITIES
      Purpose: data-handling-helpers
      ============================================ */
   
   // Purpose: fetch-json-data
   async function fetchJSON(url, options = {}) {
       const { timeout = 30000, retries = 2, retryDelay = 1000 } = options;

       for (let attempt = 0; attempt <= retries; attempt++) {
           try {
               // Create abort controller for timeout
               const controller = new AbortController();
               const timeoutId = setTimeout(() => controller.abort(), timeout);

               const response = await fetch(url, {
                   signal: controller.signal,
                   cache: 'default'
               });

               clearTimeout(timeoutId);

               if (!response.ok) {
                   throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
               }

               const data = await response.json();
               return data;

           } catch (error) {
               const isLastAttempt = attempt === retries;
               const isAborted = error.name === 'AbortError';

               if (isAborted) {
                   console.warn(`[FETCH] Request timeout for ${url} (attempt ${attempt + 1}/${retries + 1})`);
               } else {
                   console.warn(`[FETCH] Error fetching ${url} (attempt ${attempt + 1}/${retries + 1}):`, error.message);
               }

               if (isLastAttempt) {
                   console.error(`[FETCH] Failed to fetch ${url} after ${retries + 1} attempts`);
                   return null;
               }

               // Wait before retry
               await delay(retryDelay * (attempt + 1));
           }
       }
       return null;
   }

   // Purpose: fetch-geojson-data
   async function fetchGeoJSON(url, options = {}) {
       try {
           const data = await fetchJSON(url, options);

           if (!data) {
               console.warn(`[GEOJSON] No data returned from ${url}`);
               return createEmptyGeoJSON();
           }

           // Validate GeoJSON structure
           if (!data.type) {
               console.warn(`[GEOJSON] Invalid GeoJSON from ${url}: missing 'type' property`);
               return createEmptyGeoJSON();
           }

           // Validate FeatureCollection
           if (data.type === 'FeatureCollection' && !Array.isArray(data.features)) {
               console.warn(`[GEOJSON] Invalid FeatureCollection from ${url}: missing 'features' array`);
               data.features = [];
           }

           return data;

       } catch (error) {
           console.error(`[GEOJSON] Error processing GeoJSON from ${url}:`, error);
           return createEmptyGeoJSON();
       }
   }

   // Purpose: create-empty-geojson-fallback
   function createEmptyGeoJSON() {
       return {
           type: 'FeatureCollection',
           features: []
       };
   }
   
   // Purpose: deep-clone-object
   function deepClone(obj) {
       return JSON.parse(JSON.stringify(obj));
   }
   
   // Purpose: merge-objects-deep
   function deepMerge(target, source) {
       const result = { ...target };
       for (const key in source) {
           if (source[key] instanceof Object && key in target) {
               result[key] = deepMerge(target[key], source[key]);
           } else {
               result[key] = source[key];
           }
       }
       return result;
   }
   
   // Purpose: debounce-function-calls
   function debounce(func, wait = 100) {
       let timeout;
       return function executedFunction(...args) {
           const later = () => {
               clearTimeout(timeout);
               func(...args);
           };
           clearTimeout(timeout);
           timeout = setTimeout(later, wait);
       };
   }
   
   // Purpose: throttle-function-calls
   function throttle(func, limit = 100) {
       let inThrottle;
       return function executedFunction(...args) {
           if (!inThrottle) {
               func(...args);
               inThrottle = true;
               setTimeout(() => inThrottle = false, limit);
           }
       };
   }
   
   // Purpose: generate-unique-id
   function generateId(prefix = 'id') {
       return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
   }
   
   // Purpose: group-array-by-key
   function groupBy(array, key) {
       return array.reduce((acc, item) => {
           const groupKey = typeof key === 'function' ? key(item) : item[key];
           (acc[groupKey] = acc[groupKey] || []).push(item);
           return acc;
       }, {});
   }
   
   
   /* ============================================
      4. FORMAT UTILITIES
      Purpose: data-formatting-helpers
      ============================================ */
   
   // Purpose: format-date-string
   function formatDate(date, format = 'short') {
       const d = new Date(date);
       
       const formats = {
           short: { month: 'short', day: 'numeric', year: 'numeric' },
           long: { month: 'long', day: 'numeric', year: 'numeric' },
           monthYear: { month: 'short', year: 'numeric' },
           full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
       };
       
       return d.toLocaleDateString('en-US', formats[format] || formats.short);
   }
   
   // Purpose: format-number-display
   function formatNumber(num, options = {}) {
       const { decimals = 0, prefix = '', suffix = '', locale = 'en-US' } = options;
       return prefix + num.toLocaleString(locale, {
           minimumFractionDigits: decimals,
           maximumFractionDigits: decimals
       }) + suffix;
   }
   
   // Purpose: format-coordinates-display
   function formatCoordinates(lng, lat, precision = 4) {
       const latDir = lat >= 0 ? 'N' : 'S';
       const lngDir = lng >= 0 ? 'E' : 'W';
       return `${Math.abs(lat).toFixed(precision)}°${latDir}, ${Math.abs(lng).toFixed(precision)}°${lngDir}`;
   }
   
   // Purpose: format-distance-display
   function formatDistance(meters) {
       if (meters >= 1852) {
           // Convert to nautical miles
           const nm = meters / 1852;
           return `${nm.toFixed(1)} nm`;
       } else if (meters >= 1000) {
           return `${(meters / 1000).toFixed(1)} km`;
       }
       return `${Math.round(meters)} m`;
   }
   
   // Purpose: format-duration-display
   function formatDuration(minutes) {
       if (minutes < 60) {
           return `${minutes} min`;
       }
       const hours = Math.floor(minutes / 60);
       const mins = minutes % 60;
       if (hours < 24) {
           return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
       }
       const days = Math.floor(hours / 24);
       const remainingHours = hours % 24;
       return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
   }
   
   // Purpose: truncate-text-ellipsis
   function truncateText(text, maxLength = 100) {
       if (text.length <= maxLength) return text;
       return text.substring(0, maxLength - 3) + '...';
   }
   
   // Purpose: capitalize-first-letter
   function capitalize(string) {
       return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
   }
   
   // Purpose: convert-to-title-case
   function toTitleCase(string) {
       return string.replace(/\w\S*/g, txt =>
           txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
       );
   }
   
   
   /* ============================================
      5. DEBUG UTILITIES
      Purpose: development-debugging-helpers
      ============================================ */
   
   // Purpose: check-debug-mode
   function isDebugMode() {
       return window.DEBUG_MODE === true ||
              window.location.search.includes('debug=true') ||
              localStorage.getItem('debugMode') === 'true';
   }
   
   // Purpose: debug-log-wrapper
   function debugLog(...args) {
       if (isDebugMode()) {
           console.log('[DEBUG]', ...args);
       }
   }
   
   // Purpose: debug-warn-wrapper
   function debugWarn(...args) {
       if (isDebugMode()) {
           console.warn('[DEBUG WARN]', ...args);
       }
   }
   
   // Purpose: debug-error-wrapper
   function debugError(...args) {
       console.error('[ERROR]', ...args);
   }
   
   // Purpose: debug-time-start
   function debugTimeStart(label) {
       if (isDebugMode()) {
           console.time(`[TIMER] ${label}`);
       }
   }
   
   // Purpose: debug-time-end
   function debugTimeEnd(label) {
       if (isDebugMode()) {
           console.timeEnd(`[TIMER] ${label}`);
       }
   }
   
   // Purpose: log-state-snapshot
   function logStateSnapshot(state, label = 'State Snapshot') {
       if (isDebugMode()) {
           console.group(`[DEBUG] ${label}`);
           console.log(JSON.parse(JSON.stringify(state)));
           console.groupEnd();
       }
   }
   
   
   /* ============================================
      6. MOBILE DETECTION
      Purpose: device-detection-helpers
      ============================================ */
   
   // Purpose: detect-mobile-device
   function isMobile() {
       return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
              window.innerWidth <= 768;
   }
   
   // Purpose: detect-touch-device
   function isTouchDevice() {
       return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
   }
   
   // Purpose: get-viewport-dimensions
   function getViewport() {
       return {
           width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
           height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
       };
   }
   
   // Purpose: get-scroll-position
   function getScrollPosition() {
       return {
           x: window.pageXOffset || document.documentElement.scrollLeft,
           y: window.pageYOffset || document.documentElement.scrollTop
       };
   }
   
   // Purpose: check-element-in-viewport
   function isInViewport(element, threshold = 0) {
       if (!element) return false;
       const rect = element.getBoundingClientRect();
       return (
           rect.top <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
           rect.bottom >= -threshold &&
           rect.left <= (window.innerWidth || document.documentElement.clientWidth) + threshold &&
           rect.right >= -threshold
       );
   }
   
   // Purpose: get-breakpoint-name
   function getBreakpoint() {
       const width = window.innerWidth;
       if (width < 480) return 'xs';
       if (width < 768) return 'sm';
       if (width < 1024) return 'md';
       if (width < 1280) return 'lg';
       return 'xl';
   }
   
   
   /* ============================================
      7. PERFORMANCE UTILITIES
      Purpose: performance-optimization-helpers
      ============================================ */
   
   // Purpose: lazy-load-image
   function lazyLoadImage(img, src) {
       return new Promise((resolve, reject) => {
           img.onload = () => resolve(img);
           img.onerror = reject;
           img.src = src;
       });
   }
   
   // Purpose: preload-images-array
   async function preloadImages(urls) {
       const promises = urls.map(url => {
           return new Promise((resolve, reject) => {
               const img = new Image();
               img.onload = () => resolve(url);
               img.onerror = () => reject(url);
               img.src = url;
           });
       });
       
       return Promise.allSettled(promises);
   }
   
   // Purpose: request-idle-callback-wrapper
   function onIdle(callback, timeout = 2000) {
       if ('requestIdleCallback' in window) {
           return requestIdleCallback(callback, { timeout });
       }
       return setTimeout(callback, 100);
   }
   
   // Purpose: cancel-idle-callback-wrapper
   function cancelIdle(id) {
       if ('cancelIdleCallback' in window) {
           cancelIdleCallback(id);
       } else {
           clearTimeout(id);
       }
   }
   
   // Purpose: measure-function-performance
   function measurePerformance(fn, label = 'Function') {
       return function(...args) {
           const start = performance.now();
           const result = fn.apply(this, args);
           const end = performance.now();
           debugLog(`${label} took ${(end - start).toFixed(2)}ms`);
           return result;
       };
   }
   
   
   /* ============================================
      EXPORT UTILITIES
      Purpose: expose-global-utils
      ============================================ */
   /* ============================================
      8. OPENING SECTION INITIALIZATION
      Purpose: setup-hero-section
      ============================================ */
   
   /**
    * Initialize opening section
    * Purpose: typewriter-and-scroll-indicator
    */
   function initOpening() {
       console.log('[Opening] Initializing opening section');
       
       // Initialize typewriter effect
       initTypewriter();
       
       // Initialize scroll indicator
       initScrollIndicator();
   }
   
   /**
    * Initialize typewriter effect for title
    * Purpose: animate-title-text
    */
   function initTypewriter() {
       const textElement = document.getElementById('typewriter-text');
       if (!textElement) {
           console.warn('[Opening] Typewriter element not found');
           return;
       }
       
       const text = 'Year in Review 2025';
       let index = 0;
       
       // Clear existing
       textElement.textContent = '';
       textElement.style.opacity = '1';
       
       // Start typing after short delay
       setTimeout(() => {
           const typeInterval = setInterval(() => {
               if (index < text.length) {
                   textElement.textContent += text.charAt(index);
                   index++;
               } else {
                   clearInterval(typeInterval);
                   // Add class to remove blinking cursor
                   textElement.classList.add('typing-complete');
               }
           }, 80);
       }, 500);
   }
   
   /**
    * Initialize scroll indicator
    * Purpose: show-scroll-hint
    */
   function initScrollIndicator() {
       const indicator = document.getElementById('scroll-indicator');
       if (!indicator) return;
       
       // Show after delay
       setTimeout(() => {
           indicator.classList.add('visible');
       }, 2000);
       
       // Hide on scroll
       let hidden = false;
       window.addEventListener('scroll', () => {
           if (!hidden && window.scrollY > 100) {
               indicator.classList.remove('visible');
               indicator.classList.add('hidden');
               hidden = true;
           }
       }, { passive: true });
   }
   
   // Export initOpening globally
   window.initOpening = initOpening;
   
   
   /* ============================================
      EXPORTS
      Purpose: expose-utility-functions
      ============================================ */
   window.Utils = {
       // DOM
       getElement,
       getElements,
       createElement,
       removeElement,
       removeElementsBySelector,
       addClass,
       removeClass,
       toggleClass,
       hasClass,
       setStyles,
       setCSSVariable,
       getCSSVariable,

       // Animation
       nextFrame,
       cancelFrame,
       delay,
       animateValue,
       typewriterEffect,
       fadeIn,
       fadeOut,
       slideIn,
       slideOut,

       // Data
       fetchJSON,
       fetchGeoJSON,
       createEmptyGeoJSON,
       deepClone,
       deepMerge,
       debounce,
       throttle,
       generateId,
       groupBy,

       // Format
       formatDate,
       formatNumber,
       formatCoordinates,
       formatDistance,
       formatDuration,
       truncateText,
       capitalize,
       toTitleCase,

       // Debug
       isDebugMode,
       debugLog,
       debugWarn,
       debugError,
       debugTimeStart,
       debugTimeEnd,
       logStateSnapshot,

       // Mobile
       isMobile,
       isTouchDevice,
       getViewport,
       getScrollPosition,
       isInViewport,
       getBreakpoint,

       // Performance
       lazyLoadImage,
       preloadImages,
       onIdle,
       cancelIdle,
       measurePerformance
   };
   
   console.log('[Utils] Utility functions loaded');
