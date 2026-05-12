(function () {
  const cfg = window.ANOGEISSUS_SUPABASE;
  if (!cfg || cfg.url.includes('YOUR-PROJECT-REF')) {
    console.error('Supabase config missing: js/supabase-config.js');
    return;
  }

  const client = window.supabase.createClient(cfg.url, cfg.anonKey);
  const form = document.getElementById('login-form');
  const msg = document.getElementById('auth-msg');

  const params = new URLSearchParams(window.location.search);
  const next = params.get('next') || '/admin-blog.html';

  async function redirectIfLoggedIn() {
    const { data } = await client.auth.getSession();
    if (data.session) window.location.href = next;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = 'Signing in...';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      msg.textContent = error.message;
      return;
    }

    window.location.href = next;
  });

  client.auth.onAuthStateChange((_event, session) => {
    if (session) window.location.href = next;
  });

  redirectIfLoggedIn();
})();
