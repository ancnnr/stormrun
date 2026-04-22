import { useEffect, useState, useCallback } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { useManageAuth } from '@/hooks/useManageAuth';
import { apiFetch, seedProfile, simulateMission, SimulateResult } from '@/lib/manageApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  territory_cell_count: number;
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

interface InventoryItem {
  itemId: string;
  name: string;
  category: string;
  rarity: string;
  icon: string | null;
  quantity: number;
  unlocked: boolean;
}

interface UserInventory {
  userId: string;
  username: string;
  gold: number;
  inventory: InventoryItem[];
  loadout: {
    equipmentIds: string[];
    consumableIds: string[];
  };
}

interface CatalogItem {
  id: string;
  name: string;
  category: string;
}

interface AdminMission {
  id: string;
  title: string;
  difficulty: string;
  estimated_distance: number;
  status: string;
}

type SimStatus = 'pending' | 'running' | 'done' | 'error';
interface MissionSimState {
  mission: AdminMission;
  status: SimStatus;
  result?: SimulateResult;
  error?: string;
}

const ROLES = ['user', 'test', 'manager', 'admin'];

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  manager: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  test: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  user: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const RARITY_COLORS: Record<string, string> = {
  common: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  uncommon: 'bg-green-500/20 text-green-400 border-green-500/30',
  rare: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  legendary: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
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

  // Inventory tab state
  const [userInventory, setUserInventory] = useState<UserInventory | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [grantItemId, setGrantItemId] = useState('');
  const [grantQty, setGrantQty] = useState('1');
  const [granting, setGranting] = useState(false);
  const [goldAmount, setGoldAmount] = useState('');
  const [goldReason, setGoldReason] = useState('');
  const [adjustingGold, setAdjustingGold] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Seed Data tab state
  const [seedMissions, setSeedMissions] = useState<AdminMission[]>([]);
  const [seedMissionsLoading, setSeedMissionsLoading] = useState(false);
  const [selectedMissionIds, setSelectedMissionIds] = useState<Set<string>>(new Set());
  const [shelterLat, setShelterLat] = useState('44.6488');
  const [shelterLng, setShelterLng] = useState('-63.5752');
  const [shelterName, setShelterName] = useState('Halifax Downtown');
  const [vitalsAge, setVitalsAge] = useState('28');
  const [vitalsGender, setVitalsGender] = useState('male');
  const [vitalsHeight, setVitalsHeight] = useState('178');
  const [vitalsWeight, setVitalsWeight] = useState('75');
  const [vitalsExperience, setVitalsExperience] = useState('intermediate');
  const [vitalsWeeklyGoal, setVitalsWeeklyGoal] = useState('4');
  const [seedPace, setSeedPace] = useState('6.2');
  const [simStates, setSimStates] = useState<MissionSimState[]>([]);
  const [simRunning, setSimRunning] = useState(false);
  const [applyingProfile, setApplyingProfile] = useState(false);

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
    if (ready) {
      loadUsers(page, search);
      apiFetch<CatalogItem[]>('/api/admin/items').then(setCatalogItems).catch(() => {/* non-fatal */});
    }
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
    setUserInventory(null);
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

  async function loadInventory(userId: string) {
    if (userInventory?.userId === userId) return;
    setInventoryLoading(true);
    try {
      const data = await apiFetch<UserInventory>(`/api/admin/users/${userId}/inventory`);
      setUserInventory(data);
    } catch (e: unknown) {
      toast({ title: 'Error loading inventory', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setInventoryLoading(false);
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

  async function grantItem() {
    if (!selectedUser || !grantItemId) return;
    setGranting(true);
    try {
      await apiFetch(`/api/admin/users/${selectedUser.id}/inventory/grant`, {
        method: 'POST',
        body: JSON.stringify({ item_id: grantItemId, quantity: parseInt(grantQty, 10) || 1 }),
      });
      toast({ title: 'Item granted' });
      setGrantItemId('');
      setGrantQty('1');
      setUserInventory(null); // force reload
      await loadInventory(selectedUser.id);
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Grant failed', variant: 'destructive' });
    } finally {
      setGranting(false);
    }
  }

  async function adjustGold() {
    if (!selectedUser || !goldAmount) return;
    setAdjustingGold(true);
    try {
      const result = await apiFetch<{ previousGold: number; newGold: number }>(`/api/admin/users/${selectedUser.id}/gold`, {
        method: 'PUT',
        body: JSON.stringify({ amount: parseInt(goldAmount, 10), reason: goldReason || null }),
      });
      toast({ title: 'Gold adjusted', description: `${result.previousGold} → ${result.newGold}` });
      setGoldAmount('');
      setGoldReason('');
      setUserInventory((prev) => prev ? { ...prev, gold: result.newGold } : prev);
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Gold adjustment failed', variant: 'destructive' });
    } finally {
      setAdjustingGold(false);
    }
  }

  async function clearInventory() {
    if (!selectedUser) return;
    setClearing(true);
    try {
      await apiFetch(`/api/admin/users/${selectedUser.id}/inventory`, { method: 'DELETE' });
      toast({ title: 'Inventory cleared', description: `${selectedUser.username}'s inventory has been wiped.` });
      setClearConfirmOpen(false);
      setUserInventory(null);
      await loadInventory(selectedUser.id);
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Clear failed', variant: 'destructive' });
    } finally {
      setClearing(false);
    }
  }

  async function loadSeedMissions() {
    if (seedMissions.length > 0) return;
    setSeedMissionsLoading(true);
    try {
      const data = await apiFetch<AdminMission[]>('/api/admin/missions');
      const published = data.filter((m) => m.status === 'published');
      setSeedMissions(published);
      setSelectedMissionIds(new Set(published.map((m) => m.id)));
    } catch (e: unknown) {
      toast({ title: 'Error loading missions', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setSeedMissionsLoading(false);
    }
  }

  function toggleMission(id: string) {
    setSelectedMissionIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function applyProfileSeed() {
    if (!selectedUser) return;
    setApplyingProfile(true);
    try {
      await seedProfile(selectedUser.id, {
        shelter_lat: parseFloat(shelterLat),
        shelter_lng: parseFloat(shelterLng),
        shelter_name: shelterName,
        vitals_age: parseInt(vitalsAge, 10) || undefined,
        vitals_gender: vitalsGender || undefined,
        vitals_height: parseFloat(vitalsHeight) || undefined,
        vitals_weight: parseFloat(vitalsWeight) || undefined,
        vitals_height_unit: 'cm',
        vitals_weight_unit: 'kg',
        vitals_experience_level: vitalsExperience || undefined,
        vitals_weekly_goal: parseInt(vitalsWeeklyGoal, 10) || undefined,
      });
      toast({ title: 'Profile updated', description: `Shelter and vitals set for ${selectedUser.username}` });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Profile update failed', variant: 'destructive' });
    } finally {
      setApplyingProfile(false);
    }
  }

  async function runSimulation() {
    if (!selectedUser || simRunning) return;
    const toSimulate = seedMissions.filter((m) => selectedMissionIds.has(m.id));
    if (toSimulate.length === 0) return;

    const lat = parseFloat(shelterLat);
    const lng = parseFloat(shelterLng);
    const pace = parseFloat(seedPace) || 6.2;

    setSimRunning(true);
    setSimStates(toSimulate.map((m) => ({ mission: m, status: 'pending' })));

    let doneCount = 0;
    let errorCount = 0;

    for (let i = 0; i < toSimulate.length; i++) {
      const mission = toSimulate[i];
      setSimStates((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s));
      try {
        const result = await simulateMission(selectedUser.id, {
          mission_id: mission.id,
          start_lat: lat,
          start_lng: lng,
          seed: i,
          pace_min_per_km: pace,
        });
        setSimStates((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'done', result } : s));
        doneCount++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed';
        setSimStates((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'error', error: msg } : s));
        errorCount++;
      }
    }

    setSimRunning(false);
    toast({
      title: 'Simulation complete',
      description: `${doneCount}/${toSimulate.length} missions completed${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      variant: errorCount > 0 ? 'destructive' : 'default',
    });
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

              <Tabs defaultValue="profile" onValueChange={(v) => {
                if (v === 'inventory' && selectedUser) loadInventory(selectedUser.id);
                if (v === 'seed') loadSeedMissions();
              }}>
                <TabsList className="mb-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="stats">Run Stats</TabsTrigger>
                  <TabsTrigger value="missions">Missions ({userMissions.length})</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  <TabsTrigger value="role">Role</TabsTrigger>
                  {selectedUser.role === 'test' && (
                    <TabsTrigger value="seed">Seed Data</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="profile">
                  <div className="grid grid-cols-2 gap-3">
                    <StatItem label="Level" value={selectedUser.level} />
                    <StatItem label="XP" value={selectedUser.xp.toLocaleString()} />
                    <StatItem label="Health" value={`${selectedUser.health} / ${selectedUser.maxHealth}`} />
                    <StatItem label="Stamina" value={selectedUser.stamina} />
                    <StatItem label="Territory Cells" value={(selectedUser.territory_cell_count ?? 0).toLocaleString()} />
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

                <TabsContent value="inventory">
                  {inventoryLoading && <p className="text-muted-foreground text-sm">Loading inventory…</p>}
                  {!inventoryLoading && userInventory && (
                    <div className="space-y-4">
                      {/* Gold balance */}
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <span className="text-sm font-medium">Gold Balance</span>
                        <span className="text-lg font-bold text-yellow-500">{userInventory.gold.toLocaleString()} G</span>
                      </div>

                      {/* Loadout summary */}
                      {(userInventory.loadout.equipmentIds.length > 0 || userInventory.loadout.consumableIds.length > 0) && (
                        <div className="rounded-md border p-3 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Loadout</p>
                          <p className="text-sm">Equipment: {userInventory.loadout.equipmentIds.join(', ') || 'none'}</p>
                          <p className="text-sm">Consumables: {userInventory.loadout.consumableIds.join(', ') || 'none'}</p>
                        </div>
                      )}

                      {/* Inventory items */}
                      {userInventory.inventory.length > 0 ? (
                        <div className="rounded-md border divide-y">
                          {userInventory.inventory.map((item) => (
                            <div key={item.itemId} className="flex items-center justify-between px-3 py-2 text-sm">
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${RARITY_COLORS[item.rarity] ?? RARITY_COLORS.common}`}>
                                  {item.rarity}
                                </span>
                                {item.quantity > 1 && (
                                  <span className="text-muted-foreground text-xs">×{item.quantity}</span>
                                )}
                                {userInventory.loadout.equipmentIds.includes(item.itemId) && (
                                  <Badge variant="default" className="text-xs">equipped</Badge>
                                )}
                                {userInventory.loadout.consumableIds.includes(item.itemId) && (
                                  <Badge variant="secondary" className="text-xs">in loadout</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No items in inventory.</p>
                      )}

                      {/* Grant item */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Grant Item</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex gap-2 items-end">
                            <div className="flex-1 space-y-1">
                              <label className="text-xs text-muted-foreground">Item</label>
                              <Select value={grantItemId} onValueChange={setGrantItemId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select item…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {catalogItems.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.name}
                                      <span className="ml-1 text-xs text-muted-foreground">({item.category})</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-20 space-y-1">
                              <label className="text-xs text-muted-foreground">Qty</label>
                              <Input type="number" min="1" value={grantQty} onChange={(e) => setGrantQty(e.target.value)} />
                            </div>
                            <Button onClick={grantItem} disabled={granting || !grantItemId}>
                              {granting ? 'Granting…' : 'Grant'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Adjust gold */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Adjust Gold</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex gap-2 items-end">
                            <div className="space-y-1 w-28">
                              <label className="text-xs text-muted-foreground">Amount (+/−)</label>
                              <Input
                                type="number"
                                value={goldAmount}
                                onChange={(e) => setGoldAmount(e.target.value)}
                                placeholder="e.g. 50 or -10"
                              />
                            </div>
                            <div className="flex-1 space-y-1">
                              <label className="text-xs text-muted-foreground">Reason (optional)</label>
                              <Input
                                value={goldReason}
                                onChange={(e) => setGoldReason(e.target.value)}
                                placeholder="e.g. Compensation for bug"
                              />
                            </div>
                            <Button onClick={adjustGold} disabled={adjustingGold || !goldAmount} variant="outline">
                              {adjustingGold ? 'Updating…' : 'Apply'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Danger zone */}
                      <Card className="border-destructive/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Clear Inventory</p>
                              <p className="text-xs text-muted-foreground">Removes all items and resets the loadout.</p>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => setClearConfirmOpen(true)}>
                              Clear
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="seed">
                  <div className="space-y-4">
                    {/* Profile & shelter */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Shelter &amp; Vitals</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Shelter Lat</label>
                            <Input value={shelterLat} onChange={(e) => setShelterLat(e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Shelter Lng</label>
                            <Input value={shelterLng} onChange={(e) => setShelterLng(e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Shelter Name</label>
                          <Input value={shelterName} onChange={(e) => setShelterName(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Age</label>
                            <Input type="number" value={vitalsAge} onChange={(e) => setVitalsAge(e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Gender</label>
                            <Select value={vitalsGender} onValueChange={setVitalsGender}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Weekly Goal</label>
                            <Input type="number" value={vitalsWeeklyGoal} onChange={(e) => setVitalsWeeklyGoal(e.target.value)} />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Height (cm)</label>
                            <Input type="number" value={vitalsHeight} onChange={(e) => setVitalsHeight(e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Weight (kg)</label>
                            <Input type="number" value={vitalsWeight} onChange={(e) => setVitalsWeight(e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Experience</label>
                            <Select value={vitalsExperience} onValueChange={setVitalsExperience}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="walker">Walker</SelectItem>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button onClick={applyProfileSeed} disabled={applyingProfile} className="w-full">
                          {applyingProfile ? 'Applying…' : 'Apply Profile'}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Mission simulation */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Simulate Missions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-end gap-2">
                          <div className="space-y-1 w-36">
                            <label className="text-xs text-muted-foreground">Pace (min/km)</label>
                            <Input type="number" step="0.1" value={seedPace} onChange={(e) => setSeedPace(e.target.value)} />
                          </div>
                          <p className="text-xs text-muted-foreground pb-2">Routes start from the shelter coordinates above.</p>
                        </div>

                        {seedMissionsLoading && <p className="text-sm text-muted-foreground">Loading missions…</p>}

                        {!seedMissionsLoading && seedMissions.length > 0 && (
                          <>
                            <div className="flex gap-2 mb-1">
                              <Button variant="ghost" size="sm" className="text-xs h-7 px-2"
                                onClick={() => setSelectedMissionIds(new Set(seedMissions.map((m) => m.id)))}>
                                Select all
                              </Button>
                              <Button variant="ghost" size="sm" className="text-xs h-7 px-2"
                                onClick={() => setSelectedMissionIds(new Set())}>
                                Clear
                              </Button>
                            </div>
                            <div className="rounded-md border divide-y">
                              {seedMissions.map((m) => (
                                <label key={m.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40">
                                  <Checkbox
                                    checked={selectedMissionIds.has(m.id)}
                                    onCheckedChange={() => toggleMission(m.id)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{m.title}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{m.difficulty} · {m.estimated_distance} km</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                            <Button
                              onClick={runSimulation}
                              disabled={simRunning || selectedMissionIds.size === 0}
                              className="w-full"
                            >
                              {simRunning ? 'Simulating…' : `Simulate ${selectedMissionIds.size} Mission${selectedMissionIds.size !== 1 ? 's' : ''}`}
                            </Button>
                          </>
                        )}

                        {/* Per-mission progress */}
                        {simStates.length > 0 && (
                          <div className="rounded-md border divide-y mt-2">
                            {simStates.map((s, i) => (
                              <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                                <span className="w-4 shrink-0">
                                  {s.status === 'pending' && <span className="text-muted-foreground">○</span>}
                                  {s.status === 'running' && <span className="text-yellow-500 animate-pulse">⟳</span>}
                                  {s.status === 'done' && <span className="text-green-500">✓</span>}
                                  {s.status === 'error' && <span className="text-destructive">✗</span>}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{s.mission.title}</p>
                                  {s.status === 'done' && s.result && (
                                    <p className="text-xs text-muted-foreground">
                                      {s.result.distanceKm.toFixed(2)} km · +{s.result.xpAwarded} XP · +{s.result.goldAwarded}G
                                      {s.result.leveledUp && <span className="ml-1 text-yellow-500 font-medium">↑ Level {s.result.newLevel}</span>}
                                    </p>
                                  )}
                                  {s.status === 'error' && (
                                    <p className="text-xs text-destructive">{s.error}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
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

      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Inventory?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove ALL items from <strong>{selectedUser?.username}</strong>&apos;s inventory and reset their loadout. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={clearInventory}
              disabled={clearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {clearing ? 'Clearing…' : 'Clear Inventory'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
