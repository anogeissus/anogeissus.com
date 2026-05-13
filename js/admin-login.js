(function () {
  const cfg = window.ANOGEISSUS_SUPABASE;
  if (!cfg || !cfg.url || !cfg.anonKey || cfg.url.includes('YOUR-PROJECT-REF')) {
    return;
  }

  const form = document.getElementById('login-form');
  const msg = document.getElementById('auth-msg');

  const params = new URLSearchParams(window.location.search);
  const next = sanitizeNext(params.get('next'));

  function sanitizeNext(candidate) {
    if (!candidate || typeof candidate !== 'string') return '/admin-panel.html';
    if (!candidate.startsWith('/')) return '/admin-panel.html';
    if (candidate.startsWith('//')) return '/admin-panel.html';

    const lower = candidate.toLowerCase();
    if (lower.startsWith('/javascript:') || lower.startsWith('/data:')) return '/admin-panel.html';

    return candidate;
  }

  function saveSession(session) {
    localStorage.setItem('anogeissus_blog_session', JSON.stringify(session));
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem('anogeissus_blog_session') || 'null');
    } catch {
      return null;
    }
  }

  async function checkSession() {
    const s = getSession();
    if (!s || !s.access_token) return;

    try {
      const res = await fetch(cfg.url + '/auth/v1/user', {
        headers: {
          apikey: cfg.anonKey,
          Authorization: 'Bearer ' + s.access_token
        }
      });
      if (res.ok) {
        window.location.href = next;
      }
    } catch (_) {}
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = 'Signing in...';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(cfg.url + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: {
          apikey: cfg.anonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        msg.textContent = data.error_description || data.msg || data.error || 'Sign in failed';
        return;
      }

      saveSession(data);
      window.location.href = next;
    } catch (err) {
      msg.textContent = err.message || String(err);
    }
  });

  checkSession();
})();
