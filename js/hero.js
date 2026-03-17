/* ============================================
   Hero Text Cycling Animation
   Fades through brand messages & reviews
   ============================================ */

(function () {
    'use strict';

    var phrases = [
        // Brand messages
        { text: 'Professional photo tools for Mac.', type: 'brand' },
        { text: 'Built by photographers, for photographers.', type: 'brand' },
        { text: 'Blazing-fast RAW viewing. Instant.', type: 'brand' },

        // ApolloOne reviews
        { text: 'Instantaneous response. No blackouts. No low-res rendering.', type: 'review', app: 'ApolloOne' },
        { text: 'This app made me realize how much I hate catalog-based apps.', type: 'review', app: 'ApolloOne' },
        { text: 'Money well spent.', type: 'review', app: 'ApolloOne' },
        { text: 'I emailed about a problem — new release within days.', type: 'review', app: 'ApolloOne' },
        { text: 'Works perfect — even with a clicker for projector slideshows.', type: 'review', app: 'ApolloOne' },

        // Camera RawX reviews
        { text: 'A steal even at twice the price.', type: 'review', app: 'Camera RawX' },
        { text: 'If this had been £100 I would have still bought it.', type: 'review', app: 'Camera RawX' },
        { text: 'Finally! Someone heard my prayers!', type: 'review', app: 'Camera RawX' },
        { text: 'Works flawlessly. Exactly what it says on the tin.', type: 'review', app: 'Camera RawX' }
    ];

    var FADE_DURATION = 800;   // ms — matches CSS transition
    var DISPLAY_TIME = 3500;   // ms — how long text stays visible
    var container = document.getElementById('hero-container');
    var currentIndex = 0;
    var heroEl = null;

    function createHeroElement(phrase) {
        var el = document.createElement('div');
        el.className = 'hero-text ' + phrase.type;

        if (phrase.type === 'brand') {
            el.innerHTML = '<h1>' + phrase.text + '</h1>';
        } else {
            el.innerHTML =
                '<div class="stars">★★★★★</div>' +
                '<blockquote>\u201c' + phrase.text + '\u201d</blockquote>' +
                '<div class="hero-app-name">\u2014 ' + phrase.app + '</div>';
        }

        return el;
    }

    function showNext() {
        var phrase = phrases[currentIndex];
        var newEl = createHeroElement(phrase);

        container.appendChild(newEl);

        // Force reflow so the transition triggers
        newEl.offsetHeight; // eslint-disable-line no-unused-expressions

        // Fade in
        requestAnimationFrame(function () {
            newEl.classList.add('visible');
        });

        // Store reference for fade-out
        var prevEl = heroEl;
        heroEl = newEl;

        // Fade out the previous element
        if (prevEl) {
            prevEl.classList.remove('visible');
            setTimeout(function () {
                if (prevEl.parentNode) prevEl.parentNode.removeChild(prevEl);
            }, FADE_DURATION);
        }

        // Advance index
        currentIndex = (currentIndex + 1) % phrases.length;
    }

    function startCycle() {
        showNext();
        setInterval(function () {
            showNext();
        }, DISPLAY_TIME + FADE_DURATION);
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startCycle);
    } else {
        startCycle();
    }
})();
