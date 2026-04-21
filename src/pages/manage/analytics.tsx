import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { useManageAuth } from '@/hooks/useManageAuth';
import { apiFetch } from '@/lib/manageApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Leaflet requires no-SSR because it accesses window
const RunMap = dynamic(() => import('@/components/manage/RunMap'), { ssr: false, loading: () => <MapPlaceholder /> });

interface GeoPoint {
  lat: number;
  lng: number;
  missionTitle: string;
  difficulty: string | null;
  createdAt: string | null;
}

interface GeoData {
  points: GeoPoint[];
  total: number;
}

type Period = '7d' | '30d' | '90d' | 'all';

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
  extreme: '#a855f7',
};

function MapPlaceholder() {
  return <div className="w-full h-[500px] rounded-md bg-muted flex items-center justify-center text-muted-foreground text-sm">Loading map…</div>;
}

export default function AnalyticsPage() {
  const { ready } = useManageAuth();
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [period, setPeriod] = useState<Period>('30d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<GeoData>(`/api/admin/analytics/geo?period=${p}`);
      setGeoData(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load geo data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) load(period);
  }, [ready, period, load]);

  // Compute stats from points
  const difficultyCounts = (geoData?.points ?? []).reduce<Record<string, number>>((acc, p) => {
    const key = p.difficulty ?? 'unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  if (!ready) return null;

  return (
    <ManageLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Geographic Analytics</h1>
        <div className="flex gap-1">
          {(['7d', '30d', '90d', 'all'] as Period[]).map((p) => (
            <Button key={p} size="sm" variant={period === p ? 'default' : 'outline'} onClick={() => setPeriod(p)}>
              {p}
            </Button>
          ))}
        </div>
      </div>

      {error && <p className="text-destructive mb-4">{error}</p>}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Routes</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{loading ? '—' : (geoData?.total ?? 0)}</p></CardContent>
        </Card>
        {Object.entries(difficultyCounts).map(([diff, count]) => (
          <Card key={diff}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground capitalize">{diff}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: DIFFICULTY_COLORS[diff] ?? '#94a3b8' }} />
                <p className="text-2xl font-bold">{count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Run Start Points</CardTitle>
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading…' : `${geoData?.total ?? 0} routes shown. Dots colored by mission difficulty.`}
          </p>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden rounded-b-lg">
          {!loading && geoData && (
            <RunMap points={geoData.points} difficultyColors={DIFFICULTY_COLORS} />
          )}
          {loading && <MapPlaceholder />}
          {!loading && geoData?.total === 0 && (
            <div className="w-full h-[500px] flex items-center justify-center text-muted-foreground text-sm">
              No run data for this period.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
        {Object.entries(DIFFICULTY_COLORS).map(([diff, color]) => (
          <div key={diff} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="capitalize">{diff}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-slate-400" />
          <span>Unknown</span>
        </div>
      </div>
    </ManageLayout>
  );
}
