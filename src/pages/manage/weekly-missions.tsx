import { useEffect, useState, useCallback } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { useManageAuth } from '@/hooks/useManageAuth';
import { apiFetch } from '@/lib/manageApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WeeklyOverviewRow {
  mission_type: string;
  total_slots: number;
  completed: number;
  in_progress: number;
  pending: number;
}

interface UserWeeklySlot {
  id: string;
  user_id: string;
  iso_week: string;
  mission_type: string;
  status: string;
  mission_id: string | null;
  completed_at: string | null;
  created_at: string;
}

interface UserWeeklyRow {
  userId: string;
  username: string;
}

const TYPE_LABELS: Record<string, string> = {
  territory_expansion: 'Territory Expansion',
  outpost_establishment: 'Outpost',
  scouting: 'Scouting',
  supply_run: 'Supply Run',
  story: 'Story',
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  pending: 'bg-gray-100 text-gray-600',
  abandoned: 'bg-red-100 text-red-800',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatWeek(isoWeek: string): string {
  // isoWeek format: "2026-W17"
  const [year, wk] = isoWeek.split('-W');
  return `W${wk} ${year}`;
}

export default function WeeklyMissionsPage() {
  const { ready } = useManageAuth();

  const [overview, setOverview] = useState<WeeklyOverviewRow[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User drill-down
  const [drillUserId, setDrillUserId] = useState<string | null>(null);
  const [drillUsername, setDrillUsername] = useState('');
  const [drillSlots, setDrillSlots] = useState<UserWeeklySlot[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // User search for drill-down
  const [users, setUsers] = useState<UserWeeklyRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  async function loadOverview() {
    setOverviewLoading(true);
    try {
      const data = await apiFetch<{ overview: WeeklyOverviewRow[] }>('/api/admin/weekly-missions/overview');
      setOverview(data.overview ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load overview');
    } finally {
      setOverviewLoading(false);
    }
  }

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (userSearch) params.set('search', userSearch);
      const data = await apiFetch<{ users: Array<{ id: string; username: string }> }>(`/api/admin/users?${params}`);
      setUsers((data.users ?? []).map((u) => ({ userId: u.id, username: u.username })));
    } catch {
      // non-fatal
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch]);

  async function openDrillDown(userId: string, username: string) {
    setDrillUserId(userId);
    setDrillUsername(username);
    setSheetOpen(true);
    setDrillLoading(true);
    try {
      const data = await apiFetch<UserWeeklySlot[]>(`/api/admin/users/${userId}/weekly-missions`);
      setDrillSlots(data ?? []);
    } catch {
      setDrillSlots([]);
    } finally {
      setDrillLoading(false);
    }
  }

  useEffect(() => {
    if (ready) {
      loadOverview();
      loadUsers();
    }
  }, [ready, loadUsers]);

  const completionRate = (row: WeeklyOverviewRow) => {
    if (row.total_slots === 0) return '—';
    return `${Math.round((row.completed / row.total_slots) * 100)}%`;
  };

  // Group drill-down slots by week
  const slotsByWeek = drillSlots.reduce<Record<string, UserWeeklySlot[]>>((acc, s) => {
    if (!acc[s.iso_week]) acc[s.iso_week] = [];
    acc[s.iso_week].push(s);
    return acc;
  }, {});

  if (!ready) return null;

  return (
    <ManageLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Weekly Missions</h1>
        <Button variant="outline" size="sm" onClick={loadOverview}>Refresh</Button>
      </div>

      {error && <p className="text-destructive mb-4">{error}</p>}

      {/* Overview cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {overview.map((row) => (
          <Card key={row.mission_type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{TYPE_LABELS[row.mission_type] ?? row.mission_type}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-2xl font-bold">{row.completed} <span className="text-sm font-normal text-muted-foreground">/ {row.total_slots}</span></p>
              <p className="text-xs text-muted-foreground">Completion rate: <span className="font-medium text-foreground">{completionRate(row)}</span></p>
              {row.in_progress > 0 && <p className="text-xs text-blue-600">{row.in_progress} in progress</p>}
            </CardContent>
          </Card>
        ))}
        {overviewLoading && !overview.length && (
          <p className="col-span-5 text-muted-foreground text-sm">Loading…</p>
        )}
        {!overviewLoading && overview.length === 0 && (
          <p className="col-span-5 text-muted-foreground text-sm">No weekly mission data for the current week.</p>
        )}
      </div>

      {/* User search + drill-down */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Drill Down by User</h2>
          <input
            type="text"
            placeholder="Search username…"
            className="ml-2 px-3 py-1.5 rounded-md border text-sm bg-background w-56"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
        </div>

        {usersLoading && <p className="text-muted-foreground text-sm">Loading users…</p>}

        {!usersLoading && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users
                .filter((u) => !userSearch || u.username?.toLowerCase().includes(userSearch.toLowerCase()))
                .slice(0, 50)
                .map((u) => (
                  <TableRow key={u.userId}>
                    <TableCell className="font-medium">{u.username ?? u.userId}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openDrillDown(u.userId, u.username)}>
                        View Weekly Missions
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-6">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* User drill-down sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Weekly Missions — {drillUsername}</SheetTitle>
          </SheetHeader>

          {drillLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

          {!drillLoading && drillSlots.length === 0 && (
            <p className="text-muted-foreground text-sm">No weekly mission slots found for this user.</p>
          )}

          {!drillLoading && Object.keys(slotsByWeek).sort((a, b) => b.localeCompare(a)).map((week) => (
            <div key={week} className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{formatWeek(week)}</p>
              <div className="rounded-md border divide-y">
                {slotsByWeek[week].map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                    <div>
                      <p className="font-medium">{TYPE_LABELS[slot.mission_type] ?? slot.mission_type}</p>
                      {slot.completed_at && (
                        <p className="text-xs text-muted-foreground">Completed {formatDate(slot.completed_at)}</p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[slot.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {slot.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </SheetContent>
      </Sheet>
    </ManageLayout>
  );
}
