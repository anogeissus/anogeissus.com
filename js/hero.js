/* ============================================
   Simple hero rotation with per-image sizing
   ============================================ */

(function () {
    'use strict';

    var slides = [
        {
            label: 'ApolloOne',
            image: 'images/apolloone-quick-edit.jpg',
            alt: 'ApolloOne Quick Edit screenshot',
            caption: 'Browse at up to <strong>32 fps on M1 Ultra</strong>, view full-resolution images instantly, display <strong>AF points</strong> recorded in the image, and make non-destructive adjustments with <strong>Quick Edit</strong>.'
        },
        {
            label: 'Camera RawX',
            image: 'images/camerarawx-quick-look.jpg',
            alt: 'Camera RawX Quick Look screenshot',
            caption: 'Displays thumbnails for unsupported RAW files in Finder, with the <strong>RawBridge™</strong> engine powering full-resolution Quick Look previews.'
        }
    ];

    var index = 0;
    var imageEl = document.getElementById('hero-image');
    var labelEl = document.getElementById('hero-label');
    var captionEl = document.getElementById('hero-caption');
    var showcaseEl = document.querySelector('.hero-showcase');
    var bodyEl = document.querySelector('.hero-window-body');
    var maxWidth = 1120;
    var maxHeight = 720;

    function fitShowcase(img) {
        if (!img.naturalWidth || !img.naturalHeight || !showcaseEl || !bodyEl) return;

        var availableWidth = Math.min(maxWidth, showcaseEl.clientWidth || maxWidth);
        var ratio = img.naturalHeight / img.naturalWidth;
        var fittedHeight = Math.min(maxHeight, Math.round(availableWidth * ratio));

        bodyEl.style.height = fittedHeight + 'px';
        showcaseEl.style.minHeight = fittedHeight + 'px';
    }

    function preloadAndSwap(slide) {
        var nextImg = new Image();
        nextImg.onload = function () {
            imageEl.src = slide.image;
            imageEl.alt = slide.alt;
            labelEl.textContent = slide.label;
            captionEl.innerHTML = slide.caption;
            fitShowcase(nextImg);
            imageEl.style.opacity = '1';
        };
        nextImg.src = slide.image;
    }

    function applySlide(slide) {
        if (!imageEl || !labelEl || !captionEl) return;
        imageEl.style.opacity = '0';
        setTimeout(function () {
            preloadAndSwap(slide);
        }, 800);
    }

    function rotate() {
        index = (index + 1) % slides.length;
        applySlide(slides[index]);
    }

    function refreshSize() {
        if (imageEl && imageEl.complete) fitShowcase(imageEl);
    }

    function start() {
        if (!imageEl || !labelEl || !captionEl) return;
        imageEl.style.transition = 'opacity 1.35s ease';
        applySlide(slides[0]);
        setInterval(rotate, 13000);
        window.addEventListener('resize', refreshSize);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
