import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock } from 'lucide-react';
import { useBlogStore } from '../store/blogStore';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const hydrateFromRemote = useBlogStore((s) => s.hydrateFromRemote);
  const post = useBlogStore((s) => {
    if (!slug) return undefined;
    const hit = s.posts.find((p) => p.slug === slug);
    return hit?.visible ? hit : undefined;
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void hydrateFromRemote().finally(() => setReady(true));
  }, [hydrateFromRemote, slug]);

  if (!slug) return <Navigate to="/features" replace />;
  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-kado-offwhite">
        <p className="kado-body text-kado-dark/50">Loading story…</p>
      </div>
    );
  }
  if (!post) return <Navigate to="/features" replace />;

  return (
    <article className="flex min-h-screen w-full flex-col bg-kado-offwhite font-sans">
      <section className="relative border-b border-kado-dark/5 bg-kado-cream">
        <div className="mx-auto max-w-3xl px-6 pb-12 pt-28">
          <Link
            to="/features"
            className="mb-6 inline-flex items-center gap-2 kado-label text-kado-red transition-colors hover:text-kado-red-hover"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All features
          </Link>
          <span className="mb-3 inline-block rounded-full bg-kado-red px-3 py-1 kado-label text-white">
            {post.category}
          </span>
          <h1 className="kado-h2 text-kado-dark">{post.title}</h1>
          <div className="mt-4 flex flex-wrap gap-4 kado-body-sm text-kado-dark/55">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-kado-red" aria-hidden />
              {formatDate(post.publishedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-kado-red" aria-hidden />
              {post.readMinutes} min read
            </span>
          </div>
        </div>
        {post.imageUrl ? (
          <div className="mx-auto max-w-5xl px-6 pb-0">
            <img
              src={post.imageUrl}
              alt={post.imageAlt}
              className="aspect-[21/9] w-full rounded-t-[1.5rem] object-cover shadow-lg"
            />
          </div>
        ) : null}
      </section>

      <section className="px-6 py-12 md:py-16">
        <div className="mx-auto max-w-3xl rounded-b-[1.5rem] border border-t-0 border-kado-dark/10 bg-white px-6 py-10 sm:px-10 shadow-sm">
          <div className="space-y-5">
            {post.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="kado-body text-kado-dark/75">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3 border-t border-kado-dark/8 pt-8">
            <Link
              to="/events"
              className="inline-flex min-h-[44px] items-center rounded-full bg-kado-red px-6 kado-label text-white transition-colors hover:bg-kado-red-hover"
            >
              See Kado Events
            </Link>
            <Link
              to="/contact"
              className="inline-flex min-h-[44px] items-center rounded-full border border-kado-dark/15 bg-kado-cream px-6 kado-label text-kado-red transition-colors hover:bg-kado-offwhite"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>

      <PageSeoBlurb />
    </article>
  );
}
