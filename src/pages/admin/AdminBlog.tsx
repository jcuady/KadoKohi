import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { BlogPost } from '../../types/domain';
import { useBlogStore } from '../../store/blogStore';
import { readImageDataUrl } from '../../lib/readImageDataUrl';
import { slugify } from '../../lib/slugify';
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';

type BlogFormData = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readMinutes: string;
  imageUrl: string;
  imageAlt: string;
  bodyText: string;
  visible: boolean;
};

const emptyForm: BlogFormData = {
  title: '',
  slug: '',
  excerpt: '',
  category: 'Community',
  publishedAt: new Date().toISOString().slice(0, 10),
  readMinutes: '4',
  imageUrl: '',
  imageAlt: '',
  bodyText: '',
  visible: true,
};

function toDateInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function bodyToText(body: string[]): string {
  return body.join('\n\n');
}

function textToBody(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function formatListDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AdminBlog() {
  const posts = useBlogStore((s) => s.posts);
  const hydrateFromRemote = useBlogStore((s) => s.hydrateFromRemote);
  const addPost = useBlogStore((s) => s.addPost);
  const updatePost = useBlogStore((s) => s.updatePost);
  const removePost = useBlogStore((s) => s.removePost);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BlogFormData>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [imageError, setImageError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void hydrateFromRemote();
  }, [hydrateFromRemote]);

  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    [posts],
  );

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSlugTouched(false);
    setImageError('');
    setSaveError('');
    setShowForm(true);
  };

  const startEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      category: post.category,
      publishedAt: toDateInput(post.publishedAt),
      readMinutes: String(post.readMinutes),
      imageUrl: post.imageUrl,
      imageAlt: post.imageAlt,
      bodyText: bodyToText(post.body),
      visible: post.visible,
    });
    setSlugTouched(true);
    setImageError('');
    setSaveError('');
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSaveError('');
  };

  const onTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: slugTouched ? f.slug : slugify(title),
    }));
  };

  const onImagePick = async (file: File | null) => {
    if (!file) return;
    setImageError('');
    try {
      const dataUrl = await readImageDataUrl(file);
      setForm((f) => ({ ...f, imageUrl: dataUrl }));
    } catch {
      setImageError('Could not read image. Try a smaller JPG or PNG.');
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaveError('');

    const title = form.title.trim();
    const slug = form.slug.trim();
    if (!title || !slug) {
      setSaveError('Title and URL slug are required.');
      return;
    }

    const duplicateSlug = posts.some((p) => p.slug === slug && p.id !== editingId);
    if (duplicateSlug) {
      setSaveError('Another post already uses this slug.');
      return;
    }

    const readMinutes = Math.max(1, Number.parseInt(form.readMinutes, 10) || 3);
    const body = textToBody(form.bodyText);
    if (!body.length) {
      setSaveError('Add at least one paragraph (separate paragraphs with a blank line).');
      return;
    }

    const payload = {
      slug,
      title,
      excerpt: form.excerpt.trim(),
      category: form.category.trim() || 'General',
      publishedAt: new Date(`${form.publishedAt}T12:00:00`).toISOString(),
      readMinutes,
      imageUrl: form.imageUrl.trim(),
      imageAlt: form.imageAlt.trim() || title,
      body,
      visible: form.visible,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updatePost(editingId, payload);
      } else {
        await addPost(payload);
      }
      cancelForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save post.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    setSaveError('');
    try {
      await removePost(post.id);
      if (editingId === post.id) cancelForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not delete post.';
      setSaveError(msg);
    }
  };

  return (
    <div className="dash-page space-y-8 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="dash-muted text-xs font-bold uppercase tracking-[0.2em] mb-1">CMS</p>
          <h1 className="dash-heading font-display text-2xl font-bold">Blog</h1>
          <p className="dash-muted mt-1 text-sm max-w-xl">
            Create and manage stories for the public <code className="text-xs">/blog</code> page. Drafts stay hidden when visibility is off.
          </p>
        </div>
        <button
          type="button"
          onClick={startAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-kado-red px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-kado-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          New post
        </button>
      </div>

      {saveError && !showForm ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{saveError}</p>
      ) : null}

      {showForm ? (
        <form
          onSubmit={submit}
          className="dash-card rounded-2xl border p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="dash-heading font-display text-lg font-bold">
              {editingId ? 'Edit post' : 'New post'}
            </h2>
            <button type="button" onClick={cancelForm} className="dash-muted text-sm hover:text-kado-red">
              Cancel
            </button>
          </div>

          {saveError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{saveError}</p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="dash-muted text-xs font-bold uppercase tracking-wider">Title</span>
              <input
                required
                value={form.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="dash-input w-full rounded-xl border px-4 py-2.5 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="dash-muted text-xs font-bold uppercase tracking-wider">URL slug</span>
              <input
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
                }}
                className="dash-input w-full rounded-xl border px-4 py-2.5 text-sm font-mono"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="dash-muted text-xs font-bold uppercase tracking-wider">Excerpt</span>
            <textarea
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              className="dash-input w-full rounded-xl border px-4 py-2.5 text-sm resize-none"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block space-y-1.5">
              <span className="dash-muted text-xs font-bold uppercase tracking-wider">Category</span>
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="dash-input w-full rounded-xl border px-4 py-2.5 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="dash-muted text-xs font-bold uppercase tracking-wider">Publish date</span>
              <input
                type="date"
                value={form.publishedAt}
                onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
                className="dash-input w-full rounded-xl border px-4 py-2.5 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="dash-muted text-xs font-bold uppercase tracking-wider">Read time (min)</span>
              <input
                type="number"
                min={1}
                value={form.readMinutes}
                onChange={(e) => setForm((f) => ({ ...f, readMinutes: e.target.value }))}
                className="dash-input w-full rounded-xl border px-4 py-2.5 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="dash-muted text-xs font-bold uppercase tracking-wider">Cover image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => void onImagePick(e.target.files?.[0] ?? null)}
                className="dash-input w-full rounded-xl border px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-kado-cream file:px-3 file:py-1.5 file:text-xs file:font-bold"
              />
              {imageError ? <p className="text-xs text-red-600">{imageError}</p> : null}
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="" className="mt-2 h-28 w-full rounded-xl object-cover border dash-border" />
              ) : null}
            </label>
            <label className="block space-y-1.5">
              <span className="dash-muted text-xs font-bold uppercase tracking-wider">Image alt text</span>
              <input
                value={form.imageAlt}
                onChange={(e) => setForm((f) => ({ ...f, imageAlt: e.target.value }))}
                className="dash-input w-full rounded-xl border px-4 py-2.5 text-sm"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="dash-muted text-xs font-bold uppercase tracking-wider">Body</span>
            <span className="block text-[11px] dash-muted">Separate paragraphs with a blank line.</span>
            <textarea
              rows={10}
              value={form.bodyText}
              onChange={(e) => setForm((f) => ({ ...f, bodyText: e.target.value }))}
              className="dash-input w-full rounded-xl border px-4 py-3 text-sm leading-relaxed"
            />
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.visible}
              onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))}
              className="rounded border-kado-dark/20"
            />
            <span className="text-sm font-medium dash-heading">Visible on public blog</span>
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-kado-dark px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-kado-red disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish post'}
            </button>
            {editingId && form.visible ? (
              <a
                href={`/blog/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border dash-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted hover:text-kado-red"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View live
              </a>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        {sortedPosts.length === 0 ? (
          <p className="dash-muted text-sm">No posts yet. Create your first story.</p>
        ) : (
          sortedPosts.map((post) => (
            <article
              key={post.id}
              className="dash-card flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 gap-4">
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="h-16 w-20 shrink-0 rounded-lg object-cover border dash-border"
                  />
                ) : (
                  <div className="h-16 w-20 shrink-0 rounded-lg bg-kado-cream/40 border dash-border" />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-kado-red">{post.category}</span>
                    {post.visible ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        <Eye className="h-3 w-3" /> Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider dash-muted">
                        <EyeOff className="h-3 w-3" /> Hidden
                      </span>
                    )}
                  </div>
                  <h3 className="dash-heading font-semibold truncate">{post.title}</h3>
                  <p className="dash-muted text-xs mt-0.5">
                    {formatListDate(post.publishedAt)} · /blog/{post.slug}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(post)}
                  className="inline-flex items-center gap-1.5 rounded-lg border dash-border px-3 py-2 text-xs font-bold uppercase tracking-wider dash-muted hover:text-kado-red"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(post)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
