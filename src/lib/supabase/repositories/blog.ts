import type { BlogPost } from '../../../types/domain';
import { supabase } from '../client';

const BLOG_IMAGE_BUCKET = 'kado-blog-images';

function parseBlogBody(row: { body?: unknown }): string[] {
  if (Array.isArray(row.body)) {
    return row.body.map((p) => String(p)).filter(Boolean);
  }
  return [];
}

function mapBlogPost(row: Record<string, unknown>): BlogPost {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: String(row.excerpt ?? ''),
    category: String(row.category ?? ''),
    publishedAt: String(row.published_at),
    readMinutes: Number(row.read_minutes ?? 3),
    imageUrl: String(row.image_url ?? ''),
    imageAlt: String(row.image_alt ?? ''),
    body: parseBlogBody(row),
    visible: Boolean(row.visible),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function rowFromPost(post: BlogPost) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? '',
    category: post.category ?? '',
    published_at: new Date(post.publishedAt).toISOString(),
    read_minutes: post.readMinutes,
    image_url: post.imageUrl?.trim() || null,
    image_alt: post.imageAlt ?? '',
    body: post.body ?? [],
    visible: post.visible,
    sort_order: post.sortOrder,
  };
}

export const blogRepo = {
  async fetchAll(): Promise<BlogPost[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('kk_blog_posts')
      .select('*')
      .order('published_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => mapBlogPost(row as Record<string, unknown>));
  },

  async upsert(post: BlogPost): Promise<void> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.from('kk_blog_posts').upsert(rowFromPost(post));
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.from('kk_blog_posts').delete().eq('id', id);
    if (error) throw error;
  },

  /** Upload cover image to public storage; returns HTTPS URL for kk_blog_posts.image_url. */
  async uploadCoverImage(file: File, postId: string): Promise<string> {
    if (!supabase) throw new Error('Supabase is not configured.');
    if (!postId.trim()) throw new Error('Post id is required before uploading a cover image.');
    if (!file.type.startsWith('image/')) {
      throw new Error('Please choose an image file (PNG, JPG, WebP, etc.).');
    }
    if (file.size > 5_242_880) {
      throw new Error('Cover image must be 5 MB or smaller.');
    }
    const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'heic', 'heif'].includes(ext) ? ext : 'jpg';
    const path = `covers/${postId}.${safeExt}`;
    const { error } = await supabase.storage.from(BLOG_IMAGE_BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
      cacheControl: '3600',
    });
    if (error) throw error;
    const { data } = supabase.storage.from(BLOG_IMAGE_BUCKET).getPublicUrl(path);
    if (!data.publicUrl) throw new Error('Could not get public URL for blog cover image.');
    return data.publicUrl;
  },
};
