import { useEffect, useState, useCallback } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { useManageAuth } from '@/hooks/useManageAuth';
import { apiFetch } from '@/lib/manageApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface UserRow {
  id: string;
  username: string;
  role: string;
  level: number;
  xp: number;
  totalRuns: number;
  totalDistance: number;
  averagePace: number;
  missionsComplete: number;
  lastRunDate: string | null;
  createdAt: string;
}

interface UserDetail {
  id: string;
  username: string;
  role: string;
  level: number;
  xp: number;
  health: number;
  maxHealth: number;
  stamina: number;
  territory: number;
  factionInfluence: number;
  shelterName: string | null;
  createdAt: string;
  stats: {
    totalRuns: number;
    totalDistance: number;
    totalTime: number;
    averagePace: number;
    missionsComplete: number;
    currentStreak: number;
    longestStreak: number;
    topDistance: number;
    lastRunDate: string | null;
    safeTerritory: number;
  };
}

interface UserMission {
  missionId: string;
  missionTitle: string;
  difficulty: string | null;
  status: string;
  distanceKm: number | null;
  timeSeconds: number | null;
  paceMinPerKm: number | null;
  completedAt: string | null;
}

const ROLES = ['user', 'test', 'manager', 'admin'];

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  manager: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  test: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  user: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

function formatDistance(km: number): string {
  return km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(km * 1000)} m`;
}

function formatPace(paceMinPerKm: number): string {
  if (!paceMinPerKm) return '—';
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function UsersPage() {
  const { ready } = useManageAuth();
  const { toast } = useToast();

  // List state
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const LIMIT = 50;

  // Detail state
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [userMissions, setUserMissions] = useState<UserMission[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  const loadUsers = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (q) params.set('search', q);
      const data = await apiFetch<{ users: UserRow[]; total: number; page: number }>(`/api/admin/users?${params}`);
      setUsers(data.users);
      setTotal(data.total);
    } catch (e: unknown) {
      toast({ title: 'Error loading users', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (ready) loadUsers(page, search);
  }, [ready, page, search, loadUsers]);

  function handleSearch() {
    setPage(1);
    setSearch(searchInput);
  }

  function handleSearchKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
  }

  async function openDetail(user: UserRow) {
    setSheetOpen(true);
    setDetailLoading(true);
    setUserMissions([]);
    try {
      const [detail, missions] = await Promise.all([
        apiFetch<UserDetail>(`/api/admin/users/${user.id}`),
        apiFetch<UserMission[]>(`/api/admin/users/${user.id}/missions`),
      ]);
      setSelectedUser(detail);
      setUserMissions(missions);
    } catch (e: unknown) {
      toast({ title: 'Error loading user', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
      setSheetOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  async function updateRole(newRole: string) {
    if (!selectedUser) return;
    setUpdatingRole(true);
    try {
      await apiFetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      setSelectedUser({ ...selectedUser, role: newRole });
      setUsers(users.map((u) => u.id === selectedUser.id ? { ...u, role: newRole } : u));
      toast({ title: 'Role updated', description: `${selectedUser.username} is now ${newRole}` });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Role update failed', variant: 'destructive' });
    } finally {
      setUpdatingRole(false);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  if (!ready) return null;

  return (
    <ManageLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <span className="text-sm text-muted-foreground">{total} total</span>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search by username…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKey}
          className="max-w-xs"
        />
        <Button variant="outline" onClick={handleSearch}>Search</Button>
        {search && (
          <Button variant="ghost" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}>Clear</Button>
        )}
      </div>

      {loading && <p className="text-muted-foreground">Loading…</p>}

      {!loading && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Runs</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Missions</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(u)}>
                  <TableCell className="font-medium">{u.username ?? '—'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${ROLE_COLORS[u.role] ?? ROLE_COLORS.user}`}>
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell>{u.level}</TableCell>
                  <TableCell>{u.totalRuns}</TableCell>
                  <TableCell>{u.totalDistance > 0 ? formatDistance(u.totalDistance) : '—'}</TableCell>
                  <TableCell>{u.missionsComplete}</TableCell>
                  <TableCell>{formatDate(u.lastRunDate)}</TableCell>
                  <TableCell>{formatDate(u.createdAt)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    {search ? `No users matching "${search}"` : 'No users yet.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} users)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {detailLoading && <p className="text-muted-foreground mt-8 text-center">Loading…</p>}

          {selectedUser && !detailLoading && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-3">
                  <SheetTitle className="text-xl">{selectedUser.username}</SheetTitle>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${ROLE_COLORS[selectedUser.role] ?? ROLE_COLORS.user}`}>
                    {selectedUser.role}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Joined {formatDate(selectedUser.createdAt)}</p>
              </SheetHeader>

              <Tabs defaultValue="profile">
                <TabsList className="mb-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="stats">Run Stats</TabsTrigger>
                  <TabsTrigger value="missions">Missions ({userMissions.length})</TabsTrigger>
                  <TabsTrigger value="role">Role</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                  <div className="grid grid-cols-2 gap-3">
                    <StatItem label="Level" value={selectedUser.level} />
                    <StatItem label="XP" value={selectedUser.xp.toLocaleString()} />
                    <StatItem label="Health" value={`${selectedUser.health} / ${selectedUser.maxHealth}`} />
                    <StatItem label="Stamina" value={selectedUser.stamina} />
                    <StatItem label="Territory" value={`${selectedUser.territory.toFixed(1)} km²`} />
                    <StatItem label="Faction Influence" value={selectedUser.factionInfluence} />
                    {selectedUser.shelterName && (
                      <StatItem label="Shelter" value={selectedUser.shelterName} className="col-span-2" />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="stats">
                  <div className="grid grid-cols-2 gap-3">
                    <StatItem label="Total Runs" value={selectedUser.stats.totalRuns} />
                    <StatItem label="Total Distance" value={formatDistance(selectedUser.stats.totalDistance)} />
                    <StatItem label="Total Time" value={selectedUser.stats.totalTime > 0 ? formatTime(selectedUser.stats.totalTime) : '—'} />
                    <StatItem label="Avg Pace" value={formatPace(selectedUser.stats.averagePace)} />
                    <StatItem label="Missions Complete" value={selectedUser.stats.missionsComplete} />
                    <StatItem label="Current Streak" value={`${selectedUser.stats.currentStreak} days`} />
                    <StatItem label="Longest Streak" value={`${selectedUser.stats.longestStreak} days`} />
                    <StatItem label="Top Distance" value={formatDistance(selectedUser.stats.topDistance)} />
                    <StatItem label="Safe Territory" value={`${selectedUser.stats.safeTerritory.toFixed(1)} km²`} />
                    <StatItem label="Last Run" value={formatDate(selectedUser.stats.lastRunDate)} />
                  </div>
                </TabsContent>

                <TabsContent value="missions">
                  {userMissions.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No missions completed yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {userMissions.map((m, i) => (
                        <div key={i} className="rounded-md border p-3 text-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{m.missionTitle}</p>
                              {m.difficulty && (
                                <p className="text-xs text-muted-foreground capitalize">{m.difficulty}</p>
                              )}
                            </div>
                            <Badge variant={m.status === 'completed' ? 'default' : 'secondary'} className="shrink-0">
                              {m.status}
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-muted-foreground">
                            {m.distanceKm != null && <span>{formatDistance(m.distanceKm)}</span>}
                            {m.timeSeconds != null && <span>{formatTime(m.timeSeconds)}</span>}
                            {m.paceMinPerKm != null && <span>{formatPace(m.paceMinPerKm)}</span>}
                          </div>
                          {m.completedAt && (
                            <p className="mt-1 text-xs text-muted-foreground">{formatDate(m.completedAt)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="role">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Change Role</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Current role: <strong>{selectedUser.role}</strong>
                      </p>
                      <div className="flex items-center gap-3">
                        <Select
                          defaultValue={selectedUser.role}
                          onValueChange={updateRole}
                          disabled={updatingRole}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {updatingRole && <span className="text-sm text-muted-foreground">Updating…</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <strong>user</strong> — standard player &nbsp;·&nbsp;
                        <strong>test</strong> — internal tester &nbsp;·&nbsp;
                        <strong>manager</strong> — admin dashboard access &nbsp;·&nbsp;
                        <strong>admin</strong> — full access
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </ManageLayout>
  );
}

function StatItem({ label, value, className }: { label: string; value: string | number; className?: string }) {
  return (
    <div className={`rounded-md border p-3 ${className ?? ''}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
