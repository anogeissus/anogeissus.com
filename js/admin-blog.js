(function () {
  const cfg = window.ANOGEISSUS_SUPABASE;
  if (!cfg || !cfg.url || !cfg.anonKey || cfg.url.includes('YOUR-PROJECT-REF')) {
    return;
  }

  const appCard = document.getElementById('app-card');
  const saveMsg = document.getElementById('save-msg');
  const postsTbody = document.getElementById('posts-tbody');
  const postForm = document.getElementById('post-form');
  const signOutBtn = document.getElementById('signout-btn');

  let editingId = null;

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem('anogeissus_blog_session') || 'null');
    } catch {
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem('anogeissus_blog_session');
  }

  async function api(pathAndQuery, options = {}) {
    const session = getSession();
    if (!session || !session.access_token) {
      window.location.href = '/admin-login.html?next=' + encodeURIComponent('/admin-panel.html');
      throw new Error('Not authenticated');
    }

    const res = await fetch(`${cfg.url}/rest/v1/${pathAndQuery}`, {
      method: options.method || 'GET',
      headers: {
        apikey: cfg.anonKey,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) {}

    if (!res.ok) {
      const msg = (data && (data.message || data.error_description || data.error || data.msg)) || `HTTP ${res.status}`;
      throw new Error(msg);
    }

    return data;
  }

  function show(el, visible) {
    if (el) el.style.display = visible ? '' : 'none';
  }

  function slugify(value) {
    return (value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function resetForm() {
    editingId = null;
    postForm.reset();
    document.getElementById('status').value = 'draft';
    document.getElementById('published_at').value = '';
    document.getElementById('save-btn').textContent = 'Create Post';
  }

  async function loadPosts() {
    postsTbody.innerHTML = '<tr><td colspan="5">Loading…</td></tr>';
    try {
      const data = await api('blog_posts?select=id,title,slug,status,published_at,created_at&order=created_at.desc');
      if (!data || data.length === 0) {
        postsTbody.innerHTML = '<tr><td colspan="5">No posts yet.</td></tr>';
        return;
      }

      postsTbody.innerHTML = data.map((p) => `
        <tr>
          <td>${p.title}</td>
          <td>${p.slug}</td>
          <td>${p.status}</td>
          <td>${p.published_at ? new Date(p.published_at).toLocaleDateString() : '-'}</td>
          <td>
            <button data-edit="${p.id}">Edit</button>
            <button data-delete="${p.id}" class="danger">Delete</button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      postsTbody.innerHTML = `<tr><td colspan="5">Could not load posts: ${err.message || String(err)}</td></tr>`;
    }
  }

  async function loadPostById(id) {
    try {
      const rows = await api(`blog_posts?select=*&id=eq.${id}&limit=1`);
      const data = rows && rows[0];
      if (!data) return;

      editingId = id;
      document.getElementById('title').value = data.title || '';
      document.getElementById('slug').value = data.slug || '';
      document.getElementById('excerpt').value = data.excerpt || '';
      document.getElementById('cover_image_url').value = data.cover_image_url || '';
      document.getElementById('content').value = data.content || '';
      document.getElementById('status').value = data.status || 'draft';
      document.getElementById('published_at').value = data.published_at ? data.published_at.substring(0, 16) : '';
      document.getElementById('save-btn').textContent = 'Update Post';
      saveMsg.textContent = `Editing: ${data.title}`;
    } catch (err) {
      saveMsg.textContent = 'Load failed: ' + (err.message || String(err));
    }
  }

  async function deletePost(id) {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api(`blog_posts?id=eq.${id}`, { method: 'DELETE' });
      saveMsg.textContent = 'Post deleted.';
      if (editingId === id) resetForm();
      await loadPosts();
    } catch (err) {
      saveMsg.textContent = err.message || String(err);
    }
  }

  async function ensureAuthUI() {
    const session = getSession();
    if (!session || !session.access_token) {
      window.location.href = '/admin-login.html?next=' + encodeURIComponent('/admin-panel.html');
      return;
    }

    show(appCard, true);
    await loadPosts();
  }

  signOutBtn.addEventListener('click', () => {
    clearSession();
    window.location.href = '/admin-login.html?next=' + encodeURIComponent('/admin-panel.html');
  });

  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      const title = document.getElementById('title').value.trim();
      const slugInput = document.getElementById('slug').value.trim();
      const slug = slugify(slugInput || title);

      if (!slug) {
        saveMsg.textContent = 'Slug is empty. Use English letters/numbers in title or fill slug manually.';
        return;
      }

      const payload = {
        title,
        slug,
        excerpt: document.getElementById('excerpt').value.trim(),
        cover_image_url: document.getElementById('cover_image_url').value.trim() || null,
        content: document.getElementById('content').value,
        status: document.getElementById('status').value,
        published_at: document.getElementById('published_at').value ? new Date(document.getElementById('published_at').value).toISOString() : null
      };

      saveMsg.textContent = editingId ? 'Updating...' : 'Creating...';

      if (editingId) {
        await api(`blog_posts?id=eq.${editingId}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: payload
        });
      } else {
        await api('blog_posts', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: payload
        });
      }

      saveMsg.textContent = editingId ? 'Post updated.' : 'Post created.';
      resetForm();
      await loadPosts();
    } catch (err) {
      saveMsg.textContent = 'Create failed: ' + (err.message || String(err));
    }
  });

  document.getElementById('title').addEventListener('input', () => {
    const slugEl = document.getElementById('slug');
    if (!slugEl.value.trim()) {
      slugEl.value = slugify(document.getElementById('title').value);
    }
  });

  document.getElementById('new-btn').addEventListener('click', () => {
    resetForm();
    saveMsg.textContent = '';
  });

  postsTbody.addEventListener('click', async (e) => {
    const editId = e.target.getAttribute('data-edit');
    const delId = e.target.getAttribute('data-delete');

    if (editId) await loadPostById(editId);
    if (delId) await deletePost(delId);
  });

  ensureAuthUI();
})();
