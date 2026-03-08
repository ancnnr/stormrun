import { useEffect, useState } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { useManageAuth } from '@/hooks/useManageAuth';
import { apiFetch } from '@/lib/manageApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Analytics {
  missionCompletions: { missionId: string; title: string; count: number }[];
  loginsToday: number;
  monthlyActiveUsers: number;
  totalUsers: number;
}

export default function DashboardPage() {
  const { ready } = useManageAuth();
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    apiFetch<Analytics>('/api/admin/analytics')
      .then(setData)
      .catch((e) => setError(e.message));
  }, [ready]);

  if (!ready) return null;

  return (
    <ManageLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {error && <p className="text-destructive mb-4">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Users" value={data?.totalUsers ?? '—'} />
        <StatCard label="Monthly Active Users" value={data?.monthlyActiveUsers ?? '—'} />
        <StatCard label="Logins Today" value={data?.loginsToday ?? '—'} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mission Completions</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.missionCompletions.length === 0 && (
            <p className="text-muted-foreground text-sm">No completions yet.</p>
          )}
          {data && data.missionCompletions.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.missionCompletions} margin={{ left: 0, right: 16 }}>
                <XAxis dataKey="title" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
