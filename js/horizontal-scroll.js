/* ============================================
   HORIZONTAL SCROLL CONTROLLER
   Theia Year in Review 2025
   
   PURPOSE:
   This file handles horizontal (sideways) scrolling
   within a chapter. Use this when you want to show
   multiple detail slides for a single month.
   
   HOW IT WORKS:
   - Vertical scroll gets "hijacked" temporarily
   - Converts vertical scroll into horizontal slide movement
   - Once all slides are viewed, releases back to vertical
   
   USAGE:
   1. Add data-scroll-type="horizontal" to your step
   2. Add .horizontal-section with .h-slides inside
   3. Each slide is a .h-slide element
   ============================================ */

   'use strict';

   const HorizontalScroll = (function() {
       
       /* ============================================
          STATE
          ============================================ */
       const STATE = {
           isActive: false,
           currentSlide: 0,
           totalSlides: 0,
           container: null,
           slidesWrapper: null,
           slides: [],
           progressDots: [],
           isLocked: false,
           lockTimeout: null,
           scrollAccumulator: 0,
           scrollThreshold: 100, // pixels of scroll needed to change slide
           touchStartY: 0,
           chapterId: null
       };
   
       /* ============================================
          INITIALIZATION
          ============================================ */
       
       /**
        * Initialize horizontal scroll for a section
        * @param {string} chapterId - The chapter this belongs to (e.g., 'january')
        */
       function init(chapterId) {
           console.log(`[H-SCROLL] Initializing for chapter: ${chapterId}`);
           
           const container = document.querySelector(`[data-h-chapter="${chapterId}"]`);
           if (!container) {
               console.warn(`[H-SCROLL] No horizontal container found for: ${chapterId}`);
               return false;
           }
           
           STATE.container = container;
           STATE.slidesWrapper = container.querySelector('.h-slides');
           STATE.slides = Array.from(container.querySelectorAll('.h-slide'));
           STATE.totalSlides = STATE.slides.length;
           STATE.currentSlide = 0;
           STATE.chapterId = chapterId;
           
           if (STATE.totalSlides === 0) {
               console.warn('[H-SCROLL] No slides found');
               return false;
           }
           
           // Create progress indicator
           createProgressIndicator(container);
           
           // Setup event listeners
           setupEventListeners();
           
           console.log(`[H-SCROLL] Initialized with ${STATE.totalSlides} slides`);
           return true;
       }
       
       /**
        * Create the dot progress indicator
        */
       function createProgressIndicator(container) {
           // Remove existing
           const existing = container.querySelector('.h-progress');
           if (existing) existing.remove();
           
           const progress = document.createElement('div');
           progress.className = 'h-progress';
           
           STATE.progressDots = [];
           
           for (let i = 0; i < STATE.totalSlides; i++) {
               const dot = document.createElement('button');
               dot.className = 'h-progress-dot';
               dot.dataset.index = i;
               dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
               
               if (i === 0) dot.classList.add('active');
               
               dot.addEventListener('click', () => goToSlide(i));
               
               progress.appendChild(dot);
               STATE.progressDots.push(dot);
           }
           
           container.appendChild(progress);
       }
       
       /**
        * Setup all event listeners
        */
       function setupEventListeners() {
           // Wheel event for desktop
           STATE.container.addEventListener('wheel', handleWheel, { passive: false });
           
           // Touch events for mobile
           STATE.container.addEventListener('touchstart', handleTouchStart, { passive: true });
           STATE.container.addEventListener('touchmove', handleTouchMove, { passive: false });
           STATE.container.addEventListener('touchend', handleTouchEnd, { passive: true });
           
           // Keyboard navigation
           document.addEventListener('keydown', handleKeydown);
       }
       
       /**
        * Remove event listeners
        */
       function removeEventListeners() {
           if (STATE.container) {
               STATE.container.removeEventListener('wheel', handleWheel);
               STATE.container.removeEventListener('touchstart', handleTouchStart);
               STATE.container.removeEventListener('touchmove', handleTouchMove);
               STATE.container.removeEventListener('touchend', handleTouchEnd);
           }
           document.removeEventListener('keydown', handleKeydown);
       }
   
       /* ============================================
          EVENT HANDLERS
          ============================================ */
       
       /**
        * Handle mouse wheel scrolling
        */
       function handleWheel(e) {
           if (!STATE.isActive || STATE.isLocked) return;
           
           e.preventDefault();
           
           // Accumulate scroll delta
           STATE.scrollAccumulator += e.deltaY;
           
           // Check if we've scrolled enough to trigger slide change
           if (Math.abs(STATE.scrollAccumulator) >= STATE.scrollThreshold) {
               if (STATE.scrollAccumulator > 0) {
                   // Scrolling down = next slide
                   if (STATE.currentSlide < STATE.totalSlides - 1) {
                       nextSlide();
                   } else {
                       // At last slide, release to vertical scroll
                       releaseToVertical('down');
                   }
               } else {
                   // Scrolling up = previous slide
                   if (STATE.currentSlide > 0) {
                       prevSlide();
                   } else {
                       // At first slide, release to vertical scroll
                       releaseToVertical('up');
                   }
               }
               STATE.scrollAccumulator = 0;
           }
       }
       
       /**
        * Handle touch start
        */
       function handleTouchStart(e) {
           STATE.touchStartY = e.touches[0].clientY;
       }
       
       /**
        * Handle touch move
        */
       function handleTouchMove(e) {
           if (!STATE.isActive || STATE.isLocked) return;
           
           const touchY = e.touches[0].clientY;
           const deltaY = STATE.touchStartY - touchY;
           
           // Prevent default scroll if we're handling it
           if (Math.abs(deltaY) > 10) {
               e.preventDefault();
           }
       }
       
       /**
        * Handle touch end
        */
       function handleTouchEnd(e) {
           if (!STATE.isActive || STATE.isLocked) return;
           
           const touchEndY = e.changedTouches[0].clientY;
           const deltaY = STATE.touchStartY - touchEndY;
           
           if (Math.abs(deltaY) > 50) { // Minimum swipe distance
               if (deltaY > 0) {
                   // Swiped up = next
                   if (STATE.currentSlide < STATE.totalSlides - 1) {
                       nextSlide();
                   } else {
                       releaseToVertical('down');
                   }
               } else {
                   // Swiped down = prev
                   if (STATE.currentSlide > 0) {
                       prevSlide();
                   } else {
                       releaseToVertical('up');
                   }
               }
           }
       }
       
       /**
        * Handle keyboard navigation
        */
       function handleKeydown(e) {
           if (!STATE.isActive) return;
           
           switch (e.key) {
               case 'ArrowRight':
               case 'ArrowDown':
                   e.preventDefault();
                   if (STATE.currentSlide < STATE.totalSlides - 1) {
                       nextSlide();
                   }
                   break;
               case 'ArrowLeft':
               case 'ArrowUp':
                   e.preventDefault();
                   if (STATE.currentSlide > 0) {
                       prevSlide();
                   }
                   break;
           }
       }
   
       /* ============================================
          SLIDE NAVIGATION
          ============================================ */
       
       /**
        * Go to next slide
        */
       function nextSlide() {
           if (STATE.currentSlide >= STATE.totalSlides - 1) return;
           goToSlide(STATE.currentSlide + 1);
       }
       
       /**
        * Go to previous slide
        */
       function prevSlide() {
           if (STATE.currentSlide <= 0) return;
           goToSlide(STATE.currentSlide - 1);
       }
       
       /**
        * Go to specific slide
        */
       function goToSlide(index) {
           if (index < 0 || index >= STATE.totalSlides) return;
           if (STATE.isLocked) return;
           
           // Lock to prevent rapid navigation
           lock(400);
           
           const prevIndex = STATE.currentSlide;
           STATE.currentSlide = index;
           
           console.log(`[H-SCROLL] Going to slide ${index + 1}/${STATE.totalSlides}`);
           
           // Animate slides
           if (STATE.slidesWrapper) {
               const offset = -index * 100;
               STATE.slidesWrapper.style.transform = `translateX(${offset}%)`;
           }
           
           // Update progress dots
           STATE.progressDots.forEach((dot, i) => {
               dot.classList.toggle('active', i === index);
           });
           
           // Update slide classes
           STATE.slides.forEach((slide, i) => {
               slide.classList.toggle('active', i === index);
               slide.classList.toggle('prev', i < index);
               slide.classList.toggle('next', i > index);
           });
           
           // Dispatch custom event for other systems to listen to
           const event = new CustomEvent('hslide:change', {
               detail: {
                   chapterId: STATE.chapterId,
                   slideIndex: index,
                   totalSlides: STATE.totalSlides,
                   direction: index > prevIndex ? 'forward' : 'backward'
               }
           });
           document.dispatchEvent(event);
           
           // Call slide-specific animation if exists
           triggerSlideAnimation(index);
       }
       
       /**
        * Trigger animation for specific slide
        */
       function triggerSlideAnimation(index) {
           const slide = STATE.slides[index];
           if (!slide) return;
           
           const slideId = slide.dataset.slideId;
           const functionName = `animateSlide_${STATE.chapterId}_${slideId || index}`;
           
           if (typeof window[functionName] === 'function') {
               console.log(`[H-SCROLL] Calling animation: ${functionName}`);
               window[functionName](slide, index);
           }
       }
       
       /**
        * Lock navigation temporarily
        */
       function lock(duration = 500) {
           STATE.isLocked = true;
           clearTimeout(STATE.lockTimeout);
           STATE.lockTimeout = setTimeout(() => {
               STATE.isLocked = false;
           }, duration);
       }
       
       /**
        * Release control back to vertical scrolling
        */
       function releaseToVertical(direction) {
           console.log(`[H-SCROLL] Releasing to vertical scroll (${direction})`);
           
           // Dispatch event so map.js can handle the transition
           const event = new CustomEvent('hslide:exit', {
               detail: {
                   chapterId: STATE.chapterId,
                   direction: direction,
                   fromSlide: STATE.currentSlide
               }
           });
           document.dispatchEvent(event);
           
           // Deactivate
           deactivate();
       }
   
       /* ============================================
          ACTIVATION / DEACTIVATION
          ============================================ */
       
       /**
        * Activate horizontal scrolling
        */
       function activate(startSlideIndex = 0) {
           if (STATE.isActive) return;
           
           STATE.isActive = true;
           STATE.scrollAccumulator = 0;
           
           // Set starting slide (important for backward scrolling)
           if (startSlideIndex > 0 && startSlideIndex < STATE.totalSlides) {
               STATE.currentSlide = startSlideIndex;
               
               // Update visual position without animation
               if (STATE.slidesWrapper) {
                   const offset = -startSlideIndex * 100;
                   STATE.slidesWrapper.style.transition = 'none';
                   STATE.slidesWrapper.style.transform = `translateX(${offset}%)`;
                   // Re-enable transition after a frame
                   requestAnimationFrame(() => {
                       STATE.slidesWrapper.style.transition = '';
                   });
               }
               
               // Update slide classes
               STATE.slides.forEach((slide, i) => {
                   slide.classList.toggle('active', i === startSlideIndex);
                   slide.classList.toggle('prev', i < startSlideIndex);
                   slide.classList.toggle('next', i > startSlideIndex);
               });
               
               // Update progress dots
               STATE.progressDots.forEach((dot, i) => {
                   dot.classList.toggle('active', i === startSlideIndex);
               });
               
               // Update counter
               const counter = document.querySelector('.h-slide-counter .current');
               if (counter) counter.textContent = startSlideIndex + 1;
               
               console.log(`[H-SCROLL] Activated at slide ${startSlideIndex + 1}/${STATE.totalSlides}`);
           } else {
               console.log('[H-SCROLL] Activated at slide 1');
           }
           
           if (STATE.container) {
               STATE.container.classList.add('is-active');
           }
           
           // Prevent body scroll
           document.body.style.overflow = 'hidden';
       }
       
       /**
        * Deactivate horizontal scrolling
        */
       function deactivate() {
           STATE.isActive = false;
           
           if (STATE.container) {
               STATE.container.classList.remove('is-active');
           }
           
           // Restore body scroll
           document.body.style.overflow = '';
           
           console.log('[H-SCROLL] Deactivated');
       }
       
       /**
        * Full cleanup
        */
       function destroy() {
           deactivate();
           removeEventListeners();
           
           // Remove progress indicator
           if (STATE.container) {
               const progress = STATE.container.querySelector('.h-progress');
               if (progress) progress.remove();
           }
           
           // Reset state
           STATE.container = null;
           STATE.slidesWrapper = null;
           STATE.slides = [];
           STATE.progressDots = [];
           STATE.currentSlide = 0;
           STATE.totalSlides = 0;
           STATE.chapterId = null;
           
           console.log('[H-SCROLL] Destroyed');
       }
       
       /**
        * Reset to first slide
        */
       function reset() {
           goToSlide(0);
       }
   
       /* ============================================
          PUBLIC API
          ============================================ */
       return {
           init,
           activate,
           deactivate,
           destroy,
           reset,
           nextSlide,
           prevSlide,
           goToSlide,
           getState: () => ({ ...STATE }),
           isActive: () => STATE.isActive,
           getCurrentSlide: () => STATE.currentSlide,
           getTotalSlides: () => STATE.totalSlides
       };
       
   })();
   
   // Export globally
   window.HorizontalScroll = HorizontalScroll;
   
   console.log('[H-SCROLL] Horizontal scroll module loaded');