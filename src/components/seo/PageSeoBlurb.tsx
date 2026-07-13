import { Link, useLocation } from 'react-router-dom';
import { SEO_SOCIAL, getPageSeoBlurb } from '../../content/seo';

/** Crawlable local SEO copy at the bottom of public pages. */
export default function PageSeoBlurb() {
  const { pathname } = useLocation();
  const blurb = getPageSeoBlurb(pathname);
  if (!blurb) return null;

  return (
    <aside
      aria-label="About Kado Coffee in Marikina"
      className="border-t border-kado-dark/8 bg-kado-offwhite px-4 py-10 sm:px-6 md:px-12 lg:px-24"
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display text-lg sm:text-xl font-bold text-kado-dark mb-3">{blurb.heading}</h2>
        {blurb.paragraphs.map((p) => (
          <p key={p.slice(0, 48)} className="text-sm text-kado-dark/65 leading-relaxed font-medium mb-3 last:mb-0">
            {p}
          </p>
        ))}
        {blurb.links && blurb.links.length > 0 ? (
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-kado-dark/45 flex flex-wrap gap-x-4 gap-y-2">
            {blurb.links.map(({ to, label, external, href }) =>
              external && href ? (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-kado-red hover:underline"
                >
                  {label}
                </a>
              ) : (
                <Link key={to} to={to!} className="text-kado-red hover:underline">
                  {label}
                </Link>
              ),
            )}
          </p>
        ) : null}
        <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-kado-dark/40">
          <a href={SEO_SOCIAL.instagram} target="_blank" rel="noopener noreferrer me" className="hover:text-kado-red">
            Instagram
          </a>
          {' · '}
          <a href={SEO_SOCIAL.facebook} target="_blank" rel="noopener noreferrer me" className="hover:text-kado-red">
            Facebook
          </a>
          {' · '}
          <a href={SEO_SOCIAL.tiktok} target="_blank" rel="noopener noreferrer me" className="hover:text-kado-red">
            TikTok
          </a>
        </p>
      </div>
    </aside>
  );
}
