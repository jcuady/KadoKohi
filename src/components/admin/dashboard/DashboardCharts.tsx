import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BRAND } from '../../../lib/brandTokens';
import { formatPhp } from '../../../lib/money';
import type { BranchPoint, CategorySalesPoint, ChannelPoint, PipelinePoint, RevenuePoint } from '../../../lib/adminDashboardStats';

const CHART_COLORS = [BRAND.red, BRAND.dark, '#7A6B5A', '#C4A882', '#D9C9A8'];

type TooltipProps = {
  active?: boolean;
  payload?: { value: number; payload: RevenuePoint }[];
  label?: string;
};

function RevenueTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-kado-dark/10 bg-white px-3 py-2 text-xs shadow-sm dark:bg-kado-dark dark:border-white/10">
      <p className="font-semibold dash-heading">{label}</p>
      <p className="text-kado-red font-display font-bold tabular-nums">{formatPhp(row?.revenue ?? 0)}</p>
      <p className="dash-muted">{row?.orders ?? 0} orders</p>
    </div>
  );
}

type ChannelTooltipProps = {
  active?: boolean;
  payload?: { value: number; payload: ChannelPoint }[];
  label?: string;
};

function ChannelTooltip({ active, payload }: ChannelTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-kado-dark/10 bg-white px-3 py-2 text-xs shadow-sm dark:bg-kado-dark dark:border-white/10">
      <p className="font-semibold dash-heading">{row?.label}</p>
      <p className="text-kado-red font-display font-bold tabular-nums">{formatPhp(row?.revenue ?? 0)}</p>
      <p className="dash-muted">{row?.count ?? 0} orders</p>
    </div>
  );
}

export function DashboardRevenueChart({ data, empty }: { data: RevenuePoint[]; empty?: boolean }) {
  if (empty || data.every((d) => d.revenue === 0 && d.orders === 0)) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm dash-muted">
        No sales in this period yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="kadoRevenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND.red} stopOpacity={0.25} />
            <stop offset="100%" stopColor={BRAND.red} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(25,25,25,0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: BRAND.muted }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: BRAND.muted }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => (v >= 1000 ? `₱${Math.round(v / 1000)}k` : `₱${v}`)}
          width={48}
        />
        <Tooltip content={<RevenueTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={BRAND.red}
          strokeWidth={2}
          fill="url(#kadoRevenueFill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DashboardChannelChart({ data }: { data: ChannelPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm dash-muted">
        No channel data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
        <CartesianGrid stroke="rgba(25,25,25,0.06)" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={72}
          tick={{ fontSize: 11, fill: BRAND.muted }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<ChannelTooltip />} cursor={{ fill: 'rgba(158,24,29,0.06)' }} />
        <Bar dataKey="revenue" radius={[0, 6, 6, 0]} isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DashboardPipelineChart({ data }: { data: PipelinePoint[] }) {
  const active = data.filter((d) => d.count > 0);
  if (!active.length) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm dash-muted">
        No active orders in queue.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((row, i) => {
        const max = Math.max(...data.map((d) => d.count), 1);
        const pct = Math.round((row.count / max) * 100);
        return (
          <div key={row.id} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-2 text-xs">
            <span className="truncate font-medium dash-muted">{row.label}</span>
            <div className="h-2 overflow-hidden rounded-full bg-kado-dark/5">
              <div
                className="h-full rounded-full transition-[width] duration-300 ease-out"
                style={{
                  width: `${pct}%`,
                  backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                }}
              />
            </div>
            <span className="text-right font-display font-bold tabular-nums dash-heading">{row.count}</span>
          </div>
        );
      })}
    </div>
  );
}

type CategoryTooltipProps = {
  active?: boolean;
  payload?: { value: number; payload: CategorySalesPoint }[];
};

function CategoryTooltip({ active, payload }: CategoryTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-kado-dark/10 bg-white px-3 py-2 text-xs shadow-sm dark:bg-kado-dark dark:border-white/10">
      <p className="font-semibold dash-heading">{row?.label}</p>
      <p className="text-kado-red font-display font-bold tabular-nums">{formatPhp(row?.revenue ?? 0)}</p>
      <p className="dash-muted">{row?.qty ?? 0} units</p>
    </div>
  );
}

export function DashboardCategorySalesChart({ data }: { data: CategorySalesPoint[] }) {
  const active = data.filter((d) => d.revenue > 0 || d.qty > 0);
  if (!active.length) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm dash-muted">
        No category sales in this period.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
        <CartesianGrid stroke="rgba(25,25,25,0.06)" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={96}
          tick={{ fontSize: 10, fill: BRAND.muted }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CategoryTooltip />} cursor={{ fill: 'rgba(158,24,29,0.06)' }} />
        <Bar dataKey="revenue" radius={[0, 6, 6, 0]} isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

type BranchTooltipProps = {
  active?: boolean;
  payload?: { value: number; payload: BranchPoint }[];
};

function BranchTooltip({ active, payload }: BranchTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-kado-dark/10 bg-white px-3 py-2 text-xs shadow-sm dark:bg-kado-dark dark:border-white/10">
      <p className="font-semibold dash-heading">{row?.name}</p>
      <p className="text-kado-red font-display font-bold tabular-nums">{formatPhp(row?.revenue ?? 0)}</p>
      <p className="dash-muted">
        {row?.orders ?? 0} orders · {row?.sharePct ?? 0}% share
      </p>
    </div>
  );
}

export function DashboardBranchChart({ data }: { data: BranchPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm dash-muted">
        Compare branches by selecting all locations.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
        <CartesianGrid stroke="rgba(25,25,25,0.06)" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={88}
          tick={{ fontSize: 11, fill: BRAND.muted }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<BranchTooltip />} cursor={{ fill: 'rgba(158,24,29,0.06)' }} />
        <Bar dataKey="revenue" radius={[0, 6, 6, 0]} isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
