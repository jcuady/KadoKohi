import { useEffect, useMemo, useState } from 'react';
import type { EventRegistration } from '../../types/domain';
import { useAuthStore } from '../../store/authStore';
import { useBranchStore } from '../../store/branchStore';
import { useEventStore } from '../../store/eventStore';
import { eventMatchesBranchFilter } from '../../lib/eventTiming';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';

export default function StaffEventRegistrations() {
  const user = useAuthStore((s) => s.user);
  const events = useEventStore((s) => s.events);
  const hydrateEvents = useEventStore((s) => s.hydrateFromRemote);
  const branches = useBranchStore((s) => s.branches);

  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');

  const branchLabel = user?.branchId
    ? branches.find((b) => b.id === user.branchId)?.name ?? user.branchId
    : null;

  useEffect(() => {
    void hydrateEvents();
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    void orderingRepo
      .fetchAllEventRegistrations()
      .then((rows) => {
        if (!cancelled) setRegistrations(rows);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load event sign-ups. Try refreshing.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrateEvents]);

  const scopedEvents = useMemo(() => {
    if (!user?.branchId) return events;
    return events.filter((evt) => eventMatchesBranchFilter(evt, user.branchId!));
  }, [events, user?.branchId]);

  const filteredRegistrations = useMemo(() => {
    const allowed = new Set(scopedEvents.map((e) => e.id));
    const q = query.trim().toLowerCase();
    return registrations.filter((r) => {
      if (!allowed.has(r.eventId)) return false;
      if (eventFilter !== 'all' && r.eventId !== eventFilter) return false;
      if (!q) return true;
      return (
        r.contactName.toLowerCase().includes(q) ||
        r.contactEmail.toLowerCase().includes(q) ||
        r.contactPhone.toLowerCase().includes(q)
      );
    });
  }, [registrations, scopedEvents, query, eventFilter]);

  return (
    <div className="max-w-6xl dash-page">
      <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Event Sign-ups</h1>
      <p className="dash-muted mb-6">
        Review customer registration forms
        {branchLabel ? ` · ${branchLabel}` : ''}.
      </p>

      <section className="rounded-2xl dash-card border p-5" aria-label="Event registration submissions">
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone"
            className="md:col-span-2 rounded-xl dash-input border px-4 py-2.5 text-sm"
          />
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="rounded-xl dash-input border px-4 py-2.5 text-sm"
          >
            <option value="all">All events</option>
            {scopedEvents.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs dash-muted font-bold uppercase tracking-wider mb-3">
          {filteredRegistrations.length} result{filteredRegistrations.length === 1 ? '' : 's'}
        </p>

        {loadError ? (
          <p className="text-sm text-kado-red py-8 text-center">{loadError}</p>
        ) : loading ? (
          <p className="text-sm dash-muted py-8 text-center">Loading sign-ups…</p>
        ) : filteredRegistrations.length === 0 ? (
          <p className="text-sm dash-muted py-8 text-center">No registrations found for the selected filters.</p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b dash-border text-[10px] font-bold uppercase tracking-wider dash-muted">
                  <th className="py-2 pr-3">Guest</th>
                  <th className="py-2 pr-3">Contact</th>
                  <th className="py-2 pr-3">Event</th>
                  <th className="py-2">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y dash-border">
                {filteredRegistrations.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="py-3 pr-3">
                      <p className="font-bold dash-heading">{r.contactName}</p>
                      {r.customAnswers && Object.keys(r.customAnswers).length > 0 ? (
                        <ul className="mt-2 text-[10px] dash-muted space-y-0.5 max-w-xs">
                          {Object.entries(r.customAnswers).map(([key, val]) => (
                            <li key={key}>
                              <span className="font-semibold">{key}:</span> {String(val)}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 text-xs dash-muted">
                      <p>{r.contactEmail}</p>
                      <p className="mt-0.5">{r.contactPhone}</p>
                    </td>
                    <td className="py-3 pr-3 text-xs dash-muted">
                      {scopedEvents.find((e) => e.id === r.eventId)?.title ??
                        events.find((e) => e.id === r.eventId)?.title ??
                        r.eventId}
                    </td>
                    <td className="py-3 text-xs dash-muted whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
