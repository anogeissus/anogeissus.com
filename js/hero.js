/* ============================================
   Hero Screenshot Rotation
   Photography tools first, testimonials/captions below
   ============================================ */

(function () {
    'use strict';

    var slides = [
        {
            label: 'ApolloOne',
            image: 'images/apolloone-quick-edit.jpg',
            alt: 'ApolloOne Quick Edit screenshot',
            caption: 'Browse at up to <strong>32 fps on M1 Ultra</strong>, view full-resolution images instantly, and make non-destructive adjustments with <strong>Quick Edit</strong>.'
        },
        {
            label: 'Camera RawX',
            image: 'images/camerarawx-quick-look.jpg',
            alt: 'Camera RawX Quick Look screenshot',
            caption: 'Open unsupported RAW files with <strong>RawBridge™</strong>, with fast previews and practical Finder integration for real-world workflows.'
        }
    ];

    var DISPLAY_TIME = 6500;
    var showcase = document.getElementById('hero-showcase');
    var captionStrip = document.getElementById('hero-caption-strip');
    var currentIndex = 0;
    var activeSlide = null;
    var activeCaption = null;

    function createDots() {
        return '<span class="hero-window-dot"></span><span class="hero-window-dot"></span><span class="hero-window-dot"></span>';
    }

    function createSlide(slide) {
        var el = document.createElement('div');
        el.className = 'hero-slide';
        el.innerHTML =
            '<div class="hero-window">' +
                '<div class="hero-window-bar">' + createDots() + '</div>' +
                '<div class="hero-window-body">' +
                    '<img src="' + slide.image + '" alt="' + slide.alt + '">' +
                '</div>' +
            '</div>';
        return el;
    }

    function createCaption(slide) {
        var el = document.createElement('div');
        el.className = 'hero-caption';
        el.innerHTML =
            '<div class="hero-caption-label">' + slide.label + '</div>' +
            '<div class="hero-caption-text">' + slide.caption + '</div>';
        return el;
    }

    function swapSlide() {
        var slide = slides[currentIndex];
        var nextSlide = createSlide(slide);
        var nextCaption = createCaption(slide);

        showcase.appendChild(nextSlide);
        captionStrip.appendChild(nextCaption);

        nextSlide.offsetHeight;
        nextCaption.offsetHeight;

        requestAnimationFrame(function () {
            nextSlide.classList.add('visible');
            nextCaption.classList.add('visible');
        });

        if (activeSlide) {
            activeSlide.classList.remove('visible');
            setTimeout(function () {
                if (activeSlide && activeSlide.parentNode) {
                    activeSlide.parentNode.removeChild(activeSlide);
                }
            }, 900);
        }

        if (activeCaption) {
            activeCaption.classList.remove('visible');
            setTimeout(function () {
                if (activeCaption && activeCaption.parentNode) {
                    activeCaption.parentNode.removeChild(activeCaption);
                }
            }, 800);
        }

        activeSlide = nextSlide;
        activeCaption = nextCaption;
        currentIndex = (currentIndex + 1) % slides.length;
    }

    function startRotation() {
        if (!showcase || !captionStrip) return;
        swapSlide();
        setInterval(swapSlide, DISPLAY_TIME);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startRotation);
    } else {
        startRotation();
    }
})();
