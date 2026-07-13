import type { BoothBooking, BoothPaymentMethod } from '../types/domain';
import type { BoothPaymentConfig } from '../store/settingsStore';
import { boothPaymentMethodLabel } from './boothPayment';
import { formatPhp } from './money';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildBoothPaymentInstructionsHtml(opts: {
  shortCode: string;
  amountDue: number;
  paymentMethod: BoothPaymentMethod;
  gcashQrUrl?: string;
  boothPayment?: BoothPaymentConfig;
  shopGcashQr?: string;
}): string {
  const { shortCode, amountDue, paymentMethod, boothPayment, shopGcashQr } = opts;
  const bp = boothPayment ?? { gcashEnabled: true, bankEnabled: true };
  const showGcash =
    (paymentMethod === 'gcash-qr' || paymentMethod === 'gcash-or-bank') && bp.gcashEnabled;
  const showBank =
    (paymentMethod === 'bank-transfer' || paymentMethod === 'gcash-or-bank') && bp.bankEnabled;
  const gcashUrl = bp.gcashQrImage?.trim() || shopGcashQr?.trim() || '';

  const parts: string[] = [
    `<div style="margin-top:20px;padding:16px;border-radius:12px;background:#FAF9F6;border:1px solid #e8e0d5">`,
    `<p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9E181D">Payment instructions</p>`,
    `<p style="margin:0 0 12px;font-size:14px"><strong>Amount due:</strong> ${escapeHtml(formatPhp(amountDue))}</p>`,
    `<p style="margin:0 0 12px;font-size:13px;color:#555">Reference: <strong>${escapeHtml(shortCode)}</strong> · ${escapeHtml(boothPaymentMethodLabel(paymentMethod))}</p>`,
  ];

  if (showGcash && gcashUrl) {
    parts.push(
      `<p style="margin:0 0 8px;font-size:13px;font-weight:600">GCash</p>`,
      `<ol style="margin:0 0 12px;padding-left:18px;font-size:13px;line-height:1.5;color:#444">`,
      `<li>Open GCash and scan the QR below (or send to our number).</li>`,
      `<li>Pay <strong>${escapeHtml(formatPhp(amountDue))}</strong> and use reference <strong>${escapeHtml(shortCode)}</strong>.</li>`,
      `<li>Upload your screenshot at <a href="https://www.kadokohi.com/account/booth">kadokohi.com/account/booth</a> or reply to this email.</li>`,
      `</ol>`,
      `<img src="${escapeHtml(gcashUrl)}" alt="GCash QR" style="max-width:180px;border-radius:8px;border:1px solid #ddd" />`,
    );
  }

  if (showBank && (bp.bankName || bp.bankAccountNumber)) {
    parts.push(
      `<p style="margin:16px 0 8px;font-size:13px;font-weight:600">Bank transfer</p>`,
      `<table style="font-size:13px;line-height:1.6;color:#444">`,
      bp.bankName ? `<tr><td style="padding:2px 12px 2px 0;color:#888">Bank</td><td>${escapeHtml(bp.bankName)}</td></tr>` : '',
      bp.bankAccountName ? `<tr><td style="padding:2px 12px 2px 0;color:#888">Account name</td><td>${escapeHtml(bp.bankAccountName)}</td></tr>` : '',
      bp.bankAccountNumber ? `<tr><td style="padding:2px 12px 2px 0;color:#888">Account no.</td><td>${escapeHtml(bp.bankAccountNumber)}</td></tr>` : '',
      `</table>`,
      bp.bankInstructions
        ? `<p style="margin:8px 0 0;font-size:12px;color:#666">${escapeHtml(bp.bankInstructions).replace(/\n/g, '<br/>')}</p>`
        : '',
    );
  }

  parts.push(`</div>`);
  return parts.join('');
}

export function buildBoothPaymentInstructionsPlain(opts: {
  shortCode: string;
  amountDue: number;
  paymentMethod: BoothPaymentMethod;
  boothPayment?: BoothPaymentConfig;
}): string[] {
  const { shortCode, amountDue, paymentMethod, boothPayment } = opts;
  const bp = boothPayment ?? { gcashEnabled: true, bankEnabled: true };
  const lines = [
    '',
    '--- Payment instructions ---',
    `Amount due: ${formatPhp(amountDue)}`,
    `Reference: ${shortCode}`,
    `Method: ${boothPaymentMethodLabel(paymentMethod)}`,
  ];
  if ((paymentMethod === 'gcash-qr' || paymentMethod === 'gcash-or-bank') && bp.gcashEnabled) {
    lines.push('GCash: Scan our QR or send payment, then upload proof at kadokohi.com/account/booth');
  }
  if ((paymentMethod === 'bank-transfer' || paymentMethod === 'gcash-or-bank') && bp.bankEnabled) {
    if (bp.bankName) lines.push(`Bank: ${bp.bankName}`);
    if (bp.bankAccountName) lines.push(`Account name: ${bp.bankAccountName}`);
    if (bp.bankAccountNumber) lines.push(`Account no.: ${bp.bankAccountNumber}`);
    if (bp.bankInstructions) lines.push(bp.bankInstructions);
  }
  return lines;
}
