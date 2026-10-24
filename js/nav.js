// Touch screens (iPhone, iPad): the menu bar slides away while the page is read downward and
// comes back on the first scroll up. It always shows at the top of the page and while the menu is open.
(function () {
    var nav = document.querySelector('nav');
    var navLinks = document.getElementById('nav-links');
    if (!nav || !navLinks || !window.matchMedia('(hover: none)').matches) return;

    var lastY = window.scrollY;
    var pending = false;

    function update() {
        pending = false;
        // Clamped, so the bounce past either end of the page does not count as scrolling
        var maxY = document.documentElement.scrollHeight - window.innerHeight;
        var y = Math.max(0, Math.min(window.scrollY, maxY));
        if (y <= nav.offsetHeight || navLinks.classList.contains('open')) {
            nav.classList.remove('nav-hidden');
            lastY = y;
        } else if (Math.abs(y - lastY) >= 8) {
            nav.classList.toggle('nav-hidden', y > lastY);
            lastY = y;
        }
    }

    window.addEventListener('scroll', function () {
        if (!pending) {
            pending = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });

    // Tabbing into the bar from a keyboard brings it back
    nav.addEventListener('focusin', function () {
        nav.classList.remove('nav-hidden');
    });
})();
