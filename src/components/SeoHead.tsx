import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { site } from '../lib/config';

type Props = {
  title: string;
  description: string;
  /** Omit on pages that should not be indexed (staff portal). */
  noindex?: boolean;
};

function setMeta(selector: string, attribute: string, value: string) {
  const element = document.head.querySelector<HTMLMetaElement>(selector);
  if (element) element.setAttribute(attribute, value);
}

/**
 * The build emits a real HTML file per route with correct metadata, but the
 * router also swaps pages client-side — this keeps the tags honest after
 * in-app navigation, which is what Search Console and link previews read.
 */
export function SeoHead({ title, description, noindex = false }: Props) {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);

    const canonical = new URL(pathname.replace(/^\//, ''), site.url).toString();
    setMeta('link[rel="canonical"]', 'href', canonical);
    setMeta('meta[property="og:url"]', 'content', canonical);

    const existing = document.head.querySelector('meta[name="robots"]');
    if (noindex) {
      if (existing) {
        existing.setAttribute('content', 'noindex, nofollow');
      } else {
        const tag = document.createElement('meta');
        tag.name = 'robots';
        tag.content = 'noindex, nofollow';
        document.head.appendChild(tag);
      }
    } else {
      existing?.remove();
    }
  }, [title, description, noindex, pathname]);

  return null;
}
