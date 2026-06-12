import { usePublicLightDocumentTheme } from '../lib/theme';

/** Locks document to brand light mode on customer-facing routes. */
export default function PublicDocumentTheme() {
  usePublicLightDocumentTheme();
  return null;
}
