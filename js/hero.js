document.addEventListener('DOMContentLoaded', function () {
    const phrases = [
        { text: 'Professional photo tools for Mac.', type: 'brand' },
        { text: 'Built by photographers, for photographers.', type: 'brand' },
        { text: 'Blazing-fast RAW viewing. Instant.', type: 'brand' },
        { text: 'Instantaneous response. No blackouts. No low-res rendering.', type: 'review', app: 'ApolloOne' },
        { text: 'This app made me realize how much I hate catalog-based apps.', type: 'review', app: 'ApolloOne' },
        { text: 'Money well spent.', type: 'review', app: 'ApolloOne' },
        { text: 'I emailed about a problem — new release within days.', type: 'review', app: 'ApolloOne' },
        { text: 'Works perfect — even with a clicker for projector slideshows.', type: 'review', app: 'ApolloOne' },
        { text: 'A steal even at twice the price.', type: 'review', app: 'Camera RawX' },
        { text: 'If this had been £100 I would have still bought it.', type: 'review', app: 'Camera RawX' },
        { text: 'Finally! Someone heard my prayers!', type: 'review', app: 'Camera RawX' },
        { text: 'Works flawlessly. Exactly what it says on the tin.', type: 'review', app: 'Camera RawX' },
    ];

    const container = document.querySelector('.hero-container');
    let currentIndex = 0;

    // Create all text elements
    const elements = phrases.map(function (phrase) {
        var el = document.createElement('div');
        el.className = 'hero-text ' + phrase.type;

        if (phrase.type === 'review') {
            var appName = document.createElement('div');
            appName.className = 'hero-app-name';
            appName.textContent = phrase.app;
            el.appendChild(appName);

            var stars = document.createElement('div');
            stars.className = 'hero-stars';
            stars.textContent = '★★★★★';
            el.appendChild(stars);
        }

        var text = document.createElement('div');
        text.textContent = phrase.text;
        el.appendChild(text);

        container.appendChild(el);
        return el;
    });

    // Show first phrase
    elements[0].classList.add('visible');

    // Cycle through phrases
    setInterval(function () {
        elements[currentIndex].classList.remove('visible');
        currentIndex = (currentIndex + 1) % elements.length;
        // Small delay so fade-out starts before fade-in
        setTimeout(function () {
            elements[currentIndex].classList.add('visible');
        }, 800);
    }, 4000);
});
