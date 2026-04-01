import { useEffect, useState } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { useManageAuth } from '@/hooks/useManageAuth';
import { apiFetch } from '@/lib/manageApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '@/components/ui/use-toast';

interface BalanceItem {
  id: string;
  name: string;
  category: string;
  rarity: string;
  effects: Record<string, unknown>;
  sort_order: number;
  activeUsers: number;
}

interface BalanceData {
  items: BalanceItem[];
  rarityDistribution: Record<string, number>;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#64748b',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f97316',
};

const RARITY_BADGE: Record<string, string> = {
  common: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  uncommon: 'bg-green-500/20 text-green-400 border-green-500/30',
  rare: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  legendary: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

function renderEffectsSummary(effects: Record<string, unknown>, category: string): string {
  if (!effects || Object.keys(effects).length === 0) return '—';
  if (category === 'equipment') {
    return Object.entries(effects)
      .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').trim()}: ${v}`)
      .join(' · ');
  }
  const { type, value, duration } = effects as { type?: string; value?: number; duration?: number };
  const parts = [];
  if (type) parts.push(String(type));
  if (value != null) parts.push(`+${value}`);
  if (duration) parts.push(`${duration}s`);
  return parts.join(' · ') || '—';
}

export default function ItemBalancePage() {
  const { ready } = useManageAuth();
  const { toast } = useToast();
  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    apiFetch<BalanceData>('/api/admin/items/balance')
      .then(setData)
      .catch((e: unknown) => {
        toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to load', variant: 'destructive' });
      })
      .finally(() => setLoading(false));
  }, [ready, toast]);

  const pieData = data
    ? Object.entries(data.rarityDistribution).map(([name, value]) => ({ name, value }))
    : [];

  if (!ready) return null;

  return (
    <ManageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Item Balance Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Current effect values and ownership distribution across all users.</p>
      </div>

      {loading && <p className="text-muted-foreground">Loading…</p>}

      {!loading && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rarity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`}>
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={RARITY_COLORS[entry.name] ?? '#64748b'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm">No items in catalog.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Catalog Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Total Items</p>
                    <p className="text-2xl font-bold">{data.items.length}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Equipment</p>
                    <p className="text-2xl font-bold">{data.items.filter((i) => i.category === 'equipment').length}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Consumables</p>
                    <p className="text-2xl font-bold">{data.items.filter((i) => i.category === 'consumable').length}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Total Owned (slots)</p>
                    <p className="text-2xl font-bold">{data.items.reduce((s, i) => s + i.activeUsers, 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Rarity</TableHead>
                <TableHead>Effects</TableHead>
                <TableHead className="text-right">Users Owning</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{item.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${RARITY_BADGE[item.rarity] ?? RARITY_BADGE.common}`}>
                      {item.rarity}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {renderEffectsSummary(item.effects, item.category)}
                  </TableCell>
                  <TableCell className="text-right font-medium">{item.activeUsers}</TableCell>
                </TableRow>
              ))}
              {data.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No items in catalog.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </ManageLayout>
  );
}
