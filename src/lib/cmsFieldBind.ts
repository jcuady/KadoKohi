import type { CmsText } from './cmsTypography';

/** Wire `CmsStyledText` to the landing inline editor when preview edit mode is on. */
export function cmsTextProps(
  enabled: boolean | undefined,
  field: string,
  label: string,
  onChange: (next: CmsText) => void,
) {
  if (!enabled) return {};
  return { cmsField: field, cmsLabel: label, onCmsChange: onChange };
}
