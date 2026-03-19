/* ============================================
   Hero carousel — arrows, dots, keyboard, swipe
   ============================================ */

(function () {
    'use strict';

    var slides = [
        {
            label: 'ApolloOne',
            icon: 'images/apolloone-icon.png',
            image: 'images/apolloone-quick-edit.jpg',
            alt: 'ApolloOne Quick Edit screenshot',
            caption: 'Browse at up to <strong>32 fps on M1 Ultra</strong>, view full-resolution images instantly, display <strong>AF points</strong> recorded in the image, and make non-destructive adjustments with <strong>Quick Edit</strong>.'
        },
        {
            label: 'Camera RawX',
            icon: 'images/camerarawx-icon.png?v=2',
            image: 'images/camerarawx-quick-look.jpg',
            alt: 'Camera RawX Quick Look screenshot',
            caption: 'Displays thumbnails for unsupported RAW files in Finder, with the <strong>RawBridge™</strong> engine — the same high-performance RAW decoder used in ApolloOne — powering full-resolution <strong>Quick Look</strong> previews.'
        }
    ];

    var index = 0;
    var transitioning = false;
    var imageEl = document.getElementById('hero-image');
    var labelEl = document.getElementById('hero-label');
    var iconEl = document.getElementById('hero-icon');
    var captionEl = document.getElementById('hero-caption');
    var showcaseEl = document.querySelector('.hero-showcase');
    var bodyEl = document.querySelector('.hero-window-body');
    var dotsContainer = document.getElementById('hero-dots');
    var prevBtn = document.getElementById('hero-prev');
    var nextBtn = document.getElementById('hero-next');
    var autoTimer = null;
    var autoDelay = 12000;
    var resumeDelay = 20000;
    var resumeTimer = null;

    // --- Dot indicators ---
    var dots = [];
    function buildDots() {
        if (!dotsContainer) return;
        slides.forEach(function (_, i) {
            var dot = document.createElement('button');
            dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
            dot.addEventListener('click', function () {
                goTo(i);
                pauseAndResume();
            });
            dotsContainer.appendChild(dot);
            dots.push(dot);
        });
    }

    function updateDots() {
        dots.forEach(function (dot, i) {
            dot.classList.toggle('active', i === index);
        });
    }

    // --- Slide transition ---
    function preloadAndSwap(slide) {
        var nextImg = new Image();
        nextImg.onload = function () {
            imageEl.src = slide.image;
            imageEl.alt = slide.alt;
            if (iconEl) iconEl.src = slide.icon;
            // Update label text without replacing the icon element
            var textNode = labelEl.lastChild;
            if (textNode && textNode.nodeType === 3) {
                textNode.textContent = slide.label;
            } else {
                labelEl.appendChild(document.createTextNode(slide.label));
            }
            captionEl.innerHTML = slide.caption;
            imageEl.style.opacity = '1';
            setTimeout(function () { transitioning = false; }, 400);
        };
        nextImg.src = slide.image;
    }

    function applySlide(slide) {
        if (!imageEl || !labelEl || !captionEl) return;
        transitioning = true;
        imageEl.style.opacity = '0';
        setTimeout(function () {
            preloadAndSwap(slide);
        }, 600);
        updateDots();
    }

    function goTo(i) {
        if (i === index || transitioning) return;
        index = i;
        applySlide(slides[index]);
    }

    function next() {
        goTo((index + 1) % slides.length);
    }

    function prev() {
        goTo((index - 1 + slides.length) % slides.length);
    }

    // --- Auto-play ---
    function startAuto() {
        stopAuto();
        autoTimer = setInterval(next, autoDelay);
    }

    function stopAuto() {
        if (autoTimer) {
            clearInterval(autoTimer);
            autoTimer = null;
        }
    }

    function pauseAndResume() {
        stopAuto();
        if (resumeTimer) clearTimeout(resumeTimer);
        resumeTimer = setTimeout(startAuto, resumeDelay);
    }

    // --- Button controls ---
    function bindControls() {
        if (prevBtn) {
            prevBtn.addEventListener('click', function () {
                prev();
                pauseAndResume();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                next();
                pauseAndResume();
            });
        }
    }

    // --- Keyboard ---
    function bindKeyboard() {
        document.addEventListener('keydown', function (e) {
            // Only when hero is in viewport
            var rect = showcaseEl.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prev();
                pauseAndResume();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                next();
                pauseAndResume();
            }
        });
    }

    // --- Touch / trackpad swipe ---
    function bindSwipe() {
        var startX = 0;
        var startY = 0;
        var tracking = false;

        showcaseEl.addEventListener('touchstart', function (e) {
            if (e.touches.length === 1) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                tracking = true;
            }
        }, { passive: true });

        showcaseEl.addEventListener('touchend', function (e) {
            if (!tracking) return;
            tracking = false;
            var dx = e.changedTouches[0].clientX - startX;
            var dy = e.changedTouches[0].clientY - startY;
            // Only trigger if horizontal swipe > 50px and more horizontal than vertical
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                if (dx < 0) {
                    next();
                } else {
                    prev();
                }
                pauseAndResume();
            }
        }, { passive: true });
    }

    // --- Init ---
    function start() {
        if (!imageEl || !labelEl || !captionEl) return;
        imageEl.style.transition = 'opacity 0.8s ease';
        buildDots();
        bindControls();
        bindKeyboard();
        bindSwipe();
        applySlide(slides[0]);
        startAuto();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
