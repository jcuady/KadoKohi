import { create } from 'zustand';
import type { BlogPost } from '../types/domain';
import { newId } from '../lib/id';
import { blogRepo } from '../lib/supabase/repositories/blog';
import { supabase } from '../lib/supabase/client';

function formatBlogError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message);
  return 'Blog request failed.';
}

export interface BlogStore {
  posts: BlogPost[];
  hydrated: boolean;
  loading: boolean;
  hydrateError: string | null;
  hydrateFromRemote: () => Promise<void>;
  addPost: (input: Omit<BlogPost, 'id' | 'sortOrder'> & { id?: string; sortOrder?: number }) => Promise<void>;
  updatePost: (id: string, patch: Partial<BlogPost>) => Promise<void>;
  removePost: (id: string) => Promise<void>;
  visiblePosts: () => BlogPost[];
  postBySlug: (slug: string) => BlogPost | undefined;
}

export const useBlogStore = create<BlogStore>()((set, get) => ({
      // Never ship seed posts as live content — admin/DB is source of truth.
      posts: [],
      hydrated: false,
      loading: false,
      hydrateError: null,

      hydrateFromRemote: async () => {
        if (!supabase) {
          set({
            posts: [],
            hydrateError: 'Supabase is not configured.',
            hydrated: true,
            loading: false,
          });
          return;
        }
        set({ loading: true, hydrateError: null });
        try {
          const posts = await blogRepo.fetchAll();
          set({ posts, hydrated: true, loading: false, hydrateError: null });
        } catch (err) {
          set({
            posts: [],
            loading: false,
            hydrated: true,
            hydrateError: formatBlogError(err),
          });
        }
      },

      addPost: async (input) => {
        const post: BlogPost = {
          ...input,
          id: input.id ?? newId(),
          sortOrder: input.sortOrder ?? get().posts.length,
        };
        await blogRepo.upsert(post);
        set({ posts: [...get().posts.filter((p) => p.id !== post.id), post], hydrateError: null });
      },

      updatePost: async (id, patch) => {
        const current = get().posts.find((p) => p.id === id);
        if (!current) throw new Error('Post not found.');
        const updated = { ...current, ...patch };
        await blogRepo.upsert(updated);
        set({
          posts: get().posts.map((p) => (p.id === id ? updated : p)),
          hydrateError: null,
        });
      },

      removePost: async (id) => {
        await blogRepo.remove(id);
        set({
          posts: get().posts.filter((p) => p.id !== id),
          hydrateError: null,
        });
      },

      visiblePosts: () =>
        get()
          .posts.filter((p) => p.visible)
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),

      postBySlug: (slug) => {
        const hit = get().posts.find((p) => p.slug === slug);
        return hit?.visible ? hit : undefined;
      },
    }));
