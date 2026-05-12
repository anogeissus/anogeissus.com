(function () {
  const cfg = window.ANOGEISSUS_SUPABASE;

  function setListMessage(msg) {
    const container = document.getElementById('blog-list');
    if (container) container.innerHTML = `<p class="blog-empty">${msg}</p>`;
  }

  function setPostMessage(msg) {
    const root = document.getElementById('blog-post');
    if (root) root.innerHTML = `<p class="blog-empty">${msg}</p>`;
  }

  if (!cfg || !cfg.url || !cfg.anonKey || cfg.url.includes('YOUR-PROJECT-REF')) {
    setListMessage('Blog config is not ready yet.');
    setPostMessage('Blog config is not ready yet.');
    return;
  }

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(value) {
    if (!value) return '';
    const d = new Date(value);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function textToHtml(text) {
    const raw = (text || '').trim();
    if (!raw) return '';

    // If HTML tags are present, treat as trusted HTML authored by admin.
    if (/<\s*\/?\s*[a-z][^>]*>/i.test(raw)) {
      return raw;
    }

    const blocks = raw.split(/\n\s*\n/g);
    return blocks.map((b) => `<p>${escapeHtml(b).replace(/\n/g, '<br>')}</p>`).join('');
  }

  function renderExpandedContent(post) {
    const excerpt = post.excerpt ? `<p class="blog-post-excerpt">${escapeHtml(post.excerpt)}</p>` : '';
    const content = post.content ? `<div class="blog-post-content">${textToHtml(post.content)}</div>` : '';
    return `${excerpt}${content}`;
  }

  async function api(pathAndQuery) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(`${cfg.url}/rest/v1/${pathAndQuery}`, {
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`
        },
        signal: controller.signal
      });

      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch (_) {}

      if (!res.ok) {
        const msg = (json && (json.message || json.error_description || json.error)) || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      return json;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function loadBlogList() {
    const container = document.getElementById('blog-list');
    if (!container) return;

    try {
      const data = await api(
        "blog_posts?select=title,slug,excerpt,content,cover_image_url,published_at,created_at&status=eq.published&order=published_at.desc.nullslast,created_at.desc"
      );

      if (!data || data.length === 0) {
        container.innerHTML = '<p class="blog-empty">No posts yet.</p>';
        return;
      }

      container.innerHTML = data.map((post, idx) => `
        <article class="blog-card" id="blog-card-${idx}">
          ${post.cover_image_url ? `<img src="${escapeHtml(post.cover_image_url)}" alt="${escapeHtml(post.title)}">` : ''}
          <h2>${escapeHtml(post.title)}</h2>
          <div class="blog-date">${formatDate(post.published_at || post.created_at)}</div>
          <div class="blog-collapsed">${post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : ''}</div>
          <div class="blog-expanded" style="display:none;">${renderExpandedContent(post)}</div>
          <a class="blog-readmore" href="#" data-action="expand">Read more →</a>
          <a class="blog-readmore" href="#" data-action="collapse" style="display:none;">Collapse ↑</a>
        </article>
      `).join('');

      container.querySelectorAll('.blog-card').forEach((card) => {
        const expand = card.querySelector('[data-action="expand"]');
        const collapse = card.querySelector('[data-action="collapse"]');
        const collapsed = card.querySelector('.blog-collapsed');
        const expanded = card.querySelector('.blog-expanded');

        expand.addEventListener('click', (e) => {
          e.preventDefault();
          collapsed.style.display = 'none';
          expanded.style.display = '';
          expand.style.display = 'none';
          collapse.style.display = '';
        });

        collapse.addEventListener('click', (e) => {
          e.preventDefault();
          collapsed.style.display = '';
          expanded.style.display = 'none';
          expand.style.display = '';
          collapse.style.display = 'none';
        });
      });
    } catch (err) {
      container.innerHTML = `<p class="blog-empty">Could not load posts: ${escapeHtml(err.message || String(err))}</p>`;
    }
  }

  async function loadBlogPost() {
    const root = document.getElementById('blog-post');
    if (!root) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
      root.innerHTML = '<p class="blog-empty">Missing blog slug.</p>';
      return;
    }

    try {
      const rows = await api(
        `blog_posts?select=title,slug,excerpt,content,cover_image_url,published_at,created_at&status=eq.published&slug=eq.${encodeURIComponent(slug)}&limit=1`
      );

      const data = rows && rows[0];
      if (!data) {
        root.innerHTML = '<p class="blog-empty">Post not found.</p>';
        return;
      }

      document.title = `${data.title} | Anogeissus Blog`;

      root.innerHTML = `
        <article class="blog-post-article">
          <h1>${escapeHtml(data.title)}</h1>
          <div class="blog-date">${formatDate(data.published_at || data.created_at)}</div>
          ${data.cover_image_url ? `<img class="blog-post-cover" src="${escapeHtml(data.cover_image_url)}" alt="${escapeHtml(data.title)}">` : ''}
          ${data.excerpt ? `<p class="blog-post-excerpt">${escapeHtml(data.excerpt)}</p>` : ''}
          <div class="blog-post-content">${textToHtml(data.content)}</div>
        </article>
      `;
    } catch (err) {
      root.innerHTML = `<p class="blog-empty">Could not load post: ${escapeHtml(err.message || String(err))}</p>`;
    }
  }

  loadBlogList();
  loadBlogPost();
})();
