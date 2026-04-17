import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { useManageAuth } from '@/hooks/useManageAuth';
import { apiFetch } from '@/lib/manageApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

interface Mission {
  id: string;
  type: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  estimated_time: string | null;
  estimated_distance: number | null;
  is_priority: boolean;
  sort_order: number;
  rewards: MissionRewards | null;
  created_at: string;
}

type LootMode = 'specific' | 'random';
type LootRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

interface LootEntry {
  id: string;
  quantity: number;
}

interface LootConfig {
  mode: LootMode;
  items?: LootEntry[];
  weights?: Partial<Record<LootRarity, number>>;
  types?: string[];
}

interface MissionRewards {
  xp?: number;
  gold?: number;
  territory?: number;
  /** New structured format; may still be a legacy array on un-migrated rows. */
  loot?: LootConfig | LootEntry[];
}

interface CatalogItem {
  id: string;
  name: string;
  category: string;
}

const missionSchema = z.object({
  type: z.string().min(1, 'Type required'),
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  difficulty: z.string().optional(),
  estimated_time: z.string().optional(),
  estimated_distance: z.coerce.number().optional(),
  is_priority: z.boolean().default(false),
  sort_order: z.coerce.number().default(0),
});
type MissionForm = z.infer<typeof missionSchema>;

export default function MissionsPage() {
  const { ready } = useManageAuth();
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Mission | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Mission | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Rewards state (managed outside react-hook-form due to nested complexity)
  const [rewardsXp, setRewardsXp] = useState('0');
  const [rewardsGold, setRewardsGold] = useState('0');
  const [rewardsTerritory, setRewardsTerritory] = useState('0');

  // Loot config state
  const [lootMode, setLootMode] = useState<LootMode>('specific');
  // Specific mode
  const [specificItems, setSpecificItems] = useState<LootEntry[]>([]);
  const [newLootItemId, setNewLootItemId] = useState('');
  const [newLootQty, setNewLootQty] = useState('1');
  // Random mode
  const [lootTypes, setLootTypes] = useState<string[]>(['equipment']);
  const [lootWeights, setLootWeights] = useState<Record<LootRarity, string>>({
    common: '50', uncommon: '30', rare: '15', epic: '4', legendary: '1',
  });

  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);

  const form = useForm<MissionForm>({ resolver: zodResolver(missionSchema) });

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Mission[]>('/api/admin/missions');
      setMissions(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load missions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) {
      load();
      apiFetch<CatalogItem[]>('/api/admin/items')
        .then(setCatalogItems)
        .catch(() => {/* non-fatal */});
    }
  }, [ready]);

  const RARITY_KEYS: LootRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

  function parseRewards(rewards: MissionRewards | null) {
    setRewardsXp(String(rewards?.xp ?? 0));
    setRewardsGold(String(rewards?.gold ?? 0));
    setRewardsTerritory(String(rewards?.territory ?? 0));

    const loot = rewards?.loot;
    if (!loot) {
      setLootMode('specific');
      setSpecificItems([]);
      return;
    }
    // Legacy flat array → treat as specific
    if (Array.isArray(loot)) {
      setLootMode('specific');
      setSpecificItems(loot);
      return;
    }
    // Structured format
    setLootMode(loot.mode || 'specific');
    if (loot.mode === 'random') {
      setLootTypes(loot.types ?? ['equipment']);
      const w = loot.weights ?? {};
      setLootWeights({
        common:    String(w.common    ?? 50),
        uncommon:  String(w.uncommon  ?? 30),
        rare:      String(w.rare      ?? 15),
        epic:      String(w.epic      ?? 4),
        legendary: String(w.legendary ?? 1),
      });
      setSpecificItems([]);
    } else {
      setSpecificItems(loot.items ?? []);
    }
  }

  function openCreate() {
    setEditing(null);
    form.reset({ type: '', title: '', description: '', difficulty: '', estimated_time: '', sort_order: 0, is_priority: false });
    parseRewards(null);
    setDialogOpen(true);
  }

  function openEdit(m: Mission) {
    setEditing(m);
    form.reset({
      type: m.type,
      title: m.title,
      description: m.description ?? '',
      difficulty: m.difficulty ?? '',
      estimated_time: m.estimated_time ?? '',
      estimated_distance: m.estimated_distance ?? undefined,
      is_priority: m.is_priority,
      sort_order: m.sort_order,
    });
    parseRewards(m.rewards);
    setDialogOpen(true);
  }

  function addLootEntry() {
    if (!newLootItemId) return;
    const qty = parseInt(newLootQty, 10) || 1;
    setSpecificItems((prev) => {
      const existing = prev.find((l) => l.id === newLootItemId);
      if (existing) {
        return prev.map((l) => l.id === newLootItemId ? { ...l, quantity: l.quantity + qty } : l);
      }
      return [...prev, { id: newLootItemId, quantity: qty }];
    });
    setNewLootItemId('');
    setNewLootQty('1');
  }

  function removeLootEntry(itemId: string) {
    setSpecificItems((prev) => prev.filter((l) => l.id !== itemId));
  }

  function toggleLootType(type: string) {
    setLootTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function onSubmit(values: MissionForm) {
    setSaving(true);
    try {
      const loot: LootConfig =
        lootMode === 'random'
          ? {
              mode: 'random',
              types: lootTypes,
              weights: {
                common:    parseInt(lootWeights.common, 10)    || 0,
                uncommon:  parseInt(lootWeights.uncommon, 10)  || 0,
                rare:      parseInt(lootWeights.rare, 10)      || 0,
                epic:      parseInt(lootWeights.epic, 10)      || 0,
                legendary: parseInt(lootWeights.legendary, 10) || 0,
              },
            }
          : { mode: 'specific', items: specificItems };

      const payload = {
        ...values,
        rewards: {
          xp: parseInt(rewardsXp, 10) || 0,
          gold: parseInt(rewardsGold, 10) || 0,
          territory: parseFloat(rewardsTerritory) || 0,
          loot,
        },
      };

      if (editing) {
        await apiFetch(`/api/admin/missions/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast({ title: 'Mission updated' });
      } else {
        await apiFetch('/api/admin/missions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast({ title: 'Mission created' });
      }
      setDialogOpen(false);
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/missions/${deleteTarget.id}`, { method: 'DELETE' });
      toast({ title: 'Mission deleted', description: deleteTarget.title });
      setDeleteTarget(null);
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Delete failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  }

  if (!ready) return null;

  return (
    <ManageLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Missions</h1>
        <Button onClick={openCreate}>+ Create Mission</Button>
      </div>

      {error && <p className="text-destructive mb-4">{error}</p>}
      {loading && <p className="text-muted-foreground">Loading…</p>}

      {!loading && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {missions.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.title}</TableCell>
                <TableCell>{m.type}</TableCell>
                <TableCell>{m.difficulty ?? '—'}</TableCell>
                <TableCell>{m.sort_order}</TableCell>
                <TableCell>{m.is_priority ? 'Yes' : 'No'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(m)}>Edit</Button>
                  <Link href={`/manage/mission-audio?id=${m.id}`}>
                    <Button variant="outline" size="sm">Audio</Button>
                  </Link>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(m)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {missions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">No missions yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Mission' : 'Create Mission'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="rewards">Rewards</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Title</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="difficulty" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="estimated_time" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Est. Time</FormLabel>
                        <FormControl><Input placeholder="e.g. 30 min" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="estimated_distance" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Est. Distance (km)</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="sort_order" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="is_priority" render={({ field }) => (
                      <FormItem className="flex items-center gap-2 pt-6">
                        <FormControl>
                          <input type="checkbox" checked={field.value} onChange={field.onChange} className="w-4 h-4" />
                        </FormControl>
                        <FormLabel className="!mt-0">Priority</FormLabel>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <textarea {...field} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </TabsContent>

                <TabsContent value="rewards" className="pt-3 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">XP</label>
                      <Input type="number" min="0" value={rewardsXp} onChange={(e) => setRewardsXp(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Gold</label>
                      <Input type="number" min="0" value={rewardsGold} onChange={(e) => setRewardsGold(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Territory (km²)</label>
                      <Input type="number" min="0" step="0.1" value={rewardsTerritory} onChange={(e) => setRewardsTerritory(e.target.value)} />
                    </div>
                  </div>

                  {/* ── Completion Loot ─────────────────────────────────────── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Completion Loot</label>
                      <p className="text-xs text-muted-foreground">Awarded when the mission is completed. Route pickups (consumables) are separate.</p>
                    </div>

                    {/* Mode selector */}
                    <div className="flex gap-2">
                      {(['specific', 'random'] as LootMode[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setLootMode(m)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                            lootMode === m
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground border-input hover:text-foreground'
                          }`}
                        >
                          {m === 'specific' ? 'Specific Items' : 'Random (1 item)'}
                        </button>
                      ))}
                    </div>

                    {lootMode === 'specific' && (
                      <div className="space-y-2">
                        {specificItems.length > 0 && (
                          <div className="rounded-md border divide-y">
                            {specificItems.map((entry) => {
                              const item = catalogItems.find((i) => i.id === entry.id);
                              return (
                                <div key={entry.id} className="flex items-center justify-between px-3 py-2 text-sm">
                                  <span className="font-medium">{item?.name ?? entry.id}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-muted-foreground">×{entry.quantity}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                                      onClick={() => removeLootEntry(entry.id)}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex gap-2 items-end">
                          <div className="flex-1 space-y-1">
                            <label className="text-xs text-muted-foreground">Item</label>
                            <Select value={newLootItemId} onValueChange={setNewLootItemId}>
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
                            <Input type="number" min="1" value={newLootQty} onChange={(e) => setNewLootQty(e.target.value)} />
                          </div>
                          <Button type="button" variant="outline" onClick={addLootEntry} disabled={!newLootItemId}>
                            Add
                          </Button>
                        </div>
                        {catalogItems.length === 0 && (
                          <p className="text-xs text-muted-foreground">No items in catalog. Add items first via the Item Catalog page.</p>
                        )}
                      </div>
                    )}

                    {lootMode === 'random' && (
                      <div className="space-y-4">
                        {/* Item type checkboxes */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Item Types</label>
                          <div className="flex gap-4">
                            {(['equipment', 'consumable'] as const).map((type) => (
                              <label key={type} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={lootTypes.includes(type)}
                                  onChange={() => toggleLootType(type)}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm capitalize">{type}</span>
                              </label>
                            ))}
                          </div>
                          {lootTypes.length === 0 && (
                            <p className="text-xs text-destructive">Select at least one item type.</p>
                          )}
                        </div>

                        {/* Rarity weight inputs */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rarity Weights (%)</label>
                          <div className="grid grid-cols-5 gap-2">
                            {RARITY_KEYS.map((rarity) => (
                              <div key={rarity} className="space-y-1">
                                <label className="text-xs text-muted-foreground capitalize">{rarity}</label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={lootWeights[rarity]}
                                  onChange={(e) => setLootWeights((prev) => ({ ...prev, [rarity]: e.target.value }))}
                                />
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Total:{' '}
                            <span className={
                              RARITY_KEYS.reduce((s, r) => s + (parseInt(lootWeights[r], 10) || 0), 0) === 100
                                ? 'text-green-600'
                                : 'text-destructive'
                            }>
                              {RARITY_KEYS.reduce((s, r) => s + (parseInt(lootWeights[r], 10) || 0), 0)}%
                            </span>
                            {' '}(should equal 100%)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mission?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteTarget?.title}&quot; and all its audio events. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ManageLayout>
  );
}
