import { useEffect, useState } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { useManageAuth } from '@/hooks/useManageAuth';
import { apiFetch } from '@/lib/manageApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';

interface Analytics {
  missionCompletions: { missionId: string; title: string; count: number }[];
  loginsToday: number;
  monthlyActiveUsers: number;
  totalUsers: number;
  totalRuns: number;
  totalDistanceKm: number;
}

interface RunDay {
  date: string;
  runs: number;
  distanceKm: number;
}

interface RunTrends {
  period: string;
  days: RunDay[];
}

type Period = '7d' | '30d' | '90d';

function formatDate(iso: string, period: Period): string {
  const d = new Date(iso + 'T00:00:00');
  if (period === '7d') return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  const { ready } = useManageAuth();
  const [data, setData] = useState<Analytics | null>(null);
  const [trends, setTrends] = useState<RunTrends | null>(null);
  const [period, setPeriod] = useState<Period>('30d');
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    apiFetch<Analytics>('/api/admin/analytics')
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    setTrendsLoading(true);
    apiFetch<RunTrends>(`/api/admin/analytics/runs?period=${period}`)
      .then(setTrends)
      .catch(() => {/* non-fatal */})
      .finally(() => setTrendsLoading(false));
  }, [ready, period]);

  if (!ready) return null;

  const chartDays = trends?.days.map((d) => ({
    ...d,
    label: formatDate(d.date, period),
  })) ?? [];

  return (
    <ManageLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {error && <p className="text-destructive mb-4">{error}</p>}

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Users" value={data?.totalUsers ?? '—'} />
        <StatCard label="Monthly Active" value={data?.monthlyActiveUsers ?? '—'} />
        <StatCard label="Logins Today" value={data?.loginsToday ?? '—'} />
        <StatCard label="Total Runs" value={data?.totalRuns ?? '—'} />
        <StatCard
          label="Total Distance"
          value={data != null ? `${data.totalDistanceKm.toLocaleString()} km` : '—'}
        />
        <StatCard
          label="Missions Run"
          value={data?.missionCompletions.reduce((s, m) => s + m.count, 0) ?? '—'}
        />
      </div>

      {/* Run trends */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Run Activity</CardTitle>
          <div className="flex gap-1">
            {(['7d', '30d', '90d'] as Period[]).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? 'default' : 'outline'}
                onClick={() => setPeriod(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {trendsLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {!trendsLoading && chartDays.length > 0 && (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartDays} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  interval={period === '7d' ? 0 : period === '30d' ? 4 : 9}
                />
                <YAxis yAxisId="runs" allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                <YAxis yAxisId="dist" orientation="right" tick={{ fontSize: 11 }} width={40} unit=" km" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Line yAxisId="runs" type="monotone" dataKey="runs" name="Runs" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                <Line yAxisId="dist" type="monotone" dataKey="distanceKm" name="Distance (km)" stroke="hsl(142 71% 45%)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {!trendsLoading && chartDays.every((d) => d.runs === 0) && (
            <p className="text-muted-foreground text-sm">No runs in this period.</p>
          )}
        </CardContent>
      </Card>

      {/* Mission completions */}
      <Card>
        <CardHeader>
          <CardTitle>Mission Completions</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.missionCompletions.length === 0 && (
            <p className="text-muted-foreground text-sm">No completions yet.</p>
          )}
          {data && data.missionCompletions.length > 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.missionCompletions.slice(0, 15)} margin={{ left: 0, right: 16, bottom: 40 }}>
                <XAxis dataKey="title" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="count" name="Completions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {!data && !error && <p className="text-muted-foreground text-sm">Loading…</p>}
        </CardContent>
      </Card>
    </ManageLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
