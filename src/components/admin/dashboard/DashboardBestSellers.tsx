import { useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';
import { Badge } from '../../ui/badge';
import { formatPhp } from '../../../lib/money';
import {
  SALES_CATEGORY_LABELS,
  type ProductPoint,
  type SalesCategory,
} from '../../../lib/adminDashboardStats';

type TabId = 'all' | SalesCategory;

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'pastries', label: 'Pastries' },
  { id: 'merch', label: 'Merch' },
  { id: 'mix-match', label: 'Mix & Match' },
];

type Props = {
  byCategory: Record<TabId, ProductPoint[]>;
};

export default function DashboardBestSellers({ byCategory }: Props) {
  const [tab, setTab] = useState<TabId>('all');
  const list = useMemo(() => byCategory[tab] ?? [], [byCategory, tab]);

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)}>
        <TabsList className="h-auto flex-wrap gap-1">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="text-[10px] font-bold uppercase tracking-wider">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {list.length === 0 ? (
        <p className="text-sm dash-muted">No sales for this category in the selected period.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((p, i) => (
            <li key={`${tab}-${p.name}`} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  i === 0 ? 'bg-kado-red text-white' : 'bg-kado-red/10 text-kado-red'
                }`}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-semibold dash-heading">{p.name}</p>
                  {tab === 'all' ? (
                    <Badge variant="outline" className="text-[9px]">
                      {SALES_CATEGORY_LABELS[p.category]}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-[10px] dash-muted">{p.qty} sold</p>
              </div>
              <span className="font-display text-sm font-bold tabular-nums text-kado-red">
                {formatPhp(p.revenue)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
