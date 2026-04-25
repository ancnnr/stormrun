import { useEffect, useState } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { useManageAuth } from '@/hooks/useManageAuth';
import { apiFetch } from '@/lib/manageApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Outpost {
  id: string;
  user_id: string;
  username: string | null;
  name: string;
  status: 'active' | 'dormant' | 'decommissioned';
  destination_lat: number;
  destination_lng: number;
  supply_run_count: number;
  established_at: string;
  last_resupply_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  dormant: 'bg-amber-100 text-amber-800',
  decommissioned: 'bg-gray-100 text-gray-500',
};

const DORMANT_DAYS = 5;

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function OutpostsPage() {
  const { ready } = useManageAuth();

  const [outposts, setOutposts] = useState<Outpost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const LIMIT = 50;

  async function load(p = page) {
    setLoading(true);
    try {
      const data = await apiFetch<{ outposts: Outpost[]; total: number; page: number; limit: number }>(
        `/api/admin/outposts?page=${p}&limit=${LIMIT}`
      );
      setOutposts(data.outposts ?? []);
      setTotal(data.total ?? 0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load outposts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, page]);

  const filtered = statusFilter === 'all'
    ? outposts
    : outposts.filter((o) => o.status === statusFilter);

  const dormantWarnings = outposts.filter((o) => {
    if (o.status !== 'active') return false;
    const d = daysSince(o.last_resupply_at ?? o.established_at);
    return d !== null && d >= DORMANT_DAYS;
  });

  if (!ready) return null;

  return (
    <ManageLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Outposts</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total outposts across all users</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load()}>Refresh</Button>
      </div>

      {error && <p className="text-destructive mb-4">{error}</p>}

      {dormantWarnings.length > 0 && (
        <div className="mb-4 rounded-md border border-amber-400/40 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            ⚠ {dormantWarnings.length} active outpost{dormantWarnings.length !== 1 ? 's' : ''} haven&apos;t been resupplied in {DORMANT_DAYS}+ days and may go dormant.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="dormant">Dormant</SelectItem>
            <SelectItem value="decommissioned">Decommissioned</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} shown</span>
      </div>

      {loading && <p className="text-muted-foreground">Loading…</p>}

      {!loading && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Supply Runs</TableHead>
              <TableHead>Last Resupply</TableHead>
              <TableHead>Days Since Resupply</TableHead>
              <TableHead>Established</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((o) => {
              const days = daysSince(o.last_resupply_at ?? o.established_at);
              const isAtRisk = o.status === 'active' && days !== null && days >= DORMANT_DAYS;
              return (
                <TableRow key={o.id} className={isAtRisk ? 'bg-amber-50/50' : undefined}>
                  <TableCell className="font-medium">{o.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{o.username ?? o.user_id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {o.status}
                    </span>
                  </TableCell>
                  <TableCell>{o.supply_run_count}</TableCell>
                  <TableCell>{formatDate(o.last_resupply_at)}</TableCell>
                  <TableCell>
                    {days !== null ? (
                      <span className={isAtRisk ? 'text-amber-700 font-medium' : 'text-muted-foreground'}>
                        {days}d {isAtRisk && '⚠'}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell>{formatDate(o.established_at)}</TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No outposts match the selected filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / LIMIT)} · {total} total
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </ManageLayout>
  );
}
