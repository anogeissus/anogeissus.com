# Blog Setup (Supabase)

## 1) Create table
Run this in Supabase SQL editor:

```sql
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_blog_posts_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_blog_posts_updated_at on public.blog_posts;
create trigger trg_blog_posts_updated_at
before update on public.blog_posts
for each row execute function public.touch_blog_posts_updated_at();
```

## 2) Enable RLS + policies

```sql
alter table public.blog_posts enable row level security;

-- Public can read only published posts
create policy "blog public read published"
on public.blog_posts
for select
to anon, authenticated
using (status = 'published');

-- Authenticated users can do all operations
create policy "blog authenticated manage"
on public.blog_posts
for all
to authenticated
using (true)
with check (true);
```

## 3) Create your admin user
In Supabase Auth → Users:
- Create a user (email/password)
- Use that account to sign in at `/admin-login.html`

## 4) Fill API config
Edit `js/supabase-config.js`:
- `url` = your Supabase project URL
- `anonKey` = your Supabase anon/public key

## 5) Publish
Upload these new files:
- `blog.html`
- `blog-post.html`
- `admin-login.html`
- `admin-blog.html`
- `js/blog.js`
- `js/admin-blog.js`
- `js/supabase-config.js`
- updated `css/style.css`
- updated nav links in existing HTML files

## Security note
`admin-login.html` handles sign-in. `admin-blog.html` requires an active Supabase session and redirects to login if not signed in. Keep RLS enabled. Do not use service-role keys in frontend files.
