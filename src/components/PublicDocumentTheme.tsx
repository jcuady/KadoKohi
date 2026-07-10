import { usePublicLightDocumentTheme } from '../lib/theme';

/** Locks document theme: brand light site-wide; QR/takeout also follows OS dark mode. */
export default function PublicDocumentTheme() {
  usePublicLightDocumentTheme();
  return null;
}
