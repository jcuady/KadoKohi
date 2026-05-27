import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Copy, ExternalLink, Check } from 'lucide-react';
import { qrImageUrl, downloadQrPng } from '../../lib/qr';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  scanUrl: string;
  subtitle?: string;
  downloadFilename: string;
};

export default function QrDownloadModal({
  open,
  onClose,
  title,
  scanUrl,
  subtitle,
  downloadFilename,
}: Props) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setError(null);
    setDownloading(true);
    try {
      await downloadQrPng(scanUrl, downloadFilename, 600);
    } catch {
      setError('Download failed. Try opening the link below or retry.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scanUrl);
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
            className="w-full max-w-md rounded-t-2xl sm:rounded-2xl dash-card border shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b dash-border">
              <div className="min-w-0 pr-4">
                <h2 className="font-display font-bold text-lg dash-heading truncate">{title}</h2>
                {subtitle && <p className="text-xs dash-muted mt-0.5">{subtitle}</p>}
              </div>
              <button type="button" onClick={onClose} className="p-2 dash-muted hover:text-kado-red" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-6 flex flex-col items-center text-center">
              <div className="rounded-2xl border dash-border dash-card-alt p-3 mb-4">
                <img
                  src={qrImageUrl(scanUrl, 280)}
                  alt={`QR code for ${title}`}
                  className="w-[min(72vw,260px)] h-[min(72vw,260px)] object-contain"
                  width={260}
                  height={260}
                />
              </div>
              <p className="text-[10px] dash-muted break-all max-w-full mb-4">{scanUrl}</p>
              <p className="text-xs dash-muted mb-4 leading-relaxed">
                Print this QR and place it on the table. Scanning opens the dine-in menu on your live site.
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
                  {downloading ? 'Preparing…' : 'Download QR (PNG)'}
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
                  href={scanUrl}
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
