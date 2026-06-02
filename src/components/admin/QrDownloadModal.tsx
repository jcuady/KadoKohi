import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Copy, ExternalLink, Check, Printer } from 'lucide-react';
import {
  downloadBrandedQrCard,
  printBrandedQrCard,
  type QrCardLayout,
} from '../../lib/brandedQrCard';
import { canonicalScanUrl } from '../../lib/siteUrl';
import BrandedQrPreview from './BrandedQrPreview';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  scanUrl: string;
  downloadFilename: string;
  subtitle?: string;
  tagline?: string;
  layout?: QrCardLayout;
};

export default function QrDownloadModal({
  open,
  onClose,
  title,
  scanUrl,
  subtitle,
  downloadFilename,
  tagline,
  layout = 'table',
}: Props) {
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productionUrl = canonicalScanUrl(scanUrl);
  const cardInput = { layout, title, scanUrl: productionUrl, subtitle, tagline };
  const isTakeout = layout === 'takeout';
  const previewMaxW = isTakeout ? 'max-w-[220px]' : 'max-w-[280px]';

  const handleDownload = async () => {
    setError(null);
    setDownloading(true);
    try {
      await downloadBrandedQrCard(cardInput, downloadFilename);
    } catch {
      setError('Download failed. Try again or use Print.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    setError(null);
    setPrinting(true);
    try {
      await printBrandedQrCard(cardInput);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Print failed.');
    } finally {
      setPrinting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(productionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy link');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="w-full max-w-md rounded-t-2xl sm:rounded-2xl dash-card border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b dash-border shrink-0">
              <div className="min-w-0 pr-4">
                <h2 className="font-display font-bold text-lg dash-heading truncate">{title}</h2>
                {subtitle && <p className="text-xs dash-muted mt-0.5">{subtitle}</p>}
                <p className="text-[10px] font-bold uppercase tracking-wider text-kado-red mt-1">
                  {isTakeout ? 'Portrait · Cashier stand' : 'Square · Table edge'}
                </p>
              </div>
              <button type="button" onClick={onClose} className="p-2 dash-muted hover:text-kado-red" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-6 flex flex-col items-center text-center overflow-y-auto">
              <div
                className={`rounded-2xl border dash-border shadow-md overflow-hidden mb-4 bg-kado-offwhite w-full ${previewMaxW} mx-auto`}
              >
                {open && <BrandedQrPreview {...cardInput} className="w-full h-auto block" />}
              </div>
              <p className="text-[10px] dash-muted break-all max-w-full mb-2 font-mono">{productionUrl}</p>
              <p className="text-xs dash-muted mb-4 leading-relaxed">
                {isTakeout
                  ? 'Portrait takeout card with Kado branding — print and display near the cashier.'
                  : 'Square table tent with Kado branding — print and place on the table edge for dine-in ordering.'}
              </p>

              {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

              <div className="flex flex-col w-full gap-2">
                <button
                  type="button"
                  disabled={downloading}
                  onClick={() => void handleDownload()}
                  className="w-full min-h-[48px] rounded-xl bg-kado-red text-kado-cream flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {downloading ? 'Preparing…' : 'Download branded QR'}
                </button>
                <button
                  type="button"
                  disabled={printing}
                  onClick={() => void handlePrint()}
                  className="w-full min-h-[44px] rounded-xl bg-kado-dark text-kado-cream flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider hover:bg-kado-red disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  {printing ? 'Preparing print…' : isTakeout ? 'Print takeout stand' : 'Print table tent'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="w-full min-h-[44px] rounded-xl border dash-border flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider dash-heading hover:border-kado-red/40"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy link'}
                </button>
                <a
                  href={productionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] rounded-xl border dash-border flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider dash-muted hover:text-kado-red"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open menu page
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
