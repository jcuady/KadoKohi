import { useEffect, useState } from 'react';
import { resolvePaymentProofDisplayUrl } from '../lib/paymentProofStorage';

export function usePaymentProofDisplayUrl(ref: string | undefined | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(ref));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ref?.trim()) {
      setUrl(null);
      setLoading(false);
      setFailed(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFailed(false);

    void resolvePaymentProofDisplayUrl(ref).then((resolved) => {
      if (cancelled) return;
      setUrl(resolved);
      setLoading(false);
      setFailed(!resolved);
    });

    return () => {
      cancelled = true;
    };
  }, [ref]);

  return { url, loading, failed };
}
