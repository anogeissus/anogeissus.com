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
  let currentRows = [];

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

  function toDateTimeLocalValue(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function resetForm() {
    editingId = null;
    postForm.reset();
    document.getElementById('status').value = 'draft';
    document.getElementById('published_at').value = '';
    document.getElementById('save-btn').textContent = 'Create Post';
  }

  function sortRows(rows) {
    return [...rows].sort((a, b) => {
      const at = new Date(a.published_at || a.created_at || 0).getTime();
      const bt = new Date(b.published_at || b.created_at || 0).getTime();
      return bt - at;
    });
  }

  async function loadPosts() {
    postsTbody.innerHTML = '<tr><td colspan="7">Loading…</td></tr>';
    try {
      const data = await api('blog_posts?select=id,title,slug,status,published_at,created_at');
      currentRows = sortRows(data || []);
      if (!currentRows.length) {
        postsTbody.innerHTML = '<tr><td colspan="7">No posts yet.</td></tr>';
        return;
      }

      postsTbody.innerHTML = currentRows.map((p, idx) => `
        <tr>
          <td>${p.title}</td>
          <td>${p.slug}</td>
          <td>${p.status}</td>
          <td>${p.published_at ? new Date(p.published_at).toLocaleString() : '-'}</td>
          <td>${p.created_at ? new Date(p.created_at).toLocaleString() : '-'}</td>
          <td>
            <button data-move="up" data-id="${p.id}" ${idx === 0 ? 'disabled' : ''}>↑</button>
            <button data-move="down" data-id="${p.id}" ${idx === currentRows.length - 1 ? 'disabled' : ''}>↓</button>
          </td>
          <td>
            <button data-edit="${p.id}">Edit</button>
            <button data-delete="${p.id}" class="danger">Delete</button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      postsTbody.innerHTML = `<tr><td colspan="7">Could not load posts: ${err.message || String(err)}</td></tr>`;
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
      document.getElementById('published_at').value = toDateTimeLocalValue(data.published_at);
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

      const status = document.getElementById('status').value;
      const publishedInput = document.getElementById('published_at').value;

      const payload = {
        title,
        slug,
        excerpt: document.getElementById('excerpt').value.trim(),
        cover_image_url: document.getElementById('cover_image_url').value.trim() || null,
        content: document.getElementById('content').value,
        status,
        published_at: publishedInput
          ? new Date(publishedInput).toISOString()
          : (status === 'published' ? new Date().toISOString() : null)
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

  async function movePost(id, direction) {
    const idx = currentRows.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const isUp = direction === 'up';
    const neighborIdx = isUp ? idx - 1 : idx + 1;
    if (neighborIdx < 0 || neighborIdx >= currentRows.length) return;

    const target = currentRows[idx];
    const neighbor = currentRows[neighborIdx];
    const neighborTime = new Date(neighbor.published_at || neighbor.created_at || Date.now()).getTime();
    const newTime = isUp ? neighborTime + 1000 : neighborTime - 1000;

    saveMsg.textContent = 'Reordering...';
    await api(`blog_posts?id=eq.${target.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: { published_at: new Date(newTime).toISOString() }
    });
    saveMsg.textContent = 'Order updated.';
    await loadPosts();
  }

  postsTbody.addEventListener('click', async (e) => {
    const editId = e.target.getAttribute('data-edit');
    const delId = e.target.getAttribute('data-delete');
    const moveDir = e.target.getAttribute('data-move');
    const moveId = e.target.getAttribute('data-id');

    if (editId) await loadPostById(editId);
    if (delId) await deletePost(delId);
    if (moveDir && moveId) {
      try {
        await movePost(moveId, moveDir);
      } catch (err) {
        saveMsg.textContent = 'Reorder failed: ' + (err.message || String(err));
      }
    }
  });

  ensureAuthUI();
})();
