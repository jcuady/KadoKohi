import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Clock } from 'lucide-react';
import { useBlogStore } from '../store/blogStore';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Blog() {
  const hydrateFromRemote = useBlogStore((s) => s.hydrateFromRemote);
  const posts = useBlogStore((s) => s.visiblePosts());

  useEffect(() => {
    void hydrateFromRemote();
  }, [hydrateFromRemote]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-kado-offwhite font-sans">
      <section className="border-b border-kado-dark/5 bg-kado-cream px-6 pb-12 pt-28">
        <div className="mx-auto max-w-5xl text-center">
          <p className="kado-label mb-3 text-kado-red">Stories from the corner</p>
          <h1 className="kado-h2 text-kado-dark uppercase tracking-tight">Kado Kohi Blogs</h1>
          <p className="mx-auto mt-4 max-w-xl kado-body text-kado-dark/65">
            Community runs, tambayan nights, booth season notes, and what&apos;s brewing at our Marikina cafe.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 md:py-24">
        {posts.length === 0 ? (
          <p className="mx-auto max-w-md text-center kado-body text-kado-dark/55">
            New stories are on the way. Check back soon.
          </p>
        ) : (
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group flex flex-col overflow-hidden rounded-[1.25rem] border border-kado-dark/10 bg-white shadow-[0_12px_32px_rgba(25,25,25,0.06)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(158,24,29,0.1)]"
              >
                <Link to={`/blog/${post.slug}`} className="relative block aspect-[4/3] overflow-hidden">
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt={post.imageAlt}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-kado-cream" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-kado-dark/70 via-kado-dark/10 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-kado-cream px-3 py-1 kado-label text-kado-red">
                    {post.category}
                  </span>
                </Link>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-3 kado-subtext font-semibold uppercase tracking-wider text-kado-dark/45">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                      {formatDate(post.publishedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {post.readMinutes} min read
                    </span>
                  </div>
                  <h2 className="kado-h3 text-kado-dark group-hover:text-kado-red transition-colors">
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="mt-2 flex-1 kado-body-sm text-kado-dark/65">{post.excerpt}</p>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="mt-4 inline-flex items-center gap-1.5 kado-label text-kado-red transition-colors hover:text-kado-red-hover"
                  >
                    Read story
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <PageSeoBlurb />
    </div>
  );
}
