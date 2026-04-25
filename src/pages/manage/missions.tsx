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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import type { Mission } from '@/types';

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
  /** New structured format; may still be a legacy array on un-migrated rows. */
  loot?: LootConfig | LootEntry[];
}

interface CatalogItem {
  id: string;
  name: string;
  category: string;
}

const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
const MISSION_STATUSES = ['draft', 'active', 'archived'] as const;
const LOCOMOTION_TYPES = ['run', 'walk', 'walk_run'] as const;
const MISSION_TYPES = ['territory_expansion', 'outpost_establishment', 'scouting', 'supply_run', 'story'] as const;
type MissionType = typeof MISSION_TYPES[number];

const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  territory_expansion: 'Territory Expansion',
  outpost_establishment: 'Outpost Establishment',
  scouting: 'Scouting',
  supply_run: 'Supply Run',
  story: 'Story',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-600',
};

const missionSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().default(''),
  difficulty: z.enum(DIFFICULTY_LEVELS, { required_error: 'Difficulty required' }),
  estimated_time: z.coerce.number().int().min(0).default(0),
  estimated_distance: z.coerce.number().min(0).default(0),
  locomotion_type: z.enum(LOCOMOTION_TYPES).nullable().default(null),
  mission_type: z.enum(MISSION_TYPES).nullable().default(null),
  status: z.enum(MISSION_STATUSES).default('draft'),
  is_priority: z.boolean().default(false),
  is_founding_mission: z.boolean().default(false),
  is_repeatable: z.boolean().default(true),
  sort_order: z.coerce.number().default(0),
  min_level: z.coerce.number().int().min(0).nullable().default(null),
  min_territory_cells: z.coerce.number().int().min(0).nullable().default(null),
  prerequisite_mission_id: z.string().nullable().default(null),
  story_season: z.coerce.number().int().min(1).nullable().default(null),
  story_chapter: z.coerce.number().int().min(1).nullable().default(null),
  chapter_summary_template: z.string().nullable().default(null),
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
    form.reset({ title: '', description: '', difficulty: undefined, estimated_time: 0, estimated_distance: 0, locomotion_type: null, mission_type: null, status: 'draft', sort_order: 0, is_priority: false, is_founding_mission: false, is_repeatable: true, min_level: null, min_territory_cells: null, prerequisite_mission_id: null, story_season: null, story_chapter: null, chapter_summary_template: null });
    parseRewards(null);
    setDialogOpen(true);
  }

  function openEdit(m: Mission) {
    setEditing(m);
    const mr = m as unknown as Record<string, unknown>;
    form.reset({
      title: m.title,
      description: m.description ?? '',
      difficulty: DIFFICULTY_LEVELS.includes(m.difficulty as typeof DIFFICULTY_LEVELS[number]) ? m.difficulty as typeof DIFFICULTY_LEVELS[number] : undefined,
      estimated_time: m.estimated_time ? parseInt(m.estimated_time, 10) || 0 : 0,
      estimated_distance: m.estimated_distance ?? 0,
      locomotion_type: LOCOMOTION_TYPES.includes(m.locomotion_type as typeof LOCOMOTION_TYPES[number]) ? m.locomotion_type as typeof LOCOMOTION_TYPES[number] : null,
      mission_type: MISSION_TYPES.includes(mr.mission_type as MissionType) ? mr.mission_type as MissionType : null,
      status: MISSION_STATUSES.includes(m.status as typeof MISSION_STATUSES[number]) ? m.status as typeof MISSION_STATUSES[number] : 'draft',
      is_priority: m.is_priority,
      is_founding_mission: mr.is_founding_mission as boolean ?? false,
      is_repeatable: mr.is_repeatable as boolean ?? true,
      sort_order: m.sort_order,
      min_level: mr.min_level as number | null ?? null,
      min_territory_cells: mr.min_territory_cells as number | null ?? null,
      prerequisite_mission_id: mr.prerequisite_mission_id as string | null ?? null,
      story_season: mr.story_season as number | null ?? null,
      story_chapter: mr.story_chapter as number | null ?? null,
      chapter_summary_template: mr.chapter_summary_template as string | null ?? null,
    });
    parseRewards(m.rewards as MissionRewards | null);
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
        estimated_time: `${values.estimated_time} min`,
        min_level: values.min_level ?? null,
        min_territory_cells: values.min_territory_cells ?? null,
        prerequisite_mission_id: values.prerequisite_mission_id ?? null,
        rewards: {
          xp: parseInt(rewardsXp, 10) || 0,
          gold: parseInt(rewardsGold, 10) || 0,
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
              <TableHead>Status</TableHead>
              <TableHead>Gating</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {missions.map((m) => {
              const mr = m as unknown as Record<string, unknown>;
              const isFoundingMission = mr.is_founding_mission as boolean;
              const minLevel = mr.min_level as number | null;
              const minCells = mr.min_territory_cells as number | null;
              const gatingParts: string[] = [];
              if (minLevel) gatingParts.push(`Lvl ${minLevel}`);
              if (minCells) gatingParts.push(`${minCells} cells`);
              return (
              <TableRow key={m.id}>
                <TableCell className="font-medium">
                  <span>{m.title}</span>
                  {isFoundingMission && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">FOUNDING</span>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {mr.mission_type
                    ? <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-medium capitalize">{String(mr.mission_type).replace('_', ' ')}</span>
                    : <span className="text-muted-foreground">{m.locomotion_type?.replace('_', ' / ') ?? '—'}</span>
                  }
                </TableCell>
                <TableCell className="capitalize">{m.difficulty}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[m.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {m.status}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {gatingParts.length > 0 ? gatingParts.join(' · ') : '—'}
                </TableCell>
                <TableCell>{m.sort_order}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(m)}>Edit</Button>
                  <Link href={`/manage/mission-audio?id=${m.id}`}>
                    <Button variant="outline" size="sm">Audio</Button>
                  </Link>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(m)}>Delete</Button>
                </TableCell>
              </TableRow>
              );
            })}
            {missions.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">No missions yet.</TableCell>
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
                    <FormField control={form.control} name="mission_type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mission Type</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(v === '_none' ? null : v)}
                          value={field.value ?? '_none'}
                        >
                          <FormControl><SelectTrigger><SelectValue placeholder="General" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="_none">General</SelectItem>
                            {MISSION_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>{MISSION_TYPE_LABELS[t]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="difficulty" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {DIFFICULTY_LEVELS.map((d) => (
                              <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {MISSION_STATUSES.map((s) => (
                              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="locomotion_type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Locomotion Type</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(v === '_none' ? null : v)}
                          value={field.value ?? '_none'}
                        >
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="_none">None</SelectItem>
                            <SelectItem value="run">Run</SelectItem>
                            <SelectItem value="walk">Walk</SelectItem>
                            <SelectItem value="walk_run">Walk / Run</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="estimated_time" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Est. Time (min)</FormLabel>
                        <FormControl><Input type="number" min="0" placeholder="e.g. 30" {...field} value={field.value ?? ''} /></FormControl>
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
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0">Priority</FormLabel>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="is_founding_mission" render={({ field }) => (
                      <FormItem className="flex items-center gap-2 pt-6">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0">Founding Mission</FormLabel>
                      </FormItem>
                    )} />
                    {form.watch('mission_type') !== 'story' && (
                      <FormField control={form.control} name="is_repeatable" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 pt-6">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="!mt-0">Repeatable</FormLabel>
                        </FormItem>
                      )} />
                    )}
                  </div>

                  {/* ── Story Fields ────────────────────────────────────────── */}
                  {form.watch('mission_type') === 'story' && (
                    <div className="mt-4 rounded-md border p-3 space-y-3 border-amber-500/40 bg-amber-500/5">
                      <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Story Chapter Fields</p>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="story_season" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Season</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" placeholder="1" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="story_chapter" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chapter</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" placeholder="1" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="chapter_summary_template" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chapter Summary Template</FormLabel>
                          <FormControl>
                            <Textarea rows={3} placeholder="Summary shown after completion. Use {distance} and {time} as placeholders." {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  )}

                  {/* ── Progression Gating ────────────────────────────────── */}
                  <div className="mt-4 rounded-md border p-3 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Progression Gating</p>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="min_level" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Level</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" placeholder="None" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      {form.watch('mission_type') !== 'story' && (
                        <FormField control={form.control} name="min_territory_cells" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Min Territory Cells</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="None" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}
                    </div>
                    <FormField control={form.control} name="prerequisite_mission_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prerequisite Mission</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(v === '_none' ? null : v)}
                          value={field.value ?? '_none'}
                        >
                          <FormControl><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="_none">None</SelectItem>
                            {missions
                              .filter((m) => m.id !== editing?.id)
                              .map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Description / Narrative</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder={form.watch('mission_type') === 'story' ? 'Immersive mission briefing text shown to the runner…' : 'Mission description…'} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
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
