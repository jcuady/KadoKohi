import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BlogPost } from '../types/domain';
import { newId } from '../lib/id';
import { blogRepo } from '../lib/supabase/repositories/blog';
import { supabase } from '../lib/supabase/client';

const SEED_BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog_kado_run',
    slug: 'kado-run-community-morning',
    title: 'Kado Run: Coffee, Community & Marikina Mornings',
    excerpt:
      'Our first community run brought neighbors, regulars, and new friends together — espresso after the finish line included.',
    category: 'Community',
    publishedAt: '2026-03-15T00:00:00+08:00',
    readMinutes: 4,
    imageUrl: '/images/hero-interior.png',
    imageAlt: 'Kado Kohi cafe interior after a community morning event',
    body: [
      'Kado Run started as a simple idea: move together, then recover together over matcha and espresso at the corner.',
      'Runners gathered at Sta. Elena before sunrise. We kept the route neighborhood-friendly — flat stretches along familiar Marikina streets so first-timers felt welcome.',
      'At the cafe, baristas poured KADO Latte and Matcha Oat Latte while the team shared pastries from the day’s bake. The energy felt like our tambayan at its best: warm, unhurried, and full of conversation.',
      'More community mornings are coming. Follow @kadocoffeeph for the next Kado Run date and sign-up details.',
    ],
    visible: true,
    sortOrder: 0,
  },
  {
    id: 'blog_tambayan',
    slug: 'tambayan-nights-at-the-corner',
    title: 'Tambayan Nights at the Corner',
    excerpt:
      'Slow evenings, vinyl-adjacent playlists, and the kind of conversations that only happen when the cups stay full.',
    category: 'Events',
    publishedAt: '2026-02-28T00:00:00+08:00',
    readMinutes: 3,
    imageUrl: '/images/hero-coffee.png',
    imageAlt: 'Specialty coffee prepared at Kado Kohi',
    body: [
      'Tambayan nights are our love letter to the neighborhood — no stage, no pressure, just good coffee and people who stay a little longer.',
      'We rotate small activations: latte art throwdowns, guest baristas, and seasonal drink previews for the Kado Circle.',
      'If you have an idea for a community night, reach out through our contact page or say hi in-store on J.P. Laurel.',
    ],
    visible: true,
    sortOrder: 1,
  },
  {
    id: 'blog_booth',
    slug: 'mobile-booth-season-guide',
    title: 'Booking the Kado Mobile Booth This Season',
    excerpt:
      'Weddings, birthdays, and corporate gatherings — what to expect when Kado Kohi rolls up to your event.',
    category: 'Booth',
    publishedAt: '2026-01-10T00:00:00+08:00',
    readMinutes: 5,
    imageUrl: '/booth-photos/booth-1.jpg',
    imageAlt: 'Kado Kohi mobile coffee booth setup at an outdoor event',
    body: [
      'Our mobile booth brings the same quality bar as the cafe — curated menu, branded cups, and a team that knows how to keep lines moving without losing warmth.',
      'Start with the booth booking form so we can estimate guest count, power access, and setup window. We’ll follow up with a quote and menu options.',
      'Peak season fills quickly. Book early for weekends and holiday dates in Metro Manila and Marikina.',
    ],
    visible: true,
    sortOrder: 2,
  },
];

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

export const useBlogStore = create<BlogStore>()(
  persist(
    (set, get) => ({
      posts: SEED_BLOG_POSTS,
      hydrated: false,
      loading: false,
      hydrateError: null,

      hydrateFromRemote: async () => {
        if (!supabase) {
          set({ hydrateError: 'Supabase is not configured.', hydrated: false });
          return;
        }
        set({ loading: true, hydrateError: null });
        try {
          const posts = await blogRepo.fetchAll();
          set({ posts, hydrated: true, loading: false, hydrateError: null });
        } catch (err) {
          set({
            loading: false,
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
        const post = get().posts.find((p) => p.slug === slug);
        return post?.visible ? post : undefined;
      },
    }),
    {
      name: 'kado-blog-v1',
      partialize: (state) => ({ posts: state.posts }),
    },
  ),
);
