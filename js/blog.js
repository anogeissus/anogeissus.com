(function () {
  const cfg = window.ANOGEISSUS_SUPABASE;
  if (!cfg || cfg.url.includes('YOUR-PROJECT-REF')) {
    console.error('Supabase config missing: js/supabase-config.js');
    return;
  }

  const client = window.supabase.createClient(cfg.url, cfg.anonKey);

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
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function textToHtml(text) {
    const blocks = (text || '').trim().split(/\n\s*\n/g);
    return blocks.map((b) => `<p>${escapeHtml(b).replace(/\n/g, '<br>')}</p>`).join('');
  }

  async function loadBlogList() {
    const container = document.getElementById('blog-list');
    if (!container) return;

    const { data, error } = await client
      .from('blog_posts')
      .select('title, slug, excerpt, cover_image_url, published_at, created_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      container.innerHTML = '<p class="blog-empty">Could not load posts yet.</p>';
      return;
    }

    if (!data || data.length === 0) {
      container.innerHTML = '<p class="blog-empty">No posts yet.</p>';
      return;
    }

    container.innerHTML = data.map((post) => `
      <article class="blog-card">
        ${post.cover_image_url ? `<a href="blog-post.html?slug=${encodeURIComponent(post.slug)}"><img src="${escapeHtml(post.cover_image_url)}" alt="${escapeHtml(post.title)}"></a>` : ''}
        <h2><a href="blog-post.html?slug=${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a></h2>
        <div class="blog-date">${formatDate(post.published_at || post.created_at)}</div>
        <p>${escapeHtml(post.excerpt || '')}</p>
        <a class="blog-readmore" href="blog-post.html?slug=${encodeURIComponent(post.slug)}">Read more →</a>
      </article>
    `).join('');
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

    const { data, error } = await client
      .from('blog_posts')
      .select('title, slug, excerpt, content, cover_image_url, published_at, created_at')
      .eq('status', 'published')
      .eq('slug', slug)
      .single();

    if (error || !data) {
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
  }

  loadBlogList();
  loadBlogPost();
})();
