(function () {
  const cfg = window.ANOGEISSUS_SUPABASE;
  if (!cfg || cfg.url.includes('YOUR-PROJECT-REF')) {
    console.error('Supabase config missing: js/supabase-config.js');
    return;
  }

  const client = window.supabase.createClient(cfg.url, cfg.anonKey);

  const appCard = document.getElementById('app-card');
  const saveMsg = document.getElementById('save-msg');
  const postsTbody = document.getElementById('posts-tbody');
  const postForm = document.getElementById('post-form');
  const signOutBtn = document.getElementById('signout-btn');

  let editingId = null;

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
    const { data, error } = await client
      .from('blog_posts')
      .select('id, title, slug, status, published_at, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      postsTbody.innerHTML = '<tr><td colspan="5">Could not load posts.</td></tr>';
      return;
    }

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
  }

  async function loadPostById(id) {
    const { data, error } = await client
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return;

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
  }

  async function deletePost(id) {
    if (!window.confirm('Delete this post?')) return;

    const { error } = await client.from('blog_posts').delete().eq('id', id);
    if (error) {
      saveMsg.textContent = error.message;
      return;
    }

    saveMsg.textContent = 'Post deleted.';
    if (editingId === id) resetForm();
    await loadPosts();
  }

  async function ensureAuthUI() {
    const { data: sessionData } = await client.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      window.location.href = '/admin-login.html?next=' + encodeURIComponent('/admin-blog.html');
      return;
    }

    show(appCard, true);
    await loadPosts();
  }

  signOutBtn.addEventListener('click', async () => {
    await client.auth.signOut();
    resetForm();
    await ensureAuthUI();
  });

  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const slugInput = document.getElementById('slug').value.trim();
    const slug = slugify(slugInput || title);

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

    let result;
    if (editingId) {
      result = await client.from('blog_posts').update(payload).eq('id', editingId);
    } else {
      result = await client.from('blog_posts').insert(payload);
    }

    if (result.error) {
      saveMsg.textContent = result.error.message;
      return;
    }

    saveMsg.textContent = editingId ? 'Post updated.' : 'Post created.';
    resetForm();
    await loadPosts();
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

  client.auth.onAuthStateChange(async (event) => {
    if (event === 'SIGNED_OUT') {
      window.location.href = '/admin-login.html?next=' + encodeURIComponent('/admin-blog.html');
      return;
    }
    await ensureAuthUI();
  });

  ensureAuthUI();
})();
