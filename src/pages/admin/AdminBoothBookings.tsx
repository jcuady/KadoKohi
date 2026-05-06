import { useMemo, useState } from 'react';
import type { BoothBookingStatus } from '../../types/domain';
import { useBoothBookingStore } from '../../store/boothBookingStore';
import { useBranchStore } from '../../store/branchStore';
import { useUserStore } from '../../store/userStore';
import { formatPhp } from '../../lib/money';

const ALL_STATUSES: BoothBookingStatus[] = [
  'submitted',
  'under_review',
  'quoted',
  'awaiting_confirmation',
  'confirmed',
  'declined',
  'cancelled',
  'completed',
];

const STATUS_COLORS: Record<BoothBookingStatus, string> = {
  submitted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  under_review: 'bg-blue-100 text-blue-800 border-blue-200',
  quoted: 'bg-purple-100 text-purple-800 border-purple-200',
  awaiting_confirmation: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const NEXT_STATUS: Partial<Record<BoothBookingStatus, BoothBookingStatus>> = {
  submitted: 'under_review',
  under_review: 'quoted',
  quoted: 'awaiting_confirmation',
  awaiting_confirmation: 'confirmed',
  confirmed: 'completed',
};

export default function AdminBoothBookings() {
  const bookings = useBoothBookingStore((s) => s.bookings);
  const updateStatus = useBoothBookingStore((s) => s.updateStatus);
  const assignStaff = useBoothBookingStore((s) => s.assignStaff);
  const branches = useBranchStore((s) => s.branches);
  const users = useUserStore((s) => s.users);

  const [statusFilter, setStatusFilter] = useState<BoothBookingStatus | 'all'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  const staffUsers = useMemo(() => users.filter((u) => u.role === 'staff' || u.role === 'admin'), [users]);
  const branchName = useMemo(() => {
    const map = new Map(branches.map((b) => [b.id, b.name]));
    return (id: string) => map.get(id) ?? id;
  }, [branches]);
  const userName = useMemo(() => {
    const map = new Map(users.map((u) => [u.id, u.name]));
    return (id?: string) => (id ? map.get(id) ?? id : 'Unassigned');
  }, [users]);

  const filtered = useMemo(() => {
    let list = bookings;
    if (statusFilter !== 'all') list = list.filter((b) => b.status === statusFilter);
    if (branchFilter !== 'all') list = list.filter((b) => b.branchId === branchFilter);
    return [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [bookings, statusFilter, branchFilter]);

  return (
    <div className="max-w-6xl dash-page">
      <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Booth Bookings</h1>
      <p className="dash-muted mb-6">Review booking requests, assign staff, and update status.</p>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="rounded-xl dash-input border px-4 py-2 text-sm font-semibold"
        >
          <option value="all">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BoothBookingStatus | 'all')}
          className="rounded-xl dash-input border px-4 py-2 text-sm font-semibold"
        >
          <option value="all">All statuses</option>
          {ALL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <span className="self-center text-xs dash-muted font-semibold">
          {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl dash-card border p-12 text-center">
          <p className="text-sm dash-muted">No bookings match your filters.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((booking) => {
            const next = NEXT_STATUS[booking.status];
            return (
              <li key={booking.id} className="rounded-2xl dash-card border p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-display font-bold dash-heading text-lg">{booking.shortCode}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_COLORS[booking.status]}`}>
                        {booking.status}
                      </span>
                      <span className="text-xs dash-muted">{branchName(booking.branchId)}</span>
                      <span className="text-xs dash-muted">{timeAgo(booking.createdAt)}</span>
                    </div>
                    <p className="text-sm dash-muted">
                      {booking.eventName} · {booking.occasion.replace('_', ' ')} · {booking.guestCount} guests
                    </p>
                    <p className="text-xs dash-muted mt-1">
                      {booking.contactName} ({booking.contactEmail}) · {booking.contactPhone}
                    </p>
                    {booking.specialRequests && (
                      <p className="text-xs dash-muted mt-1 line-clamp-2">{booking.specialRequests}</p>
                    )}
                  </div>

                  <div className="shrink-0 grid sm:grid-cols-[auto_auto] gap-3 items-center">
                    <div className="text-right">
                      <p className="font-display font-bold text-kado-red text-lg">
                        {formatPhp(booking.estimateSnapshot.total)}
                      </p>
                      <p className="text-[10px] dash-muted uppercase tracking-wider">
                        {booking.estimateSnapshot.lineItems.length} line item(s)
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <select
                        value={booking.assignedStaffId ?? ''}
                        onChange={(e) => assignStaff(booking.id, e.target.value || undefined)}
                        className="rounded-xl dash-input border px-3 py-2 text-xs font-semibold"
                      >
                        <option value="">Unassigned</option>
                        {staffUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                      {next && (
                        <button
                          type="button"
                          onClick={() => updateStatus(booking.id, next)}
                          className="rounded-xl bg-kado-dark text-kado-cream px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-kado-red transition-colors"
                        >
                          → {next.replace('_', ' ')}
                        </button>
                      )}
                      {booking.status !== 'declined' && booking.status !== 'cancelled' && booking.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(booking.id, 'declined')}
                          className="rounded-xl border border-red-200 text-red-600 px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-red-50 transition-colors"
                        >
                          Decline
                        </button>
                      )}
                      <p className="text-[10px] dash-muted">Assigned: {userName(booking.assignedStaffId)}</p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
